#!/bin/sh


./makeapp.sh
rm -f PostageMac.dmg
appdmg dmg.json PostageMac.dmg
