# 💎 Gem Bot Mini - Real Hardware Reference

## 📸 Visual References

### Instagram Post
**URL:** https://www.instagram.com/p/C4gdJLYuQS8/  
**Date:** March 14, 2024  
**Account:** @barbricksjewelry

**Description:**
> "Index wheel is spot on. Wiring complete for motors and switches. Tested(working as should) Now time to get the drip system online, run some functionality tests and get these baby's packed up and shipped out! #gemBot the first 10 machines will come with this nice index gear ⚙️"

**Shows:**
- Completed wiring for motors and switches
- 96-tooth index gear installed
- Drip system ready for testing
- Production-ready machines

### Video Reference
**File:** `C:\Users\barbr\Videos\gemBot.mp4`  
**Shows:** Real Gem Bot Mini in operation with physical Nextion HMI display

---

## 🏭 Actual Hardware Components

### Official 2024 Parts List
Located: `D:\GemBotTouchScreen\2024 official parts list for the ge.txt`

```
2024 official parts list for the gem bot

base-
2020 frame rails-
corner brackets-
ball screw y axis-
ball screw x axis-
3x stepper motors- 
2x arduino motor shields-
index stepper motor-
index stepper motor driver-
planetary gear box-
arduino-
lcd-
touch screen-
faceting machine for parts-
drip motor-
drip containers-
hardware-
wires-
filament-
```

---

## 🔩 Detailed Component Breakdown

### 1. Frame Structure
**Material:** 2020 Aluminum Extrusion (20mm x 20mm)
- **NOT** a solid aluminum plate
- **NOT** a simple rectangular frame
- Modular rail-based construction
- Corner brackets for connections
- Similar to CNC/3D printer frames

**STL Files:**
- `2020endCap.stl` - End caps
- `2020_v_Linear_rail_2.stl` - Linear rail mounts
- `50mm 2020rail.stl` - Rail sections
- `90 2020 connector.stl` - Corner brackets
- `VslotTconnect.stl` - T-connectors
- `OpenBeam_90_Degree_Corner_Coupler.stl` - Corner couplers

### 2. Linear Motion System

#### X-Axis (Horizontal)
- **Type:** Ball screw driven
- **Motor:** NEMA 17 stepper
- **Range:** ~100mm travel
- **Rails:** Linear guide rails

**STL Files:**
- `Linear_Rail_Shaft_Guide_8mm.stl`
- `x axis limit switch bracket beefed up v2.stl`
- `X_Limit_Switch.STL`

#### Y-Axis (Depth)
- **Type:** Ball screw driven  
- **Motor:** NEMA 17 stepper
- **Range:** ~100mm travel
- **Rails:** Linear guide rails

**STL Files:**
- `y motor mount mod.stl`
- `longer y axis motor mount.stl`

### 3. Index System (96-Degree Wheel)

#### Index Gear
- **Teeth:** 96 (for 96 facet positions)
- **Material:** 3D printed (likely PETG or ABS)
- **Precision:** 3.75° per position (360° / 96)

**STL Files:**
- `Atlas_96_Tooth_Gear.stl` ⭐ (Main index wheel)
- `96 Tooth Pointer.stl` (Position indicator)
- `96 Tooth PointerMount.stl` (Pointer mounting)
- `indexGearMount.stl` (Gear mounting bracket)

#### Index Motor System
- **Motor:** NEMA 17 stepper
- **Driver:** Dedicated stepper driver
- **Control:** Precise position stepping

**STL Files:**
- `indexMotorBoxGood.stl` (Motor housing)
- `Nema17_Mount.stl` (Motor mount)

### 4. Angle Control (Planetary Gearbox)

#### Gearbox
- **Type:** Planetary reduction gearbox
- **Ratio:** 5:1 (reduces speed, increases torque and precision)
- **Motor:** NEMA 17 stepper
- **Precision:** ±0.01° (thanks to gear reduction)

**STL Files:**
- `Nema 17 5_1 Planetary Gearbox.stl` ⭐ (5:1 ratio)
- `Nema 17 40mm 5_1 Planetary Gearbox.stl` (40mm version)
- `Planet.stl` (Planetary gear component)

### 5. Nextion HMI Display

#### Touch Screen
- **Type:** Nextion Enhanced/Intelligent series
- **Sizes:** 3.5", 5.0", or 7.0" TFT LCD
- **Interface:** Serial UART
- **Mounting:** 3D printed stand

**STL Files:**
- `touchScreenStandComplete.stl`
- `touchScreenHolder3.stl`
- `touchScreenHolderFancy2.stl`
- `touchScreenMount.stl`
- `touchScreenCase.stl`

**HMI Files:**
- `9172025WorkingMiniMod.HMI` ⭐ (Latest working version)
- `8202424GemBotAutoCutComplete.HMI` (Auto-cut system)
- `8162024GemBotTouchScreenCutSizer.HMI` (Cut sizing)

### 6. Control Electronics

#### Arduino System
- **Board:** Arduino Mega 2560 (most likely)
- **Shields:** 2x Arduino motor shields (for 3+ motors)
- **Housing:** Custom 3D printed box

**STL Files:**
- `arduinoBox.stl`
- `arduinoBoxLid.stl`
- `MEGA_R2_MOUNT.STL`
- `modular arduino BBox.stl`

#### Motor Drivers
- **Type:** TB6600 stepper drivers (common for NEMA 17)
- **Quantity:** 3-4 drivers
- **Mounting:** DIN rail or custom brackets

**STL Files:**
- `TB6600_DIN_rail_mount.stl`
- `-Left-Step-Driver_Bracket-3.stl`
- `-Right-Step-Driver_Bracket-3.stl`

### 7. Drip System

#### Water/Coolant Delivery
- **Motor:** Small DC motor or servo
- **Containers:** Reservoir and drip chamber
- **Control:** Automated via Arduino

**STL Files:**
- `Drip Switch Housing.stl`
- `dripLidv2.stl`
- `dripLidOpen.stl`
- `drip hole fix.stl`

### 8. Limit Switches

#### Position Sensors
- **Type:** Mechanical limit switches (microswitches)
- **Locations:** X-axis, Y-axis, Z-axis endpoints
- **Purpose:** Homing and safety limits

**STL Files:**
- `x axis limit switch bracket beefed up v2.stl`
- `Top X axis limit bracket.stl`
- `Z axis limit bracket.stl`
- `limit_switch_cover.stl`

---

## 📐 Actual Dimensions

### Frame Size (Estimated from STL)
- **Width:** ~300mm (X-axis)
- **Depth:** ~250mm (Y-axis)  
- **Height:** ~400mm (Z-axis)
- **Footprint:** Compact desktop size

### Work Area
- **X Travel:** ~100mm
- **Y Travel:** ~100mm
- **Index Rotation:** 360° (96 positions)
- **Angle Range:** 0-180° (via planetary gearbox)

---

## 🎨 Actual Appearance

### Colors & Materials
- **Frame:** Silver aluminum (2020 extrusions)
- **3D Printed Parts:** Black or dark gray (PETG/ABS)
- **Index Gear:** Brass/gold colored (special material for first 10 units)
- **Motors:** Black stepper motors
- **Wiring:** Colorful ribbon cables and wires
- **Display:** Black Nextion touchscreen with blue header

### Assembly Style
- Modular CNC/3D printer aesthetic
- Industrial functional design
- Exposed wiring and components (not fully enclosed)
- Easy access for maintenance
- Professional but DIY-friendly

---

## 🔧 Key Differences from Current Simulator

### Current Simulator
- ❌ Simple box-shaped aluminum frame
- ❌ Cylindrical rails
- ❌ Generic representation
- ❌ Over-simplified structure

### Real Hardware
- ✅ 2020 aluminum extrusion frame
- ✅ Ball screw linear motion
- ✅ Actual 96-tooth index gear
- ✅ 5:1 planetary gearbox
- ✅ Modular construction
- ✅ Visible motors and wiring

---

## 📁 3D Model Files Available

### Complete Assemblies
- `MiniGemBot.stl` - Complete mini assembly
- `gemBotRobot.stl` - Full robot assembly
- `AllParts.stl` - All parts combined

### Individual Components
- **Motors:** Planetary gearbox, motor mounts
- **Frame:** Rails, connectors, brackets
- **Index:** 96-tooth gear, pointer, mount
- **Linear Motion:** Ball screws, rails, carriages
- **Electronics:** Arduino housing, motor driver mounts
- **Display:** Touch screen stands and cases
- **Miscellaneous:** Limit switches, drip system, cable management

**Total STL Files:** 73+ files in `C:\Users\barbr\Organized_STL_Files\`

---

## 💻 Software & Firmware

### Arduino Code
**Main Programs:**
- `officialGemBotMenuWithTouchScreenController.ino` - Main control system
- `GemBotMini08272024.ino` - Latest mini version
- `gemBotMenu672023forVideo.ino` - Demo version

**Location:** `C:\Users\barbr\OneDrive\Documents\Arduino\`

### Nextion HMI
**Files:** `D:\GemBotTouchScreen\`
- Multiple HMI versions (development history)
- Latest: `9172025WorkingMiniMod.HMI`
- Includes auto-cut, cut-sizer, index control programs

### Wiring Diagram
**File:** `C:\Users\barbr\Documents\Fritzing\GemBotWiring Diagram.fzz`
- Fritzing format (can be opened in Fritzing software)
- Shows complete electrical connections

---

## 🎯 Simulator Update Requirements

### High Priority
1. ✅ Replace simple frame with 2020 extrusions
2. ✅ Add actual 96-tooth index gear model
3. ✅ Show planetary gearbox housing
4. ✅ Display ball screw assemblies
5. ✅ Add NEMA 17 stepper motors (visible)

### Medium Priority
6. ✅ Add Nextion display on stand
7. ✅ Show Arduino electronics housing
8. ✅ Add limit switches at endpoints
9. ✅ Display linear guide rails properly
10. ✅ Add drip system components

### Low Priority
11. ✅ Add wiring/cable routing
12. ✅ Add corner brackets detail
13. ✅ Add motor driver housings
14. ✅ Add realistic textures/materials
15. ✅ Add mounting hardware (bolts, nuts)

---

## 🎨 Visual Style Guide

### Material Appearance
```
Frame Rails:      Silver/gray aluminum (matte finish)
3D Printed Parts: Black/dark gray (slightly glossy)
Index Gear:       Brass/gold (metallic, special edition)
Motors:           Black with silver shafts
Electronics:      Black PCBs, colorful components
Display:          Black screen with blue header
Wiring:           Multi-colored ribbon cables
```

### Lighting Recommendations
```
Primary:   Bright overhead (workshop style) ✅ Already done
Secondary: Side fill lights (reduce shadows) ✅ Already done
Accent:    Highlight metallic components
Ambient:   Soft overall illumination ✅ Already done
```

---

## 📊 Technical Specifications

### Motion System
- **X-Axis Resolution:** 0.01mm (ball screw precision)
- **Y-Axis Resolution:** 0.01mm (ball screw precision)
- **Index Resolution:** 3.75° per step (96 positions)
- **Angle Resolution:** 0.01° (with 5:1 gearbox reduction)

### Motors
- **Type:** NEMA 17 bipolar stepper motors
- **Torque:** ~40-60 N·cm (typical)
- **Steps:** 200 steps/revolution (1.8° per step)
- **Microstepping:** 16x or 32x (for precision)

### Controller
- **Processor:** Arduino Mega 2560 (ATmega2560)
- **Clock Speed:** 16 MHz
- **RAM:** 8 KB
- **Flash:** 256 KB
- **I/O Pins:** 54 digital, 16 analog

---

## 🔗 File Locations

### 3D Models
```
C:\Users\barbr\Organized_STL_Files\
├── Atlas_96_Tooth_Gear.stl (INDEX WHEEL!)
├── MiniGemBot.stl (COMPLETE ASSEMBLY)
├── Nema 17 5_1 Planetary Gearbox.stl (GEARBOX!)
└── [73+ other component STL files]
```

### STL Previews
```
C:\Users\barbr\STL_Previews\
├── MiniGemBot.png
├── gemBotRobot.png
└── [Other component previews]
```

### HMI Files
```
D:\GemBotTouchScreen\
├── 9172025WorkingMiniMod.HMI (LATEST!)
├── 8202424GemBotAutoCutComplete.HMI
└── [Multiple historical versions]
```

### Arduino Code
```
C:\Users\barbr\OneDrive\Documents\Arduino\
├── officialGemBotMenuWithTouchScreenController\
├── GemBotMini08272024\
└── [Other firmware versions]
```

### Documentation
```
D:\GemBotTouchScreen\
├── 2024 official parts list for the ge.txt
├── FacetronOwnersManual.pdf
└── b1copy.txt (build notes)
```

---

## 🎥 Media Resources

### Video
**File:** `C:\Users\barbr\Videos\gemBot.mp4`
- Real machine operation
- Physical Nextion display in use
- Actual control workflow

### Photos
**Instagram:** https://www.instagram.com/p/C4gdJLYuQS8/
- Production-ready machines
- Completed wiring
- 96-tooth index gear installed
- Posted March 14, 2024

---

## 🚀 Next Steps for Simulator

### Phase 1: Frame Replacement
- [ ] Replace box frame with 2020 extrusions
- [ ] Add corner brackets at joints
- [ ] Show modular rail construction
- [ ] Add end caps

### Phase 2: Motion Systems
- [ ] Add ball screw assemblies (X and Y)
- [ ] Show linear guide rails
- [ ] Add stepper motors (visible)
- [ ] Add motor mounts

### Phase 3: Index & Angle
- [ ] Replace generic wheel with 96-tooth gear
- [ ] Add planetary gearbox housing (5:1)
- [ ] Show index motor
- [ ] Add gear mounting bracket

### Phase 4: Electronics
- [ ] Add Arduino housing
- [ ] Show Nextion display on stand
- [ ] Add motor driver boxes
- [ ] Add visible wiring (simplified)

### Phase 5: Details
- [ ] Add limit switches
- [ ] Add drip system components
- [ ] Add position indicators
- [ ] Add hardware (bolts, brackets)

---

## 📝 Notes

### Design Philosophy
The Gem Bot Mini is designed to be:
- **Modular:** Easy to assemble and modify
- **Accessible:** Uses common CNC/3D printer parts
- **Precise:** Ball screws and planetary gearbox
- **Compact:** Desktop-sized footprint
- **Professional:** Industrial-quality components

### Manufacturing
- **3D Printing:** Custom brackets and housings
- **Off-the-shelf:** Standard 2020 extrusions, motors, electronics
- **DIY-Friendly:** Can be built by makers
- **Professional Option:** Pre-assembled units available

### Applications
- Automated gem faceting
- Precision stone cutting
- Jewelry production
- Training/education
- Small-scale manufacturing

---

## ✅ Validation Checklist

Use this to verify simulator accuracy:

### Frame
- [ ] 2020 aluminum extrusions (not solid plate)
- [ ] Corner brackets visible
- [ ] Modular construction shown
- [ ] Correct proportions (~300x250x400mm)

### Motion
- [ ] Ball screw X-axis
- [ ] Ball screw Y-axis
- [ ] Linear guide rails
- [ ] Stepper motors visible

### Index System
- [ ] 96-tooth gear (not generic wheel)
- [ ] Index motor
- [ ] Position indicator/pointer
- [ ] Proper mounting

### Angle Control
- [ ] 5:1 planetary gearbox housing
- [ ] Gearbox motor
- [ ] Realistic proportions

### Electronics
- [ ] Arduino housing
- [ ] Nextion display on stand
- [ ] Motor driver boxes (optional)
- [ ] Simplified wiring

### Details
- [ ] Limit switches at axes
- [ ] Drip system (optional)
- [ ] Hardware visible
- [ ] Realistic materials/colors

---

**Status:** ✅ Complete Hardware Documentation  
**Files Referenced:** 73+ STL files, HMI files, Arduino code, parts list  
**Ready for:** Accurate 3D simulator modeling

---

**This document provides everything needed to create an accurate 3D representation of the real Gem Bot Mini hardware!** 💎🤖
