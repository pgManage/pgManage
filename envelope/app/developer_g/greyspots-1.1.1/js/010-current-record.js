window.addEventListener('design-register-element', function () {
    registerDesignSnippet('<gs-current-record>', '<gs-current-record>', 'gs-current-record for="${1:for}"></gs-current-record>');
    window.designElementProperty_GSCURRENT_RECORD = function (selectedElement) {
        addProp('For', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('for') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'for', this.value);
        });

        addProp('Inline', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('inline') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'inline', this.value === 'true', true);
        });
    };
});

//global xtag
//jslint browser:true
document.addEventListener("DOMContentLoaded", function () {
    "use strict";
    function buildElement(element) {
        
        element.forTable = document.getElementById(element.getAttribute('for'));

        element.forTable.addEventListener('selection_change', function () {
            element.refresh(element);
        });
        element.forTable.addEventListener('after_select', function () {
            element.refresh(element);
        });
        element.forTable.addEventListener('after_selection', function () {
            element.refresh(element);
        });

        element.firstChild.addEventListener('change', function (event) {
            var tableElem = element.forTable;
            var strValue = event.target.value;
            var intValue = parseInt(strValue.substring(0, strValue.indexOf(' ')), 10);
            var intMaxRecord = tableElem.internalData.records.length;
    
            var intMinColumn = (
                tableElem.internalDisplay.recordSelectorVisible
                    ? -1
                    : 0
            );
    
            // if we couldn't extract a record number from the
            //      user's value, go to the first record
            if (isNaN(intValue)) {
                intValue = 1;
            }
    
            if (intMaxRecord === 0) {
                intValue = undefined;
            }
    
            // prevent intValue from being greater than the number
            //      of records
            if (intValue > intMaxRecord) {
                intValue = intMaxRecord;
            }
    
            // intValue is from a user and therefore one-based
            if (!isNaN(intValue)) {
                // correct one-based by subtracting one
                intValue -= 1;
            }
            
            // override all current ranges to select the new record
            if (intValue !== undefined) {
                tableElem.internalSelection.ranges = [
                    {
                        "start": {
                            "row": intValue,
                            "column": intMinColumn
                        },
                        "end": {
                            "row": intValue,
                            "column": intMinColumn
                        },
                        "negator": false
                    }
                ];
            } else {
                tableElem.internalSelection.ranges = [];
            }

            // render selection and scroll into view
            tableElem.goToLine(intValue + 1);
            event.target.parentNode.refresh(event.target.parentNode);
        });
    }

    function elementInserted(element) {
        if (element.children.length === 0) {
            var gsText = document.createElement("gs-text");
            element.appendChild(gsText);
        }
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute("suspend-created") && !element.hasAttribute("suspend-inserted")) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;

                if (!element.children[0].classList.contains('root')) {
                    buildElement(element);
                }
            }
        }
    }

    xtag.register("gs-current-record", {
        lifecycle: {
            inserted: function () {
                elementInserted(this);
            },
            attributeChanged: function (strAttrName, oldValue, newValue) {
                var element = this;

                // if "suspend-created" has been removed: run created and inserted code
                if (strAttrName === "suspend-created" && newValue === null) {
                    elementInserted(element);

                // if "suspend-inserted" has been removed: run inserted code
                } else if (strAttrName === "suspend-inserted" && newValue === null) {
                    elementInserted(element);
                }
            }
        },
        events: {},
        accessors: {},
        methods: {
            'refresh': function (element) {
                element.bolRefreshing = true;
                var tableElem = element.forTable;
                var intOriginRecord = (
                    tableElem.internalSelection.originRecord
                );
                // we need the element that contains the selection status
                var statusElement = element.firstChild;
                // if the element that is supposed to contain the status is
                //      in the DOM
                if (statusElement) {
                    // if we know the origin record
                    if (intOriginRecord !== undefined) {
                        statusElement.value = (
                            // origin record number is zero-based
                            (intOriginRecord + 1) +
                            ' of ' +
                            tableElem.internalData.records.length
                        );
                    // else, we don't know the origin record
                    } else {
                        statusElement.value = (
                            'nothing selected'
                        );
                    }
                }
                element.bolRefreshing = false;
            }
        }
    });
});