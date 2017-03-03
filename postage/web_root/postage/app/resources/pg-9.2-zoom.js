//global window, GS, document, evt

// we want pages that load this script to be able to tell if this file loaded
//      successfully.
// side note, JSLINT says the variable is unused because only other files would
//      use this variable. don't try to fix this warning
var bolZoomLoaded = true;
// now, to test if the file loaded, all you have to do is this:
//          if (window.bolZoomLoaded) {
//              // file load successfully
//          }
// or, you could test if the file didn't load like this:
//          if (!window.bolZoomLoaded) {
//              // file failed to load
//          }

// we don't want to pollute the global namespace with several zoom related variables
//      so instead, we'll just make one, global JSON object to hold all the global
//      variables we need
var zoomGlobals = {
    "intMin": 0,
    "intMax": 0,
    "intDefault": 0,
    "resizeThrottle": null
};


// if you're new to this file, you should skip to the bottom of the file. the
//      function that starts everything off is there.


// we need to be able to get the font size of the body (in pixels). we need this because
function zoomGetBodyFontSize() {
    "use strict";
    return GS.getTextHeight(document.body, false);
}

// we need to be able to get the zoom property, we also don't want to depend on the
//      zoom property's name in multiple places.
function zoomGet() {
    "use strict";
    // the zoom number must be integer type, may move this to float at some point
    return parseInt(localStorage.postageZoom, 10);
}

// we need to be able to take the zoom property and set the body font-size from it
function zoomLoadCookie() {
    "use strict";
    var intZoomPixels = zoomGet();

    // we only want to set the body's font-size if the postage zoom has been set
    if (!isNaN(intZoomPixels)) {
        document.body.style.fontSize = (intZoomPixels + 'px');

        // some elements depend on dimensions that were set with EMs and must be alerted to a
        //      change of size. thankfully, such items need to listen for window resizes
        //      already. so, we'll just trigger a window resize of our own. I might be wrong,
        //      but I think that this is what Google Chrome does after they zoom.
        GS.triggerEvent(window, 'resize');
    }
}

// we need to be able to set the zoom, we also don't want to depend on the
//      zoom property's name in multiple places.
function zoomSet(newValue) {
    "use strict";
    var intValue = parseInt(newValue, 10);

    // we don't want the new value going under the min zoom
    if (intValue < zoomGlobals.intMin) {
        intValue = zoomGlobals.intMin;
    }

    // we don't want the new value going over the max zoom
    if (intValue > zoomGlobals.intMax) {
        intValue = zoomGlobals.intMax;
    }

    // we want the new setting to persist across sessions
    localStorage.postageZoom = intValue;

    // we want the body's font-size to be updated
    // on MS Edge, the gs-page responding to the window resize slows down the browser,
    //      so, we'll throttle to 10ms
    if (zoomGlobals.resizeThrottle !== null) {
        clearTimeout(zoomGlobals.resizeThrottle);
        zoomGlobals.resizeThrottle = null;
    }
    zoomGlobals.resizeThrottle = setTimeout(function () {
        zoomLoadCookie();
        zoomGlobals.resizeThrottle = null;
    }, 10);
}


// we need to bind the key and mousewheel events for zooming the page.
//      side note, JSLINT says this function is unused because it's called in the
//              JS of the page that will use the zoom functionality. don't try to
//              fix this warning.
function zoomStart() {
    "use strict";

    // This will need to be implemented by overriding the browser's CMD/CTRL-PLUS,
    //      CMD/CTRL-MINUS, CMD/CTRL-SHIFT-EQUALS, CMD/CTRL-SHIFT-DASH and
    //      CMD/CTRL-mousewheel functionality with our own zoom CSS. Zooming will
    //      be simple, our sizing CSS is measured in EMs and so all you have to do
    //      is set the font-size on the body.
    // For PLUS/MINUS you just intercept the keydown event,
    //      preventDefault/stopPropagation when the correct keys are down and set
    //      a cookie with a new zoom value.
    // For mousewheel you just intercept the mousewheel event,
    //      preventDefault/stopPropagation when the correct keys are down and set
    //      a cookie with a new zoom value using the event object's deltaX to gauge
    //      how much you need to add/subtract from the zoom value.

    // prevent touch devices because they don't always have a keyboard accessible
    if (!evt.touchDevice) {
        // we need to make sure the focus isn't in the iframe
        if (document.getElementById('focus-stealer')) {
            document.getElementById('focus-stealer').focus();
        }

        // for convienence and easy configuration, we'll save the max and min zooms
        //      as variables
        zoomGlobals.intMin = 12;
        zoomGlobals.intDefault = zoomGetBodyFontSize();
        zoomGlobals.intMax = 30;

        // because this function is the start of the zoom functionality, we can assume
        //      that the body has not yet been set with the correct font-size. because
        //      this is the case, set the body's font-size.
        zoomLoadCookie();

        // we need to listen for shortcuts that involve zooming, namely:
        //      CMD/CTRL-PLUS
        //      CMD/CTRL-MINUS
        //      CMD/CTRL-SHIFT-EQUALS
        //      CMD/CTRL-SHIFT-DASH
        window.addEventListener('keydown', function (event) {
            // windows and mac have different meta keys
            var metaKey = (event.metaKey || event.ctrlKey);

            // cargo cult way of getting keycode
            var keyCode = (event.keyCode || event.which);

            //// we'll make the shiftkey have a shortcut and have the same convention as
            ////      variables above
            //var shiftKey = (event.shiftKey);

            // we need a place to store the zoom temporarily while we make modifications
            //      to it
            var intZoom;

            // if the home iframe exists, we want access to it
            var homeFrame = document.getElementById('iframe-news');

            //console.log('keydown', metaKey, keyCode, shiftKey);

            // sometimes, the mouse is over the home iframe. so if the home iframe
            //      exists and meta is down, add "pointer-events: none;" to the iframe.
            //      "pointer-events: none;" makes it so that mouse events pass through
            //      the iframe and therefore we can capture them
            if (homeFrame) {
                homeFrame.style.pointerEvents = 'none';
            }

            // if the user presses any of these:
            //      CMD/CTRL-PLUS
            //      CMD/CTRL-SHIFT-EQUALS
            if (
                // commented out because I naturally forgot the shift key and it
                //      turns out the browser listens to that as well, so now we
                //      do as well
                //(
                //    metaKey && // CMD/CTRL
                //    keyCode === 107 // PLUS (mac/windows)
                //) ||
                //(
                //    metaKey && // CMD/CTRL
                //    shiftKey && // SHIFT
                //    (
                //        keyCode === 187 || // EQUALS (mac)
                //        keyCode === 61 // EQUALS (windows)
                //    )
                //)
                metaKey && // CMD/CTRL
                (
                    keyCode === 107 || // PLUS (mac/windows)
                    keyCode === 187 || // EQUALS (mac)
                    keyCode === 61 // EQUALS (windows)
                )
            ) {
                // we need to prevent the browser from zooming the page.
                event.preventDefault();
                event.stopPropagation();

                // we need to get the current zoom so that we can increment it
                intZoom = zoomGet();

                // sometimes, the zoom has not been set yet, if so, assume that the
                //      font-size of the browser is the starting point
                if (!intZoom) {
                    intZoom = zoomGetBodyFontSize();
                }

                // we need to modify the zoom level before we save it
                intZoom += 1;

                // we need to remember the new zoom across sessions
                zoomSet(intZoom);

            // if the user presses any of these:
            //      CMD/CTRL-MINUS
            //      CMD/CTRL-SHIFT-DASH
            } else if (
                // commented out because I naturally forgot the shift key and it
                //      turns out the browser listens to that as well, so now we
                //      do as well
                //(
                //    metaKey && // CMD/CTRL
                //    keyCode === 109 // MINUS (mac/windows)
                //) ||
                //(
                //    metaKey && // CMD/CTRL
                //    shiftKey && // SHIFT
                //    (
                //        keyCode === 189 || // DASH (mac)
                //        keyCode === 173 // DASH (windows)
                //    )
                //)
                metaKey && // CMD/CTRL
                (
                    keyCode === 109 || // MINUS (mac/windows)
                    keyCode === 189 || // DASH (mac)
                    keyCode === 173 // DASH (windows)
                )
            ) {
                // we need to prevent the browser from zooming the page.
                event.preventDefault();
                event.stopPropagation();

                // we need to get the current zoom so that we can increment it
                intZoom = zoomGet();

                // sometimes, the zoom has not been set yet, if so, assume that the
                //      font-size of the browser is the starting point
                if (!intZoom) {
                    intZoom = zoomGetBodyFontSize();
                }

                // we need to modify the zoom level before we save it
                intZoom -= 1;

                // we need to remember the new zoom across sessions
                zoomSet(intZoom);

            // if the user presses any of these:
            //      CMD/CTRL-ZERO
            } else if (
                metaKey && // CMD/CTRL
                (
                    keyCode === 48 || // ZERO (windows numberbar, mac numberbar/keypad)
                    keyCode === 96 // ZERO (windows keypad)
                )
            ) {
                // reset to the default font size
                intZoom = zoomGlobals.intDefault;

                // we need to remember the new zoom across sessions
                zoomSet(intZoom);
            }
        });

        // sometimes, someone will click on the home iframe, we need to prevent focus
        //      from staying in the frame
        if (document.getElementById('focus-stealer')) {
            window.addEventListener('blur', function () {
                var active = document.activeElement;

                if (active.getAttribute('id') === 'iframe-news') {
                    setTimeout(function () {
                        document.getElementById('focus-stealer').focus();
                    }, 10);
                }
            });
        }

        // in the keydown code, on meta key down, we add some css to the home iframe
        //      (if it exists). this keyup code resets that CSS if the meta key is
        //      back up
        window.addEventListener('keyup', function (event) {
            // windows and mac have different meta keys
            var metaKey = (event.metaKey || event.ctrlKey);

            // if the home iframe exists, we want access to it
            var homeFrame = document.getElementById('iframe-news');

            // if the home iframe exists, remove the CSS
            if (metaKey && homeFrame) {
                homeFrame.style.pointerEvents = '';
            }
        });

        // used wheel instead of mousewheel for firefox compatibility
        window.addEventListener('wheel', function (event) {
            var delta;
            var zoomAmount;

            // we need a place to store the zoom temporarily while we make modifications
            //      to it
            var intZoom;

            // windows and mac have different meta keys
            var metaKey = (event.metaKey || event.ctrlKey);

            if (metaKey) {
                // we need to prevent the browser from scrolling whatever the mouse is
                //      over.
                event.preventDefault();
                event.stopPropagation();

                // we need to get the current zoom so that we can increment it
                intZoom = zoomGet();

                // sometimes, the zoom has not been set yet, if so, assume that the
                //      font-size of the browser is the starting point
                if (!intZoom) {
                    intZoom = zoomGetBodyFontSize();
                }

                // we want to zoom more depending on how fast the user is scrolling,
                //      for this, we need to use the event object's "deltaY" property
                // the delta gives two pieces of info:
                //      how fast is the user scrolling
                //          (
                //              float ranging from 4ish to 1500s on an Apple mac mini
                //                  with an M570 Logitech wireless trackball
                //              side note, I tested and the delta amount is not changed
                //                  based on scrolling speed settings from the Apple
                //                  System Preferences
                //          )
                //      what direction is the user scrolling (negative is up)
                delta = event.deltaY;

                // we need a variable amount that we increment or decrement the zoom by
                //      so, for convienence we'll store the amount in a variable
                // we're going to turn the delta into a zoom amount. note, we are not
                //      doing anything different for negative deltas, the math applies
                //      the same either way.
                zoomAmount = Math.round(delta / 500);

                // sometimes, the user isn't scrolling fast enough for zoomAmount to be
                //      over 0, so we'll make 1 the minimum for zoomAmount
                if (zoomAmount === 0) {
                    // the delta might be negative (meaning scrolling up) so if that's
                    //      the case, zoomAmount should be -1
                    if (delta < 0) {
                        zoomAmount = -1;
                    } else {
                        zoomAmount = 1;
                    }
                }

                // we want the page to zoom in if the user scrolls up (like Google Maps).
                //      if I'm wrong, just change the -= operator to a += operator. if we
                //      find ourselves flipping this back and forth because of user
                //      preferences, put the direction behind a preference.
                intZoom -= zoomAmount;

                // we need to remember the new zoom across sessions
                zoomSet(intZoom);

                //console.log('mousewheel', delta, zoomAmount);
            }
            //console.log('mousewheel', event);
        });
    }
}