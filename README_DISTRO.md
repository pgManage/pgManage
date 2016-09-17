## Dependencies

Postage depends on libpq, libev, and libressl.

#### LIBPQ
In order for Postage to talk to PostgreSQL you need to have the libpq library installed. 

Libpq should come installed with most PostgreSQL installations. For example, psql requires it, so if you have psql then you should have the libpq library files somewhere. 

Rarely, you may encounter issues by using the wrong version of libpq. In these cases, or in the case where you want to run postage on a computer that doesn't have libpq installed, you can consult the file INSTALL_LIBPQ for some OS specific advice on how to get a good version of libpq for your situation. Mostly this advice boils down to "install PostgreSQL". 

At this time, all other dependencies have been loaded directly into Postage. In the future we may be creating a "distro" release of Postage for those people who wish to install dependencies separately. 


# NOTE: The following information was written in anticipation of the "distro" release. 

#### You can find libev here: 

	http://dist.schmorp.de/libev/ 

To install libev:  

	$ ./configure && make all && sudo make install
	

#### You can find libressl here:

	http://ftp.openbsd.org/pub/OpenBSD/LibreSSL/

To install libressl:

    $ ./configure && make all && sudo make install


Copyright 2016 Workflow Products LLC



