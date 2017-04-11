# FreeBSD Postage
```
su -
pkg install
pkg install unzip postgresql96-server gmake wget
exit
wget https://github.com/workflowproducts/postage/archive/master.zip
unzip master.zip
cd postage-master/
./configure
gmake all
gmake test
```

On your desktop computer's browser go to:
http://\<ip>:8080/postage/test/index.html?seq_numbers=true&_http_auth=true&http_file=true&http_upload=true&http_export=true&ws_raw=true&ws_tab=true&ws_select=true&ws_insert=true&ws_update=true&ws_delete=true

Back in FreeBSD:
```
gmake test-common
su -
cd /home/super/postage-master/
gmake install
exit
/usr/local/sbin/postage
```

On your desktop computer's browser go to:
http://\<ip>:8080/postage/test/index.html?seq_numbers=true&_http_auth=true&http_file=true&http_upload=true&http_export=true&ws_raw=true&ws_tab=true&ws_select=true&ws_insert=true&ws_update=true&ws_delete=true

Make sure to kill the PostgreSQL process from `make test-common` before moving on.

Back in FreeBSD:
```
su -
cd /home/super/postage-master
gmake uninstall
```

# FreeBSD Envelope
```
su -
pkg install
pkg install unzip postgresql96-server gmake wget
exit
wget https://github.com/workflowproducts/envelope/archive/master.zip
unzip master.zip
cd envelope-master/
./configure
gmake all
gmake test
```

On your desktop computer's browser go to:
http://\<ip>:8888/test.html

Back in FreeBSD:
```
gmake test-common
su -
cd /home/super/envelope-master/
gmake install
/usr/local/sbin/envelope
```

On your desktop computer's browser go to:
http://\<ip>:8888/test.html

Back in FreeBSD:
```
su -
cd /home/super/envelope-master
gmake uninstall
```

# OpenBSD Postage
```
su -
pkg_add unzip postgresql-server gmake wget
exit
wget https://github.com/workflowproducts/postage/archive/master.zip
unzip master.zip
cd postage-master/
./configure
gmake all
gmake test
```

On your desktop computer's browser go to:
http://\<ip>:8080/postage/test/index.html?seq_numbers=true&_http_auth=true&http_file=true&http_upload=true&http_export=true&ws_raw=true&ws_tab=true&ws_select=true&ws_insert=true&ws_update=true&ws_delete=true

Back in OpenBSD:
```
gmake test-common
su -
cd /home/super/postage-master/
gmake install
exit
/usr/local/sbin/postage
```

On your desktop computer's browser go to:
http://\<ip>:8080/postage/test/index.html?seq_numbers=true&_http_auth=true&http_file=true&http_upload=true&http_export=true&ws_raw=true&ws_tab=true&ws_select=true&ws_insert=true&ws_update=true&ws_delete=true

Make sure to kill the PostgreSQL process from `make test-common` before moving on.

Back in OpenBSD:
```
su -
cd /home/super/postage-master
gmake uninstall
```

# OpenBSD Envelope
```
su -
pkg_add unzip postgresql-server gmake wget
exit
wget https://github.com/workflowproducts/envelope/archive/master.zip
unzip master.zip
cd envelope-master/
./configure
gmake all
gmake test
```

On your desktop computer's browser go to:
http://\<ip>:8888/test.html

Back in OpenBSD:
```
gmake test-common
su -
cd /home/super/envelope-master/
gmake install
/usr/local/sbin/envelope
```

On your desktop computer's browser go to:
http://\<ip>:8888/test.html

Back in OpenBSD:
```
su -
cd /home/super/envelope-master
gmake uninstall
```

# Ubuntu Postage
In terminal:
```
sudo apt-get install postgresql-server-dev-9.5 postgresql-9.5
export PATH="/usr/lib/postgresql/9.5/bin:$PATH"
wget https://github.com/workflowproducts/postage/archive/master.zip
unzip master.zip 
cd postage-master/
./configure && make
make test
```

In your browser:
Go to the Postage testing page: http://127.0.0.1:8080/postage/test/index.html?seq_numbers=true&_http_auth=true&http_file=true&http_upload=true&http_export=true&ws_raw=true&ws_tab=true&ws_select=true&ws_insert=true&ws_update=true&ws_delete=true

Back in Terminal:
```
sudo su -
cd /home/super/postage-master/
make install
exit
make test-common
/usr/local/sbin/postage
```

In your browser:
Go to the Postage testing page: http://127.0.0.1:8080/postage/test/index.html?seq_numbers=true&_http_auth=true&http_file=true&http_upload=true&http_export=true&ws_raw=true&ws_tab=true&ws_select=true&ws_insert=true&ws_update=true&ws_delete=true

Make sure to kill the PostgreSQL process from `make test-common` before moving on.

To uninstall:
```
sudo su -
cd /home/super/postage-master/
make uninstall
```

# Ubuntu Envelope
In terminal:
```
sudo apt-get install postgresql-server-dev-9.5 postgresql-9.5
export PATH="/usr/lib/postgresql/9.5/bin:$PATH"
wget https://github.com/workflowproducts/envelope/archive/master.zip
unzip master.zip 
cd envelope-master/
./configure && make
make test
```

In your browser:
Go to the Envelope testing page: http://127.0.0.1:8888/test.html

Back in Terminal:
```
sudo su -
cd /home/super/envelope-master/
make install
exit
make test-common
sudo su -
/usr/local/sbin/envelope
```

In your browser:
Go to the Envelope testing page: http://127.0.0.1:8888/test.html

To uninstall:
```
sudo su -
cd /home/super/envelope-master/
make uninstall
```

# Fedora Postage
In terminal:
```
wget https://github.com/workflowproducts/postage/archive/master.zip
unzip master.zip 
cd postage-master/
./configure && make
make test
```

In your browser:
Go to the Postage testing page: http://127.0.0.1:8080/postage/test/index.html?seq_numbers=true&_http_auth=true&http_file=true&http_upload=true&http_export=true&ws_raw=true&ws_tab=true&ws_select=true&ws_insert=true&ws_update=true&ws_delete=true

Back in Terminal:
```
su -
cd /home/super/postage-master/
make install
exit
make test-common
/usr/local/sbin/postage
```
In your browser:
Go to the Postage testing page: http://127.0.0.1:8080/postage/test/index.html?seq_numbers=true&_http_auth=true&http_file=true&http_upload=true&http_export=true&ws_raw=true&ws_tab=true&ws_select=true&ws_insert=true&ws_update=true&ws_delete=true

Make sure to kill the PostgreSQL process from `make test-common` before moving on.

To uninstall:
```
su -
cd /home/super/postage-master/
make uninstall
```

# Fedora Envelope
In terminal:
```
wget https://github.com/workflowproducts/envelope/archive/master.zip
unzip master.zip 
cd envelope-master/
./configure && make
make test
```

In your browser:
Go to the Envelope testing page: http://127.0.0.1:8888/test.html

Back in Terminal:
```
su -
cd /home/super/envelope-master/
make install
exit
make test-common
su -
/usr/local/sbin/envelope
```

In your browser:
Go to the Envelope testing page: http://127.0.0.1:8888/test.html

To uninstall:
```
su -
cd /home/super/envelope-master/
make uninstall
```

# macOS Postage:
Use Google Chrome

In terminal:
```
curl -OL https://github.com/workflowproducts/postage/archive/master.zip
unzip master.zip 
cd postage-master/
./configure
make all test
```

In your browser:
Go to the Postage testing page: http://127.0.0.1:8080/postage/test/index.html?seq_numbers=true&_http_auth=true&http_file=true&http_upload=true&http_export=true&ws_raw=true&ws_tab=true&ws_select=true&ws_insert=true&ws_update=true&ws_delete=true

Back in Terminal:
```
sudo su -
cd /Users/super/postage-master/
make install
exit
make test-common
/usr/local/sbin/postage
```

In your browser:
Go to the Postage testing page: http://127.0.0.1:8080/postage/test/index.html?seq_numbers=true&_http_auth=true&http_file=true&http_upload=true&http_export=true&ws_raw=true&ws_tab=true&ws_select=true&ws_insert=true&ws_update=true&ws_delete=true

Make sure to kill the PostgreSQL process from `make test-common` before moving on.

To uninstall:
```
sudo su -
cd /Users/super/postage-master/
make uninstall
```

# macOS Envelope

Use Google Chrome

In terminal:
```

//ENVELOPE
curl -OL https://github.com/workflowproducts/envelope/archive/master.zip
unzip master.zip 
cd envelope-master/
./configure
make all test
```

In your browser:
Go to the Envelope testing page: http://127.0.0.1:8888/test.html

Back in Terminal:
```
sudo su -
cd /Users/super/envelope-master/
make install
exit
make test-common
sudo su -
/usr/local/sbin/envelope
```

In your browser:
Go to the Envelope testing page: http://127.0.0.1:8888/test.html

To uninstall:
```
sudo su -
cd /Users/super/envelope-master/
make uninstall
exit
cd ~
rm -rf master.zip
```
