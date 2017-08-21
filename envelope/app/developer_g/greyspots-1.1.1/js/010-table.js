//global GS, xtag, document, window, ml, evt, doT, Worker
//jslint browser:true, maxlen:80, white:false, this:true


/*
new datasheet
    select, insert, update,
        delete, copy, paste and selection events (prevent default)
    programatic select, insert, update,
        delete, copy, paste and selection (events marked as programatic)

    fixed headers/record selectors
    ace scrolling
    insert record

    data source is not required (column list is required if no data source)

    header, record, insert record templating (dot.js)

    placeholder for null values
    value to set value as null

    headers, record selectors, insert record are all optional

    copy settings (
        headers always|never|whenselected
        record selectors always|never|whenselected
        quote char
        quote when never|strings|always
        record delim char
        cell delim char
        null value string
    )
    no more table element

    selection is stored as ranges
    backwards compatible attributes (transfer to new names and warn)


element name:
    <gs-table></gs-table>

helper elements:
    <gs-cell></gs-cell>

attributes:
    pk
    lock
    seq
    cols (required if no src)
    src
    where
    session-filter (where clause that can be overridden by the user)
    ord
    limit
    offset
    column
    child-column
    qs
    refresh-on-querystring-values
    refresh-on-querystring-change

    reflow-at (future)
    scroll-past-bottom
        (allows you to scroll until only the bottom record is seen)
    scroll-to-bottom (scrolls all the way down on initial load)
    expand-to-content

    no-hudpaginate
    no-hudrefresh
    no-huddelete
    no-filter

    suspend-created
    suspend-inserted

    no-header
    no-record-selector
    no-selection

    null-string (defaults to "")
    null-set-string (defaults to null-string attribute)

    no-resize-column
    no-resize-record

    default-record-height (pixels, defaults if not present)
    default-column-width (pixels, defaults if not present)
    column-border-width (pixels, defaults if not present)
    record-border-height (pixels, defaults if not present)

    socket (name of a property stored on the GS object, needs to be a socket)

    copy-header           always|never|selected
    copy-selectors        always|never|selected
    copy-quote-char       text
    copy-escape-char      text
    copy-quote-when       never|strings|always|delimiter-in-content
    copy-delimiter-record text
    copy-delimiter-cell   text
    copy-null-cell        text

templates: (all are dot.js templated before use)
    for="hud" (snippet contains default
                    insert/update/delete/refresh/filter/paginate elements)
    for="header-record"
        <gs-cell>HEADERTEXT</gs-cell>
    for="data-record"
        <gs-cell header="HEADERTEXT">
            <gs-text mini column="COLUMNNAME"></gs-text>
        </gs-cell>
    for="insert-record"
        <gs-cell header="HEADERTEXT" target="COLUMNNAME"></gs-cell>
    for="insert-dialog"

accessors:
    selection (contains JS array of selection ranges)
    data (contains TSV of all data)
    value (value attribute)

events:
    before_select (contains TSV of selection under "records" key)
    before_insert (contains TSV of insert under "records" key)
    before_update (contains TSV of old/new under "records" key ("old", "new"))
    before_delete (contains TSV of delete under "records" key)
    before_selection (contains TSV of selection ranges under "selection" key)

    after_select (contains TSV of selection under "records" key)
    after_insert (contains TSV of insert under "records" key)
    after_update (contains TSV of old/new under "records" key ("old", "new"))
    after_delete (contains TSV of delete under "records" key)
    after_selection (contains TSV of selection ranges under "selection" key)

    insert_dialog_open (event.relatedTarget = insert dialog)
    copy
    paste

methods:
    refresh
    render
    scrollToIndex(cell_number, record_number)
    clearSelection()
    addSelectionRange(
        fromCell_number,
        fromRecord_number,
        toCell_number,
        toRecord_number,
        bolNegate (default false)
    )
    getCopyString(
        strMimeType text|html
    )
    paste(paste_string)
    filter(
        filterColumn,
        filterType contains|starts|ends|equals|greaterthan|lessthan,
        showIfMatch true|false,
        filterValue
    )
    selectData
    insertData
    updateData
    deleteData

click behavior:
    if click results in focused input/textarea
            and start/end locations are in the same place:
        select all control contents
    if not no-filter and click results in focused control: filter popup tooltip

mousedown-drag:
    if shift:
        move latest selection range's endpoint
    if no shift:
        clear all selections
        start new selection
    if command/control:
        start new selection
        if selection started on an already selected cell:
            selection is a negator selection

selection behavior:
    if selection origin and end is on a record selector:
        select entire records
    if selection origin and end is on a header selector:
        select entire columns
    if selection origin starts and ends on the top-left selector:
        select all cells
    if selection endpoint is off-screen:
        scroll it to middle

focus behavior:
    cell/record focus location is saved
        (if cell is visible after a render, focus into it)
        (removed on blur)
    on selection with no focused control: focus hidden control
    on mousedown inside the element (on unfocusable element):
        focus hidden control
    on blur after cell change: cause update
    on focus of single cell: set selection to focused cell

copy behavior:
    never copy insert record
    on copy event and hidden focus control is focused:
        copy to html mime type (using applicable copy attributes)
        copy to text mime type (using applicable copy attributes)
    if a record is not selected: no space is made for it in the copy
    if a column is not selected: no space is made for it in the copy

key behavior:
    arrowing around selects the cell, doesn't focus the control
    return on selection focuses selection origin cell control
    "delete"/"forward delete" when no control is focused causes record delete
    on return after cell change: cause update

    if arrow:
        if shift:
            "selection" means selection end of latest selection range
        if no shift:
            clear all selection ranges
            "selection" means selection origin/end of new selection range

        if all contents selected because of arrow
            or
        if cursor is at boundary in the direction of the arrow:
            if there is a cell in the direction of the arrow:
                move selection in direction of arrow
            else:
                if right at last cell of record: first cell of next record
                if right at last cell of table: first cell of table
                if left at first cell of record: last cell of previous record
                if left at first cell of table: last cell of table
                if up at first cell of column: previous column of bottom record
                if down at last cell of column: next column of first record

scrollbar behavior:
    whenever the record count is changed: the scrollbar is rerendered
    the scrollbar has a maximum range, stop growing around this height
    if scrollbar is past max height, you'll need to translate the top
        into (1px of scroll height will = >1px of motion)
    after scroll: rerender location
    phone scroll: no scrollbar, needs elastic motion
    scroll render:
        if scrollTop is >0     header shadow
        if scrollLeft is >0    record selector shadow
        if scrollBottom is >0  insert record shadow
        if scrollRight is >0   right side shadow

loader behavior:
    when enabled: a small spinner shows at the top-right of the data area

delete behavior:
    always asks if you're sure
    after success:
        remove record from internal data,
        render current location,
        clear selection range if it's now out of bounds
    during delete: enable element loader
    after delete is initiated: record is no longer clickable

insert behavior:
    asks if you're sure only when inserting multiple records (using paste)
    after success:
        append new data to the end of internal data,
        scroll to bottom,
        render current location,
        clear selection range
    during insert: enable element loader

update behavior:
    asks if you're sure only when updating multiple records (using paste)
    after success:
        update whole record in internal data,
        render current location,
        clear selection range
    during update: enable element loader
    if an update is caused while another update is still resolving: add to queue

select behavior:
    first load: if scroll-to-bottom: scroll to reveal bottom record
    reload: always returns to previous scroll/focus/textselection situation
    during load: enable element loader
*/







// # CODE INDEX:
//          (use "find" (CTRL-f or CMD-f) to skip to a section)
//          ("PRE-RENDER" refers to a section of functions that do not depend
//                  on the viewport being rendered AND dont use any render
//                  functions)
//          ("POST-RENDER" refers to a section of functions that either depend
//                  on the viewport being rendered OR use render functions)
//      # TOP  (this just brings you back this index)
//      # ELEMENT CONFIG
//      # GLOBAL <STYLE></STYLE> ELEMENT SETUP
//      # SCROLLBAR WIDTH
//      # CELL DIMENSION DETECTOR
//      # EXTERIOR LIBRARIES
//          # GETPLAINTEXT
//      # PRE-RENDER UTILITY FUNCTIONS
//      # ELEMENT FUNCTIONS
//      # RENDER FUNCTIONS
//      # POST-RENDER UTILITY FUNCTIONS
//      # LOADER FUNCTIONS
//      # DATA FUNCTIONS
//      # COPY FUNCTIONS
//      # PASTE FUNCTIONS
//      # BUTTON FUNCTIONS
//      # EVENT FUNCTIONS
//          # FOCUS EVENTS
//          # SCROLL EVENTS
//          # SELECTION EVENTS
//          # COLUMN/ROW RESIZE EVENTS
//          # COLUMN REORDER EVENTS
//          # UPDATE EVENTS
//          # INSERT EVENTS
//          # HUD EVENTS
//          # KEY EVENTS
//          # COPY EVENTS
//          # PASTE EVENTS
//          # CUT EVENTS
//          # CONTEXTMENU EVENTS
//          # COLUMN DROPDOWN EVENTS
//          # DEVELOPER EVENTS
//          # HIGH LEVEL BINDING
//      # XTAG DEFINITION
//      # ELEMENT LIFECYCLE
//      # ELEMENT ACCESSORS
//      # ELEMENT METHODS

// for sections of code that need to be completed:
//      # NEED CODING


document.addEventListener('DOMContentLoaded', function () {
    'use strict';
// ############################################################################
// ############################## ELEMENT CONFIG ##############################
// ############################################################################

    var intDefaultRecordHeight = 27; // pixels
    var intDefaultColumnWidth = 75; // pixels

// ############################################################################
// ############################ GLOBAL ID SEQUENCE ############################
// ############################################################################

    var globalIDSeq = 0;

// ############################################################################
// ################### GLOBAL <STYLE></STYLE> ELEMENT SETUP ###################
// ############################################################################

    // we need to dynamically generate some CSS because of browser/OS
    //      differences, so here we create the global style element. This
    //      element may only have CSS appended to it at this global level, not
    //      after gs-table elements are instantiated.
    var globalStyleElement = document.createElement("style");
    globalStyleElement.setAttribute("id", "gs-table-style-container");
    document.head.appendChild(globalStyleElement);

// #############################################################################
// ############################## SCROLLBAR WIDTH ##############################
// #############################################################################

    // we need to handle scrollbar width dynamically because different operating
    //      systems have different scrollbar widths, this section deals with the
    //      scrollbar width for all gs-table elements at the same time.

    // return scrollbar width
    function getScrollBarWidth() {
        var container = document.createElement("div");
        var detector = document.createElement("div");
        var ret;

        document.body.appendChild(container);
        container.appendChild(detector);

        container.style.width = "100px";
        container.style.height = "100px";
        container.style.opacity = "0.2";
        container.style.overflow = "scroll";

        detector.style.display = "inline-block";
        detector.style.width = "10px";
        detector.style.height = "100%";
        //detector.style.background = "#F00";

        ret = 100 - detector.offsetHeight;
        document.body.removeChild(container);

        return ret;
    }

    // save scrollbar width to variable
    var intScrollbarWidth = getScrollBarWidth();

    // we need some CSS specifically to handle the scrollbar,
    //      this function returns that CSS
    function createGlobalScrollbarStyles() {
        var intScrollbarWidthPadded;

        // this variable creates 1px pixels of space in the green box in the
        //      bottom-right corner to make it look well sized and match up
        //      well with the borders around it.
        intScrollbarWidthPadded = (intScrollbarWidth + 1);

        // on an iPhone, scrollbars are hidden
        if (intScrollbarWidth === 0) {
            return 'gs-table > ' +
                    '        .table-root > ' +
                    '        .table-table-container > ' +
                    '        .table-data-container {\n' +
                    '    padding-bottom: 0px;\n' +
                    '    padding-right: 0px;\n' +
                    '}\n' +
                    // hide scrollbar containers
                    'gs-table > ' +
                    '        .table-root > ' +
                    '        .table-table-container > ' +
                    '        .table-v-scroll-bar-container {\n' +
                    '    width: 0px;\n' +
                    '    padding-bottom: 0px;\n' +
                    '    display: none;\n' +
                    '}\n' +
                    // hide scrollbar containers
                    'gs-table > ' +
                    '        .table-root > ' +
                    '        .table-table-container > ' +
                    '        .table-h-scroll-bar-container {\n' +
                    '    height: 0px;\n' +
                    '    padding-right: 0px;\n' +
                    '    display: none;\n' +
                    '}\n' +
                    // remove viewport border
                    'gs-table >\n' +
                    '        .table-root >\n' +
                    '        .table-table-container >\n' +
                    '        .table-data-container >\n' +
                    '        .table-data-viewport {\n' +
                    '    border-right: 0 none;\n' +
                    '    border-bottom: 0 none;\n' +
                    '}';
        }

        return 'gs-table > ' +
                '        .table-root > ' +
                '        .table-table-container > ' +
                '        .table-data-container {\n' +
                '    padding-bottom: ' + intScrollbarWidth + 'px;\n' +
                '    padding-right: ' + intScrollbarWidth + 'px;\n' +
                '}\n' +
                'gs-table > ' +
                '        .table-root > ' +
                '        .table-table-container > ' +
                '        .table-v-scroll-bar-container {\n' +
                '    width: ' + intScrollbarWidth + 'px;\n' +
                '    padding-bottom: ' + intScrollbarWidthPadded + 'px;\n' +
                '}\n' +
                'gs-table > ' +
                '        .table-root > ' +
                '        .table-table-container > ' +
                '        .table-h-scroll-bar-container {\n' +
                '    height: ' + intScrollbarWidth + 'px;\n' +
                '    padding-right: ' + intScrollbarWidthPadded + 'px;\n' +
                '}';
    }

    // append scrollbar-specific CSS to global style element
    globalStyleElement.innerHTML += createGlobalScrollbarStyles();

// #############################################################################
// ########################## CELL DIMENSION DETECTOR ##########################
// #############################################################################

    // we need to be able to detect the cell/border widths/heights dynamically
    //      so that the scrolling functionality can calculate true dimensions
    //      and so that records/columns (which may be dynamically resized) will
    //      have defaults
    function cellDimensionDetector(element) {
        var testDataCell = element.elems.testDataCell;
        var testHeader = element.elems.testHeader;
        var testInsert = element.elems.testInsert;
        var testRecordSelector = element.elems.testRecordSelector;

        // first, we'll look at data record/cell dimensions
        element.internalDisplay.columnBorderWidth = parseInt(
            (GS.getStyle(testDataCell, 'border-right-width') || '0'),
            10
        );
        element.internalDisplay.recordBorderHeight = parseInt(
            (GS.getStyle(testDataCell, 'border-bottom-width') || '0'),
            10
        );
        element.internalDisplay.defaultColumnWidth = parseInt(
            (GS.getStyle(testDataCell, 'width') || '0'),
            10
        );
        element.internalDisplay.defaultRecordHeight = parseInt(
            (GS.getStyle(testDataCell, 'height') || '0'),
            10
        );

        // next, we'll look at header dimensions
        element.internalDisplay.headerBorderHeight = parseInt(
            (GS.getStyle(testHeader, 'border-bottom-width') || '0'),
            10
        );

        // next, we'll look at insert cell dimensions
        element.internalDisplay.insertRecordBorderHeight = parseInt(
            (GS.getStyle(testInsert, 'border-bottom-width') || '0'),
            10
        );

        // next, we'll look at record selector cell dimensions
        element.internalDisplay.recordSelectorBorderWidth = parseInt(
            (GS.getStyle(testRecordSelector, 'border-right-width') || '0'),
            10
        );
    }

    // we need to know if headers, record selectors or the insert record is
    //      being used. this is so that we can determine the amount of space
    //      to put on each side of the viewport for the data
    function visibilityDetector(element) {
        // we reset everything to visible here so that the code is shorter
        // (innocent until proven guilty)
        element.internalDisplay.headerVisible = true;
        element.internalDisplay.recordSelectorVisible = true;
        element.internalDisplay.insertRecordVisible = true;

        // we are checking to see if the header template is empty or just all
        //      whitespace, if it is: we're setting headers to visibility=false
        if (
            !element.internalTemplates.header ||
            !element.internalTemplates.header.trim()
        ) {
            element.internalDisplay.headerVisible = false;
        }

        // we are checking to see if the "no-record-selector" attribute is
        //      present, if it is: we're setting the record selectors to
        //      visibility=false
        if (element.hasAttribute('no-record-selector')) {
            element.internalDisplay.recordSelectorVisible = false;
        }

        // we are checking to see if the insert record template is empty or
        //      just all whitespace, if it is: we're setting the insert record
        //      to visibility=false
        if (
            !element.internalTemplates.insertRecord ||
            !element.internalTemplates.insertRecord.trim()
        ) {
            element.internalDisplay.insertRecordVisible = false;
        }
    }

    // we need to calculate the amount of space to put on each side of the
    //      viewport depending on what features are visible (header, record
    //      selectors, insert record). so, if the insert record is visible
    //      we need to tell everything else that that space is not usable for
    //      anything else
    function offsetDetector(element) {
        // we reset all of the offsets to zero because the way we calculate
        //      the offsets is that we increment the offset if something is
        //      visible (increment/decrement only, no resets after this point)
        element.internalScrollOffsets.top = 0;
        element.internalScrollOffsets.left = 0;
        element.internalScrollOffsets.bottom = 0;
        element.internalScrollOffsets.right = 0;

        // if the header is visible, we want to add the height of the header
        //      (plus it's border) to the top offset
        if (
            element.internalDisplay.headerVisible &&
            element.internalDisplay.headerStick === 'top'
        ) {
            element.internalScrollOffsets.top += (
                element.internalDisplay.headerHeight +
                element.internalDisplay.headerBorderHeight
            );
        }

        // if the record selectors are visible, we want to add the width of
        //      the record selectors (plus the border) to the left offset
        if (
            element.internalDisplay.recordSelectorVisible &&
            element.internalDisplay.selectorStick === 'left'
        ) {
            element.internalScrollOffsets.left += (
                element.internalDisplay.recordSelectorWidth +
                element.internalDisplay.recordSelectorBorderWidth
            );
        }

        // if the insert record is visible, we want to add the height of the
        //      record (plus it's border) to the bottom offset
        if (
            element.internalDisplay.insertRecordVisible &&
            element.internalDisplay.insertRecordStick === 'bottom'
        ) {
            element.internalScrollOffsets.bottom += (
                element.internalDisplay.insertRecordHeight +
                element.internalDisplay.insertRecordBorderHeight
            );
        }
    }

// #############################################################################
// ############################ EXTERIOR LIBRARIES #############################
// #############################################################################

// ############ GETPLAINTEXT #############

    // original name:     getPlainText()
    // original author:   Mike Wilcox
    // original site:     http://clubajax.org
    // original support:  http://groups.google.com/group/clubajax
    //
    //    DESCRIPTION:
    //        Returns a line-break, properly spaced, normalized plain text
    //        representation of multiple child nodes which can't be done via
    //        textContent or innerText because those two methods are vastly
    //        different, and even innerText works differently across browsers.

    /*
    ORIGINAL LICENSE FOR getPlainText():

    This is free and unencumbered software released into the public domain.

    Anyone is free to copy, modify, publish, use, compile, sell, or
    distribute this software, either in source code form or as a compiled
    binary, for any purpose, commercial or non-commercial, and by any
    means.

    In jurisdictions that recognize copyright laws, the author or authors
    of this software dedicate any and all copyright interest in the
    software to the public domain. We make this dedication for the benefit
    of the public at large and to the detriment of our heirs and
    successors. We intend this dedication to be an overt act of
    relinquishment in perpetuity of all present and future rights to this
    software under copyright law.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
    IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
    OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
    ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    OTHER DEALINGS IN THE SOFTWARE.
    */

    // This software has been modified from it's original form and thus,
    //      because the original authors of the software relinquished control
    //      to the individual user of the software, we (Workflow Products)
    //      hereby license this modified version of getPlainText() under the
    //      same license as the javascript you find getPlainText() included in.

    function getPlainText(node, bolConsumable) {
        var plainText = "";

        // used for testing/comparison:
        //return node.innerText || node.textContent;

        // clean up double line breaks and spaces
        function normalize(a) {
            if (!a) {
                return "";
            }
            return a.replace(/\ +/g, " ")
                .replace(/[\t]+/gm, "")
                .replace(/[\ ]+$/gm, "")
                .replace(/^[\ ]+/gm, "")
                .replace(/\n+/g, "\n")
                .replace(/\n+$/, "")
                .replace(/^\n+/, "")
                .replace(/\nNEWLINE\n/g, "\n\n")
                .replace(/NEWLINE\n/g, "\n\n"); // IE
        }

        // because we format the text ourselves, we want to get rid of empty
        //      text nodes, they'll just get in the way
        function removeWhiteSpace(node) {
            var ws_i;
            var ws_len;
            var ws_node;
            var ws = [];

            // recursively find whitespace nodes and push them to "ws" array
            function findWhite(node) {
                var i = 0;
                var len = node.childNodes.length;
                var n;

                while (i < len) {
                    n = node.childNodes[i];
                    if (
                        // if node is a text node
                        n.nodeType === 3 &&
                        // if node contains only whitespace
                        !(/[^\t\n\r\ ]/).test(n.nodeValue)
                    ) {
                        // add node to whitespace node list
                        ws.push(n);

                    // else if node contains other nodes:
                    } else if (n.hasChildNodes()) {
                        // search node for more whitespace child nodes
                        findWhite(n);
                    }
                    i += 1;
                }
            }

            // start recursive search
            findWhite(node);

            // remove nodes that are in the "ws" array
            ws_i = 0;
            ws_len = ws.length;
            while (ws_i < ws_len) {
                ws_node = ws[ws_i];
                ws_node.parentNode.removeChild(ws_node);

                ws_i += 1;
            }
        }

        // we want to get the value of the CSS "white-space" and "display"
        //      properties (because they affect how we build the text), so this
        //      function will return CSS properties for a node
        // also, some elements have implied CSS settings (like SCRIPT is
        //      "display: none;") so, this function handles tag-specific
        //      settings
        function sty(n, prop) {
            var s;
            var bolAssumeBlock;

            // if the .style property is available, just use that
            if (n.style[prop]) {
                return n.style[prop];
            }

            // coalesce through a couple different ways of retrieving CSS values
            s = (
                n.currentStyle ||
                window.getComputedStyle(n, null)
                // ^ used to be n.ownerDocument.defaultView
            );

            if (n.tagName === "SCRIPT") {
                return "none";
            }
            if (!s[prop]) {
                bolAssumeBlock = "LI,P,TR".indexOf(n.tagName);

                // if element is an element we assume block for, return block
                if (bolAssumeBlock) {
                    return "block";
                }
                // else return actual style setting
                return n.style[prop];
            }
            if (s[prop] === "block" && n.tagName === "TD") {
                return "feaux-inline";
            }
            return s[prop];
        }

        var blockTypeNodes = "table-row,block,list-item";
        function isBlock(n) {
            // display:block or something else
            var s = sty(n, "display") || "feaux-inline";
            if (blockTypeNodes.indexOf(s) > -1) {
                return true;
            }
            return false;
        }

        // loop recursively through the nodes and build up the text string
        function recurse(n) {
            var strCSSWhite = sty(n, "whiteSpace");
            var strCSSDisplay = sty(n, "display");
            var gap;
            var i;
            var len;
            var c;

            // Loop through all the child nodes
            // and collect the text, noting whether
            // spaces or line breaks are needed.
            if (strCSSWhite.indexOf('pre') !== -1) {
                plainText += n.innerHTML
                    .replace(/\t/g, " ")
                    .replace(/\n/g, " "); // to match IE
                return "";
            }

            if (strCSSDisplay === "none") {
                return "";
            }

            gap = (
                isBlock(n)
                    ? "\n"
                    : " "
            );

            plainText += gap;
            i = 0;
            len = n.childNodes.length;
            while (i < len) {
                c = n.childNodes[i];

                // if the node is a text node, append the value to the text
                if (c.nodeType === 3) {
                    plainText += c.nodeValue;
                }

                // if the node has children, loop through them
                if (c.childNodes.length) {
                    recurse(c);
                }

                i += 1;
            }

            plainText += gap;
            return plainText;
        }

        // we alter elements within the node that was sent, so clone the
        //      node if it's not consumable
        if (bolConsumable !== true) {
            node = node.cloneNode(true);
        }

        // Line breaks aren't picked up by textContent
        node.innerHTML = node.innerHTML.replace(/<br>/g, "\n"); //</br>

        // we don't care about line breaks after P tags right now
        //// Double line breaks after P tags are desired, but would get
        //// stripped by the final RegExp. Using placeholder text.
        //var paras = node.getElementsByTagName("p");
        //var i;
        //var len;
        //i = 0;
        //len = paras.length;
        //while (i < len) {
        //    paras[i].innerHTML += "NEWLINE";
        //    i += 1;
        //}

        removeWhiteSpace(node);

        // Make the call!
        return normalize(recurse(node));
    }


// #############################################################################
// ####################### PRE-RENDER UTILITY FUNCTIONS ########################
// #############################################################################

    // we need a function to prevent html injection
    function encodeHTML(text) {
        var encode = {
            "&": "&#38;",
            "<": "&#60;",
            ">": "&#62;",
            '"': "&#34;",
            "'": "&#39;",
            "/": "&#47;"
        };

        if (text) {
            return text.toString().replace(
                /&|<|>|"|'|\//g,
                function (letter) {
                    return encode[letter] || letter;
                }
            );
        }
        return text;
    }

    // commented out because we no longer put the styling on the cell
    //// because we need to be able to add styles to an element inside of a
    ////      template string, we have this function take a template (while it's
    ////      still a template element) and add a token to the "style" attribute
    ////      that can be easily replaced
    //function templateCellAddStyleToken(templateElement) {
    //    var arrCell = xtag.query(templateElement.content, 'gs-cell');
    //    var i = 0;
    //    var len = arrCell.length;
    //    var strStyle;

    //    while (i < len) {
    //        strStyle = (arrCell[i].getAttribute('style') || '');
    //        strStyle = strStyle.trim();

    //        if (strStyle && strStyle[strStyle.length - 1] !== ';') {
    //            strStyle += ';';
    //        }

    //        arrCell[i].setAttribute(
    //            'style',
    //            '$$CSSREPLACETOKEN$$ ' + strStyle
    //        );

    //        i += 1;
    //    }
    //}

    // because we are using the gs-cell element for headers, data cells, insert
    //      cells, record selectors and the all selector: we need a way for the
    //      CSS to identify them differently, so this function takes a template
    //      element and adds a class to the gs-cell elements within it
    function templateCellAddClass(templateElement, strClass) {
        var arrCell = xtag.query(templateElement.content, 'gs-cell');
        var i = 0;
        var len = arrCell.length;

        while (i < len) {
            arrCell[i].classList.add(strClass);
            i += 1;
        }
    }

    // because we need to be able to target cells by record number, this
    //      function takes a template and adds an attribute to each cell that'll
    //      contain the record number (zero-based) after doT.js
    function templateCellAddRowNumber(templateElement, strOverride) {
        var arrCell = xtag.query(templateElement.content, 'gs-cell');
        var i = 0;
        var len = arrCell.length;

        while (i < len) {
            arrCell[i].setAttribute(
                'data-row-number',
                (strOverride || '{{! row_number - 1 }}')
            );
            i += 1;
        }
    }

    // because we need to be able to target cells by column number, this
    //      function takes a template and adds an attribute to each cell that'll
    //      contain the column number (zero-based)
    function templateCellAddColumnNumber(templateElement) {
        var arrCell = xtag.query(templateElement.content, 'gs-cell');
        var i = 0;
        var len = arrCell.length;

        while (i < len) {
            arrCell[i].setAttribute('data-col-number', i);
            i += 1;
        }
    }

    // commented out because it has been superceded by the new
    //      "templateExtractVisibleCellRange" function
    //// because we only render what is visible on the screen, we use this
    ////      function to take a template string and extract only the columns
    ////      that will be visible
    //function templateExtractCellRange(strTemplate, fromColumn, toColumn) {
    //    var templateElement = document.createElement('template');
    //    templateElement.innerHTML = strTemplate;

    //    var arrCell = xtag.query(templateElement.content, 'gs-cell');
    //    var i = fromColumn;
    //    var len = toColumn;
    //    var strCells = '';

    //    while (i < len) {
    //        strCells += arrCell[i].outerHTML;
    //        i += 1;
    //    }

    //    return strCells;
    //}

    // because we only render what is visible on the screen, we use this
    //      function to take a template string and extract only the columns that
    //      will be visible
    // since we've added the ability to hide columns, we need a template
    //      cell extractor that's aware of visibility.
    function templateExtractVisibleCellRange(
        element,
        strTemplate,
        fromColumn,
        toColumn
    ) {
        var jsnRange;

        // if no from and to column have been provided, extract whole visible
        //      range
        if (fromColumn === undefined || toColumn === undefined) {
            jsnRange = element.internalDisplay.currentRange;
            fromColumn = jsnRange.fromColumn;
            toColumn = jsnRange.toColumn;
        }

        var templateElement = document.createElement('template');
        templateElement.innerHTML = strTemplate;

        var arrCell = xtag.query(templateElement.content, 'gs-cell');
        var i = fromColumn;
        var len = toColumn;
        var strCells = '';
        var arrColumnWidths = element.internalDisplay.columnWidths;

        while (i < len) {
            if (arrColumnWidths[i] > 0) {
                strCells += arrCell[i].outerHTML;
            }
            i += 1;
        }

        return strCells;
    }


    // we need to be able to provide column headings when the user copies some
    //      data, so here we take a template element and we get the text of
    //      every cell and save it for that purpose
    function templateDetermineCopyHeaderList(element, templateElement) {
        var arrHeading = [];
        var arrCell = xtag.query(templateElement.content, 'gs-cell');
        var i = 0;
        var len = arrCell.length;
        var bolHeaderFound = false;
        var strHeading;

        while (i < len) {
            strHeading = arrCell[i].getAttribute('header') || '';
            arrHeading.push(strHeading);

            //console.log('cell: ', arrCell[i]);

            // we want to warn if the copy template has no "header" attributes
            //      so, if one of the cells has a "header" attribute: we'll
            //      prevent the warning code by setting "bolHeaderFound"
            if (arrCell[i].hasAttribute('header')) {
                bolHeaderFound = true;
            }

            i += 1;
        }

        //console.log('bolHeaderFound: ', bolHeaderFound);
        //console.log('copy-header:    ', element.getAttribute('copy-header'));

        // if no "header" attributes were found (and the "copy-header"
        //      attribute doesn't equal "never"), we want to warn the developer
        //      that when a user copies: they wont have any headers because
        //      none were defined
        if (
            !bolHeaderFound &&
            element.getAttribute('copy-header') !== 'Never'
        ) {
            console.warn('GS-TABLE Warning: No headers found in "copy" ' +
                    'template. Please define headers for the copy by using ' +
                    'the "header" attribute on the gs-cell elements of the ' +
                    '"copy" template. If no headers are defined: when a ' +
                    'user copies they will not get any headers. To dismiss ' +
                    'this warning and prevent users from copying the ' +
                    'header: set the "copy-header" attribute to "never."');
        }

        element.internalClip.headerList = arrHeading;
    }

    // we need to know what data column is used for each column, so here we
    //      take the record template and find out what column is associated
    //      with what column
    function templateDetermineCopyColumnList(element, templateElement) {
        var arrColumn = [];
        var arrCell = xtag.query(templateElement.content, 'gs-cell');
        var i = 0;
        var len = arrCell.length;

        //var strColumn;
        //var cell;
        //var strCell;
        //var columnElement;
        //var arrMatch;

        while (i < len) {
            arrColumn.push(arrCell[i].textContent);

            //// we clear out this variable so that if we don't find a column
            ////      name, we'll just add empty string to the column list
            //strColumn = '';

            //// we save the cell element to a variable for easy access
            //cell = arrCell[i];

            //// we'll look for:
            ////      "{{! rowSOMETHINGHERE }}" or "{{= rowSOMETHINGHERE }}" or
            ////      the first element with the "column" attribute
            ////      if we've found one a doT.js statement, we'll trim off the
            ////      braces, "!", "=" and "row" and we'll be left with either
            ////      "['columnname']" or ".columnname"
            ////      if we've found an element with the "column" attribute,
            ////      we'll use it straight as-is
            //columnElement = xtag.query(cell, '[column]')[0];

            //if (cell.hasAttribute('copy-column')) {
            //    strColumn = cell.getAttribute('copy-column') || '';
            //} else if (columnElement) {
            //    strColumn = columnElement.getAttribute('column') || '';
            //}
            ////else {
            ////    strCell = cell.innerHTML;
            ////    arrMatch = strCell.match(/\{\{(!|=)\s*row.*\}\}/g);
            ////    if (arrMatch) {
            ////        strCell = arrMatch[0];
            ////        strCell = strCell
            ////                    // removes "{{="
            ////                    // removes "}}"
            ////                    // removes two columns matched together
            ////                    .substring(3, strCell.indexOf('}}'))
            ////                    // removes extra whitespace
            ////                    .trim();
            ////
            ////        //console.log(strCell);
            ////        //console.log(arrMatch);
            ////        //console.log('########################');
            ////    } else {
            ////
            ////    }
            ////}
            //arrColumn.push(strColumn);
            i += 1;
        }

        element.internalClip.columnList = arrColumn;
    }

    // sometimes, we want to get a list of column names that are used in a
    //      template
    function templateGetColumnList(templateElement) {
        var arrColumn = [];
        var arrElement = xtag.query(templateElement.content, '[column]');
        var i = 0;
        var len = arrElement.length;
        var strColumn;

        while (i < len) {
            strColumn = arrElement[i].getAttribute('column');

            // if there is a column name in the "column" attribute and the
            //      column isn't already in the list of columns we've found:
            //      add it to the array
            if (strColumn && arrColumn.indexOf(strColumn) === -1) {
                arrColumn.push(strColumn);
            }
            i += 1;
        }

        return arrColumn;
    }

    // the user needs to be able to set a custom websocket for this element,
    //      so this function will use an attribute to find out what socket to
    //      use (and it'll default to "GS.envSocket")
    function getSocket(element) {
        if (element.getAttribute('socket')) {
            return GS[element.getAttribute('socket')];
        }
        return GS.envSocket;
    }

    // we need to be able to replace all occurences of a dynamic string with
    //      another dynamic string, and because javascript's .replace()
    //      function only replaces the first occurence (unless you send a
    //      regex), we use this function which takes the string to replace and
    //      creates a regex from it (escaping all regex special characters)
    //      then uses javascript's .replace()
    function stringReplaceAll(str, find, replace) {
        return str.replace(
            new RegExp(
                find.replace(
                    /([\.\*\+\?\^\=\!\:\$\{\}\(\)\|\[\]\/\\])/g,
                    '\\$1'
                ),
                'g'
            ),
            replace
        );
    }

    // both render partial and render full need to know the visible range
    //      of cells so this function serves them both, it returns the
    //      from/to column/record numbers and the origin top/left point
    function getCurrentCellRange(element) {
        var scrollTop;
        var scrollLeft;
        var arrColumnWidths;
        //var arrColumnBorders;
        var arrRecordHeights;
        var columnBorderWidth;
        var recordBorderHeight;

        var fromColumn;
        var toColumn;
        var fromRecord;
        var toRecord;

        var i;
        var len;
        var intTemp;
        var intPrev;

        var intViewportWidth;
        var intViewportHeight;
        var intCellOriginLeft;
        var intRecordOriginTop;

        var bolRecordSelector;
        var bolInsertRecord;
        var bolHeaderRecord;
        var bolRenderAllColumns;

        // we need the viewport dimensions because we need to include the
        //      viewport when choosing what cells to show
        intViewportWidth = element.elems.dataViewport.clientWidth;
        intViewportHeight = element.elems.dataViewport.clientHeight;

        // save column widths and record heights for easy access
        arrColumnWidths = element.internalDisplay.columnWidths;
        arrRecordHeights = element.internalDisplay.recordHeights;

        // we needs the border dimensions to calculate true locations
        columnBorderWidth = element.internalDisplay.columnBorderWidth;
        recordBorderHeight = element.internalDisplay.recordBorderHeight;

        // save scroll location and dimensions for easy access
        scrollTop = element.internalScroll.top;
        scrollLeft = element.internalScroll.left;

        // the developer can choose to not render hidden columns, this limits
        //      some small bits of functionality (the only example I can think
        //      of is selecting all the columns and double clicking to resize.
        //      when some of the columns are not rendered, they don't get
        //      affected by the resize.). This choice affects scrolling
        //      calculations so we need to find out what the developer wants.
        bolRenderAllColumns = !element.hasAttribute('skip-hidden-columns');

        // commented out because we are now going to allow overscrolling,
        //      eventually, it's possible we'll make overscrolling an option
        //      if that happens, we'll want this code back
        //// if we are scrolled all the way to the bottom and there is scroll
        ////      room, we don't want to show the bottom border of the last
        ////      cells, so we'll move the scroll up by the border size
        //if (
        //    scrollTop === element.internalScroll.maxTop &&
        //    element.internalScroll.maxTop > 0
        //) {
        //    scrollTop -= recordBorderHeight;
        //}

        // remove some width and height from the viewport because some of it
        //      will be covered by the header, insert and selector cells
        intViewportHeight -= (
            element.internalScrollOffsets.top +
            element.internalScrollOffsets.bottom
        );
        intViewportWidth -= (
            element.internalScrollOffsets.left +
            element.internalScrollOffsets.right
        );

        i = 0;
        len = arrColumnWidths.length;
        intTemp = 0;
        intCellOriginLeft = 0;
        while (i < len) {
            // when the column width is zero, it's hidden, so don't factor
            //      it into the calculations
            if (arrColumnWidths[i] > 0) {
                intPrev = intTemp;
                intTemp += arrColumnWidths[i];
                intTemp += columnBorderWidth;
            }

            if (fromColumn === undefined && intTemp > scrollLeft) {
                fromColumn = i;
                if (bolRenderAllColumns) {
                    intCellOriginLeft = -intPrev;
                } else {
                    intCellOriginLeft = (intCellOriginLeft - scrollLeft);
                }
            }
            if (
                toColumn === undefined &&
                intTemp > (scrollLeft + intViewportWidth)
            ) {
                toColumn = i;
                break;
            }
            if (fromColumn === undefined && bolRenderAllColumns) {
                intCellOriginLeft = intTemp;
            }
            i += 1;
        }
        fromColumn = Math.max(0, (fromColumn || 0));
        toColumn = (toColumn || i) + 1;

        intCellOriginLeft = intCellOriginLeft || 0;

        if (toColumn > arrColumnWidths.length) {
            toColumn = arrColumnWidths.length;
        }

        // At first, we forced hidden columns to not be rendered. Normally,
        //      we want all columns rendered, even if not every single one
        //      is visible. This allows us to commit operations on hidden
        //      columns. But, sometimes, speed is more important. So, we
        //      have an attribute to make it so that hidden columns are not
        //      rendered.
        if (bolRenderAllColumns) {
            fromColumn = 0;
            toColumn = arrColumnWidths.length;
        }

        //console.log(intCellOriginLeft);
        //console.log('columns: ', fromColumn, toColumn);

        // figure out start/end records
        i = 0;
        len = arrRecordHeights.length;
        intTemp = 0;
        intRecordOriginTop = 0;
        while (i < len) {
            intTemp += arrRecordHeights[i];
            intTemp += recordBorderHeight;

            if (fromRecord === undefined && intTemp > scrollTop) {
                fromRecord = i;
                intRecordOriginTop = (intRecordOriginTop - scrollTop);
            }
            if (
                toRecord === undefined &&
                intTemp > (scrollTop + intViewportHeight)
            ) {
                toRecord = i;
                break;
            }
            if (fromRecord === undefined) {
                intRecordOriginTop = intTemp;
            }
            i += 1;
        }
        toRecord = ((toRecord || i) + 1);
        intRecordOriginTop = (intRecordOriginTop || 0);

        //console.log(
        //    toRecord,
        //    arrRecordHeights.length,
        //    element.internalDisplay.insertRecordVisible,
        //    element.internalDisplay.insertRecordStick,
        //    fromRecord
        //);

        bolInsertRecord = false;
        if (toRecord > arrRecordHeights.length) {
            bolInsertRecord = (
                element.internalDisplay.insertRecordVisible &&
                element.internalDisplay.insertRecordStick === null
            );

            if (
                element.internalDisplay.insertRecordVisible &&
                element.internalDisplay.insertRecordStick === null &&
                fromRecord === undefined
            ) {
                toRecord = (arrRecordHeights.length + 1);
                fromRecord = toRecord;
            } else {
                toRecord = arrRecordHeights.length;
            }
        }

        fromRecord = Math.max(0, (fromRecord || 0));

        // right now, the gs-table assumes that the header is always
        //      affixed to the top side of the viewport.
        bolHeaderRecord = element.internalDisplay.headerVisible;

        // right now, the gs-table assumes that the record selectors are
        //      always affixed to the left side of the viewport.
        bolRecordSelector = element.internalDisplay.recordSelectorVisible;

        // because we scroll by forcing the leftmost column to stick to the
        //      left side, there is a discrepancy between the scroll and what
        //      the user sees that the scroll is, we need a variable to store
        //      what the user sees for the scroll
        element.internalScroll.displayTop = (
            scrollTop + intRecordOriginTop
        );
        element.internalScroll.displayLeft = (
            scrollLeft + intCellOriginLeft
        );

        //console.log(
        //    element.internalScroll.displayTop,
        //    scrollTop,
        //    intRecordOriginTop
        //);
        //console.log(
        //    element.internalScroll.displayLeft,
        //    scrollLeft,
        //    intCellOriginLeft
        //);

        // offset the record/cell origins by the amount that the header cells
        //      and record selectors offset the viewport
        if (bolRenderAllColumns) {
            intCellOriginLeft += element.internalScrollOffsets.left;
        } else {
            intCellOriginLeft = element.internalScrollOffsets.left;
        }
        intRecordOriginTop = element.internalScrollOffsets.top;

        // commented out and replaced by the two lines above, these two lines
        //      make scrolling smooth, the two lines above make the scrolling
        //      resolve to the top of the top record and the left of the
        //      leftmost column
        //intCellOriginLeft += element.internalScrollOffsets.left;
        //intRecordOriginTop += element.internalScrollOffsets.top;

        //console.log('element: ', element);
        //console.log('intRecordOriginTop: ', intRecordOriginTop);
        //console.log('intCellOriginLeft: ', intCellOriginLeft);
        //console.log('fromRecord: ', fromRecord);
        //console.log('fromColumn: ', fromColumn);
        //console.log('toRecord: ', toRecord);
        //console.log('toColumn: ', toColumn);

        return {
            "originTop": intRecordOriginTop,
            "originLeft": intCellOriginLeft,

            "fromRecord": fromRecord,
            "fromColumn": fromColumn,
            "toRecord": toRecord,
            "toColumn": toColumn,

            "headerRecord": bolHeaderRecord,
            "recordSelector": bolRecordSelector,
            "insertRecord": bolInsertRecord
        };
    }

    // in the case of header->line relationships, we need to be able to
    //      silently add in values to form the header->line link, so, here
    //      we generate the values for the link
    function getInsertAddin(element) {
        var jsnRet = {};

        if (element.getAttribute('column') || element.getAttribute('qs')) {
            jsnRet.link_column = (
                element.getAttribute('child-column') ||
                element.getAttribute('column') ||
                element.getAttribute('qs')
            );
            jsnRet.link_value = element.value;
        }

        return jsnRet;
    }

    function delimitedStringToHTML(
        element,
        valueText,
        fieldDelimiter,
        recordDelimiter,
        quoteChar,
        decodeFunction
    ) {
        var i = 0;
        var len = valueText.length;
        var col_i;
        var col_len;

        var arrRecords = [];
        var arrRecord = [];

        var bolInQuote = false;
        var strCell = '';
        var strRecord;
        var strHTML = '';
        var strPreviousChar;
        var strChar;
        var strNullString;

        // we want the null string to be configurable, so we'll read the
        //      "null-string" attribute to get the null string
        // if the "null-string" attribute is present, use the contents
        //      or coalesce to empty string
        if (element.hasAttribute('null-string')) {
            strNullString = element.getAttribute('null-string') || '';

        // else, null string is left up to the encoding function
        } else {
            strNullString = undefined;
        }

        // sometimes, there is an extra delimiter at the beginning of the first
        //      record. if there is: skip over it.
        if (valueText[0] === recordDelimiter) {
            i += 1;
        }

        // make sure there is a recordDelimiter at the end
        if (valueText[len - 1] !== recordDelimiter) {
            valueText += recordDelimiter;
            len = valueText.length;
        }

        // looper
        while (i < len) {
            strChar = valueText[i];
            if (
                strChar === quoteChar &&
                bolInQuote === false &&
                (
                    strPreviousChar === fieldDelimiter ||
                    strPreviousChar === recordDelimiter ||
                    strPreviousChar === undefined
                )
            ) {
                bolInQuote = true;

            } else if (strChar === quoteChar && bolInQuote === true) {
                bolInQuote = false;

            } else if (strChar === fieldDelimiter && bolInQuote === false) {
                arrRecord.push(decodeFunction(strCell, strNullString));
                strCell = '';

            } else if (strChar === recordDelimiter && bolInQuote === false) {
                arrRecord.push(decodeFunction(strCell, strNullString));
                strCell = '';

                arrRecords.push(arrRecord);
                arrRecord = [];

            } else {
                strCell += strChar;
            }

            strPreviousChar = strChar;
            i += 1;
        }

        // data structure to html
        i = 0;
        len = arrRecords.length;
        while (i < len) {
            strRecord = '';
            col_i = 0;
            col_len = arrRecords[i].length;
            while (col_i < col_len) {
                strRecord += (
                    '<td>' +
                        encodeHTML(arrRecords[i][col_i]) +
                    '</td>'
                );
                col_i += 1;
            }

            strHTML += '<tr>' + strRecord + '</tr>';
            i += 1;
        }

        return '<table>' + strHTML + '</table>';
    }

    // sometimes we need to have the selection object, but we don't want it to
    //      change when the selection of the table changes (and vice versa). one
    //      occurance of this is when we are about to update the selection,
    //      we'll copy the selection so that we have a backup and then we'll
    //      update the selection and then we trigger a "before_selection" event.
    //      if the "before_selection" event get's prevented than we'll revert
    //      to a copy.
    function getSelectionCopy(element) {
        var jsnOriginal;
        var jsnCopy;
        var jsnRange;
        var i;
        var len;

        jsnOriginal = element.internalSelection;

        jsnCopy = {
            "ranges": [],
            "insertRecord": jsnOriginal.insertRecord
        };

        // hold on a minute there, why can we just use .slice(0) on the
        //      selection range array?
        // well, my young grasshopper, .slice(0) does work for copying arrays.
        //      however, our selection ranges are stored as JSON objects and
        //      JSON objects within an array will not be copied, the copy array
        //      and the original array will both reference the same JSON object
        //      in memory. so, if I copied the selection range array using
        //      .slice(0) and then altered one of the range objects, the
        //      original would show the same changes. so, using .slice(0) would
        //      make this function useless if you're trying to back up the
        //      selection ranges.
        i = 0;
        len = jsnOriginal.ranges.length;
        while (i < len) {
            jsnRange = jsnOriginal.ranges[i];

            jsnCopy.ranges.push({
                "start": {
                    "row": jsnRange.start.row,
                    "column": jsnRange.start.column
                },
                "end": {
                    "row": jsnRange.end.row,
                    "column": jsnRange.end.column
                }
            });
            i += 1;
        }

        return jsnCopy;
    }

    // sometimes, we need to get the value of a cell. this function returns a
    //      cell in it's unencoded state
    function getCell(
        element,
        strColumn,
        intRow,
        bolDecode,
        strNullStringOverride
    ) {
        var strRecord;
        var rec_i;
        var rec_len;
        var strChar;
        var strCell;
        var strNullString;

        var intCurrentColumn;
        var intTargetColumn;

        // we need to know the index of the target column
        intTargetColumn = (
            element.internalData.columnNames.indexOf(strColumn)
        );

        // we'll iterate through each char until we get the text for the cell
        //      at the correct index
        strRecord = element.internalData.records[intRow];
        intCurrentColumn = 0;
        strCell = '';
        rec_i = 0;
        rec_len = strRecord.length;
        while (rec_i < rec_len) {
            strChar = strRecord[rec_i];

            // if the current character is not a tab: add it to the current
            //      cell variable
            if (strChar !== '\t') {
                strCell += strChar;
            }

            // if the current character is a tab or we are at the end of the
            //      record: handle current cell
            if (
                strChar === '\t' ||
                rec_i === (rec_len - 1)
            ) {
                // advance column number
                intCurrentColumn += 1;

                // if we've reached the start of the column after the desired
                //      column, stop the loop
                if (intCurrentColumn === (intTargetColumn + 1)) {
                    break;
                }

                // clear cell variable
                strCell = '';
            }

            rec_i += 1;
        }

        //console.log('RECORD:', strRecord);
        //console.log('COLUMN:', strColumn);
        //console.log('CELL:', strCell);
        //console.log('NULLSTRING:', strNullString);
        //console.log(
        //    'DECODED:',
        //    GS.decodeFromTabDelimited(strCell, strNullString)
        //);

        if (bolDecode !== false) {
            // we want the null string to be configurable, so we'll read the
            //      "null-string" attribute to get the null string
            // if the "null-string" attribute is present, use the contents
            //      or coalesce to empty string
            if (strNullStringOverride !== undefined) {
                strNullString = strNullStringOverride;

            } else if (element.hasAttribute('null-string')) {
                strNullString = element.getAttribute('null-string') || '';

            // else, null string is left up to the encoding function
            } else {
                strNullString = undefined;
            }

            return GS.decodeFromTabDelimited(strCell, strNullString);
        }

        return strCell;
    }

    function getConnectedSelectedColumns(element, intStartColumn) {
        var arrCurrentColumns;
        var arrSelection;
        var i;

        // get selected column list
        arrSelection = (
            element.internalSelection.columns
        );

        // clear current columns array so that we can start fresh
        arrCurrentColumns = [];

        // loop forwards until we run into a column that is not
        //      selected, each sequential column that is in the
        //      selected column list will be added to the current
        //      list
        i = intStartColumn;
        //console.log('forward start', i);
        while (i < 9999) {
            //console.log('forward', i, arrSelection.indexOf(i));
            if (arrSelection.indexOf(i) > -1) {
                arrCurrentColumns.push(i);
            } else {
                break;
            }
            i += 1;
        }

        // loop backwards until we run into a column that is not
        //      selected, each sequential column that is in the
        //      selected column list will be added to the current
        //      list
        i = (intStartColumn - 1);
        //console.log('backward start', i);
        while (i >= 0) {
            //console.log('backward', i, arrSelection.indexOf(i));
            if (arrSelection.indexOf(i) > -1) {
                arrCurrentColumns.push(i);
            } else {
                break;
            }
            i -= 1;
        }

        // we need to sort the column number list. this is because
        //      of how we find all of the column numbers to reorder
        arrCurrentColumns.sort();

        // ask and you shall receive
        return arrCurrentColumns;
    }

    // in partial and full rerender, we need to set the button icons
    //      and the tooltips of the header cells
    function handleHeaderTemplateTokens(
        element,
        strTemplate,
        fromColumn,
        toColumn
    ) {
        var col_i;
        var col_len;
        var filter_i;
        var filter_len;

        var columnIndex;
        var strDataColumn;
        var strTitle;
        var strClass;

        var arrColumnWidths;
        var arrColumnOrders;
        var arrColumnFilters;

        //console.log('1***', strTemplate);

        // save the order lists for easy access
        arrColumnOrders = element.internalData.columnOrders;

        // save the filter lists for easy access
        arrColumnFilters = element.internalData.columnFilters;

        // save column widths for easy access
        arrColumnWidths = element.internalDisplay.columnWidths;

        col_i = fromColumn;
        col_len = toColumn;
        while (col_i < col_len) {
            // if the column is not hidden
            if (arrColumnWidths[col_i] > 0) {
                strDataColumn = (
                    element.internalDisplay.dataColumnName[
                        col_i
                    ]
                );

                columnIndex = (
                    element.internalData.columnNames.indexOf(
                        strDataColumn
                    )
                );

                strClass = '';
                if (arrColumnOrders[columnIndex] !== 'neutral') {
                    strClass += (
                        ' sort-' +
                        arrColumnOrders[columnIndex]
                    );
                }
                if (
                    arrColumnFilters[columnIndex] &&
                    arrColumnFilters[columnIndex].length > 0
                ) {
                    strClass += ' filtered';
                }
                strTemplate = strTemplate.replace(
                    '$$HDRBTNCLASS_' + strDataColumn + '$$',
                    strClass
                );

                // we need to calculate the title attribute for this
                //      header cell
                strTitle = '';

                if (arrColumnFilters[columnIndex]) {
                    filter_i = 0;
                    filter_len = arrColumnFilters[columnIndex].length;
                    while (filter_i < filter_len) {
                        strTitle += (
                            strTitle
                                ? ' '
                                : ''
                        );
                        strTitle += (
                            arrColumnFilters[columnIndex][filter_i].name
                        );

                        filter_i += 1;
                    }
                }

                // sort in title attribute
                if (arrColumnOrders[columnIndex] === 'desc') {
                    strTitle += (
                        strTitle
                            ? ' '
                            : ''
                    );
                    strTitle += 'sorted descending';

                } else if (arrColumnOrders[columnIndex] === 'asc') {
                    strTitle += (
                        strTitle
                            ? ' '
                            : ''
                    );
                    strTitle += 'sorted ascending';
                }

                // replace title token
                strTemplate = strTemplate.replace(
                    '$$HDR_TITLE_' + strDataColumn + '$$',
                    encodeHTML(strTitle)
                );
            }
            col_i += 1;
        }

        //console.log('2***', strTemplate);

        return strTemplate;
    }

    // in multiple places we need to turn a direction string into useful
    //      booleans and a resolved direction string
    function directionStringBreakdown(strDirectionString) {
        var bolTop;
        var bolLeft;
        var bolBottom;
        var bolRight;

        // prevent uppercase characters
        strDirectionString = strDirectionString.toLowerCase();

        // multiple scroll directions could be sent, we need to parse and
        //      resolve the value to something consistent
        bolTop = (strDirectionString.indexOf('top') !== -1);
        bolLeft = (strDirectionString.indexOf('left') !== -1);
        bolBottom = (strDirectionString.indexOf('bottom') !== -1);
        bolRight = (strDirectionString.indexOf('right') !== -1);

        // warn if two scroll directions are contradictory
        if (bolTop && bolBottom) {
            console.warn('GS-TABLE Warning: Contradictory parameter sent' +
                    ' to directionStringBreakdown.' +
                    ' "Down" direction will be cancelled.' +
                    ' Parameter Text: "' + strDirectionString + '"');
            bolBottom = false;
        }
        if (bolLeft && bolRight) {
            console.warn('GS-TABLE Warning: Contradictory parameter sent' +
                    ' to directionStringBreakdown.' +
                    ' the left and the right at the same time.' +
                    ' "Right" direction will be cancelled.' +
                    ' Parameter Text: "' + strDirectionString + '"');
            bolRight = false;
        }

        // build up consistent scroll direction string
        strDirectionString = '';
        if (bolTop) {
            strDirectionString += 'top';
        }
        if (bolLeft) {
            strDirectionString += 'left';
        }
        if (bolBottom) {
            strDirectionString += 'bottom';
        }
        if (bolRight) {
            strDirectionString += 'right';
        }

        return {
            "bolTop": bolTop,
            "bolLeft": bolLeft,
            "bolBottom": bolBottom,
            "bolRight": bolRight,
            "resolvedString": strDirectionString
        };
    }

    // there are multiple times where we need to find a specific HUD element.
    //      Any HUD element is allowed to be in either the top or bottom HUD
    //      bar. this function looks for elements by class because HUD elements
    //      are identified by classes. this function will check both the top and
    //      bottom HUD bars.
    // in the future, we want to allow multiple buttons with the same class (for
    //      example, the developer may want a refresh button at the top and at
    //      the bottom).
    // ### NEED CODING ###
    function findHudElement(element, strClass) {
        var hudElement;

        // first, we'll try to find it in the bottom HUD
        hudElement = xtag.query(
            element.elems.bottomHudContainer,
            '.' + strClass
        )[0];

        // if we couldn't find the element in the bottom HUD,
        //      we'll try the top HUD
        if (!hudElement) {
            hudElement = xtag.query(
                element.elems.topHudContainer,
                '.' + strClass
            )[0];
        }

        // return whatever we found
        return hudElement;
    }

    // in multiple places, we care what data columns selected
    function getSelectedDataColumns(element) {
        var arrSelectedColumns;
        var arrDataColumns;
        var i;
        var len;
        var index;

        // we need an array of the selected data columns
        arrSelectedColumns = (
            element.internalSelection.columns
        );
        arrDataColumns = [];
        i = 0;
        len = arrSelectedColumns.length;
        while (i < len) {
            index = arrSelectedColumns[i];
            if (element.internalDisplay.dataColumnName[index]) {
                arrDataColumns.push(
                    element.internalData.columnNames.indexOf(
                        element.internalDisplay.dataColumnName[index]
                    )
                );
            }

            i += 1;
        }

        return arrDataColumns;
    }

    // we want the proper event to bubble up when the hidden focus control is
    //      focused. in order to do this, we've moved that code into this
    //      function so that we don't have to repeat it
    function focusHiddenControl(element) {
        element.elems.hiddenFocusControl.focus();
        GS.triggerEvent(element.elems.hiddenFocusControl, 'focus');
    }


    // sometimes, we need to know what cell the mouse is over
    function getCellFromMouseEvent(element, event) {
        var jsnMousePos;
        var jsnElementPos;
        var intMouseX;
        var intMouseY;
        var row;
        var column;
        var jsnRange;
        var arrColumnWidths;
        var arrRecordHeights;
        var i;
        var len;
        var intLeft;
        var intTop;
        var intColBorderWidth;
        var intRowBorderHeight;
        var intRowSelectorWidth;
        var intHeaderHeight;
        //var intInsertRecordHeight;
        var bolHeader;
        var bolInsertRecord;
        var bolRecordSelector;

        // gather display variables
        jsnRange = element.internalDisplay.currentRange;

        bolHeader = element.internalDisplay.headerVisible;
        bolInsertRecord = (
            element.internalDisplay.insertRecordVisible &&
            jsnRange.insertRecord
        );
        bolRecordSelector = element.internalDisplay.recordSelectorVisible;

        arrColumnWidths = element.internalDisplay.columnWidths;
        arrRecordHeights = element.internalDisplay.recordHeights;
        intColBorderWidth = element.internalDisplay.columnBorderWidth;
        intRowBorderHeight = element.internalDisplay.recordBorderHeight;
        intRowSelectorWidth = (
            bolRecordSelector
                ? (
                    element.internalDisplay.recordSelectorWidth +
                    element.internalDisplay.recordSelectorBorderWidth
                )
                : 0
        );
        intHeaderHeight = (
            bolHeader
                ? (
                    element.internalDisplay.headerHeight +
                    element.internalDisplay.headerBorderHeight
                )
                : 0
        );
        //intInsertRecordHeight = (
        //    bolInsertRecord
        //        ? (
        //            element.internalDisplay.insertRecordHeight +
        //            element.internalDisplay.insertRecordBorderWidth
        //        )
        //        : 0
        //);

        // we need the mouse position and the element position
        jsnMousePos = GS.mousePosition(event);
        jsnElementPos = GS.getElementOffset(
            element.elems.dataViewport
        );

        // we need the mouse X to be relative to the dataViewport
        intMouseX = (jsnMousePos.left - jsnElementPos.left);

        // we need the mouse Y to be relative to the dataViewport
        intMouseY = (jsnMousePos.top - jsnElementPos.top);

        // get column. careful, it could be the record selector

        // if record selector is visible and the mouse is above it
        if (bolRecordSelector && intMouseX <= intRowSelectorWidth) {
            column = 'selector';

        } else {
            intLeft = jsnRange.originLeft;//intRowSelectorWidth;
            i = jsnRange.fromColumn;
            len = jsnRange.toColumn;
            while (i < len) {
                if (intMouseX >= intLeft) {
                    column = i;
                } else {
                    break;
                }

                intLeft += arrColumnWidths[i];
                intLeft += intColBorderWidth;
                i += 1;
            }
        }

        // get record. careful, it could be the header or the insert record

        // if header is visible
        if (
            bolHeader &&
            intMouseY <= intHeaderHeight
        ) {
            row = 'header';

        } else {
            intTop = intHeaderHeight;
            i = jsnRange.fromRecord;
            len = jsnRange.toRecord;
            while (i < len) {
                if (intMouseY >= intTop) {
                    row = i;
                } else {
                    break;
                }

                intTop += arrRecordHeights[i];
                intTop += intRowBorderHeight;
                i += 1;
            }

            if (bolInsertRecord && intMouseY >= intTop) {
                row = 'insert';
            }
        }

        //console.log(intMouseX, intMouseY, row, column);

        return {
            "row": row,
            "column": column
        };
    }

    // we need a way to compare the selection ranges, this function turns a
    //      selection range array into a string
    function selectionArrayToString(arr) {
        var i;
        var len;
        var strString;
        var jsnRange;

        strString = '';
        i = 0;
        len = arr.length;
        while (i < len) {
            jsnRange = arr[i];
            strString += (
                (
                    jsnRange.negator
                        ? 't'
                        : 'f'
                ) +
                String(jsnRange.start.column) +
                String(jsnRange.start.row) +
                String(jsnRange.end.column) +
                String(jsnRange.end.row)
            );

            i += 1;
        }

        return strString;
    }

    // Thanks SO User "Cambium"!
    function roundToNearestMultiple(intNum, intDivisor) {
        if (intNum > 0) {
            return Math.ceil(intNum / intDivisor) * intDivisor;
        }
        if (intNum < 0) {
            return Math.floor(intNum / intDivisor) * intDivisor;
        }

        return intDivisor;
    }


// #############################################################################
// ############################# ELEMENT FUNCTIONS #############################
// #############################################################################

    // this section deals with the generation of the gs-table's non-cell HTML

    // some attributes can't be used in their normal, dev-friendly format,
    //      this function translates those attributes to their final formats
    // some attributes need to be defaulted, even if they're not present
    function resolveElementAttributes(element) {
        var arrParts;

        // GS-TABLE elements that are connected to Envelope need to have "pk"
        //      and "lock" attributes
        if (element.getAttribute('src')) {
            // split "src" into "schema" and "object" attributes
            arrParts = GS.templateWithQuerystring(
                element.getAttribute('src')
            ).split('.');

            // I don't know who added this. I don't inderstand why someone
            //      would put something like "biz.bar.foo" in the "src"
            //      attribute. That's the case that this code handles. If
            //      you added this code: PUT A COMMENT!!!! We have comments
            //      for a reason. Don't ruin this beautiful code. Only YOU
            //      can prevent spaghetti code.
            //  ~Michael
            // It appears to be a solution to quote idented object names that
            //      contain a period like this: test."test.asdf"
            //      The problem with this solution (other than being unclear)
            //      is that it wont work for schema names that contain a period.
            //      We need a better solution for this. Perhaps it's time to
            //      create a function that understands ident quoted names for
            //      real, using actual parsing.
            //  ~Also Michael
            if (arrParts[2]) {
                arrParts[1] = arrParts[1] + '.' + arrParts[2];
            }

            // put the split sections of the object name into separate
            //      attributes
            element.setAttribute('schema', arrParts[0]);
            element.setAttribute('object', arrParts[1]);

            // default "pk" and "lock" attributes
            element.setAttribute(
                'pk',
                (element.getAttribute('pk') || 'id')
            );
            element.setAttribute(
                'lock',
                (element.getAttribute('lock') || 'change_stamp')
            );
        }

        // default null string attribute
        element.setAttribute(
            'null-string',
            (
                element.getAttribute('null-string') ||
                ''
            )
        );
    }

    // replace element HTML with the new HTML
    function prepareElement(element) {
        var rootElement;
        var i;

        // all gs-table elements must have an ID attribute
        if (!element.getAttribute('id')) {
            // loop through IDs using the ID sequence until we get to one
            //      that isn't used
            globalIDSeq += 1; // global to the gs-table x-tag definition scope
            i = 0;
            while (
                i < 500 &&
                document.getElementById('table-dynamic-id-' + globalIDSeq)
            ) {
                globalIDSeq += 1;
                i += 1;
            }

            element.setAttribute('id', 'table-dynamic-id-' + globalIDSeq);

            // warn the developer
            console.warn('GS-TABLE Warning: All gs-table elements must have' +
                    ' an ID. Adding dynamic ID:' +
                    ' "table-dynamic-id-' + globalIDSeq + '". Do not use' +
                    ' this ID for anything. Do not use it for HTML, CSS or' +
                    ' JS or anything else as it can change between page' +
                    ' loads.');
        }

        // the root is created as a variable so that we can append it to the
        //      gs-table without destrying the templates because the next step
        //      of this element's initalization is the "siphon" (where we
        //      extract the info out of the templates)
        rootElement = document.createElement('div');
        rootElement.classList.add('table-root');
        element.appendChild(rootElement);

        // create standard gs-table html
        rootElement.innerHTML =
                // we need a container to hold the HUD, this container will be
                //      absolutely positioned to the top of the gs-table
                '<div class="table-hud-container hud-top"></div>' +
                // we need a container to hold the viewport container and the
                //      scrollbars
                '<div class="table-table-container">' +
                // we need a container for the viewport that will automatically
                //      size the viewport correctly
                '    <div class="table-data-container">' +
                // we need a viewport that will hide anything that doesn't fit
                //      and won't scroll. the scrolling will be handled by the
                //      renderer.
                '        <div class="table-data-viewport"></div>' +
                '    </div>' +
                '    <div class="table-v-scroll-bar-container">' +
                '        <div class="table-v-scroll-bar">' +
                '            <div class="table-scroll-causer"></div>' +
                '        </div>' +
                '    </div>' +
                '    <div class="table-h-scroll-bar-container">' +
                '        <div class="table-h-scroll-bar">' +
                '            <div class="table-scroll-causer"></div>' +
                '        </div>' +
                '    </div>' +
                '</div>' +
                // we need a textarea that is hidden so that we can intercept
                //      keyboard events even if none of the controls have been
                //      focused into. one case where this occurs is when you
                //      select a range of cells, when selecting a range you
                //      don't want one of the cells to be focused, and yet, you
                //      want to be able to press "delete" and delete the
                //      records.
                // we also need a dependable focus target for when we handle
                //      copy/paste events.
                // this control also need to be after the rest of the cells to
                //      make tabbing out of the gs-table easier to code. to tab
                //      out we'll just have to not prevent default
                '<textarea class="hidden-focus-control"' +
                '    value="text makes this textarea Firefox worthy">' +
                '</textarea>' +
                // we need a static container to hold our loader elements
                '<div class="table-loader-container"></div>' +
                // we need a place to hold an example of each type of cell so
                //      that we can read their style dynamically without causing
                //      a "Forced Reflow", this will be a speed benefit
                '<div class="table-cell-test-container">' +
                '    <gs-cell class="table-cell"></gs-cell>' +
                '    <gs-cell class="table-header"></gs-cell>' +
                '    <gs-cell class="table-insert"></gs-cell>' +
                '    <gs-cell class="table-record-selector"></gs-cell>' +
                '</div>' +
                // we need a container to hold the HUD, this container will be
                //      absolutely positioned to the bottom of the gs-table
                '<div class="table-hud-container hud-bottom"></div>' +
                // we need a style tag for dynamic CSS, MS Edge is slow when it
                //      comes to changing style attributes for a bunch of cells,
                //      we're going to try not using style attributes and
                //      instead using a dynamic CSS style element
                // if it doesn't speed up Edge we may still come up with a new
                //      use for it so keep it around
                '<style class="cell-position" style="display:none;"></style>' +
                // we need to know when the font size changes so that we can
                //      re-render. this element will always be 1em wide and 1em
                //      tall. when this element changes pixel size, we'll know
                //      that the font size has changed.
                '<div class="table-font-size-detector"></div>';

        // we want to easily/quickly be able to get elements without
        //      using selectors
        element.elems = {};

        element.elems.root = rootElement;

        element.elems.topHudContainer = element.elems.root.children[0];
        element.elems.tableViewport = element.elems.root.children[1];
        element.elems.hiddenFocusControl = element.elems.root.children[2];
        element.elems.loaderContainer = element.elems.root.children[3];
        element.elems.cellTestContainer = element.elems.root.children[4];
        element.elems.bottomHudContainer = element.elems.root.children[5];
        element.elems.cellPositionStyle = element.elems.root.children[6];
        element.elems.fontSizeDetector = element.elems.root.children[7];

        element.elems.dataContainer =
                element.elems.tableViewport.children[0];
        element.elems.yScrollContainer =
                element.elems.tableViewport.children[1];
        element.elems.xScrollContainer =
                element.elems.tableViewport.children[2];

        element.elems.dataViewport = element.elems.dataContainer.children[0];

        element.elems.yScrollBar = element.elems.yScrollContainer.children[0];
        element.elems.xScrollBar = element.elems.xScrollContainer.children[0];
        element.elems.yScrollBarCauser = element.elems.yScrollBar.children[0];
        element.elems.xScrollBarCauser = element.elems.xScrollBar.children[0];

        element.elems.testDataCell = (
            element.elems.cellTestContainer.children[0]
        );
        element.elems.testHeader = (
            element.elems.cellTestContainer.children[1]
        );
        element.elems.testInsert = (
            element.elems.cellTestContainer.children[2]
        );
        element.elems.testRecordSelector = (
            element.elems.cellTestContainer.children[3]
        );

        // because the resize handles aren't always in the DOM, we'll create
        //      them virtually and store them
        element.elems.handleColumn = document.createElement('div');
        element.elems.handleColumn.classList.add('resize-column-handle');
        element.elems.handleRecord = document.createElement('div');
        element.elems.handleRecord.classList.add('resize-record-handle');

        // because the reorder indicator isn't always in the DOM, we'll create
        //      it virtually and store them
        element.elems.handleReorder = document.createElement('div');
        element.elems.handleReorder.classList.add('reorder-column-handle');

        // sometimes, we want to open a dialog to a particular pixel instead
        //      of a particular element. so, we'll create an element what for
        //      putting it at a particular pixel an then just use the
        //      standard openDialogToElement function.
        element.elems.pixel = document.createElement('div');
        element.elems.pixel.classList.add('pixel-element');
        element.elems.root.appendChild(element.elems.pixel);

        // we want a place to look to for data
        element.internalData = {
            "records": [],
            "columnFilterStatuses": [],
            "columnFilters": [],
            "columnListFilters": [],
            "columnOrders": [],
            "columnNames": [],
            "columnTypes": [],
            "insertRecord": {},
            "insertRecordRetainedColumns": [],
            "bolFirstLoadFinished": false
        };

        // we need to be able to make room for fixed objects when scrolling
        //      (like the fixed headers), so we'll define these properties
        //      so that we have a single place to look for them
        element.internalScrollOffsets = {
            "top": 0,
            "bottom": 0,
            "left": 0,
            "right": 0
        };

        // we need a place to store event functions because, to unbind a
        //      specific event javascript requires that you have the
        //      original function that was bound to that event
        element.internalEvents = {};

        // some events are triggered by something that the gs-table does,
        //      so event code needs to have a place to look to see if
        //      it's been cancelled for one execution
        element.internalEventCancelled = {
            "scrollbarY": false,
            "scrollbarX": false
        };

        // we need to manually store the scroll location somewhere because
        //      scrollbars can only cover so much area before breaking
        element.internalScroll = {
            "top": 0,
            "left": 0,
            "maxTop": 0,
            "maxLeft": 0,
            "displayTop": 0,
            "displayLeft": 0,
            "prevTop": 0,
            "prevLeft": 0
        };

        // we need to manually store timer IDs so that we can do throttling
        element.internalTimerIDs = {
            "scrollIntervalID": null,
            "visibilityIntervalID": null
        };

        // we need a place to store our templates, so we'll create an
        //      element.internalTemplates JSON object and store each
        //      template under a unique name
        element.internalTemplates = {
            "topHUD": "",
            "bottomHUD": "",
            "header": "",
            "originalRecord": "",
            "record": {},
            "insertRecord": "",
            "insertDialog": "",
            "updateDialog": ""
        };

        // we need a place to store cell dimensions and other display
        //      related info
        // anything in here set to "undefined" is set that way because the dev
        //      may set it to 0 or [] and we need to be able to tell that it
        //      hasn't been set yet
        element.internalDisplay = {
            "columnPlainTextNames": [],
            "dataColumnName": [],

            "columnWidths": [],
            "minColumnWidths": [],
            "maxColumnWidth": 999,

            "recordHeights": [],
            "maxRecordHeight": 999,

            "columnHandles": [],
            "recordHandles": [],

            "currentRange": {},
            "prevRange": {},

            // not used yet, null will mean "doesn't stick".
            //      only "top", "bottom" and null allowed.
            "headerStick": "top",

            "headerVisible": false,
            "headerHeight": undefined,
            "headerBorderHeight": 0,

            // not used yet, null will mean "doesn't stick".
            //      only "left", "right" and null allowed.
            "selectorStick": "left",

            "recordSelectorVisible": false,
            "recordSelectorWidth": 0,
            "recordSelectorBorderWidth": 0,

            // only "top", "bottom" and null allowed.
            "insertRecordStick": null, //"bottom"

            "insertRecordVisible": false,
            "insertRecordHeight": undefined,
            "insertRecordBorderHeight": 0,

            "fullRenderRequired": true,

            "defaultColumnWidths": [],
            "defaultColumnWidth": 0,
            "defaultRecordHeight": 0,
            "defaultRecordSelectorWidth": 27,
            "defaultHeaderHeight": 27,
            "defaultInsertRecordHeight": 27,

            "focus": {
                "column": null,
                "row": null,
                "nodeName": null,
                "columnAttribute": null,
                "latest": null,
                "selectionRange": {}
            }
        };

        // we need to default the record selector width
        element.internalDisplay.recordSelectorWidth = (
            element.internalDisplay.defaultRecordSelectorWidth
        );

        // we need a place to store selection ranges
        element.internalSelection = {
            "ranges": [],
            "rangeCache": null,
            "insertRecord": false,
            "originRecord": null,
            "resolvedSelection": [],
            "columns": [],
            "rows": [],
            "currentlySelecting": false
        };

        // we need a place to store the parameters for copy
        element.internalClip = {
            "columnList": [],
            "headerList": []
        };

        // we need a place to store the web worker and it's
        //      associated data
        element.internalWorker = {
            "worker": "",
            "ready": false
        };

        // we need a place to store the loader data
        element.internalLoaders = {
            "loaderIDs": [],
            "loaderElements": []
        };

        // we need a place to store info for column resizing
        element.internalResize = {
            "currentlyResizing": false,
            "showThrottleID": null,
            "resizeStarted": false,
            "cellOriginX": 0,
            "cellOriginY": 0,

            "resizeColumn": false,
            "resizeRecord": false,

            "resizeColumnHandleIndex": 0,
            "resizeRecordHandleIndex": 0,

            "resizeColumnIndex": null,
            "resizeRecordIndex": null,

            "resizingRecordSelectors": false,
            "resizingHeader": false,
            "resizingInsert": false,

            "scrollOriginTop": null,
            "scrollOriginLeft": null,

            "lastX": 0,
            "lastY": 0,
            "lastWidth": 0,
            "lastHeight": 0
        };

        // we need a place to store info for column reorder
        element.internalReorder = {
            "currentlyReordering": false,
            "reorderStarted": false,
            "currentColumns": [],
            "dropLocation": 0,
            "scrollIntervalID": null,
            "scrollDirection": null,
            "scrolling": false,
            "originColumn": null
        };

        // we need a place to cache visibility information so that if we
        //      detect a change, we can trigger a re-render
        element.internalPollingCache = {
            "elementWidth": null,
            "elementHeight": null,
            "elementVisibility": null,
            "fontSize": null
        };

        // we want to know the cell dimensions so that we can make elements
        //      default and so that scrolling will reflect the correct
        //      dimensions, so we'll detect them here (and during scroll
        //      location renders)
        cellDimensionDetector(element);
    }

    // get a gs-table's templates and translate them for future templating
    function siphonElement(element) {
        var topHudTemplate;
        var bottomHudTemplate;
        var headerRecordTemplate;
        var dataRecordTemplate;
        var copyTemplate;
        var insertRecordTemplate;
        var insertDialogTemplate;
        var updateDialogTemplate;

        var strHTML;
        var arrColumnPlainTextNames;
        var arrColumnDataNames;
        var arrColumnElements;
        var columnElement;
        var intColumnWidth;
        var buttonElement;
        var i;
        var len;

        // get each template element and save them to each their own variable,
        //      for easy access
        topHudTemplate = xtag.queryChildren(
            element,
            '[for="top-hud"]'
        )[0];

        bottomHudTemplate = xtag.queryChildren(
            element,
            '[for="bottom-hud"]'
        )[0];

        headerRecordTemplate = xtag.queryChildren(
            element,
            '[for="header-record"]'
        )[0];

        dataRecordTemplate = xtag.queryChildren(
            element,
            '[for="data-record"]'
        )[0];

        copyTemplate = xtag.queryChildren(
            element,
            '[for="copy"]'
        )[0];

        insertRecordTemplate = xtag.queryChildren(
            element,
            '[for="insert-record"]'
        )[0];

        insertDialogTemplate = xtag.queryChildren(
            element,
            '[for="insert-dialog"]'
        )[0];

        updateDialogTemplate = xtag.queryChildren(
            element,
            '[for="update-dialog"]'
        )[0];

        // remove all templates from the dom to prevent reflows
        if (topHudTemplate) {
            //console.log(element, topHudTemplate);
            element.removeChild(topHudTemplate);
        }
        if (bottomHudTemplate) {
            element.removeChild(bottomHudTemplate);
        }
        if (headerRecordTemplate) {
            element.removeChild(headerRecordTemplate);
        }
        if (dataRecordTemplate) {
            element.removeChild(dataRecordTemplate);
        }
        if (copyTemplate) {
            element.removeChild(copyTemplate);
        }
        if (insertRecordTemplate) {
            element.removeChild(insertRecordTemplate);
        }
        if (insertDialogTemplate) {
            element.removeChild(insertDialogTemplate);
        }
        if (updateDialogTemplate) {
            element.removeChild(updateDialogTemplate);
        }

        if (
            topHudTemplate &&
            (
                topHudTemplate.innerHTML.indexOf('&gt;') > -1 ||
                topHudTemplate.innerHTML.indexOf('&lt;') > -1
            )
        ) {
            console.warn('GS-TABLE WARNING: &gt; or &lt; detected in ' +
                        'top HUD template, this can have undesired ' +
                        'effects on doT.js. Please use gt(x,y), gte(x,y), ' +
                        'lt(x,y), or lte(x,y) to silence this warning.');
        }
        if (
            bottomHudTemplate &&
            (
                bottomHudTemplate.innerHTML.indexOf('&gt;') > -1 ||
                bottomHudTemplate.innerHTML.indexOf('&lt;') > -1
            )
        ) {
            console.warn('GS-TABLE WARNING: &gt; or &lt; detected in ' +
                        'bottom HUD template, this can have undesired ' +
                        'effects on doT.js. Please use gt(x,y), gte(x,y), ' +
                        'lt(x,y), or lte(x,y) to silence this warning.');
        }
        if (
            headerRecordTemplate &&
            (
                headerRecordTemplate.innerHTML.indexOf('&gt;') > -1 ||
                headerRecordTemplate.innerHTML.indexOf('&lt;') > -1
            )
        ) {
            console.warn('GS-TABLE WARNING: &gt; or &lt; detected in ' +
                        'header record template, this can have undesired ' +
                        'effects on doT.js. Please use gt(x,y), gte(x,y), ' +
                        'lt(x,y), or lte(x,y) to silence this warning.');
        }
        if (
            dataRecordTemplate &&
            (
                dataRecordTemplate.innerHTML.indexOf('&gt;') > -1 ||
                dataRecordTemplate.innerHTML.indexOf('&lt;') > -1
            )
        ) {
            console.warn('GS-TABLE WARNING: &gt; or &lt; detected in ' +
                        'data record template, this can have undesired ' +
                        'effects on doT.js. Please use gt(x,y), gte(x,y), ' +
                        'lt(x,y), or lte(x,y) to silence this warning.');
        }
        if (
            copyTemplate &&
            (
                copyTemplate.innerHTML.indexOf('&gt;') > -1 ||
                copyTemplate.innerHTML.indexOf('&lt;') > -1
            )
        ) {
            console.warn('GS-TABLE WARNING: &gt; or &lt; detected in ' +
                        'copy template, this can have undesired ' +
                        'effects on doT.js. Please use gt(x,y), gte(x,y), ' +
                        'lt(x,y), or lte(x,y) to silence this warning.');
        }
        if (
            insertRecordTemplate &&
            (
                insertRecordTemplate.innerHTML.indexOf('&gt;') > -1 ||
                insertRecordTemplate.innerHTML.indexOf('&lt;') > -1
            )
        ) {
            console.warn('GS-TABLE WARNING: &gt; or &lt; detected in ' +
                        'insert record template, this can have undesired ' +
                        'effects on doT.js. Please use gt(x,y), gte(x,y), ' +
                        'lt(x,y), or lte(x,y) to silence this warning.');
        }
        if (
            insertDialogTemplate &&
            (
                insertDialogTemplate.innerHTML.indexOf('&gt;') > -1 ||
                insertDialogTemplate.innerHTML.indexOf('&lt;') > -1
            )
        ) {
            console.warn('GS-TABLE WARNING: &gt; or &lt; detected in ' +
                        'insert dialog template, this can have undesired ' +
                        'effects on doT.js. Please use gt(x,y), gte(x,y), ' +
                        'lt(x,y), or lte(x,y) to silence this warning.');
        }
        if (
            updateDialogTemplate &&
            (
                updateDialogTemplate.innerHTML.indexOf('&gt;') > -1 ||
                updateDialogTemplate.innerHTML.indexOf('&lt;') > -1
            )
        ) {
            console.warn('GS-TABLE WARNING: &gt; or &lt; detected in ' +
                        'update dialog template, this can have undesired ' +
                        'effects on doT.js. Please use gt(x,y), gte(x,y), ' +
                        'lt(x,y), or lte(x,y) to silence this warning.');
        }

        // if there's no "data-record" template: error
        if (!dataRecordTemplate) {
            throw 'GS-TABLE Error: no "data-record" template found. ' +
                    'The "data-record" must be a immediate child in ' +
                    'order to be found.';
        }

        // if there's no "data-record" template: error
        if (!copyTemplate) {
            console.warn('GS-TABLE Warning: no "copy" template found. ' +
                    'The "copy" template enables copying a selection ' +
                    'from the gs-table. The "copy" template must be a ' +
                    'immediate child in order to be found.');
        }

        // get column widths
        if (
            headerRecordTemplate ||
            dataRecordTemplate ||
            insertRecordTemplate
        ) {
            if (headerRecordTemplate) {
                arrColumnElements = xtag.query(
                    headerRecordTemplate.content,
                    'gs-cell'
                );
            } else if (dataRecordTemplate) {
                arrColumnElements = xtag.query(
                    dataRecordTemplate.content,
                    'gs-cell'
                );
            } else if (insertRecordTemplate) {
                arrColumnElements = xtag.query(
                    insertRecordTemplate.content,
                    'gs-cell'
                );
            }

            i = 0;
            len = arrColumnElements.length;
            intColumnWidth = (
                parseInt(element.getAttribute('default-column-width'), 10) ||
                intDefaultColumnWidth
            );
            while (i < len) {
                element.internalDisplay.columnWidths.push(
                    parseInt(arrColumnElements[i].style.width, 10) ||
                    intColumnWidth
                );

                // we need to be able to restore the column widths after the
                //      user resizes them, so this array contains the column
                //      widths and cannot be updated by column resizing
                element.internalDisplay.defaultColumnWidths.push(
                    parseInt(arrColumnElements[i].style.width, 10) ||
                    intColumnWidth
                );

                // if there is a width, remove it. we do this because the width
                //      is added dynamically when the header is rendered. if
                //      someone resizes a cell, we need to set the width with
                //      the new value
                if (arrColumnElements[i].style.width) {
                    arrColumnElements[i].style.width = '';
                }

                i += 1;
            }
        }

        // get header height
        if (headerRecordTemplate) {
            arrColumnElements = xtag.query(
                headerRecordTemplate.content,
                'gs-cell'
            );

            i = 0;
            len = arrColumnElements.length;
            while (i < len) {
                // if we run into a column with a height defined, use that
                //      height for the header height and break out of the loop
                if (arrColumnElements[i].style.height) {
                    element.internalDisplay.headerHeight = (
                        parseInt(arrColumnElements[i].style.height, 10)
                    );
                }
                i += 1;
            }

            // default
            if (element.internalDisplay.headerHeight === undefined) {
                element.internalDisplay.headerHeight = (
                    element.internalDisplay.defaultHeaderHeight
                );
            }
        }

        // get insert record height
        if (insertRecordTemplate) {
            arrColumnElements = xtag.query(
                insertRecordTemplate.content,
                'gs-cell'
            );

            i = 0;
            len = arrColumnElements.length;
            while (i < len) {
                // if we run into a column with a height defined, use that
                //      height for the header height and break out of the loop
                if (arrColumnElements[i].style.height) {
                    element.internalDisplay.insertRecordHeight = (
                        parseInt(arrColumnElements[i].style.height, 10)
                    );
                }
                i += 1;
            }

            // default to 27 pixels
            if (element.internalDisplay.insertRecordHeight === undefined) {
                element.internalDisplay.insertRecordHeight = (
                    element.internalDisplay.defaultInsertRecordHeight
                );
            }
        }

        // get plain text column names
        arrColumnPlainTextNames = [];

        // if there is a copy template and we still haven't found
        //      plain text column names
        if (
            copyTemplate && (
                arrColumnPlainTextNames.length === 0 ||
                arrColumnPlainTextNames.indexOf(null) !== -1
            )
        ) {
            arrColumnElements = xtag.query(
                copyTemplate.content,
                'gs-cell'
            );

            i = 0;
            len = arrColumnElements.length;
            while (i < len) {
                if (!arrColumnPlainTextNames[i]) {
                    arrColumnPlainTextNames[i] = (
                        // if there's no header attribute, we'll set the
                        //      column name to null
                        arrColumnElements[i].getAttribute('header')
                    );
                }
                i += 1;
            }
        }

        // if there is a record template and we still haven't found
        //      plain text column names
        if (
            dataRecordTemplate && (
                arrColumnPlainTextNames.length === 0 ||
                arrColumnPlainTextNames.indexOf(null) !== -1
            )
        ) {
            arrColumnElements = xtag.query(
                dataRecordTemplate.content,
                'gs-cell'
            );

            i = 0;
            len = arrColumnElements.length;
            while (i < len) {
                if (!arrColumnPlainTextNames[i]) {
                    arrColumnPlainTextNames[i] = (
                        // if there's no header attribute, we'll set the
                        //      column name to null
                        arrColumnElements[i].getAttribute('header')
                    );
                }
                i += 1;
            }
        }

        // if there is an insert record template and we still haven't
        //      found plain text column names
        if (
            insertRecordTemplate && (
                arrColumnPlainTextNames.length === 0 ||
                arrColumnPlainTextNames.indexOf(null) !== -1
            )
        ) {
            arrColumnElements = xtag.query(
                insertRecordTemplate.content,
                'gs-cell'
            );

            i = 0;
            len = arrColumnElements.length;
            while (i < len) {
                if (!arrColumnPlainTextNames[i]) {
                    arrColumnPlainTextNames[i] = (
                        // if there's no header attribute, we'll set the
                        //      column name to null
                        arrColumnElements[i].getAttribute('header')
                    );
                }
                i += 1;
            }
        }

        // if there is a header template and we still haven't found
        //      plain text column names
        if (
            headerRecordTemplate && (
                arrColumnPlainTextNames.length === 0 ||
                arrColumnPlainTextNames.indexOf(null) !== -1
            )
        ) {
            arrColumnElements = xtag.query(
                headerRecordTemplate.content,
                'gs-cell'
            );

            i = 0;
            len = arrColumnElements.length;
            while (i < len) {
                if (!arrColumnPlainTextNames[i]) {
                    arrColumnPlainTextNames[i] = (
                        // if there's no text, we'll set the
                        //      column name to null
                        arrColumnElements[i].textContent.trim() || null
                    );
                }
                i += 1;
            }
        }

        // store plain text column names for future use
        element.internalDisplay.columnPlainTextNames = arrColumnPlainTextNames;



        // we need to associate the display columns with their associated data
        //      columns
        arrColumnDataNames = [];

        // if there is an insert record template and we still haven't
        //      all of the found data column associations
        if (
            insertRecordTemplate && (
                arrColumnDataNames.length === 0 ||
                arrColumnDataNames.indexOf(null) !== -1
            )
        ) {
            arrColumnElements = xtag.query(
                insertRecordTemplate.content,
                'gs-cell'
            );

            i = 0;
            len = arrColumnElements.length;
            while (i < len) {
                if (!arrColumnDataNames[i]) {
                    columnElement = xtag.query(
                        arrColumnElements[i],
                        '[column]'
                    )[0];

                    if (columnElement) {
                        arrColumnDataNames[i] = (
                            // if there's no column attribute, we'll set the
                            //      column name to null
                            columnElement.getAttribute('column')
                        );
                    } else {
                        arrColumnDataNames[i] = null;
                    }
                }
                i += 1;
            }
        }

        // if there is an insert record template and we still haven't
        //      all of the found data column associations
        if (
            dataRecordTemplate && (
                arrColumnDataNames.length === 0 ||
                arrColumnDataNames.indexOf(null) !== -1
            )
        ) {
            arrColumnElements = xtag.query(
                dataRecordTemplate.content,
                'gs-cell'
            );

            i = 0;
            len = arrColumnElements.length;
            while (i < len) {
                if (!arrColumnDataNames[i]) {
                    columnElement = xtag.query(
                        arrColumnElements[i],
                        '[column]'
                    )[0];

                    if (columnElement) {
                        arrColumnDataNames[i] = (
                            // if there's no column attribute, we'll set the
                            //      column name to null
                            columnElement.getAttribute('column')
                        );
                    } else {
                        arrColumnDataNames[i] = null;
                    }
                }
                i += 1;
            }
        }

        // store our associations internally
        element.internalDisplay.dataColumnName = arrColumnDataNames;

        // if present, siphon "top-hud" template
        if (topHudTemplate) {
            element.internalTemplates.topHUD = topHudTemplate.innerHTML;
        }

        // if present, siphon "bottom-hud" template
        if (bottomHudTemplate) {
            element.internalTemplates.bottomHUD = bottomHudTemplate.innerHTML;
        }

        // the header template (if there is one) needs dropdown buttons for
        //      the column dropdown
        if (headerRecordTemplate) {
            // create the button element so we can clone it
            buttonElement = document.createElement('div');

            // loop through cells and append buttons
            arrColumnElements = xtag.query(
                headerRecordTemplate.content,
                'gs-cell'
            );
            i = 0;
            len = arrColumnElements.length;
            while (i < len) {
                // a column only get's a column button if there is a data
                //      column associated with that column
                if (arrColumnDataNames[i]) {
                    buttonElement.setAttribute(
                        'class',
                        'header-button ' +
                                '$$HDRBTNCLASS_' + arrColumnDataNames[i] + '$$'
                    );

                    arrColumnElements[i].classList.add('right-button');
                    arrColumnElements[i].appendChild(
                        buttonElement.cloneNode(true)
                    );
                }
                i += 1;
            }
        }

        // if a display column is associated with a data column, we want
        //      to have sort and filter related info in the tooltip
        if (headerRecordTemplate) {
            // loop through header cells and add tokens to the title
            //      attributes
            arrColumnElements = xtag.query(
                headerRecordTemplate.content,
                'gs-cell'
            );
            i = 0;
            len = arrColumnElements.length;
            while (i < len) {
                // a column only get's a column button if there is a data
                //      column associated with that column
                if (arrColumnDataNames[i]) {
                    arrColumnElements[i].setAttribute(
                        'title',
                        '$$HDR_TITLE_' + arrColumnDataNames[i] + '$$'
                    );
                }
                i += 1;
            }
        }

        // if there is a header template, get column min widths
        if (headerRecordTemplate) {
            arrColumnElements = xtag.query(
                headerRecordTemplate.content,
                'gs-cell'
            );

            i = 0;
            len = arrColumnElements.length;
            while (i < len) {
                // all of these values are tested in the test header
                //      element, this element is in a different location
                //      so the CSS that the user sets may not apply to
                //      it. we need to transition to a temporary cell
                //      element in the viewport
                // ### NEED CODING ###

                // get text width using test header element
                element.elems.testHeader.innerHTML = (
                    arrColumnElements[i].innerHTML
                );

                intColumnWidth = (
                    //GS.getTextWidth(
                    //    element.elems.testHeader,
                    //    arrColumnElements[i].textContent,
                    //    true // preserve whitespace
                    //) +

                    element.elems.testHeader.offsetWidth +
                    // for some reason, a few pixels are missing
                    3
                );

                element.elems.testHeader.innerHTML = '';

                //console.log(arrColumnElements[i].textContent);

                // if there is a data column associated, we need to
                //      add the width of the header button
                if (arrColumnDataNames[i]) {
                    intColumnWidth += (
                        // em value is hard coded for now
                        GS.emToPx(element.elems.testHeader, 1.25)
                    );
                }

                //console.log(intColumnWidth);

                element.internalDisplay.minColumnWidths.push(
                    intColumnWidth
                );

                //console.log(
                //    intColumnWidth,
                //    element.internalDisplay.columnWidths[i]
                //);
                if (
                    intColumnWidth >
                        element.internalDisplay.columnWidths[i]
                ) {
                    element.internalDisplay.columnWidths[i] = (
                        intColumnWidth
                    );
                }

                i += 1;
            }
        }


        // if present, siphon "header-record" template
        if (headerRecordTemplate) {
            // commented out because we no longer put the styling on the cell
            //// append a token to the end of the style attribute of each
            ////      gs-cell (so that we can dynamically add CSS definitions)
            //templateCellAddStyleToken(headerRecordTemplate);

            // add a class of "table-header" to each gs-cell for styling
            templateCellAddClass(headerRecordTemplate, 'table-header');

            // add column numbers to the header cells so that we can target
            //      these cells using column precision
            templateCellAddColumnNumber(headerRecordTemplate);

            // save the template
            element.internalTemplates.header = (
                headerRecordTemplate.innerHTML.trim()
            );

            //// remove the template element now that it's been siphoned
            //element.removeChild(headerRecordTemplate);
        }

        // if present, siphon "data-record" template
        if (dataRecordTemplate) {
            // commented out because we no longer put the styling on the cell
            //// append a token to the end of the style attribute of each
            ////      gs-cell (so that we can dynamically add CSS definitions)
            //templateCellAddStyleToken(dataRecordTemplate);

            // add a class of "table-cell" to each gs-cell for styling
            templateCellAddClass(dataRecordTemplate, 'table-cell');

            // add column numbers to the record cells so that we can target
            //      these cells using column precision
            templateCellAddColumnNumber(dataRecordTemplate);

            // add a record number attribute on each of the cells so that we can
            //      target specific records for deletion, rerender, movement
            //      etc...
            templateCellAddRowNumber(dataRecordTemplate);

            // save the template
            strHTML = GS.templateColumnToValue(
                dataRecordTemplate.innerHTML.trim()
            );

            // let's save the original record template text so that we can
            //      modify it in the future
            element.internalTemplates.originalRecord = strHTML;

            // we're going run the record template through a function to
            //      turn all of the "column" attributes into "value" attributes
            //      with the proper templating
            element.internalTemplates.record = (
                GS.templateHideSubTemplates(strHTML, false)
            );

            //// remove the template element now that it's been siphoned
            //element.removeChild(dataRecordTemplate);
        }

        // if present, siphon "copy" template
        if (copyTemplate) {
            // we want to save the copy template so that we'll always have
            //      access to it's original innerHTML (right now, only for
            //      debugging purposes)
            element.internalTemplates.copy = (
                copyTemplate.innerHTML
            );

            // determine the record copy columns from the "copy" template
            //      so that we can use them when we copy and we need to get data
            templateDetermineCopyColumnList(element, copyTemplate);

            // determine the copy headers from the "copy" template so
            //      that we can use them for when we copy and we need to use
            //      the headers
            templateDetermineCopyHeaderList(element, copyTemplate);

            //// remove the template element now that it's been siphoned
            //element.removeChild(copyTemplate);
        }

        // if present, siphon "insert-record" template
        if (insertRecordTemplate) {
            // commented out because we no longer put the styling on the cell
            //// append a token to the end of the style attribute of each
            ////      gs-cell (so that we can dynamically add CSS definitions)
            //templateCellAddStyleToken(insertRecordTemplate);

            // add a class of "table-insert" to each gs-cell for styling
            templateCellAddClass(insertRecordTemplate, 'table-insert');

            // add column numbers to the insert cells so that we can target
            //      these cells using column precision
            templateCellAddColumnNumber(insertRecordTemplate);

            // add row attributes so that the javascript can look at the cell
            //      and determine that it's an "insert" type cell
            templateCellAddRowNumber(insertRecordTemplate, 'insert');

            // save the template
            element.internalTemplates.insertRecord = (
                insertRecordTemplate.innerHTML.trim()
            );

            //// remove the template element now that it's been siphoned
            //element.removeChild(insertRecordTemplate);
        }

        // if present, siphon "insert-dialog" template
        if (insertDialogTemplate) {
            element.internalTemplates.insertDialog = (
                insertDialogTemplate.innerHTML.trim()
            );

            // remove the template element now that it's been siphoned
            element.removeChild(insertDialogTemplate);
        }

        // if present, siphon "update-dialog" template
        if (updateDialogTemplate) {
            // save the template
            strHTML = GS.templateColumnToValue(
                updateDialogTemplate.innerHTML.trim()
            );

            // let's save the original dialog template text so that we can
            //      modify it in the future
            element.internalTemplates.originalUpdateDialog = strHTML;

            // we're going run the dialog template through a function to
            //      turn all of the "column" attributes into "value" attributes
            //      with the proper templating
            element.internalTemplates.updateDialog = (
                GS.templateHideSubTemplates(strHTML, false)
            );

            //// remove the template element now that it's been siphoned
            //element.removeChild(updateDialogTemplate);
        }
    }

    // we need to use a web worker so that we can move processor expensive
    //      operations to another thread so that we dont freeze the UI
    function createWebWorker(element) {
        //var waitingFunction;
        //var handlerFunction;

        //// if no web worker support: throw error so that the developer knows
        ////      that the gs-table element requires web workers
        //if (window.Worker === undefined) {
        //    throw 'GS-TABLE Error: Web Workers are not supported by this ' +
        //            'browser. The GS-TABLE element requires the use of a ' +
        //            'Web Worker.';
        //}

        //// get web worker and store it
        //element.internalWorker.worker = new Worker('worker-gs-table.js');

        //// this function listens to the web worker after the web worker has
        ////      given the signal that it's ready
        //handlerFunction = function (event) {
        //    var jsnMessage = event.data;
        //    //console.log('handler received', jsnMessage);
        //};

        //// this function listens to the web worker until the worker gives the
        ////      signal that it's ready for use
        //waitingFunction = function (event) {
        //    var jsnMessage = event.data;
        //    //console.log('handler received', jsnMessage);

        //    if (jsnMessage.content === 'ready') {
                //// mark the worker as ready so that any code that can only run
                ////      while the worker is ready will now be able to run
                //element.internalWorker.ready = true;

                //// re-bind worker lister to the main listener code
                //element.internalWorker.worker.onmessage = handlerFunction;

        // run first select now that the worker is ready
        dataSELECT(element);

                ////console.log('worker ready');
        //    }
        //};

        ////element.internalWorker.worker.postMessage({"first": value});

        //// bind web worker message event so that we can begin using the worker
        //element.internalWorker.worker.onmessage = waitingFunction;
    }

// ############################################################################
// ############################## COPY FUNCTIONS ##############################
// ############################################################################

    // there are multiple places where we need to get the copy parameters, so
    //      we use this function so that we can have things like defaults and
    //      we don't need to update multiple sections of code to keep things in
    //      sync
    function getCopyParameters(element) {
        var headerMode;
        var selectorMode;
        var quoteChar;
        var escapeChar;
        var quoteMode;
        var recordDelimiter;
        var cellDelimiter;
        var nullString;

        // we need the user to be able to override the copy parameters so that
        //      they can format the copy in the way they need
        // if the attribute is present for a parameter, fill the variable with
        //      the attribute (and default to empty string) else default to
        //      parameter default
        if (element.getAttribute('copy-header')) {
            headerMode = element.getAttribute('copy-header') || '';
        } else {
            headerMode = 'selected';
        }
        if (element.getAttribute('copy-selectors')) {
            selectorMode = element.getAttribute('copy-selectors') || '';
        } else {
            selectorMode = 'selected';
        }
        if (element.getAttribute('copy-quote-char')) {
            quoteChar = element.getAttribute('copy-quote-char') || '';
        } else {
            quoteChar = '"';
        }
        if (element.getAttribute('copy-escape-char')) {
            escapeChar = element.getAttribute('copy-escape-char') || '';
        } else {
            escapeChar = quoteChar;
        }
        if (element.getAttribute('copy-quote-when')) {
            quoteMode = element.getAttribute('copy-quote-when') || '';
        } else {
            quoteMode = 'delimiter-in-content';
        }
        if (element.getAttribute('copy-delimiter-record')) {
            recordDelimiter =
                    element.getAttribute('copy-delimiter-record') || '';
        } else {
            recordDelimiter = '\n';
        }
        if (element.getAttribute('copy-delimiter-cell')) {
            cellDelimiter = element.getAttribute('copy-delimiter-cell') || '';
        } else {
            cellDelimiter = '\t';
        }
        if (element.getAttribute('copy-null-cell')) {
            nullString = element.getAttribute('copy-null-cell') || '';
        } else {
            nullString = '';
        }

        // we need to return multiple variables but return only allows one
        //      return value, so we'll return in JSON
        return {
            "headerMode": headerMode,
            "selectorMode": selectorMode,
            "quoteChar": quoteChar,
            "escapeChar": escapeChar,
            "quoteMode": quoteMode,
            "recordDelimiter": recordDelimiter,
            "cellDelimiter": cellDelimiter,
            "nullString": nullString
        };
    }

    // we need to know that we're working with valid copy attributes, so
    //      we use this function to throw an error if there is an invalid
    //      copy attribute
    // this function returns the copy parameters in JSON format if they
    //      are all valid
    function validateCopyParameters(element) {
        var jsnCopyParameters;

        // we need the user to be able to override the copy parameters so that
        //      they can format the copy in the way they need so here, we gather
        //      the copy parameters
        jsnCopyParameters = getCopyParameters(element);

        // we need to verify that the copy parameters are valid
        //console.log('headerMode:      ', jsnCopyParameters.headerMode);
        //console.log('selectorMode:    ', jsnCopyParameters.selectorMode);
        //console.log('quoteChar:       ', jsnCopyParameters.quoteChar);
        //console.log('escapeChar:      ', jsnCopyParameters.escapeChar);
        //console.log('quoteMode:       ', jsnCopyParameters.quoteMode);
        //console.log('recordDelimiter: ', jsnCopyParameters.recordDelimiter);
        //console.log('cellDelimiter:   ', jsnCopyParameters.cellDelimiter);
        //console.log('nullString:      ', jsnCopyParameters.nullString);

        //copy-header: always|never|selected
        if (
            !(/^(always|never|selected)$/gi)
                .test(jsnCopyParameters.headerMode)
        ) {
            throw 'GS-TABLE Error: Copy parameter "copy-header" invalid, ' +
                    'valid values are "always", "never" or "selected" ';
        }
        //copy-selectors: always|never|selected
        if (
            !(/^(always|never|selected)$/gi)
                .test(jsnCopyParameters.selectorMode)
        ) {
            throw 'GS-TABLE Error: Copy parameter "copy-selectors" invalid, ' +
                    'valid values are "always", "never" or "selected" ';
        }
        //copy-quote-when: never|strings|always|delimiter-in-content
        if (
            !(/^(never|strings|always|delimiter-in-content)$/gi)
                .test(jsnCopyParameters.quoteMode)
        ) {
            throw 'GS-TABLE Error: Copy parameter "copy-quote-when" invalid, ' +
                    'valid values are "never", "strings", "always" or ' +
                    '"delimiter-in-content".';
        }
        //copy-delimiter-record: not empty
        if (jsnCopyParameters.recordDelimiter.length === 0) {
            throw 'GS-TABLE Error: Copy parameter "copy-delimiter-record" ' +
                    'cannot be empty.';
        }
        //copy-delimiter-cell: not empty
        if (jsnCopyParameters.cellDelimiter.length === 0) {
            throw 'GS-TABLE Error: Copy parameter "copy-delimiter-cell" ' +
                    'cannot be empty.';
        }

        // this function gets the copy parameters on it's own, so if a function
        //      were to call this function, we wouldn't want to have to re-get
        //      the copy parameters in that function, so we return the copy
        //      parameters
        return jsnCopyParameters;
    }

    // we need to be able to override the clipbard for specific mime types on a
    //      copy event, this function accepts the copy event, the copy string
    //      and the mime type to override
    function handleClipboardData(event, strCopyString, strType) {
        var clipboardData = event.clipboardData || window.clipboardData;
        var strMime;

        if (!clipboardData) {
            return;
        }
        if (!clipboardData.setData) {
            return;
        }

        if (strType === 'text') {
            if (window.clipboardData && window.clipboardData.getData) { // IE
                strMime = 'Text';
            } else if (event.clipboardData && event.clipboardData.getData) {
                strMime = 'text/plain';
            }
        } else if (strType === 'html') {
            if (window.clipboardData && window.clipboardData.getData) { // IE
                strMime = '';
            } else if (event.clipboardData && event.clipboardData.getData) {
                strMime = 'text/html';
            }
        } else {
            throw 'handleClipboardData Error: Type "' + strType + '" not ' +
                    'recognized, recognized types are "text" and "html".';
        }

        if (strMime) {
            if (strCopyString && strMime) {
                return clipboardData.setData(strMime, strCopyString) !== false;
            } else {
                return clipboardData.getData(strMime);
            }
        }
    }

    function getCopyStrings(element) {
        var strTextCopyString;
        var strHTMLCopyString;
        var strHTMLRecordCopyString;
        var row_i;
        var row_len;
        var col_i;
        var col_len;
        var cell;
        var row;
        var char;
        var record_i;
        var record_len;
        var cell_i;

        var jsnCopyParameters;
        var quoteChar;
        var escapeChar;
        var quoteMode;
        var selectorMode;
        var headerMode;
        var recordDelimiter;
        var cellDelimiter;
        var nullString;

        var arrColumns;
        var arrRows;
        var bolHeader;
        var bolSelector;
        var arrHeaders;
        var arrColumnTemplates;
        var arrColumnNames;
        var arrSelection;
        var intRow;
        var intCol;
        var intSel;

        var handleCell;
        var jsnQS;
        var jsnRow;
        var arrRow;
        var strRow;
        var strHeader;

        var arrSelectedStates = ['B', 'D', 'F', 'H', 'J', 'L'];

        var cell_len;
        var delim;

        // define the text copy string as empty string so that we can just
        //      append to it without causing an issue where "undefined" is
        //      at the beginning of the string
        strTextCopyString = '';

        // define the HTML copy string as a beginning table tag, so that
        //      we only have to append to the string
        strHTMLCopyString =
                '<' + 'style>' +
                'br { mso-data-placement:same-cell; } ' +
                'th, td { white-space: pre-wrap; }' +
                '<' + '/style>' +
                '<' + 'table border="0" cellpadding="0" cellspacing="0">';

        strHTMLRecordCopyString = '';

        // cache copy column template stringss for speed
        arrColumnTemplates = element.internalClip.columnList.slice(0);

        // convert the column template strings into dot.js functions for speed
        col_i = 0;
        col_len = arrColumnTemplates.length;
        while (col_i < col_len) {
            arrColumnTemplates[col_i] =
                    '{{ var qs = jo.qs' +
                    ', row = jo.row' +
                    ', arrRow = jo.arrRow' +
                    ', i = jo.i' +
                    ', len = jo.len; }}' +
                    arrColumnTemplates[col_i];

            arrColumnTemplates[col_i] = doT.template(
                arrColumnTemplates[col_i]
            );

            col_i += 1;
        }

        // we need the user to be able to override the copy parameters so that
        //      they can format the copy in the way they need so here, we gather
        //      the copy parameters
        jsnCopyParameters = getCopyParameters(element);
        quoteChar = jsnCopyParameters.quoteChar;
        escapeChar = jsnCopyParameters.escapeChar;
        quoteMode = jsnCopyParameters.quoteMode;
        selectorMode = jsnCopyParameters.selectorMode;
        headerMode = jsnCopyParameters.headerMode;
        recordDelimiter = jsnCopyParameters.recordDelimiter;
        cellDelimiter = jsnCopyParameters.cellDelimiter;
        nullString = jsnCopyParameters.nullString;

        // we dont want to recalculate the Query String JSON once for every
        //      cell, so here we calculate it once (in JSON format)
        jsnQS = GS.qryToJSON(GS.getQueryString());

        // bring copy variables in for easy access
        arrColumnNames = element.internalData.columnNames;
        arrSelection = element.internalSelection.resolvedSelection.slice(0);
        arrColumns = element.internalSelection.columns.slice(0);
        arrRows = element.internalSelection.rows.slice(0);
        arrHeaders = element.internalClip.headerList.slice(0);

        // if the header is selected, remove it from the list and save it
        //  in another location
        if (
            (
                headerMode === 'selected' &&
                arrRows[0] === 'header'
            ) ||
            (
                headerMode === 'always'
            )
        ) {
            bolHeader = true;
        }
        if (arrRows[0] === 'header') {
            arrRows.shift();
        }
        if (element.internalDisplay.headerVisible) {
            strHeader = arrSelection[0]; //.shift();
        }

        // if a selector is selected and we don't copy those, remove it from
        //      the list
        if (
            (
                selectorMode === 'selected' &&
                arrColumns[0] === 'selector'
            ) ||
            (
                selectorMode === 'always'
            )
        ) {
            bolSelector = true;
        }
        if (arrColumns[0] === 'selector') {
            arrColumns.shift();
        }

        // if the insert record is selected, remove it from the list
        if (arrRows[arrRows.length - 1] === 'insert') {
            arrRows.pop();
        }

        // convert the header template strings into dot.js functions for speed
        col_i = 0;
        col_len = arrHeaders.length;
        while (col_i < col_len) {
            arrHeaders[col_i] = doT.template(
                '{{ var qs = jo.qs; }}' +
                arrHeaders[col_i]
            );
            col_i += 1;
        }

        //console.log(
        //    arrColumns,
        //    arrRows
        //);

        // to handle different quoting policies, we define the "handleCell"
        //      function differently depending on the "quoteMode" variable
        // the "handleCell" function handles quoting, querystring template
        //      and row templating
        // defining the "handleCell" function conditionally is going to make
        //      the "handleCell" function faster because it doesn't have to
        //      recalculate the quote policy once fo reach cell
        //copy-quote-when: never|strings|always|delimiter-in-content
        if (quoteMode === 'never') {
            // no quoting,
            //      template cell with querystring and row
            //      append cell to strTextCopyString
            handleCell = function (cellTemplate, i, len, jsnRow, arrRow) {
                // template cell with querystring and row
                var strCell = cellTemplate({
                    'qs': jsnQS,
                    'row': jsnRow,
                    'arrRow': arrRow,
                    'i': i,
                    'len': len
                });

                // append cell to the HTML copy string
                strHTMLRecordCopyString +=
                        '<' + 'td rowspan="1" colspan="1">' +
                        strCell +
                        '</td>';

                // append cell to the text copy string
                strTextCopyString += strCell;
            };
        } else if (quoteMode === 'strings') {
            // string quoting,
            //      template cell with querystring and row
            //      if escapeChar !== quoteChar: double up every escapeChar
            //      put an escapeChar behind every quoteChar
            //      if NaN: wrap cell with quoteChar
            //      append cell to strTextCopyString
            handleCell = function (cellTemplate, i, len, jsnRow, arrRow) {
                // template cell with querystring and row
                var strCell = cellTemplate({
                    'qs': jsnQS,
                    'row': jsnRow,
                    'arrRow': arrRow,
                    'i': i,
                    'len': len
                });

                // before we do any quoting, we need to add the HTML to the
                //      HTML copy string
                strHTMLRecordCopyString +=
                        '<' + 'td rowspan="1" colspan="1">' +
                        strCell +
                        '</td>';

                // if escapeChar !== quoteChar: double up every escapeChar
                if (escapeChar !== quoteChar) {
                    strCell = stringReplaceAll(
                        strCell,
                        escapeChar,
                        escapeChar + escapeChar
                    );
                }

                // put an escapeChar behind every quoteChar
                strCell = stringReplaceAll(
                    strCell,
                    quoteChar,
                    escapeChar + quoteChar
                );

                // if NaN: wrap cell with quoteChar
                if (isNaN(strCell)) {
                    strCell = quoteChar + strCell + quoteChar;
                }

                // append cell to copy string
                strTextCopyString += strCell;
            };
        } else if (quoteMode === 'always') {
            // string quoting,
            //      template cell with querystring and row
            //      if escapeChar !== quoteChar: double up every escapeChar
            //      put an escapeChar behind every quoteChar
            //      wrap cell with quoteChar
            //      append cell to strTextCopyString
            handleCell = function (cellTemplate, i, len, jsnRow, arrRow) {
                // template cell with querystring and row
                var strCell = cellTemplate({
                    'qs': jsnQS,
                    'row': jsnRow,
                    'arrRow': arrRow,
                    'i': i,
                    'len': len
                });

                // before we do any quoting, we need to add the HTML to the
                //      HTML copy string
                strHTMLRecordCopyString +=
                        '<' + 'td rowspan="1" colspan="1">' +
                        strCell +
                        '</td>';

                // if escapeChar !== quoteChar: double up every escapeChar
                if (escapeChar !== quoteChar) {
                    strCell = stringReplaceAll(
                        strCell,
                        escapeChar,
                        escapeChar + escapeChar
                    );
                }

                // put an escapeChar behind every quoteChar
                strCell = stringReplaceAll(
                    strCell,
                    quoteChar,
                    escapeChar + quoteChar
                );

                // wrap cell with quoteChar
                strCell = quoteChar + strCell + quoteChar;

                // append cell to copy string
                strTextCopyString += strCell;
            };
        } else if (quoteMode === 'delimiter-in-content') {
            // string quoting,
            //      template cell with querystring and row
            //      if escapeChar !== quoteChar: double up every escapeChar
            //      if quoteChar inside cell
            //          put an escapeChar behind every quoteChar
            //          wrap cell with quoteChar
            //      append cell to strTextCopyString
            handleCell = function (cellTemplate, i, len, jsnRow, arrRow) {
                // template cell with querystring and row
                var strCell = cellTemplate({
                    'qs': jsnQS,
                    'row': jsnRow,
                    'arrRow': arrRow,
                    'i': i,
                    'len': len
                });

                // before we do any quoting, we need to add the HTML to the
                //      HTML copy string
                strHTMLRecordCopyString += (
                    '<' + 'td rowspan="1" colspan="1">' +
                    strCell +
                    '</td>'
                );

                // if escapeChar !== quoteChar: double up every escapeChar
                if (escapeChar !== quoteChar) {
                    strCell = stringReplaceAll(
                        strCell,
                        escapeChar,
                        escapeChar + escapeChar
                    );
                }

                // if quoteChar is inside cell
                if (strCell.indexOf(quoteChar) !== -1) {
                    // put an escapeChar behind every quoteChar
                    strCell = stringReplaceAll(
                        strCell,
                        quoteChar,
                        escapeChar + quoteChar
                    );

                    // wrap cell with quoteChar
                    strCell = quoteChar + strCell + quoteChar;
                }

                // append cell to copy string
                strTextCopyString += strCell;
            };
        }

        //console.log(
        //    bolHeader,
        //    bolSelector,
        //    strHeader,
        //    arrRows,
        //    arrColumns
        //);

        // if the header has selected cells, we need to build the header
        if (bolHeader && headerMode !== 'never') {
            // if there are selectors selected, because the header also
            //      has selected columns we need the all selector to fill
            //      in the space to the left of the header that's made
            //      when there are selectors present
            if (bolSelector && selectorMode !== 'never') {
                // if the "quoteMode" is "always": we need to add a pair
                //      of quotes where this extra cell is
                if (quoteMode === 'always') {
                    strTextCopyString += quoteChar + quoteChar;
                }

                // and finally, add the delimiter
                strTextCopyString += cellDelimiter;

                // add an empty cell to the HTML copy string to make room
                //      for the record selector column
                strHTMLRecordCopyString += (
                    '<td rowspan="1" colspan="1"></td>'
                );
            }

            //console.log(arrSelectedStates);
            //console.log(arrHeaders.slice(0));

            // loop to add the rest of the headers
            col_i = 0;
            col_len = arrColumns.length;
            while (col_i < col_len) {
                // we want to put a delimiter between each cell
                if (col_i > 0) {
                    strTextCopyString += cellDelimiter;
                }

                intSel = arrColumns[col_i];
                intCol = intSel;
                if (element.internalDisplay.recordSelectorVisible) {
                    intSel = (arrColumns[col_i] + 1);
                    intCol = (intSel - 1);
                }

                //console.log(
                //    col_i,
                //    intSel,
                //    intCol,
                //    strHeader[intSel],
                //    arrHeaders[intCol]
                //);

                // template, quote and append cell to copy string
                if (
                    headerMode === 'always' ||
                    arrSelectedStates.indexOf(strHeader[intSel]) > -1
                ) {
                    handleCell(arrHeaders[intCol], 0, 0);

                } else {
                    strHTMLRecordCopyString += (
                        '<' + 'td rowspan="1" colspan="1"></td>'
                    );

                    if (quoteMode === 'always') {
                        strTextCopyString += quoteChar + quoteChar;
                    }
                }

                col_i += 1;
            }

            // append record to HTML copy string, clear current record variable
            strHTMLCopyString += '<tr>' + strHTMLRecordCopyString + '</tr>';
            strHTMLRecordCopyString = '';

            // if there are records selected, we want to seperate the header
            //      and the first row using the record delimiter
            if (arrRows.length > 0) {
                strTextCopyString += recordDelimiter;
            }
        }

        // <br />
        //console.log(arrHeaders.slice(0));

        // we cache the number of columns because it doesn't change
        col_len = arrColumns.length;

        // we need to get the range
        row_i = 0;
        row_len = arrRows.length;

        // loop through the rows
        while (row_i < row_len) {
            intSel = arrRows[row_i];
            intRow = intSel;
            if (element.internalDisplay.headerVisible) {
                intSel = (arrRows[row_i] + 1);
                intRow = (intSel - 1);
            }

            // we need to know the selection status of this record
            row = arrSelection[intSel];

            // generate record JSON for template
            jsnRow = {};
            arrRow = [];
            strRow = element.internalData.records[intRow] + '\t';

            cell_i = 0;
            cell_len = 9999;
            while (cell_i < cell_len) {// remember, requires \t at
                                       //       the end of the record
                delim = strRow.indexOf('\t');
                cell = strRow.substring(0, delim);
                strRow = strRow.substring(delim + 1);

                //console.log(arrColumnNames[cell_i], cell);
                if (cell !== '' || strRow !== '') {
                    jsnRow[arrColumnNames[cell_i]] = (
                        GS.decodeFromTabDelimited(cell, nullString)
                    );
                    arrRow.push(jsnRow[arrColumnNames[cell_i]]);
                } else {
                    break;
                }

                cell_i += 1;
            }
            //console.log(jsnRow);
            //console.log(strRow);
            //console.log(arrRow);

            // version 1, broken: last cell has one char missing, replaced
            //      with faster solution
            //record_i = 0;
            //record_len = strRow.length;
            //cell_i = 0;
            //cell = "";
            //while (record_i < record_len) {
            //    char = strRow[record_i];

            //    if (char === "\t" || record_i === (record_len - 1)) {
            //        jsnRow[arrColumnNames[cell_i]] = (
            //            GS.decodeFromTabDelimited(cell, nullString)
            //        );

            //        cell = "";
            //        cell_i += 1;
            //    } else {
            //        cell += char;
            //    }
            //    record_i += 1;
            //}

            //console.log(
            //    row_i,
            //    intSel,
            //    intRow,
            //    strRow,
            //    jsnRow
            //);

            // if record selectors are allowed: add record number
            if (
                bolSelector &&
                (
                    selectorMode === 'always' ||
                    (
                        selectorMode === 'selected' &&
                        arrSelectedStates.indexOf(row[0]) > -1
                    )
                )
            ) {
                strTextCopyString += (intRow + 1);

                strHTMLRecordCopyString += (
                    '<td rowspan="1" colspan="1">' + (intRow + 1) + '</td>'
                );
            }

            // no matter if we copied the record selector or not,
            //      we need the delimiter if we are copying some
            //      selectors
            if (bolSelector && col_len > 0) {
                strTextCopyString += cellDelimiter;
            }

            col_i = 0;
            while (col_i < col_len) {
                // we want to put a delimiter between each cell
                if (col_i > 0) {
                    strTextCopyString += cellDelimiter;
                }

                intSel = arrColumns[col_i];
                intCol = intSel;
                if (element.internalDisplay.recordSelectorVisible) {
                    intSel = (arrColumns[col_i] + 1);
                    intCol = (intSel - 1);
                }

                //console.log(
                //    col_i,
                //    intSel,
                //    intCol,
                //    strHeader[intSel],
                //    arrHeaders[intCol]
                //);

                // template, quote and append cell to copy string
                if (arrSelectedStates.indexOf(row[intSel]) > -1) {
                    handleCell(
                        arrColumnTemplates[arrColumns[col_i]],
                        row_i,
                        row_len,
                        jsnRow,
                        arrRow
                    );

                } else {
                    strHTMLRecordCopyString += (
                        '<' + 'td rowspan="1" colspan="1"></td>'
                    );

                    if (quoteMode === 'always') {
                        strTextCopyString += quoteChar + quoteChar;
                    }
                }

                col_i += 1;
            }

            // append record to HTML copy string, clear current record variable
            strHTMLCopyString += '<tr>' + strHTMLRecordCopyString + '</tr>';
            strHTMLRecordCopyString = '';

            // add record delimiter (unless we're on the last record)
            if ((row_i + 1) < row_len) {
                strTextCopyString += recordDelimiter;
            }
            row_i += 1;
        }

        // add the ending table tag to the HTML copy string
        strHTMLCopyString += '</table>';

        // now we'll take our column and row arrays and convert them to a
        //      text MIME type copy string
        //console.log('arrColumns: ', arrColumns);
        //console.log('arrRows: ', arrRows);
        //console.log('arrSelection: ', arrSelection);
        //console.log('HTML:\n' + strHTMLCopyString);
        //console.log('TEXT:\n' + strTextCopyString);




//
//
//            // loop through columns and template
//            col_i = 0;
//            while (col_i < col_len) {
//                intCol = col_i;
//
//                // if record selectors are visible, we need to offset
//                //      where we look for the column select state
//                if (element.internalDisplay.recordSelectorVisible) {
//                    intCol = arrColumns[col_i] + 1;
//                }
//
//                // we want to put a delimiter between each cell NEEDS WORK
//                if (
//                    arrColumns[col_i - 1] !== 'selector' &&
//                    arrColumns[col_i - 1] !== undefined
//                ) {
//                    strTextCopyString += cellDelimiter;
//                }
//
//                // if this cell is selected: template, quote and
//                //      append cell to copy string
//                if (arrSelectedStates.indexOf(row[intCol]) > -1) {
//                    handleCell(
//                        arrColumnTemplates[arrColumns[col_i]],
//                        row_i,
//                        row_len,
//                        jsnRow
//                    );
//                }
//
//                col_i += 1;
//            }
//
//        //console.log(strTextCopyString);

        return {
            "text": strTextCopyString,
            "html": strHTMLCopyString
        };
    }

// ############################################################################
// ############################# RENDER FUNCTIONS #############################
// ############################################################################

    function updateHUD(element) {
        var arrDataColumns;
        var sortASCButton;
        var sortDESCButton;
        var sortClearButton;
        var statusElement;
        var intOriginRecord;

        // I don't know who put this here but it wasn't commented. If you put
        //      this here: explain yourself. This is the HUD button status
        //      updating function, this has nothing to do with selection.
        //      I suppose this function is called after a selection so someone
        //      thought they were being clever and decided that this was the
        //      place to trigger such an event. But, I should remind you that
        //      we have a selection render function that may have worked the
        //      same but would have been more consistent and clear.
        //  ~Michael
        GS.triggerEvent(element, 'selection_change');

        // disable/enable hud sorting buttons
        sortASCButton = findHudElement(element, 'button-sort-asc');
        sortDESCButton = findHudElement(element, 'button-sort-desc');
        sortClearButton = findHudElement(element, 'button-sort-clear');

        // we need an array of the selected data columns
        arrDataColumns = getSelectedDataColumns(element);

        //console.log(arrDataColumns);

        // if there are data columns selected, enable sort buttons
        if (arrDataColumns.length > 0) {
            if (sortASCButton) {
                sortASCButton.removeAttribute('disabled');
            }
            if (sortDESCButton) {
                sortDESCButton.removeAttribute('disabled');
            }
            if (sortClearButton) {
                sortClearButton.removeAttribute('disabled');
            }

        // else, no data columns selected, disable sort buttons
        } else {
            if (sortASCButton) {
                sortASCButton.setAttribute('disabled', '');
            }
            if (sortDESCButton) {
                sortDESCButton.setAttribute('disabled', '');
            }
            if (sortClearButton) {
                sortClearButton.setAttribute('disabled', '');
            }
        }
    }

    function renderSelection(element) {//<br />
        var bolHeaders;
        var bolSelectors;
        var bolInsert;
        var col_i;
        var col_len;
        var rec_i;
        var rec_len;
        var strRecord;
        var arrSelection;
        var range_i;
        var range_len;
        var range;
        var arrRanges;
        var arrColumnWidths;
        var rangeStartRow;
        var rangeStartColumn;
        var rangeEndRow;
        var rangeEndColumn;
        var intOriginRecord;
        var jsnSelectedToDeselected;
        var jsnDeselectedToSelected;
        var jsnTranslationMatrix;
        var intRecord;
        var intColumn;
        var intChar;
        var intHeaderIndex;
        var intSelectorIndex;
        var intInsertIndex;
        var jsnRange;
        var strCompareString;

        var arrElements;
        var i;
        var len;
        var cell;
        var strRow;
        var strCol;
        var intRow;
        var intCol;
        var arrSelectedStates;
        //var arrDeselectedStates;

        var arrColumns;
        var arrRows;
        var intMaxColumns;
        var arrSelectionRows;
        var arrSelectionCols;
        var pushValue;

        //console.time('selection total');

        // first, we should gather some helper variables.
        bolHeaders = (element.internalDisplay.headerVisible);
        bolSelectors = (!element.hasAttribute('no-record-selector'));
        bolInsert = (element.internalDisplay.insertRecordVisible);
        arrSelection = [];

        strCompareString = selectionArrayToString(
            element.internalSelection.ranges
        );

        // create the blank slate for the resolved selection
        //      Type:              Unselected:   Selected:
        //      HEADER CELL        A             B
        //      RECORD CELL        C             D
        //      INSERT CELL        E             F
        //      ALL SELECTOR       G             H
        //      RECORD SELECTOR    I             J
        //      INSERT SELECTOR    K             L
        arrSelectedStates = ['B', 'D', 'F', 'H', 'J', 'L'];
        //arrDeselectedStates = ['A', 'C', 'E', 'G', 'I', 'K'];

        if (strCompareString === element.internalSelection.rangeCache) {
            arrSelection = element.internalSelection.resolvedSelection;
            arrRanges = element.internalSelection.ranges;
            arrColumnWidths = element.internalDisplay.columnWidths;
            arrRows = element.internalSelection.rows;
            arrColumns = element.internalSelection.columns;

            arrSelectionRows = element.internalSelection.rows.slice(0);
            rec_i = 0;
            rec_len = arrSelectionRows.length;
            while (rec_i < rec_len) {
                if (arrSelectionRows[rec_i] === 'header') {
                    arrSelectionRows[rec_i] = 0;
                } else if (arrSelectionRows[rec_i] === 'insert') {
                    arrSelectionRows[rec_i] = arrSelection.length - 1;
                } else {
                    arrSelectionRows[rec_i] += 1;
                }
                rec_i += 1;
            }

            arrSelectionCols = element.internalSelection.columns.slice(0);
            col_i = 0;
            col_len = arrSelectionCols.length;
            while (col_i < col_len) {
                if (arrSelectionCols[col_i] === 'selector') {
                    arrSelectionCols[col_i] = 0;
                } else {
                    arrSelectionCols[col_i] += 1;
                }
                col_i += 1;
            }

        } else {
            element.internalSelection.rangeCache = strCompareString;

            col_len = element.internalDisplay.columnWidths.length;

            if (bolHeaders) {
                strRecord = '';
                if (bolSelectors) {
                    strRecord += 'G';
                }

                col_i = 0;
                while (col_i < col_len) {
                    strRecord += 'A';
                    col_i += 1;
                }
                arrSelection.push(strRecord);
            }

            strRecord = '';
            if (bolSelectors) {
                strRecord = 'I';
            }

            col_i = 0;
            while (col_i < col_len) {
                strRecord += 'C';
                col_i += 1;
            }

            rec_i = 0;
            rec_len = element.internalData.records.length;
            while (rec_i < rec_len) {
                arrSelection.push(strRecord);
                rec_i += 1;
            }

            if (bolInsert) {
                strRecord = '';
                if (bolSelectors) {
                    strRecord += 'K';
                }

                col_i = 0;
                while (col_i < col_len) {
                    strRecord += 'E';
                    col_i += 1;
                }
                arrSelection.push(strRecord);
            }

            // console.log(arrSelection);

            // because of the vast array of column types, we'll (for simplicity
            //      and for brevity) use one of two matrices, a matrix that
            //      translates a selected cell to a deselected cell and one to
            //      do the opposite
            jsnSelectedToDeselected = {
                "A": "A",
                "B": "A",
                "C": "C",
                "D": "C",
                "E": "E",
                "F": "E",
                "G": "G",
                "H": "G",
                "I": "I",
                "J": "I",
                "K": "K",
                "L": "K"
            };
            jsnDeselectedToSelected = {
                "A": "B",
                "B": "B",
                "C": "D",
                "D": "D",
                "E": "F",
                "F": "F",
                "G": "H",
                "H": "H",
                "I": "J",
                "J": "J",
                "K": "L",
                "L": "L"
            };

            // because math is faster that string comparison, we need to convert
            //      the special values inside the ranges to numbers. but, we
            //      don't want to recalculate those numbers every time, so,
            //      we'll calculate them here and just reuse them
            intHeaderIndex = -1;
            intSelectorIndex = -1;
            intInsertIndex = (
                bolInsert
                    ? (arrSelection.length - 1)
                    : null
            );
            if (bolHeaders) {
                intInsertIndex -= 1;
            }

            //console.log(intInsertIndex);
            //console.time('selection resolve');

            // loop through each selection and flip the states of the
            //      affected cells
            arrRanges = element.internalSelection.ranges;
            arrColumnWidths = element.internalDisplay.columnWidths;
            range_i = 0;
            range_len = arrRanges.length;
            while (range_i < range_len) {
                range = arrRanges[range_i];

                // we want to copy the range element so that when we modify it
                //      we don't modify the original
                range = {
                    "start": {
                        "row": range.start.row,
                        "column": range.start.column
                    },
                    "end": {
                        "row": range.end.row,
                        "column": range.end.column
                    },
                    "negator": range.negator
                };

                //console.log(range);

                // gotta convert special values so that we can use math
                if (range.start.row === 'header') {
                    range.start.row = intHeaderIndex;
                } else if (range.start.row === 'insert') {
                    range.start.row = intInsertIndex;
                }
                if (range.end.row === 'header') {
                    range.end.row = intHeaderIndex;
                } else if (range.end.row === 'insert') {
                    range.end.row = intInsertIndex;
                }
                if (range.start.column === 'selector') {
                    range.start.column = intSelectorIndex;
                }
                if (range.end.column === 'selector') {
                    range.end.column = intSelectorIndex;
                }

                // because the end of the selection may be above and to the left
                //      of the start of the selection, we need to be sure that:
                //          the start row/column is the top-left
                //          the end row/column is the bottom-right
                rangeStartRow = Math.min(range.start.row, range.end.row);
                rangeEndRow = Math.max(range.start.row, range.end.row);
                rangeStartColumn = Math.min(
                    range.start.column,
                    range.end.column
                );
                rangeEndColumn = Math.max(range.start.column, range.end.column);

                // if this is the first selection, save the origin record
                //      number for future reference
                if (range_i === 0) {
                    intOriginRecord = rangeStartRow;

                    // the header can't be the origin record
                    if (intOriginRecord === -1) {
                        intOriginRecord += 1;
                    }

                    // save origin record internally
                    element.internalSelection.originRecord = intOriginRecord;
                }

                // if we are dealing with a non-negation selection, use the
                //      jsnDeselectedToSelected translation matrix
                if (range.negator === false) {
                    jsnTranslationMatrix = jsnDeselectedToSelected;

                // else, use the jsnSelectedToDeselected translation matrix
                } else {
                    jsnTranslationMatrix = jsnSelectedToDeselected;
                }

                rec_i = 0;
                rec_len = arrSelection.length;
                while (rec_i < rec_len) {
                    strRecord = arrSelection[rec_i];
                    intRecord = rec_i;

                    if (bolHeaders) {
                        intRecord -= 1;
                    }

                    // if the row is in range or all rows are in the range:
                    //      iterate through cells in the row
                    //console.log(intRecord, rangeStartRow, rangeEndRow);
                    if (
                        (
                            intRecord >= rangeStartRow &&
                            intRecord <= rangeEndRow
                        ) ||
                        (
                            rangeStartRow === -1 &&
                            rangeEndRow === -1
                        )
                    ) {
                        col_i = 0;
                        col_len = strRecord.length;
                        while (col_i < col_len) {
                            intChar = col_i;
                            intColumn = col_i;

                            if (bolSelectors) {
                                intColumn = (col_i - 1);
                            }

                            //if (rec_i === 0) {
                            //    //console.log(
                            //        'intChar:',
                            //        intChar,
                            //        'intColumn:',
                            //        intColumn,
                            //        'rangeStartColumn:',
                            //        rangeStartColumn,
                            //        'rangeEndColumn:',
                            //        rangeEndColumn
                            //    );
                            //}

                            // testing to see if th cell is in the current
                            //      selection range or that the whole record is
                            //      selected
                            if (
                                (
                                    (
                                        intColumn >= rangeStartColumn &&
                                        intColumn <= rangeEndColumn
                                    ) ||
                                    (
                                        rangeStartColumn === -1 &&
                                        rangeEndColumn === -1
                                    )
                                ) &&
                                // we don't want to copy hidden columns
                                (
                                    intColumn === null ||
                                    intColumn === -1 ||
                                    arrColumnWidths[intColumn] > 0
                                )
                            ) {
                                // set cell to "Y" because it is in the
                                //      selection range
                                strRecord = (
                                    strRecord.substr(0, intChar) +
                                    jsnTranslationMatrix[strRecord[intChar]] +
                                    strRecord.substr(intChar + 1)
                                );
                            }
                            col_i += 1;
                        }

                        arrSelection[rec_i] = strRecord;
                    }

                    rec_i += 1;
                }

                range_i += 1;
            }

            // now, we'll convert the array of rows to an array of record
            //      numbers that will be copied (arrRows)
            arrRows = [];
            arrSelectionRows = [];
            rec_i = 0;
            rec_len = arrSelection.length;
            while (rec_i < rec_len) {
                // if the row is selected, add it to the list
                if ((/[BDFHJL]/gi).test(arrSelection[rec_i])) {
                    if (bolHeaders && rec_i === 0) {
                        arrRows.push('header');

                    } else if (bolInsert && rec_i === (rec_len - 1)) {
                        arrRows.push('insert');

                    } else if (bolHeaders) {
                        arrRows.push(rec_i - 1);

                    } else {
                        arrRows.push(rec_i);
                    }
                    arrSelectionRows.push(rec_i);
                }
                rec_i += 1;
            }

            // we'll loop through every row that has a selected cell in it
            //      (arrRows) and for every "Y" we'll add the column number
            //      (if it's not already present) to our column array we'll
            //      break out of the loop if all columns are included
            arrColumns = [];
            arrSelectionCols = [];
            intMaxColumns = element.internalClip.columnList.length;
            rec_i = 0;
            rec_len = arrSelectionRows.length;
            while (rec_i < rec_len) {
                strRecord = arrSelection[arrSelectionRows[rec_i]];
                col_i = 0;
                col_len = strRecord.length;
                while (col_i < col_len) {
                    if (bolSelectors && col_i === 0) {
                        pushValue = ('selector');
                    } else if (bolSelectors) {
                        pushValue = (col_i - 1);
                    } else {
                        pushValue = col_i;
                    }

                    if (
                        arrSelectedStates.indexOf(strRecord[col_i]) !== -1 &&
                        arrColumns.indexOf(pushValue) === -1
                    ) {
                        arrColumns.push(pushValue);
                        arrSelectionCols.push(col_i);
                    }

                    col_i += 1;
                }

                if (arrColumns.length >= intMaxColumns) {
                    break;
                }

                rec_i += 1;
            }
        }

        //console.timeEnd('selection resolve');

        //var test = arrSelection.join('\n');
        //console.log(test.substring(test.length - 20));

        //console.time('selection render');

        // grab all visible cells
        arrElements = xtag.query(element.elems.dataViewport, 'gs-cell');

        // deselect all visible cells
        i = 0;
        len = arrElements.length;
        while (i < len) {
            arrElements[i].removeAttribute('selected');
            arrElements[i].removeAttribute('origin-record');
            arrElements[i].removeAttribute('auto-selected');
            i += 1;
        }

        // select all visible cells that are marked as such in the
        //      resolved selection
        i = 0;
        len = arrElements.length;
        while (i < len) {
            cell = arrElements[i];
            strRow = (
                cell.getAttribute('data-row-number') ||
                '-1'
            );
            strCol = (
                cell.getAttribute('data-col-number') ||
                cell.getAttribute('data-col') ||
                '-1'
            );

            intRow = parseInt(strRow, 10);
            intCol = parseInt(strCol, 10);

            if (bolHeaders) {
                intRow += 1;
            }
            if (bolSelectors) {
                intCol += 1;
            }

            if (strRow === 'insert') {
                intRow = (arrSelection.length - 1);
            }

            if (strCol === 'selector') {
                intCol = 0;
            }

            // highlight origin record
            if (
                //(
                (
                    !bolHeaders &&
                    intRow === intOriginRecord
                ) ||
                (
                    bolHeaders &&
                    intRow === (intOriginRecord + 1)
                )
                //) &&
                //(
                //    !cell.classList.contains('table-insert-selector') &&
                //    !cell.classList.contains('table-record-selector')
                //)
            ) {
                arrElements[i].setAttribute('origin-record', '');
            }

            strRecord = arrSelection[intRow];
            //console.log(intRow, intCol, strRecord);
            if (strRecord) {
                if (arrSelectedStates.indexOf(strRecord[intCol]) > -1) {
                    cell.setAttribute('selected', '');
                    //console.log(
                    //    strRecord,
                    //    intCol,
                    //    intRow,
                    //    cell.getAttribute('data-col-number'),
                    //    cell.getAttribute('data-row-number'),
                    //    cell
                    //);

                // sometimes, the user selects some cells without selecting the
                //      record selectors and/or headers. in this case, we want
                //      to highlight the record selectors and headers of the
                //      selected range
                } else if (
                    (
                        (
                            cell.classList.contains('table-insert-selector') ||
                            cell.classList.contains('table-record-selector')
                        ) &&
                        (
                            arrSelectionRows.indexOf(intRow) > -1
                        )
                    ) ||
                    (
                        (
                            cell.classList.contains('table-all-selector') ||
                            cell.classList.contains('table-header')
                        ) &&
                        (
                            arrSelectionCols.indexOf(intCol) > -1
                        )
                    )
                ) {
                    //console.log(strRow, intRow);
                    //console.log(
                    //    arrSelectionRows,
                    //    arrSelectionCols,
                    //    arrRows,
                    //    arrColumns,
                    //    intCol,
                    //    intRow,
                    //    cell.getAttribute('data-col-number'),
                    //    cell.getAttribute('data-row-number'),
                    //    cell
                    //);
                    cell.setAttribute('auto-selected', '');
                }
            }

            i += 1;
        }

        //console.timeEnd('selection render');

        // store selection variables internally for future reference
        element.internalSelection.resolvedSelection = arrSelection;
        element.internalSelection.rows = arrRows;
        element.internalSelection.columns = arrColumns;

        // you are not allowed to deselect everything, if you have, we'll
        //      select what we can and then re-render the selection
        if (arrRows.length === 0 || arrColumns.length === 0) {
            // if there is data and the current range is not already selecting
            //      the first cell, select the first cell
            //console.log(element.internalSelection.ranges);
            jsnRange = element.internalSelection.ranges[0];

            if (
                element.internalData.records.length > 0 && (
                    element.internalSelection.ranges &&
                    (
                        element.internalSelection.ranges.length !== 1 ||
                        jsnRange.start.row !== 0 ||
                        jsnRange.start.column !== 0 ||
                        jsnRange.end.row !== 0 ||
                        jsnRange.end.column !== 0 ||
                        jsnRange.negator !== false
                    )
                )
            ) {
                element.internalSelection.ranges = [
                    {
                        "start": {
                            "row": 0,
                            "column": 0
                        },
                        "end": {
                            "row": 0,
                            "column": 0
                        },
                        "negator": false
                    }
                ];

                // if we are currently selecting with the mouse, stop the
                //      selection
                if (element.internalSelection.currentlySelecting) {
                    element.internalEvents.selectDragEnd();
                }

                // rerender the selection so that the user can see it
                renderSelection(element);

                // stop execution because we'll be re-running this function
                //      anyway
                return;
            }
        }

        //console.timeEnd('selection total');

        // update hud, because it uses the selection
        updateHUD(element);
    }

    //We had an issue where if the viewport was to small everything inside
    //  the viewport would break, this function removes everything inside
    //  the viewport so there's nothing inside there to break, Genius right?
    function renderEmpty(element) {
        element.elems.dataViewport.innerhtml = '';
    }

    function renderLocationFull(element) {
        //var arrColumnWidths;
        //var arrRecordHeights;
        //var columnBorderWidth;
        //var recordBorderHeight;

        var jsnRange;
        var fromColumn;
        var toColumn;
        var fromRecord;
        var toRecord;

        var i;
        var len;
        var col_i;
        var col_len;
        //var record_i;
        //var record_len;

        //var intCellLeft;
        //var intCellOriginLeft;
        //var intRecordTop;
        //var intRecordOriginTop;

        var arrColumnNames;
        var strHeaderTemplate;
        var strDataTemplate;
        var strInsertTemplate;

        var arrElements;
        var strColumn;
        var strValue;

        var strRecord;
        var arrRecord;
        var jsnRecord;
        var jsnQS;
        var intTotalRecords;
        var strNullString;
        //var strChar;
        var strCell;
        var strHTML;
        //var strCSS;
        var delim;

        //var intRecordSelectorBorderWidth;
        //var intInsertRecordBorderHeight;
        //var intHeaderBorderHeight;

        var bolOneCellSelected;
        var selectedCellControl;
        var textSelection;
        var textSelectionStart;
        var textSelectionEnd;

        //console.log(element.internalSelection.ranges.length, 1);
        //if (element.internalSelection.ranges.length === 1){
            //console.log(element.internalSelection.ranges[0].start.column);
            //console.log(element.internalSelection.ranges[0].end.column);
            //console.log(element.internalSelection.ranges[0].start.row);
            //console.log(element.internalSelection.ranges[0].end.row);
        //}

        // get the first range, we need to know if only one cell is selected
        jsnRange = element.internalSelection.ranges[0];
        bolOneCellSelected = (
            element.internalSelection.ranges.length === 1 &&
            jsnRange.start.column === jsnRange.end.column &&
            jsnRange.start.row === jsnRange.end.row
        );

        // if only one cell is selected, we want to save the text selection
        //      so that we can restore it. this is because this function
        //      destroys all cells so the text selection of any of those
        //      cells will be lost.
        if (bolOneCellSelected) {
            selectedCellControl = xtag.query(
                element,
                (
                    'gs-cell' +
                        '[data-col-number="' + jsnRange.start.column + '"]' +
                        '[data-row-number="' + jsnRange.start.row + '"]' +
                        ' input'
                )
            )[0];
            textSelectionStart = 0;
            textSelectionEnd = 0;

            //console.log('one cell is selected, save text selection');

            if (selectedCellControl) {
                //console.log(
                //    selectedCellControl.selectionStart,
                //    selectedCellControl.selectionEnd
                //);
                //textSelectionStart = selectedCellControl.selectionStart;
                //textSelectionEnd = selectedCellControl.selectionEnd;

                textSelection = GS.getInputSelection(selectedCellControl);
                textSelectionStart = textSelection.start;
                textSelectionEnd = textSelection.end;

                //console.log(textSelection);
            }
        }


        // some code adds classes to the viewport. these need to be removed on
        //      a full re-render
        element.elems.dataViewport.setAttribute('class', 'table-data-viewport');

        //// save column widths and record heights for easy access
        //arrColumnWidths = element.internalDisplay.columnWidths;
        //arrRecordHeights = element.internalDisplay.recordHeights;

        // we needs the border dimensions to calculate true locations
        //columnBorderWidth = element.internalDisplay.columnBorderWidth;
        //recordBorderHeight = element.internalDisplay.recordBorderHeight;

        // save the column name array for quick and easy access
        arrColumnNames = element.internalData.columnNames;

        // we want the records to have access to the "qs" variable, so we'll
        //      save the query string JSON to a variable so that we only have
        //      to get it once
        jsnQS = GS.qryToJSON(GS.getQueryString());

        // we want the user to be able to have access to the total number of
        //      records in their template so we'll save it to a variable so
        //      that we don't need to recalculate
        intTotalRecords = element.internalData.records.length;

        // we want the null string to be configurable, so we'll read the
        //      "null-string" attribute to get the null string
        strNullString = element.getAttribute('null-string');
        //snapback
        // get visible range
        jsnRange = element.internalDisplay.currentRange;
        //intCellOriginLeft = jsnRange.originLeft;
        //intRecordOriginTop = jsnRange.originTop;
        fromColumn = jsnRange.fromColumn;
        toColumn = jsnRange.toColumn;
        fromRecord = jsnRange.fromRecord;
        toRecord = jsnRange.toRecord;

        //// we need to know the border sizes so that we can calculate cell
        ////      dimensions
        //intRecordSelectorBorderWidth = (
        //    element.internalDisplay.recordSelectorBorderWidth
        //);
        //intInsertRecordBorderHeight = (
        //    element.internalDisplay.insertRecordBorderHeight
        //);
        //intHeaderBorderHeight = (
        //    element.internalDisplay.headerBorderHeight
        //);

        //console.log('element: ', element);
        //console.log('jsnRange: ', jsnRange);
        //console.log('intCellOriginLeft: ', intCellOriginLeft);
        //console.log('intRecordOriginTop: ', intRecordOriginTop);
        //console.log('fromColumn: ', fromColumn);
        //console.log('toColumn: ', toColumn);
        //console.log('fromRecord: ', fromRecord);
        //console.log('toRecord: ', toRecord);

        // define strHTML as empty so that we can append to it without
        //      the 'undefinedTEXT THAT YOU APPENDED' issue
        strHTML = '';

        // we only want to template the columns that fall into the range of
        //      fromColumn->toColumn, so we'll stick the record template HTML
        //      into a template element, yank out the desired cells and
        //      that'll be the html we template with (and we'll repeat this
        //      process for the header and insert columns)
        if (element.internalTemplates.header.trim()) {
            strHeaderTemplate = templateExtractVisibleCellRange(
                element,
                element.internalTemplates.header,
                fromColumn,
                toColumn
            );
        }
        if (element.internalTemplates.record.templateHTML.trim()) {
            strDataTemplate = templateExtractVisibleCellRange(
                element,
                element.internalTemplates.record.templateHTML,
                fromColumn,
                toColumn
            );
        }
        if (element.internalTemplates.insertRecord.trim()) {
            strInsertTemplate = templateExtractVisibleCellRange(
                element,
                element.internalTemplates.insertRecord,
                fromColumn,
                toColumn
            );
        }

        //console.log('strHeaderTemplate: ', strHeaderTemplate);
        //console.log('strDataTemplate:   ', strDataTemplate);
        //console.log('strInsertTemplate: ', strInsertTemplate);

        // if there is a record template: build cell elements (first so that
        //      they're below everything)
        if (strDataTemplate) {
            var templateFunc = doT.template(
                '{{ ' +
                    'var row_number = jo.index + 1;' +
                    'var qs = jo.qs;' +
                    'var row = jo.row;' +
                    'var arrRow = jo.arrRow;' +
                    'var i = jo.index;' +
                    'var len = jo.len;' +
                '}}' +
                strDataTemplate
            );

            //console.log(fromRecord, toRecord);
            i = fromRecord;
            len = toRecord;
            //intRecordTop = intRecordOriginTop;
            while (i < len) {
                // create cell array for this record
                strRecord = element.internalData.records[i] + '\t';
                arrRecord = [];
                col_i = 0;
                col_len = element.internalData.columnNames.length;//9999;
                while (col_i < col_len) {
                    delim = strRecord.indexOf('\t');
                    strCell = strRecord.substring(0, delim);
                    strRecord = strRecord.substring(delim + 1);

                    arrRecord.push(
                        GS.decodeFromTabDelimited(strCell, strNullString)
                    );

                    col_i += 1;
                }

                //record_i = 0;
                //record_len = strRecord.length;
                //strCell = "";
                //arrRecord = [];
                //while (record_i < record_len) {
                //    strChar = strRecord[record_i];

                //    if (strChar === "\t") {
                //        arrRecord.push(
                //            GS.decodeFromTabDelimited(strCell, strNullString)
                //        );
                //        strCell = "";
                //    } else {
                //        strCell += strChar;
                //    }
                //    record_i += 1;
                //}
                //arrRecord.push(strCell);

                // create record JSON from the cell array
                col_i = 0;
                col_len = arrRecord.length;
                jsnRecord = {};
                while (col_i < col_len) {
                    jsnRecord[arrColumnNames[col_i]] = arrRecord[col_i];
                    col_i += 1;
                }

                strRecord = strDataTemplate;

                // template with JSON
                strRecord = templateFunc({
                    'qs': jsnQS,
                    'row': jsnRecord,
                    'arrRow': arrRecord,
                    'index': i,
                    'len': intTotalRecords
                });
                //console.log(strRecord)
                //// replace the css tokens so the cells are in the right place
                //col_i = fromColumn;
                //col_len = toColumn;
                //intCellLeft = intCellOriginLeft;
                //while (col_i < col_len) {
                //    // if the column is not hidden
                //    if (arrColumnWidths[col_i] > 0) {
                //        //strCSS = (
                //        //    'top:' + intRecordTop + 'px;' +
                //        //    'left:' + intCellLeft + 'px;' +
                //        //    'width:' + (
                //        //        arrColumnWidths[col_i] +
                //        //        columnBorderWidth
                //        //    ) + 'px;' +
                //        //    'height:' + (
                //        //        arrRecordHeights[i] +
                //        //        recordBorderHeight
                //        //    ) + 'px;'
                //        //);
                //        strCSS = '';

                //        strRecord = strRecord.replace(
                //            '$$CSSREPLACETOKEN$$',
                //            strCSS
                //        );

                //        intCellLeft += arrColumnWidths[col_i];
                //        intCellLeft += columnBorderWidth;
                //    }
                //    col_i += 1;
                //}

                // append record to html
                strHTML += strRecord;

                //// increment record top so that the next record
                ////      shows below this one
                //intRecordTop += arrRecordHeights[i];
                //intRecordTop += recordBorderHeight;
                i += 1;
            }
        }

        // because we prevent templating into other element's templates (the
        //      ones with a "src" attribute) by "hiding" (by replacing them
        //      with a random token and storing the token-template relationship)
        //      them, we have to "show" them (by replacing the token with the
        //      original template strings) at this step
        GS.templateShowSubTemplates(strHTML, element.internalTemplates.record);

        //// we need to use the dimensions of the header, record selectors and
        ////      the insert record, so we'll stick them in these variables for
        ////      easy access
        //var intHeaderHeight;
        //var intRecordSelectorWidth;
        //var intInsertRecordHeight;

        //intHeaderHeight = element.internalDisplay.headerHeight;
        //intRecordSelectorWidth = element.internalDisplay.recordSelectorWidth;
        //intInsertRecordHeight = element.internalDisplay.insertRecordHeight;

        // if there's a header: build column headings (second so that they're
        //      above cells)
        if (strHeaderTemplate) {
            strRecord = strHeaderTemplate;

            //col_i = fromColumn;
            //col_len = toColumn;
            //intCellLeft = intCellOriginLeft;
            //while (col_i < col_len) {
            //    // if the column is not hidden
            //    if (arrColumnWidths[col_i] > 0) {
            //        //strCSS = (
            //        //    'top:0;' +
            //        //    'left:' + intCellLeft + 'px;' +
            //        //    'width:' + (
            //        //        arrColumnWidths[col_i] +
            //        //        columnBorderWidth
            //        //    ) + 'px;' +
            //        //    'height:' + (
            //        //        intHeaderHeight +
            //        //        intHeaderBorderHeight
            //        //    ) + 'px;'
            //        //);
            //        strCSS = '';

            //        strRecord = strRecord.replace(
            //            '$$CSSREPLACETOKEN$$',
            //            strCSS
            //        );

            //        intCellLeft += arrColumnWidths[col_i];
            //        intCellLeft += columnBorderWidth;
            //    }
            //    col_i += 1;
            //}

            strRecord = handleHeaderTemplateTokens(
                element,
                strRecord,
                fromColumn,
                toColumn
            );

            strHTML += strRecord;
        }

        // because we prevent templating into other element's templates (the
        //      ones with a "src" attribute) by "hiding" (by replacing them
        //      with a random token and storing the token-template relationship)
        //      them, we have to "show" them (by replacing the token with the
        //      original template strings) at this step
        GS.templateShowSubTemplates(strHTML, element.internalTemplates.record);

        // if there's a insert record: build it and append to HTML
        if (strInsertTemplate) {
            strRecord = strInsertTemplate;

            //col_i = fromColumn;
            //col_len = toColumn;
            //intCellLeft = intCellOriginLeft;
            //while (col_i < col_len) {
            //    // if the column is not hidden
            //    if (arrColumnWidths[col_i] > 0) {
            //        //strCSS = (
            //        //    'top:' + intRecordTop + 'px;' +
            //        //    'left:' + intCellLeft + 'px;' +
            //        //    'width:' + (
            //        //        arrColumnWidths[col_i] +
            //        //        columnBorderWidth
            //        //    ) + 'px;' +
            //        //    'height:' + (
            //        //        intInsertRecordHeight +
            //        //        intInsertRecordBorderHeight
            //        //    ) + 'px;'
            //        //);
            //        strCSS = '';

            //        strRecord = strRecord.replace(
            //            '$$CSSREPLACETOKEN$$',
            //            strCSS
            //        );

            //        intCellLeft += arrColumnWidths[col_i];
            //        intCellLeft += columnBorderWidth;
            //    }
            //    col_i += 1;
            //}

            strHTML += strRecord;
        }

        // if record selectors haven't been disabled: build record selectors
        //      (third so that they're above cells)
        if (!element.hasAttribute('no-record-selector')) {
            if (element.getAttribute('update-dialog') === 'show') {
                i = fromRecord;
                len = toRecord;
                //intRecordTop = intRecordOriginTop;
                while (i < len) {
                    //strCSS = '';

                    strHTML += (
                        '<gs-cell class="table-record-selector multi-update" ' +
                        //'    style="' + strCSS + '" ' +
                        '    data-row-number="' + i + '" ' +
                        '    data-col="selector" ' +
                        '    title="Record #' + (i + 1) + '">' +
                        '    <div class="table-multi-update-button"></div>' +
                        '</gs-cell>'
                    );

                    //intRecordTop += arrRecordHeights[i];
                    //intRecordTop += recordBorderHeight;
                    i += 1;
                }
            } else {
                i = fromRecord;
                len = toRecord;
                //intRecordTop = intRecordOriginTop;
                while (i < len) {
                    //strCSS = (
                    //    'top:' + intRecordTop + 'px;' +
                    //    'left:0;' +
                    //    'width:' + (
                    //        intRecordSelectorWidth +
                    //        intRecordSelectorBorderWidth
                    //    ) + 'px;' +
                    //    'height:' + (
                    //        arrRecordHeights[i] +
                    //        recordBorderHeight
                    //    ) + 'px;'
                    //);

                    strHTML += (
                        '<gs-cell class="table-record-selector" ' +
                        //'    style="' + strCSS + '" ' +
                        '    data-row-number="' + i + '" ' +
                        '    data-col="selector" ' +
                        '    title="Record #' + (i + 1) + '">' +
                        (i + 1) +
                        '</gs-cell>'
                    );

                    //intRecordTop += arrRecordHeights[i];
                    //intRecordTop += recordBorderHeight;
                    i += 1;
                }
            }
        }

        // if there's an insert record and record selectors haven't been
        //      disabled: build top-left/select all cell (forth so that it's
        //      above record selectors)
        if (strInsertTemplate && !element.hasAttribute('no-record-selector')) {
            //strCSS = (
            //    'top:' + intRecordTop + 'px;' +
            //    'left:0;' +
            //    'width:' + (
            //        intRecordSelectorWidth +
            //        intRecordSelectorBorderWidth
            //    ) + 'px;' +
            //    'height:' + (
            //        intInsertRecordHeight +
            //        intInsertRecordBorderHeight
            //    ) + 'px;'// +
            //    //'line-height:' + (   <-- used with &gt;
            //    //    intInsertRecordHeight +
            //    //    intInsertRecordBorderHeight
            //    //) + 'px;'
            //);

            strHTML += (
                '<gs-cell class="table-insert-selector"' +
                    //' style="' + strCSS + '"' +
                    ' data-row-number="insert"' +
                    ' data-col="selector">*</gs-cell>' //&gt;
            );
        }

        // if there's a header and record selectors haven't been disabled: build
        //      top-left/select all cell (last so that it's above all)
        if (strHeaderTemplate && !element.hasAttribute('no-record-selector')) {
            //strCSS = (
            //    'top:0;' +
            //    'left:0;' +
            //    'width:' + (
            //        intRecordSelectorWidth +
            //        intRecordSelectorBorderWidth
            //    ) + 'px;' +
            //    'height:' + (
            //        intHeaderHeight +
            //        intHeaderBorderHeight
            //    ) + 'px;' +
            //    'line-height:' + (
            //        intHeaderHeight +
            //        intHeaderBorderHeight
            //    ) + 'px;'
            //);

            strHTML += (
                '<gs-cell class="table-all-selector"' +
                    //' style="' + strCSS + '"' +
                    ' data-col="selector">#</gs-cell>'
            );
        }

        // if there's no data, lets tell the user
        if (element.internalData.records.length === 0) {
            strHTML += '<div class="no-data-label">No Data</div>';
        }

        // we want to give the user some feedback about their scrolling position
        //      so, we'll add shadows on sides that have room to scroll in how
        //      this'll need to work is we'll need to add a shadow element at a
        //      z-index above cells but below record selectors, the all selector
        //      and header cells
        //// ### NEED CODING ###
        //strHTML += window.separate1js_html(element);

        // fill the data viewport with the rendered cells

        // version 1
        //element.elems.dataViewport.innerHTML = strHTML;

        // version 2
        //element.elems.dataContainer.removeChild(element.elems.dataViewport);
        //element.elems.dataViewport = '';
        //element.elems.dataViewport.innerHTML = strHTML;
        //element.elems.dataContainer.appendChild(
        //    element.elems.dataViewport
        //);

        // version 3
        element.elems.dataContainer.removeChild(element.elems.dataViewport);
        i = 0;
        len = element.elems.dataViewport.children.length;
        while (i < len) {
            element.elems.dataViewport.removeChild(
                element.elems.dataViewport.lastChild
            );
            i += 1;
        }
        element.elems.dataViewport.innerHTML = strHTML;
        element.elems.dataContainer.appendChild(
            element.elems.dataViewport
        );

        //// version 4
        //var newViewport = element.elems.dataViewport.cloneNode(false);

        //newViewport.innerHTML = strHTML;
        //element.elems.dataContainer.replaceChild(
        //    newViewport,
        //    element.elems.dataViewport
        //);


        //element.elems.dataViewport = newViewport;

        // fill insert columns with retained values
        arrElements = xtag.query(
            element.elems.dataViewport,
            '.table-insert [column]'
        );
        col_i = 0;
        col_len = arrElements.length;
        while (col_i < col_len) {
            strColumn = arrElements[col_i].getAttribute('column');
            strValue = element.internalData.insertRecord[strColumn];

            // if a value was retained for the current column
            if (strValue) {
                // fill control with retained value
                arrElements[col_i].value = strValue;
            }
            col_i += 1;
        }

        // render cell selection
        renderSelection(element);

        // if there is only one cell control selected and there is a text
        //      selection that has been saved: restore the text selection
        //      in the new control
        if (
            selectedCellControl &&
            (
                textSelectionStart > 0 ||
                textSelectionEnd > 0
            )
        ) {
            jsnRange = element.internalSelection.ranges[0];

            if (jsnRange) {
                selectedCellControl = xtag.query(
                    element,
                    (
                        'gs-cell' +
                            '[data-col-number="' + jsnRange.start.column + '"]' +
                            '[data-row-number="' + jsnRange.start.row + '"]' +
                            ' input'
                    )
                )[0];

                //console.log(selectedCellControl);

                if (selectedCellControl) {
                    //selectedCellControl.setSelectionRange(
                    //    textSelectionStart,
                    //    textSelectionEnd
                    //);
                    GS.setInputSelection(
                        selectedCellControl,
                        textSelectionStart,
                        textSelectionEnd
                    );
                }
            }
        }
    }

    // when you are scrolling, a lot of elements don't leave the screen. So,
    //      this function removes the elements that are no longer visible and
    //      then creates elements that are not visible based on the viewport.
    function renderLocationPartial(element) {
        //var arrColumnWidths;
        //var arrRecordHeights;
        //var columnBorderWidth;
        //var recordBorderHeight;
        //var intRecordSelectorBorderWidth;
        //var intInsertRecordBorderHeight;
        //var intHeaderBorderHeight;

        var strRow;
        var strCol;

        var jsnOldRange;
        var jsnRange;
        var fromColumn;
        var toColumn;
        var fromRecord;
        var toRecord;
        var bolInsertRecord;

        //var intCellOriginLeft;
        //var intRecordOriginTop;
        //var intCellLeft;
        //var intCellTop;

        var arrColumnNames;
        var jsnQS;
        var intTotalRecords;
        var strNullString;

        var intRowNumber;
        var intColNumber;

        //var arrColumnLeft;
        //var arrRecordTop;

        var arrElements;
        var strColumn;
        var strValue;

        var bolUp;
        var bolDown;
        var bolInsert;
        var bolLeft;
        var bolRight;

        var i;
        var len;
        var arrCell;
        var cell;
        var cell_i;
        var cell_len;
        var col_i;
        var col_len;
        //var row_i;
        //var row_len;

        var strDownTemplate;
        var strUpTemplate;
        var strInsertTemplate;
        var strLeftHeaderTemplate;
        var strLeftRecordTemplate;
        var strLeftInsertTemplate;
        var strRightHeaderTemplate;
        var strRightRecordTemplate;
        var strRightInsertTemplate;

        var strHTML;
        var cellElement;

        //// save column widths and record heights for easy access
        //arrColumnWidths = element.internalDisplay.columnWidths;
        //arrRecordHeights = element.internalDisplay.recordHeights;

        //// we needs the border dimensions to calculate true locations
        //columnBorderWidth = element.internalDisplay.columnBorderWidth;
        //recordBorderHeight = element.internalDisplay.recordBorderHeight;

        //// we need to know the border sizes so that we can calculate cell
        ////      dimensions
        //intRecordSelectorBorderWidth = (
        //    element.internalDisplay.recordSelectorBorderWidth
        //);
        //intInsertRecordBorderHeight = (
        //    element.internalDisplay.insertRecordBorderHeight
        //);
        //intHeaderBorderHeight = (
        //    element.internalDisplay.headerBorderHeight
        //);

        // save the column name array for quick and easy access
        arrColumnNames = element.internalData.columnNames;

        // we want the records to have access to the "qs" variable, so we'll
        //      save the query string JSON to a variable so that we only have
        //      to get it once
        jsnQS = GS.qryToJSON(GS.getQueryString());

        // we want the user to be able to have access to the total number of
        //      records in their template so we'll save it to a variable so
        //      that we don't need to recalculate
        intTotalRecords = element.internalData.records.length;

        // we want the null string to be configurable, so we'll read the
        //      "null-string" attribute to get the null string
        strNullString = element.getAttribute('null-string');

        //// we need to use the dimensions of the header, record selectors and
        ////      the insert record, so we'll stick them in these variables for
        ////      easy access
        //var intHeaderHeight;
        //var intRecordSelectorWidth;
        //var intInsertRecordHeight;

        //intHeaderHeight = element.internalDisplay.headerHeight;
        //intRecordSelectorWidth = element.internalDisplay.recordSelectorWidth;
        //intInsertRecordHeight = element.internalDisplay.insertRecordHeight;

        // get old visible range
        jsnOldRange = element.internalDisplay.prevRange;

        // get visible range
        jsnRange = element.internalDisplay.currentRange;
        //intCellOriginLeft = jsnRange.originLeft;
        //intRecordOriginTop = jsnRange.originTop;
        fromColumn = jsnRange.fromColumn;
        toColumn = jsnRange.toColumn;
        fromRecord = jsnRange.fromRecord;
        toRecord = jsnRange.toRecord;
        bolInsertRecord = jsnRange.insertRecord;

        // we create a record selector in multiple places, so to prevent code
        //      duplication, we'll use a function
        var createRecordSelector;

        // sometimes, the developer decide that record selectors are not what
        //      they want, in that case, don't create them
        if (element.hasAttribute('no-record-selector')) {
            createRecordSelector = function () {};
        } else {
            createRecordSelector = function (index) {
                cellElement = document.createElement('gs-cell');
                //cellElement.style.width = (
                //    (
                //        intRecordSelectorWidth +
                //        intRecordSelectorBorderWidth
                //    ) + 'px'
                //);
                //cellElement.style.height = (
                //    (
                //        arrRecordHeights[index] +
                //        recordBorderHeight
                //    ) + 'px'
                //);
                cellElement.classList.add('table-record-selector');
                cellElement.setAttribute('data-row-number', index);
                cellElement.setAttribute('data-col', 'selector');
                cellElement.setAttribute('title', 'Record #' + (index + 1));

                if (element.getAttribute('update-dialog') === 'show') {
                    cellElement.classList.add('multi-update');
                    cellElement.innerHTML = (
                        '<div class="table-multi-update-button"></div>'
                    );
                } else {
                    cellElement.textContent = (index + 1);
                }

                element.elems.dataViewport.appendChild(cellElement);
            };
        }

        // we create a record in multiple places, so to prevent code
        //      duplication, we'll use a function
        var createRecord = function (strTemplate, index) {
            var strRecord;
            var arrRecord;
            var jsnRecord;
            //var strCell;
            //var strChar;
            //var record_i;
            //var record_len;
            var strCell;
            var delim;
            var cell_i;
            var cell_len;

            // get text of the record data
            strRecord = element.internalData.records[index] + '\t';

            // create cell array for this record
            arrRecord = [];
            //console.log(element.internalData.columnNames.length);
            cell_i = 0;
            cell_len = element.internalData.columnNames.length;//9999;
            while (cell_i < cell_len) {
                delim = strRecord.indexOf('\t');
                strCell = strRecord.substring(0, delim);
                strRecord = strRecord.substring(delim + 1);

                //if (strCell !== '' || strRecord !== '') {
                arrRecord.push(
                    GS.decodeFromTabDelimited(strCell, strNullString)
                );
                //} else {
                //    break;
                //}

                cell_i += 1;
            }

            //record_i = 0;
            //record_len = strRecord.length;
            //strCell = "";
            //arrRecord = [];
            //while (record_i < record_len) {
            //    strChar = strRecord[record_i];

            //    if (strChar === "\t") {
            //        arrRecord.push(
            //            GS.decodeFromTabDelimited(strCell, strNullString)
            //        );
            //        strCell = "";
            //    } else {
            //        strCell += strChar;
            //    }
            //    record_i += 1;
            //}
            //arrRecord.push(strCell);

            // create record JSON from the cell array
            // the reason we want JSON is so that the template can easily
            //      reference things by column name
            col_i = 0;
            col_len = arrRecord.length;
            jsnRecord = {};
            while (col_i < col_len) {
                jsnRecord[arrColumnNames[col_i]] = arrRecord[col_i];
                col_i += 1;
            }

            // template with JSON - in the future, we need to change this to
            //      use the dot.js once for all the cells because templating
            //      each record individually is slow ### NEED CODING ###
            strRecord = (
                '{{' +
                    'var row_number = jo.index + 1;' +
                    'var qs = jo.qs;' +
                    'var row = jo.row;' +
                    'var arrRow = jo.arrRow;' +
                    'var i = jo.index;' +
                    'var len = jo.len;' +
                '}}' +
                strTemplate
            );

            strRecord = doT.template(strRecord)({
                'qs': jsnQS,
                'row': jsnRecord,
                'arrRow': arrRecord,
                'index': index,
                'len': intTotalRecords
            });

            //console.log(strRecord);

            // return record html
            return strRecord;
        };

        var createNonDataCells = function (strTemplate) {
            var strRecord;

            //// replace the css tokens so the cells are in the right place
            //strRecord = strTemplate.replace(/\$\$CSSREPLACETOKEN\$\$/gi, '');
            strRecord = strTemplate;

            // template with JSON - in the future, we need to change this to
            //      use the dot.js once for all the cells because templating
            //      each record individually is slow ### NEED CODING ###
            strRecord = '{{ var qs = jo.qs; }}' + strRecord;

            strRecord = doT.template(strRecord)({'qs': jsnQS});

            //console.log(strRecord);

            // return record html
            return strRecord;
        };


        // steps:
        //      remove all cells that are not in the current range
        //      create data cells
        //      create headers
        //      create record selectors
        //      create insert record cells
        //      calculate left and top values
        //      reposition all the cells to their correct locations



        // loop through the cells, if the current cell is not in the current
        //      viewport range, delete it
        var arrDoomed = [];
        arrCell = xtag.queryChildren(
            element.elems.dataViewport,
            '[data-row-number], [data-col-number]'
        );
        cell_i = 0;
        cell_len = arrCell.length;
        while (cell_i < cell_len) {
            cell = arrCell[cell_i];
            strRow = cell.getAttribute('data-row-number');
            strCol = cell.getAttribute('data-col-number');
            intRowNumber = parseInt(strRow, 10);
            intColNumber = parseInt(strCol, 10);

            if (
                intColNumber < fromColumn ||
                intRowNumber < fromRecord ||
                // toColumn is the index of the column after the last visible
                //      column, hence the equal. This fixes the issue of the
                //      partial render not removing the last record
                //      occasionally while scrolling
                intColNumber >= toColumn ||
                // toRecord is the index of the record after the last visible
                //      record, hence the equal. This fixes the issue of the
                //      partial render not removing the last record
                //      occasionally while scrolling
                intRowNumber >= toRecord ||
                (
                    bolInsertRecord === false &&
                    strRow === 'insert'
                )
            ) {
                arrDoomed.push(arrCell[cell_i]);
                //element.elems.dataViewport.removeChild(arrCell[cell_i]);
            }

            cell_i += 1;
        }

        var deleteNext = function () {
            //element.elems.dataViewport.removeChild(arrDoomed.pop());
            //if (arrDoomed.length > 0) {
            //    requestAnimationFrame(deleteNext);
            //}

            cell_i = 0;
            cell_len = arrDoomed.length;
            while (cell_i < cell_len) {
                if (
                    arrDoomed[cell_i].parentNode === element.elems.dataViewport
                ) {
                    element.elems.dataViewport.removeChild(arrDoomed[cell_i]);
                }
                cell_i += 1;
            }
        };
        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(deleteNext);
        } else {
            deleteNext();
        }

        // create data cells
        // create headers
        // create record selectors
        // create insert record cells

        // because you can scroll on the X and Y axis at the same time:
        //      we need to know what columns and what rows to create and in
        //      what directions
        // find out what directions to create cells in
        bolUp = (
            fromRecord < jsnOldRange.fromRecord
        );
        bolDown = (
            toRecord > jsnOldRange.toRecord
        );
        bolInsert = (
            bolInsertRecord === true &&
            bolInsertRecord !== jsnOldRange.insertRecord
        );
        bolLeft = (
            fromColumn < jsnOldRange.fromColumn
        );
        bolRight = (
            toColumn > jsnOldRange.toColumn
        );

        //console.log(jsnOldRange, jsnRange);
        //console.log(
        //    'Up: ' + bolUp,
        //    'Down: ' + bolDown,
        //    'Left: ' + bolLeft,
        //    'Right: ' + bolRight
        //);

        // if we need to create records, get a record template
        if (bolUp || bolDown) {
            // we only want to template the columns that fall into the range of
            //      fromColumn->toColumn, so we'll stick the record template
            //      HTML into a template element, yank out the desired cells and
            //      that'll be the html we template with
            if (element.internalTemplates.record.templateHTML.trim()) {
                strUpTemplate = templateExtractVisibleCellRange(
                    element,
                    element.internalTemplates.record.templateHTML,
                    fromColumn,
                    toColumn
                );

                //// replace the css tokens so that they don't interfere
                //strUpTemplate = (
                //    strUpTemplate
                //        .replace(/\$\$CSSREPLACETOKEN\$\$/gi, '')
                //);

                // for now, the down and up templates are exactly the same. we
                //      could use one variable for the down and up templates,
                //      but, in the future, there may be reason to separate
                //      them. so, I'm just going to copy the up template into
                //      the down template variable
                strDownTemplate = strUpTemplate;
            }

            //console.log(strDownTemplate, strUpTemplate);
        }

        // if we need columns on the left, get the template
        if (bolLeft) {
            // we only want to template the columns that fall into the range of
            //      fromColumn->toColumn, so we'll stick the record template
            //      HTML into a template element, yank out the desired cells and
            //      that'll be the html we template with (and we'll repeat this
            //      process for the header and insert columns)

            // header cells
            if (element.internalTemplates.header.trim()) {
                strLeftHeaderTemplate = templateExtractVisibleCellRange(
                    element,
                    element.internalTemplates.header,
                    jsnRange.fromColumn,
                    jsnOldRange.fromColumn
                );
                strLeftHeaderTemplate = handleHeaderTemplateTokens(
                    element,
                    strLeftHeaderTemplate,
                    jsnRange.fromColumn,
                    jsnOldRange.fromColumn
                );
                //// replace the css tokens so that they don't interfere
                //strLeftHeaderTemplate = (
                //    strLeftHeaderTemplate
                //        .replace(/\$\$CSSREPLACETOKEN\$\$/gi, '')
                //);
            }
            // record cells
            if (element.internalTemplates.record.templateHTML.trim()) {
                strLeftRecordTemplate = templateExtractVisibleCellRange(
                    element,
                    element.internalTemplates.record.templateHTML,
                    jsnRange.fromColumn,
                    jsnOldRange.fromColumn
                );
                //// replace the css tokens so that they don't interfere
                //strLeftRecordTemplate = (
                //    strLeftRecordTemplate
                //        .replace(/\$\$CSSREPLACETOKEN\$\$/gi, '')
                //);
            }
            // insert cells
            if (
                // if there is an insert template
                element.internalTemplates.insertRecord.trim() &&
                // if the insert record has already been added
                !bolInsert
            ) {
                strLeftInsertTemplate = templateExtractVisibleCellRange(
                    element,
                    element.internalTemplates.insertRecord,
                    jsnRange.fromColumn,
                    jsnOldRange.fromColumn
                );
                //// replace the css tokens so that they don't interfere
                //strLeftInsertTemplate = (
                //    strLeftInsertTemplate
                //        .replace(/\$\$CSSREPLACETOKEN\$\$/gi, '')
                //);
            }

            //console.log(
            //    strLeftHeaderTemplate,
            //    strLeftRecordTemplate,
            //    strLeftInsertTemplate
            //);
        }

        // if we need columns on the right, get the template
        if (bolRight) {
            // we only want to template the columns that fall into the range of
            //      fromColumn->toColumn, so we'll stick the record template
            //      HTML into a template element, yank out the desired cells and
            //      that'll be the html we template with (and we'll repeat this
            //      process for the header and insert columns)

            // header cells
            if (element.internalTemplates.header.trim()) {
                strRightHeaderTemplate = templateExtractVisibleCellRange(
                    element,
                    element.internalTemplates.header,
                    jsnOldRange.toColumn,
                    jsnRange.toColumn
                );
                strRightHeaderTemplate = handleHeaderTemplateTokens(
                    element,
                    strRightHeaderTemplate,
                    jsnOldRange.toColumn,
                    jsnRange.toColumn
                );
                //// replace the css tokens so that they don't interfere
                //strRightHeaderTemplate = (
                //    strRightHeaderTemplate
                //        .replace(/\$\$CSSREPLACETOKEN\$\$/gi, '')
                //);
            }
            // record cells
            if (element.internalTemplates.record.templateHTML.trim()) {
                strRightRecordTemplate = templateExtractVisibleCellRange(
                    element,
                    element.internalTemplates.record.templateHTML,
                    jsnOldRange.toColumn,
                    jsnRange.toColumn
                );
                //// replace the css tokens so that they don't interfere
                //strRightRecordTemplate = (
                //    strRightRecordTemplate
                //        .replace(/\$\$CSSREPLACETOKEN\$\$/gi, '')
                //);
            }
            // insert cells
            if (
                // if there is an insert template
                element.internalTemplates.insertRecord.trim() &&
                // if the insert record has already been added
                !bolInsert
            ) {
                strRightInsertTemplate = templateExtractVisibleCellRange(
                    element,
                    element.internalTemplates.insertRecord,
                    jsnOldRange.toColumn,
                    jsnRange.toColumn
                );
                //// replace the css tokens so that they don't interfere
                //strRightInsertTemplate = (
                //    strRightInsertTemplate
                //        .replace(/\$\$CSSREPLACETOKEN\$\$/gi, '')
                //);
            }

            //console.log(
            //    strRightHeaderTemplate,
            //    strRightRecordTemplate,
            //    strRightInsertTemplate
            //);
        }

        // define strHTML as empty so that we can append to it without
        //      the 'undefinedTEXT THAT YOU APPENDED' issue
        strHTML = '';

        // if we need to add cells above the old visible range
        if (bolUp) {
            i = jsnRange.fromRecord;
            len = jsnOldRange.fromRecord;
            while (i < len) {
                // record selector cell
                createRecordSelector(i);

                // record cells
                strHTML += createRecord(strUpTemplate, i);

                i += 1;
            }
        }

        // if we need to add cells below the old visible range
        if (bolDown) {
            i = jsnOldRange.toRecord;
            len = jsnRange.toRecord;
            while (i < len) {
                // record selector cell
                createRecordSelector(i);

                // record cells
                strHTML += createRecord(strDownTemplate, i);

                i += 1;
            }
        }

        // if we need to add the insert record=
        if (bolInsert) {
            strInsertTemplate = '';

            if (!element.hasAttribute('no-record-selector')) {
                strInsertTemplate += (
                    '<gs-cell ' +
                            'class="table-insert-selector"' +
                            ' data-row-number="insert"' +
                            ' data-col="selector">*' + //&gt;
                    '</gs-cell>'
                );
            }

            strInsertTemplate += (
                templateExtractVisibleCellRange(
                    element,
                    element.internalTemplates.insertRecord,
                    jsnRange.fromColumn,
                    jsnRange.toColumn
                )
            );

            //// replace the css tokens so that they don't interfere
            //strInsertTemplate = (
            //    strInsertTemplate
            //        .replace(/\$\$CSSREPLACETOKEN\$\$/gi, '')
            //);

            strHTML += createNonDataCells(strInsertTemplate);
        }

        // if we need to add cells to the left of the old visible range
        //      one thing to note is that the up and down templating takes
        //      care of the left and right columns for those records, this
        //      code takes care of the left columns for the existing records
        if (bolLeft) {
            // header cells
            if (strLeftHeaderTemplate) {
                strHTML += createNonDataCells(strLeftHeaderTemplate);
            }

            // record cells
            if (strLeftRecordTemplate) {
                // loop through records that overlap from the old visible
                //      range and the new visible range

                if (bolUp) {
                    i = jsnOldRange.fromRecord;
                    len = jsnRange.toRecord;
                } else if (bolDown) {
                    i = jsnRange.fromRecord;
                    len = jsnOldRange.toRecord;
                } else {
                    i = jsnRange.fromRecord;
                    len = jsnRange.toRecord;
                }

                while (i < len) {
                    strHTML += createRecord(strLeftRecordTemplate, i);

                    i += 1;
                }
            }

            // insert cells
            if (strLeftInsertTemplate) {
                strHTML += createNonDataCells(strLeftInsertTemplate);
            }
        }

        // if we need to add cells to the right of the old visible range
        //      one thing to note is that the up and down templating takes
        //      care of the left and right columns for those records, this
        //      code takes care of the right columns for the existing records
        if (bolRight) {
            // header cells
            if (strRightHeaderTemplate) {
                strHTML += createNonDataCells(strRightHeaderTemplate);
            }

            // record cells
            if (strRightRecordTemplate) {
                // loop through records that overlap from the old visible
                //      range and the new visible range

                if (bolUp) {
                    i = jsnOldRange.fromRecord;
                    len = jsnRange.toRecord;
                } else if (bolDown) {
                    i = jsnRange.fromRecord;
                    len = jsnOldRange.toRecord;
                } else {
                    i = jsnRange.fromRecord;
                    len = jsnRange.toRecord;
                }

                while (i < len) {
                    strHTML += createRecord(strRightRecordTemplate, i);

                    i += 1;
                }
            }

            // insert cells
            if (strRightInsertTemplate) {
                strHTML += createNonDataCells(strRightInsertTemplate);
            }
        }

        // because we prevent templating into other element's templates (the
        //      ones with a "src" attribute) by "hiding" (by replacing them
        //      with a random token and storing the token-template relationship)
        //      them, we have to "show" them (by replacing the token with the
        //      original template strings) at this step
        strHTML = GS.templateShowSubTemplates(
            strHTML,
            element.internalTemplates.record
        );

        //console.log(strHTML);

        // we want to append the html and have the elements to initialize
        //      while in the DOM, so we'll use the recently discovered and
        //      compatible element.insertAdjacentHTML

        // version 2
        //element.elems.dataContainer.removeChild(element.elems.dataViewport);
        //element.elems.dataViewport.insertAdjacentHTML('beforeend', strHTML);
        //element.elems.dataContainer.appendChild(element.elems.dataViewport);

        // version 3
        //var test = document.createElement('div');
        //test.innerHTML = strHTML;
        //element.elems.dataViewport.appendChild(test);

        if (document.createDocumentFragment) {
            // version 4
            var divElement = document.createElement('div');
            var transferFragment = document.createDocumentFragment();
            divElement.innerHTML = strHTML;

            i = 0;
            len = divElement.children.length;
            while (i < len) {
                transferFragment.appendChild(divElement.lastChild);
                i += 1;
            }

            element.elems.dataViewport.appendChild(transferFragment);
        } else {
            // version 1
            element.elems.dataViewport.insertAdjacentHTML('beforeend', strHTML);
        }



        //// calculate left and top values
        //intCellLeft = intCellOriginLeft;
        //arrColumnLeft = [];
        //col_i = fromColumn;
        //col_len = toColumn;
        //while (col_i < col_len) {
        //    arrColumnLeft.push(intCellLeft);

        //    // we don't want the border width of 0 width columns to affect
        //    //      positioning
        //    if (arrColumnWidths[col_i] > 0) {
        //        intCellLeft += arrColumnWidths[col_i];
        //        intCellLeft += columnBorderWidth;
        //    }
        //    col_i += 1;
        //}

        //intCellTop = intRecordOriginTop;
        //arrRecordTop = [];
        //row_i = fromRecord;
        //row_len = toRecord;
        //while (row_i < row_len) {
        //    arrRecordTop.push(intCellTop);

        //    intCellTop += arrRecordHeights[row_i];
        //    intCellTop += recordBorderHeight;
        //    row_i += 1;
        //}

        //// if the insert record is visible, add it's top
        //if (bolInsertRecord === true) {
        //    arrRecordTop.push(intCellTop);

        //    intCellTop += element.internalDisplay.insertRecordHeight;
        //    intCellTop += element.internalDisplay.insertRecordBorderHeight;
        //}

        //// reposition all the cells to their correct locations
        //arrCell = xtag.queryChildren(
        //    element.elems.dataViewport,
        //    'gs-cell'
        //    //'[data-row-number], [data-col-number]'
        //    //      ^- this selector missed the insert and all selector cells
        //);
        //cell_i = 0;
        //cell_len = arrCell.length;
        //while (cell_i < cell_len) {
        //    cell = arrCell[cell_i];
        //    intRowNumber = parseInt(cell.getAttribute('data-row-number'), 10);
        //    intColNumber = parseInt(cell.getAttribute('data-col-number'), 10);

        //    // cell has a column number, set left. we can do this because (for
        //    //      example) header cells dont have a row attribute. the
        //    //      reason we do that is because those cells don't represent
        //    //      a row in the data.
        //    if (!isNaN(intColNumber)) {
        //        cell.style.left = (
        //            arrColumnLeft[intColNumber - fromColumn] + 'px'
        //        );
        //        cell.style.width = (
        //            (
        //                arrColumnWidths[intColNumber] +
        //                columnBorderWidth
        //            ) + 'px'
        //        );

        //    // right now, the only element that won't have a column number
        //    //      will be the record, insert and all selectors
        //    } else {
        //        cell.style.width = (
        //            intRecordSelectorWidth +
        //            intRecordSelectorBorderWidth
        //        ) + 'px';
        //    }

        //    // cell has a row number, set top. we can do this because (for
        //    //      example) header cells dont have a row attribute. the
        //    //      reason we do that is because those cells don't represent
        //    //      a row in the data.
        //    if (!isNaN(intRowNumber)) {
        //        cell.style.top = (
        //            arrRecordTop[intRowNumber - fromRecord] + 'px'
        //        );
        //        cell.style.height = (
        //            (
        //                arrRecordHeights[intRowNumber] +
        //                recordBorderHeight
        //            ) + 'px'
        //        );
        //        //cell.setAttribute(
        //        //    'style',
        //        //    (
        //        //        'top:' + (
        //        //            arrRecordTop[intRowNumber - fromRecord]
        //        //        ) + 'px;' +
        //        //        'height:' + (
        //        //            arrRecordHeights[intRowNumber] +
        //        //            recordBorderHeight
        //        //        ) + 'px;'
        //        //    )
        //        //);

        //    // if the cell is a header cell, set the height
        //    } else if (
        //        cell.classList.contains('table-header') ||
        //        cell.classList.contains('table-all-selector')
        //    ) {
        //        cell.style.height = (
        //            intHeaderHeight +
        //            intHeaderBorderHeight
        //        ) + 'px';
        //        //cell.setAttribute(
        //        //    'style',
        //        //    (
        //        //        'height:' + (
        //        //            intHeaderHeight +
        //        //            intHeaderBorderHeight
        //        //        ) + 'px;'
        //        //    )
        //        //);

        //    // if the cell is a insert cell, set the height
        //    } else if (
        //        cell.classList.contains('table-insert')
        //    ) {
        //        cell.style.top = (
        //            arrRecordTop[arrRecordTop.length - 1] + 'px'
        //        );
        //        cell.style.height = (
        //            intInsertRecordHeight +
        //            intInsertRecordBorderHeight
        //        ) + 'px';
        //        //cell.setAttribute(
        //        //    'style',
        //        //    (
        //        //        'top:' + (
        //        //            arrRecordTop[arrRecordTop.length - 1]
        //        //        ) + 'px;' +
        //        //        'height:' + (
        //        //            intInsertRecordHeight +
        //        //            intInsertRecordBorderHeight
        //        //        ) + 'px;'
        //        //    )
        //        //);

        //    // if the cell is the insert selector, set the height
        //    } else if (
        //        cell.classList.contains('table-insert-selector')
        //    ) {
        //        cell.style.top = (
        //            arrRecordTop[arrRecordTop.length - 1] + 'px'
        //        );
        //        cell.style.left = (0);
        //        cell.style.height = (
        //            intInsertRecordHeight +
        //            intInsertRecordBorderHeight
        //        ) + 'px';

        //        //cell.setAttribute(
        //        //    'style',
        //        //    (
        //        //        'top:' + (
        //        //            arrRecordTop[arrRecordTop.length - 1]
        //        //        ) + 'px;' +
        //        //        'left:0px;' +
        //        //        'height:' + (
        //        //            intInsertRecordHeight +
        //        //            intInsertRecordBorderHeight
        //        //        ) + 'px;'
        //        //    )
        //        //);
        //    }

        //    //if (cell.classList.contains('table-cell')) {
        //    //} else if (cell.classList.contains('table-all-selector')) {
        //    //} else if (cell.classList.contains('table-header')) {
        //    //} else if (cell.classList.contains('table-record-selector')) {
        //    //} else if (cell.classList.contains('table-insert')) {
        //    //} else if (cell.classList.contains('table-insert-selector')) {
        //    //}

        //    cell_i += 1;
        //}

        // fill insert columns with retained values
        arrElements = xtag.query(
            element.elems.dataViewport,
            '.table-insert [column]'
        );
        col_i = 0;
        col_len = arrElements.length;
        while (col_i < col_len) {
            strColumn = arrElements[col_i].getAttribute('column');
            strValue = element.internalData.insertRecord[strColumn];

            // if a value was retained for the current column
            if (strValue) {
                // fill control with retained value
                arrElements[col_i].value = strValue;
            }
            col_i += 1;
        }

        // we want to give the user some feedback about their scrolling position
        //      so, we'll add shadows on sides that have room to scroll in how
        //      this'll need to work is we'll need to add a shadow element at a
        //      z-index above cells but below record selectors, the all selector
        //      and header cells
        //// ### NEED CODING ###
        //window.separate1js_elements(element);

        // render cell selection
        renderSelection(element);
    }

    function renderLocation(element) {
        var i;
        var len;

        var intMaximum;
        var intTraversed;
        var intExtremeSide;

        var intViewportWidth;
        var intViewportHeight;

        var jsnOldRange;
        var jsnRange;

        var focusElement;

        // get old visible range so that we can decide if it's economical to do
        //      a full re-render
        jsnOldRange = element.internalDisplay.currentRange;

        // get current visible range so that we can decide if it's economical
        //      to do a full re-render
        jsnRange = getCurrentCellRange(element);

        // save visible range to internal display so that it is cached. the
        //      reason to cache it is so that we can be able to rapidly
        //      retrieve it many times in a row.
        element.internalDisplay.currentRange = jsnRange;

        // the partial render need to know the previous visible range, so here
        //      we cache it
        element.internalDisplay.prevRange = jsnOldRange;

        // we dont want to force a layout by re-rendering the contents and then
        //      asking for the viewport height/width. so we'll make a
        //      convenience variable
        intViewportWidth = (
            element.elems.dataViewport.clientWidth
        );
        intViewportHeight = (
            element.elems.dataViewport.clientHeight
        );

        // we want to either do a full re-render or a partial re-render
        if (intViewportHeight < 3 || intViewportWidth < 3) {
            //console.log('Empty');
            renderEmpty(element);
        } else if (
            // if the internal display says we need to do a full re-render
            element.internalDisplay.fullRenderRequired === true ||

            // or if there is no previous cell range
            jsnOldRange.fromRecord === undefined ||

            // or if the current range has no overlap with the old range
            jsnRange.fromRecord > jsnOldRange.toRecord ||
            jsnRange.fromColumn > jsnOldRange.toColumn ||
            jsnRange.toRecord < jsnOldRange.fromRecord ||
            jsnRange.toColumn < jsnOldRange.fromColumn
        ) {
            //console.log('Full');
            renderLocationFull(element);
        } else {
            //console.log('Partial');
            renderLocationPartial(element);
        }

        // reset full render indicator
        element.internalDisplay.fullRenderRequired = false;

        // generate positioning CSS
        // clear old CSS
        element.elems.cellPositionStyle.innerHTML = '';

        var intCellLeft = 0;
        var intCellTop = 0;
        var intColumnWidth;
        //var arrMinColumnWidths = element.internalDisplay.minColumnWidths;

        var arrColumnWidths = element.internalDisplay.columnWidths;
        var arrRecordHeights = element.internalDisplay.recordHeights;
        var columnBorderWidth = element.internalDisplay.columnBorderWidth;
        var recordBorderHeight = element.internalDisplay.recordBorderHeight;
        var strCSS = '';
        var strCell = (
            '#' + element.getAttribute('id') + ' .table-data-viewport gs-cell'
        );

        // calculate left and top values
        intCellLeft = jsnRange.originLeft;
        i = jsnRange.fromColumn;
        len = jsnRange.toColumn;
        while (i < len) {
            //if (arrColumnWidths[i] < 3) {
            //    //console.log(
            //        element.internalDisplay.defaultColumnWidths[i],
            //        element.internalDisplay.minColumnWidths[i],
            //        arrColumnWidths[i]
            //    );
            //    arrColumnWidths[i] = arrMinColumnWidths[i];
            //    element.internalDisplay.columnWidths[i] = (
            //        arrMinColumnWidths[i]
            //    );
            //}
            //console.log('col: ', arrColumnWidths[i]);
            intColumnWidth = arrColumnWidths[i];

            // only add to CSS and increment left variable if column is not
            //      hidden
            if (intColumnWidth > 0) {
                strCSS += (
                    strCell + '[data-col-number="' + i + '"] {' +
                    'left:' + intCellLeft + 'px;' +
                    'width:' + (
                        intColumnWidth + columnBorderWidth
                    ) + 'px;' +
                    '}'
                );
                // console.log(strCSS);

                // we don't want the border width of 0 width columns to affect
                //      positioning
                intCellLeft += (intColumnWidth + columnBorderWidth);
            }
            i += 1;
        }

        intCellTop = jsnRange.originTop;
        i = jsnRange.fromRecord;
        len = jsnRange.toRecord;
        while (i < len) {
            //if (arrRecordHeights[i] < 3) {
            //    arrRecordHeights[i] = (
            //        element.internalDisplay.defaultRecordHeight
            //    );
            //    element.internalDisplay.recordHeights[i] = (
            //        element.internalDisplay.defaultRecordHeight
            //    );
            //}
            //console.log('row: ', arrRecordHeights[i]);
            strCSS += (
                strCell + '[data-row-number="' + i + '"] {' +
                'top:' + intCellTop + 'px;' +
                'height:' + (
                    arrRecordHeights[i] + recordBorderHeight
                ) + 'px;' +
                '}'
            );

            intCellTop += (arrRecordHeights[i] + recordBorderHeight);
            i += 1;
        }

        // if the insert record is visible, add it's top
        if (element.internalDisplay.insertRecordVisible) {
            strCSS += (
                strCell + '[data-row-number="insert"] {' +
                'top:' + intCellTop + 'px;' +
                'height:' + (
                    element.internalDisplay.insertRecordHeight +
                    element.internalDisplay.insertRecordBorderHeight
                ) + 'px;' +
                '}'
            );

            //intCellTop += element.internalDisplay.insertRecordHeight;
            //intCellTop += element.internalDisplay.insertRecordBorderHeight;
        }

        strCSS += (
            strCell + '[data-col="selector"] {' +
            'left:0px;' +
            'width:' + (
                element.internalDisplay.recordSelectorWidth +
                element.internalDisplay.recordSelectorBorderWidth
            ) + 'px;' +
            '}' +

            strCell + '.table-all-selector,' +
            strCell + '.table-header {' +
            'top:0px;' +
            'height:' + (
                element.internalDisplay.headerHeight +
                element.internalDisplay.headerBorderHeight
            ) + 'px;' +
            '}'
        );

        //console.log('strCSS:', strCSS);

        element.elems.cellPositionStyle.innerHTML = strCSS;


        // turn the visible range into two arrays of drag handle points, one for
        //      horizontal, one for vertical. This is used by the cell resize
        //      code so that it can tell where the cell resize handles are.

        // we need to clear out any old values in the handle lists
        element.internalDisplay.columnHandles = [];
        element.internalDisplay.recordHandles = [];

        // find out the maximum position for a column resize handle
        intMaximum = (
            (
                intViewportWidth -
                element.internalScrollOffsets.right
            ) +
            // allow room for handle that's right at the right edge, this is
            //      useful when a column is full width
            3
        );

        // add record selector to column handle list if it's visible, the reason
        //      it's first is because the cell resize code depends it being
        //      first if recordSelectorVisible is true
        if (element.internalDisplay.recordSelectorVisible === true) {
            element.internalDisplay.columnHandles.push(
                element.internalScrollOffsets.left
            );
        }

        // add displayed columns to column handle list
        intTraversed = jsnRange.originLeft;//0;
        i = jsnRange.fromColumn;
        len = jsnRange.toColumn;
        while (i < len) {
            // we want to add the right side of the column unless the right side
            //      is off of the viewport or is obscured by the right offset
            //      so, we'll put the right side into a variable and we'll build
            //      up a record width variable that we can use to determine if
            //      the right side would be too far
            if (element.internalDisplay.columnWidths[i] === 0) {
                intExtremeSide = 0;
            } else {
                intExtremeSide = (
                    element.internalDisplay.columnWidths[i] +
                    element.internalDisplay.columnBorderWidth
                );
            }

            //if (intTraversed <= 0 && intExtremeSide > 0) {
            //    intExtremeSide += jsnRange.originLeft;
            //}
            intTraversed += intExtremeSide;

            //console.log(
            //    intTraversed,
            //    element.internalScrollOffsets.left,
            //    intExtremeSide,
            //    jsnRange.originLeft
            //);

            if (intTraversed < intMaximum) {
                // if column is hidden, push null handle so that the array
                //      indexes still line up with the column numbers
                if (
                    intExtremeSide === 0 ||
                    intTraversed <= element.internalScrollOffsets.left
                ) {
                    element.internalDisplay.columnHandles.push(null);
                } else {
                    element.internalDisplay.columnHandles.push(intTraversed);
                }
            } else {
                break;
            }

            i += 1;
        }

        // now, we add the records to the record handle list

        // find out the maximum position for a record resize handle
        intMaximum = (
            intViewportHeight -
            element.internalScrollOffsets.bottom
        );

        // add header to record handle list if it's visible, the reason it's
        //      first is because the cell resize code depends it being first
        //      if headerVisible is true
        if (element.internalDisplay.headerVisible === true) {
            element.internalDisplay.recordHandles.push(
                element.internalScrollOffsets.top
            );
        }

        // add displayed records to record handle list
        intTraversed = 0;
        i = jsnRange.fromRecord;
        len = jsnRange.toRecord;
        while (i < len) {
            // we want to add the bottom side of the record unless the bottom
            //      side is off of the viewport or is obscured by the bottom
            //      offset so, we'll put the bottom side into a variable and
            //      we'll build up a record width variable that we can use to
            //      determine if the bottom side would be too far
            intExtremeSide = (
                element.internalDisplay.recordHeights[i]
            );

            if (intTraversed <= 0) {
                intExtremeSide += (
                    jsnRange.originTop
                );
            }
            intTraversed += intExtremeSide;

            if (intTraversed < intMaximum) {
                element.internalDisplay.recordHandles.push(intTraversed);
            } else {
                break;
            }

            // we wanted the cursor to appear a little higher
            intTraversed += element.internalDisplay.recordBorderHeight;

            i += 1;
        }

        // add the insert record to record handle list if it's visible, the
        //      reason it's last is because the cell resize code depends it
        //      being last if insertRecordVisible is true
        if (
            element.internalDisplay.insertRecordVisible === true &&
            jsnRange
        ) {
            element.internalDisplay.recordHandles.push(
                element.internalDisplay.insertRecordHeight +
                intTraversed
            );
        }

        // commented out because throttling scrolling makes scrolling choppy,
        //      other avenues of speed improvement will need to be attempted
        //// we needed to throttle the location rendering to increase speed
        ////      next, we want to look into only replacing elements that
        ////      need to be replaced as and just moving the rest (and if
        ////      that improves the speed enough, we can remove the throttling)
        //if (element.internalTimerIDs.renderLocation) {
        //    clearTimeout(element.internalTimerIDs.renderLocation);
        //}
        //element.internalTimerIDs.renderLocation = setTimeout(function() {
        //    renderLocationFull(element);
        //    element.internalTimerIDs.renderLocation = null;
        //}, 5);

        // we maintain the last focused control, if the last focused control
        //      is in the DOM, we want to focus it
        if (
            // this does two things for us:
            //      "latest" starts out null so this prevents us trying to
            //              focus when we haven't ever had the focus
            //      "latest" is false when the control has lost it's focus
            //              so this prevents wasting effort on trying to
            //              focus if the control is already focused
            element.internalDisplay.focus.latest === false &&

            // we only want to try to re-focus if the cell is in the current
            //      range. in the future, we may end up adding the cell if
            //      it's not currently rendered.
            !isNaN(element.internalDisplay.focus.row) &&
            !isNaN(element.internalDisplay.focus.column) &&
            element.internalDisplay.focus.row >= jsnRange.fromRecord &&
            element.internalDisplay.focus.row <= jsnRange.toRecord &&
            element.internalDisplay.focus.column >= jsnRange.fromColumn &&
            element.internalDisplay.focus.column <= jsnRange.toColumn
        ) {
            focusElement = xtag.query(
                element.elems.dataViewport,
                (
                    'gs-cell' +
                    '[data-col-number="' +
                        element.internalDisplay.focus.column +
                    '"]' +
                    '[data-row-number="' +
                        element.internalDisplay.focus.row +
                    '"] ' +
                    (
                        element.internalDisplay.focus.nodeName ||
                        ''
                    ).toLowerCase()
                )
            )[0];

            if (focusElement) {
                focusElement.focus();

                if (element.internalDisplay.focus.selectionRange) {
                    GS.setInputSelection(
                        focusElement,
                        element.internalDisplay.focus.selectionRange.start,
                        element.internalDisplay.focus.selectionRange.end
                    );
                }
            }
        }
    }

    // we need to be able to update the scrollbar location programatically
    function renderScrollLocation(element) {
        var intViewportWidth;
        var intViewportHeight;
        var virtualScrollHeight;
        var virtualScrollWidth;
        var virtualScrollTop;
        var virtualScrollLeft;
        var trueScrollHeight;
        var trueScrollWidth;
        var trueScrollTop;
        var trueScrollLeft;

        // we need the viewport dimensions because true scroll dimensions
        //      include the viewport height, which messes with the caluculations
        intViewportWidth = element.elems.dataViewport.clientWidth;
        intViewportHeight = element.elems.dataViewport.clientHeight;

        // we are saving the max scroll dimensions for ease of access
        virtualScrollHeight = element.internalScroll.maxTop;
        virtualScrollWidth = element.internalScroll.maxLeft;

        // we are saving the current scroll location for ease of access
        virtualScrollTop = element.internalScroll.top;
        virtualScrollLeft = element.internalScroll.left;

        // we need the actual scroll height of the scrollbars because we limit
        //      their height and that causes a difference we need to account for
        trueScrollWidth = element.elems.xScrollBar.scrollWidth;
        trueScrollHeight = element.elems.yScrollBar.scrollHeight;
        trueScrollWidth -= intViewportWidth;
        trueScrollHeight -= intViewportHeight;

        // we need to translate the virtual top/left into true top/left for the
        //      physical scrollbars
        // we can only translate if the scroll height or width is > 0 because if
        //      we translate a 0, we end up with division by 0
        // if we can't translate: default to 0

        trueScrollTop = 0;
        if (virtualScrollHeight > 0) {
            trueScrollTop = (
                virtualScrollTop / (
                    virtualScrollHeight / trueScrollHeight
                )
            );
        }

        trueScrollLeft = 0;
        if (virtualScrollWidth > 0) {
            trueScrollLeft = (
                virtualScrollLeft / (
                    virtualScrollWidth / trueScrollWidth
                )
            );
        }

        // we need to cancel the scrollbar events for one iteration because the
        //      scroll we're about to do causes scrollbar events to emit. the
        //      events then get to their bound functions well after the
        //      execution of this thread. this means that if we run this
        //      function and then set focus to a cell: the bound scroll
        //      functions would cause another re-render, which will cause
        //      focus to be lost. that's why we can't set these cancel to true
        //      and then quickly set them back to false, they must be set to
        //      false in the bound function.
        // there is a small issue with this method, after this function if, for
        //      example, the Y scrollbar is triggered but not the X scrollbar:
        //      the user may use the X scrollbar and the first time the user
        //      triggers the X scrollbar: the event will be ignored. however,
        //      I've tested on Google Chrome and I didn't notice the effects of
        //      this downside
        //element.internalEventCancelled.scrollbarY = true;
        //element.internalEventCancelled.scrollbarX = true;

        // we need to update the scroll location of the physical scrollbars so
        //      that the user can see where they are
        // to prevent sub-pixel math issues from causing a loop (by moving the
        //      scrollbar 1 pixel which causes a scroll event to take place
        //      which causes this function to run again (moving the scrollbar
        //      another pixel etc...)): if the difference between current true
        //      and new true is <=1 pixel then the scrollbar will not be updated
        //      (to fix this issue I tried disabling the event before the update
        //      and enabling it after the update, this did not work)
        if (
            Math.abs(element.elems.yScrollBar.scrollTop - trueScrollTop) >= 1
        ) {
            element.elems.yScrollBar.scrollTop = trueScrollTop;
        }
        if (
            Math.abs(element.elems.xScrollBar.scrollLeft - trueScrollLeft) >= 1
        ) {
            element.elems.xScrollBar.scrollLeft = trueScrollLeft;
        }

        // render cells
        //console.trace('renderScrollLocation');
        //console.log('virtualScrollTop:  ', virtualScrollTop);
        //console.log('virtualScrollLeft: ', virtualScrollLeft);
        //console.log('trueScrollTop:     ', trueScrollTop);
        //console.log('trueScrollLeft:    ', trueScrollLeft);
        renderLocation(element);
        //renderLocation(element);
    }

    // we need to be able to update the scrollbar depending on the content
    //      height/width
    function renderScrollDimensions(element) {
        var i;
        var len;
        var arrColumnWidths;
        var arrRecordHeights;
        var columnBorderWidth;
        var recordBorderHeight;
        var intViewportWidth;
        var intViewportHeight;
        var intMaxColumnWidth;
        var intMaxRecordHeight;

        var intTotalDataWidth;
        var intTotalDataHeight;
        var intOverscrollWidth;
        var intOverscrollHeight;
        var intNoOverscrollHeight;
        var intNoOverscrollWidth;

        // we need to update the cell dimension numbers just in case some CSS
        //      has altered any of the dimensions
        cellDimensionDetector(element);

        // we need to update what features are visible (header, record
        //      selectors, insert record)
        visibilityDetector(element);

        // we need to update the scroll offsets so that we can make room for
        //      headers, insert records and record selectors in the viewport
        offsetDetector(element);

        // we're saving these to variables for quicker/easier access
        columnBorderWidth = element.internalDisplay.columnBorderWidth;
        recordBorderHeight = element.internalDisplay.recordBorderHeight;

        // we need to get column and record dimensions
        arrColumnWidths = element.internalDisplay.columnWidths;
        arrRecordHeights = element.internalDisplay.recordHeights;

        // we need to get the viewport dimensions
        intViewportWidth = element.elems.dataViewport.clientWidth;
        intViewportHeight = element.elems.dataViewport.clientHeight;

        // save max record height and column width
        intMaxColumnWidth = (
            intViewportWidth - (
                element.internalScrollOffsets.left +
                element.internalScrollOffsets.right +
                columnBorderWidth +
                5 // <-- added for extra room
            )
        );
        intMaxRecordHeight = (
            intViewportHeight - (
                element.internalScrollOffsets.top +
                element.internalScrollOffsets.bottom +
                recordBorderHeight +
                5 // <-- added for extra room
            )
        );

        // store the max cell dimensions internally
        element.internalDisplay.maxColumnWidth = intMaxColumnWidth;
        element.internalDisplay.maxRecordHeight = intMaxRecordHeight;

        // we need to add up column widths (including custom ones)
        intTotalDataWidth = 0;
        intOverscrollWidth = 0;
        i = 0;
        len = arrColumnWidths.length;
        while (i < len) {
            // make sure no column is wider than max
            if (
                intMaxColumnWidth > 3 &&
                arrColumnWidths[i] > intMaxColumnWidth
            ) {
                arrColumnWidths[i] = intMaxColumnWidth;
            }

            // increment total data width
            intTotalDataWidth += arrColumnWidths[i];
            intTotalDataWidth += columnBorderWidth;

            // we want to increase overscroll width until the last record
            if (i < (len - 1)) {
                intOverscrollWidth = intTotalDataWidth;
            }

            i += 1;
        }

        // we need to add up record heights (including custom ones)
        intTotalDataHeight = 0;
        intOverscrollHeight = 0;
        i = 0;
        len = arrRecordHeights.length;
        while (i < len) {
            // make sure no record is taller than max
            if (
                intMaxRecordHeight > 3 &&
                arrRecordHeights[i] > intMaxRecordHeight
            ) {
                arrRecordHeights[i] = intMaxRecordHeight;
            }

            // increment total data height
            intTotalDataHeight += arrRecordHeights[i];
            intTotalDataHeight += recordBorderHeight;

            // we want to increase overscroll height until the last record
            if (
                (
                    element.internalDisplay.insertRecordVisible &&
                    element.internalDisplay.insertRecordStick === null &&
                    i === (len - 1)
                ) ||
                (
                    (
                        !element.internalDisplay.insertRecordVisible ||
                        element.internalDisplay.insertRecordStick !== null
                    ) &&
                    i < (len - 1)
                )
            ) {
                // catch overscroll height up to total height
                intOverscrollHeight = intTotalDataHeight;
            }
            i += 1;
        }


        //if (
        //    element.internalDisplay.insertRecordVisible &&
        //    element.internalDisplay.insertRecordStick === null
        //) {
        //    intTotalDataHeight += (
        //        element.internalDisplay.insertRecordHeight +
        //        element.internalDisplay.insertRecordBorderHeight
        //    );
        //}

        //console.log('columnBorderWidth:  ', columnBorderWidth);
        //console.log('recordBorderHeight: ', recordBorderHeight);
        //console.log('Height:         ', intHeight);
        //console.log('ViewportHeight: ', intViewportHeight);
        //console.log('Width:          ', intWidth);
        //console.log('ViewportWidth:  ', intViewportWidth);
        //console.log('offsetTop:      ', element.internalScrollOffsets.top);
        //console.log('offsetBottom:   ', element.internalScrollOffsets.bottom);
        //console.log('offsetLeft:     ', element.internalScrollOffsets.left);
        //console.log('offsetRight:    ', element.internalScrollOffsets.right);

        //// add scroll offsets
        //intHeight += (
        //    element.internalScrollOffsets.top +
        //    element.internalScrollOffsets.bottom
        //);
        //intWidth += (
        //    element.internalScrollOffsets.left +
        //    element.internalScrollOffsets.right
        //);

        // save max scroll dimensions

        // we need to prevent vertical overscrolling if the
        //      "no-y-overscroll" attribute is present. the reason we can't
        //      just use the old maxTop value conditionally is because we
        //      make scrolling scroll by record, not pixel perfect. this
        //      means the last record will get cut off. so, in order to turn
        //      off overscrolling without this issue we need to calculate
        //      the amount to add to the maxTop in order to give enough room
        //      for the last record to clear the bottom of the viewport
        if (element.hasAttribute('no-y-overscroll')) {
            intNoOverscrollHeight = 0;
            i = 0;
            len = arrRecordHeights.length;
            while (i < len) {
                if (
                    (
                        intNoOverscrollHeight +
                        intViewportHeight
                    ) > (
                        intTotalDataHeight +
                        element.internalScrollOffsets.top +
                        element.internalScrollOffsets.bottom
                    )
                ) {
                    break;
                }

                // increment total data width
                intNoOverscrollHeight += arrRecordHeights[i];
                intNoOverscrollHeight += recordBorderHeight;

                i += 1;
            }

            if (
                element.internalDisplay.insertRecordVisible &&
                element.internalDisplay.insertRecordStick === null
            ) {
                intNoOverscrollHeight += (
                    element.internalDisplay.insertRecordHeight +
                    element.internalDisplay.insertRecordBorderHeight
                );
            }

            element.internalScroll.maxTop = Math.max(
                0,
                intNoOverscrollHeight
            );

            //console.log('1***');
            //console.log('   intTotalDataHeight: ', intTotalDataHeight);
            //console.log('  intOverscrollHeight: ', intOverscrollHeight);
            //console.log('intNoOverscrollHeight: ', intNoOverscrollHeight);
            //console.log('    intViewportHeight: ', intViewportHeight);

        } else {
            element.internalScroll.maxTop = Math.max(0, intOverscrollHeight);
        }

        // we need to prevent horizontal overscrolling if the
        //      "no-x-overscroll" attribute is present. the reason we can't
        //      just use the old maxLeft value conditionally is because we
        //      make scrolling scroll by column, not pixel perfect. this
        //      means the last column will get cut off. so, in order to turn
        //      off overscrolling without this issue we need to calculate
        //      the amount to add to the maxLeft in order to give enough
        //      room for the last column to clear the right of the viewport
        if (element.hasAttribute('no-x-overscroll')) {
            intNoOverscrollWidth = 0;
            i = 0;
            len = arrColumnWidths.length;
            while (i < len) {
                if (
                    (
                        intNoOverscrollWidth +
                        intViewportWidth
                    ) > (
                        intTotalDataWidth +
                        element.internalScrollOffsets.left +
                        element.internalScrollOffsets.right
                    )
                ) {
                    break;
                }

                // increment total data width
                intNoOverscrollWidth += arrColumnWidths[i];
                intNoOverscrollWidth += columnBorderWidth;

                i += 1;
            }

            element.internalScroll.maxLeft = Math.max(
                0,
                intNoOverscrollWidth
            );

            //console.log('2***');
            //console.log('   intTotalDataWidth: ', intTotalDataWidth);
            //console.log('  intOverscrollWidth: ', intOverscrollWidth);
            //console.log('intNoOverscrollWidth: ', intNoOverscrollWidth);
            //console.log('    intViewportWidth: ', intViewportWidth);

        } else {
            element.internalScroll.maxLeft = Math.max(0, intOverscrollWidth);
        }

        //console.log('maxTop:   ', element.internalScroll.maxTop);
        //console.log('maxLeft:  ', element.internalScroll.maxLeft);

        // sometimes, you may scroll to the right then widen your gs-table, this
        //      can cause you to get out of bounds
        // if the current scroll location is outside the max dimentions, set
        //      the scroll to the max allowed
        if (element.internalScroll.top > element.internalScroll.maxTop) {
            element.internalScroll.top = element.internalScroll.maxTop;
        }
        if (element.internalScroll.left > element.internalScroll.maxLeft) {
            element.internalScroll.left = element.internalScroll.maxLeft;
        }

        // move scrollbar causer elements to create scrollbars
        element.elems.yScrollBarCauser.style.top = (
            // scrollbars only work for a certain range that's why the max
            //      is 100000
            Math.min(
                (
                    (
                        element.internalScroll.maxTop +
                        intViewportHeight
                    ) - 1 // <-- the causer is px tall, this counteracts that
                ),
                100000
            ) + "px"
        );
        element.elems.xScrollBarCauser.style.left = (
            // scrollbars only work for a certain range that's why the max
            //      is 100000
            Math.min(
                (
                    (
                        element.internalScroll.maxLeft +
                        intViewportWidth
                    ) - 1 // <-- the causer is px wide, this counteracts that
                ),
                100000
            ) + "px"
        );

        // render scroll location
        renderScrollLocation(element);
    }

    function renderHUD(element) {
        var oldTopHUDHeight;
        var newTopHUDHeight;
        var oldBottomHUDHeight;
        var newBottomHUDHeight;


        // save the current hud height so that we can compare it to after the
        //      changes have been made
        oldTopHUDHeight = element.elems.topHudContainer.offsetHeight;

        // if we have a hud template: add hud class that makes the hud element
        //      visible and populate the hud element
        if (element.internalTemplates.topHUD.trim()) {
            element.elems.root.classList.add('show-top-hud');
            element.elems.topHudContainer.innerHTML = (
                element.internalTemplates.topHUD
            );

            // save new HUD height to a variable for clarity
            newTopHUDHeight = element.elems.topHudContainer.offsetHeight;

            // update padding to make room for the hud
            element.elems.root.style.paddingTop = newTopHUDHeight + 'px';

        // else, we have no template: make hud invisible and clear hud element
        } else {
            element.elems.root.classList.remove('show-top-hud');
            element.elems.topHudContainer.innerHTML = '';
            newTopHUDHeight = 0;
        }


        // save the current hud height so that we can compare it to after the
        //      changes have been made
        oldBottomHUDHeight = element.elems.bottomHudContainer.offsetHeight;

        // if we have a hud template: add hud class that makes the hud element
        //      visible and populate the hud element
        if (element.internalTemplates.bottomHUD.trim()) {
            element.elems.root.classList.add('show-bottom-hud');
            element.elems.bottomHudContainer.innerHTML = (
                element.internalTemplates.bottomHUD
            );

            // save new HUD height to a variable for clarity
            newBottomHUDHeight = element.elems.bottomHudContainer.offsetHeight;

            // update padding to make room for the hud
            element.elems.root.style.paddingBottom = newBottomHUDHeight + 'px';

        // else, we have no template: make hud invisible and clear hud element
        } else {
            element.elems.root.classList.remove('show-bottom-hud');
            element.elems.bottomHudContainer.innerHTML = '';
            newBottomHUDHeight = 0;
        }


        // if there is a difference in one of the HUD heights, we want to
        //      re-render the dataviewport because the HUD's height affects
        //      the viewport height
        if (
            oldTopHUDHeight !== newTopHUDHeight ||
            oldBottomHUDHeight !== newBottomHUDHeight
        ) {
            element.internalDisplay.fullRenderRequired = true;
            renderScrollDimensions(element);
        }
    }

    // sometimes, the user will resize the selected columns to their respective
    //      header widths. this function is a shortcut for that functionality.
    function resizeColumnsToHeader(element, arrColumnIndexes) {
        var i;
        var len;
        var intIndex;

        // loop through each selected column
        i = 0;
        len = arrColumnIndexes.length;
        while (i < len) {
            intIndex = arrColumnIndexes[i];

            // set the width the min width, which is the same as the header
            //      width
            element.internalDisplay.columnWidths[intIndex] = (
                element.internalDisplay.minColumnWidths[intIndex]
            );

            i += 1;
        }

        // re-render location
        renderLocation(element);
    }

    function resizeColumnsToContent(element, arrColumnIndexes) {
        var i;
        var len;
        var elem_i;
        var elem_len;
        var intIndex;
        var arrElements;
        var controlElement;
        var intWidth;
        var jsnRange;

        var scopeElement;
        var controlText;
        var intTextWidth;

        var intColumnWidth;
        var intScopeElementWidth;

        // we only resize content that is rendered. to do that we need to
        //      know the current rendered range.
        jsnRange = element.internalDisplay.currentRange;

        // loop through each selected column
        i = 0;
        len = arrColumnIndexes.length;
        while (i < len) {
            intIndex = arrColumnIndexes[i];

            // we only pay attention to the content that has been rendered.
            //      so, only do anything if the current column is rendered.
            if (
                intIndex >= jsnRange.fromColumn &&
                intIndex <= jsnRange.toColumn
            ) {
                // console.log(intIndex);

                // start with the min width, any future width settings must be
                //      larger than this
                intWidth = element.internalDisplay.minColumnWidths[intIndex];

                // we need the old column width for a calculation
                intColumnWidth = element.internalDisplay.columnWidths[intIndex];

                // get the rendered cell elements for this column
                arrElements = xtag.query(
                    element.elems.dataViewport,
                    'gs-cell.table-cell[data-col-number="' + intIndex + '"]'
                );

                // loop through every data cell for this column
                elem_i = 0;
                elem_len = arrElements.length;
                while (elem_i < elem_len) {
                    // the goal is the find text and an element. once we've
                    //      found both of those, we can use GS.getTextWidth
                    //      to determine the text width and if that's larger
                    //      than the current width, set the current width to
                    //      the text width.
                    // the question is how are we going to find the element
                    //      and it's text seein' as how we can put whatever
                    //      we want in a cell... we'll have four different
                    //      options and each cell will be in one of them.
                    //          option the 1st: input text and it's parent
                    //          option the 2nd: textarea text and it's parent
                    //          option the 3rd: select text and it's parent
                    //          option the 4th: textContent and the cell

                    controlElement = xtag.query(
                        arrElements[elem_i],
                        'input, textarea, select'
                    )[0];

                    if (
                        controlElement &&
                        (
                            controlElement.nodeName === 'INPUT' ||
                            controlElement.nodeName === 'TEXTAREA' ||
                            controlElement.nodeName === 'SELECT'
                        )
                    ) {
                        scopeElement = controlElement.parentNode;
                        controlText = controlElement.value;

                    } else {
                        scopeElement = (
                            // this fixes label-wrapped cells
                            arrElements[elem_i].children[0] ||
                            arrElements[elem_i]
                        );
                        controlText = arrElements[elem_i].textContent;
                    }

                    // get text width using the scope element and the control
                    //      text
                    intTextWidth = GS.getTextWidth(
                        scopeElement,
                        controlText,
                        true // preserve whitespace
                    );

                    // there may be some padding between the scope element
                    //      and the cell element. so, we want to account for
                    //      that.
                    intScopeElementWidth = Math.ceil(
                        scopeElement.clientWidth - (
                            parseFloat(
                                GS.getStyle(scopeElement, 'padding-left')
                            ) +
                            parseFloat(
                                GS.getStyle(scopeElement, 'padding-right')
                            )
                        )
                    );

                    //console.log('test0:', controlElement);
                    //console.log('test1:', scopeElement);
                    //console.log('test2:', controlText);
                    //console.log('test3:', intWidth);
                    //console.log('test4:', intTextWidth);
                    //console.log('test5:', intColumnWidth);
                    //console.log('test6:', intScopeElementWidth);
                    //console.log(
                    //    'test7:',
                    //    (intColumnWidth - intScopeElementWidth)
                    //);
                    //console.log(
                    //    'test8:',
                    //    GS.getStyle(scopeElement, 'padding-left')
                    //);
                    //console.log(
                    //    'test9:',
                    //    GS.getStyle(scopeElement, 'padding-right')
                    //);

                    // add padding to text width
                    intTextWidth += (intColumnWidth - intScopeElementWidth);

                    // add an arbituary amount to deal with small imperfections
                    intTextWidth += 10;

                    // if the new text width is greater than the currently
                    //      proposed width, set the currently proposed width
                    //      to the new text width
                    if (intTextWidth > intWidth) {
                        intWidth = intTextWidth;
                    }

                    elem_i += 1;
                }

                // set the width
                element.internalDisplay.columnWidths[intIndex] = intWidth;
            }

            i += 1;
        }

        // re-render location
        renderLocation(element);
    }

// ############################################################################
// ############################# LOADER FUNCTIONS #############################
// ############################################################################

    // loaders are appended to the end of the loader list, this is not where
    //      they belong. so, this function takes a loader element (which has
    //      already been appended) and moves it to the top of the loader
    //      container element
    function moveLoaderToTop(element, loaderElement) {
        // ### NEED CODING ###
    }

    // because of the way the loader container works, we need to set a margin
    //      so that the loader becomes visible
    function adjustLoaderWidth(element, loaderElement) {
        var loaderContent;

        // get the wrapped content
        loaderContent = loaderElement.children[0];

        // set the marginLeft to counteract the width
        loaderContent.style.marginLeft = (
            '-' + (loaderContent.offsetWidth + 10) + 'px'
        );

        // old, required getTextWidth which is slow
        //var intWidth;

        //// we calculate the width and store it in a variable
        //intWidth = GS.getTextWidth(element, loaderElement.textContent);

        //// let's add a little padding
        //intWidth += 25;

        //// set loader width and a reverse margin so that it moves to the left
        ////      the same amount
        //loaderElement.style.width = intWidth + 'px';
        //loaderElement.style.marginLeft = '-' + intWidth + 'px';
    }

    function addLoader(element, strID, strContent) {
        var loaderElement;

        // create loader element
        loaderElement = document.createElement('div');
        loaderElement.classList.add('table-loader-wrapper');
        loaderElement.innerHTML = (
            '<div class="table-loader">' + strContent + '</div>'
        );

        // append loader element to loader container
        element.elems.loaderContainer.appendChild(loaderElement);

        // append new loader imformation to a place where we can retrieve it
        element.internalLoaders.loaderIDs.push(strID);
        element.internalLoaders.loaderElements.push(loaderElement);

        // adjust loader width so that it displays all on one line
        adjustLoaderWidth(element, loaderElement);

        // move loader to top
        moveLoaderToTop(element, loaderElement);

        //console.log('added loader', loaderElement);
    }

    function removeLoader(element, strID, strFinishedContent) {
        var loaderIndex;
        var loaderElement;
        var fadeOut;
        var removeFunction;

        // get index of loader in loader array
        loaderIndex = element.internalLoaders.loaderIDs.indexOf(strID);

        // get loader element using index
        loaderElement = element.internalLoaders.loaderElements[loaderIndex];

        // remove loader from loader arrays immediately so that if another
        //      loader is removed with the same name, we won't remove the same
        //      one twice
        element.internalLoaders.loaderIDs.splice(loaderIndex, 1);
        element.internalLoaders.loaderElements.splice(loaderIndex, 1);

        // define a fade out function so that we only need to write the code
        //      once.
        fadeOut = function () {
            // add fade out class
            loaderElement.classList.add('table-fade-out');

            // we want to be able to remove this function to free the memory
            removeFunction = function () {
                // if the loader container is still in use
                if (
                    element.elems &&
                    element.elems.loaderContainer
                ) {
                    // remove the loader
                    element.elems.loaderContainer.removeChild(loaderElement);
                }

                // clear function to free up memory
                removeFunction = null;
            };

            // remove loader from loader container after fade out animation
            //      is complete
            setTimeout(removeFunction, 1000);

            // clear function to free up memory
            fadeOut = null;
        };

        // if there is strFinishedContent, we need to change the content then
        //      fade out
        if (strFinishedContent) {
            // switch content to loader content
            loaderElement.children[0].innerHTML = strFinishedContent;

            // adjust loader width so that it displays all on one line
            adjustLoaderWidth(element, loaderElement);

            // move loader to top
            moveLoaderToTop(element, loaderElement);

            // fade out after some time has passed to read the new content
            setTimeout(fadeOut, 1000);

        // else, just fade loader out
        } else {
            fadeOut();
        }
    }

// ############################################################################
// ############################## DATA FUNCTIONS ##############################
// ############################################################################

    function dataSELECTcallback(element) {
        var intDifference;
        var i;
        var len;
        var bolFirstLoad;

        // we need to know if this was the first load
        bolFirstLoad = (element.internalData.bolFirstLoadFinished === false);

        // we may need to add or remove some record heights
        intDifference = (
            element.internalDisplay.recordHeights.length -
                element.internalData.records.length
        );

        // sometimes a record disappears between selects, someone else might
        //      delete a record and then you refresh, in this case we need to
        //      remove a enough records heights to make up the difference
        if (intDifference > 0) {
            i = 0;
            len = intDifference;
            while (i < len) {
                element.internalDisplay.recordHeights.pop();
                i += 1;
            }

        // there's a possibility of a record being added without an accompanying
        //      record height, if that's happened we add enough record heights
        //      to make up the difference
        } else if (intDifference < 0) {
            i = 0;
            len = Math.abs(intDifference);
            while (i < len) {
                element.internalDisplay.recordHeights.push(
                    element.internalDisplay.defaultRecordHeight
                );
                i += 1;
            }
        }

        // make sure that everything knows the first load is over
        if (element.internalData.bolFirstLoadFinished === false) {
            element.internalData.bolFirstLoadFinished = true;
        }

        // re-render scroll location because adding records changes scroll
        //      heights, and so that we can show the new data
        element.internalDisplay.fullRenderRequired = true;
        renderScrollDimensions(element);

        // sometimes, developers want to have the gs-table select and focus
        //      after it first loads
        if (
            element.hasAttribute('focus-on-load') &&
            bolFirstLoad &&
            // if we are already focused, then ignore
            element.internalSelection.ranges.length === 0
        ) {
            // if there is data, select the first cell
            if (element.internalData.records.length > 0) {
                element.internalSelection.ranges = [
                    {
                        "start": {
                            "row": 0,
                            "column": 0
                        },
                        "end": {
                            "row": 0,
                            "column": 0
                        },
                        "negator": false
                    }
                ];

                focusIntoCell(
                    element,
                    0, // record
                    0  // column
                );

            // sometimes, there's no data to select, select the "all"
            //      selector if it's visible
            } else if (
                element.internalDisplay.recordSelectorVisible &&
                element.internalDisplay.headerVisible
            ) {
                element.internalSelection.ranges = [
                    {
                        "start": {
                            "row": "header",
                            "column": "selector"
                        },
                        "end": {
                            "row": "header",
                            "column": "selector"
                        },
                        "negator": false
                    }
                ];
            }

            renderSelection(element);
        }
        GS.triggerEvent(element, 'after_select');
    }
    function dataINSERTcallback(element) {
        // re-render scroll location because adding records changes scroll
        //      heights, and so that we can show the new data
        element.internalDisplay.fullRenderRequired = true;
        renderScrollDimensions(element);

        // scroll to the bottom so that the user can see the newly created
        //      records without having to scroll
        // element.internalScroll.top = (
        //     element.internalScroll.maxTop - (
        //         element.elems.dataViewport.clientHeight - (
        //             element.internalScrollOffsets.top +
        //             element.internalScrollOffsets.bottom +
        //             element.internalDisplay.defaultRecordHeight
        //         )
        //     )
        // );
        element.goToLine('last');

        // re-render scroll location because we changed the scrollTop
        renderScrollLocation(element);
    }
    function dataUPDATEcallback(element) {
        // re-render location so that if changing the data resulted in
        //      calculated columns changing or some other unknown change
        //      occurs: the user will see the changes
        element.internalDisplay.fullRenderRequired = true;
        renderLocation(element);
        //console.log('In here!!');
    }
    function dataDELETEcallback(element) {
        // clear selection because the stuff that the user selected has
        //      now been deleted
        element.internalSelection.ranges = [];

        // re-render scroll location because removing records changes scroll
        //      heights
        element.internalDisplay.fullRenderRequired = true;
        renderScrollDimensions(element);
    }

    function getWhereClause(element) {
        var i;
        var len;
        var arrFilter;
        var strColumn;
        var filter_i;
        var filter_len;
        var strFilter;
        var jsnFilter;
        var strListWhere;

        var arrOldColumnNames;
        var arrOldColumnTypes;
        var arrOldColumnFilterStatuses;
        var arrOldColumnFilters;
        var arrOldColumnListFilters;

        var strWhere;
        var strUserWhere;
        var strWhereColumn;

        // we need to include any where clauses added be the developer.
        //      this where clause is templated with the querystring.
        strWhere = GS.templateWithQuerystring(
            element.getAttribute('where') || '1=1'
        );

        // add in user filters, if any
        if (element.getAttribute('session-filter')) {
            strWhere = '(' + element.getAttribute('session-filter') + ')';
            strWhere += (
                strWhere
                    ? ' AND ' + strWhere
                    : ''
            );
        }

        // add in a column or qs where, if any

        // we need to be able to handle header-line relationships, this code
        //      uses the "column", "qs" and "value" attributes to formulate
        //      a where clause
        if (
            element.getAttribute('value') &&
            (
                element.getAttribute('column') ||
                element.getAttribute('qs')
            )
        ) {
            strWhereColumn = (
                element.getAttribute('child-column') ||
                element.getAttribute('column') ||
                element.getAttribute('qs')
            );

            // if the value is not a number, we need to do a string
            //      comparison in the where clause.
            if (isNaN(element.value)) {
                strWhere = (
                    'CAST(' +
                    strWhereColumn + ' AS ' +
                    GS.database.type.text +
                    ') = ' +
                    'CAST(' +
                    '$WhereQUOTE$' + (element.value) + '$WhereQUOTE$ AS ' +
                    GS.database.type.text +
                    ')'
                );
                strWhere += (
                    strWhere !== ''
                        ? ' AND (' + strWhere + ')'
                        : ''
                );

            // if the value is a number, we can do simpler, number comparison
            } else {
                strWhere = strWhereColumn + '=' + (element.value);
                strWhere += (
                    strWhere !== ''
                        ? ' AND (' + strWhere + ')'
                        : ''
                );
            }
        }

        arrOldColumnNames = element.internalData.columnNames;
        arrOldColumnTypes = element.internalData.columnTypes;
        arrOldColumnFilterStatuses = element.internalData.columnFilterStatuses;
        arrOldColumnFilters = element.internalData.columnFilters;
        arrOldColumnListFilters = element.internalData.columnListFilters;

        // we want the user to be able to filter a column, so here we'll look
        //      at what the user set for each column and prepend to the where
        //      clause
        strUserWhere = '';
        i = 0;
        len = arrOldColumnFilters.length;
        while (i < len) {
            arrFilter = arrOldColumnFilters[i];
            strColumn = arrOldColumnNames[i];

            // only filter if this column's filters haven't been toggled off
            if (arrOldColumnFilterStatuses[i] === 'on') {
                filter_i = 0;
                filter_len = arrFilter.length;
                while (filter_i < filter_len) {
                    strFilter = arrFilter[filter_i].text;
                    strUserWhere += (
                        strUserWhere
                            ? ' AND '
                            : ''
                    );

                    strUserWhere += strFilter;
                    filter_i += 1;
                }
            }

            i += 1;
        }

        //console.log('old filter:', arrOldColumnListFilters[0]);

        i = 0;
        len = arrOldColumnListFilters.length;
        while (i < len) {
            jsnFilter = arrOldColumnListFilters[i];
            strColumn = arrOldColumnNames[i];
            strListWhere = '';

            // only filter if this column's filters haven't been toggled off
            //      and there is a filter
            if (
                arrOldColumnFilterStatuses[i] === 'on' &&
                jsnFilter.type &&
                jsnFilter.values
                //jsnFilter.values.length > 0
                //  ^-- when nothing is chosen, we want nothing to match. this
                //      line was preventing the WHERE from being generated
            ) {
                if (jsnFilter.type === 'inclusion') {
                    filter_i = 0;
                    filter_len = jsnFilter.values.length;
                    while (filter_i < filter_len) {
                        strListWhere += (
                            strListWhere
                                ? ' OR '
                                : ''
                        );

                        strListWhere += (
                            strColumn +
                            ' = CAST($werequote$' +
                            jsnFilter.values[filter_i] +
                            '$werequote$ AS ' + arrOldColumnTypes[i] +
                            ')'
                        );
                        filter_i += 1;
                    }

                    //console.log(filter_i, filter_len);

                    if (filter_len === 0) {
                        strListWhere = '1=2';
                    }

                } else if (jsnFilter.type === 'exclusion') {
                    if (jsnFilter.values.length > 0) {
                        filter_i = 0;
                        filter_len = jsnFilter.values.length;
                        while (filter_i < filter_len) {
                            strListWhere += (
                                strListWhere
                                    ? ' AND '
                                    : ''
                            );

                            strListWhere += (
                                strColumn +
                                ' != CAST($werequote$' +
                                jsnFilter.values[filter_i] +
                                '$werequote$ AS ' + arrOldColumnTypes[i] +
                                ')'
                            );
                            filter_i += 1;
                        }
                    }
                }

                // if we are excluding nothing the blank code causes
                //      the where to just be "WHERE column is blank"
                if (
                    (
                        strListWhere &&
                        !(
                            jsnFilter.type === 'exclusion' &&
                            jsnFilter.values.length === 0
                        )
                    ) ||
                    jsnFilter.blanks === false
                ) {
                    // we need to handle blank values specially
                    if (strListWhere) {
                        strListWhere = '(' + strListWhere + ') ';
                    }

                    if (jsnFilter.blanks === true) {
                        if (strListWhere) {
                            strListWhere += ' OR';
                        }

                        strListWhere += (
                            ' NULLIF(' +
                                'CAST(' +
                                    strColumn + ' AS ' +
                                    GS.database.type.text +
                                '), \'\') IS NULL'
                        );
                    } else {
                        if (strListWhere) {
                            strListWhere += ' AND';
                        }

                        strListWhere += (
                            ' NULLIF(' +
                                'CAST(' +
                                    strColumn + ' AS ' +
                                    GS.database.type.text +
                                '), \'\') IS NOT NULL'
                        );
                    }

                    // console.log(
                    //     jsnFilter,
                    //     strListWhere
                    // );

                    strUserWhere += (
                        strUserWhere
                            ? ' AND '
                            : ''
                    );
                    strUserWhere += '(' + strListWhere + ')';
                }
            }

            i += 1;
        }

        // if a where is defined by the dev, put it after our new where
        if (strUserWhere && strWhere) {
            strWhere = strUserWhere + ' AND (' + strWhere + ')';

        // if there is no where set by the developer, our new where will be
        //      the only one
        } else if (strUserWhere) {
            strWhere = strUserWhere;
        }

        return strWhere;
    }

    function databaseWSSELECT(element) {
        var socket;
        var strSchema;
        var strObject;
        var strWhere;
        var strOrd;
        var strLimit;
        var strOffset;
        var strReturn;
        var strWhereColumn;
        var bolLoadNewRecordHeights;
        var intRecordHeight;

        var arrOldColumnNames;
        var arrOldColumnTypes;
        var arrOldColumnFilterStatuses;
        var arrOldColumnFilters;
        var arrOldColumnListFilters;
        var arrOldColumnOrders;
        var arrOldDisplayColumns;

        var i;
        var len;
        var strFilter;
        var strSort;
        var strColumn;
        var strUserOrd;
        var strUserWhere;
        var strListWhere;
        var filter_i;
        var filter_len;
        var arrFilter;
        var jsnFilter;
        var index;
        var arrRecords;
        var arrRecordHeights;

        socket = getSocket(element);
        strSchema = GS.templateWithQuerystring(
            element.getAttribute('schema') || ''
        );
        strObject = GS.templateWithQuerystring(
            element.getAttribute('object') || ''
        );
        strWhere = getWhereClause(element);
        strOrd = GS.templateWithQuerystring(
            element.getAttribute('ord') || ''
        );
        strLimit = GS.templateWithQuerystring(
            element.getAttribute('limit') || ''
        );
        strOffset = GS.templateWithQuerystring(
            element.getAttribute('offset') || '0'
        );
        strReturn = '*';

        //// disabled, hide or not the pageinate buttons
        //if (strLimit === '') {
        //    element.pageLeftButton.setAttribute('hidden', '');
        //    element.pageRightButton.setAttribute('hidden', '');
        //} else if (strOffset === '' || strOffset === '0') {
        //    element.pageLeftButton.setAttribute('disabled', '');
        //}

        // if no records heights exist: we need to load record heights
        bolLoadNewRecordHeights =
                (element.internalDisplay.recordHeights.length === 0);

        // we need to create records with the default record height attached to
        //      them, so we'll use the "default-record-height" attribute
        intRecordHeight = (
            parseInt(element.getAttribute('default-record-height'), 10) ||
            intDefaultRecordHeight
        );

        // we need to make sure that no old data persists across select calls,
        //      so we'll clear out the internal data object
        element.internalData.records = [];

        // we need to re-link the new column list with the old column sorts,
        //      filters and filter statuses
        arrOldColumnNames = element.internalData.columnNames;
        arrOldColumnTypes = element.internalData.columnTypes;
        arrOldColumnFilterStatuses = element.internalData.columnFilterStatuses;
        arrOldColumnFilters = element.internalData.columnFilters;
        arrOldColumnListFilters = element.internalData.columnListFilters;
        arrOldColumnOrders = element.internalData.columnOrders;
        arrOldDisplayColumns = element.internalDisplay.dataColumnName;

        // we want the user to be able to sort on a column, so here we'll look
        //      at what the user set for each column and prepend to the order
        //      by clause

        // we'll loop through the display column associations and see if any
        //      of those columns have been sorted
        strUserOrd = '';
        i = 0;
        len = arrOldDisplayColumns.length;
        while (i < len) {
            strColumn = arrOldDisplayColumns[i];

            if (strColumn) {
                index = arrOldColumnNames.indexOf(strColumn);
                strSort = arrOldColumnOrders[index];

                if (strSort === 'asc') {
                    strUserOrd += (
                        strUserOrd
                            ? ', '
                            : ''
                    );
                    strUserOrd += strColumn + ' ASC';

                } else if (strSort === 'desc') {
                    strUserOrd += (
                        strUserOrd
                            ? ', '
                            : ''
                    );
                    strUserOrd += strColumn + ' DESC';
                }
            }
            i += 1;
        }

        //  ,---- commented out because it did not take column order into
        //  V           account
        //strUserOrd = '';
        //i = 0;
        //len = arrOldColumnOrders.length;
        //while (i < len) {
        //    strSort = arrOldColumnOrders[i];
        //    strColumn = arrOldColumnNames[i];

        //    if (strSort === 'asc') {
        //        strUserOrd += (
        //            strUserOrd
        //                ? ', '
        //                : ''
        //        );
        //        strUserOrd += strColumn + ' ASC';

        //    } else if (strSort === 'desc') {
        //        strUserOrd += (
        //            strUserOrd
        //                ? ', '
        //                : ''
        //        );
        //        strUserOrd += strColumn + ' DESC';
        //    }

        //    i += 1;
        //}

        // if an order by is defined by the dev, put it after our new order by
        if (strUserOrd && strOrd) {
            strOrd = strUserOrd + ', ' + strOrd;

        // if there is no orderby set by the developer, our new order by will be
        //      the only one
        } else if (strUserOrd) {
            strOrd = strUserOrd;
        }

        console.time('data load');

        // storing references to the arrays for faster access
        arrRecords = element.internalData.records;
        arrRecordHeights = element.internalDisplay.recordHeights;

        // we need the user to know that the envelope is re-fetching data,
        //      so we'll put a loader on
        addLoader(element, 'data-select', 'Loading Data...');
        GS.requestSelectFromSocket(
            socket,
            strSchema,
            strObject,
            strReturn,
            strWhere,
            strOrd,
            strLimit,
            strOffset,
            function (data, error) {
                //var i;
                //var len;
                var col_i;
                var col_len;
                var strCol;
                //var index;
                var strRecord;
                var strMessage;
                //var strChar;

                if (!error) {
                    // if this is the first callback, we need to save
                    //      the column names and types and we need to
                    //      re-link the filters, sorts and filter statuses
                    //
                    // this was below in the else, but requestSelectFromSocket
                    //      will only callback once if there are no records
                    //      - Nunzio 5/29/2017
                    if (data.intCallback === 0) {
                        // clear old column arrays to make remove for any
                        //      changes to the column list
                        element.internalData.columnNames = [];
                        element.internalData.columnTypes = [];
                        element.internalData.columnFilterStatuses = [];
                        element.internalData.columnFilters = [];
                        element.internalData.columnListFilters = [];
                        element.internalData.columnOrders = [];

                        // future mike, you need to make is so that the
                        //      column name, filter and sort arrays are
                        //      retained across select calls.
                        // past mike, sounds good, I'll use the old column
                        //      list to get the old sorts filters, and
                        //      filter statuses
                        col_i = 0;
                        col_len = data.arrDecodedColumnNames.length;
                        while (col_i < col_len) {
                            strCol = data.arrDecodedColumnNames[col_i];
                            index = arrOldColumnNames.indexOf(strCol);

                            element.internalData.columnNames.push(
                                strCol
                            );
                            element.internalData.columnTypes.push(
                                data.arrDecodedColumnTypes[col_i]
                            );

                            // if we've got old values from the select,
                            //      bring them over to the new arrays
                            if (index > -1) {
                                element.internalData
                                    .columnFilterStatuses.push(
                                        arrOldColumnFilterStatuses[index]
                                    );
                                element.internalData
                                    .columnFilters.push(
                                        arrOldColumnFilters[index]
                                    );
                                element.internalData
                                    .columnListFilters.push(
                                        arrOldColumnListFilters[
                                            index
                                        ]
                                    );
                                element.internalData
                                    .columnOrders.push(
                                        arrOldColumnOrders[index]
                                    );

                            // else, add empty sort, filter and filter
                            //      status
                            } else {
                                element.internalData
                                    .columnFilterStatuses.push('on');
                                element.internalData
                                    .columnFilters.push([]);
                                element.internalData
                                    .columnListFilters.push({});
                                element.internalData
                                    .columnOrders.push('neutral');
                            }

                            col_i += 1;
                        }
                    }

                    // we need to remove the loader at some point, if we see
                    //      the last message of the select: remove loader and
                    //      render
                    if (data.strMessage === 'TRANSACTION COMPLETED') {
                        //// required for v3 test#1
                        //element.internalData.records = (
                        //    arrRecords
                        //);
                        //element.internalDisplay.recordHeights = (
                        //    arrRecordHeights
                        //);

                        // back to non-test code
                        console.timeEnd('data load');
                        console.log(
                            'record count:',
                            element.internalData.records.length
                        );
                        removeLoader(element, 'data-select', 'Data Loaded');
                        dataSELECTcallback(element);

                    // we need to capture the records and columns and store
                    //      them in the internal data
                    } else {
                        if (
                            data.intCallback === 3 &&
                            element.internalData.bolFirstLoadFinished === false
                        ) {
                            //// required for v3 test#1
                            //element.internalData.records = (
                            //    arrRecords
                            //);
                            //element.internalDisplay.recordHeights = (
                            //    arrRecordHeights
                            //);

                            // re-render scroll location because adding records
                            //      changes scroll heights, and so that we can
                            //      show the new data
                            element.internalDisplay.fullRenderRequired = true;
                            renderScrollDimensions(element);
                        }

                        // we need to parse the TSV into records and push them
                        //      to the internalData "records" array
                        // now, we have an advantage in that Envelope Websocket
                        //      data is already encoded in the correct format
                        //      and all we have to is split on \n
                        // also, Envelope Websocket data always ends in \n so
                        //      the loop doesn't need to do anything special
                        //      to get the last record
                        strMessage = data.strMessage;
                        strRecord = '';

                        //// splitter test#1 v3, slower than v2
                        //var arrRecord = strMessage.split('\n');
                        //arrRecord.pop();
                        //arrRecords = arrRecords.concat(arrRecord);
                        //if (bolLoadNewRecordHeights) {
                        //    i = 0;
                        //    len = (
                        //        (
                        //            arrRecords.length -
                        //            arrRecordHeights.length
                        //        ) +
                        //        1
                        //    );
                        //    while (i < len) {
                        //        arrRecordHeights.push(intRecordHeight);
                        //        i += 1;
                        //    }
                        //}

                        // splitter v2, faster than v1 by 1 third
                        //if (window.asdfasdf === true) {
                        //    //console.log(strMessage);
                        //}
                        i = 0;
                        while (i < 15) {
                            index = strMessage.indexOf('\n');
                            strRecord = strMessage.substring(0, index);
                            strMessage = strMessage.substring(index + 1);

                            if (strRecord !== '' || strMessage !== '') {
                                arrRecords.push(strRecord);

                                //if (window.asdfasdfasdf === true) {
                                //    //console.log(strRecord);
                                //}
                                if (bolLoadNewRecordHeights) {
                                    arrRecordHeights.push(intRecordHeight);
                                }
                            } else {
                                break;
                            }

                            i += 1;
                        }

                        //// splitter v1, replaced because it was slow
                        //strMessage = data.strMessage;
                        //strRecord = '';
                        //i = 0;
                        //len = strMessage.length;
                        //while (i < len) {
                        //    strChar = strMessage[i];

                        //    if (strChar === '\n') {
                        //        element.internalData.records.push(strRecord);

                        //        if (bolLoadNewRecordHeights) {
                        //            element.internalDisplay
                        //                .recordHeights
                        //                .push(intRecordHeight);
                        //        }

                        //        strRecord = '';
                        //    } else {
                        //        strRecord += strChar;
                        //    }

                        //    i += 1;
                        //}
                    }

                // we need to make sure that the user knows that the select
                //      failed and we need to prevent using any old select
                //      info, so we'll re-render, remove the loader and pop
                //      up an error
                } else {
                    dataSELECTcallback(element);
                    removeLoader(element, 'data-select', 'Data Failed To Load');
                    GS.webSocketErrorDialog(data);
                }
            }
        );
    }
    function databaseWSINSERT(element, strMode, jsnInsert) {
        var rec_i;
        var rec_len;
        var col_i;
        var col_len;
        var strColumn;

        var strPostfix;
        var insertStep;
        var beforeEvent;

        var arrPK;
        var arrSeq;
        var strPK;
        var strSeq;
        var strInsertColumns;
        var strInsertData;

        var strSchema;
        var strObject;
        var strReturn;
        var strNullString;
        var intRecordHeight;

        // get schema and object attributes and get the return column list
        strSchema = GS.templateWithQuerystring(
            element.getAttribute('schema') || ''
        );
        strObject = GS.templateWithQuerystring(
            element.getAttribute('object') || ''
        );

        // the return column list must be defined the same as the column list
        //      that we store the data with, so we define strReturn using the
        //      column list
        strReturn = '';
        col_i = 0;
        col_len = element.internalData.columnNames.length;
        while (col_i < col_len) {
            strReturn += (
                strReturn
                    ? '\t'
                    : ''
            );
            strReturn += element.internalData.columnNames[col_i].replace(/(\\)/g, '\\\\');
            col_i += 1;
        }

        // we need to know if the developer has specified any special primary
        //      key columns and/or sequence columns
        strPK = GS.templateWithQuerystring(
            element.getAttribute('pk') || ''
        );
        strSeq = GS.templateWithQuerystring(
            element.getAttribute('seq') || ''
        );
        arrPK = strPK.split(/[\s]*,[\s]*/);
        arrSeq = strSeq.split(/[\s]*,[\s]*/);

        // we want the null string to be configurable, so we'll read the
        //      "null-string" attribute to get the null string
        // if the "null-string" attribute is present, use the contents
        //      or coalesce to empty string
        if (element.hasAttribute('null-string')) {
            strNullString = element.getAttribute('null-string') || '';

        // else, null string is left up to the encoding function
        } else {
            strNullString = undefined;
        }

        // we need to create records with the default record height attached to
        //      them, so we'll use the "default-record-height" attribute
        intRecordHeight = (
            parseInt(element.getAttribute('default-record-height'), 10) ||
            intDefaultRecordHeight
        );

        // there are three different ways to insert records:
        //      1) typing into the insert record
        //      2) filling insert dialog
        //      3) pasting into the insert record.
        //      types 1 and 2 are "single-record" inserts
        //      type 3 is a "multi-record" insert

        // "single-record"
        if (strMode === 'single-record') {
            // if there is an addin value and that column was not already in the
            //      insert, add the value to the insert
            if (
                jsnInsert.data.addin &&
                jsnInsert.data.addin.link_column &&
                jsnInsert.data.addin.link_value &&
                jsnInsert
                    .data
                    .columns
                    .indexOf(jsnInsert.data.addin.link_column) === -1
            ) {
                strColumn = jsnInsert.data.addin.link_column;

                jsnInsert.data.columns.push(
                    jsnInsert.data.addin.link_column
                );
                jsnInsert.data.values[strColumn] = (
                    jsnInsert.data.addin.link_value
                );
            }

            strInsertColumns = '';
            strInsertData = '';
            col_i = 0;
            col_len = jsnInsert.data.columns.length;
            while (col_i < col_len) {
                strColumn = jsnInsert.data.columns[col_i].replace(/(\\)/g, '\\\\');

                strInsertColumns += (
                    strInsertColumns
                        ? '\t'
                        : ''
                );
                strInsertColumns += strColumn;

                strInsertData += (
                    strInsertData
                        ? '\t'
                        : ''
                );
                strInsertData += GS.encodeForTabDelimited(
                    (jsnInsert.data.values[strColumn] || 'NULL'),
                    strNullString
                );

                col_i += 1;
            }

            // append a return after the end of the insert data because
            //      the envelope expects it
            strInsertData += '\n';

        // "multi-record" assumes that:
        //      1) the data is a dump
        //      2) isn't stored anywhere
        //      3) only affects the currently selected insert record columns
        //              unless none are selected, in that case: all columns
        } else if (strMode === 'multi-record') {
            // if there is an addin value and that column was not already in the
            //      insert, add the value to the insert
            if (
                jsnInsert.data.addin &&
                jsnInsert.data.addin.link_column &&
                jsnInsert.data.addin.link_value &&
                jsnInsert
                    .data
                    .columns
                    .indexOf(jsnInsert.data.addin.link_column) === -1
            ) {
                strColumn = jsnInsert.data.addin.link_column;

                jsnInsert.data.columns.push(
                    jsnInsert.data.addin.link_column
                );

                rec_i = 0;
                rec_len = jsnInsert.data.columns.length;
                while (rec_i < rec_len) {
                    jsnInsert.data.values[rec_i] += '\t';
                    jsnInsert.data.values[rec_i] += GS.encodeForTabDelimited(
                        jsnInsert.data.addin.link_value
                    );
                    rec_i += 1;
                }
            }

            // build up insert column list
            strInsertColumns = '';
            col_i = 0;
            col_len = jsnInsert.data.columns.length;
            while (col_i < col_len) {
                strColumn = jsnInsert.data.columns[col_i].replace(/(\\)/g, '\\\\');

                strInsertColumns += (
                    strInsertColumns
                        ? '\t'
                        : ''
                );
                strInsertColumns += strColumn;

                col_i += 1;
            }

            // build up insert payload by appending each record with a \n in
            //      front of it
            strInsertData = '';
            rec_i = 0;
            rec_len = jsnInsert.data.values.length;
            while (rec_i < rec_len) {
                strInsertData += jsnInsert.data.values[rec_i];
                strInsertData += '\n';
                rec_i += 1;
            }

            // no need to append a return after the end of the insert data
            //      because the loop that builds up the record list above
            //      already appends the \n to the end

        } else {
            throw 'GS-TABLE Error: Invalid insert type: "' + strMode + '".';
        }

        // regardless of insert mode, we need a list of columns that uniquely
        //      identifies a record
        col_i = 0;
        col_len = arrSeq.length;
        while (col_i < col_len) {
            if (jsnInsert.data.columns.indexOf(arrSeq[col_i]) !== -1) {
                arrSeq[col_i] = '';
            }
            col_i += 1;
        }

        strPK = '';
        col_i = 0;
        col_len = arrPK.length;
        while (col_i < col_len) {
            strPK += (
                strPK
                    ? '\t'
                    : ''
            );
            strPK += GS.encodeForTabDelimited(arrPK[col_i], strNullString);
            col_i += 1;
        }

        strSeq = '';
        col_i = 0;
        col_len = arrSeq.length;
        while (col_i < col_len) {
            strSeq += (
                col_i === 0
                    ? ''
                    : '\t'
            );
            if (jsnInsert.data.columns.indexOf(arrPK[col_i]) === -1) {
                strSeq += arrSeq[col_i] || '';
            }
            col_i += 1;
        }

        // combine columns and data for the websocket call
        strInsertData = strInsertColumns + '\n' + strInsertData;

        // trigger a "before_insert" event so that the page has a
        //      chance to cancel the update using event.preventDefault()
        beforeEvent = GS.triggerEvent(element, 'before_insert', {
            "schema": strSchema,
            "object": strObject,
            "insertMode": strMode,
            "insertData": jsnInsert.data
        });

        // if the user prevents the default on the "before_update"
        //      event, prevent the execution of the following update code
        if (beforeEvent.defaultPrevented) {
            return;
        }

        // the insert step is defined as a sub function because if there
        //      are multiple records involved in this update, we want to open
        //      a dialog before we continue, else we want to immediately update
        insertStep = function () {
            var insertedRecords;

            // define "insertedRecords" as empty so that we can append to it
            //      without worrying about an "undefined" at the beginning of
            //      the string
            insertedRecords = '';

            // gotta let the user know that an insert is in progress
            addLoader(element, 'data-insert', 'Inserting Data...');
            console.log(strSchema,
                strObject,
                strReturn,
                strPK,
                strSeq,
                strInsertData);
            // begin the websocket insert
            GS.requestInsertFromSocket(
                getSocket(element),
                strSchema,
                strObject,
                strReturn,
                strPK,
                strSeq,
                strInsertData,
                // transaction start callback
                function (data, error) {
                    // insert failed, remove loader and popup error dialog
                    if (error) {
                        removeLoader(element, 'data-insert', 'Insert Failed');
                        GS.webSocketErrorDialog(data);
                    }
                },

                // transaction ready for commit/rollback callback
                // "ignore" is a placeholder for "transID" and it tells JSLINT
                //      that it is an unused variable
                function (data, error, ignore, commit, rollback) {
                    if (!error) {
                        // insert made it through: commit the update
                        if (data === 'TRANSACTION COMPLETED') {
                            commit();

                        // else: we've just received a data packet containing
                        //      the inserted records as they appear in the
                        //      database
                        } else {
                            // save this data so that we can use it to update
                            //      the internal data if the insert makes it
                            //      through
                            insertedRecords += data;
                        }
                    // insert failed: popup an error and rollback
                    } else {
                        GS.webSocketErrorDialog(data);
                        rollback();
                    }
                },

                // transaction commit/rollback finished callback
                function (strAnswer, data, error) {
                    var arrRecords;
                    var i;
                    var len;

                    // the over-the-network part of the update has finished,
                    //      remove the loader now so that if there is an
                    //      execution error below, the loader wont be stuck
                    //      visible
                    removeLoader(
                        element,
                        'data-insert',
                        (
                            error
                                ? 'Insert Failed'
                                : 'Insert Successful'
                        )
                    );

                    if (!error) {
                        // insert was successfully commited: update internal
                        //      data and re-render
                        if (strAnswer === 'COMMIT') {
                            // refresh internal data by replace each internal
                            //      record that was affected with it's new
                            //      version
                            arrRecords = insertedRecords.split('\n');
                            i = 0;
                            len = arrRecords.length - 1; // the - 1 is because
                                                         //   of the extra \n at
                                                         //   the end of the
                                                         //   returned records
                            while (i < len) {
                                element.internalData
                                    .records.push(arrRecords[i]);
                                element.internalDisplay
                                    .recordHeights.push(intRecordHeight);
                                i += 1;
                            }

                            // standard after-insert behaviour
                            dataINSERTcallback(element);

                            // trigger an after insert event
                            GS.triggerEvent(element, 'after_insert', {
                                "insertMode": strMode,
                                "insertData": jsnInsert.data
                            });
                        }
                    // insert failed: popup an error
                    } else {
                        GS.webSocketErrorDialog(data);
                    }
                }
            );
        };

        // we don't want to be able to insert of there's no insert data, so if
        //      we're doing a multi record insert with no records to insert OR
        //      any kind of insert with no columns: error
        if (
            (
                strMode !== 'single-record' &&
                jsnInsert.data.values.length === 0
            ) ||
            jsnInsert.data.columns.length === 0
        ) {
            GS.msgbox(
                'Nothing To Create',
                '<center>' +
                        'Please input data to create.' +
                        '</center>',
                ['Ok']
            );

        // sometimes, the insert has already been confirmed by the user. if it
        //      has, just carry on and insert
        } else if (jsnInsert.insertConfirmed === true) {
            insertStep();

        // else, we need to confirm with the user and then create the records
        } else {
            strPostfix = (
                (
                    strMode === 'single-record' ||
                    jsnInsert.data.values.length === 1
                )
                    ? 'this record'
                    : 'these records'
            );
            GS.msgbox(
                'Are you sure...',
                '<center>' +
                        'Are you sure you want to create ' + strPostfix + '?' +
                        '</center>',
                [
                    'No',
                    'Yes'
                ],
                function (strAnswer) {
                    if (strAnswer === 'Yes') {
                        insertStep();
                    }
                }
            );
        }
    }
    function databaseWSUPDATE(element, strMode, jsnUpdate) {
        console.trace('databaseWSUPDATE');
        var i;
        var len;
        var pk_i;
        var pk_len;
        var lock_i;
        var lock_len;
        var col_i;
        var col_len;

        var strPostfix;
        var beforeEvent;
        var updateStep;
        var jsnCurrentData;

        var strSchema;
        var strObject;
        var strReturn;
        var strHashColumns;
        var strRecord;
        var strUpdateData;

        var intUpdateColumnIndex;
        var arrPK;
        var arrLock;
        var startingIndex;
        var arrRecordIndexes;
        //var strTempRecord;

        var strRow;
        var jsnRow;
        var cell_i;
        var cell;
        var char;

        var strRoles;
        var strColumns;
        var arrColumnNames;
        var strHashString;
        var strTemp;

        // get schema and object attributes and get the return column list
        strSchema = GS.templateWithQuerystring(
            element.getAttribute('schema') || ''
        );
        strObject = GS.templateWithQuerystring(
            element.getAttribute('object') || ''
        );

        // the return column list must be defined the same as the column list
        //      that we store the data with, so we define strReturn using the
        //      column list
        strReturn = '';
        col_i = 0;
        col_len = element.internalData.columnNames.length;
        while (col_i < col_len) {
            strReturn += (
                strReturn
                    ? '\t'
                    : ''
            );
            strReturn += element.internalData.columnNames[col_i].replace(/(\\)/g, '\\\\');
            col_i += 1;
        }

        // save the column name array for speed and easy access
        arrColumnNames = element.internalData.columnNames;

        // if single cell update: we only need to gather the update info for
        //      one record
        if (strMode === 'single-cell') {
            jsnCurrentData = {
                "columnName": jsnUpdate.data.columnName.replace(/(\\)/g, '\\\\'),
                "recordNumber": jsnUpdate.data.recordNumber,
                "oldValue": ""
            };
            strHashColumns = '';
            strUpdateData = '';
            startingIndex = '';

            // turn the updated column name into a column index so that we can
            //      fetch the old data from the data
            intUpdateColumnIndex = (
                element
                    .internalData
                    .columnNames
                    .indexOf(jsnUpdate.data.columnName)
            );

            // get the index of the record that will be updated
            startingIndex = jsnUpdate.data.recordNumber;

            // get the cell's old value so that when we emit before_update
            //      and after_update events we can provide the old data
            jsnCurrentData.oldValue = GS.decodeFromTabDelimited(
                element.internalData
                    .records[startingIndex]
                    .split('\t')[intUpdateColumnIndex]
            );

            // get primary key and lock column names into arrays so that we can
            //      use them for getting the PK and LOCK data and so that we
            //      can tell the websocket the names of the PK and LOCK columns
            if (element.getAttribute('pk')) {
                arrPK = (
                    GS.templateWithQuerystring(
                        element.getAttribute('pk') || ''
                    )
                ).split(/[\s]*,[\s]*/);
            } else {
                arrPK = [];
            }
            if (element.getAttribute('lock')) {
                arrLock = (
                    GS.templateWithQuerystring(
                        element.getAttribute('lock') || ''
                    )
                ).split(/[\s]*,[\s]*/);
            } else {
                arrLock = [];
            }

            //console.log('arrPK: ', arrPK);
            //console.log('arrLock: ', arrLock);

            // define "strHashColumns", "strRoles" and strColumns as empty so
            //      that we can append to them without worrying about an
            //      "undefined" appearing
            strHashColumns = '';
            strHashString = '';
            strRoles = '';
            strColumns = '';
            strUpdateData = '';

            // create record json so that we can easily get column values
            //      we need
            strRow = element.internalData.records[startingIndex];
            jsnRow = {};

            i = 0;
            len = strRow.length;
            cell_i = 0;
            cell = "";
            while (i < len) {
                char = strRow[i];

                if (char === "\t") {
                    jsnRow[arrColumnNames[cell_i]] =
                            GS.decodeFromTabDelimited(cell, '\\N');

                    cell = "";
                    cell_i += 1;
                } else {
                    cell += char;
                }
                i += 1;
            }
            jsnRow[arrColumnNames[cell_i]] =
                    GS.decodeFromTabDelimited(cell, '\\N');

            // build up column name/role list for websocket update headers
            //      using the PK columns and append pk values
            i = 0;
            len = arrPK.length;
            while (i < len) {
                strRoles += (
                    strRoles
                        ? '\t'
                        : ''
                );
                strRoles += 'pk';
                strColumns += (
                    strColumns
                        ? '\t'
                        : ''
                );
                strColumns += arrPK[i];
                strUpdateData += (
                    strUpdateData
                        ? '\t'
                        : ''
                );
                strUpdateData += jsnRow[arrPK[i]];
                i += 1;
            }

            // build up hash column name list for websocket update headers
            //      using the LOCK columns
            i = 0;
            len = arrLock.length;
            while (i < len) {
                strHashColumns += (
                    strHashColumns
                        ? '\t'
                        : ''
                );
                strHashColumns += arrLock[i];

                strHashString += (
                    strHashString
                        ? '\t'
                        : ''
                );
                strTemp = jsnRow[arrLock[i]];

                // the C encodes null values as empty string in the hash portion
                strHashString += (
                    strTemp === '\\N'
                        ? ''
                        : GS.encodeForTabDelimited(strTemp, '\\N')
                );
                i += 1;
            }

            if (strHashString) {
                strRoles += (
                    strRoles
                        ? '\t'
                        : ''
                );
                strRoles += 'hash';

                strColumns += (
                    strColumns
                        ? '\t'
                        : ''
                );
                strColumns += 'hash';

                strUpdateData += (
                    strUpdateData
                        ? '\t'
                        : ''
                );
                strUpdateData += GS.utfSafeMD5(strHashString).toString();
            }

            // build up column name/role list for websocket update headers
            //      using the update column
            strRoles += (
                strRoles
                    ? '\t'
                    : ''
            );
            strRoles += 'set';
            strColumns += (
                strColumns
                    ? '\t'
                    : ''
            );
            strColumns += jsnUpdate.data.columnName.replace(/(\\)/g, '\\\\');

            // append new value
            strUpdateData += (
                strUpdateData
                    ? '\t'
                    : ''
            );
            strUpdateData += GS.encodeForTabDelimited(jsnUpdate.data.newValue);

            // append an extra return to the end so just in case the C needs it
            strUpdateData += '\n';

            // prepend columns and roles
            strUpdateData = (
                strRoles + '\n' +
                strColumns + '\n' +
                strUpdateData
            );

            // add record index to the array
            arrRecordIndexes = [jsnUpdate.data.recordNumber];

        // else if multiple cell update: we have to gather the update info for
        //      a dynamic range of columns and rows
        } else if (strMode === 'cell-range') {
            // {
            //     "data": {
            //         "columns": arrColumns,
            //         "records": arrUpdateIndexes,
            //         "values": arrTranslated
            //     },
            //     "updateConfirmed": false
            // }
            jsnCurrentData = {
                "columns": "",
                "records": "",
                "oldValues": "",
                "newValues": ""
            };
            strHashColumns = '';
            strUpdateData = '';
            strColumns = '';
            strRoles = '';

            // we need to save the old data and the new data in jsnCurrentData
            //      so that when we trigger the "before_selection" event, the
            //      "before_selection" event will show all the data the
            //      developer could need about the update
            // ### NEED CODING ###

            // get primary key and lock column names into arrays so that we can
            //      use them for getting the PK and LOCK data and so that we
            //      can tell the websocket the names of the PK and LOCK columns
            if (element.getAttribute('pk')) {
                arrPK = (
                    GS.templateWithQuerystring(
                        element.getAttribute('pk') || ''
                    )
                ).split(/[\s]*,[\s]*/);
            } else {
                arrPK = [];
            }
            if (element.getAttribute('lock')) {
                arrLock = (
                    GS.templateWithQuerystring(
                        element.getAttribute('lock') || ''
                    )
                ).split(/[\s]*,[\s]*/);
            } else {
                arrLock = [];
            }

            // build up hash column list
            i = 0;
            len = arrLock.length;
            while (i < len) {
                strHashColumns += (
                    strHashColumns
                        ? '\t'
                        : ''
                );
                strHashColumns += arrLock[i];
                i += 1;
            }

            // add pk columns to the list of updated column names
            i = 0;
            len = arrPK.length;
            while (i < len) {
                strColumns += (
                    strColumns
                        ? '\t'
                        : ''
                );
                strColumns += arrPK[i];
                i += 1;
            }

            // build up column names
            i = 0;
            len = jsnUpdate.data.columns.length;
            while (i < len) {
                strColumns += (
                    strColumns
                        ? '\t'
                        : ''
                );
                strColumns += jsnUpdate.data.columns[i].replace(/(\\)/g, '\\\\');
                i += 1;
            }

            // add the hash column to the list of column names
            strColumns += '\t';
            strColumns += 'hash';

            // build up column role list
            i = 0;
            len = arrPK.length;
            while (i < len) {
                strRoles += (
                    strRoles
                        ? '\tpk'
                        : 'pk'
                );
                i += 1;
            }
            i = 0;
            len = jsnUpdate.data.columns.length;
            while (i < len) {
                strRoles += (
                    strRoles
                        ? '\tset'
                        : 'set'
                );
                i += 1;
            }
            strRoles += '\t';
            strRoles += 'hash';

            // prepend pks to update records
            // append hashes to update records
            i = 0;
            len = jsnUpdate.data.records.length;
            while (i < len) {
                strRecord = '';

                // pk data
                pk_i = 0;
                pk_len = arrPK.length;
                while (pk_i < pk_len) {
                    strRecord += (
                        strRecord
                            ? '\t'
                            : ''
                    );
                    strRecord += getCell(
                        element,
                        arrPK[pk_i],
                        jsnUpdate.data.records[i],
                        false
                    );
                    pk_i += 1;
                }

                // new record data
                strRecord += (
                    strRecord
                        ? '\t'
                        : ''
                );
                strRecord += jsnUpdate.data.values[i];

                // hash data
                strHashString = '';
                lock_i = 0;
                lock_len = arrLock.length;
                while (lock_i < lock_len) {
                    strHashString += (
                        strHashString
                            ? '\t'
                            : ''
                    );
                    strTemp = getCell(
                        element,
                        arrLock[lock_i],
                        jsnUpdate.data.records[i],
                        false
                    );

                    // the C encodes null values as empty string
                    //      in the hash portion
                    strHashString += (
                        strTemp === '\\N'
                            ? ''
                            : GS.encodeForTabDelimited(strTemp, '\\N')
                    );
                    lock_i += 1;
                }

                strRecord += (
                    strRecord
                        ? '\t'
                        : ''
                );
                strRecord += GS.utfSafeMD5(strHashString).toString();

                // add record update to update data
                strUpdateData += strRecord;
                strUpdateData += '\n';

                //console.log('Record:', strRecord);
                i += 1;
            }

            // combine the data with the columns and roles
            strUpdateData = (
                strRoles + '\n' +
                strColumns + '\n' +
                strUpdateData
            );

            arrRecordIndexes = jsnUpdate.data.records;

            //console.log('hashcolumns: ', strHashColumns);
            //console.log('    columns: ', strColumns);
            //console.log('      roles: ', strRoles);
            //console.log('       data: ', jsnUpdate);

        // else: invalid update type: throw an error
        } else {
            throw 'GS-TABLE Error: Invalid update type. Update type "' +
                    strMode + '" is not valid, please use "single-cell" ' +
                    'or "cell-range".';
        }

        // trigger a "before_update" event so that the page has a
        //      chance to cancel the update using event.preventDefault()
        beforeEvent = GS.triggerEvent(element, 'before_update', {
            "schema": strSchema,
            "object": strObject,
            "updateMode": strMode,
            "oldData": jsnCurrentData,
            "newData": jsnUpdate.data
        });

        // if the user prevents the default on the "before_update"
        //      event, prevent the execution of the following update code
        if (beforeEvent.defaultPrevented) {
            return;
        }

        // the update step is defined as a sub function because if there
        //      are multiple cells involved in this update, we want to open
        //      a dialog before we continue, else we want to immediatly
        //      update
        updateStep = function () {
            var updatedRecords;

            // define "updatedRecords" as empty so that we can append to it
            //      without worrying about an "undefined" at the beginning of
            //      the string
            updatedRecords = '';

            // gotta let the user know that an update is in progress
            addLoader(element, 'data-update', 'Updating Data...');

            // begin the websocket update
            GS.requestUpdateFromSocket(
                getSocket(element),
                strSchema,
                strObject,
                strReturn,
                strHashColumns,
                strUpdateData,
                // transaction start callback
                function (data, error) { //transID
                    // update failed: remove loader, popup an error
                    //      and reverse changes
                    if (error) {
                        removeLoader(element, 'data-update', 'Change Failed');
                        GS.webSocketErrorDialog(data);
                        //getData(element);
                    }
                },
                // transaction ready for commit/rollback callback
                // "ignore" is a placeholder for "transID" and it tells JSLINT
                //      that it is an unused variable
                function (data, error, ignore, commit, rollback) {
                    if (!error) {
                        // update made it through: commit the update
                        if (data === 'TRANSACTION COMPLETED') {
                            commit();

                        // else: we've just received a data packet containing
                        //      the updated records current version
                        } else {
                            // save this data so that we can use it to update
                            //      the internal data if the update makes it
                            //      through
                            //  ,----- data already comes back with an extra \n
                            // v
                            //updatedRecords += (
                            //    updatedRecords
                            //        ? '\n'
                            //        : ''
                            //);
                            updatedRecords += data;
                            //console.log(updatedRecords, data);
                        }
                    // update failed: popup an error, rollback and
                    //      reverse change
                    } else {
                        GS.webSocketErrorDialog(data);
                        rollback();
                        //getData(element);
                    }
                },
                // transaction commit/rollback finished callback
                function (strAnswer, data, error) {
                    var arrRecords;
                    //var i;
                    //var len;

                    // the over-the-network part of the update has finished,
                    //      remove the loader now so that if there is an
                    //      execution error below, the loader wont be stuck
                    //      visible
                    removeLoader(
                        element,
                        'data-update',
                        (
                            error
                                ? 'Change Failed'
                                : 'Change Saved'
                        )
                    );

                    if (!error) {
                        // update was successfully commited: update internal
                        //      data and re-render
                        if (strAnswer === 'COMMIT') {
                            // refresh internal data by replace each internal
                            //      record that was affected with it's new
                            //      version
                            arrRecords = updatedRecords.split('\n');
                            i = 0;
                            len = arrRecords.length - 1; // the - 1 is because
                                                         //   of the extra \n at
                                                         //   the end of the
                                                         //   returned records
                            while (i < len) {
                                element.internalData
                                    .records[arrRecordIndexes[i]] = (
                                        arrRecords[i]
                                    );
                                i += 1;
                            }

                            dataUPDATEcallback(element);

                            // trigger an after update event
                            GS.triggerEvent(element, 'after_update', {
                                "updateMode": strMode,
                                "oldData": jsnCurrentData,
                                "newData": jsnUpdate.data
                            });
                        // transaction was rolled back: reverse change
                        } else {
                            //getData(element);
                        }
                    // update failed: popup an error and reverse change
                    } else {
                        GS.webSocketErrorDialog(data);
                        //getData(element);
                    }
                }
            );
        };

        // if the update has been confirmed: carry on and update
        if (jsnUpdate.updateConfirmed === true) {
            updateStep();

        // else, we need to confirm the update
        } else {
            strPostfix = (
                (
                    !jsnUpdate.data.records ||
                    jsnUpdate.data.records.length === 1
                )
                    ? 'this record'
                    : 'these records'
            );
            GS.msgbox(
                'Are you sure...',
                '<center>' +
                        'Are you sure you want to update ' + strPostfix + '?' +
                        '</center>',
                [
                    'No',
                    'Yes'
                ],
                function (strAnswer) {
                    if (strAnswer === 'Yes') {
                        updateStep();
                    }
                }
            );
        }

        // commented out in favor of "updateConfirmed" logic
        //// if multiple cells will be updated: confirm update
        //if (strMode === 'cell-range') {
        //    GS.msgbox(
        //        'Are you sure...',
        //        '<center>' +
        //                'Are you sure you want to update these records?' +
        //                '</center>',
        //        [
        //            'No',
        //            'Yes'
        //        ],
        //        function (strAnswer) {
        //            if (strAnswer === 'Yes') {
        //                updateStep();
        //            }
        //        }
        //    );

        //// else if single cell: update immediately
        //} else if (strMode === 'single-cell') {
        //    updateStep();
        //}
    }
    function databaseWSDELETE(element, jsnDelete) {
        var i;
        var len;
        var col_i;
        var col_len;
        var strSchema;
        var strObject;
        var strPostfix;

        var beforeEvent;
        var deleteStep;

        var strPK;
        var strLock;
        var arrPK;
        var arrLock;

        var intIndex;
        var arrColumns;

        var strColumnNames;
        var strColumnRoles;
        var strHashColumns;
        var strRecordToHash;
        var strTemp;
        var strDeleteData;
        var strDeleteRecords;
        var arrDeleteRecord;
        var strRecord;

        var strNullString;

        // get schema and object attributes and get the return column list
        strSchema = GS.templateWithQuerystring(
            element.getAttribute("schema") || ""
        );
        strObject = GS.templateWithQuerystring(
            element.getAttribute("object") || ""
        );

        // we want the null string to be configurable, so we'll read the
        //      "null-string" attribute to get the null string
        // if the "null-string" attribute is present, use the contents
        //      or coalesce to empty string
        if (element.hasAttribute('null-string')) {
            strNullString = element.getAttribute('null-string') || '';

        // else, null string is left up to the encoding function
        } else {
            strNullString = undefined;
        }

        // create variables for websocket delete call

        // we need to know the primary key columns and the lock columns
        strPK = (element.getAttribute("pk") || "");
        strLock = (element.getAttribute("lock") || "");
        arrPK = strPK.split(/[\s]*,[\s]*/);
        arrLock = strLock.split(/[\s]*,[\s]*/);

        // when we start getting the data for the records we need to delete,
        //      we're going to need to be able to grab the correct columns by
        //      name, so we'll save the currently selected column list to a
        //      local variable for convenience
        arrColumns = element.internalData.columnNames;

        // initialize column name and column role variables so that we
        //      can append to them safely
        strColumnRoles = '';
        strColumnNames = '';

        // append pk columns and roles
        i = 0;
        len = arrPK.length;
        while (i < len) {
            strColumnNames += (
                strColumnNames
                    ? "\t"
                    : ""
            );
            strColumnNames += arrPK[i];
            strColumnRoles += (
                strColumnRoles
                    ? "\t"
                    : ""
            );
            strColumnRoles += "pk";
            i += 1;
        }

        // append column and role for the hash column
        strColumnNames += (
            strColumnNames
                ? "\t"
                : ""
        );
        strColumnNames += "hash";
        strColumnRoles += (
            strColumnRoles
                ? "\t"
                : ""
        );
        strColumnRoles += "hash";

        // build up hash column list
        strHashColumns = '';
        i = 0;
        len = arrLock.length;
        while (i < len) {
            strHashColumns += (
                strHashColumns
                    ? "\t"
                    : ""
            );
            strHashColumns += arrLock[i];
            i += 1;
        }

        // now that we have the metadata taken care of, gather up the records
        strDeleteRecords = '';
        i = 0;
        len = jsnDelete.recordIndexes.length;


        //// create cell array for this record
        //strRecord = element.internalData.records[i] + '\t';
        //arrDeleteRecord = [];
        //col_i = 0;
        //col_len = element.internalData.columnNames.length;//9999;
        //while (col_i < col_len) {
        //    delim = strRecord.indexOf('\t');
        //    strCell = strRecord.substring(0, delim);
        //    strRecord = strRecord.substring(delim + 1);

        //    arrDeleteRecord.push(
        //        GS.decodeFromTabDelimited(strCell, strNullString)
        //    );

        //    col_i += 1;
        //}


        while (i < len) {
            strRecord = '';
            arrDeleteRecord = element.internalData.records[
                jsnDelete.recordIndexes[i]
            ].split("\t");

            // get PK columns
            col_i = 0;
            col_len = arrPK.length;
            while (col_i < col_len) {
                // get column index for this current PK
                intIndex = arrColumns.indexOf(arrPK[col_i]);

                // append cell to current delete record
                strRecord += (
                    strRecord
                        ? "\t"
                        : ""
                );
                strRecord += GS.encodeForTabDelimited(
                    arrDeleteRecord[intIndex],
                    strNullString
                );

                col_i += 1;
            }

            // get hash columns
            strRecordToHash = "";
            col_i = 0;
            col_len = arrLock.length;
            while (col_i < col_len) {
                //// get column index for this current hash column
                //intIndex = arrColumns.indexOf(arrLock[col_i]);

                // append cell to current hash record
                strRecordToHash += (
                    strRecordToHash
                        ? "\t"
                        : ""
                );
                //strTemp = arrDeleteRecord[intIndex];
                strTemp = getCell(
                                element,
                                arrLock[col_i],
                                jsnDelete.recordIndexes[i],
                                false
                            );

                // I saw this in the code I copied while making this:
                //      "I believe that this needs to
                //          use the null-string instead of 'NULL'"
                strRecordToHash += (
                    strTemp === "\\N"
                        ? ""
                        : strTemp
                );
                console.log(strTemp, strRecordToHash);

                col_i += 1;
            }

            // append record to deleteData
            strDeleteRecords += strRecord;
            strDeleteRecords += (
                strRecord
                    ? '\t'
                    : ''
            );
            strDeleteRecords += GS.utfSafeMD5(strRecordToHash).toString();
            strDeleteRecords += '\n';

            i += 1;
        }

        // combine the metadata with the delete records
        strDeleteData = (
            strColumnRoles + '\n' +
            strColumnNames + '\n' +
            strDeleteRecords
        );

        // trigger a "before_update" event so that the page has a
        //      chance to cancel the update using event.preventDefault()
        beforeEvent = GS.triggerEvent(element, 'before_delete', {
            "schema": strSchema,
            "object": strObject,
            "recordIndexes": jsnDelete.recordIndexes,
            "deleteConfirmed": jsnDelete.deleteConfirmed,
            "strColumnRoles": strColumnRoles,
            "strColumnNames": strColumnNames,
            "strDeleteRecords": strDeleteRecords
        });

        // if the user prevents the default on the "before_update"
        //      event, prevent the execution of the following update code
        if (beforeEvent.defaultPrevented) {
            return;
        }

        // the delete step is defined as a sub function because we only
        //      want to do the delete under certain circumstances
        deleteStep = function () {
            // gotta let the user know that an update is in progress
            addLoader(element, 'data-delete', 'Deleting Data...');

            // begin the websocket update
            GS.requestDeleteFromSocket(
                getSocket(element),
                strSchema,
                strObject,
                strHashColumns,
                strDeleteData,
                // transaction start callback
                function (data, error) { //transID
                    // delete failed: remove loader, popup an error
                    if (error) {
                        removeLoader(element, 'data-delete', 'Delete Failed');
                        GS.webSocketErrorDialog(data);
                    }
                },
                // transaction ready for commit/rollback callback
                // "ignore" is a placeholder for "transID" and it tells JSLINT
                //      that it is an unused variable
                function (data, error, ignore, commit, rollback) {
                    if (!error) {
                        // delete made it through: commit the delete
                        if (data === 'TRANSACTION COMPLETED') {
                            commit();
                        }
                    // delete failed: popup an error, rollback
                    } else {
                        GS.webSocketErrorDialog(data);
                        rollback();
                    }
                },
                // transaction commit/rollback finished callback
                function (strAnswer, data, error) {
                    var arrRecords;
                    var arrRecordHeights;

                    // the over-the-network part of the delete has finished,
                    //      remove the loader now so that if there is an
                    //      execution error below, the loader wont be stuck
                    //      visible
                    removeLoader(
                        element,
                        'data-delete',
                        (
                            error
                                ? 'Delete Failed'
                                : 'Delete Successful'
                        )
                    );

                    if (!error) {
                        // delete was successfully commited: update internal
                        //      data and re-render
                        if (strAnswer === 'COMMIT') {
                            // now that the delete was successful, we'll
                            //      recreate the record and record height
                            //      arrays and skip the records at the indexes
                            //      that were deleted
                            // Some of you may be asking:
                            //      "why doesn't he just use .splice()?".
                            //      That, young grasshopper, is because through
                            //      my travels I've found .splice() to be
                            //      significantly slower than simply rebuilding
                            //      the array. This is what I do in Postage's
                            //      tree code.
                            arrRecords = [];
                            arrRecordHeights = [];

                            i = 0;
                            len = element.internalData.records.length;
                            while (i < len) {
                                if (jsnDelete.recordIndexes.indexOf(i) === -1) {
                                    arrRecords.push(
                                        element.internalData.records[i]
                                    );
                                    arrRecordHeights.push(
                                        element.internalDisplay.recordHeights[i]
                                    );
                                }
                                i += 1;
                            }

                            // set the internal record and record heights to
                            //      the newly pruned arrays
                            element
                                .internalData
                                .records = arrRecords;
                            element
                                .internalDisplay
                                .recordHeights = arrRecordHeights;

                            // standard after delete procedure
                            dataDELETEcallback(element);

                            // trigger an after delete event
                            GS.triggerEvent(element, 'after_delete', {
                                "schema": strSchema,
                                "object": strObject,
                                "recordIndexes": jsnDelete.recordIndexes,
                                "strColumnRoles": strColumnRoles,
                                "strColumnNames": strColumnNames,
                                "strDeleteRecords": strDeleteRecords
                            });
                        }
                    // delete failed: popup an error
                    } else {
                        GS.webSocketErrorDialog(data);
                    }
                }
            );
        };

        // if no records have been sent to delete: error
        if (jsnDelete.recordIndexes.length === 0) {
            GS.msgbox(
                'No Records To Delete',
                '<center>' +
                        'Please choose a record to delete.' +
                        '</center>',
                ['Ok']
            );

        // else if the delete has been confirmed: carry on and delete
        } else if (jsnDelete.deleteConfirmed === true) {
            deleteStep();

        // else, we need to confirm the delete
        } else {
            strPostfix = (
                jsnDelete.recordIndexes.length === 1
                    ? 'this record'
                    : 'these records'
            );
            GS.msgbox(
                'Are you sure...',
                '<center>' +
                        'Are you sure you want to delete ' + strPostfix + '?' +
                        '</center>',
                [
                    'No',
                    'Yes'
                ],
                function (strAnswer) {
                    if (strAnswer === 'Yes') {
                        deleteStep();
                    }
                }
            );
        }
    }

    // sometimes, you dont want to save to the database, that's what these
    //      internal SELECT, INSERT, UPDATE and DELETE functions are for

    function internalSELECT(element) {
        var templateElement;
        var arrColumns;

        // on the first load, the GS-TABLE doesn't know what the column names
        //      are. so, here we'll scan the templates to come up with a column
        //      list
        if (element.internalData.columnNames.length === 0) {
            templateElement = document.createElement('template');

            // we'll check the insertDialog template for column names
            templateElement.innerHTML = element.internalTemplates.insertDialog;
            arrColumns = templateGetColumnList(templateElement);
            arrColumns.forEach(function (strColumn) {
                if (
                    element.internalData.columnNames.indexOf(strColumn) === -1
                ) {
                    element.internalData.columnNames.push(strColumn);
                    element.internalData.columnTypes.push('text');
                    element.internalData.columnFilterStatuses.push('on');
                    element.internalData.columnFilters.push([]);
                    element.internalData.columnListFilters.push({});
                    element.internalData.columnOrders.push('neutral');
                }
            });

            // we'll check the insertRecord template for column names
            templateElement.innerHTML = element.internalTemplates.insertRecord;
            arrColumns = templateGetColumnList(templateElement);
            arrColumns.forEach(function (strColumn) {
                if (
                    element.internalData.columnNames.indexOf(strColumn) === -1
                ) {
                    element.internalData.columnNames.push(strColumn);
                    element.internalData.columnTypes.push('text');
                    element.internalData.columnFilterStatuses.push('on');
                    element.internalData.columnFilters.push([]);
                    element.internalData.columnListFilters.push({});
                    element.internalData.columnOrders.push('neutral');
                }
            });

            // we'll check the record template for column names
            templateElement.innerHTML = element.internalTemplates.record;
            arrColumns = templateGetColumnList(templateElement);
            arrColumns.forEach(function (strColumn) {
                if (
                    element.internalData.columnNames.indexOf(strColumn) === -1
                ) {
                    element.internalData.columnNames.push(strColumn);
                    element.internalData.columnTypes.push('text');
                    element.internalData.columnFilterStatuses.push('on');
                    element.internalData.columnFilters.push([]);
                    element.internalData.columnListFilters.push({});
                    element.internalData.columnOrders.push('neutral');
                }
            });
        }

        // we need to re-render and all that jazz
        dataSELECTcallback(element);
    }

    function internalINSERT(element, strMode, jsnInsert) {
        var beforeEvent;
        var insertStep;
        var strPostfix;
        var strNullString;
        var intRecordHeight;
        var strRecord;
        var arrRecords;
        var arrRecord;
        var arrColumns;
        var strColumn;
        var strValue;
        var index;
        var i;
        var len;
        //var rec_i;
        //var rec_len;
        var col_i;
        var col_len;

        //console.log(element, strMode, jsnInsert); //multi-record

        // we want the null string to be configurable, so we'll read the
        //      "null-string" attribute to get the null string
        // if the "null-string" attribute is present, use the contents
        //      or coalesce to empty string
        if (element.hasAttribute('null-string')) {
            strNullString = element.getAttribute('null-string') || '';

        // else, null string is left up to the encoding function
        } else {
            strNullString = undefined;
        }

        // we need to create records with the default record height attached to
        //      them, so we'll use the "default-record-height" attribute
        intRecordHeight = (
            parseInt(element.getAttribute('default-record-height'), 10) ||
            intDefaultRecordHeight
        );

        // trigger a "before_insert" event so that the page has a
        //      chance to cancel the update using event.preventDefault()
        beforeEvent = GS.triggerEvent(element, 'before_insert', {
            "insertMode": strMode,
            "insertData": jsnInsert.data
        });

        // if the user prevents the default on the "before_update"
        //      event, prevent the execution of the following update code
        if (beforeEvent.defaultPrevented) {
            return;
        }

        // sometimes, we need to call the insert only after a confirmation.
        //      other times, we insert immediately. separating the insert
        //      code into a sub-function allows us to call it at different
        //      times under different circumstances
        insertStep = function () {
            // gotta let the user know that an insert is in progress
            addLoader(element, 'data-insert', 'Inserting Data...');

            // if single record insert:
            if (strMode === "single-record") {
                /*
                jsnInsert = {
                    "data": {
                        "addin": {
                            "link_column": "columnname4",
                            "link_value": "value"
                        },
                        "columns": [
                            "columnname1",
                            "columnname2",
                            "columnname3"
                            ...
                        ],
                        "values": {
                            "columnname1": "value",
                            "columnname2": "value",
                            "columnname3": "value"
                            ...
                        }
                    },
                    "insertConfirmed": boolean
                }
                */

                // loop through internal column list, build up new record
                //      ignoring columns that don't exist and adding nulls
                //      for columns that exist but weren't filled in
                strRecord = "";
                arrColumns = element.internalData.columnNames;
                i = 0;
                len = arrColumns.length;
                while (i < len) {
                    strColumn = arrColumns[i];

                    // separate columns with tab characters
                    if (i > 0) {
                        strRecord += "\t";
                    }

                    // get value for column
                    strValue = jsnInsert.data.values[strColumn];

                    // if column is defined in insert values
                    if (strValue !== undefined) {
                        strRecord += GS.encodeForTabDelimited(
                            strValue,
                            strNullString
                        );

                    // if column is defined in addin values
                    } else if (jsnInsert.data.addin.link_column === strColumn) {
                        strRecord += GS.encodeForTabDelimited(
                            jsnInsert.data.addin.link_value,
                            strNullString
                        );

                    // else, null the cell
                    } else {
                        strRecord += '\\N';
                    }

                    i += 1;
                }

                // append record text and record height to internal variables
                element.internalData.records.push(strRecord);
                element.internalDisplay.recordHeights.push(intRecordHeight);

            // else if multi record insert:
            } else if (strMode === "multi-record") {
                /*
                jsnInsert = {
                    "data": {
                        "addin": {
                            "link_column": "columnname4",
                            "link_value": "value"
                        },
                        "columns": [
                            "columnname1",
                            "columnname2"
                            ...
                        ],
                        "values": [
                            "value1\tvalue1",
                            "value2\tvalue2",
                            "value3\tvalue3"
                            ...
                        ]
                    },
                    "insertConfirmed": boolean
                }
                */

                // loop through internal column list, build up new record
                //      ignoring columns that don't exist and adding nulls
                //      for columns that exist but weren't filled in
                arrRecords = [];
                arrColumns = element.internalData.columnNames;
                // ### NEED CODING ###
                i = 0;
                len = jsnInsert.data.values.length;
                while (i < len) {

                    // split record
                    strRecord = jsnInsert.data.values[i];
                    arrRecord = strRecord.split('\t');
                    //rec_i = 0;
                    //rec_len = strRecord.length;
                    //while (rec_i < rec_len) {
                    //    rec_i += 1;
                    //}

                    // create full records
                    strRecord = "";
                    col_i = 0;
                    col_len = arrColumns.length;
                    while (col_i < col_len) {
                        strColumn = arrColumns[col_i];
                        index = jsnInsert.data.columns.indexOf(strColumn);
                        strValue = arrRecord[index];

                        // separate columns with tab characters
                        if (col_i > 0) {
                            strRecord += "\t";
                        }

                        // get value for current column
                        if (strValue) {
                            strRecord += arrRecord[index];

                        // if column is defined in addin values
                        } else if (
                            jsnInsert.data.addin.link_column === strColumn
                        ) {
                            strRecord += GS.encodeForTabDelimited(
                                jsnInsert.data.addin.link_value,
                                strNullString
                            );

                        // else, null the cell
                        } else {
                            strRecord += '\\N';
                        }

                        col_i += 1;
                    }

                    // push new record to expanded record list
                    arrRecords.push(strRecord);

                    i += 1;
                }

                // append record text and record height to internal variables
                i = 0;
                len = arrRecords.length;
                while (i < len) {
                    element.internalData.records.push(arrRecords[i]);
                    element.internalDisplay.recordHeights.push(intRecordHeight);
                    i += 1;
                }
            }

            // we need to let the user know the insert is finished
            removeLoader(element, 'data-insert', 'New Record Saved');

            // standard after-insert behaviour
            dataINSERTcallback(element);

            // trigger an after insert event
            GS.triggerEvent(element, 'after_insert', {
                "insertMode": strMode,
                "insertData": jsnInsert.data
            });
        };

        // we don't want to be able to insert of there's no insert data, so if
        //      we're doing a multi record insert with no records to insert OR
        //      any kind of insert with no columns: error
        if (
            (
                strMode !== 'single-record' &&
                jsnInsert.data.values.length === 0
            ) ||
            jsnInsert.data.columns.length === 0
        ) {
            GS.msgbox(
                'Nothing To Create',
                '<center>' +
                        'Please input data to create.' +
                        '</center>',
                ['Ok']
            );

        // sometimes, the insert has already been confirmed by the user. if it
        //      has, just carry on and insert
        } else if (jsnInsert.insertConfirmed === true) {
            insertStep();

        // else, we need to confirm with the user and then create the records
        } else {
            strPostfix = (
                (
                    strMode === 'single-record' ||
                    jsnInsert.data.values.length === 1
                )
                    ? 'this record'
                    : 'these records'
            );
            GS.msgbox(
                'Are you sure...',
                '<center>' +
                        'Are you sure you want to create ' + strPostfix + '?' +
                        '</center>',
                [
                    'No',
                    'Yes'
                ],
                function (strAnswer) {
                    if (strAnswer === 'Yes') {
                        insertStep();
                    }
                }
            );
        }
    }
    function internalUPDATE(element, strMode, jsnUpdate) {
        var i;
        var len;
        var row_i;
        var row_len;

        var strPostfix;
        var beforeEvent;
        var updateStep;
        var jsnCurrentData;

        var intUpdateColumnIndex;
        var arrUpdateColumnIndexes;
        var startingIndex;
        var arrUpdatePaste;

        var update_i;
        var cell_i;
        var cell;
        var char;

        var strOldRow;
        var strNewRow;
        var arrRecordIndexes;
        var arrRecordReplacements;

        //console.log(element, strMode, jsnUpdate);

        // we need to be able to have unupdatable columns
        // ### NEED CODING ###

        // we need to be able to use the data from a header-child relationship
        // ### NEED CODING ###

        // this function updates internal data and then re-renders. essentially,
        //      we'll be masking the new data over the old data.

        // if single cell update: we only need to gather the update info for
        //      one record
        if (strMode === 'single-cell') {
            jsnCurrentData = {
                "columnName": jsnUpdate.data.columnName,
                "recordNumber": jsnUpdate.data.recordNumber,
                "oldValue": ""
            };

            // turn the updated column name into a column index so that we can
            //      fetch the old data from the data
            intUpdateColumnIndex = (
                element
                    .internalData
                    .columnNames
                    .indexOf(jsnUpdate.data.columnName)
            );

            // get the index of the record that will be updated
            startingIndex = jsnUpdate.data.recordNumber;

            // get the old record and get the new record variable ready for
            //      masking
            strOldRow = element.internalData.records[startingIndex];
            strNewRow = '';

            // loop through each character of the record and begin masking
            i = 0;
            len = strOldRow.length;
            cell_i = 0;
            cell = "";
            while (i < len) {
                char = strOldRow[i];

                // if the cell end has been reached
                if (char === "\t" || i === (len - 1)) {
                    // we don't want to chop the last character off
                    if (i === (len - 1)) {
                        cell += char;
                    }

                    // if the cell number is the cell we want to replace,
                    //      insert new value instead of the old value
                    if (cell_i === intUpdateColumnIndex) {
                        strNewRow += GS.encodeForTabDelimited(
                            jsnUpdate.data.newValue
                        );

                        // save the old value for the developer in the
                        //      "before_update" and "after_update" events
                        jsnCurrentData.oldValue = cell;

                    // else, maintain old data
                    } else {
                        strNewRow += cell;
                    }

                    cell = "";
                    cell_i += 1;

                // else, keep building up the cell variable
                } else {
                    cell += char;
                }

                // we want to maintain the tab characters
                if (char === "\t") {
                    strNewRow += '\t';
                }

                i += 1;
            }

            // regardless of single or multi-record updates, we use the same
            //      code to make the change in the internal data. this code
            //      needs the record indexes of the update records and the new
            //      version of each of the records

            // add record index to the updated record list
            arrRecordIndexes = [startingIndex];

            // add new record to updated data array
            arrRecordReplacements = [strNewRow];

        // else if multiple cell update: we have to gather the update info for
        //      a dynamic range of columns and rows
        } else if (strMode === 'cell-range') {
            // {
            //     "data": {
            //         "columns": arrColumns,
            //         "records": arrUpdateIndexes,
            //         "values": arrTranslated
            //     },
            //     "updateConfirmed": false
            // }
            jsnCurrentData = {
                "columns": "",
                "records": "",
                "oldValues": "",
                "newValues": ""
            };

            // we need to save the old data and the new data in jsnCurrentData
            //      so that when we trigger the "before_selection" event, the
            //      "before_selection" event will show all the data the
            //      developer could need about the update
            // ### NEED CODING ###

            // we need to know the indexes of the columns we're updating
            arrUpdateColumnIndexes = [];
            i = 0;
            len = jsnUpdate.data.columns.length;
            while (i < len) {
                arrUpdateColumnIndexes.push(
                    element.internalData.columnNames
                        .indexOf(jsnUpdate.data.columns[i])
                );

                i += 1;
            }

            // loop through records and mask over old values for each
            i = 0;
            len = jsnUpdate.data.records.length;
            arrRecordReplacements = [];
            while (i < len) {
                // get the old record and get the new record variable ready for
                //      masking
                strOldRow = element.internalData.records[
                    jsnUpdate.data.records[i]
                ];
                strNewRow = '';
                arrUpdatePaste = jsnUpdate.data.values[i].split('\t');
                update_i = 0;

                // loop through each character of the record and begin masking
                row_i = 0;
                row_len = strOldRow.length;
                cell_i = 0;
                cell = "";
                while (row_i < row_len) {
                    char = strOldRow[row_i];

                    // if the cell end has been reached
                    if (char === "\t" || row_i === (row_len - 1)) {
                        // if the cell number is the cell we want to replace,
                        //      insert new value instead of the old value
                        if (arrUpdateColumnIndexes.indexOf(cell_i) > -1) {
                            strNewRow += arrUpdatePaste[update_i] || '\\N';
                            update_i += 1;

                        // else, maintain old data
                        } else {
                            strNewRow += cell;
                        }

                        cell = "";
                        cell_i += 1;

                    // else, keep building up the cell variable
                    } else {
                        cell += char;
                    }

                    // we want to maintain the tab characters
                    if (char === "\t") {
                        strNewRow += '\t';
                    }

                    row_i += 1;
                }

                //console.log(' strOldRow: ', strOldRow);
                //console.log(' strNewRow: ', strNewRow);

                arrRecordReplacements.push(strNewRow);

                i += 1;
            }

            arrRecordIndexes = jsnUpdate.data.records;

            //console.log('arrUpdateColumnIndexes: ', arrUpdateColumnIndexes);
            //console.log(' arrRecordReplacements: ', arrRecordReplacements);
            //console.log('      arrRecordIndexes: ', arrRecordIndexes);

        // else: invalid update type: throw an error
        } else {
            throw 'GS-TABLE Error: Invalid update type. Update type "' +
                    strMode + '" is not valid, please use "single-cell" ' +
                    'or "cell-range".';
        }

        // trigger a "before_update" event so that the page has a
        //      chance to cancel the update using event.preventDefault()
        beforeEvent = GS.triggerEvent(element, 'before_update', {
            "updateMode": strMode,
            "oldData": jsnCurrentData,
            "newData": jsnUpdate.data
        });

        // if the user prevents the default on the "before_update"
        //      event, prevent the execution of the following update code
        if (beforeEvent.defaultPrevented) {
            return;
        }

        // the update step is defined as a sub function because if there
        //      are multiple cells involved in this update, we want to open
        //      a dialog before we continue, else we want to immediatly
        //      update
        updateStep = function () {
            // gotta let the user know that an update is in progress
            addLoader(element, 'data-update', 'Updating Data...');

            // utilize the updated record and updated record index arrays to
            //      replace the old data with the new data
            i = 0;
            len = arrRecordIndexes.length;
            while (i < len) {
                element.internalData.records[
                    arrRecordIndexes[i]
                ] = (
                    arrRecordReplacements[i]
                );

                i += 1;
            }

            // re-render and do whatever standard after-update items need
            //      to be done
            dataUPDATEcallback(element);

            // trigger an after update event
            GS.triggerEvent(element, 'after_update', {
                "updateMode": strMode,
                "oldData": jsnCurrentData,
                "newData": jsnUpdate.data
            });

            // the update has finished, let the user know and remove the loader
            removeLoader(element, 'data-update', 'Change Saved');
        };

        // if the update has been confirmed: carry on and update
        if (jsnUpdate.updateConfirmed === true) {
            updateStep();

        // else, we need to confirm the update
        } else {
            strPostfix = (
                (
                    !jsnUpdate.data.records ||
                    jsnUpdate.data.records.length === 1
                )
                    ? 'this record'
                    : 'these records'
            );
            GS.msgbox(
                'Are you sure...',
                '<center>' +
                        'Are you sure you want to update ' + strPostfix + '?' +
                        '</center>',
                [
                    'No',
                    'Yes'
                ],
                function (strAnswer) {
                    if (strAnswer === 'Yes') {
                        updateStep();
                    }
                }
            );
        }
    }
    function internalDELETE(element, jsnDelete) {
        var strPostfix;

        var beforeEvent;
        var deleteStep;

        // trigger a "before_update" event so that the page has a
        //      chance to cancel the update using event.preventDefault()
        beforeEvent = GS.triggerEvent(element, 'before_delete', {
            "recordIndexes": jsnDelete.recordIndexes,
            "deleteConfirmed": jsnDelete.deleteConfirmed
        });

        // if the user prevents the default on the "before_update"
        //      event, prevent the execution of the following update code
        if (beforeEvent.defaultPrevented) {
            return;
        }

        // the delete step is defined as a sub function because we only
        //      want to do the delete under certain circumstances
        deleteStep = function () {
            var arrRecords;
            var arrRecordHeights;
            var i;
            var len;

            // gotta let the user know that an update is in progress
            addLoader(element, 'data-delete', 'Deleting Data...');

            // now that the delete was confirmed, we'll
            //      recreate the record and record height
            //      arrays and skip the records at the indexes
            //      that were deleted
            // Some of you may be asking:
            //      "why doesn't he just use .splice()?".
            //      That, young grasshopper, is because through
            //      my travels I've found .splice() to be
            //      significantly slower than simply rebuilding
            //      the array. This is what I do in Postage's
            //      tree code.
            arrRecords = [];
            arrRecordHeights = [];

            i = 0;
            len = element.internalData.records.length;
            while (i < len) {
                if (jsnDelete.recordIndexes.indexOf(i) === -1) {
                    arrRecords.push(
                        element.internalData.records[i]
                    );
                    arrRecordHeights.push(
                        element.internalDisplay.recordHeights[i]
                    );
                }
                i += 1;
            }

            // set the internal record and record heights to
            //      the newly pruned arrays
            element.internalData.records = arrRecords;
            element.internalDisplay.recordHeights = arrRecordHeights;

            // gotta let the user know that we finished
            removeLoader(element, 'data-delete', 'Delete Successful');

            // standard after delete procedure
            dataDELETEcallback(element);

            // trigger an after delete event
            GS.triggerEvent(element, 'after_delete', {
                "recordIndexes": jsnDelete.recordIndexes
            });
        };

        // if no records have been sent to delete: error
        if (jsnDelete.recordIndexes.length === 0) {
            GS.msgbox(
                'No Records To Delete',
                '<center>' +
                        'Please choose a record to delete.' +
                        '</center>',
                ['Ok']
            );

        // else if the delete has been confirmed: carry on and delete
        } else if (jsnDelete.deleteConfirmed === true) {
            deleteStep();

        // else, we need to confirm the delete
        } else {
            strPostfix = (
                jsnDelete.recordIndexes.length === 1
                    ? 'this record'
                    : 'these records'
            );
            GS.msgbox(
                'Are you sure...',
                '<center>' +
                        'Are you sure you want to delete ' + strPostfix + '?' +
                        '</center>',
                [
                    'No',
                    'Yes'
                ],
                function (strAnswer) {
                    if (strAnswer === 'Yes') {
                        deleteStep();
                    }
                }
            );
        }
    }



    function databaseWSSELECTcolumnUnique(
        element,
        uniqueFilterElement,
        valueListElement,
        strColumn
    ) {
        var socket = getSocket(element);
        var strSchema;
        var strObject;
        var strWhere;

        strSchema = GS.templateWithQuerystring(
            element.getAttribute('schema') || ''
        );
        strObject = GS.templateWithQuerystring(
            element.getAttribute('object') || ''
        );
        strWhere = element.getAttribute('where') || '1=1';
        // This way other filters apply to the current filter
        // TODO: Michael is this correct?
        // I think that the current filter that we are choosing should
        //      not be in this select

        var strSrc = (
            ml(function () {/*
                SELECT count(*) AS count
                     , COALESCE(
                            NULLIF(CAST("{{COLUMN}}" AS text), ''),
                            '(blanks)'
                       ) AS unique_value
                  FROM {{SCHEMA}}.{{OBJECT}}
                  WHERE {{WHERE}}
              GROUP BY NULLIF(CAST("{{COLUMN}}" AS text), '')
              ORDER BY NULLIF(CAST("{{COLUMN}}" AS text), '') ASC NULLS FIRST
            */
            })
                .replace(/\{\{WHERE\}\}/gi, strWhere)
                .replace(/\{\{COLUMN\}\}/gi, strColumn)
                .replace(/\{\{SCHEMA\}\}/gi, strSchema)
                .replace(/\{\{OBJECT\}\}/gi, strObject)
        );

        var bolUncheckedFound = false;
        var arrData;
        var jsnFilter;

        arrData = [
            '' // placeholder for "Select All" record
        ];
        jsnFilter = (
            element.internalData.columnListFilters[
                element.internalData.columnNames.indexOf(strColumn)
            ]
        );

        GS.requestArbitrarySelectFromSocket(
            socket,
            '(' + strSrc + ') unique_list',
            '',
            '',
            '',
            '',
            function (data, error) {
                var i;
                //var len;
                var tableElement;
                //var strCheck;
                var index;
                var strValue;
                //var strType;
                var strMessage = data.strMessage;
                var strRecord;
                //var arrRecords = [];
                var arrRecord = [];

                if (!error && data.strMessage === 'TRANSACTION COMPLETED') {
                    // we want the select all to only be checked if all
                    //      values are checked
                    if (bolUncheckedFound) {
                        arrData[0] = '0\t\tSelect All';
                    } else {
                        arrData[0] = '-1\t\tSelect All';
                    }

                    // we need to make the filter list container visible
                    uniqueFilterElement.removeAttribute('hidden');

                    valueListElement.addEventListener(
                        'initialized',
                        function () {
                            // we need to fill our new gs-table.
                            tableElement = valueListElement.children[0];

                            tableElement.internalData.records = arrData;
                            tableElement.internalData.columnNames = [
                                'active', 'count', 'value'
                            ];
                            tableElement.internalData.columnTypes = [
                                'text', 'text', 'text'
                            ];
                            tableElement.internalData.columnFilterStatuses = [
                                'on', 'on', 'on'
                            ];
                            tableElement.internalData.columnFilters = [
                                [], [], []
                            ];
                            tableElement.internalData.columnListFilters = [
                                {}, {}, {}
                            ];
                            tableElement.internalData.columnOrders = [
                                'neutral', 'neutral', 'neutral'
                            ];
                            tableElement.internalDisplay.columnWidths = [
                                27,
                                (valueListElement.clientWidth - 80),
                                49
                            ];

                            // refresh causes the record heights to be
                            //      calculated
                            tableElement.refresh();
                        }
                    );

                    // we need to create a gs-table to hold the unique list
                    //      because we need a local, updatable, wicked-fast
                    //      component to contain this potentially very long
                    //      list.
                    valueListElement.innerHTML = ml(function () {/*
    <gs-table style="width: 100%; height: 100%;"
                no-record-selector
                no-x-overscroll
                no-y-overscroll
                copy-header="always">
        <template for="data-record">
            <gs-cell>
                <label>
                    <gs-checkbox column="active" mini></gs-checkbox>
                </label>
            </gs-cell>
            <gs-cell>
                {{? row.value === 'Select All' || row.value === '(blanks)' }}
                    <span class="gs-table-text-grey">
                        {{! row.value }}
                    </span>
                {{??}}
                    <label>{{! row.value }}</label>
                {{?}}
            </gs-cell>
            <gs-cell>
                <center class="gs-table-text-grey">
                    {{! row.count }}
                </center>
            </gs-cell>
        </template>
        <template for="copy">
            <gs-cell header="Include?">{{? row.active==='-1' }}X{{?}}</gs-cell>
            <gs-cell header="Value">{{! row.value }} </gs-cell>
            <gs-cell header="Occurences">{{! row.count }}</gs-cell>
        </template>
    </gs-table>
                    */
                    });

                    tableElement.addEventListener(
                        'before_update',
                        function (event) {
                            var rec_i;
                            var rec_len;
                            var arrRecords;

                            // the only data change we make is to update the
                            //      checkbox. because of the limited nature of
                            //      the updates (0 to -1 and vice versa), we
                            //      can optimize two things: no need to encode
                            //      the update value and we're always replacing
                            //      everything before the first tab character.
                            var replaceValue = function (strRecord, strValue) {
                                return (
                                    strValue +
                                    strRecord.substring(
                                        strRecord.indexOf('\t')
                                    )
                                );
                            };

                            // when the user checks "Select All":
                            //      all checkboxes must be set to -1
                            if (
                                event.newData.columnName === 'active' &&
                                event.newData.recordNumber === 0 &&
                                event.newData.newValue === '-1'
                            ) {
                                //console.log('1***');
                                arrRecords = tableElement.internalData.records;
                                rec_i = 0;
                                rec_len = arrRecords.length;
                                while (rec_i < rec_len) {
                                    arrRecords[rec_i] = (
                                        replaceValue(arrRecords[rec_i], '-1')
                                    );
                                    rec_i += 1;
                                }

                            // when the user unchecks "Select All":
                            //      all checkboxes must be set to 0
                            } else if (
                                event.newData.columnName === 'active' &&
                                event.newData.recordNumber === 0 &&
                                event.newData.newValue === '0'
                            ) {
                                //console.log('2***');
                                arrRecords = tableElement.internalData.records;
                                rec_i = 0;
                                rec_len = arrRecords.length;
                                while (rec_i < rec_len) {
                                    arrRecords[rec_i] = (
                                        replaceValue(arrRecords[rec_i], '0')
                                    );
                                    rec_i += 1;
                                }

                            // when the user unchecks a checkbox:
                            //      the "Select All" checkbox must be set to 0
                            } else if (
                                event.newData.columnName === 'active' &&
                                event.newData.recordNumber > 0 &&
                                event.newData.newValue === '0'
                            ) {
                                //console.log('3***');
                                tableElement.internalData.records[0] = (
                                    replaceValue(
                                        tableElement.internalData.records[0],
                                        '0'
                                    )
                                );
                            }

                            //console.log(event);
                            //console.log(
                            //    'column: ' + event.newData.columnName,
                            //    'recordNumber: ' + event.newData.recordNumber,
                            //    'newValue: ' + event.newData.newValue
                            //);
                        }
                    );

                } else if (!error) {

                    i = 0;
                    while (i < 15) {
                        index = strMessage.indexOf('\n');
                        strRecord = strMessage.substring(0, index);
                        strMessage = strMessage.substring(index + 1);

                        // first load
                        if (strRecord !== '' || strMessage !== '') {
                            arrRecord = strRecord.split('\t');
                            strValue = arrRecord[1];

                            if (!jsnFilter || !jsnFilter.type) {
                                arrData.push('-1\t' + strRecord);

                            // nothing
                            } else if (
                                jsnFilter.type === 'inclusion' &&
                                jsnFilter.values.length === 0
                            ) {
                                if (
                                    jsnFilter.blanks &&
                                    strValue === '(blanks)'
                                ) {
                                    arrData.push('-1\t' + strRecord);

                                } else if (
                                    jsnFilter.blanks === false &&
                                    strValue === '(blanks)'
                                ) {
                                    arrData.push('0\t' + strRecord);
                                    bolUncheckedFound = true;

                                } else {
                                    arrData.push('0\t' + strRecord);
                                    bolUncheckedFound = true;
                                }

                            // everything
                            } else if (
                                jsnFilter.type === 'exclusion' &&
                                jsnFilter.values.length === 0
                            ) {
                                if (
                                    jsnFilter.blanks &&
                                    strValue === '(blanks)'
                                ) {
                                    arrData.push('-1\t' + strRecord);

                                } else if (
                                    jsnFilter.blanks === false &&
                                    strValue === '(blanks)'
                                ) {
                                    arrData.push('0\t' + strRecord);
                                    bolUncheckedFound = true;

                                } else {
                                    arrData.push('-1\t' + strRecord);
                                }

                            } else if (
                                jsnFilter &&
                                jsnFilter.type === 'inclusion'
                            ) {
                                if (
                                    jsnFilter.blanks &&
                                    strValue === '(blanks)'
                                ) {
                                    arrData.push('-1\t' + strRecord);

                                } else if (
                                    jsnFilter.blanks === false &&
                                    strValue === '(blanks)'
                                ) {
                                    arrData.push('0\t' + strRecord);
                                    bolUncheckedFound = true;

                                } else if (
                                    jsnFilter.values
                                        .indexOf(strValue) !== -1
                                ) {
                                    arrData.push('-1\t' + strRecord);

                                } else {
                                    arrData.push('0\t' + strRecord);
                                    bolUncheckedFound = true;
                                }

                            } else if (
                                jsnFilter &&
                                jsnFilter.type === 'exclusion'
                            ) {
                                if (
                                    jsnFilter.blanks &&
                                    strValue === '(blanks)'
                                ) {
                                    arrData.push('-1\t' + strRecord);

                                } else if (
                                    jsnFilter.blanks === false &&
                                    strValue === '(blanks)'
                                ) {
                                    arrData.push('0\t' + strRecord);
                                    bolUncheckedFound = true;

                                } else if (
                                    jsnFilter.values
                                        .indexOf(strValue) !== -1
                                ) {
                                    arrData.push('0\t' + strRecord);
                                    bolUncheckedFound = true;

                                } else {
                                    arrData.push('-1\t' + strRecord);
                                }
                            }
                        } else {
                            break;
                        }

                        i += 1;
                    }
                }
            }
        );
    }

    function internalSELECTcolumnUnique(
        //element,
        //uniqueFilterElement,
        //valueListElement,
        //strColumn
    ) {
        //
    }




    function dataSELECTcolumnUnique(
        element,
        uniqueFilterElement,
        valueListElement,
        strColumn
    ) {
        if (element.hasAttribute("src")) {
            databaseWSSELECTcolumnUnique(
                element,
                uniqueFilterElement,
                valueListElement,
                strColumn
            );
        } else {
            internalSELECTcolumnUnique(
                element,
                uniqueFilterElement,
                valueListElement,
                strColumn
            );
        }
    }
    function dataSELECT(element) {
        if (element.hasAttribute("src")) {
            databaseWSSELECT(element);
        } else {
            internalSELECT(element);
        }
    }
    function dataINSERT(element, strMode, jsnInsert) {
        if (element.hasAttribute("src")) {
            databaseWSINSERT(element, strMode, jsnInsert);
        } else {
            internalINSERT(element, strMode, jsnInsert);
        }
    }
    function dataUPDATE(element, strMode, jsnUpdate) {
        if (!element.hasAttribute('no-update')) {
            // we want to save the text selection of the current
            //      control before we do the update
            element.internalDisplay.focus.selectionRange = null;
            if (
                element.internalDisplay.focus.latest &&
                (
                    document.activeElement.nodeName === 'INPUT' ||
                    document.activeElement.nodeName === 'TEXTAREA'
                )
            ) {
                element.internalDisplay.focus.selectionRange = (
                    GS.getInputSelection(document.activeElement)
                );
            }

            if (element.hasAttribute("src")) {
                databaseWSUPDATE(element, strMode, jsnUpdate);
            } else {
                internalUPDATE(element, strMode, jsnUpdate);
            }
        }
    }
    function dataDELETE(element, jsnDeleteData) {
        if (element.hasAttribute("src")) {
            databaseWSDELETE(element, jsnDeleteData);
        } else {
            internalDELETE(element, jsnDeleteData);
        }
    }

// #############################################################################
// ####################### POST-RENDER UTILITY FUNCTIONS #######################
// #############################################################################

    // sometimes you need to know what records are selected, this function
    //      returns the selected record numbers
    function getSelectedRecordIndexes(element) {
        var arrRows = element.internalSelection.rows.slice(0);

        if (arrRows[0] === 'header') {
            arrRows.shift();
        }
        if (arrRows[arrRows.length - 1] === 'insert') {
            arrRows.pop();
        }

        return arrRows;
    }

    // this function takes the cell which is the endpoint of the latest
    //      selection, focuses into it and selects all text of possible
    function focusIntoCell(
        element,
        record,
        column,
        iterationNumber
    ) {
        var jsnViewportRange;

        var cellElement;
        var focusElement;

        var strTag;
        var strValue;

        // default iterationNumber so that if this is the first run
        //      iterationNumber will contain 0
        if (iterationNumber === undefined) {
            iterationNumber = 0;
        }

        // if cell is in the rendered range:
        //      warn and stop execution
        jsnViewportRange = element.internalDisplay.currentRange;
        //console.trace(jsnViewportRange, record, column);
        if (
            // if we're not in the insert record:
            //      test if cell is within the current record and column range
            (
                !jsnViewportRange.insertRecord &&
                (
                    record < jsnViewportRange.fromRecord ||
                    record > jsnViewportRange.toRecord ||
                    column < jsnViewportRange.fromColumn ||
                    column > jsnViewportRange.toColumn
                )
            ) ||
            // if we're in the insert record (and the insert record is visible):
            //      test if cell is within the current column range
            (
                jsnViewportRange.insertRecord && (
                    column < jsnViewportRange.fromColumn ||
                    column > jsnViewportRange.toColumn
                )
            )
        ) {
            console.warn('GS-TABLE Warning: "focusIntoCell" was called to' +
                    ' focus into a cell that is not rendered. Stopping' +
                    ' execution of "focusIntoCell".');
            return;
        }

        // we need to be able to do an element query inside the target cell, so
        //      here we get the cell element
        if (record === 'insert' && jsnViewportRange.insertRecord) {
            cellElement = xtag.query(
                element.elems.dataViewport,
                'gs-cell' +
                        '.table-insert' +
                        '[data-col-number="' + column + '"]'
            )[0];
        } else {
            cellElement = xtag.query(
                element.elems.dataViewport,
                'gs-cell' +
                        '.table-cell' +
                        '[data-row-number="' + record + '"]' +
                        '[data-col-number="' + column + '"]'
            )[0];
        }

        // if the cell was not found:
        //      warn
        //              because we checked and the cell is supposed to be in
        //                  the current viewport range
        //      re-render
        //              to put the element where it's supposed to be
        //      re-run this function
        //              because the re-render may cause the cell to go out of
        //                  range and therefore, we need to re-test
        //      stop execution
        //              because this function needs to run from the beginning
        if (!cellElement) {
            if (iterationNumber < 1) {
                // warn
                console.warn('GS-TABLE Warning: "focusIntoCell" was called to' +
                        ' focus into a cell that is not rendered. Stopping' +
                        ' execution of "focusIntoCell".');

                // re-render
                element.internalDisplay.fullRenderRequired = true;
                renderScrollDimensions(element);

                // re-run this function
                focusIntoCell(
                    element,
                    record,
                    column,
                    (iterationNumber + 1)
                );

            // infinite recursion detected, warn
            } else {
                // warn
                console.warn('GS-TABLE Warning: infinite loop detected' +
                        ' in "focusIntoCell". Stopping execution of' +
                        ' "focusIntoCell".');
            }

            // stop execution
            return;
        }

        // traverse into the cell and find first focusable element
        focusElement = xtag.query(
            cellElement,
            'input, textarea, select, [tabindex]'
        )[0];

        // if a focus element was found: focus into it
        if (focusElement) {
            focusElement.focus();

            // we want all the text selected, so if the focused element is an
            //      INPUT or TEXTAREA and it has a value: select all of the text
            strTag = focusElement.nodeName;
            strValue = (focusElement.value || '');
            if (
                (strTag === 'INPUT' || strTag === 'TEXTAREA') &&
                strValue.length > 0
            ) {
                GS.setInputSelection(focusElement, 0, strValue.length);
            }
        }
    }

    // sometimes we wan't a particular cell visible in the viewport, so this
    //      function moves the cell into view. if the cell is already in view,
    //      this function will just re-render the selection
    // strStickMode is a string that can contain one or more of these keywords:
    //          'top'
    //          'bottom'
    //          'left'
    //          'right'
    //      so, if you want the cell to be moved to the bottom-left
    //          you can send 'bottom-left' or 'bottomleft' or 'leftbottom' etc.
    //          however, you will get a warning if you send 'leftright' because
    //          those choices are contradictory
    function scrollCellIntoView(element, cellRecord, cellColumn, strStickMode) {
        var i;
        var len;

        var columnBorderWidth;
        var recordBorderHeight;
        var arrColumnWidths;
        var arrRecordHeights;

        var intCellWidth;
        var intCellHeight;
        var intCellTop;
        var intCellBottom;
        var intCellLeft;
        var intCellRight;

        var intViewportWidth;
        var intViewportHeight;
        var intViewportTop;
        var intViewportBottom;
        var intViewportLeft;
        var intViewportRight;

        var bolScrollMoved;

        var bolStickTop;
        var bolStickLeft;
        var bolStickBottom;
        var bolStickRight;

        // we're saving these to variables for quicker/easier access
        columnBorderWidth = element.internalDisplay.columnBorderWidth;
        recordBorderHeight = element.internalDisplay.recordBorderHeight;

        // we need to get column and record dimensions
        arrColumnWidths = element.internalDisplay.columnWidths;
        arrRecordHeights = element.internalDisplay.recordHeights;

        // we want shortcuts that turn strStickMode into boolean variables
        if (strStickMode) {
            bolStickTop = (strStickMode.indexOf('top') !== -1);
            bolStickLeft = (strStickMode.indexOf('left') !== -1);
            bolStickBottom = (strStickMode.indexOf('bottom') !== -1);
            bolStickRight = (strStickMode.indexOf('right') !== -1);

            // warn if two stick modes are contradictory
            if (bolStickTop && bolStickBottom) {
                console.warn('GS-TABLE Warning: Contradictory parameter sent' +
                        ' to scrollCellIntoView, you can\'t scroll a' +
                        ' cell to the top and the bottom of the viewport at' +
                        ' the same time. Stick to bottom will be cancelled.' +
                        ' Parameter Text: "' + strStickMode + '"');
                bolStickBottom = false;
            }
            if (bolStickLeft && bolStickRight) {
                console.warn('GS-TABLE Warning: Contradictory parameter sent' +
                        ' to scrollCellIntoView, you can\'t scroll a' +
                        ' cell to the left and the right of the viewport at' +
                        ' the same time. Stick to right will be cancelled.' +
                        ' Parameter Text: "' + strStickMode + '"');
                bolStickRight = false;
            }
        }

        // get location of the top, bottom, left and right of the record, we
        //      need these to calculate if we need to scroll to the cell

        // if the cell is in the header, we need to grab it's height from the
        //      internal display values
        if (cellRecord === 'header') {
            intCellHeight = element.internalDisplay.headerHeight;

        } else if (cellRecord === 'insert') {
            intCellHeight = element.internalDisplay.insertRecordHeight;

        // else, we can use the record height array
        } else {
            intCellHeight = arrRecordHeights[cellRecord];
        }

        // we want to get how far the record is from the top of the data, so
        //      if the record isn't the header,
        //          add up the record heights until the correct record
        //      else,
        //          default to 0
        intCellTop = 0;
        if (cellRecord === 'header') {
            intCellTop = 0;

        } else if (cellRecord === 'insert') {
            i = 0;
            len = arrRecordHeights.length;
            while (i < len) {
                intCellTop += arrRecordHeights[i];
                intCellTop += recordBorderHeight;
                i += 1;
            }

        } else {
            i = 0;
            len = cellRecord;
            while (i < len) {
                intCellTop += arrRecordHeights[i];
                intCellTop += recordBorderHeight;
                i += 1;
            }
        }

        // if the cell is a record selector, we need to grab it's width from the
        //      internal display values
        if (cellColumn === 'selector') {
            intCellWidth = element.internalDisplay.recordSelectorWidth;

        // else, we can use the column width array
        } else {
            intCellWidth = arrColumnWidths[cellColumn];
        }

        // we want to get how far the column is from the left of the data, so
        //      if the column isn't the record selector,
        //          add up the column widths until the correct column
        //      else,
        //          default to 0
        intCellLeft = 0;
        if (cellColumn !== 'selector') {
            i = 0;
            len = cellColumn;
            while (i < len) {
                intCellLeft += arrColumnWidths[i];
                intCellLeft += columnBorderWidth;
                i += 1;
            }
        }

        // calculate the cell bottom and right
        intCellBottom = (intCellTop + intCellHeight);
        intCellRight = (intCellLeft + intCellWidth);

        // get location of the top, bottom, left and right boundery lines of the
        //      viewport, we need these to calculate if we need to scroll to the
        //      cell
        intViewportWidth = (
            element.elems.dataViewport.clientWidth - (
                element.internalScrollOffsets.left +
                element.internalScrollOffsets.right
            )
        );
        intViewportHeight = (
            element.elems.dataViewport.clientHeight - (
                element.internalScrollOffsets.top +
                element.internalScrollOffsets.bottom
            )
        );
        intViewportTop = (element.internalScroll.top);
        intViewportLeft = (element.internalScroll.left);
        intViewportBottom = (intViewportTop + intViewportHeight);
        intViewportRight = (intViewportLeft + intViewportWidth);

        // we need a variable to say if we needed to scroll the viewport
        bolScrollMoved = false;

        // if the top of the cell is not visible, scroll it into view
        if (
            intCellTop < intViewportTop ||
            bolStickTop
        ) {
            element.internalScroll.top = intCellTop;
            bolScrollMoved = true;

        // if the bottom of the cell is not visible, scroll it into view
        } else if (
            intCellBottom > intViewportBottom ||
            bolStickBottom
        ) {
            element.internalScroll.top = (
                intCellBottom - intViewportHeight
            );
            bolScrollMoved = true;
        }

        // if the left of the cell is not visible, scroll it into view
        if (
            intCellLeft < intViewportLeft ||
            bolStickLeft
        ) {
            element.internalScroll.left = intCellLeft;
            bolScrollMoved = true;

        // if the right of the cell is not visible, scroll it into view
        } else if (
            intCellRight > intViewportRight ||
            bolStickRight
        ) {
            element.internalScroll.left = (intCellRight - intViewportWidth);
            bolScrollMoved = true;
        }

        // sometimes, using stick mode will cause this function to scroll too
        //      far in order to maintain that stick. so, here we handle
        //      scrolling past the max.
        // why not handle this in the renderScrollLocation function you ask?
        //      if a function touches a shared variable, it should be self
        //          contained when it comes to validation because we don't want
        //          someone to create a new function and forget to validate the
        //          shared variables (and therefore, cause errors). so if you
        //          write a function which touches some shared variable and you
        //          notice an error, make the function clean up it's own mess.

        // prevent scrolling past the max left scroll
        if (element.internalScroll.left > element.internalScroll.maxLeft) {
            element.internalScroll.left = element.internalScroll.maxLeft;

        // prevent scrolling behind the min left scroll
        } else if (element.internalScroll.left < 0) {
            element.internalScroll.left = 0;
        }

        // prevent scrolling past the max top scroll
        if (element.internalScroll.top > element.internalScroll.maxTop) {
            element.internalScroll.top = element.internalScroll.maxTop;

        // prevent scrolling behind the min top scroll
        } else if (element.internalScroll.top < 0) {
            element.internalScroll.top = 0;
        }

        // if the scroll moved: render location
        if (bolScrollMoved) {
            // render location so the user can see the cell
            renderScrollLocation(element);

        // else, just rerender the selection
        } else {
            renderSelection(element);
        }
    }

    // sometimes the selection is moved out of view, this function will scroll
    //      the last selection range's endpoint into view and re-render the
    //      scroll location
    // if the selected cell is already in view, this function will just
    //      re-render the selection
    // strStickMode is a string that can contain one or more of these keywords:
    //          'top'
    //          'bottom'
    //          'left'
    //          'right'
    //      so, if you want the selected endpoint to stick to the bottom-left
    //          you can send 'bottom-left' or 'bottomleft' or 'leftbottom' etc.
    //          however, you will get a warning if you send 'leftright' because
    //          those choices are contradictory
    function scrollSelectionIntoView(element, strStickMode) {
        var jsnRange;
        var cellColumn;
        var cellRecord;

        // we need to the latest selection range so that we know what cell to
        //      scroll into view
        jsnRange = element.internalSelection.ranges[
            element.internalSelection.ranges.length - 1
        ];

        // if there is no selection, there is nothing to scroll to,
        //      so, warn the dev and stop this function from running
        if (!jsnRange) {
            console.warn(
                'GS-TABLE Warning: scrollSelectionIntoView was ' +
                'called when there was no selection to scroll into view.'
            );
            return;
        }

        // get the cell's column and record number so that we can pass it along
        cellRecord = (jsnRange.end.row);
        cellColumn = (jsnRange.end.column);

        // send the cell's location to the scrollCellIntoView function
        scrollCellIntoView(element, cellRecord, cellColumn, strStickMode);
    }

    // this function takes the cell which is the endpoint of the latest
    //      selection, focuses into it and selects all text of possible
    function focusIntoSelectedCell(element) {
        var jsnRange;
        var bolReWriteSelection;

        // we use the latest range a lot, let's save a shortcut
        jsnRange = element.internalSelection.ranges[
            element.internalSelection.ranges.length - 1
        ];

        // if more than one selection: warn and move selection to endpoint of
        //      latest selection
        if (element.internalSelection.ranges.length > 1) {
            console.warn('GS-TABLE Warning: "focusIntoSelectedCell" called' +
                    ' when multiple selections were present. Now clearing all' +
                    ' selections and creating new selection at last' +
                    ' selection\'s endpoint.');
            // because this if block uses the same issue resolution as the
            //      "else if" block below, we'll just set a boolean variable and
            //      below this waterfall we'll add another if statement that
            //      handles this type of resolution
            bolReWriteSelection = true;

        // else if one selection that is more than one cell:
        //      warn and move selection to endpoint of latest selection
        } else if (
            jsnRange &&
            (
                jsnRange.start.column !== jsnRange.end.column ||
                jsnRange.start.row !== jsnRange.end.row
            )
        ) {
            console.warn('GS-TABLE Warning: "focusIntoSelectedCell" called' +
                    ' when the selection contained multiple cells. Now' +
                    ' clearing all selections and creating new selection at' +
                    ' last selection\'s endpoint.');
            // because this if block uses the same issue resolution as the
            //      "if" block above, we'll just set a boolean variable and
            //      below this waterfall we'll add another if statement that
            //      handles this type of resolution
            bolReWriteSelection = true;

        // else if no selections:
        //      warn, focus hiddenFocusControl so we can still listen to
        //      keypresses and stop execution
        } else if (!jsnRange) {
            console.warn('GS-TABLE Warning: "focusIntoSelectedCell" called' +
                    ' when there was no selection to focus into. Stopping' +
                    ' execution of "focusIntoSelectedCell".');

            focusHiddenControl(element);

            return;
        }

        // if there's more than one selection or the only selection contains
        //      multiple, the response is the same: change selection to only
        //      last cell of last selection range, so, instead of copying the
        //      code to resolve it into both cases in the waterfall, they set
        //      a boolean variable if this is what they need done.
        if (bolReWriteSelection) {
            // set the new list of selection ranges to the endpoint of the
            //      latest selection
            element.internalSelection.ranges = [
                {
                    "start": {
                        "row": jsnRange.end.row,
                        "column": jsnRange.end.column
                    },
                    "end": {
                        "row": jsnRange.end.row,
                        "column": jsnRange.end.column
                    },
                    "negator": false
                }
            ];

            // get the new selection range, this is a shortcut
            jsnRange = element.internalSelection.ranges[0];

            // re-render the selection because we've just changed it and
            //      the user needs to see the update
            renderSelection(element);
        }

        // pass the last selection's enpoint cell to focusIntoCell
        focusIntoCell(
            element,
            jsnRange.end.row,
            jsnRange.end.column
        );
    }

    // there are multiple places where we just want to delete the selected
    //      records. so, we'll make a function that handles all the error
    //      checking involved with using the selection to delete records
    function deleteSelectedRecords(element) {
        // if nothing is selected, open a dialog letting the user know that
        //      they need to choose something
        if (element.internalSelection.ranges.length === 0) {
            GS.msgbox(
                'No Records To Delete',
                '<center>' +
                        'Please choose a record to delete.' +
                        '</center>',
                ['Ok']
            );

        // else, everything is copacetic, let's initiate delete
        } else if (!element.hasAttribute('no-delete')) {
            dataDELETE(element, {
                "recordIndexes": getSelectedRecordIndexes(element),
                // we still need the user to confirm the delete
                "deleteConfirmed": false
            });
        }
    }

    // this function is used to stop the actions of the next function
    //      "dragScrollStart".
    function dragScrollEnd(element) {
        // we only want to run clearInterval if there is an interval to stop
        if (element.internalTimerIDs.scrollIntervalID !== null) {
            // stop scroll interval to stop the scrolling
            clearInterval(element.internalTimerIDs.scrollIntervalID);

            // clear scrolling ID to make it clear that that
            //      interval has been cancelled
            element.internalTimerIDs.scrollIntervalID = null;
        }

        // the rest of these commands are harmless even if the scroll was
        //      never started

        // clear scrolling direction because we've stopped
        //      scrolling
        element.internalScroll.dragScrollingDirection = null;

        // set scrolling status variable to false so that the
        //      element recognizes that scrolling is stopped
        element.internalScroll.dragScrolling = false;
    }

    // some actions use a dragging motion, this means that we need to be able
    //      to scroll the viewport if the mouse drags off of the gs-table's
    //      outer bounderies. there is more than one place where this behavior
    //      is desired. the first two that come to mind are column reordering
    //      and column resizing.
    // the way this function works is it kicks off an interval to scroll the
    //      viewport incrementally every iteration until the "dragScrollEnd"
    //      function is called
    // eventually, we'll probably add two parameters, one for vertical speed
    //      and one for horizontal speed. these parameters will need to
    //      default to a reasonable speed
    // ### NEED CODING ###
    function dragScrollStart(element, callback, strScrollDirection) {
        var jsnDirection;
        var bolScrollTop;
        var bolScrollLeft;
        var bolScrollBottom;
        var bolScrollRight;

        // set scrolling to true to prevent future mouse events
        //      from starting new scroll events
        element.internalScroll.dragScrolling = true;

        // parse direction string
        jsnDirection = directionStringBreakdown(strScrollDirection);

        // convenience variables
        bolScrollTop = jsnDirection.bolTop;
        bolScrollLeft = jsnDirection.bolLeft;
        bolScrollBottom = jsnDirection.bolBottom;
        bolScrollRight = jsnDirection.bolRight;

        // we need to be able to check of the direction string
        //      changed, so we'll save a copy to compare against
        strScrollDirection = jsnDirection.resolvedString;

        //console.log(
        //    'start',
        //    strScrollDirection,
        //    bolScrollTop,
        //    bolScrollLeft,
        //    bolScrollBottom,
        //    bolScrollRight
        //);

        // save the scroll direction internally so that other code can work
        //      appropriately for the scroll direction
        element.internalScroll.dragScrollingDirection = (
            strScrollDirection
        );

        // remember, we need to be able to scroll two directions at
        //      the same time

        // create scroll interval and save the interval ID so
        //      we can stop the interval later
        element.internalTimerIDs.scrollIntervalID = setInterval(
            function () {
                var newScrollingDirection;
                var intLeftScrollAmount;
                var intLeftScroll;
                var intLeftMax;
                var intTopScrollAmount;
                var intTopScroll;
                var intTopMax;

                // we need to know if the direction string was changed
                newScrollingDirection = (
                    element.internalScroll.dragScrollingDirection
                );

                // if the direction string was changed, recalculate
                //      the direction variables
                if (newScrollingDirection !== strScrollDirection) {
                    //console.log('SCROLL DIRECTION CHANGED');

                    jsnDirection = directionStringBreakdown(
                        newScrollingDirection
                    );

                    bolScrollTop = jsnDirection.bolTop;
                    bolScrollLeft = jsnDirection.bolLeft;
                    bolScrollBottom = jsnDirection.bolBottom;
                    bolScrollRight = jsnDirection.bolRight;

                    strScrollDirection = jsnDirection.resolvedString;

                    // save the scroll direction internally
                    element.internalScroll.dragScrollingDirection = (
                        strScrollDirection
                    );
                }

                // we want to adjust the speed of the scrolling
                //      depending on how far to the left or
                //      right the mouse is
                // ### NEED CODING ###
                if (bolScrollLeft || bolScrollRight) {
                    intLeftScrollAmount = 10;
                }
                if (bolScrollTop || bolScrollBottom) {
                    intTopScrollAmount = 10;
                }

                // we should also change to scrolling by column
                //      right now, the scrolling speed on the
                //      scrollbar is evenly paced but columns of
                //      different widths make the viewport
                //      scroll unevenly
                // ### NEED CODING ###

                // get current and max scroll for scroll
                //      direction
                if (bolScrollLeft || bolScrollRight) {
                    intLeftScroll = (element.internalScroll.left);
                    intLeftMax = (element.internalScroll.maxLeft);
                }
                if (bolScrollTop || bolScrollBottom) {
                    intTopScroll = (element.internalScroll.top);
                    intTopMax = (element.internalScroll.maxTop);
                }

                //console.log(
                //    strScrollDirection,
                //    bolScrollTop,
                //    bolScrollLeft,
                //    bolScrollBottom,
                //    bolScrollRight
                //);

                // if we are at the max of all directions that we
                //      are scrolling, stop scrolling interval
                // overscroll is handled in the else
                // underscroll is handled in the else
                if (
                    (
                        !bolScrollTop ||
                        intLeftScroll === 0
                    ) &&
                    (
                        !bolScrollLeft ||
                        intLeftScroll === 0
                    ) &&
                    (
                        !bolScrollBottom ||
                        intLeftScroll === intTopMax
                    ) &&
                    (
                        !bolScrollRight ||
                        intLeftScroll === intLeftMax
                    )
                ) {
                    //console.log('SCROLL STOPPED 1');
                    dragScrollEnd(element);

                } else if (
                    !bolScrollTop &&
                    !bolScrollLeft &&
                    !bolScrollBottom &&
                    !bolScrollRight
                ) {
                    //console.log('SCROLL STOPPED 2');
                    dragScrollEnd(element);

                // else, advance scroll in every direction we were
                //      told to
                } else {
                    if (bolScrollTop || bolScrollBottom) {
                        if (bolScrollTop) {
                            intTopScroll -= intTopScrollAmount;

                        } else if (bolScrollBottom) {
                            intTopScroll += intTopScrollAmount;
                        }

                        // prevent over/under scrolling

                        // prevent scrolling past the max
                        if (intTopScroll > intTopMax) {
                            intTopScroll = intTopMax;
                        }

                        // prevent scrolling behind the min
                        if (intTopScroll < 0) {
                            intTopScroll = 0;
                        }

                        // apply new scroll to correct direction
                        element.internalScroll.top = intTopScroll;
                    }

                    if (bolScrollLeft || bolScrollRight) {
                        if (bolScrollLeft) {
                            intLeftScroll -= intLeftScrollAmount;

                        } else if (bolScrollRight) {
                            intLeftScroll += intLeftScrollAmount;
                        }

                        // prevent scrolling past the max
                        if (intLeftScroll > intLeftMax) {
                            intLeftScroll = intLeftMax;
                        }

                        // prevent scrolling behind the min
                        if (intLeftScroll < 0) {
                            intLeftScroll = 0;
                        }

                        // apply new scroll to correct direction
                        element.internalScroll.left = intLeftScroll;
                    }

                    //console.log(
                    //    element.internalScroll.left,
                    //    element.internalScroll.top
                    //);

                    // render scroll
                    renderScrollLocation(element);

                    // the drag actions that use this function will sometimes
                    //      need to refresh something depending on the new
                    //      scroll position. the callback is for that purpose
                    if (callback) {
                        callback();
                    }
                }
            },
            50 // twentieth of a second refresh rate
        );
    }

// #############################################################################
// ############################## PASTE FUNCTIONS ##############################
// #############################################################################

    // when you paste for an insert, only some columns might be selected, this
    //      function takes the normalized paste data and trims out anything that
    //      would have been applied to an unseleted cell. after that, this
    //      function turns control over to the internal insert function
    function insertPasteString(element, arrPaste, intMaxPasteColumn) {
        var templateElement;
        var strSelection;
        var strOldRecord;
        var strNewRecord;
        var strCell;
        var strChar;

        var intStart;
        var intEnd;
        //var intMaxPasteColumn;
        var intMinPasteColumn;
        var intPastedColumn;
        var intColumn;

        var arrColumnElements;
        var arrColumns;

        var i;
        var len;
        var rec_i;
        var rec_len;

        // we need to know what columns of the insert record are selected
        strSelection = element.internalSelection.resolvedSelection[
            element.internalSelection.resolvedSelection.length - 1
        ];

        // if there is a record selector, remove that char from the selection
        //      string
        if (element.internalDisplay.recordSelectorVisible) {
            strSelection = strSelection.substring(1);
        }

        // the paste starts at the first selected cell
        intStart = strSelection.indexOf('F');
        intEnd = strSelection.lastIndexOf('F');

        // we want to paste the smaller of the selection or the available data,
        //      this is because we will not paste what we do not have and
        //      will not affect data that is not selected
        if ((intEnd - intStart) < intMaxPasteColumn) {
            intMaxPasteColumn = (intEnd - intStart);
        }

        intEnd = intStart + intMaxPasteColumn;

        // sometimes, an entire record is copied and pasted (including the
        //      record selector), we need to prevent this from being an
        //      issue
        if (element.internalSelection.columns[0] === 'selector') {
            intMinPasteColumn = 1;
        } else {
            intMinPasteColumn = 0;
        }

        //console.log('   intEnd:', intEnd);
        //console.log(' intStart:', intStart);
        //console.log('intMinCol:', intMinPasteColumn);
        //console.log('intMaxCol:', intMaxPasteColumn);

        // use the selected column list to filter the data of the paste
        i = 0;
        len = arrPaste.length;
        while (i < len) {
            strOldRecord = arrPaste[i];

            // null out any cells that would apply to an unselected column
            // remove any cells that go further than the last selected column
            intColumn = 0;
            intPastedColumn = 0;
            strNewRecord = '';
            strCell = '';
            rec_i = 0;
            rec_len = strOldRecord.length;
            while (rec_i < rec_len) {
                strChar = strOldRecord[rec_i];

                // if the current character is not a tab: add it to the current
                //      cell variable
                if (strChar !== '\t') {
                    strCell += strChar;
                }

                // if the current character is a tab or we are at the end of the
                //      record: handle current cell
                if (
                    strChar === '\t' ||
                    rec_i === (rec_len - 1)
                ) {
                    if (intColumn >= intMinPasteColumn) {
                        // if this isn't the first column: add a tab character
                        //      to separate the cells
                        if (intPastedColumn > 0) {
                            strNewRecord += '\t';
                        }

                        // if this column is selected: add cell to paste record
                        if (strSelection[intPastedColumn + intStart] === 'F') {
                            strNewRecord += strCell;

                        // else, replace the current cell with NULL
                        } else {
                            strNewRecord += '\\N';
                        }

                        intPastedColumn += 1;

                        if (intPastedColumn > intMaxPasteColumn) {
                            break;
                        }
                    }

                    // clear cell variable and advance column number
                    strCell = '';
                    intColumn += 1;
                }

                // if this column is past the last column we can paste to:
                //      stop adding cells from this record and move to the
                //      next record
                if (
                    intColumn > (
                        (intEnd - intStart) + intMinPasteColumn
                    )
                ) {
                    break;
                }
                rec_i += 1;
            }

            // update the paste data with the new record
            arrPaste[i] = strNewRecord;
            i += 1;
        }

        //console.log(arrPaste);

        // we need to say what columns we are inserting to, so here we take the
        //      start and end column numbers and turn that into an array of
        //      column names for the insert

        templateElement = document.createElement('template');
        templateElement.innerHTML = templateExtractVisibleCellRange(
            element,
            element.internalTemplates.insertRecord,
            intStart,
            (intEnd + 1)
            // the plus one is because the template extract function
            //      expects 0/1 to get the first column, not 0/0
        );

        arrColumnElements = xtag.query(
            templateElement.content,
            'gs-cell [column]'
        );
        arrColumns = [];
        i = 0;
        len = arrColumnElements.length;
        while (i < len) {
            arrColumns.push(arrColumnElements[i].getAttribute('column'));
            i += 1;
        }

        //console.log(
        //    intMinPasteColumn,
        //    intMaxPasteColumn,
        //    intStart,
        //    intEnd,
        //    //templateElement,
        //    //arrColumnElements,
        //    arrColumns
        //);

        // call the internal insert function, to be routed to the correct
        //      insert protocol
        dataINSERT(element, 'multi-record', {
            "data": {
                "values": arrPaste,
                "columns": arrColumns,
                "addin": getInsertAddin(element)
            },
            "insertConfirmed": false
        });
    }

    // when you paste for an update, only some cells might be selected, this
    //      function takes the normalized paste data and trims out anything that
    //      would have been applied to an unseleted cell. after that, this
    //      function turns control over to the internal update function
    function updatePasteString(element, arrPaste, intMaxPasteColumn) {
        var arrRecords;
        var arrColumns;
        var intStartColumn;
        var intEndColumn;
        var arrSelection;
        var strSelection;
        var arrUpdateIndexes = [];
        var arrTranslated = [];

        var paste_i;
        var update_i;
        var i;
        var len;
        var rec_i;
        var rec_len;

        var strOldRecord;
        var strNewRecord;
        var intColumn;
        var intMinPasteColumn;
        var strCell;
        var strChar;
        var intPasteColumn;
        var intColumnOffset;

        var templateElement;
        var arrInsertCellElements;
        var arrUpdateCellElements;
        var arrCellElements;
        var arrColumnElements;
        var arrColumnNames;

        var arrSelectedStates = ['B', 'D', 'F', 'H', 'J', 'L'];

        // save selection cache so that we can check if a particular cell is
        //      selected
        arrSelection = element.internalSelection.resolvedSelection;

        // you can't paste into the header
        if (element.internalDisplay.headerVisible) {
            arrSelection.shift();
        }

        // you can't paste into the insert from here
        if (element.internalDisplay.insertRecordVisible) {
            arrSelection.pop();
        }

        // save the indexes of the records that we're going to paste over
        arrRecords = element.internalSelection.rows;

        // you can't paste into the header
        if (arrRecords[0] === 'header') {
            arrRecords.shift();
        }

        // you can't paste into the insert from here
        if (arrRecords[arrRecords.length - 1] === 'insert') {
            arrRecords.pop();
        }

        // save the indexes of the columns that we're going to paste over
        arrColumns = element.internalSelection.columns;

        // you can't paste into the record selector
        if (arrColumns[0] === 'selector') {
            arrColumns.shift();
        }

        // get the first selected row and column number
        intStartColumn = arrColumns[0];

        // get the last selected row and column number
        intEndColumn = arrColumns[arrColumns.length - 1];

        // we want to paste the smaller of the selection or the available data,
        //      this is because we will not paste what we do not have and
        //      will not affect data that is not selected
        if ((intEndColumn - intStartColumn) < intMaxPasteColumn) {
            intMaxPasteColumn = (intEndColumn - intStartColumn);
        }

        intEndColumn = (intStartColumn + intMaxPasteColumn);

        //console.log(intStartColumn, intEndColumn, intMaxPasteColumn);

        // we need to know the offset in the row selection string caused by
        //      the record selectors
        intColumnOffset = 0;
        if (element.internalDisplay.recordSelectorVisible) {
            intColumnOffset = 1;
        }

        // we need to know what columns we are updating, so here we take the
        //      start and end column numbers and turn that into an array of
        //      column names for the update
        templateElement = document.createElement('template');

        templateElement.innerHTML = (
            element.internalTemplates.insertRecord
        );
        arrInsertCellElements = xtag.query(
            templateElement.content,
            'gs-cell'
        );

        templateElement.innerHTML = (
            element.internalTemplates.record.templateHTML
        );
        arrUpdateCellElements = xtag.query(
            templateElement.content,
            'gs-cell'
        );

        if (arrInsertCellElements.length > 0) {
            arrCellElements = arrInsertCellElements;
        } else {
            arrCellElements = arrUpdateCellElements;
        }

        // if we have an insert record, get the column names from there
        arrColumnNames = [];
        i = 0;
        len = arrColumns.length;
        while (i < len) {
            //console.log('test 1 1', arrColumns[i]);
            //console.log('test 1 2', arrCellElements[arrColumns[i]]);

            arrColumnElements = xtag.query(
                arrCellElements[arrColumns[i]],
                '[column]'
            );

            //console.log('test 1 3', arrColumnElements);

            if (arrColumnElements && arrColumnElements.length > 0) {
                arrColumnNames.push(
                    arrColumnElements[0].getAttribute('column')
                );

                //console.log(arrColumnNames.length, intMaxPasteColumn);
                if (arrColumnNames.length === (intMaxPasteColumn + 1)) {
                    break;
                }
            } else {
                arrColumns.splice(i, 1);
                i -= 1;
                len -= 1;
            }
            i += 1;
        }

        // loop through rows starting from start row
        paste_i = 0; // paste record index
        update_i = 0; // update record index
        len = arrPaste.length;

        // sometimes the paste is longer than the list of selected records, so
        //      if that's the case than we want to use the selection length
        if (len > arrRecords.length) {
            len = arrRecords.length;
        }

        // sometimes a header is selected, if it is, skip the first record
        if (element.internalSelection.rows[0] === 'header') {
            paste_i += 1;
        }

        // sometimes, an entire record is copied and pasted (including the
        //      record selector), we need to prevent this from being an
        //      issue
        if (element.internalSelection.columns[0] === 'selector') {
            intMinPasteColumn = 1;
        } else {
            intMinPasteColumn = 0;
        }

        while (update_i < len) {
            strOldRecord = arrPaste[paste_i];

            // we want the selection string for the current record
            strSelection = arrSelection[arrRecords[update_i]];

            // null out any cells that would apply to an unselected column
            // remove any cells that go further than the last selected column
            intColumn = 0;
            strNewRecord = '';
            strCell = '';
            intPasteColumn = 0;
            rec_i = 0;
            rec_len = strOldRecord.length;
            while (rec_i < rec_len) {
                strChar = strOldRecord[rec_i];

                // if the current character is not a tab: add it to the current
                //      cell variable
                if (strChar !== '\t') {
                    strCell += strChar;
                }

                // if the current character is a tab or we are at the end of the
                //      record: handle current cell
                if (
                    strChar === '\t' ||
                    rec_i === (rec_len - 1)
                ) {
                    if (intColumn >= intMinPasteColumn) {
                        // if this isn't the first column: add a tab character
                        //      to separate the cells
                        if (intPasteColumn > 0) {
                            strNewRecord += '\t';
                        }

                        // if this column is selected: add cell to paste record
                        if (
                            arrSelectedStates.indexOf(
                                strSelection[
                                    (
                                        arrColumns[intPasteColumn] +
                                        intColumnOffset
                                    )
                                ]
                            ) > -1
                        ) {
                            strNewRecord += strCell;

                        // else, replace the current cell with it's current
                        //      value
                        } else {
                            strNewRecord += getCell(
                                element,
                                arrColumnNames[intPasteColumn],
                                arrRecords[update_i],
                                false // not decoded
                            );
                        }
                        intPasteColumn += 1;

                        if (intPasteColumn > intMaxPasteColumn) {
                            break;
                        }
                    }

                    // clear cell variable and advance column number
                    strCell = '';
                    intColumn += 1;
                }

                // if this column is past the last column we can paste to:
                //      stop adding cells from this record and move to the
                //      next record
                if (
                    intColumn > (
                        (intEndColumn - intStartColumn) + intMinPasteColumn
                    )
                ) {
                    break;
                }
                rec_i += 1;
            }

            // add the new record to the translated record list
            arrUpdateIndexes.push(arrRecords[update_i]);
            arrTranslated.push(strNewRecord);
            paste_i += 1;
            update_i += 1;
        }

        //console.log('test1', arrColumns.length, arrColumns);
        //console.log('test2', arrColumnNames.length, arrColumnNames);
        //console.log('test3', arrUpdateIndexes.length, arrUpdateIndexes);
        //console.log('test4', arrTranslated.length, arrTranslated);

        // lets make the update
        dataUPDATE(element, 'cell-range', {
            "data": {
                "columns": arrColumnNames,
                "records": arrUpdateIndexes,
                "values": arrTranslated
            },
            "updateConfirmed": false
        });
    }

    // the goal of this function is to normalize the data from a paste. once
    //      that's done, this function will route the paste data to either the
    //      insert or update paste functions
    function usePasteString(element, strUnnormalizedPasteString) {
        var elementMaker = document.createElement('template');

        var tableElement;
        var tbodyElement;
        var arrRecord;
        var arrUpdateRecord;
        var arrInsertRecord;
        var arrCell;
        var strRecord;
        var strCell;
        var intMaxUpdateRecord;
        var arrSelectedRows;

        var rec_i;
        var rec_len;

        var col_i;
        var col_len;

        // because pasting a large amount of data takes time, add a
        //      loader to let the user know we've started, just in case
        addLoader(element, 'paste-parse', 'Parsing Pasted Data...');

        // if no HTML or no valid HTML: build HTML using plain text
        if (
            strUnnormalizedPasteString.indexOf('<' + 'table') === -1 &&
            strUnnormalizedPasteString.indexOf('<' + 'tr') === -1
        ) {
            strUnnormalizedPasteString = delimitedStringToHTML(
                element,
                strUnnormalizedPasteString,
                '\t',
                '\n',
                '"',
                GS.decodeFromTabDelimited
            );
        }

        // second, get record elements
        elementMaker.innerHTML = strUnnormalizedPasteString;

        // we don't want any header or footer records to be pasted
        tableElement = xtag.query(elementMaker.content, 'table')[0];
        tbodyElement = xtag.queryChildren(tableElement, 'tbody')[0];

        // if there's a TBODY, get records from within there
        if (tbodyElement) {
            arrRecord = xtag.queryChildren(tbodyElement, 'tr');

        // else (no TBODY), get immediate children of table
        } else {
            arrRecord = xtag.queryChildren(tableElement, 'tr');
        }

        // third, create an array of text records from the HTML, make
        //      sure to split the records up into insert and update records

        // we need to know how many of the records are for the update and
        //      how many are for the insert. to do this, we'll take the
        //      selection rows length, subtract one for 'insert' and/or
        //      'header' if their present.
        arrSelectedRows = element.internalSelection.rows;
        intMaxUpdateRecord = arrSelectedRows.length - 1;

        if (arrSelectedRows[intMaxUpdateRecord] === 'insert') {
            intMaxUpdateRecord -= 1;
        }
        if (arrSelectedRows[0] === 'header') {
            intMaxUpdateRecord -= 1;
        }

        //console.log(intMaxUpdateRecord);

        // begin the loop!
        arrUpdateRecord = [];
        arrInsertRecord = [];
        rec_i = 0;
        rec_len = arrRecord.length;
        col_len = arrRecord[0].children.length;
        while (rec_i < rec_len) {
            strRecord = '';
            arrCell = xtag.toArray(arrRecord[rec_i].children);
            col_i = 0;
            while (col_i < col_len) {
                strRecord += (
                    strRecord
                        ? '\t'
                        : ''
                );

                if (arrCell[col_i]) {
                    strCell = getPlainText(arrCell[col_i], true);

                    if (strCell && strCell.trim()) {
                        strRecord += GS.encodeForTabDelimited(strCell);
                    } else {
                        strRecord += '\\N';
                    }
                } else {
                    strRecord += '\\N';
                }

                col_i += 1;
            }

            // if we've normalized this record for update,
            //      stick it in the update array.
            if (rec_i <= intMaxUpdateRecord) {
                arrUpdateRecord.push(strRecord);

            // else, we've normalized this record for insert,
            //      stick it in the insert array.
            } else {
                arrInsertRecord.push(strRecord);
            }

            rec_i += 1;
        }

        //console.log('arrUpdateRecord:', arrUpdateRecord);
        //console.log('arrInsertRecord:', arrInsertRecord);

        // fourth, initiate insert and/or paste
        if (
            arrInsertRecord.length > 0 &&
            element.internalDisplay.insertRecordVisible &&
            arrSelectedRows[arrSelectedRows.length - 1] === 'insert'
        ) {
            insertPasteString(element, arrInsertRecord, (col_len - 1));
        }
        if (arrUpdateRecord.length > 0) {
            updatePasteString(element, arrUpdateRecord, (col_len - 1));
        }

        // remove pasting loader
        removeLoader(element, 'paste-parse', 'Paste Data Parsed');
    }

    // the goal of this function is to extract the data in a paste event. once
    //      that's done, this function will route the paste data to the
    //      function in charge of using a paste string.
    function usePasteEvent(element, event) {
        var clipboardData;
        var pastePlain;
        var pasteHTML;

        // we don't want to do any pasting if there is nothing selected
        if (
            element.internalSelection.columns.length === 0 &&
            element.internalSelection.rows.length === 0
        ) {
            addLoader(
                element,
                'paste-fail',
                'Can\'t paste, nothing selected...'
            );
            removeLoader(
                element,
                'paste-fail',
                'Can\'t paste, nothing selected...'
            );

        // else, there is something selected, initiate paste
        } else {
            // because pasting a large amount of data takes time, add a
            //      loader to let the user know we've started, just in case
            addLoader(element, 'paste-extract', 'Extracting Pasted Data...');

            // to handle IE differences without having to write a lot of code to
            //      handle IE vs non-IE, we'll have one variable for the
            //      clipboardData and it will either be from the event object
            //      (non-IE) or it will come from the window (IE), this will cut
            //      down on browser specific code
            clipboardData = (event.clipboardData || window.clipboardData);

            // first, extract the unnormalized text

            // this is the main difference for IE vs non-IE, in IE we only get
            //      the text MIME type (we don't even try for HTML), everywhere
            //      else we try to get HTML
            if (window.clipboardData) {
                pastePlain = clipboardData.getData('Text');
            } else {
                pasteHTML = clipboardData.getData('text/html');
                pastePlain = clipboardData.getData('Text');
            }

            // remove pasting loader
            removeLoader(element, 'paste-extract', 'Paste Data Extracted');

            //console.log('##########################################');
            //console.log('################## HTML ##################');
            //console.log('##########################################');
            //console.log('|' + pasteHTML + '|');

            //console.log('##########################################');
            //console.log('############### PLAIN TEXT ###############');
            //console.log('##########################################');
            //console.log('|' + pastePlain + '|');

            // send paste string to be utilized
            usePasteString(
                element,
                (pasteHTML || pastePlain)
            );
        }
    }

// #############################################################################
// ############################# BUTTON FUNCTIONS ##############################
// #############################################################################

    function openInsertDialog(element) {
        var strTemplate;
        var templateElement;
        var beforeEvent;

        // get the template string from internal storage
        strTemplate = element.internalTemplates.insertDialog;

        // we want a template element because that's what we're going to send to
        //      the dialog function
        templateElement = document.createElement("template");

        // fill template element
        templateElement.innerHTML = ml(function () {/*
            <gs-page gs-dynamic>
                <gs-header>
                    <center><h3>Create</h3></center>
                </gs-header>
                <gs-body padded>
                    {{HTML}}
                </gs-body>
                <gs-footer>
                    <gs-grid gutter>
                        <gs-block>
                            <gs-button dialogclose>Cancel</gs-button>
                        </gs-block>
                        <gs-block>
                            <gs-button dialogclose
                                       listen-for-return
                                       bg-primary>Create</gs-button>
                        </gs-block>
                    </gs-grid>
                </gs-footer>
            </gs-page>
        */
        }).replace("{{HTML}}", strTemplate);

        // send out a before insert dialog open event, so that the developer
        //      can cancel it
        beforeEvent = GS.triggerEvent(element, "before_insert_dialog_open");

        // if the user prevents the default on the "before_insert_dialog_open"
        //      event, prevent the execution of the insert dialog
        if (beforeEvent.defaultPrevented) {
            return;
        }

        // open the dialog
        GS.openDialog(
            templateElement,
            // after open callback
            function () {
                var dialog = this;
                var arrElements;
                var element_i;
                var element_len;
                var strColumn;
                var strValue;

                // if the user has started typing into the insert record and
                //      then clicked the insert button, show the values from
                //      the insert record
                arrElements = xtag.query(dialog, '[column]');
                element_i = 0;
                element_len = arrElements.length;
                while (element_i < element_len) {
                    strColumn = arrElements[element_i].getAttribute('column');
                    strValue = element.internalData.insertRecord[strColumn];

                    // if a value was retained for the current column
                    if (strValue) {
                        // fill control with retained value
                        arrElements[element_i].value = strValue;
                    }
                    element_i += 1;
                }

                // trigger after insert dialog open so the dev can run code
                GS.triggerEvent(element, "after_insert_dialog_open", {
                    "relatedTarget": dialog
                });
            },
            // before close callback
            // ignore is the placeholder for "event", jslint ignores unused
            //      parameters that are named "ignore"
            function (ignore, strAnswer) {
                var dialog = this;
                var arrElements;
                var element_i;
                var element_len;
                var strColumn;
                var strValue;

                // we want the data that the user has put into the insert
                //      dialog to be put into internal storage, gather the
                //      values
                arrElements = xtag.query(dialog, '[column]');
                element_i = 0;
                element_len = arrElements.length;
                while (element_i < element_len) {
                    strColumn = arrElements[element_i].getAttribute('column');
                    strValue = arrElements[element_i].value;

                    // we only want to retain the value if there's a value to
                    //      retain
                    if (strValue) {
                        // retain the value in the internalData
                        element.internalData.insertRecord[strColumn] = strValue;

                        // some insert fields may be changed twice before an
                        //      insert, so only add the column name to the
                        //      changed columns list if that column name isn't
                        //      already in the list
                        if (
                            element
                                .internalData
                                .insertRecordRetainedColumns
                                .indexOf(strColumn) === -1
                        ) {
                            element
                                .internalData
                                .insertRecordRetainedColumns
                                .push(strColumn);
                        }

                    // if the user clears out a field that was previously
                    //      retained, we want to remove that value from the
                    //      retained list
                    } else if (
                        !strValue &&
                        element
                            .internalData
                            .insertRecordRetainedColumns
                            .indexOf(strColumn) > -1
                    ) {
                        element
                            .internalData
                            .insertRecord[strColumn] = undefined;
                        element
                            .internalData
                            .insertRecordRetainedColumns
                            .splice(
                                element
                                    .internalData
                                    .insertRecordRetainedColumns
                                    .indexOf(strColumn)
                            );
                    }
                    element_i += 1;
                }

                // if the answer is to insert the record: do so
                if (strAnswer !== 'Cancel' || strAnswer === 'Create') {
                    dataINSERT(element, "single-record", {
                        "data": {
                            "values": (
                                element
                                    .internalData
                                    .insertRecord
                            ),
                            "columns": (
                                element
                                    .internalData
                                    .insertRecordRetainedColumns
                            ),
                            "addin": getInsertAddin(element)
                        },
                        "insertConfirmed": true
                    });

                    // the insert attempt has been made, so we clear out the
                    //      retained values
                    element.internalData.insertRecord = {};
                    element.internalData.insertRecordRetainedColumns = [];

                // else, re-render so that the internal storage is used to fill
                //      the insert controls
                } else {
                    element.internalDisplay.fullRenderRequired = true;
                    renderLocation(element);
                }
            }
        );
    }

    // after a column is hidden, there is no way to unhide it. we need a
    //      function that will open a dialog to give the user the option of
    //      showing or hiding any column
    function openColumnHideDialog(element, targetElement, callback) {
        var templateElement;
        var afterOpenCallback;
        var beforeCloseCallback;

        templateElement = document.createElement('template');
        templateElement.setAttribute('data-max-width', '15em');
        templateElement.setAttribute('no-background', '');
        templateElement.innerHTML = ml(function () {/*
            <gs-page gs-dynamic class="gs-table-contextmenu">
                <gs-header><h4>Unhide Columns</h4></gs-header>
                <gs-body class="gs-table-column-checklist-container" padded>
                </gs-body>
                <gs-footer>
                    <gs-grid gutter>
                        <gs-block>
                            <gs-button dialogclose>Cancel</gs-button>
                        </gs-block>
                        <gs-block>
                            <gs-button dialogclose bg-primary>Apply</gs-button>
                        </gs-block>
                    </gs-grid>
                </gs-footer>
            </gs-page>
        */
        });

        // because we open the dialog different ways depending on parameters,
        //      we'll put the callbacks in variables for convenience
        afterOpenCallback = function () {
            var dialog = this;
            var containerElement;
            var i;
            var len;
            var strHTML;
            var bolVisible;
            var arrColumnNames;
            var arrColumnWidths;

            // we want to know the column widths so that we can pre-check any
            //      hidden columns
            arrColumnWidths = element.internalDisplay.columnWidths;

            // we want to show the user column names that make sense.
            arrColumnNames = element.internalDisplay.columnPlainTextNames;

            // we want to fill the gs-body with the column list so that the
            //      user can check and uncheck columns
            containerElement = xtag.query(
                dialog,
                '.gs-table-column-checklist-container'
            )[0];

            strHTML = '';
            i = 0;
            len = arrColumnWidths.length;
            while (i < len) {
                bolVisible = (arrColumnWidths[i] > 0);
                strHTML += (
                    '<gs-checkbox ' +
                    '        data-col-number="' + i + '"' +
                    '        value="' + bolVisible.toString() + '">&nbsp;' +
                        encodeHTML(arrColumnNames[i]) +
                    '</gs-checkbox>'
                );

                i += 1;
            }

            containerElement.innerHTML = strHTML;

            // we want the top gs-page to have corner rounding
            dialog.classList.add('gs-table-contextmenu');
        };

        // event parameter ignored
        beforeCloseCallback = function (ignore, strAnswer) {
            var dialog = this;
            var arrCheckbox;
            var arrColumnWidths;
            var arrDefaultColumnWidths;
            var i;
            var len;
            var colIndex;

            if (strAnswer !== 'Cancel') {
                // we want a shortcut to the column widths
                arrColumnWidths = (
                    element.internalDisplay.columnWidths
                );

                // we want a shortcut to the default column widths
                arrDefaultColumnWidths = (
                    element.internalDisplay.defaultColumnWidths
                );

                // loop through each checkbox and show or hide the columns
                //      depending on the checkbox value
                arrCheckbox = xtag.query(dialog, 'gs-checkbox');
                i = 0;
                len = arrCheckbox.length;
                while (i < len) {
                    colIndex = parseInt(
                        arrCheckbox[i].getAttribute('data-col-number'),
                        10
                    );

                    if (
                        // if column is not hidden
                        arrColumnWidths[colIndex] > 0 &&
                        // and checkbox says to hide the column
                        arrCheckbox[i].value === 'false'
                    ) {
                        // hide the column
                        arrColumnWidths[colIndex] = 0;

                    } else if (
                        // if column is hidden
                        arrColumnWidths[colIndex] === 0 &&
                        // and checkbox says to show the column
                        arrCheckbox[i].value === 'true'
                    ) {
                        // restore the column to it's default width
                        arrColumnWidths[colIndex] = (
                            arrDefaultColumnWidths[colIndex]
                        );
                    }
                    i += 1;
                }

                // master, you updated arrColumnWidths but didn't update
                //      the internal storage!
                // that is correct, grasshopper, arrColumnWidths is a
                //      reference to the original array variable and
                //      therefore when we make changes to arrColumnWidths
                //      the changes will automatically be reflected in the
                //      internal storage.

                // partial re-render doesn't know how to insert columns
                //      into the middle of the viewport
                element.internalDisplay.fullRenderRequired = true;
                renderLocation(element);
            }

            if (callback) {
                callback(strAnswer);
            }
        };

        if (targetElement) {
            GS.openDialogToElement(
                targetElement,
                templateElement,
                'right',
                afterOpenCallback,
                beforeCloseCallback
            );
        } else {
            GS.openDialog(
                templateElement,
                afterOpenCallback,
                beforeCloseCallback
            );
        }
    }



    function openDataSettingsDialog(element, buttonElement) {
        var templateElement = document.createElement('template');

        templateElement.setAttribute('data-max-width', '20em');
        templateElement.setAttribute('no-background', '');
        templateElement.setAttribute('data-overlay-close', 'true');
        templateElement.innerHTML = ml(function () {/*
<gs-page class="gs-table-contextmenu">
    <gs-body class="gs-table-contextmenu" padded>
        <div class="context-menu-header">Show Rows:</div>
<table>
    <tbody>
        <tr>
            <td>From:</td>
            <td><gs-number class="pref-limit-from" mini></gs-number></td>
        </tr>
        <tr>
            <td>To:</td>
            <td><gs-number class="pref-limit-to" mini></gs-number></td>
        </tr>
    </tbody>
</table>
        <hr />
        <gs-grid gutter>
            <gs-block>
                <gs-button dialogclose>Cancel</gs-button>
            </gs-block>
            <gs-block>
                <gs-button dialogclose bg-primary>Apply</gs-button>
            </gs-block>
        </gs-grid>
    </gs-body>
</gs-page>
            */
        })
            .replace(/\{\{RETURN\}\}/gi, '\n')
            .replace(/\{\{TAB\}\}/gi, '\t');

        // the control elements are found in the "after open" callback.
        //      the reason these variables are defined here is so that
        //      the "before close" callback has access to them for free.
        var limitFromControl;
        var limitToControl;

        GS.openDialogToElement(
            buttonElement,
            templateElement,
            'down',
            function () {
                var dialog = this;
                var intLimit;
                var intOffset;

                // we want the top gs-page to have corner rounding
                dialog.classList.add('gs-table-contextmenu');

                // find all of the control elements
                limitFromControl = xtag.query(
                    dialog,
                    '.pref-limit-from'
                )[0];
                limitToControl = xtag.query(
                    dialog,
                    '.pref-limit-to'
                )[0];

                intLimit = parseInt(
                    element.getAttribute('limit'),
                    10
                );
                intOffset = parseInt(
                    (element.getAttribute('offset') || '0'),
                    10
                );

                // set the values of all the controls
                limitFromControl.value = (intOffset + 1);
                limitToControl.value = (
                    (intLimit + intOffset) ||
                    element.internalData.records.length
                );
            },
            // event parameter is ignored
            function (ignore, strAnswer) {
                var intLimitFrom;
                var intLimitTo;
                var intLimit;

                var strOldLimit;
                var strOldOffset;

                if (strAnswer === 'Apply') {
                    // gather the control values
                    intLimitFrom = parseInt(
                        (limitFromControl.value || '0'),
                        10
                    ) - 1;
                    intLimitTo = parseInt(
                        (limitToControl.value || '0'),
                        10
                    );
                    intLimit = (intLimitTo - intLimitFrom);

                    // save the old limit and offset so that we can know
                    //      if the limit or offset changed
                    strOldLimit = element.getAttribute('limit');
                    strOldOffset = element.getAttribute('offset');

                    // only set the limit and offset attribute if we could
                    //      calculate them. else, remove them.
                    if (!isNaN(intLimit)) {
                        element.setAttribute('limit', intLimit);
                    } else {
                        element.removeAttribute('limit');
                    }
                    if (!isNaN(intLimitFrom)) {
                        element.setAttribute('offset', intLimitFrom);
                    } else {
                        element.removeAttribute('offset');
                    }

                    // if the limit or the offset changed, refresh the table
                    if (
                        element.getAttribute('limit') !== strOldLimit &&
                        element.getAttribute('offset') !== strOldOffset
                    ) {
                        dataSELECT(element);
                    }
                }
            }
        );
    }

    function openClipboardSettingsDialog(element, buttonElement) {
        var templateElement = document.createElement('template');

        templateElement.setAttribute('data-max-width', '20em');
        templateElement.setAttribute('no-background', '');
        templateElement.setAttribute('data-overlay-close', 'true');
        templateElement.innerHTML = ml(function () {/*
<gs-page class="gs-table-contextmenu">
    <gs-body class="gs-table-contextmenu" padded>
        <div class="context-menu-header">Paste Format:</div>
        <table>
            <tbody>
<tr>
    <td>Headers?</td>
    <td>
        <gs-select class="pref-copy-headers" mini>
            <option value="always">Always</option>
            <option value="never">Never</option>
            <option value="selected">Only when selected</option>
        </gs-select>
    </td>
</tr>
<tr>
    <td>Row Numbers?</td>
    <td>
        <gs-select class="pref-copy-selectors" mini>
            <option value="always">Always</option>
            <option value="never">Never</option>
            <option value="selected">Only when selected</option>
        </gs-select>
    </td>
</tr>
<tr>
    <td>Quote Character:</td>
    <td>
        <gs-select class="pref-quote-char" mini>
            <option value="\">Backslash (\)</option>
            <option value="/">Forward Slash (/)</option>
            <option value="|">Pipe (|)</option>
            <option value="&quot;">Double Quote (&quot;)</option>
            <option value="'">Single Quote (')</option>
        </gs-select>
    </td>
</tr>
<tr>
    <td>Escape Character:</td>
    <td>
        <gs-select class="pref-escape-char" mini>
            <option value="\">Backslash (\)</option>
            <option value="/">Forward Slash (/)</option>
            <option value="|">Pipe (|)</option>
            <option value="&quot;">Double Quote (&quot;)</option>
            <option value="'">Single Quote (')</option>
        </gs-select>
    </td>
</tr>
<tr>
    <td>Quote?</td>
    <td>
        <gs-select class="pref-copy-quote" mini>
            <option value="always">Always</option>
            <option value="never">Never</option>
            <option value="strings">Only on strings</option>
            <option value="delimiter-in-content">
                Cell contains separator
            </option>
        </gs-select>
    </td>
</tr>
<tr>
    <td>Record Separator:</td>
    <td>
        <gs-select class="pref-delimiter-record" mini>
            <option value="{{RETURN}}">Newline</option>
            <option value="|">Vertical Bar (|)</option>
            <option value=",">Comma (,)</option>
            <option value="{{TAB}}">Tab</option>
        </gs-select>
    </td>
</tr>
<tr>
    <td>Cell Separator:</td>
    <td>
        <gs-select class="pref-delimiter-cell" mini>
            <option value="{{RETURN}}">Newline</option>
            <option value="|">Vertical Bar (|)</option>
            <option value=",">Comma (,)</option>
            <option value="{{TAB}}">Tab</option>
        </gs-select>
    </td>
</tr>
<tr>
    <td>Empty values:</td>
    <td>
        <gs-select class="pref-null-value" mini>
            <option value="">(nothing)</option>
            <option value="NULL">"NULL"</option>
            <option value="null">"null"</option>
            <option value="EMPTY">"EMPTY"</option>
            <option value="empty">"empty"</option>
            <option value="Nothing">"Nothing"</option>
        </gs-select>
    </td>
</tr>
            </tbody>
        </table>
        <hr />
        <gs-grid gutter>
            <gs-block>
                <gs-button dialogclose>Cancel</gs-button>
            </gs-block>
            <gs-block>
                <gs-button dialogclose bg-primary>Apply</gs-button>
            </gs-block>
        </gs-grid>
    </gs-body>
</gs-page>
            */
        })
            .replace(/\{\{RETURN\}\}/gi, '\n')
            .replace(/\{\{TAB\}\}/gi, '\t');

        // the control elements are found in the "after open" callback.
        //      the reason these variables are defined here is so that
        //      the "before close" callback has access to them for free.
        var copyHeadersControl;
        var copySelectorsControl;
        var copyQuoteCharControl;
        var copyEscapeCharControl;
        var copyQuoteWhenControl;
        var copyCellDelimiterControl;
        var copyRecordDelimiterControl;
        var copyNullControl;

        GS.openDialogToElement(
            buttonElement,
            templateElement,
            'down',
            function () {
                var dialog = this;
                var jsnCopy;

                // we want the top gs-page to have corner rounding
                dialog.classList.add('gs-table-contextmenu');

                // we need the current copy parameters
                jsnCopy = getCopyParameters(element);

                // find all of the control elements
                copyHeadersControl = xtag.query(
                    dialog,
                    '.pref-copy-headers'
                )[0];
                copySelectorsControl = xtag.query(
                    dialog,
                    '.pref-copy-selectors'
                )[0];
                copyQuoteCharControl = xtag.query(
                    dialog,
                    '.pref-quote-char'
                )[0];
                copyEscapeCharControl = xtag.query(
                    dialog,
                    '.pref-escape-char'
                )[0];
                copyQuoteWhenControl = xtag.query(
                    dialog,
                    '.pref-copy-quote'
                )[0];
                copyCellDelimiterControl = xtag.query(
                    dialog,
                    '.pref-delimiter-cell'
                )[0];
                copyRecordDelimiterControl = xtag.query(
                    dialog,
                    '.pref-delimiter-record'
                )[0];
                copyNullControl = xtag.query(
                    dialog,
                    '.pref-null-value'
                )[0];

                copyHeadersControl.value = jsnCopy.headerMode;
                copySelectorsControl.value = jsnCopy.selectorMode;
                copyQuoteCharControl.value = jsnCopy.quoteChar;
                copyEscapeCharControl.value = jsnCopy.escapeChar;
                copyQuoteWhenControl.value = jsnCopy.quoteMode;
                copyCellDelimiterControl.value = jsnCopy.cellDelimiter;
                copyRecordDelimiterControl.value = jsnCopy.recordDelimiter;
                copyNullControl.value = jsnCopy.nullString;
            },
            // event parameter is ignored
            function (ignore, strAnswer) {
                var strCopyHeaders;
                var strCopySelectors;
                var strQuoteChar;
                var strEscapeChar;
                var strQuoteMode;
                var strCellDelimiter;
                var strRecordDelimiter;
                var strNullValue;

                if (strAnswer === 'Apply') {
                    // gather the control values
                    strCopyHeaders = copyHeadersControl.value;
                    strCopySelectors = copySelectorsControl.value;
                    strQuoteChar = copyQuoteCharControl.value;
                    strEscapeChar = copyEscapeCharControl.value;
                    strQuoteMode = copyQuoteWhenControl.value;
                    strCellDelimiter = copyCellDelimiterControl.value;
                    strRecordDelimiter = copyRecordDelimiterControl.value;
                    strNullValue = copyNullControl.value;

                    // save the copy settings
                    element.setAttribute('copy-header', strCopyHeaders);
                    element.setAttribute('copy-selectors', strCopySelectors);
                    element.setAttribute('copy-quote-char', strQuoteChar);
                    element.setAttribute('copy-escape-char', strEscapeChar);
                    element.setAttribute('copy-quote-when', strQuoteMode);
                    element.setAttribute(
                        'copy-delimiter-cell',
                        strCellDelimiter
                    );
                    element.setAttribute(
                        'copy-delimiter-record',
                        strRecordDelimiter
                    );
                    element.setAttribute('copy-null-cell', strNullValue);
                }
            }
        );
    }

    // we want the user to have access to limit/offset and copy settings
    function openSettingsDialog(element, buttonElement) {
        var templateElement = document.createElement('template');

        templateElement.setAttribute('data-max-width', '15em');
        templateElement.setAttribute('no-background', '');
        templateElement.setAttribute('data-overlay-close', 'true');
        templateElement.innerHTML = ml(function () {/*
<gs-page class="gs-table-contextmenu">
    <gs-body class="gs-table-contextmenu" padded>
        <gs-button dialogclose iconleft remove-bottom
            icon="database"
            class="button-column-width">Data Settings</gs-button>
        <gs-button dialogclose iconleft remove-top
            icon="clipboard"
            class="button-column-width">Clipboard Settings</gs-button>
    </gs-body>
</gs-page>
            */
        });

        GS.openDialogToElement(
            buttonElement,
            templateElement,
            'down',
            function () {
                var dialog = this;

                // we want the top gs-page to have corner rounding
                dialog.classList.add('gs-table-contextmenu');
            },
            // event parameter is ignored
            function (ignore, strAnswer) {
                //var targetElement;
                //var targetButton;

                //// when you close the dialog by clicking on the
                ////      overlay, there is no event.
                //if (event && event.target) {
                //    targetElement = event.target;
                //}

                //// when you close the dialog by clicking on the
                ////      overlay, there is no target.
                //if (targetElement) {
                //    // we may need to position a second dialog to a
                //    //      button, so here we get the button that
                //    //      was clicked.
                //    if (targetElement.nodeName === 'GS-BUTTON') {
                //        targetButton = targetElement;
                //    } else {
                //        targetButton = GS.findParentTag(
                //            targetElement,
                //            'gs-button'
                //        );
                //    }
                //}

                if (strAnswer === 'Data Settings') {
                    openDataSettingsDialog(element, buttonElement);
                } else if (strAnswer === 'Clipboard Settings') {
                    openClipboardSettingsDialog(element, buttonElement);
                }
            }
        );

//
//Display:
//    no-record-selector (boolean)
//    header template (boolean)
//    insert record template (boolean)
//    column hide/show
//    theme (wait, we need to write some themes)
//
//Scrolling:
//    no-x-overscroll (boolean)
//    no-y-overscroll (boolean)
//

    }

// #############################################################################
// ############################## EVENT FUNCTIONS ##############################
// #############################################################################

    // ############# FOCUS EVENTS #############
    function unbindFocus(element) {
        element.removeEventListener(
            evt.mousedown,
            element.internalEvents.focusMouseDown
        );

        element.elems.dataViewport.removeEventListener(
            'focus',
            element.internalEvents.focusInViewport,
            true
        );
        window.removeEventListener(
            'focus',
            element.internalEvents.focusTracker
        );
        element.removeEventListener(
            'focus',
            element.internalEvents.focusTracker,
            true
        );
        window.removeEventListener(
            'blur',
            element.internalEvents.focusTracker
        );
        window.removeEventListener(
            'focusout',
            element.internalEvents.focusTracker
        );
    }
    function bindFocus(element) {
        element.internalEvents.focusMouseDown = function (event) {
            var blurEventFunction;
            var target = event.target;
            var parentCell;

            // when you put a control into a label, if you click on the label:
            //      it focuses the control. sometimes, people use a label
            //      element simply for the padding. we don't want this focus
            //      behaviour if people just want the label for the padding, so
            //      if the target is a label: prevent default
            parentCell = GS.findParentTag(target, 'gs-cell');
            if (
                parentCell &&
                parentCell.nodeName === 'GS-CELL' &&
                target.nodeName === 'LABEL' &&
                parentCell.children.length === 1 &&
                parentCell.children[0].nodeName === 'LABEL'
            ) {
                event.preventDefault();
                event.stopPropagation();
            }

            // if no focusable control was moused on: focus
            //      hiddenFocusControl
            //console.log(document.activeElement);
            //console.log(event.target);
            if (!GS.isElementFocusable(target) && !evt.touchDevice) {
                focusHiddenControl(element);

                //console.log('FOCUS:', document.activeElement);
                //setTimeout(function () {
                //    //console.log('FOCUS:', document.activeElement);
                //}, 1000);

                // some time after this mousedown event finishes, the
                //      hidden focus control gets "blur"ed, so we bind it
                //      to refocus after the "blur" event (only once though,
                //      we don't want the page to get stuck refocusing the
                //      hidden focus control)
                blurEventFunction = function () {
                    focusHiddenControl(element);
                    element.elems.hiddenFocusControl.removeEventListener(
                        'blur',
                        blurEventFunction
                    );
                };
                element.elems.hiddenFocusControl.addEventListener(
                    'blur',
                    blurEventFunction
                );
            }
        };

        element.addEventListener(
            evt.mousedown,
            element.internalEvents.focusMouseDown
        );

        // sometimes the user will click on a control to deselect one cell
        //      out of multiple selected cells. this causes the focus to be
        //      inside a non-selected cell
        element.internalEvents.focusInViewport = function () {
            var active = document.activeElement;
            var parentCell = GS.findParentTag(active, 'gs-cell');

            // if the focused element is inside a GS-CELL element
            if (parentCell && parentCell.nodeName === 'GS-CELL') {
                // if the GS-CELL is not selected
                if (!parentCell.hasAttribute('selected')) {
                    // focus hidden control
                    focusHiddenControl(element);
                }
            }
        };

        element.elems.dataViewport.addEventListener(
            'focus',
            element.internalEvents.focusInViewport,
            true
        );

        // we want to style the table depending on wheather or not the
        //      focus is inside the gs-table
        element.internalEvents.focusTracker = function () {//event
            var active = document.activeElement;
            var parentTable = GS.findParentElement(active, element);
            var parentCell;
            var parentColumn;

            element.internalDisplay.focus.latest = false;

            //console.log(active, event.type, parentTable);
            if (
                parentTable &&
                parentTable.nodeName === 'GS-TABLE'
            ) {
                element.classList.add('focus-in');
                element.classList.remove('focus-out');

                parentCell = GS.findParentTag(active, 'gs-cell');
                parentColumn = GS.findParentElement(active, '[column]');

                if (!parentColumn || parentColumn.nodeName === 'HTML') {
                    parentColumn = active;
                }

                // the render function needs to know what element is
                //      focused so that it can maintain that focus
                if (parentCell) {
                    element.internalDisplay.focus.column = (
                        parseInt(
                            (
                                parentCell.getAttribute('data-col-number') ||
                                parentCell.getAttribute('data-col') ||
                                ''
                            ),
                            10
                        )
                    );
                    element.internalDisplay.focus.row = (
                        parseInt(
                            (
                                parentCell.getAttribute('data-row-number') ||
                                ''
                            ),
                            10
                        )
                    );
                    element.internalDisplay.focus.columnAttribute = (
                        parentColumn.getAttribute('column')
                    );
                    element.internalDisplay.focus.nodeName = (
                        active.nodeName
                    );
                    element.internalDisplay.focus.latest = true;
                }
            } else {
                element.classList.add('focus-out');
                element.classList.remove('focus-in');
            }
        };

        window.addEventListener(
            'focus',
            element.internalEvents.focusTracker
        );
        element.addEventListener(
            'focus',
            element.internalEvents.focusTracker,
            true
        );
        window.addEventListener(
            'blur',
            element.internalEvents.focusTracker
        );
        window.addEventListener(
            'focusout',
            element.internalEvents.focusTracker
        );
    }

    // ############# SCROLL EVENTS #############
    function unbindScroll(element) {
        // because touch devices don't have scrollbars, we use a different set
        //      of code for scrolling
        if (evt.touchDevice) {
            element.elems.dataViewport.removeEventListener(
                evt.mousedown,
                element.internalEvents.scrollDragStartFunction
            );
        } else {
            // I tried "mousewheel", "MozMousePixelScroll" and "DOMMouseScroll"
            element.removeEventListener(
                'wheel',
                element.internalEvents.scrollWheelFunction
            );
        }

        window.removeEventListener(
            'resize',
            element.internalEvents.scrollResizeFunction
        );
        element.elems.yScrollBar.removeEventListener(
            'scroll',
            element.internalEvents.scrollBarYFunction
        );
        element.elems.xScrollBar.removeEventListener(
            'scroll',
            element.internalEvents.scrollBarXFunction
        );
    }
    function bindScroll(element) {
        // we need to manually move the scrollbar on a scroll event and then we
        //      need to rerender the cells

        // because touch devices don't have scrollbars, we use a different set
        //      of code for scrolling
        if (evt.touchDevice) {
            var intStartMouseLeft;
            var intStartMouseTop;
            var intStartScrollLeft;
            var intStartScrollTop;
            var intCurrentMouseLeft;
            var intCurrentMouseTop;
            var intCurrentScrollLeft;
            var intCurrentScrollTop;
            var dragStarted;

            element.internalEvents.scrollDragStartFunction = function (event) {
                var jsnMousePos = GS.mousePosition(event);
                dragStarted = false;
                intStartMouseLeft = jsnMousePos.left;
                intStartMouseTop = jsnMousePos.top;
                intStartScrollLeft = element.internalScroll.left;
                intStartScrollTop = element.internalScroll.top;

                event.preventDefault();
                event.stopPropagation();

                document.body.addEventListener(
                    evt.mousemove,
                    element.internalEvents.scrollDragMoveFunction
                );
                document.body.addEventListener(
                    evt.mouseup,
                    element.internalEvents.scrollDragEndFunction
                );
            };

            // on a phone you might want to click without scrolling a
            //      little bit, so we set here a minimum threshold of
            //      distance to before allowing scrolling
            var leftPlay = 10;
            var topPlay = 10;
            element.internalEvents.scrollDragMoveFunction = function (event) {
                var jsnMousePos;

                if (event.which === 0 && !evt.touchDevice) {
                    event.preventDefault();
                    event.stopPropagation();
                    element.internalEvents.scrollDragEndFunction();

                } else {
                    jsnMousePos = GS.mousePosition(event);
                    intCurrentMouseLeft = jsnMousePos.left;
                    intCurrentMouseTop = jsnMousePos.top;
                    intCurrentScrollLeft = element.internalScroll.left;
                    intCurrentScrollTop = element.internalScroll.top;

                    if (
                        dragStarted === false &&
                        (
                            Math.abs(
                                intCurrentMouseLeft - intStartMouseLeft
                            ) > leftPlay ||
                            Math.abs(
                                intCurrentMouseTop - intStartMouseTop
                            ) > topPlay
                        )
                    ) {
                        dragStarted = true;
                    }

                    if (dragStarted) {
                        event.preventDefault();
                        event.stopPropagation();

                        // we need to save the current top/left so that the
                        //      rerender function knows what direction we're
                        //      scrolling
                        element.internalScroll.prevTop =
                                element.internalScroll.top;
                        element.internalScroll.prevLeft =
                                element.internalScroll.left;

                        // scroll the difference
                        element.internalScroll.left -=
                                (intCurrentMouseLeft - intStartMouseLeft) +
                                (intCurrentScrollLeft - intStartScrollLeft);
                        element.internalScroll.top -=
                                (intCurrentMouseTop - intStartMouseTop) +
                                (intCurrentScrollTop - intStartScrollTop);

                        // we need to round the scroll so that we don't run into
                        //      type issues
                        element.internalScroll.top =
                                Math.round(element.internalScroll.top);
                        element.internalScroll.left =
                                Math.round(element.internalScroll.left);

                        // we need to prevent overscrolling
                        element.internalScroll.top = Math.min(
                            element.internalScroll.maxTop,
                            element.internalScroll.top
                        );
                        element.internalScroll.left = Math.min(
                            element.internalScroll.maxLeft,
                            element.internalScroll.left
                        );

                        // we need to prevent underscrolling
                        element.internalScroll.top = Math.max(
                            0,
                            element.internalScroll.top
                        );
                        element.internalScroll.left = Math.max(
                            0,
                            element.internalScroll.left
                        );

                        renderScrollLocation(element);
                    }
                }
            };

            element.internalEvents.scrollDragEndFunction = function () {
                // elastic scrolling
                //console.log('elastic scrolling');
                //renderScrollLocation(element);

                // unbind mousemove and mouseup
                document.body.removeEventListener(
                    evt.mousemove,
                    element.internalEvents.scrollDragMoveFunction
                );
                document.body.removeEventListener(
                    evt.mouseup,
                    element.internalEvents.scrollDragEndFunction
                );
            };

            element.elems.dataViewport.addEventListener(
                evt.mousedown,
                element.internalEvents.scrollDragStartFunction
            );
        // desktop scrolling
        } else {
            element.internalEvents.scrollWheelFunction = function (event) {
                var originalTop;
                var originalLeft;
                var jsnScroll;
                var intDeltaY;
                var intDeltaX;
                var intRecordHeight;

                // helper variable to help shorten the code
                jsnScroll = element.internalScroll;

                // we don't want to intercept overscrolling
                if (
                    // if we're at the top and we're scrolling up
                    (
                        jsnScroll.top === 0 &&
                        event.deltaY < 0
                    ) ||
                    // or we're at the bottom and we're scrolling down
                    (
                        jsnScroll.top === jsnScroll.maxTop &&
                        event.deltaY > 0
                    ) ||
                    // or we're at the left and we're scrolling left
                    (
                        jsnScroll.left === 0 &&
                        event.deltaX < 0
                    ) ||
                    // or we're at the right and we're scrolling right
                    (
                        jsnScroll.left === jsnScroll.maxLeft &&
                        event.deltaX > 0
                    )
                ) {
                    // stop execution
                    return;
                }

                // we need to prevent firefox from scrolling the window, Chrome
                //      automatically stops the scroll from bubbling up at this
                //      point
                event.preventDefault();

                // we need to save the original top and left so that we can have
                //      the element rerender only if the scroll actually changed
                originalTop = jsnScroll.top;
                originalLeft = jsnScroll.left;

                // we used to do smooth scrolling, this is the code you would
                //      use for that, it increments the scroll by the delta
                //      amount
                //// we need to increment the scroll with the event deltas
                ////      because calculating our own deltas is too much
                ////      trouble right now
                //intDeltaY = event.deltaY;
                //intDeltaX = event.deltaX;

                // because we scroll by the record, we need to find out the
                //      direction of the scroll and then round to nearest record
                //      in that direction
                intDeltaY = Math.round(event.deltaY);
                intDeltaX = Math.round(event.deltaX);

                intRecordHeight = (
                    (
                        element.internalDisplay.recordHeights[0] ||
                        element.internalDisplay.defaultRecordHeight
                    ) +
                    element.internalDisplay.recordBorderHeight
                );

                //var intTestOldScrollTop = jsnScroll.top;
                //var intTestSecondScrollTop;

                // up / down
                if (intDeltaY !== 0) {
                    jsnScroll.top = roundToNearestMultiple(
                        jsnScroll.top,
                        intRecordHeight
                    );
                    //intTestSecondScrollTop = jsnScroll.top;
                    jsnScroll.top += roundToNearestMultiple(
                        intDeltaY,
                        intRecordHeight
                    );
                }
                //jsnScroll.top += intDeltaY;

                // left / right
                if (intDeltaX !== 0) {
                    jsnScroll.left += intDeltaX;
                }

                //console.log(
                //    intTestOldScrollTop,
                //    intTestSecondScrollTop,
                //    jsnScroll.top
                //);

                // we need to save the current top/left so that the rerender
                //      function knows what direction we're scrolling
                jsnScroll.prevTop = jsnScroll.top;
                jsnScroll.prevLeft = jsnScroll.left;

                // we need to round the scroll so that we don't run into
                //      type issues
                jsnScroll.top = Math.round(jsnScroll.top);
                jsnScroll.left = Math.round(jsnScroll.left);

                // we need to prevent overscrolling
                element.internalScroll.top = Math.min(
                    jsnScroll.maxTop,
                    jsnScroll.top
                );
                element.internalScroll.left = Math.min(
                    jsnScroll.maxLeft,
                    jsnScroll.left
                );

                // we need to prevent underscrolling
                jsnScroll.top = Math.max(0, jsnScroll.top);
                jsnScroll.left = Math.max(0, jsnScroll.left);

                // we only need to rerender if the scroll actually changed
                //console.log('wheel');
                //console.log('internalTop:   ', element.internalScroll.top);
                //console.log('originalTop:   ', originalTop);
                //console.log('internalLeft:  ', element.internalScroll.left);
                //console.log('originalLeft:  ', originalLeft);
                if (
                    (jsnScroll.top !== originalTop) ||
                    (jsnScroll.left !== originalLeft)
                ) {
                    renderScrollLocation(element);
                }
            };
            // I tried "mousewheel", "MozMousePixelScroll" and "DOMMouseScroll"
            element.addEventListener(
                'wheel',
                element.internalEvents.scrollWheelFunction
            );
        }

        // we need to update the scrollbar dimensions if the window is resized
        element.internalEvents.scrollResizeFunction = function () {
            renderScrollDimensions(element);
        };
        window.addEventListener(
            'resize',
            element.internalEvents.scrollResizeFunction
        );

        // we need to update the scrollbar location from true scrollbar
        //      location to virtual scrollbar location
        element.internalEvents.scrollBarYFunction = function () {
            var intViewportHeight;
            var virtualScrollHeight;
            var trueScrollHeight;
            var trueScrollTop;

            var oldVirtualScrollTop;
            var newVirtualScrollTop;

            // sometimes, the gs-table triggeres a scrollbar event, so here we
            //      check to make sure the scrollbarY event has not been
            //      cancelled
            if (!element.internalEventCancelled.scrollbarY) {
                // we need the viewport dimensions because true scroll
                //      dimensions include the viewport height, which
                //      messes with the caluculations
                intViewportHeight = element.elems.dataViewport.clientHeight;

                // we are saving the max scroll dimensions for ease of access
                virtualScrollHeight = element.internalScroll.maxTop;

                // we need the actual scroll height of the scrollbars because
                //      we limit their height and that causes a difference we
                //      need to account for
                trueScrollHeight = element.elems.yScrollBar.scrollHeight;
                trueScrollHeight -= intViewportHeight;

                // we are saving the current true scroll location for ease
                //      of access
                trueScrollTop = element.elems.yScrollBar.scrollTop;

                // we want to know what direction we scrolled so that we can
                //      round to the next record in that direction. to do that,
                //      we're going to hold on to the old virtual scrollTop so
                //      that we can compare it to the new one.
                oldVirtualScrollTop = element.internalScroll.top;
                newVirtualScrollTop = (
                    trueScrollTop * (
                        virtualScrollHeight / trueScrollHeight
                    )
                );

                //// if we scrolled down, round to the next record down
                //if (newVirtualScrollTop > oldVirtualScrollTop) {

                //// else, we scrolled up, round to the next record up
                //} else {
                //}

                // we need to translate the true top into virtual top for the
                //      virtual scroll and save to internal location
                element.internalScroll.top = newVirtualScrollTop;

                // if this event gets triggered while the scrollbar doesn't have
                //      any room, trueScrollHeight will be 0 which means that
                //      (virtualScrollHeight / trueScrollHeight)
                //      would result in NaN (because of the division by 0),
                //      so, coalesce top to 0
                element.internalScroll.top = (
                    element.internalScroll.top || 0
                );

                // we need to round the scroll so that we don't run into
                //      any type issues
                element.internalScroll.top =
                        Math.round(element.internalScroll.top);

                // we need to prevent overscrolling
                element.internalScroll.top = Math.min(
                    element.internalScroll.maxTop,
                    element.internalScroll.top
                );

                // we need to prevent underscrolling
                element.internalScroll.top = Math.max(
                    0,
                    element.internalScroll.top
                );

                // render scroll location
                renderScrollLocation(element);
            }

            // if the scrollbarY was cancelled, we no longer want it to be
            //      cancelled. so, reset it to false
            element.internalEventCancelled.scrollbarY = false;
        };
        element.elems.yScrollBar.addEventListener(
            'scroll',
            element.internalEvents.scrollBarYFunction
        );

        // we need to update the scrollbar location from true scrollbar
        //      location to virtual scrollbar location
        element.internalEvents.scrollBarXFunction = function () {
            //console.log('scrollBarXFunction');
            var intViewportWidth;
            var virtualScrollWidth;
            var trueScrollWidth;
            var trueScrollLeft;

            // sometimes, the gs-table triggeres a scrollbar event, so here we
            //      check to make sure the scrollbarX event has not been
            //      cancelled
            //console.log(element.internalEventCancelled.scrollbarX);
            if (!element.internalEventCancelled.scrollbarX) {
                // we need the viewport dimensions because true scroll
                //      dimensions include the viewport width, which messes
                //      with the caluculations
                intViewportWidth = element.elems.dataViewport.clientWidth;

                // we are saving the max scroll dimensions for ease of access
                virtualScrollWidth = element.internalScroll.maxLeft;

                // we need the actual scroll width of the scrollbars because
                //      we limit their width and that causes a difference we
                //      need to account for
                trueScrollWidth = element.elems.xScrollBar.scrollWidth;
                trueScrollWidth -= intViewportWidth;

                // we are saving the current true scroll location for ease
                //      of access
                trueScrollLeft = element.elems.xScrollBar.scrollLeft;

                // we need to translate the true left into virtual left for the
                //      virtual scroll and save to internal location
                element.internalScroll.left = (
                    trueScrollLeft * (
                        virtualScrollWidth / trueScrollWidth
                    )
                );

                // if this event gets triggered while the scrollbar doesn't have
                //      any room, trueScrollWidth will be 0 which means that
                //      (virtualScrollWidth / trueScrollWidth)
                //      would result in NaN (because of the division by 0),
                //      so, coalesce left to 0
                element.internalScroll.left = (
                    element.internalScroll.left || 0
                );

                // we need to round the scroll so that we don't run into
                //      any type issues
                element.internalScroll.left =
                        Math.round(element.internalScroll.left);

                // we need to prevent overscrolling
                element.internalScroll.left = Math.min(
                    element.internalScroll.maxLeft,
                    element.internalScroll.left
                );

                // we need to prevent underscrolling
                element.internalScroll.left = Math.max(
                    0,
                    element.internalScroll.left
                );

                // render scroll location
                renderScrollLocation(element);
            }

            // if the scrollbarX was cancelled, we no longer want it to be
            //      cancelled. so, reset it to false
            element.internalEventCancelled.scrollbarX = false;
        };
        element.elems.xScrollBar.addEventListener(
            'scroll',
            element.internalEvents.scrollBarXFunction
        );
    }

    // ############# SELECTION EVENTS #############
    function unbindSelection(element) {
        if (evt.touchDevice) {
            // ### NEED CODING ###
        } else {
            element.elems.dataContainer.removeEventListener(
                evt.mousedown,
                element.internalEvents.selectDragStart
            );
        }
    }
    function bindSelection(element) {

        // #####################################################################
        // ############### SELECTION MODIFICATIONS of 2017-04-13 ###############
        // ##################### THIS HAST BEEN COMPLETED! #####################
        // #####################################################################
        //
        // hear ye! we'll be making some real changes to the selection
        //      functionality. this happened because towards the beginning of
        //      this project I made a some bad choices regarding selection and
        //      the insert record.
        //
        //      The bad choices stemmed from not checking the functionality of
        //      other capable datagrids designed by people who know what they're
        //      doing.
        //
        //      Dont panic, I'll e'splain.
        //
        //      Bad choice #1 was to make the insert record stick to the bottom
        //      of the viewport. While this seemed like a good idea because
        //      whenever you want to insert the insert record is right there,
        //      this makes it so that selection of data and/or the insert record
        //      needs to be mutually exclusive or else the selection will appear
        //      non-contiguous in some areas and give the idea that the
        //      selection ends prematurely in other areas.
        //
        //      Bad choice #2 was to make the internal representation of the
        //      selection not resolve the entire selection, instead, it resolves
        //      the data cell selections and has some other, awkward places to
        //      look for other selections. This approach also made it so that if
        //      you only had record selectors selected, some areas of the code
        //      wouldn't be able to tell because no data cells were selected.
        //
        //      To remedy choice #1, I had to modify the getCurrentCellRange
        //      function to make it determine if the insert record would be
        //      visible. After that, I made the full render and the partial
        //      render functions handle the visiblity. This remedied choice #1.
        //
        //      To remedy choice #2, I'm going to replace the -1 values in
        //      the selection range JSON and add some new values. Start and
        //      end points that are on a data cell will still use numbers.
        //      Here is the list of non-number values that will be able to
        //      be used:
        //          for rows:
        //              'header'
        //              'insert'
        //          for columns:
        //              'selector'
        //      For example, selection for a range that starts with the all
        //      selector and ends in the fifth column of the sixth row will
        //      look like this:
        //          {
        //              "start": {
        //                  "row": "header",
        //                  "column": "selector"
        //              },
        //              "end": {
        //                  "row": 5,   // zero-based
        //                  "column": 4 // zero-based
        //              },
        //              "negator": false
        //          }
        //
        //      In the resolved selection, we need to be able to determine
        //      the type of cell as well as it's selection using only one
        //      character. So, we'll use two letters per type, one for
        //      selected and one for unselected. Here are the various types
        //      and their characters:
        //          Type:              Unselected:   Selected:
        //          HEADER CELL        A             B
        //          RECORD CELL        C             D
        //          INSERT CELL        E             F
        //          ALL SELECTOR       G             H
        //          RECORD SELECTOR    I             J
        //          INSERT SELECTOR    K             L
        //
        //      Using our previous example of selection inside a table with
        //      eight records, eight columns, a header and an insert record.
        //      The resolved selection for internal lookup would look like
        //      this:
        //          [
        //              "HBBBBBAAA", // header
        //              "JDDDDDCCC", // data
        //              "JDDDDDCCC", // data
        //              "JDDDDDCCC", // data
        //              "JDDDDDCCC", // data
        //              "JDDDDDCCC", // data
        //              "JDDDDDCCC", // data
        //              "ICCCCCCCC", // data
        //              "ICCCCCCCC", // data
        //              "KEEEEEEEE"  // insert
        //          ]
        //
        //      Just like before, we'll include these:
        //          an array of columns that contain at lease one selected cell
        //              new values to be included:
        //                  'selector'
        //          an array of records that contain at lease one selected cell
        //              new values to be included:
        //                  'header'
        //                  'insert'
        //          the origin record number
        //
        //      Alright, we know what's wrong and what we want to end up with,
        //      how are we going to get they-ah from he-ah?
        //          1) We need to tag any sections of code that utilizes the old
        //                  selection format. The tag will be "OL' SELECTION"
        //          DONE
        //
        //          2) We need to comment out the selection renderer.
        //          DONE
        //
        //          3) We need the mouse events to generate the new format for
        //                  selection range JSON.
        //          DONE
        //
        //          4) We need to generate the new format of resolved
        //                  selection in the selection renderer.
        //          DONE
        //
        //          5) We need to loop through the visible cells and use
        //                  the resolved selection to style all of the
        //                  appropriate cells.
        //          DONE
        //
        //          6) We need to update any behaviour that utilizes the old
        //                  selection format.
        //          DONE
        //
        //          7) We need to make it so that if a paste is divided between
        //                  the insert record and some data records, we need to
        //                  do an update and an insert from that paste.
        //          DONE
        //
        //          8) We need to pat ourselves on the back about 4 times and
        //                  then slap ourselves on the face 4 times for having
        //                  screwed this up in the first place.
        //
        //          9) We need to pat ourselves on the back 4 more times for
        //                  having so thouroughly planned this recovery.
        //
        //          10) Finally, we need to inform papa of our success.
        //
        //          11) We should prolly stop referring to ourselves as two
        //                  seperate beings... My... precious...
        //
        //      This sub-document was authored by Michael.
        //
        // #####################################################################
        // ############### SELECTION MODIFICATIONS of 2017-04-13 ###############
        // ##################### THIS HAST BEEN COMPLETED! #####################
        // #####################################################################


        // touch devices have a different way to select, so here we bind the
        //      touch-friendly version of cell selection
        if (evt.touchDevice) {
            // ### NEED CODING ###

        // on a desktop, we bind this code for cell selection:
        } else {
            // we save a copy of the current ranges so that if the
            //      before_selection event gets prevented, we can revert the
            //      selection
            var selectionRangesCopy;

            // we may be altering the only selection range or the last range
            //      if a long list of ranges, so here we store what index in
            //      the selection range array we are editing
            var intCurrentSelectionIndex;

            element.internalEvents.selectDragStart = function (event) {
                var cell;
                var jsnRange;
                var newRange;
                var jsnLocation;

                //var classList;
                //var intRow;
                //var intColumn;

                //var bolIsDataCell;
                //var bolIsAllSelector;
                //var bolIsHeaderCell;
                //var bolIsRecordSelector;
                //var bolIsInsertCell;
                //var bolIsInsertSelector;

                element.bolFocusHiddenTextarea = false;

                // we need the cell that received the mousedown so that we
                //      can get it's row/column numbers (and of the case of
                //      adding a selection, wheather of not it's already
                //      selected)
                cell = GS.findParentElement(event.target, 'gs-cell');

                //console.log(cell, (element, event));
                //console.log(cell);
                //console.log(element.internalResize.currentlyResizing);
                //console.log(event.which);
                //console.log(!cell.hasAttribute('selected'));

                if (
                    // if we found a cell
                    cell.nodeName === 'GS-CELL' &&
                    // and we're not resizing a cell or record right now
                    element.internalResize.currentlyResizing === false &&
                    // and we're not reordering columns right now
                    element.internalReorder.currentlyReordering === false &&
                    // and the user used the left mouse button
                    // or the user right-clicked on a non-selected cell
                    (
                        event.which === 1 ||
                        !cell.hasAttribute('selected')
                    )
                ) {
                    // we need to let the other code know that we are currently
                    //      selecting
                    element.internalSelection.currentlySelecting = true;

                    // we define newRange here so that we can see the structure
                    //      and so that we can modify/use it
                    newRange = {
                        "start": {
                            "row": 0,
                            "column": 0
                        },
                        "end": {
                            "row": 0,
                            "column": 0
                        },
                        "negator": false
                    };

                    // save a copy of the current selection range so that we can
                    //      revert back to it if we need to
                    selectionRangesCopy = JSON.parse(
                        JSON.stringify(
                            element.internalSelection.ranges
                        )
                    );

                    //// header is attached to first row
                    //// record selector is attached to the first column
                    //// insert record is attached to last row or the header if
                    ////      there is no data

                    //// if the selected cell is a header
                    ////      row: 'header'
                    ////      column: cell column
                    //// if the selected cell is a data cell
                    ////      row: cell row
                    ////      column: cell column
                    //// if the selected cell is a record selector
                    ////      row: cell row
                    ////      column: 'selector'
                    //// if the selected cell is the all selector
                    ////      row: 'header'
                    ////      column: 'selector'
                    //// if the selected cell is a insert cell
                    ////      row: 'insert'
                    ////      column: cell column
                    //// if the selected cell is the insert selector
                    ////      row: 'insert'
                    ////      column: 'selector'
                    //intRow = parseInt(
                    //    cell.getAttribute('data-row-number'),
                    //    10
                    //);
                    //intColumn = parseInt(
                    //    cell.getAttribute('data-col-number'),
                    //    10
                    //);

                    //// we don't want to recalculate what type of a cell the
                    ////      target cell is, and we want shorter code. so,
                    ////      we'll create shortcut variables
                    //classList = cell.classList;
                    //bolIsDataCell = (
                    //    classList.contains('table-cell')
                    //);
                    //bolIsAllSelector = (
                    //    classList.contains('table-all-selector')
                    //);
                    //bolIsHeaderCell = (
                    //    classList.contains('table-header')
                    //);
                    //bolIsRecordSelector = (
                    //    classList.contains('table-record-selector')
                    //);
                    //bolIsInsertCell = (
                    //    classList.contains('table-insert')
                    //);
                    //bolIsInsertSelector = (
                    //    classList.contains('table-insert-selector')
                    //);

                    //if (bolIsDataCell) {
                    //    newRange.start.row = intRow;
                    //    newRange.start.column = intColumn;
                    //} else if (bolIsAllSelector) {
                    //    newRange.start.row = 'header';
                    //    newRange.start.column = 'selector';
                    //} else if (bolIsHeaderCell) {
                    //    newRange.start.row = 'header';
                    //    newRange.start.column = intColumn;
                    //} else if (bolIsRecordSelector) {
                    //    newRange.start.row = intRow;
                    //    newRange.start.column = 'selector';
                    //} else if (bolIsInsertCell) {
                    //    newRange.start.row = 'insert';
                    //    newRange.start.column = intColumn;
                    //} else if (bolIsInsertSelector) {
                    //    newRange.start.row = 'insert';
                    //    newRange.start.column = 'selector';
                    //}

                    // find out the cell location based on the mouse event
                    jsnLocation = getCellFromMouseEvent(element, event);

                    // replace the range start with the discovered location
                    newRange.start.row = jsnLocation.row;
                    newRange.start.column = jsnLocation.column;

                    // the end is the same as the start because we are only on
                    //      the first cell of the selection
                    newRange.end.row = newRange.start.row;
                    newRange.end.column = newRange.start.column;

                    //console.log('shiftKey : ', event.shiftKey);
                    //console.log('metaKey  : ', event.metaKey);
                    //console.log('ctrlKey  : ', event.ctrlKey);

                    // if the selection starts with no shift, CMD or CTRL
                    //      keys down: we clear all of the previous selections
                    //      and start with an new selection
                    if (!event.shiftKey && !event.metaKey && !event.ctrlKey) {
                        // clear all the old ranges and add the new range
                        element.internalSelection.ranges = [newRange];

                        // because our new selection is the first in the list,
                        //      the current selection index is 0
                        intCurrentSelectionIndex = 0;
                    } else {
                        // if the shift key is down (and the previous selection
                        //      was not negator selection), we need override the
                        //      previous selection's endpoint, so we'll just set
                        //      the intCurrentSelectionIndex to the index of the
                        //      latest selection
                        if (event.shiftKey) {
                            //console.log('OVER HERE');
                            intCurrentSelectionIndex = (
                                element.internalSelection.ranges.length - 1
                            );

                            // if the previous selection was not a negator
                            if (
                                element.internalSelection
                                    .ranges[intCurrentSelectionIndex]
                                    .negator === false
                            ) {
                                // we reset the endpoint of the latest range so
                                //      that the re-render that's coming up
                                //      shows the user that they've changed
                                //      their selection
                                element.internalSelection
                                    .ranges[intCurrentSelectionIndex]
                                    .end.row = newRange.start.row;
                                element.internalSelection
                                    .ranges[intCurrentSelectionIndex]
                                    .end.column = newRange.start.column;

                            // if the previous selection was a negator
                            //      selection, just add a new selection range
                            } else {
                                // add the new range to the end of the selection
                                //      range list
                                element.internalSelection.ranges.push(newRange);

                                // because we added our new selection to the end
                                //      of the selection range list, we need to
                                //      set the intCurrentSelectionIndex to end
                                //      end of the list
                                intCurrentSelectionIndex = (
                                    element.internalSelection.ranges.length - 1
                                );
                            }

                            // if the first selection range covers more than one
                            //      cell, focus the hidden textarea
                            jsnRange = element.internalSelection.ranges[0];
                            if (
                                jsnRange.start.row !== jsnRange.end.row ||
                                jsnRange.start.column !== jsnRange.end.column
                            ) {
                                //console.log('Focus, grasshopper');
                                element.bolFocusHiddenTextarea = true;
                            }

                        // else if the CMD of CTRL key is down, we create a new
                        //      selection and append it to the end
                        } else if (event.metaKey || event.ctrlKey) {
                            // if the new selection started on an already
                            //      selected cell, this selection becomes a
                            //      negator range (meaning that every cell in
                            //      it's range gets unselected)
                            if (cell.hasAttribute('selected')) {
                                newRange.negator = true;
                            }

                            // add the new range to the end of the selection
                            //      range list
                            element.internalSelection.ranges.push(newRange);

                            // because we added our new selection to the end of
                            //      the selection range list, we need to set the
                            //      intCurrentSelectionIndex to end end of the
                            //      list
                            intCurrentSelectionIndex = (
                                element.internalSelection.ranges.length - 1
                            );
                        }
                    }

                    // we re-render the selection because it has just been
                    //      changed
                    renderSelection(element);

                    //console.log(element.internalSelection.ranges);

                    // we add mousemove and mouseup events to the body because
                    //      if you're dragging to select and you mousemove off
                    //      of the element: we wan't to continue the selection,
                    //      and if you mouseup off of the element, we still want
                    //      to register that as a mouseup/end of selection
                    if (event.which === 1) {
                        document.body.addEventListener(
                            evt.mousemove,
                            element.internalEvents.selectDragMove
                        );
                        // TODO: firefox doesn't work with this and overflow
                        //      (event.target remains the origin cell)
                        document.body.addEventListener(
                            evt.mouseup,
                            element.internalEvents.selectDragEnd
                        );

                    // if the cell was right-clicked, we don't want to listen
                    //      to mouse drag. in fact, in order to have the
                    //      selection recalculate the selection cache in time
                    //      for the context menu we need to end the selection
                    //      now.
                    } else {
                        element.internalEvents.selectDragEnd();
                    }
                }
            };

            element.internalEvents.selectDragMove = function (event) {
                //var cell;
                //var classList;
                //var intRow;
                //var intColumn;
                var intOldEndRow;
                var intOldEndColumn;
                var currentRange;

                getCellFromMouseEvent(element, event);

                // if mouse is moving but no mouse button is down: finalize
                //      selection, unbind selectDragMove and unbind
                //      selectDragEnd
                if (event.which === 0 && !evt.touchDevice) {
                    element.internalEvents.selectDragEnd();

                } else {
                    // save the cell to a variable so that we can get it's
                    //      row/column
                    //console.log('event.target:', event.target);
                    // cell = GS.findParentElement(event.target, 'gs-cell');
                    // //console.log('cell:', cell);
                    // classList = cell.classList;

                    // // extract row/column from cell (if the cell has them)
                    // intRow = parseInt(
                    //     cell.getAttribute('data-row-number'),
                    //     10
                    // );
                    // intColumn = parseInt(
                    //     cell.getAttribute('data-col-number'),
                    //     10
                    // );


                    // find out the cell location based on the mouse event
                    var jsnLocation = getCellFromMouseEvent(element, event);

                    //console.log(cell, intRow, intColumn);
                    // get current selection range for easy access
                    currentRange = (
                        element.internalSelection
                            .ranges[intCurrentSelectionIndex]
                    );

                    if (currentRange.start.column === 'selector') {
                        jsnLocation.column = 'selector';
                    }

                    // save old row and column so that we can later check if
                    //      a change was actually made (that way we only
                    //      re-render if the selection has changed)
                    intOldEndRow = currentRange.end.row;
                    intOldEndColumn = currentRange.end.column;



                    currentRange.end.row = jsnLocation.row;
                    currentRange.end.column = jsnLocation.column;
                    // // update the endpoint row and column
                    // // these if statments maintain the seperation of
                    // //      insert and non-insert selections and the
                    // //      inclusion of headers/record selectors in
                    // //      the selection
                    // if (classList.contains('table-cell')) {
                    //     currentRange.end.row = intRow;
                    //     currentRange.end.column = intColumn;

                    // } else if (classList.contains('table-all-selector')) {
                    //     currentRange.end.row = 'header';
                    //     currentRange.end.column = 'selector';

                    // } else if (classList.contains('table-header')) {
                    //     currentRange.end.row = 'header';
                    //     currentRange.end.column = intColumn;

                    // } else if (classList.contains('table-record-selector')) {
                    //     currentRange.end.row = intRow;
                    //     currentRange.end.column = 'selector';

                    // } else if (classList.contains('table-insert')) {
                    //     currentRange.end.row = 'insert';
                    //     currentRange.end.column = intColumn;

                    // } else if (classList.contains('table-insert-selector')) {
                    //     currentRange.end.row = 'insert';
                    //     currentRange.end.column = 'selector';
                    // }

                    //console.log(element.internalSelection.insertRecord);

                    // prevent text selection if selection is more than one cell
                    if (
                        currentRange.start.row !== currentRange.end.row ||
                        currentRange.start.column !== currentRange.end.column
                    ) {
                        event.preventDefault();
                        event.stopPropagation();
                    }

                    //console.log(document.activeElement);

                    // focus hidden focus control is not focused
                    //      and
                    //      if the selection just became
                    //          multiple cells with this selection (if selection
                    //          is more than one cell and previous endpoint was
                    //          the same as the starting point)
                    //      or
                    //      if the currently focused element is not a child
                    //          of this gs-table element
                    if (
                        document.activeElement !==
                            element.elems.hiddenFocusControl
                    ) {
                        if (
                            // if the current range encompasses more than one
                            //      cell
                            (
                                (
                                    currentRange.start.row !==
                                            currentRange.end.row ||
                                    currentRange.start.column !==
                                            currentRange.end.column
                                ) &&
                                (
                                    currentRange.start.row ===
                                            intOldEndRow &&
                                    currentRange.start.column ===
                                            intOldEndColumn
                                )
                            ) ||
                            // if the selection is not inside the gs-table
                            GS.findParentTag(
                                document.activeElement,
                                'gs-table'
                            ) !== element ||
                            // if there is more than one selection
                            element.internalSelection.ranges.length > 1
                        ) {
                            focusHiddenControl(element);
                        }
                    }

                    //console.log(currentRange.end.row,
                    //              intOldEndRow,
                    //              currentRange.end.column,
                    //              intOldEndColumn);

                    // re-render selection if selection ranges have been changed
                    if (
                        currentRange.end.row !== intOldEndRow ||
                        currentRange.end.column !== intOldEndColumn
                    ) {
                        renderSelection(element);
                    }
                }
            };
            element.internalEvents.selectDragEnd = function (/*event*/) {
                var beforeEvent;

                // trigger a "before_selection" event so that the page has a
                //      chance to cancel the selection
                beforeEvent = GS.triggerEvent(element, 'before_selection');

                // if the user prevents the default on the "before_selection"
                //      event, revert selection ranges to what they were before
                //      the latest selection started (and revert wheather or not
                //      the selection is in the insert record)
                if (beforeEvent.defaultPrevented) {
                    element.internalSelection.ranges = selectionRangesCopy;
                }

                // final re-render of the selection so that the selection is
                //      up to date
                renderSelection(element);

                // if the "before_selection" event is not prevented, we trigger
                //      "after_selection" so that the page can run code after a
                //      selection has been made
                if (beforeEvent.defaultPrevented) {
                    GS.triggerEvent(element, 'after_selection');
                }

                // unbind mousemove and mouseup
                document.body.removeEventListener(
                    evt.mousemove,
                    element.internalEvents.selectDragMove
                );
                document.body.removeEventListener(
                    evt.mouseup,
                    element.internalEvents.selectDragEnd
                );

                // we need to let the other code know that we are no longer
                //      selecting
                element.internalSelection.currentlySelecting = false;

                if (element.bolFocusHiddenTextarea) {
                    focusHiddenControl(element);
                    //console.log(document.activeElement);
                }
            };

            element.elems.dataContainer.addEventListener(
                evt.mousedown,
                element.internalEvents.selectDragStart
            );
        }
    }

    // ############# COLUMN/ROW RESIZE EVENTS #############
    function unbindCellResize(element) {
        if (!evt.touchDevice) {
            element.elems.dataViewport.removeEventListener(
                evt.mousemove,
                element.internalEvents.cellResizeStarter
            );

            element.elems.handleColumn.removeEventListener(
                evt.mousedown,
                element.internalEvents.cellResizeDragStart
            );
            element.elems.handleRecord.removeEventListener(
                evt.mousedown,
                element.internalEvents.cellResizeDragStart
            );

            element.elems.handleColumn.removeEventListener(
                'dblclick',
                element.internalEvents.cellResizeToDefault
            );
            element.elems.handleRecord.removeEventListener(
                'dblclick',
                element.internalEvents.cellResizeToDefault
            );
        }
    }
    function bindCellResize(element) {
        var showHandles;
        var setLineToMouse;

        // if we are not on a touch device
        if (!evt.touchDevice) {
            // we don't want to show the handles immediately, that'll mean
            //      that if the user moves the mouse across the viewport,
            //      there'll be resize handles popping up and disappearing
            //      rapidly. this effect would look bad and be distracting.
            //      to fix this, we'll throttle the function that detects if
            //      a handle should be show, but not the code that removes
            //      the handle.
            // ### NEED CODING ###
            showHandles = function (event) {
                if (element.internalResize.showThrottleID !== null) {
                    clearTimeout(element.internalResize.showThrottleID);
                    element.internalResize.showThrottleID = null;
                }

                element.internalResize.showThrottleID = setTimeout(
                    function () {
                        var intPreviousPoint;
                        var jsnElementPos;
                        var jsnMousePos;
                        var intMouseX;
                        var intMouseY;

                        var intPoint;

                        var i;
                        var len;

                        jsnElementPos = GS.getElementOffset(
                            element.elems.dataViewport
                        );
                        jsnMousePos = GS.mousePosition(event);

                        // we need the mouse X to be relative to the
                        //      dataViewport
                        intMouseX = (jsnMousePos.left - jsnElementPos.left);

                        // we need the mouse Y to be relative to the
                        //      dataViewport
                        intMouseY = (jsnMousePos.top - jsnElementPos.top);

                        //console.log(
                        //    '      intMouseX: ',
                        //    intMouseX
                        //);
                        //console.log(
                        //    '      intMouseY: ',
                        //    intMouseY
                        //);
                        //console.log(
                        //    'selectorVisible: ',
                        //    element.internalDisplay.recordSelectorVisible
                        //);
                        //console.log(
                        //    '  selectorWidth: ',
                        //    element.internalDisplay.recordSelectorWidth
                        //);
                        //console.log(
                        //    '  headerVisible: ',
                        //    element.internalDisplay.headerVisible
                        //);
                        //console.log(
                        //    '   headerHeight: ',
                        //    element.internalDisplay.headerHeight
                        //);

                        // see if the mouse collides with a column drag handle
                        //      point
                        element.internalResize.resizeColumn = false;
                        if (
                            element.internalDisplay.recordSelectorVisible &&
                            intMouseY <= (
                                element.internalDisplay.headerHeight
                            )
                        ) {
                            i = 0;
                            len = element.internalDisplay.columnHandles.length;
                            while (i < len) {
                                intPoint = (
                                    element.internalDisplay.columnHandles[i]
                                );

                                // sometimes a column will be hidden, hidden
                                //      columns have null for their handle
                                if (intPoint !== null) {
                                    if (Math.abs(intMouseX - intPoint) <= 5) {
                                        // we need to know what column we are
                                        //      resizing, so here we save the
                                        //      index of the column that we
                                        //      found
                                        element.internalResize
                                            .resizeColumnHandleIndex = i;

                                        // because we found a column to resize,
                                        //      set the resizeColumn in internal
                                        //      storage to true so that the drag
                                        //      code knows that it's going to
                                        //      resize in the X axis
                                        element.internalResize.resizeColumn = (
                                            true
                                        );

                                        // we need to be able to prevent the
                                        //      user from resizing a cell to
                                        //      negative dimensions, so here we
                                        //      decide the origin X (the cell
                                        //      resize code uses, this origin
                                        //      to stop the user)
                                        // if there is a previous handle point,
                                        //      use, that as the origin X
                                        if (intPreviousPoint !== undefined) {
                                            element.internalResize
                                                .cellOriginX = (
                                                    intPreviousPoint
                                                );
                                        // else, 0 is the origin X
                                        } else {
                                            element.internalResize
                                                .cellOriginX = 0;
                                        }

                                        // we want the minimum width to be 1
                                        element.internalResize.cellOriginX += 1;

                                        break;
                                    }
                                    if (intPoint > intMouseX) {
                                        break;
                                    }

                                    intPreviousPoint = intPoint;
                                }
                                i += 1;
                            }
                        }

                        // see if the mouse collides with a record drag handle
                        //      point
                        element.internalResize.resizeRecord = false;
                        if (
                            element.internalDisplay.headerVisible &&
                            intMouseX <= (
                                element.internalDisplay.recordSelectorWidth
                            )
                        ) {
                            i = 0;
                            len = element.internalDisplay.recordHandles.length;
                            while (i < len) {
                                intPoint = (
                                    element.internalDisplay.recordHandles[i]
                                );

                                if (Math.abs(intMouseY - intPoint) <= 5) {
                                    // we need to know what record we are
                                    //      resizing, so here we save the
                                    //      index of the record that we found
                                    element.internalResize
                                        .resizeRecordHandleIndex = i;

                                    // because we found a record to resize, set
                                    //      the resizeRecord in internal storage
                                    //      to true so that the drag code knows
                                    //      that it's going to resize in the Y
                                    //      axis
                                    element.internalResize.resizeRecord = true;

                                    // we need to be able to prevent the user
                                    //      from resizing a cell to negative
                                    //      dimensions, so here we decide the
                                    //      origin Y (the cell resize code uses
                                    //      this origin to stop the user)

                                    // if we found the insert record, origin is
                                    //      0
                                    if (
                                        i === (len - 1) &&
                                        element.internalDisplay
                                            .insertRecordVisible
                                    ) {
                                        element.internalResize.cellOriginY = (
                                            0
                                        );

                                    // if there is a previous handle point, use
                                    //      that as the origin Y
                                    } else if (i > 0) {
                                        element.internalResize.cellOriginY = (
                                            element.internalDisplay
                                                .recordHandles[i - 1]
                                        );

                                    // else, 0 is the origin Y
                                    } else {
                                        element.internalResize.cellOriginY = 0;
                                    }

                                    // we want the minimum height to be 1
                                    element.internalResize.cellOriginY += 1;

                                    break;
                                }
                                if (intPoint > intMouseY) {
                                    break;
                                }
                                i += 1;
                            }
                        }

                        //console.log(
                        //    element.internalResize.resizeRecordHandleIndex
                        //);

                        // append any handles that aren't already in the DOM

                        // if the mouse is over a column handle point, add the
                        //      column resize handle
                        if (
                            element.internalResize.resizeColumn &&
                            element.elems.handleColumn.parentNode !==
                                element.elems.dataViewport
                        ) {
                            // append handle element to the viewport
                            element.elems.dataViewport
                                .appendChild(element.elems.handleColumn);
                        }

                        // if the mouse is over a record handle point, add the
                        //      record resize handle
                        if (
                            element.internalResize.resizeRecord &&
                            element.elems.handleRecord.parentNode !==
                                element.elems.dataViewport
                        ) {
                            // append handle element to the viewport
                            element.elems.dataViewport
                                .appendChild(element.elems.handleRecord);
                        }

                        // move column handle to correct position
                        if (element.internalResize.resizeColumn) {
                            // move handle to correct position depending on the
                            //      column that was matched
                            element.elems.handleColumn.style.left = (
                                element.internalDisplay.columnHandles[
                                    element.internalResize
                                        .resizeColumnHandleIndex
                                ]
                            ) + 'px';
                        }

                        // move record handle to correct position
                        if (element.internalResize.resizeRecord) {
                            // move handle to correct position depending on the
                            //      record that was matched
                            element.elems.handleRecord.style.top = (
                                element.internalDisplay.recordHandles[
                                    element.internalResize
                                        .resizeRecordHandleIndex
                                ]
                            ) + 'px';
                        }

                        // if the mouse is over a column and record handle point
                        if (
                            element.internalResize.resizeColumn &&
                            element.internalResize.resizeRecord
                        ) {
                            // add a four-way arrow cursor
                            element.elems.dataViewport
                                .classList.add('table-cursor-all-resize');

                        // else if the mouse is over a column handle point
                        } else if (element.internalResize.resizeColumn) {
                            // add a two-way horizontal arrow cursor
                            element.elems.dataViewport
                                .classList.add('table-cursor-col-resize');

                        // else if the mouse is over a record handle point
                        } else if (element.internalResize.resizeRecord) {
                            // add a two-way vertical arrow cursor
                            element.elems.dataViewport
                                .classList.add('table-cursor-row-resize');
                        }

                        //console.log('X:' + intMouseX, 'Y:' + intMouseY);

                        element.internalResize.showThrottleID = null;
                    },
                    20  // 2 hundredths of a second, this is to prevent a really
                        //      quick selection from accidentally becoming a
                        //      resize because the user unintentionally hovered
                        //      over the resize area
                );
            };

            // we don't want a whole lot of elements for our drag handles, so
            //      instead we'll detect if the mouse is in the correct spot for
            //      a drag, if it is then we'll insert a drag element (so that
            //      we can change the cursor). This also makes it so that we can
            //      do a different cursor for column resizing, row resizing and
            //      column/row resizing.
            // when mouse is 1 or less away pixels away from a cell and/or
            //      record border: insert drag element
            element.internalEvents.cellResizeStarter = function (event) {
                var strUserAgent = window.navigator.userAgent;

                // this code only needs to run when the mouse is up. we don't
                //      want to be calculating this every mousemove during a
                //      cell selection
                // we also don't want to run this code if we are currently
                //      resizing cells already
                // we also don't want to run this code if we are currently
                //      reordering columns
                //console.log(
                //    'test',
                //    event.which,
                //    window.navigator.userAgent.indexOf("Edge"),
                //    event
                //);
                if (
                    (
                        (
                            (
                                strUserAgent.indexOf("Edge") > -1 ||
                                strUserAgent.indexOf("Firefox") > -1
                            ) &&
                            event.which === 1
                        ) ||
                        (
                            (
                                strUserAgent.indexOf("Edge") === -1 ||
                                strUserAgent.indexOf("Firefox") > -1
                            ) &&
                            event.which === 0
                        )
                    ) &&
                    element.internalResize.currentlyResizing !== true &&
                    element.internalResize.currentlyReordering !== true
                ) {
                    //console.log('lets do it');
                    // remove the column handle
                    if (
                        element.elems.handleColumn.parentNode ===
                            element.elems.dataViewport
                    ) {
                        element.elems.dataViewport
                            .removeChild(element.elems.handleColumn);
                    }

                    // remove the record handle
                    if (
                        element.elems.handleRecord.parentNode ===
                            element.elems.dataViewport
                    ) {
                        element.elems.dataViewport
                            .removeChild(element.elems.handleRecord);
                    }

                    // clear any classes that affect the cursor (that were
                    //      placed there by the cell resize code)
                    element.elems.dataViewport
                        .classList.remove('table-cursor-all-resize');
                    element.elems.dataViewport
                        .classList.remove('table-cursor-col-resize');
                    element.elems.dataViewport
                        .classList.remove('table-cursor-row-resize');

                    // show any handles we're over (THROTTLED FUNCTION)
                    showHandles(event);
                } else {
                    //console.log('lets NOT do it');
                    // cancel throttled execution of showHandles
                    if (element.internalResize.showThrottleID !== null) {
                        clearTimeout(element.internalResize.showThrottleID);
                        element.internalResize.showThrottleID = null;
                    }
                }
            };

            element.elems.dataViewport.addEventListener(
                evt.mousemove,
                element.internalEvents.cellResizeStarter
            );

            // when dragging, just show a line where you'll resize to, instead
            //      of changing the size and re-rendering multiple times in a
            //      row
            element.internalEvents.cellResizeDragStart = function () {
                var recordSelectorVisible;
                var headerVisible;
                //var insertRecordVisible;
                var intColumnHandle;
                var intRecordHandle;

                // we need to let everything know that we are resizing cells,
                //      this is used to prevent cell selection during cell
                //      resize
                element.internalResize.currentlyResizing = true;

                // there are some things in the drag end code that we only want
                //      to run if the mouse has moved (and therefore started
                //      resizing), so here we default the resizeStarted to false
                //      and after mousemove it'll be set to true
                element.internalResize.resizeStarted = false;

                // we need to know the record/column indexes at this stage and
                //      store them internally

                // reset column and row index variables
                element.internalResize.resizeColumnIndex = null;
                element.internalResize.resizeRecordIndex = null;
                element.internalResize.resizingRecordSelectors = false;
                element.internalResize.resizingHeader = false;
                element.internalResize.resizingInsert = false;

                // to get the record/column indexes, we need to know what's
                //      visible
                recordSelectorVisible = (
                    element.internalDisplay.recordSelectorVisible
                );
                headerVisible = (
                    element.internalDisplay.headerVisible
                );
                //insertRecordVisible = (
                //    element.internalDisplay.insertRecordVisible
                //);

                // if we're resizing a column, get column index or type
                if (element.internalResize.resizeColumn) {
                    // to get the record/column indexes, we need to know what
                    //      handles we're using
                    intColumnHandle = (
                        element.internalResize.resizeColumnHandleIndex
                    );

                    // if the column handle was the first one and the record
                    //      selector is visible, we need to update the record
                    //      selector width
                    if (
                        intColumnHandle === 0 &&
                        recordSelectorVisible === true
                    ) {
                        element.internalResize.resizingRecordSelectors = true;

                    // else, we are updating a column width
                    } else {
                        element.internalResize.resizeColumnIndex = (
                            // to get the column number, start with the handle
                            //      index
                            intColumnHandle +
                            // the handle index is relative to the visible
                            //      column range, so add the fromColumn of the
                            //      current range
                            element.internalDisplay.currentRange.fromColumn
                        ) - (
                            // if the record selector is visible, the column
                            //      handle index is going to be offset by one
                            //      because there is a handle to resize the
                            //      record selectors
                            recordSelectorVisible
                                ? 1
                                : 0
                        );
                    }
                }

                // if we're resizing a record, get record index or type
                if (element.internalResize.resizeRecord) {
                    // to get the record/column indexes, we need to know what
                    //      handles we're using
                    intRecordHandle = (
                        element.internalResize.resizeRecordHandleIndex
                    );

                    // if the record handle was the first one and the header
                    //      is visible, we need to update the header height
                    if (intRecordHandle === 0 && headerVisible === true) {
                        element.internalResize.resizingHeader = true;
                    }
                    //// if the record handle was the last one and the insert
                    ////      record is visible, we need to update the insert
                    ////      record height
                    //} else if (
                    //    intRecordHandle === (
                    //        element.internalDisplay.recordHandles.length - 1
                    //    ) &&
                    //    insertRecordVisible === true
                    //) {
                    //    element.internalResize.resizingInsert = true;
                    //
                    //} else {
                    //    element.internalResize.resizeRecordIndex = (
                    //        // to get the record number, start with the handle
                    //        //      index
                    //        intRecordHandle +
                    //        // the handle index is relative to the visible
                    //        //      record range, so add the fromRecord of the
                    //        //      current range
                    //        element.internalDisplay.currentRange.fromRecord
                    //    ) - (
                    //        // if the header is visible, the column
                    //        //      handle index is going to be offset by one
                    //        //      because there is a handle to resize the
                    //        //      header
                    //        headerVisible
                    //            ? 1
                    //            : 0
                    //    );
                    //}
                }

                // save original scroll location so that if the viewport is
                //      scrolled during a resize, we can do an accurate resize
                element.internalResize.scrollOriginTop = (
                    element.internalScroll.displayTop
                );
                element.internalResize.scrollOriginLeft = (
                    element.internalScroll.displayLeft
                );

                //console.log(
                //    element.internalResize.resizeColumnIndex,
                //    element.internalResize.resizeRecordIndex,
                //    element.internalResize.resizingRecordSelectors,
                //    element.internalResize.resizingHeader,
                //    element.internalResize.resizingInsert
                //);

                // we need to bind the mousemove and mouseup functionality to
                //      the body so that we can still use the mouse events even
                //      if the mouse is no longer over the gs-table
                document.body.addEventListener(
                    evt.mousemove,
                    element.internalEvents.cellResizeDragMove
                );
                document.body.addEventListener(
                    evt.mouseup,
                    element.internalEvents.cellResizeDragEnd
                );
            };

            // there are multiple places where we want to update the position of
            //      the resize lines
            setLineToMouse = function (event) {
                var jsnMousePos;
                var jsnElementPos;
                var intMouseX;
                var intMouseY;
                var viewportWidth;
                var viewportHeight;
                var cellOriginX;
                var cellOriginY;
                var intMaxColWidth;
                var intMaxRowHeight;
                var intMinColWidth;

                var intOriginScrollTop;
                var intOriginScrollLeft;
                var intCurrentScrollTop;
                var intCurrentScrollLeft;

                var intNewWidth;
                var intNewHeight;
                var intNewX;
                var intNewY;

                var intTopBoundery;

                // we need to know the origin and current scroll location in
                //      order to accurately place the resize handle
                intOriginScrollTop = (
                    element.internalResize.scrollOriginTop
                );
                intOriginScrollLeft = (
                    element.internalResize.scrollOriginLeft
                );
                intCurrentScrollTop = (
                    element.internalScroll.displayTop
                );
                intCurrentScrollLeft = (
                    element.internalScroll.displayLeft
                );

                // we need the mouse position and the element position
                jsnMousePos = GS.mousePosition(event);
                jsnElementPos = GS.getElementOffset(
                    element.elems.dataViewport
                );

                // we need to show the user where they'll be resizing to.
                //      so, move the column resize handle to where the
                //      mouse is.
                if (element.internalResize.resizeColumn) {
                    // because we've started the resize, we want the column
                    //      handle to become visible. we'll add the "active"
                    //      class.
                    element.elems.handleColumn.classList.add('active');

                    // we need the mouse X to be relative to the dataViewport
                    intMouseX = (jsnMousePos.left - jsnElementPos.left);

                    // we need to know the maximum column width
                    intMaxColWidth = (
                        element.internalDisplay.maxColumnWidth
                    );

                    // we need to know the minimum column width
                    intMinColWidth = (
                        element.internalDisplay.minColumnWidths[
                            element.internalResize.resizeColumnIndex
                        ]
                    );

                    // we need to know the original X of the column we're
                    //      resizing
                    cellOriginX = element.internalResize.cellOriginX;

                    // we need to know the viewport width
                    viewportWidth = element.elems.dataViewport.clientWidth;

                    // we need to calculate the distance from the original X
                    //      to the new X and then move the new X to an
                    //      appropriate location

                    // we need a width variable separate from the mouse, this'll
                    //      contain the new width and will be adjusted to
                    //      prevent width issues
                    intNewWidth = (
                        // the new true X
                        (
                            intMouseX +
                            intCurrentScrollLeft
                        ) -
                        // subtracted by the old true X
                        (
                            cellOriginX +
                            intOriginScrollLeft
                        )
                    );

                    //console.log(
                    //    cellOriginX, // relative to viewport and old scroll
                    //    intMouseX, // relative to viewport
                    //    intOriginScrollLeft, // old scroll
                    //    intCurrentScrollLeft, // current scroll
                    //    intNewWidth
                    //);

                    // prevent width from going negative the user can't see
                    //      it and shouldn't be able to resize to it
                    if (intNewWidth < 0) {
                        intNewWidth = 0;
                    }

                    // prevent width from going past the max width of the
                    //      viewport the scrolling always keeps the column
                    //      left to the left side of the viewport, so we
                    //      dont want to make the column bigger than the
                    //      viewport
                    if (intNewWidth > (viewportWidth - 10)) {
                        intNewWidth = (viewportWidth - 10);
                    }

                    // prevent column from going wider than max column width
                    if (intNewWidth > intMaxColWidth) {
                        intNewWidth = intMaxColWidth;
                    }

                    // prevent column from being thinner than 10px
                    if (intNewWidth < 10) {
                        intNewWidth = 10;
                    }

                    // prevent column from being thinner minimum column width
                    if (intNewWidth < intMinColWidth) {
                        intNewWidth = intMinColWidth;
                    }

                    // determine new handle X from new width
                    intNewX = (
                        // the new right side
                        (
                            cellOriginX +
                            intOriginScrollLeft +
                            intNewWidth
                        ) -
                        // subtracted by the new scrollLeft
                        (
                            intCurrentScrollLeft
                        )
                    );

                    // refresh handle location
                    element.elems.handleColumn.style.left = (intNewX) + 'px';

                    // save the last X so that the mouseup code doesn't need
                    //      to figure that out
                    element.internalResize.lastX = intNewX;

                    // save the last width so that we don't have to recalculate
                    //      it when the user let's go of the mouse
                    element.internalResize.lastWidth = intNewWidth;
                }

                // we need to show the user where they'll be resizing to.
                //      so, move the record resize handle to where the
                //      mouse is.
                if (element.internalResize.resizeRecord) {
                    // because we've started the resize, we want the record
                    //      handle to become visible. we'll add the "active"
                    //      class.
                    element.elems.handleRecord.classList.add('active');

                    // we need the mouse Y to be relative to the dataViewport
                    intMouseY = (jsnMousePos.top - jsnElementPos.top);

                    // we need to know the maximum record height
                    intMaxRowHeight = (
                        element.internalDisplay.maxRecordHeight
                    );

                    // we need to know the original Y of the record we're
                    //      resizing
                    cellOriginY = element.internalResize.cellOriginY;

                    // we need to know the viewport height
                    viewportHeight = element.elems.dataViewport.clientHeight;

                    // we need to calculate the distance from the original Y
                    //      to the new Y and then move the new Y to an
                    //      appropriate location

                    // we need a height variable separate from the mouse,
                    //      this'll contain the new height and will be
                    //      adjusted to prevent height issues
                    if (element.internalResize.resizingInsert) {
                        intNewHeight = (
                            viewportHeight -
                            intMouseY
                        );

                    } else {
                        intNewHeight = (
                            // the new true Y
                            (
                                intMouseY +
                                intCurrentScrollTop
                            ) -
                            // subtracted by the old true Y
                            (
                                cellOriginY +
                                intOriginScrollTop
                            )
                        );
                    }

                    //console.log(
                    //    cellOriginY, // relative to viewport and old scroll
                    //    intMouseY, // relative to viewport
                    //    intOriginScrollTop, // old scroll
                    //    intCurrentScrollTop, // current scroll
                    //    intNewHeight
                    //);

                    // prevent Y from going past 0,0 on the viewport
                    // the user can't see it and shouldn't be resize to it
                    if (intNewHeight < 0) {
                        intNewHeight = 0;
                    }

                    // prevent Y from going past the max Y of the viewport
                    // the user can't see it and shouldn't be resize to it
                    intTopBoundery = (
                        viewportHeight - (
                            element.internalScrollOffsets.top + 10
                        )
                    );

                    if (intNewHeight > intTopBoundery) {
                        intNewHeight = intTopBoundery;
                    }

                    // if we're not resizing the insert record
                    // prevent record from going taller than max record height
                    if (
                        !element.internalResize.resizingInsert &&
                        intNewHeight > intMaxRowHeight
                    ) {
                        intNewHeight = intMaxRowHeight;
                    }

                    // the user can't resize a record to less than 10px height
                    if (intNewHeight < 10) {
                        intNewHeight = 10;
                    }

                    // determine new handle Y from new height
                    if (element.internalResize.resizingInsert) {
                        //console.log(
                        //    intNewHeight,
                        //    viewportHeight,
                        //    intMaxRowHeight
                        //);
                        intNewY = (
                            viewportHeight -
                            intNewHeight
                        );

                    } else {
                        intNewY = (
                            // the new right side
                            (
                                cellOriginY +
                                intOriginScrollTop +
                                intNewHeight
                            ) -
                            // subtracted by the new scrollLeft
                            (
                                intCurrentScrollTop
                            )
                        );
                    }

                    element.elems.handleRecord.style.top = (intNewY) + 'px';

                    // save the last Y so that the mouseup code doesn't need
                    //      to figure that out
                    element.internalResize.lastY = intNewY;

                    // save the last height so that we don't have to recalculate
                    //      it when the user let's go of the mouse
                    element.internalResize.lastHeight = intNewHeight;
                }
            };

            element.internalEvents.cellResizeDragMove = function (event) {
                var jsnMousePos;
                var jsnElementPos;
                var bolScrollTop;
                var bolScrollLeft;
                var bolScrollRight;
                var bolScrollBottom;
                //var intViewportWidth;
                //var intViewportHeight;
                var colIndex;
                var rowIndex;
                var jsnRange;
                var strScrollDirection;

                // if the mouse moves off of the screen and then is moused up,
                //      we wont know it. so, if the mouse is up (and we're not
                //      on a touch device): preventDefault, stopPropagation and
                //      end the drag session
                if (event.which === 0 && !evt.touchDevice) {
                    event.preventDefault();
                    event.stopPropagation();
                    element.internalEvents.cellResizeDragEnd();

                } else {
                    // the resize has started, update resizeStarted to true so
                    //      that the drag end code knows that a change will be
                    //      made
                    element.internalResize.resizeStarted = true;

                    // we need to know the mouse position and the position of
                    //      the gs-table so that we can do calculations relative
                    //      to the gs-table element
                    jsnMousePos = GS.mousePosition(event);
                    jsnElementPos = GS.getElementOffset(
                        element.elems.dataViewport
                    );

                    //// convenience variables
                    //intViewportWidth = element.elems.dataViewport.clientWidth;
                    //intViewportHeight = (
                    //    element.elems.dataViewport.clientHeight
                    //);

                    // we need to know the column and/or row
                    //      number we are resizing from
                    colIndex = element.internalResize.resizeColumnIndex;
                    rowIndex = element.internalResize.resizeRecordIndex;

                    // we need to know the current visible range of cells
                    jsnRange = (
                        element.internalDisplay.currentRange
                    );

                    // find out what directions to scroll
                    bolScrollTop = (
                        jsnMousePos.top < (
                            // the mouse position is relative to the window
                            //      so we need to account for the left
                            //      offset of the gs-table element
                            jsnElementPos.top +
                            // anything we stick to the left cannot be ordered
                            //      to, so start scrolling at the right side of
                            //      the left offset
                            element.internalScrollOffsets.top
                        )
                    );
                    bolScrollLeft = (
                        jsnMousePos.left < (
                            // the mouse position is relative to the window
                            //      so we need to account for the left
                            //      offset of the gs-table element
                            jsnElementPos.left +
                            // anything we stick to the left cannot be ordered
                            //      to, so start scrolling at the right side of
                            //      the left offset
                            element.internalScrollOffsets.left
                        )
                    );
                    bolScrollRight = (
                        jsnMousePos.left > (
                            (
                                // the mouse position is relative to the window
                                //      so we need to account for the left
                                //      offset of the gs-table element
                                jsnElementPos.left +
                                // we want the right side so we need to take
                                //      into account the width of the gs-table
                                element.elems.dataViewport.clientWidth
                            ) -
                            // anything we stick to the right cannot be ordered
                            //      to, so start scrolling at the beginning of
                            //      the right offset
                            element.internalScrollOffsets.right
                        )
                    );
                    bolScrollBottom = (
                        jsnMousePos.top > (
                            (
                                // the mouse position is relative to the window
                                //      so we need to account for the top
                                //      offset of the gs-table element
                                jsnElementPos.top +
                                // we want the bottom side so we need to take
                                //      into account the height of the gs-table
                                element.elems.dataViewport.clientHeight
                            ) -
                            // anything we stick to the bottom cannot be resized
                            //      past, so start scrolling at the beginning of
                            //      the bottom offset
                            element.internalScrollOffsets.bottom
                        )
                    );

                    // you can't scroll vertically when you're not
                    //      resizing a record
                    if (!element.internalResize.resizeRecord) {
                        bolScrollTop = false;
                        bolScrollBottom = false;
                    }

                    // you can't scroll horizontally when you're not
                    //      resizing a column
                    if (!element.internalResize.resizeColumn) {
                        bolScrollLeft = false;
                        bolScrollRight = false;
                    }

                    // you can't scroll horizontally when you're
                    //      resizing the record selectors
                    if (element.internalResize.resizingRecordSelectors) {
                        bolScrollLeft = false;
                        bolScrollRight = false;
                    }

                    // you can't scroll vertically when you're
                    //      resizing the header or the insert record
                    if (
                        element.internalResize.resizingHeader ||
                        element.internalResize.resizingInsert
                    ) {
                        bolScrollTop = false;
                        bolScrollBottom = false;
                    }

                    // if we are scrolling up and the initial
                    //      record is the last visible record
                    //      (or second last)
                    if (
                        bolScrollTop &&
                        rowIndex === jsnRange.toRecord
                    ) {
                        bolScrollTop = false;
                    }

                    // if we're scrolling left and the initial
                    //      column is the last visible column
                    if (
                        bolScrollLeft &&
                        colIndex === jsnRange.toColumn
                    ) {
                        bolScrollLeft = false;
                    }

                    // if we're scrolling down and the initial
                    //      record is the first visible record
                    if (
                        bolScrollBottom &&
                        rowIndex === jsnRange.fromRecord
                    ) {
                        bolScrollBottom = false;
                    }

                    // if we're scrolling to the right and the
                    //      initial column is the first visible
                    //      column
                    if (
                        bolScrollRight &&
                        colIndex === jsnRange.fromColumn
                    ) {
                        bolScrollRight = false;
                    }

                    //console.log(
                    //    'X:' + jsnMousePos.left,
                    //    'Y:' + jsnMousePos.top,
                    //    bolScrollTop,
                    //    bolScrollLeft,
                    //    bolScrollRight,
                    //    bolScrollBottom
                    //);

                    // if the mouse is to the side of the viewport and scrolling
                    //      hasn't been started already: we want to start
                    //      scrolling on a timer
                    if (
                        (
                            bolScrollTop ||
                            bolScrollLeft ||
                            bolScrollRight ||
                            bolScrollBottom
                        ) &&
                        !element.internalScroll.dragScrolling
                    ) {
                        // start scroll
                        dragScrollStart(
                            element,
                            // drag move callback
                            function () {
                                var bolOldScrollTop;
                                var bolOldScrollLeft;
                                var bolOldScrollBottom;
                                var bolOldScrollRight;

                                // the scroll direction could be changed
                                //      anytime, we need to make sure we're
                                //      up to date
                                strScrollDirection = (
                                    element.internalScroll
                                        .dragScrollingDirection
                                );
                                bolScrollTop = (
                                    strScrollDirection.indexOf('top') !== -1
                                );
                                bolScrollLeft = (
                                    strScrollDirection.indexOf('left') !== -1
                                );
                                bolScrollBottom = (
                                    strScrollDirection.indexOf('bottom') !== -1
                                );
                                bolScrollRight = (
                                    strScrollDirection.indexOf('right') !== -1
                                );

                                // we want to know if a scroll direction was
                                //      changed, so we'll save the old scroll
                                //      booleans
                                bolOldScrollTop = bolScrollTop;
                                bolOldScrollLeft = bolScrollLeft;
                                bolOldScrollBottom = bolScrollBottom;
                                bolOldScrollRight = bolScrollRight;

                                // we need the user to see where the column or
                                //      row will be resized to
                                setLineToMouse(event);

                                // we need to know the current visible range
                                //      of cells
                                jsnRange = (
                                    element.internalDisplay.currentRange
                                );

                                //console.log(
                                //    bolScrollTop,
                                //    rowIndex,
                                //    jsnRange.toRecord
                                //);
                                //console.log(
                                //    bolScrollLeft,
                                //    colIndex,
                                //    jsnRange.toColumn
                                //);
                                //console.log(
                                //    bolScrollBottom,
                                //    rowIndex,
                                //    jsnRange.fromRecord
                                //);
                                //console.log(
                                //    bolScrollRight,
                                //    colIndex,
                                //    jsnRange.fromColumn
                                //);

                                // if we are scrolling up and the initial
                                //      record is the last visible record
                                //      (or second last)
                                if (
                                    bolScrollTop &&
                                    rowIndex === jsnRange.toRecord
                                ) {
                                    bolScrollTop = false;
                                }

                                // if we're scrolling left and the initial
                                //      column is the last visible column
                                if (
                                    bolScrollLeft &&
                                    colIndex === jsnRange.toColumn
                                ) {
                                    bolScrollLeft = false;
                                }

                                // if we're scrolling down and the initial
                                //      record is the first visible record
                                if (
                                    bolScrollBottom &&
                                    rowIndex === jsnRange.fromRecord
                                ) {
                                    bolScrollBottom = false;
                                }

                                // if we're scrolling to the right and the
                                //      initial column is the first visible
                                //      column
                                if (
                                    bolScrollRight &&
                                    colIndex === jsnRange.fromColumn
                                ) {
                                    bolScrollRight = false;
                                }

                               //console.log(
                               //    'bolScrollTop: ' + bolScrollTop
                               //);
                               //console.log(
                               //    'bolScrollLeft: ' + bolScrollLeft
                               //);
                               //console.log(
                               //    'bolScrollBottom: ' + bolScrollBottom
                               //);
                               //console.log(
                               //    'bolScrollRight: ' + bolScrollRight
                               //);

                                // if a scroll direction was stopped
                                if (
                                    bolScrollTop !== bolOldScrollTop ||
                                    bolScrollLeft !== bolOldScrollLeft ||
                                    bolScrollBottom !== bolOldScrollBottom ||
                                    bolScrollRight !== bolOldScrollRight
                                ) {
                                    // if there are any scroll directions left,
                                    //      restart scrolling in that direction
                                    if (
                                        bolScrollTop ||
                                        bolScrollLeft ||
                                        bolScrollRight ||
                                        bolScrollBottom
                                    ) {
                                        // reset scrolling direction
                                        element.internalScroll
                                            .dragScrollingDirection = (
                                                (
                                                    bolScrollTop
                                                        ? 'top'
                                                        : ''
                                                ) +
                                                (
                                                    bolScrollLeft
                                                        ? 'left'
                                                        : ''
                                                ) +
                                                (
                                                    bolScrollRight
                                                        ? 'right'
                                                        : ''
                                                ) +
                                                (
                                                    bolScrollBottom
                                                        ? 'bottom'
                                                        : ''
                                                )
                                            );
                                    } else {
                                        //console.log('RESIZE SCROLL STOPPED');
                                        dragScrollEnd(element);
                                    }
                                }

                                //element.internalResize.lastY
                                //element.internalResize.lastX
                                //element.internalResize.lastWidth
                                //element.internalResize.lastHeight
                                //dragScrollEnd(element);
                            },
                            (
                                (
                                    bolScrollTop
                                        ? 'top'
                                        : ''
                                ) +
                                (
                                    bolScrollLeft
                                        ? 'left'
                                        : ''
                                ) +
                                (
                                    bolScrollRight
                                        ? 'right'
                                        : ''
                                ) +
                                (
                                    bolScrollBottom
                                        ? 'bottom'
                                        : ''
                                )
                            )
                        );

                    // else if the scrolling has started and there are
                    //      directions we want to scroll
                    } else if (
                        element.internalScroll.dragScrolling &&
                        (
                            bolScrollTop ||
                            bolScrollLeft ||
                            bolScrollRight ||
                            bolScrollBottom
                        )
                    ) {
                        strScrollDirection = (
                            element.internalScroll.dragScrollingDirection
                        );

                        // if there is a direction that we want to scroll but
                        //      aren't scrolling right now, we need to add that
                        //      direction to the scroll direction
                        if (
                            bolScrollTop &&
                            strScrollDirection.indexOf('top') === -1
                        ) {
                            strScrollDirection += 'top';
                        }
                        if (
                            bolScrollLeft &&
                            strScrollDirection.indexOf('left') === -1
                        ) {
                            strScrollDirection += 'left';
                        }
                        if (
                            bolScrollRight &&
                            strScrollDirection.indexOf('right') === -1
                        ) {
                            strScrollDirection += 'right';
                        }
                        if (
                            bolScrollBottom &&
                            strScrollDirection.indexOf('bottom') === -1
                        ) {
                            strScrollDirection += 'bottom';
                        }

                        //console.log(
                        //    '1***',
                        //    strScrollDirection,
                        //    element.internalScroll.dragScrollingDirection
                        //);

                        // if we added a scroll direction, update the internal
                        //      storage
                        if (
                            strScrollDirection !==
                                element.internalScroll.dragScrollingDirection
                        ) {
                            //console.log(
                            //    '2***',
                            //    strScrollDirection,
                            //    element.internalScroll.dragScrollingDirection
                            //);
                            element.internalScroll.dragScrollingDirection = (
                                strScrollDirection
                            );
                        }

                        //console.log(
                        //    '3***',
                        //    strScrollDirection,
                        //    element.internalScroll.dragScrollingDirection
                        //);

                    // else if the mouse is NOT to the side of the viewport and
                    //      the scrolling has been started: we want to stop
                    //      scrolling
                    } else if (
                        !bolScrollTop &&
                        !bolScrollLeft &&
                        !bolScrollRight &&
                        !bolScrollBottom &&
                        element.internalScroll.dragScrolling
                    ) {
                        // stop scroll
                        dragScrollEnd(element);
                    }

                    // we need the user to see where the column or row will be
                    //      resized to
                    setLineToMouse(event);

                    //console.log('X:' + intMouseX, 'Y:' + intMouseY);
                }
            };

            element.internalEvents.cellResizeDragEnd = function () {
                var intNew;
                var intIndex;
                var i;
                var len;
                var arrRecordHeights;
                var arrSelectedColumns;
                var arrColumnWidths;
                var arrColumns;


                var colsToResize = [];
                var selectedBroken = false;
                //console.log(arrSelectedColumns);
                //console.log(
                //    element.internalSelection.rows[0]
                //    , ', header'
                //);
                if (element.internalSelection.rows[0] ===
                    'header'
                ) {
                    //console.log(
                    //    element.internalSelection.ranges.length
                    //    , ', > 0'
                   // );
                    if (element.internalSelection.ranges.length
                        > 0
                    ) {
                        var jsnFirstRange = (
                            element.internalSelection.ranges[0]
                        );
                        var intSelectionLength;
                        var strStartColumn = jsnFirstRange.start.column;
                        var strEndColumn = jsnFirstRange.end.column;
                        var intStartColumn = parseInt(
                            (
                                strStartColumn === 'selector'
                                    ? 0
                                    : strStartColumn
                            ),
                            10
                        );
                        var intEndColumn = parseInt(
                            (
                                strEndColumn === 'selector'
                                    ? 0
                                    : strEndColumn
                            ),
                            10
                        );

                        if (jsnFirstRange.start.row === 'header') {
                            if (
                                strStartColumn === 'selector' &&
                                strEndColumn === 'selector'
                            ) {
                                intSelectionLength = (
                                    element.internalSelection.columns.length - 2
                                );
                            } else if (intStartColumn > intEndColumn) {
                                selectedBroken = true;
                                intSelectionLength = (
                                    (intStartColumn + 1) - intEndColumn
                                );
                            } else {
                                selectedBroken = false;
                                intSelectionLength = (
                                    (intEndColumn + 1) - intStartColumn
                                );
                            }
                            if (intSelectionLength === 0) {
                                intSelectionLength = 1;
                            }

                            i = 0;
                            while (i < intSelectionLength) {
                                if (selectedBroken) {
                                    colsToResize.push(
                                        i + intEndColumn
                                    );
                                } else {
                                    colsToResize.push(
                                        i + intStartColumn
                                    );
                                }

                                i += 1;
                            }
                        }
                    }

                }
                // nunzio commented this out on 2017-08-21
                //      because it was causing the datasheet
                //      to resize the selected columns even
                //      though the resized column was not selected
                // colsToResize.push(element.internalResize.resizeColumnIndex);

                //console.log(colsToResize);

                // if scrolling is running, stop it because we are done with
                //      the mouse part of the resize action
                if (element.internalScroll.dragScrolling) {
                    dragScrollEnd(element);
                }

                // because we've ended the resize, we want the column
                //      handle to become invisible. we'll remove the
                //      "active" class.
                element.elems.handleColumn.classList.remove('active');

                // because we've ended the resize, we want the record
                //      handle to become invisible. we'll remove the
                //      "active" class.
                element.elems.handleRecord.classList.remove('active');

                // if the column resize handle exists and was moved:
                //      apply column resize
                if (
                    element.internalResize.resizeColumn &&
                    element.internalResize.resizeStarted
                ) {
                    // calculate the new width based on the origin X and the
                    //      last X the mouse was at
                    intNew = (element.internalResize.lastWidth);

                    // if we're resizing the record selector column
                    if (element.internalResize.resizingRecordSelectors) {
                        element.internalDisplay.recordSelectorWidth = intNew;

                    // else, we are updating a column width
                    } else {
                        // get the index of the column that was resized
                        intIndex = (
                            element.internalResize.resizeColumnIndex
                        );

                        // we need to know the selected columns so that we can
                        //      check to see if the resized column was selected
                        // convenience variable
                // // arrSelectedColumns = element.internalSelection.columns;
                        // // arrSelectedColumns = (
                        // //     arrSelectedColumns.slice(
                        // //         arrSelectedColumns[0] === 'selector'
                        // //             ? 1
                        // //             : 0
                        // //     )
                        // // );

                        // convenience variable
                        arrColumnWidths = (
                            element.internalDisplay.columnWidths
                        );
                        //console.log(colsToResize);
                        // if the column we resized was seleced, resize any
                        //      columns that are selected and connected to it
                        if (colsToResize.indexOf(intIndex) > -1) {
                            arrColumns = (
                                getConnectedSelectedColumns(element, intIndex)
                            );

                            i = 0;
                            len = colsToResize.length;
                            while (i < len) {
                                arrColumnWidths[colsToResize[i]] = intNew;
                                //[arrColumns[i]] = intNew;

                                i += 1;
                            }
                        } else {
                            // set new width
                            arrColumnWidths[intIndex] = intNew;
                        }
                    }
                }

                // if the record resize handle exists and was moved:
                //      apply record resize
                if (
                    element.internalResize.resizeRecord &&
                    element.internalResize.resizeStarted
                ) {
                    // calculate the new height based on the origin Y and the
                    //      last Y the mouse was at
                    intNew = (element.internalResize.lastHeight);

                    // if we're resizing the header
                    if (element.internalResize.resizingHeader) {
                        element.internalDisplay.headerHeight = intNew;

                    //// if we're resizing the insert record
                    //} else if (element.internalResize.resizingInsert) {
                    //    element.internalDisplay.insertRecordHeight = intNew;

                    // else, resizing a regular row
                    } else {
                        // resize all records
                        arrRecordHeights = (
                            element.internalDisplay.recordHeights
                        );
                        i = 0;
                        len = arrRecordHeights.length;
                        while (i < len) {
                            arrRecordHeights[i] = intNew;
                            i += 1;
                        }

                        if (element.internalDisplay.insertRecordVisible) {
                            element.internalDisplay.insertRecordHeight = intNew;
                        }
                    }
                }

                // if a handle drag occured:
                if (element.internalResize.resizeStarted) {
                    // re-render so that the user can see the cells in their
                    //      new sizes
                    // we re-render the scroll dimensions because the cell
                    //      resize might affect the scroll width or height
                    renderScrollDimensions(element);
                }

                // we need to let everything know that we are no longer
                //      resizing cells
                element.internalResize.currentlyResizing = false;

                // unbind mousemove and mouseup
                document.body.removeEventListener(
                    evt.mousemove,
                    element.internalEvents.cellResizeDragMove
                );
                document.body.removeEventListener(
                    evt.mouseup,
                    element.internalEvents.cellResizeDragEnd
                );
            };

            // bind the same drag start to the record and column elements so
            //      that if either one is mousedown'ed on, the cell resize
            //      starts
            element.elems.handleColumn.addEventListener(
                evt.mousedown,
                element.internalEvents.cellResizeDragStart
            );
            element.elems.handleRecord.addEventListener(
                evt.mousedown,
                element.internalEvents.cellResizeDragStart
            );

            // we want to resize the selected records/columns back to their
            //      default sizes if the handle is double-clicked
            element.internalEvents.cellResizeToDefault = function () {
                //var intIndex;
                var intNew;
                var i;
                var len;
                var arrRecordHeights;
                var arrSelectedColumns;
                //var arrColumnWidths;
                //var arrColumns;

                // we need to be able to resize all selected records/columns,
                //      if the handle you double click touches a selected
                //      cell: resize all selected cells to default
                // ### NEED CODING ###

                // if the column resize handle exists: apply column resize
                if (element.internalResize.resizeColumn) {
                    // if the column handle was the first one and the record
                    //      selector is visible, we need to update the record
                    //      selector width
                    if (element.internalResize.resizingRecordSelectors) {
                        element.internalDisplay.recordSelectorWidth = (
                            element.internalDisplay.defaultRecordSelectorWidth
                        );

                    // else, we are updating a column width
                    } else {
                        //// get the index of the column that was resized
                        //intIndex = (
                        //    element.internalResize.resizeColumnIndex
                        //);

                        // we need to know the selected columns so that we can
                        //      check to see if the resized column was selected
                        // convenience variable
                        arrSelectedColumns = element.internalSelection.columns;
                        arrSelectedColumns = (
                            arrSelectedColumns.slice(
                                arrSelectedColumns[0] === 'selector'
                                    ? 1
                                    : 0
                            )
                        );

                        var colsToResize = [];
                        var selectedBroken = false;
                        var jsnFirstRange;
                        var strStartColumn;
                        var strEndColumn;
                        var intStartColumn;
                        var intEndColumn;
                        var intSelectionLength;

                        if (element.internalSelection.rows[0] ===
                            'header'
                        ) {
                            if (
                                element.internalSelection.ranges.length > 0
                            ) {
                                jsnFirstRange = (
                                    element.internalSelection.ranges[0]
                                );
                                strStartColumn = jsnFirstRange.start.column;
                                strEndColumn = jsnFirstRange.end.column;
                                intStartColumn = (
                                    parseInt(
                                        (
                                            strStartColumn === 'selector'
                                                ? 0
                                                : strStartColumn
                                        ),
                                        10
                                    )
                                );
                                intEndColumn = (
                                    parseInt(
                                        (
                                            strEndColumn === 'selector'
                                                ? 0
                                                : strEndColumn
                                        ),
                                        10
                                    )
                                );

                                if (jsnFirstRange.start.row === 'header') {
                                    if (
                                        strStartColumn === 'selector' &&
                                        strEndColumn === 'selector'
                                    ) {
                                        intSelectionLength = (
                                            element.internalSelection
                                                .columns
                                                .length - 2
                                        );
                                    } else if (intStartColumn > intEndColumn) {
                                        selectedBroken = true;
                                        intSelectionLength = (
                                            (intStartColumn + 1) - intEndColumn
                                        );
                                    } else {
                                        selectedBroken = false;
                                        intSelectionLength = (
                                            (intEndColumn + 1) - intStartColumn
                                        );
                                    }
                                    if (intSelectionLength === 0) {
                                        intSelectionLength = 1;
                                    }

                                    i = 0;
                                    while (i < intSelectionLength) {
                                        if (selectedBroken) {
                                            colsToResize.push(
                                                i + intEndColumn
                                            );
                                        } else {
                                            colsToResize.push(
                                                i + intStartColumn
                                            );
                                        }

                                        i += 1;
                                    }
                                }
                            }
                        }
                        // commented by nunzio on 2017-08-21
                        //      Same reason as in cellResizeDragEnd
                        //colsToResize.push(
                        //    element.internalResize.resizeColumnIndex
                        //);

                        //console.log(colsToResize);
                        if (colsToResize.indexOf(
                            element.internalResize.resizeColumnIndex
                        ) > 0) {
                            resizeColumnsToContent(element, colsToResize);
                        } else {
                            resizeColumnsToContent(element, [
                                element.internalResize.resizeColumnIndex
                            ]);
                        }



                        //// convenience variable
                        //arrColumnWidths = (
                        //    element.internalDisplay.columnWidths
                        //);

                        //// if the column we resized was seleced, resize any
                        ////      columns that are selected and connected to it
                        //if (arrSelectedColumns.indexOf(intIndex) > -1) {
                        //    arrColumns = (
                        //        getConnectedSelectedColumns(element, intIndex)
                        //    );

                        //    i = 0;
                        //    len = arrColumns.length;
                        //    while (i < len) {
                        //        arrColumnWidths[arrColumns[i]] = (
                        //            element.internalDisplay
                        //                .defaultColumnWidths[arrColumns[i]]
                        //        );
                        //        i += 1;
                        //    }
                        //} else {
                        //    // set new width
                        //    arrColumnWidths[intIndex] = (
                        //        element.internalDisplay
                        //            .defaultColumnWidths[intIndex]
                        //    );
                        //}
                    }
                }

                // if the record resize handle exists: apply record resize
                if (element.internalResize.resizeRecord) {
                    // if we double-clicked the header
                    if (element.internalResize.resizingHeader) {
                        element.internalDisplay.headerHeight = (
                            element.internalDisplay.defaultHeaderHeight
                        );

                    //// if we double-clicked the insert record
                    //} else if (element.internalResize.resizingInsert) {
                    //    element.internalDisplay.insertRecordHeight = (
                    //        element.internalDisplay.defaultInsertRecordHeight
                    //    );

                    } else {
                        // resize all records
                        intNew = (
                            element.internalDisplay.defaultRecordHeight
                        );
                        arrRecordHeights = (
                            element.internalDisplay.recordHeights
                        );
                        i = 0;
                        len = arrRecordHeights.length;
                        while (i < len) {
                            arrRecordHeights[i] = intNew;
                            i += 1;
                        }

                        if (element.internalDisplay.insertRecordVisible) {
                            element.internalDisplay.insertRecordHeight = (
                                element.internalDisplay
                                    .defaultInsertRecordHeight
                            );
                        }
                    }
                }

                // remove the handles from the viewport because a partial render
                //      doesn't remove them
                if (element.internalResize.resizeColumn) {
                    element.elems.dataViewport.removeChild(
                        element.elems.handleColumn
                    );
                }
                if (element.internalResize.resizeRecord) {
                    element.elems.dataViewport.removeChild(
                        element.elems.handleRecord
                    );
                }

                // re-render so that the user can see the cells in their new
                //      sizes
                // we re-render the scroll dimensions because the cell resize
                //      might affect the scroll width or height
                renderScrollDimensions(element);
            };

            // bind the same resize to default to the record and column handles
            //      so that if either one is double-clicked on, the cell resize
            //      is triggered
            element.elems.handleColumn.addEventListener(
                'dblclick',
                element.internalEvents.cellResizeToDefault
            );
            element.elems.handleRecord.addEventListener(
                'dblclick',
                element.internalEvents.cellResizeToDefault
            );
        }
    }

    // ############# COLUMN REORDER EVENTS #############
    function unbindColumnReorder(element) {
        if (!evt.touchDevice) {
            element.elems.dataViewport.removeEventListener(
                'mousedown',
                element.internalEvents.columnReorderDragStart
            );
        }
    }
    function bindColumnReorder(element) {
        var setLineToMouse;

        if (!evt.touchDevice) {
            // we want to take the mouse position and add a line to the closest
            //      column line, we do this on mousedown and on mousemove, so
            //      we'll create a function to handle that
            setLineToMouse = function (event) {
                var jsnMousePos;
                var jsnElementPos;
                var arrColumnHandles;
                var intMouse;
                var intPrevHandle;
                var intCurrentHandle;
                var intPrevIndex;
                var intCurrentIndex;
                var intHandleIndex;
                var intInsertionIndex;
                var i;
                var len;

                // we need the mouse position
                jsnMousePos = GS.mousePosition(event);

                // we need the element position because the mouse position is
                //      not relative to element
                jsnElementPos = GS.getElementOffset(
                    element.elems.dataViewport
                );

                // we need the locations where a column can be moved to
                arrColumnHandles = (
                    element.internalDisplay.columnHandles
                );

                // we need the mouse left position relative to the gs-table
                intMouse = (
                    jsnMousePos.left - jsnElementPos.left
                );

                // we need to find the correct insertion points
                if (
                    element.internalScroll.dragScrolling &&
                    element.internalScroll.dragScrollingDirection === 'left'
                ) {
                    // get first non-null handle
                    i = 0;
                    len = arrColumnHandles.length;
                    while (i < len) {
                        if (arrColumnHandles[i] !== null) {
                            intHandleIndex = i;
                            break;
                        }
                        i += 1;
                    }

                } else if (
                    element.internalScroll.dragScrolling &&
                    element.internalScroll.dragScrollingDirection === 'left'
                ) {
                    // get last non-null handle
                    i = (arrColumnHandles.length - 1);
                    while (i >= 0) {
                        if (arrColumnHandles[i] !== null) {
                            intHandleIndex = i;
                            break;
                        }
                        i -= 1;
                    }

                } else {
                    // we need to find out what handle the mouse is closest to
                    //      BEWARE, hidden columns have null as their handle.
                    //      we need to work around null column handles
                    intPrevHandle = null;
                    intCurrentHandle = null;
                    intPrevIndex = null;
                    intCurrentIndex = null;
                    intHandleIndex = null;
                    i = 0;
                    len = arrColumnHandles.length;
                    while (i < len) {
                        if (arrColumnHandles[i] !== null) {
                            intCurrentHandle = arrColumnHandles[i];
                            intCurrentIndex = i;
                        }

                        if (
                            intPrevHandle !== null &&
                            intCurrentHandle !== null
                        ) {
                            if (
                                intMouse >= intPrevHandle &&
                                intMouse <= intCurrentHandle
                            ) {
                                if (
                                    // if the mouse is closer to the right
                                    (intCurrentHandle - intMouse) <
                                        (intMouse - intPrevHandle)
                                ) {
                                    intHandleIndex = intCurrentIndex;

                                // else, the handle is the left handle
                                } else {
                                    intHandleIndex = intPrevIndex;
                                }
                            } else if (i === (len - 1)) {
                                if (intMouse >= intCurrentHandle) {
                                    intHandleIndex = intCurrentIndex;
                                } else {
                                    intHandleIndex = intPrevIndex;
                                }
                            }
                        } else if (
                            intCurrentHandle !== null &&
                            intMouse <= intCurrentHandle
                        ) {
                            intHandleIndex = intCurrentIndex;
                        }

                        if (intHandleIndex !== null) {
                            break;
                        }

                        if (intCurrentHandle !== null) {
                            intPrevHandle = intCurrentHandle;
                            intPrevIndex = intCurrentIndex;
                        }

                        i += 1;
                    }
                }
                //console.log(
                //    intMouse,
                //    intPrevHandle,
                //    intPrevIndex,
                //    intCurrentHandle,
                //    intCurrentIndex,
                //    intHandleIndex,
                //    element.internalDisplay.currentRange.fromColumn
                //);

                // the handle list only contains the visible column
                //      list so, we have to add the first visible
                //      column's number to the handle index
                intInsertionIndex = (
                    intHandleIndex +
                    element.internalDisplay.currentRange.fromColumn
                );

                //console.log(
                //    intScroll,
                //    intMouse,
                //    intViewportWidth,
                //    intHandleIndex,
                //    intInsertionIndex
                //);

                // sometimes, this function will be called while the reorder
                //      indicator is not in the DOM, if it isn't, append it to
                //      the dataViewport
                if (
                    element.elems.handleReorder.parentNode !==
                        element.elems.dataViewport
                ) {
                    element.elems.dataViewport.appendChild(
                        element.elems.handleReorder
                    );
                }

                // we need to update the position of the line
                element.elems.handleReorder.style.left = (
                    (
                        arrColumnHandles[intHandleIndex]
                    ) + 'px'
                );

                // we need to keep track of the drop location
                element.internalReorder.dropLocation = intInsertionIndex;
            };

            // when dragging, just show a line where you'll resize to, instead
            //      of changing the size and re-rendering multiple times in a
            //      row
            element.internalEvents.columnReorderDragStart = function (event) {
                var target;
                var parentCell;
                var intColNumber;
                var arrCurrentColumns;

                // we only want to reorder if the drag originates from a header
                //      cell that is selected
                target = event.target;
                if (parentCell && parentCell.nodeName !== 'GS-CELL') {
                    parentCell = GS.findParentElement(target, 'gs-cell');
                } else {
                    parentCell = target;
                }

                if (
                    parentCell &&
                    parentCell.nodeName === 'GS-CELL' &&
                    parentCell.classList.contains('table-header') &&
                    parentCell.hasAttribute('selected') &&
                    // only reorder when the left mouse button is down
                    event.which === 1
                ) {
                    // we need to let everything know that we are reordering,
                    //      this is used to prevent cell selection during column
                    //      reorder
                    element.internalReorder.currentlyReordering = true;

                    // there are some things in the drag end code that we only
                    //      want to run if the mouse has moved (and therefore
                    //      started reordering), so here we default the
                    //      reorderStarted to false and after mousemove it'll
                    //      be set to true
                    element.internalReorder.reorderStarted = false;

                    // we need to know what columns we're dragging, so we'll
                    //      take the column number and grab any column numbers
                    //      that are contiguous

                    // get number of the column we selected
                    intColNumber = parseInt(
                        parentCell.getAttribute('data-col-number'),
                        10
                    );
                    //console.log('column', intColNumber);

                    // clear current columns array so that we can start fresh
                    arrCurrentColumns = (
                        getConnectedSelectedColumns(element, intColNumber)
                    );

                    //console.log(arrSelection, arrCurrentColumns);

                    // we want the drag move and drag end functions to know what
                    //      columns are being reordered, so we'll save the array
                    //      to the internal storage
                    element.internalReorder.currentColumns = arrCurrentColumns;

                    // we want to know what column was the column that the user
                    //      initiated the drag on
                    element.internalReorder.originColumn = intColNumber;

                    // we want to know if a drop location was chosen, so we'll
                    //      clear out the old drop location and that way all
                    //      we'll have to do is test for null
                    element.internalReorder.dropLocation = null;

                    // sometimes, the user has other columns selected, let's
                    //      reset the selection to be the columns the user is
                    //      reordering
                    element.internalSelection.ranges = [
                        {
                            "start": {
                                "row": "header",
                                "column": arrCurrentColumns[0]
                            },
                            "end": {
                                "row": "header",
                                "column": arrCurrentColumns[
                                    arrCurrentColumns.length - 1
                                ]
                            },
                            "negator": false
                        }
                    ];

                    // re-render the select to show the user the change
                    renderSelection(element);

                    // we need the user to see where the column will be dropped
                    setLineToMouse(event);

                    // we need to bind the mousemove and mouseup functionality
                    //      to the body so that we can still use the mouse
                    //      events even if the mouse is no longer over the
                    //      gs-table
                    document.body.addEventListener(
                        evt.mousemove,
                        element.internalEvents.columnReorderDragMove
                    );
                    document.body.addEventListener(
                        evt.mouseup,
                        element.internalEvents.columnReorderDragEnd
                    );
                }
            };

            element.internalEvents.columnReorderDragMove = function (event) {
                var jsnMousePos;
                var jsnElementPos;
                var bolScrollLeft;
                var bolScrollRight;

                // if the mouse moves off of the screen and then is moused up,
                //      we wont know it. so, if the mouse is up (and we're not
                //      on a touch device): preventDefault, stopPropagation and
                //      end the drag session
                if (event.which === 0 && !evt.touchDevice) {
                    event.preventDefault();
                    event.stopPropagation();
                    element.internalEvents.columnReorderDragEnd();

                } else {
                    // the resize has started, update resizeStarted to true so
                    //      that the drag end code knows that a change will be
                    //      made
                    element.internalReorder.reorderStarted = true;

                    // we need to know the mouse position and the position of
                    //      the gs-table so that we can do calculations relative
                    //      to the gs-table element
                    jsnMousePos = GS.mousePosition(event);
                    jsnElementPos = GS.getElementOffset(
                        element.elems.dataViewport
                    );

                    // find out what directions to scroll
                    bolScrollLeft = (
                        jsnMousePos.left < (
                            // the mouse position is relative to the window
                            //      so we need to account for the left
                            //      offset of the gs-table element
                            jsnElementPos.left +
                            // anything we stick to the left cannot be ordered
                            //      to, so start scrolling at the right side of
                            //      the left offset
                            element.internalScrollOffsets.left
                        )
                    );
                    bolScrollRight = (
                        jsnMousePos.left > (
                            (
                                // the mouse position is relative to the window
                                //      so we need to account for the left
                                //      offset of the gs-table element
                                jsnElementPos.left +
                                // we want the right side so we need to take
                                //      into account the width of the gs-table
                                element.elems.dataViewport.clientWidth
                            ) -
                            // anything we stick to the right cannot be ordered
                            //      to, so start scrolling at the beginning of
                            //      the right offset
                            element.internalScrollOffsets.right
                        )
                    );

                    //console.log(
                    //    'X:' + intMouseX,
                    //    bolScrollLeft,
                    //    bolScrollRight
                    //);

                    // if the mouse is to the side of the viewport and scrolling
                    //      hasn't been started already: we want to start
                    //      scrolling on a timer
                    if (
                        (bolScrollLeft || bolScrollRight) &&
                        !element.internalScroll.dragScrolling
                    ) {
                        // start scroll
                        dragScrollStart(
                            element,
                            // drag move callback
                            function () {
                                // we need the user to see where the
                                //      column will be dropped
                                setLineToMouse(event);
                            },
                            (
                                bolScrollLeft
                                    ? 'left'
                                    : 'right'
                            )
                        );

                    // else if the mouse is NOT to the side of the viewport and
                    //      the scrolling has been started: we want to stop
                    //      scrolling
                    } else if (
                        !bolScrollLeft &&
                        !bolScrollRight &&
                        element.internalScroll.dragScrolling
                    ) {
                        // stop scroll
                        dragScrollEnd(element);
                    }

                    // we need the user to see where the column will be dropped
                    setLineToMouse(event);
                }
            };

            element.internalEvents.columnReorderDragEnd = function () {
                var arrOrderCols;
                var intDropIndex;
                var headerTemplate;
                var recordTemplate;
                var insertTemplate;
                var arrOldHeaderTemplate;
                var arrOldRecordTemplate;
                var arrOldInsertTemplate;
                var arrOldPlainText;
                var arrOldDataCol;
                var arrOldColWidths;
                var arrOldDefaultColWidths;
                var arrOldCopyHeaders;
                var arrOldCopyCol;
                var strNewHeaderTemplate;
                var strNewRecordTemplate;
                var strNewInsertTemplate;
                var arrNewPlainText;
                var arrNewDataCol;
                var arrNewColWidths;
                var arrNewDefaultColWidths;
                var arrNewCopyHeaders;
                var arrNewCopyCol;

                var i;
                var len;
                var intSeqIndex;
                var unmovedColumns;
                var pullIndex;

                var index;
                var strSort;
                var strColumn;
                var strOldSortOrder;
                var strNewSortOrder;

                // when reordering columns, we put a line into the viewport to
                //      indicate where the columns will be put. so, we need to
                //      remove the line
                if (
                    element.elems.handleReorder.parentNode ===
                        element.elems.dataViewport
                ) {
                    element.elems.dataViewport.removeChild(
                        element.elems.handleReorder
                    );
                }

                // if scrolling is running, stop it because we are done with
                //      the mouse part of the reorder action
                if (element.internalScroll.dragScrolling) {
                    dragScrollEnd(element);
                }

                // save drop index to a variable for convenience
                intDropIndex = (
                    element.internalReorder.dropLocation
                );

                // we need to know what columns we are moving to the
                //      drop index
                arrOrderCols = (
                    element.internalReorder.currentColumns
                );

                // if the user clicks instead of dragging, we'll select the
                //      column
                if (!element.internalReorder.reorderStarted) {
                    element.internalSelection.ranges = [
                        {
                            "start": {
                                // reorder functionality assumes the presence of
                                //      headers
                                "row": "header",
                                "column": element.internalReorder.originColumn
                            },
                            "end": {
                                // reorder functionality assumes the presence of
                                //      headers
                                "row": "header",
                                "column": element.internalReorder.originColumn
                            },
                            "negator": false
                        }
                    ];
                    renderSelection(element);
                }

                //console.log(
                //    'should we reorder?',
                //    element.internalReorder.reorderStarted,
                //    intDropIndex,
                //    arrOrderCols,
                //    arrOrderCols.length,
                //    element.internalDisplay.columnWidths.length
                //);
                if (
                    // if a drag occurred
                    element.internalReorder.reorderStarted &&
                    // and the drop index is not null, undefined or NaN
                    intDropIndex !== null &&
                    intDropIndex !== undefined &&
                    !isNaN(intDropIndex) &&
                    // and there are columns to order
                    arrOrderCols.length > 0 &&
                    // and the drop index is not past the max
                    intDropIndex <= (
                        element.internalDisplay.columnWidths.length
                    ) &&
                    // and the drop index is not at any of the indexes
                    //      the order columns are located at
                    arrOrderCols.indexOf(intDropIndex) === -1 &&
                    // and the drop index is not at the right side of
                    //      the last column in the order column list
                    arrOrderCols.indexOf(intDropIndex - 1) === -1
                ) {
                    // gotta reorder the templates, widths, and everything
                    //      else that we store about display columns

                    // here's the list of items to sort:
                    //      element.internalTemplates
                    //          header               <- element template
                    //          record               <- element template
                    //          insertRecord         <- element template
                    //      element.internalDisplay
                    //          columnPlainTextNames <- array
                    //          dataColumnName       <- array
                    //          columnWidths         <- array
                    //          defaultColumnWidths  <- array
                    //      element.internalClip
                    //          headerList           <- array
                    //          columnList           <- array


                    // we need to reorder the templates, in order to do
                    //      this we'll need access to their elements. the
                    //      templates are stored as strings and so we must
                    //      create template elements to put the content in
                    // put the template HTML into the template elements so
                    //      that we have access to the elements

                    if (element.internalTemplates.header) {
                        headerTemplate = document.createElement('template');
                        headerTemplate.innerHTML = (
                            element.internalTemplates.header
                        );
                        arrOldHeaderTemplate = (
                            xtag.query(headerTemplate.content, 'gs-cell')
                        );
                    }

                    if (element.internalTemplates.originalRecord) {
                        recordTemplate = document.createElement('template');
                        recordTemplate.innerHTML = (
                            element.internalTemplates.originalRecord
                        );
                        arrOldRecordTemplate = (
                            xtag.query(recordTemplate.content, 'gs-cell')
                        );
                    }

                    if (element.internalTemplates.insertRecord) {
                        insertTemplate = document.createElement('template');
                        insertTemplate.innerHTML = (
                            element.internalTemplates.insertRecord
                        );
                        arrOldInsertTemplate = (
                            xtag.query(insertTemplate.content, 'gs-cell')
                        );
                    }

                    // gather column arrays for easy access
                    arrOldPlainText = (
                        element.internalDisplay.columnPlainTextNames
                    );
                    arrOldDataCol = (
                        element.internalDisplay.dataColumnName
                    );
                    arrOldColWidths = (
                        element.internalDisplay.columnWidths
                    );
                    arrOldDefaultColWidths = (
                        element.internalDisplay.defaultColumnWidths
                    );

                    if (
                        element.internalClip.headerList &&
                        element.internalClip.headerList.length > 0
                    ) {
                        arrOldCopyHeaders = (
                            element.internalClip.headerList
                        );
                    }

                    if (
                        element.internalClip.columnList &&
                        element.internalClip.columnList.length > 0
                    ) {
                        arrOldCopyCol = (
                            element.internalClip.columnList
                        );
                    }

                    // create new arrays to hold the sorted lists
                    strNewHeaderTemplate = '';
                    strNewRecordTemplate = '';
                    strNewInsertTemplate = '';
                    arrNewPlainText = [];
                    arrNewDataCol = [];
                    arrNewColWidths = [];
                    arrNewDefaultColWidths = [];
                    arrNewCopyHeaders = [];
                    arrNewCopyCol = [];

                    // now begins the sort

                    // because all of the display column arrays must be the same
                    //      length, we can use one loop for all of the arrays

                    // we're going to loop through the column arrays and build
                    //      up the new, sorted arrays/strings

                    //console.log('##########################################');
                    //console.log('##########################################');
                    //console.log('##########################################');
                    //console.log('old header:    ', arrOldHeaderTemplate);
                    //console.log('old record:    ', arrOldRecordTemplate);
                    //console.log('old insert:    ', arrOldInsertTemplate);
                    //console.log('old plainTXT:  ', arrOldPlainText);
                    //console.log('old dataName:  ', arrOldDataCol);
                    //console.log('old width:     ', arrOldColWidths);
                    //console.log('old def width: ', arrOldDefaultColWidths);
                    //console.log('##########################################');
                    //console.log('##########################################');
                    //console.log('##########################################');

                    // we need a sequential number that is not tied to "i"
                    intSeqIndex = 0;

                    // we need a consumable column list so that we'll know we've
                    //      moved everything once the column list is empty
                    unmovedColumns = arrOrderCols.slice(0);

                    i = 0;
                    len = arrOldColWidths.length;
                    while (i < len) {
                        // because we are sorting by appending elements from
                        //      various points in the old array to the end of
                        //      the new arrays/strings, we need to determine
                        //      what index we are pulling from the old arrays.
                        //      this index will not be sequential like "i" will
                        //      be.
                        // there are two possibilities:
                        //      we sort the columns to the left
                        //      we sort the columns to the right
                        // in the case of a left sort:
                        //      we need to be sequential until we reach the drop
                        //      index, in which case we need to read the indexes
                        //      of the arrOrderCols array sequentially and then
                        //      we go back to where we left off until we reach
                        //      the first arrOrderCols value, in which case we
                        //      need to jump to the column after the last column
                        //      in arrOrderCols and continue until we reach the
                        //      end
                        // in the case of a right sort:
                        //      we need to be sequential until we reach the
                        //      first column in arrOrderCols, in which case we
                        //      skip to the column after the last column in
                        //      arrOrderCols and continue from there until we
                        //      reach the drop index, in which case we need to
                        //      read the indexes of the arrOrderCols array
                        //      sequentially and then we go back to where we
                        //      left off until we reach the end

                        //console.log(
                        //    '1***',
                        //    intSeqIndex,
                        //    intDropIndex,
                        //    unmovedColumns,
                        //    arrOrderCols
                        //);
                        // if we have reached the drop index and there
                        //      are order columns left
                        if (
                            intSeqIndex === intDropIndex &&
                            unmovedColumns.length > 0
                        ) {
                            //console.log('2.1*');
                            // grab and remove first order column index
                            pullIndex = unmovedColumns.shift();

                        // if we have reached the first column of
                        //      arrOrderCols
                        } else if (intSeqIndex === arrOrderCols[0]) {
                            //console.log('2.2*');
                            intSeqIndex += (arrOrderCols.length);
                            pullIndex = intSeqIndex;
                            intSeqIndex += 1;

                        // else, continue through column list
                        } else {
                            //console.log('2.3*');
                            pullIndex = intSeqIndex;
                            intSeqIndex += 1;
                        }
                        //console.log('3***', pullIndex);

                        // make the append to the new arrays/strings
                        if (arrOldHeaderTemplate) {
                            strNewHeaderTemplate += (
                                arrOldHeaderTemplate[pullIndex].outerHTML
                            );
                        }
                        if (arrOldRecordTemplate) {
                            strNewRecordTemplate += (
                                arrOldRecordTemplate[pullIndex].outerHTML
                            );
                        }
                        if (arrOldInsertTemplate) {
                            strNewInsertTemplate += (
                                arrOldInsertTemplate[pullIndex].outerHTML
                            );
                        }
                        arrNewPlainText.push(
                            arrOldPlainText[pullIndex]
                        );
                        arrNewDataCol.push(
                            arrOldDataCol[pullIndex]
                        );
                        arrNewColWidths.push(
                            arrOldColWidths[pullIndex]
                        );
                        arrNewDefaultColWidths.push(
                            arrOldDefaultColWidths[pullIndex]
                        );
                        arrNewCopyHeaders.push(
                            arrOldCopyHeaders[pullIndex]
                        );
                        arrNewCopyCol.push(
                            arrOldCopyCol[pullIndex]
                        );

                        i += 1;
                    }

                    // there's a lot of stuff that has to happen, so we need a
                    //      lot of logging
                    //console.log('##########################################');
                    //console.log('##########################################');
                    //console.log('##########################################');
                    //console.log(
                    //    'reorder columns:',
                    //    arrOrderCols
                    //);
                    //console.log(
                    //    'to location:',
                    //    intDropIndex,
                    //    '(resolved location: ' + intResolvedDropIndex + ')'
                    //);
                    //console.log('##########################################');
                    //console.log('##########################################');
                    //console.log('##########################################');
                    //console.log('old header:    ', arrOldHeaderTemplate);
                    //console.log('new header:    ', strNewHeaderTemplate);

                    //console.log('old record:    ', arrOldRecordTemplate);
                    //console.log('new record:    ', strNewRecordTemplate);

                    //console.log('old insert:    ', arrOldInsertTemplate);
                    //console.log('new insert:    ', strNewInsertTemplate);

                    //console.log('old plainTXT:  ', arrOldPlainText);
                    //console.log('new plainTXT:  ', arrNewPlainText);

                    //console.log('old dataName:  ', arrOldDataCol);
                    //console.log('new dataName:  ', arrNewDataCol);

                    //console.log('old width:     ', arrOldColWidths);
                    //console.log('new width:     ', arrNewColWidths);

                    //console.log('old def width: ', arrOldDefaultColWidths);
                    //console.log('new def width: ', arrNewDefaultColWidths);
                    //console.log('##########################################');
                    //console.log('##########################################');
                    //console.log('##########################################');

                    // we need to update the column numbers inside the templates
                    //      to account for the sort, the column numbers are
                    //      important for partial re-render
                    if (arrOldHeaderTemplate) {
                        headerTemplate.innerHTML = strNewHeaderTemplate;
                        templateCellAddColumnNumber(headerTemplate);
                        strNewHeaderTemplate = headerTemplate.innerHTML;

                        // save the new header template so that the render
                        //      function uses it
                        element.internalTemplates.header = (
                            strNewHeaderTemplate
                        );
                    }

                    if (arrOldRecordTemplate) {
                        recordTemplate.innerHTML = strNewRecordTemplate;
                        templateCellAddColumnNumber(recordTemplate);
                        strNewRecordTemplate = recordTemplate.innerHTML;

                        // let's save the original record template text so
                        //      that we can modify it in the future
                        element.internalTemplates.originalRecord = (
                            strNewRecordTemplate
                        );

                        // save the new record template so that the render
                        //      function uses it
                        // we're going run the record template through a
                        //      function to turn all of the "column"
                        //      attributes into "value" attributes with
                        //      the proper templating
                        element.internalTemplates.record = (
                            GS.templateHideSubTemplates(
                                strNewRecordTemplate,
                                false // not a TR element
                            )
                        );
                    }

                    if (arrOldInsertTemplate) {
                        insertTemplate.innerHTML = strNewInsertTemplate;
                        templateCellAddColumnNumber(insertTemplate);
                        strNewInsertTemplate = insertTemplate.innerHTML;

                        // save the new insert template so that the render
                        //      function uses it
                        element.internalTemplates.insertRecord = (
                            strNewInsertTemplate
                        );
                    }

                    // save column arrays to internal storage
                    element.internalDisplay.columnPlainTextNames = (
                        arrNewPlainText
                    );
                    element.internalDisplay.dataColumnName = (
                        arrNewDataCol
                    );
                    element.internalDisplay.columnWidths = (
                        arrNewColWidths
                    );
                    element.internalDisplay.defaultColumnWidths = (
                        arrNewDefaultColWidths
                    );
                    if (arrOldCopyHeaders) {
                        element.internalClip.headerList = (
                            arrNewCopyHeaders
                        );
                    }
                    if (arrOldCopyCol) {
                        element.internalClip.columnList = (
                            arrNewCopyCol
                        );
                    }

                    // adjust selection to new column locations
                    // ### NEED CODING ###
                    // temp, clear select
                    element.internalSelection.ranges = [];

                    // sometimes, the user has sorted some columns. in this
                    //      case, we need to refresh the table

                    // here, we construct two strings representing the old
                    //      and new sort column orders, that way we can compare
                    //      them and refresh of they are different
                    strOldSortOrder = '';
                    strNewSortOrder = '';
                    i = 0;
                    len = arrOldDataCol.length;
                    while (i < len) {
                        if (arrOldDataCol[i]) {
                            strColumn = arrOldDataCol[i];

                            index = (
                                element.internalData.columnNames.indexOf(
                                    strColumn
                                )
                            );

                            strSort = element.internalData.columnOrders[index];

                            if (index > -1 && strSort !== 'neutral') {
                                strOldSortOrder += strColumn;
                            }
                        }
                        if (arrNewDataCol[i]) {
                            strColumn = arrNewDataCol[i];

                            index = (
                                element.internalData.columnNames.indexOf(
                                    strColumn
                                )
                            );

                            strSort = element.internalData.columnOrders[index];

                            if (index > -1 && strSort !== 'neutral') {
                                strNewSortOrder += strColumn;
                            }
                        }
                        i += 1;
                    }

                    //console.log(
                    //    '"' + strOldSortOrder + '"',
                    //    '"' + strNewSortOrder + '"'
                    //);

                    if (strOldSortOrder !== strNewSortOrder) {
                        dataSELECT(element);

                    // else, we can just re-render
                    } else {
                        // re-render so that the user can see the cells in their
                        //      new order
                        element.internalDisplay.fullRenderRequired = true;
                        renderScrollDimensions(element);
                    }
                }

                // we need to let everything know that we are no longer
                //      reordering columns
                element.internalReorder.currentlyReordering = false;

                // unbind mousemove and mouseup
                document.body.removeEventListener(
                    evt.mousemove,
                    element.internalEvents.columnReorderDragMove
                );
                document.body.removeEventListener(
                    evt.mouseup,
                    element.internalEvents.columnReorderDragEnd
                );
            };

            // bind the same drag start to the record and column elements so
            //      that if either one is mousedown'ed on, the cell resize
            //      starts
            element.elems.dataViewport.addEventListener(
                'mousedown',
                element.internalEvents.columnReorderDragStart
            );
        }
    }

    // ############# UPDATE EVENTS #############
    function unbindUpdate(element) {
        element.removeEventListener(
            'change',
            element.internalEvents.cellUpdate
        );

        element.elems.dataViewport.removeEventListener(
            'click',
            element.internalEvents.updateDialog
        );
    }
    function bindUpdate(element) {
        element.internalEvents.cellUpdate = function (event) {
            var target;
            var columnElement;
            var cellElement;
            var newValue;
            var strColumn;
            var intRecord;

            // get event target and put it in a variable for clarity
            target = event.target;

            // we need the element (possibly a parent of "target") that has a
            //      "column" attribute so that we can get the name of the
            //      column that needs to be updated (if the "target" is the
            //      element with the "column" attribute: "findParentElement"
            //      will simply return the "target" as the result)
            columnElement = GS.findParentElement(target, '[column]');

            // we need the gs-cell parent so that we can verify that the change
            //      emanated from an updatable cell
            cellElement = GS.findParentElement(columnElement, 'gs-cell');

            // verify that this "columnElement" is an actual child of this
            //      gs-table and that it's an updatable cell and not an insert
            //      cell
            if (
                GS.findParentElement(columnElement, 'gs-table') === element &&
                cellElement.classList.contains('table-cell')
            ) {
                // if we found a "column" element, we'll try to find a value and
                //      then attempt an update call
                if (columnElement) {
                    // if the "columnElement" has a "value" accessor we'll use
                    //      that to get the value
                    if (
                        columnElement.value !== null &&
                        columnElement.value !== undefined
                    ) {
                        newValue = columnElement.value;

                    // else if the "target" has a "value" accessor we'll use
                    //      that to get the value
                    } else if (
                        target.value !== null &&
                        target.value !== undefined
                    ) {
                        newValue = target.value;

                    // else if the "columnElement" has a "checked" accessor
                    //      we'll use that to get the value
                    } else if (
                        columnElement.checked !== null &&
                        columnElement.checked !== undefined
                    ) {
                        newValue = columnElement.checked;

                    // else if the "target" has a "checked" accessor we'll use
                    //      that to get the value
                    } else if (
                        target.checked !== null &&
                        target.checked !== undefined
                    ) {
                        newValue = target.checked;

                    // else: throw an error for the developer
                    } else {
                        throw 'GS-TABLE Error: Found an element with a ' +
                                '"column" attribute, but could not find a ' +
                                'value. Please make sure that when a ' +
                                '"change" event is fired either the event ' +
                                'target or the "column" element has a ' +
                                '"value" or "checked" accessor.';
                    }

                    // get parent column name and record number and
                    //      store them in variables for clarity
                    strColumn = columnElement.getAttribute('column');
                    intRecord = parseInt(
                        cellElement.getAttribute('data-row-number'),
                        10
                    );

                    //console.log('strColumn:', strColumn);
                    //console.log('intRecord:', intRecord);
                    //console.log('newValue:', newValue);

                    // call the update function
                    dataUPDATE(element, 'single-cell', {
                        "data": {
                            "columnName": strColumn,
                            "recordNumber": intRecord,
                            "newValue": newValue
                        },
                        "updateConfirmed": true
                    });
                }
            }
        };

        element.addEventListener(
            'change',
            element.internalEvents.cellUpdate
        );

        // sometimes, the user needs to be able to update multiple columns
        //      at once. or they just want to see the record in a more
        //      focused way, with more room. so, we open the update dialog
        //      when an update dialog button is clicked.
        element.internalEvents.updateDialog = function (event) {
            var target = event.target;
            var arrCol;
            var intRow;
            var strRow;
            var arrRow;
            var jsnRow;
            var i;
            var len;
            var strNullString;
            var templateFunc;
            var strHTML;
            var templateElement;

            if (target.classList.contains('table-multi-update-button')) {
                // we want the null string to be configurable, so we'll read the
                //      "null-string" attribute to get the null string
                // if the "null-string" attribute is present, use the contents
                //      or coalesce to empty string
                if (element.hasAttribute('null-string')) {
                    strNullString = element.getAttribute('null-string') || '';

                // else, null string is left up to the encoding function
                } else {
                    strNullString = undefined;
                }

                // we need to know the column names
                arrCol = element.internalData.columnNames;

                // we need to get the record
                intRow = parseInt(
                    target.parentNode.getAttribute('data-row-number'),
                    10
                );

                strRow = element.internalData.records[intRow];

                // convert the record to our normal "row" and "arrRow"
                // decode values in the column array and build up the json
                arrRow = strRow.split('\t');
                jsnRow = {};
                i = 0;
                len = arrCol.length;
                while (i < len) {
                    arrRow[i] = (
                        GS.decodeFromTabDelimited(
                            arrRow[i],
                            strNullString
                        )
                    );
                    jsnRow[arrCol[i]] = arrRow[i];

                    i += 1;
                }

                //console.log('intRow:', intRow);
                //console.log('strRow:', strRow);
                //console.log('arrRow:', arrRow);
                //console.log('jsnRow:', jsnRow);

                // template the updateDialog with the record
                templateFunc = doT.template(
                    '{{ ' +
                        'var row_number = jo.index + 1;' +
                        'var qs = jo.qs;' +
                        'var row = jo.row;' +
                        'var arrRow = jo.arrRow;' +
                        'var i = jo.index;' +
                        'var len = jo.len;' +
                    '}}' +
                    element.internalTemplates.updateDialog.templateHTML
                );

                // template with JSON
                strHTML = templateFunc({
                    'qs': GS.qryToJSON(GS.getQueryString()),
                    'row': jsnRow,
                    'arrRow': arrRow,
                    'index': intRow,
                    'len': element.internalData.records.length
                });

                // because we prevent templating into other element's
                //      templates (the ones with a "src" attribute) by
                //      "hiding" (by replacing them with a random token
                //      and storing the token-template relationship)
                //      them, we have to "show" them (by replacing the
                //      token with the original template strings) at
                //      this step
                strHTML = GS.templateShowSubTemplates(
                    strHTML,
                    element.internalTemplates.updateDialog
                );

                // generate dialog
                templateElement = document.createElement('template');

                templateElement.innerHTML = ml(function () {/*
<gs-page>
    <gs-header>
        <center><h3>Update</h3></center>
    </gs-header>
    <gs-body padded>
        {{HTML}}
    </gs-body>
    <gs-footer>
        <gs-grid gutter>
            <gs-block>
                <gs-button dialogclose>Cancel</gs-button>
            </gs-block>
            <gs-block>
                <gs-button id="gs-table-update-record" bg-primary>
                    Save
                </gs-button>
            </gs-block>
        </gs-grid>
    </gs-footer>
</gs-page>
                */}).replace(/\{\{HTML\}\}/gi, strHTML);

                // open the dialog
                GS.openDialog(templateElement, function () {
                    var dialog = this;
                    var saveButtonClick;
                    var afterUpdateFunc;

                    saveButtonClick = function () {
                        var arrElement;
                        var elem_i;
                        var elem_len;
                        var elem;
                        var arrColumns;
                        var arrValues;
                        var parentSRCElement;
                        var strOldValue;
                        var strNewValue;

                        // when the save button is clicked, we need to check
                        //      every field to find out what changes have been
                        //      made
                        arrElement = xtag.query(dialog, '[column]');
                        arrColumns = [];
                        arrValues = [];
                        elem_i = 0;
                        elem_len = arrElement.length;
                        while (elem_i < elem_len) {
                            elem = arrElement[elem_i];

                            parentSRCElement = GS.findParentElement(
                                elem,
                                '[src]'
                            );

                            if (
                                !parentSRCElement ||
                                parentSRCElement.nodeName === 'HTML' ||
                                parentSRCElement.nodeName === 'BODY'
                            ) {
                                strOldValue = jsnRow[
                                    elem.getAttribute('column')
                                ];
                                strNewValue = elem.value;

                                if (strNewValue !== strOldValue) {
                                    arrColumns.push(
                                        elem.getAttribute('column')
                                    );
                                    arrValues.push(
                                        GS.encodeForTabDelimited(
                                            strNewValue,
                                            strNullString
                                        )
                                    );
                                }
                            }

                            elem_i += 1;
                        }

                        if (arrColumns.length > 0) {
                            afterUpdateFunc = function () {
                                GS.closeDialog(dialog, 'Ok');
                                element.removeEventListener(
                                    'after_update',
                                    afterUpdateFunc
                                );
                            };

                            element.addEventListener(
                                'after_update',
                                afterUpdateFunc
                            );

                            dataUPDATE(element, 'cell-range', {
                                "data": {
                                    "columns": arrColumns,
                                    "records": [intRow],
                                    "values": [arrValues.join('\t')]
                                },
                                "updateConfirmed": false
                            });
                        }
                    };

                    document.getElementById('gs-table-update-record')
                            .addEventListener('click', saveButtonClick);
                });
            }
        };

        element.elems.dataViewport.addEventListener(
            'click',
            element.internalEvents.updateDialog
        );
    }

    // ############# INSERT EVENTS #############
    function unbindInsert(element) {
        element.elems.dataViewport.removeEventListener(
            'keydown',
            element.internalEvents.insertRecordReturn
        );
        element.elems.dataViewport.removeEventListener(
            'change',
            element.internalEvents.insertRecordValueRetain
        );
        element.elems.dataViewport.removeEventListener(
            'keyup',
            element.internalEvents.insertRecordValueRetain
        );
    }
    function bindInsert(element) {
        // we only want to insert a new record if the user presses "return"
        element.internalEvents.insertRecordReturn = function (event) {
            var parentCell = GS.findParentTag(event.target, 'gs-cell');
            var keyCode = (event.keyCode || event.which);

            // we only want return to insert if the return occured inside
            //      an insert cell
            if (
                parentCell.classList.contains('table-insert') &&
                keyCode === 13
            ) {
                dataINSERT(element, 'single-record', {
                    "data": {
                        "values": (
                            element
                                .internalData
                                .insertRecord
                        ),
                        "columns": (
                            element
                                .internalData
                                .insertRecordRetainedColumns
                        ),
                        "addin": getInsertAddin(element)
                    },
                    "insertConfirmed": true
                });

                // we clear the retained values and columns here because
                //      if the user decides to override the insert with
                //      their own thing, we don't want to still be showing
                //      the old values.
                element.internalData.insertRecord = {};
                element.internalData.insertRecordRetainedColumns = [];

                // re-render so that the insert controls clear out in the DOM
                element.internalDisplay.fullRenderRequired = true;
                renderLocation(element);
                //element.goToLine('last');
            }
        };

        element.elems.dataViewport.addEventListener(
            'keydown',
            element.internalEvents.insertRecordReturn
        );

        // we want to be able to fill in some insert cells, scroll away,
        //      scroll back, and not lose the values that have been typed in
        // this event code saves the value of the target internally so that
        //      when we re-template the insert record on scroll, we can get
        //      the values back
        element.internalEvents.insertRecordValueRetain = function (event) {
            var target = event.target;
            var parentCell = GS.findParentTag(target, 'gs-cell');
            var parentColumn = GS.findParentElement(target, '[column]');
            var strColumn = parentColumn.getAttribute('column');
            var strValue = target.value;

            // we only want to retain the values of insert cells, so only do so
            //      if the parent cell has the insert cell class and has a
            //      [column=""] defined
            if (
                parentCell.classList.contains('table-insert') &&
                strColumn
            ) {
                if (strValue) {
                    // retain the value in the internalData
                    element.internalData.insertRecord[strColumn] = strValue;

                    // some insert fields may be changed twice before an insert,
                    //      so only add the column name to the changed columns
                    //      list if that column name isn't already in the list
                    if (
                        element
                            .internalData
                            .insertRecordRetainedColumns
                            .indexOf(strColumn) === -1
                    ) {
                        element
                            .internalData
                            .insertRecordRetainedColumns
                            .push(strColumn);
                    }
                // if the user clears out a field that was previously
                //      retained, we want to remove that value from the
                //      retained list
                } else if (
                    !strValue &&
                    element
                        .internalData
                        .insertRecordRetainedColumns
                        .indexOf(strColumn) > -1
                ) {
                    element
                        .internalData
                        .insertRecord[strColumn] = undefined;
                    element
                        .internalData
                        .insertRecordRetainedColumns
                        .splice(
                            element
                                .internalData
                                .insertRecordRetainedColumns
                                .indexOf(strColumn)
                        );
                }
            }
        };

        element.elems.dataViewport.addEventListener(
            'change',
            element.internalEvents.insertRecordValueRetain
        );
        element.elems.dataViewport.addEventListener(
            'keyup',
            element.internalEvents.insertRecordValueRetain
        );
    }

    // ############# HUD EVENTS #############
    function unbindHUD(element) {

    }
    function bindHUD(element) {

    }

    // ############# KEY EVENTS #############
    function unbindKey(element) {
        element.removeEventListener(
            'keydown',
            element.internalEvents.keyDown
        );
    }
    function bindKey(element) {
        element.internalEvents.keyDown = function (event) {
            var keyCode = (event.keyCode || event.which);
            var bolCMDorCTRL = (event.ctrlKey || event.metaKey);
            var bolShift = (event.shiftKey);
            var active = document.activeElement;
            var activeValue = document.activeElement.value;

            var jsnRange;
            var intOldRecord;
            var intOldColumn;
            var intNewRecord;
            var intNewColumn;

            var intMaxColumn;
            var intMaxRecord;
            var intMinColumn;
            var intMinRecord;

            var jsnCursorPos;
            var intCursorPos;
            var bolFullSelection;
            var bolCursorAtFirst;
            var bolCursorAtTop;
            var bolCursorAtLast;
            var bolCursorAtBottom;

            var bolMaintainSelection;
            var bolMoveSelectedToTop;
            var intSpaceToTraverse;
            var intHeight;
            var i;
            var len;

            var beforeEvent;
            var selectionCopy;

            // if the keydown took place inside the hidden focus control
            if (active === element.elems.hiddenFocusControl) {
                if (
                    keyCode === 8 || // backspace
                    keyCode === 46   // forward delete
                ) {
                    deleteSelectedRecords(element);

                // if you hit return in the hidden focus control, select all
                //      text inside the control that is the origin field of the
                //      latest selection
                } else if (keyCode === 13) {
                    focusIntoSelectedCell(element);

                // if you hit CMD/CTRL-A, select all
                } else if (bolCMDorCTRL && keyCode === 65) {
                    // we need functions to give the top-right and bottom-left
                    //      corners, this use case would be simplified and would
                    //      work no matter how musch data or header/selector and
                    //      would help fix a couple other unreliable areas in
                    //      this element
                    // ### NEED CODING ###
                    len = element.internalData.records.length;
                    element.internalSelection.ranges = [
                        {
                            "start": {
                                "row": (
                                    element.internalDisplay.headerVisible
                                        ? 'header'
                                        : 0
                                ),
                                "column": (
                                    element.internalDisplay
                                        .recordSelectorVisible
                                            ? 'selector'
                                            : 0
                                )
                            },
                            "end": {
                                "row": (
                                    len > 0
                                        ? (len - 1)
                                        : 'header'
                                ),
                                "column": (
                                    element.internalDisplay
                                        .columnWidths.length - 1
                                )
                            },
                            "negator": false
                        }
                    ];
                    renderSelection(element);
                }
            }

            // these keys will be listened for if the focus is in a control or
            //      in the hidden focus control. all of these keys will be
            //      overridden no matter the target. if you have a control that
            //      uses one of these keys or key combos and you don't want the
            //      gs-table to intercept it: stop propagation and/or prevent
            //      default when you hear the event inside your element
            if (
                (
                    keyCode === 38 ||
                    keyCode === 39 ||
                    keyCode === 40 ||
                    keyCode === 37 ||
                    keyCode === 33 ||
                    keyCode === 34 ||
                    keyCode === 36 ||
                    keyCode === 35 ||
                    keyCode === 9
                ) &&
                !event.defaultPrevented
            ) {
                // if the focused element is an input or textarea, get the text
                //      selection so that we can calculate if an arrow key
                //      escapes the field
                if (
                    (
                        active.nodeName === 'INPUT' ||
                        active.nodeName === 'TEXTAREA'
                    ) &&
                    active !== element.elems.hiddenFocusControl
                ) {
                    jsnCursorPos = GS.getInputSelection(active);

                // else, assume full selection. this can happen if the focused
                //      field is (for example) a checkbox
                } else {
                    jsnCursorPos = {
                        'start': 0,
                        'end': activeValue.length
                    };
                }

                // shortcut variable for wheather or not all the text is
                //      selected
                bolFullSelection = (
                    jsnCursorPos.start === 0 &&
                    jsnCursorPos.end === activeValue.length
                );

                // if we don't have a full selection and the selection is one
                //      character position, create some shortcut variables so
                //      that we know if the cursor is at a particular extreme.
                if (
                    jsnCursorPos &&
                    !bolFullSelection &&
                    jsnCursorPos.start === jsnCursorPos.end
                ) {
                    intCursorPos = jsnCursorPos.start;
                    bolCursorAtFirst = (
                        intCursorPos === 0
                    );
                    bolCursorAtTop = (
                        (
                            intCursorPos < (
                                activeValue.indexOf('\n') === -1
                                    ? activeValue.length + 1
                                    : activeValue.indexOf('\n') + 1
                            )
                        ) ||
                        (
                            intCursorPos === 0
                        )
                    );
                    bolCursorAtLast = (
                        intCursorPos === activeValue.length
                    );
                    bolCursorAtBottom = (
                        intCursorPos > activeValue.lastIndexOf('\n')
                    );
                }

                // save the latest selection range's endpoint
                jsnRange = element.internalSelection.ranges[
                    element.internalSelection.ranges.length - 1
                ];

                // if there is a selection range, save it's endpoint
                if (jsnRange) {
                    intOldRecord = jsnRange.end.row;
                    intOldColumn = jsnRange.end.column;

                    if (intOldRecord === 'header') {
                        intOldRecord = -1;
                    } else if (intOldRecord === 'insert') {
                        intOldRecord = element.internalData.records.length;
                    }

                    if (intOldColumn === 'selector') {
                        intOldColumn = -1;
                    }

                // else, assume the endpoint is the first cell
                // this occurs when you tab into a gs-table that has no
                //      focusable fields and press a navigation key
                } else {
                    intOldRecord = 0;
                    intOldColumn = 0;
                }

                // determine max column and max record and save as a shortcut
                intMaxColumn = (
                    // commented because the record selection is -1, not 0,
                    //      this means that the max column stays the same
                    //      regardless of record selectors or not.
                    //element.internalDisplay.recordSelectorVisible
                    //    ? element.internalDisplay.columnWidths.length
                    //    :
                    element.internalDisplay.columnWidths.length - 1
                );
                intMaxRecord = (
                    element.internalDisplay.insertRecordVisible
                        ? element.internalData.records.length
                        : element.internalData.records.length - 1
                );

                // determine min column and min record and save as a shortcut
                intMinColumn = (
                    element.internalDisplay.recordSelectorVisible
                        ? -1
                        : 0
                );
                intMinRecord = (
                    element.internalDisplay.headerVisible
                        ? -1
                        : 0
                );

                // here we waterfall to determine the new selection row and
                //      column. you can't arrow from records to insert record
                //      except under a special case (no shift, no command,
                //      arrow down from last record)
                // -1 in intNewRecord means header record
                // -1 in intNewColumn means record selector column


                // "home" -- first cell of record
                if (keyCode === 36) {
                    // after moving the selection into a single cell, the
                    //      text selection is overridden because of the
                    //      keyup event. so, here we preventDefault and
                    //      stopPropagation to prevent the keyup from
                    //      occuring.
                    event.preventDefault();
                    event.stopPropagation();

                    // go to first cell
                    intNewRecord = intOldRecord;
                    intNewColumn = intMinColumn;

                // "end" -- last cell of record
                } else if (keyCode === 35) {
                    // after moving the selection into a single cell, the
                    //      text selection is overridden because of the
                    //      keyup event. so, here we preventDefault and
                    //      stopPropagation to prevent the keyup from
                    //      occuring.
                    event.preventDefault();
                    event.stopPropagation();

                    intNewRecord = intOldRecord;
                    intNewColumn = intMaxColumn;

                // "up arrow"
                } else if (keyCode === 38) {
                    if (bolFullSelection || bolCursorAtTop) {
                        // after moving the selection into a single cell, the
                        //      text selection is overridden because of the
                        //      keyup event. so, here we preventDefault and
                        //      stopPropagation to prevent the keyup from
                        //      occuring.
                        event.preventDefault();
                        event.stopPropagation();

                        // if CMD or CTRL is held down: move to extreme
                        if (bolCMDorCTRL) {
                            intNewRecord = intMinRecord;
                            intNewColumn = intOldColumn;

                        // else, move to next immediate cell
                        } else if (intOldRecord > intMinRecord) {
                            intNewRecord = (intOldRecord - 1);
                            intNewColumn = intOldColumn;
                        }
                    }

                // "right arrow"
                } else if (keyCode === 39) {
                    if (bolFullSelection || bolCursorAtLast) {
                        // after moving the selection into a single cell, the
                        //      text selection is overridden because of the
                        //      keyup event. so, here we preventDefault and
                        //      stopPropagation to prevent the keyup from
                        //      occuring.
                        event.preventDefault();
                        event.stopPropagation();

                        // if CMD or CTRL is held down: move to extreme
                        if (bolCMDorCTRL) {
                            intNewRecord = intOldRecord;
                            intNewColumn = intMaxColumn;

                        // else if we are at the right-most cell of the record
                        //      and we are not at the bottom-most record:
                        //      move to next record, first cell
                        } else if (
                            intOldColumn === intMaxColumn &&
                            intOldRecord < intMaxRecord
                        ) {
                            intNewRecord = (intOldRecord + 1);
                            intNewColumn = intMinColumn;

                        // else, move to next immediate cell
                        } else if (intOldColumn < intMaxColumn) {
                            intNewRecord = intOldRecord;
                            intNewColumn = (intOldColumn + 1);
                        }
                    }

                // "down arrow"
                } else if (keyCode === 40) {
                    if (bolFullSelection || bolCursorAtBottom) {
                        // after moving the selection into a single cell, the
                        //      text selection is overridden because of the
                        //      keyup event. so, here we preventDefault and
                        //      stopPropagation to prevent the keyup from
                        //      occuring.
                        event.preventDefault();
                        event.stopPropagation();

                        // if CMD or CTRL is held down: move to extreme
                        if (bolCMDorCTRL) {
                            intNewRecord = intMaxRecord;
                            intNewColumn = intOldColumn;

                        // else, move to next immediate cell
                        } else if (intOldRecord < intMaxRecord) {
                            intNewRecord = (intOldRecord + 1);
                            intNewColumn = intOldColumn;
                        }
                    }

                // "left arrow"
                } else if (keyCode === 37) {
                    if (bolFullSelection || bolCursorAtFirst) {
                        // after moving the selection into a single cell, the
                        //      text selection is overridden because of the
                        //      keyup event. so, here we preventDefault and
                        //      stopPropagation to prevent the keyup from
                        //      occuring.
                        event.preventDefault();
                        event.stopPropagation();

                        // if CMD or CTRL is held down: move to extreme
                        if (bolCMDorCTRL) {
                            intNewRecord = intOldRecord;
                            intNewColumn = intMinColumn;

                        // else if we are at the left-most cell of the record
                        //      and we are not at the top-most record:
                        //      move to previous record, last cell
                        } else if (
                            intOldColumn === intMinColumn &&
                            intOldRecord > intMinRecord
                        ) {
                            intNewRecord = (intOldRecord - 1);
                            intNewColumn = intMaxColumn;

                        // else, move to next immediate cell
                        } else if (intOldColumn > intMinColumn) {
                            intNewRecord = intOldRecord;
                            intNewColumn = (intOldColumn - 1);
                        }
                    }

                // "page up"
                } else if (keyCode === 33) {
                    // after moving the selection into a single cell, the
                    //      text selection is overridden because of the
                    //      keyup event. so, here we preventDefault and
                    //      stopPropagation to prevent the keyup from
                    //      occuring.
                    event.preventDefault();
                    event.stopPropagation();

                    // move to a cell approx one page up
                    intSpaceToTraverse = (
                        element.elems.dataViewport.clientHeight - (
                            element.internalScrollOffsets.top +
                            element.internalScrollOffsets.bottom
                        )
                    );
                    i = (
                        element.internalDisplay.currentRange.fromRecord
                        //intOldRecord
                    );
                    while (i >= -1) {
                        intHeight = (
                            element.internalDisplay.recordHeights[i]
                        );

                        intSpaceToTraverse -= intHeight;

                        // if we've run into the header (of the first
                        //      record), select the highest we can
                        if (i === intMinRecord) {
                            intNewRecord = i;
                            break;
                        }
                        // if we've found a record a page up, select the
                        //      record that is partially hidden by scroll
                        if (intSpaceToTraverse < 0) {
                            intNewRecord = i;
                            break;
                        }
                        i -= 1;
                    }

                    // if we found a record: choose a column
                    if (intNewRecord !== undefined) {
                        // if shift is held down, maintain the old column
                        if (bolShift) {
                            intNewColumn = intOldColumn;

                        // else, select the whole record by choosing the
                        //      record selector (or select first cell)
                        } else {
                            intNewColumn = intMinColumn;
                        }
                    }

                    // we want page up/down to scroll the selected record to the
                    //      top of the viewport, so here we set a boolean
                    //      variable to tell the code below (which is where the
                    //      selection and scrolling happens) to scroll the
                    //      selected cell to the top
                    bolMoveSelectedToTop = true;

                // "page down"
                } else if (keyCode === 34) {
                    // after moving the selection into a single cell, the
                    //      text selection is overridden because of the
                    //      keyup event. so, here we preventDefault and
                    //      stopPropagation to prevent the keyup from
                    //      occuring.
                    event.preventDefault();
                    event.stopPropagation();

                    // move to a cell approx one page down
                    intSpaceToTraverse = (
                        element.elems.dataViewport.clientHeight - (
                            element.internalScrollOffsets.top +
                            element.internalScrollOffsets.bottom
                        )
                    );

                    i = (
                        element.internalDisplay.currentRange.fromRecord
                        //intOldRecord
                    );
                    len = (intMaxRecord + 1);
                    while (i < len) {
                        if (i === -1) {
                            intHeight = (
                                element.internalDisplay.headerHeight
                            );
                        } else {
                            intHeight = (
                                element.internalDisplay.recordHeights[i]
                            );
                        }

                        intSpaceToTraverse -= intHeight;

                        // if we've reached the bottom, select the last record
                        if (i === intMaxRecord) {
                            intNewRecord = i;
                            break;
                        }
                        // if we've found a record a page down, select the
                        //      record that is partially hidden by scroll
                        if (intSpaceToTraverse < 0) {
                            intNewRecord = i - 1;
                            break;
                        }
                        i += 1;
                    }

                    // if we found a record: choose a column
                    if (intNewRecord !== undefined) {
                        // if shift is held down, maintain the old column
                        if (bolShift) {
                            intNewColumn = intOldColumn;

                        // else, select the whole record by choosing the
                        //      record selector
                        } else {
                            intNewColumn = intMinColumn;
                        }
                    }

                    // we want page up/down to scroll the selected record to the
                    //      top of the viewport, so here we set a boolean
                    //      variable to tell the code below (which is where the
                    //      selection and scrolling happens) to scroll the
                    //      selected cell to the top
                    bolMoveSelectedToTop = true;

                // "tab" next cell in reading order
                } else if (keyCode === 9) {
                    // we need to be able to handle shift-tab because some users
                    //      know how to use shift-tab and would expect it from
                    //      any key-navigable interface
                    if (bolShift) {
                        // we need to be able to tab out of the gs-table if the
                        //      user presses tab while the first cell is the
                        //      selection anchor that we are moving from
                        // So, if the anchor point is at the first cell: do
                        //      nothing, this means that the event won't be
                        //      prevented and therefore will do what the browser
                        //      naturally want's it to do
                        // else, we want to move the selection to the previous
                        //      field in reading order
                        if (
                            intOldRecord !== intMinColumn ||
                            intOldColumn !== intMinRecord
                        ) {
                            // after moving the selection into a single cell,
                            //      the text selection is overridden because of
                            //      the keyup event. so, here we preventDefault
                            //      and stopPropagation to prevent the keyup
                            //      from occuring.
                            event.preventDefault();
                            event.stopPropagation();

                            // if we are at the min column:
                            //      go to the max column and the previous record
                            if (intOldColumn === intMinColumn) {
                                intNewRecord = (intOldRecord - 1);
                                intNewColumn = intMaxColumn;

                            // else, go to previous column
                            } else {
                                intNewRecord = intOldRecord;
                                intNewColumn = intOldColumn - 1;
                            }
                        }

                    // we need to handle standard tab as well
                    } else {
                        // we need to be able to tab out of the gs-table if the
                        //      user presses tab while the last cell is the
                        //      selection anchor that we are moving from
                        // So, if the anchor point is at the last cell: do
                        //      nothing, this means that the event won't be
                        //      prevented and therefore will do what the browser
                        //      naturally want's it to do
                        // else, we want to move the selection to the previous
                        //      field in reading order
                        if (
                            intOldRecord !== intMaxColumn ||
                            intOldColumn !== intMaxRecord
                        ) {
                            // after moving the selection into a single cell,
                            //      the text selection is overridden because of
                            //      the keyup event. so, here we preventDefault
                            //      and stopPropagation to prevent the keyup
                            //      from occuring.
                            event.preventDefault();
                            event.stopPropagation();

                            // if we are at the max column:
                            //      go to the min column and the next record
                            if (intOldColumn === intMaxColumn) {
                                intNewRecord = (intOldRecord + 1);
                                intNewColumn = intMinColumn;

                            // else, go to next column
                            } else {
                                intNewRecord = intOldRecord;
                                intNewColumn = intOldColumn + 1;
                            }
                        }
                    }
                }

                // if we found a place to put the selection anchor point
                if (intNewRecord !== undefined && intNewColumn !== undefined) {
                    //console.log('intOldRecord:', intOldRecord);
                    //console.log('intOldColumn:', intOldColumn);
                    //console.log('intNewRecord:', intNewRecord);
                    //console.log('intNewColumn:', intNewColumn);
                    //console.log('intMinRecord:', intMinRecord);
                    //console.log('intMinColumn:', intMinColumn);
                    //console.log('intMaxRecord:', intMaxRecord);
                    //console.log('intMaxColumn:', intMaxColumn);

                    // we don't want to stay focused on the original control
                    focusHiddenControl(element);

                    // we're going to do multiple if statements that test if the
                    //      previous selections will be maintained, so here
                    //      we'll save a shortcut variable
                    bolMaintainSelection = (
                        // shift is down
                        bolShift &&
                        // there is an old selection
                        jsnRange &&
                        // the key wasn't tab
                        keyCode !== 9
                    );

                    // if the user cancels the selection, we need to be able
                    //      to go back to the previous selection. so, here
                    //      we save a backup
                    selectionCopy = getSelectionCopy(element);

                    // when the before_selection event is triggered, we want the
                    //      gs-table to have the current selection available.
                    //      so we'll make the changes to the selection and then
                    //      trigger before_selection.

                    // convert the new record and column to special values
                    //      (if needed)
                    var intHeaderIndex;
                    var intSelectorIndex;
                    var intInsertIndex;
                    var newRecord;
                    var newColumn;

                    intHeaderIndex = -1;
                    intSelectorIndex = -1;
                    intInsertIndex = (element.internalData.records.length);

                    if (intNewRecord === intHeaderIndex) {
                        newRecord = 'header';
                    } else if (intNewRecord === intInsertIndex) {
                        newRecord = 'insert';
                    } else {
                        newRecord = intNewRecord;
                    }

                    //console.log(
                    //    newRecord,
                    //    intNewRecord,
                    //    intHeaderIndex,
                    //    intInsertIndex
                    //);

                    if (intNewColumn === intSelectorIndex) {
                        newColumn = 'selector';
                    } else {
                        newColumn = intNewColumn;
                    }

                    // if we're going to maintain selections
                    if (bolMaintainSelection) {
                        // maintain old selections and modify the most
                        //      recent one's endpoint
                        jsnRange.end.row = newRecord;
                        jsnRange.end.column = newColumn;

                    // else, set selection to only that cell
                    } else {
                        jsnRange = {
                            "start": {
                                "row": newRecord,
                                "column": newColumn
                            },
                            "end": {
                                "row": newRecord,
                                "column": newColumn
                            },
                            "negator": false
                        };
                        element.internalSelection.ranges = [jsnRange];
                    }

                    // trigger a "before_selection" event so that the page has a
                    //      chance to cancel the selection
                    beforeEvent = GS.triggerEvent(element, 'before_selection');

                    // if the user prevents the default on the
                    //      "before_selection" event, revert selection ranges
                    //      to what they were before the latest selection
                    //      started (and revert wheather or not the selection
                    //      is in the insert record)
                    if (beforeEvent.defaultPrevented) {
                        element.internalSelection.ranges = (
                            selectionCopy.ranges
                        );
                        return;
                    }

                    // if the before_selection event wasn't cancelled, we run
                    //      this code below

                    // sometimes, the focus is lost. so, focus the
                    //      hiddenFocusControl so that we can always listen for
                    //      keypresses
                    focusHiddenControl(element);

                    // sometimes we want to move the selected endpoint to the
                    //      top of the viewport, if that's what we want, send
                    //      the 'top' mode into the scrollSelectionIntoView
                    //      function
                    if (bolMoveSelectedToTop) {
                        // scroll selection into view and re-render
                        scrollSelectionIntoView(element, 'top');

                    } else {
                        // scroll selection into view and re-render
                        scrollSelectionIntoView(element);
                    }

                    // if we're not going to maintain old selections (which
                    //      also means that only one cell will be selected)
                    //      and we're not selecting a header or record selector
                    if (
                        !bolMaintainSelection &&
                        intNewRecord > -1 &&
                        intNewColumn > -1
                    ) {
                        // we want the user to be able to start typing and fill
                        //      the cell, so focus into the cell and select all
                        //      text if possible
                        focusIntoSelectedCell(element);
                    }

                    // if the "before_selection" event is not prevented, we
                    //      trigger "after_selection" so that the page can run
                    //      code after a selection has been made
                    if (beforeEvent.defaultPrevented) {
                        GS.triggerEvent(element, 'after_selection');
                    }
                }
            }
        };

        element.addEventListener(
            'keydown',
            element.internalEvents.keyDown
        );
    }

    // ############# COPY EVENTS #############
    function unbindCopy(element) {
        element.removeEventListener(
            'copy',
            element.internalEvents.copySelection
        );
    }
    function bindCopy(element) {
        element.internalEvents.copySelection = function (event) {
            var jsnCopyString;
            var focusedElement;

            // saving the currently focused element for easy/quick access
            focusedElement = document.activeElement;

            // if the focus is on the hidden focus control of if the text
            //      selection of the currently focused element is not
            //      selecting multiple characters
            if (
                focusedElement.classList.contains('hidden-focus-control') ||
                focusedElement.selectionStart === focusedElement.selectionEnd
            ) {
                console.time('copy');

                // because copying a large amount of data takes time, add a
                //      loader to let the user know we're copying, just in case
                addLoader(element, 'copy-loader', 'Copying Data...');

                // focus the hidden focus control and select all of it's text so
                //      that Firefox will allow us to override the clipboard
                focusedElement = element.elems.hiddenFocusControl;
                focusedElement.focus();

                GS.setInputSelection(
                    focusedElement,
                    0,
                    focusedElement.value.length
                );

                // we want to override the text and HTML mime type clipboards,
                //      so we get the copy text for both types
                jsnCopyString = getCopyStrings(element);
                // override clipboard (prevent event default if we are
                //      successful)
                if (handleClipboardData(event, jsnCopyString.text, 'text')) {
                    event.preventDefault(event);
                }
                if (handleClipboardData(event, jsnCopyString.html, 'html')) {
                    event.preventDefault(event);
                }

                // remove copying loader
                removeLoader(element, 'copy-loader', 'Data Copied');

                console.timeEnd('copy');
            }
        };

        element.addEventListener(
            'copy',
            element.internalEvents.copySelection
        );
    }

    // ############# PASTE EVENTS #############
    function unbindPaste(element) {
        element.removeEventListener(
            'paste',
            element.internalEvents.pasteSelection
        );
    }
    function bindPaste(element) {
        element.internalEvents.pasteSelection = function (event) {
            // we dont want to interfere with pasting inside a cell, so only
            //      use this paste event if the focused element is the
            //      hiddenFocusControl
            if (document.activeElement === element.elems.hiddenFocusControl) {
                // prevent default so that the hiddenFocusControl's value
                //      doesn't get overridden by the paste
                event.preventDefault();
                usePasteEvent(element, event);
            }
        };

        element.addEventListener(
            'paste',
            element.internalEvents.pasteSelection
        );
    }

    // ############# CUT EVENTS #############
    function unbindCut(element) {
        element.removeEventListener(
            'cut',
            element.internalEvents.cutSelection
        );
    }
    function bindCut(element) {
        element.internalEvents.cutSelection = function () {
            // we dont want to interfere with cutting inside a cell, so only
            //      use this cut event if the focused element is the
            //      hiddenFocusControl
            if (document.activeElement === element.elems.hiddenFocusControl) {
                // prevent default so that the hiddenFocusControl's value
                //      doesn't get overridden by the paste
                event.preventDefault();

                // let the user know that we don't support cut
                addLoader(element, 'cut-warn', 'Cut is not supported');
                removeLoader(element, 'cut-warn', 'Cut is not supported');
            }
        };

        element.addEventListener(
            'cut',
            element.internalEvents.cutSelection
        );
    }

    // ############# CONTEXTMENU EVENTS #############
    function unbindContextMenu(element) {
        element.elems.dataViewport.removeEventListener(
            'contextmenu',
            element.internalEvents.columnContextMenu
        );
    }
    function bindContextMenu(element) {
        element.internalEvents.columnContextMenu = function (event) {
            var target = event.target;
            var parentCell = GS.findParentTag(target, 'gs-cell');

            var templateElement;
            var strCellType;
            var bolRange;
            var arrDataColumns;
            var arrSelectedColumns;
            var bolFilterUnique;
            var bolFilterSelection;
            var bolColumnWidths;
            var bolHideAndShow;
            var bolSort;

            var intRecord;
            var intColumn;
            var strDataValue;
            var strControlValue;
            var strColumn;
            var columnElement;
            var focusElement;
            var jsnSelection;
            var strSelection;

            var i;
            var len;
            //var index;
            var strHTML;

            // there are multiple different contextmenus
            //      one for header cells
            //          column hide/show
            //          column sort
            //          unique list filter
            //      one for data cells
            //          column hide/show
            //          column sort
            //          selection filter
            //      one for calculated cells
            //          column hide/show
            //      one for insert cells
            //          column hide/show
            //          column sort
            //
            // overall, there are a few modules that we need to toggle
            //      unique list filter
            //      selection filter
            //      column hide/show
            //      column sort
            //
            // if your selection spans between the header and data:
            //      column hide/show
            //      column sort
            //
            // if your selection is a range containing data cells
            //      column hide/show
            //      column sort
            //
            // if your selection is a range with only calculated cells
            //      column hide/show

            // get parent gs-cell element
            parentCell = target;
            if (target.nodeName !== 'GS-CELL') {
                parentCell = GS.findParentTag(target, 'gs-cell');
            }

            // if the right-clicked cell is a data cell, header
            //      cell or insert cell
            if (
                parentCell &&
                parentCell.nodeName === 'GS-CELL' &&
                (
                    parentCell.classList.contains('table-cell') ||
                    parentCell.classList.contains('table-header') ||
                    parentCell.classList.contains('table-insert')
                )
            ) {
                // we need to find out what type of cell we right-clicked on
                if (parentCell.classList.contains('table-cell')) {
                    strCellType = 'data';

                } else if (parentCell.classList.contains('table-header')) {
                    strCellType = 'header';

                } else if (parentCell.classList.contains('table-insert')) {
                    strCellType = 'insert';
                }

                // we need to know the selected column list
                arrSelectedColumns = (
                    element.internalSelection.columns
                );
                if (arrSelectedColumns[0] === 'selector') {
                    arrSelectedColumns.shift();
                }

                // we need to know if more than one cell is selected
                bolRange = (
                    arrSelectedColumns.length > 1 ||
                    element.internalSelection.rows.length > 1
                );

                // we need to know the data columns within the selected range
                arrDataColumns = getSelectedDataColumns(element);

                // if we have one data cell selected and it is associated
                //      with a data column, we need to know the value of the
                //      cell
                if (
                    strCellType === 'data' &&
                    !bolRange &&
                    arrDataColumns.length === 1
                ) {
                    // we need to know the record number
                    intRecord = parseInt(
                        parentCell.getAttribute('data-row-number'),
                        10
                    );

                    // we need to know what record we're working with
                    intColumn = parseInt(
                        parentCell.getAttribute('data-col-number'),
                        10
                    );

                    // now that we associate display columns and their data
                    //      columns, we can get the value even if there's no
                    //      columnElement, but we do need a column number
                    strColumn = (
                        element.internalDisplay.dataColumnName[intColumn]
                    );

                    // we need to extract the cell value from the data
                    strDataValue = getCell(
                        element,
                        strColumn,
                        intRecord,
                        // cell value should be decoded from tab delimited
                        true,
                        // we need to know if we're dealing with NULL
                        'gsTAbleINTERNALNULLSTRING'
                    );

                    // we wan't to get the text selection of current cell,
                    //      so we need the column element
                    columnElement = xtag.query(parentCell, '[column]')[0];

                    // we can't get the text selection if there's no column
                    //      element or there's no value
                    if (
                        columnElement &&
                        strDataValue !== 'gsTAbleINTERNALNULLSTRING'
                    ) {
                        // we need to get the input or textarea (if there
                        //      is one) that'll contain the text selection
                        // sometimes, the developer will use an input or
                        //      textarea element as the column element, in
                        //      that case the column element is the focus
                        //      element
                        if (
                            // if the column element is an input[type="text"]
                            (
                                columnElement.nodeName === 'INPUT' &&
                                columnElement.getAttribute('type') === 'text'
                            ) ||
                            // or if the column element is a textarea
                            columnElement.nodeName === 'TEXTAREA'
                        ) {
                            focusElement = columnElement;

                        // else, we need to search inside the column element
                        //      for the focus element
                        } else {
                            focusElement = xtag.query(
                                columnElement,
                                'input[type="text"], textarea'
                            )[0];
                        }

                        // if strValue matches columnElement's value, use
                        //      the text selection (if availible) of the
                        //      columnElement's control and substring the
                        //      strValue
                        if (
                            focusElement &&
                            focusElement.value === strDataValue
                        ) {
                            strControlValue = focusElement.value;
                            jsnSelection = GS.getInputSelection(focusElement);

                            strSelection = strControlValue.substring(
                                jsnSelection.start,
                                jsnSelection.end
                            );

                            //console.log('substring', strSelection);
                        }
                    }
                }

                // innocent until proven guilty
                bolFilterUnique = true;
                bolFilterSelection = true;
                bolColumnWidths = true;
                bolHideAndShow = true;
                bolSort = true;

                // no unique value filter list
                if (
                    //// if the cell is not a header cell
                    //strCellType !== 'header' ||
                    //// or isn't the only column selected
                    //arrSelectedColumns.length !== 1 ||
                    //// or isn't a data column
                    //arrDataColumns.length !== 1
                    true // <-- filter unique is for the column dropdown
                ) {
                    bolFilterUnique = false;
                }

                // no filter by selection
                if (
                    // if the cell is not a data cell
                    strCellType !== 'data' ||
                    // or multiple cells are selected
                    bolRange ||
                    // or isn't the only column selected
                    arrSelectedColumns.length !== 1 ||
                    // or isn't a data column
                    arrDataColumns.length !== 1
                ) {
                    bolFilterSelection = false;
                }

                // right now, we always want the option of column widths
                if (false) {
                    bolColumnWidths = false;
                }

                // right now, we always want the option of show and hide
                if (false) {
                    bolHideAndShow = false;
                }

                // if there are no data columns in the current selection, we
                //      want no sorting options
                if (arrDataColumns.length === 0) {
                    bolSort = false;
                }

                // helps to debug
                //console.log('arrSelectedColumns: ', arrSelectedColumns);
                //console.log('arrDataColumns: ', arrDataColumns);
                //console.log('bolFilterUnique: ', bolFilterUnique);
                //console.log('bolFilterSelection: ', bolFilterSelection);
                //console.log('bolHideAndShow: ', bolHideAndShow);
                //console.log('bolSort: ', bolSort);

                // assemble the HTML
                strHTML = '';

                if (bolSort) {
                    strHTML += (
                        strHTML
                            ? '<hr />'
                            : ''
                    );
                    strHTML += (
                        '<div class="context-menu-header">Sorting:</div>' +
                        '<div class="context-menu-indent">' +
                        '    <gs-button dialogclose remove-bottom' +
                        '                iconleft icon="sort-alpha-asc"' +
                        '                class="button-sort-asc">' +
                        '        Sort A to Z' +
                        '    </gs-button>' +
                        '    <gs-button dialogclose remove-all' +
                        '                iconleft icon="sort-alpha-desc"' +
                        '                class="button-sort-desc">' +
                        '        Sort Z to A' +
                        '    </gs-button>' +
                        '    <gs-button dialogclose remove-top' +
                        '                iconleft icon="trash-o"' +
                        '                class="button-sort-clear">' +
                        '        Clear Sort' +
                        '    </gs-button>' +
                        '</div>'
                    );
                }

                if (bolHideAndShow) {
                    strHTML += (
                        strHTML
                            ? '<hr />'
                            : ''
                    );
                    strHTML += (
                        '<div class="context-menu-header">' +
                        'Hide/Unhide Columns:' +
                        '</div>' +
                        '<div class="context-menu-indent">' +
                        '    <gs-button dialogclose remove-bottom' +
                        '                iconleft icon="eye-slash"' +
                        '                class="button-column-hide">' +
                        '        Hide Column(s)' +
                        '    </gs-button>' +
                        '    <gs-button dialogclose remove-top' +
                        '                iconleft icon="eye"' +
                        '                class="button-column-unhide">' +
                        '        Unhide Columns' +
                        '    </gs-button>' +
                        '</div>'
                    );
                }

                // ### NEED CODING ###
                if (bolColumnWidths) {
                    strHTML += (
                        strHTML
                            ? '<hr />'
                            : ''
                    );
                    strHTML += (
                        '<div class="context-menu-header">Column Width:</div>' +
                        '<div class="context-menu-indent">' +
                        '    <gs-button dialogclose remove-bottom' +
                        '                iconleft icon="text-width"' +
                        '                class="button-column-width">' +
                        '        Fit To Header' +
                        '    </gs-button>' +
                        '    <gs-button dialogclose remove-top' +
                        '                iconleft icon="text-width"' +
                        '                class="button-column-width">' +
                        '        Fit To Content' +
                        '    </gs-button>' +
                        '</div>'
                    );
                }

                if (bolFilterSelection) {
                    strHTML += (
                        strHTML
                            ? '<hr />'
                            : ''
                    );
                    strHTML += (
                        '<div class="context-menu-header">Filtering:</div>' +
                        '<div class="context-menu-indent">' +
                        '    <gs-button dialogclose remove-bottom' +
                        '                iconleft icon="filter"' +
                        '                class="button-filter-include">' +
                        '        Filter By Selection' +
                        '    </gs-button>' +
                        '    <gs-button dialogclose remove-all' +
                        '                iconleft icon="filter"' +
                        '                class="button-filter-exclude">' +
                        '        Filter Excluding Selection' +
                        '    </gs-button>' +
                        '    <gs-button dialogclose remove-all' +
                        '                iconleft icon="search"' +
                        '                class="button-filter-text">' +
                        '        Text Filters' +
                        '    </gs-button>' +
                        '    <gs-button dialogclose remove-all' +
                        '                iconleft icon="toggle-off"' +
                        '                class="button-filter-toggle">' +
                        '        Toggle Filters' +
                        '    </gs-button>' +
                        '    <gs-button dialogclose remove-top' +
                        '                iconleft icon="trash-o"' +
                        '                class="button-filter-clear">' +
                        '        Clear Filters' +
                        '    </gs-button>' +
                        '</div>'
                    );
                }

                // ### NEED CODING ###
                if (bolFilterUnique) {
                    strHTML += (
                        strHTML
                            ? '<hr />'
                            : ''
                    );
                    strHTML += '<div class="gs-table-unique-value-list"></div>';
                }

                // create dialog template
                templateElement = document.createElement('template');
                templateElement.setAttribute('data-max-width', '15em');
                templateElement.setAttribute('data-overlay-close', 'true');
                templateElement.setAttribute('no-focus-lock', 'true');
                templateElement.setAttribute('no-background', '');
                templateElement.innerHTML = (
                    '<gs-page gs-dynamic class="gs-table-contextmenu">' +
                    '    <gs-body padded>' +
                    '        ' + strHTML +
                    '    </gs-body>' +
                    '</gs-page>'
                );

                // if we're going to open the dialog, we need to prevent
                //      the OS contextmenu
                event.preventDefault();

                // we want the context menu to be placed at a particular
                //      X/Y, so we'll stick a temporary element in to
                //      position to
                var jsnMousePos = GS.mousePosition(event);
                var jsnElementPos = GS.getElementOffset(
                    element.elems.root
                );

                element.elems.pixel.style.left = (
                    (
                        (
                            jsnMousePos.left -
                            jsnElementPos.left
                        ) +
                        (
                            GS.emToPx(document.body, 15) /
                            2
                        )
                    ) +
                    'px'
                );
                element.elems.pixel.style.top = (
                    (
                        jsnMousePos.top -
                        jsnElementPos.top
                    ) +
                    'px'
                );
                element.elems.pixel.style.bottom = '';
                element.elems.pixel.style.right = '';
                // element.elems.dataViewport.appendChild(
                //     element.elems.pixel
                // );

                // open dialog
                GS.openDialogToElement(
                    element.elems.pixel,
                    templateElement,
                    'down',
                    function () {
                        var dialog = this;
                        var filterToggleButton;
                        var strStatus;

                        // we want the top gs-page to have corner rounding
                        dialog.classList.add('gs-table-contextmenu');

                        // we want the "toggle filter" button to reflect
                        //      the current status of the column filter
                        //      on/off
                        if (bolFilterSelection) {
                            filterToggleButton = xtag.query(
                                dialog,
                                '.button-filter-toggle'
                            )[0];

                            strStatus = (
                                element.internalData
                                    .columnFilterStatuses[arrDataColumns[0]]
                            );

                            if (strStatus === 'on') {
                                filterToggleButton.textContent = (
                                    'Toggle Filters Off'
                                );
                                filterToggleButton.setAttribute(
                                    'icon',
                                    'toggle-on'
                                );
                            } else {
                                filterToggleButton.textContent = (
                                    'Toggle Filters On'
                                );
                                filterToggleButton.setAttribute(
                                    'icon',
                                    'toggle-off'
                                );
                            }
                        }
                    },
                    function (event, strAnswer) {
                        var dialog = this;
                        var targetElement;
                        var buttonElement;

                        var strWhere;
                        var strValue;

                        var strNewSort;

                        var col_i;
                        var col_len;

                        // when you close the dialog by clicking on the
                        //      overlay, there is no event.
                        if (event && event.target) {
                            targetElement = event.target;
                        }

                        // when you close the dialog by clicking on the
                        //      overlay, there is no target.
                        if (targetElement) {
                            // we may need to position a second dialog to a
                            //      button, so here we get the button that
                            //      was clicked.
                            if (targetElement.nodeName === 'GS-BUTTON') {
                                buttonElement = targetElement;
                            } else {
                                buttonElement = GS.findParentTag(
                                    targetElement,
                                    'gs-button'
                                );
                            }
                        }

                        //console.log(event, buttonElement, targetElement);

                        // there's extra whitespace around the answer
                        strAnswer = strAnswer.trim();

                        //console.log(
                        //    parentCell,
                        //    buttonElement,
                        //    strAnswer,
                        //    arrDataColumns,
                        //    strColumn
                        //);

                        if (
                            strAnswer === 'Sort A to Z' ||
                            strAnswer === 'Sort Z to A' ||
                            strAnswer === 'Clear Sort'
                        ) {
                            if (strAnswer === 'Sort A to Z') {
                                strNewSort = 'asc';
                            } else if (strAnswer === 'Sort Z to A') {
                                strNewSort = 'desc';
                            } else if (strAnswer === 'Clear Sort') {
                                strNewSort = 'neutral';
                            }

                            col_i = 0;
                            col_len = arrDataColumns.length;
                            while (col_i < col_len) {
                                element.internalData.columnOrders[
                                    arrDataColumns[col_i]
                                ] = strNewSort;

                                col_i += 1;
                            }

                            dataSELECT(element);

                        } else if (strAnswer === 'Fit To Header') {
                            resizeColumnsToHeader(element, arrSelectedColumns);

                        } else if (strAnswer === 'Fit To Content') {
                            var colsToResize = [];
                            //console.log(arrSelectedColumns);
                            if (element.internalSelection.rows[0] ===
                                'header'
                            ) {
                                var jsnFirstRange = (
                                    element.internalSelection.ranges[0]
                                );
                                var intSelectionLength;
                                if (
                                    jsnFirstRange &&
                                    jsnFirstRange.start.row === 'header'
                                ) {
                                    intSelectionLength = (
                                        jsnFirstRange.end.column -
                                        jsnFirstRange.start.column + 1
                                    );

                                    i = 0;
                                    while (i < intSelectionLength) {
                                        colsToResize.push(
                                            i + jsnFirstRange.start.column
                                        );

                                        i += 1;
                                    }
                                }

                            } else {
                                //no headers selected: resize the column
                                //  that was clicked
                                colsToResize = arrSelectedColumns;
                            }
                            //console.log(colsToResize);
                            resizeColumnsToContent(element, arrSelectedColumns);

                        } else if (strAnswer === 'Hide Column(s)') {
                            i = 0;
                            len = arrSelectedColumns.length;
                            while (i < len) {
                                // we don't want to hide the record selector
                                if (arrSelectedColumns[i] >= 0) {
                                    // hide the column by making it zero
                                    //      width
                                    element.internalDisplay.columnWidths[
                                        arrSelectedColumns[i]
                                    ] = 0;
                                }

                                i += 1;
                            }

                            // partial re-render might not know how to
                            //      remove columns in the middle of the
                            //      viewport
                            element.internalDisplay.fullRenderRequired = true;
                            renderLocation(element);

                        } else if (strAnswer === 'Unhide Columns') {
                            openColumnHideDialog(
                                element,
                                buttonElement,
                                // before dialog close callback
                                function (strAnswer) {
                                    // if the unhide dialog wasn't cancelled,
                                    //      close the contextmenu
                                    if (strAnswer !== 'Cancel') {
                                        GS.closeDialog(dialog, 'Force');
                                    }
                                }
                            );
                            event.preventDefault();

                        } else if (strAnswer === 'Filter By Selection') {
                            strValue = (strSelection || strDataValue);

                            // sometimes the user want's to filter for nulls
                            if (strValue === 'gsTAbleINTERNALNULLSTRING') {
                                strWhere = (strColumn + ' IS NULL');
                            } else {
                                strWhere = (
                                    'CAST(' +
                                        strColumn + ' AS ' +
                                        GS.database.type.text +
                                    ') = $$' + strValue + '$$'
                                );
                            }

                            element.internalData
                                .columnFilters[arrDataColumns[0]].push(
                                    {
                                        "text": strWhere,
                                        "name": 'equals "' + strValue + '"'
                                    }
                                );

                            dataSELECT(element);

                        } else if (
                            strAnswer === 'Filter Excluding Selection'
                        ) {
                            strValue = (strSelection || strDataValue);

                            // sometimes the user want's to filter out nulls
                            if (strValue === 'gsTAbleINTERNALNULLSTRING') {
                                strWhere = (strColumn + ' IS NOT NULL');
                            } else {
                                strWhere = (
                                    'CAST(' +
                                        strColumn + ' AS ' +
                                        GS.database.type.text +
                                    ') != $$' + strValue + '$$'
                                );
                            }

                            element.internalData
                                .columnFilters[arrDataColumns[0]].push(
                                    {
                                        "text": strWhere,
                                        "name": "doesn't equal " +
                                                "\"" + strValue + "\""
                                    }
                                );

                            dataSELECT(element);

                        } else if (strAnswer === 'Text Filters') {
                            strValue = (strSelection || strDataValue);

                            element.internalEvents.textFilterContextMenu(
                                buttonElement,
                                arrDataColumns[0],
                                strColumn,
                                strValue,
                                // before dialog close callback
                                function (strAnswer) {
                                    // if the unhide dialog wasn't cancelled,
                                    //      close the contextmenu
                                    if (strAnswer !== 'Cancel') {
                                        GS.closeDialog(dialog, 'Force');
                                    }
                                }
                            );

                            event.preventDefault();

                        } else if (strAnswer === 'Toggle Filters On') {
                            element.internalData.columnFilterStatuses[
                                arrDataColumns[0]
                            ] = (
                                'on'
                            );

                            dataSELECT(element);

                        } else if (strAnswer === 'Toggle Filters Off') {
                            element.internalData.columnFilterStatuses[
                                arrDataColumns[0]
                            ] = (
                                'off'
                            );

                            dataSELECT(element);

                        } else if (strAnswer === 'Clear Filters') {
                            element.internalData.columnFilters[
                                arrDataColumns[0]
                            ] = [];
                            element.internalData.columnListFilters[
                                arrDataColumns[0]
                            ] = {};

                            dataSELECT(element);
                        }

                        // we're done with the pixel element
                        // if (element.elems.pixel.parentNode ===
                        //      element.elems.dataViewport) {
                        //     element.elems.dataViewport.removeChild(
                        //         element.elems.pixel
                        //     );
                        // }
                    }
                );
            }
        };

        element.internalEvents.textFilterContextMenu = function (
            buttonElement,
            columnIndex,
            strColumn,
            strValue,
            callback
        ) {
            var templateElement;

            // we want a function specifically for contextmenus,
            //      however, currently we dont have one so we'll
            //      use the GS.openDialogToElement function
            templateElement = document.createElement('template');
            templateElement.setAttribute('data-max-width', '17em');
            templateElement.setAttribute('no-background', '');
            templateElement.setAttribute('data-overlay-close', 'true');
            templateElement.innerHTML = ml(function () {/*
                <gs-page gs-dynamic class="gs-table-contextmenu">
                    <gs-body padded>
                        <center>
                            <i>Check each filter you want to apply.</i><br />
                            <i>
                                Matching values must pass every<br />
                                filter you choose.
                            </i>
                        </center>
                        <table>
                            <tbody>
                                <tr class="fltr-row fltr-eq">
                                    <td>
                                        <gs-checkbox remove-all mini>
                                            &nbsp;Equals</gs-checkbox>
                                    </td>
                                    <td><gs-text mini></gs-text></td>
                                </tr>
                                <tr class="fltr-row fltrn-eq">
                                    <td>
                                        <gs-checkbox remove-all mini>
                                            &nbsp;Doesn't Equal</gs-checkbox>
                                    </td>
                                    <td><gs-text mini></gs-text></td>
                                </tr>
                                <tr class="fltr-row fltr-contain">
                                    <td>
                                        <gs-checkbox remove-all mini>
                                            &nbsp;Contains</gs-checkbox>
                                    </td>
                                    <td><gs-text mini></gs-text></td>
                                </tr>
                                <tr class="fltr-row fltrn-contain">
                                    <td>
                                        <gs-checkbox remove-all mini>
                                            &nbsp;Doesn't Contain</gs-checkbox>
                                    </td>
                                    <td><gs-text mini></gs-text></td>
                                </tr>
                                <tr class="fltr-row fltr-starts">
                                    <td>
                                        <gs-checkbox remove-all mini>
                                            &nbsp;Starts With</gs-checkbox>
                                    </td>
                                    <td><gs-text mini></gs-text></td>
                                </tr>
                                <tr class="fltr-row fltr-ends">
                                    <td>
                                        <gs-checkbox remove-all mini>
                                            &nbsp;Ends With</gs-checkbox>
                                    </td>
                                    <td><gs-text mini></gs-text></td>
                                </tr>
                            </tbody>
                        </table>

                        <!--
                        <gs-checkbox remove-bottom>
                            &nbsp;Equals
                        </gs-checkbox>
                        <gs-checkbox remove-all>
                            &nbsp;Doesn't Equal
                        </gs-checkbox>
                        <gs-checkbox remove-all>
                            &nbsp;Contains
                        </gs-checkbox>
                        <gs-checkbox remove-all>
                            &nbsp;Doesn't Contain
                        </gs-checkbox>
                        <gs-checkbox remove-all>
                            &nbsp;Starts With
                        </gs-checkbox>
                        <gs-checkbox remove-top>
                            &nbsp;Ends With
                        </gs-checkbox>
                        -->
                    </gs-body>
                    <gs-footer>
                        <gs-grid gutter>
                            <gs-block>
                                <gs-button dialogclose>
                                    Cancel
                                </gs-button>
                            </gs-block>
                            <gs-block>
                                <gs-button dialogclose bg-primary>
                                    Apply
                                </gs-button>
                            </gs-block>
                        </gs-grid>
                    </gs-footer>
                </gs-page>
            */
            });

            GS.openDialogToElement(
                buttonElement,
                templateElement,
                'right',
                function () {
                    var dialog = this;
                    var arrElements;
                    var i;
                    var len;

                    // we want save the user a little time, so we'll pre-fill
                    //      the filter value text control
                    arrElements = xtag.query(dialog, '.fltr-row gs-text');
                    i = 0;
                    len = arrElements.length;
                    while (i < len) {
                        arrElements[i].value = strValue;

                        i += 1;
                    }

                    //fltr-row fltr-eq
                    //fltr-row fltr-not-eq
                    //fltr-row fltr-contain
                    //fltr-row fltr-not-contain
                    //fltr-row fltr-starts
                    //fltr-row fltr-ends
                },
                // event parameter ignored
                function (ignore, strAnswer) {
                    var dialog = this;
                    var arrRows;
                    var rowClass;
                    var checkElement;
                    var valueElement;
                    var strWhere;
                    var strName;
                    var strWhereValue;
                    var i;
                    var len;

                    // there's extra whitespace around the answer
                    strAnswer = strAnswer.trim();

                    if (strAnswer === 'Apply') {
                        arrRows = xtag.query(dialog, '.fltr-row');
                        i = 0;
                        len = arrRows.length;
                        while (i < len) {
                            checkElement = (
                                arrRows[i].children[0].children[0]
                            );
                            valueElement = (
                                arrRows[i].children[1].children[0]
                            );
                            strWhereValue = valueElement.value;

                            // try to save some room in the code,
                            //      shortcut variable
                            rowClass = arrRows[i].classList;

                            strWhere = '';
                            if (checkElement.value === 'true') {
                                if (rowClass.contains('fltr-eq')) {
                                    strWhere = 'CAST(' +
                                            strColumn + ' AS ' +
                                            GS.database.type.text +
                                            ') ' +
                                            '= $$' + strWhereValue + '$$';
                                    strName = 'equals "' + strWhereValue + '"';

                                } else if (rowClass.contains('fltrn-eq')) {
                                    strWhere = 'CAST(' +
                                            strColumn + ' AS ' +
                                            GS.database.type.text +
                                            ') ' +
                                            '!= $$' + strWhereValue + '$$';
                                    strName = 'doesn\'t equal ' +
                                            '"' + strWhereValue + '"';

                                } else if (rowClass.contains('fltr-contain')) {
                                    strWhere = 'CAST(' +
                                            strColumn + ' AS ' +
                                            GS.database.type.text +
                                            ') ' +
                                            'LIKE $$%' + strWhereValue + '%$$';
                                    strName = 'contains ' +
                                            '"' + strWhereValue + '"';

                                } else if (rowClass.contains('fltrn-contain')) {
                                    strWhere = 'CAST(' +
                                            strColumn + ' AS ' +
                                            GS.database.type.text +
                                            ') ' +
                                            'NOT LIKE ' +
                                            '$$%' + strWhereValue + '%$$';
                                    strName = 'doesn\'t ' +
                                            '"' + strWhereValue + '"';

                                } else if (rowClass.contains('fltr-starts')) {
                                    strWhere = 'CAST(' +
                                            strColumn + ' AS ' +
                                            GS.database.type.text +
                                            ') ' +
                                            'LIKE $$' + strWhereValue + '%$$';
                                    strName = 'starts with ' +
                                            '"' + strWhereValue + '"';

                                } else if (rowClass.contains('fltr-ends')) {
                                    strWhere = 'CAST(' +
                                            strColumn + ' AS ' +
                                            GS.database.type.text +
                                            ') ' +
                                            'LIKE $$%' + strWhereValue + '$$';
                                    strName = 'ends ' +
                                            '"' + strWhereValue + '"';
                                }
                            }

                            // if we create a where clause
                            if (strWhere) {
                                element
                                    .internalData
                                    .columnFilters[columnIndex]
                                    .push(
                                        {"text": strWhere, "name": strName}
                                    );
                            }

                            i += 1;
                        }

                        dataSELECT(element);
                    }

                    if (callback) {
                        callback(strAnswer);
                    }
                }
            );
        };

        element.internalEvents.advancedFilterContextMenu = function (
            //parentCell,
            //buttonElement,
            //strAnswer,
            //columnIndex,
            //strColumn,
            //strValue
        ) {
            // version 2
            // ### NEED CODING ### (VERSION 2)
        };

        element.elems.dataViewport.addEventListener(
            'contextmenu',
            element.internalEvents.columnContextMenu
        );
    }

    // ############# COLUMN DROPDOWN EVENTS #############
    function unbindColumnDropdown(element) {
        element.removeEventListener(
            'click',
            element.internalEvents.columnDropDown
        );
    }
    function bindColumnDropdown(element) {
        element.internalEvents.columnDropDown = function (event) {
            var target = event.target;
            var parentCell;
            var templateElement;
            var columnNumber;
            var strColumn;
            var columnIndex;
            var strHTML;
            var jsnMousePos;
            var jsnElementPos;
            var intMouseX;
            var intMouseY;

            if (target.classList.contains('header-button')) {
                // we need the mouse position and the element position
                jsnMousePos = GS.mousePosition(event);
                jsnElementPos = GS.getElementOffset(
                    element.elems.root
                );

                // we need the mouse X to be relative to the root element
                intMouseX = (jsnMousePos.left - jsnElementPos.left);

                // we need the mouse Y to be relative to the root element
                intMouseY = (jsnMousePos.top - jsnElementPos.top);

                // move the pixel element to where the mouse is so that we can
                //      position the dialog to it
                element.elems.pixel.style.left = (intMouseX + 'px');
                element.elems.pixel.style.top = (intMouseY + 'px');

                // we need the parent cell to get the display column number
                parentCell = GS.findParentTag(target, 'gs-cell');

                // we need the display column number to get the data column name
                columnNumber = (
                    parseInt(
                        parentCell.getAttribute('data-col-number'),
                        10
                    )
                );

                // we need to know what data column we're dealing with so that
                //      we can get the data column index
                strColumn = (
                    element.internalDisplay.dataColumnName[columnNumber]
                );

                // we need to know what data column index we're dealing with
                //      so that we can apply the sorts and filters
                columnIndex = (
                    element.internalData.columnNames.indexOf(strColumn)
                );

                // build up menu html
                strHTML = '';

                //
                strHTML += (
                    '<gs-button dialogclose remove-bottom' +
                    '            iconleft icon="sort-alpha-asc"' +
                    '            class="button-sort-asc">' +
                    '    Sort A to Z' +
                    '</gs-button>'
                );

                strHTML += (
                    '<gs-button dialogclose remove-all' +
                    '            iconleft icon="sort-alpha-desc"' +
                    '            class="button-sort-desc">' +
                    '    Sort Z to A' +
                    '</gs-button>'
                );

                strHTML += (
                    '<gs-button dialogclose remove-top' +
                    '            iconleft icon="trash-o"' +
                    '            class="button-sort-clear">' +
                    '    Clear Sort' +
                    '</gs-button>'
                );

                strHTML += (
                    '<div class="gs-table-unique-filter-container" hidden>' +
                    '    <hr />' +
                    '    <small><i>Filter By Selection:</i></small>' +
                    '    <div class="gs-table-unique-value-list"></div>' +
                    '    <div class="gs-table-unique-value-list-toolbar">' +
                    (
                        '<gs-button dialogclose remove-right ' +
                                    'inline>Cancel</gs-button>' +
                        '<gs-button dialogclose remove-left ' +
                                    'inline bg-primary>Ok</gs-button>'
                    ) +
                    '    </div>' +
                    '</div>'
                );

                strHTML += '<hr />';

                strHTML += (
                    '<gs-button dialogclose' +
                    '            iconleft icon="trash-o"' +
                    '            class="button-sort-clear">' +
                    '    Clear Filters' +
                    '</gs-button>'
                );

                templateElement = document.createElement('template');
                templateElement.setAttribute('data-max-width', '17em');
                templateElement.setAttribute('data-overlay-close', 'true');
                templateElement.setAttribute('no-background', '');
                templateElement.innerHTML = (
                    '<gs-page gs-dynamic class="gs-table-contextmenu">' +
                    '    <gs-body padded>' +
                    '        ' + strHTML +
                    '    </gs-body>' +
                    '</gs-page>'
                );

                // open the dialog
                GS.openDialogToElement(
                    element.elems.pixel,
                    // element.elems.pixel replaced target.parentNode because
                    //      when the dataviewport rerendered, the element we
                    //      were positioning to disappeared. so, we'll use the
                    //      pixel because we can count on that.
                    templateElement,
                    'down',
                    function () {
                        var dialog = this;

                        var uniqueFilterElement = xtag.query(
                            dialog,
                            '.gs-table-unique-filter-container'
                        )[0];
                        var valueListElement = xtag.query(
                            dialog,
                            '.gs-table-unique-value-list'
                        )[0];

                        // we want users to be able to choose from a list
                        //      of unique values for the column they chose
                        if (
                            uniqueFilterElement &&
                            valueListElement
                        ) {
                            // we need to get the unique value list
                            dataSELECTcolumnUnique(
                                element,
                                uniqueFilterElement,
                                valueListElement,
                                strColumn
                            );
                        }
                    },
                    // event variable ignored
                    function (ignore, strAnswer) {
                        var dialog = this;
                        var tableElement;
                        var valueListElement = xtag.query(
                            dialog,
                            '.gs-table-unique-value-list'
                        )[0];
                        var arrRecords;
                        var arrIncluded;
                        var arrExcluded;
                        var strValue;
                        var bolBlanks;
                        var i;
                        var len;

                        // there is extra whitespace on the answer
                        strAnswer = strAnswer.trim();

                        // if there is a unique value filter list
                        tableElement = valueListElement.children[0];
                        if (
                            tableElement &&
                            tableElement.nodeName === 'GS-TABLE'
                        ) {
                            // if the user chose to commit their choices for
                            //      the table filter
                            if (strAnswer === 'Ok') {
                                // if there are any checked/unchecked values, we
                                //      need to save the changes
                                // because the filter list can get long, we want
                                //      to make sure we create the smallest
                                //      where clause possible. to do this,
                                //      if there are fewer checked items:
                                //          column = checked items
                                //      else (there are fewer unchecked items):
                                //          column != unchecked items
                                // chances are, the user will only include or
                                //      exclude a small number of items, there
                                //      could be a speed problem if the user
                                //      goes and unchecks ~half of the items in
                                //      a column with thousands of unique
                                //      values. but if the user does that,
                                //      there is something wrong with the
                                //      user's workflow, give the poor person
                                //      a search screen for cryin' out loud.
                                arrRecords = tableElement.internalData.records;
                                arrIncluded = [];
                                arrExcluded = [];
                                i = 1; // we want to skip over the "Select All"
                                       //      record
                                len = arrRecords.length;
                                while (i < len) {
                                    strValue = (
                                        arrRecords[i].substring(
                                            arrRecords[i]
                                                .lastIndexOf('\t') + 1
                                        )
                                    );

                                    // we treat the blanks value different
                                    if (strValue === '(blanks)') {
                                        bolBlanks = (arrRecords[i][0] === '-');

                                    } else {
                                        // if this record is unchecked
                                        if (arrRecords[i][0] === '0') {
                                            arrExcluded.push(strValue);

                                        // else, this record is checked
                                        } else {
                                            arrIncluded.push(strValue);
                                        }
                                    }

                                    i += 1;
                                }

                                // default the column filter object to an empty
                                //      state
                                if (
                                    !element.internalData
                                        .columnListFilters[columnIndex]
                                ) {
                                    element.internalData.columnListFilters[
                                        columnIndex
                                    ] = {};
                                }

                                // if inclusion would result in a smaller where
                                if (arrIncluded.length < arrExcluded.length) {
                                    element.internalData.columnListFilters[
                                        columnIndex
                                    ].type = 'inclusion';

                                    element.internalData.columnListFilters[
                                        columnIndex
                                    ].values = (
                                        arrIncluded
                                    );

                                // else, use exclusion where clause
                                } else if (arrExcluded.length > 0) {
                                    element.internalData.columnListFilters[
                                        columnIndex
                                    ].type = 'exclusion';

                                    element.internalData.columnListFilters[
                                        columnIndex
                                    ].values = (
                                        arrExcluded
                                    );
                                } else {
                                    element.internalData.columnListFilters[
                                        columnIndex
                                    ].type = 'exclusion';

                                    element.internalData.columnListFilters[
                                        columnIndex
                                    ].values = (
                                        []
                                    );
                                }

                                element.internalData
                                    .columnListFilters[columnIndex]
                                    .blanks = (bolBlanks || false);

                                // we don't want to delay Garbage Collection,
                                //      empty out the arrays and any unused
                                //      data will become like so much digital
                                //      nothingness.
                                arrRecords = [];
                                arrExcluded = [];
                                arrIncluded = [];

                                // get the new data
                                dataSELECT(element);
                            }

                            // after this callback, the dialog is closed. this
                            //      causes a window resize event. we don't want
                            //      the window event from affecting the table
                            //      after it's been removed from the DOM. so,
                            //      we destroy the element before the gs-table
                            //      is removed.
                            tableElement.destroy();
                        }

                        // waterfall to commit changes
                        if (strAnswer === 'Sort A to Z') {
                            element.internalData
                                .columnOrders[columnIndex] = 'asc';
                            dataSELECT(element);

                        } else if (strAnswer === 'Sort Z to A') {
                            element.internalData
                                .columnOrders[columnIndex] = 'desc';
                            dataSELECT(element);

                        } else if (strAnswer === 'Clear Sort') {
                            element.internalData
                                .columnOrders[columnIndex] = 'neutral';
                            dataSELECT(element);

                        } else if (strAnswer === 'Clear Filters') {
                            element.internalData
                                .columnFilters[columnIndex] = [];
                            element.internalData
                                .columnListFilters[columnIndex] = {};
                            dataSELECT(element);
                        }
                    }
                );
            }
        };

        element.addEventListener(
            'click',
            element.internalEvents.columnDropDown
        );
    }

    // ############# DEVELOPER EVENTS #############
    function unbindDeveloper(element) {
        element.removeEventListener(
            evt.mousedown,
            element.internalEvents.developerMouseDown
        );
    }
    function bindDeveloper(element) {
        element.internalEvents.developerMouseDown = function (event) {
            var bolCMDorCTRL = (event.ctrlKey || event.metaKey);
            var bolShift = (event.shiftKey);
            var strHTML;
            var arrAttr;
            var jsnAttr;
            var i;
            var len;

            if (bolCMDorCTRL && bolShift) {
                event.preventDefault();
                event.stopPropagation();

                strHTML = '';
                arrAttr = element.attributes;
                i = 0;
                len = arrAttr.length;
                while (i < len) {
                    jsnAttr = arrAttr[i];

                    strHTML += (
                        '<b>Attribute "' + encodeHTML(jsnAttr.name) + '":</b>' +
                        '<pre>' + encodeHTML(jsnAttr.value) + '</pre>'
                    );

                    i += 1;
                }

                GS.msgbox('Developer Info', strHTML, ['Ok']);
            }
        };

        element.addEventListener(
            evt.mousedown,
            element.internalEvents.developerMouseDown
        );
    }

    // ############# VISIBILITY POLLING #############
    function unbindVisibilityPolling(element) {
        clearInterval(element.internalTimerIDs.visibilityIntervalID);
    }
    function bindVisibilityPolling(element) {
        element.internalTimerIDs.visibilityIntervalID = setInterval(
            function () {
                var jsnCache;
                var intWidth;
                var intHeight;
                var intFontSize;

                jsnCache = element.internalPollingCache;
                intWidth = element.clientWidth;
                intHeight = element.clientHeight;
                intFontSize = element.elems.fontSizeDetector.clientWidth;

                if (
                    jsnCache.elementWidth !== intWidth ||
                    jsnCache.elementHeight !== intHeight ||
                    jsnCache.fontSize !== intFontSize
                ) {
                    //console.log('test');
                    renderScrollDimensions(element);
                    GS.triggerEvent(window, 'resize');
                }

                jsnCache.elementWidth = intWidth;
                jsnCache.elementHeight = intHeight;
                jsnCache.fontSize = intFontSize;
            },
            75
        );
    }


    // ############# HIGH LEVEL BINDING #############
    function unbindElement(element) {
        unbindFocus(element);
        unbindScroll(element);
        unbindSelection(element);
        unbindCellResize(element);
        unbindColumnReorder(element);
        unbindUpdate(element);
        unbindInsert(element);
        unbindKey(element);
        unbindHUD(element);
        unbindCopy(element);
        unbindPaste(element);
        unbindContextMenu(element);
        unbindColumnDropdown(element);
        unbindCut(element);
        unbindDeveloper(element);
        unbindVisibilityPolling(element);
    }
    function bindElement(element) {
        bindFocus(element);
        bindScroll(element);
        bindSelection(element);
        bindCellResize(element);
        bindColumnReorder(element);
        bindUpdate(element);
        bindInsert(element);
        bindKey(element);
        bindHUD(element);
        bindCopy(element);
        bindPaste(element);
        bindContextMenu(element);
        bindColumnDropdown(element);
        bindCut(element);
        bindDeveloper(element);
        bindVisibilityPolling(element);
    }

// #############################################################################
// ############################## XTAG DEFINITION ##############################
// #############################################################################

    function elementInserted(element) {
        // if "created"/"inserted" are not suspended: run inserted code
        if (
            !element.hasAttribute('suspend-created') &&
            !element.hasAttribute('suspend-inserted')
        ) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;

                resolveElementAttributes(element);
                prepareElement(element);
                siphonElement(element);
                renderHUD(element);
                bindElement(element);
                createWebWorker(element);
                //dataSELECT(element);
                GS.triggerEvent(element, 'initialized');
            }
        }
    }

    xtag.register('gs-table', {

// #############################################################################
// ############################# ELEMENT LIFECYCLE #############################
// #############################################################################

        lifecycle: {
            'created': function () {},

            'inserted': function () {
                elementInserted(this);
            },

            'removed': function () {
                this.destroy();
            },

            'attributeChanged': function (strAttrName) {//, oldValue, newValue
                var element = this;

                // if suspend attribute: run inserted event
                if (
                    strAttrName === 'suspend-created' ||
                    strAttrName === 'suspend-inserted'
                ) {
                    elementInserted(element);

                // if the element is not suspended: handle attribute changes
                } else if (
                    !element.hasAttribute('suspend-created') &&
                    !element.hasAttribute('suspend-inserted')
                ) {
                    if (strAttrName === 'value' && element.root) {
                        element.refresh();
                    }
                }
            }
        },

// #############################################################################
// ############################# ELEMENT ACCESSORS #############################
// #############################################################################

        accessors: {
            'selection': {
                'get': function () {
                    return this.internalSelection.ranges;
                }
            },
            'selectedColumns': {
                'get': function () {
                    return this.internalSelection.columns;
                }
            },
            'selectedRecords': {
                'get': function () {
                    return this.internalSelection.rows;
                }
            },
            'data': {
                'get': function () {
                    return {
                        "columns": this.internalData.columnNames,
                        "types": this.internalData.columnTypes,
                        "records": this.internalData.records
                    };
                }
            },
            'value': {
                'get': function () {
                    return this.getAttribute('value');
                },
                'set': function (newValue) {
                    this.setAttribute('value', newValue);
                }
            }
        },

// #############################################################################
// ############################## ELEMENT METHODS ##############################
// #############################################################################

        methods: {
            'destroy': function () {
                var element = this;

                // sometimes, the gs-table gets destroyed multiple times.
                //      we don't want to cause any errors when this happens.
                if (element.elems.dataViewport) {
                    // prevent the element from recieving any events
                    unbindElement(element);

                    // destroy the web worker, if there is one
                    if (element.internalWorker.worker) {
                        element.internalWorker.worker.terminate();
                    }

                    // this is the fastest way to destroy all of the data
                    element.internalData = {};
                    element.internalScrollOffsets = {};
                    element.internalEvents = {};
                    element.internalEventCancelled = {};
                    element.internalScroll = {};
                    element.internalTimerIDs = {};
                    element.internalTemplates = {};
                    element.internalDisplay = {};
                    element.internalSelection = {};
                    element.internalClip = {};
                    element.internalWorker = {};
                    element.internalLoaders = {};
                    element.internalResize = {};
                    element.internalReorder = {};

                    // destroy element store
                    element.elems = {};

                    // empty innerHTML
                    element.innerHTML = '';
                }
            },
            'refresh': function () {
                dataSELECT(this);
            },
            'selectData': function () {
                dataSELECT(this);
            },
            'insertData': function (jsnInsert) {
                dataINSERT(this, jsnInsert);
            },
            'updateData': function (jsnUpdate) {
                dataUPDATE(this, jsnUpdate);
            },
            'deleteData': function (jsnDeleteData) {
                dataDELETE(this, jsnDeleteData);
            },
            'render': function () {
                renderScrollDimensions(this);
            },
            'toggleFullContainer': function (container, target) {
                var element = this;
                var containerElement;

                containerElement = document.getElementById(container);

                if (element.classList.contains('absolute')) {
                    GS.triggerEvent(element, 'closeFullContainer');
                    element.classList.remove('absolute');
                    containerElement.classList.remove('relative');
                    target.setAttribute('icon', 'expand');
                } else {
                    GS.triggerEvent(element, 'openFullContainer');
                    element.classList.add('absolute');
                    containerElement.classList.add('relative');
                    target.setAttribute('icon', 'compress');
                }

                renderScrollDimensions(element);
            },
            'openFullContainer': function (container, target) {
                var element = this;
                var containerElement;

                containerElement = document.getElementById(container);

                if (!element.classList.contains('absolute')) {
                    GS.triggerEvent(element, 'openFullContainer');
                    element.classList.add('absolute');
                    containerElement.classList.add('relative');
                    target.setAttribute('icon', 'compress');
                }

                renderScrollDimensions(element);
            },
            'closeFullContainer': function (container, target) {
                var element = this;
                var containerElement;

                containerElement = document.getElementById(container);

                if (element.classList.contains('absolute')) {
                    GS.triggerEvent(element, 'closeFullContainer');
                    element.classList.remove('absolute');
                    containerElement.classList.remove('relative');
                    target.setAttribute('icon', 'expand');
                }

                renderScrollDimensions(element);
            },
            //'scrollToColumn': function (columnNumber) {
            //},
            //'scrollToRow': function (rowNumber) {
            //},
            //'scrollToCell': function (rowNumber, columnNumber) {
            //},
            'deleteSelected': function () {
                deleteSelectedRecords(this);
            },
            'clearFilter': function () {
                var filter_i;
                var filter_len;

                filter_i = 0;
                filter_len = this.internalData.columnFilters.length;
                while (filter_i < filter_len) {
                    this.internalData.columnFilters[filter_i] = [];
                    this.internalData.columnListFilters[filter_i] = {};

                    filter_i += 1;
                }

                // refresh the table
                dataSELECT(this);
            },
            'toggleFullscreen': function (target) {
                var element = this;

                // using a class like this doesn't work on iOS (other things
                //      z-index over it), we need to move the element to the
                //      last element in the body and then apply the class.
                // ### NEED CODING ###
                if (element.classList.contains('table-fullscreen')) {
                    GS.triggerEvent(element, 'closeFullScreen');
                    element.classList.remove('table-fullscreen');

                    if (target.getAttribute('icon') === 'close') {
                        target.setAttribute('icon', 'arrows-alt');
                    }
                } else {
                    GS.triggerEvent(element, 'openFullscreen');
                    element.classList.add('table-fullscreen');

                    if (target.getAttribute('icon') === 'arrows-alt') {
                        target.setAttribute('icon', 'close');
                    }
                }
                renderScrollDimensions(element);
            },
            'openFullscreen': function (target) {
                var element = this;

                if (!element.classList.contains('table-fullscreen')) {
                    GS.triggerEvent(element, 'openFullscreen');
                    element.classList.add('table-fullscreen');
                    if (target.getAttribute('icon') === 'arrows-alt') {
                        target.setAttribute('icon', 'close');
                    }
                }
                renderScrollDimensions(element);
            },
            'closeFullscreen': function (target) {
                var element = this;

                if (element.classList.contains('table-fullscreen')) {
                    GS.triggerEvent(element, 'closeFullScreen');
                    element.classList.remove('table-fullscreen');
    
                    if (target.getAttribute('icon') === 'close') {
                        target.setAttribute('icon', 'arrows-alt');
                    }
                }
                renderScrollDimensions(element);
            },
            'openPrefs': function (target) {
                openSettingsDialog(this, target);
            },
            'sort': function (action) {
                var strNewSort;
                if (action === 'asc') {
                    strNewSort = 'asc';
                } else if (action === 'desc') {
                    strNewSort = 'desc';
                } else if (action === 'clear') {
                    strNewSort = 'neutral';
                } else {
                    strNewSort = 'neutral';
                }

                // we need the column orderby array
                var arrColumnOrders = (
                    this.internalData.columnOrders
                );

                // loop through each selected data column and set the orderby
                var arrDataColumns = getSelectedDataColumns(this);
                var i = 0;
                var len = arrDataColumns.length;
                while (i < len) {
                    arrColumnOrders[
                        arrDataColumns[i]
                    ] = strNewSort;

                    i += 1;
                }

                // refresh the table
                dataSELECT(this);
            },
            'openInsertDialog': function () {
                openInsertDialog(this);
            },
            'goToLine': function (action) {
                var intCurrentRecord = (
                    this.internalSelection.originRecord || 0
                );
                var intMaxRecord = (
                    this.internalData.records.length - 1
                );
                var intMinColumn = (
                    this.internalDisplay.recordSelectorVisible
                        ? -1
                        : 0
                );

                if (action === 'insert') {
                    scrollCellIntoView(this, 'insert', '0', 'top');
                } else {
                    // set current record based on which button was clicked
                    if (action === 'first') {
                        intCurrentRecord = 0;
                    } else if (action === 'previous') {
                        intCurrentRecord -= 1;
                    } else if (action === 'next') {
                        intCurrentRecord += 1;
                    } else if (action === 'plusten') {
                        intCurrentRecord += 10;
                    } else if (action === 'minusten') {
                        intCurrentRecord -= 10;
                    } else if (action === 'last') {
                        intCurrentRecord = intMaxRecord;
                    } else if (typeof action === 'number') {
                        intCurrentRecord = action - 1;
                    } else {
                        intCurrentRecord = parseInt(action, 10) - 1;
                    }

                    //if the new record is past the last record:
                    //      go to last record
                    if (intCurrentRecord > intMaxRecord) {
                        intCurrentRecord = intMaxRecord;
                    }

                    // if the new record is a negative number:
                    //      go to first record
                    if (intCurrentRecord < 0) {
                        intCurrentRecord = 0;
                    }

                    // if there are no records, clear new record
                    if (intMaxRecord === -1) {
                        intCurrentRecord = undefined;
                    }
                    // override all current ranges to select the new record
                    if (intCurrentRecord !== undefined) {
                        this.internalSelection.ranges = [
                            {
                                "start": {
                                    "row": intCurrentRecord,
                                    "column": intMinColumn
                                },
                                "end": {
                                    "row": intCurrentRecord,
                                    "column": intMinColumn
                                },
                                "negator": false
                            }
                        ];
                    } else {
                        this.internalSelection.ranges = [];
                    }
                    // render selection and scroll into view
                    renderSelection(this);
                    scrollSelectionIntoView(this, 'top');
                }
            },
            'clearSelection': function () {
                var element = this;

                // empty selection array
                element.internalSelection.ranges = [];

                // re-render selection
                renderSelection(element);
            },
            'addSelectionRange': function (
                fromRow,
                fromColumn,
                toRow,
                toColumn,
                bolNegate
            ) {
                var element = this;

                // bolNegate must be true or false, default to false
                if (
                    bolNegate === undefined ||
                    typeof bolNegate !== 'boolean'
                ) {
                    bolNegate = false;
                }

                // create range JSON and append to selections
                element.internalSelection.ranges.push({
                    "start": {
                        "row": fromRow,
                        "column": fromColumn
                    },
                    "end": {
                        "row": toRow,
                        "column": toColumn
                    },
                    "negator": false
                });

                // re-render selection
                renderSelection(element);
            },
            'getCopyStrings': function () {
                return getCopyStrings(this);
            },
            'paste': function (strPasteString) {
                usePasteString(this, strPasteString);
            },
            'resizeAllColumns': function () {
                var element = this;
                var arrIndexes = [];
                var i;
                var len;

                i = 0;
                len = element.internalDisplay.columnPlainTextNames.length;
                while (i < len) {
                    arrIndexes.push(i);
                    i += 1;
                }

                resizeColumnsToContent(element, arrIndexes);
            },
            'addFilter': function (filterColumn, filterType, filterValue) {
                var element = this;
                var columnIndex;
                var strWhere;
                var strName;

                // filterType must be one of these values: (defaults to equals)
                //      'contains', 'notcontains',
                //      'starts', 'notstarts',
                //      'ends', 'notends',
                //      'equals', 'notequals',
                //      'greaterthan', 'notgreaterthan',
                //      'lessthan', 'notlessthan'
                if (
                    !(/^(contains|starts|ends)$/gi).test(filterType) &&
                    !(/^(equals|greaterthan|lessthan)$/gi).test(filterType) &&
                    !(/^(notcontains|notstarts|notends)$/gi).test(filterType) &&
                    !(/^(notequals|notgreaterthan)$/gi).test(filterType) &&
                    !(/^(notlessthan)$/gi).test(filterType)
                ) {
                    throw 'GS-TABLE Error: invalid filter type given to ' +
                            'ELEMENT.addFilter(filterColumn, filterType, ' +
                            'filterValue). Given filter type was ' +
                            '"' + filterType + '", must be "contains", ' +
                            '"starts", "ends", "equals", "greaterthan", ' +
                            '"lessthan", "notcontains", "notstarts", ' +
                            '"notends", "notequals", "notgreaterthan" ' +
                            'or "notlessthan".';
                }

                // we want to use the filterType in an if statement, let's
                //      lowercase it to make comparisons easier
                filterType = filterType.toLowerCase();

                // filterValue must not be empty: error if nothing provided
                if (filterValue === undefined) {
                    throw 'GS-TABLE Error: no filter value given to ' +
                            'ELEMENT.addFilter(filterColumn, filterType, ' +
                            'filterValue)';
                }

                // if value provided: cast to JS string to prevent type issues
                filterValue = filterValue.toString();

                // equals (TEXT)
                if (filterType === 'equals') {
                    strWhere = 'CAST(' +
                            filterColumn + ' AS ' +
                            GS.database.type.text +
                            ') ' +
                            '= $$' + filterValue + '$$';
                    strName = 'equals' +
                            ' "' + filterValue + '"';

                // not equals (TEXT)
                } else if (filterType === 'notequals') {
                    strWhere = 'CAST(' +
                            filterColumn + ' AS ' +
                            GS.database.type.text +
                            ') ' +
                            '!= $$' + filterValue + '$$';
                    strName = 'doesn\'t equal' +
                            ' "' + filterValue + '"';

                // contains (TEXT)
                } else if (filterType === 'contains') {
                    strWhere = 'CAST(' +
                            filterColumn + ' AS ' +
                            GS.database.type.text +
                            ') ' +
                            'LIKE $$%' + filterValue + '%$$';
                    strName = 'contains' +
                            ' "' + filterValue + '"';

                // doesn't contain (TEXT)
                } else if (filterType === 'notcontains') {
                    strWhere = 'CAST(' +
                            filterColumn + ' AS ' +
                            GS.database.type.text +
                            ') ' +
                            'NOT LIKE ' +
                            '$$%' + filterValue + '%$$';
                    strName = 'doesn\'t contain' +
                            ' "' + filterValue + '"';

                // starts with (TEXT)
                } else if (filterType === 'starts') {
                    strWhere = 'CAST(' +
                            filterColumn + ' AS ' +
                            GS.database.type.text +
                            ') ' +
                            'LIKE $$' + filterValue + '%$$';
                    strName = 'starts with' +
                            ' "' + filterValue + '"';

                // doesn't start with (TEXT)
                } else if (filterType === 'notstarts') {
                    strWhere = 'CAST(' +
                            filterColumn + ' AS ' +
                            GS.database.type.text +
                            ') ' +
                            'NOT LIKE $$' + filterValue + '%$$';
                    strName = '' +
                            ' "' + filterValue + '"';

                // ends with (TEXT)
                } else if (filterType === 'ends') {
                    strWhere = 'CAST(' +
                            filterColumn + ' AS ' +
                            GS.database.type.text +
                            ') ' +
                            'LIKE $$%' + filterValue + '$$';
                    strName = 'ends with' +
                            ' "' + filterValue + '"';

                // doesn't end with (TEXT)
                } else if (filterType === 'notends') {
                    strWhere = 'CAST(' +
                            filterColumn + ' AS ' +
                            GS.database.type.text +
                            ') ' +
                            'NOT LIKE $$%' + filterValue + '$$';
                    strName = 'doesn\'t end with' +
                            ' "' + filterValue + '"';

                // greaterthan (INTEGER/NUMERIC)
                } else if (filterType === 'greaterthan') {
                    strWhere = (
                        filterColumn + ' > ' + filterValue
                    );
                    strName = 'greater than' +
                            ' "' + filterValue + '"';

                // not greaterthan (INTEGER/NUMERIC)
                } else if (filterType === 'notgreaterthan') {
                    strWhere = (
                        filterColumn + ' <= ' + filterValue
                    );
                    strName = 'not greater than' +
                            ' "' + filterValue + '"';

                // lessthan (INTEGER/NUMERIC)
                } else if (filterType === 'lessthan') {
                    strWhere = (
                        filterColumn + ' < ' + filterValue
                    );
                    strName = 'less than' +
                            ' "' + filterValue + '"';

                // not lessthan (INTEGER/NUMERIC)
                } else if (filterType === 'notlessthan') {
                    strWhere = (
                        filterColumn + ' >= ' + filterValue
                    );
                    strName = 'not less than' +
                            ' "' + filterValue + '"';
                }

                // turn the updated column name into a column index so that
                //      we can fetch the old data from the data
                columnIndex = (
                    element.internalData.columnNames.indexOf(filterColumn)
                );

                // if we were able to create a where, push it to the filter
                //      list
                if (strWhere) {
                    element.internalData
                        .columnFilters[columnIndex].push(
                            {
                                "text": strWhere,
                                "name": strName
                            }
                        );

                    // master, why didn't you refresh the table after a where
                    //      was created?
                    // young grasshopper, you must think of the developer who
                    //      will use this table, what if he were to add three
                    //      filters, one right after the other? in order to
                    //      prevent speed issues we must make him refresh the
                    //      table.

                // else, warn about invalid where
                } else {
                    console.warn('GS-TABLE Warning: Unable to create where' +
                            'clause.\n' +
                            'Here are the parameters that failed:\n' +
                            '\tfilterColumn:   "' + filterColumn + '"\n' +
                            '\tfilterType:     "' + filterType + '"\n' +
                            '\tfilterValue:    "' + filterValue + '"');
                }
            }
        }
    });
});
