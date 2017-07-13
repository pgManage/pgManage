var bolOtherLoaded = true;
var currentTab = document.getElementsByClassName('current-tab')[0];
var bolDebug = false;
var bolPanelDebug = false;
var resultsScroll = 0;
var glb_CSSEditor;

function hideOtherTables(tabnum, safeid) {
    var foundHidden = false;
    var gs_table = xtag.query(document.getElementById('sql-results-area-' + tabnum + '-container'), 'gs-table');
    for (var i = 0, len = gs_table.length; i < len; i++) {
        if (gs_table[i].classList.contains('notHidden')) {
            foundHidden = true;
        }
    }

    for (var i = 0, len = gs_table.length; i < len; i++) {
        if (gs_table[i].getAttribute('id') === safeid) {
            if (!foundHidden) {
                gs_table[i].classList.add('notHidden');
            } else {
                if (gs_table[i].classList.contains('notHidden')) {
                    gs_table[i].classList.remove('notHidden');
                }
            }
        }
    }
}

// fetch info about the current context so that we dont have to load it in muliple places
var contextData = {};
function loadContextData(callback) {
    'use strict';
    var finishFunction = function () {
        if (contextData.databaseName          !== undefined &&
            contextData.sessionUser           !== undefined &&
            contextData.currentUser           !== undefined &&
            contextData.versionNumber         !== undefined &&
            contextData.versionText           !== undefined &&
            contextData.port                  !== undefined &&
            contextData.connectionString      !== undefined &&
            contextData.connectionName        !== undefined &&
            contextData.postageVersion        !== undefined &&
            contextData.userIsSuper           !== undefined &&
            contextData.connectionStringParts !== undefined &&
            contextData.dataDirectory         !== undefined) {
            callback();
        }
    };

    //contextData.postageVersion = '1.0.6';
    contextData.connectionID = window.location.pathname.substring(9).match(/^[0-9]*/)[0];

    // request using raw query
    GS.requestRawFromSocket(GS.envSocket,
                            'SELECT CURRENT_DATABASE(), SESSION_USER, CURRENT_USER, version(), ' +
                                    '(SELECT setting  FROM pg_settings WHERE name = \'port\')::text, ' +
                                    '(SELECT setting  FROM pg_settings WHERE name = \'data_directory\')::text, ' +
                                    '(SELECT rolsuper FROM pg_roles    WHERE rolname = SESSION_USER)::text',
                            function (data, error) {
        var arrColumns;

        if (!error) {
            // if message 0
            if (data.intCallbackNumber === 0) {
                arrColumns = data.strMessage.split('\t');

                contextData.databaseName = arrColumns[0];
                contextData.sessionUser = arrColumns[1];
                contextData.currentUser = arrColumns[2];
                contextData.versionText = arrColumns[3];
                contextData.versionNumber = contextData.versionText.match(/[0-9]+\.[0-9]+\.[0-9]+/)[0];

                // get minor version
                if (contextData.versionNumber.match(/\./g).length === 2) {
                    contextData.minorVersionNumber = contextData.versionNumber.substring(0, contextData.versionNumber.lastIndexOf('.'));
                } else {
                    contextData.minorVersionNumber = contextData.versionNumber;
                }

                contextData.port = arrColumns[4];
                contextData.dataDirectory = arrColumns[5];
                contextData.userIsSuper = arrColumns[6] === 'true';
                finishFunction();
            }

        } else {
            GS.webSocketErrorDialog(data);
        }
    });

    // get connection string
    GS.requestFromSocket(GS.envSocket, 'INFO', function (data, error, errorData) {
        var arrLines, arrCells;

        if (!error) {
            if (data !== 'TRANSACTION COMPLETED') {
                arrLines = data.split('\n');

                arrCells = arrLines[0].split('\t');
                contextData.postageVersion = arrCells[1];

                arrCells = arrLines[1].split('\t');
                arrCells[1] = GS.decodeFromTabDelimited(arrCells[1]);
                contextData.connectionString = arrCells[1];
                contextData.connectionStringParts = contextData.connectionString.substring(contextData.connectionString.indexOf('\t') + 1).split(' ');
                contextData.connectionName = arrCells[1].substring(0, arrCells[1].indexOf('\t'));

                finishFunction();

                //contextData.connectionString = data;
                //contextData.connectionStringParts = contextData.connectionString.substring(
                //                                            contextData.connectionString.indexOf('\t') + 1).split(' ');
                //contextData.connectionName = data.substring(0, data.indexOf('\t'));
                //finishFunction();
            }

        } else {
            GS.webSocketErrorDialog(errorData);
        }
    });
}

function startPanelResize(target) {
    var resizeBarElement = document.createElement('div');

    resizeBarElement.classList.add('panel-resize-bar');

    target.classList.add('panel-resizable');
    target.appendChild(resizeBarElement);

    //localStorage.leftPanelWidth

    // load old width from cookie
    if (parseInt(localStorage.leftPanelWidth, 10)) {
        target.style.width = parseInt(localStorage.leftPanelWidth, 10) + 'px';
    }

    // bind drag
    var dragStartFunction, dragMoveFunction, dragEndFunction;

    dragStartFunction = function (event) {
        document.body.addEventListener(evt.mousemove, dragMoveFunction);
        document.body.addEventListener(evt.mouseup, dragEndFunction);
    };

    dragMoveFunction = function (event) {
        var intCurrentLeft;

        if (event.which === 0 && !evt.touchDevice) {
            event.preventDefault();
            event.stopPropagation();
            dragEndFunction();

        } else {
            intCurrentLeft = GS.mousePosition(event).left;
            //intCurrentLeft = event.clientX;
            target.style.maxWidth = intCurrentLeft + 'px';
            target.style.width = '100%';

            GS.log(bolPanelDebug, 'intCurrentLeft: ' + intCurrentLeft + 'target.style.width: ' + target.style.width);
            event.preventDefault();
            event.stopPropagation();
        }
    };

    dragEndFunction = function (event) {
        elemPos = GS.getElementPositionData(document.getElementById('left-panel-body'));
        // save new width to cookie
        localStorage.leftPanelWidth = target.style.width;

        // trigger resize event
        GS.triggerEvent(window, 'resize');

        // unbind mousemove and mouseup
        document.body.removeEventListener(evt.mousemove, dragMoveFunction);
        document.body.removeEventListener(evt.mouseup, dragEndFunction);
    };

    resizeBarElement.addEventListener(evt.mousedown, dragStartFunction);
}


function menuUser(target) {
    'use strict';
    var templateElement = document.createElement('template');

    templateElement.setAttribute('data-max-width', '15em');
    templateElement.setAttribute('data-overlay-close', 'true');
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-body>
                <gs-button class="postage-menu-item-button" dialogclose no-focus
                        iconleft icon="user-secret" onclick="GS.userChangePassword()">Change Password</gs-button>
                <gs-button class="postage-menu-item-button" dialogclose no-focus
                        iconleft icon="sign-in" target="_blank" href="../index.html" title="Open log in screen in a new tab">Log In</gs-button>
                <gs-button class="postage-menu-item-button" dialogclose no-focus
                        iconleft icon="sign-out" target="_self" href="../auth?action=logout">Log Out</gs-button>
            </gs-body>
        </gs-page>
    */});

    GS.openDialogToElement(target, templateElement, 'down');
}

function buttonReloadWindow() {
    GS.closeAllSockets();
    window.location.reload(true);
    //no GS.loader in postage?
    //GS.loader('reload-lodaer','Reloading the page');
}

function menuTools(target) {
    'use strict';
    var templateElement = document.createElement('template');

    templateElement.setAttribute('data-max-width', '15em');
    templateElement.setAttribute('data-overlay-close', 'true');
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-body>
                <gs-button class="postage-menu-item-button" dialogclose no-focus iconleft icon="line-chart" target="_blank"
                            href="stats.html">Activity Statistics</gs-button>
                <gs-button class="postage-menu-item-button" dialogclose
                            no-focus iconleft icon="tasks" onclick="newTab('processes', 'Process Manager')">Process Manager</gs-button>
                <gs-button class="postage-menu-item-button" dialogclose
                            no-focus iconleft icon="lock" onclick="dialogLocks()">Transaction Locks</gs-button>
                <gs-button class="postage-menu-item-button" dialogclose
                            no-focus iconleft icon="film" onclick="dialogPreparedTransactions()">Prepared Transactions</gs-button>

                <gs-button class="postage-menu-item-button" dialogclose
                            no-focus iconleft icon="list-alt" onclick="dialogReloadConf()">Reload Postgres Conf</gs-button>
                <gs-button class="postage-menu-item-button" dialogclose
                            no-focus iconleft icon="history" onclick="dialogRotateLog()">Rotate Log File</gs-button>

                <gs-button class="postage-menu-item-button" dialogclose
                            no-focus iconleft onclick="dialogStats()" icon="bar-chart-o">Database Info &amp; Stats</gs-button>
                <gs-button class="postage-menu-item-button" dialogclose
                            no-focus iconleft onclick="dialogSettings()" icon="cogs">Server Settings</gs-button>
                <gs-button class="postage-menu-item-button" dialogclose
                            no-focus iconleft onclick="dialogDatabaseInfo()" icon="plug">Connection Info</gs-button>
            </gs-body>
        </gs-page>
    */});

    // dialogAbout()

    GS.openDialogToElement(target, templateElement, 'down');
}

function menuOptions(target) {
    'use strict';
    var templateElement = document.createElement('template');

    templateElement.setAttribute('data-max-width', '15em');
    templateElement.setAttribute('data-overlay-close', 'true');
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-body>
                <gs-button class="postage-menu-item-button" dialogclose
                            no-focus iconleft onclick="dialogSplash()" icon="info">About Postage</gs-button>
                <gs-button class="postage-menu-item-button" dialogclose
                            no-focus iconleft onclick="GS.showShimmed()" icon="heartbeat">Browser Support</gs-button>
                <gs-button class="postage-menu-item-button" dialogclose id="clear-cache-button"
                            no-focus iconleft onclick="buttonReloadWindow()" icon="refresh">Clear Cache</gs-button>
                <gs-button class="postage-menu-item-button" dialogclose no-focus iconleft target="_blank"
                            href="https://github.com/workflowproducts/postage/" icon="github">Postage On Github</gs-button>
                <gs-button class="postage-menu-item-button" dialogclose no-focus iconleft target="_blank"
                            href="https://github.com/workflowproducts/postage/issues" icon="bug">Report An Issue</gs-button>
                <gs-button class="postage-menu-item-button" dialogclose no-focus iconleft onclick="dialogOptions();" icon="gear">Postage Options</gs-button>
            </gs-body>
        </gs-page>
    */});

    // dialogAbout()

    GS.openDialogToElement(target, templateElement, 'down', function () {
        //if we are in electron, remove the clear cache button
        if (window.process && window.process.type === 'renderer') {
            var buttonElement = document.getElementById('clear-cache-button');

            if (buttonElement) {
                buttonElement.parentNode.removeChild(buttonElement);
            }
        }
    });
}

function menuTab(target) {
    'use strict';
    var templateElement = document.createElement('template');

    templateElement.setAttribute('data-max-width', '15em');
    templateElement.setAttribute('data-overlay-close', 'true');
    if (window.process && window.process.type === 'renderer') {
        var app = require('electron').remote.app;
        var path = require('path');
        if (window.opn === undefined) {
            window.opn = require(path.normalize(app.getAppPath() + '/node_modules/opn'));
        }
        templateElement.innerHTML = ml(function () {/*
            <gs-page>
                <gs-body>
                    <gs-button class="postage-menu-item-button" dialogclose iconleft
                            onclick="dialogScriptOpen()" icon="folder-open-o"
                            title="Open a .sql file to a tab" no-focus>Open File...</gs-button>
                    <gs-button onclick="saveCurrentScript()" icon="save" iconleft  class="postage-menu-item-button" title="Save" no-focus>Save File</gs-button>
                    <gs-button id="button-tab-current-save-as" onclick="saveCurrentScript(true)" icon="save" iconleft class="postage-menu-item-button button-save-as" title="Save As..." remove-all no-focus>
                        <span class="save-as-pencil">&#xf040;</span>
                        Save As...
                    </gs-button>
                    <gs-button class="postage-menu-item-button" dialogclose iconleft
                            onclick="newTab('sql', '', {'strContent': '\n\n\n\n\n\n\n\n\n'})" icon="folder-o"
                            title="Create a blank script tab" no-focus id="menu-button-new-tab">
                        <span id="menu-button-new-tab-plus">+</span>
                        New Tab
                    </gs-button>
                    <gs-button class="postage-menu-item-button" dialogclose iconleft
                            onclick="dialogOpenTabs()" no-focus icon="list"
                            title="All open tabs">View All Open Tabs</gs-button>
                    <gs-button class="postage-menu-item-button" dialogclose iconleft
                            onclick="dialogClosedTabs()" no-focus icon="clock-o"
                            title="All closed tabs">View All Closed Tabs</gs-button>
                    <gs-button class="postage-menu-item-button" dialogclose
                            onclick="window.opn('{{TABPATH}}')" no-focus
                            title="Open tab Folder">Open tab Folder</gs-button>
                </gs-body>
            </gs-page>
        */}).replace(/\{\{TABPATH\}\}/gi,
                  process.platform === 'win32'
                ? path.normalize(app.getPath('userData') + '\\sql\\').replace(/\\/g, '\\\\')
                : path.normalize(app.getPath('home') + '/.postage/sql/').replace(/\\/g, '\\\\')
            );
    } else {
        templateElement.innerHTML = ml(function () {/*
            <gs-page>
                <gs-body>
                    <gs-button class="postage-menu-item-button" dialogclose iconleft
                            onclick="dialogScriptUpload()" icon="upload"
                            title="Upload a .sql file to create a script" no-focus>Upload File To Tab</gs-button>
                    <gs-button class="postage-menu-item-button" dialogclose iconleft
                            onclick="newTab('sql', '', {'strContent': '\n\n\n\n\n\n\n\n\n'})" icon="folder-o"
                            title="Create a blank script tab" no-focus id="menu-button-new-tab">
                        <span id="menu-button-new-tab-plus">+</span>
                        New Tab
                    </gs-button>
                    <gs-button class="postage-menu-item-button" dialogclose iconleft
                            onclick="dialogOpenTabs()" no-focus icon="list"
                            title="All open tabs">View All Open Tabs</gs-button>
                    <gs-button class="postage-menu-item-button" dialogclose iconleft
                            onclick="dialogClosedTabs()" no-focus icon="clock-o"
                            title="All closed tabs">View All Closed Tabs</gs-button>
                </gs-body>
            </gs-page>
        */});
    }

    GS.openDialogToElement(target, templateElement, 'down');
}

function dialogReloadConf() {
    "use strict";
    GS.msgbox('Are you sure...',
                'Are you sure you want to reload the Postgres configuration?',
                ['No', 'Yes'],
                function (strAnswer) {
        if (strAnswer === 'Yes') {
            GS.addLoader('reload', 'Reloading Conf...');
            GS.requestFromSocket(GS.envSocket,
                                'RAW\nSELECT pg_reload_conf();',
                                function (response, error) {
                if (!error) {
                    if (response === 'TRANSACTION COMPLETED') {
                        GS.removeLoader('reload');
                        GS.pushMessage('<center><h3>Successfully Reloaded Conf</h3></center>', 1500);
                    }
                } else {
                    GS.removeLoader(document.getElementById('process-table-container'));
                    GS.ajaxErrorDialog(response);
                }
            });
        }
    });
}

function dialogRotateLog() {
    "use strict";
    GS.msgbox('Are you sure...',
                'Are you sure you want to rotate the Postgres log files?',
                ['No', 'Yes'],
                function (strAnswer) {
        if (strAnswer === 'Yes') {
            GS.addLoader('reload', 'Rotating Log...');
            GS.requestFromSocket(GS.envSocket,
                                'RAW\nSELECT pg_rotate_logfile();',
                                function (response, error) {
                if (!error) {
                    if (response === 'TRANSACTION COMPLETED') {
                        GS.removeLoader('reload');
                        GS.pushMessage('<center><h3>Successfully Rotated Log</h3></center>', 1500);
                    }
                } else {
                    GS.removeLoader(document.getElementById('process-table-container'));
                    GS.ajaxErrorDialog(response);
                }
            });
        }
    });
}


function dialogSplash() {
    'use strict';
    var templateElement = document.createElement('template'), afterOpen, beforeClose;
    templateElement.setAttribute('data-mode', 'constrained');
    templateElement.setAttribute('data-overlay-close', 'true');
    templateElement.setAttribute('id', 'dialog-template-version-news');
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-body>
                <div id="splash">
                    <iframe style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; border: 0 none; z-index: 150; background-color: #FFFFFF;" class="full-iframe" src="https://news.workflowproducts.com/splash/postage.html?app=postage&version={{POSTAGE}}&postgres={{POSTGRES}}"></iframe>
                </div>
            </gs-body>
        </gs-page>
    */}).replace(/\{\{POSTAGE\}\}/g, contextData.postageVersion).replace(/\{\{POSTGRES\}\}/g, contextData.versionNumber);
    GS.openDialog(templateElement);

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status !== 200) {
                document.getElementById('splash').innerHTML = ml(function () {/*
                    <gs-container padded>
                        <h2>Postage Version Information & News could not load.</h2>
                        <h3><a href="https://news.workflowproducts.com/splash/postage.html?app=postage&version={{POSTAGE}}&postgres={{POSTGRES}}">https://news.workflowproducts.com/splash/postage.html</a></h3>
                        <h3>This may be an issue with your firewall. Does it block SSL-enabled websites?</h3>
                    </gs-container>
                */}).replace(/\{\{POSTAGE\}\}/g, contextData.postageVersion).replace(/\{\{POSTGRES\}\}/g, contextData.versionNumber);
            };
        };
    };
    xhr.open('HEAD', "https://news.workflowproducts.com/splash/postage.html?app=postage");
    xhr.send();
}


// open a dialog allowing you to change databases
function dialogSwitchDatabase(target) {
    'use strict';
    var templateElement = document.createElement('template'), afterOpen, beforeClose;

    templateElement.setAttribute('data-max-width', '15em');
    templateElement.setAttribute('data-overlay-close', 'true');
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-body id="database-container"></gs-body>
        </gs-page>
    */});

    var arrDatabases, i, len, strHTML = '';
    GS.openDialogToElement(target, templateElement, 'down', function () {
        GS.requestRawFromSocket(GS.envSocket,
                                'SELECT datname::text FROM pg_catalog.pg_database ORDER BY 1',
                                function (data, error) {
            if (!error) {
                // sometimes, the user closes the dialog before the list finishes loading, in this case, just ignore future responses
                if (document.getElementById('database-container')) {
                    // if we have a data packet: build up strHTML with the database names
                    if (data.strMessage !== '\\.' && data.strMessage.trim()) {
                        arrDatabases = data.strMessage.split('\n');

                        for (i = 0, len = arrDatabases.length; i < len; i += 1) {
                            strHTML += (
                                '<gs-button class="postage-menu-item-button" dialogclose no-focus>' +
                                    encodeHTML(GS.decodeFromTabDelimited(arrDatabases[i])) +
                                '</gs-button>'
                            );
                        }

                    // else if we've gotten to the end of the responses: fill the database list
                    } else if (data.strMessage === '\\.') {
                        document.getElementById('database-container').innerHTML =
                            (target.getAttribute('icon') !== 'database' ? '<center><b>Switch Database</b></center>' : '') +
                            strHTML;
                    }
                }

            } else {
                GS.webSocketErrorDialog(data);
            }
        });
    }, function (event, strAnswer) {
        //console.log(strAnswer);
        if (strAnswer !== 'Cancel' && strAnswer !== 'overlay') {
            GS.addLoader('switch-database', 'Switching Database...');
            GS.ajaxJSON('/postage/auth', 'action=change_database&database=' + encodeURIComponent(strAnswer), function (data, error) {
                if (!error) {
                    window.location.reload();
                } else {
                    GS.removeLoader('switch-database');
                    GS.ajaxErrorDialog(data);
                }
            });
        }
    });
}


function dialogLocks() {
    var templateElement = document.createElement('template');

    // define a seperate socket for the processes dialog if it hasn't been defined already
    if (!GS.postageProcessDialogSocket) {
        GS.postageProcessDialogSocket = GS.openSocket('env');
    }

    templateElement.setAttribute('data-max-width', '90em');
    templateElement.setAttribute('data-overlay-close', 'true');
    if (evt.touchDevice) {
        templateElement.setAttribute('data-mode', 'full');
    }
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-header><center><h3>Transaction Locks</h3></center></gs-header>
            <gs-body padded>
                <div id="lock-container" style="position: relative; min-height: 10em;">
                    <table id="lock-table"><tbody></tbody></table>
                    <center id="lock-nothing" hidden><h4>Nothing To Show</h4></center>
                </div>
            </gs-body>
            <gs-footer><gs-button dialogclose>Done</gs-button></gs-footer>
        </gs-page>
    */});

    GS.openDialog(templateElement, function () {
        GS.requestRawFromSocket(GS.postageProcessDialogSocket, infoQuery.locks, function (data, error) {
            var arrRecords, arrCells, arrTypes, rec_i, rec_len, strHTML, tbodyElement, trElement, arrElements, editor;

            if (!error) {
                // if query 0
                if (data.intQueryNumber === 0) {
                    // if message 0: table with headers
                    if (data.intCallbackNumber === 0) {
                        arrCells = data.arrColumnNames;
                        arrTypes = data.arrColumnTypes;
                    }

                    //console.log(data.strMessage);
                    if (data.strMessage !== '\\.') {
                        arrRecords = data.strMessage.split('\n');
                        tbodyElement = xtag.query(document.getElementById('lock-container'), 'tbody')[0];

                        // 0  pid
                        // 1  transactionid
                        // 2  virtualxid
                        // 3  virtualtransaction

                        // 4  database
                        // 5  locktype
                        // 6  mode
                        // 12 username

                        // 7  classid
                        // 8  objid
                        // 9  objsubid
                        // 10 granted
                        // 11 fastpath

                        // 13 start_date
                        // 14 start_time
                        // 15 client_address
                        // 16 client_port

                        // 17 query

                        for (rec_i = 0, rec_len = arrRecords.length; rec_i < rec_len; rec_i += 1) {
                            arrCells = arrRecords[rec_i].split('\t');

                            if (GS.decodeFromTabDelimited(arrCells[17] || '').trim() !== infoQuery.locks.trim()) {
                                strHTML =
                                    '<td style="border: 0 none; padding: 0.25em;">' +
                                        '<gs-grid widths="1,1,1" reflow-at="910px" gutter padded style="padding-bottom: 0;">' +
                                            '<gs-block>' +
                                                '<div style="border: 1px solid #9f9f9f; padding: 0.25em;">' +
                                                    '<b>Database:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[4])) + '<br />' +
                                                    '<b>Proccess ID:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[0])) + '<br />' +
                                                    '<b>Transaction ID:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[1])) + '<br />' +
                                                    '<b>Virtual XID:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[2])) + '<br />' +
                                                    '<b>Virtual Transaction:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[3])) + '<br />' +
                                                    '<b>Granted:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[10] === 't' ? 'YES' : 'NO')) + '<br />' +
                                                '</div><br />' +
                                            '</gs-block>' +
                                            '<gs-block>' +
                                                '<div style="border: 1px solid #9f9f9f; padding: 0.25em;">' +
                                                    '<b>Class ID:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[7])) + '<br />' +
                                                    '<b>Object ID:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[8])) + '<br />' +
                                                    '<b>Sub Object ID:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[9])) + '<br />' +
                                                    '<b>Lock Type:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[5])) + '<br />' +
                                                    '<b>Lock Mode:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[6])) + '<br />' +
                                                    '<b>Fastpath:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[11] === 't' ? 'YES' : 'NO')) + '<br />' +
                                                '</div><br />' +
                                            '</gs-block>' +
                                            '<gs-block>' +
                                                '<div style="border: 1px solid #9f9f9f; padding: 0.25em;">' +
                                                    '<b>Username:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[12])) + '<br />' +
                                                    '<b>Start Date:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[13])) + '<br />' +
                                                    '<b>Start Time:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[14])) + '<br />' +
                                                    '<b>Client Address:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[15])) + '<br />' +
                                                    '<b>Client Port:</b> ' + encodeHTML(GS.decodeFromTabDelimited(arrCells[16])) + '<br />' +
                                                '</div><br />' +
                                            '</gs-block>' +
                                        '</gs-grid>' +
                                        '<b>Query:</b>' +
                                        '<div class="ace-me" style="margin: 0 1em 1em 1em; border: 1px solid #9f9f9f;"></div>' +
                                    '</td>';

                                trElement = document.createElement('tr');

                                if (rec_i < (rec_len - 1)) {
                                    trElement.style.borderBottom = '2px solid #000';
                                }

                                trElement.innerHTML = strHTML;
                                tbodyElement.appendChild(trElement);

                                arrElements = xtag.query(trElement, '.ace-me');
                                editor = ace.edit(arrElements[0]);
                                editor.$blockScrolling = Infinity; // <== blocks a warning
                                editor.setValue(GS.decodeFromTabDelimited(GS.decodeFromTabDelimited(arrCells[17])));
                                editor.setTheme('ace/theme/eclipse');
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
                            document.getElementById('lock-table').setAttribute('hidden', '');
                            document.getElementById('lock-nothing').removeAttribute('hidden');
                        } else {
                            document.getElementById('lock-table').removeAttribute('hidden');
                            document.getElementById('lock-nothing').setAttribute('hidden', '');
                        }

                        document.getElementById('lock-container').style.minHeight = '0';
                    }
                }

            } else {
                GS.removeLoader(document.getElementById('lock-container'));
                GS.webSocketErrorDialog(data);
            }
        });
    });
}
function dialogPreparedTransactions() {
    var templateElement = document.createElement('template');

    templateElement.setAttribute('data-max-width', '90em');
    templateElement.setAttribute('data-overlay-close', 'true');
    if (evt.touchDevice) {
        templateElement.setAttribute('data-mode', 'full');
    }
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-header><center><h3>Prepared Transactions</h3></center></gs-header>
            <gs-body padded>
                <div id="prepared-container" style="position: relative; min-height: 10em;">
                    <table id="prepared-table">
                        <thead>
                            <tr>
                                <th>Transaction Name</th>
                                <th>Transaction #</th>
                                <th>Prepared At</th>
                                <th>Owner</th>
                                <th>Database</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                    <center id="prepared-nothing" hidden><h4>Nothing To Show</h4></center>
                </div>
            </gs-body>
            <gs-footer><gs-button dialogclose>Done</gs-button></gs-footer>
        </gs-page>
    */});

    GS.openDialog(templateElement, function () {
        getListData(infoQuery.preparedTransactions, document.getElementById('prepared-container'), function (arrRecords) {
            var i, len, strHTML = '', tbodyElement;

            tbodyElement = document.getElementById('prepared-table').children[1];

            for (i = 1, len = arrRecords.length; i < len; i += 1) {
                strHTML +=  '<tr>' +
                                '<th>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[i][0])) + '</th>' +
                                '<td>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[i][1])) + '</td>' +
                                '<td>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[i][2])) + '</td>' +
                                '<td>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[i][3])) + '</td>' +
                                '<td>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[i][4])) + '</td>' +
                            '</tr>';
            }

            tbodyElement.innerHTML = strHTML;

            if (tbodyElement.children.length === 0) {
                document.getElementById('prepared-table').setAttribute('hidden', '');
                document.getElementById('prepared-nothing').removeAttribute('hidden');
            } else {
                document.getElementById('prepared-table').removeAttribute('hidden');
                document.getElementById('prepared-nothing').setAttribute('hidden', '');
            }

            document.getElementById('prepared-container').style.minHeight = '0';
        });
    });
}

// open dialog and show server settings
function dialogSettings() {
    'use strict';
    var templateElement = document.createElement('template');

    templateElement.setAttribute('data-max-width', '90em');
    templateElement.setAttribute('data-overlay-close', 'true');
    if (evt.touchDevice) {
        templateElement.setAttribute('data-mode', 'full');
    }
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-header><center><h3>Server Settings</h3></center></gs-header>
            <gs-body padded>
                <div id="parameters-container" style="position: relative; min-height: 10em;"></div>
            </gs-body>
            <gs-footer><gs-button dialogclose>Done</gs-button></gs-footer>
        </gs-page>
    */});

    GS.openDialog(templateElement, function () {
        getListData(propQuery.objectCurrentServer, document.getElementById('parameters-container'), function (arrRecords) {
            var i, len, strHTML = '';

            for (i = 1, len = arrRecords.length; i < len; i += 1) {
                strHTML +=  '<tr>' +
                                '<th style="width: 17em;">' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[i][0])) + '</th>' +
                                '<td>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[i][1])) + '</td>' +
                                '<td>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[i][2])) + '</td>' +
                            '</tr>';
            }

            document.getElementById('parameters-container').innerHTML =
                '<table class="simple-table">' +
                    '<thead>' +
                        '<tr>' +
                            '<th style="width: 17em;">Setting Name</th>' +
                            '<th>Setting Value</th>' +
                            '<th>Description</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody>' +
                        strHTML +
                    '</tbody>' +
                '</table>';
        });
    });
}

var customCSSText;

// Postage Options in localStorage
function dialogOptions() {
    'use strict';
    var templateElement = document.createElement('template');

    //build zoom page list
    var strZoom = '';
    var i, len;
    for (i=0,len=localStorage.length;i < len;i++) {
        var strProp = localStorage.key(i);
        //console.log(strProp);
        if (/^postageZoom/.test(strProp)) {
            strZoom = strZoom + '<tr>' +
                    '<td>' + strProp.toString().replace(/^postageZoom/,'') + '</td>' +
                    '<td style="width: 10em;"><gs-text id="postage-options-left-panel-' + strProp.toString().replace(/^postageZoom/,'') + '"></gs-text></td>' +
                '</tr>';
        }
    }

    templateElement.setAttribute('data-max-width', '90em');
    templateElement.setAttribute('data-overlay-close', 'true');
    if (evt.touchDevice) {
        templateElement.setAttribute('data-mode', 'full');
    }
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-header><center><h3>Postage Options</h3></center></gs-header>
            <gs-body padded>
                <h3>General</h3>

                <div>
                    <label for="postage-options-left-panel" style="min-width: 7.25em;">Panel Width:</label>
                    <gs-text id="postage-options-left-panel"></gs-text>

                    <label for="postage-options-beautify" style="min-width: 7.25em;">Automatic Beautify:</label>
                    <gs-checkbox id="postage-options-beautify"></gs-checkbox>

                    <label for="postage-options-Comma" style="min-width: 7.25em;">Comma First Formatting:</label>
                    <gs-checkbox id="postage-options-Comma"></gs-checkbox>

                    <label>SQL Toolbar Button Style:</label>
                    <gs-optionbox id="button-options" style="padding: 0 0.25em 0.25em 0.25em;">
                        <gs-option value="true">Labeled</gs-option>
                        <gs-option value="false">Unlabeled</gs-option>
                    </gs-optionbox>
                </div>


                <h3>Clip Options</h3>
                <div>
                    <gs-grid widths="1,1" gutter>
                        <gs-block>
                            <gs-optionbox id="clip-options-quote-which" style="padding: 0 0.25em 0.25em 0.25em;">
                                    <label>Escape Values When:</label>
                                    <gs-option value="none">Nothing</gs-option>
                                    <gs-option value="strings">Strings</gs-option>
                                    <gs-option value="all">All Fields</gs-option>
                            </gs-optionbox>
                        </gs-block>
                        <gs-block>
                            <gs-optionbox id="clip-options-column-names" style="padding: 0 0.25em 0.25em 0.25em;">
                                    <label>Include Column Names:</label>
                                    <gs-option value="true">Always</gs-option>
                                    <gs-option value="false">Only When Selected</gs-option>
                            </gs-optionbox>
                        </gs-block>
                    </gs-grid>
                </div>
                <div>
                    <div flex-horizontal>
                        <label for="clip-options-quote-char" style="min-width: 7.25em;">Escape Values with Char:</label>
                        <gs-combo id="clip-options-quote-char" flex>
                            <template>
                                <table>
                                    <tbody>
                                        <tr value="&#34;"><td>(Double Quote)</td></tr>
                                        <tr value="&#39;"><td>(Single Quote)</td></tr>
                                    </tbody>
                                </table>
                            </template>
                        </gs-combo>
                    </div>
                    <div flex-horizontal>
                        <label for="clip-options-field-delimiter" style="min-width: 7.25em;">Field Delimiter:</label>
                        <gs-combo id="clip-options-field-delimiter" flex>
                            <template>
                                <table>
                                    <tbody>
                                        <tr value="&#9;"><td>(Tab)</td></tr>
                                        <tr value="&#44;"><td>(Comma)</td></tr>
                                        <tr value="&#124;"><td>(Vertical Bar)</td></tr>
                                    </tbody>
                                </table>
                            </template>
                        </gs-combo>
                    </div>
                    <div flex-horizontal>
                        <label for="clip-options-null-values" style="min-width: 7.25em;">Null Values:</label>
                        <gs-combo id="clip-options-null-values" flex>
                            <template>
                                <table>
                                    <tbody>
                                        <tr value="&lt;NULL&gt;"><td>&lt;NULL&gt;</td></tr>
                                        <tr value="NULL"><td>NULL</td></tr>
                                        <tr value=""><td>(Nothing)</td></tr>
                                    </tbody>
                                </table>
                            </template>
                        </gs-combo>
                    </div>
                </div>

                <h3>Page Zoom Levels</h3>
                <div style="width: 35em">
                    <!--<div id="options-container" style="position: relative; min-height: 10em;">-->
                    <div id="options-container">
                        <table class="simple-table">
                            <thead>
                                <tr>
                                    <th>Page</th>
                                    <th style="width: 10em;">Setting Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {{ZOOM}}
                            </tbody>
                        </table>
                    </div>
                </div>

                <h3 style="float: left;" id="KeyboardShortCuts">Keyboard Shortcuts</h3>
                <div id="shortcuts-options-container">
                    <table class="simple-table">
                        <thead>
                            <tr>
                                <th style="padding: 0.75em;">Meta Key&nbsp;&nbsp;<gs-button id="metaKeyReset" inline>Reset</gs-button></th>
                                <th style="padding: 0.75em;">Key&nbsp;&nbsp;<gs-button id="keyReset" inline>Reset</gs-button></th>
                                <th style="padding: 0.75em;">Function</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>

                                <td>
                                    <gs-select id="shortcutMetaKeyNewTab" mini>
                                        <option value="Command">Command/Windows Key</option>
                                        <option value="Control">Control</option>
                                        <option value="Option">Option/Alt</option>
                                        <option value="Shift">Shift</option>
                                        <option value="None">None</option>
                                    </gs-select>
                                </td>
                                <td><gs-text id="ShortcutKeyNewTab" mini></gs-text></td>
                                <td><gs-static value="New Tab"></gs-static></td>
                            </tr>
                            <tr>
                                <td>
                                    <gs-select id="shortcutMetaKeySaveTab" mini>
                                        <option value="Command">Command/Windows Key</option>
                                        <option value="Control">Control</option>
                                        <option value="Option">Option/Alt</option>
                                        <option value="Shift">Shift</option>
                                        <option value="None">None</option>
                                    </gs-select>
                                </td>
                                <td><gs-text id="ShortcutKeySaveTab" mini></gs-text></td>
                                <td><gs-static value="Save Tab"></gs-static></td>
                            </tr>
                            <tr>
                                <td>
                                    <gs-select id="shortcutMetaKeyRunQuery" mini>
                                        <option value="Command">Command/Windows Key</option>
                                        <option value="Control">Control</option>
                                        <option value="Option">Option/Alt</option>
                                        <option value="Shift">Shift</option>
                                        <option value="None">None</option>
                                    </gs-select>
                                </td>
                                <td><gs-text id="ShortcutKeyRunQuery" mini></gs-text></td>
                                <td><gs-static value="Run Query"></gs-static></td>
                            </tr>
                            <tr>
                                <td>
                                    <gs-select id="shortcutMetaKeyRunCursorQuery" mini>
                                        <option value="Command">Command/Windows Key</option>
                                        <option value="Control">Control</option>
                                        <option value="Option">Option/Alt</option>
                                        <option value="Shift">Shift</option>
                                        <option value="None">None</option>
                                    </gs-select>
                                </td>
                                <td><gs-text id="ShortcutKeyRunCursorQuery" mini></gs-text></td>
                                <td><gs-static value="Run Query Under Cursor"></gs-static></td>
                            </tr>
                            <tr>
                                <td>
                                    <gs-select id="shortcutMetaKeyFindDocumentation" mini>
                                        <option value="Command">Command/Windows Key</option>
                                        <option value="Control">Control</option>
                                        <option value="Option">Option/Alt</option>
                                        <option value="Shift">Shift</option>
                                        <option value="None">None</option>
                                    </gs-select>
                                </td>
                                <td><gs-text id="ShortcutKeyFindDocumentation" mini></gs-text></td>
                                <td><gs-static value="Find Documentation"></gs-static></td>
                            </tr>
                            <tr>

                                <td>
                                    <gs-select id="shortcutMetaKeyExplain" mini>
                                        <option value="Command">Command/Windows Key</option>
                                        <option value="Control">Control</option>
                                        <option value="Option">Option/Alt</option>
                                        <option value="Shift">Shift</option>
                                        <option value="None">None</option>
                                    </gs-select>
                                </td>
                                <td><gs-text id="ShortcutKeyExplain" mini></gs-text></td>
                                <td><gs-static value="Explain"></gs-static></td>
                            </tr>
                            <tr>

                                <td>
                                    <gs-select id="shortcutMetaKeyExplainAnalyze" mini>
                                        <option value="Command">Command/Windows Key</option>
                                        <option value="Control">Control</option>
                                        <option value="Option">Option/Alt</option>
                                        <option value="Shift">Shift</option>
                                        <option value="None">None</option>
                                    </gs-select>
                                </td>
                                <td><gs-text id="ShortcutKeyExplainAnalyze" mini></gs-text></td>
                                <td><gs-static value="Explain Analyze"></gs-static></td>
                            </tr>
                            <tr>
                                <td>
                                    <gs-select id="shortcutMetaKeyHome" mini>
                                        <option value="Command">Command/Windows Key</option>
                                        <option value="Control">Control</option>
                                        <option value="Option">Option/Alt</option>
                                        <option value="Shift">Shift</option>
                                        <option value="None">None</option>
                                    </gs-select>
                                </td>
                                <td><gs-text id="ShortcutKeyHome" mini></gs-text></td>
                                <td><gs-static value="Home"></gs-static></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h3>Custom CSS Stylesheet</h3>
                <div id="customCSSAce"></div>
                <div><p>This Ace is stored in your local storage. Because this can get emptied it's recommended to save a copy.</p></div>
            </gs-body>
            <gs-footer><gs-button dialogclose id="settingsClose">Done</gs-button></gs-footer>
        </gs-page>
    */}).replace('{{ZOOM}}', strZoom);

    GS.openDialog(templateElement, function () {
        document.getElementById('postage-options-beautify').value = localStorage.bolBeautify;
        document.getElementById('postage-options-beautify').addEventListener('change', function () {
            localStorage.bolBeautify = document.getElementById('postage-options-beautify').value;
        });

        document.getElementById('postage-options-Comma').value = localStorage.bolComma;
        document.getElementById('postage-options-Comma').addEventListener('change', function () {
            localStorage.bolComma = document.getElementById('postage-options-Comma').value;
        });

        document.getElementById('postage-options-left-panel').value = localStorage.leftPanelWidth;
        document.getElementById('postage-options-left-panel').addEventListener('change', function () {
            localStorage.leftPanelWidth = document.getElementById('postage-options-left-panel').value;
        });

        var CSSEditor = ace.edit('customCSSAce');
        glb_CSSEditor = CSSEditor;
        CSSEditor.setTheme('ace/theme/eclipse');
        CSSEditor.getSession().setMode('ace/mode/css');
        CSSEditor.setShowPrintMargin(false);
        CSSEditor.setDisplayIndentGuides(true);
        CSSEditor.setShowFoldWidgets(false);
        CSSEditor.session.setUseWrapMode('free');
        CSSEditor.setBehavioursEnabled(false);
        CSSEditor.$blockScrolling = Infinity; // <== blocks a warning

        CSSEditor.setOptions({
            'enableBasicAutocompletion': true,
            'enableSnippets'           : true,
            'enableLiveAutocompletion' : true
        });

        // if we're on a touch device: make the ace grow with it's content
        if (evt.touchDevice) {
            CSSEditor.setOptions({
                maxLines: Infinity
            });
            document.getElementById('customCSSAce').classList.add('childrenneedsclick');
            document.getElementById('customCSSAce').style.borderBottom = '1px solid #AAAAAA';

        // else: full height
        } else {
            document.getElementById('customCSSAce').style.height = '30em';
        }


        CSSEditor.setValue(localStorage.customCSS);
        CSSEditor.focus();
        CSSEditor.selection.setSelectionRange(new Range(0, 0, 0, 0));
        GS.triggerEvent(document.getElementById('customCSSAce'), 'resize');


        // set control values
        document.getElementById('clip-options-quote-which').value = getClipSetting("quoteType");
        document.getElementById('button-options').value = localStorage.labeledButtons;
        document.getElementById('clip-options-quote-char').value = getClipSetting("quoteChar");
        document.getElementById('clip-options-field-delimiter').value = getClipSetting("fieldDelimiter");
        document.getElementById('clip-options-null-values').value = getClipSetting("nullValues");
        document.getElementById('clip-options-column-names').value = getClipSetting("columnNames");


        document.getElementById('clip-options-quote-which').addEventListener('change', setAllClipSettings);
        document.getElementById('button-options').addEventListener('change', function () {
            refreshButtons(document.getElementById('button-options').value);
            //console.log(document.getElementById('button-options').value);
        });
        CSSEditor.addEventListener('change', function () {
            customCSSText = CSSEditor.getValue();
        });

        if (window.navigator.userAgent.toLowerCase().indexOf('macintosh') !== -1) {
            var CTRLCMD = 'Command';
        } else {
            var CTRLCMD = 'Control';
        }
        localStorage.ShortcutRunCursorQuery = (localStorage.ShortcutRunCursorQuery || [CTRLCMD,     'Enter',   'ShortcutRunCursorQuery']);
        document.getElementById('ShortcutKeyNewTab').value = localStorage.ShortcutNewTab.split(',')[1];
        document.getElementById('ShortcutKeySaveTab').value = localStorage.ShortcutSave.split(',')[1];
        document.getElementById('ShortcutKeyRunQuery').value = localStorage.ShortcutRunQuery.split(',')[1];
        document.getElementById('ShortcutKeyRunCursorQuery').value = localStorage.ShortcutRunCursorQuery.split(',')[1];
        document.getElementById('ShortcutKeyFindDocumentation').value = localStorage.ShortcutDocs.split(',')[1];
        document.getElementById('ShortcutKeyExplain').value = localStorage.ShortcutExplain.split(',')[1];
        document.getElementById('ShortcutKeyExplainAnalyze').value = localStorage.ShortcutExplainAnalyze.split(',')[1];
        document.getElementById('ShortcutKeyHome').value = localStorage.ShortcutHome.split(',')[1];

        document.getElementById('shortcutMetaKeyNewTab').value = (localStorage.ShortcutNewTab.split(',')[0] || 'None');
        document.getElementById('shortcutMetaKeySaveTab').value = (localStorage.ShortcutSave.split(',')[0] || 'None');
        document.getElementById('shortcutMetaKeyRunQuery').value = (localStorage.ShortcutRunQuery.split(',')[0] || 'None');
        document.getElementById('shortcutMetaKeyRunCursorQuery').value = (localStorage.ShortcutRunCursorQuery.split(',')[0] || 'None');
        document.getElementById('shortcutMetaKeyFindDocumentation').value = (localStorage.ShortcutDocs.split(',')[0] || 'None');
        document.getElementById('shortcutMetaKeyExplain').value = (localStorage.ShortcutExplain.split(',')[0] || 'None');
        document.getElementById('shortcutMetaKeyExplainAnalyze').value = (localStorage.ShortcutExplainAnalyze.split(',')[0] || 'None');
        document.getElementById('shortcutMetaKeyHome').value = (localStorage.ShortcutHome.split(',')[0] || 'None');



        document.getElementById('metaKeyReset').addEventListener('click', function (event) {
            if (window.navigator.userAgent.toLowerCase().indexOf('macintosh') !== -1) {
                var CTRLCMD = 'Command';
            } else {
                var CTRLCMD = 'Control';
            }
            document.getElementById('shortcutMetaKeyNewTab').value = CTRLCMD;
            document.getElementById('shortcutMetaKeySaveTab').value = CTRLCMD;
            document.getElementById('shortcutMetaKeyRunQuery').value = 'None';
            document.getElementById('shortcutMetaKeyRunCursorQuery').value = CTRLCMD;
            document.getElementById('shortcutMetaKeyFindDocumentation').value = CTRLCMD;
            document.getElementById('shortcutMetaKeyExplain').value = 'None';
            document.getElementById('shortcutMetaKeyExplainAnalyze').value = 'Shift';
            document.getElementById('shortcutMetaKeyHome').value = 'None';
        });
        document.getElementById('keyReset').addEventListener('click', function (event) {
            document.getElementById('ShortcutKeyNewTab').value = 'o'
            document.getElementById('ShortcutKeySaveTab').value = 's'
            document.getElementById('ShortcutKeyRunQuery').value = 'F5'
            document.getElementById('ShortcutKeyRunCursorQuery').value = 'Enter'
            document.getElementById('ShortcutKeyFindDocumentation').value = '.'
            document.getElementById('ShortcutKeyExplain').value = 'F7'
            document.getElementById('ShortcutKeyExplainAnalyze').value = 'F7'
            document.getElementById('ShortcutKeyHome').value = 'Escape'
        });

        document.getElementById('ShortcutKeyNewTab').addEventListener('keydown', function (event) {
            event.preventDefault();
            event.stopPropagation();
            document.getElementById('ShortcutKeyNewTab').value = event.key;
        });
        document.getElementById('ShortcutKeySaveTab').addEventListener('keydown', function (event) {
            event.preventDefault();
            event.stopPropagation();
            document.getElementById('ShortcutKeySaveTab').value = event.key;
        });
        document.getElementById('ShortcutKeyRunQuery').addEventListener('keydown', function (event) {
            event.preventDefault();
            event.stopPropagation();
            document.getElementById('ShortcutKeyRunQuery').value = event.key;
        });
        document.getElementById('ShortcutKeyRunCursorQuery').addEventListener('keydown', function (event) {
            event.preventDefault();
            event.stopPropagation();
            document.getElementById('ShortcutKeyRunCursorQuery').value = event.key;
        });
        document.getElementById('ShortcutKeyFindDocumentation').addEventListener('keydown', function (event) {
            event.preventDefault();
            event.stopPropagation();
            document.getElementById('ShortcutKeyFindDocumentation').value = event.key;
        });
        document.getElementById('ShortcutKeyExplain').addEventListener('keydown', function (event) {
            event.preventDefault();
            event.stopPropagation();
            document.getElementById('ShortcutKeyExplain').value = event.key;
        });
        document.getElementById('ShortcutKeyExplainAnalyze').addEventListener('keydown', function (event) {
            event.preventDefault();
            event.stopPropagation();
            document.getElementById('ShortcutKeyExplainAnalyze').value = event.key;
        });
        document.getElementById('ShortcutKeyHome').addEventListener('keydown', function (event) {
            event.preventDefault();
            event.stopPropagation();
            document.getElementById('ShortcutKeyHome').value = event.key;
        });

        document.getElementById('clip-options-quote-char').addEventListener('change', setAllClipSettings);
        document.getElementById('clip-options-field-delimiter').addEventListener('change', setAllClipSettings);
        document.getElementById('clip-options-null-values').addEventListener('change', setAllClipSettings);
        document.getElementById('clip-options-column-names').addEventListener('change', setAllClipSettings);

        function setAllClipSettings() {
            var arrElements, i, len;

            // save clip settings
            setClipSetting("quoteType", document.getElementById('clip-options-quote-which').value);
            setClipSetting("quoteChar", document.getElementById('clip-options-quote-char').value);
            setClipSetting("fieldDelimiter", document.getElementById('clip-options-field-delimiter').value);
            setClipSetting("nullValues", document.getElementById('clip-options-null-values').value);
            setClipSetting("columnNames", document.getElementById('clip-options-column-names').value);

            // set all the table elements clip setting attributes
            arrElements = xtag.query(document.getElementsByClassName('current-tab')[0].relatedResultsArea, 'table.results-table');

            for (i = 0, len = arrElements.length; i < len; i += 1) {
                arrElements[i].setAttribute('quote-type', getClipSetting("quoteType"));
                arrElements[i].setAttribute('quote-char', getClipSetting("quoteChar"));
                arrElements[i].setAttribute('field-delimiter', getClipSetting("fieldDelimiter"));
                arrElements[i].setAttribute('null-values', getClipSetting("nullValues"));
                arrElements[i].setAttribute('column-names', getClipSetting("columnNames"));
            }
        }


        var i, len;
        for (i=0,len=localStorage.length;i < len;i++) {
            var strProp = localStorage.key(i);
            //console.log(strProp);
            if (/^postageZoom/.test(strProp)) {
                var strLink = strProp.toString().replace(/^postageZoom/,'');
                console.log('strLink:' + strLink);
                var objZoom = document.getElementById('postage-options-left-panel-' + strLink);
                console.log('objZoom', objZoom);


                objZoom.value = localStorage[strProp];

                objZoom.addEventListener('change', function (event) {
                    localStorage['postageZoom' + event.target.getAttribute('id').replace(/^postage\-options\-left\-panel\-/,'')] =
                        event.target.value;
                });
            }
        }
    }, function () {
        var ValKeyNewTab = document.getElementById('ShortcutKeyNewTab').value;
        var ValKeySaveTab = document.getElementById('ShortcutKeySaveTab').value;
        var ValKeyRunQuery = document.getElementById('ShortcutKeyRunQuery').value;
        var ValKeyRunCursorQuery = document.getElementById('ShortcutKeyRunCursorQuery').value;
        var ValKeyFindDocumentation = document.getElementById('ShortcutKeyFindDocumentation').value;
        var ValKeyExplain = document.getElementById('ShortcutKeyExplain').value;
        var ValKeyExplainAnalyze = document.getElementById('ShortcutKeyExplainAnalyze').value;
        var ValKeyHome = document.getElementById('ShortcutKeyHome').value;
        var ValMetaKeyNewTab = document.getElementById('shortcutMetaKeyNewTab').value;
        var ValMetaKeySaveTab = document.getElementById('shortcutMetaKeySaveTab').value;
        var ValMetaKeyRunQuery = document.getElementById('shortcutMetaKeyRunQuery').value;
        var ValMetaKeyRunCursorQuery = document.getElementById('shortcutMetaKeyRunCursorQuery').value;
        var ValMetaKeyFindDocumentation = document.getElementById('shortcutMetaKeyFindDocumentation').value;
        var ValMetaKeyExplain = document.getElementById('shortcutMetaKeyExplain').value;
        var ValMetaKeyExplainAnalyze = document.getElementById('shortcutMetaKeyExplainAnalyze').value;
        var ValMetaKeyHome = document.getElementById('shortcutMetaKeyHome').value;

        ValMetaKeyNewTab = ((ValMetaKeyNewTab === 'None') ? '' : ValMetaKeyNewTab);
        ValMetaKeySaveTab = ((ValMetaKeySaveTab === 'None') ? '' : ValMetaKeySaveTab);
        ValMetaKeyRunQuery = ((ValMetaKeyRunQuery === 'None') ? '' : ValMetaKeyRunQuery);
        ValMetaKeyFindDocumentation = ((ValMetaKeyFindDocumentation === 'None') ? '' : ValMetaKeyFindDocumentation);
        ValMetaKeyExplain = ((ValMetaKeyExplain === 'None') ? '' : ValMetaKeyExplain);
        ValMetaKeyExplainAnalyze = ((ValMetaKeyExplainAnalyze === 'None') ? '' : ValMetaKeyExplainAnalyze);
        ValMetaKeyHome = ((ValMetaKeyHome === 'None') ? '' : ValMetaKeyHome);

        var ShortcutKeysText = [
              [ValMetaKeyNewTab              ,     ValKeyNewTab,             'ShortcutNewTab']
            , [ValMetaKeyExplain             ,     ValKeyExplain,            'ShortcutExplain']
            , [ValMetaKeyExplainAnalyze      ,     ValKeyExplainAnalyze,     'ShortcutExplainAnalyze']
            , [ValMetaKeyRunQuery            ,     ValKeyRunQuery,           'ShortcutRunQuery']
            , [ValMetaKeySaveTab             ,     ValKeySaveTab,            'ShortcutSave']
            , [ValMetaKeyFindDocumentation   ,     ValKeyFindDocumentation,  'ShortcutDocs']
            , [ValMetaKeyHome                ,     ValKeyHome,               'ShortcutHome']
            , [ValMetaKeyRunCursorQuery      ,     ValKeyRunCursorQuery,     'ShortcutRunCursorQuery']
        ];


        refreshCustomCSS(customCSSText);
        refreshShortcutKeys(ShortcutKeysText);
    });
}





// take a query a pull the comments out
function consumeComments(strScript) {
    'use strict';
    var int_qs = 0 // quote status
      , int_ps = 0 // parenthesis level
      , int_element_len = 0
      , int_tag = 0
      , str_tag = ''
      , arr_str_list = []
      , str_form_data = strScript
      , int_form_data_length = str_form_data.length
      , int_inputstring_len = str_form_data.length
      , str_trailing, ptr_loop = 0, ptr_start = 0, int_chunk_len
      , int_query_start, int_query_end, int_query_length
      , arr_int_open_paren_indexes = [], str_srch_string
      , str_function_quote, int_function_quote_len, ptr_quote_loop
      , bol_function = false;

    // quote status (int_qs) values
    //      0 => no quotes
    //      2 => dollar tag
    //      3 => single quote
    //      4 => double quote
    //      5 => multiline comment
    //      6 => line comment
    //      7 => create function quote

    // special mention:
    //      int_ps is the number of parenthesis we are deep

    //console.log(strScript);
    while (int_inputstring_len > 0) {
        int_element_len += 1;

        //console.log('   input length: ' + int_inputstring_len + '\n' +
        //            ' element length: ' + int_element_len + '\n' +
        //            'current 2 chars: ' + str_form_data.substr(ptr_loop, 2));

        // FOUND MULTILINE COMMENT:
        if (int_qs === 0 && str_form_data.substr(ptr_loop, 2) === "/*") {
            int_qs = 5;
            str_form_data = str_form_data.substring(0, ptr_loop) + ' ' + str_form_data.substring(ptr_loop + 1);
            //console.log("found multiline comment");

        // ENDING MULTILINE COMMENT
        } else if (int_qs === 5 && str_form_data.substr(ptr_loop, 2) === "*/") {
            int_qs = 0;
            str_form_data = str_form_data.substring(0, ptr_loop) + ' ' + str_form_data.substring(ptr_loop + 1);
            str_form_data = str_form_data.substring(0, ptr_loop + 1) + ' ' + str_form_data.substring(ptr_loop + 2);
            //console.log("found end of multiline comment");

        // FOUND DASH COMMENT:
        } else if (int_qs === 0 && str_form_data.substr(ptr_loop, 2) === "--") {
            int_qs = 6;
            str_form_data = str_form_data.substring(0, ptr_loop) + ' ' + str_form_data.substring(ptr_loop + 1);
            //console.log("found dash comment");

        // ENDING DASH COMMENT
        } else if (int_qs === 6 && (str_form_data.substr(ptr_loop, 1) === "\n" || str_form_data.substr(ptr_loop, 1) === "\r")) {
            int_qs = 0;
            //console.log("found end of dash comment");

        // CONSUME COMMENT
        } else if (int_qs === 6 || int_qs === 5) {
            str_form_data =
                str_form_data.substring(0, ptr_loop) +
                (str_form_data[ptr_loop] === '\t' || str_form_data[ptr_loop] === '\n' ? str_form_data[ptr_loop] : ' ') +
                str_form_data.substring(ptr_loop + 1);

            //console.log(str_form_data[ptr_loop], ptr_loop);

        // FOUND SLASH:  we don't skip slashed chars within dollar tags, double quotes and comments.
        } else if (str_form_data.substr(ptr_loop, 1) === "\\" && int_qs !== 4 && int_qs !== 2 && int_qs !== 5 && int_qs !== 6) {
            // skip next character
            ptr_loop += 1;
            int_inputstring_len -= int_chunk_len;
            int_chunk_len = 1;
            int_element_len += int_chunk_len;
            //console.log("found slash ptr_loop: " + ptr_loop);

        // FOUND SINGLE QUOTE:
        } else if (int_qs === 0 && str_form_data.substr(ptr_loop, 1) === "'") {
            int_qs = 3;
            //console.log("found single quote");

        // ENDING SINGLE QUOTE
        } else if (int_qs === 3 && str_form_data.substr(ptr_loop, 1) === "'") {
            int_qs = 0;
            //console.log("found end of single quote");

        // FOUND DOUBLE QUOTE:
        } else if (int_qs === 0 && str_form_data.substr(ptr_loop, 1) === "\"") {
            int_qs = 4;
            //console.log("found double quote");

        // ENDING DOUBLE QUOTE
        } else if (int_qs === 4 && str_form_data.substr(ptr_loop, 1) === "\"") {
            int_qs = 0;
            //console.log("found end of double quote");

        // FOUND OPEN PARENTHESIS:
        } else if (int_qs === 0 && str_form_data.substr(ptr_loop, 1) === "(") {
            int_ps = int_ps + 1;
            arr_int_open_paren_indexes.push(ptr_loop);
            //console.log(' OPEN: ', arr_int_open_paren_indexes);
            //console.log("found open parenthesis");

        // FOUND CLOSE PARENTHESIS
        } else if (int_qs === 0 && str_form_data.substr(ptr_loop, 1) === ")" && int_ps > 0) {
            int_ps = int_ps - 1;

            arr_int_open_paren_indexes.splice(arr_int_open_paren_indexes.length - 1, 1);
            //console.log('CLOSE: ', arr_int_open_paren_indexes);
            //console.log("found close parenthesis");

        // FOUND DOLLAR TAG START:
        } else if (int_qs === 0 && str_form_data.substr(ptr_loop, 1) === "$") {
            // we should be looking ahead here. get the tag or if false start then just continue
            ptr_quote_loop = ptr_loop + 1;
            //console.log("found start dollar");

            while (ptr_quote_loop < int_form_data_length && str_form_data.substr(ptr_quote_loop, 1).match("^[a-zA-Z0-9_]$")) {
                ptr_quote_loop += 1;
            }

            //console.log(ptr_loop, ptr_quote_loop);

            if (str_form_data.substring(ptr_quote_loop, ptr_quote_loop + 1) === "$") {
                int_tag = ptr_quote_loop - (ptr_loop - 1);
                str_tag = str_form_data.substr(ptr_loop, int_tag);

                // we found the end of the tag, now look for the close tag
                ptr_loop += int_tag;
                int_inputstring_len -= int_tag;
                int_element_len += int_tag;
                int_qs = 2;

            } else {
                // false alarm, do nothing
            }

            //console.log(str_tag);

        // END DOLLAR TAG
        } else if (int_qs === 2 && str_form_data.substr(ptr_loop, int_tag) === str_tag) {
            //console.log("found end of dollar", str_tag);
            int_qs = 0;
            // move pointer to end of end dollar tag
            int_tag -= 1;
            int_element_len += int_tag;
            ptr_loop += int_tag;
            int_inputstring_len -= int_tag;

        // FOUND AN UNQUOTED SEMICOLON:
        } else if (int_ps === 0 && int_qs === 0 && str_form_data.substr(ptr_loop, 1) === ";") {
            //console.log("found semicolon >" + ptr_start + "|" + ptr_loop + "<");
            //console.log("found block >" + (str_form_data.substring(ptr_start, ptr_loop)) + "<");

            ptr_start = ptr_loop + 1;
            int_element_len = 0;
        }

        ptr_loop += 1;
        int_inputstring_len -= 1;
    }

    //console.log(str_form_data);
    return str_form_data;
}

function dialogAceInfo() {
var templateElement = document.createElement('template');

var strRunToken =  ((localStorage.ShortcutRunQuery.split(',')[0]) ? localStorage.ShortcutRunQuery.split(',')[0] + '-' : '') + localStorage.ShortcutRunQuery.split(',')[1]
var strNewToken =  ((localStorage.ShortcutNewTab.split(',')[0]) ? localStorage.ShortcutNewTab.split(',')[0] + '-' : '') + localStorage.ShortcutNewTab.split(',')[1]
var strSaveToken =  ((localStorage.ShortcutSave.split(',')[0]) ? localStorage.ShortcutSave.split(',')[0] + '-' : '') + localStorage.ShortcutSave.split(',')[1]
var strDocsToken =  ((localStorage.ShortcutDocs.split(',')[0]) ? localStorage.ShortcutDocs.split(',')[0] + '-' : '') + localStorage.ShortcutDocs.split(',')[1]
var strExpToken =  ((localStorage.ShortcutExplain.split(',')[0]) ? localStorage.ShortcutExplain.split(',')[0] + '-' : '') + localStorage.ShortcutExplain.split(',')[1]
var strExpAnToken =  ((localStorage.ShortcutExplainAnalyze.split(',')[0]) ? localStorage.ShortcutExplainAnalyze.split(',')[0] + '-' : '') + localStorage.ShortcutExplainAnalyze.split(',')[1]
var strHomeToken =  ((localStorage.ShortcutHome.split(',')[0]) ? localStorage.ShortcutHome.split(',')[0] + '-' : '') + localStorage.ShortcutHome.split(',')[1]

    // console.log(strRunToken);
    // console.log(strNewToken);
    // console.log(strSaveToken);
    // console.log(strDocsToken);
    // console.log(strExpToken);
    // console.log(strExpAnToken);
    // console.log(strHomeToken);


    templateElement.setAttribute('data-overlay-close', 'true');
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-header><center><h3>Editor Info</h3></center></gs-header>
            <gs-body padded>
                <i>SQL tab windows use <a href="http://ace.c9.io/" target="_blank">Ace Editor</a>.</i><br /><br />

                Ace is a very capable text editor. Here are some tips to get you started:<br />
                <ul>
                    <li>You can open a hidden preferences panel using the <kbd>CMD-COMMA</kbd> shortcut (might be <kbd>CTRL-COMMA</kbd> on Windows).</li>

                    <li>In the hidden preferences, you can change the input type to "vim" or "emacs" by clicking the dropdown called "Keyboard Handler".</li>

                    <li>Queries won't be syntax highlighted unless the first character of the query is at the beginning of its line or if it's inside a <code>BEGIN...END</code> statement.</li>

                    <li>Ace is double dollar sign aware. When a dollar tag is at the beginning of the line, the contents of the string are syntax highlighted. When the dollar tag is not at the beginning of the line, everything inside is colored as a quoted string.</li>

                    <li>You can type using multiple cursors at once. To select in multiple places, hold down <kbd>CMD</kbd> (<kbd>CTRL</kbd> on Windows) and click in several places. To put a cursor in the same place on multiple lines, hold <kbd>OPTION</kbd> and then click and drag.</li>
                </ul>
                Tab Shortcuts: (Configurable in "Postage Options" <a style="text-decoration: underline; cursor: pointer; color: #0000FF;" onclick="dialogOptions();" dialogclose>Here</a>)<br />
                <ul>
                    <li>Use "{{F5TOKEN}}" to run Queries inside the Ace Editor.</li>

                    <li>Use "{{CTRLOTOKEN}}" to open a new editor tab.</li>

                    <li>Use "{{CTRLSTOKEN}}" to save the currently opened tab.</li>

                    <li>Use "{{DOCSTOKEN}}" to find the PostgreSQL documentation of the currently highlighted keyword.</li>

                    <li>Use "{{EXPTOKEN}}" to run the PostgreSQL Explain function.</li>

                    <li>Use "{{EXPANTOKEN}}" to run the PostgreSQL Explain Analyze function.</li>

                    <li>Use "{{HOMETOKEN}}" to switch between the current tab and the home page.</li>
                </ul>

            </gs-body>
            <gs-footer>
                <gs-button dialogclose>Done</gs-button>
            </gs-footer>
        </gs-page>
    */}).replace(/\{\{F5TOKEN\}\}/gim, strRunToken).replace(/\{\{CTRLOTOKEN\}\}/gim, strNewToken).replace(/\{\{CTRLSTOKEN\}\}/gim, strSaveToken).replace(/\{\{DOCSTOKEN\}\}/gim, strDocsToken).replace(/\{\{EXPTOKEN}\}/gim, strExpToken).replace(/\{\{EXPANTOKEN\}\}/gim, strExpAnToken).replace(/\{\{HOMETOKEN}\}/gim, strHomeToken);

    GS.openDialog(templateElement);
}

function dialogOpenFeedLoadChannelList(bolChooseFirst) {
    'use strict';

    getListData('SELECT pg_listening_channels() AS channel_name', 'current-channels', function (data) {
        var arrChannel = [], i, len, strHTML, strCurrentHTML, jsnUnread = {};

        for (i = 0, len = arrNotification.length; i < len; i += 1) {
            if (arrNotification[i].hasBeenRead === false) {
                jsnUnread[arrNotification[i].strChannel] = (jsnUnread[arrNotification[i].strChannel] || 0);
                jsnUnread[arrNotification[i].strChannel] += 1;

                GS.listAdd(arrChannel, arrNotification[i].strChannel);
            }
        }

        for (i = 1, len = data.length, strHTML = ''; i < len; i += 1) {
            GS.listAdd(arrChannel, data[i][0]);
        }

        //console.log(arrChannel, data);

        for (i = 0, len = arrChannel.length, strHTML = ''; i < len; i += 1) {
            jsnUnread[arrChannel[i]] = jsnUnread[arrChannel[i]] || 0;

            strCurrentHTML =
                '<div class="channel" data-channel-name="' + encodeHTML(arrChannel[i]) + '" ' +
                            (strCurrentChannel === arrChannel[i] ? 'selected' : '') + ' flex-horizontal>' +
                    '<h5 flex>' + encodeHTML(arrChannel[i]) + '</h5>' +
                    '<span class="channel-unread-number ' + (jsnUnread[arrChannel[i]] > 0 ? 'unread': '') + '">' + jsnUnread[arrChannel[i]] + '</span>' +
                    '<gs-button onclick="removeChannelListener(\'' + singleQuoteSafe(arrChannel[i]) + '\');' +
                                        'dialogOpenFeedLoadChannelList();" ' +
                              ' icon="times" class="channel-delete" icononly>&nbsp;</gs-button>' +
                '</div>';

            if (jsnUnread[arrChannel[i]] === 0) {
                strHTML += strCurrentHTML;
            } else {
                strHTML = strHTML + strCurrentHTML;
            }
        }

        document.getElementById('notification-channel-list').innerHTML = strHTML || '';

        if (bolChooseFirst && data[1]) {
            dialogNotificationLoadChannel(data[1][0]);
        }

        if (data.length === 1) {
            document.getElementById('notification-messagebox').setAttribute('disabled', '');
        }
    }, GS.querySocket);
    //getListData('SELECT pg_listening_channels() AS channel_name', 'current-channels', function (data) {
    //    var i, len, strHTML;
    //
    //    for (i = 1, len = data.length, strHTML = ''; i < len; i += 1) {
    //        strHTML +=
    //            '<div style="display: inline-block;">' +
    //                '<gs-button onclick="document.getElementById(\'text-send-channel\').value = \'' + singleQuoteSafe(data[i][0]) + '\';' +
    //                                    'document.getElementById(\'text-send-notification\').focus();" ' +
    //                                'remove-right inline>' + encodeHTML(data[i][0]) + '</gs-button>' +
    //                '<gs-button onclick="removeChannelListener(\'' + singleQuoteSafe(data[i][0]) + '\');' +
    //                                    'dialogOpenFeedLoadChannelList();" ' +
    //                                'remove-left class="button-channel-close" inline icon="times" icononly>&nbsp;</gs-button>&nbsp;' +
    //            '</div>';
    //    }
    //
    //    document.getElementById('listening-channels').innerHTML = strHTML || '<i>You\'re not listening on any channels right now.</i>';
    //});
}


var strCurrentChannel, arrSentNotifications = [];
function dialogOpenFeed() {
    'use strict';
    var templateElement = document.createElement('template'), dynamicUpdate;

    if (evt.touchDevice) {
        templateElement.setAttribute('data-mode', 'full');
    } else {
        templateElement.setAttribute('data-mode', 'constrained');
    }

    templateElement.setAttribute('data-overlay-close', 'true');
    templateElement.setAttribute('data-max-width', '120em');
    templateElement.innerHTML = ml(function () {/*
        <gs-panel id="notification-panel" dismissible>
            <gs-page id="channel-bar" style="width: 17em; min-width: 17em;">
                <gs-header flex-horizontal>
                    <h3 flex>Channels</h3>
                    <gs-button id="button-channel-bar-close" class="header-button" icononly icon="arrow-left" no-focus></gs-button>
                </gs-header>
                <gs-body>
                    <div id="notification-channel-insert" flex-horizontal>
                        <gs-text id="text-notification-channel-insert" flex autocomplete="off" autocapitalize="off" autocorrect="off" placeholder="Channel" spellcheck="false"></gs-text>
                        <span>&nbsp;</span>
                        <gs-button id="button-notification-channel-insert" icononly icon="plus" no-focus></gs-button>
                    </div>
                    <div id="notification-channel-list" autofocus></div>
                </gs-body>
            </gs-page>
            <gs-page>
                <gs-header flex-horizontal>
                    <gs-button id="button-channel-bar-open" class="header-button-text" icon="arrow-right" no-focus hidden>Channels</gs-button>
                    <b>Notifications<span id="notification-current-channel"></span></b>
                    <h3 flex>&nbsp;</h3>
                    <gs-button class="header-button-text" dialogclose no-focus>Close</gs-button>
                </gs-header>
                <gs-body padded id="notification-list"></gs-body>
                <gs-footer>
                    <gs-text id="notification-messagebox" disabled placeholder="Message"></gs-text>
                </gs-footer>
            </gs-page>
        </gs-panel>
    */}).replace(/\{\{VERSION\}\}/gim, contextData.minorVersionNumber);

    dynamicUpdate = function (event) {
        var i, len, jsnMessage = event.jsnMessage
          , elementGenerator = document.createElement('div')
          , notificationList = document.getElementById('notification-list');

        for (i = 0, len = arrSentNotifications.length; i < len; i += 1) {
            if (arrSentNotifications[i].strChannel === jsnMessage.strChannel
             && arrSentNotifications[i].strPayload === jsnMessage.strPayload) {
                jsnMessage.bolUserSent = true;
                jsnMessage.hasBeenRead = true;
                arrSentNotifications.splice(i, 1);
                break;
            }
        }

        if (jsnMessage.strChannel === strCurrentChannel) {
            jsnMessage.hasBeenRead = true;
        }

        elementGenerator.innerHTML = dialogNotificationJsonToMessage(jsnMessage);
        notificationList.appendChild(elementGenerator.children[0]);
        notificationList.scrollTop = notificationList.scrollHeight;
    };

    strCurrentChannel = '';
    GS.openDialog(templateElement, function () {
        var strMessage, strType, strChannel, strPID, strPayload, strHTML = '',
            arrNotifications = GS.querySocket.notifications, i, len, keydownHandler,
            notificationList = document.getElementById('notification-list');

        document.getElementById('button-channel-bar-close').addEventListener('click', function (event) {
            document.getElementById('notification-panel').hide('channel-bar');
            document.getElementById('button-channel-bar-open').removeAttribute('hidden');
        });
        document.getElementById('button-channel-bar-open').addEventListener('click', function (event) {
            document.getElementById('notification-panel').show('channel-bar');
            document.getElementById('button-channel-bar-open').setAttribute('hidden', '');
        });

        // fill notification list
        notificationList.innerHTML = '';

        // scroll notification list down to the bottom
        notificationList.scrollTop = notificationList.scrollHeight;

        // bind dynamic updates
        window.addEventListener('notification-received', dynamicUpdate);

        // get channel list
        dialogOpenFeedLoadChannelList(true);

        // bind channel click
        document.getElementById('notification-channel-list').addEventListener('click', function (event) {
            var target = GS.findParentElement(event.target, '.channel')
              , strChannel = target.getAttribute('data-channel-name');

            if (!event.target.classList.contains('channel-delete')) {
                dialogNotificationLoadChannel(strChannel);
            }
        });

        // return to listen on channel
        document.getElementById('text-notification-channel-insert').addEventListener('keydown', function (event) {
            if (event.keyCode === 13 && this.value) {
                GS.triggerEvent(document.getElementById('button-notification-channel-insert'), 'click');
            }
        });

        // listen on channel button
        document.getElementById('button-notification-channel-insert').addEventListener('click', function (event) {
            var strValue = document.getElementById('text-notification-channel-insert').value;

            if (strValue) {
                addChannelListener(strValue, function () {
                    // load channel into feed
                    dialogNotificationLoadChannel(strValue);

                    // clear control
                    document.getElementById('text-notification-channel-insert').value = '';

                    // refresh channel list
                    dialogOpenFeedLoadChannelList();
                });
            }
        });

        document.getElementById('notification-messagebox').addEventListener('keydown', function (event) {
            var strValue = this.value;

            if (event.keyCode === 13 && strValue && strCurrentChannel) {
                arrSentNotifications.push({'strChannel': strCurrentChannel, 'strPayload': strValue});
                GS.requestRawFromSocket(GS.querySocket,
                                        'NOTIFY ' + quote_ident(strCurrentChannel) +
                                                ',  $message_4_channel$' + strValue + '$message_4_channel$',
                                        function (data, error) {
                    var divElement;

                    if (!error) {
                        if (data.intCallbackNumber === 0) {
                            // clear control
                            document.getElementById('notification-messagebox').value = '';
                        }

                    } else {
                        GS.webSocketErrorDialog(data);
                    }
                });
            }
        });
    }, function () {
        var intBadge, i, len;

        // unbind dynamic updates
        window.removeEventListener('notification-received', dynamicUpdate);

        // set badge
        for (i = 0, len = arrNotification.length, intBadge = 0; i < len; i += 1) {
            if (arrNotification[i].hasBeenRead !== true) {
                intBadge += 1;
            }
        }

        document.getElementById('badge-notification-feed').textContent = intBadge;

        if (intBadge === 0) {
            document.getElementById('badge-notification-feed').setAttribute('hidden', '');
        }
    });
}

function dialogNotificationJsonToMessage(jsnMessage) {
    'use strict';
    var strHTML;

    if (jsnMessage.strType === 'WARNING') {
        strHTML =  '<div class="notify-message"><div class="notify-message-inner">' +
                        '<b>WARNING:</b>' +
                        ' ' + encodeHTML(GS.decodeFromTabDelimited(jsnMessage.strPayload))
                                 .replace(/DETAIL/g, '<br /><b>DETAIL</b>')
                                 .replace(/HINT/g, '<br /><b>HINT</b>') +
                    '</div></div>';
    } else {
        strHTML =   '<div class="notify-message ' + (jsnMessage.bolUserSent === true ? 'text-right' : '') + '">' +
                        '<div class="notify-message-inner">' + encodeHTML(GS.decodeFromTabDelimited(jsnMessage.strPayload)) + '</div>' +
                    '</div>';
    }

    return strHTML;
}

function dialogNotificationLoadChannel(strChannel) {
    'use strict';
    var i, len, strHTML, notificationList, selectedChannel, channelContainer, messageNumberContainer;

    document.getElementById('notification-current-channel').innerHTML = '@' + encodeHTML(strChannel);
    document.getElementById('notification-messagebox').removeAttribute('disabled');

    selectedChannel = xtag.query(document.getElementById('notification-channel-list'), '[selected]')[0];

    if (selectedChannel) {
        selectedChannel.removeAttribute('selected');
    }

    channelContainer = xtag.query(document.getElementById('notification-channel-list'), '[data-channel-name="' + strChannel + '"]')[0];

    if (channelContainer) {
        channelContainer.setAttribute('selected', '');
        messageNumberContainer = xtag.query(channelContainer, '.channel-unread-number')[0];

        if (messageNumberContainer) {
            messageNumberContainer.classList.remove('unread');
            messageNumberContainer.textContent = '0';
        }
    }

    for (i = 0, len = arrNotification.length, strHTML = ''; i < len; i += 1) {
        if (arrNotification[i].strChannel === strChannel) {
            strHTML += dialogNotificationJsonToMessage(arrNotification[i]);
            arrNotification[i].hasBeenRead = true;
        }
    }

    // set current channel global
    strCurrentChannel = strChannel;

    // get notification list container
    notificationList = document.getElementById('notification-list');

    // set notification list html and scroll to the bottom
    notificationList.innerHTML = strHTML;
    notificationList.scrollTop = notificationList.scrollHeight;
}

function clearNotificationList() {
    'use strict';
    document.getElementById('notification-current-channel').innerHTML = '';
    document.getElementById('notification-list').innerHTML = '';
    document.getElementById('notification-messagebox').setAttribute('disabled');
}

function addChannelListener(strName, callback) {
    'use strict';
    var notificationList = document.getElementById('notification-list');

    GS.requestRawFromSocket(GS.querySocket, 'LISTEN ' + quote_ident(strName) + ';', function (data, error) {
        var divElement;

        if (!error) {
            if (data.intCallbackNumber === 0) {
                //divElement = document.createElement('div');
                //divElement.classList.add('text-right');
                //divElement.innerHTML = '<b>@' + encodeHTML(strName) + ':</b> ADDED LISTENER';
                //
                //if (GS.querySocket.notifications.length > 0) {
                //    notificationList.appendChild(document.createElement('hr'));
                //}
                //notificationList.appendChild(divElement);
                //
                //// scroll notification list down to the bottom
                //notificationList.scrollTop = notificationList.scrollHeight;
                //
                //// add message to notification array
                //GS.querySocket.notifications.push('ADDED\t' + GS.encodeForTabDelimited(strName) + '\t\tADDED LISTENER');

                strCurrentChannel = strName;
                dialogOpenFeedLoadChannelList(true);

                if (typeof callback === 'function') {
                    callback();
                }
            }

        } else {
            GS.webSocketErrorDialog(data);
        }
    });
}

function removeChannelListener(strName, callback) {
    'use strict';
    var notificationList = document.getElementById('notification-list');
    var i;
    var len;

    if (strCurrentChannel === strName) {
        strCurrentChannel = '';
        clearNotificationList();
    }

    i = 0;
    len = arrNotification.length;
    while (i < len) {
        if (arrNotification[i].strChannel === strName) {
            arrNotification[i].hasBeenRead = true;
        }
        i += 1;
    }

    GS.requestRawFromSocket(GS.querySocket, 'UNLISTEN ' + quote_ident(strName) + ';', function (data, error) {
        var divElement;

        if (!error) {
            if (data.intCallbackNumber === 0) {
                //divElement = document.createElement('div');
                //divElement.classList.add('text-right');
                //divElement.innerHTML = '<b>@' + encodeHTML(strName) + ':</b> REMOVED LISTENER';
                //
                //if (GS.querySocket.notifications.length > 0) {
                //    notificationList.appendChild(document.createElement('hr'));
                //}
                //notificationList.appendChild(divElement);
                //
                //// scroll notification list down to the bottom
                //notificationList.scrollTop = notificationList.scrollHeight;
                //
                //// add message to notification array
                //GS.querySocket.notifications.push('ADDED\t' + GS.encodeForTabDelimited(strName) + '\t\tREMOVED LISTENER');

                if (typeof callback === 'function') {
                    callback();
                }
            }

        } else {
            GS.webSocketErrorDialog(data);
        }
    });
}



function dialogConfFiles() {
    'use strict';
    var templateElement = document.createElement('template');

    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-header><center><h3>Edit Configuration Files</h3></center></gs-header>
            <gs-body padded>
                <center><b>Which file do you want to edit?</b></center><br />
                <gs-grid reflow-at="480px">
                    <gs-block><gs-button dialogclose>PG Pass</gs-button></gs-block>
                    <gs-block><gs-button dialogclose>postgresql.conf</gs-button></gs-block>
                    <gs-block><gs-button dialogclose>pg_hba.conf</gs-button></gs-block>
                </gs-grid>
            </gs-body>
            <gs-footer>
                <gs-button dialogclose>Cancel</gs-button>
            </gs-footer>
        </gs-page>
    */});

    GS.openDialog(templateElement, '', function (event, strAnswer) {
        if (strAnswer === 'PG Pass') {
            dialogPGPass();

        } else if (strAnswer === 'postgresql.conf') {
            dialogPGConf();

        } else if (strAnswer === 'pg_hba.conf') {
            dialogPGHBA();
        }
    });
}

//function dialogPGPass() {
//    'use strict';
//
//}
//
//function dialogPGConf() {
//    'use strict';
//
//}
//
//function dialogPGHBA() {
//    'use strict';
//
//}

// repeat item in an array
function repeat(element, numberRepeats) {
    'use strict';
    var ret = [];
    while(ret.length < numberRepeats){
        ret.push(element);
    }
    return ret;
}

// create a sort function from an array of sort functions
function composeComparisons(cmpFunctions) {
    'use strict';
     return function (a, b) {
          for (var i = 0, result; i < cmpFunctions.length; i++) {
                result = cmpFunctions[i](a, b);
                if (result) {
                    return result;
                }
          }
          return 0;
     };
}


// load Connection, Database and SESSION_USER into the space in the header
function loadHeaderText() {
    'use strict';
    var i, len, strHost, key, longText, mediumHTML, shortText;

    for (i = 0, len = contextData.connectionStringParts.length; i < len; i += 1) {
        key = contextData.connectionStringParts[i].substring(0, contextData.connectionStringParts[i].indexOf('='));

        if (key === 'host' || key === 'hostaddr') {
            strHost = contextData.connectionStringParts[i].substring(contextData.connectionStringParts[i].indexOf('=') + 1);
            break;
        }
    }

    longText =  'Session User: ' + (contextData.sessionUser) + ' ' +
                'Host: ' + (strHost) + ' ' +
                'Port: ' + (contextData.port) + ' ' +
                'Directory: ' + (contextData.dataDirectory) + ' ' +
                'Db: ' + (contextData.databaseName) + ' ' +
                'Connection: ' + (contextData.connectionName);

    //mediumHTML = encodeHTML(contextData.sessionUser) +
    //                '@' + encodeHTML(strHost) +
    //                ':' + encodeHTML(contextData.port) +
    //                ' (' + encodeHTML(contextData.dataDirectory) + ') ' +
    //                '<small>Db:</small> ' + encodeHTML(contextData.databaseName) + ' ' +
    //                '<small>Connection:</small> ' + encodeHTML(contextData.connectionName);

    shortText = encodeHTML(contextData.databaseName + '@' + contextData.connectionName + '(' + contextData.sessionUser + ')');

    document.getElementById('header-text-container').innerHTML = shortText;
    document.getElementById('header-text-container').setAttribute('title', longText);
}

function dialogConnData(target) {
    var i, len, strHost, key, strHTML
      , templateElement = document.createElement('template');

    for (i = 0, len = contextData.connectionStringParts.length; i < len; i += 1) {
        key = contextData.connectionStringParts[i].substring(0, contextData.connectionStringParts[i].indexOf('='));

        if (key === 'host' || key === 'hostaddr') {
            strHost = contextData.connectionStringParts[i].substring(contextData.connectionStringParts[i].indexOf('=') + 1);
            break;
        }
    }

    strHTML =   '<b>Session User:</b>' + '<br />&nbsp;' + encodeHTML(contextData.sessionUser) + '<br />' +
                '<b>Host:</b>' +         '<br />&nbsp;' + encodeHTML(strHost) + '<br />' +
                '<b>Port:</b>' +         '<br />&nbsp;' + encodeHTML(contextData.port) + '<br />' +
                '<b>Directory:</b>' +    '<br />&nbsp;' + encodeHTML(contextData.dataDirectory) + '<br />' +
                '<b>Database:</b>' +     '<br />&nbsp;' + encodeHTML(contextData.databaseName) + '<br />' +
                '<b>Connection:</b>' +   '<br />&nbsp;' + encodeHTML(contextData.connectionName);

    templateElement.setAttribute('data-max-width', '15em');
    templateElement.setAttribute('data-overlay-close', 'true');
    templateElement.innerHTML = '<gs-page><gs-body padded>' + strHTML + '</gs-body></gs-page>';

    GS.openDialogToElement(target, templateElement, 'down');
}

// open dialog with database statistics
function dialogStats() {
    'use strict';
    var templateElement = document.createElement('template');

    templateElement.setAttribute('data-overlay-close', 'true');
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-header><center><h3>Database Info & Stats</h3></center></gs-header>
            <gs-body padded>
                <center><h4>Database Info</h4></center>
                <div id="database-info-container" style="position: relative; min-height: 10em;"></div><br />
                <center><h4>Database Stats</h4></center>
                <div id="database-stats-container" style="position: relative; min-height: 10em;"></div>
            </gs-body>
            <gs-footer><gs-button dialogclose>Done</gs-button></gs-footer>
        </gs-page>
    */});

    GS.openDialog(templateElement, function () {
        getListData(propQuery.objectDatabase, document.getElementById('database-info-container'), function (arrRecords) {
            var i, len, col_i, col_len, strHTML = '';

            for (col_i = 1, col_len = arrRecords[0].length; col_i < col_len; col_i += 1) {
                strHTML +=  '<tr>' +
                                '<th>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[1][col_i])) + '</th>' +
                                '<td>' + encodeHTML(GS.decodeFromTabDelimited(arrRecords[2][col_i])) + '</td>' +
                            '</tr>';
            }

            document.getElementById('database-info-container').innerHTML = '<table class="table-stats">' + strHTML + '</table>';
        });

        // request using raw query
        GS.addLoader(document.getElementById('database-stats-container'), 'Loading Stats...');
        GS.requestRawFromSocket(GS.envSocket, statQuery.one_database, function (data, error) {
            var arrColumns, strHTML;

            if (!error) {
                // if message 0
                if (data.intCallbackNumber === 0) {
                    GS.removeLoader(document.getElementById('database-stats-container'));
                    arrColumns = data.strMessage.split('\t');

                    strHTML = '';

                    strHTML += '<table class="table-stats">';
                    strHTML += '<tr><th>Statistics Last Reset</th><td>' + encodeHTML(arrColumns[10]) + '</td></tr>';
                    strHTML += '<tr><th>Database Size</th><td>' + encodeHTML(arrColumns[21]) + '</td></tr>';
                    strHTML += '<tr><th>Number Of Backends</th><td>' + encodeHTML(arrColumns[0]) + '</td></tr>';
                    strHTML += '<tr><th>Deadlocks</th><td>' + encodeHTML(arrColumns[18]) + '</td></tr>';
                    strHTML += '</table>';
                    strHTML += '<br/>';

                    strHTML += '<center><h4>Transaction Stats</h4></center>';
                    strHTML += '<table class="table-stats">';
                    strHTML += '<tr><th>Transactions Committed</th><td>' + encodeHTML(arrColumns[1]) + '</td></tr>';
                    strHTML += '<tr><th>Transactions Rolled Back</th><td>' + encodeHTML(arrColumns[2]) + '</td></tr>';
                    strHTML += '</table>';
                    strHTML += '<br/>';

                    strHTML += '<center><h4>Block Use Stats</h4></center>';
                    strHTML += '<table class="table-stats">';
                    strHTML += '<tr><th>Blocks Read</th><td>' + encodeHTML(arrColumns[3]) + '</td></tr>';
                    strHTML += '<tr><th>Blocks Hit</th><td>' + encodeHTML(arrColumns[4]) + '</td></tr>';
                    strHTML += '</table>';
                    strHTML += '<br/>';

                    strHTML += '<center><h4>Block I/O Timing Stats <small>(in milliseconds)</small></h4></center>';
                    strHTML += '<table class="table-stats">';
                    strHTML += '<tr><th>Block Read Time</th><td>' + encodeHTML(arrColumns[19]) + '</td></tr>';
                    strHTML += '<tr><th>Block Write Time</th><td>' + encodeHTML(arrColumns[20]) + '</td></tr>';
                    strHTML += '</table>';
                    strHTML += '<br/>';

                    strHTML += '<center><h4>Tuple Stats</h4></center>';
                    strHTML += '<table class="table-stats">';
                    strHTML += '<tr><th>Tuples Returned</th><td>' + encodeHTML(arrColumns[5]) + '</td></tr>';
                    strHTML += '<tr><th>Tuples Fetched</th><td>' + encodeHTML(arrColumns[6]) + '</td></tr>';
                    strHTML += '<tr><th>Tuples Inserted</th><td>' + encodeHTML(arrColumns[7])+ '</td></tr>';
                    strHTML += '<tr><th>Tuples Updated</th><td>' + encodeHTML(arrColumns[8]) + '</td></tr>';
                    strHTML += '<tr><th>Tuples Deleted</th><td>' + encodeHTML(arrColumns[9]) + '</td></tr>';
                    strHTML += '</table>';
                    strHTML += '<br/>';

                    strHTML += '<center><h4>Cancelled Queries Due To Various Causes</h4></center>';
                    strHTML += '<table class="table-stats">';
                    strHTML += '<tr><th>Pinned Buffers</th><td>' + encodeHTML(arrColumns[11]) + '</td></tr>';
                    strHTML += '<tr><th>Deadlocks</th><td>' + encodeHTML(arrColumns[12]) + '</td></tr>';
                    strHTML += '<tr><th>Lock Timeouts</th><td>' + encodeHTML(arrColumns[13])+ '</td></tr>';
                    strHTML += '<tr><th>Old Snapshots</th><td>' + encodeHTML(arrColumns[14]) + '</td></tr>';
                    strHTML += '<tr><th>Dropped Tablespaces</th><td>' + encodeHTML(arrColumns[15]) + '</td></tr>';
                    strHTML += '</table>';
                    strHTML += '<br/>';

                    strHTML += '<center><h4>Temp File Stats</h4></center>';
                    strHTML += '<table class="table-stats">';
                    strHTML += '<tr><th>Temp Files Created</th><td>' + encodeHTML(arrColumns[16]) + '</td></tr>';
                    strHTML += '<tr><th>Bytes Written To Temp Files</th><td>' + encodeHTML(arrColumns[17]) + '</td></tr>';
                    strHTML += '</table>';
                    strHTML += '<br/>';

                    document.getElementById('database-stats-container').innerHTML = strHTML;
                }

            } else {
                GS.webSocketErrorDialog(data);
            }
        });
    });
}


// open dialog with connection and version info
function dialogDatabaseInfo() {
    'use strict';
    var templateElement = document.createElement('template');

    templateElement.setAttribute('data-overlay-close', 'true');
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-header><center><h3>Database/Connection Info</h3></center></gs-header>
            <gs-body padded>
                <h4><small>CONNECTION STRING:</small> <div id="connection-string">Loading...</div></h4>
                <h4><small>POSTGRES VERSION:</small> <span id="postgres-version">Loading...</span></h4>
                <h4><small>SESSION USER:</small> <span id="session-user">Loading...</span></h4>
                <h4><small>CURRENT USER:</small> <span id="current-user">Loading...</span></h4>
                <h4><small>CURRENT DATABASE:</small> <span id="connection-database">Loading...</span></h4>
                <h4><small>CURRENT PORT:</small> <span id="connection-port">Loading...</span></h4>
                <h4><small>VERSION TEXT:</small> <span id="full-version">Loading...</span></h4>
            </gs-body>
            <gs-footer><gs-button dialogclose>Done</gs-button></gs-footer>
        </gs-page>
    */});

    var bolFirstLoad = true;
    GS.addLoader('context-data', 'Loading...');
    loadContextData(function () {
        if (bolFirstLoad === true) {
            bolFirstLoad = false;
            GS.removeLoader('context-data');
            GS.openDialog(templateElement, function () {
                var arrParts, i, len, strHTML;

                document.getElementById('full-version').textContent = contextData.versionText;
                document.getElementById('postgres-version').textContent = contextData.versionNumber;
                document.getElementById('session-user').textContent = contextData.sessionUser;
                document.getElementById('current-user').textContent = contextData.currentUser;
                document.getElementById('connection-database').textContent = contextData.databaseName;
                document.getElementById('connection-port').textContent = contextData.port;

                strHTML = '&nbsp;&nbsp;&nbsp;&nbsp;<small>connection name=</small>' + encodeHTML(contextData.connectionName);

                arrParts = contextData.connectionStringParts;
                for (i = 0, len = arrParts.length; i < len; i += 1) {
                    if (arrParts[i].trim() !== '') {
                        strHTML +=
                            '<br />' +
                            '&nbsp;&nbsp;&nbsp;&nbsp;' +
                            '<small>' + encodeHTML(arrParts[i].substring(0, arrParts[i].indexOf('='))) + '=</small>' +
                                    encodeHTML(arrParts[i].substring(arrParts[i].indexOf('=') + 1));
                    }
                }

                document.getElementById('connection-string').innerHTML = strHTML;
            });
        }
    });
}

// open dialog with info about postage
function dialogAbout() {
    'use strict';
    var templateElement = document.createElement('template');

    templateElement.setAttribute('data-overlay-close', 'true');
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-header><center><h3>About Postage Version: {{POSTAGE}}</h3></center></gs-header>
            <gs-body padded>

                Postage is a web-based PostgreSQL database development and administration tool.<br />
                Postage utilizes these technologies:<br />
                <ul>
                    <li>doT.js Version 1.0.3 (<a href="http://olado.github.io/doT/" target="_blank">Link</a>)</li>
                    <li>Ace Editor Version 1.1.01 (<a href="http://ace.c9.io/" target="_blank">Link</a>)</li>
                    <li>json_parse.js (modified) Version Unknown (<a href="https://github.com/douglascrockford/JSON-js" target="_blank">Link</a>)</li>
                    <li>d3.js Version 3.5.16 (<a href="https://d3js.org/" target="_blank">Link</a>)</li>
                    <li>libev Version 4.22 (<a href="http://software.schmorp.de/pkg/libev.html" target="_blank">Link</a>)</li>
                    <li>libpq from Postgres Version 9.5.3 (<a href="http://www.postgres.org" target="_blank">Link</a>)</li>
                    <li>
                        libtls API from LibreSSL Version 2.4.0 (<a href="http://www.libressl.org/" target="_blank">Link</a>)<br />
                        <small>We recommend that servers run the latest version of LibreSSL.</small>
                    </li>
                </ul>
                <small>We recommend that users use Google Chrome for best performance.</small><br /><br />
                All other source code and documentation copyright Workflow Products, LLC. All Rights Reserved.<br /><br />
                Postage is built on the Envelope platform. The Envelope platform is available for many platforms and most
                    embedded devices. If you'd like your application built using Envelope technology please contact us.<br /><br />
                Commercial license terms for the Envelope platform are available for a small fee. Contact us for details.<br /><br />
                <center><b>Workflow Products, L.L.C.</b></center>
                <center>7813 Harwood Road</center>
                <center>North Richland Hills Texas 76180</center>
                <center>(817) 503-9545</center>
                <br /><br />
                <i>Copyright &copy; 2016 by Workflow Products, L.L.C.</i>
            </gs-body>
            <gs-footer>
                <gs-button dialogclose>Done</gs-button>
            </gs-footer>
        </gs-page>
    */}).replace(/\{\{POSTAGE\}\}/g, contextData.postageVersion);

    GS.openDialog(templateElement);
}

function getCurrentQuery() {
    GS.log(bolDebug, currentTab);
    var editor = currentTab.relatedEditor,
        editorSelectionRange = editor.getSelectionRange(), strQuery = editor.getValue(),
        intStart = 0, intEnd = 0, i, len, arrLines, strRunQuery,
        intStartRow, intStartColumn, intEndRow, intEndColumn;

    // if an editor was found using the current tab
    if (editor) {
        arrLines = strQuery.split('\n');

        if (editorSelectionRange.start.row !== editorSelectionRange.end.row ||
            editorSelectionRange.start.column !== editorSelectionRange.end.column) {

            intStartRow    = editorSelectionRange.start.row;
            intStartColumn = editorSelectionRange.start.column;
            intEndRow      = editorSelectionRange.end.row;
            intEndColumn   = editorSelectionRange.end.column;

            for (i = 0, len = arrLines.length; i < len; i += 1) {
                if (i < editorSelectionRange.start.row) {
                    intStart += arrLines[i].length + 1;
                }
                if (i < editorSelectionRange.end.row) {
                    intEnd += arrLines[i].length + 1;
                }

                if (i === editorSelectionRange.start.row) {
                    intStart += editorSelectionRange.start.column;
                }
                if (i === editorSelectionRange.end.row) {
                    intEnd += editorSelectionRange.end.column;
                }
                if (i > editorSelectionRange.end.row) {
                    break;
                }
            }

            strRunQuery = strQuery.substring(intStart, intEnd);
        } else {
            intStartRow    = 0;
            intStartColumn = 0;
            intEndRow      = arrLines.length - 1;
            intEndColumn   = arrLines[arrLines.length - 1].length - 1;

            strRunQuery = (strQuery || ' ');
        }
    }

    return {
        'strQuery': (strRunQuery || ''),
        'start_row': intStartRow,
        'start_column': intStartColumn,
        'end_row': intEndRow,
        'end_column': intEndColumn
    };
}

function getClipSetting(propertyName) {
    var savedSettings = JSON.parse(localStorage.clip_settings || '{}');

    savedSettings = {
        "quoteType":      (savedSettings.quoteType || "strings"),
        "quoteChar":      (savedSettings.quoteChar || "'"),
        "fieldDelimiter": (savedSettings.fieldDelimiter || "\t"),
        "nullValues":     (savedSettings.nullValues || "NULL"),
        "columnNames":    (savedSettings.columnNames || "true")
    };

    return savedSettings[propertyName];
}

function setClipSetting(propertyName, newValue) {
    var savedSettings = JSON.parse(localStorage.clip_settings || '{}');

    savedSettings[propertyName] = newValue;

    localStorage.clip_settings = JSON.stringify(savedSettings);
}

function highlightCurrentCursorQuery(tabElement, jsnQueryStart, jsnQueryEnd) {
    "use strict";
    // remove and old yellow highlights
    if (tabElement.openSelectionMarker) {
        tabElement.relatedEditor.getSession().removeMarker(tabElement.openSelectionMarker);
        tabElement.openSelectionMarker = null;
    }
    removeMarkerHighlighted();
    tabElement.openCursorQueryMarker =
        tabElement.relatedEditor.getSession()
            .addMarker(
                new Range(jsnQueryStart.row, jsnQueryStart.column, jsnQueryEnd.row, jsnQueryEnd.column),
                'ace-cursor-query',
                'background'
            );

    //console.log(jsnQueryStart.row, jsnQueryStart.column, jsnQueryEnd.row, jsnQueryEnd.column);

    //console.log(tabElement.openCursorQueryMarker);
    setTimeout(removeMarkerHighlighted, 2500);
}

function removeMarkerHighlighted() {
    var tabElement = currentTab;
    if (tabElement.openCursorQueryMarker) {
        tabElement.relatedEditor.getSession().removeMarker(tabElement.openCursorQueryMarker);
        tabElement.openCursorQueryMarker = null;
    }
}




// this function is run when we send the queries through the websocket,
//      it adds a loader, disables the "Clear" button and shows/binds the "Stop Execution" button
function executeHelperStartExecute() {
    GS.log(bolDebug, currentTab);
    var editor = currentTab.relatedEditor;

    GS.addLoader(editor.container.parentNode.parentNode, 'Executing Query...');
    currentTab.relatedClearButton.setAttribute('hidden', '');
    currentTab.relatedCopyOptionsButton.setAttribute('hidden', '');
    currentTab.handlingQuery = true;
    currentTab.bolIgnoreMessages = false;

    currentTab.relatedResultsHeaderElement.classList.add('executing');
    currentTab.relatedStopButton.removeAttribute('hidden');
    currentTab.relatedStopButton.addEventListener('click', executeHelperCancelSignalHandler);
	//console.log('test1');
    currentTab.relatedStopSocketButton.addEventListener('click', executeHelperStopSocket);
}

// this function is run when we encounter an error or we've recieved the last transmission,
//      it enables the "Clear" button and hides/unbinds the "Stop Loading" button
function executeHelperEndLoading() {
    GS.log(bolDebug, currentTab);
    var editor = currentTab.relatedEditor;

    currentTab.relatedClearButton.removeAttribute('hidden');
    currentTab.relatedResultsHeaderElement.classList.remove('executing');

    if (currentTab.relatedResultsArea.children.length > 0) {
        var spaceHeight = currentTab.relatedResultsArea.lastChild.clientHeight;
        spaceHeight = currentTab.relatedResultsArea.clientHeight - spaceHeight;
        if (spaceHeight < 0) {
            spaceHeight = 0;
        }
        var heightElem = document.createElement('div');
        heightElem.style.height = spaceHeight + 'px';
        currentTab.relatedResultsArea.appendChild(heightElem);
    }

    currentTab.handlingQuery = false;
    currentTab.relatedStopSocketButton.setAttribute('hidden', '');
	//console.log('test2');
    currentTab.relatedStopSocketButton.removeEventListener('click', executeHelperStopSocket);
}

// this function is going to be bound to the "Stop Execution" button,
//      it uses the "currentTab.currentMessageID" variable to send a "CANCEL" signal
//      through the websocket
function executeHelperCancelSignalHandler() {
    GS.log(bolDebug, currentTab);
    GS.requestFromSocket(GS.websockets[currentTab.relatedSocket], 'CANCEL', '', currentTab.currentMessageID);
}

// this function is run when the user clicks "Show Query",
//      it opens a dialog with the query in it
function executeHelperBindShowQueryButton(element, strQuery) {
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
}

// this function is going to be bound to the "Stop Execution" button,
//      it sets the "bolIgnoreMessages" variable to true, meaning the callback for the query execution will not do anything
//      it also changes the results pane header (the tally results portion) to "(Loading Stopped)"
//      it also runs the "executeHelperEndExecute" and "executeHelperEndLoading" functions
function executeHelperStopLoadingHandler() {
    GS.log(bolDebug, currentTab);
    currentTab.bolIgnoreMessages = true;
    currentTab.relatedResultsTallyElement.innerHTML = ' (Loading Stopped)';
    executeHelperEndExecute();
    executeHelperEndLoading();
}

// this function is run when we get our first callback,
//      it removes the loader, hides/unbinds the "Stop Execution" button
function executeHelperEndExecute() {
    GS.log(bolDebug, currentTab);
    var editor = currentTab.relatedEditor;

    GS.removeLoader(editor.container.parentNode.parentNode);

    currentTab.relatedStopButton.setAttribute('hidden', '');
    currentTab.relatedStopButton.removeEventListener('click', executeHelperCancelSignalHandler);
}

// This function updates the results header Success/Error tally
function executeHelperUpdateTally(resultsTallyElement, intQuery, intError) {
    GS.log(bolDebug, currentTab);

    resultsTallyElement.innerHTML = (
        ' (<b>Pass: ' + (intQuery - intError) + '</b>, <b>Fail: ' + (intError) + '</b>)'
    );
}

// this function is run when we get our first callback,
//      it shows and binds the "Stop Loading" button
function executeHelperStartLoading() {
    GS.log(bolDebug, currentTab);

    currentTab.relatedClearButton.setAttribute('hidden', '');
    currentTab.relatedStopSocketButton.removeAttribute('hidden');
    //currentTab.relatedStopLoadingButton.removeAttribute('hidden');
    //currentTab.relatedStopLoadingButton.addEventListener('click', executeHelperStopLoadingHandler);
}

function executeHelperStopSocket() {
    GS.log(bolDebug, currentTab);

    GS.requestFromSocket(GS.websockets[currentTab.relatedSocket], 'CANCEL', '', currentTab.currentMessageID);
    executeHelperStopLoadingHandler();
    currentTab.bolIgnoreMessages = true;
}


// executes SQL in current tab
var arrExecuteHistory = [];
function executeScript(bolCursorQuery) {
    'use strict';
    currentTab = document.getElementsByClassName('current-tab')[0];
    var editor = currentTab.relatedEditor;
    var resultsContainer = currentTab.relatedResultsArea;
    var resultsTallyElement = currentTab.relatedResultsTallyElement;
    var resultsHeaderElement = currentTab.relatedResultsHeaderElement;
    var bolAutocommit = (currentTab.relatedAutocommitCheckbox.value === 'true');
    var jsnCurrentQuery;
    var currentTargetTbody;
    var intRecordsThisQuery;
    var intError;
    var intQuery;
    var divElement;
    var intErrorStartLine;
	var intErrorStartChar;
    var jsnQueryStart;
    var jsnQueryEnd;
    var intCursorPos;
    var strScript;
    var jsnSelection;


    document.getElementById('sql-results-area-' + currentTab.intTabNumber + '').style.overflow = 'auto';

    executeHelperUpdateTally(resultsTallyElement, 0, 0);

    // if we found an editor to get the query from and the current tab is not already running a query
    if (editor && currentTab.handlingQuery !== true) {
        // get current query
        if (bolCursorQuery) {
            strScript = editor.getValue();
            jsnSelection = editor.getSelectionRange();

            if (
                jsnSelection.start.column === 0 ||
                jsnSelection.start.column === 1
            ) {
                intCursorPos = rowAndColumnToIndex(strScript, jsnSelection.start.row, jsnSelection.start.column);
            } else {
                intCursorPos = rowAndColumnToIndex(strScript, jsnSelection.start.row, jsnSelection.start.column - 1);
            }

            jsnCurrentQuery = findSqlQueryFromCursor(strScript, intCursorPos);
            jsnQueryStart = {
                'row': jsnCurrentQuery.start_row,
                'column': jsnCurrentQuery.start_column
            };
            jsnQueryEnd = {
                'row': jsnCurrentQuery.end_row,
                'column': jsnCurrentQuery.end_column
            };
            highlightCurrentCursorQuery(currentTab, jsnQueryStart, jsnQueryEnd);
        } else {
            jsnCurrentQuery = getCurrentQuery();
        }

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
		intErrorStartChar = 0;   // number of chars in the queries that successfully ran, so that we can offset the cursor properly
        var arrData = [];
        // begin

        //console.log('test');
        executeHelperStartExecute();


        currentTab.currentMessageID = GS.requestRawFromSocket(GS.websockets[currentTab.relatedSocket], jsnCurrentQuery.strQuery, function (data, error) {
            var tableElement;
            var scrollElement;
            var trElement;
            var arrRecords;
            var arrCells;
            var intRows;
            var strHTML;
            var arrLines;
            var strError;
            var intLine;
            var i;
            var len;
            var j;
            var len2;
            var col_i;
            var col_len;
            var rec_i;
            var rec_len;
            var warningHTML;
            var buttonContainerElement;
            var strCSS;
            var styleElement;
            var tempData = [];
            var tabNumber;
            var idNumber;
            var tableID;
            var columnType;
            var tempArr = [];

            if (currentTab.bolIgnoreMessages === false) {
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
                        executeHelperEndExecute();
                        executeHelperStartLoading();
                    }

                    //console.log(data.strQuery);
                    if (data.strQuery.toLowerCase().indexOf('drop ') !== -1) {
                        var strObjName, trimmedQuery, oidQuery, schemaOID, strSchemaName;
                        trimmedQuery = data.strQuery.substring(parseInt(data.strQuery.toLowerCase().indexOf('drop '), 10) + 5, data.strQuery.length);
                        trimmedQuery = trimmedQuery.substring(parseInt(trimmedQuery.toLowerCase().indexOf(' '), 10) + 1, trimmedQuery.length);

                        if (trimmedQuery.indexOf(' ') !== -1) {
                            trimmedQuery = trimmedQuery.substring(0, trimmedQuery.toLowerCase().indexOf(' '));
                        }

                        if (trimmedQuery.indexOf(';') !== -1) {
                            trimmedQuery = trimmedQuery.substring(0, trimmedQuery.toLowerCase().indexOf(';'));
                        }
                        strObjName = trimmedQuery;

                        if (data.strQuery.toLowerCase().indexOf('drop schema') !== -1) {
                            oidQuery = ml(function () {/*
                            SELECT oid
                                FROM pg_namespace
                                WHERE nspname = '{{NAMETOKEN}}'
                                ORDER BY nspname;
                            */}).replace(/\{\{NAMETOKEN\}\}/g, strObjName);

                            getSingleCellData(oidQuery, function (newOID) {
                                //console.log(newOID);
                                for (i = 0, len = treeGlobals.data.length; i < len; i++) {
                                    if (treeGlobals.data[i].name.toLowerCase() === strObjName.toLowerCase()) {
                                        treeGlobals.data[i].oid = newOID;
                                    }
                                }
                            });
                        } else if (data.strQuery.toLowerCase().indexOf('drop table') !== -1 || data.strQuery.toLowerCase().indexOf('drop view') !== -1) {
                            strSchemaName = strObjName.substring(0, strObjName.indexOf('.'));
                            var schemaoidQuery = ml(function () {/*
                            SELECT oid
                                FROM pg_namespace
                                WHERE nspname = '{{NAMETOKEN}}'
                                ORDER BY nspname;
                            */}).replace(/\{\{NAMETOKEN\}\}/g, strSchemaName);
                            getSingleCellData(schemaoidQuery, function (newSchemaOID) {
                                schemaOID = newSchemaOID;
                                strObjName = strObjName.substring(parseInt(strObjName.indexOf('.'), 10) + 1, strObjName.length)
                                oidQuery = ml(function () {/*
                                SELECT oid
                                    FROM pg_class
                                    WHERE relnamespace = '{{SCHEMAOID}}' AND relname = '{{NAMETOKEN}}'
                                */}).replace(/\{\{NAMETOKEN\}\}/g, strObjName).replace(/\{\{SCHEMAOID\}\}/g, schemaOID);

                                //console.log(oidQuery);
                                getSingleCellData(oidQuery, function (newOID) {
                                    for (i = 0, len = treeGlobals.data.length; i < len; i++) {
                                        if (treeGlobals.data[i].name.toLowerCase() === strObjName.toLowerCase() && treeGlobals.data[i].schemaName === strSchemaName) {
                                            treeGlobals.data[i].oid = newOID;
                                        }
                                    }
                                });

                            });
                        } else if (data.strQuery.toLowerCase().indexOf('drop function') !== -1) {
                            trimmedQuery = data.strQuery.substring(parseInt(data.strQuery.toLowerCase().indexOf('drop '), 10) + 5, data.strQuery.length);
                            trimmedQuery = trimmedQuery.substring(parseInt(trimmedQuery.toLowerCase().indexOf(' '), 10) + 1, trimmedQuery.length);
                            if (trimmedQuery.indexOf(';') !== -1) {
                                trimmedQuery = trimmedQuery.substring(0, trimmedQuery.toLowerCase().indexOf(';'));
                            }
                            strObjName = trimmedQuery;
                            strSchemaName = strObjName.substring(0, strObjName.indexOf('.'));
                            var strFullObjName = strObjName.substring(strSchemaName.length + 1, strObjName.length);
                            strObjName = strObjName.substring(strSchemaName.length + 1, strObjName.indexOf('('));
                            //console.log(strObjName);
                            var schemaoidQuery = ml(function () {/*
                            SELECT oid
                                FROM pg_namespace
                                WHERE nspname = '{{NAMETOKEN}}'
                                ORDER BY nspname;
                            */}).replace(/\{\{NAMETOKEN\}\}/g, strSchemaName);
                            getSingleCellData(schemaoidQuery, function (newSchemaOID) {
                                schemaOID = newSchemaOID;
                                strObjName = strObjName.substring(parseInt(strObjName.indexOf('.'), 10) + 1, strObjName.length)
                                oidQuery = ml(function () {/*
                                    SELECT pr.oid
                                        FROM pg_proc pr
                                        JOIN pg_type typ ON typ.oid = pr.prorettype
                                        WHERE proisagg = FALSE AND typname <> 'trigger' AND pr.pronamespace = '{{SCHEMAOID}}' AND proname = '{{NAMETOKEN}}';
                                */}).replace(/\{\{NAMETOKEN\}\}/g, strObjName).replace(/\{\{SCHEMAOID\}\}/g, schemaOID);
                                //console.log(oidQuery);
                                getSingleCellData(oidQuery, function (newOID) {
                                    for (i = 0, len = treeGlobals.data.length; i < len; i++) {
                                        if (treeGlobals.data[i].name.toLowerCase() === strFullObjName.toLowerCase() && treeGlobals.data[i].schemaName === strSchemaName) {
                                            treeGlobals.data[i].oid = newOID;
                                        }
                                    }
                                });

                            });
                        }
                    }

                    if (data.bolLastMessage) {
                        executeHelperEndLoading();
						if (data.bolTransactionOpen) {
							currentTab.relatedCommitButton.removeAttribute('disabled');
							currentTab.relatedRollbackButton.removeAttribute('disabled');
						}
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
						intErrorStartChar += data.strQuery.length;
                    }

                    //console.log(data.strMessage, data.bolLastMessage);

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
                            executeHelperBindShowQueryButton(xtag.query(divElement, '.button-show-query')[0], data.strQuery);
                            intQuery += 1;

                            // update the success and error tally
                            executeHelperUpdateTally(resultsTallyElement, intQuery, intError);

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
                            executeHelperBindShowQueryButton(xtag.query(divElement, '.button-show-query')[0], data.strQuery);
                            intQuery += 1;

                            // update the success and error tally
                            executeHelperUpdateTally(resultsTallyElement, intQuery, intError);

                        // else if result query
                        } else if (data.arrColumnNames.length > 0) {
                            if (data.strMessage === '\\.') {
                                divElement = document.createElement('div');
                                scrollElement = document.createElement('div');

                                scrollElement.classList.add('result-table-scroll-container');

                                i = 0;
                                len = data.arrMessages.length;
                                warningHTML = '';
                                while (i < len) {
                                    warningHTML += (
                                        '<i>' +
                                            '<b>' + data.arrMessages[i].level + ':</b> ' +
                                            encodeHTML(data.arrMessages[i].content) +
                                        '</i>' +
                                        '<br />'
                                    );

                                    i += 1;
                                }

                                strHTML = (
                                    '<div flex-horizontal>' +
                                        '<h5 flex>Query #' + (data.intQueryNumber + 1) + strQueryName + ':</h5>' +
                                        '<div>'
                                );

                                // if we have all of the query execution time
                                //      data, show it
                                if (
                                    data.dteStart &&
                                    data.dteEnd &&
                                    !isNaN(data.dteStart.getTime()) &&
                                    !isNaN(data.dteEnd.getTime())
                                ) {
                                    strHTML += (
                                        '<small>' +
                                            'Approx. ' +
                                            (
                                                (
                                                    data.dteEnd.getTime() -
                                                    data.dteStart.getTime()
                                                ) / 1000
                                            ).toFixed(3) + ' seconds' +
                                        '</small>'
                                    );
                                }

                                strHTML += '<br />';

                                // if we have a record number, show it
                                if (data.intRows !== undefined) {
                                    strHTML += (
                                        '<small id="row-count-' + data.intQueryNumber + '">' +
                                            '<span id="loaded-row-count-' + data.intQueryNumber + '" hidden>0</span>' +
                                            data.intRows + ' rows loaded' +
                                        '</small>'
                                    );
                                }

                                strHTML += (
                                        '</div>' +
                                        '<span>&nbsp;</span>' +
                                        '<gs-button class="button-show-query" no-focus>Query</gs-button>' +
                                    '</div>' +
                                    warningHTML
                                );

                                divElement.innerHTML = strHTML;

                                // append query info and results container
                                divElement.appendChild(scrollElement);
                                resultsContainer.appendChild(divElement);

                                // we want the "Show Query" buttons to work
                                executeHelperBindShowQueryButton(
                                    xtag.query(divElement, '.button-show-query')[0],
                                    data.strQuery
                                );

                                tabNumber = currentTab.intTabNumber;
                                idNumber = tabNumber + '-' + xtag.query(resultsContainer, 'gs-table').length;
                                tableID = 'Table' + idNumber + '';

                                strHTML = ml(function () {/*
                                    <template for="top-hud">
                                        <gs-button onclick="document.getElementById('{{TABLEID}}').openPrefs(this)" inline no-focus icononly icon="sliders">&nbsp;</gs-button>
                                        <gs-button onclick="document.getElementById('{{TABLEID}}').toggleFullscreen(this)" inline id="toggleFullscreen-{{IDNUM}}" no-focus icononly icon="arrows-alt">&nbsp;</gs-button>
                                        <gs-button onclick="hideOtherTables({{IDNUM}}, '{{TABLEID}}'); document.getElementById('{{TABLEID}}').toggleFullContainer('sql-results-area-{{IDNUM}}', this)" inline no-focus icononly icon="expand">&nbsp;</gs-button>
                                    </template>
                                    <template for="bottom-hud">
                                        <gs-button inline no-focus icononly onclick="document.getElementById('{{TABLEID}}').goToLine('first')" icon="step-backward">&nbsp;</gs-button>
                                        <gs-button inline no-focus icononly onclick="document.getElementById('{{TABLEID}}').goToLine('previous')" icon="caret-left">&nbsp;</gs-button>
                                        <gs-current-record inline for="{{TABLEID}}"></gs-current-record>
                                        <gs-button inline no-focus icononly onclick="document.getElementById('{{TABLEID}}').goToLine('next')" icon="caret-right">&nbsp;</gs-button>
                                        <gs-button inline no-focus icononly onclick="document.getElementById('{{TABLEID}}').goToLine('last')" icon="step-forward">&nbsp;</gs-button>
                                    </template>
                                */}).replace(/{{TABLEID}}/gi, tableID).replace(/{{IDNUM}}/gi, tabNumber);

                                strHTML += '<template for="header-record">';

                                i = 0;
                                len = data.arrColumnNames.length;
                                while (i < len) {
                                    // appreviate some of the types
                                    if (data.arrColumnTypes[i].indexOf("character vary") === 0) {
                                        columnType = (
                                            'varchar' +
                                            data.arrColumnTypes[i].substring(17, data.arrColumnTypes[i].length)
                                        );

                                    } else if (data.arrColumnTypes[i] === "timestamp with time zone") {
                                        columnType = 'timestamptz';

                                    } else {
                                        columnType = data.arrColumnTypes[i];
                                    }

                                    strHTML += (
                                        '<gs-cell style="line-height: normal; padding-top: 2px; width: 20px;">' +
                                            data.arrColumnNames[i] +
                                            '<br />' +
                                            '<small>(' + columnType + ')</small>' +
                                        '</gs-cell>'
                                    );
                                    i += 1;
                                }

                                strHTML += '</template>';
                                strHTML += '<template for="data-record">';

                                // generate record cell html
                                i = 0;
                                len = data.arrColumnNames.length;
                                while (i < len) {
                                    // appreviate some of the types
                                    if (data.arrColumnTypes[i].indexOf("character vary") === 0) {
                                        columnType = (
                                            'varchar' +
                                            data.arrColumnTypes[i].substring(17, data.arrColumnTypes[i].length)
                                        );

                                    } else if (data.arrColumnTypes[i] === "timestamp with time zone") {
                                        columnType = 'timestamptz';

                                    } else {
                                        columnType = data.arrColumnTypes[i];
                                    }

                                    strHTML += (
                                        '<gs-cell style="overflow: auto;">' +
                                            '<label>{{! GS.decodeFromTabDelimited(arrRow[' + i + ']) }}</label>' +
                                        '</gs-cell>'
                                    );
                                    i += 1;
                                }

                                strHTML += '</template>';
                                strHTML += '<template for="copy">';

                                // generate copy cell html
                                i = 0;
                                len = data.arrColumnNames.length;
                                while (i < len) {
                                    strHTML += (
                                        '<gs-cell header="' + data.arrColumnNames[i] + '">' +
                                            '{{= arrRow[' + i + '] }}' +
                                        '</gs-cell>'
                                    );
                                    i += 1;
                                }

                                strHTML += '</template>';


                                tableElement = document.createElement('gs-table');
                                tableElement.innerHTML = strHTML;
                                tableElement.setAttribute('id', tableID);
                                tableElement.setAttribute('no-delete', '');
                                tableElement.setAttribute('no-update', '');
                                tableElement.setAttribute('null-string', 'NULL');
                                scrollElement.appendChild(tableElement);

                                tableElement.addEventListener('openFullContainer', function () {
                                    currentTab.resultsScroll = document.getElementById('sql-results-area-' + tabNumber + '').scrollTop;
                                    document.getElementById('sql-results-area-' + tabNumber + '').scrollTop = 0;
                                    document.getElementById('sql-results-area-' + tabNumber + '').style.overflow = 'hidden';
                                });

                                tableElement.addEventListener('closeFullContainer', function () {
                                    document.getElementById('sql-results-area-' + tabNumber + '').scrollTop = currentTab.resultsScroll;
                                    document.getElementById('sql-results-area-' + tabNumber + '').style.overflow = 'auto';
                                });

                                tableElement.internalData.records = arrData;
                                tableElement.internalData.columnNames = data.arrColumnNames;

                                // tempArr = [];
                                // i = 0;
                                // len = data.arrColumnNames.length;
                                // while (i < len) {
                                //     tempArr.push('text');
                                //     i += 1;
                                // }
                                tableElement.internalData.columnTypes = data.arrColumnTypes;

                                tempArr = [];
                                i = 0;
                                len = data.arrColumnNames.length;
                                while (i < len) {
                                    tempArr.push('on');
                                    i += 1;
                                }
                                tableElement.internalData.columnFilterStatuses = tempArr;

                                tempArr = [];
                                i = 0;
                                len = data.arrColumnNames.length;
                                while (i < len) {
                                    tempArr.push([]);
                                    i += 1;
                                }
                                tableElement.internalData.columnFilters = tempArr;

                                tempArr = [];
                                i = 0;
                                len = data.arrColumnNames.length;
                                while (i < len) {
                                    tempArr.push({});
                                    i += 1;
                                }
                                tableElement.internalData.columnListFilters = tempArr;

                                tempArr = [];
                                i = 0;
                                len = data.arrColumnNames.length;
                                while (i < len) {
                                    tempArr.push('neutral');
                                    i += 1;
                                }
                                tableElement.internalData.columnOrders = tempArr;

                                tableElement.internalDisplay.headerHeight = 37;

                                // refresh causes the record heights to be calculated
                                tableElement.refresh();

                                // clear arrData variable so that we don't modify the
                                //      arrData we sent to the datasheet
                                arrData = [];

                                intQuery += 1;
                                executeHelperUpdateTally(resultsTallyElement, intQuery, intError);
                            } else {
                                tempData = data.strMessage.split('\n');
                                arrData.push.apply(arrData, tempData);
                            }


                        }
                    }
                } else {
                    executeHelperEndExecute();
                    executeHelperEndLoading();

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
                    if (data.error_position) {
						var arrLines = jsnCurrentQuery.strQuery.substring(intErrorStartChar, intErrorStartChar + parseInt(data.error_position, 10)).split('\n');
						var intErrorCol = parseInt(data.error_position, 10) - 1;
						var i = 0;
						var len = intLine - 1;
					    //console.log(len, intLine, arrLines.length);
					    //console.log(jsnCurrentQuery.strQuery);
					    //console.log(intErrorStartChar);
					    //console.log(intErrorStartChar);
						while (i < len) {
						    //console.log(i, arrLines[i], arrLines[i].length);
							intErrorCol -= arrLines[i].length + 1;
							i += 1
						}

						editor.getSelection().setSelectionRange({
							start: {
								row: jsnCurrentQuery.start_row + intErrorStartLine + (intLine - 1),
								column: intErrorCol || 0
							},
							end: {
								row: jsnCurrentQuery.start_row + intErrorStartLine + (intLine - 1),
								column: intErrorCol || 0
							}
						});
					}
                    if (intLine) {
                        editor.getSession().setAnnotations([
                            {'row': jsnCurrentQuery.start_row + intErrorStartLine + (intLine - 1), 'column': intErrorCol || 0,
                                'text': strError, 'type': 'error'}
                        ]);
                        editor.scrollToLine((jsnCurrentQuery.start_row + intErrorStartLine + (intLine - 1)), true, true);
                    }

                    // update the success and error tally
                    executeHelperUpdateTally(resultsTallyElement, intQuery, intError);

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

function showMoreResults(buttonElement, intQuery, howMany) {
    'use strict';
    GS.log(bolDebug, currentTab);
    var i, len, col_i, col_len, tbodyElement, trElement, gridElement, arrRecords, strHTML, arrCells;

    tbodyElement = xtag.query(
                        currentTab.relatedResultsArea,
                        '.results-table[data-query-number="' + intQuery + '"] tbody'
                    )[0];

    arrRecords = currentTab.arrQueryDataStore[intQuery];

    for (i = 0, len = (howMany === 'all' ? arrRecords.length : howMany); i < len; i += 1) {
        if (!arrRecords[0]) {
            break;
        }

        trElement = document.createElement('tr');
        arrCells = arrRecords[0].split('\t');

        strHTML = '<th>' + arrCells[0] + '</th>';
        for (col_i = 1, col_len = arrCells.length; col_i < col_len; col_i += 1) {
            strHTML += '<td>';
            strHTML += encodeHTML(GS.decodeFromTabDelimited(arrCells[col_i]));
            strHTML += '</td>';
        }

        trElement.innerHTML = strHTML;

        tbodyElement.appendChild(trElement);
        arrRecords.splice(0, 1);
    }

    if (arrRecords.length === 0) {
        gridElement = GS.findParentTag(buttonElement, 'GS-GRID');

        gridElement.parentNode.removeChild(gridElement);
    }
}


function dialogExecuteHistory() {
    'use strict';
    var templateElement = document.createElement('template')
      , strHTML, i, len, beginTime, beginHours, endTime, endHours;

    templateElement.setAttribute('data-overlay-close', 'true');
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-header><center><h3>Session Execution History</h3></center></gs-header>
            <gs-body padded id="execution-history-container"></gs-body>
            <gs-footer><gs-button dialogclose>Done</gs-button></gs-footer>
        </gs-page>
    */});

    if (arrExecuteHistory.length === 0) {
        strHTML = '<center><h4>No Execution History</h4></center>';

    } else {
        strHTML = '';
        for (i = 0, len = arrExecuteHistory.length; i < len; i += 1) {
            if (!arrExecuteHistory[i].failed) {
                // get begin time variables
                beginTime = arrExecuteHistory[i].dteStart;
                beginHours = beginTime.getHours();

                if (beginHours >= 12) { beginHours = beginHours - 12; }
                if (beginHours === 0) { beginHours = 12; }

                // get end time variables
                endTime = arrExecuteHistory[i].dteEnd;
                endHours = endTime.getHours();

                if (endHours >= 12) { endHours = endHours - 12; }
                if (endHours === 0) { endHours = 12; }

                // build html
                strHTML += (i !== 0 ? '<br />' : '');

                if (beginTime && endTime && !isNaN(beginTime.getTime()) && !isNaN(endTime.getTime())) {
                    strHTML += '<b>Begin:</b> ' +
                                    beginTime.getFullYear() + '-' +
                                    GS.leftPad(beginTime.getMonth() + 1, '0', 2) + '-' +
                                    GS.leftPad(beginTime.getDate(), '0', 2) + ' ' +
                                    beginHours + ':' +
                                    GS.leftPad(beginTime.getMinutes() + 1, '0', 2) + ':' +
                                    GS.leftPad(beginTime.getSeconds(), '0', 2) + ' ' +
                                '<br />' +
                                '<b>End:</b> ' +
                                    endTime.getFullYear() + '-' +
                                    GS.leftPad(endTime.getMonth() + 1, '0', 2) + '-' +
                                    GS.leftPad(endTime.getDate(), '0', 2) + ' ' +
                                    endHours + ':' +
                                    GS.leftPad(endTime.getMinutes() + 1, '0', 2) + ':' +
                                    GS.leftPad(endTime.getSeconds(), '0', 2) + ' ' +
                                '<br />' +
                                '<b>Run Time:</b> approx. ' + ((endTime.getTime() - beginTime.getTime()) / 1000).toFixed(3) + ' seconds';
                }

                if (arrExecuteHistory[i].intRows !== undefined) {
                    strHTML += '<br /><b>Total Rows:</b> ' + arrExecuteHistory[i].intRows;
                }

                strHTML += '<div><pre>' + encodeHTML(arrExecuteHistory[i].strQuery) + '</pre></div>';
            } else {
                strHTML += (i !== 0 ? '<br />' : '');
                strHTML += '<b>Query Failed</b>';

                if (arrExecuteHistory[i].errorText) {
                    strHTML += '<br /><b>Error:</b> ' + encodeHTML(arrExecuteHistory[i].errorText);
                }

                strHTML += '<div><pre>' + encodeHTML(arrExecuteHistory[i].strQuery) + '</pre></div>';
            }
        }
    }

    GS.openDialog(templateElement, function () {
        document.getElementById('execution-history-container').innerHTML = strHTML;

    }, function (event, strAnswer) {
        if (strAnswer === 'Ok') {
            // beforedialog close

        }
    });
}

//
function exportCSV() {
    'use strict';
    GS.log(bolDebug, currentTab);
    var editor = currentTab.relatedEditor, templateElement = document.createElement('template')
      , jsnCurrentQuery;

    // if we found an editor to get the query from
    if (editor) {
        // get current query
        jsnCurrentQuery = getCurrentQuery();
        //console.log(jsnCurrentQuery);

        if (jsnCurrentQuery.strQuery.trim()) {
            templateElement.innerHTML = ml(function () {/*
                <gs-page>
                    <gs-header><center><h3>Export Results</h3></center></gs-header>
                    <gs-body padded>
                        <center><h5>Export Format</h5></center>
                        <div id="container-option-format">
                            <gs-optionbox id="option-format" no-target mini value="csv">
                                <gs-grid gutter widths="1,1,1">
                                    <gs-block>
                                        <gs-option value="csv" jumbo>
                                            CSV<sup style="font-size: 1.1em; top: -.3em;">*</sup>
                                        </gs-option>
                                    </gs-block>
                                    <gs-block>
                                        <gs-option value="text" jumbo>
                                            Text<sup style="font-size: 1.1em; top: -.3em;">**</sup>
                                        </gs-option>
                                    </gs-block>
                                    <gs-block>
                                        <gs-option value="binary" jumbo>
                                            Binary<sup style="font-size: 1.1em; top: -.3em;">***</sup>
                                        </gs-option>
                                    </gs-block>
                                </gs-grid>
                            </gs-optionbox>
                        </div>

                        <b>*</b><br />
                        <i>The CSV result format exports to a file where each record is a line and inside each record each column is separated by the Delimiter. If a cell contains any of the following it'll be prefixed and suffixed by the QUOTE Character: the Delimiter, the QUOTE Character, the NULL String, a carriage return or a line feed character.</i><br />

                        <b>**</b><br />
                        <i>The Text result format exports to a file where each record is a line and inside each record each column is separated by the Delimiter. Characters that would interfere with parsing the resulting file are encoded and prefixed with the backslash character.</i><br />

                        <b>***</b><br />
                        <i>The Binary result format is faster than CSV or Text, but it is less portable and it is targeted for importing to a postgres database. Importing a binary file requires that the data types of the export match the data types of the import target.</i><br /><br />

                        <center><i>For more details go to the <a href="http://www.postgresql.org/docs/{{MINORVERSION}}/static/sql-copy.html" target="_blank">Postgres COPY</a> documentation page.</i></center>
                        <hr />

                        <div id="container-select-encoding">
                            <label for="select-encoding">Encoding: <small>This is the character encoding of the resulting file.</small></label>
                            <gs-select id="select-encoding" value="">
                                <option value="">Default</option>
                                <option value="BIG5">Big Five, Traditional Chinese, 1-2 bytes, AKA: WIN950, Windows950</option>
                                <option value="EUC_CN">Extended UNIX Code-CN, Simplified Chinese, 1-3 bytes</option>
                                <option value="EUC_JP">Extended UNIX Code-JP, Japanese, 1-3 bytes</option>
                                <option value="EUC_JIS_2004">Extended UNIX Code-JP, JIS X 0213, Japanese, 1-3 bytes</option>
                                <option value="EUC_KR">Extended UNIX Code-KR, Korean, 1-3 bytes</option>
                                <option value="EUC_TW">Extended UNIX Code-TW, Traditional Chinese, Taiwanese, 1-3 bytes</option>
                                <option value="GB18030">National Standard, Chinese, 1-2 bytes</option>
                                <option value="GBK">Extended National Standard, Simplified Chinese, 1-2 bytes, AKA: WIN936, Windows936</option>
                                <option value="ISO_8859_5">ISO 8859-5, ECMA 113, Latin/Cyrillic, 1 bytes</option>
                                <option value="ISO_8859_6">ISO 8859-6, ECMA 114, Latin/Arabic, 1 bytes</option>
                                <option value="ISO_8859_7">ISO 8859-7, ECMA 118, Latin/Greek, 1 bytes</option>
                                <option value="ISO_8859_8">ISO 8859-8, ECMA 121, Latin/Hebrew, 1 bytes</option>
                                <option value="JOHAB">JOHAB, Korean (Hangul), 1-3 bytes</option>
                                <option value="KOI8R">KOI8-R, Cyrillic (Russian), 1 bytes, AKA: KOI8</option>
                                <option value="KOI8U">KOI8-U, Cyrillic (Ukrainian), 1 bytes</option>
                                <option value="LATIN1">ISO 8859-1, ECMA 94, Western European, 1 bytes, AKA: ISO88591</option>
                                <option value="LATIN2">ISO 8859-2, ECMA 94, Central European, 1 bytes, AKA: ISO88592</option>
                                <option value="LATIN3">ISO 8859-3, ECMA 94, South European, 1 bytes, AKA: ISO88593</option>
                                <option value="LATIN4">ISO 8859-4, ECMA 94, North European, 1 bytes, AKA: ISO88594</option>
                                <option value="LATIN5">ISO 8859-9, ECMA 128, Turkish, 1 bytes, AKA: ISO88599</option>
                                <option value="LATIN6">ISO 8859-10, ECMA 144, Nordic, 1 bytes, AKA: ISO885910</option>
                                <option value="LATIN7">ISO 8859-13, Baltic, 1 bytes, AKA: ISO885913</option>
                                <option value="LATIN8">ISO 8859-14, Celtic, 1 bytes, AKA: ISO885914</option>
                                <option value="LATIN9">ISO 8859-15, LATIN1 with Euro and accents, 1 bytes, AKA: ISO885915</option>
                                <option value="LATIN10">ISO 8859-16, ASRO SR 14111, Romanian, 1 bytes, AKA: ISO885916</option>
                                <option value="MULE_INTERNAL">Mule internal code, Multilingual Emacs, 1-4 bytes</option>
                                <option value="SJIS">Shift JIS, Japanese, 1-2 bytes, AKA: Mskanji, ShiftJIS, WIN932, Windows932</option>
                                <option value="SHIFT_JIS_2004">Shift JIS, JIS X 0213, Japanese, 1-2 bytes</option>
                                <option value="SQL_ASCII">unspecified (see text), any, 1 bytes</option>
                                <option value="UHC">Unified Hangul Code, Korean, 1-2 bytes, AKA: WIN949, Windows949</option>
                                <option value="UTF8">Unicode, 8-bit, all, 1-4 bytes, AKA: Unicode</option>
                                <option value="WIN866">Windows CP866, Cyrillic, 1 bytes, AKA: ALT</option>
                                <option value="WIN874">Windows CP874, Thai, 1 bytes</option>
                                <option value="WIN1250">Windows CP1250, Central European, 1 bytes</option>
                                <option value="WIN1251">Windows CP1251, Cyrillic, 1 bytes, AKA: WIN</option>
                                <option value="WIN1252">Windows CP1252, Western European, 1 bytes</option>
                                <option value="WIN1253">Windows CP1253, Greek, 1 bytes</option>
                                <option value="WIN1254">Windows CP1254, Turkish, 1 bytes</option>
                                <option value="WIN1255">Windows CP1255, Hebrew, 1 bytes</option>
                                <option value="WIN1256">Windows CP1256, Arabic, 1 bytes</option>
                                <option value="WIN1257">Windows CP1257, Baltic, 1 bytes</option>
                                <option value="WIN1258">Windows CP1258, Vietnamese, 1 bytes, AKA: ABC, TCVN, TCVN5712, VSCII</option>
                            </gs-select>
                        </div>

                        <div id="container-check-column-headings">
                            <br />
                            <label for="check-column-headings">
                                Column Names As First Record?
                                <small>When this is checked the first record will be the names of each column.</small>
                            </label>
                            <gs-checkbox id="check-column-headings" value="true"></gs-checkbox>
                        </div>

                        <div id="container-text-delimiter">
                            <br />
                            <label for="text-delimiter">
                                Delimiter:
                                <small>This is the character(s) that you want to seperate columns with in each record.</small>
                            </label>
                            <gs-text id="text-delimiter" value="," autocorrect="off" autocapitalize="off" autocomplete="off"></gs-text>
                        </div>

                        <div id="container-text-null">
                            <br />
                            <label for="text-null">
                                NULL String:
                                <small>This is the string you want to represent NULL with.</small>
                            </label>
                            <gs-text id="text-null" value="NULL" autocapitalize="off"></gs-text>
                        </div>

                        <div id="container-text-quote">
                            <br />
                            <label for="text-quote">
                                QUOTE Character <small>(one character only)</small>:
                                <small>This is the character you want to use as a quote.</small>
                            </label>
                            <gs-text id="text-quote" value="&quot;" autocorrect="off" autocapitalize="off" autocomplete="off"></gs-text>
                        </div>

                        <div id="container-text-force-quote">
                            <br />
                            <label for="text-force-quote">
                                Quote Columns:
                                <small>This is a comma seperated list of columns that you want the values to always be quoted.</small>
                            </label>
                            <gs-text id="text-force-quote" autocorrect="off" autocapitalize="off" autocomplete="off" value="*"></gs-text>
                        </div>

                        <div id="container-text-escape">
                            <br />
                            <label for="text-escape">
                                Escape Character <small>(one character only)</small>:
                                <small>This character is used to prefix encoded special characters. For example: the '\' in '\n'.</small>
                            </label>
                            <gs-text id="text-escape" value="\" autocorrect="off" autocapitalize="off" autocomplete="off"></gs-text>
                        </div>
                    </gs-body>
                    <gs-footer>
                        <gs-grid gutter>
                            <gs-block><gs-button dialogclose>Cancel</gs-button></gs-block>
                            <gs-block><gs-button id="button-open-export">Export</gs-button></gs-block>
                        </gs-grid>
                    </gs-footer>
                </gs-page>
            */}).replace(/\{\{MINORVERSION\}\}/gim, contextData.minorVersionNumber);

            GS.openDialog(templateElement, function () {
                var dialog = this
                  , formatContainerElement = document.getElementById('container-option-format')
                  , formatElement = document.getElementById('option-format')
                  , encodingContainerElement = document.getElementById('container-select-encoding')
                  , encodingElement = document.getElementById('select-encoding')
                  , headingsContainerElement = document.getElementById('container-check-column-headings')
                  , headingsElement = document.getElementById('check-column-headings')
                  , delimiterContainerElement = document.getElementById('container-text-delimiter')
                  , delimiterElement = document.getElementById('text-delimiter')
                  , nullContainerElement = document.getElementById('container-text-null')
                  , nullElement = document.getElementById('text-null')
                  , quoteContainerElement = document.getElementById('container-text-quote')
                  , quoteElement = document.getElementById('text-quote')
                  , forceQuoteContainerElement = document.getElementById('container-text-force-quote')
                  , forceQuoteElement = document.getElementById('text-force-quote')
                  , escapeContainerElement = document.getElementById('container-text-escape')
                  , escapeElement = document.getElementById('text-escape');

                // depending on the format: hide or show certain controls
                document.getElementById('option-format').addEventListener('change', function () {
                    quoteContainerElement.removeAttribute('hidden');
                    escapeContainerElement.removeAttribute('hidden');
                    forceQuoteContainerElement.removeAttribute('hidden');
                    delimiterContainerElement.removeAttribute('hidden');
                    headingsContainerElement.removeAttribute('hidden');
                    nullContainerElement.removeAttribute('hidden');

                    if (this.value === 'text') {
                        quoteContainerElement.setAttribute('hidden', '');
                        escapeContainerElement.setAttribute('hidden', '');
                        forceQuoteContainerElement.setAttribute('hidden', '');
                        headingsContainerElement.setAttribute('hidden', '');
                    }

                    if (this.value === 'binary') {
                        quoteContainerElement.setAttribute('hidden', '');
                        escapeContainerElement.setAttribute('hidden', '');
                        forceQuoteContainerElement.setAttribute('hidden', '');
                        delimiterContainerElement.setAttribute('hidden', '');
                        headingsContainerElement.setAttribute('hidden', '');
                        nullContainerElement.setAttribute('hidden', '');
                    }
                });

                document.getElementById('button-open-export').addEventListener('click', function () {
                    var arrRequestHeaders = [], arrRequestValues = [], strRequestString;

                    // one char quote string
                    if (!quoteContainerElement.hasAttribute('hidden') && quoteElement.value.length !== 1) {
                        GS.msgbox('Error', '<center>The "Quote String" control must have one character as it\'s value.</center>', ['Ok'],
                                        function () {
                            quoteElement.focus();
                        });
                        return;
                    }

                    // delimiter
                    if (!delimiterContainerElement.hasAttribute('hidden') && delimiterElement.value.length === 0) {
                        GS.msgbox('Error', '<center>The "Delimiter" control must have a value.</center>', ['Ok'],
                                        function () {
                            delimiterElement.focus();
                        });
                        return;
                    }

                    // escape character
                    if (!escapeContainerElement.hasAttribute('hidden') && escapeElement.value.length !== 1) {
                        GS.msgbox('Error', '<center>The "Escape Character" control must have one character as it\'s value.</center>', ['Ok'],
                                        function () {
                            escapeElement.focus();
                        });
                        return;
                    }

                    // gather parameters
                    if (!formatContainerElement.hasAttribute('hidden')) {
                        arrRequestHeaders.push('FORMAT');
                        arrRequestValues.push('\'' + formatElement.value + '\'');
                    }

                    if (!delimiterContainerElement.hasAttribute('hidden')) {
                        arrRequestHeaders.push('DELIMITER');
                        arrRequestValues.push('\'' + GS.encodeForTabDelimited(delimiterElement.value.replace(/\'/g, '\'\'')) + '\'');
                    }

                    if (!nullContainerElement.hasAttribute('hidden')) {
                        arrRequestHeaders.push('NULL');
                        if (nullElement.value === 'NULL') {
                            arrRequestValues.push('\'NULL\'');
                        } else {
                            arrRequestValues.push('\'' + GS.encodeForTabDelimited(nullElement.value).replace(/\'/g, '\'\'') + '\'');
                        }
                    }

                    if (!quoteContainerElement.hasAttribute('hidden')) {
                        arrRequestHeaders.push('QUOTE');
                        arrRequestValues.push('\'' + quoteElement.value.replace(/\'/g, '\'\'') + '\'');
                    }

                    if (!escapeContainerElement.hasAttribute('hidden')) {
                        arrRequestHeaders.push('ESCAPE');
                        arrRequestValues.push('\'' + escapeElement.value.replace(/\'/g, '\'\'') + '\'');
                    }

                    if (!encodingContainerElement.hasAttribute('hidden') && encodingElement.value !== '') {
                        arrRequestHeaders.push('ENCODING');
                        arrRequestValues.push('\'' + GS.encodeForTabDelimited(encodingElement.value).replace(/\'/g, '\'\'') + '\'');
                    }

                    if (!headingsContainerElement.hasAttribute('hidden')) {
                        arrRequestHeaders.push('HEADER');
                        arrRequestValues.push(headingsElement.value.toUpperCase());
                    }

                    if (!forceQuoteContainerElement.hasAttribute('hidden') && forceQuoteElement.value) {
                        arrRequestHeaders.push('FORCE_QUOTE');
                        if (forceQuoteElement.value === '*') {
                            arrRequestValues.push('*');
                        } else {
                            arrRequestValues.push('(' + GS.encodeForTabDelimited(forceQuoteElement.value) + ')');
                        }
                    }

                    strRequestString = GS.encodeForTabDelimited(GS.trim(jsnCurrentQuery.strQuery.trim(), ';')) + '\n' +
                                        arrRequestHeaders.join('\t') + '\n' + arrRequestValues.join('\t');

                    window.open('/postage/' + contextData.connectionID + '/export?' + encodeURIComponent(strRequestString));

                    // don't close the dialog!! what if the export has an error or needs to be tweaked??
                    //GS.closeDialog(dialog, 'Ok');
                });
            });

        } else {
            GS.msgbox('Error', '<center>You need to select a query.</center>', ['Ok']);
        }
    }
}

function openInNewWindow() {
    GS.log(bolDebug, currentTab);
    window.open('index.html?leftpanel=false&view=tab:' + encodeURIComponent(currentTab.filePath), Math.random().toString(), 'left=' + (window.screenX + 100) + ',width=' + window.innerWidth + ',height=' + window.innerHeight);
}

function docButtonForQuery(strQuery) {
    'use strict';
    var strPrefix = 'http://www.postgresql.org/docs/' + contextData.minorVersionNumber + '/static/', strDocButton;

    var docLinks = [
        {'test': (/^VALUES/gi).test(strQuery), 'link': strPrefix + 'sql-values.html'},
        {'test': (/^VACUUM/gi).test(strQuery), 'link': strPrefix + 'sql-vacuum.html'},
        {'test': (/^UPDATE/gi).test(strQuery), 'link': strPrefix + 'sql-update.html'},
        {'test': (/^UNLISTEN/gi).test(strQuery), 'link': strPrefix + 'sql-unlisten.html'},
        {'test': (/^TRUNCATE/gi).test(strQuery), 'link': strPrefix + 'sql-truncate.html'},
        {'test': (/^START\s*TRANSACTION/gi).test(strQuery), 'link': strPrefix + 'sql-start-transaction.html'},
        {'test': (/^SHOW/gi).test(strQuery), 'link': strPrefix + 'sql-show.html'},
        {'test': (/^SET\s*TRANSACTION/gi).test(strQuery), 'link': strPrefix + 'sql-set-transaction.html'},
        {'test': (/^SET\s*SESSION\s*AUTHORIZATION/gi).test(strQuery), 'link': strPrefix + 'sql-set-session-authorization.html'},
        {'test': (/^SET\s*ROLE/gi).test(strQuery), 'link': strPrefix + 'sql-set-role.html'},
        {'test': (/^SET\s*CONSTRAINTS/gi).test(strQuery), 'link': strPrefix + 'sql-set-constraints.html'},
        {'test': (/^SET/gi).test(strQuery), 'link': strPrefix + 'sql-set.html'},
        {'test': (/^SELECT\s*INTO/gi).test(strQuery), 'link': strPrefix + 'sql-selectinto.html'},
        {'test': (/^SELECT/gi).test(strQuery), 'link': strPrefix + 'sql-select.html'},
        {'test': (/^SECURITY\s*LABEL/gi).test(strQuery), 'link': strPrefix + 'sql-security-label.html'},
        {'test': (/^SAVEPOINT/gi).test(strQuery), 'link': strPrefix + 'sql-savepoint.html'},
        {'test': (/^ROLLBACK\s*TO\s*SAVEPOINT/gi).test(strQuery), 'link': strPrefix + 'sql-rollback-to.html'},
        {'test': (/^ROLLBACK\s*PREPARED/gi).test(strQuery), 'link': strPrefix + 'sql-rollback-prepared.html'},
        {'test': (/^ROLLBACK/gi).test(strQuery), 'link': strPrefix + 'sql-rollback.html'},
        {'test': (/^REVOKE/gi).test(strQuery), 'link': strPrefix + 'sql-revoke.html'},
        {'test': (/^RESET/gi).test(strQuery), 'link': strPrefix + 'sql-reset.html'},
        {'test': (/^RELEASE\s*SAVEPOINT/gi).test(strQuery), 'link': strPrefix + 'sql-release-savepoint.html'},
        {'test': (/^REINDEX/gi).test(strQuery), 'link': strPrefix + 'sql-reindex.html'},
        {'test': (/^REASSIGN\s*OWNED/gi).test(strQuery), 'link': strPrefix + 'sql-reassign-owned.html'},
        {'test': (/^PREPARE\s*TRANSACTION/gi).test(strQuery), 'link': strPrefix + 'sql-prepare-transaction.html'},
        {'test': (/^PREPARE/gi).test(strQuery), 'link': strPrefix + 'sql-prepare.html'},
        {'test': (/^NOTIFY/gi).test(strQuery), 'link': strPrefix + 'sql-notify.html'},
        {'test': (/^MOVE/gi).test(strQuery), 'link': strPrefix + 'sql-move.html'},
        {'test': (/^LOCK/gi).test(strQuery), 'link': strPrefix + 'sql-lock.html'},
        {'test': (/^LOAD/gi).test(strQuery), 'link': strPrefix + 'sql-load.html'},
        {'test': (/^LISTEN/gi).test(strQuery), 'link': strPrefix + 'sql-listen.html'},
        {'test': (/^INSERT/gi).test(strQuery), 'link': strPrefix + 'sql-insert.html'},
        {'test': (/^GRANT/gi).test(strQuery), 'link': strPrefix + 'sql-grant.html'},
        {'test': (/^FETCH/gi).test(strQuery), 'link': strPrefix + 'sql-fetch.html'},
        {'test': (/^EXPLAIN/gi).test(strQuery), 'link': strPrefix + 'sql-explain.html'},
        {'test': (/^EXECUTE/gi).test(strQuery), 'link': strPrefix + 'sql-execute.html'},
        {'test': (/^END/gi).test(strQuery), 'link': strPrefix + 'sql-end.html'},
        {'test': (/^DROP\s*VIEW/gi).test(strQuery), 'link': strPrefix + 'sql-dropview.html'},
        {'test': (/^DROP\s*USER\s*MAPPING/gi).test(strQuery), 'link': strPrefix + 'sql-dropusermapping.html'},
        {'test': (/^DROP\s*USER/gi).test(strQuery), 'link': strPrefix + 'sql-dropuser.html'},
        {'test': (/^DROP\s*TYPE/gi).test(strQuery), 'link': strPrefix + 'sql-droptype.html'},
        {'test': (/^DROP\s*TRIGGER/gi).test(strQuery), 'link': strPrefix + 'sql-droptrigger.html'},
        {'test': (/^DROP\s*TEXT\s*SEARCH\s*TEMPLATE/gi).test(strQuery), 'link': strPrefix + 'sql-droptstemplate.html'},
        {'test': (/^DROP\s*TEXT\s*SEARCH\s*PARSER/gi).test(strQuery), 'link': strPrefix + 'sql-droptsparser.html'},
        {'test': (/^DROP\s*TEXT\s*SEARCH\s*DICTIONARY/gi).test(strQuery), 'link': strPrefix + 'sql-droptsdictionary.html'},
        {'test': (/^DROP\s*TEXT\s*SEARCH\s*CONFIGURATION/gi).test(strQuery), 'link': strPrefix + 'sql-droptsconfig.html'},
        {'test': (/^DROP\s*TABLESPACE/gi).test(strQuery), 'link': strPrefix + 'sql-droptablespace.html'},
        {'test': (/^DROP\s*TABLE/gi).test(strQuery), 'link': strPrefix + 'sql-droptable.html'},
        {'test': (/^DROP\s*SERVER/gi).test(strQuery), 'link': strPrefix + 'sql-dropserver.html'},
        {'test': (/^DROP\s*SEQUENCE/gi).test(strQuery), 'link': strPrefix + 'sql-dropsequence.html'},
        {'test': (/^DROP\s*SCHEMA/gi).test(strQuery), 'link': strPrefix + 'sql-dropschema.html'},
        {'test': (/^DROP\s*RULE/gi).test(strQuery), 'link': strPrefix + 'sql-droprule.html'},
        {'test': (/^DROP\s*ROLE/gi).test(strQuery), 'link': strPrefix + 'sql-droprole.html'},
        {'test': (/^DROP\s*OWNED/gi).test(strQuery), 'link': strPrefix + 'sql-drop-owned.html'},
        {'test': (/^DROP\s*OPERATOR\s*FAMILY/gi).test(strQuery), 'link': strPrefix + 'sql-dropopfamily.html'},
        {'test': (/^DROP\s*OPERATOR\s*CLASS/gi).test(strQuery), 'link': strPrefix + 'sql-dropopclass.html'},
        {'test': (/^DROP\s*OPERATOR/gi).test(strQuery), 'link': strPrefix + 'sql-dropoperator.html'},
        {'test': (/^DROP\s*LANGUAGE/gi).test(strQuery), 'link': strPrefix + 'sql-droplanguage.html'},
        {'test': (/^DROP\s*INDEX/gi).test(strQuery), 'link': strPrefix + 'sql-dropindex.html'},
        {'test': (/^DROP\s*GROUP/gi).test(strQuery), 'link': strPrefix + 'sql-dropgroup.html'},
        {'test': (/^DROP\s*FUNCTION/gi).test(strQuery), 'link': strPrefix + 'sql-dropfunction.html'},
        {'test': (/^DROP\s*FOREIGN\s*TABLE/gi).test(strQuery), 'link': strPrefix + 'sql-dropforeigntable.html'},
        {'test': (/^DROP\s*FOREIGN\s*DATA\s*WRAPPER/gi).test(strQuery), 'link': strPrefix + 'sql-dropforeigndatawrapper.html'},
        {'test': (/^DROP\s*EXTENSION/gi).test(strQuery), 'link': strPrefix + 'sql-dropextension.html'},
        {'test': (/^DROP\s*DOMAIN/gi).test(strQuery), 'link': strPrefix + 'sql-dropdomain.html'},
        {'test': (/^DROP\s*DATABASE/gi).test(strQuery), 'link': strPrefix + 'sql-dropdatabase.html'},
        {'test': (/^DROP\s*CONVERSION/gi).test(strQuery), 'link': strPrefix + 'sql-dropconversion.html'},
        {'test': (/^DROP\s*COLLATION/gi).test(strQuery), 'link': strPrefix + 'sql-dropcollation.html'},
        {'test': (/^DROP\s*CAST/gi).test(strQuery), 'link': strPrefix + 'sql-dropcast.html'},
        {'test': (/^DROP\s*AGGREGATE/gi).test(strQuery), 'link': strPrefix + 'sql-dropaggregate.html'},
        {'test': (/^DO/gi).test(strQuery), 'link': strPrefix + 'sql-do.html'},
        {'test': (/^DISCARD/gi).test(strQuery), 'link': strPrefix + 'sql-discard.html'},
        {'test': (/^DELETE/gi).test(strQuery), 'link': strPrefix + 'sql-delete.html'},
        {'test': (/^DECLARE/gi).test(strQuery), 'link': strPrefix + 'sql-declare.html'},
        {'test': (/^DEALLOCATE/gi).test(strQuery), 'link': strPrefix + 'sql-deallocate.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*VIEW/gi).test(strQuery), 'link': strPrefix + 'sql-createview.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*USER\s*MAPPING/gi).test(strQuery), 'link': strPrefix + 'sql-createusermapping.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*USER/gi).test(strQuery), 'link': strPrefix + 'sql-createuser.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*TYPE/gi).test(strQuery), 'link': strPrefix + 'sql-createtype.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*TRIGGER/gi).test(strQuery), 'link': strPrefix + 'sql-createtrigger.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*TEXT\s*SEARCH\s*TEMPLATE/gi).test(strQuery), 'link': strPrefix + 'sql-createtstemplate.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*TEXT\s*SEARCH\s*PARSER/gi).test(strQuery), 'link': strPrefix + 'sql-createtsparser.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*TEXT\s*SEARCH\s*DICTIONARY/gi).test(strQuery), 'link': strPrefix + 'sql-createtsdictionary.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*TEXT\s*SEARCH\s*CONFIGURATION/gi).test(strQuery), 'link': strPrefix + 'sql-createtsconfig.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*TABLESPACE/gi).test(strQuery), 'link': strPrefix + 'sql-createtablespace.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*TABLE\s*AS/gi).test(strQuery), 'link': strPrefix + 'sql-createtableas.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*TABLE/gi).test(strQuery), 'link': strPrefix + 'sql-createtable.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*SERVER/gi).test(strQuery), 'link': strPrefix + 'sql-createserver.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*SEQUENCE/gi).test(strQuery), 'link': strPrefix + 'sql-createsequence.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*SCHEMA/gi).test(strQuery), 'link': strPrefix + 'sql-createschema.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*RULE/gi).test(strQuery), 'link': strPrefix + 'sql-createrule.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*ROLE/gi).test(strQuery), 'link': strPrefix + 'sql-createrole.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*OPERATOR\s*FAMILY/gi).test(strQuery), 'link': strPrefix + 'sql-createopfamily.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*OPERATOR\s*CLASS/gi).test(strQuery), 'link': strPrefix + 'sql-createopclass.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*OPERATOR/gi).test(strQuery), 'link': strPrefix + 'sql-createoperator.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*LANGUAGE/gi).test(strQuery), 'link': strPrefix + 'sql-createlanguage.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*INDEX/gi).test(strQuery), 'link': strPrefix + 'sql-createindex.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*GROUP/gi).test(strQuery), 'link': strPrefix + 'sql-creategroup.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*FUNCTION/gi).test(strQuery), 'link': strPrefix + 'sql-createfunction.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*FOREIGN\s*TABLE/gi).test(strQuery), 'link': strPrefix + 'sql-createforeigntable.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*FOREIGN\s*DATA\s*WRAPPER/gi).test(strQuery), 'link': strPrefix + 'sql-createforeigndatawrapper.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*EXTENSION/gi).test(strQuery), 'link': strPrefix + 'sql-createextension.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*DOMAIN/gi).test(strQuery), 'link': strPrefix + 'sql-createdomain.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*DATABASE/gi).test(strQuery), 'link': strPrefix + 'sql-createdatabase.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*CONVERSION/gi).test(strQuery), 'link': strPrefix + 'sql-createconversion.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*COLLATION/gi).test(strQuery), 'link': strPrefix + 'sql-createcollation.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*CAST/gi).test(strQuery), 'link': strPrefix + 'sql-createcast.html'},
        {'test': (/^CREATE\s*(OR\s*REPLACE)?\s*(TEMP|TEMPORARY)?\s*AGGREGATE/gi).test(strQuery), 'link': strPrefix + 'sql-createaggregate.html'},
        {'test': (/^COPY/gi).test(strQuery), 'link': strPrefix + 'sql-copy.html'},
        {'test': (/^COMMIT\s*PREPARED/gi).test(strQuery), 'link': strPrefix + 'sql-commit-prepared.html'},
        {'test': (/^COMMIT/gi).test(strQuery), 'link': strPrefix + 'sql-commit.html'},
        {'test': (/^COMMENT/gi).test(strQuery), 'link': strPrefix + 'sql-comment.html'},
        {'test': (/^CLUSTER/gi).test(strQuery), 'link': strPrefix + 'sql-cluster.html'},
        {'test': (/^CLOSE/gi).test(strQuery), 'link': strPrefix + 'sql-close.html'},
        {'test': (/^CHECKPOINT/gi).test(strQuery), 'link': strPrefix + 'sql-checkpoint.html'},
        {'test': (/^BEGIN/gi).test(strQuery), 'link': strPrefix + 'sql-begin.html'},
        {'test': (/^ANALYZE/gi).test(strQuery), 'link': strPrefix + 'sql-analyze.html'},
        {'test': (/^ALTER\s*VIEW/gi).test(strQuery), 'link': strPrefix + 'sql-alterview.html'},
        {'test': (/^ALTER\s*USER\s*MAPPING/gi).test(strQuery), 'link': strPrefix + 'sql-alterusermapping.html'},
        {'test': (/^ALTER\s*USER/gi).test(strQuery), 'link': strPrefix + 'sql-alteruser.html'},
        {'test': (/^ALTER\s*TYPE/gi).test(strQuery), 'link': strPrefix + 'sql-altertype.html'},
        {'test': (/^ALTER\s*TRIGGER/gi).test(strQuery), 'link': strPrefix + 'sql-altertrigger.html'},
        {'test': (/^ALTER\s*TEXT\s*SEARCH\s*TEMPLATE/gi).test(strQuery), 'link': strPrefix + 'sql-altertstemplate.html'},
        {'test': (/^ALTER\s*TEXT\s*SEARCH\s*PARSER/gi).test(strQuery), 'link': strPrefix + 'sql-altertsparser.html'},
        {'test': (/^ALTER\s*TEXT\s*SEARCH\s*DICTIONARY/gi).test(strQuery), 'link': strPrefix + 'sql-altertsdictionary.html'},
        {'test': (/^ALTER\s*TEXT\s*SEARCH\s*CONFIGURATION/gi).test(strQuery), 'link': strPrefix + 'sql-altertsconfig.html'},
        {'test': (/^ALTER\s*TABLESPACE/gi).test(strQuery), 'link': strPrefix + 'sql-altertablespace.html'},
        {'test': (/^ALTER\s*TABLE/gi).test(strQuery), 'link': strPrefix + 'sql-altertable.html'},
        {'test': (/^ALTER\s*SERVER/gi).test(strQuery), 'link': strPrefix + 'sql-alterserver.html'},
        {'test': (/^ALTER\s*SEQUENCE/gi).test(strQuery), 'link': strPrefix + 'sql-altersequence.html'},
        {'test': (/^ALTER\s*SCHEMA/gi).test(strQuery), 'link': strPrefix + 'sql-alterschema.html'},
        {'test': (/^ALTER\s*ROLE/gi).test(strQuery), 'link': strPrefix + 'sql-alterrole.html'},
        {'test': (/^ALTER\s*OPERATOR\s*FAMILY/gi).test(strQuery), 'link': strPrefix + 'sql-alteropfamily.html'},
        {'test': (/^ALTER\s*OPERATOR\s*CLASS/gi).test(strQuery), 'link': strPrefix + 'sql-alteropclass.html'},
        {'test': (/^ALTER\s*OPERATOR/gi).test(strQuery), 'link': strPrefix + 'sql-alteroperator.html'},
        {'test': (/^ALTER\s*LARGE\s*OBJECT/gi).test(strQuery), 'link': strPrefix + 'sql-alterlargeobject.html'},
        {'test': (/^ALTER\s*LANGUAGE/gi).test(strQuery), 'link': strPrefix + 'sql-alterlanguage.html'},
        {'test': (/^ALTER\s*INDEX/gi).test(strQuery), 'link': strPrefix + 'sql-alterindex.html'},
        {'test': (/^ALTER\s*GROUP/gi).test(strQuery), 'link': strPrefix + 'sql-altergroup.html'},
        {'test': (/^ALTER\s*FUNCTION/gi).test(strQuery), 'link': strPrefix + 'sql-alterfunction.html'},
        {'test': (/^ALTER\s*FOREIGN\s*TABLE/gi).test(strQuery), 'link': strPrefix + 'sql-alterforeigntable.html'},
        {'test': (/^ALTER\s*FOREIGN\s*DATA\s*WRAPPER/gi).test(strQuery), 'link': strPrefix + 'sql-alterforeigndatawrapper.html'},
        {'test': (/^ALTER\s*EXTENSION/gi).test(strQuery), 'link': strPrefix + 'sql-alterextension.html'},
        {'test': (/^ALTER\s*DOMAIN/gi).test(strQuery), 'link': strPrefix + 'sql-alterdomain.html'},
        {'test': (/^ALTER\s*DEFAULT\s*PRIVILEGES/gi).test(strQuery), 'link': strPrefix + 'sql-alterdefaultprivileges.html'},
        {'test': (/^ALTER\s*DATABASE/gi).test(strQuery), 'link': strPrefix + 'sql-alterdatabase.html'},
        {'test': (/^ALTER\s*CONVERSION/gi).test(strQuery), 'link': strPrefix + 'sql-alterconversion.html'},
        {'test': (/^ALTER\s*COLLATION/gi).test(strQuery), 'link': strPrefix + 'sql-altercollation.html'},
        {'test': (/^ALTER\s*AGGREGATE/gi).test(strQuery), 'link': strPrefix + 'sql-alteraggregate.html'},
        {'test': (/^ABORT/gi).test(strQuery), 'link': strPrefix + 'sql-abort.html'}
    ], i, len;

    for (i = 0, len = docLinks.length; i < len; i += 1) {
        if (docLinks[i].test) {
            return docLinks[i].link;
        }
    }
}
