//jslint white:true
window.addEventListener('design-register-element', function () {
    registerDesignSnippet('<gs-insert>', '<gs-insert>', 'gs-insert src="${1:test.tpeople}">\n' +
                                                        '    ${2}\n' +
                                                        '</gs-insert>');
    
    designRegisterElement('gs-insert', (location.pathname.indexOf('/v1/') === 0 ? '/v1/dev/' : '/env/app/') + 'developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-insert.html');
    
    window.designElementProperty_GSINSERT = function(selectedElement) {
        addProp('Source&nbsp;Query', true,
                        '<gs-memo rows="1" autoresize class="target" value="' + encodeHTML(selectedElement.getAttribute('src') ||
                                selectedElement.getAttribute('source') || '') + '" mini></gs-memo>',
                function () {
            return setOrRemoveTextAttribute(selectedElement, 'src', this.value);
        });
        
        addProp('Additional&nbsp;Values', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('addin') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'addin', this.value);
        });
        
        // TITLE attribute
        addProp('Title', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('title') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'title', this.value);
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
        
        addFlexContainerProps(selectedElement);
        addFlexProps(selectedElement);
    };
});

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    
    xtag.register('gs-insert', {
        lifecycle: {},
        events: {},
        accessors: {},
        methods: {
            submit: function (callback) {
                if (window.bolSocket === true) {
                    var element = this
                      , srcParts    = GS.templateWithQuerystring(element.getAttribute('src') || '').split('.')
                      , strSchema   = srcParts[0]
                      , strObject   = srcParts[1]
                      , strSeqCols, strPkCols, strAddIn
                      , strColumns = '', strResponseColumns, strInsertRecord = '', strInsertData
                      , arrElement, arrKey, arrValue, i, len, strResponse, parentSrcElement;
                    
                    // addin insert data
                    strAddIn = GS.templateWithQuerystring(element.getAttribute('addin'));
                    if (strAddIn) {
                        arrKey = GS.qryGetKeys(strAddIn);
                        arrValue = GS.qryGetKeys(strAddIn);
                        
                        for (i = 0, len = arrKey.length; i < len; i += 1) {
                            strColumns += (strColumns ? '\t' : '') + GS.encodeForTabDelimited(arrKey[i]);
                            strInsertRecord += (strInsertRecord ? '\t' : '') + GS.encodeForTabDelimited(arrValue[i]);
                        }
                    }
                    
                    // control insert data
                    arrElement = xtag.query(element, '[column]');
                    for (i = 0, len = arrElement.length; i < len; i += 1) {
                        parentSrcElement = GS.findParentElement(arrElement[i].parentNode, '[src]');
                        if (
                            parentSrcElement === element &&
                            (
                                arrElement[i].value !== undefined &&
                                arrElement[i].value !== null &&
                                arrElement[i].value !== ''
                            )) {
                            strColumns += (strColumns ? '\t' : '') + GS.encodeForTabDelimited(arrElement[i].getAttribute('column'));
                            strInsertRecord += (strInsertRecord ? '\t' : '') + GS.encodeForTabDelimited(arrElement[i].value);
                        }
                    }
                    
                    strPkCols = GS.templateWithQuerystring(element.getAttribute('pk') || 'id');
                    strSeqCols = GS.templateWithQuerystring(element.getAttribute('seq') || '');
                    strInsertData = (strColumns + '\n' + strInsertRecord);
                    strResponseColumns = (strPkCols + (strPkCols ? '\t' : '') + strColumns);
                    
                    GS.requestInsertFromSocket(
                            GS.envSocket, strSchema, strObject, strResponseColumns, strPkCols, strSeqCols, strInsertData
                            // beginCallback
                          , function () {}
                            
                            // confirmCallback
                          , function (data, error, transactionID, commitFunction, rollbackFunction) {
                                var arrCells, i, len, arrElements, jsnSelection, focusElement, focusColumnParent, focusColumnParentIndex;
                                
                                if (data !== 'TRANSACTION COMPLETED') {
                                    if (!error) {
                                        strResponse = data;
                                        commitFunction();
                                        
                                    } else {
                                        GS.webSocketErrorDialog(data);
                                        rollbackFunction();
                                    }
                                } else {
                                    commitFunction();
                                }
                            }
                            
                            // finalCallback
                          , function (strType, data, error) {
                                var arrColumns, arrCells, jsnRow = {}, i, len;
                                
                                if (strType === 'COMMIT') {
                                    arrColumns = strResponseColumns.split('\t');
                                    arrCells = (strResponse || '').split('\n')[0].split('\t');
                                    
                                    if (arrColumns.length !== arrCells.length) {
                                        throw 'gs-insert Error: Insert API call isn\'t returning correctly. (' + arrColumns.join(',') + ') -> (' + arrCells.join(',') + ')';
                                    } else {
                                        for (i = 0, len = arrColumns.length; i < len; i += 1) {
                                            jsnRow[GS.decodeFromTabDelimited(arrColumns[i])] = GS.decodeFromTabDelimited(arrCells[i]);
                                        }
                                        
                                        GS.triggerEvent(element, 'after_insert');
                                        
                                        if (typeof callback === 'function') {
                                            callback(GS.decodeFromTabDelimited(arrCells[0]), jsnRow);
                                        }
                                    }
                                }
                            }
                    );
                } else {
                    var element = this, strInsertString = '', arrElement, i, len, jsnRow = {}, parentSrcElement,
                        strSource = GS.templateWithQuerystring(decodeURIComponent(element.getAttribute('src') ||
                                                                                   element.getAttribute('source') || ''));
                    
                    // if there is an addin attribute on this element:
                    if (element.getAttribute('addin')) {
                        strInsertString += GS.templateWithQuerystring(element.getAttribute('addin'));
                    }
                    
                    // build insert string
                    arrElement = xtag.query(element, '[column]');
                    
                    for (i = 0, len = arrElement.length; i < len; i += 1) {
                        parentSrcElement = GS.findParentElement(arrElement[i].parentNode, '[src]');
                        if (
                            parentSrcElement === element &&
                            (
                                arrElement[i].value !== undefined &&
                                arrElement[i].value !== null &&
                                arrElement[i].value !== ''
                            )) {
                            jsnRow[arrElement[i].getAttribute('column')] = arrElement[i].value;
                            strInsertString += (strInsertString ? '&' : '') + arrElement[i].getAttribute('column') + '=' +
                                                                                    encodeURIComponent(arrElement[i].value);
                        }
                    }
                    
                    strInsertString = encodeURIComponent(strInsertString);
                    
                    // add a loader to the page
                    GS.addLoader('gs-insert', 'Inserting Record...');
                    
                    // make the insert call
                    GS.ajaxJSON((location.pathname.indexOf('/v1/') === 0 ? '/v1/' : '/') + (element.getAttribute('action-insert') || 'env/action_insert'),
                                'src=' + encodeURIComponent(strSource) + '&data=' + strInsertString, function (data, error) {
                        GS.removeLoader('gs-insert');
                        
                        // if there was no error: trigger event
                        if (!error) {
                            GS.triggerEvent(element, 'after_insert');
                            
                            if (typeof callback === 'function') {
                                callback(data.dat.lastval, jsnRow);
                            }
                            
                        // else if there was an error: error dialog
                        } else {
                            GS.ajaxErrorDialog(data);
                        }
                    });
                }
            }
        }
    });
});