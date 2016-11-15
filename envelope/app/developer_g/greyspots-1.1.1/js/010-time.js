window.addEventListener('design-register-element', function () {
    
    registerDesignSnippet('<gs-time>', '<gs-time>', 'gs-time column="${1:name}"></gs-time>');
    registerDesignSnippet('<gs-time> With Label', '<gs-time>', 'label for="${1:time-insert-start_time}">${2:Start Time}:</label>\n' +
                                                               '<gs-time id="${1:time-insert-start_time}" column="${3:start_time}"></gs-time>');
    
    designRegisterElement('gs-time', (location.pathname.indexOf('/v1/') === 0 ? '/v1/dev/' : '/env/app/') + 'developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-time.html');
    
    window.designElementProperty_GSTIME = function(selectedElement) {
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
        
        addProp('Mini', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('mini')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'mini', (this.value === 'true'), true);
        });
        
        addProp('Time Picker', true, '<gs-checkbox class="target" value="' + (!selectedElement.hasAttribute('no-picker')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'no-picker', (this.value === 'true'), false);
        });
        
        addProp('Non-Empty', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('non-empty')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'non-empty', (this.value === 'true'), true);
        });
        
        addProp('Now Button', true, '<gs-checkbox class="target" value="' + (!selectedElement.hasAttribute('no-now-button')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'no-now-button', (this.value === 'true'), false);
        });
        
        addProp('Display Format', true, '<gs-select class="target" value="' + encodeHTML(selectedElement.getAttribute('format') || '') + '" mini>' +
                                    '<option value="">Regular (1:30 PM)</option>' +
                                    '<option value="military">Military (13:30)</option>' +
                                '</gs-select>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'format', this.value);
        });
        
        addProp('Output Format', true, '<gs-select class="target" value="' + encodeHTML(selectedElement.getAttribute('output-format') || '') + '" mini>' +
                                    '<option value="">Regular (1:30 PM)</option>' +
                                    '<option value="military">Military (13:30)</option>' +
                                '</gs-select>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'output-format', this.value);
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
        
        //// SUSPEND-CREATED attribute
        //addProp('suspend-created', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-created') || '') + '" mini></gs-checkbox>', function () {
        //    return setOrRemoveBooleanAttribute(selectedElement, 'suspend-created', this.value === 'true', true);
        //});
        
        // SUSPEND-INSERTED attribute
        addProp('suspend-inserted', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-inserted') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suspend-inserted', this.value === 'true', true);
        });
    };
});

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    var currentErrorControl;
    
    window.addEventListener('focus', function (event) {
        if (currentErrorControl && event.target !== currentErrorControl.control) {
            currentErrorControl.control.focus();
            if (currentErrorControl.control) {
                GS.setInputSelection(currentErrorControl.control, 0, currentErrorControl.control.value.length);
            }
        }
        
        if (currentErrorControl && currentErrorControl.control && currentErrorControl.control.value) {
            currentErrorControl = '';
        }
    });
    
    //x attributes:
    //x      placeholder:   copy to control element
    //x      disabled:      copy to control element
    //x      tabindex:      move to control element
    //x      qs:            fill value from querystring, update value as querystring changes
    //x      non-empty:     prevent leaving the field if value is empty, console warn if value starts as empty
    //x      format:        affects value translation when filling control
    //x      no-now-button: affects dropdown html and "n" key
    //x      value:         affects control value
    //x      no-picker:     affects innerHTML because it removes the picker button
    
    //x accessors:
    //x      value:     returns text value
    //x      dateValue: returns value as a date object
    //x      state:     returns text representation of state: "open" or "closed"
    
    //x methods:
    //x      open:   opens popup
    //x      close:  closes popup
    //x      toggle: toggles open and closed methods
    
    //x events:
    //x      picker button click: runs "toggle" method
    //x      control keydown:
    //x          up arrow:    next minute
    //x          down arrow:  previous minute
    //x          left arrow:  previous minute
    //x          right arrow: next minute
    //x          "c":         clear (if allowed)
    //x          "n":         now (if allowed)
    
    //x dropdown behaviours:
    //x      if from control to bottom is too small and from control to top is too small: dialog
    //x      else if window width < 400px: dialog
    //x      else if window height < 550px: dialog
    //x      else:
    //x          if from control to bottom has enough room: popup below
    //x          else: popup above
    
    // #####################################################################################
    // ################################## EVENT RETARGETING ################################
    // #####################################################################################
    
    // re-target change event from control to element
    function changeFunction(event) {
        event.preventDefault();
        event.stopPropagation();
        
        event.target.parentNode.setAttribute('value', event.target.value);
        //console.log('this is a test', event.target);
        handleChange(event.target.parentNode);
    }
    
    // re-target focus event from control to element
    function focusFunction(event) {
        GS.triggerEvent(event.target.parentNode, 'focus');
    }
    
    
    // #####################################################################################
    // ####################################### CONTROL #####################################
    // #####################################################################################
    
    function refreshControl(element) {
        var i, len, arrPassThroughAttributes, strHTML;
        
        // clear out HTML
        element.innerHTML = '';
        
        // clear out element variables
        element.control = '';
        element.button = '';
        
        // if we are not disabled:
        if (!element.hasAttribute('disabled')) {
            // build HTML
            strHTML = '<input class="control" gs-dynamic type="text" />';
            if (!element.hasAttribute('no-picker')) {
                strHTML += '<gs-button class="time-picker-button" gs-dynamic inline icononly icon="clock-o" no-focus></gs-button>';
            }
            
            // set control HTML
            element.innerHTML = strHTML;
            
            // fill element variables
            element.control = element.children[0];
            element.button = element.children[1];
            
            // handle passthrough attributes
            arrPassThroughAttributes = [
                'placeholder',
                'name',
                'maxlength',
                'autocorrect',
                'autocapitalize',
                'autocomplete',
                'autofocus',
                'spellcheck'
            ];
            
            for (i = 0, len = arrPassThroughAttributes.length; i < len; i += 1) {
                if (element.hasAttribute(arrPassThroughAttributes[i])) {
                    element.control.setAttribute(arrPassThroughAttributes[i], element.getAttribute(arrPassThroughAttributes[i]) || '');
                }
            }
            
            // move tabindex
            if (element.hasAttribute('tabindex')) {
                element.oldTabIndex = element.getAttribute('tabindex');
                element.removeAttribute('tabindex');
            }
            
            if (element.oldTabIndex) {
                element.control.tabIndex = element.oldTabIndex;
            }
            
            // bind control retargeting
            element.control.removeEventListener('change', changeFunction);
            element.control.addEventListener('change', changeFunction);
            
            element.control.removeEventListener('focus', focusFunction);
            element.control.addEventListener('focus', focusFunction);
        }
        
        // display value
        setValueDisplay(element, element.getAttribute('value'));
    }
    
    function handleChange(element) {
        element.close();
        if (handleNonEmpty(element) && element.lastChangeValue !== element.getAttribute('value')) {
            GS.triggerEvent(element, 'change');
            element.lastChangeValue = element.getAttribute('value');
        }
    }
    
    function handleNonEmpty(element) {
        var bolAllClear = true;

        if (element.hasAttribute('non-empty') && !element.getAttribute('value')) {
            bolAllClear = false;
            currentErrorControl = element;
            alert('Error: Invalid Time. Please input a time.');
            element.open();
        }

        return bolAllClear;
    }


    // #####################################################################################
    // ######################################## VALUE ######################################
    // #####################################################################################

    // translate inputed value to a format that is allowed. no seconds as of yet, defaults to AM
    function translateValue(strFormat, newValue) {
        var translatedValue, valueDate, strHour, strMinute, strPeriod, arrParts, intHours;

        // coalesce value
        newValue = newValue || '';

        // if value is a string: parse
        if (typeof newValue === 'string') {
            // input types:
            //      "1530"          => "15:30"
            //      "0330"          => "03:30"
            //      "3:30"          => "3:30"
            //      "3:30PM"        => "3:30 PM" (all cases/variations of PM/AM) ('a', 'p', 'am', 'pm', 'Am', 'Pm', 'AM', 'PM')
            //      "330"           => "3:30"
            //      "3"             => "3:00"
            //      "12"            => "12:00"
            //      "12PM"          => "12:00 PM" (all cases/variations of PM/AM) ('a', 'p', 'am', 'pm', 'Am', 'Pm', 'AM', 'PM')
            //      "12:30:12 PM"   => "12:30 PM" (no seconds as of yet)
            //      "123012"        => "12:30" (no seconds as of yet)

            // extract period
            strPeriod = (newValue.match(/pm|am|a|p/gi) || [''])[0].toLowerCase();
            newValue  = newValue.replace(/[^0-9:]/gi, '');

            if (strPeriod) {
                strPeriod = (strPeriod[0] === 'a' ? 'AM' : 'PM');
            }

            if (newValue) {
                // if there are colon(s): split on colons
                if ((/:/).test(newValue)) {
                    arrParts = newValue.split(':');

                    strHour = arrParts[0];
                    strMinute = GS.leftPad(arrParts[1], '0', 2);

                    // if hour is greater than 12: subtract 12 and set period to PM
                    if (parseInt(strHour, 10) > 12) {
                        strHour = parseInt(strHour, 10) - 12;
                        strPeriod = 'PM';
                    }

                // else (if there are just numbers)
                } else {
                    newValue = newValue.substring(0, 4);

                    // if the new value is 3 or 4 characters long: last 2 are minute and the rest is hour
                    if (newValue.length >= 3) {
                        strMinute = newValue.substring(newValue.length - 2);
                        strHour = newValue.substring(0, newValue.length - 2);

                        // if hour is greater than 12: subtract 12 and set period to PM
                        if (parseInt(strHour, 10) > 12) {
                            strHour = parseInt(strHour, 10) - 12;
                            strPeriod = 'PM';
                        }

                    // else:
                    } else {
                        newValue = parseInt(newValue, 10);

                        // if (format is military AND number > 24) OR (format isn't military AND number > 12): newValue is minute
                        if ((strFormat === 'military') && newValue > 24 || (strFormat !== 'military') && newValue > 12) {
                            strHour = '12';
                            strMinute = String(newValue);
                        } else {
                            strHour = String(newValue);
                            strMinute = '00';
                        }
                    }
                }
            }

            if (strHour && strMinute) {
                if (!strPeriod) {
                    if (parseInt(strHour, 10) < 6 || parseInt(strHour, 10) === 12) {
                        strPeriod = 'PM';
                    } else {
                        strPeriod = 'AM';
                    }
                }
                valueDate = new Date('1/1/1111 ' + strHour + ':' + strMinute + ' ' + strPeriod);
            }
        // else: just copy date object
        } else {
            valueDate = new Date(newValue);
        }

        //console.log(strHour, strMinute, strPeriod);

        // if we have enough data to make a value
        if (valueDate) {
            // output types:
            //      regular time:  "3:30 PM"
            //      military time: "15:30"

            if (strFormat === 'military') {
                translatedValue = GS.leftPad(valueDate.getHours(), '0', 2) + ':' +
                                  GS.leftPad(valueDate.getMinutes(), '0', 2);
            } else {
                intHours = valueDate.getHours();

                if (intHours >= 12) {
                    intHours = intHours - 12;
                }
                if (intHours === 0) {
                    intHours = 12;
                }

                translatedValue = intHours + ':' +
                                  GS.leftPad(valueDate.getMinutes(), '0', 2) + ' ' +
                                  (valueDate.getHours() >= 12 ? 'PM' : 'AM');
            }
        } else {
            translatedValue = '';
        }

        return translatedValue;
    }
    
    function setValueDisplay(element, newValue) {
        var translatedOutputValue = translateValue((element.getAttribute('output-format') === 'military' ? 'military' : 'regular'), newValue),
            translatedDisplayValue = translateValue((element.getAttribute('format') === 'military' ? 'military' : 'regular'), newValue);
        
        element.setAttribute('value', translatedOutputValue);
        
        if (!element.hasAttribute('disabled')) {
            element.control.value = translatedDisplayValue;
        } else {
            element.textContent = translatedDisplayValue || element.getAttribute('placeholder') || '';
        }
        
        if (element.innerState === 'open') {
            refreshPickerValue(element);
        }
    }
    
    function refreshPickerValue(element) {
        var arrElements, strTranslatedValue, dteTranslatedValue, i, len, intHours;
        
        if (element.innerState === 'open') {
            strTranslatedValue = translateValue((element.getAttribute('format') === 'military' ? 'military' : 'regular'), element.getAttribute('value'));
            dteTranslatedValue = new Date('1/1/1111 ' + strTranslatedValue);
            
            element.pickerModalControlElement.setAttribute('value', strTranslatedValue);
            
            arrElements = xtag.query(element.pickerContainerElement, '.selected');
            
            for (i = 0, len = arrElements.length; i < len; i += 1) {
                arrElements[i].classList.remove('selected');
            }
            
            
            intHours = dteTranslatedValue.getHours();
            
            if (intHours >= 12) {
                intHours = intHours - 12;
            }
            if (intHours === 0) {
                intHours = 12;
            }
            
            xtag.query(element.pickerContainerElement,
                '.clock-hour[data-value="' + intHours + '"]')[0].classList.add('selected');
            xtag.query(element.pickerContainerElement,
                '.clock-minute[data-value="' + (Math.floor(dteTranslatedValue.getMinutes() / 5) * 5) + '"]')[0].classList.add('selected');
            xtag.query(element.pickerContainerElement,
                '.clock-period-switch.' + (dteTranslatedValue.getHours() >= 12 ? 'pm' : 'am'))[0].classList.add('selected');
        }
    }
    
    
    // #####################################################################################
    // ##################################### QUERYSTRING ###################################
    // #####################################################################################
    
    function handleQS(element) {
        var strQSValue;
        
        if (!element.qsEventFunction) {
            element.qsEventFunction = function () {
                pushReplacePopHandler(element);
            };
        }
        
        window.removeEventListener('pushstate',    element.qsEventFunction);
        window.removeEventListener('replacestate', element.qsEventFunction);
        window.removeEventListener('popstate',     element.qsEventFunction);
        
        // handle "qs" attribute
        if (element.getAttribute('qs')) {
            strQSValue = GS.qryGetVal(GS.getQueryString(), element.getAttribute('qs'));
            
            if (strQSValue !== '' || !element.getAttribute('value')) {
                element.setAttribute('value', strQSValue);
            }
            
            window.addEventListener('pushstate',    element.qsEventFunction);
            window.addEventListener('replacestate', element.qsEventFunction);
            window.addEventListener('popstate',     element.qsEventFunction);
        }
    }
    
    function pushReplacePopHandler(element) {
        var strQueryString = GS.getQueryString(), strQSCol = element.getAttribute('qs');
        
        if (GS.qryGetKeys(strQueryString).indexOf(strQSCol) > -1) {
            element.setAttribute('value', GS.qryGetVal(strQueryString, strQSCol));
        }
    }
    
    
    // #####################################################################################
    // ###################################### LIFECYCLE ####################################
    // #####################################################################################
    
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
            }
            
        }
    }
    
    //
    function elementInserted(element) {
        var now, strQSValue;
        
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.innerState = 'closed';
                
                // if value attribute = now: set value attribute to the current time
                if (element.getAttribute('value') === 'now') {
                    now = new Date();
                    
                    if (now.getHours() > 12) {
                        now = GS.leftPad(now.getHours() - 12, '0', 2) + ':' + GS.leftPad(now.getMinutes(), '0', 2) + ' PM';
                    } else {
                        now = GS.leftPad(now.getHours(), '0', 2) + ':' + GS.leftPad(now.getMinutes(), '0', 2) + ' AM';
                    }
                    
                    element.setAttribute('value', now);
                }
                
                element.inserted = true;
                
                refreshControl(element);
                
                if (element.getAttribute('qs')) {
                    handleQS(element);
                }
                
                element.lastChangeValue = element.getAttribute('value');
                
                if (element.hasAttribute('non-empty') && !element.getAttribute('value')) {
                    console.warn('gs-time Warning: No value provided on "non-empty" gs-time control. Defaulting to "12:00 PM". Please provide a default value.');
                    element.setAttribute('value', '12:00 PM');
                }
            }
        }
    }
    
    
    // ######################################################################################
    // ##################################### REGISTRATION ###################################
    // ######################################################################################
    
    xtag.register('gs-time', {
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
                    if (strAttrName === 'placeholder' ||
                        strAttrName === 'disabled' ||
                        strAttrName === 'format' ||
                        strAttrName === 'no-picker' ||
                        strAttrName === 'tabindex') {
                        refreshControl(this);
                        
                    } else if (strAttrName === 'qs') {
                        handleQS(this);
                        
                    } else if (strAttrName === 'value' && this.inserted) {// && this.control
                        setValueDisplay(this, newValue);
                    }
                }
            }
        },
        events: {
            'click': function (event) {
                if (event.target === this.button) {
                    this.toggle();
                }
            },
            'keydown:': function (event) {
                var intKeyCode = (event.keyCode || event.which), newControlValue;
                
                if (!this.hasAttribute('no-keys')) {
                    if (this.getAttribute('value') && (intKeyCode === 38 || intKeyCode === 39 || intKeyCode === 40 || intKeyCode === 37)) {
                        newControlValue = new Date('1/1/1111 ' + this.getAttribute('value'));
                        event.preventDefault();
                        event.stopPropagation();
                        
                        // up arrow:    next minute
                        // right arrow: next minute
                        if (intKeyCode === 38 || intKeyCode === 39) {
                            newControlValue = newControlValue.setMinutes(newControlValue.getMinutes() + 1);
                            
                        // down arrow: previous minute
                        // left arrow: previous minute
                        } else if (intKeyCode === 40 || intKeyCode === 37) {
                            newControlValue = newControlValue.setMinutes(newControlValue.getMinutes() - 1);
                        }
                    }
                    
                    // "c": clear (if allowed)
                    if (intKeyCode === 67 && !event.ctrlKey && !event.metaKey && !this.hasAttribute('non-empty')) {
                        newControlValue = '';
                        event.preventDefault();
                        event.stopPropagation();
                        
                    // "n": now (if allowed)
                    } else if (intKeyCode === 78 && !event.ctrlKey && !event.metaKey && !this.hasAttribute('no-now-button')) {
                        newControlValue = new Date();
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    
                    if (newControlValue !== undefined) {
                        setValueDisplay(this, newControlValue);
                        GS.setInputSelection(this.control, 0, this.control.value.length);
                    }
                    
                    if (intKeyCode === 13) {
                        handleNonEmpty(this);
                    }
                }
            },
            'focusout': function (event) {
                if (this.innerState === 'open') {
                    this.close();
                } else {
                    handleChange(this);
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
            },
            dateValue: {
                get: function () {
                    return new Date('1/1/1111 ' + this.getAttribute('value'));
                },
                set: function (newValue) {
                    setValueDisplay(this, newValue);
                }
            },
            state: {
                get: function () {
                    return this.innerState;
                },
                set: function (newValue) {
                    if (newValue === 'open') {
                        this.open();
                    } else {
                        this.close();
                    }
                }
            }
        },
        methods: {
            focus: function () {
                this.control.focus();
            },
            
            open: function () {
                var element = this, pickerContainerElement, overlayElement, pickerElement, handleLook, strHTML;
                
                if (element.innerState === 'closed') {
                    element.innerState = 'open';
                    element.lastClosedValue = element.getAttribute('value');
                    
                    // if we are not on a touch device: focus control
                    if (!evt.touchDevice) {
                        element.control.focus();
                        GS.setInputSelection(element.control, 0, element.control.value.length);
                        
                    } else {
                        //this.control.focus()
                        //this.control.blur();
                    }
                    
                    // create picker elements
                    pickerContainerElement = document.createElement('div');
                    pickerContainerElement.classList.add('gs-time-time-picker-container');
                    
                    overlayElement = document.createElement('div');
                    overlayElement.classList.add('gs-time-time-picker-overlay');
                    
                    pickerElement = document.createElement('div');
                    pickerElement.classList.add('gs-time-time-picker');
                    
                    // save picker container
                    element.pickerContainerElement = pickerContainerElement;
                    
                    // append picker elements
                    pickerContainerElement.appendChild(overlayElement);
                    pickerContainerElement.appendChild(pickerElement);
                    
                    document.body.appendChild(pickerContainerElement);
                    
                    // fill picker popup
                    strHTML = ml(function () {/*
                        <div class="time-modal-control-container" flex-horizontal>
                            <gs-text class="time-modal-control" flex></gs-text>
                            <gs-button class="modal-done">Done</gs-button>
                        </div>
                        <div class="time-inner-container">
                            <div class="time-top-toolbar">
                                <div flex-horizontal align-bottom>
                                    <gs-button class="decrement-time" icononly icon="arrow-left"></gs-button>
                                    <div flex></div>
                                    <gs-button class="increment-time" icononly icon="arrow-right"></gs-button>
                                </div>
                            </div>
                            <div class="gs-time-clock-container" prevent-text-selection>
                                <div class="gs-time-bezel">
                                    <div class="clock-face-layer layer-1">
                                        <div class="clock-line" style="top: 0%;"><div class="clock-button clock-hour" data-value="12"><span class="content">12</span></div></div><div class="clock-line" style="top: 5.9%;"><div class="clock-split" style="width: 45.25%;
left: 4.5%;"><div class="clock-button clock-hour" data-value="11"><span class="content">11</span></div></div><div class="clock-split" style="width: 45.25%;
left: 46.75%;"><div class="clock-button clock-hour" data-value="1">&nbsp;<span class="content">1</span></div></div></div><div class="clock-line" style="top: 22.5%;"><div class="clock-split" style="width: 22%;
left: 0%;"><div class="clock-button clock-hour" data-value="10"><span class="content">10</span></div></div><div class="clock-split" style="width: 22%;
left: 78%;"><div class="clock-button clock-hour" data-value="2">&nbsp;<span class="content">2</span></div></div></div><div class="clock-line" style="top: 45.3%;"><div class="clock-split" style="width: 14%;
left: 0%;"><div class="clock-button clock-hour" data-value="9"><span class="content">9</span>&nbsp;</div></div><div class="clock-split" style="width: 14%;
left: 86%;"><div class="clock-button clock-hour" data-value="3">&nbsp;<span class="content">3</span></div></div></div><div class="clock-line" style="top: 67.8%;"><div class="clock-split" style="width: 22%;
left: 0%;"><div class="clock-button clock-hour" data-value="8"><span class="content">8</span>&nbsp;</div></div><div class="clock-split" style="width: 22%;
left: 78%"><div class="clock-button clock-hour" data-value="4">&nbsp;<span class="content">4</span></div></div></div><div class="clock-line" style="top: 83.5%;"><div class="clock-split" style="width: 45.25%;
left: 4.5%;"><div class="clock-button clock-hour" data-value="7"><span class="content">7</span>&nbsp;</div></div><div class="clock-split" style="width: 45.25%;
left: 46.75%;"><div class="clock-button clock-hour" data-value="5">&nbsp;<span class="content">5</span></div></div></div><div class="clock-line" style="top: 90%;"><div class="clock-button clock-hour" data-value="6"><span class="content">6</span></div></div>
                                    </div>
                                    <div class="clock-face-layer layer-2">
                                        <div class="clock-line" style="top: 0%;"><div class="clock-button clock-minute" data-value="0"><span class="content">00</span></div></div>
                                        <div class="clock-line" style="top: 5.9%;"><div class="clock-split" style="width: 45.25%;
left: 4.5%;"><div class="clock-button clock-minute" data-value="55"><span class="content">55</span></div></div><div class="clock-split" style="width: 45.25%;
left: 49.75%;"><div class="clock-button clock-minute" data-value="5"><span class="content">05</span></div></div></div>
                                        <div class="clock-line" style="top: 22.5%;"><div class="clock-split" style="width: 22%;
left: 0%;"><div class="clock-button clock-minute" data-value="50"><span class="content">50</span></div></div><div class="clock-split" style="width: 22%;
left: 78%;"><div class="clock-button clock-minute" data-value="10"><span class="content">10</span></div></div></div>
                                        <div class="clock-line" style="top: 45.3%;"><div class="clock-split" style="width: 16%;
left: 0%;"><div class="clock-button clock-minute" data-value="45"><span class="content">45</span></div></div><div class="clock-split" style="width: 16%;
left: 84%;"><div class="clock-button clock-minute" data-value="15"><span class="content">15</span></div></div></div>
                                        <div class="clock-line" style="top: 67.8%;"><div class="clock-split" style="width: 22%;
left: 0%;"><div class="clock-button clock-minute" data-value="40"><span class="content">40</span></div></div><div class="clock-split" style="width: 22%;
left: 78%;"><div class="clock-button clock-minute" data-value="20"><span class="content">20</span></div></div></div>
                                        <div class="clock-line" style="top: 83.5%;"><div class="clock-split" style="width: 45.25%;
left: 4.5%;"><div class="clock-button clock-minute" data-value="35"><span class="content">35</span></div></div><div class="clock-split" style="width: 45.25%;
left: 49.75%;"><div class="clock-button clock-minute" data-value="25"><span class="content">25</span></div></div></div>
                                        <div class="clock-line" style="top: 90%;"><div class="clock-button clock-minute" data-value="30"><span class="content">30</span></div></div>
                                        <div class="clock-center"><div class="clock-period-switch am"><span class="content">AM</span></div><div class="clock-period-switch pm"><span class="content">PM</span></div></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    */});
                    
                    strHTML += '<div class="time-bottom-toolbar">' +
                                    '<div flex-horizontal align-top>';
                    
                    if (!element.hasAttribute('no-now-button')) {
                        strHTML += '<gs-button class="now-time">Now</gs-button>';
                    }
                    
                    strHTML += '<gs-button class="done" flex>Done</gs-button>';
                    
                    if (!element.hasAttribute('non-empty')) {
                        strHTML += '<gs-button class="clear-time">Clear</gs-button>';
                    }
                    
                    strHTML +=      '</div>' +
                                '</div>';
                    
                    pickerElement.innerHTML = strHTML;
                    
                    // save picker control
                    element.pickerModalControlElement = xtag.query(pickerContainerElement, '.time-modal-control')[0];
                    
                    // set picker value
                    refreshPickerValue(element);
                    
                    // bind picker control change
                    element.pickerModalControlElement.addEventListener('change', function (event) {
                        setValueDisplay(element, this.value);
                    });
                    
                    // bind picker control keydown
                    element.pickerModalControlElement.addEventListener('keydown', function (event) {
                        if ((event.keyCode || event.which) === 13) {
                            element.close();
                        }
                    });
                    
                    // bind picker click
                    pickerElement.addEventListener('mousedown', function (event) {
                        if (!evt.touchDevice) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    });
                    
                    //console.log('0***', pickerElement);
                    pickerElement.addEventListener('click', function (event) {
                        var target = event.target, arrElements, i, len, newValue;
                        
                        //console.log('1***', newValue);
                        
                        if (target.classList.contains('content')) {
                            target = target.parentNode;
                        }
                        
                        if (target.classList.contains('clock-button') || target.classList.contains('clock-period-switch')) {
                            if (target.classList.contains('clock-hour')) {
                                arrElements = xtag.query(pickerElement, '.clock-hour');
                            }
                            if (target.classList.contains('clock-minute')) {
                                arrElements = xtag.query(pickerElement, '.clock-minute');
                            }
                            if (target.classList.contains('clock-period-switch')) {
                                arrElements = xtag.query(pickerElement, '.clock-period-switch');
                            }
                            
                            for (i = 0, len = arrElements.length; i < len; i += 1) {
                                arrElements[i].classList.remove('selected');
                            }
                            
                            target.classList.add('selected');
                            
                            arrElements = xtag.query(pickerElement, '.selected');
                            if (arrElements.length === 3) {
                                newValue = arrElements[0].textContent + ':' +
                                           arrElements[1].textContent + ' ' +
                                           arrElements[2].textContent;
                            }
                        }
                        
                        if (target.classList.contains('increment-time') && element.getAttribute('value')) {
                            newValue = new Date('1/1/1111 ' + element.getAttribute('value'));
                            newValue = newValue.setMinutes(newValue.getMinutes() + 1);
                            
                        } else if (target.classList.contains('decrement-time') && element.getAttribute('value')) {
                            newValue = new Date('1/1/1111 ' + element.getAttribute('value'));
                            newValue = newValue.setMinutes(newValue.getMinutes() - 1);
                            
                        } else if (target.classList.contains('now-time')) {
                            newValue = new Date();
                            
                        } else if (target.classList.contains('clear-time')) {
                            newValue = '';
                        } else if (target.classList.contains('modal-done') || target.classList.contains('done')) {
                            element.close();
                        }
                        
                        //console.log('2***', newValue);
                        if (newValue !== undefined) {
                            setValueDisplay(element, newValue);
                            //console.log('3***', element, element.getAttribute('value'), element.value);
                            
                            if (!evt.touchDevice) {
                                GS.setInputSelection(element.control, 0, element.control.value.length);
                            }
                        }
                    });
                    
                    // handle/bind positioning and look
                    handleLook = function () {
                        var positionData, intPopupHeight, intPopupWidth;
                        
                        if (pickerContainerElement.parentNode !== document.body) {
                            window.removeEventListener('resize', handleLook);
                            window.removeEventListener('orientationchange', handleLook);
                            return;
                        }
                        
                        // clear current styles
                        pickerElement.style.top = '';
                        pickerElement.style.left = '';
                        pickerElement.style.marginTop = '';
                        pickerContainerElement.classList.remove('modal');
                        
                        // get position/size data
                        positionData = GS.getElementPositionData(element);
                        intPopupHeight = pickerElement.offsetHeight;
                        intPopupWidth = pickerElement.offsetWidth;
                        
                        // if from control to bottom is too small and from control to top is too small
                        //      OR window width < 400px: dialog
                        //      OR window height < 550px: dialog
                        if ((positionData.intRoomAbove < intPopupHeight && positionData.intRoomBelow < intPopupHeight) ||
                            window.innerWidth < 400 ||
                            window.innerHeight < 550) {
                            // dialog mode
                            pickerElement.style.marginTop = '1em';
                            pickerContainerElement.classList.add('modal');
                            
                        } else {
                            // if from control to bottom has enough room: popup below
                            if (positionData.intRoomBelow > intPopupHeight) {
                                pickerElement.style.top  = (positionData.objElementOffset.top + positionData.intElementHeight) + 'px';
                                
                            // else: popup above
                            } else {
                                pickerElement.style.top  = (positionData.objElementOffset.top - intPopupHeight) + 'px';
                            }
                            
                            pickerElement.style.left =
                                ((positionData.objElementOffset.left + positionData.intElementWidth) - intPopupWidth) + 'px';
                        }
                    };
                    
                    handleLook();
                    
                    window.addEventListener('resize', handleLook);
                    window.addEventListener('orientationchange', handleLook);
                }
            },
            
            close: function () {
                var element = this;
                
                if (element.innerState === 'open') {
                    element.innerState = 'closed';
                    //console.trace('closed', element.pickerContainerElement);
                    if (element.pickerContainerElement) {
                        document.body.removeChild(element.pickerContainerElement);
                        element.pickerContainerElement = '';
                    }
                    
                    if (element.getAttribute('value') !== element.lastClosedValue) {
                        handleChange(element);
                    } else if (!element.getAttribute('value')) {
                        handleNonEmpty(element);
                    }
                }
            },
            
            toggle: function () {
                if (this.innerState === 'open') {
                    this.close();
                } else {
                    this.open();
                }
            }
        }
    });
});