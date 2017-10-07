pgmanage(1) -- PostgreSQL Administration for the web
===================================================

## FULL PATH
This instance of pgmanage was installed as `@prefix@/sbin/pgmanage` (Usually `/usr/local/sbin/pgmanage`)

## SYNOPSIS
```
pgmanage
       [-h | --help]
       [-v | --version]
       [-c <config-file> | --config-file=<config-file>]
       [-d <connection-file> | --connection-file=<connection-file>]
       [-s <super-only> | --super-only=<super-only>]
       [-g <login-group> | --login-group=<login-group>]
       [-r <web-root> | --web-root=<web-root>]
       [-a <data-root> | --data-root=<data-root>]
       [-p <port> | --pgmanage-port=<port>]
       [-j <tls-cert> | --tls-cert=<tls-cert>]
       [-k <tls-key> | --tls-key=<tls-key>]
       [-l <log-level> | --log-level=<log-level>]
       [-n <allow_custom_connections> | --allow-custom-connections=<allow-custom-connections>]
       [-t <login-timeout> | --login-timeout=<login-timeout>]
       [-x <local-only> | --local-only=<local-only>]
```

## DESCRIPTION
The `pgmanage` utility is  a tool to make managing your PostgreSQL database fast and easy. It provides web access and can be used on a tablet, or even on a phone.

All log output is pushed to stderr, if you are pushing that to a file, then you must handle rotating the file yourself or it will get large and slow `pgmanage` down.


## OPTIONS
`-h` or `--help`  
       Print usage and exit

`-v` or `--version`  
       Print version information and exit

`-c` or `--config-file=`  
       `String;` defaults to @prefix@/etc/pgmanage/pgmanage.conf  
       You can use this option to tell pgManage where to look for the configuration file. A sample configuration file is provided in @prefix@/etc/pgmanage. If there is no file specified pgManage will look in the current directory for a config file. If no config file is found pgManage will proceed with default values.

The following options can be specified on the command line or in the configuration file. In the event a value is specified on the command line and in the config file, pgManage will always use the command line option. Note that if no option is specified then some options will be set to a default value.

`[command line short]` or `[command line long]` or `[config file]`

`-d` or `--connection-file=` or `connection_file=`  
       `String;` defaults to @prefix@/etc/pgmanage/pgmanage-connections.conf  
       When you install pgManage, the Makefile will generate a path to the sample pgmanage-connections.conf file and put it in the sample config file. Use this option to tell pgManage where your connection list is located.  
       If not specified, pgManage looks in the same folder as the config file for a file named pgmanage-connections.conf. If pgManage can't find a connection file, it will error.

`-s` or `--super-only=` or `super_only=`  
       `Boolean;` defaults to false  
       This tells pgManage whether or not to only allow super users to login. The recommended value is true and will restrict users who are not super users from logging in to any PostgreSQL instance through pgManage. Note that a connection will be made to PostgreSQL in order to test if the user is a superuser.  

`-g` or `--login-group=` or `login_group=`  
       `String;` no default  
       This tells pgManage to only allow users in a certain PostgreSQL group to login to pgManage. Note that a connection will be made to PostgreSQL in order to test if the user is a member of the login group.

`-r` or `--web-root=` or `web_root=`  
       `String;` Defaults to @prefix@/etc/pgmanage/web_root  
       This tells pgManage where the HTML files have been installed to.

`-a` or `--data-root=` or `data_root=`  
       `String;` defaults to ~/.pgmanage/  
       This tells pgManage where to put the SQL file history. All tabs are saved to this location so that if you get disconnected from pgManage you don't lose your work.

`-p` or `--pgmanage-port=` or `pgmanage_port=`  
       `Integer;` defaults to 8080  
       This tells pgManage what port to listen on for browser requests.

`-j` or `--tls-cert=` or `tls_cert=`  
`-k` or `--tls-key=` or `tls_key=`  
       `String;` no defaults  
       These options tell pgManage where the TLS Certificate and Key files reside. If you use these options then you'll only be able to access pgManage through a secure TLS connection.  
       These options are only necessary if you wish to connect directly to pgManage using a secure TLS connection. As an alternative, you can set up pgManage in a reverse proxy configuration. This allows your web server to terminate the secure connection and pass on the request to pgManage. You can find help to set up this configuration in the INSTALL_NGINX file that came with your distribution.

`-n` or `--allow-custom-connections=` or `allow_custom_connections=`  
       `Boolean;` defaults to false  
       This tells pgManage whether or not to allow anyone to use a custom connection from the login screen.

`-l` or `--log-level=` or `log_level=`  
       `String;` defaults to error  
       This option regulates the frequency and verbosity of log messages. Possible values are none, error, warn, notice and info.

`-t` or `--login-timeout=` or `login_timeout=`  
       `Integer;` defaults to 0  
       This option regulates the login timeout (in seconds) after the last activity on a session.
	   If 0, no timeout is enforced.

`-x` or `--local-only=`
       `Boolean;` defaults to false  
       This tells pgManage whether or not to set the listening socket to local addresses only.

## SETTING UP A CONNECTION TO A POSTGRESQL SERVER

pgManage requires at least one PostgreSQL server be listed in the pgmanage-connections.conf file. This version of pgManage doesn't allow you to specify a server from the command line. Enter only one PostgreSQL server per line.

**The format of a connection string is:**  
```
[server name]: [standard PostgreSQL connection string]
```

Detailed information about PostgreSQL connection strings is available at: http://www.postgresql.org/docs/current/static/libpq-connect.html

Note that you do not enter your user name or password in this file. That information will be entered on the login screen. If you put a username or password in this file, it will be removed by pgManage before attempting to connect to a database.

#### EXAMPLE CONNECTION STRINGS:
```
nuc-server: hostaddr=192.168.0.100 port=5432 dbname=postgres
mini-server: hostaddr=127.0.0.1 port=5432 dbname=postgres sslmode=require
```

## EXAMPLES
Run `pgmanage` (short argument):
```
@prefix@/sbin/pgmanage -c @prefix@/etc/pgmanage/pgmanage.conf -d @prefix@/etc/pgmanage/pgmanage-connections.conf
```

Run `pgmanage` (long argument):
```
@prefix@/sbin/pgmanage --config-file=@prefix@/etc/pgmanage/pgmanage.conf --connection-file @prefix@/etc/pgmanage/pgmanage-connections.conf
```

## TROUBLESHOOTING
Try accessing your database through psql. If you can, double check your connection string parameters. If you can't connect, you may have a firewall problem.


## AUTHOR
Copyright (c) 2017 Workflow Products, LLC

Created by Annunziato Tocci

Report bugs to https://github.com/workflowproducts/pgmanage/issues  
Send us feedback! Current contact information can be found at workflowproducts.com  
