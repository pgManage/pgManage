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

                document.getElementById('ace-toolbar-labeled-' + curr_tab_num + '').style.display = 'none';
                document.getElementById('ace-toolbar-unlabeled-' + curr_tab_num + '').style.display = '';
            }
        }
    } else {
        // set to labeled buttons
        for (var i = 0, len = xtag.query(document.body, '.tab-button').length; i < len; i += 1) {
            curr_toolbar = xtag.query(document.body, '.tab-button')[i];
            if (curr_toolbar.relatedEditorToolbar) {
                curr_tab_num = curr_toolbar.relatedEditorToolbar.id.substring(parseInt(curr_toolbar.relatedEditorToolbar.id.lastIndexOf('-'), 10) + 1, curr_toolbar.relatedEditorToolbar.id.length);

                document.getElementById('ace-toolbar-labeled-' + curr_tab_num + '').style.display = '';
                document.getElementById('ace-toolbar-unlabeled-' + curr_tab_num + '').style.display = 'none';
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
