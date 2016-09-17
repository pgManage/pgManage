//global GS, window, ml
//jslint white:true multivar:true

window.addEventListener('design-register-element', function () {
    window.designElementProperty_GSFILEMANAGER = function(selectedElement) {
        addProp('Column In Querystring', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('qs') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'qs', this.value, false);
        });
        
        addProp('Path', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('path') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'path', this.value);
        });
        
        addProp('Folder', true, '<gs-select class="target" value="' + (selectedElement.getAttribute('folder') || '') + '" mini>' +
                                    '<option value="role">Role (user files)</option>' +
                                    '<option value="web_root">Public (developer editable files)</option>' +
                                    '<option value="dev">App/Dev (developer editable files)</option>' +
                                '</gs-select>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'folder', this.value);
        });
        
        addProp('Mini', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('mini')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'mini', (this.value === 'true'), true);
        });
    };
    
    registerDesignSnippet('<gs-file-manager>', '<gs-file-manager>', 'gs-file-manager path="${0:/}" folder="${1:role}"></gs-file-manager>');
    
    designRegisterElement('gs-file-manager', (location.pathname.indexOf('/v1/') === 0 ? '/v1/dev/' : '/env/app/') + 'developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-file-manager.html');
});

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    
    function pushReplacePopHandler(element) {
        var strQueryString = GS.getQueryString(), strQSCol = element.getAttribute('qs');
        
        if (GS.qryGetKeys(strQueryString).indexOf(strQSCol) > -1) {
            if (element.getAttribute('folder') === 'dev') {
                element.innerPath = 'app/' + GS.templateWithQuerystring(GS.trim(element.getAttribute('path'), '/') + '/');
            } else {
                element.innerPath = element.getAttribute('folder') + '/' + GS.templateWithQuerystring(GS.trim(element.getAttribute('path'), '/') + '/');
            }
            element.getFiles();
        }
    }
    
    // dont do anything that modifies the element here
    function elementCreated(element) {
        // if "created" hasn't been suspended: run created code
        if (!element.hasAttribute('suspend-created')) {
            
        }
    }
    
    //
    function elementInserted(element) {
        var styleElement;
        
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                
                if (element.getAttribute('folder') !== 'dev' &&
                    element.getAttribute('folder') !== 'role' &&
                    element.getAttribute('folder') !== 'web_root') {
                    throw 'gs-file-manager Error: Invalid Folder. Please set the folder attribute to "dev", "role" or "web_root".';
                }
                
                if (!element.getAttribute('path')) {
                    throw 'gs-file-manager Error: Invalid Path. Please set the path attribute.';
                }
                
                // bind/handle query string
                if (element.getAttribute('qs')) {
                    window.addEventListener('pushstate',    function () { pushReplacePopHandler(element); });
                    window.addEventListener('replacestate', function () { pushReplacePopHandler(element); });
                    window.addEventListener('popstate',     function () { pushReplacePopHandler(element); });
                }
                
                if (element.getAttribute('folder') === 'dev') {
                    element.innerPath = 'app/' + GS.templateWithQuerystring(GS.trim(element.getAttribute('path'), '/') + '/');
                } else {
                    element.innerPath = element.getAttribute('folder') + '/' + GS.templateWithQuerystring(GS.trim(element.getAttribute('path'), '/') + '/');
                }
                element.getFiles();
                
                element.innerHTML = 
                    '<div class="root" gs-dynamic flex-vertical flex-fill>' +
                        '<div class="file-manager-list" gs-dynamic flex></div>' +
                        (element.hasAttribute('no-upload') ? '' : '<gs-button class="file-manager-upload" gs-dynamic>New File</gs-button>') +
                        '<iframe class="file-manager-upload-response-iframe" name="upload_response_' +
                                    (document.getElementsByClassName('file-manager-upload-response-iframe').length + 1) + '" hidden></iframe>' +
                    '</div>';
                
                element.fileListElement       = xtag.query(element, '.file-manager-list')[0];
                element.uploadButtonElement   = xtag.query(element, '.file-manager-upload')[0];
                element.responseIframeElement = xtag.query(element, '.file-manager-upload-response-iframe')[0];
                
                element.fileListElement.addEventListener('click', function (event) {
                    //console.log(event.target);
                    
                    if (event.target.classList.contains('edit-file')) {
                        element.editFile(event.target.parentNode.getAttribute('data-link'));
                        
                    } else if (event.target.classList.contains('delete-file')) {
                        element.deleteFile(event.target.parentNode.getAttribute('data-link'));
                    }
                });
                
                element.uploadButtonElement.addEventListener('click', function () {
                    element.newFile();
                });
                
                element.responseIframeElement.addEventListener('load', function (event) {
                    var strResponseText = element.responseIframeElement.contentWindow.document.body.textContent,
                        jsnResponse, strResponse, bolError, strError;
                    
                    if (element.responseIframeElement.loadListen === true) {
                        // get error text
                        try {
                            jsnResponse = JSON.parse(strResponseText);
                            
                        } catch (err) {
                            strResponse = strResponseText;
                        }
                        
                        if (jsnResponse) {
                            if (jsnResponse.stat === true) {
                                bolError = false;
                            } else {
                                bolError = true;
                                if (jsnResponse.dat && jsnResponse.dat.error) {
                                    strError = jsnResponse.dat.error;
                                } else {
                                    strError = jsnResponse.dat;
                                }
                            }
                        } else {
                            bolError = true;
                            strError = strResponse;
                        }
                        
                        // if no error destroy new file popup
                        if (!bolError) {
                            GS.closeDialog(element.currentUploadDialog, 'cancel');
                            
                        // if error open error popup
                        } else {
                            GS.msgbox('Error', strError, 'okonly');
                        }
                        
                        element.getFiles(true);
                        GS.removeLoader('file-upload');
                    }
                });
                
                //console.log(element.fileListElement, element.uploadButtonElement);
            }
        }
    }
    
    xtag.register('gs-file-manager', {
        lifecycle: {
            created: function () {
                elementCreated(this);
            },
            
            inserted: function () {
                elementInserted(this);
            },
            
            attributeChanged: function (strAttrName, oldValue, newValue) {
                // if "suspend-created" has been removed: run created and inserted code
                if (strAttrName === 'suspend-created' && newValue === null) {
                    elementCreated(this);
                    elementInserted(this);
                    
                // if "suspend-inserted" has been removed: run inserted code
                } else if (strAttrName === 'suspend-inserted' && newValue === null) {
                    elementInserted(this);
                    
                } else if (!this.hasAttribute('suspend-created') && !this.hasAttribute('suspend-inserted')) {
                    if (strAttrName === 'path' || strAttrName === 'folder') {
                        
                        if (this.getAttribute('folder') === 'dev') {
                            this.innerPath = 'app/' + GS.templateWithQuerystring(GS.trim(this.getAttribute('path'), '/') + '/');
                        } else {
                            this.innerPath = this.getAttribute('folder') + '/' + GS.templateWithQuerystring(GS.trim(this.getAttribute('path'), '/') + '/');
                        }
                        this.getFiles();
                    }
                }
            }
        },
        events: {},
        accessors: {
            'value': {
                get: function () {
                    return this.arrFileLinks || [];
                }
            }
        },
        methods: {
            newFile: function () {
                var element = this, templateElement = document.createElement('template');
                
                templateElement.innerHTML = ml(function () {/*
                    <gs-page>
                        <gs-header><center><h3>Upload a File</h3></center></gs-header>
                        <gs-body padded>
                            <form class="upload-form" action="/env/action_upload" method="POST" target="{{TARGETNAME}}"
                                        enctype="multipart/form-data">
                                <label>File:</label>
                                <gs-text class="upload-file" name="file_content" type="file"></gs-text>
                                <br />
                                <label>File Name:</label>
                                <gs-text class="upload-name"></gs-text><br />
                                
                                <input class="upload-path" name="file_name" hidden />
                            </form>
                        </gs-body>
                        <gs-footer>
                            <gs-grid>
                                <gs-block><gs-button dialogclose>Cancel</gs-button></gs-block>
                                <gs-block><gs-button class="upload-button">Upload File</gs-button></gs-block>
                            </gs-grid>
                        </gs-footer>
                    </gs-page>
                */}).replace(/\{\{TARGETNAME\}\}/gim, this.responseIframeElement.getAttribute('name'));
                
                GS.openDialog(templateElement, function () {
                    var formElement = xtag.query(this, '.upload-form')[0],
                        fileControl = xtag.query(this, '.upload-file')[0],
                        nameControl = xtag.query(this, '.upload-name')[0],
                        pathControl = xtag.query(this, '.upload-path')[0],
                        uploadButton = xtag.query(this, '.upload-button')[0];
                    
                    element.currentUploadDialog = this;
                    
                    // upload existing file
                    uploadButton.addEventListener('click', function(event) {
                        var strFile = fileControl.value, strName = nameControl.value;
                        
                        //console.log(element.innerPath + nameControl.value);
                        pathControl.setAttribute('value', element.innerPath + nameControl.value);
                        
                        if (strName === '' && strFile === '') { // no values (no file and no file name)
                            GS.msgbox('Error', 'No values in form. Please fill in the form.', 'okonly');
                            
                        } else if (strFile === '') { // one value missing (no file)
                            GS.msgbox('Error', 'No file selected. Please select a file using the file input.', 'okonly');
                            
                        } else if (strName === '') { // one value missing (no file name)
                            GS.msgbox('Error', 'No value in file path textbox. Please fill in file name textbox.', 'okonly');
                            
                        } else { // values are filled in submit the form
                            element.responseIframeElement.loadListen = true;
                            formElement.submit();
                            GS.addLoader('file-upload', 'Uploading file...');
                        }
                    });
                    
                    fileControl.addEventListener('change', function(event) {
                        var strValue = this.value;
                        
                        nameControl.value = strValue.substring(strValue.lastIndexOf('\\') + 1);
                        nameControl.focus();
                    });
                    
                    nameControl.addEventListener('keydown', function(event) {
                        if (event.keyCode === 13) {
                            GS.triggerEvent('click', uploadButton);
                        }
                    });
                });
            },
            
            editFile: function (strPath) {
                var element = this, strFolder = this.getAttribute('folder'), strLink;
                
                //console.log('editFile: ', strPath);
                if (strFolder === 'dev') {
                    strLink = '/v1/dev/developer_g/greyspots-' + GS.version() + '/tools/file_manager/file_edit.html';
                    
                } else if (strFolder === 'role') {
                    strLink = '/env/app/all/file_manager/file_edit.html';
                    
                } else {
                    strLink = '/v1/dev/developer_g/greyspots-' + GS.version() + '/tools/file_manager/file_edit.html';
                }
                
                GS.msgbox('Update File',
                          '<gs-button jumbo dialogclose>Rename File</gs-button>' +
                          '<gs-button jumbo dialogclose href="' + strLink + '?folder=' + strFolder +
                                                                        '&link=' + encodeURIComponent(strPath) + '">' +
                              'Edit File' +
                          '</gs-button>',
                          ['Cancel'],
                          function (strAnswer) {
                    if (strAnswer === 'Rename File') {
                        element.renameFile(strPath);
                    }
                });
                
            },
            
            renameFile: function (strPath) {
                var element = this, templateElement = document.createElement('template'), strFolder = this.getAttribute('folder');
                
                //console.log('renameFile: ', strPath);
                
                templateElement.innerHTML = ml(function () {/*
                    <gs-page>
                        <gs-header><center><h3>Rename File</h3></center></gs-header>
                        <gs-body padded>
                            <label>File Name:</label>
                            <gs-text class="text-update-name" value="{{FILENAME}}"></gs-text>
                        </gs-body>
                        <gs-footer>
                            <gs-grid>
                                <gs-block><gs-button dialogclose>Cancel</gs-button></gs-block>
                                <gs-block><gs-button dialogclose listen-for-return bg-primary>Rename</gs-button></gs-block>
                            </gs-grid>
                        </gs-footer>
                    </gs-page>
                */}).replace('{{FILENAME}}', strPath.substring(strPath.lastIndexOf('/') + 1));
                
                GS.openDialog(templateElement, '', function (event, strAnswer) {
                    var strNewFileName;
                    
                    if (strAnswer === 'Rename') {
                        strNewFileName = xtag.query(this, '.text-update-name')[0].value;
                        
                        GS.addLoader('file-rename', 'Renaming File...');
                        GS.ajaxJSON('/env/action_file', 'action=mv_file&folder=' + strFolder +
                                        '&paths_from=' + encodeURIComponent('["' + strPath + '"]') +
                                        '&paths_to=' + encodeURIComponent('["' + strPath.substring(0, strPath.lastIndexOf('/') + 1) + strNewFileName + '"]'),
                                        function (data, error) {
                            GS.removeLoader('file-rename');
                            
                            if (!error) {
                                element.getFiles(true);
                                
                            } else {
                                GS.ajaxErrorDialog(data, function() {
                                    updateFile(strFileName);
                                });
                            }
                        });
                    }
                });
            },
            
            deleteFile: function (strPath) {
                var element = this, strFolder = this.getAttribute('folder');
                
                //console.log('deleteFile: ', strPath);
                
                GS.msgbox('Are you sure...', 'Are you sure you want to delete this file?', ['No', 'Yes'], function (strAnswer) {
                    if (strAnswer === 'Yes') {
                        GS.addLoader('file-delete', 'Deleting File...');
                        GS.ajaxJSON('/env/action_file', 'action=rm&folder=' + strFolder +
                                                         '&paths=' + encodeURIComponent('["' + strPath + '"]'),
                                                         function (data, error) {
                            GS.removeLoader('file-delete');
                            
                            if (!error) {
                                element.getFiles(true);
                                
                            } else {
                                GS.ajaxErrorDialog(data, function() {
                                    deleteFile(strFileName);
                                });
                            }
                        });
                    }
                });
            },
            
            getFiles: function (bolChange) {
                var element = this, strFolder = this.getAttribute('folder');
                
                //app,role,web_root
                
                GS.ajaxJSON('/env/action_file', 'action=list&folder=' + strFolder + '&path=' + encodeURIComponent(this.innerPath),
                                function (response, error) {
                    var i, len, strHTML = '', data, strFileName, strCurrentPath, strAnchorPath;
                    
                    if (!error && response.dat.files.length > 0) {
                        data = response.dat;
                        data.files = data.files || [];
                        data.files.sort();
                        
                        element.arrFileLinks = data.files;
                        
                        for (i = 0, len = data.files.length; i < len; i += 1) {
                            strFileName = encodeHTML(data.files[i]);
                            strCurrentPath = GS.trim(element.innerPath, '/') + '/' + strFileName;
                            
                            //if (strFolder === 'dev') {
                            //    if (strAnchorPath.indexOf('developer_g') === 0) {
                            //        strAnchorPath = encodeHTML('/v1/dev/' + strCurrentPath);
                            //    } else {
                            //        strAnchorPath = encodeHTML('/env/app/' + strCurrentPath);
                            //    }
                            //    
                            //} else if (strFolder === 'role') {
                            //    strAnchorPath = encodeHTML('/env/role/' + strCurrentPath);
                            //    
                            //} else {
                            //    strAnchorPath = encodeHTML('/' + strCurrentPath);
                            //}
                            
                            if (strFolder === 'web_root') {
                                strAnchorPath = encodeHTML('/' + strCurrentPath);
                                
                            } else {
                                strAnchorPath = encodeHTML('/v1/' + strCurrentPath);
                            }
                            
                            strHTML += 
                                '<div flex-horizontal flex-fill data-link="' + strCurrentPath + '">' +
                                    '<gs-button class="goto-file" href="' + strAnchorPath + '" remove-all flex>' + strFileName + '</gs-button>' +
                                    '<gs-button class="edit-file" icononly icon="pencil" remove-all></gs-button>' +
                                    '<gs-button class="delete-file" icononly icon="times" remove-all></gs-button>' +
                                '</div>';
                        }
                    } else {
                        element.arrFileLinks = [];
                        strHTML = '<center><span class="h1 hint">No Files</span></center>';
                    }
                    
                    if (bolChange) {
                        GS.triggerEvent(element, 'change');
                    }
                    
                    element.fileListElement.innerHTML = strHTML;
                });
            },
            
            refresh: function () {
                this.getFiles();
            }
        }
    });
});