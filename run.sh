#!/bin/bash

PERIOD=2023_01

echo ""
echo "Creating A2 reports(act, invoice) of period: ${PERIOD}:"

node ./src/main.js -p${PERIOD} -bx
