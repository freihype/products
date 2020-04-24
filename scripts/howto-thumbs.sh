#!/bin/bash

# Base directory for this entire project
BASEDIR=$(cd $(dirname $0) && pwd)

ph-cli md:thumbs --debug=true --source="../howto/brackets"
ph-cli md:thumbs --debug=true --source="../howto/controlbox"
ph-cli md:thumbs --debug=true --source="../howto/controlbox/dinrail_layout"
ph-cli md:thumbs --debug=true --source="../howto/controlbox/wiring" 
ph-cli md:thumbs --debug=true --source="../howto/extrusion/frame"
ph-cli md:thumbs --debug=true --source="../howto/extrusion/hopper"
ph-cli md:thumbs --debug=true --source="../howto/extrusion/flange"
ph-cli md:thumbs --debug=true --source="../howto/extrusion/screw_alignment"
ph-cli md:thumbs --debug=true --source="../howto/extrusion/keyway"
ph-cli md:thumbs --debug=true --source="../howto/extrusion/screw_mount"
ph-cli md:thumbs --debug=true --source="../howto/extrusion/shaft_clamp"
ph-cli md:thumbs --debug=true --source="../howto/extrusion/clamp_flange"
ph-cli md:thumbs --debug=true --source="../howto/nozzle_interface"
ph-cli md:thumbs --debug=true --source="../howto/extrusion/barrel_mount"
ph-cli md:thumbs --debug=true --source="../howto/extrusion/hopper_mount"
ph-cli md:thumbs --debug=true --source="../howto/extrusion/thermo_couple_clips"
ph-cli md:thumbs --debug=true --source="../howto/sheetpress/cartridge_heater/hole/block_vise"
ph-cli md:thumbs --debug=true --source="../howto/sheetpress/cartridge_heater/hole/drilling"
ph-cli md:thumbs --debug=true --source="../howto/sheetpress/cartridge_heater/hole/lathe_drill_addon"
ph-cli md:thumbs --debug=true --source="../howto/couplings/clamp"
ph-cli md:thumbs --debug=true --source="../howto/couplings/keyway"

cd ../howto
git add -A .
git commit -m "howto:thumbs" .

