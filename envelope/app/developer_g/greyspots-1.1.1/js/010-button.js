

(function () {
    'use strict';

    function defineButton(strTagName, strDocLink, arrDisableWhenEmptyAttributes, designAdditionalFunction, clickFunction) {
        strDocLink = strDocLink || '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-buttons-toggle.html';
        designAdditionalFunction = designAdditionalFunction || function () {};
        clickFunction = clickFunction || function () {};

        window.addEventListener('design-register-element', function () {
            registerDesignSnippet('<' + strTagName + '>', '<' + strTagName + '>', strTagName + '>${1}</' + strTagName + '>');

            designRegisterElement(strTagName, strDocLink);

            window['designElementProperty_' + strTagName.replace(/[^a-z0-9]/gi, '').toUpperCase()] = function (selectedElement) {
                var strIconPos = '', strIconRotation = '', strVisibilityAttribute = '', strFontAttribute = '', strBackgroundAttribute = '';

                addProp('Icon', true, '<div flex-horizontal>' +
                                      '     <gs-text id="prop-icon-input" class="target" value="' + (selectedElement.getAttribute('icon') || '') +
                                                                                                            '" mini flex></gs-text>' +
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
                    templateElement.innerHTML =
                        '<gs-page>' +
                        '    <gs-header><center><h3>Choose An Icon</h3></center></gs-header>' +
                        '    <gs-body padded><gs-grid widths="1,1,1,1" reflow-at="767px">' + html + '</gs-grid></gs-body>' +
                        '    <gs-footer><gs-button dialogclose>Cancel</gs-button></gs-footer>' +
                        '</gs-page>';

                    GS.openDialog(templateElement, '', function (event, strAnswer) {
                        var propInput = document.getElementById('prop-icon-input');

                        if (strAnswer !== 'Cancel') {
                            propInput.value = strAnswer;
                            GS.triggerEvent(propInput, 'change');
                        }
                    });
                });

                       if (selectedElement.hasAttribute('iconleft'))   { strIconPos = 'iconleft';
                } else if (selectedElement.hasAttribute('iconright'))  { strIconPos = 'iconright';
                } else if (selectedElement.hasAttribute('icontop'))    { strIconPos = 'icontop';
                } else if (selectedElement.hasAttribute('iconbottom')) { strIconPos = 'iconbottom';
                } else if (selectedElement.hasAttribute('icononly'))   { strIconPos = 'icononly'; }

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

                       if (selectedElement.hasAttribute('iconrotateright')) { strIconRotation = 'iconrotateright';
                } else if (selectedElement.hasAttribute('iconrotatedown'))  { strIconRotation = 'iconrotatedown';
                } else if (selectedElement.hasAttribute('iconrotateleft'))  { strIconRotation = 'iconrotateleft'; }
                
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
                
                addProp('Column', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('column') || '') + '" mini></gs-text>', function () {
                    return setOrRemoveTextAttribute(selectedElement, 'column', this.value, false);
                });
                
                addProp('Value', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('value') || '') + '" mini></gs-text>', function () {
                    return setOrRemoveTextAttribute(selectedElement, 'value', this.value, false);
                });
                
                addProp('Column In Querystring', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('qs') || '') + '" mini></gs-text>', function () {
                    return setOrRemoveTextAttribute(selectedElement, 'qs', this.value, false);
                });
                
                addProp('Jumbo', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('jumbo')) + '" mini></gs-checkbox>', function () {
                    return setOrRemoveBooleanAttribute(selectedElement, 'jumbo', (this.value === 'true'), true);
                });
                
                addProp('Focusable', true, '<gs-checkbox class="target" value="' + (!selectedElement.hasAttribute('no-focus')) + '" mini></gs-checkbox>', function () {
                    return setOrRemoveBooleanAttribute(selectedElement, 'no-focus', (this.value === 'true'), false);
                });
                /* TODO: remove emphasis and add other colors
                addProp('Emphasis', true, '<gs-checkbox class="target" value="' + (!selectedElement.hasAttribute('emphasis')) + '" mini></gs-checkbox>', function () {
                    return setOrRemoveBooleanAttribute(selectedElement, 'emphasis', (this.value === 'true'), true);
                });
                */


                //<gs-delete-button>

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

                addProp('Tabindex', true, '<gs-number class="target" value="' + encodeHTML(selectedElement.getAttribute('tabindex') || '0') + '" mini></gs-number>', function () {
                    return setOrRemoveTextAttribute(selectedElement, 'tabindex', this.value);
                });

                addProp('Inline', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('inline')) + '" mini></gs-checkbox>', function () {
                    return setOrRemoveBooleanAttribute(selectedElement, 'inline', (this.value === 'true'), true);
                });
                addProp('Mini', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('mini')) + '" mini></gs-checkbox>', function () {
                    return setOrRemoveBooleanAttribute(selectedElement, 'mini', (this.value === 'true'), true);
                });

                addProp('Key', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('key') || '') + '" mini></gs-text>', function () {
                    return setOrRemoveTextAttribute(selectedElement, 'key', this.value, false);
                });

                addProp('No Modifier Key For Hot Key', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('no-modifier-key') || '') + '" mini></gs-checkbox>', function () {
                    return setOrRemoveBooleanAttribute(selectedElement, 'no-modifier-key', this.value === 'true', true);
                });

                // TITLE attribute
                addProp('Title', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('title') || '') + '" mini></gs-text>', function () {
                    return setOrRemoveTextAttribute(selectedElement, 'title', this.value);
                });

                // DISABLED attribute
                addProp('Disabled', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('disabled') || '') + '" mini></gs-checkbox>', function () {
                    return setOrRemoveBooleanAttribute(selectedElement, 'disabled', this.value === 'true', true);
                });

                // SUSPEND-INSERTED attribute
                addProp('suspend-inserted', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-inserted') || '') + '" mini></gs-checkbox>', function () {
                    return setOrRemoveBooleanAttribute(selectedElement, 'suspend-inserted', this.value === 'true', true);
                });

                // visibility attributes
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
                
                addProp('Corners', true,   '<div class="target">' +
                                                '<gs-grid>\n' +
                                                '    <gs-block>\n' +
                                                '        <gs-checkbox value="' + (!(selectedElement.hasAttribute('remove-all') ||
                                                                            selectedElement.hasAttribute('remove-top') ||
                                                                            selectedElement.hasAttribute('remove-left') ||
                                                                            selectedElement.hasAttribute('remove-top-left'))).toString() + 
                                                            '" remove-right remove-bottom id="round-top-left-corner________"></gs-checkbox>' +
                                                        
                                                '        <gs-checkbox value="' + (!(selectedElement.hasAttribute('remove-all') ||
                                                                            selectedElement.hasAttribute('remove-bottom') ||
                                                                            selectedElement.hasAttribute('remove-left') ||
                                                                            selectedElement.hasAttribute('remove-bottom-left'))).toString() + 
                                                            '" remove-right remove-top id="round-bottom-left-corner________"></gs-checkbox>' +
                                                '    </gs-block>\n' +
                                                '    <gs-block>\n' +
                                                '        <gs-checkbox value="' + (!(selectedElement.hasAttribute('remove-all') ||
                                                                            selectedElement.hasAttribute('remove-top') ||
                                                                            selectedElement.hasAttribute('remove-right') ||
                                                                            selectedElement.hasAttribute('remove-top-right'))).toString() + 
                                                            '" remove-left remove-bottom id="round-top-right-corner________"></gs-checkbox>' +
                                                        
                                                '        <gs-checkbox value="' + (!(selectedElement.hasAttribute('remove-all') ||
                                                                            selectedElement.hasAttribute('remove-bottom') ||
                                                                            selectedElement.hasAttribute('remove-right') ||
                                                                            selectedElement.hasAttribute('remove-bottom-right'))).toString() + 
                                                            '" remove-left remove-top id="round-bottom-right-corner________"></gs-checkbox>' +
                                                '    </gs-block>\n' +
                                                '</gs-grid>\n' +
                                            '</div>', function () {
                    var topLeft     = document.getElementById('round-top-left-corner________').value === 'true',
                        topRight    = document.getElementById('round-top-right-corner________').value === 'true',
                        bottomLeft  = document.getElementById('round-bottom-left-corner________').value === 'true',
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

                designAdditionalFunction(selectedElement);
            };
        });
        
        document.addEventListener('DOMContentLoaded', function () {
            function handleDisable(element) {
                var i, len;

                element.removeAttribute('disabled');

                for (i = 0, len = arrDisableWhenEmptyAttributes.length; i < len; i += 1) {
                    if (!element.getAttribute(arrDisableWhenEmptyAttributes[i])) {
                        element.setAttribute('disabled', '');
                        break;
                    }
                }
            }

            //function pushReplacePopHandler(element) {
            //    var strQueryString = GS.getQueryString(), strQSCol = element.getAttribute('qs');

            //    if (GS.qryGetKeys(strQueryString).indexOf(strQSCol) > -1) {
            //        element.setAttribute('value', GS.qryGetVal(strQueryString, strQSCol));
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
                            element.setAttribute('value', strQSValue);
                        }
                    } else {
                        element.setAttribute('value', strQSValue);
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
                var strKey, strQSValue;

                if (element.tagName.toUpperCase() === 'GS-DELETE-BUTTON' && !element.hasAttribute('src')) {
                    console.warn(element, 'gs-delete-button needs a [src=""] attribute!');
                }

                // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
                if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
                    // if this is the first time inserted has been run: continue
                    if (!element.inserted) {
                        element.inserted = true;
                        element.internal = {};
                        saveDefaultAttributes(element);

                        if (element.getAttribute('qs')) {
                            //strQSValue = GS.qryGetVal(GS.getQueryString(), element.getAttribute('qs'));
                            //if (strQSValue !== '' || !element.getAttribute('value')) {
                            //    element.setAttribute('value', strQSValue);
                            //}
                            pushReplacePopHandler(element);
                            window.addEventListener('pushstate',    function () { pushReplacePopHandler(element); });
                            window.addEventListener('replacestate', function () { pushReplacePopHandler(element); });
                            window.addEventListener('popstate',     function () { pushReplacePopHandler(element); });
                        }

                        // add a tabindex to allow focus (if allowed)
                        if (!element.hasAttribute('no-focus')) {
                            if ((!element.tabIndex) || element.tabIndex === -1) {
                                element.tabIndex = 0;
                            }
                        } else {
                            element.removeAttribute('tabindex');
                        }
                        
                        if (!evt.touchDevice) {
                            element.addEventListener(evt.mousedown, function (event) {
                                element.classList.add('down');
                            });
                            
                            element.addEventListener(evt.mouseout, function (event) {
                                element.classList.remove('down');
                                element.classList.remove('hover');
                            });
                            
                            element.addEventListener(evt.mouseover, function (event) {
                                element.classList.remove('down');
                                element.classList.add('hover');
                            });
                            
                            element.addEventListener('keydown', function (event) {
                                if (!element.hasAttribute('disabled') && !element.classList.contains('down') &&
                                    (event.keyCode === 13 || event.keyCode === 32)) {
                                    
                                    element.classList.add('down');
                                }
                            });
                            
                            element.addEventListener('keyup', function (event) {
                                // if we are not disabled and we pressed return (13) or space (32): trigger click
                                if (!element.hasAttribute('disabled') && element.classList.contains('down') &&
                                    (event.keyCode === 13 || event.keyCode === 32)) {
                                    GS.triggerEvent(element, 'click');
                                }
                            });
                        }
                        
                        element.addEventListener('click', function (event) {
                            element.classList.remove('down');
                            clickFunction(element);
                        });
                        
                        element.addEventListener('keypress', function (event) {
                            // if we pressed return (13) or space (32): prevent default and stop propagation (to prevent scrolling of the page)
                            if (event.keyCode === 13 || event.keyCode === 32) {
                                event.preventDefault();
                                event.stopPropagation();
                            }
                        });
                        
                        if (element.getAttribute('key')) {
                            strKey = element.getAttribute('key');
                            
                            if (GS.keyCode(strKey)) {
                                if (strKey.match(/[arfcvxzntypq]/gim)) {
                                    console.warn('gs-skype-button Warning: by setting the hot key of this button to "' + strKey + '" you may be overriding browser functionality.', element);
                                }
                                
                                window.addEventListener('keydown', function (event) {
                                    if (String(event.keyCode || event.which) === GS.keyCode(strKey) &&
                                        (
                                            (element.hasAttribute('no-modifier-key') && !event.metaKey && !event.ctrlKey) ||
                                            (!element.hasAttribute('no-modifier-key') && (event.metaKey || event.ctrlKey))
                                        )) {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        
                                        element.focus();
                                        GS.triggerEvent(element, 'click');
                                    }
                                });
                                
                            } else if (strKey.length > 1) {
                                console.error('gs-skype-button Error: \'key="' + strKey + '"\' is not a valid hot-key.', element);
                            }
                        }
                        
                        handleDisable(element);
                    }
                }
            }
            
            xtag.register(strTagName, {
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
                            if (strAttrName === 'no-focus') {
                                if (!this.hasAttribute('no-focus')) {
                                    if ((!this.tabIndex) || this.tabIndex === -1) {
                                        this.tabIndex = 0;
                                    }
                                } else {
                                    this.removeAttribute('tabindex');
                                }
                            } else if (strAttrName === 'disabled') {
                                this.classList.remove('down');
                            } else if (arrDisableWhenEmptyAttributes.indexOf(strAttrName) > -1) {
                                handleDisable(this);
                            }
                        }
                    }
                },
                accessors: {
                    value: {
                        get: function () {
                            return this.getAttribute('value');
                        },
                        set: function (newValue) {
                            this.setAttribute('value', newValue);
                        }
                    }
                }
            });
        });
    }
    
    
    
    defineButton('gs-email-button', '', ['value'], '', function (element) {
        var emailAddress = element.getAttribute('value'), linkIframe, mousedownHandler;
        
        if (emailAddress) {
            linkIframe = document.createElement('iframe');
            document.body.appendChild(linkIframe);
            
            linkIframe.setAttribute('src', 'mailto:' + emailAddress);
            
            mousedownHandler = function () {
                document.body.removeChild(linkIframe);
                window.removeEventListener('mousedown', mousedownHandler);
            };
            
            window.addEventListener('mousedown', mousedownHandler);
        }
    });
    
    defineButton('gs-facetime-button', '', ['value'], '', function (element) {
        var appleID = element.getAttribute('value');
        
        if (appleID) {
            window.open('facetime:' + appleID);
        }
    });
    
    defineButton('gs-map-button', '', ['value'], '', function (element) {
        var strLocation = encodeURIComponent(element.getAttribute('value'));
        
        if (strLocation) {
            if (element.hasAttribute('google') === true) {
                window.open('https://maps.google.com/maps?q=' + strLocation);
            } else if (element.hasAttribute('bing') === true) {
                window.open('http://www.bing.com/maps/default.aspx?q=' + strLocation);
            } else {
                window.open('https://maps.google.com/maps?q=' + strLocation);
            }
        }
    });
    
    defineButton('gs-phone-button', '', ['value'], '', function (element) {
        var phoneNumber = element.getAttribute('value');
        
        if (phoneNumber) {
            if (evt.deviceType === 'phone') {
                window.open('tel:' + phoneNumber);
                   
            } else {
                GS.msgbox('Phone Number', '<center>' + phoneNumber + '</center>', ['Done']);
            }
        }
    });
    
    defineButton('gs-tracking-button', '', ['value'], function (selectedElement) {
        var strService = '';
        
               if (selectedElement.hasAttribute('usps'))  { strService = 'usps';
        } else if (selectedElement.hasAttribute('ups'))   { strService = 'ups';
        } else if (selectedElement.hasAttribute('fedex')) { strService = 'fedex';
        } else if (selectedElement.hasAttribute('royal')) { strService = 'royal';
        } else if (selectedElement.hasAttribute('amz'))   { strService = 'amz'; }
        
        addProp('Service', true, '<gs-select class="target" value="' + strService + '" mini>' +
                                            '   <option value="">None</option>' +
                                            '   <option value="usps">USPS</option>' +
                                            '   <option value="ups">UPS</option>' +
                                            '   <option value="fedex">FEDEX</option>' +
                                            '   <option value="royal">Royal Mail</option>' +
                                            '   <option value="amz">Amazon</option>' +
                                            '</gs-select>', function () {
            selectedElement.removeAttribute('usps');
            selectedElement.removeAttribute('ups');
            selectedElement.removeAttribute('fedex');
            selectedElement.removeAttribute('royal');
            selectedElement.removeAttribute('amazon');
            
            if (this.value) {
                selectedElement.setAttribute(this.value, '');
            }
            
            return selectedElement;
        });
        
    }, function (element) {
        var strTrackingNumber = element.getAttribute('value');
        
        if (strTrackingNumber) {
            if (element.hasAttribute('usps') === true) {
                window.open(' https://tools.usps.com/go/TrackConfirmAction?tLabels=' + strTrackingNumber);
                
            } else if (element.hasAttribute('ups') === true) {
                window.open('http://www.ups.com/WebTracking/processInputRequest?tracknum=' + strTrackingNumber);
                
            } else if (element.hasAttribute('fedex') === true) {
                window.open('https://www.fedex.com/apps/fedextrack/index.html?tracknumbers=' + strTrackingNumber);
                
            } else if (element.hasAttribute('royal') === true) {
                window.open('https://www.royalmail.com/track-your-item?trackNumber=' + strTrackingNumber);
                
            } else if (element.hasAttribute('amz') === true) {
                window.open(strTrackingNumber);
                
            } else {
                GS.msgbox('Please Choose...',
                          '<center>Please Choose UPS, USPS, Fedex, Royal Mail or Amazon</center>',
                          ['UPS', 'USPS', 'Fedex', 'Royal Mail', 'Amazon'],
                          function (strAnswer) {
                    if (strAnswer === 'UPS') {
                        window.open('http://www.ups.com/WebTracking/processInputRequest?tracknum=' + strTrackingNumber);
                    } else if (strAnswer === 'USPS') {
                         window.open('https://tools.usps.com/go/TrackConfirmAction?tLabels=' + strTrackingNumber);
                    } else if (strAnswer === 'Fedex') {
                         window.open('https://www.fedex.com/apps/fedextrack/index.html?tracknumbers=' + strTrackingNumber);
                    } else if (strAnswer === 'Royal Mail') {
                         window.open('https://www.royalmail.com/track-your-item?trackNumber' + strTrackingNumber);
                    } else if (strAnswer === 'Amazon') {
                         window.open(strTrackingNumber);
                    }
                });
            }
        }
    });
    
    defineButton('gs-skype-button', '', ['value'], '', function (element) {
        if (element.getAttribute('value')) {
            window.open('skype:' + element.getAttribute('value'));
        }
    });
    
    defineButton('gs-delete-button',
                 '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-delete-button.html',
                 ['value', 'src'],
                 function (selectedElement) {
        addProp('Source', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('src') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'src', this.value, false);
        });
        
        addProp('Delete Action', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('action-delete') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'action-delete', this.value);
        });
        
    }, function (element) {
        if (element.getAttribute('value')) {
            if (window.bolSocket === true) {
                var arrSrcParts = element.getAttribute('src').split('.')
                  , strSchema = arrSrcParts[0]
                  , strObject = arrSrcParts[1]
                  , strPkColumn, strLockColumn
                  , deleteRecordData, strHashColumns, strRoles, strColumns, strRecord
                  , strDeleteData, strHash, strPkValue, strLockValue;
                
                element.classList.remove('down');
                
                strPkColumn = element.getAttribute('column') || 'id';
                strLockColumn = strPkColumn;
                strHashColumns = strLockColumn;
                
                strPkValue = GS.encodeForTabDelimited(element.getAttribute('value') || '');
                strLockValue = element.getAttribute('value') || '';
                
                strRoles = 'pk\thash';
                strColumns = strPkColumn + '\thash';
                
                strHash = CryptoJS.MD5(strLockValue === 'NULL' ? '' : strLockValue).toString();
                
                strDeleteData = strPkValue + '\t' + strHash + '\n';
                strDeleteData = strRoles + '\n' + strColumns + '\n' + strDeleteData;
                
                // create delete transaction
                GS.addLoader(element, 'Creating Delete Transaction...');
                GS.requestDeleteFromSocket(
                    GS.envSocket, strSchema, strObject, strHashColumns, strDeleteData
                    , function (data, error, transactionID) {
                        if (error) {
                            GS.removeLoader(element);
                            GS.webSocketErrorDialog(data);
                        }
                    }
                    , function (data, error, transactionID, commitFunction, rollbackFunction) {
                        var arrElements, i, len, templateElement;
                        GS.removeLoader(element);
                        
                        if (!error) {
                            if (data !== 'TRANSACTION COMPLETED') {
                                
                            } else {
                                templateElement = document.createElement('template');
                                templateElement.innerHTML = ml(function () {/*
                                    <gs-page>
                                        <gs-header><center><h3>Are you sure...</h3></center></gs-header>
                                        <gs-body padded>
                                            <center>Are you sure you want to delete?</center>
                                        </gs-body>
                                        <gs-footer>
                                            <gs-grid>
                                                <gs-block><gs-button dialogclose>No</gs-button></gs-block>
                                                <gs-block><gs-button id="datasheet-focus-me" dialogclose bg-primary tabindex="0">Yes</gs-button></gs-block>
                                            </gs-grid>
                                        </gs-footer>
                                    </gs-page>
                                */});
                                
                                GS.openDialog(templateElement, function () {
                                    document.getElementById('datasheet-focus-me').focus();
                                    
                                }, function (event, strAnswer) {
                                    if (strAnswer === 'Yes') {
                                        commitFunction();
                                        GS.addLoader(element, 'Commiting Delete Transaction...');
                                    } else {
                                        rollbackFunction();
                                        GS.addLoader(element, 'Rolling Back Delete Transaction...');
                                    }
                                });
                            }
                            
                        } else {
                            rollbackFunction();
                            GS.webSocketErrorDialog(data);
                        }
                    }
                    , function (strAnswer, data, error) {
                        var arrElements, i, len;
                        GS.removeLoader(element);
                        
                        if (!error) {
                            if (strAnswer === 'COMMIT') {
                                GS.triggerEvent(element, 'success');
                                if (element.hasAttribute('onsuccess')) {
                                    new Function(element.getAttribute('onsuccess')).apply(element);
                                }
                            }
                            
                        } else {
                            getData(element);
                            GS.webSocketErrorDialog(data);
                        }
                    }
                );
            } else {
                GS.msgbox('Are you sure...', '<center>Are you sure you want to delete?</center>', ['No', 'Yes'], function (strAnswer) {
                    if (strAnswer === 'Yes') {
                        GS.addLoader('gs-delete', 'Deleting Record...');
                        
                        GS.ajaxJSON('/' + (element.getAttribute('action-delete') || 'env/action_delete'),
                                    'src=' + encodeURIComponent(GS.templateWithQuerystring(decodeURIComponent(element.getAttribute('src')))) +
                                    '&id=' + element.getAttribute('value'),
                                    function (data, error) {
                            GS.removeLoader('gs-delete');
                            
                            if (!error) {
                                GS.triggerEvent(element, 'success');
                                if (element.hasAttribute('onsuccess')) {
                                    new Function(element.getAttribute('onsuccess')).apply(element);
                                }
                                
                            } else {
                                GS.ajaxErrorDialog(data);
                            }
                        });
                    }
                });
            }
        }
    });
    
    defineButton('gs-option',
                 '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-optionbox.html',
                 [],
                 function (selectedElement) {},
                 function (element) {});
    
    defineButton('gs-dialog-button',
        '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-dialog-button.html',
        [],
        function (selectedElement) { // design code
            addProp('Template', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('template') || '') + '" mini></gs-text>', function () {
                return setOrRemoveTextAttribute(selectedElement, 'template', this.value, false);
            });
            
            addProp('Attach To Element', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('target-element') || '') + '" mini></gs-text>', function () {
                return setOrRemoveTextAttribute(selectedElement, 'target-element', this.value, false);
            });
            
            addProp('Attachment Direction', true, '<gs-select class="target" value="' + encodeHTML(selectedElement.getAttribute('direction') || '') + '" mini>' +
                                                        '<option value="">Default</option>' +
                                                        '<option value="left">Left</option>' +
                                                        '<option value="right">Right</option>' +
                                                        '<option value="up">Up</option>' +
                                                        '<option value="down">Down</option>' +
                                                  '</gs-select>', function () {
                return setOrRemoveTextAttribute(selectedElement, 'direction', this.value, false);
            });
            
            addProp('Before Open JS', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('before-open') || '') + '" mini></gs-text>', function () {
                return setOrRemoveTextAttribute(selectedElement, 'before-open', this.value, false);
            });
            
            addProp('After Open JS', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('after-open') || '') + '" mini></gs-text>', function () {
                return setOrRemoveTextAttribute(selectedElement, 'after-open', this.value, false);
            });
            
            addProp('Before Close JS', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('before-close') || '') + '" mini></gs-text>', function () {
                return setOrRemoveTextAttribute(selectedElement, 'before-close', this.value, false);
            });
            
            addProp('After Close JS', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('after-close') || '') + '" mini></gs-text>', function () {
                return setOrRemoveTextAttribute(selectedElement, 'after-close', this.value, false);
            });
        },
        function (element) {// on click
            var targetElement
              , strTemplate = element.getAttribute('template')
              , templateElement
              , strTargetSelector = element.getAttribute('target')
              , strDirection = element.getAttribute('direction')
              , strBeforeOpen = element.getAttribute('before-open')
              , strAfterOpen = element.getAttribute('after-open')
              , strBeforeClose = element.getAttribute('before-close')
              , strAfterClose = element.getAttribute('after-close')
              , afterOpenFunction
              , beforeCloseFunction
              , afterCloseFunction;
            
            templateElement = (strTemplate ? document.getElementById(strTemplate) : xtag.queryChildren(element, 'template')[0]);
            //console.log(templateElement);
            
            if (templateElement) {
                if (strBeforeOpen) {
                    new Function(strBeforeOpen).apply(element);
                }
                GS.triggerEvent(element, 'before-open');
                
                afterOpenFunction = function () {
                    if (strAfterOpen) {
                        new Function(strAfterOpen).apply(this);
                    }
                    GS.triggerEvent(element, 'after-open');
                };
                
                beforeCloseFunction = function (event, strAnswer) {
                    // if there is a before close function: run the code
                    if (strBeforeClose) {
                        // append a definition for the "strAnswer" variable before the code (the replace calls are to make the string safe)
                        new Function('var strAnswer = \'' + strAnswer.replace(/'/g, 'donTGueSsThiSUniTokEN1975') + '\'' +
                                                    '.replace(/donTGueSsThiSUniTokEN1975/g, \'\\\'\');\n' + strBeforeClose).apply(this);
                    }
                    GS.triggerEvent(element, 'before-close', {'strAnswer': strAnswer});
                };
                
                afterCloseFunction = function (event, strAnswer) {
                    // if there is a after close function: run the code
                    if (strAfterClose) {
                        // append a definition for the "strAnswer" variable before the code (the replace calls are to make the string safe)
                        new Function('var strAnswer = \'' + strAnswer.replace(/'/g, 'donTGueSsThiSUniTokEN1975') + '\'' +
                                                    '.replace(/donTGueSsThiSUniTokEN1975/g, \'\\\'\');\n' + strAfterClose).apply(element);
                    }
                    GS.triggerEvent(element, 'after-close', {'strAnswer': strAnswer});
                };
                
                if (strTargetSelector || element.hasAttribute('target')) {
                    strTargetSelector = (strTargetSelector || 'this');
                    targetElement = (strTargetSelector === 'this' ? element : document.querySelector(strTargetSelector));
                    strDirection = (strDirection || 'down');
                    
                    GS.openDialogToElement(targetElement, templateElement, strDirection,
                                            afterOpenFunction, beforeCloseFunction, afterCloseFunction);
                    
                } else {
                    GS.openDialog(templateElement, afterOpenFunction, beforeCloseFunction, afterCloseFunction);
                }
            }
        });
})();














window.addEventListener('design-register-element', function () {
    
    registerDesignSnippet('<gs-button>', '<gs-button>', 'gs-button>${1}</gs-button>');
    
    designRegisterElement('gs-button', '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-buttons-toggle.html');
    
    window.designElementProperty_GSBUTTON = function(selectedElement) {
        var strIconPos, strIconRotation;
        
        addProp('Icon', true, '<div flex-horizontal>' +
                              '     <gs-text id="prop-icon-input" class="target" value="' + (selectedElement.getAttribute('icon') || '') + '" mini flex></gs-text>' +
                              '     <gs-button id="prop-icon-picker-button" mini icononly icon="list"></gs-button>' +
                              '     <style>#prop-icon-picker-button:after {font-size: 1em;}</style>' +
                              '</div>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'icon', this.value);
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
        
        addProp('Href', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('href') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'href', this.value, false);
        });
        if (selectedElement.getAttribute('href')) {
            addProp('Target', true, '<gs-select class="target" value="' + encodeHTML(selectedElement.getAttribute('target') || '') + '" mini>' +
                                        '<option value="">New Window</option>' +
                                        '<option value="_self">Current Window</option>' +
                                    '</gs-select>', function () {
                return setOrRemoveTextAttribute(selectedElement, 'target', this.value, false);
            });
        }
        
        addProp('Jumbo', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('jumbo')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'jumbo', (this.value === 'true'), true);
        });
        
        addProp('Focusable', true, '<gs-checkbox class="target" value="' + (!selectedElement.hasAttribute('no-focus')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'no-focus', (this.value === 'true'), false);
        });
        
        // TABINDEX attribute
        addProp('Tabindex', true, '<gs-number class="target" value="' + encodeHTML(selectedElement.getAttribute('tabindex') || '0') + '" mini></gs-number>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'tabindex', this.value);
        });
        
        addProp('Inline', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('inline')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'inline', (this.value === 'true'), true);
        });
        addProp('Mini', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('mini')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'mini', (this.value === 'true'), true);
        });
        /*
        addProp('Emphasis', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('emphasis')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'emphasis', (this.value === 'true'), true);
        });
        */
        
        //<gs-button txt-info bg-success>
        
        // Font Color attributes
        var strFontAttribute = '';
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
        var strBackgroundAttribute = '';
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
        
        addProp('Key', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('key') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'key', this.value, false);
        });
        
        addProp('No Modifier Key For Hot Key', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('no-modifier-key') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'no-modifier-key', this.value === 'true', true);
        });
        
        // TEXT CONTENT
        addProp('Text', true, '<gs-text class="target" value="' + (selectedElement.textContent || '') + '" mini></gs-text>', function () {
            selectedElement.textContent = this.value;
            
            return selectedElement;
        });
        
        // TITLE attribute
        addProp('Title', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('title') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'title', this.value);
        });
        
        // DISABLED attribute
        addProp('Disabled', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('disabled') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'disabled', this.value === 'true', true);
        });
        
        // DIALOGCLOSE attribute
        addProp('Dialog Close', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('dialogclose') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'dialogclose', this.value === 'true', true);
        });
        
        // visibility attributes
        var strVisibilityAttribute = '';
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
        
        addProp('Corners', true,   '<div class="target">' +
                                        '<gs-grid>\n' +
                                        '    <gs-block>\n' +
                                        '        <gs-checkbox value="' + (!(selectedElement.hasAttribute('remove-all') ||
                                                                    selectedElement.hasAttribute('remove-top') ||
                                                                    selectedElement.hasAttribute('remove-left') ||
                                                                    selectedElement.hasAttribute('remove-top-left'))).toString() + 
                                                    '" remove-right remove-bottom id="round-top-left-corner________"></gs-checkbox>' +
                                                
                                        '        <gs-checkbox value="' + (!(selectedElement.hasAttribute('remove-all') ||
                                                                    selectedElement.hasAttribute('remove-bottom') ||
                                                                    selectedElement.hasAttribute('remove-left') ||
                                                                    selectedElement.hasAttribute('remove-bottom-left'))).toString() + 
                                                    '" remove-right remove-top id="round-bottom-left-corner________"></gs-checkbox>' +
                                        '    </gs-block>\n' +
                                        '    <gs-block>\n' +
                                        '        <gs-checkbox value="' + (!(selectedElement.hasAttribute('remove-all') ||
                                                                    selectedElement.hasAttribute('remove-top') ||
                                                                    selectedElement.hasAttribute('remove-right') ||
                                                                    selectedElement.hasAttribute('remove-top-right'))).toString() + 
                                                    '" remove-left remove-bottom id="round-top-right-corner________"></gs-checkbox>' +
                                                
                                        '        <gs-checkbox value="' + (!(selectedElement.hasAttribute('remove-all') ||
                                                                    selectedElement.hasAttribute('remove-bottom') ||
                                                                    selectedElement.hasAttribute('remove-right') ||
                                                                    selectedElement.hasAttribute('remove-bottom-right'))).toString() + 
                                                    '" remove-left remove-top id="round-bottom-right-corner________"></gs-checkbox>' +
                                        '    </gs-block>\n' +
                                        '</gs-grid>\n' +
                                    '</div>', function () {
            var topLeft     = document.getElementById('round-top-left-corner________').value === 'true',
                topRight    = document.getElementById('round-top-right-corner________').value === 'true',
                bottomLeft  = document.getElementById('round-bottom-left-corner________').value === 'true',
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
        
        // SUSPEND-CREATED attribute
        addProp('suspend-created', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-created') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suspend-created', this.value === 'true', true);
        });
        
        // SUSPEND-INSERTED attribute
        addProp('suspend-inserted', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-inserted') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suspend-inserted', this.value === 'true', true);
        });
    };
});





document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    
    function refreshAnchor(element) {
        var strLink = element.getAttribute('href') || element.getAttribute('value');
        
        if (element.anchorElement) {
            element.removeChild(element.anchorElement);
        }
        if (strLink) {
            element.anchorElement = document.createElement('a');
            element.anchorElement.setAttribute('gs-dynamic', '');
            element.anchorElement.setAttribute('target', element.getAttribute('target') || '_blank');
            element.anchorElement.setAttribute('href', strLink);
            
            if (element.getAttribute('onclick')) {
                element.anchorElement.setAttribute('onclick', element.getAttribute('onclick'));
            }
            
            if (element.hasAttribute('download')) {
                element.anchorElement.setAttribute('download', element.getAttribute('download'));
            }
            
            element.appendChild(element.anchorElement);
            
        }
    }
    
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
                    element.setAttribute('value', strQSValue);
                }
            } else {
                element.setAttribute('value', strQSValue);
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
        var strKey;
        
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                element.internal = {};
                saveDefaultAttributes(element);

                if (element.getAttribute('qs')) {
                    //var strQSValue = GS.qryGetVal(GS.getQueryString(), element.getAttribute('qs'));
                    //if (strQSValue !== '' || !element.getAttribute('value')) {
                    //    element.setAttribute('value', strQSValue);
                    //}
                    pushReplacePopHandler(element);
                    window.addEventListener('pushstate',    function () { pushReplacePopHandler(element); });
                    window.addEventListener('replacestate', function () { pushReplacePopHandler(element); });
                    window.addEventListener('popstate',     function () { pushReplacePopHandler(element); });
                }
                
                // add a tabindex to allow focus (if allowed)
                if (!element.hasAttribute('no-focus')) {
                    if ((!element.tabIndex) || element.tabIndex === -1) {
                        element.tabIndex = 0;
                    }
                } else {
                    element.removeAttribute('tabindex');
                }
                
                element.classList.remove('down');
                element.classList.remove('hover');
                
                if (!evt.touchDevice) {
                    element.addEventListener(evt.mousedown, function (event) {
                        element.classList.add('down');
                    });
                    
                    element.addEventListener(evt.mouseout, function (event) {
                        element.classList.remove('down');
                        element.classList.remove('hover');
                    });
                    
                    element.addEventListener(evt.mouseover, function (event) {
                        element.classList.remove('down');
                        element.classList.add('hover');
                    });
                    
                    element.addEventListener('keydown', function (event) {
                        if (!element.hasAttribute('disabled') &&
                            (event.keyCode === 13 || event.keyCode === 32)) {
                            element.classList.add('down');
                        }
                    });
                    
                    element.addEventListener('keyup', function (event) {
                        // if we are not disabled and we pressed return (13) or space (32): trigger click
                        if (!element.hasAttribute('disabled') && element.classList.contains('down') &&
                            (event.keyCode === 13 || event.keyCode === 32)) {
                            GS.triggerEvent(element, 'click');
                        }
                    });
                }
                
                refreshAnchor(element);
                
                element.addEventListener('click', function (event) {
                    element.classList.remove('down');
                });
                
                element.addEventListener('keypress', function (event) {
                    // if we pressed return (13) or space (32): prevent default and stop propagation (to prevent scrolling of the page)
                    if (event.keyCode === 13 || event.keyCode === 32) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                });
                
                strKey = element.getAttribute('key');
                
                if (strKey) {
                    if (GS.keyCode(strKey)) {
                        if (strKey.match(/[arfcvxzntypq]/gim)) {
                            console.warn('gs-button Warning: by setting the hot key of this button to "' + strKey + '" you may be overriding browser functionality.', element);
                        }
                        
                        window.addEventListener('keydown', function (event) {
                            if (
                                    String(event.keyCode || event.which) === GS.keyCode(strKey) &&
                                    (
                                        (
                                            element.hasAttribute('no-modifier-key') &&
                                            !event.metaKey &&
                                            !event.ctrlKey
                                        ) ||
                                        (
                                            !element.hasAttribute('no-modifier-key') &&
                                            (event.metaKey || event.ctrlKey)
                                        )
                                    )
                                ) {
                                event.preventDefault();
                                event.stopPropagation();
                                
                                element.focus();
                                GS.triggerEvent(element, 'click');
                            }
                        });
                        
                    } else if (strKey.length > 1) {
                        console.error('gs-button Error: \'key="' + strKey + '"\' is not a valid hot-key.', element);
                    }
                }
            }
        }
    }
    
    xtag.register('gs-button', {
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
                    if (strAttrName === 'no-focus') {
                        if (!this.hasAttribute('no-focus') && !this.hasAttribute('tabindex')) {
                            this.setAttribute('tabindex', 0);
                        } else if (this.hasAttribute('no-focus')) {
                            this.removeAttribute('tabindex');
                        }
                    } else if (strAttrName === 'disabled') {
                        this.classList.remove('down');
                        
                    } else if (strAttrName === 'href' || strAttrName === 'target' || strAttrName === 'onclick' || strAttrName === 'download') {
                        refreshAnchor(this);
                    }
                }
            }
        },
        events: {},
        accessors: {},
        methods: {}
    });
});