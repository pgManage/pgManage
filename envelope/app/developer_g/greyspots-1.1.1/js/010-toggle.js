
window.addEventListener('design-register-element', function () {
    
    registerDesignSnippet('<gs-toggle>', '<gs-toggle>', 'gs-toggle column="${1}">${2}</gs-toggle>');
    
    designRegisterElement('gs-toggle', (location.pathname.indexOf('/v1/') === 0 ? '/v1/dev/' : '/env/app/') + 'developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-buttons-toggle.html');
    
    window.designElementProperty_GSTOGGLE = function(selectedElement) {
        addProp('Icon', true, '<div flex-horizontal>' +
                              '     <gs-text id="prop-icon-input" class="target" value="' + (selectedElement.getAttribute('icon') || '') + '" mini flex></gs-text>' +
                              '     <gs-button id="prop-icon-picker-button" mini icononly icon="list"></gs-button>' +
                              '     <style>#prop-icon-picker-button:after {font-size: 1em;}</style>' +
                              '</div>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'icon', this.value, false);
        });
        
        document.getElementById('prop-icon-picker-button').addEventListener('click', function () {
            var i, len, html, arrIcons = GS.iconList(), strName, templateElement;
            
            for (i = 0, len = arrIcons.length, html = ''; i < len; i += 1) {
                strName = arrIcons[i].name;
                html += '<gs-block>' +
                            '<gs-button iconleft icon="' + strName + '" dialogclose>' + strName + '</gs-button>' +
                        '</gs-block>';
            }
            
            templateElement = document.createElement('template');
            templateElement.setAttribute('data-max-width', '1100px');
            
            templateElement.innerHTML = ml(function () {/*
                <gs-page>
                    <gs-header><center><h3>Choose An Icon</h3></center></gs-header>
                    <gs-body padded>
                        <gs-grid widths="1,1,1,1" reflow-at="767px">{{HTML}}</gs-grid>
                    </gs-body>
                    <gs-footer><gs-button dialogclose>Cancel</gs-button></gs-footer>
                </gs-page>
            */}).replace('{{HTML}}', html);
            
            GS.openDialog(templateElement, '', function (event, strAnswer) {
                var propInput = document.getElementById('prop-icon-input');
                
                if (strAnswer !== 'Cancel') {
                    propInput.value = strAnswer;
                    GS.triggerEvent(propInput, 'change');
                }
            });
        });
        
        if (selectedElement.getAttribute('icon') ||
            selectedElement.hasAttribute('iconleft') ||
            selectedElement.hasAttribute('iconright') ||
            selectedElement.hasAttribute('icontop') ||
            selectedElement.hasAttribute('iconbottom') ||
            selectedElement.hasAttribute('icononly') ||
            selectedElement.hasAttribute('iconrotateright') ||
            selectedElement.hasAttribute('iconrotatedown') ||
            selectedElement.hasAttribute('iconrotateleft')) {
            // iconleft
            // iconright
            // icontop
            // iconbottom
            // icononly
                   if (selectedElement.hasAttribute('iconleft'))   { strIconPos = 'iconleft';
            } else if (selectedElement.hasAttribute('iconright'))  { strIconPos = 'iconright';
            } else if (selectedElement.hasAttribute('icontop'))    { strIconPos = 'icontop';
            } else if (selectedElement.hasAttribute('iconbottom')) { strIconPos = 'iconbottom';
            } else if (selectedElement.hasAttribute('icononly'))   { strIconPos = 'icononly';
            } else { strIconPos = ''; }
            
            addProp('Icon Position', true, '<gs-select class="target" value="' + strIconPos + '" mini>' +
                                                '   <option value="">Default</option>' +
                                                '   <option value="iconleft">Left</option>' +
                                                '   <option value="iconright">Right</option>' +
                                                '   <option value="icontop">Top</option>' +
                                                '   <option value="iconbottom">Bottom</option>' +
                                                '   <option value="icononly">Icononly</option>' +
                                                '</gs-select>', function () {
                selectedElement.removeAttribute('iconleft');
                selectedElement.removeAttribute('iconright');
                selectedElement.removeAttribute('icontop');
                selectedElement.removeAttribute('iconbottom');
                selectedElement.removeAttribute('icononly');
                
                if (this.value) {
                    selectedElement.setAttribute(this.value, '');
                }
                
                return selectedElement;
            });
            
            // None
            // 90 degrees  (iconrotateright)
            // 180 degrees (iconrotatedown)
            // 270 degrees (iconrotateleft)
            
                   if (selectedElement.hasAttribute('iconrotateright')) { strIconRotation = 'iconrotateright';
            } else if (selectedElement.hasAttribute('iconrotatedown'))  { strIconRotation = 'iconrotatedown';
            } else if (selectedElement.hasAttribute('iconrotateleft'))  { strIconRotation = 'iconrotateleft';
            } else { strIconRotation = ''; }
            
            addProp('Icon&nbsp;Rotation', true, '<gs-select class="target" value="' + strIconRotation + '" mini>' +
                                                '   <option value="">None</option>' +
                                                '   <option value="iconrotateright">90 degrees</option>' +
                                                '   <option value="iconrotatedown">180 degrees</option>' +
                                                '   <option value="iconrotateleft">270 degrees</option>' +
                                                '</gs-select>', function () {
                selectedElement.removeAttribute('iconrotateright');
                selectedElement.removeAttribute('iconrotatedown');
                selectedElement.removeAttribute('iconrotateleft');
                
                if (this.value) {
                    selectedElement.setAttribute(this.value, '');
                }
                
                return selectedElement;
            });
        }
        
        // TITLE attribute
        addProp('Title', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('title') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'title', this.value);
        });
        
        // TABINDEX attribute
        addProp('Tabindex', true, '<gs-number class="target" value="' + encodeHTML(selectedElement.getAttribute('tabindex') || '') + '" mini></gs-number>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'tabindex', this.value);
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

        // Font Color attributes
        strFontAttribute = '';
        if (selectedElement.hasAttribute('txt-primary'))  { strFontAttribute = 'txt-primary'; }
        if (selectedElement.hasAttribute('txt-success'))  { strFontAttribute = 'txt-success'; }
        if (selectedElement.hasAttribute('txt-info'))     { strFontAttribute = 'txt-info'; }
        if (selectedElement.hasAttribute('txt-warning'))  { strFontAttribute = 'txt-warning'; }
        if (selectedElement.hasAttribute('txt-danger'))   { strFontAttribute = 'txt-danger'; }

        addProp('Font Color', true, '<gs-select class="target" value="' + strFontAttribute + '" mini>' +
                                        '<option value="">Default</option>' +
                                        '<option value="txt-primary">Primary</option>' +
                                        '<option value="txt-success">Success</option>' +
                                        '<option value="txt-info">Info</option>' +
                                        '<option value="txt-warning">Warning</option>' +
                                        '<option value="txt-danger">Danger</option>' +
                                    '</gs-select>', function () {
            selectedElement.removeAttribute('txt-primary');
            selectedElement.removeAttribute('txt-success');
            selectedElement.removeAttribute('txt-info');
            selectedElement.removeAttribute('txt-warning');
            selectedElement.removeAttribute('txt-danger');

            if (this.value) {
                selectedElement.setAttribute(this.value, '');
            }

            return selectedElement;
        });

        // Background Color attributes
        strBackgroundAttribute = '';
        if (selectedElement.hasAttribute('bg-primary'))  { strBackgroundAttribute = 'bg-primary'; }
        if (selectedElement.hasAttribute('bg-success'))  { strBackgroundAttribute = 'bg-success'; }
        if (selectedElement.hasAttribute('bg-info'))     { strBackgroundAttribute = 'bg-info'; }
        if (selectedElement.hasAttribute('bg-warning'))  { strBackgroundAttribute = 'bg-warning'; }
        if (selectedElement.hasAttribute('bg-danger'))   { strBackgroundAttribute = 'bg-danger'; }

        addProp('Background Color', true, '<gs-select class="target" value="' + strBackgroundAttribute + '" mini>' +
                                        '<option value="">Default</option>' +
                                        '<option value="bg-primary">Primary</option>' +
                                        '<option value="bg-success">Success</option>' +
                                        '<option value="bg-info">Info</option>' +
                                        '<option value="bg-warning">Warning</option>' +
                                        '<option value="bg-danger">Danger</option>' +
                                    '</gs-select>', function () {
            selectedElement.removeAttribute('bg-primary');
            selectedElement.removeAttribute('bg-success');
            selectedElement.removeAttribute('bg-info');
            selectedElement.removeAttribute('bg-warning');
            selectedElement.removeAttribute('bg-danger');

            if (this.value) {
                selectedElement.setAttribute(this.value, '');
            }

            return selectedElement;
        });

        addProp('Column', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('column') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'column', this.value);
        });

        addProp('Value', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('value') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'value', this.value);
        });

        addProp('Column In Querystring', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('qs') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'qs', this.value, false);
        });

        // SUSPEND-CREATED attribute
        addProp('suspend-created', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-created') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suspend-created', this.value === 'true', true);
        });

        // SUSPEND-INSERTED attribute
        addProp('suspend-inserted', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-inserted') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suspend-inserted', this.value === 'true', true);
        });

        addProp('Corners', true,   '<div class="target">' +
                                        '<gs-checkbox value="' + (!(selectedElement.hasAttribute('remove-all') ||
                                                                    selectedElement.hasAttribute('remove-top') ||
                                                                    selectedElement.hasAttribute('remove-left') ||
                                                                    selectedElement.hasAttribute('remove-top-left'))).toString() +
                                                '" remove-right remove-bottom id="round-top-left-corner________" inline></gs-checkbox>' +

                                        '<gs-checkbox value="' + (!(selectedElement.hasAttribute('remove-all') ||
                                                                    selectedElement.hasAttribute('remove-top') ||
                                                                    selectedElement.hasAttribute('remove-right') ||
                                                                    selectedElement.hasAttribute('remove-top-right'))).toString() +
                                                '" remove-left remove-bottom id="round-top-right-corner________" inline></gs-checkbox><br />' +

                                        '<gs-checkbox value="' + (!(selectedElement.hasAttribute('remove-all') ||
                                                                    selectedElement.hasAttribute('remove-bottom') ||
                                                                    selectedElement.hasAttribute('remove-left') ||
                                                                    selectedElement.hasAttribute('remove-bottom-left'))).toString() +
                                                '" remove-right remove-top id="round-bottom-left-corner________" inline></gs-checkbox>' +

                                        '<gs-checkbox value="' + (!(selectedElement.hasAttribute('remove-all') ||
                                                                    selectedElement.hasAttribute('remove-bottom') ||
                                                                    selectedElement.hasAttribute('remove-right') ||
                                                                    selectedElement.hasAttribute('remove-bottom-right'))).toString() +
                                                '" remove-left remove-top id="round-bottom-right-corner________" inline></gs-checkbox>' +
                                    '</div>', function () {
            var topLeft =     document.getElementById('round-top-left-corner________').value === 'true',
                topRight =    document.getElementById('round-top-right-corner________').value === 'true',
                bottomLeft =  document.getElementById('round-bottom-left-corner________').value === 'true',
                bottomRight = document.getElementById('round-bottom-right-corner________').value === 'true',
                arrStrAttr = [], i, len;

            selectedElement.removeAttribute('remove-all');
            selectedElement.removeAttribute('remove-top');
            selectedElement.removeAttribute('remove-bottom');
            selectedElement.removeAttribute('remove-left');
            selectedElement.removeAttribute('remove-right');
            selectedElement.removeAttribute('remove-top-left');
            selectedElement.removeAttribute('remove-top-right');
            selectedElement.removeAttribute('remove-bottom-left');
            selectedElement.removeAttribute('remove-bottom-right');

            if (!topLeft && !topRight && !bottomLeft && !bottomRight) {
                arrStrAttr.push('remove-all');
            } else if (!topLeft && !topRight) {
                arrStrAttr.push('remove-top');
            } else if (!bottomLeft && !bottomRight) {
                arrStrAttr.push('remove-bottom');
            } else if (!topLeft && !bottomLeft) {
                arrStrAttr.push('remove-left');
            } else if (!topRight && !bottomRight) {
                arrStrAttr.push('remove-right');
            }

            if (!topLeft && !bottomLeft && arrStrAttr[0] !== 'remove-all') {
                arrStrAttr.push('remove-left');
            } else if (!topLeft && topRight) {
                arrStrAttr.push('remove-top-left');
            } else if (!bottomLeft && bottomRight) {
                arrStrAttr.push('remove-bottom-left');
            }

            if (!topRight && !bottomRight && arrStrAttr[0] !== 'remove-all') {
                arrStrAttr.push('remove-right');
            } else if (topLeft && !topRight) {
                arrStrAttr.push('remove-top-right');
            } else if (bottomLeft && !bottomRight) {
                arrStrAttr.push('remove-bottom-right');
            }

            for (i = 0, len = arrStrAttr.length; i < len; i += 1) {
                selectedElement.setAttribute(arrStrAttr[i], '');
            }

            return selectedElement;
        });

        //addFlexContainerProps(selectedElement);
        addFlexProps(selectedElement);
    };
});

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    //function pushReplacePopHandler(element) {
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

    function pushReplacePopHandler(element) {
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
                    element.setAttribute('value', strQSValue);
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

        }
    }

    //
    function elementInserted(element) {
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                element.internal = {};
                saveDefaultAttributes(element);

                // add a tabindex to allow focus
                if (!element.hasAttribute('tabindex')) {
                    element.tabIndex = 0;
                }

                if (typeof element.getAttribute('value') === 'string') {
                    if (element.getAttribute('value') === 'true' || element.getAttribute('value') === '-1') {
                        element.setAttribute('selected', '');
                    }
                }

                // handle "qs" attribute
                if (element.getAttribute('qs')) {
                    //var strQSValue = GS.qryGetVal(GS.getQueryString(), element.getAttribute('qs'));
                    //if (strQSValue !== '' || !element.getAttribute('value')) {
                    //    element.value = strQSValue;
                    //}
                    pushReplacePopHandler(element);
                    window.addEventListener('pushstate',    function () { pushReplacePopHandler(element); });
                    window.addEventListener('replacestate', function () { pushReplacePopHandler(element); });
                    window.addEventListener('popstate',     function () { pushReplacePopHandler(element); });
                }
            }
        }
    }
    
    xtag.register('gs-toggle', {
        lifecycle: {
            created: function () {
                // if the value was set before the "created" lifecycle code runs: set attribute
                //      (discovered when trying to set a value of a date control in the after_open of a dialog)
                //      ("delete" keyword added because of firefox)
                if (this.value) {
                    this.setAttribute('value', this.value);
                    delete this.value;
                    //this.value = null;
                }
                
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
        events: {
            'click': function (event) {
                if (!this.hasAttribute('suspend-created') && !this.hasAttribute('suspend-inserted')) {
                    if (this.hasAttribute('selected')) {
                        this.removeAttribute('selected');
                        
                        if (this.getAttribute('value') === 'true') {
                            this.setAttribute('value', 'false');
                        } else if (this.getAttribute('value') === '-1') {
                            this.setAttribute('value', '0');
                        }
                        
                    } else {
                        this.setAttribute('selected', '');
                        
                        if (this.getAttribute('value') === 'false') {
                            this.setAttribute('value', 'true');
                        } else if (this.getAttribute('value') === '0') {
                            this.setAttribute('value', '-1');
                        }
                    }
                    
                    xtag.fireEvent(this, 'change', {
                        bubbles: true,
                        cancelable: true
                    });
                }
            },
            
            'keypress': function (event) {
                if (!this.hasAttribute('suspend-created') && !this.hasAttribute('suspend-inserted')) {
                    // if we are not disabled and we pressed return (13) or space (32): trigger tap
                    if (!this.hasAttribute('disabled') && (event.keyCode === 13 || event.keyCode === 32)) {
                        event.preventDefault();
                        event.stopPropagation();
                        
                        xtag.fireEvent(this, 'click', {
                            bubbles: true,
                            cancelable: true
                        });
                    }
                }
            }
        },
        accessors: {
            'value': {
                'get': function () {
                    return this.hasAttribute('selected'); //this.classList.contains('down');
                },
                
                'set': function (newValue) {
                    if (newValue === true || newValue === 'true') {
                        this.setAttribute('selected', '');
                    } else {
                        this.removeAttribute('selected');
                    }
                }
            },
            
            'textValue': {
                'get': function () {
                    return this.hasAttribute('selected') ? 'YES' : 'NO';
                },
                
                'set': function (newValue) {
                    if (newValue === true || newValue === 'true' || newValue === 'YES') {
                        this.setAttribute('selected', '');
                    } else {
                        this.removeAttribute('selected');
                    }
                }
            }
        },
        methods: {
            
        }
    });
});