
function clearDocumentationFolder() {
    GS.addLoader('loader', 'Ajax running...');
    GS.ajaxJSON('/env/action_fil', 'action=list', function (data, error) {
        if (!error) {
            if (data.dat.directories.indexOf('all') > 0) {
                GS.ajaxJSON('/env/action_fil', 'action=list&path=all', function (data, error) {
                    if (!error) {
                        if (data.dat.directories.indexOf('gsdoc') >= 0) {
                            GS.ajaxJSON('/env/action_fil', 'action=rm' +
                                '&paths=' + encodeURIComponent('[\"all/gsdoc\"]'), function (data, error) {
                                GS.removeLoader('loader');
                                
                                if (!error) {
                                    
                                } else {
                                    GS.ajaxErrorDialog(data);
                                }
                            });
                        } else {
                            GS.removeLoader('loader');
                        }
                    } else {
                        GS.removeLoader('loader');
                        GS.ajaxErrorDialog(data);
                    }
                });
            } else {
                GS.ajaxJSON('/env/action_fil', 'action=create_folder&path=all', function (data, error) {
                    GS.removeLoader('loader');
                    
                    if (!error) {
                    } else {
                        GS.ajaxErrorDialog(data);
                    }
                });
            }
        } else {
            GS.removeLoader('loader');
            GS.ajaxErrorDialog(data);
        }
    });
}

window.addEventListener('load', function () {
    'use strict';
    var testFolderButton = document.getElementById('button-test-folder');

    if (testFolderButton) {
        testFolderButton.addEventListener('click', function () {
            clearDocumentationFolder();
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    //existsDocumentationSchema();
    xtag.register('gs-doc-example', {
        'lifecycle': {
            'created': function () {
                'use strict';
                var element = this, HTMLTemplate, JSTemplate, DBTemplate, strHTML, strHTMLCode, strJSCode, strDBCode,
                    intQSTimer, strHTMLHeight, strJSHeight, strDBHeight;
                
                window.Range = require('ace/range').Range;
                
                HTMLTemplate = xtag.queryChildren(this, 'template[for="html"]')[0];
                JSTemplate   = xtag.queryChildren(this, 'template[for="js"]')[0];
                //DBTemplate   = xtag.queryChildren(this, 'template[for="db"]')[0];
                
                strHTMLCode                 = this.dedentCode(HTMLTemplate.innerHTML);
                if (JSTemplate) { strJSCode = this.dedentCode(JSTemplate.innerHTML); }
                if (DBTemplate) { strDBCode = this.dedentCode(DBTemplate.innerHTML); }
                
                strHTMLHeight                 = HTMLTemplate.getAttribute('height') || '10';
                if (JSTemplate) { strJSHeight = JSTemplate.getAttribute('height') || '10'; }
                if (DBTemplate) { strDBHeight = DBTemplate.getAttribute('height') || '10'; }
                
                // remove templates and add sections
                strHTML =      '<div class="root" gs-dynamic>' +
                               '    <div class="example-parent">' +
                               '        <div class="example-html-ace"></div>' +
                               '        <div class="example-js-ace"></div>' +
                               '        <div class="example-db-ace-status-flag"></div>' +
                               '        <div class="example-db-ace"></div>' +
                               '        <div class="example-display-container" flex-vertical flex-fill>';
                
                if (this.hasAttribute('query-string')) {
                    strHTML += '            <div class="query-string-container" flex-horizontal>' +
                               '                <label>Query String:</label>' +
                               '                <gs-text flex mini class="example-querystring"></gs-text>' +
                               '            </div>';
                }
                
                strHTML +=     '            <iframe class="example-display" flex></iframe>' +
                               '            <div class="example-display-refresh-modal" hidden></div>' +
                               '            <gs-button class="example-display-refresh-button" hidden>Reload Example</gs-button>' +
                               '        </div>' +
                               '    </div>' +
                               '</div>';
                
                this.innerHTML = strHTML;
                
                // gather selectors
                this.root               = xtag.query(this, '.root')[0];
                this.codeContainer      = xtag.query(this, '.example-code-container')[0];
                this.HTMLAce            = xtag.query(this, '.example-html-ace')[0];
                this.JSAce              = xtag.query(this, '.example-js-ace')[0];
                this.DBAce              = xtag.query(this, '.example-db-ace')[0];
                this.DBEditorStatusFlag = xtag.query(this, '.example-db-ace-status-flag')[0];
                this.displayContainer   = xtag.query(this, '.example-display-container')[0];
                this.displayIframe      = xtag.query(this, '.example-display')[0];
                this.refreshModal       = xtag.query(this, '.example-display-refresh-modal')[0];
                this.refreshButton      = xtag.query(this, '.example-display-refresh-button')[0];
                if (this.hasAttribute('query-string')) {
                    this.queryStringControl = xtag.query(this, '.example-querystring')[0];
                }
                
                // create html ace
                this.HTMLEditor = ace.edit(this.HTMLAce);
                this.HTMLEditor.setTheme('ace/theme/eclipse');
                this.HTMLEditor.getSession().setMode('ace/mode/html');
                this.HTMLEditor.setShowPrintMargin(false);
                this.HTMLEditor.setDisplayIndentGuides(true);
                this.HTMLEditor.setShowFoldWidgets(false);
                this.HTMLEditor.session.setUseWorker(false);
                this.HTMLEditor.session.setUseWrapMode('free');
                this.HTMLEditor.setBehavioursEnabled(false);
                this.HTMLEditor.$blockScrolling = Infinity; // <== blocks a warning
                this.HTMLEditor.setOptions({
                    'enableBasicAutocompletion': true,
                    'enableSnippets'           : true,
                    'enableLiveAutocompletion' : true
                });
                
                // bind html ace
                this.HTMLAce.addEventListener('keyup', function () {
                    element.displayRefreshModal();
                });
                
                // set height of HTML ace
                if (strHTMLHeight === 'auto') {
                    this.HTMLEditor.setOptions({ maxLines: Infinity });
                    strHTMLCode += '\n';
                    //this.HTMLAce.style.height = (GS.getTextHeight(this.HTMLAce, true) * strHTMLCode.split('\n').length) + 'px';
                    
                } else {
                    this.HTMLAce.style.height = strHTMLHeight + 'em';
                }
                
                // fill html ace and move the cursor to the beginning
                this.HTMLEditor.setValue(strHTMLCode);
                this.HTMLEditor.selection.setSelectionRange(new Range(0, 0, 0, 0));
                
                // create/bind/fill/height javascript ace if there was a template for it
                if (JSTemplate) {
                    // create javascript ace
                    this.JSEditor = ace.edit(this.JSAce);
                    this.JSEditor.setTheme('ace/theme/eclipse');
                    this.JSEditor.getSession().setMode('ace/mode/javascript');
                    this.JSEditor.setShowPrintMargin(false);
                    this.JSEditor.setDisplayIndentGuides(true);
                    this.JSEditor.setShowFoldWidgets(false);
                    this.JSEditor.session.setUseWorker(false);
                    this.JSEditor.session.setUseWrapMode('free');
                    this.JSEditor.setBehavioursEnabled(false);
                    this.JSEditor.$blockScrolling = Infinity; // <== blocks a warning
                    this.JSEditor.setOptions({
                        'enableBasicAutocompletion': true,
                        'enableSnippets'           : true,
                        'enableLiveAutocompletion' : true
                    });
                    
                    // bind javascript ace
                    this.JSAce.addEventListener('keyup', function () {
                        element.displayRefreshModal();
                    });
                    
                    // set height of JS ace
                    if (strJSHeight === 'auto') {
                        this.JSEditor.setOptions({ maxLines: Infinity });
                        strJSCode += '\n';
                        //this.JSAce.style.height = (GS.getTextHeight(this.JSAce, true) * strJSCode.split('\n').length) + 'px';
                        
                    } else {
                        this.JSAce.style.height = strJSHeight + 'em';
                    }
                    
                    // fill javascript ace and move the cursor to the beginning
                    this.JSEditor.setValue(decodeHTML(strJSCode));
                    this.JSEditor.selection.setSelectionRange(new Range(0, 0, 0, 0));
                }
                
                // create/bind/fill/height DB ace if there was a template for it
                if (DBTemplate) {
                    // create DB ace
                    this.DBEditor = ace.edit(this.DBAce);
                    this.DBEditor.setTheme('ace/theme/eclipse');
                    this.DBEditor.getSession().setMode('ace/mode/pgsql');
                    this.DBEditor.setShowPrintMargin(false);
                    this.DBEditor.setDisplayIndentGuides(true);
                    this.DBEditor.setShowFoldWidgets(false);
                    this.DBEditor.session.setUseWorker(false);
                    this.DBEditor.session.setUseWrapMode('free');
                    this.DBEditor.setBehavioursEnabled(false);
                    this.DBEditor.$blockScrolling = Infinity; // <== blocks a warning
                    this.DBEditor.setOptions({
                        'enableBasicAutocompletion': true,
                        'enableSnippets'           : true,
                        'enableLiveAutocompletion' : true
                    });
                    
                    // bind DB ace
                    this.DBAce.addEventListener('keyup', function () {
                        element.displayRefreshModal(true);
                    });
                    
                    // set height of DB ace
                    if (strDBHeight === 'auto') {
                        this.DBEditor.setOptions({ maxLines: Infinity });
                        strDBCode += '\n';
                        //this.DBAce.style.height = (GS.getTextHeight(this.DBAce, true) * strDBCode.split('\n').length) + 'px';
                        
                    } else {
                        this.DBAce.style.height = strDBHeight + 'em';
                    }
                    
                    // fill DB ace and move the cursor to the beginning
                    this.DBEditor.setValue(decodeHTML(strDBCode));
                    this.DBEditor.selection.setSelectionRange(new Range(0, 0, 0, 0));
                }
                
                // fill/bind query string input it it is turned on
                if (this.hasAttribute('query-string')) {
                    this.queryStringControl.value = this.getAttribute('query-string') || '';
                    
                    this.queryStringControl.addEventListener('keyup', function () {
                        if (intQSTimer) {
                            clearTimeout(intQSTimer);
                        }
                        intQSTimer = setTimeout(function() {
                            //element.refreshDisplay();
                            element.displayIframe.contentWindow.history.pushState({},'','doc-library/doc-target.html');
                            element.displayIframe.contentWindow.history.pushState({},'','doc-library/doc-target.html?' + element.queryStringControl.value);
                            GS.triggerEvent(element.displayIframe.contentWindow, 'pushstate');
                        }, 250);
                    });
                }
                
                // bind example refresh button
                this.refreshButton.addEventListener('click', function () {
                    element.refreshModal.setAttribute('hidden', '');
                    element.refreshButton.setAttribute('hidden', '');
                    
                    element.refreshDisplay(element.refreshButton.bolSQL);
                });
                
                // handle display height
                this.sizeHandler();
                
                // refresh iframe
                this.refreshDisplay(Boolean(DBTemplate));
                
                // if the 'example-refresh' event is triggered on the window: refresh iframe
                window.addEventListener('example-refresh', function () {
                    element.refreshDisplay(Boolean(DBTemplate));
                });
                
                // if the 'example-refresh' event is triggered on the window: refresh iframe
                window.addEventListener('resize', function () {
                    element.sizeHandler();
                });
            }
        },
        'methods': {
            displayRefreshModal: function (bolSQL) {
                'use strict';
                this.refreshModal.removeAttribute('hidden');
                this.refreshButton.removeAttribute('hidden');
                
                this.refreshButton.bolSQL = bolSQL;
            },
            
            refreshDisplay: function (bolSQL) {
                'use strict';
                var element = this, newIframe, loadFunction, strHTML = ml(function () {/*
                    <!DOCTYPE html>
                    <html>
                        <head>
                            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
                            <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1.0, maximum-scale=1.0, minimal-ui" />
                            
                            <script src="/js/greyspots.js" type="text/javascript"></script>
                            <link href="/css/greyspots.css" type="text/css" rel="stylesheet" />
                            
                            <script>
                                window.bolCurl = false;
                            </script>
                            
                            <script>
                                {{JS}}
                            </script>
                        </head>
                        <body>
                            {{HTML}}
                        </body>
                    </html>
                */}).replace(/\{\{HTML\}\}/gim, element.HTMLEditor.getValue());
                
                if (element.JSEditor) {
                    strHTML = strHTML.replace(/\{\{JS\}\}/gim, element.JSEditor.getValue());
                } else {
                    strHTML = strHTML.replace(/\{\{JS\}\}/gim, '');
                }
                
                newIframe = GS.stringToElement('<iframe class="example-display" flex></iframe>'); // tabindex="-1"
                
                //if (element.hasAttribute('query-string')) {
                //    newIframe.setAttribute('src', 'doc-library/doc-target.html?' + element.queryStringControl.value);
                //} else {
                //    newIframe.setAttribute('src', 'doc-library/doc-target.html');
                //}
                
                //newIframe.addEventListener('focus', function (event) {
                //    event.preventDefault();
                //    event.stopPropagation();
                //});
                
                element.displayIframe.parentNode.replaceChild(newIframe, element.displayIframe);
                element.displayIframe = newIframe;
                
                //if (bolSQL) {
                //    //loadFunction = function () {
                //    element.DBEditorStatusFlag.classList.add('running');
                //    GS.ajaxJSON('/sql', element.DBEditor.getValue(), function (data, ajaxError) {
                //        var bolError = false, i, len, errorSQL, errorPos, strError;
                //        
                //        //element.DBEditor.focus();
                //        element.DBEditorStatusFlag.classList.remove('running');
                //        
                //        if (!ajaxError) {
                //            if (data.dat.error === undefined) {
                //                for (i = 0, len = data.dat.length; i < len; i = i + 1) {
                //                    if (data.dat[i].type === 'error') {
                //                        bolError = true;
                //                        errorSQL = data.dat[i].sql;
                //                        errorPos = parseInt(data.dat[i].err_pos, 10);
                //                        
                //                        if (isNaN(errorPos)) {
                //                            strError = data.dat[i].error + '\n' +
                //                                       '<hr/>' +
                //                                       errorSQL;
                //                        } else {
                //                            strError = data.dat[i].error + '\n' +
                //                               'Error found at position: "' + errorPos + '". The position has been marked with "&lt;&lt;".\n\n' +
                //                               '<hr />' +
                //                               errorSQL.substring(0, errorPos) + '<span style="color: #FF0000; font-weight: 900;">&lt;&lt;</span>' +
                //                               errorSQL.substring(errorPos, errorSQL.length);
                //                        }
                //                        
                //                        console.error('Error specific: ', data.dat[i]);
                //                        console.error('All returned data: ', data);
                //                        
                //                        break;
                //                    }
                //                }
                //            }
                //            
                //            if (!bolError) {
                //                element.displayIframe.contentWindow.document.write(strHTML);
                //                
                //                // close the layout stream, causing everything to render
                //                element.displayIframe.contentWindow.document.close();
                //                element.handleQueryString();
                //            } else {
                //                element.displayIframe.contentWindow.document.write(
                //                    '<pre style="white-space: pre-wrap;">' +
                //                        '<center><h3>SQL Error</h3></center>' +
                //                        strError + '<hr />Please see the console if you need more details.' +
                //                    '</pre>');
                //                
                //                // close the layout stream, causing everything to render
                //                element.displayIframe.contentWindow.document.close();
                //                element.handleQueryString();
                //            }
                //            
                //        } else {
                //            GS.ajaxErrorDialog(data, function () {
                //                element.refreshDisplay(true);
                //            });
                //        }
                //    });
                //    //    
                //    //    element.displayIframe.removeEventListener('load', loadFunction);
                //    //};
                //    //element.displayIframe.addEventListener('load', loadFunction);
                //} else {
                    element.displayIframe.contentWindow.document.write(strHTML);
                    
                    // close the layout stream, causing everything to render
                    element.displayIframe.contentWindow.document.close();
                    element.handleQueryString();
                //}
            },
            
            handleQueryString: function () {
                var element = this;
                
                if (element.hasAttribute('query-string')) {
                    element.displayIframe.contentWindow.addEventListener('pushstate', function () {
                        element.queryStringControl.value = element.displayIframe.contentWindow.location.search.substring(1);
                    });
                    element.displayIframe.contentWindow.addEventListener('replacestate', function () {
                        element.queryStringControl.value = element.displayIframe.contentWindow.location.search.substring(1);
                    });
                    element.displayIframe.contentWindow.addEventListener('popstate', function () {
                        element.queryStringControl.value = element.displayIframe.contentWindow.location.search.substring(1);
                    });
                    
                    element.displayIframe.contentWindow.history.pushState({},'','doc-library/doc-target.html');
                    element.displayIframe.contentWindow.history.pushState({},'','doc-library/doc-target.html?' + element.queryStringControl.value);
                    GS.triggerEvent(element.displayIframe.contentWindow, 'pushstate');
                }
            },
            
            dedentCode: function (strCode) {
                'use strict';
                var arrLines, i, len, intChopLength;
                
                strCode = strCode.replace(/=""/gim, '');
                
                if (strCode[0] === '\n') {
                    strCode = strCode.substring(1, strCode.lastIndexOf('\n'));
                }
                
                arrLines = strCode.split('\n');
                intChopLength = arrLines[0].match(/^\s*/i)[0].length;
                
                for (i = 0, len = arrLines.length; i < len; i += 1) {
                    arrLines[i] = arrLines[i].substring(intChopLength, arrLines[i].length);
                }
                
                strCode = arrLines.join('\n');
                
                return strCode;
            },
            
            sizeHandler: function () {
                var newHeight = 0;
                
                if (window.innerWidth <= 768 && !this.displayContainer.style.height) {
                    newHeight += this.HTMLAce.offsetHeight;
                    
                    if (this.JSAce) {
                        newHeight += this.JSAce.offsetHeight;
                    }
                    
                    if (this.DBAce) {
                        newHeight += this.DBAce.offsetHeight;
                    }
                    
                    this.displayContainer.style.height = newHeight + 'px';
                    
                } else if (window.innerWidth > 768 && this.displayContainer.style.height) {
                    this.displayContainer.style.height = '';
                }
            }
        }
    });
});
