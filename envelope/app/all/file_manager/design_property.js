function addProp(strTitle, bolTable, strHTML, changeFunction, bolGlobal) {
    var newRecord, newDiv, listElement, sectionElement, target;
    
    if (strTitle !== 'Text') {
        if (bolGlobal) {
            listElement = document.getElementById('global-property-table-tbody');
            sectionElement = document.getElementById('global-property-section');
        } else {
            listElement = document.getElementById('element-property-table-tbody');
            sectionElement = document.getElementById('element-property-section');
        }
        
        if (bolTable === true) {
            newRecord = document.createElement('tr');
            
            newRecord.innerHTML = '<th>' + strTitle + '</th>' +
                                  '<td>' + strHTML + '</td>';
            
            target = xtag.query(newRecord, '.target')[0];
            
            target.addEventListener('change', function (event) {
                var replacementElement = changeFunction.apply(this, [event]), divElement;
                
                if (!replacementElement) {
                    throw 'property list error: changeFunction() must return an element.';
                }
                
                replaceCurrentTag(GS.cloneElement(replacementElement, document.getElementById('sandbox').contentWindow.document), currentElementData);
            });
            
            listElement.appendChild(newRecord);
            
        } else {
            newDiv = document.createElement('div');
            newDiv.innerHTML = strHTML;
            
            target = xtag.query(newDiv, '.target')[0];
            
            target.addEventListener('change', function (event) {
                var selectedElement, replacementElement = changeFunction.apply(this, [event]), divElement;
                
                if (!replacementElement) {
                    throw 'property list error: changeFunction() must return an element.';
                }
                
                replaceCurrentTag(GS.cloneElement(replacementElement, document.getElementById('sandbox').contentWindow.document), currentElementData);
            });
            
            sectionElement.appendChild(newDiv);
        }
    }
}

function setOrRemoveTextAttribute(element, strAttrName, strAttrContent) {
    if (strAttrContent || strAttrContent === 0) {
        element.setAttribute(strAttrName, strAttrContent);
        
    } else {
        element.removeAttribute(strAttrName);
    }
    
    return element;
}

function setOrRemoveBooleanAttribute(element, strAttrName, bolValue, bolAddState) {
    if (bolValue === bolAddState) {
        element.setAttribute(strAttrName, '');
        
    } else {
        element.removeAttribute(strAttrName);
    }
    
    return element;
}

function addFlexContainerProps(selectedElement) {
    //addProp('Flex Container', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('flex-horizontal') || selectedElement.hasAttribute('flex-vertical')) + '" mini></gs-checkbox>', function () {
    //    if (this.value === 'true') {
    //        selectedElement.setAttribute('flex-horizontal', '');
    //    } else {
    //        selectedElement.removeAttribute('flex-horizontal');
    //        selectedElement.removeAttribute('flex-vertical');
    //    }
    //    
    //    return selectedElement;
    //});
    //
    //if (selectedElement.hasAttribute('flex-horizontal') || selectedElement.hasAttribute('flex-vertical')) {
    //    addProp('Flex Direction', true, '<gs-select class="target" value="' + (selectedElement.hasAttribute('flex-horizontal') ? 'horizontal' : 'vertical') + '" mini>' +
    //                                        '<option value="horizontal">Horizontal</option>' +
    //                                        '<option value="vertical">Vertical</option>' +
    //                                    '</gs-select>', function () {
    //        selectedElement.removeAttribute('flex-horizontal');
    //        selectedElement.removeAttribute('flex-vertical');
    //        
    //        selectedElement.setAttribute('flex-' + this.value, '');
    //        
    //        return selectedElement;
    //    });
    //}
}

function addFlexProps(selectedElement) {
    //if (selectedElement.parentNode.hasAttribute('flex-horizontal')) {
    //    addProp('Flex Width', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('flex') || '') + '" mini></gs-checkbox>', function () {
    //        return setOrRemoveBooleanAttribute(selectedElement, 'flex', this.value === 'true', true);
    //    });
    //    
    //} else if (selectedElement.parentNode.hasAttribute('flex-vertical')) {
    //    addProp('Flex Height', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('flex') || '') + '" mini></gs-checkbox>', function () {
    //        return setOrRemoveBooleanAttribute(selectedElement, 'flex', this.value === 'true', true);
    //    });
    //}
}

function propertyList(selectedElement, currentElement) {
    var i, len, buttonElement, arrDynamicElements, divElement, arrTarget, strVisibilityAttribute,
        elementPropertySection = document.getElementById('element-property-section'),
        globalPropertySection = document.getElementById('global-property-section');
    
    currentElementData = currentElement;
    selectedElement = GS.cloneElement(selectedElement, document.getElementById('sandbox').contentWindow.document);
    
    document.getElementById('element-property-title').innerHTML = 
        '<span class="tag-name">' + encodeHTML(selectedElement.nodeName) + '</span>' + 
        '<span class="tag-selector">' + encodeHTML(selectorTitleForElement(selectedElement)) + '</span><br />' +
        '<span class="line-number">Line #: ' + currentElementData.linenumber + '</span>';
    document.getElementById('property-panel-padding').removeAttribute('disabled');
    
    if (jsnTagData[selectedElement.nodeName]) {
        document.getElementById('element-documentation-link').setAttribute('href', jsnTagData[selectedElement.nodeName].documentation);
        document.getElementById('element-documentation-link').removeAttribute('hidden');
    } else {
        document.getElementById('element-documentation-link').setAttribute('hidden', '');
    }
    
    // create containers for element and global element properties
    elementPropertySection.innerHTML = '<table>' +
                                            '<tbody id="element-property-table-tbody"></tbody>' +
                                        '</table><br />';
    
    globalPropertySection.innerHTML =  '<table>' +
                                            '<tbody id="global-property-table-tbody"></tbody>' +
                                        '</table><br />';
    
    
    // ID attribute
    addProp('ID', true, '<gs-text class="target" value="' + (selectedElement.getAttribute('id') || '') + '" mini></gs-text>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'id', this.value);
    }, true);
    
    // CLASS attribute
    addProp('Classes', true, '<gs-text class="target" value="' + (selectedElement.getAttribute('class') || '') + '" mini></gs-text>', function () {
        return setOrRemoveTextAttribute(selectedElement, 'class', this.value);
    }, true);
    
    // get element specific property list (if it exists)
    //console.log(window['designElementProperty_' + selectedElement.nodeName.replace(/[-_]*/gi, '')], 'designElementProperty_' + selectedElement.nodeName.replace(/[-_]*/gi, ''));
    
    if (window['designElementProperty_' + selectedElement.nodeName.replace(/[-_]*/gi, '')]) {
        window['designElementProperty_' + selectedElement.nodeName.replace(/[-_]*/gi, '')](selectedElement); // selectedElement
    }
}

function clearPropertyList() {
    document.getElementById('element-documentation-link').setAttribute('hidden', '');
    document.getElementById('element-property-title').textContent = '';
    document.getElementById('element-property-section').innerHTML = '';
    document.getElementById('global-property-section').innerHTML = '';
    document.getElementById('property-panel-padding').setAttribute('disabled', '');
}


