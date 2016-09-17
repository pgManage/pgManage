
// #######################################################
// #################### INPUT ELEMENT ####################
// #######################################################

//designRegisterElement('input', 'control');

// properties for an input element
function designElementProperty_INPUT(selectedElement) {
    addProp('Type', true, '<gs-select class="target" value="' + (selectedElement.getAttribute('type') || 'text') + '" mini>' +
                                '<option value="button">button</option>' +
                                '<option value="checkbox">checkbox</option>' +
                                '<option value="color">color</option>' +
                                '<option value="date">date</option>' +
                                '<option value="datetime">datetime</option>' +
                                '<option value="datetime-local">datetime-local</option>' +
                                '<option value="email">email</option>' +
                                '<option value="file">file</option>' +
                                '<option value="hidden">hidden</option>' +
                                '<option value="image">image</option>' +
                                '<option value="month">month</option>' +
                                '<option value="number">number</option>' +
                                '<option value="password">password</option>' +
                                '<option value="radio">radio</option>' +
                                '<option value="range">range</option>' +
                                '<option value="reset">reset</option>' +
                                '<option value="search">search</option>' +
                                '<option value="submit">submit</option>' +
                                '<option value="tel">telephone</option>' +
                                '<option value="text">text</option>' +
                                '<option value="time">time</option>' +
                                '<option value="url">url</option>' +
                                '<option value="week">week</option>' +
                            '</gs-select>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'type', this.value);
    });
    
    addProp('Value', true, '<gs-text class="target" value="' + (selectedElement.getAttribute('value') || '') + '" mini></gs-text>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'value', this.value);
    });
    
    addProp('Placeholder', true, '<gs-text class="target" value="' + (selectedElement.getAttribute('placeholder') || '') + '" mini></gs-text>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'placeholder', this.value);
    });
    
    addProp('Name', true, '<gs-text class="target" value="' + (selectedElement.getAttribute('name') || '') + '" mini></gs-text>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'name', this.value);
    });
    
    addProp('Maxlength', true, '<gs-number class="target" value="' + (selectedElement.getAttribute('maxlength') || '') + '" mini></gs-number>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'maxlength', this.value);
    });
    
    addProp('Autocorrect', true, '<gs-checkbox class="target" value="' + (selectedElement.getAttribute('autocorrect') !== 'off') + '" mini></gs-checkbox>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'autocorrect', (this.value === 'false' ? 'off' : ''));
    });
    
    addProp('Autocapitalize', true, '<gs-checkbox class="target" value="' + (selectedElement.getAttribute('autocapitalize') !== 'off') + '" mini></gs-checkbox>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'autocapitalize', (this.value === 'false' ? 'off' : ''));
    });
    
    addProp('Autocomplete', true, '<gs-checkbox class="target" value="' + (selectedElement.getAttribute('autocomplete') !== 'off') + '" mini></gs-checkbox>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'autocomplete', (this.value === 'false' ? 'off' : ''));
    });
    
    addProp('Autofocus', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('autofocus')) + '" mini></gs-checkbox>', function () {
        return setOrRemoveBooleanAttribute(selectedElement, 'autofocus', (this.value === 'true'), true);
    });
    
    addFlexContainerProps(selectedElement);
    addFlexProps(selectedElement);
    
    // TITLE attribute
    addProp('Title', true, '<gs-text class="target" value="' + (selectedElement.getAttribute('title') || '') + '" mini></gs-text>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'title', this.value);
    });
    
    // TABINDEX attribute
    addProp('Tabindex', true, '<gs-number class="target" value="' + (selectedElement.getAttribute('tabindex') || '') + '" mini></gs-number>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'tabindex', this.value);
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
    
    // DISABLED attribute
    addProp('Disabled', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('disabled') || '') + '" mini></gs-checkbox>', function () {
        return setOrRemoveBooleanAttribute(selectedElement, 'disabled', this.value === 'true', true);
    });
}

//// default insert HTML for an input element
//function designElementInsert_INPUT() {
//    return '<input type="text" />';
//}


// ######################################################
// ################## TEMPLATE ELEMENT ##################
// ######################################################

//designRegisterElement('template', 'container');

function designElementProperty_TEMPLATE(selectedElement) {
    addProp('For', true, '<gs-text class="target" value="' + (selectedElement.getAttribute('for') || '') + '" mini></gs-text>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'for', this.value);
    });
}
function designElementInsert_TEMPLATE() {
    return '<template></template>';
}


// #######################################################
// #################### TABLE ELEMENT ####################
// #######################################################

//designRegisterElement('table', 'table_related');

function designElementProperty_TABLE(selectedElement) {
    //addFlexContainerProps(selectedElement);
    addFlexProps(selectedElement);
}
function designElementInsert_TABLE() {
    return ml(function () {/*
        <table>
            <thead></thead>
            <tbody></tbody>
        </table>
    */});
}


// #######################################################
// #################### THEAD ELEMENT ####################
// #######################################################

//designRegisterElement('thead', 'table_related');

function designElementProperty_THEAD(selectedElement) {}
function designElementInsert_THEAD() {
    return '<thead></thead>';
}


// #######################################################
// #################### TBODY ELEMENT ####################
// #######################################################

//designRegisterElement('tbody', 'table_related');

function designElementProperty_TBODY(selectedElement) {}
function designElementInsert_TBODY() {
    return '<tbody></tbody>';
}


// ######################################################
// ##################### TR ELEMENT #####################
// ######################################################

//designRegisterElement('tr', 'table_related');

function designElementProperty_TR(selectedElement) {}
function designElementInsert_TR() {
    return '<tr></tr>';
}


// ######################################################
// ##################### TD ELEMENT #####################
// ######################################################

//designRegisterElement('td', 'table_related');

function designElementProperty_TD(selectedElement) {
    addFlexContainerProps(selectedElement);
    //addFlexProps(selectedElement);
    
    addProp('Heading', true, '<gs-text class="target" value="' + (selectedElement.getAttribute('heading') || '') + '" mini></gs-text>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'heading', this.value);
    });
}
function designElementInsert_TD() {
    return '<td></td>';
}


// ######################################################
// ##################### TH ELEMENT #####################
// ######################################################

//designRegisterElement('th', 'table_related');

function designElementProperty_TH(selectedElement) {
    addFlexContainerProps(selectedElement);
    //addFlexProps(selectedElement);
    
    addProp('Heading', true, '<gs-text class="target" value="' + (selectedElement.getAttribute('heading') || '') + '" mini></gs-text>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'heading', this.value);
    });
}
function designElementInsert_TH() {
    return '<th></th>';
}


// #######################################################
// ##################### DIV ELEMENT #####################
// #######################################################

//designRegisterElement('div', 'container');

function designElementProperty_DIV(selectedElement) {
    addFlexContainerProps(selectedElement);
    addFlexProps(selectedElement);
    
    // DISABLED attribute
    addProp('Disabled', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('disabled') || '') + '" mini></gs-checkbox>', function () {
        return setOrRemoveBooleanAttribute(selectedElement, 'disabled', this.value === 'true', true);
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
}
function designElementInsert_DIV() {
    return '<div></div>';
}


// ######################################################
// #################### SPAN ELEMENT ####################
// ######################################################

//designRegisterElement('span', 'text');

function designElementProperty_SPAN(selectedElement) {
    //addFlexContainerProps(selectedElement);
    addFlexProps(selectedElement);
    
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
    
    addProp('Text', true, '<gs-text class="target" value="' + (selectedElement.textContent || '') + '" mini></gs-text>', function () {
        selectedElement.textContent = this.value;
        
        return selectedElement;
    });
}
function designElementInsert_SPAN() {
    return '<span></span>';
}


// #######################################################
// #################### H1-H6 ELEMENT ####################
// #######################################################

//designRegisterElement('h1', 'text');
//designRegisterElement('h2', 'text');
//designRegisterElement('h3', 'text');
//designRegisterElement('h4', 'text');
//designRegisterElement('h5', 'text');
//designRegisterElement('h6', 'text');

function designElementProperty_H1(selectedElement) {
    addFlexContainerProps(selectedElement);
    addFlexProps(selectedElement);
    
    addProp('Text', true, '<gs-text class="target" value="' + (selectedElement.textContent || '') + '" mini></gs-text>', function () {
        selectedElement.textContent = this.value;
        
        return selectedElement;
    });
}
function designElementProperty_H2(selectedElement) {
    addFlexContainerProps(selectedElement);
    addFlexProps(selectedElement);
    
    addProp('Text', true, '<gs-text class="target" value="' + (selectedElement.textContent || '') + '" mini></gs-text>', function () {
        selectedElement.textContent = this.value;
        
        return selectedElement;
    });
}
function designElementProperty_H3(selectedElement) {
    addFlexContainerProps(selectedElement);
    addFlexProps(selectedElement);
    
    addProp('Text', true, '<gs-text class="target" value="' + (selectedElement.textContent || '') + '" mini></gs-text>', function () {
        selectedElement.textContent = this.value;
        
        return selectedElement;
    });
}
function designElementProperty_H4(selectedElement) {
    addFlexContainerProps(selectedElement);
    addFlexProps(selectedElement);
    
    addProp('Text', true, '<gs-text class="target" value="' + (selectedElement.textContent || '') + '" mini></gs-text>', function () {
        selectedElement.textContent = this.value;
        
        return selectedElement;
    });
}
function designElementProperty_H5(selectedElement) {
    addFlexContainerProps(selectedElement);
    addFlexProps(selectedElement);
    
    addProp('Text', true, '<gs-text class="target" value="' + (selectedElement.textContent || '') + '" mini></gs-text>', function () {
        selectedElement.textContent = this.value;
        
        return selectedElement;
    });
}
function designElementProperty_H6(selectedElement) {
    addFlexContainerProps(selectedElement);
    addFlexProps(selectedElement);
    
    addProp('Text', true, '<gs-text class="target" value="' + (selectedElement.textContent || '') + '" mini></gs-text>', function () {
        selectedElement.textContent = this.value;
        
        return selectedElement;
    });
}

function designElementInsert_H1() { return '<h1></h1>'; }
function designElementInsert_H2() { return '<h2></h2>'; }
function designElementInsert_H3() { return '<h3></h3>'; }
function designElementInsert_H4() { return '<h4></h4>'; }
function designElementInsert_H5() { return '<h5></h5>'; }
function designElementInsert_H6() { return '<h6></h6>'; }


// #######################################################
// #################### LABEL ELEMENT ####################
// #######################################################

//designRegisterElement('label', 'text');

function designElementProperty_LABEL(selectedElement) {
    
    // if there are no children: TEXT CONTENT
    addProp('Text', true, '<gs-text class="target" value="' + (selectedElement.textContent || '') + '" mini></gs-text>', function () {
        selectedElement.textContent = this.value;
        
        return selectedElement;
    });
    
    // TITLE attribute
    addProp('Title', true, '<gs-text class="target" value="' + (selectedElement.getAttribute('title') || '') + '" mini></gs-text>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'title', this.value);
    });

    addFlexContainerProps(selectedElement);
    addFlexProps(selectedElement);
    
    addProp('For', true, '<gs-text class="target" value="' + (selectedElement.getAttribute('for') || '') + '" mini></gs-text>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'for', this.value);
    });
    
    addProp('Mini', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('mini')) + '" mini></gs-checkbox>', function () {
        return setOrRemoveBooleanAttribute(selectedElement, 'mini', (this.value === 'true'), true);
    });
}
function designElementInsert_LABEL() {
    return '<label></label>';
}


// ######################################################
// ##################### BR ELEMENT #####################
// ######################################################

//designRegisterElement('br', 'text');

function designElementProperty_BR(selectedElement) {}
function designElementInsert_BR() {
    return '<br />';
}


// ######################################################
// ##################### HR ELEMENT #####################
// ######################################################

//designRegisterElement('hr', 'text');

function designElementProperty_HR(selectedElement) {}
function designElementInsert_HR() {
    return '<hr />';
}


// ######################################################
// ################### CENTER ELEMENT ###################
// ######################################################

//designRegisterElement('center', 'text');

function designElementProperty_CENTER(selectedElement) {
    //addFlexContainerProps(selectedElement);
    addFlexProps(selectedElement);
}
function designElementInsert_CENTER() {
    return '<center></center>';
}


// #######################################################
// ##################### PRE ELEMENT #####################
// #######################################################

//designRegisterElement('pre', 'text');

function designElementProperty_PRE(selectedElement) {
    //addFlexContainerProps(selectedElement);
    addFlexProps(selectedElement);
}
function designElementInsert_PRE() {
    return '<pre></pre>';
}


// #######################################################
// ###################### A ELEMENT ######################
// #######################################################

//designRegisterElement('a', 'text');

function designElementProperty_A(selectedElement) {
    //addFlexContainerProps(selectedElement);
    addFlexProps(selectedElement);
    
    addProp('Href', true, '<gs-text class="target" value="' + (selectedElement.getAttribute('href') || '') + '" mini></gs-text>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'href', this.value);
    });
    
    addProp('Target', true, '<gs-select class="target" value="' + (selectedElement.getAttribute('target') || '') + '" mini>' +
                              '<option value="">Current Window</option>' +
                              '<option value="_blank">New Window</option>' +
                          '</gs-select>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'target', this.value);
    });
}
function designElementInsert_A() {
    return '<a></a>';
}


// ########################################################
// #################### SCRIPT ELEMENT ####################
// ########################################################

//designRegisterElement('script', 'text');

function designElementProperty_SCRIPT(selectedElement) {
    addProp('Source', true, '<gs-text class="target" value="' + (selectedElement.getAttribute('src') || '') + '" mini></gs-text>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'src', this.value);
    });
}
function designElementInsert_SCRIPT() {
    return '<script type="text/javascript"></script>';
}


// #######################################################
// #################### STYLE ELEMENT ####################
// #######################################################

//designRegisterElement('style', 'text');

function designElementProperty_STYLE(selectedElement) {
    
}
function designElementInsert_STYLE() {
    return '<style></style>';
}


// #######################################################
// #################### LINK ELEMENT ####################
// #######################################################

//designRegisterElement('link', '');

function designElementProperty_LINK(selectedElement) {
    addProp('Href', true, '<gs-text class="target" value="' + (selectedElement.getAttribute('href') || '') + '" mini></gs-text>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'href', this.value);
    });
}
function designElementInsert_LINK() {
    return '<link type="text/css" rel="stylesheet" />';
}

