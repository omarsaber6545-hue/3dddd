import * as THREE from 'three';

/**
 * Atmospheric Effects Engine
 * Manages swirling dust particle system, exponential horror fog, and environmental decay atmosphere.
 */
export class AtmosphereEffects {
  constructor(scene) {
    this.scene = scene;

    // 1. Exponential Horror Fog (dense, desaturated greenish-charcoal)
    this.fogColor = new THREE.Color(0x050a0e);
    this.scene.fog = new THREE.FogExp2(this.fogColor, 0.042);

    // 2. Swirling 3D Dust Particle Motes
    this.setupDustParticles();
  }

  setupDustParticles() {
    const particleCount = 2500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    // Spread dust motes throughout the hospital corridors and rooms
    const spreadX = 28;
    const spreadY = 12; // Covers basement through level 1
    const spreadZ = 50;

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spreadX;
      positions[i * 3 + 1] = -4.0 + Math.random() * spreadY;
      positions[i * 3 + 2] = -15 + Math.random() * spreadZ;

      velocities[i * 3] = (Math.random() - 0.5) * 0.15;
      velocities[i * 3 + 1] = -0.05 + Math.random() * 0.1;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.15;

      scales[i] = 0.5 + Math.random() * 1.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.velocities = velocities;
    this.positions = positions;

    // Canvas texture for soft round glowing dust particle
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(230, 240, 255, 0.9)');
    grad.addColorStop(0.4, 'rgba(200, 220, 240, 0.4)');
    grad.addColorStop(1, 'rgba(180, 200, 220, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const dustTex = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.12,
      map: dustTex,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0x94a3b8
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.scene.add(this.dustParticles);
  }

  update(delta, time, playerPos) {
    if (!this.positions || !this.dustParticles) return;

    const count = this.positions.length / 3;
    const posAttr = this.dustParticles.geometry.attributes.position;

    // Slowly drift particles with Brownian turbulence
    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      // Swirling sine wave drift
      this.positions[idx] += Math.sin(time * 0.5 + i) * 0.003;
      this.positions[idx + 1] += Math.cos(time * 0.3 + i * 2) * 0.002;
      this.positions[idx + 2] += Math.sin(time * 0.4 + i * 3) * 0.003;

      // Wrap particles around player to maintain high density near the camera
      if (playerPos) {
        if (this.positions[idx] - playerPos.x > 16) this.positions[idx] -= 32;
        if (this.positions[idx] - playerPos.x < -16) this.positions[idx] += 32;
        if (this.positions[idx + 2] - playerPos.z > 25) this.positions[idx + 2] -= 50;
        if (this.positions[idx + 2] - playerPos.z < -25) this.positions[idx + 2] += 50;
      }
    }

    posAttr.needsUpdate = true;
  }
}
