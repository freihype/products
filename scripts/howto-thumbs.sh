#!/bin/bash

# Base directory for this entire project
BASEDIR=$(cd $(dirname $0) && pwd)

ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/brackets" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/controlbox" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/controlbox/dinrail_layout" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/controlbox/wiring" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/frame" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/hopper" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/flange" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/screw_alignment" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/keyway" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/screw_mount" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/shaft_clamp" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/clamp_flange" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/nozzle_interface" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/barrel_mount" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/hopper_mount" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/extrusion/thermo_couple_clips" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/sheetpress/cartridge_heater/hole/block_vise" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/sheetpress/cartridge_heater/hole/drilling" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/sheetpress/cartridge_heater/hole/lathe_drill_addon" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/couplings/clamp" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/couplings/keyway" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/resin-cast-barrel-injector" --outfile=index.md
ph-cli md:thumbs --root="../"  --debug=true --source="../_howto/arbor_injection/wheel_handle" --outfile=index.md

cd ../_howto
git add -A .
git commit -m "_howto:thumbs" .

