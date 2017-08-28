var WS = {};

var rightPad = function (str, padString, padToLength) {
    'use strict';
    str = String(str);

    while (str.length < padToLength) {
        str = str + padString;
    }

    return str;
};

var $ = {
    ajax: function (strLink, strParams, strMethod, callback) {
        'use strict';

        var request = new XMLHttpRequest();
        strMethod = strMethod.toUpperCase();

        callback = callback || function () { };

        request.onreadystatechange = function () {
            var normalizedError;

            if (request.readyState === 4) {
                callback(request.responseText);
            }
        };

        request.open(strMethod, strLink, true);
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded; charset=UTF-8');
        if (strLink === '/test.txt?if_modified_since=true') {
            request.setRequestHeader('If-Modified-Since', $.if_modified_since_changestamp);
        }
        if (strMethod === 'POST') {
            request.send(strParams);
        } else {
            request.send();
        }

        return request;
    },
    runTests: function (key) {
		$.tests[key].test_random = '1000';
		$.tests[key].running = true;
        $.runTest(key, 0);
    },
    intRun: 10,
	testsEnded: false,
	test_random: rightPad(parseInt(Math.random().toString().substring(2, 7), 10).toString(), '0', 5),
    test_change_stamp: (function () {
        var test_change_stamp = new Date();
        test_change_stamp.setMinutes(test_change_stamp.getMinutes());
        test_change_stamp = test_change_stamp.toISOString().replace('T', ' ').replace(/\..*/gi, '');
        return test_change_stamp;
    }()),
    changeStatus: function (key, intCurrent, strOldClass, strNewClass, strStatus, strErrorText) {
        var objLabel = document.getElementById('test' + key + intCurrent + '_label');
        objLabel.classList.remove(strOldClass);
        objLabel.classList.add(strNewClass);
        if (strNewClass === 'fail') {
            document.getElementById('status-note-' + key).textContent = '(ERROR)';
			$.tests[key].error = true;
			pushState({}, 'Postage Test Backend', '/postage/test/index.html' + window.location.search);
			$.ajax('https://www.sunnyserve.com/env/tst.acceptnc_test', 'action=fail&id=' + $.intID + '&fail_name=' + encodeURIComponent(document.getElementById('test' + key + intCurrent + '_label').innerText), 'POST', function (data) {

			});
        } else {
            document.getElementById('status-note-' + key).textContent = '(RUNNING)';
        }
        objLabel.strStatus = strStatus;
        objLabel.strErrorText = strErrorText;
    },
    runTest: function (key, intCurrent) {
        'use strict';
        // console.log('run_test:', intCurrent);
		if (intCurrent === 0) {
			$.tests[key].test_random = qs['seq_numbers'] === 'true' ? (parseInt($.tests[key].test_random, 10) + 1).toString() : rightPad(parseInt(Math.random().toString().substring(2, 6), 10).toString(), '0', 4);
		}
        var arrCurrent = $.tests[key].tests[intCurrent];
        if (arrCurrent === undefined) {
			var minRuns = Infinity, minKey, error = false;
			for (var key2 in $.tests) {
				if ($.tests.hasOwnProperty(key2) && key2[0] !== '_') {
					var runs = 0;
					if ($.tests[key2].intRun !== undefined) {
						runs = $.tests[key2].intRun;
					}
					if (runs < minRuns) {
						minRuns = runs;
						minKey = key2;
					}
					error = error || $.tests[key2].error || false;
				}
			}
			if ($.tests[key].intRun === undefined) {
				$.tests[key].intRun = 0;
			}
			$.tests[key].intRun += 1;
            if (key[0] !== '_' && $.tests[key].intRun < ($.intRun * 5) && (minRuns + 1) < $.intRun && !error) {
                var i = 0, len = $.tests[key].tests.length;
				for (; i < len; i += 1) {
					$.changeStatus(key, i, 'pass', 'waiting');
				}

				$.ajax('https://www.sunnyserve.com/env/tst.acceptnc_test', 'action=success&id=' + $.intID, 'POST', function (data) {

				});
                $.runTest(key, 0);
            } else {
				$.tests[key].running = false;
				var bolEndTests = true;

				for (var key2 in $.tests) {
					if ($.tests.hasOwnProperty(key2) && key2[0] !== '_') {
						if ($.tests[key2].running || $.tests[key].error) {
							bolEndTests = false;
							break;
						}
					}
				}

				if (key[0] !== '_' && bolEndTests && $.testsEnded !== true) {
					$.testsEnded = true;
					$.ajax('http://127.0.0.1:45654', '', 'GET', function (data) {});
					$.ajax('https://www.sunnyserve.com/env/tst.acceptnc_test', 'action=end&id=' + $.intID, 'POST', function (data) {
						alert('Tests finished!');
					});
				}
                document.getElementById('status-note-' + key).textContent = ' (STOPPED)';
				if (key[0] === '_') {
					pushState({}, 'Postage Test Backend', '/postage/test/index.html' + window.location.search);
		            for (var key2 in $.tests) {
		                if ($.tests.hasOwnProperty(key2) && key2 !== key) {
		                    if (qs[key2] === 'true') {
		                        $.runTests(key2);
		                    }
		                }
		            }
				}
            }

            var num = parseInt(document.getElementById('iterations-' + key).innerText, 10);
            document.getElementById('iterations-' + key).innerText = num + 1;
            return;
        }
        var strType = arrCurrent[1], intStatusCode, strLink, strArgs, strExpectedOutput, i, arrStrActualOutput, expectedOutput;
        if (strType === 'ajax') {
            // console.log('ASDFASDFASDFASDF');
            if (typeof (arrCurrent[5]) === 'string' && arrCurrent[0] != 'Download') {
                arrCurrent[5] = arrCurrent[5].replace(/\r\n/gi, '\n');
            }

            var intStatusCode = arrCurrent[2];
            var strLink = arrCurrent[3].replace(/\{\{test_random\}\}/g, $.test_random).replace(/\{\{test_random1\}\}/g, $.tests[key].test_random);
            var strArgs = arrCurrent[4];
            var strExpectedOutput = arrCurrent[5];
            $.changeStatus(key, intCurrent, 'waiting', 'running');
            // console.log('P##########################', strArgs);
            var ajax = $.ajax(strLink, strArgs, 'POST', function (data) {
                if (data.indexOf('<!DOCTYPE html>') !== 0) {
                    data = data.replace(/c\:\\users\\nunzio\\repos\\postage\\/gi, '../');
                    data = data.replace(/\.\.\\\.\.\\/gi, '../');
                    data = data.replace(/\\(?![rnt])/gi, '/');
					data = data.replace(' (0x0000274D/10061)', '');
                }

                if (strExpectedOutput === data && intStatusCode === ajax.status) {
                    $.changeStatus(key, intCurrent, 'running', 'pass');
                    $.runTest(key, intCurrent + 1);
                } else {
					console.log(strExpectedOutput.length, strExpectedOutput.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
					console.log(data.length, data.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));

                    document.getElementById('actual-status-' + key).value = ajax.status;
                    document.getElementById('actual-output-' + key).value = data;
                    $.changeStatus(key, intCurrent, 'running', 'fail', ajax.status, data);
                }
            });
        } else if (strType === 'ajax spam') {
            if (typeof arrCurrent[5] === 'string') {
                arrCurrent[5] = arrCurrent[5].replace(/\r\n/gi, '\n');
            }

            intStatusCode = arrCurrent[2];
            var strLink = arrCurrent[3].replace(/\{\{test_random\}\}/g, $.test_random);
            var strArgs = arrCurrent[4];
            strExpectedOutput = arrCurrent[5];
            $.changeStatus(key, intCurrent, 'waiting', 'running');

			var i = 0, len = 100;
            var arrAjax = new Array(len), intNumFailures = 0, intNumFinished = 0;
            while (i < len) {
                (function (i) {
                    arrAjax[i] = $.ajax(strLink, strArgs, 'POST', function (data) {
                        if (data === strExpectedOutput && intStatusCode === arrAjax[i].status) {

                        } else {
                            intNumFailures += 1;
                            //// console.log('>' + intCurrent + '|' + data + '|' + error + '<');
                            // console.log(ajax.status, data);
                            // console.log(intStatusCode, strExpectedOutput);
                            // console.log(data.error_text);
                            document.getElementById('actual-status-' + key).value = intNumFailures;
                            document.getElementById('actual-output-' + key).value = data;
                        }
                        intNumFinished += 1;
                        if (intNumFinished == len && intNumFailures === 0) {
							$.changeStatus(key, intCurrent, 'running', 'pass');
                            $.runTest(key, intCurrent + 1);
                        } else if (intNumFinished == len) {
							$.changeStatus(key, intCurrent, 'running', 'fail', i, data);
						}
                    });
                })(i)
                i += 1;
            }
        } else if (strType === 'upload') {
            arrCurrent[5] = arrCurrent[5].replace(/\r\n/gi, '\n');
            var intStatusCode = arrCurrent[2];
            var strLink = arrCurrent[3];
            var strArgs = arrCurrent[4].replace(/\{\{test_random\}\}/g, $.test_random).replace(/\{\{test_random1\}\}/g, $.tests[key].test_random);
            var strExpectedOutput = arrCurrent[5];
            $.changeStatus(key, intCurrent, 'waiting', 'running');
            var formData = new FormData();
            var blob = new Blob(['SELECT \'This is \0some\n\n tesr\r\n\r\nt \r\rsql\';'], { type: 'application/binary' });
            formData.append('file_name', strArgs);
            formData.append('file_content', blob);
            var request = new XMLHttpRequest();
            request.open('POST', strLink);
            request.onload = function () {
                var response = request.response.replace(/\r\n/gi, '\n');
                if (response === strExpectedOutput && intStatusCode === request.status) {
                    $.changeStatus(key, intCurrent, 'running', 'pass', request.status, response);
                    $.runTest(key, intCurrent + 1);
                } else {
                    $.changeStatus(key, intCurrent, 'running', 'fail', request.status, response);
                    document.getElementById('actual-status-' + key).value = request.status;
                    document.getElementById('actual-output-' + key).value = response;
                    $.runTest(key, intCurrent + 1);
                }
            };
            request.send(formData);
        } else if (strType === 'websocket start') {
            $.changeStatus(key, intCurrent, 'waiting', 'running');
			if ($.tests[key].socket) {
				WS.closeSocket($.tests[key].socket);
			}
            $.tests[key].socket = WS.openSocket(key, key);
            var i = 0;
            WS.requestFromSocket($.tests[key].socket, key, 'INFO', function (data, error, errorData) {
                if (i === -1) {
                    return;
                }
                i = -1;
                if (!error) {
                    $.tests[key].socket.stayClosed = true;
                    $.changeStatus(key, intCurrent, 'running', 'pass', 0, JSON.stringify(data));
                    $.runTest(key, intCurrent + 1);
                } else {
                    $.changeStatus(key, intCurrent, 'running', 'fail', 0, JSON.stringify(errorData));
                    document.getElementById('actual-output-' + key).value = JSON.stringify(errorData);
                }
            });
        } else if (strType === 'websocket') {
            if (typeof arrCurrent[3] === 'string') {
                arrCurrent[3] = arrCurrent[3].replace(/\r\n/gi, '\n').replace(/\{\{test_random\}\}/g, $.test_random);
            }
            var strArgs = (typeof arrCurrent[3] === 'string' ? arrCurrent[3].replace(/\{\{test_random1\}\}/g, $.tests[key].test_random) : arrCurrent[3]);
            var arrStrExpectedOutput = arrCurrent[4];
            var arrStrActualOutput = [];
            $.changeStatus(key, intCurrent, 'waiting', 'running');
            var i = 0;
            var bolIsRead = strArgs.substring ? strArgs.substring(0, 9) === 'FILE\tREAD' : false;
            var bolIsWrite = strArgs.substring ? strArgs.substring(0, 10) === 'FILE\tWRITE' : false;
            //// console.log('strArgs: ' + strArgs);
            WS.requestFromSocket($.tests[key].socket, key, strArgs, function (data, error, errorData) {
                if (bolIsRead || bolIsWrite) {
                    var lastModified = data.substring(0, data.indexOf('\n'));
                    if (!lastModified) {
                        lastModified = data;
                    }
                    $.tests[key].tests[intCurrent + 1][3] = $.tests[key].tests[intCurrent + 1][3]
                        .replace(/\{\{CHANGESTAMP\}\}/gi, WS.encodeForTabDelimited(lastModified)); // {{CHANGESTAMP}}
                    bolIsRead = false;
                    bolIsWrite = false;
                }
                if (i === -1) {
                    return;
                }
                //console.log(i, data);
                if (data !== '\\.') {
                    data = data.replace(/c\:\\users\\nunzio\\repos\\postage\\/gi, '../');
	                data = data.replace(/\.\.\\\.\.\\/g, '../');
                    data = data.replace(/\\(?![rntN])/g, '/');
					data = data.replace(/C\:\/Users\\nunzio\/AppData\/Roaming\//g, '/home/super/.');
					data = data.replace(/C\:\/Users\/Admin\/AppData\/Roaming\//g, '/home/super/.');
					data = data.replace(/\/home\/nunzio\//g, '/home/super/');
					data = data.replace(/\/Users\/joseph\//g, '/home/super/');
					data = data.replace(/\/Users\/super\//g, '/home/super/');
					data = data.replace(/\/Users\/nunzio\//g, '/home/super/');
					data = data.replace(/\/usr\/home\/super\//g, '/home/super/');
					data = data.replace(/\\test/g, '/test');
	                data = data.replace(/\/\//g, '\\\\');
	                data = data.replace(/Bob\/\\r\/\\n\/\\t\\\\\\\\by/g, 'Bob\\\\r\\\\n\\\\t\\\\\\\\by');
				}
                arrStrActualOutput.push(data.replace(/transactionid = .*\n/gim, ''));
                i += 1;
                if (i === arrStrExpectedOutput.length || data === 'TRANSACTION COMPLETED' || error) {
                    //console.log(i, data);
                    var j, k, l, len, len1;
                    for (j = 0, k = 0, len = i; j < len; j += 1, k += 1) {
                        if (arrStrActualOutput[j] === arrStrExpectedOutput[k].replace(/\{\{test_random\}\}/g, $.test_random).replace(/\{\{test_random1\}\}/g, $.tests[key].test_random) ||
                            arrStrExpectedOutput[k] === 'ANYTHING' ||
                            arrStrExpectedOutput[k].substring(0, 8) === 'OPTIONAL' ||
                            (
                                (
                                    arrStrExpectedOutput[k] === 'START' ||
                                    arrStrExpectedOutput[k] === 'END' ||
                                    arrStrExpectedOutput[k] === 'Failed to get canonical path' ||
                                    arrStrExpectedOutput[k] === 'Failed to open file for writing'
                                ) &&
                                arrStrActualOutput[j].indexOf(arrStrExpectedOutput[k]) === 0
                            )
                        ) {
                            if (arrStrExpectedOutput[k].substring(0, 8) === 'OPTIONAL' &&
                                arrStrActualOutput[j] !== arrStrExpectedOutput[k].substring(8).replace(/\{\{test_random\}\}/g, $.test_random).replace(/\{\{test_random1\}\}/g, $.tests[key].test_random)
                            ) {
                                j -= 1;
                            }
                            error = false;
                        } else {
                            $.changeStatus(key, intCurrent, 'running', 'fail');
                            error = true;
                            break;
                        }
                    }
                    if (error === false) {
                        $.changeStatus(key, intCurrent, 'running', 'pass', 0, JSON.stringify(arrStrActualOutput));
                        $.runTest(key, intCurrent + 1);
                        i = -1;
                    } else {
                        $.changeStatus(key, intCurrent, 'running', 'fail', 0, JSON.stringify(arrStrActualOutput));
                        document.getElementById('actual-output-' + key).value = JSON.stringify(arrStrActualOutput);
                        i = -1;
                    }
                }
            });
			if (arrStrExpectedOutput.length === 0) {
				$.changeStatus(key, intCurrent, 'running', 'pass', 0, JSON.stringify(arrStrActualOutput));
				$.runTest(key, intCurrent + 1);
			}
        } else if (strType === 'websocket send from') {
            if (typeof arrCurrent[3] === 'string') {
                arrCurrent[3] = arrCurrent[3].replace(/\r\n/gi, '\n').replace(/\{\{test_random\}\}/g, $.test_random);
            }
            var strArgs = arrCurrent[3];
            var arrStrExpectedOutput = arrCurrent[4];
            var arrStrActualOutput = [];
            $.changeStatus(key, intCurrent, 'waiting', 'running');
            var i = 0;
            var bolIsRead = strArgs.substring ? strArgs.substring(0, 9) === 'FILE\tREAD' : false;
            var bolIsWrite = strArgs.substring ? strArgs.substring(0, 10) === 'FILE\tWRITE' : false;
            //// console.log('strArgs: ' + strArgs);
            WS.requestFromSocket($.tests[key].socket, key, strArgs, function (data, error, errorData) {
                if (i < 3 || i % 50 == 0) {
                    $.tests[key].socket.stayClosed = false;
                    $.tests[key].socket.close();
                }
                if (i === -1) {
                    return;
                }
                //console.log(i, data);
                data = data.replace(/..\\..\\/gi, '../');
                data = data.replace(/\\(?![rnt])/gi, '/');
                arrStrActualOutput.push(data.replace(/transactionid = .*\n/gim, ''));
                i += 1;
                if (i === arrStrExpectedOutput.length || data === 'TRANSACTION COMPLETED' || error) {
                    //console.log(i, data);
                    var j, k, l, len, len1;
                    for (j = 0, k = 0, len = i; j < len; j += 1, k += 1) {
                        if (arrStrActualOutput[j] === arrStrExpectedOutput[k].replace(/\{\{test_random\}\}/g, $.test_random) ||
                            arrStrExpectedOutput[k] === 'ANYTHING' ||
                            arrStrExpectedOutput[k].substring(0, 8) === 'OPTIONAL' ||
                            (
                                (
                                    arrStrExpectedOutput[k] === 'START' ||
                                    arrStrExpectedOutput[k] === 'END' ||
                                    arrStrExpectedOutput[k] === 'Failed to get canonical path' ||
                                    arrStrExpectedOutput[k] === 'Failed to open file for writing'
                                ) &&
                                arrStrActualOutput[j].indexOf(arrStrExpectedOutput[k]) === 0
                            )
                        ) {
                            if (arrStrExpectedOutput[k].substring(0, 8) === 'OPTIONAL' &&
                                arrStrActualOutput[j] !== arrStrExpectedOutput[k].substring(8).replace(/\{\{test_random\}\}/g, $.test_random)
                            ) {
                                j -= 1;
                            }
                            error = false;
                        } else {
							console.log(arrStrActualOutput[j].length, arrStrActualOutput[j].replace(/\n/g, '\\n'));
							console.log(arrStrExpectedOutput[k].length, arrStrExpectedOutput[k].replace(/\{\{test_random\}\}/g, $.test_random).replace(/\n/g, '\\n'));

                            error = true;
                            break;
                        }
                    }
                    if (error === false) {
                        $.changeStatus(key, intCurrent, 'running', 'pass', 0, JSON.stringify(arrStrActualOutput));
                        $.runTest(key, intCurrent + 1);
                        i = -1;
                    } else {
                        $.changeStatus(key, intCurrent, 'running', 'fail', 0, JSON.stringify(arrStrActualOutput));
                        document.getElementById('actual-output-' + key).value = JSON.stringify(arrStrActualOutput);
                        i = -1;
                    }
                }
            });
        } else if (strType === 'websocket cancel') {
            arrCurrent[3] = arrCurrent[3].replace(/\r\n/gi, '\n');
            var strArgs = arrCurrent[3].replace(/\{\{test_random\}\}/g, $.test_random).replace(/\{\{test_random1\}\}/g, $.tests[key].test_random);
            var intCancelAtMessage = arrCurrent[4] !== undefined ? arrCurrent[4] : 1;
            $.changeStatus(key, intCurrent, 'waiting', 'running');
            i = 0;
            WS.requestFromSocket($.tests[key].socket, key, strArgs, function (data, error) {
                if (i === (intCancelAtMessage - 1)) {
                    WS.requestFromSocket($.tests[key].socket, key, 'CANCEL', function (data) {
                        // console.log(data);
                    });
                } else if (	JSON.stringify(data) === ml(function() {/*"Query failed: FATAL\nerror_text\tERROR:  canceling statement due to user request\\n\nerror_detail\t\nerror_hint\t\nerror_query\t\nerror_context\t\nerror_position\t\n"*/}) ||
							JSON.stringify(data) === ml(function() {/*"FATAL\nerror_text\tERROR:  canceling statement due to user request\\n\nerror_detail\t\nerror_hint\t\nerror_query\t\nerror_context\t\nerror_position\t\n"*/}) ||
							JSON.stringify(data) === ml(function() {/*"TRANSACTION COMPLETED"*/})) {
                    $.changeStatus(key, intCurrent, 'running', 'pass');
                    $.runTest(key, intCurrent + 1);
                }
                i += 1;
            });
			if (intCancelAtMessage === 0) {
                WS.requestFromSocket($.tests[key].socket, key, 'CANCEL', function (data) {
                    // console.log(data);
                });
			}
        } else if (strType === 'websocket close in request') {
            arrCurrent[3] = arrCurrent[3].replace(/\r\n/gi, '\n');
            var strArgs = arrCurrent[3].replace(/\{\{test_random\}\}/g, $.test_random).replace(/\{\{test_random1\}\}/g, $.tests[key].test_random);
            var intCloseAtMessage = arrCurrent[4] !== undefined ? arrCurrent[4] : 1;
            $.changeStatus(key, intCurrent, 'waiting', 'running');
            i = 0;
            WS.requestFromSocket($.tests[key].socket, key, strArgs, function (data, error) {
                if (i === (intCloseAtMessage - 1)) {
	                WS.closeSocket($.tests[key].socket);
					setTimeout(function () {
	                    $.changeStatus(key, intCurrent, 'running', 'pass');
	                    $.runTest(key, intCurrent + 1);
					}, 500);
                }
                i += 1;
            });
			if (intCloseAtMessage === 0) {
                WS.closeSocket($.tests[key].socket);
			}
        } else if (strType === 'websocket end') {
            $.changeStatus(key, intCurrent, 'waiting', 'running');
            WS.closeSocket($.tests[key].socket);
            $.changeStatus(key, intCurrent, 'running', 'pass');
            $.runTest(key, intCurrent + 1);
        } else if (strType === 'wait') {
            $.changeStatus(key, intCurrent, 'waiting', 'running');
            setTimeout(function () {
                $.changeStatus(key, intCurrent, 'running', 'pass');
                $.runTest(key, intCurrent + 1);
            }, 5000);
        }
    }
};

function qryToJSON(strQueryString) {
    'use strict';
    var arrKeyValueList = [], jsnQueryString = {}, strKeyValue, i, len, strKey, strValue, jsnNavigator, arrSubParts, sub_i, sub_len;

    if (strQueryString) {
        arrKeyValueList = strQueryString.split('&');

        for (i = 0, len = arrKeyValueList.length; i < len; i += 1) {
            strKeyValue = arrKeyValueList[i];
            strKey = strKeyValue.substring(0, strKeyValue.indexOf('='));
            strValue = decodeURIComponent(strKeyValue.substring(strKeyValue.indexOf('=') + 1));

            jsnQueryString[strKey] = strValue;

            // if a dot is found in the key: create a sub JSON structure
            if (strKey.indexOf('.') > -1) {
                arrSubParts = strKey.split('.');

                jsnNavigator = jsnQueryString;
                for (sub_i = 0, sub_len = arrSubParts.length; sub_i < sub_len; sub_i += 1) {
                    if (sub_i < sub_len - 1) {
                        jsnNavigator[arrSubParts[sub_i]] = jsnNavigator[arrSubParts[sub_i]] || {};
                    } else {
                        jsnNavigator[arrSubParts[sub_i]] = jsnNavigator[arrSubParts[sub_i]] || strValue;
                    }

                    jsnNavigator = jsnNavigator[arrSubParts[sub_i]];
                }
            }
        }
    }

    return jsnQueryString;
}

function qryGetVal(strQueryString, strKey) {
    'use strict';
    var arrKeyValueList, strSlice, i, len;

    if (strQueryString) {
        arrKeyValueList = strQueryString.split('&');

        for (i = 0, len = arrKeyValueList.length; i < len; i = i + 1) {
            strSlice = arrKeyValueList[i];

            if (strSlice.split('=')[0] === strKey) {
                return decodeURIComponent(strSlice.substring(strSlice.indexOf('=') + 1));
            }
        }
    }

    return '';
}

function qrySetVal(strQueryString, strKeyValue) {
    'use strict';
    strQueryString = qryDeleteKey(strQueryString, strKeyValue.split('=')[0]);
    strQueryString = strQueryString + (strQueryString ? '&' : '') + strKeyValue;

    return strQueryString;
}

function qryDeleteKey(strQueryString, strKey) {
    'use strict';
    var arrKeyValueList, strSlice, i, len;

    if (strQueryString) {
        arrKeyValueList = strQueryString.split('&');

        for (i = 0, len = arrKeyValueList.length; i < len; i = i + 1) {
            strSlice = arrKeyValueList[i];

            if (strSlice.split('=')[0] === strKey) {
                arrKeyValueList.splice(i, 1);

                break;
            }
        }

        return arrKeyValueList.join('&');
    }

    return '';
}

function getQueryString() {
    'use strict';
    return window.location.search.substring(1);
}

function pushState(stateObj, title, url) {
    history.pushState(stateObj, title, url);
}

function pushQueryString(QS) {
    var arrNewQS = QS.split('&'), i, len, newQS = getQueryString();
    for (i = 0, len = arrNewQS.length; i < len; i += 1) {
        newQS = qrySetVal(newQS, arrNewQS[i]);
    }
    pushState({}, '', '?' + newQS);
}

function ml(func) {
    'use strict';

    func = func.toString();

    return func.substring(func.indexOf('/*') + 2, func.indexOf('*/'));
}

(function () {
    'use strict';

    // encodeForTabDelimited('asdf\\asdf\\asdf\r\nasdf\r\nasdf\tasdf\tasdf')
    function encodeForTabDelimited(strValue) {
        return strValue === '\\N' ? strValue :
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
            */
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

                jsnRet[arrLine[0]] = WS.decodeFromTabDelimited(arrLine[1] || '');
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

        return WS.trim(strValue.trim(), '"');
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
                        (errorJSON.error_hint ? '<br /><br />HINT: ' + encodeHTML(errorJSON.error_hint) : '') +
                      //(errorJSON.error_detail   ? '<br /><br />DETAIL: ' + encodeHTML(errorJSON.error_detail) : '') +
                        (errorJSON.error_query ? '<br /><br />QUERY: ' + encodeHTML(errorJSON.error_query) : '') +
                        (errorJSON.error_position ? '<br /><br />ERROR POSITION: ' + encodeHTML(errorJSON.error_position) : '') +
                        (errorJSON.error_context ? '<br /><br />CONTEXT: ' + encodeHTML(errorJSON.error_context) : '') +
                        (errorJSON.error_notice ? '<br /><br /><br />' + encodeHTML(errorJSON.error_notice) : '') +
                '</pre>';
    }

    WS.webSocketErrorDialog = function (jsnError, tryAgainCallback, cancelCallback) {
        var templateElement = document.createElement('template'), strHTML, jsnErrorClean;

        jsnErrorClean = {};

        jsnErrorClean.error_text = cleanErrorValue(jsnError.error_text);
        jsnErrorClean.error_hint = cleanErrorValue(jsnError.error_hint);
        jsnErrorClean.error_detail = cleanErrorValue(jsnError.error_detail);
        jsnErrorClean.error_query = cleanErrorValue(jsnError.error_query);
        jsnErrorClean.error_position = cleanErrorValue(jsnError.error_position);
        jsnErrorClean.error_context = cleanErrorValue(jsnError.error_context);
        jsnErrorClean.error_notice = cleanErrorValue(jsnError.error_notice);

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
        */
        });

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
                */
                });

                WS.openDialog(templateElement);
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

            WS.openDialog(templateElement, openFunction, function (event, strAnswer) {
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
            WS.openDialog(templateElement, openFunction);
        }
    };

    var sequence = 0, jsnMessages = {}, arrWaitingCalls = [];
    WS.openSocket = function (strLink, socketKey, relinkSessionID, relinkSessionNotifications) {
        var strLoc = window.location.toString();
        var socket = new WebSocket(
                            (window.location.protocol.toLowerCase().indexOf('https') === 0 ? 'wss' : 'ws') +
                            '://' + (window.location.host || window.location.hostname) + '/postage/0/' + strLink +
                            (relinkSessionID ? '?sessionid=' + relinkSessionID : '')); //nunzio.wfprod.com

        if (relinkSessionID) {
            socket.WSSessionID = relinkSessionID;
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
                socket.WSSessionID = message.substring('sessionid = '.length, message.indexOf('\n'));

                for (key in jsnMessages) {
                    jsnMessage = jsnMessages[key];

                    if ((
                            jsnMessage.session === socket.WSSessionID ||
                            jsnMessage.session === socket.oldSessionID
                        ) && jsnMessage.bolFinished === false) {

                        jsnMessage.session = socket.WSSessionID;

                        startFrom = 1;
                        for (i = 0, len = jsnMessage.arrResponseNumbers.length; i < len; i += 1) {
                            // if there is a difference between the current response number and the
                            //      startFrom: stop looping because startFrom now holds the number that we want
                            if (startFrom !== jsnMessage.arrResponseNumbers[i]) {
                                break;
                            }
                            startFrom += 1;
                        }

                        WS.requestFromSocket(socket, key, 'SEND FROM\t' + startFrom, '', jsnMessage.id);
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
                        WS.requestFromSocket(socket, key, 'CONFIRM\t' + responseNumber, '', messageID);
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
                    //GS.triggerEvent(window, 'notification', { 'socket': socket, 'message': message });
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
                setTimeout(function () {
                    console.log('ATTEMPTING SOCKET RE-OPEN', socket);
                    var key = socketKey;
                    $.tests[key].socket = WS.openSocket(key, key, $.tests[key].socket.WSSessionID, $.tests[key].socket.notifications);
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

    WS.requestFromSocket = function (socket, key, strMessage, callback, forceMessageID) {
        var oldOnOpen, messageID;

        if (!socket || socket.readyState === socket.CLOSED) {
            if (!$.tests[key].socket || $.tests[key].socket.readyState === socket.CLOSED) {
                //console.trace('ATTEMPTING SOCKET RE-OPEN 2');
                $.tests[key].socket = WS.openSocket(key, key);
            }
            socket = $.tests[key].socket;
        }

        // if the socket is open: register callback and send request
        if (socket.readyState === socket.OPEN && socket.WSSessionID) {

            if (!forceMessageID) {
                sequence += 1;
                messageID = socket.WSSessionID + '_' + sequence;
                jsnMessages[messageID] = {
                    'id': messageID,
                    'session': socket.WSSessionID,
                    'callback': callback,
                    'arrResponseNumbers': [],
                    'arrResponses': [],
                    'bolFinished': false
                };

            } else {
                messageID = forceMessageID;
            }

            if (typeof (strMessage) === 'object') {
                jsnMessages[messageID].parameters = new Blob(['messageid = ' + messageID + '\n', strMessage], { type: 'application/x-binary' });
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
                WS.requestFromSocket(socket, key, strMessage, callback, forceMessageID);
            });

            // if the socket is closed: error
        } else if (socket.readyState === socket.CLOSED) {
            //console.log('SOCKET REQUEST WHILE CLOSED           ');
            callback.apply(null, ['Socket Is Closed', 'error', webSocketNormalizeError({ 'reason': 'Socket Is Closed' })]);

            // if the socket is closing: error
        } else if (socket.readyState === socket.CLOSING) {
            //console.log('SOCKET REQUEST WHILE CLOSING          ');
            callback.apply(null, ['Socket Is Closing', 'error', webSocketNormalizeError({ 'reason': 'Socket Is Closing' })]);
        }
    };

    WS.rebootSocket = function (socket) {
        socket.stayClosed = false;
        socket.close();
    };

    WS.closeSocket = function (socket) {
        socket.stayClosed = true;
        socket.close();
    };
})();


// WS.encodeForTabDelimited('asdf\\asdf\\asdf\r\nasdf\r\nasdf\tasdf\tasdf')
WS.encodeForTabDelimited = function (strValue, nullValue) {
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

// WS.decodeFromTabDelimited('asdf\\\\asdf\\\\asdf\\r\\nasdf\\r\\nasdf\\tasdf\\tasdf')
WS.decodeFromTabDelimited = function (strValue, nullValue) {
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
