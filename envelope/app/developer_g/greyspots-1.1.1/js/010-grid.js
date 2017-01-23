
window.addEventListener('design-register-element', function () {
    'use strict';
    registerDesignSnippet('<gs-grid>', '<gs-grid>', 'gs-grid widths="${1}">\n' +
                                                    '    <gs-block>${2}</gs-block>\n' +
                                                    '</gs-grid>');
    
    designRegisterElement('gs-grid', (location.pathname.indexOf('/v1/') === 0 ? '/v1/dev/' : '/env/app/') + 'developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-grid.html');
    
    window.designElementProperty_GSGRID = function(selectedElement) {
        addProp('Min-Width Media', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('min-width') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'min-width', this.value);
        });
        
        addProp('Media', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('media') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'media', this.value);
        });
        
        addProp('Widths', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('widths') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'widths', this.value);
        });
        
        addProp('Padded', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('padded')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'padded', (this.value === 'true'), true);
        });
        
        addProp('Gutters', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('gutter')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'gutter', (this.value === 'true'), true);
        });
        
        addProp('Reflow At', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('reflow-at') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'reflow-at', this.value);
        });
        
        // TITLE attribute
        addProp('Title', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('title') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'title', this.value);
        });
        
        // SUSPEND-CREATED attribute
        addProp('suspend-created', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-created') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suspend-created', this.value === 'true', true);
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
    
window.addEventListener('design-register-element', function () {
    'use strict';
    
    registerDesignSnippet('<gs-block>', '<gs-block>', 'gs-block>${2}</gs-block>');
    
    designRegisterElement('gs-block', (location.pathname.indexOf('/v1/') === 0 ? '/v1/dev/' : '/env/app/') + 'developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-grid.html');
    
    window.designElementProperty_GSBLOCK = function(selectedElement) {
        addProp('Width:', true, '<gs-text class="target" value="' + (selectedElement.getAttribute('width') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'width', this.value);
        });
        
        // TITLE attribute
        addProp('Title', true, '<gs-text class="target" value="' + (selectedElement.getAttribute('title') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'title', this.value);
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
        
        addFlexContainerProps(selectedElement);
        //addFlexProps(selectedElement);
    };
});

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    var arrTakenGrids = [];
    
    function handleObserver(element) {
        var observer = new MutationObserver(function(mutations) {
            element.handleBlocks();
        });
        
        observer.observe(element, {childList: true});
    }
    
    // dont do anything that modifies the element here
    function elementCreated(element) {
        // if "created" hasn't been suspended: run created code
        if (!element.hasAttribute('suspend-created')) {
            handleObserver(element);
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
                
                // if no width parameter is set: default
                if (!element.getAttribute('widths') && !element.getAttribute('min-width') && !element.getAttribute('media')) {
                    element.bolIgnoreAttribute = true;
                    element.setAttribute('widths', new Array(xtag.queryChildren(element, 'gs-block').length + 1)
                                                                    .join('1').split('').join(','));
                    element.bolIgnoreAttribute = false;
                }
                
                element.handleCSS();
                element.handleBlocks();
            }
        }
    }
    
    xtag.register('gs-grid', {
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
                    // if the "widths" attribute changed
                    if (strAttrName === 'widths' && this.bolIgnoreAttribute !== true) {
                        this.handleCSS();
                        this.handleBlocks();
                        
                    // if the "reflow-at" attribute changed
                    } else if (strAttrName === 'reflow-at') {
                        this.handleCSS();
                        
                    // if the "min-width" attribute changed
                    } else if (strAttrName === 'min-width') {
                        this.handleCSS();
                        this.handleBlocks();
                        
                    // if the "media" attribute changed
                    } else if (strAttrName === 'media') {
                        this.handleCSS();
                        this.handleBlocks();
                    }
                }
            }
        },
        events: {},
        accessors: {},
        methods: {
            
            getWidthsParameters: function (strWidths) {
                var arrWidths, intGridWidth, i, len;
                
                arrWidths = strWidths
                        .replace(/[^0-9,]/gim, '') // remove everything except commas and numbers
                        .replace(/,{1,}/gim, ',')  // replace multiple commas right next to each other with a single comma
                        .replace(/^,|,$/gim, '')   // remove commas at the end and the beginning of the line
                        .split(',');               // split on commas to make an array of numbers (which are currently type 'string')
                
                // if the array doesn't have content: error
                if (arrWidths.length === 0) {
                    throw 'gs-grid Error: no valid widths found. Please put a comma seperated list of widths in the "widths" attribute.';
                }
                
                // convert the array of strings to an array of integers
                for (i = 0, len = arrWidths.length; i < len; i += 1) {
                    arrWidths[i] = parseInt(arrWidths[i], 10);
                }
                
                // add up the array of integers to come up with a grid width
                for (i = 0, len = arrWidths.length, intGridWidth = 0; i < len; i += 1) {
                    intGridWidth += arrWidths[i];
                }
                
                return {
                    'arrWidths': arrWidths,
                    'intGridWidth': intGridWidth
                };
            },
            
            handleCSS: function () {
                var jsnWidthsParameters;
                
                if (this.getAttribute('widths')) {
                    jsnWidthsParameters = this.getWidthsParameters(this.getAttribute('widths'));
                    
                    this.handleWidthsCSS(jsnWidthsParameters.arrWidths, jsnWidthsParameters.intGridWidth);
                    
                } else if (this.getAttribute('min-width')) {
                    this.handleMinWidthCSS();
                    
                } else if (this.getAttribute('media')) {
                    this.handleMediaCSS();
                }
            },
            
            handleBlocks: function () {
                var jsnWidthsParameters;
                
                if (this.getAttribute('widths')) {
                    jsnWidthsParameters = this.getWidthsParameters(this.getAttribute('widths'));
                    
                    this.handleWidthsBlocks(jsnWidthsParameters.arrWidths, jsnWidthsParameters.intGridWidth);
                    
                } else if (this.getAttribute('min-width')) {
                    this.handleMinWidthBlocks();
                    
                } else if (this.getAttribute('media')) {
                    this.handleMediaBlocks();
                }
            },
            
            
            
            
            handleWidthsCSS: function (arrWidths, intGridWidth) {
                var styleElement = document.getElementById('gs-dynamic-css'),
                    i, len, strCurrentWidth, intCurrentWidth, widthIncreaseAmount, strCSS,
                    strReflowAt = this.getAttribute('reflow-at') || '', arrClassesToRemove;
                
                // reflow-at shortcuts
                strReflowAt = strReflowAt.replace(/small|sml/g,  '992px');
                strReflowAt = strReflowAt.replace(/medium|med/g, '1200px');
                strReflowAt = strReflowAt.replace(/large|lrg/g,  '10000px');
                
                // remove old classes
                arrClassesToRemove = String(this.classList).match(/width-[0-9]*/g) || [];
                
                for (i = 0, len = arrClassesToRemove.length; i < len; i += 1) {
                    this.classList.remove(arrClassesToRemove[i]);
                }
                
                // make sure that this grid hasn't been done before
                if (!styleElement.classList.contains('col-' + intGridWidth)) {
                    // column CSS
                    
                    // calculate the amount to increase every block width setting by
                    widthIncreaseAmount = 100 / intGridWidth;
                    
                    // create a style for every block
                    for (i = 0, len = intGridWidth, intCurrentWidth = 0, strCSS = ''; i < len; i += 1) {
                        intCurrentWidth += widthIncreaseAmount;
                        strCurrentWidth = String(parseFloat(intCurrentWidth.toFixed(5).toString(), 10));
                        
                        strCSS += 'gs-grid.width-' + intGridWidth + ' > gs-block[width="' + (i + 1) + '"] { width: ' + strCurrentWidth + '%; }\n';
                    }
                    
                    // add col-NUM to the styleElement's "class" attribute
                    styleElement.classList.add('col-' + intGridWidth);
                    
                    // append the column CSS
                    styleElement.innerHTML += '\n/* grid width: ' + intGridWidth + ' */\n' +
                                              strCSS +
                                              'gs-grid.width-' + intGridWidth + ' > gs-block.first-of-row { padding-left: 0; }\n' +
                                              'gs-grid.width-' + intGridWidth + ' > gs-block.last-of-row { padding-right: 0; }\n';
                }
                
                // reflow CSS
                
                // remove class from the gs-grid that allowed the generated reflow CSS to apply
                this.classList.remove('reflow-' + this.strReflowAt);
                
                // clean reflow-at attribute variable
                strReflowAt = strReflowAt.replace(/[^0-9a-z]/gi, '');
                
                // if reflow-at contains anything
                if (strReflowAt) {
                    // if reflow-at doesn't have a unit specified: add 'px' to the end of it
                    if (strReflowAt.replace(/[0-9]/gi, '') === '') {
                        strReflowAt += 'px';
                    }
                    
                    // save the current reflow width so that we can use it later
                    this.strReflowAt = strReflowAt;
                    
                    // add class to the gs-grid so that the generated reflow CSS will apply
                    this.classList.add('reflow-' + strReflowAt);
                    
                    // if the reflow CSS for this grid width doesn't already exist: append it
                    if (!styleElement.classList.contains('reflow-' + strReflowAt)) {
                        
                        // add reflow-SIZE to the styleElement's "class" attribute
                        styleElement.classList.add('reflow-' + strReflowAt);
                        
                        // append the reflow CSS
                        styleElement.innerHTML += '\n/* grid reflow width: ' + strReflowAt + ' */\n' +
                                                  '@media only all and (max-width: ' + strReflowAt + ') {\n' +
                                                  '    gs-grid.reflow-' + strReflowAt + '            { width: 100%; }\n' +
                                                  '    gs-grid.reflow-' + strReflowAt + ' > gs-block { width: auto !important; float: none; }\n' +
                                                  '    gs-grid.reflow-' + strReflowAt + ' > gs-block { padding-left: 0 !important; padding-right: 0 !important; }\n' +
                                                  '}\n';
                    }
                }
                
                // apply CSS for blocks
                this.classList.add('width-' + intGridWidth);
            },
            
            handleMinWidthCSS: function () {
                var strMinWidth = this.getAttribute('min-width'), arrMinWidths, strCSS, strCurrentCSS,
                    i, len, arrParts, strWidth, strResult, intCurrentGridID, bolMedia, intCurrentWidth,
                    strCurrentWidth, intGridWidth, widthIncreaseAmount, grid_i, grid_len, intLayout, arrArrGridWidths,
                    column_i, column_len, arrWidths = [], width_i, strNextWidth;
                
                // 0 {1,1}; 1000 {2,1}; 10000 {2,1}; 12000 {1,1}
                // all {reflow}; sml {1,1}; med {1,1,1}; lrg {reflow}
                
                strMinWidth = strMinWidth.replace(/\s+/g, ''); // remove all whitespace
                strMinWidth = strMinWidth.replace(/\}/g, ''); // remove all close curly braces
                strMinWidth = strMinWidth.toLowerCase(); // lowercase
                strMinWidth = GS.trim(strMinWidth, ';'); // trim off semicolons
                
                // replace shortcuts (lrg => 1200px)
                strMinWidth = strMinWidth.replace(/all/g,        '0px');
                strMinWidth = strMinWidth.replace(/small|sml/g,  '768px');
                strMinWidth = strMinWidth.replace(/medium|med/g, '992px');
                strMinWidth = strMinWidth.replace(/large|lrg/g,  '1200px');
                
                arrMinWidths = strMinWidth.split(';'); // seperate out layouts
                
                //console.log(strMinWidth, arrMinWidths);
                
                if (arrTakenGrids.indexOf(strMinWidth) === -1) {
                    arrTakenGrids.push(strMinWidth);
                    intCurrentGridID = arrTakenGrids.length - 1;
                    strCSS = '';
                    arrArrGridWidths = [];
                    
                    for (i = 0, len = arrMinWidths.length, intLayout = 0; i < len; i += 1) {
                        arrParts = arrMinWidths[i].split('{');
                        strWidth = arrParts[0] || '0px';
                        strResult = arrParts[1] || new Array(xtag.queryChildren(element, 'gs-block').length + 1)
                                                                    .join('1').split('').join(',');
                        bolMedia = parseInt(strWidth) > 0;
                        strCurrentCSS = '';
                        
                        if (strResult === 'reflow') {
                            intLayout += 1;
                            arrArrGridWidths.push('reflow');
                            
                            // reflow css
                            strCurrentCSS += 
                                '    gs-grid.grid-id-' + intCurrentGridID + '            { width: 100%; }\n' +
                                '    gs-grid.grid-id-' + intCurrentGridID + ' > gs-block.reflow-layout-' + intLayout +
                                                                                            ' { width: auto; float: none; }\n' +
                                '    gs-grid.grid-id-' + intCurrentGridID + ' > gs-block.reflow-layout-' + intLayout +
                                                                                            ' { padding-left: 0; padding-right: 0; }\n';
                            
                        } else {
                            intLayout += 1;
                            arrArrGridWidths.push(strResult.split(','));
                            
                            // grid css
                            intGridWidth = this.getWidthsParameters(strResult).intGridWidth;
                            
                            // calculate the amount to increase every block width setting by
                            widthIncreaseAmount = 100 / intGridWidth;
                            
                            // create a style for every block
                            for (grid_i = 0, grid_len = intGridWidth, intCurrentWidth = 0; grid_i < grid_len; grid_i += 1) {
                                intCurrentWidth += widthIncreaseAmount;
                                strCurrentWidth = String(parseFloat(intCurrentWidth.toFixed(5).toString(), 10));
                                
                                strCurrentCSS += '    gs-grid.grid-id-' + intCurrentGridID + ' > gs-block.width-' + (grid_i + 1) + '-layout-' + intLayout + ' { ' +
                                                     'width: ' + strCurrentWidth + '%; float: left; ' +
                                                 '}\n';
                            }
                            
                            strCurrentCSS =
                                '    gs-grid.grid-id-' + intCurrentGridID + ' > gs-block.clearfix-layout-' + intLayout +
                                            ' { clear: left; }\n\n' +
                                '    gs-grid.grid-id-' + intCurrentGridID + '[gutter] > gs-block { padding-left: 0.5em; padding-right: 0.5em; }\n\n' +
                                '    gs-grid.grid-id-' + intCurrentGridID + ' > gs-block.first-of-row-layout-' + intLayout +
                                            ' { padding-left: 0; }\n\n' +
                                '    gs-grid.grid-id-' + intCurrentGridID + ' > gs-block.last-of-row-layout-' + intLayout +
                                            ' { padding-right: 0; }\n\n' +
                                strCurrentCSS;
                        }
                        
                        //if (bolMedia) {
                        strNextWidth = '';
                        if (arrMinWidths[i + 1]) {
                            strNextWidth = arrMinWidths[i + 1].split('{')[0];
                            
                            // subtract 1 from the next width so that max-width doesn't allow the
                            //      media to apply at the same time as the next media
                            strNextWidth = (parseInt(strNextWidth) - 1) + strNextWidth.replace(/[0-9]/g, '');
                        }
                        
                        strCurrentCSS = '\n@media (min-width:' + strWidth + ')' + (strNextWidth ? ' and (max-width:' + strNextWidth + ')' : '') + ' {\n' +
                                            strCurrentCSS +
                                        '}\n';
                        //}
                        
                        strCSS += strCurrentCSS;
                    }
                    //console.log(strCSS);
                    
                    // append the column CSS
                    document.getElementById('gs-dynamic-css').innerHTML += '\n/* grid #' + intCurrentGridID + ' */\n' + strCSS;
                    
                } else {
                    intCurrentGridID = arrTakenGrids.indexOf(strMinWidth);
                    arrArrGridWidths = [];
                    
                    for (i = 0, len = arrMinWidths.length, intLayout = 0; i < len; i += 1) {
                        arrParts = arrMinWidths[i].split('{');
                        strWidth = arrParts[0] || '0px';
                        strResult = arrParts[1] || new Array(xtag.queryChildren(element, 'gs-block').length + 1)
                                                                    .join('1').split('').join(',');
                        
                        intLayout += 1;
                        
                        if (strResult !== 'reflow') {
                            arrArrGridWidths.push(strResult.split(','));
                        } else {
                            arrArrGridWidths.push('reflow');
                        }
                    }
                }
                
                //
                this.intLayouts = intLayout;
                this.arrArrWidths = arrArrGridWidths;
                
                for (i = 0, len = this.arrArrWidths.length; i < len; i += 1) {
                    if (this.arrArrWidths[i] !== 'reflow') {
                        arrWidths.push(0);
                        width_i = arrWidths.length - 1;
                        
                        for (column_i = 0, column_len = this.arrArrWidths[i].length; column_i < column_len; column_i += 1) {
                            this.arrArrWidths[i][column_i] = parseInt(this.arrArrWidths[i][column_i], 10);
                            arrWidths[width_i] += 1;
                        }
                    } else {
                        arrWidths.push('reflow');
                    }
                }
                
                this.arrWidths = arrWidths;
                
                // add class so that the CSS can apply
                this.classList.add('grid-id-' + intCurrentGridID);
            },
            
            handleMediaCSS: function () {
                var strMinWidth = this.getAttribute('media'), arrMinWidths, strCSS, strCurrentCSS,
                    i, len, arrParts, strMedia, strResult, intCurrentGridID, bolMedia, intCurrentWidth,
                    strCurrentWidth, intGridWidth, widthIncreaseAmount, grid_i, grid_len, intLayout, arrArrGridWidths,
                    column_i, column_len, arrWidths = [], width_i;
                
                strMinWidth = strMinWidth.trim().replace(/\}/g, ''); // remove all close curly braces
                strMinWidth = strMinWidth.toLowerCase(); // lowercase
                strMinWidth = GS.trim(strMinWidth, ';'); // trim off semicolons
                
                // all {reflow}; all and (min-width: small) {2,2,2}; all and (min-width: med) {3,3}; all and (min-width: large) {reflow};
                
                // replace shortcuts (lrg => 1200px)
                strMinWidth = strMinWidth.replace(/small|sml/g,  '768px');
                strMinWidth = strMinWidth.replace(/medium|med/g, '992px');
                strMinWidth = strMinWidth.replace(/large|lrg/g,  '1200px');
                
                arrMinWidths = strMinWidth.split(';'); // seperate out layouts
                
                if (arrTakenGrids.indexOf(strMinWidth) === -1) {
                    arrTakenGrids.push(strMinWidth);
                    intCurrentGridID = arrTakenGrids.length - 1;
                    strCSS = '';
                    arrArrGridWidths = [];
                    
                    //console.log(strMinWidth, arrMinWidths);
                    
                    for (i = 0, len = arrMinWidths.length, intLayout = 0; i < len; i += 1) {
                        arrParts = arrMinWidths[i].split('{');
                        strMedia = arrParts[0].trim() || 'all';
                        strResult = arrParts[1].trim() || new Array(xtag.queryChildren(element, 'gs-block').length + 1)
                                                                    .join('1').split('').join(',');
                        strCurrentCSS = '';
                        
                        if (strResult === 'reflow') {
                            intLayout += 1;
                            arrArrGridWidths.push('reflow');
                            
                            // reflow css
                            strCurrentCSS += 
                                '    gs-grid.grid-id-' + intCurrentGridID + '            { width: 100%; }\n' +
                                '    gs-grid.grid-id-' + intCurrentGridID + ' > gs-block.reflow-layout-' + intLayout +
                                                                                            ' { width: auto; float: none; }\n' +
                                '    gs-grid.grid-id-' + intCurrentGridID + ' > gs-block.reflow-layout-' + intLayout +
                                                                                            ' { padding-left: 0; padding-right: 0; }\n';
                            
                        } else {
                            intLayout += 1;
                            arrArrGridWidths.push(strResult.split(','));
                            
                            // grid css
                            intGridWidth = this.getWidthsParameters(strResult).intGridWidth;
                            
                            // calculate the amount to increase every block width setting by
                            widthIncreaseAmount = 100 / intGridWidth;
                            
                            // create a style for every block
                            for (grid_i = 0, grid_len = intGridWidth, intCurrentWidth = 0; grid_i < grid_len; grid_i += 1) {
                                intCurrentWidth += widthIncreaseAmount;
                                strCurrentWidth = String(parseFloat(intCurrentWidth.toFixed(5).toString(), 10));
                                
                                strCurrentCSS += '    gs-grid.grid-id-' + intCurrentGridID + ' > gs-block.width-' + (grid_i + 1) + '-layout-' + intLayout + ' { ' +
                                                     'width: ' + strCurrentWidth + '%; float: left; ' +
                                                 '}\n';
                            }
                            
                            strCurrentCSS =
                                '    gs-grid.grid-id-' + intCurrentGridID + ' > gs-block.clearfix-layout-' + intLayout +
                                            ' { clear: left; }\n\n' +
                                '    gs-grid.grid-id-' + intCurrentGridID + '[gutter] > gs-block { padding-left: 0.5em; padding-right: 0.5em; }\n\n' +
                                '    gs-grid.grid-id-' + intCurrentGridID + ' > gs-block.first-of-row-layout-' + intLayout +
                                            ' { padding-left: 0; }\n\n' +
                                '    gs-grid.grid-id-' + intCurrentGridID + ' > gs-block.last-of-row-layout-' + intLayout +
                                            ' { padding-right: 0; }\n\n' +
                                strCurrentCSS;
                        }
                        
                        strCurrentCSS = '\n@media ' + strMedia + ' {\n' +
                                            strCurrentCSS +
                                        '}\n';
                        
                        strCSS += strCurrentCSS;
                    }
                    
                    // append the column CSS
                    document.getElementById('gs-dynamic-css').innerHTML += '\n/* grid #' + intCurrentGridID + ' */\n' + strCSS;
                    
                } else {
                    intCurrentGridID = arrTakenGrids.indexOf(strMinWidth);
                    arrArrGridWidths = [];
                    
                    for (i = 0, len = arrMinWidths.length, intLayout = 0; i < len; i += 1) {
                        arrParts = arrMinWidths[i].split('{');
                        strWidth = arrParts[0] || '0px';
                        strResult = arrParts[1] || new Array(xtag.queryChildren(element, 'gs-block').length + 1)
                                                                    .join('1').split('').join(',');
                        
                        intLayout += 1;
                        
                        if (strResult !== 'reflow') {
                            arrArrGridWidths.push(strResult.split(','));
                        } else {
                            arrArrGridWidths.push('reflow');
                        }
                    }
                }
                
                //
                this.intLayouts = intLayout;
                this.arrArrWidths = arrArrGridWidths;
                
                for (i = 0, len = this.arrArrWidths.length; i < len; i += 1) {
                    if (this.arrArrWidths[i] !== 'reflow') {
                        arrWidths.push(0);
                        width_i = arrWidths.length - 1;
                        
                        for (column_i = 0, column_len = this.arrArrWidths[i].length; column_i < column_len; column_i += 1) {
                            this.arrArrWidths[i][column_i] = parseInt(this.arrArrWidths[i][column_i], 10);
                            arrWidths[width_i] += 1;
                        }
                    } else {
                        arrWidths.push('reflow');
                    }
                }
                
                this.arrWidths = arrWidths;
                
                //
                this.classList.add('grid-id-' + intCurrentGridID);
            },
            
            
            
            
            
            handleWidthsBlocks: function (arrWidths, intGridWidth) {
                var i, len, unset_i, arrElements, intNumberOfWidths = arrWidths.length, intCurrentRowWidth = 0, intNextToAdd;
                
                // mark initally set blocks
                arrElements = xtag.queryChildren(this, 'gs-block[width]');
                
                for (i = 0, len = arrElements.length; i < len; i += 1) {
                    arrElements[i].initallySet = true;
                }
                
                // get all child blocks
                arrElements = xtag.queryChildren(this, 'gs-block');
                
                // loop through the blocks
                for (i = 0, unset_i = 0, len = arrElements.length; i < len; i += 1) {
                    intNextToAdd = parseInt(arrElements[i].getAttribute('width'), 10) || arrWidths[unset_i % intNumberOfWidths];
                    
                    // if this block wasn't initally set: remove the width attribute
                    if (!arrElements[i].initallySet) {
                        arrElements[i].removeAttribute('width');
                    }
                    arrElements[i].classList.remove('first-of-row');
                    arrElements[i].classList.remove('last-of-row');
                    arrElements[i].style.clear = '';
                    
                    // if this is the first block in the row
                    if (intCurrentRowWidth === 0) {
                        // set the clear to left, this fixes an issue where a tall cell will move a cell over to the right
                        arrElements[i].style.clear = 'left';
                        arrElements[i].classList.add('first-of-row');
                    }
                    
                    // if this is the last block in the row
                    //console.log(intCurrentRowWidth, intNextToAdd, intGridWidth);
                    if ((intCurrentRowWidth + intNextToAdd) === intGridWidth) {
                        arrElements[i].classList.add('last-of-row');
                    }
                    
                    // if this block doesn't have a set width: set its width (if there are more unset width blocks than widths: the widths repeat)
                    if (!arrElements[i].hasAttribute('width')) {
                        arrElements[i].setAttribute('width', arrWidths[unset_i % intNumberOfWidths]);
                        unset_i += 1;
                    }
                    
                    intCurrentRowWidth += intNextToAdd;
                    intCurrentRowWidth = intCurrentRowWidth % intGridWidth;
                }
            },
            
            
            
            iterateBlocks: function (intLayouts, arrArrWidths, arrIntGridWidth) {
                var arrBlocks = xtag.queryChildren(this, 'gs-block'), i, len, block_i, block_len, width_i;
                
                for (i = 0, len = intLayouts; i < len; i += 1) {
                    width_i = 0;
                    
                    //console.log(arrArrWidths[i]);
                    if (arrArrWidths[i] !== 'reflow') {
                        for (block_i = 0, block_len = arrBlocks.length; block_i < block_len; block_i += 1) {
                            // if this is the first block in the row:
                            //      set the clear to left, this fixes an issue where a tall cell will move a cell over to the right
                            if (width_i === 0) {
                                arrBlocks[block_i].classList.add('clearfix-layout-' + (i + 1));
                                arrBlocks[block_i].classList.add('first-of-row-layout-' + (i + 1));
                            } else if ((width_i + 1) === arrIntGridWidth[i]) {
                                arrBlocks[block_i].classList.add('last-of-row-layout-' + (i + 1));
                            }
                            
                            arrBlocks[block_i].classList.add('width-' + arrArrWidths[i][width_i] + '-layout-' + (i + 1));
                            
                            //console.log(width_i, arrArrWidths[i][width_i], arrIntGridWidth[i]);
                            width_i += 1;
                            width_i = width_i % arrIntGridWidth[i];
                        }
                    } else {
                        for (block_i = 0, block_len = arrBlocks.length; block_i < block_len; block_i += 1) {
                            arrBlocks[block_i].classList.add('reflow-layout-' + (i + 1));
                        }
                    }
                }
                
                
            },
            
            handleMinWidthBlocks: function () {
                this.iterateBlocks(this.intLayouts, this.arrArrWidths, this.arrWidths);
            },
            
            handleMediaBlocks: function () {
                this.iterateBlocks(this.intLayouts, this.arrArrWidths, this.arrWidths);
            }
        }
    });
    
    xtag.register('gs-block', {
        lifecycle: {},
        events: {},
        accessors: {},
        methods: {}
    });
});