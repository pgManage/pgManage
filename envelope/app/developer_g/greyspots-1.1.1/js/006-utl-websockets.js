//jslint white:true


(function () {
    'use strict';
    
    // encodeForTabDelimited('asdf\\asdf\\asdf\r\nasdf\r\nasdf\tasdf\tasdf')
    function encodeForTabDelimited(strValue) {
        return  strValue === '\\N' ? strValue :
                strValue.replace(/\\/g, '\\\\') // double up backslashes
                        .replace(/\n/g, '\\n')  // replace newline with the text representation '\n'
                        .replace(/\r/g, '\\r')  // replace carriage return with the text representation '\r'
                        .replace(/\t/g, '\\t')  // replace tab with the text representation '\t'
                        .replace(/^NULL$/g, '\\N');
    }
    
    var bolPreventErrors = false;
    function webSocketConnectionErrorDialog(socket, addinText, retryCallback, cancelCallback) {
        
        if (!document.getElementById('dialog-from-dialog-ws-conn-error') && bolPreventErrors === false) {
            var templateElement = document.createElement('template');
            
            GS.removeAllLoaders();
            
            templateElement.setAttribute('id', 'dialog-ws-conn-error');
            templateElement.setAttribute('data-theme', 'error');
            templateElement.innerHTML = ml(function () {/*
                <gs-page>
                    <gs-header><center><h3>There was an error!</h3></center></gs-header>
                    <gs-body padded>
                        <pre style="white-space: pre-wrap;">
    There has been an error with the Database connection.{{ADDIN}}</pre>
                    </gs-body>
                    <gs-footer>
                        <gs-grid gutter reflow-at="420">
                            <gs-block><gs-button dialogclose>Try to reconnect</gs-button></gs-block>
                            <gs-block><gs-button dialogclose>Dismiss so I can copy my progress</gs-button></gs-block>
                        </gs-grid>
                    </gs-footer>
                </gs-page>
            */}).replace('{{ADDIN}}', (addinText ? '\n\n' + addinText : ''));
            
            GS.openDialog(templateElement, '', function (event, strAnswer) {
                if (strAnswer === 'Try to reconnect') {
                    GS.envSocket = GS.openSocket('env', socket.GSSessionID, socket.notifications);
                } else {
                    bolPreventErrors = true;
                }
            });
        }
    }
    
    function webSocketNormalizeError(event) {
        var i, len, arrLines, arrLine, strData,
            jsnRet = {
                'error_title': '',
                'error_text': '',
                'error_detail': '',
                'error_hint': '',
                'error_query': '',
                'error_context': '',
                'error_position': '',
                'error_notice': '',
                'original_data': event
            };
        
        event = event || {};
        
        jsnRet.error_text = event.reason || '';
        
        // if there is message data: parse it
        if (event.data) {
            strData = event.data;
            
            // strip out messageid
            if (strData.substring(0, strData.indexOf(' ')) === 'messageid') {
                strData = strData.substring(strData.indexOf('\n') + 1);
            }
            
            // strip out response number
            if (strData.substring(0, strData.indexOf(' ')) === 'responsenumber') {
                strData = strData.substring(strData.indexOf('\n') + 1);
            }
            
            // strip out fatal
            if (strData.indexOf('FATAL\n') === 0) {
                strData = strData.substring(strData.indexOf('\n') + 1);
            }
            
            // strip out "Query failed: "
            if (strData.indexOf('Query failed: ') === 0) {
                strData = strData.substring('Query failed: '.length);
            }
            
            // save error text in case we dont find any error part labels
            jsnRet.error_text = strData;
            
            // trim and split on return for parsing
            arrLines = strData.trim().split('\n');
            
            for (i = 0, len = arrLines.length; i < len; i += 1) {
                arrLine = arrLines[i].split('\t');
                
                jsnRet[arrLine[0]] = GS.decodeFromTabDelimited(arrLine[1] || '');
            }
        }
        
        // get error title and error hint
        if (event.code === 1001) {
            jsnRet.error_title = 'Going Away';
            jsnRet.error_hint = 'The server or client closed the connection because of server shutdown or navigating away from the page.';
            
        } else if (event.code === 1002) {
            jsnRet.error_title = 'Protocol';
            jsnRet.error_hint = 'The connection was closed because of error related to the protocol used.';
            
        } else if (event.code === 1003) {
            jsnRet.error_title = 'Unsupported Data';
            jsnRet.error_hint = 'The connection was closed because the data that was received was not it a supported format.';
            
        } else if (event.code === 1005) {
            jsnRet.error_title = 'No Status Received';
            jsnRet.error_hint = 'The connection was closed because it received an empty status.';
            
        } else if (event.code === 1006) {
            jsnRet.error_title = 'Abnormal Closure';
            jsnRet.error_hint = 'The connection was closed because of abnormal circumstances.';
            
        } else if (event.code === 1007) {
            jsnRet.error_title = 'Invalid Payload Data';
            jsnRet.error_hint = 'The connection was closed because the payload type did not match the defined message type.';
            
        } else if (event.code === 1008) {
            jsnRet.error_title = 'Policy Violation';
            jsnRet.error_hint = 'The connection was closed because policy governing this connection was violated.';
            
        } else if (event.code === 1009) {
            jsnRet.error_title = 'Message Too Big';
            jsnRet.error_hint = 'The connection was closed because the message was too long for it to proccess.';
            
        } else if (event.code === 1010) {
            jsnRet.error_title = 'Mandatory Extension';
            jsnRet.error_hint = 'The client closed the connection because the server was supposed to negotiate extension(s) but it did not.';
            
        } else if (event.code === 1011) {
            jsnRet.error_title = 'Internal Server';
            jsnRet.error_hint = 'The server closed the connection because it could not fulfill the request.';
            
        } else if (event.code === 1015) {
            jsnRet.error_title = 'TLS handshake';
            jsnRet.error_hint = 'The connection was closed because the handshake failed.';
        }
        
        //console.log(jsnRet);
        
        return jsnRet;
    }
    
    function cleanErrorValue(strValue) {
        strValue = strValue || '';
        
        if (strValue.indexOf('DB_exec failed:') !== -1) {
            strValue = strValue.replace(/[.\s\S]*DB_exec\ failed:/mi, '');
        }
        
        if (strValue.indexOf('Query failed:') !== -1) {
            strValue = strValue.replace(/[.\s\S]*Query\ failed:/mi, '');
        }
        
        if (strValue.indexOf('FATAL') !== -1) {
            strValue = strValue.replace(/[.\s\S]*FATAL/mi, '');
        }
        
        strValue = strValue
                        .replace(/\\n/gi, '\n')
                        .replace(/\\t/gi, '\t')
                        .replace(/\[.*\]/gi, '')
                        .replace(/\([0-9]*\)/gi, '');
        
        return GS.trim(strValue.trim(), '"');
    }
    
    function errorJSONToHTML(errorJSON) {
        return '<pre style="word-break: break-all; white-space: pre-wrap;">' +
                    (errorJSON.error_title ?
                        'There was ' +
                            (
                                ['A', 'E', 'I', 'O', 'U']
                                    .indexOf(errorJSON.error_title[0].toUpperCase()) === -1
                                        ? 'a'
                                        : 'an'
                            ) +
                            ' "' + encodeHTML(errorJSON.error_title) + '" error:' :
                        'There was an error:') +
                        (
                            !errorJSON.error_hint &&
                            !errorJSON.error_query &&
                            !errorJSON.error_context &&
                            !errorJSON.error_notice
                                ? '<br /><br />' + encodeHTML(errorJSON.error_text)
                                : ''
                        ) +
                        (errorJSON.error_hint     ? '<br /><br />HINT: ' + encodeHTML(errorJSON.error_hint) : '') +
                      //(errorJSON.error_detail   ? '<br /><br />DETAIL: ' + encodeHTML(errorJSON.error_detail) : '') +
                        (errorJSON.error_query    ? '<br /><br />QUERY: ' + encodeHTML(errorJSON.error_query) : '') +
                        (errorJSON.error_position ? '<br /><br />ERROR POSITION: ' + encodeHTML(errorJSON.error_position) : '') +
                        (errorJSON.error_context  ? '<br /><br />CONTEXT: ' + encodeHTML(errorJSON.error_context) : '') +
                        (errorJSON.error_notice   ? '<br /><br /><br />' + encodeHTML(errorJSON.error_notice) : '') +
                '</pre>';
    }
    
    GS.webSocketErrorDialog = function (jsnError, tryAgainCallback, cancelCallback) {
        var templateElement = document.createElement('template'), strHTML, jsnErrorClean;
        
        jsnErrorClean = {};
        
        jsnErrorClean.error_text     = cleanErrorValue(jsnError.error_text);
        jsnErrorClean.error_hint     = cleanErrorValue(jsnError.error_hint);
        jsnErrorClean.error_detail   = cleanErrorValue(jsnError.error_detail);
        jsnErrorClean.error_query    = cleanErrorValue(jsnError.error_query);
        jsnErrorClean.error_position = cleanErrorValue(jsnError.error_position);
        jsnErrorClean.error_context  = cleanErrorValue(jsnError.error_context);
        jsnErrorClean.error_notice   = cleanErrorValue(jsnError.error_notice);
        
        templateElement.setAttribute('data-theme', 'error');
        strHTML = ml(function () {/*
            <gs-page>
                <gs-header><center><h3>There was an error!</h3></center></gs-header>
                <gs-body padded>
                    {{HTML}}
                    <br />
                    <gs-button class="error-button-show-full-text">Show Full Error Text</gs-button>
                </gs-body>
                <gs-footer>{{BUTTONS}}</gs-footer>
            </gs-page>
        */}).replace('{{HTML}}', errorJSONToHTML(jsnErrorClean));
        
        var openFunction = function () {
            xtag.query(this, '.error-button-show-full-text')[0].addEventListener('click', function () {
                var templateElement = document.createElement('template');
                
                templateElement.innerHTML = ml(function () {/*
                    <gs-page>
                        <gs-header><center><h3>Full Error Text</h3></center></gs-header>
                        <gs-body padded>
                            {{HTML}}
                        </gs-body>
                        <gs-footer><gs-button dialogclose>Done</gs-button></gs-footer>
                    </gs-page>
                */}).replace('{{HTML}}', errorJSONToHTML(jsnError));
                
                GS.openDialog(templateElement);
            });
        };
        
        if (typeof tryAgainCallback === 'function') {
            templateElement.innerHTML =
                strHTML.replace(
                    '{{BUTTONS}}',
                    '<gs-grid>' +
                    '    <gs-block><gs-button dialogclose>Cancel</gs-button></gs-block>' +
                    '    <gs-block><gs-button dialogclose listen-for-return>Try Again</gs-button></gs-block>' +
                    '</gs-grid>'
                );
            
            GS.openDialog(templateElement, openFunction, function (event, strAnswer) {
                if (strAnswer === 'Try Again') {
                    tryAgainCallback(strAnswer);
                } else {
                    if (typeof cancelCallback === 'function') {
                        cancelCallback(strAnswer);
                    }
                }
            });
            
        } else {
            templateElement.innerHTML = strHTML.replace('{{BUTTONS}}', '<gs-button dialogclose listen-for-return>Ok</gs-button>');
            GS.openDialog(templateElement, openFunction);
        }
    };
    
    var sequence = 0, jsnMessages = {}, arrWaitingCalls = [];
    GS.openSocket = function (strLink, relinkSessionID, relinkSessionNotifications) {
        var strLoc = window.location.toString(),
            intUrlStart = strLoc.indexOf('/postage/') + 9,
            strConn = strLoc.substring(intUrlStart, strLoc.substring(intUrlStart).indexOf('/') + intUrlStart);
        var socket = new WebSocket(
                            (window.location.protocol.toLowerCase().indexOf('https') === 0 ? 'wss' : 'ws') +
                            '://' + (window.location.host || window.location.hostname) + '/postage/' + strConn + '/' + strLink +
                            (relinkSessionID ? '?sessionid=' + relinkSessionID : '')); //nunzio.wfprod.com
        
        if (relinkSessionID) {
            socket.GSSessionID = relinkSessionID;
            socket.oldSessionID = relinkSessionID;
        }
        if (relinkSessionNotifications) {
            socket.notifications = relinkSessionNotifications;
        } else {
            socket.notifications = [];
        }
        socket.onmessage = function (event) {
            var message = event.data, messageID, responseNumber, key, strError, arrLines, i, len, jsnMessage, startFrom;
            
            if (typeof (message) === 'object') {
                //window.binaryTestTEST = message;
                //console.log(message);
                var buf = message;
                message = String.fromCharCode.apply(null, new Uint8Array(buf));
                //console.log(buf);
                //console.log(message);
            }
            
            // if sessionid
            if (message.indexOf('sessionid = ') === 0) {
                socket.GSSessionID = message.substring('sessionid = '.length, message.indexOf('\n'));
                GS.triggerEvent(window, 'socket-connect');
                
                for (key in jsnMessages) {
                    jsnMessage = jsnMessages[key];
                    
                    if ((
                            jsnMessage.session === socket.GSSessionID ||
                            jsnMessage.session === socket.oldSessionID
                        ) && jsnMessage.bolFinished === false) {
                        
                        startFrom = 1;
                        for (i = 0, len = jsnMessage.arrResponseNumbers.length; i < len; i += 1) {
                            // if there is a difference between the current response number and the
                            //      startFrom: stop looping because startFrom now holds the number that we want
                            if (startFrom !== jsnMessage.arrResponseNumbers[i]) {
                                break;
                            }
                            startFrom += 1;
                        }
                        
                        GS.requestFromSocket(socket, 'SEND FROM\t' + startFrom, '', jsnMessage.id);
                    }
                }
                
                for (i = 0, len = arrWaitingCalls.length; i < len; i += 1) {
                    arrWaitingCalls[0]();
                    arrWaitingCalls.splice(0, 1);
                }
                
            // else
            } else {
                messageID = message.substring('messageid = '.length, message.indexOf('\n'));
                message = message.substring(message.indexOf('\n') + 1);
                
                jsnMessage = jsnMessages[messageID];
                
                // if there is a message entry for this message ID
                if (jsnMessage) {
                    arrLines = message.split('\n');
                    
                    // if there is no response number: assume this is the last message and mark the message as finished
                    if (message.indexOf('responsenumber = ') === -1 ||
                        (
                            message.indexOf('responsenumber = ') === 0 &&
                            (
                                arrLines[1] === 'TRANSACTION COMPLETED' ||
                                arrLines[2] === 'OK'
                            )
                        )) {
                        jsnMessage.bolFinished = true;
                    }
                    
                    // if there is a response number
                    if (message.indexOf('responsenumber = ') === 0) {
                        // get message number
                        responseNumber = message.substring('responsenumber = '.length, message.indexOf('\n'));
                        message = message.substring(message.indexOf('\n') + 1);
                        
                        // append message number and message content to arrays
                        jsnMessage.arrResponseNumbers.push(parseInt(responseNumber, 10));
                        jsnMessage.arrResponses.push(message);
                        
                        // send confirm signal
                        GS.requestFromSocket(socket, 'CONFIRM\t' + responseNumber, '', messageID);
                    }
                    
                    // ERROR CHECK
                    arrLines = message.split('\n');
                    
                    // if there is a transactionid: look at the second line
                    if (arrLines[0].indexOf('transactionid') === 0 && arrLines[1] === 'FATAL') {
                        strError = 'error';
                        message = message.substring(message.indexOf('\n') + 1);
                        message = message.substring(message.indexOf('\n') + 1);
                        message = arrLines[0] + '\n' + message;
                        
                    // else: check the first line
                    } else if (arrLines[0] === 'FATAL') {
                        strError = 'error';
                        message = message.substring(message.indexOf('\n') + 1);
                    }
                    
                    // if transaction complete: clear message arrays and mark as finised
                    if (message === 'TRANSACTION COMPLETED') { // || message === 'EMPTY\n\\.'
                        jsnMessage.arrResponseNumbers = [];
                        jsnMessage.arrResponses = [];
                        jsnMessage.bolFinished = true;
                    }
                    
                    // if there was a FATAL: mark as finished and apply callback
                    if (strError) {
                        jsnMessage.bolFinished = true;
                        jsnMessage.callback.apply(null, [message, strError, webSocketNormalizeError(event)]);
                        
                    // else: call callback with message
                    } else {
                        jsnMessage.callback.apply(null, [message]);
                    }
                    
                // else if the messageID is 'NULL': notification from the server
                } else if (messageID === 'NULL') {
                    socket.notifications.push(message);
                    GS.triggerEvent(window, 'notification', {'socket': socket, 'message': message});
                }
            }
        };
        
        socket.onopen = function (event) {
            
        };
        
        socket.onerror = function (event) {
            var i, len;
            
            console.log('SOCKET ERROR', event);
            socket.bolError = true;
            //socket.stayClosed = true;
            
            //for (i = 0, len = arrWaitingCalls.length; i < len; i += 1) {
            //    arrWaitingCalls[0]();
            //    arrWaitingCalls.splice(0, 1);
            //}
        };
        
        socket.onclose = function (event) {
            console.log('SOCKET CLOSING', socket.stayClosed, socket.bolError, event);
            
            // error closure dialog
            if (socket.bolError && arrWaitingCalls.length > 0) {
                // abnormal closure
                if (event.code === 1006) {
                    webSocketConnectionErrorDialog(socket, 'The connection to the database has been closed. We cannot display the reasons for this closure because the browser does not give us access to those details, please check the server logs for the error details.');
                    
                // protocol error
                } else if (event.code === 1002) {
                    webSocketConnectionErrorDialog(socket, 'The connection to the database has been closed. Either the server or the browser has closed the connection because of a Websocket Protocol error.');
                    
                // type error
                } else if (event.code === 1003) {
                    webSocketConnectionErrorDialog(socket, 'The connection to the database has been closed. Either the server or the browser has closed the connection because of it was sent a data type it could not understand.');
                } else {
                    webSocketConnectionErrorDialog(socket, 'The connection to the database has been closed. The cause of this is unknown.');
                }
            }
            
            if (!socket.stayClosed) {
                setTimeout(function() {
                    console.log('ATTEMPTING SOCKET RE-OPEN', socket);
                    GS.triggerEvent(window, 'socket-reconnect');
                    GS.envSocket = GS.openSocket('env', GS.envSocket.GSSessionID, GS.envSocket.notifications);
                }, 1000);
            } else {
                if (socket.bolError) {
                    console.log('SOCKET NOT RE-OPENING DUE TO ERROR');
                } else {
                    console.log('SOCKET NOT RE-OPENING DUE TO MANUAL CLOSE');
                }
            }
        };
        
        return socket;
    };
    
    GS.requestFromSocket = function (socket, strMessage, callback, forceMessageID) {
        var oldOnOpen, messageID;
        
        if (!socket || socket.readyState === socket.CLOSED) {
            if (!GS.envSocket || GS.envSocket.readyState === socket.CLOSED) {
                //console.trace('ATTEMPTING SOCKET RE-OPEN 2');
                GS.envSocket = GS.openSocket('env');
            }
            socket = GS.envSocket;
        }
        
        // if the socket is open: register callback and send request
        if (socket.readyState === socket.OPEN && socket.GSSessionID) {
            
            if (!forceMessageID) {
                sequence += 1;
                messageID = socket.GSSessionID + '_' + sequence;
                jsnMessages[messageID] = {
                    'id': messageID,
                    'session': socket.GSSessionID,
                    'callback': callback,
                    'arrResponseNumbers': [],
                    'arrResponses': [],
                    'bolFinished': false
                };
                
            } else {
                messageID = forceMessageID;
            }
            
            if (typeof (strMessage) === 'object') {
                jsnMessages[messageID].parameters = new Blob(['messageid = ' + messageID + '\n', strMessage], {type: 'application/x-binary'});
            } else {
                jsnMessages[messageID].parameters = 'messageid = ' + messageID + '\n' + strMessage;
            }
            socket.send(jsnMessages[messageID].parameters);
            //console.log('SOCKET MESSAGE SENT                   ', 'messageid = ' + sequence);// + '\n' + strMessage);
            
            return messageID;
            
        // if the socket is connecting: bind socket onopen to call this funtion again
        } else if (socket.readyState === socket.CONNECTING || socket.readyState === socket.OPEN) {
            //console.log('SOCKET REQUEST WHILE CONNECTING       ');
            
            arrWaitingCalls.push(function () {
                GS.requestFromSocket(socket, strMessage, callback);
            });
            
        // if the socket is closed: error
        } else if (socket.readyState === socket.CLOSED) {
            //console.log('SOCKET REQUEST WHILE CLOSED           ');
            callback.apply(null, ['Socket Is Closed', 'error', webSocketNormalizeError({'reason': 'Socket Is Closed'})]);
            
        // if the socket is closing: error
        } else if (socket.readyState === socket.CLOSING) {
            //console.log('SOCKET REQUEST WHILE CLOSING          ');
            callback.apply(null, ['Socket Is Closing', 'error', webSocketNormalizeError({'reason': 'Socket Is Closing'})]);
        }
    };
    
    // abstraction function for ease of use of the RAW format
    GS.requestRawFromSocket = function (socket, strQuery, callback) {
        var intResponsePart = 0, intQueryNumber = 0, intCallbackNumber = 0, intCallbackNumberThisQuery = 0
          , intResponseNumberThisQuery = 0, arrMessages, arrColumnNames, arrColumnTypes
          , arrStart, dteStart, arrEnd, dteEnd, intRows;
        
        return GS.requestFromSocket(socket, 'RAW\n' + strQuery, function (data, error, errorData) {
            var arrRecords, arrLines, i, len, strMode;
            
            if (!error) {
                if (intResponseNumberThisQuery === 0) {
                    // clear variables
                    strQuery = '';
                    arrMessages = [];
                    arrColumnNames = [];
                    arrColumnTypes = [];
                }
                
                // if QUERY is found: reset response part to 0
                if (data.indexOf('QUERY\n') === 0) {
                    //console.log('Per Query Reset');
                    intResponsePart = 0;
                    intCallbackNumberThisQuery = 0;
                }
                
                // if first line is 'Rows Affected': add one to intResponsePart
                if (data.indexOf('Rows Affected\n') === 0 || data === 'EMPTY' || data === 'TRANSACTION COMPLETED') {
                    intResponsePart += 1;
                }
                
                //console.log('1***', data);
                //console.log(intResponsePart, data);
                
                // response part 0 is:
                //      strQuery
                //      arrMessages
                //      arrColumnNames
                //      arrColumnTypes
                if (intResponsePart === 0) {
                    //console.log('2***');
                    // split lines
                    arrLines = data.split('\n');
                    
                    // loop through lines
                    for (i = 0, len = arrLines.length; i < len; i += 1) {
                        // if mode line: set mode
                        if (arrLines[i].indexOf('QUERY\t') === 0 ||
                            arrLines[i].indexOf('START\t') === 0 ||
                            arrLines[i].indexOf('END\t') === 0 ||
                            arrLines[i].indexOf('ROWS\t') === 0 ||
                            arrLines[i].indexOf('DEBUG\t') === 0 ||
                            arrLines[i].indexOf('LOG\t') === 0 ||
                            arrLines[i].indexOf('INFO\t') === 0 ||
                            arrLines[i].indexOf('NOTICE\t') === 0 ||
                            arrLines[i].indexOf('WARNING\t') === 0 ||
                            arrLines[i] === 'COLUMNS') {
                            
                            if (arrLines[i] === 'COLUMNS') {
                                strMode = arrLines[i];
                            } else {
                                strMode = arrLines[i].substring(0, arrLines[i].indexOf('\t'));
                            }
                        }
                        
                        //console.log(strMode, arrLines[i]);
                        
                        // if mode is QUERY: save query
                        if (strMode === 'QUERY') {
                            strQuery = GS.decodeFromTabDelimited(arrLines[i].substring(arrLines[i].indexOf('\t') + 1));
                            //console.log(arrLines[i], strQuery);
                            
                        // if mode is START: save start
                        } else if (strMode === 'START') {
                            arrStart = GS.decodeFromTabDelimited(arrLines[i].substring(arrLines[i].indexOf('\t') + 1)).split('\t');
                            dteStart = new Date(arrStart[0] + ' ' + arrStart[1] + ' GMT');
                            if (arrStart[2]) {
                                dteStart.setMilliseconds(parseInt(arrStart[2], 10) / 1000);
                            }
                            //console.log(strStart, dteStart);
                            
                        // if mode is END: save end
                        } else if (strMode === 'END') {
                            arrEnd = GS.decodeFromTabDelimited(arrLines[i].substring(arrLines[i].indexOf('\t') + 1)).split('\t');
                            dteEnd = new Date(arrEnd[0] + ' ' + arrEnd[1] + ' GMT');
                            if (arrEnd[2]) {
                                dteEnd.setMilliseconds(parseInt(arrEnd[2], 10) / 1000);
                            }
                            //console.log(strEnd, dteEnd);
                            
                        // if mode is ROWS: save total rows
                        } else if (strMode === 'ROWS') {
                            intRows = parseInt(GS.decodeFromTabDelimited(arrLines[i].substring(arrLines[i].indexOf('\t') + 1)), 10);
                            
                        // if mode is DEBUG: add DEBUG to array
                        } else if (strMode === 'DEBUG') {
                            arrMessages.push({
                                'level': 'DEBUG',
                                'content': GS.decodeFromTabDelimited(arrLines[i].substring(arrLines[i].indexOf('\t') + 1))
                            });
                            
                        // if mode is LOG: add LOG to array
                        } else if (strMode === 'LOG') {
                            arrMessages.push({
                                'level': 'LOG',
                                'content': GS.decodeFromTabDelimited(arrLines[i].substring(arrLines[i].indexOf('\t') + 1))
                            });
                            
                        // if mode is INFO: add INFO to array
                        } else if (strMode === 'INFO') {
                            arrMessages.push({
                                'level': 'INFO',
                                'content': GS.decodeFromTabDelimited(arrLines[i].substring(arrLines[i].indexOf('\t') + 1))
                            });
                            
                        // if mode is NOTICE: add NOTICE to array
                        } else if (strMode === 'NOTICE') {
                            arrMessages.push({
                                'level': 'NOTICE',
                                'content': GS.decodeFromTabDelimited(arrLines[i].substring(arrLines[i].indexOf('\t') + 1))
                            });
                            
                        // if mode is WARNING: add WARNING to array
                        } else if (strMode === 'WARNING') {
                            arrMessages.push({
                                'level': 'WARNING',
                                'content': GS.decodeFromTabDelimited(arrLines[i].substring(arrLines[i].indexOf('\t') + 1))
                            });
                            
                        // if mode is COLUMNS: get COLUMNS
                        } else if (strMode === 'COLUMNS') {
                            arrColumnNames = arrLines[i + 1].split('\t');
                            arrColumnTypes = arrLines[i + 2].split('\t');
                            intResponsePart += 1;
                            break;
                        }
                    }
                    
                } else if (intResponsePart >= 1) {
                    //console.log(intQueryNumber, intCallbackNumber, intCallbackNumberThisQuery,
                    //            strQuery, arrMessages, arrColumnNames, arrColumnTypes, data);
                    //console.log('3***');
                    if (typeof callback === 'function') {
                        //console.log('4*** CALLBACK');
                        callback({
                            'intQueryNumber': intQueryNumber,
                            'intCallbackNumber': intCallbackNumber,
                            'intCallbackNumberThisQuery': intCallbackNumberThisQuery,
                            'strQuery': strQuery,
                            'dteStart': dteStart,
                            'dteEnd': dteEnd,
                            'intRows': intRows,
                            'arrMessages': arrMessages,
                            'arrColumnNames': arrColumnNames,
                            'arrColumnTypes': arrColumnTypes,
                            'strMessage': (data !== 'TRANSACTION COMPLETED' ? data : ''),
                            'bolLastMessage': (data === 'TRANSACTION COMPLETED')
                        }, error);
                        
                        intCallbackNumber += 1;
                        intCallbackNumberThisQuery += 1;
                    }
                }
                
                intResponseNumberThisQuery += 1;
                
                if (data === '\\.' || data.indexOf('Rows Affected\n') === 0) {
                    intQueryNumber += 1;
                    intCallbackNumberThisQuery = 0;
                    intResponsePart = 0;
                    intResponseNumberThisQuery = 0;
                }
                
            } else {
                errorData.arrMessages = arrMessages
                if (typeof callback === 'function') {
                    callback(errorData, error);
                }
            }
        });
    };
    
    GS.requestSelectFromSocket = function (socket, strSchema, strObject, strReturnCols, strWhere, strOrd, strLimit, strOffset, finalCallback) {
        var strMessage = 'SELECT\t' + encodeForTabDelimited(strSchema) + '\t' + encodeForTabDelimited(strObject) +
                            '\nRETURN\t' + strReturnCols + '\n\n' +
                            'where\t' + (strOrd ? 'order by\t' : '') + 'limit\toffset\n' +
                            encodeForTabDelimited(strWhere || '1=1') + '\t' + (strOrd ? encodeForTabDelimited(strOrd) + '\t' : '') +
                            encodeForTabDelimited(strLimit || 'ALL') + '\t' + encodeForTabDelimited(strOffset || '0'),
            intResponse = 0, intCallback = 0, arrColumnNames, arrColumnTypes, arrDecodedColumnNames, arrDecodedColumnTypes;
        
        //console.log(strMessage);
        
        GS.requestFromSocket(socket, strMessage, function (data, error, errorData) {
            var arrLines, i, len;
            if (!error) {
                if (intResponse === 0) {
                    arrLines = data.split('\n');
                    arrColumnNames = arrLines[0].split('\t');
                    arrColumnTypes = arrLines[1].split('\t');
                    arrDecodedColumnNames = [];
                    arrDecodedColumnTypes = [];
                    
                    for (i = 0, len = arrColumnNames.length; i < len; i += 1) {
                        arrDecodedColumnNames.push(GS.decodeFromTabDelimited(arrColumnNames[i]));
                    }
                    
                    for (i = 0, len = arrColumnTypes.length; i < len; i += 1) {
                        arrDecodedColumnTypes.push(GS.decodeFromTabDelimited(arrColumnTypes[i]));
                    }
                    
                } else {
                    finalCallback({
                        'arrColumnNames': arrColumnNames,
                        'arrColumnTypes': arrColumnTypes,
                        'arrDecodedColumnNames': arrDecodedColumnNames,
                        'arrDecodedColumnTypes': arrDecodedColumnTypes,
                        'intCallback': intCallback,
                        'strMessage': data
                    }, error);
                    intCallback += 1;
                }
                
            } else {
                finalCallback(errorData, error);
            }
            intResponse += 1;
        });
    };
    
    
    /*
        INSERT	test	rmultiple_pk_test
        RETURN	id1	id2	id3	page_name_pk	id4	test1	test2	test3
        PK	id1	id2	id3	page_name_pk	id4
        SEQ	test.seq1	test.seq2			
        
        page_name_pk	test1	test2	test3
        page_name_pk1	test1	test2	test3
        page_name_pk2	test1	test2	test3
        page_name_pk3	test1	test2	test3
        page_name_pk4	test1	test2	test3
        
        
        
        If a column is being inserted, then the SEQ entry for it needs to be empty
    */
    GS.requestInsertFromSocket = function (socket, strSchema, strObject, strReturnCols, strPkCols, strSeqCols, insertData, beginCallback, confirmCallback, finalCallback) {
        var strMessage = 'INSERT\t' + encodeForTabDelimited(strSchema) + '\t' + encodeForTabDelimited(strObject) +
                         '\nRETURN\t' + strReturnCols +
                         (strPkCols ? '\nPK\t' + strPkCols : '') +
                         (strPkCols ? '\nSEQ\t' + strSeqCols : '') +
                         '\n\n' + insertData;
        
        //console.log(strMessage);
        
        GS.requestBegin(socket, function (data, error) {
            var transactionID;
            
            if (!error) {
                transactionID = data;
                if (typeof beginCallback === 'function') { beginCallback(data, error); }
                
                GS.requestFromSocket(GS.envSocket, 'transactionid = ' + transactionID + '\n' + strMessage, function (data, error, errorData) {
                    var commitFunction, rollbackFunction;
                    
                    if (!error) {
                        data = data.substring(data.indexOf('\n') + 1); // transactionid
                        //data = data.substring(data.indexOf('\n') + 1); // responsenumber
                    }
                    
                    console.log('INSERT DATA:', data);
                    console.log('INSERT TRANSID:', transactionID);
                    
                    commitFunction = function () {
                        GS.requestCommit(socket, transactionID, function (data, error) {
                            if (!error) { data = data.substring(data.indexOf('\n') + 1); }
                            
                            finalCallback('COMMIT', data, error);
                        });
                    };
                    rollbackFunction = function () {
                        GS.requestRollback(socket, transactionID, function (data, error) {
                            if (!error) { data = data.substring(data.indexOf('\n') + 1); }
                            
                            finalCallback('ROLLBACK', data, error);
                        });
                    };
                    
                    if (!error) {
                        confirmCallback(data, error, transactionID, commitFunction, rollbackFunction);
                    } else {
                        confirmCallback(errorData, error, transactionID, commitFunction, rollbackFunction);
                    }
                });
                
            } else {
                if (typeof beginCallback === 'function') { beginCallback(data, error); }
            }
        });
    };
    
    
    GS.requestUpdateFromSocket = function (socket, strSchema, strObject, strReturnCols, strHashCols, updateData, beginCallback, confirmCallback, finalCallback) {
        var strMessage = 'UPDATE\t' + encodeForTabDelimited(strSchema) + '\t' + encodeForTabDelimited(strObject) +
                         '\nRETURN\t' + strReturnCols +
                         (strHashCols ? '\nHASH\t' + strHashCols : '') +
                         '\n\n' + updateData;
        
        //console.log(strMessage);
        
        GS.requestBegin(socket, function (data, error) {
            var transactionID;
            
            if (!error) {
                transactionID = data;
                if (typeof beginCallback === 'function') { beginCallback(data, error); }
                
                GS.requestFromSocket(GS.envSocket, 'transactionid = ' + transactionID + '\n' + strMessage, function (data, error, errorData) {
                    var commitFunction, rollbackFunction;
                    
                    if (!error) {
                        data = data.substring(data.indexOf('\n') + 1); // transactionid
                        //data = data.substring(data.indexOf('\n') + 1); // responsenumber
                    }
                    
                    commitFunction = function () {
                        GS.requestCommit(socket, transactionID, function (data, error) {
                            if (!error) { data = data.substring(data.indexOf('\n') + 1); }
                            
                            finalCallback('COMMIT', data, error);
                        });
                    };
                    rollbackFunction = function () {
                        GS.requestRollback(socket, transactionID, function (data, error) {
                            if (!error) { data = data.substring(data.indexOf('\n') + 1); }
                            
                            finalCallback('ROLLBACK', data, error);
                        });
                    };
                    
                    if (!error) {
                        confirmCallback(data, error, transactionID, commitFunction, rollbackFunction);
                    } else {
                        confirmCallback(errorData, error, transactionID, commitFunction, rollbackFunction);
                    }
                });
                
            } else {
                if (typeof beginCallback === 'function') { beginCallback(data, error); }
            }
        });
    };
    
    GS.requestDeleteFromSocket = function (socket, strSchema, strObject, strHashCols, deleteData, beginCallback, confirmCallback, finalCallback) {
        var strMessage = 'DELETE\t' + encodeForTabDelimited(strSchema) + '\t' + encodeForTabDelimited(strObject) +
                         (strHashCols ? '\nHASH\t' + strHashCols : '') + '\n\n' +
                         deleteData;
        
        //console.log(strMessage);
        
        GS.requestBegin(socket, function (data, error) {
            var transactionID;
            
            if (!error) {
                transactionID = data;
                if (typeof beginCallback === 'function') { beginCallback(data, error); }
                
                GS.requestFromSocket(GS.envSocket, 'transactionid = ' + transactionID + '\n' + strMessage, function (data, error, errorData) {
                    var commitFunction, rollbackFunction;
                    
                    if (!error) {
                        data = data.substring(data.indexOf('\n') + 1); // transactionid
                        //data = data.substring(data.indexOf('\n') + 1); // responsenumber
                    }
                    
                    commitFunction = function () {
                        GS.requestCommit(socket, transactionID, function (data, error) {
                            if (!error) { data = data.substring(data.indexOf('\n') + 1); }
                            
                            finalCallback('COMMIT', data, error);
                        });
                    };
                    rollbackFunction = function () {
                        GS.requestRollback(socket, transactionID, function (data, error) {
                            if (!error) { data = data.substring(data.indexOf('\n') + 1); }
                            
                            finalCallback('ROLLBACK', data, error);
                        });
                    };
                    
                    if (!error) {
                        confirmCallback(data, error, transactionID, commitFunction, rollbackFunction);
                    } else {
                        confirmCallback(errorData, error, transactionID, commitFunction, rollbackFunction);
                    }
                });
                
            } else {
                if (typeof beginCallback === 'function') { beginCallback(data, error); }
            }
        });
    };
    
    GS.requestBegin = function (socket, callback) {
        GS.requestFromSocket(GS.envSocket, 'BEGIN', function (data, error, errorData) {
            var transactionID;
            
            if (typeof callback === 'function') {
                if (!error) {
                    transactionID = data.substring('transactionid = '.length, data.indexOf('\n'));
                    callback(transactionID, error);
                } else {
                    callback(errorData, error);
                }
            }
        });
    };
    
    GS.requestRollback = function (socket, transactionID, callback) {
        GS.requestFromSocket(GS.envSocket, 'transactionid = ' + transactionID + '\nROLLBACK', function (data, error, errorData) {
            if (typeof callback === 'function') {
                if (!error) {
                    callback(data, error);
                } else {
                    callback(errorData, error);
                }
            }
        });
    };
    
    GS.requestCommit = function (socket, transactionID, callback) {
        GS.requestFromSocket(GS.envSocket, 'transactionid = ' + transactionID + '\nCOMMIT', function (data, error, errorData) {
            if (typeof callback === 'function') {
                if (!error) {
                    callback(data, error);
                } else {
                    callback(errorData, error);
                }
            }
        });
    };
    
    GS.rebootSocket = function (socket) {
        socket.stayClosed = false;
        socket.close();
    };
    
    GS.closeSocket = function (socket) {
        socket.stayClosed = true;
        socket.close();
    };
    
    
    var cacheQueries = [], cacheCallbacks = [], cacheResults = [];
    GS.requestCachingSelect = function (socket, strSchema, strObject, strColumns, strWhere, strOrd, strLimit, strOffset, callback, bolClearCache) {
        var strKey = (strSchema + strObject + strColumns + strWhere + strOrd + strLimit + strOffset)
          , intQueryIndex, i, len;
        
        if (bolClearCache) {
            intQueryIndex = cacheQueries.indexOf(strKey);
            
            cacheQueries.splice(intQueryIndex, 1);
            cacheCallbacks.splice(intQueryIndex, 1);
            cacheResults.splice(intQueryIndex, 1);
        }
        
        intQueryIndex = cacheQueries.indexOf(strKey);
        
        if (intQueryIndex !== -1) {
            for (i = 0, len = cacheResults[intQueryIndex].length; i < len; i += 1) {
                callback(cacheResults[intQueryIndex][i][0], cacheResults[intQueryIndex][i][1]);
            }
            cacheCallbacks[intQueryIndex].push({'callback': callback, 'ready': true});
            
        } else {
            cacheQueries.push(strKey);
            cacheCallbacks.push([{'callback': callback, 'ready': true}]);
            cacheResults.push([]);
            intQueryIndex = (cacheQueries.length - 1);
            
            GS.requestSelectFromSocket(socket, strSchema, strObject, strColumns
                                     , strWhere, strOrd, strLimit, strOffset
                                     , function (data, error) {
                var i, len;
                
                cacheResults[intQueryIndex].push([data, error]);
                
                for (i = 0, len = cacheCallbacks[intQueryIndex].length; i < len; i += 1) {
                    if (cacheCallbacks[intQueryIndex][i].ready) {
                        cacheCallbacks[intQueryIndex][i].callback(data, error);
                    }
                }
            });
        }
    };
})();


// GS.encodeForTabDelimited('asdf\\asdf\\asdf\r\nasdf\r\nasdf\tasdf\tasdf')
GS.encodeForTabDelimited = function (strValue, nullValue) {
    'use strict';
    strValue = String(strValue || '');
    
    if (strValue === '\\N') {
        return strValue;
    } else {
        strValue = strValue.replace(/\\/g, '\\\\') // double up backslashes
                        .replace(/\n/g, '\\n')     // replace newline with the text representation '\n'
                        .replace(/\r/g, '\\r')     // replace carriage return with the text representation '\r'
                        .replace(/\t/g, '\\t');    // replace tab with the text representation '\t'
        
        if (strValue === nullValue) {
            strValue = '\\N';
        }
        
        return strValue;
    }
};

// GS.decodeFromTabDelimited('asdf\\\\asdf\\\\asdf\\r\\nasdf\\r\\nasdf\\tasdf\\tasdf')
GS.decodeFromTabDelimited = function (strValue, nullValue) {
    'use strict';
    var i, len, strRet = '';
    
    if (nullValue === undefined) {
        nullValue = '\\N';
    }
    
    for (i = 0, len = strValue.length; i < len; i += 1) {
        if (strValue[i] === '\\' && strValue[i + 1]) {
            i += 1;
            
            if (strValue[i] === 'n') {
                strRet += '\n';
                
            } else if (strValue[i] === 'r') {
                strRet += '\r';
                
            } else if (strValue[i] === 't') {
                strRet += '\t';
                
            } else if (strValue[i] === 'N') {
                strRet += nullValue;
                
            } else if (strValue[i] === '\\') {
                strRet += '\\';
                
            } else {
                strRet += '\\' + strValue[i];
            }
            
        } else {
            strRet += strValue[i];
        }
    }
    
    return strRet;
    
    //return strValue.replace(/\\\\/g, '\\')
    //               .replace(/\\n/g, '\n')
    //               .replace(/\\r/g, '\r')
    //               .replace(/\\t/g, '\t')
    //               .replace(/\\N/g, 'NULL');
};
