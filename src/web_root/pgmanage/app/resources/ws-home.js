/*global ml, GS, xtag, evt, ace, Range, newTab, clearPropertyList, getScriptForAce*/
'use strict';
var bolHomeLoaded = true
  , bolHomeIframeLoaded = false
  , arrTargets = [], arrScripts = [], arrBeautify = [], arrNames = []
  , arrVersions = [], arrToolbarAddons = [], homeEditor;

function loadHome() {
    if (bolHomeIframeLoaded === false) {
        bolHomeIframeLoaded = true;
        // make home the current tab
        if (GS.getQueryString().indexOf('view=') === -1) {
            GS.replaceState({}, '', '?view=home');
        }
        if (GS.qryGetVal(GS.getQueryString(), 'view') === 'home') {
            openHome();
        }
    
        // fill home
        document.getElementById('home-frame').innerHTML = ml(function () {/*
    		<div id="home-ace-toolbar" hidden style="background-color: #cccccc; width: 100%; padding-top: 2px; padding-bottom: 2px;" >
    			<gs-button id="button-home-open-to-new-tab" onclick="openToTab()" title="Open SQL to new tab" inline remove-all>Open SQL to new tab</gs-button><div id="toolbar-addon-container"></div>
    			<gs-button id="button-home-back" icononly icon="times" hidden title="Back" style="float: right;" inline remove-all>Back</gs-button>
    		</div>
            <div class="ace-container-position-container" style="height: 100%;">
                <div class="ace-container">
                    <div id="sql-ace-area-home" class="ace-area"></div>
                </div>
                <div style="width: 100%; height: 100%;" id="iframe-news">
                    <iframe style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; border: 0 none; z-index: 150; background-color: #FFFFFF;" src="/pgmanage/splash.html?version={{PGMANAGE}}&postgres={{POSTGRES}}"></iframe>
                </div>
    			<div style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; border: 0 none; z-index: 200; background-color: #FFFFFF; overflow: auto;" id="object-details-container" hidden></div>
            </div>
        */}).replace(/\{\{PGMANAGE\}\}/g, contextData.pgmanageVersion).replace(/\{\{POSTGRES\}\}/g, contextData.versionNumber);//'10.3');
        // create ace
        homeEditor = ace.edit('sql-ace-area-home');
        homeEditor.setTheme('ace/theme/eclipse');
        homeEditor.getSession().setMode('ace/mode/pgsql');
        homeEditor.setShowPrintMargin(false);
        homeEditor.setDisplayIndentGuides(true);
        homeEditor.setShowFoldWidgets(false);
        homeEditor.session.setUseWrapMode('free');
        homeEditor.setBehavioursEnabled(false);
        homeEditor.$blockScrolling = Infinity; // <== blocks a warning
        homeEditor.setReadOnly(true);
        document.getElementById('sql-ace-area-home').style.backgroundColor = '#EEEEEE';
    
        homeEditor.setOptions({
            'enableBasicAutocompletion': true,
            'enableSnippets'           : true,
            'enableLiveAutocompletion' : true
        });
    
        homeEditor.addEventListener('mousewheel', function () {
            currTab = ['home', homeEditor.getFirstVisibleRow()];
        });
    
        // if we're on a touch device: make the ace grow with it's content
        if (evt.touchDevice) {
            homeEditor.setOptions({
                maxLines: Infinity
            });
            document.getElementById('sql-ace-area-home').classList.add('childrenneedsclick');
            document.getElementById('sql-ace-area-home').style.borderBottom = '1px solid #AAAAAA';
    
        // else: full height
        } else {
            document.getElementById('sql-ace-area-home').style.height = '100%';
        }
    }
}


function openHome() {
    var tabBarContainer = document.getElementById('tab-bar-container');
    var tabBar = document.getElementById('tab-bar');
    var tabFrames = document.getElementById('tab-frames');
    var homeFrame = document.getElementById('home-frame');
    var i;
    var len;
    var arrElements;

    if (tabBarContainer && tabBar && tabFrames && homeFrame) {
        // set a class for the tab bar so that the css can be specificly for home (and remove the class used by the tabs)
        tabBarContainer.classList.add('home-mode');
        tabBarContainer.classList.remove('tab-mode');

        // clear property list
        clearPropertyList();

        // clear current tab
        arrElements = xtag.query(tabBar, '.current-tab');

        i = 0;
        len = arrElements.length;
        while (i < len) {
            arrElements[i].classList.remove('current-tab');
            if (arrElements[i].relatedEditor && autocompleteGlobals.popupOpen) {
                closePopup(arrElements[i].relatedEditor);
            }

            i += 1;
        }

        // clear current frame
        arrElements = xtag.query(tabFrames, '.current-frame');
        i = 0;
        len = arrElements.length;
        while (i < len) {
            arrElements[i].classList.remove('current-frame');
            i += 1;
        }

        // make home the current tab
        homeFrame.classList.add('current-frame');

        // re-load the current script
        if (arrScripts.length > 0) {
            //GS.triggerEvent(arrScripts[arrScripts.length - 1], 'click');
            //console.log(arrToolbarAddons[arrToolbarAddons.length - 1]);
            getScript(arrNames[arrNames.length - 1], arrToolbarAddons[arrToolbarAddons.length - 1], arrScripts[arrScripts.length - 1], true, arrBeautify[arrBeautify.length - 1]);

            //getScriptForAce(arrTargets[arrTargets.length - 1],
            //                arrNames[arrNames.length - 1],
            //                arrScripts[arrScripts.length - 1],
            //                true,
            //                arrToolbarAddons[arrToolbarAddons.length - 1]);
        }
    }
}

var strPreviousScript;
function setQSToHome() {
    'use strict';
    GS.pushQueryString('view=' + (strPreviousScript || 'home'));
}

function addHomeQuery(target, strName, strQuery, strToolbarAddons, bolBeautify) {
    if (arrScripts[arrScripts.length - 1] !== strQuery) {
        arrTargets.push(target);
        arrNames.push(strName);
        arrScripts.push(strQuery);
        arrBeautify.push(bolBeautify);
        arrToolbarAddons.push(strToolbarAddons);
    }

    openHome();
}

function setHomeValue(strName, strText, strToolbarAddons) {
    if (document.getElementById('iframe-news')) {
        document.getElementById('iframe-news').parentNode.removeChild(document.getElementById('iframe-news'));
		document.getElementById('home-ace-toolbar').removeAttribute('hidden');
    }
    document.getElementById('toolbar-addon-container').innerHTML = strToolbarAddons || '';

	document.getElementById('object-details-container').setAttribute('hidden', '');
	document.getElementById('object-details-container').innerHTML = '';
	document.getElementById('button-home-back').setAttribute('hidden', '');

    homeEditor.currentTabName = strName;
    homeEditor.setValue(strText);
    homeEditor.selection.setRange(new Range(0, 0, 0, 0));
    
}

function setObjectDetailValue(strHTML, callback) {
	document.getElementById('object-details-container').removeAttribute('hidden');
	document.getElementById('object-details-container').innerHTML = strHTML;

	document.getElementById('button-home-back').removeAttribute('hidden');
	document.getElementById('button-home-back').addEventListener('click', function () {
		document.getElementById('object-details-container').setAttribute('hidden', '');
		document.getElementById('object-details-container').innerHTML = '';
		document.getElementById('button-home-back').setAttribute('hidden', '');
	});
	callback();
}


function openToTab() {
    var editorSelectionRange = homeEditor.getSelectionRange()
      , strQuery = homeEditor.getValue() , intStart = 0
      , intEnd = 0, i, len, arrLines, newQuery, intCommentStart;

    if (editorSelectionRange.start.row !== editorSelectionRange.end.row ||
        editorSelectionRange.start.column !== editorSelectionRange.end.column) {
        arrLines = strQuery.split('\n');
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

        newQuery = strQuery.substring(intStart, intEnd);
        newTab('sql', (homeEditor.currentTabName || ''), {'strContent': (newQuery || '-- Nothing to open\n\n\n')});
        //console.log(newQuery);
    /* If you're going to do this in the future you have to do this the right way


    } else if (strQuery.lastIndexOf('/*') > 0) {
        arrLines = strQuery.split('\n');
        intCommentStart = strQuery.lastIndexOf('/*');
        console.log(intCommentStart);

        newQuery = strQuery.substring(0, intCommentStart);*/
    } else {
        var querystringview = GS.qryGetVal(GS.getQueryString(), 'view');
        var querystringtype = querystringview.substring(0, querystringview.indexOf(':'));
        if (querystringtype.toLowerCase() === 'objectview' || querystringtype.toLowerCase() === 'objecttable') {
            
            querystringview = querystringview.substring(querystringtype.length + 1, querystringview.length);
            
            var querystringoid = querystringview.substring(0, querystringview.indexOf(':'));
            
            querystringview = querystringview.substring(querystringoid.length + 1, querystringview.length);
            
            var querystringname = querystringview.substring(0, querystringview.length).replace(':', '.');
            
            var preparedQuery = treePrepareQuery(scriptQuery['' + querystringtype + 'NoComment'], querystringoid, querystringname, querystringname)
            //console.log(querystringview, '\n', querystringtype, '\n', querystringoid, '\n', querystringname);
            //console.log(preparedQuery);
            getSingleCellData(preparedQuery, function (strScript) {
                //console.log(strScript);
                if (strScript) {
                    //console.log(strScript);
                    newQuery = strScript;
                    newQuery +=
                        '\n\n\n\n' +
                        '\n\n\n\n' +
                        '\n\n\n\n';
                    newTab('sql', (homeEditor.currentTabName || ''), {'strContent': (SQLBeautify(newQuery) || '-- Nothing to open\n\n\n')});
                } else {
                    newQuery = '\n-- This object\'s script could not be retrieved...' +
                               '\n-- Perhaps this object was dropped and/or recreated?\n\n';
                }
            });
        } else {
            arrLines = strQuery.split('\n');
            newQuery = strQuery;
            
            if (newQuery) {
                newQuery +=
                    '\n\n\n\n' +
                    '\n\n\n\n' +
                    '\n\n\n\n';
                
            }
        
            newTab('sql', (homeEditor.currentTabName || ''), {'strContent': (newQuery || '-- Nothing to open\n\n\n')});
        }
        
    }
}










