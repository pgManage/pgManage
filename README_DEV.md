# Attention Contributors!!

At this time, PgManage is under an Apache license. The Apache license seems to have been written in such a way that you don't need to obtain contributor license agreements, but then, Apache makes you sign them anyway. Therefore, please pay special attention to the following section "Contributor License Agreements".

# Contributor License Agreements

We'd love to accept your patches, but before we can take them, we need you to sign a legal document called a "Contributor License Agreement"(CLA).

The Workflow Products, L.L.C. CLA must be signed by all contributors.

Once you are CLA'ed, we'll be able to accept your pull requests. For any issues that you face during this process, please add an issue on the project at Github explaining the problem or notify us via email at justin@wfprod.com and we will get it fixed.

NOTE: At this time, only original source code from individuals that have signed the CLA can be accepted into the repository. If you represent a corporation or are an employee tasked with contributing then submit a note in addition to your individual CLA and we will reply with a corporate CLA. Once they are both submitted we'll be able to accept your patch.

# Developer Guide

##TROUBLESHOOTING PERFORMANCE

####With GDB:

    gdb pgmanage PGMANAGEPID
    break ev_run
    continue

Then keep on running:

	n

Until you get to EV_INVOKE_PENDING(), then run:

	si

Until you find out what watcher is invoked. Once you know what watcher is the problem, it should be pretty easy to figure out what the bottleneck is.

####With LLDB:

    lldb pgmanage --attach-pid=PGMANAGEPID
    breakpoint set --name ev_run
	continue

Then keep on running:

	thread step-over

Until you get to EV_INVOKE_PENDING(), then run:

	thread step-inst

Until you find out what watcher is invoked. Once you know what watcher is the problem, it should be pretty easy to figure out what the bottleneck is.

####DEBUGGING

Using GDB to debug general things (this has the effect of make test, just using gdb (look at Makefile.in for details)):

    make all gdb

Using valgrind (this has the effect of make test, just using valgrind with some options (look at Makefile.in for details)):

    make all valgrind

Note that valgrind is going to detect a few of uninitialized reads/jumps from libpq, this is not something that we can fix easily.

Using GDB and Valgrind at the same time (Yikes!), I found some related information here: http://tromey.com/blog/?p=731

## Dependencies

#### LIBEV
Different versions of libev may not work with every version of PgManage. To avoid problems, the PgManage compile process is set up to statically compile libev. This way we control what version you use.

Copyright 2016 Workflow Products LLC
