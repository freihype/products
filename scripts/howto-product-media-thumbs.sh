#!/bin/bash

# Base directory for this entire project
BASEDIR=$(cd $(dirname $0) && pwd)

ph-cli md:thumbs --debug=true --source="../products/lydia-v4/media" --outfile=readme.md
ph-cli md:thumbs --debug=true --source="../products/lydia/media" --outfile=readme.md
ph-cli md:thumbs --debug=true --source="../products/lydia/media/social" --outfile=readme.md
ph-cli md:thumbs --debug=true --source="../products/elena/media" --outfile=readme.md
ph-cli md:thumbs --debug=true --source="../products/elena/media/social" --outfile=readme.md
ph-cli md:thumbs --debug=true --source="../products/zoe/media" --outfile=readme.md
ph-cli md:thumbs --debug=true --source="../products/zoe/media/social" --outfile=readme.md
ph-cli md:thumbs --debug=true --source="../products/asterix/media" --outfile=readme.md
ph-cli md:thumbs --debug=true --source="../products/idefix/media" --outfile=readme.md
ph-cli md:thumbs --debug=true --source="../products/shredder_v3.2/media" --outfile=readme.md
ph-cli md:thumbs --debug=true --source="../products/sheetpress-cell/media" --outfile=readme.md
ph-cli md:thumbs --debug=true --source="../products/sheetpress-cell/renderings" --outfile=readme.md

cd ../howto
git add -A .
git commit -m "thumbs:product:media:*" .


