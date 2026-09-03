import * as THREE from 'three';
import { TextureGenerator } from './textures/TextureGenerator.js';
import { ModularArchitect } from './world/ModularArchitect.js';
import { PropsLibrary } from './world/PropsLibrary.js';
import { HospitalLayout } from './world/HospitalLayout.js';
import { LightingManager } from './lighting/LightingManager.js';
import { AtmosphereEffects } from './effects/AtmosphereEffects.js';
import { HorrorAudioEngine } from './audio/HorrorAudioEngine.js';
import { FPSController } from './player/FPSController.js';

class HorrorHospitalApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.startScreen = document.getElementById('start-screen');
    this.enterBtn = document.getElementById('enter-btn');
    this.hud = document.getElementById('hud');

    this.initThree();
    this.initSystems();
    this.setupUI();

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    // Scene
    this.scene = new THREE.Scene();

    // Camera (65 deg FOV for realistic human perspective without excessive fisheye distortion)
    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );

    // High Performance WebGL Renderer with Soft Shadows and Film Tone Mapping
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.container.appendChild(this.renderer.domElement);

    // Resize handler
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initSystems() {
    // 1. Procedural Texture Engine
    this.textureGen = new TextureGenerator();

    // 2. Modular Architecture & Props
    this.architect = new ModularArchitect(this.textureGen);
    this.props = new PropsLibrary(this.textureGen);

    // 3. Hospital 3-Floor Layout
    this.hospital = new HospitalLayout(this.architect, this.props, this.textureGen);
    this.hospitalData = this.hospital.buildHospital();
    this.scene.add(this.hospitalData.root);

    // 4. Lighting Manager
    this.lighting = new LightingManager(this.scene, this.camera);
    this.lighting.registerFlickerLights(this.hospitalData.flickerLights);

    // 5. Atmosphere & Fog & Dust Particles
    this.atmosphere = new AtmosphereEffects(this.scene);

    // 6. Horror Audio Engine (Web Audio API)
    this.audio = new HorrorAudioEngine();

    // 7. FPS Player Controller
    this.controller = new FPSController(
      this.camera,
      this.renderer.domElement,
      this.audio,
      this.lighting,
      this.hospitalData
    );

    this.gameStarted = false;
  }

  enterGame() {
    if (this.gameStarted) return;
    this.gameStarted = true;

    // 1. Instantly hide the start screen overlay
    if (this.startScreen) {
      this.startScreen.classList.add('hidden');
      this.startScreen.style.setProperty('display', 'none', 'important');
      this.startScreen.style.pointerEvents = 'none';
    }

    // 2. Instantly show HUD
    if (this.hud) {
      this.hud.classList.remove('hidden');
      this.hud.style.setProperty('display', 'flex', 'important');
    }

    // 3. Initialize audio context safely
    try {
      if (this.audio) {
        this.audio.init();
        this.audio.resume();
      }
    } catch (e) {
      console.warn('Audio init suppressed:', e);
    }

    // 4. Request pointer lock and show introductory guidance
    try {
      if (this.controller) {
        this.controller.lockPointer();
        this.controller.showSubtitles('Facility power offline. Use [F] to toggle flashlight. Investigate the corridors.', 4000);
      }
    } catch (e) {
      console.warn('Pointer lock suppressed:', e);
    }
  }

  setupUI() {
    // 1. Enter button click
    if (this.enterBtn) {
      this.enterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.enterGame();
      });
    }

    // 2. Clicking anywhere on start card or background
    if (this.startScreen) {
      this.startScreen.addEventListener('click', () => {
        this.enterGame();
      });
    }

    // 3. Keyboard Enter or Space key to start immediately
    window.addEventListener('keydown', (e) => {
      if (!this.gameStarted) {
        if (e.key === 'Enter' || e.code === 'Enter' || e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          this.enterGame();
        }
      }
    });

    // 4. Re-lock pointer when clicking on canvas after game started
    this.renderer.domElement.addEventListener('click', () => {
      if (this.gameStarted && !this.controller.isLocked) {
        this.controller.lockPointer();
        if (this.audio) this.audio.resume();
      }
    });

    // Blueprint Map Modal Close & Floor Switcher buttons
    const closeMapBtn = document.getElementById('close-map-btn');
    if (closeMapBtn) {
      closeMapBtn.addEventListener('click', () => {
        document.getElementById('map-modal').classList.add('hidden');
      });
    }

    const floorBtns = document.querySelectorAll('.floor-btn');
    floorBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        floorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = parseInt(btn.dataset.floor, 10);
        this.controller.currentFloor = f;
        this.controller.renderBlueprintMap();
      });
    });
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    // Update Player & Collisions
    if (this.controller) {
      this.controller.update(delta, time);
    }

    // Update Lighting & Fluorescent Electrical Buzzing
    if (this.lighting) {
      this.lighting.update(delta, time, (pos) => {
        // Spatial volume factor based on distance from light to player
        const dist = this.camera.position.distanceTo(pos);
        if (dist < 12) {
          const factor = Math.max(0.1, 1 - dist / 12);
          this.audio.playFluorescentBuzz(factor);
        }
      });
    }

    // Update Atmospheric Dust System
    if (this.atmosphere) {
      this.atmosphere.update(delta, time, this.camera.position);
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new HorrorHospitalApp();
});
