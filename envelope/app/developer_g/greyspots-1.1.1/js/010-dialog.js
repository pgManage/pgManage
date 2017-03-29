

window.addEventListener('design-register-element', function () {
    'use strict';
    registerDesignSnippet('Dialog From Template', 'Dialog From Template', 'GS.openDialog(\'${1:templateID}\', function () {\n' +
                                                                          '    // after dialog open \n' +
                                                                          '}, function (event, strAnswer) {\n' +
                                                                          '    if (strAnswer === \'${2:Ok}\') {\n' +
                                                                          '        // before dialog close\n' +
                                                                          '        $0\n' +
                                                                          '    }\n' +
                                                                          '});');
    
    registerDesignSnippet('GS.openDialog', 'GS.openDialog', 'GS.openDialog(\'${1:templateID}\', function () {\n' +
                                                            '    // after dialog open \n' +
                                                            '}, function (event, strAnswer) {\n' +
                                                            '    if (strAnswer === \'${2:Ok}\') {\n' +
                                                            '        // beforedialog close\n' +
                                                            '        $0\n' +
                                                            '    }\n' +
                                                            '});');
    
    
    registerDesignSnippet('GS.closeDialog', 'GS.closeDialog', 'GS.closeDialog(${1:dialog}, ${2:\'Ok\'});');
    registerDesignSnippet('Close Dialog', 'Close Dialog', 'GS.closeDialog(${1:dialog}, ${2:\'Ok\'});');
    
    registerDesignSnippet('GS.msgbox', 'GS.msgbox', 'GS.msgbox(${1:\'Are you sure...\'}, ${2:\'Are you sure you want to do this?\'}, ' +
                                                                            '${3:[\'Cancel\', \'Ok\']}, function (strAnswer) {\n' +
                                                    '    if (strAnswer === ${4:\'Ok\'}) {\n' +
                                                    '        // before dialog close\n' +
                                                    '        $0\n' +
                                                    '    }\n' +
                                                    '});');
    registerDesignSnippet('Message Box', 'Message Box', 'GS.msgbox(${1:\'Are you sure...\'}, ${2:\'Are you sure you want to do this?\'}, ' +
                                                                                '${3:[\'Cancel\', \'Ok\']}, function (strAnswer) {\n' +
                                                        '    if (strAnswer === ${4:\'Ok\'}) {\n' +
                                                        '        // before dialog close\n' +
                                                        '        $0\n' +
                                                        '    }\n' +
                                                        '});');
    
    registerDesignSnippet('GS.inputbox', 'GS.inputbox', 'GS.inputbox(${1:\'Are you sure...\'}, ${2:\'Are you sure you want to do this?\'}, ' +
                                                                                'function (strInputValue) {\n' +
                                                        '    // before dialog close\n' +
                                                        '    $0\n' +
                                                        '});');
    registerDesignSnippet('Input Box', 'Input Box', 'GS.inputbox(${1:\'Are you sure...\'}, ${2:\'Are you sure you want to do this?\'}, ' +
                                                                            'function (strInputValue) {\n' +
                                                    '    // before dialog close\n' +
                                                    '    $0\n' +
                                                    '});');
    
    registerDesignSnippet('GS.openDialogToElement', 'GS.openDialogToElement',
                                        'GS.openDialogToElement(${1:document.getElementById(\'target\')}, \'${2:templateID}\', ' +
                                                                            '\'${3:right}\', function () {\n' +
                                        '    // after dialog open \n' +
                                        '}, function (event, strAnswer) {\n' +
                                        '    if (strAnswer === \'${4:Ok}\') {\n' +
                                        '        // beforedialog close\n' +
                                        '        $0\n' +
                                        '    }\n' +
                                        '});');
    registerDesignSnippet('Dialog For Element', 'Dialog For Element',
                                        'GS.openDialogToElement(${1:document.getElementById(\'target\')}, \'${2:templateID}\', ' +
                                                                            '\'${3:right}\', function () {\n' +
                                        '    // after dialog open \n' +
                                        '}, function (event, strAnswer) {\n' +
                                        '    if (strAnswer === \'${4:Ok}\') {\n' +
                                        '        // beforedialog close\n' +
                                        '        $0\n' +
                                        '    }\n' +
                                        '});');
});


(function () {
    'use strict';
    
    function buttonHTML(buttons) {
        var strHTML, i, len;
        
        buttons = buttons || ['Ok'];
        
        // change button parameter to array format if it is string format (and the string is recognized)
        if (typeof buttons === 'string') {
            if (buttons === 'okcancel' || buttons === 'cancelok') {
                buttons = ['Cancel', 'Ok'];
                
            } else if (buttons === 'ok' || buttons === 'okonly') {
                buttons = ['Ok'];
                
            } else if (buttons === 'cancel' || buttons === 'cancelonly') {
                buttons = ['Cancel'];
                
            } else if (buttons === 'yesno' || buttons === 'noyes') {
                buttons = ['No', 'Yes'];
                
            } else if (buttons === 'Yes' || buttons === 'yesonly') {
                buttons = ['Yes'];
                
            } else if (buttons === 'No' || buttons === 'noonly') {
                buttons = ['No'];
            }
        }
        
        if (typeof buttons === 'object') {
            if (buttons.length > 0) {
                strHTML = '<gs-grid gs-dynamic>';
                
                for (i = 0, len = buttons.length; i < len; i += 1) {
                    strHTML +=
                        '<gs-block gs-dynamic>' +
                            '<gs-button dialogclose ' + (i === len - 1 ? 'bg-primary listen-for-return' : '') + ' gs-dynamic>' +
                                encodeHTML(buttons[i]) +
                            '</gs-button>' +
                        '</gs-block>';
                }
                
                strHTML += '</gs-grid>';
                
            } else {
                strHTML = '<gs-button dialogclose>Done</gs-button>';
            }
        } else {
            strHTML = buttons;
        }
        
        return strHTML;
    }
    
    // GS.msgbox('test1', 'test2', ['cancel', 'ok'], function (strAnswer) { console.log(strAnswer); });
    GS.msgbox = function (strTitle, strMessage, buttons, callback) {
        var templateElement = document.createElement('template');
        
        templateElement.innerHTML = '<gs-page>' +
                                    '    <gs-header><center><h3>' + strTitle + '</h3></center></gs-header>' +
                                    '    <gs-body padded>' +
                                    '        ' + strMessage +
                                    '    </gs-body>' +
                                    '    <gs-footer>' + buttonHTML(buttons) + '</gs-footer>' +
                                    '</gs-page>';
        
        GS.openDialog(templateElement, '', function (event, strAnswer) {
            if (typeof callback === 'function') {
                callback(strAnswer);
            }
        });
    };
    
    // GS.inputbox('test1', 'test2', function (strAnswer) { console.log(strAnswer); });
    GS.inputbox = function (strTitle, strMessage, callback) {
        var templateElement = document.createElement('template');
        
        templateElement.innerHTML = '<gs-page>' +
                                    '    <gs-header><center><h3>' + strTitle + '</h3></center></gs-header>' +
                                    '    <gs-body padded>' +
                                    '        ' + strMessage +
                                    '        <gs-text id="dialog-inputbox-control"></gs-text>' +
                                    '    </gs-body>' +
                                    '    <gs-footer>' + buttonHTML(['Cancel', 'Ok']) + '</gs-footer>' +
                                    '</gs-page>';
        
        GS.openDialog(templateElement, '', function (event, strAnswer) {
            if (strAnswer === 'Ok') {
                callback(document.getElementById('dialog-inputbox-control').value);
            } else {
                callback('');
            }
        });
    };
})();

GS.dialogClose = function (dialog, strAnswer) {
    'use strict';
    console.warn('Please use "GS.closeDialog" instead of "GS.dialogClose".');
    dialog.destroy(strAnswer);
};

GS.closeDialog = function (dialog, strAnswer) {
    'use strict';
    
    if (typeof dialog === 'string') {
        dialog = document.getElementById('dialog-from-' + dialog);
    }
    
    if (dialog) {
        dialog.destroy(strAnswer);
    } else {
        console.warn('GS.closeDialog Warning: Dialog not found.');
    }
};

(function () {
    'use strict';
    
    // on focus: if the currently focus element is not in the frontmost dialog: focus first control of the frontmost dialog
    document.addEventListener('focus', function (event) {
        var arrDialog = document.getElementsByTagName('gs-dialog');
        var frontDialog;
        var parentFind;
        var arrElements;
        var i;
        var len;

        //console.log('1*** focus: ', document.activeElement);
        if (arrDialog.length > 0) {
            frontDialog = arrDialog[arrDialog.length - 1];
            parentFind = GS.findParentElement(document.activeElement, frontDialog);

            //console.log('2***', parentFind, frontDialog);
            if (parentFind !== frontDialog) {
                arrElements = xtag.query(frontDialog, 'input, textarea, select, button, iframe, [tabindex], a');

                for (i = 0, len = arrElements.length; i < len; i += 1) {
                    if (GS.isElementFocusable(arrElements[i])) {
                        arrElements[i].focus();
                        break;
                    }
                }
                //console.log('3***');
            }
        }
    }, true);

    // DEPRECATED
    GS.dialog = function (options) {
        var strHTML, dialogOverlay, dialog, strContent = '', strButtons = '', i, len, gridEach,
            arrElements, tapHandler, strHeader, sizingFunction, observer, returnTarget;
        
        // change button parameter to array format if it is string format (and the string is recognized)
        if (typeof options.buttons === 'string') {
            if (options.buttons === 'okcancel' || options.buttons === 'cancelok') {
                options.buttons = ['Cancel', 'Ok'];
                
            } else if (options.buttons === 'ok' || options.buttons === 'okonly') {
                options.buttons = ['Ok'];
                
            } else if (options.buttons === 'cancel' || options.buttons === 'cancelonly') {
                options.buttons = ['Cancel'];
                
            } else if (options.buttons === 'yesno' || options.buttons === 'noyes') {
                options.buttons = ['No', 'Yes'];
                
            } else if (options.buttons === 'Yes' || options.buttons === 'yesonly') {
                options.buttons = ['Yes'];
                
            } else if (options.buttons === 'No' || options.buttons === 'noonly') {
                options.buttons = ['No'];
            }
        }
        
        // option defaults
        options.theme      = options.theme        || 'regular';
        options.type       = options.type         || 'html';
        options.header     = options.header       || '';
        options.content    = options.content      || '';
        options.buttons    = options.buttons      || ['Ok']; // either array or string
        options.max_width  = options.max_width    || '700px';
        options.max_height = options.max_height   || '700px';
        options.mode       = options.mode         || 'detect'; // phone, touch, constrained, full, detect
        options.padded     = options.padded       || false;
        options.autofocus  = (options.autofocus === undefined ? true : false);
        
        // if type is html or, use content as is
        if (options.type === 'html') {
            strContent = options.content;
            strHeader = options.header;
            
        // if type is formatted-html, wrap content with a <pre>
        } else if (options.type === 'formatted-html') {
            strContent = '<pre gs-dynamic>' + options.content + '</pre>';
            strHeader = '<pre gs-dynamic>' + options.header + '</pre>';
            
        // if type is text, encode to be text only
        } else if (options.type === 'text') {
            strContent = encodeHTML(options.content);
            strHeader = encodeHTML(options.header);
            
        // if type is formatted-text, encode to be text only, and wrap with a <pre>
        } else if (options.type === 'formatted-text') {
            strContent = '<pre gs-dynamic>' + encodeHTML(options.content) + '</pre>';
            strHeader = '<pre gs-dynamic>' + encodeHTML(options.header) + '</pre>';
            
        // if type is unrecognized, use content as is
        } else {
            console.warn('Dialog type not recognized... Defaulting to \'html\'.');
            strContent = options.content;
            strHeader = options.header;
        }
        
        // if buttons is an array, build array into button html
        if (typeof options.buttons === 'object') {
            if (options.buttons.length > 0) {
                strButtons = '<gs-grid gs-dynamic>';
                
                for (i = 0, len = options.buttons.length; i < len; i += 1) {
                    strButtons +=
                        '<gs-block gs-dynamic>' +
                            '<gs-button dialogclose ' + (i === len - 1 ? 'bg-primary listen-for-return' : '') + ' gs-dynamic>' +
                                encodeHTML(options.buttons[i]) +
                            '</gs-button>' +
                        '</gs-block>';
                }
                strButtons += '</gs-grid>';
            } else {
                strButtons = '';
            }
        
        // if buttons is not an array, use as html
        } else {
            strButtons = options.buttons;
        }
        
        // append dialog overlay element
        dialogOverlay = GS.stringToElement('<gs-dialog-overlay gs-dynamic></gs-dialog-overlay>');
        document.body.appendChild(dialogOverlay);
        
        dialogOverlay.addEventListener(evt.mousedown, function (event) {
            event.preventDefault();
        });
        dialogOverlay.addEventListener(evt.mousemove, function (event) {
            event.preventDefault();
        });
        
        // build dialog html
        strHTML = '<gs-dialog class="' + encodeHTML(options.theme) + '" gs-dynamic ';
        
        // if mode is set to phone or touch and we are not on those types of devices: change mode to detect
        if ((options.mode === 'touch' && !evt.touchDevice) || (options.mode === 'phone' && evt.deviceType !== 'phone')) {
            options.mode = 'detect';
        }
        
        // deal with full page mode
        if ((options.mode === 'touch' && evt.touchDevice) || (options.mode === 'phone' && evt.deviceType === 'phone') || options.mode === 'full') {
            strHTML += 'style="width: 100%; height: 100%; top: 0;">';
            
        } else if (options.mode === 'constrained') {
            strHTML += 'style="max-width: ' + options.max_width + '; max-height: ' + options.max_height + '; width: 94%; height: 90%;">';// auto
                             //width: ' + options.width + '; ' +
                             //'height: ' + options.height + '; ' +
                             //'top: ' + options.top + '; ' +
                             //'margin-left: -' + ((parseInt(options.width, 10) / 2) + options.width.replace(/[0-9]/g, '')) + ';">' +
            
        } else { // if (options.mode === 'constrained')
            strHTML += 'style="max-width: ' + options.max_width + '; width: 94%;">';
        }
        
        strHTML +=      '<gs-page gs-dynamic>' +
                            (options.header ? '<gs-header gs-dynamic>' + strHeader + '</gs-header>' : '') +
                            '<gs-body' + (options.padded ? ' padded' : '') + ' gs-dynamic>' + strContent + '</gs-body>' +
                           (strButtons ? '<gs-footer gs-dynamic>' + strButtons + '</gs-footer>' : '') +
                        '</gs-page>' +
                    '</gs-dialog>';
        
        // append dialog
        dialog = GS.stringToElement(strHTML);
        document.body.appendChild(dialog);
        document.body.parentNode.classList.add('no-scroll-except-for-dialog');
        
        // bind dialog
        dialog.addEventListener('beforeclose', function (event) {
            if (typeof options.before_close === 'function') {
                options.before_close.apply(dialog, [event.originalEvent, event.data]);
            }
        });
        dialog.addEventListener('afterclose', function (event) {
            if (typeof options.after_close === 'function') {
                options.after_close.apply(dialog, [event.originalEvent, event.data]);
            }
        });
        
        
        // focus autofocus element if there is one
        arrElements = xtag.query(dialog, '[autofocus]');
        
        if (arrElements.length > 0) {
            arrElements[0].focus();
            
        // else if there is a listen-for-return: focus that
        } else {
            arrElements = xtag.query(dialog, '[listen-for-return]');
            
            if (arrElements.length > 0) {
                arrElements[0].focus();
            }
        }
        
        // bind listening for return if there is an element with the "listen-for-return"
        arrElements = xtag.query(dialog, '[listen-for-return]');
        
        if (arrElements.length > 0) {
            returnTarget = arrElements[0];
            
            dialog.addEventListener('keydown', function (event) {
                if (event.target !== returnTarget && (event.keyCode === 13 || event.which === 13)) {
                    GS.triggerEvent(returnTarget, 'click');
                }
            });
            
            if (arrElements.length > 1) {
                console.warn('dialog Warning: Too many [listen-for-return] elements, defaulting to the first one. Please have only one [listen-for-return] element per dialog.');
            }
        }
        
        // if mode is detect: do/bind detection
        if (options.mode === 'detect') {
            sizingFunction = function () {
                if (dialog.parentNode !== document.body) {
                    window.removeEventListener('resize', sizingFunction);
                    window.removeEventListener('orientationchange', sizingFunction);
                    observer.disconnect();
                    
                    return;
                }
                
                // if dialog is taller than 98% of the window: add max-height and height
                if (dialog.offsetHeight > ((window.innerHeight / 100) * 98)) {
                    dialog.style.height = '98%';
                    dialog.style.maxHeight = options.max_height;
                }
            };
            
            sizingFunction();
            
            window.addEventListener('resize', sizingFunction);
            window.addEventListener('orientationchange', sizingFunction);
            
            observer = new MutationObserver(sizingFunction);
            observer.observe(dialog, {childList: true, subtree: true, attributes: true});
        }
        
        // after open function call
        if (typeof options.after_open === 'function') {
            options.after_open.apply(dialog, []);
        }
        
        return dialog;
    };
    
    
    GS.openDialog = function (templateLink, afterOpenFunction, beforeCloseFunction, afterCloseFunction) {
        var template, templateID, strHTML, dialogOverlay, dialog, i, len, arrCloseButtons, clickHandler, sizingFunction,
            observer, arrElements, strTag, returnTarget, strTheme, strMaxWidth, strMaxHeight, strMode, refocusElement,
            scrollTarget, jsnInitalMousePos, scrollProtectorTouchStart, scrollProtectorTouchMove, scrollProtectorMouseWheel,
            strTag, xtagSelector, intervalID, intervalI;
        
        // save and blur currently focused element
        refocusElement = document.activeElement;
        refocusElement.blur();
        
        // get template
        if (typeof templateLink === 'string') {
            template = document.getElementById(templateLink);
        } else {
            template = templateLink;
        }
        
        // save template ID
        templateID = template.getAttribute('id');
        
        // warn if a dialog already uses this ID
        if (templateID && document.getElementById('dialog-from-' + templateID)) {
            console.warn('GS.openDialog Warning: A dialog using the ID "' + templateID + '" is already open.');
        }
        
        // handle autofocus
        arrElements = xtag.query(template.content, '[autofocus]');
        
        // if there are not autofocus elements: add autofocus to first control in the template
        if (arrElements.length === 0) {
            arrElements = xtag.query(template.content, '*');
            
            if (arrElements.length > 0) {
                for (i = 0, len = arrElements.length; i < len; i += 1) {
                    strTag = arrElements[i].nodeName.toLowerCase();
                    
                    if (GS.isElementFocusable(arrElements[i]) ||
                        (
                            xtag.tags[strTag] &&
                            xtag.tags[strTag].methods &&
                            xtag.tags[strTag].methods.focus
                        )) {
                        arrElements[i].setAttribute('autofocus', '');
                        break;
                    }
                }
            }
            
        // warn if there are too many autofocus elements
        } else if (arrElements.length > 1) {
            for (i = 1, len = arrElements.length; i < len; i += 1) {
                arrElements[i].removeAttribute('autofocus');
            }
            
            console.warn('dialog Warning: Too many [autofocus] elements, defaulting to the first one. Please have only one [autofocus] element per dialog.');
        }
        
        // get and default parameters
        strTheme     = (template.getAttribute('data-theme') === 'error' ? 'error' : 'regular');
        strMaxWidth  = template.getAttribute('data-max-width')  || '700px';
        strMaxHeight = template.getAttribute('data-max-height') || '700px';
        strMode      = template.getAttribute('data-mode')       || 'detect'; // phone, touch, constrained, full, detect
        
        // build full dialog html
        strHTML = '<gs-dialog ' + (templateID ? 'id="dialog-from-' + templateID + '" ' : '') + 'class="' + strTheme + '" gs-dynamic ';
        
        // if mode is set to phone or touch and we are not on those types of devices: change mode to detect
        if ((strMode === 'touch' && !evt.touchDevice) || (strMode === 'phone' && evt.deviceType !== 'phone')) {
            strMode = 'detect';
        }
        
        // deal with full page mode
        if ((strMode === 'touch' && evt.touchDevice) || (strMode === 'phone' && evt.deviceType === 'phone') || strMode === 'full') {
            strHTML += 'style="width: 100%; height: 100%; top: 0;">';
            
        } else if (strMode === 'constrained') {
            strHTML += 'style="max-width: ' + strMaxWidth + '; max-height: ' + strMaxHeight + '; width: 94%; height: 90%;">';
            
        } else {
            strHTML += 'style="max-width: ' + strMaxWidth + '; width: 94%;">';
        }
        
        strHTML +=      '<gs-page gs-dynamic>' +
                            template.innerHTML +
                        '</gs-page>' +
                    '</gs-dialog>';
        
        // get elements
        dialogOverlay = GS.stringToElement('<gs-dialog-overlay gs-dynamic></gs-dialog-overlay>');
        dialog = GS.stringToElement(strHTML);
        
        // append overlay element
        document.body.appendChild(dialogOverlay);
        
        // if the template has: data-overlay-close="true": bind overlay
        if (template.getAttribute('data-overlay-close') === 'true') {
            dialogOverlay.addEventListener(evt.mousedown, function (event) {
                GS.closeDialog(dialog, 'overlay');
            });
        }
        
        // bind overlay element
        dialogOverlay.addEventListener(evt.mousedown, function (event) {
            event.preventDefault();
        });
        dialogOverlay.addEventListener(evt.mousemove, function (event) {
            event.preventDefault();
        });
        dialogOverlay.addEventListener('mousewheel', function (event) {
            event.preventDefault();
        });
        
        // append dialog
        document.body.appendChild(dialog);
        //document.body.parentNode.classList.add('no-scroll-except-for-dialog');
        
        // bind dialog
        scrollProtectorTouchStart = function (event) {
            if (dialog.parentNode !== document.body) {
                dialog.removeEventListener('touchstart', scrollProtectorTouchStart);
                return true;
            }
            
            scrollTarget = GS.scrollParent(event.target);
            
            //console.log(scrollTarget);
            
            if (!scrollTarget || !GS.findParentTag(scrollTarget, 'gs-dialog')) {
                scrollTarget = dialog;
            }
            
            //console.log(scrollTarget);
            
            jsnInitalMousePos = GS.mousePosition(event);
        };
        
        scrollProtectorTouchMove = function (event) {
            var jsnMousePos = GS.mousePosition(event), bolVertical, bolHorizontal;
            
            if (dialog.parentNode !== document.body) {
                dialog.removeEventListener('touchmove', scrollProtectorTouchMove);
                return true;
            }
            
            //console.log('2***', scrollTarget, jsnInitalMousePos, jsnMousePos);
            
            if (Math.abs(jsnInitalMousePos.top - jsnMousePos.top) > Math.abs(jsnInitalMousePos.left - jsnMousePos.left)) {
                bolVertical = true;
            } else {
                bolHorizontal = true;
            }
            
            //console.log(bolVertical, bolHorizontal);
            
            // if down  AND we are already at the top
            // if up    AND we are already at the bottom
            // if right AND we are already at the left
            // if left  AND we are already at the right
            
            if ((bolVertical && (
                    (jsnInitalMousePos.top < jsnMousePos.top && scrollTarget.scrollTop <= 0) ||
                    (jsnInitalMousePos.top > jsnMousePos.top &&
                        (scrollTarget.scrollTop + scrollTarget.clientHeight) >= scrollTarget.scrollHeight))) ||
                (bolHorizontal && (
                    (jsnInitalMousePos.left < jsnMousePos.left && scrollTarget.scrollLeft <= 0) ||
                    (jsnInitalMousePos.left > jsnMousePos.left &&
                        (scrollTarget.scrollLeft + scrollTarget.clientWidth) >= scrollTarget.scrollWidth)))) {
                event.preventDefault();
                event.stopPropagation();
            }
        };
        
        scrollProtectorMouseWheel = function (event) {
            var target = GS.scrollParent(event.target); //event.target;
            
            //console.log(target);
            
            if (dialog.parentNode !== document.body) {
                dialog.removeEventListener('mousewheel', scrollProtectorMouseWheel);
                return true;
            }
            
            //console.log(event.deltaY, event.deltaX,
            //            target.scrollTop, target.scrollLeft,
            //            target.scrollHeight, target.scrollWidth,
            //            target.clientHeight, target.clientWidth);
            
            // if event.deltaY < 0 AND we are already at the top
            // if event.deltaY > 0 AND we are already at the bottom
            // if event.deltaX < 0 AND we are already at the left
            // if event.deltaX > 0 AND we are already at the right
            
            if ((event.deltaY < 0 && target.scrollTop <= 0) ||
                (event.deltaY > 0 && (target.scrollTop + target.clientHeight) >= target.scrollHeight) ||
                (event.deltaX < 0 && target.scrollLeft <= 0) ||
                (event.deltaX > 0 && (target.scrollLeft + target.clientWidth) >= target.scrollWidth)) {
                //console.log('prevented');
                
                event.preventDefault();
                event.stopPropagation();
            }
        };
        
        if (evt.touchDevice) {
            window.addEventListener('touchstart', scrollProtectorTouchStart);
            window.addEventListener('touchmove', scrollProtectorTouchMove);
        }
        
        dialog.addEventListener('mousewheel', scrollProtectorMouseWheel);
        
        dialog.addEventListener('beforeclose', function (event) {
            if (typeof beforeCloseFunction === 'function') {
                beforeCloseFunction.apply(dialog, [event.originalEvent, event.data]);
            }
        });
        
        dialog.addEventListener('afterclose', function (event) {
            refocusElement.focus();
            if (typeof afterCloseFunction === 'function') {
                afterCloseFunction.apply(dialog, [event.originalEvent, event.data]);
            }
        });
        
        
        // if mode equals 'detect'
        //console.log(strMode);
        if (strMode === 'detect') {
            // do/bind size detection
            sizingFunction = function () {
                if (dialog.parentNode !== document.body) {
                    window.removeEventListener('resize', sizingFunction);
                    window.removeEventListener('orientationchange', sizingFunction);
                    observer.disconnect();
                    
                    return;
                }
                
                // if dialog is taller than 98% of the window: add max-height and height
                if (dialog.offsetHeight > ((window.innerHeight / 100) * 98)) {
                    dialog.style.height = '98%';
                    dialog.style.maxHeight = strMaxHeight;
                }
            };
            
            sizingFunction();
            
            window.addEventListener('resize', sizingFunction);
            window.addEventListener('orientationchange', sizingFunction);
            
            observer = new MutationObserver(sizingFunction);
            observer.observe(dialog, {childList: true, subtree: true, attributes: true});
        }
        
        
        var elementReadyCallback = function () {
            // focus autofocus element if there is one
            arrElements = xtag.query(dialog, '[autofocus]');
            
            if (arrElements.length > 0) {
                arrElements[0].focus();
                
            // else if there is a listen-for-return: focus that
            } else {
                arrElements = xtag.query(dialog, '[listen-for-return]');
                
                if (arrElements.length > 0) {
                    arrElements[0].focus();
                }
            }
            
            // bind listening for return if there is an element with the "listen-for-return"
            arrElements = xtag.query(dialog, '[listen-for-return]');
            
            if (arrElements.length > 0) {
                returnTarget = arrElements[0];
                
                dialog.addEventListener('keydown', function (event) { // keydown, keyup, keypress
                    if (event.target !== returnTarget && (event.keyCode === 13 || event.which === 13)) {
                        //event.stopPropagation();
                        GS.triggerEvent(returnTarget, 'click');
                    }
                });
                
                if (arrElements.length > 1) {
                    console.warn('dialog Warning: Too many [listen-for-return] elements, defaulting to the first one. Please have only one [listen-for-return] element per dialog.');
                }
            }
            
            if (typeof afterOpenFunction === 'function') {
                afterOpenFunction.apply(dialog, []);
            }
        };
        
        
        // get a list of all the xtag elements
        // if they are not all instantiated check: on an interval until they are all instantiated
        
        
        // if element registration is shimmed: we need to wait to run the callback
        //      until after the elements are ready. to do this we'll get a list of
        //      the current elements that are xtag-defined and on a 30ms loop we'll
        //      check their __upgraded__ property until they are all true
        if (shimmed.registerElement === true) {
            // build selector to get all xtag elements
            xtagSelector = '';
            for (strTag in xtag.tags) {
                xtagSelector += (xtagSelector ? ',' : '');
                xtagSelector += strTag;
            }
            
            // get all xtag elements
            var elem_wait = xtag.query(dialog, xtagSelector);
            var elem_i;
            var elem_len;
            
            // begin interval (max out at 1 second)
            intervalI = 0;
            intervalID = setInterval(function () {
                if (elem_wait.length === 0 || intervalI >= 30) {
                    clearInterval(intervalID);
                    elementReadyCallback();
                } else {
                    elem_i = 0;
                    elem_len = elem_wait.length;
                    while (elem_i < elem_len) {
                        if (elem_wait[elem_i].__upgraded__ === true) {
                            elem_wait.splice(elem_i, 1);
                            elem_i -= 1;
                            elem_len -= 1;
                        }
                        elem_i += 1;
                    }
                }
                intervalI += 1;
            }, 30);
            
        // else: element instantiation blocks JS execution until the elements
        //      are ready, so we don't need to wait to run the after open callback
        } else {
            elementReadyCallback();
        }
        
        
        //// after open function call
        //if (typeof afterOpenFunction === 'function') {
        //    if (dialog.inserted === true) {
        //        console.log('1***');
        //        afterOpenFunction.apply(dialog, []);
        //    } else {
        //        console.log('2***', new Date().getTime());
        //        dialog.addEventListener('dialog-inserted', function () {
        //            console.log('3***', new Date().getTime());
        //            afterOpenFunction.apply(dialog, []);
        //        });
        //    }
        //    
        //    
        //}
        
        return dialog;
    };
    
    GS.openDialogToElement = function (elementTarget, templateLink, strDirectionRequest, afterOpenFunction, beforeCloseFunction, afterCloseFunction) {
        'use strict';
        var positionHandlingFunction, jsnPositionData, divElement = document.createElement('div'), dialogElement, observer,
            intDialogResolvedWidth, intDialogResolvedHeight, strResolvedDirection, intMargin = 5, intElementMidPoint,
            intDialogMidPoint, i, len, arrTests, arrCloseButtons, clickHandler, arrElements, template, strTheme, strMaxWidth,
            strMaxHeight, strTag, dialogOverlay, refocusElement, jsnInitalMousePos, scrollTarget, returnTarget,
            scrollProtectorTouchStart, scrollProtectorTouchMove, scrollProtectorMouseWheel, templateID,
            strTag, xtagSelector, intervalID, intervalI;
        
        // save and blur currently focused element
        refocusElement = document.activeElement;
        refocusElement.blur();
        
        // get template
        if (typeof templateLink === 'string') {
            template = document.getElementById(templateLink);
        } else {
            template = templateLink;
        }
        
        // save template ID
        templateID = template.getAttribute('id');
        
        // warn if a dialog already uses this ID
        if (templateID && document.getElementById('dialog-from-' + templateID)) {
            console.warn('GS.openDialog Warning: A dialog using the ID "' + templateID + '" is already open.');
        }
        
        // handle autofocus
        arrElements = xtag.query(template.content, '[autofocus]');
        
        // if there are not autofocus elements: add autofocus to first control in the template
        if (arrElements.length === 0) {
            arrElements = xtag.query(template.content, '*');
            
            if (arrElements.length > 0) {
                for (i = 0, len = arrElements.length; i < len; i += 1) {
                    strTag = arrElements[i].nodeName.toLowerCase();
                    
                    if (GS.isElementFocusable(arrElements[i]) ||
                        (
                            xtag.tags[strTag] &&
                            xtag.tags[strTag].methods &&
                            xtag.tags[strTag].methods.focus
                        )) {
                        arrElements[i].setAttribute('autofocus', '');
                        break;
                    }
                }
            }
            
        // warn if there are too many autofocus elements
        } else if (arrElements.length > 1) {
            for (i = 1, len = arrElements.length; i < len; i += 1) {
                arrElements[i].removeAttribute('autofocus');
            }
            
            console.warn('dialog Warning: Too many [autofocus] elements, defaulting to the first one. Please have only one [autofocus] element per dialog.');
        }
        
        // get and default parameters
        strTheme     = (template.getAttribute('data-theme') === 'error' ? 'error' : 'regular');
        strMaxWidth  = template.getAttribute('data-max-width')  || '700px';
        strMaxHeight = template.getAttribute('data-max-height') || '700px';
        
        // create dialog element
        divElement.innerHTML =  '<gs-dialog ' + (templateID ? 'id="dialog-from-' + templateID + '" ' : '') + 'class="' + strTheme + '" style="width: 94%; max-width: ' + strMaxWidth + ';" no-window-listen gs-dynamic>' +
                                    '<gs-page gs-dynamic>' +
                                        template.innerHTML +
                                    '</gs-page>' +
                                '</gs-dialog>';
        
        dialogElement = divElement.children[0];
        
        // append dialog overlay element to the body
        dialogOverlay = GS.stringToElement('<gs-dialog-overlay gs-dynamic></gs-dialog-overlay>');
        document.body.appendChild(dialogOverlay);
        
        // if the template has: data-overlay-close="true": bind overlay
        if (template.getAttribute('data-overlay-close') === 'true') {
            dialogOverlay.addEventListener('click', function (event) {
                GS.closeDialog(dialogElement, 'overlay');
            });
        }
        
        // bind dialog overlay
        dialogOverlay.addEventListener('mousewheel', function (event) {
            event.preventDefault();
        });
        
        // append dialog element to the body
        document.body.appendChild(dialogElement);
        
        // bind dialog
        scrollProtectorTouchStart = function (event) {
            if (dialogElement.parentNode !== document.body) {
                dialogElement.removeEventListener('touchstart', scrollProtectorTouchStart);
                return true;
            }
            
            scrollTarget = GS.scrollParent(event.target);
            
            //console.log(scrollTarget);
            
            if (!scrollTarget || !GS.findParentTag(scrollTarget, 'gs-dialog')) {
                scrollTarget = dialogElement;
            }
            
            //console.log(scrollTarget);
            
            jsnInitalMousePos = GS.mousePosition(event);
        };
        
        scrollProtectorTouchMove = function (event) {
            var jsnMousePos = GS.mousePosition(event), bolVertical, bolHorizontal;
            
            if (dialogElement.parentNode !== document.body) {
                dialogElement.removeEventListener('touchmove', scrollProtectorTouchMove);
                return true;
            }
            
            //console.log('2***', scrollTarget, jsnInitalMousePos, jsnMousePos);
            
            if (Math.abs(jsnInitalMousePos.top - jsnMousePos.top) > Math.abs(jsnInitalMousePos.left - jsnMousePos.left)) {
                bolVertical = true;
            } else {
                bolHorizontal = true;
            }
            
            //console.log(bolVertical, bolHorizontal);
            
            // if down  AND we are already at the top
            // if up    AND we are already at the bottom
            // if right AND we are already at the left
            // if left  AND we are already at the right
            
            if ((bolVertical && (
                    (jsnInitalMousePos.top < jsnMousePos.top && scrollTarget.scrollTop <= 0) ||
                    (jsnInitalMousePos.top > jsnMousePos.top &&
                        (scrollTarget.scrollTop + scrollTarget.clientHeight) >= scrollTarget.scrollHeight))) ||
                (bolHorizontal && (
                    (jsnInitalMousePos.left < jsnMousePos.left && scrollTarget.scrollLeft <= 0) ||
                    (jsnInitalMousePos.left > jsnMousePos.left &&
                        (scrollTarget.scrollLeft + scrollTarget.clientWidth) >= scrollTarget.scrollWidth)))) {
                event.preventDefault();
                event.stopPropagation();
            }
        };
        
        scrollProtectorMouseWheel = function (event) {
            var target = GS.scrollParent(event.target); //event.target;
            
            if (dialogElement.parentNode !== document.body) {
                dialogElement.removeEventListener('mousewheel', scrollProtectorMouseWheel);
                return true;
            }
            
            //console.log(event.deltaY, event.deltaX,
            //            target.scrollTop, target.scrollLeft,
            //            target.scrollHeight, target.scrollWidth,
            //            target.clientHeight, target.clientWidth);
            
            // if event.deltaY < 0 AND we are already at the top
            // if event.deltaY > 0 AND we are already at the bottom
            // if event.deltaX < 0 AND we are already at the left
            // if event.deltaX > 0 AND we are already at the right
            
            if ((event.deltaY < 0 && target.scrollTop <= 0) ||
                (event.deltaY > 0 && (target.scrollTop + target.clientHeight) >= target.scrollHeight) ||
                (event.deltaX < 0 && target.scrollLeft <= 0) ||
                (event.deltaX > 0 && (target.scrollLeft + target.clientWidth) >= target.scrollWidth)) {
                event.preventDefault();
                event.stopPropagation();
            }
        };
        
        if (evt.touchDevice) {
            window.addEventListener('touchstart', scrollProtectorTouchStart);
            window.addEventListener('touchmove', scrollProtectorTouchMove);
        }
        
        dialogElement.addEventListener('mousewheel', scrollProtectorMouseWheel);
        
        dialogElement.addEventListener('beforeclose', function (event) {
            if (typeof beforeCloseFunction === 'function') {
                beforeCloseFunction.apply(dialogElement, [event.originalEvent, event.data]);
            }
        });
        dialogElement.addEventListener('afterclose', function (event) {
            refocusElement.focus();
            if (typeof afterCloseFunction === 'function') {
                afterCloseFunction.apply(dialogElement, [event.originalEvent, event.data]);
            }
        });
        
        // focus autofocus element if there is one
        arrElements = xtag.query(dialogElement, '[autofocus]');
        
        if (arrElements.length > 0) {
            arrElements[0].focus();
            
        // else if there is a listen-for-return: focus that
        } else {
            arrElements = xtag.query(dialogElement, '[listen-for-return]');
            
            if (arrElements.length > 0) {
                arrElements[0].focus();
            }
        }
        
        // bind listening for return if there is an element with the "listen-for-return"
        arrElements = xtag.query(dialogElement, '[listen-for-return]');
        
        if (arrElements.length > 0) {
            returnTarget = arrElements[0];
            
            dialogElement.addEventListener('keydown', function (event) {
                if (event.target !== returnTarget && (event.keyCode === 13 || event.which === 13)) {
                    GS.triggerEvent(returnTarget, 'click');
                }
            });
            
            if (arrElements.length > 1) {
                console.warn('dialog Warning: Too many [listen-for-return] elements, defaulting to the first one. Please have only one [listen-for-return] element per dialog.');
            }
        }
        
        // if no direction was sent: set direction to down
        strDirectionRequest = strDirectionRequest || 'down';
        
        // make strDirectionRequest lowercase
        strDirectionRequest.toLowerCase();
        
        // if the direction does not match any valid direction: set direction to down and warn
        if (!strDirectionRequest.match(/^up$|^down$|^left$|^right$|^full$/)) {
            console.warn('GS.openDialogToElement Error: ' +
                                'Direction \'' + strDirectionRequest + '\' not recognized. ' +
                                'Please use \'up\', \'down\', \'left\', \'right\' or \'full\'.');
            strDirectionRequest = 'down';
        }
        
        positionHandlingFunction = function () {
            var intDialogTop = '', intDialogLeft = '', intDialogMarginTop = '', intDialogMarginLeft = '', strOldStyle,
                arrElements, arrScrollingElements, i, len, strOverflow;
            
            // if the dialog is not in the DOM: unbind and skip the contents of the function using return
            if (dialogElement.parentNode !== document.body) {
                window.removeEventListener('resize', positionHandlingFunction);
                window.removeEventListener('orientationchange', positionHandlingFunction);
                observer.disconnect();
                return;
            }
            
            // save old style attribute
            strOldStyle = dialogElement.getAttribute('style');
            
            // save scroll numbers
            arrElements = xtag.query(dialogElement, '*');
            arrScrollingElements = [];
            
            for (i = 0, len = arrElements.length; i < len; i += 1) {
                strOverflow = GS.getStyle(arrElements[i], 'overflow');
                
                if (strOverflow === 'scroll' ||
                    (strOverflow === 'auto' && arrElements[i].clientHeight < arrElements[i].scrollHeight)) {
                    arrScrollingElements.push(arrElements[i]);
                }
            }
            
            for (i = 0, len = arrScrollingElements.length; i < len; i += 1) {
                arrScrollingElements[i].oldScrollTop = arrScrollingElements[i].scrollTop;
                arrScrollingElements[i].oldScrollLeft = arrScrollingElements[i].scrollLeft;
            }
            
            // clear dialog CSS
            dialogElement.style.top        = '';
            dialogElement.style.left       = '';
            dialogElement.style.marginTop  = '';
            dialogElement.style.marginLeft = '';
            dialogElement.style.width      = '94%';
            dialogElement.style.height     = '';
            dialogElement.style.maxHeight  = '';
            
            //console.log(dialogElement.oldHeight, dialogElement.offsetHeight);
            
            // if height hasn't changed: restore style
            if (dialogElement.oldHeight === dialogElement.offsetHeight) {
                dialogElement.setAttribute('style', strOldStyle);
                
                for (i = 0, len = arrScrollingElements.length; i < len; i += 1) {
                    arrScrollingElements[i].scrollTop = arrScrollingElements[i].oldScrollTop;
                    arrScrollingElements[i].scrollLeft = arrScrollingElements[i].oldScrollLeft;
                }
                
            // else: recalculate style
            } else {
                dialogElement.oldHeight = dialogElement.offsetHeight;
                
                // resolve dialog width and height
                
                // if dialog is taller than: window height - (intMargin * 2): add max-height and height
                if (dialogElement.clientHeight > ((window.innerHeight / 100) * 94)) {
                    dialogElement.style.height = '94%';
                    dialogElement.style.maxHeight = strMaxHeight;
                }
                
                intDialogResolvedWidth  = dialogElement.offsetWidth;
                intDialogResolvedHeight = dialogElement.offsetHeight + 1; // + 1 added to fix occasional scrollbar issue
                
                // set dialog width and height to resolved width and height
                dialogElement.style.width  = intDialogResolvedWidth  + 'px';
                dialogElement.style.height = intDialogResolvedHeight + 'px';
                
                // get target position data
                jsnPositionData = GS.getElementPositionData(elementTarget);
                
                // order of tests depending on direction
                if (strDirectionRequest === 'up') { // up: up, down, left, right, full
                    arrTests = ['up', 'down', 'left', 'right'];
                    
                } else if (strDirectionRequest === 'down') { // down: down, up, left, right, full
                    arrTests = ['down', 'up', 'left', 'right'];
                    
                } else if (strDirectionRequest === 'left') { // left: left, right, down, up, full
                    arrTests = ['left', 'right', 'down', 'up'];
                    
                } else if (strDirectionRequest === 'right') { // right: right, left, down, up, full
                    arrTests = ['right', 'left', 'down', 'up'];
                    
                } else { // full: no tests (just go to full)
                    arrTests = [];
                }
                
                // up: compare room above to dialog resolved height
                //      pass: display
                //      fail: next test
                for (i = 0, len = arrTests.length; i < len; i += 1) {
                    if ((arrTests[i] ===    'up' && (intDialogResolvedHeight + intMargin) <= jsnPositionData.intRoomAbove) ||
                        (arrTests[i] ===  'down' && (intDialogResolvedHeight + intMargin) <= jsnPositionData.intRoomBelow) ||
                        (arrTests[i] ===  'left' && (intDialogResolvedWidth  + intMargin) <=  jsnPositionData.intRoomLeft) ||
                        (arrTests[i] === 'right' && (intDialogResolvedWidth  + intMargin) <= jsnPositionData.intRoomRight)) {
                        strResolvedDirection = arrTests[i];
                        break;
                    }
                }
                
                // if we could not resolve to a particular direction: set direction to full screen
                strResolvedDirection = strResolvedDirection || 'full';
                //console.log(strResolvedDirection);
                
                // if up or down: get as close to horizontally centered on the element as possible
                if (strResolvedDirection === 'up' || strResolvedDirection === 'down') {
                    intElementMidPoint = (jsnPositionData.intElementLeft + (jsnPositionData.intElementWidth / 2));
                    intDialogMidPoint = (intDialogResolvedWidth / 2);
                    //console.log(intElementMidPoint, jsnPositionData.left, jsnPositionData.intElementWidth);
                    
                    // if centered goes past intMargin of the left edge of the screen: go to intMargin from the bottom
                    if (intElementMidPoint - intDialogMidPoint < intMargin) {
                        intDialogLeft = intMargin;
                        //console.log('1***', intMargin);
                        
                    // else if centered goes past intMargin of the right edge of the screen: go to intMargin less than the width of the viewport
                    } else if (intElementMidPoint + intDialogMidPoint > window.innerWidth - intMargin) {
                        intDialogLeft = ((window.innerWidth - intDialogResolvedWidth) - intMargin);
                        //console.log('2***', window.innerWidth, intDialogResolvedWidth, intMargin);
                        
                    // else centered does not go past intMargin of either edge of the screen: center
                    } else {
                        intDialogLeft = (intElementMidPoint - intDialogMidPoint);
                        //console.log('3***', intElementMidPoint, intDialogMidPoint, (intElementMidPoint - intDialogMidPoint) + 'px');
                    }
                    
                // else if left or right: get as close to vertically centered next to the element as possible
                } else if (strResolvedDirection === 'left' || strResolvedDirection === 'right') {
                    intElementMidPoint = (jsnPositionData.intElementTop + (jsnPositionData.intElementHeight / 2));
                    intDialogMidPoint = (intDialogResolvedHeight / 2);
                    
                    //console.log('0***', intElementMidPoint, intDialogMidPoint, window.innerHeight, intMargin, intDialogResolvedHeight);
                    
                    // if centered goes past intMargin of the top edge of the screen: go to intMargin from the bottom
                    if (intElementMidPoint - intDialogMidPoint < intMargin) {
                        intDialogTop = intMargin;
                        //console.log('1***', intMargin);
                        
                    // else if centered goes past intMargin of the bottom edge of the screen: go to intMargin less than the height of the viewport
                    } else if (intElementMidPoint + intDialogMidPoint > window.innerHeight - intMargin) {
                        intDialogTop = ((window.innerHeight - intDialogResolvedHeight) - intMargin);
                        //console.log('2***', window.innerHeight, intDialogResolvedHeight, intMargin);
                        
                    // else centered does not go past intMargin of either edge of the screen: center
                    } else {
                        intDialogTop = (intElementMidPoint - intDialogMidPoint);
                        //console.log('3***', intElementMidPoint, intDialogMidPoint, (intElementMidPoint - intDialogMidPoint) + 'px');
                    }
                    
                // else full: use dialog logic to get width and height and center both vertically and horizontally
                } else {
                    intDialogTop        = '50%';
                    intDialogLeft       = '50%';
                    intDialogMarginTop  = '-' + (intDialogResolvedHeight / 2) + 'px';
                    intDialogMarginLeft = '-' + (intDialogResolvedWidth / 2) + 'px';
                }
                
                // if direction is up: connect the bottom of the dialog to the top of the element
                if (strResolvedDirection === 'up') {
                    intDialogTop = (jsnPositionData.intElementTop - intDialogResolvedHeight);
                    
                // if direction is down: connect the top of the dialog to the bottom of the element
                } else if (strResolvedDirection === 'down') {
                    intDialogTop = (jsnPositionData.intElementTop + jsnPositionData.intElementHeight);
                    
                // if direction is left: connect the right of the dialog to the left of the element
                } else if (strResolvedDirection === 'left') {
                    intDialogLeft = (jsnPositionData.intElementLeft - intDialogResolvedWidth);
                    
                // if direction is right: connect the left of the dialog to the right of the element
                } else if (strResolvedDirection === 'right') {
                    intDialogLeft = (jsnPositionData.intElementLeft + jsnPositionData.intElementWidth);
                }
                
                // prevent the dialog from vertically going outside the viewport
                if (intDialogTop + intDialogResolvedHeight > window.innerHeight) {
                    intDialogTop -= (intDialogTop + intDialogResolvedHeight) - window.innerHeight;
                    
                }
                
                // prevent the dialog from horizontally going outside the viewport
                if (intDialogLeft + intDialogResolvedWidth > window.innerWidth) {
                    intDialogLeft -= (intDialogLeft + intDialogResolvedWidth) - window.innerWidth;
                }
                
                // apply CSS to the dialog
                dialogElement.style.top        = intDialogTop + 'px';
                dialogElement.style.left       = intDialogLeft + 'px';
                dialogElement.style.marginTop  = intDialogMarginTop + 'px';
                dialogElement.style.marginLeft = intDialogMarginLeft + 'px';
            }
        };
        
        positionHandlingFunction();
        window.addEventListener('resize', positionHandlingFunction);
        window.addEventListener('orientationchange', positionHandlingFunction);
        
        // observer: on childlist update: recalculate positioning/sizing
        observer = new MutationObserver(positionHandlingFunction);
        
        // the observer is on "dialogElement.children[0]" because when we refresh the position of the dialog:
        //      the "style" attribute is changed which causes the observer to run again ergo: infinite loop
        observer.observe(dialogElement.children[0], {childList: true, subtree: true, attributes: true});
        
        
        var elementReadyCallback = function () {
            // focus autofocus element if there is one
            arrElements = xtag.query(dialogElement, '[autofocus]');
            
            if (arrElements.length > 0) {
                arrElements[0].focus();
                
            // else if there is a listen-for-return: focus that
            } else {
                arrElements = xtag.query(dialogElement, '[listen-for-return]');
                
                if (arrElements.length > 0) {
                    arrElements[0].focus();
                }
            }
            
            // bind listening for return if there is an element with the "listen-for-return"
            arrElements = xtag.query(dialogElement, '[listen-for-return]');
            
            if (arrElements.length > 0) {
                returnTarget = arrElements[0];
                
                dialogElement.addEventListener('keydown', function (event) { // keydown, keyup, keypress
                    if (event.target !== returnTarget && (event.keyCode === 13 || event.which === 13)) {
                        //event.stopPropagation();
                        GS.triggerEvent(returnTarget, 'click');
                    }
                });
                
                if (arrElements.length > 1) {
                    console.warn('dialog Warning: Too many [listen-for-return] elements, defaulting to the first one. Please have only one [listen-for-return] element per dialog.');
                }
            }
            
            if (typeof afterOpenFunction === 'function') {
                afterOpenFunction.apply(dialogElement, []);
            }
        };
        
        // if element registration is shimmed: we need to wait to run the callback
        //      until after the elements are ready. to do this we'll get a list of
        //      the current elements that are xtag-defined and on a 30ms loop we'll
        //      check their __upgraded__ property until they are all true
        if (shimmed.registerElement === true) {
            // build selector to get all xtag elements
            xtagSelector = '';
            for (strTag in xtag.tags) {
                xtagSelector += (xtagSelector ? ',' : '');
                xtagSelector += strTag;
            }
            
            // get all xtag elements
            var elem_wait = xtag.query(dialogElement, xtagSelector);
            var elem_i;
            var elem_len;
            
            // begin interval (max out at 1 second)
            intervalI = 0;
            intervalID = setInterval(function () {
                if (elem_wait.length === 0 || intervalI >= 30) {
                    clearInterval(intervalID);
                    elementReadyCallback();
                } else {
                    elem_i = 0;
                    elem_len = elem_wait.length;
                    while (elem_i < elem_len) {
                        if (elem_wait[elem_i].__upgraded__ === true) {
                            elem_wait.splice(elem_i, 1);
                            elem_i -= 1;
                            elem_len -= 1;
                        }
                        elem_i += 1;
                    }
                }
                intervalI += 1;
            }, 30);
            
        // else: element instantiation blocks JS execution until the elements
        //      are ready, so we don't need to wait to run the after open callback
        } else {
            elementReadyCallback();
        }
        
        //// after open function call
        //if (typeof afterOpenFunction === 'function') {
        //    afterOpenFunction.apply(dialogElement, []);
        //}
        
        return dialogElement;
    };
})();

(function () {
    'use strict';
    
    xtag.register('gs-dialog', {
        lifecycle: {
            created: function () {
                document.body.focus();
                
                //document.body.parentNode.classList.add('no-scroll-except-for-dialog');
            },
            
            inserted: function () {
                if (this.inserted !== true) {
                    this.inserted = true;
                    
                    if (!this.hasAttribute('no-window-listen')) {
                        this.bind();
                        
                        this.windowResizeHandler();
                    }
                    
                    GS.triggerEvent(this, 'dialog-inserted');
                }
            },
            
            removed: function () {
                this.unbind();
            }
        },
        events: {
            'click:delegate([dialogclose])': function (event) {
                var dialogcloseElement = GS.findParentElement(event.target, '[dialogclose]');
                
                GS.findParentTag(event.target, 'gs-dialog')
                        .destroy(dialogcloseElement.textContent, event);
            }
        },
        accessors: {},
        methods: {
            bind: function () {
                var element = this;
                
                if (!element.hasAttribute('no-window-listen')) {
                    element.windowResizeHandler = function () {
                        element.style.left = (window.innerWidth / 2) - (element.offsetWidth / 2) + 'px';
                    };
                    
                    window.addEventListener('resize', element.windowResizeHandler);
                    window.addEventListener('orientationchange', element.windowResizeHandler);
                }
            },
            
            unbind: function () {
                window.removeEventListener('resize', this.windowResizeHandler);
                window.removeEventListener('orientationchange', this.windowResizeHandler);
                
                GS.triggerEvent(window, 'resize');
            },
            
            destroy: function (strAnswer, originalEvent) {
                var beforeCloseEvent;
                
                if (this.parentNode === document.body) {
                    beforeCloseEvent = GS.triggerEvent(this, 'beforeclose', {'data': strAnswer, 'originalEvent': originalEvent});
                    
                    if (!beforeCloseEvent.defaultPrevented && (!originalEvent || !originalEvent.defaultPrevented)) {
                        document.body.removeChild(this.previousElementSibling);
                        document.body.removeChild(this);
                        
                        GS.triggerEvent(this, 'afterclose', {'data': strAnswer, 'originalEvent': originalEvent});
                        
                        if (document.getElementsByTagName('gs-dialog').length === 0) {
                            document.body.parentNode.classList.remove('no-scroll-except-for-dialog');
                        }
                    }
                }
            }
        }
    });
    
    xtag.register('gs-dialog-overlay', {
        lifecycle: {},
        events: {},
        accessors: {},
        methods: {}
    });
})();