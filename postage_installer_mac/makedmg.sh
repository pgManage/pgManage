#!/bin/sh


cd ../postage_gui_mac

xcodebuild -project "Postage.xcodeproj"

cd ../postage_installer_mac

rm -rf Postage.app
cp -r ../postage_gui_mac/build/Release/Postage.app Postage.app
cp -r ../postage/web_root/ Postage.app/Contents/Resources/web_root/
cp ../postage/config/postage.conf Postage.app/Contents/Resources/postage.conf
cp ../postage/config/postage-connections.conf Postage.app/Contents/Resources/postage-connections.conf
cp ../postage/postage Postage.app/Contents/Resources/postage
#cp -r ../postage/man/man1/postage.1 PostageMac/usr/local/share/man/man1/postage.1

rm -f PostageMac.dmg
appdmg dmg.json PostageMac.dmg
