//global window, GS, document

// if you're new to this page, you should start at the bottom of the file. the
//      function that starts everything off is there.



var bolZoomLoaded = true;
var zoomGlobals = {
    "intMin": 0,
    "intMax": 0,
    "intDefault": 0
};



// we need to be able to get the font size of the body (in pixels). we need this because
function zoomGetBodyFontSize() {
    "use strict";
    return GS.getTextHeight(document.body, true);
}

// we need to be able to get the zoom cookie, we also don't want to depend on the
//      zoom cookie's name in multiple places.
function zoomGetCookie() {
    "use strict";
    // the zoom number must be integer type, may move this to float at some point
    return parseInt(GS.getCookie('postage-zoom'), 10);
}

// we need to be able to take the zoom cookie and set the body font-size from it
//      we do this multiple times, hence, the function
function zoomLoadCookie() {
    "use strict";
    var intZoomPixels = zoomGetCookie();

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

// we need to be able to set the zoom cookie, we also don't want to depend on the
//      zoom cookie's name in multiple places.
function zoomSetCookie(newValue) {
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
    GS.setCookie('postage-zoom', intValue, 9999999);

    // we want the body's font-size to be updated
    zoomLoadCookie();
}


// we need to bind the key and mousewheel events for zooming the page.
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

    // because this function is the start of the zoom functionality, we can assume
    //      that the body has not yet been set with the correct font-size. because
    //      this is the case, set the body's font-size.
    zoomLoadCookie();

    // for convienence and easy configuration, we'll save the max and min zooms
    //      as variables
    zoomGlobals.intMin = 12;
    zoomGlobals.intDefault = zoomGetBodyFontSize();
    zoomGlobals.intMax = 30;

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

        // we'll make the shiftkey have a shortcut and have the same convention as
        //      variables above
        var shiftKey = (event.shiftKey);

        // we need a place to store the zoom temporarily while we make modifications
        //      to it
        var intZoom;

        //console.log('keydown', metaKey, keyCode, shiftKey);

        // if the user presses any of these:
        //      CMD/CTRL-PLUS
        //      CMD/CTRL-SHIFT-EQUALS
        if (
            (
                metaKey && // CMD/CTRL
                keyCode === 107 // PLUS
            ) ||
            (
                metaKey && // CMD/CTRL
                shiftKey && // SHIFT
                keyCode === 187 // EQUALS
            )
        ) {
            // we need to prevent the browser from zooming the page.
            event.preventDefault();
            event.stopPropagation();

            // we need to get the current zoom so that we can increment it
            intZoom = zoomGetCookie();

            // sometimes, the zoom has not been set yet, if so, assume that the
            //      font-size of the browser is the starting point
            if (!intZoom) {
                intZoom = zoomGetBodyFontSize();
            }

            // we need to modify the zoom level before we save it
            intZoom += 1;

            // we need to remember the new zoom across sessions
            zoomSetCookie(intZoom);

        // if the user presses any of these:
        //      CMD/CTRL-MINUS
        //      CMD/CTRL-SHIFT-DASH
        } else if (
            (
                metaKey && // CMD/CTRL
                keyCode === 109 // MINUS
            ) ||
            (
                metaKey && // CMD/CTRL
                shiftKey && // SHIFT
                keyCode === 189 // DASH
            )
        ) {
            // we need to prevent the browser from zooming the page.
            event.preventDefault();
            event.stopPropagation();

            // we need to get the current zoom so that we can increment it
            intZoom = zoomGetCookie();

            // sometimes, the zoom has not been set yet, if so, assume that the
            //      font-size of the browser is the starting point
            if (!intZoom) {
                intZoom = zoomGetBodyFontSize();
            }

            // we need to modify the zoom level before we save it
            intZoom -= 1;

            // we need to remember the new zoom across sessions
            zoomSetCookie(intZoom);
        }
    });

    window.addEventListener('mousewheel', function (event) {
        console.log('mousewheel', event);
    });
}








