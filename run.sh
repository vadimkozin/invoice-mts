#!/bin/bash
#
# Creating reports (pdf, xml) for phone-billing A2
#
PERIOD=2023_01

echo ""
echo "Creating A2 reports(act, invoice) of period: ${PERIOD}:"

node ./dist/main.js -p${PERIOD} -bx
