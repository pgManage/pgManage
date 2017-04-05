
window.addEventListener('design-register-element', function () {
    'use strict';
    
    registerDesignSnippet('GS.rightPad', 'GS.rightPad',
                                    'GS.rightPad(${1:stringToPad}, \'${2:stringToPadWith}\', ${0:lengthToPadTo});');
    
    registerDesignSnippet('GS.leftPad', 'GS.leftPad',
                                    'GS.leftPad(${1:stringToPad}, \'${2:stringToPadWith}\', ${0:lengthToPadTo});');
    
    registerDesignSnippet('GS.pxToEm', 'GS.pxToEm', 'GS.pxToEm(${1:elementToTestIn}, ${0:pxToConvert});');
    
    registerDesignSnippet('GS.emToPx', 'GS.emToPx', 'GS.emToPx(${1:elementToTestIn}, ${0:emToConvert});');

    registerDesignSnippet('GS.keyCode', 'GS.keyCode', 'GS.keyCode(\'${0:characterToGetTheKeyCodeOf}\');');
    
    registerDesignSnippet('GS.charFromKeyCode', 'GS.charFromKeyCode', 'GS.charFromKeyCode(\'${0:eventObject}\');');
    
    registerDesignSnippet('GS.getStyle', 'GS.getStyle', 'GS.getStyle(${1:element}, \'${0:CSSProperty}\');');
    
    registerDesignSnippet('GS.listAdd', 'GS.listAdd', 'GS.listAdd(${1:arrayToAddTo}, \'${0:valueToAddIfUnique}\');');
    
    registerDesignSnippet('GS.triggerEvent', 'GS.triggerEvent', 'GS.triggerEvent(${1:target}, \'${2:eventName}\', ${0:jsnModifiers});');
    
    registerDesignSnippet('GS.strToTitle', 'GS.strToTitle', 'GS.strToTitle(${0:valueToConvert});');
    
    registerDesignSnippet('GS.mousePosition', 'GS.mousePosition', 'GS.mousePosition(${0:event});');
    
    registerDesignSnippet('GS.GUID', 'GS.GUID', 'GS.GUID();');
    
    registerDesignSnippet('GS.safeDecodeURIComponent', 'GS.safeDecodeURIComponent', 'GS.safeDecodeURIComponent(${0:valueToDecode});');
    
    registerDesignSnippet('GS.getTextHeight', 'GS.getTextHeight', 'GS.getTextHeight(${1:elementToTestIn}, ${0:bolNormalLineHeight});');
    
    registerDesignSnippet('GS.getTextWidth', 'GS.getTextWidth', 'GS.getTextWidth(${1:elementToTestIn}, ${0:strTextToGetTheWidthOf});');
    
    registerDesignSnippet('GS.scrollParent', 'GS.scrollParent', 'GS.scrollParent(${0:elementToStartFrom});');
    
    registerDesignSnippet('GS.scrollIntoView', 'GS.scrollIntoView', 'GS.scrollIntoView(${0:elementToScrollIntoView});');
    
    registerDesignSnippet('GS.envGetCell', 'GS.envGetCell', 'GS.envGetCell(${1:envelopeData}, ${2:recordNumber}, \'${0:columnName}\');');
    
    registerDesignSnippet('GS.trim', 'GS.trim', 'GS.trim(${1:stringToBeTrimmed}, \'${0:stringToTrimOff}\');');
    
    registerDesignSnippet('GS.setCookie', 'GS.setCookie', 'GS.setCookie(\'${1:cookieName}\', ${2:newValue}, ${0:daysUntilExpire});');

    registerDesignSnippet('GS.getCookie', 'GS.getCookie', 'GS.getCookie(\'${1:cookieName}\');');

    registerDesignSnippet('GS.pushState', 'GS.pushState', 'GS.pushState(${1:stateObj}, ${2:title}, ${0:newURL});');

    registerDesignSnippet('GS.replaceState', 'GS.replaceState', 'GS.replaceState(${1:stateObj}, ${2:title}, ${0:newURL});');

    registerDesignSnippet('GS.searchToWhere', 'GS.searchToWhere', 'GS.searchToWhere(\'${1:columns}\', ${0:searchClause});');

    registerDesignSnippet('GS.iconList', 'GS.iconList', 'GS.iconList();');

    registerDesignSnippet('GS.lorem', 'GS.lorem', 'GS.lorem();');

    registerDesignSnippet('GS.numberSuffix', 'GS.numberSuffix', 'GS.numberSuffix(${1:intNumber});');

    registerDesignSnippet('GS.hitLink', 'GS.hitLink', 'GS.hitLink(${1:strLink});');
});


// sometimes, we need to hit a link without paying attention
//      to the response and without opening a new tab. for
//      example, mailto: and tel: links
GS.hitLink = function (strLink) {
    "use strict";
    var iframeElement;

    iframeElement = document.createElement('iframe');
    iframeElement.setAttribute('hidden', '');
    iframeElement.addEventListener('load', function () {
        if (iframeElement.parentNode === document.body) {
            document.body.removeChild(iframeElement);
        }
    });

    iframeElement.setAttribute("src", strLink);
    document.body.appendChild(iframeElement);
};


GS.numberSuffix = function(intNumber) {
    'use strict';
    var strNumber = String(intNumber),
        jsnSuffixes = {
            '0': 'th', '1': 'st',
            '2': 'nd', '3': 'rd',
            '4': 'th', '5': 'th',
            '6': 'th', '7': 'th',
            '8': 'th', '9': 'th'
        };
                
    return strNumber + jsnSuffixes[strNumber[strNumber.length - 1]];
}

// ###########################################################
// #################### PADDING FUNCTIONS ####################
// ###########################################################

// pad a string with another string on the right side of the string
//      repeating until the pad_str until the str length is >= the padToLength

//  PARAM         "str": string to pad
//  PARAM   "padString": string to pad with
//  PARAM "padToLength": number of characters to pad for
GS.rightPad = function (str, padString, padToLength) {
    'use strict';
    str = String(str);
    
    while (str.length < padToLength) {
        str += padString;
    }
   
    return str;
};


// pad a string with another string on the left side of the string
//      repeating until the padString until the str length is >= the padToLength

//  PARAM         "str": string to pad
//  PARAM   "padString": string to pad with
//  PARAM "padToLength": number of characters to pad for
GS.leftPad = function (str, padString, padToLength) {
    'use strict';
    str = String(str);
    
    while (str.length < padToLength) {
        str = padString + str;
    }
   
    return str;
};



// ################################################################
// ################ EM AND PX CONVERSION FUNCTIONS ################
// ################################################################

// convert pixels to ems
GS.pxToEm = function (elementScope, fromPX) {
    'use strict';
	var intPX = parseFloat(fromPX),
	    heightTestElement = document.createElement('div'),
	    intElementHeight;
    
    elementScope = elementScope || document.body;
    
    heightTestElement.style.fontSize = '1em';
    heightTestElement.style.margin = '0';
    heightTestElement.style.padding = '0';
    heightTestElement.style.lineHeight = '1';
    heightTestElement.style.border = '0';
    
    heightTestElement.innerHTML = 'a';
    
    elementScope.appendChild(heightTestElement);
    intElementHeight = heightTestElement.offsetHeight;
    elementScope.removeChild(heightTestElement);
    
	return parseFloat((intPX / intElementHeight).toFixed(8), 10);
};

// convert ems to pixels
GS.emToPx = function (elementScope, fromEM) {
    'use strict';
	var intEM = parseFloat(fromEM),
	    heightTestElement = document.createElement('div'),
	    intElementHeight;
    
    elementScope = elementScope || document.body;
    
    heightTestElement.style.fontSize = '1em';
    heightTestElement.style.margin = '0';
    heightTestElement.style.padding = '0';
    heightTestElement.style.lineHeight = '1';
    heightTestElement.style.border = '0';
    
    heightTestElement.innerHTML = 'a';
    
    elementScope.appendChild(heightTestElement);
    intElementHeight = heightTestElement.offsetHeight;
    elementScope.removeChild(heightTestElement);
    
	return Math.round(intEM * intElementHeight); // not sure if we want to round here but the old function did
	                                             // so I will leave it here until there is a problem -michael
};



// ################################################################
// #################### MISC UTILITY FUNCTIONS ####################
// ################################################################

GS.charFromKeyCode = function (event) {
    // (this function contains a (modified) substantial portion of code from another source
    //    here is the copyright for sake of legality)
    
    // name: jQuery getChar
    // repository: https://github.com/bpeacock/key-to-charCode
    // @author Brian Peacock
    // @version 0.3
    // Copyright 2013, Brian Peacock
    // Licensed under the MIT license.
    
    'use strict';
    
    var code = event.which;
    
    //Ignore Shift Key events & arrows
    var ignoredCodes = {
        16: true,
        37: true,
        38: true,
        39: true,
        40: true,
        20: true,
        17: true,
        18: true,
        91: true
    };
    
    if (ignoredCodes[code] === true) {
        return false;
    }
    
    // These are special cases that don't fit the ASCII mapping
    var exceptions = {
        186: 59, // ;
        187: 61, // =
        188: 44, // ,
        189: 45, // -
        190: 46, // .
        191: 47, // /
        192: 96, // `
        219: 91, // [
        220: 92, // \
        221: 93, // ]
        222: 39, // '
        //numeric keypad
        96: '0'.charCodeAt(0),
        97: '1'.charCodeAt(0),
        98: '2'.charCodeAt(0),
        99: '3'.charCodeAt(0),
        100: '4'.charCodeAt(0),
        101: '5'.charCodeAt(0),
        102: '6'.charCodeAt(0),
        103: '7'.charCodeAt(0),
        104: '8'.charCodeAt(0),
        105: '9'.charCodeAt(0)
    };

    if (exceptions[code] !== undefined) {
        code = exceptions[code];
    }
    
    var ch = String.fromCharCode(code);
    
    // Handle Shift
    if (event.shiftKey) {
        var special = {
            1: '!',
            2: '@',
            3: '#',
            4: '$',
            5: '%',
            6: '^',
            7: '&',
            8: '*',
            9: '(',
            0: ')',
            ',': '<',
            '.': '>',
            '/': '?',
            ';': ':',
            "'": '"',
            '[': '{',
            ']': '}',
            '\\': '|',
            '`': '~',
            '-': '_',
            '=': '+'
        };

        if (special[ch] !== undefined) {
            ch = special[ch];
        }
    } else {
        ch = ch.toLowerCase();
    }
    
    return ch;
};

// keyCode string to number
GS.keyCode = function (inChar) {
    "use strict";
	/*
	Key 	Code
backspace 	8
tab 	9
enter 	13
shift 	16
ctrl 	17
alt 	18
pause/break 	19
caps lock 	20
escape 	27
(space) 	32
page up 	33
page down 	34
end 	35
home 	36
left arrow 	37
up arrow 	38
right arrow 	39
down arrow 	40
insert 	45
delete 	46
0 	48
1 	49
2 	50
3 	51
4 	52
5 	53
6 	54
7 	55
8 	56
9 	57
a 	65
b 	66
c 	67
d 	68

Key 	Code
e 	69
f 	70
g 	71
h 	72
i 	73
j 	74
k 	75
l 	76
m 	77
n 	78
o 	79
p 	80
q 	81
r 	82
s 	83
t 	84
u 	85
v 	86
w 	87
x 	88
y 	89
z 	90
left window key 	91
right window key 	92
select key 	93
numpad 0 	96
numpad 1 	97
numpad 2 	98
numpad 3 	99
numpad 4 	100
numpad 5 	101
numpad 6 	102
numpad 7 	103
*/
    inChar = inChar.toLowerCase();
	return '\b'          == inChar ? '8' :
	       'backspace'   == inChar ? '8' :
	       '\t'          == inChar ? '9' :
	       'tab'         == inChar ? '9' :
	       '\r'          == inChar ? '13' :
	       '\n'          == inChar ? '13' :
	       'enter'       == inChar ? '13' :
	       'return'      == inChar ? '13' :
	       'newline'     == inChar ? '13' :
	       'shift'       == inChar ? '16' :
	       'ctrl'        == inChar ? '17' :
	       'alt'         == inChar ? '18' :
	       'pause/break' == inChar ? '19' :
	       'caps lock'   == inChar ? '20' :
	       'escape'      == inChar ? '27' :
	       'space'       == inChar ? '32' :
	       ' '           == inChar ? '32' :
	       'page up'     == inChar ? '33' :
	       'page down'   == inChar ? '34' :
	       'end'         == inChar ? '35' :
	       'home'        == inChar ? '36' :
	       'left arrow'  == inChar ? '37' :
	       'up arrow'    == inChar ? '38' :
	       'right arrow' == inChar ? '39' :
	       'down arrow'  == inChar ? '40' :
	       'insert'      == inChar ? '45' :
	       'delete'      == inChar ? '46' :
	       '0'           == inChar ? '48' :
	       '1'           == inChar ? '49' :
	       '2'           == inChar ? '50' :
	       '3'           == inChar ? '51' :
	       '4'           == inChar ? '52' :
	       '5'           == inChar ? '53' :
	       '6'           == inChar ? '54' :
	       '7'           == inChar ? '55' :
	       '8'           == inChar ? '56' :
	       '9'           == inChar ? '57' :
	       'a'           == inChar ? '65' :
	       'b'           == inChar ? '66' :
	       'c'           == inChar ? '67' :
	       'd'           == inChar ? '68' :
	       'e'           == inChar ? '69' :
	       'f'           == inChar ? '70' :
	       'g'           == inChar ? '71' :
	       'h'           == inChar ? '72' :
	       'i'           == inChar ? '73' :
	       'j'           == inChar ? '74' :
	       'k'           == inChar ? '75' :
	       'l'           == inChar ? '76' :
	       'm'           == inChar ? '77' :
	       'n'           == inChar ? '78' :
	       'o'           == inChar ? '79' :
	       'p'           == inChar ? '80' :
	       'q'           == inChar ? '81' :
	       'r'           == inChar ? '82' :
	       's'           == inChar ? '83' :
	       't'           == inChar ? '84' :
	       'u'           == inChar ? '85' :
	       'v'           == inChar ? '86' :
	       'w'           == inChar ? '87' :
	       'x'           == inChar ? '88' :
	       'y'           == inChar ? '89' :
	       'z'           == inChar ? '90' :
	       'left window key'  == inChar ? '91' :
	       'right window key' == inChar ? '92' :
	       'select key'  == inChar ? '93' :
	       'numpad 0'    == inChar ? '96' :
	       'numpad 1'    == inChar ? '97' :
	       'numpad 2'    == inChar ? '98' :
	       'numpad 3'    == inChar ? '99' :
	       'numpad 4'    == inChar ? '100' :
	       'numpad 5'    == inChar ? '101' :
	       'numpad 6'    == inChar ? '102' :
	       'numpad 7'    == inChar ? '103' :
	       'numpad 8'    == inChar ? '104' :
	       'numpad 9'    == inChar ? '105' :
	       'multiply'    == inChar ? '106' :
	       'add'         == inChar ? '107' :
	       '+'           == inChar ? '107' :
	       'subtract'    == inChar ? '109' :
	       '-'           == inChar ? '109' :
	       'decimal point' == inChar ? '110' :
	       'divide'      == inChar ? '111' :
	       'f1'          == inChar ? '112' :
	       'f2'          == inChar ? '113' :
	       'f3'          == inChar ? '114' :
	       'f4'          == inChar ? '115' :
	       'f5'          == inChar ? '116' :
	       'f6'          == inChar ? '117' :
	       'f7'          == inChar ? '118' :
	       'f8'          == inChar ? '119' :
	       'f9'          == inChar ? '120' :
	       'f10'         == inChar ? '121' :
	       'f11'         == inChar ? '122' :
	       'f12'         == inChar ? '123' :
	       'num lock'    == inChar ? '144' :
	       'scroll lock' == inChar ? '145' :
	       'semi-colon'  == inChar ? '186' :
	       ';'           == inChar ? '186' :
	       'equal sign'  == inChar ? '187' :
	       '='           == inChar ? '187' :
	       'comma'       == inChar ? '188' :
	       ','           == inChar ? '188' :
	       'dash'        == inChar ? '189' :
	       '-'           == inChar ? '189' :
	       'period'      == inChar ? '190' :
	       '.'           == inChar ? '190' :
	       'forward slash' == inChar ? '191' :
	       '/'             == inChar ? '191' :
	       'grave accent'  == inChar ? '192' :
	       'open bracket'  == inChar ? '219' :
	       '['             == inChar ? '219' :
	       'back slash'    == inChar ? '220' :
	       '\\'            == inChar ? '220' :
	       'close bracket' == inChar ? '221' :
	       ']'             == inChar ? '221' :
	       'single quote'  == inChar ? '222' :
	       '\''            == inChar ? '222' :
	       '';
	/*
Key 	Code
numpad 8 	104
numpad 9 	105
multiply 	106
add 	107
subtract 	109
decimal point 	110
divide 	111
f1 	112
f2 	113
f3 	114
f4 	115
f5 	116
f6 	117
f7 	118
f8 	119
f9 	120
f10 	121
f11 	122
f12 	123
num lock 	144
scroll lock 	145
semi-colon 	186
equal sign 	187
comma 	188
dash 	189
period 	190
forward slash 	191
grave accent 	192
open bracket 	219
back slash 	220
close braket 	221
single quote 	222
*/
};

// get computed or current style (current style if it is availible)
GS.getStyle = function (element, style) {
	if (element.currentStyle !== undefined) {
        return element.currentStyle[style];
	}
    
    return document.defaultView.getComputedStyle(element, null)[style];
};

// push to array if the value is unique
GS.listAdd = function (arrArray, newValue) {
    'use strict';
    if (arrArray.indexOf(newValue) === -1) {
        arrArray.push(newValue);
    }
};

// trigger an event on a target
GS.triggerEvent = function (target, strEventName, jsnConfig) {
    'use strict';
    var event, key;
    
    //console.trace('trigger', target);
    
    if (document.createEvent) {
        event = document.createEvent('HTMLEvents');
        event.initEvent(strEventName, true, true);
    } else {
        event = document.createEventObject();
        event.eventType = strEventName;
    }
    
    event.eventName = strEventName;
    
    if (jsnConfig) {
        for (key in jsnConfig) {
            event[key] = jsnConfig[key];
        }
    }
    
    if (document.createEvent) {
        target.dispatchEvent(event);
    } else {
        target.fireEvent("on" + event.eventType, event);
    }
    
    return event;
};

// converts a string into a more user readable format
GS.strToTitle = function (strInput) {
    'use strict';
    var i, len, chrCurrent, chrLast = '', strRet = '';
    
    strInput = strInput || '';
    
    for (i = 0, len = strInput.length; i < len; i += 1) {
        chrCurrent = strInput.charAt(i);
        
        if (!(/[a-zA-Z]/).test(chrLast)) {
            strRet += chrCurrent.toUpperCase();
            
        } else if (chrCurrent === '_') {
            strRet += ' ';
            
        } else {
            strRet += chrCurrent;
        }
        
        chrLast = chrCurrent;
    }
    
    return strRet;
};

// normalize top, left, bottom and right on a mouse event
GS.mousePosition = function (event) {
    'use strict';
    var pageX = (evt.touchDevice ? event.touches[0].pageX: event.pageX),// get the left and top of the mouse
        pageY = (evt.touchDevice ? event.touches[0].pageY: event.pageY);//   (or the touch position if we are on a phone)
    
    return {
        'top':    pageY,
        'left':   pageX,
        'bottom': window.innerHeight - pageY,
        'right':  window.innerWidth - pageX,
        
        //'x':      pageY, // alias <== messed these up
        //'y':      pageX  // alias
        
        'x':      pageX, // alias
        'y':      pageY  // alias
    };
};

// original function found here: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
GS.GUID = function () {
    var strTime = new Date().getTime().toString();
    
    function randomString() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    
    return  randomString() + randomString() + '-' +
            randomString() + '-' +
            randomString() + '-' +
            randomString() + '-' +
            strTime.substring(strTime.length - 4) + '-' +
            randomString() + randomString() + randomString();
};

/*  ,---- no longer works
//  V
GS.getSelectedText = function () {
    if (window.getSelection) {
        return window.getSelection() + '';
    }
    
    // FireFox
    if (document.getSelection) {
        return document.getSelection() + '';
    }
    
    // IE 6/7
    if (document.selection) {
        return document.selection.createRange().text + '';
    }
    
    console.warn('GS.getSelectedText warning: no selection collection function found (could not find a way to get the selected text)');
    return '';
}*/

// decode uri component safe from "URI malformed" error
GS.safeDecodeURIComponent = function (string) {
    var strRet;
    
    try {
        strRet = decodeURIComponent(string);
        
    } catch (error) {
        if (error.toString().indexOf('URI malformed') > -1) {
            strRet = string;
        } else {
            throw error;
        }
    }
    
    return strRet;
};

//
GS.getTextHeight = function (scope, bolNormalLineHeight) {
    var divElement = document.createElement('div'), intHeight;
    
    scope = scope || document.body;
    
    divElement.style.visibility = 'invisible';
    divElement.style.fontSize   = '1em';
    divElement.style.margin     = '0';
    divElement.style.padding    = '0';
    divElement.style.lineHeight = (bolNormalLineHeight ? 'normal' : '1');
    divElement.style.border     = '0';
    divElement.textContent      = 'a';
    
    scope.appendChild(divElement);
    
    intHeight = divElement.clientHeight;
    
    scope.removeChild(divElement);
    
    return intHeight;
};


//
GS.getTextWidth = function (scope, strText, bolWhitePreserve) {
    var divElement = document.createElement('div'), intWidth;
    
    scope = scope || document.body;
    
    divElement.style.display       = 'inline-block';
    divElement.style.visibility    = 'invisible';
    divElement.style.fontSize      = '1em';
    divElement.style.margin        = '0';
    divElement.style.padding       = '0';
    divElement.style.letterSpacing = 'inherit';
    divElement.style.border        = '0';
    divElement.style.whiteSpace    = (bolWhitePreserve ? 'pre' : '');
    divElement.textContent         = strText;
    
    scope.appendChild(divElement);
    
    intWidth = divElement.clientWidth;
    
    scope.removeChild(divElement);
    
    return intWidth;
};



GS.scrollParent = function (element, strDirection) {
    "use strict";
    var strDirectionText;
    if (strDirection) {
        strDirectionText = strDirection;
    } else {
        strDirectionText = 'vertical';
    }
    var i = 0;
    var currentElement = element;
    var bolFoundScrollable = false;
    var strOverflow;

    if (currentElement) {
        while (
            currentElement &&
            currentElement.nodeName !== 'HTML' &&
            bolFoundScrollable === false &&
            i < 75
        ) {
            strOverflow = GS.getStyle(currentElement, 'overflow');
            if (
                strOverflow === 'scroll' ||
                (
                    strOverflow === 'auto' &&
                    strDirectionText === 'vertical' &&
                    currentElement.clientHeight < currentElement.scrollHeight
                ) ||
                (
                    strOverflow === 'auto' &&
                    strDirectionText === 'horizontal' &&
                    currentElement.clientWidth < currentElement.scrollWidth
                )
            ) {
                bolFoundScrollable = true;
            } else {
                currentElement = currentElement.parentNode;
                i += 1;
            }
        }

        //console.log(currentElement.nodeName);
        if (!currentElement || currentElement.nodeName === 'HTML') {
            return document.body;
        }

        return (
            bolFoundScrollable
                ? currentElement
                : undefined
        );
    }
    return undefined;
}


//
GS.scrollIntoView = function (element, strDirection) {
    var strDirectionText;
    if (strDirection) {
        strDirectionText = strDirection;
    } else {
        strDirectionText = 'vertical';
    }
    var scrollingContainer = GS.scrollParent(element, strDirectionText), arrSiblings, i, len, intScrollTop, intScrollLeft;
    if (scrollingContainer) {
        //console.log(scrollingContainer);
        if (strDirectionText === 'horizontal') {
            arrSiblings = element.parentNode.children;
            
            for (i = 0, intScrollLeft = 0, len = arrSiblings.length; i < len; i += 1) {
                if (arrSiblings[i] === element) {
                    intScrollLeft += arrSiblings[i].offsetWidth / 2;
                    
                    break;
                } else {
                    intScrollLeft += arrSiblings[i].offsetWidth;
                }
            }
            
            intScrollLeft = intScrollLeft - (scrollingContainer.offsetWidth / 2);
            scrollingContainer.scrollLeft = intScrollLeft;
        } else {
            arrSiblings = element.parentNode.children;
            
            for (i = 0, intScrollTop = 0, len = arrSiblings.length; i < len; i += 1) {
                if (arrSiblings[i] === element) {
                    intScrollTop += arrSiblings[i].offsetHeight / 2;
                    
                    break;
                } else {
                    intScrollTop += arrSiblings[i].offsetHeight;
                }
            }
            
            intScrollTop = intScrollTop - (scrollingContainer.offsetHeight / 2);
            scrollingContainer.scrollTop = intScrollTop;
        }
    }
};

// return value from: envelope data, record number and column name
GS.envGetCell = function (data, record_number, column_name) {
    'use strict';
    var index;
    
    if (data.stat) {
        data = data.dat;
    }
    
    index = data.arr_column.indexOf(column_name);
    
    if (index === -1) {
        console.error(column_name, data);
        throw 'Error in GS.envGetCell: column not found';
    }
    
    return data.dat[record_number][index];
};

GS.trim = function(string, strStringToTrim) {
    "use strict";
    var safeRegexString = strStringToTrim.replace(/([.?*+^$[\]\\(){}|-])/g,'\\$1'),
        trimRegex = new RegExp('^' + safeRegexString + '+|' + safeRegexString + '+$', 'g');
    
    return string.replace(trimRegex, '');
};

// set a cookie in the browser
GS.setCookie = function (c_name, value, exdays) {
    'use strict';
    var exDayNum;
    if (!exdays) {
        exDayNum = 30;
    } else {
        exDayNum = exdays;
    }
    
    var hostname = location.hostname;
    var exdate = new Date(), c_value;
    hostname = hostname.substring(hostname.indexOf('.'));
    exdate.setDate(exdate.getDate() + exDayNum);
    
    c_value = encodeURIComponent(value) + ((exDayNum === null || exDayNum === undefined) ? '' : '; expires=' + exdate.toUTCString()) + '; domain=' + hostname + '; path=/';
    
    document.cookie = c_name + '=' + c_value;
};

// get a cookie from the browser
GS.getCookie = function (c_name) {
    'use strict';
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

GS.pushState = function (stateObj, title, url) {
    history.pushState(stateObj, title, url);
    GS.triggerEvent(window, 'pushstate');
};

GS.replaceState = function (stateObj, title, url) {
    history.replaceState(stateObj, title, url);
    GS.triggerEvent(window, 'replacestate');
};

GS.searchToWhere = function (columns, searchClause) {
    //console.log(searchClause);
    var arrToken, arrNoQuotes = [], strNoQuotes = '', arrColumn, arrRequired = [], strRequired = '', arrWhere = [], strWhere = '', strRet = '', token, numTokens, col, numCols, i, len, strSearch;
    
    if (!searchClause) {
        return '1=1';
    }
    
    arrColumn = columns.split(',');
    
    // First get all quoted tokens, leave everything else
    arrToken = searchClause.match(/[\+|\-]?"[^"]*?"/g);
    
    if (arrToken) {
        for (token = 0, numTokens = arrToken.length; token < numTokens; token += 1) {
            arrToken[token] = GS.trim(arrToken[token], '+');
            for (col = 0, numCols = arrColumn.length; col < numCols; col += 1) {
                if (arrToken[token][0] === '-') {
                    arrToken[token] = GS.trim(arrToken[token], '-');
                    arrRequired[token] =
                        (arrRequired[token] ? arrRequired[token] + ' AND ' : '') +
                        'CASE WHEN ' + arrColumn[col] +
                        ' IS NOT NULL THEN ' + arrColumn[col] +
                        ' NOT ILIKE \'%' + GS.trim(arrToken[token], '"') +
                        '%\' ELSE TRUE END';
                    arrToken[token] = '-' + arrToken[token];
                } else {
                    arrRequired[token] = 
                        (arrRequired[token] ? arrRequired[token] + ' OR ' : '') +
                        (arrColumn[col] + ' ILIKE \'%' + GS.trim(arrToken[token], '"') + '%\'');
                }
            }
        }
        
        for (i = 0, len = arrRequired.length; i < len; i += 1) {
            strRequired = (strRequired ? strRequired + ' AND ' : '') + '(' + arrRequired[i] + ')';
        }
        //console.log('strRequired:', strRequired);
    }
    
    // Get non-quoted tokens and remove extra space
    /*
    //NOT CROSS BROWSER
    arrNoQuotes = strSearch.split(/([\+|\-]?"[^"]*?")/);
    strNoQuotes = arrNoQuotes.join(' ');
    arrNoQuotes = strNoQuotes.split(/[ ]+/);
    */
    strSearch = searchClause.trim();
    strSearch = strSearch.replace('-"', '"');
    strSearch = strSearch.replace('+"', '"');
    strSearch = strSearch.replace(/"[^"]*"/, '""');
    arrNoQuotes = strSearch.split('""');
    //console.log("arrNoQuotes: ", arrNoQuotes);
    strNoQuotes = arrNoQuotes.join(' ');
    //console.log("strNoQuotes: >" + strNoQuotes + "<");
    strNoQuotes = strNoQuotes.replace('  ', ' ');
    strNoQuotes = strNoQuotes.replace('  ', ' ');
    arrNoQuotes = strNoQuotes.split(' ');
    //console.log("arrNoQuotes: ", arrNoQuotes);
    /*
    //DIDN'T WORK
    strSearch = searchClause.trim();
    strSearch = strSearch.replace('-"', '"');
    strSearch = strSearch.replace('+"', '"');
    arrNoQuotes = strSearch.split('"');
    strSearch = '';
    if (searchClause.trim()[0] === '"') {
        for (i = 1, len = arrNoQuotes.length; i < len; i += 2) {
            strSearch = strSearch + (strSearch === '' ? '' : ' ') + arrNoQuotes[i].trim();
        }
    } else {
        for (i = 0, len = arrNoQuotes.length; i < len; i += 2) {
            strSearch = strSearch + (strSearch === '' ? '' : ' ') + arrNoQuotes[i].trim();
        }
    }
    //console.log(strSearch);
    strSearch = strSearch.replace('  ', ' ');
    strSearch = strSearch.replace('  ', ' ');
    arrNoQuotes = strSearch.split(' ');
    //console.log(arrNoQuotes);
    */
    // Put items into arrRequired or arrWhere
    arrRequired = [''];
    if (arrNoQuotes.length > 0) {
        //console.log('1');
        for (token = 0, numTokens = arrNoQuotes.length; token < numTokens; token += 1) {
            //console.log('2');
            for (col = 0, numCols = arrColumn.length; col < numCols; col += 1) {
                //console.log('3 arrNoQuotes[' + token + ']: ' + arrNoQuotes[token]);
                if (arrNoQuotes[token].length > 0) {
                    //console.log('4');
                    if (arrNoQuotes[token][0] === '-') {
                        arrRequired[token] = 
                            (arrRequired[token] ? arrRequired[token] + ' AND ' : '') +
                            ' CASE WHEN ' + arrColumn[col] +
                            ' IS NOT NULL THEN ' + arrColumn[col] +
                            ' NOT ILIKE $$%' + GS.trim(GS.trim(arrNoQuotes[token], '-'), ' ') +
                            '%$$ ELSE TRUE END ';
                    } else if (arrNoQuotes[token][0] === '+') {
                        arrRequired[token] = 
                            (arrRequired[token] ? arrRequired[token] + ' OR ' : '') +
                            arrColumn[col] + ' ILIKE $$%' +
                            GS.trim(GS.trim(arrNoQuotes[token], '+'), ' ') + '%$$ ';
                    } else {
                        arrWhere[token] = 
                            (arrWhere[token] ? arrWhere[token] + ' OR ' : '') +
                            arrColumn[col] + ' ILIKE $$%' + GS.trim(arrNoQuotes[token], ' ') + '%$$ ';
                    }
                }
            }
        }
    }
    
    if (arrRequired.length > 0) {
        for (i = 0, len = arrRequired.length; i < len; i += 1) {
            if (arrRequired[i]) {
                strRequired = (strRequired ? strRequired + ' AND ' : '') + '(' + arrRequired[i] + ')';
            }
        }
    }
    //console.log('strRequired: ', strRequired);
    
    if (arrWhere.length > 0) {
        for (i = 0, len = arrWhere.length; i < len; i += 1) {
            if (arrWhere[i]) {
                strWhere = (strWhere ? strWhere + ' AND ' : '') + '(' + arrWhere[i] + ')';
            }
        }
    }
    //console.log('strWhere: ', strWhere);
    
    strRet = 
        (
            strWhere && strRequired ? '(' + strWhere + ') AND (' + strRequired + ')' :
            strWhere ? strWhere :
            strRequired
        );
    
    //console.log('strRet: ' + strRet);
    
    return strRet;
};

GS.iconList = function () {
    return [{"name":"500px","code":"f26e"},{"name":"adjust","code":"f042"},{"name":"adn","code":"f170"},{"name":"align-center","code":"f037"},{"name":"align-justify","code":"f039"},{"name":"align-left","code":"f036"},{"name":"align-right","code":"f038"},{"name":"amazon","code":"f270"},{"name":"ambulance","code":"f0f9"},{"name":"anchor","code":"f13d"},{"name":"android","code":"f17b"},{"name":"angellist","code":"f209"},{"name":"angle-double-down","code":"f103"},{"name":"angle-double-left","code":"f100"},{"name":"angle-double-right","code":"f101"},{"name":"angle-double-up","code":"f102"},{"name":"angle-down","code":"f107"},{"name":"angle-left","code":"f104"},{"name":"angle-right","code":"f105"},{"name":"angle-up","code":"f106"},{"name":"apple","code":"f179"},{"name":"archive","code":"f187"},{"name":"area-chart","code":"f1fe"},{"name":"arrow-circle-down","code":"f0ab"},{"name":"arrow-circle-left","code":"f0a8"},{"name":"arrow-circle-o-down","code":"f01a"},{"name":"arrow-circle-o-left","code":"f190"},{"name":"arrow-circle-o-right","code":"f18e"},{"name":"arrow-circle-o-up","code":"f01b"},{"name":"arrow-circle-right","code":"f0a9"},{"name":"arrow-circle-up","code":"f0aa"},{"name":"arrow-down","code":"f063"},{"name":"arrow-left","code":"f060"},{"name":"arrow-right","code":"f061"},{"name":"arrow-up","code":"f062"},{"name":"arrows","code":"f047"},{"name":"arrows-alt","code":"f0b2"},{"name":"arrows-h","code":"f07e"},{"name":"arrows-v","code":"f07d"},{"name":"asterisk","code":"f069"},{"name":"at","code":"f1fa"},{"name":"automobile","code":"f1b9"},{"name":"backward","code":"f04a"},{"name":"balance-scale","code":"f24e"},{"name":"ban","code":"f05e"},{"name":"bank","code":"f19c"},{"name":"bar-chart","code":"f080"},{"name":"bar-chart-o","code":"f080"},{"name":"barcode","code":"f02a"},{"name":"bars","code":"f0c9"},{"name":"battery-0","code":"f244"},{"name":"battery-1","code":"f243"},{"name":"battery-2","code":"f242"},{"name":"battery-3","code":"f241"},{"name":"battery-4","code":"f240"},{"name":"battery-empty","code":"f244"},{"name":"battery-full","code":"f240"},{"name":"battery-half","code":"f242"},{"name":"battery-quarter","code":"f243"},{"name":"battery-three-quarters","code":"f241"},{"name":"bed","code":"f236"},{"name":"beer","code":"f0fc"},{"name":"behance","code":"f1b4"},{"name":"behance-square","code":"f1b5"},{"name":"bell","code":"f0f3"},{"name":"bell-o","code":"f0a2"},{"name":"bell-slash","code":"f1f6"},{"name":"bell-slash-o","code":"f1f7"},{"name":"bicycle","code":"f206"},{"name":"binoculars","code":"f1e5"},{"name":"birthday-cake","code":"f1fd"},{"name":"bitbucket","code":"f171"},{"name":"bitbucket-square","code":"f172"},{"name":"bitcoin","code":"f15a"},{"name":"black-tie","code":"f27e"},{"name":"bluetooth","code":"f293"},{"name":"bluetooth-b","code":"f294"},{"name":"bold","code":"f032"},{"name":"bolt","code":"f0e7"},{"name":"bomb","code":"f1e2"},{"name":"book","code":"f02d"},{"name":"bookmark","code":"f02e"},{"name":"bookmark-o","code":"f097"},{"name":"briefcase","code":"f0b1"},{"name":"btc","code":"f15a"},{"name":"bug","code":"f188"},{"name":"building","code":"f1ad"},{"name":"building-o","code":"f0f7"},{"name":"bullhorn","code":"f0a1"},{"name":"bullseye","code":"f140"},{"name":"bus","code":"f207"},{"name":"buysellads","code":"f20d"},{"name":"cab","code":"f1ba"},{"name":"calculator","code":"f1ec"},{"name":"calendar","code":"f073"},{"name":"calendar-check-o","code":"f274"},{"name":"calendar-minus-o","code":"f272"},{"name":"calendar-o","code":"f133"},{"name":"calendar-plus-o","code":"f271"},{"name":"calendar-times-o","code":"f273"},{"name":"camera","code":"f030"},{"name":"camera-retro","code":"f083"},{"name":"car","code":"f1b9"},{"name":"caret-down","code":"f0d7"},{"name":"caret-left","code":"f0d9"},{"name":"caret-right","code":"f0da"},{"name":"caret-square-o-down","code":"f150"},{"name":"caret-square-o-left","code":"f191"},{"name":"caret-square-o-right","code":"f152"},{"name":"caret-square-o-up","code":"f151"},{"name":"caret-up","code":"f0d8"},{"name":"cart-arrow-down","code":"f218"},{"name":"cart-plus","code":"f217"},{"name":"cc","code":"f20a"},{"name":"cc-amex","code":"f1f3"},{"name":"cc-diners-club","code":"f24c"},{"name":"cc-discover","code":"f1f2"},{"name":"cc-jcb","code":"f24b"},{"name":"cc-mastercard","code":"f1f1"},{"name":"cc-paypal","code":"f1f4"},{"name":"cc-stripe","code":"f1f5"},{"name":"cc-visa","code":"f1f0"},{"name":"certificate","code":"f0a3"},{"name":"chain","code":"f0c1"},{"name":"chain-broken","code":"f127"},{"name":"check","code":"f00c"},{"name":"check-circle","code":"f058"},{"name":"check-circle-o","code":"f05d"},{"name":"check-square","code":"f14a"},{"name":"check-square-o","code":"f046"},{"name":"chevron-circle-down","code":"f13a"},{"name":"chevron-circle-left","code":"f137"},{"name":"chevron-circle-right","code":"f138"},{"name":"chevron-circle-up","code":"f139"},{"name":"chevron-down","code":"f078"},{"name":"chevron-left","code":"f053"},{"name":"chevron-right","code":"f054"},{"name":"chevron-up","code":"f077"},{"name":"child","code":"f1ae"},{"name":"chrome","code":"f268"},{"name":"circle","code":"f111"},{"name":"circle-o","code":"f10c"},{"name":"circle-o-notch","code":"f1ce"},{"name":"circle-thin","code":"f1db"},{"name":"clipboard","code":"f0ea"},{"name":"clock-o","code":"f017"},{"name":"clone","code":"f24d"},{"name":"close","code":"f00d"},{"name":"cloud","code":"f0c2"},{"name":"cloud-download","code":"f0ed"},{"name":"cloud-upload","code":"f0ee"},{"name":"cny","code":"f157"},{"name":"code","code":"f121"},{"name":"code-fork","code":"f126"},{"name":"codepen","code":"f1cb"},{"name":"codiepie","code":"f284"},{"name":"coffee","code":"f0f4"},{"name":"cog","code":"f013"},{"name":"cogs","code":"f085"},{"name":"columns","code":"f0db"},{"name":"comment","code":"f075"},{"name":"comment-o","code":"f0e5"},{"name":"commenting","code":"f27a"},{"name":"commenting-o","code":"f27b"},{"name":"comments","code":"f086"},{"name":"comments-o","code":"f0e6"},{"name":"compass","code":"f14e"},{"name":"compress","code":"f066"},{"name":"connectdevelop","code":"f20e"},{"name":"contao","code":"f26d"},{"name":"copy","code":"f0c5"},{"name":"copyright","code":"f1f9"},{"name":"creative-commons","code":"f25e"},{"name":"credit-card","code":"f09d"},{"name":"credit-card-alt","code":"f283"},{"name":"crop","code":"f125"},{"name":"crosshairs","code":"f05b"},{"name":"css3","code":"f13c"},{"name":"cube","code":"f1b2"},{"name":"cubes","code":"f1b3"},{"name":"cut","code":"f0c4"},{"name":"cutlery","code":"f0f5"},{"name":"dashboard","code":"f0e4"},{"name":"dashcube","code":"f210"},{"name":"database","code":"f1c0"},{"name":"dedent","code":"f03b"},{"name":"delicious","code":"f1a5"},{"name":"desktop","code":"f108"},{"name":"deviantart","code":"f1bd"},{"name":"diamond","code":"f219"},{"name":"digg","code":"f1a6"},{"name":"dollar","code":"f155"},{"name":"dot-circle-o","code":"f192"},{"name":"download","code":"f019"},{"name":"dribbble","code":"f17d"},{"name":"dropbox","code":"f16b"},{"name":"drupal","code":"f1a9"},{"name":"edge","code":"f282"},{"name":"edit","code":"f044"},{"name":"eject","code":"f052"},{"name":"ellipsis-h","code":"f141"},{"name":"ellipsis-v","code":"f142"},{"name":"empire","code":"f1d1"},{"name":"envelope","code":"f0e0"},{"name":"envelope-o","code":"f003"},{"name":"envelope-square","code":"f199"},{"name":"eraser","code":"f12d"},{"name":"eur","code":"f153"},{"name":"euro","code":"f153"},{"name":"exchange","code":"f0ec"},{"name":"exclamation","code":"f12a"},{"name":"exclamation-circle","code":"f06a"},{"name":"exclamation-triangle","code":"f071"},{"name":"expand","code":"f065"},{"name":"expeditedssl","code":"f23e"},{"name":"external-link","code":"f08e"},{"name":"external-link-square","code":"f14c"},{"name":"eye","code":"f06e"},{"name":"eye-slash","code":"f070"},{"name":"eyedropper","code":"f1fb"},{"name":"facebook","code":"f09a"},{"name":"facebook-f","code":"f09a"},{"name":"facebook-official","code":"f230"},{"name":"facebook-square","code":"f082"},{"name":"fast-backward","code":"f049"},{"name":"fast-forward","code":"f050"},{"name":"fax","code":"f1ac"},{"name":"feed","code":"f09e"},{"name":"female","code":"f182"},{"name":"fighter-jet","code":"f0fb"},{"name":"file","code":"f15b"},{"name":"file-archive-o","code":"f1c6"},{"name":"file-audio-o","code":"f1c7"},{"name":"file-code-o","code":"f1c9"},{"name":"file-excel-o","code":"f1c3"},{"name":"file-image-o","code":"f1c5"},{"name":"file-movie-o","code":"f1c8"},{"name":"file-o","code":"f016"},{"name":"file-pdf-o","code":"f1c1"},{"name":"file-photo-o","code":"f1c5"},{"name":"file-picture-o","code":"f1c5"},{"name":"file-powerpoint-o","code":"f1c4"},{"name":"file-sound-o","code":"f1c7"},{"name":"file-text","code":"f15c"},{"name":"file-text-o","code":"f0f6"},{"name":"file-video-o","code":"f1c8"},{"name":"file-word-o","code":"f1c2"},{"name":"file-zip-o","code":"f1c6"},{"name":"files-o","code":"f0c5"},{"name":"film","code":"f008"},{"name":"filter","code":"f0b0"},{"name":"fire","code":"f06d"},{"name":"fire-extinguisher","code":"f134"},{"name":"firefox","code":"f269"},{"name":"flag","code":"f024"},{"name":"flag-checkered","code":"f11e"},{"name":"flag-o","code":"f11d"},{"name":"flash","code":"f0e7"},{"name":"flask","code":"f0c3"},{"name":"flickr","code":"f16e"},{"name":"floppy-o","code":"f0c7"},{"name":"folder","code":"f07b"},{"name":"folder-o","code":"f114"},{"name":"folder-open","code":"f07c"},{"name":"folder-open-o","code":"f115"},{"name":"font","code":"f031"},{"name":"fonticons","code":"f280"},{"name":"fort-awesome","code":"f286"},{"name":"forumbee","code":"f211"},{"name":"forward","code":"f04e"},{"name":"foursquare","code":"f180"},{"name":"frown-o","code":"f119"},{"name":"futbol-o","code":"f1e3"},{"name":"gamepad","code":"f11b"},{"name":"gavel","code":"f0e3"},{"name":"gbp","code":"f154"},{"name":"ge","code":"f1d1"},{"name":"gear","code":"f013"},{"name":"gears","code":"f085"},{"name":"genderless","code":"f22d"},{"name":"get-pocket","code":"f265"},{"name":"gg","code":"f260"},{"name":"gg-circle","code":"f261"},{"name":"gift","code":"f06b"},{"name":"git","code":"f1d3"},{"name":"git-square","code":"f1d2"},{"name":"github","code":"f09b"},{"name":"github-alt","code":"f113"},{"name":"github-square","code":"f092"},{"name":"gittip","code":"f184"},{"name":"glass","code":"f000"},{"name":"globe","code":"f0ac"},{"name":"google","code":"f1a0"},{"name":"google-plus","code":"f0d5"},{"name":"google-plus-square","code":"f0d4"},{"name":"google-wallet","code":"f1ee"},{"name":"graduation-cap","code":"f19d"},{"name":"gratipay","code":"f184"},{"name":"group","code":"f0c0"},{"name":"h-square","code":"f0fd"},{"name":"hacker-news","code":"f1d4"},{"name":"hand-grab-o","code":"f255"},{"name":"hand-lizard-o","code":"f258"},{"name":"hand-o-down","code":"f0a7"},{"name":"hand-o-left","code":"f0a5"},{"name":"hand-o-right","code":"f0a4"},{"name":"hand-o-up","code":"f0a6"},{"name":"hand-paper-o","code":"f256"},{"name":"hand-peace-o","code":"f25b"},{"name":"hand-pointer-o","code":"f25a"},{"name":"hand-rock-o","code":"f255"},{"name":"hand-scissors-o","code":"f257"},{"name":"hand-spock-o","code":"f259"},{"name":"hand-stop-o","code":"f256"},{"name":"hashtag","code":"f292"},{"name":"hdd-o","code":"f0a0"},{"name":"header","code":"f1dc"},{"name":"headphones","code":"f025"},{"name":"heart","code":"f004"},{"name":"heart-o","code":"f08a"},{"name":"heartbeat","code":"f21e"},{"name":"history","code":"f1da"},{"name":"home","code":"f015"},{"name":"hospital-o","code":"f0f8"},{"name":"hotel","code":"f236"},{"name":"hourglass","code":"f254"},{"name":"hourglass-1","code":"f251"},{"name":"hourglass-2","code":"f252"},{"name":"hourglass-3","code":"f253"},{"name":"hourglass-end","code":"f253"},{"name":"hourglass-half","code":"f252"},{"name":"hourglass-o","code":"f250"},{"name":"hourglass-start","code":"f251"},{"name":"houzz","code":"f27c"},{"name":"html5","code":"f13b"},{"name":"i-cursor","code":"f246"},{"name":"ils","code":"f20b"},{"name":"image","code":"f03e"},{"name":"inbox","code":"f01c"},{"name":"indent","code":"f03c"},{"name":"industry","code":"f275"},{"name":"info","code":"f129"},{"name":"info-circle","code":"f05a"},{"name":"inr","code":"f156"},{"name":"instagram","code":"f16d"},{"name":"institution","code":"f19c"},{"name":"internet-explorer","code":"f26b"},{"name":"intersex","code":"f224"},{"name":"ioxhost","code":"f208"},{"name":"italic","code":"f033"},{"name":"joomla","code":"f1aa"},{"name":"jpy","code":"f157"},{"name":"jsfiddle","code":"f1cc"},{"name":"key","code":"f084"},{"name":"keyboard-o","code":"f11c"},{"name":"krw","code":"f159"},{"name":"language","code":"f1ab"},{"name":"laptop","code":"f109"},{"name":"lastfm","code":"f202"},{"name":"lastfm-square","code":"f203"},{"name":"leaf","code":"f06c"},{"name":"leanpub","code":"f212"},{"name":"legal","code":"f0e3"},{"name":"lemon-o","code":"f094"},{"name":"level-down","code":"f149"},{"name":"level-up","code":"f148"},{"name":"life-bouy","code":"f1cd"},{"name":"life-buoy","code":"f1cd"},{"name":"life-ring","code":"f1cd"},{"name":"life-saver","code":"f1cd"},{"name":"lightbulb-o","code":"f0eb"},{"name":"line-chart","code":"f201"},{"name":"link","code":"f0c1"},{"name":"linkedin","code":"f0e1"},{"name":"linkedin-square","code":"f08c"},{"name":"linux","code":"f17c"},{"name":"list","code":"f03a"},{"name":"list-alt","code":"f022"},{"name":"list-ol","code":"f0cb"},{"name":"list-ul","code":"f0ca"},{"name":"location-arrow","code":"f124"},{"name":"lock","code":"f023"},{"name":"long-arrow-down","code":"f175"},{"name":"long-arrow-left","code":"f177"},{"name":"long-arrow-right","code":"f178"},{"name":"long-arrow-up","code":"f176"},{"name":"magic","code":"f0d0"},{"name":"magnet","code":"f076"},{"name":"mail-forward","code":"f064"},{"name":"mail-reply","code":"f112"},{"name":"mail-reply-all","code":"f122"},{"name":"male","code":"f183"},{"name":"map","code":"f279"},{"name":"map-marker","code":"f041"},{"name":"map-o","code":"f278"},{"name":"map-pin","code":"f276"},{"name":"map-signs","code":"f277"},{"name":"mars","code":"f222"},{"name":"mars-double","code":"f227"},{"name":"mars-stroke","code":"f229"},{"name":"mars-stroke-h","code":"f22b"},{"name":"mars-stroke-v","code":"f22a"},{"name":"maxcdn","code":"f136"},{"name":"meanpath","code":"f20c"},{"name":"medium","code":"f23a"},{"name":"medkit","code":"f0fa"},{"name":"meh-o","code":"f11a"},{"name":"mercury","code":"f223"},{"name":"microphone","code":"f130"},{"name":"microphone-slash","code":"f131"},{"name":"minus","code":"f068"},{"name":"minus-circle","code":"f056"},{"name":"minus-square","code":"f146"},{"name":"minus-square-o","code":"f147"},{"name":"mixcloud","code":"f289"},{"name":"mobile","code":"f10b"},{"name":"mobile-phone","code":"f10b"},{"name":"modx","code":"f285"},{"name":"money","code":"f0d6"},{"name":"moon-o","code":"f186"},{"name":"mortar-board","code":"f19d"},{"name":"motorcycle","code":"f21c"},{"name":"mouse-pointer","code":"f245"},{"name":"music","code":"f001"},{"name":"navicon","code":"f0c9"},{"name":"neuter","code":"f22c"},{"name":"newspaper-o","code":"f1ea"},{"name":"object-group","code":"f247"},{"name":"object-ungroup","code":"f248"},{"name":"odnoklassniki","code":"f263"},{"name":"odnoklassniki-square","code":"f264"},{"name":"opencart","code":"f23d"},{"name":"openid","code":"f19b"},{"name":"opera","code":"f26a"},{"name":"optin-monster","code":"f23c"},{"name":"outdent","code":"f03b"},{"name":"pagelines","code":"f18c"},{"name":"paint-brush","code":"f1fc"},{"name":"paper-plane","code":"f1d8"},{"name":"paper-plane-o","code":"f1d9"},{"name":"paperclip","code":"f0c6"},{"name":"paragraph","code":"f1dd"},{"name":"paste","code":"f0ea"},{"name":"pause","code":"f04c"},{"name":"pause-circle","code":"f28b"},{"name":"pause-circle-o","code":"f28c"},{"name":"paw","code":"f1b0"},{"name":"paypal","code":"f1ed"},{"name":"pencil","code":"f040"},{"name":"pencil-square","code":"f14b"},{"name":"pencil-square-o","code":"f044"},{"name":"percent","code":"f295"},{"name":"phone","code":"f095"},{"name":"phone-square","code":"f098"},{"name":"photo","code":"f03e"},{"name":"picture-o","code":"f03e"},{"name":"pie-chart","code":"f200"},{"name":"pied-piper","code":"f1a7"},{"name":"pied-piper-alt","code":"f1a8"},{"name":"pinterest","code":"f0d2"},{"name":"pinterest-p","code":"f231"},{"name":"pinterest-square","code":"f0d3"},{"name":"plane","code":"f072"},{"name":"play","code":"f04b"},{"name":"play-circle","code":"f144"},{"name":"play-circle-o","code":"f01d"},{"name":"plug","code":"f1e6"},{"name":"plus","code":"f067"},{"name":"plus-circle","code":"f055"},{"name":"plus-square","code":"f0fe"},{"name":"plus-square-o","code":"f196"},{"name":"power-off","code":"f011"},{"name":"print","code":"f02f"},{"name":"product-hunt","code":"f288"},{"name":"puzzle-piece","code":"f12e"},{"name":"qq","code":"f1d6"},{"name":"qrcode","code":"f029"},{"name":"question","code":"f128"},{"name":"question-circle","code":"f059"},{"name":"quote-left","code":"f10d"},{"name":"quote-right","code":"f10e"},{"name":"ra","code":"f1d0"},{"name":"random","code":"f074"},{"name":"rebel","code":"f1d0"},{"name":"recycle","code":"f1b8"},{"name":"reddit","code":"f1a1"},{"name":"reddit-alien","code":"f281"},{"name":"reddit-square","code":"f1a2"},{"name":"refresh","code":"f021"},{"name":"registered","code":"f25d"},{"name":"remove","code":"f00d"},{"name":"renren","code":"f18b"},{"name":"reorder","code":"f0c9"},{"name":"repeat","code":"f01e"},{"name":"reply","code":"f112"},{"name":"reply-all","code":"f122"},{"name":"retweet","code":"f079"},{"name":"rmb","code":"f157"},{"name":"road","code":"f018"},{"name":"rocket","code":"f135"},{"name":"rotate-left","code":"f0e2"},{"name":"rotate-right","code":"f01e"},{"name":"rouble","code":"f158"},{"name":"rss","code":"f09e"},{"name":"rss-square","code":"f143"},{"name":"rub","code":"f158"},{"name":"ruble","code":"f158"},{"name":"rupee","code":"f156"},{"name":"safari","code":"f267"},{"name":"save","code":"f0c7"},{"name":"scissors","code":"f0c4"},{"name":"scribd","code":"f28a"},{"name":"search","code":"f002"},{"name":"search-minus","code":"f010"},{"name":"search-plus","code":"f00e"},{"name":"sellsy","code":"f213"},{"name":"send","code":"f1d8"},{"name":"send-o","code":"f1d9"},{"name":"server","code":"f233"},{"name":"share","code":"f064"},{"name":"share-alt","code":"f1e0"},{"name":"share-alt-square","code":"f1e1"},{"name":"share-square","code":"f14d"},{"name":"share-square-o","code":"f045"},{"name":"shekel","code":"f20b"},{"name":"sheqel","code":"f20b"},{"name":"shield","code":"f132"},{"name":"ship","code":"f21a"},{"name":"shirtsinbulk","code":"f214"},{"name":"shopping-bag","code":"f290"},{"name":"shopping-basket","code":"f291"},{"name":"shopping-cart","code":"f07a"},{"name":"sign-in","code":"f090"},{"name":"sign-out","code":"f08b"},{"name":"signal","code":"f012"},{"name":"simplybuilt","code":"f215"},{"name":"sitemap","code":"f0e8"},{"name":"skyatlas","code":"f216"},{"name":"skype","code":"f17e"},{"name":"slack","code":"f198"},{"name":"sliders","code":"f1de"},{"name":"slideshare","code":"f1e7"},{"name":"smile-o","code":"f118"},{"name":"soccer-ball-o","code":"f1e3"},{"name":"sort","code":"f0dc"},{"name":"sort-alpha-asc","code":"f15d"},{"name":"sort-alpha-desc","code":"f15e"},{"name":"sort-amount-asc","code":"f160"},{"name":"sort-amount-desc","code":"f161"},{"name":"sort-asc","code":"f0de"},{"name":"sort-desc","code":"f0dd"},{"name":"sort-down","code":"f0dd"},{"name":"sort-numeric-asc","code":"f162"},{"name":"sort-numeric-desc","code":"f163"},{"name":"sort-up","code":"f0de"},{"name":"soundcloud","code":"f1be"},{"name":"space-shuttle","code":"f197"},{"name":"spinner","code":"f110"},{"name":"spoon","code":"f1b1"},{"name":"spotify","code":"f1bc"},{"name":"square","code":"f0c8"},{"name":"square-o","code":"f096"},{"name":"stack-exchange","code":"f18d"},{"name":"stack-overflow","code":"f16c"},{"name":"star","code":"f005"},{"name":"star-half","code":"f089"},{"name":"star-half-empty","code":"f123"},{"name":"star-half-full","code":"f123"},{"name":"star-half-o","code":"f123"},{"name":"star-o","code":"f006"},{"name":"steam","code":"f1b6"},{"name":"steam-square","code":"f1b7"},{"name":"step-backward","code":"f048"},{"name":"step-forward","code":"f051"},{"name":"stethoscope","code":"f0f1"},{"name":"sticky-note","code":"f249"},{"name":"sticky-note-o","code":"f24a"},{"name":"stop","code":"f04d"},{"name":"stop-circle","code":"f28d"},{"name":"stop-circle-o","code":"f28e"},{"name":"street-view","code":"f21d"},{"name":"strikethrough","code":"f0cc"},{"name":"stumbleupon","code":"f1a4"},{"name":"stumbleupon-circle","code":"f1a3"},{"name":"subscript","code":"f12c"},{"name":"subway","code":"f239"},{"name":"suitcase","code":"f0f2"},{"name":"sun-o","code":"f185"},{"name":"superscript","code":"f12b"},{"name":"support","code":"f1cd"},{"name":"table","code":"f0ce"},{"name":"tablet","code":"f10a"},{"name":"tachometer","code":"f0e4"},{"name":"tag","code":"f02b"},{"name":"tags","code":"f02c"},{"name":"tasks","code":"f0ae"},{"name":"taxi","code":"f1ba"},{"name":"television","code":"f26c"},{"name":"tencent-weibo","code":"f1d5"},{"name":"terminal","code":"f120"},{"name":"text-height","code":"f034"},{"name":"text-width","code":"f035"},{"name":"th","code":"f00a"},{"name":"th-large","code":"f009"},{"name":"th-list","code":"f00b"},{"name":"thumb-tack","code":"f08d"},{"name":"thumbs-down","code":"f165"},{"name":"thumbs-o-down","code":"f088"},{"name":"thumbs-o-up","code":"f087"},{"name":"thumbs-up","code":"f164"},{"name":"ticket","code":"f145"},{"name":"times","code":"f00d"},{"name":"times-circle","code":"f057"},{"name":"times-circle-o","code":"f05c"},{"name":"tint","code":"f043"},{"name":"toggle-down","code":"f150"},{"name":"toggle-left","code":"f191"},{"name":"toggle-off","code":"f204"},{"name":"toggle-on","code":"f205"},{"name":"toggle-right","code":"f152"},{"name":"toggle-up","code":"f151"},{"name":"trademark","code":"f25c"},{"name":"train","code":"f238"},{"name":"transgender","code":"f224"},{"name":"transgender-alt","code":"f225"},{"name":"trash","code":"f1f8"},{"name":"trash-o","code":"f014"},{"name":"tree","code":"f1bb"},{"name":"trello","code":"f181"},{"name":"tripadvisor","code":"f262"},{"name":"trophy","code":"f091"},{"name":"truck","code":"f0d1"},{"name":"try","code":"f195"},{"name":"tty","code":"f1e4"},{"name":"tumblr","code":"f173"},{"name":"tumblr-square","code":"f174"},{"name":"turkish-lira","code":"f195"},{"name":"tv","code":"f26c"},{"name":"twitch","code":"f1e8"},{"name":"twitter","code":"f099"},{"name":"twitter-square","code":"f081"},{"name":"umbrella","code":"f0e9"},{"name":"underline","code":"f0cd"},{"name":"undo","code":"f0e2"},{"name":"university","code":"f19c"},{"name":"unlink","code":"f127"},{"name":"unlock","code":"f09c"},{"name":"unlock-alt","code":"f13e"},{"name":"unsorted","code":"f0dc"},{"name":"upload","code":"f093"},{"name":"usb","code":"f287"},{"name":"usd","code":"f155"},{"name":"user","code":"f007"},{"name":"user-md","code":"f0f0"},{"name":"user-plus","code":"f234"},{"name":"user-secret","code":"f21b"},{"name":"user-times","code":"f235"},{"name":"users","code":"f0c0"},{"name":"venus","code":"f221"},{"name":"venus-double","code":"f226"},{"name":"venus-mars","code":"f228"},{"name":"viacoin","code":"f237"},{"name":"video-camera","code":"f03d"},{"name":"vimeo","code":"f27d"},{"name":"vimeo-square","code":"f194"},{"name":"vine","code":"f1ca"},{"name":"vk","code":"f189"},{"name":"volume-down","code":"f027"},{"name":"volume-off","code":"f026"},{"name":"volume-up","code":"f028"},{"name":"warning","code":"f071"},{"name":"wechat","code":"f1d7"},{"name":"weibo","code":"f18a"},{"name":"weixin","code":"f1d7"},{"name":"whatsapp","code":"f232"},{"name":"wheelchair","code":"f193"},{"name":"wifi","code":"f1eb"},{"name":"wikipedia-w","code":"f266"},{"name":"windows","code":"f17a"},{"name":"won","code":"f159"},{"name":"wordpress","code":"f19a"},{"name":"wrench","code":"f0ad"},{"name":"xing","code":"f168"},{"name":"xing-square","code":"f169"},{"name":"y-combinator","code":"f23b"},{"name":"y-combinator-square","code":"f1d4"},{"name":"yahoo","code":"f19e"},{"name":"yc","code":"f23b"},{"name":"yc-square","code":"f1d4"},{"name":"yelp","code":"f1e9"},{"name":"yen","code":"f157"},{"name":"youtube","code":"f167"},{"name":"youtube-play","code":"f16a"},{"name":"youtube-square","code":"f166"}];
};

GS.lorem = function () {
    return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
};

