import * as THREE from 'three';

/**
 * Modular Architectural Geometry & Structural Assets
 * Creates reusable modular walls, floors, ceilings, ducts, pipes, wires, and staircases.
 */
export class ModularArchitect {
  constructor(textureGen) {
    this.texGen = textureGen;

    // Shared reusable materials
    const wallPbr = this.texGen.getHospitalWallPBR(2, 2);
    this.wallMat = new THREE.MeshStandardMaterial({
      map: wallPbr.map,
      normalMap: wallPbr.normalMap,
      roughnessMap: wallPbr.roughnessMap,
      roughness: 0.85,
      metalness: 0.05
    });

    const floorPbr = this.texGen.getHospitalFloorPBR(4, 4);
    this.floorMat = new THREE.MeshStandardMaterial({
      map: floorPbr.map,
      normalMap: floorPbr.normalMap,
      roughnessMap: floorPbr.roughnessMap,
      roughness: 0.6,
      metalness: 0.15
    });

    const ceilPbr = this.texGen.getHospitalCeilingPBR(2, 2);
    this.ceilMat = new THREE.MeshStandardMaterial({
      map: ceilPbr.map,
      roughness: 0.9,
      metalness: 0.05
    });

    const rustPbr = this.texGen.getRustMetalPBR();
    this.rustMetalMat = new THREE.MeshStandardMaterial({
      map: rustPbr.map,
      normalMap: rustPbr.normalMap,
      roughness: 0.7,
      metalness: 0.75
    });

    // Dark rubber baseboard material
    this.baseboardMat = new THREE.MeshStandardMaterial({
      color: 0x181a1c,
      roughness: 0.9,
      metalness: 0.1
    });

    // Concrete material for basement & stairs
    this.concreteMat = new THREE.MeshStandardMaterial({
      color: 0x3e4244,
      roughness: 0.95,
      metalness: 0.05
    });

    // Galvanized HVAC duct material
    this.ductMat = new THREE.MeshStandardMaterial({
      color: 0x71797e,
      roughness: 0.45,
      metalness: 0.85
    });

    // Pipe material
    this.pipeMat = new THREE.MeshStandardMaterial({
      color: 0x4a5559,
      roughness: 0.5,
      metalness: 0.8
    });

    // Broken glass material
    this.glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      transmission: 0.85,
      opacity: 0.6,
      transparent: true,
      roughness: 0.25,
      ior: 1.5,
      thickness: 0.05
    });
  }

  /**
   * Builds a solid modular wall with optional baseboard
   */
  createSolidWall(width, height, depth = 0.2) {
    const group = new THREE.Group();

    // Main wall body
    const wallGeo = new THREE.BoxGeometry(width, height, depth);
    const wallMesh = new THREE.Mesh(wallGeo, this.wallMat);
    wallMesh.position.y = height / 2;
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    group.add(wallMesh);

    // Dark rubber baseboards on both sides
    const bbHeight = 0.18;
    const bbDepth = depth + 0.02;
    const bbGeo = new THREE.BoxGeometry(width, bbHeight, bbDepth);
    const bbMesh = new THREE.Mesh(bbGeo, this.baseboardMat);
    bbMesh.position.y = bbHeight / 2;
    group.add(bbMesh);

    return group;
  }

  /**
   * Builds a wall with a hospital doorway cutout and frame
   */
  createDoorwayWall(width, height, doorWidth = 1.4, doorHeight = 2.4, depth = 0.2) {
    const group = new THREE.Group();
    const sideW = (width - doorWidth) / 2;

    // Left side pillar
    const leftGeo = new THREE.BoxGeometry(sideW, height, depth);
    const leftMesh = new THREE.Mesh(leftGeo, this.wallMat);
    leftMesh.position.set(-width / 2 + sideW / 2, height / 2, 0);
    leftMesh.castShadow = true;
    leftMesh.receiveShadow = true;
    group.add(leftMesh);

    // Right side pillar
    const rightGeo = new THREE.BoxGeometry(sideW, height, depth);
    const rightMesh = new THREE.Mesh(rightGeo, this.wallMat);
    rightMesh.position.set(width / 2 - sideW / 2, height / 2, 0);
    rightMesh.castShadow = true;
    rightMesh.receiveShadow = true;
    group.add(rightMesh);

    // Lintel above door
    const lintelH = height - doorHeight;
    const lintelGeo = new THREE.BoxGeometry(doorWidth, lintelH, depth);
    const lintelMesh = new THREE.Mesh(lintelGeo, this.wallMat);
    lintelMesh.position.set(0, height - lintelH / 2, 0);
    lintelMesh.castShadow = true;
    lintelMesh.receiveShadow = true;
    group.add(lintelMesh);

    // Metal door frame (rusted institutional look)
    const frameMat = this.rustMetalMat;
    const frameThick = 0.08;

    const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(frameThick, doorHeight, depth + 0.04), frameMat);
    frameLeft.position.set(-doorWidth / 2 + frameThick / 2, doorHeight / 2, 0);
    group.add(frameLeft);

    const frameRight = new THREE.Mesh(new THREE.BoxGeometry(frameThick, doorHeight, depth + 0.04), frameMat);
    frameRight.position.set(doorWidth / 2 - frameThick / 2, doorHeight / 2, 0);
    group.add(frameRight);

    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, frameThick, depth + 0.04), frameMat);
    frameTop.position.set(0, doorHeight - frameThick / 2, 0);
    group.add(frameTop);

    // Baseboards on pillars
    const bbHeight = 0.18;
    const bbL = new THREE.Mesh(new THREE.BoxGeometry(sideW, bbHeight, depth + 0.02), this.baseboardMat);
    bbL.position.set(-width / 2 + sideW / 2, bbHeight / 2, 0);
    group.add(bbL);

    const bbR = new THREE.Mesh(new THREE.BoxGeometry(sideW, bbHeight, depth + 0.02), this.baseboardMat);
    bbR.position.set(width / 2 - sideW / 2, bbHeight / 2, 0);
    group.add(bbR);

    return group;
  }

  /**
   * Builds an interactive hospital door (wood veneer or steel) that can swing open
   */
  createDoor(doorWidth = 1.3, doorHeight = 2.36, isAjar = false) {
    const pivot = new THREE.Group();

    // Door leaf
    const leafGeo = new THREE.BoxGeometry(doorWidth - 0.04, doorHeight - 0.04, 0.06);
    // Hospital teal-gray / scuffed brown laminate door
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x3d4b53,
      roughness: 0.7,
      metalness: 0.2
    });
    const leafMesh = new THREE.Mesh(leafGeo, doorMat);
    leafMesh.position.set(doorWidth / 2, doorHeight / 2, 0);
    leafMesh.castShadow = true;
    leafMesh.receiveShadow = true;
    pivot.add(leafMesh);

    // Institutional push plate / handle
    const handleMat = this.rustMetalMat;
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.12), handleMat);
    handle.position.set(doorWidth - 0.15, 1.0, 0);
    pivot.add(handle);

    // Small vision glass panel in door (standard hospital observation window)
    const visionW = 0.25;
    const visionH = 0.6;
    const visionFrame = new THREE.Mesh(new THREE.BoxGeometry(visionW + 0.04, visionH + 0.04, 0.08), this.rustMetalMat);
    visionFrame.position.set(doorWidth / 2, 1.5, 0);
    pivot.add(visionFrame);

    const visionGlass = new THREE.Mesh(new THREE.PlaneGeometry(visionW, visionH), this.glassMat);
    visionGlass.position.set(doorWidth / 2, 1.5, 0.045);
    pivot.add(visionGlass);

    if (isAjar) {
      pivot.rotation.y = -Math.PI * 0.42; // Ajar door creates tension and depth
    }

    pivot.userData = {
      isInteractable: true,
      type: 'door',
      isOpen: isAjar,
      targetAngle: isAjar ? -Math.PI * 0.42 : 0,
      currentAngle: isAjar ? -Math.PI * 0.42 : 0
    };

    return pivot;
  }

  /**
   * Builds a wall with a hospital window cutout & broken pane
   */
  createWindowWall(width, height, winWidth = 2.0, winHeight = 1.6, depth = 0.2) {
    const group = new THREE.Group();
    const sillH = 1.0;
    const headerH = height - sillH - winHeight;
    const sideW = (width - winWidth) / 2;

    // Sill below window
    const sillMesh = new THREE.Mesh(new THREE.BoxGeometry(width, sillH, depth), this.wallMat);
    sillMesh.position.set(0, sillH / 2, 0);
    sillMesh.castShadow = true;
    sillMesh.receiveShadow = true;
    group.add(sillMesh);

    // Header above window
    const headerMesh = new THREE.Mesh(new THREE.BoxGeometry(width, headerH, depth), this.wallMat);
    headerMesh.position.set(0, height - headerH / 2, 0);
    headerMesh.castShadow = true;
    headerMesh.receiveShadow = true;
    group.add(headerMesh);

    // Left side pillar
    const leftMesh = new THREE.Mesh(new THREE.BoxGeometry(sideW, winHeight, depth), this.wallMat);
    leftMesh.position.set(-width / 2 + sideW / 2, sillH + winHeight / 2, 0);
    leftMesh.castShadow = true;
    leftMesh.receiveShadow = true;
    group.add(leftMesh);

    // Right side pillar
    const rightMesh = new THREE.Mesh(new THREE.BoxGeometry(sideW, winHeight, depth), this.wallMat);
    rightMesh.position.set(width / 2 - sideW / 2, sillH + winHeight / 2, 0);
    rightMesh.castShadow = true;
    rightMesh.receiveShadow = true;
    group.add(rightMesh);

    // Window frame (iron/steel with mullions)
    const frameMat = this.rustMetalMat;
    const frameThick = 0.06;
    const fTop = new THREE.Mesh(new THREE.BoxGeometry(winWidth, frameThick, depth + 0.02), frameMat);
    fTop.position.set(0, sillH + winHeight - frameThick / 2, 0);
    group.add(fTop);

    const fBot = new THREE.Mesh(new THREE.BoxGeometry(winWidth, frameThick, depth + 0.02), frameMat);
    fBot.position.set(0, sillH + frameThick / 2, 0);
    group.add(fBot);

    const fMid = new THREE.Mesh(new THREE.BoxGeometry(frameThick, winHeight, depth + 0.02), frameMat);
    fMid.position.set(0, sillH + winHeight / 2, 0);
    group.add(fMid);

    // Broken dirty glass panes
    const pane1 = new THREE.Mesh(new THREE.PlaneGeometry(winWidth / 2 - 0.04, winHeight - 0.04), this.glassMat);
    pane1.position.set(-winWidth / 4, sillH + winHeight / 2, 0);
    group.add(pane1);

    // Half-broken jagged glass on right side
    const jaggedShape = new THREE.Shape();
    jaggedShape.moveTo(0, 0);
    jaggedShape.lineTo(winWidth / 2 - 0.04, 0);
    jaggedShape.lineTo(winWidth / 2 - 0.04, winHeight * 0.4);
    jaggedShape.lineTo(winWidth / 4, winHeight * 0.85);
    jaggedShape.lineTo(0, winHeight * 0.2);
    jaggedShape.closePath();
    const jaggedGeo = new THREE.ShapeGeometry(jaggedShape);
    const pane2 = new THREE.Mesh(jaggedGeo, this.glassMat);
    pane2.position.set(0.02, sillH + 0.02, 0);
    group.add(pane2);

    return group;
  }

  /**
   * Modular floor slab
   */
  createFloor(width, length) {
    const geo = new THREE.PlaneGeometry(width, length);
    const mesh = new THREE.Mesh(geo, this.floorMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Modular basement concrete floor slab
   */
  createBasementFloor(width, length) {
    const geo = new THREE.PlaneGeometry(width, length);
    const mesh = new THREE.Mesh(geo, this.concreteMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Modular ceiling with acoustic tiles
   */
  createCeiling(width, length) {
    const geo = new THREE.PlaneGeometry(width, length);
    const mesh = new THREE.Mesh(geo, this.ceilMat);
    mesh.rotation.x = Math.PI / 2;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Creates overhead utility network: HVAC galvanized ducts, water pipes, hanging wires
   */
  createCeilingUtilities(corridorLength, width = 3.0) {
    const group = new THREE.Group();

    // 1. Large rectangular HVAC duct suspended from ceiling
    const ductW = 0.7;
    const ductH = 0.4;
    const ductGeo = new THREE.BoxGeometry(ductW, ductH, corridorLength);
    const ductMesh = new THREE.Mesh(ductGeo, this.ductMat);
    ductMesh.position.set(-width * 0.25, -ductH / 2, 0);
    ductMesh.castShadow = true;
    group.add(ductMesh);

    // Duct suspension threaded rods
    const rodGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6);
    const rodMat = this.rustMetalMat;
    const numHangers = Math.floor(corridorLength / 3);
    for (let i = 0; i <= numHangers; i++) {
      const z = -corridorLength / 2 + (i / numHangers) * corridorLength;
      const r1 = new THREE.Mesh(rodGeo, rodMat);
      r1.position.set(-width * 0.25 - ductW / 2 + 0.03, -0.17, z);
      group.add(r1);

      const r2 = new THREE.Mesh(rodGeo, rodMat);
      r2.position.set(-width * 0.25 + ductW / 2 - 0.03, -0.17, z);
      group.add(r2);
    }

    // 2. Fire sprinkler / water supply pipes with valves
    const pipeGeo = new THREE.CylinderGeometry(0.04, 0.04, corridorLength, 10);
    const pipeMesh = new THREE.Mesh(pipeGeo, this.pipeMat);
    pipeMesh.rotation.x = Math.PI / 2;
    pipeMesh.position.set(width * 0.3, -0.18, 0);
    group.add(pipeMesh);

    const pipeGeo2 = new THREE.CylinderGeometry(0.03, 0.03, corridorLength, 10);
    const pipeMesh2 = new THREE.Mesh(pipeGeo2, this.rustMetalMat);
    pipeMesh2.rotation.x = Math.PI / 2;
    pipeMesh2.position.set(width * 0.38, -0.22, 0);
    group.add(pipeMesh2);

    // 3. Dangling severed electrical cables with catenary curves
    const wireMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.9
    });

    const numWires = 4;
    for (let w = 0; w < numWires; w++) {
      const startZ = -corridorLength / 2 + Math.random() * corridorLength * 0.8;
      const wireL = 1.2 + Math.random() * 1.5;
      const wireCurve = new THREE.CubicBezierCurve3(
        new THREE.Vector3((Math.random() - 0.5) * width * 0.5, 0, startZ),
        new THREE.Vector3((Math.random() - 0.5) * width * 0.4, -wireL * 0.6, startZ + 0.2),
        new THREE.Vector3((Math.random() - 0.5) * width * 0.3, -wireL * 0.9, startZ + 0.1),
        new THREE.Vector3((Math.random() - 0.5) * width * 0.2, -wireL, startZ + 0.3)
      );
      const wireGeo = new THREE.TubeGeometry(wireCurve, 12, 0.012, 5, false);
      const wireMesh = new THREE.Mesh(wireGeo, wireMat);
      group.add(wireMesh);

      // Exposed copper wires at tip
      const tipGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.06, 4);
      const copperMat = new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.9, roughness: 0.3 });
      const tip = new THREE.Mesh(tipGeo, copperMat);
      tip.position.copy(wireCurve.getPoint(1));
      group.add(tip);
    }

    return group;
  }

  /**
   * Realistic concrete institutional staircase connecting two floors
   */
  createStaircase(floorHeight = 4.0, width = 2.6, length = 6.0) {
    const group = new THREE.Group();
    const numSteps = 16;
    const stepHeight = floorHeight / numSteps;
    const stepDepth = length / numSteps;

    // Concrete steps
    for (let i = 0; i < numSteps; i++) {
      const sH = (i + 1) * stepHeight;
      const stepGeo = new THREE.BoxGeometry(width, stepHeight, stepDepth);
      const stepMesh = new THREE.Mesh(stepGeo, this.concreteMat);
      stepMesh.position.set(0, sH - stepHeight / 2, -length / 2 + i * stepDepth + stepDepth / 2);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      group.add(stepMesh);
    }

    // Metal safety handrails on both sides
    const railMat = this.rustMetalMat;
    const railHeight = 0.95;

    for (const side of [-1, 1]) {
      const xPos = side * (width / 2 - 0.1);
      // Inclined top railing
      const railCurve = new THREE.LineCurve3(
        new THREE.Vector3(xPos, railHeight, -length / 2),
        new THREE.Vector3(xPos, floorHeight + railHeight, length / 2)
      );
      const railGeo = new THREE.TubeGeometry(railCurve, 8, 0.03, 6, false);
      const railMesh = new THREE.Mesh(railGeo, railMat);
      group.add(railMesh);

      // Vertical baluster posts
      const numPosts = 5;
      for (let p = 0; p <= numPosts; p++) {
        const t = p / numPosts;
        const pZ = -length / 2 + t * length;
        const pBaseY = t * floorHeight;
        const postGeo = new THREE.CylinderGeometry(0.025, 0.025, railHeight, 6);
        const postMesh = new THREE.Mesh(postGeo, railMat);
        postMesh.position.set(xPos, pBaseY + railHeight / 2, pZ);
        group.add(postMesh);
      }
    }

    return group;
  }

  /**
   * Elevator Shaft & Rusty Sliding Doors
   */
  createElevatorLobby(doorWidth = 1.8, doorHeight = 2.5) {
    const group = new THREE.Group();

    // Outer steel elevator casing
    const frameW = doorWidth + 0.6;
    const frameH = doorHeight + 0.5;
    const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(frameW, frameH, 0.3), this.rustMetalMat);
    frameMesh.position.set(0, frameH / 2, 0);
    group.add(frameMesh);

    // Left door leaf
    const d1 = new THREE.Mesh(new THREE.BoxGeometry(doorWidth / 2, doorHeight, 0.06), this.rustMetalMat);
    d1.position.set(-doorWidth / 4 + 0.15, doorHeight / 2, 0.08); // Jammed open slightly!
    group.add(d1);

    // Right door leaf
    const d2 = new THREE.Mesh(new THREE.BoxGeometry(doorWidth / 2, doorHeight, 0.06), this.rustMetalMat);
    d2.position.set(doorWidth / 4, doorHeight / 2, 0.08);
    group.add(d2);

    // Floor indicator fixture with amber glowing '1' or 'B'
    const indBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.05), this.rustMetalMat);
    indBox.position.set(0, doorHeight + 0.2, 0.16);
    group.add(indBox);

    const indLightMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const indLight = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1), indLightMat);
    indLight.position.set(0, doorHeight + 0.2, 0.19);
    group.add(indLight);

    // Elevator call button panel with interaction metadata
    const btnPanel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.35, 0.04), this.rustMetalMat);
    btnPanel.position.set(doorWidth / 2 + 0.22, 1.2, 0.16);
    group.add(btnPanel);

    const callBtnMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x7f1d1d });
    const callBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 8), callBtnMat);
    callBtn.rotation.x = Math.PI / 2;
    callBtn.position.set(doorWidth / 2 + 0.22, 1.25, 0.19);
    group.add(callBtn);

    group.userData = {
      isInteractable: true,
      type: 'elevator',
      name: 'Elevator'
    };

    return group;
  }
}
