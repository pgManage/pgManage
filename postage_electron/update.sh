#/bin/sh

set -e
( cd ../postage && make all )

rm -rf app/postage
mkdir app/postage
cp -r ../postage/web_root app/postage/web_root
cp -r ../postage/config app/postage/config

if test $(uname -s) = "Darwin"; then
	clang -L/usr/local/lib -lm -L/usr/local/opt/gettext/lib \
		../dependencies/libressl/tls/.libs/libtls.a ../dependencies/libressl/ssl/.libs/libssl.a \
		../dependencies/libressl/crypto/.libs/libcrypto.a \
		mac_lib/libpq.a -Wall -Wextra -Wconversion -O3 -g \
		../common/*.o ../util/*.o ../postage/*.o ../db_framework_pq/*.o \
		-o app/postage/postage
else
	cp ../postage/postage app/postage/postage
fi
