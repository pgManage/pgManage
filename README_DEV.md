# Developer Guide

## TROUBLESHOOTING PERFORMANCE

#### With GDB:

    gdb pgmanage PGMANAGEPID
    break ev_run
    continue

Then keep on running:

	n

Until you get to EV_INVOKE_PENDING(), then run:

	si

Until you find out what watcher is invoked. Once you know what watcher is the problem, it should be pretty easy to figure out what the bottleneck is.

#### With LLDB:

    lldb pgmanage --attach-pid=PGMANAGEPID
    breakpoint set --name ev_run
	continue

Then keep on running:

	thread step-over

Until you get to EV_INVOKE_PENDING(), then run:

	thread step-inst

Until you find out what watcher is invoked. Once you know what watcher is the problem, it should be pretty easy to figure out what the bottleneck is.

#### DEBUGGING

Using GDB to debug general things (this has the effect of make test, just using gdb (look at Makefile.in for details)):

    make all gdb

Using valgrind (this has the effect of make test, just using valgrind with some options (look at Makefile.in for details)):

    make all valgrind

Note that valgrind is going to detect a few of uninitialized reads/jumps from libpq, this is not something that we can fix easily.

Using GDB and Valgrind at the same time (Yikes!), I found some related information here: http://tromey.com/blog/?p=731

## Dependencies

#### LIBEV
Different versions of libev may not work with every version of pgManage. To avoid problems, the pgManage compile process is set up to statically compile libev. This way we control what version you use.

