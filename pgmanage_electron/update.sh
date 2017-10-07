#/bin/sh

set -e
( cd ../src && make all )

rm -rf app/pgmanage
mkdir app/pgmanage
cp -r ../src/web_root app/pgmanage/web_root
cp -r ../src/config app/pgmanage/config

if test $(uname -s) = "Darwin"; then
	clang ../dependencies/libev/ev.o ../src/*.o ../db_framework_pq/*.o -lm mac_lib/libpq.a /usr/local/opt/openssl/lib/libssl.a /usr/local/opt/openssl/lib/libcrypto.a -lm -O3 -g -fno-strict-aliasing -o app/pgmanage/pgmanage

else
	cp ../src/pgmanage app/pgmanage/pgmanage
fi
