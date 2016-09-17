
window.addEventListener('design-register-element', function () {
    'use strict';
    
    //registerDesignSnippet('GS.qryFromJSON', 'GS.qryFromJSON', 'GS.qryFromJSON(${0:jsnObjectToConvert});');
});



GS.templateColumnToValue = function (templateHTML) {
    'use strict';
    var templateElementEncoded = document.createElement('template'),
        templateElementNonEncoded = document.createElement('template'),
        arrTemplateElementEncoded, arrTemplateElementNonEncoded,
        jsnTemplates = {}, arrColumnElement = [], templateHTMLEncoded, bolInCommand, i, len, strID;
    
    // get template element encoded with all "&"s (that are not inside a doT command) encoded,
    //      so that html encoded characters are not lost in the next operations
    
    for (i = 0, len = templateHTML.length, templateHTMLEncoded = '', bolInCommand = false; i < len; i += 1) {
        if (!bolInCommand && templateHTML[i] === '{' && templateHTML[i + 1] === '{') {
            bolInCommand = true;
            i += 1;
            templateHTMLEncoded += '{{';
            
        } else if (bolInCommand && templateHTML[i] === '}' && templateHTML[i + 1] === '}') {
            bolInCommand = false;
            i += 1;
            templateHTMLEncoded += '}}';
            
        } else if (!bolInCommand && templateHTML[i] === '&') {
            templateHTMLEncoded += '&amp;';
            
        } else {
            templateHTMLEncoded += templateHTML[i];
        }
    }
    
    //console.log(templateHTML);
    //console.log(templateHTMLEncoded);
    templateElementEncoded.innerHTML = templateHTMLEncoded; //templateHTML.replace(/&/gi, '&amp;');
    
    // get template element non-encoded with everything in it, so that sub templates are not touched
    templateElementNonEncoded.innerHTML = templateHTML;
    
    // go through element encoded and replace templates with tokens
    // go through element non-encoded and gather templates and make sure they reference the same tokens
    arrTemplateElementEncoded = xtag.query(templateElementEncoded.content, 'template');
    arrTemplateElementNonEncoded = xtag.query(templateElementNonEncoded.content, 'template');
    i = 0;
    
    //console.log(arrTemplateElementEncoded);
    //console.log(arrTemplateElementNonEncoded);
    
    //console.log(arrTemplateElementEncoded.length);
    while (arrTemplateElementEncoded.length > 0 && i < 500) {
        //console.log(arrTemplateElementNonEncoded[0].parentNode);
        
        if (arrTemplateElementNonEncoded[0].parentNode &&
            arrTemplateElementNonEncoded[0].parentNode.hasAttribute &&
                (
                    arrTemplateElementNonEncoded[0].parentNode.hasAttribute('src') ||
                    arrTemplateElementNonEncoded[0].parentNode.hasAttribute('source')
                )) {
            strID = 'UnIqUE_PLaCEh0LDER-' + GS.GUID() + '-UniQUE_PLaCEh0LdER';
            jsnTemplates[strID] = arrTemplateElementNonEncoded[0].outerHTML;
            arrTemplateElementEncoded[0].outerHTML = strID;
        } else {
            // append any sub templates to the "arrTemplateElementEncoded" and "arrTemplateElementNonEncoded"
            //      variables
            arrTemplateElementEncoded = arrTemplateElementEncoded
                                            .concat(xtag.query(arrTemplateElementEncoded[0].content, 'template'));
            arrTemplateElementNonEncoded = arrTemplateElementNonEncoded
                                                .concat(xtag.query(arrTemplateElementNonEncoded[0].content, 'template'));
            
            // append any column elements in this template to the "arrColumnElement" variable
            arrColumnElement = arrColumnElement.concat(xtag.query(arrTemplateElementEncoded[0].content, '[column]'));
        }
        
        // remove the current template from the arrays
        arrTemplateElementEncoded.splice(0, 1);
        arrTemplateElementNonEncoded.splice(0, 1);
        
        i += 1;
    }
    
    // go through element encoded and add calculated "value" attribute to any element with a "column"
    //      attribute but no "value" attribute
    arrColumnElement = arrColumnElement.concat(xtag.query(templateElementEncoded.content, '[column]'));
    
    for (i = 0, len = arrColumnElement.length; i < len; i += 1) {
        if (!arrColumnElement[i].hasAttribute('value')) {
            arrColumnElement[i].setAttribute('value', '{{! row.' + arrColumnElement[i].getAttribute('column') + ' }}');
        }
    }
    
    //console.log(templateHTML);
    //console.log(arrColumnElement);
    //console.log(jsnTemplates);
    //console.log(templateElementEncoded.innerHTML);
    
    // save element encoded innerHTML as template HTML
    templateHTML = templateElementEncoded.innerHTML;
    
    // go through template HTML and replace template tokens with template HTML
    for (strID in jsnTemplates) {
        //                                      DO NOT DELETE, this allows single dollar signs to be inside dot notation
        //                                                                                                V
        templateHTML = templateHTML.replace(new RegExp(strID, 'g'), jsnTemplates[strID].replace(/\$/g, '$$$$'));
    }
    
    //console.log(element.templateHTML);
    
    return templateHTML;
};


GS.templateWithQuerystring = function (templateText) {
    'use strict';
    var strWrapperTemplate = '{{##def.snippet:\n' +
                             '    {{ var qs = jo; }} {{# def.template }}\n' +
                             '#}}\n' +
                             '{{#def.snippet}}';
    
    return doT.template(strWrapperTemplate, null, {'template': templateText})(GS.qryToJSON(GS.getQueryString())).trim();
};


GS.templateHideSubTemplates = function (templateHTML, bolRecord) {
    'use strict';
    var templateElement, strID, arrTemplates, i, len, jsnTemplates, strRet, strStart, strEnd;
    
    if (bolRecord) {
        strStart = '<table><tbody>';
        strEnd = '</tbody></table>';
        templateHTML = (strStart + templateHTML + strEnd);
    }
    
    templateElement = document.createElement('template');
    templateElement.innerHTML = templateHTML;
    
    // temporarily remove templates
    // recursively go through templates whose parents do not have the source attribute
    i = 0;
    arrTemplates = xtag.query(templateElement.content, 'template');
    jsnTemplates = {};
    
    //console.log(arrTemplates.length);
    
    while (arrTemplates.length > 0 && i < 100) {
        //console.log(arrTemplates[0], arrTemplates[0].parentNode);
        // if the current template has a source parent: remove temporarily
        if (arrTemplates[0].parentNode &&
            arrTemplates[0].parentNode.hasAttribute && (arrTemplates[0].parentNode.hasAttribute('src') ||
                                                        arrTemplates[0].parentNode.hasAttribute('source'))) {
            strID = 'UNIqUE_PLaCEhOLDER-' + GS.GUID() + '-UNiQUE_PLaCEhOLdER';
            jsnTemplates[strID] = arrTemplates[0].outerHTML;
            arrTemplates[0].outerHTML = strID;
            
        // else: add to the arrTemplates array
        } else if (arrTemplates[0].content) {
            arrTemplates.push.apply(arrTemplates, xtag.query(arrTemplates[0].content, 'template'));
        }
        
        // remove the current template from the arrTemplates array
        arrTemplates.splice(0, 1);
        
        i += 1;
    }
    
    strRet = decodeHTML(templateElement.innerHTML);
    
    if (bolRecord) {
        strRet = strRet.substring(strStart.length, strRet.length - strEnd.length);
    }
    
    return {'templateHTML': strRet, 'templateData': jsnTemplates}
};

GS.templateShowSubTemplates = function (strRet, jsnTemplate) {
    'use strict';
    var strID;
    
    for (strID in jsnTemplate.templateData) {
        //                                       DO NOT DELETE, this allows single dollar signs to be inside dot notation
        //                                                                  V
        strRet = strRet.replace(new RegExp(strID, 'g'), jsnTemplate.templateData[strID].replace(/\$/g, '$$$$'));
    }
    
    return strRet;
};

GS.templateWithEnvelopeData = function (templateHTML, data, i, len, rowNumberOffset) {
    'use strict';
    return doT.template(ml(function () {/*
        {{##def.snippet:
            {{ var row, row_number, i, len, col_i, col_len
                 , qs = GS.qryToJSON(GS.getQueryString())
                 , rowNumberOffset = (jo.rowNumberOffset || 0);
            
            if (!isNaN(jo.i)) {
                i = jo.i;
                len = (jo.len === undefined || jo.len === null ? jo.i + 1 : jo.len);
                
            } else {
                i = 0;
                len = jo.data.dat.length;
            }
            
            for (; i < len; i += 1) {
                row = {};
                row_number = (i + 1) + rowNumberOffset;
                row.row_number = row_number;
                
                for (col_i = 0, col_len = jo.data.arr_column.length; col_i < col_len; col_i += 1) {
                    if (jo.data.dat[i][col_i] === undefined || jo.data.dat[i][col_i] === null) {
                        row[jo.data.arr_column[col_i]] = '';
                    } else {
                        row[jo.data.arr_column[col_i]] = jo.data.dat[i][col_i];
                    }
                } }}{{# def.record }}
            {{ } }}
        #}}
        {{#def.snippet}}*/console.log;
    }), null, {"record":  templateHTML})({ 'data': data, 'i': i, 'len': len, 'rowNumberOffset': rowNumberOffset });
};




