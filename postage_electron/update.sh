#/bin/sh

set -e
( cd ../postage && make all )

rm -rf postage
mkdir postage
cp ../postage/postage postage/postage
cp -r ../postage/web_root postage/web_root
cp -r ../postage/config postage/config
