# Postage - A fast replacement for PGAdmin

## Dependencies

#### LIBEV
Different versions of libev may not work with every version of Postage. To avoid problems, the Postage compile process is set up to statically compile libev. This way we control what version you use. If you need a different version, start with the dependencies/update.sh file.

#### LIBRESSL
Postage uses the new TLS API found in LibreSSL. It can take some time to compile LibreSSL. If LibreSSL is already installed on your machine, then the compile process dynamically loads that one. This way you can avoid the wait. If not, it's compiled in statically. Please be patient. 

#### LIBPQ
In order for Postage to talk to PostgreSQL you need to have the libpq library installed.

Mac OS X ships with a PostgreSQL install with no libpq header files. If you then install PostgreSQL but don't add it to your PATH (in .profile) then the Postage configure process will error saying that it found pg_config (but it will be the wrong one) and fail to find the libpq header files. To fix this situation, make sure you add the proper pgsql/bin folder in the beginning of your path.

Usually, if you have psql then you'll have the libpq library files and be fine. Rarely, you may encounter issues by using the wrong version of libpq. In these cases, or in the case where you want to run postage on a computer that doesn't have libpq installed, you can consult the file INSTALL_LIBPQ for some OS specific advice on how to get libpq.

####DOWNLOADING POSTAGE

If you prefer wget:

    wget https://www.workflowproducts.com/downloads/postage-stable.zip
    unzip postage-stable.zip

OR if you prefer curl:

    curl -L https://www.workflowproducts.com/downloads/postage-stable.zip > postage-stable.zip
    unzip postage-stable.zip

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

####UNINSTALLING POSTAGE (from original build directory)

If you install Postage and then decide you want to uninstall it then you need to have done a `./configure` with the same version of Postage. If you still have your original build directory around then you can just cd into it and run:

    make uninstall

Postage saves SQL scripts to the .postage folder. If you're removing Postage you may want to remove the .postage directory.

    rm -r ~/.postage/

####UNINSTALLING POSTAGE

If you still have your original build directory then:

    cd postage
    ./configure
    make uninstall
    rm -r ~/.postage/  # to remove SQL script
    
If you don't have your original build directory check the following locations:

    rm -r /usr/local/etc/postage        # you may wish to save your config files first
    rm /usr/local/sbin/postage          # this removes the binary
    rm /usr/local/man/man1/postage.1    # this removes the man page

####FEEDBACK AND BUG REPORTS

Please contact us with your feedback! Please report any issues you have for FREE support. More information is available at the project home page: https://www.workflowproducts.com/postage.html

####Licensing

If you like some or all of Postage's functionality and the current license won't suit your needs, commercial licensing is available starting at $99. Please call Justin at Workflow Products, 817-503-9545 for details.

Copyright 2016 Workflow Products LLC
