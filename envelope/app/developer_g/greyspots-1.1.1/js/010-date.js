window.addEventListener('design-register-element', function () {
    'use strict';
    
    registerDesignSnippet('<gs-date>', '<gs-date>', 'gs-date column="${1:name}"></gs-date>');
    registerDesignSnippet('<gs-date> With Label', '<gs-date>', 'label for="${1:date-insert-start_date}">${2:Start Date}:</label>\n' +
                                                               '<gs-date id="${1:date-insert-start_date}" column="${3:start_date}"></gs-date>');
    
    designRegisterElement('gs-date', '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-date.html');
    
    window.designElementProperty_GSDATE = function(selectedElement) {
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
        
        addProp('Date Picker', true, '<gs-checkbox class="target" value="' + (!selectedElement.hasAttribute('no-picker')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'no-picker', (this.value === 'true'), false);
        });
        
        addProp('Format', true, '<gs-combo class="target" value="' + encodeHTML(selectedElement.getAttribute('format') || '') + '" mini>' + 
                        ml(function () {/*<template>
                                            <table>
                                                <tbody>
                                                    <tr value="">
                                                        <td hidden>Default</td>
                                                        <td><center>Default<br /> (01/01/2015)</center></td>
                                                    </tr>
                                                    <tr value="shortdate">
                                                        <td hidden>shortdate</td>
                                                        <td><center>shortdate<br /> (1/1/15)</center></td>
                                                    </tr>
                                                    <tr value="mediumdate">
                                                        <td hidden>mediumdate</td>
                                                        <td><center>mediumdate<br /> (Jan 1, 2015)</center></td>
                                                    </tr>
                                                    <tr value="longdate">
                                                        <td hidden>longdate</td>
                                                        <td><center>longdate<br /> (January 1, 2015)</center></td>
                                                    </tr>
                                                    <tr value="fulldate">
                                                        <td hidden>fulldate</td>
                                                        <td><center>fulldate<br /> (Thursday, January 1, 2015)</center></td>
                                                    </tr>
                                                    <tr value="isodate">
                                                        <td hidden>isodate</td>
                                                        <td><center>isodate<br /> (2015-01-01)</center></td>
                                                    </tr>
                                                    <tr value="isodatetime">
                                                        <td hidden>isodatetime</td>
                                                        <td><center>isodatetime<br /> (2015-01-01T00:00:00)</center></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </template>
                                    </gs-combo>
                                */}), function () {
            return setOrRemoveTextAttribute(selectedElement, 'format', this.value);
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
        var strVisibilityAttribute = '';
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
    var singleLineTemplateElement = document.createElement('template'),
        singleLineTemplate;

    singleLineTemplateElement.innerHTML = '<input class="control" gs-dynamic type="text" />' +
                             '<gs-button class="date-picker-button" gs-dynamic inline icononly icon="calendar" no-focus></gs-button>';

    singleLineTemplate = singleLineTemplateElement.content;

    // re-target change event from control to element
    function changeFunction(event) {
        event.preventDefault();
        event.stopPropagation();

        //console.log('change event triggered');

        GS.triggerEvent(event.target.parentNode, 'change');

        handleFormat(event.target.parentNode, event);
    }

    // re-target focus event from control to element
    function focusFunction(event) {
        GS.triggerEvent(event.target.parentNode, 'focus');
    }

    function buttonClickFunction(event) {
        openDatePicker(event.target.parentNode);
    }

    //function pushReplacePopHandler(element) {
    //    var strQueryString = GS.getQueryString(), strQSCol = element.getAttribute('qs');
    //
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
        i = 0;
        len = element.attributes.length;
        arrAttr = element.attributes;
        while (i < len) {
            jsnAttr = element.attributes[i];

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
                element.value = strQSValue;
            }
        }

        element.internal.bolQSFirstRun = true;
    }

    // sync control value and resize to text
    function syncView(element) {
        if (element.control) {
            element.setAttribute('value', element.control.value);
        }
    }

    function openDatePicker(element, dteDate) {
        var divElement = document.createElement('div')
          , jsnOffset = GS.getElementOffset(element.datePickerButton)
          , jsnControlOffset = GS.getElementOffset(element)
          , datePickerContainer, datePicker, strHTML = '', intTop, bolSelectOrigin
          , i, len, dateClickHandler, arrDateButtons, dteCurrent, strInputValue = element.control.value;

        // if there is a day of the week in the value: remove it
        if (strInputValue.match(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/gim)) {
            strInputValue = strInputValue.replace(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/gim, '')
                                         .replace(/  /gim, ' ')
                                         .trim();
        }

        // fix date being off by one day by replacing the dashes with slashes
        strInputValue = strInputValue.replace(/-/, '/')  // replace first dash with forward slash
                                     .replace(/-/, '/'); // replace second dash with forward slash
        
        dteCurrent = new Date(strInputValue);
        
        if (isNaN(dteCurrent.getTime())) {
            dteCurrent = new Date();
        }
        
        element.datePickerButton.setAttribute('selected', '');
        
        // if no date was sent
        if (!dteDate) {
            // try using the value from the input
            if (element.control.value) {
                dteDate = dteCurrent;
                bolSelectOrigin = true;
                
            // else just use now
            } else {
                dteDate = new Date();
            }
        }
        
        //if we are in the current month and year, Highlight the day we are on
        if (dteDate.getMonth() === dteCurrent.getMonth() && dteDate.getFullYear() === dteCurrent.getFullYear()) {
            bolSelectOrigin = true;
        }
        
        // set html using date
        strHTML = getContentForDatePicker(dteDate, bolSelectOrigin);
        
        divElement.innerHTML =  '<div class="gs-date-date-picker-container" gs-dynamic>' +
                                    '<div class="gs-date-date-picker" gs-dynamic>' + strHTML + '</div>' +
                                '</div>';
        
        datePickerContainer = divElement.children[0];
        element.datePickerContainer = datePickerContainer;
        
        datePicker = datePickerContainer.children[0];
        
        document.body.appendChild(datePickerContainer);
        
        // position datePickerContainer
        intTop = jsnOffset.top + element.offsetHeight;
        
        if (intTop + datePicker.offsetHeight > window.innerHeight) {
            intTop -= datePicker.offsetHeight;
            intTop -= element.offsetHeight;
            
            if (intTop < 0) {
                intTop = 0;
            }
        }
        
        datePicker.style.top = intTop + 'px';
        
        // if window width is wider than 450 pixels width AND the date picker will not fall off of the screen:
        if (window.innerWidth > 450 && jsnOffset.left > 450) {
            // datepicker width: 450px; right: calculated;
            datePicker.style.width = '450px';
            datePicker.style.right = window.innerWidth - (jsnOffset.left + element.datePickerButton.offsetWidth) + 'px';
            
        // if window width is wider than 450 pixels width AND the date picker will not fall off of the screen:
        } else if (window.innerWidth > 450 && jsnOffset.left <= 450) {
            // datepicker width: 450px; right: calculated;
            datePicker.style.width = '450px';
            datePicker.style.left = jsnControlOffset.left + 'px';
            
        // else:
        } else {
            // datepicker width: 96%; right: 2%;
            datePicker.style.width = '96%';
            datePicker.style.right = '2%';
        }
        
        // next month, previous month, next year, previous year click events
        datePickerContainer.getElementsByClassName('prev-month')[0].addEventListener('click', function () {
            dteDate.setMonth((dteDate.getMonth() - 1 < 0 ? 11 : dteDate.getMonth() - 1));
            closeDatePicker(element);
            openDatePicker(element, dteDate);
        });
        datePickerContainer.getElementsByClassName('next-month')[0].addEventListener('click', function () {
            var i, oldMonth;
            
            oldMonth = dteDate.getMonth();
            dteDate.setMonth((oldMonth + 1 > 11 ? 0 : oldMonth + 1));
            
            // if a month is skipped (no need to worry about the loop back to january because december and january both seem to have 31 days)
            if (dteDate.getMonth() === oldMonth + 2) {
                // loop backwards until we reach the correct month
                i = 0;
                while (dteDate.getMonth() === oldMonth + 2 && i < 20) {
                    dteDate.setDate(dteDate.getDate() - 1);
                    i += 1;
                }
            }
            
            closeDatePicker(element);
            openDatePicker(element, dteDate);
        });
        datePickerContainer.getElementsByClassName('prev-year')[0].addEventListener('click', function () {
            dteDate.setFullYear(dteDate.getFullYear() - 1);
            closeDatePicker(element);
            openDatePicker(element, dteDate);
        });
        datePickerContainer.getElementsByClassName('next-year')[0].addEventListener('click', function () {
            dteDate.setFullYear(dteDate.getFullYear() + 1);
            closeDatePicker(element);
            openDatePicker(element, dteDate);
        });
        
        // background click event
        datePickerContainer.addEventListener('click', function (event) {
            if (event.target.classList.contains('gs-date-date-picker-container')) {
                closeDatePicker(element);
            }
        });
        
        // date click events
        dateClickHandler = function () {
            var dteNewDate = new Date(this.getAttribute('data-date'));
            
            closeDatePicker(element);
            
            element.value = (dteNewDate.getMonth() + 1) + '/' + dteNewDate.getDate() + '/' + dteNewDate.getFullYear();
            //console.trace('test', element.value);
            handleFormat(element);
            xtag.fireEvent(element, 'change', { bubbles: true, cancelable: true });
        };
        
        arrDateButtons = datePickerContainer.getElementsByClassName('day-marker');
        
        for (i = 0, len = arrDateButtons.length; i < len; i += 1) {
            arrDateButtons[i].addEventListener('click', dateClickHandler);
        }
    }
    
    function closeDatePicker(element) {
        element.datePickerButton.removeAttribute('selected');
        document.body.removeChild(element.datePickerContainer);
    }
    
    function getContentForDatePicker(originDate, bolSelectOrigin) {
        var strHTML = '', i, looperDate, lookaheadDate, intFirstDayOfWeek = 0, dteToday = new Date(),
            arrDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            arrShortDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
            arrMonths = [
                'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
            ];
        
        looperDate = new Date(originDate);
        looperDate.setDate(1);
        
        strHTML =   '<div class="month-marker" flex-horizontal gs-dynamic>' +
                        '<gs-button class="prev-month" inline icononly icon="arrow-left" gs-dynamic>Prev</gs-button>' +
                        '<span flex gs-dynamic>' + arrMonths[originDate.getMonth()] + '</span>' +
                        '<gs-button class="next-month" inline icononly icon="arrow-right" gs-dynamic>Next</gs-button>' +
                    '</div>' +
                    '<div class="year-marker" flex-horizontal gs-dynamic>' +
                        '<gs-button class="prev-year" inline icononly icon="arrow-left" gs-dynamic>Prev</gs-button>' +
                        '<span flex gs-dynamic>' + originDate.getFullYear() + '</span>' +
                        '<gs-button class="next-year" inline icononly icon="arrow-right" gs-dynamic>Next</gs-button>' +
                    '</div>';
        
        if (!isNaN(looperDate.getTime())) {
            
            // reverse back to the previous intFirstDayOfWeek
            i = 0;
            while (looperDate.getDay() !== intFirstDayOfWeek && i < 20) {
                looperDate.setDate(looperDate.getDate() - 1);
                
                i += 1;
            }
            //console.log(looperDate);
            
            // add day of week markers
            strHTML += '<div class="date-picker-divider" gs-dynamic></div><div class="day-of-week-markers-container" gs-dynamic>';
            for (i = 0; i < 7; i += 1) {
                strHTML += '<div class="day-of-week-marker" gs-dynamic>' + arrShortDays[i] + '</div>';
            }
            strHTML += '</div>';
            
            // loop through till at least the end of the month (or further to find the day that is before the next intFirstDayOfWeek)
            i = 0;
            
            lookaheadDate = new Date(looperDate);
            lookaheadDate.setDate(lookaheadDate.getDate() + 1);
            
            while (!(looperDate.getDay()         === intFirstDayOfWeek &&
                    (looperDate.getMonth()       !== originDate.getMonth() && i > 0) &&
                     lookaheadDate.getFullYear() >=  originDate.getFullYear()) &&
                   i < 50) {
                
                strHTML +=  '<gs-button inline class="day-marker';
                
                if (looperDate.getMonth() !== originDate.getMonth()) {
                    strHTML += ' other-month';
                }
                if (looperDate.getFullYear() === dteToday.getFullYear() &&
                    looperDate.getMonth() === dteToday.getMonth() &&
                    looperDate.getDate() === dteToday.getDate()) {
                    strHTML += ' today';
                }
                strHTML += '"';
                
                if (looperDate.getTime() === originDate.getTime() && bolSelectOrigin) {
                    strHTML += ' selected ';
                }
                
                strHTML +=  'data-date="' + looperDate + '" gs-dynamic>';
                if (looperDate.getFullYear() === dteToday.getFullYear() &&
                    looperDate.getMonth() === dteToday.getMonth() &&
                    looperDate.getDate() === dteToday.getDate()) {
                    strHTML += 'T';
                } else {
                    strHTML += looperDate.getDate();
                }
                strHTML += '</gs-button>';
                
                //console.log(looperDate, lookaheadDate);
                
                lookaheadDate.setDate(lookaheadDate.getDate() + 1);
                looperDate.setDate(looperDate.getDate() + 1);
                i += 1;
            }
        }

        return strHTML;
    }

    function handleFormat(element, event, bolAlertOnError) {
        ///console.log(element.value);
        if (element.value) {
            var dteValue, strValueToFormat = element.value, tempSelection = GS.getInputSelection(element.control);
    
            // if there is a day of the week in the value: remove it
            if (strValueToFormat.match(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/gim)) {
                strValueToFormat = strValueToFormat.replace(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/gim, '')
                                                   .replace(/  /gim, ' ')
                                                   .trim();
            }
    
            if (strValueToFormat.indexOf(':') !== -1) {
                strValueToFormat = strValueToFormat.substring(0, strValueToFormat.indexOf(':'));
                strValueToFormat = strValueToFormat.substring(0, strValueToFormat.lastIndexOf(' '));
            }
    
            // if there are only six numbers in the field assume that
            //      the first  two are the month
            //      the second two are the day   and
            //      the third  two are the year  and make a date out of that
            if (strValueToFormat.length === 6 && strValueToFormat.match(/[0-9]/g).join('') === element.value) {
                dteValue = new Date(strValueToFormat.substring(0, 2) + '/' +
                                    strValueToFormat.substring(2, 4) + '/' +
                                    strValueToFormat.substring(4, 6));
            } else {
                //console.log(strValueToFormat.replace(/-/, '/').replace(/-/, '/').replace(/-.*/, ''));
                dteValue = new Date(strValueToFormat.replace(/-/, '/').replace(/-/, '/').replace(/-.*/, ''));
                //console.log(dteValue, dteValue.getFullYear());
            }
            
            //console.trace('test', element.value, strValueToFormat, dteValue);
            
            if (isNaN(dteValue.getTime())) {
                if (bolAlertOnError !== undefined && bolAlertOnError !== false) {
                    alert('Invalid Date: ' + element.value);
                }
                
                if (document.activeElement === element.control) {
                    GS.setInputSelection(element.control, tempSelection.start, tempSelection.end);
                    
                    if (event) {
                        if (event.keyCode === GS.keyCode('backspace')) {
                            GS.setInputSelection(element.control, tempSelection.start - 1, tempSelection.start - 1);
                        } else if (event.keyCode === GS.keyCode('delete')) {
                            GS.setInputSelection(element.control, tempSelection.start, tempSelection.start);
                        }
                        event.stopPropagation();
                        event.preventDefault();
                    }
                }
                
            } else {
                if (element.control) {
                    element.control.value = formatDate(dteValue, getFormatString(element));
                    if (document.activeElement === element.control) {
                        GS.setInputSelection(element.control, tempSelection.start, tempSelection.end);
                    }
                } else {
                    element.innerHTML = formatDate(dteValue, getFormatString(element));
                }
            }
        } else {
            return 'NULL';
        }
    }
    
    function getFormatString(element) {
        var strFormat;
        
        if (element.hasAttribute('format')) {
            strFormat = element.getAttribute('format');
        }
        
        if (!strFormat) {
            strFormat = 'MM/dd/yyyy';
        } else if (strFormat.toLowerCase() === 'shortdate') {
            strFormat = 'M/d/yy';
        } else if (strFormat.toLowerCase() === 'mediumdate') {
            strFormat = 'MMM d, yyyy';
        } else if (strFormat.toLowerCase() === 'longdate') {
            strFormat = 'MMMM d, yyyy';
        } else if (strFormat.toLowerCase() === 'fulldate') {
            strFormat = 'EEEE, MMMM d, yyyy';
        } else if (strFormat.toLowerCase() === 'shorttime') {
            strFormat = 'h:mm a';
        } else if (strFormat.toLowerCase() === 'mediumtime') {
            strFormat = 'h:mm:ss a';
        } else if (strFormat.toLowerCase() === 'isodate') {
            strFormat = 'yyyy-MM-dd';
        } else if (strFormat.toLowerCase() === 'isotime') {
            strFormat = 'HH:mm:ss';
        } else if (strFormat.toLowerCase() === 'isodatetime') {
            strFormat = 'yyyy-MM-dd\'T\'HH:mm:ss';
        }
        
        return strFormat;
    }
    
    function formatDate(dteValue, strFormat) {
        /* (this function contains a (modified) substantial portion of code from another source
            here is the copyright for sake of legality) (Uses code by Matt Kruse)
        Copyright (c) 2006-2009 Rostislav Hristov, Asual DZZD
        
        Permission is hereby granted, free of charge, to any person obtaining a 
        copy of this software and associated documentation files 
        (the "Software"), to deal in the Software without restriction, 
        including without limitation the rights to use, copy, modify, merge, 
        publish, distribute, sublicense, and/or sell copies of the Software, 
        and to permit persons to whom the Software is furnished to do so, 
        subject to the following conditions:
        
        The above copyright notice and this permission notice shall be included 
        in all copies or substantial portions of the Software.
        
        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS 
        OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
        MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
        IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY 
        CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
        TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
        SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.*/
        var i = 0, j = 0, l = 0, c = '', token = '', x, y, yearLen,
            formatNumber = function (n, s) {
                if (typeof s == 'undefined' || s == 2) {
                  return (n >= 0 && n < 10 ? '0' : '') + n;
                } else {
                    if (n >= 0 && n < 10) {
                       return '00' + n; 
                    }
                    if (n >= 10 && n <100) {
                       return '0' + n;
                    }
                    return n;
                }
            },
            locale = {
                monthsFull:   ['January','February','March','April','May','June', 'July','August','September','October','November','December'],
                monthsShort:  ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
                daysFull:     ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
                daysShort:    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
                shortDateFormat: 'M/d/yyyy h:mm a',
                longDateFormat: 'EEEE, MMMM dd, yyyy h:mm:ss a'
            };

        y = dteValue.getFullYear();
        // Nunzio commented this out on Monday, October 19, 2015
        // It was causing an issue during typing in the year field
        /*if (y < 1000) {
            y = String(y + 1900);
        }*/

        var M = dteValue.getMonth() + 1,
            d = dteValue.getDate(),
            E = dteValue.getDay(),
            H = dteValue.getHours(),
            m = dteValue.getMinutes(),
            s = dteValue.getSeconds(),
            S = dteValue.getMilliseconds();
        
        //console.log(dteValue.getFullYear());
        
        yearLen = String(y).length;
        dteValue = {
            y: y,
            yyyy: y,
            yy: String(y).substring(yearLen - 2, yearLen),
            M: M,
            MM: formatNumber(M),
            MMM: locale.monthsShort[M-1],
            MMMM: locale.monthsFull[M-1],
            d: d,
            dd: formatNumber(d),
            EEE: locale.daysShort[E],
            EEEE: locale.daysFull[E],
            H: H,
            HH: formatNumber(H)
        };
        
        //console.log(dteValue);

        if (H === 0) {
            dteValue.h = 12;
        } else if (H > 12) {
            dteValue.h = H - 12;
        } else {
            dteValue.h = H;
        }

        dteValue.hh = formatNumber(dteValue.h);
        dteValue.k = H !== 0 ? H : 24;
        dteValue.kk = formatNumber(dteValue.k);

        if (H > 11) {
            dteValue.K = H - 12;
        } else {
            dteValue.K = H;
        }

        dteValue.KK = formatNumber(dteValue.K);

        if (H > 11) {
            dteValue.a = 'PM';
        } else {
            dteValue.a = 'AM';
        }

        dteValue.m = m;
        dteValue.mm = formatNumber(m);
        dteValue.s = s;
        dteValue.ss = formatNumber(s);
        dteValue.S = S;
        dteValue.SS = formatNumber(S);
        dteValue.SSS = formatNumber(S, 3);

        var result = '';

        i = 0;
        c = '';
        token = '';
        s = false;

        while (i < strFormat.length) {
            token = '';   
            c = strFormat.charAt(i);
            if (c == '\'') {
                i++;
                if (strFormat.charAt(i) == c) {
                    result = result + c;
                    i++;
                } else {
                    s = !s;
                }
            } else {
                while (strFormat.charAt(i) == c) {
                    token += strFormat.charAt(i++);
                }
                if (token.indexOf('MMMM') != -1 && token.length > 4) {
                    token = 'MMMM';
                }
                if (token.indexOf('EEEE') != -1 && token.length > 4) {
                    token = 'EEEE';
                }
                if (typeof dteValue[token] != 'undefined' && !s) {
                    result = result + dteValue[token];
                } else {
                    result = result + token;
                }
            }
        }
        
        return result;
    }
    
    // dont do anything that modifies the element here
    function elementCreated(element) {
        // if "created" hasn't been suspended: run created code
        if (!element.hasAttribute('suspend-created')) {
            // if the value was set before the "created" lifecycle code runs: set attribute
            //      (discovered when trying to set a value of a date control in the after_open of a dialog)
            //      ("delete" keyword added because of firefox)
            if (element.value && new Date(element.value).getTime()) {
                element.setAttribute('value', element.value);
                delete element.value;
                //element.value = undefined;
                //element.value = null;
            }
            
        }
    }
    
    //
    function elementInserted(element) {
        var today, strQSValue;
        
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                element.internal = {};
                saveDefaultAttributes(element)
                
                if (element.hasAttribute('tabindex')) {
                    element.oldTabIndex = element.getAttribute('tabindex');
                    element.removeAttribute('tabindex');
                }
                
                if (element.hasAttribute('value') && element.getAttribute('value').trim().toLowerCase() === 'today') {
                    today = new Date();
                    element.setAttribute('value', GS.leftPad(today.getFullYear(), '0', 4) + '/' + GS.leftPad(today.getMonth() + 1, '0', 2) + '/' + GS.leftPad(today.getDate(), '0', 2));
                }
                
                // handle "qs" attribute
                if (element.getAttribute('qs')) {
                    //strQSValue = GS.qryGetVal(GS.getQueryString(), element.getAttribute('qs'));
                    //
                    //if (strQSValue !== '' || !element.getAttribute('value')) {
                    //    element.setAttribute('value', strQSValue);
                    //}
                    
                    pushReplacePopHandler(element);
                    window.addEventListener('pushstate',    function () { pushReplacePopHandler(element); });
                    window.addEventListener('replacestate', function () { pushReplacePopHandler(element); });
                    window.addEventListener('popstate',     function () { pushReplacePopHandler(element); });
                }
                
                //if (element.hasAttribute('disabled')) {
                //    element.innerHTML = element.getAttribute('value') || element.getAttribute('placeholder') || '';
                //} else {
                if (!element.hasAttribute('disabled')) {
                    element.innerHTML = '';
                    element.appendChild(singleLineTemplate.cloneNode(true));
                    if (element.oldTabIndex) {
                        xtag.query(element, '.control')[0].setAttribute('tabindex', element.oldTabIndex);
                    }
                }
                //}
                
                //if (element.innerHTML === '') {
                //    element.appendChild(singleLineTemplate.cloneNode(true));
                //    if (element.oldTabIndex) {
                //        xtag.query(element, '.control')[0].setAttribute('tabindex', element.oldTabIndex);
                //    }
                //}
                
                element.refresh();
            }
        }
    }
    
    function getControlState(element) {
        var jsnTextSelection, intStart, intEnd, strFormat = getFormatString(element),
            strValue = element.control.value, delimiter1index, delimiter2index,
            intCurrentSection, strCurrentSection, arrParts, intCurrentSectionSize;
        
        jsnTextSelection = GS.getInputSelection(element.control);
        intStart = jsnTextSelection.start;
        intEnd = jsnTextSelection.end;
        delimiter1index = (strValue.indexOf('-') === -1 ? strValue.indexOf('/') : strValue.indexOf('-'));
        delimiter2index = (strValue.lastIndexOf('-') === -1 ? strValue.lastIndexOf('/') : strValue.lastIndexOf('-'));
        arrParts = strFormat.split(/[-|/]/g);
        
        // calculate current section number
        if (intStart > delimiter2index) {
            intCurrentSection = 2;
        } else if (intStart > delimiter1index && intStart <= delimiter2index) {
            intCurrentSection = 1;
        } else {
            intCurrentSection = 0;
        }
        
        // calculate current part type
        if (arrParts[intCurrentSection].indexOf('y') !== -1) {
            strCurrentSection = 'year';
        } else if (arrParts[intCurrentSection].indexOf('M') !== -1) {
            strCurrentSection = 'month';
        } else {
            strCurrentSection = 'day';
        }
        
        // calculate current section size
        if (intCurrentSection === 2) {
            intCurrentSectionSize = (strValue.length) - (delimiter2index + 1);
        } else if (intCurrentSection === 1) {
            intCurrentSectionSize = delimiter2index - (delimiter1index + 1);
        } else {
            intCurrentSectionSize = delimiter1index;
        }
        
        return {
            'jsnTextSelection': jsnTextSelection,
            'intStart': intStart,
            'intEnd': intEnd,
            'strFormat': strFormat,
            'strValue': strValue,
            'delimiter1index': delimiter1index,
            'delimiter2index': delimiter2index,
            'intCurrentSection': intCurrentSection,
            'strCurrentSection': strCurrentSection,
            'arrParts': arrParts,
            'intCurrentSectionSize': intCurrentSectionSize
        };
    }
    
    xtag.register('gs-date', {
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
                    if (strAttrName === 'disabled' && newValue !== null) {
                        this.innerHTML = this.getAttribute('value') || this.getAttribute('placeholder');
                    } else if (strAttrName === 'disabled' && newValue === null) {
                        this.innerHTML = '';
                        this.appendChild(singleLineTemplate.cloneNode(true));
                        if (this.oldTabIndex) {
                            xtag.query(this, '.control')[0].setAttribute('tabindex', this.oldTabIndex);
                        }
                        this.refresh();
                    } else if (strAttrName === 'value') {
                        this.value = newValue;
                    }
                }
            }
        },
        events: {
            focus: function (event) {
                if (!this.hasAttribute('suspend-created') && !this.hasAttribute('suspend-inserted')) {
                    //console.log('1***', this.control, GS.getInputSelection(this.control));
                }
            },
            click: function (event) {
                var jsnTextSelection, intStart, strFormat, strValue, delimiter1index, delimiter2index;
                
                if (!this.hasAttribute('suspend-created') && !this.hasAttribute('suspend-inserted') && !this.hasAttribute('readonly')) {
                    jsnTextSelection = GS.getInputSelection(this.control);
                    strFormat = getFormatString(this);
                    strValue = this.control.value;
                    
                    // if format is dash delimited or slash delimited and
                    //      we are not on a touch device
                    if ((/^[M|y]{1,}[/|-]{1}[M|d]{1,}[/|-]{1}[d|y]{1,}$/).test(strFormat) &&
                        (strValue.substring(jsnTextSelection.start, jsnTextSelection.end).match(/[-|/]/g) || []).length === 0 &&
                        !evt.touchDevice) {
                        
                        // if there is a date and it's dash or slash delimited: select date part
                        if ((/^[0-9]{1,}[-]{1}[0-9]{1,}[-]{1}[0-9]{1,}$/).test(strValue) ||
                            (/^[0-9]{1,}[/]{1}[0-9]{1,}[/]{1}[0-9]{1,}$/).test(strValue)) {
                            
                            intStart = jsnTextSelection.start;
                            delimiter1index = (strValue.indexOf('-') === -1 ? strValue.indexOf('/') : strValue.indexOf('-'));
                            delimiter2index = (strValue.lastIndexOf('-') === -1 ? strValue.lastIndexOf('/') : strValue.lastIndexOf('-'));
                            
                            // if greater than second delimeter
                            if (intStart > delimiter2index) {
                                //console.log('Section 3');
                                GS.setInputSelection(this.control, delimiter2index + 1, strValue.length);
                                
                            // if in between than first and second delimeter
                            } else if (intStart > delimiter1index && intStart <= delimiter2index) {
                                //console.log('Section 2');
                                GS.setInputSelection(this.control, delimiter1index + 1, delimiter2index);
                                
                            // else
                            } else {
                                //console.log('Section 1');
                                GS.setInputSelection(this.control, 0, delimiter1index);
                            }
                            
                            //console.log(intStart, delimiter1index, delimiter2index);
                        }
                    }
                }
            },
            keydown: function (event) { // tried "input" event
                var jsnTextSelection, intStart, intEnd, strFormat, strValue,
                    intKeyCode = (event.keyCode || event.which), delimiter1index, delimiter2index,
                    intCurrentSection, strCurrentSection, arrParts, dteDate, intCurrentSectionSize,
                    jsnState;
                
                if (!this.hasAttribute('suspend-created') && !this.hasAttribute('suspend-inserted') && !this.hasAttribute('readonly')) {
                    jsnTextSelection = GS.getInputSelection(this.control);
                    strValue = this.control.value;
                    strFormat = getFormatString(this);
                    
                    // if format is dash delimited or slash delimited and
                    //      the selection doesn't encompass a delimeter and
                    //      we are not on a touch device
                    if ((/^[M|y]{1,}[/|-]{1}[M|d]{1,}[/|-]{1}[d|y]{1,}$/).test(strFormat) &&
                        (strValue.substring(jsnTextSelection.start, jsnTextSelection.end).match(/[-|/]/g) || []).length === 0 &&
                        !evt.touchDevice) {
                        
                        // if there is a date and it's dash or slash delimited
                        if ((/^[0-9]{1,}[-]{1}[0-9]{1,}[-]{1}[0-9]{1,}$/).test(strValue) ||
                            (/^[0-9]{1,}[/]{1}[0-9]{1,}[/]{1}[0-9]{1,}$/).test(strValue)) {
                            
                            // if shift, command and option keys are not down
                            if (!event.shiftKey && !event.metaKey && !event.ctrlKey) {
                                event.stopPropagation();
                                
                                jsnState = getControlState(this)
                                jsnTextSelection =      jsnState.jsnTextSelection
                                intStart =              jsnState.intStart
                                intEnd =                jsnState.intEnd
                                strFormat =             jsnState.strFormat
                                strValue =              jsnState.strValue
                                delimiter1index =       jsnState.delimiter1index
                                delimiter2index =       jsnState.delimiter2index
                                intCurrentSection =     jsnState.intCurrentSection
                                strCurrentSection =     jsnState.strCurrentSection
                                arrParts =              jsnState.arrParts
                                intCurrentSectionSize = jsnState.intCurrentSectionSize
                                
                                //// log
                                //console.log('intCurrentSectionSize: ' + intCurrentSectionSize + '\n' +
                                //            'intCurrentSection:     ' + intCurrentSection + '\n' +
                                //            'delimiter1index:       ' + delimiter1index + '\n' +
                                //            'delimiter2index:       ' + delimiter2index + '\n' +
                                //            'strValue.length:       ' + strValue.length + '\n' +
                                //            'strCurrentSection:     ' + strCurrentSection + '\n' +
                                //            'strValue:              ' + strValue + '\n' +
                                //            'Selection Start:       ' + jsnTextSelection.start + '\n' +
                                //            'Selection End:         ' + jsnTextSelection.end);
                                
                                // if number: replace current date part
                                if ((intKeyCode >= 96 && intKeyCode <= 105) || // numpad numbers
                                    (intKeyCode >= 48 && intKeyCode <= 57)) {  // other numbers
                                    this.keyupHandle = true;
                                    
                                // if (/|-):
                                } else if (intKeyCode === 111 || intKeyCode === 191 || // "/"
                                           intKeyCode === 109 || intKeyCode === 189) { // "-"
                                    // if first part: go to second part
                                    if (intCurrentSection === 0) {
                                        intCurrentSection = 1;
                                        
                                    // if second part: go to third part
                                    } else if (intCurrentSection === 1) {
                                        intCurrentSection = 2;
                                    }
                                    
                                // if horizontal arrow: move to a different date part
                                } else if (intKeyCode === 37 || // left arrow
                                           intKeyCode === 39) { // right arrow
                                    //console.log(intCurrentSection, intKeyCode);
                                    
                                    if (intCurrentSection === 2 && intKeyCode === 37) {
                                        intCurrentSection = 1;
                                        
                                    } else if (intCurrentSection === 1) {
                                        if (intKeyCode === 37) {
                                            intCurrentSection = 0;
                                        } else {
                                            intCurrentSection = 2;
                                        }
                                        
                                    } else if (intCurrentSection === 0 && intKeyCode === 39) {
                                        intCurrentSection = 1;
                                    }
                                    
                                // if vertical arrow: update current date part
                                } else if (intKeyCode === 38 || // up arrow
                                           intKeyCode === 40) { // down arrow
                                    // If the date is in ISO format, new Date() will create it in GMT then convert it to the local timezone
                                    dteDate = new Date(strValue + ' 00:00:00');
                                    
                                    // if current part is year
                                    if (strCurrentSection === 'year') {
                                        //console.log(dteDate, dteDate.getFullYear(), dteDate.getYear(), (intKeyCode === 38 ? 1 : -1),
                                        //                        dteDate.getYear() + (intKeyCode === 38 ? 1 : -1));
                                        
                                        // We're using "getFullYear" here instead of "getYear" because "getYear" for some unknown reason
                                        //      worked fine before the 29th of october 2015 (that's the date of discovery anyway) but now
                                        //      throws a number over a thousand years off instead of the actual number.
                                        // Upon looking at the docs, "getYear" is apparently subject to the demons of y2k and no longer
                                        //      supported. Wouldn't it have been better to just make "getYear" do the dame thing as
                                        //      "getFullYear"?
                                        // Still unexplained is why when I tested not more than a week ago it worked without a hitch.
                                        dteDate.setFullYear(dteDate.getFullYear() + (intKeyCode === 38 ? 1 : -1));
                                        
                                        //console.log(dteDate);
                                        
                                    // if current part is month
                                    } else if (strCurrentSection === 'month') {
                                        dteDate.setMonth(dteDate.getMonth() + (intKeyCode === 38 ? 1 : -1));
                                        
                                    // if current part is day
                                    } else if (strCurrentSection === 'day') {
                                        dteDate.setDate(dteDate.getDate() + (intKeyCode === 38 ? 1 : -1));
                                    }
                                    
                                    // set the value
                                    strValue = formatDate(dteDate, strFormat);
                                    this.control.value = strValue;
                                    this.triggerChangeManually = true;
                                }
                                
                                if (this.keyupHandle !== true) {
                                    // reset the section selection in case something has changed it
                                    if (intCurrentSection === 2) {
                                        GS.setInputSelection(this.control, delimiter2index + 1, strValue.length);
                                        
                                    } else if (intCurrentSection === 1) {
                                        GS.setInputSelection(this.control, delimiter1index + 1, delimiter2index);
                                        
                                    } else {
                                        GS.setInputSelection(this.control, 0, delimiter1index);
                                    }
                                }
                                
                                // if not return or tab or number: prevent
                                if (!(intKeyCode >= 96 && intKeyCode <= 105) && // numpad numbers
                                    !(intKeyCode >= 48 && intKeyCode <= 57) &&
                                    intKeyCode !== 13 && // return/enter
                                    intKeyCode !== 9) {  // tab
                                    event.preventDefault();
                                }
                            }
                        }
                    }
                }
            },
            keyup: function (event) {
                var jsnTextSelection, intStart, intEnd, strFormat, strValue,
                    intKeyCode = (event.keyCode || event.which),
                    delimiter1index, delimiter2index, intCurrentSection, strCurrentSection,
                    arrParts, dteDate, intCurrentSectionSize, jsnState;
                
                if (!this.hasAttribute('suspend-created') && !this.hasAttribute('suspend-inserted') && !this.hasAttribute('readonly')) {
                    strFormat = getFormatString(this);
                    
                    // if format is dash delimited or slash delimited and
                    //      keyup has been allowed and
                    //      we are not on a touch device
                    if ((/^[M|y]{1,}[/|-]{1}[M|d]{1,}[/|-]{1}[d|y]{1,}$/).test(strFormat) && this.keyupHandle && !evt.touchDevice) {
                        
                        // if shift, command and option keys are not down
                        if (!event.shiftKey && !event.metaKey && !event.ctrlKey) {
                            jsnState = getControlState(this)
                            jsnTextSelection =      jsnState.jsnTextSelection
                            intStart =              jsnState.intStart
                            intEnd =                jsnState.intEnd
                            strFormat =             jsnState.strFormat
                            strValue =              jsnState.strValue
                            delimiter1index =       jsnState.delimiter1index
                            delimiter2index =       jsnState.delimiter2index
                            intCurrentSection =     jsnState.intCurrentSection
                            strCurrentSection =     jsnState.strCurrentSection
                            arrParts =              jsnState.arrParts
                            intCurrentSectionSize = jsnState.intCurrentSectionSize
                            
                            //// log
                            //console.log('intCurrentSectionSize: ' + intCurrentSectionSize + '\n' +
                            //            'intCurrentSection:     ' + intCurrentSection + '\n' +
                            //            'delimiter1index:       ' + delimiter1index + '\n' +
                            //            'delimiter2index:       ' + delimiter2index + '\n' +
                            //            'strValue.length:       ' + strValue.length + '\n' +
                            //            'strCurrentSection:     ' + strCurrentSection + '\n' +
                            //            'strValue:              ' + strValue + '\n' +
                            //            'strFormat:             ' + strFormat);
                            
                            if ((strCurrentSection === 'day' && intCurrentSectionSize === 2) ||
                                (strCurrentSection === 'month' && intCurrentSectionSize === 2) ||
                                (strCurrentSection === 'year' && intCurrentSectionSize === strFormat.match(/y/g).length)) {
                                
                                if (intCurrentSection === 2) {
                                    GS.setInputSelection(this.control, delimiter2index + 1, strValue.length);
                                    
                                } else if (intCurrentSection === 1) {
                                    GS.setInputSelection(this.control, delimiter1index + 1, delimiter2index);
                                    
                                } else {
                                    GS.setInputSelection(this.control, 0, delimiter1index);
                                }
                            }
                        }
                    }
                    this.keyupHandle = false;
                    
                    //console.log(intKeyCode);
                    if (intKeyCode === 13 && this.triggerChangeManually) {
                        this.triggerChangeManually = false;
                        GS.triggerEvent(this, 'change');
                    }
                }
            },
            focusout: function () {
                if (!this.hasAttribute('suspend-created') && !this.hasAttribute('suspend-inserted')) {
                    //console.log(this.triggerChangeManually);
                    if (this.triggerChangeManually) {
                        this.triggerChangeManually = false;
                        GS.triggerEvent(this, 'change');
                    }
                }
            }
            
            
            /*// on keydown and keyup sync the value attribute and the control value
            keydown: function (event) {
                var element = this, currentDate, currentSelectionRange, currentSelectionText, currentSelectionNumber, currentSelectionFormatText,
                    currentValue, newValue, strDateFormat, formatDivider, arrMatch, currentFieldRange, newCursorPos, newFieldValue,
                    daysOfTheWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                    monthsOfTheYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                    strKeyCode = event.keyCode.toString();
                
                currentSelectionRange = GS.getInputSelection(element.control);
                
                if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
                    if (element.getAttribute('disabled') !== null && event.keyCode !== 9) {
                        event.preventDefault();
                        event.stopPropagation();
                    } else {
                        //console.log(strKeyCode === GS.keyCode('left arrow')  , GS.keyCode('left arrow') );
                        //console.log(strKeyCode === GS.keyCode('up arrow')    , GS.keyCode('up arrow'));
                        //console.log(strKeyCode === GS.keyCode('right arrow') , GS.keyCode('right arrow'));
                        //console.log(strKeyCode === GS.keyCode('down arrow')  , GS.keyCode('down arrow'));
                        
                        // When the user presses an arrow key:
                        // It finds the current number that the user has selected
                        //     If they pressed up or down
                        //         (inc/dec)rement the current number (handling day and month names of course)
                        //     If they pressed left or right
                        //         Move their selection to the left or right depending on what they pressed
                        // Then moves the selection to the current number (handling day/month name length differences)
                        
                        // Fix date format
                        strDateFormat = element.getAttribute('format');
                        //console.log(strDateFormat);
                        if (!strDateFormat) {
                            strDateFormat = 'MM/dd/yyyy';
                        } else if (strDateFormat.toLowerCase() === 'shortdate') {
                            strDateFormat = 'M/d/yy';
                        } else if (strDateFormat.toLowerCase() === 'mediumdate') {
                            strDateFormat = 'MMM d, yyyy';
                        } else if (strDateFormat.toLowerCase() === 'longdate') {
                            strDateFormat = 'MMMM d, yyyy';
                        } else if (strDateFormat.toLowerCase() === 'fulldate') {
                            strDateFormat = 'EEEE, MMMM d, yyyy';
                        } else if (strDateFormat.toLowerCase() === 'shorttime') {
                            strDateFormat = 'h:mm a';
                        } else if (strDateFormat.toLowerCase() === 'mediumtime') {
                            strDateFormat = 'h:mm:ss a';
                        } else if (strDateFormat.toLowerCase() === 'isodate') {
                            strDateFormat = 'yyyy-MM-dd';
                        } else if (strDateFormat.toLowerCase() === 'isotime') {
                            strDateFormat = 'HH:mm:ss';
                        } else if (strDateFormat.toLowerCase() === 'isodatetime') {
                            strDateFormat = 'yyyy-MM-dd\'T\'HH:mm:ss';
                        }
                        
                        formatDivider = strDateFormat.match(/[^mdyehmsa]/gi).join('');
                        
                        currentValue = element.control.value;
                        currentDate = new Date(currentValue.replace('\'T\'', ' ').replace(/-/g, '/'));
                        
                        if (strDateFormat.indexOf('M') === -1) {
                            currentDate = new Date('2015/6/15 ' + currentValue);
                        }
                        
                        arrMatch = strDateFormat.match(/(M|E)+/g);
                        if (arrMatch && arrMatch[0].length > 3) {
                            strDateFormat = strDateFormat.replace(/E+/g, new Array(daysOfTheWeek[currentDate.getDay()].length + 1).join('E'));
                            strDateFormat = strDateFormat.replace(/M+/g, new Array(monthsOfTheYear[currentDate.getDay()].length + 1).join('M'));
                        }
                        
                        // If it was an arrow that was pressed
                        if (strKeyCode === GS.keyCode('left arrow') ||
                            strKeyCode === GS.keyCode('up arrow') ||
                            strKeyCode === GS.keyCode('right arrow') ||
                            strKeyCode === GS.keyCode('down arrow')) {
                            
                            //console.log('test');
                            
                            // Prevent the browser from moving the cursor and prevent envelope from using arrows
                            event.preventDefault();
                            event.stopPropagation();
                            
                            //console.log(currentValue, formatDivider, currentSelectionRange.start, currentSelectionRange.end);
                            
                            // Encompass the field in which the cursor is inside
                            while (currentSelectionRange.start >= 0 && formatDivider.indexOf(currentValue[currentSelectionRange.start - 1]) < 0) {
                                currentSelectionRange.start -= 1;
                            }
                            
                            currentSelectionRange.end = currentSelectionRange.start;
                            while ( currentSelectionRange.end < currentValue.length &&
                                    formatDivider.indexOf(currentValue[currentSelectionRange.end]) < 0) {
                                currentSelectionRange.end += 1;
                            }
                            
                            //console.log(currentValue, currentSelectionRange.start, currentSelectionRange.end);
                            
                            GS.setInputSelection(element.control, currentSelectionRange.start, currentSelectionRange.end);
                            
                            currentSelectionText = currentValue.substring(currentSelectionRange.start, currentSelectionRange.end);
                            currentSelectionFormatText = strDateFormat.substring(currentSelectionRange.start, currentSelectionRange.end);
                            
                            // If it is up or down
                            if (strKeyCode === GS.keyCode('up arrow') ||
                                strKeyCode === GS.keyCode('down arrow')) {
                                var increment = strKeyCode === GS.keyCode('up arrow') ? 1 : -1;
                                
                                if (currentSelectionFormatText[0] === 'M') {
                                    currentDate.setMonth(currentDate.getMonth() +       increment);
                                    if ((currentSelectionRange.end - currentSelectionRange.start) > 2) {
                                        currentSelectionRange.end = currentSelectionRange.start + currentSelectionText.indexOf(' ');
                                    } else {
                                        currentSelectionRange.end = currentSelectionRange.start + currentDate.getMonth().toString().length;
                                    }
                                    
                                } else if (currentSelectionFormatText[0] === 'd') {
                                    currentDate.setDate(currentDate.getDate() + increment);
                                    currentSelectionRange.end = currentSelectionRange.start + currentDate.getDate().toString().length;
                                    
                                } else if (currentSelectionFormatText[0] === 'y') {
                                    currentDate.setFullYear(currentDate.getFullYear() + increment);
                                    currentSelectionRange.end = currentSelectionRange.start + currentDate.getFullYear().toString().length;
                                    
                                } else if (currentSelectionFormatText[0] === 'E') {
                                    currentDate.setDate(currentDate.getDate() + increment);
                                    currentSelectionRange.start = 0;
                                    currentSelectionRange.end = daysOfTheWeek[currentDate.getDay()].length;
                                    
                                } else if (currentSelectionFormatText[0] === 'h' || currentSelectionFormatText[0] === 'H') {
                                    currentDate.setHours(currentDate.getHours() + increment);
                                    currentSelectionRange.end = currentSelectionRange.start + currentDate.getHours().toString().length;
                                    
                                } else if (currentSelectionFormatText[0] === 'm') {
                                    currentDate.setMinutes(currentDate.getMinutes() + increment);
                                    currentSelectionRange.end = currentSelectionRange.start + currentDate.getMinutes().toString().length;
                                    
                                } else if (currentSelectionFormatText[0] === 's') {
                                    currentDate.setSeconds(currentDate.getSeconds() + increment);
                                    currentSelectionRange.end = currentSelectionRange.start + currentDate.getSeconds().toString().length;
                                    
                                } else if (currentSelectionFormatText[0] === 'a') {
                                    currentDate.setHours(currentDate.getHours() + 12);
                                }
                                
                                newValue = formatDate(currentDate, strDateFormat);
                                this.control.value = newValue;
                                currentValue = newValue;
                            } else if (strKeyCode === GS.keyCode('left arrow')) {
                                currentSelectionRange.end = currentSelectionRange.start - 2;
                                currentSelectionRange.start = currentSelectionRange.end;
                            } else if (strKeyCode === GS.keyCode('right arrow')) {
                                currentSelectionRange.end = currentSelectionRange.end + 2;
                                currentSelectionRange.start = currentSelectionRange.end;
                            }
                            
                            // Copied from above
                            arrMatch = strDateFormat.match(/(M|E)+/g);
                            if (arrMatch && arrMatch[0].length > 3) {
                                strDateFormat = strDateFormat.replace(/E+/g, new Array(daysOfTheWeek[currentDate.getDay()].length + 1).join('E'));
                                strDateFormat = strDateFormat.replace(/M+/g, new Array(monthsOfTheYear[currentDate.getDay()].length + 1).join('M'));
                            }
                            while (currentSelectionRange.start >= 0 && formatDivider.indexOf(currentValue[currentSelectionRange.start - 1]) < 0) {
                                currentSelectionRange.start -= 1;
                            }
                            currentSelectionRange.end = currentSelectionRange.start;
                            while ( currentSelectionRange.end < currentValue.length &&
                                    formatDivider.indexOf(currentValue[currentSelectionRange.end]) < 0) {
                                currentSelectionRange.end += 1;
                            }
                            
                            GS.setInputSelection(element.control, currentSelectionRange.start, currentSelectionRange.end);
                            
                        // All number keys
                        } else if (event.keyCode >= 96 && event.keyCode <= 105) {
                            //// HARK YE ONLOOKER:
                            //// This code caps the number that is inputed by the user to the length that the format allows,
                            //// this will dissallow anyone form entering a year that is > 4 characters unless the
                            //// page's developer allows it in a custom format.
                            //// 
                            //// This should be fixed around the year 9998 to have all default formats have 5 character years
                            
                            currentSelectionText = currentValue.substring(currentSelectionRange.start, currentSelectionRange.end);
                            currentSelectionFormatText = strDateFormat.substring(currentSelectionRange.start, currentSelectionRange.end);
                            
                            currentValue = element.value;
                            
                            // This is sort of copied from above
                            // There are only two differences:
                            //     the var name
                            //     the initialization on the next line
                            currentFieldRange = {
                                start: currentSelectionRange.start
                            };
                            while (currentFieldRange.start >= 0 && formatDivider.indexOf(currentValue[currentFieldRange.start - 1]) < 0) {
                                currentFieldRange.start -= 1;
                            }
                            currentFieldRange.end = currentFieldRange.start;
                            while ( currentFieldRange.end < currentValue.length &&
                                    formatDivider.indexOf(currentValue[currentFieldRange.end]) < 0) {
                                currentFieldRange.end += 1;
                            }
                            
                            //console.log(currentFieldRange);
                            
                            //console.log(currentValue.substring(0, currentSelectionRange.start));
                            //console.log(GS.charFromKeyCode(event), currentSelectionText, currentSelectionFormatText, currentDate);
                            //console.log(currentValue.substring(currentSelectionRange.end));
                            
                            // This error checking is probably unneeded, but what the hey
                            currentFieldRange.start = Math.max(currentFieldRange.start, 0);
                            arrMatch = strDateFormat.match(strDateFormat[currentFieldRange.start] + '+', 'g');
                            if (arrMatch) {
                                // Prevent the browser from putting the number in for us
                                event.preventDefault();
                                
                                // Get the character that they pressed
                                newFieldValue = GS.charFromKeyCode(event);
                                console.log(newFieldValue);
                                // Cap the length to the format field's length by using
                                // all characters in the field except the first one
                                newFieldValue = currentValue.substring(currentFieldRange.start + 1, currentFieldRange.start + arrMatch[0].length) + newFieldValue;
                                console.log(newFieldValue, currentValue);
                                
                                console.log(currentFieldRange.start + 1, currentFieldRange.start + arrMatch[0].length);
                                
                                // Build the value using the current field range and the new field value we built above
                                element.value = 
                                    currentValue.substring(0, currentFieldRange.start) +
                                    newFieldValue +
                                    currentValue.substring(currentFieldRange.end);
                                
                                
                                console.log(currentValue.substring(0, currentFieldRange.start), newFieldValue, currentValue.substring(currentFieldRange.end));
                            
                                // This is copied from above
                                currentFieldRange = {
                                    start: currentSelectionRange.start
                                };
                                while (currentFieldRange.start >= 0 && formatDivider.indexOf(currentValue[currentFieldRange.start - 1]) < 0) {
                                    currentFieldRange.start -= 1;
                                }
                                currentFieldRange.end = currentFieldRange.start;
                                while ( currentFieldRange.end < currentValue.length &&
                                        formatDivider.indexOf(currentValue[currentFieldRange.end]) < 0) {
                                    currentFieldRange.end += 1;
                                }
                                
                                //                                                                          This indexOf does not need to be checked for -1
                                //                                                                          Because we know for a fact that the match is in
                                //                                                                          the string we are searching
                                newCursorPos = Math.min(currentFieldRange.start + arrMatch[0].length, strDateFormat.indexOf(arrMatch[0]) + arrMatch[0].length);
                                newCursorPos = Math.max(newCursorPos, currentFieldRange.end);
                                //console.log(arrMatch[0].length, strDateFormat.indexOf(arrMatch[0]), newCursorPos, arrMatch[0]);
                                GS.setInputSelection(element.control, newCursorPos, newCursorPos);
                            }
                            
                        }
                        
                        //// All visible keys
                        //} else if ( event.keyCode >= 48 && event.keyCode <= 90 ||
                        //            event.keyCode >= 96 && event.keyCode <= 109 ||
                        //            event.keyCode >= 186 && event.keyCode <= 222 ||
                        //            event.keyCode === 32) {
                        //    //console.log('test');
                        //    
                        //    //GS.triggerEvent(element, 'change');
                        //    
                        //    if ((currentSelectionRange.end - currentSelectionRange.start) > 0) {
                        //        element.control.addEventListener('keyup', function ______self() {
                        //            GS.setInputSelection(this, currentSelectionRange.start + 1, currentSelectionRange.start) + 1;
                        //            this.removeEventListener('keyup', ______self);
                        //        });
                        //    }
                        //}
                        
                        //console.log(event.keyCode);
                        
                        syncView(element);
                    }
                }
            },
            keyup: function () {
                var element = this;
                if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
                    syncView(element);
                }
            },
            click: function () {
                var element = this, currentSelectionRange = GS.getInputSelection(element.control),
                    daysOfTheWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                    monthsOfTheYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                    arrMatch, strDateFormat, formatDivider, currentValue, currentDate;
                //console.log(currentSelectionRange.start, currentSelectionRange.end);
                
                ////// Copied from above until otherwise noted
                
                // Fix date format
                strDateFormat = element.getAttribute('format');
                //console.log(strDateFormat);
                if (!strDateFormat) {
                    strDateFormat = 'MM/dd/yyyy';
                } else if (strDateFormat.toLowerCase() === 'shortdate') {
                    strDateFormat = 'M/d/yy';
                } else if (strDateFormat.toLowerCase() === 'mediumdate') {
                    strDateFormat = 'MMM d, yyyy';
                } else if (strDateFormat.toLowerCase() === 'longdate') {
                    strDateFormat = 'MMMM d, yyyy';
                } else if (strDateFormat.toLowerCase() === 'fulldate') {
                    strDateFormat = 'EEEE, MMMM d, yyyy';
                } else if (strDateFormat.toLowerCase() === 'shorttime') {
                    strDateFormat = 'h:mm a';
                } else if (strDateFormat.toLowerCase() === 'mediumtime') {
                    strDateFormat = 'h:mm:ss a';
                } else if (strDateFormat.toLowerCase() === 'isodate') {
                    strDateFormat = 'yyyy-MM-dd';
                } else if (strDateFormat.toLowerCase() === 'isotime') {
                    strDateFormat = 'HH:mm:ss';
                } else if (strDateFormat.toLowerCase() === 'isodatetime') {
                    strDateFormat = 'yyyy-MM-dd\'T\'HH:mm:ss';
                }
                
                formatDivider = strDateFormat.match(/[^mdyehmsa]/gi).join('');
                
                currentValue = element.control.value;
                currentDate = new Date(currentValue.replace('\'T\'', ' ').replace(/-/g, '/'));
                
                if (strDateFormat.indexOf('M') === -1) {
                    currentDate = new Date('2015/6/15 ' + currentValue);
                }
                
                arrMatch = strDateFormat.match(/(M|E)+/g);
                if (arrMatch && arrMatch[0].length > 3) {
                    strDateFormat = strDateFormat.replace(/E+/g, new Array(daysOfTheWeek[currentDate.getDay()].length + 1).join('E'));
                    strDateFormat = strDateFormat.replace(/M+/g, new Array(monthsOfTheYear[currentDate.getDay()].length + 1).join('M'));
                }
                
                while (currentSelectionRange.start >= 0 && formatDivider.indexOf(currentValue[currentSelectionRange.start - 1]) < 0) {
                    currentSelectionRange.start -= 1;
                }
                currentSelectionRange.end = currentSelectionRange.start;
                while ( currentSelectionRange.end < currentValue.length &&
                        formatDivider.indexOf(currentValue[currentSelectionRange.end]) < 0) {
                    currentSelectionRange.end += 1;
                }
                //console.log(currentSelectionRange.start, currentSelectionRange.end);
                
                ////// Not copied
                element.ignoreSelect = true;
                GS.setInputSelection(element.control, currentSelectionRange.start, currentSelectionRange.end);
                
                //console.log('CLICK EVENT FIRED');
            },
            focus: function () {
                GS.triggerEvent(this, 'click');
            },
            select: function () {
                //if (!this.ignoreSelect) {
                //    GS.triggerEvent(this, 'click');
                //    this.ignoreSelect = false;
                //}
                //console.log('SELECT EVENT FIRED', GS.getInputSelection(this.control));
                
                // Copied from click handler until otherwise noted
                var element = this, currentSelectionRange = GS.getInputSelection(element.control),
                    daysOfTheWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                    monthsOfTheYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                    arrMatch, strDateFormat, formatDivider, currentValue, currentDate;
                //console.log(currentSelectionRange.start, currentSelectionRange.end);
                
                ////// Copied from above until otherwise noted
                
                // Fix date format
                strDateFormat = element.getAttribute('format');
                //console.log(strDateFormat);
                if (!strDateFormat) {
                    strDateFormat = 'MM/dd/yyyy';
                } else if (strDateFormat.toLowerCase() === 'shortdate') {
                    strDateFormat = 'M/d/yy';
                } else if (strDateFormat.toLowerCase() === 'mediumdate') {
                    strDateFormat = 'MMM d, yyyy';
                } else if (strDateFormat.toLowerCase() === 'longdate') {
                    strDateFormat = 'MMMM d, yyyy';
                } else if (strDateFormat.toLowerCase() === 'fulldate') {
                    strDateFormat = 'EEEE, MMMM d, yyyy';
                } else if (strDateFormat.toLowerCase() === 'shorttime') {
                    strDateFormat = 'h:mm a';
                } else if (strDateFormat.toLowerCase() === 'mediumtime') {
                    strDateFormat = 'h:mm:ss a';
                } else if (strDateFormat.toLowerCase() === 'isodate') {
                    strDateFormat = 'yyyy-MM-dd';
                } else if (strDateFormat.toLowerCase() === 'isotime') {
                    strDateFormat = 'HH:mm:ss';
                } else if (strDateFormat.toLowerCase() === 'isodatetime') {
                    strDateFormat = 'yyyy-MM-dd\'T\'HH:mm:ss';
                }
                
                formatDivider = strDateFormat.match(/[^mdyehmsa]/gi).join('');
                
                currentValue = element.control.value;
                currentDate = new Date(currentValue.replace('\'T\'', ' ').replace(/-/g, '/'));
                
                if (strDateFormat.indexOf('M') === -1) {
                    currentDate = new Date('2015/6/15 ' + currentValue);
                }
                
                arrMatch = strDateFormat.match(/(M|E)+/g);
                if (arrMatch && arrMatch[0].length > 3) {
                    strDateFormat = strDateFormat.replace(/E+/g, new Array(daysOfTheWeek[currentDate.getDay()].length + 1).join('E'));
                    strDateFormat = strDateFormat.replace(/M+/g, new Array(monthsOfTheYear[currentDate.getDay()].length + 1).join('M'));
                }
                
                // Condition copied only
                if ((currentSelectionRange.start >= 0 && formatDivider.indexOf(currentValue[currentSelectionRange.start - 1]) < 0) ||
                    (currentSelectionRange.end < currentValue.length && formatDivider.indexOf(currentValue[currentSelectionRange.end]) < 0)) {
                    GS.triggerEvent(this, 'click');
                    this.ignoreSelect = false;
                }
            }*/
        },
        accessors: {
            value: {
                // get value straight from the input
                get: function () {
                    if (this.control) {
                        if (this.control.value.trim() === '') {
                            return 'NULL';
                        } else {
                            return this.control.value;
                        }
                    } else if (this.hasAttribute('disabled')) {
                        return this.innerHTML;
                    }
                    
                    return undefined;
                },
                
                // set the value of the input and set the value attribute
                set: function (newValue) {
                    var tempSelection = this.control ? GS.getInputSelection(this.control) : null;
                    
                    if (this.control) {
                        if (newValue && typeof newValue === 'object') {
                            this.control.value = newValue.toLocaleDateString();
                        } else {
                            this.control.value = newValue || '';
                        }
                        
                        if (document.activeElement === this.control) {
                           GS.setInputSelection(this.control, tempSelection.start, tempSelection.end);
                        }
                        
                    } else if (this.hasAttribute('disabled')) {                        
                        if (newValue && typeof newValue === 'object') {
                            this.innerHTML = formatDate(newValue, getFormatString(this));
                        } else {
                            this.innerHTML = newValue || '';
                        }
                        
                    } else {
                        this.setAttribute('value', newValue);
                    }
                    
                    if (this.control) {
                        handleFormat(this);
                    }
                    syncView(this);
                }
            }
        },
        methods: {
            refresh: function () {
                var element = this, arrPassThroughAttributes, i, len;
                
                // set a variable for the control element for convenience and speed
                element.control = xtag.query(element, '.control')[0];
                
                // set a variable for the date picker button element for convenience and speed
                element.datePickerButton = xtag.query(element, '.date-picker-button')[0];
                
                //console.log(element.control, element.getAttribute('value'), element.getAttribute('column'));
                
                if (element.control) {
                    element.control.removeEventListener('change', changeFunction);
                    element.control.addEventListener('change', changeFunction);
                    
                    element.control.removeEventListener('focus', focusFunction);
                    element.control.addEventListener('focus', focusFunction);
                }
                if (element.datePickerButton) {
                    element.datePickerButton.addEventListener('click', buttonClickFunction);
                }
                
                // if there is a value already in the attributes of the element: set the control value
                if (element.control && element.hasAttribute('value')) {
                    element.control.value = element.getAttribute('value');
                    handleFormat(element, undefined, false);
                }
                
                if (element.control) {
                // copy passthrough attributes to control
                    arrPassThroughAttributes = [
                        'placeholder',
                        'name',
                        'maxlength',
                        'autocorrect',
                        'autocapitalize',
                        'autocomplete',
                        'autofocus',
                        'spellcheck',
                        'readonly'
                    ];
                    for (i = 0, len = arrPassThroughAttributes.length; i < len; i += 1) {
                        if (element.hasAttribute(arrPassThroughAttributes[i])) {
                            element.control.setAttribute(arrPassThroughAttributes[i], element.getAttribute(arrPassThroughAttributes[i]) || '');
                        }
                    }
                }
            },
            
            focus: function () {
                GS.triggerEvent(this, 'focus');
                this.control.focus();
            }
        }
    });
});