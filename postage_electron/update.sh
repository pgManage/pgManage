#/bin/sh

set -e
( cd ../postage && make all )

rm -rf app/postage
mkdir app/postage
cp ../postage/postage app/postage/postage
cp -r ../postage/web_root app/postage/web_root
cp -r ../postage/config app/postage/config
