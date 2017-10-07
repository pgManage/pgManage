# Installing pgManage (Web Server mode) ON WINDOWS

## Please note that we put a lot of effort into making sure pgManage installs cleanly on every platform. If you have an issue please [report it](https://github.com/workflowproducts/pgmanage/issues) and we'll get it fixed. 

## Dependencies

There are a couple of dependencies but we're currently shipping them all with the Electron install of pgManage targeted at Windows. You shouldn't have to install anything to run pgManage on your system.

####DOWNLOADING PGMANAGE

https://github.com/workflowproducts/pgmanage/releases


####NOTICE: INSTALLING PGMANAGE SERVER ON *NIX SYSTEMS IS EXPLAINED IN THE DOCUMENT: INSTALL_WEB_SERVER_MODE.md

####INSTALLING PGMANAGE

Download and install the Electron version of pgManage from https://github.com/workflowproducts/pgmanage/releases

It should be named something like: pgManage.Windows.#.#.##.zip


####RUNNING PGMANAGE

To run pgManage:

    C:\Program Files (x86)\Workflow Products\pgManage\resources\app\pgmanage\pgmanage.exe

Long Version:

    "C:\Program Files (x86)\Workflow Products\pgManage\resources\app\pgmanage\pgmanage.exe" -c "C:\Program Files (x86)\Workflow Products\pgManage\resources\app\pgmanage\config\pgmanage.conf" -d "C:\Program Files (x86)\Workflow Products\pgManage\resources\app\pgmanage\config\pgmanage-connections.conf"

####Configuring PGMANAGE

Before running pgManage for the first time you may want to configure some options. All the options are explained in the pgManage man file:

  C:\Program Files (x86)\Workflow Products\pgManage\resources\app\pgmanage\web_root\pgmanage\app\pgmanage.1.html

Current configuration options allow you to set various paths, various access restrictions, web port and log level. Note that in order to make pgManage publish to HTTPS, you need to add paths for a TLS cert and key.

You'll also need to set up a connection string to tell pgManage where your PostgreSQL databases are published. The default connection string config file located in 
  
    C:\Program Files (x86)\Workflow Products\pgManage\resources\app\pgmanage\config\
    
There are examples in the provided pgmanage-connections.conf file and further info is available in the man file.


####UNINSTALLING PGMANAGE

Uninstall pgManage from the "Control Panel" > "Uninistall a program". 
