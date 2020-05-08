#!/bin/bash

# Base directory for this entire project
BASEDIR=$(cd $(dirname $0) && pwd)

ph-cli machine-jekyll --debug=true --products=../ --product=elena
ph-cli machine-jekyll --debug=true --products=../ --product=lydia-v4

