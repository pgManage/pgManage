/**
 * @license
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

// minimal template polyfill
if (typeof HTMLTemplateElement === 'undefined') {
  (function() {

    var TEMPLATE_TAG = 'template';

    var contentDoc = document.implementation.createHTMLDocument('template');

    /**
      Provides a minimal shim for the <template> element.
    */
    HTMLTemplateElement = function() {};
    HTMLTemplateElement.prototype = Object.create(HTMLElement.prototype);

    /**
      The `decorate` method moves element children to the template's `content`.
      NOTE: there is no support for dynamically adding elements to templates.
    */
    HTMLTemplateElement.decorate = function(template) {
        if (!template.content) {
            template.content = template.ownerDocument.createDocumentFragment();
        }
        var child;
        while (child = template.firstChild) {
            template.content.appendChild(child);
        }
        
        if (!template.content.children) {
            Object.defineProperty(template.content, 'children', {
                get: function() {
                    'use strict';
                    var arrChildren = [], i, len, childNodes = this.childNodes;
                    
                    for (i = 0, len = childNodes.length; i < len; i += 1) {
                        if (childNodes[i].nodeType !== 3) {
                            arrChildren.push(childNodes[i]);
                        }
                    }
                    
                    return arrChildren;
                },
                configurable: true
            });
        }
        
        //HTMLTemplateElement.bootstrap(template.content);
        
        //console.log(template.content);
        
        // add innerHTML to template
        Object.defineProperty(template, 'innerHTML', {
            get: function() {
                var o = '', fragment = this.content.cloneNode(true);//,
                    //templates = xtag.toArray(fragment.querySelectorAll(TEMPLATE_TAG)), i, l;
                
                //for (i = 0, l = templates.length; i < l; i += 1) {
                //    templates[i].outerHTML = templates[i].outerHTML;
                //    console.log(templates[i].outerHTML);
                //}
                
                for (var e = fragment.firstChild; e; e = e.nextSibling) {
                    o += e.outerHTML || escapeData(e.data);
                }
                
                //console.log(o);
                
                return o;
            },
            set: function(text) {
                contentDoc.body.innerHTML = text;
                
                while (this.content.firstChild) {
                    this.content.removeChild(this.content.firstChild);
                }
                while (contentDoc.body.firstChild) {
                    this.content.appendChild(contentDoc.body.firstChild);
                }
                //HTMLTemplateElement.bootstrap(this.content);
            },
            configurable: true
            //writable: true
        });
      
        // add outerHTML to template
        Object.defineProperty(template, 'outerHTML', {
            get: function () {
                var openTagText, arrAttr, i, len, innerHTML = this.innerHTML;
                
                arrAttr = this.attributes;
                
                for (i = 0, len = arrAttr.length, openTagText = '<template'; i < len; i += 1) { // >
                    openTagText += ' ' + arrAttr[i].nodeName + '="' + encodeHTML(arrAttr[i].value) + '"';
                }
                
                return openTagText + '>' + innerHTML + '</template>';
            },
            configurable: true
            //writable: true
        });
    };

    /**
      The `bootstrap` method is called automatically and "fixes" all
      <template> elements in the document referenced by the `doc` argument.
    */
    HTMLTemplateElement.bootstrap = function(doc) {
        var templates = doc.querySelectorAll(TEMPLATE_TAG), i, l, t;
        
        for (i = 0, l = templates.length, t; (i < l) && (t = templates[i]); i += 1) {
            if (!GS.findParentTag(t, 'template') && GS.findParentTag(t, 'html')) {
                HTMLTemplateElement.decorate(t);
            }
        }
    };

    // auto-bootstrapping for main document
    window.addEventListener('DOMContentLoaded', function() {
      HTMLTemplateElement.bootstrap(document);
    });

    // Patch document.createElement to ensure newly created templates have content
    var createElement = document.createElement;
    document.createElement = function() {
      'use strict';
      var el = createElement.apply(document, arguments);
      if (el.localName == 'template') {
        HTMLTemplateElement.decorate(el);
      }
      return el;
    };

    var escapeDataRegExp = /[&\u00A0<>]/g;

    function escapeReplace(c) {
      switch (c) {
        case '&':
          return '&amp;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '\u00A0':
          return '&nbsp;';
      }
    }

    function escapeData(s) {
      return s.replace(escapeDataRegExp, escapeReplace);
    }
  })();
}