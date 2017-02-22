
window.addEventListener('design-register-element', function () {
    'use strict';
    registerDesignSnippet('<gs-panel>', '<gs-panel>', 'gs-panel id="panel">\n' +
                                                      '    <gs-page id="${1:left-bar}" style="width: 17em;">\n' +
                                                      '        \n' +
                                                      '    </gs-page>\n' +
                                                      '    <gs-page>\n' +
                                                      '        \n' +
                                                      '    </gs-page>\n' +
                                                      '</gs-panel>');
    
    designRegisterElement('gs-panel', '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-panel.html');
    
    window.designElementProperty_GSPANEL = function(selectedElement) {
        // no-shadow-dismiss attribute
        addProp('Dismissible By Clicking The Shadow', true, '<gs-checkbox class="target" value="' + (!selectedElement.hasAttribute('no-shadow-dismiss')) + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'no-shadow-dismiss', this.value === 'true', false);
        });
        
        // dismissible attribute
        addProp('Dismissible On Desktop', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('dismissible') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'dismissible', this.value === 'true', true);
        });
        
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
    
    function pushReplacePopHandler(element) {
        var query = GS.getQueryString(), arrQueryKeys = GS.qryGetKeys(query),
            strID = element.getAttribute('id'), strAttributeName, i, len, strNewValue;
        
        for (i = 0, len = arrQueryKeys.length; i < len; i += 1) {
            if (arrQueryKeys[i].indexOf(strID + '.') === 0 &&
                element.panelIDs.indexOf(arrQueryKeys[i].split('.')[1]) > -1) {
                
                strAttributeName = arrQueryKeys[i].split('.')[1];
                strNewValue = GS.qryGetVal(query, arrQueryKeys[i]);
                
                if (element.getAttribute(strAttributeName) !== strNewValue) {
                    element.setAttribute(strAttributeName, strNewValue);
                }
            }
        }
        
        for (i = 0, len = element.arrQueryStringAttributes.length; i < len; i += 1) {
            if (arrQueryKeys.indexOf(element.arrQueryStringAttributes[i]) === -1) {
                element.removeAttribute(element.arrQueryStringAttributes[i].split('.')[1]);
            }
        }
    }
    
    // dont do anything that modifies the element here
    function elementCreated(element) {
        // if "created" hasn't been suspended: run created code
        if (!element.hasAttribute('suspend-created')) {
            
        }
    }
    
    //
    function elementInserted(element) {
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                
                var arrElement, i, len, blockerElement, blockerClickHandler;
                
                element.arrQueryStringAttributes = [];
                element.panelIDs = [];
                
                blockerClickHandler = function (event) {
                    var target = event.target;
                    
                    if (target.classList.contains('gs-panel-page-blocker')) {
                        element.hide(target.getAttribute('blocking'));
                    }
                };
                
                arrElement = xtag.queryChildren(element, '*');
                
                for (i = 0, len = arrElement.length; i < len; i += 1) {
                    if (arrElement[i].style.width === '') {
                        arrElement[i].setAttribute('flex', '');
                    } else {
                        if (!arrElement[i].hasAttribute('id')) {
                            console.warn('gs-panel Warning: No ID attribute on side-page element:',
                                         GS.cloneElement(arrElement[i]),
                                         ', please set ID the attribute');
                            
                            arrElement[i].setAttribute('id', 'side-' + GS.GUID().substring(0, 8));
                        }
                        element.panelIDs.push(arrElement[i].getAttribute('id'));
                        
                        blockerElement = document.createElement('div');
                        blockerElement.classList.add('gs-panel-page-blocker');
                        blockerElement.setAttribute('gs-dynamic', '');
                        blockerElement.setAttribute('blocking', arrElement[i].getAttribute('id'));
                        blockerElement.setAttribute('id', arrElement[i].getAttribute('id') + '-blocker');
                        
                        element.insertBefore(blockerElement, arrElement[i]);
                        
                        arrElement[i].setAttribute('panel-set-width', '');
                        
                        if (arrElement[i].hasAttribute('hidden')) {
                            arrElement[i].removeAttribute('hidden');
                            element.hide(arrElement[i].getAttribute('id'));
                            
                        } else {
                            if (element.getAttribute(arrElement[i].getAttribute('id')) === 'hide') {
                                element.hide(arrElement[i].getAttribute('id'));
                            }
                        }
                        
                        if (!element.hasAttribute('no-shadow-dismiss')) {
                            blockerElement.addEventListener('click', blockerClickHandler);
                        }
                    }
                }
                
                window.addEventListener('pushstate',    function () { pushReplacePopHandler(element); });
                window.addEventListener('replacestate', function () { pushReplacePopHandler(element); });
                window.addEventListener('popstate',     function () { pushReplacePopHandler(element); });
                
                if (element.hasAttribute('id')) {
                    pushReplacePopHandler(element);
                }
            }
        }
    }
    
    xtag.register('gs-panel', {
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
                    if (document.getElementById(strAttrName) &&
                        document.getElementById(strAttrName).parentNode === this) {
                        if (newValue === 'hide' || newValue === 'show') {
                            this[newValue](strAttrName);
                        }
                        /*if (newValue === 'hide') {
                            this.hide(strAttrName);
                        } else if (newValue === 'show') {
                            this.show(strAttrName);
                        }*/
                    }
                }
            }
        },
        events: {},
        accessors: {},
        methods: {
            'show': function (strID) {
                var strQueryString = GS.getQueryString(), strElementID = this.getAttribute('id');
                //document.getElementById(strID).setAttribute('shown', '');
                //document.getElementById(strID).removeAttribute('hidden');
                //document.getElementById(strID + '-blocker').setAttribute('shown', '');
                //document.getElementById(strID + '-blocker').removeAttribute('hidden');
                
                //document.getElementById(strID).style.display = '';
                //document.getElementById(strID + '-blocker').style.display = '';
                
                //if (window.innerWidth <= 768 || this.hasAttribute('dismissible')) {
                
                if ((strElementID && GS.qryGetKeys(strQueryString).indexOf(strElementID + '.' + strID) > -1) &&
                    GS.qryGetVal(strQueryString, strElementID + '.' + strID) === 'hide') {
                    GS.pushQueryString(strElementID + '.' + strID + '=show');
                    
                } else if (this.getAttribute(strID) === 'show') {
                    //document.getElementById(strID).style.left = '';
                    //document.getElementById(strID).style.position = '';
                    //document.getElementById(strID + '-blocker').style.left = ''; // <-- works on a phone
                    document.getElementById(strID).removeAttribute('panel-hide');
                    document.getElementById(strID + '-blocker').removeAttribute('panel-hide');
                    
                    //this.hiddenIDs.splice(this.hiddenIDs.indexOf(strID), 1);
                    //
                    GS.triggerEvent(document.getElementById(strID), 'show');
                    GS.triggerEvent(window, 'resize'); //, {'triggered': true});
                } else {
                    this.setAttribute(strID, 'show');
                }
                //}
            },
            
            'hide': function (strID) {
                var strQueryString = GS.getQueryString(), strElementID = this.getAttribute('id');
                //document.getElementById(strID).setAttribute('hidden', '');
                //document.getElementById(strID).removeAttribute('shown');
                //document.getElementById(strID + '-blocker').setAttribute('hidden', '');
                //document.getElementById(strID + '-blocker').removeAttribute('shown');
                
                //document.getElementById(strID).style.display = 'none';
                //document.getElementById(strID + '-blocker').style.display = 'none';
                
                if ((strElementID && GS.qryGetKeys(strQueryString).indexOf(strElementID + '.' + strID) > -1) &&
                    GS.qryGetVal(strQueryString, strElementID + '.' + strID) === 'show') {
                    GS.pushQueryString(strElementID + '.' + strID + '=hide');
                    
                } else if (this.getAttribute(strID) === 'hide') {
                    document.getElementById(strID).setAttribute('panel-hide', '');
                    document.getElementById(strID + '-blocker').setAttribute('panel-hide', '');
                    
                    //if (window.innerWidth <= 768 || this.hasAttribute('dismissible')) {
                    //    document.getElementById(strID).style.left = '-100%';
                    //    document.getElementById(strID).style.position = 'absolute';
                    //    document.getElementById(strID + '-blocker').style.left = '-100%'; // <-- works on a phone
                    //    
                    //    this.hiddenIDs.push(strID);
                    //    
                    GS.triggerEvent(document.getElementById(strID), 'hide');
                    GS.triggerEvent(window, 'resize'); //, {'triggered': true});
                    //}
                } else {
                    this.setAttribute(strID, 'hide');
                }
            },
            
            'toggle': function (strID) {
                var element = document.getElementById(strID);
                
                if (element.hasAttribute('shown') || !element.hasAttribute('panel-hide')) {
                    this.hide(strID);
                } else {
                    this.show(strID);
                }
            }
        }
    });
});