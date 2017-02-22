
window.addEventListener('design-register-element', function () {
    'use strict';
    
    //registerDesignSnippet('<gs-checkbox>', '<gs-checkbox>', 'gs-checkbox value="0" column="${1:ready_to_ship}">${2}</gs-checkbox>');
    
    designRegisterElement('gs-tutorial', '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-tutorial.html');
    
    window.designElementProperty_GSTUTORIAL = function (selectedElement) {
        addProp('suspend-inserted', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-inserted') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suspend-inserted', this.value === 'true', true);
        });
    };
});

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    
    function closeCurrentPopup(element) {
        var popupElement = element.currentPopup;
        
        // run before-close code if there is any
        if (popupElement.strBeforeClose) {
            new Function(popupElement.strBeforeClose).apply(element);
        }
        
        // remove overlay if there is one
        if (popupElement.relatedOverlay) {
            document.body.removeChild(popupElement.relatedOverlay);
        }
        
        // remove popup element
        document.body.removeChild(popupElement);
    }
    
    function openPopup(element, templateElement, intTemplateNumber, intNumberOfTemplates) {
        var strTargetSelector = (templateElement.getAttribute('target') || '')
          , strDirectionRequest = (templateElement.getAttribute('direction') || 'down')
          , intMaxWidthAttribute = parseInt((templateElement.getAttribute('max-width') || '9999999'), 10)
          , strBeforeOpen = templateElement.getAttribute('before-open')
          , strBeforeClose = templateElement.getAttribute('before-close')
          , strHTML, arrElements, elementTarget, arrTests, popupElement, overlayElement, arrowElement
          , positionHandlingFunction, buttonElement, i, len;
        
        // make the template a copy so that we can alter it safely
        templateElement = templateElement.cloneNode(true);
        
        // run before-open code if there is any
        if (strBeforeOpen) {
            new Function(strBeforeOpen).apply(element);
        }
        
        // get html from template
        strHTML = (templateElement.innerHTML || '');
        
        // add next, previous and skip buttons
        
        // if first and only
        if (intTemplateNumber === 1 && intNumberOfTemplates === 1) {
            strHTML += ml(function () {/*
                            <div class="popup-control-bar">
                                <gs-button class="button-close" inline icononly icon="times"></gs-button>
                            </div>
                        */});
        // if first
        } else if (intTemplateNumber === 1 && intNumberOfTemplates > 1) {
            strHTML += ml(function () {/*
                            <div class="popup-control-bar">
                                <gs-button class="button-right" inline icononly icon="arrow-right" remove-left></gs-button>
                                <gs-button class="button-close" inline icononly icon="times" remove-right></gs-button>
                            </div>
                        */});
        // if middle
        } else if (intTemplateNumber > 1 && intNumberOfTemplates > intTemplateNumber) {
            strHTML += ml(function () {/*
                            <div class="popup-control-bar">
                                <gs-button class="button-right" inline icononly icon="arrow-right" remove-left></gs-button>
                                <gs-button class="button-close" inline icononly icon="times" remove-all></gs-button>
                                <gs-button class="button-left" inline icononly icon="arrow-left" remove-right></gs-button>
                            </div>
                        */});
        // if last
        } else { //if (intNumberOfTemplates === intTemplateNumber) {
            strHTML += ml(function () {/*
                            <div class="popup-control-bar">
                                <gs-button class="button-close" inline icononly icon="times" remove-left></gs-button>
                                <gs-button class="button-left" inline icononly icon="arrow-left" remove-right></gs-button>
                            </div>
                        */});
        }
        
        // if a selector was provided: get the instruction target
        if (strTargetSelector) {
            try {
                arrElements = xtag.toArray(document.querySelectorAll(strTargetSelector));
            } catch (e) {}
            
            arrElements = arrElements || [];
            
            if (arrElements.length > 1) {
                console.warn('gs-tutorial Warning: More than one element matched with selector \'' + strTargetSelector + '\'.');
            }
            
            if (arrElements.length === 0) {
                console.warn('gs-tutorial Warning: No elements matched with selector \'' + strTargetSelector + '\'.');
                
            } else {
                elementTarget = arrElements[0];
            }
        }
        
        // make strDirectionRequest lowercase
        strDirectionRequest.toLowerCase();
        
        // if the direction does not match any valid direction: set direction to down and warn
        if (!strDirectionRequest.match(/^up$|^down$|^left$|^right$/)) {
            console.warn('gs-tutorial Warning: ' +
                                'Direction \'' + strDirectionRequest + '\' not recognized. ' +
                                'Please use \'up\', \'down\', \'left\', \'right\'. Defaulting to \'down\'.');
            strDirectionRequest = 'down';
        }
        
        // order of tests depending direction request
        if (strDirectionRequest === 'up') { // up: up, down, left, right, full
            arrTests = ['up', 'down', 'left', 'right'];
            
        } else if (strDirectionRequest === 'down') { // down: down, up, left, right, full
            arrTests = ['down', 'up', 'left', 'right'];
            
        } else if (strDirectionRequest === 'left') { // left: left, right, down, up, full
            arrTests = ['left', 'right', 'down', 'up'];
            
        } else if (strDirectionRequest === 'right') { // right: right, left, down, up, full
            arrTests = ['right', 'left', 'down', 'up'];
        }
        
        // create popup, overlay and arrow
        popupElement = document.createElement('gs-tutorial-popup');
        
        overlayElement = document.createElement('gs-tutorial-overlay');
        
        arrowElement = document.createElement('div');
        arrowElement.classList.add('connection-arrow');
        
        // append overlay then the popup so that they can have the same z-index and the popup will be over the overlay
        //      the reason why all of the overlays and all of the popups need the same z-index is because say for example
        //      the overlays had a z-index of '1' and the popups had a z-index of '2' if we had two popups open and the
        //      first one was bigger than the second one than you would be able to see the first popup without an overlay
        //      in from of it and potentially you would be able to interact with the first popup without dealing with the
        //      second popup.
        document.body.appendChild(overlayElement);
        document.body.appendChild(popupElement);
        
        // link the popup to it's overlay so that when we close the popup we can also remove the popup overlay
        popupElement.relatedOverlay = overlayElement;
        
        // link the popup to it's before-close so that before we close the popup we can run any code inside the before-close
        popupElement.strBeforeClose = strBeforeClose;
        
        // fill popup
        popupElement.innerHTML = strHTML;
        popupElement.appendChild(arrowElement);
        
        // bind next, previous and skip buttons
        buttonElement = xtag.query(popupElement, '.popup-control-bar > .button-left')[0];
        if (buttonElement) {
            buttonElement.addEventListener('click', function () {
                element.backward();
            });
        }
        
        buttonElement = xtag.query(popupElement, '.popup-control-bar > .button-close')[0];
        if (buttonElement) {
            buttonElement.addEventListener('click', function () {
                element.end();
            });
        }
        
        buttonElement = xtag.query(popupElement, '.popup-control-bar > .button-right')[0];
        if (buttonElement) {
            buttonElement.addEventListener('click', function () {
                element.forward();
            });
        }
        
        // bind the overlay
        overlayElement.addEventListener('click', function () {
            element.forward();
        });
        
        // create a positioning function: this is so that we can refresh the popup's position from several different events
        positionHandlingFunction = function () {
            var intTemp, intMaxWidth, intMaxHeight, intResolvedWidth, intResolvedHeight
              , jsnPositionData, strResolvedDirection, intPopupMidPoint, intElementMidPoint
              , intMargin = 10, intArrow = 5, intPopupTop, intPopupLeft, intArrowLeft, intArrowTop;
            
            // if the dialog is not in the DOM: unbind and skip the contents of the function using return
            if (popupElement.parentNode !== document.body) {
                window.removeEventListener('resize', positionHandlingFunction);
                window.removeEventListener('orientationchange', positionHandlingFunction);
                return;
            }
            
            // save scroll numbers
            popupElement.oldScrollTop = popupElement.scrollTop;
            popupElement.oldScrollLeft = popupElement.scrollLeft;
            
            // clear arrow direction
            popupElement.classList.remove('up');
            popupElement.classList.remove('down');
            popupElement.classList.remove('left');
            popupElement.classList.remove('right');
            
            // clear popup and arrow css
            popupElement.setAttribute('style', '');
            arrowElement.setAttribute('style', '');
            
            // find the closest balance of width and height (using the window width as a max width)
            if ((popupElement.offsetHeight + popupElement.offsetWidth) < 300) {
                intTemp = 300;
            } else {
                intTemp = ((popupElement.offsetHeight + popupElement.offsetWidth) / 2);
            }
            intMaxWidth = (intTemp < window.innerWidth ? intTemp : window.innerWidth - (intMargin * 2));
            
            if (intMaxWidth > intMaxWidthAttribute) {
                intMaxWidth = intMaxWidthAttribute;
            }
            
            // find the maximum height (must be less than half on touch devices and less than a third on everything else)
            if (evt.touchDevice) {
                intMaxHeight = Math.floor(window.innerHeight / 2) - (intMargin * 2);
                
            } else {
                intMaxHeight = Math.floor(window.innerHeight / 3) - (intMargin * 2);
            }
            
            // apply calculated max dimensions
            popupElement.style.maxWidth = intMaxWidth + 'px';
            popupElement.style.maxHeight = intMaxHeight + 'px';
            
            // get resolved dimensions
            intResolvedWidth = popupElement.offsetWidth;
            intResolvedHeight = popupElement.offsetHeight;
            
            // if there is a target: run through tests
            if (elementTarget) {
                // get target position data
                jsnPositionData = GS.getElementPositionData(elementTarget);
                
                //console.log(intResolvedHeight,
                //            intResolvedWidth,
                //            jsnPositionData.intRoomAbove,
                //            jsnPositionData.intRoomBelow,
                //            jsnPositionData.intRoomLeft,
                //            jsnPositionData.intRoomRight);
                
                // up: compare room above to popup resolved height
                //      pass: display
                //      fail: next test
                for (i = 0, len = arrTests.length; i < len; i += 1) {
                    if ((arrTests[i] ===    'up' && (intResolvedHeight + intMargin + intArrow) <= jsnPositionData.intRoomAbove) ||
                        (arrTests[i] ===  'down' && (intResolvedHeight + intMargin + intArrow) <= jsnPositionData.intRoomBelow) ||
                        (arrTests[i] ===  'left' && ( intResolvedWidth + intMargin + intArrow) <= jsnPositionData.intRoomLeft) ||
                        (arrTests[i] === 'right' && ( intResolvedWidth + intMargin + intArrow) <= jsnPositionData.intRoomRight)) {
                        strResolvedDirection = arrTests[i];
                        break;
                    }
                }
                
                // if we could not resolve to a particular direction: position in the middle
                strResolvedDirection = strResolvedDirection || 'middle';
                
            // else: center on screen
            } else {
                strResolvedDirection = 'middle';
            }
            
            //console.log(strDirectionRequest, strResolvedDirection);
            
            // if up or down: get as close to horizontally centered on the element as possible
            if (strResolvedDirection === 'up' || strResolvedDirection === 'down') {
                intElementMidPoint = (jsnPositionData.intElementLeft + (jsnPositionData.intElementWidth / 2));
                intPopupMidPoint = (intResolvedWidth / 2);
                //console.log(intElementMidPoint, jsnPositionData.left, jsnPositionData.intElementWidth);
                
                // if centered goes past intMargin of the left edge of the screen: go to intMargin from the bottom
                if (intElementMidPoint - intPopupMidPoint < intMargin) {
                    intPopupLeft = intMargin;
                    
                    //console.log('1***', intMargin);
                    
                // else if centered goes past intMargin of the right edge of the screen: go to intMargin less than the width of the viewport
                } else if (intElementMidPoint + intPopupMidPoint > window.innerWidth - intMargin) {
                    intPopupLeft = ((window.innerWidth - intResolvedWidth) - intMargin);
                    //console.log('2***', window.innerWidth, intResolvedWidth, intMargin);
                    
                // else centered does not go past intMargin of either edge of the screen: center
                } else {
                    intPopupLeft = (intElementMidPoint - intPopupMidPoint);
                    //console.log('3***', intElementMidPoint, intPopupMidPoint, (intElementMidPoint - intPopupMidPoint) + 'px');
                }
                
                // move the arrow to be pointing at the midopoint of the target
                intArrowLeft = (intElementMidPoint - intPopupLeft);
                
                // if the midpoint of the target is really close the left of the screen: add extreme-left class to the popup
                //console.log(intElementMidPoint, intMargin, intArrow);
                if (intElementMidPoint <= (intMargin + Math.round(intArrow / 2) + 5)) {
                    popupElement.classList.add('extreme-left');
                }
                
                // if the midpoint of the target is really close the right of the screen: add extreme-right class to the popup
                //console.log(intElementMidPoint, window.innerWidth, intMargin, Math.round(intArrow / 2));
                if (intElementMidPoint >= (((window.innerWidth - intMargin) - Math.round(intArrow / 2)) - 5)) {
                    popupElement.classList.add('extreme-right');
                }
                
            // else if left or right: get as close to vertically centered next to the element as possible
            } else if (strResolvedDirection === 'left' || strResolvedDirection === 'right') {
                intElementMidPoint = (jsnPositionData.intElementTop + (jsnPositionData.intElementHeight / 2));
                intPopupMidPoint = (intResolvedHeight / 2);
                
                //console.log('0***', intElementMidPoint, intPopupMidPoint, window.innerHeight, intMargin, intDialogResolvedHeight);
                
                // if centered goes past intMargin of the top edge of the screen: go to intMargin from the bottom
                if (intElementMidPoint - intPopupMidPoint < intMargin) {
                    intPopupTop = intMargin;
                    //console.log('1***', intMargin);
                    
                // else if centered goes past intMargin of the bottom edge of the screen: go to intMargin less than the height of the viewport
                } else if (intElementMidPoint + intPopupMidPoint > window.innerHeight - intMargin) {
                    intPopupTop = ((window.innerHeight - intResolvedHeight) - intMargin);
                    //console.log('2***', window.innerHeight, intResolvedHeight, intMargin);
                    
                // else centered does not go past intMargin of either edge of the screen: center
                } else {
                    intPopupTop = (intElementMidPoint - intPopupMidPoint);
                    //console.log('3***', intElementMidPoint, intPopupMidPoint, (intElementMidPoint - intPopupMidPoint) + 'px');
                }
                
                intArrowTop = (intElementMidPoint - intPopupTop);
                
                // if the midpoint of the target is really close the left of the screen: add extreme-left class to the popup
                if (intElementMidPoint <= (intMargin + Math.round(intArrow / 2) + 5)) {
                    popupElement.classList.add('extreme-up');
                }
                
                // if the midpoint of the target is really close the right of the screen: add extreme-right class to the popup
                if (intElementMidPoint >= (((window.innerHeight - intMargin) - Math.round(intArrow / 2)) - 5)) {
                    popupElement.classList.add('extreme-down');
                }
                
            // else full: use dialog logic to get width and height and center both vertically and horizontally
            } else {
                intPopupTop = (window.innerHeight / 2) - (intResolvedHeight / 2);
                intPopupLeft = (window.innerWidth / 2) - (intResolvedWidth / 2);
            }
            
            // if direction is up: connect the bottom of the dialog to the top of the element
            if (strResolvedDirection === 'up') {
                intPopupTop = (jsnPositionData.intElementTop - intResolvedHeight) - intArrow;
                
            // if direction is down: connect the top of the dialog to the bottom of the element
            } else if (strResolvedDirection === 'down') {
                intPopupTop = (jsnPositionData.intElementTop + jsnPositionData.intElementHeight) + intArrow;
                
            // if direction is left: connect the right of the dialog to the left of the element
            } else if (strResolvedDirection === 'left') {
                intPopupLeft = (jsnPositionData.intElementLeft - intResolvedWidth) - intArrow;
                
            // if direction is right: connect the left of the dialog to the right of the element
            } else if (strResolvedDirection === 'right') {
                intPopupLeft = (jsnPositionData.intElementLeft + jsnPositionData.intElementWidth) + intArrow;
            }
            
            // prevent the dialog from vertically going outside the viewport
            if (intPopupTop + intResolvedWidth > window.innerHeight) {
                intPopupTop -= (intPopupTop + intResolvedWidth) - window.innerHeight;
            }
            
            // prevent the dialog from horizontally going outside the viewport
            if (intPopupLeft + intResolvedWidth > window.innerWidth) {
                intPopupLeft -= (intPopupLeft + intResolvedWidth) - window.innerWidth;
            }
            
            // apply CSS to the popup
            //console.log(intPopupTop, intPopupLeft);
            popupElement.style.top  = intPopupTop + 'px';
            popupElement.style.left = intPopupLeft + 'px';
            
            // handle arrow
            if (strResolvedDirection !== 'middle') {
                popupElement.classList.add(strResolvedDirection);
                
                // apply CSS to the arrow
                if (intArrowLeft) {
                    arrowElement.style.left = intArrowLeft + 'px';
                }
                if (intArrowTop) {
                    arrowElement.style.top = intArrowTop + 'px';
                }
            }
        };
        
        // run position handling function and bind to run it every window resize or re-orientation
        positionHandlingFunction();
        window.addEventListener('resize', positionHandlingFunction);
        window.addEventListener('orientationchange', positionHandlingFunction);
        
        element.currentPopup = popupElement;
    }
    
    
    // this runs code on the first inserted lifecycle call
    function elementInserted(element) {
        
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                
            }
        }
    }
    
    xtag.register('gs-tutorial', {
        lifecycle: {
            inserted: function () {
                elementInserted(this);
            },
            
            attributeChanged: function (strAttrName, oldValue, newValue) {
                // if "suspend-inserted" or "suspend-created" has been removed: run inserted code
                if ((strAttrName === 'suspend-created' || strAttrName === 'suspend-created') && newValue === null) {
                    elementInserted(this);
                    
                } else if (!this.hasAttribute('suspend-created') && !this.hasAttribute('suspend-inserted')) {
                    // attribute code
                }
            }
        },
        events: {},
        accessors: {},
        methods: {
            'start': function () {
                var strBeforeStart = this.getAttribute('before-start'),
                    arrElement = xtag.queryChildren(this, 'template');
                
                // if there are no templates: warning
                if (arrElement.length === 0) {
                    console.warn('gs-tutorial Warning: No popup templates provided.' +
                                    ' Please consult the documention if you need info on how to use the gs-tutorial element.');
                    
                // if there are non-template children: warning
                } else if (this.children.length !== arrElement.length) {
                    console.warn('gs-tutorial Warning: Invalid element' + ((this.children.length - arrElement.length) === 1 ? '' : 's') + '.' +
                                    ' The gs-tutorial element only accepts template elements for it\'s children.');
                }
                
                // read first template
                this.currentIndex = 0;
                if (arrElement[this.currentIndex]) {
                    if (strBeforeStart) {
                        new Function(strBeforeStart).apply(this);
                    }
                    
                    openPopup(this, arrElement[this.currentIndex], (this.currentIndex + 1), arrElement.length);
                }
            },
            
            'end': function () {
                var strBeforeEnd = this.getAttribute('before-end');
                
                if (strBeforeEnd) {
                    new Function(strBeforeEnd).apply(this);
                }
                
                if (this.currentPopup) {
                    closeCurrentPopup(this);
                }
            },
            
            'forward': function () {
                var arrElement = xtag.queryChildren(this, 'template');
                
                this.currentIndex += 1;
                if (arrElement[this.currentIndex]) {
                    if (this.currentPopup) {
                        closeCurrentPopup(this);
                    }
                    
                    openPopup(this, arrElement[this.currentIndex], (this.currentIndex + 1), arrElement.length);
                } else {
                    this.end();
                }
            },
            
            'backward': function () {
                var arrElement = xtag.queryChildren(this, 'template');
                
                if (this.currentPopup) {
                    closeCurrentPopup(this);
                }
                
                this.currentIndex -= 1;
                if (arrElement[this.currentIndex]) {
                    if (this.currentPopup) {
                        closeCurrentPopup(this);
                    }
                    
                    openPopup(this, arrElement[this.currentIndex], (this.currentIndex + 1), arrElement.length);
                }
            },
            
            'reposition': function () {
                
            }
        }
    });
});