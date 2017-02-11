//global window
//jslint white:true multivar:true

// #############################################################
// ################### CROSS PLATFORM EVENTS ###################
// #############################################################

if (window.evt === undefined) {
    window.evt = {};
}

// function for testing if the device has touch capibilities
function touchDeviceTest() {
    'use strict';
    //return 'ontouchstart' in window ||    // works on most browsers
    //       'onmsgesturechange' in window; // works on ie10
    return (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) || false;
}

// display type based on size
function getDeviceType() {
    'use strict';
    // if we are not on a touch device than we must be a desktop
    if (evt.touchDevice === false) {
        return 'desktop';
    }
    // if touch device and screen is bigger than normal phone
    if (evt.touchDevice === true && screen.width > 500) {
        return 'tablet';
    }
    // if the screen is small and we are a touch device we are a phone
    return 'phone';
}

/*DOC
Name:
    evt.*

Description:
    This is a collection of global variables that are used for browser-type detection and for using different events for different devices.
    The reason for this is because even though the 'mousedown' event works on a phone it is substantially slower than if you had used 'touchstart',
    But if you used 'touchstart' it wouldn't work on the computer so we wrap both under the name evt.mousedown and only give mobile browsers
    'touchstart' and desktop browsers 'mousedown' so that you dont have to differentiate.
    
List of variables:
    evt.touchDevice  equals true|false depending on whether or not we are on a touch-enabled devide
    evt.deviceType   equals 'desktop'|'tablet'|'phone' depending on what type of device you are on
    
    evt.mousedown    if we are on a touch device: 'touchstart'  else  'mousedown'
    evt.mouseover    if we are on a touch device: 'touchenter'  else  'mouseover'
    evt.mousemove    if we are on a touch device: 'touchmove'   else  'mousemove'
    evt.mouseout     if we are on a touch device: 'touchleave'  else  'mouseout'
    evt.mouseup      if we are on a touch device: 'touchend'    else  'mouseup'
    evt.click        if we are on a touch device: 'touchend'    else  'click'

*/

// this is for detecting whether or not we are in an touch device
evt.touchDevice = touchDeviceTest();

// set global variable for display type
evt.deviceType = getDeviceType();

evt.mousedown = evt.touchDevice ? 'touchstart': 'mousedown';
evt.mouseover = evt.touchDevice ? 'touchenter': 'mouseover';
evt.mousemove = evt.touchDevice ? 'touchmove' : 'mousemove';
evt.mouseout  = evt.touchDevice ? 'touchleave': 'mouseout';
evt.mouseup   = evt.touchDevice ? 'touchend'  : 'mouseup';
evt.click     = 'click';

// #############################################################
// #################### DEFINE GS NAMESPACE ####################
// #############################################################

if (window.GS === undefined) {
    window.GS = {};
    
    GS.version = function () {
        'use strict';
        return '1.1.1';
    };
    
    window.addEventListener('design-register-element', function () {
        'use strict';
        
        registerDesignSnippet('GS.version', 'GS.version', 'GS.version();');
    });
}

// ##############################################################
// ################## DEFINE support NAMESPACE ##################
// ##############################################################

if (window.shimmed === undefined) {
    window.shimmed = {};
}

// ##############################################################
// ############### DEFINE functionality NAMESPACE ###############
// ##############################################################

if (window.functionality === undefined) {
    window.functionality = {"errors": {}};
}

// ##############################################################
// ####################### NO CONSOLE FIX #######################
// ##############################################################

// in IE8 when the dev tools are not open console.log is not defined so if there was a console.log() the page would error
//      this defines the console object if it is empty so that if there is a console.log() it will not error in IE8
if (typeof console === 'undefined' || !console.log) {
    window.console = {
        log:   function () { 'use strict'; },
        info:  function () { 'use strict'; },
        debug: function () { 'use strict'; },
        warn:  function () { 'use strict'; },
        trace: function () { 'use strict'; },
        error: function () { 'use strict'; }
    };
}


// ##############################################################
// ######## PREVENT WINDOW OVERSCROLLING ON TOUCH DEVICE ########
// ##############################################################
/*
if (evt.touchDevice) {
    (function () {
        var startTime, startTouchTop, endTime, endTouchTop, lastTouchTop, currentTouchTop,
            bolCurrentlyMonitoring = false, bolTouchScrollPrevented = false, currentScrollingElement, scrollingLooper;
        
        window.ontouchstart = function(event){
            lastTouchTop = GS.mousePosition(event).top;
        };
        
        //window.addEventListener('scroll', function (event) {
        //    console.log(event);
        //}, true);
        
        window.ontouchmove = function (event) {
            var currentTouchTop = GS.mousePosition(event).top, currentElement = GS.scrollParent(event.target), bolFoundScrollable = Boolean(currentElement);
            
            //console.log(currentElement,
            //            event.target,
            //            bolFoundScrollable,
            //            currentElement.scrollTop,
            //            currentElement.clientHeight,
            //            currentElement.scrollHeight,
            //            currentTouchTop,
            //            lastTouchTop);
            //console.log(currentElement.scrollTop <= 0,
            //            currentTouchTop > lastTouchTop,
            //            currentElement.scrollTop + currentElement.clientHeight >= currentElement.scrollHeight,
            //            currentTouchTop < lastTouchTop);
            
            if (bolFoundScrollable === false ||
                (currentElement.scrollTop <= 0 && currentTouchTop > lastTouchTop) ||
                (currentElement.scrollTop + currentElement.clientHeight >= currentElement.scrollHeight && currentTouchTop < lastTouchTop)) {
                
                //console.log('prevent default');
                
                bolTouchScrollPrevented = true;
                event.preventDefault();
                //event.stopPropagation();
                
            } else if (bolFoundScrollable === true && bolTouchScrollPrevented === true) {
                currentElement.scrollTop += (lastTouchTop - currentTouchTop);
            }
            
            currentScrollingElement = currentElement;
            lastTouchTop = currentTouchTop;
        };
        
        window.ontouchend = function () {
            bolTouchScrollPrevented = false;
        };
    })();
}*/


// ##############################################################
// ################### DATABASE NORMALIZATION ###################
// ##############################################################

GS.database = {"engine": "", "type": {}};
GS.database.engine = "postgres";


// if db is SQL Server: utf16 else utf8
(function () {
    "use strict";
    
    // get a cookie from the browser
    function getCookie(c_name) {
        var c_value = document.cookie, c_end,
            c_start = c_value.indexOf(" " + c_name + "=");

        if (c_start === -1) {
            c_start = c_value.indexOf(c_name + "=");
        }
        if (c_start === -1) {
            c_value = null;
        } else {
            c_start = c_value.indexOf("=", c_start) + 1;
            c_end = c_value.indexOf(";", c_start);
            if (c_end === -1) {
                c_end = c_value.length;
            }
            c_value = decodeURIComponent(c_value.substring(c_start, c_end));
        }
        return c_value;
    };

    if ((getCookie('DB') || 'PG').toUpperCase() === 'PG') {
        GS.database.engine = 'postgres';
    } else { //ss
        GS.database.engine = 'mssqlserver'
    }
    
    if (GS.database.engine === "postgres") {
        GS.database.type.text = "text";
        GS.database.type.timestamp = "timestamptz";
        
    } else if (GS.database.engine === "mssqlserver") {
        GS.database.type.text = "nvarchar(MAX)";
        GS.database.type.timestamp = "datetime";
    }
}());





// ##############################################################
// ########### LABEL CLICK: FOCUS USING FOR ATTRIBUTE ###########
// ##############################################################

window.addEventListener('click', function (event) {
    'use strict';
    var labelElement, targetElement;
    
    //console.log(event.target, GS.findParentTag(event.target, 'LABEL'));
    
    if (event.target.nodeName === 'LABEL') {
        labelElement = event.target;
    } else if (GS.findParentTag(event.target, 'LABEL')) {
        labelElement = GS.findParentTag(event.target, 'LABEL');
    }
    
    //console.log(labelElement, labelElement.getAttribute('for'));
    
    if (labelElement && labelElement.hasAttribute('for')) {
        targetElement = document.getElementById(labelElement.getAttribute('for'));
        
        //console.log(targetElement);
        //console.log(targetElement.focus, !targetElement.hasAttribute('disabled'));
        
        if (targetElement && targetElement.focus && !targetElement.hasAttribute('disabled')) {
            targetElement.focus();
        }
    }
});


// ##############################################################
// ########### PINK BACKGROUND WHEN NOT IN PRODUCTION ###########
// ##############################################################
/*
window.addEventListener('load', function () {
    var strPostageUserName = GS.getCookie('postage_uname'), styleElement, helperElement, helperFunction;
    
    if (strPostageUserName &&
        window.location.host.indexOf(strPostageUserName) === 0 &&
        window.location.pathname !== '/env/app/all/index.html' &&
        window.location.pathname.indexOf('/v1/dev') !== 0) {
        
        styleElement = document.createElement('style');
        styleElement.innerHTML = 'body, body gs-panel, body gs-panel gs-header, body gs-panel gs-body, ' +
                                 'body gs-page, body gs-page gs-header, body gs-page gs-body {\n' +
                                 '    background-color: #FFBBBB;\n' +
                                 '}';
        
        document.head.appendChild(styleElement);
        
        helperFunction = function () {
            if (helperElement.parentNode === document.body) {
                helperElement.innerHTML = 'Width: ' + window.innerWidth + '<br />' +
                                          'Height: ' + window.innerHeight + '<br />' +
                                          (window.innerWidth >= 768 && window.innerWidth < 992 ? 'small/sml' : '') +
                                          (window.innerWidth >= 992 && window.innerWidth < 1200 ? 'medium/med' : '') +
                                          (window.innerWidth >= 1200 ? 'large/lrg' : '');
            }
        };
        
        
        helperElement = document.createElement('div');
        helperElement.setAttribute('id', 'window-size-helper');
        
        document.body.appendChild(helperElement);
        
        helperFunction();
        
        helperElement.addEventListener('click', function () {
            document.body.removeChild(helperElement);
        });
        
        window.addEventListener('resize', function () {
            helperFunction();
        });
    }
});
*/

// #############################################################
// ######################### PAGE CURL #########################
// #############################################################
(function () {
    function aboutDialog() {
        'use strict';
        var templateElement = document.createElement('template');
        
        templateElement.innerHTML = ml(function () {/*
            <gs-page>
                <gs-header><center><h3>About Envelope</h3></center></gs-header>
                <gs-body padded>
                    <gs-grid widths="1,1" reflow-at="767px">
                        <gs-block>
                            <center><h3><a target="_blank" href="http://x-tag.github.io/">X-Tag</a></h3></center>
                        </gs-block>
                        <gs-block>
                            <center><h4>Version Unknown</h4></center>
                        </gs-block>
                        <br />
                        <gs-block>
                            <center><h3><a target="_blank" href="http://olado.github.io/doT/">doT.js</a></h3></center>
                        </gs-block>
                        <gs-block>
                            <center><h4>{{DOT}}</h4></center>
                        </gs-block>
                        <br />
                        <gs-block>
                            <center><h3><a target="_blank" href="http://ace.c9.io/">Ace Editor</a></h3></center>
                        </gs-block>
                        <gs-block>
                            <center><h4>1.2.3</h4></center>
                        </gs-block>
                        <br />
                        <gs-block>
                            <center><h3><a target="_blank" href="http://jsbeautifier.org/">JSBeautifier</a></h3></center>
                        </gs-block>
                        <gs-block>
                            <center><h4>Version Unknown</h4></center>
                        </gs-block>
                        <br />
                        <gs-block>
                            <center>
                                <h3><a target="_blank" href="https://github.com/douglascrockford/JSON-js">
                                    json_parse.js (modified)
                                </a></h3>
                            </center>
                        </gs-block>
                        <gs-block>
                            <center><h4>Version Unknown</h4></center>
                        </gs-block>
                        <br />
                        <gs-block>
                            <center>
                                <h3><a target="_blank" href="https://www.polymer-project.org/1.0/">
                                    HTML Template Polyfill (modified)
                                </a></h3>
                            </center>
                        </gs-block>
                        <gs-block>
                            <center><h4>Version Unknown</h4></center>
                        </gs-block>
                        <br />
                        <gs-block>
                            <center>
                                <h3><a target="_blank" href="https://github.com/ftlabs/fastclick">FastClick</a></h3>
                            </center>
                        </gs-block>
                        <gs-block>
                            <center><h4>Version Unknown</h4></center>
                        </gs-block>
                        <br />
                        <gs-block>
                            <center>
                                <h3><a target="_blank" href="https://code.google.com/archive/p/crypto-js/">CryptoJS (MD5 Portion)</a></h3>
                            </center>
                        </gs-block>
                        <gs-block>
                            <center><h4>3.1.2</h4></center>
                        </gs-block>
                        
                    </gs-grid>
                    
                    <div>
                        All other source code and documentation copyright Workflow Products, LLC. All Rights Reserved.
                        <br /><br />
                        The Envelope platform is available for many platforms and most embedded devices. If you'd like your application built using Envelope technology please contact us.
                        <br /><br />
                        Commercial license terms for the Envelope platform are available for a small fee. Contact us for details.
                        <br /><br />
                        <center><b>Workflow Products, L.L.C.</b></center>
                        <center>7813 Harwood Road</center>
                        <center>North Richland Hills Texas 76180</center>
                        <center>(817) 503-9545</center>
                    </div>
                    <br />
                    <center><small><i>Copyright &copy; 2016-present by Workflow Products, L.L.C. (817) 503-9545</i></small></center>
                </gs-body>
                <gs-footer>
                    <gs-button dialogclose>Done</gs-button>
                </gs-footer>
            </gs-page>
        */}).replace(/\{\{DOT\}\}/gi, doT.version);
        
        GS.openDialog(templateElement);
    }
    
    
    window.addEventListener('load', function () {
        'use strict';
        var bolOpen, intMaxHeight, curlElement, menuElement, strPostageUName, strHTML, toggleCurl;
        
        if (window.bolCurl !== false) {
            bolOpen = false;
            intMaxHeight = 0;
            curlElement = document.createElement('div');
            menuElement = document.createElement('div');
            strPostageUName = GS.getCookie('postage_uname');
            strHTML = '';
            
            curlElement.setAttribute('id', 'gs-document-curl-container');
            curlElement.innerHTML = '<div id="gs-document-curl-part-1"></div>' +
                                    '<div id="gs-document-curl-part-2"></div>' +
                                    '<div id="gs-document-curl-part-3"></div>' +
                                    '<div id="gs-document-curl-part-4"></div>';
            
            document.body.appendChild(curlElement);
            
            if (evt.deviceType === 'phone') {
                curlElement.setAttribute('style', 'font-size: 1.3em;');
            } else {
                curlElement.setAttribute('style', 'font-size: 0.7em;');
            }
            
            menuElement.setAttribute('id', 'gs-document-menu-container');
            menuElement.setAttribute('style', 'height: 0px;');
            
            // this is for envelope
            if (location.pathname.indexOf('/v1/') === 0) {
                strHTML += '<center><b><a target="_self" href="/env/app/all/index.html">Back To Main Menu</a></b></center>';
                strHTML += '<center>' +
                                '<gs-button target="_self" href="/env/auth/?action=logout" inline>Log out</gs-button><br />' +
                                '<gs-button onclick="GS.userChangePassword()" inline>Change Password</gs-button>' +
                            '</center>';
                intMaxHeight += 4.8;
                
            // and this is for the new envelope
            } else if (location.pathname.indexOf('/env/') === 0) {
                strHTML += '<center><b><a target="_self" href="/env/app/all/index.html">Back To Main Menu</a></b></center>';
                strHTML += '<center>' +
                                '<gs-button target="_self" href="/env/auth/?action=logout" inline>Log out</gs-button><br />' +
                                '<gs-button onclick="GS.userChangePassword()" inline>Change Password</gs-button>' +
                            '</center>';
                intMaxHeight += 4.8;
                
            // and this is for postage
            } else {
                strHTML += '<center>' +
                                '<gs-button target="_self" href="/postage/auth?action=logout" inline>Log out</gs-button><br />' +
                                '<gs-button onclick="GS.userChangePassword()" inline>Change Password</gs-button>' +
                            '</center>';
                intMaxHeight += 3.4;
            }
            
            strHTML += '<center><gs-button onclick="GS.showShimmed()" inline>Browser Support</gs-button></center>';
            intMaxHeight += 1.9;
            
            strHTML += '<center><gs-button onclick="window.location.reload(true);" inline>Update Software</gs-button></center>';
            intMaxHeight += 1.9;
            
            if (location.pathname.indexOf('/v1/') === 0 ||
                location.pathname.indexOf('/env/') === 0) {
                strHTML += '<center><gs-button id="gs-button-about" inline>About</gs-button></center>';
                intMaxHeight += 1.9;
            }
            
            intMaxHeight += 1;
            
            menuElement.innerHTML = '<div id="gs-document-menu-link-container" style="height: ' + intMaxHeight + 'em;">' + strHTML + '</div>';
            document.body.appendChild(menuElement);
            
            if (location.pathname.indexOf('/v1/') === 0 ||
                location.pathname.indexOf('/env/') === 0) {
                document.getElementById('gs-button-about').addEventListener('click', aboutDialog);
            }
            
            // define function for toggling the page curl
            toggleCurl = function () {
                var intFontSize = GS.pxToEm(document.body, window.innerWidth) / 4,
                    intBottomLine = window.innerHeight - (GS.emToPx(document.body, intFontSize)),
                    closedSize = (evt.deviceType === 'phone' ? '1.3em' : '0.7em'); // replace evt.touchDevice with true to test on a desktop
                
                // maximum bottom line
                if (GS.pxToEm(document.body, intBottomLine) > intMaxHeight) {
                    intBottomLine = GS.emToPx(document.body, intMaxHeight);
                }
                
                //curlElement.classList.add('animating');
                //menuElement.classList.add('animating');
                
                if (bolOpen === false) {
                    document.body.insertBefore(GS.stringToElement('<div id="gs-document-curl-modal-background"></div>'), curlElement);
                    document.getElementById('gs-document-curl-modal-background').addEventListener('click', toggleCurl);
                    
                    curlElement.style.fontSize = intFontSize + 'em';
                    curlElement.style.bottom = intBottomLine + 'px';
                    menuElement.style.height = intBottomLine + 'px';
                    
                    //GS.animateStyle(curlElement, 'font-size', closedSize, intFontSize + 'em', function () {
                    //    curlElement.classList.remove('animating');
                    //}, 185, 14);
                    //
                    //GS.animateStyle(curlElement, 'bottom', '0px', intBottomLine + 'px', function () {
                    //    curlElement.classList.remove('animating');
                    //}, 185, 14);
                    //
                    //GS.animateStyle(menuElement, 'height', '0px', intBottomLine + 'px', function () {
                    //    menuElement.classList.remove('animating');
                    //}, 185, 14);
                    
                    bolOpen = true;
                } else {
                    document.body.removeChild(document.getElementById('gs-document-curl-modal-background'));
                    
                    curlElement.style.fontSize = closedSize;
                    curlElement.style.bottom = '0px';
                    menuElement.style.height = '0px';
                    
                    //GS.animateStyle(curlElement, 'font-size', intFontSize + 'em', closedSize, function () {
                    //    curlElement.classList.remove('animating');
                    //}, 185, 14);
                    //
                    //GS.animateStyle(curlElement, 'bottom', intBottomLine + 'px', '0px', function () {
                    //    curlElement.classList.remove('animating');
                    //}, 185, 14);
                    //
                    //GS.animateStyle(menuElement, 'height', intBottomLine + 'px', '0px', function () {
                    //    menuElement.classList.remove('animating');
                    //}, 185, 14);
                    
                    bolOpen = false;
                }
            };
            
            curlElement.addEventListener('click', toggleCurl);
        }
    });
})();

// ################################################################
// ###################### FASTCLICK POLYFILL ######################
// ################################################################

// double clicks will not work while using fastclick
// click events will not have a delay while using fastclick
// we chose fastclick :)

// if you need to turn fastclick off for an element use the "needsclick" class
// if you need to turn fastclick off for an elements children (but not the element itself) use the "childrenneedsclick" class
// if you need to turn fastclick off for an elements children and the element itself use the "childrenneedsclick" class and the "needsclick" class
if ('addEventListener' in document) {
    document.addEventListener('DOMContentLoaded', function() {
        'use strict';
        FastClick.attach(document.body);
    }, false);
}



// ##################################################################
// ##################### TEMPLATE GET INERT DOM #####################
// ##################################################################
/*
HTMLTemplateElement.prototype.contentTemplate = function () {
    'use strict';
    
    if (this.content) {
        
    } else {
        
    }
};
*/

// #################################################################
// ###################### POLYFILL/SHIM CHECK ######################
// #################################################################

window.addEventListener('design-register-element', function () {
    'use strict';
    
    registerDesignSnippet('GS.showShimmed', 'GS.showShimmed', 'GS.showShimmed();');
});

window.addEventListener('load', function () {
    'use strict';
    function cleanFunctionForTest(fn) {
        fn = fn.toString().toLowerCase();   // convert function string and turn all text lowercase
        fn = fn.substring(fn.indexOf('{')); // remove everything up until the first open curly brace
        fn = fn.replace(/ /gim, '');        // remove all spaces
        
        return fn;
    }
    
    function nativeTest(fn) {
        // if there is not function: not native: return false
        if (!fn) {
            return false;
        }
        
        // clean function for native testing
        fn = cleanFunctionForTest(fn);
        
        return fn.indexOf('[nativecode]') > -1 ||                   // if '[nativecode]' is found in the cleaned text: native
               fn === cleanFunctionForTest(document.createElement); // else if the cleaned text matches a native function: native
    }
    
    shimmed.matchesSelector     = !nativeTest(Element.prototype.matchesSelector) &&
                                  !nativeTest(Element.prototype.webkitMatchesSelector) &&
                                  !nativeTest(Element.prototype.mozMatchesSelector) &&
                                  !nativeTest(Element.prototype.msMatchesSelector) &&
                                  !nativeTest(Element.prototype.MSMatchesSelector);
    
    shimmed.MutationObserver    = !nativeTest(window.MutationObserver);
    shimmed.WeakMap             = !nativeTest(window.WeakMap);
    shimmed.registerElement     = !nativeTest(document.registerElement);
    shimmed.DOMTokenList        = !nativeTest(window.DOMTokenList);
    shimmed.HTMLTemplateElement = Boolean(HTMLTemplateElement.bootstrap);
    
    // automated functionality testing
    
    functionality.matchesSelector = false;
    try {
        var bodyElement = document.body
          , matchesSelector = (Element.prototype.matchesSelector
                                || Element.prototype.webkitMatchesSelector
                                || Element.prototype.mozMatchesSelector
                                || Element.prototype.msMatchesSelector
                                || Element.prototype.MSMatchesSelector);
        
        functionality.matchesSelector = matchesSelector.apply(bodyElement, ['body']);
        
    } catch (e) {
        functionality.matchesSelector = false;
        functionality.errors.matchesSelector = e;
    }
    
    functionality.MutationObserver = false;
    try {
        var testElement = document.createElement('div'), observer;
        
        observer = new MutationObserver(function(mutations) {
            functionality.MutationObserver = (mutations.length > 0);
        });
        
        observer.observe(testElement, {'childList': true});
        testElement.appendChild(document.createElement('div'));
    } catch (e) {
        functionality.MutationObserver = false;
        functionality.errors.MutationObserver = e;
    }
    
    functionality.WeakMap = false;
    try {
        var testMap = new WeakMap(), testObject = function(){};
        
        testMap.set(testObject, 'asdfasdf');
        
        functionality.WeakMap = (testMap.get(testObject) === 'asdfasdf');
        functionality.WeakMap = (functionality.WeakMap && testMap.has(testObject) === true);
        
        testMap.delete(testObject);
        
        functionality.WeakMap = (functionality.WeakMap && testMap.has(testObject) === false);
        
    } catch (e) {
        functionality.WeakMap = false;
        functionality.errors.WeakMap = e;
    }
    
    functionality.registerElement = false;
    try {
        var prototype = Object.create(HTMLElement.prototype);
        prototype.testmethod = function () { return true; };
        document.registerElement('asdf-test', {'prototype': prototype});
        
        var testElement;
        testElement = document.createElement('asdf-test');
        
        functionality.registerElement = testElement.testmethod();
        
    } catch (e) {
        functionality.registerElement = false;
        functionality.errors.registerElement = e;
    }
    
    functionality.DOMTokenList = false;
    try {
        functionality.DOMTokenList = Boolean(document.body.classList);
    } catch (e) {
        functionality.DOMTokenList = false;
        functionality.errors.DOMTokenList = e;
    }
    
    functionality.HTMLTemplateElement = false;
    try {
        var testElement = document.createElement('template');
        
        xtag.register('asdf-test-two', {
            'lifecycle': {
                'created': function () {
                    var divElement = document.createElement('div');
                    divElement.classList.add('find-me');
                    this.appendChild(divElement);
                }
            }
        });
        
        testElement.innerHTML = '<div></div><p></p><asdf-test-two></asdf-test-two>';
        
        functionality.HTMLTemplateElement = (xtag.query(testElement, '.find-me').length === 0);
        
    } catch (e) {
        functionality.HTMLTemplateElement = false;
        functionality.errors.HTMLTemplateElement = e;
    }
    
    // function to show shim and functionality results
    GS.showShimmed = function () {
        var strHTML = '', key, templateElement;
        
        strHTML += '<br />\n' +
                   '<center>This dialog is for developers so that they can determine what technologies this browser supports and what technologies are being implemented manually.</center>\n' +
                   '<br />\n' +
                   '<hr />\n';
        
        for (key in shimmed) {
            strHTML += '<gs-grid reflow-at="450px">\n' +
                       '    <gs-block><center>' + encodeHTML(key) + '</center></gs-block>\n' +
                       '    <gs-block>\n' +
                       '        <center><b>' + (shimmed[key] ? 'SHIMMED' : 'NATIVE') + '</center></b>\n' +
                       '    </gs-block>\n' +
                       '    <gs-block>\n' +
                       '        <center>' + (functionality[key] ? '<b style="color: #3F9A3F;">FUNCTION PASS' : '<b style="color: #F00;">FUNCTION FAIL') + '</center></b>\n' +
                       '    </gs-block>\n' +
                       '</gs-grid>\n' +
                       '<hr />\n';
        }
        
        strHTML += '<br />';
        
        
        templateElement = document.createElement('template');
        
        templateElement.innerHTML = ml(function () {/*
            <gs-page>
                <gs-header><center><h3>Native Detection</h3></center></gs-header>
                <gs-body padded>
                    {{HTML}}
                </gs-body>
                <gs-footer><gs-button dialogclose>Done</gs-button></gs-footer>
            </gs-page>
        */}).replace('{{HTML}}', strHTML);
        
        GS.openDialog(templateElement);
    };
});

// ##################################################################
// ################ MULTIPLE ONBEFOREUNLOAD HANDLERS ################
// ##################################################################


window.addEventListener('design-register-element', function () {
    'use strict';
    
    registerDesignSnippet('GS.addUnloadEvent', 'GS.addUnloadEvent', 'GS.addUnloadEvent(function () {' +
                                                                    '    $0' +
                                                                    '});');
});

(function () {
    'use strict';
    var arrFunctions = [],
        unloadFunction = function () {
            var i, len, ret, current;
            
            for (i = 0, len = arrFunctions.length; i < len; i += 1) {
                current = arrFunctions[i]();
                
                if (current && !ret) {
                    ret = current;
                }
            }
            
            if (ret) {
                return ret;
            }
        };
    
    window.addEventListener('load', function () {
        if (window.onbeforeunload && window.onbeforeunload !== unloadFunction) {
            console.error('Please use the GS.addUnloadEvent function to run code onbeforeunload.');
        }
    });
    
    GS.addBeforeUnloadEvent = function (functionToCall) {
        if (typeof functionToCall !== 'function') {
            throw new TypeError('GS.addUnloadEvent takes one argument, and it must be a function.');
        }
        
        if (!window.onbeforeunload) {
            window.onbeforeunload = unloadFunction;
            
        } else if (window.onbeforeunload !== unloadFunction) {
            console.error('Please use just the GS.addBeforeUnloadEvent function to run code onbeforeunload.');
            window.onbeforeunload = unloadFunction;
        }
        
        arrFunctions.push(functionToCall);
    };
})();




