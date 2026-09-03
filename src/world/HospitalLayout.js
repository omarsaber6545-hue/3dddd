import * as THREE from 'three';

/**
 * Hospital Layout & World Assembler
 * Builds the 3-floor interconnected facility with modular walls, doors, props, and colliders.
 */
export class HospitalLayout {
  constructor(modularArchitect, propsLibrary, textureGen) {
    this.arch = modularArchitect;
    this.props = propsLibrary;
    this.texGen = textureGen;

    this.root = new THREE.Group();
    this.colliders = []; // Bounding boxes for collision
    this.interactables = []; // Interactive doors, generator, X-rays, elevator
    this.flickerLights = []; // Lights for flickering controller
    this.roomZones = []; // For location HUD and minimap detection
  }

  buildHospital() {
    this.buildGroundFloor();
    this.buildFirstFloor();
    this.buildBasementFloor();
    this.buildStairwellCore();

    return {
      root: this.root,
      colliders: this.colliders,
      interactables: this.interactables,
      flickerLights: this.flickerLights,
      roomZones: this.roomZones
    };
  }

  addCollider(box) {
    this.colliders.push(box);
  }

  createWallWithCollision(wallGroup, x, y, z, rotY = 0, width = 4, depth = 0.3) {
    wallGroup.position.set(x, y, z);
    wallGroup.rotation.y = rotY;
    this.root.add(wallGroup);

    // Add Box3 collider
    const cos = Math.abs(Math.cos(rotY));
    const sin = Math.abs(Math.sin(rotY));
    const sizeX = cos * width + sin * depth;
    const sizeZ = sin * width + cos * depth;

    const box = new THREE.Box3();
    box.setFromCenterAndSize(
      new THREE.Vector3(x, y + 1.8, z),
      new THREE.Vector3(sizeX, 3.6, sizeZ)
    );
    this.colliders.push(box);
  }

  /**
   * ==========================================
   * FLOOR 0: GROUND FLOOR (RECEPTION, ER, WARDS)
   * ==========================================
   */
  buildGroundFloor() {
    const y = 0;

    // Room Zone: Reception
    this.roomZones.push({
      name: 'Reception & Waiting Area',
      floor: 0,
      bounds: new THREE.Box3(new THREE.Vector3(-8, -0.5, -18), new THREE.Vector3(8, 3.8, 0))
    });

    // Room Zone: Main Corridor
    this.roomZones.push({
      name: 'Corridor Wing A',
      floor: 0,
      bounds: new THREE.Box3(new THREE.Vector3(-2.5, -0.5, 0), new THREE.Vector3(2.5, 3.8, 32))
    });

    // Room Zone: Emergency Room
    this.roomZones.push({
      name: 'Emergency & Trauma Bay',
      floor: 0,
      bounds: new THREE.Box3(new THREE.Vector3(-14, -0.5, 2), new THREE.Vector3(-2.5, 3.8, 18))
    });

    // Room Zone: Patient Ward 101
    this.roomZones.push({
      name: 'Patient Ward 101',
      floor: 0,
      bounds: new THREE.Box3(new THREE.Vector3(2.5, -0.5, 2), new THREE.Vector3(14, 3.8, 16))
    });

    // 1. Floor & Ceiling for Ground Level
    const fGround = this.arch.createFloor(32, 54);
    fGround.position.set(0, y, 10);
    this.root.add(fGround);

    const cGround = this.arch.createCeiling(32, 54);
    cGround.position.set(0, y + 3.6, 10);
    this.root.add(cGround);

    // 2. Grand Reception Hall (z: -16 to 0, x: -8 to 8)
    // North wall with broken windows
    const wRecN = this.arch.createWindowWall(16, 3.6, 3.2, 1.8);
    this.createWallWithCollision(wRecN, 0, y, -16, 0, 16);

    // East wall
    const wRecE = this.arch.createSolidWall(16, 3.6);
    this.createWallWithCollision(wRecE, 8, y, -8, Math.PI / 2, 16);

    // West wall
    const wRecW = this.arch.createSolidWall(16, 3.6);
    this.createWallWithCollision(wRecW, -8, y, -8, Math.PI / 2, 16);

    // Partition wall between Reception and Corridor (with double entrance opening)
    const wRecS1 = this.arch.createSolidWall(6, 3.6);
    this.createWallWithCollision(wRecS1, -5, y, 0, 0, 6);

    const wRecS2 = this.arch.createSolidWall(6, 3.6);
    this.createWallWithCollision(wRecS2, 5, y, 0, 0, 6);

    // Reception Counter Desk
    const recDesk = this.props.createNursesStation();
    recDesk.position.set(2.5, y, -9);
    recDesk.rotation.y = -Math.PI * 0.8;
    this.root.add(recDesk);
    this.addCollider(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(2.5, y + 0.6, -9), new THREE.Vector3(4.5, 1.2, 2.5)));

    // Waiting Chairs in Reception
    const chairs1 = this.props.createWaitingChairs(4, false);
    chairs1.position.set(-5, y, -12);
    this.root.add(chairs1);

    const chairs2 = this.props.createWaitingChairs(3, true); // Overturned
    chairs2.position.set(-4.5, y, -7);
    this.root.add(chairs2);

    // Evacuation Notice Board on Reception Wall
    const signNotice = this.texGen.getSignTexture('ST. JUDE HOSPITAL', 'EMERGENCY EVACUATION PROTOCOL', '#0369a1');
    const noticeMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), new THREE.MeshStandardMaterial({ map: signNotice, roughness: 0.8 }));
    noticeMesh.position.set(7.88, y + 1.8, -10);
    noticeMesh.rotation.y = -Math.PI / 2;
    this.root.add(noticeMesh);

    // 3. Main Long Corridor (z: 0 to 32, x: -2.0 to 2.0)
    // Overhead utility ducts and dangling wires
    const corridorUtils = this.arch.createCeilingUtilities(32, 4.0);
    corridorUtils.position.set(0, y + 3.55, 16);
    this.root.add(corridorUtils);

    // Fluorescent fixtures down the main corridor
    for (const cz of [4, 12, 20, 28]) {
      const isBroken = cz === 12 || cz === 28;
      const fluo = this.props.createFluorescentFixture(isBroken);
      fluo.position.set(0, y + 3.55, cz);
      this.root.add(fluo);
      this.flickerLights.push(fluo);
    }

    // Corridor Left (West) Walls: Entry to ER
    const cWallW1 = this.arch.createSolidWall(6, 3.6);
    this.createWallWithCollision(cWallW1, -2.0, y, 3, Math.PI / 2, 6);

    const cDoorER = this.arch.createDoorwayWall(4, 3.6, 1.4, 2.4);
    this.createWallWithCollision(cDoorER, -2.0, y, 8, Math.PI / 2, 4);

    const doorLeafER = this.arch.createDoor(1.3, 2.36, true);
    doorLeafER.position.set(-2.0, y, 7.35);
    doorLeafER.rotation.y = -Math.PI / 2;
    this.root.add(doorLeafER);
    this.interactables.push(doorLeafER);

    const cWallW2 = this.arch.createSolidWall(20, 3.6);
    this.createWallWithCollision(cWallW2, -2.0, y, 20, Math.PI / 2, 20);

    // Corridor Right (East) Walls: Entry to Patient Ward 101 & 102
    const cWallE1 = this.arch.createSolidWall(6, 3.6);
    this.createWallWithCollision(cWallE1, 2.0, y, 3, -Math.PI / 2, 6);

    const cDoorW101 = this.arch.createDoorwayWall(4, 3.6, 1.4, 2.4);
    this.createWallWithCollision(cDoorW101, 2.0, y, 8, -Math.PI / 2, 4);

    const doorLeaf101 = this.arch.createDoor(1.3, 2.36, false);
    doorLeaf101.position.set(2.0, y, 8.65);
    doorLeaf101.rotation.y = Math.PI / 2;
    this.root.add(doorLeaf101);
    this.interactables.push(doorLeaf101);

    const cWallE2 = this.arch.createSolidWall(20, 3.6);
    this.createWallWithCollision(cWallE2, 2.0, y, 20, -Math.PI / 2, 20);

    // Corridor Environmental Props: Abandoned Wheelchair & Gurney
    const corridorWheelchair = this.props.createWheelchair(false);
    corridorWheelchair.position.set(0.6, y, 14);
    corridorWheelchair.rotation.y = -0.4;
    this.root.add(corridorWheelchair);
    this.addCollider(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0.6, y + 0.5, 14), new THREE.Vector3(0.9, 1.0, 0.9)));

    const overturnedBed = this.props.createHospitalBed(true);
    overturnedBed.position.set(-0.5, y, 24);
    overturnedBed.rotation.y = 0.3;
    this.root.add(overturnedBed);
    this.addCollider(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-0.5, y + 0.6, 24), new THREE.Vector3(1.4, 1.2, 2.2)));

    // 4. Emergency Room (Trauma Bay) on West (x: -12 to -2, z: 4 to 16)
    const erWallW = this.arch.createSolidWall(12, 3.6);
    this.createWallWithCollision(erWallW, -12, y, 10, Math.PI / 2, 12);

    const erWallN = this.arch.createSolidWall(10, 3.6);
    this.createWallWithCollision(erWallN, -7, y, 4, 0, 10);

    const erWallS = this.arch.createSolidWall(10, 3.6);
    this.createWallWithCollision(erWallS, -7, y, 16, 0, 10);

    // ER Props: Crash Cart, Defibrillator, Gurneys, IV stands
    const crashCart = this.props.createCrashCart();
    crashCart.position.set(-10, y, 7);
    crashCart.rotation.y = 0.5;
    this.root.add(crashCart);
    this.addCollider(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-10, y + 0.6, 7), new THREE.Vector3(0.8, 1.2, 0.7)));

    const erBed1 = this.props.createHospitalBed(false);
    erBed1.position.set(-7, y, 7);
    erBed1.rotation.y = Math.PI / 2;
    this.root.add(erBed1);
    this.addCollider(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-7, y + 0.6, 7), new THREE.Vector3(2.3, 1.2, 1.2)));

    const erBed2 = this.props.createHospitalBed(false);
    erBed2.position.set(-7, y, 13);
    erBed2.rotation.y = Math.PI / 2;
    this.root.add(erBed2);
    this.addCollider(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-7, y + 0.6, 13), new THREE.Vector3(2.3, 1.2, 1.2)));

    const ivStand = this.props.createIVStand();
    ivStand.position.set(-5.5, y, 6.2);
    this.root.add(ivStand);

    // 5. Patient Ward 101 on East (x: 2 to 12, z: 4 to 16)
    const pwWallE = this.arch.createWindowWall(12, 3.6, 2.2, 1.6);
    this.createWallWithCollision(pwWallE, 12, y, 10, -Math.PI / 2, 12);

    const pwWallN = this.arch.createSolidWall(10, 3.6);
    this.createWallWithCollision(pwWallN, 7, y, 4, 0, 10);

    const pwWallS = this.arch.createSolidWall(10, 3.6);
    this.createWallWithCollision(pwWallS, 7, y, 16, 0, 10);

    const wardBed = this.props.createHospitalBed(false);
    wardBed.position.set(7.5, y, 8);
    this.root.add(wardBed);
    this.addCollider(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(7.5, y + 0.6, 8), new THREE.Vector3(1.2, 1.2, 2.3)));

    const wardIV = this.props.createIVStand();
    wardIV.position.set(6.6, y, 7);
    this.root.add(wardIV);
  }

  /**
   * ==========================================
   * FLOOR 1: FIRST FLOOR (OPERATING ROOM & ICU)
   * ==========================================
   */
  buildFirstFloor() {
    const y = 4.0;

    // Room Zone: Operating Room
    this.roomZones.push({
      name: 'Operating Theater A',
      floor: 1,
      bounds: new THREE.Box3(new THREE.Vector3(-14, 3.5, 4), new THREE.Vector3(-2.5, 7.8, 20))
    });

    // Room Zone: ICU
    this.roomZones.push({
      name: 'Intensive Care Unit (ICU)',
      floor: 1,
      bounds: new THREE.Box3(new THREE.Vector3(2.5, 3.5, 4), new THREE.Vector3(14, 7.8, 20))
    });

    // Room Zone: Surgical Corridor
    this.roomZones.push({
      name: 'Surgical Wing Corridor',
      floor: 1,
      bounds: new THREE.Box3(new THREE.Vector3(-2.5, 3.5, 0), new THREE.Vector3(2.5, 7.8, 32))
    });

    // Floor and Ceiling for Level 1
    const fL1 = this.arch.createFloor(32, 54);
    fL1.position.set(0, y, 10);
    this.root.add(fL1);

    const cL1 = this.arch.createCeiling(32, 54);
    cL1.position.set(0, y + 3.6, 10);
    this.root.add(cL1);

    // Corridor walls
    const cWallW = this.arch.createSolidWall(32, 3.6);
    this.createWallWithCollision(cWallW, -2.0, y, 16, Math.PI / 2, 32);

    const cWallE = this.arch.createSolidWall(32, 3.6);
    this.createWallWithCollision(cWallE, 2.0, y, 16, -Math.PI / 2, 32);

    // Fluorescent lights for Level 1 (dimmer, colder ambiance)
    for (const cz of [6, 18, 26]) {
      const fluo = this.props.createFluorescentFixture(true);
      fluo.position.set(0, y + 3.55, cz);
      this.root.add(fluo);
      this.flickerLights.push(fluo);
    }

    // Operating Room A on West (x: -12 to -2, z: 6 to 18)
    const orWallW = this.arch.createSolidWall(12, 3.6);
    this.createWallWithCollision(orWallW, -12, y, 12, Math.PI / 2, 12);

    const orWallN = this.arch.createSolidWall(10, 3.6);
    this.createWallWithCollision(orWallN, -7, y, 6, 0, 10);

    const orWallS = this.arch.createSolidWall(10, 3.6);
    this.createWallWithCollision(orWallS, -7, y, 18, 0, 10);

    // Entrance opening to OR
    const orDoor = this.arch.createDoor(1.4, 2.4, true);
    orDoor.position.set(-2.0, y, 10);
    orDoor.rotation.y = -Math.PI / 2;
    this.root.add(orDoor);
    this.interactables.push(orDoor);

    // Centered Operating Table
    const opTable = this.props.createOperatingTable();
    opTable.position.set(-7, y, 12);
    this.root.add(opTable);
    this.addCollider(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-7, y + 0.6, 12), new THREE.Vector3(1.2, 1.2, 2.4)));

    // Overhead 4-dish surgical lamp suspended right above the operating table!
    const surgLamp = this.props.createSurgicalLamp();
    surgLamp.position.set(-7, y + 3.55, 12);
    this.root.add(surgLamp);

    // Wall-mounted illuminated X-ray lightbox (chest trauma radiograph)
    const xrayChest = this.props.createXRayLightbox('chest');
    xrayChest.position.set(-11.92, y + 1.8, 12);
    xrayChest.rotation.y = Math.PI / 2;
    this.root.add(xrayChest);
    this.interactables.push(xrayChest);

    // Crash cart in corner
    const orCart = this.props.createCrashCart();
    orCart.position.set(-10.5, y, 7.5);
    this.root.add(orCart);
  }

  /**
   * ==========================================
   * FLOOR -1: BASEMENT (MORGUE & GENERATOR ROOM)
   * ==========================================
   */
  buildBasementFloor() {
    const y = -4.0;

    // Room Zone: Morgue
    this.roomZones.push({
      name: 'Morgue & Cold Storage',
      floor: -1,
      bounds: new THREE.Box3(new THREE.Vector3(-14, -4.5, 4), new THREE.Vector3(-2.5, -0.2, 20))
    });

    // Room Zone: Boiler & Generator
    this.roomZones.push({
      name: 'Power Plant & Generator',
      floor: -1,
      bounds: new THREE.Box3(new THREE.Vector3(2.5, -4.5, 4), new THREE.Vector3(14, -0.2, 20))
    });

    // Room Zone: Basement Corridor
    this.roomZones.push({
      name: 'Basement Sub-Level',
      floor: -1,
      bounds: new THREE.Box3(new THREE.Vector3(-2.5, -4.5, 0), new THREE.Vector3(2.5, -0.2, 32))
    });

    // Concrete Floor & Ceiling
    const fBasement = this.arch.createBasementFloor(32, 54);
    fBasement.position.set(0, y, 10);
    this.root.add(fBasement);

    const cBasement = this.arch.createCeiling(32, 54);
    cBasement.position.set(0, y + 3.6, 10);
    this.root.add(cBasement);

    // Basement dark concrete walls
    const bWallW = this.arch.createSolidWall(32, 3.6);
    this.createWallWithCollision(bWallW, -2.0, y, 16, Math.PI / 2, 32);

    const bWallE = this.arch.createSolidWall(32, 3.6);
    this.createWallWithCollision(bWallE, 2.0, y, 16, -Math.PI / 2, 32);

    // Heavy steam pipes running across basement ceiling
    const bPipes = this.arch.createCeilingUtilities(32, 3.6);
    bPipes.position.set(0, y + 3.55, 16);
    this.root.add(bPipes);

    // Dim emergency red lights in basement
    for (const bz of [8, 22]) {
      const redLight = new THREE.PointLight(0xef4444, 1.2, 6.0, 2);
      redLight.position.set(0, y + 3.2, bz);
      this.root.add(redLight);
    }

    // 1. Morgue Suite on West (x: -12 to -2, z: 6 to 18)
    const mWallW = this.arch.createSolidWall(12, 3.6);
    this.createWallWithCollision(mWallW, -12, y, 12, Math.PI / 2, 12);

    const mWallN = this.arch.createSolidWall(10, 3.6);
    this.createWallWithCollision(mWallN, -7, y, 6, 0, 10);

    const mWallS = this.arch.createSolidWall(10, 3.6);
    this.createWallWithCollision(mWallS, -7, y, 18, 0, 10);

    // Autopsy Table in center of morgue
    const autopsy = this.props.createAutopsyTable();
    autopsy.position.set(-7, y, 12);
    this.root.add(autopsy);
    this.addCollider(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-7, y + 0.6, 12), new THREE.Vector3(1.2, 1.2, 2.6)));

    // 3x3 Body Refrigeration Vault Locker Wall
    const lockers = this.props.createMorgueLockers(3, 3);
    lockers.position.set(-7, y, 6.2);
    this.root.add(lockers);
    this.addCollider(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(-7, y + 1.2, 6.2), new THREE.Vector3(3.0, 2.4, 1.5)));

    // Skull X-ray on morgue wall
    const xraySkull = this.props.createXRayLightbox('skull');
    xraySkull.position.set(-11.92, y + 1.8, 12);
    xraySkull.rotation.y = Math.PI / 2;
    this.root.add(xraySkull);
    this.interactables.push(xraySkull);

    // 2. Auxiliary Generator & Boiler Plant on East (x: 2 to 12, z: 6 to 18)
    const genWallE = this.arch.createSolidWall(12, 3.6);
    this.createWallWithCollision(genWallE, 12, y, 12, -Math.PI / 2, 12);

    const genWallN = this.arch.createSolidWall(10, 3.6);
    this.createWallWithCollision(genWallN, 7, y, 6, 0, 10);

    const genWallS = this.arch.createSolidWall(10, 3.6);
    this.createWallWithCollision(genWallS, 7, y, 18, 0, 10);

    // Massive Interactive Backup Diesel Generator!
    const generator = this.props.createDieselGenerator();
    generator.position.set(7.5, y, 12);
    this.root.add(generator);
    this.interactables.push(generator);
    this.addCollider(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(7.5, y + 1.0, 12), new THREE.Vector3(3.0, 2.2, 2.0)));
  }

  /**
   * ==========================================
   * STAIRWELL & ELEVATOR SHAFT (CONNECTS ALL FLOORS)
   * ==========================================
   */
  buildStairwellCore() {
    // Located at the end of the main corridor (z = 32 to 42, x = -6 to 6)
    const zBase = 32;

    // Room Zone: Stairwell Lobby
    this.roomZones.push({
      name: 'Central Stairwell & Elevator Lobby',
      floor: 0,
      bounds: new THREE.Box3(new THREE.Vector3(-6, -4.5, 32), new THREE.Vector3(6, 8.0, 44))
    });

    // Enclosing perimeter walls
    for (let f = -1; f <= 1; f++) {
      const y = f * 4.0;
      const wBack = this.arch.createSolidWall(12, 3.6);
      this.createWallWithCollision(wBack, 0, y, 42, 0, 12);

      const wLeft = this.arch.createSolidWall(10, 3.6);
      this.createWallWithCollision(wLeft, -6, y, 37, Math.PI / 2, 10);

      const wRight = this.arch.createSolidWall(10, 3.6);
      this.createWallWithCollision(wRight, 6, y, 37, -Math.PI / 2, 10);

      // Elevator front on right side of lobby
      const elev = this.arch.createElevatorLobby(1.8, 2.5);
      elev.position.set(3.5, y, 41.6);
      this.root.add(elev);
      this.interactables.push(elev);
    }

    // Concrete Staircase 1: Ground Floor (y:0) to 1st Floor (y:4.0)
    const stairsUp = this.arch.createStaircase(4.0, 2.4, 7.0);
    stairsUp.position.set(-2.5, 0, 34);
    this.root.add(stairsUp);

    // Concrete Staircase 2: Basement (y:-4.0) to Ground Floor (y:0)
    const stairsDown = this.arch.createStaircase(4.0, 2.4, 7.0);
    stairsDown.position.set(-2.5, -4.0, 34);
    this.root.add(stairsDown);
  }
}
