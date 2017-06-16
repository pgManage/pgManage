# Installing Postage (Web Server mode) ON WINDOWS

## Please note that we put a lot of effort into making sure Postage installs cleanly on every platform. If you have an issue please [report it](https://github.com/workflowproducts/postage/issues) and we'll get it fixed. 

## Dependencies

There are a couple of dependencies but we're currently shipping them all with the Electron install of Postage targeted at Windows. You shouldn't have to install anything to run Postage on your system.

####DOWNLOADING POSTAGE

https://github.com/workflowproducts/postage/releases


####NOTICE: INSTALLING POSTAGE SERVER ON *NIX SYSTEMS IS EXPLAINED IN THE DOCUMENT: INSTALL_WEB_SERVER_MODE.md

####INSTALLING POSTAGE

Download and install the Electron version of Postage from https://github.com/workflowproducts/postage/releases

It should be named something like: Postage.Windows.#.#.##.zip


####RUNNING POSTAGE

To run Postage:

    C:\Program Files (x86)\Workflow Products\Postage\resources\app\postage\postage.exe

Long Version:

    "C:\Program Files (x86)\Workflow Products\Postage\resources\app\postage\postage.exe" -c "C:\Program Files (x86)\Workflow Products\Postage\resources\app\postage\config\postage.conf" -d "C:\Program Files (x86)\Workflow Products\Postage\resources\app\postage\config\postage-connections.conf"

####Configuring POSTAGE

Before running Postage for the first time you may want to configure some options. All the options are explained in the Postage man file:

  C:\Program Files (x86)\Workflow Products\Postage\resources\app\postage\web_root\postage\app\postage.1.html

Current configuration options allow you to set various paths, various access restrictions, web port and log level. Note that in order to make Postage publish to HTTPS, you need to add paths for a TLS cert and key.

You'll also need to set up a connection string to tell Postage where your PostgreSQL databases are published. The default connection string config file located in 
  
    C:\Program Files (x86)\Workflow Products\Postage\resources\app\postage\config\
    
There are examples in the provided postage-connections.conf file and further info is available in the man file.


####UNINSTALLING POSTAGE

Uninstall Postage from the "Control Panel" > "Uninistall a program". 
