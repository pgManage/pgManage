/* global GS, ml, editor, Range, setHomeValue, xtag, closeFolder, addHomeQuery, newTab, scriptQuery, detailQuery */
var bolGetFunctionsLoaded = true;

function getListData(strQuery, loaderTarget, callback, socket) {
    'use strict';
    var arrRecords = [], bolSkipNext = false;
    
    // add loader to target or with class
    GS.addLoader(loaderTarget, 'Getting list...');
    
    // request using raw query
    GS.requestRawFromSocket(socket || GS.envSocket, strQuery, function (data, error) {
        var arrLines, arrRecord, i, len, col_i, col_len;
        
        if (!error) {
            if (data.strMessage !== 'EMPTY' && !bolSkipNext) {
                // if message 0: add column names as first record
                if (data.intCallbackNumberThisQuery === 0) {
                    arrRecords = [];
                    arrRecords.push(data.arrColumnNames);
                }
                
                // if this isn't the end message (therefore it is a content message) and we're on the first query
                if (data.strMessage !== '\\.') {
                    arrLines = data.strMessage.split('\n');
                    
                    // loop through each line
                    for (i = 0, len = arrLines.length; i < len; i += 1) {
                        // if there is something on this line
                        if (arrLines[i]) {
                            // split the line on tabs
                            arrRecord = arrLines[i].split('\t');
                            
                            // decode each cell
                            for (col_i = 0, col_len = arrRecord.length; col_i < col_len; col_i += 1) {
                                arrRecord[col_i] = GS.decodeFromTabDelimited(arrRecord[col_i]);
                            }
                            
                            // push record to arrRecords
                            arrRecords.push(arrRecord);
                        }
                    }
                    
                // if this is the end message and we're on the first query
                } else if (data.strMessage === '\\.') {
                    if (typeof callback === 'function') {
                        callback(arrRecords);
                    }
                    
                    // remove loader
                    GS.removeLoader(loaderTarget);
                    
                    //console.log('LIST RETURN:', arrRecords);
                }
            } else if (bolSkipNext) {
                bolSkipNext = false;
                
            } else {
                bolSkipNext = true;
            }
            
        } else {
            GS.removeLoader(loaderTarget);
            GS.webSocketErrorDialog(data);
        }
    });
}

function getSingleCellData(strQuery, callback) {
    'use strict';
    // request using raw query
    GS.requestRawFromSocket(GS.envSocket, strQuery, function (data, error) {
        //console.log('1***', error);
        
        if (!error) {
            // if response 0 and callback is a function
            if (data.intCallbackNumber === 0 && typeof callback === 'function') {
                // call the callback with the decoded first cell of the first record in the response
                callback(GS.decodeFromTabDelimited(data.strMessage.split('\n')[0].split('\t')[0]));
                
                //console.log('CELL RETURN:', GS.decodeFromTabDelimited(data.strMessage.split('\n')[0].split('\t')[0]));
            }
            
        } else {
            if (typeof callback === 'function') {
                callback('');
            }
            //GS.webSocketErrorDialog(data);
        }
    });
}

function getListForTree(target, strQuery, looperCallback) {
    'use strict';
    var oldPosition = target.style.position;
    
    target.style.position = 'relative';
    
    getListData(strQuery, target, function (arrList) {
        var i, len, col_i, col_len, jsnRow, arrColumns, strHTML;
        
        target.style.position = oldPosition;
        target = GS.findParentElement(target, '.tree-line'); //GS.findParentElement(target, '.object-row')
        arrColumns = arrList.splice(0, 1)[0];
        
        // if we will be inserting before the target's next sibling: reverse the order
        if (target.nextElementSibling) {
            arrList.reverse();
        }
        
        // loop through list
        for (i = 0, len = arrList.length; i < len; i += 1) {
            jsnRow = {};
            
            for (col_i = 0, col_len = arrColumns.length; col_i < col_len; col_i += 1) { 
                jsnRow[arrColumns[col_i]] = arrList[i][col_i];
            }
            
            strHTML = looperCallback(jsnRow, i - 2);
            
            if (strHTML) {
                GS.insertElementAfter(GS.stringToElement(strHTML), target);
            }
        }
    });
}

function getListsForDump(strQuery, callback) {
    'use strict';
    getListData(strQuery, 'surgery-lists', callback);
}

function getScript(strFinalName, strToolbarAddons, strQuery, bolHomeRefresh) {
    'use strict';
    var intScrollTop;

    if (!bolHomeRefresh) {
        addHomeQuery('', strFinalName, strQuery, strToolbarAddons);
    } else {
        intScrollTop = homeEditor.getSession().getScrollTop();
        setHomeValue('Loading Script', '\n\nLoading Your Script\n\n', '');
        

        getSingleCellData(strQuery, function (strScript) {

            // if "strScript" is empty: Tell the user we couldn't load the object
            if (!strScript) {
                setHomeValue(strFinalName, '\n-- This object\'s script could not be retrieved...' +
                                           '\n-- Perhaps this object was dropped and/or recreated?.\n\n');
            } else {
                strScript = strScript.replace(/[\n]*$/gi, '');
                strScript +=
                    '\n\n\n\n' +
                    '\n\n\n\n' +
                    '\n\n\n\n';

                setHomeValue(strFinalName, strScript, strToolbarAddons);
                
                //console.log(intScrollTop);
                homeEditor.getSession().setScrollTop(intScrollTop);
                if (currTab[1]) {
                    homeEditor.scrollToLine(parseInt(currTab[1], 10) + 5);
                }
            }
        });
    }
}

function getScriptForNewTab(strName, strQuery) {
    'use strict';
    getSingleCellData(strQuery, function (strScript) {
        newTab('sql', strName, {'strContent': strScript});
    });
}

function getObjectTypeTitle(strQuery, callback) {
    'use strict';
    getSingleCellData(strQuery, function (strResult) {
        callback(strResult);
    });
}



// old function, DO NOT USE, use "getScript" instead
function getScriptForAce() {
    'use strict';
    console.warn('Postage warning: old function in use: "getScriptForAce". The stack trace should appear below this log.');
    console.trace('getScriptForAce');
}

