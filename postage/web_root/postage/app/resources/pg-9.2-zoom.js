//global window, GS, document
var bolZoomLoaded = true;

// if you're new to this page, you should start at the bottom of the file. the
//      function that starts everything off is there.




// we need to be able to set the zoom cookie, we also don't want to depend on the
//      zoom cookie's name in multiple places.
function zoomSetCookie(newValue) {
    "use strict";
    GS.setCookie('postage-zoom', newValue, 9999999);
}

// we need to be able to get the zoom cookie, we also don't want to depend on the
//      zoom cookie's name in multiple places.
function zoomGetCookie() {
    "use strict";
    return GS.getCookie('postage-zoom');
}

// we need to be able to get the font size of the body (in pixels). we need this because
function zoomBodyFontSize() {
    "use strict";
    return GS.getCookie('postage-zoom');
}

// we need to be able to take the zoom cookie and set the body font-size from it
//      we do this multiple times, hence, the function
function zoomLoadCookie() {
    "use strict";
    var intZoomPixels = zoomGetCookie();

    // we only want to set the body's font-size if the postage zoom has been set
    if (!isNaN(intZoomPixels)) {
        document.body.style.fontSize = (intZoomPixels + 'px');
    }
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

        // shortcut and same convention as variables above
        var shiftKey = (event.shiftKey);

        console.log('keydown', metaKey, keyCode, shiftKey);

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
            
            // sometimes, the zoom has not been set yet, if so, assume that the
            //      font-size of the browser is the starting point

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
            
            // sometimes, the zoom has not been set yet, if so, assume that the
            //      font-size of the browser is the starting point
        }
    });

    window.addEventListener('mousewheel', function (event) {
        console.log('mousewheel');
    });
}








