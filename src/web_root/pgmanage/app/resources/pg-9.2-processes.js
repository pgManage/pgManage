//jslint white:true
var bolProcessesLoaded = true;
/*
function refreshProcessList() {
    'use strict';
    var strQuery;
    
    // the reason why I save the query here is so that I can exclude it in the process list -michael
    strQuery = 'SELECT datname AS "Database"'
                    + ', usename AS "User"'
                    + ', pid AS "PID"'
                    + ', (CASE WHEN waiting = TRUE THEN \'Yes\' ELSE \'No\' END) AS "Waiting?"'
                    + ', to_char(query_start, \'FMMM-FMDD-FMYYYY\') AS "Started Date"'
                    + ', to_char(query_start, \'FMHH:MI:SSpm\') AS "Started Time"'
                    + ', client_addr AS "Client Address"'
                    + ', client_port AS "Client Port"'
                    + ', query AS "Query"\n'
                    + ', state AS "State"\n'
                    + ', application_name AS "Application"\n'
               + 'FROM pg_stat_activity;';
    
    GS.requestRawFromSocket(GS.pgmanageProcessDialogSocket, strQuery, function (data, error) {
        var arrRecords, arrCells, arrTypes, rec_i, rec_len, col_i, col_len, strHTML, tbodyElement, trElement, arrElements, strCurrentQuery, editor;
        
        if (!error) {
            // if query 0
            if (data.intQueryNumber === 0) {
                // if message 0: table with headers
                if (data.intCallbackNumber === 0) {
                    arrCells = data.arrColumnNames;
                    arrTypes = data.arrColumnTypes;
                    
                    //strHTML = '<thead>';
                    //strHTML += '<tr>';
                    //
                    //for (col_i = 0, col_len = arrCells.length; col_i < col_len; col_i += 1) {
                    //    strHTML += '<th>';
                    //    strHTML +=     encodeHTML(GS.decodeFromTabDelimited(arrCells[col_i]));
                    //    //strHTML +=     '<br />';
                    //    //strHTML +=     '<small>';
                    //    //strHTML +=          encodeHTML(GS.decodeFromTabDelimited(arrTypes[col_i]));
                    //    //strHTML +=     '</small>';
                    //    strHTML += '</th>';
                    //}
                    //
                    //strHTML += '<th></th>';
                    //strHTML += '</tr>';
                    //strHTML += '</thead><tbody></tbody>';
                    
                    document.getElementById('process-table').innerHTML = '<thead></thead><tbody></tbody>';
                }
                
                //console.log(data.strMessage);
                if (data.strMessage !== '\\.') {
                    arrRecords = data.strMessage.split('\n');
                    tbodyElement = document.getElementById('process-table').children[1];
                    
                    for (rec_i = 0, rec_len = arrRecords.length; rec_i < rec_len; rec_i += 1) {
                        arrCells = arrRecords[rec_i].split('\t');
                        
                        if (GS.decodeFromTabDelimited(arrCells[8] || '') !== strQuery) {
                            strHTML =
                                '<td style="border: 0 none; padding: 0.25em;">' +
                                    '<gs-grid widths="1,1" reflow-at="500px" gutter padded style="padding-bottom: 0;">' +
                                        '<gs-block>' +
                                            '<div style="border: 1px solid #9f9f9f; padding: 0.25em;">' +
                                                '<b>Database:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[0])) + '<br />' +
                                                '<b>User:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[1])) + '<br />' +
                                                '<b>PID:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[2])) + '<br />' +
                                                '<b>Waiting:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[3])) + '<br />' +
                                                '<b>State:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[9])) + '<br />' +
                                            '</div><br />' +
                                        '</gs-block>' +
                                        '<gs-block>' +
                                            '<div style="border: 1px solid #9f9f9f; padding: 0.25em;">' +
                                                '<b>Started Date:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[4])) + '<br />' +
                                                '<b>Started Time:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[5])) + '<br />' +
                                                '<b>Client Address:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[6])) + '<br />' +
                                                '<b>Client Port:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[7])) + '<br />' +
                                                '<b>Application:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[10])) + '<br />' +
                                            '</div><br />' +
                                        '</gs-block>' +
                                    '</gs-grid>' +
                                    '<gs-button jumbo onclick="stopProcess(' + arrCells[2] + ')" bg-danger>Kill Process</gs-button><br />' +
                                    '<b>Query:</b>' +
                                    '<div class="ace-me" style="margin: 0 1em 1em 1em; border: 1px solid #9f9f9f;"></div>' +
                                '</td>';
                            strCurrentQuery = GS.decodeFromTabDelimited(arrCells[8]);
                            
                            //for (col_i = 0, col_len = arrCells.length; col_i < col_len; col_i += 1) {
                            //    strHTML += '<td>' + encodeHTML(GS.decodeFromTabDelimited(arrCells[col_i])) + '</td>';
                            //}
                            //
                            //strHTML += '<td>' +
                            //                '<gs-button icononly icon="times" onclick="stopProcess(' + arrCells[1] + ')"></gs-button>' +
                            //           '</td>';
                            
                            //console.log(strHTML);
                            
                            trElement = document.createElement('tr');
                            
                            if (rec_i < (rec_len - 1)) {
                                trElement.style.borderBottom = '4px solid #000';
                            }
                            
                            trElement.innerHTML = strHTML;
                            tbodyElement.appendChild(trElement);
                            
                            arrElements = xtag.query(trElement, '.ace-me');
                            editor = ace.edit(arrElements[0]);
                            editor.$blockScrolling = Infinity; // <== blocks a warning
                            editor.setValue(strCurrentQuery);
                            editor.setTheme(localStorage.aceTheme ? localStorage.aceTheme : 'ace/theme/eclipse');
                            editor.getSession().setMode('ace/mode/pgsql');
                            editor.setShowPrintMargin(false);
                            editor.setDisplayIndentGuides(true);
                            editor.setShowFoldWidgets(false);
                            editor.session.setUseWrapMode('free');
                            editor.setBehavioursEnabled(false);
                            editor.setOptions({'maxLines': Infinity});
                            editor.setReadOnly(true);
                            editor.session.selection.setRange(new Range(0, 0, 0, 0));
                        }
                    }
                    
                    if (tbodyElement.children.length === 0) {
                        document.getElementById('process-table').setAttribute('hidden', '');
                        document.getElementById('process-nothing').removeAttribute('hidden');
                    } else {
                        document.getElementById('process-table').removeAttribute('hidden');
                        document.getElementById('process-nothing').setAttribute('hidden', '');
                    }
                    
                // last message: add padding to dialog
                } else {
                    // adding the padding at this point fixes an iphone problem where the dialog
                    //      wouldn't scroll until something was changed or the phone was reoriented
                    document.getElementById('process-table-container').setAttribute('padded', '');
                }
            }
            
        } else {
            GS.removeLoader(document.getElementById('process-table-container'));
            GS.webSocketErrorDialog(data);
        }
    });
}


function dialogProcesses() {
    'use strict';
    var templateElement = document.createElement('template');
    
    // define a seperate socket for the processes dialog if it hasn't been defined already
    if (!GS.pgmanageProcessDialogSocket) {
        GS.pgmanageProcessDialogSocket = GS.openSocket('env');
    }
    
    templateElement.setAttribute('data-overlay-close', 'true');
    templateElement.setAttribute('data-max-width', '1200px');
    templateElement.innerHTML = ml(function () {/a;ldkjf;laksdjf;lksdjf;lskdjf;lakdsjf;lakdsfj*
        <gs-page>
            <gs-header><center><h3>Process Manager</h3></center></gs-header>
            <gs-body id="process-table-container">
                <table id="process-table" hidden></table>
                <center id="process-nothing" hidden><h4>Nothing To Show</h4></center>
            </gs-body>
            <gs-footer><gs-button dialogclose>Done</gs-button></gs-footer>
        </gs-page>
    *a;lskdjfl;kasdjf;lksdjf;laksdjf;lkasdjf;lkasdjf;lksjdf/});
    
    GS.openDialog(templateElement, function () {
        refreshProcessList();
    });
}


*/

function dialogShowProcessQuery(target, intRowIndex) {
    "use strict";
    var templateElement = document.createElement('template');
    var internalData;
    var intColumnIndex;
    var strQuery;
    
    internalData = document.getElementById('datasheet-processes').internalData;
    intColumnIndex = internalData.arrColumnNames.indexOf('query');
    strQuery = internalData.arrRecords[intRowIndex][intColumnIndex];
    
    templateElement.setAttribute('data-overlay-close', 'true');
    templateElement.setAttribute('data-max-width', '1200px');
    templateElement.setAttribute('data-mode', 'constrained');
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-body padded>
                <pre>{{STRQUERY}}</pre>
            </gs-body>
        </gs-page>
    */}).replace(/\{\{STRQUERY\}\}/gi, strQuery);
    
    GS.openDialogToElement(target, templateElement, 'down');
}

function dialogProcesses() {
    "use strict";
    var templateElement = document.createElement('template');
    
    // define a seperate socket for the processes dialog if it hasn't been defined already
    if (!GS.pgmanageProcessDialogSocket) {
        GS.pgmanageProcessDialogSocket = GS.openSocket('env');
    }
    
    templateElement.setAttribute('data-overlay-close', 'true');
    templateElement.setAttribute('data-max-width', '1200px');
    templateElement.setAttribute('data-mode', 'constrained');
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-header><center><h3>Process Manager</h3></center></gs-header>
            <gs-body padded>
                <gs-datasheet id="datasheet-processes" src="pg_catalog.pg_stat_activity"
                            pk="pid" lock="pid" socket="pgmanageProcessDialogSocket" no-filter
                            ord="pid ASC">
                    <template for="table">
                        <table>
                            <thead>
                                <th>#</th>
                                <th style="width: 6em;"></th>
                                <th style="width: 5em;"></th>
                                <th style="width: 8em;">Database</th>
                                <th style="width: 6em;">Process ID</th>
                                <th style="width: 12em;">Username</th>
                                <th style="width: 5em;">Waiting?</th>
                                <th style="width: 4em;">State</th>
                                <th style="width: 25em;">Query</th>
                                <th style="width: 12em;">Application Name</th>
                                <th style="width: 9em;">Client Address</th>
                                <th style="width: 12em;">Client Host</th>
                                <th style="width: 6em;">Client Port</th>
                                <th style="width: 16em;">Backend Start</th>
                                <th style="width: 16em;">Transaction Start</th>
                                <th style="width: 16em;">Query Start</th>
                                <th style="width: 16em;">Last State Change</th>
                            </thead>
                            <tbody>
                                <tr>
                                    <th heading="#">{{! row_number }}</th>
                                    <td heading="" title="Cancel current query for this backend">
                                        {{? row.state.indexOf('idle') === 0 }}
                                            <gs-button onclick="cancelProcess({{! row.pid }})" bg-danger disabled
                                                    style="padding-left: 0; padding-right: 0;">Cancel Query</gs-button>
                                        {{??}}
                                            <gs-button onclick="cancelProcess({{! row.pid }})" bg-danger
                                                    style="padding-left: 0; padding-right: 0;">Cancel Query</gs-button>
                                        {{?}}
                                    </td>
                                    <td heading="" title="Terminate/kill backend">
                                        <gs-button onclick="terminateProcess({{! row.pid }})" bg-danger
                                                    style="padding-left: 0; padding-right: 0;">Terminate</gs-button>
                                    </td>
                                    <td heading="Database"><label>{{! row.datname }}</label></td>
                                    <td heading="Proccess ID"><label>{{! row.pid }}</label></td>
                                    <td heading="Username"><label>{{! row.usename }}</label></td>
                                    <td heading="Waiting?"><label>{{! row.waiting === 'f' ? 'No' : 'Yes' }}</label></td>
                                    <td heading="State">
                                        {{? row.state === 'active' }}
                                            <label title="active: The backend is executing a query.">{{! row.state }}</label>
                                            
                                        {{?? row.state === 'idle' }}
                                            <label title="idle: The backend is waiting for a new client command.">{{! row.state }}</label>
                                            
                                        {{?? row.state === 'idle in transaction' }}
                                            <label title="idle in transaction: The backend is in a transaction, but is not currently executing a query.">{{! row.state }}</label>
                                            
                                        {{?? row.state === 'idle in transaction (aborted)' }}
                                            <label title="idle in transaction (aborted): This state is similar to idle in transaction, except one of the statements in the transaction caused an error.">{{! row.state }}</label>
                                            
                                        {{?? row.state === 'fastpath function call' }}
                                            <label title="fastpath function call: The backend is executing a fast-path function.">{{! row.state }}</label>
                                            
                                        {{?? row.state === 'disabled' }}
                                            <label title="disabled: This state is reported if track_activities is disabled in this backend.">{{! row.state }}</label>
                                        {{?}}
                                    </td>
                                    <td heading="Query">
                                        <gs-button onclick="dialogShowProcessQuery(this, {{! row_number - 1 }})"
                                                    style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;"
                                                    title="Show Query..." bg-primary>
                                            {{! row.query }}
                                        </gs-button>
                                    </td>
                                    <td heading="Application Name"><label>{{! row.application_name }}</label></td>
                                    <td heading="Client Address"><label>{{! row.client_addr }}</label></td>
                                    <td heading="Client Host"><label>{{! row.client_hostname }}</label></td>
                                    <td heading="Client Port"><label>{{! row.client_port }}</label></td>
                                    <td heading="Backend Start"><label>{{! row.backend_start }}</label></td>
                                    <td heading="Transaction Start"><label>{{! row.xact_start }}</label></td>
                                    <td heading="Query Start"><label>{{! row.query_start }}</label></td>
                                    <td heading="Last State Change"><label>{{! row.state_change }}</label></td>
                                </tr>
                            </tbody>
                        </table>
                    </template>
                </gs-datasheet>
            </gs-body>
            <gs-footer><gs-button dialogclose>Done</gs-button></gs-footer>
        </gs-page>
    */});
    
    GS.openDialog(templateElement);
}

function cancelProcess(intPID) {
    GS.msgbox('Are you sure...',
                'Are you sure you want to cancel this query?',
                ['No', 'Yes'],
                function (strAnswer) {
        if (strAnswer === 'Yes') {
            GS.addLoader(document.getElementById('process-table-container'), 'Cancelling Process...');
            GS.requestFromSocket(GS.pgmanageProcessDialogSocket,
                                'RAW\nSELECT pg_cancel_backend(' + intPID + ');',
                                function (response, error) {
                if (!error) {
                    if (response === 'TRANSACTION COMPLETED') {
                        document.getElementById('datasheet-processes').refresh();
                        GS.removeLoader(document.getElementById('process-table-container'));
                    }
                } else {
                    GS.removeLoader(document.getElementById('process-table-container'));
                    GS.ajaxErrorDialog(response);
                }
            });
        }
    });
}

function terminateProcess(intPID) {
    GS.msgbox('Are you sure...',
                'Are you sure you want to terminate this process?',
                ['No', 'Yes'],
                function (strAnswer) {
        if (strAnswer === 'Yes') {
            GS.addLoader(document.getElementById('process-table-container'), 'Terminate Process...');
            GS.requestFromSocket(GS.pgmanageProcessDialogSocket,
                                'RAW\nSELECT pg_terminate_backend(' + intPID + ');',
                                function (response, error) {
                if (!error) {
                    if (response === 'TRANSACTION COMPLETED') {
                        document.getElementById('datasheet-processes').refresh();
                        GS.removeLoader(document.getElementById('process-table-container'));
                    }
                } else {
                    GS.removeLoader(document.getElementById('process-table-container'));
                    GS.ajaxErrorDialog(response);
                }
            });
        }
    });
}







