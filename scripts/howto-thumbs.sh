#!/bin/bash

# Base directory for this entire project
BASEDIR=$(cd $(dirname $0) && pwd)

ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/brackets"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/controlbox"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/controlbox/dinrail_layout"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/controlbox/wiring"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/frame"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/hopper"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/flange"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/screw_alignment"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/keyway"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/screw_mount"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/shaft_clamp"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/clamp_flange"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/nozzle_interface"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/barrel_mount"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/hopper_mount"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/thermo_couple_clips"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/sheetpress/cartridge_heater/hole/block_vise"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/sheetpress/cartridge_heater/hole/drilling"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/sheetpress/cartridge_heater/hole/lathe_drill_addon"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/couplings/clamp"
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/couplings/keyway"

cd ../_howto
git add -A .
git commit -m "_howto:thumbs" .

