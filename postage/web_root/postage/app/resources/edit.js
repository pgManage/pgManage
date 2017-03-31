function executeScriptFromCursor() {
    'use strict';
    var currentTab           = document.getElementsByClassName('current-tab')[0]
      , editor               = currentTab.relatedEditor
      , resultsContainer     = currentTab.relatedResultsArea
      , resultsTallyElement  = currentTab.relatedResultsTallyElement
      , resultsHeaderElement = currentTab.relatedResultsHeaderElement
      , bolAutocommit        = currentTab.relatedAutocommitCheckbox.value === 'true'
      , jsnCurrentQuery, startExecute, endExecute, startLoading, endLoading, updateTally
      , stopLoadingHandler, bolIgnoreMessages = false, cancelSignalHandler
      , messageID, currentTargetTbody, intRecordsThisQuery, intError, intQuery
      , divElement, intErrorStartLine, bindShowQueryButton, strScript;

    // if we found an editor to get the query from and the current tab is not already running a query
    if (editor && currentTab.handlingQuery !== true) {
        // get current query
        strScript = editor.getValue();
        var strScript = editor.getValue();
        var jsnSelection = editor.getSelectionRange();
        if (jsnSelection.start.column === 0 ||
            jsnSelection.start.column === 1
        ) {
            var intCursorPos = rowAndColumnToIndex(strScript, jsnSelection.start.row, jsnSelection.start.column);
        } else {
            var intCursorPos = rowAndColumnToIndex(strScript, jsnSelection.start.row, jsnSelection.start.column - 1);
        }
        //console.log(intCursorPos);
        jsnCurrentQuery = findSqlQueryFromCursor(strScript, intCursorPos);

        // clear error annotation in ace
        editor.getSession().setAnnotations([]);

        // clear query data store
        currentTab.arrQueryDataStore = [];

        // set the results pane header and clear out the results pane content
        currentTab.relatedResultsTitleElement.textContent = 'Results';
        resultsContainer.innerHTML = '';
        resultsHeaderElement.classList.remove('error');
        resultsHeaderElement.classList.remove('executing');

        // set number tracking variables
        intRecordsThisQuery = 0; // number of records this query so that we can get valid row numbers
        intError = 0;            // number error the callback is on
        intQuery = 0;            // number query the callback is on
        intErrorStartLine = 0;   // number of lines in the queries that successfully ran, so that we can offset the error annotation

        // this function is going to be bound to the "Stop Execution" button,
        //      it sets the "bolIgnoreMessages" variable to true, meaning the callback for the query execution will not do anything
        //      it also changes the results pane header (the tally results portion) to "(Loading Stopped)"
        //      it also runs the "endExecute" and "endLoading" functions
        stopLoadingHandler = function () {
            bolIgnoreMessages = true;
            resultsTallyElement.innerHTML = ' (Loading Stopped)';
            endExecute();
            endLoading();
        };

        // this function is going to be bound to the "Stop Execution" button,
        //      it uses the "messageID" variable to send a "CANCEL" signal through the websocket
        cancelSignalHandler = function () {
            GS.requestFromSocket(GS.querySocket, 'CANCEL', '', messageID);
        };

        // this function is run when we send the queries through the websocket,
        //      it adds a loader, disables the "Clear" button and shows/binds the "Stop Execution" button
        startExecute = function () {
            GS.addLoader(editor.container.parentNode.parentNode, 'Executing Query...');
            currentTab.relatedClearButton.setAttribute('hidden', '');
            currentTab.relatedCopyOptionsButton.setAttribute('hidden', '');
            currentTab.handlingQuery = true;

            resultsHeaderElement.classList.add('executing');
            currentTab.relatedStopButton.removeAttribute('hidden');
            currentTab.relatedStopButton.addEventListener('click', cancelSignalHandler);
        };

        // this function is run when we get our first callback,
        //      it removes the loader, hides/unbinds the "Stop Execution" button
        endExecute = function () {
            GS.removeLoader(editor.container.parentNode.parentNode);

            currentTab.relatedStopButton.setAttribute('hidden', '');
            currentTab.relatedStopButton.removeEventListener('click', cancelSignalHandler);
        };

        // this function is run when we get our first callback,
        //      it shows and binds the "Stop Loading" button
        startLoading = function () {
            currentTab.relatedClearButton.setAttribute('hidden', '');
            currentTab.relatedStopSocketButton.removeAttribute('hidden');
            //currentTab.relatedStopLoadingButton.removeAttribute('hidden');
            //currentTab.relatedStopLoadingButton.addEventListener('click', stopLoadingHandler);
        };

        // this function is run when we encounter an error or we've recieved the last transmission,
        //      it enables the "Clear" button and hides/unbinds the "Stop Loading" button
        endLoading = function () {
            currentTab.relatedClearButton.removeAttribute('hidden');
            resultsHeaderElement.classList.remove('executing');
            currentTab.handlingQuery = false;
            currentTab.relatedStopSocketButton.setAttribute('hidden', '');
            currentTab.relatedStopSocketButton.removeEventListener('click', stopLoadingHandler);
            //currentTab.relatedStopLoadingButton.setAttribute('hidden', '');
            //currentTab.relatedStopLoadingButton.removeEventListener('click', stopLoadingHandler);
        };

        // this function is run when the user clicks "Show Query",
        //      it opens a dialog with the query in it
        bindShowQueryButton = function (element, strQuery) {
            element.addEventListener('click', function () {
                var templateElement = document.createElement('template');

                templateElement.setAttribute('data-overlay-close', 'true');
                templateElement.innerHTML = ml(function () {/*
                    <gs-page>
                        <gs-body padded>
                            <pre>{{STRHTML}}</pre>
                        </gs-body>
                    </gs-page>
                */}).replace(/\{\{STRHTML\}\}/gim, encodeHTML(strQuery));

                GS.openDialogToElement(element, templateElement, 'left');
            });
        };

        // This function updates the results header Success/Error tally
        updateTally = function (intQuery, intError) {
            resultsTallyElement.innerHTML = ' (<b>Pass: ' + (intQuery - intError) + '</b>, <b>Fail: ' + (intError) + '</b>)';
            //resultsTallyElement.innerHTML = ' (<b>Success: ' + (intQuery - intError) + '</b>, <b>Error: ' + (intError) + '</b>)';
        };

        // begin
        startExecute();
        messageID = GS.requestRawFromSocket(GS.querySocket, jsnCurrentQuery.strQuery, function (data, error) {
            var tableElement, scrollElement, trElement, arrRecords
              , arrCells, intRows, strHTML, arrLines, strError
              , intLine, i, len, col_i, col_len, rec_i, rec_len
              , warningHTML, buttonContainerElement, strCSS
              , styleElement;

            if (bolIgnoreMessages === false) {
                // get name of query if applicable
                var strQueryName = "";
                if (data.strQuery) {
                    var arrStrMatches = data.strQuery.match(/\-\-[ \t]*Name\:(.*)$/im);

                    if (arrStrMatches && arrStrMatches.length > 1) {
                    	strQueryName = ", " + arrStrMatches[1].trim();
                    }
                }

                if (!error) {
                    if (data.intCallbackNumber === 0) {
                        endExecute();
                        startLoading();
                    }

                    currentTab.relatedStopSocketButton.addEventListener('click', function () {
                        GS.requestFromSocket(GS.querySocket, 'CANCEL', function () {});
                        stopLoadingHandler();
                        bolIgnoreMessages = true;
                        document.getElementById('RowCountSmall').innerHTML = '' + (parseInt(data.intCallbackNumberThisQuery * 10, 10) + 10) + ' loaded of ' + data.intRows;
                        console.log(data.intCallbackNumberThisQuery * 10 + 10);
                    });

                    if (data.bolLastMessage) {
                        endLoading();
                    }
                    if (data.intCallbackNumberThisQuery === 0) {
                        if (data.strQuery.trim()) {
                            arrExecuteHistory.push({
                                'strQuery': data.strQuery,
                                'dteStart': new Date(data.dteStart),
                                'dteEnd': new Date(data.dteEnd),
                                'intRows': data.intRows
                            });
                        }

                        // add datastore entry for the current query's results
                        currentTab.arrQueryDataStore.push([]);

                        //console.log(((data.strQuery.match(/\n/gim) || []).length), data);
                        intErrorStartLine += (data.strQuery.match(/\n/gim) || []).length;
                    }

                    // handle putting the response in the results pane

                    // if this isn't the last message
                    if (!data.bolLastMessage) {
                        // if rows affected
                        if (data.strMessage.indexOf('Rows Affected\n') === 0) {
                            intRows = parseInt(data.strMessage.substring('Rows Affected\n'.length).trim(), 10);

                            for (i = 0, len = data.arrMessages.length, warningHTML = ''; i < len; i += 1) {
                                warningHTML += '<i>' +
                                                    '<b>' + data.arrMessages[i].level + ':</b> ' +
                                                    encodeHTML(data.arrMessages[i].content) +
                                                '</i><br/>';
                            }


                            strHTML = '<div flex-horizontal>' +
                                            '<h5 flex>Query #' + (data.intQueryNumber + 1) + strQueryName + ':</h5>' +
                                            '<div>';

                            if (data.dteStart && data.dteEnd && !isNaN(data.dteStart.getTime()) && !isNaN(data.dteEnd.getTime())) {
                                strHTML +=
                                    '<small>' +
                                        'Approx. ' + ((data.dteEnd.getTime() - data.dteStart.getTime()) / 1000).toFixed(3) + ' seconds' +
                                    '</small>';
                            }

                            strHTML += '<br />';

                            if (data.intRows !== undefined) {
                                strHTML += '<small>' + data.intRows + ' rows</small>';
                            }

                            strHTML +=      '</div>' +
                                            '<span>&nbsp;</span>' +
                                            '<gs-button class="button-show-query" no-focus>Query</gs-button>' +
                                        '</div>' + warningHTML;

                            divElement = document.createElement('div');
                            divElement.innerHTML =  strHTML + '<pre>' + intRows + ' Row' + (intRows === 1 ? '' : 's') + ' Affected</pre><br />';

                            resultsContainer.appendChild(divElement);
                            bindShowQueryButton(xtag.query(divElement, '.button-show-query')[0], data.strQuery);
                            intQuery += 1;

                            // update the success and error tally
                            updateTally(intQuery, intError);

                        // else if empty
                        } else if (data.strMessage === 'EMPTY') {
                            divElement = document.createElement('div');

                            for (i = 0, len = data.arrMessages.length, warningHTML = ''; i < len; i += 1) {
                                warningHTML += '<i>' +
                                                    '<b>' + data.arrMessages[i].level + ':</b> ' +
                                                    encodeHTML(data.arrMessages[i].content) +
                                                '</i><br/>';
                            }

                            strHTML = '<div flex-horizontal>' +
                                            '<h5 flex>Query #' + (data.intQueryNumber + 1) + strQueryName + ':</h5>' +
                                            '<div>';

                            if (data.dteStart && data.dteEnd && !isNaN(data.dteStart.getTime()) && !isNaN(data.dteEnd.getTime())) {
                                strHTML +=
                                    '<small>' +
                                        'Approx. ' + ((data.dteEnd.getTime() - data.dteStart.getTime()) / 1000).toFixed(3) + ' seconds' +
                                    '</small>';
                            }

                            strHTML += '<br />';

                            if (data.intRows !== undefined) {
                                strHTML += '<small>' + data.intRows + ' rows</small>';
                            }

                            strHTML +=      '</div>' +
                                            '<span>&nbsp;</span>' +
                                            '<gs-button class="button-show-query" no-focus>Query</gs-button>' +
                                        '</div>' + warningHTML;

                            divElement.innerHTML = strHTML + '<pre>Empty Query</pre><br />';

                            resultsContainer.appendChild(divElement);
                            bindShowQueryButton(xtag.query(divElement, '.button-show-query')[0], data.strQuery);
                            intQuery += 1;

                            // update the success and error tally
                            updateTally(intQuery, intError);

                        // else if result query
                        } else if (data.arrColumnNames.length > 0) {


                            // if this is the first callback for this query: set up title, table and header
                            if (data.intCallbackNumberThisQuery === 0) {
                                divElement = document.createElement('div');
                                scrollElement = document.createElement('div');

                                scrollElement.classList.add('result-table-scroll-container');

                                for (i = 0, len = data.arrMessages.length, warningHTML = ''; i < len; i += 1) {
                                    //console.log('"' + data.arrMessages[i].level + '"', '"' + data.arrMessages[i].content + '"');
                                    warningHTML += '<i>' +
                                                        '<b>' + data.arrMessages[i].level + ':</b> ' +
                                                        encodeHTML(data.arrMessages[i].content) +
                                                    '</i><br/>';
                                }

                                strHTML = '<div flex-horizontal>' +
                                                '<h5 flex>Query #' + (data.intQueryNumber + 1) + strQueryName + ':</h5>' +
                                                '<div>';

                                if (data.dteStart && data.dteEnd && !isNaN(data.dteStart.getTime()) && !isNaN(data.dteEnd.getTime())) {
                                    strHTML +=
                                        '<small>' +
                                            'Approx. ' + ((data.dteEnd.getTime() - data.dteStart.getTime()) / 1000).toFixed(3) + ' seconds' +
                                        '</small>';
                                }

                                strHTML += '<br />';

                                if (data.intRows !== undefined) {
                                    strHTML += '<small id="RowCountSmall">' + data.intRows + ' rows</small>';
                                }


                                strHTML +=      '</div>' +
                                                '<span>&nbsp;</span>' +
                                                '<gs-button class="button-show-query" no-focus>Query</gs-button>' +
                                            '</div>' + warningHTML;

                                divElement.innerHTML = strHTML;

                                divElement.appendChild(scrollElement);
                                resultsContainer.appendChild(divElement);
                                bindShowQueryButton(xtag.query(divElement, '.button-show-query')[0], data.strQuery);

                                strHTML = '<thead><tr><th>#</th>';
                                strCSS = '';
                                for (col_i = 0, col_len = data.arrColumnNames.length; col_i < col_len; col_i += 1) {
                                    strHTML += '<th>';
                                    strHTML +=     '<b>';
                                    strHTML +=     encodeHTML(GS.decodeFromTabDelimited(data.arrColumnNames[col_i]));
                                    strHTML +=     '</b><br />';
                                    strHTML +=     '<small>';
                                    strHTML +=          encodeHTML(GS.decodeFromTabDelimited(data.arrColumnTypes[col_i]));
                                    strHTML +=     '</small>';
                                    strHTML += '</th>';


                                    //int2 / smallint
                                    //int4 / integer
                                    //int8 / bigint
                                    //numeric
                                    //float
                                    //decimal
                                    //real
                                    //double
                                    //money
                                    //oid

                                    // if this column is a number type: align column text to the right
                                    if ((/^(int|smallint|bigint|numeric|float|decimal|real|double|money|oid)/gi).test(data.arrColumnTypes[col_i])) {
                                        strCSS += ' table[data-query-number="' + data.intQueryNumber + '"] tbody tr :nth-child(' + (col_i + 2) + ') { ';
                                        strCSS += '     text-align: right;';
                                        strCSS += ' } ';
                                    }
                                }
                                strHTML += '</tr></thead>';


                                tableElement = document.createElement('table');
                                tableElement.classList.add('results-table');
                                tableElement.setAttribute('data-query-number', data.intQueryNumber);
                                tableElement.innerHTML = strHTML;
                                scrollElement.appendChild(tableElement);

                                styleElement = document.createElement('style');
                                styleElement.innerHTML = strCSS;
                                scrollElement.appendChild(styleElement);

                                currentTargetTbody = document.createElement('tbody');
                                tableElement.appendChild(currentTargetTbody);

                                // set table attributes for copy settings
                                tableElement.setAttribute('quote-type', getClipSetting("quoteType"));
                                tableElement.setAttribute('quote-char', getClipSetting("quoteChar"));
                                tableElement.setAttribute('field-delimiter', getClipSetting("fieldDelimiter"));
                                tableElement.setAttribute('null-values', getClipSetting("nullValues"));
                                tableElement.setAttribute('column-names', getClipSetting("columnNames"));

                                // make the table selectable
                                GS.makeTableSelectable(tableElement, evt.touchDevice);
                            }



                            //console.log('0***', data);
                            // if not end query, therefore: results
                            if (data.strMessage !== '\\.') {
                                arrRecords = data.strMessage.split('\n');
                                strHTML = '';

                                //console.log(
                                //    '1***',
                                //    data.intCallbackNumberThisQuery,
                                //    data.intQueryNumber,
                                //    arrRecords
                                //);

                                for (rec_i = 0, rec_len = arrRecords.length; rec_i < rec_len; rec_i += 1) {
                                    // if appending this would make more than 10 records: save to data store
                                    if (data.intCallbackNumberThisQuery >= 1) {
                                        //console.log(
                                        //    '2***',
                                        //    intRecordsThisQuery,
                                        //    currentTab.arrQueryDataStore[data.intQueryNumber].length,
                                        //    arrRecords[rec_i]
                                        //);
                                        currentTab.arrQueryDataStore[data.intQueryNumber].push((intRecordsThisQuery + 1) + '\t' + arrRecords[rec_i]);

                                        // if this is the first time adding to the data store: add append buttons below the table
                                        if (currentTab.arrQueryDataStore[data.intQueryNumber].length === 1) {
                                            //console.log('3***');
                                            buttonContainerElement = document.createElement('div');
                                            buttonContainerElement.style.whiteSpace = 'normal';

                                            GS.insertElementAfter(buttonContainerElement, currentTargetTbody.parentNode);

                                            buttonContainerElement.innerHTML = ml(function () {/*
                                                <gs-grid min-width="all {reflow}; 482px {1,1,1,1};">
                                                    <gs-block>
                                                        <gs-button onclick="showMoreResults(this, {{QUERY}}, 10)">Show 10 More</gs-button>
                                                    </gs-block>
                                                    <gs-block>
                                                        <gs-button onclick="showMoreResults(this, {{QUERY}}, 100)">Show 100 More</gs-button>
                                                    </gs-block>
                                                    <gs-block>
                                                        <gs-button onclick="showMoreResults(this, {{QUERY}}, 1000)">Show 1000 More</gs-button>
                                                    </gs-block>
                                                    <gs-block>
                                                        <gs-button onclick="showMoreResults(this, {{QUERY}}, 'all')">Show All</gs-button>
                                                    </gs-block>
                                                </gs-grid>
                                            */}).replace(/\{\{QUERY\}\}/gi, data.intQueryNumber);
                                        }

                                    // else append to the dom
                                    } else {
                                        trElement = document.createElement('tr');
                                        arrCells = arrRecords[rec_i].split('\t');

                                        //console.log(
                                        //    '4***',
                                        //    arrCells
                                        //);

                                        strHTML = '<th>' + (intRecordsThisQuery + 1) + '</th>';
                                        for (col_i = 0, col_len = arrCells.length; col_i < col_len; col_i += 1) {
                                            strHTML += '<td>';
                                            strHTML += encodeHTML(GS.decodeFromTabDelimited(arrCells[col_i]));
                                                            //.replace(/&/g, '&amp;')
                                                            //.replace(/"/g, '&quot;')
                                                            //.replace(/'/g, '&#39;')
                                                            //.replace(/</g, '&lt;')
                                                            //.replace(/>/g, '&gt;');
                                            strHTML += '</td>';
                                        }
                                        trElement.innerHTML = strHTML;

                                        currentTargetTbody.appendChild(trElement);
                                    }

                                    intRecordsThisQuery += 1;
                                }

                            // else if end message
                            } else if (data.strMessage === '\\.') {
                                //console.log('5***');
                                // add a br for spacing/padding
                                resultsContainer.appendChild(document.createElement('br'));
                                // set part number to 0 and add one to the query number
                                intQuery += 1;

                                // update the success and error tally
                                updateTally(intQuery, intError);

                                intRecordsThisQuery = 0;
                                currentTab.relatedClearButton.removeAttribute('disabled');
                                currentTab.relatedStopLoadingButton.setAttribute('hidden', '');
                                currentTab.relatedStopLoadingButton.removeEventListener('click', stopLoadingHandler);
                            }
                        }
                    }
                } else {
                    endExecute();
                    endLoading();

                    arrExecuteHistory.push({
                        'strQuery': jsnCurrentQuery.strQuery,
                        'failed': true,
                        'errorText': data.error_text
                    });

                    // template warnings
                    for (i = 0, len = data.arrMessages.length, warningHTML = ''; i < len; i += 1) {
                        warningHTML += '<i>' +
                                            '<b>' + data.arrMessages[i].level + ':</b> ' +
                                            encodeHTML(data.arrMessages[i].content) +
                                        '</i><br/>';
                    }

                    // handle putting the error response in the results pane
                    //console.log(data);
                    arrLines = data.error_text.split('\n');
                    intQuery += 1;
                    intError += 1;

                    for (i = 0, len = arrLines.length; i < len; i += 1) {
                        if (arrLines[i].substring(0, arrLines[i].indexOf(':')) === 'ERROR') {
                            strError = arrLines[i].substring(arrLines[i].indexOf(':') + 1, arrLines[i].length).trim();
                        }
                        if (arrLines[i].substring(0, arrLines[i].indexOf(' ')) === 'LINE') {
                            intLine = parseInt(arrLines[i].substring(arrLines[i].indexOf(' ') + 1, arrLines[i].indexOf(':')), 10);
                        }
                    }

                    divElement = document.createElement('div');
                    divElement.innerHTML = '<h4 id="error' + intQuery + '">Query #' + (intQuery) + strQueryName + ' Error:</h4>' + warningHTML +
                                            '<pre>' + encodeHTML(GS.decodeFromTabDelimited(data.error_text)) + '</pre>'; //strError ||
                    resultsContainer.appendChild(divElement);
                    resultsContainer.appendChild(document.createElement('br'));
                    //resultsContainer.scrollTop = resultsContainer.scrollHeight + resultsContainer.offsetHeight;
                    //console.log(resultsContainer.scrollTop = document.getElementById('error' + intQuery));
                    resultsContainer.scrollTop = document.getElementById('error' + intQuery).offsetTop - 40;
                    //resultsContainer.scrollTop = document.getElementById('error' + intQuery).offset().top;
                    resultsHeaderElement.classList.add('error');

                    //console.log(intLine, jsnCurrentQuery.start_row, intErrorStartLine);
                    if (intLine) {
                        editor.getSession().setAnnotations([
                            {'row': jsnCurrentQuery.start_row + intErrorStartLine + (intLine - 1), 'column': parseInt(data.error_position, 10) || 0,
                                'text': strError, 'type': 'error'}
                        ]);

                        editor.scrollToLine((jsnCurrentQuery.start_row + intErrorStartLine + (intLine - 1)), true, true);
                    }

                    // update the success and error tally
                    updateTally(intQuery, intError);

                    //editor.gotoLine(
                    //    (jsnCurrentQuery.start_row + intLine),
                    //    (parseInt(data.error_position, 10) || 0),
                    //    true
                    //);
                }
            }
        }, bolAutocommit);
    }
}
