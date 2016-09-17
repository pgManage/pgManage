window.addEventListener('design-register-element', function () {
    registerDesignSnippet('<gs-select>', '<gs-select>', 'gs-select>\n' +
                                                        '    <option>${0}</option>\n' +
                                                        '</gs-select>');
    
    designRegisterElement('gs-select', (location.pathname.indexOf('/v1/') === 0 ? '/v1/dev/' : '/env/app/') + 'developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-select.html');
    
    window.designElementProperty_GSSELECT = function(selectedElement) {
        addProp('Column', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('column') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'column', this.value);
        });
        
        addProp('Value', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('value') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'value', this.value);
        });
        
        addProp('Mini', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('mini')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'mini', (this.value === 'true'), true);
        });
        
        addProp('Title', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('title') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'title', this.value);
        });
        
        addProp('Tabindex', true, '<gs-number class="target" value="' + encodeHTML(selectedElement.getAttribute('tabindex') || '') + '" mini></gs-number>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'tabindex', this.value);
        });
        
        // SUSPEND-CREATED attribute
        addProp('suspend-created', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-created') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suspend-created', this.value === 'true', true);
        });
        
        // SUSPEND-INSERTED attribute
        addProp('suspend-inserted', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-inserted') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suspend-inserted', this.value === 'true', true);
        });
        
        // visibility attributes
        strVisibilityAttribute = '';
        if (selectedElement.hasAttribute('hidden'))          { strVisibilityAttribute = 'hidden'; }
        if (selectedElement.hasAttribute('hide-on-desktop')) { strVisibilityAttribute = 'hide-on-desktop'; }
        if (selectedElement.hasAttribute('hide-on-tablet'))  { strVisibilityAttribute = 'hide-on-tablet'; }
        if (selectedElement.hasAttribute('hide-on-phone'))   { strVisibilityAttribute = 'hide-on-phone'; }
        if (selectedElement.hasAttribute('show-on-desktop')) { strVisibilityAttribute = 'show-on-desktop'; }
        if (selectedElement.hasAttribute('show-on-tablet'))  { strVisibilityAttribute = 'show-on-tablet'; }
        if (selectedElement.hasAttribute('show-on-phone'))   { strVisibilityAttribute = 'show-on-phone'; }
        
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
        
        addProp('Disabled', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('disabled') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'disabled', this.value === 'true', true);
        });
        
        //addFlexContainerProps(selectedElement);
        addFlexProps(selectedElement);
    };
});

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    
    var templateElement = document.createElement('template'), template;
    
    templateElement.innerHTML = '<select class="control" gs-dynamic></select>';
    
    template = templateElement.content;
    
    // re-target change event from control to element
    function changeFunction(event) {
        event.preventDefault();
        event.stopPropagation();
        
        GS.triggerEvent(event.target.parentNode, 'change');
        
        //return false;
    }
    
    // re-target focus event from control to element
    function focusFunction(event) {
        GS.triggerEvent(event.target.parentNode, 'focus');
    }
    
    function createPushReplacePopHandler(element) {
        var strQueryString = GS.getQueryString(), strQSCol = element.getAttribute('qs');
        
        if (GS.qryGetKeys(strQueryString).indexOf(strQSCol) > -1) {
            element.value = GS.qryGetVal(strQueryString, strQSCol);
        }
    }
    
    // dont do anything that modifies the element here
    function elementCreated(element) {
        // if "created" hasn't been suspended: run created code
        if (!element.hasAttribute('suspend-created')) {
            var strValue = element.value, observer;
            
            // if the value was set before the "created" lifecycle code runs: set attribute
            //      (discovered when trying to set a value of a date control in the after_open of a dialog)
            //      ("delete" keyword added because of firefox)
            if (strValue) {
                element.setAttribute('value', strValue);
                delete element.value;
            }
            
            // #############################################################
            // ##################### MUTATION OBSERVER #####################
            // #############################################################
            
            // create an observer instance
            observer = new MutationObserver(function(mutations) {
                var bolRefreshOptionList = true;
                
                // check each mutation: if only option and optgroup tags were added: refersh option tags in select
                mutations.forEach(function(mutation) {
                    var i, len;
                    
                    for (i = 0, len = mutation.addedNodes.length; i < len; i += 1) {
                        if (mutation.addedNodes[i].nodeName !== 'OPTION' && mutation.addedNodes[i].nodeName !== 'OPTGROUP') {
                            bolRefreshOptionList = false;
                        }
                    }
                });
                
                if (bolRefreshOptionList) {
                    element.refreshOptionList();
                }
            });
            
            // pass in the element node, as well as the observer options
            observer.observe(element, {childList: true});
        }
    }
    
    //
    function elementInserted(element) {
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                
                var strQSValue;
                
                if (element.hasAttribute('tabindex')) {
                    element.oldTabIndex = element.getAttribute('tabindex');
                    element.removeAttribute('tabindex');
                }
                
                element.refreshOptionList();
                
                //element.control.removeEventListener('change', changeFunction);
                element.control.addEventListener('change', changeFunction);
                
                //element.control.removeEventListener('focus', focusFunction);
                element.control.addEventListener('focus', focusFunction);
                
                // set the value from the value attribute (if it exists)
                if (element.getAttribute('value')) {
                    element.value = element.getAttribute('value');
                }
                
                //handle query-string
                if (element.getAttribute('qs')) {
                    strQSValue = GS.qryGetVal(GS.getQueryString(), element.getAttribute('qs'));
                    
                    if (strQSValue !== '' || !element.getAttribute('value')) {
                        element.value = strQSValue;
                    }
                    
                    window.addEventListener('pushstate',    function () { createPushReplacePopHandler(element); });
                    window.addEventListener('replacestate', function () { createPushReplacePopHandler(element); });
                    window.addEventListener('popstate',     function () { createPushReplacePopHandler(element); });
                }
                
                //keydown spacebar and enter should
                element.addEventListener('keydown', function (event) {
                    if (event.keycode === GS.keyCode('space') ||
                        event.keycode === GS.keyCode('down') ||
                        event.keycode === GS.keyCode('up')) {
                        
                    }
                });
            }
        }
    }
    
    xtag.register('gs-select', {
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
                    // attribute code
                }
            }
        },
        events: {},
        accessors: {
            value: {
                get: function () {
                    if (this.control) {
                        return this.control.value;
                    } else if (this.getAttribute('value')) {
                        return this.getAttribute('value');
                    }
                    return undefined;
                },
                
                set: function (newValue) {
                    this.setAttribute('value', newValue);
                    this.control.value = newValue;
                }
            },
            textValue: {
                get: function () {
                    return this.control.options[this.control.selectedIndex].text;
                },
                
                set: function (newValue) {
                    this.setAttribute('value', newValue);
                    this.control.value = newValue;
                }
            }
        },
        methods: {
            focus: function () {
                this.control.focus();
            },
            
            refreshOptionList: function () {
                var i, len, elementsToMove, oldvalue, arrChildren, controlElement;
                
                //console.log('refreshOptionList');
                
                // remove invalid elements from immediate children
                arrChildren = this.children;
                
                for (i = arrChildren.length - 1; i > -1; i -= 1) {
                    //console.log(arrChildren[i]);
                    
                    if (arrChildren[i].nodeName !== 'OPTION' &&
                        arrChildren[i].nodeName !== 'OPTGROUP' &&
                        arrChildren[i].nodeName !== 'SELECT' &&
                        arrChildren[i].classList.contains('control')) {
                        this.removeChild(arrChildren[i]);
                    }
                }
                
                // if there is already a control
                controlElement = xtag.queryChildren(this, '.control')[0];
                
                if (controlElement) { //this.control && this.control.parentNode) {
                    // save the old value
                    oldvalue = controlElement.value;
                    
                    // save the old control
                    this.oldcontrol = controlElement;
                    
                    // remove the control class from the old control so that when
                    //      we select for the new control we dont get the old control
                    controlElement.classList.remove('control');
                    
                }
                
                // append new control
                this.appendChild(template.cloneNode(true));
                
                // set a variable with the new control element for convenience and speed
                this.control = xtag.query(this, '.control')[0];
                
                // if there is an old control: get the options and optgroups out of it and move them to the new control
                if (this.oldcontrol) {
                    elementsToMove = xtag.queryChildren(this.oldcontrol, 'option, optgroup');
                    
                    for (i = 0, len = elementsToMove.length; i < len; i += 1) {
                        elementsToMove[i].setAttribute('gs-hidden', '');
                        
                        this.control.appendChild(elementsToMove[i]);
                    }
                }
                
                // fill the control with all of the option and optgroup tags that are direct descendents of the gs-select
                elementsToMove = xtag.queryChildren(this, 'option, optgroup');
                
                for (i = 0, len = elementsToMove.length; i < len; i += 1) {
                    this.control.appendChild(elementsToMove[i]);
                }
                
                // if there was an old control
                if (this.oldcontrol) {
                    // this if statement prevents an error when the gs-select shares and ID with another element
                    if (this.oldcontrol.parentNode === this) {
                        // remove the old control if it is currently a child of the select
                        this.removeChild(this.oldcontrol);
                    }
                    
                    // set the oldcontrol variable to undefined so that the next time this function is run we dont get the old control
                    this.oldcontrol = undefined;
                    
                    // set the value back to the old value
                    //console.log(this.getAttribute('value'));
                    this.control.value = this.getAttribute('value') || oldvalue;
                    
                } else if (this.hasAttribute('value')) {
                    //alert(this.getAttribute('value'));
                    this.control.value = this.getAttribute('value');
                }
                
                if (this.oldTabIndex) {
                    this.control.setAttribute('tabindex', this.oldTabIndex);
                }
            }
        }
    });
});