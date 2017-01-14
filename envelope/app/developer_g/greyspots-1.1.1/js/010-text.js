//global GS, window, document, registerDesignSnippet, designRegisterElement, addProp, encodeHTML, setOrRemoveTextAttribute, setOrRemoveBooleanAttribute, addFlexProps

window.addEventListener('design-register-element', function () {

    registerDesignSnippet('<gs-text>', '<gs-text>', 'gs-text column="${1:name}"></gs-text>');
    registerDesignSnippet('<gs-text> With Label', '<gs-text>',
            'label for="${1:text-insert-last_name}">${2:Last Name}:</label>\n' +
            '<gs-text id="${1:text-insert-last_name}" column="${3:last_name}"></gs-text>');

    designRegisterElement('gs-text', (location.pathname.indexOf('/v1/') === 0 ? '/v1/dev/' : '/env/app/') + 'developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-text.html');

    window.designElementProperty_GSTEXT = function (selectedElement) {
        addProp('Column', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('column') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'column', this.value);
        });

        addProp('Value', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('value') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'value', this.value);
        });

        addProp('Column In Querystring', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('qs') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'qs', this.value, false);
        });

        addProp('Placeholder', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('placeholder') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'placeholder', this.value);
        });

        //console.log(selectedElement.hasAttribute('mini'));

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

        addProp('Visibility', true,
                '<gs-select class="target" value="' + strVisibilityAttribute + '" mini>' +
                '    <option value="">Visible</option>' +
                '    <option value="hidden">Invisible</option>' +
                '    <option value="hide-on-desktop">Invisible at desktop size</option>' +
                '    <option value="hide-on-tablet">Invisible at tablet size</option>' +
                '    <option value="hide-on-phone">Invisible at phone size</option>' +
                '    <option value="show-on-desktop">Visible at desktop size</option>' +
                '    <option value="show-on-tablet">Visible at tablet size</option>' +
                '    <option value="show-on-phone">Visible at phone size</option>' +
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

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // re-target change event from control to element
    function changeFunction(event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        event.target.parentNode.syncGetters();//iphone sometimes doesn't do a key like with time wheels

        GS.triggerEvent(event.target.parentNode, 'change');

        return false;
    }

    // re-target focus event from control to element
    function focusFunction(event) {
        GS.triggerEvent(event.target.parentNode, 'focus');
    }

    // re-target blur event from control to element
    function blurFunction(event) {
        GS.triggerEvent(event.target.parentNode, 'blur');
    }

    //function createPushReplacePopHandler(element) {
    //    var strQueryString = GS.getQueryString(), strQSCol = element.getAttribute('qs');

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
        var strOperator;

        if (strQSCol.indexOf('=') !== -1) {
            arrAttrParts = strQSCol.split(',');
            i = 0;
            len = arrAttrParts.length;
            while (i < len) {
                strQSCol = arrAttrParts[i];

                if (strQSCol.indexOf('!=') !== -1) {
                    strOperator = '!=';
                    arrQSParts = strQSCol.split('!=');
                } else {
                    strOperator = '=';
                    arrQSParts = strQSCol.split('=');
                }

                strQSCol = arrQSParts[0];
                strQSAttr = arrQSParts[1] || arrQSParts[0];

                // if the key is not present or we've got the negator: go to the attribute's default or remove it
                if (strOperator === '!=') {
                    // if the key is not present: add the attribute
                    if (GS.qryGetKeys(strQS).indexOf(strQSCol) === -1) {
                        element.setAttribute(strQSAttr, '');
                    // else: remove the attribute
                    } else {
                        element.removeAttribute(strQSAttr);
                    }
                } else {
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

    function elementInserted(element) {
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                element.internal = {};
                saveDefaultAttributes(element);

                //var strQSValue;

                // handle control
                element.handleContents();

                // fill control
                element.syncView();

                // bind/handle query string
                if (element.getAttribute('qs')) {
                    //strQSValue = GS.qryGetVal(GS.getQueryString(), element.getAttribute('qs'));

                    //if (strQSValue !== '' || !element.getAttribute('value')) {
                    //    element.value = strQSValue;
                    //}
                    createPushReplacePopHandler(element);
                    window.addEventListener('pushstate', function () {
                        createPushReplacePopHandler(element);
                    });
                    window.addEventListener('replacestate', function () {
                        createPushReplacePopHandler(element);
                    });
                    window.addEventListener('popstate', function () {
                        createPushReplacePopHandler(element);
                    });
                }

                // if this element is empty when it is inserted: initalize
                if (element.innerHTML.trim() === '') {
                    // handle control
                    element.handleContents();

                    // fill control
                    element.syncView();
                }
            }
        }
    }

    xtag.register('gs-text', {
        lifecycle: {
            created: function () {
                elementCreated(this);
            },

            inserted: function () {
                elementInserted(this);
            },

            attributeChanged: function (strAttrName, oldValue, newValue) {
                var element = this;
                // if "suspend-created" has been removed: run created and inserted code
                if (strAttrName === 'suspend-created' && newValue === null) {
                    elementCreated(element);
                    elementInserted(element);

                // if "suspend-inserted" has been removed: run inserted code
                } else if (strAttrName === 'suspend-inserted' && newValue === null) {
                    elementInserted(element);

                } else if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
                    var currentValue;

                    if (strAttrName === 'disabled' || strAttrName === 'readonly') {
                        // handle control
                        element.handleContents();

                        // fill control
                        element.syncView();

                    } else if (strAttrName === 'value' && element.initalized) {
                        if (element.hasAttribute('disabled')) {
                            currentValue = element.innerHTML;
                        } else {
                            currentValue = element.control.value;
                        }

                        // if there is a difference between the new value in the
                        //      attribute and the valued in the front end: refresh the front end
                        if (newValue !== currentValue) {
                            element.syncView();
                        }
                    }
                }
            }
        },
        events: {
            // on keydown and keyup sync the value attribute and the control value
            'keydown': function (event) {
                var element = this;
                if (!element.hasAttribute('readonly')) {
                    if (element.hasAttribute('disabled') && event.keyCode !== 9) {
                        event.preventDefault();
                        event.stopPropagation();
                    } else {
                        element.syncGetters();
                    }
                }
            },
            'keyup': function () {
                var element = this;
                if (!element.hasAttribute('readonly')) {
                    element.syncGetters();
                }
            }
        },
        accessors: {
            value: {
                // get value straight from the input
                get: function () {
                    return this.getAttribute('value');
                },

                // set the value of the input and set the value attribute
                set: function (strNewValue) {
                    this.setAttribute('value', strNewValue);
                }
            }
        },
        methods: {
            focus: function () {
                var element = this;
                if (element.control) {
                    element.control.focus();
                }
            },

            handleContents: function () {
                var element = this;
                var arrPassThroughAttributes = [
                        'placeholder', 'name', 'maxlength', 'autocorrect',
                        'autocapitalize', 'autocomplete', 'autofocus', 'spellcheck',
                        'readonly'
                    ];
                var i;
                var len;

                // if the gs-text element has a tabindex: save the tabindex and remov the attribute
                if (element.hasAttribute('tabindex')) {
                    element.savedTabIndex = element.getAttribute('tabindex');
                    element.removeAttribute('tabindex');
                }

                // if the gs-text doesn't have a disabled attribute: use an input element
                if (!element.hasAttribute('disabled')) {
                    // add control input and save it to a variable for later use
                    element.innerHTML = '<input class="control" gs-dynamic type="' + (element.getAttribute('type') || 'text') + '" />';
                    element.control = element.children[0];

                    // bind event re-targeting functions
                    element.control.removeEventListener('change', changeFunction);
                    element.control.addEventListener('change', changeFunction);

                    element.control.removeEventListener('focus', focusFunction);
                    element.control.addEventListener('focus', focusFunction);

                    element.control.removeEventListener('blur', blurFunction);
                    element.control.addEventListener('blur', blurFunction);

                    // copy passthrough attributes to control
                    i = 0;
                    len = arrPassThroughAttributes.length;
                    while (i < len) {
                        if (element.hasAttribute(arrPassThroughAttributes[i])) {
                            element.control.setAttribute(
                                arrPassThroughAttributes[i],
                                element.getAttribute(arrPassThroughAttributes[i]) || ''
                            );
                        }
                        i += 1;
                    }

                    // if we saved a tabindex: apply the tabindex to the control
                    if (element.savedTabIndex !== undefined && element.savedTabIndex !== null) {
                        element.control.setAttribute('tabindex', element.savedTabIndex);
                    }

                // else if the gs-text is disabled: clear the control variable and empty the gs-text
                } else {
                    element.control = undefined;
                    element.innerHTML = '';
                }
            },

            syncView: function () {
                var element = this;
                if (element.hasAttribute('disabled')) {
                    element.textContent = element.getAttribute('value') || element.getAttribute('placeholder');
                } else {
                    element.control.value = element.getAttribute('value') || '';
                }
                element.initalized = true;
            },

            syncGetters: function () {
                this.setAttribute('value', this.control.value);
            }
        }
    });
});