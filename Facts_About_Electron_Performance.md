## Is Electron a problem or a tool?

The article ["Electron is Flash for the desktop"](https://josephg.com/blog/electron-is-flash-for-the-desktop/) caused a bit of a commotion among the Postage team recently. Speed has of course been central to our cause since the inception of Postage as "A fast alternative to PGAdmin" so it struck us right in the gut.

My initial reaction was to fire up Task Manager, take out a stop watch and start testing. We learned a few things from that and for that reason I think that "Electron is Flash for the desktop" was a worthwhile read.

## Have you ever had a memory leak? 

My first takeaway from the article was that we hadn't been watching our memory usage in Electron. Memory usage is important and can lead to all kinds of bottlenecks. So I looked into it. 

We had a memory leak! It was a bad one too. Memory usage just grew and grew. This was especially disappointing since we spend a lot of time making sure we don't have memory leaks in C. We use Valgrind and other time consuming tactics to be certain Postage is performing well and freeing memory. 

**Our problem was that we had completely overlooked the web browser.** We were not properly attaching various items to DOM elements so they were essentially global objects. Once they were no longer needed the DOM was destroyed but the globals were not. 

Shortly after discovery we dealt with the leak and the problem appears to be gone. We weren't thinking about it and we got burned. Lesson learned. 

## Making a cross platform application is hard. Electron has its perks.

Although Postage started out as a web server intended for command line install, we spent a lot of time on install issues from the very beginning. Much of this was our own fault.

One big mistake was attempting to use the new LIBTLS library from LibreSSL. It seemed like a good idea at the time. Recently, we've decided we can't wait for LIBTLS to become usable in a cross-platform way so we went to the OpenSSL API. Now we don't have to ship LibreSSL with Postage, so if you want to use LibreSSL you'll need to install it yourself. 

Another mistake was attempting to write a command line installer. Very few people used it. I can say that with authority because I can't remember ever using it successfully. It was a hard problem and we would have been better off putting more effort into making configure-make-install work better instead.

## Are you persuaded by facts? 

Electron solved all of our install issues in just a few days. We have continued to pursue making Postage install well on many platforms with configure-make-install but most users can download the binaries and be up and running in seconds. 

Mac install went to a dmg--just drag it to your applications folder. Install on Windows is only fifteen seconds and no longer requires an uninstall first. These times are reasonable and are much faster than installing from source. Take a look at these stats for a typical windows box:

```
            Install   Startup
PGAdmin3    ~10sec    4sec
PGAdmin4    ~60sec    25sec # updated for 1.6
Postage     ~15sec    4sec
```

I think it's reasonable to say that Electron is perfectly fine as regards install and startup times as we've implemented it. I know there are apps that use Electron that start up slowly, but that is not a problem inherent to Electron--Postage proves that. Considering that our goal has always been to deliver a fast app, we have yet to see how Electron prevents us from doing so as far as install and startup times are concerned.

## Is Electron the problem, or is your code slow?

We've covered memory, install and startup issues. Postage doesn't really use Node in Electron so I can't comment on that. What's left is performance for practical matters, like displaying query results. Let's get right to the stopwatch times.

Loading time from 'run' to display of data in grid. We used this query: "SELECT * FROM wtkv2.rtime;". It returns 37k records. The data is part of our internal punch clock app and was chosen just because it was there.

```
 pgAdmin3:        18sec
 pgAdmin4:         2sec # updated for 1.6 (takes forever to scroll to last record though)
 Postage(3.2.12): 12sec
 Postage(3.2.13):  2sec
 Postage(3.2.16)   8sec # ??? I am having connection issues.
```

There you have it. We've been working on a faster grid for displaying table data for some time. It uses Websockets to get the data and a tab delimited transfer format. 

Note that 3.2.12 was quite slow, yet a liberal application of time and talent caused 3.2.13 to become extremely fast. 

This isn't the whole picture. I'm confident that Postage's grid has slowed down over the last few months. We haven't been fixing or improving the old grid code because we knew it was destined to be replaced. Like many other Electron projects we're resource constrained and performance suffered.

## Do you believe more choices make for a better ecosystem?

Postage fills a gap in the PostgreSQL ecosystem. That's not a criticism of the PGAdmin team. I'm sure they are as resource constrained as we are and making software is hard. I'm sure the reason the PGAdmin team dropped PGAdmin3 was probably because the code base is sixteen years old! That's an amazing accomplishment and all of us here with the Postage team are thankful for their efforts over the years. We certainly could not have done what they did back in 2000ish when they started. We've only managed to build Postage on the shoulders of Github, Cloud9, Laura Doktorova's dot.js, and others and for that we're very thankful.

I'm also sure PGAdmin4 has come along nicely and will become the de-facto choice for people who want a graphical client. It is the official client of PostgreSQL and as such they only need to be 'good enough' to win nearly all the users looking for a free client. People who wish to pay will of course overlook Postage because it's free. (Wait, that doesn't leave us with many users...)

If you do use Postage, please file issues on Github. We need users to step up a little more than other projects because of our limited audience!

## Do you consider yourself open minded and adventurous?

If I could leave you with one thought it would be that Electron is not a reason to disuade you from trying any project. 

You may feel that a native application could do better than Postage on the times we posted. I'm willing to accept that but sceptical. 

However, I think the facts speak for themselves in asserting that the difference between Postage 3.2.12 and Postage 3.2.13 was a swing from performing poorly (due to lack of effort on the programmer's part) to performing very well. As a result, we think the facts support the idea that **Electron performance is up to the programmer.**

## Do you appreciate freedom? 

Using web technologies to draw the interface also gives a good deal more freedom than using native elements. Native elements are by their nature a limited set. Many platforms are customizable but cross platform solutions for native apps are mostly not. I also believe that with a fair amount of effort any user interface can be made to perform better in Electron(Chromium) than a native interface. This is because features can be pared down to the use case whereas native elements are difficult or impossible to optimize. Yes you get great perfomance out of the box on native, but you are also limited by resources. For a given amount of resources I assert that web tech will often give you more. More customization, more platforms, more performance, more of what you need.  Besides, freedom is advantageous for many reasons, including performance, and I am not alone in appreciating it. 

## Do you consider yourself helpful?

Of course, if someone wants to sponser Postage we can test a native implementation and if it performs better we'll release it. You'll get no argument from me. Until that happens I hope you'll give projects like Postage a try. 

If they are unacceptable for any reason, file an issue and move on if you have to. Join us as part of the solution. We really do appreciate everyone who let's us know about their experiences with Postage. I'm sure most other projects do too.

Thank you for reading.

The Workflow Products Team


