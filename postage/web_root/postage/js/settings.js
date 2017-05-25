//global window, GS, document, evt

var bolSettingsLoaded = true;

function refreshButtons (bolBtnType) {
    'use strict';
    var curr_toolbar, curr_tab_num, tabElement, bolBtnLabeled;
    if (bolBtnType === '' ||
        bolBtnType === undefined ||
        bolBtnType === null ||
        bolBtnType === 'undefined' ||
        bolBtnType === 'null') {
        bolBtnLabeled = true;
    } else {
        bolBtnLabeled = bolBtnType;
    }
    localStorage.labeledButtons = bolBtnLabeled;
    if (bolBtnLabeled === 'false' || bolBtnLabeled === false) {
        // set to unlabeled buttons
        for (var i = 0, len = xtag.query(document.body, '.tab-button').length; i < len; i += 1) {
            curr_toolbar = xtag.query(document.body, '.tab-button')[i];
            if (curr_toolbar.relatedEditorToolbar) {
                curr_tab_num = curr_toolbar.relatedEditorToolbar.id.substring(parseInt(curr_toolbar.relatedEditorToolbar.id.lastIndexOf('-'), 10) + 1, curr_toolbar.relatedEditorToolbar.id.length);

                document.getElementById('sql-ace-toolbar-' + curr_tab_num + '').classList.add('ace-toolbar-unlabeled');
                document.getElementById('sql-ace-toolbar-' + curr_tab_num + '').classList.remove('ace-toolbar-labeled');
            }
        }
    } else {
        // set to labeled buttons
        for (var i = 0, len = xtag.query(document.body, '.tab-button').length; i < len; i += 1) {
            curr_toolbar = xtag.query(document.body, '.tab-button')[i];
            if (curr_toolbar.relatedEditorToolbar) {
                curr_tab_num = curr_toolbar.relatedEditorToolbar.id.substring(parseInt(curr_toolbar.relatedEditorToolbar.id.lastIndexOf('-'), 10) + 1, curr_toolbar.relatedEditorToolbar.id.length);

                document.getElementById('sql-ace-toolbar-' + curr_tab_num + '').classList.remove('ace-toolbar-unlabeled');
                document.getElementById('sql-ace-toolbar-' + curr_tab_num + '').classList.add('ace-toolbar-labeled');
            }
        }
    // console.log(xtag.query(document.body, '.current-tab')[0].relatedEditorToolbar.parentElement);
    }
}

function refreshCustomCSS (customCSS) {
    'use strict';
    var customCSSText;
    if (customCSS === '' ||
        customCSS === undefined ||
        customCSS === null ||
        customCSS === 'undefined' ||
        customCSS === 'null') {
//        customCSSText = '\n\n\n\n\n';
        customCSSText = ml(function () {/*
/* Default SQL Results CSS * /
.sql-results-area {
	word-wrap: break-word;
	text-align: left;
	color: #333;
	font-family: Helvetica,Arial,sans-serif;
	font-size: 14px;
	line-height: 1.42857;
}

/* Monospace SQL Results CSS, Uncomment to Activate * /
/*
.sql-results-area {
	word-wrap: break-word;
	text-align: left;
	color: #333;
	font-family: "Monaco","Menlo","Ubuntu Mono","Consolas","source-code-pro",monospace;
	font-feature-settings: normal;
	font-kerning: auto;
	font-language-override: normal;
	font-size: 11.2px;
	font-size-adjust: none;
	font-stretch: normal;
	font-style: normal;
	font-synthesis: weight style;
	font-variant: normal;
	font-variant-alternates: normal;
	font-variant-caps: normal;
	font-variant-east-asian: normal;
	font-variant-ligatures: normal;
	font-variant-numeric: normal;
	font-variant-position: normal;
	font-weight: 400;
}
* /
*/}).replace(/\* \//g, '*/');
    } else {
        customCSSText = customCSS;
    }
    localStorage.customCSS = customCSSText;
    var CSSElements = document.getElementsByClassName('customCss');
    // for (var i = 0, len = CSSElements.length; i < len; i++) {
    //     console.log(CSSElements);
    //     CSSElements[i].innerHTML = customCSSText;
    // }
    document.getElementById('customCss').innerHTML = customCSSText;
    //GS.triggerEvent(window, 'resize');
}

window.addEventListener('load', function () {
    refreshCustomCSS(localStorage.customCSS);
});




function refreshShortcutKeys (shortcutKeys) {
    'use strict';
    var shortcutKeysText = [];
    if (window.navigator.userAgent.toLowerCase().indexOf('macintosh') !== -1) {
        var CTRLCMD = 'Command';
    } else {
        var CTRLCMD = 'Control';
    }
    if (!shortcutKeys) {
        shortcutKeysText = [
              [CTRLCMD,     'o',       'ShortcutNewTab']
            , ['',          'F7',      'ShortcutExplain']
            , ['Shift',     'F7',      'ShortcutExplainAnalyze']
            , ['',          'F5',      'ShortcutRunQuery']
            , [CTRLCMD,     's',       'ShortcutSave']
            , [CTRLCMD,     '.',       'ShortcutDocs']
            , ['',          'Escape',  'ShortcutHome']
            , [CTRLCMD,     'Enter',   'ShortcutRunCursorQuery']
        ];
    } else {
        shortcutKeysText = shortcutKeys;
    }
    localStorage.ShortcutNewTab = shortcutKeysText[0];
    localStorage.ShortcutExplain = shortcutKeysText[1];
    localStorage.ShortcutExplainAnalyze = shortcutKeysText[2];
    localStorage.ShortcutRunQuery = shortcutKeysText[3];
    localStorage.ShortcutSave = shortcutKeysText[4];
    localStorage.ShortcutDocs = shortcutKeysText[5];
    localStorage.ShortcutHome = shortcutKeysText[6];
    localStorage.ShortcutRunCursorQuery = shortcutKeysText[7];
    // var strScript, thisArrText;
    // var keydownShortcuts = '';
    // //strScript = 'function keydownShortcuts (event) {;\n';
    // strScript = 'document.addEventListener("keydown", keydownShortcuts = function (event) {\n';

    // for (var i = 0, len = shortcutKeysText.length; i < len; i++) {
    //     thisArrText = shortcutKeysText[i];
    //     console.log(thisArrText);
    //     strScript += '    if (event.key === "' + thisArrText[1] + '"';
    //     if (thisArrText[0] === 'Command') {
    //         strScript += ' && event.metaKey) {\n';
    //     } else if (thisArrText[0] === 'Control') {
    //         strScript += ' && event.ctrlKey) {\n';
    //     } else if (thisArrText[0] === 'Option') {
    //         strScript += ' && event.altKey) {\n';
    //     } else if (thisArrText[0] === 'Shift') {
    //         strScript += ' && event.shiftKey) {\n';
    //     } else {
    //         strScript += ') {\n';
    //     }
    //     strScript += '        ' + thisArrText[2] + '();\n';
    //     strScript += '    }\n';
    // }
    // strScript += '});\n\n';

    // strScript += "document.addEventListener('keydown', keydownShortcuts(event));\n";
    // document.getElementById('shortcutKeys').innerHTML = strScript;
}

document.addEventListener('keydown', function (event) {
    if (keyCodeCheck(event, localStorage.ShortcutNewTab)) {
        ShortcutNewTab();
    } else if (keyCodeCheck(event, localStorage.ShortcutExplainAnalyze)) {
        ShortcutExplainAnalyze();
    } else if (keyCodeCheck(event, localStorage.ShortcutExplain)) {
        ShortcutExplain();
    } else if (keyCodeCheck(event, localStorage.ShortcutRunQuery)) {
        var tabElement = xtag.queryChildren(document.getElementById('tab-bar'), '.current-tab')[0];
        if (tabElement.parentNode) {
            if (tabElement.executedWaitingForKeyup !== true) {

                tabElement.executedWaitingForKeyup = true;
                executeScript();
                event.preventDefault();
                event.stopPropagation();
            }
        }
    } else if (keyCodeCheck(event, localStorage.ShortcutSave)) {
        ShortcutSave();
    } else if (keyCodeCheck(event, localStorage.ShortcutRunCursorQuery)) {
        event.preventDefault();
        event.stopPropagation();
        executeScript(true);
    } else if (keyCodeCheck(event, localStorage.ShortcutDocs)) {
        ShortcutDocs();
    } else if (keyCodeCheck(event, localStorage.ShortcutHome)) {
        ShortcutHome();
    }
});

document.addEventListener('keyup', function (event) {
    if (keyCodeCheck(event, localStorage.ShortcutRunQuery)) {
        var tabElement = xtag.queryChildren(document.getElementById('tab-bar'), '.current-tab')[0];
        if (tabElement.parentNode) {
            tabElement.executedWaitingForKeyup = false;
            event.preventDefault();
            event.stopPropagation();
            console.log('yes');
        }
    }
});



function keyCodeCheck(event, storage) {
    if (storage.substring(0, storage.indexOf(',')) === 'Command') {
        if (event.metaKey && event.key.toLowerCase() === storage.substring(parseInt(storage.indexOf(','), 10 ) + 1, storage.lastIndexOf(',')).toLowerCase()) {
            return true;
        } else {
            return false;
        }
    } else if (storage.substring(0, storage.indexOf(',')) === 'Control') {
        if (event.ctrlKey && event.key.toLowerCase() === storage.substring(parseInt(storage.indexOf(','), 10 ) + 1, storage.lastIndexOf(',')).toLowerCase()) {
            return true;
        } else {
            return false;
        }
    } else if (storage.substring(0, storage.indexOf(',')) === 'Option') {
        if (event.altKey && event.key.toLowerCase() === storage.substring(parseInt(storage.indexOf(','), 10 ) + 1, storage.lastIndexOf(',')).toLowerCase()) {
            return true;
        } else {
            return false;
        }
    } else if (storage.substring(0, storage.indexOf(',')) === 'Shift') {
        if (event.shiftKey && event.key.toLowerCase() === storage.substring(parseInt(storage.indexOf(','), 10 ) + 1, storage.lastIndexOf(',')).toLowerCase()) {
            return true;
        } else {
            return false;
        }
    } else {
        if (event.key.toLowerCase() === storage.substring(parseInt(storage.indexOf(','), 10 ) + 1, storage.lastIndexOf(',')).toLowerCase()) {
            return true;
        } else {
            return false;
        }
    }
}



function getShortcuts () {
	try {
        if (window.navigator.userAgent.toLowerCase().indexOf('macintosh') !== -1) {
            var CTRLCMD = 'Command';
        } else {
            var CTRLCMD = 'Control';
        }
        localStorage.ShortcutRunCursorQuery = (localStorage.ShortcutRunCursorQuery || [CTRLCMD,     'Enter',   'ShortcutRunCursorQuery']);
        var ValKeyNewTab = localStorage.ShortcutNewTab.split(',')[1];
        var ValKeySaveTab = localStorage.ShortcutSave.split(',')[1];
        var ValKeyRunQuery = localStorage.ShortcutRunQuery.split(',')[1];
        var ValKeyRunCursorQuery = localStorage.ShortcutRunCursorQuery.split(',')[1];
        var ValKeyFindDocumentation = localStorage.ShortcutDocs.split(',')[1];
        var ValKeyExplain = localStorage.ShortcutExplain.split(',')[1];
        var ValKeyExplainAnalyze = localStorage.ShortcutExplainAnalyze.split(',')[1];
        var ValKeyHome = localStorage.ShortcutHome.split(',')[1];

        var ValMetaKeyNewTab = localStorage.ShortcutNewTab.split(',')[0];
        var ValMetaKeySaveTab = localStorage.ShortcutSave.split(',')[0];
        var ValMetaKeyRunQuery = localStorage.ShortcutRunQuery.split(',')[0];
        var ValMetaKeyRunCursorQuery = localStorage.ShortcutRunCursorQuery.split(',')[0];
        var ValMetaKeyFindDocumentation = localStorage.ShortcutDocs.split(',')[0];
        var ValMetaKeyExplain = localStorage.ShortcutExplain.split(',')[0];
        var ValMetaKeyExplainAnalyze = localStorage.ShortcutExplainAnalyze.split(',')[0];
        var ValMetaKeyHome = localStorage.ShortcutHome.split(',')[0];


	    var ShortcutKeysText = [
	          [ValMetaKeyNewTab              ,     ValKeyNewTab,             'ShortcutNewTab']
	        , [ValMetaKeyExplain             ,     ValKeyExplain,            'ShortcutExplain']
	        , [ValMetaKeyExplainAnalyze      ,     ValKeyExplainAnalyze,     'ShortcutExplainAnalyze']
	        , [ValMetaKeyRunQuery            ,     ValKeyRunQuery,           'ShortcutRunQuery']
	        , [ValMetaKeySaveTab             ,     ValKeySaveTab,            'ShortcutSave']
	        , [ValMetaKeyFindDocumentation   ,     ValKeyFindDocumentation,  'ShortcutDocs']
	        , [ValMetaKeyHome                ,     ValKeyHome,               'ShortcutHome']
	        , [ValMetaKeyRunCursorQuery            ,     ValKeyRunCursorQuery,           'ShortcutRunCursorQuery']
	    ];

	    return ShortcutKeysText;
	} catch (e) {
		return undefined;
	}
}

window.addEventListener('load', function () {
    refreshShortcutKeys(getShortcuts());
});
