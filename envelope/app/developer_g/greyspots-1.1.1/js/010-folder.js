//jslint white:true, multivar:true


window.addEventListener('design-register-element', function () {
    window.designElementProperty_GSFOLDER = function(selectedElement) {
        addProp('Column In Querystring', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('qs') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'qs', this.value, false);
        });
        
        addProp('Path', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('path') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'path', this.value);
        });
        
        addProp('Hide Folders', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('no-folders')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'no-folders', (this.value === 'true'), true);
        });
        
        addProp('Hide Files', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('no-files')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'no-files', (this.value === 'true'), true);
        });
        
        addProp('Side-By-Side', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('horizontal')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'horizontal', (this.value === 'true'), true);
        });
        
        addProp('Mini', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('mini')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'mini', (this.value === 'true'), true);
        });
        
        addProp('Disabled', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('mini')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'disabled', (this.value === 'true'), true);
        });
    };
    
    registerDesignSnippet('<gs-folder>', '<gs-folder>', 'gs-folder path="${0:/}" folder="${1:role}"></gs-folder>');
    
    designRegisterElement('gs-folder', '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-folder.html');
});

(function () {
    'use strict';
    
    // #################################################################################################
    // ############################################ UTILITY ############################################
    // #################################################################################################
    
    function getPath(element) {
        var strAttributePath = GS.trim(GS.templateWithQuerystring(element.getAttribute('path') || ''), '/')
          , strInnerPath = element.arrPath.join('/'), strRet;
        
        if (strAttributePath && strInnerPath) {
            strRet = '/' + strAttributePath + '/' + strInnerPath + '/';
        } else if (strAttributePath) {
            strRet = '/' + strAttributePath + '/';
        } else if (strInnerPath) {
            strRet = '/' + strInnerPath + '/';
        }
        
        return strRet || '/';
    }
    
    function getRealPath(element) {
        var strAttributePath = GS.trim(GS.templateWithQuerystring(element.getAttribute('path') || ''), '/')
          , arrPath = element.arrPath, strInnerPath, strRet, strPrefix;
        
        if (element.arrPath[0] === 'app' || strAttributePath.indexOf('app') === 0) {
            strPrefix = '/env';
        } else if (element.arrPath[0] === 'role' || strAttributePath.indexOf('role') === 0) {
            strPrefix = '/env';
        } else if (element.arrPath[0] === 'web_root' || strAttributePath.indexOf('web_root') === 0) {
            strPrefix = '';
            arrPath.splice(0, 1);
        }
        
        strInnerPath = arrPath.join('/');
        
        if (strAttributePath && strInnerPath) {
            strRet = '/' + strAttributePath + '/' + strInnerPath + '/';
        } else if (strAttributePath) {
            strRet = '/' + strAttributePath + '/';
        } else if (strInnerPath) {
            strRet = '/' + strInnerPath + '/';
        }
        
        return (strPrefix || '') + (strRet || '/');
    }
    
    function getData(element) {
        var strPath = getPath(element)
          , bolFolders = !element.hasAttribute('no-folders')
          , bolFiles = !element.hasAttribute('no-files')
          , strHeader
          , intResponseNumber;
        
        element.folderList.innerHTML = '';
        element.fileList.innerHTML = '';
        
        strHeader = GS.trim('/' + element.arrPath.join('/'), '/');
        
        // if there is something in the header: wrap it with slashes
        if (strHeader) {
            strHeader = '/' + strHeader + '/';
        }
        
        element.pathTitle.textContent = strHeader;
        
        if (element.arrPath.length > 0) {
            element.backButton.removeAttribute('disabled');
        } else {
            element.backButton.setAttribute('disabled', '');
        }
        element.arrFile = [];
        element.arrFolder = [];
        intResponseNumber = 0;
        GS.requestFromSocket(GS.envSocket, 'FILE\tLIST\t' + GS.encodeForTabDelimited(strPath), function (data, error, errorData) {
            var arrPaths, strName, strType, arrCells, i, len, divElement
              , arrFiles = [], arrFolders = [];
            
            if (!error && data.trim() && data.indexOf('Failed to get canonical path') === -1) {
                if (data !== 'TRANSACTION COMPLETED') {
                    arrPaths = GS.trim(data, '\n').split('\n');
                    if (intResponseNumber === 0) {
                        element.folderList.innerHTML = '';
                        element.fileList.innerHTML = '';
                    }
                    
                    for (i = 0, len = arrPaths.length; i < len; i += 1) {
                        arrCells = arrPaths[i].split('\t');
                        strType = GS.decodeFromTabDelimited(arrCells[1]);
                        strName = GS.trim(GS.decodeFromTabDelimited(arrCells[0]), '/');
                        
                        if ((strType === 'folder' && bolFolders) || (strType === 'file' && bolFiles)) {
                            divElement = document.createElement('div');
                            divElement.setAttribute('flex-horizontal', '');
                            divElement.setAttribute('flex-fill', '');
                            divElement.setAttribute('class', strType + '-line');
                            divElement.setAttribute('data-name', strName);
                            
                            if (strType === 'file') {
                                arrFiles.push(element.arrPath.join('/') + '/' + strName);
                                divElement.innerHTML =
                                    '<gs-button class="more-file" icononly icon="bars" remove-right></gs-button>'
                                  + '<gs-button class="open-file" flex remove-left>' + encodeHTML(strName) + '</gs-button>';
                                
                                element.fileList.appendChild(divElement);
                            }
                            
                            if (strType === 'folder') {
                                arrFolders.push(element.arrPath.join('/') + '/' + strName);
                                divElement.innerHTML =
                                    '<gs-button class="more-folder" icononly icon="bars" remove-right></gs-button>'
                                  + '<gs-button class="open-folder" flex remove-left>' + encodeHTML(strName) + '</gs-button>';
                                
                                element.folderList.appendChild(divElement);
                            }
                        }
                    }
                    
                    element.arrFile = arrFiles;
                    element.arrFolder = arrFolders;
                    GS.triggerEvent(element, 'change');
                    
                } else {
                    if (element.folderList.innerHTML === '') {
                        element.folderList.innerHTML = '<center prevent-text-selection><h4><small>No Folders.</small></h4></center>';
                    }
                    
                    if (element.fileList.innerHTML === '') {
                        element.fileList.innerHTML = '<center prevent-text-selection><h4><small>No Files.</small></h4></center>';
                    }
                }
            } else if (error) {
                if (!element.hasAttribute('no-list-error')) {
                    GS.webSocketErrorDialog(errorData);
                }
            }
            
            intResponseNumber += 1;
        });
    }
    
    function prepareElement(element) {
        var bolFolders = !element.hasAttribute('no-folders')
          , bolFiles = !element.hasAttribute('no-files');
        
        element.innerHTML = ml(function () {/*
            <div class="root" flex-vertical flex-fill gs-dynamic>
                <span class="path-title"></span>
                <div class="list-container" flex-fill>
                    <div class="folder-list-container" flex-vertical flex-fill flex>
                        <div class="folder-list-header" flex-horizontal>
                            <b flex prevent-text-selection>Folders:</b>
                            <gs-button class="button-back-folder" icon="long-arrow-left" icononly remove-bottom disabled no-focus></gs-button>
                            <gs-button class="button-new-folder" icon="plus" icononly remove-bottom no-focus></gs-button>
                        </div>
                        <div class="folder-list" flex></div>
                    </div>
                    <div class="file-list-container" flex-vertical flex-fill flex>
                        <div class="file-list-header" flex-horizontal>
                            <b flex prevent-text-selection>Files:</b>
                            <gs-button class="button-new-file" icon="plus" icononly remove-bottom no-focus></gs-button>
                            <gs-button class="button-upload-file" icon="upload" icononly remove-bottom no-focus></gs-button>
                        </div>
                        <div class="file-list" flex></div>
                    </div>
                </div>
            </div>
        */});
        //remove-right
        //remove-left
        
        element.root             = xtag.queryChildren(element, '.root')[0];
        element.folderListHeader = xtag.query(element.root, '.folder-list-header')[0];
        element.fileListHeader   = xtag.query(element.root, '.file-list-header')[0];
        
        element.folderList       = xtag.query(element.root, '.folder-list')[0];
        element.fileList         = xtag.query(element.root, '.file-list')[0];
        
        element.newFolderButton  = xtag.query(element.root, '.button-new-folder')[0];
        element.newFileButton    = xtag.query(element.root, '.button-new-file')[0];
        element.uploadFileButton = xtag.query(element.root, '.button-upload-file')[0];
        element.backButton       = xtag.query(element.root, '.button-back-folder')[0];
        
        element.pathTitle        = xtag.query(element.root, '.path-title')[0];
        
        element.arrPath = [];
    }
    
    //function pushReplacePopHandler(element) {
    //    var strQueryString = GS.getQueryString(), strQSCol = element.getAttribute('qs');
    //    
    //    if (GS.qryGetKeys(strQueryString).indexOf(strQSCol) > -1) {
    //        getData(element);
    //    }
    //}
    
    function saveDefaultAttributes(element) {
        var i;
        var len;
        var arrAttr;
        var jsnAttr;

        // we need a place to store the attributes
        element.internal.defaultAttributes = {};

        // loop through attributes and store them in the internal defaultAttributes object
        i = 0;
        len = element.attributes.length;
        arrAttr = element.attributes;
        while (i < len) {
            jsnAttr = element.attributes[i];

            element.internal.defaultAttributes[jsnAttr.nodeName] = (jsnAttr.nodeValue || '');

            i += 1;
        }
    }

    function pushReplacePopHandler(element) {
        var i;
        var len;
        var strQS = GS.getQueryString();
        var strQSCol = element.getAttribute('qs');
        var strQSValue;
        var strQSAttr;
        var arrQSParts;
        var arrAttrParts;
        var strOperator;

        if (strQSCol && strQSCol.indexOf('=') !== -1) {
            arrAttrParts = strQSCol.split(',');
            i = 0;
            len = arrAttrParts.length;
            while (i < len) {
                strQSCol = arrAttrParts[i];

                if (strQSCol.indexOf('!=') !== -1) {
                    strOperator = '!=';
                    arrQSParts = strQSCol.split('!=');
                } else {
                    strOperator = '=';
                    arrQSParts = strQSCol.split('=');
                }

                strQSCol = arrQSParts[0];
                strQSAttr = arrQSParts[1] || arrQSParts[0];

                // if the key is not present or we've got the negator: go to the attribute's default or remove it
                if (strOperator === '!=') {
                    // if the key is not present: add the attribute
                    if (GS.qryGetKeys(strQS).indexOf(strQSCol) === -1) {
                        element.setAttribute(strQSAttr, '');
                    // else: remove the attribute
                    } else {
                        element.removeAttribute(strQSAttr);
                    }
                } else {
                    // if the key is not present: go to the attribute's default or remove it
                    if (GS.qryGetKeys(strQS).indexOf(strQSCol) === -1) {
                        if (element.internal.defaultAttributes[strQSAttr] !== undefined) {
                            element.setAttribute(strQSAttr, (element.internal.defaultAttributes[strQSAttr] || ''));
                        } else {
                            element.removeAttribute(strQSAttr);
                        }
                    // else: set attribute to exact text from QS
                    } else {
                        element.setAttribute(strQSAttr, (
                            GS.qryGetVal(strQS, strQSCol) ||
                            element.internal.defaultAttributes[strQSAttr] ||
                            ''
                        ));
                    }
                }
                i += 1;
            }
        } else {
            strQSValue = GS.qryGetVal(strQS, strQSCol);

            if (element.internal.bolQSFirstRun === true && GS.qryGetKeys(strQS).indexOf(strQSCol) > -1) {
                //console.trace(element, 'test');
                getData(element);
            }
        }

        element.internal.bolQSFirstRun = true;
    }
    
    function bindElement(element) {
        if (element.hasAttribute('qs')) {
            pushReplacePopHandler(element);
            window.addEventListener('pushstate',    function () { pushReplacePopHandler(element); });
            window.addEventListener('replacestate', function () { pushReplacePopHandler(element); });
            window.addEventListener('popstate',     function () { pushReplacePopHandler(element); });
        }
        
        element.addEventListener('click', function (event) {
            var target = event.target;
            
            if (target.classList.contains('button-new-folder')) {
                newFolder(element, target);
                
            } else if (target.classList.contains('button-new-file')) {
                newFile(element, target);
                
            } else if (target.classList.contains('open-file')) {
                fileOpen(element, target);
                
            } else if (target.classList.contains('open-folder')) {
                folderOpen(element, target);
                
            } else if (target.classList.contains('button-back-folder')) {
                backFolder(element, target);
                
            } else if (target.classList.contains('more-folder')) {
                folderMenu(element, target);
                
            } else if (target.classList.contains('more-file')) {
                fileMenu(element, target);
                
            } else if (target.classList.contains('button-upload-file')) {
                fileUpload(element, target);
            }
        });
    }
    
    
    // ################################################################################################
    // ####################################### FOLDER FUNCTIONS #######################################
    // ################################################################################################
    
    function folderMenu(element, target) {
        'use strict';
        var lineElement = GS.findParentElement(target, '.folder-line')
          , strFolderName = lineElement.getAttribute('data-name')
          , strPath = (getPath(element) + strFolderName)
          , templateElement = document.createElement('template');
        
        templateElement.setAttribute('data-overlay-close', 'true');
        templateElement.setAttribute('data-max-width', '250px');
        templateElement.innerHTML = ml(function () {/*
            <gs-body padded>
                <gs-button dialogclose remove-bottom style="border-bottom: 0 none;">Rename Folder</gs-button>
                <gs-button dialogclose remove-top>Delete Folder</gs-button>
                <hr />
                <gs-button dialogclose>Cancel</gs-button>
            </gs-body>
        */});
        
        GS.openDialogToElement(target, templateElement, 'right', '', function (event, strAnswer) {
            if (strAnswer === 'Rename Folder') {
                folderRename(element, target, strPath, strFolderName);
                
            } else if (strAnswer === 'Delete Folder') {
                folderDelete(element, target, strPath, strFolderName);
            }
        });
    }
    
    function folderRename(element, target, strOldPath, strFolderName) {
        'use strict';
        var templateElement = document.createElement('template');
        
        templateElement.setAttribute('data-overlay-close', 'true');
        templateElement.setAttribute('data-max-width', '250px');
        templateElement.innerHTML = ml(function () {/*
            <gs-body padded>
                <label for="gs-file-manager-text-folder-name">Folder Name:</label>
                <gs-text id="gs-file-manager-text-folder-name"></gs-text>
                <hr />
                <gs-grid>
                    <gs-block><gs-button dialogclose style="border-right: 0 none;" remove-right>Cancel</gs-button></gs-block>
                    <gs-block><gs-button dialogclose remove-left>Rename</gs-button></gs-block>
                </gs-grid>
            </gs-body>
        */});
        
        GS.openDialogToElement(target, templateElement, 'right', function () {
            document.getElementById('gs-file-manager-text-folder-name').value = strFolderName;
            
        }, function (event, strAnswer) {
            var strNewPath;
            
            if (strAnswer === 'Rename') {
                strNewPath = getPath(element) + document.getElementById('gs-file-manager-text-folder-name').value;
                
                //console.log('strOldPath:', strOldPath);
                //console.log('strNewPath:', strNewPath);
                
                GS.requestFromSocket(GS.envSocket
                                   , 'FILE\tMOVE\t' + GS.encodeForTabDelimited(strOldPath) + '\t' +
                                                      GS.encodeForTabDelimited(strNewPath) + '\n'
                                   , function (data, error, errorData) {
                    if (!error && data.trim() && data.indexOf('Failed to get canonical path') === -1) {
                        if (data === 'TRANSACTION COMPLETED') {
                            getData(element);
                        }
                    } else if (error) {
                        GS.webSocketErrorDialog(errorData);
                    }
                });
            }
        });
    }
    
    function folderDelete(element, target, strPath, strFolderName) {
        'use strict';
        var templateElement = document.createElement('template');
        
        templateElement.setAttribute('data-overlay-close', 'true');
        templateElement.setAttribute('data-max-width', '250px');
        templateElement.innerHTML = ml(function () {/*
            <gs-body padded>
                Are you sure you want to delete the folder: "<b>{{STRPATH}}</b>"?
                <hr />
                <gs-grid>
                    <gs-block><gs-button dialogclose remove-right style="border-right: 0 none;">No</gs-button></gs-block>
                    <gs-block><gs-button dialogclose remove-left>Yes</gs-button></gs-block>
                </gs-grid>
            </gs-body>
        */}).replace(/\{\{STRPATH\}\}/gi, strFolderName);
        
        GS.openDialogToElement(target, templateElement, 'right', '', function (event, strAnswer) {
            if (strAnswer === 'Yes') {
                //console.log('Delete:', strPath);
                
                GS.requestFromSocket(GS.envSocket
                                   , 'FILE\tDELETE\t' + GS.encodeForTabDelimited(strPath) + '\n'
                                   , function (data, error, errorData) {
                    if (!error && data.trim() && data.indexOf('Failed to get canonical path') === -1) {
                        if (data === 'TRANSACTION COMPLETED') {
                            getData(element);
                        }
                    } else if (error) {
                        GS.webSocketErrorDialog(errorData);
                    }
                });
            }
        });
    }
    
    function newFolder(element, target) {
        'use strict';
        var templateElement = document.createElement('template');
        
        templateElement.setAttribute('data-overlay-close', 'true');
        templateElement.setAttribute('data-max-width', '250px');
        templateElement.innerHTML = ml(function () {/*
            <gs-body padded>
                <label for="gs-file-manager-text-folder-name">New Folder Name:</label>
                <gs-text id="gs-file-manager-text-folder-name"></gs-text>
                <hr />
                <gs-grid>
                    <gs-block><gs-button dialogclose style="border-right: 0 none;" remove-right>Cancel</gs-button></gs-block>
                    <gs-block><gs-button dialogclose remove-left>Create</gs-button></gs-block>
                </gs-grid>
            </gs-body>
        */});
        
        GS.openDialogToElement(target, templateElement, 'down', '', function (event, strAnswer) {
            var strPath;
            
            if (strAnswer === 'Create') {
                strPath = getPath(element) + document.getElementById('gs-file-manager-text-folder-name').value;
                //console.log('Create:', strPath);
                
                GS.requestFromSocket(GS.envSocket
                                   , 'FILE\tCREATE_FOLDER\t' + GS.encodeForTabDelimited(strPath) + '\n'
                                   , function (data, error, errorData) {
                    if (!error && data.trim() && data.indexOf('Failed to get canonical path') === -1) {
                        if (data === 'TRANSACTION COMPLETED') {
                            getData(element);
                        }
                    } else if (error) {
                        GS.webSocketErrorDialog(errorData);
                    }
                });
            }
        });
    }
    
    function folderOpen(element, target) {
        'use strict';
        var lineElement = GS.findParentElement(target, '.folder-line');
        
        element.arrPath.push(lineElement.getAttribute('data-name'));
        getData(element);
    }
    
    function backFolder(element, target) {
        'use strict';
        element.arrPath.pop();
        getData(element);
    }
    
    // ################################################################################################
    // ######################################## FILE FUNCTIONS ########################################
    // ################################################################################################
    
    function fileMenu(element, target) {
        'use strict';
        var lineElement = GS.findParentElement(target, '.file-line')
          , strFileName = lineElement.getAttribute('data-name')
          //, intPeriodIndex = strFileName.indexOf('.')
          //, strFileExtension = strFileName.substring(intPeriodIndex)
          , strPath = getPath(element) + strFileName
          , templateElement = document.createElement('template');
        
        //console.log(strFileExtension);
        
        templateElement.setAttribute('data-overlay-close', 'true');
        templateElement.setAttribute('data-max-width', '250px');
        templateElement.innerHTML = ml(function () {/*
            <gs-body padded>
                <gs-button dialogclose remove-bottom style="border-bottom: 0 none;">Rename File</gs-button>
                <gs-button dialogclose remove-all style="border-bottom: 0 none;">Delete File</gs-button>
                <gs-button dialogclose remove-top>Edit File</gs-button>
                <hr />
                <gs-button dialogclose>Cancel</gs-button>
            </gs-body>
        */});
        
        GS.openDialogToElement(target, templateElement, 'right', '', function (event, strAnswer) {
            if (strAnswer === 'Rename File') {
                fileRename(element, target, strPath, strFileName);
                
            } else if (strAnswer === 'Delete File') {
                fileDelete(element, target, strPath, strFileName);
                
            } else if (strAnswer === 'Edit File') {
                fileEdit(element, target, strPath, strFileName);
            }
        });
    }
    
    function fileRename(element, target, strOldPath, strFileName) {
        'use strict';
        var templateElement = document.createElement('template');
        
        templateElement.setAttribute('data-overlay-close', 'true');
        templateElement.setAttribute('data-max-width', '250px');
        templateElement.innerHTML = ml(function () {/*
            <gs-body padded>
                <label for="gs-file-manager-text-file-name">File Name:</label>
                <gs-text id="gs-file-manager-text-file-name"></gs-text>
                <hr />
                <gs-grid>
                    <gs-block><gs-button dialogclose style="border-right: 0 none;" remove-right>Cancel</gs-button></gs-block>
                    <gs-block><gs-button dialogclose remove-left>Rename</gs-button></gs-block>
                </gs-grid>
            </gs-body>
        */});
        
        GS.openDialogToElement(target, templateElement, 'right', function () {
            document.getElementById('gs-file-manager-text-file-name').value = strFileName;
            
        }, function (event, strAnswer) {
            var strNewPath;
            
            if (strAnswer === 'Rename') {
                strNewPath = getPath(element) + document.getElementById('gs-file-manager-text-file-name').value;
                
                //console.log('strOldPath:', strOldPath);
                //console.log('strNewPath:', strNewPath);
                
                GS.requestFromSocket(GS.envSocket
                                   , 'FILE\tMOVE\t' + GS.encodeForTabDelimited(strOldPath) + '\t' +
                                                      GS.encodeForTabDelimited(strNewPath) + '\n'
                                   , function (data, error, errorData) {
                    if (!error && data.trim() && data.indexOf('Failed to get canonical path') === -1) {
                        if (data === 'TRANSACTION COMPLETED') {
                            getData(element);
                        }
                    } else if (error) {
                        GS.webSocketErrorDialog(errorData);
                    }
                });
            }
        });
    }
    
    function fileDelete(element, target, strPath, strFileName) {
        'use strict';
        var templateElement = document.createElement('template');
        
        templateElement.setAttribute('data-overlay-close', 'true');
        templateElement.setAttribute('data-max-width', '250px');
        templateElement.innerHTML = ml(function () {/*
            <gs-body padded>
                Are you sure you want to delete the file: "<b>{{STRPATH}}</b>"?
                <hr />
                <gs-grid>
                    <gs-block><gs-button dialogclose style="border-right: 0 none;" remove-right>No</gs-button></gs-block>
                    <gs-block><gs-button dialogclose remove-left>Yes</gs-button></gs-block>
                </gs-grid>
            </gs-body>
        */}).replace(/\{\{STRPATH\}\}/gi, strFileName);
        
        GS.openDialogToElement(target, templateElement, 'right', '', function (event, strAnswer) {
            if (strAnswer === 'Yes') {
                //console.log('Delete:', strPath);
                
                GS.requestFromSocket(GS.envSocket
                                   , 'FILE\tDELETE\t' + GS.encodeForTabDelimited(strPath) + '\n'
                                   , function (data, error, errorData) {
                    if (!error && data.trim() && data.indexOf('Failed to get canonical path') === -1) {
                        if (data === 'TRANSACTION COMPLETED') {
                            getData(element);
                        }
                    } else if (error) {
                        GS.webSocketErrorDialog(errorData);
                    }
                });
            }
        });
    }
    
    function fileEdit(element, target, strPath, strFileName) {
        'use strict';
        window.open('/env/app/all/file_manager/file_edit.html?socket=true&link=' + encodeURIComponent(strPath));
    }
    
    function newFile(element, target) {
        'use strict';
        var templateElement = document.createElement('template');
        
        templateElement.setAttribute('data-overlay-close', 'true');
        templateElement.setAttribute('data-max-width', '250px');
        templateElement.innerHTML = ml(function () {/*
            <gs-body padded>
                <label for="gs-file-manager-text-file-name">New File Name:</label>
                <gs-text id="gs-file-manager-text-file-name"></gs-text>
                <hr />
                <gs-grid>
                    <gs-block><gs-button dialogclose style="border-right: 0 none;" remove-right>Cancel</gs-button></gs-block>
                    <gs-block><gs-button dialogclose remove-left>Create</gs-button></gs-block>
                </gs-grid>
            </gs-body>
        */});
        
        GS.openDialogToElement(target, templateElement, 'down', '', function (event, strAnswer) {
            var strPath;
            var strName = document.getElementById('gs-file-manager-text-file-name').value || '';
            
            //console.log('Name:', strName);
            
            if (strAnswer === 'Create' && strName) {
                strPath = getPath(element) + strName;
                //console.log('Create:', strPath);
                
                if (document.getElementById('gs-file-manager-text-file-name').value.trim()) {
                    GS.requestFromSocket(GS.envSocket
                                       , 'FILE\tCREATE_FILE\t' + GS.encodeForTabDelimited(strPath) + '\n'
                                       , function (data, error, errorData) {
                        if (!error && data.trim() && data.indexOf('Failed to get canonical path') === -1) {
                            if (data === 'TRANSACTION COMPLETED') {
                                getData(element);
                            }
                        } else if (error) {
                            GS.webSocketErrorDialog(errorData);
                        }
                    });
                }
            }
        });
    }
    
    function fileOpen(element, target) {
        'use strict';
        var lineElement = GS.findParentElement(target, '.file-line');
        
        window.open(location.protocol + '//' + location.host + getRealPath(element) + '' + lineElement.getAttribute('data-name'));
    }
    
    
    // ################################################################################################
    // ############################################# XTAG #############################################
    // ################################################################################################
    
    function elementInserted(element) {
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                element.internal = {};
                saveDefaultAttributes(element);
                
                prepareElement(element);
                bindElement(element);
                
                //// if no "qs" set or "qs" key set in query string <- non-standard behaviour, you could want 
                //if ((!element.hasAttribute('qs') || GS.qryGetVal(GS.getQueryString(), element.getAttribute('qs')))) {
                //    getData(element);
                //}
                
                getData(element);
                //pushReplacePopHandler(element);
            }
        }
    }
    
    xtag.register('gs-folder', {
        lifecycle: {
            inserted: function () {
                elementInserted(this);
            },
            
            attributeChanged: function (strAttrName, oldValue, newValue) {
                // if "suspend-created" has been removed: run created and inserted code
                if (strAttrName === 'suspend-created' && newValue === null) {
                    elementInserted(this);
                    
                // if "suspend-inserted" has been removed: run inserted code
                } else if (strAttrName === 'suspend-inserted' && newValue === null) {
                    elementInserted(this);
                    
                } else if (!this.hasAttribute('suspend-created') && !this.hasAttribute('suspend-inserted')) {
                    
                }
            }
        },
        events: {},
        accessors: {},
        methods: {}
    });
}());