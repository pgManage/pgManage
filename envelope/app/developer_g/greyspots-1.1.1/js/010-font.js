
window.addEventListener('design-register-element', function () {
    'use strict';
    
    registerDesignSnippet('<gs-font>', '<gs-font>', 'gs-font min-width="${1}">\n' +
                                                    '    ${0}\n' +
                                                    '</gs-font>');
    
    designRegisterElement('gs-font', '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-font.html');
    
    window.designElementProperty_GSFONT = function (selectedElement) {
        addProp('Min-Width Media', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('min-width') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'min-width', this.value);
        });
        
        addProp('Media', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('media') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'media', this.value);
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
        var strVisibilityAttribute = '';
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
    var arrTakenFonts = [];
    
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
                
                // if the style element for the container CSS doesn't exist: create it
                if (!document.getElementById('gs-dynamic-css')) {
                    styleElement = document.createElement('style');
                    styleElement.setAttribute('id', 'gs-dynamic-css');
                    styleElement.setAttribute('gs-dynamic', '');
                    document.head.appendChild(styleElement);
                }
                
                if (element.getAttribute('min-width')) {
                    element.handleMinWidthCSS();
                } else if (element.getAttribute('media')) {
                    element.handleMediaCSS();
                }
            }
        }
    }
    
    xtag.register('gs-font', {
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
                    }
                }
            }
        },
        events: {},
        accessors: {},
        methods: {
            handleMinWidthCSS: function () {
                var strMinWidth = this.getAttribute('min-width'), arrMinWidths, strCSS, i, len, arrClassesToRemove, intContainerID,
                    arrParts, strMedia, strResult;
                
                // remove old classes
                arrClassesToRemove = String(this.classList).match(/font-id-[0-9]*/g) || [];
                
                for (i = 0, len = arrClassesToRemove.length; i < len; i += 1) {
                    this.classList.remove(arrClassesToRemove[i]);
                }
                
                // all {15px}; lrg {25px};
                // all {15px}; lrg {25px};
                // all {20px}; sml {25px}; med {30px}; lrg {35px};
                
                // all close curly braces, remove all whitespace, lowercase, trim off semicolons
                strMinWidth = GS.trim(strMinWidth.replace(/\}/g, '').replace(/\s+/g, '').toLowerCase(), ';');
                
                // replace shortcuts (lrg => 1200px)
                strMinWidth = strMinWidth.replace(/all/g, '0px')
                                         .replace(/small|sml/g, '768px')
                                         .replace(/medium|med/g, '992px')
                                         .replace(/large|lrg/g, '1200px');
                
                arrMinWidths = strMinWidth.split(';'); // seperate out layouts
                
                //console.log(strMinWidth, arrMinWidths);
                
                if (arrTakenFonts.indexOf(strMinWidth) === -1) {
                    arrTakenFonts.push(strMinWidth);
                    intContainerID = arrTakenFonts.length - 1;
                    strCSS = '';
                    
                    for (i = 0, len = arrMinWidths.length; i < len; i += 1) {
                        arrParts = arrMinWidths[i].split('{');
                        strMedia = arrParts[0];
                        strResult = arrParts[1];
                        
                        strCSS +=   '\n@media (min-width:' + strMedia + ') {\n' +
                                    '    gs-font.font-id-' + intContainerID + ' { font-size:' + strResult + '; }\n' +
                                    '}\n';
                    }
                    
                    //console.log(strCSS);
                    
                    // append the column CSS
                    document.getElementById('gs-dynamic-css').innerHTML += '\n/* font #' + intContainerID + ' */\n' + strCSS;
                    
                } else {
                    intContainerID = arrTakenFonts.indexOf(strMinWidth);
                }
                
                this.classList.add('font-id-' + intContainerID);
            },
            
            handleMediaCSS: function () {
                var strMedia = this.getAttribute('media'), arrMedias, strCSS, i, len,
                    arrClassesToRemove, arrParts, strCurrentMedia, strWidth, intContainerID;
                
                // remove old classes
                arrClassesToRemove = String(this.classList).match(/font-id-[0-9]*/g) || [];
                
                for (i = 0, len = arrClassesToRemove.length; i < len; i += 1) {
                    this.classList.remove(arrClassesToRemove[i]);
                }
                
                // print {20px}; all and (max-width: 500px) {20px}; (min-width: 500px) {25px};
                
                // trim, remove all close curly braces, lowercase, trim off semicolons
                strMedia = GS.trim(strMedia.trim().replace(/\}/g, '').toLowerCase(), ';');
                
                // replace shortcuts (lrg => 1200px)
                strMedia = strMedia.replace(/all/g, '0px')
                                   .replace(/small|sml/g, '768px')
                                   .replace(/medium|med/g, '992px')
                                   .replace(/large|lrg/g, '1200px');
                
                arrMedias = strMedia.split(';'); // seperate out layouts
                
                //console.log(strMedia, arrMedias);
                
                if (arrTakenFonts.indexOf(strMedia) === -1) {
                    arrTakenFonts.push(strMedia);
                    intContainerID = arrTakenFonts.length - 1;
                    strCSS = '';
                    
                    
                    for (i = 0, len = arrMedias.length; i < len; i += 1) {
                        arrParts = arrMedias[i].split('{');
                        strCurrentMedia = arrParts[0].trim() || 'all';
                        strWidth = arrParts[1].trim() || '900px';
                        
                        strCSS +=   '\n@media ' + strCurrentMedia + ' {\n' +
                                    '    gs-font.font-id-' + intContainerID + ' ' +
                                                '{ font-size: ' + strWidth + '; }\n' +
                                    '}\n';
                    }
                    
                    //console.log(strCSS);
                    
                    // append the column CSS
                    document.getElementById('gs-dynamic-css').innerHTML += '\n/* font #' + intContainerID + ' */\n' + strCSS;
                    
                } else {
                    intContainerID = arrTakenFonts.indexOf(strMinWidth);
                }
                
                this.classList.add('font-id-' + intContainerID);
            }
        }
    });
});