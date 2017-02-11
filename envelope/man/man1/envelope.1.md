envelope(1) -- PostgreSQL Administration for the web
===================================================

## FULL PATH
This instance of envelope was installed as `@prefix@/sbin/envelope` (Usually `/usr/local/sbin/envelope`)

## SYNOPSIS
```
envelope
       [-h | --help]
       [-v | --version]
       [-c <config-file> | --config-file=<config-file>]
       [-d <connection-file> | --connection-file=<connection-file>]
       [-s <super-only> | --super-only=<super-only>]
       [-g <login-group> | --login-group=<login-group>]
       [-r <web-root> | --web-root=<web-root>]
       [-a <data-root> | --data-root=<data-root>]
       [-p <port> | --envelope-port=<port>]
       [-j <tls-cert> | --tls-cert=<tls-cert>]
       [-k <tls-key> | --tls-key=<tls-key>]
       [-l <log-level> | --log-level=<log-level>]
       [-n <allow_custom_connections> | --allow-custom-connections=<allow-custom-connections>]
       [-t <login-timeout> | --login-timeout=<login-timeout>]
```

## DESCRIPTION
The `envelope` utility is  a tool to make managing your PostgreSQL database fast and easy. It provides web access and can be used on a tablet, or even on a phone.

All log output is pushed to stderr, if you are pushing that to a file, then you must handle rotating the file yourself or it will get large and slow `envelope` down.


## OPTIONS
`-h` or `--help`  
       Print usage and exit

`-v` or `--version`  
       Print version information and exit

`-c` or `--config-file=`  
       `String;` defaults to @prefix@/etc/envelope/envelope.conf  
       You can use this option to tell Envelope where to look for the configuration file. A sample configuration file is provided in @prefix@/etc/envelope. If there is no file specified Envelope will look in the current directory for a config file. If no config file is found Envelope will proceed with default values.

The following options can be specified on the command line or in the configuration file. In the event a value is specified on the command line and in the config file, Envelope will always use the command line option. Note that if no option is specified then some options will be set to a default value.

`[command line short]` or `[command line long]` or `[config file]`

`-d` or `--connection-file=` or `connection_file=`  
       `String;` defaults to /usr/local/etc/envelope/envelope-connections.conf  
       When you install Envelope, the Makefile will generate a path to the sample envelope-connections.conf file and put it in the sample config file. Use this option to tell Envelope where your connection list is located.  
       If not specified, Envelope looks in the same folder as the config file for a file named envelope-connections.conf. If Envelope can't find a connection file, it will error.

`-s` or `--super-only=` or `super_only=`  
       `Boolean;` defaults to true  
       This tells Envelope whether or not to only allow super users to login. The recommended value is true and will restrict users who are not super users from logging in to any PostgreSQL instance through Envelope. Note that a connection will be made to PostgreSQL in order to test if the user is a superuser.  

`-g` or `--login-group=` or `login_group=`  
       `String;` no default  
       This tells Envelope to only allow users in a certain PostgreSQL group to login to Envelope. Note that a connection will be made to PostgreSQL in order to test if the user is a member of the login group.

`-r` or `--web-root=` or `web_root=`  
       `String;` Defaults to /usr/local/etc/envelope/web_root  
       This tells Envelope where the HTML files have been installed to.

`-a` or `--data-root=` or `data_root=`  
       `String;` defaults to ~/.envelope/  
       This tells Envelope where to put the SQL file history. All tabs are saved to this location so that if you get disconnected from Envelope you don't lose your work.

`-p` or `--envelope-port=` or `envelope_port=`  
       `Integer;` defaults to 8080  
       This tells Envelope what port to listen on for browser requests.

`-j` or `--tls-cert=` or `tls_cert=`  
`-k` or `--tls-key=` or `tls_key=`  
       `String;` no defaults  
       These options tell Envelope where the TLS Certificate and Key files reside. If you use these options then you'll only be able to access Envelope through a secure TLS connection.  
       These options are only necessary if you wish to connect directly to Envelope using a secure TLS connection. As an alternative, you can set up Envelope in a reverse proxy configuration. This allows your web server to terminate the secure connection and pass on the request to Envelope. You can find help to set up this configuration in the INSTALL_NGINX file that came with your distribution.

`-n` or `--allow-custom-connections=` or `allow_custom_connections=`  
       `Boolean;` defaults to false  
       This tells Envelope whether or not to allow anyone to use a custom connection from the login screen.

`-l` or `--log-level=` or `log_level=`  
       `String;` defaults to error  
       This option regulates the frequency and verbosity of log messages. Possible values are none, error, warn, notice and info.

`-t` or `--login-timeout=` or `login-timeout=`  
       `Integer;` defaults to 1200  
       This option regulates the timeout after the last page is closed.

## SETTING UP A CONNECTION TO A POSTGRESQL SERVER

Envelope requires at least one PostgreSQL server be listed in the envelope-connections.conf file. This version of Envelope doesn't allow you to specify a server from the command line. Enter only one PostgreSQL server per line. For envelope, only the first server is user.

**The format of a connection string is:**  
```
[server name]: [standard PostgreSQL connection string]
```

Detailed information about PostgreSQL connection strings is available at: http://www.postgresql.org/docs/current/static/libpq-connect.html

If you put a username in this connection string, Envelope will connect as that user (using .pgpass or whatever other means of authentication you set up), then check the password against pg_authid, then SET SESSION AUTHORIZATION afterwards.

It is recommended to have a superuser in your database specifically for envelope.  
The recommended script for creating this user is:  
```
CREATE ROLE <username> LOGIN SUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD '<password>'
```

Of course, you should choose a name and password that doesn't have 'envelope' in it, otherwise the people who try to break into your database can make that assumption.

#### EXAMPLE CONNECTION STRINGS:
```
nuc-server: hostaddr=192.168.0.100 port=5432 dbname=postgres
mini-server: hostaddr=127.0.0.1 port=5432 dbname=postgres sslmode=require
```

## EXAMPLES
Run `envelope` (short argument):
```
/usr/local/sbin/envelope -c /usr/local/etc/envelope/envelope.conf -d /usr/local/etc/envelope/envelope-connections.conf
```

Run `envelope` (long argument):
```
/usr/local/sbin/envelope --config-file=/usr/local/etc/envelope/envelope.conf --connection-file /usr/local/etc/envelope/envelope-connections.conf
```

## TROUBLESHOOTING
Try accessing your database through psql. If you can, double check your connection string parameters. If you can't connect, you may have a firewall problem.


## AUTHOR
Copyright (c) 2017 Workflow Products, LLC

Created by Annunziato Tocci

Report bugs to https://github.com/workflowproducts/envelope/issues  
Send us feedback! Current contact information can be found at workflowproducts.com  
