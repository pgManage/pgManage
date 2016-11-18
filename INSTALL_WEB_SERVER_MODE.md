# Installing Postage (Web Server mode)

## Please note that we put a lot of effort into making sure Postage installs cleanly on every platform. If you have an issue please [report it](https://github.com/workflowproducts/postage/issues) and we'll get it fixed. 

## Dependencies

#### LIBPQ
In order for Postage to talk to PostgreSQL you need to have the libpq library installed. If you don't have LibPQ or the Postage compile process can't find it, please consult the file INSTALL_LIBPQ for some OS-specific advice on how to get libpq.

#### LIBRESSL
Postage uses the new TLS API found in LibreSSL. It can take some time to compile LibreSSL. If LibreSSL is already installed on your machine, then the compile process dynamically loads that one. This way you can avoid the wait. If not, it's compiled in statically. Please be patient. 

####DOWNLOADING POSTAGE

https://github.com/workflowproducts/postage/releases

####INSTALLING POSTAGE

If you'd like to test Postage before you install, see the section "Testing Postage Before Installing" further down.

*`make` will take a while as it builds libressl.*

    cd postage
    ./configure
    make
    sudo make install

If you are on OpenBSD or FreeBSD, use gmake instead.
Postage will be installed in `/usr/local/sbin`. All other files such as the html, javascript and configuration files will be installed to `/usr/local/etc/postage`.

####RUNNING POSTAGE

To run Postage:

    /usr/local/sbin/postage

Long Version:

    /usr/local/sbin/postage \
    -c /usr/local/etc/postage/postage.conf \
    -d /usr/local/etc/postage/postage-connections.conf

####Configuring POSTAGE

Before running Postage for the first time you may want to configure some options. All the options are explained in the Postage man file:

    man postage

Current configuration options allow you to set various paths, various access restrictions, web port and log level. Note that in order to make Postage publish to HTTPS, you need to add paths for a TLS cert and key.

You'll also need to set up a connection string to tell Postage where your PostgreSQL databases are published. The default connection string config file located in /usr/local/etc/postage/. There are examples in the provided postage-connections.conf file and further info is available in the man file.

####TESTING POSTAGE BEFORE INSTALLING

    cd postage
    ./configure
    make
    nano config/postage-connections.conf
    make test

If you want to test Postage before you install, edit the `config/postage-connections.conf` file to add a connection string for your Postgres database. Instructions for adding a connection string are included in the Postage man page. To look at the Postage man page before installing Postage:

    ./configure
    man -M man postage

By default Postage runs on port 8080, so if you need to change that you do it in the `postage.conf` file. You can also set other options like whether to use TLS to connect.

Once you've added a connection string to the postage-connections.conf file, start the Postage server with:

    make test

Postage will push a message like:

    Open http(s)://<this computer's ip>:8080/ in your web browser

Once you see that message that means Postage is running, open your web browser to the link shown.

####UNINSTALLING POSTAGE

If you still have your original build directory then:

    cd postage
    ./configure
    make uninstall
    
Postage saves SQL scripts that you create in Postage to the .postage folder. If you're removing Postage you may want to remove the .postage directory.

    rm -r ~/.postage/

If you don't have your original build directory check the following locations:

    rm -r /usr/local/etc/postage        # you may wish to save your config files first
    rm /usr/local/sbin/postage          # this removes the binary
    rm /usr/local/man/man1/postage.1    # this removes the man page
