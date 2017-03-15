postage(1) -- PostgreSQL Administration for the web
===================================================

## FULL PATH
This instance of postage was installed as `@prefix@/sbin/postage` (Usually `/usr/local/sbin/postage`)

## SYNOPSIS
```
postage
       [-h | --help]
       [-v | --version]
       [-c <config-file> | --config-file=<config-file>]
       [-d <connection-file> | --connection-file=<connection-file>]
       [-s <super-only> | --super-only=<super-only>]
       [-g <login-group> | --login-group=<login-group>]
       [-r <web-root> | --web-root=<web-root>]
       [-a <data-root> | --data-root=<data-root>]
       [-p <port> | --postage-port=<port>]
       [-j <tls-cert> | --tls-cert=<tls-cert>]
       [-k <tls-key> | --tls-key=<tls-key>]
       [-l <log-level> | --log-level=<log-level>]
       [-n <allow_custom_connections> | --allow-custom-connections=<allow-custom-connections>]
       [-t <login-timeout> | --login-timeout=<login-timeout>]
       [-x <local-only> | --local-only=<local-only>]
```

## DESCRIPTION
The `postage` utility is  a tool to make managing your PostgreSQL database fast and easy. It provides web access and can be used on a tablet, or even on a phone.

All log output is pushed to stderr, if you are pushing that to a file, then you must handle rotating the file yourself or it will get large and slow `postage` down.


## OPTIONS
`-h` or `--help`  
       Print usage and exit

`-v` or `--version`  
       Print version information and exit

`-c` or `--config-file=`  
       `String;` defaults to @prefix@/etc/postage/postage.conf  
       You can use this option to tell Postage where to look for the configuration file. A sample configuration file is provided in @prefix@/etc/postage. If there is no file specified Postage will look in the current directory for a config file. If no config file is found Postage will proceed with default values.

The following options can be specified on the command line or in the configuration file. In the event a value is specified on the command line and in the config file, Postage will always use the command line option. Note that if no option is specified then some options will be set to a default value.

`[command line short]` or `[command line long]` or `[config file]`

`-d` or `--connection-file=` or `connection_file=`  
       `String;` defaults to @prefix@/etc/postage/postage-connections.conf  
       When you install Postage, the Makefile will generate a path to the sample postage-connections.conf file and put it in the sample config file. Use this option to tell Postage where your connection list is located.  
       If not specified, Postage looks in the same folder as the config file for a file named postage-connections.conf. If Postage can't find a connection file, it will error.

`-s` or `--super-only=` or `super_only=`  
       `Boolean;` defaults to true  
       This tells Postage whether or not to only allow super users to login. The recommended value is true and will restrict users who are not super users from logging in to any PostgreSQL instance through Postage. Note that a connection will be made to PostgreSQL in order to test if the user is a superuser.  

`-g` or `--login-group=` or `login_group=`  
       `String;` no default  
       This tells Postage to only allow users in a certain PostgreSQL group to login to Postage. Note that a connection will be made to PostgreSQL in order to test if the user is a member of the login group.

`-r` or `--web-root=` or `web_root=`  
       `String;` Defaults to @prefix@/etc/postage/web_root  
       This tells Postage where the HTML files have been installed to.

`-a` or `--data-root=` or `data_root=`  
       `String;` defaults to ~/.postage/  
       This tells Postage where to put the SQL file history. All tabs are saved to this location so that if you get disconnected from Postage you don't lose your work.

`-p` or `--postage-port=` or `postage_port=`  
       `Integer;` defaults to 8080  
       This tells Postage what port to listen on for browser requests.

`-j` or `--tls-cert=` or `tls_cert=`  
`-k` or `--tls-key=` or `tls_key=`  
       `String;` no defaults  
       These options tell Postage where the TLS Certificate and Key files reside. If you use these options then you'll only be able to access Postage through a secure TLS connection.  
       These options are only necessary if you wish to connect directly to Postage using a secure TLS connection. As an alternative, you can set up Postage in a reverse proxy configuration. This allows your web server to terminate the secure connection and pass on the request to Postage. You can find help to set up this configuration in the INSTALL_NGINX file that came with your distribution.

`-n` or `--allow-custom-connections=` or `allow_custom_connections=`  
       `Boolean;` defaults to false  
       This tells Postage whether or not to allow anyone to use a custom connection from the login screen.

`-l` or `--log-level=` or `log_level=`  
       `String;` defaults to error  
       This option regulates the frequency and verbosity of log messages. Possible values are none, error, warn, notice and info.

`-t` or `--login-timeout=` or `login-timeout=`  
       `Integer;` defaults to 1200  
       This option regulates the timeout after the last page is closed.

`-x` or `--local-only=` or `local-only=`  
       `Boolean;` defaults to false  
       This tells Postage whether or not to set the listening socket to local addresses only.

## SETTING UP A CONNECTION TO A POSTGRESQL SERVER

Postage requires at least one PostgreSQL server be listed in the postage-connections.conf file. This version of Postage doesn't allow you to specify a server from the command line. Enter only one PostgreSQL server per line.

**The format of a connection string is:**  
```
[server name]: [standard PostgreSQL connection string]
```

Detailed information about PostgreSQL connection strings is available at: http://www.postgresql.org/docs/current/static/libpq-connect.html

Note that you do not enter your user name or password in this file. That information will be entered on the login screen. If you put a username or password in this file, it will be removed by Postage before attempting to connect to a database.

#### EXAMPLE CONNECTION STRINGS:
```
nuc-server: hostaddr=192.168.0.100 port=5432 dbname=postgres
mini-server: hostaddr=127.0.0.1 port=5432 dbname=postgres sslmode=require
```

## EXAMPLES
Run `postage` (short argument):
```
@prefix@/sbin/postage -c @prefix@/etc/postage/postage.conf -d @prefix@/etc/postage/postage-connections.conf
```

Run `postage` (long argument):
```
@prefix@/sbin/postage --config-file=@prefix@/etc/postage/postage.conf --connection-file @prefix@/etc/postage/postage-connections.conf
```

## TROUBLESHOOTING
Try accessing your database through psql. If you can, double check your connection string parameters. If you can't connect, you may have a firewall problem.


## AUTHOR
Copyright (c) 2017 Workflow Products, LLC

Created by Annunziato Tocci

Report bugs to https://github.com/workflowproducts/postage/issues  
Send us feedback! Current contact information can be found at workflowproducts.com  
