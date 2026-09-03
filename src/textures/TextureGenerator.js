import * as THREE from 'three';

/**
 * Procedural PBR Texture Generator for Abandoned Horror Hospital
 * Generates high-resolution albedo, normal, and roughness maps dynamically using Canvas2D
 */
export class TextureGenerator {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Helper: Perlin-like pseudo noise generator for smooth organic grime and cracks
   */
  noise2D(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  smoothNoise(x, y) {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;
    // Cubic Hermite spline interpolation
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);

    const n00 = this.noise2D(i, j);
    const n10 = this.noise2D(i + 1, j);
    const n01 = this.noise2D(i, j + 1);
    const n11 = this.noise2D(i + 1, j + 1);

    const nx0 = n00 * (1 - sx) + n10 * sx;
    const nx1 = n01 * (1 - sx) + n11 * sx;
    return nx0 * (1 - sy) + nx1 * sy;
  }

  fbm(x, y, octaves = 5) {
    let val = 0;
    let amp = 0.5;
    let freq = 1;
    for (let i = 0; i < octaves; i++) {
      val += this.smoothNoise(x * freq, y * freq) * amp;
      freq *= 2.0;
      amp *= 0.5;
    }
    return val;
  }

  /**
   * Generates Normal Map from height / luminance data
   */
  createNormalFromHeight(sourceCanvas, strength = 2.5) {
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    const srcCtx = sourceCanvas.getContext('2d');
    const srcData = srcCtx.getImageData(0, 0, width, height).data;

    const normCanvas = document.createElement('canvas');
    normCanvas.width = width;
    normCanvas.height = height;
    const normCtx = normCanvas.getContext('2d');
    const normImgData = normCtx.createImageData(width, height);
    const normData = normImgData.data;

    const getLuma = (x, y) => {
      const px = ((x + width) % width);
      const py = ((y + height) % height);
      const idx = (py * width + px) * 4;
      return (srcData[idx] * 0.299 + srcData[idx + 1] * 0.587 + srcData[idx + 2] * 0.114) / 255;
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const left = getLuma(x - 1, y);
        const right = getLuma(x + 1, y);
        const up = getLuma(x, y - 1);
        const down = getLuma(x, y + 1);

        const dx = (left - right) * strength;
        const dy = (up - down) * strength;
        const dz = 1.0;

        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const nx = (dx / len) * 0.5 + 0.5;
        const ny = (dy / len) * 0.5 + 0.5;
        const nz = (dz / len) * 0.5 + 0.5;

        const idx = (y * width + x) * 4;
        normData[idx] = Math.floor(nx * 255);
        normData[idx + 1] = Math.floor(ny * 255);
        normData[idx + 2] = Math.floor(nz * 255);
        normData[idx + 3] = 255;
      }
    }

    normCtx.putImageData(normImgData, 0, 0);
    const texture = new THREE.CanvasTexture(normCanvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * 1. Abandoned Peeling Hospital Wall Material (Institutional pale greenish-beige / decaying plaster)
   */
  getHospitalWallPBR(repeatX = 2, repeatY = 2) {
    const key = `wall_${repeatX}_${repeatY}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Height canvas for bump/normal
    const heightCanvas = document.createElement('canvas');
    heightCanvas.width = size;
    heightCanvas.height = size;
    const hCtx = heightCanvas.getContext('2d');

    // Roughness canvas
    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = size;
    roughCanvas.height = size;
    const rCtx = roughCanvas.getContext('2d');

    // Base decaying paint color (cold institutional hospital sage green/bleached tan)
    const baseR = 145, baseG = 158, baseB = 148;
    const plasterR = 90, plasterG = 82, plasterB = 75; // Exposed drywall/concrete underneath

    const imgData = ctx.createImageData(size, size);
    const hData = hCtx.createImageData(size, size);
    const rData = rCtx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / size;
        const ny = y / size;

        // Multi-frequency noise for peeling paint edges
        const nLarge = this.fbm(nx * 4, ny * 4, 2);
        const nSmall = this.fbm(nx * 16, ny * 16, 2);
        const peelMask = nLarge + nSmall * 0.25;

        // Water drip streak vertical gradient
        const streak = Math.sin(nx * 40 + Math.sin(ny * 15) * 2) > 0.6 ? 0.35 : 0.0;
        const drip = this.fbm(nx * 12, ny * 2, 3) * (ny > 0.3 ? 0.4 : 0.1);

        const idx = (y * size + x) * 4;

        if (peelMask > 0.62) {
          // Peeling paint layer (partially chipped away)
          const edge = Math.min(1.0, (peelMask - 0.62) * 20);
          const r = Math.floor(THREE.MathUtils.lerp(plasterR, baseR - drip * 40, edge));
          const g = Math.floor(THREE.MathUtils.lerp(plasterG, baseG - drip * 40, edge));
          const b = Math.floor(THREE.MathUtils.lerp(plasterB, baseB - drip * 40, edge));

          imgData.data[idx] = Math.max(10, r);
          imgData.data[idx + 1] = Math.max(10, g);
          imgData.data[idx + 2] = Math.max(10, b);
          imgData.data[idx + 3] = 255;

          // Height
          hData.data[idx] = hData.data[idx + 1] = hData.data[idx + 2] = Math.floor(edge * 220);
          hData.data[idx + 3] = 255;

          // Roughness: paint is slightly satiny (0.65), damp spots lower
          rData.data[idx] = rData.data[idx + 1] = rData.data[idx + 2] = Math.floor(160 + (1 - edge) * 60);
          rData.data[idx + 3] = 255;
        } else {
          // Exposed rough decayed plaster / water stain
          const plasterGrunge = (this.fbm(nx * 48, ny * 48, 2) - 0.5) * 40;
          const r = Math.min(255, Math.max(20, plasterR + plasterGrunge - drip * 60));
          const g = Math.min(255, Math.max(20, plasterG + plasterGrunge - drip * 60));
          const b = Math.min(255, Math.max(20, plasterB + plasterGrunge - drip * 60));

          imgData.data[idx] = r;
          imgData.data[idx + 1] = g;
          imgData.data[idx + 2] = b;
          imgData.data[idx + 3] = 255;

          // Recessed plaster height
          hData.data[idx] = hData.data[idx + 1] = hData.data[idx + 2] = 40;
          hData.data[idx + 3] = 255;

          // Exposed plaster is very rough (0.95)
          rData.data[idx] = rData.data[idx + 1] = rData.data[idx + 2] = 240;
          rData.data[idx + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    hCtx.putImageData(hData, 0, 0);
    rCtx.putImageData(rData, 0, 0);

    // Draw some hairline cracks across the plaster
    ctx.strokeStyle = 'rgba(25, 20, 18, 0.7)';
    ctx.lineWidth = 1.5;
    this.drawCrack(ctx, 120, 100, 380, 420);
    this.drawCrack(ctx, 600, 200, 850, 700);

    const albedoTex = new THREE.CanvasTexture(canvas);
    albedoTex.wrapS = albedoTex.wrapT = THREE.RepeatWrapping;
    albedoTex.repeat.set(repeatX, repeatY);

    const normalTex = this.createNormalFromHeight(heightCanvas, 3.2);
    normalTex.repeat.set(repeatX, repeatY);

    const roughTex = new THREE.CanvasTexture(roughCanvas);
    roughTex.wrapS = roughTex.wrapT = THREE.RepeatWrapping;
    roughTex.repeat.set(repeatX, repeatY);

    const pbr = {
      map: albedoTex,
      normalMap: normalTex,
      roughnessMap: roughTex,
      roughness: 0.85,
      metalness: 0.05
    };
    this.cache.set(key, pbr);
    return pbr;
  }

  drawCrack(ctx, startX, startY, endX, endY) {
    let curX = startX;
    let curY = startY;
    ctx.beginPath();
    ctx.moveTo(curX, curY);
    const steps = 18;
    for (let i = 0; i < steps; i++) {
      const t = (i + 1) / steps;
      curX = THREE.MathUtils.lerp(startX, endX, t) + (Math.random() - 0.5) * 35;
      curY = THREE.MathUtils.lerp(startY, endY, t) + (Math.random() - 0.5) * 35;
      ctx.lineTo(curX, curY);
    }
    ctx.stroke();
  }

  /**
   * 2. Stained Abandoned Hospital Floor Tiles (Linoleum / Ceramic Grid with Puddle Reflections)
   */
  getHospitalFloorPBR(repeatX = 4, repeatY = 4) {
    const key = `floor_${repeatX}_${repeatY}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const hCanvas = document.createElement('canvas');
    hCanvas.width = size;
    hCanvas.height = size;
    const hCtx = hCanvas.getContext('2d');

    const rCanvas = document.createElement('canvas');
    rCanvas.width = size;
    rCanvas.height = size;
    const rCtx = rCanvas.getContext('2d');

    // Base checkered clinical linoleum tile grid (light beige-gray with dark muddy grime)
    const tileSize = size / 4; // 4x4 sub-tiles per texture map
    for (let ty = 0; ty < 4; ty++) {
      for (let tx = 0; tx < 4; tx++) {
        const isAlternate = (tx + ty) % 2 === 0;
        const baseTone = isAlternate ? 180 : 160;
        const colorVar = (Math.random() - 0.5) * 20;

        ctx.fillStyle = `rgb(${baseTone + colorVar - 20}, ${baseTone + colorVar - 15}, ${baseTone + colorVar - 25})`;
        ctx.fillRect(tx * tileSize, ty * tileSize, tileSize, tileSize);

        // Tile bevel/border
        ctx.strokeStyle = '#23201c';
        ctx.lineWidth = 4;
        ctx.strokeRect(tx * tileSize, ty * tileSize, tileSize, tileSize);

        // Height canvas: Tile surface is high, grout is low
        hCtx.fillStyle = '#d0d0d0';
        hCtx.fillRect(tx * tileSize, ty * tileSize, tileSize, tileSize);
        hCtx.strokeStyle = '#101010';
        hCtx.lineWidth = 6;
        hCtx.strokeRect(tx * tileSize, ty * tileSize, tileSize, tileSize);

        // Roughness: default linoleum is semi-glossy (0.4)
        rCtx.fillStyle = '#808080';
        rCtx.fillRect(tx * tileSize, ty * tileSize, tileSize, tileSize);
      }
    }

    // Overlay dirty grime, mold, water seepage rings
    const imgData = ctx.getImageData(0, 0, size, size);
    const rData = rCtx.getImageData(0, 0, size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / size;
        const ny = y / size;
        const idx = (y * size + x) * 4;

        // Grime noise
        const grime = this.fbm(nx * 10, ny * 10, 4);
        // Water puddle mask in center
        const dx = nx - 0.5;
        const dy = ny - 0.5;
        const distToPuddle = Math.sqrt(dx * dx * 1.4 + dy * dy);
        const puddleNoise = this.fbm(nx * 14, ny * 14, 2) * 0.15;
        const isPuddle = (distToPuddle + puddleNoise) < 0.28;

        if (isPuddle) {
          // Reflective dark wet standing water puddle!
          imgData.data[idx] = Math.floor(imgData.data[idx] * 0.35 + 10);
          imgData.data[idx + 1] = Math.floor(imgData.data[idx + 1] * 0.38 + 15);
          imgData.data[idx + 2] = Math.floor(imgData.data[idx + 2] * 0.40 + 20);

          // Puddle roughness is near 0 (mirror reflection)
          rData.data[idx] = 20;
          rData.data[idx + 1] = 20;
          rData.data[idx + 2] = 20;
        } else {
          // Dirty linoleum
          const grimeFactor = Math.max(0, (grime - 0.45) * 1.5);
          imgData.data[idx] = Math.max(15, Math.floor(imgData.data[idx] * (1 - grimeFactor * 0.7)));
          imgData.data[idx + 1] = Math.max(15, Math.floor(imgData.data[idx + 1] * (1 - grimeFactor * 0.68)));
          imgData.data[idx + 2] = Math.max(15, Math.floor(imgData.data[idx + 2] * (1 - grimeFactor * 0.65)));

          // Grimy tile is rougher
          const roughVal = Math.floor(100 + grimeFactor * 120);
          rData.data[idx] = roughVal;
          rData.data[idx + 1] = roughVal;
          rData.data[idx + 2] = roughVal;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    rCtx.putImageData(rData, 0, 0);

    const albedoTex = new THREE.CanvasTexture(canvas);
    albedoTex.wrapS = albedoTex.wrapT = THREE.RepeatWrapping;
    albedoTex.repeat.set(repeatX, repeatY);

    const normalTex = this.createNormalFromHeight(hCanvas, 2.8);
    normalTex.repeat.set(repeatX, repeatY);

    const roughTex = new THREE.CanvasTexture(rCanvas);
    roughTex.wrapS = roughTex.wrapT = THREE.RepeatWrapping;
    roughTex.repeat.set(repeatX, repeatY);

    const pbr = {
      map: albedoTex,
      normalMap: normalTex,
      roughnessMap: roughTex,
      roughness: 0.65,
      metalness: 0.12
    };
    this.cache.set(key, pbr);
    return pbr;
  }

  /**
   * 3. Suspended Acoustic Ceiling Tiles with Perforations and Water Leaks
   */
  getHospitalCeilingPBR(repeatX = 2, repeatY = 2) {
    const key = `ceil_${repeatX}_${repeatY}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // 2x2 grid of ceiling tiles with rusted T-bar grid
    const half = size / 2;
    for (let ty = 0; ty < 2; ty++) {
      for (let tx = 0; tx < 2; tx++) {
        // Tile background
        ctx.fillStyle = '#bcc2c0';
        ctx.fillRect(tx * half, ty * half, half, half);

        // Acoustic pinhole speckling
        ctx.fillStyle = 'rgba(40, 45, 45, 0.45)';
        for (let p = 0; p < 350; p++) {
          const px = tx * half + 6 + Math.random() * (half - 12);
          const py = ty * half + 6 + Math.random() * (half - 12);
          ctx.fillRect(px, py, 1.5, 1.5);
        }

        // T-bar metal runner frame
        ctx.strokeStyle = '#474c50';
        ctx.lineWidth = 6;
        ctx.strokeRect(tx * half, ty * half, half, half);
      }
    }

    // Yellowish-brown water leak ring in one quadrant
    const leakGrad = ctx.createRadialGradient(size * 0.35, size * 0.4, 10, size * 0.35, size * 0.4, 140);
    leakGrad.addColorStop(0, 'rgba(100, 70, 30, 0.7)');
    leakGrad.addColorStop(0.7, 'rgba(140, 105, 45, 0.4)');
    leakGrad.addColorStop(1, 'rgba(140, 105, 45, 0)');
    ctx.fillStyle = leakGrad;
    ctx.beginPath();
    ctx.arc(size * 0.35, size * 0.4, 140, 0, Math.PI * 2);
    ctx.fill();

    const albedoTex = new THREE.CanvasTexture(canvas);
    albedoTex.wrapS = albedoTex.wrapT = THREE.RepeatWrapping;
    albedoTex.repeat.set(repeatX, repeatY);

    const pbr = {
      map: albedoTex,
      roughness: 0.92,
      metalness: 0.1
    };
    this.cache.set(key, pbr);
    return pbr;
  }

  /**
   * 4. Rusted Industrial Metal (Gurneys, Bed Frames, Boiler, Lockers, Elevator)
   */
  getRustMetalPBR() {
    const key = 'rust_metal';
    if (this.cache.has(key)) return this.cache.get(key);

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const hCanvas = document.createElement('canvas');
    hCanvas.width = size;
    hCanvas.height = size;
    const hCtx = hCanvas.getContext('2d');

    const imgData = ctx.createImageData(size, size);
    const hData = hCtx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / size;
        const ny = y / size;
        const rustNoise = this.fbm(nx * 12, ny * 12, 4);
        const idx = (y * size + x) * 4;

        if (rustNoise > 0.52) {
          // Rust patch (dark oxidized reddish-brown)
          imgData.data[idx] = Math.floor(130 + (rustNoise - 0.52) * 120);
          imgData.data[idx + 1] = Math.floor(55 + (rustNoise - 0.52) * 50);
          imgData.data[idx + 2] = 25;
          imgData.data[idx + 3] = 255;

          hData.data[idx] = hData.data[idx + 1] = hData.data[idx + 2] = 70;
          hData.data[idx + 3] = 255;
        } else {
          // Scratched weathered steel
          const steelVal = Math.floor(80 + (Math.sin(nx * 200) * 0.05 + Math.random() * 0.1) * 60);
          imgData.data[idx] = steelVal;
          imgData.data[idx + 1] = steelVal + 5;
          imgData.data[idx + 2] = steelVal + 10;
          imgData.data[idx + 3] = 255;

          hData.data[idx] = hData.data[idx + 1] = hData.data[idx + 2] = 180;
          hData.data[idx + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    hCtx.putImageData(hData, 0, 0);

    const albedoTex = new THREE.CanvasTexture(canvas);
    const normalTex = this.createNormalFromHeight(hCanvas, 2.0);

    const pbr = {
      map: albedoTex,
      normalMap: normalTex,
      roughness: 0.68,
      metalness: 0.75
    };
    this.cache.set(key, pbr);
    return pbr;
  }

  /**
   * 5. Medical Radiograph (X-Ray film illuminated by lightbox)
   */
  getXRayTexture(type = 'chest') {
    const key = `xray_${type}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Deep blue-black film backing
    ctx.fillStyle = '#02050b';
    ctx.fillRect(0, 0, size, size);

    if (type === 'chest') {
      // Chest Radiograph: Spine, rib cage silhouette, lung cavities
      ctx.fillStyle = 'rgba(180, 220, 255, 0.4)';
      ctx.strokeStyle = 'rgba(210, 235, 255, 0.85)';
      ctx.lineWidth = 14;

      // Spine vertical column
      ctx.beginPath();
      ctx.moveTo(size / 2, 60);
      ctx.lineTo(size / 2, 450);
      ctx.stroke();

      // Rib pairs
      for (let r = 0; r < 8; r++) {
        const y = 140 + r * 35;
        const span = 80 + r * 14;
        ctx.lineWidth = 10 - r * 0.5;

        // Left rib
        ctx.beginPath();
        ctx.ellipse(size / 2 - span * 0.5, y, span * 0.6, 25, 0.2, 0, Math.PI);
        ctx.stroke();

        // Right rib
        ctx.beginPath();
        ctx.ellipse(size / 2 + span * 0.5, y, span * 0.6, 25, -0.2, 0, Math.PI);
        ctx.stroke();
      }

      // Heart silhouette on left side
      ctx.fillStyle = 'rgba(230, 245, 255, 0.65)';
      ctx.beginPath();
      ctx.ellipse(size / 2 + 35, 280, 50, 65, 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Film patient ID stamping
      ctx.font = '14px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('PT: DOE, JOHN #4092-B', 30, 480);
      ctx.fillText('DATE: 14-OCT-1984', 30, 500);
    } else {
      // Skull Radiograph
      ctx.strokeStyle = 'rgba(220, 240, 255, 0.8)';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2 - 30, 130, 0, Math.PI * 2);
      ctx.stroke();

      // Eye orbits
      ctx.fillStyle = 'rgba(5, 10, 20, 0.9)';
      ctx.beginPath();
      ctx.ellipse(size / 2 - 45, size / 2 - 20, 25, 30, 0, 0, Math.PI * 2);
      ctx.ellipse(size / 2 + 45, size / 2 - 20, 25, 30, 0, 0, Math.PI * 2);
      ctx.fill();

      // Jaw teeth
      ctx.fillStyle = 'rgba(230, 245, 255, 0.8)';
      ctx.fillRect(size / 2 - 60, size / 2 + 60, 120, 35);

      ctx.font = '14px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('CRANIAL TRAUMA STUDY', 30, 480);
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * 6. Evacuation Sign & Medical Warning Notices
   */
  getSignTexture(text = 'EMERGENCY', sub = 'AUTHORISED ONLY', bgColor = '#991b1b') {
    const key = `sign_${text}_${bgColor}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Weathered border
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(16, 16, 480, 224);

    ctx.fillStyle = bgColor;
    ctx.fillRect(24, 24, 464, 208);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 42px "Cinzel", serif, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 100);

    ctx.font = 'bold 20px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
    ctx.fillText(sub, 256, 165);

    // Weathered grunge stains on sign
    ctx.fillStyle = 'rgba(20, 10, 5, 0.35)';
    for (let i = 0; i < 60; i++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 256, Math.random() * 8, Math.random() * 8);
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * 7. Dirty Stained Glass Texture (for windows and cabinet doors)
   */
  getDirtyGlassTexture() {
    const key = 'dirty_glass';
    if (this.cache.has(key)) return this.cache.get(key);

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(25, 40, 45, 0.4)';
    ctx.fillRect(0, 0, size, size);

    // Grime around edges
    const grad = ctx.createRadialGradient(size / 2, size / 2, 100, size / 2, size / 2, 250);
    grad.addColorStop(0, 'rgba(20, 30, 30, 0)');
    grad.addColorStop(1, 'rgba(45, 40, 30, 0.65)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Diagonal hairline fractures
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, 30);
    ctx.lineTo(240, 220);
    ctx.lineTo(310, 480);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }
}
