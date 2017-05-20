#/bin/sh

set -e
( cd ../postage && make all )

rm -rf app/postage
mkdir app/postage
cp -r ../postage/web_root app/postage/web_root
cp -r ../postage/config app/postage/config

if test $(uname -s) = "Darwin"; then
	clang ../dependencies/libev/ev.o ../common/*.o ../util/*.o ../postage/*.o ../db_framework_pq/*.o -lm mac_lib/libpq.a /usr/local/opt/openssl/lib/libssl.a /usr/local/opt/openssl/lib/libcrypto.a -lm -O3 -g -fno-strict-aliasing -o app/postage/postage

else
	cp ../postage/postage app/postage/postage
fi
