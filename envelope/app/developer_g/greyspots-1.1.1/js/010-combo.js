
window.addEventListener('design-register-element', function () {
    'use strict';
    
    registerDesignSnippet('<gs-combo>', '<gs-combo>', 'gs-combo src="${1:test.tpeople}" column="${2}"></gs-combo>');
    
    designRegisterElement('gs-combo', (location.pathname.indexOf('/v1/') === 0 ? '/v1/dev/' : '/env/app/') + 'developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-combo.html');
    
    window.designElementProperty_GSCOMBO = function (selectedElement) {
        addProp('Source', true,
                '<gs-memo class="target" value="' + encodeHTML(decodeURIComponent(selectedElement.getAttribute('src') ||
                                                                        selectedElement.getAttribute('source') || '')) + '" mini></gs-memo>',
                function () {
            return setOrRemoveTextAttribute(selectedElement, 'src', encodeURIComponent(this.value));
        });
        
        addProp('Columns', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('cols') || '') + '" mini></gs-text>',
                function () {
            return setOrRemoveTextAttribute(selectedElement, 'cols', this.value);
        });
        
        addProp('Initialize Source', true,
                '<gs-memo class="target" value="' + encodeHTML(decodeURIComponent(selectedElement.getAttribute('initialize') || '')) + '" mini></gs-memo>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'initialize', encodeURIComponent(this.value));
        });
        
        addProp('Hide Columns', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('hide') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'hide', this.value);
        });
        
        addProp('Where', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('where') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'where', this.value);
        });
        
        addProp('Order By', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('ord') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'ord', this.value);
        });
        
        addProp('Limit', true, '<gs-number class="target" value="' + encodeHTML(selectedElement.getAttribute('limit') || '') + '" mini></gs-number>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'limit', this.value);
        });
        
        addProp('Offset', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('offset') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'offset', this.value);
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
        
        addProp('Allow Empty', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('allow-empty')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'allow-empty', (this.value === 'true'), true);
        });
        
        addProp('Limit&nbsp;To&nbsp;List', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('limit-to-list')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'limit-to-list', (this.value === 'true'), true);
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
        
        // DISABLED attribute
        addProp('Disabled', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('disabled') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'disabled', this.value === 'true', true);
        });
        
        addProp('Refresh On Querystring Columns', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('refresh-on-querystring-values') || '') + '" mini></gs-text>', function () {
            this.removeAttribute('refresh-on-querystring-change');
            return setOrRemoveTextAttribute(selectedElement, 'refresh-on-querystring-values', this.value);
        });
        
        addProp('Refresh On Querystring Change', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('refresh-on-querystring-change')) + '" mini></gs-checkbox>', function () {
            this.removeAttribute('refresh-on-querystring-values');
            return setOrRemoveBooleanAttribute(selectedElement, 'refresh-on-querystring-change', this.value === 'true', true);
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
    // scroll the dropdown to the selected record
    function scrollToSelectedRecord(element) {
        var positioningContainer, scrollingContainer, arrTrs, i, len, intScrollTop, bolFoundSelected = false;
        
        if (element.currentDropDownContainer) {
            positioningContainer = xtag.queryChildren(element.currentDropDownContainer, '.gs-combo-positioning-container')[0];
            scrollingContainer = xtag.queryChildren(positioningContainer, '.gs-combo-scroll-container')[0];
            arrTrs = xtag.query(element.dropDownTable, 'tr');
            
            for (i = 0, intScrollTop = 0, len = arrTrs.length; i < len; i += 1) {
                if (arrTrs[i].hasAttribute('selected')) {
                    intScrollTop += arrTrs[i].offsetHeight / 2;
                    
                    bolFoundSelected = true;
                    
                    break;
                } else {
                    intScrollTop += arrTrs[i].offsetHeight;
                }
            }
            
            if (bolFoundSelected) {
                intScrollTop = intScrollTop - scrollingContainer.offsetHeight / 2;
            } else {
                intScrollTop = 0;
            }
            
            scrollingContainer.scrollTop = intScrollTop;
        }
    }
    
    // removes selected class from old selected records
    function clearSelection(element) {
        var i, len, arrSelectedTrs;
        
        // clear previous selection
        arrSelectedTrs = xtag.queryChildren(xtag.queryChildren(element.dropDownTable, 'tbody')[0], 'tr[selected]');
        
        for (i = 0, len = arrSelectedTrs.length; i < len; i += 1) {
            arrSelectedTrs[i].removeAttribute('selected');
        }
    }
    
    // clears old selection and adds selected class to record
    function highlightRecord(element, record) {
        // clear previous selection
        clearSelection(element);
        
        // select/highlight the record that was provided
        record.setAttribute('selected', '');
    }
    
    // loops through the records and finds a record using the parameter (if bolPartialMatchAllowed === true then only search the first td text)
    function findRecordFromString(element, strSearchString, bolPartialMatchAllowed) {
        var i, len, matchedRecord, arrTrs = xtag.queryChildren(xtag.queryChildren(element.dropDownTable, 'tbody')[0], 'tr');
        
        // if bolPartialMatchAllowed is true: only search the first td text (case insensitive)
        if (bolPartialMatchAllowed === true) {
            strSearchString = strSearchString.toLowerCase();
            
            for (i = 0, len = arrTrs.length; i < len; i += 1) {
                if (xtag.queryChildren(arrTrs[i], 'td')[0].textContent.toLowerCase().indexOf(strSearchString) === 0) {
                    matchedRecord = arrTrs[i];
                    
                    break;
                }
            }
            
        // else: search exact text and search both the value attribute (if present) and the first td text
        } else {
            for (i = 0, len = arrTrs.length; i < len; i += 1) {
                if (arrTrs[i].getAttribute('value') === strSearchString ||
                    xtag.queryChildren(arrTrs[i], 'td')[0].textContent === strSearchString) {
                    matchedRecord = arrTrs[i];
                    
                    break;
                }
            }
        }
        
        return matchedRecord;
    }
    
    // highlights record, sets value of the combobox using record
    function selectRecord(element, record, bolChange) {
        // add the yellow selection to the record
        highlightRecord(element, record);
        
        handleChange(element, bolChange);
    }
    
    // highlights record, sets value of the combobox using value attribute
    //      if bolChange === true then:
    //          change event and check for limit to list
    function selectRecordFromValue(element, strValue, bolChange) {
        var record = findRecordFromString(element, strValue, false);
        
        // if a record was found: select it
        if (record) {
            selectRecord(element, record, bolChange);
            
        // else if limit to list (and no record was found):
        } else if (element.hasAttribute('limit-to-list') && bolChange) {
            if (strValue === '' && element.hasAttribute('allow-empty')) {
                handleChange(element, bolChange);
                
            } else {
                alert('The text you entered is not in the list');
                openDropDown(element);
                GS.setInputSelection(element.control, 0, strValue.length);
            }
            
        // else (not limit to list and no record found):
        } else {
            clearSelection(element);
            
            if (!element.hasAttribute('limit-to-list')) {
                element.control.value = strValue;
                element.innerValue = strValue;
            }
            
            handleChange(element, bolChange);
        }
    }
    
    function handleChange(element, bolChange) {
        var arrSelectedTrs, strHiddenValue = '', strTextValue = '', beforechangeevent, oldRecord,
            oldInnerValue = element.innerValue, oldControlValue = element.control.value;
        
        if (element.dropDownTable) {
            arrSelectedTrs = xtag.queryChildren(xtag.queryChildren(element.dropDownTable, 'tbody')[0], 'tr[selected]');
            
            // if there is a selected record
            if (arrSelectedTrs.length > 0) {
                // gather values from the selected record
                strHiddenValue = arrSelectedTrs[0].getAttribute('value');
                var firstTd = xtag.queryChildren(arrSelectedTrs[0], 'td')[0],
                    lastChild = firstTd.lastElementChild;
                if (lastChild && lastChild.tagName.substring(0, 3) === 'GS-') {
                    strTextValue = lastChild.textValue || lastChild.value || lastChild.textContent;
                } else {
                    strTextValue = firstTd.textContent;
                }
                
            } else {
                strTextValue = element.control.value;
            }
            
        } else {
            strTextValue = element.control.value;
        }
        
        // set innervalue and control value using the values we gather from the record
        element.innerValue = strHiddenValue || strTextValue;
        element.control.value = strTextValue || strHiddenValue;
        
        if (bolChange) {
            if (document.createEvent) {
                beforechangeevent = document.createEvent('HTMLEvents');
                beforechangeevent.initEvent('beforechange', true, true);
            } else {
                beforechangeevent = document.createEventObject();
                beforechangeevent.eventType = 'beforechange';
            }
            
            beforechangeevent.eventName = 'beforechange';
            
            if (document.createEvent) {
                element.dispatchEvent(beforechangeevent);
            } else {
                element.fireEvent("on" + beforechangeevent.eventType, beforechangeevent);
            }
            
            // xtag.fireEvent(element, 'beforechange', { bubbles: true, cancelable: true });
            
            //console.log(beforechangeevent.defaultPrevented);
            if (beforechangeevent.defaultPrevented !== true) {
                xtag.fireEvent(element, 'change', { bubbles: true, cancelable: true });
                
            } else {
                element.innerValue = oldInnerValue;
                element.control.value = oldControlValue;
                
                oldRecord = findRecordFromString(element, oldInnerValue, false);
                
                if (oldRecord) {
                    highlightRecord(element, oldRecord);
                } else {
                    clearSelection(element);
                }
            }
            
            element.ignoreChange = false;
        }
    }
    
    // open dropdown
    function openDropDown(element) {
        // if we are not already dropping down
        if (!element.droppingDown) {
            // if there is a source attribute on the combobox: refresh data
            if (element.getAttribute('src') || element.getAttribute('source')) {
                getData(element, false, true, function () {
                    dropDown(element);
                });
            } else {
                dropDown(element);
            }
            element.droppingDown = true;
        }
    }
    
    function dropDown(element) {
        var dropDownContainer = document.createElement('div'), overlay, positioningContainer, scrollContainer, observer;
        
        // focus control
        element.control.focus();
        
        // create the dropdown element (and its children)
        dropDownContainer.classList.add('gs-combo-dropdown-container');
        dropDownContainer.setAttribute('gs-dynamic', '');
        dropDownContainer.innerHTML =   '<div class="gs-combo-positioning-container" gs-dynamic>' +
                                        '    <div class="gs-combo-scroll-container" gs-dynamic></div>' +
                                        '</div>';
        
        // append dropdown to the body
        document.body.appendChild(dropDownContainer);
        
        // set variables for the various elements that we will need for calculation
        positioningContainer = xtag.queryChildren(dropDownContainer, '.gs-combo-positioning-container')[0];
        scrollContainer =      xtag.queryChildren(positioningContainer, '.gs-combo-scroll-container')[0];
        
        element.currentDropDownContainer = dropDownContainer;
        
        //console.log(element.dropDownTable);
        
        // fill dropdown with content
        if (element.dropDownTable) {
            //element.dropDownTable = GS.cloneElement(element.staticDropDownTable);
            scrollContainer.appendChild(element.dropDownTable);
            
        //} else if (element.tableTemplate) {
        //    scrollContainer.innerHTML = element.tableTemplate;
        //    
        } else {
            scrollContainer.innerHTML = element.initalHTML;
        }
        
        // create an observer instance
        observer = new MutationObserver(function(mutations) {
            dropDownSize(element);
        });
        
        // pass in the element node, as well as the observer options
        observer.observe(scrollContainer, {childList: true, subtree: true});
        
        //console.log(scrollContainer);
        
        dropDownSize(element);
    }
    
    function dropDownSize(element) {
        var dropDownContainer    = element.currentDropDownContainer,
            positioningContainer = xtag.queryChildren(dropDownContainer, '.gs-combo-positioning-container')[0],
            scrollContainer      = xtag.queryChildren(positioningContainer, '.gs-combo-scroll-container')[0],
            overlay, jsnComboOffset, intComboHeight, intComboWidth, intViewportWidth, intViewportHeight,
            intFromControlToBottomHeight, intFromControlToTopHeight, intContentHeight, intNewWidth,
            strWidth = '', strHeight = '', strLeft = '', strTop = '', strBottom = '';
        
        // set variables needed for position calculation
        intComboHeight               = element.offsetHeight;
        intComboWidth                = element.offsetWidth;
        intViewportHeight            = window.innerHeight;
        intViewportWidth             = window.innerWidth;
        jsnComboOffset               = GS.getElementOffset(element);
        intContentHeight             = scrollContainer.scrollHeight;
        intFromControlToBottomHeight = intViewportHeight - (jsnComboOffset.top + intComboHeight);
        intFromControlToTopHeight    = jsnComboOffset.top;
        
        
        //console.log(intFromControlToBottomHeight, intFromControlToTopHeight);
        
        
        // set position, height and (top or bottom) variables
        // if desktop:
        if (!evt.touchDevice) {
            // if viewport is too small go full page
            if (window.innerHeight < 500 &&
                intContentHeight > intFromControlToTopHeight &&
                intContentHeight > intFromControlToBottomHeight) {
                strHeight = window.innerHeight + 'px';
                strTop =  '0px';
                
            // try 200px
            } else if (intContentHeight < 500) {
                strHeight = '200px';
                
                if (intFromControlToBottomHeight > intFromControlToTopHeight || intFromControlToBottomHeight > 200) {
                    strTop = (intFromControlToTopHeight + intComboHeight) + 'px';
                } else {
                    strBottom = (intFromControlToBottomHeight + intComboHeight) + 'px';
                }
                
            // try height from control to bottom of viewport
            } else if (intFromControlToBottomHeight >= intFromControlToTopHeight) {
                strHeight = intFromControlToBottomHeight + 'px';
                strTop = (intFromControlToTopHeight + intComboHeight) + 'px';
                
            // else height from control to top of viewport
            } else {// if (intFromControlToTopHeight >= intFromControlToBottomHeight) {
                strHeight = intFromControlToTopHeight + 'px';
                strBottom = (intFromControlToBottomHeight + intComboHeight) + 'px';
            }
            
        // else mobile:
        } else {
            // try 200px bottom
            if (intFromControlToBottomHeight > 200 && intContentHeight < 500) {
                strHeight = intFromControlToBottomHeight + 'px';
                strTop = (intFromControlToTopHeight + intComboHeight) + 'px';
                
            // try 200px top
            } else if (intFromControlToTopHeight > 200 && intContentHeight < 500) {
                strHeight = intFromControlToTopHeight + 'px';
                strBottom = (intFromControlToBottomHeight + intComboHeight) + 'px';
            
            // else full page
            } else {
                strHeight = window.innerHeight + 'px';
                strTop =  '0px';
            }
        }
        
        
        // set width and left variables
        // try regular
        if (scrollContainer.scrollWidth <= scrollContainer.offsetWidth) {
            if (intComboWidth < 150) {
                intNewWidth = (window.innerWidth - jsnComboOffset.left) - 20;
                
                if (intNewWidth < 300) {
                    strWidth = intNewWidth + 'px';
                } else {
                    strWidth = '300px';
                }
                
            } else {
                strWidth = intComboWidth + 'px';
            }
            strLeft = jsnComboOffset.left + 'px';
            
        // else full width
        } else {
            strWidth = '100%';
            strLeft = '0px';
        }
        
        
        // set position and size using variables
        positioningContainer.style.left   = strLeft;
        positioningContainer.style.top    = strTop;
        positioningContainer.style.bottom = strBottom;
        positioningContainer.style.width  = strWidth;
        positioningContainer.style.height = strHeight;
        
        if (strTop) {
            dropDownContainer.classList.add('below');
        } else {
            dropDownContainer.classList.add('above');
        }
        
        
        // if the table is wider than the drop down: reflow
        if (scrollContainer.clientWidth < scrollContainer.scrollWidth &&
            xtag.query(scrollContainer, 'tbody tr:first-child td, tbody tr:first-child th').length > 1) {
            scrollContainer.classList.add('reflow');
        }
        
        
        // if the table is shorter than the drop down: resize the dropdown to be as short as the table
        if (intContentHeight < scrollContainer.clientHeight) {
            positioningContainer.style.height = intContentHeight + 'px';
        }
        
        
        // make combobox float over overlay so that you can focus into the input box
        element.classList.add('open');
        
        //// if there is already a placeholder: delete the old one
        //if (element.placeholderElement) {
        //    element.parentNode.removeChild(element.placeholderElement);
        //    element.placeholderElement = undefined;
        //    
        //    element.style.left   = element.oldLeft;
        //    element.style.right  = element.oldRight;
        //    element.style.top    = element.oldTop;
        //    element.style.bottom = element.oldBottom;
        //    element.style.width  = element.oldWidth;
        //    element.style.height = element.oldHeight;
        //}
        //
        //// save old styles
        //element.oldLeft   = element.style.left;
        //element.oldRight  = element.style.right;
        //element.oldTop    = element.style.top;
        //element.oldBottom = element.style.bottom;
        //element.oldWidth  = element.style.width;
        //element.oldHeight = element.style.height;
        //
        //element.style.left = '';
        //element.style.right = '';
        //element.style.top = '';
        //element.style.bottom = '';
        //element.style.width = '';
        //element.style.height = '';
        //
        //element.style.left   = jsnComboOffset.left + 'px';
        //element.style.top    = jsnComboOffset.top + 'px';
        //element.style.width  = intComboWidth + 'px';
        //element.style.height = intComboHeight + 'px';
        //
        //// put a placeholder element so that elements dont jump under where the combobox was
        //element.placeholderElement = document.createElement('div');
        //
        //element.placeholderElement.setAttribute('gs-dynamic', '');
        //element.placeholderElement.style.left   = element.oldLeft;
        //element.placeholderElement.style.right  = element.oldRight;
        //element.placeholderElement.style.top    = element.oldTop;
        //element.placeholderElement.style.bottom = element.oldBottom;
        //element.placeholderElement.style.width  = element.oldWidth;      // this will set the width of the placholder if
        //                                                                 //     the combobox had a set width
        //element.placeholderElement.style.height = intComboHeight + 'px'; // set the height of the placeholder to the
        //                                                                 //     actual height of the combobox
        //
        //element.parentNode.insertBefore(element.placeholderElement, element);
        
        // change element open state variable
        element.open = true;
        
        
        // bind drop down
        bindDropDown(element);
        
        
        // scroll to the selected record (if any)
        scrollToSelectedRecord(element);
    }
    
    // bind dropdown events
    function bindDropDown(element) {
        var selectableTrs, closeDropDownHandler, selectRecordHandler, i, len,
            unbindSelectRecordHandler, unbindDropDownEvents, wheelHandler;
        
        wheelHandler = function (event) {
            var tableElement = GS.findParentElement(event.target, '.gs-combo-dropdown-container');
            
            if (tableElement !== element.currentDropDownContainer) {
                closeDropDownHandler();
            }
        };
        
        // unbind function
        unbindDropDownEvents = function () {
            var i, len;
            
            for (i = 0, len = selectableTrs.length; i < len; i += 1) {
                selectableTrs[i].removeEventListener('click', selectRecordHandler);
            }
            
            window.removeEventListener('resize', closeDropDownHandler);
            window.removeEventListener('orientationchange', closeDropDownHandler);
            window.removeEventListener('mousewheel', wheelHandler);
            window.removeEventListener('click', closeDropDownHandler);
        };
        
        // handle record click
        selectableTrs = xtag.queryChildren(xtag.queryChildren(element.dropDownTable, 'tbody')[0], 'tr');
        
        selectRecordHandler = function (event) {
            selectRecord(element, GS.findParentTag(event.target, 'tr'), true);
            closeDropDownHandler();
        };
        
        for (i = 0, len = selectableTrs.length; i < len; i += 1) {
            selectableTrs[i].addEventListener('click', selectRecordHandler);
        }
        
        // handle dropdown close
        closeDropDownHandler = function (event) {
            closeDropDown(element);
            unbindDropDownEvents();
        };
        
        window.addEventListener('resize', closeDropDownHandler);
        window.addEventListener('orientationchange', closeDropDownHandler);
        window.addEventListener('mousewheel', wheelHandler);
        window.addEventListener('click', closeDropDownHandler);
    }
    
    // remove dropdown from screen
    function closeDropDown(element) {
        // if there is a dropdown to remove: remove the dropdown
        if (element.currentDropDownContainer) {
            document.body.removeChild(element.currentDropDownContainer);
            element.currentDropDownContainer = undefined;
            
            element.classList.remove('open');
            element.open = false;
            element.droppingDown = false;
            
            //element.parentNode.removeChild(element.placeholderElement);
            //element.placeholderElement = undefined;
            //
            //element.style.left   = element.oldLeft;
            //element.style.right  = element.oldRight;
            //element.style.top    = element.oldTop;
            //element.style.bottom = element.oldBottom;
            //element.style.width  = element.oldWidth;
            //element.style.height = element.oldHeight;
        }
    }
    
    // handle behaviours on keydown
    function handleKeyDown(element, event) {
        var intKeyCode = event.keyCode || event.which, selectedTr, trs, i, len, selectedRecordIndex, firstTd, lastChild, strTextValue;
        
        if (!element.hasAttribute('disabled')) {
            if ((intKeyCode === 40 || intKeyCode === 38) && !event.shiftKey && !event.metaKey && !event.ctrlKey && !element.error) {
                if (!element.open) {
                    openDropDown(element);
                    
                } else {
                    trs = xtag.queryChildren(xtag.queryChildren(element.dropDownTable, 'tbody')[0], 'tr');
                    
                    for (i = 0, len = trs.length; i < len; i += 1) {
                        if (trs[i].hasAttribute('selected')) {
                            selectedRecordIndex = i;
                            selectedTr = trs[i];
                            trs[i].removeAttribute('selected');
                            
                            break;
                        }
                    }
                    
                    if (intKeyCode === 40) {// next record or circle to first record or start selection at the first
                        if (!selectedTr || selectedRecordIndex === trs.length - 1) {
                            highlightRecord(element, trs[0]);
                            selectedTr = trs[0];
                            
                        } else {
                            highlightRecord(element, trs[selectedRecordIndex + 1]);
                            selectedTr = trs[selectedRecordIndex + 1];
                        }
                        
                    } else if (intKeyCode === 38) {// prev record or circle to last record or start selection at the last
                        if (!selectedTr || selectedRecordIndex === 0) {
                            highlightRecord(element, trs[trs.length - 1]);
                            selectedTr = trs[trs.length - 1];
                            
                        } else {
                            highlightRecord(element, trs[selectedRecordIndex - 1]);
                            selectedTr = trs[selectedRecordIndex - 1];
                        }
                    }
                    scrollToSelectedRecord(element);
                }
                if (selectedTr) {
                    element.control.value = xtag.queryChildren(selectedTr, 'td')[0].textContent;
                }
                
                GS.setInputSelection(element.control, 0, element.control.value.length);
                
                event.preventDefault();
                event.stopPropagation();
                
            } else if ((intKeyCode === 39) && !event.shiftKey && !event.metaKey && !event.ctrlKey && !element.error) {
                selectedTr = xtag.queryChildren(xtag.queryChildren(element.dropDownTable, 'tbody')[0], 'tr[selected]')[0];
                
                if (selectedTr) {
                    firstTd = xtag.queryChildren(selectedTr, 'td')[0];
                    lastChild = firstTd.lastElementChild;
                    
                    if (lastChild && lastChild.tagName.substring(0, 3) === 'GS-') {
                        strTextValue = lastChild.textValue || lastChild.value || lastChild.textContent;
                    } else {
                        strTextValue = firstTd.textContent;
                    }
                    
                    //console.log(element.innerValue, element.control.value, selectedTr.getAttribute('value'), strTextValue);
                    
                    selectRecord(element, selectedTr,
                                element.innerValue !== (selectedTr.getAttribute('value') || strTextValue));
                }
                
                event.stopPropagation();
                
            } else if (event.keyCode === 13 || event.keyCode === 9) {
                if (element.dropDownTable && xtag.queryChildren(xtag.queryChildren(element.dropDownTable, 'tbody')[0], 'tr[selected]').length > 0) {
                    selectRecordFromValue(element, element.control.value, true);
                    element.ignoreChange = true;
                }
                
                closeDropDown(element);
                
            } else if (!event.metaKey &&       // not command key
                       !event.ctrlKey &&       // not control key
                       event.keyCode !== 37 && // not arrow keys
                       event.keyCode !== 38 &&
                       event.keyCode !== 39 &&
                       event.keyCode !== 40 &&
                       event.keyCode !== 46 && // not forward delete key
                       event.keyCode !== 8) {  // not delete key
                element.attemptSearchOnNextKeyup = true;
            }
        } else {
            if (event.keyCode !== 9) {
                event.preventDefault();
                event.stopPropagation();
            }
        }
    }
    
    // search on keyup
    //      the reason we are using keyup for search is because on keydown the letter has not been typed in yet and
    //      it would be harder if we tried to use the keycode to get the letter that was typed. so on keydown
    //      (which is where we can tell if CMD or CTRL and other keys that we dont want to search on and pressed)
    //      if we didn't type something that we dont want to search on but we typed somthing else: set this.attemptSearchOnNextKeyup
    //      to true and on keyup we read that and if it is set to true then we do a search and set it back to false
    function handleKeyUp(element, event) {
        var intKeyCode = event.keyCode || event.which, strSearch = element.control.value, matchRecord;
        
        // if element.attemptSearchOnNextKeyup is true and
        //      there is a search string and
        //      the user has their text selection at the end of the of the input
        if (element.attemptSearchOnNextKeyup === true &&
            strSearch &&
            GS.getInputSelection(element.control).start === strSearch.length) {
            
            matchRecord = findRecordFromString(element, strSearch, true);
            
            // if we found a record and its was already selected: selected the matched record and dont 
            if (matchRecord) {
                highlightRecord(element, matchRecord);
                element.control.value = xtag.queryChildren(matchRecord, 'td')[0].textContent;
                GS.setInputSelection(element.control, strSearch.length, element.control.value.length);
                
                //if (strSearch.length === element.control.value.length) {
                //    selectRecord(element, matchRecord, true);
                //}
                
                scrollToSelectedRecord(element);
                
            } else {
                clearSelection(element);
                //selectRecordFromValue(element, strSearch, false);
                //GS.setInputSelection(element.control, strSearch.length, element.control.value.length);
            }
        }
        
        if (element.attemptSearchOnNextKeyup === true) {
            element.attemptSearchOnNextKeyup = false;
        }
    }
    
    // handles fetching the data
    //      if bolInitalLoad === true then
    //          use: initialize query COALESCE TO source query
    //      else
    //          use: source query
    function getData(element, bolInitalLoad, bolClearPrevious, callback) {
        if (window.bolSocket === true) {
            var srcParts   = GS.templateWithQuerystring(
                                (bolInitalLoad && element.getAttribute('initialize')
                                    ? element.getAttribute('initialize')
                                    : element.getAttribute('src')
                                )
                            ).split('.')
              , strSchema  = srcParts[0]
              , strObject  = srcParts[1]
              , strColumns = GS.templateWithQuerystring(element.getAttribute('cols') || '*').split(',').join('\t')
              , strWhere   = GS.templateWithQuerystring(element.getAttribute('where') || '')
              , strOrd     = GS.templateWithQuerystring(element.getAttribute('ord') || '')
              , strLimit   = GS.templateWithQuerystring(element.getAttribute('limit') || '')
              , strOffset  = GS.templateWithQuerystring(element.getAttribute('offset') || '')
              , response_i = 0, response_len = 0, arrTotalRecords = [];
            
            //GS.addLoader(element, 'Loading...');
            GS.requestCachingSelect(GS.envSocket, strSchema, strObject, strColumns
                                     , strWhere, strOrd, strLimit, strOffset
                                     , function (data, error) {
                var arrRecords, arrCells, envData
                  , i, len, cell_i, cell_len;
                
                if (!error) {
                    if (data.strMessage !== 'TRANSACTION COMPLETED') {
                        arrRecords = GS.trim(data.strMessage, '\n').split('\n');
                        
                        for (i = 0, len = arrRecords.length; i < len; i += 1) {
                            arrCells = arrRecords[i].split('\t');
                            
                            for (cell_i = 0, cell_len = arrCells.length; cell_i < cell_len; cell_i += 1) {
                                arrCells[cell_i] = GS.decodeFromTabDelimited(arrCells[cell_i]);
                            }
                            
                            arrTotalRecords.push(arrCells);
                        }
                    } else {
                        //GS.removeLoader(element);
                        element.arrColumnNames = data.arrColumnNames;
                        
                        envData = {'arr_column': element.arrColumnNames, 'dat': arrTotalRecords};
                        
                        handleData(element, bolInitalLoad, envData);
                        GS.triggerEvent(element, 'after_select');
                        if (typeof callback === 'function') {
                            callback();
                        }
                    }
                } else {
                    handleData(element, bolInitalLoad, data, error);
                    //GS.removeLoader(element);
                }
            }, bolClearPrevious);
            
        } else {
            var data, strLink, dataFunction,
                strInitalize = GS.templateWithQuerystring(decodeURIComponent(element.getAttribute('initialize') || '')),
                strSource = GS.templateWithQuerystring(decodeURIComponent(element.getAttribute('src') || element.getAttribute('source') || '')),
                strCols = element.getAttribute('cols') || '';
            
            // if there is a initial query and this is the inital load: prepare the parameters for a fetch that would use the initial query
            if (strInitalize && bolInitalLoad) {
                strLink = (location.pathname.indexOf('/v1/') === 0 ? '/v1/' : '/') + (element.getAttribute('action-select') || 'env/action_select') + '?src=' + encodeURIComponent(strInitalize);
                
            // else: use the source query and prepare the parameters for a fetch that would use the source query
            } else {
                strLink = (location.pathname.indexOf('/v1/') === 0 ? '/v1/' : '/') + (element.getAttribute('action-select') || 'env/action_select') + '?src=' + encodeURIComponent(strSource);
            }
            
            //console.log(strLink);
            
            strLink += '&where='    + encodeURIComponent(GS.templateWithQuerystring(decodeURIComponent(element.getAttribute('where') || ''))) +
                       '&limit='    + encodeURIComponent(GS.templateWithQuerystring(decodeURIComponent(element.getAttribute('limit') || ''))) +
                       '&offset='   + encodeURIComponent(GS.templateWithQuerystring(decodeURIComponent(element.getAttribute('offset') || ''))) +
                       '&order_by=' + encodeURIComponent(GS.templateWithQuerystring(decodeURIComponent(element.getAttribute('ord') || ''))) +
                       '&cols='     + encodeURIComponent(strCols);
            
            if (GS.dataFetch(strLink, bolClearPrevious)) {
                data = GS.dataFetch(strLink, bolClearPrevious);
                
                handleData(element, bolInitalLoad, data.response, data.error); // (data.status === 'error' ? 'error' : null)
            } else {
                dataFunction = function (event) {
                    document.removeEventListener('dataready_' + encodeURIComponent(strLink), dataFunction);
                    handleData(element, bolInitalLoad, event.detail.response, event.detail.error);
                    if (typeof callback === 'function') {
                        callback();
                    }
                };
                
                document.addEventListener('dataready_' + encodeURIComponent(strLink), dataFunction);
            }
        }
    }
    
    // handles data result from method function: getData 
    //      success:  template
    //      error:    add error classes
    function handleData(element, bolInitalLoad, data, error) {
        var divElement, tableElement, theadElement, theadCellElements, tbodyElement, tbodyCellElements, lastRecordElement,
            currentCellLabelElement, template, i, len, arrHeaders = [], strTemplate, arrHide, strHeaderCells, strRecordCells,
            tableTemplateElement, recordElements, recordElement, jsnTemplate, strHTML;
        
        //GS.triggerEvent(this, 'after_select'); <== caused a MAJOR issue where code that was supposed to
        //                                              run after an envelope after_select caught all of
        //                                              the after selects of the comboboxes in the envelope
        
        // clear any old error status
        element.classList.remove('error');
        element.dropDownButton.setAttribute('title', '');
        element.dropDownButton.setAttribute('icon', 'angle-down');
        
        // if there was no error
        if (!error) {
            element.error = false;
            
            //console.log(this, this.tableTemplate);
            
            if (element.tableTemplate) {
                //tableTemplateElement = document.createElement('template');
                //tableTemplateElement.innerHTML = this.tableTemplate;
                //
                //theadElement = xtag.query(tableTemplateElement.content, 'thead')[0];
                //tbodyElement = xtag.query(tableTemplateElement.content, 'tbody')[0];
                //
                //console.log(theadElement, tbodyElement);
                
                strTemplate = element.tableTemplate; //this.initalHTML;
                
            } else { // if (data.arr_column)
                // create an array of hidden column numbers
                arrHide = (element.getAttribute('hide') || '').split(/[\s]*,[\s]*/);
                
                // build up the header cells variable and the record cells variable
                for (i = 0, len = data.arr_column.length, strHeaderCells = '', strRecordCells = ''; i < len; i += 1) {
                    // if this column is not hidden
                    if (arrHide.indexOf((i + 1) + '') === -1 && arrHide.indexOf(data.arr_column[i]) === -1) {
                        // append a new cell to each of the header cells and record cells variables
                        strHeaderCells += '<th gs-dynamic>' + encodeHTML(data.arr_column[i]) + '</th> ';
                        strRecordCells += '<td gs-dynamic>{{! row[\'' + data.arr_column[i] + '\'] }}</td> ';
                    }
                }
                
                // put everything together
                strTemplate =   '<table gs-dynamic>' +
                                    '<thead gs-dynamic>' +
                                        '<tr gs-dynamic>' +
                                            strHeaderCells +
                                        '</tr>' +
                                    '</thead>' +
                                    '<tbody gs-dynamic>' +
                                        '<tr value="{{! row[\'' + data.arr_column[0] + '\'] }}" gs-dynamic>' +
                                            strRecordCells +
                                        '</tr>' +
                                    '</tbody>' +
                                '<table>';
            }
            
            divElement = document.createElement('div');
            
            divElement.innerHTML = strTemplate;
            
            tableElement = xtag.queryChildren(divElement, 'table')[0];
            theadElement = xtag.queryChildren(tableElement, 'thead')[0];
            tbodyElement = xtag.queryChildren(tableElement, 'tbody')[0];
            
            // if there is a tbody
            if (tbodyElement) {
                recordElement = xtag.queryChildren(tbodyElement, 'tr')[0];
                
                // if there is a record: template
                if (recordElement) {
                    
                    // if there is a thead element: add reflow cell headers to the tds
                    if (theadElement) {
                        theadCellElements = xtag.query(theadElement, 'td, th');
                        tbodyCellElements = xtag.query(tbodyElement, 'td, th');
                        
                        for (i = 0, len = theadCellElements.length; i < len; i += 1) {
                            currentCellLabelElement = document.createElement('b');
                            currentCellLabelElement.classList.add('cell-label');
                            currentCellLabelElement.setAttribute('data-text', (theadCellElements[i].textContent || '') + ':');
                            currentCellLabelElement.setAttribute('gs-dynamic', '');
                            
                            if (tbodyCellElements[i].childNodes) {
                                tbodyCellElements[i].insertBefore(currentCellLabelElement, tbodyCellElements[i].childNodes[0]);
                            } else {
                                tbodyCellElements[i].insertChild(currentCellLabelElement);
                            }
                        }
                    }
                    
                    // template
                    jsnTemplate = GS.templateHideSubTemplates(tbodyElement.innerHTML, true);
                    strHTML = GS.templateWithEnvelopeData(tbodyElement.innerHTML, data);
                    tbodyElement.innerHTML = GS.templateShowSubTemplates(strHTML, jsnTemplate);
                    
                    element.dropDownTable = tableElement;
                    element.ready = true;
                }
            }
            
            //if (data.arr_column) {
            if (bolInitalLoad && element.getAttribute('value')) {
                selectRecordFromValue(element, element.getAttribute('value'), false);
                
            } else if (element.value) {
                selectRecordFromValue(element, element.value, false);
            }
            //}
            
        // else there was an error: add error class, title attribute
        } else {
            console.error(data);
            element.error = true;
            element.ready = false;
            element.classList.add('error');
            element.dropDownButton.setAttribute('title', 'This combobox has failed to load.');
            element.dropDownButton.setAttribute('icon', 'exclamation-circle');
            
            if (element.hasAttribute('limit-to-list')) {
                element.setAttribute('disabled', '');
            }
        }
    }
    
    function refreshControl(element) {
        var i, len, divElement, arrPassThroughAttributes = [
                'placeholder',
                'name',
                'maxlength',
                'autocorrect',
                'autocapitalize',
                'autocomplete',
                'autofocus',
                'spellcheck'
            ];
        
        // if the gs-text element has a tabindex: save the tabindex and remov the attribute
        if (element.hasAttribute('tabindex')) {
            element.savedTabIndex = element.getAttribute('tabindex');
            element.removeAttribute('tabindex');
        }
        
        // clear out the combobox HTML
        element.innerHTML = '';
        
        // creating/setting root
        divElement = document.createElement('div');
        divElement.setAttribute('gs-dynamic', '');
        divElement.classList.add('root');
        
        element.appendChild(divElement);
        element.root = divElement;
        
        element.root.innerHTML = '<input gs-dynamic class="control" type="text" />' +
                                 '<gs-button gs-dynamic class="drop_down_button" icononly icon="angle-down" no-focus></gs-button>';
        
        element.control = xtag.query(element, '.control')[0];
        element.dropDownButton = xtag.query(element, '.drop_down_button')[0];
        
        // copy passthrough attrbutes to control
        for (i = 0, len = arrPassThroughAttributes.length; i < len; i += 1) {
            if (element.hasAttribute(arrPassThroughAttributes[i])) {
                element.control.setAttribute(arrPassThroughAttributes[i], element.getAttribute(arrPassThroughAttributes[i]) || '');
            }
        }
        
        // if we saved a tabindex: apply the tabindex to the control
        if (element.savedTabIndex !== undefined && element.savedTabIndex !== null) {
            element.control.setAttribute('tabindex', element.savedTabIndex);
        }
        
        // bind change event to control
        //console.log('change bound');
        element.control.addEventListener('change', function (event) {
            event.preventDefault();
            event.stopPropagation();
            
            //console.log('change detected');
            if (!element.ignoreChange) {
                selectRecordFromValue(element, this.value, true);
            }
            element.ignoreChange = false;
        });
        
        
        //  on safari the change event doesn't occur if you click out while the autocomplete has
        //      completed the value (because the user technically didn't change after the javascript changed the value)
        //  to solve this the code below will mimic a change event if one does not occur at the right time
        
        // there are two ways that user's cause change events:
        //      1) after making a change to the value: taking the focus out of the field
        //      2) after making a change to the value: hitting return
        
        // this code counts on the fact that a browser will always emit a change event before a 'blur' or 'keyup'
        // the execution is as follows
        
        // this is the basic plan:
        //  change:
        //          // changeOccured tells the event code to not do anything because a change event did fire
        //          element.changeOccured to true
        //  focus:
        //          // element.lastValue allows us to compare the value to the old value, and if there's a difference: we need a change event
        //          set element.lastValue to current value of the control 
        //  blur:
        //          if element.changeOccured === true:
        //              set element.changeOccured = false
        //          else:
        //              if control.value !== lastValue: // if the value has been changed
        //                  trigger artificial change event on control
        //  keyup (on return key):
        //          if element.changeOccured === true:
        //              set element.changeOccured = false
        //          else:
        //              if control.value !== lastValue: // if the value has been changed
        //                  trigger artificial change event on control
        
        
        element.control.addEventListener('change', function (event) {
            element.changeOccured = true;
        });
        
        element.control.addEventListener('focus', function (event) {
            element.lastValue = element.control.value;
        });
        
        element.control.addEventListener('blur', function (event) {
            if (element.changeOccured === true) {
                element.changeOccured = false;
            } else if (element.control.value !== element.lastValue) {
                GS.triggerEvent(element.control, 'change');
            }
        });
        
        element.control.addEventListener('keyup', function (event) {
            // if the key was return
            if ((event.keyCode || event.which) === 13) {
                if (element.changeOccured === true) {
                    element.changeOccured = false;
                } else if (element.control.value !== element.lastValue) {
                    GS.triggerEvent(element.control, 'change');
                }
            }
        });
    }
    
    function pushReplacePopHandler(element) {
        var i, len, arrPopKeys, currentValue, bolRefresh = false, strQueryString = GS.getQueryString(), strQSCol = element.getAttribute('qs');
        
        if (strQSCol && GS.qryGetKeys(strQueryString).indexOf(strQSCol) > -1) {
            element.value = GS.qryGetVal(strQueryString, strQSCol);
        }
        
        if (element.hasAttribute('refresh-on-querystring-values')) {
            arrPopKeys = element.getAttribute('refresh-on-querystring-values').split(/\s*,\s*/gim);
            
            for (i = 0, len = arrPopKeys.length; i < len; i += 1) {
                currentValue = GS.qryGetVal(strQueryString, arrPopKeys[i]);
                
                if (element.popValues[arrPopKeys[i]] !== currentValue) {
                    bolRefresh = true;
                }
                
                element.popValues[arrPopKeys[i]] = currentValue;
            }
            
        } else if (element.hasAttribute('refresh-on-querystring-change')) {
            bolRefresh = true;
        }
        
        if (bolRefresh) {
            getData(element);
        }
    }
    
    // dont do anything that modifies the element here
    function elementCreated(element) {
        // if "created" hasn't been suspended: run created code
        if (!element.hasAttribute('suspend-created')) {
            
        }
    }
    
    //
    function elementInserted(element) {
        var tableTemplateElement, tableTemplateElementCopy, oldRootElement, i, len,
            recordElement, strQueryString = GS.getQueryString(), arrElement, currentElement, strQSValue;
        
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                
                element.open = false;
                element.error = false;
                element.ready = false;
                
                // handle "qs" attribute
                if (element.getAttribute('qs') ||
                        element.getAttribute('refresh-on-querystring-values') ||
                        element.hasAttribute('refresh-on-querystring-change')) {
                    strQSValue = GS.qryGetVal(GS.getQueryString(), element.getAttribute('qs'));
                    
                    if (strQSValue !== '' || !element.getAttribute('value')) {
                        element.setAttribute('value', strQSValue);
                    }
                    
                    element.popValues = {};
                    window.addEventListener('pushstate', function () {    pushReplacePopHandler(element); });
                    window.addEventListener('replacestate', function () { pushReplacePopHandler(element); });
                    window.addEventListener('popstate', function () {     pushReplacePopHandler(element); });
                }
                
                //
                tableTemplateElement = xtag.queryChildren(element, 'template')[0];
                
                if (tableTemplateElement) {
                    tableTemplateElementCopy = document.createElement('template');
                    tableTemplateElementCopy.innerHTML = tableTemplateElement.innerHTML;
                    
                    recordElement = xtag.query(xtag.query(tableTemplateElementCopy.content, 'tbody')[0], 'tr')[0];
                    
                    if (recordElement) {
                        arrElement = xtag.query(recordElement, '[column]');
                        
                        for (i = 0, len = arrElement.length; i < len; i += 1) {
                            currentElement = arrElement[i];
                            
                            if ((!currentElement.getAttribute('value')) && currentElement.getAttribute('column')) {
                                currentElement.setAttribute('value', '{{! row.' + currentElement.getAttribute('column') + ' }}');
                            }
                        }
                        
                        element.tableTemplate = tableTemplateElementCopy.innerHTML;
                        
                        if (!element.getAttribute('src') && !element.getAttribute('source') && !element.getAttribute('initalize')) {
                            //element.staticDropDownTable = GS.cloneElement(tableTemplateElementCopy.content.children[0]);
                            //element.dropDownTable = GS.cloneElement(tableTemplateElementCopy.content.children[0]); //element.staticDropDownTable;
                            
                            element.dropDownTable = GS.cloneElement(xtag.query(tableTemplateElementCopy.content, 'table')[0]);
                        }
                    }
                }
                
                // filling root
                refreshControl(element);
                
                //
                element.addEventListener('click', function (event) {
                    var clickHandler;
                    
                    if (event.target.classList.contains('drop_down_button')) {
                        //console.log(element.open, element.error);
                        if (!element.open && !element.error) {
                            clickHandler = function () {
                                openDropDown(element);
                                window.removeEventListener('click', clickHandler);
                            };
                            
                            window.addEventListener('click', clickHandler);
                        } else {
                            //closeDropDown(element);
                        }
                    }
                });
                
                element.addEventListener('keydown', function (event) {
                    if (event.target.classList.contains('control')) {
                        handleKeyDown(element, event);
                    }
                });
                
                element.addEventListener('keyup', function (event) {
                    if (event.target.classList.contains('control')) {
                        handleKeyUp(element, event);
                    }
                });
                
                if (xtag.queryChildren(element, '.root').length < 1) {
                    refreshControl(element);
                }
                
                if (element.getAttribute('src') || element.getAttribute('source') || element.getAttribute('initalize')) {
                    getData(element, true);
                } else {
                    element.ready = true;
                    
                    if (element.getAttribute('value')) {
                        selectRecordFromValue(element, element.getAttribute('value'), false);
                        
                    } else if (element.value) {
                        selectRecordFromValue(element, element.value, false);
                    }
                }
            }
        }
    }
    
    xtag.register('gs-combo', {
        lifecycle: {
            created: function () {
                // if the value was set before the "created" lifecycle code runs: set attribute
                //      (discovered when trying to set a value of a date control in the after_open of a dialog)
                //      ("delete" keyword added because of firefox)
                if (this.value && !this.hasAttribute('value')) {
                    this.setAttribute('value', this.value);
                    delete this.value;
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
        events: {},
        accessors: {
            value: {
                get: function () {
                    if (this.control || this.innerValue) {
                        return this.innerValue || this.control.value;
                    } else if (this.getAttribute('value')) {
                        return this.getAttribute('value');
                    }
                    return undefined;
                },
                
                // set the value of the input and set the value attribute
                set: function (newValue) {
                    
                    // if we have not yet templated: just stick the value in an attribute
                    if (this.ready === false) {
                        this.setAttribute('value', newValue);
                        
                    // else if the value is empty and allow-empty is present
                    } else if (newValue === '' && this.hasAttribute('allow-empty')) {
                        this.innerValue = '';
                        this.control.value = '';
                        
                    // else select the record using the string that was sent
                    } else {
                        selectRecordFromValue(this, newValue, false);
                    }
                }
            },
            textValue: {
                // get value straight from the input
                get: function () {
                    return this.control.value;
                },
                
                // set the value of the input and set the value attribute
                set: function (newValue) {
                    
                    // if we have not yet templated: just stick the value in an attribute
                    if (this.ready === false) {
                        this.setAttribute('value', newValue);
                        
                    // else select the record using the string that was sent
                    } else {
                        selectRecordFromValue(this, newValue, false);
                    }
                }
            }
        },
        methods: {
            focus: function () {
                this.control.focus();
            },
            
            'getData': function () {
                getData(this);
            }
        }
    });
});