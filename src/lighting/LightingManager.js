import * as THREE from 'three';

/**
 * Lighting Manager
 * Controls ambient cold moonlight, player flashlight with volumetric cone,
 * flickering fluorescent lights, and emergency power restoration.
 */
export class LightingManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.flickerLights = [];
    this.isPowerRestored = false;
    this.flashlightActive = true;

    this.setupEnvironmentLighting();
    this.setupPlayerFlashlight();
  }

  setupEnvironmentLighting() {
    // 1. Very dim ambient light for deep creepy horror shadows
    this.ambientLight = new THREE.AmbientLight(0x0a141e, 0.4);
    this.scene.add(this.ambientLight);

    // 2. Cold blue exterior moonlight entering through windows
    this.moonLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
    this.moonLight.position.set(20, 25, -25);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 2048;
    this.moonLight.shadow.mapSize.height = 2048;
    this.moonLight.shadow.camera.near = 0.5;
    this.moonLight.shadow.camera.far = 80;
    this.moonLight.shadow.camera.left = -30;
    this.moonLight.shadow.camera.right = 30;
    this.moonLight.shadow.camera.top = 30;
    this.moonLight.shadow.camera.bottom = -30;
    this.moonLight.shadow.bias = -0.0005;
    this.scene.add(this.moonLight);
  }

  setupPlayerFlashlight() {
    // Primary Flashlight SpotLight
    this.flashlight = new THREE.SpotLight(0xfff8e7, 3.8, 22.0, Math.PI / 6, 0.35, 1.4);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.width = 1024;
    this.flashlight.shadow.mapSize.height = 1024;
    this.flashlight.shadow.camera.near = 0.1;
    this.flashlight.shadow.camera.far = 25;
    this.flashlight.shadow.bias = -0.0002;

    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.flashlight);

    // Secondary wide fill light for close peripheral visibility
    this.flashlightFill = new THREE.PointLight(0xffedd5, 0.6, 6.0, 1.5);
    this.scene.add(this.flashlightFill);

    // Subtle Volumetric Light Cone Mesh
    const coneGeo = new THREE.ConeGeometry(3.5, 18.0, 16, 1, true);
    coneGeo.translate(0, -9.0, 0);
    coneGeo.rotateX(Math.PI / 2);

    this.coneMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.045,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.volumetricCone = new THREE.Mesh(coneGeo, this.coneMat);
    this.scene.add(this.volumetricCone);
  }

  registerFlickerLights(lights) {
    this.flickerLights = lights;
  }

  toggleFlashlight() {
    this.flashlightActive = !this.flashlightActive;
    this.flashlight.intensity = this.flashlightActive ? 3.8 : 0;
    this.flashlightFill.intensity = this.flashlightActive ? 0.6 : 0;
    this.volumetricCone.visible = this.flashlightActive;
    return this.flashlightActive;
  }

  restoreEmergencyPower() {
    this.isPowerRestored = true;
    this.ambientLight.intensity = 0.8;
    this.ambientLight.color.setHex(0x1e3a5f);

    // Elevate intensity of all fluorescent fixtures
    for (const fl of this.flickerLights) {
      if (fl.userData && fl.userData.lightSource) {
        fl.userData.baseIntensity = 2.4;
      }
    }
  }

  update(delta, time, onBuzzCallback) {
    // 1. Update Flashlight position smoothly tracking camera
    if (this.camera) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);

      // Mount slightly to the right and below camera eye line
      const flashPos = this.camera.position.clone()
        .addScaledVector(right, 0.22)
        .addScaledVector(up, -0.18);

      this.flashlight.position.copy(flashPos);
      this.flashlightFill.position.copy(flashPos);

      const targetPos = this.camera.position.clone().addScaledVector(forward, 15);
      this.flashlightTarget.position.copy(targetPos);

      // Align volumetric cone
      this.volumetricCone.position.copy(flashPos);
      this.volumetricCone.quaternion.copy(this.camera.quaternion);

      // Micro flashlight flicker / battery jitter
      if (this.flashlightActive) {
        const microJitter = (Math.sin(time * 28) + Math.cos(time * 53)) * 0.08;
        this.flashlight.intensity = Math.max(0, 3.8 + microJitter);
      }
    }

    // 2. Update Fluorescent Lighting procedural flicker
    for (let i = 0; i < this.flickerLights.length; i++) {
      const fl = this.flickerLights[i];
      const light = fl.userData.lightSource;
      if (!light) continue;

      const base = fl.userData.baseIntensity || 1.5;
      const isBroken = fl.userData.isBroken;

      // Noise-based flicker with rapid dropouts
      const noise = Math.sin(time * 15 + i * 7.3) * Math.cos(time * 33 + i * 2.1);

      if (isBroken) {
        // Broken fixture flickers erratically and occasionally shuts off completely
        if (noise > 0.4) {
          light.intensity = base * (0.2 + Math.random() * 0.9);
          if (Math.random() < 0.04 && onBuzzCallback) {
            onBuzzCallback(fl.position);
          }
        } else if (noise < -0.3) {
          light.intensity = 0.05; // Almost dark
        } else {
          light.intensity = base * 0.3;
        }
      } else {
        // Normal fixture flickers subtly with occasional dip
        if (noise > 0.85) {
          light.intensity = base * 0.25;
          if (Math.random() < 0.02 && onBuzzCallback) {
            onBuzzCallback(fl.position);
          }
        } else {
          light.intensity = base * (0.9 + Math.sin(time * 120) * 0.05);
        }
      }
    }
  }
}
