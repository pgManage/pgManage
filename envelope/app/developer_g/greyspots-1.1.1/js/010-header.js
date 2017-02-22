
window.addEventListener('design-register-element', function () {
    registerDesignSnippet('Centered Header', '<gs-header>', '<gs-header><center><h3>$0</h3></center></gs-header>');
    registerDesignSnippet('Header', '<gs-header>', '<gs-header><h3>$0</h3></gs-header>');
    registerDesignSnippet('<gs-header>', '<gs-header>', 'gs-header><h3>$0</h3></gs-header>');
    
    designRegisterElement('gs-header', '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-page.html');
    
    window.designElementProperty_GSHEADER = function(selectedElement) {
        // TITLE attribute
        addProp('Title', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('title') || '') + '" mini></gs-text>', function () {
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
    xtag.register('gs-header', {
        lifecycle: {
            /*inserted: function () {
                if (this.border_line) {
                    this.removeChild(this.border_line);
                }
                
                this.border_line = document.createElement('div');
                this.border_line.classList.add('border-line');
                this.border_line.setAttribute('gs-dynamic', '');
                
                this.appendChild(this.border_line);
            },
            removed: function () {
                if (this.border_line.parentNode === this) {
                    this.removeChild(this.border_line);
                }
            }*/
        },
        events: {},
        accessors: {},
        methods: {}
    });
});