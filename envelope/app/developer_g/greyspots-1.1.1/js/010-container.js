
window.addEventListener('design-register-element', function () {
    'use strict';
    
    registerDesignSnippet('<gs-container>', '<gs-container>', 'gs-container min-width="${1:sml;med;lrg;}" ${2:padded}>\n' +
                                                                '    ${0}\n' +
                                                                '</gs-container>');
    
    designRegisterElement('gs-container', '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-container-jumbo.html');
    
    window.designElementProperty_GSCONTAINER = function(selectedElement) {
        var strVisibilityAttribute;
        
        addProp('Min-Width Media', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('min-width') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'min-width', this.value);
        });
        
        addProp('Media', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('media') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'media', this.value);
        });
        
        addProp('Padded', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('padded')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'padded', (this.value === 'true'), true);
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
    var arrTakenContainers = [], intScrollBarWidth;
    
    function getScrollBarWidth() {
        var inner = document.createElement('div'),
            outer = document.createElement('div'),
            intWidth;
        
        inner.style.height = '200px';
        
        outer.style.position = 'absolute';
        outer.style.top = '0';
        outer.style.left = '0';
        outer.style.visibility = 'hidden';
        outer.style.overflow = 'scroll';
        
        outer.style.width = '50px';
        outer.style.height = '100px';
        
        outer.appendChild(inner);
        document.body.appendChild(outer);
        
        intWidth = (outer.offsetWidth - inner.offsetWidth);
        
        document.body.removeChild(outer);
        
        return intWidth;
    };
    
    intScrollBarWidth = getScrollBarWidth();
    
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
    
    xtag.register('gs-container', {
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
                var strMinWidth = this.getAttribute('min-width'), arrMinWidths, strCSS, i, len,
                    arrClassesToRemove, intContainerID, intWidthNumber, strWidthOperator, strNewWidth;
                
                // remove old classes
                arrClassesToRemove = String(this.classList).match(/container-id-[0-9]*/g) || [];
                
                for (i = 0, len = arrClassesToRemove.length; i < len; i += 1) {
                    this.classList.remove(arrClassesToRemove[i]);
                }
                
                // sml;med;lrg
                // medium
                // 100;200;300;400;500;600;700;800;900;1000;1100;1200
                
                // remove all whitespace, lowercase, trim off semicolons
                strMinWidth = GS.trim(strMinWidth.replace(/\s+/g, '').toLowerCase(), ';');
                
                // replace shortcuts (lrg => 1200px)
                strMinWidth = strMinWidth.replace(/small|sml/g, '768px').replace(/medium|med/g, '992px').replace(/large|lrg/g, '1200px');
                
                arrMinWidths = strMinWidth.split(';'); // seperate out layouts
                
                //console.log(strMinWidth, arrMinWidths);
                
                if (arrTakenContainers.indexOf(strMinWidth) === -1) {
                    arrTakenContainers.push(strMinWidth);
                    intContainerID = arrTakenContainers.length - 1;
                    strCSS = '';
                    
                    for (i = 0, len = arrMinWidths.length; i < len; i += 1) {
                        intWidthNumber = parseInt(arrMinWidths[i]);
                        strWidthOperator = arrMinWidths[i].replace(/[0-9]/g, '');
                        
                        if (strWidthOperator === 'px') {
                            intWidthNumber -= intScrollBarWidth;
                        } else if (strWidthOperator === 'em') {
                            intWidthNumber -= GS.pxToEm(this.parentNode, intScrollBarWidth);
                        }
                        
                        strNewWidth = intWidthNumber + strWidthOperator;
                        
                        strCSS +=   '\n@media (min-width:' + arrMinWidths[i] + ') {\n' +
                                    '    gs-container.container-id-' + intContainerID +
                                                ' { width:' + strNewWidth + '; margin-left:auto; margin-right:auto; }\n' +
                                    '}\n';
                    }
                    
                    //console.log(strCSS);
                    
                    // append the column CSS
                    document.getElementById('gs-dynamic-css').innerHTML +=
                            '\n/* container #' + intContainerID + ' */\n' + strCSS;
                    
                } else {
                    intContainerID = arrTakenContainers.indexOf(strMinWidth);
                }
                
                this.classList.add('container-id-' + intContainerID);
            },
            
            handleMediaCSS: function () {
                var strMedia = this.getAttribute('media'), arrMedias, strCSS, i, len,
                    arrClassesToRemove, arrParts, strCurrentMedia, strWidth, intContainerID;
                
                // remove old classes
                arrClassesToRemove = String(this.classList).match(/container-id-[0-9]*/g) || [];
                
                for (i = 0, len = arrClassesToRemove.length; i < len; i += 1) {
                    this.classList.remove(arrClassesToRemove[i]);
                }
                
                // (min-width: 500) {small}; (max-width: 500) {50}
                // (max-width: small) {small}; (min-width: small) {small}
                // (max-width: small) {50}; (min-width: small) {500}
                
                // trim, remove all close curly braces, lowercase, trim off semicolons
                strMedia = GS.trim(strMedia.trim().replace(/\}/g, '').toLowerCase(), ';');
                
                // replace shortcuts (lrg => 1200px)
                strMedia = strMedia.replace(/small|sml/g, '768px').replace(/medium|med/g, '992px').replace(/large|lrg/g, '1200px');
                
                arrMedias = strMedia.split(';'); // seperate out layouts
                
                //console.log(strMedia, arrMedias);
                
                if (arrTakenContainers.indexOf(strMedia) === -1) {
                    arrTakenContainers.push(strMedia);
                    intContainerID = arrTakenContainers.length - 1;
                    strCSS = '';
                    
                    
                    for (i = 0, len = arrMedias.length; i < len; i += 1) {
                        arrParts = arrMedias[i].split('{');
                        strCurrentMedia = arrParts[0].trim() || 'all';
                        strWidth = arrParts[1].trim() || '900px';
                        
                        strCSS +=   '\n@media ' + strCurrentMedia + ' {\n' +
                                    '    gs-container.container-id-' + intContainerID + ' ' +
                                                '{ width:' + strWidth + '; margin-left:auto; margin-right:auto; }\n' +
                                    '}\n';
                    }
                    
                    //console.log(strCSS);
                    
                    // append the column CSS
                    document.getElementById('gs-dynamic-css').innerHTML += '\n/* container #' + intContainerID + ' */\n' + strCSS;
                    
                } else {
                    intContainerID = arrTakenContainers.indexOf(strMinWidth);
                }
                
                this.classList.add('container-id-' + intContainerID);
            }
        }
    });
});