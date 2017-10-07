//global window, Worker, console, xtag
/*jslint white:true*/
var bolQuerySelectionLoaded = true;


function rowAndColumnToIndex(strText, intRow, intColumn) {
    'use strict';
    var arrLines;
    var intIndex;
    var i;
    var len;

    arrLines = strText.split('\n');
    intIndex = 0;

    // count previous full lines
    i = 0;
    len = intRow;
    while (i < len) {
        if (arrLines[i] !== null && arrLines[i] !== undefined) {
            intIndex += arrLines[i].length + 1;
        }
        i += 1;
    }

    // add previous characters
    intIndex += intColumn;

    return intIndex;
}

function indexToRowAndColumn(strText, intIndex) {
    'use strict';
    var i;
    var len;
    var intRows;
    var intColumns;

    i = 0;
    len = intIndex;
    intRows = 0;
    intColumns = 0;
    while (i < len) {
        intColumns += 1;

        if (strText[i] === '\n') {
            intRows += 1;
            intColumns = 0;
        }

        i += 1;
    }

    return {'row': intRows, 'column': intColumns};
}

function highlightCurrentQuery(tabElement, jsnQueryStart, jsnQueryEnd) {
    "use strict";

    // remove and old yellow highlights
    if (tabElement.openSelectionMarker) {
        tabElement.relatedEditor.getSession().removeMarker(tabElement.openSelectionMarker);
        tabElement.openSelectionMarker = null;
    }

    // highlight matches if start and end positions have been provided
    if (jsnQueryStart && jsnQueryEnd) {
        tabElement.openSelectionMarker =
            tabElement.relatedEditor.getSession()
                .addMarker(
                    new Range(jsnQueryStart.row, jsnQueryStart.column, jsnQueryEnd.row, jsnQueryEnd.column),
                    'ace-selected-query',
                    'background'
                );
    }
}

var queryDetectionWorker;

function startQueryDetection() {
    "use strict";
    if (window.Worker) {
        queryDetectionWorker = new Worker('resources/worker-query-detection.js');
        queryDetectionWorker.onmessage = function (event) {
            var data = event.data;
            var tabBar = document.getElementById('tab-bar');
            var arrElements;
            var tabElement;
            var editor;
            var i;
            var len;

            arrElements = xtag.queryChildren(tabBar, '.tab-button');
            i = 0;
            len = arrElements.length;
            while (i < len) {
                if (arrElements[i].intTabNumber === data.tabNumber) {
                    tabElement = arrElements[i];
                    break;
                }
                i += 1;
            }

            if (tabElement) {
                editor = tabElement.relatedEditor;
                editor.currentQueryRange = data.currentQueryRange;
                editor.currentSelections = editor.getSelection().getAllRanges().slice(0);

                if (data.currentQueryRange) {
                    highlightCurrentQuery(
                        tabElement,
                        data.currentQueryRange.start,
                        indexToRowAndColumn(
                            data.strScript,
                            data.currentQueryRange.intFirstWordEnd
                        )
                        //jsnQueryEnd // <--- replace above line with this when testing
                    );
                } else {
                    // clear highlight
                    highlightCurrentQuery(tabElement);
                }

                GS.triggerEvent(editor.container, 'range-update');

                //console.log(data);
            }
        };
    } else {
        queryDetectionWorker = {
            "postMessage": function () {}
        };
    }
}

function selectionFindRange(tabElement, editor) {
    "use strict";
    var strScript = editor.getValue();
    var jsnSelection = editor.getSelectionRange();
    var intCursorPos;
    var intTabNumber = tabElement.intTabNumber;
    
    if (
        jsnSelection.start.column === 0 ||
        jsnSelection.start.column === 1
    ) {
        intCursorPos = rowAndColumnToIndex(
            strScript,
            jsnSelection.start.row,
            jsnSelection.start.column
        );
    } else {
        intCursorPos = rowAndColumnToIndex(
            strScript,
            jsnSelection.start.row,
            (jsnSelection.start.column - 1)
        );
    }
    
    queryDetectionWorker.postMessage({
        "strScript": strScript,
        "intCursorPos": intCursorPos,
        "intTabNumber": intTabNumber
    });
    
    
    
    
    
//    var jsnQuery;
//    var strScript = editor.getValue();
//    var jsnSelection = editor.getSelectionRange();
//    if (jsnSelection.start.column === 0 ||
//        jsnSelection.start.column === 1
//    ) {
//        var intCursorPos = rowAndColumnToIndex(strScript, jsnSelection.start.row, jsnSelection.start.column);
//    } else {
//        var intCursorPos = rowAndColumnToIndex(strScript, jsnSelection.start.row, jsnSelection.start.column - 1);
//    }
//    var intSearchPos = intCursorPos;
//    var jsnQueryStart;
//    var jsnQueryEnd;
//    var i;
//    var arrQueryStartKeywords;
//    var arrDangerousQueryStartKeywords;
//    var arrExtraSearchKeywords;
//    // ######################
//    //      known issues
//    //      in a query that looks like this: "EXPLAIN ANALYZE ..." the ANALYZE is found
//    //              first. to fix this we need to alter the extra search code to handle
//    //              different patterns of extra search (currently it's handling only
//    //              GRANT/REVOKE queries)
//    //              (same thing for ROLLBACK TO SAVEPOINT and SAVEPOINT)
//    //              (same thing for (SELECT, INSERT, UPDATE, DELETE) and WITH)
//    //              (same thing for (SELECT, INSERT, UPDATE, DELETE) and CREATE TRIGGER)
//    //              (same thing for (SET) and UPDATE)
//    // ######################

//    arrQueryStartKeywords = [
//        'ABORT', 'ALTER', 'ANALYZE', 'CHECKPOINT', 'CLOSE', 'CLUSTER', 'COMMENT',
//        'COMMIT', 'COPY', 'CREATE', 'DEALLOCATE', 'DELETE', 'DISCARD', 'DO', 'DROP',
//        'EXECUTE', 'EXPLAIN', 'FETCH', 'GRANT', 'IMPORT', 'INSERT', 'LISTEN',
//        'LOAD', 'LOCK', 'MOVE', 'NOTIFY', 'PREPARE', 'REASSIGN', 'REFRESH', 'REINDEX',
//        'RELEASE', 'RESET', 'REVOKE', 'ROLLBACK', 'SAVEPOINT', 'SECURITY', 'SELECT',
//        'SET', 'SHOW', 'START', 'TRUNCATE', 'UNLISTEN', 'UPDATE', 'VACUUM', 'VALUES'
//        //'BEGIN', 'DECLARE', 'END'
//    ];
//    arrDangerousQueryStartKeywords = [
//        'EXECUTE', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'
//    ];
//    arrExtraSearchKeywords = [
//        'TO', 'FROM', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'
//    ];


//    
//    jsnQuery = positionFindRange(strScript, intSearchPos, arrQueryStartKeywords, arrDangerousQueryStartKeywords, arrExtraSearchKeywords);
//    // this solves #108
//    if (intCursorPos === strScript.length) {
//        intCursorPos -= 1;
//    }
//    //console.log(jsnQuery);
//    // if the cursor is not in the selection: search higher
//    if (intCursorPos > jsnQuery.intQueryEnd) {
//        // there are only some queries that can wrap around other queries. that's
//        //      why this list of start keywords is shorter than the full list
//        arrQueryStartKeywords = [
//            'COMMENT', 'COPY', 'CREATE', 'DELETE', 'DO', 'EXPLAIN', 'INSERT', 'NOTIFY',
//            'PREPARE', 'SELECT', 'UPDATE', 'VALUES'
//        ];

//        i = 0;
//        while (i < 8000 && intSearchPos > 0 && intCursorPos > jsnQuery.intQueryEnd) {
//            //console.log('intSearchPos:  ', intSearchPos);
//            intSearchPos = jsnQuery.intQueryStart - 1;
//            jsnQuery = positionFindRange(strScript, intSearchPos, arrQueryStartKeywords, arrDangerousQueryStartKeywords, arrExtraSearchKeywords);

//            if (jsnQuery.intQueryStart === undefined) {
//                break;
//            }

//            i += 1;
//        }
//    }

//    if (intCursorPos > jsnQuery.intQueryEnd || jsnQuery.intQueryEnd === undefined) {
//        jsnQuery = {
//            'intQueryStart': undefined,
//            'intQueryEnd': undefined,
//            'intParenLevelAtCursor': undefined
//        };
//    }

//    // clear selection range storage
//    editor.currentQueryRange = null;
//    
//    // if we found a query
//    if (jsnQuery.intQueryStart !== jsnQuery.intQueryEnd) {
//        // resolve query positions to jsn
//        jsnQueryStart = indexToRowAndColumn(strScript, jsnQuery.intQueryStart);
//        jsnQueryEnd = indexToRowAndColumn(strScript, jsnQuery.intQueryEnd);
//        // set current range in the editor
//        editor.currentQueryRange = {
//            'start': jsnQueryStart,
//            'end':  jsnQueryEnd,
//            'startIndex': jsnQuery.intQueryStart,
//            'endIndex': jsnQuery.intQueryEnd,
//            'text': strScript.substring(jsnQuery.intQueryStart, jsnQuery.intQueryEnd),
//            'intParenLevel': jsnQuery.intParenLevelAtCursor
//        };
//        
//        
//        //console.log(JSON.stringify(editor.currentQueryRange));
//        //console.log(editor.currentQueryRange.text);
//    }
//    editor.currentSelections = editor.getSelection().getAllRanges().slice(0);

//    highlightCurrentQuery(
//        tabElement,
//        jsnQueryStart,
//        indexToRowAndColumn(strScript, jsnQuery.intFirstWordEnd)
//        //jsnQueryEnd // <--- replace above line with this when testing
//    );

//    GS.triggerEvent(editor.container, 'range-update');
}



