## Is Electron a problem?

The article ["Electron is Flash for the desktop"](https://josephg.com/blog/electron-is-flash-for-the-desktop/) caused a bit of a commotion among the Postage team recently. Speed has of course been central to our cause since the inception of Postage as "A fast alternative to PGAdmin" so it struck us right in the gut.

My initial reaction was to fire up Task Manager, take out a stop watch and start testing. We learned a few things from that and for that reason I think that "Electron is Flash for the desktop" was a worthwhile read.

## Software is resource intensive.

My first takeaway from the article was that we hadn't been watching our memory usage in Electron. Memory usage is important and can lead to all kinds of bottlenecks. So I looked into it. 

We had a memory leak! It was a bad one too. Memory usage just grew and grew. This was especially disappointing since we spend a lot of time making sure we don't have memory leaks in C. We use Valgrind and other time consuming tactics to be certain Postage is performing well and freeing memory. 

**Our problem was that we had completely overlooked the web browser.** We were not properly attaching various items to DOM elements so they were essentially global objects. Once they were no longer needed the DOM was destroyed but the globals were not. 

Shortly after discovery we dealt with the leak and the problem appears to be gone. We weren't thinking about it and we got burned. Lesson learned. 

## Making a cross platform application is hard. Electron has its perks.

Although Postage started out as a web server intended for command line install, we spent a lot of time on install issues from the very beginning. Much of this was our own fault.

One big mistake was attempting to use the new LIBTLS library from LibreSSL. It seemed like a good idea at the time. Recently, we've decided we can't wait for LIBTLS to become usable in a cross-platform way so we went to the OpenSSL API. Now we don't have to ship LibreSSL with Postage, so if you want to use LibreSSL you'll need to install it yourself. 

Another mistake was attempting to write a command line installer. Very few people used it. I can say that with authority because I can't remember ever using it successfully. It was a hard problem and we would have been better off putting more effort into making configure-make-install work better.

## Are you persuaded by facts? 

And then along came Electron. Mac install went to a dmg--just drag it to your applications folder. Install on Windows is only fifteen seconds and no longer requires an uninstall first. These times are reasonable and are much faster than installing from source. Take a look at these stats for a typical windows box:

```
            Install   Startup
PGAdmin3    ~10sec    4sec
PGAdmin4    ~60sec    35sec
Postage     ~15sec    4sec
```

I think it's reasonable to say that Electron is perfectly fine as regards install and startup times as we've implemented it. I know there are apps that use Electron that start up slowly, but that is not a problem inherent to Electron--Postage proves that. Considering that our goal has always been to deliver a fast app, we have yet to see how Electron prevents us from doing so.

## Is Electron the problem, is your code slow?

We've covered memory, install and startup issues. Postage doesn't really use Node in Electron so I can't comment on that. What's left is performance for practical matters, like displaying query results. 

Loading times: 
  Query: "SELECT * FROM wtkv2.rtime;", 37k records:
```
 pgAdmin3:        18sec
 pgAdmin4:         7sec
 Postage(3.2.12): 12sec
 Postage(3.2.13):  2sec
```






