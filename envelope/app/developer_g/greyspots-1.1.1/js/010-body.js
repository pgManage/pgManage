
window.addEventListener('design-register-element', function () {
    window.designElementProperty_GSBODY = function(selectedElement) {
        addFlexContainerProps(selectedElement);
        //addFlexProps(selectedElement);
    };
    
    registerDesignSnippet('<gs-body>', '<gs-body>', 'gs-body>\n' +
                                                    '    $0\n' +
                                                    '</gs-body>');
    
    designRegisterElement('gs-body', (location.pathname.indexOf('/v1/') === 0 ? '/v1/dev/' : '/env/app/') + 'developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-page.html');
});

document.addEventListener('DOMContentLoaded', function () {
    xtag.register('gs-body', {
        lifecycle: {},
        events: {},
        accessors: {},
        methods: {}
    });
});