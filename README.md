# Postage - A fast replacement for PGAdmin

## About
Postage is built on Envelope technology. Postage and Envelope are products of Workflow Products, LLC. 

Since postage runs in a browser it will use the UTF8 encoding. Therefore we don't recommend you use postage with a non-UTF8 database.

## Developer Notes
If you're interested in developing, patching or in any way contributing to Postage then you should probably also read the [README_DEV](https://github.com/workflowproducts/postage/blob/master/README_DEV.md) file.

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

####FEEDBACK AND BUG REPORTS

Please contact us with your feedback! Github issues and pull requests are welcome. Please report any issues you have for FREE support. More information is available at the project home page: https://www.workflowproducts.com/postage.html

####Licensing

If you like some or all of Postage's functionality and the current license won't suit your needs, commercial licensing is available starting at $99. Please call Justin at Workflow Products, 817-503-9545 for details.

## Why?

It's a sad story really. We had an in-house version for six or seven years. Then we decided it would be a good idea to polish it up and open source it. If it became popular it could be good for us. We invested an embarrassing amount of work into it. 

It was available for some months on Github and there was no activity from outside developers or users. We did get a few stars but just one one-line patch. We were ok with that though because we figured at some point the number of users would increase. Everyone we showed it to at the DFW and Austin PUGs were very impressed and enthusiastic.

Then E*********DB committed several people to PGAdmin4. We realized that Postage was unlikely to be popular if PGAdmin4 gets to a place where it is 'good enough'. So we left Github to save developer overhead. 

Then someone expressed interest in Postage. We figured out a way to keep the developer overhead low and got back onto Github. So now we're back.

At this point Postage is Workflow Products' flagship. We're content that Postage play the role of showing off the rich, desktop-like functionality possible with Envelope, the platform we wrote for our business applications. It would have been nice for it to become popular some day but that isn't going to happen. Fortunately for us we don't need it to be popular. We use it every day. If you do give Postage a try then you have our gratitude. Let us know what you think and we'll make it better.

## Roadmap

We're more than a little annoyed at our competitor. As a consequence, we aren't going to give any advance notice of features in development. However, if you are wondering about our commitment to Postage then wonder no longer. 

Workflow Products has committed an embarrassing amount of resources to Postage over the years. The current average for 2016 is two full time people. Current priority is debugging install on various platforms. Next we'll be setting up various packages to make installation even easier. Then we'll move back into feature expansion. We have identified four major features we want to bring to Postage over the next six to eight months.

Workflow Products itself is healthier than it's ever been. We're celebrating our tenth year in November 2016. We're now at five full time employees and we expect to be around in another ten years. If you have any further questions please contact us directly at 817-503-9545.

Copyright 2016 Workflow Products LLC
