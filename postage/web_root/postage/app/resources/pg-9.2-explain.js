//jslint white:true multivar:true
var bolExplainLoaded = true;


// call explain then send the data to the handleExplain function
function explain(bolRun) {
    'use strict';
    var currentTab, editor, resultsContainer, strRunQuery, messageID,
        resultsTallyElement, resultsTitleElement, jsnCurrentQuery;
    
    currentTab = document.getElementsByClassName('current-tab')[0];
    editor = currentTab.relatedEditor;
    resultsContainer = currentTab.relatedResultsArea;
    resultsTallyElement = currentTab.relatedResultsTallyElement;
    resultsTitleElement = currentTab.relatedResultsTitleElement;
    jsnCurrentQuery = getCurrentQuery();
    strRunQuery = jsnCurrentQuery.strQuery;
    
    
    
    //currentTab.relatedResultsTitleElement.textContent = 'Query Explain';
    //currentTab.relatedClearButton.setAttribute('hidden', '');
    //currentTab.relatedCopyOptionsButton.setAttribute('hidden', '');
    currentTab.relatedStopButton.removeAttribute('hidden');
    //currentTab.handlingQuery = true;
    //currentTab.relatedResultsHeaderElement.classList.add('executing');
    currentTab.relatedResultsHeaderElement.classList.remove('error');
    currentTab.relatedResultsHeaderElement.classList.remove('executing');
    
    
    
    // request using raw query
    GS.addLoader(editor.container.parentNode.parentNode, 'Getting Explain...');
    messageID = GS.requestRawFromSocket(GS.querySocket,
                            (bolRun ?
                                'EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON) ' :
                                'EXPLAIN (FORMAT JSON, VERBOSE) ') +
                            strRunQuery,
                            function (data, error) {
        var i, len, arrLines, divElement, strError, intLine;
        
        if (!error) {
            // if message 0
            if (data.intCallbackNumber === 0) {
                GS.removeLoader(editor.container.parentNode.parentNode);
                currentTab.relatedStopButton.setAttribute('hidden', '');
                currentTab.relatedClearButton.removeAttribute('disabled');
                
                handleExplain(JSON.parse(GS.decodeFromTabDelimited(data.strMessage)), resultsContainer, bolRun);
            }
            
        } else {
            GS.removeLoader(editor.container.parentNode.parentNode);
            currentTab.relatedStopButton.setAttribute('hidden', '');
            currentTab.relatedClearButton.removeAttribute('disabled');
            //GS.webSocketErrorDialog(data);
            
            arrLines = data.error_text.split('\n');
            
            for (i = 0, len = arrLines.length; i < len; i += 1) {
                if (arrLines[i].substring(0, arrLines[i].indexOf(':')) === 'ERROR') {
                    strError = arrLines[i].substring(arrLines[i].indexOf(':') + 1, arrLines[i].length).trim();
                }
                if (arrLines[i].substring(0, arrLines[i].indexOf(' ')) === 'LINE') {
                    intLine = parseInt(arrLines[i].substring(arrLines[i].indexOf(' ') + 1, arrLines[i].indexOf(':')), 10);
                }
            }
            
            resultsContainer.innerHTML = '';
            divElement = document.createElement('div');
            divElement.innerHTML = '<h4>Query Error:</h4>' +
                                    '<pre>' + encodeHTML(GS.decodeFromTabDelimited(data.error_text)) + '</pre>'; //strError ||
            resultsContainer.appendChild(divElement);
            resultsContainer.appendChild(document.createElement('br'));
            resultsContainer.scrollTop = resultsContainer.scrollHeight + resultsContainer.offsetHeight;
            
            editor.getSession().setAnnotations([
                {'row': jsnCurrentQuery.start_row + (intLine - 1), 'column': parseInt(data.error_position, 10) || 0,
                    'text': strError, 'type': 'error'}
            ]);
            
            editor.scrollToLine((jsnCurrentQuery.start_row + intLine), true, true);
            
            //editor.gotoLine(
            //    (jsnCurrentQuery.start_row + intLine),
            //    (parseInt(data.error_position, 10) || 0),
            //    true
            //);
        }
    });
}

function handleExplain(explainJSON, target, bolRun) {
    'use strict';
    var force = null;

    function dragstarted(d) {
        if (!d3.event.active) force.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) force.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    target.innerHTML = '';
    target.style.padding = '0px';
    target.style.overflow = 'hidden';
    
    var rand = function () {
        return parseInt(('' + Math.random()).substring(2), 10);
    };
    
    var dragStartEvent;
    var antiTranslate = [0,0];
    var previousScale = 1;
    var previousTranslate = [0,0];
    var tmpTrans;
    var rescale = function () {
        trans = d3.event.translate;
        scale = d3.event.scale;
        tmpTrans = trans.slice(0);
        //console.log(scale);
        //console.log(previousScale);
        
        if (scale === previousScale) {
            trans[0] -= antiTranslate[0];
            trans[1] -= antiTranslate[1];
        } else {
            //console.log(trans[0] - previousTranslate[0]);
            trans[0] -= (antiTranslate[0] - (trans[0] - previousTranslate[0]));
            trans[1] -= (antiTranslate[1] - (trans[1] - previousTranslate[1]));
        }
        
        previousTranslate[0] = tmpTrans[0];
        previousTranslate[1] = tmpTrans[1];
        
        previousScale = scale;
        
        svg.attr('transform', 'translate(' + trans + ') ' + 'scale(' + scale + ')');
    };
    
    var color = d3.scaleOrdinal()
                    .domain([])
                    .range(d3.scaleOrdinal(d3.schemeCategory20).range().concat(d3.scaleOrdinal(d3.schemeCategory20c).range()));
    
    var _width = target.clientWidth;
    var _height = target.clientHeight;
    var trans = '0, 0';
    var scale = '1';
    var graph = { nodes: [], links: [] };
    var mousedown_node;
    
    var bolZoom = true;
    
    var svg = d3.select(target)
                    .append('svg')
                        .attr('width', '100%')
                        .attr('height', '100%')
                    .append('g')
                    .call(
                        d3.zoom().on('zoom', function () {
                            if (bolZoom) {
                                rescale();
                            }
                        })
                    )
                    .append('g');
    
    svg.attr('transform', 'translate(' + trans + ') ' + 'scale(' + scale + ')');
    
    svg.append('rect')
        //.attr('width', _width)
        //.attr('height', _height)
        .attr('width', 5000)
        .attr('height', 5000)
        .attr('x', -2000)
        .attr('y', -2000)
        .style('fill', 'transparent');
    
    svg.append('defs')
            .selectAll('marker')
                .data([{'type': 'mid'}])    // Different link/path types can be defined here
                .enter().append('svg:marker') // This section adds in the arrows
            .attr('id', function (d) { return d.type; })
            .attr('viewBox', "0 0 10 10")
            .attr('refX', 1)
            .attr('refY', 5)
            .attr('markerWidth', 15)
            .attr('markerHeight', 15)
            .attr('orient', 'auto')
          .append('path')
            .attr('d', 'M 0 0 L 10 5 L 0 10 z');
    
    var padding = 50; //10 // separation between circles
    var radius = 21.25; //11.25
    var levelTraveler;
    
    // get total records, get total cost, get total time
    var intTotalCost = 0;
    var intTotalRecords = 0;
    var intTotalTime = 0;
    
    levelTraveler = function (levelNumber, numberParent, numberChild, parentObject, jsnLevel) {
        var i, len, arrChildren = jsnLevel.Plans;
        
        intTotalCost += jsnLevel['Total Cost'];
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
    
    // build nodes and links
    var centerX = (_width / 2)
      , centerY = (_height / 2);
    levelTraveler = function (levelNumber, numberParent, numberChild, parentObject, parentNode, jsnLevel) {
        var i, len, arrChildren = jsnLevel.Plans, node = {};
        
        jsnLevel.level = levelNumber;
        jsnLevel.intTotalCost = intTotalCost;
        jsnLevel.intTotalRecords = intTotalRecords;
        jsnLevel.intTotalTime = intTotalTime;
        
        node.data = jsnLevel;
        node.x = (rand() % _width);
        node.y = (rand() % _height);
        node.px = node.x + ((rand() % 20) - 10);
        node.py = node.y + ((rand() % 20) - 10);
        //node.x  = centerX + (levelNumber * 100);
        //node.y  = centerY + (levelNumber * 100);
        //node.px = node.x;
        //node.py = node.y;
        
        graph.nodes.push(node);
        
        if (levelNumber > 0) {
            graph.links.push({
                source: parentNode,
                target: node
            });
        }
        
        // handle child plans
        if (arrChildren) {
            levelNumber += 1;
            for (i = 0, len = arrChildren.length; i < len; i += 1) {
                levelTraveler(levelNumber, numberChild, i, jsnLevel, node, arrChildren[i]);
            }
        }
    };

    levelTraveler(0, 0, 0, '', {}, explainJSON[0].Plan);
    
    force = d3.forceSimulation()
        .nodes(graph.nodes)
        .force("charge", d3.forceManyBody()
            .strength(function () {
                return -600;
            })
        )
        .force("link", d3.forceLink(graph.links)
            .distance(function (d) {
                return 100;
            })//100)
        )
        .force('collide', d3.forceCollide().radius(radius))
        .force('x', d3.forceX(_width / 2).strength(0.2))
        .force('y', d3.forceY(_height / 2).strength(0.2));
        //.gravity(0.06) //0.03 //0.1
        //.size([_width, _height]);
    
    var link = svg.selectAll('.link')
                .data(graph.links).enter()
                //.append('line')
                .append('polyline')
                    .attr('id', function (d) {
                        return 'link' + d.source.index + '_' + d.target.index;
                    })
                    .attr('class', 'link')
                    .attr('marker-mid', 'url(#mid)')
                    .style('fill', 'none')
                    .style('stroke', function (d) { return color(d.target.group); });
    
    var nodes = svg.selectAll('.node')
                .data(graph.nodes).enter()
                .append('rect')
                .attr('class', 'node')
                //.attr('r', radius)
                .style('width', '60px')
                .style('height', '45px')
                .style('fill', function (d) {
                    return (d.data.level === 0 ? '#b0f7eb' : 'transparent'); //#c5c7e2
                })
                .on('mousedown', function (d) {
                    mousedown_node = d.index;
                    // prevent panning during node drag
                    
                    bolZoom = false;
                    //d3.select('#' + target.getAttribute('id') + ' > svg > g').on('.zoom', null);
                })
                .on('click', dialogExplainPlan)
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended)
                );;
    
    var nodesExceptResult = nodes.filter(function (node) {
                                return node.data.level !== 0;
                            });
    
    var resultNode = nodes.filter(function (node) {
                                return node.data.level === 0;
                            });
    
    var node_text = svg.selectAll('.node_text')
                    .data(graph.nodes).enter()
                    .append('foreignObject')
                        .html(function (d) {
                            var strHTML = '';
                            
                            strHTML += '<div style="width: 50px; height: 50px; margin-left: -25px;">';
                            
                            strHTML += '<center style="white-space: nowrap;"><b>' + encodeHTML(d.data['Node Type']) + '</b></center>';
                            
                            strHTML += '<div class="explain-speed-container">'
                            
                            if (d.data['Total Cost']) {
                                strHTML += '<div class="progressbar-outer red" style="height: 0.5em;" title="(red): Percentage of Total Cost.">' +
                                             '<div class="progressbar-inner" ' +
                                              'style="width: ' + (parseFloat(d.data['Total Cost']) / (d.data.intTotalCost / 100)) + '%;"></div>' +
                                            '</div>';
                            }
                            if (d.data['Plan Rows']) {
                                strHTML += '<div class="progressbar-outer blue" style="height: 0.5em;" title="(blue): Percentage of Planned Rows.">' +
                                             '<div class="progressbar-inner" ' +
                                              'style="width: ' + (parseFloat(d.data['Plan Rows']) / (d.data.intTotalRecords / 100)) + '%;"></div>' +
                                            '</div>';
                            }
                            if (d.data['Actual Total Time']) {
                                strHTML += '<div class="progressbar-outer green" style="height: 0.5em;" title="(green): Percentage of Actual Total Time.">' +
                                              '<div class="progressbar-inner" ' +
                                                'style="width: ' + (parseFloat(d.data['Actual Total Time']) / (d.data.intTotalTime / 100)) + '%;">' +
                                              '</div>' +
                                            '</div>';
                            }
                            
                            strHTML += '</div>';
                            strHTML += '</div>';
                            
                            return strHTML;
                        })
                        .attr('height', '50px')
                        .attr('width', '50px')
                        //.text(function (d) {
                        //    d.testname = 'test';
                        //    return d.testname;
                        //})
                        .style('fill', '#000000')
                        .style('overflow', 'visible')
                        .style('font-size', '0.75em')
                        .style('font-family', '"Lucida Console", Monaco, monospace')
                        .on('mousedown', function (d) {
                            d3.event.preventDefault();
                            mousedown_node = d.index;
                            
                            dragStartEvent = d3.event;
                            
                            // prevent panning during node drag
                            bolZoom = false;
                            //d3.select('#' + target.getAttribute('id') + ' > svg > g').on('.zoom', null);
                        })
                        .on('click', dialogExplainPlan)
                        .call(d3.drag()
                            .on("start", dragstarted)
                            .on("drag", dragged)
                            .on("end", dragended)
                        );;
    
    
    window.addEventListener('mouseup', function (dragEndEvent) {
        var jsnMouseStart;
        var jsnMouseEnd;
        
        if (dragStartEvent && bolZoom === false) {
            jsnMouseStart = GS.mousePosition(dragStartEvent);
            jsnMouseEnd = GS.mousePosition(dragEndEvent);
            
            antiTranslate[0] += (jsnMouseEnd.x - jsnMouseStart.x);
            antiTranslate[1] += (jsnMouseEnd.y - jsnMouseStart.y);
            
            dragStartEvent = null;
        }
        bolZoom = true;
        //d3.select('#' + target.getAttribute('id') + ' > svg > g').call(d3.behavior.zoom().on('zoom', rescale));
    });
    
    nodes.append('title').text(function (d) { return d.name; });
    node_text.append('title').text(function (d) { return d.name; });
    
    
    force.on('tick', function (e) {
        //link.attr('x1', function (d) {
        //        return d.target.x;
        //    })
        //    .attr('y1', function (d) {
        //        return d.target.y;
        //    })
        //    .attr('x2', function (d) {
        //        return d.source.x + ((Math.cos(Math.atan2((d.target.y - d.source.y), (d.target.x - d.source.x))) * (radius + 5)));
        //    })
        //    .attr('y2', function (d) {
        //        return d.source.y + ((Math.sin(Math.atan2((d.target.y - d.source.y), (d.target.x - d.source.x))) * (radius + 5)));
        //    });
        
        
        // circles
        //nodes.attr('cx', function (d) { return d.x; })
        //    .attr('cy', function (d) { return d.y; });
        nodes.attr('x', function (d) {
                //if (d.data.level === 0) {
                //    return (_width / 2) - (50 / 2);
                //}
                return d.x - (60 / 2);
            })
            .attr('y', function (d) {
                //if (d.data.level === 0) {
                //    return (_height / 2) - (50 / 2);
                //}
                return d.y - (45 / 2);
            });
        
        node_text.attr('x', function (d) {
                //if (d.data.level === 0) {
                //    return (_width / 2) - (50 / 2);
                //}
                return d.x
            })
            .attr('y', function (d) {
                //if (d.data.level === 0) {
                //    return (_height / 2) - (50 / 2);
                //}
                return d.y - 15; // + 3.75;
            });
        
        link.attr('points', function (d) {
            var intStartX = d.target.x,
                intStartY = d.target.y,
                intEndX = (d.source.x + ((Math.cos(Math.atan2((d.target.y - d.source.y), (d.target.x - d.source.x))) * (radius + 5)))),
                intEndY = (d.source.y + ((Math.sin(Math.atan2((d.target.y - d.source.y), (d.target.x - d.source.x))) * (radius + 5)))),
                intMidX = (intStartX + intEndX) / 2,
                intMidY = (intStartY + intEndY) / 2;
            
            return intStartX + ',' + intStartY + ' ' +
                   intMidX + ',' + intMidY + ' ' +
                   intEndX + ',' + intEndY;
        });
    });
    
    //var levelTraveler, arrNodes = [], i, len, intTotalCost, intTotalRecords,
    //    intTotalTime, layerContainer, currentLayer, currentLevel, currentNode,
    //    lineLayer, strHTML, strNodeType, columnNumber, element, plan_i, plan_len,
    //    arrLineTypes, previousChildNode, childNode, currentLine, line_i, line_len,
    //    strClass, detailHandlerFunction;
    //
    //levelTraveler = function (levelNumber, numberParent, numberChild, parentObject, jsnLevel) {
    //    var i, len, arrChildren = jsnLevel.Plans;
    //    
    //    //console.log(levelNumber, parentObject, jsnLevel, arrChildren);
    //    
    //    jsnLevel.level = levelNumber;
    //    jsnLevel.parent_number = numberParent;
    //    jsnLevel.child_number = numberChild;
    //    jsnLevel.parent_object = parentObject;
    //    
    //    arrNodes.push(jsnLevel);
    //    
    //    // handle child plans
    //    if (arrChildren) {
    //        levelNumber += 1;
    //        for (i = 0, len = arrChildren.length; i < len; i += 1) {
    //            levelTraveler(levelNumber, numberChild, i, jsnLevel, arrChildren[i]);
    //        }
    //    }
    //};
    //
    ////console.log(explainJSON);
    //levelTraveler(0, 0, 0, '', explainJSON[0].Plan);
    //
    //arrNodes.sort(composeComparisons([
    //    function (a, b) { return a.level - b.level; },                 // sort by level
    //    function (a, b) { return a.parent_number - b.parent_number; }, // sort by parent number
    //    function (a, b) { return a.child_number - b.child_number; }    // sort by child number
    //]));
    //
    ////console.log(arrNodes);
    //
    //intTotalCost = 0;
    //intTotalRecords = 0;
    //intTotalTime = 0;
    //
    //// get total records, get total cost, get total time
    //for (i = 0, len = arrNodes.length; i < len; i += 1) {
    //    intTotalCost += arrNodes[i]['Total Cost'];
    //    intTotalRecords += arrNodes[i]['Plan Rows'];
    //    intTotalTime += arrNodes[i]['Actual Total Time'];
    //}
    //
    ////console.log(intTotalCost, intTotalRecords, intTotalTime);
    //
    //var intCurrentOffset = 0,
    //    calculateOffsets = function (originNode) {
    //        var arrPlans = originNode.Plans, currentNode = originNode, firstChildNodes = [], i, len;
    //        
    //        // get first child nodes and set the current column offset on it
    //        while (currentNode) {
    //            //console.log(currentNode);
    //            
    //            currentNode.column_offset = intCurrentOffset;
    //            firstChildNodes.push(currentNode);
    //            currentNode = (currentNode.Plans || [])[0];
    //        }
    //        
    //        // reverse first child nodes so that we can go backwards through
    //        firstChildNodes.reverse();
    //        
    //        //console.log(firstChildNodes);
    //        
    //        // loop through first children
    //        for (i = 0, len = firstChildNodes.length; i < len; i += 1) {
    //            //console.log(firstChildNodes[i + 1]);
    //            //console.log(firstChildNodes[i + 1]['Plans']);
    //            //console.log(firstChildNodes[i + 1]['Plans'][firstChildNodes.child_number + 1]);
    //            //console.log(firstChildNodes[i]);
    //            //console.log(firstChildNodes[i].child_number);
    //            
    //            //
    //            if (firstChildNodes[i + 1] && firstChildNodes[i + 1].Plans &&
    //                firstChildNodes[i + 1].Plans[firstChildNodes[i].child_number + 1]) {
    //                
    //                // increment offset
    //                intCurrentOffset += 1;
    //                
    //                // invoke calculateOffsets on this node
    //                calculateOffsets(firstChildNodes[i + 1].Plans[firstChildNodes[i].child_number + 1]);
    //            }
    //        }
    //        
    //        
    //        // loop through first children in reverse
    //        // every sibling adds one to intCurrentOffset
    //        // check sibling for children by calculateOffsets()
    //    };
    //
    //calculateOffsets(explainJSON[0].Plan);
    //
    //// re-sort for column offset in case of two non-siblings next to each other have the same child number
    //arrNodes.sort(composeComparisons([
    //    function (a, b) { return a.level - b.level; },                 // sort by level
    //    function (a, b) { return a.column_offset - b.column_offset; }, // sort by parent number
    //    function (a, b) { return a.parent_number - b.parent_number; }, // sort by parent number
    //    function (a, b) { return a.child_number - b.child_number; }    // sort by child number
    //]));
    //
    ////console.log(arrNodes);
    //
    //// append layer container
    //layerContainer = document.createElement('div');
    //layerContainer.classList.add('node-container');
    //if (bolRun) {
    //    layerContainer.classList.add('taller-nodes');
    //}
    //
    //if (!evt.touchDevice) {
    //    target.innerHTML = '<gs-scroller><gs-scroller-inner></gs-scroller-inner></gs-scroller>';
    //    target.children[0].children[0].appendChild(layerContainer);
    //    target.children[0].children[0].style.width = (Math.max(layerContainer.outerWidth, target.outerWidth) + 100) + 'px';
    //    target.children[0].children[0].style.height = (Math.max(layerContainer.outerHeight, target.outerHeight) + 100) + 'px';
    //    
    //} else {
    //    target.innerHTML = '';
    //    target.appendChild(layerContainer);
    //}
    //
    //// node detail dialog function
    //detailHandlerFunction = function (node) {
    //    var key, strHTML = '', templateElement = document.createElement('template');
    //    
    //    //console.log(node.relatedNode);
    //    
    //    // build html
    //    for (key in node.relatedNode) {
    //        if (key === 'Output') {
    //            strHTML += (strHTML ? '<hr />' : '') +
    //                       '<b>Output:</b><br />' +
    //                       '&nbsp;&nbsp;&nbsp;&nbsp;' + encodeHTML(node.relatedNode.Output);
    //            
    //        } else if (key === 'Total Cost') {
    //            strHTML += (strHTML ? '<hr />' : '') +
    //                       '<b>Total Cost:</b> ' + encodeHTML(node.relatedNode[key]) +
    //                                        ' <small>(Approx. ' + Math.round(parseFloat(node.relatedNode[key]) / (intTotalCost / 100)) + '% of total cost)</small>';
    //            
    //        } else if (key === 'Plan Rows') {
    //            strHTML += (strHTML ? '<hr />' : '') +
    //                       '<b>Plan Rows:</b> ' + encodeHTML(node.relatedNode[key]) +
    //                                        ' <small>(Approx. ' + Math.round(parseFloat(node.relatedNode[key]) / (intTotalRecords / 100)) + '% of total rows)</small>';
    //            
    //        } else if (key === 'Actual Total Time') {
    //            strHTML += (strHTML ? '<hr />' : '') +
    //                       '<b>Actual Total Time:</b> ' + encodeHTML(node.relatedNode[key]) +
    //                                        ' <small>(Approx. ' + Math.round(parseFloat(node.relatedNode[key]) / (intTotalTime / 100)) + '% of total time)</small>';
    //            
    //        } else if (key !== 'Plans' && key !== 'relatedElement' && key !== 'Node Type' &&
    //                   key !== 'parent_number' && key !== 'child_number' && key !== 'parent_object' &&
    //                   key !== 'column_offset') {
    //            strHTML += (strHTML ? '<hr />' : '') + 
    //                       '<b>' + encodeHTML(key) + ': </b>' + encodeHTML(node.relatedNode[key]);
    //        }
    //    }
    //    
    //    
    //    if (evt.deviceType !== 'phone') {
    //        templateElement.setAttribute('data-max-width', '500px');
    //        templateElement.setAttribute('data-overlay-close', 'true');
    //        templateElement.innerHTML = ml(function () {/*
    //            <gs-page>
    //                <gs-header><center><h4>{{NODETYPE}}</h4></center></gs-header>
    //                <gs-body padded>
    //                    {{STRHTML}}
    //                </gs-body>
    //            </gs-page>
    //        */}).replace(/\{\{STRHTML\}\}/gim, strHTML)
    //            .replace(/\{\{NODETYPE\}\}/gim, node.relatedNode['Node Type']);
    //        
    //        GS.openDialogToElement(node, templateElement, 'down');
    //    } else {
    //        templateElement.setAttribute('data-mode', 'full');
    //        templateElement.innerHTML = ml(function () {/*
    //            <gs-page>
    //                <gs-header><center><h4>{{NODETYPE}}</h4></center></gs-header>
    //                <gs-body padded>
    //                    {{STRHTML}}
    //                </gs-body>
    //                <gs-footer><gs-button dialogclose>Done</gs-button></gs-footer>
    //            </gs-page>
    //        */}).replace(/\{\{STRHTML\}\}/gim, strHTML)
    //            .replace(/\{\{NODETYPE\}\}/gim, node.relatedNode['Node Type']);
    //        
    //        GS.openDialog(templateElement, 'down');
    //    }
    //};
    //
    //// append layers
    //for (i = 0, len = arrNodes.length; i < len; i += 1) {
    //    if (currentLevel !== arrNodes[i].level) {
    //        currentLevel = arrNodes[i].level;
    //        currentLayer = document.createElement('div');
    //        currentLayer.classList.add('node-layer');
    //        layerContainer.appendChild(currentLayer);
    //        
    //        lineLayer = document.createElement('div');
    //        lineLayer.classList.add('line-layer');
    //        layerContainer.appendChild(lineLayer);
    //        
    //        columnNumber = 0;
    //    }
    //    
    //    // append blanks
    //    //console.log(arrNodes[i].column_offset, columnNumber, arrNodes[i]);
    //    while (arrNodes[i].column_offset > columnNumber) {
    //        currentNode = document.createElement('div');
    //        currentNode.classList.add('node');
    //        currentNode.classList.add('blank');
    //        currentNode.textContent = 'alignment text';
    //        currentLayer.appendChild(currentNode);
    //        columnNumber += 1;
    //    }
    //    
    //    // append node
    //    columnNumber += 1;
    //    currentNode = document.createElement('div');
    //    currentNode.classList.add('node');
    //    currentNode.setAttribute('data-parent-id', arrNodes[i].parent_number);
    //    currentNode.setAttribute('data-id', arrNodes[i].child_number);
    //    currentNode.setAttribute('data-index', i);
    //    
    //    arrNodes[i].relatedElement = currentNode;
    //    currentNode.relatedNode = arrNodes[i];
    //    
    //    strNodeType = arrNodes[i]['Node Type'];
    //    
    //    strHTML = '<div class="node-content-container" flex-horizontal flex-fill>' +
    //                '<div class="explain-context-container" flex>' +
    //                    '<b>' + encodeHTML(strNodeType) + '</b><br />';
    //    
    //    
    //    //console.log(arrNodes[i]);
    //    
    //    if (strNodeType === 'Aggregate') {
    //        strHTML += '<small>Strategy: ' + arrNodes[i].Strategy + '</small>';
    //        
    //    } else if (strNodeType === 'Append') {
    //        
    //    } else if (strNodeType === 'Sort') {
    //        
    //    } else if (strNodeType === 'Result') {
    //        
    //    } else if (strNodeType === 'Hash') {
    //        
    //    } else if (strNodeType === 'Hash Join') {
    //        strHTML += '<small>' + arrNodes[i]['Join Type'] + ' Join</small>';
    //        
    //    } else if (strNodeType === 'Seq Scan') {
    //        strHTML += '<small>' +
    //                        'On <u>' +
    //                            (arrNodes[i].Schema ? arrNodes[i].Schema + '.' : '') +
    //                            arrNodes[i]['Relation Name'] +
    //                        '</u>' +
    //                    '</small>';
    //        
    //    } else if (strNodeType === 'Index Scan') {
    //        
    //    }
    //    
    //    strHTML += '</div>' +
    //                '<div class="explain-speed-container">';
    //    
    //    if (arrNodes[i]['Total Cost']) {
    //        strHTML += '<div><small><b>Cost</b></small> ' +
    //                        encodeHTML(
    //                            GS.leftPad(
    //                                (parseFloat(arrNodes[i]['Total Cost']).toFixed(3)),
    //                                'X',
    //                                8
    //                            )
    //                        ).replace(/X/g, '&nbsp;') + '</div>';
    //        strHTML += '<div class="progressbar-outer red">' +
    //                     '<div class="progressbar-inner" ' +
    //                      'style="width: ' + (parseFloat(arrNodes[i]['Total Cost']) / (intTotalCost / 100)) + '%;"></div>' +
    //                    '</div>';
    //    }
    //    
    //    
    //    if (arrNodes[i]['Plan Rows']) {
    //        strHTML += '<div><small><b>Rows</b></small> ' + encodeHTML(arrNodes[i]['Plan Rows']) + '</div>';
    //        strHTML += '<div class="progressbar-outer blue">' +
    //                     '<div class="progressbar-inner" ' +
    //                      'style="width: ' + (parseFloat(arrNodes[i]['Plan Rows']) / (intTotalRecords / 100)) + '%;"></div>' +
    //                    '</div>';
    //    }
    //    
    //    if (arrNodes[i]['Actual Total Time']) {
    //        strHTML += '<div><small><b>Time</b></small> ' +
    //                        encodeHTML(
    //                            GS.leftPad(
    //                                (parseFloat(arrNodes[i]['Actual Total Time']).toFixed(3)),
    //                                'X',
    //                                8
    //                            )
    //                        ).replace(/X/g, '&nbsp;') + '</div>';
    //        strHTML += '<div class="progressbar-outer green">' +
    //                      '<div class="progressbar-inner" ' +
    //                        'style="width: ' + (parseFloat(arrNodes[i]['Actual Total Time']) / (intTotalTime / 100)) + '%;">' +
    //                      '</div>' +
    //                    '</div>';
    //    }
    //    
    //    strHTML += '</div>' +
    //            '</div>';
    //    
    //    currentNode.innerHTML = strHTML;
    //    
    //    if (!evt.touchDevice) {
    //        currentNode.addEventListener('mousedown', function (event) {
    //            this.startMouse = GS.mousePosition(event);
    //            
    //        });
    //        
    //        currentNode.addEventListener('mouseup', function (event) {
    //            this.endMouse = GS.mousePosition(event);
    //            
    //            if (this.startMouse.x === this.endMouse.x && this.startMouse.y === this.endMouse.y) {
    //                detailHandlerFunction(this);
    //            }
    //        });
    //        
    //    } else {
    //        currentNode.addEventListener('click', function () {
    //            detailHandlerFunction(this);
    //        });
    //    }
    //    
    //    currentLayer.appendChild(currentNode);
    //}
    //
    //// draw lines
    //for (i = 0, len = arrNodes.length; i < len; i += 1) {
    //    // if there are children
    //    if (arrNodes[i].Plans) {
    //        arrLineTypes = [];
    //        for (plan_i = 0, plan_len = arrNodes[i].Plans.length; plan_i < plan_len; plan_i += 1) {
    //            childNode = arrNodes[i].Plans[plan_i];
    //            
    //            //first child
    //            //    up, down
    //            //
    //            //subsequent children
    //            //    add right to prev child
    //            //    add as many right,left lines as ((this child column_offset - prev child column_offset) - 1)
    //            //    left, down
    //            
    //            if (plan_i === 0) {
    //                arrLineTypes.push(['up', 'down']);
    //            } else {
    //                arrLineTypes[plan_i - 1].push('right');
    //                
    //                arrLineTypes = arrLineTypes.concat(
    //                    repeat(['left', 'right'], ((childNode.column_offset - previousChildNode.column_offset) - 1))
    //                );
    //                
    //                arrLineTypes.push(['left', 'down']);
    //            }
    //            
    //            previousChildNode = childNode;
    //        }
    //        
    //        // add blank boxes until offset
    //        element = arrNodes[i].relatedElement.parentNode.nextElementSibling;
    //        
    //        //console.log(arrNodes[i]);
    //        //console.log(arrNodes[i].relatedElement);
    //        //console.log(arrNodes[i].relatedElement.parentNode);
    //        //console.log(arrNodes[i].relatedElement.parentNode.nextElementSibling);
    //        
    //        while (arrNodes[i].column_offset > element.children.length) {
    //            currentLine = document.createElement('div');
    //            currentLine.classList.add('line');
    //            element.appendChild(currentLine);
    //        }
    //        
    //        // add line boxes using arrLineTypes
    //        element = arrNodes[i].relatedElement.parentNode.nextElementSibling;
    //        
    //        for (line_i = 0, line_len = arrLineTypes.length; line_i < line_len; line_i += 1) {
    //            currentLine = document.createElement('div');
    //            currentLine.classList.add('line');
    //            
    //            currentLine.innerHTML = '<div class="line-part-1"></div>' +
    //                                    '<div class="line-part-2"></div>' +
    //                                    '<div class="line-arrow"></div>';
    //            
    //            strClass = '';
    //            if (arrLineTypes[line_i].indexOf('up') > -1) {
    //                strClass += (strClass ? '-' : '') + 'up';
    //            }
    //            
    //            if (arrLineTypes[line_i].indexOf('right') > -1) {
    //                strClass += (strClass ? '-' : '') + 'right';
    //            }
    //            
    //            if (arrLineTypes[line_i].indexOf('down') > -1) {
    //                strClass += (strClass ? '-' : '') + 'down';
    //            }
    //            
    //            if (arrLineTypes[line_i].indexOf('left') > -1) {
    //                strClass += (strClass ? '-' : '') + 'left';
    //            }
    //            
    //            if (strClass) {
    //                currentLine.classList.add(strClass);
    //                //currentLine.textContent = strClass;
    //            }
    //            
    //            element.appendChild(currentLine);
    //        }
    //    }
    //}
}

function dialogExplainPlan(event) {
    var element = this, key, strHTML = '', templateElement = document.createElement('template');
    
    // prevents drags from being clicks
    if (d3.event.defaultPrevented) {
        return;
    }
    
    
    //d3.event.stopPropagation();
    
    // build html
    for (key in event.data) {
        if (key === 'Output') {
            strHTML += (strHTML ? '<hr />' : '') +
                       '<b>Output:</b><br />' +
                       '&nbsp;&nbsp;&nbsp;&nbsp;' + encodeHTML(event.data[key]);
            
        } else if (key === 'Total Cost') {
            strHTML += (strHTML ? '<hr />' : '') +
                       '<b>Total Cost:</b> ' + encodeHTML(event.data[key]) +
                                        ' <small>(Approx. ' + Math.round(parseFloat(event.data[key]) / (event.data.intTotalCost / 100)) + '% of total cost)</small>';
            
        } else if (key === 'Plan Rows') {
            strHTML += (strHTML ? '<hr />' : '') +
                       '<b>Plan Rows:</b> ' + encodeHTML(event.data[key]) +
                                        ' <small>(Approx. ' + Math.round(parseFloat(event.data[key]) / (event.data.intTotalRecords / 100)) + '% of total rows)</small>';
            
        } else if (key === 'Actual Total Time') {
            strHTML += (strHTML ? '<hr />' : '') +
                       '<b>Actual Total Time:</b> ' + encodeHTML(event.data[key]) +
                                        ' <small>(Approx. ' + Math.round(parseFloat(event.data[key]) / (event.data.intTotalTime / 100)) + '% of total time)</small>';
            
        } else if (key !== 'Plans'         && key !== 'relatedElement' && key !== 'Node Type' &&
                   key !== 'parent_number' && key !== 'child_number'   && key !== 'parent_object' &&
                   key !== 'column_offset' && key !== 'intTotalCost'   && key !== 'intTotalRecords' &&
                   key !== 'intTotalTime') {
            strHTML += (strHTML ? '<hr />' : '') + 
                       '<b>' + encodeHTML(key) + ': </b>' + encodeHTML(event.data[key]);
        }
    }
    
    //if (evt.deviceType !== 'phone') {
    //    templateElement.setAttribute('data-max-width', '500px');
    //    templateElement.setAttribute('data-overlay-close', 'true');
    //    templateElement.innerHTML = ml(function () {/*
    //        <gs-page>
    //            <gs-header><center><h4>{{NODETYPE}}</h4></center></gs-header>
    //            <gs-body padded>
    //                {{STRHTML}}
    //            </gs-body>
    //        </gs-page>
    //    */}).replace(/\{\{STRHTML\}\}/gim, strHTML)
    //        .replace(/\{\{NODETYPE\}\}/gim, event.data['Node Type']);
    //    
    //    GS.openDialogToElement(element, templateElement, 'down');
    //} else {
    if (evt.deviceType === 'phone') {
        templateElement.setAttribute('data-mode', 'full');
    } else {
        templateElement.setAttribute('data-max-width', '500px');
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
        .replace(/\{\{NODETYPE\}\}/gim, event.data['Node Type']);
    
    GS.openDialog(templateElement, 'down');
    //}
}