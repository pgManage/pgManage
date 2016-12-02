
window.addEventListener('design-register-element', function () {
    'use strict';
    
    registerDesignSnippet('GS.findParentTag', 'GS.findParentTag', 'GS.findParentTag(${1:element}, \'${0:tag-to-find}\');');
    
    registerDesignSnippet('GS.findParentElement', 'GS.findParentElement',
                                                    'GS.findParentElement(${1:element}, ${0:\'selector, element or function\'});');
    
    registerDesignSnippet('GS.insertElementAfter', 'GS.insertElementAfter',
                                                    'GS.insertElementAfter(${1:elementToInsert}, \'${0:elementToInsertAfter}\');');
    
    registerDesignSnippet('GS.getElementOffset', 'GS.getElementOffset', 'GS.getElementOffset(${0:element});');
    
    registerDesignSnippet('GS.animateStyle', 'GS.animateStyle',
                                            'GS.animateStyle(${1:elementToAnimate}, ' +
                                                            '${2:CSSPropertyToAnimate}, ' +
                                                            '${3:startValue}, ' +
                                                            '${4:endValue}, ' +
                                                            '${5:callbackAfterAnimation}, ' +
                                                            '${6:durationInMilliseconds}, ' +
                                                            '${0:numberOfFrames});');
    
    registerDesignSnippet('GS.stringToElement', 'GS.stringToElement', 'GS.stringToElement(\'${0:<div>your HTML here</div>}\');');
    
    registerDesignSnippet('GS.cloneElement', 'GS.cloneElement', 'GS.cloneElement(${0:element});');
    
    registerDesignSnippet('GS.isElementFocusable', 'GS.isElementFocusable', 'GS.isElementFocusable(${0:element});');
    
    registerDesignSnippet('GS.scrollParent', 'GS.scrollParent', 'GS.scrollParent(${0:element});');
    
    registerDesignSnippet('GS.scrollIntoView', 'GS.scrollIntoView', 'GS.scrollIntoView(${0:element});');
    
    registerDesignSnippet('GS.getInputSelection', 'GS.getInputSelection', 'GS.getInputSelection(${0:inputOrTextareaElement});');
    
    registerDesignSnippet('GS.setInputSelection', 'GS.setInputSelection',
                                    'GS.setInputSelection(${1:inputOrTextareaElement}, ${2:startAtNumber}, ${0:endAtNumber});');
    
    registerDesignSnippet('GS.getElementPositionData', 'GS.getElementPositionData', 'GS.getElementPositionData(${0:element});');
});

// #################################################################
// #################### DOM TRAVERSAL FUNCTIONS ####################
// #################################################################

// loop through parents until tag is found
GS.findParentTag = function (element, strTagName) {
    'use strict';
    var currentElement = element.parentNode;
    
    strTagName = strTagName.toUpperCase();
    
    while (currentElement && currentElement.nodeName !== strTagName && currentElement.nodeName !== 'HTML') {
        currentElement = currentElement.parentNode;
    }
    
    if (!currentElement || currentElement.nodeName !== strTagName) {
        return undefined;
    }
    
    return currentElement;
};

// loop through parents until checkParameter is satisfied or we run into HTML
GS.findParentElement = function (element, checkParameter) {
    'use strict';
    var currentElement = element;
    
    // if checkParameter is a function: use it to check the element
    if (typeof checkParameter === 'function') {
        while (currentElement && !checkParameter(currentElement) && currentElement.nodeName !== 'HTML') {
            currentElement = currentElement.parentNode;
        }
        
    // else if checkParameter is a string: use checkParameter as a selector string and use xtag.matchSelector
    } else if (typeof checkParameter === 'string') {
        while (currentElement && !xtag.matchSelector(currentElement, checkParameter) && currentElement.nodeName !== 'HTML') {
            currentElement = currentElement.parentNode;
        }
        
    // else: assume checkParameter is an element and use ===
    } else {
        while (currentElement && currentElement !== checkParameter && currentElement.nodeName !== 'HTML') {
            currentElement = currentElement.parentNode;
        }
    }
    
    if (!currentElement) {
        return undefined;
    }
    
    return currentElement;
};


// ################################################################
// #################### HTML ELEMENT FUNCTIONS ####################
// ################################################################

// insert element after another element
GS.insertElementAfter = function (elementToInsert, target) {
    if (target.nextElementSibling) {
        target.parentNode.insertBefore(elementToInsert, target.nextElementSibling);
    } else {
        target.parentNode.appendChild(elementToInsert);
    }
};

// get element's position on the screen
GS.getElementOffset = function (element) {
    'use strict';
    var intX = 0, intY = 0, ret;
    
    if (element.getBoundingClientRect) {
        ret = element.getBoundingClientRect();
        
    } else {
        while (element && element.nodeName !== 'HTML') {
            intX += element.offsetLeft - element.scrollLeft;// + element.clientLeft;
            intY += element.offsetTop - element.scrollTop;// + element.clientTop;
            
            //console.log(element.offsetTop, element.scrollTop, element);
            
            element = element.parentNode; //element.offsetParent
        }
        
        ret = {
            left: intX,
            top: intY
        };
    }
    
    return ret;
};

//
GS.animateStyle = function (element, strStyleProperty, strStart, strEnd, callback, intDuration, intFrames) {
    var intStart         = parseInt(strStart, 10),
        intEnd           = parseInt(strEnd, 10),
        strStartUnit     = strStart.replace(/[0-9\.-]/gi, '').toLowerCase(),
        //strEndUnit       = strEnd.replace(/[0-9\.-]/gi, '').toLowerCase(),
        intFrameDuration = intDuration / intFrames,
        i, timeoutFunction, intCurrent, intJump;
    
    //if (strStartUnit !== 'em' && strStartUnit !== 'px' && strStartUnit !== '') {
    //    throw 'animateStyle error: strStart has an invalid unit, use px or em or nothing';
    //    
    //} else if (strEndUnit !== 'em' && strEndUnit !== 'px' && strEndUnit !== '') {
    //    throw 'animateStyle error: strEnd has an invalid unit, use px or em or nothing';
    //    
    //} else {
    intCurrent = intStart;
    intJump = (intEnd - intStart) / intFrames;
    i = 1;
    
    element.style[strStyleProperty] = strStart;
    
    timeoutFunction = function () {
        setTimeout(function () {
            intCurrent += intJump;
            //element.style[strStyleProperty] = intCurrent + strStartUnit;
            //console.log(intCurrent, i, intFrames, element, element.style[strStyleProperty], intStart, intCurrent, strStartUnit);
            
            if (i < intFrames) {
                element.style[strStyleProperty] = intCurrent + strStartUnit;
                i += 1;
                timeoutFunction();
            } else {
                element.style[strStyleProperty] = strEnd;
                callback();
            }
        }, intFrameDuration);
    };
    
    timeoutFunction();
    //}
};

//
GS.stringToElement = function (strHTML, optionalTargetDocument) {
    var strFirstTagName, parentElement, indexInElement, parsedElement, targetDocument;
    
    if (optionalTargetDocument) {
        targetDocument = optionalTargetDocument;
    } else {
        targetDocument = document;
    }
    
    //console.log(strFirstTagName);
    
    strFirstTagName = strHTML.substring(strHTML.indexOf('<') + 1, strHTML.indexOf('>'));
    
    //console.log(strFirstTagName);
    
    if (strFirstTagName.indexOf(' ') > -1) {
        strFirstTagName = strFirstTagName.substring(0, strFirstTagName.indexOf(' '));
    }
    
    //console.log(strFirstTagName);
    
    if (strFirstTagName === 'body') {
        parentElement = targetDocument.createElement('html');
        indexInElement = 1;
        
    } else if (strFirstTagName === 'thead' || strFirstTagName === 'tbody') {
        parentElement = targetDocument.createElement('table');
        indexInElement = 0;
        
    } else if (strFirstTagName === 'tr') {
        parentElement = targetDocument.createElement('tbody');
        indexInElement = 0;
        
    } else if (strFirstTagName === 'td' || strFirstTagName === 'th') {
        parentElement = targetDocument.createElement('tr');
        indexInElement = 0;
        
    } else if (strFirstTagName === 'li') {
        parentElement = targetDocument.createElement('ul');
        indexInElement = 0;
    } else {
        parentElement = targetDocument.createElement('div');
        indexInElement = 0;
    }
    
    parentElement.innerHTML = strHTML;
    parsedElement = parentElement.children[indexInElement];
    
    //console.log(strFirstTagName, parsedElement);
    
    return parsedElement;
};

//
GS.cloneElement = function (element, optionalTargetDocument) {
    // if there is a template element in the element: copy the element without cloneNode because for some reason cloneNode breaks templates on IOS
    if (xtag.query(element, 'template').length > 0 || optionalTargetDocument) {
        return GS.stringToElement(element.outerHTML, optionalTargetDocument);
    }
    
    // else: just use cloneNode
    return element.cloneNode(true);
};

/*
// change the tag of an element
GS.changeElementTag = function (element, strNewTag, alterCallback) {
    var strHTML = element.outerHTML.trim(), newElement;
    
    strHTML = '<' + strNewTag + strHTML.substring(strHTML.indexOf(' '), strHTML.lastIndexOf('</')) + '</' + strNewTag + '>';
    
    //console.log(strHTML);
    
    newElement = GS.stringToElement(strHTML);
    
    if (typeof alterCallback === 'function') {
        alterCallback.apply(newElement);
    }
    
    return newElement;
};*/

// check to see if an element is focusable
GS.isElementFocusable = function (element) {
    return  (
                element.nodeName === 'INPUT' ||
                element.nodeName === 'TEXTAREA' ||
                element.nodeName === 'SELECT' ||
                element.nodeName === 'BUTTON' ||
                element.nodeName === 'IFRAME' ||
                (element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1') ||
                (element.focus &&
                    element.focus.toString().indexOf('[native code]') === -1 &&
                    element.focus.toString() !== document.createElement('div').focus.toString()) ||
                (
                    element.nodeName === 'A' &&
                    element.hasAttribute('href')
                ) ||
                (
                    element.nodeName === 'AREA' &&
                    element.hasAttribute('href')
                )
            ) &&
            !element.hasAttribute('disabled');
};

// see function in 006-utl.js
//// search for a parent with a scrollbar
//GS.scrollParent = function (element) {
//    var i = 0, currentElement = element, bolFoundScrollable = false, strOverflow;
//    
//    if (currentElement) {
//        while (currentElement && currentElement.nodeName !== 'HTML' && bolFoundScrollable === false && i < 75) {
//            strOverflow = GS.getStyle(currentElement, 'overflow');
//            
//            if (strOverflow === 'scroll' || (strOverflow === 'auto' && currentElement.clientHeight < currentElement.scrollHeight)) {
//                bolFoundScrollable = true;
//            } else {
//                currentElement = currentElement.parentNode;
//                i += 1;
//            }
//        }
//        return bolFoundScrollable ? currentElement : undefined;
//    }
//    return undefined;
//};

// scroll an element to the middle of its scrollparent
GS.scrollIntoView = function (element) {
    var scrollingContainer = GS.scrollParent(element), arrSiblings, i, len, intScrollTop;
    
    if (scrollingContainer) {
        //console.log(scrollingContainer);
        
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
        
        //console.log(intScrollTop);
        
        scrollingContainer.scrollTop = intScrollTop;
    }
};


// #################################################################
// ################### INPUT SELECTION FUNCTIONS ###################
// #################################################################

GS.getInputSelection = function (input) {
    'use strict';
    var start = 0, end = 0, normalizedValue, range, textInputRange, len, endRange;
    
    if (typeof input.selectionStart === "number" && typeof input.selectionEnd === "number") {
        start = input.selectionStart;
        end = input.selectionEnd;
    } else {
        range = (document.createRange() || document.selection.createRange());
        
        if (range && range.parentElement() == input) {
            len = input.value.length;
            normalizedValue = input.value.replace(/\r\n/g, "\n");
            
            // Create a working TextRange that lives only in the input
            textInputRange = input.createTextRange();
            textInputRange.moveToBookmark(range.getBookmark());
            
            // Check if the start and end of the selection are at the very end
            // of the input, since moveStart/moveEnd doesn't return what we want
            // in those cases
            endRange = input.createTextRange();
            endRange.collapse(false);
            
            if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                start = end = len;
            } else {
                start = -textInputRange.moveStart("character", -len);
                start += normalizedValue.slice(0, start).split("\n").length - 1;
                
                if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                    end = len;
                } else {
                    end = -textInputRange.moveEnd("character", -len);
                    end += normalizedValue.slice(0, end).split("\n").length - 1;
                }
            }
        }
    }
    
    return {
        start: start,
        end: end
    };
};

GS.setInputSelection = function (input, intStart, intEnd) {
    'use strict';
    var range;
    
    if (intStart === undefined || intStart === '' || isNaN(intStart) || intStart === null) {
        intStart = input.value.length;
    }
    
    if (intEnd === undefined || intEnd === '' || isNaN(intEnd) || intEnd === null) {
        intEnd = intStart;
    }
    
    if (input.createTextRange) {
        range = input.createTextRange();
        range.collapse();
        range.moveStart('character', intStart);
        range.collapse();
        range.moveEnd('character', intEnd);
        range.select();
    } else if (input.setSelectionRange) {
        input.focus();
        input.setSelectionRange(intStart, intEnd);
    }
};


// #################################################################
// ################### ELEMENT POSITION FUNCTION ###################
// #################################################################

// return a whole bunch of position data variables for an element
GS.getElementPositionData = function (element) {
    var objElementOffset  = GS.getElementOffset(element),
        intElementWidth   = element.offsetWidth,
        intElementHeight  = element.offsetHeight,
        intElementTop     = objElementOffset.top,
        intElementLeft    = objElementOffset.left,
        intElementBottom  = window.innerHeight - (intElementTop    + intElementHeight),
        intElementRight   = window.innerWidth  - (intElementLeft   + intElementWidth),
        intRoomAbove      = window.innerHeight - (intElementBottom + intElementHeight),
        intRoomBelow      = intElementBottom,
        intRoomLeft       = window.innerWidth  - (intElementRight  + intElementWidth),
        intRoomRight      = intElementRight;
    
    /*console.log(element, '\n' +
                'intElementWidth:   ' + intElementWidth + '\n' +
                'intElementHeight:  ' + intElementHeight + '\n' +
                'intElementTop:     ' + intElementTop + '\n' +
                'intElementBottom:  ' + intElementBottom + '\n' +
                'intElementLeft:    ' + intElementLeft + '\n' +
                'intElementRight:   ' + intElementRight + '\n' +
                'intRoomAbove:      ' + intRoomAbove + '\n' +
                'intRoomBelow:      ' + intRoomBelow + '\n' +
                'intRoomLeft:       ' + intRoomLeft + '\n' +
                'intRoomRight:      ' + intRoomRight);*/
    
    return {
        'element':           element,
        'objElementOffset':  objElementOffset,
        'intElementWidth':   intElementWidth,
        'intElementHeight':  intElementHeight,
        'intElementTop':     intElementTop,
        'intElementLeft':    intElementLeft,
        'intElementBottom':  intElementBottom,
        'intElementRight':   intElementRight,
        'intRoomAbove':      intRoomAbove,
        'intRoomBelow':      intRoomBelow,
        'intRoomLeft':       intRoomLeft,
        'intRoomRight':      intRoomRight
    };
};

// #################################################################
// ####################### DOCUMENT FRAGMENT #######################
// #################################################################
/*                                       ,--- the problem with this code is the DOM we get back is not 100% reliably inert. 
                                         V          To make it reliable I believe I have to change how my elements work.
GS.createDocumentFragment = function (strHTML) {
    'use strict';
    var element = document.createElement('div'),
        fragment = document.createDocumentFragment(),
        arrChildren = element.childNodes;
    
    // fill element with HTML
    element.innerHTML = strHTML;
    
    // append the element to the body (NECCESSARY FOR THE HTML TO BE INERT, I DON'T KNOW WHY -michael)
    document.body.appendChild(element);
    
    // transfer children from element to fragment
    while (arrChildren[0]) {
        fragment.appendChild(arrChildren[0]);
    }
    
    // remove element from the body
    document.body.removeChild(element);
    
    // return inert fragment
    return fragment;
};

GS.getDocumentFragmentHTML = function (fragment) {
    'use strict';
    var strHTML, i, len, arrChildren = fragment.children;
    
    for (strHTML = '', i = 0, len = arrChildren.length; i < len; i += 1) {
        strHTML += arrChildren[i].outerHTML;
    }
    
    return strHTML;
};
*/

// #################################################################
// ########################### INERT DOM ###########################
// #################################################################
/*tell papa if you uncomment
GS.createInertDOM = function (strHTML) {
    'use strict';
    var templateElement = document.createElement('template'), iframeElement;
    
    // if the content property is on a template element: no iframe neccessary
    if ('content' in templateElement) {
        templateElement.innerHTML = strHTML;
        
        return templateElement.content;
        
    // else: use iframe to create inert HTML
    } else {
        if (!document.getElementById('gs-inert-dom-generator')) {
            iframeElement = document.createElement('iframe');
            
            iframeElement.setAttribute('id', 'gs-inert-dom-generator');
            iframeElement.setAttribute('hidden', '');
            
            document.body.appendChild(iframeElement);
            
        } else {
            iframeElement = document.getElementById('gs-inert-dom-generator');
        }
        
        iframeElement.contentWindow.inertDOM = iframeElement.contentWindow.document.createElement('div');
        iframeElement.contentWindow.inertDOM.innerHTML = strHTML;
        
        return iframeElement.contentWindow.inertDOM;
    }
};

GS.getInertDOMHTML = function (inertDOM) {
    'use strict';
    var strHTML, i, len, arrChildren = inertDOM.children;
    
    for (strHTML = '', i = 0, len = arrChildren.length; i < len; i += 1) {
        strHTML += arrChildren[i].outerHTML;
    }
    
    return strHTML;
};
*/

// ##################################################################
// ###################### TABLE COPY/SELECTION ######################
// ##################################################################
(function () {
    'use strict';
    function getCellFromTarget(element) {
        var currentElement = element;
        
        while (currentElement.nodeName !== 'TD' && currentElement.nodeName !== 'TH' && currentElement.nodeName !== 'HTML') {
            currentElement = currentElement.parentNode;
        }
        
        if (currentElement.nodeName !== 'TD' && currentElement.nodeName !== 'TH') {
            return undefined;
        }
        
        return currentElement;
    }
    
    function selectHandler(tableElement, dragOrigin, dragCurrentCell, dragMode) {
        var bolThead, bolFirstTh, arrRecords, arrCells, arrRecordsToAffect = [], arrCellsToAffect = [],
            arrNewSelection = [], arrCellsToRemoveFromSelection = [], i, len, intFrom, intTo;
        
        arrRecords = xtag.query(tableElement, 'tr');
        arrCells = xtag.query(tableElement, 'td, th');
        
        if (arrRecords.length > 0) {
            bolThead = Boolean(xtag.queryChildren(tableElement, 'thead')[0]);
            
            if ((bolThead && arrRecords.length > 1) || (!bolThead && arrRecords > 0)) {
                if (bolThead) {
                    bolFirstTh = arrRecords[1].children[0].nodeName === 'TH';
                } else {
                    bolFirstTh = arrRecords[0].children[0].nodeName === 'TH';
                }
            }
            
            // if origin & currentCell are both the top-left cell and the cell is a heading: select all cells
            if (bolThead && bolFirstTh &&
                dragOrigin.parentNode.rowIndex === 0 && dragCurrentCell.parentNode.rowIndex === 0 &&
                dragOrigin.cellIndex === 0 && dragCurrentCell.cellIndex === 0) {
                arrCellsToAffect = arrCells;
                
            // else if origin & currentCell are both first ths: select the records from origin to currentCell
            } else if (bolFirstTh && dragOrigin.cellIndex === 0 && dragCurrentCell.cellIndex === 0) {
                arrRecordsToAffect =
                    arrRecords.slice(Math.min(dragOrigin.parentNode.rowIndex, dragCurrentCell.parentNode.rowIndex),
                                     Math.max(dragOrigin.parentNode.rowIndex, dragCurrentCell.parentNode.rowIndex) + 1);
                
                for (i = 0, len = arrRecordsToAffect.length; i < len; i += 1) {
                    Array.prototype.push.apply(arrCellsToAffect, xtag.toArray(arrRecordsToAffect[i].children));
                }
                
            // else if origin & currentCell are both headings: select the columns from origin to currentCell
            } else if (bolThead && dragOrigin.parentNode.rowIndex === 0 && dragCurrentCell.parentNode.rowIndex === 0) {
                intFrom = Math.min(dragOrigin.cellIndex, dragCurrentCell.cellIndex);
                intTo   = Math.max(dragOrigin.cellIndex, dragCurrentCell.cellIndex) + 1;
                
                for (i = 0, len = arrRecords.length; i < len; i += 1) {
                    Array.prototype.push.apply(arrCellsToAffect, xtag.toArray(arrRecords[i].children).slice(intFrom, intTo));
                }
                
            //// else if origin & currentCell are the same cell: select the record
            //} else if (dragOrigin === dragCurrentCell) {
            //    arrRecordsToAffect = arrRecords.slice(dragOrigin.parentNode.rowIndex, dragOrigin.parentNode.rowIndex + 1);
            //    
            //    for (i = 0, len = arrRecordsToAffect.length; i < len; i += 1) {
            //        Array.prototype.push.apply(arrCellsToAffect, xtag.toArray(arrRecordsToAffect[i].children));
            //    }
            //    
            // else select cells from origin to currentCell
            } else {
                arrRecordsToAffect =
                    arrRecords.slice(Math.min(dragOrigin.parentNode.rowIndex, dragCurrentCell.parentNode.rowIndex),
                                     Math.max(dragOrigin.parentNode.rowIndex, dragCurrentCell.parentNode.rowIndex) + 1);
                
                intFrom = Math.min(dragOrigin.cellIndex, dragCurrentCell.cellIndex);
                intTo   = Math.max(dragOrigin.cellIndex, dragCurrentCell.cellIndex) + 1;
                
                for (i = 0, len = arrRecordsToAffect.length; i < len; i += 1) {
                    Array.prototype.push.apply(arrCellsToAffect, xtag.toArray(arrRecordsToAffect[i].children).slice(intFrom, intTo));
                }
            }
            
            if (dragMode === 'select') {
                // add new cells to tableElement.selectionSelectedCells
                for (i = 0, len = tableElement.selectionSelectedCells.length; i < len; i += 1) {
                    if (arrCellsToAffect.indexOf(tableElement.selectionSelectedCells[i]) === -1) {
                        arrCellsToRemoveFromSelection.push(tableElement.selectionSelectedCells[i]);
                    }
                }
                tableElement.selectionSelectedCells = arrCellsToAffect;
                
                // add new cells to tableElement.selectedCells
                arrNewSelection = tableElement.selectedCells;
                for (i = 0, len = arrCellsToAffect.length; i < len; i += 1) {
                    GS.listAdd(arrNewSelection, arrCellsToAffect[i]);
                }
                for (i = 0, len = arrCellsToRemoveFromSelection.length; i < len; i += 1) {
                    arrNewSelection.splice(arrNewSelection.indexOf(arrCellsToRemoveFromSelection[i]), 1);
                }
                tableElement.selectedCells = arrNewSelection;
                
            } else { // implied if: dragMode === 'deselect'
                // deselect cells from arrCellsToAffect
                arrNewSelection = tableElement.selectedCells;
                
                for (i = 0, len = arrCellsToAffect.length; i < len; i += 1) {
                    if (arrNewSelection.indexOf(arrCellsToAffect[i]) > -1) {
                        arrNewSelection.splice(arrNewSelection.indexOf(arrCellsToAffect[i]), 1);
                    }
                }
                tableElement.selectedCells = arrNewSelection;
            }
        }
    }
    
    
    
    
    
    
    function getSelectedCopyHTML(element) {
        var strHTMLCopyString, intFromRecord, intToRecord, intFromCell = 9999999, intToCell = 0
          , i, len, cell_i, cell_len, arrSelected, strCellHTML, arrRecords, arrCells
          , strHTMLRecordString;
        
        arrSelected = element.selectedCells;
        
        // loop through the selected cells and create an html string using the text of the cell
        if (arrSelected.length > 0) {
            intFromRecord = arrSelected[0].parentNode.rowIndex;
            intToRecord = arrSelected[arrSelected.length - 1].parentNode.rowIndex + 1;
            
            for (i = 0, len = arrSelected.length; i < len; i += 1) {
                if (arrSelected[i].cellIndex < intFromCell) {
                    intFromCell = arrSelected[i].cellIndex;
                    intFromCell = (intFromCell === 0 ? 1 : intFromCell);
                }
                if (arrSelected[i].cellIndex + 1 > intToCell) {
                    intToCell = arrSelected[i].cellIndex + 1;
                }
            }
            
            arrRecords = xtag.query(element, 'tr');
            strHTMLCopyString = '';
            
            for (i = intFromRecord, len = intToRecord; i < len; i += 1) {
                arrCells = arrRecords[i].children;
                strHTMLRecordString = '';
                
                if (!arrRecords[i].classList.contains('insert-record')) {
                    for (cell_i = intFromCell, cell_len = intToCell; cell_i < cell_len; cell_i += 1) {
                        strCellHTML = '';
                        
                        if (arrCells[cell_i].hasAttribute('selected')) {
                            if (arrCells[cell_i].lastElementChild) { 
                                strCellHTML = arrCells[cell_i].lastElementChild.textValue ||
                                              arrCells[cell_i].lastElementChild.value ||
                                              (arrCells[cell_i].lastElementChild.checked || '').toString();
                            } else {
                                strCellHTML = arrCells[cell_i].textContent;//.trim();
                            }
                            
                            strCellHTML = encodeHTML(strCellHTML).replace(/\n/gim, '<br />');
                        }
                        
                        strCellHTML = '<' + 'td rowspan="1" colspan="1">' + (strCellHTML || '') + '</td>'
                        
                        strHTMLRecordString += (cell_i === intFromCell ? '<' + 'tr>' : '');
                        strHTMLRecordString += (strCellHTML || '');
                        strHTMLRecordString += (cell_i === (intToCell - 1) ? '<' + '/tr>' : '');
                    }
                }
                if (strHTMLRecordString.trim()) {
                    strHTMLCopyString += strHTMLRecordString;
                }
            }
            
            if (strHTMLCopyString) {
                strHTMLCopyString = '<' + 'style>' +
                                        'br { mso-data-placement:same-cell; } ' +
                                        'th, td { white-space: pre-wrap; }' +
                                    '<' + '/style>' +
                                    '<' + 'table border="0" cellpadding="0" cellspacing="0">' + strHTMLCopyString + '<' + '/table>';
            }
        }
        
        return strHTMLCopyString || '';
    }
    
    function getSelectedCopyText(element) {
        var strTextCopyString, intFromRecord, intToRecord, intFromCell = 9999999, intToCell = 0,
            i, len, cell_i, cell_len, arrSelected, strCellText, arrRecords, arrCells, arrCellIndexes, strTextRecordString,
            strQuoteType, strQuoteChar, strFieldDelimiter, strRowDelimiter, strNull, bolColumns, quoteRegex;
        
        strQuoteType      = (element.getAttribute('quote-type')      || "strings");
        strQuoteChar      = (element.getAttribute('quote-char')      || '"');
        strFieldDelimiter = (element.getAttribute('field-delimiter') || "\t");
        strNull           = (element.getAttribute('null-values')     || "NULL");
        bolColumns        = (element.getAttribute('column-names')    || "true") === "true";
        strRowDelimiter   = (element.getAttribute('row-delimiter')   || "\n");
        
        quoteRegex = new RegExp(strQuoteChar, 'g');
        
        arrSelected = element.selectedCells;
        
        // loop through the selected cells and create a tsv string using the text of the cell
        if (arrSelected.length > 0) {
            intFromRecord = arrSelected[0].parentNode.rowIndex;
            intToRecord = arrSelected[arrSelected.length - 1].parentNode.rowIndex + 1;
            
            for (i = 0, len = arrSelected.length; i < len; i += 1) {
                if (arrSelected[i].cellIndex < intFromCell) {
                    intFromCell = arrSelected[i].cellIndex;
                    intFromCell = (intFromCell === 0 ? 1 : intFromCell);
                }
                if (arrSelected[i].cellIndex + 1 > intToCell) {
                    intToCell = arrSelected[i].cellIndex + 1;
                }
            }
            
            arrRecords = xtag.query(element, 'tr');
            strTextCopyString = '';
            
            // if bolColumns is true and the first record is not selected: add first record first
            if (bolColumns && intFromRecord > 0) {
                arrCells = arrRecords[0].children;
                strTextRecordString = '';
                
                for (cell_i = intFromCell, cell_len = intToCell; cell_i < cell_len; cell_i += 1) {
                    strCellText = '';
                    
                    if (arrCells[cell_i].nodeName === 'TH' && arrCells[cell_i].firstElementChild) {
                        strCellText = arrCells[cell_i].firstElementChild.textValue ||
                                      arrCells[cell_i].firstElementChild.value ||
                                      (arrCells[cell_i].firstElementChild.checked || '').toString() ||
                                      arrCells[cell_i].firstElementChild.textContent;//.trim();
                        
                    } else if (arrCells[cell_i].lastElementChild) {
                        strCellText = arrCells[cell_i].lastElementChild.textValue ||
                                      arrCells[cell_i].lastElementChild.value ||
                                      (arrCells[cell_i].lastElementChild.checked || '').toString();
                    } else {
                        strCellText = arrCells[cell_i].textContent;//.trim();
                    }
                    
                    strCellText = strCellText.replace(quoteRegex, (strQuoteChar + strQuoteChar));
                    
                    if (strCellText === 'NULL' || strCellText === '\N') {
                        strCellText = strNull;
                    } else {
                        if (strQuoteType === 'all') {
                            strCellText = strQuoteChar + strCellText + strQuoteChar;
                        } else if (strQuoteType === 'strings' && isNaN(strCellText)) {
                            strCellText = strQuoteChar + strCellText + strQuoteChar;
                        }
                    }
                    
                    strTextRecordString += (cell_i !== intFromCell ? strFieldDelimiter : '');
                    strTextRecordString += (strCellText || '');
                }
                
                strTextCopyString += strTextRecordString;
                strTextCopyString += strRowDelimiter;
            }
            
            for (i = intFromRecord, len = intToRecord; i < len; i += 1) {
                arrCells = arrRecords[i].children;
                strTextRecordString = '';
                
                for (cell_i = intFromCell, cell_len = intToCell; cell_i < cell_len; cell_i += 1) {
                    strCellText = '';
                    
                    if (arrCells[cell_i].hasAttribute('selected')) {
                        if (arrCells[cell_i].nodeName === 'TH' && arrCells[cell_i].firstElementChild) { 
                            strCellText = arrCells[cell_i].firstElementChild.textValue ||
                                          arrCells[cell_i].firstElementChild.value ||
                                          (arrCells[cell_i].firstElementChild.checked || '').toString() ||
                                          arrCells[cell_i].firstElementChild.textContent;//.trim();
                            
                        } else if (arrCells[cell_i].lastElementChild) {
                            strCellText = arrCells[cell_i].lastElementChild.textValue ||
                                          arrCells[cell_i].lastElementChild.value ||
                                          (arrCells[cell_i].lastElementChild.checked || '').toString();
                        } else {
                            strCellText = arrCells[cell_i].textContent;//.trim();
                        }
                        
                        strCellText = strCellText.replace(quoteRegex, (strQuoteChar + strQuoteChar));
                        
                        if (strCellText === 'NULL' || strCellText === '\N') {
                            strCellText = strNull;
                        } else {
                            if (strQuoteType === 'all') {
                                strCellText = strQuoteChar + strCellText + strQuoteChar;
                            } else if (strQuoteType === 'strings' && isNaN(strCellText)) {
                                strCellText = strQuoteChar + strCellText + strQuoteChar;
                            }
                        }
                    }
                    
                    strTextRecordString += (cell_i !== intFromCell ? strFieldDelimiter : '');
                    strTextRecordString += (strCellText || '');
                }
                //if (strTextRecordString.trim()) {
                strTextCopyString += strTextRecordString;
                //}
                if (i + 1 !== len) { //&& strTextRecordString.trim()
                    strTextCopyString += strRowDelimiter;
                }
            }
        }
        
        return strTextCopyString || '';
    }
    
    function handleClipboardData(event, strCopyString, strType) {
        var clipboardData = event.clipboardData || window.clipboardData, strMime;
        
        if (!clipboardData) { return; }
        if (!clipboardData.setData) { return; }
        
        if (strType === 'text') {
            if (window.clipboardData && window.clipboardData.getData) { // IE
                strMime = 'Text';
            } else if (event.clipboardData && event.clipboardData.getData) {
                strMime = 'text/plain';
            }
            
        } else if (strType === 'html') {
            if (window.clipboardData && window.clipboardData.getData) { // IE
                strMime = '';
            } else if (event.clipboardData && event.clipboardData.getData) {
                strMime = 'text/html';
            }
            
        } else {
            throw 'handleClipboardData Error: Type "' + strType + '" not recognized, recognized types are "text" and "html".';
        }
        
        if (strMime) {
            if (strCopyString && strMime) {
                return clipboardData.setData(strMime, strCopyString) !== false;
            } else {
                return clipboardData.getData(strMime);
            }
        }
    }
    
    
    
    //function handleClipboardData(event, strCopyString) {
    //    var clipboardData = event.clipboardData || window.clipboardData, strMime;
    //    
    //    if (!clipboardData) {
    //        return;
    //    }
    //    if (!clipboardData.setData) {
    //        return;
    //    }
    //    
    //    if (window.clipboardData && window.clipboardData.getData) { // IE
    //        strMime = 'Text';
    //    } else if (event.clipboardData && event.clipboardData.getData) {
    //        strMime = 'text/plain';
    //    }
    //    
    //    if (strCopyString) {
    //        return clipboardData.setData(strMime, strCopyString) !== false;
    //    } else {
    //        return clipboardData.getData(strMime);
    //    }
    //}

    GS.makeTableSelectable = function (tableElement, bolSingleRecord) {
        var copyElement;
        
        // tableElement verification
        if (!tableElement || tableElement.nodeName !== 'TABLE') {
            throw 'GS.makeTableSelectable Error: you must provide a <table> element as the first parameter.';
        }
        
        // prevent text selection
        //tableElement.setAttribute('prevent-text-selection', '');
        
        // define selectedCells getter and setter on the table element itself
        Object.defineProperty(tableElement, 'selectedCells', {
            get: function () {
                return xtag.query(this, '[selected]');
            },
            
            set: function (newValue) {
                var i, len, intIdIndex, arrCells = this.selectedCells, arrRecords, cell_i, cell_len;
                
                // clear old selection
                for (i = 0, len = arrCells.length; i < len; i += 1) {
                    arrCells[i].removeAttribute('selected');
                }
                
                arrCells = xtag.query(this, '[selected-secondary]');
                for (i = 0, len = arrCells.length; i < len; i += 1) {
                    arrCells[i].removeAttribute('selected-secondary');
                }
                
                // if newValue is not an array: make it an array
                if (typeof newValue === 'object' && newValue.length === undefined) {
                    arrCells = [newValue];
                } else {
                    arrCells = newValue;
                }
                
                // set new selection
                for (i = 0, len = arrCells.length; i < len; i += 1) {
                    arrCells[i].setAttribute('selected', '');
                }
                
                arrRecords = this.selectedRecords;
                
                for (i = 0, len = arrRecords.length; i < len; i += 1) {
                    arrCells = arrRecords[i].children;
                    
                    for (cell_i = 0, cell_len = arrCells.length; cell_i < cell_len; cell_i += 1) {
                        if (!arrCells[cell_i].hasAttribute('selected')) {
                            arrCells[cell_i].setAttribute('selected-secondary', '');
                        }
                    }
                }
                
                GS.triggerEvent(this, 'after_selection');
            }
        });
        
        // define selectedRecords getter and setter on the table element itself
        Object.defineProperty(tableElement, 'selectedRecords', {
            get: function () {
                var i, len, intRecordIndex = -1, arrRecord = [], selected = this.selectedCells;
                
                // loop through the selected cells and create an array of trs
                for (i = 0, len = selected.length; i < len; i += 1) {
                    if (selected[i].parentNode.rowIndex > intRecordIndex && selected[i].parentNode.parentNode.nodeName !== 'THEAD') {
                        intRecordIndex = selected[i].parentNode.rowIndex;
                        
                        arrRecord.push(selected[i].parentNode);
                    }
                }
                
                return arrRecord;
            },
            
            set: function (newValue) {
                var i, len, cell_i, cell_len, intIdIndex, arrCells = this.selectedCells, arrRecords, arrCellChildren;
                
                // clear old selection
                for (i = 0, len = arrCells.length; i < len; i += 1) {
                    arrCells[i].removeAttribute('selected');
                }
                
                arrCells = xtag.query(this, '[selected-secondary]');
                for (i = 0, len = arrCells.length; i < len; i += 1) {
                    arrCells[i].removeAttribute('selected-secondary');
                }
                
                // if newValue is not an array: make it an array
                if (typeof newValue === 'object' && newValue.length === undefined) {
                    arrRecords = [newValue];
                } else {
                    arrRecords = newValue;
                }
                
                // set new selection
                for (i = 0, len = arrRecords.length, arrCells = []; i < len; i += 1) {
                    arrCellChildren = arrRecords[i].children;
                    
                    for (cell_i = 0, cell_len = arrCellChildren.length; cell_i < cell_len; cell_i += 1) {
                        arrCells.push(arrCellChildren[cell_i]);
                    }
                }
                
                this.selectedCells = arrCells;
                
                GS.triggerEvent(this, 'after_selection');
            }
        });
        
        // if we are on a touchdevice or bolSingleRecord is true: single record selection
        if (evt.touchDevice || bolSingleRecord === true) {
            tableElement.addEventListener(evt.mousedown, function (event) {
                var target = event.target;
                
                if (target.nodeName === 'TD' || target.nodeName === 'TH' || getCellFromTarget(target)) {
                    tableElement.selectedCells = [];
                    
                    // if there is a parent record to the target: select all of the cells in the record
                    if (GS.findParentTag(target, 'tr')) {
                        tableElement.selectedCells = GS.findParentTag(target, 'tr').children;
                    }
                }
            });
            
        // else: cell/record selection
        } else {
            // mousedown (on selected and unselected) + drag
            //      clear previous selection(s)
            //      select cells from origin cell to current cell
            //
            // shift + mousedown (on selected and unselected) + drag
            //      alter previous selection
            //      select cells from previous origin cell to current cell
            //
            // command + mousedown (on unselected) + drag
            //      maintain previous selection(s)
            //      select cells from origin cell to current cell
            //
            // command + mousedown (on selected) + drag
            //      maintain previous selection(s)
            //      deselect cells from origin cell to current cell
            //
            // collision handling
            //      when colliding with previous selections: dont treat them different
            //
            // copy handling
            //      selection ("X" marks selected cells (imagine all cells contain the letter "a")):
            //          1  2  3  4  5
            //          -------------
            //          a  a  a  a  a
            //          a  X  X  a  a
            //          a  a  X  X  a
            //          a  a  a  a  a
            //
            //      yields ("'" marks an empty cell):
            //          2  3  4 
            //          -------
            //          a  a  ' 
            //          '  a  a 
            
            tableElement.addEventListener(evt.mousedown, function (event) {
                var target = event.target, cellFromTarget = getCellFromTarget(target), closestCell, arrSelectedCells, i, len;
                
                if (GS.findParentTag(event.target, 'table')) {
                    if (cellFromTarget) {
                        closestCell = cellFromTarget;
                    }
                    
                    if (closestCell) {
                        tableElement.dragAllowed = true;
                        tableElement.dragCurrentCell = closestCell;
                        tableElement.selectionSelectedCells = [];
                        
                        // if shift is down and there is a previous origin: use previous origin for current origin
                        if (event.shiftKey && tableElement.selectionPreviousOrigin) {
                            
                            // if there are previously selected cells: deselect the previous selected cells
                            if (tableElement.selectionPreviousSelectedCells) {
                                arrSelectedCells = tableElement.selectedCells;
                                
                                for (i = 0, len = tableElement.selectionPreviousSelectedCells.length; i < len; i += 1) {
                                    arrSelectedCells.splice(arrSelectedCells.indexOf(tableElement.selectionPreviousSelectedCells[i]), 1);
                                }
                                
                                tableElement.selectedCells = arrSelectedCells;
                            }
                            
                            tableElement.dragOrigin = tableElement.selectionPreviousOrigin;
                            tableElement.dragMode = 'select';
                            
                        // else if ctrl or cmd is down and the target cell is not selected: select cells from target cell to current cell
                        } else if (!event.shiftKey && (event.metaKey || event.ctrlKey) && !closestCell.hasAttribute('selected')) {
                            tableElement.dragOrigin = closestCell;
                            tableElement.dragMode = 'select';
                            
                        // else if ctrl or cmd is down and the target cell is selected: deselect cells from target cell to current cell
                        } else if (!event.shiftKey && (event.metaKey || event.ctrlKey) && closestCell.hasAttribute('selected')) {
                            tableElement.dragOrigin = closestCell;
                            tableElement.dragMode = 'deselect';
                            
                        // else: deselect all cells and start new selection
                        } else {
                            tableElement.selectedCells = [];
                            tableElement.dragOrigin = closestCell;
                            tableElement.dragMode = 'select';
                        }
                        
                        selectHandler(tableElement, tableElement.dragOrigin, tableElement.dragCurrentCell, tableElement.dragMode);
                    }
                }
            });
            tableElement.addEventListener(evt.mousemove, function (event) {
                var target, closestCell, cellFromTarget;
                
                // if mouse is down
                if (event.which !== 0) {
                    target = event.target;
                    cellFromTarget = getCellFromTarget(target);
                    
                    if (cellFromTarget) {
                        closestCell = cellFromTarget;
                    }
                    
                    // if selection is allowed at this point and closestCell is different from tableElement.dragCurrentCell
                    if (tableElement.dragAllowed && tableElement.dragCurrentCell !== closestCell) {
                        tableElement.dragCurrentCell = getCellFromTarget(closestCell);
                        selectHandler(tableElement, tableElement.dragOrigin, tableElement.dragCurrentCell, tableElement.dragMode);
                    }
                } else {
                    tableElement.dragAllowed = false;
                    tableElement.selectionPreviousOrigin = tableElement.dragOrigin;
                    tableElement.selectionPreviousSelectedCells = tableElement.selectionSelectedCells;
                }
            });
            tableElement.addEventListener(evt.mouseup, function (event) {
                tableElement.dragAllowed = false;
                
                if (tableElement.dragMode === 'select') {
                    tableElement.selectionPreviousOrigin = tableElement.dragOrigin;
                    tableElement.selectionPreviousSelectedCells = tableElement.selectionSelectedCells;
                }
            });
        }
        
        // add input for clipboard compatibility
        copyElement = document.createElement('input');
        copyElement.value = 'Firefox compatibility input';
        copyElement.setAttribute('gs-dynamic', '');
        copyElement.setAttribute('style', 'position: fixed; left: 50%; top: 50%; z-index: -5000; opacity: 0.00000001;');
        
        tableElement.appendChild(copyElement);
        
        // add tabindex so that we can listen for focus on the table
        tableElement.tabIndex = 0;
        
        // when a focus event happens on the table: focus the copy input if the element that is focused is the table
        tableElement.addEventListener('focus', function (event) {
            if (document.activeElement === tableElement) {
                tableElement.focus();
                GS.setInputSelection(copyElement, 0, 'Firefox compatibility input'.length);
            }
        });
        
        // clipboard handling
        document.body.addEventListener('copy', function (event) {
            var elementClosestTable = GS.findParentTag(document.activeElement, 'table')
              , strTextCopyString, strHTMLCopyString;
            
            if (elementClosestTable === tableElement &&
                (
                    document.activeElement.value === 'Firefox compatibility input' ||
                    document.activeElement.selectionStart === document.activeElement.selectionEnd
                )) {
                GS.setInputSelection(document.activeElement, document.activeElement.value.length,
                                            document.activeElement.value.length);
                
                strTextCopyString = getSelectedCopyText(tableElement);
                strHTMLCopyString = getSelectedCopyHTML(tableElement);
                
                if (strTextCopyString && strHTMLCopyString) {
                    if (handleClipboardData(event, strTextCopyString, 'text')) {
                        event.preventDefault(event);
                    }
                    if (handleClipboardData(event, strHTMLCopyString, 'html')) {
                        event.preventDefault(event);
                    }
                }
                
                GS.setInputSelection(document.activeElement, 0, document.activeElement.value.length);
            }
        });
            //var elementClosestTable = GS.findParentTag(document.activeElement, 'table'), strCopyString,
            //    i, len, cell_i, cell_len, arrSelected, intFromRecord = 9999999, intFromCell = 9999999,
            //    intToRecord = 0, intToCell = 0, strCellText, arrRecords, arrCells, strRecordString;
            //
            //if (elementClosestTable === tableElement &&
            //    (
            //        document.activeElement.value === 'Firefox compatibility input' ||
            //        document.activeElement.selectionStart === document.activeElement.selectionEnd
            //    )) {
            //    arrSelected = tableElement.selectedCells;
            //    
            //    // loop through the selected cells and create a tsv string using the text of the cell
            //    if (arrSelected.length > 0) {
            //        for (i = 0, len = arrSelected.length; i < len; i += 1) {
            //            if (arrSelected[i].parentNode.rowIndex < intFromRecord) {
            //                intFromRecord = arrSelected[i].parentNode.rowIndex;
            //            }
            //            if (arrSelected[i].cellIndex < intFromCell) {
            //                intFromCell = arrSelected[i].cellIndex;
            //            }
            //            if (arrSelected[i].parentNode.rowIndex + 1 > intToRecord) {
            //                intToRecord = arrSelected[i].parentNode.rowIndex + 1;
            //            }
            //            if (arrSelected[i].cellIndex + 1 > intToCell) {
            //                intToCell = arrSelected[i].cellIndex + 1;
            //            }
            //        }
            //        
            //        arrRecords = xtag.query(tableElement, 'tr');
            //        strCopyString = '';
            //        
            //        for (i = intFromRecord, len = intToRecord; i < len; i += 1) {
            //            arrCells = arrRecords[i].children;
            //            
            //            for (cell_i = intFromCell, cell_len = intToCell, strRecordString = ''; cell_i < cell_len; cell_i += 1) {
            //                if (arrCells[cell_i].hasAttribute('selected')) {
            //                    if (arrCells[cell_i].nodeName === 'TH' && arrCells[cell_i].firstElementChild) { 
            //                        strCellText = arrCells[cell_i].firstElementChild.textValue ||
            //                                      arrCells[cell_i].firstElementChild.value ||
            //                                      (arrCells[cell_i].firstElementChild.checked || '').toString() ||
            //                                      arrCells[cell_i].firstElementChild.textContent.trim();
            //                    } else if (arrCells[cell_i].lastElementChild) { 
            //                        strCellText = arrCells[cell_i].lastElementChild.textValue ||
            //                                      arrCells[cell_i].lastElementChild.value ||
            //                                      (arrCells[cell_i].lastElementChild.checked || '').toString() ||
            //                                      arrCells[cell_i].lastElementChild.textContent.trim();
            //                    } else {
            //                        strCellText = arrCells[cell_i].textContent.trim();
            //                    }
            //                } else {
            //                    strCellText = '';
            //                }
            //                
            //                strRecordString += (cell_i !== intFromCell ? '\t' : '') + (strCellText || '');
            //            }
            //            
            //            if (strRecordString.trim()) {
            //                strCopyString += strRecordString;
            //            }
            //            
            //            if (i + 1 !== len && strRecordString.trim()) {
            //                strCopyString += '\r\n';
            //            }
            //        }
            //    }
            //    
            //    if (strCopyString) {
            //        if (handleClipboardData(event, strCopyString)) {
            //            event.preventDefault(event);
            //        }
            //    }
            //}
    };
})();