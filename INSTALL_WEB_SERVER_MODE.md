# Installing pgManage (Web Server mode)

## Please note that we put a lot of effort into making sure pgManage installs cleanly on every platform. If you have an issue please [report it](https://github.com/pgManage/pgManage/issues) and we'll get it fixed. 

## Dependencies

#### LIBPQ
In order for pgManage to talk to PostgreSQL you need to have the libpq library installed. If you don't have LibPQ or the pgManage compile process can't find it, please consult the file INSTALL_LIBPQ for some OS-specific advice on how to get libpq.

#### SSL
pgManage works with OpenSSL or LibreSSL, if you wish to use OpenSSL:
```
sudo apt install libssl-devel # Ubuntu
sudo dnf install openssl-devel # Fedora
sudo yum install openssl-devel # CentOS/RHEL
brew install openssl # macOS *
```
Or if you choose LibreSSL, make sure its `openssl` is first in the $PATH (On OpenBSD you don't need to worry about this).

*\* Apple does not include a good enough version of OpenSSL. We officially support the `brew` versions of OpenSSL. If installing OpenSSL from source (untested) make sure to install static libraries.*

####DOWNLOADING PGMANAGE

https://github.com/pgManage/pgManage/releases


#### NOTICE: INSTALLING PGMANAGE SERVER ON WINDOWS IS EXPLAINED IN THE DOCUMENT: INSTALL_WEB_SERVER_MODE_WIN.md

#### INSTALLING PGMANAGE

If you'd like to test pgManage before you install, see the section "Testing pgManage Before Installing" further down.

    cd pgmanage
    ./configure
    make
    sudo make install

If you are on OpenBSD or FreeBSD, use gmake instead.
pgManage will be installed in `/usr/local/sbin`. All other files such as the html, javascript and configuration files will be installed to `/usr/local/etc/pgmanage`.

#### RUNNING PGMANAGE

To run pgManage:

    /usr/local/sbin/pgmanage

Long Version:

    /usr/local/sbin/pgmanage \
    -c /usr/local/etc/pgmanage/pgmanage.conf \
    -d /usr/local/etc/pgmanage/pgmanage-connections.conf

#### Configuring PGMANAGE

Before running pgManage for the first time you may want to configure some options. All the options are explained in the pgManage man file:

    man pgmanage

Current configuration options allow you to set various paths, various access restrictions, web port and log level. Note that in order to make pgManage publish to HTTPS, you need to add paths for a TLS cert and key.

You'll also need to set up a connection string to tell pgManage where your PostgreSQL databases are published. The default connection string config file located in /usr/local/etc/pgmanage/. There are examples in the provided pgmanage-connections.conf file and further info is available in the man file.

#### TESTING PGMANAGE BEFORE INSTALLING

    cd pgmanage
    ./configure
    make
    nano config/pgmanage-connections.conf
    make test

If you want to test pgManage before you install, edit the `config/pgmanage-connections.conf` file to add a connection string for your Postgres database. Instructions for adding a connection string are included in the pgManage man page. To look at the pgManage man page before installing pgManage:

    ./configure
    man -M man pgmanage

By default pgManage runs on port 8080, so if you need to change that you do it in the `pgmanage.conf` file. You can also set other options like whether to use TLS to connect.

Once you've added a connection string to the pgmanage-connections.conf file, start the pgManage server with:

    make test

pgManage will push a message like:

    Open http(s)://<this computer's ip>:8080/ in your web browser

Once you see that message that means pgManage is running, open your web browser to the link shown.

#### UNINSTALLING PGMANAGE

If you still have your original build directory then:

    cd pgmanage
    ./configure
    make uninstall
    
pgManage saves SQL scripts that you create in pgManage to the .pgmanage folder. If you're removing pgManage you may want to remove the .pgmanage directory.

    rm -r ~/.pgmanage/

If you don't have your original build directory check the following locations:

    rm -r /usr/local/etc/pgmanage        # you may wish to save your config files first
    rm /usr/local/sbin/pgmanage          # this removes the binary
    rm /usr/local/man/man1/pgmanage.1    # this removes the man page
