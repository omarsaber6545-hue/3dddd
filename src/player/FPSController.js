import * as THREE from 'three';

/**
 * First-Person Horror Player Controller
 * Handles Pointer Lock look, WASD movement, crouching, head bobbing,
 * collision detection, floor stair climbing, and raycast interactions.
 */
export class FPSController {
  constructor(camera, domElement, audioEngine, lightingManager, hospitalData) {
    this.camera = camera;
    this.domElement = domElement;
    this.audio = audioEngine;
    this.lighting = lightingManager;
    this.hospitalData = hospitalData;

    // Movement states
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isSprinting = false;
    this.isCrouching = false;
    this.isLocked = false;
    this.freeCam = false;

    // Player physical dimensions
    this.standHeight = 1.72;
    this.crouchHeight = 1.15;
    this.currentEyeHeight = this.standHeight;
    this.playerRadius = 0.38;

    // Speeds (meters/sec)
    this.walkSpeed = 3.2;
    this.sprintSpeed = 5.6;
    this.crouchSpeed = 1.8;

    // Rotation Euler & Sensitivity
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.mouseSensitivity = 0.0022;

    // Position & Velocity
    this.position = new THREE.Vector3(0, 0, -12); // Start at Reception Hall
    this.velocity = new THREE.Vector3();
    this.targetY = 0;
    this.currentFloor = 0;

    // Head bobbing & Footsteps
    this.bobTimer = 0;
    this.stepDistance = 0;
    this.footstepInterval = 1.8; // meters per footstep

    // Interaction Raycaster
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 3.2;
    this.currentInteractable = null;

    // UI Element caches
    this.crosshair = document.getElementById('crosshair');
    this.interactionPrompt = document.getElementById('interaction-prompt');
    this.interactionText = document.getElementById('interaction-text');
    this.subtitlesPanel = document.getElementById('story-subtitles');
    this.subtitlesText = document.getElementById('subtitles-text');
    this.floorDisplay = document.getElementById('floor-display');
    this.roomDisplay = document.getElementById('room-display');
    this.heartRateDisplay = document.getElementById('heart-rate');
    this.powerStatusDisplay = document.getElementById('power-status');
    this.batteryFill = document.getElementById('battery-fill');

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse look
    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;

      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      this.euler.y -= movementX * this.mouseSensitivity;
      this.euler.x -= movementY * this.mouseSensitivity;

      // Clamp vertical pitch to avoid backflips
      this.euler.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.euler.x));
      this.camera.quaternion.setFromEuler(this.euler);
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  onKeyDown(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isSprinting = true;
        break;
      case 'KeyC':
      case 'ControlLeft':
        this.isCrouching = !this.isCrouching;
        break;
      case 'KeyF':
        this.toggleFlashlight();
        break;
      case 'KeyE':
        this.interact();
        break;
      case 'KeyM':
        this.toggleMap();
        break;
      case 'KeyN':
        this.freeCam = !this.freeCam;
        this.showSubtitles(this.freeCam ? 'SPECTATOR CAMERA ENABLED [N]' : 'FIRST PERSON MODE RESTORED', 2000);
        break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isSprinting = false;
        break;
    }
  }

  lockPointer() {
    try {
      const res = this.domElement.requestPointerLock?.();
      if (res && typeof res.catch === 'function') {
        res.catch((err) => {
          console.warn('Pointer lock request was blocked or cancelled:', err);
        });
      }
    } catch (e) {
      console.warn('Pointer lock failed:', e);
    }
    this.isLocked = true;
  }

  unlockPointer() {
    try {
      document.exitPointerLock?.();
    } catch (e) {
      console.warn('Exit pointer lock error:', e);
    }
    this.isLocked = false;
  }

  toggleFlashlight() {
    const active = this.lighting.toggleFlashlight();
    this.audio.playFlashlightClick();
    const statusEl = document.getElementById('flashlight-status');
    if (statusEl) {
      statusEl.textContent = active ? 'ACTIVE [F]' : 'OFF [F]';
      statusEl.className = active ? 'status-on' : 'status-off';
    }
  }

  toggleMap() {
    const modal = document.getElementById('map-modal');
    if (!modal) return;
    const isHidden = modal.classList.contains('hidden');
    if (isHidden) {
      modal.classList.remove('hidden');
      this.renderBlueprintMap();
    } else {
      modal.classList.add('hidden');
    }
  }

  interact() {
    if (!this.currentInteractable) return;

    const item = this.currentInteractable;
    const type = item.userData.type;

    if (type === 'door') {
      // Toggle door
      item.userData.isOpen = !item.userData.isOpen;
      item.userData.targetAngle = item.userData.isOpen ? -Math.PI * 0.45 : 0;
      this.audio.playDoorCreak();
      this.showSubtitles(item.userData.isOpen ? 'Opened hospital door' : 'Closed hospital door', 1800);
    } else if (type === 'generator') {
      if (!item.userData.isActivated) {
        item.userData.isActivated = true;
        this.audio.startGeneratorRumble();
        this.lighting.restoreEmergencyPower();

        // Pull breaker lever animation
        if (item.userData.lever) {
          item.userData.lever.rotation.x = -Math.PI * 0.4;
        }

        if (this.powerStatusDisplay) {
          this.powerStatusDisplay.textContent = 'ONLINE (AUX)';
          this.powerStatusDisplay.className = 'val text-online';
        }

        this.showSubtitles('AUXILIARY DIESEL GENERATOR STARTED - EMERGENCY GRIDS POWERED', 3500);
      } else {
        this.showSubtitles('Generator is humming steadily at 1200 RPM.', 2000);
      }
    } else if (type === 'xray') {
      this.showSubtitles('EXAMINING RADIOGRAPH: Severe thoracic trauma. Case dated Oct 1984.', 3200);
    } else if (type === 'elevator') {
      // Elevator floor switcher
      if (this.currentFloor === 0) {
        this.transitionFloor(1);
      } else if (this.currentFloor === 1) {
        this.transitionFloor(-1);
      } else {
        this.transitionFloor(0);
      }
    }
  }

  transitionFloor(targetFloor) {
    this.currentFloor = targetFloor;
    const targetY = targetFloor * 4.0;
    this.position.set(2.0, targetY, 36.0); // Place in front of elevator on new floor

    const floorNames = {
      '-1': 'BASEMENT: MORGUE & POWER PLANT',
      '0': 'GROUND FLOOR: RECEPTION & ER',
      '1': '1ST FLOOR: SURGERY & ICU'
    };

    this.showSubtitles(`ELEVATOR TRANSITIONED TO ${floorNames[targetFloor]}`, 3000);
  }

  showSubtitles(text, duration = 2500) {
    if (!this.subtitlesPanel || !this.subtitlesText) return;
    this.subtitlesText.textContent = text;
    this.subtitlesPanel.classList.remove('hidden');

    if (this.subtitleTimer) clearTimeout(this.subtitleTimer);
    this.subtitleTimer = setTimeout(() => {
      this.subtitlesPanel.classList.add('hidden');
    }, duration);
  }

  update(delta, time) {
    // 1. Smooth eye height crouch interpolation
    const targetEyeH = this.isCrouching ? this.crouchHeight : this.standHeight;
    this.currentEyeHeight += (targetEyeH - this.currentEyeHeight) * Math.min(1.0, delta * 8.0);

    // 2. Movement input calculation
    const moveVector = new THREE.Vector3();
    if (this.moveForward) moveVector.z -= 1;
    if (this.moveBackward) moveVector.z += 1;
    if (this.moveLeft) moveVector.x -= 1;
    if (this.moveRight) moveVector.x += 1;

    const isMoving = moveVector.lengthSq() > 0;
    if (isMoving) moveVector.normalize();

    // Determine current speed
    let speed = this.walkSpeed;
    if (this.isCrouching) speed = this.crouchSpeed;
    else if (this.isSprinting) speed = this.sprintSpeed;

    // Transform move vector by camera horizontal yaw
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, this.euler.y, 0));
    const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, this.euler.y, 0));

    const desireVel = new THREE.Vector3()
      .addScaledVector(forward, -moveVector.z * speed)
      .addScaledVector(right, moveVector.x * speed);

    // Inertial smoothing
    this.velocity.lerp(desireVel, Math.min(1.0, delta * 12.0));

    // 3. Collision Detection & Wall Sliding
    const oldPos = this.position.clone();
    const newPos = oldPos.clone().addScaledVector(this.velocity, delta);

    if (!this.freeCam) {
      this.resolveCollisions(newPos, oldPos);
      this.resolveFloorStairs(newPos);
    } else {
      // Spectator flight
      if (this.moveForward) newPos.y += this.velocity.z * -0.4 * delta;
    }

    this.position.copy(newPos);

    // 4. Head Bobbing & Footsteps
    let bobOffset = 0;
    if (isMoving && !this.freeCam) {
      const bobFreq = this.isSprinting ? 14 : 9;
      const bobAmp = this.isSprinting ? 0.055 : 0.028;
      this.bobTimer += delta * bobFreq;
      bobOffset = Math.sin(this.bobTimer) * bobAmp;

      // Track distance for footstep audio
      const moveDist = this.velocity.length() * delta;
      this.stepDistance += moveDist;
      const interval = this.isSprinting ? 1.4 : 2.0;

      if (this.stepDistance >= interval) {
        this.stepDistance = 0;
        const isConcrete = this.position.y < -1.0;
        this.audio.playFootstep(this.isSprinting, isConcrete);
      }
    }

    // Camera position
    this.camera.position.set(
      this.position.x,
      this.position.y + this.currentEyeHeight + bobOffset,
      this.position.z
    );

    // 5. Update Interactive Doors Smooth Animation
    for (const item of this.hospitalData.interactables) {
      if (item.userData && item.userData.type === 'door') {
        const diff = item.userData.targetAngle - item.rotation.y;
        if (Math.abs(diff) > 0.01) {
          item.rotation.y += diff * Math.min(1.0, delta * 6.0);
        }
      }
    }

    // 6. Raycast Interaction Checks
    this.updateInteractionRaycast();

    // 7. Update Room Detection HUD
    this.updateLocationHUD();
  }

  resolveCollisions(newPos, oldPos) {
    const colliders = this.hospitalData.colliders;
    const r = this.playerRadius;

    // Test along X then along Z to allow smooth sliding against walls
    // Test X
    const playerBoxX = new THREE.Box3(
      new THREE.Vector3(newPos.x - r, newPos.y, oldPos.z - r),
      new THREE.Vector3(newPos.x + r, newPos.y + 2.0, oldPos.z + r)
    );

    for (const box of colliders) {
      if (playerBoxX.intersectsBox(box)) {
        newPos.x = oldPos.x;
        this.velocity.x = 0;
        break;
      }
    }

    // Test Z
    const playerBoxZ = new THREE.Box3(
      new THREE.Vector3(newPos.x - r, newPos.y, newPos.z - r),
      new THREE.Vector3(newPos.x + r, newPos.y + 2.0, newPos.z + r)
    );

    for (const box of colliders) {
      if (playerBoxZ.intersectsBox(box)) {
        newPos.z = oldPos.z;
        this.velocity.z = 0;
        break;
      }
    }
  }

  resolveFloorStairs(pos) {
    // Detect if inside staircase area (x: -4.0 to -1.0, z: 32 to 40)
    if (pos.x >= -4.0 && pos.x <= -1.0 && pos.z >= 33.5 && pos.z <= 40.5) {
      // Staircase ramp interpolation
      const t = (pos.z - 34.0) / 6.0; // 0 to 1
      const clampedT = Math.max(0, Math.min(1, t));

      if (pos.y >= -1.0) {
        // Stairs connecting Ground (y:0) to Level 1 (y:4.0)
        pos.y = clampedT * 4.0;
        this.currentFloor = pos.y > 2.0 ? 1 : 0;
      } else {
        // Stairs connecting Basement (y:-4.0) to Ground (y:0)
        pos.y = -4.0 + clampedT * 4.0;
        this.currentFloor = pos.y > -2.0 ? 0 : -1;
      }
    } else {
      // Snap to nearest floor plane
      if (pos.y > 2.0) {
        pos.y = 4.0;
        this.currentFloor = 1;
      } else if (pos.y < -2.0) {
        pos.y = -4.0;
        this.currentFloor = -1;
      } else {
        pos.y = 0;
        this.currentFloor = 0;
      }
    }
  }

  updateInteractionRaycast() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersects = this.raycaster.intersectObjects(this.hospitalData.interactables, true);

    if (intersects.length > 0) {
      // Find top interactable root
      let obj = intersects[0].object;
      while (obj && !obj.userData.isInteractable && obj.parent) {
        obj = obj.parent;
      }

      if (obj && obj.userData.isInteractable) {
        this.currentInteractable = obj;
        if (this.crosshair) this.crosshair.classList.add('active');
        if (this.interactionPrompt) {
          this.interactionPrompt.classList.remove('hidden');

          const type = obj.userData.type;
          let label = 'INTERACT';
          if (type === 'door') label = obj.userData.isOpen ? 'CLOSE DOOR' : 'OPEN DOOR';
          else if (type === 'generator') label = obj.userData.isActivated ? 'GENERATOR RUNNING' : 'START GENERATOR';
          else if (type === 'xray') label = 'EXAMINE RADIOGRAPH';
          else if (type === 'elevator') label = 'USE ELEVATOR';

          if (this.interactionText) this.interactionText.textContent = label;
        }
        return;
      }
    }

    this.currentInteractable = null;
    if (this.crosshair) this.crosshair.classList.remove('active');
    if (this.interactionPrompt) this.interactionPrompt.classList.add('hidden');
  }

  updateLocationHUD() {
    // Check which room zone player is inside
    let activeZone = null;
    for (const zone of this.hospitalData.roomZones) {
      if (zone.bounds.containsPoint(this.camera.position)) {
        activeZone = zone;
        break;
      }
    }

    if (activeZone) {
      if (this.roomDisplay) this.roomDisplay.textContent = activeZone.name;

      const floorNames = {
        '-1': 'BASEMENT: MORGUE & AUXILIARY PLANT',
        '0': 'GROUND FLOOR: RECEPTION & ER',
        '1': '1ST FLOOR: SURGERY & ICU'
      };
      if (this.floorDisplay) this.floorDisplay.textContent = floorNames[activeZone.floor] || 'FACILITY';

      // Morgue tension effect: heartbeat triggers in the morgue
      if (activeZone.name.includes('Morgue') && Math.random() < 0.015) {
        this.audio.playHeartbeat();
        if (this.heartRateDisplay) {
          this.heartRateDisplay.textContent = '108 BPM';
        }
      } else {
        if (this.heartRateDisplay && Math.random() < 0.05) {
          this.heartRateDisplay.textContent = '76 BPM';
        }
      }
    }
  }

  renderBlueprintMap() {
    const canvas = document.getElementById('blueprint-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Technical grid background
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Blueprint room layouts based on current floor
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(9, 55, 86, 0.5)';
    ctx.font = '12px "Share Tech Mono", monospace';

    const cx = w / 2;
    const cy = h / 2 - 20;
    const scale = 8.5;

    if (this.currentFloor === 0) {
      // Ground Floor: Reception, Corridor, ER, Patient Ward
      // Reception
      ctx.fillRect(cx - 70, cy - 150, 140, 110);
      ctx.strokeRect(cx - 70, cy - 150, 140, 110);
      ctx.fillStyle = '#bae6fd';
      ctx.fillText('RECEPTION & WAITING', cx - 60, cy - 90);

      // Main Corridor
      ctx.fillStyle = 'rgba(9, 55, 86, 0.5)';
      ctx.fillRect(cx - 20, cy - 40, 40, 240);
      ctx.strokeRect(cx - 20, cy - 40, 40, 240);
      ctx.fillStyle = '#bae6fd';
      ctx.fillText('CORRIDOR A', cx - 15, cy + 80);

      // Emergency Room
      ctx.fillStyle = 'rgba(9, 55, 86, 0.5)';
      ctx.fillRect(cx - 130, cy - 10, 110, 100);
      ctx.strokeRect(cx - 130, cy - 10, 110, 100);
      ctx.fillStyle = '#ef4444';
      ctx.fillText('TRAUMA / ER', cx - 110, cy + 40);

      // Patient Ward 101
      ctx.fillStyle = 'rgba(9, 55, 86, 0.5)';
      ctx.fillRect(cx + 20, cy - 10, 100, 100);
      ctx.strokeRect(cx + 20, cy - 10, 100, 100);
      ctx.fillStyle = '#bae6fd';
      ctx.fillText('WARD 101', cx + 40, cy + 40);

      // Stairwell & Elevator
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.fillRect(cx - 50, cy + 200, 100, 60);
      ctx.strokeRect(cx - 50, cy + 200, 100, 60);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('STAIRS & ELEVATOR', cx - 45, cy + 235);

    } else if (this.currentFloor === 1) {
      // 1st Floor: Operating Theaters & ICU
      ctx.fillRect(cx - 140, cy - 10, 120, 120);
      ctx.strokeRect(cx - 140, cy - 10, 120, 120);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('OPERATING THEATER A', cx - 130, cy + 50);

      ctx.fillStyle = 'rgba(9, 55, 86, 0.5)';
      ctx.fillRect(cx + 20, cy - 10, 120, 120);
      ctx.strokeRect(cx + 20, cy - 10, 120, 120);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('INTENSIVE CARE (ICU)', cx + 30, cy + 50);

      // Corridor
      ctx.fillRect(cx - 20, cy - 40, 40, 240);
      ctx.strokeRect(cx - 20, cy - 40, 40, 240);
    } else {
      // Basement: Morgue & Power Plant
      ctx.fillRect(cx - 140, cy - 10, 120, 120);
      ctx.strokeRect(cx - 140, cy - 10, 120, 120);
      ctx.fillStyle = '#64748b';
      ctx.fillText('MORGUE & REFRIGERATION', cx - 135, cy + 50);

      ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
      ctx.fillRect(cx + 20, cy - 10, 120, 120);
      ctx.strokeRect(cx + 20, cy - 10, 120, 120);
      ctx.fillStyle = '#22c55e';
      ctx.fillText('POWER PLANT & DIESEL GEN', cx + 25, cy + 50);

      // Corridor
      ctx.fillStyle = 'rgba(9, 55, 86, 0.5)';
      ctx.fillRect(cx - 20, cy - 40, 40, 240);
      ctx.strokeRect(cx - 20, cy - 40, 40, 240);
    }

    // Draw Player Marker
    const px = cx + this.position.x * scale;
    const py = cy + this.position.z * scale * 0.45;

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();

    // Direction cone
    const yaw = -this.euler.y;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.sin(yaw) * 16, py + Math.cos(yaw) * 16);
    ctx.stroke();
  }
}
