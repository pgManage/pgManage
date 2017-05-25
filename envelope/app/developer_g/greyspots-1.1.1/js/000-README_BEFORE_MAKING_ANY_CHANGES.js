//jslint white:true
/**
    
    ######## BEFORE UPDATING DATA-HANDLING CODE OR USING THE COALESCE OPERATOR: ######## ~michael
    don't use the pipe-pipe "||" coalesce operator when handling data because if a zero comes to the coalesce (and it is a number 0 and not a string "0") it will be evaluated as false and thus coalesce to the next operand. Whenever you use this operator: be careful of what will be evaluated.
    
    To see this in action run this in your console:
    
    console.log( true      || 'test' );  // logs:  true  (expected)
    console.log( false     || 'test' );  // logs: 'test' (expected)

    console.log( null      || 'test' );  // logs: 'test' (expected)
    console.log( undefined || 'test' );  // logs: 'test' (expected)

    console.log( '1'       || 'test' );  // logs: '1'    (expected)
    console.log(  1        || 'test' );  // logs:  1     (expected)
    console.log( '0'       || 'test' );  // logs: '0'    (expected)
    console.log(  0        || 'test' );  // logs: 'test' (OH NO!!)
    
    here is another demonstration:
    
    console.log( Boolean(true)      );
    console.log( Boolean(false)     );
    console.log( Boolean(null)      );
    console.log( Boolean(undefined) );
    console.log( Boolean('1')       );
    console.log( Boolean( 1)        );
    console.log( Boolean('0')       );
    console.log( Boolean( 0)        ); // zero evaluates to false
    
    
    ######## BEFORE UPDATING FASTCLICK: ######## ~michael
    fastclick (around line 254) has some code added (by michael) to add a feature to fastclick, bring this code to any new version
    
    it also has (around line 123) some code added to an if statement added by joseph:
        if (deviceIsAndroid || deviceIsIOS) {
    as opposed to:
        if (deviceIsAndroid) {
    
    
    ######## BEFORE UPDATING X-TAGS: ######## ~michael and nunzio
    nunzio: the below warning now seems to be outdated
    nunzio: you have to delete '"function"==typeof define&&define.amd?define(X):"undefined"!=typeof module&&module.exports?module.exports=X:' from xtags for electron
    make sure you include the polyfills and make sure that there isn't still a duplicated block of code in the source, if there is remove it, here is how to find out:
    
    do a find in textedit for: "scope.upgradeDocumentTree = nop;" (excluding the quotes of course)
    AND var IMPORT_LINK_TYPE = scope.IMPORT_LINK_TYPE
    
    remove the whole block of code surrounding the second match (it might be the first match but I think it is the second match)
    
    
    ######## ELEMENT REGISTRATION: ######## ~michael
    When registering a custom element:
        1) register it after the "DOMContentLoaded" event has fired. Doing this prevents an issue that we ran into where in some cases (I believe when greyspots.js is cached and you are on yosemite is one case) some elements would be cut off and would disappear.
        2) Use the "methods" for public functions only, private functions should be kept in the "DOMContentLoaded" function. By keeping the functions in there it makes it so that the code for that element is the only code that can run those functions and it prevents these functions for cluttering public namespaces.
        3) Use "'use strict';" from the beginning. If you don't start out with it you might introduce strict mode errors that you don't even know about. Then one day you might decide to put "'use strict';" in there and errors you didn't know about will appear. Some errors might appear when you first move it over and some errors might be disvovered by your users because you didn't test every little feature of the element.
    
    An example:
    
    document.addEventListener('DOMContentLoaded', function () {
        'use strict';
        
        // ### private functions go here ###
        function foobar() {
            // do stuff to "element" here (gs-new-element is the only element that can run this function)
        }
        
        xtag.register('gs-new-element', {
            lifecycle: {
                'created': function () {
                    
                }
            },
            events: {},
            accessors: {},
            methods: {
                // ### public functions go here ###
            }
        });
    });
    
    ######## PSEUDO ELEMENT WARNING: ######## ~michael
    In firefox I ran into an issue where the undo history of controls in a gs-form (with the attribute "save-while-typing") was being erased. Turns out the issue was caused by a CSS pseudo-element. I was using a pseudo-element for a little box attached to the form to tell the user if the form was waiting to save or saving. By changing the pseudo-element to a real element that I add and remove with Javascript the issue was fixed.
    
    If you want to use a pseudo-element: make sure it doesn't affect the undo history of elements that are children of the element that the pseudo-element is attached to. This issue could have been fixed by now.
    
    
    
    ######## TEMPLATE SHIM: ######## ~michael
    The template polyfill has been changed, DO NOT UPDATE. It is for old browsers, and old browsers don't change so there is should be no need for the polyfill to change.
    
*/