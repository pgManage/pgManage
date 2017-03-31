
window.addEventListener('design-register-element', function () {
    'use strict';

    registerDesignSnippet('<gs-sticky>', '<gs-sticky>', 'gs-sticky>\n' +
                                                        '    <gs-sticky-inner>\n' +
                                                        '        ${0}\n' +
                                                        '    </gs-sticky-inner>\n' +
                                                        '</gs-sticky>');
    
    designRegisterElement('gs-sticky', '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-sticky.html');

    window.designElementProperty_GSSTICKY = function (selectedElement) {
        addProp('Direction', true,  '<gs-select class="target" value="' + encodeHTML(selectedElement.getAttribute('direction') || '') + '" mini>' +
                                        '<option value="">Up</option>' +
                                        '<option value="down">Down</option>' +
                                    '</gs-select>',
                                    function () {
            return setOrRemoveTextAttribute(selectedElement, 'direction', this.value);
        });

        addProp('Always Stuck', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('stuck') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'stuck', this.value === 'true', true);
        });

        addProp('Touch Devices Allowed', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('touch-device-allowed') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'touch-device-allowed', this.value === 'true', true);
        });

        // TITLE attribute
        addProp('Title', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('title') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'title', this.value);
        });

        // SUSPEND-INSERTED attribute
        addProp('suspend-inserted', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-inserted') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suspend-inserted', this.value === 'true', true);
        });

        // visibility attributes
        var strVisibilityAttribute = '';
        if (selectedElement.hasAttribute('hidden')) {
            strVisibilityAttribute = 'hidden';
        }
        if (selectedElement.hasAttribute('hide-on-desktop')) {
            strVisibilityAttribute = 'hide-on-desktop';
        }
        if (selectedElement.hasAttribute('hide-on-tablet')) {
            strVisibilityAttribute = 'hide-on-tablet';
        }
        if (selectedElement.hasAttribute('hide-on-phone')) {
            strVisibilityAttribute = 'hide-on-phone';
        }
        if (selectedElement.hasAttribute('show-on-desktop')) {
            strVisibilityAttribute = 'show-on-desktop';
        }
        if (selectedElement.hasAttribute('show-on-tablet')) {
            strVisibilityAttribute = 'show-on-tablet';
        }
        if (selectedElement.hasAttribute('show-on-phone')) {
            strVisibilityAttribute = 'show-on-phone';
        }

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
        
        //addFlexContainerProps(selectedElement);
        addFlexProps(selectedElement);
    };
});

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    function stickHandler(element) {
        var bolTop = (element.getAttribute('direction') !== 'down'),
            intScrollPosition = document.body.scrollTop,
            jsnElementPositionData = GS.getElementPositionData(element),
            bolShouldBeStuck = (bolTop && jsnElementPositionData.intRoomAbove < 0) || (!bolTop && jsnElementPositionData.intRoomBelow < 0);
        
        if (bolShouldBeStuck && !element.hasAttribute('stuck')) {
            element.style.height = element.offsetHeight + 'px';
            element.setAttribute('stuck', '');
            
            //if (bolTop) {
            //    element.parentNode.style.paddingTop = element.offsetHeight + 'px';
            //} else {
            //    element.parentNode.style.paddingBottom = element.offsetHeight + 'px';
            //}
            
        } else if (!bolShouldBeStuck && element.hasAttribute('stuck')) {
            element.style.height = '';
            element.removeAttribute('stuck');
            //
            //if (bolTop) {
            //    element.parentNode.style.paddingTop = '';
            //} else {
            //    element.parentNode.style.paddingBottom = '';
            //}
        }
        
        //console.log(bolTop, intScrollPosition, jsnElementPositionData);
    }
    
    // dont do anything that modifies the element here
    function elementCreated(element) {
        // if "created" hasn't been suspended: run created code
        if (!element.hasAttribute('suspend-created')) {
            
        }
    }
    
    //
    function elementInserted(element) {
        var currentParent;
        
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                
                if (element.children.length > 1) {
                    throw 'gs-sticky Error: Too many children. gs-sticky elements must have one child and it must be a <gs-sticky-inner> element.';
                    
                } else if (element.children.length === 0) {
                    throw 'gs-sticky Error: No children. gs-sticky elements must have one child and it must be a <gs-sticky-inner> element.';
                    
                } else if (element.children[0].nodeName !== 'GS-STICKY-INNER') {
                    throw 'gs-sticky Error: Invalid child. gs-sticky elements must have one child and it must be a <gs-sticky-inner> element.';
                }
                
                element.parentNode.style.height = 'auto';
                
                if (element.hasAttribute('stuck')) {
                    //console.log(element.children[0].offsetHeight, element.getAttribute('direction'));
                    if (element.getAttribute('direction') !== 'down') {
                        element.parentNode.style.paddingTop = element.children[0].offsetHeight + 'px';
                    } else {
                        element.parentNode.style.paddingBottom = element.children[0].offsetHeight + 'px';
                    }
                }
                
                if (!element.hasAttribute('stuck') && (!evt.touchDevice || element.hasAttribute('touch-device-allowed'))) {
                    stickHandler(element);
                    currentParent = element.parentNode;
                    if (currentParent.nodeName !== 'BODY') {
                        console.warn('gs-sticky Warning: Element not immediate child of BODY. This element was designed for being an immediate child of the BODY, doing otherwise may give unexpected results.');
                    }
                    
                    window.addEventListener('resize', function () {
                        if (element.parentNode === currentParent) {
                            stickHandler(element);
                        }
                    });
                    
                    window.addEventListener('scroll', function () {
                        if (element.parentNode === currentParent) {
                            stickHandler(element);
                        }
                    });
                    
                    window.addEventListener('orientationchange', function () {
                        if (element.parentNode === currentParent) {
                            stickHandler(element);
                        }
                    });
                }
            }
        }
    }
    
    xtag.register('gs-sticky-inner', {});
    xtag.register('gs-sticky', {
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