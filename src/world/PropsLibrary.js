import * as THREE from 'three';

/**
 * High-Detail Horror Hospital Props Library
 * Procedurally creates game-ready 3D props for corridors, patient wards, operating rooms, ER, morgue, and basement.
 */
export class PropsLibrary {
  constructor(textureGen) {
    this.texGen = textureGen;

    // Shared materials
    const rustPbr = this.texGen.getRustMetalPBR();
    this.rustMetalMat = new THREE.MeshStandardMaterial({
      map: rustPbr.map,
      normalMap: rustPbr.normalMap,
      roughness: 0.65,
      metalness: 0.75
    });

    this.chromeMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.35,
      metalness: 0.85
    });

    this.mattressMat = new THREE.MeshStandardMaterial({
      color: 0x9e9885, // Discolored dingy hospital yellow-gray
      roughness: 0.95,
      metalness: 0.05
    });

    this.sheetMat = new THREE.MeshStandardMaterial({
      color: 0x828a8d,
      roughness: 0.9,
      metalness: 0.02
    });

    this.leatherMat = new THREE.MeshStandardMaterial({
      color: 0x1e2428, // Dark cracked hospital vinyl
      roughness: 0.75,
      metalness: 0.15
    });

    this.chairPlasticMat = new THREE.MeshStandardMaterial({
      color: 0xb45309, // 1970s burnt amber / orange molded hospital waiting chair
      roughness: 0.5,
      metalness: 0.1
    });

    this.glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xcfd8dc,
      transmission: 0.8,
      transparent: true,
      opacity: 0.5,
      roughness: 0.3
    });

    this.fluoGlassMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      emissive: 0xd8eefe,
      emissiveIntensity: 0.8,
      roughness: 0.3
    });
  }

  /**
   * 1. Abandoned Hospital Bed with articulated metal frame, wheels, stained mattress, side rails
   */
  createHospitalBed(isOverturned = false) {
    const group = new THREE.Group();
    const length = 2.2;
    const width = 1.0;
    const height = 0.85;

    // Main rectangular frame
    const frameGeo = new THREE.BoxGeometry(width, 0.08, length);
    const frame = new THREE.Mesh(frameGeo, this.rustMetalMat);
    frame.position.y = 0.5;
    frame.castShadow = true;
    frame.receiveShadow = true;
    group.add(frame);

    // Stained mattress
    const matGeo = new THREE.BoxGeometry(width - 0.08, 0.18, length - 0.08);
    const mattress = new THREE.Mesh(matGeo, this.mattressMat);
    mattress.position.y = 0.63;
    mattress.castShadow = true;
    group.add(mattress);

    // Headboard & Footboard (tubular steel)
    const boardH = 0.55;
    const hbGeo = new THREE.BoxGeometry(width, boardH, 0.05);
    const headboard = new THREE.Mesh(hbGeo, this.rustMetalMat);
    headboard.position.set(0, 0.75, -length / 2 + 0.03);
    group.add(headboard);

    const footboard = new THREE.Mesh(hbGeo, this.rustMetalMat);
    footboard.position.set(0, 0.65, length / 2 - 0.03);
    group.add(footboard);

    // 4 Frame Legs with Caster Wheels
    const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8);
    const wheelGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 8);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });

    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const lx = sx * (width / 2 - 0.08);
        const lz = sz * (length / 2 - 0.12);

        const leg = new THREE.Mesh(legGeo, this.rustMetalMat);
        leg.position.set(lx, 0.25, lz);
        group.add(leg);

        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(lx, 0.04, lz);
        group.add(wheel);
      }
    }

    // Side safety rails (one side collapsed down)
    const railMat = this.rustMetalMat;
    const railGeo = new THREE.BoxGeometry(0.03, 0.28, length * 0.65);
    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-width / 2 - 0.02, 0.72, -0.1);
    group.add(leftRail);

    // Right rail collapsed down
    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(width / 2 + 0.02, 0.45, -0.1);
    rightRail.rotation.z = 0.2;
    group.add(rightRail);

    // IV hook mounted on headboard
    const ivPole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.1, 6), this.chromeMat);
    ivPole.position.set(width / 2 - 0.1, 1.2, -length / 2 + 0.05);
    group.add(ivPole);

    if (isOverturned) {
      group.rotation.z = Math.PI * 0.52;
      group.position.y = width / 2;
    }

    return group;
  }

  /**
   * 2. Wheelchair (Overturned or parked)
   */
  createWheelchair(isOverturned = false) {
    const group = new THREE.Group();

    // Large rear spoked wheels
    const wheelGeo = new THREE.TorusGeometry(0.35, 0.02, 8, 24);
    const wheelL = new THREE.Mesh(wheelGeo, this.rustMetalMat);
    wheelL.position.set(-0.35, 0.35, -0.15);
    wheelL.rotation.y = Math.PI / 2;
    wheelL.castShadow = true;
    group.add(wheelL);

    const wheelR = new THREE.Mesh(wheelGeo, this.rustMetalMat);
    wheelR.position.set(0.35, 0.35, -0.15);
    wheelR.rotation.y = Math.PI / 2;
    wheelR.castShadow = true;
    group.add(wheelR);

    // Wheel spokes
    const spokeMat = this.chromeMat;
    for (let i = 0; i < 6; i++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.7, 4), spokeMat);
      spoke.rotation.x = (i * Math.PI) / 6;
      spoke.position.set(-0.35, 0.35, -0.15);
      group.add(spoke);

      const spoke2 = spoke.clone();
      spoke2.position.set(0.35, 0.35, -0.15);
      group.add(spoke2);
    }

    // Small front caster wheels
    const frontWheelGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12);
    const fwL = new THREE.Mesh(frontWheelGeo, this.rustMetalMat);
    fwL.rotation.z = Math.PI / 2;
    fwL.position.set(-0.28, 0.06, 0.32);
    group.add(fwL);

    const fwR = fwL.clone();
    fwR.position.set(0.28, 0.06, 0.32);
    group.add(fwR);

    // Seat & Backrest (cracked dark leather/vinyl)
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.48), this.leatherMat);
    seat.position.set(0, 0.45, 0.05);
    seat.castShadow = true;
    group.add(seat);

    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.04), this.leatherMat);
    backrest.position.set(0, 0.72, -0.18);
    backrest.rotation.x = 0.12;
    backrest.castShadow = true;
    group.add(backrest);

    // Tubular frame and push handles
    const handleGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.2, 6);
    const hL = new THREE.Mesh(handleGeo, this.leatherMat);
    hL.rotation.x = Math.PI / 2;
    hL.position.set(-0.25, 0.95, -0.28);
    group.add(hL);

    const hR = hL.clone();
    hR.position.set(0.25, 0.95, -0.28);
    group.add(hR);

    // Footrests
    const footrestGeo = new THREE.BoxGeometry(0.18, 0.02, 0.16);
    const footL = new THREE.Mesh(footrestGeo, this.rustMetalMat);
    footL.position.set(-0.16, 0.12, 0.42);
    group.add(footL);

    const footR = footL.clone();
    footR.position.set(0.16, 0.12, 0.42);
    group.add(footR);

    if (isOverturned) {
      group.rotation.x = Math.PI * 0.4;
      group.rotation.z = Math.PI * 0.35;
      group.position.y = 0.25;
    }

    return group;
  }

  /**
   * 3. IV Drip Stand with translucent saline bag and coiled tubing
   */
  createIVStand() {
    const group = new THREE.Group();

    // 5-star wheeled base
    const baseMat = this.rustMetalMat;
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const armGeo = new THREE.BoxGeometry(0.04, 0.03, 0.28);
      const arm = new THREE.Mesh(armGeo, baseMat);
      arm.position.set(Math.cos(angle) * 0.14, 0.05, Math.sin(angle) * 0.14);
      arm.rotation.y = -angle;
      group.add(arm);
    }

    // Chrome upright telescoping pole
    const poleGeo = new THREE.CylinderGeometry(0.014, 0.018, 1.85, 8);
    const pole = new THREE.Mesh(poleGeo, this.chromeMat);
    pole.position.y = 0.95;
    pole.castShadow = true;
    group.add(pole);

    // Top loop hooks
    const hookGeo = new THREE.TorusGeometry(0.08, 0.008, 6, 12, Math.PI);
    const hook1 = new THREE.Mesh(hookGeo, this.chromeMat);
    hook1.position.set(-0.08, 1.85, 0);
    hook1.rotation.z = Math.PI;
    group.add(hook1);

    // Saline fluid bag (semi-translucent)
    const bagGeo = new THREE.BoxGeometry(0.14, 0.26, 0.04);
    const salineMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transmission: 0.9,
      transparent: true,
      opacity: 0.55,
      roughness: 0.2
    });
    const bag = new THREE.Mesh(bagGeo, salineMat);
    bag.position.set(-0.08, 1.65, 0);
    group.add(bag);

    // Thin plastic tube coiled downward
    const tubeCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.08, 1.52, 0),
      new THREE.Vector3(-0.02, 1.2, 0.08),
      new THREE.Vector3(-0.12, 0.8, -0.04),
      new THREE.Vector3(-0.04, 0.4, 0.05)
    );
    const tubeGeo = new THREE.TubeGeometry(tubeCurve, 12, 0.004, 4, false);
    const tube = new THREE.Mesh(tubeGeo, salineMat);
    group.add(tube);

    return group;
  }

  /**
   * 4. Multi-Dish Surgical Chandelier (Overhead Operating Theater Lamp)
   */
  createSurgicalLamp() {
    const group = new THREE.Group();

    // Ceiling mount base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 12), this.rustMetalMat);
    base.position.y = 0;
    group.add(base);

    // Articulated hydraulic suspension arm
    const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), this.chromeMat);
    arm1.position.set(0, -0.4, 0);
    group.add(arm1);

    const joint = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), this.rustMetalMat);
    joint.position.set(0, -0.8, 0);
    group.add(joint);

    const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.0, 8), this.chromeMat);
    arm2.position.set(0.35, -1.25, 0);
    arm2.rotation.z = -0.6;
    group.add(arm2);

    // Main lamp disc housing
    const discGroup = new THREE.Group();
    discGroup.position.set(0.7, -1.6, 0);
    discGroup.rotation.x = 0.2;
    discGroup.rotation.z = -0.15;

    const discDome = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.16, 24), this.chromeMat);
    discDome.castShadow = true;
    discGroup.add(discDome);

    // Handle ring for surgeon repositioning
    const handleRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.015, 8, 16), this.rustMetalMat);
    handleRing.rotation.x = Math.PI / 2;
    handleRing.position.y = -0.18;
    discGroup.add(handleRing);

    // 4 Spotlight reflector lenses inside
    const lensGeo = new THREE.CircleGeometry(0.18, 16);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0x93c5fd,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });

    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI * 2) / 4 + 0.4;
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(Math.cos(ang) * 0.35, -0.09, Math.sin(ang) * 0.35);
      discGroup.add(lens);
    }

    // SpotLight emitting downward with volumetric cone feel
    const spot = new THREE.SpotLight(0xa5f3fc, 8.0, 10.0, Math.PI / 4.5, 0.45, 1.5);
    spot.position.set(0, -0.15, 0);
    spot.target.position.set(0, -4.0, 0);
    spot.castShadow = true;
    spot.shadow.mapSize.width = 1024;
    spot.shadow.mapSize.height = 1024;
    discGroup.add(spot);
    discGroup.add(spot.target);

    group.add(discGroup);
    return group;
  }

  /**
   * 5. Stainless Steel Operating Table with hydraulic pedestal
   */
  createOperatingTable() {
    const group = new THREE.Group();

    // Heavy cast iron base
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 1.2), this.rustMetalMat);
    base.position.y = 0.06;
    base.castShadow = true;
    group.add(base);

    // Hydraulic telescoping central column
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.65, 12), this.chromeMat);
    col.position.y = 0.44;
    group.add(col);

    // Articulated stainless steel tabletop with drainage gutter rim
    const topW = 0.85;
    const topL = 2.1;
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.35,
      metalness: 0.85
    });
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(topW, 0.08, topL), tableMat);
    tableTop.position.y = 0.8;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    group.add(tableTop);

    // Restraint straps (leather straps hanging down)
    const strapGeo = new THREE.BoxGeometry(0.04, 0.35, 0.02);
    const strapMat = this.leatherMat;
    const s1 = new THREE.Mesh(strapGeo, strapMat);
    s1.position.set(-topW / 2 - 0.01, 0.65, 0.2);
    group.add(s1);

    const s2 = new THREE.Mesh(strapGeo, strapMat);
    s2.position.set(topW / 2 + 0.01, 0.65, 0.2);
    group.add(s2);

    return group;
  }

  /**
   * 6. Defibrillator Crash Cart / Emergency Trolley
   */
  createCrashCart() {
    const group = new THREE.Group();

    // Red/cream metal cabinet body
    const cartMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Emergency clinical red
      roughness: 0.6,
      metalness: 0.35
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.8, 0.5), cartMat);
    body.position.y = 0.48;
    body.castShadow = true;
    group.add(body);

    // White sliding drawers
    const drawerMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
    for (let d = 0; d < 3; d++) {
      const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.18, 0.02), drawerMat);
      drawer.position.set(0, 0.25 + d * 0.22, 0.26);
      group.add(drawer);

      // Drawer handle
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.025, 0.03), this.chromeMat);
      h.position.set(0, 0.25 + d * 0.22, 0.28);
      group.add(h);
    }

    // Top tray with defibrillator machine
    const defib = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.3), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    defib.position.set(0, 0.98, 0);
    group.add(defib);

    // Defibrillator screen with flatline readout
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x052e16,
      emissive: 0x22c55e,
      emissiveIntensity: 0.5
    });
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.14), screenMat);
    scr.position.set(-0.06, 1.0, 0.16);
    group.add(scr);

    // Oxygen tank mounted to side
    const tankGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.65, 10);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.7 });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(-0.38, 0.5, 0);
    group.add(tank);

    return group;
  }

  /**
   * 7. Nurses' Station Counter & Retro CRT Terminal
   */
  createNursesStation() {
    const group = new THREE.Group();

    // Curved reception desk / L-shaped laminate desk
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Formica laminate countertop
      roughness: 0.6,
      metalness: 0.2
    });

    const mainCounter = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.05, 0.8), deskMat);
    mainCounter.position.set(0, 1.05 / 2, 0);
    mainCounter.castShadow = true;
    mainCounter.receiveShadow = true;
    group.add(mainCounter);

    const sideCounter = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.05, 2.4), deskMat);
    sideCounter.position.set(-1.7, 1.05 / 2, 1.2);
    sideCounter.castShadow = true;
    group.add(sideCounter);

    // Raised privacy partition
    const partMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const part = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.35, 0.08), partMat);
    part.position.set(0, 1.22, -0.36);
    group.add(part);

    // 1980s Retro CRT Computer Terminal
    const crtGroup = new THREE.Group();
    crtGroup.position.set(0.6, 1.1, 0.1);

    const crtCase = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.34, 0.38), new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.8 }));
    crtCase.castShadow = true;
    crtGroup.add(crtCase);

    // Curved green phosphor monitor screen
    const crtScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.22), new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      emissive: 0x10b981,
      emissiveIntensity: 0.7,
      roughness: 0.3
    }));
    crtScreen.position.set(0, 0, 0.195);
    crtGroup.add(crtScreen);

    // Keyboard
    const kb = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.14), new THREE.MeshStandardMaterial({ color: 0x78716c }));
    kb.position.set(0, -0.15, 0.3);
    crtGroup.add(kb);

    group.add(crtGroup);

    // Metal Clipboards & Medical Charts scattered on counter
    const boardGeo = new THREE.BoxGeometry(0.24, 0.02, 0.34);
    const chartMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9 });
    const c1 = new THREE.Mesh(boardGeo, chartMat);
    c1.position.set(-0.5, 1.07, 0.1);
    c1.rotation.y = 0.35;
    group.add(c1);

    const c2 = new THREE.Mesh(boardGeo, chartMat);
    c2.position.set(-1.0, 1.07, 0.05);
    c2.rotation.y = -0.5;
    group.add(c2);

    return group;
  }

  /**
   * 8. Morgue Autopsy Table with Fluid Gutters & Dissection Sink
   */
  createAutopsyTable() {
    const group = new THREE.Group();

    // Heavy stainless steel slab with perimeter fluid drains
    const slabW = 0.9;
    const slabL = 2.2;
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.25,
      metalness: 0.9
    });

    const slab = new THREE.Mesh(new THREE.BoxGeometry(slabW, 0.1, slabL), steelMat);
    slab.position.y = 0.85;
    slab.castShadow = true;
    slab.receiveShadow = true;
    group.add(slab);

    // Integral dissection sink at one end
    const sink = new THREE.Mesh(new THREE.BoxGeometry(slabW * 0.7, 0.25, 0.35), steelMat);
    sink.position.set(0, 0.75, slabL / 2 + 0.15);
    group.add(sink);

    // Chrome gooseneck faucet
    const faucetCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0.85, slabL / 2 + 0.3),
      new THREE.Vector3(0, 1.15, slabL / 2 + 0.3),
      new THREE.Vector3(0, 1.15, slabL / 2 + 0.15),
      new THREE.Vector3(0, 1.05, slabL / 2 + 0.15)
    );
    const faucet = new THREE.Mesh(new THREE.TubeGeometry(faucetCurve, 8, 0.015, 6, false), this.chromeMat);
    group.add(faucet);

    // Heavy central pedestal column
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.8, 12), this.chromeMat);
    ped.position.y = 0.4;
    group.add(ped);

    // Drainage plumbing pipe heading into floor
    const drainPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.85, 8), this.rustMetalMat);
    drainPipe.position.set(0, 0.42, slabL / 2 + 0.2);
    group.add(drainPipe);

    return group;
  }

  /**
   * 9. Body Refrigeration Vault / Morgue Locker Wall (Stainless steel doors with numbered brass tags)
   */
  createMorgueLockers(cols = 3, rows = 3) {
    const group = new THREE.Group();
    const doorW = 0.85;
    const doorH = 0.65;
    const depth = 2.2;

    const frameW = cols * doorW + 0.1;
    const frameH = rows * doorH + 0.1;

    // Outer insulated structure
    const housing = new THREE.Mesh(new THREE.BoxGeometry(frameW, frameH, depth), this.rustMetalMat);
    housing.position.set(0, frameH / 2, -depth / 2);
    housing.castShadow = true;
    housing.receiveShadow = true;
    group.add(housing);

    // Doors
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.35,
      metalness: 0.85
    });

    let vaultNum = 101;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = -frameW / 2 + 0.05 + c * doorW + doorW / 2;
        const y = 0.05 + r * doorH + doorH / 2;

        const door = new THREE.Mesh(new THREE.BoxGeometry(doorW - 0.04, doorH - 0.04, 0.04), doorMat);
        door.position.set(x, y, 0.02);
        group.add(door);

        // Chrome pull handle & slam latch
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.04), this.chromeMat);
        handle.position.set(x + doorW * 0.32, y, 0.05);
        group.add(handle);

        // Brass identification card slot
        const cardSlot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.01), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7 }));
        cardSlot.position.set(x, y + 0.12, 0.05);
        group.add(cardSlot);

        vaultNum++;
      }
    }

    return group;
  }

  /**
   * 10. Heavy Industrial Backup Diesel Generator (Basement) - Interactive!
   */
  createDieselGenerator() {
    const group = new THREE.Group();

    // Heavy vibration isolation concrete base
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 1.4), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95 }));
    base.position.y = 0.125;
    group.add(base);

    // Massive diesel engine block (industrial yellow/dark grime)
    const engineMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Caterpillar yellow
      roughness: 0.65,
      metalness: 0.6
    });
    const block = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.9), engineMat);
    block.position.set(-0.2, 0.8, 0);
    block.castShadow = true;
    group.add(block);

    // Alternator generator head (dark cast iron cylinder)
    const alt = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.8, 16), this.rustMetalMat);
    alt.rotation.z = Math.PI / 2;
    alt.position.set(0.85, 0.75, 0);
    group.add(alt);

    // Radiator cooling fan shroud on left
    const rad = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.85), this.rustMetalMat);
    rad.position.set(-1.05, 0.75, 0);
    group.add(rad);

    // Overhead exhaust silencer & chimney pipe
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 10), this.rustMetalMat);
    exhaust.rotation.z = Math.PI / 2;
    exhaust.position.set(-0.1, 1.55, 0);
    group.add(exhaust);

    // Vertical flue pipe penetrating ceiling
    const flue = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.8, 10), this.rustMetalMat);
    flue.position.set(0.4, 2.3, 0);
    group.add(flue);

    // Electrical control switchboard panel with gauges & interactive breaker handle
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.15), this.rustMetalMat);
    panel.position.set(0.6, 1.2, 0.45);
    group.add(panel);

    // Analog dial meters
    const dialMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const dial1 = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), dialMat);
    dial1.position.set(0.5, 1.35, 0.53);
    group.add(dial1);

    const dial2 = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), dialMat);
    dial2.position.set(0.7, 1.35, 0.53);
    group.add(dial2);

    // Interactive Breaker Switch Lever
    const leverGroup = new THREE.Group();
    leverGroup.position.set(0.6, 1.05, 0.53);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.03), new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5 }));
    handle.position.y = 0.07;
    leverGroup.add(handle);
    group.add(leverGroup);

    group.userData = {
      isInteractable: true,
      type: 'generator',
      isActivated: false,
      name: 'Auxiliary Diesel Generator',
      lever: leverGroup
    };

    return group;
  }

  /**
   * 11. X-Ray Viewbox (Illuminated medical lightbox mounted on wall)
   */
  createXRayLightbox(type = 'chest') {
    const group = new THREE.Group();

    // Rusted steel casing
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.1), boxMat);
    group.add(box);

    // Illuminated X-Ray radiograph film
    const filmTex = this.texGen.getXRayTexture(type);
    const filmMat = new THREE.MeshStandardMaterial({
      map: filmTex,
      emissive: 0xffffff,
      emissiveMap: filmTex,
      emissiveIntensity: 0.75,
      roughness: 0.2
    });
    const film = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.64), filmMat);
    film.position.z = 0.055;
    group.add(film);

    // Soft cyan glow light emitted into room
    const glowLight = new THREE.PointLight(0xa5f3fc, 1.2, 3.5);
    glowLight.position.set(0, 0, 0.2);
    group.add(glowLight);

    group.userData = {
      isInteractable: true,
      type: 'xray',
      name: 'Thoracic Radiograph Viewer'
    };

    return group;
  }

  /**
   * 12. Fluorescent Ceiling Troffer (Troffer fixture with flickering lights)
   */
  createFluorescentFixture(isBroken = false) {
    const group = new THREE.Group();

    // Fixture sheet metal tray
    const trayGeo = new THREE.BoxGeometry(0.6, 0.08, 1.4);
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6, metalness: 0.5 });
    const tray = new THREE.Mesh(trayGeo, trayMat);
    group.add(tray);

    // Two fluorescent glass tubes
    const tubeGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.2, 8);
    const tube1 = new THREE.Mesh(tubeGeo, this.fluoGlassMat);
    tube1.rotation.x = Math.PI / 2;
    tube1.position.set(-0.12, -0.03, 0);
    group.add(tube1);

    let tube2;
    if (isBroken) {
      // One tube dangling down broken!
      tube2 = new THREE.Mesh(tubeGeo, this.fluoGlassMat);
      tube2.position.set(0.12, -0.3, 0.2);
      tube2.rotation.x = Math.PI / 3;
      group.add(tube2);
    } else {
      tube2 = new THREE.Mesh(tubeGeo, this.fluoGlassMat);
      tube2.rotation.x = Math.PI / 2;
      tube2.position.set(0.12, -0.03, 0);
      group.add(tube2);
    }

    // PointLight for room illumination
    const light = new THREE.PointLight(0xe0f2fe, isBroken ? 0.8 : 1.8, 8.0, 1.8);
    light.position.set(0, -0.2, 0);
    light.castShadow = true;
    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;
    group.add(light);

    group.userData = {
      isFlickering: true,
      lightSource: light,
      baseIntensity: isBroken ? 0.8 : 1.8,
      isBroken: isBroken
    };

    return group;
  }

  /**
   * 13. Overturned / Stacked Plastic Waiting Chairs
   */
  createWaitingChairs(count = 3, isTipped = false) {
    const group = new THREE.Group();
    const spacing = 0.55;

    // Steel connecting beam
    const beam = new THREE.Mesh(new THREE.BoxGeometry(count * spacing, 0.04, 0.04), this.rustMetalMat);
    beam.position.set(0, 0.38, 0);
    group.add(beam);

    // Chairs along beam
    const seatGeo = new THREE.BoxGeometry(0.44, 0.04, 0.42);
    const backGeo = new THREE.BoxGeometry(0.44, 0.42, 0.04);

    for (let i = 0; i < count; i++) {
      const x = -((count - 1) * spacing) / 2 + i * spacing;

      const seat = new THREE.Mesh(seatGeo, this.chairPlasticMat);
      seat.position.set(x, 0.42, 0.05);
      seat.castShadow = true;
      group.add(seat);

      const back = new THREE.Mesh(backGeo, this.chairPlasticMat);
      back.position.set(x, 0.65, -0.15);
      back.rotation.x = 0.12;
      back.castShadow = true;
      group.add(back);
    }

    // Support legs
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.38, 6), this.rustMetalMat);
      leg.position.set((sx * (count * spacing - 0.2)) / 2, 0.19, 0);
      group.add(leg);
    }

    if (isTipped) {
      group.rotation.x = Math.PI * 0.45;
      group.position.y = 0.15;
    }

    return group;
  }
}
