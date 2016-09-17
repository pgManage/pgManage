
window.addEventListener('design-register-element', function () {
    'use strict';
    registerDesignSnippet('Push Message', 'GS.pushMessage', 'pushMessage(\'${1:HTML}\', ${2:1500}, function () {${3}});');
});

GS.pushMessage = function (strHTML, intTime, callback) {
    var pushMessageElement, containerElement;
    
    // if there is no html to put in the pushmessage: throw an error
    if (strHTML === undefined) {
        throw 'GS.pushMessage Error: no HTML to display.';
    }
    
    // if there is no container: add it
    if (document.getElementsByTagName('gs-pushmessage-container').length === 0) {
        containerElement = document.createElement('gs-pushmessage-container');
        containerElement.setAttribute('gs-dynamic', '');
        document.body.appendChild(containerElement);
    } else {
        containerElement = document.getElementsByTagName('gs-pushmessage-container')[0];
    }
    
    // create the pushmessage
    pushMessageElement = document.createElement('gs-pushmessage');
    pushMessageElement.setAttribute('gs-dynamic', '');
    pushMessageElement.innerHTML = strHTML;
    
    // append the pushmessage to the container
    containerElement.appendChild(pushMessageElement);
    
    // if there is a callback: run it
    if (typeof callback === 'function') {
        callback.apply(pushMessageElement);
    }
    
    // if there is a time: set a timeout to close the message
    if (intTime) {
        setTimeout(function() {
            GS.closePushMessage(pushMessageElement);
        }, intTime);
    }
    
    // return the pushmessage
    return pushMessageElement;
};

window.addEventListener('design-register-element', function () {
    'use strict';
    registerDesignSnippet('GS.closePushMessage', 'GS.closePushMessage', 'GS.closePushMessage(${0:pushMessageElement});');
    registerDesignSnippet('Close Push Message',  'Close Push Message',  'GS.closePushMessage(${0:pushMessageElement});');
});

GS.closePushMessage = function (pushMessageElement) {
    var containerElement = document.getElementsByTagName('gs-pushmessage-container')[0];
    
    // fade the pushmessage out
    GS.animateStyle(pushMessageElement, 'opacity', '1', '0', function () {
        
        // if there is only one pushmessage element: remove the container
        if (document.getElementsByTagName('gs-pushmessage').length === 1) {
            document.body.removeChild(containerElement);
            
        // else: just remove the element
        } else {
            containerElement.removeChild(pushMessageElement);
        }
    }, 250, 100);
};


document.addEventListener('DOMContentLoaded', function () {
    xtag.register('gs-pushmessage', {
        lifecycle: {},
        events: {},
        accessors: {},
        methods: {}
    });
    
    xtag.register('gs-pushmessage-container', {
        lifecycle: {},
        events: {},
        accessors: {},
        methods: {}
    });
});