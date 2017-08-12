//jslint white:true multivar:true
var bolExplainLoaded = true;

function ShortcutExplain () {
    event.preventDefault();
    event.stopPropagation();
    explain(false);
}

function ShortcutExplainAnalyze () {
    event.preventDefault();
    event.stopPropagation();
    explain(true);
}

function explain(bolRun) {
    'use strict';
    var currentTab           = document.getElementsByClassName('current-tab')[0]
      , editor               = currentTab.relatedEditor
      , resultsContainer     = currentTab.relatedResultsArea
      , resultsTallyElement  = currentTab.relatedResultsTallyElement
      , resultsHeaderElement = currentTab.relatedResultsHeaderElement
	  , intTabNumber = currentTab.currentTab
      , jsnCurrentQuery, startExecute, endExecute, startLoading, endLoading, updateTally
      , stopLoadingHandler, bolIgnoreMessages = false, cancelSignalHandler
      , messageID, currentTargetTbody, intError, intQuery
      , divElement, intErrorStartLine, bindShowQueryButton, strRunQuery;

   	// if we found an editor to get the query from and the current tab is not already running a query
    if (editor && currentTab.handlingQuery !== true) {
        // get current query
        jsnCurrentQuery = getCurrentQuery();

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
            GS.requestFromSocket(GS.websockets[currentTab.relatedSocket], 'CANCEL', '', messageID);
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

            //currentTab.relatedStopLoadingButton.removeAttribute('hidden');
            //currentTab.relatedStopLoadingButton.addEventListener('click', stopLoadingHandler);
        };

        // this function is run when we encounter an error or we've recieved the last transmission,
        //      it enables the "Clear" button and hides/unbinds the "Stop Loading" button
        endLoading = function () {
            currentTab.relatedClearButton.removeAttribute('hidden');
            resultsHeaderElement.classList.remove('executing');
            currentTab.handlingQuery = false;

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

        // get the current query
        strRunQuery = jsnCurrentQuery.strQuery;

        // append explain-specific delarations depending on wheather or not we are going to run the actual code
        if (bolRun) {
            strRunQuery = 'EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON) ' + strRunQuery;
        } else {
            strRunQuery = 'EXPLAIN (FORMAT JSON, VERBOSE) ' + strRunQuery;
        }

        // begin
        startExecute();
        messageID = GS.requestRawFromSocket(GS.websockets[currentTab.relatedSocket], strRunQuery, function (data, error) {
            var tableElement, scrollElement, trElement, arrRecords
              , arrCells, intRows, strHTML, arrLines, strError
              , intLine, i, len, col_i, col_len, rec_i, rec_len
              , warningHTML, buttonContainerElement, strCSS
              , styleElement;

            if (bolIgnoreMessages === false) {
                if (!error) {
                    //console.log('data', data);
                    if (data.intCallbackNumber === 0) {
                        endExecute();
                        startLoading();
                    }
                    if (data.bolLastMessage) {
                        endLoading();
                    }
                    if (data.intCallbackNumberThisQuery === 0) {
                        intErrorStartLine += (data.strQuery.match(/\n/gim) || []).length;
                    }

                    // if not end query, therefore: results
                    if (data.strMessage !== '\\.') {
                        if (data.intCallbackNumber === 0) {
                            resultsContainer.innerHTML =
								'<div style="width: 100%; height: 100%; position: relative;" flex-vertical>' +
									'<iframe style="width: 100%; border: none;" flex src="frames/frame-explain.html"></iframe>' +
									'<gs-button remove-all class="button-pop-out-explain" icononly icon="external-link" inline></gs-button>' +
								'</div>' +
								'';
							var explainFrame = resultsContainer.children[0].children[0];
							var popoutButton = resultsContainer.children[0].children[1];

							popoutButton.addEventListener('click', function () {
								var newWindow = window.open('frames/frame-explain.html', 'ExplainQuery' + CryptoJS.MD5(strRunQuery), 'menubar=off');
								newWindow.onload = function () {
									GS.triggerEvent(newWindow, 'data-ready', {
										explainJSON: JSON.parse(GS.decodeFromTabDelimited(data.strMessage)),
										bolRun: bolRun
									});
								};
							});

							explainFrame.onload = function () {
								GS.triggerEvent(explainFrame.contentWindow, 'data-ready', {
									explainJSON: JSON.parse(GS.decodeFromTabDelimited(data.strMessage)),
									bolRun: bolRun
								});
							};
                        }

                    // else if end message
                    } else if (data.strMessage === '\\.') {
                        // set part number to 0 and add one to the query number
                        intQuery += 1;

                        // update the success and error tally
                        updateTally(intQuery, intError);

                        currentTab.relatedClearButton.removeAttribute('disabled');
                        currentTab.relatedStopLoadingButton.setAttribute('hidden', '');
                        currentTab.relatedStopLoadingButton.removeEventListener('click', stopLoadingHandler);
                    }
                } else {
                    endExecute();
                    endLoading();

                    // template warnings
                    for (i = 0, len = data.arrMessages.length, warningHTML = ''; i < len; i += 1) {
                        warningHTML += '<i>' +
                                            '<b>' + data.arrMessages[i].level + ':</b> ' +
                                            encodeHTML(data.arrMessages[i].content) +
                                        '</i>';
                    }

                    // handle putting the error response in the results pane
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
                    divElement.innerHTML = '<h4>Query #' + (intQuery) + ' Error:</h4>' + warningHTML +
                                            '<pre>' + encodeHTML(GS.decodeFromTabDelimited(data.error_text)) + '</pre>'; //strError ||
                    resultsContainer.appendChild(divElement);
                    resultsContainer.appendChild(document.createElement('br'));
                    resultsContainer.scrollTop = resultsContainer.scrollHeight + resultsContainer.offsetHeight;
                    resultsHeaderElement.classList.add('error');

                    if (intLine) {
                        editor.getSession().setAnnotations([
                            {'row': jsnCurrentQuery.start_row + intErrorStartLine + (intLine - 1), 'column': parseInt(data.error_position, 10) || 0,
                                'text': strError, 'type': 'error'}
                        ]);

                        editor.scrollToLine((jsnCurrentQuery.start_row + intErrorStartLine + (intLine - 1)), true, true);
                    }

                    // update the success and error tally
                    updateTally(intQuery, intError);
                }
            }
        });
    }
	editor.focus();
}
