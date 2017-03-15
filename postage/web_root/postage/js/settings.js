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
    var customCSSText
    if (customCSS === '' ||
            customCSS === undefined ||
            customCSS === null ||
            customCSS === 'undefined' ||
            customCSS === 'null') {
        customCSSText = '\n\n\n\n\n';
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

function getNewCss () {

}

window.addEventListener('load', function () {
    refreshCustomCSS(localStorage.customCSS);
});
























