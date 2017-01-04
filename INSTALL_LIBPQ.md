# TROUBLESHOOTING MISSING LIBPQ

In order for Postage to talk to PostgreSQL you need to have the libpq library installed. 

By default on Mac OS X, you'll have a PostgreSQL install with no libpq header files. If you then install PostgreSQL but don't add it to your PATH then the Postage configure will say that it found pg_config (but it will be the wrong one) and fail to find the libpq header files. To fix this situation, make sure you add the proper pgsql/bin folder in the beginning of your path.

On any other distribution where you have PostgreSQL installed, you'll typically have libpq already. If the installer can't find your libpq then you may need to add a path to your environment so that the compiler can find it.

## PROBLEM 1: I HAVE LIBPQ BUT POSTAGE STILL WON'T INSTALL

Postage finds your libpq files using a command called `pg_config`. This command might be in a non-standard location. Try editing your `~/.profile` and add a line to the end of the file like this:

	export PATH=/FULLPATHTOTHEbinFOLDERTHATHASPG_CONFIG/:$PATH

Typically, the folder will be in `/usr/local/pgsql/bin`.

Make sure that once you finished editing your `~/.profile` that you get out of that shell and get back in so that the change takes effect.

The path to your libpq can be found with `pg_config`. The Postage configure process attempts to do this for you but if it can't find `pg_config` then it will fail. To fix this situation you need to add `pg_config` to your path.

## PROBLEM 2: I DON'T HAVE LIBPQ

If you don't have libpq installed on your system then you'll need to get it. Typically, this is done by installing PostgreSQL. Here we've collected various notes about installing libpq. If you're not sure how to proceed please consult your system admin.

#### LINUX YUM

	#yum install postgresql-server
	yum install postgresql-devel

You may want a different version of libpq than your operating system provides. This can happen if you are connecting to a remote PostgreSQL server. In that case use this method (specify the appropriate version):

	#yum install http://yum.postgresql.org/9.4/redhat/rhel-6-x86_64/pgdg-redhat94-9.4-1.noarch.rpm
	yum install postgresql94-server postgresql94-devel

For more information go to http://www.postgresql.org/download/linux/redhat/


#### LINUX APT-GET	

	#apt-get install postgresql-9.4
	apt-get install postgresql-server-dev-9.4

If the version on your system is not the one you want, you may want to use the PostgreSQL Apt Repository. This method works something like this:

	sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list

	sudo apt-get install wget ca-certificates
	wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
	sudo apt-get update
	sudo apt-get upgrade
	sudo apt-get install postgresql-9.5 postgresql-server-dev-9.5


#### OPENBSD

	#sudo pkg_add postgresql-server
	sudo pkg_add libpqxx

For more information go to: http://www.postgresql.org/download/openbsd/


#### FREEBSD

	cd /usr/ports/databases/postgresql94-server
	make config
	make install clean
	cd /usr/ports/databases/postgresql-libpqxx-4
	make config
	make install clean

For more information go to: http://www.postgresql.org/download/freebsd/


#### OPENSUSE

	#zypper in postgresql
	#zypper in postgresql-server
	zypper in libpq5

More information at http://www.postgresql.org/download/linux/suse/


## PROBLEM 3: I DON'T HAVE SSL IN MY LIBPQ

#### Mac OS Sierra (10.12)

If you're installing Postage from source then first make sure you need it. The main reasons to install Postage from source are explained in the README. If you don't need Postage from source then installing from a package will solve the problem starting from release 3.1.4.

If you must install Postage from source, then you'll need to install a version of LIBPQ that has SSL enabled. The easiest way to do this on Mac is (usually) to install PostgreSQL from source. If anyone solves this problem in an easier way please let us know and we'll update this document.




Copyright 2016 Workflow Products LLC
