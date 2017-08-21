/*jslint white:true browser:true this:true*/
/*global window,GS,document,xtag,designRegisterElement,registerDesignSnippet,addProp,encodeHTML,setOrRemoveTextAttribute,setOrRemoveBooleanAttribute,addFlexProps*/

window.addEventListener('design-register-element', function () {
    'use strict';
    
    registerDesignSnippet('<gs-timestamp>', '<gs-timestamp>', 'gs-timestamp date-format="${0:isodate}" time-format=${1}></gs-timestamp>');
    
    designRegisterElement('gs-timestamp', '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-timestamp.html');
    
    window.designElementProperty_GSTIMESTAMP = function (selectedElement) {    
        addProp('Column', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('column') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'column', this.value);
        });
        
        addProp('Value', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('value') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'value', this.value);
        });
        
        addProp('Column In Querystring', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('qs') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'qs', this.value, false);
        });
        
        addProp('Date Placeholder', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('date-placeholder') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'date-placeholder', this.value);
        });
        
        addProp('Time Placeholder', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('time-placeholder') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'time-placeholder', this.value);
        });
        
        addProp('Mini', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('mini')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'mini', (this.value === 'true'), true);
        });
        
        addProp('Date Picker', true, '<gs-checkbox class="target" value="' + (!selectedElement.hasAttribute('no-date-picker')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'no-date-picker', (this.value === 'true'), false);
        });
        
        addProp('Date Format', true, '<gs-combo class="target" value="' + encodeHTML(selectedElement.getAttribute('date-format') || '') + '" mini>' + 
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
            return setOrRemoveTextAttribute(selectedElement, 'date-format', this.value);
        });

        addProp('Time Picker', true, '<gs-checkbox class="target" value="' + (!selectedElement.hasAttribute('no-time-picker')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'no-time-picker', (this.value === 'true'), false);
        });

        addProp('Time Display Format', true, '<gs-select class="target" value="' + encodeHTML(selectedElement.getAttribute('time-format') || '') + '" mini>' +
                                    '<option value="">Regular (1:30 PM)</option>' +
                                    '<option value="military">Military (13:30)</option>' +
                                '</gs-select>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'time-format', this.value);
        });

        addProp('Time Non-Empty', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('time-non-empty')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'time-non-empty', (this.value === 'true'), true);
        });

        addProp('Time Now Button', true, '<gs-checkbox class="target" value="' + (!selectedElement.hasAttribute('time-no-now-button')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'time-no-now-button', (this.value === 'true'), false);
        });
        
        // TITLE attribute
        addProp('Title', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('title') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'title', this.value);
        });
        
        addProp('Date Tabindex', true, '<gs-number class="target" value="' + encodeHTML(selectedElement.getAttribute('date-tabindex') || '') + '" mini></gs-number>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'date-tabindex', this.value);
        });
        
        addProp('Time Tabindex', true, '<gs-number class="target" value="' + encodeHTML(selectedElement.getAttribute('time-tabindex') || '') + '" mini></gs-number>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'time-tabindex', this.value);
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

        // READONLY attribute
        addProp('Readonly', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('readonly') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'readonly', this.value === 'true', true);
        });
        
        //addFlexContainerProps(selectedElement);
        addFlexProps(selectedElement);
        
        // SUSPEND-INSERTED attribute
        addProp('suspend-inserted', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-inserted') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suspend-inserted', this.value === 'true', true);
        });
    };
});

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    
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

        if (strQSCol && strQSCol.indexOf('=') !== -1) {
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
        } else if (strQSCol && GS.qryGetKeys(strQS).indexOf(strQSCol) > -1) {
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

    // for a given element, copy the control values with the value attribute
    function syncView(element) {
        var strDateValue = element.dateControl.value + ' ' + (element.timeControl.value === 'NULL' ? '00:00' : element.timeControl.value);
        var dateValue = new Date(strDateValue);
        var newValue = dateValue.getFullYear() + '-' + (dateValue.getMonth() + 1) + '-' + dateValue.getDate() + ' ' + dateValue.getHours() + ':' + dateValue.getMinutes();
        
        //console.log(element.dateControl.value);
        //console.log(element.timeControl.value === 'NULL' ? '00:00' : element.timeControl.value);
        //console.log(strDateValue);
        //console.log(dateValue);
        //console.log(newValue);
        
        element.setAttribute('value', newValue);
    }
    
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
    
    function elementInserted(element) {
        var dateValue = '';
        var timeValue = '';
        
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                element.internal = {};
                saveDefaultAttributes(element);
                
                if (element.hasAttribute('value')) {
                    var arrValue = element.getAttribute('value').split(' ');
                    dateValue = new Date(arrValue[0] + ' 00:00:00');    // adding an empty time causes the date to not be iso format
                                                                        // this makes the browser choose the local timezone instead of GMT
                    timeValue = arrValue[1];
                }
                
                element.dateControl = document.createElement('gs-date');
                element.timeControl = document.createElement('gs-time');
                
                var arrPassthrough = ['mini', 'autocorrect', 'autocapitalize', 'autocomplete', 'spellcheck', 'disabled', 'readonly'];
                var arrDatePassthrough = ['date-placeholder', 'no-date-picker', 'date-format', 'date-tabindex'];
                var arrTimePassthrough = ['time-placeholder', 'no-time-picker', 'time-format', 'time-non-empty', 'time-no-now-button', 'time-tabindex'];
                var i;
                var len;
                
                for (i = 0, len = arrPassthrough.length; i < len; i += 1) {
                    if (element.hasAttribute(arrPassthrough[i])) {
                        element.dateControl.setAttribute(arrPassthrough[i], '');
                        element.timeControl.setAttribute(arrPassthrough[i], '');
                    }
                }
                for (i = 0, len = arrDatePassthrough.length; i < len; i += 1) {
                    if (element.hasAttribute(arrDatePassthrough[i])) {
                        element.dateControl.setAttribute(arrDatePassthrough[i].replace(/date\-/g, ''), element.getAttribute(arrDatePassthrough[i]) || '');
                    }
                }
                for (i = 0, len = arrTimePassthrough.length; i < len; i += 1) {
                    if (element.hasAttribute(arrTimePassthrough[i])) {
                        element.timeControl.setAttribute(arrTimePassthrough[i].replace(/time\-/g, ''), element.getAttribute(arrTimePassthrough[i]) || '');
                    }
                }
                
                element.dateControl.value = dateValue;
                element.timeControl.value = timeValue;
                
                element.dateControl.setAttribute('flex', '');
                element.timeControl.setAttribute('flex', '');
                
                element.dateControl.setAttribute('gs-dynamic', '');
                element.timeControl.setAttribute('gs-dynamic', '');
                
                element.dateControl.addEventListener('focus', focusFunction);
                element.timeControl.addEventListener('focus', focusFunction);

                element.dateControl.addEventListener('blur', blurFunction);
                element.timeControl.addEventListener('blur', blurFunction);

                element.dateControl.addEventListener(evt.mouseout, mouseoutFunction);
                element.timeControl.addEventListener(evt.mouseout, mouseoutFunction);
                
                element.dateControl.addEventListener(evt.mouseover, mouseoverFunction);
                element.timeControl.addEventListener(evt.mouseover, mouseoverFunction);
                
                element.dateControl.addEventListener('change', function (event) {
                    syncView(element);
                    event.stopPropagation();
                    GS.triggerEvent(element, 'change');
                });
                element.timeControl.addEventListener('change', function (event) {
                    syncView(element);
                    event.stopPropagation();
                    GS.triggerEvent(element, 'change');
                });
                
                //console.log(element.dateControl);
                //console.log(element.timeControl);
                
                element.appendChild(element.dateControl);
                element.appendChild(element.timeControl);
                
                //console.log(element.children);
                
                pushReplacePopHandler(element);
                window.addEventListener('pushstate',    function () { pushReplacePopHandler(element); });
                window.addEventListener('replacestate', function () { pushReplacePopHandler(element); });
                window.addEventListener('popstate',     function () { pushReplacePopHandler(element); });
            }
        }
    }
    
    xtag.register('gs-timestamp', {
        lifecycle: {
            created: function () {
                elementCreated(this);
            },
            
            inserted: function () {
                elementInserted(this);
            },
            
            attributeChanged: function (strAttrName, oldValue, newValue) {
                var dateValue = '';
                var timeValue = '';
                // if "suspend-created" has been removed: run created and inserted code
                if (strAttrName === 'suspend-created' && newValue === null) {
                    elementCreated(this);
                    elementInserted(this);
                    
                // if "suspend-inserted" has been removed: run inserted code
                } else if (strAttrName === 'suspend-inserted' && newValue === null) {
                    elementInserted(this);
                    
                } else if (!this.hasAttribute('suspend-created') && !this.hasAttribute('suspend-inserted')) {
                    if (strAttrName === 'value') {
                        if (newValue !== null) {
                            var arrValue = newValue.split(' ');
                            dateValue = new Date(arrValue[0]);
                            timeValue = arrValue[1];
                            
                            this.dateControl.value = dateValue;
                            this.timeControl.value = timeValue;
                        } else {
                            this.dateControl.value = null;
                            this.timeControl.value = null;
                        }
                    }
                }
            }
        },
        events: {},
        accessors: {
            value: {
                get: function () {
                    return this.getAttribute('value');
                },
                
                set: function (newValue) {
                    this.setAttribute('value', newValue);
                }
            }
        },
        methods: {
        }
    });
});