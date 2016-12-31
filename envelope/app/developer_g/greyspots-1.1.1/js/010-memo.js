//element.clientHeight < element.scrollHeight

window.addEventListener('design-register-element', function () {
    
    registerDesignSnippet('<gs-memo>', '<gs-memo>', 'gs-memo column="${1:name}"></gs-memo>');
    registerDesignSnippet('<gs-memo> With Label', '<gs-memo>', 'label for="${1:memo-insert-note}">${2:Notes}:</label>\n' +
                                                               '<gs-memo id="${1:memo-insert-note}" column="${3:note}"></gs-memo>');
    
    designRegisterElement('gs-memo', (location.pathname.indexOf('/v1/') === 0 ? '/v1/dev/' : '/env/app/') + 'developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-memo.html');
    
    window.designElementProperty_GSMEMO = function(selectedElement) {
        addProp('Column', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('column') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'column', this.value);
        });
        
        addProp('Value', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('value') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'value', this.value);
        });
        
        addProp('Column In Querystring', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('qs') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'qs', this.value, false);
        });
        
        addProp('Rows', true, '<gs-number class="target" value="' + encodeHTML(selectedElement.getAttribute('rows') || '') + '" mini></gs-number>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'rows', this.value);
        });
        
        addProp('Placeholder', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('placeholder') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'placeholder', this.value);
        });
        
        //console.log(selectedElement.hasAttribute('mini'));
        
        addProp('Autoresize', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('autoresize')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'autoresize', (this.value === 'true'), true);
        });
        addProp('Resize Handle', true, '<gs-checkbox class="target" value="' + (!selectedElement.hasAttribute('no-resize-handle')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'no-resize-handle', (this.value === 'true'), false);
        });
        
        addProp('Mini', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('mini')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'mini', (this.value === 'true'), true);
        });
        
        // TITLE attribute
        addProp('Title', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('title') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'title', this.value);
        });
        
        // TABINDEX attribute
        addProp('Tabindex', true, '<gs-number class="target" value="' + encodeHTML(selectedElement.getAttribute('tabindex') || '') + '" mini></gs-number>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'tabindex', this.value);
        });
        
        addProp('Autocorrect', true, '<gs-checkbox class="target" value="' + (selectedElement.getAttribute('autocorrect') !== 'off') + '" mini></gs-checkbox>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'autocorrect', (this.value === 'false' ? 'off' : ''));
        });
        
        addProp('Autocapitalize', true, '<gs-checkbox class="target" value="' + (selectedElement.getAttribute('autocapitalize') !== 'off') + '" mini></gs-checkbox>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'autocapitalize', (this.value === 'false' ? 'off' : ''));
        });
        
        addProp('Autocomplete', true, '<gs-checkbox class="target" value="' + (selectedElement.getAttribute('autocomplete') !== 'off') + '" mini></gs-checkbox>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'autocomplete', (this.value === 'false' ? 'off' : ''));
        });
        
        addProp('Spellcheck', true, '<gs-checkbox class="target" value="' + (selectedElement.getAttribute('spellcheck') !== 'false') + '" mini></gs-checkbox>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'spellcheck', (this.value === 'false' ? 'false' : ''));
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
        
        // DISABLED attribute
        addProp('Disabled', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('disabled') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'disabled', this.value === 'true', true);
        });
        
        //addFlexContainerProps(selectedElement);
        addFlexProps(selectedElement);
    };
});

// trigger resize to text on window resize
window.addEventListener('resize', function () {
    var i, len, arrElements = document.getElementsByTagName('gs-memo');
    
    for (i = 0, len = arrElements.length; i < len; i += 1) {
        //if (arrElements[i].control.clientHeight < arrElements[i].control.scrollHeight) {
        arrElements[i].handleResizeToText();
        //}
    }
});


if (!evt.touchDevice) {
    window.gsMemo = {};
    window.gsMemo.bolFirstMouseMoveWhileDown = true;
    window.gsMemo.currentMouseTarget = null;
    
    window.addEventListener('mousemove', function (event) {
        var mousePosition, intWhich;// = GS.mousePosition(event);
        
        // firefox sometimes doesn't permit access to "event.which"
        //      so this try/catch statement will prevent the error and nothing will run
        try {
            intWhich = event.which;
        } catch (e) {}
        
        if (window.bolFirstMouseMoveWhileDown === true && intWhich !== undefined && intWhich !== 0) {
            mousePosition = GS.mousePosition(event);
            
            window.bolFirstMouseMoveWhileDown = false;
            window.gsMemo.currentMouseTarget = document.elementFromPoint(mousePosition.x, mousePosition.y);
            
        } else if (intWhich !== undefined && intWhich === 0) {
            window.bolFirstMouseMoveWhileDown = true;
        }
        
        if (window.gsMemo.currentMouseTarget &&
            intWhich !== undefined && intWhich !== 0 &&
            window.gsMemo.currentMouseTarget.nodeName === 'TEXTAREA' &&
            window.gsMemo.currentMouseTarget.parentNode.nodeName === 'GS-MEMO' && //event.target === element.control &&
            window.bolFirstMouseMoveWhileDown === false &&
                (window.gsMemo.currentMouseTarget.lastWidth !== window.gsMemo.currentMouseTarget.clientWidth ||
                window.gsMemo.currentMouseTarget.lastHeight !== window.gsMemo.currentMouseTarget.clientHeight)) {// && //element.control === window.lastMouseDownElement) {
            
            //GS.triggerEvent(window.gsMemo.currentMouseTarget.parentNode, 'size-changed');
            
            window.gsMemo.currentMouseTarget.style.margin = '';
            window.gsMemo.currentMouseTarget.style.marginLeft = '';
            window.gsMemo.currentMouseTarget.style.marginRight = '';
            window.gsMemo.currentMouseTarget.style.marginTop = '';
            window.gsMemo.currentMouseTarget.style.marginBottom = '';
            window.gsMemo.currentMouseTarget.lastWidth  = window.gsMemo.currentMouseTarget.clientWidth;
            window.gsMemo.currentMouseTarget.lastHeight = window.gsMemo.currentMouseTarget.clientHeight;
            
            GS.triggerEvent(window.gsMemo.currentMouseTarget.parentNode, 'size-changed');
            
            //console.log('mousemove (' + new Date().getTime() + ')');
        }
    });
    
    window.addEventListener('mouseup', function (event) {
        //var mousePosition = GS.mousePosition(event);
        
        window.bolFirstMouseMoveWhileDown = true;
        //console.log('3***'); //, document.elementFromPoint(mousePosition.x, mousePosition.y)); //event.target);
        //window.lastMouseDownElement = element.control;
    });
}

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    
    var multiLineTemplateElement = document.createElement('template'),
        multiLineTemplate;
    
    multiLineTemplateElement.innerHTML = '<textarea class="control" gs-dynamic></textarea>';
    
    multiLineTemplate = multiLineTemplateElement.content;
    
    // re-target change event from control to element
    function changeFunction(event) {
        event.preventDefault();
        event.stopPropagation();
        
        GS.triggerEvent(event.target.parentNode, 'change');
    }
    
    // re-target focus event from control to element
    function focusFunction(event) {
        GS.triggerEvent(event.target.parentNode, 'focus');
    }
    
    //
    function keydownFunction(event) {
        var element = event.target;
        if (!element.hasAttribute('readonly')) {
            if (element.getAttribute('disabled') !== null && event.keyCode !== 9 && !(event.keyCode === 122 && event.metaKey)) {
                event.preventDefault();
                event.stopPropagation();
            } else {
                //this.parentNode.syncView();
                element.parentNode.setAttribute('value', element.value);
                element.parentNode.handleResizeToText();
            }
        }
    }
    
    //
    function keyupFunction(event) {
        var element = event.target;
        if (!element.hasAttribute('readonly')) {
            //this.parentNode.syncView();
            element.parentNode.setAttribute('value', element.value);
            element.parentNode.handleResizeToText();
        }
    }
    
    function insertFunction(event) {
        var element = event.target;
        element.parentNode.handleResizeToText();
    }
    
    ////
    //function createPushReplacePopHandler(element) {
    //    var strQueryString = GS.getQueryString(), strQSCol = element.getAttribute('qs');
    //    
    //    if (GS.qryGetKeys(strQueryString).indexOf(strQSCol) > -1) {
    //        element.value = GS.qryGetVal(strQueryString, strQSCol);
    //    }
    //}
    
    function saveDefaultAttributes(element) {
        var i;
        var len;
        var arrAttr;
        var jsnAttr;

        // we need a place to store the attributes
        element.internal.defaultAttributes = {};

        // loop through attributes and store them in the internal defaultAttributes object
        arrAttr = element.attributes;
        i = 0;
        len = arrAttr.length;
        while (i < len) {
            jsnAttr = arrAttr[i];

            element.internal.defaultAttributes[jsnAttr.nodeName] = (jsnAttr.nodeValue || '');

            i += 1;
        }
    }

    function createPushReplacePopHandler(element) {
        var i;
        var len;
        var strQS = GS.getQueryString();
        var strQSCol = element.getAttribute('qs');
        var strQSValue;
        var strQSAttr;
        var arrQSParts;
        var arrAttrParts;

        if (strQSCol.indexOf('=') !== -1) {
            arrAttrParts = strQSCol.split(',');
            i = 0;
            len = arrAttrParts.length;
            while (i < len) {
                strQSCol = arrAttrParts[i];
                arrQSParts = strQSCol.split('=');
                strQSCol = arrQSParts[0];
                strQSAttr = arrQSParts[1] || arrQSParts[0];

                // if the key is not present: go to the attribute's default or remove it
                if (GS.qryGetKeys(strQS).indexOf(strQSCol) === -1) {
                    if (element.internal.defaultAttributes[strQSAttr] !== undefined) {
                        element.setAttribute(strQSAttr, (element.internal.defaultAttributes[strQSAttr] || ''));
                    } else {
                        element.removeAttribute(strQSAttr);
                    }
                // else: set attribute to exact text from QS
                } else {
                    element.setAttribute(strQSAttr, (
                        GS.qryGetVal(strQS, strQSCol) ||
                        element.internal.defaultAttributes[strQSAttr] ||
                        ''
                    ));
                }
                i += 1;
            }
        } else if (GS.qryGetKeys(strQS).indexOf(strQSCol) > -1) {
            strQSValue = GS.qryGetVal(strQS, strQSCol);

            if (element.internal.bolQSFirstRun !== true) {
                if (strQSValue !== '' || !element.getAttribute('value')) {
                    element.value = strQSValue;
                }
            } else {
                element.value = strQSValue;
            }
        }

        element.internal.bolQSFirstRun = true;
    }
    
    // dont do anything that modifies the element here
    function elementCreated(element) {
        // if "created" hasn't been suspended: run created code
        if (!element.hasAttribute('suspend-created')) {
            // if the value was set before the "created" lifecycle code runs: set attribute
            //      (discovered when trying to set a value of a date control in the after_open of a dialog)
            //      ("delete" keyword added because of firefox)
            if (element.value) {
                element.setAttribute('value', element.value);
                delete element.value;
                //element.value = null;
            }
        }
    }

    //
    function elementInserted(element) {
        //var strQSValue;

        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                element.internal = {};
                saveDefaultAttributes(element);

                if (element.hasAttribute('tabindex')) {
                    element.setAttribute('data-tabindex', element.getAttribute('tabindex'));
                    element.removeAttribute('tabindex');
                }

                element.appendChild(multiLineTemplate.cloneNode(true));
                if (element.hasAttribute('data-tabindex')) {
                    xtag.query(element, '.control')[0].setAttribute('tabindex', element.getAttribute('data-tabindex'));
                }
                // set a variable with the control element for convenience and speed
                element.control = xtag.queryChildren(element, '.control')[0];

                element.control.lastWidth = element.control.clientWidth;
                element.control.lastHeight = element.control.clientHeight;
                element.syncView();

                if (element.getAttribute('qs')) {
                    //strQSValue = GS.qryGetVal(GS.getQueryString(), element.getAttribute('qs'));
                    //
                    //if (strQSValue !== '' || !element.getAttribute('value')) {
                    //    element.value = strQSValue;
                    //}

                    createPushReplacePopHandler(element);
                    window.addEventListener('pushstate',    function () { createPushReplacePopHandler(element); });
                    window.addEventListener('replacestate', function () { createPushReplacePopHandler(element); });
                    window.addEventListener('popstate',     function () { createPushReplacePopHandler(element); });
                }
            }
        }
    }

    xtag.register('gs-memo', {
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
                    //console.log(this.getAttribute('id'), strAttrName, oldValue, newValue);
                    if (strAttrName === 'disabled' && newValue !== null) {
                        this.innerHTML = this.getAttribute('value') || this.getAttribute('placeholder');
                    } else if (strAttrName === 'disabled' && newValue === null) {
                        this.innerHTML = '';
                        this.appendChild(multiLineTemplate.cloneNode(true));
                        if (this.hasAttribute('data-tabindex')) {
                            xtag.query(this, '.control')[0].setAttribute('tabindex', this.getAttribute('data-tabindex'));
                        }
                        // set a variable with the control element for convenience and speed
                        this.control = xtag.queryChildren(this, '.control')[0];
                        
                        this.control.lastWidth = this.control.clientWidth;
                        this.control.lastHeight = this.control.clientHeight;
                        this.syncView();
                    }
                }
            }
        },
        events: {},
        accessors: {
            value: {
                // get value straight from the input
                get: function () {
                    if (this.control) {
                        return this.control.value;
                    } else {
                        return this.innerHTML;
                    }
                },
                
                // set the value of the input and set the value attribute
                set: function (strNewValue) {
                    this.setAttribute('value', strNewValue);
                    if (this.control) {
                        this.control.value = strNewValue;
                    } else {
                        this.innerHTML = strNewValue;
                    }
                    this.syncView();
                }
            },
            textValue: {
                // get value straight from the input
                get: function () {
                    if (this.control) {
                        return this.control.value;
                    } else {
                        return this.innerHTML;
                    }
                },
                
                // set the value attribute
                set: function (newValue) {
                    //this.setAttribute('value', newValue);
                    this.value = newValue;
                }
            }
        },
        methods: {
            focus: function () {
                if (this.control) {
                    this.control.focus();
                }
            },
            
            // sync control and resize to text
            syncView: function () {
                var element = this, arrPassThroughAttributes, i, len;
                
                /*
                if (this.innerHTML === '') {
                    this.appendChild(multiLineTemplate.cloneNode(true));
                }
                */
                /*
                if ((! this.hasAttribute('disabled')) && (! this.control)) {
                    this.appendChild(multiLineTemplate.cloneNode(true));
                    // set a variable with the control element for convenience and speed
                    this.control = xtag.queryChildren(this, '.control')[0];
                    
                    this.control.lastWidth = this.control.clientWidth;
                    this.control.lastHeight = this.control.clientHeight;
                }
                */
                
                if (this.hasAttribute('rows')) {
                    if (this.control) {
                        this.control.setAttribute('rows', this.getAttribute('rows'));
                    }
                }
                
                if (this.control) {
                    this.control.removeEventListener('change', changeFunction);
                    this.control.addEventListener('change', changeFunction);
                    
                    this.control.removeEventListener('focus', focusFunction);
                    this.control.addEventListener('focus', focusFunction);
                    
                    this.control.removeEventListener('keydown', keydownFunction);
                    this.control.addEventListener('keydown', keydownFunction);
                    
                    this.control.removeEventListener('insert', insertFunction);
                    this.control.addEventListener('insert', insertFunction);
                }
                
                if (this.control) {
                    this.control.value = this.getAttribute('value');
                } else {
                    this.innerHTML = this.getAttribute('value') || this.getAttribute('placeholder') || '';
                }
                    
                if (this.getAttribute('value')) {
                    this.handleResizeToText();
                }
                
                if (this.control) {
                    arrPassThroughAttributes = [
                        'placeholder',
                        'name',
                        'maxlength',
                        'autocorrect',
                        'autocapitalize',
                        'autocomplete',
                        'autofocus',
                        'rows',
                        'spellcheck',
                        'readonly'
                    ];
                    for (i = 0, len = arrPassThroughAttributes.length; i < len; i += 1) {
                        if (this.hasAttribute(arrPassThroughAttributes[i])) {
                            this.control.setAttribute(arrPassThroughAttributes[i], this.getAttribute(arrPassThroughAttributes[i]) || '');
                        }
                    }
                }
                
                // copy passthrough attributes to control
            },
            
            // if element is multiline and autoresize is not turned off: resize the element to fit the content
            handleResizeToText: function () {
                var element = this, intMinHeight;
                
                if (element.control) {
                    if (element.hasAttribute('autoresize')) {
                        element.control.style.height = '';
                        intMinHeight = element.control.offsetHeight;
                        element.control.style.height = ''; // '0';
                        
                        if (element.control.scrollHeight > intMinHeight) {
                            element.control.style.height = element.control.scrollHeight + 'px';
                        } else {
                            element.control.style.height = intMinHeight + 'px';
                        }
                    }
                    
                    
                    if (element.control.lastWidth !== element.control.clientWidth && element.control.lastHeight !== element.control.clientHeight) {
                        element.control.lastWidth = element.control.clientWidth;
                        element.control.lastHeight = element.control.clientHeight;
                        
                        GS.triggerEvent(element, 'size-changed');
                    }
                }
            }
        }
    });
});