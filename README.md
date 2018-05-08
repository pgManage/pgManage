# pgManage - A fast PostgreSQL admin tool
 
A fast replacement for PGAdmin!
 
# If this is your first time trying pgManage:
# Do not use 'GIT CLONE' to get pgManage!
 
If you'd like to try pgManage please go to ["Releases"](https://github.com/pgManage/pgManage/releases) and download the appropriate package for your OS. The names of these packages start with "pgManage", not "Source Code". The team has spent a ridiculous amount of time ensuring you have an easy, convenient installer for your OS. Please use it. Compiling pgManage from source will only give you the server version and all first time users should try the desktop version first.
 
pgManage can be run in two modes:
 
### Application mode
Releases marked "10.x.x" are Application mode packages. They run in a desktop window and can connect to Postgres locally or remotely. Please go to ["Releases"](https://github.com/pgManage/pgManage/releases) and download the appropriate package for your OS. The names of these packages start with "pgManage". Do NOT download the versions marked "Source Code". These packages are self contained and very easy to install and remove. Note that all the thanks for our wonderful installation process goes to Github and the Electron team. If you are inexperienced in compiling software you want this mode.
 
Installing on Linux is a bit less easy than macOS/Windows:
- To install on Ubuntu, download the .deb package and run: `sudo apt install ./pgManage-whatever.deb`
- To install on RHEL/CentOS, download the .rpm package and run: `yum install ./pgManage-whatever.rpm`
 
**NOTE:** We do not sign the Windows releases, but we do sign the macOS releases.
 
### Web Server mode
Releases marked "Source code" run like a web server. This enables you to connect to pgManage from any browser, even on a phone. Remember to set your firewall appropriately, or even better, use a VPN. This mode is the only mode available for phone/tablet access. This mode makes it easy to install pgManage on one box, then have multiple developers log in and work. We also find it convenient when we're at a client site and need to work from whatever workstation we're in front of at that moment. The names of these packages start with "Source Code". If you have trouble please file an issue (even if you know how to get around it) and we'll get right on it.
 
## Release Schedule
 
Currently we release intermittently.
 
## FEEDBACK AND BUG REPORTS
 
Please contact us with your feedback! Github issues and pull requests are welcome. Please report any issues you have for [FREE support](https://github.com/pgManage/pgManage/issues).
                                                                                                                                                                                                                                                        
## Licensing
 
pgManage is a community project. Anyone presenting a quality patch that asks for commit privileges will likely receive them!
 
pgManage is free for personal and commercial use. Our understanding of the Apache license is that you may use our code for any purpose as long as you mark our code with our copyright and a reference to the license. This way we get credit for our work and you can incorporate it into any project or product.
 
## Why?
 
There are official graphical clients but they are slow. We wanted something fast and were in the position to write it for ourselves.
 
Then we decided to open source it. Looking back, I'm pretty sure the logic was: step one, write pgManage; step two, ???; step three, profit! We're still trying to figure out step two.
 
For now, we are grateful for the PostgreSQL project and all of the contributors to the project, so we're glad to give something back.
 
## Envelope
 
pgManage is pretty awesome. It's also a demonstration of [Envelope](https://github.com/workflowproducts/envelope), our application platform that makes building desktop-quality database applications on top of PostgreSQL or Microsoft SQL Server a breeze.
 
Once you try pgManage we hope it inspires you to have a look at Envelope. Envelope can help you leverage your SQL skills to build rich web and desktop database applications in less time than you ever thought possible.
 
If you do give pgManage a try then you have our gratitude. Let us know what you think and we'll make it better!
 
## Roadmap
 
pgManage is officially in maintenance mode. This means several things and to avoid misunderstandings please read this entire section.
 
1) We will be fixing bugs. Please file issues and we will fix them. We won't turn them over in one day like we have been unless they are work-stopping. Expect once a month releases.
 
2) There are no features we're working on in private. If work is being done it will now be listed in [issues](https://github.com/pgManage/pgManage/issues). Previously we had a private list of items we were working on. Those are all completed. Additionally, pgManage has all the major features we wanted. Any further features would likely be small and there is no benefit to keeping small items secret. If you have a proposal for a feature please post it under the issue tracker.
 
3) Why are we stopping when there are so many things we could do? Workflow Products needs to devote more resources to making money. Now that pgManage is complete we need to take the opportunity to focus on something we can monetize.
 
## Internationalization
 
Anyone wishing to contribute to a translation, please post to [issue #59](https://github.com/pgManage/pgManage/issues/59).
 
Since pgManage runs in a browser we don't really know what will happen if you use pgManage with a non-UTF8 PostgreSQL database. If you experience a problem then please post an issue to [Github Issues](https://github.com/pgManage/pgManage/issues).
 
## Contributing
 
The best way to contribute to pgManage is to start by posting an issue. Please read the [README_DEV](https://github.com/pgManage/pgManage/blob/master/README_DEV.md) file for full details.
 
If you'd like to support pgManage and you're in a position to get us paid work then that helps a lot. We mostly do fussy custom ERP solutions for the Aerospace and Medical industries. Any kind of accounting or inventory application is right up our alley, especially the complex stuff. Our specialty is implementing new systems without disrupting operations (training-free implementations). Check out our website or give us a call [WorkflowProducts.com](http://www.workflowproducts.com/about.html).
 
 
Copyright 2018 Workflow Products LLC
