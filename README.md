# St. Jude Memorial Hospital - 3D Abandoned Horror Environment

A highly detailed, game-ready **3D abandoned hospital environment** for a psychological horror game, built with **Three.js** and **Vite**.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Three.js](https://img.shields.io/badge/Three.js-WebGL-black.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 🏥 Environment Features

### 3 Interconnected Floors
1. **Ground Floor (Level 0)**:
   - **Grand Reception & Waiting Area**: Curved reception desk, 1980s CRT terminal, scattered clinical folders, quarantine notices, rows of molded plastic waiting chairs.
   - **Main Corridor (Wing A)**: 32m long corridor with dangling severed electrical cables, suspended galvanized HVAC ducting, water puddles, overturned wheelchair, and abandoned gurney.
   - **Emergency Room (Trauma Bay)**: Defibrillator crash cart, oxygen tanks, hospital beds with IV drip stands.
   - **Patient Ward 101**: Hospital beds with dirty mattresses and broken window frames leaking moonlight.
2. **First Floor (Level 1)**:
   - **Surgical Wing Corridor**: Cold, desaturated horror atmosphere.
   - **Operating Theater A**: Hydraulic stainless steel surgical table with restraint straps, giant articulated 4-dish overhead surgical spotlight chandelier, illuminated thoracic trauma X-ray lightbox.
   - **Intensive Care Unit (ICU)** & **Nurses' Station**: Patient monitors, medicine cabinets, clipboards.
3. **Basement (Sub-Level -1)**:
   - **Morgue & Autopsy Suite**: Stainless steel autopsy slab with fluid gutters and dissection sink, 3x3 refrigerated body vault lockers with numbered brass tags, cranial trauma X-ray.
   - **Power Plant & Boiler Room**: Massive auxiliary diesel backup generator with interactive starter lever, industrial steam pipes, and damp water reflections.

---

## 🕹️ Controls & Interaction

| Control | Action |
| --- | --- |
| **W / A / S / D** | Move / Walk |
| **Shift** | Sprint |
| **C** / **Ctrl** | Crouch |
| **Mouse** | Look around (Pointer Lock) |
| **F** | Toggle Flashlight on / off |
| **E** | Interact (Doors, Generator, X-Rays, Elevator) |
| **M** | Open Emergency Evacuation Blueprint Map |
| **N** | Free-Camera Spectator Mode |
| **Enter / Space / Click** | Start Exploration |

---

## ⚡ Technical Highlights

- **Procedural PBR Texture Generator**: Peeling paint, cracked plaster, stained floor tiles with wet puddle specular roughness, acoustic ceiling tiles, and oxidized rusted steel.
- **Native Web Audio API Engine**: Procedural sub-bass horror drone, electrical fluorescent buzzing synchronized with light flickers, surface-differentiated footsteps (linoleum tile vs. concrete), water drips, and heavy diesel engine rumble.
- **Dynamic Lighting & Atmosphere**: Camera-following flashlight with volumetric cone light shaft, PCF soft shadows, exponential horror fog, and 2,500 swirling 3D dust motes.
- **Interactive Blueprint Minimap**: Real-time player tracking across all 3 floors with room annotations and emergency points of interest.

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/omarsaber6545-hue/3dddd.git
cd 3dddd
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run development server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for production
```bash
npm run build
```
