//global window, document, GS, ml, encodeHTML, addFlexContainerProps, addFlexProps, addProp, registerDesignSnippet, designRegisterElement, setOrRemoveTextAttribute, setOrRemoveBooleanAttribute, xtag, doT

window.addEventListener('design-register-element', function () {
    'use strict';
    registerDesignSnippet('<gs-switch>', '<gs-switch>', 'gs-switch>\n' +
                                                        '    <template for="${1:none}"></template>\n' +
                                                        '    <template for="${2:detail}"></template>\n' +
                                                        '</gs-switch>');

    designRegisterElement('gs-switch', '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-switch.html');

    window.designElementProperty_GSSWITCH = function (selectedElement) {

        addProp('Template', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('value') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'template', this.value);
        });

        addProp('Refresh On Querystring Columns', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('refresh-on-querystring-values') || '') + '" mini></gs-text>', function () {
            this.removeAttribute('refresh-on-querystring-change');
            return setOrRemoveTextAttribute(selectedElement, 'refresh-on-querystring-values', this.value);
        });

        addProp('Refresh On Querystring Change', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('refresh-on-querystring-change')) + '" mini></gs-checkbox>', function () {
            this.removeAttribute('refresh-on-querystring-values');
            return setOrRemoveBooleanAttribute(selectedElement, 'refresh-on-querystring-change', this.value === 'true', true);
        });
        
        addProp('Column In Querystring', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('qs') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'qs', this.value, false);
        });

        addFlexContainerProps(selectedElement);
        addFlexProps(selectedElement);

        // SUSPEND-CREATED attribute
        addProp('suspend-created', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-created') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suspend-created', this.value === 'true', true);
        });

        // SUSPEND-INSERTED attribute
        addProp('suspend-inserted', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-inserted') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suspend-inserted', this.value === 'true', true);
        });
    };
});

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    function subsafeTemplate(strTemplate) {
        var templateElement = document.createElement('template');
        var strID;
        var arrTemplates;
        var i;
        var len;
        var jsnTemplates;
        var strRet;
        var arrTemplateNames;

        templateElement.innerHTML = strTemplate;

        // temporarily remove templates. recursively go through templates whose parents do not have the source attribute
        i = 0;
        arrTemplates = xtag.query(templateElement.content, 'template');

        jsnTemplates = {};
        arrTemplateNames = [];

        while (arrTemplates.length > 0 && i < 100) {
            //console.log(arrTemplates[0]);
            //console.log(arrTemplates[0].parentNode);
            //console.log(arrTemplates[0].parentNode.hasAttribute('src'));

            // if the current template has a source parent: remove temporarily
            if (
                arrTemplates[0].parentNode &&
                arrTemplates[0].parentNode.hasAttribute &&
                (
                    arrTemplates[0].parentNode.hasAttribute('src') ||
                    arrTemplates[0].parentNode.hasAttribute('source')
                )
            ) {
                strID = 'UNIqUE_PLaCEhOLDER-' + GS.GUID() + '-UNiQUE_PLaCEhOLdER';
                jsnTemplates[strID] = arrTemplates[0].outerHTML;
                arrTemplates[0].outerHTML = strID;
                arrTemplateNames.push(strID);

            // else: add to the arrTemplates array
            } else if (arrTemplates[0].content) {
                arrTemplates.push.apply(arrTemplates, xtag.query(arrTemplates[0].content, 'template'));
            }

            // remove the current template from the arrTemplates array
            arrTemplates.splice(0, 1);

            i += 1;
        }

        strRet = doT.template(
            '{{##def.snippet:\n' +
                    '    {{ var qs = GS.qryToJSON(GS.getQueryString()); }} {{# def.template }}\n' +
                    '#}}\n' +
                    '{{#def.snippet}}',
            null,
            {"template": templateElement.innerHTML}
        )();

        i = 0;
        len = arrTemplateNames.length;
        //for (strID in jsnTemplates) {
        while (i < len) {
            // DO NOT DELETE THE REPLACE, it allows single dollar signs to be inside dot notation
            strRet = strRet.replace(
                new RegExp(arrTemplateNames[i], 'g'),
                jsnTemplates[arrTemplateNames[i]].replace(/\$/g, '$$$$')
            );
            i += 1;
        }

        return strRet;
    }

    //function pushReplacePopHandler(element) { //, eventName
    //    var i;
    //    var len;
    //    var arrPopKeys = [];
    //    var bolRefresh = false;
    //    var strQS = GS.getQueryString();
    //    var currentValue;
    //    var strQSCol = element.getAttribute('qs');

    //    //console.log(eventName);

    //    if (element.hasAttribute('refresh-on-querystring-values') || element.hasAttribute('qs')) {
    //        if (element.hasAttribute('refresh-on-querystring-values')) {
    //            arrPopKeys = element.getAttribute('refresh-on-querystring-values').split(/\s*,\s*/gim);
    //        }
    //        if (strQSCol && GS.qryGetKeys(strQS).indexOf(strQSCol) > -1) {
    //            GS.listAdd(arrPopKeys, strQSCol);
    //        }

    //        //for (i = 0, len = arrPopKeys.length; i < len; i += 1) {
    //        i = 0;
    //        len = arrPopKeys.length;
    //        while (i < len) {
    //            currentValue = GS.qryGetVal(strQS, arrPopKeys[i]);

    //            if (element.popValues[arrPopKeys[i]] !== currentValue) {
    //                //console.log(arrPopKeys[i], element.popValues[arrPopKeys[i]], currentValue);
    //                bolRefresh = true;
    //            }

    //            element.popValues[arrPopKeys[i]] = currentValue;
    //            i += 1;
    //        }
    //    } else {
    //        bolRefresh = true;
    //    }

    //    if (bolRefresh) {
    //        element.refresh();
    //    }
    //}
    function saveDefaultAttributes(element) {
        var i;
        var len;
        var arrAttr;
        var jsnAttr;

        // we need a place to store the attributes
        element.internal.defaultAttributes = {};

        // loop through attributes and store them in the internal defaultAttributes object
        i = 0;
        len = element.attributes.length;
        arrAttr = element.attributes;
        while (i < len) {
            jsnAttr = element.attributes[i];

            element.internal.defaultAttributes[jsnAttr.nodeName] = (jsnAttr.nodeValue || '');

            i += 1;
        }
    }

    function pushReplacePopHandler(element) {
        var i;
        var len;
        var strQS = GS.getQueryString();
        var strQSCol = element.getAttribute('qs');
        var strQSValue;
        var strQSAttr;
        var arrQSParts;
        var arrAttrParts;
        var arrPopKeys;
        var currentValue;
        var bolRefresh = false;
        var strOperator;

        if (strQSCol && strQSCol.indexOf('=') !== -1) {
            arrAttrParts = strQSCol.split(',');
            i = 0;
            len = arrAttrParts.length;
            while (i < len) {
                strQSCol = arrAttrParts[i];

                if (strQSCol.indexOf('!=') !== -1) {
                    strOperator = '!=';
                    arrQSParts = strQSCol.split('!=');
                } else {
                    strOperator = '=';
                    arrQSParts = strQSCol.split('=');
                }

                strQSCol = arrQSParts[0];
                strQSAttr = arrQSParts[1] || arrQSParts[0];

                // if the key is not present or we've got the negator: go to the attribute's default or remove it
                if (strOperator === '!=') {
                    // if the key is not present: add the attribute
                    if (GS.qryGetKeys(strQS).indexOf(strQSCol) === -1) {
                        element.setAttribute(strQSAttr, '');
                    // else: remove the attribute
                    } else {
                        element.removeAttribute(strQSAttr);
                    }
                } else {
                    // if the key is not present: go to the attribute's default or remove it
                    if (GS.qryGetKeys(strQS).indexOf(strQSCol) === -1) {
                        if (element.internal.defaultAttributes[strQSAttr] !== undefined) {
                            element.setAttribute(strQSAttr, (element.internal.defaultAttributes[strQSAttr] || ''));
                        } else {
                            element.removeAttribute(strQSAttr);
                        }
                    // else: set attribute to exact text from QS
                    } else {
                        element.setAttribute(strQSAttr, (
                            GS.qryGetVal(strQS, strQSCol) ||
                            element.internal.defaultAttributes[strQSAttr] ||
                            ''
                        ));
                    }
                }
                i += 1;
            }
        }

        // handle "refresh-on-querystring-values" and "refresh-on-querystring-change" attributes
        if (element.internal.bolQSFirstRun === true) {
            if (element.hasAttribute('refresh-on-querystring-values') || element.hasAttribute('qs')) {
                if (element.getAttribute('refresh-on-querystring-values')) {
                    arrPopKeys = element.getAttribute('refresh-on-querystring-values').split(/\s*,\s*/gim);
                } else {
                    arrPopKeys = [];
                }

                if (strQSCol) {
                    GS.listAdd(arrPopKeys, strQSCol);
                }

                i = 0;
                len = arrPopKeys.length;
                //for (i = 0, len = arrPopKeys.length; i < len; i += 1) {
                while (i < len) {
                    currentValue = GS.qryGetVal(strQS, arrPopKeys[i]);

                    if (element.popValues[arrPopKeys[i]] !== currentValue) {
                        bolRefresh = true;
                    }

                    element.popValues[arrPopKeys[i]] = currentValue;
                    i += 1;
                }
                
            } else if (element.hasAttribute('refresh-on-querystring-change')) {
                bolRefresh = true;
            } else if (element.hasAttribute('template') || element.hasAttribute('value')) {
                bolRefresh = true;
            }

            if (bolRefresh) {
                element.refresh();
            }
        } else {
            if (element.hasAttribute('refresh-on-querystring-values')) {
                arrPopKeys = element.getAttribute('refresh-on-querystring-values').split(/\s*,\s*/gim);

                i = 0;
                len = arrPopKeys.length;
                //for (i = 0, len = arrPopKeys.length; i < len; i += 1) {
                while (i < len) {
                    element.popValues[arrPopKeys[i]] = GS.qryGetVal(strQS, arrPopKeys[i]);
                    i += 1;
                }
            }
        }

        element.internal.bolQSFirstRun = true;
    }

    // dont do anything that modifies the element here
    function elementCreated(element) {
        // if "created" hasn't been suspended: run created code
        if (!element.hasAttribute('suspend-created')) {

        }
    }

    function elementInserted(element) {
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                // transfer 'value' attribute to 'template'
                if (element.hasAttribute('value')) {
                    element.setAttribute('template', element.getAttribute('value'));
                    console.warn('gs-switch Warning: "value" attribute is deprecated. Please use the "template" attribute to replace the "value" attribute.', element);
                }
                
                element.inserted = true;
                element.internal = {};
                saveDefaultAttributes(element);

                // Get templates and define some variables
                var arrTemplate = xtag.queryChildren(element, 'template');
                var i;
                var len;
                var attr_i;
                var attr_len;
                var arrAttrNames;
                var arrAttrValues;
                var strAttrName;
                var root;
                var template;
                var arrPopKeys;
                var strQueryString;
                var strQSCol;

                element.attributesFromTemplate = [];
                element.templates = {};

                //for (i = 0, len = arrTemplate.length; i < len; i += 1) {
                i = 0;
                len = arrTemplate.length;
                while (i < len) {
                    if (i === 0) {
                        element.firstTemplate = arrTemplate[i].getAttribute('for') || arrTemplate[i].getAttribute('id');
                    }

                    arrAttrNames = [];
                    arrAttrValues = [];

                    attr_i = 0;
                    attr_len = arrTemplate[i].attributes.length;
                    //for (attr_i = 0, attr_len = arrTemplate[i].attributes.length; attr_i < attr_len; attr_i += 1) {
                    while (attr_i < attr_len) {
                        strAttrName = arrTemplate[i].attributes[attr_i].nodeName;

                        if (strAttrName !== 'for' && strAttrName !== 'id') {
                            arrAttrNames.push(strAttrName);
                            arrAttrValues.push(arrTemplate[i].attributes[attr_i].value);
                        }
                        attr_i += 1;
                    }

                    template = arrTemplate[i];
                    element.templates[template.getAttribute('for') || template.getAttribute('id')] = {
                        'content': template.innerHTML,
                        'arrAttrNames': arrAttrNames,
                        'arrAttrValues': arrAttrValues,
                        'templated': !(element.hasAttribute('static') || template.hasAttribute('static'))
                    };
                    if (!(element.hasAttribute('static') || template.hasAttribute('static')) && 
                        (
                            element.templates[template.getAttribute('for') || template.getAttribute('id')].content.indexOf('&gt;') > -1 ||
                            element.templates[template.getAttribute('for') || template.getAttribute('id')].content.indexOf('&lt;') > -1
                        )) {
                        console.warn('GS-SWITCH WARNING: &gt; or &lt; detected in "' + (template.getAttribute('for') || template.getAttribute('id')) + '" template, this can have undesired effects on doT.js. Please use gt(x,y), gte(x,y), lt(x,y), or lte(x,y) to silence this warning.');
                    }

                    i += 1;
                }

                // Clear out the templates from the DOM
                element.innerHTML = '';

                element.arrQueryStringAttributes = [];
                element.popValues = {};

                if (
                    (
                        element.hasAttribute('template') &&
                        element.getAttribute('template').indexOf('{{') > -1
                    ) ||
                    element.hasAttribute('qs') ||
                    element.hasAttribute('refresh-on-querystring-values') ||
                    element.hasAttribute('refresh-on-querystring-change')
                ) {
                    //arrPopKeys = [];
                    //strQueryString = GS.getQueryString();
                    //strQSCol = element.getAttribute('qs');

                    //if (element.hasAttribute('refresh-on-querystring-values')) {
                    //    arrPopKeys = element.getAttribute('refresh-on-querystring-values').split(/\s*,\s*/gim);
                    //}
                    //if (strQSCol && GS.qryGetKeys(strQueryString).indexOf(strQSCol) > -1) {
                    //    GS.listAdd(arrPopKeys, strQSCol);
                    //}

                    //i = 0;
                    //len = arrPopKeys.length;
                    ////for (i = 0, len = arrPopKeys.length; i < len; i += 1) {
                    //while (i < len) {
                    //    element.popValues[arrPopKeys[i]] = GS.qryGetVal(strQueryString, arrPopKeys[i]);
                    //    i += 1;
                    //}
                    pushReplacePopHandler(element);
                    window.addEventListener('pushstate', function () {
                        pushReplacePopHandler(element);
                    });
                    window.addEventListener('replacestate', function () {
                        pushReplacePopHandler(element);
                    });
                    window.addEventListener('popstate', function () {
                        pushReplacePopHandler(element);
                    });
                }

                element.refresh();
            }
        }
    }

    xtag.register('gs-switch', {
        lifecycle: {
            created: function () {
                elementCreated(this);
            },

            inserted: function () {
                elementInserted(this);
            },

            attributeChanged: function (strAttrName, oldValue, newValue) {
                var element = this;
                // if "suspend-created" has been removed: run created and inserted code
                if (strAttrName === 'suspend-created' && newValue === null) {
                    elementCreated(element);
                    elementInserted(element);

                // if "suspend-inserted" has been removed: run inserted code
                } else if (strAttrName === 'suspend-inserted' && newValue === null) {
                    elementInserted(element);

                } else if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
                    if (strAttrName === 'value') { // && oldValue !== newValue
                        //element.refresh();
                        element.setAttribute('template', newValue);
                        console.warn('gs-switch Warning: "value" attribute is deprecated. Please use the "template" attribute to replace the "value" attribute.', element);

                    } else if (strAttrName === 'template' && element.inserted === true) {
                        element.refresh();
                    }
                }
            }
        },
        events: {},
        accessors: {
            value: {
                get: function () {
                    var element = this;
                    console.warn('gs-switch Warning: \'.value\' accessor is deprecated. Please use the \'.template\' accessor to replace the \'.value\' accessor.', element);
                    return element.getAttribute('template');
                },
                set: function (newValue) {
                    var element = this;
                    console.warn('gs-switch Warning: \'.value\' accessor is deprecated. Please use the \'.template\' accessor to replace the \'.value\' accessor.', element);
                    element.setAttribute('template', newValue);
                }
            },
            template: {
                get: function () {
                    return this.getAttribute('template');
                },
                set: function (newValue) {
                    this.setAttribute('template', newValue);
                }
            }
        },
        methods: {
            refresh: function () {
                var element = this;
                var strQueryString = GS.getQueryString();
                var strQSAttribute = element.getAttribute('qs');
                var strValueAttribute = element.getAttribute('template') || element.getAttribute('value');
                var templateName;
                var i;
                var len;

                if (strQSAttribute && GS.qryGetVal(strQueryString, strQSAttribute)) {
                    templateName = GS.qryGetVal(strQueryString, strQSAttribute);
                } else if (strValueAttribute) {
                    templateName = GS.templateWithQuerystring(strValueAttribute);
                }

                templateName = templateName || element.firstTemplate;

                if (element.templates[templateName] && element.templates[templateName].content) {
                    // if there are values in element.attributesFromTemplate
                    if (element.attributesFromTemplate.length > 0) {
                        // loop through them
                        i = 0;
                        len = element.attributesFromTemplate.length;
                        //for (i = 0, len = element.attributesFromTemplate.length; i < len; i += 1) {
                        while (i < len) {
                            // if attribute was initallySet: set it back to initalvalue
                            if (element.attributesFromTemplate[i].initallySet) {
                                element.setAttribute(element.attributesFromTemplate[i].name, element.attributesFromTemplate[i].initalValue);

                            // else: remove it
                            } else {
                                element.removeAttribute(element.attributesFromTemplate[i].name);
                            }
                            i += 1;
                        }
                    }

                    // clear element.attributesFromTemplate
                    element.attributesFromTemplate = [];

                    // if there are values in element.templates[templateName].arrAttrNames
                    if (element.templates[templateName].arrAttrNames.length > 0) {
                        // loop through them
                        i = 0;
                        len = element.templates[templateName].arrAttrNames.length;
                        //for (i = 0, len = element.templates[templateName].arrAttrNames.length; i < len; i += 1) {
                        while (i < len) {
                            // add to element.attributesFromTemplate
                            element.attributesFromTemplate.push({
                                'name': element.templates[templateName].arrAttrNames[i],
                                'initallySet': element.hasAttribute(element.templates[templateName].arrAttrNames[i]),
                                'initalValue': element.getAttribute(element.templates[templateName].arrAttrNames[i])
                            });

                            // set attribute
                            element.setAttribute(element.templates[templateName].arrAttrNames[i], GS.templateWithQuerystring(this.templates[templateName].arrAttrValues[i]));
                            i += 1;
                        }
                    }

                    if (element.templates[templateName].templated) {
                        element.innerHTML = subsafeTemplate(element.templates[templateName].content);
                    } else {
                        element.innerHTML = element.templates[templateName].content;
                    }

                    // if template is not native: handle templates inside the switch
                    if (shimmed.HTMLTemplateElement) {
                        window.HTMLTemplateElement.bootstrap(element);
                    }
                    //console.trace('trace this');
                    GS.triggerEvent(element, 'templatechange', {'templateName': templateName});
                    GS.triggerEvent(element, 'template_change', {'templateName': templateName});
                } else {
                    element.innerHTML = '';
                }
            }
        }
    });
});