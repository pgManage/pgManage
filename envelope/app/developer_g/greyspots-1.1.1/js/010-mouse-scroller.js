
window.addEventListener('design-register-element', function () {
    'use strict';
    
    registerDesignSnippet('<gs-scroller>', '<gs-scroller>', 'gs-scroller>\n' +
                                                        '    <gs-scroller-inner style="width: ${1:1000px}; height: ${2:1000px};">\n' +
                                                        '        ${0}\n' +
                                                        '    </gs-scroller-inner>\n' +
                                                        '</gs-scroller>');
    
    designRegisterElement('gs-scroller', (location.pathname.indexOf('/v1/') === 0 ? '/v1/dev/' : '/env/app/') + 'developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-scroller.html');
    
    window.designElementProperty_GSSCROLLER = function (selectedElement) {
        // TITLE attribute
        addProp('Title', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('title') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'title', this.value);
        });
        
        // SUSPEND-INSERTED attribute
        addProp('suspend-inserted', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-inserted') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suspend-inserted', this.value === 'true', true);
        });
        
        // visibility attributes
        strVisibilityAttribute = '';
        if (selectedElement.hasAttribute('hidden'))                   { strVisibilityAttribute = 'hidden'; }
        if (selectedElement.hasAttribute('hide-on-desktop'))  { strVisibilityAttribute = 'hide-on-desktop'; }
        if (selectedElement.hasAttribute('hide-on-tablet'))   { strVisibilityAttribute = 'hide-on-tablet'; }
        if (selectedElement.hasAttribute('hide-on-phone'))    { strVisibilityAttribute = 'hide-on-phone'; }
        if (selectedElement.hasAttribute('show-on-desktop'))   { strVisibilityAttribute = 'show-on-desktop'; }
        if (selectedElement.hasAttribute('show-on-tablet'))    { strVisibilityAttribute = 'show-on-tablet'; }
        if (selectedElement.hasAttribute('show-on-phone'))     { strVisibilityAttribute = 'show-on-phone'; }
        
        addProp('Visibility', true, '<gs-select class="target" value="' + strVisibilityAttribute + '" mini>' +
                                        '<option value="">Visible</option>' +
                                        '<option value="hidden">Invisible</option>' +
                                        '<option value="hide-on-desktop">Invisible at desktop size</option>' +
                                        '<option value="hide-on-tablet">Invisible at tablet size</option>' +
                                        '<option value="hide-on-phone">Invisible at phone size</option>' +
                                        '<option value="show-on-desktop">Visible at desktop size</option>' +
                                        '<option value="show-on-tablet">Visible at tablet size</option>' +
                                        '<option value="show-on-phone">Visible at phone size</option>' +
                                    '</gs-select>', function () {
            selectedElement.removeAttribute('hidden');
            selectedElement.removeAttribute('hide-on-desktop');
            selectedElement.removeAttribute('hide-on-tablet');
            selectedElement.removeAttribute('hide-on-phone');
            selectedElement.removeAttribute('show-on-desktop');
            selectedElement.removeAttribute('show-on-tablet');
            selectedElement.removeAttribute('show-on-phone');
            
            if (this.value) {
                selectedElement.setAttribute(this.value, '');
            }
            
            return selectedElement;
        });
    };
});


Math.easeOutQuad = function (current_time, start_value, end_change, end_time) {
    'use strict';
    // Quadratic equation (produced by Robert Penner (www.robertpenner.com))
    current_time /= end_time;
    return -end_change * current_time * (current_time - 2) + start_value;
};

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    
    // using element, direction and X delta: move element using quadratic equation
    function easeOutX(dragElement, target, bolRight, intXDelta, intervalEaseXID) {
        var intFrames = Math.ceil(intXDelta / 0.25), intFrame = 0, intInterval = 20
          , intTotalTime = (intFrames * intInterval);
        
        //console.log(bolRight, intXDelta);
        
        if (intXDelta > 5) {
            intervalEaseXID = setInterval(function () {
                var intLeft;
                
                if (intFrame < intFrames) {
                    intLeft = parseInt(dragElement.style.left, 10);
                    
                    if (bolRight) {
                        intLeft = intLeft - Math.easeOutQuad((intFrame * intInterval), intXDelta, -intXDelta, intTotalTime);
                    } else {
                        intLeft = intLeft + Math.easeOutQuad((intFrame * intInterval), intXDelta, -intXDelta, intTotalTime);
                    }
                    
                    setElementLeft(dragElement, target, intLeft);
                } else {
                    clearTimeout(intervalEaseXID);
                }
                
                intFrame += 1;
            }, intInterval);
        }
        return intervalEaseXID;
    }
    
    // using element, direction and Y delta: move element using quadratic equation
    function easeOutY(dragElement, target, bolBottom, intYDelta, intervalEaseYID) {
        var intFrames = Math.ceil(intYDelta / 0.25), intFrame = 0, intInterval = 20
          , intTotalTime = (intFrames * intInterval);
        
        if (intYDelta > 5) {
            intervalEaseYID = setInterval(function () {
                var intTop;
                
                if (intFrame < intFrames) {
                    intTop = parseInt(dragElement.style.top, 10);
                    
                    if (bolBottom) {
                        intTop = intTop - Math.easeOutQuad((intFrame * intInterval), intYDelta, -intYDelta, intTotalTime);
                    } else {
                        intTop = intTop + Math.easeOutQuad((intFrame * intInterval), intYDelta, -intYDelta, intTotalTime);
                    }
                    
                    setElementTop(dragElement, target, intTop);
                } else {
                    clearTimeout(intervalEaseYID);
                }
                
                intFrame += 1;
            }, intInterval);
        }
        return intervalEaseYID;
    }
    
    // set left and respect boundries
    function setElementLeft(dragElement, target, intLeft) {
        var intWidth = dragElement.offsetWidth, minRight = target.offsetWidth;
        
        // target right edge must never get < container right edge
        if ((intLeft + intWidth) < minRight) {
            intLeft = (minRight - intWidth);
        }
        
        // target left edge must never get > container left edge
        if (intLeft > 0) {
            intLeft = 0;
        }
        
        dragElement.style.left = intLeft + 'px';
    }
    
    // set top and respect boundries
    function setElementTop(dragElement, target, intTop) {
        var intHeight = dragElement.offsetHeight, minBottom = target.offsetHeight;
        
        // target bottom edge must never get < container bottom edge
        if ((intTop + intHeight) < minBottom) {
            intTop = (minBottom - intHeight);
        }
        
        // target top edge must never get > container top edge
        if (intTop > 0) {
            intTop = 0;
        }
        
        dragElement.style.top = intTop + 'px';
    }
    
    function handleVerticalBoundries(dragElement, target) {
        var intTop = parseFloat(dragElement.style.top)
          , intHeight = dragElement.offsetHeight
          , minBottom = target.offsetHeight;
        
        // target bottom edge must never get < container bottom edge
        if ((intTop + intHeight) < minBottom) {
            intTop = (minBottom - intHeight);
        }
        
        // target top edge must never get > container top edge
        if (intTop > 0) {
            intTop = 0;
        }
        
        dragElement.style.top = intTop + 'px';
    }
    
    function handleHorizontalBoundries(dragElement, target) {
        var intLeft = parseFloat(dragElement.style.left)
          , intWidth = dragElement.offsetWidth
          , minRight = target.offsetWidth;
        
        // target right edge must never get < container right edge
        if ((intLeft + intWidth) < minRight) {
            intLeft = (minRight - intWidth);
        }
        
        // target left edge must never get > container left edge
        if (intLeft > 0) {
            intLeft = 0;
        }
        
        dragElement.style.left = intLeft + 'px';
    }
    
    function bindEvents(element) {
        var target = element, dragElement = element.children[0], intervalEaseXID
          , intervalEaseYID, lastClearTime, intScrollDelta = 0, minZoom = 0.5
          , maxZoom = 6;
        
        // zoom with mousewheel
        target.addEventListener('wheel', function (event) {
            var intDelta = event.deltaY, intNewZoom, currentTime
              , jsnMousePosition = GS.mousePosition(event), mouseEMX, mouseEMY, mousePXX, mousePXY
              , jsnOffsets = GS.getElementOffset(dragElement)
              , jsnTargetOffset
              , intCurrentZoom = (parseFloat(dragElement.style.fontSize) || 1)
              , intOldHeight = dragElement.offsetHeight
              , intOldWidth = dragElement.offsetWidth
              , intNewHeight, intNewWidth, intWidthDifference, intHeightDifference
              , intRelativeX, intRelativeY, intPercentX, intPercentY;
            
            event.preventDefault();
            event.stopPropagation();
            
            // get mouse position over dragElement in ems
            mousePXY = (jsnMousePosition.y - jsnOffsets.top);
            mousePXX = (jsnMousePosition.x - jsnOffsets.left);
            
            mouseEMY = GS.pxToEm(dragElement, mousePXY);
            mouseEMX = GS.pxToEm(dragElement, mousePXX);
            //console.log(jsnOffsets.top, jsnMousePosition.y, mouseEMY);
            //console.log(jsnOffsets.left, jsnMousePosition.x, mouseEMX);
            
            //console.log(event, event.deltaY, intDelta);
            if (lastClearTime) {
                currentTime = new Date().getTime();
                
                //console.log(currentTime - lastClearTime);
                if ((currentTime - lastClearTime) > 200) {
                    intScrollDelta = 0;
                    lastClearTime = new Date().getTime();
                }
            }
            
            // need to add clear if change direction
            
            lastClearTime = new Date().getTime();
            
            // if negative delta: increase custom delta by 0.1
            //      (unless we're at the maximum zoom, in which case: reset the delta)
            if (intDelta < 0) {
                intScrollDelta = (intScrollDelta > 0 ? intScrollDelta : 0);
                intScrollDelta = 0.05;
                if (intCurrentZoom < maxZoom) {
                    intScrollDelta += 0.05;
                } else {
                    intScrollDelta = 0;
                }
                
            // if positive delta: decrease custom delta by 0.1
            //      (unless we're at the minimum zoom, in which case: reset the delta)
            } else {
                intScrollDelta = (intScrollDelta < 0 ? intScrollDelta : 0);
                intScrollDelta = -0.05;
                if (intCurrentZoom > minZoom) {
                    intScrollDelta -= 0.05;
                } else {
                    intScrollDelta = 0;
                }
            }
            
            // add new delta to current zoom
            intNewZoom = (intCurrentZoom + intScrollDelta);
            
            // if the new zoom is above 6em: cap it off at 6em
            intNewZoom = (intNewZoom > maxZoom ? maxZoom : intNewZoom);
            
            // if the new zoom is below minZoom: cap it off at minZoom
            intNewZoom = (intNewZoom < minZoom ? minZoom : intNewZoom);
            
            //console.log('1:' + intNewZoom, '2:' + intScrollDelta, '3:' + intCurrentZoom);
            
            // apply new zoom
            dragElement.style.fontSize = intNewZoom + 'em';
            
            if (intCurrentZoom !== intNewZoom) {
                // get new height
                intNewWidth = dragElement.offsetWidth;
                intNewHeight = dragElement.offsetHeight;
                
                // adjust to mouse position
                
                // get full height difference
                intWidthDifference = (intNewWidth - intOldWidth);
                intHeightDifference = (intNewHeight - intOldHeight);
                
                // get relative x and y
                jsnTargetOffset = GS.getElementOffset(dragElement);
                intRelativeX = (jsnMousePosition.x - jsnTargetOffset.left);
                intRelativeY = (jsnMousePosition.y - jsnTargetOffset.top);
                
                // get percentage of x and y
                intPercentX = ((intRelativeX / intOldWidth) * 100);
                intPercentY = ((intRelativeY / intOldHeight) * 100);
                
                //console.log(intNewWidth, intOldWidth, intWidthDifference, intRelativeX, intPercentX);
                //console.log(intNewHeight, intOldHeight, intHeightDifference, intRelativeY, intPercentY);
                
                // percentage of height difference
                dragElement.style.left = (parseFloat(dragElement.style.left || '0') - ((intWidthDifference / 100) * intPercentX)) + 'px';
                dragElement.style.top = (parseFloat(dragElement.style.top || '0') - ((intHeightDifference / 100) * intPercentY)) + 'px';
            }
            
            // handle boundries
            handleVerticalBoundries(dragElement, target);
            handleHorizontalBoundries(dragElement, target);
        });
        
        // scrolling by dragging
        target.addEventListener(evt.mousedown, function (event) {
            var jsnMousePosition = GS.mousePosition(event)
              , jsnTargetOffsets = GS.getElementOffset(target)
              , jsnOffsets = GS.getElementOffset(dragElement)
              , startX = jsnMousePosition.x
              , startY = jsnMousePosition.y
              , offsetX = jsnOffsets.left - jsnTargetOffsets.left
              , offsetY = jsnOffsets.top - jsnTargetOffsets.top
              , lastX = 0, lastY = 0, currentX = 0, currentY = 0
              , deltaX, deltaY
              , mousemoveHandler, mouseupHandler;
            
            // stop text selection
            event.preventDefault();
            
            // stop easing functions
            clearTimeout(intervalEaseXID);
            clearTimeout(intervalEaseYID);
            
            // add "down" class
            dragElement.classList.add('down');
            
            mousemoveHandler = function (event) {
                var jsnMousePosition;
                
                if (event.which === 0 && !evt.touchDevice) {
                    mouseupHandler(event);
                    
                } else {
                    // handle move
                    jsnMousePosition = GS.mousePosition(event);
                    
                    // saving the current postition and the previous position for calculating the delta
                    lastX = currentX;
                    lastY = currentY;
                    currentX = jsnMousePosition.x;// - jsnTargetOffsets.left;
                    currentY = jsnMousePosition.y;// - jsnTargetOffsets.top;
                    
                    // moving element
                    //console.log(offsetX, currentX, startX);//, jsnTargetOffsets.left);
                    //console.log(offsetY, currentY, startY);//, jsnTargetOffsets.top);
                    setElementLeft(dragElement, target, (offsetX + (currentX - startX)));
                    setElementTop(dragElement, target, (offsetY + (currentY - startY)));
                    
                    event.preventDefault();
                }
            };
            
            mouseupHandler = function (event) {
                // calculate delta
                deltaX = lastX - currentX;
                deltaY = lastY - currentY;
                
                // ease out
                intervalEaseXID = easeOutX(dragElement, target, (deltaX > 0), Math.abs(deltaX), intervalEaseXID);
                intervalEaseYID = easeOutY(dragElement, target, (deltaY > 0), Math.abs(deltaY), intervalEaseYID);
                
                // remove "down" class
                dragElement.classList.remove('down');
                
                // unbind mousemove and mouseup
                document.body.removeEventListener(evt.mousemove, mousemoveHandler);
                document.body.removeEventListener(evt.mouseup, mouseupHandler);
            };
            
            document.body.addEventListener(evt.mousemove, mousemoveHandler);
            document.body.addEventListener(evt.mouseup, mouseupHandler);
        });
    }
    
    
    // dont do anything that modifies the element here
    function elementCreated(element) {
        // if "created" hasn't been suspended: run created code
        if (!element.hasAttribute('suspend-created')) {
            
        }
    }
    
    //
    function elementInserted(element) {
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                
                if (element.children.length > 1) {
                    throw 'gs-scroller Error: Too many children. gs-scroller elements must have one child and it must be a <gs-scroller-inner> element.';
                    
                } else if (element.children.length === 0) {
                    throw 'gs-scroller Error: No children. gs-scroller elements must have one child and it must be a <gs-scroller-inner> element.';
                    
                } else if (element.children[0].nodeName !== 'GS-SCROLLER-INNER') {
                    throw 'gs-scroller Error: Invalid child. gs-scroller elements must have one child and it must be a <gs-scroller-inner> element.';
                }
                
                // if we're not on a touch device: bind events and set the title text
                if (!evt.touchDevice) {
                    // bind events
                    bindEvents(element);
                    
                    // title text
                    element.children[0].setAttribute('title', 'Click and drag to move around, scroll to zoom.');
                    
                // else: make the element scrollable
                } else {
                    element.classList.add('scrollable');
                }
            }
        }
    }
    
    xtag.register('gs-scroller-inner', {});
    xtag.register('gs-scroller', {
        lifecycle: {
            created: function () {
                elementCreated(this);
            },
            
            inserted: function () {
                elementInserted(this);
            },
            
            attributeChanged: function (strAttrName, oldValue, newValue) {
                // if "suspend-created" has been removed: run created and inserted code
                if (strAttrName === 'suspend-created' && newValue === null) {
                    elementCreated(this);
                    elementInserted(this);
                    
                // if "suspend-inserted" has been removed: run inserted code
                } else if (strAttrName === 'suspend-inserted' && newValue === null) {
                    elementInserted(this);
                    
                } else if (!this.hasAttribute('suspend-created') && !this.hasAttribute('suspend-inserted')) {
                    
                }
            }
        },
        events: {},
        accessors: {},
        methods: {}
    });
});