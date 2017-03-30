
window.addEventListener('design-register-element', function () {
    registerDesignSnippet('Empty <gs-page>', '<gs-page>', 'gs-page>\n' +
                                                          '    $0\n' +
                                                          '</gs-page>');
    registerDesignSnippet('<gs-page> With Header', '<gs-page>', 'gs-page>\n' +
                                                         '    <gs-header>\n' +
                                                         '        <center><h3>${1}</h3></center>\n' +
                                                         '    </gs-header>\n' +
                                                         '    <gs-body>\n' +
                                                         '        $0\n' +
                                                         '    </gs-body>\n' +
                                                         '</gs-page>');
    registerDesignSnippet('Full <gs-page>', '<gs-page>', 'gs-page>\n' +
                                                         '    <gs-header>\n' +
                                                         '        <center><h3>${1}</h3></center>\n' +
                                                         '    </gs-header>\n' +
                                                         '    <gs-body>\n' +
                                                         '        $0\n' +
                                                         '    </gs-body>\n' +
                                                         '    <gs-footer>${2}</gs-footer>\n' +
                                                         '</gs-page>');
    
    designRegisterElement('gs-page', '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-page.html');
    
    window.designElementProperty_GSPAGE = function (selectedElement) {
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
    
    // dont do anything that modifies the element here
    function elementCreated(element) {
        // if "created" hasn't been suspended: run created code
        if (!element.hasAttribute('suspend-created')) {
            var observer,
                headerElement = xtag.queryChildren(element, 'gs-header')[0],
                footerElement = xtag.queryChildren(element, 'gs-footer')[0];
            
            // create an observer instance
            observer = new MutationObserver(function(mutations) {
                element.recalculatePadding();
                //console.log('mutation observed');
            });
            
            // pass in the element node, as well as the observer options
            if (headerElement) {
                observer.observe(headerElement, {childList: true, subtree: true});
            }
            if (footerElement) {
                observer.observe(footerElement, {childList: true, subtree: true});
            }
        }
    }
    
    //
    function elementInserted(element) {
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                
                element.recalculatePadding();
                
                window.addEventListener('load', function () {
                    element.recalculatePadding();
                });
                window.addEventListener('resize', function () {
                    element.recalculatePadding();
                });
                element.recalculatePadding();
            }
        }
    }
    
    xtag.register('gs-page', {
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
                    // attribute code
                }
            }
        },
        events: {},
        accessors: {},
        methods: {
            recalculatePadding: function () {
                var headerElement = xtag.queryChildren(this, 'gs-header')[0],
                    footerElement = xtag.queryChildren(this, 'gs-footer')[0];
                
                if (headerElement) {
                    //console.log('1***', headerElement.offsetHeight);
                    this.style.paddingTop = headerElement.offsetHeight + 'px';
                } else {
                    this.style.paddingTop = '';
                }
                if (footerElement) {
                    //console.log('2***', footerElement.offsetHeight);
                    this.style.paddingBottom = footerElement.offsetHeight + 'px';
                } else {
                    this.style.paddingBottom = '';
                }
            }
        }
    });
});