
window.addEventListener('design-register-element', function () {
    'use strict';
    
    registerDesignSnippet('<gs-img>', '<gs-img>', 'gs-img src="${1}"></gs-img>');
    
    designRegisterElement('gs-img', '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-image.html');
    
    window.designElementProperty_GSIMG = function(selectedElement) {
        addProp('Min-Width Media', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('min-width') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'min-width', this.value);
        });
        
        addProp('Media', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('media') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'media', this.value);
        });
        
        addProp('Source', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('src') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'src', this.value);
        });
        
        addProp('Alignment', true, '<gs-select class="target" value="' + encodeHTML(selectedElement.getAttribute('align') || '') + '" mini>' +
                                   '    <option value="left">Left</option>' +
                                   '    <option value="">Center</option>' +
                                   '    <option value="right">Right</option>' +
                                   '</gs-select>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'align', this.value);
        });
        
        addProp('Image Cover', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('image-cover') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'image-cover', this.value === 'true', true);
        });
        
        // TITLE attribute
        addProp('Title', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('title') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'title', this.value);
        });
        
        // SUSPEND-INSERTED attribute
        addProp('suspend-inserted', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-inserted') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suspend-inserted', this.value === 'true', true);
        });
        
        // visibility attributes
        strVisibilityAttribute = '';
        if (selectedElement.hasAttribute('hidden'))                   { strVisibilityAttribute = 'hidden'; }
        if (selectedElement.hasAttribute('hide-on-desktop'))  { strVisibilityAttribute = 'hide-on-desktop'; }
        if (selectedElement.hasAttribute('hide-on-tablet'))   { strVisibilityAttribute = 'hide-on-tablet'; }
        if (selectedElement.hasAttribute('hide-on-phone'))    { strVisibilityAttribute = 'hide-on-phone'; }
        if (selectedElement.hasAttribute('show-on-desktop'))   { strVisibilityAttribute = 'show-on-desktop'; }
        if (selectedElement.hasAttribute('show-on-tablet'))    { strVisibilityAttribute = 'show-on-tablet'; }
        if (selectedElement.hasAttribute('show-on-phone'))     { strVisibilityAttribute = 'show-on-phone'; }
        
        addProp('Visibility', true, '<gs-select class="target" value="' + strVisibilityAttribute + '" mini>' +
                                        '<option value="">Visible</option>' +
                                        '<option value="hidden">Invisible</option>' +
                                        '<option value="hide-on-desktop">Invisible at desktop size</option>' +
                                        '<option value="hide-on-tablet">Invisible at tablet size</option>' +
                                        '<option value="hide-on-phone">Invisible at phone size</option>' +
                                        '<option value="show-on-desktop">Visible at desktop size</option>' +
                                        '<option value="show-on-tablet">Visible at tablet size</option>' +
                                        '<option value="show-on-phone">Visible at phone size</option>' +
                                    '</gs-select>', function () {
            selectedElement.removeAttribute('hidden');
            selectedElement.removeAttribute('hide-on-desktop');
            selectedElement.removeAttribute('hide-on-tablet');
            selectedElement.removeAttribute('hide-on-phone');
            selectedElement.removeAttribute('show-on-desktop');
            selectedElement.removeAttribute('show-on-tablet');
            selectedElement.removeAttribute('show-on-phone');
            
            if (this.value) {
                selectedElement.setAttribute(this.value, '');
            }
            
            return selectedElement;
        });
        
        //addFlexContainerProps(selectedElement);
        addFlexProps(selectedElement);
    };
});

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    var arrTakenlayouts = [];
    
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
                
                // if the style element for the grid column CSS doesn't exist: create it
                if (!document.getElementById('gs-dynamic-css')) {
                    styleElement = document.createElement('style');
                    styleElement.setAttribute('id', 'gs-dynamic-css');
                    styleElement.setAttribute('gs-dynamic', '');
                    document.head.appendChild(styleElement);
                }
                
                element.handleSrc();
                
                if (element.getAttribute('min-width')) {
                    element.handleMinWidthCSS();
                } else if (element.getAttribute('media')) {
                    element.handleMediaCSS();
                }
            }
        }
    }
    
    xtag.register('gs-img', {
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
                    // if the "min-width" attribute changed
                    if (strAttrName === 'min-width') {
                        this.handleMinWidthCSS();
                        
                    // if the "media" attribute changed
                    } else if (strAttrName === 'media') {
                        this.handleMediaCSS();
                        
                    // if the "src" attribute changed
                    } else if (strAttrName === 'src') {
                        this.handleSrc();
                    }
                }
            }
        },
        events: {},
        accessors: {},
        methods: {
            handleSrc: function () {
                var strSrc = this.getAttribute('src');
                
                if (strSrc) {
                    this.style.backgroundImage = 'url("' + strSrc + '")';
                } else {
                    this.style.backgroundImage = '';
                }
            },
            
            handleMinWidthCSS: function () {
                var strMinWidth = this.getAttribute('min-width'), arrLayouts, strCSS, strCurrentMinWidth,
                    i, len, arrClassesToRemove, intImageID, arrParts, strDimensions, strWidth, strHeight;
                
                // remove old classes
                arrClassesToRemove = String(this.classList).match(/image-id-[0-9]*/g) || [];
                
                for (i = 0, len = arrClassesToRemove.length; i < len; i += 1) {
                    this.classList.remove(arrClassesToRemove[i]);
                }
                
                // all {150px}; lrg {75px};
                // all {150px, 75px}; lrg {75px, 150px};
                
                // remove all whitespace, remove all close curly braces, lowercase, trim off semicolons
                strMinWidth = GS.trim(strMinWidth.replace(/\s+/g, '').replace(/\}/g, '').toLowerCase(), ';');
                
                // replace shortcuts (lrg => 1200px)
                strMinWidth = strMinWidth.replace(/all/g, '0px')
                                         .replace(/small|sml/g, '768px')
                                         .replace(/medium|med/g, '992px')
                                         .replace(/large|lrg/g, '1200px');
                
                // seperate out layouts
                arrLayouts = strMinWidth.split(';');
                
                //console.log(strMinWidth, arrLayouts);
                
                if (arrTakenlayouts.indexOf(strMinWidth) === -1) {
                    arrTakenlayouts.push(strMinWidth);
                    intImageID = arrTakenlayouts.length - 1;
                    strCSS = '';
                    
                    for (i = 0, len = arrLayouts.length; i < len; i += 1) {
                        arrParts = arrLayouts[i].split('{');
                        strCurrentMinWidth = arrParts[0] || '0px';
                        strDimensions = arrParts[1];
                        
                        if (strDimensions.indexOf(',') === -1) {
                            strWidth = strDimensions;
                            strHeight = strDimensions;
                        } else {
                            arrParts = strDimensions.split(',');
                            strWidth = arrParts[0];
                            strHeight = arrParts[1];
                        }
                        
                        strCSS +=   '\n@media (min-width:' + strCurrentMinWidth + ') {\n' +
                                    '    gs-img.image-id-' + intImageID + ' { width:' + strWidth + '; height: ' + strHeight + '; }\n' +
                                    '}\n';
                    }
                    
                    //console.log(strCSS);
                    
                    // append the column CSS
                    document.getElementById('gs-dynamic-css').innerHTML += '\n/* image #' + intImageID + ' */\n' + strCSS;
                    
                } else {
                    intImageID = arrTakenlayouts.indexOf(strMinWidth);
                }
                
                this.classList.add('image-id-' + intImageID);
            },
            
            handleMediaCSS: function () {
                var strMedia = this.getAttribute('media'), arrLayouts, strCSS, i, len,
                    arrClassesToRemove, arrParts, strCurrentMedia, strWidth, intImageID,
                    arrParts, strCurrentMedia, strDimensions, strWidth, strHeight;
                
                // remove old classes
                arrClassesToRemove = String(this.classList).match(/image-id-[0-9]*/g) || [];
                
                for (i = 0, len = arrClassesToRemove.length; i < len; i += 1) {
                    this.classList.remove(arrClassesToRemove[i]);
                }
                
                // print {200px}; all and (max-width: 500px) {500px}; (min-width 500px) {600px};
                
                // trim, remove all close curly braces, lowercase, trim off semicolons
                strMedia = GS.trim(strMedia.trim().replace(/\}/g, '').toLowerCase(), ';');
                
                // replace shortcuts (lrg => 1200px)
                strMedia = strMedia.replace(/small|sml/g, '768px').replace(/medium|med/g, '992px').replace(/large|lrg/g, '1200px');
                
                arrLayouts = strMedia.split(';'); // seperate out layouts
                
                //console.log(strMedia, arrLayouts);
                
                if (arrTakenlayouts.indexOf(strMedia) === -1) {
                    arrTakenlayouts.push(strMedia);
                    intImageID = arrTakenlayouts.length - 1;
                    strCSS = '';
                    
                    for (i = 0, len = arrLayouts.length; i < len; i += 1) {
                        arrParts = arrLayouts[i].split('{');
                        strCurrentMedia = arrParts[0].trim() || 'all';
                        strDimensions = arrParts[1].trim();
                        
                        if (strDimensions.indexOf(',') === -1) {
                            strWidth = strDimensions;
                            strHeight = strDimensions;
                        } else {
                            arrParts = strDimensions.split(',');
                            strWidth = arrParts[0];
                            strHeight = arrParts[1];
                        }
                        
                        strCSS +=   '\n@media ' + strCurrentMedia + ' {\n' +
                                    '    gs-img.image-id-' + intImageID + ' { width:' + strWidth + '; height: ' + strHeight + '; }\n' +
                                    '}\n';
                    }
                    
                    console.log(strCSS);
                    
                    // append the column CSS
                    document.getElementById('gs-dynamic-css').innerHTML += '\n/* image #' + intImageID + ' */\n' + strCSS;
                    
                } else {
                    intImageID = arrTakenlayouts.indexOf(strMinWidth);
                }
                
                this.classList.add('image-id-' + intImageID);
            }
        }
    });
});