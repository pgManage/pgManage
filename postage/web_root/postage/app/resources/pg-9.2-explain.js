//jslint white:true multivar:true
var bolExplainLoaded = true;
  
document.addEventListener('keydown', function (event) {
    if (event.keyCode === 118 && event.shiftKey === false) {
        explain();
    } else if (event.keyCode === 118 && event.shiftKey === true) {
        explain(true);
    }
})

function explain(bolRun) {
    'use strict';
    var currentTab           = document.getElementsByClassName('current-tab')[0]
      , editor               = currentTab.relatedEditor
      , resultsContainer     = currentTab.relatedResultsArea
      , resultsTallyElement  = currentTab.relatedResultsTallyElement
      , resultsHeaderElement = currentTab.relatedResultsHeaderElement
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
        messageID = GS.requestRawFromSocket(GS.querySocket, strRunQuery, function (data, error) {
            var tableElement, scrollElement, trElement, arrRecords
              , arrCells, intRows, strHTML, arrLines, strError
              , intLine, i, len, col_i, col_len, rec_i, rec_len
              , warningHTML, buttonContainerElement, strCSS
              , styleElement;

            if (bolIgnoreMessages === false) {
                if (!error) {
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
                        //console.log('1***', data.intCallbackNumber, data.intCallbackNumberThisQuery, data.strMessage);

                        if (data.intCallbackNumber === 0) {
                            resultsContainer.innerHTML = '<div style="width: 100%; height: 100%;"></div>';
    
                            handleExplain(JSON.parse(GS.decodeFromTabDelimited(data.strMessage)), resultsContainer.children[0], bolRun);
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
}



function handleExplain(explainJSON, target, bolRun) {
    'use strict';

    target.innerHTML = '';
    target.style.padding = '0px';
    target.style.overflow = 'hidden';
    
    var color = d3.scaleOrdinal()
                    .domain([])
                    .range(d3.scaleOrdinal(d3.schemeCategory20).range().concat(d3.scaleOrdinal(d3.schemeCategory20c).range()));
    
    // get total records, get total cost, get total time
    var intTotalCost = 0;
    var intTotalRecords = 0;
    var intTotalTime = 0;
    
    var levelTraveler = function (levelNumber, numberParent, numberChild, parentObject, jsnLevel) {
        var i, len, arrChildren = jsnLevel.Plans;
        
        jsnLevel['Node Cost'] = parseFloat(jsnLevel['Total Cost']);
        
        if (jsnLevel['Plans'] !== undefined) {
            for (i = 0, len = jsnLevel['Plans'].length; i < len; i += 1) {
                if (jsnLevel['Plans'][i]['Node Type'] !== 'CTE Scan') {
                    jsnLevel['Node Cost'] -= parseFloat(jsnLevel['Plans'][i]['Total Cost']);
                }
            }
        }
                
        intTotalCost += jsnLevel['Node Cost'];
        intTotalRecords += jsnLevel['Plan Rows'];
        intTotalTime += jsnLevel['Actual Total Time'];
        
        // handle child plans
        if (arrChildren) {
            levelNumber += 1;
            for (i = 0, len = arrChildren.length; i < len; i += 1) {
                levelTraveler(levelNumber, numberChild, i, jsnLevel, arrChildren[i]);
            }
        }
    };

    levelTraveler(0, 0, 0, '', explainJSON[0].Plan);
    
    
    var jsnCostliest = null;
    var jsnLargest = null;
    var jsnSlowest = null;
    
    // build nodes
    levelTraveler = function (levelNumber, numberParent, numberChild, parentObject, parentNode, jsnLevel) {
        var i, len, arrChildren = jsnLevel.Plans, node = {};
        
        jsnLevel.level = levelNumber;
        jsnLevel.intTotalCost = intTotalCost;
        jsnLevel.intTotalRecords = intTotalRecords;
        jsnLevel.intTotalTime = intTotalTime;
        
        node.data = jsnLevel;
        node.children = [];
        
        jsnCostliest = jsnCostliest === null ? node : (jsnCostliest.data['Node Cost'] < node.data['Node Cost'] ? node : jsnCostliest);
        if (node.data['Actual Rows'] != undefined) {
            jsnLargest = jsnLargest === null ? node : (jsnLargest.data['Actual Rows'] < node.data['Actual Rows'] ? node : jsnLargest);
        } else {
            jsnLargest = jsnLargest === null ? node : (jsnLargest.data['Plan Rows'] < node.data['Plan Rows'] ? node : jsnLargest);
        }
        jsnSlowest = jsnSlowest === null ? node : (jsnSlowest.data['Actual Total Time'] < node.data['Actual Total Time'] ? node : jsnSlowest);
        
        // handle child plans
        if (arrChildren) {
            levelNumber += 1;
            for (i = 0, len = arrChildren.length; i < len; i += 1) {
                node.children.push(levelTraveler(levelNumber, numberChild, i, jsnLevel, node, arrChildren[i]));
            }
        }
        
        return node;
    };

    var treeData = levelTraveler(0, 0, 0, '', {}, explainJSON[0].Plan);
    
    jsnCostliest.costliest = true;
    jsnLargest.largest = true;
    jsnSlowest.slowest = true;
    
    var root = d3.hierarchy(treeData);
    
    var tree = d3.tree().nodeSize([210, 300]);
    root = tree(root);
    console.log(root);
    
    var svg = d3.select(target).append('svg')
                        .attr("width", "100%")
                        .attr("height", "100%"),
        g = svg
            .append('g').attr("transform", "translate(" + (target.clientWidth / 2) + ", 120)")
            .call(
                d3.zoom().on('zoom', function () {
                    g.attr('transform', d3.event.transform.toString());
                })
            )
            .append("g")
                .attr('width', '100%')
                .attr('height', '100%');
    
    g.append('rect')
        //.attr('width', _width)
        //.attr('height', _height)
        .attr('width', 500000)
        .attr('height', 500000)
        .attr('x', -250000)
        .attr('y', -250000)
        .style('fill', 'transparent');
    
    var link = g.selectAll(".explain-link")
        .data(root.descendants().slice(1))
        .enter().append("path")
            .attr("class", "explain-link")
            .attr("d", function(d) {
                return "M" + d.x + "," + d.y
                     + "C" + d.x + "," + (d.y + d.parent.y) / 2
                     + " " + d.parent.x + "," +  (d.y + d.parent.y) / 2
                     + " " + d.parent.x + "," + d.parent.y;
            });
    
    
    var node = g.selectAll(".explain-node")
        .data(root.descendants())
        .enter().append("g")
            .attr("class", "explain-node")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            .on('click', function (d) {
                console.log(d);
                return dialogExplainPlan(d.data);
            }, true);;
    
    node.append('rect')
        .attr("y", -100)
        .attr("x", -100)
        .attr('width', 200)
        .attr('height', 275)
        .style('fill', '#fff')
        .style('stroke', '#ddd')
        .style('stroke-width', 2)
        .style('stroke-opacity', 1);
        
    node.append('foreignObject')
        .attr("y", -95)
        .attr("x", -95)
        .attr('width', 195)
        .attr('height', 270)
            .html(function (d) {
                var strHTML = '<body xmlns="http://www.w3.org/1999/xhtml">';
                
                strHTML += '<div class="explain-node-container" style="width: 190px">';
                strHTML += '<h3 style="margin: 0; margin-bottom: 2px;">' + d.data.data['Node Type'] + '</h3>'
                
                if (d.data.costliest) {
                    strHTML +=  '<div class="costliest-label">costliest</div>';
                    console.log(strHTML);
                }
                if (d.data.largest) {
                    strHTML +=  '<div class="largest-label">largest</div>';
                    console.log(strHTML);
                }
                if (d.data.slowest) {
                    strHTML +=  '<div class="slowest-label">slowest</div>';
                    console.log(strHTML);
                }
                
                if (d.data.data['Node Type'] === 'Hash Join') {
                    strHTML +=  '<p style="width: 190px; height: auto;">' + d.data.data['Join Type'] + ' Join on ' + d.data.data['Hash Cond'] + '</p>';
                } else if (d.data.data['Node Type'] === 'Sort') {
                    strHTML +=  '<p style="width: 190px; height: auto; max-height: 6.6em; overflow: auto;">by ' + d.data.data['Sort Key'].join(', ') + '</p>';
                } else if (d.data.data['Node Type'] === 'Seq Scan') {
                    strHTML +=  '<p style="width: 190px; height: auto;">on ' + d.data.data['Schema'] + '.' + d.data.data['Relation Name'] + '(' + d.data.data['Alias'] + ')' + '</p>';
                }
                
                if (d.data.data['Total Cost'] !== undefined) {
                    var strBarHTML = (d.data.data['Total Cost'] < 1 ? '<div class="explain-bar-0">0</div>' : ('<div class="explain-bar-block">' + Math.round(d.data.data['Total Cost']).toString().split('').join('</div><div class="explain-bar-block">') + '</div>'));
                    strHTML +=  
                                '<div flex-horizontal flex-fill>' +
                                    '<div flex class="explain-bar red" flex-horizontal flex-fill>' +
                                        '<div flex>' +
                                        '</div>' +
                                        strBarHTML +
                                    '</div>' +
                                    '<div class="explain-bar-label">' +
                                        'Cost' +
                                    '</div>' +
                                '</div>';
                }
                
                if (d.data.data['Node Cost'] !== undefined) {
                    var strBarHTML = (d.data.data['Node Cost'] < 1 ? '<div class="explain-bar-0">0</div>' : ('<div class="explain-bar-block">' + Math.round(d.data.data['Node Cost']).toString().split('').join('</div><div class="explain-bar-block">') + '</div>'));
                    strHTML +=  
                                '<div flex-horizontal flex-fill>' +
                                    '<div flex class="explain-bar yellow" flex-horizontal flex-fill>' +
                                        '<div flex>' +
                                        '</div>' +
                                        strBarHTML +
                                    '</div>' +
                                    '<div class="explain-bar-label">' +
                                        'Node' +
                                    '</div>' +
                                '</div>';
                }
                
                if (d.data.data['Plan Rows'] !== undefined) {
                    var strBarHTML = (d.data.data['Plan Rows'] < 1 ? '<div class="explain-bar-0">0</div>' : ('<div class="explain-bar-block">' + Math.round(d.data.data['Plan Rows']).toString().split('').join('</div><div class="explain-bar-block">') + '</div>'));
                    strHTML +=  
                                '<div flex-horizontal flex-fill>' +
                                    '<div flex class="explain-bar blue" flex-horizontal flex-fill>' +
                                        '<div flex>' +
                                        '</div>' +
                                        strBarHTML +
                                    '</div>' +
                                    '<div class="explain-bar-label">' +
                                        'Plan' +
                                    '</div>' +
                                '</div>';
                }
                
                if (d.data.data['Actual Rows'] !== undefined) {
                    var strBarHTML = (d.data.data['Actual Rows'] < 1 ? '<div class="explain-bar-0">0</div>' : ('<div class="explain-bar-block">' + Math.round(d.data.data['Actual Rows']).toString().split('').join('</div><div class="explain-bar-block">') + '</div>'));
                    strHTML +=  
                                '<div flex-horizontal flex-fill>' +
                                    '<div flex class="explain-bar cyan" flex-horizontal flex-fill>' +
                                        '<div flex>' +
                                        '</div>' +
                                        strBarHTML +
                                    '</div>' +
                                    '<div class="explain-bar-label">' +
                                        'Rows' +
                                    '</div>' +
                                '</div>';
                }
                
                if (d.data.data['Actual Total Time'] !== undefined) {
                    var strBarHTML = (d.data.data['Actual Total Time'] < 1 ? '<div class="explain-bar-0">&lt;</div><div class="explain-bar-0">1</div>' : ('<div class="explain-bar-block">' + Math.round(d.data.data['Actual Total Time']).toString().split('').join('</div><div class="explain-bar-block">') + '</div>'));
                    strHTML +=  
                                '<div flex-horizontal flex-fill>' +
                                    '<div flex>' +
                                        '<div class="explain-bar green" flex-horizontal flex-fill>' +
                                            '<div flex>' +
                                            '</div>' +
                                            strBarHTML +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="explain-bar-label">' +
                                        'Time' +
                                    '</div>' +
                                '</div>';
                }
                
                strHTML += '</div></body>';
                
                return strHTML;
            });
}

function dialogExplainPlan(d) {
    var element = this, key, strHTML = '', templateElement = document.createElement('template');
    
    // prevents drags from being clicks
    if (d3.event.defaultPrevented) {
        return;
    }
    
    strHTML += '<table class="explain-property-table"><tbody>';
    strHTML += '<td style="width: 15em;">Node Cost</td><td>' + encodeHTML(d.data['Node Cost']) + '</td>';
    
    // build html
    for (key in d.data) {
        strHTML += '<tr>';
        if (key === 'Output') {
            strHTML += '<td>Output:</td><td>' + encodeHTML(d.data[key]) + '</td>';
            
        } else if (key === 'Total Cost') {
            strHTML += '<td>Total Cost:</td><td>' + encodeHTML(d.data[key]) +
                                        ' <small>(Approx. ' + Math.round(parseFloat(d.data[key]) / (d.data.intTotalCost / 100)) + '% of total cost)</small></td>';
            
        } else if (key === 'Plan Rows') {
            strHTML += '<td>Plan Rows:</td><td>' + encodeHTML(d.data[key]) +
                                        ' <small>(Approx. ' + Math.round(parseFloat(d.data[key]) / (d.data.intTotalRecords / 100)) + '% of total rows)</small></td>';
            
        } else if (key === 'Actual Total Time') {
            strHTML += '<td>Actual Total Time:</td><td>' + encodeHTML(d.data[key]) +
                                        ' <small>(Approx. ' + Math.round(parseFloat(d.data[key]) / (d.data.intTotalTime / 100)) + '% of total time)</small></td>';
            
        } else if (key !== 'Plans'         && key !== 'relatedElement' && key !== 'Node Type' &&
                   key !== 'parent_number' && key !== 'child_number'   && key !== 'parent_object' &&
                   key !== 'column_offset' && key !== 'intTotalCost'   && key !== 'intTotalRecords' &&
                   key !== 'intTotalTime'  && key !== 'Node Cost') {
            strHTML += '<td>' + encodeHTML(key) + '</td><td>' + encodeHTML(d.data[key]) + '</td>';
        }
        strHTML += '</tr>';
    }
    strHTML += '</tbody></table>';
    
    if (evt.deviceType === 'phone') {
        templateElement.setAttribute('data-mode', 'full');
    } else {
        templateElement.setAttribute('data-overlay-close', 'true');
    }
    
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-header><center><h4>{{NODETYPE}}</h4></center></gs-header>
            <gs-body padded>
                {{STRHTML}}
            </gs-body>
            <gs-footer><gs-button dialogclose>Done</gs-button></gs-footer>
        </gs-page>
    */}).replace(/\{\{STRHTML\}\}/gim, strHTML)
        .replace(/\{\{NODETYPE\}\}/gim, d.data['Node Type']);
    
    GS.openDialog(templateElement, 'down');
    //}
}