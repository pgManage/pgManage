var bolTabFunctionsLoaded = true, intTabNumber = 0, intNumberOfTabs = 0, bolStillInSetPosition, //arrTabOrder, tabListChangeStamp = '0',
    bolSetPositionFor, bolCurrentlyScriptTab = false, bolAutoOpenPropertyList = true;

// this function encodes tab names so that they can pass as canonical file names
function encodeTabNameForFileName(strName) {
    'use strict';
    var i, len, strRet;

    // loop through strName
    for (i = 0, len = strName.length, strRet = ''; i < len; i += 1) {
        // if the current character is not alpha-numeric: convert it to '%hex'
        if (!(
                (strName[i] >= 'a' && strName[i] <= 'z') ||
                (strName[i] >= 'A' && strName[i] <= 'Z') ||
                (strName[i] >= '0' && strName[i] <= '9') ||
                //strName[i] == '%' ||
                strName[i] == '&' ||
                strName[i] == '+' ||
                strName[i] == ',' ||
                strName[i] == '.' ||
                //strName[i] == ':' ||
                //strName[i] == '=' ||
                strName[i] == '_' ||
                //strName[i] == '/' ||
                //strName[i] == ' ' ||
                strName[i] == '-'
            )) {
            strRet += '%' + strName[i].charCodeAt(0).toString(16).toUpperCase();

        // else: just pass it through as is
        } else {
            strRet += strName[i];
        }
    }

    return strRet;
}

// this function decodes the file names created by the function above
function decodeFileNameForTabName(strName) {
    'use strict';
    var i, len, strTemp, strRet;

    // loop through strName
    for (i = 0, len = strName.length, strRet = ''; i < len; i += 1) {
        // if the current character is a %
        if (strName[i] === '%') {
            // get hex string (from the current character for 2 chars)
            strTemp = strName[i + 1] + strName[i + 2];
            i += 2;

            // convert hex string to actual character and add to ret
            strRet += String.fromCharCode(parseInt(strTemp, 16));

        // else: just pass it through as is
        } else {
            strRet += strName[i];
        }
    }

    return strRet;
}

function startTabContainer() {
    'use strict';
    document.getElementById('tab-container').innerHTML = ml(function () {/*
        <div id="tab-bar-container" flex-horizontal flex-fill>
            <div class="tab-bar-toolbar left">
                <gs-button id="button-home" onclick="setQSToHome()" icononly icon="home" inline remove-all no-focus title="Back to home [ESC]"></gs-button><gs-button id="button-new-tab" onclick="newTab('sql', '', {'strContent': '\n\n\n\n\n\n\n\n\n'})" icononly icon="folder-o" title="Create a blank script tab" inline remove-all no-focus><span id="button-new-tab-plus">+</span></gs-button>
            </div>
            <div id="tab-bar" flex prevent-text-selection></div>
            <div class="tab-bar-toolbar right">
                <gs-button id="button-open-tabs" onclick="dialogOpenTabs(this);" icononly no-focus remove-all icon="list" inline title="All open tabs"></gs-button>
            </div>
        </div>
        <div id="tab-frames" flex>
            <div id="home-frame" class="home-frame"></div>
        </div>
    */});

    //<gs-button id="button-closed-tabs" onclick="dialogClosedTabs()" icononly no-focus remove-all icon="clock-o" inline title="All closed tabs"></gs-button>

    // if we're on a touch device: add a class to make it so that the tab close buttons look a certain way
    if (evt.touchDevice) {
        document.getElementById('tab-bar').classList.add('touchscreen');

    // else (implied: if we're not on a touch device): add a class to make it so that the tab close buttons look a certain way
    } else {
        document.getElementById('tab-bar').classList.add('not-touchscreen');
    }

    loadHome();

    // bind esc to toggle between home and the currently selected tab (or the first tab)
    var backToTab;
    document.addEventListener('keydown', function (event) {
        //console.log('0***');

        // if the key that was pressed is escape (27)
        if (event.keyCode === 27 && document.getElementsByTagName('gs-dialog').length === 0) {
            if (document.getElementById('tab-bar-container').classList.contains('home-mode') === true) {
                if (backToTab && backToTab.parentNode) {
                    GS.triggerEvent(backToTab, 'click');

                } else if (document.getElementById('tab-bar').children.length > 0) {
                    GS.triggerEvent(document.getElementById('tab-bar').children[0], 'click');
                }

            } else {
                if (document.getElementsByClassName('current-tab').length > 0) {
                    backToTab = document.getElementsByClassName('current-tab')[0];

                } else if (document.getElementById('tab-bar').children.length > 0) {
                    backToTab = document.getElementById('tab-bar').children[0];
                }

                //console.log('3***');
                GS.triggerEvent(document.getElementById('button-home'), 'click');
            }
        }
    });

    // bind [meta][.]
    document.addEventListener('keydown', function (event) {
        var strQuery, strLink, intStart, intEnd, currentRange
          , currentTab = document.getElementsByClassName('current-tab')[0];

        // if shift is down and the key that was pressed is "." (190)
        if ((event.metaKey || event.ctrlKey) && event.keyCode === 190) {

            if (currentTab) {
                // cmd-.
                if ((event.which || event.keyCode) === 190 && event.metaKey) {
                    strQuery = currentTab.relatedEditor.getValue();
                    currentRange = currentTab.relatedEditor.currentQueryRange;

                    if (currentRange) {
                        intStart = rowAndColumnToIndex(strQuery, currentRange.start.row, currentRange.start.column);
                        intEnd = rowAndColumnToIndex(strQuery, currentRange.end.row, currentRange.end.column);
                        strQuery = strQuery.substring(intStart, intEnd);

                        if (strQuery) {
                            strLink = docButtonForQuery(strQuery);

                            if (strLink) {
                                window.open(strLink, '_blank');
                            }
                        }
                    }

                    if (!currentRange || !strQuery || !strLink) {
                        GS.pushMessage('<center><h4>No Documentation Found</h4></center>', 700);
                    }
                }
            }


            //// if there is a current tab and the tab has a property button
            //if (currentTab && currentTab.relatedPropertyButton) {
            //    // if a property dialog is not open: trigger a click on the property button
            //    if (!document.getElementById('dialog-from-dialog-property-window') &&
            //        !currentTab.relatedPropertyButton.hasAttribute('disabled')) {
            //        GS.triggerEvent(currentTab.relatedPropertyButton, 'click');
            //
            //    // else if a property dialog is open: tell the dialog to apply it's changes and close
            //    } else {
            //        closePropertyDialog();
            //    }
            //}
        }
    });
}


function loadTabsFromServer(bolChooseFirst) {
    'use strict';
    var strPath = '/open'
      , strQueryString = GS.getQueryString()
      , strView = GS.qryGetVal(strQueryString, 'view')
      , strCurrentTab;// = GS.qryGetVal(strQueryString, 'current-tab');

    if (strView.indexOf('tab:') === 0) {
        strCurrentTab = strView.substring('tab:'.length);
    }

    //clearTabs();

    // if there have been tabs saved: set them up
    GS.requestFromSocket(GS.envSocket, 'TAB\tLIST\t' + GS.encodeForTabDelimited(strPath), function (data, error, errorData) {
        var arrFiles, i, len, fileName, fileExtension, fullFileName, arrExclusion, tabElement;

        if (!error && data.trim() && data.indexOf('Failed to get canonical path') === -1) {
            arrFiles = data.trim().split('\n');

            // remove files that we can't handle from the array
            for (i = 0, len = arrFiles.length; i < len; i += 1) {
                arrFiles[i] = decodeFileNameForTabName(arrFiles[i]);
                fileExtension = arrFiles[i].substring(arrFiles[i].lastIndexOf('.') + 1);

                if (fileExtension !== 'sql' && fileExtension !== 'design-table' && fileExtension !== 'datasheet') {
                    arrFiles.splice(i, 1);
                    i -= 1;
                    len -= 1;
                }
            }

            // these are reversed because the newTab function adds the tabs to the very left
            arrFiles.reverse();
            arrExclusion = alreadyLoadedFiles();

            for (i = 0, len = arrFiles.length; i < len; i += 1) {
                if (arrExclusion.indexOf(arrFiles[i]) === -1) {
                    //fullFileName = arrFiles[i];
                    fileName = arrFiles[i].substring(0, arrFiles[i].lastIndexOf('.'));
                    fileExtension = arrFiles[i].substring(arrFiles[i].lastIndexOf('.') + 1);

                    newTab(fileExtension, fileName, {}
                        , true, strPath + '/' + encodeTabNameForFileName(fileName) + '.' + fileExtension
                        , (strCurrentTab === strPath + '/' + encodeTabNameForFileName(arrFiles[i])));
                }
            }

            //strCurrentTab

            // if bolChooseFirst is true: set the frame to the first tab
            if (bolChooseFirst) {
                tabElement = xtag.queryChildren(document.getElementById('tab-bar'), '.tab-button')[0];
                GS.pushQueryString('view=tab:' + encodeURIComponent(tabElement.filePath));
                //setFrame(tabElement, tabElement.relatedFrame);
            }
        }
    });
}

function alreadyLoadedFiles() {
    'use strict';
    var arrLoadedFiles = [], strFile, i, len,
        tabElements = xtag.queryChildren(document.getElementById('tab-bar'), '.tab-button');

    for (i = 0, len = tabElements.length; i < len; i += 1) {
        strFile = tabElements[i].filePath;

        // remove folders
        strFile = strFile.substring(strFile.lastIndexOf('/') + 1);

        arrLoadedFiles.push(strFile);
    }

    return arrLoadedFiles;
}

//function clearTabs() {
//    'use strict';
//    var tabBarElement = document.getElementById('tab-bar'),
//        tabContainerElement = document.getElementById('tab-frames'),
//        arrElements, i, len;
//
//    arrElements = xtag.queryChildren(tabBarElement, '.tab-button');
//    for (i = 0, len = arrElements.length; i < len; i += 1) {
//        tabBarElement.removeChild(arrElements[i]);
//    }
//
//    arrElements = xtag.queryChildren(tabContainerElement, '.tab-frame');
//    for (i = 0, len = arrElements.length; i < len; i += 1) {
//        tabContainerElement.removeChild(arrElements[i]);
//    }
//}

function dialogScriptOpen() {
	console.log('test');
	GS.closeDialog(document.getElementsByTagName('gs-dialog')[0]);

	// We are in electron here
	var fs = require('fs');
	var path = require('path');
	var electron = require('electron').remote;
	var dialog = electron.dialog;
	var arrFilePath = dialog.showOpenDialog({
		title: 'Open File',
		filters: [
			{
				name: 'Sql Files',
				extensions: ['sql']
			},
    		{
				name: 'All Files',
				extensions: ['*']
			}
		],
		properties: ['openFile']
	});

	// dialog.showOpenDialog will return undefined if the user cancels the selection
	if (arrFilePath !== undefined) {
		var 	filePath = arrFilePath[0]
			,	fileName = path.basename(filePath);
		fs.readFile(filePath, 'utf8', function readCallback(err, strContent) {
			if (err) {
				var templateElement = document.createElement('template');
				templateElement.innerHTML = ml(function () {/*
					<gs-page>
						<gs-header><center><h3>Reading failed!</h3></center></gs-header>
						<gs-body padded>
							<center>{{desc}}/center>
						</gs-body>
						<gs-footer>
							<gs-button dialogclose bg-primary tabindex="0">Try Again</gs-button>
						</gs-footer>
					</gs-page>
				*/}).replace(/\{\{desc\}\}/, err.message);

				GS.openDialog(templateElement, function () {

				}, function (event) {
					fs.readFile(filePath, 'utf8', readCallback);
				});
			} else {
				GS.requestFromSocket(GS.envSocket, 'TAB\tWRITE\topen/' + encodeTabNameForFileName(fileName) + '\t0\n' + strContent, function (data, error, errorData) {
		            if (!error) {
						if (data === 'TRANSACTION COMPLETED') {
							GS.requestFromSocket(GS.envSocket, 'TAB\tWRITE\topen/' + encodeTabNameForFileName(fileName + '~') + '\t0\n' + filePath, function (data, error, errorData) {
					            if (!error) {
									if (data === 'TRANSACTION COMPLETED') {
										loadTabsFromServer(true);
									}
					            } else {
									loadTabsFromServer(true);
					                GS.webSocketErrorDialog(errorData);
					            }
							});
						}
		            } else {
		                GS.webSocketErrorDialog(errorData);
		            }
				});
			}
		});
	}
}

function saveCurrentScript(bolForceSaveAs) {
	var strQueryString = GS.getQueryString()
      , strView = GS.qryGetVal(strQueryString, 'view')
      , strCurrentTab;

    if (strView.indexOf('tab:') === 0) {
        strCurrentTab = strView.substring('tab:'.length);
		strCurrentTab = '/open/' + encodeTabNameForFileName(strCurrentTab.substring('/open/'.length));
		saveScriptAsFile(strCurrentTab, bolForceSaveAs);
    } else {
		alert('There is no tab selected!');
	}

	GS.closeDialog(document.getElementsByTagName('gs-dialog')[0]);
}

function dialogScriptUpload() {
    'use strict';
    var templateElement = document.createElement('template');

    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-header><center><h3>Upload SQL Script</h3></center></gs-header>
            <gs-body padded>
                <form id="form-upload-script" action="/postage/*/}) + contextData.connectionID + '/' + ml(function () {/*upload" method="POST" target="upload_response_1"
                            enctype="multipart/form-data">
                    <label>Tab Name:</label>
                    <gs-text id="file-upload-control" name="file_content" type="file"></gs-text>
                    <br />
                    <label>File Name: <span id="span-upload-file-warning" txt-danger></span></label>
                    <div flex-horizontal>
                        <gs-text id="text-upload-name-control" flex></gs-text>
                        <span>.sql</span>
                    </div>

                    <input id="input-upload-path" name="file_name" hidden />
                </form>

                <iframe id="iframe-upload-response" src="frames/responsetarget.html" name="upload_response_1" hidden></iframe>
            </gs-body>
            <gs-footer>
                <gs-grid>
                    <gs-block>
                        <gs-button dialogclose>Cancel</gs-button>
                    </gs-block>
                    <gs-block>
                        <gs-button id="button-start-upload">Upload</gs-button>
                    </gs-block>
                </gs-grid>
            </gs-footer>
        </gs-page>
    */});

    GS.openDialog(templateElement, function () {
        var dialog = this,
            formElement = document.getElementById('form-upload-script'),
            fileControl = document.getElementById('file-upload-control'),
            nameControl = document.getElementById('text-upload-name-control'),
            pathControl = document.getElementById('input-upload-path'),
            uploadButton = document.getElementById('button-start-upload'),
            responseElement = document.getElementById('iframe-upload-response'),
            warningSpan = document.getElementById('span-upload-file-warning'),
            testFileName, arrExclusion = alreadyLoadedFiles();

        testFileName = function () {
            if (!nameControl.value) {
                warningSpan.textContent = 'Please fill in the File Name.';

            } else if (arrExclusion.indexOf(nameControl.value + '.sql') > -1) {
                warningSpan.textContent = 'File Name is already taken.';

            } else {
                warningSpan.textContent = '';
            }
        };

        // upload existing file
        uploadButton.addEventListener('click', function(event) {
            var strFile = fileControl.value, strName = nameControl.value;

            pathControl.setAttribute('value', '/open/' + encodeTabNameForFileName(nameControl.value + '.sql'));

            if (strName === '' && strFile === '') { // no values (no file and no file name)
                GS.msgbox('Error', 'No values in form. Please fill in the form.', 'okonly');

            } else if (strFile === '') { // one value missing (no file)
                GS.msgbox('Error', 'No file selected. Please select a file using the file input.', 'okonly');

            } else if (strName === '') { // one value missing (no file name)
                GS.msgbox('Error', 'No value in file path textbox. Please fill in file name textbox.', 'okonly');

            } else if (warningSpan.textContent) {
                GS.msgbox('Error', warningSpan.textContent, 'okonly');

            } else { // values are filled in submit the form
                GS.addLoader('file-upload', 'Uploading file...');
                formElement.submit();
            }
        });

        fileControl.addEventListener('change', function(event) {
            var strValue = this.value;

            // strip off file path
            strValue = strValue.substring(strValue.lastIndexOf('\\') + 1);

            // strip off .sql
            strValue = strValue.substring(0, strValue.lastIndexOf('.'));

            nameControl.value = strValue;
            nameControl.focus();
            testFileName();
        });

        nameControl.addEventListener('keydown', function(event) {
            testFileName();

            if (event.keyCode === 13) {
                //console.log(uploadButton);
                GS.triggerEvent(uploadButton, 'click');
            }
        });

        nameControl.addEventListener('keyup', function(event) {
            testFileName();
        });

        nameControl.addEventListener('cut', function(event) {
            testFileName();
        });

        responseElement.addEventListener('load', function (event) {
            var strResponseText = responseElement.contentWindow.document.body.textContent.trim(), bolError;

            //console.log(strResponseText);

            if (strResponseText !== 'target ready') {
                if (strResponseText !== 'Upload Succeeded') {
                    bolError = true;
                }

                // if no error destroy new file popup
                if (!bolError) {
                    loadTabsFromServer(true);
                    GS.closeDialog(dialog, 'Ok');

                // if error open error popup
                } else {
                    GS.msgbox('Error', 'Upload failed, please refresh the page.', ['Ok']);
                }

                //console.log(bolError);
                GS.removeLoader('file-upload');
            }
        });
    });
}

function dialogOpenTabs(buttonElement) {
    'use strict';
    var templateElement = document.createElement('template');

    templateElement.setAttribute('data-overlay-close', 'true');

    var afterOpen = function () {
        var buttonContainer = document.getElementById('open-tab-list'), arrElements, i, len, currentButton;

        arrElements = xtag.query(document.getElementById('tab-bar'), '.tab-button');

        if (arrElements.length > 0) {
            for (i = 0, len = arrElements.length; i < len; i += 1) {
                currentButton = document.createElement('gs-button');
                currentButton.setAttribute('dialogclose', '');
                currentButton.textContent = arrElements[i].innerRenameControl.value;
                currentButton.relatedTab = arrElements[i];
                currentButton.classList.add('postage-menu-item-button');

                // if the selected: select it in the dialog
                if (arrElements[i].classList.contains('current-tab')) {
                    currentButton.setAttribute('selected', '');
                }

                buttonContainer.appendChild(currentButton);

                currentButton.addEventListener('click', function () {
                    GS.pushQueryString('view=tab:' + encodeURIComponent(this.relatedTab.filePath));
                    selectedTabButtonToFront();
                });
            }
        } else {
            document.getElementById('open-tab-list').innerHTML = '<center><h4>No Open Tabs</h4></center>';
        }
    };

    if (buttonElement) {
        templateElement.setAttribute('data-max-width', '300px');
        templateElement.setAttribute('data-max-height', window.innerHeight + 'px');
        templateElement.innerHTML = ml(function () {/*
            <gs-page>
                <gs-body id="open-tab-list"></gs-body>
            </gs-page>
        */});

        GS.openDialogToElement(buttonElement, templateElement, 'down', afterOpen);
    } else {
        templateElement.setAttribute('data-max-width', '400px');
        templateElement.innerHTML = ml(function () {/*
            <gs-page>
                <gs-header><center><h3>Open Tabs</h3></center></gs-header>
                <gs-body id="open-tab-list"></gs-body>
            </gs-page>
        */});

        GS.openDialog(templateElement, afterOpen);
    }
}

function dialogClosedTabs() {
    'use strict';
    var templateElement = document.createElement('template');

    templateElement.setAttribute('data-max-width', '900px');
    templateElement.setAttribute('data-overlay-close', 'true');
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-header><center><h3>Closed Tabs</h3></center></gs-header>
            <gs-body id="closed-tab-list" padded></gs-body>
            <gs-footer><gs-button dialogclose>Cancel</gs-button></gs-footer>
        </gs-page>
    */});

    // open a dialog
    GS.openDialog(templateElement, function () {
        var strPath = '/closed';

        // get list of files inside "closed" folder
        // template tab list
        // display tab list

        GS.requestFromSocket(GS.envSocket, 'TAB\tLIST\t' + GS.encodeForTabDelimited(strPath), function (data, error, errorData) {
            var arrFiles, i, len, fullFileName, strHTML, strType
              , strDate, strTime, strFileName, strFileExtension
              , intDate, intTime, intFileName, intFileExtension
              , arrElements;

            if (!error && data.trim()) {
                if (data.trim() !== 'TRANSACTION COMPLETED' && data.indexOf('Failed to get canonical path') === -1) {
                    arrFiles = data.trim().split('\n');

                    // remove files that we can't handle from the array
                    for (i = 0, len = arrFiles.length; i < len; i += 1) {
                        arrFiles[i] = decodeFileNameForTabName(arrFiles[i]);
                        strFileExtension = arrFiles[i].substring(arrFiles[i].lastIndexOf('.') + 1);

                        if (strFileExtension !== 'sql' && strFileExtension !== 'design-table' && strFileExtension !== 'datasheet') {
                            arrFiles.splice(i, 1);
                            i -= 1;
                            len -= 1;
                        }
                    }

                    for (i = 0, len = arrFiles.length, strHTML = ''; i < len; i += 1) {
                        intDate = arrFiles[i].indexOf(' ');
                        intTime = intDate + arrFiles[i].substring(intDate + 1).indexOf(' ') + 1;
                        intFileExtension = arrFiles[i].lastIndexOf('.');

                        strDate = arrFiles[i].substring(0, intDate);
                        strTime = arrFiles[i].substring(intDate + 1, intTime).substring(0, 5);
                        strFileName = arrFiles[i].substring(intTime + 1, intFileExtension);
                        strFileExtension = arrFiles[i].substring(intFileExtension + 1);

                        if (strFileExtension === 'sql') {
                            strType = 'SQL Script';
                        } else if (strFileExtension === 'design-table') {
                            strType = 'Table Design';
                        } else if (strFileExtension === 'datasheet') {
                            strType = 'Datasheet';
                        }

                        strHTML +=
                            '<tr>' +
                                '<td><b>' + encodeHTML(strFileName) + '</b> <small>(' + encodeHTML(strType) + ')</small></td>' +
                                '<td>' + encodeHTML(strDate) + ' ' + encodeHTML(strTime) + '</td>' +
                                '<td>' +
                                    '<gs-button class="button-add-as-new-tab" title="Open this script as a new tab" ' +
                                        'data-path="' + arrFiles[i] + '" ' +
                                        'data-original-name="' + strFileName + '" ' +
                                        'data-type="' + strFileExtension + '" dialogclose>Open</gs-button>' +
                                '</td>' +
                                '<td>' +
                                    ' <gs-button title="Download this script as a .sql file"' +
                                        ' href="/postage/' + contextData.connectionID +
                                                    '/download/' + encodeTabNameForFileName(GS.trim(strPath + '/' + arrFiles[i], '/')) + '"' +
                                        '>Download</gs-button>' +
                                '</td>' +
                            '</tr>';
                    }

                    strHTML =   '<table class="simple-table">' +
                                    '<thead>' +
                                        '<th>Name</th>' +
                                        '<th>Closed</th>' +
                                        '<th></th>' +
                                        '<th></th>' +
                                    '</thead>' +
                                    '<tbody>' + strHTML + '</tbody>' +
                                '</table>';

                    document.getElementById('closed-tab-list').innerHTML = strHTML;

                    // bind "Add As New Tab" buttons
                    arrElements = xtag.query(document.getElementById('closed-tab-list'), '.button-add-as-new-tab');

                    for (i = 0, len = arrElements.length; i < len; i += 1) {
                        arrElements[i].addEventListener('click', function () {
                            var strType = this.getAttribute('data-type'), strName = this.getAttribute('data-original-name');

                            GS.requestFromSocket(GS.envSocket,
                                                 'TAB\tREAD\t' +
                                                 GS.encodeForTabDelimited(
                                                     strPath + '/' + encodeTabNameForFileName(this.getAttribute('data-path'))
                                                 ),
                                                 function (data, error, errorData) {
                                var strChangeStamp;

                                if (!error) {
                                    //console.log(data);
                                    if (data !== 'TRANSACTION COMPLETED') {
                                        strChangeStamp = data.substring(0, data.indexOf('\n'));
                                        data = data.substring(data.indexOf('\n') + 1);

                                        if (strType === 'sql') {
                                            newTab(strType, strName, {'strContent': data, 'strChangeStamp': strChangeStamp});

                                        } else if (strType === 'design-table') {
                                            newTab(strType, strName, {'oid': data});

                                        } else if (strType === 'datasheet') {
                                            newTab(strType, strName, {'queryString': data});
                                        }
                                    }
                                } else {
                                    GS.webSocketErrorDialog(errorData);
                                }
                            });
                        });
                    }
                }

            } else if (!error && !data.trim()) {
                document.getElementById('closed-tab-list').innerHTML = '<center><h4>No Closed Tabs Found</h4></center>';

            } else {
                GS.webSocketErrorDialog(errorData);
            }
        });

    });
}

function fillTab(tabElement, jsnParameters) {
    'use strict';
    var strValue;

    if (tabElement.tabType === 'sql') {
        tabElement.relatedEditor.ignoreChange = true;

        strValue = jsnParameters.strContent || '\n\n\n\n\n\n\n\n\n';
        tabElement.relatedEditor.setValue(strValue);

        // on touch device add a letter to the textarea so that multiple delete works
        if (evt.touchDevice) {
            tabElement.relatedEditor.renderer.textarea.value = 'a';
        }

        tabElement.relatedEditor.ignoreChange = false;

        tabElement.changeStamp = jsnParameters.strChangeStamp || '0';
        tabElement.relatedEditor.session.selection.setRange(new Range(0, 0, 0, 0));
        tabElement.relatedEditor.resize(true);

        // reset undo stack so that we can't undo to empty
        //      (last time I tried to do this without the timer and didn't find a solution)
        setTimeout(function () {
            tabElement.relatedEditor.getSession().getUndoManager().reset();
        }, 1);

    } else if (tabElement.tabType === 'design-table') {
        tabElement.relatedFrame.innerHTML =
                '<iframe class="full-iframe" src="frames/frame-table.html?oid=' + jsnParameters.oid + '"></iframe>';

    } else if (tabElement.tabType === 'datasheet') {
        tabElement.relatedFrame.innerHTML =
                '<iframe class="full-iframe" src="frames/frame-datasheet.html?' + jsnParameters.queryString + '"></iframe>';
    }
}

function jsnIsEmpty(jsn) {
    'use strict';
    var strKey;

    for (strKey in jsn) {
        if (jsn.hasOwnProperty(strKey)) {
            return false;
        }
    }

    return true;
}


var afterDeleteSelectionDirections = [];
function newTab(strType, strTabName, jsnParameters, bolLoadedFromServer, strFilePath, bolAutoSelect) {
    'use strict';
    var tabElement, frameElement, editor, selectionChangeHandler
      , intTimerID, arrCurrentTabNames, i, len, arrElements
      , FFiveFunction, FFiveUpFunction, windowResizeHandler;

    strType = strType || 'sql';
    jsnParameters = jsnParameters || {};

    // get the current list of tab names
    arrCurrentTabNames = [];
    arrElements = xtag.query(document.getElementById('tab-bar'), '.tab-button');

    for (i = 0, len = arrElements.length; i < len; i += 1) {
        arrCurrentTabNames.push(arrElements[i].innerRenameControl.value);
    }

    // create a unique tab name
    strTabName = (strTabName || 'Tab');

    if (arrCurrentTabNames.indexOf(strTabName) !== -1) {
        i = 2;

        while (arrCurrentTabNames.indexOf(strTabName + ' ' + i) !== -1 && i < 300) {
            //console.log(arrCurrentTabNames.indexOf(strTabName + ' ' + i), strTabName + ' ' + i);
            i += 1;
        }

        strTabName = strTabName + ' ' + i;
    }

    // create new tab frame
    frameElement = document.createElement('div');
    frameElement.classList.add('tab-frame');

    // create new tab button
    tabElement = document.createElement('div');
    tabElement.classList.add('tab-button');
    tabElement.innerHTML =
        '<input class="rename-control" type="text" tabindex="-1" ' +
                'value="' + encodeHTML(strTabName) + '" />' +
        '<div class="delete-button" title="Close this tab"></div>';

    tabElement.innerRenameControl = tabElement.children[0];
    tabElement.innerRenameControl.oldValue = tabElement.innerRenameControl.value;

    tabElement.innerDeleteButton = tabElement.children[1];

    tabElement.relatedFrame = frameElement;
    tabElement.tabType = strType;
    tabElement.bolLoadFromServer = bolLoadedFromServer; // the change of tense is on purpose: the name has been loaded
                                                        //      from the server but the content still has to load from the server

    tabElement.filePath = strFilePath ||
                        ('/open/' + encodeTabNameForFileName(tabElement.innerRenameControl.value) + '.' + strType);

    tabElement.changeStamp = '0';

    // bind rename control key events to resize the control
    tabElement.innerRenameControl.addEventListener('input', function () {
        this.style.width = GS.getTextWidth(tabElement, this.value, true) + 'px';
    });
    //tabElement.innerRenameControl.addEventListener('keydown', function () { // event
    //    //console.log(this.value + String.fromCharCode(event.keyCode));
    //    this.style.width = GS.getTextWidth(tabElement, this.value, true) + 'px';
    //});
    //tabElement.innerRenameControl.addEventListener('keyup', function () {
    //    this.style.width = GS.getTextWidth(tabElement, this.value, true) + 'px';
    //});
    //tabElement.innerRenameControl.addEventListener('keypress', function () {
    //    this.style.width = GS.getTextWidth(tabElement, this.value, true) + 'px';
    //});

    // bind rename control change
    tabElement.innerRenameControl.addEventListener('change', function () {
        var arrTakenNames = alreadyLoadedFiles()
          , strPath = tabElement.filePath.substring(0, tabElement.filePath.lastIndexOf('/') + 1)
          , strExtension, strNewName;

        strExtension = tabElement.tabType;
        strNewName = encodeTabNameForFileName(tabElement.innerRenameControl.value) + '.' + strExtension;

        if (arrTakenNames.indexOf(strNewName) !== -1) {
            GS.msgbox('Please Choose A Different Name'
                    , '<center cannot-hold="true">A tab with this name already exists. Please name your tab to be unique.</center>'
                    , ['Ok']);
        } else {
            GS.requestFromSocket(GS.envSocket,
                                'TAB\tMOVE\t' + GS.encodeForTabDelimited(tabElement.filePath) + '\t' +
                                    GS.encodeForTabDelimited(strPath + strNewName),
                                function (data, error, errorData) {

                if (!error) {
                    if (data !== 'TRANSACTION COMPLETED') {
                        tabElement.changeStamp = data;
                        tabElement.filePath = strPath + encodeTabNameForFileName(tabElement.innerRenameControl.value) + '.' + strExtension;
                        //GS.pushQueryString('current-tab=' + encodeURIComponent(tabElement.filePath));
                        GS.pushQueryString('view=tab:' + encodeURIComponent(tabElement.filePath));
                        tabElement.innerRenameControl.oldValue = tabElement.innerRenameControl.value;

                        // update href of download script button (we want to use an anchor for that button because it's native)
						if (window.process && window.process.type === 'renderer') {
							tabElement.relatedDownloadButton.setAttribute('data-filename', tabElement.filePath);
							tabElement.relatedDownloadButton2.setAttribute('data-filename', tabElement.filePath);
						} else {
	                        tabElement.relatedDownloadButton.setAttribute(
	                            'href',
	                            '/postage/' + contextData.connectionID + '/download/' + GS.trim(tabElement.filePath, '/')
	                        );
						}

                    }

                } else {
                    GS.webSocketErrorDialog(errorData);
                }
            });
        }
    });

    // bind delete button click
    tabElement.innerDeleteButton.addEventListener('click', function (event) {
        event.stopPropagation();
        intNumberOfTabs -= 1;
        if (intNumberOfTabs > 0) {
            //console.log(tabElement.previousElementSibling, tabElement.nextElementSibling);
            if (tabElement.classList.contains('current-tab')) {
                if (tabElement.nextElementSibling) {
                    //console.log('next sibling', tabElement.nextElementSibling);
                    //GS.triggerEvent(tabElement.nextElementSibling, 'click');

                    //setFrame(tabElement.nextElementSibling, tabElement.nextElementSibling.relatedFrame, false);
                    GS.pushQueryString('view=tab:' + encodeURIComponent(tabElement.nextElementSibling.filePath));

                } else if (tabElement.previousElementSibling) {
                    //console.log('previous sibling', tabElement.previousElementSibling);
                    //GS.triggerEvent(tabElement.previousElementSibling, 'click');

                    //setFrame(tabElement.previousElementSibling, tabElement.previousElementSibling.relatedFrame, false);
                    GS.pushQueryString('view=tab:' + encodeURIComponent(tabElement.previousElementSibling.filePath));
                }
            }

            closeFile(tabElement, function () {
                document.getElementById('tab-bar').removeChild(tabElement);
                document.getElementById('tab-frames').removeChild(frameElement);
            });

        } else {
            closeFile(tabElement, function () {
                document.getElementById('tab-bar').removeChild(tabElement);
                document.getElementById('tab-frames').removeChild(frameElement);
                //openHome();
                setQSToHome();
            });
        }
    });

    // bind tab button click
    tabElement.addEventListener('click', function (event) {
        if (!event.target.classList.contains('delete-button') &&
            !(
                tabElement.classList.contains('current-tab') &&
                event.target.classList.contains('rename-control')
            )) {
            //console.log('click emitted:', tabElement, frameElement);
            //setFrame(tabElement, frameElement, false);
            GS.pushQueryString('view=tab:' + encodeURIComponent(tabElement.filePath));
        }
    });

    // bind tab button drag
    tabElement.addEventListener(evt.mousedown, function (event) {
        var tabBarElement = document.getElementById('tab-bar'), tabElement = this, arrElements, i, len,
            offsetsCache, intCurrentLeft, intTabBarOffsetLeft, intTabBarWidth, ghostElement, borderElement,
            sortHandler, mousemoveHandler, mouseupHandler, bolFirstMove = true, bolPreviouslyMatchedLast,
            previouslyMatchedElement;

        //console.log(document.activeElement);

        // if the focus isn't in the rename control and isn't the delete button: allow sort
        if (document.activeElement !== tabElement.innerRenameControl && !event.target.classList.contains('delete-button')) {
            sortHandler = function (event) {
                var intMouseLeft = GS.mousePosition(event).left, intLeft = intMouseLeft - intTabBarOffsetLeft,
                    matchedElement, bolMatchedLast, i, len;

                // update ghost position
                ghostElement.style.left = (intLeft - (ghostElement.offsetWidth / 2)) + 'px';

                // calculate matched element
                if (offsetsCache[0].left > intLeft) {
                    matchedElement = offsetsCache[0].element;
                    bolMatchedLast = false;

                } else {
                    for (i = 0, len = offsetsCache.length; i < len; i += 1) {
                        bolMatchedLast = false;
                        if (offsetsCache[i + 1]) {
                            if (offsetsCache[i].left <= intLeft &&
                                offsetsCache[i].left + ((offsetsCache[i + 1].left - offsetsCache[i].left) / 2) > intLeft) {

                                matchedElement = offsetsCache[i].element;
                                break;

                            } else if (offsetsCache[i].left <= intLeft &&
                                        offsetsCache[i].left + ((offsetsCache[i + 1].left - offsetsCache[i].left) / 2) <= intLeft &&
                                        offsetsCache[i + 1].left > intLeft) {
                                matchedElement = offsetsCache[i + 1].element;
                                break;
                            }
                        } else {
                            if (offsetsCache[i].left + (offsetsCache[i].width / 2) >= intLeft) {
                                matchedElement = offsetsCache[i].element;
                                break;

                            } else if (offsetsCache[i].left + (offsetsCache[i].width / 2) <= intLeft) {
                                matchedElement = offsetsCache[i].element;
                                bolMatchedLast = true;
                                break;
                            }
                        }
                    }
                }

                //console.log(bolMatchedLast, matchedElement);
                //console.log(bolPreviouslyMatchedLast, previouslyMatchedElement);

                // if match element has changed or whether or not we matched "after the last element" has changed
                if (matchedElement !== previouslyMatchedElement || bolMatchedLast !== bolPreviouslyMatchedLast) {
                    // move border element
                    if (bolMatchedLast === true) {
                        tabBarElement.removeChild(borderElement);
                        tabBarElement.appendChild(borderElement);

                    } else {
                        tabBarElement.insertBefore(borderElement, matchedElement);
                    }

                    // save currently matched element and whether or not we matched "after the last element"
                    previouslyMatchedElement = matchedElement;
                    bolPreviouslyMatchedLast = bolMatchedLast;
                }

                //// if we are within 16px (or negative) of the left side of the tab bar and
                ////      there is room to scroll in that direction: scroll
                //if (intLeft <= 16) {
                //    //console.log('LEFT SCROLL***');
                //
                //// else if we are within 16px of (or any farther than) the right side of the tab bar and
                ////      there is room to scroll in that direction: scroll
                //} else if (intLeft >= (intTabBarWidth - 16)) {
                //    //console.log('RIGHT SCROLL***');
                //}
            };

            mousemoveHandler = function (event) {
                if (event.which === 0 && !evt.touchDevice) {
                    mouseupHandler(event);

                } else {
                    if (bolFirstMove) {
                        bolFirstMove = false;

                        // save size and position data of tab bar
                        intTabBarOffsetLeft = GS.getElementOffset(tabBarElement).left;
                        intTabBarWidth = tabBarElement.offsetWidth;

                        // save a cache of the tab left offsets
                        arrElements = xtag.toArray(tabBarElement.children);
                        offsetsCache = [];
                        intCurrentLeft = 0;
                        for (i = 0, len = arrElements.length; i < len; i += 1) {
                            offsetsCache.push({
                                'element': arrElements[i],
                                'left': intCurrentLeft,
                                'width': arrElements[i].offsetWidth
                            });

                            intCurrentLeft += arrElements[i].offsetWidth;
                        }

                        // create, save and append ghost
                        ghostElement = tabElement.cloneNode(true);
                        ghostElement.setAttribute('style', 'position: absolute; left: 0px; top: 0px; opacity: 0.8;' +
                                                                        'width: ' + tabElement.clientWidth + 'px;' +
                                                                        'border-left: 1px solid #AAAAAA;');
                        ghostElement.classList.add('current-tab');
                        tabBarElement.appendChild(ghostElement);

                        // create, save and append border element
                        borderElement = document.createElement('div');
                        borderElement.setAttribute('style',
                                                   'display: inline-block; position: relative; height: 1.2em; overflow: visible;');// float: left;
                        borderElement.innerHTML = '<div style="position: absolute;' +
                                                                              'top: 0px; left: -2px;' +
                                                                              'height: 2em; width: 6px;' +
                                                                              'background-color: #00CC00;"></div>';
                        tabBarElement.appendChild(borderElement);
                    }

                    sortHandler(event);
                    event.preventDefault();
                }
            };

            mouseupHandler = function (event) {
                document.body.removeEventListener(evt.mousemove, mousemoveHandler);
                document.body.removeEventListener(evt.mouseup, mouseupHandler);
                if (ghostElement) {
                    tabBarElement.insertBefore(tabElement, borderElement);

                    //console.log('TEMP: EDIT FILE CALL HERE (tab order file)');
                    tabBarElement.removeChild(ghostElement);
                    tabBarElement.removeChild(borderElement);

                    //setFrame(tabElement, tabElement.relatedFrame);
                    GS.pushQueryString('view=tab:' + encodeURIComponent(tabElement.filePath));
                }
            };

            document.body.addEventListener(evt.mousemove, mousemoveHandler);
            document.body.addEventListener(evt.mouseup, mouseupHandler);
        }
    });

    // add new tab to the very left
    if (document.getElementById('tab-bar').children.length === 0) {
        document.getElementById('tab-bar').appendChild(tabElement);

    } else {
        document.getElementById('tab-bar').insertBefore(tabElement, document.getElementById('tab-bar').children[0]);
    }

    document.getElementById('tab-frames').appendChild(frameElement);

    // adjust tab rename control width
    tabElement.innerRenameControl.style.width = GS.getTextWidth(tabElement, tabElement.innerRenameControl.value, true) + 'px';

    // fill frame
    if (strType === 'sql') {
        frameElement.innerHTML =
            '<div id="frame-' + intTabNumber + '-indicator" class="frame-indicator"></div>' +
            '<div id="script-window-container-' + intTabNumber + '" class="script-window-container" flex-vertical flex-fill>' +
                '<div class="ace-container-position-container" flex>' +
                    '<div class="ace-container">' +
                    '    <div id="sql-ace-area-' + intTabNumber + '" class="ace-area"></div>' +
                    '</div>' +
                    '<div class="ace-toolbar" id="sql-ace-toolbar-' + intTabNumber + '">' +
                        '<gs-button icononly icon="play" onclick="executeScript()" ' +
                                    'title="Execute Script [F5]" remove-bottom no-focus></gs-button>' +
                        '<gs-button class="button-toggle-comments" onclick="toggleCommentScript()" ' +
                                    'title="Comment/uncomment the selected text [CMD][/] or [CTRL][/]" remove-all no-focus><span>--</span></gs-button>' +
                        '<gs-button icononly icon="indent" onclick="indentScript()" ' +
                                    'title="Indent the selected text [TAB]" remove-all no-focus></gs-button>' +
                        '<gs-button icononly icon="outdent" onclick="outdentScript()" ' +
                                    'title="Outdent the selected text [SHIFT][TAB]" remove-all no-focus></gs-button>' +
                        (
							window.process && window.process.type === 'renderer' ?
							'<gs-button icononly id="button-tab-' + intTabNumber + '-save" icon="save" data-filename="' + tabElement.filePath + '" ' +
                                    'title="Save" remove-all no-focus></gs-button>' +
							'<gs-button icononly id="button-tab-' + intTabNumber + '-save-as" class="button-save-as" data-filename="' + tabElement.filePath + '" ' +
                                    'title="Save As..." remove-all no-focus>' +
                            '<span class="save-as-floppy">&#xf0c7;</span>' + //&#9830;
                            '<span class="save-as-pencil">&#xf040;</span>' +
                        '</gs-button>'
							:
							'<gs-button icononly id="button-tab-' + intTabNumber + '-download" icon="download" href="/postage/' + contextData.connectionID + '/download/' + GS.trim(tabElement.filePath, '/') + '" onclick="downloadScript()" ' +
                                    'title="Download as a file" remove-all no-focus></gs-button>'
						) +
                        '<gs-button icononly class="button-explain" icon="play-circle-o" onclick="explain()" ' +
                                    'title="Query explanation. This does not run the query." remove-all no-focus><span class="explain-letter">E</span></gs-button>' +
                        '<gs-button icononly class="button-explain" icon="play" onclick="explain(true)" ' +
                                    'title="Query explanation. Note that the query will run, meaning that you\'ll get run times." remove-top><span class="explain-letter" no-focus>E</span></gs-button>' +
                        '<gs-button icononly class="button-csv" icon="file-text" onclick="exportCSV()" ' +
                                    'title="Download a single query\'s results as a file" remove-all no-focus></gs-button>' +
                        '<gs-button icononly class="button-ace-info" onclick="dialogAceInfo()" ' +
                                    'title="Information and tips about the Editor" remove-top no-focus>' +
                            '<span class="ace-suit">&#9824;</span>' + //&#9830;
                            '<span class="ace-letter">A</span>' +
                        '</gs-button>' +
                        '<gs-button hidden id="sql-property-' + intTabNumber + '-button" icononly ' +
                                    'icon="wrench" onclick="propertyWindowDialog()" disabled  ' + //hidden
                                    'title="Edit the current query\'s properties [CMD][.] or [CTRL][.]" remove-top></gs-button>' +
                    '</div>' +
                '</div>' +
                '<div id="sql-doc-links-' + intTabNumber + '" style="text-align: center; height: 0;">' +
                    '<div style="display: inline-block;"></div>' +
                    '<div style="display: inline-block;"></div>' +
                '</div>' +
                '<div class="sql-results-area-container" ' +
                                  'id="sql-results-area-' + intTabNumber + '-container" ' +
                                  'style="height: 17em;" flex-vertical flex-fill>' +
                    '<gs-page>' +
                        '<gs-header id="sql-results-header-' + intTabNumber + '" class="results-header" flex-horizontal flex-fill>' +
                            '<b flex  id="sql-results-area-resize-handle-' + intTabNumber + '"' +
                                    ' class="sql-results-area-resize-handle" icononly' +
                                    ' title="Drag to resize this window" icon="arrows-v"' +
                                    ' style="line-height: 2.422em; padding-left: 0.5em;">' +
                                '<span id="sql-results-title-' + intTabNumber + '">Results</span>' +
                                '<span id="sql-results-tally-' + intTabNumber + '"></span>' +
                            '</b>' +
                            '<gs-button id="sql-results-stop-' + intTabNumber + '" hidden no-focus' +
                                      ' class="header-button-text" icon="stop" no-focus>Stop Execution</gs-button>' +
                            '<gs-button id="sql-results-stop-loading-' + intTabNumber + '" hidden no-focus' +
                                      ' class="header-button-text" icon="hand-stop-o" no-focus>Stop Loading</gs-button>' +
                            '<gs-button id="sql-results-copy-options-' + intTabNumber + '" hidden no-focus' +
                                      ' class="header-button-text" icon="clipboard" no-focus>Clip Options</gs-button>' +
                            '<gs-button id="sql-results-clear-' + intTabNumber + '" no-focus' +
                                      ' class="header-button-text" icon="trash-o" no-focus>Clear</gs-button>' +
                        '</gs-header>' +
                        '<gs-body id="sql-results-area-' + intTabNumber + '" class="sql-results-area"></gs-body>' +
                    '</gs-page>' +
                '</div>' +
            '</div>';

        //<gs-button class="header-button" icononly icon="bug" onclick="debugScript()" remove-all></gs-button>
        //<gs-button class="header-button" icononly icon="text-height" onclick="resultsToText()" remove-right></gs-button>
        //<gs-button class="header-button" icononly icon="th" onclick="resultsToGrid()" remove-all></gs-button>
        //<gs-button class="header-button" icononly icon="file-o" onclick="resultsToFile()" remove-all></gs-button>
        //<gs-button class="header-button" icononly icon="print" onclick="resultsToPrint()" remove-left></gs-button>

        editor = ace.edit('sql-ace-area-' + intTabNumber);
        tabElement.relatedEditor = editor;
        tabElement.indicatorElement = document.getElementById('frame-' + intTabNumber + '-indicator');

        tabElement.relatedContainer = document.getElementById('script-window-container-' + intTabNumber);
        tabElement.relatedResizeHandle = document.getElementById('sql-results-area-resize-handle-' + intTabNumber);
        tabElement.relatedResultsArea = document.getElementById('sql-results-area-' + intTabNumber);
        tabElement.relatedResultsHeaderElement = document.getElementById('sql-results-header-' + intTabNumber);
        tabElement.relatedResultsTallyElement = document.getElementById('sql-results-tally-' + intTabNumber);
        tabElement.relatedResultsTitleElement = document.getElementById('sql-results-title-' + intTabNumber);
        tabElement.relatedResultsAreaContainer = document.getElementById('sql-results-area-' + intTabNumber + '-container');
        tabElement.relatedPropertyButton = document.getElementById('sql-property-' + intTabNumber + '-button');
        tabElement.relatedDocLinksContainer = document.getElementById('sql-doc-links-' + intTabNumber);
        tabElement.bolAutoOpenPropertyList = true;

        tabElement.relatedStopButton = document.getElementById('sql-results-stop-' + intTabNumber);
        tabElement.relatedClearButton = document.getElementById('sql-results-clear-' + intTabNumber);
        tabElement.relatedCopyOptionsButton = document.getElementById('sql-results-copy-options-' + intTabNumber);
        tabElement.relatedStopLoadingButton = document.getElementById('sql-results-stop-loading-' + intTabNumber);

		if (window.process && window.process.type === 'renderer') {
			tabElement.relatedDownloadButton = document.getElementById('button-tab-' + intTabNumber + '-save');
			tabElement.relatedDownloadButton2 = document.getElementById('button-tab-' + intTabNumber + '-save-as');

			tabElement.relatedDownloadButton.addEventListener('click', function (event) {
				console.log(event, event.which);
				var strFileName = this.getAttribute('data-filename');
				saveScriptAsFile(strFileName);
			});

			tabElement.relatedDownloadButton2.addEventListener('click', function (event) {
				console.log(event, event.which);
				var strFileName = this.getAttribute('data-filename');
				saveScriptAsFile(strFileName, true);
			});
		} else {
			tabElement.relatedDownloadButton = document.getElementById('button-tab-' + intTabNumber + '-download');
		}

        tabElement.relatedEditorToolbar = document.getElementById('sql-ace-toolbar-' + intTabNumber);
        tabElement.relatedEditorToolbar.addEventListener('click', function () {
            tabElement.relatedEditor.focus();
        });


        //editor.getSession().selection.on('changeCursor', function(event) {
        //    console.log(event);
        //    if (event.keyCode === 37 || event.keyCode === 39) {
        //        editor.completer.detach();
        //    }
        //});
        //document.getElementById('sql-ace-area-' + intTabNumber)
        //editor.addEventListener('keydown', function (event) {
        //    console.log(event);
        //    if (event.keyCode === 37 || event.keyCode === 39) {
        //        editor.completer.detach();
        //    }
        //});
        //editor.commands.addCommand({
        //    name: 'dismissCompleter',
        //    bindKey: {win: 'Left',  mac: 'Left'},
        //    exec: function(editor) {
        //        //console.log('test', editor.completer);
        //
        //        if (editor.completer &&
        //            editor.completer.popup &&
        //            editor.completer.popup.container &&
        //            editor.completer.popup.container.style.display !== 'none') {
        //            editor.completer.detach();
        //        } else {
        //            return false;
        //        }
        //    },
        //    readOnly: true // false if this command should not apply in readOnly mode
        //});

        // after first selection: show clip options button
        tabElement.relatedResultsArea.addEventListener('after_selection', function (event) {
            tabElement.relatedCopyOptionsButton.removeAttribute('hidden');
        });

        // bind clip options button
        tabElement.relatedCopyOptionsButton.addEventListener('click', function (event) {
            var templateElement = document.createElement('template'), arrElements, i, len;

            templateElement.setAttribute('data-max-width', '490px');
            templateElement.innerHTML = ml(function () {/*
                <gs-page>
                    <gs-header>
                        <center><h3>Clipboard Options</h3></center>
                    </gs-header>
                    <gs-body id="clip-options-container" padded>
                        <gs-grid widths="1,1" gutter>
                            <gs-block>
                                <gs-optionbox id="clip-options-quote-which" style="padding: 0 0.25em 0.25em 0.25em;">
                                        <label>Quote:</label>
                                        <gs-option value="none">Nothing</gs-option>
                                        <gs-option value="strings">Strings</gs-option>
                                        <gs-option value="all">All Fields</gs-option>
                                </gs-optionbox>
                            </gs-block>
                            <gs-block>
                                <gs-optionbox id="clip-options-column-names" style="padding: 0 0.25em 0.25em 0.25em;">
                                        <label>Column Names:</label>
                                        <gs-option value="true">Always</gs-option>
                                        <gs-option value="false">Only When Selected</gs-option>
                                </gs-optionbox>
                            </gs-block>
                        </gs-grid>
                        <div flex-horizontal>
                            <label for="clip-options-quote-char" style="min-width: 7.25em;">Quote Char:</label>
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
                    </gs-body>
                    <gs-footer>
                        <center>Changes are effective immediately after clicking <b>"Save"</b>.</center>
                        <gs-grid gutter>
                            <gs-block><gs-button jumbo dialogclose>Cancel</gs-button></gs-block>
                            <gs-block><gs-button jumbo dialogclose bg-primary>Save</gs-button></gs-block>
                        </gs-grid>
                    </gs-footer>
                </gs-page>
            */});

            // open dialog
            GS.openDialogToElement(this, templateElement, 'up', function () {
                // move controls to seperate lines from their labels if we're on a touch device
                if (evt.touchDevice) {
                    arrElements = xtag.query(document.getElementById('clip-options-container'), '[flex-horizontal], [flex]');

                    for (i = 0, len = arrElements.length; i < len; i += 1) {
                        arrElements[i].removeAttribute('flex-horizontal');
                        arrElements[i].removeAttribute('flex');
                    }

                // else: add a small top margin for a little spacing
                } else {
                    arrElements = xtag.query(document.getElementById('clip-options-container'), '[flex-horizontal]');

                    for (i = 0, len = arrElements.length; i < len; i += 1) {
                        arrElements[i].style.marginTop = '0.25em';
                    }
                }

                // set control values
                document.getElementById('clip-options-quote-which').value = getClipSetting("quoteType");
                document.getElementById('clip-options-quote-char').value = getClipSetting("quoteChar");
                document.getElementById('clip-options-field-delimiter').value = getClipSetting("fieldDelimiter");
                document.getElementById('clip-options-null-values').value = getClipSetting("nullValues");
                document.getElementById('clip-options-column-names').value = getClipSetting("columnNames");

            }, function (event, strAnswer) {
                var arrElements, i, len;

                if (strAnswer === 'Save') {
                    // save clip settings
                    setClipSetting("quoteType", document.getElementById('clip-options-quote-which').value);
                    setClipSetting("quoteChar", document.getElementById('clip-options-quote-char').value);
                    setClipSetting("fieldDelimiter", document.getElementById('clip-options-field-delimiter').value);
                    setClipSetting("nullValues", document.getElementById('clip-options-null-values').value);
                    setClipSetting("columnNames", document.getElementById('clip-options-column-names').value);

                    // set all the table elements clip setting attributes
                    arrElements = xtag.query(tabElement.relatedResultsArea, 'table.results-table');

                    for (i = 0, len = arrElements.length; i < len; i += 1) {
                        arrElements[i].setAttribute('quote-type', getClipSetting("quoteType"));
                        arrElements[i].setAttribute('quote-char', getClipSetting("quoteChar"));
                        arrElements[i].setAttribute('field-delimiter', getClipSetting("fieldDelimiter"));
                        arrElements[i].setAttribute('null-values', getClipSetting("nullValues"));
                        arrElements[i].setAttribute('column-names', getClipSetting("columnNames"));
                    }
                }
            });
        });

        // bind clear button
        document.getElementById('sql-results-clear-' + intTabNumber).addEventListener('click', function () {
            tabElement.relatedResultsHeaderElement.classList.remove('error');
            tabElement.relatedResultsTallyElement.innerHTML = '';
            tabElement.relatedResultsTitleElement.innerHTML = 'Results';
            tabElement.relatedResultsArea.innerHTML = '';
        });

        // bind sql results resizing
        tabElement.relatedResizeHandle.addEventListener(evt.mousedown, function (event) {
            var resizeTarget = tabElement.relatedResultsAreaContainer
              , intOffset = (resizeTarget.clientHeight - GS.mousePosition(event).bottom)
              , intMin = this.parentNode.offsetHeight, intMax = tabElement.relatedContainer.offsetHeight
              , mousemoveHandler, mouseupHandler, resizeHandler;

            resizeHandler = function (event) {
                var intHeight = (GS.mousePosition(event).bottom + intOffset);

                if (intHeight < intMin) { intHeight = intMin; }
                if (intHeight > intMax) { intHeight = intMax; }

                resizeTarget.style.height = intHeight + 'px';
                tabElement.relatedEditor.resize();
            };

            // call sort handler
            resizeHandler(event);

            // bind mousemove and mouseup
            mousemoveHandler = function (event) {
                if (event.which === 0 && !evt.touchDevice) {
                    mouseupHandler(event);

                } else {
                    resizeHandler(event);
                    event.preventDefault();
                }
            };

            mouseupHandler = function (event) {
                document.body.removeEventListener(evt.mousemove, mousemoveHandler);
                document.body.removeEventListener(evt.mouseup, mouseupHandler);
            };

            document.body.addEventListener(evt.mousemove, mousemoveHandler);
            document.body.addEventListener(evt.mouseup, mouseupHandler);
        });

        // handle resizing the results window on window resize
        windowResizeHandler = function (event) {
            var intMin, intMax, intHeight;

            //console.trace(event.target);
            //if (event.target === window) {
            if (tabElement.parentNode) {
                intHeight = tabElement.relatedResultsAreaContainer.clientHeight;
                intMin = tabElement.relatedResizeHandle.parentNode.offsetHeight;
                intMax = tabElement.relatedContainer.offsetHeight;
                //console.log(intHeight, intMin, intMax);

                if (intHeight !== 0 && intMin !== 0 && intMax !== 0) {
                    if (intHeight < intMin) { intHeight = intMin; }
                    if (intHeight > intMax) { intHeight = intMax; }

                    tabElement.relatedResultsAreaContainer.style.height = intHeight + 'px';
                    tabElement.relatedEditor.resize();
                }
            } else {
                window.removeEventListener('resize', windowResizeHandler);
            }
            //}
        };

        window.addEventListener('resize', windowResizeHandler);

        // bind to F5
        FFiveFunction = function (event) {
            if (tabElement.parentNode) {
                if (tabElement.classList.contains('current-tab') &&
                    (event.keyCode || event.which) === 116 &&
                    tabElement.executedWaitingForKeyup !== true) {

                    tabElement.executedWaitingForKeyup = true;
                    executeScript();
                    event.preventDefault();
                    event.stopPropagation();
                }
            } else {
                window.removeEventListener('keydown', FFiveFunction);
                window.removeEventListener('keyup', FFiveUpFunction);
            }
        };

        FFiveUpFunction = function (event) {
            if (tabElement.parentNode) {
                if (tabElement.classList.contains('current-tab') && (event.keyCode || event.which) === 116) {
                    tabElement.executedWaitingForKeyup = false;
                    event.preventDefault();
                    event.stopPropagation();
                }
            } else {
                window.removeEventListener('keydown', FFiveFunction);
                window.removeEventListener('keyup', FFiveUpFunction);
            }
        };

        // bind F5 to run executeScript, if we're on a script tab
        window.addEventListener('keydown', FFiveFunction);
        window.addEventListener('keyup', FFiveUpFunction);

        editor.setTheme('ace/theme/eclipse');
        editor.getSession().setMode('ace/mode/pgsql');
        editor.setShowPrintMargin(false);
        editor.setDisplayIndentGuides(true);
        editor.setShowFoldWidgets(false);
        editor.session.setUseWrapMode('free');
        editor.setBehavioursEnabled(false);
        editor.$blockScrolling = Infinity; // <== blocks a warning

        //editor.setOptions({
        //    'enableBasicAutocompletion': true,
        //    'enableSnippets'           : true,
        //    'enableLiveAutocompletion' : true
        //});
        //editor.addEventListener('typeahead:render', function(e) {
        //    xtag.query(editor, '.ace_autocomplete .ace_line:first').classList.add('ace_selected');
            //editor.getElementById('search_form').parent().find('.tt-selectable:first').addClass('tt-cursor');
        //});

        //// selection change handler
        //editor.selectionChangeHandler = bindAcePropertyWindow(tabElement);
        //
        //document.getElementById('sql-ace-area-' + intTabNumber).addEventListener(evt.mouseup, editor.selectionChangeHandler);
        //document.getElementById('sql-ace-area-' + intTabNumber).addEventListener('keyup', editor.selectionChangeHandler);

        // bind cmd-s and cmd-.
        document.addEventListener('keydown', function (event) {
            // cmd-s
            if (tabElement.parentNode && tabElement.classList.contains('current-tab') && (event.which || event.keyCode) === 83 && event.metaKey) {
                event.preventDefault();
                event.stopPropagation();
                clearTimeout(intTimerID);
                intTimerID = null;
                saveScript(tabElement, true);
            }
        });

        // bind query selection
        editor.selectionChangeHandler = function (event) {
            selectionFindRange(tabElement, editor);
        };

        document.getElementById('sql-ace-area-' + intTabNumber).addEventListener(evt.mouseup, editor.selectionChangeHandler);
        document.getElementById('sql-ace-area-' + intTabNumber).addEventListener('keyup', editor.selectionChangeHandler);

        // bind autocomplete and property window listeners
        autocompleteBindEditor(tabElement, editor);
        //propertyBindEditor(tabElement, editor);

        // bind text change saving
        editor.addEventListener('change', function (event) {
            if (editor.ignoreChange !== true) {
                clearTimeout(intTimerID);
                intTimerID = setTimeout(function () {
                    saveScript(tabElement);

                    intTimerID = null;
                }, 300);
            }
        });

        // if we're on a touch device: make the ace grow with it's content
        if (evt.touchDevice) {
            editor.setOptions({'maxLines': Infinity});
            document.getElementById('sql-ace-area-' + intTabNumber).classList.add('childrenneedsclick');
            document.getElementById('sql-ace-area-' + intTabNumber).style.borderBottom = '1px solid #AAAAAA';

        // else: full height
        } else {
            document.getElementById('sql-ace-area-' + intTabNumber).style.height = '100%';
        }

        //console.log(jsnParameters.strContent);
        if (!jsnIsEmpty(jsnParameters)) {
            fillTab(tabElement, jsnParameters);
        }

        if (!bolLoadedFromServer) {
            saveScript(tabElement, true);
        }

        //editor.completer.autoSelect = true;
    } else if (strType === 'design-table') {
        if (!jsnIsEmpty(jsnParameters)) {
            fillTab(tabElement, jsnParameters);
        }

        if (!bolLoadedFromServer) {
            GS.addLoader(tabElement.relatedFrame, 'Saving...');
            saveFile(tabElement, tabElement.filePath, tabElement.changeStamp, jsnParameters.oid, function () {
                GS.removeLoader(tabElement.relatedFrame);
            });
        }

    } else if (strType === 'datasheet') {
        if (!jsnIsEmpty(jsnParameters)) {
            fillTab(tabElement, jsnParameters);
        }

        if (!bolLoadedFromServer) {
            GS.addLoader(tabElement.relatedFrame, 'Saving...');
            saveFile(tabElement, tabElement.filePath, tabElement.changeStamp, jsnParameters.queryString, function () {
                GS.removeLoader(tabElement.relatedFrame);
            });
        }
    }

    if (bolAutoSelect !== false) {
        // set frame to new frame
        //setFrame(tabElement, frameElement);
        GS.pushQueryString('view=tab:' + encodeURIComponent(tabElement.filePath));
    }

    // increment tab number
    intNumberOfTabs += 1;
    intTabNumber += 1;

    return tabElement;
}

function closeFile(tabElement, callBack) {
    'use strict';
    var strFromPath, strToPath, date = new Date();

    strFromPath = tabElement.filePath;
    strToPath = '/closed/' +
                encodeTabNameForFileName(
                    (
                        date.getFullYear() + '-' +
                        GS.leftPad((date.getMonth() + 1), '0', 2) + '-' +
                        GS.leftPad(date.getDate(), '0', 2)
                    ) + ' ' + (
                        GS.leftPad(date.getHours(), '0', 2) + ':' +
                        GS.leftPad(date.getMinutes(), '0', 2) + ':' +
                        GS.leftPad(date.getSeconds(), '0', 2) + ':' +
                        GS.leftPad(date.getMilliseconds(), '0', 4) + ':' +
                        GS.leftPad(((date.getTimezoneOffset() / 60) * 100), '0', 4)
                    ) + ' ' +
                    tabElement.innerRenameControl.value
                ) + '.' + tabElement.tabType;

    GS.addLoader('delete-file', 'Removing File...');
    GS.requestFromSocket(GS.envSocket,
                         'TAB\tMOVE\t' + GS.encodeForTabDelimited(strFromPath) + '\t' + GS.encodeForTabDelimited(strToPath),
                         function (data, error, errorData) {
        if (!error) {
            if (typeof callBack === 'function' && data !== 'TRANSACTION COMPLETED') {
                GS.removeLoader('delete-file');
                callBack();
            }
        } else {
            GS.removeLoader('delete-file');
            GS.webSocketErrorDialog(errorData);
        }
    });
}

function saveScriptAsFile(strFileName, forceSaveAs) {
	// We are inside electron here
	var fs = require('fs');
	var os = require('os');
	var path = require('path');
	var electron = require('electron').remote;
	var dialog = electron.dialog;

	var i = 0, j = 0;
    GS.requestFromSocket(GS.envSocket,
                         'TAB\tREAD\t' + GS.encodeForTabDelimited(strFileName), function (data, error, errorData) {
        if (!error) {
            if (i === 0) {
				var newLineIndex = data.indexOf('\n'), strContent = data.substring(newLineIndex + 1);
				GS.requestFromSocket(GS.envSocket,
			                         'TAB\tREAD\t' + GS.encodeForTabDelimited(strFileName + encodeTabNameForFileName('~')), function (data, error, errorData) {
					var strNewFileName = '';
		            if (j === 0) {
				        if (!error && !forceSaveAs) {
							var newLineIndex = data.indexOf('\n');
							strNewFileName = data.substring(newLineIndex + 1);
				        } else {
							strNewFileName = dialog.showSaveDialog({
								title: 'Save File',
								defaultPath: os.homedir() + '/Documents/' + path.basename(decodeFileNameForTabName(strFileName)),
								filters: [
									{
										name: 'Sql Files',
										extensions: ['sql']
									},
						    		{
										name: 'All Files',
										extensions: ['*']
									}
								],
								properties: ['openFile']
							});
						}
						console.log(strNewFileName, forceSaveAs);
						if (strNewFileName !== undefined) {
							function save() {
								GS.addLoader('saving', 'Saving...');
								fs.writeFile(strNewFileName, strContent, 'utf8', function (err) {
									GS.removeLoader('saving', 'Saving...');
									if (err) {
										var templateElement = document.createElement('template');
			                            templateElement.innerHTML = ml(function () {/*
			                                <gs-page>
			                                    <gs-header><center><h3>Saving failed!</h3></center></gs-header>
			                                    <gs-body padded>
			                                        <center>{{desc}}/center>
			                                    </gs-body>
			                                    <gs-footer>
			                                        <gs-button dialogclose bg-primary tabindex="0">Try Again</gs-button>
			                                    </gs-footer>
			                                </gs-page>
			                            */}).replace(/\{\{desc\}\}/, err.message);

			                            GS.openDialog(templateElement, function () {

										}, function (event, strAnswer) {
			                                save();
			                            });
									}
								});
							}
							save();
						}
					}
					j += 1;
			    });
			}
			i += 1;
        } else {
            GS.webSocketErrorDialog(errorData);
        }
    });
}

function saveScript(tabElement, bolLoader) {
    'use strict';
    if (bolLoader) {
        tabElement.removeLoader = true;
        GS.addLoader(tabElement.relatedFrame, 'Saving...');
    }

    if (tabElement.currentlySaving) {
        tabElement.saveWaiting = true;
    } else {
        tabElement.currentlySaving = true;
        tabElement.saveWaiting = false;
        tabElement.indicatorElement.textContent = 'Saving...';

        saveFile(tabElement, tabElement.filePath, tabElement.changeStamp, tabElement.relatedEditor.getValue(), function (changeStamp) {
            if (tabElement.removeLoader === true) {
                tabElement.removeLoader = null;
                GS.removeLoader(tabElement.relatedFrame);
            }
            tabElement.indicatorElement.textContent = '';

            tabElement.changeStamp = changeStamp;
            tabElement.currentlySaving = false;

            if (tabElement.saveWaiting) {
                saveScript(tabElement);
            }
        }, function (errorData) {
            if (tabElement.removeLoader === true) {
                tabElement.removeLoader = null;
                GS.removeLoader(tabElement.relatedFrame);
            }
            tabElement.indicatorElement.textContent = '';

            //console.log(errorData);

            GS.webSocketErrorDialog(errorData);
        });
    }
}

function saveFile(tabElement, strPath, changeStamp, strContent, callbackSuccess, callbackFail) {
    'use strict';

    // saveFile is called on datasheet, editor and table designer tabs.
    //      this warning popup code is now only used on an editor tab
    if (tabElement.relatedEditor) {
        var arrElements = xtag.queryChildren(tabElement.relatedEditor.container.parentNode, '.editor-warning');

        arrElements.forEach(function (element) {
            element.parentNode.removeChild(element);
        });
    }

    tabElement.saveState = 'saving';

    GS.requestFromSocket(GS.envSocket, 'TAB\tWRITE\t' + GS.encodeForTabDelimited(strPath) + '\t' +
                                            changeStamp + '\n' + strContent, function (data, error, errorData) {
        //console.log(data, error, errorData);

        if (!error) {
            tabElement.saveState = 'saved';
            if (data !== 'TRANSACTION COMPLETED') {
                callbackSuccess(data);
            }

        } else {
            // saveFile is called on datasheet, editor and table designer tabs.
            //      this warning popup code is now only used on an editor tab
            if (tabElement.relatedEditor) {
                var warningElement = document.createElement('div');

                warningElement.classList.add('editor-warning');
                warningElement.innerHTML = 'CHANGES ARE NOT SAVED<br />CLICK HERE TO TRY AGAIN';

                tabElement.relatedEditor.container.parentNode.appendChild(warningElement);

                warningElement.addEventListener('click', function () {
                    saveFile(tabElement, strPath, changeStamp, strContent, callbackSuccess, callbackFail);
                });
            }

            tabElement.saveState = 'error';

            if (callbackFail) {
                callbackFail(errorData);
            } else {
                GS.webSocketErrorDialog(errorData);
            }
        }
    });
}

function selectedTabButtonToFront() {
    'use strict';
    var tabBarElement = document.getElementById('tab-bar')
      , tabElement = xtag.query(tabBarElement, '.current-tab')[0];

    if (tabBarElement.firstElementChild !== tabElement) {
        tabBarElement.insertBefore(tabElement, tabBarElement.firstElementChild);
    }
}

function setFrame(tabElement, frameElement, bolBringToFirst) {
    'use strict';
    var tabBarElement = document.getElementById('tab-bar'), arrElements, i, len, bolScriptCode;

    // set a class for the tab bar so that the css can be specificly for tabs (and remove the class used by the home)
    document.getElementById('tab-bar-container').classList.add('tab-mode');
    document.getElementById('tab-bar-container').classList.remove('home-mode');

    // if the file is on the server: fill tab from server
    if (tabElement.bolLoadFromServer) {
        tabElement.bolLoadFromServer = false;

        GS.addLoader(tabElement.relatedContainer, 'Loading Tab...');
        GS.requestFromSocket(GS.envSocket, 'TAB\tREAD\t' + GS.encodeForTabDelimited(tabElement.filePath), function (data, error, errorData) {
            var strChangeStamp;

            if (!error) {
                if (data !== 'TRANSACTION COMPLETED') {
                    //GS.pushQueryString('current-tab=' + encodeURIComponent(tabElement.filePath));
                    //GS.pushQueryString('view=tab:' + encodeURIComponent(tabElement.filePath));
                    strChangeStamp = data.substring(0, data.indexOf('\n'));
                    data = data.substring(data.indexOf('\n') + 1);

                    if (tabElement.tabType === 'sql') {
                        //console.log(data, strChangeStamp);
                        fillTab(tabElement, {'strContent': data, 'strChangeStamp': strChangeStamp});
                        // focus ACE so that the user dosen't have to (and run the property list)
                        tabElement.relatedEditor.focus();
                        if (tabElement.bolAutoOpenPropertyList === true || tabElement.bolPropertyPanelOpen === true) {
                            tabElement.relatedEditor.selectionChangeHandler();
                        }

                    } else if (tabElement.tabType === 'design-table') {
                        fillTab(tabElement, {'oid': data});

                    } else if (tabElement.tabType === 'datasheet') {
                        fillTab(tabElement, {'queryString': data});
                    }
                } else {
                    GS.removeLoader(tabElement.relatedContainer);
                }
            } else {
                //// go to previous tab (or home if we're at the first tab)
                //if (tabElement.previousElementSibling) {
                //
                //} else {
                //openHome();
                setQSToHome();
                //}

                GS.removeLoader(tabElement.relatedContainer);
                GS.webSocketErrorDialog(errorData);
            }
        });
    } else {
        // we can't run some script related code at this moment, it's been moved to the end of the function
        bolScriptCode = true;

        //GS.pushQueryString('current-tab=' + encodeURIComponent(tabElement.filePath));
        //GS.pushQueryString('view=tab:' + encodeURIComponent(tabElement.filePath));
    }

    arrElements = xtag.query(tabBarElement, '.current-tab');

    if (arrElements[0]) {
        // save panel status to the tabElement
        arrElements[0].bolPropertyPanelOpen = bolPropertyPanelOpen;

        if (arrElements[0].relatedEditor && autocompleteGlobals.popupOpen) {
            autocompletePopupClose(arrElements[0].relatedEditor);
        }
    }

    // hide panel
    document.getElementById('panel').hide('right-bar');

    if (arrElements[0] && arrElements[0].relatedEditor && arrElements[0].relatedEditor.completer) {
        // this needs to cause the autocomplete window to close
        arrElements[0].relatedEditor.completer.detach();
    }

    for (i = 0, len = arrElements.length; i < len; i += 1) {
        arrElements[i].classList.remove('current-tab');
    }

    tabElement.classList.add('current-tab');

    if (bolBringToFirst) {
        if (tabBarElement.firstElementChild !== tabElement) {
            tabBarElement.insertBefore(tabElement, tabBarElement.firstElementChild);
        }
    }

    arrElements = xtag.query(document.getElementById('tab-frames'), '.current-frame');
    for (i = 0, len = arrElements.length; i < len; i += 1) {
        arrElements[i].classList.remove('current-frame');
    }

    frameElement.classList.add('current-frame');

    // if bolScriptCode has been set to true: focus ACE so that the user dosen't have to (and run the property list)
    if (bolScriptCode) {
        if (tabElement.tabType === 'sql') {
            tabElement.relatedEditor.focus();
            if (tabElement.bolAutoOpenPropertyList === true || tabElement.bolPropertyPanelOpen === true) {
                tabElement.relatedEditor.selectionChangeHandler();
            }
        }
    }
}

function clearPropertyList() {
    'use strict';
    document.getElementById('button-property-panel').setAttribute('hidden', '');
    document.getElementById('panel').hide('right-bar');
    document.getElementById('right-bar').innerHTML = '';
}

function rowAndColumnToIndex(strText, intRow, intColumn) {
    'use strict';
    var arrLines, intIndex, i, len;

    arrLines = strText.split('\n');
    intIndex = 0;

    // count previous full lines
    for (i = 0, len = intRow; i < len; i += 1) {
        if (arrLines[i] !== null && arrLines[i] !== undefined) {
            intIndex += arrLines[i].length + 1;
        }
        //console.log(intIndex, arrLines[i].length, arrLines[i]);
    }

    // add previous characters
    intIndex += intColumn;

    return intIndex;
}

function indexToRowAndColumn(strText, intIndex) {
    'use strict';
    var i, len, intRows, intColumns;

    for (i = 0, len = intIndex, intRows = 0, intColumns = 0; i < len; i += 1) {
        intColumns += 1;

        if (strText[i] === '\n') {
            intRows += 1;
            intColumns = 0;
        }
    }

    //console.log(intIndex, intRows, intColumns);

    return {'row': intRows, 'column': intColumns};
}

function indentScript() {
    'use strict';
    document.getElementsByClassName('current-tab')[0].relatedEditor.blockIndent();
    document.getElementsByClassName('current-tab')[0].relatedEditor.focus();
}

function outdentScript() {
    'use strict';
    document.getElementsByClassName('current-tab')[0].relatedEditor.blockOutdent();
    document.getElementsByClassName('current-tab')[0].relatedEditor.focus();
}

function toggleCommentScript() {
    'use strict';
    document.getElementsByClassName('current-tab')[0].relatedEditor.toggleCommentLines();
    document.getElementsByClassName('current-tab')[0].relatedEditor.focus();
}

function downloadScript() {
    'use strict';
    var currentTab = document.getElementsByClassName('current-tab')[0];


}
