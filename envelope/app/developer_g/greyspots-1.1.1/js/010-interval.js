//global GS, window, document, xtag, evt, ml, encodeHTML, addFlexProps, setOrRemoveTextAttribute, setOrRemoveBooleanAttribute, addProp

window.addEventListener('design-register-element', function () {
    'use strict';

    registerDesignSnippet('<gs-interval>', '<gs-interval>', 'gs-interval column="${1:complete_time}"></gs-interval>');
    registerDesignSnippet('<gs-interval> With Label', '<gs-interval>', 'label for="${1:interval-insert-complete_time}">${2:Time to complete}:</label>\n' +
                                                               '<gs-interval id="${1:interval-insert-complete_time}" column="${3:complete_time}"></gs-interval>');
    
    designRegisterElement('gs-interval', '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-interval.html');

    window.designElementProperty_GSINTERVAL = function (selectedElement) {
        addProp('Column', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('column') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'column', this.value);
        });

        addProp('Value', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('value') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'value', this.value);
        });

        addProp('Column In Querystring', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('qs') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'qs', this.value, false);
        });

        addProp('Mini', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('mini')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'mini', (this.value === 'true'), true);
        });

        addProp('Time Picker', true, '<gs-checkbox class="target" value="' + (!selectedElement.hasAttribute('no-picker')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'no-picker', (this.value === 'true'), false);
        });

        addProp(
            'Unit',
            true,
            '        <gs-select class="target" value="' + encodeHTML(selectedElement.getAttribute('unit') || 'hours') + '" mini>' +
                    '    <option value="hours">Hours</option>' +
                    '    <option value="minutes">Minutes</option>' +
                    '    <option value="seconds">Seconds</option>' +
                    '</gs-select>',
            function () {
                return setOrRemoveTextAttribute(selectedElement, 'unit', this.value);
            }
        );

        addProp('Hour Places', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('hour-places') || '3') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'hour-places', this.value);
        });

        // TITLE attribute
        addProp('Title', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('title') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'title', this.value);
        });

        // TABINDEX attribute
        addProp('Tabindex', true, '<gs-number class="target" value="' + encodeHTML(selectedElement.getAttribute('tabindex') || '') + '" mini></gs-number>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'tabindex', this.value);
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

        addProp('Visibility',
                true,
                '<gs-select class="target" value="' + strVisibilityAttribute + '" mini>' +
                '    <option value="">Visible</option>' +
                '    <option value="hidden">Invisible</option>' +
                '    <option value="hide-on-desktop">Invisible at desktop size</option>' +
                '    <option value="hide-on-tablet">Invisible at tablet size</option>' +
                '    <option value="hide-on-phone">Invisible at phone size</option>' +
                '    <option value="show-on-desktop">Visible at desktop size</option>' +
                '    <option value="show-on-tablet">Visible at tablet size</option>' +
                '    <option value="show-on-phone">Visible at phone size</option>' +
                '</gs-select>',
                function () {
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

        addFlexProps(selectedElement);

        // SUSPEND-CREATED attribute
        addProp('suspend-created', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-created') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suspend-created', this.value === 'true', true);
        });

        // SUSPEND-INSERTED attribute
        addProp('suspend-inserted', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-inserted') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suspend-inserted', this.value === 'true', true);
        });
        
        addProp('Readonly', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('readonly') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'readonly', this.value === 'true', true);
        });
    };
});


document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    //x attributes:
    //x      disabled:      copy to control element
    //x      tabindex:      move to control element
    //x      qs:            fill value from querystring, update value as querystring changes
    //x      value:         affects control value
    //x      no-picker:     affects innerHTML because it removes the picker button
    //x      unit
    //x      hour-places
    //x      minute-places
    //x      second-places

    //x accessors:
    //x      value:     returns text value
    //x      state:     returns text representation of state: "open" or "closed"

    //x methods:
    //x      open:   opens popup
    //x      close:  closes popup
    //x      toggle: toggles open and closed methods

    //x text editing behaviours:
    //x      text is divided by colons into portions
    //x      if value is deleted or empty, it displays with zeros

    //x events:
    //x      picker button click: runs "toggle" method
    //x      control keydown:
    //x          up arrow:    increase currently selected portion
    //x          down arrow:  previous minute
    //x          left arrow:  select previous portion
    //x          right arrow: select next portion

    //x dropdown behaviours:
    //x          if from control to bottom has enough room: popup below
    //x          else: popup above

    /*
        unit:
            hours: shows hours only
            minutes: shows minutes and hours
            seconds: shows seconds, minutes and hours
        hour-places: allows the dev to choose the maximum places in the hours
    */


    // #####################################################################################
    // ################################## EVENT  TRIGGERING ################################
    // #####################################################################################

    function handleChange(element) {
        element.close();
        if (element.lastChangeValue !== element.getAttribute('value')) {
            GS.triggerEvent(element, 'change');
            element.lastChangeValue = element.getAttribute('value');
        }
    }

    // #####################################################################################
    // ################################## EVENT RETARGETING ################################
    // #####################################################################################

    // re-target change event from control to element
    function changeFunction(event) {
        event.preventDefault();
        event.stopPropagation();

        event.target.parentNode.setAttribute('value', event.target.value);
        handleChange(event.target.parentNode);
    }

    // re-target focus event from control to element
    function focusFunction(event) {
        GS.triggerEvent(event.target.parentNode, 'focus');
        event.target.parentNode.classList.add('focus');
    }

    // re-target blur event from control to element
    function blurFunction(event) {
        GS.triggerEvent(event.target.parentNode, 'blur');
        event.target.parentNode.classList.remove('focus');
    }

    // mouseout, remove hover class
    function mouseoutFunction(event) {
        GS.triggerEvent(event.target.parentNode, evt.mouseout);
        event.target.parentNode.classList.remove('hover');
    }

    // mouseover, add hover class
    function mouseoverFunction(event) {
        GS.triggerEvent(event.target.parentNode, evt.mouseover);
        event.target.parentNode.classList.add('hover');
    }


    // #####################################################################################
    // ######################################## VALUE ######################################
    // #####################################################################################

    //console.log('1***', translateValue(GS.stringToElement('<gs-interval unit="hours"></gs-interval>'), '5.255')); // 5 hours, 15 mins, 30 seconds
    //console.log('2***', translateValue(GS.stringToElement('<gs-interval unit="minutes"></gs-interval>'), '500.25')); // 8 hours, 20 mins, 15 seconds
    //console.log('3***', translateValue(GS.stringToElement('<gs-interval unit="seconds"></gs-interval>'), '5000')); // 1 hour, 23 mins, 20 seconds
    //console.log('4***', translateValue(GS.stringToElement('<gs-interval unit="seconds"></gs-interval>'), '0.03333333333333333')); // 2 mins

    function valueGetCurrentNumber(element) {
        var intValue = 0;

        if (element.internal.unit === 'minutes') {
            intValue += (element.internal.value.hours * 60);
            intValue += element.internal.value.minutes;
            //intValue += (element.internal.value.seconds / 60);
        } else if (element.internal.unit === 'seconds') {
            intValue += ((element.internal.value.hours * 60) * 60);
            intValue += (element.internal.value.minutes * 60);
            intValue += element.internal.value.seconds;
        } else {//hours
            intValue += element.internal.value.hours;
            //intValue += parseFloat((element.internal.value.minutes / 60).toFixed(5));
            //intValue += parseFloat(((element.internal.value.seconds / 60) / 60).toFixed(5));
        }

        return String(intValue);
    }

    function valueGetCurrentDisplay(element) {
        var strValue = '';
        var intHours = element.internal.value.hours;
        var intMinutes = element.internal.value.minutes;
        var intSeconds = element.internal.value.seconds;

        if (element.internal.places.hours > 0) {
            strValue += GS.leftPad(intHours || '', '0', element.internal.places.hours);
        }

        if (element.internal.places.minutes > 0) {
            strValue += (strValue ? ':' : '');
            strValue += GS.leftPad(intMinutes || '', '0', element.internal.places.minutes);
        }

        if (element.internal.places.seconds > 0) {
            strValue += (strValue ? ':' : '');
            strValue += GS.leftPad(intSeconds || '', '0', element.internal.places.seconds);
        }

        return String(strValue);
    }

    function valueUpdatePicker(element) {
        var currentValue = valueGetCurrentDisplay(element);
        var i;
        var len;
        var arrElements;
        var intColons = 0;

        //console.log('currentValue:', currentValue);
        //console.log('PLACES: ', element.internal.places.hours, element.internal.places.minutes, element.internal.places.seconds);

        // set value of the select boxes
        i = 0;
        len = element.internal.places.hours;
        arrElements = xtag.query(element.internal.picker, '[data-hour]');
        while (i < len) {
            //console.log('SELECTBOX HR: ', arrElements[i]);
            arrElements[i].value = currentValue[i];
            i += 1;
        }
        if (len > 0) {
            intColons += 1;
        }

        i = 0;
        len = element.internal.places.minutes;
        arrElements = xtag.query(element.internal.picker, '[data-minute]');
        while (i < len) {
            //console.log('SELECTBOX MIN: ', arrElements[i]);
            arrElements[i].value =
                    currentValue[element.internal.places.hours + intColons + i];
            i += 1;
        }
        if (len > 0) {
            intColons += 1;
        }

        i = 0;
        len = element.internal.places.seconds;
        arrElements = xtag.query(element.internal.picker, '[data-second]');
        while (i < len) {
            //console.log('SELECTBOX SEC: ', arrElements[i]);
            arrElements[i].value =
                    currentValue[element.internal.places.hours + element.internal.places.minutes + intColons + i];
            i += 1;
        }
    }

    function valueUpdateDisplay(element) {
        if (element.control) {
            element.control.value = valueGetCurrentDisplay(element);
        } else {
            element.textContent = valueGetCurrentDisplay(element);
        }
    }

    function valueUpdateAttribute(element) {
        element.setAttribute('value', valueGetCurrentNumber(element));
    }


    // #####################################################################################
    // ####################################### CONTROL #####################################
    // #####################################################################################

    function refreshControl(element) {
        var i;
        var len;
        var arrPassThroughAttributes;
        var strHTML;

        // clear out HTML
        element.innerHTML = '';

        // clear out element variables
        element.control = '';
        element.button = '';

        // if we are not disabled:
        if (!element.hasAttribute('disabled')) {
            // build HTML
            strHTML =
                    '<input class="control" gs-dynamic type="text" ' +
                    'autocorrect="off" autocapitalize="off" ' +
                    'autocomplete="off" spellcheck="false" />';
            if (!element.hasAttribute('no-picker')) {
                strHTML += '<gs-button class="time-picker-button" gs-dynamic inline icononly icon="hourglass-o" no-focus></gs-button>';
            }

            // set control HTML
            element.innerHTML = strHTML;

            // fill element variables
            element.control = element.children[0];
            element.button = element.children[1];

            // handle passthrough attributes
            arrPassThroughAttributes = ['name', 'autofocus', 'spellcheck', 'readonly'];

            i = 0;
            len = arrPassThroughAttributes.length;
            while (i < len) {
                if (element.hasAttribute(arrPassThroughAttributes[i])) {
                    element.control.setAttribute(arrPassThroughAttributes[i], element.getAttribute(arrPassThroughAttributes[i]) || '');
                }
                i += 1;
            }

            // move tabindex, tabindex is special because tabindex affects any displayed element it's used on
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

            element.control.removeEventListener('blur', blurFunction);
            element.control.addEventListener('blur', blurFunction);

            element.control.removeEventListener(evt.mouseout, mouseoutFunction);
            element.control.addEventListener(evt.mouseout, mouseoutFunction);

            element.control.removeEventListener(evt.mouseout, mouseoverFunction);
            element.control.addEventListener(evt.mouseover, mouseoverFunction);
        }

        // display value
        valueUpdateDisplay(element);
        //displayValue(element);
        //setValueDisplay(element, element.getAttribute('value'));
    }

    function valueSiphonAttribute(element) {
        var fltValue = parseFloat(element.getAttribute('value') || '0');

        var intHours;
        var intMinutes;
        var intSeconds;

        if (element.internal.unit === 'minutes') {
            intHours = Math.floor(fltValue / 60);
            fltValue = fltValue - (intHours * 60); // remove the hours from fltValue

            intMinutes = Math.floor(fltValue);
            fltValue = fltValue - Math.floor(fltValue); // remove the minutes from fltValue

            intSeconds = 0; //Math.floor(fltValue);

        } else if (element.internal.unit === 'seconds') {
            intHours = Math.floor((fltValue / 60) / 60);
            fltValue = fltValue - ((intHours * 60) * 60); // remove the hours from fltValue

            intMinutes = Math.floor(fltValue / 60);
            fltValue = fltValue - (intMinutes * 60); // remove the minutes from fltValue

            intSeconds = Math.round(fltValue);
        } else {
            intHours = Math.floor(fltValue);
            //fltValue = fltValue - intHours; // remove the hours from fltValue

            intMinutes = 0;//Math.floor(fltValue * 60);
            //fltValue = fltValue - (intMinutes / 60);

            intSeconds = 0;//Math.round((fltValue * 100) * 60);
        }

        if (isNaN(intHours)) {
            intHours = 0;
        }
        if (isNaN(intMinutes)) {
            intMinutes = 0;
        }
        if (isNaN(intSeconds)) {
            intSeconds = 0;
        }

        //console.log('siphon: ', element);
        //console.log('intHours:   ', intHours);
        //console.log('intMinutes: ', intMinutes);
        //console.log('intSeconds: ', intSeconds);

        element.internal.value.hours = intHours;
        element.internal.value.minutes = intMinutes;
        element.internal.value.seconds = intSeconds;
    }


    // #####################################################################################
    // ##################################### QUERYSTRING ###################################
    // #####################################################################################

    //function pushReplacePopHandler(element) {
    //    var strQueryString = GS.getQueryString();
    //    var strQSCol = element.getAttribute('qs');

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

    function handleQS(element) {
        //var strQSValue;

        if (!element.qsEventFunction) {
            element.qsEventFunction = function () {
                pushReplacePopHandler(element);
            };
        }

        window.removeEventListener('pushstate', element.qsEventFunction);
        window.removeEventListener('replacestate', element.qsEventFunction);
        window.removeEventListener('popstate', element.qsEventFunction);

        // handle "qs" attribute
        if (element.getAttribute('qs')) {
            pushReplacePopHandler(element);
            //strQSValue = GS.qryGetVal(GS.getQueryString(), element.getAttribute('qs'));

            //if (strQSValue !== '' || !element.getAttribute('value')) {
            //    element.setAttribute('value', strQSValue);
            //}

            window.addEventListener('pushstate', element.qsEventFunction);
            window.addEventListener('replacestate', element.qsEventFunction);
            window.addEventListener('popstate', element.qsEventFunction);
        }
    }

    // #####################################################################################
    // ################################### PARENT  ELEMENT #################################
    // #####################################################################################

    function prepElement(element) {
        element.internal = {};

        element.internal.value = {
            "hours": 0,
            "minutes": 0,
            "seconds": 0
        };

        element.internal.places = {
            "hours": 0,
            "minutes": 0,
            "seconds": 0
        };

        element.internal.unit = '';

        element.internal.picker = '';
    }

    function siphonElement(element) {
        // siphon the unit
        element.internal.unit = element.getAttribute('unit') || '';
        element.internal.unit = element.internal.unit.toLowerCase();
        element.internal.unit = element.internal.unit || 'minutes';

        if (element.internal.unit !== 'hours' &&
                element.internal.unit !== 'minutes' &&
                element.internal.unit !== 'seconds') {
            element.internal.unit = 'minutes';
            console.warn(
                'gs-interval Warning: invalid "unit" attribute. ' +
                        'Please use "hours", "minutes" or "seconds".  ' +
                        'Defaulting "unit" to "minutes"',
                element
            );
        }

        // get the place settings
        var intHourPlaces = parseInt(element.getAttribute('hour-places'), 10);
        var intMinutePlaces = 0;
        var intSecondPlaces = 0;

        // default place settings
        if (isNaN(intHourPlaces)) {
            intHourPlaces = 3;
        }
        if (element.internal.unit === 'minutes' || element.internal.unit === 'seconds') {
            intMinutePlaces = 2;
        }
        if (element.internal.unit === 'seconds') {
            intSecondPlaces = 2;
        }

        element.internal.places.hours = intHourPlaces;
        element.internal.places.minutes = intMinutePlaces;
        element.internal.places.seconds = intSecondPlaces;

        // siphon the value attribute
        // get hours/minutes/seconds from value
        valueSiphonAttribute(element);
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
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                element.innerState = 'closed';

                prepElement(element);
                siphonElement(element);
                saveDefaultAttributes(element);
                refreshControl(element);

                if (element.getAttribute('qs')) {
                    handleQS(element);
                }

                element.lastChangeValue = element.getAttribute('value');
            }
        }
    }

    // ######################################################################################
    // ##################################### REGISTRATION ###################################
    // ######################################################################################

    xtag.register('gs-interval', {
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
                    if (strAttrName === 'disabled' || strAttrName === 'no-picker' || strAttrName === 'tabindex') {
                        siphonElement(element);
                        refreshControl(element);

                    } else if (strAttrName === 'qs') {
                        handleQS(element);

                    } else if (strAttrName === 'value' && element.inserted) {
                        ////displayValue(element);
                        //siphonElement(element);
                        //displayValue(element);
                        ////setValueDisplay(element, newValue);
                        valueSiphonAttribute(element);
                        valueUpdateDisplay(element);

                        if (element.innerState === 'open') {
                            valueUpdatePicker(element);
                        }
                    }
                }
            }
        },
        events: {
            'click': function (event) {
                var element = this;
                if (event.target === element.button) {
                    element.toggle();
                }
            },

            'mouseup': function (event) {
                var element = this;
                var strValue = element.control.value;
                var jsnTextSelection;
                var intCursor;
                var i;
                var len;
                var arrDelimiterIndexes;
                var intSection;

                if (!element.hasAttribute('readonly')) {
                    element.numberOfCharsTyped = 0;
    
                    jsnTextSelection = GS.getInputSelection(element.control);
    
                    i = 0;
                    len = strValue.length;
                    arrDelimiterIndexes = [0];
                    while (i < len) {
                        if (strValue[i] === ':') {
                            arrDelimiterIndexes.push(i);
                        }
                        i += 1;
                    }
                    arrDelimiterIndexes.push(strValue.length);
    
                    event.preventDefault();
    
                    intCursor = jsnTextSelection.start;
    
                    // find out what section the cursor is in
                    i = 1;
                    len = arrDelimiterIndexes.length;
                    while (i < len) {
                        if (intCursor >= arrDelimiterIndexes[i - 1] && intCursor <= arrDelimiterIndexes[i]) {
                            intSection = i;
                            break;
                        }
                        i += 1;
                    }
    
                    // select the section of the value that the cursor is in
                    if (intSection === 1) {
                        GS.setInputSelection(element.control, arrDelimiterIndexes[intSection - 1], arrDelimiterIndexes[intSection]);
                    } else {
                        GS.setInputSelection(element.control, arrDelimiterIndexes[intSection - 1] + 1, arrDelimiterIndexes[intSection]);
                    }
                }
            },

            'keydown': function (event) { // don't use the "input" event, doesn't work for this
                var element = this;
                var strValue = element.control.value;
                var intKeyCode = (event.keyCode || event.which);

                var jsnTextSelection;
                var arrDelimiterIndexes;
                var i;
                var len;
                var intCursor;
                var intSection;
                var strPlace;
                var strChar;
                var strSection;

                if (!element.hasAttribute('readonly')) {
                    jsnTextSelection = GS.getInputSelection(element.control);
    
                    i = 0;
                    len = strValue.length;
                    arrDelimiterIndexes = [0];
                    while (i < len) {
                        if (strValue[i] === ':') {
                            arrDelimiterIndexes.push(i);
                        }
                        i += 1;
                    }
                    arrDelimiterIndexes.push(strValue.length);
    
                    // get cursor position
                    intCursor = jsnTextSelection.start;
    
                    // find out what section the cursor is in
                    i = 1;
                    len = arrDelimiterIndexes.length;
                    while (i < len) {
                        if (intCursor >= arrDelimiterIndexes[i - 1] && intCursor <= arrDelimiterIndexes[i]) {
                            intSection = i;
                            break;
                        }
                        i += 1;
                    }
    
                    // if key was an arrow
                    if (intKeyCode >= 37 && intKeyCode <= 40) {
                        element.numberOfCharsTyped = 0;
                        event.preventDefault();
    
                        // left     37
                        // top      38
                        // right    39
                        // down     40
    
                        // handle/right arrows moving the cursor
                        if (intKeyCode === 37) {
                            intSection -= 1;
                            intSection = Math.max(intSection, 1);
                        } else if (intKeyCode === 39) {
                            intSection += 1;
                            intSection = Math.min(intSection, arrDelimiterIndexes.length - 1);
                        }
    
                        // select the section of the value that the cursor is in
                        if (intSection === 1) {
                            GS.setInputSelection(element.control, arrDelimiterIndexes[intSection - 1], arrDelimiterIndexes[intSection]);
                        } else {
                            GS.setInputSelection(element.control, arrDelimiterIndexes[intSection - 1] + 1, arrDelimiterIndexes[intSection]);
                        }
    
                        // find out what section that the cursor is in (hours, minutes or seconds)
                        if (intSection === 0 || intSection === 1) {
                            strPlace = 'hours';
                        } else if (intSection === 2) {
                            strPlace = 'minutes';
                        } else if (intSection === 3 || intSection === 4) {
                            strPlace = 'seconds';
                        }
    
                        // update text selection variable
                        jsnTextSelection = GS.getInputSelection(element.control);
    
                        // handle up and down arrows incrementing/decrementing
                        //      the value of the currently selected section
                        if (intKeyCode === 38) { // up
                            if (strPlace === 'hours') {
                                element.internal.value.hours += 1;
                            } else if (strPlace === 'minutes') {
                                element.internal.value.minutes += 1;
                            } else if (strPlace === 'seconds') {
                                element.internal.value.seconds += 1;
                            }
    
                            if (String(element.internal.value.hours).length > element.internal.places.hours) {
                                element.internal.value.hours = parseInt(
                                    '999999999999999'.substring(0, element.internal.places.hours),
                                    10
                                );
                            }
                            if (element.internal.value.seconds > 59) {
                                element.internal.value.minutes += 1;
                                element.internal.value.seconds = 0;
                            }
                            if (element.internal.value.minutes > 59) {
                                element.internal.value.hours += 1;
                                element.internal.value.minutes = 0;
                            }
    
                        } else if (intKeyCode === 40) { // down
                            if (strPlace === 'hours') {
                                element.internal.value.hours -= 1;
                            } else if (strPlace === 'minutes') {
                                element.internal.value.minutes -= 1;
                            } else if (strPlace === 'seconds') {
                                element.internal.value.seconds -= 1;
                            }
    
                            if (element.internal.value.seconds < 0) {
                                if (element.internal.value.minutes > 0) {
                                    element.internal.value.minutes -= 1;
                                    element.internal.value.seconds = 59;
                                } else if (element.internal.value.hours > 0) {
                                    element.internal.value.hours -= 1;
                                    element.internal.value.minutes = 59;
                                    element.internal.value.seconds = 59;
                                } else {
                                    element.internal.value.seconds = 0;
                                }
                            }
                            if (element.internal.value.minutes < 0) {
                                if (element.internal.value.hours > 0) {
                                    element.internal.value.minutes = 59;
                                    element.internal.value.hours -= 1;
                                } else {
                                    element.internal.value.minutes = 0;
                                }
                            }
                            if (element.internal.value.hours < 0) {
                                element.internal.value.hours = 0;
                            }
                        }
    
                        if (intKeyCode === 38 || intKeyCode === 40) {
                            //trinkleValueDown(element);
                            //displayValue(element);
                            valueUpdateAttribute(element);
                            GS.setInputSelection(element.control, jsnTextSelection.start, jsnTextSelection.end);
                        }
    
                    // if key was a number
                    } else if ((intKeyCode >= 48 && intKeyCode <= 57) || (intKeyCode >= 96 && intKeyCode <= 105)) {
                        element.numberOfCharsTyped = element.numberOfCharsTyped || 0;
                        event.preventDefault();
    
                        // get the character that was typed
                        strChar = String.fromCharCode(intKeyCode);
                        if (intKeyCode === 96) { strChar = '0'; }
                        if (intKeyCode === 97) { strChar = '1'; }
                        if (intKeyCode === 98) { strChar = '2'; }
                        if (intKeyCode === 99) { strChar = '3'; }
                        if (intKeyCode === 100) { strChar = '4'; }
                        if (intKeyCode === 101) { strChar = '5'; }
                        if (intKeyCode === 102) { strChar = '6'; }
                        if (intKeyCode === 103) { strChar = '7'; }
                        if (intKeyCode === 104) { strChar = '8'; }
                        if (intKeyCode === 105) { strChar = '9'; }
    
                        // select the section of the value that the cursor is in
                        if (intSection === 1) {
                            GS.setInputSelection(element.control, arrDelimiterIndexes[intSection - 1], arrDelimiterIndexes[intSection]);
                        } else {
                            GS.setInputSelection(element.control, arrDelimiterIndexes[intSection - 1] + 1, arrDelimiterIndexes[intSection]);
                        }
    
                        // find out what section that the cursor is in (hours, minutes or seconds)
                        if (intSection === 0 || intSection === 1) {
                            strPlace = 'hours';
                        } else if (intSection === 2) {
                            strPlace = 'minutes';
                        } else if (intSection === 3 || intSection === 4) {
                            strPlace = 'seconds';
                        }
    
                        // update text selection variable
                        jsnTextSelection = GS.getInputSelection(element.control);
    
                        // when you type in a number,
                        //      if no data is set saying "this is where the typing begins":
                        //              insert the number as the first character of the section
                        //              after that set data to say where the typing begins
                        //      no matter what is typed: stay in the same section
                        strSection = strValue.substring(jsnTextSelection.start, jsnTextSelection.end);
    
                        strSection =
                                strSection.substring(0, element.numberOfCharsTyped) +
                                strChar +
                                strSection.substring(element.numberOfCharsTyped + 1);
    
                        strValue =
                                strValue.substring(0, jsnTextSelection.start) +
                                strSection +
                                strValue.substring(jsnTextSelection.end);
    
                        //console.log(element.numberOfCharsTyped);
                        element.numberOfCharsTyped += 1;
    
                        if (element.numberOfCharsTyped === strSection.length) {
                            element.numberOfCharsTyped = 0;
                        }
    
                        if (strPlace === 'hours') {
                            element.internal.value.hours = parseInt(strSection, 10);
                        }
                        if (strPlace === 'minutes') {
                            element.internal.value.minutes = parseInt(strSection, 10);
                        }
                        if (strPlace === 'seconds') {
                            element.internal.value.seconds = parseInt(strSection, 10);
                        }
    
                        //console.log(strValue, element.control.value, translateValueToNumber(element, strValue));
    
                        if (strValue !== element.control.value) {
                            //trinkleValueDown(element);
                            //displayValue(element);
                            valueUpdateAttribute(element);
                            GS.setInputSelection(element.control, jsnTextSelection.start, jsnTextSelection.end);
                        }
                    } else if (intKeyCode === 13) {
                        element.numberOfCharsTyped = 0;
                        event.preventDefault();
                        handleChange(element);
                    } else if (intKeyCode !== 9 && event.ctrlKey === false && event.metaKey === false) {
                        element.numberOfCharsTyped = 0;
                        event.preventDefault();
                    }
                }
            },
            'blur': function () {// don't use 'focusout', it doesn't work on firefox
                var element = this;
                if (element.innerState === 'closed') {
                    handleChange(element);
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
            state: {
                get: function () {
                    return this.innerState;
                },
                set: function (newValue) {
                    var element = this;
                    if (newValue === 'open') {
                        element.open();
                    } else {
                        element.close();
                    }
                }
            }
        },
        methods: {
            focus: function () {
                this.control.focus();
            },

            open: function () {
                var element = this;
                var pickerContainerElement;
                var overlayElement;
                var pickerElement;
                var handleLook;
                var strHTML;
                var i;
                var len;
                var arrElements;

                if (element.innerState === 'closed') {
                    element.innerState = 'open';
                    element.lastClosedValue = element.getAttribute('value');

                    // if we are not on a touch device: focus control
                    if (!evt.touchDevice) {
                        element.control.focus();
                        GS.setInputSelection(element.control, 0, element.control.value.length);
                    }

                    // create picker elements
                    pickerContainerElement = document.createElement('div');
                    pickerContainerElement.classList.add('gs-interval-time-picker-container');

                    overlayElement = document.createElement('div');
                    overlayElement.classList.add('gs-interval-time-picker-overlay');

                    pickerElement = document.createElement('div');
                    pickerElement.classList.add('gs-interval-time-picker');
                    element.internal.picker = pickerElement;

                    // save picker container
                    element.pickerContainerElement = pickerContainerElement;

                    // append picker elements
                    pickerContainerElement.appendChild(overlayElement);
                    pickerContainerElement.appendChild(pickerElement);

                    document.body.appendChild(pickerContainerElement);

                    // fill picker popup
                    strHTML = '';
                    strHTML += '<div class="time-inner-container">';

                    i = 0;
                    len = element.internal.places.hours;
                    while (i < len) {
                        strHTML +=
                                '<select class="gs-interval-hour" data-hour="' + i + '">' +
                                '    <option value="0">&nbsp;0</option>' +
                                '    <option value="1">&nbsp;1</option>' +
                                '    <option value="2">&nbsp;2</option>' +
                                '    <option value="3">&nbsp;3</option>' +
                                '    <option value="4">&nbsp;4</option>' +
                                '    <option value="5">&nbsp;5</option>' +
                                '    <option value="6">&nbsp;6</option>' +
                                '    <option value="7">&nbsp;7</option>' +
                                '    <option value="8">&nbsp;8</option>' +
                                '    <option value="9">&nbsp;9</option>' +
                                '</select>';
                        i += 1;
                    }

                    if (element.internal.places.hours > 0 && element.internal.places.minutes > 0) {
                        strHTML += '<span class="colon">:</span>';
                    }

                    i = 0;
                    len = element.internal.places.minutes;
                    while (i < len) {
                        strHTML +=
                                '<select class="gs-interval-minute" data-minute="' + i + '">' +
                                '    <option value="0">&nbsp;0</option>' +
                                '    <option value="1">&nbsp;1</option>' +
                                '    <option value="2">&nbsp;2</option>' +
                                '    <option value="3">&nbsp;3</option>' +
                                '    <option value="4">&nbsp;4</option>' +
                                '    <option value="5">&nbsp;5</option>';

                        if (i > 0) {
                            strHTML +=
                                    '<option value="6">&nbsp;6</option>' +
                                    '<option value="7">&nbsp;7</option>' +
                                    '<option value="8">&nbsp;8</option>' +
                                    '<option value="9">&nbsp;9</option>';
                        }

                        strHTML +=
                                '</select>';
                        i += 1;
                    }

                    if (element.internal.places.minutes > 0 && element.internal.places.seconds > 0) {
                        strHTML += '<span class="colon">:</span>';
                    }

                    i = 0;
                    len = element.internal.places.seconds;
                    while (i < len) {
                        strHTML +=
                                '<select class="gs-interval-second" data-second="' + i + '">' +
                                '    <option value="0">&nbsp;0</option>' +
                                '    <option value="1">&nbsp;1</option>' +
                                '    <option value="2">&nbsp;2</option>' +
                                '    <option value="3">&nbsp;3</option>' +
                                '    <option value="4">&nbsp;4</option>' +
                                '    <option value="5">&nbsp;5</option>';

                        if (i > 0) {
                            strHTML +=
                                    '<option value="6">&nbsp;6</option>' +
                                    '<option value="7">&nbsp;7</option>' +
                                    '<option value="8">&nbsp;8</option>' +
                                    '<option value="9">&nbsp;9</option>';
                        }

                        strHTML +=
                                '</select>';
                        i += 1;
                    }

                    strHTML += '</div>';
                    pickerElement.innerHTML = strHTML;


                    // set picker value
                    valueUpdatePicker(element);

                    // bind picker click
                    overlayElement.addEventListener('click', function () {
                        element.close();
                    });

                    pickerElement.addEventListener('change', function () {//event
                        //var arrElements;
                        //var i;
                        //var len;
                        var newValue = 0;
                        var strCurrentValue;

                        if (element.internal.unit === 'hours') {
                            i = 0;
                            len = element.internal.places.hours;
                            arrElements = xtag.query(pickerElement, '[data-hour]');
                            strCurrentValue = '';
                            while (i < len) {
                                strCurrentValue += arrElements[i].value;
                                i += 1;
                            }
                            if (arrElements.length > 0) {
                                newValue += parseInt(strCurrentValue, 10);
                            }

                            //i = 0;
                            //len = element.internal.places.minutes;
                            //arrElements = xtag.query(pickerElement, '[data-minute]');
                            //strCurrentValue = '';
                            //while (i < len) {
                            //    strCurrentValue += arrElements[i].value;
                            //    i += 1;
                            //}
                            //if (arrElements.length > 0) {
                            //    newValue += (parseInt(strCurrentValue, 10) / 60);
                            //}

                            //i = 0;
                            //len = element.internal.places.seconds;
                            //arrElements = xtag.query(pickerElement, '[data-second]');
                            //strCurrentValue = '';
                            //while (i < len) {
                            //    strCurrentValue += arrElements[i].value;
                            //    i += 1;
                            //}
                            //if (arrElements.length > 0) {
                            //    newValue += ((parseInt(strCurrentValue, 10) / 60) / 60);
                            //}
                        }
                        if (element.internal.unit === 'minutes') {
                            i = 0;
                            len = element.internal.places.hours;
                            arrElements = xtag.query(pickerElement, '[data-hour]');
                            strCurrentValue = '';
                            while (i < len) {
                                strCurrentValue += arrElements[i].value;
                                i += 1;
                            }
                            if (arrElements.length > 0) {
                                newValue += parseInt(strCurrentValue, 10) * 60;
                            }

                            i = 0;
                            len = element.internal.places.minutes;
                            arrElements = xtag.query(pickerElement, '[data-minute]');
                            strCurrentValue = '';
                            while (i < len) {
                                strCurrentValue += arrElements[i].value;
                                i += 1;
                            }
                            if (arrElements.length > 0) {
                                newValue += parseInt(strCurrentValue, 10);
                            }

                            //i = 0;
                            //len = element.internal.places.seconds;
                            //arrElements = xtag.query(pickerElement, '[data-second]');
                            //strCurrentValue = '';
                            //while (i < len) {
                            //    strCurrentValue += arrElements[i].value;
                            //    i += 1;
                            //}
                            //if (arrElements.length > 0) {
                            //    newValue += ((parseInt(strCurrentValue, 10) * 60) * 60);
                            //}
                        }
                        if (element.internal.unit === 'seconds') {
                            i = 0;
                            len = element.internal.places.hours;
                            arrElements = xtag.query(pickerElement, '[data-hour]');
                            strCurrentValue = '';
                            while (i < len) {
                                strCurrentValue += arrElements[i].value;
                                i += 1;
                            }
                            if (arrElements.length > 0) {
                                newValue += ((parseInt(strCurrentValue, 10) * 60) * 60);
                            }

                            i = 0;
                            len = element.internal.places.minutes;
                            arrElements = xtag.query(pickerElement, '[data-minute]');
                            strCurrentValue = '';
                            while (i < len) {
                                strCurrentValue += arrElements[i].value;
                                i += 1;
                            }
                            if (arrElements.length > 0) {
                                newValue += parseInt(strCurrentValue, 10) * 60;
                            }

                            i = 0;
                            len = element.internal.places.seconds;
                            arrElements = xtag.query(pickerElement, '[data-second]');
                            strCurrentValue = '';
                            while (i < len) {
                                strCurrentValue += arrElements[i].value;
                                i += 1;
                            }
                            if (arrElements.length > 0) {
                                newValue += parseInt(strCurrentValue, 10);
                            }
                        }

                        element.setAttribute('value', newValue);
                        //trinkleValueDown(element);
                        //setValueDisplay(element, newValue);
                    });

                    // handle/bind positioning and look
                    handleLook = function () {
                        var positionData;
                        var intPopupHeight;
                        var intPopupWidth;

                        if (pickerContainerElement.parentNode !== document.body) {
                            window.removeEventListener('resize', handleLook);
                            window.removeEventListener('orientationchange', handleLook);
                            return;
                        }

                        // clear current styles
                        pickerElement.style.top = '';
                        pickerElement.style.left = '';
                        pickerElement.style.marginTop = '';
                        //pickerContainerElement.classList.remove('modal');

                        // get position/size data
                        positionData = GS.getElementPositionData(element);
                        intPopupHeight = pickerElement.offsetHeight;
                        intPopupWidth = pickerElement.offsetWidth;

                        // if from control to bottom has enough room: popup below
                        if (positionData.intRoomBelow > intPopupHeight) {
                            pickerElement.style.top = (positionData.objElementOffset.top + positionData.intElementHeight) + 'px';

                        // else: popup above
                        } else {
                            pickerElement.style.top = (positionData.objElementOffset.top - intPopupHeight) + 'px';
                        }

                        pickerElement.style.left =
                                (((positionData.objElementOffset.left + positionData.intElementWidth) - intPopupWidth) - 4) + 'px';
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
                    if (element.pickerContainerElement) {
                        document.body.removeChild(element.pickerContainerElement);
                        element.pickerContainerElement = '';
                    }
                    if (element.getAttribute('value') !== element.lastClosedValue) {
                        handleChange(element);
                    }
                }
            },

            toggle: function () {
                var element = this;

                if (element.innerState === 'open') {
                    element.close();
                } else {
                    element.open();
                }
            }
        }
    });
});