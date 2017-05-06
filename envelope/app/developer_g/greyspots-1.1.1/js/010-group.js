window.addEventListener('design-register-element', function () {
    window.designElementProperty_GSGROUP = function (selectedElement) {
        // DISABLED attribute
        addProp('Padded', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('padded') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'padded', this.value === 'true', true);
        });
    };
});

//global xtag
//jslint browser:true
document.addEventListener("DOMContentLoaded", function () {
    "use strict";
    // fill gs-group based on current content
    function buildElement(element) {
        var rootBox = document.createElement("div");
        var innerBox = document.createElement("gs-groupborder");
        var titleBox = document.createElement("gs-grouptitle");

        // fill "innerBox" by transfering all of "element"'s child nodes to it (this includes text nodes)
        var arrElements = xtag.toArray(element.childNodes);
        var i = 0;
        var len = arrElements.length;

        while (i < len) {
            innerBox.appendChild(arrElements[i]);
            i += 1;
        }

        // fill "titleBox"
        titleBox.textContent = element.getAttribute("name");

        // give "rootBox" the class "root"
        rootBox.classList.add("root");

        // make "rootBox" flex it's content vertically, and make it fill horizontally
        rootBox.setAttribute("flex-vertical", "");
        rootBox.setAttribute("flex-fill", "");

        // make "innerBox" flex to fill height
        innerBox.setAttribute("flex", "");

        // mark "titleBox" and "innerBox" as dynamic elements
        //      because we want developers to know that these
        //      are generated
        innerBox.setAttribute("gs-dynamic", "");
        titleBox.setAttribute("gs-dynamic", "");

        // append "titleBox" and "innerBox" to "rootBox"
        rootBox.appendChild(innerBox);
        rootBox.appendChild(titleBox);

        // append "rootBox" to "element"
        element.appendChild(rootBox);
    }

    function elementInserted(element) {
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

    xtag.register("gs-groupborder", {});
    xtag.register("gs-grouptitle", {});
    xtag.register("gs-group", {
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
                // else if (!element.hasAttribute("suspend-created") && !element.hasAttribute("suspend-inserted")) {
                //    // attribute code
                //}
            }
        },
        events: {},
        accessors: {},
        methods: {}
    });
});