# 🔬 Gem Bot Faceting Machine System

## Overview

Complete automated gem faceting machine simulation with realistic X/Y axis control, dop stick movement, grinding wheel with colored laps, and G-code generation that mirrors your physical machine.

## System Components

### 1. **facetProcessor.js** - Control Logic & G-Code Generation
- Manages facet designs and cutting sequences
- Generates G-code for CNC faceting machines
- Handles dop stick positioning (X/Y/Z axes)
- Lap management (different grits)
- Custom design creation

### 2. **simulation.js** - 3D Visualization
- Realistic 3D rendering of faceting machine
- **Dop stick** with gem stone at tip
- **X-axis rail** for horizontal movement
- **Y-axis rail** for raising/lowering stone
- **Grinding wheel** with colored lap surfaces
- Real-time animation of cutting process

### 3. **facetingControls.js** - User Interface
- Design selection dropdown
- Automated cutting controls
- Manual X/Y axis movement buttons
- Lap selection (grit levels)
- Index rotation controls
- Progress tracking
- Custom design editor

### 4. **facetingMachineInit.js** - System Initialization
- Auto-loads all dependencies
- Sets up keyboard controls
- Creates help system
- Manages component integration

## Key Features

### ✅ X/Y Axis Movement
- **X-Axis**: Moves dop stick left/right (±30mm range)
- **Y-Axis**: Raises/lowers stone toward grinding wheel (0-50mm)
  - Y=50: Raised (safe) position
  - Y=0: Touching wheel surface
  - Precise control for accurate faceting

### ✅ Dop Stick System
- Metal rod holds gem stone at tip
- Moves with X/Y axes as one unit
- Rotates for index positioning
- Mirrors physical machine behavior

### ✅ Grinding Wheel with Colored Laps
Each color represents a different grit level:
- **Brown** (#8B4513) - Coarse (80 grit)
- **Sienna** (#A0522D) - Medium (260 grit)
- **Peru** (#CD853F) - Fine (600 grit)
- **Tan** (#DEB887) - Pre-Polish (1200 grit)
- **Beige** (#F5F5DC) - Polish (3000 grit / diamond)

### ✅ Automated Cutting
- Pre-programmed designs (Brilliant, Emerald, Princess cuts)
- Step-by-step automated sequences
- Progress tracking with visual feedback
- Real-time lap changes
- Index rotation for each facet

### ✅ Custom Design Creation
- JSON-based facet definition
- Define angles, index positions, and lap sequences
- Save and load custom designs
- Export/import capabilities

### ✅ G-Code Generation
Generates CNC machine code including:
- Axis movements (X, Y, Z, A for rotation, B for angle)
- Tool changes (T1-T5 for different laps)
- Spindle control (M3/M5 for wheel on/off)
- Dwell times for cutting
- Complete cutting sequences

## Keyboard Controls

| Key | Action |
|-----|--------|
| **W** or **↑** | Raise dop stick (Y-axis up) |
| **S** or **↓** | Lower dop stick (Y-axis down) |
| **A** or **←** | Move dop stick left (X-axis) |
| **D** or **→** | Move dop stick right (X-axis) |
| **Q** | Rotate index counter-clockwise (-15°) |
| **E** | Rotate index clockwise (+15°) |

## Usage

### Automated Cutting (Recommended)
1. Open Laboratory page
2. Select a design from dropdown (Brilliant, Emerald, Princess)
3. Click "Start Automated Cut"
4. Watch the machine cut each facet automatically
5. Machine will change laps and rotate as needed

### Manual Control (Advanced)
1. Use keyboard or control panel buttons
2. Move X/Y axes to position stone
3. Select appropriate lap (grit) for operation
4. Rotate index to desired angle
5. Lower Y-axis to contact wheel

### Custom Design
1. Click "Create Custom Design" button
2. Enter design name and gem type
3. Provide JSON facet array:
```json
[
  {
    "angle": 40.75,
    "index": 96,
    "cut": "pavilion_main",
    "lap": "coarse"
  },
  {
    "angle": 34.50,
    "index": 96,
    "cut": "crown_main",
    "lap": "fine"
  }
]
```
4. Save design and run automated cut

## Pre-Programmed Designs

### Standard Brilliant Cut
- 9 facets (pavilion, crown, table)
- Diamond optimized
- ~45 minute cutting time
- Professional quality

### Emerald Step Cut
- 6 facets (step cut pattern)
- Emerald optimized
- ~30 minute cutting time
- Classic rectangular shape

### Princess Cut
- 5 facets (modern square cut)
- Various gem types
- ~35 minute cutting time
- Popular modern design

## Technical Specifications

### Machine Dimensions
- Base: 100mm × 60mm platform
- Y-Axis Rail: 80mm vertical travel
- X-Axis Rail: 70mm horizontal travel
- Grinding Wheel: 40mm diameter

### Movement Ranges
- X-Axis: -30mm to +30mm
- Y-Axis: 0mm (touching) to 50mm (raised)
- Index Rotation: 0° to 360° (continuous)
- Cutting Angle: 0° to 45° typical

### Wheel Specifications
- Idle Speed: 100 RPM (visualization)
- Cutting Speed: 1500 RPM (automated)
- Lap Diameter: 40mm
- 5 different grit levels

## API Reference

### FacetProcessor Class
```javascript
const processor = new FacetProcessor();

// Load design
processor.loadDesign('brilliant');

// Generate G-code
const gcode = processor.generateGCode(design);

// Create custom design
processor.createCustomDesign(name, facets, gemType);

// Manual movement
processor.moveDopStick(indexAngle, cutAngle, distance);
processor.moveX(delta);
processor.moveY(delta);

// Get machine state
const state = processor.getMachineState();
```

### FacetingMachineSimulation Class
```javascript
const machine = new FacetingMachineSimulation('container-id');

// Movement
machine.moveDopStick(x, y);
machine.rotateGemIndex(angle);

// Lap control
machine.changeLapColor('fine');
machine.rotateWheel(speed);

// Automated cutting
await machine.startAutomatedCutting('brilliant');
machine.stopCutting();
```

## Integration with Physical Machine

The G-code generated by this system is compatible with standard CNC faceting machines that support:
- **X/Y/Z** linear axes (mm units)
- **A-axis** for rotation/indexing (degrees)
- **B-axis** for cutting angle (degrees)
- **T1-T5** tool changes for lap switching
- **M3/M5** spindle control

### Example G-Code Output
```gcode
G21 ; Set units to millimeters
G90 ; Absolute positioning
G28 ; Home all axes

; Facet 1: pavilion_main at 40.75° / 96 index
; Lap: coarse (80 grit)
G0 Z50 ; Raise dop stick
G0 A96 ; Rotate to index 96
G0 B40.75 ; Set angle to 40.75°
M6 T1 ; Change to coarse lap
M3 S1500 ; Start wheel at 1500 RPM
G1 Z10 F100 ; Lower to approach height
G1 Z0 F20 ; Lower to cutting depth slowly
G4 P2 ; Dwell 2 seconds for cutting
G0 Z50 ; Raise dop stick

; ... additional facets ...

M5 ; Stop wheel
G28 ; Return home
M30 ; Program end
```

## Troubleshooting

### Machine not visible
- Ensure THREE.js is loaded
- Check browser console for errors
- Verify container element exists

### Controls not responding
- Refresh page and wait for full load
- Check if keyboard focus is on page
- Try manual buttons instead of keyboard

### Automated cutting doesn't start
- Select a design first from dropdown
- Ensure machine is not already running
- Check console for error messages

## Files Created

1. `/public/facetProcessor.js` - Core logic (13KB)
2. `/public/simulation.js` - 3D visualization (15KB)
3. `/public/facetingControls.js` - UI controls (14KB)
4. `/public/facetingMachineInit.js` - Initialization (6KB)
5. `FACETING_MACHINE_README.md` - This documentation

## Future Enhancements

- [ ] Real-time connection to physical machine via USB/Serial
- [ ] Computer vision for gem measurement
- [ ] Advanced facet diagram import (GemCAD format)
- [ ] Multi-gem batch processing
- [ ] Wear tracking for laps
- [ ] Cost estimation per cut
- [ ] 3D preview of finished gem

## Support

For issues or questions about the faceting machine system, refer to:
- Console logs for debugging
- Help modal (? button in UI)
- This README for technical details

---

**Status**: ✅ Fully Operational
**Version**: 1.0.0
**Last Updated**: 2025
**Mirrors Physical Machine**: Yes
**G-Code Compatible**: Yes
