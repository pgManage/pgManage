//jslint white:true miltivar:true
window.addEventListener('design-register-element', function () {
    'use strict';
    
    registerDesignSnippet('<gs-form>', '<gs-form>', 'gs-form src="${1:test.tpeople}">\n' +
                                                    '    <template>\n' +
                                                    '        ${2}\n' +
                                                    '    </template>\n' +
                                                    '</gs-form>');
    
    designRegisterElement('gs-form', '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-form.html');
    
    window.designElementProperty_GSFORM = function (selectedElement) {
        addProp('Source', true, '<gs-memo class="target" value="' + encodeHTML(decodeURIComponent(selectedElement.getAttribute('src') ||
                                                                                        selectedElement.getAttribute('source') || '')) + '" mini></gs-memo>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'src', encodeURIComponent(this.value));
        });
        
        addProp('Columns', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('cols') || '') + '" mini></gs-text>',
                function () {
            return setOrRemoveTextAttribute(selectedElement, 'cols', this.value);
        });
        
        addProp('Where', true, '<gs-text class="target" value="' + encodeHTML(decodeURIComponent(selectedElement.getAttribute('where') || '')) + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'where', encodeURIComponent(this.value));
        });
        
        addProp('Column In Querystring', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('qs') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'qs', this.value, false);
        });
        
        addProp('Lock', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('lock') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'lock', this.value);
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
        
        addProp('Save&nbsp;While&nbsp;Typing', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('save-while-typing')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'save-while-typing', (this.value === 'true'), true);
        });
        
        addProp('Suppress<br />"No&nbsp;Record&nbsp;Found"<br />Error', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suppress-no-record-found')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suppress-no-record-found', (this.value === 'true'), true);
        });
        
        // TITLE attribute
        addProp('Title', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('title') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'title', this.value);
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
        
        addProp('Refresh On Querystring Columns', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('refresh-on-querystring-values') || '') + '" mini></gs-text>', function () {
            this.removeAttribute('refresh-on-querystring-change');
            return setOrRemoveTextAttribute(selectedElement, 'refresh-on-querystring-values', this.value);
        });
        
        addProp('Refresh On Querystring Change', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('refresh-on-querystring-change')) + '" mini></gs-checkbox>', function () {
            this.removeAttribute('refresh-on-querystring-values');
            return setOrRemoveBooleanAttribute(selectedElement, 'refresh-on-querystring-change', this.value === 'true', true);
        });
        
        addFlexContainerProps(selectedElement);
        addFlexProps(selectedElement);
    };
});

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    
    function triggerAfterUpdate(element) {
        GS.triggerEvent(element, 'after_update');
        if (element.hasAttribute('afterupdate')) {
            new Function(element.getAttribute('afterupdate')).apply(element);
        }
    }
    
    // ##################################################################
    // ######################## UPDATE FUNCTIONS ########################
    // ##################################################################
    
    function emergencyUpdate(element) {
        if (element.currentSaveAjax) {
            element.currentSaveAjax.abort();
        }
        element.bolCurrentlySaving = false;
        updateDataWithoutTemplate(element, false);
    }
    
    function updateData(element, updateElement, strColumn, newValue) {
        var data, parentRecord, strID, strHash
          , srcParts = GS.templateWithQuerystring(element.getAttribute('src')).split('.')
          , strSchema = srcParts[0]
          , strObject = srcParts[1]
          , strReturnCols = element.arrColumns.join('\t')
          , strHashCols = element.lockColumn
          , updateFrameData, strRoles, strColumns, arrTotalRecords = [];
        
        parentRecord = GS.findParentElement(updateElement, '.form-record');
        
        strID = parentRecord.getAttribute('data-id');
        strHash = CryptoJS.MD5(parentRecord.getAttribute('data-' + element.lockColumn)).toString();
        
        strRoles   = 'pk\thash\tset';
        strColumns = 'id\thash\t' + GS.encodeForTabDelimited(strColumn);
        updateFrameData = strID + '\t' + strHash + '\t' + GS.encodeForTabDelimited(newValue);
        
        updateFrameData = (strRoles + '\n' + strColumns + '\n' + updateFrameData);
        GS.triggerEvent(element, 'before_update');
        
        GS.requestUpdateFromSocket(
            GS.envSocket, strSchema, strObject
          , strReturnCols, strHashCols, updateFrameData
            
          , function (data, error, transactionID) {
                if (error) {
                    getData(element);
                    GS.removeLoader(element);
                    GS.webSocketErrorDialog(data);
                }
            }
          , function (data, error, transactionID, commitFunction, rollbackFunction) {
                GS.removeLoader(element);
                
                if (!error) {
                    if (data === 'TRANSACTION COMPLETED') {
                        commitFunction();
                    } else {
                        var arrRecords, arrCells, i, len, cell_i, cell_len;
                        
                        arrRecords = GS.trim(data, '\n').split('\n');
                        
                        for (i = 0, len = arrRecords.length; i < len; i += 1) {
                            arrCells = arrRecords[i].split('\t');
                            
                            for (cell_i = 0, cell_len = arrCells.length; cell_i < cell_len; cell_i += 1) {
                                arrCells[cell_i] = arrCells[cell_i] === '\\N' ? null : GS.decodeFromTabDelimited(arrCells[cell_i]);
                            }
                            
                            arrTotalRecords.push(arrCells);
                        }
                    }
                    
                } else {
                    rollbackFunction();
                    getData(element);
                    GS.webSocketErrorDialog(data);
                }
            }
          , function (strAnswer, data, error) {
                GS.removeLoader(element);
                
                if (!error) {
                    if (strAnswer === 'COMMIT') {
                        var idIndex, i, len;
                        
                        idIndex = element.lastSuccessData.arr_column.indexOf('id');
                        
                        for (i = 0, len = element.lastSuccessData.dat.length; i < len; i += 1) {
                            if (String(element.lastSuccessData.dat[i][idIndex]) === strID) {
                                element.lastSuccessData.dat[i] = arrTotalRecords[0];
                                break;
                            }
                        }
                        
                        triggerAfterUpdate(element);
                        handleData(element, element.lastSuccessData);
                        
                        GS.triggerEvent(element, 'after_update');
                    } else {
                        getData(element);
                    }
                } else {
                    getData(element);
                    GS.webSocketErrorDialog(data);
                }
            }
        );
    }
    
    function updateDataWithoutTemplate(element, bolErrorHandling) {
        if (element.bolCurrentlySaving === false && !element.bolErrorOpen) {
            var data, parentRecord, strID, strHash
              , srcParts = GS.templateWithQuerystring(element.getAttribute('src')).split('.')
              , strSchema = srcParts[0]
              , strObject = srcParts[1]
              , strReturnCols = element.arrColumns.join('\t')
              , strHashCols = element.lockColumn
              , updateFrameData, strRoles, strColumns, arrTotalRecords = [], functionUpdateRecord, col_key, key, strColumn, newValue, idIndex, i, len;
            
            functionUpdateRecord = function (strID, strColumn, recordIndex, strParameters) {
                var strWhere, strChangeStamp, strValue;
                
                element.bolCurrentlySaving = true;
                element.jsnUpdate[strID][strColumn] = undefined;
                
                // run ajax
                removeMessage(element, 'waiting');
                addMessage(element, 'saving');
                element.state = 'saving';
                
                strWhere        = GS.qryGetVal(strParameters, 'where');
                strColumn       = GS.qryGetVal(strParameters, 'column');
                strValue        = GS.qryGetVal(strParameters, 'value');
                
                strID           = GS.qryGetVal(strWhere,      'id');
                strChangeStamp  = GS.qryGetVal(strWhere,      element.lockColumn);
                
                strHash = CryptoJS.MD5(strChangeStamp).toString();
                
                //parentRecord = GS.findParentElement(updateElement, '.form-record');
                
                strRoles   = 'pk\thash\tset';
                strColumns = 'id\thash\t' + GS.encodeForTabDelimited(strColumn);
                updateFrameData = strID + '\t' + strHash + '\t' + GS.encodeForTabDelimited(strValue);
                
                updateFrameData = (strRoles + '\n' + strColumns + '\n' + updateFrameData);
                
                
                
                //console.log(strParameters);
                //console.log(updateFrameData);
                //console.log(strSchema, strObject, strReturnCols, strHashCols);
                
                GS.requestUpdateFromSocket(
                    GS.envSocket, strSchema, strObject
                  , strReturnCols, strHashCols, updateFrameData
                    
                  , function (data, error, transactionID) {
                        if (error) {
                            getData(element);
                            GS.webSocketErrorDialog(data);
                        }
                    }
                  , function (data, error, transactionID, commitFunction, rollbackFunction) {
                        if (!error) {
                            if (data === 'TRANSACTION COMPLETED') {
                                commitFunction();
                            } else {
                                var arrRecords, arrCells, i, len, cell_i, cell_len;
                                
                                arrRecords = GS.trim(data, '\n').split('\n');
                                
                                for (i = 0, len = arrRecords.length; i < len; i += 1) {
                                    arrCells = arrRecords[i].split('\t');
                                    
                                    for (cell_i = 0, cell_len = arrCells.length; cell_i < cell_len; cell_i += 1) {
                                        arrCells[cell_i] = arrCells[cell_i] === '\\N' ? null : GS.decodeFromTabDelimited(arrCells[cell_i]);
                                    }
                                    
                                    arrTotalRecords.push(arrCells);
                                }
                            }
                            
                        } else {
                            rollbackFunction();
                            getData(element);
                            GS.webSocketErrorDialog(data);
                        }
                    }
                  , function (strAnswer, data, error) {
                        var col_key, key, bolSaveWaiting;
                        removeMessage(element, 'saving');
                        element.state = 'saved';
                        
                        GS.removeLoader(element);
                        
                        if (!error) {
                            if (strAnswer === 'COMMIT') {
                                element.lastSuccessData.dat[recordIndex] = arrTotalRecords[0];
                                element.bolCurrentlySaving = false;
                                
                                // if there is another save in the pipeline: bolSaveWaiting = true
                                for (key in element.jsnUpdate) {
                                    for (col_key in element.jsnUpdate[key]) {
                                        if (element.jsnUpdate[key][col_key] !== undefined) {
                                            bolSaveWaiting = true;
                                            break;
                                        }
                                    }
                                }
                                
                                // if there is a save waiting: update again
                                if (bolSaveWaiting) {
                                    updateDataWithoutTemplate(element);
                                    
                                } else {
                                    triggerAfterUpdate(element);
                                }
                            } else {
                                getData(element);
                            }
                        } else {
                            GS.webSocketErrorDialog(data);
                        }
                    }
                );
            };
            
            // loop through the jsnUpdate variable and make one update for every record that needs an update
            console.log(JSON.stringify(element.jsnUpdate));
            
            for (key in element.jsnUpdate) {
                for (col_key in element.jsnUpdate[key]) {
                    if (element.jsnUpdate[key][col_key] !== undefined) {
                        strID = key;
                        strColumn = col_key;
                        newValue = element.jsnUpdate[key][col_key];
                        idIndex = element.lastSuccessData.arr_column.indexOf('id');
                        
                        for (i = 0, len = element.lastSuccessData.dat.length; i < len; i += 1) {
                            if (String(element.lastSuccessData.dat[i][idIndex]) === strID) {
                                functionUpdateRecord(strID, strColumn, i,
                                            'where=' + encodeURIComponent(
                                                'id=' + strID +
                                                '&' + element.lockColumn + '=' + GS.envGetCell(element.lastSuccessData, i, element.lockColumn)
                                            ) +
                                            '&column=' + strColumn +
                                            '&value=' +  encodeURIComponent(newValue));
                                
                                break;
                            }
                        }
                        
                        break;
                    }
                }
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
    function getData(element) { //bolClearPrevious
        var strSrc     = GS.templateWithQuerystring(element.getAttribute('src'))
          , srcParts   = strSrc[0] === '(' ? [strSrc, ''] : strSrc.split('.')
          , strSchema  = srcParts[0]
          , strObject  = srcParts[1]
          , strColumns = GS.templateWithQuerystring(element.getAttribute('cols') || '*').split(',').join('\t')
          , strWhere   = GS.templateWithQuerystring(element.getAttribute('where') || '')
          , strOrd     = GS.templateWithQuerystring(element.getAttribute('ord') || '')
          , strLimit   = GS.templateWithQuerystring(element.getAttribute('limit') || '1')
          , strOffset  = GS.templateWithQuerystring(element.getAttribute('offset') || '')
          , response_i = 0, response_len = 0, arrTotalRecords = [];
        
        GS.triggerEvent(element, 'before_select');
        GS.requestSelectFromSocket(GS.envSocket, strSchema, strObject, strColumns
                                 , strWhere, strOrd, strLimit, strOffset
                                 , function (data, error) {
            var arrRecords, arrCells, i, len, cell_i, cell_len;
            
            if (!error) {
                if (data.strMessage !== 'TRANSACTION COMPLETED') {
                    arrRecords = GS.trim(data.strMessage, '\n').split('\n');
                    
                    for (i = 0, len = arrRecords.length; i < len; i += 1) {
                        arrCells = arrRecords[i].split('\t');
                        
                        for (cell_i = 0, cell_len = arrCells.length; cell_i < cell_len; cell_i += 1) {
                            arrCells[cell_i] = arrCells[cell_i] === '\\N' ? null : GS.decodeFromTabDelimited(arrCells[cell_i]);
                        }
                        
                        arrTotalRecords.push(arrCells);
                    }
                } else {
                    element.arrColumns = data.arrColumnNames;
                    
                    handleData(element, {
                        "arr_column": data.arrColumnNames
                      , "dat": arrTotalRecords
                      , "row_count": arrTotalRecords.length
                    }, '', 'load');
                }
            } else {
                GS.webSocketErrorDialog(data);
            }
        });
    }
    
    // handles data result from method function: getData 
    //      success:  template
    //      error:    add error classes
    function handleData(element, data, error, strAction, failCallback) {
        var arrElements, i, len, arrHeaders = [], intColumnElementFocusNumber, jsnSelection, matchElement,
            templateElement = document.createElement('template'), focusTimerID, focusToElement, timer_i;
        
        // clear any old error status
        element.classList.remove('error');
        
        if (!error && data.dat.length === 0 && !element.hasAttribute('limit') && !element.hasAttribute('suppress-no-record-found')) {
            templateElement.setAttribute('data-theme', 'error');
            templateElement.innerHTML = ml(function () {/*
                <gs-page>
                    <gs-header><center><h3>Error</h3></center></gs-header>
                    <gs-body padded>
                        <center>No record found</center>
                    </gs-body>
                    <gs-footer>
                        <gs-grid>
                            <gs-block><gs-button dialogclose>Cancel</gs-button></gs-block>
                            <gs-block><gs-button dialogclose listen-for-return bg-primary>Try Again</gs-button></gs-block>
                        </gs-grid>
                    </gs-footer>
                </gs-page>
            */});
            
            GS.openDialog(templateElement, '', function (event, strAnswer) {
                if (strAnswer === 'Try Again') {
                    element.refresh();
                }
            });
        }
        
        // if there was no error
        if (!error) {
            element.error = false;
            
            // save success data
            element.lastSuccessData = data;
            
            if (GS.findParentElement(document.activeElement, 'gs-form') === element) {
                //console.log('Hey');
                arrElements = xtag.query(element, '[column]');
                matchElement = GS.findParentElement(document.activeElement, '[column]');
                
                if (document.activeElement.nodeName === 'INPUT' || document.activeElement.nodeName === 'TEXTAREA') {
                    jsnSelection = GS.getInputSelection(document.activeElement);
                }
                
                if (matchElement) {
                    for (i = 0, len = arrElements.length; i < len; i += 1) {
                        if (arrElements[i] === matchElement) {
                            intColumnElementFocusNumber = i;
                            break;
                        }
                    }
                }
            }
            
            element.innerHTML = dataTemplateRecords(element, data);
            
            // if template is not native: handle templates inside the form
            if (shimmed.HTMLTemplateElement) {
                HTMLTemplateElement.bootstrap(element);
            }
            
            // handle autofocus
            arrElements = xtag.query(element, '[autofocus]');
            
            if (arrElements.length > 0 && !evt.touchDevice) {
                arrElements[0].focus();
                
                if (arrElements.length > 1) {
                    console.warn('dialog Warning: Too many [autofocus] elements, defaulting to the first one. Please have only one [autofocus] element per form.');
                }
            }
            
            // if there is a intColumnElementFocusNumber: restore focus
            if (intColumnElementFocusNumber) {
                arrElements = xtag.query(element, '[column]');
                
                //console.log(intColumnElementFocusNumber, jsnSelection);
                //
                //console.log('arrElements: ', arrElements);
                //console.log('intColumnElementFocusNumber: ', intColumnElementFocusNumber);
                //console.log('element: ', arrElements[intColumnElementFocusNumber]);
                //console.log('jsnSelection: ', jsnSelection);
                //
                //console.log('element upgrade: ', arrElements[intColumnElementFocusNumber].__upgraded__);
                
                //console.log('1***');
                if (arrElements.length > intColumnElementFocusNumber) {
                    //console.log('2***', document.activeElement);
                    focusToElement = arrElements[intColumnElementFocusNumber];
                    
                    // if element registration is not shimmed, we can just focus into the target element
                    if (shimmed.registerElement === false) {
                        focusToElement.focus();
                        if (jsnSelection) {
                            GS.setInputSelection(document.activeElement, jsnSelection.start, jsnSelection.end);
                        }
                        
                    // else, we have to check on a loop to see if the element has been upgraded,
                    //      the reason I need to use a loop here is because there is no event for
                    //      when an element is upgraded (if there was then 1000 custom elements
                    //      would emit 1000 events, which is a lot and we don't want to bog the
                    //      browser down)
                    } else {
                        timer_i = 0;
                        focusTimerID = setInterval(function () {
                            if (focusToElement.__upgraded__ || timer_i >= 10) {
                                clearTimeout(focusTimerID);
                            }
                            if (focusToElement.__upgraded__) {
                                focusToElement.focus();
                                if (jsnSelection) {
                                    GS.setInputSelection(document.activeElement, jsnSelection.start, jsnSelection.end);
                                }
                            }
                            timer_i += 1;
                        }, 5);
                    }
                }
            }
            
            //console.log('current element', document.activeElement);
            
            // trigger after_select
            GS.triggerEvent(element, 'after_select');
            //console.log(element, 'after_select');
            
        // else there was an error: add error class, title attribute
        } else {
            element.error = true;
            element.classList.add('error');
            
            element.innerHTML = 'This form encountered an error.'
            
            //GS.ajaxErrorDialog(event.detail.response);
            GS.ajaxErrorDialog(data);
        }
    }
    
    
    function dataTemplateRecords(element, data) {
        var jsnTemplate, strRet;
        
        jsnTemplate = GS.templateHideSubTemplates(element.templateHTML);
        
        //console.log(jsnTemplate.templateHTML);
        
        strRet = GS.templateWithEnvelopeData('<div class="form-record" ' + (data.dat.length === 1 ? 'style="height: 100%;" ' : '') +
                                                'data-id="{{! row.id }}" data-' + element.lockColumn + '="{{! row.' + element.lockColumn + ' }}" gs-dynamic>' +
                                                jsnTemplate.templateHTML +
                                            '</div>',
                                            data);
        
        strRet = GS.templateShowSubTemplates(strRet, jsnTemplate);
        
        //console.log(strRet);
        
        return strRet;
    }
    
    
    // #################################################################
    // ########################### UTILITIES ###########################
    // #################################################################
    
    function addMessage(element, strMessageName) {
        if (strMessageName === 'saving') {
            if (element.savingMessage) {
                removeMessage(element, 'saving');
            }
            element.savingMessage = document.createElement('div');
            element.savingMessage.classList.add('message');
            element.savingMessage.innerHTML = 'Saving...';
            
            element.appendChild(element.savingMessage);
            
        } else if (strMessageName === 'waiting') {
            if (element.waitingMessage) {
                removeMessage(element, 'waiting');
            }
            element.waitingMessage = document.createElement('div');
            element.waitingMessage.classList.add('message');
            element.waitingMessage.innerHTML = 'Waiting<br />to save...';
            
            element.appendChild(element.waitingMessage);
        }
    }
    
    function removeMessage(element, strMessageName) {
        if (strMessageName === 'saving' && element.savingMessage) {
            element.removeChild(element.savingMessage);
            element.savingMessage = undefined;
            
        } else if (strMessageName === 'waiting' && element.waitingMessage) {
            element.removeChild(element.waitingMessage);
            element.waitingMessage = undefined;
        }
    }
    
    function columnParentsUntilForm(form, element) {
        var intColumnParents = 0, currentElement = element, maxLoops = 50, i = 0;
        
        while (currentElement.parentNode !== form && currentElement.parentNode && i < maxLoops) {
            if (currentElement.parentNode.hasAttribute('column') === true //If something with a column attribute
                || currentElement.parentNode.hasAttribute('src') === true) { //or something with a src attribute
                intColumnParents += 1;
            }
            
            currentElement = currentElement.parentNode;
            i += 1;
        }
        
        return intColumnParents;
    }
    
    //function pushReplacePopHandler(element) {
    //    var i, len, arrPopKeys, bolRefresh = false, currentValue, strQueryString = GS.getQueryString(), strQSCol = element.getAttribute('qs');
    //    
    //    if (strQSCol && GS.qryGetKeys(strQueryString).indexOf(strQSCol) > -1) {
    //        element.setAttribute('where', 'id=' + GS.qryGetVal(strQueryString, strQSCol));
    //        bolRefresh = true;
    //        
    //    } else if (element.hasAttribute('refresh-on-querystring-values')) {
    //        arrPopKeys = element.getAttribute('refresh-on-querystring-values').split(/\s*,\s*/gim);
    //        
    //        for (i = 0, len = arrPopKeys.length; i < len; i += 1) {
    //            currentValue = GS.qryGetVal(strQueryString, arrPopKeys[i]);
    //            
    //            if (element.popValues[arrPopKeys[i]] !== currentValue) {
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
                    console.log(element.getAttribute('value'));
                    if (strQSValue !== '' || !element.getAttribute('value')) {
                        element.setAttribute('where', 'id=' + (isNaN(strQSValue) ? '$WHEREQuoTE$' + strQSValue + '$WHEREQuoTE$' : strQSValue));
                        bolRefresh = true;
                    }
                } else {
                    element.setAttribute('where', 'id=' + (isNaN(strQSValue) ? '$WHEREQuoTE$' + strQSValue + '$WHEREQuoTE$' : strQSValue));
                    bolRefresh = true;
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
        } else {
            if (element.hasAttribute('refresh-on-querystring-values')) {
                arrPopKeys = element.getAttribute('refresh-on-querystring-values').split(/\s*,\s*/gim);
                
                for (i = 0, len = arrPopKeys.length; i < len; i += 1) {
                    element.popValues[arrPopKeys[i]] = GS.qryGetVal(strQS, arrPopKeys[i]);
                }
            }
            
            if (GS.getQueryString() || element.hasAttribute('refresh-on-querystring-change') || element.hasAttribute('src')) {
                bolRefresh = true;
            }
        }
        
        if (bolRefresh && element.hasAttribute('src')) {
            getData(element);
        } else if (bolRefresh && !element.hasAttribute('src')) {
            console.warn('gs-combo Warning: element has "refresh-on-querystring-values" or "refresh-on-querystring-change", but no "src".', element);
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
            if (element.children.length === 0) {
                throw 'GS-Form Error: No template provided';
            }
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                element.internal = {};
                saveDefaultAttributes(element);
                
                var //templateElement = document.createElement('template'),
                    //templateElementSubTemplateSafe = document.createElement('template'),
                    firstChildElement = element.children[0],
                    //arrElements, i, len, arrColumnElement, arrTemplates,
                    strQueryString = GS.getQueryString(), changeHandler;
                
                // if this form has the "save-while-typing" attribute
                if (element.hasAttribute('save-while-typing')) {
                    GS.addBeforeUnloadEvent(function () {
                        if (element.bolCurrentlySaving || element.saveTimerID) {
                            return 'The page has not finished saving.';
                        }
                    });
                } else {
                    // this prevents the issue where you type in a change but then unload
                    //      the page without causing a change event to fire, which means you lose your change
                    GS.addBeforeUnloadEvent(function () {
                        document.activeElement.blur();
                    });
                }
                
                // lock attribute and defaulting
                element.lockColumn = element.getAttribute('lock') || 'change_stamp';
                
                // if the first child is a template element: save its HTML
                if (firstChildElement.nodeName === 'TEMPLATE') {
                    element.templateHTML = firstChildElement.innerHTML;
                    
                // else: save the innerHTML of the form and send a warning
                } else {
                    console.warn('Warning: gs-form is now built to use a template element. ' +
                                 'Please use a template element to contain the template for this form. ' + // this warning was added: March 12th 2015
                                 'A fix has been included so that it is not necessary to use the template element, but that code may be removed at a future date.');
                    
                    element.templateHTML = element.innerHTML;
                }
                
                // if there is no HTML: throw an error
                if (!element.templateHTML.trim()) { throw 'GS-FORM error: no template HTML.'; }
                
                if (element.templateHTML.indexOf('&gt;') > -1 || element.templateHTML.indexOf('&lt;') > -1) {
                    console.warn('GS-FORM WARNING: &gt; or &lt; detected in record template, this can have undesired effects on doT.js. Please use gt(x,y), gte(x,y), lt(x,y), or lte(x,y) to silence this warning.');
                }
                
                // add a doT.js coded "value" attribute to any element with a "column" attribute but no "value" attribute
                element.templateHTML = GS.templateColumnToValue(element.templateHTML);
                
                // handle "qs" attribute
                if (element.getAttribute('qs') ||
                        element.getAttribute('refresh-on-querystring-values') ||
                        element.hasAttribute('refresh-on-querystring-change')) {
                    element.popValues = {};
                    
                    //if (element.getAttribute('qs')) {
                    //    if (GS.qryGetVal(strQueryString, element.getAttribute('qs'))) {
                    //        element.setAttribute('where', 'id=' + GS.qryGetVal(strQueryString, element.getAttribute('qs')));
                    //    } else {
                    //        element.setAttribute('where', 'false');
                    //    }
                    //}
                    
                    //if (GS.getQueryString() || element.hasAttribute('refresh-on-querystring-change')) {
                    pushReplacePopHandler(element);
                    //}
                    
                    window.addEventListener('pushstate',    function () { pushReplacePopHandler(element); });
                    window.addEventListener('replacestate', function () { pushReplacePopHandler(element); });
                    window.addEventListener('popstate',     function () { pushReplacePopHandler(element); });
                } else {
                    getData(element);
                }
                
                element.addEventListener('keydown', function (event) {
                    var intKeyCode = event.which || event.keyCode, jsnSelection;
                    
                    if (document.activeElement.nodeName === 'INPUT' || document.activeElement.nodeName === 'TEXTAREA') {
                        jsnSelection = GS.getInputSelection(event.target);
                    }
                    
                    if ((intKeyCode === 37 && (!jsnSelection || jsnSelection.start === 0)) ||
                        (intKeyCode === 39 && (!jsnSelection || jsnSelection.end === event.target.value.length))) {
                        var focusToElement, i, len, arrElementsFocusable, currentElement;
                        //Left
                        if (intKeyCode === 37 && (!jsnSelection || jsnSelection.start === 0)) {
                            arrElementsFocusable = xtag.query(document, 'input:not([disabled]), ' +
                                'select:not([disabled]), memo:not([disabled]), button:not([disabled]), ' +
                                '[tabindex]:not([disabled]), [column]');
                            
                            for (i = 0,len = arrElementsFocusable.length;i < len;i++) {
                                currentElement = arrElementsFocusable[i];
                                //console.log(currentElement === event.target, currentElement, event.target);
                                if (currentElement === event.target ||
                                    ((event.target.nodeName === 'INPUT' || event.target.nodeName === 'TEXTAREA') &&
                                    currentElement === event.target.parentNode)) {
                                    if (i === 0) {
                                        focusToElement = currentElement;
                                    } else {
                                        focusToElement = arrElementsFocusable[i - 1];
                                    }
                                    break;
                                }
                            }
                            //console.log(focusToElement);
                        //Right
                        } else if (intKeyCode === 39 && (!jsnSelection || jsnSelection.end === event.target.value.length)) {
                            arrElementsFocusable = xtag.query(document, 'input:not([disabled]), ' +
                                'select:not([disabled]), memo:not([disabled]), button:not([disabled]), ' +
                                '[tabindex]:not([disabled]), [column]');
                            
                            for (i = 0,len = arrElementsFocusable.length;i < len;i++) {
                                currentElement = arrElementsFocusable[i];
                                if (currentElement === event.target) {
                                    if (i === len) {
                                        focusToElement = currentElement;
                                    } else {
                                        focusToElement = arrElementsFocusable[i + 1];
                                    }
                                    break;
                                }
                            }
                        }
                        
                        //console.log('focusable', GS.isElementFocusable(focusToElement));
                        if (focusToElement && GS.isElementFocusable(focusToElement)) {
                            //console.log('focus');
                            event.preventDefault();
                            
                            focusToElement.focus();
                            
                            if (document.activeElement.nodeName === 'INPUT' || document.activeElement.nodeName === 'TEXTAREA') {
                                GS.setInputSelection(document.activeElement, 0, document.activeElement.value.length);
                            }
                        }
                    }
                });
                
                // bind save code
                if (element.hasAttribute('save-while-typing')) {
                    element.bolCurrentlySaving = false;
                    element.jsnUpdate = {};
                    element.state = 'saved';
                    //element.currentSaveAjax = false;
                    
                    // possible states:
                    //      'saved'
                    //      'waiting to save'
                    //      'saving'
                    
                    // JSON object for holding columns to update
                    // on keydown, keyup, change add to JSON object
                    // keep updating until all columns have been saved (undefined marks an empty column)
                    
                    changeHandler = function (event) {
                        var intKeyCode = event.which || event.keyCode, newValue,
                            targetColumnParent = GS.findParentElement(event.target, '[column]'),
                            parentRecordElement, strID;
                        
                        //console.log(event.target, targetColumnParent);
                        
                        if (targetColumnParent.getAttribute('column') && columnParentsUntilForm(element, targetColumnParent) === 0 &&
                            element.column(targetColumnParent.getAttribute('column')) !== targetColumnParent.value) {
                            
                            //event.stopPropagation();
                            if (element.saveTimerID) {
                                clearTimeout(element.saveTimerID);
                                element.saveTimerID = undefined;
                            }
                            
                            addMessage(element, 'waiting');
                            element.state = 'waiting to save';
                            
                            if (targetColumnParent.value !== null && targetColumnParent.value !== null) {
                                newValue = targetColumnParent.value;
                            } else {
                                newValue = targetColumnParent.checked;
                            }
                            
                            parentRecordElement = GS.findParentElement(targetColumnParent, '.form-record[data-id]');
                            strID = parentRecordElement.getAttribute('data-id');
                            
                            if (!element.jsnUpdate[strID]) {
                                element.jsnUpdate[strID] = element.jsnUpdate[strID] = {};
                            }
                            element.jsnUpdate[strID][targetColumnParent.getAttribute('column')] = newValue;
                            
                            element.saveTimerID = setTimeout(function () {
                                updateDataWithoutTemplate(element);
                                element.saveTimerID = undefined;
                            }, 300);
                        }
                    };
                    
                    element.addEventListener('keydown', changeHandler);
                    element.addEventListener('keyup', changeHandler);
                    element.addEventListener('change', changeHandler);
                    
                } else {
                    element.addEventListener('change', function (event) {
                        var newValue;
                        
                        if (event.target.getAttribute('column')
                                && columnParentsUntilForm(element, event.target) === 0
                                && GS.findParentTag(event.target, 'gs-form') === element) {
                            //event.stopPropagation();
                            
                            if (event.target.value !== null) {
                                newValue = event.target.value;
                            } else {
                                newValue = event.target.checked;
                            }
                            
                            updateData(element, event.target, event.target.getAttribute('column'), newValue);
                        }
                    });
                }
            }
        }
    }
    
    xtag.register('gs-form', {
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
                    // attribute code
                }
            },
            
            removed: function () {
                if (this.hasAttribute('save-while-typing') && this.saveTimerID) {
                    clearTimeout(this.saveTimerID);
                    emergencyUpdate(this);
                }
            }
        },
        events: {},
        accessors: {},
        methods: {
            refresh: function () {
                getData(this);
            },
            
            column: function (strColumn) {
                //console.log(this.lastSuccessData);
                return GS.envGetCell(this.lastSuccessData, 0, strColumn);
            },
            
            addMessage: function (strMessageName) {
                return addMessage(this, strMessageName);
            },
            removeMessage: function (strMessageName) {
                return removeMessage(this, strMessageName);
            }
        }
    });
});