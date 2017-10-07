# Installing PgManage (Web Server mode) ON WINDOWS

## Please note that we put a lot of effort into making sure PgManage installs cleanly on every platform. If you have an issue please [report it](https://github.com/workflowproducts/pgmanage/issues) and we'll get it fixed. 

## Dependencies

There are a couple of dependencies but we're currently shipping them all with the Electron install of PgManage targeted at Windows. You shouldn't have to install anything to run PgManage on your system.

####DOWNLOADING PGMANAGE

https://github.com/workflowproducts/pgmanage/releases


####NOTICE: INSTALLING PGMANAGE SERVER ON *NIX SYSTEMS IS EXPLAINED IN THE DOCUMENT: INSTALL_WEB_SERVER_MODE.md

####INSTALLING PGMANAGE

Download and install the Electron version of PgManage from https://github.com/workflowproducts/pgmanage/releases

It should be named something like: PgManage.Windows.#.#.##.zip


####RUNNING PGMANAGE

To run PgManage:

    C:\Program Files (x86)\Workflow Products\PgManage\resources\app\pgmanage\pgmanage.exe

Long Version:

    "C:\Program Files (x86)\Workflow Products\PgManage\resources\app\pgmanage\pgmanage.exe" -c "C:\Program Files (x86)\Workflow Products\PgManage\resources\app\pgmanage\config\pgmanage.conf" -d "C:\Program Files (x86)\Workflow Products\PgManage\resources\app\pgmanage\config\pgmanage-connections.conf"

####Configuring PGMANAGE

Before running PgManage for the first time you may want to configure some options. All the options are explained in the PgManage man file:

  C:\Program Files (x86)\Workflow Products\PgManage\resources\app\pgmanage\web_root\pgmanage\app\pgmanage.1.html

Current configuration options allow you to set various paths, various access restrictions, web port and log level. Note that in order to make PgManage publish to HTTPS, you need to add paths for a TLS cert and key.

You'll also need to set up a connection string to tell PgManage where your PostgreSQL databases are published. The default connection string config file located in 
  
    C:\Program Files (x86)\Workflow Products\PgManage\resources\app\pgmanage\config\
    
There are examples in the provided pgmanage-connections.conf file and further info is available in the man file.


####UNINSTALLING PGMANAGE

Uninstall PgManage from the "Control Panel" > "Uninistall a program". 
