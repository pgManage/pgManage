
window.addEventListener('design-register-element', function () {
    registerDesignSnippet('Static Template <gs-listbox>', '<gs-listbox>', 'gs-listbox>\n'+
                                                                     '    <template>\n'+
                                                                     '        <table>\n'+
                                                                     '            <tbody>\n'+
                                                                     '                <tr value="${1}">\n'+
                                                                     '                    <td>${0}</td>\n'+
                                                                     '                </tr>\n'+
                                                                     '            </tbody>\n'+
                                                                     '        </table>\n'+
                                                                     '    </template>\n' +
                                                                     '</gs-listbox>');
    registerDesignSnippet('Custom Template <gs-listbox>', '<gs-listbox>', 'gs-listbox src="${1:test.tpeople}">\n'+
                                                                     '    <template>\n'+
                                                                     '        <table>\n'+
                                                                     '            <tbody>\n'+
                                                                     '                <tr value="{{! row.id }}">\n'+
                                                                     '                    <td>{{! row.${3:name} }}</td>\n'+
                                                                     '                </tr>\n'+
                                                                     '            </tbody>\n'+
                                                                     '        </table>\n'+
                                                                     '    </template>\n' +
                                                                     '</gs-listbox>');
    registerDesignSnippet('Dynamic Template <gs-listbox>', '<gs-listbox>', 'gs-listbox src="${1:test.tpeople}"></gs-listbox>');
    registerDesignSnippet('<gs-listbox>', '<gs-listbox>', 'gs-listbox src="${1:test.tpeople}"></gs-listbox>');
    
    designRegisterElement('gs-listbox', '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-listbox.html');
    
    window.designElementProperty_GSLISTBOX = function(selectedElement) {
        addProp('Source', true, '<gs-memo class="target" value="' + encodeHTML(decodeURIComponent(selectedElement.getAttribute('src') ||
                                                                            selectedElement.getAttribute('source') || '')) + '" mini></gs-memo>',
                function () {
            return setOrRemoveTextAttribute(selectedElement, 'src', encodeURIComponent(this.value));
        });
        
        addProp('Columns', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('cols') || '') + '" mini></gs-text>',
                function () {
            return setOrRemoveTextAttribute(selectedElement, 'cols', this.value);
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
        
        // TITLE attribute
        addProp('Title', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('title') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'title', this.value);
        });
        
        // TABINDEX attribute
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
        if (selectedElement.hasAttribute('hidden'))           { strVisibilityAttribute = 'hidden'; }
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
        
        // NO-SELECT attribute
        addProp('Dissallow&nbsp;Select', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('no-select') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'no-select', this.value === 'true', true);
        });
        
        // LETTER-SCROLLBAR attribute
        addProp('Letter&nbsp;Scrollbar', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('letter-scrollbar') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'letter-scrollbar', this.value === 'true', true);
        });
        
        // LETTER-DIVIDERS attribute
        addProp('Letter Dividers', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('letter-dividers') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'letter-dividers', this.value === 'true', true);
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
    };
});

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    
    // removes selected class from old selected records adds class selected to record
    function highlightRecord(element, record) {
        var i, len, arrSelectedTrs;
        
        //console.log(record);
        
        if (element.tableElement && xtag.queryChildren(element.tableElement, 'tbody')[0]) {
            // clear previous selection
            arrSelectedTrs = xtag.queryChildren(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr[selected]');
            
            for (i = 0, len = arrSelectedTrs.length; i < len; i += 1) {
                arrSelectedTrs[i].removeAttribute('selected');
            }
        }
        
        // select/highlight the record that was provided
        if (record) {
            record.setAttribute('selected', '');
        }
    }

    // loops through the records and finds a record using the parameter
    function findRecordFromValue(element, searchValue) {
        var i, len, matchedRecord, arrTrs, strSearchString;

        if (element.tableElement && xtag.queryChildren(element.tableElement, 'tbody')[0]) {
            //console.log('1***', element.tableElement);
            //console.log('2***', xtag.queryChildren(element.tableElement, 'tbody')[0]);
            //console.log('3***', xtag.queryChildren(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr'));
            arrTrs = xtag.queryChildren(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr');
            strSearchString = String(searchValue);

            // search exact text and search both the value attribute (if present) and the first td text
            for (i = 0, len = arrTrs.length; i < len; i += 1) {
                if (arrTrs[i].getAttribute('value') === strSearchString || xtag.queryChildren(arrTrs[i], 'td')[0].textContent === strSearchString) {
                    matchedRecord = arrTrs[i];
                    break;
                }
            }
        }

        return matchedRecord;
    }

    function selectRecord(element, handle, bolChange) {
        var record, strRecordValue, strFirstTdText;
        
        if (!element.hasAttribute('no-select')) {
            if (typeof handle === 'string' || typeof handle === 'number') {
                record = findRecordFromValue(element, handle);
            } else {
                record = handle;
            }
            
            //console.trace(handle, record);
            
            if (!record && handle !== '') {
                console.warn('Listbox warning: record not found' + (typeof handle === 'string' ? ': "' + handle + '"' : ''));
                
            } else if (record) {
                //console.log('1***', this.selectedRecord, this.value);
                
                strRecordValue = record.getAttribute('value');
                strFirstTdText = xtag.queryChildren(record, 'td')[0].textContent;
                
                if (element.value !== (strRecordValue || strFirstTdText)) {
                    element.innerValue = strRecordValue || strFirstTdText;
                    element.innerSelectedRecord = record;
                    if (bolChange) {
                        element.hackToPreventScroll = true;
                        if (element.innerValue !== element.getAttribute('value')) {
                            element.setAttribute('value', element.innerValue);
                        }
                        element.hackToPreventScroll = false;
                        element.triggerChange();
                        //console.log('2*** change triggered');
                    }
                }
            }
            
            // highlightRecord has its own checking for no record supplied,
            // so this deselects any rows then selects the supplied record or none
            highlightRecord(element, record);
            
            //console.log('3***', element.selectedRecord, element.value);
        }
    }
    
    
    // #################################################################
    // ########################## USER EVENTS ##########################
    // #################################################################
    
    // handle behaviours on keydown
    function handleKeyDown(event) {
        var element = event.target, intKeyCode = event.keyCode || event.which, selectedTr, trs, i, len, selectedRecordIndex;
        
        if (!element.hasAttribute('disabled')) {
            if (!element.hasAttribute('no-select')) {
                if ((intKeyCode === 40 || intKeyCode === 38) && !event.shiftKey && !event.metaKey && !event.ctrlKey && !element.error) {
                    
                    trs = xtag.queryChildren(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr:not(.divider)');
                    
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
                    
                    //GS.scrollIntoView(selectedTr);
                    element.scrollToSelectedRecord();
                    event.preventDefault();
                    event.stopPropagation();
                    
                } else if (event.keyCode === 13) {
                    selectedTr = xtag.queryChildren(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr[selected]')[0];
                    
                    if (element.tableElement && selectedTr) {
                        selectRecord(element, selectedTr, true);
                    }
                }
            }
        } else {
            if (event.keyCode !== 9) {
                event.preventDefault();
                event.stopPropagation();
            }
        }
        
        //console.log('handleKeyDown', intKeyCode, event);
    }
    
    function handleFocusout(event) {
        var element = event.target, selectedTr;
        
        if (element.tableElement) {
            selectedTr = xtag.queryChildren(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr[selected]')[0];
            
            if (selectedTr) {
                selectRecord(element, selectedTr, true);
            }
        }
    }
    
    
    // #################################################################
    // ######################### DATA HANDLING #########################
    // #################################################################
    
    
    // handles fetching the data
    //      if bolInitalLoad === true then
    //          use: initialize query COALESCE TO source query
    //      else
    //          use: source query
    function getData(element, callback, bolInitalLoad, bolClearPrevious) {
        
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
              , strLimit   = GS.templateWithQuerystring(element.getAttribute('limit') || '1')
              , strOffset  = GS.templateWithQuerystring(element.getAttribute('offset') || '')
              , response_i = 0, response_len = 0, arrTotalRecords = [];
            
            GS.addLoader(element, 'Loading...');
            GS.requestSelectFromSocket(GS.envSocket, strSchema, strObject, strColumns
                                     , strWhere, strOrd, strLimit, strOffset
                                     , function (data, error) {
                var arrRecords, arrCells, envData
                  , i, len, cell_i, cell_len;
                
                //console.log(data);
                
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
                        GS.removeLoader(element);
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
                    GS.removeLoader(element);
                }
            });
        } else {
            var strLink,
                strSource = GS.templateWithQuerystring(decodeURIComponent(element.getAttribute('src') ||
                                                                   element.getAttribute('source') || ''));
            
            strLink = '/' + (element.getAttribute('action-select') || 'env/action_select') +
                    '?src=' + encodeURIComponent(strSource) +
                    '&where='    + encodeURIComponent(GS.templateWithQuerystring(element.getAttribute('where') || '')) +
                    '&limit='    + encodeURIComponent(GS.templateWithQuerystring(element.getAttribute('limit') || '')) +
                    '&offset='   + encodeURIComponent(GS.templateWithQuerystring(element.getAttribute('offset') || '')) +
                    '&order_by=' + encodeURIComponent(GS.templateWithQuerystring(element.getAttribute('ord') || '')) +
                    '&cols='     + encodeURIComponent(element.getAttribute('cols') || '');
            
            document.addEventListener('dataready_' + encodeURIComponent(strLink), function __THIS_FUNCTION__(event) {
                GS.removeLoader(element);
                
                handleData(element, bolInitalLoad, event.detail.response, event.detail.error);
                GS.triggerEvent(element, 'after_select');
                if (typeof callback === 'function') {
                    callback();
                }
                
                document.removeEventListener('dataready_' + encodeURIComponent(strLink), __THIS_FUNCTION__);
            });
            
            GS.dataFetch(strLink, true);
            
            GS.addLoader(element, 'Loading...');
        }
    }
    
    // handles data result from method function: getData 
    //      success:  template
    //      error:    add error classes
    function handleData(element, bolInitalLoad, data, error) {
        var strTemplate, divElement, tableElement, theadElement, theadCellElements, tbodyElement, tbodyCellElements, lastRecordElement,
            recordElements, recordElement, currentCellLabelElement, template, i, len, arrHeaders = [], arrHide, intVisibleColumns, strHeaderCells, strRecordCells, jsnTemplate, strHTML;
        
        // clear any old error status
        element.classList.remove('error');
        element.setAttribute('title', '');
        
        //console.log(error, data, bolInitalLoad);
        
        // if there was no error
        if (!error) {
            element.error = false;
            
            if (element.tableTemplate) {// element.tableTemplateElement
                strTemplate = element.tableTemplate;// element.tableTemplateElement
                
            } else {
                // create an array of hidden column numbers
                arrHide = (element.getAttribute('hide') || '').split(/[\s]*,[\s]*/);
                
                // build up the header cells variable and the record cells variable
                for (i = 0, len = data.arr_column.length, strHeaderCells = '', strRecordCells = '', intVisibleColumns = 0; i < len; i += 1) {
                    // if this column is not hidden
                    if (arrHide.indexOf((i + 1) + '') === -1 && arrHide.indexOf(data.arr_column[i]) === -1) {
                        // append a new cell to each of the header cells and record cells variables
                        strHeaderCells += '<th gs-dynamic>' + encodeHTML(data.arr_column[i]) + '</th> ';
                        strRecordCells += '<td gs-dynamic>{{! row[\'' + data.arr_column[i] + '\'] }}</td> ';
                        intVisibleColumns += 1;
                    }
                }
                
                // put everything together
                strTemplate =   '<table gs-dynamic>';
                
                if (intVisibleColumns > 1) { // data.arr_column.length (didn't take into account hidden columns)
                    strTemplate +=  '<thead gs-dynamic>' +
                                        '<tr gs-dynamic>' +
                                            strHeaderCells +
                                        '</tr>' +
                                    '</thead>';
                }
                
                strTemplate +=      '<tbody gs-dynamic>' +
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
                            
                            if (tbodyCellElements[i].childNodes) {
                                tbodyCellElements[i].insertBefore(currentCellLabelElement, tbodyCellElements[i].childNodes[0]);
                            } else {
                                tbodyCellElements[i].insertChild(currentCellLabelElement);
                            }
                        }
                    }
                    
                    // template
                    jsnTemplate = GS.templateHideSubTemplates(tbodyElement.innerHTML, true);
                    strHTML = GS.templateWithEnvelopeData(jsnTemplate.templateHTML, data);
                    tbodyElement.innerHTML = GS.templateShowSubTemplates(strHTML, jsnTemplate);
                    
                    element.tableElement = tableElement;
                    element.syncView();
                }
            }
            
            //console.log('1***', bolInitalLoad, element.getAttribute('value'));
            
            //if (bolInitalLoad && element.getAttribute('value')) {
            //    //console.log('2***', bolInitalLoad, element.getAttribute('value'));
            //    selectRecord(element, element.getAttribute('value'), false);
            //    element.scrollToSelectedRecord();
            //    
            //// select first record
            //} else
            
            if (bolInitalLoad && !element.getAttribute('value') && element.hasAttribute('select-first')) {
                selectRecord(element, xtag.query(element, 'tbody tr')[0].getAttribute('value'), false);
                element.scrollToSelectedRecord();
            }
            
        // else there was an error: add error class, title attribute
        } else {
            element.error = true;
            element.classList.add('error');
            element.setAttribute('title', 'This listbox has failed to load.');
            
            element.setAttribute('disabled', '');
            
            GS.ajaxErrorDialog(data);
        }
    }
    
    function getParentCell(element) {
        var currentElement = element;
        
        while (currentElement.nodeName !== 'TD' && currentElement.nodeName !== 'TH' && currentElement.nodeName !== 'HTML') {
            currentElement = currentElement.parentNode;
        }
        
        if (currentElement.nodeName !== 'TD' && currentElement.nodeName !== 'TH') {
            return undefined;
        }
        
        return currentElement;
    }
    
    function windowResizeHandler() {
        var i, len, arrElement;
        
        arrElement = document.getElementsByTagName('gs-listbox');
        
        for (i = 0, len = arrElement.length; i < len; i += 1) {
            if (GS.pxToEm(document.body, this.oldWidth) !== GS.pxToEm(document.body, this.offsetWidth) && // <== if the width (in ems) changes
                arrElement[i].hasAttribute('letter-scrollbar') &&
                arrElement[i].tableElement) {
                
                if (arrElement[i].hasAttribute('letter-dividers') || arrElement[i].hasAttribute('letter-scrollbar')) {
                    arrElement[i].refreshDividingPoints();
                }
                arrElement[i].letterScrollbarHandler();
                this.oldWidth = this.offsetWidth;
            }
        }
    }
    
    window.addEventListener('resize', windowResizeHandler);  // I want to debounce this event but that would require a timer -michael
    window.addEventListener('orientationchange', windowResizeHandler);
    
    //function pushReplacePopHandler(element) {
    //    var i, len, currentValue, bolRefresh = false, strQueryString = GS.getQueryString(), arrPopKeys, strQSCol = element.getAttribute('qs');
    //    
    //    if (strQSCol && GS.qryGetKeys(strQueryString).indexOf(strQSCol) > -1 && element.value !== GS.qryGetVal(strQueryString, strQSCol)) {
    //        element.value = GS.qryGetVal(strQueryString, strQSCol);
    //    }
    //    
    //    // if this element has a refresh-on-querystring-values attribute: check for changes
    //    if (element.hasAttribute('refresh-on-querystring-values')) {
    //        arrPopKeys = element.getAttribute('refresh-on-querystring-values').split(/\s*,\s*/gim);
    //        
    //        for (i = 0, len = arrPopKeys.length; i < len; i += 1) {
    //            currentValue = GS.qryGetVal(strQueryString, arrPopKeys[i]);
    //            
    //            if ((element.popValues[arrPopKeys[i]] || '') !== currentValue) {
    //                bolRefresh = true;
    //            }
    //            
    //            element.popValues[arrPopKeys[i]] = currentValue;
    //        }
    //        
    //    } else if (element.hasAttribute('refresh-on-querystring-change')) {
    //        bolRefresh = true;
    //    }
    //    
    //    if (bolRefresh) {
    //        element.refresh();
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
        var arrPopKeys;
        var currentValue;
        var bolRefresh;
        var strOperator;

        if (strQSCol) {
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
                } else if (element.value !== strQSValue) {
                    element.value = strQSValue;
                }
            }
        }
        
        // handle "refresh-on-querystring-values" and "refresh-on-querystring-change" attributes
        if (element.internal.bolQSFirstRun === true) {
            if (element.hasAttribute('refresh-on-querystring-values')) {
                arrPopKeys = element.getAttribute('refresh-on-querystring-values').split(/\s*,\s*/gim);
                
                for (i = 0, len = arrPopKeys.length; i < len; i += 1) {
                    currentValue = GS.qryGetVal(strQS, arrPopKeys[i]);
                    
                    if (element.popValues[arrPopKeys[i]] !== currentValue) {
                        bolRefresh = true;
                    }
                    
                    element.popValues[arrPopKeys[i]] = currentValue;
                }
            } else if (element.hasAttribute('refresh-on-querystring-change')) {
                bolRefresh = true;
            }
            
            if (bolRefresh && element.hasAttribute('src')) {
                getData(element);
            } else if (bolRefresh && !element.hasAttribute('src')) {
                console.warn('gs-combo Warning: element has "refresh-on-querystring-values" or "refresh-on-querystring-change", but no "src".', element);
            }
        } else {
            if (element.hasAttribute('refresh-on-querystring-values')) {
                arrPopKeys = element.getAttribute('refresh-on-querystring-values').split(/\s*,\s*/gim);
                
                for (i = 0, len = arrPopKeys.length; i < len; i += 1) {
                    element.popValues[arrPopKeys[i]] = GS.qryGetVal(strQS, arrPopKeys[i]);
                }
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
            if (element.value && !element.getAttribute('value')) {
                element.setAttribute('value', element.value);
                delete element.value;
                //element.value = null;
            }
        }
    }
    
    //
    function elementInserted(element) {
        var tableTemplateElement, arrElement, recordElement, tableTemplateElementCopy, strQSValue, i, len, currentElement;
        
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                element.error = false;
                element.internal = {};
                saveDefaultAttributes(element);
                
                // handle "qs" attribute
                if (element.hasAttribute('qs') ||
                        element.hasAttribute('refresh-on-querystring-values') ||
                        element.hasAttribute('refresh-on-querystring-change')) {
                    element.popValues = {};
                    //strQSValue = GS.qryGetVal(GS.getQueryString(), element.getAttribute('qs'));
                    //
                    //if (strQSValue !== '' || !element.getAttribute('value')) {
                    //    element.setAttribute('value', strQSValue);
                    //}

                    pushReplacePopHandler(element);
                    window.addEventListener('pushstate',    function () { pushReplacePopHandler(element); });
                    window.addEventListener('replacestate', function () { pushReplacePopHandler(element); });
                    window.addEventListener('popstate',     function () { pushReplacePopHandler(element); });
                    //element.popValues = GS.qryToJSON(GS.getQueryString());
                }
                
                // allows the element to have focus
                if (!element.hasAttribute('tabindex')) {
                    element.setAttribute('tabindex', '0');
                }
                
                // select for template
                tableTemplateElement = xtag.queryChildren(element, 'template')[0];
                
                if (tableTemplateElement) {
                    // add a doT.js coded "value" attribute to any element with a "column" attribute but no "value" attribute
                    element.tableTemplate = GS.templateColumnToValue(tableTemplateElement.innerHTML);
                }
                
                //console.log(element.tableTemplate);
                
                if (element.getAttribute('src') || element.getAttribute('source')) {
                    getData(element, '', true);
                } else {
                    if (tableTemplateElement) {
                        element.tableElement = xtag.query(tableTemplateElement.content, 'table')[0];
                    } else if (xtag.queryChildren(element, 'table')[0]) {
                        element.tableElement = xtag.queryChildren(element, 'table')[0];
                    } else {
                        element.tableElement = document.createElement('table');
                    }
                    
                    element.syncView();
                }
            }
        }
    }
    
    xtag.register('gs-listbox', {
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
                    if (strAttrName === 'value' && newValue !== oldValue) {
                        this.value = newValue;
                    }
                }
            }
        },
        events: {},
        accessors: {
            value: {
                get: function () {
                    return this.innerValue;
                },
                
                set: function (strNewValue) {
                    selectRecord(this, strNewValue);
                    this.scrollToSelectedRecord();
                }
            },
            
            selectedRecord: {
                get: function () {
                    return this.innerSelectedRecord;
                },
                
                set: function (newValue) {
                    selectRecord(this, newValue);
                    this.scrollToSelectedRecord();
                }
            },
            
            textValue: {
                get: function () {
                    if (this.innerSelectedRecord) {
                        return xtag.queryChildren(this.innerSelectedRecord, 'td')[0].textContent;
                    }
                    return undefined;
                },
                
                set: function () {
                    selectRecord(this, strNewValue);
                    this.scrollToSelectedRecord();
                }
            }
        },
        methods: {
            // just a semantic alias to the getData function
            refresh: function (callback) {
                getData(this, callback);
            },
            
            // #################################################################
            // ########### SELECTION / HIGHLIGHTING / RECORD / VALUE ###########
            // #################################################################
            
            // scroll the dropdown to the selected record
            scrollToSelectedRecord: function () {
                var selectedTr;
                
                if (this.tableElement) {
                    selectedTr = xtag.query(this.tableElement, 'tr[selected]')[0];
                    
                    if (selectedTr) {
                        GS.scrollIntoView(selectedTr);
                    }
                }
                
                /*var scrollingContainer, arrTrs, i, len, intScrollTop, bolFoundSelected = false;
                
                if (this.tableElement) {
                    scrollingContainer = this;
                    arrTrs = xtag.query(this.tableElement, 'tr');
                    
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
                }*/
            },
            
            // ################################################################
            // ####################### LETTER SCROLLBAR #######################
            // ################################################################
            
            letterScrollbarHandler: function () {
                var element = this, i, len, intTextHeight, intLettersDropped, intSkipperHeight,
                    intElementHeight, intDistance, strHTML, arrSkippers;
                
                // if there is no letter scrollbar container: create it
                if (xtag.queryChildren(element, '.letter-scrollbar-container').length === 0) {
                    element.letterScrollbarContainer = document.createElement('div');
                    element.letterScrollbarContainer.classList.add('letter-scrollbar-container');
                    element.letterScrollbarContainer.setAttribute('gs-dynamic', '');
                    element.appendChild(element.letterScrollbarContainer);
                    
                // else: clear out the old letterScrollbarContainer
                } else {
                    element.letterScrollbarContainer.innerHTML = '';
                }
                
                if (element.clientHeight < element.scrollContainer.scrollHeight) {
                    intTextHeight = GS.getTextHeight(element.letterScrollbarContainer);
                    intSkipperHeight = intTextHeight * this.arrDividingPoints.length;
                    intElementHeight = element.clientHeight / this.arrDividingPoints.length;
                    
                    if (intElementHeight < intTextHeight) {
                        intElementHeight = intTextHeight;
                    }
                    
                    if (intSkipperHeight > element.clientHeight) { 
                        intLettersDropped = 0;
                        while (intSkipperHeight > element.clientHeight && intLettersDropped < 100) {
                            intSkipperHeight -= intTextHeight;
                            intLettersDropped += 1;
                        }
                        intDistance = Math.ceil(this.arrDividingPoints.length / intLettersDropped);
                    }
                    
                    for (i = 0, len = this.arrDividingPoints.length, strHTML = ''; i < len; i += 1) {
                        if (intLettersDropped === undefined || (intLettersDropped > 0 && i % intDistance !== 0)) {
                            strHTML += '<div class="skipper" gs-dynamic ' +
                                            'style="height: ' + intElementHeight + 'px; line-height: ' + intElementHeight + 'px;" ' + 
                                            'data-target-offset="' + this.arrDividingPoints[i].offset + '">' +
                                            '<span gs-dynamic>' + this.arrDividingPoints[i].letter + '</span>' +
                                        '</div>';
                        }
                    }
                    
                    element.letterScrollbarContainer.innerHTML = strHTML;
                    
                    if (element.paddingElement && element.paddingElement.parentNode === element.scrollContainer) {
                        element.scrollContainer.removeChild(element.paddingElement);
                    }
                    
                    element.paddingElement = document.createElement('div');
                    element.paddingElement.setAttribute('gs-dynamic', '');
                    if (this.arrDividingPoints.length > 0) {
                    element.paddingElement.style.height = (element.clientHeight -
                                                        (element.scrollContainer.scrollHeight - parseInt(this.arrDividingPoints[this.arrDividingPoints.length - 1].offset, 10))) + 'px';
                    }
                    element.scrollContainer.appendChild(element.paddingElement);
                    
                    // bind skipper click, mousedown-then-drag
                    arrSkippers = element.letterScrollbarContainer.children;
                    
                    if (element.mousedownHandler) {
                        window.removeEventListener(evt.mousedown, element.mousedownHandler);
                        window.removeEventListener(evt.mousemove, element.mousemoveHandler);
                        window.removeEventListener(evt.mouseup, element.mouseupHandler);
                    }
                    
                    //element.clickHandler = function () {
                    //    //console.log('-webkit-overflow-scrolling: touch;',   element.scrollContainer.scrollTop);
                    //    element.style.webkitOverflowScrolling = 'initial';
                    //    //console.log('-webkit-overflow-scrolling: initial;', element.scrollContainer.scrollTop);
                    //    element.scrollContainer.scrollTop = parseInt(this.getAttribute('data-target-offset'), 10);
                    //    //console.log('-webkit-overflow-scrolling: initial;', element.scrollContainer.scrollTop);
                    //    element.style.webkitOverflowScrolling = 'touch';
                    
                    element.clickHandler = function () {
                        //console.log('-webkit-overflow-scrolling: touch;',   element.scrollContainer.scrollTop);
                        element.style.webkitOverflowScrolling = 'initial';
                        //console.log('-webkit-overflow-scrolling: initial;', element.scrollContainer.scrollTop);
                        element.scrollContainer.scrollTop = parseInt(this.getAttribute('data-target-offset'), 10);
                        //console.log('-webkit-overflow-scrolling: initial;', element.scrollContainer.scrollTop);
                        element.style.webkitOverflowScrolling = 'touch';
                        
                        //alert('Here I am');
                        
                        //element.scrollContainer.className = element.scrollContainer.className;
                        //element.scrollContainer.style.outline = '1px solid #000000';
                        //element.scrollContainer.style.outline = '';
                        //console.log('-webkit-overflow-scrolling: touch;',   element.scrollContainer.scrollTop);
                        //console.log('test');
                    };
                    element.mousedownHandler = function (event) { // event
                        window.addEventListener(evt.mousemove, element.mousemoveHandler);
                        if (event.target.classList.contains('skipper') && evt.touchDevice) {
                            element.style.webkitOverflowScrolling = 'initial';
                        }
                        //element.mousemoveHandler(event);
                    };
                    element.mousemoveHandler = function (event) {
                        var jsnMousePosition, targetElement;
                        
                        if (event.which !== 0 || evt.touchDevice) {
                            jsnMousePosition = GS.mousePosition(event);
                            targetElement = document.elementFromPoint(jsnMousePosition.left, jsnMousePosition.top);
                            
                            if (targetElement) {
                                if (targetElement.nodeName === 'SPAN') {
                                    targetElement = targetElement.parentNode;
                                }
                                
                                //console.log(targetElement, jsnMousePosition);
                                
                                if (targetElement.classList.contains('skipper')) {
                                    element.style.webkitOverflowScrolling = 'initial';
                                    event.preventDefault();
                                    element.scrollContainer.scrollTop = parseInt(targetElement.getAttribute('data-target-offset'), 10);
                                }
                            }
                        } else {
                            window.removeEventListener(evt.mousemove, element.mousemoveHandler);
                        }
                    };
                    element.mouseupHandler = function () {
                        element.style.webkitOverflowScrolling = 'touch';
                        window.removeEventListener(evt.mousemove, element.mousemoveHandler);
                    };
                    
                    //window
                    element.addEventListener(evt.mousedown, element.mousedownHandler);
                    //window
                    element.addEventListener(evt.mouseup, element.mouseupHandler);
                    
                    for (i = 0, len = arrSkippers.length; i < len; i += 1) {
                        arrSkippers[i].addEventListener('click', element.clickHandler);
                    }
                    //}
                }
            },
            
            
            // #################################################################
            // ########################### UTILITIES ###########################
            // #################################################################
            
            refreshDividingPoints: function () {
                var tbodyElement, arrElement, arrLetter, dividerElement, strLetter, intOffset, numColumns, theadElement, i, len;
                
                tbodyElement = xtag.queryChildren(this.tableElement, 'tbody')[0];
                
                arrElement = xtag.queryChildren(tbodyElement, 'tr.divider');
                
                for (i = 0, len = arrElement.length; i < len; i += 1) {
                    tbodyElement.removeChild(arrElement[i]);
                }
                
                this.arrDividingPoints = [];
                
                arrElement = xtag.queryChildren(tbodyElement, 'tr');
                
                if (arrElement.length > 0) {
                    numColumns = arrElement[0].children.length;
                    
                    
                    //console.log(theadElement, (theadElement ? theadElement.offsetHeight : 0));
                    theadElement = xtag.queryChildren(this.tableElement, 'thead')[0];
                    intOffset = (theadElement ? theadElement.offsetHeight : 0);
                    
                    for (i = 0, len = arrElement.length, arrLetter = []; i < len; i += 1) {
                        strLetter = xtag.queryChildren(arrElement[i], 'td')[0].textContent.substring(0, 1).toUpperCase();
                        
                        if (arrLetter.indexOf(strLetter) === -1) {
                            this.arrDividingPoints.push({
                                'letter': strLetter,
                                'offset': intOffset
                            });
                            
                            if (this.hasAttribute('letter-dividers')) {
                                dividerElement = document.createElement('tr');
                                dividerElement.classList.add('divider');
                                dividerElement.setAttribute('gs-dynamic', '');
                                dividerElement.setAttribute('data-target-offset', intOffset);
                                //if (!this.hasAttribute('letter-dividers')) { <== messed with odd and even record colors when letter-scrollbar but not letter-dividers -michael
                                //    dividerElement.setAttribute('hidden', '');
                                //}
                                
                                dividerElement.innerHTML = '<td colspan="' + numColumns + '" gs-dynamic>' + encodeHTML(strLetter) + '</td>';
                                
                                tbodyElement.insertBefore(dividerElement, arrElement[i]);
                                
                                intOffset += dividerElement.offsetHeight;
                            }
                            
                            arrLetter.push(strLetter);
                        }
                        
                        intOffset += arrElement[i].offsetHeight;
                    }
                }
            },
            
            syncView: function () {
                var element = this, tbodyElement, i, len, arrElements, clickHandler, mousedownHandler, mouseoutHandler, mouseoverHandler;
                
                element.removeEventListener('keydown', handleKeyDown);
                element.addEventListener('keydown', handleKeyDown);
                
                element.removeEventListener('focusout', handleFocusout);
                element.addEventListener('focusout', handleFocusout);
                
                element.innerHTML = '';
                
                element.scrollContainer = document.createElement('div');
                element.scrollContainer.setAttribute('gs-dynamic', '');
                element.scrollContainer.classList.add('root');
                element.scrollContainer.classList.add('scroll-container');
                element.scrollContainer.appendChild(element.tableElement);
                
                element.appendChild(element.scrollContainer);
                tbodyElement = xtag.queryChildren(element.tableElement, 'tbody')[0];
                
                // add dividers
                if (element.hasAttribute('letter-dividers') || element.hasAttribute('letter-scrollbar')) {
                    element.refreshDividingPoints();
                    
                    // if we have the letter-scrollbar attribute: add the letter scrollbar
                    if (element.hasAttribute('letter-scrollbar')) {
                        element.letterScrollbarHandler();
                    }
                }
                
                // this fixes the fact that this function was clearing the selection
                if (this.getAttribute('value')) {
                    selectRecord(this, this.getAttribute('value'));
                    this.scrollToSelectedRecord();
                }
                
                // click handling code
                // get list of record elements
                arrElements = xtag.toArray(tbodyElement.children);
                
                // create click event function
                clickHandler = function (event) {
                    this.classList.remove('down');
                    selectRecord(element, this, true);
                };
                
                // add click event with click event function to all record elements that are not dividers
                for (i = 0, len = arrElements.length; i < len; i += 1) {
                    if (!arrElements[i].classList.contains('divider')) {
                        arrElements[i].addEventListener('click', clickHandler);
                    }
                }
                
                // if we are not on a touch device: hover and down events
                if (!evt.touchDevice) {
                    mousedownHandler = function () {
                        this.classList.add('down');
                    };
                    mouseoutHandler = function () {
                        this.classList.remove('down');
                        this.classList.remove('hover');
                    };
                    mouseoverHandler = function () {
                        this.classList.remove('down');
                        this.classList.add('hover');
                    };
                
                    // add click event with click event function to all record elements that are not dividers
                    for (i = 0, len = arrElements.length; i < len; i += 1) {
                        if (!arrElements[i].classList.contains('divider')) {
                            arrElements[i].addEventListener(evt.mousedown, mousedownHandler);
                            arrElements[i].addEventListener(evt.mouseout, mouseoutHandler);
                            arrElements[i].addEventListener(evt.mouseover, mouseoverHandler);
                        }
                    }
                }
                
                //tbodyElement.addEventListener('click', function (event) {
                //    var parentRecord = GS.findParentTag(event.target, 'TR');
                //    
                //    if (parentRecord && !parentRecord.classList.contains('divider')) {
                //        selectRecord(element, parentRecord, true);
                //    }
                //});
            },
            
            triggerChange: function () {
                xtag.fireEvent(this, 'change', {
                    bubbles: true,
                    cancelable: true
                });
            }
        }
    });
});