var bolTabFunctionsLoaded = true, intTabNumber = 0, intNumberOfTabs = 0, bolStillInSetPosition, //arrTabOrder, tabListChangeStamp = '0',
    bolSetPositionFor, bolCurrentlyScriptTab = false, bolAutoOpenPropertyList = true, currTab = [];

function closeCurrentTab() {
	var deleteButton = xtag.query(document.body, '.current-tab')[0].innerDeleteButton;
	//console.log(deleteButton);
	GS.triggerEvent(deleteButton, 'click');
}



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

var tabBarMaxTabs = 100;

function renderTabBar() {
    'use strict';
    var tabBarContainer = document.getElementById('tab-bar-container');
    var tabBar = document.getElementById('tab-bar');
    var tabBarFiller = document.getElementById('tab-bar-filler');
    var tabBarStyleElement = document.getElementById('tab-bar-dynamic-style');
    var intWidthMaxTabBar;
    var intTabs;

    tabBar.parentNode.setAttribute('flex', '');
    tabBarStyleElement.innerHTML = '#tab-bar .tab-button { display: none !important; }';

    // detect available space for tab bar
    tabBarFiller.removeAttribute('flex');
    intWidthMaxTabBar = tabBar.clientWidth;
    tabBarFiller.setAttribute('flex', '');

    //
    intTabs = tabBar.children.length;

    //console.log(
    //    intTabs,
    //    intWidthMaxTabBar
    //);

    if (
        (intTabs * 140) > intWidthMaxTabBar
        // 140px is hard coded into the CSS
    ) {
        tabBarFiller.removeAttribute('flex');
        tabBarStyleElement.innerHTML = (
            '#tab-bar { width: ' + intWidthMaxTabBar + 'px !important; }' +
            '#tab-bar .tab-button { width: ' + (intWidthMaxTabBar / intTabs) + 'px !important; }'
        );
    } else {
        tabBar.parentNode.removeAttribute('flex');
        tabBarStyleElement.innerHTML = '';
        tabBarStyleElement.innerHTML = (
            '#tab-bar .tab-button { width: 140px !important; }'
        );
    }
}

function startTabContainer() {
    'use strict';
    document.getElementById('tab-container').innerHTML = ml(function () {/*
        <div id="tab-bar-container" flex-horizontal flex-fill>
            <div class="tab-bar-spacer">&nbsp;</div>
            <div class="tab-bar-toolbar left">
                <gs-button id="button-home" onclick="setQSToHome()" icononly icon="home" inline remove-all no-focus title="Back to home [ESC]"></gs-button>
            </div>
            <div class="tab-bar-spacer">&nbsp;</div>
            <div flex prevent-text-selection>
                <div id="tab-bar"></div>
            </div>
            <div class="tab-bar-spacer">&nbsp;</div>
            <div id="tab-bar-filler" flex prevent-text-selection>
                <gs-button flex id="button-new-tab" onclick="newTab('sql', '', {'strContent': '\n\n\n\n\n\n\n\n\n'})" icononly icon="plus" title="Create a blank script tab" inline no-focus></gs-button>
            </div>
            <div class="tab-bar-spacer">&nbsp;</div>
            <div class="tab-bar-toolbar right">
                <gs-button id="button-open-tabs" onclick="dialogOpenTabs(this);" icononly no-focus icon="list" inline title="All open tabs"></gs-button>
            </div>
            <div class="tab-bar-spacer">&nbsp;</div>
            <style id="tab-bar-dynamic-style" hidden></style>
        </div>
        <div id="tab-frames" flex>
            <div id="home-frame" class="home-frame"></div>
        </div>
    */});

    window.addEventListener('resize', function () {
        renderTabBar();
    });

    /*

    #########################################################################################
    ########################### NEW TAB CONTROL FORMAT 2017-08-05 ###########################
    #########################################################################################

    move to better tab control:
        new tab button is at the right edge of the tab buttons
        new tab button adds the tab to the right of all the current tab buttons
        tab buttons have a max width
        after there's too many tab buttons to display at max width, start compressing them
        there is no scrolling
        after an arbituary number of tab controls, stop allowing the developer to creating
            new ones
        the current tab should have a delete button
        if the tab buttons are wide enough, they should always be able to have a delete
            button, regardless of selection

        as a consequence, all tab buttons will always be the same width.

    because of the tab reorder code's architecture, there should be only a minor change
        there.

    the file renaming, how would I maintain that?
        it seems like we would not need to change much, we would comment out the dynamic
        sizing of the input and make it 100% width. if I keep the rest the same, than the
        only problems are the possibility of a small input and someone on a phone clicking
        just perfectly and focusing into an input they can't really see. To fix the phone,
        I could do a thing where if the user would have focused into the input, we open a
        "tab rename" dialog instead.

    due to bad architecture, the state of the tab bar is read by looking at the dom itself
        and changes are made right to the dom. this should have had a state variable and a
        render function.

    so, to take the upwind+minimalist approach until we can get a plan to incrementally
        change the tab bar into a state variable and a set of functions:
         x  1) we create a render function and call it at every state change
         x  2) we add a container element to the right of the tab bar
         x  3) we move the new tab button to the new container
         x  4) we add a pixel border element to the new container
         x  5) for now, make the render function only handle tab width
         x  6) we make sure the pixel border element fills the empty space if there is any
         x  7) we come up with a way to determine the max number of tabs
         x  8) we enforce the maximum number of tabs and make sure the user knows that there
                    are too many tabs
         x  9) whenever the user tries to create more tabs than allowed, popup a message
                    that tells them they can't open any more tabs.
         x 10) make it so that the right buttons never go off of the screen

    this sub-document was authored by Michael Tocci.

    #########################################################################################
    ########################### NEW TAB CONTROL FORMAT 2017-08-05 ###########################
    #########################################################################################

    */


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
    // document.addEventListener('keydown', function (event) {
    //     //console.log('0***');

    //     // if the key that was pressed is escape (27)
    //     if (event.keyCode === 27 && document.getElementsByTagName('gs-dialog').length === 0) {
    //         if (document.getElementById('tab-bar-container').classList.contains('home-mode') === true) {
    //             if (backToTab && backToTab.parentNode) {
    //                 GS.triggerEvent(backToTab, 'click');

    //             } else if (document.getElementById('tab-bar').children.length > 0) {
    //                 GS.triggerEvent(document.getElementById('tab-bar').children[0], 'click');
    //             }

    //         } else {
    //             if (document.getElementsByClassName('current-tab').length > 0) {
    //                 backToTab = document.getElementsByClassName('current-tab')[0];

    //             } else if (document.getElementById('tab-bar').children.length > 0) {
    //                 backToTab = document.getElementById('tab-bar').children[0];
    //             }

    //             //console.log('3***');
    //             GS.triggerEvent(document.getElementById('button-home'), 'click');
    //         }
    //     }
    // });

    // // bind [meta][.]
    // document.addEventListener('keydown', function (event) {
    //     var strQuery, strLink, intStart, intEnd, currentRange
    //       , currentTab = document.getElementsByClassName('current-tab')[0];

    //     // if shift is down and the key that was pressed is "." (190)
    //     if ((event.metaKey || event.ctrlKey) && event.keyCode === 190) {

    //         if (currentTab) {
    //             // cmd-.
    //             if ((event.which || event.keyCode) === 190 && event.metaKey) {
    //                 strQuery = currentTab.relatedEditor.getValue();
    //                 currentRange = currentTab.relatedEditor.currentQueryRange;

    //                 if (currentRange) {
    //                     intStart = rowAndColumnToIndex(strQuery, currentRange.start.row, currentRange.start.column);
    //                     intEnd = rowAndColumnToIndex(strQuery, currentRange.end.row, currentRange.end.column);
    //                     strQuery = strQuery.substring(intStart, intEnd);

    //                     if (strQuery) {
    //                         strLink = docButtonForQuery(strQuery);

    //                         if (strLink) {
    //                             window.open(strLink, '_blank');
    //                         }
    //                     }
    //                 }

    //                 if (!currentRange || !strQuery || !strLink) {
    //                     GS.pushMessage('<center><h4>No Documentation Found</h4></center>', 700);
    //                 }
    //             }
    //         }


    //         //// if there is a current tab and the tab has a property button
    //         //if (currentTab && currentTab.relatedPropertyButton) {
    //         //    // if a property dialog is not open: trigger a click on the property button
    //         //    if (!document.getElementById('dialog-from-dialog-property-window') &&
    //         //        !currentTab.relatedPropertyButton.hasAttribute('disabled')) {
    //         //        GS.triggerEvent(currentTab.relatedPropertyButton, 'click');
    //         //
    //         //    // else if a property dialog is open: tell the dialog to apply it's changes and close
    //         //    } else {
    //         //        closePropertyDialog();
    //         //    }
    //         //}
    //     }
    // });



}

function ShortcutHome () {
    var backToTab;
    if (document.getElementsByTagName('gs-dialog').length === 0) {
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
}

function ShortcutDocs () {
    var strQuery, strLink, intStart, intEnd, currentRange
      , currentTab = document.getElementsByClassName('current-tab')[0];
    if (currentTab) {
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


function loadTabsFromServer(bolChooseFirst, callback) {
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

                if (fileExtension !== 'sql' && fileExtension !== 'design-table' && fileExtension !== 'datasheet' && fileExtension !== 'processes') {
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
            refreshButtons(localStorage.labeledButtons);

            //strCurrentTab

            // if bolChooseFirst is true: set the frame to the first tab
            if (bolChooseFirst) {
                tabElement = xtag.queryChildren(document.getElementById('tab-bar'), '.tab-button')[0];
                GS.pushQueryString('view=tab:' + encodeURIComponent(tabElement.filePath));
                //setFrame(tabElement, tabElement.relatedFrame);
            }

            if (callback) {
                callback();
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
        var     filePath = arrFilePath[0]
            ,    fileName = path.basename(filePath);
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
                <form id="form-upload-script" action="/pgmanage/*/}) + contextData.connectionID + '/' + ml(function () {/*upload" method="POST" target="upload_response_1"
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
                currentButton.classList.add('pgmanage-menu-item-button');

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
              , arrElements, strFullPath;

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
                        strFullPath = arrFiles[i];
                        arrFiles[i] = {
                            strFullPath: strFullPath,
                            strDate: strDate,
                            date: new Date(strDate + ' ' + strTime),
                            strTime: strTime,
                            strFileName: strFileName,
                            strFileExtension: strFileExtension
                        };
                    }

                    arrFiles.sort(function (a, b) {
                        return b.date.getTime() - a.date.getTime();
                    });

                    for (i = 0, len = arrFiles.length, strHTML = ''; i < len; i += 1) {
                        console.log(arrFiles[i].strDate, arrFiles[i].strTime, arrFiles[i].date, arrFiles[i].date.getTime());
                        strDate = arrFiles[i].strDate;
                        strTime = arrFiles[i].strTime;
                        strFileName = arrFiles[i].strFileName;
                        strFileExtension = arrFiles[i].strFileExtension;
                        strFullPath = arrFiles[i].strFullPath;

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
                                        'data-path="' + encodeURIComponent(strFullPath) + '" ' +
                                        'data-original-name="' + encodeURIComponent(strFileName) + '" ' +
                                        'data-type="' + strFileExtension + '" dialogclose>Open</gs-button>' +
                                '</td>' +
                                '<td>' +
                                    ' <gs-button title="Download this script as a .sql file"' +
                                        ' href="/pgmanage/' + contextData.connectionID +
                                                    '/download/' + encodeTabNameForFileName(GS.trim(strPath + '/' + strFullPath, '/')) + '"' +
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
                            var strType = this.getAttribute('data-type'), strName = decodeURIComponent(this.getAttribute('data-original-name'));

                            GS.requestFromSocket(GS.envSocket,
                                                 'TAB\tREAD\t' +
                                                 GS.encodeForTabDelimited(
                                                     strPath + '/' + encodeTabNameForFileName(decodeURIComponent(this.getAttribute('data-path')))
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
                '<iframe class="full-iframe" src="frames/frame-table.html?oid=' + jsnParameters.oid + '&versionNum=' + contextData.minorVersionNumber + '"></iframe>';

    } else if (tabElement.tabType === 'datasheet') {
        tabElement.relatedFrame.innerHTML =
                '<iframe class="full-iframe" src="frames/frame-datasheet.html?' + jsnParameters.queryString + '"></iframe>';
    } else if (tabElement.tabType === 'processes') {
        tabElement.relatedFrame.innerHTML =
                '<iframe class="full-iframe" src="frames/frame-processes.html"></iframe>';
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

function ShortcutNewTab () {
    event.preventDefault();
    event.stopPropagation();
    newTab('sql', '', {'strContent': '\n\n\n\n\n\n\n\n\n'});
}


var afterDeleteSelectionDirections = [], intSaveTimerID;
function newTab(strType, strTabName, jsnParameters, bolLoadedFromServer, strFilePath, bolAutoSelect) {
    'use strict';
    currentTab = document.getElementsByClassName('current-tab')[0];

    var tabElement, frameElement, editor, selectionChangeHandler
      , arrCurrentTabNames, i, len, arrElements
      , FFiveFunction, FFiveUpFunction, windowResizeHandler;
    strType = strType || 'sql';
    jsnParameters = jsnParameters || {};

    // get the current list of tab names
    arrCurrentTabNames = [];
    arrElements = xtag.query(document.getElementById('tab-bar'), '.tab-button');

    if (!bolLoadedFromServer && (arrElements.length + 1) > tabBarMaxTabs) {
        GS.pushMessage('<center>Too Many Tabs Open</center>', 1000);
        return;
    }

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
    tabElement.innerHTML = (
        '<input class="rename-control" type="text" tabindex="-1" ' +
                'value="' + encodeHTML(strTabName) + '" />' +
        '<div class="delete-button" title="Close this tab"></div>'
    );

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
        tabElement.innerRenameControl.style.width = GS.getTextWidth(tabElement, tabElement.innerRenameControl.value, true) + 'px';
    });
    window.addEventListener('resize', function () {
        tabElement.innerRenameControl.style.width = GS.getTextWidth(tabElement, tabElement.innerRenameControl.value, true) + 'px';
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

    tabElement.setAttribute('title', tabElement.innerRenameControl.value);
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
                        tabElement.setAttribute('title', tabElement.innerRenameControl.value);

                        // update href of download script button (we want to use an anchor for that button because it's native)
                        if (window.process && window.process.type === 'renderer') {
                            tabElement.relatedDownloadButton.setAttribute('data-filename', tabElement.filePath);
                            tabElement.relatedDownloadButton2.setAttribute('data-filename', tabElement.filePath);
                        } else {
                            tabElement.relatedDownloadButton.setAttribute(
                                'href',
                                '/pgmanage/' + contextData.connectionID + '/download/' + GS.trim(tabElement.filePath, '/')
                            );
                        }

                    }

                } else {
                    GS.webSocketErrorDialog(errorData);
                }
            });
	            GS.requestFromSocket(GS.envSocket,
	                                'TAB\tMOVE\t' + GS.encodeForTabDelimited(tabElement.filePath + encodeTabNameForFileName('~')) + '\t' +
	                                    GS.encodeForTabDelimited(strPath + strNewName + encodeTabNameForFileName('~')),
	                                function (data, error, errorData) {
					// This is supoposed to fail if the current file isn't a file-system file
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
                renderTabBar();
            });

        } else {
            closeFile(tabElement, function () {
                document.getElementById('tab-bar').removeChild(tabElement);
                document.getElementById('tab-frames').removeChild(frameElement);
                //openHome();
                setQSToHome();
                renderTabBar();
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
        if (!event.target.classList.contains('rename-control') && !event.target.classList.contains('delete-button')) {
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

    //// add new tab to the very left
    //if (document.getElementById('tab-bar').children.length === 0) {
    document.getElementById('tab-bar').appendChild(tabElement);

    //} else {
    //    document.getElementById('tab-bar').insertBefore(tabElement, document.getElementById('tab-bar').children[0]);
    //}

    document.getElementById('tab-frames').appendChild(frameElement);

    // adjust tab rename control width
    //tabElement.innerRenameControl.style.width = GS.getTextWidth(tabElement, tabElement.innerRenameControl.value, true) + 'px';

    // fill frame
    if (strType === 'sql') {
		var ExplainAnalyze = localStorage.ShortcutExplainAnalyze.split(',')[1];
		if (localStorage.ShortcutExplainAnalyze.split(',')[0]) {
			ExplainAnalyze = localStorage.ShortcutExplainAnalyze.split(',')[0] + '-' + ExplainAnalyze;
		}
		var Explain = localStorage.ShortcutExplain.split(',')[1];
		if (localStorage.ShortcutExplain.split(',')[0]) {
			Explain = localStorage.ShortcutExplain.split(',')[0] + '-' + Explain;
		}
        frameElement.innerHTML =
            ml(function () {/*
                    <div id="script-window-container-{{TABNUMBER}}" class="script-window-container" flex-vertical flex-fill>
                        <div class="ace-toolbar ace-toolbar-{{ELECTRON}} ace-toolbar-{{LABELED}}" style="background-color: #cccccc; width: 100%; padding-top: 1px; padding-bottom: 2px;" id="sql-ace-toolbar-{{TABNUMBER}}">
                            <gs-button icononly inline remove-all icon="external-link" onclick="openInNewWindow()"
                                    title="Open this tab in a new window" remove-all no-focus><label>New Window</label></gs-button>
                            <gs-button icononly inline remove-all icon="play" onclick="executeScript(); document.getElementsByClassName('current-tab')[0].relatedEditor.focus();"
                                    title="Execute Script [F5]" remove-bottom no-focus><label>Run</label></gs-button>

                            <gs-checkbox inline style="border-radius: 0; padding: 4px; top: 1.5px; padding-top: 5px;" value="true" id="checkbox-autocommit-{{TABNUMBER}}" title="Autocommit"><label>Autocommit</label></gs-checkbox>
                            <gs-button inline remove-all id="button-commit-{{TABNUMBER}}" onclick="commitTran()"  icon="check" icononly
                                    title="Commit the current transaction" remove-all no-focus disabled><label>Commit</label></gs-button>
                            <gs-button inline remove-all id="button-rollback-{{TABNUMBER}}" onclick="rollbackTran()" icon="times" icononly
                                    title="Rollback the current transaction" remove-all no-focus disabled><label>Rollback</label></gs-button>

                            <gs-button inline remove-all class="button-toggle-comments" onclick="toggleCommentScript()"
                                    title="Comment/uncomment the selected text [CMD][/] or [CTRL][/]" remove-all no-focus><span>--</span><label> Comment</label></gs-button>

                            <gs-button icononly inline remove-all icon="indent" onclick="indentScript()"
                                    title="Indent the selected text [TAB]" remove-all no-focus><label>Indent</label></gs-button>
                            <gs-button icononly inline remove-all icon="outdent" onclick="outdentScript()"
                                    title="Dedent the selected text [SHIFT][TAB]" remove-all no-focus><label>Dedent</label></gs-button>

                            <gs-button inline icononly remove-all class="button-save ace-toolbar-labeled-only ace-toolbar-electron-only" style="padding: 4px;" onclick="menuSave(event.target, '{{FILE}}', '{{TABNUMBER}}');" title="Save menu." no-focus iconleft icon="angle-down"><label> Save</label></gs-button>

                            <gs-button icononly inline remove-all id="button-tab-{{TABNUMBER}}-save" icon="save" data-filename="{{FILE}}" class="ace-toolbar-unlabeled-only ace-toolbar-electron-only "
                                    title="Save" remove-all no-focus><label>Save</label></gs-button>
                            <gs-button inline remove-all id="button-tab-{{TABNUMBER}}-save-as" class="ace-toolbar-unlabeled-only button-save-as ace-toolbar-electron-only" data-filename="{{FILE}}"
                                    title="Save As..." remove-all no-focus>
                                <span class="save-as-floppy" icon="pencil">&#xf0c7;</span><label> Save As</label></gs-button>

                            <gs-button icononly inline remove-all id="button-tab-{{TABNUMBER}}-download" class="ace-toolbar-browser-only" icon="download"
                                    href="/pgmanage/{{CONNNUM}}/download/{{TRIMMEDFILE}}" onclick="downloadScript()"
                                    title="Download as a file" remove-all no-focus><label>Download</label></gs-button>

                            <gs-button inline remove-all class="button-explain ace-toolbar-labeled-only" style="padding: 2px; padding-bottom: 0.75px;" onclick="menuExplain(event.target)"
                                    title="Explain menu." no-focus><span class="explain-letter" icon="chevron-down">E</span><label> Explain</label></gs-button>

                            <gs-button inline remove-all class="button-explain ace-toolbar-unlabeled-only" style="padding-bottom: 0px; padding-right: 0;" onclick="explain(false)"
                                    title="Query explanation. This does not run the query. {{EXPLAIN}}" remove-all no-focus><span class="explain-letter" icon="play-circle-o">E</span></gs-button>
                            <gs-button icononly inline remove-all class="button-explain ace-toolbar-unlabeled-only" style="padding-bottom: 0px; padding-right: 0;" onclick="explain(true)"
                                    title="Query explanation. Note that the query will run, meaning that you'll get run times. {{ANALYZE}}" remove-top no-focus>
                                <span class="explain-letter" icon="play">E</span></gs-button>

                            <gs-button icononly inline remove-all class="button-csv" icon="file-text" onclick="exportCSV()"
                                    title="Download a single query's results as a file" remove-all no-focus><label>Export</label></gs-button>
                            <gs-button inline remove-all class="button-ace-info" icon-left icon="question-circle" onclick="dialogAceInfo()"
                                    title="Information and tips about pgManage" remove-all no-focus>
								<span class="ace-toolbar-labeled-only ace-help-text">Help</span>
                            </gs-button>
                            <gs-button icononly inline remove-all icon="black-tie" onclick="beautifySQL()" title="Beautify the Current SQL" no-focus><label>Beautify</label></gs-button>
                            <gs-button icononly hidden id="sql-property-{{TABNUMBER}}-button" icononly
                                    icon="wrench" onclick="propertyWindowDialog()" disabled
                                    title="Edit the current query\'s properties [CMD][.] or [CTRL][.]" remove-top no-focus></gs-button>
                        </div>
                        <div id="ace-container-position-container-{{TABNUMBER}}" class="ace-container-position-container" flex>
                            <div class="ace-container">
                                <div id="frame-{{TABNUMBER}}-indicator" class="frame-indicator"></div>
                                <div id="sql-ace-area-{{TABNUMBER}}" class="ace-area"></div>
                            </div>
                        </div>
                        <div id="sql-doc-links-{{TABNUMBER}}" style="text-align: center; height: 0;">
                            <div style="display: inline-block;"></div>
                            <div style="display: inline-block;"></div>
                        </div>
                        <div class="sql-results-area-container"
                                id="sql-results-area-{{TABNUMBER}}-container"
                                style="height: 17em;" flex-vertical flex-fill>
                            <gs-page>
                                <gs-header id="sql-results-header-{{TABNUMBER}}" class="results-header" flex-horizontal flex-fill>
                                    <b flex  id="sql-results-area-resize-handle-{{TABNUMBER}}"
                                             class="sql-results-area-resize-handle" icononly
                                             title="Drag to resize this window" icon="arrows-v"
                                             style="line-height: 2.422em; padding-left: 0.5em;">
                                        <span id="sql-results-title-{{TABNUMBER}}">Results</span>
                                        <span id="sql-results-tally-{{TABNUMBER}}"></span>
                                    </b>
                                    <gs-button id="sql-results-stop-{{TABNUMBER}}" hidden no-focus
                                               class="header-button-text" icon="stop" no-focus>Stop Execution</gs-button>
                                    <gs-button id="sql-results-StopSocket-{{TABNUMBER}}" hidden no-focus
                                               class="header-button-text" no-focus>Stop Loading</gs-button>
                                    <gs-button id="sql-results-stop-loading-{{TABNUMBER}}" hidden no-focus
                                               class="header-button-text" icon="hand-stop-o" no-focus>Stop Loading</gs-button>
                                    <gs-button id="sql-results-copy-options-{{TABNUMBER}}" hidden no-focus
                                               class="header-button-text" icon="clipboard" no-focus>Clip Options</gs-button>
                                    <gs-button id="sql-results-clear-{{TABNUMBER}}" no-focus
                                               class="header-button-text" icon="trash-o" no-focus>Clear</gs-button>
                                </gs-header>
                                <gs-body id="sql-results-area-{{TABNUMBER}}" class="sql-results-area"></gs-body>
                            </gs-page>
                        </div>
                    </div>
                </div>
            */})
            .replace(/\{\{TABNUMBER\}\}/g, intTabNumber)
            .replace(/\{\{LABELED\}\}/g, localStorage.labeledButtons === 'false' ? 'unlabeled' : 'labeled')
            .replace(/\{\{ELECTRON\}\}/g, window.process && window.process.type === 'renderer' ? 'electron' : 'browser')
            .replace(/\{\{FILE\}\}/g, tabElement.filePath)
            .replace(/\{\{TRIMMEDFILE\}\}/g, GS.trim(tabElement.filePath, '/'))
            .replace(/\{\{CONNNUM\}\}/g, contextData.connectionID)
            .replace(/\{\{EXPLAIN\}\}/g, Explain)
            .replace(/\{\{ANALYZE\}\}/g, ExplainAnalyze);

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
        tabElement.relatedAcePositionContainer = document.getElementById('ace-container-position-container-' + intTabNumber);
        tabElement.relatedDocLinksContainer = document.getElementById('sql-doc-links-' + intTabNumber);
        tabElement.bolAutoOpenPropertyList = true;
        tabElement.relatedResultsArea.addEventListener('click', function () {
			if (tabElement.relatedResultsArea.children.length === 0) {
			    //console.log(tabElement.relatedResultsArea);
				document.getElementsByClassName('current-tab')[0].relatedEditor.focus()
			}
		});

        tabElement.relatedStopButton = document.getElementById('sql-results-stop-' + intTabNumber);
        tabElement.relatedClearButton = document.getElementById('sql-results-clear-' + intTabNumber);
        tabElement.relatedStopSocketButton = document.getElementById('sql-results-StopSocket-' + intTabNumber);
        tabElement.relatedCopyOptionsButton = document.getElementById('sql-results-copy-options-' + intTabNumber);
        tabElement.relatedStopLoadingButton = document.getElementById('sql-results-stop-loading-' + intTabNumber);
        tabElement.relatedAutocommitCheckbox = document.getElementById('checkbox-autocommit-' + intTabNumber);
        tabElement.relatedCommitButton = document.getElementById('button-commit-' + intTabNumber);
        tabElement.relatedRollbackButton = document.getElementById('button-rollback-' + intTabNumber);

        if (window.process && window.process.type === 'renderer') {
            tabElement.relatedDownloadButton = document.getElementById('button-tab-' + intTabNumber + '-save');
            tabElement.relatedDownloadButton2 = document.getElementById('button-tab-' + intTabNumber + '-save-as');

            tabElement.relatedDownloadButton.addEventListener('click', function (event) {
                //console.log(event, event.which);
                var strFileName = this.getAttribute('data-filename');
                saveScriptAsFile(strFileName);
            });

            tabElement.relatedDownloadButton2.addEventListener('click', function (event) {
                //console.log(event, event.which);
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
                        <center>You need to re-copy your data after clicking <b>"Save"</b>.</center>
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

        if (evt.touchDevice) {
            //console.log(tabElement.relatedAcePositionContainer);
            tabElement.relatedAcePositionContainer.style.height = '1px';
            //if (tabElement.relatedAcePositionContainer.offsetHeight < 3) {
            //    tabElement.relatedAcePositionContainer.style.height = '';
            //}
        }

        tabElement.intTabNumber = intTabNumber;

        // bind sql results resizing
        tabElement.relatedResizeHandle.addEventListener(evt.mousedown, function (event) {
            var resizeTarget = tabElement.relatedResultsAreaContainer
              , intOffset = (resizeTarget.clientHeight - GS.mousePosition(event).bottom)
              , intMin = this.parentNode.offsetHeight, intMax = tabElement.relatedContainer.offsetHeight
              , mousemoveHandler, mouseupHandler, resizeHandler;

            resizeHandler = function (event) {
                var intHeight = (GS.mousePosition(event).bottom + intOffset);

                //console.log('step 1:', intHeight, intMin, intMax);

                if (intHeight < intMin) { intHeight = intMin; }
                if (intHeight > intMax) { intHeight = intMax; }

                //console.log('step 2:', intHeight, intMin, intMax);

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

                if (currentTab.relatedResultsArea.children.length > 1) {
                    var heightElem;
                    var spaceHeight;

                    spaceHeight = (
                        currentTab
                            .relatedResultsArea
                            .children[currentTab.relatedResultsArea.children.length - 2]
                            .clientHeight
                    );
                    spaceHeight = (
                        currentTab
                            .relatedResultsArea
                            .clientHeight - spaceHeight
                    );
                    if (spaceHeight < 0) {
                        spaceHeight = 0;
                    }

                    heightElem = currentTab.relatedResultsArea.lastChild;
                    heightElem.style.height = spaceHeight + 'px';

                    currentTab.relatedResultsArea.appendChild(heightElem);
                }

                var gs_table = xtag.query(tabElement.relatedResultsAreaContainer, 'gs-table');
                var i = 0;
                var len = gs_table.length;
                while (i < len) {
                    gs_table[i].render();
                    i += 1;
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

        // // bind to F5
        // FFiveFunction = function (event) {
        //     if (tabElement.parentNode) {
        //         if (tabElement.classList.contains('current-tab') &&
        //             (event.keyCode || event.which) === 116 &&
        //             tabElement.executedWaitingForKeyup !== true) {

        //             tabElement.executedWaitingForKeyup = true;
        //             executeScript();
        //             event.preventDefault();
        //             event.stopPropagation();
        //         }
        //     } else {
        //         window.removeEventListener('keydown', FFiveFunction);
        //         window.removeEventListener('keyup', FFiveUpFunction);
        //     }
        // };

        // FFiveUpFunction = function (event) {
        //     if (tabElement.parentNode) {
        //         if (tabElement.classList.contains('current-tab') && (event.keyCode || event.which) === 116) {
        //             tabElement.executedWaitingForKeyup = false;
        //             event.preventDefault();
        //             event.stopPropagation();
        //         }
        //     } else {
        //         window.removeEventListener('keydown', FFiveFunction);
        //         window.removeEventListener('keyup', FFiveUpFunction);
        //     }
        // };

        // // bind F5 to run executeScript, if we're on a script tab
        // window.addEventListener('keydown', FFiveFunction);
        // window.addEventListener('keyup', FFiveUpFunction);

        editor.setTheme(localStorage.aceTheme ? localStorage.aceTheme : 'ace/theme/eclipse');
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
                clearTimeout(intSaveTimerID);
                intSaveTimerID = setTimeout(function () {
                    saveScript(tabElement);

                    intSaveTimerID = null;
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
    } else if (strType === 'processes') {
        fillTab(tabElement, jsnParameters);

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

    refreshButtons(localStorage.labeledButtons);
    renderTabBar();

    return tabElement;
}

function ShortcutSave () {
    var tabElement = xtag.queryChildren(document.getElementById('tab-bar'), '.current-tab')[0];
    if (tabElement.parentNode && tabElement.classList.contains('current-tab')) {
        event.preventDefault();
        event.stopPropagation();
        clearTimeout(intSaveTimerID);
        intSaveTimerID = null;
        saveScript(tabElement, true);

		if (window.process && window.process.type === 'renderer') {
			saveScriptAsFile(tabElement.filePath, false);
		}
    }
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

    //console.log('tabElement.relatedSocket', tabElement.relatedSocket);
    if (tabElement.relatedSocket) {
        GS.closeSocket(GS.websockets[tabElement.relatedSocket]);
    }
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

    var i = 0, j = 0, k = 0;
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
			                GS.requestFromSocket(GS.envSocket,
			                                     'TAB\tWRITE\t' + GS.encodeForTabDelimited(strFileName + encodeTabNameForFileName('~')) + '\t0\n' + strNewFileName, function (data, error, errorData) {
								if (error) {
									GS.webSocketErrorDialog(errorData);
								}
							});
                        }
                        //console.log(strNewFileName, forceSaveAs);
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
    console.log('saveFile');

    // saveFile is called on datasheet, editor and table designer tabs.
    //      this warning popup code is now only used on an editor tab
    if (tabElement.relatedEditor) {
        var arrElements = xtag.queryChildren(tabElement.relatedEditor.container.parentNode, '.editor-warning');

        arrElements.forEach(function (element) {
            element.parentNode.removeChild(element);
        });
    }

    tabElement.saveState = 'saving';
    if (tabElement.saveTimeout) {
        clearTimeout(tabElement.saveTimeout);
    }
    tabElement.saveTimeout = setTimeout(function () {
        if (tabElement.saveState !== 'saved') {
            tabElement.saveState = 'error';
            if (tabElement.relatedEditor) {
                console.log('setting readonly');
                tabElement.relatedEditor.setReadOnly(true);
                var warningElement = document.createElement('div');
    
                warningElement.classList.add('editor-warning');
                warningElement.innerHTML = 'CHANGES ARE NOT SAVED<br />CLICK HERE TO TRY AGAIN';
    
                tabElement.relatedEditor.container.parentNode.appendChild(warningElement);
    
                warningElement.addEventListener('click', function () {
                    saveFile(tabElement, strPath, changeStamp, strContent, callbackSuccess, callbackFail);
                });
            }
        }
    }, 30 * 1000);

    console.log(GS.envSocket);
    if (GS.envSocket.readyState === WebSocket.CLOSED) {
        if (tabElement.saveTimeout) {
            clearTimeout(tabElement.saveTimeout);
        }
        tabElement.saveState = 'error';
        if (tabElement.relatedEditor) {
            console.log('setting readonly');
            tabElement.relatedEditor.setReadOnly(true);
            var warningElement = document.createElement('div');

            warningElement.classList.add('editor-warning');
            warningElement.innerHTML = 'CHANGES ARE NOT SAVED<br />CONNECTION TO SERVER LOST';

            tabElement.relatedEditor.container.parentNode.appendChild(warningElement);

            warningElement.addEventListener('click', function () {
                saveFile(tabElement, strPath, changeStamp, strContent, callbackSuccess, callbackFail);
            });
        }
    } else {
        GS.requestFromSocket(GS.envSocket, 'TAB\tWRITE\t' + GS.encodeForTabDelimited(strPath) + '\t' +
                                                changeStamp + '\n' + strContent, function (data, error, errorData) {
            //console.log(data, error, errorData);

            if (!error) {
                if (tabElement.saveTimeout) {
                    clearTimeout(tabElement.saveTimeout);
                }
                if (data !== 'TRANSACTION COMPLETED') {
                    callbackSuccess(data);
                }
                tabElement.saveState = 'saved';
                if (tabElement.relatedEditor) {
                    console.log('unsetting readonly');
                    tabElement.relatedEditor.setReadOnly(false);
                }

            } else {
                if (tabElement.saveTimeout) {
                    clearTimeout(tabElement.saveTimeout);
                }
                // saveFile is called on datasheet, editor and table designer tabs.
                //      this warning popup code is now only used on an editor tab
                if (tabElement.relatedEditor) {
                    console.log('setting readonly');
                    tabElement.relatedEditor.setReadOnly(true);
                    var warningElement = document.createElement('div');

                    warningElement.classList.add('editor-warning');
                    warningElement.innerHTML = 'CHANGES ARE NOT SAVED<br />CLICK HERE TO TRY AGAIN';

                    tabElement.relatedEditor.container.parentNode.appendChild(warningElement);

                    warningElement.addEventListener('click', function () {
                        saveFile(tabElement, strPath, changeStamp, strContent, callbackSuccess, callbackFail);
                    });
                }

                if (callbackFail) {
                    callbackFail(errorData);
                } else {
                    GS.webSocketErrorDialog(errorData);
                }

                tabElement.saveState = 'error';
            }
        });
    }
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

	if (!tabElement.relatedSocket && tabElement.tabType === 'sql') {
		tabElement.relatedSocket = 'tabsocket' + GS.encodeForTabDelimited(tabElement.filePath);
		GS.openSocket('env', null, null, tabElement.relatedSocket);
	}

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
            closePopup(arrElements[0].relatedEditor);
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
    currentTab = document.getElementsByClassName('current-tab')[0];

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

    // This is for when you switch away from a tab while a query is running
    if (tabElement.bolReRenderTables) {
        var arrElement = tabElement.relatedResultsArea.querySelectorAll('gs-table');
        for (var i = 0, len = arrElement.length; i < len; i += 1) {
            for (var j = 0, len2 = arrElement[i].internalDisplay.columnWidths.length; j < len2; j += 1) {
                arrElement[i].internalDisplay.columnWidths[j] = 100;
            }
            arrElement[i].renderLocationFull();
            arrElement[i].renderHUD();
            arrElement[i].resizeAllColumns();
            console.log(arrElement[i].clientHeight, arrElement[i].clientWidth);
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

function beautifySQL() {
    'use strict';
    var editor = document.getElementsByClassName('current-tab')[0].relatedEditor;
    var jsnCurrentQuery = getCurrentQuery();
    //console.log(jsnCurrentQuery);
    if (jsnCurrentQuery.strQuery === editor.getValue()) {
        editor.setValue('\n' + jsnCurrentQuery.strQuery + '\n'.repeat(10));
    }

    var strFormattedSQL = SQLBeautify(jsnCurrentQuery.strQuery);

    if (jsnCurrentQuery.strQuery === editor.getValue()) {
        editor.setValue('\n' + strFormattedSQL + '\n'.repeat(10));
    } else {
        editor.insert(strFormattedSQL);
    }
}

function menuExplain(target) {
    'use strict';
    var templateElement = document.createElement('template');
	var ExplainAnalyze = localStorage.ShortcutExplainAnalyze.split(',')[1];
	if (localStorage.ShortcutExplainAnalyze.split(',')[0]) {
		ExplainAnalyze = localStorage.ShortcutExplainAnalyze.split(',')[0] + '-' + ExplainAnalyze;
	}
	var Explain = localStorage.ShortcutExplain.split(',')[1];
	if (localStorage.ShortcutExplain.split(',')[0]) {
		Explain = localStorage.ShortcutExplain.split(',')[0] + '-' + Explain;
	}
	var popupWidth = 11;
	if (Explain.length > ExplainAnalyze.length) {
		popupWidth = parseInt(popupWidth, 10) + parseInt(Explain.length * 0.7,10);
	} else {
		popupWidth = parseInt(popupWidth, 10) + parseInt(ExplainAnalyze.length * 0.7,10);
	}
    templateElement.setAttribute('data-max-width', popupWidth + 'em');
    templateElement.setAttribute('data-overlay-close', 'true');
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-body class="ace-toolbar">
                <gs-button style="width: 100%;" dialogclose no-focus class="button-explain" style="padding-bottom: 0px;" onclick="explain(false)" title="Query explanation. This does not run the query. {{EXPLAIN}}" remove-all no-focus>
                    <span class="explain-letter" icon="play-circle-o">E</span>
                    Explain<span style="float: right; padding-top: 1.2em; font-size: 0.7em; color: grey;">{{EXPLAIN}}</span>
                </gs-button>
                <gs-button style="width: 100%;" dialogclose no-focus class="button-explain" style="padding-bottom: 0px;" onclick="explain(true)" title="Query explanation. Note that the query will run, meaning that you'll get run times. {{ANALYZE}}" remove-top no-focus>
                    <span class="explain-letter" icon="play">E</span>
                    Explain Analyze<span style="float: right; padding-top: 1.2em; font-size: 0.7em; color: grey;">{{ANALYZE}}</span>
                </gs-button>
            </gs-body>
        </gs-page>
    */}).replace(/\{\{EXPLAIN\}\}/g, Explain).replace(/\{\{ANALYZE\}\}/g, ExplainAnalyze);

    GS.openDialogToElement(target, templateElement, 'down');
}

function menuSave(target, filename, inttabnumber) {
    'use strict';
    var templateElement = document.createElement('template');
    templateElement.setAttribute('data-max-width', '9em');
    templateElement.setAttribute('data-overlay-close', 'true');
    templateElement.innerHTML = ml(function () {/*
        <gs-page>
            <gs-body class="ace-toolbar-labeled ace-toolbar">
<gs-button dialogclose icononly inline remove-all id="button-tab-{{TABNUMBER}}-save-labeled" icon="save" data-filename="{{FILE}}" class="ace-toolbar-labeled-only" style="width: 100%; height: 2.35em;"
                    title="Save" remove-all no-focus><label style="position: relative; top: .2em">Save</label></gs-button>
<gs-button dialogclose inline remove-all id="button-tab-{{TABNUMBER}}-save-as-labeled" class="ace-toolbarnlabeled-only button-save-as" data-filename="{{FILE}}" style="width: 100%; height: 2.35em;"
                        title="Save As..." remove-all no-focus>
                    <span class="save-as-floppy" icon="pencil">&#xf0c7;</span><label> Save As</label></gs-button>
            </gs-body>
        </gs-page>
    */}).replace(/\{\{TABNUMBER\}\}/g, inttabnumber).replace(/\{\{FILE\}\}/g, filename);




    GS.openDialogToElement(target, templateElement, 'down');

	document.getElementById('button-tab-' + inttabnumber + '-save-labeled').addEventListener('click', function (event) {
	    //console.log(event, event.which);
	    var strFileName = this.getAttribute('data-filename');
	    saveScriptAsFile(strFileName);
	});

	document.getElementById('button-tab-' + inttabnumber + '-save-as-labeled').addEventListener('click', function (event) {
	    //console.log(event, event.which);
	    var strFileName = this.getAttribute('data-filename');
	    saveScriptAsFile(strFileName, true);
	});
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

function commitTran() {
	'use strict';
	var currentTab = document.getElementsByClassName('current-tab')[0];
	GS.requestCommit(GS.websockets[currentTab.relatedSocket], 'NULL', function () {
		currentTab.relatedCommitButton.setAttribute('disabled', '');
		currentTab.relatedRollbackButton.setAttribute('disabled', '');
	});
}

function rollbackTran() {
	'use strict';
	var currentTab = document.getElementsByClassName('current-tab')[0];
	GS.requestRollback(GS.websockets[currentTab.relatedSocket], 'NULL', function () {
		currentTab.relatedCommitButton.setAttribute('disabled', '');
		currentTab.relatedRollbackButton.setAttribute('disabled', '');
	});
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

function SQLBeautify(strInput) {
    'use strict';

    //HARK YE ONLOOKER: HERE BE DRAGONS
    //Maintainer of the dragons: Joseph 5-28-17
    //Talk to the maintainer of the dragons before making changes
    //@@@@@@@@@@@@@@@@@@@@@**^^""~~~"^@@^*@*@@**@@@@@@@@@
    //@@@@@@@@@@@@@*^^'"~   , - ' '; ,@@b. '  -e@@@@@@@@@
    //@@@@@@@@*^"~      . '     . ' ,@@@@(  e@*@@@@@@@@@@
    //@@@@@^~         .       .   ' @@@@@@, ~^@@@@@@@@@@@
    //@@@~ ,e**@@*e,  ,e**e, .    ' '@@@@@@e,  "*@@@@@'^@
    //@',e@@@@@@@@@@ e@@@@@@       ' '*@@@@@@    @@@'   0
    //@@@@@@@@@@@@@@@@@@@@@',e,     ;  ~^*^'    ;^~   ' 0
    //@@@@@@@@@@@@@@@^""^@@e@@@   .'           ,'   .'  @
    //@@@@@@@@@@@@@@'    '@@@@@ '         ,  ,e'  .    ;@
    //@@@@@@@@@@@@@' ,&&,  ^@*'     ,  .  i^"@e, ,e@e  @@
    //@@@@@@@@@@@@' ,@@@@,          ;  ,& !,,@@@e@@@@ e@@
    //@@@@@,~*@@*' ,@@@@@@e,   ',   e^~^@,   ~'@@@@@@,@@@
    //@@@@@@, ~" ,e@@@@@@@@@*e*@*  ,@e  @@""@e,,@@@@@@@@@
    //@@@@@@@@ee@@@@@@@@@@@@@@@" ,e@' ,e@' e@@@@@@@@@@@@@
    //@@@@@@@@@@@@@@@@@@@@@@@@" ,@" ,e@@e,,@@@@@@@@@@@@@@
    //@@@@@@@@@@@@@@@@@@@@@@@~ ,@@@,,0@@@@@@@@@@@@@@@@@@@
    //@@@@@@@@@@@@@@@@@@@@@@@@,,@@@@@@@@@@@@@@@@@@@@@@@@@
    //"""""""""""""""""""""""""""""""""""""""""""""""""""

    var intTabLevel = 0;
    var bolDeclare = false;
    var bolNoExtraWhitespace = true;
    var bolFunction = false;
    var bolGrant = false;
    var bolStdin = false;
    var bolRule = false;
    var bolTable = false;
    var bolView = false;
    var bolTrigger = false;
    var bolLastComment = false;
    var intCase = 0;
    var i;

    var int_qs = 0; // quote status
    var int_E_quote = 0; // for single quotes and backslash skipping (not being used? only set?)
    var int_ps = 0; // parenthesis level
    var int_tag = 0;
    var str_tag = '';

    var strResult = "";
    for (i = 0; i < strInput.length; i += 1) {
        // FOUND MULTILINE COMMENT:
        if (int_qs === 0 && strInput.substr(i, 2) === "/*") {
            strResult += strInput[i];
            int_qs = 5;
            //console.log("found multiline comment");

        // ENDING MULTILINE COMMENT
        } else if (int_qs === 5 && strInput.substr(i, 2) === "*/") {
            strResult += strInput[i] + strInput[i + 1] + '\n\n';
            bolNoExtraWhitespace = true;
            bolLastComment = true;
            int_qs = 0;
            i += 1;
            //console.log("found end of multiline comment");

        // FOUND DASH COMMENT:
        } else if (int_qs === 0 && strInput.substr(i, 2) === "--") {
            strResult += strInput[i];
            int_qs = 6;
            //console.log("found dash comment");

        // ENDING DASH COMMENT
        } else if (int_qs === 6 && (strInput.substr(i, 1) === "\n" || strInput.substr(i, 1) === "\r")) {
            strResult += '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            bolNoExtraWhitespace = true;
            bolLastComment = true;
            int_qs = 0;
            //console.log("found end of dash comment");

        // CONSUME COMMENT
        } else if (int_qs === 6 || int_qs === 5) {
            strResult += strInput[i];

        // FOUND SLASH:  we don't skip slashed chars within dollar tags, double or single quotes and comments. <-- ONLY IF IT'S AN E STRING
        } else if (strInput.substr(i, 1) === "\\" && int_qs === 1) {
            strResult += strInput[i];
            // skip next character
            i += 1;
            strResult += strInput[i];
        // FOUND E SINGLE QUOTE:
        } else if (int_qs === 0 && strInput.substr(i, 2) === "E'") {
            strResult += strInput.substr(i, 2);
            int_qs = 1;
            int_E_quote = (i - 1) === 'E';
            //console.log("found E single quote, ", strResult);
            i += 1
        // FOUND SINGLE QUOTE:
        } else if (int_qs === 0 && strInput.substr(i, 1) === "'") {
            strResult += strInput[i];
            int_qs = 3;
            int_E_quote = (i - 1) === 'E';
            //console.log("found single quote", strResult);

        // FOUND TWO SINGLE QUOTES INSIDE STRING:
        } else if (int_qs === 3 && strInput.substr(i, 2) === "''") {
            strResult += strInput[i];

            //add next character
            i += 1;
            strResult += strInput[i];
            //console.log("found two single quote");

        // ENDING SINGLE QUOTE
        } else if ((int_qs === 3 || int_qs === 1) && strInput.substr(i, 1) === "'") {
            strResult += strInput[i] + " ";
            bolNoExtraWhitespace = true;
            int_qs = 0;
            int_E_quote = 0;
            //console.log("found end of single quote", strResult);

        // FOUND DOUBLE QUOTE:
        } else if (int_qs === 0 && strInput.substr(i, 1) === "\"") {
            strResult += strInput[i];
            int_qs = 4;
            //console.log("found double quote");

        // ENDING DOUBLE QUOTE
        } else if (int_qs === 4 && strInput.substr(i, 1) === "\"") {
            strResult += strInput[i] + " ";
            bolNoExtraWhitespace = true;
            int_qs = 0;
            //console.log(strInput);
        // FOUND CREATE OR REPLACE TABLE... (
        } else if (int_qs === 0 && int_ps === 0 && bolTable && strInput.substr(i, 1) === "(") {
            strResult += strInput[i] + '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel) + 1);
            int_ps = int_ps + 1;
            intTabLevel += 1;
            bolNoExtraWhitespace = true;
            //console.log(">(|" + intTabLevel + "<");
        // FOUND CREATE OR REPLACE TABLE... )
        } else if (int_qs === 0 && int_ps === 1 && bolTable && strInput.substr(i, 1) === ")") {
            // Remove previous tab if previous character is whitespace
            if (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                strResult = strResult.substring(0, strResult.length - 1);
            }
            strResult += '\n' + strInput[i] + ' ';
            bolNoExtraWhitespace = true;
            //i += 1;
            int_ps = int_ps - 1;
            intTabLevel -= 1;
            //console.log(">(|" + intTabLevel + "<");
        // FOUND OPEN PARENTHESIS:
        } else if (int_qs === 0 && strInput.substr(i, 1) === "(") {
            strResult += strInput[i];
            int_ps = int_ps + 1;
            intTabLevel += 1;
            bolNoExtraWhitespace = true;
            //console.log(">(|" + intTabLevel + "<");

        // FOUND CLOSE PARENTHESIS
        } else if (int_qs === 0 && strInput.substr(i, 1) === ")") {
            // Remove previous tab if previous character is whitespace
            if (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                strResult = strResult.substring(0, strResult.length - 1);
            }
            strResult += strInput[i] + ' ';
            bolNoExtraWhitespace = true;
            //i += 1;
            int_ps = int_ps - 1;
            intTabLevel -= 1;
            //console.log(">(|" + intTabLevel + "<");

        // FOUND DOUBLE COLON
        } else if (int_qs === 0 && strInput.substr(i, 2) === "::") {
            // Remove previous tab if previous character is whitespace
            if (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                strResult = strResult.substring(0, strResult.length - 1);
            }
            strResult += ':';
            //console.log(">(|" + intTabLevel + "<");

        // FOUND $BODY$, ignore this particular dollar quoting
        } else if (int_qs === 0 && strInput.substr(i, 6) === "$BODY$") {
            strResult += "$BODY$";
            strResult += '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            bolNoExtraWhitespace = true;
            i += 5;
            //console.log(">$BODY$|" + intTabLevel + "<");

        // FOUND DOLLAR TAG START:
        } else if (int_qs === 0 && strInput.substr(i, 1) === "$") {
            //console.log('start dollar tag');
            // we should be looking ahead here. get the tag or if false start then
            // just continue
            var int_test_loop = i + 1;

            //console.log('int_test_loop = ' + int_test_loop);
            //console.log('strInput.length = ' + strInput.length);
            //console.log('strInput.substr(int_test_loop, 1) = ' + strInput.substr(int_test_loop, 1));
            while (int_test_loop < strInput.length && strInput.substr(int_test_loop, 1).match("^[a-zA-Z0-9_]$")) {
                int_test_loop += 1;
                //console.log('int_test_loop = ' + int_test_loop);
            }

            if (strInput.substr(int_test_loop, 1) === '$') {
                int_tag = (int_test_loop - (i - 1));
                str_tag = strInput.substr(i, int_tag);
                // we found the end of the tag, now look for the close tag
                i += (int_tag - 1); //We've already incremented by one
                int_qs = 2;

                strResult += str_tag;
                //console.log('int_qs = 2');
                // SDEBUG("after int_loop: %s", int_loop);
            } else {
                //console.log('false alarm');
                // false alarm, do nothing
                strResult += strInput[i];
            }

        // END DOLLAR TAG
        } else if (int_qs === 2 && strInput.substr(i, str_tag.length) === str_tag) {
            strResult += str_tag + " ";
            bolNoExtraWhitespace = true;
            //console.log('end dollar tag');
            int_qs = 0;
            // move pointer to end of end dollar tag
            int_tag -= 1;
            i += int_tag;

        // FOUND GRANT/REVOKE
        } else if (int_qs === 0 && strInput.substr(i, 7).match(/^GRANT\b|REVOKE\b/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            bolGrant = true;
            if (int_ps > 0) {
                strResult += '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel)) + strInput.substr(i, 7).match(/^GRANT\b|REVOKE\b/i) + ' ';
            } else {
                strResult += /*'\n' + */strInput.substr(i, 7).match(/^GRANT\b|REVOKE\b/i) + ' ';
            }
            i += (strInput.substr(i, 6).match(/^GRANT\b|REVOKE\b/i)[0].length - 1);
            bolNoExtraWhitespace = true;
            //console.log(">KEYWORD|" + intTabLevel + "<");

        // FOUND AN UNQUOTED/UNPARENTHESISED COMMA NOT INSIDE A GRANT/REVOKE STATEMENT:
        } else if (int_ps === 0 && int_qs === 0 && strInput.substr(i, 1) === "," && !bolGrant) {
            // Remove comma and whitespace
            strResult = strResult.trim();
            //console.log(localStorage.bolComma);
            if (localStorage.bolComma === 'true') {
                strResult += '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel) + 1) + ', ';
                bolNoExtraWhitespace = true;
            } else {
                strResult += ',' + '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel) + 1);
                bolNoExtraWhitespace = true;
            }
            //console.log(">,|" + intTabLevel + "<");

        // FOUND AN UNQUOTED/UNPARENTHESISED COMMA INSIDE A GRANT/REVOKE STATEMENT:
        } else if (int_ps === 0 && int_qs === 0 && strInput.substr(i, 1) === "," && bolGrant) {
            if (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                strResult = strResult.substr(0, strResult.length - 1);
            }
            strResult += ', ';
            bolNoExtraWhitespace = true;
            //console.log(">,|" + intTabLevel + "<");

        // FOUND AN UNQUOTED/UNPARENTHESISED SEMICOLON:
        } else if (int_ps === 0 && int_qs === 0 && strInput.substr(i, 1) === ";") {
            // Remove semicolon and whitespace
            strResult = strResult.trim();

            if (bolRule) {
                intTabLevel -= 1;
            }

            //if state is a copy, from stdin, then we need to ignore the data after wards
            if (bolStdin) {
                strResult += ';\n' + strInput.substr(i + 2, strInput.substr(i + 2).indexOf('\n\\.')) +
                    '\n\\.\n\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
                i += 1 + strInput.substr(i + 1).indexOf('\n\\.') + 3;//\n\\.
                bolStdin = false;
            } else {
                if (bolDeclare || bolGrant) {
                    strResult += ';\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
                } else {
                    strResult += ';\n\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
                }
            }
            bolRule = false;
            bolTable = false;
            if (bolTrigger) {
                intTabLevel -= 1;
            }
            bolTrigger = false;
            bolGrant = false;
            bolLastComment = false;
            bolNoExtraWhitespace = true;


            //console.log(">;|" + intTabLevel + "<");

        // Function Declare
        } else if (int_qs === 0 && strInput.substr(i).match(/^DECLARE\b/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            i = i + 6 + (strInput.substr(i + 7, 1) === ' ' ? 1 : 0);
            intTabLevel += 1;
            strResult += 'DECLARE\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            bolDeclare = true;
            bolNoExtraWhitespace = true;
            //console.log(">DECLARE|" + intTabLevel + "<");

        // Transactions
        } else if (int_qs === 0 && strInput.substr(i).match(/^BEGIN\b/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            // Remove previous tab if previous character is whitespace, but only if there was a declare before
            if (bolDeclare && strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                strResult = strResult.substring(0, strResult.length - 1);
            }
            if (bolDeclare) {
                if (intTabLevel > 0) {
                    strResult = strResult + '\n' + '\t'.repeat(intTabLevel - 1);
                } else {
                    strResult = strResult + '\n' + '\t'.repeat(0);
                }
            }
            i = i + 4 + (strInput.substr(i + 5, 1) === ' ' ? 1 : 0);
            if (bolDeclare) {
                bolDeclare = false;
            } else {
                intTabLevel += 1;
            }
            strResult += 'BEGIN\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            bolNoExtraWhitespace = true;
            //console.log(">BEGIN|" + intTabLevel + "<");

        // FOUND CASE WHEN
        } else if (int_qs === 0 && strInput.substr(i).match(/^CASE[\ \t\n]+WHEN\b/i)) {
            strResult += 'CASE WHEN ';
            i = i + (strInput.substr(i).match(/^CASE[\ \t\n]+WHEN\b/i)[0].length - 1);
            intTabLevel += 1;
            intCase += 1; //INCREASE CASE LEVEL, WHILE intCase > 0 THEN "THEN" AND "END" IS TREATED DIFFERENTLY
            bolNoExtraWhitespace = true;
            //console.log(">CASE|" + intTabLevel + "<");

        // FOUND CASE
        } else if (int_qs === 0 && strInput.substr(i).match(/^CASE\b/i)) {
            strResult += 'CASE ';
            i = i + (strInput.substr(i).match(/^CASE\b/i)[0].length - 1);
            intTabLevel += 1;
            intCase += 1; //INCREASE CASE LEVEL, WHILE intCase > 0 THEN "THEN" AND "END" IS TREATED DIFFERENTLY
            bolNoExtraWhitespace = true;
            //console.log(">CASE|" + intTabLevel + "<");

        // FOUND DISTINCT FROM
        } else if (int_qs === 0 && strInput.substr(i).match((/^DISTINCT[\ \t\n]+FROM\b/i))) {
            strResult += 'DISTINCT FROM ';
            i = i + (strInput.substr(i).match((/^DISTINCT[\ \t\n]+FROM\b/))[0].length - 1);

        // FOUND CASE... THEN
        } else if (int_qs === 0 && intCase > 0 && strInput.substr(i).match(/^THEN\b/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            strResult += 'THEN ';
            i = i + 3;
            bolNoExtraWhitespace = true;
            //console.log(">C THEN|" + intTabLevel + "<");

        // FOUND CASE... WHEN
        } else if (int_qs === 0 && intCase > 0 && strInput.substr(i).match(/^WHEN\b/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            //strResult = strResult.trim() + '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel)) + 'WHEN ';
            strResult += 'WHEN ';
            i = i + 3 + (strInput.substr(i + 4, 1) === ' ' ? 1 : 0);
            bolNoExtraWhitespace = true;
            //console.log(">WHEN|" + intTabLevel + "<");

        // FOUND CASE... ELSE
        } else if (int_qs === 0 && intCase > 0 && strInput.substr(i).match(/^ELSE\b/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            //strResult += '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel)) + 'ELSE ';
            strResult += 'ELSE ';
            i = i + 3 + (strInput.substr(i + 4, 1) === ' ' ? 1 : 0);
            bolNoExtraWhitespace = true;
            //console.log(">C ELSE|" + intTabLevel + "<");

        // FOUND CASE... END
        } else if (int_qs === 0 && intCase > 0 && strInput.substr(i).match(/^END\b/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            //strResult += '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel)) + 'END ';
            strResult += 'END ';
            i = i + 2 + (strInput.substr(i + 3, 1) === ' ' ? 1 : 0);
            intTabLevel -= 1;
            bolNoExtraWhitespace = true;
            intCase -= 1;
            //console.log(">END|" + intTabLevel + "<");

        // FOUND THEN
        } else if (int_qs === 0 && intCase === 0 && strInput.substr(i).match(/^THEN\b/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            intTabLevel += 1;
            strResult += 'THEN\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            i = i + 3 + (strInput.substr(i + 4, 1) === ' ' ? 1 : 0);
            bolNoExtraWhitespace = true;
            //console.log(">I THEN|" + intTabLevel + "<");

        // FOUND LOOP
        } else if (int_qs === 0 && intCase === 0 && strInput.substr(i).match(/^LOOP\b/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            intTabLevel += 1;
            strResult += 'LOOP\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            i = i + 3 + (strInput.substr(i + 4, 1) === ' ' ? 1 : 0);
            bolNoExtraWhitespace = true;
            //console.log(">LOOP|" + intTabLevel + "<");

        // FOUND THEN... ELSE
        } else if (int_qs === 0 && intCase === 0 && strInput.substr(i).match(/^ELSE\b/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            // Remove previous tab if previous character is whitespace
            if (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                strResult = strResult.substr(0, strResult.length - 1);
            }

            strResult += 'ELSE' +
                '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));

            i = i + 3 + (strInput.substr(i + 4, 1) === ' ' ? 1 : 0);
            bolNoExtraWhitespace = true;
            //console.log(">ELSE|" + intTabLevel + "<");

        // FOUND END IF;
        } else if (int_qs === 0 && strInput.substr(i).match(/^END[\ \t\n\r]+IF[\ \t\n\r]*;/i)) {
            /* XLD
            // Remove previous tab if previous character is whitespace
            if (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                strResult = strResult.substr(0, strResult.length - 1);
            }
            */

            // Remove previous newline
            if (bolLastComment) {
                strResult += '\n';
            } else {
                while (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t\n\r]')) {
                    //console.log('>' + strResult.substring(strResult.length - 1, strResult.length) + '<');
                    if (strResult.substring(strResult.length - 1, strResult.length).match('[\n]')) {
                        //console.log('break');
                        strResult = strResult.substr(0, strResult.length - 1);
                        break;
                    } else {
                        strResult = strResult.substr(0, strResult.length - 1);
                    }
                }
            }

            // add tabs for previous line
            strResult += '\t'.repeat(((intTabLevel - 1 < 0) ? 0 : intTabLevel - 1));

            intTabLevel -= 1;
            strResult += 'END IF;\n\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            i = i + (-1) + (strInput.substr(i).match(/^END[\ \t\n\r]+IF[\ \t\n\r]*;[\ \t]*/i)[0].length);
            bolNoExtraWhitespace = true;
            bolLastComment = false;
            //console.log(">END IF;|" + intTabLevel + "<");

        // FOUND END LOOP;
        } else if (int_qs === 0 && strInput.substr(i).match(/^END[\ \t\n\r]+LOOP[\ \t\n\r]*;/i)) {
            /* XLD
            // Remove previous tab if previous character is whitespace
            if (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                strResult = strResult.substr(0, strResult.length - 1);
            }
            */

            // Remove previous newline
            if (bolLastComment) {
                strResult += '\n';
            } else {
                while (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t\n\r]')) {
                    //console.log('>' + strResult.substring(strResult.length - 1, strResult.length) + '<');
                    if (strResult.substring(strResult.length - 1, strResult.length).match('[\n]')) {
                        //console.log('break');
                        strResult = strResult.substr(0, strResult.length - 1);
                        break;
                    } else {
                        strResult = strResult.substr(0, strResult.length - 1);
                    }
                }
            }

            // add tabs for previous line
            strResult += '\t'.repeat(((intTabLevel - 1 < 0) ? 0 : intTabLevel - 1));

            intTabLevel -= 1;
            strResult += 'END LOOP;\n\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            i = i + (-1) + (strInput.substr(i).match(/^END[\ \t\n\r]+LOOP[\ \t\n\r]*;[\ \t]*/i)[0].length);
            bolNoExtraWhitespace = true;
            bolLastComment = false;
            //console.log(">END IF;|" + intTabLevel + "<");

        // ELSIF
        } else if (int_qs === 0 && strInput.substr(i).match(/^ELSIF\b/i)) {

            // Remove previous tab if previous character is whitespace
            if (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                strResult = strResult.substr(0, strResult.length - 1);
            }
            intTabLevel -= 1;
            strResult += 'ELSIF '
            i = i + (-1) + (strInput.substr(i).match(/^ELSIF\b/i)[0].length);
            bolNoExtraWhitespace = true;
            //console.log(">ELSIF;|" + intTabLevel + "<");

        // END =
        } else if (int_qs === 0 && intCase === 0 && strInput.substr(i).match(/^END[\ \t\n]+=[\ \t\n]+/i)) {
            strResult += 'END = ';
            i += (strInput.substr(i).match(/^END[\ \t\n]+=[\ \t\n]+/i)[0].length - 1);
            bolNoExtraWhitespace = true;
            //console.log(">END = <");

        // Not an END IF, at this point it has to be a BEGIN END
        } else if (int_qs === 0 && intCase === 0 && strInput.substr(i).match(/^END\b/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            // Remove previous tab if previous character is whitespace
            if (strResult.substr(strResult.length - 1, 1).match('[\ \t]')) {
                strResult = strResult.substr(0, strResult.length - 1);
            }

            intTabLevel -= 1;
            strResult += 'END\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            i = i + 2 + (strInput.substr(i + 3, 1) === ' ' ? 1 : 0);
            bolNoExtraWhitespace = true;
            //console.log(">END|" + intTabLevel + "<");

        // FOUND CREATE OR REPLACE TABLE
        } else if (int_qs === 0 && strInput.substr(i).match(/^CREATE[\ \t\n]+(OR[\ \t\n]+REPLACE[\ \t\n]+)?TABLE\b/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            bolTable = true;
            strResult += '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel)) + strInput.substr(i).match(/^CREATE[\ \t]+(OR[\ \t]+REPLACE[\ \t]+)?TABLE/i)[0] + ' ';
            i += (strInput.substr(i).match(/^CREATE[\ \t]+(OR[\ \t]+REPLACE[\ \t]+)?TABLE/i)[0].length - 1);
            bolNoExtraWhitespace = true;
            //console.log(">CREATE OR REPLACE TABLE|" + intTabLevel + "<");
        // FOUND CREATE OR REPLACE TABLE... ,
        } else if (int_qs === 0 && int_ps === 1 && bolTable && strInput.substr(i, 1) === ",") {
            // Remove comma and whitespace
            strResult = strResult.trim();
            //console.log(localStorage.bolComma);
            if (localStorage.bolComma === 'true') {
                strResult += '\n' + '\t'.repeat((intTabLevel < 0) ? 0 : intTabLevel) + ', ';
                bolNoExtraWhitespace = true;
            } else {
                strResult += ',' + '\n' + '\t'.repeat((intTabLevel < 0) ? 0 : intTabLevel);
                bolNoExtraWhitespace = true;
            }
            //console.log(">,|" + intTabLevel + "<");

        // FOUND CREATE OR REPLACE RULE
        } else if (int_qs === 0 && strInput.substr(i).match(/^CREATE[\ \t\n]+(OR[\ \t\n]+REPLACE[\ \t\n]+)?RULE\b/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            bolRule = true;
            strResult += '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel)) + strInput.substr(i).match(/^CREATE[\ \t]+(OR[\ \t]+REPLACE[\ \t]+)?RULE/i)[0] + ' ';
            i += (strInput.substr(i).match(/^CREATE[\ \t]+(OR[\ \t]+REPLACE[\ \t]+)?RULE/i)[0].length - 1);
            bolNoExtraWhitespace = true;
            intTabLevel += 1;
            //console.log(">CREATE OR REPLACE RULE|" + intTabLevel + "<");

        // FOUND CREATE OR REPLACE RULE... TO/DO/ON
        } else if (int_qs === 0 && bolRule && strInput.substr(i,3).match(/^TO[\n\r\ \t]+|DO[\n\r\ \t]+|ON[\n\r\ \t]+/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            // Remove whitespace
            strResult = strResult.trim();

            strResult += '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel)) + strInput.substr(i,3).match(/^TO|DO|ON/i) + ' ';
            i += (strInput.substr(i,3).match(/^TO[\n\r\ \t]+|DO[\n\r\ \t]+|ON[\n\r\ \t]+/i)[0].length - 1);
            bolNoExtraWhitespace = true;
            //console.log(">TO/DO/ON|" + intTabLevel + "<");

        // FOUND CREATE OR REPLACE RULE... INSTEAD
        } else if (int_qs === 0 && bolRule && strInput.substr(i,8).match(/^INSTEAD[\n\r\ \t]+/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            strResult += strInput.substr(i,8).match(/^INSTEAD/i) + '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            i += (strInput.substr(i,8).match(/^INSTEAD[\n\r\ \t]+/i)[0].length - 1);
            bolNoExtraWhitespace = true;
            //console.log(">INSTEAD|" + intTabLevel + "<");

        // FOUND CREATE OR REPLACE FUNCTION
        } else if (int_qs === 0 && strInput.substr(i).match(/^CREATE[\ \t]+OR[\ \t]+REPLACE[\ \t]+FUNCTION/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            // Remove previous tab if previous character is whitespace
            if (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                strResult = strResult.substr(0, strResult.length - 1);
            }

            bolFunction = true;
            strResult += '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel)) + strInput.substr(i).match(/^CREATE[\ \t]+OR[\ \t]+REPLACE[\ \t]+FUNCTION/i)[0] + ' ';
            i += (strInput.substr(i).match(/^CREATE[\ \t]+OR[\ \t]+REPLACE[\ \t]+FUNCTION/i)[0].length - 1);
            bolNoExtraWhitespace = true;
            //console.log(">KEYWORD|" + intTabLevel + "<");

        // FOUND CREATE OR REPLACE FUNCTION... AS
        } else if (int_qs === 0 && bolFunction && strInput.substr(i).match(/^AS[\n\r\ \t]+/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {

            bolFunction = false;
            strResult += 'AS\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            i += 1;
            bolNoExtraWhitespace = true;
            //console.log(">KEYWORD|" + intTabLevel + "<");

        // FOUND CREATE OR REPLACE VIEW
        } else if (int_qs === 0 && strInput.substr(i).match(/^CREATE[\ \t]+OR[\ \t]+REPLACE[\ \t]+VIEW/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            // Remove previous tab if previous character is whitespace
            if (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                strResult = strResult.substr(0, strResult.length - 1);
            }

            bolView = true;
            strResult += '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel)) + strInput.substr(i).match(/^CREATE[\ \t]+OR[\ \t]+REPLACE[\ \t]+VIEW/i)[0] + ' ';
            i += (strInput.substr(i).match(/^CREATE[\ \t]+OR[\ \t]+REPLACE[\ \t]+VIEW/i)[0].length - 1);
            bolNoExtraWhitespace = true;
            //console.log(">KEYWORD|" + intTabLevel + "<");

        // FOUND CREATE OR REPLACE VIEW... AS
        } else if (int_qs === 0 && bolView && strInput.substr(i).match(/^AS[\n\r\ \t]+/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {

            bolView = false;
            strResult += 'AS\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            i += 1;
            bolNoExtraWhitespace = true;
            //console.log(">KEYWORD|" + intTabLevel + "<");

        // FOUND AS
        } else if (int_qs === 0 && (!bolFunction && !bolView) && strInput.substr(i).match(/^AS[\n\r\ \t]+/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            //strResult += strInput.substr(i).match(/^AS[\n\r\ \t]+/i)[0];
            strResult += 'AS ';
            i += 1;
            bolNoExtraWhitespace = true;
            //console.log(">KEYWORD|" + intTabLevel + "<");

        // FOUND CREATE OR REPLACE TRIGGER
        } else if (int_qs === 0 && int_ps === 0 && strInput.substr(i).match(/^CREATE[\ \t\n]+(OR[\ \t\n]+REPLACE[\ \t\n]+)?TRIGGER\b/i)) {
            bolTrigger = true;
            // Remove previous tab if previous character is whitespace
            if (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                strResult = strResult.substr(0, strResult.length - 1);
            }

            strResult += '\n' + strInput.substr(i).match(/^CREATE[\ \t\n]+(OR[\ \t\n]+REPLACE[\ \t\n]+)?TRIGGER\b/i)[0] + ' ';
            i += (strInput.substr(i).match(/^CREATE[\ \t\n]+(OR[\ \t\n]+REPLACE[\ \t\n]+)?TRIGGER\b/i)[0].length - 1);
            bolNoExtraWhitespace = true;
            intTabLevel += 1;
        // FOUND CREATE OR REPLACE TRIGGER ... ON
        } else if (int_qs === 0 && int_ps === 0 && bolTrigger && strInput.substr(i).match(/^ON[\n\r\ \t]+/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            // Remove previous tab if previous character is whitespace
            if (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                strResult = strResult.substr(0, strResult.length - 1);
            }

            strResult += '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel)) + strInput.substr(i).match(/^ON/i)[0] + ' ';
            i += (strInput.substr(i).match(/^ON[\n\r\ \t]+/i)[0].length - 1);
            bolNoExtraWhitespace = true;


        // FOUND CREATE OR REPLACE TRIGGER ... INSTEAD
        } else if (int_qs === 0 && int_ps === 0 && bolTrigger && strInput.substr(i).match(/^INSTEAD[\n\r\ \t]+/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            // Remove previous tab if previous character is whitespace
            if (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                strResult = strResult.substr(0, strResult.length - 1);
            }

            strResult += '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel)) + strInput.substr(i).match(/^INSTEAD/i)[0] + ' ';
            i += (strInput.substr(i).match(/^INSTEAD[\n\r\ \t]+/i)[0].length - 1);
            bolNoExtraWhitespace = true;


        // FOUND CREATE OR REPLACE TRIGGER ... EXECUTE
        } else if (int_qs === 0 && int_ps === 0 && bolTrigger && strInput.substr(i).match(/^EXECUTE[\n\r\ \t]+/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            // Remove previous tab if previous character is whitespace
            if (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                strResult = strResult.substr(0, strResult.length - 1);
            }

            strResult += '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel)) + strInput.substr(i).match(/^EXECUTE/i)[0] + ' ';
            i += (strInput.substr(i).match(/^EXECUTE[\n\r\ \t]+/i)[0].length - 1);
            bolNoExtraWhitespace = true;


        // FOUND CREATE OR REPLACE TRIGGER ... FOR
        } else if (int_qs === 0 && int_ps === 0 && bolTrigger && strInput.substr(i).match(/^FOR[\n\r\ \t]+/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            // Remove previous tab if previous character is whitespace
            if (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                strResult = strResult.substr(0, strResult.length - 1);
            }

            strResult += '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel)) + strInput.substr(i).match(/^FOR/i)[0] + ' ';
            i += (strInput.substr(i).match(/^FOR[\n\r\ \t]+/i)[0].length - 1);
            bolNoExtraWhitespace = true;


        // FOUND CREATE OR REPLACE
        } else if (int_qs === 0 && strInput.substr(i).match(/^CREATE[\ \t]+OR[\ \t]+REPLACE/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            // Remove previous tab if previous character is whitespace
            if (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                strResult = strResult.substr(0, strResult.length - 1);
            }
            //console.log('here, here', strResult);
            strResult += '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel)) + strInput.substr(i).match(/^CREATE[\ \t]+OR[\ \t]+REPLACE/i)[0] + ' ';
            i += (strInput.substr(i).match(/^CREATE[\ \t]+OR[\ \t]+REPLACE/i)[0].length - 1);
            bolNoExtraWhitespace = true;
            //console.log(">KEYWORD|" + intTabLevel + "<");

        // FOUND CREATE (OR REPLACE)
        } else if (int_qs === 0 && strInput.substr(i).match(/^CREATE[\ \t]+(OR[\ \t]+REPLACE)?/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            // Remove previous tab if previous character is whitespace
            if (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                strResult = strResult.substr(0, strResult.length - 1);
            }

            strResult += '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel)) + strInput.substr(i).match(/^CREATE([\ \t]+OR[\ \t]+REPLACE)?/i)[0] + ' ';
            i += (strInput.substr(i).match(/^CREATE([\ \t]+OR[\ \t]+REPLACE)?/i)[0].length - 1);
            bolNoExtraWhitespace = true;
            //console.log(">KEYWORD|" + intTabLevel + "<");

    /*
    TODO:
    add keywords
    */

        // FOUND a main keyword, no newline INSIDE A GRANT STATEMENT
        } else if (int_qs === 0 && strInput.substr(i).match(/^((SELECT|FROM))\b/i) && bolGrant && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
                // Remove previous tab if previous character is whitespace
                if (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                    strResult = strResult.substr(0, strResult.length - 1);
                }

                strResult += ' ' + strInput.substr(i).match(/^((SELECT|FROM))\b/i)[0].toUpperCase().trim() + ' ';
                i += (strInput.substr(i).match(/^((SELECT|FROM))\b/i)[0].length - 1);
                bolNoExtraWhitespace = true;
                //console.log(">KEYWORD|" + intTabLevel + "<");

            // FOUND a main keyword, newline before
        } else if (int_qs === 0 && strInput.substr(i).match(/^\b(((LEFT|FULL[\ \t]+OUTER|FULL|CROSS|LEFT[\ \t]+OUTER|RIGHT|RIGHT[\ \t]+OUTER|INNER)?[\ \t]+)JOIN|RETURNS|SELECT|FROM|GROUP|ORDER|HAVING|WHERE|AUTHORIZATION|LIMIT|OFFSET|USING|SET|INSERT|VALUES|FROM[\ \t\n\r]+STDIN|UNION|RAISE)\b/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {
            // Remove previous tab if previous character is whitespace
            if (strResult.substring(strResult.length - 1, strResult.length).match('[\ \t]')) {
                strResult = strResult.substr(0, strResult.length - 1);
            }

            //if state is a copy, from stdin, then we need to ignore the data after wards
            if (strInput.substr(i).match(/^FROM[\ \t\n\r]+STDIN/i)) {
                bolStdin = true;
            }

            //add new line, but not if we are inside a grant (we do not want GRANT\nINSERT)
            if (!bolGrant) {
                strResult += '\n' + '\t'.repeat(((intTabLevel < 0) ? 0 : intTabLevel));
            } else {
                strResult += ' ';
            }
            strResult += strInput.substr(i).match(/^\b(((LEFT|FULL[\ \t]+OUTER|FULL|CROSS|LEFT[\ \t]+OUTER|RIGHT|RIGHT[\ \t]+OUTER|INNER)?[\ \t]+)JOIN|RETURNS|SELECT|FROM|GROUP|ORDER|HAVING|WHERE|AUTHORIZATION|LIMIT|OFFSET|USING|SET|INSERT|VALUES|FROM[\ \t\n\r]+STDIN|UNION|RAISE)\b/i)[0].toUpperCase().trim() + ' ';
            i += (strInput.substr(i).match(/^\b(((LEFT|FULL[\ \t]+OUTER|FULL|CROSS|LEFT[\ \t]+OUTER|RIGHT|RIGHT[\ \t]+OUTER|INNER)?[\ \t]+)JOIN|RETURNS|SELECT|FROM|GROUP|ORDER|HAVING|WHERE|AUTHORIZATION|LIMIT|OFFSET|USING|SET|INSERT|VALUES|FROM[\ \t\n\r]+STDIN|UNION|RAISE)\b/i)[0].length - 1);
            bolNoExtraWhitespace = true;
            //console.log(">KEYWORD|" + intTabLevel + "<");

        // FOUND DELETE FROM
        } else if (int_qs === 0 && strInput.substr(i).match(/^\b(DELETE[\ \t\n\r]+FROM)\b/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {

            strResult += 'DELETE FROM ';
            i += (strInput.substr(i).match(/^\b(DELETE[\ \t\n\r]+FROM)\b/i)[0].length - 1);
            bolNoExtraWhitespace = true;
            //console.log(">DELETE FROM|" + intTabLevel + "<");

        // FOUND a main keyword, capitalize only
        } else if (int_qs === 0 && strInput.substr(i).match(/^\b(LANGUAGE|VOLATILE|BY|INTO|COST)\b/i) && strInput.substr(i - 1, 1).match('^[\n\r\ \t]+')) {

            strResult += strInput.substr(i).match(/^\b(LANGUAGE|VOLATILE|BY|INTO|COST)\b/i)[0] + ' '; // .toUpperCase()
            i += (strInput.substr(i).match(/^\b(LANGUAGE|VOLATILE|BY|INTO|COST)\b/i)[0].length - 1);
            bolNoExtraWhitespace = true;
            //console.log(">KEYWORD|" + intTabLevel + "<");

        // Not whitespace
        } else if (int_qs === 0 && !strInput.substr(i).match('^[\n\r\ \t]+')) {
            strResult += strInput[i];
            bolNoExtraWhitespace = false;

        // Whitespace
        } else if (int_qs === 0 && strInput.substr(i).match('^[\n\r\ \t]+')) {
            // When a clause above adds a space afterwards, we don't want anymore whitespace,
            // but if we haven't, then just collapse input whitespace to a single space
            if (!bolNoExtraWhitespace) {
                strResult += ' ';
            }
            //console.log("strInput i>" + strInput.substr(i).match('^[\n\r\ \t]+')[0] + "|" + strInput.substr(i).match('^[\n\r\ \t]+')[0].length + "<");
            i = i + (-1) + (strInput.substr(i).match('^[\n\r\ \t]+')[0].length);
            bolNoExtraWhitespace = false;
            //console.log(">whitespace|" + intTabLevel + "<");

        // Default is to continue collecting characters
        } else {
            strResult += strInput[i];
        }
        if (intTabLevel < 0) {
            console.log(strInput.substring(i, i - 10), strInput.substring(i, i + 10));
            break;
        }
    }

    // Strip all the whitespace between the input and output, then check to see if they match, if they don't then console.error
    // I tried to wtrip the white space to spaces, and colapse spaces into one, but it didn't work because sometimes beautify
    // puts whitespace where there isn't, I was trying to make sure beautify didn't take away whitespace where it was needed,
    // but oh well.
    // -Joseph
    var strResultStripped = strResult.replace(/[\n\r\ \t]/g,'');
    var strInputStripped = strInput.replace(/[\n\r\ \t]/g,'');

    if (strResultStripped !== strInputStripped) {
        console.error('Beautify mangled the SQL: Before >>>' + strInput + '<<< After >>>' + strResult + '<<<');
        return strInput;
    }

    // for #380
    // the reason it is after the test is because it modifies something other than whitespace
    strResult = strResult.replace(/\'\n\'::text/gi, 'E\'\\n\'::text');

    return strResult;
}
