"no use strict";

// jslint.js
// 2016-05-25
// Copyright (c) 2015 Douglas Crockford  (www.JSLint.com)

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// The Software shall be used for Good, not Evil.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// jslint is a function that takes 3 arguments:

//      source          A text to analyze, a string or an array of strings.
//      option_object   An object whose keys correspond to option names.
//      global_array    An array of strings containing global variables that
//                      the file is allowed readonly access.

// jslint returns an object containing its results. The object contains a lot
// of valuable information. It can be used to generate reports. The object
// contains:

//      edition: the version of JSLint that did the analysis.
//      functions: an array of objects that represent all of the functions
//              declared in the file.
//      global: an object representing the global object. Its .context property
//              is an object containing a property for each global variable.
//      id: "(JSLint)"
//      imports: an array of strings representing each of the imports.
//      json: true if the file is a JSON text.
//      lines: an array of strings, the source.
//      module: true if an import or export statement was used.
//      ok: true if no warnings were generated. This is what you want.
//      option: the option argument.
//      property: a property object.
//      stop: true if JSLint was unable to finish. You don't want this.
//      tokens: an array of objects representing the tokens in the file.
//      tree: the token objects arranged in a tree.
//      warnings: an array of warning objects. A warning object can contain:
//          name: "JSLintError"
//          column: A column number in the file.
//          line: A line number in the file.
//          code: A warning code string.
//          message: The warning message string.
//          a: Exhibit A.
//          b: Exhibit B.
//          c: Exhibit C.
//          d: Exhibit D.

// jslint works in several phases. In any of these phases, errors might be
// found. Sometimes JSLint is able to recover from an error and continue
// parsing. In some cases, it cannot and will stop early. If that should happen,
// repair your code and try again.

// Phases:

//      1. If the source is a single string, split it into an array of strings.
//      2. Turn the source into an array of tokens.
//      3. Furcate the tokens into a parse tree.
//      4. Walk the tree, traversing all of the nodes of the tree. It is a
//          recursive traversal. Each node may be processed on the way down
//          (preaction) and on the way up (postaction).
//      5. Check the whitespace between the tokens.

// jslint can also examine JSON text. It decides that a file is JSON text if
// the first token is "[" or "{". Processing of JSON text is much simpler than
// the processing of JavaScript programs. Only the first three phases are
// required.

// WARNING: JSLint will hurt your feelings.

/*property
    a, and, arity, b, bad_assignment_a, bad_directive_a, bad_get,
    bad_module_name_a, bad_option_a, bad_property_a, bad_set, bitwise, block,
    body, browser, c, calls, catch, charAt, charCodeAt, closer, closure, code,
    column, concat, constant, context, couch, create, d, dead, devel,
    directive, directives, disrupt, dot, duplicate_a, edition, ellipsis, else,
    empty_block, es6, eval, every, expected_a_at_b_c, expected_a_b,
    expected_a_b_from_c_d, expected_a_before_b, expected_digits_after_a,
    expected_four_digits, expected_identifier_a, expected_line_break_a_b,
    expected_regexp_factor_a, expected_space_a_b, expected_statements_a,
    expected_string_a, expected_type_string_a, expression, extra, flag, for,
    forEach, free, from, fud, fudge, function, function_in_loop, functions, g,
    global, i, id, identifier, import, imports, inc, indexOf, infix_in, init,
    initial, isArray, isNaN, join, json, keys, label, label_a, lbp, led,
    length, level, line, lines, live, loop, m, margin, match, maxerr, maxlen,
    message, misplaced_a, misplaced_directive_a, missing_browser, module,
    multivar, naked_block, name, names, nested_comment, new, node, not_label_a,
    nud, number_isNaN, ok, open, option, out_of_scope_a, parameters, pop,
    property, push, qmark, quote, redefinition_a_b, replace, reserved_a, role,
    search, signature, slice, some, sort, split, statement, stop, strict,
    subscript_a, switch, test, this, thru, toString, todo_comment, tokens,
    too_long, too_many, too_many_digits, tree, type, u, unclosed_comment,
    unclosed_mega, unclosed_string, undeclared_a, unexpected_a,
    unexpected_a_after_b, unexpected_at_top_level_a, unexpected_char_a,
    unexpected_comment, unexpected_directive_a, unexpected_expression_a,
    unexpected_label_a, unexpected_parens, unexpected_space_a_b,
    unexpected_statement_a, unexpected_trailing_space, unexpected_typeof_a,
    uninitialized_a, unreachable_a, unregistered_property_a, unsafe, unused_a,
    use_spaces, used, value, var_loop, var_switch, variable, warning, warnings,
    weird_condition_a, weird_expression_a, weird_loop, weird_relation_a, white,
    wrap_assignment, wrap_condition, wrap_immediate, wrap_parameter,
    wrap_regexp, wrap_unary, wrapped, writable, y
*/


;(function(window) {
if (typeof window.window != "undefined" && window.document)
    return;
if (window.require && window.define)
    return;

if (!window.console) {
    window.console = function() {
        var msgs = Array.prototype.slice.call(arguments, 0);
        postMessage({type: "log", data: msgs});
    };
    window.console.error =
    window.console.warn = 
    window.console.log =
    window.console.trace = window.console;
}
window.window = window;
window.ace = window;

window.onerror = function(message, file, line, col, err) {
    postMessage({type: "error", data: {
        message: message,
        data: err.data,
        file: file,
        line: line, 
        col: col,
        stack: err.stack
    }});
};

window.normalizeModule = function(parentId, moduleName) {
    // normalize plugin requires
    if (moduleName.indexOf("!") !== -1) {
        var chunks = moduleName.split("!");
        return window.normalizeModule(parentId, chunks[0]) + "!" + window.normalizeModule(parentId, chunks[1]);
    }
    // normalize relative requires
    if (moduleName.charAt(0) == ".") {
        var base = parentId.split("/").slice(0, -1).join("/");
        moduleName = (base ? base + "/" : "") + moduleName;
        
        while (moduleName.indexOf(".") !== -1 && previous != moduleName) {
            var previous = moduleName;
            moduleName = moduleName.replace(/^\.\//, "").replace(/\/\.\//, "/").replace(/[^\/]+\/\.\.\//, "");
        }
    }
    
    return moduleName;
};

window.require = function require(parentId, id) {
    if (!id) {
        id = parentId;
        parentId = null;
    }
    if (!id.charAt)
        throw new Error("worker.js require() accepts only (parentId, id) as arguments");

    id = window.normalizeModule(parentId, id);

    var module = window.require.modules[id];
    if (module) {
        if (!module.initialized) {
            module.initialized = true;
            module.exports = module.factory().exports;
        }
        return module.exports;
    }
   
    if (!window.require.tlns)
        return console.log("unable to load " + id);
    
    var path = resolveModuleId(id, window.require.tlns);
    if (path.slice(-3) != ".js") path += ".js";
    
    window.require.id = id;
    window.require.modules[id] = {}; // prevent infinite loop on broken modules
    importScripts(path);
    return window.require(parentId, id);
};
function resolveModuleId(id, paths) {
    var testPath = id, tail = "";
    while (testPath) {
        var alias = paths[testPath];
        if (typeof alias == "string") {
            return alias + tail;
        } else if (alias) {
            return  alias.location.replace(/\/*$/, "/") + (tail || alias.main || alias.name);
        } else if (alias === false) {
            return "";
        }
        var i = testPath.lastIndexOf("/");
        if (i === -1) break;
        tail = testPath.substr(i) + tail;
        testPath = testPath.slice(0, i);
    }
    return id;
}
window.require.modules = {};
window.require.tlns = {};

window.define = function(id, deps, factory) {
    if (arguments.length == 2) {
        factory = deps;
        if (typeof id != "string") {
            deps = id;
            id = window.require.id;
        }
    } else if (arguments.length == 1) {
        factory = id;
        deps = [];
        id = window.require.id;
    }
    
    if (typeof factory != "function") {
        window.require.modules[id] = {
            exports: factory,
            initialized: true
        };
        return;
    }

    if (!deps.length)
        // If there is no dependencies, we inject "require", "exports" and
        // "module" as dependencies, to provide CommonJS compatibility.
        deps = ["require", "exports", "module"];

    var req = function(childId) {
        return window.require(id, childId);
    };

    window.require.modules[id] = {
        exports: {},
        factory: function() {
            var module = this;
            var returnExports = factory.apply(this, deps.map(function(dep) {
                switch (dep) {
                    // Because "require", "exports" and "module" aren't actual
                    // dependencies, we must handle them seperately.
                    case "require": return req;
                    case "exports": return module.exports;
                    case "module":  return module;
                    // But for all other dependencies, we can just go ahead and
                    // require them.
                    default:        return req(dep);
                }
            }));
            if (returnExports)
                module.exports = returnExports;
            return module;
        }
    };
};
window.define.amd = {};
require.tlns = {};
window.initBaseUrls  = function initBaseUrls(topLevelNamespaces) {
    for (var i in topLevelNamespaces)
        require.tlns[i] = topLevelNamespaces[i];
};

window.initSender = function initSender() {

    var EventEmitter = window.require("ace/lib/event_emitter").EventEmitter;
    var oop = window.require("ace/lib/oop");
    
    var Sender = function() {};
    
    (function() {
        
        oop.implement(this, EventEmitter);
                
        this.callback = function(data, callbackId) {
            postMessage({
                type: "call",
                id: callbackId,
                data: data
            });
        };
    
        this.emit = function(name, data) {
            postMessage({
                type: "event",
                name: name,
                data: data
            });
        };
        
    }).call(Sender.prototype);
    
    return new Sender();
};

var main = window.main = null;
var sender = window.sender = null;

window.onmessage = function(e) {
    var msg = e.data;
    if (msg.event && sender) {
        sender._signal(msg.event, msg.data);
    }
    else if (msg.command) {
        if (main[msg.command])
            main[msg.command].apply(main, msg.args);
        else if (window[msg.command])
            window[msg.command].apply(window, msg.args);
        else
            throw new Error("Unknown command:" + msg.command);
    }
    else if (msg.init) {
        window.initBaseUrls(msg.tlns);
        require("ace/lib/es5-shim");
        sender = window.sender = window.initSender();
        var clazz = require(msg.module)[msg.classname];
        main = window.main = new clazz(sender);
    }
};
})(this);

define("ace/lib/oop",["require","exports","module"], function(require, exports, module) {
"use strict";

exports.inherits = function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
};

exports.mixin = function(obj, mixin) {
    for (var key in mixin) {
        obj[key] = mixin[key];
    }
    return obj;
};

exports.implement = function(proto, mixin) {
    exports.mixin(proto, mixin);
};

});

define("ace/lib/lang",["require","exports","module"], function(require, exports, module) {
"use strict";

exports.last = function(a) {
    return a[a.length - 1];
};

exports.stringReverse = function(string) {
    return string.split("").reverse().join("");
};

exports.stringRepeat = function (string, count) {
    var result = '';
    while (count > 0) {
        if (count & 1)
            result += string;

        if (count >>= 1)
            string += string;
    }
    return result;
};

var trimBeginRegexp = /^\s\s*/;
var trimEndRegexp = /\s\s*$/;

exports.stringTrimLeft = function (string) {
    return string.replace(trimBeginRegexp, '');
};

exports.stringTrimRight = function (string) {
    return string.replace(trimEndRegexp, '');
};

exports.copyObject = function(obj) {
    var copy = {};
    for (var key in obj) {
        copy[key] = obj[key];
    }
    return copy;
};

exports.copyArray = function(array){
    var copy = [];
    for (var i=0, l=array.length; i<l; i++) {
        if (array[i] && typeof array[i] == "object")
            copy[i] = this.copyObject( array[i] );
        else 
            copy[i] = array[i];
    }
    return copy;
};

exports.deepCopy = function deepCopy(obj) {
    if (typeof obj !== "object" || !obj)
        return obj;
    var copy;
    if (Array.isArray(obj)) {
        copy = [];
        for (var key = 0; key < obj.length; key++) {
            copy[key] = deepCopy(obj[key]);
        }
        return copy;
    }
    var cons = obj.constructor;
    if (cons === RegExp)
        return obj;
    
    copy = cons();
    for (var key in obj) {
        copy[key] = deepCopy(obj[key]);
    }
    return copy;
};

exports.arrayToMap = function(arr) {
    var map = {};
    for (var i=0; i<arr.length; i++) {
        map[arr[i]] = 1;
    }
    return map;

};

exports.createMap = function(props) {
    var map = Object.create(null);
    for (var i in props) {
        map[i] = props[i];
    }
    return map;
};
exports.arrayRemove = function(array, value) {
  for (var i = 0; i <= array.length; i++) {
    if (value === array[i]) {
      array.splice(i, 1);
    }
  }
};

exports.escapeRegExp = function(str) {
    return str.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
};

exports.escapeHTML = function(str) {
    return str.replace(/&/g, "&#38;").replace(/"/g, "&#34;").replace(/'/g, "&#39;").replace(/</g, "&#60;");
};

exports.getMatchOffsets = function(string, regExp) {
    var matches = [];

    string.replace(regExp, function(str) {
        matches.push({
            offset: arguments[arguments.length-2],
            length: str.length
        });
    });

    return matches;
};
exports.deferredCall = function(fcn) {
    var timer = null;
    var callback = function() {
        timer = null;
        fcn();
    };

    var deferred = function(timeout) {
        deferred.cancel();
        timer = setTimeout(callback, timeout || 0);
        return deferred;
    };

    deferred.schedule = deferred;

    deferred.call = function() {
        this.cancel();
        fcn();
        return deferred;
    };

    deferred.cancel = function() {
        clearTimeout(timer);
        timer = null;
        return deferred;
    };
    
    deferred.isPending = function() {
        return timer;
    };

    return deferred;
};


exports.delayedCall = function(fcn, defaultTimeout) {
    var timer = null;
    var callback = function() {
        timer = null;
        fcn();
    };

    var _self = function(timeout) {
        if (timer == null)
            timer = setTimeout(callback, timeout || defaultTimeout);
    };

    _self.delay = function(timeout) {
        timer && clearTimeout(timer);
        timer = setTimeout(callback, timeout || defaultTimeout);
    };
    _self.schedule = _self;

    _self.call = function() {
        this.cancel();
        fcn();
    };

    _self.cancel = function() {
        timer && clearTimeout(timer);
        timer = null;
    };

    _self.isPending = function() {
        return timer;
    };

    return _self;
};
});

define("ace/range",["require","exports","module"], function(require, exports, module) {
"use strict";
var comparePoints = function(p1, p2) {
    return p1.row - p2.row || p1.column - p2.column;
};
var Range = function(startRow, startColumn, endRow, endColumn) {
    this.start = {
        row: startRow,
        column: startColumn
    };

    this.end = {
        row: endRow,
        column: endColumn
    };
};

(function() {
    this.isEqual = function(range) {
        return this.start.row === range.start.row &&
            this.end.row === range.end.row &&
            this.start.column === range.start.column &&
            this.end.column === range.end.column;
    };
    this.toString = function() {
        return ("Range: [" + this.start.row + "/" + this.start.column +
            "] -> [" + this.end.row + "/" + this.end.column + "]");
    };

    this.contains = function(row, column) {
        return this.compare(row, column) == 0;
    };
    this.compareRange = function(range) {
        var cmp,
            end = range.end,
            start = range.start;

        cmp = this.compare(end.row, end.column);
        if (cmp == 1) {
            cmp = this.compare(start.row, start.column);
            if (cmp == 1) {
                return 2;
            } else if (cmp == 0) {
                return 1;
            } else {
                return 0;
            }
        } else if (cmp == -1) {
            return -2;
        } else {
            cmp = this.compare(start.row, start.column);
            if (cmp == -1) {
                return -1;
            } else if (cmp == 1) {
                return 42;
            } else {
                return 0;
            }
        }
    };
    this.comparePoint = function(p) {
        return this.compare(p.row, p.column);
    };
    this.containsRange = function(range) {
        return this.comparePoint(range.start) == 0 && this.comparePoint(range.end) == 0;
    };
    this.intersects = function(range) {
        var cmp = this.compareRange(range);
        return (cmp == -1 || cmp == 0 || cmp == 1);
    };
    this.isEnd = function(row, column) {
        return this.end.row == row && this.end.column == column;
    };
    this.isStart = function(row, column) {
        return this.start.row == row && this.start.column == column;
    };
    this.setStart = function(row, column) {
        if (typeof row == "object") {
            this.start.column = row.column;
            this.start.row = row.row;
        } else {
            this.start.row = row;
            this.start.column = column;
        }
    };
    this.setEnd = function(row, column) {
        if (typeof row == "object") {
            this.end.column = row.column;
            this.end.row = row.row;
        } else {
            this.end.row = row;
            this.end.column = column;
        }
    };
    this.inside = function(row, column) {
        if (this.compare(row, column) == 0) {
            if (this.isEnd(row, column) || this.isStart(row, column)) {
                return false;
            } else {
                return true;
            }
        }
        return false;
    };
    this.insideStart = function(row, column) {
        if (this.compare(row, column) == 0) {
            if (this.isEnd(row, column)) {
                return false;
            } else {
                return true;
            }
        }
        return false;
    };
    this.insideEnd = function(row, column) {
        if (this.compare(row, column) == 0) {
            if (this.isStart(row, column)) {
                return false;
            } else {
                return true;
            }
        }
        return false;
    };
    this.compare = function(row, column) {
        if (!this.isMultiLine()) {
            if (row === this.start.row) {
                return column < this.start.column ? -1 : (column > this.end.column ? 1 : 0);
            }
        }

        if (row < this.start.row)
            return -1;

        if (row > this.end.row)
            return 1;

        if (this.start.row === row)
            return column >= this.start.column ? 0 : -1;

        if (this.end.row === row)
            return column <= this.end.column ? 0 : 1;

        return 0;
    };
    this.compareStart = function(row, column) {
        if (this.start.row == row && this.start.column == column) {
            return -1;
        } else {
            return this.compare(row, column);
        }
    };
    this.compareEnd = function(row, column) {
        if (this.end.row == row && this.end.column == column) {
            return 1;
        } else {
            return this.compare(row, column);
        }
    };
    this.compareInside = function(row, column) {
        if (this.end.row == row && this.end.column == column) {
            return 1;
        } else if (this.start.row == row && this.start.column == column) {
            return -1;
        } else {
            return this.compare(row, column);
        }
    };
    this.clipRows = function(firstRow, lastRow) {
        if (this.end.row > lastRow)
            var end = {row: lastRow + 1, column: 0};
        else if (this.end.row < firstRow)
            var end = {row: firstRow, column: 0};

        if (this.start.row > lastRow)
            var start = {row: lastRow + 1, column: 0};
        else if (this.start.row < firstRow)
            var start = {row: firstRow, column: 0};

        return Range.fromPoints(start || this.start, end || this.end);
    };
    this.extend = function(row, column) {
        var cmp = this.compare(row, column);

        if (cmp == 0)
            return this;
        else if (cmp == -1)
            var start = {row: row, column: column};
        else
            var end = {row: row, column: column};

        return Range.fromPoints(start || this.start, end || this.end);
    };

    this.isEmpty = function() {
        return (this.start.row === this.end.row && this.start.column === this.end.column);
    };
    this.isMultiLine = function() {
        return (this.start.row !== this.end.row);
    };
    this.clone = function() {
        return Range.fromPoints(this.start, this.end);
    };
    this.collapseRows = function() {
        if (this.end.column == 0)
            return new Range(this.start.row, 0, Math.max(this.start.row, this.end.row-1), 0)
        else
            return new Range(this.start.row, 0, this.end.row, 0)
    };
    this.toScreenRange = function(session) {
        var screenPosStart = session.documentToScreenPosition(this.start);
        var screenPosEnd = session.documentToScreenPosition(this.end);

        return new Range(
            screenPosStart.row, screenPosStart.column,
            screenPosEnd.row, screenPosEnd.column
        );
    };
    this.moveBy = function(row, column) {
        this.start.row += row;
        this.start.column += column;
        this.end.row += row;
        this.end.column += column;
    };

}).call(Range.prototype);
Range.fromPoints = function(start, end) {
    return new Range(start.row, start.column, end.row, end.column);
};
Range.comparePoints = comparePoints;

Range.comparePoints = function(p1, p2) {
    return p1.row - p2.row || p1.column - p2.column;
};


exports.Range = Range;
});

define("ace/apply_delta",["require","exports","module"], function(require, exports, module) {
"use strict";

function throwDeltaError(delta, errorText){
    console.log("Invalid Delta:", delta);
    throw "Invalid Delta: " + errorText;
}

function positionInDocument(docLines, position) {
    return position.row    >= 0 && position.row    <  docLines.length &&
           position.column >= 0 && position.column <= docLines[position.row].length;
}

function validateDelta(docLines, delta) {
    if (delta.action != "insert" && delta.action != "remove")
        throwDeltaError(delta, "delta.action must be 'insert' or 'remove'");
    if (!(delta.lines instanceof Array))
        throwDeltaError(delta, "delta.lines must be an Array");
    if (!delta.start || !delta.end)
       throwDeltaError(delta, "delta.start/end must be an present");
    var start = delta.start;
    if (!positionInDocument(docLines, delta.start))
        throwDeltaError(delta, "delta.start must be contained in document");
    var end = delta.end;
    if (delta.action == "remove" && !positionInDocument(docLines, end))
        throwDeltaError(delta, "delta.end must contained in document for 'remove' actions");
    var numRangeRows = end.row - start.row;
    var numRangeLastLineChars = (end.column - (numRangeRows == 0 ? start.column : 0));
    if (numRangeRows != delta.lines.length - 1 || delta.lines[numRangeRows].length != numRangeLastLineChars)
        throwDeltaError(delta, "delta.range must match delta lines");
}

exports.applyDelta = function(docLines, delta, doNotValidate) {
    
    var row = delta.start.row;
    var startColumn = delta.start.column;
    var line = docLines[row] || "";
    switch (delta.action) {
        case "insert":
            var lines = delta.lines;
            if (lines.length === 1) {
                docLines[row] = line.substring(0, startColumn) + delta.lines[0] + line.substring(startColumn);
            } else {
                var args = [row, 1].concat(delta.lines);
                docLines.splice.apply(docLines, args);
                docLines[row] = line.substring(0, startColumn) + docLines[row];
                docLines[row + delta.lines.length - 1] += line.substring(startColumn);
            }
            break;
        case "remove":
            var endColumn = delta.end.column;
            var endRow = delta.end.row;
            if (row === endRow) {
                docLines[row] = line.substring(0, startColumn) + line.substring(endColumn);
            } else {
                docLines.splice(
                    row, endRow - row + 1,
                    line.substring(0, startColumn) + docLines[endRow].substring(endColumn)
                );
            }
            break;
    }
}
});

define("ace/lib/event_emitter",["require","exports","module"], function(require, exports, module) {
"use strict";

var EventEmitter = {};
var stopPropagation = function() { this.propagationStopped = true; };
var preventDefault = function() { this.defaultPrevented = true; };

EventEmitter._emit =
EventEmitter._dispatchEvent = function(eventName, e) {
    this._eventRegistry || (this._eventRegistry = {});
    this._defaultHandlers || (this._defaultHandlers = {});

    var listeners = this._eventRegistry[eventName] || [];
    var defaultHandler = this._defaultHandlers[eventName];
    if (!listeners.length && !defaultHandler)
        return;

    if (typeof e != "object" || !e)
        e = {};

    if (!e.type)
        e.type = eventName;
    if (!e.stopPropagation)
        e.stopPropagation = stopPropagation;
    if (!e.preventDefault)
        e.preventDefault = preventDefault;

    listeners = listeners.slice();
    for (var i=0; i<listeners.length; i++) {
        listeners[i](e, this);
        if (e.propagationStopped)
            break;
    }
    
    if (defaultHandler && !e.defaultPrevented)
        return defaultHandler(e, this);
};


EventEmitter._signal = function(eventName, e) {
    var listeners = (this._eventRegistry || {})[eventName];
    if (!listeners)
        return;
    listeners = listeners.slice();
    for (var i=0; i<listeners.length; i++)
        listeners[i](e, this);
};

EventEmitter.once = function(eventName, callback) {
    var _self = this;
    callback && this.addEventListener(eventName, function newCallback() {
        _self.removeEventListener(eventName, newCallback);
        callback.apply(null, arguments);
    });
};


EventEmitter.setDefaultHandler = function(eventName, callback) {
    var handlers = this._defaultHandlers
    if (!handlers)
        handlers = this._defaultHandlers = {_disabled_: {}};
    
    if (handlers[eventName]) {
        var old = handlers[eventName];
        var disabled = handlers._disabled_[eventName];
        if (!disabled)
            handlers._disabled_[eventName] = disabled = [];
        disabled.push(old);
        var i = disabled.indexOf(callback);
        if (i != -1) 
            disabled.splice(i, 1);
    }
    handlers[eventName] = callback;
};
EventEmitter.removeDefaultHandler = function(eventName, callback) {
    var handlers = this._defaultHandlers
    if (!handlers)
        return;
    var disabled = handlers._disabled_[eventName];
    
    if (handlers[eventName] == callback) {
        var old = handlers[eventName];
        if (disabled)
            this.setDefaultHandler(eventName, disabled.pop());
    } else if (disabled) {
        var i = disabled.indexOf(callback);
        if (i != -1)
            disabled.splice(i, 1);
    }
};

EventEmitter.on =
EventEmitter.addEventListener = function(eventName, callback, capturing) {
    this._eventRegistry = this._eventRegistry || {};

    var listeners = this._eventRegistry[eventName];
    if (!listeners)
        listeners = this._eventRegistry[eventName] = [];

    if (listeners.indexOf(callback) == -1)
        listeners[capturing ? "unshift" : "push"](callback);
    return callback;
};

EventEmitter.off =
EventEmitter.removeListener =
EventEmitter.removeEventListener = function(eventName, callback) {
    this._eventRegistry = this._eventRegistry || {};

    var listeners = this._eventRegistry[eventName];
    if (!listeners)
        return;

    var index = listeners.indexOf(callback);
    if (index !== -1)
        listeners.splice(index, 1);
};

EventEmitter.removeAllListeners = function(eventName) {
    if (this._eventRegistry) this._eventRegistry[eventName] = [];
};

exports.EventEmitter = EventEmitter;

});

define("ace/anchor",["require","exports","module","ace/lib/oop","ace/lib/event_emitter"], function(require, exports, module) {
"use strict";

var oop = require("./lib/oop");
var EventEmitter = require("./lib/event_emitter").EventEmitter;

var Anchor = exports.Anchor = function(doc, row, column) {
    this.$onChange = this.onChange.bind(this);
    this.attach(doc);
    
    if (typeof column == "undefined")
        this.setPosition(row.row, row.column);
    else
        this.setPosition(row, column);
};

(function() {

    oop.implement(this, EventEmitter);
    this.getPosition = function() {
        return this.$clipPositionToDocument(this.row, this.column);
    };
    this.getDocument = function() {
        return this.document;
    };
    this.$insertRight = false;
    this.onChange = function(delta) {
        if (delta.start.row == delta.end.row && delta.start.row != this.row)
            return;

        if (delta.start.row > this.row)
            return;
            
        var point = $getTransformedPoint(delta, {row: this.row, column: this.column}, this.$insertRight);
        this.setPosition(point.row, point.column, true);
    };
    
    function $pointsInOrder(point1, point2, equalPointsInOrder) {
        var bColIsAfter = equalPointsInOrder ? point1.column <= point2.column : point1.column < point2.column;
        return (point1.row < point2.row) || (point1.row == point2.row && bColIsAfter);
    }
            
    function $getTransformedPoint(delta, point, moveIfEqual) {
        var deltaIsInsert = delta.action == "insert";
        var deltaRowShift = (deltaIsInsert ? 1 : -1) * (delta.end.row    - delta.start.row);
        var deltaColShift = (deltaIsInsert ? 1 : -1) * (delta.end.column - delta.start.column);
        var deltaStart = delta.start;
        var deltaEnd = deltaIsInsert ? deltaStart : delta.end; // Collapse insert range.
        if ($pointsInOrder(point, deltaStart, moveIfEqual)) {
            return {
                row: point.row,
                column: point.column
            };
        }
        if ($pointsInOrder(deltaEnd, point, !moveIfEqual)) {
            return {
                row: point.row + deltaRowShift,
                column: point.column + (point.row == deltaEnd.row ? deltaColShift : 0)
            };
        }
        
        return {
            row: deltaStart.row,
            column: deltaStart.column
        };
    }
    this.setPosition = function(row, column, noClip) {
        var pos;
        if (noClip) {
            pos = {
                row: row,
                column: column
            };
        } else {
            pos = this.$clipPositionToDocument(row, column);
        }

        if (this.row == pos.row && this.column == pos.column)
            return;

        var old = {
            row: this.row,
            column: this.column
        };

        this.row = pos.row;
        this.column = pos.column;
        this._signal("change", {
            old: old,
            value: pos
        });
    };
    this.detach = function() {
        this.document.removeEventListener("change", this.$onChange);
    };
    this.attach = function(doc) {
        this.document = doc || this.document;
        this.document.on("change", this.$onChange);
    };
    this.$clipPositionToDocument = function(row, column) {
        var pos = {};

        if (row >= this.document.getLength()) {
            pos.row = Math.max(0, this.document.getLength() - 1);
            pos.column = this.document.getLine(pos.row).length;
        }
        else if (row < 0) {
            pos.row = 0;
            pos.column = 0;
        }
        else {
            pos.row = row;
            pos.column = Math.min(this.document.getLine(pos.row).length, Math.max(0, column));
        }

        if (column < 0)
            pos.column = 0;

        return pos;
    };

}).call(Anchor.prototype);

});

define("ace/document",["require","exports","module","ace/lib/oop","ace/apply_delta","ace/lib/event_emitter","ace/range","ace/anchor"], function(require, exports, module) {
"use strict";

var oop = require("./lib/oop");
var applyDelta = require("./apply_delta").applyDelta;
var EventEmitter = require("./lib/event_emitter").EventEmitter;
var Range = require("./range").Range;
var Anchor = require("./anchor").Anchor;

var Document = function(textOrLines) {
    this.$lines = [""];
    if (textOrLines.length === 0) {
        this.$lines = [""];
    } else if (Array.isArray(textOrLines)) {
        this.insertMergedLines({row: 0, column: 0}, textOrLines);
    } else {
        this.insert({row: 0, column:0}, textOrLines);
    }
};

(function() {

    oop.implement(this, EventEmitter);
    this.setValue = function(text) {
        var len = this.getLength() - 1;
        this.remove(new Range(0, 0, len, this.getLine(len).length));
        this.insert({row: 0, column: 0}, text);
    };
    this.getValue = function() {
        return this.getAllLines().join(this.getNewLineCharacter());
    };
    this.createAnchor = function(row, column) {
        return new Anchor(this, row, column);
    };
    if ("aaa".split(/a/).length === 0) {
        this.$split = function(text) {
            return text.replace(/\r\n|\r/g, "\n").split("\n");
        };
    } else {
        this.$split = function(text) {
            return text.split(/\r\n|\r|\n/);
        };
    }


    this.$detectNewLine = function(text) {
        var match = text.match(/^.*?(\r\n|\r|\n)/m);
        this.$autoNewLine = match ? match[1] : "\n";
        this._signal("changeNewLineMode");
    };
    this.getNewLineCharacter = function() {
        switch (this.$newLineMode) {
          case "windows":
            return "\r\n";
          case "unix":
            return "\n";
          default:
            return this.$autoNewLine || "\n";
        }
    };

    this.$autoNewLine = "";
    this.$newLineMode = "auto";
    this.setNewLineMode = function(newLineMode) {
        if (this.$newLineMode === newLineMode)
            return;

        this.$newLineMode = newLineMode;
        this._signal("changeNewLineMode");
    };
    this.getNewLineMode = function() {
        return this.$newLineMode;
    };
    this.isNewLine = function(text) {
        return (text == "\r\n" || text == "\r" || text == "\n");
    };
    this.getLine = function(row) {
        return this.$lines[row] || "";
    };
    this.getLines = function(firstRow, lastRow) {
        return this.$lines.slice(firstRow, lastRow + 1);
    };
    this.getAllLines = function() {
        return this.getLines(0, this.getLength());
    };
    this.getLength = function() {
        return this.$lines.length;
    };
    this.getTextRange = function(range) {
        return this.getLinesForRange(range).join(this.getNewLineCharacter());
    };
    this.getLinesForRange = function(range) {
        var lines;
        if (range.start.row === range.end.row) {
            lines = [this.getLine(range.start.row).substring(range.start.column, range.end.column)];
        } else {
            lines = this.getLines(range.start.row, range.end.row);
            lines[0] = (lines[0] || "").substring(range.start.column);
            var l = lines.length - 1;
            if (range.end.row - range.start.row == l)
                lines[l] = lines[l].substring(0, range.end.column);
        }
        return lines;
    };
    this.insertLines = function(row, lines) {
        console.warn("Use of document.insertLines is deprecated. Use the insertFullLines method instead.");
        return this.insertFullLines(row, lines);
    };
    this.removeLines = function(firstRow, lastRow) {
        console.warn("Use of document.removeLines is deprecated. Use the removeFullLines method instead.");
        return this.removeFullLines(firstRow, lastRow);
    };
    this.insertNewLine = function(position) {
        console.warn("Use of document.insertNewLine is deprecated. Use insertMergedLines(position, [\'\', \'\']) instead.");
        return this.insertMergedLines(position, ["", ""]);
    };
    this.insert = function(position, text) {
        if (this.getLength() <= 1)
            this.$detectNewLine(text);
        
        return this.insertMergedLines(position, this.$split(text));
    };
    this.insertInLine = function(position, text) {
        var start = this.clippedPos(position.row, position.column);
        var end = this.pos(position.row, position.column + text.length);
        
        this.applyDelta({
            start: start,
            end: end,
            action: "insert",
            lines: [text]
        }, true);
        
        return this.clonePos(end);
    };
    
    this.clippedPos = function(row, column) {
        var length = this.getLength();
        if (row === undefined) {
            row = length;
        } else if (row < 0) {
            row = 0;
        } else if (row >= length) {
            row = length - 1;
            column = undefined;
        }
        var line = this.getLine(row);
        if (column == undefined)
            column = line.length;
        column = Math.min(Math.max(column, 0), line.length);
        return {row: row, column: column};
    };
    
    this.clonePos = function(pos) {
        return {row: pos.row, column: pos.column};
    };
    
    this.pos = function(row, column) {
        return {row: row, column: column};
    };
    
    this.$clipPosition = function(position) {
        var length = this.getLength();
        if (position.row >= length) {
            position.row = Math.max(0, length - 1);
            position.column = this.getLine(length - 1).length;
        } else {
            position.row = Math.max(0, position.row);
            position.column = Math.min(Math.max(position.column, 0), this.getLine(position.row).length);
        }
        return position;
    };
    this.insertFullLines = function(row, lines) {
        row = Math.min(Math.max(row, 0), this.getLength());
        var column = 0;
        if (row < this.getLength()) {
            lines = lines.concat([""]);
            column = 0;
        } else {
            lines = [""].concat(lines);
            row--;
            column = this.$lines[row].length;
        }
        this.insertMergedLines({row: row, column: column}, lines);
    };    
    this.insertMergedLines = function(position, lines) {
        var start = this.clippedPos(position.row, position.column);
        var end = {
            row: start.row + lines.length - 1,
            column: (lines.length == 1 ? start.column : 0) + lines[lines.length - 1].length
        };
        
        this.applyDelta({
            start: start,
            end: end,
            action: "insert",
            lines: lines
        });
        
        return this.clonePos(end);
    };
    this.remove = function(range) {
        var start = this.clippedPos(range.start.row, range.start.column);
        var end = this.clippedPos(range.end.row, range.end.column);
        this.applyDelta({
            start: start,
            end: end,
            action: "remove",
            lines: this.getLinesForRange({start: start, end: end})
        });
        return this.clonePos(start);
    };
    this.removeInLine = function(row, startColumn, endColumn) {
        var start = this.clippedPos(row, startColumn);
        var end = this.clippedPos(row, endColumn);
        
        this.applyDelta({
            start: start,
            end: end,
            action: "remove",
            lines: this.getLinesForRange({start: start, end: end})
        }, true);
        
        return this.clonePos(start);
    };
    this.removeFullLines = function(firstRow, lastRow) {
        firstRow = Math.min(Math.max(0, firstRow), this.getLength() - 1);
        lastRow  = Math.min(Math.max(0, lastRow ), this.getLength() - 1);
        var deleteFirstNewLine = lastRow == this.getLength() - 1 && firstRow > 0;
        var deleteLastNewLine  = lastRow  < this.getLength() - 1;
        var startRow = ( deleteFirstNewLine ? firstRow - 1                  : firstRow                    );
        var startCol = ( deleteFirstNewLine ? this.getLine(startRow).length : 0                           );
        var endRow   = ( deleteLastNewLine  ? lastRow + 1                   : lastRow                     );
        var endCol   = ( deleteLastNewLine  ? 0                             : this.getLine(endRow).length ); 
        var range = new Range(startRow, startCol, endRow, endCol);
        var deletedLines = this.$lines.slice(firstRow, lastRow + 1);
        
        this.applyDelta({
            start: range.start,
            end: range.end,
            action: "remove",
            lines: this.getLinesForRange(range)
        });
        return deletedLines;
    };
    this.removeNewLine = function(row) {
        if (row < this.getLength() - 1 && row >= 0) {
            this.applyDelta({
                start: this.pos(row, this.getLine(row).length),
                end: this.pos(row + 1, 0),
                action: "remove",
                lines: ["", ""]
            });
        }
    };
    this.replace = function(range, text) {
        if (!(range instanceof Range))
            range = Range.fromPoints(range.start, range.end);
        if (text.length === 0 && range.isEmpty())
            return range.start;
        if (text == this.getTextRange(range))
            return range.end;

        this.remove(range);
        var end;
        if (text) {
            end = this.insert(range.start, text);
        }
        else {
            end = range.start;
        }
        
        return end;
    };
    this.applyDeltas = function(deltas) {
        for (var i=0; i<deltas.length; i++) {
            this.applyDelta(deltas[i]);
        }
    };
    this.revertDeltas = function(deltas) {
        for (var i=deltas.length-1; i>=0; i--) {
            this.revertDelta(deltas[i]);
        }
    };
    this.applyDelta = function(delta, doNotValidate) {
        var isInsert = delta.action == "insert";
        if (isInsert ? delta.lines.length <= 1 && !delta.lines[0]
            : !Range.comparePoints(delta.start, delta.end)) {
            return;
        }
        
        if (isInsert && delta.lines.length > 20000)
            this.$splitAndapplyLargeDelta(delta, 20000);
        applyDelta(this.$lines, delta, doNotValidate);
        this._signal("change", delta);
    };
    
    this.$splitAndapplyLargeDelta = function(delta, MAX) {
        var lines = delta.lines;
        var l = lines.length;
        var row = delta.start.row; 
        var column = delta.start.column;
        var from = 0, to = 0;
        do {
            from = to;
            to += MAX - 1;
            var chunk = lines.slice(from, to);
            if (to > l) {
                delta.lines = chunk;
                delta.start.row = row + from;
                delta.start.column = column;
                break;
            }
            chunk.push("");
            this.applyDelta({
                start: this.pos(row + from, column),
                end: this.pos(row + to, column = 0),
                action: delta.action,
                lines: chunk
            }, true);
        } while(true);
    };
    this.revertDelta = function(delta) {
        this.applyDelta({
            start: this.clonePos(delta.start),
            end: this.clonePos(delta.end),
            action: (delta.action == "insert" ? "remove" : "insert"),
            lines: delta.lines.slice()
        });
    };
    this.indexToPosition = function(index, startRow) {
        var lines = this.$lines || this.getAllLines();
        var newlineLength = this.getNewLineCharacter().length;
        for (var i = startRow || 0, l = lines.length; i < l; i++) {
            index -= lines[i].length + newlineLength;
            if (index < 0)
                return {row: i, column: index + lines[i].length + newlineLength};
        }
        return {row: l-1, column: lines[l-1].length};
    };
    this.positionToIndex = function(pos, startRow) {
        var lines = this.$lines || this.getAllLines();
        var newlineLength = this.getNewLineCharacter().length;
        var index = 0;
        var row = Math.min(pos.row, lines.length);
        for (var i = startRow || 0; i < row; ++i)
            index += lines[i].length + newlineLength;

        return index + pos.column;
    };

}).call(Document.prototype);

exports.Document = Document;
});

define("ace/worker/mirror",["require","exports","module","ace/range","ace/document","ace/lib/lang"], function(require, exports, module) {
"use strict";

var Range = require("../range").Range;
var Document = require("../document").Document;
var lang = require("../lib/lang");
    
var Mirror = exports.Mirror = function(sender) {
    this.sender = sender;
    var doc = this.doc = new Document("");
    
    var deferredUpdate = this.deferredUpdate = lang.delayedCall(this.onUpdate.bind(this));
    
    var _self = this;
    sender.on("change", function(e) {
        var data = e.data;
        if (data[0].start) {
            doc.applyDeltas(data);
        } else {
            for (var i = 0; i < data.length; i += 2) {
                if (Array.isArray(data[i+1])) {
                    var d = {action: "insert", start: data[i], lines: data[i+1]};
                } else {
                    var d = {action: "remove", start: data[i], end: data[i+1]};
                }
                doc.applyDelta(d, true);
            }
        }
        if (_self.$timeout)
            return deferredUpdate.schedule(_self.$timeout);
        _self.onUpdate();
    });
};

(function() {
    
    this.$timeout = 500;
    
    this.setTimeout = function(timeout) {
        this.$timeout = timeout;
    };
    
    this.setValue = function(value) {
        this.doc.setValue(value);
        this.deferredUpdate.schedule(this.$timeout);
    };
    
    this.getValue = function(callbackId) {
        this.sender.callback(this.doc.getValue(), callbackId);
    };
	
    this.onUpdate = function() {
    };
    this.isPending = function() {
        return this.deferredUpdate.isPending();
    };
    
}).call(Mirror.prototype);

});

define("ace/mode/html/saxparser",["require","exports","module"], function(require, exports, module) {
module.exports = (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({
1:[function(_dereq_,module,exports){
function isScopeMarker(node) {
	if (node.namespaceURI === "http://www.w3.org/1999/xhtml") {
		return node.localName === "applet"
			|| node.localName === "caption"
			|| node.localName === "marquee"
			|| node.localName === "object"
			|| node.localName === "table"
			|| node.localName === "td"
			|| node.localName === "th";
	}
	if (node.namespaceURI === "http://www.w3.org/1998/Math/MathML") {
		return node.localName === "mi"
			|| node.localName === "mo"
			|| node.localName === "mn"
			|| node.localName === "ms"
			|| node.localName === "mtext"
			|| node.localName === "annotation-xml";
	}
	if (node.namespaceURI === "http://www.w3.org/2000/svg") {
		return node.localName === "foreignObject"
			|| node.localName === "desc"
			|| node.localName === "title";
	}
}

function isListItemScopeMarker(node) {
	return isScopeMarker(node)
		|| (node.namespaceURI === "http://www.w3.org/1999/xhtml" && node.localName === 'ol')
		|| (node.namespaceURI === "http://www.w3.org/1999/xhtml" && node.localName === 'ul');
}

function isTableScopeMarker(node) {
	return (node.namespaceURI === "http://www.w3.org/1999/xhtml" && node.localName === 'table')
		|| (node.namespaceURI === "http://www.w3.org/1999/xhtml" && node.localName === 'html');
}

function isTableBodyScopeMarker(node) {
	return (node.namespaceURI === "http://www.w3.org/1999/xhtml" && node.localName === 'tbody')
		|| (node.namespaceURI === "http://www.w3.org/1999/xhtml" && node.localName === 'tfoot')
		|| (node.namespaceURI === "http://www.w3.org/1999/xhtml" && node.localName === 'thead')
		|| (node.namespaceURI === "http://www.w3.org/1999/xhtml" && node.localName === 'html');
}

function isTableRowScopeMarker(node) {
	return (node.namespaceURI === "http://www.w3.org/1999/xhtml" && node.localName === 'tr')
		|| (node.namespaceURI === "http://www.w3.org/1999/xhtml" && node.localName === 'html');
}

function isButtonScopeMarker(node) {
	return isScopeMarker(node)
		|| (node.namespaceURI === "http://www.w3.org/1999/xhtml" && node.localName === 'button');
}

function isSelectScopeMarker(node) {
	return !(node.namespaceURI === "http://www.w3.org/1999/xhtml" && node.localName === 'optgroup')
		&& !(node.namespaceURI === "http://www.w3.org/1999/xhtml" && node.localName === 'option');
}
function ElementStack() {
	this.elements = [];
	this.rootNode = null;
	this.headElement = null;
	this.bodyElement = null;
}
ElementStack.prototype._inScope = function(localName, isMarker) {
	for (var i = this.elements.length - 1; i >= 0; i--) {
		var node = this.elements[i];
		if (node.localName === localName)
			return true;
		if (isMarker(node))
			return false;
	}
};
ElementStack.prototype.push = function(item) {
	this.elements.push(item);
};
ElementStack.prototype.pushHtmlElement = function(item) {
	this.rootNode = item.node;
	this.push(item);
};
ElementStack.prototype.pushHeadElement = function(item) {
	this.headElement = item.node;
	this.push(item);
};
ElementStack.prototype.pushBodyElement = function(item) {
	this.bodyElement = item.node;
	this.push(item);
};
ElementStack.prototype.pop = function() {
	return this.elements.pop();
};
ElementStack.prototype.remove = function(item) {
	this.elements.splice(this.elements.indexOf(item), 1);
};
ElementStack.prototype.popUntilPopped = function(localName) {
	var element;
	do {
		element = this.pop();
	} while (element.localName != localName);
};

ElementStack.prototype.popUntilTableScopeMarker = function() {
	while (!isTableScopeMarker(this.top))
		this.pop();
};

ElementStack.prototype.popUntilTableBodyScopeMarker = function() {
	while (!isTableBodyScopeMarker(this.top))
		this.pop();
};

ElementStack.prototype.popUntilTableRowScopeMarker = function() {
	while (!isTableRowScopeMarker(this.top))
		this.pop();
};
ElementStack.prototype.item = function(index) {
	return this.elements[index];
};
ElementStack.prototype.contains = function(element) {
	return this.elements.indexOf(element) !== -1;
};
ElementStack.prototype.inScope = function(localName) {
	return this._inScope(localName, isScopeMarker);
};
ElementStack.prototype.inListItemScope = function(localName) {
	return this._inScope(localName, isListItemScopeMarker);
};
ElementStack.prototype.inTableScope = function(localName) {
	return this._inScope(localName, isTableScopeMarker);
};
ElementStack.prototype.inButtonScope = function(localName) {
	return this._inScope(localName, isButtonScopeMarker);
};
ElementStack.prototype.inSelectScope = function(localName) {
	return this._inScope(localName, isSelectScopeMarker);
};
ElementStack.prototype.hasNumberedHeaderElementInScope = function() {
	for (var i = this.elements.length - 1; i >= 0; i--) {
		var node = this.elements[i];
		if (node.isNumberedHeader())
			return true;
		if (isScopeMarker(node))
			return false;
	}
};
ElementStack.prototype.furthestBlockForFormattingElement = function(element) {
	var furthestBlock = null;
	for (var i = this.elements.length - 1; i >= 0; i--) {
		var node = this.elements[i];
		if (node.node === element)
			break;
		if (node.isSpecial())
			furthestBlock = node;
	}
    return furthestBlock;
};
ElementStack.prototype.findIndex = function(localName) {
	for (var i = this.elements.length - 1; i >= 0; i--) {
		if (this.elements[i].localName == localName)
			return i;
	}
    return -1;
};

ElementStack.prototype.remove_openElements_until = function(callback) {
	var finished = false;
	var element;
	while (!finished) {
		element = this.elements.pop();
		finished = callback(element);
	}
	return element;
};

Object.defineProperty(ElementStack.prototype, 'top', {
	get: function() {
		return this.elements[this.elements.length - 1];
	}
});

Object.defineProperty(ElementStack.prototype, 'length', {
	get: function() {
		return this.elements.length;
	}
});

exports.ElementStack = ElementStack;

},
{}],
2:[function(_dereq_,module,exports){
var entities  = _dereq_('html5-entities');
var InputStream = _dereq_('./InputStream').InputStream;

var namedEntityPrefixes = {};
Object.keys(entities).forEach(function (entityKey) {
	for (var i = 0; i < entityKey.length; i++) {
		namedEntityPrefixes[entityKey.substring(0, i + 1)] = true;
	}
});

function isAlphaNumeric(c) {
	return (c >= '0' && c <= '9') || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
}

function isHexDigit(c) {
	return (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
}

function isDecimalDigit(c) {
	return (c >= '0' && c <= '9');
}

var EntityParser = {};

EntityParser.consumeEntity = function(buffer, tokenizer, additionalAllowedCharacter) {
	var decodedCharacter = '';
	var consumedCharacters = '';
	var ch = buffer.char();
	if (ch === InputStream.EOF)
		return false;
	consumedCharacters += ch;
	if (ch == '\t' || ch == '\n' || ch == '\v' || ch == ' ' || ch == '<' || ch == '&') {
		buffer.unget(consumedCharacters);
		return false;
	}
	if (additionalAllowedCharacter === ch) {
		buffer.unget(consumedCharacters);
		return false;
	}
	if (ch == '#') {
		ch = buffer.shift(1);
		if (ch === InputStream.EOF) {
			tokenizer._parseError("expected-numeric-entity-but-got-eof");
			buffer.unget(consumedCharacters);
			return false;
		}
		consumedCharacters += ch;
		var radix = 10;
		var isDigit = isDecimalDigit;
		if (ch == 'x' || ch == 'X') {
			radix = 16;
			isDigit = isHexDigit;
			ch = buffer.shift(1);
			if (ch === InputStream.EOF) {
				tokenizer._parseError("expected-numeric-entity-but-got-eof");
				buffer.unget(consumedCharacters);
				return false;
			}
			consumedCharacters += ch;
		}
		if (isDigit(ch)) {
			var code = '';
			while (ch !== InputStream.EOF && isDigit(ch)) {
				code += ch;
				ch = buffer.char();
			}
			code = parseInt(code, radix);
			var replacement = this.replaceEntityNumbers(code);
			if (replacement) {
				tokenizer._parseError("invalid-numeric-entity-replaced");
				code = replacement;
			}
			if (code > 0xFFFF && code <= 0x10FFFF) {
		        code -= 0x10000;
		        var first = ((0xffc00 & code) >> 10) + 0xD800;
		        var second = (0x3ff & code) + 0xDC00;
				decodedCharacter = String.fromCharCode(first, second);
			} else
				decodedCharacter = String.fromCharCode(code);
			if (ch !== ';') {
				tokenizer._parseError("numeric-entity-without-semicolon");
				buffer.unget(ch);
			}
			return decodedCharacter;
		}
		buffer.unget(consumedCharacters);
		tokenizer._parseError("expected-numeric-entity");
		return false;
	}
	if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
		var mostRecentMatch = '';
		while (namedEntityPrefixes[consumedCharacters]) {
			if (entities[consumedCharacters]) {
				mostRecentMatch = consumedCharacters;
			}
			if (ch == ';')
				break;
			ch = buffer.char();
			if (ch === InputStream.EOF)
				break;
			consumedCharacters += ch;
		}
		if (!mostRecentMatch) {
			tokenizer._parseError("expected-named-entity");
			buffer.unget(consumedCharacters);
			return false;
		}
		decodedCharacter = entities[mostRecentMatch];
		if (ch === ';' || !additionalAllowedCharacter || !(isAlphaNumeric(ch) || ch === '=')) {
			if (consumedCharacters.length > mostRecentMatch.length) {
				buffer.unget(consumedCharacters.substring(mostRecentMatch.length));
			}
			if (ch !== ';') {
				tokenizer._parseError("named-entity-without-semicolon");
			}
			return decodedCharacter;
		}
		buffer.unget(consumedCharacters);
		return false;
	}
};

EntityParser.replaceEntityNumbers = function(c) {
	switch(c) {
		case 0x00: return 0xFFFD; // REPLACEMENT CHARACTER
		case 0x13: return 0x0010; // Carriage return
		case 0x80: return 0x20AC; // EURO SIGN
		case 0x81: return 0x0081; // <control>
		case 0x82: return 0x201A; // SINGLE LOW-9 QUOTATION MARK
		case 0x83: return 0x0192; // LATIN SMALL LETTER F WITH HOOK
		case 0x84: return 0x201E; // DOUBLE LOW-9 QUOTATION MARK
		case 0x85: return 0x2026; // HORIZONTAL ELLIPSIS
		case 0x86: return 0x2020; // DAGGER
		case 0x87: return 0x2021; // DOUBLE DAGGER
		case 0x88: return 0x02C6; // MODIFIER LETTER CIRCUMFLEX ACCENT
		case 0x89: return 0x2030; // PER MILLE SIGN
		case 0x8A: return 0x0160; // LATIN CAPITAL LETTER S WITH CARON
		case 0x8B: return 0x2039; // SINGLE LEFT-POINTING ANGLE QUOTATION MARK
		case 0x8C: return 0x0152; // LATIN CAPITAL LIGATURE OE
		case 0x8D: return 0x008D; // <control>
		case 0x8E: return 0x017D; // LATIN CAPITAL LETTER Z WITH CARON
		case 0x8F: return 0x008F; // <control>
		case 0x90: return 0x0090; // <control>
		case 0x91: return 0x2018; // LEFT SINGLE QUOTATION MARK
		case 0x92: return 0x2019; // RIGHT SINGLE QUOTATION MARK
		case 0x93: return 0x201C; // LEFT DOUBLE QUOTATION MARK
		case 0x94: return 0x201D; // RIGHT DOUBLE QUOTATION MARK
		case 0x95: return 0x2022; // BULLET
		case 0x96: return 0x2013; // EN DASH
		case 0x97: return 0x2014; // EM DASH
		case 0x98: return 0x02DC; // SMALL TILDE
		case 0x99: return 0x2122; // TRADE MARK SIGN
		case 0x9A: return 0x0161; // LATIN SMALL LETTER S WITH CARON
		case 0x9B: return 0x203A; // SINGLE RIGHT-POINTING ANGLE QUOTATION MARK
		case 0x9C: return 0x0153; // LATIN SMALL LIGATURE OE
		case 0x9D: return 0x009D; // <control>
		case 0x9E: return 0x017E; // LATIN SMALL LETTER Z WITH CARON
		case 0x9F: return 0x0178; // LATIN CAPITAL LETTER Y WITH DIAERESIS
		default:
			if ((c >= 0xD800 && c <= 0xDFFF) || c > 0x10FFFF) {
				return 0xFFFD;
			} else if ((c >= 0x0001 && c <= 0x0008) || (c >= 0x000E && c <= 0x001F) ||
				(c >= 0x007F && c <= 0x009F) || (c >= 0xFDD0 && c <= 0xFDEF) ||
				c == 0x000B || c == 0xFFFE || c == 0x1FFFE || c == 0x2FFFFE ||
				c == 0x2FFFF || c == 0x3FFFE || c == 0x3FFFF || c == 0x4FFFE ||
				c == 0x4FFFF || c == 0x5FFFE || c == 0x5FFFF || c == 0x6FFFE ||
				c == 0x6FFFF || c == 0x7FFFE || c == 0x7FFFF || c == 0x8FFFE ||
				c == 0x8FFFF || c == 0x9FFFE || c == 0x9FFFF || c == 0xAFFFE ||
				c == 0xAFFFF || c == 0xBFFFE || c == 0xBFFFF || c == 0xCFFFE ||
				c == 0xCFFFF || c == 0xDFFFE || c == 0xDFFFF || c == 0xEFFFE ||
				c == 0xEFFFF || c == 0xFFFFE || c == 0xFFFFF || c == 0x10FFFE ||
				c == 0x10FFFF) {
				return c;
			}
	}
};

exports.EntityParser = EntityParser;

},
{"./InputStream":3,"html5-entities":12}],
3:[function(_dereq_,module,exports){
function InputStream() {
	this.data = '';
	this.start = 0;
	this.committed = 0;
	this.eof = false;
	this.lastLocation = {line: 0, column: 0};
}

InputStream.EOF = -1;

InputStream.DRAIN = -2;

InputStream.prototype = {
	slice: function() {
		if(this.start >= this.data.length) {
			if(!this.eof) throw InputStream.DRAIN;
			return InputStream.EOF;
		}
		return this.data.slice(this.start, this.data.length);
	},
	char: function() {
		if(!this.eof && this.start >= this.data.length - 1) throw InputStream.DRAIN;
		if(this.start >= this.data.length) {
			return InputStream.EOF;
		}
		var ch = this.data[this.start++];
		if (ch === '\r')
			ch = '\n';
		return ch;
	},
	advance: function(amount) {
		this.start += amount;
		if(this.start >= this.data.length) {
			if(!this.eof) throw InputStream.DRAIN;
			return InputStream.EOF;
		} else {
			if(this.committed > this.data.length / 2) {
				this.lastLocation = this.location();
				this.data = this.data.slice(this.committed);
				this.start = this.start - this.committed;
				this.committed = 0;
			}
		}
	},
	matchWhile: function(re) {
		if(this.eof && this.start >= this.data.length ) return '';
		var r = new RegExp("^"+re+"+");
		var m = r.exec(this.slice());
		if(m) {
			if(!this.eof && m[0].length == this.data.length - this.start) throw InputStream.DRAIN;
			this.advance(m[0].length);
			return m[0];
		} else {
			return '';
		}
	},
	matchUntil: function(re) {
		var m, s;
		s = this.slice();
		if(s === InputStream.EOF) {
			return '';
		} else if(m = new RegExp(re + (this.eof ? "|$" : "")).exec(s)) {
			var t = this.data.slice(this.start, this.start + m.index);
			this.advance(m.index);
			return t.replace(/\r/g, '\n').replace(/\n{2,}/g, '\n');
		} else {
			throw InputStream.DRAIN;
		}
	},
	append: function(data) {
		this.data += data;
	},
	shift: function(n) {
		if(!this.eof && this.start + n >= this.data.length) throw InputStream.DRAIN;
		if(this.eof && this.start >= this.data.length) return InputStream.EOF;
		var d = this.data.slice(this.start, this.start + n).toString();
		this.advance(Math.min(n, this.data.length - this.start));
		return d;
	},
	peek: function(n) {
		if(!this.eof && this.start + n >= this.data.length) throw InputStream.DRAIN;
		if(this.eof && this.start >= this.data.length) return InputStream.EOF;
		return this.data.slice(this.start, Math.min(this.start + n, this.data.length)).toString();
	},
	length: function() {
		return this.data.length - this.start - 1;
	},
	unget: function(d) {
		if(d === InputStream.EOF) return;
		this.start -= (d.length);
	},
	undo: function() {
		this.start = this.committed;
	},
	commit: function() {
		this.committed = this.start;
	},
	location: function() {
		var lastLine = this.lastLocation.line;
		var lastColumn = this.lastLocation.column;
		var read = this.data.slice(0, this.committed);
		var newlines = read.match(/\n/g);
		var line = newlines ? lastLine + newlines.length : lastLine;
		var column = newlines ? read.length - read.lastIndexOf('\n') - 1 : lastColumn + read.length;
		return {line: line, column: column};
	}
};

exports.InputStream = InputStream;

},
{}],
4:[function(_dereq_,module,exports){
var SpecialElements = {
	"http://www.w3.org/1999/xhtml": [
		'address',
		'applet',
		'area',
		'article',
		'aside',
		'base',
		'basefont',
		'bgsound',
		'blockquote',
		'body',
		'br',
		'button',
		'caption',
		'center',
		'col',
		'colgroup',
		'dd',
		'details',
		'dir',
		'div',
		'dl',
		'dt',
		'embed',
		'fieldset',
		'figcaption',
		'figure',
		'footer',
		'form',
		'frame',
		'frameset',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'head',
		'header',
		'hgroup',
		'hr',
		'html',
		'iframe',
		'img',
		'input',
		'isindex',
		'li',
		'link',
		'listing',
		'main',
		'marquee',
		'menu',
		'menuitem',
		'meta',
		'nav',
		'noembed',
		'noframes',
		'noscript',
		'object',
		'ol',
		'p',
		'param',
		'plaintext',
		'pre',
		'script',
		'section',
		'select',
		'source',
		'style',
		'summary',
		'table',
		'tbody',
		'td',
		'textarea',
		'tfoot',
		'th',
		'thead',
		'title',
		'tr',
		'track',
		'ul',
		'wbr',
		'xmp'
	],
	"http://www.w3.org/1998/Math/MathML": [
		'mi',
		'mo',
		'mn',
		'ms',
		'mtext',
		'annotation-xml'
	],
	"http://www.w3.org/2000/svg": [
		'foreignObject',
		'desc',
		'title'
	]
};


function StackItem(namespaceURI, localName, attributes, node) {
	this.localName = localName;
	this.namespaceURI = namespaceURI;
	this.attributes = attributes;
	this.node = node;
}
StackItem.prototype.isSpecial = function() {
	return this.namespaceURI in SpecialElements &&
		SpecialElements[this.namespaceURI].indexOf(this.localName) > -1;
};

StackItem.prototype.isFosterParenting = function() {
	if (this.namespaceURI === "http://www.w3.org/1999/xhtml") {
		return this.localName === 'table' ||
			this.localName === 'tbody' ||
			this.localName === 'tfoot' ||
			this.localName === 'thead' ||
			this.localName === 'tr';
	}
	return false;
};

StackItem.prototype.isNumberedHeader = function() {
	if (this.namespaceURI === "http://www.w3.org/1999/xhtml") {
		return this.localName === 'h1' ||
			this.localName === 'h2' ||
			this.localName === 'h3' ||
			this.localName === 'h4' ||
			this.localName === 'h5' ||
			this.localName === 'h6';
	}
	return false;
};

StackItem.prototype.isForeign = function() {
	return this.namespaceURI != "http://www.w3.org/1999/xhtml";
};

function getAttribute(item, name) {
	for (var i = 0; i < item.attributes.length; i++) {
		if (item.attributes[i].nodeName == name)
			return item.attributes[i].nodeValue;
	}
	return null;
}

StackItem.prototype.isHtmlIntegrationPoint = function() {
	if (this.namespaceURI === "http://www.w3.org/1998/Math/MathML") {
		if (this.localName !== "annotation-xml")
			return false;
		var encoding = getAttribute(this, 'encoding');
		if (!encoding)
			return false;
		encoding = encoding.toLowerCase();
		return encoding === "text/html" || encoding === "application/xhtml+xml";
	}
	if (this.namespaceURI === "http://www.w3.org/2000/svg") {
		return this.localName === "foreignObject"
			|| this.localName === "desc"
			|| this.localName === "title";
	}
	return false;
};

StackItem.prototype.isMathMLTextIntegrationPoint = function() {
	if (this.namespaceURI === "http://www.w3.org/1998/Math/MathML") {
		return this.localName === "mi"
			|| this.localName === "mo"
			|| this.localName === "mn"
			|| this.localName === "ms"
			|| this.localName === "mtext";
	}
	return false;
};

exports.StackItem = StackItem;

},
{}],
5:[function(_dereq_,module,exports){
var InputStream = _dereq_('./InputStream').InputStream;
var EntityParser = _dereq_('./EntityParser').EntityParser;

function isWhitespace(c){
	return c === " " || c === "\n" || c === "\t" || c === "\r" || c === "\f";
}

function isAlpha(c) {
	return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z');
}
function Tokenizer(tokenHandler) {
	this._tokenHandler = tokenHandler;
	this._state = Tokenizer.DATA;
	this._inputStream = new InputStream();
	this._currentToken = null;
	this._temporaryBuffer = '';
	this._additionalAllowedCharacter = '';
}

Tokenizer.prototype._parseError = function(code, args) {
	this._tokenHandler.parseError(code, args);
};

Tokenizer.prototype._emitToken = function(token) {
	if (token.type === 'StartTag') {
		for (var i = 1; i < token.data.length; i++) {
			if (!token.data[i].nodeName)
				token.data.splice(i--, 1);
		}
	} else if (token.type === 'EndTag') {
		if (token.selfClosing) {
			this._parseError('self-closing-flag-on-end-tag');
		}
		if (token.data.length !== 0) {
			this._parseError('attributes-in-end-tag');
		}
	}
	this._tokenHandler.processToken(token);
	if (token.type === 'StartTag' && token.selfClosing && !this._tokenHandler.isSelfClosingFlagAcknowledged()) {
		this._parseError('non-void-element-with-trailing-solidus', {name: token.name});
	}
};

Tokenizer.prototype._emitCurrentToken = function() {
	this._state = Tokenizer.DATA;
	this._emitToken(this._currentToken);
};

Tokenizer.prototype._currentAttribute = function() {
	return this._currentToken.data[this._currentToken.data.length - 1];
};

Tokenizer.prototype.setState = function(state) {
	this._state = state;
};

Tokenizer.prototype.tokenize = function(source) {
	Tokenizer.DATA = data_state;
	Tokenizer.RCDATA = rcdata_state;
	Tokenizer.RAWTEXT = rawtext_state;
	Tokenizer.SCRIPT_DATA = script_data_state;
	Tokenizer.PLAINTEXT = plaintext_state;


	this._state = Tokenizer.DATA;

	this._inputStream.append(source);

	this._tokenHandler.startTokenization(this);

	this._inputStream.eof = true;

	var tokenizer = this;

	while (this._state.call(this, this._inputStream));


	function data_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._emitToken({type: 'EOF', data: null});
			return false;
		} else if (data === '&') {
			tokenizer.setState(character_reference_in_data_state);
		} else if (data === '<') {
			tokenizer.setState(tag_open_state);
		} else if (data === '\u0000') {
			tokenizer._emitToken({type: 'Characters', data: data});
			buffer.commit();
		} else {
			var chars = buffer.matchUntil("&|<|\u0000");
			tokenizer._emitToken({type: 'Characters', data: data + chars});
			buffer.commit();
		}
		return true;
	}

	function character_reference_in_data_state(buffer) {
		var character = EntityParser.consumeEntity(buffer, tokenizer);
		tokenizer.setState(data_state);
		tokenizer._emitToken({type: 'Characters', data: character || '&'});
		return true;
	}

	function rcdata_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._emitToken({type: 'EOF', data: null});
			return false;
		} else if (data === '&') {
			tokenizer.setState(character_reference_in_rcdata_state);
		} else if (data === '<') {
			tokenizer.setState(rcdata_less_than_sign_state);
		} else if (data === "\u0000") {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._emitToken({type: 'Characters', data: '\uFFFD'});
			buffer.commit();
		} else {
			var chars = buffer.matchUntil("&|<|\u0000");
			tokenizer._emitToken({type: 'Characters', data: data + chars});
			buffer.commit();
		}
		return true;
	}

	function character_reference_in_rcdata_state(buffer) {
		var character = EntityParser.consumeEntity(buffer, tokenizer);
		tokenizer.setState(rcdata_state);
		tokenizer._emitToken({type: 'Characters', data: character || '&'});
		return true;
	}

	function rawtext_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._emitToken({type: 'EOF', data: null});
			return false;
		} else if (data === '<') {
			tokenizer.setState(rawtext_less_than_sign_state);
		} else if (data === "\u0000") {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._emitToken({type: 'Characters', data: '\uFFFD'});
			buffer.commit();
		} else {
			var chars = buffer.matchUntil("<|\u0000");
			tokenizer._emitToken({type: 'Characters', data: data + chars});
		}
		return true;
	}

	function plaintext_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._emitToken({type: 'EOF', data: null});
			return false;
		} else if (data === "\u0000") {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._emitToken({type: 'Characters', data: '\uFFFD'});
			buffer.commit();
		} else {
			var chars = buffer.matchUntil("\u0000");
			tokenizer._emitToken({type: 'Characters', data: data + chars});
		}
		return true;
	}


	function script_data_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._emitToken({type: 'EOF', data: null});
			return false;
		} else if (data === '<') {
			tokenizer.setState(script_data_less_than_sign_state);
		} else if (data === '\u0000') {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._emitToken({type: 'Characters', data: '\uFFFD'});
			buffer.commit();
		} else {
			var chars = buffer.matchUntil("<|\u0000");
			tokenizer._emitToken({type: 'Characters', data: data + chars});
		}
		return true;
	}

	function rcdata_less_than_sign_state(buffer) {
		var data = buffer.char();
		if (data === "/") {
			this._temporaryBuffer = '';
			tokenizer.setState(rcdata_end_tag_open_state);
		} else {
			tokenizer._emitToken({type: 'Characters', data: '<'});
			buffer.unget(data);
			tokenizer.setState(rcdata_state);
		}
		return true;
	}

	function rcdata_end_tag_open_state(buffer) {
		var data = buffer.char();
		if (isAlpha(data)) {
			this._temporaryBuffer += data;
			tokenizer.setState(rcdata_end_tag_name_state);
		} else {
			tokenizer._emitToken({type: 'Characters', data: '</'});
			buffer.unget(data);
			tokenizer.setState(rcdata_state);
		}
		return true;
	}

	function rcdata_end_tag_name_state(buffer) {
		var appropriate = tokenizer._currentToken && (tokenizer._currentToken.name === this._temporaryBuffer.toLowerCase());
		var data = buffer.char();
		if (isWhitespace(data) && appropriate) {
			tokenizer._currentToken = {type: 'EndTag', name: this._temporaryBuffer, data: [], selfClosing: false};
			tokenizer.setState(before_attribute_name_state);
		} else if (data === '/' && appropriate) {
			tokenizer._currentToken = {type: 'EndTag', name: this._temporaryBuffer, data: [], selfClosing: false};
			tokenizer.setState(self_closing_tag_state);
		} else if (data === '>' && appropriate) {
			tokenizer._currentToken = {type: 'EndTag', name: this._temporaryBuffer, data: [], selfClosing: false};
			tokenizer._emitCurrentToken();
			tokenizer.setState(data_state);
		} else if (isAlpha(data)) {
			this._temporaryBuffer += data;
			buffer.commit();
		} else {
			tokenizer._emitToken({type: 'Characters', data: '</' + this._temporaryBuffer});
			buffer.unget(data);
			tokenizer.setState(rcdata_state);
		}
		return true;
	}

	function rawtext_less_than_sign_state(buffer) {
		var data = buffer.char();
		if (data === "/") {
			this._temporaryBuffer = '';
			tokenizer.setState(rawtext_end_tag_open_state);
		} else {
			tokenizer._emitToken({type: 'Characters', data: '<'});
			buffer.unget(data);
			tokenizer.setState(rawtext_state);
		}
		return true;
	}

	function rawtext_end_tag_open_state(buffer) {
		var data = buffer.char();
		if (isAlpha(data)) {
			this._temporaryBuffer += data;
			tokenizer.setState(rawtext_end_tag_name_state);
		} else {
			tokenizer._emitToken({type: 'Characters', data: '</'});
			buffer.unget(data);
			tokenizer.setState(rawtext_state);
		}
		return true;
	}

	function rawtext_end_tag_name_state(buffer) {
		var appropriate = tokenizer._currentToken && (tokenizer._currentToken.name === this._temporaryBuffer.toLowerCase());
		var data = buffer.char();
		if (isWhitespace(data) && appropriate) {
			tokenizer._currentToken = {type: 'EndTag', name: this._temporaryBuffer, data: [], selfClosing: false};
			tokenizer.setState(before_attribute_name_state);
		} else if (data === '/' && appropriate) {
			tokenizer._currentToken = {type: 'EndTag', name: this._temporaryBuffer, data: [], selfClosing: false};
			tokenizer.setState(self_closing_tag_state);
		} else if (data === '>' && appropriate) {
			tokenizer._currentToken = {type: 'EndTag', name: this._temporaryBuffer, data: [], selfClosing: false};
			tokenizer._emitCurrentToken();
			tokenizer.setState(data_state);
		} else if (isAlpha(data)) {
			this._temporaryBuffer += data;
			buffer.commit();
		} else {
			tokenizer._emitToken({type: 'Characters', data: '</' + this._temporaryBuffer});
			buffer.unget(data);
			tokenizer.setState(rawtext_state);
		}
		return true;
	}

	function script_data_less_than_sign_state(buffer) {
		var data = buffer.char();
		if (data === "/") {
			this._temporaryBuffer = '';
			tokenizer.setState(script_data_end_tag_open_state);
		} else if (data === '!') {
			tokenizer._emitToken({type: 'Characters', data: '<!'});
			tokenizer.setState(script_data_escape_start_state);
		} else {
			tokenizer._emitToken({type: 'Characters', data: '<'});
			buffer.unget(data);
			tokenizer.setState(script_data_state);
		}
		return true;
	}

	function script_data_end_tag_open_state(buffer) {
		var data = buffer.char();
		if (isAlpha(data)) {
			this._temporaryBuffer += data;
			tokenizer.setState(script_data_end_tag_name_state);
		} else {
			tokenizer._emitToken({type: 'Characters', data: '</'});
			buffer.unget(data);
			tokenizer.setState(script_data_state);
		}
		return true;
	}

	function script_data_end_tag_name_state(buffer) {
		var appropriate = tokenizer._currentToken && (tokenizer._currentToken.name === this._temporaryBuffer.toLowerCase());
		var data = buffer.char();
		if (isWhitespace(data) && appropriate) {
			tokenizer._currentToken = {type: 'EndTag', name: 'script', data: [], selfClosing: false};
			tokenizer.setState(before_attribute_name_state);
		} else if (data === '/' && appropriate) {
			tokenizer._currentToken = {type: 'EndTag', name: 'script', data: [], selfClosing: false};
			tokenizer.setState(self_closing_tag_state);
		} else if (data === '>' && appropriate) {
			tokenizer._currentToken = {type: 'EndTag', name: 'script', data: [], selfClosing: false};
			tokenizer._emitCurrentToken();
		} else if (isAlpha(data)) {
			this._temporaryBuffer += data;
			buffer.commit();
		} else {
			tokenizer._emitToken({type: 'Characters', data: '</' + this._temporaryBuffer});
			buffer.unget(data);
			tokenizer.setState(script_data_state);
		}
		return true;
	}

	function script_data_escape_start_state(buffer) {
		var data = buffer.char();
		if (data === '-') {
			tokenizer._emitToken({type: 'Characters', data: '-'});
			tokenizer.setState(script_data_escape_start_dash_state);
		} else {
			buffer.unget(data);
			tokenizer.setState(script_data_state);
		}
		return true;
	}

	function script_data_escape_start_dash_state(buffer) {
		var data = buffer.char();
		if (data === '-') {
			tokenizer._emitToken({type: 'Characters', data: '-'});
			tokenizer.setState(script_data_escaped_dash_dash_state);
		} else {
			buffer.unget(data);
			tokenizer.setState(script_data_state);
		}
		return true;
	}

	function script_data_escaped_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (data === '-') {
			tokenizer._emitToken({type: 'Characters', data: '-'});
			tokenizer.setState(script_data_escaped_dash_state);
		} else if (data === '<') {
			tokenizer.setState(script_data_escaped_less_then_sign_state);
		} else if (data === '\u0000') {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._emitToken({type: 'Characters', data: '\uFFFD'});
			buffer.commit();
		} else {
			var chars = buffer.matchUntil('<|-|\u0000');
			tokenizer._emitToken({type: 'Characters', data: data + chars});
		}
		return true;
	}

	function script_data_escaped_dash_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (data === '-') {
			tokenizer._emitToken({type: 'Characters', data: '-'});
			tokenizer.setState(script_data_escaped_dash_dash_state);
		} else if (data === '<') {
			tokenizer.setState(script_data_escaped_less_then_sign_state);
		} else if (data === '\u0000') {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._emitToken({type: 'Characters', data: '\uFFFD'});
			tokenizer.setState(script_data_escaped_state);
		} else {
			tokenizer._emitToken({type: 'Characters', data: data});
			tokenizer.setState(script_data_escaped_state);
		}
		return true;
	}

	function script_data_escaped_dash_dash_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError('eof-in-script');
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (data === '<') {
			tokenizer.setState(script_data_escaped_less_then_sign_state);
		} else if (data === '>') {
			tokenizer._emitToken({type: 'Characters', data: '>'});
			tokenizer.setState(script_data_state);
		} else if (data === '\u0000') {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._emitToken({type: 'Characters', data: '\uFFFD'});
			tokenizer.setState(script_data_escaped_state);
		} else {
			tokenizer._emitToken({type: 'Characters', data: data});
			tokenizer.setState(script_data_escaped_state);
		}
		return true;
	}

	function script_data_escaped_less_then_sign_state(buffer) {
		var data = buffer.char();
		if (data === '/') {
			this._temporaryBuffer = '';
			tokenizer.setState(script_data_escaped_end_tag_open_state);
		} else if (isAlpha(data)) {
			tokenizer._emitToken({type: 'Characters', data: '<' + data});
			this._temporaryBuffer = data;
			tokenizer.setState(script_data_double_escape_start_state);
		} else {
			tokenizer._emitToken({type: 'Characters', data: '<'});
			buffer.unget(data);
			tokenizer.setState(script_data_escaped_state);
		}
		return true;
	}

	function script_data_escaped_end_tag_open_state(buffer) {
		var data = buffer.char();
		if (isAlpha(data)) {
			this._temporaryBuffer = data;
			tokenizer.setState(script_data_escaped_end_tag_name_state);
		} else {
			tokenizer._emitToken({type: 'Characters', data: '</'});
			buffer.unget(data);
			tokenizer.setState(script_data_escaped_state);
		}
		return true;
	}

	function script_data_escaped_end_tag_name_state(buffer) {
		var appropriate = tokenizer._currentToken && (tokenizer._currentToken.name === this._temporaryBuffer.toLowerCase());
		var data = buffer.char();
		if (isWhitespace(data) && appropriate) {
			tokenizer._currentToken = {type: 'EndTag', name: 'script', data: [], selfClosing: false};
			tokenizer.setState(before_attribute_name_state);
		} else if (data === '/' && appropriate) {
			tokenizer._currentToken = {type: 'EndTag', name: 'script', data: [], selfClosing: false};
			tokenizer.setState(self_closing_tag_state);
		} else if (data === '>' &&  appropriate) {
			tokenizer._currentToken = {type: 'EndTag', name: 'script', data: [], selfClosing: false};
			tokenizer.setState(data_state);
			tokenizer._emitCurrentToken();
		} else if (isAlpha(data)) {
			this._temporaryBuffer += data;
			buffer.commit();
		} else {
			tokenizer._emitToken({type: 'Characters', data: '</' + this._temporaryBuffer});
			buffer.unget(data);
			tokenizer.setState(script_data_escaped_state);
		}
		return true;
	}

	function script_data_double_escape_start_state(buffer) {
		var data = buffer.char();
		if (isWhitespace(data) || data === '/' || data === '>') {
			tokenizer._emitToken({type: 'Characters', data: data});
			if (this._temporaryBuffer.toLowerCase() === 'script')
				tokenizer.setState(script_data_double_escaped_state);
			else
				tokenizer.setState(script_data_escaped_state);
		} else if (isAlpha(data)) {
			tokenizer._emitToken({type: 'Characters', data: data});
			this._temporaryBuffer += data;
			buffer.commit();
		} else {
			buffer.unget(data);
			tokenizer.setState(script_data_escaped_state);
		}
		return true;
	}

	function script_data_double_escaped_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError('eof-in-script');
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (data === '-') {
			tokenizer._emitToken({type: 'Characters', data: '-'});
			tokenizer.setState(script_data_double_escaped_dash_state);
		} else if (data === '<') {
			tokenizer._emitToken({type: 'Characters', data: '<'});
			tokenizer.setState(script_data_double_escaped_less_than_sign_state);
		} else if (data === '\u0000') {
			tokenizer._parseError('invalid-codepoint');
			tokenizer._emitToken({type: 'Characters', data: '\uFFFD'});
			buffer.commit();
		} else {
			tokenizer._emitToken({type: 'Characters', data: data});
			buffer.commit();
		}
		return true;
	}

	function script_data_double_escaped_dash_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError('eof-in-script');
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (data === '-') {
			tokenizer._emitToken({type: 'Characters', data: '-'});
			tokenizer.setState(script_data_double_escaped_dash_dash_state);
		} else if (data === '<') {
			tokenizer._emitToken({type: 'Characters', data: '<'});
			tokenizer.setState(script_data_double_escaped_less_than_sign_state);
		} else if (data === '\u0000') {
			tokenizer._parseError('invalid-codepoint');
			tokenizer._emitToken({type: 'Characters', data: '\uFFFD'});
			tokenizer.setState(script_data_double_escaped_state);
		} else {
			tokenizer._emitToken({type: 'Characters', data: data});
			tokenizer.setState(script_data_double_escaped_state);
		}
		return true;
	}

	function script_data_double_escaped_dash_dash_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError('eof-in-script');
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (data === '-') {
			tokenizer._emitToken({type: 'Characters', data: '-'});
			buffer.commit();
		} else if (data === '<') {
			tokenizer._emitToken({type: 'Characters', data: '<'});
			tokenizer.setState(script_data_double_escaped_less_than_sign_state);
		} else if (data === '>') {
			tokenizer._emitToken({type: 'Characters', data: '>'});
			tokenizer.setState(script_data_state);
		} else if (data === '\u0000') {
			tokenizer._parseError('invalid-codepoint');
			tokenizer._emitToken({type: 'Characters', data: '\uFFFD'});
			tokenizer.setState(script_data_double_escaped_state);
		} else {
			tokenizer._emitToken({type: 'Characters', data: data});
			tokenizer.setState(script_data_double_escaped_state);
		}
		return true;
	}

	function script_data_double_escaped_less_than_sign_state(buffer) {
		var data = buffer.char();
		if (data === '/') {
			tokenizer._emitToken({type: 'Characters', data: '/'});
			this._temporaryBuffer = '';
			tokenizer.setState(script_data_double_escape_end_state);
		} else {
			buffer.unget(data);
			tokenizer.setState(script_data_double_escaped_state);
		}
		return true;
	}

	function script_data_double_escape_end_state(buffer) {
		var data = buffer.char();
		if (isWhitespace(data) || data === '/' || data === '>') {
			tokenizer._emitToken({type: 'Characters', data: data});
			if (this._temporaryBuffer.toLowerCase() === 'script')
				tokenizer.setState(script_data_escaped_state);
			else
				tokenizer.setState(script_data_double_escaped_state);
		} else if (isAlpha(data)) {
			tokenizer._emitToken({type: 'Characters', data: data});
			this._temporaryBuffer += data;
			buffer.commit();
		} else {
			buffer.unget(data);
			tokenizer.setState(script_data_double_escaped_state);
		}
		return true;
	}

	function tag_open_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("bare-less-than-sign-at-eof");
			tokenizer._emitToken({type: 'Characters', data: '<'});
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (isAlpha(data)) {
			tokenizer._currentToken = {type: 'StartTag', name: data.toLowerCase(), data: []};
			tokenizer.setState(tag_name_state);
		} else if (data === '!') {
			tokenizer.setState(markup_declaration_open_state);
		} else if (data === '/') {
			tokenizer.setState(close_tag_open_state);
		} else if (data === '>') {
			tokenizer._parseError("expected-tag-name-but-got-right-bracket");
			tokenizer._emitToken({type: 'Characters', data: "<>"});
			tokenizer.setState(data_state);
		} else if (data === '?') {
			tokenizer._parseError("expected-tag-name-but-got-question-mark");
			buffer.unget(data);
			tokenizer.setState(bogus_comment_state);
		} else {
			tokenizer._parseError("expected-tag-name");
			tokenizer._emitToken({type: 'Characters', data: "<"});
			buffer.unget(data);
			tokenizer.setState(data_state);
		}
		return true;
	}

	function close_tag_open_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("expected-closing-tag-but-got-eof");
			tokenizer._emitToken({type: 'Characters', data: '</'});
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (isAlpha(data)) {
			tokenizer._currentToken = {type: 'EndTag', name: data.toLowerCase(), data: []};
			tokenizer.setState(tag_name_state);
		} else if (data === '>') {
			tokenizer._parseError("expected-closing-tag-but-got-right-bracket");
			tokenizer.setState(data_state);
		} else {
			tokenizer._parseError("expected-closing-tag-but-got-char", {data: data}); // param 1 is datavars:
			buffer.unget(data);
			tokenizer.setState(bogus_comment_state);
		}
		return true;
	}

	function tag_name_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError('eof-in-tag-name');
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (isWhitespace(data)) {
			tokenizer.setState(before_attribute_name_state);
		} else if (isAlpha(data)) {
			tokenizer._currentToken.name += data.toLowerCase();
		} else if (data === '>') {
			tokenizer._emitCurrentToken();
		} else if (data === '/') {
			tokenizer.setState(self_closing_tag_state);
		} else if (data === '\u0000') {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._currentToken.name += "\uFFFD";
		} else {
			tokenizer._currentToken.name += data;
		}
		buffer.commit();

		return true;
	}

	function before_attribute_name_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("expected-attribute-name-but-got-eof");
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (isWhitespace(data)) {
			return true;
		} else if (isAlpha(data)) {
			tokenizer._currentToken.data.push({nodeName: data.toLowerCase(), nodeValue: ""});
			tokenizer.setState(attribute_name_state);
		} else if (data === '>') {
			tokenizer._emitCurrentToken();
		} else if (data === '/') {
			tokenizer.setState(self_closing_tag_state);
		} else if (data === "'" || data === '"' || data === '=' || data === '<') {
			tokenizer._parseError("invalid-character-in-attribute-name");
			tokenizer._currentToken.data.push({nodeName: data, nodeValue: ""});
			tokenizer.setState(attribute_name_state);
		} else if (data === '\u0000') {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._currentToken.data.push({nodeName: "\uFFFD", nodeValue: ""});
		} else {
			tokenizer._currentToken.data.push({nodeName: data, nodeValue: ""});
			tokenizer.setState(attribute_name_state);
		}
		return true;
	}

	function attribute_name_state(buffer) {
		var data = buffer.char();
		var leavingThisState = true;
		var shouldEmit = false;
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-attribute-name");
			buffer.unget(data);
			tokenizer.setState(data_state);
			shouldEmit = true;
		} else if (data === '=') {
			tokenizer.setState(before_attribute_value_state);
		} else if (isAlpha(data)) {
			tokenizer._currentAttribute().nodeName += data.toLowerCase();
			leavingThisState = false;
		} else if (data === '>') {
			shouldEmit = true;
		} else if (isWhitespace(data)) {
			tokenizer.setState(after_attribute_name_state);
		} else if (data === '/') {
			tokenizer.setState(self_closing_tag_state);
		} else if (data === "'" || data === '"') {
			tokenizer._parseError("invalid-character-in-attribute-name");
			tokenizer._currentAttribute().nodeName += data;
			leavingThisState = false;
		} else if (data === '\u0000') {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._currentAttribute().nodeName += "\uFFFD";
		} else {
			tokenizer._currentAttribute().nodeName += data;
			leavingThisState = false;
		}

		if (leavingThisState) {
			var attributes = tokenizer._currentToken.data;
			var currentAttribute = attributes[attributes.length - 1];
			for (var i = attributes.length - 2; i >= 0; i--) {
				if (currentAttribute.nodeName === attributes[i].nodeName) {
					tokenizer._parseError("duplicate-attribute", {name: currentAttribute.nodeName});
					currentAttribute.nodeName = null;
					break;
				}
			}
			if (shouldEmit)
				tokenizer._emitCurrentToken();
		} else {
			buffer.commit();
		}
		return true;
	}

	function after_attribute_name_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("expected-end-of-tag-but-got-eof");
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (isWhitespace(data)) {
			return true;
		} else if (data === '=') {
			tokenizer.setState(before_attribute_value_state);
		} else if (data === '>') {
			tokenizer._emitCurrentToken();
		} else if (isAlpha(data)) {
			tokenizer._currentToken.data.push({nodeName: data, nodeValue: ""});
			tokenizer.setState(attribute_name_state);
		} else if (data === '/') {
			tokenizer.setState(self_closing_tag_state);
		} else if (data === "'" || data === '"' || data === '<') {
			tokenizer._parseError("invalid-character-after-attribute-name");
			tokenizer._currentToken.data.push({nodeName: data, nodeValue: ""});
			tokenizer.setState(attribute_name_state);
		} else if (data === '\u0000') {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._currentToken.data.push({nodeName: "\uFFFD", nodeValue: ""});
		} else {
			tokenizer._currentToken.data.push({nodeName: data, nodeValue: ""});
			tokenizer.setState(attribute_name_state);
		}
		return true;
	}

	function before_attribute_value_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("expected-attribute-value-but-got-eof");
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (isWhitespace(data)) {
			return true;
		} else if (data === '"') {
			tokenizer.setState(attribute_value_double_quoted_state);
		} else if (data === '&') {
			tokenizer.setState(attribute_value_unquoted_state);
			buffer.unget(data);
		} else if (data === "'") {
			tokenizer.setState(attribute_value_single_quoted_state);
		} else if (data === '>') {
			tokenizer._parseError("expected-attribute-value-but-got-right-bracket");
			tokenizer._emitCurrentToken();
		} else if (data === '=' || data === '<' || data === '`') {
			tokenizer._parseError("unexpected-character-in-unquoted-attribute-value");
			tokenizer._currentAttribute().nodeValue += data;
			tokenizer.setState(attribute_value_unquoted_state);
		} else if (data === '\u0000') {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._currentAttribute().nodeValue += "\uFFFD";
		} else {
			tokenizer._currentAttribute().nodeValue += data;
			tokenizer.setState(attribute_value_unquoted_state);
		}

		return true;
	}

	function attribute_value_double_quoted_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-attribute-value-double-quote");
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (data === '"') {
			tokenizer.setState(after_attribute_value_state);
		} else if (data === '&') {
			this._additionalAllowedCharacter = '"';
			tokenizer.setState(character_reference_in_attribute_value_state);
		} else if (data === '\u0000') {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._currentAttribute().nodeValue += "\uFFFD";
		} else {
			var s = buffer.matchUntil('[\0"&]');
			data = data + s;
			tokenizer._currentAttribute().nodeValue += data;
		}
		return true;
	}

	function attribute_value_single_quoted_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-attribute-value-single-quote");
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (data === "'") {
			tokenizer.setState(after_attribute_value_state);
		} else if (data === '&') {
			this._additionalAllowedCharacter = "'";
			tokenizer.setState(character_reference_in_attribute_value_state);
		} else if (data === '\u0000') {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._currentAttribute().nodeValue += "\uFFFD";
		} else {
			tokenizer._currentAttribute().nodeValue += data + buffer.matchUntil("\u0000|['&]");
		}
		return true;
	}

	function attribute_value_unquoted_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-after-attribute-value");
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (isWhitespace(data)) {
			tokenizer.setState(before_attribute_name_state);
		} else if (data === '&') {
			this._additionalAllowedCharacter = ">";
			tokenizer.setState(character_reference_in_attribute_value_state);
		} else if (data === '>') {
			tokenizer._emitCurrentToken();
		} else if (data === '"' || data === "'" || data === '=' || data === '`' || data === '<') {
			tokenizer._parseError("unexpected-character-in-unquoted-attribute-value");
			tokenizer._currentAttribute().nodeValue += data;
			buffer.commit();
		} else if (data === '\u0000') {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._currentAttribute().nodeValue += "\uFFFD";
		} else {
			var o = buffer.matchUntil("\u0000|["+ "\t\n\v\f\x20\r" + "&<>\"'=`" +"]");
			if (o === InputStream.EOF) {
				tokenizer._parseError("eof-in-attribute-value-no-quotes");
				tokenizer._emitCurrentToken();
			}
			buffer.commit();
			tokenizer._currentAttribute().nodeValue += data + o;
		}
		return true;
	}

	function character_reference_in_attribute_value_state(buffer) {
		var character = EntityParser.consumeEntity(buffer, tokenizer, this._additionalAllowedCharacter);
		this._currentAttribute().nodeValue += character || '&';
		if (this._additionalAllowedCharacter === '"')
			tokenizer.setState(attribute_value_double_quoted_state);
		else if (this._additionalAllowedCharacter === '\'')
			tokenizer.setState(attribute_value_single_quoted_state);
		else if (this._additionalAllowedCharacter === '>')
			tokenizer.setState(attribute_value_unquoted_state);
		return true;
	}

	function after_attribute_value_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-after-attribute-value");
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (isWhitespace(data)) {
			tokenizer.setState(before_attribute_name_state);
		} else if (data === '>') {
			tokenizer.setState(data_state);
			tokenizer._emitCurrentToken();
		} else if (data === '/') {
			tokenizer.setState(self_closing_tag_state);
		} else {
			tokenizer._parseError("unexpected-character-after-attribute-value");
			buffer.unget(data);
			tokenizer.setState(before_attribute_name_state);
		}
		return true;
	}

	function self_closing_tag_state(buffer) {
		var c = buffer.char();
		if (c === InputStream.EOF) {
			tokenizer._parseError("unexpected-eof-after-solidus-in-tag");
			buffer.unget(c);
			tokenizer.setState(data_state);
		} else if (c === '>') {
			tokenizer._currentToken.selfClosing = true;
			tokenizer.setState(data_state);
			tokenizer._emitCurrentToken();
		} else {
			tokenizer._parseError("unexpected-character-after-solidus-in-tag");
			buffer.unget(c);
			tokenizer.setState(before_attribute_name_state);
		}
		return true;
	}

	function bogus_comment_state(buffer) {
		var data = buffer.matchUntil('>');
		data = data.replace(/\u0000/g, "\uFFFD");
		buffer.char();
		tokenizer._emitToken({type: 'Comment', data: data});
		tokenizer.setState(data_state);
		return true;
	}

	function markup_declaration_open_state(buffer) {
		var chars = buffer.shift(2);
		if (chars === '--') {
			tokenizer._currentToken = {type: 'Comment', data: ''};
			tokenizer.setState(comment_start_state);
		} else {
			var newchars = buffer.shift(5);
			if (newchars === InputStream.EOF || chars === InputStream.EOF) {
				tokenizer._parseError("expected-dashes-or-doctype");
				tokenizer.setState(bogus_comment_state);
				buffer.unget(chars);
				return true;
			}

			chars += newchars;
			if (chars.toUpperCase() === 'DOCTYPE') {
				tokenizer._currentToken = {type: 'Doctype', name: '', publicId: null, systemId: null, forceQuirks: false};
				tokenizer.setState(doctype_state);
			} else if (tokenizer._tokenHandler.isCdataSectionAllowed() && chars === '[CDATA[') {
				tokenizer.setState(cdata_section_state);
			} else {
				tokenizer._parseError("expected-dashes-or-doctype");
				buffer.unget(chars);
				tokenizer.setState(bogus_comment_state);
			}
		}
		return true;
	}

	function cdata_section_state(buffer) {
		var data = buffer.matchUntil(']]>');
		buffer.shift(3);
		if (data) {
			tokenizer._emitToken({type: 'Characters', data: data});
		}
		tokenizer.setState(data_state);
		return true;
	}

	function comment_start_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-comment");
			tokenizer._emitToken(tokenizer._currentToken);
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (data === '-') {
			tokenizer.setState(comment_start_dash_state);
		} else if (data === '>') {
			tokenizer._parseError("incorrect-comment");
			tokenizer._emitToken(tokenizer._currentToken);
			tokenizer.setState(data_state);
		} else if (data === '\u0000') {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._currentToken.data += "\uFFFD";
		} else {
			tokenizer._currentToken.data += data;
			tokenizer.setState(comment_state);
		}
		return true;
	}

	function comment_start_dash_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-comment");
			tokenizer._emitToken(tokenizer._currentToken);
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (data === '-') {
			tokenizer.setState(comment_end_state);
		} else if (data === '>') {
			tokenizer._parseError("incorrect-comment");
			tokenizer._emitToken(tokenizer._currentToken);
			tokenizer.setState(data_state);
		} else if (data === '\u0000') {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._currentToken.data += "\uFFFD";
		} else {
			tokenizer._currentToken.data += '-' + data;
			tokenizer.setState(comment_state);
		}
		return true;
	}

	function comment_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-comment");
			tokenizer._emitToken(tokenizer._currentToken);
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (data === '-') {
			tokenizer.setState(comment_end_dash_state);
		} else if (data === '\u0000') {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._currentToken.data += "\uFFFD";
		} else {
			tokenizer._currentToken.data += data;
			buffer.commit();
		}
		return true;
	}

	function comment_end_dash_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-comment-end-dash");
			tokenizer._emitToken(tokenizer._currentToken);
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (data === '-') {
			tokenizer.setState(comment_end_state);
		} else if (data === '\u0000') {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._currentToken.data += "-\uFFFD";
			tokenizer.setState(comment_state);
		} else {
			tokenizer._currentToken.data += '-' + data + buffer.matchUntil('\u0000|-');
			buffer.char();
		}
		return true;
	}

	function comment_end_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-comment-double-dash");
			tokenizer._emitToken(tokenizer._currentToken);
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (data === '>') {
			tokenizer._emitToken(tokenizer._currentToken);
			tokenizer.setState(data_state);
		} else if (data === '!') {
			tokenizer._parseError("unexpected-bang-after-double-dash-in-comment");
			tokenizer.setState(comment_end_bang_state);
		} else if (data === '-') {
			tokenizer._parseError("unexpected-dash-after-double-dash-in-comment");
			tokenizer._currentToken.data += data;
		} else if (data === '\u0000') {
			tokenizer._parseError("invalid-codepoint");
			tokenizer._currentToken.data += "--\uFFFD";
			tokenizer.setState(comment_state);
		} else {
			tokenizer._parseError("unexpected-char-in-comment");
			tokenizer._currentToken.data += '--' + data;
			tokenizer.setState(comment_state);
		}
		return true;
	}

	function comment_end_bang_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-comment-end-bang-state");
			tokenizer._emitToken(tokenizer._currentToken);
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (data === '>') {
			tokenizer._emitToken(tokenizer._currentToken);
			tokenizer.setState(data_state);
		} else if (data === '-') {
			tokenizer._currentToken.data += '--!';
			tokenizer.setState(comment_end_dash_state);
		} else {
			tokenizer._currentToken.data += '--!' + data;
			tokenizer.setState(comment_state);
		}
		return true;
	}

	function doctype_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("expected-doctype-name-but-got-eof");
			tokenizer._currentToken.forceQuirks = true;
			buffer.unget(data);
			tokenizer.setState(data_state);
			tokenizer._emitCurrentToken();
		} else if (isWhitespace(data)) {
			tokenizer.setState(before_doctype_name_state);
		} else {
			tokenizer._parseError("need-space-after-doctype");
			buffer.unget(data);
			tokenizer.setState(before_doctype_name_state);
		}
		return true;
	}

	function before_doctype_name_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("expected-doctype-name-but-got-eof");
			tokenizer._currentToken.forceQuirks = true;
			buffer.unget(data);
			tokenizer.setState(data_state);
			tokenizer._emitCurrentToken();
		} else if (isWhitespace(data)) {
		} else if (data === '>') {
			tokenizer._parseError("expected-doctype-name-but-got-right-bracket");
			tokenizer._currentToken.forceQuirks = true;
			tokenizer.setState(data_state);
			tokenizer._emitCurrentToken();
		} else {
			if (isAlpha(data))
				data = data.toLowerCase();
			tokenizer._currentToken.name = data;
			tokenizer.setState(doctype_name_state);
		}
		return true;
	}

	function doctype_name_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._currentToken.forceQuirks = true;
			buffer.unget(data);
			tokenizer._parseError("eof-in-doctype-name");
			tokenizer.setState(data_state);
			tokenizer._emitCurrentToken();
		} else if (isWhitespace(data)) {
			tokenizer.setState(after_doctype_name_state);
		} else if (data === '>') {
			tokenizer.setState(data_state);
			tokenizer._emitCurrentToken();
		} else {
			if (isAlpha(data))
				data = data.toLowerCase();
			tokenizer._currentToken.name += data;
			buffer.commit();
		}
		return true;
	}

	function after_doctype_name_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._currentToken.forceQuirks = true;
			buffer.unget(data);
			tokenizer._parseError("eof-in-doctype");
			tokenizer.setState(data_state);
			tokenizer._emitCurrentToken();
		} else if (isWhitespace(data)) {
		} else if (data === '>') {
			tokenizer.setState(data_state);
			tokenizer._emitCurrentToken();
		} else {
			if (['p', 'P'].indexOf(data) > -1) {
				var expected = [['u', 'U'], ['b', 'B'], ['l', 'L'], ['i', 'I'], ['c', 'C']];
				var matched = expected.every(function(expected){
					data = buffer.char();
					return expected.indexOf(data) > -1;
				});
				if (matched) {
					tokenizer.setState(after_doctype_public_keyword_state);
					return true;
				}
			} else if (['s', 'S'].indexOf(data) > -1) {
				var expected = [['y', 'Y'], ['s', 'S'], ['t', 'T'], ['e', 'E'], ['m', 'M']];
				var matched = expected.every(function(expected){
					data = buffer.char();
					return expected.indexOf(data) > -1;
				});
				if (matched) {
					tokenizer.setState(after_doctype_system_keyword_state);
					return true;
				}
			}
			buffer.unget(data);
			tokenizer._currentToken.forceQuirks = true;

			if (data === InputStream.EOF) {
				tokenizer._parseError("eof-in-doctype");
				buffer.unget(data);
				tokenizer.setState(data_state);
				tokenizer._emitCurrentToken();
			} else {
				tokenizer._parseError("expected-space-or-right-bracket-in-doctype", {data: data});
				tokenizer.setState(bogus_doctype_state);
			}
		}
		return true;
	}

	function after_doctype_public_keyword_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-doctype");
			tokenizer._currentToken.forceQuirks = true;
			buffer.unget(data);
			tokenizer.setState(data_state);
			tokenizer._emitCurrentToken();
		} else if (isWhitespace(data)) {
			tokenizer.setState(before_doctype_public_identifier_state);
		} else if (data === "'" || data === '"') {
			tokenizer._parseError("unexpected-char-in-doctype");
			buffer.unget(data);
			tokenizer.setState(before_doctype_public_identifier_state);
		} else {
			buffer.unget(data);
			tokenizer.setState(before_doctype_public_identifier_state);
		}
		return true;
	}

	function before_doctype_public_identifier_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-doctype");
			tokenizer._currentToken.forceQuirks = true;
			buffer.unget(data);
			tokenizer.setState(data_state);
			tokenizer._emitCurrentToken();
		} else if (isWhitespace(data)) {
		} else if (data === '"') {
			tokenizer._currentToken.publicId = '';
			tokenizer.setState(doctype_public_identifier_double_quoted_state);
		} else if (data === "'") {
			tokenizer._currentToken.publicId = '';
			tokenizer.setState(doctype_public_identifier_single_quoted_state);
		} else if (data === '>') {
			tokenizer._parseError("unexpected-end-of-doctype");
			tokenizer._currentToken.forceQuirks = true;
			tokenizer.setState(data_state);
			tokenizer._emitCurrentToken();
		} else {
			tokenizer._parseError("unexpected-char-in-doctype");
			tokenizer._currentToken.forceQuirks = true;
			tokenizer.setState(bogus_doctype_state);
		}
		return true;
	}

	function doctype_public_identifier_double_quoted_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-doctype");
			tokenizer._currentToken.forceQuirks = true;
			buffer.unget(data);
			tokenizer.setState(data_state);
			tokenizer._emitCurrentToken();
		} else if (data === '"') {
			tokenizer.setState(after_doctype_public_identifier_state);
		} else if (data === '>') {
			tokenizer._parseError("unexpected-end-of-doctype");
			tokenizer._currentToken.forceQuirks = true;
			tokenizer.setState(data_state);
			tokenizer._emitCurrentToken();
		} else {
			tokenizer._currentToken.publicId += data;
		}
		return true;
	}

	function doctype_public_identifier_single_quoted_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-doctype");
			tokenizer._currentToken.forceQuirks = true;
			buffer.unget(data);
			tokenizer.setState(data_state);
			tokenizer._emitCurrentToken();
		} else if (data === "'") {
			tokenizer.setState(after_doctype_public_identifier_state);
		} else if (data === '>') {
			tokenizer._parseError("unexpected-end-of-doctype");
			tokenizer._currentToken.forceQuirks = true;
			tokenizer.setState(data_state);
			tokenizer._emitCurrentToken();
		} else {
			tokenizer._currentToken.publicId += data;
		}
		return true;
	}

	function after_doctype_public_identifier_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-doctype");
			tokenizer._currentToken.forceQuirks = true;
			tokenizer._emitCurrentToken();
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (isWhitespace(data)) {
			tokenizer.setState(between_doctype_public_and_system_identifiers_state);
		} else if (data === '>') {
			tokenizer.setState(data_state);
			tokenizer._emitCurrentToken();
		} else if (data === '"') {
			tokenizer._parseError("unexpected-char-in-doctype");
			tokenizer._currentToken.systemId = '';
			tokenizer.setState(doctype_system_identifier_double_quoted_state);
		} else if (data === "'") {
			tokenizer._parseError("unexpected-char-in-doctype");
			tokenizer._currentToken.systemId = '';
			tokenizer.setState(doctype_system_identifier_single_quoted_state);
		} else {
			tokenizer._parseError("unexpected-char-in-doctype");
			tokenizer._currentToken.forceQuirks = true;
			tokenizer.setState(bogus_doctype_state);
		}
		return true;
	}

	function between_doctype_public_and_system_identifiers_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-doctype");
			tokenizer._currentToken.forceQuirks = true;
			tokenizer._emitCurrentToken();
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (isWhitespace(data)) {
		} else if (data === '>') {
			tokenizer._emitCurrentToken();
			tokenizer.setState(data_state);
		} else if (data === '"') {
			tokenizer._currentToken.systemId = '';
			tokenizer.setState(doctype_system_identifier_double_quoted_state);
		} else if (data === "'") {
			tokenizer._currentToken.systemId = '';
			tokenizer.setState(doctype_system_identifier_single_quoted_state);
		} else {
			tokenizer._parseError("unexpected-char-in-doctype");
			tokenizer._currentToken.forceQuirks = true;
			tokenizer.setState(bogus_doctype_state);
		}
		return true;
	}

	function after_doctype_system_keyword_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-doctype");
			tokenizer._currentToken.forceQuirks = true;
			tokenizer._emitCurrentToken();
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (isWhitespace(data)) {
			tokenizer.setState(before_doctype_system_identifier_state);
		} else if (data === "'" || data === '"') {
			tokenizer._parseError("unexpected-char-in-doctype");
			buffer.unget(data);
			tokenizer.setState(before_doctype_system_identifier_state);
		} else {
			buffer.unget(data);
			tokenizer.setState(before_doctype_system_identifier_state);
		}
		return true;
	}

	function before_doctype_system_identifier_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-doctype");
			tokenizer._currentToken.forceQuirks = true;
			tokenizer._emitCurrentToken();
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (isWhitespace(data)) {
		} else if (data === '"') {
			tokenizer._currentToken.systemId = '';
			tokenizer.setState(doctype_system_identifier_double_quoted_state);
		} else if (data === "'") {
			tokenizer._currentToken.systemId = '';
			tokenizer.setState(doctype_system_identifier_single_quoted_state);
		} else if (data === '>') {
			tokenizer._parseError("unexpected-end-of-doctype");
			tokenizer._currentToken.forceQuirks = true;
			tokenizer._emitCurrentToken();
			tokenizer.setState(data_state);
		} else {
			tokenizer._parseError("unexpected-char-in-doctype");
			tokenizer._currentToken.forceQuirks = true;
			tokenizer.setState(bogus_doctype_state);
		}
		return true;
	}

	function doctype_system_identifier_double_quoted_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-doctype");
			tokenizer._currentToken.forceQuirks = true;
			tokenizer._emitCurrentToken();
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (data === '"') {
			tokenizer.setState(after_doctype_system_identifier_state);
		} else if (data === '>') {
			tokenizer._parseError("unexpected-end-of-doctype");
			tokenizer._currentToken.forceQuirks = true;
			tokenizer._emitCurrentToken();
			tokenizer.setState(data_state);
		} else {
			tokenizer._currentToken.systemId += data;
		}
		return true;
	}

	function doctype_system_identifier_single_quoted_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-doctype");
			tokenizer._currentToken.forceQuirks = true;
			tokenizer._emitCurrentToken();
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (data === "'") {
			tokenizer.setState(after_doctype_system_identifier_state);
		} else if (data === '>') {
			tokenizer._parseError("unexpected-end-of-doctype");
			tokenizer._currentToken.forceQuirks = true;
			tokenizer._emitCurrentToken();
			tokenizer.setState(data_state);
		} else {
			tokenizer._currentToken.systemId += data;
		}
		return true;
	}

	function after_doctype_system_identifier_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			tokenizer._parseError("eof-in-doctype");
			tokenizer._currentToken.forceQuirks = true;
			tokenizer._emitCurrentToken();
			buffer.unget(data);
			tokenizer.setState(data_state);
		} else if (isWhitespace(data)) {
		} else if (data === '>') {
			tokenizer._emitCurrentToken();
			tokenizer.setState(data_state);
		} else {
			tokenizer._parseError("unexpected-char-in-doctype");
			tokenizer.setState(bogus_doctype_state);
		}
		return true;
	}

	function bogus_doctype_state(buffer) {
		var data = buffer.char();
		if (data === InputStream.EOF) {
			buffer.unget(data);
			tokenizer._emitCurrentToken();
			tokenizer.setState(data_state);
		} else if (data === '>') {
			tokenizer._emitCurrentToken();
			tokenizer.setState(data_state);
		}
		return true;
	}
};

Object.defineProperty(Tokenizer.prototype, 'lineNumber', {
	get: function() {
		return this._inputStream.location().line;
	}
});

Object.defineProperty(Tokenizer.prototype, 'columnNumber', {
	get: function() {
		return this._inputStream.location().column;
	}
});

exports.Tokenizer = Tokenizer;

},
{"./EntityParser":2,"./InputStream":3}],
6:[function(_dereq_,module,exports){
var assert = _dereq_('assert');

var messages = _dereq_('./messages.json');
var constants = _dereq_('./constants');

var EventEmitter = _dereq_('events').EventEmitter;

var Tokenizer = _dereq_('./Tokenizer').Tokenizer;
var ElementStack = _dereq_('./ElementStack').ElementStack;
var StackItem = _dereq_('./StackItem').StackItem;

var Marker = {};

function isWhitespace(ch) {
	return ch === " " || ch === "\n" || ch === "\t" || ch === "\r" || ch === "\f";
}

function isWhitespaceOrReplacementCharacter(ch) {
	return isWhitespace(ch) || ch === '\uFFFD';
}

function isAllWhitespace(characters) {
	for (var i = 0; i < characters.length; i++) {
		var ch = characters[i];
		if (!isWhitespace(ch))
			return false;
	}
	return true;
}

function isAllWhitespaceOrReplacementCharacters(characters) {
	for (var i = 0; i < characters.length; i++) {
		var ch = characters[i];
		if (!isWhitespaceOrReplacementCharacter(ch))
			return false;
	}
	return true;
}

function getAttribute(node, name) {
	for (var i = 0; i < node.attributes.length; i++) {
		var attribute = node.attributes[i];
		if (attribute.nodeName === name) {
			return attribute;
		}
	}
	return null;
}

function CharacterBuffer(characters) {
	this.characters = characters;
	this.current = 0;
	this.end = this.characters.length;
}

CharacterBuffer.prototype.skipAtMostOneLeadingNewline = function() {
	if (this.characters[this.current] === '\n')
		this.current++;
};

CharacterBuffer.prototype.skipLeadingWhitespace = function() {
	while (isWhitespace(this.characters[this.current])) {
		if (++this.current == this.end)
			return;
	}
};

CharacterBuffer.prototype.skipLeadingNonWhitespace = function() {
	while (!isWhitespace(this.characters[this.current])) {
		if (++this.current == this.end)
			return;
	}
};

CharacterBuffer.prototype.takeRemaining = function() {
	return this.characters.substring(this.current);
};

CharacterBuffer.prototype.takeLeadingWhitespace = function() {
	var start = this.current;
	this.skipLeadingWhitespace();
	if (start === this.current)
		return "";
	return this.characters.substring(start, this.current - start);
};

Object.defineProperty(CharacterBuffer.prototype, 'length', {
	get: function(){
		return this.end - this.current;
	}
});
function TreeBuilder() {
	this.tokenizer = null;
	this.errorHandler = null;
	this.scriptingEnabled = false;
	this.document = null;
	this.head = null;
	this.form = null;
	this.openElements = new ElementStack();
	this.activeFormattingElements = [];
	this.insertionMode = null;
	this.insertionModeName = "";
	this.originalInsertionMode = "";
	this.inQuirksMode = false; // TODO quirks mode
	this.compatMode = "no quirks";
	this.framesetOk = true;
	this.redirectAttachToFosterParent = false;
	this.selfClosingFlagAcknowledged = false;
	this.context = "";
	this.pendingTableCharacters = [];
	this.shouldSkipLeadingNewline = false;

	var tree = this;
	var modes = this.insertionModes = {};
	modes.base = {
		end_tag_handlers: {"-default": 'endTagOther'},
		start_tag_handlers: {"-default": 'startTagOther'},
		processEOF: function() {
			tree.generateImpliedEndTags();
			if (tree.openElements.length > 2) {
				tree.parseError('expected-closing-tag-but-got-eof');
			} else if (tree.openElements.length == 2 &&
				tree.openElements.item(1).localName != 'body') {
				tree.parseError('expected-closing-tag-but-got-eof');
			} else if (tree.context && tree.openElements.length > 1) {
			}
		},
		processComment: function(data) {
			tree.insertComment(data, tree.currentStackItem().node);
		},
		processDoctype: function(name, publicId, systemId, forceQuirks) {
			tree.parseError('unexpected-doctype');
		},
		processStartTag: function(name, attributes, selfClosing) {
			if (this[this.start_tag_handlers[name]]) {
				this[this.start_tag_handlers[name]](name, attributes, selfClosing);
			} else if (this[this.start_tag_handlers["-default"]]) {
				this[this.start_tag_handlers["-default"]](name, attributes, selfClosing);
			} else {
				throw(new Error("No handler found for "+name));
			}
		},
		processEndTag: function(name) {
			if (this[this.end_tag_handlers[name]]) {
				this[this.end_tag_handlers[name]](name);
			} else if (this[this.end_tag_handlers["-default"]]) {
				this[this.end_tag_handlers["-default"]](name);
			} else {
				throw(new Error("No handler found for "+name));
			}
		},
		startTagHtml: function(name, attributes) {
			modes.inBody.startTagHtml(name, attributes);
		}
	};

	modes.initial = Object.create(modes.base);

	modes.initial.processEOF = function() {
		tree.parseError("expected-doctype-but-got-eof");
		this.anythingElse();
		tree.insertionMode.processEOF();
	};

	modes.initial.processComment = function(data) {
		tree.insertComment(data, tree.document);
	};

	modes.initial.processDoctype = function(name, publicId, systemId, forceQuirks) {
		tree.insertDoctype(name || '', publicId || '', systemId || '');

		if (forceQuirks || name != 'html' || (publicId != null && ([
					"+//silmaril//dtd html pro v0r11 19970101//",
					"-//advasoft ltd//dtd html 3.0 aswedit + extensions//",
					"-//as//dtd html 3.0 aswedit + extensions//",
					"-//ietf//dtd html 2.0 level 1//",
					"-//ietf//dtd html 2.0 level 2//",
					"-//ietf//dtd html 2.0 strict level 1//",
					"-//ietf//dtd html 2.0 strict level 2//",
					"-//ietf//dtd html 2.0 strict//",
					"-//ietf//dtd html 2.0//",
					"-//ietf//dtd html 2.1e//",
					"-//ietf//dtd html 3.0//",
					"-//ietf//dtd html 3.0//",
					"-//ietf//dtd html 3.2 final//",
					"-//ietf//dtd html 3.2//",
					"-//ietf//dtd html 3//",
					"-//ietf//dtd html level 0//",
					"-//ietf//dtd html level 0//",
					"-//ietf//dtd html level 1//",
					"-//ietf//dtd html level 1//",
					"-//ietf//dtd html level 2//",
					"-//ietf//dtd html level 2//",
					"-//ietf//dtd html level 3//",
					"-//ietf//dtd html level 3//",
					"-//ietf//dtd html strict level 0//",
					"-//ietf//dtd html strict level 0//",
					"-//ietf//dtd html strict level 1//",
					"-//ietf//dtd html strict level 1//",
					"-//ietf//dtd html strict level 2//",
					"-//ietf//dtd html strict level 2//",
					"-//ietf//dtd html strict level 3//",
					"-//ietf//dtd html strict level 3//",
					"-//ietf//dtd html strict//",
					"-//ietf//dtd html strict//",
					"-//ietf//dtd html strict//",
					"-//ietf//dtd html//",
					"-//ietf//dtd html//",
					"-//ietf//dtd html//",
					"-//metrius//dtd metrius presentational//",
					"-//microsoft//dtd internet explorer 2.0 html strict//",
					"-//microsoft//dtd internet explorer 2.0 html//",
					"-//microsoft//dtd internet explorer 2.0 tables//",
					"-//microsoft//dtd internet explorer 3.0 html strict//",
					"-//microsoft//dtd internet explorer 3.0 html//",
					"-//microsoft//dtd internet explorer 3.0 tables//",
					"-//netscape comm. corp.//dtd html//",
					"-//netscape comm. corp.//dtd strict html//",
					"-//o'reilly and associates//dtd html 2.0//",
					"-//o'reilly and associates//dtd html extended 1.0//",
					"-//spyglass//dtd html 2.0 extended//",
					"-//sq//dtd html 2.0 hotmetal + extensions//",
					"-//sun microsystems corp.//dtd hotjava html//",
					"-//sun microsystems corp.//dtd hotjava strict html//",
					"-//w3c//dtd html 3 1995-03-24//",
					"-//w3c//dtd html 3.2 draft//",
					"-//w3c//dtd html 3.2 final//",
					"-//w3c//dtd html 3.2//",
					"-//w3c//dtd html 3.2s draft//",
					"-//w3c//dtd html 4.0 frameset//",
					"-//w3c//dtd html 4.0 transitional//",
					"-//w3c//dtd html experimental 19960712//",
					"-//w3c//dtd html experimental 970421//",
					"-//w3c//dtd w3 html//",
					"-//w3o//dtd w3 html 3.0//",
					"-//webtechs//dtd mozilla html 2.0//",
					"-//webtechs//dtd mozilla html//",
					"html"
				].some(publicIdStartsWith)
				|| [
					"-//w3o//dtd w3 html strict 3.0//en//",
					"-/w3c/dtd html 4.0 transitional/en",
					"html"
				].indexOf(publicId.toLowerCase()) > -1
				|| (systemId == null && [
					"-//w3c//dtd html 4.01 transitional//",
					"-//w3c//dtd html 4.01 frameset//"
				].some(publicIdStartsWith)))
			)
			|| (systemId != null && (systemId.toLowerCase() == "http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd"))
		) {
			tree.compatMode = "quirks";
			tree.parseError("quirky-doctype");
		} else if (publicId != null && ([
				"-//w3c//dtd xhtml 1.0 transitional//",
				"-//w3c//dtd xhtml 1.0 frameset//"
			].some(publicIdStartsWith)
			|| (systemId != null && [
				"-//w3c//dtd html 4.01 transitional//",
				"-//w3c//dtd html 4.01 frameset//"
			].indexOf(publicId.toLowerCase()) > -1))
		) {
			tree.compatMode = "limited quirks";
			tree.parseError("almost-standards-doctype");
		} else {
			if ((publicId == "-//W3C//DTD HTML 4.0//EN" && (systemId == null || systemId == "http://www.w3.org/TR/REC-html40/strict.dtd"))
				|| (publicId == "-//W3C//DTD HTML 4.01//EN" && (systemId == null || systemId == "http://www.w3.org/TR/html4/strict.dtd"))
				|| (publicId == "-//W3C//DTD XHTML 1.0 Strict//EN" && (systemId == "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"))
				|| (publicId == "-//W3C//DTD XHTML 1.1//EN" && (systemId == "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"))
			) {
			} else if (!((systemId == null || systemId == "about:legacy-compat") && publicId == null)) {
				tree.parseError("unknown-doctype");
			}
		}
		tree.setInsertionMode('beforeHTML');
		function publicIdStartsWith(string) {
			return publicId.toLowerCase().indexOf(string) === 0;
		}
	};

	modes.initial.processCharacters = function(buffer) {
		buffer.skipLeadingWhitespace();
		if (!buffer.length)
			return;
		tree.parseError('expected-doctype-but-got-chars');
		this.anythingElse();
		tree.insertionMode.processCharacters(buffer);
	};

	modes.initial.processStartTag = function(name, attributes, selfClosing) {
		tree.parseError('expected-doctype-but-got-start-tag', {name: name});
		this.anythingElse();
		tree.insertionMode.processStartTag(name, attributes, selfClosing);
	};

	modes.initial.processEndTag = function(name) {
		tree.parseError('expected-doctype-but-got-end-tag', {name: name});
		this.anythingElse();
		tree.insertionMode.processEndTag(name);
	};

	modes.initial.anythingElse = function() {
		tree.compatMode = 'quirks';
		tree.setInsertionMode('beforeHTML');
	};

	modes.beforeHTML = Object.create(modes.base);

	modes.beforeHTML.start_tag_handlers = {
		html: 'startTagHtml',
		'-default': 'startTagOther'
	};

	modes.beforeHTML.processEOF = function() {
		this.anythingElse();
		tree.insertionMode.processEOF();
	};

	modes.beforeHTML.processComment = function(data) {
		tree.insertComment(data, tree.document);
	};

	modes.beforeHTML.processCharacters = function(buffer) {
		buffer.skipLeadingWhitespace();
		if (!buffer.length)
			return;
		this.anythingElse();
		tree.insertionMode.processCharacters(buffer);
	};

	modes.beforeHTML.startTagHtml = function(name, attributes, selfClosing) {
		tree.insertHtmlElement(attributes);
		tree.setInsertionMode('beforeHead');
	};

	modes.beforeHTML.startTagOther = function(name, attributes, selfClosing) {
		this.anythingElse();
		tree.insertionMode.processStartTag(name, attributes, selfClosing);
	};

	modes.beforeHTML.processEndTag = function(name) {
		this.anythingElse();
		tree.insertionMode.processEndTag(name);
	};

	modes.beforeHTML.anythingElse = function() {
		tree.insertHtmlElement();
		tree.setInsertionMode('beforeHead');
	};

	modes.afterAfterBody = Object.create(modes.base);

	modes.afterAfterBody.start_tag_handlers = {
		html: 'startTagHtml',
		'-default': 'startTagOther'
	};

	modes.afterAfterBody.processComment = function(data) {
		tree.insertComment(data, tree.document);
	};

	modes.afterAfterBody.processDoctype = function(data) {
		modes.inBody.processDoctype(data);
	};

	modes.afterAfterBody.startTagHtml = function(data, attributes) {
		modes.inBody.startTagHtml(data, attributes);
	};

	modes.afterAfterBody.startTagOther = function(name, attributes, selfClosing) {
		tree.parseError('unexpected-start-tag', {name: name});
		tree.setInsertionMode('inBody');
		tree.insertionMode.processStartTag(name, attributes, selfClosing);
	};

	modes.afterAfterBody.endTagOther = function(name) {
		tree.parseError('unexpected-end-tag', {name: name});
		tree.setInsertionMode('inBody');
		tree.insertionMode.processEndTag(name);
	};

	modes.afterAfterBody.processCharacters = function(data) {
		if (!isAllWhitespace(data.characters)) {
			tree.parseError('unexpected-char-after-body');
			tree.setInsertionMode('inBody');
			return tree.insertionMode.processCharacters(data);
		}
		modes.inBody.processCharacters(data);
	};

	modes.afterBody = Object.create(modes.base);

	modes.afterBody.end_tag_handlers = {
		html: 'endTagHtml',
		'-default': 'endTagOther'
	};

	modes.afterBody.processComment = function(data) {
		tree.insertComment(data, tree.openElements.rootNode);
	};

	modes.afterBody.processCharacters = function(data) {
		if (!isAllWhitespace(data.characters)) {
			tree.parseError('unexpected-char-after-body');
			tree.setInsertionMode('inBody');
			return tree.insertionMode.processCharacters(data);
		}
		modes.inBody.processCharacters(data);
	};

	modes.afterBody.processStartTag = function(name, attributes, selfClosing) {
		tree.parseError('unexpected-start-tag-after-body', {name: name});
		tree.setInsertionMode('inBody');
		tree.insertionMode.processStartTag(name, attributes, selfClosing);
	};

	modes.afterBody.endTagHtml = function(name) {
		if (tree.context) {
			tree.parseError('end-html-in-innerhtml');
		} else {
			tree.setInsertionMode('afterAfterBody');
		}
	};

	modes.afterBody.endTagOther = function(name) {
		tree.parseError('unexpected-end-tag-after-body', {name: name});
		tree.setInsertionMode('inBody');
		tree.insertionMode.processEndTag(name);
	};

	modes.afterFrameset = Object.create(modes.base);

	modes.afterFrameset.start_tag_handlers = {
		html: 'startTagHtml',
		noframes: 'startTagNoframes',
		'-default': 'startTagOther'
	};

	modes.afterFrameset.end_tag_handlers = {
		html: 'endTagHtml',
		'-default': 'endTagOther'
	};

	modes.afterFrameset.processCharacters = function(buffer) {
		var characters = buffer.takeRemaining();
		var whitespace = "";
		for (var i = 0; i < characters.length; i++) {
			var ch = characters[i];
			if (isWhitespace(ch))
				whitespace += ch;
		}
		if (whitespace) {
			tree.insertText(whitespace);
		}
		if (whitespace.length < characters.length)
			tree.parseError('expected-eof-but-got-char');
	};

	modes.afterFrameset.startTagNoframes = function(name, attributes) {
		modes.inHead.processStartTag(name, attributes);
	};

	modes.afterFrameset.startTagOther = function(name, attributes) {
		tree.parseError("unexpected-start-tag-after-frameset", {name: name});
	};

	modes.afterFrameset.endTagHtml = function(name) {
		tree.setInsertionMode('afterAfterFrameset');
	};

	modes.afterFrameset.endTagOther = function(name) {
		tree.parseError("unexpected-end-tag-after-frameset", {name: name});
	};

	modes.beforeHead = Object.create(modes.base);

	modes.beforeHead.start_tag_handlers = {
		html: 'startTagHtml',
		head: 'startTagHead',
		'-default': 'startTagOther'
	};

	modes.beforeHead.end_tag_handlers = {
		html: 'endTagImplyHead',
		head: 'endTagImplyHead',
		body: 'endTagImplyHead',
		br: 'endTagImplyHead',
		'-default': 'endTagOther'
	};

	modes.beforeHead.processEOF = function() {
		this.startTagHead('head', []);
		tree.insertionMode.processEOF();
	};

	modes.beforeHead.processCharacters = function(buffer) {
		buffer.skipLeadingWhitespace();
		if (!buffer.length)
			return;
		this.startTagHead('head', []);
		tree.insertionMode.processCharacters(buffer);
	};

	modes.beforeHead.startTagHead = function(name, attributes) {
		tree.insertHeadElement(attributes);
		tree.setInsertionMode('inHead');
	};

	modes.beforeHead.startTagOther = function(name, attributes, selfClosing) {
		this.startTagHead('head', []);
		tree.insertionMode.processStartTag(name, attributes, selfClosing);
	};

	modes.beforeHead.endTagImplyHead = function(name) {
		this.startTagHead('head', []);
		tree.insertionMode.processEndTag(name);
	};

	modes.beforeHead.endTagOther = function(name) {
		tree.parseError('end-tag-after-implied-root', {name: name});
	};

	modes.inHead = Object.create(modes.base);

	modes.inHead.start_tag_handlers = {
		html: 'startTagHtml',
		head: 'startTagHead',
		title: 'startTagTitle',
		script: 'startTagScript',
		style: 'startTagNoFramesStyle',
		noscript: 'startTagNoScript',
		noframes: 'startTagNoFramesStyle',
		base: 'startTagBaseBasefontBgsoundLink',
		basefont: 'startTagBaseBasefontBgsoundLink',
		bgsound: 'startTagBaseBasefontBgsoundLink',
		link: 'startTagBaseBasefontBgsoundLink',
		meta: 'startTagMeta',
		"-default": 'startTagOther'
	};

	modes.inHead.end_tag_handlers = {
		head: 'endTagHead',
		html: 'endTagHtmlBodyBr',
		body: 'endTagHtmlBodyBr',
		br: 'endTagHtmlBodyBr',
		"-default": 'endTagOther'
	};

	modes.inHead.processEOF = function() {
		var name = tree.currentStackItem().localName;
		if (['title', 'style', 'script'].indexOf(name) != -1) {
			tree.parseError("expected-named-closing-tag-but-got-eof", {name: name});
			tree.popElement();
		}

		this.anythingElse();

		tree.insertionMode.processEOF();
	};

	modes.inHead.processCharacters = function(buffer) {
		var leadingWhitespace = buffer.takeLeadingWhitespace();
		if (leadingWhitespace)
			tree.insertText(leadingWhitespace);
		if (!buffer.length)
			return;
		this.anythingElse();
		tree.insertionMode.processCharacters(buffer);
	};

	modes.inHead.startTagHtml = function(name, attributes) {
		modes.inBody.processStartTag(name, attributes);
	};

	modes.inHead.startTagHead = function(name, attributes) {
		tree.parseError('two-heads-are-not-better-than-one');
	};

	modes.inHead.startTagTitle = function(name, attributes) {
		tree.processGenericRCDATAStartTag(name, attributes);
	};

	modes.inHead.startTagNoScript = function(name, attributes) {
		if (tree.scriptingEnabled)
			return tree.processGenericRawTextStartTag(name, attributes);
		tree.insertElement(name, attributes);
		tree.setInsertionMode('inHeadNoscript');
	};

	modes.inHead.startTagNoFramesStyle = function(name, attributes) {
		tree.processGenericRawTextStartTag(name, attributes);
	};

	modes.inHead.startTagScript = function(name, attributes) {
		tree.insertElement(name, attributes);
		tree.tokenizer.setState(Tokenizer.SCRIPT_DATA);
		tree.originalInsertionMode = tree.insertionModeName;
		tree.setInsertionMode('text');
	};

	modes.inHead.startTagBaseBasefontBgsoundLink = function(name, attributes) {
		tree.insertSelfClosingElement(name, attributes);
	};

	modes.inHead.startTagMeta = function(name, attributes) {
		tree.insertSelfClosingElement(name, attributes);
	};

	modes.inHead.startTagOther = function(name, attributes, selfClosing) {
		this.anythingElse();
		tree.insertionMode.processStartTag(name, attributes, selfClosing);
	};

	modes.inHead.endTagHead = function(name) {
		if (tree.openElements.item(tree.openElements.length - 1).localName == 'head') {
			tree.openElements.pop();
		} else {
			tree.parseError('unexpected-end-tag', {name: 'head'});
		}
		tree.setInsertionMode('afterHead');
	};

	modes.inHead.endTagHtmlBodyBr = function(name) {
		this.anythingElse();
		tree.insertionMode.processEndTag(name);
	};

	modes.inHead.endTagOther = function(name) {
		tree.parseError('unexpected-end-tag', {name: name});
	};

	modes.inHead.anythingElse = function() {
		this.endTagHead('head');
	};

	modes.afterHead = Object.create(modes.base);

	modes.afterHead.start_tag_handlers = {
		html: 'startTagHtml',
		head: 'startTagHead',
		body: 'startTagBody',
		frameset: 'startTagFrameset',
		base: 'startTagFromHead',
		link: 'startTagFromHead',
		meta: 'startTagFromHead',
		script: 'startTagFromHead',
		style: 'startTagFromHead',
		title: 'startTagFromHead',
		"-default": 'startTagOther'
	};

	modes.afterHead.end_tag_handlers = {
		body: 'endTagBodyHtmlBr',
		html: 'endTagBodyHtmlBr',
		br: 'endTagBodyHtmlBr',
		"-default": 'endTagOther'
	};

	modes.afterHead.processEOF = function() {
		this.anythingElse();
		tree.insertionMode.processEOF();
	};

	modes.afterHead.processCharacters = function(buffer) {
		var leadingWhitespace = buffer.takeLeadingWhitespace();
		if (leadingWhitespace)
			tree.insertText(leadingWhitespace);
		if (!buffer.length)
			return;
		this.anythingElse();
		tree.insertionMode.processCharacters(buffer);
	};

	modes.afterHead.startTagHtml = function(name, attributes) {
		modes.inBody.processStartTag(name, attributes);
	};

	modes.afterHead.startTagBody = function(name, attributes) {
		tree.framesetOk = false;
		tree.insertBodyElement(attributes);
		tree.setInsertionMode('inBody');
	};

	modes.afterHead.startTagFrameset = function(name, attributes) {
		tree.insertElement(name, attributes);
		tree.setInsertionMode('inFrameset');
	};

	modes.afterHead.startTagFromHead = function(name, attributes, selfClosing) {
		tree.parseError("unexpected-start-tag-out-of-my-head", {name: name});
		tree.openElements.push(tree.head);
		modes.inHead.processStartTag(name, attributes, selfClosing);
		tree.openElements.remove(tree.head);
	};

	modes.afterHead.startTagHead = function(name, attributes, selfClosing) {
		tree.parseError('unexpected-start-tag', {name: name});
	};

	modes.afterHead.startTagOther = function(name, attributes, selfClosing) {
		this.anythingElse();
		tree.insertionMode.processStartTag(name, attributes, selfClosing);
	};

	modes.afterHead.endTagBodyHtmlBr = function(name) {
		this.anythingElse();
		tree.insertionMode.processEndTag(name);
	};

	modes.afterHead.endTagOther = function(name) {
		tree.parseError('unexpected-end-tag', {name: name});
	};

	modes.afterHead.anythingElse = function() {
		tree.insertBodyElement([]);
		tree.setInsertionMode('inBody');
		tree.framesetOk = true;
	}

	modes.inBody = Object.create(modes.base);

	modes.inBody.start_tag_handlers = {
		html: 'startTagHtml',
		head: 'startTagMisplaced',
		base: 'startTagProcessInHead',
		basefont: 'startTagProcessInHead',
		bgsound: 'startTagProcessInHead',
		link: 'startTagProcessInHead',
		meta: 'startTagProcessInHead',
		noframes: 'startTagProcessInHead',
		script: 'startTagProcessInHead',
		style: 'startTagProcessInHead',
		title: 'startTagProcessInHead',
		body: 'startTagBody',
		form: 'startTagForm',
		plaintext: 'startTagPlaintext',
		a: 'startTagA',
		button: 'startTagButton',
		xmp: 'startTagXmp',
		table: 'startTagTable',
		hr: 'startTagHr',
		image: 'startTagImage',
		input: 'startTagInput',
		textarea: 'startTagTextarea',
		select: 'startTagSelect',
		isindex: 'startTagIsindex',
		applet:	'startTagAppletMarqueeObject',
		marquee:	'startTagAppletMarqueeObject',
		object:	'startTagAppletMarqueeObject',
		li: 'startTagListItem',
		dd: 'startTagListItem',
		dt: 'startTagListItem',
		address: 'startTagCloseP',
		article: 'startTagCloseP',
		aside: 'startTagCloseP',
		blockquote: 'startTagCloseP',
		center: 'startTagCloseP',
		details: 'startTagCloseP',
		dir: 'startTagCloseP',
		div: 'startTagCloseP',
		dl: 'startTagCloseP',
		fieldset: 'startTagCloseP',
		figcaption: 'startTagCloseP',
		figure: 'startTagCloseP',
		footer: 'startTagCloseP',
		header: 'startTagCloseP',
		hgroup: 'startTagCloseP',
		main: 'startTagCloseP',
		menu: 'startTagCloseP',
		nav: 'startTagCloseP',
		ol: 'startTagCloseP',
		p: 'startTagCloseP',
		section: 'startTagCloseP',
		summary: 'startTagCloseP',
		ul: 'startTagCloseP',
		listing: 'startTagPreListing',
		pre: 'startTagPreListing',
		b: 'startTagFormatting',
		big: 'startTagFormatting',
		code: 'startTagFormatting',
		em: 'startTagFormatting',
		font: 'startTagFormatting',
		i: 'startTagFormatting',
		s: 'startTagFormatting',
		small: 'startTagFormatting',
		strike: 'startTagFormatting',
		strong: 'startTagFormatting',
		tt: 'startTagFormatting',
		u: 'startTagFormatting',
		nobr: 'startTagNobr',
		area: 'startTagVoidFormatting',
		br: 'startTagVoidFormatting',
		embed: 'startTagVoidFormatting',
		img: 'startTagVoidFormatting',
		keygen: 'startTagVoidFormatting',
		wbr: 'startTagVoidFormatting',
		param: 'startTagParamSourceTrack',
		source: 'startTagParamSourceTrack',
		track: 'startTagParamSourceTrack',
		iframe: 'startTagIFrame',
		noembed: 'startTagRawText',
		noscript: 'startTagRawText',
		h1: 'startTagHeading',
		h2: 'startTagHeading',
		h3: 'startTagHeading',
		h4: 'startTagHeading',
		h5: 'startTagHeading',
		h6: 'startTagHeading',
		caption: 'startTagMisplaced',
		col: 'startTagMisplaced',
		colgroup: 'startTagMisplaced',
		frame: 'startTagMisplaced',
		frameset: 'startTagFrameset',
		tbody: 'startTagMisplaced',
		td: 'startTagMisplaced',
		tfoot: 'startTagMisplaced',
		th: 'startTagMisplaced',
		thead: 'startTagMisplaced',
		tr: 'startTagMisplaced',
		option: 'startTagOptionOptgroup',
		optgroup: 'startTagOptionOptgroup',
		math: 'startTagMath',
		svg: 'startTagSVG',
		rt: 'startTagRpRt',
		rp: 'startTagRpRt',
		"-default": 'startTagOther'
	};

	modes.inBody.end_tag_handlers = {
		p: 'endTagP',
		body: 'endTagBody',
		html: 'endTagHtml',
		address: 'endTagBlock',
		article: 'endTagBlock',
		aside: 'endTagBlock',
		blockquote: 'endTagBlock',
		button: 'endTagBlock',
		center: 'endTagBlock',
		details: 'endTagBlock',
		dir: 'endTagBlock',
		div: 'endTagBlock',
		dl: 'endTagBlock',
		fieldset: 'endTagBlock',
		figcaption: 'endTagBlock',
		figure: 'endTagBlock',
		footer: 'endTagBlock',
		header: 'endTagBlock',
		hgroup: 'endTagBlock',
		listing: 'endTagBlock',
		main: 'endTagBlock',
		menu: 'endTagBlock',
		nav: 'endTagBlock',
		ol: 'endTagBlock',
		pre: 'endTagBlock',
		section: 'endTagBlock',
		summary: 'endTagBlock',
		ul: 'endTagBlock',
		form: 'endTagForm',
		applet: 'endTagAppletMarqueeObject',
		marquee: 'endTagAppletMarqueeObject',
		object: 'endTagAppletMarqueeObject',
		dd: 'endTagListItem',
		dt: 'endTagListItem',
		li: 'endTagListItem',
		h1: 'endTagHeading',
		h2: 'endTagHeading',
		h3: 'endTagHeading',
		h4: 'endTagHeading',
		h5: 'endTagHeading',
		h6: 'endTagHeading',
		a: 'endTagFormatting',
		b: 'endTagFormatting',
		big: 'endTagFormatting',
		code: 'endTagFormatting',
		em: 'endTagFormatting',
		font: 'endTagFormatting',
		i: 'endTagFormatting',
		nobr: 'endTagFormatting',
		s: 'endTagFormatting',
		small: 'endTagFormatting',
		strike: 'endTagFormatting',
		strong: 'endTagFormatting',
		tt: 'endTagFormatting',
		u: 'endTagFormatting',
		br: 'endTagBr',
		"-default": 'endTagOther'
	};

	modes.inBody.processCharacters = function(buffer) {
		if (tree.shouldSkipLeadingNewline) {
			tree.shouldSkipLeadingNewline = false;
			buffer.skipAtMostOneLeadingNewline();
		}
		tree.reconstructActiveFormattingElements();
		var characters = buffer.takeRemaining();
		characters = characters.replace(/\u0000/g, function(match, index){
			tree.parseError("invalid-codepoint");
			return '';
		});
		if (!characters)
			return;
		tree.insertText(characters);
		if (tree.framesetOk && !isAllWhitespaceOrReplacementCharacters(characters))
			tree.framesetOk = false;
	};

	modes.inBody.startTagHtml = function(name, attributes) {
		tree.parseError('non-html-root');
		tree.addAttributesToElement(tree.openElements.rootNode, attributes);
	};

	modes.inBody.startTagProcessInHead = function(name, attributes) {
		modes.inHead.processStartTag(name, attributes);
	};

	modes.inBody.startTagBody = function(name, attributes) {
		tree.parseError('unexpected-start-tag', {name: 'body'});
		if (tree.openElements.length == 1 ||
			tree.openElements.item(1).localName != 'body') {
			assert.ok(tree.context);
		} else {
			tree.framesetOk = false;
			tree.addAttributesToElement(tree.openElements.bodyElement, attributes);
		}
	};

	modes.inBody.startTagFrameset = function(name, attributes) {
		tree.parseError('unexpected-start-tag', {name: 'frameset'});
		if (tree.openElements.length == 1 ||
			tree.openElements.item(1).localName != 'body') {
			assert.ok(tree.context);
		} else if (tree.framesetOk) {
			tree.detachFromParent(tree.openElements.bodyElement);
			while (tree.openElements.length > 1)
				tree.openElements.pop();
			tree.insertElement(name, attributes);
			tree.setInsertionMode('inFrameset');
		}
	};

	modes.inBody.startTagCloseP = function(name, attributes) {
		if (tree.openElements.inButtonScope('p'))
			this.endTagP('p');
		tree.insertElement(name, attributes);
	};

	modes.inBody.startTagPreListing = function(name, attributes) {
		if (tree.openElements.inButtonScope('p'))
			this.endTagP('p');
		tree.insertElement(name, attributes);
		tree.framesetOk = false;
		tree.shouldSkipLeadingNewline = true;
	};

	modes.inBody.startTagForm = function(name, attributes) {
		if (tree.form) {
			tree.parseError('unexpected-start-tag', {name: name});
		} else {
			if (tree.openElements.inButtonScope('p'))
				this.endTagP('p');
			tree.insertElement(name, attributes);
			tree.form = tree.currentStackItem();
		}
	};

	modes.inBody.startTagRpRt = function(name, attributes) {
		if (tree.openElements.inScope('ruby')) {
			tree.generateImpliedEndTags();
			if (tree.currentStackItem().localName != 'ruby') {
				tree.parseError('unexpected-start-tag', {name: name});
			}
		}
		tree.insertElement(name, attributes);
	};

	modes.inBody.startTagListItem = function(name, attributes) {
		var stopNames = {li: ['li'], dd: ['dd', 'dt'], dt: ['dd', 'dt']};
		var stopName = stopNames[name];

		var els = tree.openElements;
		for (var i = els.length - 1; i >= 0; i--) {
			var node = els.item(i);
			if (stopName.indexOf(node.localName) != -1) {
				tree.insertionMode.processEndTag(node.localName);
				break;
			}
			if (node.isSpecial() && node.localName !== 'p' && node.localName !== 'address' && node.localName !== 'div')
				break;
		}
		if (tree.openElements.inButtonScope('p'))
			this.endTagP('p');
		tree.insertElement(name, attributes);
		tree.framesetOk = false;
	};

	modes.inBody.startTagPlaintext = function(name, attributes) {
		if (tree.openElements.inButtonScope('p'))
			this.endTagP('p');
		tree.insertElement(name, attributes);
		tree.tokenizer.setState(Tokenizer.PLAINTEXT);
	};

	modes.inBody.startTagHeading = function(name, attributes) {
		if (tree.openElements.inButtonScope('p'))
			this.endTagP('p');
		if (tree.currentStackItem().isNumberedHeader()) {
			tree.parseError('unexpected-start-tag', {name: name});
			tree.popElement();
		}
		tree.insertElement(name, attributes);
	};

	modes.inBody.startTagA = function(name, attributes) {
		var activeA = tree.elementInActiveFormattingElements('a');
		if (activeA) {
			tree.parseError("unexpected-start-tag-implies-end-tag", {startName: "a", endName: "a"});
			tree.adoptionAgencyEndTag('a');
			if (tree.openElements.contains(activeA))
				tree.openElements.remove(activeA);
			tree.removeElementFromActiveFormattingElements(activeA);
		}
		tree.reconstructActiveFormattingElements();
		tree.insertFormattingElement(name, attributes);
	};

	modes.inBody.startTagFormatting = function(name, attributes) {
		tree.reconstructActiveFormattingElements();
		tree.insertFormattingElement(name, attributes);
	};

	modes.inBody.startTagNobr = function(name, attributes) {
		tree.reconstructActiveFormattingElements();
		if (tree.openElements.inScope('nobr')) {
			tree.parseError("unexpected-start-tag-implies-end-tag", {startName: 'nobr', endName: 'nobr'});
			this.processEndTag('nobr');
				tree.reconstructActiveFormattingElements();
		}
		tree.insertFormattingElement(name, attributes);
	};

	modes.inBody.startTagButton = function(name, attributes) {
		if (tree.openElements.inScope('button')) {
			tree.parseError('unexpected-start-tag-implies-end-tag', {startName: 'button', endName: 'button'});
			this.processEndTag('button');
			tree.insertionMode.processStartTag(name, attributes);
		} else {
			tree.framesetOk = false;
			tree.reconstructActiveFormattingElements();
			tree.insertElement(name, attributes);
		}
	};

	modes.inBody.startTagAppletMarqueeObject = function(name, attributes) {
		tree.reconstructActiveFormattingElements();
		tree.insertElement(name, attributes);
		tree.activeFormattingElements.push(Marker);
		tree.framesetOk = false;
	};

	modes.inBody.endTagAppletMarqueeObject = function(name) {
		if (!tree.openElements.inScope(name)) {
			tree.parseError("unexpected-end-tag", {name: name});
		} else {
			tree.generateImpliedEndTags();
			if (tree.currentStackItem().localName != name) {
				tree.parseError('end-tag-too-early', {name: name});
			}
			tree.openElements.popUntilPopped(name);
			tree.clearActiveFormattingElements();
		}
	};

	modes.inBody.startTagXmp = function(name, attributes) {
		if (tree.openElements.inButtonScope('p'))
			this.processEndTag('p');
		tree.reconstructActiveFormattingElements();
		tree.processGenericRawTextStartTag(name, attributes);
		tree.framesetOk = false;
	};

	modes.inBody.startTagTable = function(name, attributes) {
		if (tree.compatMode !== "quirks")
			if (tree.openElements.inButtonScope('p'))
				this.processEndTag('p');
		tree.insertElement(name, attributes);
		tree.setInsertionMode('inTable');
		tree.framesetOk = false;
	};

	modes.inBody.startTagVoidFormatting = function(name, attributes) {
		tree.reconstructActiveFormattingElements();
		tree.insertSelfClosingElement(name, attributes);
		tree.framesetOk = false;
	};

	modes.inBody.startTagParamSourceTrack = function(name, attributes) {
		tree.insertSelfClosingElement(name, attributes);
	};

	modes.inBody.startTagHr = function(name, attributes) {
		if (tree.openElements.inButtonScope('p'))
			this.endTagP('p');
		tree.insertSelfClosingElement(name, attributes);
		tree.framesetOk = false;
	};

	modes.inBody.startTagImage = function(name, attributes) {
		tree.parseError('unexpected-start-tag-treated-as', {originalName: 'image', newName: 'img'});
		this.processStartTag('img', attributes);
	};

	modes.inBody.startTagInput = function(name, attributes) {
		var currentFramesetOk = tree.framesetOk;
		this.startTagVoidFormatting(name, attributes);
		for (var key in attributes) {
			if (attributes[key].nodeName == 'type') {
				if (attributes[key].nodeValue.toLowerCase() == 'hidden')
					tree.framesetOk = currentFramesetOk;
				break;
			}
		}
	};

	modes.inBody.startTagIsindex = function(name, attributes) {
		tree.parseError('deprecated-tag', {name: 'isindex'});
		tree.selfClosingFlagAcknowledged = true;
		if (tree.form)
			return;
		var formAttributes = [];
		var inputAttributes = [];
		var prompt = "This is a searchable index. Enter search keywords: ";
		for (var key in attributes) {
			switch (attributes[key].nodeName) {
				case 'action':
					formAttributes.push({nodeName: 'action',
						nodeValue: attributes[key].nodeValue});
					break;
				case 'prompt':
					prompt = attributes[key].nodeValue;
					break;
				case 'name':
					break;
				default:
					inputAttributes.push({nodeName: attributes[key].nodeName,
						nodeValue: attributes[key].nodeValue});
			}
		}
		inputAttributes.push({nodeName: 'name', nodeValue: 'isindex'});
		this.processStartTag('form', formAttributes);
		this.processStartTag('hr');
		this.processStartTag('label');
		this.processCharacters(new CharacterBuffer(prompt));
		this.processStartTag('input', inputAttributes);
		this.processEndTag('label');
		this.processStartTag('hr');
		this.processEndTag('form');
	};

	modes.inBody.startTagTextarea = function(name, attributes) {
		tree.insertElement(name, attributes);
		tree.tokenizer.setState(Tokenizer.RCDATA);
		tree.originalInsertionMode = tree.insertionModeName;
		tree.shouldSkipLeadingNewline = true;
		tree.framesetOk = false;
		tree.setInsertionMode('text');
	};

	modes.inBody.startTagIFrame = function(name, attributes) {
		tree.framesetOk = false;
		this.startTagRawText(name, attributes);
	};

	modes.inBody.startTagRawText = function(name, attributes) {
		tree.processGenericRawTextStartTag(name, attributes);
	};

	modes.inBody.startTagSelect = function(name, attributes) {
		tree.reconstructActiveFormattingElements();
		tree.insertElement(name, attributes);
		tree.framesetOk = false;
		var insertionModeName = tree.insertionModeName;
		if (insertionModeName == 'inTable' ||
			insertionModeName == 'inCaption' ||
			insertionModeName == 'inColumnGroup' ||
			insertionModeName == 'inTableBody' ||
			insertionModeName == 'inRow' ||
			insertionModeName == 'inCell') {
			tree.setInsertionMode('inSelectInTable');
		} else {
			tree.setInsertionMode('inSelect');
		}
	};

	modes.inBody.startTagMisplaced = function(name, attributes) {
		tree.parseError('unexpected-start-tag-ignored', {name: name});
	};

	modes.inBody.endTagMisplaced = function(name) {
		tree.parseError("unexpected-end-tag", {name: name});
	};

	modes.inBody.endTagBr = function(name) {
		tree.parseError("unexpected-end-tag-treated-as", {originalName: "br", newName: "br element"});
		tree.reconstructActiveFormattingElements();
		tree.insertElement(name, []);
		tree.popElement();
	};

	modes.inBody.startTagOptionOptgroup = function(name, attributes) {
		if (tree.currentStackItem().localName == 'option')
			tree.popElement();
		tree.reconstructActiveFormattingElements();
		tree.insertElement(name, attributes);
	};

	modes.inBody.startTagOther = function(name, attributes) {
		tree.reconstructActiveFormattingElements();
		tree.insertElement(name, attributes);
	};

	modes.inBody.endTagOther = function(name) {
		var node;
		for (var i = tree.openElements.length - 1; i > 0; i--) {
			node = tree.openElements.item(i);
			if (node.localName == name) {
				tree.generateImpliedEndTags(name);
				if (tree.currentStackItem().localName != name)
					tree.parseError('unexpected-end-tag', {name: name});
				tree.openElements.remove_openElements_until(function(x) {return x === node;});
				break;
			}
			if (node.isSpecial()) {
				tree.parseError('unexpected-end-tag', {name: name});
				break;
			}
		}
	};

	modes.inBody.startTagMath = function(name, attributes, selfClosing) {
		tree.reconstructActiveFormattingElements();
		attributes = tree.adjustMathMLAttributes(attributes);
		attributes = tree.adjustForeignAttributes(attributes);
		tree.insertForeignElement(name, attributes, "http://www.w3.org/1998/Math/MathML", selfClosing);
	};

	modes.inBody.startTagSVG = function(name, attributes, selfClosing) {
		tree.reconstructActiveFormattingElements();
		attributes = tree.adjustSVGAttributes(attributes);
		attributes = tree.adjustForeignAttributes(attributes);
		tree.insertForeignElement(name, attributes, "http://www.w3.org/2000/svg", selfClosing);
	};

	modes.inBody.endTagP = function(name) {
		if (!tree.openElements.inButtonScope('p')) {
			tree.parseError('unexpected-end-tag', {name: 'p'});
			this.startTagCloseP('p', []);
			this.endTagP('p');
		} else {
			tree.generateImpliedEndTags('p');
			if (tree.currentStackItem().localName != 'p')
				tree.parseError('unexpected-implied-end-tag', {name: 'p'});
			tree.openElements.popUntilPopped(name);
		}
	};

	modes.inBody.endTagBody = function(name) {
		if (!tree.openElements.inScope('body')) {
			tree.parseError('unexpected-end-tag', {name: name});
			return;
		}
		if (tree.currentStackItem().localName != 'body') {
			tree.parseError('expected-one-end-tag-but-got-another', {
				expectedName: tree.currentStackItem().localName,
				gotName: name
			});
		}
		tree.setInsertionMode('afterBody');
	};

	modes.inBody.endTagHtml = function(name) {
		if (!tree.openElements.inScope('body')) {
			tree.parseError('unexpected-end-tag', {name: name});
			return;
		}
		if (tree.currentStackItem().localName != 'body') {
			tree.parseError('expected-one-end-tag-but-got-another', {
				expectedName: tree.currentStackItem().localName,
				gotName: name
			});
		}
		tree.setInsertionMode('afterBody');
		tree.insertionMode.processEndTag(name);
	};

	modes.inBody.endTagBlock = function(name) {
		if (!tree.openElements.inScope(name)) {
			tree.parseError('unexpected-end-tag', {name: name});
		} else {
			tree.generateImpliedEndTags();
			if (tree.currentStackItem().localName != name) {
				tree.parseError('end-tag-too-early', {name: name});
			}
			tree.openElements.popUntilPopped(name);
		}
	};

	modes.inBody.endTagForm = function(name)  {
		var node = tree.form;
		tree.form = null;
		if (!node || !tree.openElements.inScope(name)) {
			tree.parseError('unexpected-end-tag', {name: name});
		} else {
			tree.generateImpliedEndTags();
			if (tree.currentStackItem() != node) {
				tree.parseError('end-tag-too-early-ignored', {name: 'form'});
			}
			tree.openElements.remove(node);
		}
	};

	modes.inBody.endTagListItem = function(name) {
		if (!tree.openElements.inListItemScope(name)) {
			tree.parseError('unexpected-end-tag', {name: name});
		} else {
			tree.generateImpliedEndTags(name);
			if (tree.currentStackItem().localName != name)
				tree.parseError('end-tag-too-early', {name: name});
			tree.openElements.popUntilPopped(name);
		}
	};

	modes.inBody.endTagHeading = function(name) {
		if (!tree.openElements.hasNumberedHeaderElementInScope()) {
			tree.parseError('unexpected-end-tag', {name: name});
			return;
		}
		tree.generateImpliedEndTags();
		if (tree.currentStackItem().localName != name)
			tree.parseError('end-tag-too-early', {name: name});

		tree.openElements.remove_openElements_until(function(e) {
			return e.isNumberedHeader();
		});
	};

	modes.inBody.endTagFormatting = function(name, attributes) {
		if (!tree.adoptionAgencyEndTag(name))
			this.endTagOther(name, attributes);
	};

	modes.inCaption = Object.create(modes.base);

	modes.inCaption.start_tag_handlers = {
		html: 'startTagHtml',
		caption: 'startTagTableElement',
		col: 'startTagTableElement',
		colgroup: 'startTagTableElement',
		tbody: 'startTagTableElement',
		td: 'startTagTableElement',
		tfoot: 'startTagTableElement',
		thead: 'startTagTableElement',
		tr: 'startTagTableElement',
		'-default': 'startTagOther'
	};

	modes.inCaption.end_tag_handlers = {
		caption: 'endTagCaption',
		table: 'endTagTable',
		body: 'endTagIgnore',
		col: 'endTagIgnore',
		colgroup: 'endTagIgnore',
		html: 'endTagIgnore',
		tbody: 'endTagIgnore',
		td: 'endTagIgnore',
		tfood: 'endTagIgnore',
		thead: 'endTagIgnore',
		tr: 'endTagIgnore',
		'-default': 'endTagOther'
	};

	modes.inCaption.processCharacters = function(data) {
		modes.inBody.processCharacters(data);
	};

	modes.inCaption.startTagTableElement = function(name, attributes) {
		tree.parseError('unexpected-end-tag', {name: name});
		var ignoreEndTag = !tree.openElements.inTableScope('caption');
		tree.insertionMode.processEndTag('caption');
		if (!ignoreEndTag) tree.insertionMode.processStartTag(name, attributes);
	};

	modes.inCaption.startTagOther = function(name, attributes, selfClosing) {
		modes.inBody.processStartTag(name, attributes, selfClosing);
	};

	modes.inCaption.endTagCaption = function(name) {
		if (!tree.openElements.inTableScope('caption')) {
			assert.ok(tree.context);
			tree.parseError('unexpected-end-tag', {name: name});
		} else {
			tree.generateImpliedEndTags();
			if (tree.currentStackItem().localName != 'caption') {
				tree.parseError('expected-one-end-tag-but-got-another', {
					gotName: "caption",
					expectedName: tree.currentStackItem().localName
				});
			}
			tree.openElements.popUntilPopped('caption');
			tree.clearActiveFormattingElements();
			tree.setInsertionMode('inTable');
		}
	};

	modes.inCaption.endTagTable = function(name) {
		tree.parseError("unexpected-end-table-in-caption");
		var ignoreEndTag = !tree.openElements.inTableScope('caption');
		tree.insertionMode.processEndTag('caption');
		if (!ignoreEndTag) tree.insertionMode.processEndTag(name);
	};

	modes.inCaption.endTagIgnore = function(name) {
		tree.parseError('unexpected-end-tag', {name: name});
	};

	modes.inCaption.endTagOther = function(name) {
		modes.inBody.processEndTag(name);
	};

	modes.inCell = Object.create(modes.base);

	modes.inCell.start_tag_handlers = {
		html: 'startTagHtml',
		caption: 'startTagTableOther',
		col: 'startTagTableOther',
		colgroup: 'startTagTableOther',
		tbody: 'startTagTableOther',
		td: 'startTagTableOther',
		tfoot: 'startTagTableOther',
		th: 'startTagTableOther',
		thead: 'startTagTableOther',
		tr: 'startTagTableOther',
		'-default': 'startTagOther'
	};

	modes.inCell.end_tag_handlers = {
		td: 'endTagTableCell',
		th: 'endTagTableCell',
		body: 'endTagIgnore',
		caption: 'endTagIgnore',
		col: 'endTagIgnore',
		colgroup: 'endTagIgnore',
		html: 'endTagIgnore',
		table: 'endTagImply',
		tbody: 'endTagImply',
		tfoot: 'endTagImply',
		thead: 'endTagImply',
		tr: 'endTagImply',
		'-default': 'endTagOther'
	};

	modes.inCell.processCharacters = function(data) {
		modes.inBody.processCharacters(data);
	};

	modes.inCell.startTagTableOther = function(name, attributes, selfClosing) {
		if (tree.openElements.inTableScope('td') || tree.openElements.inTableScope('th')) {
			this.closeCell();
			tree.insertionMode.processStartTag(name, attributes, selfClosing);
		} else {
			tree.parseError('unexpected-start-tag', {name: name});
		}
	};

	modes.inCell.startTagOther = function(name, attributes, selfClosing) {
		modes.inBody.processStartTag(name, attributes, selfClosing);
	};

	modes.inCell.endTagTableCell = function(name) {
		if (tree.openElements.inTableScope(name)) {
			tree.generateImpliedEndTags(name);
			if (tree.currentStackItem().localName != name.toLowerCase()) {
				tree.parseError('unexpected-cell-end-tag', {name: name});
				tree.openElements.popUntilPopped(name);
			} else {
				tree.popElement();
			}
			tree.clearActiveFormattingElements();
			tree.setInsertionMode('inRow');
		} else {
			tree.parseError('unexpected-end-tag', {name: name});
		}
	};

	modes.inCell.endTagIgnore = function(name) {
		tree.parseError('unexpected-end-tag', {name: name});
	};

	modes.inCell.endTagImply = function(name) {
		if (tree.openElements.inTableScope(name)) {
			this.closeCell();
			tree.insertionMode.processEndTag(name);
		} else {
			tree.parseError('unexpected-end-tag', {name: name});
		}
	};

	modes.inCell.endTagOther = function(name) {
		modes.inBody.processEndTag(name);
	};

	modes.inCell.closeCell = function() {
		if (tree.openElements.inTableScope('td')) {
			this.endTagTableCell('td');
		} else if (tree.openElements.inTableScope('th')) {
			this.endTagTableCell('th');
		}
	};


	modes.inColumnGroup = Object.create(modes.base);

	modes.inColumnGroup.start_tag_handlers = {
		html: 'startTagHtml',
		col: 'startTagCol',
		'-default': 'startTagOther'
	};

	modes.inColumnGroup.end_tag_handlers = {
		colgroup: 'endTagColgroup',
		col: 'endTagCol',
		'-default': 'endTagOther'
	};

	modes.inColumnGroup.ignoreEndTagColgroup = function() {
		return tree.currentStackItem().localName == 'html';
	};

	modes.inColumnGroup.processCharacters = function(buffer) {
		var leadingWhitespace = buffer.takeLeadingWhitespace();
		if (leadingWhitespace)
			tree.insertText(leadingWhitespace);
		if (!buffer.length)
			return;
		var ignoreEndTag = this.ignoreEndTagColgroup();
		this.endTagColgroup('colgroup');
		if (!ignoreEndTag) tree.insertionMode.processCharacters(buffer);
	};

	modes.inColumnGroup.startTagCol = function(name, attributes) {
		tree.insertSelfClosingElement(name, attributes);
	};

	modes.inColumnGroup.startTagOther = function(name, attributes, selfClosing) {
		var ignoreEndTag = this.ignoreEndTagColgroup();
		this.endTagColgroup('colgroup');
		if (!ignoreEndTag) tree.insertionMode.processStartTag(name, attributes, selfClosing);
	};

	modes.inColumnGroup.endTagColgroup = function(name) {
		if (this.ignoreEndTagColgroup()) {
			assert.ok(tree.context);
			tree.parseError('unexpected-end-tag', {name: name});
		} else {
			tree.popElement();
			tree.setInsertionMode('inTable');
		}
	};

	modes.inColumnGroup.endTagCol = function(name) {
		tree.parseError("no-end-tag", {name: 'col'});
	};

	modes.inColumnGroup.endTagOther = function(name) {
		var ignoreEndTag = this.ignoreEndTagColgroup();
		this.endTagColgroup('colgroup');
		if (!ignoreEndTag) tree.insertionMode.processEndTag(name) ;
	};

	modes.inForeignContent = Object.create(modes.base);

	modes.inForeignContent.processStartTag = function(name, attributes, selfClosing) {
		if (['b', 'big', 'blockquote', 'body', 'br', 'center', 'code', 'dd', 'div', 'dl', 'dt', 'em', 'embed', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'hr', 'i', 'img', 'li', 'listing', 'menu', 'meta', 'nobr', 'ol', 'p', 'pre', 'ruby', 's', 'small', 'span', 'strong', 'strike', 'sub', 'sup', 'table', 'tt', 'u', 'ul', 'var'].indexOf(name) != -1
				|| (name == 'font' && attributes.some(function(attr){ return ['color', 'face', 'size'].indexOf(attr.nodeName) >= 0 }))) {
			tree.parseError('unexpected-html-element-in-foreign-content', {name: name});
			while (tree.currentStackItem().isForeign()
				&& !tree.currentStackItem().isHtmlIntegrationPoint()
				&& !tree.currentStackItem().isMathMLTextIntegrationPoint()) {
				tree.openElements.pop();
			}
			tree.insertionMode.processStartTag(name, attributes, selfClosing);
			return;
		}
		if (tree.currentStackItem().namespaceURI == "http://www.w3.org/1998/Math/MathML") {
			attributes = tree.adjustMathMLAttributes(attributes);
		}
		if (tree.currentStackItem().namespaceURI == "http://www.w3.org/2000/svg") {
			name = tree.adjustSVGTagNameCase(name);
			attributes = tree.adjustSVGAttributes(attributes);
		}
		attributes = tree.adjustForeignAttributes(attributes);
		tree.insertForeignElement(name, attributes, tree.currentStackItem().namespaceURI, selfClosing);
	};

	modes.inForeignContent.processEndTag = function(name) {
		var node = tree.currentStackItem();
		var index = tree.openElements.length - 1;
		if (node.localName.toLowerCase() != name)
			tree.parseError("unexpected-end-tag", {name: name});

		while (true) {
			if (index === 0)
				break;
			if (node.localName.toLowerCase() == name) {
				while (tree.openElements.pop() != node);
				break;
			}
			index -= 1;
			node = tree.openElements.item(index);
			if (node.isForeign()) {
				continue;
			} else {
				tree.insertionMode.processEndTag(name);
				break;
			}
		}
	};

	modes.inForeignContent.processCharacters = function(buffer) {
		var characters = buffer.takeRemaining();
		characters = characters.replace(/\u0000/g, function(match, index){
			tree.parseError('invalid-codepoint');
			return '\uFFFD';
		});
		if (tree.framesetOk && !isAllWhitespaceOrReplacementCharacters(characters))
			tree.framesetOk = false;
		tree.insertText(characters);
	};

	modes.inHeadNoscript = Object.create(modes.base);

	modes.inHeadNoscript.start_tag_handlers = {
		html: 'startTagHtml',
		basefont: 'startTagBasefontBgsoundLinkMetaNoframesStyle',
		bgsound: 'startTagBasefontBgsoundLinkMetaNoframesStyle',
		link: 'startTagBasefontBgsoundLinkMetaNoframesStyle',
		meta: 'startTagBasefontBgsoundLinkMetaNoframesStyle',
		noframes: 'startTagBasefontBgsoundLinkMetaNoframesStyle',
		style: 'startTagBasefontBgsoundLinkMetaNoframesStyle',
		head: 'startTagHeadNoscript',
		noscript: 'startTagHeadNoscript',
		"-default": 'startTagOther'
	};

	modes.inHeadNoscript.end_tag_handlers = {
		noscript: 'endTagNoscript',
		br: 'endTagBr',
		'-default': 'endTagOther'
	};

	modes.inHeadNoscript.processCharacters = function(buffer) {
		var leadingWhitespace = buffer.takeLeadingWhitespace();
		if (leadingWhitespace)
			tree.insertText(leadingWhitespace);
		if (!buffer.length)
			return;
		tree.parseError("unexpected-char-in-frameset");
		this.anythingElse();
		tree.insertionMode.processCharacters(buffer);
	};

	modes.inHeadNoscript.processComment = function(data) {
		modes.inHead.processComment(data);
	};

	modes.inHeadNoscript.startTagBasefontBgsoundLinkMetaNoframesStyle = function(name, attributes) {
		modes.inHead.processStartTag(name, attributes);
	};

	modes.inHeadNoscript.startTagHeadNoscript = function(name, attributes) {
		tree.parseError("unexpected-start-tag-in-frameset", {name: name});
	};

	modes.inHeadNoscript.startTagOther = function(name, attributes) {
		tree.parseError("unexpected-start-tag-in-frameset", {name: name});
		this.anythingElse();
		tree.insertionMode.processStartTag(name, attributes);
	};

	modes.inHeadNoscript.endTagBr = function(name, attributes) {
		tree.parseError("unexpected-end-tag-in-frameset", {name: name});
		this.anythingElse();
		tree.insertionMode.processEndTag(name, attributes);
	};

	modes.inHeadNoscript.endTagNoscript = function(name, attributes) {
		tree.popElement();
		tree.setInsertionMode('inHead');
	};

	modes.inHeadNoscript.endTagOther = function(name, attributes) {
		tree.parseError("unexpected-end-tag-in-frameset", {name: name});
	};

	modes.inHeadNoscript.anythingElse = function() {
		tree.popElement();
		tree.setInsertionMode('inHead');
	};


	modes.inFrameset = Object.create(modes.base);

	modes.inFrameset.start_tag_handlers = {
		html: 'startTagHtml',
		frameset: 'startTagFrameset',
		frame: 'startTagFrame',
		noframes: 'startTagNoframes',
		"-default": 'startTagOther'
	};

	modes.inFrameset.end_tag_handlers = {
		frameset: 'endTagFrameset',
		noframes: 'endTagNoframes',
		'-default': 'endTagOther'
	};

	modes.inFrameset.processCharacters = function(data) {
		tree.parseError("unexpected-char-in-frameset");
	};

	modes.inFrameset.startTagFrameset = function(name, attributes) {
		tree.insertElement(name, attributes);
	};

	modes.inFrameset.startTagFrame = function(name, attributes) {
		tree.insertSelfClosingElement(name, attributes);
	};

	modes.inFrameset.startTagNoframes = function(name, attributes) {
		modes.inBody.processStartTag(name, attributes);
	};

	modes.inFrameset.startTagOther = function(name, attributes) {
		tree.parseError("unexpected-start-tag-in-frameset", {name: name});
	};

	modes.inFrameset.endTagFrameset = function(name, attributes) {
		if (tree.currentStackItem().localName == 'html') {
			tree.parseError("unexpected-frameset-in-frameset-innerhtml");
		} else {
			tree.popElement();
		}

		if (!tree.context && tree.currentStackItem().localName != 'frameset') {
			tree.setInsertionMode('afterFrameset');
		}
	};

	modes.inFrameset.endTagNoframes = function(name) {
		modes.inBody.processEndTag(name);
	};

	modes.inFrameset.endTagOther = function(name) {
		tree.parseError("unexpected-end-tag-in-frameset", {name: name});
	};

	modes.inTable = Object.create(modes.base);

	modes.inTable.start_tag_handlers = {
		html: 'startTagHtml',
		caption: 'startTagCaption',
		colgroup: 'startTagColgroup',
		col: 'startTagCol',
		table: 'startTagTable',
		tbody: 'startTagRowGroup',
		tfoot: 'startTagRowGroup',
		thead: 'startTagRowGroup',
		td: 'startTagImplyTbody',
		th: 'startTagImplyTbody',
		tr: 'startTagImplyTbody',
		style: 'startTagStyleScript',
		script: 'startTagStyleScript',
		input: 'startTagInput',
		form: 'startTagForm',
		'-default': 'startTagOther'
	};

	modes.inTable.end_tag_handlers = {
		table: 'endTagTable',
		body: 'endTagIgnore',
		caption: 'endTagIgnore',
		col: 'endTagIgnore',
		colgroup: 'endTagIgnore',
		html: 'endTagIgnore',
		tbody: 'endTagIgnore',
		td: 'endTagIgnore',
		tfoot: 'endTagIgnore',
		th: 'endTagIgnore',
		thead: 'endTagIgnore',
		tr: 'endTagIgnore',
		'-default': 'endTagOther'
	};

	modes.inTable.processCharacters =  function(data) {
		if (tree.currentStackItem().isFosterParenting()) {
			var originalInsertionMode = tree.insertionModeName;
			tree.setInsertionMode('inTableText');
			tree.originalInsertionMode = originalInsertionMode;
			tree.insertionMode.processCharacters(data);
		} else {
			tree.redirectAttachToFosterParent = true;
			modes.inBody.processCharacters(data);
			tree.redirectAttachToFosterParent = false;
		}
	};

	modes.inTable.startTagCaption = function(name, attributes) {
		tree.openElements.popUntilTableScopeMarker();
		tree.activeFormattingElements.push(Marker);
		tree.insertElement(name, attributes);
		tree.setInsertionMode('inCaption');
	};

	modes.inTable.startTagColgroup = function(name, attributes) {
		tree.openElements.popUntilTableScopeMarker();
		tree.insertElement(name, attributes);
		tree.setInsertionMode('inColumnGroup');
	};

	modes.inTable.startTagCol = function(name, attributes) {
		this.startTagColgroup('colgroup', []);
		tree.insertionMode.processStartTag(name, attributes);
	};

	modes.inTable.startTagRowGroup = function(name, attributes) {
		tree.openElements.popUntilTableScopeMarker();
		tree.insertElement(name, attributes);
		tree.setInsertionMode('inTableBody');
	};

	modes.inTable.startTagImplyTbody = function(name, attributes) {
		this.startTagRowGroup('tbody', []);
		tree.insertionMode.processStartTag(name, attributes);
	};

	modes.inTable.startTagTable = function(name, attributes) {
		tree.parseError("unexpected-start-tag-implies-end-tag",
				{startName: "table", endName: "table"});
		tree.insertionMode.processEndTag('table');
		if (!tree.context) tree.insertionMode.processStartTag(name, attributes);
	};

	modes.inTable.startTagStyleScript = function(name, attributes) {
		modes.inHead.processStartTag(name, attributes);
	};

	modes.inTable.startTagInput = function(name, attributes) {
		for (var key in attributes) {
			if (attributes[key].nodeName.toLowerCase() == 'type') {
				if (attributes[key].nodeValue.toLowerCase() == 'hidden') {
					tree.parseError("unexpected-hidden-input-in-table");
					tree.insertElement(name, attributes);
					tree.openElements.pop();
					return;
				}
				break;
			}
		}
		this.startTagOther(name, attributes);
	};

	modes.inTable.startTagForm = function(name, attributes) {
		tree.parseError("unexpected-form-in-table");
		if (!tree.form) {
			tree.insertElement(name, attributes);
			tree.form = tree.currentStackItem();
			tree.openElements.pop();
		}
	};

	modes.inTable.startTagOther = function(name, attributes, selfClosing) {
		tree.parseError("unexpected-start-tag-implies-table-voodoo", {name: name});
		tree.redirectAttachToFosterParent = true;
		modes.inBody.processStartTag(name, attributes, selfClosing);
		tree.redirectAttachToFosterParent = false;
	};

	modes.inTable.endTagTable = function(name) {
		if (tree.openElements.inTableScope(name)) {
			tree.generateImpliedEndTags();
			if (tree.currentStackItem().localName != name) {
				tree.parseError("end-tag-too-early-named", {gotName: 'table', expectedName: tree.currentStackItem().localName});
			}

			tree.openElements.popUntilPopped('table');
			tree.resetInsertionMode();
		} else {
			assert.ok(tree.context);
			tree.parseError('unexpected-end-tag', {name: name});
		}
	};

	modes.inTable.endTagIgnore = function(name) {
		tree.parseError("unexpected-end-tag", {name: name});
	};

	modes.inTable.endTagOther = function(name) {
		tree.parseError("unexpected-end-tag-implies-table-voodoo", {name: name});
		tree.redirectAttachToFosterParent = true;
		modes.inBody.processEndTag(name);
		tree.redirectAttachToFosterParent = false;
	};

	modes.inTableText = Object.create(modes.base);

	modes.inTableText.flushCharacters = function() {
		var characters = tree.pendingTableCharacters.join('');
		if (!isAllWhitespace(characters)) {
			tree.redirectAttachToFosterParent = true;
			tree.reconstructActiveFormattingElements();
			tree.insertText(characters);
			tree.framesetOk = false;
			tree.redirectAttachToFosterParent = false;
		} else {
			tree.insertText(characters);
		}
		tree.pendingTableCharacters = [];
	};

	modes.inTableText.processComment = function(data) {
		this.flushCharacters();
		tree.setInsertionMode(tree.originalInsertionMode);
		tree.insertionMode.processComment(data);
	};

	modes.inTableText.processEOF = function(data) {
		this.flushCharacters();
		tree.setInsertionMode(tree.originalInsertionMode);
		tree.insertionMode.processEOF();
	};

	modes.inTableText.processCharacters = function(buffer) {
		var characters = buffer.takeRemaining();
		characters = characters.replace(/\u0000/g, function(match, index){
			tree.parseError("invalid-codepoint");
			return '';
		});
		if (!characters)
			return;
		tree.pendingTableCharacters.push(characters);
	};

	modes.inTableText.processStartTag = function(name, attributes, selfClosing) {
		this.flushCharacters();
		tree.setInsertionMode(tree.originalInsertionMode);
		tree.insertionMode.processStartTag(name, attributes, selfClosing);
	};

	modes.inTableText.processEndTag = function(name, attributes) {
		this.flushCharacters();
		tree.setInsertionMode(tree.originalInsertionMode);
		tree.insertionMode.processEndTag(name, attributes);
	};

	modes.inTableBody = Object.create(modes.base);

	modes.inTableBody.start_tag_handlers = {
		html: 'startTagHtml',
		tr: 'startTagTr',
		td: 'startTagTableCell',
		th: 'startTagTableCell',
		caption: 'startTagTableOther',
		col: 'startTagTableOther',
		colgroup: 'startTagTableOther',
		tbody: 'startTagTableOther',
		tfoot: 'startTagTableOther',
		thead: 'startTagTableOther',
		'-default': 'startTagOther'
	};

	modes.inTableBody.end_tag_handlers = {
		table: 'endTagTable',
		tbody: 'endTagTableRowGroup',
		tfoot: 'endTagTableRowGroup',
		thead: 'endTagTableRowGroup',
		body: 'endTagIgnore',
		caption: 'endTagIgnore',
		col: 'endTagIgnore',
		colgroup: 'endTagIgnore',
		html: 'endTagIgnore',
		td: 'endTagIgnore',
		th: 'endTagIgnore',
		tr: 'endTagIgnore',
		'-default': 'endTagOther'
	};

	modes.inTableBody.processCharacters = function(data) {
		modes.inTable.processCharacters(data);
	};

	modes.inTableBody.startTagTr = function(name, attributes) {
		tree.openElements.popUntilTableBodyScopeMarker();
		tree.insertElement(name, attributes);
		tree.setInsertionMode('inRow');
	};

	modes.inTableBody.startTagTableCell = function(name, attributes) {
		tree.parseError("unexpected-cell-in-table-body", {name: name});
		this.startTagTr('tr', []);
		tree.insertionMode.processStartTag(name, attributes);
	};

	modes.inTableBody.startTagTableOther = function(name, attributes) {
		if (tree.openElements.inTableScope('tbody') ||  tree.openElements.inTableScope('thead') || tree.openElements.inTableScope('tfoot')) {
			tree.openElements.popUntilTableBodyScopeMarker();
			this.endTagTableRowGroup(tree.currentStackItem().localName);
			tree.insertionMode.processStartTag(name, attributes);
		} else {
			tree.parseError('unexpected-start-tag', {name: name});
		}
	};

	modes.inTableBody.startTagOther = function(name, attributes) {
		modes.inTable.processStartTag(name, attributes);
	};

	modes.inTableBody.endTagTableRowGroup = function(name) {
		if (tree.openElements.inTableScope(name)) {
			tree.openElements.popUntilTableBodyScopeMarker();
			tree.popElement();
			tree.setInsertionMode('inTable');
		} else {
			tree.parseError('unexpected-end-tag-in-table-body', {name: name});
		}
	};

	modes.inTableBody.endTagTable = function(name) {
		if (tree.openElements.inTableScope('tbody') ||  tree.openElements.inTableScope('thead') || tree.openElements.inTableScope('tfoot')) {
			tree.openElements.popUntilTableBodyScopeMarker();
			this.endTagTableRowGroup(tree.currentStackItem().localName);
			tree.insertionMode.processEndTag(name);
		} else {
			tree.parseError('unexpected-end-tag', {name: name});
		}
	};

	modes.inTableBody.endTagIgnore = function(name) {
		tree.parseError("unexpected-end-tag-in-table-body", {name: name});
	};

	modes.inTableBody.endTagOther = function(name) {
		modes.inTable.processEndTag(name);
	};

	modes.inSelect = Object.create(modes.base);

	modes.inSelect.start_tag_handlers = {
		html: 'startTagHtml',
		option: 'startTagOption',
		optgroup: 'startTagOptgroup',
		select: 'startTagSelect',
		input: 'startTagInput',
		keygen: 'startTagInput',
		textarea: 'startTagInput',
		script: 'startTagScript',
		'-default': 'startTagOther'
	};

	modes.inSelect.end_tag_handlers = {
		option: 'endTagOption',
		optgroup: 'endTagOptgroup',
		select: 'endTagSelect',
		caption: 'endTagTableElements',
		table: 'endTagTableElements',
		tbody: 'endTagTableElements',
		tfoot: 'endTagTableElements',
		thead: 'endTagTableElements',
		tr: 'endTagTableElements',
		td: 'endTagTableElements',
		th: 'endTagTableElements',
		'-default': 'endTagOther'
	};

	modes.inSelect.processCharacters = function(buffer) {
		var data = buffer.takeRemaining();
		data = data.replace(/\u0000/g, function(match, index){
			tree.parseError("invalid-codepoint");
			return '';
		});
		if (!data)
			return;
		tree.insertText(data);
	};

	modes.inSelect.startTagOption = function(name, attributes) {
		if (tree.currentStackItem().localName == 'option')
			tree.popElement();
		tree.insertElement(name, attributes);
	};

	modes.inSelect.startTagOptgroup = function(name, attributes) {
		if (tree.currentStackItem().localName == 'option')
			tree.popElement();
		if (tree.currentStackItem().localName == 'optgroup')
			tree.popElement();
		tree.insertElement(name, attributes);
	};

	modes.inSelect.endTagOption = function(name) {
		if (tree.currentStackItem().localName !== 'option') {
			tree.parseError('unexpected-end-tag-in-select', {name: name});
			return;
		}
		tree.popElement();
	};

	modes.inSelect.endTagOptgroup = function(name) {
		if (tree.currentStackItem().localName == 'option' && tree.openElements.item(tree.openElements.length - 2).localName == 'optgroup') {
			tree.popElement();
		}
		if (tree.currentStackItem().localName == 'optgroup') {
			tree.popElement();
		} else {
			tree.parseError('unexpected-end-tag-in-select', {name: 'optgroup'});
		}
	};

	modes.inSelect.startTagSelect = function(name) {
		tree.parseError("unexpected-select-in-select");
		this.endTagSelect('select');
	};

	modes.inSelect.endTagSelect = function(name) {
		if (tree.openElements.inTableScope('select')) {
			tree.openElements.popUntilPopped('select');
			tree.resetInsertionMode();
		} else {
			tree.parseError('unexpected-end-tag', {name: name});
		}
	};

	modes.inSelect.startTagInput = function(name, attributes) {
		tree.parseError("unexpected-input-in-select");
		if (tree.openElements.inSelectScope('select')) {
			this.endTagSelect('select');
			tree.insertionMode.processStartTag(name, attributes);
		}
	};

	modes.inSelect.startTagScript = function(name, attributes) {
		modes.inHead.processStartTag(name, attributes);
	};

	modes.inSelect.endTagTableElements = function(name) {
		tree.parseError('unexpected-end-tag-in-select', {name: name});
		if (tree.openElements.inTableScope(name)) {
			this.endTagSelect('select');
			tree.insertionMode.processEndTag(name);
		}
	};

	modes.inSelect.startTagOther = function(name, attributes) {
		tree.parseError("unexpected-start-tag-in-select", {name: name});
	};

	modes.inSelect.endTagOther = function(name) {
		tree.parseError('unexpected-end-tag-in-select', {name: name});
	};

	modes.inSelectInTable = Object.create(modes.base);

	modes.inSelectInTable.start_tag_handlers = {
		caption: 'startTagTable',
		table: 'startTagTable',
		tbody: 'startTagTable',
		tfoot: 'startTagTable',
		thead: 'startTagTable',
		tr: 'startTagTable',
		td: 'startTagTable',
		th: 'startTagTable',
		'-default': 'startTagOther'
	};

	modes.inSelectInTable.end_tag_handlers = {
		caption: 'endTagTable',
		table: 'endTagTable',
		tbody: 'endTagTable',
		tfoot: 'endTagTable',
		thead: 'endTagTable',
		tr: 'endTagTable',
		td: 'endTagTable',
		th: 'endTagTable',
		'-default': 'endTagOther'
	};

	modes.inSelectInTable.processCharacters = function(data) {
		modes.inSelect.processCharacters(data);
	};

	modes.inSelectInTable.startTagTable = function(name, attributes) {
		tree.parseError("unexpected-table-element-start-tag-in-select-in-table", {name: name});
		this.endTagOther("select");
		tree.insertionMode.processStartTag(name, attributes);
	};

	modes.inSelectInTable.startTagOther = function(name, attributes, selfClosing) {
		modes.inSelect.processStartTag(name, attributes, selfClosing);
	};

	modes.inSelectInTable.endTagTable = function(name) {
		tree.parseError("unexpected-table-element-end-tag-in-select-in-table", {name: name});
		if (tree.openElements.inTableScope(name)) {
			this.endTagOther("select");
			tree.insertionMode.processEndTag(name);
		}
	};

	modes.inSelectInTable.endTagOther = function(name) {
		modes.inSelect.processEndTag(name);
	};

	modes.inRow = Object.create(modes.base);

	modes.inRow.start_tag_handlers = {
		html: 'startTagHtml',
		td: 'startTagTableCell',
		th: 'startTagTableCell',
		caption: 'startTagTableOther',
		col: 'startTagTableOther',
		colgroup: 'startTagTableOther',
		tbody: 'startTagTableOther',
		tfoot: 'startTagTableOther',
		thead: 'startTagTableOther',
		tr: 'startTagTableOther',
		'-default': 'startTagOther'
	};

	modes.inRow.end_tag_handlers = {
		tr: 'endTagTr',
		table: 'endTagTable',
		tbody: 'endTagTableRowGroup',
		tfoot: 'endTagTableRowGroup',
		thead: 'endTagTableRowGroup',
		body: 'endTagIgnore',
		caption: 'endTagIgnore',
		col: 'endTagIgnore',
		colgroup: 'endTagIgnore',
		html: 'endTagIgnore',
		td: 'endTagIgnore',
		th: 'endTagIgnore',
		'-default': 'endTagOther'
	};

	modes.inRow.processCharacters = function(data) {
		modes.inTable.processCharacters(data);
	};

	modes.inRow.startTagTableCell = function(name, attributes) {
		tree.openElements.popUntilTableRowScopeMarker();
		tree.insertElement(name, attributes);
		tree.setInsertionMode('inCell');
		tree.activeFormattingElements.push(Marker);
	};

	modes.inRow.startTagTableOther = function(name, attributes) {
		var ignoreEndTag = this.ignoreEndTagTr();
		this.endTagTr('tr');
		if (!ignoreEndTag) tree.insertionMode.processStartTag(name, attributes);
	};

	modes.inRow.startTagOther = function(name, attributes, selfClosing) {
		modes.inTable.processStartTag(name, attributes, selfClosing);
	};

	modes.inRow.endTagTr = function(name) {
		if (this.ignoreEndTagTr()) {
			assert.ok(tree.context);
			tree.parseError('unexpected-end-tag', {name: name});
		} else {
			tree.openElements.popUntilTableRowScopeMarker();
			tree.popElement();
			tree.setInsertionMode('inTableBody');
		}
	};

	modes.inRow.endTagTable = function(name) {
		var ignoreEndTag = this.ignoreEndTagTr();
		this.endTagTr('tr');
		if (!ignoreEndTag) tree.insertionMode.processEndTag(name);
	};

	modes.inRow.endTagTableRowGroup = function(name) {
		if (tree.openElements.inTableScope(name)) {
			this.endTagTr('tr');
			tree.insertionMode.processEndTag(name);
		} else {
			tree.parseError('unexpected-end-tag', {name: name});
		}
	};

	modes.inRow.endTagIgnore = function(name) {
		tree.parseError("unexpected-end-tag-in-table-row", {name: name});
	};

	modes.inRow.endTagOther = function(name) {
		modes.inTable.processEndTag(name);
	};

	modes.inRow.ignoreEndTagTr = function() {
		return !tree.openElements.inTableScope('tr');
	};

	modes.afterAfterFrameset = Object.create(modes.base);

	modes.afterAfterFrameset.start_tag_handlers = {
		html: 'startTagHtml',
		noframes: 'startTagNoFrames',
		'-default': 'startTagOther'
	};

	modes.afterAfterFrameset.processEOF = function() {};

	modes.afterAfterFrameset.processComment = function(data) {
		tree.insertComment(data, tree.document);
	};

	modes.afterAfterFrameset.processCharacters = function(buffer) {
		var characters = buffer.takeRemaining();
		var whitespace = "";
		for (var i = 0; i < characters.length; i++) {
			var ch = characters[i];
			if (isWhitespace(ch))
				whitespace += ch;
		}
		if (whitespace) {
			tree.reconstructActiveFormattingElements();
			tree.insertText(whitespace);
		}
		if (whitespace.length < characters.length)
			tree.parseError('expected-eof-but-got-char');
	};

	modes.afterAfterFrameset.startTagNoFrames = function(name, attributes) {
		modes.inHead.processStartTag(name, attributes);
	};

	modes.afterAfterFrameset.startTagOther = function(name, attributes, selfClosing) {
		tree.parseError('expected-eof-but-got-start-tag', {name: name});
	};

	modes.afterAfterFrameset.processEndTag = function(name, attributes) {
		tree.parseError('expected-eof-but-got-end-tag', {name: name});
	};

	modes.text = Object.create(modes.base);

	modes.text.start_tag_handlers = {
		'-default': 'startTagOther'
	};

	modes.text.end_tag_handlers = {
		script: 'endTagScript',
		'-default': 'endTagOther'
	};

	modes.text.processCharacters = function(buffer) {
		if (tree.shouldSkipLeadingNewline) {
			tree.shouldSkipLeadingNewline = false;
			buffer.skipAtMostOneLeadingNewline();
		}
		var data = buffer.takeRemaining();
		if (!data)
			return;
		tree.insertText(data);
	};

	modes.text.processEOF = function() {
		tree.parseError("expected-named-closing-tag-but-got-eof",
			{name: tree.currentStackItem().localName});
		tree.openElements.pop();
		tree.setInsertionMode(tree.originalInsertionMode);
		tree.insertionMode.processEOF();
	};

	modes.text.startTagOther = function(name) {
		throw "Tried to process start tag " + name + " in RCDATA/RAWTEXT mode";
	};

	modes.text.endTagScript = function(name) {
		var node = tree.openElements.pop();
		assert.ok(node.localName == 'script');
		tree.setInsertionMode(tree.originalInsertionMode);
	};

	modes.text.endTagOther = function(name) {
		tree.openElements.pop();
		tree.setInsertionMode(tree.originalInsertionMode);
	};
}

TreeBuilder.prototype.setInsertionMode = function(name) {
	this.insertionMode = this.insertionModes[name];
	this.insertionModeName = name;
};
TreeBuilder.prototype.adoptionAgencyEndTag = function(name) {
	var outerIterationLimit = 8;
	var innerIterationLimit = 3;
	var formattingElement;

	function isActiveFormattingElement(el) {
		return el === formattingElement;
	}

	var outerLoopCounter = 0;

	while (outerLoopCounter++ < outerIterationLimit) {
		formattingElement = this.elementInActiveFormattingElements(name);

		if (!formattingElement || (this.openElements.contains(formattingElement) && !this.openElements.inScope(formattingElement.localName))) {
			this.parseError('adoption-agency-1.1', {name: name});
			return false;
		}
		if (!this.openElements.contains(formattingElement)) {
			this.parseError('adoption-agency-1.2', {name: name});
			this.removeElementFromActiveFormattingElements(formattingElement);
			return true;
		}
		if (!this.openElements.inScope(formattingElement.localName)) {
			this.parseError('adoption-agency-4.4', {name: name});
		}

		if (formattingElement != this.currentStackItem()) {
			this.parseError('adoption-agency-1.3', {name: name});
		}
		var furthestBlock = this.openElements.furthestBlockForFormattingElement(formattingElement.node);

		if (!furthestBlock) {
			this.openElements.remove_openElements_until(isActiveFormattingElement);
			this.removeElementFromActiveFormattingElements(formattingElement);
			return true;
		}

		var afeIndex = this.openElements.elements.indexOf(formattingElement);
		var commonAncestor = this.openElements.item(afeIndex - 1);

		var bookmark = this.activeFormattingElements.indexOf(formattingElement);

		var node = furthestBlock;
		var lastNode = furthestBlock;
		var index = this.openElements.elements.indexOf(node);

		var innerLoopCounter = 0;
		while (innerLoopCounter++ < innerIterationLimit) {
			index -= 1;
			node = this.openElements.item(index);
			if (this.activeFormattingElements.indexOf(node) < 0) {
				this.openElements.elements.splice(index, 1);
				continue;
			}
			if (node == formattingElement)
				break;

			if (lastNode == furthestBlock)
				bookmark = this.activeFormattingElements.indexOf(node) + 1;

			var clone = this.createElement(node.namespaceURI, node.localName, node.attributes);
			var newNode = new StackItem(node.namespaceURI, node.localName, node.attributes, clone);

			this.activeFormattingElements[this.activeFormattingElements.indexOf(node)] = newNode;
			this.openElements.elements[this.openElements.elements.indexOf(node)] = newNode;

			node = newNode;
			this.detachFromParent(lastNode.node);
			this.attachNode(lastNode.node, node.node);
			lastNode = node;
		}

		this.detachFromParent(lastNode.node);
		if (commonAncestor.isFosterParenting()) {
			this.insertIntoFosterParent(lastNode.node);
		} else {
			this.attachNode(lastNode.node, commonAncestor.node);
		}

		var clone = this.createElement("http://www.w3.org/1999/xhtml", formattingElement.localName, formattingElement.attributes);
		var formattingClone = new StackItem(formattingElement.namespaceURI, formattingElement.localName, formattingElement.attributes, clone);

		this.reparentChildren(furthestBlock.node, clone);
		this.attachNode(clone, furthestBlock.node);

		this.removeElementFromActiveFormattingElements(formattingElement);
		this.activeFormattingElements.splice(Math.min(bookmark, this.activeFormattingElements.length), 0, formattingClone);

		this.openElements.remove(formattingElement);
		this.openElements.elements.splice(this.openElements.elements.indexOf(furthestBlock) + 1, 0, formattingClone);
	}

	return true;
};

TreeBuilder.prototype.start = function() {
	throw "Not mplemented";
};

TreeBuilder.prototype.startTokenization = function(tokenizer) {
	this.tokenizer = tokenizer;
	this.compatMode = "no quirks";
	this.originalInsertionMode = "initial";
	this.framesetOk = true;
	this.openElements = new ElementStack();
	this.activeFormattingElements = [];
	this.start();
	if (this.context) {
		switch(this.context) {
		case 'title':
		case 'textarea':
			this.tokenizer.setState(Tokenizer.RCDATA);
			break;
		case 'style':
		case 'xmp':
		case 'iframe':
		case 'noembed':
		case 'noframes':
			this.tokenizer.setState(Tokenizer.RAWTEXT);
			break;
		case 'script':
			this.tokenizer.setState(Tokenizer.SCRIPT_DATA);
			break;
		case 'noscript':
			if (this.scriptingEnabled)
				this.tokenizer.setState(Tokenizer.RAWTEXT);
			break;
		case 'plaintext':
			this.tokenizer.setState(Tokenizer.PLAINTEXT);
			break;
		}
		this.insertHtmlElement();
		this.resetInsertionMode();
	} else {
		this.setInsertionMode('initial');
	}
};

TreeBuilder.prototype.processToken = function(token) {
	this.selfClosingFlagAcknowledged = false;

	var currentNode = this.openElements.top || null;
	var insertionMode;
	if (!currentNode || !currentNode.isForeign() ||
		(currentNode.isMathMLTextIntegrationPoint() &&
			((token.type == 'StartTag' &&
					!(token.name in {mglyph:0, malignmark:0})) ||
				(token.type === 'Characters'))
		) ||
		(currentNode.namespaceURI == "http://www.w3.org/1998/Math/MathML" &&
			currentNode.localName == 'annotation-xml' &&
			token.type == 'StartTag' && token.name == 'svg'
		) ||
		(currentNode.isHtmlIntegrationPoint() &&
			token.type in {StartTag:0, Characters:0}
		) ||
		token.type == 'EOF'
	) {
		insertionMode = this.insertionMode;
	} else {
		insertionMode = this.insertionModes.inForeignContent;
	}
	switch(token.type) {
	case 'Characters':
		var buffer = new CharacterBuffer(token.data);
		insertionMode.processCharacters(buffer);
		break;
	case 'Comment':
		insertionMode.processComment(token.data);
		break;
	case 'StartTag':
		insertionMode.processStartTag(token.name, token.data, token.selfClosing);
		break;
	case 'EndTag':
		insertionMode.processEndTag(token.name);
		break;
	case 'Doctype':
		insertionMode.processDoctype(token.name, token.publicId, token.systemId, token.forceQuirks);
		break;
	case 'EOF':
		insertionMode.processEOF();
		break;
	}
};
TreeBuilder.prototype.isCdataSectionAllowed = function() {
	return this.openElements.length > 0 && this.currentStackItem().isForeign();
};
TreeBuilder.prototype.isSelfClosingFlagAcknowledged = function() {
	return this.selfClosingFlagAcknowledged;
};

TreeBuilder.prototype.createElement = function(namespaceURI, localName, attributes) {
	throw new Error("Not implemented");
};

TreeBuilder.prototype.attachNode = function(child, parent) {
	throw new Error("Not implemented");
};

TreeBuilder.prototype.attachNodeToFosterParent = function(child, table, stackParent) {
	throw new Error("Not implemented");
};

TreeBuilder.prototype.detachFromParent = function(node) {
	throw new Error("Not implemented");
};

TreeBuilder.prototype.addAttributesToElement = function(element, attributes) {
	throw new Error("Not implemented");
};

TreeBuilder.prototype.insertHtmlElement = function(attributes) {
	var root = this.createElement("http://www.w3.org/1999/xhtml", 'html', attributes);
	this.attachNode(root, this.document);
	this.openElements.pushHtmlElement(new StackItem("http://www.w3.org/1999/xhtml", 'html', attributes, root));
	return root;
};

TreeBuilder.prototype.insertHeadElement = function(attributes) {
	var element = this.createElement("http://www.w3.org/1999/xhtml", "head", attributes);
	this.head = new StackItem("http://www.w3.org/1999/xhtml", "head", attributes, element);
	this.attachNode(element, this.openElements.top.node);
	this.openElements.pushHeadElement(this.head);
	return element;
};

TreeBuilder.prototype.insertBodyElement = function(attributes) {
	var element = this.createElement("http://www.w3.org/1999/xhtml", "body", attributes);
	this.attachNode(element, this.openElements.top.node);
	this.openElements.pushBodyElement(new StackItem("http://www.w3.org/1999/xhtml", "body", attributes, element));
	return element;
};

TreeBuilder.prototype.insertIntoFosterParent = function(node) {
	var tableIndex = this.openElements.findIndex('table');
	var tableElement = this.openElements.item(tableIndex).node;
	if (tableIndex === 0)
		return this.attachNode(node, tableElement);
	this.attachNodeToFosterParent(node, tableElement, this.openElements.item(tableIndex - 1).node);
};

TreeBuilder.prototype.insertElement = function(name, attributes, namespaceURI, selfClosing) {
	if (!namespaceURI)
		namespaceURI = "http://www.w3.org/1999/xhtml";
	var element = this.createElement(namespaceURI, name, attributes);
	if (this.shouldFosterParent())
		this.insertIntoFosterParent(element);
	else
		this.attachNode(element, this.openElements.top.node);
	if (!selfClosing)
		this.openElements.push(new StackItem(namespaceURI, name, attributes, element));
};

TreeBuilder.prototype.insertFormattingElement = function(name, attributes) {
	this.insertElement(name, attributes, "http://www.w3.org/1999/xhtml");
	this.appendElementToActiveFormattingElements(this.currentStackItem());
};

TreeBuilder.prototype.insertSelfClosingElement = function(name, attributes) {
	this.selfClosingFlagAcknowledged = true;
	this.insertElement(name, attributes, "http://www.w3.org/1999/xhtml", true);
};

TreeBuilder.prototype.insertForeignElement = function(name, attributes, namespaceURI, selfClosing) {
	if (selfClosing)
		this.selfClosingFlagAcknowledged = true;
	this.insertElement(name, attributes, namespaceURI, selfClosing);
};

TreeBuilder.prototype.insertComment = function(data, parent) {
	throw new Error("Not implemented");
};

TreeBuilder.prototype.insertDoctype = function(name, publicId, systemId) {
	throw new Error("Not implemented");
};

TreeBuilder.prototype.insertText = function(data) {
	throw new Error("Not implemented");
};
TreeBuilder.prototype.currentStackItem = function() {
	return this.openElements.top;
};
TreeBuilder.prototype.popElement = function() {
	return this.openElements.pop();
};
TreeBuilder.prototype.shouldFosterParent = function() {
	return this.redirectAttachToFosterParent && this.currentStackItem().isFosterParenting();
};
TreeBuilder.prototype.generateImpliedEndTags = function(exclude) {
	var name = this.openElements.top.localName;
	if (['dd', 'dt', 'li', 'option', 'optgroup', 'p', 'rp', 'rt'].indexOf(name) != -1 && name != exclude) {
		this.popElement();
		this.generateImpliedEndTags(exclude);
	}
};
TreeBuilder.prototype.reconstructActiveFormattingElements = function() {
	if (this.activeFormattingElements.length === 0)
		return;
	var i = this.activeFormattingElements.length - 1;
	var entry = this.activeFormattingElements[i];
	if (entry == Marker || this.openElements.contains(entry))
		return;

	while (entry != Marker && !this.openElements.contains(entry)) {
		i -= 1;
		entry = this.activeFormattingElements[i];
		if (!entry)
			break;
	}

	while (true) {
		i += 1;
		entry = this.activeFormattingElements[i];
		this.insertElement(entry.localName, entry.attributes);
		var element = this.currentStackItem();
		this.activeFormattingElements[i] = element;
		if (element == this.activeFormattingElements[this.activeFormattingElements.length -1])
			break;
	}

};
TreeBuilder.prototype.ensureNoahsArkCondition = function(item) {
	var kNoahsArkCapacity = 3;
	if (this.activeFormattingElements.length < kNoahsArkCapacity)
		return;
	var candidates = [];
	var newItemAttributeCount = item.attributes.length;
	for (var i = this.activeFormattingElements.length - 1; i >= 0; i--) {
		var candidate = this.activeFormattingElements[i];
		if (candidate === Marker)
			break;
		if (item.localName !== candidate.localName || item.namespaceURI !== candidate.namespaceURI)
			continue;
		if (candidate.attributes.length != newItemAttributeCount)
			continue;
		candidates.push(candidate);
	}
	if (candidates.length < kNoahsArkCapacity)
		return;

	var remainingCandidates = [];
	var attributes = item.attributes;
	for (var i = 0; i < attributes.length; i++) {
		var attribute = attributes[i];

		for (var j = 0; j < candidates.length; j++) {
			var candidate = candidates[j];
			var candidateAttribute = getAttribute(candidate, attribute.nodeName);
			if (candidateAttribute && candidateAttribute.nodeValue === attribute.nodeValue)
				remainingCandidates.push(candidate);
		}
		if (remainingCandidates.length < kNoahsArkCapacity)
			return;
		candidates = remainingCandidates;
		remainingCandidates = [];
	}
	for (var i = kNoahsArkCapacity - 1; i < candidates.length; i++)
		this.removeElementFromActiveFormattingElements(candidates[i]);
};
TreeBuilder.prototype.appendElementToActiveFormattingElements = function(item) {
	this.ensureNoahsArkCondition(item);
	this.activeFormattingElements.push(item);
};
TreeBuilder.prototype.removeElementFromActiveFormattingElements = function(item) {
	var index = this.activeFormattingElements.indexOf(item);
	if (index >= 0)
		this.activeFormattingElements.splice(index, 1);
};

TreeBuilder.prototype.elementInActiveFormattingElements = function(name) {
	var els = this.activeFormattingElements;
	for (var i = els.length - 1; i >= 0; i--) {
		if (els[i] == Marker) break;
		if (els[i].localName == name) return els[i];
	}
	return false;
};

TreeBuilder.prototype.clearActiveFormattingElements = function() {
    while (!(this.activeFormattingElements.length === 0 || this.activeFormattingElements.pop() == Marker));
};

TreeBuilder.prototype.reparentChildren = function(oldParent, newParent) {
	throw new Error("Not implemented");
};
TreeBuilder.prototype.setFragmentContext = function(context) {
	this.context = context;
};
TreeBuilder.prototype.parseError = function(code, args) {
	if (!this.errorHandler)
		return;
	var message = formatMessage(messages[code], args);
	this.errorHandler.error(message, this.tokenizer._inputStream.location(), code);
};
TreeBuilder.prototype.resetInsertionMode = function() {
	var last = false;
	var node = null;
	for (var i = this.openElements.length - 1; i >= 0; i--) {
		node = this.openElements.item(i);
		if (i === 0) {
			assert.ok(this.context);
			last = true;
			node = new StackItem("http://www.w3.org/1999/xhtml", this.context, [], null);
		}

		if (node.namespaceURI === "http://www.w3.org/1999/xhtml") {
			if (node.localName === 'select')
				return this.setInsertionMode('inSelect');
			if (node.localName === 'td' || node.localName === 'th')
				return this.setInsertionMode('inCell');
			if (node.localName === 'tr')
				return this.setInsertionMode('inRow');
			if (node.localName === 'tbody' || node.localName === 'thead' || node.localName === 'tfoot')
				return this.setInsertionMode('inTableBody');
			if (node.localName === 'caption')
				return this.setInsertionMode('inCaption');
			if (node.localName === 'colgroup')
				return this.setInsertionMode('inColumnGroup');
			if (node.localName === 'table')
				return this.setInsertionMode('inTable');
			if (node.localName === 'head' && !last)
				return this.setInsertionMode('inHead');
			if (node.localName === 'body')
				return this.setInsertionMode('inBody');
			if (node.localName === 'frameset')
				return this.setInsertionMode('inFrameset');
			if (node.localName === 'html')
				if (!this.openElements.headElement)
					return this.setInsertionMode('beforeHead');
				else
					return this.setInsertionMode('afterHead');
		}

		if (last)
			return this.setInsertionMode('inBody');
	}
};

TreeBuilder.prototype.processGenericRCDATAStartTag = function(name, attributes) {
	this.insertElement(name, attributes);
	this.tokenizer.setState(Tokenizer.RCDATA);
	this.originalInsertionMode = this.insertionModeName;
	this.setInsertionMode('text');
};

TreeBuilder.prototype.processGenericRawTextStartTag = function(name, attributes) {
	this.insertElement(name, attributes);
	this.tokenizer.setState(Tokenizer.RAWTEXT);
	this.originalInsertionMode = this.insertionModeName;
	this.setInsertionMode('text');
};

TreeBuilder.prototype.adjustMathMLAttributes = function(attributes) {
	attributes.forEach(function(a) {
		a.namespaceURI = "http://www.w3.org/1998/Math/MathML";
		if (constants.MATHMLAttributeMap[a.nodeName])
			a.nodeName = constants.MATHMLAttributeMap[a.nodeName];
	});
	return attributes;
};

TreeBuilder.prototype.adjustSVGTagNameCase = function(name) {
	return constants.SVGTagMap[name] || name;
};

TreeBuilder.prototype.adjustSVGAttributes = function(attributes) {
	attributes.forEach(function(a) {
		a.namespaceURI = "http://www.w3.org/2000/svg";
		if (constants.SVGAttributeMap[a.nodeName])
			a.nodeName = constants.SVGAttributeMap[a.nodeName];
	});
	return attributes;
};

TreeBuilder.prototype.adjustForeignAttributes = function(attributes) {
	for (var i = 0; i < attributes.length; i++) {
		var attribute = attributes[i];
		var adjusted = constants.ForeignAttributeMap[attribute.nodeName];
		if (adjusted) {
			attribute.nodeName = adjusted.localName;
			attribute.prefix = adjusted.prefix;
			attribute.namespaceURI = adjusted.namespaceURI;
		}
	}
	return attributes;
};

function formatMessage(format, args) {
	return format.replace(new RegExp('{[0-9a-z-]+}', 'gi'), function(match) {
		return args[match.slice(1, -1)] || match;
	});
}

exports.TreeBuilder = TreeBuilder;

},
{"./ElementStack":1,"./StackItem":4,"./Tokenizer":5,"./constants":7,"./messages.json":8,"assert":13,"events":16}],
7:[function(_dereq_,module,exports){
exports.SVGTagMap = {
	"altglyph": "altGlyph",
	"altglyphdef": "altGlyphDef",
	"altglyphitem": "altGlyphItem",
	"animatecolor": "animateColor",
	"animatemotion": "animateMotion",
	"animatetransform": "animateTransform",
	"clippath": "clipPath",
	"feblend": "feBlend",
	"fecolormatrix": "feColorMatrix",
	"fecomponenttransfer": "feComponentTransfer",
	"fecomposite": "feComposite",
	"feconvolvematrix": "feConvolveMatrix",
	"fediffuselighting": "feDiffuseLighting",
	"fedisplacementmap": "feDisplacementMap",
	"fedistantlight": "feDistantLight",
	"feflood": "feFlood",
	"fefunca": "feFuncA",
	"fefuncb": "feFuncB",
	"fefuncg": "feFuncG",
	"fefuncr": "feFuncR",
	"fegaussianblur": "feGaussianBlur",
	"feimage": "feImage",
	"femerge": "feMerge",
	"femergenode": "feMergeNode",
	"femorphology": "feMorphology",
	"feoffset": "feOffset",
	"fepointlight": "fePointLight",
	"fespecularlighting": "feSpecularLighting",
	"fespotlight": "feSpotLight",
	"fetile": "feTile",
	"feturbulence": "feTurbulence",
	"foreignobject": "foreignObject",
	"glyphref": "glyphRef",
	"lineargradient": "linearGradient",
	"radialgradient": "radialGradient",
	"textpath": "textPath"
};

exports.MATHMLAttributeMap = {
	definitionurl: 'definitionURL'
};

exports.SVGAttributeMap = {
	attributename:	'attributeName',
	attributetype:	'attributeType',
	basefrequency:	'baseFrequency',
	baseprofile:	'baseProfile',
	calcmode:	'calcMode',
	clippathunits:	'clipPathUnits',
	contentscripttype:	'contentScriptType',
	contentstyletype:	'contentStyleType',
	diffuseconstant:	'diffuseConstant',
	edgemode:	'edgeMode',
	externalresourcesrequired:	'externalResourcesRequired',
	filterres:	'filterRes',
	filterunits:	'filterUnits',
	glyphref:	'glyphRef',
	gradienttransform:	'gradientTransform',
	gradientunits:	'gradientUnits',
	kernelmatrix:	'kernelMatrix',
	kernelunitlength:	'kernelUnitLength',
	keypoints:	'keyPoints',
	keysplines:	'keySplines',
	keytimes:	'keyTimes',
	lengthadjust:	'lengthAdjust',
	limitingconeangle:	'limitingConeAngle',
	markerheight:	'markerHeight',
	markerunits:	'markerUnits',
	markerwidth:	'markerWidth',
	maskcontentunits:	'maskContentUnits',
	maskunits:	'maskUnits',
	numoctaves:	'numOctaves',
	pathlength:	'pathLength',
	patterncontentunits:	'patternContentUnits',
	patterntransform:	'patternTransform',
	patternunits:	'patternUnits',
	pointsatx:	'pointsAtX',
	pointsaty:	'pointsAtY',
	pointsatz:	'pointsAtZ',
	preservealpha:	'preserveAlpha',
	preserveaspectratio:	'preserveAspectRatio',
	primitiveunits:	'primitiveUnits',
	refx:	'refX',
	refy:	'refY',
	repeatcount:	'repeatCount',
	repeatdur:	'repeatDur',
	requiredextensions:	'requiredExtensions',
	requiredfeatures:	'requiredFeatures',
	specularconstant:	'specularConstant',
	specularexponent:	'specularExponent',
	spreadmethod:	'spreadMethod',
	startoffset:	'startOffset',
	stddeviation:	'stdDeviation',
	stitchtiles:	'stitchTiles',
	surfacescale:	'surfaceScale',
	systemlanguage:	'systemLanguage',
	tablevalues:	'tableValues',
	targetx:	'targetX',
	targety:	'targetY',
	textlength:	'textLength',
	viewbox:	'viewBox',
	viewtarget:	'viewTarget',
	xchannelselector:	'xChannelSelector',
	ychannelselector:	'yChannelSelector',
	zoomandpan:	'zoomAndPan'
};

exports.ForeignAttributeMap = {
	"xlink:actuate": {prefix: "xlink", localName: "actuate", namespaceURI: "http://www.w3.org/1999/xlink"},
	"xlink:arcrole": {prefix: "xlink", localName: "arcrole", namespaceURI: "http://www.w3.org/1999/xlink"},
	"xlink:href": {prefix: "xlink", localName: "href", namespaceURI: "http://www.w3.org/1999/xlink"},
	"xlink:role": {prefix: "xlink", localName: "role", namespaceURI: "http://www.w3.org/1999/xlink"},
	"xlink:show": {prefix: "xlink", localName: "show", namespaceURI: "http://www.w3.org/1999/xlink"},
	"xlink:title": {prefix: "xlink", localName: "title", namespaceURI: "http://www.w3.org/1999/xlink"},
	"xlink:type": {prefix: "xlink", localName: "title", namespaceURI: "http://www.w3.org/1999/xlink"},
	"xml:base": {prefix: "xml", localName: "base", namespaceURI: "http://www.w3.org/XML/1998/namespace"},
	"xml:lang": {prefix: "xml", localName: "lang", namespaceURI: "http://www.w3.org/XML/1998/namespace"},
	"xml:space": {prefix: "xml", localName: "space", namespaceURI: "http://www.w3.org/XML/1998/namespace"},
	"xmlns": {prefix: null, localName: "xmlns", namespaceURI: "http://www.w3.org/2000/xmlns/"},
	"xmlns:xlink": {prefix: "xmlns", localName: "xlink", namespaceURI: "http://www.w3.org/2000/xmlns/"},
};
},
{}],
8:[function(_dereq_,module,exports){
module.exports={
	"null-character":
		"Null character in input stream, replaced with U+FFFD.",
	"invalid-codepoint":
		"Invalid codepoint in stream",
	"incorrectly-placed-solidus":
		"Solidus (/) incorrectly placed in tag.",
	"incorrect-cr-newline-entity":
		"Incorrect CR newline entity, replaced with LF.",
	"illegal-windows-1252-entity":
		"Entity used with illegal number (windows-1252 reference).",
	"cant-convert-numeric-entity":
		"Numeric entity couldn't be converted to character (codepoint U+{charAsInt}).",
	"invalid-numeric-entity-replaced":
		"Numeric entity represents an illegal codepoint. Expanded to the C1 controls range.",
	"numeric-entity-without-semicolon":
		"Numeric entity didn't end with ';'.",
	"expected-numeric-entity-but-got-eof":
		"Numeric entity expected. Got end of file instead.",
	"expected-numeric-entity":
		"Numeric entity expected but none found.",
	"named-entity-without-semicolon":
		"Named entity didn't end with ';'.",
	"expected-named-entity":
		"Named entity expected. Got none.",
	"attributes-in-end-tag":
		"End tag contains unexpected attributes.",
	"self-closing-flag-on-end-tag":
		"End tag contains unexpected self-closing flag.",
	"bare-less-than-sign-at-eof":
		"End of file after <.",
	"expected-tag-name-but-got-right-bracket":
		"Expected tag name. Got '>' instead.",
	"expected-tag-name-but-got-question-mark":
		"Expected tag name. Got '?' instead. (HTML doesn't support processing instructions.)",
	"expected-tag-name":
		"Expected tag name. Got something else instead.",
	"expected-closing-tag-but-got-right-bracket":
		"Expected closing tag. Got '>' instead. Ignoring '</>'.",
	"expected-closing-tag-but-got-eof":
		"Expected closing tag. Unexpected end of file.",
	"expected-closing-tag-but-got-char":
		"Expected closing tag. Unexpected character '{data}' found.",
	"eof-in-tag-name":
		"Unexpected end of file in the tag name.",
	"expected-attribute-name-but-got-eof":
		"Unexpected end of file. Expected attribute name instead.",
	"eof-in-attribute-name":
		"Unexpected end of file in attribute name.",
	"invalid-character-in-attribute-name":
		"Invalid character in attribute name.",
	"duplicate-attribute":
		"Dropped duplicate attribute '{name}' on tag.",
	"expected-end-of-tag-but-got-eof":
		"Unexpected end of file. Expected = or end of tag.",
	"expected-attribute-value-but-got-eof":
		"Unexpected end of file. Expected attribute value.",
	"expected-attribute-value-but-got-right-bracket":
		"Expected attribute value. Got '>' instead.",
	"unexpected-character-in-unquoted-attribute-value":
		"Unexpected character in unquoted attribute",
	"invalid-character-after-attribute-name":
		"Unexpected character after attribute name.",
	"unexpected-character-after-attribute-value":
		"Unexpected character after attribute value.",
	"eof-in-attribute-value-double-quote":
		"Unexpected end of file in attribute value (\").",
	"eof-in-attribute-value-single-quote":
		"Unexpected end of file in attribute value (').",
	"eof-in-attribute-value-no-quotes":
		"Unexpected end of file in attribute value.",
	"eof-after-attribute-value":
		"Unexpected end of file after attribute value.",
	"unexpected-eof-after-solidus-in-tag":
		"Unexpected end of file in tag. Expected >.",
	"unexpected-character-after-solidus-in-tag":
		"Unexpected character after / in tag. Expected >.",
	"expected-dashes-or-doctype":
		"Expected '--' or 'DOCTYPE'. Not found.",
	"unexpected-bang-after-double-dash-in-comment":
		"Unexpected ! after -- in comment.",
	"incorrect-comment":
		"Incorrect comment.",
	"eof-in-comment":
		"Unexpected end of file in comment.",
	"eof-in-comment-end-dash":
		"Unexpected end of file in comment (-).",
	"unexpected-dash-after-double-dash-in-comment":
		"Unexpected '-' after '--' found in comment.",
	"eof-in-comment-double-dash":
		"Unexpected end of file in comment (--).",
	"eof-in-comment-end-bang-state":
		"Unexpected end of file in comment.",
	"unexpected-char-in-comment":
		"Unexpected character in comment found.",
	"need-space-after-doctype":
		"No space after literal string 'DOCTYPE'.",
	"expected-doctype-name-but-got-right-bracket":
		"Unexpected > character. Expected DOCTYPE name.",
	"expected-doctype-name-but-got-eof":
		"Unexpected end of file. Expected DOCTYPE name.",
	"eof-in-doctype-name":
		"Unexpected end of file in DOCTYPE name.",
	"eof-in-doctype":
		"Unexpected end of file in DOCTYPE.",
	"expected-space-or-right-bracket-in-doctype":
		"Expected space or '>'. Got '{data}'.",
	"unexpected-end-of-doctype":
		"Unexpected end of DOCTYPE.",
	"unexpected-char-in-doctype":
		"Unexpected character in DOCTYPE.",
	"eof-in-bogus-doctype":
		"Unexpected end of file in bogus doctype.",
	"eof-in-innerhtml":
		"Unexpected EOF in inner html mode.",
	"unexpected-doctype":
		"Unexpected DOCTYPE. Ignored.",
	"non-html-root":
		"html needs to be the first start tag.",
	"expected-doctype-but-got-eof":
		"Unexpected End of file. Expected DOCTYPE.",
	"unknown-doctype":
		"Erroneous DOCTYPE. Expected <!DOCTYPE html>.",
	"quirky-doctype":
		"Quirky doctype. Expected <!DOCTYPE html>.",
	"almost-standards-doctype":
		"Almost standards mode doctype. Expected <!DOCTYPE html>.",
	"obsolete-doctype":
		"Obsolete doctype. Expected <!DOCTYPE html>.",
	"expected-doctype-but-got-chars":
		"Non-space characters found without seeing a doctype first. Expected e.g. <!DOCTYPE html>.",
	"expected-doctype-but-got-start-tag":
		"Start tag seen without seeing a doctype first. Expected e.g. <!DOCTYPE html>.",
	"expected-doctype-but-got-end-tag":
		"End tag seen without seeing a doctype first. Expected e.g. <!DOCTYPE html>.",
	"end-tag-after-implied-root":
		"Unexpected end tag ({name}) after the (implied) root element.",
	"expected-named-closing-tag-but-got-eof":
		"Unexpected end of file. Expected end tag ({name}).",
	"two-heads-are-not-better-than-one":
		"Unexpected start tag head in existing head. Ignored.",
	"unexpected-end-tag":
		"Unexpected end tag ({name}). Ignored.",
	"unexpected-implied-end-tag":
		"End tag {name} implied, but there were open elements.",
	"unexpected-start-tag-out-of-my-head":
		"Unexpected start tag ({name}) that can be in head. Moved.",
	"unexpected-start-tag":
		"Unexpected start tag ({name}).",
	"missing-end-tag":
		"Missing end tag ({name}).",
	"missing-end-tags":
		"Missing end tags ({name}).",
	"unexpected-start-tag-implies-end-tag":
		"Unexpected start tag ({startName}) implies end tag ({endName}).",
	"unexpected-start-tag-treated-as":
		"Unexpected start tag ({originalName}). Treated as {newName}.",
	"deprecated-tag":
		"Unexpected start tag {name}. Don't use it!",
	"unexpected-start-tag-ignored":
		"Unexpected start tag {name}. Ignored.",
	"expected-one-end-tag-but-got-another":
		"Unexpected end tag ({gotName}). Missing end tag ({expectedName}).",
	"end-tag-too-early":
		"End tag ({name}) seen too early. Expected other end tag.",
	"end-tag-too-early-named":
		"Unexpected end tag ({gotName}). Expected end tag ({expectedName}.",
	"end-tag-too-early-ignored":
		"End tag ({name}) seen too early. Ignored.",
	"adoption-agency-1.1":
		"End tag ({name}) violates step 1, paragraph 1 of the adoption agency algorithm.",
	"adoption-agency-1.2":
		"End tag ({name}) violates step 1, paragraph 2 of the adoption agency algorithm.",
	"adoption-agency-1.3":
		"End tag ({name}) violates step 1, paragraph 3 of the adoption agency algorithm.",
	"adoption-agency-4.4":
		"End tag ({name}) violates step 4, paragraph 4 of the adoption agency algorithm.",
	"unexpected-end-tag-treated-as":
		"Unexpected end tag ({originalName}). Treated as {newName}.",
	"no-end-tag":
		"This element ({name}) has no end tag.",
	"unexpected-implied-end-tag-in-table":
		"Unexpected implied end tag ({name}) in the table phase.",
	"unexpected-implied-end-tag-in-table-body":
		"Unexpected implied end tag ({name}) in the table body phase.",
	"unexpected-char-implies-table-voodoo":
		"Unexpected non-space characters in table context caused voodoo mode.",
	"unexpected-hidden-input-in-table":
		"Unexpected input with type hidden in table context.",
	"unexpected-form-in-table":
		"Unexpected form in table context.",
	"unexpected-start-tag-implies-table-voodoo":
		"Unexpected start tag ({name}) in table context caused voodoo mode.",
	"unexpected-end-tag-implies-table-voodoo":
		"Unexpected end tag ({name}) in table context caused voodoo mode.",
	"unexpected-cell-in-table-body":
		"Unexpected table cell start tag ({name}) in the table body phase.",
	"unexpected-cell-end-tag":
		"Got table cell end tag ({name}) while required end tags are missing.",
	"unexpected-end-tag-in-table-body":
		"Unexpected end tag ({name}) in the table body phase. Ignored.",
	"unexpected-implied-end-tag-in-table-row":
		"Unexpected implied end tag ({name}) in the table row phase.",
	"unexpected-end-tag-in-table-row":
		"Unexpected end tag ({name}) in the table row phase. Ignored.",
	"unexpected-select-in-select":
		"Unexpected select start tag in the select phase treated as select end tag.",
	"unexpected-input-in-select":
		"Unexpected input start tag in the select phase.",
	"unexpected-start-tag-in-select":
		"Unexpected start tag token ({name}) in the select phase. Ignored.",
	"unexpected-end-tag-in-select":
		"Unexpected end tag ({name}) in the select phase. Ignored.",
	"unexpected-table-element-start-tag-in-select-in-table":
		"Unexpected table element start tag ({name}) in the select in table phase.",
	"unexpected-table-element-end-tag-in-select-in-table":
		"Unexpected table element end tag ({name}) in the select in table phase.",
	"unexpected-char-after-body":
		"Unexpected non-space characters in the after body phase.",
	"unexpected-start-tag-after-body":
		"Unexpected start tag token ({name}) in the after body phase.",
	"unexpected-end-tag-after-body":
		"Unexpected end tag token ({name}) in the after body phase.",
	"unexpected-char-in-frameset":
		"Unepxected characters in the frameset phase. Characters ignored.",
	"unexpected-start-tag-in-frameset":
		"Unexpected start tag token ({name}) in the frameset phase. Ignored.",
	"unexpected-frameset-in-frameset-innerhtml":
		"Unexpected end tag token (frameset in the frameset phase (innerHTML).",
	"unexpected-end-tag-in-frameset":
		"Unexpected end tag token ({name}) in the frameset phase. Ignored.",
	"unexpected-char-after-frameset":
		"Unexpected non-space characters in the after frameset phase. Ignored.",
	"unexpected-start-tag-after-frameset":
		"Unexpected start tag ({name}) in the after frameset phase. Ignored.",
	"unexpected-end-tag-after-frameset":
		"Unexpected end tag ({name}) in the after frameset phase. Ignored.",
	"expected-eof-but-got-char":
		"Unexpected non-space characters. Expected end of file.",
	"expected-eof-but-got-start-tag":
		"Unexpected start tag ({name}). Expected end of file.",
	"expected-eof-but-got-end-tag":
		"Unexpected end tag ({name}). Expected end of file.",
	"unexpected-end-table-in-caption":
		"Unexpected end table tag in caption. Generates implied end caption.",
	"end-html-in-innerhtml": 
		"Unexpected html end tag in inner html mode.",
	"eof-in-table":
		"Unexpected end of file. Expected table content.",
	"eof-in-script":
		"Unexpected end of file. Expected script content.",
	"non-void-element-with-trailing-solidus":
		"Trailing solidus not allowed on element {name}.",
	"unexpected-html-element-in-foreign-content":
		"HTML start tag \"{name}\" in a foreign namespace context.",
	"unexpected-start-tag-in-table":
		"Unexpected {name}. Expected table content."
}
},
{}],
9:[function(_dereq_,module,exports){
var SAXTreeBuilder = _dereq_('./SAXTreeBuilder').SAXTreeBuilder;
var Tokenizer = _dereq_('../Tokenizer').Tokenizer;
var TreeParser = _dereq_('./TreeParser').TreeParser;

function SAXParser() {
	this.contentHandler = null;
	this._errorHandler = null;
	this._treeBuilder = new SAXTreeBuilder();
	this._tokenizer = new Tokenizer(this._treeBuilder);
	this._scriptingEnabled = false;
}

SAXParser.prototype.parse = function(source) {
	this._tokenizer.tokenize(source);
	var document = this._treeBuilder.document;
	if (document) {
		new TreeParser(this.contentHandler).parse(document);
	}
};

SAXParser.prototype.parseFragment = function(source, context) {
	this._treeBuilder.setFragmentContext(context);
	this._tokenizer.tokenize(source);
	var fragment = this._treeBuilder.getFragment();
	if (fragment) {
		new TreeParser(this.contentHandler).parse(fragment);
	}
};

Object.defineProperty(SAXParser.prototype, 'scriptingEnabled', {
	get: function() {
		return this._scriptingEnabled;
	},
	set: function(value) {
		this._scriptingEnabled = value;
		this._treeBuilder.scriptingEnabled = value;
	}
});

Object.defineProperty(SAXParser.prototype, 'errorHandler', {
	get: function() {
		return this._errorHandler;
	},
	set: function(value) {
		this._errorHandler = value;
		this._treeBuilder.errorHandler = value;
	}
});

exports.SAXParser = SAXParser;

},
{"../Tokenizer":5,"./SAXTreeBuilder":10,"./TreeParser":11}],
10:[function(_dereq_,module,exports){
var util = _dereq_('util');
var TreeBuilder = _dereq_('../TreeBuilder').TreeBuilder;

function SAXTreeBuilder() {
	TreeBuilder.call(this);
}

util.inherits(SAXTreeBuilder, TreeBuilder);

SAXTreeBuilder.prototype.start = function(tokenizer) {
	this.document = new Document(this.tokenizer);
};

SAXTreeBuilder.prototype.end = function() {
	this.document.endLocator = this.tokenizer;
};

SAXTreeBuilder.prototype.insertDoctype = function(name, publicId, systemId) {
	var doctype = new DTD(this.tokenizer, name, publicId, systemId);
	doctype.endLocator = this.tokenizer;
	this.document.appendChild(doctype);
};

SAXTreeBuilder.prototype.createElement = function(namespaceURI, localName, attributes) {
	var element = new Element(this.tokenizer, namespaceURI, localName, localName, attributes || []);
	return element;
};

SAXTreeBuilder.prototype.insertComment = function(data, parent) {
	if (!parent)
		parent = this.currentStackItem();
	var comment = new Comment(this.tokenizer, data);
	parent.appendChild(comment);
};

SAXTreeBuilder.prototype.appendCharacters = function(parent, data) {
	var text = new Characters(this.tokenizer, data);
	parent.appendChild(text);
};

SAXTreeBuilder.prototype.insertText = function(data) {
	if (this.redirectAttachToFosterParent && this.openElements.top.isFosterParenting()) {
		var tableIndex = this.openElements.findIndex('table');
		var tableItem = this.openElements.item(tableIndex);
		var table = tableItem.node;
		if (tableIndex === 0) {
			return this.appendCharacters(table, data);
		}
		var text = new Characters(this.tokenizer, data);
		var parent = table.parentNode;
		if (parent) {
			parent.insertBetween(text, table.previousSibling, table);
			return;
		}
		var stackParent = this.openElements.item(tableIndex - 1).node;
		stackParent.appendChild(text);
		return;
	}
	this.appendCharacters(this.currentStackItem().node, data);
};

SAXTreeBuilder.prototype.attachNode = function(node, parent) {
	parent.appendChild(node);
};

SAXTreeBuilder.prototype.attachNodeToFosterParent = function(child, table, stackParent) {
	var parent = table.parentNode;
	if (parent)
		parent.insertBetween(child, table.previousSibling, table);
	else
		stackParent.appendChild(child);
};

SAXTreeBuilder.prototype.detachFromParent = function(element) {
	element.detach();
};

SAXTreeBuilder.prototype.reparentChildren = function(oldParent, newParent) {
	newParent.appendChildren(oldParent.firstChild);
};

SAXTreeBuilder.prototype.getFragment = function() {
	var fragment = new DocumentFragment();
	this.reparentChildren(this.openElements.rootNode, fragment);
	return fragment;
};

function getAttribute(node, name) {
	for (var i = 0; i < node.attributes.length; i++) {
		var attribute = node.attributes[i];
		if (attribute.nodeName === name)
			return attribute.nodeValue;
	}
}

SAXTreeBuilder.prototype.addAttributesToElement = function(element, attributes) {
	for (var i = 0; i < attributes.length; i++) {
		var attribute = attributes[i];
		if (!getAttribute(element, attribute.nodeName))
			element.attributes.push(attribute);
	}
};

var NodeType = {
	CDATA: 1,
	CHARACTERS: 2,
	COMMENT: 3,
	DOCUMENT: 4,
	DOCUMENT_FRAGMENT: 5,
	DTD: 6,
	ELEMENT: 7,
	ENTITY: 8,
	IGNORABLE_WHITESPACE: 9,
	PROCESSING_INSTRUCTION: 10,
	SKIPPED_ENTITY: 11
};
function Node(locator) {
	if (!locator) {
		this.columnNumber = -1;
		this.lineNumber = -1;
	} else {
		this.columnNumber = locator.columnNumber;
		this.lineNumber = locator.lineNumber;
	}
	this.parentNode = null;
	this.nextSibling = null;
	this.firstChild = null;
}
Node.prototype.visit = function(treeParser) {
	throw new Error("Not Implemented");
};
Node.prototype.revisit = function(treeParser) {
	return;
};
Node.prototype.detach = function() {
	if (this.parentNode !== null) {
		this.parentNode.removeChild(this);
		this.parentNode = null;
	}
};

Object.defineProperty(Node.prototype, 'previousSibling', {
	get: function() {
		var prev = null;
		var next = this.parentNode.firstChild;
		for(;;) {
			if (this == next) {
				return prev;
			}
			prev = next;
			next = next.nextSibling;
		}
	}
});


function ParentNode(locator) {
	Node.call(this, locator);
	this.lastChild = null;
	this._endLocator = null;
}

ParentNode.prototype = Object.create(Node.prototype);
ParentNode.prototype.insertBefore = function(child, sibling) {
	if (!sibling) {
		return this.appendChild(child);
	}
	child.detach();
	child.parentNode = this;
	if (this.firstChild == sibling) {
		child.nextSibling = sibling;
		this.firstChild = child;
	} else {
		var prev = this.firstChild;
		var next = this.firstChild.nextSibling;
		while (next != sibling) {
			prev = next;
			next = next.nextSibling;
		}
		prev.nextSibling = child;
		child.nextSibling = next;
	}
	return child;
};

ParentNode.prototype.insertBetween = function(child, prev, next) {
	if (!next) {
		return this.appendChild(child);
	}
	child.detach();
	child.parentNode = this;
	child.nextSibling = next;
	if (!prev) {
		firstChild = child;
	} else {
		prev.nextSibling = child;
	}
	return child;
};
ParentNode.prototype.appendChild = function(child) {
	child.detach();
	child.parentNode = this;
	if (!this.firstChild) {
		this.firstChild = child;
	} else {
		this.lastChild.nextSibling = child;
	}
	this.lastChild = child;
	return child;
};
ParentNode.prototype.appendChildren = function(parent) {
	var child = parent.firstChild;
	if (!child) {
		return;
	}
	var another = parent;
	if (!this.firstChild) {
		this.firstChild = child;
	} else {
		this.lastChild.nextSibling = child;
	}
	this.lastChild = another.lastChild;
	do {
		child.parentNode = this;
	} while ((child = child.nextSibling));
	another.firstChild = null;
	another.lastChild = null;
};
ParentNode.prototype.removeChild = function(node) {
	if (this.firstChild == node) {
		this.firstChild = node.nextSibling;
		if (this.lastChild == node) {
			this.lastChild = null;
		}
	} else {
		var prev = this.firstChild;
		var next = this.firstChild.nextSibling;
		while (next != node) {
			prev = next;
			next = next.nextSibling;
		}
		prev.nextSibling = node.nextSibling;
		if (this.lastChild == node) {
			this.lastChild = prev;
		}
	}
	node.parentNode = null;
	return node;
};

Object.defineProperty(ParentNode.prototype, 'endLocator', {
	get: function() {
		return this._endLocator;
	},
	set: function(endLocator) {
		this._endLocator = {
			lineNumber: endLocator.lineNumber,
			columnNumber: endLocator.columnNumber
		};
	}
});
function Document (locator) {
	ParentNode.call(this, locator);
	this.nodeType = NodeType.DOCUMENT;
}

Document.prototype = Object.create(ParentNode.prototype);
Document.prototype.visit = function(treeParser) {
	treeParser.startDocument(this);
};
Document.prototype.revisit = function(treeParser) {
	treeParser.endDocument(this.endLocator);
};
function DocumentFragment() {
	ParentNode.call(this, new Locator());
	this.nodeType = NodeType.DOCUMENT_FRAGMENT;
}

DocumentFragment.prototype = Object.create(ParentNode.prototype);
DocumentFragment.prototype.visit = function(treeParser) {
};
function Element(locator, uri, localName, qName, atts, prefixMappings) {
	ParentNode.call(this, locator);
	this.uri = uri;
	this.localName = localName;
	this.qName = qName;
	this.attributes = atts;
	this.prefixMappings = prefixMappings;
	this.nodeType = NodeType.ELEMENT;
}

Element.prototype = Object.create(ParentNode.prototype);
Element.prototype.visit = function(treeParser) {
	if (this.prefixMappings) {
		for (var key in prefixMappings) {
			var mapping = prefixMappings[key];
			treeParser.startPrefixMapping(mapping.getPrefix(),
					mapping.getUri(), this);
		}
	}
	treeParser.startElement(this.uri, this.localName, this.qName, this.attributes, this);
};
Element.prototype.revisit = function(treeParser) {
	treeParser.endElement(this.uri, this.localName, this.qName, this.endLocator);
	if (this.prefixMappings) {
		for (var key in prefixMappings) {
			var mapping = prefixMappings[key];
			treeParser.endPrefixMapping(mapping.getPrefix(), this.endLocator);
		}
	}
};
function Characters(locator, data){
	Node.call(this, locator);
	this.data = data;
	this.nodeType = NodeType.CHARACTERS;
}

Characters.prototype = Object.create(Node.prototype);
Characters.prototype.visit = function (treeParser) {
	treeParser.characters(this.data, 0, this.data.length, this);
};
function IgnorableWhitespace(locator, data) {
	Node.call(this, locator);
	this.data = data;
	this.nodeType = NodeType.IGNORABLE_WHITESPACE;
}

IgnorableWhitespace.prototype = Object.create(Node.prototype);
IgnorableWhitespace.prototype.visit = function(treeParser) {
	treeParser.ignorableWhitespace(this.data, 0, this.data.length, this);
};
function Comment(locator, data) {
	Node.call(this, locator);
	this.data = data;
	this.nodeType = NodeType.COMMENT;
}

Comment.prototype = Object.create(Node.prototype);
Comment.prototype.visit = function(treeParser) {
	treeParser.comment(this.data, 0, this.data.length, this);
};
function CDATA(locator) {
	ParentNode.call(this, locator);
	this.nodeType = NodeType.CDATA;
}

CDATA.prototype = Object.create(ParentNode.prototype);
CDATA.prototype.visit = function(treeParser) {
	treeParser.startCDATA(this);
};
CDATA.prototype.revisit = function(treeParser) {
	treeParser.endCDATA(this.endLocator);
};
function Entity(name) {
	ParentNode.call(this);
	this.name = name;
	this.nodeType = NodeType.ENTITY;
}

Entity.prototype = Object.create(ParentNode.prototype);
Entity.prototype.visit = function(treeParser) {
	treeParser.startEntity(this.name, this);
};
Entity.prototype.revisit = function(treeParser) {
	treeParser.endEntity(this.name);
};

function SkippedEntity(name) {
	Node.call(this);
	this.name = name;
	this.nodeType = NodeType.SKIPPED_ENTITY;
}

SkippedEntity.prototype = Object.create(Node.prototype);
SkippedEntity.prototype.visit = function(treeParser) {
	treeParser.skippedEntity(this.name, this);
};
function ProcessingInstruction(target, data) {
	Node.call(this);
	this.target = target;
	this.data = data;
}

ProcessingInstruction.prototype = Object.create(Node.prototype);
ProcessingInstruction.prototype.visit = function(treeParser) {
	treeParser.processingInstruction(this.target, this.data, this);
};
ProcessingInstruction.prototype.getNodeType = function() {
	return NodeType.PROCESSING_INSTRUCTION;
};
function DTD(name, publicIdentifier, systemIdentifier) {
	ParentNode.call(this);
	this.name = name;
	this.publicIdentifier = publicIdentifier;
	this.systemIdentifier = systemIdentifier;
	this.nodeType = NodeType.DTD;
}

DTD.prototype = Object.create(ParentNode.prototype);
DTD.prototype.visit = function(treeParser) {
	treeParser.startDTD(this.name, this.publicIdentifier, this.systemIdentifier, this);
};
DTD.prototype.revisit = function(treeParser) {
	treeParser.endDTD();
};

exports.SAXTreeBuilder = SAXTreeBuilder;

},
{"../TreeBuilder":6,"util":20}],
11:[function(_dereq_,module,exports){
function TreeParser(contentHandler, lexicalHandler){
	this.contentHandler;
	this.lexicalHandler;
	this.locatorDelegate;

	if (!contentHandler) {
		throw new IllegalArgumentException("contentHandler was null.");
	}
	this.contentHandler = contentHandler;
	if (!lexicalHandler) {
		this.lexicalHandler = new NullLexicalHandler();
	} else {
		this.lexicalHandler = lexicalHandler;
	}
}
TreeParser.prototype.parse = function(node) {
	this.contentHandler.documentLocator = this;
	var current = node;
	var next;
	for (;;) {
		current.visit(this);
		if (next = current.firstChild) {
			current = next;
			continue;
		}
		for (;;) {
			current.revisit(this);
			if (current == node) {
				return;
			}
			if (next = current.nextSibling) {
				current = next;
				break;
			}
			current = current.parentNode;
		}
	}
};
TreeParser.prototype.characters = function(ch, start, length, locator) {
	this.locatorDelegate = locator;
	this.contentHandler.characters(ch, start, length);
};
TreeParser.prototype.endDocument = function(locator) {
	this.locatorDelegate = locator;
	this.contentHandler.endDocument();
};
TreeParser.prototype.endElement = function(uri, localName, qName, locator) {
	this.locatorDelegate = locator;
	this.contentHandler.endElement(uri, localName, qName);
};
TreeParser.prototype.endPrefixMapping = function(prefix, locator) {
	this.locatorDelegate = locator;
	this.contentHandler.endPrefixMapping(prefix);
};
TreeParser.prototype.ignorableWhitespace = function(ch, start, length, locator) {
	this.locatorDelegate = locator;
	this.contentHandler.ignorableWhitespace(ch, start, length);
};
TreeParser.prototype.processingInstruction = function(target, data, locator) {
	this.locatorDelegate = locator;
	this.contentHandler.processingInstruction(target, data);
};
TreeParser.prototype.skippedEntity = function(name, locator) {
	this.locatorDelegate = locator;
	this.contentHandler.skippedEntity(name);
};
TreeParser.prototype.startDocument = function(locator) {
	this.locatorDelegate = locator;
	this.contentHandler.startDocument();
};
TreeParser.prototype.startElement = function(uri, localName, qName, atts, locator) {
	this.locatorDelegate = locator;
	this.contentHandler.startElement(uri, localName, qName, atts);
};
TreeParser.prototype.startPrefixMapping = function(prefix, uri, locator) {
	this.locatorDelegate = locator;
	this.contentHandler.startPrefixMapping(prefix, uri);
};
TreeParser.prototype.comment = function(ch, start, length, locator) {
	this.locatorDelegate = locator;
	this.lexicalHandler.comment(ch, start, length);
};
TreeParser.prototype.endCDATA = function(locator) {
	this.locatorDelegate = locator;
	this.lexicalHandler.endCDATA();
};
TreeParser.prototype.endDTD = function(locator) {
	this.locatorDelegate = locator;
	this.lexicalHandler.endDTD();
};
TreeParser.prototype.endEntity = function(name, locator) {
	this.locatorDelegate = locator;
	this.lexicalHandler.endEntity(name);
};
TreeParser.prototype.startCDATA = function(locator) {
	this.locatorDelegate = locator;
	this.lexicalHandler.startCDATA();
};
TreeParser.prototype.startDTD = function(name, publicId, systemId, locator) {
	this.locatorDelegate = locator;
	this.lexicalHandler.startDTD(name, publicId, systemId);
};
TreeParser.prototype.startEntity = function(name, locator) {
	this.locatorDelegate = locator;
	this.lexicalHandler.startEntity(name);
};

Object.defineProperty(TreeParser.prototype, 'columnNumber', {
	get: function() {
		if (!this.locatorDelegate)
			return -1;
		else
			return this.locatorDelegate.columnNumber;
	}
});

Object.defineProperty(TreeParser.prototype, 'lineNumber', {
	get: function() {
		if (!this.locatorDelegate)
			return -1;
		else
			return this.locatorDelegate.lineNumber;
	}
});
function NullLexicalHandler() {

}

NullLexicalHandler.prototype.comment = function() {};
NullLexicalHandler.prototype.endCDATA = function() {};
NullLexicalHandler.prototype.endDTD = function() {};
NullLexicalHandler.prototype.endEntity = function() {};
NullLexicalHandler.prototype.startCDATA = function() {};
NullLexicalHandler.prototype.startDTD = function() {};
NullLexicalHandler.prototype.startEntity = function() {};

exports.TreeParser = TreeParser;

},
{}],
12:[function(_dereq_,module,exports){
module.exports = {
	"Aacute;": "\u00C1",
	"Aacute": "\u00C1",
	"aacute;": "\u00E1",
	"aacute": "\u00E1",
	"Abreve;": "\u0102",
	"abreve;": "\u0103",
	"ac;": "\u223E",
	"acd;": "\u223F",
	"acE;": "\u223E\u0333",
	"Acirc;": "\u00C2",
	"Acirc": "\u00C2",
	"acirc;": "\u00E2",
	"acirc": "\u00E2",
	"acute;": "\u00B4",
	"acute": "\u00B4",
	"Acy;": "\u0410",
	"acy;": "\u0430",
	"AElig;": "\u00C6",
	"AElig": "\u00C6",
	"aelig;": "\u00E6",
	"aelig": "\u00E6",
	"af;": "\u2061",
	"Afr;": "\uD835\uDD04",
	"afr;": "\uD835\uDD1E",
	"Agrave;": "\u00C0",
	"Agrave": "\u00C0",
	"agrave;": "\u00E0",
	"agrave": "\u00E0",
	"alefsym;": "\u2135",
	"aleph;": "\u2135",
	"Alpha;": "\u0391",
	"alpha;": "\u03B1",
	"Amacr;": "\u0100",
	"amacr;": "\u0101",
	"amalg;": "\u2A3F",
	"amp;": "\u0026",
	"amp": "\u0026",
	"AMP;": "\u0026",
	"AMP": "\u0026",
	"andand;": "\u2A55",
	"And;": "\u2A53",
	"and;": "\u2227",
	"andd;": "\u2A5C",
	"andslope;": "\u2A58",
	"andv;": "\u2A5A",
	"ang;": "\u2220",
	"ange;": "\u29A4",
	"angle;": "\u2220",
	"angmsdaa;": "\u29A8",
	"angmsdab;": "\u29A9",
	"angmsdac;": "\u29AA",
	"angmsdad;": "\u29AB",
	"angmsdae;": "\u29AC",
	"angmsdaf;": "\u29AD",
	"angmsdag;": "\u29AE",
	"angmsdah;": "\u29AF",
	"angmsd;": "\u2221",
	"angrt;": "\u221F",
	"angrtvb;": "\u22BE",
	"angrtvbd;": "\u299D",
	"angsph;": "\u2222",
	"angst;": "\u00C5",
	"angzarr;": "\u237C",
	"Aogon;": "\u0104",
	"aogon;": "\u0105",
	"Aopf;": "\uD835\uDD38",
	"aopf;": "\uD835\uDD52",
	"apacir;": "\u2A6F",
	"ap;": "\u2248",
	"apE;": "\u2A70",
	"ape;": "\u224A",
	"apid;": "\u224B",
	"apos;": "\u0027",
	"ApplyFunction;": "\u2061",
	"approx;": "\u2248",
	"approxeq;": "\u224A",
	"Aring;": "\u00C5",
	"Aring": "\u00C5",
	"aring;": "\u00E5",
	"aring": "\u00E5",
	"Ascr;": "\uD835\uDC9C",
	"ascr;": "\uD835\uDCB6",
	"Assign;": "\u2254",
	"ast;": "\u002A",
	"asymp;": "\u2248",
	"asympeq;": "\u224D",
	"Atilde;": "\u00C3",
	"Atilde": "\u00C3",
	"atilde;": "\u00E3",
	"atilde": "\u00E3",
	"Auml;": "\u00C4",
	"Auml": "\u00C4",
	"auml;": "\u00E4",
	"auml": "\u00E4",
	"awconint;": "\u2233",
	"awint;": "\u2A11",
	"backcong;": "\u224C",
	"backepsilon;": "\u03F6",
	"backprime;": "\u2035",
	"backsim;": "\u223D",
	"backsimeq;": "\u22CD",
	"Backslash;": "\u2216",
	"Barv;": "\u2AE7",
	"barvee;": "\u22BD",
	"barwed;": "\u2305",
	"Barwed;": "\u2306",
	"barwedge;": "\u2305",
	"bbrk;": "\u23B5",
	"bbrktbrk;": "\u23B6",
	"bcong;": "\u224C",
	"Bcy;": "\u0411",
	"bcy;": "\u0431",
	"bdquo;": "\u201E",
	"becaus;": "\u2235",
	"because;": "\u2235",
	"Because;": "\u2235",
	"bemptyv;": "\u29B0",
	"bepsi;": "\u03F6",
	"bernou;": "\u212C",
	"Bernoullis;": "\u212C",
	"Beta;": "\u0392",
	"beta;": "\u03B2",
	"beth;": "\u2136",
	"between;": "\u226C",
	"Bfr;": "\uD835\uDD05",
	"bfr;": "\uD835\uDD1F",
	"bigcap;": "\u22C2",
	"bigcirc;": "\u25EF",
	"bigcup;": "\u22C3",
	"bigodot;": "\u2A00",
	"bigoplus;": "\u2A01",
	"bigotimes;": "\u2A02",
	"bigsqcup;": "\u2A06",
	"bigstar;": "\u2605",
	"bigtriangledown;": "\u25BD",
	"bigtriangleup;": "\u25B3",
	"biguplus;": "\u2A04",
	"bigvee;": "\u22C1",
	"bigwedge;": "\u22C0",
	"bkarow;": "\u290D",
	"blacklozenge;": "\u29EB",
	"blacksquare;": "\u25AA",
	"blacktriangle;": "\u25B4",
	"blacktriangledown;": "\u25BE",
	"blacktriangleleft;": "\u25C2",
	"blacktriangleright;": "\u25B8",
	"blank;": "\u2423",
	"blk12;": "\u2592",
	"blk14;": "\u2591",
	"blk34;": "\u2593",
	"block;": "\u2588",
	"bne;": "\u003D\u20E5",
	"bnequiv;": "\u2261\u20E5",
	"bNot;": "\u2AED",
	"bnot;": "\u2310",
	"Bopf;": "\uD835\uDD39",
	"bopf;": "\uD835\uDD53",
	"bot;": "\u22A5",
	"bottom;": "\u22A5",
	"bowtie;": "\u22C8",
	"boxbox;": "\u29C9",
	"boxdl;": "\u2510",
	"boxdL;": "\u2555",
	"boxDl;": "\u2556",
	"boxDL;": "\u2557",
	"boxdr;": "\u250C",
	"boxdR;": "\u2552",
	"boxDr;": "\u2553",
	"boxDR;": "\u2554",
	"boxh;": "\u2500",
	"boxH;": "\u2550",
	"boxhd;": "\u252C",
	"boxHd;": "\u2564",
	"boxhD;": "\u2565",
	"boxHD;": "\u2566",
	"boxhu;": "\u2534",
	"boxHu;": "\u2567",
	"boxhU;": "\u2568",
	"boxHU;": "\u2569",
	"boxminus;": "\u229F",
	"boxplus;": "\u229E",
	"boxtimes;": "\u22A0",
	"boxul;": "\u2518",
	"boxuL;": "\u255B",
	"boxUl;": "\u255C",
	"boxUL;": "\u255D",
	"boxur;": "\u2514",
	"boxuR;": "\u2558",
	"boxUr;": "\u2559",
	"boxUR;": "\u255A",
	"boxv;": "\u2502",
	"boxV;": "\u2551",
	"boxvh;": "\u253C",
	"boxvH;": "\u256A",
	"boxVh;": "\u256B",
	"boxVH;": "\u256C",
	"boxvl;": "\u2524",
	"boxvL;": "\u2561",
	"boxVl;": "\u2562",
	"boxVL;": "\u2563",
	"boxvr;": "\u251C",
	"boxvR;": "\u255E",
	"boxVr;": "\u255F",
	"boxVR;": "\u2560",
	"bprime;": "\u2035",
	"breve;": "\u02D8",
	"Breve;": "\u02D8",
	"brvbar;": "\u00A6",
	"brvbar": "\u00A6",
	"bscr;": "\uD835\uDCB7",
	"Bscr;": "\u212C",
	"bsemi;": "\u204F",
	"bsim;": "\u223D",
	"bsime;": "\u22CD",
	"bsolb;": "\u29C5",
	"bsol;": "\u005C",
	"bsolhsub;": "\u27C8",
	"bull;": "\u2022",
	"bullet;": "\u2022",
	"bump;": "\u224E",
	"bumpE;": "\u2AAE",
	"bumpe;": "\u224F",
	"Bumpeq;": "\u224E",
	"bumpeq;": "\u224F",
	"Cacute;": "\u0106",
	"cacute;": "\u0107",
	"capand;": "\u2A44",
	"capbrcup;": "\u2A49",
	"capcap;": "\u2A4B",
	"cap;": "\u2229",
	"Cap;": "\u22D2",
	"capcup;": "\u2A47",
	"capdot;": "\u2A40",
	"CapitalDifferentialD;": "\u2145",
	"caps;": "\u2229\uFE00",
	"caret;": "\u2041",
	"caron;": "\u02C7",
	"Cayleys;": "\u212D",
	"ccaps;": "\u2A4D",
	"Ccaron;": "\u010C",
	"ccaron;": "\u010D",
	"Ccedil;": "\u00C7",
	"Ccedil": "\u00C7",
	"ccedil;": "\u00E7",
	"ccedil": "\u00E7",
	"Ccirc;": "\u0108",
	"ccirc;": "\u0109",
	"Cconint;": "\u2230",
	"ccups;": "\u2A4C",
	"ccupssm;": "\u2A50",
	"Cdot;": "\u010A",
	"cdot;": "\u010B",
	"cedil;": "\u00B8",
	"cedil": "\u00B8",
	"Cedilla;": "\u00B8",
	"cemptyv;": "\u29B2",
	"cent;": "\u00A2",
	"cent": "\u00A2",
	"centerdot;": "\u00B7",
	"CenterDot;": "\u00B7",
	"cfr;": "\uD835\uDD20",
	"Cfr;": "\u212D",
	"CHcy;": "\u0427",
	"chcy;": "\u0447",
	"check;": "\u2713",
	"checkmark;": "\u2713",
	"Chi;": "\u03A7",
	"chi;": "\u03C7",
	"circ;": "\u02C6",
	"circeq;": "\u2257",
	"circlearrowleft;": "\u21BA",
	"circlearrowright;": "\u21BB",
	"circledast;": "\u229B",
	"circledcirc;": "\u229A",
	"circleddash;": "\u229D",
	"CircleDot;": "\u2299",
	"circledR;": "\u00AE",
	"circledS;": "\u24C8",
	"CircleMinus;": "\u2296",
	"CirclePlus;": "\u2295",
	"CircleTimes;": "\u2297",
	"cir;": "\u25CB",
	"cirE;": "\u29C3",
	"cire;": "\u2257",
	"cirfnint;": "\u2A10",
	"cirmid;": "\u2AEF",
	"cirscir;": "\u29C2",
	"ClockwiseContourIntegral;": "\u2232",
	"CloseCurlyDoubleQuote;": "\u201D",
	"CloseCurlyQuote;": "\u2019",
	"clubs;": "\u2663",
	"clubsuit;": "\u2663",
	"colon;": "\u003A",
	"Colon;": "\u2237",
	"Colone;": "\u2A74",
	"colone;": "\u2254",
	"coloneq;": "\u2254",
	"comma;": "\u002C",
	"commat;": "\u0040",
	"comp;": "\u2201",
	"compfn;": "\u2218",
	"complement;": "\u2201",
	"complexes;": "\u2102",
	"cong;": "\u2245",
	"congdot;": "\u2A6D",
	"Congruent;": "\u2261",
	"conint;": "\u222E",
	"Conint;": "\u222F",
	"ContourIntegral;": "\u222E",
	"copf;": "\uD835\uDD54",
	"Copf;": "\u2102",
	"coprod;": "\u2210",
	"Coproduct;": "\u2210",
	"copy;": "\u00A9",
	"copy": "\u00A9",
	"COPY;": "\u00A9",
	"COPY": "\u00A9",
	"copysr;": "\u2117",
	"CounterClockwiseContourIntegral;": "\u2233",
	"crarr;": "\u21B5",
	"cross;": "\u2717",
	"Cross;": "\u2A2F",
	"Cscr;": "\uD835\uDC9E",
	"cscr;": "\uD835\uDCB8",
	"csub;": "\u2ACF",
	"csube;": "\u2AD1",
	"csup;": "\u2AD0",
	"csupe;": "\u2AD2",
	"ctdot;": "\u22EF",
	"cudarrl;": "\u2938",
	"cudarrr;": "\u2935",
	"cuepr;": "\u22DE",
	"cuesc;": "\u22DF",
	"cularr;": "\u21B6",
	"cularrp;": "\u293D",
	"cupbrcap;": "\u2A48",
	"cupcap;": "\u2A46",
	"CupCap;": "\u224D",
	"cup;": "\u222A",
	"Cup;": "\u22D3",
	"cupcup;": "\u2A4A",
	"cupdot;": "\u228D",
	"cupor;": "\u2A45",
	"cups;": "\u222A\uFE00",
	"curarr;": "\u21B7",
	"curarrm;": "\u293C",
	"curlyeqprec;": "\u22DE",
	"curlyeqsucc;": "\u22DF",
	"curlyvee;": "\u22CE",
	"curlywedge;": "\u22CF",
	"curren;": "\u00A4",
	"curren": "\u00A4",
	"curvearrowleft;": "\u21B6",
	"curvearrowright;": "\u21B7",
	"cuvee;": "\u22CE",
	"cuwed;": "\u22CF",
	"cwconint;": "\u2232",
	"cwint;": "\u2231",
	"cylcty;": "\u232D",
	"dagger;": "\u2020",
	"Dagger;": "\u2021",
	"daleth;": "\u2138",
	"darr;": "\u2193",
	"Darr;": "\u21A1",
	"dArr;": "\u21D3",
	"dash;": "\u2010",
	"Dashv;": "\u2AE4",
	"dashv;": "\u22A3",
	"dbkarow;": "\u290F",
	"dblac;": "\u02DD",
	"Dcaron;": "\u010E",
	"dcaron;": "\u010F",
	"Dcy;": "\u0414",
	"dcy;": "\u0434",
	"ddagger;": "\u2021",
	"ddarr;": "\u21CA",
	"DD;": "\u2145",
	"dd;": "\u2146",
	"DDotrahd;": "\u2911",
	"ddotseq;": "\u2A77",
	"deg;": "\u00B0",
	"deg": "\u00B0",
	"Del;": "\u2207",
	"Delta;": "\u0394",
	"delta;": "\u03B4",
	"demptyv;": "\u29B1",
	"dfisht;": "\u297F",
	"Dfr;": "\uD835\uDD07",
	"dfr;": "\uD835\uDD21",
	"dHar;": "\u2965",
	"dharl;": "\u21C3",
	"dharr;": "\u21C2",
	"DiacriticalAcute;": "\u00B4",
	"DiacriticalDot;": "\u02D9",
	"DiacriticalDoubleAcute;": "\u02DD",
	"DiacriticalGrave;": "\u0060",
	"DiacriticalTilde;": "\u02DC",
	"diam;": "\u22C4",
	"diamond;": "\u22C4",
	"Diamond;": "\u22C4",
	"diamondsuit;": "\u2666",
	"diams;": "\u2666",
	"die;": "\u00A8",
	"DifferentialD;": "\u2146",
	"digamma;": "\u03DD",
	"disin;": "\u22F2",
	"div;": "\u00F7",
	"divide;": "\u00F7",
	"divide": "\u00F7",
	"divideontimes;": "\u22C7",
	"divonx;": "\u22C7",
	"DJcy;": "\u0402",
	"djcy;": "\u0452",
	"dlcorn;": "\u231E",
	"dlcrop;": "\u230D",
	"dollar;": "\u0024",
	"Dopf;": "\uD835\uDD3B",
	"dopf;": "\uD835\uDD55",
	"Dot;": "\u00A8",
	"dot;": "\u02D9",
	"DotDot;": "\u20DC",
	"doteq;": "\u2250",
	"doteqdot;": "\u2251",
	"DotEqual;": "\u2250",
	"dotminus;": "\u2238",
	"dotplus;": "\u2214",
	"dotsquare;": "\u22A1",
	"doublebarwedge;": "\u2306",
	"DoubleContourIntegral;": "\u222F",
	"DoubleDot;": "\u00A8",
	"DoubleDownArrow;": "\u21D3",
	"DoubleLeftArrow;": "\u21D0",
	"DoubleLeftRightArrow;": "\u21D4",
	"DoubleLeftTee;": "\u2AE4",
	"DoubleLongLeftArrow;": "\u27F8",
	"DoubleLongLeftRightArrow;": "\u27FA",
	"DoubleLongRightArrow;": "\u27F9",
	"DoubleRightArrow;": "\u21D2",
	"DoubleRightTee;": "\u22A8",
	"DoubleUpArrow;": "\u21D1",
	"DoubleUpDownArrow;": "\u21D5",
	"DoubleVerticalBar;": "\u2225",
	"DownArrowBar;": "\u2913",
	"downarrow;": "\u2193",
	"DownArrow;": "\u2193",
	"Downarrow;": "\u21D3",
	"DownArrowUpArrow;": "\u21F5",
	"DownBreve;": "\u0311",
	"downdownarrows;": "\u21CA",
	"downharpoonleft;": "\u21C3",
	"downharpoonright;": "\u21C2",
	"DownLeftRightVector;": "\u2950",
	"DownLeftTeeVector;": "\u295E",
	"DownLeftVectorBar;": "\u2956",
	"DownLeftVector;": "\u21BD",
	"DownRightTeeVector;": "\u295F",
	"DownRightVectorBar;": "\u2957",
	"DownRightVector;": "\u21C1",
	"DownTeeArrow;": "\u21A7",
	"DownTee;": "\u22A4",
	"drbkarow;": "\u2910",
	"drcorn;": "\u231F",
	"drcrop;": "\u230C",
	"Dscr;": "\uD835\uDC9F",
	"dscr;": "\uD835\uDCB9",
	"DScy;": "\u0405",
	"dscy;": "\u0455",
	"dsol;": "\u29F6",
	"Dstrok;": "\u0110",
	"dstrok;": "\u0111",
	"dtdot;": "\u22F1",
	"dtri;": "\u25BF",
	"dtrif;": "\u25BE",
	"duarr;": "\u21F5",
	"duhar;": "\u296F",
	"dwangle;": "\u29A6",
	"DZcy;": "\u040F",
	"dzcy;": "\u045F",
	"dzigrarr;": "\u27FF",
	"Eacute;": "\u00C9",
	"Eacute": "\u00C9",
	"eacute;": "\u00E9",
	"eacute": "\u00E9",
	"easter;": "\u2A6E",
	"Ecaron;": "\u011A",
	"ecaron;": "\u011B",
	"Ecirc;": "\u00CA",
	"Ecirc": "\u00CA",
	"ecirc;": "\u00EA",
	"ecirc": "\u00EA",
	"ecir;": "\u2256",
	"ecolon;": "\u2255",
	"Ecy;": "\u042D",
	"ecy;": "\u044D",
	"eDDot;": "\u2A77",
	"Edot;": "\u0116",
	"edot;": "\u0117",
	"eDot;": "\u2251",
	"ee;": "\u2147",
	"efDot;": "\u2252",
	"Efr;": "\uD835\uDD08",
	"efr;": "\uD835\uDD22",
	"eg;": "\u2A9A",
	"Egrave;": "\u00C8",
	"Egrave": "\u00C8",
	"egrave;": "\u00E8",
	"egrave": "\u00E8",
	"egs;": "\u2A96",
	"egsdot;": "\u2A98",
	"el;": "\u2A99",
	"Element;": "\u2208",
	"elinters;": "\u23E7",
	"ell;": "\u2113",
	"els;": "\u2A95",
	"elsdot;": "\u2A97",
	"Emacr;": "\u0112",
	"emacr;": "\u0113",
	"empty;": "\u2205",
	"emptyset;": "\u2205",
	"EmptySmallSquare;": "\u25FB",
	"emptyv;": "\u2205",
	"EmptyVerySmallSquare;": "\u25AB",
	"emsp13;": "\u2004",
	"emsp14;": "\u2005",
	"emsp;": "\u2003",
	"ENG;": "\u014A",
	"eng;": "\u014B",
	"ensp;": "\u2002",
	"Eogon;": "\u0118",
	"eogon;": "\u0119",
	"Eopf;": "\uD835\uDD3C",
	"eopf;": "\uD835\uDD56",
	"epar;": "\u22D5",
	"eparsl;": "\u29E3",
	"eplus;": "\u2A71",
	"epsi;": "\u03B5",
	"Epsilon;": "\u0395",
	"epsilon;": "\u03B5",
	"epsiv;": "\u03F5",
	"eqcirc;": "\u2256",
	"eqcolon;": "\u2255",
	"eqsim;": "\u2242",
	"eqslantgtr;": "\u2A96",
	"eqslantless;": "\u2A95",
	"Equal;": "\u2A75",
	"equals;": "\u003D",
	"EqualTilde;": "\u2242",
	"equest;": "\u225F",
	"Equilibrium;": "\u21CC",
	"equiv;": "\u2261",
	"equivDD;": "\u2A78",
	"eqvparsl;": "\u29E5",
	"erarr;": "\u2971",
	"erDot;": "\u2253",
	"escr;": "\u212F",
	"Escr;": "\u2130",
	"esdot;": "\u2250",
	"Esim;": "\u2A73",
	"esim;": "\u2242",
	"Eta;": "\u0397",
	"eta;": "\u03B7",
	"ETH;": "\u00D0",
	"ETH": "\u00D0",
	"eth;": "\u00F0",
	"eth": "\u00F0",
	"Euml;": "\u00CB",
	"Euml": "\u00CB",
	"euml;": "\u00EB",
	"euml": "\u00EB",
	"euro;": "\u20AC",
	"excl;": "\u0021",
	"exist;": "\u2203",
	"Exists;": "\u2203",
	"expectation;": "\u2130",
	"exponentiale;": "\u2147",
	"ExponentialE;": "\u2147",
	"fallingdotseq;": "\u2252",
	"Fcy;": "\u0424",
	"fcy;": "\u0444",
	"female;": "\u2640",
	"ffilig;": "\uFB03",
	"fflig;": "\uFB00",
	"ffllig;": "\uFB04",
	"Ffr;": "\uD835\uDD09",
	"ffr;": "\uD835\uDD23",
	"filig;": "\uFB01",
	"FilledSmallSquare;": "\u25FC",
	"FilledVerySmallSquare;": "\u25AA",
	"fjlig;": "\u0066\u006A",
	"flat;": "\u266D",
	"fllig;": "\uFB02",
	"fltns;": "\u25B1",
	"fnof;": "\u0192",
	"Fopf;": "\uD835\uDD3D",
	"fopf;": "\uD835\uDD57",
	"forall;": "\u2200",
	"ForAll;": "\u2200",
	"fork;": "\u22D4",
	"forkv;": "\u2AD9",
	"Fouriertrf;": "\u2131",
	"fpartint;": "\u2A0D",
	"frac12;": "\u00BD",
	"frac12": "\u00BD",
	"frac13;": "\u2153",
	"frac14;": "\u00BC",
	"frac14": "\u00BC",
	"frac15;": "\u2155",
	"frac16;": "\u2159",
	"frac18;": "\u215B",
	"frac23;": "\u2154",
	"frac25;": "\u2156",
	"frac34;": "\u00BE",
	"frac34": "\u00BE",
	"frac35;": "\u2157",
	"frac38;": "\u215C",
	"frac45;": "\u2158",
	"frac56;": "\u215A",
	"frac58;": "\u215D",
	"frac78;": "\u215E",
	"frasl;": "\u2044",
	"frown;": "\u2322",
	"fscr;": "\uD835\uDCBB",
	"Fscr;": "\u2131",
	"gacute;": "\u01F5",
	"Gamma;": "\u0393",
	"gamma;": "\u03B3",
	"Gammad;": "\u03DC",
	"gammad;": "\u03DD",
	"gap;": "\u2A86",
	"Gbreve;": "\u011E",
	"gbreve;": "\u011F",
	"Gcedil;": "\u0122",
	"Gcirc;": "\u011C",
	"gcirc;": "\u011D",
	"Gcy;": "\u0413",
	"gcy;": "\u0433",
	"Gdot;": "\u0120",
	"gdot;": "\u0121",
	"ge;": "\u2265",
	"gE;": "\u2267",
	"gEl;": "\u2A8C",
	"gel;": "\u22DB",
	"geq;": "\u2265",
	"geqq;": "\u2267",
	"geqslant;": "\u2A7E",
	"gescc;": "\u2AA9",
	"ges;": "\u2A7E",
	"gesdot;": "\u2A80",
	"gesdoto;": "\u2A82",
	"gesdotol;": "\u2A84",
	"gesl;": "\u22DB\uFE00",
	"gesles;": "\u2A94",
	"Gfr;": "\uD835\uDD0A",
	"gfr;": "\uD835\uDD24",
	"gg;": "\u226B",
	"Gg;": "\u22D9",
	"ggg;": "\u22D9",
	"gimel;": "\u2137",
	"GJcy;": "\u0403",
	"gjcy;": "\u0453",
	"gla;": "\u2AA5",
	"gl;": "\u2277",
	"glE;": "\u2A92",
	"glj;": "\u2AA4",
	"gnap;": "\u2A8A",
	"gnapprox;": "\u2A8A",
	"gne;": "\u2A88",
	"gnE;": "\u2269",
	"gneq;": "\u2A88",
	"gneqq;": "\u2269",
	"gnsim;": "\u22E7",
	"Gopf;": "\uD835\uDD3E",
	"gopf;": "\uD835\uDD58",
	"grave;": "\u0060",
	"GreaterEqual;": "\u2265",
	"GreaterEqualLess;": "\u22DB",
	"GreaterFullEqual;": "\u2267",
	"GreaterGreater;": "\u2AA2",
	"GreaterLess;": "\u2277",
	"GreaterSlantEqual;": "\u2A7E",
	"GreaterTilde;": "\u2273",
	"Gscr;": "\uD835\uDCA2",
	"gscr;": "\u210A",
	"gsim;": "\u2273",
	"gsime;": "\u2A8E",
	"gsiml;": "\u2A90",
	"gtcc;": "\u2AA7",
	"gtcir;": "\u2A7A",
	"gt;": "\u003E",
	"gt": "\u003E",
	"GT;": "\u003E",
	"GT": "\u003E",
	"Gt;": "\u226B",
	"gtdot;": "\u22D7",
	"gtlPar;": "\u2995",
	"gtquest;": "\u2A7C",
	"gtrapprox;": "\u2A86",
	"gtrarr;": "\u2978",
	"gtrdot;": "\u22D7",
	"gtreqless;": "\u22DB",
	"gtreqqless;": "\u2A8C",
	"gtrless;": "\u2277",
	"gtrsim;": "\u2273",
	"gvertneqq;": "\u2269\uFE00",
	"gvnE;": "\u2269\uFE00",
	"Hacek;": "\u02C7",
	"hairsp;": "\u200A",
	"half;": "\u00BD",
	"hamilt;": "\u210B",
	"HARDcy;": "\u042A",
	"hardcy;": "\u044A",
	"harrcir;": "\u2948",
	"harr;": "\u2194",
	"hArr;": "\u21D4",
	"harrw;": "\u21AD",
	"Hat;": "\u005E",
	"hbar;": "\u210F",
	"Hcirc;": "\u0124",
	"hcirc;": "\u0125",
	"hearts;": "\u2665",
	"heartsuit;": "\u2665",
	"hellip;": "\u2026",
	"hercon;": "\u22B9",
	"hfr;": "\uD835\uDD25",
	"Hfr;": "\u210C",
	"HilbertSpace;": "\u210B",
	"hksearow;": "\u2925",
	"hkswarow;": "\u2926",
	"hoarr;": "\u21FF",
	"homtht;": "\u223B",
	"hookleftarrow;": "\u21A9",
	"hookrightarrow;": "\u21AA",
	"hopf;": "\uD835\uDD59",
	"Hopf;": "\u210D",
	"horbar;": "\u2015",
	"HorizontalLine;": "\u2500",
	"hscr;": "\uD835\uDCBD",
	"Hscr;": "\u210B",
	"hslash;": "\u210F",
	"Hstrok;": "\u0126",
	"hstrok;": "\u0127",
	"HumpDownHump;": "\u224E",
	"HumpEqual;": "\u224F",
	"hybull;": "\u2043",
	"hyphen;": "\u2010",
	"Iacute;": "\u00CD",
	"Iacute": "\u00CD",
	"iacute;": "\u00ED",
	"iacute": "\u00ED",
	"ic;": "\u2063",
	"Icirc;": "\u00CE",
	"Icirc": "\u00CE",
	"icirc;": "\u00EE",
	"icirc": "\u00EE",
	"Icy;": "\u0418",
	"icy;": "\u0438",
	"Idot;": "\u0130",
	"IEcy;": "\u0415",
	"iecy;": "\u0435",
	"iexcl;": "\u00A1",
	"iexcl": "\u00A1",
	"iff;": "\u21D4",
	"ifr;": "\uD835\uDD26",
	"Ifr;": "\u2111",
	"Igrave;": "\u00CC",
	"Igrave": "\u00CC",
	"igrave;": "\u00EC",
	"igrave": "\u00EC",
	"ii;": "\u2148",
	"iiiint;": "\u2A0C",
	"iiint;": "\u222D",
	"iinfin;": "\u29DC",
	"iiota;": "\u2129",
	"IJlig;": "\u0132",
	"ijlig;": "\u0133",
	"Imacr;": "\u012A",
	"imacr;": "\u012B",
	"image;": "\u2111",
	"ImaginaryI;": "\u2148",
	"imagline;": "\u2110",
	"imagpart;": "\u2111",
	"imath;": "\u0131",
	"Im;": "\u2111",
	"imof;": "\u22B7",
	"imped;": "\u01B5",
	"Implies;": "\u21D2",
	"incare;": "\u2105",
	"in;": "\u2208",
	"infin;": "\u221E",
	"infintie;": "\u29DD",
	"inodot;": "\u0131",
	"intcal;": "\u22BA",
	"int;": "\u222B",
	"Int;": "\u222C",
	"integers;": "\u2124",
	"Integral;": "\u222B",
	"intercal;": "\u22BA",
	"Intersection;": "\u22C2",
	"intlarhk;": "\u2A17",
	"intprod;": "\u2A3C",
	"InvisibleComma;": "\u2063",
	"InvisibleTimes;": "\u2062",
	"IOcy;": "\u0401",
	"iocy;": "\u0451",
	"Iogon;": "\u012E",
	"iogon;": "\u012F",
	"Iopf;": "\uD835\uDD40",
	"iopf;": "\uD835\uDD5A",
	"Iota;": "\u0399",
	"iota;": "\u03B9",
	"iprod;": "\u2A3C",
	"iquest;": "\u00BF",
	"iquest": "\u00BF",
	"iscr;": "\uD835\uDCBE",
	"Iscr;": "\u2110",
	"isin;": "\u2208",
	"isindot;": "\u22F5",
	"isinE;": "\u22F9",
	"isins;": "\u22F4",
	"isinsv;": "\u22F3",
	"isinv;": "\u2208",
	"it;": "\u2062",
	"Itilde;": "\u0128",
	"itilde;": "\u0129",
	"Iukcy;": "\u0406",
	"iukcy;": "\u0456",
	"Iuml;": "\u00CF",
	"Iuml": "\u00CF",
	"iuml;": "\u00EF",
	"iuml": "\u00EF",
	"Jcirc;": "\u0134",
	"jcirc;": "\u0135",
	"Jcy;": "\u0419",
	"jcy;": "\u0439",
	"Jfr;": "\uD835\uDD0D",
	"jfr;": "\uD835\uDD27",
	"jmath;": "\u0237",
	"Jopf;": "\uD835\uDD41",
	"jopf;": "\uD835\uDD5B",
	"Jscr;": "\uD835\uDCA5",
	"jscr;": "\uD835\uDCBF",
	"Jsercy;": "\u0408",
	"jsercy;": "\u0458",
	"Jukcy;": "\u0404",
	"jukcy;": "\u0454",
	"Kappa;": "\u039A",
	"kappa;": "\u03BA",
	"kappav;": "\u03F0",
	"Kcedil;": "\u0136",
	"kcedil;": "\u0137",
	"Kcy;": "\u041A",
	"kcy;": "\u043A",
	"Kfr;": "\uD835\uDD0E",
	"kfr;": "\uD835\uDD28",
	"kgreen;": "\u0138",
	"KHcy;": "\u0425",
	"khcy;": "\u0445",
	"KJcy;": "\u040C",
	"kjcy;": "\u045C",
	"Kopf;": "\uD835\uDD42",
	"kopf;": "\uD835\uDD5C",
	"Kscr;": "\uD835\uDCA6",
	"kscr;": "\uD835\uDCC0",
	"lAarr;": "\u21DA",
	"Lacute;": "\u0139",
	"lacute;": "\u013A",
	"laemptyv;": "\u29B4",
	"lagran;": "\u2112",
	"Lambda;": "\u039B",
	"lambda;": "\u03BB",
	"lang;": "\u27E8",
	"Lang;": "\u27EA",
	"langd;": "\u2991",
	"langle;": "\u27E8",
	"lap;": "\u2A85",
	"Laplacetrf;": "\u2112",
	"laquo;": "\u00AB",
	"laquo": "\u00AB",
	"larrb;": "\u21E4",
	"larrbfs;": "\u291F",
	"larr;": "\u2190",
	"Larr;": "\u219E",
	"lArr;": "\u21D0",
	"larrfs;": "\u291D",
	"larrhk;": "\u21A9",
	"larrlp;": "\u21AB",
	"larrpl;": "\u2939",
	"larrsim;": "\u2973",
	"larrtl;": "\u21A2",
	"latail;": "\u2919",
	"lAtail;": "\u291B",
	"lat;": "\u2AAB",
	"late;": "\u2AAD",
	"lates;": "\u2AAD\uFE00",
	"lbarr;": "\u290C",
	"lBarr;": "\u290E",
	"lbbrk;": "\u2772",
	"lbrace;": "\u007B",
	"lbrack;": "\u005B",
	"lbrke;": "\u298B",
	"lbrksld;": "\u298F",
	"lbrkslu;": "\u298D",
	"Lcaron;": "\u013D",
	"lcaron;": "\u013E",
	"Lcedil;": "\u013B",
	"lcedil;": "\u013C",
	"lceil;": "\u2308",
	"lcub;": "\u007B",
	"Lcy;": "\u041B",
	"lcy;": "\u043B",
	"ldca;": "\u2936",
	"ldquo;": "\u201C",
	"ldquor;": "\u201E",
	"ldrdhar;": "\u2967",
	"ldrushar;": "\u294B",
	"ldsh;": "\u21B2",
	"le;": "\u2264",
	"lE;": "\u2266",
	"LeftAngleBracket;": "\u27E8",
	"LeftArrowBar;": "\u21E4",
	"leftarrow;": "\u2190",
	"LeftArrow;": "\u2190",
	"Leftarrow;": "\u21D0",
	"LeftArrowRightArrow;": "\u21C6",
	"leftarrowtail;": "\u21A2",
	"LeftCeiling;": "\u2308",
	"LeftDoubleBracket;": "\u27E6",
	"LeftDownTeeVector;": "\u2961",
	"LeftDownVectorBar;": "\u2959",
	"LeftDownVector;": "\u21C3",
	"LeftFloor;": "\u230A",
	"leftharpoondown;": "\u21BD",
	"leftharpoonup;": "\u21BC",
	"leftleftarrows;": "\u21C7",
	"leftrightarrow;": "\u2194",
	"LeftRightArrow;": "\u2194",
	"Leftrightarrow;": "\u21D4",
	"leftrightarrows;": "\u21C6",
	"leftrightharpoons;": "\u21CB",
	"leftrightsquigarrow;": "\u21AD",
	"LeftRightVector;": "\u294E",
	"LeftTeeArrow;": "\u21A4",
	"LeftTee;": "\u22A3",
	"LeftTeeVector;": "\u295A",
	"leftthreetimes;": "\u22CB",
	"LeftTriangleBar;": "\u29CF",
	"LeftTriangle;": "\u22B2",
	"LeftTriangleEqual;": "\u22B4",
	"LeftUpDownVector;": "\u2951",
	"LeftUpTeeVector;": "\u2960",
	"LeftUpVectorBar;": "\u2958",
	"LeftUpVector;": "\u21BF",
	"LeftVectorBar;": "\u2952",
	"LeftVector;": "\u21BC",
	"lEg;": "\u2A8B",
	"leg;": "\u22DA",
	"leq;": "\u2264",
	"leqq;": "\u2266",
	"leqslant;": "\u2A7D",
	"lescc;": "\u2AA8",
	"les;": "\u2A7D",
	"lesdot;": "\u2A7F",
	"lesdoto;": "\u2A81",
	"lesdotor;": "\u2A83",
	"lesg;": "\u22DA\uFE00",
	"lesges;": "\u2A93",
	"lessapprox;": "\u2A85",
	"lessdot;": "\u22D6",
	"lesseqgtr;": "\u22DA",
	"lesseqqgtr;": "\u2A8B",
	"LessEqualGreater;": "\u22DA",
	"LessFullEqual;": "\u2266",
	"LessGreater;": "\u2276",
	"lessgtr;": "\u2276",
	"LessLess;": "\u2AA1",
	"lesssim;": "\u2272",
	"LessSlantEqual;": "\u2A7D",
	"LessTilde;": "\u2272",
	"lfisht;": "\u297C",
	"lfloor;": "\u230A",
	"Lfr;": "\uD835\uDD0F",
	"lfr;": "\uD835\uDD29",
	"lg;": "\u2276",
	"lgE;": "\u2A91",
	"lHar;": "\u2962",
	"lhard;": "\u21BD",
	"lharu;": "\u21BC",
	"lharul;": "\u296A",
	"lhblk;": "\u2584",
	"LJcy;": "\u0409",
	"ljcy;": "\u0459",
	"llarr;": "\u21C7",
	"ll;": "\u226A",
	"Ll;": "\u22D8",
	"llcorner;": "\u231E",
	"Lleftarrow;": "\u21DA",
	"llhard;": "\u296B",
	"lltri;": "\u25FA",
	"Lmidot;": "\u013F",
	"lmidot;": "\u0140",
	"lmoustache;": "\u23B0",
	"lmoust;": "\u23B0",
	"lnap;": "\u2A89",
	"lnapprox;": "\u2A89",
	"lne;": "\u2A87",
	"lnE;": "\u2268",
	"lneq;": "\u2A87",
	"lneqq;": "\u2268",
	"lnsim;": "\u22E6",
	"loang;": "\u27EC",
	"loarr;": "\u21FD",
	"lobrk;": "\u27E6",
	"longleftarrow;": "\u27F5",
	"LongLeftArrow;": "\u27F5",
	"Longleftarrow;": "\u27F8",
	"longleftrightarrow;": "\u27F7",
	"LongLeftRightArrow;": "\u27F7",
	"Longleftrightarrow;": "\u27FA",
	"longmapsto;": "\u27FC",
	"longrightarrow;": "\u27F6",
	"LongRightArrow;": "\u27F6",
	"Longrightarrow;": "\u27F9",
	"looparrowleft;": "\u21AB",
	"looparrowright;": "\u21AC",
	"lopar;": "\u2985",
	"Lopf;": "\uD835\uDD43",
	"lopf;": "\uD835\uDD5D",
	"loplus;": "\u2A2D",
	"lotimes;": "\u2A34",
	"lowast;": "\u2217",
	"lowbar;": "\u005F",
	"LowerLeftArrow;": "\u2199",
	"LowerRightArrow;": "\u2198",
	"loz;": "\u25CA",
	"lozenge;": "\u25CA",
	"lozf;": "\u29EB",
	"lpar;": "\u0028",
	"lparlt;": "\u2993",
	"lrarr;": "\u21C6",
	"lrcorner;": "\u231F",
	"lrhar;": "\u21CB",
	"lrhard;": "\u296D",
	"lrm;": "\u200E",
	"lrtri;": "\u22BF",
	"lsaquo;": "\u2039",
	"lscr;": "\uD835\uDCC1",
	"Lscr;": "\u2112",
	"lsh;": "\u21B0",
	"Lsh;": "\u21B0",
	"lsim;": "\u2272",
	"lsime;": "\u2A8D",
	"lsimg;": "\u2A8F",
	"lsqb;": "\u005B",
	"lsquo;": "\u2018",
	"lsquor;": "\u201A",
	"Lstrok;": "\u0141",
	"lstrok;": "\u0142",
	"ltcc;": "\u2AA6",
	"ltcir;": "\u2A79",
	"lt;": "\u003C",
	"lt": "\u003C",
	"LT;": "\u003C",
	"LT": "\u003C",
	"Lt;": "\u226A",
	"ltdot;": "\u22D6",
	"lthree;": "\u22CB",
	"ltimes;": "\u22C9",
	"ltlarr;": "\u2976",
	"ltquest;": "\u2A7B",
	"ltri;": "\u25C3",
	"ltrie;": "\u22B4",
	"ltrif;": "\u25C2",
	"ltrPar;": "\u2996",
	"lurdshar;": "\u294A",
	"luruhar;": "\u2966",
	"lvertneqq;": "\u2268\uFE00",
	"lvnE;": "\u2268\uFE00",
	"macr;": "\u00AF",
	"macr": "\u00AF",
	"male;": "\u2642",
	"malt;": "\u2720",
	"maltese;": "\u2720",
	"Map;": "\u2905",
	"map;": "\u21A6",
	"mapsto;": "\u21A6",
	"mapstodown;": "\u21A7",
	"mapstoleft;": "\u21A4",
	"mapstoup;": "\u21A5",
	"marker;": "\u25AE",
	"mcomma;": "\u2A29",
	"Mcy;": "\u041C",
	"mcy;": "\u043C",
	"mdash;": "\u2014",
	"mDDot;": "\u223A",
	"measuredangle;": "\u2221",
	"MediumSpace;": "\u205F",
	"Mellintrf;": "\u2133",
	"Mfr;": "\uD835\uDD10",
	"mfr;": "\uD835\uDD2A",
	"mho;": "\u2127",
	"micro;": "\u00B5",
	"micro": "\u00B5",
	"midast;": "\u002A",
	"midcir;": "\u2AF0",
	"mid;": "\u2223",
	"middot;": "\u00B7",
	"middot": "\u00B7",
	"minusb;": "\u229F",
	"minus;": "\u2212",
	"minusd;": "\u2238",
	"minusdu;": "\u2A2A",
	"MinusPlus;": "\u2213",
	"mlcp;": "\u2ADB",
	"mldr;": "\u2026",
	"mnplus;": "\u2213",
	"models;": "\u22A7",
	"Mopf;": "\uD835\uDD44",
	"mopf;": "\uD835\uDD5E",
	"mp;": "\u2213",
	"mscr;": "\uD835\uDCC2",
	"Mscr;": "\u2133",
	"mstpos;": "\u223E",
	"Mu;": "\u039C",
	"mu;": "\u03BC",
	"multimap;": "\u22B8",
	"mumap;": "\u22B8",
	"nabla;": "\u2207",
	"Nacute;": "\u0143",
	"nacute;": "\u0144",
	"nang;": "\u2220\u20D2",
	"nap;": "\u2249",
	"napE;": "\u2A70\u0338",
	"napid;": "\u224B\u0338",
	"napos;": "\u0149",
	"napprox;": "\u2249",
	"natural;": "\u266E",
	"naturals;": "\u2115",
	"natur;": "\u266E",
	"nbsp;": "\u00A0",
	"nbsp": "\u00A0",
	"nbump;": "\u224E\u0338",
	"nbumpe;": "\u224F\u0338",
	"ncap;": "\u2A43",
	"Ncaron;": "\u0147",
	"ncaron;": "\u0148",
	"Ncedil;": "\u0145",
	"ncedil;": "\u0146",
	"ncong;": "\u2247",
	"ncongdot;": "\u2A6D\u0338",
	"ncup;": "\u2A42",
	"Ncy;": "\u041D",
	"ncy;": "\u043D",
	"ndash;": "\u2013",
	"nearhk;": "\u2924",
	"nearr;": "\u2197",
	"neArr;": "\u21D7",
	"nearrow;": "\u2197",
	"ne;": "\u2260",
	"nedot;": "\u2250\u0338",
	"NegativeMediumSpace;": "\u200B",
	"NegativeThickSpace;": "\u200B",
	"NegativeThinSpace;": "\u200B",
	"NegativeVeryThinSpace;": "\u200B",
	"nequiv;": "\u2262",
	"nesear;": "\u2928",
	"nesim;": "\u2242\u0338",
	"NestedGreaterGreater;": "\u226B",
	"NestedLessLess;": "\u226A",
	"NewLine;": "\u000A",
	"nexist;": "\u2204",
	"nexists;": "\u2204",
	"Nfr;": "\uD835\uDD11",
	"nfr;": "\uD835\uDD2B",
	"ngE;": "\u2267\u0338",
	"nge;": "\u2271",
	"ngeq;": "\u2271",
	"ngeqq;": "\u2267\u0338",
	"ngeqslant;": "\u2A7E\u0338",
	"nges;": "\u2A7E\u0338",
	"nGg;": "\u22D9\u0338",
	"ngsim;": "\u2275",
	"nGt;": "\u226B\u20D2",
	"ngt;": "\u226F",
	"ngtr;": "\u226F",
	"nGtv;": "\u226B\u0338",
	"nharr;": "\u21AE",
	"nhArr;": "\u21CE",
	"nhpar;": "\u2AF2",
	"ni;": "\u220B",
	"nis;": "\u22FC",
	"nisd;": "\u22FA",
	"niv;": "\u220B",
	"NJcy;": "\u040A",
	"njcy;": "\u045A",
	"nlarr;": "\u219A",
	"nlArr;": "\u21CD",
	"nldr;": "\u2025",
	"nlE;": "\u2266\u0338",
	"nle;": "\u2270",
	"nleftarrow;": "\u219A",
	"nLeftarrow;": "\u21CD",
	"nleftrightarrow;": "\u21AE",
	"nLeftrightarrow;": "\u21CE",
	"nleq;": "\u2270",
	"nleqq;": "\u2266\u0338",
	"nleqslant;": "\u2A7D\u0338",
	"nles;": "\u2A7D\u0338",
	"nless;": "\u226E",
	"nLl;": "\u22D8\u0338",
	"nlsim;": "\u2274",
	"nLt;": "\u226A\u20D2",
	"nlt;": "\u226E",
	"nltri;": "\u22EA",
	"nltrie;": "\u22EC",
	"nLtv;": "\u226A\u0338",
	"nmid;": "\u2224",
	"NoBreak;": "\u2060",
	"NonBreakingSpace;": "\u00A0",
	"nopf;": "\uD835\uDD5F",
	"Nopf;": "\u2115",
	"Not;": "\u2AEC",
	"not;": "\u00AC",
	"not": "\u00AC",
	"NotCongruent;": "\u2262",
	"NotCupCap;": "\u226D",
	"NotDoubleVerticalBar;": "\u2226",
	"NotElement;": "\u2209",
	"NotEqual;": "\u2260",
	"NotEqualTilde;": "\u2242\u0338",
	"NotExists;": "\u2204",
	"NotGreater;": "\u226F",
	"NotGreaterEqual;": "\u2271",
	"NotGreaterFullEqual;": "\u2267\u0338",
	"NotGreaterGreater;": "\u226B\u0338",
	"NotGreaterLess;": "\u2279",
	"NotGreaterSlantEqual;": "\u2A7E\u0338",
	"NotGreaterTilde;": "\u2275",
	"NotHumpDownHump;": "\u224E\u0338",
	"NotHumpEqual;": "\u224F\u0338",
	"notin;": "\u2209",
	"notindot;": "\u22F5\u0338",
	"notinE;": "\u22F9\u0338",
	"notinva;": "\u2209",
	"notinvb;": "\u22F7",
	"notinvc;": "\u22F6",
	"NotLeftTriangleBar;": "\u29CF\u0338",
	"NotLeftTriangle;": "\u22EA",
	"NotLeftTriangleEqual;": "\u22EC",
	"NotLess;": "\u226E",
	"NotLessEqual;": "\u2270",
	"NotLessGreater;": "\u2278",
	"NotLessLess;": "\u226A\u0338",
	"NotLessSlantEqual;": "\u2A7D\u0338",
	"NotLessTilde;": "\u2274",
	"NotNestedGreaterGreater;": "\u2AA2\u0338",
	"NotNestedLessLess;": "\u2AA1\u0338",
	"notni;": "\u220C",
	"notniva;": "\u220C",
	"notnivb;": "\u22FE",
	"notnivc;": "\u22FD",
	"NotPrecedes;": "\u2280",
	"NotPrecedesEqual;": "\u2AAF\u0338",
	"NotPrecedesSlantEqual;": "\u22E0",
	"NotReverseElement;": "\u220C",
	"NotRightTriangleBar;": "\u29D0\u0338",
	"NotRightTriangle;": "\u22EB",
	"NotRightTriangleEqual;": "\u22ED",
	"NotSquareSubset;": "\u228F\u0338",
	"NotSquareSubsetEqual;": "\u22E2",
	"NotSquareSuperset;": "\u2290\u0338",
	"NotSquareSupersetEqual;": "\u22E3",
	"NotSubset;": "\u2282\u20D2",
	"NotSubsetEqual;": "\u2288",
	"NotSucceeds;": "\u2281",
	"NotSucceedsEqual;": "\u2AB0\u0338",
	"NotSucceedsSlantEqual;": "\u22E1",
	"NotSucceedsTilde;": "\u227F\u0338",
	"NotSuperset;": "\u2283\u20D2",
	"NotSupersetEqual;": "\u2289",
	"NotTilde;": "\u2241",
	"NotTildeEqual;": "\u2244",
	"NotTildeFullEqual;": "\u2247",
	"NotTildeTilde;": "\u2249",
	"NotVerticalBar;": "\u2224",
	"nparallel;": "\u2226",
	"npar;": "\u2226",
	"nparsl;": "\u2AFD\u20E5",
	"npart;": "\u2202\u0338",
	"npolint;": "\u2A14",
	"npr;": "\u2280",
	"nprcue;": "\u22E0",
	"nprec;": "\u2280",
	"npreceq;": "\u2AAF\u0338",
	"npre;": "\u2AAF\u0338",
	"nrarrc;": "\u2933\u0338",
	"nrarr;": "\u219B",
	"nrArr;": "\u21CF",
	"nrarrw;": "\u219D\u0338",
	"nrightarrow;": "\u219B",
	"nRightarrow;": "\u21CF",
	"nrtri;": "\u22EB",
	"nrtrie;": "\u22ED",
	"nsc;": "\u2281",
	"nsccue;": "\u22E1",
	"nsce;": "\u2AB0\u0338",
	"Nscr;": "\uD835\uDCA9",
	"nscr;": "\uD835\uDCC3",
	"nshortmid;": "\u2224",
	"nshortparallel;": "\u2226",
	"nsim;": "\u2241",
	"nsime;": "\u2244",
	"nsimeq;": "\u2244",
	"nsmid;": "\u2224",
	"nspar;": "\u2226",
	"nsqsube;": "\u22E2",
	"nsqsupe;": "\u22E3",
	"nsub;": "\u2284",
	"nsubE;": "\u2AC5\u0338",
	"nsube;": "\u2288",
	"nsubset;": "\u2282\u20D2",
	"nsubseteq;": "\u2288",
	"nsubseteqq;": "\u2AC5\u0338",
	"nsucc;": "\u2281",
	"nsucceq;": "\u2AB0\u0338",
	"nsup;": "\u2285",
	"nsupE;": "\u2AC6\u0338",
	"nsupe;": "\u2289",
	"nsupset;": "\u2283\u20D2",
	"nsupseteq;": "\u2289",
	"nsupseteqq;": "\u2AC6\u0338",
	"ntgl;": "\u2279",
	"Ntilde;": "\u00D1",
	"Ntilde": "\u00D1",
	"ntilde;": "\u00F1",
	"ntilde": "\u00F1",
	"ntlg;": "\u2278",
	"ntriangleleft;": "\u22EA",
	"ntrianglelefteq;": "\u22EC",
	"ntriangleright;": "\u22EB",
	"ntrianglerighteq;": "\u22ED",
	"Nu;": "\u039D",
	"nu;": "\u03BD",
	"num;": "\u0023",
	"numero;": "\u2116",
	"numsp;": "\u2007",
	"nvap;": "\u224D\u20D2",
	"nvdash;": "\u22AC",
	"nvDash;": "\u22AD",
	"nVdash;": "\u22AE",
	"nVDash;": "\u22AF",
	"nvge;": "\u2265\u20D2",
	"nvgt;": "\u003E\u20D2",
	"nvHarr;": "\u2904",
	"nvinfin;": "\u29DE",
	"nvlArr;": "\u2902",
	"nvle;": "\u2264\u20D2",
	"nvlt;": "\u003C\u20D2",
	"nvltrie;": "\u22B4\u20D2",
	"nvrArr;": "\u2903",
	"nvrtrie;": "\u22B5\u20D2",
	"nvsim;": "\u223C\u20D2",
	"nwarhk;": "\u2923",
	"nwarr;": "\u2196",
	"nwArr;": "\u21D6",
	"nwarrow;": "\u2196",
	"nwnear;": "\u2927",
	"Oacute;": "\u00D3",
	"Oacute": "\u00D3",
	"oacute;": "\u00F3",
	"oacute": "\u00F3",
	"oast;": "\u229B",
	"Ocirc;": "\u00D4",
	"Ocirc": "\u00D4",
	"ocirc;": "\u00F4",
	"ocirc": "\u00F4",
	"ocir;": "\u229A",
	"Ocy;": "\u041E",
	"ocy;": "\u043E",
	"odash;": "\u229D",
	"Odblac;": "\u0150",
	"odblac;": "\u0151",
	"odiv;": "\u2A38",
	"odot;": "\u2299",
	"odsold;": "\u29BC",
	"OElig;": "\u0152",
	"oelig;": "\u0153",
	"ofcir;": "\u29BF",
	"Ofr;": "\uD835\uDD12",
	"ofr;": "\uD835\uDD2C",
	"ogon;": "\u02DB",
	"Ograve;": "\u00D2",
	"Ograve": "\u00D2",
	"ograve;": "\u00F2",
	"ograve": "\u00F2",
	"ogt;": "\u29C1",
	"ohbar;": "\u29B5",
	"ohm;": "\u03A9",
	"oint;": "\u222E",
	"olarr;": "\u21BA",
	"olcir;": "\u29BE",
	"olcross;": "\u29BB",
	"oline;": "\u203E",
	"olt;": "\u29C0",
	"Omacr;": "\u014C",
	"omacr;": "\u014D",
	"Omega;": "\u03A9",
	"omega;": "\u03C9",
	"Omicron;": "\u039F",
	"omicron;": "\u03BF",
	"omid;": "\u29B6",
	"ominus;": "\u2296",
	"Oopf;": "\uD835\uDD46",
	"oopf;": "\uD835\uDD60",
	"opar;": "\u29B7",
	"OpenCurlyDoubleQuote;": "\u201C",
	"OpenCurlyQuote;": "\u2018",
	"operp;": "\u29B9",
	"oplus;": "\u2295",
	"orarr;": "\u21BB",
	"Or;": "\u2A54",
	"or;": "\u2228",
	"ord;": "\u2A5D",
	"order;": "\u2134",
	"orderof;": "\u2134",
	"ordf;": "\u00AA",
	"ordf": "\u00AA",
	"ordm;": "\u00BA",
	"ordm": "\u00BA",
	"origof;": "\u22B6",
	"oror;": "\u2A56",
	"orslope;": "\u2A57",
	"orv;": "\u2A5B",
	"oS;": "\u24C8",
	"Oscr;": "\uD835\uDCAA",
	"oscr;": "\u2134",
	"Oslash;": "\u00D8",
	"Oslash": "\u00D8",
	"oslash;": "\u00F8",
	"oslash": "\u00F8",
	"osol;": "\u2298",
	"Otilde;": "\u00D5",
	"Otilde": "\u00D5",
	"otilde;": "\u00F5",
	"otilde": "\u00F5",
	"otimesas;": "\u2A36",
	"Otimes;": "\u2A37",
	"otimes;": "\u2297",
	"Ouml;": "\u00D6",
	"Ouml": "\u00D6",
	"ouml;": "\u00F6",
	"ouml": "\u00F6",
	"ovbar;": "\u233D",
	"OverBar;": "\u203E",
	"OverBrace;": "\u23DE",
	"OverBracket;": "\u23B4",
	"OverParenthesis;": "\u23DC",
	"para;": "\u00B6",
	"para": "\u00B6",
	"parallel;": "\u2225",
	"par;": "\u2225",
	"parsim;": "\u2AF3",
	"parsl;": "\u2AFD",
	"part;": "\u2202",
	"PartialD;": "\u2202",
	"Pcy;": "\u041F",
	"pcy;": "\u043F",
	"percnt;": "\u0025",
	"period;": "\u002E",
	"permil;": "\u2030",
	"perp;": "\u22A5",
	"pertenk;": "\u2031",
	"Pfr;": "\uD835\uDD13",
	"pfr;": "\uD835\uDD2D",
	"Phi;": "\u03A6",
	"phi;": "\u03C6",
	"phiv;": "\u03D5",
	"phmmat;": "\u2133",
	"phone;": "\u260E",
	"Pi;": "\u03A0",
	"pi;": "\u03C0",
	"pitchfork;": "\u22D4",
	"piv;": "\u03D6",
	"planck;": "\u210F",
	"planckh;": "\u210E",
	"plankv;": "\u210F",
	"plusacir;": "\u2A23",
	"plusb;": "\u229E",
	"pluscir;": "\u2A22",
	"plus;": "\u002B",
	"plusdo;": "\u2214",
	"plusdu;": "\u2A25",
	"pluse;": "\u2A72",
	"PlusMinus;": "\u00B1",
	"plusmn;": "\u00B1",
	"plusmn": "\u00B1",
	"plussim;": "\u2A26",
	"plustwo;": "\u2A27",
	"pm;": "\u00B1",
	"Poincareplane;": "\u210C",
	"pointint;": "\u2A15",
	"popf;": "\uD835\uDD61",
	"Popf;": "\u2119",
	"pound;": "\u00A3",
	"pound": "\u00A3",
	"prap;": "\u2AB7",
	"Pr;": "\u2ABB",
	"pr;": "\u227A",
	"prcue;": "\u227C",
	"precapprox;": "\u2AB7",
	"prec;": "\u227A",
	"preccurlyeq;": "\u227C",
	"Precedes;": "\u227A",
	"PrecedesEqual;": "\u2AAF",
	"PrecedesSlantEqual;": "\u227C",
	"PrecedesTilde;": "\u227E",
	"preceq;": "\u2AAF",
	"precnapprox;": "\u2AB9",
	"precneqq;": "\u2AB5",
	"precnsim;": "\u22E8",
	"pre;": "\u2AAF",
	"prE;": "\u2AB3",
	"precsim;": "\u227E",
	"prime;": "\u2032",
	"Prime;": "\u2033",
	"primes;": "\u2119",
	"prnap;": "\u2AB9",
	"prnE;": "\u2AB5",
	"prnsim;": "\u22E8",
	"prod;": "\u220F",
	"Product;": "\u220F",
	"profalar;": "\u232E",
	"profline;": "\u2312",
	"profsurf;": "\u2313",
	"prop;": "\u221D",
	"Proportional;": "\u221D",
	"Proportion;": "\u2237",
	"propto;": "\u221D",
	"prsim;": "\u227E",
	"prurel;": "\u22B0",
	"Pscr;": "\uD835\uDCAB",
	"pscr;": "\uD835\uDCC5",
	"Psi;": "\u03A8",
	"psi;": "\u03C8",
	"puncsp;": "\u2008",
	"Qfr;": "\uD835\uDD14",
	"qfr;": "\uD835\uDD2E",
	"qint;": "\u2A0C",
	"qopf;": "\uD835\uDD62",
	"Qopf;": "\u211A",
	"qprime;": "\u2057",
	"Qscr;": "\uD835\uDCAC",
	"qscr;": "\uD835\uDCC6",
	"quaternions;": "\u210D",
	"quatint;": "\u2A16",
	"quest;": "\u003F",
	"questeq;": "\u225F",
	"quot;": "\u0022",
	"quot": "\u0022",
	"QUOT;": "\u0022",
	"QUOT": "\u0022",
	"rAarr;": "\u21DB",
	"race;": "\u223D\u0331",
	"Racute;": "\u0154",
	"racute;": "\u0155",
	"radic;": "\u221A",
	"raemptyv;": "\u29B3",
	"rang;": "\u27E9",
	"Rang;": "\u27EB",
	"rangd;": "\u2992",
	"range;": "\u29A5",
	"rangle;": "\u27E9",
	"raquo;": "\u00BB",
	"raquo": "\u00BB",
	"rarrap;": "\u2975",
	"rarrb;": "\u21E5",
	"rarrbfs;": "\u2920",
	"rarrc;": "\u2933",
	"rarr;": "\u2192",
	"Rarr;": "\u21A0",
	"rArr;": "\u21D2",
	"rarrfs;": "\u291E",
	"rarrhk;": "\u21AA",
	"rarrlp;": "\u21AC",
	"rarrpl;": "\u2945",
	"rarrsim;": "\u2974",
	"Rarrtl;": "\u2916",
	"rarrtl;": "\u21A3",
	"rarrw;": "\u219D",
	"ratail;": "\u291A",
	"rAtail;": "\u291C",
	"ratio;": "\u2236",
	"rationals;": "\u211A",
	"rbarr;": "\u290D",
	"rBarr;": "\u290F",
	"RBarr;": "\u2910",
	"rbbrk;": "\u2773",
	"rbrace;": "\u007D",
	"rbrack;": "\u005D",
	"rbrke;": "\u298C",
	"rbrksld;": "\u298E",
	"rbrkslu;": "\u2990",
	"Rcaron;": "\u0158",
	"rcaron;": "\u0159",
	"Rcedil;": "\u0156",
	"rcedil;": "\u0157",
	"rceil;": "\u2309",
	"rcub;": "\u007D",
	"Rcy;": "\u0420",
	"rcy;": "\u0440",
	"rdca;": "\u2937",
	"rdldhar;": "\u2969",
	"rdquo;": "\u201D",
	"rdquor;": "\u201D",
	"rdsh;": "\u21B3",
	"real;": "\u211C",
	"realine;": "\u211B",
	"realpart;": "\u211C",
	"reals;": "\u211D",
	"Re;": "\u211C",
	"rect;": "\u25AD",
	"reg;": "\u00AE",
	"reg": "\u00AE",
	"REG;": "\u00AE",
	"REG": "\u00AE",
	"ReverseElement;": "\u220B",
	"ReverseEquilibrium;": "\u21CB",
	"ReverseUpEquilibrium;": "\u296F",
	"rfisht;": "\u297D",
	"rfloor;": "\u230B",
	"rfr;": "\uD835\uDD2F",
	"Rfr;": "\u211C",
	"rHar;": "\u2964",
	"rhard;": "\u21C1",
	"rharu;": "\u21C0",
	"rharul;": "\u296C",
	"Rho;": "\u03A1",
	"rho;": "\u03C1",
	"rhov;": "\u03F1",
	"RightAngleBracket;": "\u27E9",
	"RightArrowBar;": "\u21E5",
	"rightarrow;": "\u2192",
	"RightArrow;": "\u2192",
	"Rightarrow;": "\u21D2",
	"RightArrowLeftArrow;": "\u21C4",
	"rightarrowtail;": "\u21A3",
	"RightCeiling;": "\u2309",
	"RightDoubleBracket;": "\u27E7",
	"RightDownTeeVector;": "\u295D",
	"RightDownVectorBar;": "\u2955",
	"RightDownVector;": "\u21C2",
	"RightFloor;": "\u230B",
	"rightharpoondown;": "\u21C1",
	"rightharpoonup;": "\u21C0",
	"rightleftarrows;": "\u21C4",
	"rightleftharpoons;": "\u21CC",
	"rightrightarrows;": "\u21C9",
	"rightsquigarrow;": "\u219D",
	"RightTeeArrow;": "\u21A6",
	"RightTee;": "\u22A2",
	"RightTeeVector;": "\u295B",
	"rightthreetimes;": "\u22CC",
	"RightTriangleBar;": "\u29D0",
	"RightTriangle;": "\u22B3",
	"RightTriangleEqual;": "\u22B5",
	"RightUpDownVector;": "\u294F",
	"RightUpTeeVector;": "\u295C",
	"RightUpVectorBar;": "\u2954",
	"RightUpVector;": "\u21BE",
	"RightVectorBar;": "\u2953",
	"RightVector;": "\u21C0",
	"ring;": "\u02DA",
	"risingdotseq;": "\u2253",
	"rlarr;": "\u21C4",
	"rlhar;": "\u21CC",
	"rlm;": "\u200F",
	"rmoustache;": "\u23B1",
	"rmoust;": "\u23B1",
	"rnmid;": "\u2AEE",
	"roang;": "\u27ED",
	"roarr;": "\u21FE",
	"robrk;": "\u27E7",
	"ropar;": "\u2986",
	"ropf;": "\uD835\uDD63",
	"Ropf;": "\u211D",
	"roplus;": "\u2A2E",
	"rotimes;": "\u2A35",
	"RoundImplies;": "\u2970",
	"rpar;": "\u0029",
	"rpargt;": "\u2994",
	"rppolint;": "\u2A12",
	"rrarr;": "\u21C9",
	"Rrightarrow;": "\u21DB",
	"rsaquo;": "\u203A",
	"rscr;": "\uD835\uDCC7",
	"Rscr;": "\u211B",
	"rsh;": "\u21B1",
	"Rsh;": "\u21B1",
	"rsqb;": "\u005D",
	"rsquo;": "\u2019",
	"rsquor;": "\u2019",
	"rthree;": "\u22CC",
	"rtimes;": "\u22CA",
	"rtri;": "\u25B9",
	"rtrie;": "\u22B5",
	"rtrif;": "\u25B8",
	"rtriltri;": "\u29CE",
	"RuleDelayed;": "\u29F4",
	"ruluhar;": "\u2968",
	"rx;": "\u211E",
	"Sacute;": "\u015A",
	"sacute;": "\u015B",
	"sbquo;": "\u201A",
	"scap;": "\u2AB8",
	"Scaron;": "\u0160",
	"scaron;": "\u0161",
	"Sc;": "\u2ABC",
	"sc;": "\u227B",
	"sccue;": "\u227D",
	"sce;": "\u2AB0",
	"scE;": "\u2AB4",
	"Scedil;": "\u015E",
	"scedil;": "\u015F",
	"Scirc;": "\u015C",
	"scirc;": "\u015D",
	"scnap;": "\u2ABA",
	"scnE;": "\u2AB6",
	"scnsim;": "\u22E9",
	"scpolint;": "\u2A13",
	"scsim;": "\u227F",
	"Scy;": "\u0421",
	"scy;": "\u0441",
	"sdotb;": "\u22A1",
	"sdot;": "\u22C5",
	"sdote;": "\u2A66",
	"searhk;": "\u2925",
	"searr;": "\u2198",
	"seArr;": "\u21D8",
	"searrow;": "\u2198",
	"sect;": "\u00A7",
	"sect": "\u00A7",
	"semi;": "\u003B",
	"seswar;": "\u2929",
	"setminus;": "\u2216",
	"setmn;": "\u2216",
	"sext;": "\u2736",
	"Sfr;": "\uD835\uDD16",
	"sfr;": "\uD835\uDD30",
	"sfrown;": "\u2322",
	"sharp;": "\u266F",
	"SHCHcy;": "\u0429",
	"shchcy;": "\u0449",
	"SHcy;": "\u0428",
	"shcy;": "\u0448",
	"ShortDownArrow;": "\u2193",
	"ShortLeftArrow;": "\u2190",
	"shortmid;": "\u2223",
	"shortparallel;": "\u2225",
	"ShortRightArrow;": "\u2192",
	"ShortUpArrow;": "\u2191",
	"shy;": "\u00AD",
	"shy": "\u00AD",
	"Sigma;": "\u03A3",
	"sigma;": "\u03C3",
	"sigmaf;": "\u03C2",
	"sigmav;": "\u03C2",
	"sim;": "\u223C",
	"simdot;": "\u2A6A",
	"sime;": "\u2243",
	"simeq;": "\u2243",
	"simg;": "\u2A9E",
	"simgE;": "\u2AA0",
	"siml;": "\u2A9D",
	"simlE;": "\u2A9F",
	"simne;": "\u2246",
	"simplus;": "\u2A24",
	"simrarr;": "\u2972",
	"slarr;": "\u2190",
	"SmallCircle;": "\u2218",
	"smallsetminus;": "\u2216",
	"smashp;": "\u2A33",
	"smeparsl;": "\u29E4",
	"smid;": "\u2223",
	"smile;": "\u2323",
	"smt;": "\u2AAA",
	"smte;": "\u2AAC",
	"smtes;": "\u2AAC\uFE00",
	"SOFTcy;": "\u042C",
	"softcy;": "\u044C",
	"solbar;": "\u233F",
	"solb;": "\u29C4",
	"sol;": "\u002F",
	"Sopf;": "\uD835\uDD4A",
	"sopf;": "\uD835\uDD64",
	"spades;": "\u2660",
	"spadesuit;": "\u2660",
	"spar;": "\u2225",
	"sqcap;": "\u2293",
	"sqcaps;": "\u2293\uFE00",
	"sqcup;": "\u2294",
	"sqcups;": "\u2294\uFE00",
	"Sqrt;": "\u221A",
	"sqsub;": "\u228F",
	"sqsube;": "\u2291",
	"sqsubset;": "\u228F",
	"sqsubseteq;": "\u2291",
	"sqsup;": "\u2290",
	"sqsupe;": "\u2292",
	"sqsupset;": "\u2290",
	"sqsupseteq;": "\u2292",
	"square;": "\u25A1",
	"Square;": "\u25A1",
	"SquareIntersection;": "\u2293",
	"SquareSubset;": "\u228F",
	"SquareSubsetEqual;": "\u2291",
	"SquareSuperset;": "\u2290",
	"SquareSupersetEqual;": "\u2292",
	"SquareUnion;": "\u2294",
	"squarf;": "\u25AA",
	"squ;": "\u25A1",
	"squf;": "\u25AA",
	"srarr;": "\u2192",
	"Sscr;": "\uD835\uDCAE",
	"sscr;": "\uD835\uDCC8",
	"ssetmn;": "\u2216",
	"ssmile;": "\u2323",
	"sstarf;": "\u22C6",
	"Star;": "\u22C6",
	"star;": "\u2606",
	"starf;": "\u2605",
	"straightepsilon;": "\u03F5",
	"straightphi;": "\u03D5",
	"strns;": "\u00AF",
	"sub;": "\u2282",
	"Sub;": "\u22D0",
	"subdot;": "\u2ABD",
	"subE;": "\u2AC5",
	"sube;": "\u2286",
	"subedot;": "\u2AC3",
	"submult;": "\u2AC1",
	"subnE;": "\u2ACB",
	"subne;": "\u228A",
	"subplus;": "\u2ABF",
	"subrarr;": "\u2979",
	"subset;": "\u2282",
	"Subset;": "\u22D0",
	"subseteq;": "\u2286",
	"subseteqq;": "\u2AC5",
	"SubsetEqual;": "\u2286",
	"subsetneq;": "\u228A",
	"subsetneqq;": "\u2ACB",
	"subsim;": "\u2AC7",
	"subsub;": "\u2AD5",
	"subsup;": "\u2AD3",
	"succapprox;": "\u2AB8",
	"succ;": "\u227B",
	"succcurlyeq;": "\u227D",
	"Succeeds;": "\u227B",
	"SucceedsEqual;": "\u2AB0",
	"SucceedsSlantEqual;": "\u227D",
	"SucceedsTilde;": "\u227F",
	"succeq;": "\u2AB0",
	"succnapprox;": "\u2ABA",
	"succneqq;": "\u2AB6",
	"succnsim;": "\u22E9",
	"succsim;": "\u227F",
	"SuchThat;": "\u220B",
	"sum;": "\u2211",
	"Sum;": "\u2211",
	"sung;": "\u266A",
	"sup1;": "\u00B9",
	"sup1": "\u00B9",
	"sup2;": "\u00B2",
	"sup2": "\u00B2",
	"sup3;": "\u00B3",
	"sup3": "\u00B3",
	"sup;": "\u2283",
	"Sup;": "\u22D1",
	"supdot;": "\u2ABE",
	"supdsub;": "\u2AD8",
	"supE;": "\u2AC6",
	"supe;": "\u2287",
	"supedot;": "\u2AC4",
	"Superset;": "\u2283",
	"SupersetEqual;": "\u2287",
	"suphsol;": "\u27C9",
	"suphsub;": "\u2AD7",
	"suplarr;": "\u297B",
	"supmult;": "\u2AC2",
	"supnE;": "\u2ACC",
	"supne;": "\u228B",
	"supplus;": "\u2AC0",
	"supset;": "\u2283",
	"Supset;": "\u22D1",
	"supseteq;": "\u2287",
	"supseteqq;": "\u2AC6",
	"supsetneq;": "\u228B",
	"supsetneqq;": "\u2ACC",
	"supsim;": "\u2AC8",
	"supsub;": "\u2AD4",
	"supsup;": "\u2AD6",
	"swarhk;": "\u2926",
	"swarr;": "\u2199",
	"swArr;": "\u21D9",
	"swarrow;": "\u2199",
	"swnwar;": "\u292A",
	"szlig;": "\u00DF",
	"szlig": "\u00DF",
	"Tab;": "\u0009",
	"target;": "\u2316",
	"Tau;": "\u03A4",
	"tau;": "\u03C4",
	"tbrk;": "\u23B4",
	"Tcaron;": "\u0164",
	"tcaron;": "\u0165",
	"Tcedil;": "\u0162",
	"tcedil;": "\u0163",
	"Tcy;": "\u0422",
	"tcy;": "\u0442",
	"tdot;": "\u20DB",
	"telrec;": "\u2315",
	"Tfr;": "\uD835\uDD17",
	"tfr;": "\uD835\uDD31",
	"there4;": "\u2234",
	"therefore;": "\u2234",
	"Therefore;": "\u2234",
	"Theta;": "\u0398",
	"theta;": "\u03B8",
	"thetasym;": "\u03D1",
	"thetav;": "\u03D1",
	"thickapprox;": "\u2248",
	"thicksim;": "\u223C",
	"ThickSpace;": "\u205F\u200A",
	"ThinSpace;": "\u2009",
	"thinsp;": "\u2009",
	"thkap;": "\u2248",
	"thksim;": "\u223C",
	"THORN;": "\u00DE",
	"THORN": "\u00DE",
	"thorn;": "\u00FE",
	"thorn": "\u00FE",
	"tilde;": "\u02DC",
	"Tilde;": "\u223C",
	"TildeEqual;": "\u2243",
	"TildeFullEqual;": "\u2245",
	"TildeTilde;": "\u2248",
	"timesbar;": "\u2A31",
	"timesb;": "\u22A0",
	"times;": "\u00D7",
	"times": "\u00D7",
	"timesd;": "\u2A30",
	"tint;": "\u222D",
	"toea;": "\u2928",
	"topbot;": "\u2336",
	"topcir;": "\u2AF1",
	"top;": "\u22A4",
	"Topf;": "\uD835\uDD4B",
	"topf;": "\uD835\uDD65",
	"topfork;": "\u2ADA",
	"tosa;": "\u2929",
	"tprime;": "\u2034",
	"trade;": "\u2122",
	"TRADE;": "\u2122",
	"triangle;": "\u25B5",
	"triangledown;": "\u25BF",
	"triangleleft;": "\u25C3",
	"trianglelefteq;": "\u22B4",
	"triangleq;": "\u225C",
	"triangleright;": "\u25B9",
	"trianglerighteq;": "\u22B5",
	"tridot;": "\u25EC",
	"trie;": "\u225C",
	"triminus;": "\u2A3A",
	"TripleDot;": "\u20DB",
	"triplus;": "\u2A39",
	"trisb;": "\u29CD",
	"tritime;": "\u2A3B",
	"trpezium;": "\u23E2",
	"Tscr;": "\uD835\uDCAF",
	"tscr;": "\uD835\uDCC9",
	"TScy;": "\u0426",
	"tscy;": "\u0446",
	"TSHcy;": "\u040B",
	"tshcy;": "\u045B",
	"Tstrok;": "\u0166",
	"tstrok;": "\u0167",
	"twixt;": "\u226C",
	"twoheadleftarrow;": "\u219E",
	"twoheadrightarrow;": "\u21A0",
	"Uacute;": "\u00DA",
	"Uacute": "\u00DA",
	"uacute;": "\u00FA",
	"uacute": "\u00FA",
	"uarr;": "\u2191",
	"Uarr;": "\u219F",
	"uArr;": "\u21D1",
	"Uarrocir;": "\u2949",
	"Ubrcy;": "\u040E",
	"ubrcy;": "\u045E",
	"Ubreve;": "\u016C",
	"ubreve;": "\u016D",
	"Ucirc;": "\u00DB",
	"Ucirc": "\u00DB",
	"ucirc;": "\u00FB",
	"ucirc": "\u00FB",
	"Ucy;": "\u0423",
	"ucy;": "\u0443",
	"udarr;": "\u21C5",
	"Udblac;": "\u0170",
	"udblac;": "\u0171",
	"udhar;": "\u296E",
	"ufisht;": "\u297E",
	"Ufr;": "\uD835\uDD18",
	"ufr;": "\uD835\uDD32",
	"Ugrave;": "\u00D9",
	"Ugrave": "\u00D9",
	"ugrave;": "\u00F9",
	"ugrave": "\u00F9",
	"uHar;": "\u2963",
	"uharl;": "\u21BF",
	"uharr;": "\u21BE",
	"uhblk;": "\u2580",
	"ulcorn;": "\u231C",
	"ulcorner;": "\u231C",
	"ulcrop;": "\u230F",
	"ultri;": "\u25F8",
	"Umacr;": "\u016A",
	"umacr;": "\u016B",
	"uml;": "\u00A8",
	"uml": "\u00A8",
	"UnderBar;": "\u005F",
	"UnderBrace;": "\u23DF",
	"UnderBracket;": "\u23B5",
	"UnderParenthesis;": "\u23DD",
	"Union;": "\u22C3",
	"UnionPlus;": "\u228E",
	"Uogon;": "\u0172",
	"uogon;": "\u0173",
	"Uopf;": "\uD835\uDD4C",
	"uopf;": "\uD835\uDD66",
	"UpArrowBar;": "\u2912",
	"uparrow;": "\u2191",
	"UpArrow;": "\u2191",
	"Uparrow;": "\u21D1",
	"UpArrowDownArrow;": "\u21C5",
	"updownarrow;": "\u2195",
	"UpDownArrow;": "\u2195",
	"Updownarrow;": "\u21D5",
	"UpEquilibrium;": "\u296E",
	"upharpoonleft;": "\u21BF",
	"upharpoonright;": "\u21BE",
	"uplus;": "\u228E",
	"UpperLeftArrow;": "\u2196",
	"UpperRightArrow;": "\u2197",
	"upsi;": "\u03C5",
	"Upsi;": "\u03D2",
	"upsih;": "\u03D2",
	"Upsilon;": "\u03A5",
	"upsilon;": "\u03C5",
	"UpTeeArrow;": "\u21A5",
	"UpTee;": "\u22A5",
	"upuparrows;": "\u21C8",
	"urcorn;": "\u231D",
	"urcorner;": "\u231D",
	"urcrop;": "\u230E",
	"Uring;": "\u016E",
	"uring;": "\u016F",
	"urtri;": "\u25F9",
	"Uscr;": "\uD835\uDCB0",
	"uscr;": "\uD835\uDCCA",
	"utdot;": "\u22F0",
	"Utilde;": "\u0168",
	"utilde;": "\u0169",
	"utri;": "\u25B5",
	"utrif;": "\u25B4",
	"uuarr;": "\u21C8",
	"Uuml;": "\u00DC",
	"Uuml": "\u00DC",
	"uuml;": "\u00FC",
	"uuml": "\u00FC",
	"uwangle;": "\u29A7",
	"vangrt;": "\u299C",
	"varepsilon;": "\u03F5",
	"varkappa;": "\u03F0",
	"varnothing;": "\u2205",
	"varphi;": "\u03D5",
	"varpi;": "\u03D6",
	"varpropto;": "\u221D",
	"varr;": "\u2195",
	"vArr;": "\u21D5",
	"varrho;": "\u03F1",
	"varsigma;": "\u03C2",
	"varsubsetneq;": "\u228A\uFE00",
	"varsubsetneqq;": "\u2ACB\uFE00",
	"varsupsetneq;": "\u228B\uFE00",
	"varsupsetneqq;": "\u2ACC\uFE00",
	"vartheta;": "\u03D1",
	"vartriangleleft;": "\u22B2",
	"vartriangleright;": "\u22B3",
	"vBar;": "\u2AE8",
	"Vbar;": "\u2AEB",
	"vBarv;": "\u2AE9",
	"Vcy;": "\u0412",
	"vcy;": "\u0432",
	"vdash;": "\u22A2",
	"vDash;": "\u22A8",
	"Vdash;": "\u22A9",
	"VDash;": "\u22AB",
	"Vdashl;": "\u2AE6",
	"veebar;": "\u22BB",
	"vee;": "\u2228",
	"Vee;": "\u22C1",
	"veeeq;": "\u225A",
	"vellip;": "\u22EE",
	"verbar;": "\u007C",
	"Verbar;": "\u2016",
	"vert;": "\u007C",
	"Vert;": "\u2016",
	"VerticalBar;": "\u2223",
	"VerticalLine;": "\u007C",
	"VerticalSeparator;": "\u2758",
	"VerticalTilde;": "\u2240",
	"VeryThinSpace;": "\u200A",
	"Vfr;": "\uD835\uDD19",
	"vfr;": "\uD835\uDD33",
	"vltri;": "\u22B2",
	"vnsub;": "\u2282\u20D2",
	"vnsup;": "\u2283\u20D2",
	"Vopf;": "\uD835\uDD4D",
	"vopf;": "\uD835\uDD67",
	"vprop;": "\u221D",
	"vrtri;": "\u22B3",
	"Vscr;": "\uD835\uDCB1",
	"vscr;": "\uD835\uDCCB",
	"vsubnE;": "\u2ACB\uFE00",
	"vsubne;": "\u228A\uFE00",
	"vsupnE;": "\u2ACC\uFE00",
	"vsupne;": "\u228B\uFE00",
	"Vvdash;": "\u22AA",
	"vzigzag;": "\u299A",
	"Wcirc;": "\u0174",
	"wcirc;": "\u0175",
	"wedbar;": "\u2A5F",
	"wedge;": "\u2227",
	"Wedge;": "\u22C0",
	"wedgeq;": "\u2259",
	"weierp;": "\u2118",
	"Wfr;": "\uD835\uDD1A",
	"wfr;": "\uD835\uDD34",
	"Wopf;": "\uD835\uDD4E",
	"wopf;": "\uD835\uDD68",
	"wp;": "\u2118",
	"wr;": "\u2240",
	"wreath;": "\u2240",
	"Wscr;": "\uD835\uDCB2",
	"wscr;": "\uD835\uDCCC",
	"xcap;": "\u22C2",
	"xcirc;": "\u25EF",
	"xcup;": "\u22C3",
	"xdtri;": "\u25BD",
	"Xfr;": "\uD835\uDD1B",
	"xfr;": "\uD835\uDD35",
	"xharr;": "\u27F7",
	"xhArr;": "\u27FA",
	"Xi;": "\u039E",
	"xi;": "\u03BE",
	"xlarr;": "\u27F5",
	"xlArr;": "\u27F8",
	"xmap;": "\u27FC",
	"xnis;": "\u22FB",
	"xodot;": "\u2A00",
	"Xopf;": "\uD835\uDD4F",
	"xopf;": "\uD835\uDD69",
	"xoplus;": "\u2A01",
	"xotime;": "\u2A02",
	"xrarr;": "\u27F6",
	"xrArr;": "\u27F9",
	"Xscr;": "\uD835\uDCB3",
	"xscr;": "\uD835\uDCCD",
	"xsqcup;": "\u2A06",
	"xuplus;": "\u2A04",
	"xutri;": "\u25B3",
	"xvee;": "\u22C1",
	"xwedge;": "\u22C0",
	"Yacute;": "\u00DD",
	"Yacute": "\u00DD",
	"yacute;": "\u00FD",
	"yacute": "\u00FD",
	"YAcy;": "\u042F",
	"yacy;": "\u044F",
	"Ycirc;": "\u0176",
	"ycirc;": "\u0177",
	"Ycy;": "\u042B",
	"ycy;": "\u044B",
	"yen;": "\u00A5",
	"yen": "\u00A5",
	"Yfr;": "\uD835\uDD1C",
	"yfr;": "\uD835\uDD36",
	"YIcy;": "\u0407",
	"yicy;": "\u0457",
	"Yopf;": "\uD835\uDD50",
	"yopf;": "\uD835\uDD6A",
	"Yscr;": "\uD835\uDCB4",
	"yscr;": "\uD835\uDCCE",
	"YUcy;": "\u042E",
	"yucy;": "\u044E",
	"yuml;": "\u00FF",
	"yuml": "\u00FF",
	"Yuml;": "\u0178",
	"Zacute;": "\u0179",
	"zacute;": "\u017A",
	"Zcaron;": "\u017D",
	"zcaron;": "\u017E",
	"Zcy;": "\u0417",
	"zcy;": "\u0437",
	"Zdot;": "\u017B",
	"zdot;": "\u017C",
	"zeetrf;": "\u2128",
	"ZeroWidthSpace;": "\u200B",
	"Zeta;": "\u0396",
	"zeta;": "\u03B6",
	"zfr;": "\uD835\uDD37",
	"Zfr;": "\u2128",
	"ZHcy;": "\u0416",
	"zhcy;": "\u0436",
	"zigrarr;": "\u21DD",
	"zopf;": "\uD835\uDD6B",
	"Zopf;": "\u2124",
	"Zscr;": "\uD835\uDCB5",
	"zscr;": "\uD835\uDCCF",
	"zwj;": "\u200D",
	"zwnj;": "\u200C"
};

},
{}],
13:[function(_dereq_,module,exports){
var util = _dereq_('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

var assert = module.exports = ok;

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    var err = new Error();
    if (err.stack) {
      var out = err.stack;
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}
assert.fail = fail;

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  if (a.prototype !== b.prototype) return false;
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  if (ka.length != kb.length)
    return false;
  ka.sort();
  kb.sort();
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},
{"util/":15}],
14:[function(_dereq_,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},
{}],
15:[function(_dereq_,module,exports){
(function (process,global){

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};
exports.deprecate = function(fn, msg) {
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};
function inspect(obj, opts) {
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    ctx.showHidden = opts;
  } else if (opts) {
    exports._extend(ctx, opts);
  }
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      value.inspect !== exports.inspect &&
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = _dereq_('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};
exports.inherits = _dereq_('inherits');

exports._extend = function(origin, add) {
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,_dereq_("/usr/local/lib/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},
{"./support/isBuffer":14,"/usr/local/lib/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":18,"inherits":17}],
16:[function(_dereq_,module,exports){

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;
EventEmitter.defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    this._events[type].push(listener);
  else
    this._events[type] = [this._events[type], listener];
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      console.trace();
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},
{}],
17:[function(_dereq_,module,exports){
if (typeof Object.create === 'function') {
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},
{}],
18:[function(_dereq_,module,exports){

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.once = noop;
process.off = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},
{}],
19:[function(_dereq_,module,exports){
module.exports=_dereq_(14)
},
{}],
20:[function(_dereq_,module,exports){
module.exports=_dereq_(15)
},
{"./support/isBuffer":19,"/usr/local/lib/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":18,"inherits":17}]},{},[9])
(9)

});

var jslint = (function JSLint() {
    "use strict";

    function empty() {

// The empty function produces a new empty object that inherits nothing. This is
// much better than {} because confusions around accidental method names like
// "constructor" are completely avoided.

        return Object.create(null);
    }

    function populate(object, array, value) {

// Augment an object by taking property names from an array of strings.

        array.forEach(function (name) {
            object[name] = value;
        });
    }

    var allowed_option = {

// These are the options that are recognized in the option object or that may
// appear in a /*jslint*/ directive. Most options will have a boolean value,
// usually true. Some options will also predefine some number of global
// variables.

        bitwise: true,
        browser: [
            "Audio", "clearInterval", "clearTimeout", "document", "event",
            "FormData", "history", "Image", "localStorage", "location", "name",
            "navigator", "Option", "screen", "sessionStorage", "setInterval",
            "setTimeout", "Storage", "XMLHttpRequest"
        ],
        couch: [
            "emit", "getRow", "isArray", "log", "provides", "registerType",
            "require", "send", "start", "sum", "toJSON"
        ],
        devel: [
            "alert", "confirm", "console", "Debug", "opera", "prompt", "WSH"
        ],
        es6: [
            "ArrayBuffer", "DataView", "Float32Array", "Float64Array",
            "Generator", "GeneratorFunction", "Int8Array", "Int16Array",
            "Int32Array", "Intl", "Map", "Promise", "Proxy", "Reflect",
            "Set", "Symbol", "System", "Uint8Array", "Uint8ClampedArray",
            "Uint16Array", "Uint32Array", "WeakMap", "WeakSet"
        ],
        eval: true,
        for: true,
        fudge: true,
        maxerr: 10000,
        maxlen: 10000,
        multivar: true,
        node: [
            "Buffer", "clearImmediate", "clearInterval", "clearTimeout",
            "console", "exports", "global", "module", "process", "querystring",
            "require", "setImmediate", "setInterval", "setTimeout",
            "__dirname", "__filename"
        ],
        this: true,
        white: true
    };

    var spaceop = {

// This is the set of infix operators that require a space on each side.

        "!=": true,
        "!==": true,
        "%": true,
        "%=": true,
        "&": true,
        "&=": true,
        "&&": true,
        "*": true,
        "*=": true,
        "+=": true,
        "-=": true,
        "/": true,
        "/=": true,
        "<": true,
        "<=": true,
        "<<": true,
        "<<=": true,
        "=": true,
        "==": true,
        "===": true,
        "=>": true,
        ">": true,
        ">=": true,
        ">>": true,
        ">>=": true,
        ">>>": true,
        ">>>=": true,
        "^": true,
        "^=": true,
        "|": true,
        "|=": true,
        "||": true
    };

    var bitwiseop = {

// These are the bitwise operators.

        "~": true,
        "^": true,
        "^=": true,
        "&": true,
        "&=": true,
        "|": true,
        "|=": true,
        "<<": true,
        "<<=": true,
        ">>": true,
        ">>=": true,
        ">>>": true,
        ">>>=": true
    };

    var opener = {

// The open and close pairs.

        "(": ")",       // paren
        "[": "]",       // bracket
        "{": "}",       // brace
        "${": "}"       // mega
    };

    var relationop = {

// The relational operators.

        "!=": true,
        "!==": true,
        "==": true,
        "===": true,
        "<": true,
        "<=": true,
        ">": true,
        ">=": true
    };

    var standard = [

// These are the globals that are provided by the ES5 language standard.

        "Array", "Boolean", "Date", "decodeURI", "decodeURIComponent",
        "encodeURI", "encodeURIComponent", "Error", "EvalError", "isFinite",
        "JSON", "Math", "Number", "Object", "parseInt", "parseFloat",
        "RangeError", "ReferenceError", "RegExp", "String", "SyntaxError",
        "TypeError", "URIError"
    ];

    var bundle = {

// The bundle contains the raw text messages that are generated by jslint. It
// seems that they are all error messages and warnings. There are no "Atta
// boy!" or "You are so awesome!" messages. There is no positive reinforcement
// or encouragement. This relentless negativity can undermine self-esteem and
// wound the inner child. But if you accept it as sound advice rather than as
// personal criticism, it can make your programs better.

        and: "The '&&' subexpression should be wrapped in parens.",
        bad_assignment_a: "Bad assignment to '{a}'.",
        bad_directive_a: "Bad directive '{a}'.",
        bad_get: "A get function takes no parameters.",
        bad_module_name_a: "Bad module name '{a}'.",
        bad_option_a: "Bad option '{a}'.",
        bad_property_a: "Bad property name '{a}'.",
        bad_set: "A set function takes one parameter.",
        duplicate_a: "Duplicate '{a}'.",
        empty_block: "Empty block.",
        es6: "Unexpected ES6 feature '{a}'.",
        expected_a_at_b_c: "Expected '{a}' at column {b}, not column {c}.",
        expected_a_b: "Expected '{a}' and instead saw '{b}'.",
        expected_a_b_from_c_d: "Expected '{a}' to match '{b}' from line {c} and instead saw '{d}'.",
        expected_a_before_b: "Expected '{a}' before '{b}'.",
        expected_digits_after_a: "Expected digits after '{a}'.",
        expected_four_digits: "Expected four digits after '\\u'.",
        expected_identifier_a: "Expected an identifier and instead saw '{a}'.",
        expected_line_break_a_b: "Expected a line break between '{a}' and '{b}'.",
        expected_regexp_factor_a: "Expected a regexp factor and instead saw '{a}'.",
        expected_space_a_b: "Expected one space between '{a}' and '{b}'.",
        expected_statements_a: "Expected statements before '{a}'.",
        expected_string_a: "Expected a string and instead saw '{a}'.",
        expected_type_string_a: "Expected a type string and instead saw '{a}'.",
        function_in_loop: "Don't make functions within a loop.",
        infix_in: "Unexpected 'in'. Compare with undefined, or use the hasOwnProperty method instead.",
        isNaN: "Use the isNaN function to compare with NaN.",
        label_a: "'{a}' is a statement label.",
        misplaced_a: "Place '{a}' at the outermost level.",
        misplaced_directive_a: "Place the '/*{a}*/' directive before the first statement.",
        missing_browser: "/*global*/ requires the Assume a browser option.",
        naked_block: "Naked block.",
        nested_comment: "Nested comment.",
        not_label_a: "'{a}' is not a label.",
        number_isNaN: "Use Number.isNaN function to compare with NaN.",
        out_of_scope_a: "'{a}' is out of scope.",
        redefinition_a_b: "Redefinition of '{a}' from line {b}.",
        reserved_a: "Reserved name '{a}'.",
        subscript_a: "['{a}'] is better written in dot notation.",
        todo_comment: "Unexpected TODO comment.",
        too_long: "Line too long.",
        too_many: "Too many warnings.",
        too_many_digits: "Too many digits.",
        unclosed_comment: "Unclosed comment.",
        unclosed_mega: "Unclosed mega literal.",
        unclosed_string: "Unclosed string.",
        undeclared_a: "Undeclared '{a}'.",
        unexpected_a: "Unexpected '{a}'.",
        unexpected_a_after_b: "Unexpected '{a}' after '{b}'.",
        unexpected_at_top_level_a: "Unexpected '{a}' at top level.",
        unexpected_char_a: "Unexpected character '{a}'.",
        unexpected_comment: "Unexpected comment.",
        unexpected_directive_a: "When using modules, don't use directive '/*{a}'.",
        unexpected_expression_a: "Unexpected expression '{a}' in statement position.",
        unexpected_label_a: "Unexpected label '{a}'.",
        unexpected_parens: "Don't wrap function literals in parens.",
        unexpected_space_a_b: "Unexpected space between '{a}' and '{b}'.",
        unexpected_statement_a: "Unexpected statement '{a}' in expression position.",
        unexpected_trailing_space: "Unexpected trailing space.",
        unexpected_typeof_a: "Unexpected 'typeof'. Use '===' to compare directly with {a}.",
        uninitialized_a: "Uninitialized '{a}'.",
        unreachable_a: "Unreachable '{a}'.",
        unregistered_property_a: "Unregistered property name '{a}'.",
        unsafe: "Unsafe character '{a}'.",
        unused_a: "Unused '{a}'.",
        use_spaces: "Use spaces, not tabs.",
        var_loop: "Don't declare variables in a loop.",
        var_switch: "Don't declare variables in a switch.",
        weird_condition_a: "Weird condition '{a}'.",
        weird_expression_a: "Weird expression '{a}'.",
        weird_loop: "Weird loop.",
        weird_relation_a: "Weird relation '{a}'.",
        wrap_assignment: "Don't wrap assignment statements in parens.",
        wrap_condition: "Wrap the condition in parens.",
        wrap_immediate: "Wrap an immediate function invocation in " +
                "parentheses to assist the reader in understanding that the " +
                "expression is the result of a function, and not the " +
                "function itself.",
        wrap_parameter: "Wrap the parameter in parens.",
        wrap_regexp: "Wrap this regexp in parens to avoid confusion.",
        wrap_unary: "Wrap the unary expression in parens."
    };

// Regular expression literals:

// supplant {variables}
    var rx_supplant = /\{([^{}]*)\}/g;
// carriage return, carriage return linefeed, or linefeed
    var rx_crlf = /\n|\r\n?/;
// unsafe characters that are silently deleted by one or more browsers
    var rx_unsafe = /[\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/;
// identifier
    var rx_identifier = /^([a-zA-Z_$][a-zA-Z0-9_$]*)$/;
    var rx_module = /^[a-zA-Z0-9_$:.@\-\/]+$/;
    var rx_bad_property = /^_|\$|Sync$|_$/;
// star slash
    var rx_star_slash = /\*\//;
// slash star
    var rx_slash_star = /\/\*/;
// slash star or ending slash
    var rx_slash_star_or_slash = /\/\*|\/$/;
// uncompleted work comment
    var rx_todo = /\b(?:todo|TO\s?DO|HACK)\b/;
// tab
    var rx_tab = /\t/g;
// directive
    var rx_directive = /^(jslint|property|global)\s+(.*)$/;
    var rx_directive_part = /^([a-zA-Z$_][a-zA-Z0-9$_]*)\s*(?::\s*(true|false|[0-9]+)\s*)?(?:,\s*)?(.*)$/;
// token (sorry it is so long)
    var rx_token = /^((\s+)|([a-zA-Z_$][a-zA-Z0-9_$]*)|[(){}\[\]\?,:;'"~`]|=(?:==?|>)?|\.+|\/[=*\/]?|\*[\/=]?|\+(?:=|\++)?|-(?:=|-+)?|[\^%]=?|&[&=]?|\|[\|=]?|>{1,3}=?|<<?=?|!={0,2}|(0|[1-9][0-9]*))(.*)$/;
    var rx_digits = /^([0-9]+)(.*)$/;
    var rx_hexs = /^([0-9a-fA-F]+)(.*)$/;
    var rx_octals = /^([0-7]+)(.*)$/;
    var rx_bits = /^([01]+)(.*)$/;
// mega
    var rx_mega = /`|\$\{/;
// indentation
    var rx_colons = /^(.*)\?([:.]*)$/;
    var rx_dot = /\.$/;
// JSON number
    var rx_JSON_number = /^-?\d+(?:\.\d*)?(?:e[\-+]?\d+)?$/i;
// initial cap
    var rx_cap = /^[A-Z]/;

    function is_letter(string) {
        return (string >= "a" && string <= "z\uffff") ||
                (string >= "A" && string <= "Z\uffff");
    }

    function supplant(string, object) {
        return string.replace(rx_supplant, function (found, filling) {
            var replacement = object[filling];
            return (replacement !== undefined)
                ? replacement
                : found;
        });
    }

    var anon = "anonymous"; // The guessed name for anonymous functions.
    var blockage;           // The current block.
    var block_stack;        // The stack of blocks.
    var declared_globals;   // The object containing the global declarations.
    var directives;         // The directive comments.
    var directive_mode;     // true if directives are still allowed.
    var early_stop;         // true if JSLint cannot finish.
    var export_mode;        // true if an export statement was seen.
    var fudge;              // true if the natural numbers start with 1.
    var functionage;        // The current function.
    var functions;          // The array containing all of the functions.
    var global;             // The global object; the outermost context.
    var imports;            // The array collecting all import-from strings.
    var json_mode;          // true if parsing JSON.
    var lines;              // The array containing source lines.
    var module_mode;        // true if import or export was used.
    var next_token;         // The next token to be examined in the parse.
    var option;             // The options parameter.
    var property;           // The object containing the tallied property names.
    var mega_mode;          // true if currently parsing a megastring literal.
    var stack;              // The stack of functions.
    var syntax;             // The object containing the parser.
    var token;              // The current token being examined in the parse.
    var token_nr;           // The number of the next token.
    var tokens;             // The array of tokens.
    var tenure;             // The predefined property registry.
    var tree;               // The abstract parse tree.
    var var_mode;           // true if using var; false if using let.
    var warnings;           // The array collecting all generated warnings.

// Error reportage functions:

    function artifact(the_token) {

// Return a string representing an artifact.

        if (the_token === undefined) {
            the_token = next_token;
        }
        return (the_token.id === "(string)" || the_token.id === "(number)")
            ? String(the_token.value)
            : the_token.id;
    }

    function artifact_line(the_token) {

// Return the fudged line number of an artifact.

        if (the_token === undefined) {
            the_token = next_token;
        }
        return the_token.line + fudge;
    }

    function artifact_column(the_token) {

// Return the fudged column number of an artifact.

        if (the_token === undefined) {
            the_token = next_token;
        }
        return the_token.from + fudge;
    }

    function warn_at(code, line, column, a, b, c, d) {

// Report an error at some line and column of the program. The warning object
// resembles an exception.

        var warning = {         // ~~
            name: "JSLintError",
            column: column,
            line: line,
            code: code
        };
        if (a !== undefined) {
            warning.a = a;
        }
        if (b !== undefined) {
            warning.b = b;
        }
        if (c !== undefined) {
            warning.c = c;
        }
        if (d !== undefined) {
            warning.d = d;
        }
        warning.message = supplant(bundle[code] || code, warning);
        warnings.push(warning);
        return (
            typeof option.maxerr === "number" &&
            warnings.length === option.maxerr
        )   ? stop_at("too_many", line, column)
            : warning;
    }

    function stop_at(code, line, column, a, b, c, d) {

// Same as warn_at, except that it stops the analysis.

        throw warn_at(code, line, column, a, b, c, d);
    }

    function warn(code, the_token, a, b, c, d) {

// Same as warn_at, except the warning will be associated with a specific token.
// If there is already a warning on this token, suppress the new one. It is
// likely that the first warning will be the most meaningful.

        if (the_token === undefined) {
            the_token = next_token;
        }
        if (the_token.warning === undefined) {
            the_token.warning = warn_at(
                code,
                the_token.line,
                the_token.from,
                a || artifact(the_token),
                b,
                c,
                d
            );
            return the_token.warning;
        }
    }

    function stop(code, the_token, a, b, c, d) {

// Similar to warn and stop_at. If the token already had a warning, that
// warning will be replaced with this new one. It is likely that the stopping
// warning will be the more meaningful.

        if (the_token === undefined) {
            the_token = next_token;
        }
        delete the_token.warning;
        throw warn(code, the_token, a, b, c, d);
    }

// Tokenize:

    function tokenize(source) {

// tokenize takes a source and produces from it an array of token objects.
// JavaScript is notoriously difficult to tokenize because of the horrible
// interactions between automatic semicolon insertion, regular expression
// literals, and now megastring literals. JSLint benefits from eliminating
// automatic semicolon insertion and nested megastring literals, which allows
// full tokenization to precede parsing.

// If the source is not an array, then it is split into lines at the
// carriage return/linefeed.

        lines = (Array.isArray(source))
            ? source
            : source.split(rx_crlf);
        tokens = [];

        var char;                   // a popular character
        var column = 0;             // the column number of the next character
        var from;                   // the starting column number of the token
        var line = -1;              // the line number of the next character
        var previous = global;      // the previous token including comments
        var prior = global;         // the previous token excluding comments
        var mega_from;              // the starting column of megastring
        var mega_line;              // the starting line of megastring
        var snippet;                // a piece of string
        var source_line;            // the current line source string

        function next_line() {

// Put the next line of source in source_line. If the line contains tabs,
// replace them with spaces and give a warning. Also warn if the line contains
// unsafe characters or is too damn long.

            var at;
            column = 0;
            line += 1;
            source_line = lines[line];
            if (source_line !== undefined) {
                at = source_line.search(rx_tab);
                if (at >= 0) {
                    if (!option.white) {
                        warn_at("use_spaces", line, at + 1);
                    }
                    source_line = source_line.replace(rx_tab, " ");
                }
                at = source_line.search(rx_unsafe);
                if (at >= 0) {
                    warn_at(
                        "unsafe",
                        line,
                        column + at,
                        "U+" + source_line.charCodeAt(at).toString(16)
                    );
                }
                if (option.maxlen && option.maxlen < source_line.length) {
                    warn_at("too_long", line, source_line.length);
                } else if (!option.white && source_line.slice(-1) === " ") {
                    warn_at(
                        "unexpected_trailing_space",
                        line,
                        source_line.length - 1
                    );
                }
            }
            return source_line;
        }

// Most tokens, including the identifiers, operators, and punctuators, can be
// found with a regular expression. Regular expressions cannot correctly match
// regular expression literals, so we will match those the hard way. String
// literals and number literals can be matched by regular expressions, but they
// don't provide good warnings. The functions snip, next_char, prev_char,
// some_digits, and escape help in the parsing of literals.

        function snip() {

// Remove the last character from snippet.

            snippet = snippet.slice(0, -1);
        }

        function next_char(match) {

// Get the next character from the source line. Remove it from the source_line,
// and append it to the snippet. Optionally check that the previous character
// matched an expected value.

            if (match !== undefined && char !== match) {
                return stop_at("expected_a_b", line, column, match, char);
            }
            if (source_line) {
                char = source_line.charAt(0);
                source_line = source_line.slice(1);
                snippet += char;
            } else {
                char = "";
                snippet += " ";
            }
            column += 1;
            return char;
        }

        function back_char() {

// Back up one character by moving a character from the end of the snippet to
// the front of the source_line.

            if (snippet) {
                char = snippet.slice(-1);
                source_line = char + source_line;
                column -= 1;
                snip();
            } else {
                char = "";
            }
            return char;
        }

        function some_digits(rx, quiet) {
            var result = source_line.match(rx);
            if (result) {
                char = result[1];
                column += char.length;
                source_line = result[2];
                snippet += char;
            } else {
                char = "";
                if (!quiet) {
                    warn_at(
                        "expected_digits_after_a",
                        line,
                        column,
                        snippet
                    );
                }
            }
            return char.length;
        }

        function escape(extra) {
            switch (next_char("\\")) {
            case "\\":
            case "\"":
            case "'":
            case "/":
            case ":":
            case "=":
            case "|":
            case "b":
            case "f":
            case "n":
            case "r":
            case "t":
            case " ":
                break;
            case "u":
                if (next_char("u") === "{") {
                    if (some_digits(rx_hexs) > 5) {
                        warn_at("too_many_digits", line, column - 1);
                    }
                    if (!option.es6) {
                        warn_at("es6", line, column, "u{");
                    }
                    if (next_char() !== "}") {
                        stop_at("expected_a_before_b", line, column, "}", char);
                    }
                    next_char();
                    return;
                }
                back_char();
                if (some_digits(rx_hexs, true) < 4) {
                    warn_at("expected_four_digits", line, column - 1);
                }
                break;
            case "":
                return stop_at("unclosed_string", line, column);
            default:
                if (extra && extra.indexOf(char) < 0) {
                    warn_at("unexpected_a_after_b", line, column, char, "\\");
                }
            }
            next_char();
        }

        function make(id, value, identifier) {

// Make the token object and append it to the tokens list.

            var the_token = {
                id: id,
                identifier: !!identifier,
                from: from,
                thru: column,
                line: line
            };
            tokens.push(the_token);

// Directives must appear before the first statement.

            if (id !== "(comment)" && id !== ";") {
                directive_mode = false;
            }

// If the token is to have a value, give it one.

            if (value !== undefined) {
                the_token.value = value;
            }

// If this token is an identifier that touches a preceding number, or
// a "/", comment, or regular expression literal that touches a preceding
// comment or regular expression literal, then give a missing space warning.
// This warning is not suppressed by option.white.

            if (
                previous.line === line &&
                previous.thru === from &&
                (
                    (id === "(comment)" || id === "(regexp)" || id === "/") &&
                    (
                        previous.id === "(comment)" ||
                        previous.id === "(regexp)"
                    )
                )
            ) {
                warn(
                    "expected_space_a_b",
                    the_token,
                    artifact(previous),
                    artifact(the_token)
                );
            }
            if (previous.id === "." && id === "(number)") {
                warn("expected_a_before_b", previous, "0", ".");
            }
            if (prior.id === "." && the_token.identifier) {
                the_token.dot = true;
            }

// The previous token is used to detect adjacency problems.

            previous = the_token;

// The prior token is a previous token that was not a comment. The prior token
// is used to disambiguate "/", which can mean division or regular expression
// literal.

            if (previous.id !== "(comment)") {
                prior = previous;
            }
            return the_token;
        }

        function parse_directive(the_comment, body) {

// JSLint recognizes three directives that can be encoded in comments. This
// function processes one item, and calls itself recursively to process the
// next one.

            var result = body.match(rx_directive_part);
            if (result) {
                var allowed;
                var name = result[1];
                var value = result[2];
                switch (the_comment.directive) {
                case "jslint":
                    allowed = allowed_option[name];
                    switch (typeof allowed) {
                    case "boolean":
                    case "object":
                        switch (value) {
                        case "true":
                        case "":
                        case undefined:
                            option[name] = true;
                            if (Array.isArray(allowed)) {
                                populate(declared_globals, allowed, false);
                            }
                            break;
                        case "false":
                            option[name] = false;
                            break;
                        default:
                            warn(
                                "bad_option_a",
                                the_comment,
                                name + ":" + value
                            );
                        }
                        break;
                    case "number":
                        if (isFinite(+value)) {
                            option[name] = +value;
                        } else {
                            warn(
                                "bad_option_a",
                                the_comment,
                                name + ":" + value
                            );
                        }
                        break;
                    default:
                        warn("bad_option_a", the_comment, name);
                    }
                    break;
                case "property":
                    if (tenure === undefined) {
                        tenure = empty();
                    }
                    tenure[name] = true;
                    break;
                case "global":
                    if (value) {
                        warn("bad_option_a", the_comment, name + ":" + value);
                    }
                    declared_globals[name] = false;
                    module_mode = the_comment;
                    break;
                }
                return parse_directive(the_comment, result[3]);
            }
            if (body) {
                return stop("bad_directive_a", the_comment, body);
            }
        }

        function comment(snippet) {

// Make a comment object. Comments are not allowed in JSON text. Comments can
// include directives and notices of incompletion.

            var the_comment = make("(comment)", snippet);
            if (Array.isArray(snippet)) {
                snippet = snippet.join(" ");
            }
            if (!option.devel && rx_todo.test(snippet)) {
                warn("todo_comment", the_comment);
            }
            var result = snippet.match(rx_directive);
            if (result) {
                if (!directive_mode) {
                    warn_at("misplaced_directive_a", line, from, result[1]);
                } else {
                    the_comment.directive = result[1];
                    parse_directive(the_comment, result[2]);
                }
                directives.push(the_comment);
            }
            return the_comment;
        }

        function regexp() {

// Parse a regular expression literal.

            var result;
            var value;

            function quantifier() {

// Match an optional quantifier.

                switch (char) {
                case "?":
                case "*":
                case "+":
                    next_char();
                    break;
                case "{":
                    if (some_digits(rx_digits, true) === 0) {
                        warn_at("expected_a", line, column, "0");
                    }
                    if (next_char() === ",") {
                        some_digits(rx_digits, true);
                        next_char();
                    }
                    next_char("}");
                    break;
                default:
                    return;
                }
                if (char === "?") {
                    next_char("?");
                }
            }

            function subklass() {

// Match a character in a character class.

                switch (char) {
                case "\\":
                    escape();
                    return true;
                case "[":
                case "]":
                case "/":
                case "^":
                case "-":
                case "|":
                case "":
                    return false;
                case "`":
                    if (mega_mode) {
                        warn_at("unexpected_a", line, column, "`");
                    }
                    next_char();
                    return true;
                case " ":
                    warn_at("expected_a_before_b", line, column, "\\", " ");
                    next_char();
                    return true;
                default:
                    next_char();
                    return true;
                }
            }

            function range() {

// Match a range of subclasses.

                if (subklass()) {
                    if (char === "-") {
                        next_char("-");
                        if (!subklass()) {
                            return stop_at(
                                "unexpected_a",
                                line,
                                column - 1,
                                "-"
                            );
                        }
                    }
                    return range();
                }
            }

            function klass() {

// Match a class.

                next_char("[");
                if (char === "^") {
                    next_char("^");
                }
                range();
                next_char("]");
            }

            function choice() {

                function group() {

// Match a group that starts with left paren.

                    next_char("(");
                    if (char === "?") {
                        next_char("?");
                        switch (char) {
                        case ":":
                        case "=":
                        case "!":
                            next_char();
                            break;
                        default:
                            next_char(":");
                        }
                    } else if (char === ":") {
                        warn_at("expected_a_before_b", line, column, "?", ":");
                    }
                    choice();
                    next_char(")");
                }

                function factor() {
                    switch (char) {
                    case "[":
                        klass();
                        return true;
                    case "\\":
                        escape("BbDdSsWw^${}[]().|*+?");
                        return true;
                    case "(":
                        group();
                        return true;
                    case "/":
                    case "|":
                    case "]":
                    case ")":
                    case "}":
                    case "{":
                    case "?":
                    case "+":
                    case "*":
                    case "":
                        return false;
                    case "`":
                        if (mega_mode) {
                            warn_at("unexpected_a", line, column, "`");
                        }
                        break;
                    case " ":
                        warn_at("expected_a_before_b", line, column, "\\", " ");
                        break;
                    }
                    next_char();
                    return true;
                }

                function sequence(follow) {
                    if (factor()) {
                        quantifier();
                        return sequence(true);
                    }
                    if (!follow) {
                        warn_at("expected_regexp_factor_a", line, column, char);
                    }
                }

// Match a choice (a sequence that can be followed by | and another choice).

                sequence();
                if (char === "|") {
                    next_char("|");
                    return choice();
                }
            }

// Scan the regexp literal. Give a warning if the first character is = because
// /= looks like a division assignment operator.

            snippet = "";
            next_char();
            if (char === "=") {
                warn_at("expected_a_before_b", line, column, "\\", "=");
            }
            choice();

// Make sure there is a closing slash.

            snip();
            value = snippet;
            next_char("/");

// Process dangling flag letters.

            var allowed = {
                g: true,
                i: true,
                m: true,
                u: 6,
                y: 6
            };
            var flag = empty();
            (function make_flag() {
                if (is_letter(char)) {
                    switch (allowed[char]) {
                    case true:
                        break;
                    case 6:
                        if (!option.es6) {
                            warn_at("es6", line, column, char);
                        }
                        break;
                    default:
                        warn_at("unexpected_a", line, column, char);
                    }
                    allowed[char] = false;
                    flag[char] = true;
                    next_char();
                    return make_flag();
                }
            }());
            back_char();
            if (char === "/" || char === "*") {
                return stop_at("unexpected_a", line, from, char);
            }
            result = make("(regexp)", char);
            result.flag = flag;
            result.value = value;
            return result;
        }

        function string(quote) {

// Make a string token.

            var the_token;
            snippet = "";
            next_char();

            return (function next() {
                switch (char) {
                case quote:
                    snip();
                    the_token = make("(string)", snippet);
                    the_token.quote = quote;
                    return the_token;
                case "\\":
                    escape();
                    break;
                case "":
                    return stop_at("unclosed_string", line, column);
                case "`":
                    if (mega_mode) {
                        warn_at("unexpected_a", line, column, "`");
                    }
                    next_char("`");
                    break;
                default:
                    next_char();
                }
                return next();
            }());
        }

        function frack() {
            if (char === ".") {
                some_digits(rx_digits);
                next_char();
            }
            if (char === "E" || char === "e") {
                next_char();
                if (char !== "+" && char !== "-") {
                    back_char();
                }
                some_digits(rx_digits);
                next_char();
            }
        }

        function number() {
            if (snippet === "0") {
                switch (next_char()) {
                case ".":
                    frack();
                    break;
                case "b":
                    some_digits(rx_bits);
                    next_char();
                    break;
                case "o":
                    some_digits(rx_octals);
                    next_char();
                    break;
                case "x":
                    some_digits(rx_hexs);
                    next_char();
                    break;
                }
            } else {
                next_char();
                frack();
            }

// If the next character after a number is a digit or letter, then something
// unexpected is going on.

            if (
                (char >= "0" && char <= "9") ||
                (char >= "a" && char <= "z") ||
                (char >= "A" && char <= "Z")
            ) {
                return stop_at(
                    "unexpected_a_after_b",
                    line,
                    column - 1,
                    snippet.slice(-1),
                    snippet.slice(0, -1)
                );
            }
            back_char();
            return make("(number)", snippet);
        }

        function lex() {
            var array;
            var i = 0;
            var j = 0;
            var last;
            var result;
            var the_token;
            if (!source_line) {
                source_line = next_line();
                from = 0;
                return (source_line === undefined)
                    ? (mega_mode)
                        ? stop_at("unclosed_mega", mega_line, mega_from)
                        : make("(end)")
                    : lex();
            }
            from = column;
            result = source_line.match(rx_token);

// result[1] token
// result[2] whitespace
// result[3] identifier
// result[4] number
// result[5] rest

            if (!result) {
                return stop_at(
                    "unexpected_char_a",
                    line,
                    column,
                    source_line.charAt(0)
                );
            }

            snippet = result[1];
            column += snippet.length;
            source_line = result[5];

// Whitespace was matched. Call lex again to get more.

            if (result[2]) {
                return lex();
            }

// The token is an identifier.

            if (result[3]) {
                return make(snippet, undefined, true);
            }

// The token is a number.

            if (result[4]) {
                return number(snippet);
            }

// The token is something miscellaneous.

            switch (snippet) {

// The token is a single or double quote string.

            case "\"":
            case "'":
                return string(snippet);

// The token is a megastring. We don't allow any kind of mega nesting.

            case "`":
                if (mega_mode) {
                    return stop_at("expected_a_b", line, column, "}", "`");
                }
                snippet = "";
                mega_from = from;
                mega_line = line;
                mega_mode = true;

// Parsing a mega literal is tricky. First make a ` token.

                make("`");
                from += 1;

// Then loop, building up a string, possibly from many lines, until seeing
// the end of file, a closing `, or a ${ indicting an expression within the
// string.

                (function part() {
                    var at = source_line.search(rx_mega);

// If neither ` nor ${ is seen, then the whole line joins the snippet.

                    if (at < 0) {
                        snippet += source_line + "\n";
                        return (next_line() === undefined)
                            ? stop_at("unclosed_mega", mega_line, mega_from)
                            : part();
                    }

// if either ` or ${ was found, then the preceding joins the snippet to become
// a string token.

                    snippet += source_line.slice(0, at);
                    column += at;
                    source_line = source_line.slice(at);
                    make("(string)", snippet).quote = "`";
                    snippet = "";

// If ${, then make tokens that will become part of an expression until
// a } token is made.

                    if (source_line.charAt(0) === "$") {
                        column += 2;
                        make("${");
                        source_line = source_line.slice(2);
                        (function expr() {
                            var id = lex().id;
                            if (id === "{") {
                                return stop_at(
                                    "expected_a_b",
                                    line,
                                    column,
                                    "}",
                                    "{"
                                );
                            }
                            if (id !== "}") {
                                return expr();
                            }
                        }());
                        return part();
                    }
                }());
                source_line = source_line.slice(1);
                column += 1;
                mega_mode = false;
                return make("`");

// The token is a // comment.

            case "//":
                snippet = source_line;
                source_line = "";
                the_token = comment(snippet);
                if (mega_mode) {
                    warn("unexpected_comment", the_token, "`");
                }
                return the_token;

// The token is a /* comment.

            case "/*":
                array = [];
                if (source_line.charAt(0) === "/") {
                    warn_at("unexpected_a", line, column + i, "/");
                }
                (function next() {
                    if (source_line > "") {
                        i = source_line.search(rx_star_slash);
                        if (i >= 0) {
                            return;
                        }
                        j = source_line.search(rx_slash_star);
                        if (j >= 0) {
                            warn_at("nested_comment", line, column + j);
                        }
                    }
                    array.push(source_line);
                    source_line = next_line();
                    if (source_line === undefined) {
                        return stop_at("unclosed_comment", line, column);
                    }
                    return next();
                }());
                snippet = source_line.slice(0, i);
                j = snippet.search(rx_slash_star_or_slash);
                if (j >= 0) {
                    warn_at("nested_comment", line, column + j);
                }
                array.push(snippet);
                column += i + 2;
                source_line = source_line.slice(i + 2);
                return comment(array);

// The token is a slash.

            case "/":

// The / can be a division operator or the beginning of a regular expression
// literal. It is not possible to know which without doing a complete parse.
// We want to complete the tokenization before we begin to parse, so we will
// estimate. This estimator can fail in some cases. For example, it cannot
// know if "}" is ending a block or ending an object literal, so it can
// behave incorrectly in that case; it is not meaningful to divide an
// object, so it is likely that we can get away with it. We avoided the worst
// cases by eliminating automatic semicolon insertion.

                if (prior.identifier) {
                    if (!prior.dot) {
                        switch (prior.id) {
                        case "return":
                            return regexp();
                        case "(begin)":
                        case "case":
                        case "delete":
                        case "in":
                        case "instanceof":
                        case "new":
                        case "typeof":
                        case "void":
                        case "yield":
                            the_token = regexp();
                            return stop("unexpected_a", the_token);
                        }
                    }
                } else {
                    last = prior.id.charAt(prior.id.length - 1);
                    if ("(,=:?[".indexOf(last) >= 0) {
                        return regexp();
                    }
                    if ("!&|{};~+-*%/^<>".indexOf(last) >= 0) {
                        the_token = regexp();
                        warn("wrap_regexp", the_token);
                        return the_token;
                    }
                }
                if (source_line.charAt(0) === "/") {
                    column += 1;
                    source_line = source_line.slice(1);
                    snippet = "/=";
                    warn_at("unexpected_a", line, column, "/=");
                }
                break;
            }
            return make(snippet);
        }

// This is the only loop in JSLint. It will turn into a recursive call to lex
// when ES6 has been finished and widely deployed and adopted.

        while (true) {
            if (lex().id === "(end)") {
                break;
            }
        }
    }

// Parsing:

// Parsing weaves the tokens into an abstract syntax tree. During that process,
// a token may be given any of these properties:

//      arity       string
//      label       identifier
//      name        identifier
//      expression  expressions
//      block       statements
//      else        statements (else, default, catch)

// Specialized tokens may have additional properties.

    function survey(name) {
        var id = name.id;

// Tally the property name. If it is a string, only tally strings that conform
// to the identifier rules.

        if (id === "(string)") {
            id = name.value;
            if (!rx_identifier.test(id)) {
                return id;
            }
        } else if (id === "`") {
            if (name.value.length === 1) {
                id = name.value[0].value;
                if (!rx_identifier.test(id)) {
                    return id;
                }
            }
        } else if (!name.identifier) {
            return stop("expected_identifier_a", name);
        }

// If we have seen this name before, increment its count.

        if (typeof property[id] === "number") {
            property[id] += 1;

// If this is the first time seeing this property name, and if there is a
// tenure list, then it must be on the list. Otherwise, it must conform to
// the rules for good property names.

        } else {
            if (tenure !== undefined) {
                if (tenure[id] !== true) {
                    warn("unregistered_property_a", name);
                }
            } else {
                if (name.identifier && rx_bad_property.test(id)) {
                    warn("bad_property_a", name);
                }
            }
            property[id] = 1;
        }
        return id;
    }

    function dispense() {

// Deliver the next token, skipping the comments.

        var cadet = tokens[token_nr];
        token_nr += 1;
        if (cadet.id === "(comment)") {
            if (json_mode) {
                warn("unexpected_a", cadet);
            }
            return dispense();
        } else {
            return cadet;
        }
    }

    function lookahead() {

// Look ahead one token without advancing.

        var old_token_nr = token_nr;
        var cadet = dispense(true);
        token_nr = old_token_nr;
        return cadet;
    }

    function advance(id, match) {

// Produce the next token.

// Attempt to give helpful names to anonymous functions.

        if (token.identifier && token.id !== "function") {
            anon = token.id;
        } else if (token.id === "(string)" && rx_identifier.test(token.value)) {
            anon = token.value;
        }

// Attempt to match next_token with an expected id.

        if (id !== undefined && next_token.id !== id) {
            return (match === undefined)
                ? stop("expected_a_b", next_token, id, artifact())
                : stop(
                    "expected_a_b_from_c_d",
                    next_token,
                    id,
                    artifact(match),
                    artifact_line(match),
                    artifact(next_token)
                );
        }

// Promote the tokens, skipping comments.

        token = next_token;
        next_token = dispense();
        if (next_token.id === "(end)") {
            token_nr -= 1;
        }
    }

// Parsing of JSON is simple:

    function json_value() {

        function json_object() {
            var brace = next_token;
            var object = empty();
            advance("{");
            if (next_token.id !== "}") {
                (function next() {
                    if (next_token.quote !== "\"") {
                        warn("unexpected_a", next_token, next_token.quote);
                    }
                    advance("(string)");
                    if (object[token.value] !== undefined) {
                        warn("duplicate_a", token);
                    } else if (token.value === "__proto__") {
                        warn("bad_property_a", token);
                    } else {
                        object[token.value] = token;
                    }
                    advance(":");
                    json_value();
                    if (next_token.id === ",") {
                        advance(",");
                        return next();
                    }
                }());
            }
            advance("}", brace);
        }

        function json_array() {
            var bracket = next_token;
            advance("[");
            if (next_token.id !== "]") {
                (function next() {
                    json_value();
                    if (next_token.id === ",") {
                        advance(",");
                        return next();
                    }
                }());
            }
            advance("]", bracket);
        }

        switch (next_token.id) {
        case "{":
            json_object();
            break;
        case "[":
            json_array();
            break;
        case "true":
        case "false":
        case "null":
            advance();
            break;
        case "(number)":
            if (!rx_JSON_number.test(next_token.value)) {
                warn("unexpected_a");
            }
            advance();
            break;
        case "(string)":
            if (next_token.quote !== "\"") {
                warn("unexpected_a", next_token, next_token.quote);
            }
            advance();
            break;
        case "-":
            advance("-");
            advance("(number)");
            break;
        default:
            stop("unexpected_a");
        }
    }

// Now we parse JavaScript.

    function enroll(name, role, readonly) {

// Enroll a name into the current function context. The role can be exception,
// function, label, parameter, or variable. We look for variable redefinition
// because it causes confusion.

        var id = name.id;

// Reserved words may not be enrolled.

        if (syntax[id] !== undefined && id !== "ignore") {
            warn("reserved_a", name);
        } else {

// Has the name been enrolled in this context?

            var earlier = functionage.context[id];
            if (earlier) {
                warn(
                    "redefinition_a_b",
                    name,
                    name.id,
                    earlier.line + fudge
                );

// Has the name been enrolled in an outer context?

            } else {
                stack.forEach(function (value) {
                    var item = value.context[id];
                    if (item !== undefined) {
                        earlier = item;
                    }
                });
                if (earlier) {
                    if (id === "ignore") {
                        if (earlier.role === "variable") {
                            warn("unexpected_a", name);
                        }
                    } else {
                        if ((
                            role !== "exception" ||
                            earlier.role !== "exception"
                        ) && role !== "parameter") {
                            warn(
                                "redefinition_a_b",
                                name,
                                name.id,
                                earlier.line + fudge
                            );
                        }
                    }
                }

// Enroll it.

                functionage.context[id] = name;
                name.dead = true;
                name.function = functionage;
                name.init = false;
                name.role = role;
                name.used = 0;
                name.writable = !readonly;
            }
        }
    }

    function expression(rbp, initial) {

// This is the heart of the Pratt parser. I retained Pratt's nomenclature.
// They are elements of the parsing method called Top Down Operator Precedence.

// nud     Null denotation
// led     Left denotation
// lbp     Left binding power
// rbp     Right binding power

// It processes a nud (variable, constant, prefix operator). It will then
// process leds (infix operators) until the bind powers cause it to stop. It
// returns the expression's parse tree.

        var left;
        var the_symbol;

// Statements will have already advanced, so advance now only if the token is
// not the first of a statement,

        if (!initial) {
            advance();
        }
        the_symbol = syntax[token.id];
        if (the_symbol !== undefined && the_symbol.nud !== undefined) {
            left = the_symbol.nud();
        } else if (token.identifier) {
            left = token;
            left.arity = "variable";
        } else {
            return stop("unexpected_a", token);
        }
        (function right() {
            the_symbol = syntax[next_token.id];
            if (
                the_symbol !== undefined &&
                the_symbol.led !== undefined &&
                rbp < the_symbol.lbp
            ) {
                advance();
                left = the_symbol.led(left);
                return right();
            }
        }());
        return left;
    }

    function condition() {

// Parse the condition part of a do, if, while.

        var the_paren = next_token;
        var the_value;
        the_paren.free = true;
        advance("(");
        the_value = expression(0);
        advance(")");
        if (the_value.wrapped === true) {
            warn("unexpected_a", the_paren);
        }
        switch (the_value.id) {
        case "?":
        case "~":
        case "&":
        case "|":
        case "^":
        case "<<":
        case ">>":
        case ">>>":
        case "+":
        case "-":
        case "*":
        case "/":
        case "%":
        case "typeof":
        case "(number)":
        case "(string)":
            warn("unexpected_a", the_value);
            break;
        }
        return the_value;
    }

    function is_weird(thing) {
        return (
            thing.id === "(regexp)" ||
            thing.id === "{" ||
            thing.id === "=>" ||
            thing.id === "function" ||
            (thing.id === "[" && thing.arity === "unary")
        );
    }

    function are_similar(a, b) {
        if (a === b) {
            return true;
        }
        if (Array.isArray(a)) {
            return (
                Array.isArray(b) &&
                a.length === b.length &&
                a.every(function (value, index) {
                    return are_similar(value, b[index]);
                })
            );
        }
        if (Array.isArray(b)) {
            return false;
        }
        if (a.id === "(number)" && b.id === "(number)") {
            return a.value === b.value;
        }
        var a_string;
        var b_string;
        if (a.id === "(string)") {
            a_string = a.value;
        } else if (a.id === "`" && a.constant) {
            a_string = a.value[0];
        }
        if (b.id === "(string)") {
            b_string = b.value;
        } else if (b.id === "`" && b.constant) {
            b_string = b.value[0];
        }
        if (typeof a_string === "string") {
            return a_string === b_string;
        }
        if (is_weird(a) || is_weird(b)) {
            return false;
        }
        if (a.arity === b.arity && a.id === b.id) {
            if (a.id === ".") {
                return are_similar(a.expression, b.expression) &&
                        are_similar(a.name, b.name);
            }
            switch (a.arity) {
            case "unary":
                return are_similar(a.expression, b.expression);
            case "binary":
                return (
                    a.id !== "(" &&
                    are_similar(a.expression[0], b.expression[0]) &&
                    are_similar(a.expression[1], b.expression[1])
                );
            case "ternary":
                return (
                    are_similar(a.expression[0], b.expression[0]) &&
                    are_similar(a.expression[1], b.expression[1]) &&
                    are_similar(a.expression[2], b.expression[2])
                );
            case "function":
            case "regexp":
                return false;
            default:
                return true;
            }
        }
        return false;
    }

    function semicolon() {

// Try to match a semicolon.

        if (next_token.id === ";") {
            advance(";");
        } else {
            warn_at(
                "expected_a_b",
                token.line,
                token.thru,
                ";",
                artifact(next_token)
            );
        }
        anon = "anonymous";
    }

    function statement() {

// Parse a statement. Any statement may have a label, but only four statements
// have use for one. A statement can be one of the standard statements, or
// an assignment expression, or an invocation expression.

        var first;
        var the_label;
        var the_statement;
        var the_symbol;
        advance();
        if (token.identifier && next_token.id === ":") {
            the_label = token;
            if (the_label.id === "ignore") {
                warn("unexpected_a", the_label);
            }
            advance(":");
            switch (next_token.id) {
            case "do":
            case "for":
            case "switch":
            case "while":
                enroll(the_label, "label", true);
                the_label.init = true;
                the_label.dead = false;
                the_statement = statement();
                the_statement.label = the_label;
                the_statement.statement = true;
                return the_statement;
            default:
                advance();
                warn("unexpected_label_a", the_label);
            }
        }

// Parse the statement.

        first = token;
        first.statement = true;
        the_symbol = syntax[first.id];
        if (the_symbol !== undefined && the_symbol.fud !== undefined) {
            the_symbol.disrupt = false;
            the_symbol.statement = true;
            the_statement = the_symbol.fud();
        } else {

// It is an expression statement.

            the_statement = expression(0, true);
            if (the_statement.wrapped && the_statement.id !== "(") {
                warn("unexpected_a", first);
            }
            semicolon();
        }
        if (the_label !== undefined) {
            the_label.dead = true;
        }
        return the_statement;
    }

    function statements() {

// Parse a list of statements. Give a warning if an unreachable statement
// follows a disruptive statement.

        var array = [];
        (function next(disrupt) {
            var a_statement;
            switch (next_token.id) {
            case "}":
            case "case":
            case "default":
            case "else":
            case "(end)":
                break;
            default:
                a_statement = statement();
                array.push(a_statement);
                if (disrupt) {
                    warn("unreachable_a", a_statement);
                }
                return next(a_statement.disrupt);
            }
        }(false));
        return array;
    }

    function not_top_level(thing) {

// Some features should not be at the outermost level.

        if (functionage === global) {
            warn("unexpected_at_top_level_a", thing);
        }
    }

    function top_level_only(the_thing) {

// Some features must be at the most outermost level.

        if (blockage !== global) {
            warn("misplaced_a", the_thing);
        }
    }

    function block(special) {

// Parse a block, a sequence of statements wrapped in braces.
//  special "body"      The block is a function body.
//          "ignore"    No warning on an empty block.
//          "naked"     No advance.
//          undefined   Not special.

        var stmts;
        var the_block;
        if (special !== "naked") {
            advance("{");
        }
        the_block = token;
        the_block.arity = "statement";
        the_block.body = special === "body";

// All top level function bodies should include the "use strict" pragma unless
// the whole file is strict or the file is a module.

        if (the_block.body && stack.length <= 1 && !global.strict) {
            if (
                next_token.id === "(string)" ||
                next_token.value === "use strict"
            ) {
                next_token.statement = true;
                functionage.strict = true;
                advance("(string)");
                advance(";");
            } else if (module_mode !== true) {
                warn(
                    "expected_a_before_b",
                    next_token,
                    " \"use strict\"; ",
                    artifact(next_token)
                );
            }
        }
        stmts = statements();
        the_block.block = stmts;
        if (stmts.length === 0) {
            if (!option.devel && special !== "ignore") {
                warn("empty_block", the_block);
            }
            the_block.disrupt = false;
        } else {
            the_block.disrupt = stmts[stmts.length - 1].disrupt;
        }
        advance("}");
        return the_block;
    }

    function mutation_check(the_thing) {

// The only expressions that may be assigned to are
//      e.b
//      e[b]
//      v

        if (
            the_thing.id !== "." &&
            (the_thing.id !== "[" || the_thing.arity !== "binary") &&
            the_thing.arity !== "variable"
        ) {
            warn("bad_assignment_a", the_thing);
            return false;
        }
        return true;
    }

    function left_check(left, right) {

// Warn if the left is not one of these:
//      e.b
//      e[b]
//      e()
//      identifier

        var id = left.id;
        if (
            !left.identifier &&
            (
                left.arity !== "binary" ||
                (id !== "." && id !== "(" && id !== "[")
            )
        ) {
            warn("unexpected_a", right);
            return false;
        }
        return true;
    }

// These functions are used to specify the grammar of our language:

    function symbol(id, bp) {

// Make a symbol if it does not already exist in the language's syntax.

        var the_symbol = syntax[id];
        if (the_symbol === undefined) {
            the_symbol = empty();
            the_symbol.id = id;
            the_symbol.lbp = bp || 0;
            syntax[id] = the_symbol;
        }
        return the_symbol;
    }

    function assignment(id) {

// Make an assignment operator. The one true assignment is different because
// its left side, when it is a variable, is not treated as an expression.
// That case is special because that is when a variable gets initialized. The
// other assignment operators can modify, but they cannot initialize.

        var the_symbol = symbol(id, 20);
        the_symbol.led = function (left) {
            var the_token = token;
            var right;
            the_token.arity = "assignment";
            right = expression(20 - 1);
            if (id === "=" && left.arity === "variable") {
                the_token.names = left;
                the_token.expression = right;
            } else {
                the_token.expression = [left, right];
            }
            switch (right.arity) {
            case "assignment":
            case "pre":
            case "post":
                warn("unexpected_a", right);
                break;
            }
            if (
                option.es6 &&
                left.arity === "unary" &&
                (left.id === "[" || left.id === "{")
            ) {
                warn("expected_a_before_b", left, "const", left.id);
            } else {
                mutation_check(left);
            }
            return the_token;
        };
        return the_symbol;
    }

    function constant(id, type, value) {

// Make a constant symbol.

        var the_symbol = symbol(id);
        the_symbol.constant = true;
        the_symbol.nud = (typeof value === "function")
            ? value
            : function () {
                token.constant = true;
                if (value !== undefined) {
                    token.value = value;
                }
                return token;
            };
        the_symbol.type = type;
        the_symbol.value = value;
        return the_symbol;
    }

    function infix(id, bp, f) {

// Make an infix operator.

        var the_symbol = symbol(id, bp);
        the_symbol.led = function (left) {
            var the_token = token;
            the_token.arity = "binary";
            if (f !== undefined) {
                return f(left);
            }
            the_token.expression = [left, expression(bp)];
            return the_token;
        };
        return the_symbol;
    }

    function post(id) {

// Make one of the post operators.

        var the_symbol = symbol(id, 150);
        the_symbol.led = function (left) {
            token.expression = left;
            token.arity = "post";
            mutation_check(token.expression);
            return token;
        };
        return the_symbol;
    }

    function pre(id) {

// Make one of the pre operators.

        var the_symbol = symbol(id);
        the_symbol.nud = function () {
            var the_token = token;
            the_token.arity = "pre";
            the_token.expression = expression(150);
            mutation_check(the_token.expression);
            return the_token;
        };
        return the_symbol;
    }

    function prefix(id, f) {

// Make a prefix operator.

        var the_symbol = symbol(id);
        the_symbol.nud = function () {
            var the_token = token;
            the_token.arity = "unary";
            if (typeof f === "function") {
                return f();
            }
            the_token.expression = expression(150);
            return the_token;
        };
        return the_symbol;
    }

    function stmt(id, f) {

// Make a statement.

        var the_symbol = symbol(id);
        the_symbol.fud = function () {
            token.arity = "statement";
            return f();
        };
        return the_symbol;
    }

    function ternary(id1, id2) {

// Make a ternary operator.

        var the_symbol = symbol(id1, 30);
        the_symbol.led = function (left) {
            var the_token = token;
            var second = expression(20);
            advance(id2);
            token.arity = "ternary";
            the_token.arity = "ternary";
            the_token.expression = [left, second, expression(10)];
            return the_token;
        };
        return the_symbol;
    }

// Begin defining the language.

    syntax = empty();

    symbol("}");
    symbol(")");
    symbol("]");
    symbol(",");
    symbol(";");
    symbol(":");
    symbol("*/");
    symbol("await");
    symbol("case");
    symbol("catch");
    symbol("class");
    symbol("default");
    symbol("else");
    symbol("enum");
    symbol("finally");
    symbol("implements");
    symbol("interface");
    symbol("package");
    symbol("private");
    symbol("protected");
    symbol("public");
    symbol("static");
    symbol("super");
    symbol("void");
    symbol("yield");

    constant("(number)", "number");
    constant("(regexp)", "regexp");
    constant("(string)", "string");
    constant("arguments", "object", function () {
        if (option.es6) {
            warn("unexpected_a", token);
        }
        return token;
    });
    constant("eval", "function", function () {
        if (!option.eval) {
            warn("unexpected_a", token);
        } else if (next_token.id !== "(") {
            warn("expected_a_before_b", next_token, "(", artifact());
        }
        return token;
    });
    constant("false", "boolean", false);
    constant("Function", "function", function () {
        if (!option.eval) {
            warn("unexpected_a", token);
        } else if (next_token.id !== "(") {
            warn("expected_a_before_b", next_token, "(", artifact());
        }
        return token;
    });
    constant("ignore", "undefined", function () {
        warn("unexpected_a", token);
        return token;
    });
    constant("Infinity", "number", Infinity);
    constant("isNaN", "function", function () {
        if (option.es6) {
            warn("expected_a_b", token, "Number.isNaN", "isNaN");
        }
        return token;
    });
    constant("NaN", "number", NaN);
    constant("null", "null", null);
    constant("this", "object", function () {
        if (!option.this) {
            warn("unexpected_a", token);
        }
        return token;
    });
    constant("true", "boolean", true);
    constant("undefined", "undefined");

    assignment("=");
    assignment("+=");
    assignment("-=");
    assignment("*=");
    assignment("/=");
    assignment("%=");
    assignment("&=");
    assignment("|=");
    assignment("^=");
    assignment("<<=");
    assignment(">>=");
    assignment(">>>=");

    infix("||", 40);
    infix("&&", 50);
    infix("|", 70);
    infix("^", 80);
    infix("&", 90);
    infix("==", 100);
    infix("===", 100);
    infix("!=", 100);
    infix("!==", 100);
    infix("<", 110);
    infix(">", 110);
    infix("<=", 110);
    infix(">=", 110);
    infix("in", 110);
    infix("instanceof", 110);
    infix("<<", 120);
    infix(">>", 120);
    infix(">>>", 120);
    infix("+", 130);
    infix("-", 130);
    infix("*", 140);
    infix("/", 140);
    infix("%", 140);
    infix("(", 160, function (left) {
        var the_paren = token;
        var the_argument;
        if (left.id !== "function") {
            left_check(left, the_paren);
        }
        if (functionage.arity === "statement" && left.identifier) {
            functionage.name.calls[left.id] = left;
        }
        the_paren.expression = [left];
        if (next_token.id !== ")") {
            (function next() {
                var ellipsis;
                if (next_token.id === "...") {
                    if (!option.es6) {
                        warn("es6");
                    }
                    ellipsis = true;
                    advance("...");
                }
                the_argument = expression(10);
                if (ellipsis) {
                    the_argument.ellipsis = true;
                }
                the_paren.expression.push(the_argument);
                if (next_token.id === ",") {
                    advance(",");
                    return next();
                }
            }());
        }
        advance(")", the_paren);
        if (the_paren.expression.length === 2) {
            the_paren.free = true;
            if (the_argument.wrapped === true) {
                warn("unexpected_a", the_paren);
            }
            if (the_argument.id === "(") {
                the_argument.wrapped = true;
            }
        } else {
            the_paren.free = false;
        }
        return the_paren;
    });
    infix(".", 170, function (left) {
        var the_token = token;
        var name = next_token;
        if (
            (left.id !== "(string)" || name.id !== "indexOf") &&
            (left.id !== "[" || (
                name.id !== "concat" && name.id !== "forEach"
            )) &&
            (left.id !== "+" || name.id !== "slice") &&
            (left.id !== "(regexp)" || (
                name.id !== "exec" && name.id !== "test"
            ))
        ) {
            left_check(left, the_token);
        }
        if (!name.identifier) {
            stop("expected_identifier_a");
        }
        advance();
        survey(name);

// The property name is not an expression.

        the_token.name = name;
        the_token.expression = left;
        return the_token;
    });
    infix("[", 170, function (left) {
        var the_token = token;
        var the_subscript = expression(0);
        if (the_subscript.id === "(string)" || the_subscript.id === "`") {
            var name = survey(the_subscript);
            if (rx_identifier.test(name)) {
                warn("subscript_a", the_subscript, name);
            }
        }
        left_check(left, the_token);
        the_token.expression = [left, the_subscript];
        advance("]");
        return the_token;
    });
    infix("=>", 170, function (left) {
        return stop("wrap_parameter", left);
    });

    function do_tick() {
        var the_tick = token;
        if (!option.es6) {
            warn("es6", the_tick);
        }
        the_tick.value = [];
        the_tick.expression = [];
        if (next_token.id !== "`") {
            (function part() {
                advance("(string)");
                the_tick.value.push(token);
                if (next_token.id === "${") {
                    advance("${");
                    the_tick.expression.push(expression(0));
                    advance("}");
                    return part();
                }
            }());
        }
        advance("`");
        return the_tick;
    }

    infix("`", 160, function (left) {
        var the_tick = do_tick();
        left_check(left, the_tick);
        the_tick.expression = [left].concat(the_tick.expression);
        return the_tick;
    });

    post("++");
    post("--");
    pre("++");
    pre("--");

    prefix("+");
    prefix("-");
    prefix("~");
    prefix("!");
    prefix("!!");
    prefix("[", function () {
        var the_token = token;
        the_token.expression = [];
        if (next_token.id !== "]") {
            (function next() {
                var element;
                var ellipsis = false;
                if (next_token.id === "...") {
                    ellipsis = true;
                    if (!option.es6) {
                        warn("es6");
                    }
                    advance("...");
                }
                element = expression(10);
                if (ellipsis) {
                    element.ellipsis = true;
                }
                the_token.expression.push(element);
                if (next_token.id === ",") {
                    advance(",");
                    return next();
                }
            }());
        }
        advance("]");
        return the_token;
    });
    prefix("/=", function () {
        stop("expected_a_b", token, "/\\=", "/=");
    });
    prefix("=>", function () {
        return stop("expected_a_before_b", token, "()", "=>");
    });
    prefix("new", function () {
        var the_new = token;
        var right = expression(160);
        if (next_token.id !== "(") {
            warn("expected_a_before_b", next_token, "()", artifact(next_token));
        }
        the_new.expression = right;
        return the_new;
    });
    prefix("typeof");
    prefix("void", function () {
        var the_void = token;
        warn("unexpected_a", the_void);
        the_void.expression = expression(0);
        return the_void;
    });

    function parameter(list, signature) {
        var ellipsis = false;
        var param;
        if (next_token.id === "{") {
            if (!option.es6) {
                warn("es6");
            }
            param = next_token;
            param.names = [];
            advance("{");
            signature.push("{");
            (function subparameter() {
                var subparam = next_token;
                if (!subparam.identifier) {
                    return stop("expected_identifier_a");
                }
                survey(subparam);
                advance();
                signature.push(subparam.id);
                if (next_token.id === ":") {
                    advance(":");
                    advance();
                    token.label = subparam;
                    subparam = token;
                    if (!subparam.identifier) {
                        return stop("expected_identifier_a");
                    }
                }
                param.names.push(subparam);
                if (next_token.id === ",") {
                    advance(",");
                    signature.push(", ");
                    return subparameter();
                }
            }());
            list.push(param);
            advance("}");
            signature.push("}");
            if (next_token.id === ",") {
                advance(",");
                signature.push(", ");
                return parameter(list, signature);
            }
        } else if (next_token.id === "[") {
            if (!option.es6) {
                warn("es6");
            }
            param = next_token;
            param.names = [];
            advance("[");
            signature.push("[]");
            (function subparameter() {
                var subparam = next_token;
                if (!subparam.identifier) {
                    return stop("expected_identifier_a");
                }
                advance();
                param.names.push(subparam);
                if (next_token.id === ",") {
                    advance(",");
                    return subparameter();
                }
            }());
            list.push(param);
            advance("]");
            if (next_token.id === ",") {
                advance(",");
                signature.push(", ");
                return parameter(list, signature);
            }
        } else {
            if (next_token.id === "...") {
                if (!option.es6) {
                    warn("es6");
                }
                ellipsis = true;
                signature.push("...");
                advance("...");
            }
            if (!next_token.identifier) {
                return stop("expected_identifier_a");
            }
            param = next_token;
            list.push(param);
            advance();
            signature.push(param.id);
            if (ellipsis) {
                param.ellipsis = true;
            } else {
                if (next_token.id === "=") {
                    if (!option.es6) {
                        warn("es6");
                    }
                    advance("=");
                    param.expression = expression(0);
                }
                if (next_token.id === ",") {
                    advance(",");
                    signature.push(", ");
                    return parameter(list, signature);
                }
            }
        }
    }

    function parameter_list() {
        var list = [];
        var signature = ["("];
        if (next_token.id !== ")" && next_token.id !== "(end)") {
            parameter(list, signature);
        }
        advance(")");
        signature.push(")");
        return [list, signature.join("")];
    }

    function do_function(the_function) {
        var name;
        if (the_function === undefined) {
            the_function = token;

// A function statement must have a name that will be in the parent's scope.

            if (the_function.arity === "statement") {
                if (!next_token.identifier) {
                    return stop("expected_identifier_a", next_token);
                }
                name = next_token;
                enroll(name, "variable", true);
                the_function.name = name;
                name.init = true;
                name.calls = empty();
                advance();
            } else if (name === undefined) {

// A function expression may have an optional name.

                if (next_token.identifier) {
                    name = next_token;
                    the_function.name = name;
                    advance();
                } else {
                    the_function.name = anon;
                }
            }
        } else {
            name = the_function.name;
        }
        the_function.level = functionage.level + 1;
        if (mega_mode) {
            warn("unexpected_a", the_function);
        }

// Don't make functions in loops. It is inefficient, and it can lead to scoping
// errors.

        if (functionage.loop > 0) {
            warn("function_in_loop", the_function);
        }

// Give the function properties for storing its names and for observing the
// depth of loops and switches.

        the_function.context = empty();
        the_function.loop = 0;
        the_function.switch = 0;

// Push the current function context and establish a new one.

        stack.push(functionage);
        functions.push(the_function);
        functionage = the_function;
        if (the_function.arity !== "statement" && name) {
            enroll(name, "function", true);
            name.dead = false;
            name.init = true;
            name.used = 1;
        }

// Parse the parameter list.

        advance("(");
        token.free = false;
        token.arity = "function";
        var pl = parameter_list();
        functionage.parameters = pl[0];
        functionage.signature = pl[1];
        functionage.parameters.forEach(function enroll_parameter(name) {
            if (name.identifier) {
                enroll(name, "parameter", false);
            } else {
                name.names.forEach(enroll_parameter);
            }
        });

// The function's body is a block.

        the_function.block = block("body");
        if (
            the_function.arity === "statement" &&
            next_token.line === token.line
        ) {
            return stop("unexpected_a", next_token);
        }
        if (next_token.id === "." || next_token.id === "[") {
            warn("unexpected_a");
        }

// Restore the previous context.

        functionage = stack.pop();
        return the_function;
    }

    prefix("function", do_function);

    function fart(pl) {
        if (next_token.id === ";") {
            stop("wrap_assignment", token);
        }
        advance("=>");
        var the_arrow = token;
        the_arrow.arity = "binary";
        the_arrow.name = "=>";
        the_arrow.level = functionage.level + 1;
        functions.push(the_arrow);
        if (functionage.loop > 0) {
            warn("function_in_loop", the_arrow);
        }

// Give the function properties storing its names and for observing the depth
// of loops and switches.

        the_arrow.context = empty();
        the_arrow.loop = 0;
        the_arrow.switch = 0;

// Push the current function context and establish a new one.

        stack.push(functionage);
        functionage = the_arrow;
        the_arrow.parameters = pl[0];
        the_arrow.signature = pl[1];
        the_arrow.parameters.forEach(function (name) {
            enroll(name, "parameter", true);
        });
        if (!option.es6) {
            warn("es6", the_arrow);
        }
        if (next_token.id === "{") {
            warn("expected_a_b", the_arrow, "function", "=>");
            the_arrow.block = block("body");
        } else {
            the_arrow.expression = expression(0);
        }
        functionage = stack.pop();
        return the_arrow;
    }

    prefix("(", function () {
        var the_paren = token;
        var the_value;
        var cadet = lookahead().id;

// We can distinguish between a parameter list for => and a wrapped expression
// with one token of lookahead.

        if (
            next_token.id === ")" ||
            next_token.id === "..." ||
            (next_token.identifier && (cadet === "," || cadet === "="))
        ) {
            the_paren.free = false;
            return fart(parameter_list());
        }
        the_paren.free = true;
        the_value = expression(0);
        if (the_value.wrapped === true) {
            warn("unexpected_a", the_paren);
        }
        the_value.wrapped = true;
        advance(")", the_paren);
        if (next_token.id === "=>") {
            if (the_value.arity !== "variable") {
                if (the_value.id === "{" || the_value.id === "[") {
                    warn("expected_a_before_b", the_paren, "function", "(");
                    return stop("expected_a_b", next_token, "{", "=>");
                }
                return stop("expected_identifier_a", the_value);
            }
            the_paren.expression = [the_value];
            return fart([the_paren.expression, "(" + the_value.id + ")"]);
        }
        return the_value;
    });
    prefix("`", do_tick);
    prefix("{", function () {
        var the_brace = token;
        var seen = empty();
        the_brace.expression = [];
        if (next_token.id !== "}") {
            (function member() {
                var extra = true;
                var id;
                var name = next_token;
                var value;
                advance();
                if (
                    (name.id === "get" || name.id === "set") &&
                    next_token.identifier
                ) {
                    extra = name.id;
                    name = next_token;
                    advance();
                }
                id = survey(name);
                if (seen[id] === true) {
                    warn("duplicate_a", name);
                } else if (seen[id] === "get" && extra !== "set") {
                    warn("expected_a_before_b", name, "set", artifact(name));
                }
                seen[id] = (extra === "get")
                    ? "get"
                    : true;
                if (name.identifier) {
                    switch (next_token.id) {
                    case "}":
                    case ",":
                        if (!option.es6) {
                            warn("es6");
                        } else if (extra !== true) {
                            advance(":");
                        }
                        value = expression(Infinity, true);
                        break;
                    case "(":
                        if (!option.es6 && typeof extra !== "string") {
                            warn("es6");
                        }
                        value = do_function({
                            arity: "unary",
                            from: name.from,
                            id: "function",
                            line: name.line,
                            name: name,
                            thru: name.from
                        }, name);
                        break;
                    default:
                        advance(":");
                        value = expression(0);
                    }
                    value.label = name;
                    if (typeof extra === "string") {
                        value.extra = extra;
                    }
                    the_brace.expression.push(value);
                } else {
                    advance(":");
                    value = expression(0);
                    value.label = name;
                    the_brace.expression.push(value);
                }
                if (next_token.id === ",") {
                    advance(",");
                    return member();
                }
            }());
        }
        advance("}");
        return the_brace;
    });

    stmt(";", function () {
        warn("unexpected_a", token);
        return token;
    });
    stmt("{", function () {
        warn("naked_block", token);
        return block("naked");
    });
    stmt("break", function () {
        var the_break = token;
        var the_label;
        if (functionage.loop < 1 && functionage.switch < 1) {
            warn("unexpected_a", the_break);
        }
        the_break.disrupt = true;
        if (next_token.identifier && token.line === next_token.line) {
            the_label = functionage.context[next_token.id];
            if (
                the_label === undefined ||
                the_label.role !== "label" ||
                the_label.dead
            ) {
                warn((the_label !== undefined && the_label.dead)
                    ? "out_of_scope_a"
                    : "not_label_a");
            } else {
                the_label.used += 1;
            }
            the_break.label = next_token;
            advance();
        }
        advance(";");
        return the_break;
    });

    function do_var() {
        var the_statement = token;
        var is_const = the_statement.id === "const";
        the_statement.names = [];

// A program may use var or let, but not both, and let and const require
// option.es6.

        if (is_const) {
            if (!option.es6) {
                warn("es6", the_statement);
            }
        } else if (var_mode === undefined) {
            var_mode = the_statement.id;
            if (!option.es6 && var_mode !== "var") {
                warn("es6", the_statement);
            }
        } else if (the_statement.id !== var_mode) {
            warn(
                "expected_a_b",
                the_statement,
                var_mode,
                the_statement.id
            );
        }

// We don't expect to see variables created in switch statements.

        if (functionage.switch > 0) {
            warn("var_switch", the_statement);
        }
        if (functionage.loop > 0 && the_statement.id === "var") {
            warn("var_loop", the_statement);
        }
        (function next() {
            if (next_token.id === "{" && the_statement.id !== "var") {
                var the_brace = next_token;
                the_brace.names = [];
                advance("{");
                (function pair() {
                    if (!next_token.identifier) {
                        return stop("expected_identifier_a", next_token);
                    }
                    var name = next_token;
                    survey(name);
                    advance();
                    if (next_token.id === ":") {
                        advance(":");
                        if (!next_token.identifier) {
                            return stop("expected_identifier_a", next_token);
                        }
                        next_token.label = name;
                        the_brace.names.push(next_token);
                        enroll(next_token, "variable", is_const);
                        advance();
                    } else {
                        the_brace.names.push(name);
                        enroll(name, "variable", is_const);
                    }
                    if (next_token.id === ",") {
                        advance(",");
                        return pair();
                    }
                }());
                advance("}");
                advance("=");
                the_brace.expression = expression(0);
                the_statement.names.push(the_brace);
            } else if (next_token.id === "[" && the_statement.id !== "var") {
                var the_bracket = next_token;
                the_bracket.names = [];
                advance("[");
                (function element() {
                    var ellipsis;
                    if (next_token.id === "...") {
                        ellipsis = true;
                        advance("...");
                    }
                    if (!next_token.identifier) {
                        return stop("expected_identifier_a", next_token);
                    }
                    var name = next_token;
                    advance();
                    the_bracket.names.push(name);
                    enroll(name, "variable", the_statement.id === "const");
                    if (ellipsis) {
                        name.ellipsis = true;
                    } else if (next_token.id === ",") {
                        advance(",");
                        return element();
                    }
                }());
                advance("]");
                advance("=");
                the_bracket.expression = expression(0);
                the_statement.names.push(the_bracket);
            } else if (next_token.identifier) {
                var name = next_token;
                advance();
                if (name.id === "ignore") {
                    warn("unexpected_a", name);
                }
                enroll(name, "variable", is_const);
                if (next_token.id === "=" || is_const) {
                    advance("=");
                    name.expression = expression(0);
                    name.init = true;
                }
                the_statement.names.push(name);
            } else {
                return stop("expected_identifier_a", next_token);
            }
            if (next_token.id === ",") {
                if (!option.multivar) {
                    warn("expected_a_b", next_token, ";", ",");
                }
                advance(",");
                return next();
            }
        }());
        the_statement.open =
                the_statement.names.length > 1 &&
                the_statement.line !== the_statement.names[1].line;
        semicolon();
        return the_statement;
    }

    stmt("const", do_var);
    stmt("continue", function () {
        var the_continue = token;
        if (functionage.loop < 1) {
            warn("unexpected_a", the_continue);
        }
        not_top_level(the_continue);
        the_continue.disrupt = true;
        warn("unexpected_a", the_continue);
        advance(";");
        return the_continue;
    });
    stmt("debugger", function () {
        var the_debug = token;
        if (!option.devel) {
            warn("unexpected_a", the_debug);
        }
        semicolon();
        return the_debug;
    });
    stmt("delete", function () {
        var the_token = token;
        var the_value = expression(0);
        if (
            (the_value.id !== "." && the_value.id !== "[") ||
            the_value.arity !== "binary"
        ) {
            stop("expected_a_b", the_value, ".", artifact(the_value));
        }
        the_token.expression = the_value;
        semicolon();
        return the_token;
    });
    stmt("do", function () {
        var the_do = token;
        not_top_level(the_do);
        functionage.loop += 1;
        the_do.block = block();
        advance("while");
        the_do.expression = condition();
        semicolon();
        if (the_do.block.disrupt === true) {
            warn("weird_loop", the_do);
        }
        functionage.loop -= 1;
        return the_do;
    });
    stmt("export", function () {
        var the_export = token;
        if (!option.es6) {
            warn("es6", the_export);
        }
        if (typeof module_mode === "object") {
            warn("unexpected_directive_a", module_mode, module_mode.directive);
        }
        advance("default");
        if (export_mode) {
            warn("duplicate_a", token);
        }
        global.strict = true;
        module_mode = true;
        export_mode = true;
        the_export.expression = expression(0);
        semicolon();
        return the_export;
    });
    stmt("for", function () {
        var first;
        var the_for = token;
        if (!option.for) {
            warn("unexpected_a", the_for);
        }
        not_top_level(the_for);
        functionage.loop += 1;
        advance("(");
        token.free = true;
        if (next_token.id === ";") {
            return stop("expected_a_b", the_for, "while (", "for (;");
        }
        if (
            next_token.id === "var" ||
            next_token.id === "let" ||
            next_token.id === "const"
        ) {
            return stop("unexpected_a");
        }
        first = expression(0);
        if (first.id === "in") {
            if (first.expression[0].arity !== "variable") {
                warn("bad_assignment_a", first.expression[0]);
            }
            the_for.name = first.expression[0];
            the_for.expression = first.expression[1];
            warn("expected_a_b", the_for, "Object.keys", "for in");
        } else {
            the_for.initial = first;
            advance(";");
            the_for.expression = expression(0);
            advance(";");
            the_for.inc = expression(0);
            if (the_for.inc.id === "++") {
                warn("expected_a_b", the_for.inc, "+= 1", "++");
            }
        }
        advance(")");
        the_for.block = block();
        if (the_for.block.disrupt === true) {
            warn("weird_loop", the_for);
        }
        functionage.loop -= 1;
        return the_for;
    });
    stmt("function", do_function);
    stmt("if", function () {
        var the_else;
        var the_if = token;
        the_if.expression = condition();
        the_if.block = block();
        if (next_token.id === "else") {
            advance("else");
            the_else = token;
            the_if.else = (next_token.id === "if")
                ? statement()
                : block();
            if (the_if.block.disrupt === true) {
                if (the_if.else.disrupt === true) {
                    the_if.disrupt = true;
                } else {
                    warn("unexpected_a", the_else);
                }
            }
        }
        return the_if;
    });
    stmt("import", function () {
        var the_import = token;
        var name;
        if (!option.es6) {
            warn("es6", the_import);
        } else if (typeof module_mode === "object") {
            warn("unexpected_directive_a", module_mode, module_mode.directive);
        }
        module_mode = true;
        if (next_token.identifier) {
            name = next_token;
            advance();
            if (name.id === "ignore") {
                warn("unexpected_a", name);
            }
            enroll(name, "variable", true);
            the_import.name = name;
        } else {
            var names = [];
            advance("{");
            if (next_token.id !== "}") {
                while (true) {
                    if (!next_token.identifier) {
                        stop("expected_identifier_a");
                    }
                    name = next_token;
                    advance();
                    if (name.id === "ignore") {
                        warn("unexpected_a", name);
                    }
                    enroll(name, "variable", true);
                    names.push(name);
                    if (next_token.id !== ",") {
                        break;
                    }
                    advance(",");
                }
            }
            advance("}");
            the_import.name = names;
        }
        advance("from");
        advance("(string)");
        the_import.import = token;
        if (!rx_module.test(token.value)) {
            warn("bad_module_name_a", token);
        }
        imports.push(token.value);
        semicolon();
        return the_import;
    });
    stmt("let", do_var);
    stmt("return", function () {
        var the_return = token;
        not_top_level(the_return);
        the_return.disrupt = true;
        if (next_token.id !== ";" && the_return.line === next_token.line) {
            the_return.expression = expression(10);
        }
        advance(";");
        return the_return;
    });
    stmt("switch", function () {
        var dups = [];
        var last;
        var stmts;
        var the_cases = [];
        var the_disrupt = true;
        var the_switch = token;
        not_top_level(the_switch);
        functionage.switch += 1;
        advance("(");
        token.free = true;
        the_switch.expression = expression(0);
        the_switch.block = the_cases;
        advance(")");
        advance("{");
        (function major() {
            var the_case = next_token;
            the_case.arity = "statement";
            the_case.expression = [];
            (function minor() {
                advance("case");
                token.switch = true;
                var exp = expression(0);
                if (dups.some(function (thing) {
                    return are_similar(thing, exp);
                })) {
                    warn("unexpected_a", exp);
                }
                dups.push(exp);
                the_case.expression.push(exp);
                advance(":");
                if (next_token.id === "case") {
                    return minor();
                }
            }());
            stmts = statements();
            if (stmts.length < 1) {
                warn("expected_statements_a");
                return;
            }
            the_case.block = stmts;
            the_cases.push(the_case);
            last = stmts[stmts.length - 1];
            if (last.disrupt) {
                if (last.id === "break" && last.label === undefined) {
                    the_disrupt = false;
                }
            } else {
                warn(
                    "expected_a_before_b",
                    next_token,
                    "break;",
                    artifact(next_token)
                );
            }
            if (next_token.id === "case") {
                return major();
            }
        }());
        dups = undefined;
        if (next_token.id === "default") {
            var the_default = next_token;
            advance("default");
            token.switch = true;
            advance(":");
            the_switch.else = statements();
            if (the_switch.else.length < 1) {
                warn("unexpected_a", the_default);
                the_disrupt = false;
            } else {
                var the_last = the_switch.else[the_switch.else.length - 1];
                if (the_last.id === "break" && the_last.label === undefined) {
                    warn("unexpected_a", the_last);
                    the_last.disrupt = false;
                }
                the_disrupt = the_disrupt && the_last.disrupt;
            }
        } else {
            the_disrupt = false;
        }
        advance("}", the_switch);
        functionage.switch -= 1;
        the_switch.disrupt = the_disrupt;
        return the_switch;
    });
    stmt("throw", function () {
        var the_throw = token;
        the_throw.disrupt = true;
        the_throw.expression = expression(10);
        semicolon();
        return the_throw;
    });
    stmt("try", function () {
        var clause = false;
        var the_catch;
        var the_disrupt;
        var the_try = token;
        the_try.block = block();
        the_disrupt = the_try.block.disrupt;
        if (next_token.id === "catch") {
            var ignored = "ignore";
            clause = true;
            the_catch = next_token;
            the_try.catch = the_catch;
            advance("catch");
            advance("(");
            if (!next_token.identifier) {
                return stop("expected_identifier_a", next_token);
            }
            if (next_token.id !== "ignore") {
                ignored = undefined;
                the_catch.name = next_token;
                enroll(next_token, "exception", true);
            }
            advance();
            advance(")");
            the_catch.block = block(ignored);
            if (the_catch.block.disrupt !== true) {
                the_disrupt = false;
            }
        }
        if (next_token.id === "finally") {
            clause = true;
            advance("finally");
            the_try.else = block();
            the_disrupt = the_try.else.disrupt;
        }
        the_try.disrupt = the_disrupt;
        if (!clause) {
            warn(
                "expected_a_before_b",
                next_token,
                "catch",
                artifact(next_token)
            );
        }
        return the_try;
    });
    stmt("var", do_var);
    stmt("while", function () {
        var the_while = token;
        not_top_level(the_while);
        functionage.loop += 1;
        the_while.expression = condition();
        the_while.block = block();
        if (the_while.block.disrupt === true) {
            warn("weird_loop", the_while);
        }
        functionage.loop -= 1;
        return the_while;
    });
    stmt("with", function () {
        stop("unexpected_a", token);
    });

    ternary("?", ":");

// Ambulation of the parse tree.

    function action(when) {

// Produce a function that will register task functions that will be called as
// the tree is traversed.

        return function (arity, id, task) {
            var a_set = when[arity];
            var i_set;

// The id parameter is optional. If excluded, the task will be applied to all
// ids.

            if (typeof id !== "string") {
                task = id;
                id = "(all)";
            }

// If this arity has no registrations yet, then create a set object to hold
// them.

            if (a_set === undefined) {
                a_set = empty();
                when[arity] = a_set;
            }

// If this id has no registrations yet, then create a set array to hold them.

            i_set = a_set[id];
            if (i_set === undefined) {
                i_set = [];
                a_set[id] = i_set;
            }

// Register the task with the arity and the id.

            i_set.push(task);
        };
    }

    function amble(when) {

// Produce a function that will act on the tasks registered by an action
// function while walking the tree.

        return function (the_token) {

// Given a task set that was built by an action function, run all of the
// relevant tasks on the token.

            var a_set = when[the_token.arity];
            var i_set;

// If there are tasks associated with the token's arity...

            if (a_set !== undefined) {

// If there are tasks associated with the token's id...

                i_set = a_set[the_token.id];
                if (i_set !== undefined) {
                    i_set.forEach(function (task) {
                        return task(the_token);
                    });
                }

// If there are tasks for all ids.

                i_set = a_set["(all)"];
                if (i_set !== undefined) {
                    i_set.forEach(function (task) {
                        return task(the_token);
                    });
                }
            }
        };
    }

    var posts = empty();
    var pres = empty();
    var preaction = action(pres);
    var postaction = action(posts);
    var preamble = amble(pres);
    var postamble = amble(posts);

    function walk_expression(thing) {
        if (thing) {
            if (Array.isArray(thing)) {
                thing.forEach(walk_expression);
            } else {
                preamble(thing);
                walk_expression(thing.expression);
                if (thing.id === "function") {
                    walk_statement(thing.block);
                }
                switch (thing.arity) {
                case "post":
                case "pre":
                    warn("unexpected_a", thing);
                    break;
                case "statement":
                case "assignment":
                    warn("unexpected_statement_a", thing);
                    break;
                }
                postamble(thing);
            }
        }
    }

    function walk_statement(thing) {
        if (thing) {
            if (Array.isArray(thing)) {
                thing.forEach(walk_statement);
            } else {
                preamble(thing);
                walk_expression(thing.expression);
                switch (thing.arity) {
                case "statement":
                case "assignment":
                    break;
                case "binary":
                    if (thing.id !== "(") {
                        warn("unexpected_expression_a", thing);
                    }
                    break;
                default:
                    warn("unexpected_expression_a", thing);
                }
                walk_statement(thing.block);
                walk_statement(thing.else);
                postamble(thing);
            }
        }
    }

    function lookup(thing) {
        if (thing.arity === "variable") {

// Look up the variable in the current context.

            var the_variable = functionage.context[thing.id];

// If it isn't local, search all the other contexts. If there are name
// collisions, take the most recent.

            if (the_variable === undefined) {
                stack.forEach(function (outer) {
                    var a_variable = outer.context[thing.id];
                    if (
                        a_variable !== undefined &&
                        a_variable.role !== "label"
                    ) {
                        the_variable = a_variable;
                    }
                });

// If it isn't in any of those either, perhaps it is a predefined global.
// If so, add it to the global context.

                if (the_variable === undefined) {
                    if (declared_globals[thing.id] === undefined) {
                        warn("undeclared_a", thing);
                        return;
                    }
                    the_variable = {
                        dead: false,
                        function: global,
                        id: thing.id,
                        init: true,
                        role: "variable",
                        used: 0,
                        writable: false
                    };
                    global.context[thing.id] = the_variable;
                }
                the_variable.closure = true;
                functionage.context[thing.id] = the_variable;
            } else if (the_variable.role === "label") {
                warn("label_a", thing);
            }
            if (the_variable.dead) {
                warn("out_of_scope_a", thing);
            }
            return the_variable;
        }
    }

    function subactivate(name) {
        name.init = true;
        name.dead = false;
        blockage.live.push(name);
    }

    function preaction_function(thing) {
        if (thing.arity === "statement" && blockage.body !== true) {
            warn("unexpected_a", thing);
        }
        stack.push(functionage);
        block_stack.push(blockage);
        functionage = thing;
        blockage = thing;
        thing.live = [];
        if (typeof thing.name === "object") {
            thing.name.dead = false;
            thing.name.init = true;
        }
        switch (thing.extra) {
        case "get":
            if (thing.parameters.length !== 0) {
                warn("bad_get", thing);
            }
            break;
        case "set":
            if (thing.parameters.length !== 1) {
                warn("bad_set", thing);
            }
            break;
        }
        thing.parameters.forEach(function (name) {
            walk_expression(name.expression);
            if (name.id === "{" || name.id === "[") {
                name.names.forEach(subactivate);
            } else {
                name.dead = false;
                name.init = true;
            }
        });
    }

    function bitwise_check(thing) {
        if (!option.bitwise && bitwiseop[thing.id] === true) {
            warn("unexpected_a", thing);
        }
        if (
            thing.id !== "(" &&
            thing.id !== "&&" &&
            thing.id !== "||" &&
            thing.id !== "=" &&
            Array.isArray(thing.expression) &&
            thing.expression.length === 2 && (
                relationop[thing.expression[0].id] === true ||
                relationop[thing.expression[1].id] === true
            )
        ) {
            warn("unexpected_a", thing);
        }
    }

    function pop_block() {
        blockage.live.forEach(function (name) {
            name.dead = true;
        });
        delete blockage.live;
        blockage = block_stack.pop();
    }

    function activate(name) {
        if (name.expression !== undefined) {
            walk_expression(name.expression);
            if (name.id === "{" || name.id === "[") {
                name.names.forEach(subactivate);
            } else {
                name.init = true;
            }
        }
        name.dead = false;
        blockage.live.push(name);
    }

    function action_var(thing) {
        thing.names.forEach(activate);
    }

    preaction("assignment", bitwise_check);
    preaction("binary", bitwise_check);
    preaction("binary", function (thing) {
        if (relationop[thing.id] === true) {
            var left = thing.expression[0];
            var right = thing.expression[1];
            if (left.id === "NaN" || right.id === "NaN") {
                if (option.es6) {
                    warn("number_isNaN", thing);
                } else {
                    warn("isNaN", thing);
                }
            } else if (left.id === "typeof") {
                if (right.id !== "(string)") {
                    if (right.id !== "typeof") {
                        warn("expected_string_a", right);
                    }
                } else {
                    var value = right.value;
                    if (value === "symbol") {
                        if (!option.es6) {
                            warn("es6", right, value);
                        }
                    } else if (value === "null" || value === "undefined") {
                        warn("unexpected_typeof_a", right, value);
                    } else if (
                        value !== "boolean" &&
                        value !== "function" &&
                        value !== "number" &&
                        value !== "object" &&
                        value !== "string"
                    ) {
                        warn("expected_type_string_a", right, value);
                    }
                }
            }
        }
    });
    preaction("binary", "==", function (thing) {
        warn("expected_a_b", thing, "===", "==");
    });
    preaction("binary", "!=", function (thing) {
        warn("expected_a_b", thing, "!==", "!=");
    });
    preaction("binary", "=>", preaction_function);
    preaction("binary", "||", function (thing) {
        thing.expression.forEach(function (thang) {
            if (thang.id === "&&" && !thang.wrapped) {
                warn("and", thang);
            }
        });
    });
    preaction("binary", "(", function (thing) {
        var left = thing.expression[0];
        if (
            left.identifier &&
            functionage.context[left.id] === undefined &&
            typeof functionage.name === "object"
        ) {
            var parent = functionage.name.function;
            if (parent) {
                var left_variable = parent.context[left.id];
                if (
                    left_variable !== undefined &&
                    left_variable.dead &&
                    left_variable.function === parent &&
                    left_variable.calls !== undefined &&
                    left_variable.calls[functionage.name.id] !== undefined
                ) {
                    left_variable.dead = false;
                }
            }
        }
    });
    preaction("binary", "in", function (thing) {
        warn("infix_in", thing);
    });
    preaction("binary", "instanceof", function (thing) {
        warn("unexpected_a", thing);
    });
    preaction("binary", ".", function (thing) {
        if (thing.expression.new) {
            thing.new = true;
        }
    });
    preaction("statement", "{", function (thing) {
        block_stack.push(blockage);
        blockage = thing;
        thing.live = [];
    });
    preaction("statement", "for", function (thing) {
        if (thing.name !== undefined) {
            var the_variable = lookup(thing.name);
            if (the_variable !== undefined) {
                the_variable.init = true;
                if (!the_variable.writable) {
                    warn("bad_assignment_a", thing.name);
                }
            }
        }
        walk_statement(thing.initial);
    });
    preaction("statement", "function", preaction_function);
    preaction("unary", "~", bitwise_check);
    preaction("unary", "function", preaction_function);
    preaction("variable", function (thing) {
        var the_variable = lookup(thing);
        if (the_variable !== undefined) {
            thing.variable = the_variable;
            the_variable.used += 1;
        }
    });

    function init_variable(name) {
        var the_variable = lookup(name);
        if (the_variable !== undefined) {
            if (the_variable.writable) {
                the_variable.init = true;
                return;
            }
        }
        warn("bad_assignment_a", name);
    }

    postaction("assignment", function (thing) {

// Assignment using = sets the init property of a variable. No other assignment
// operator can do this. A = token keeps that variable (or array of variables
// in case of destructuring) in its name property.

        var lvalue = thing.expression[0];
        if (thing.id === "=") {
            if (thing.names !== undefined) {
                if (Array.isArray(thing.names)) {
                    thing.names.forEach(init_variable);
                } else {
                    init_variable(thing.names);
                }
            } else {
                if (
                    lvalue.id === "." &&
                    thing.expression[1].id === "undefined"
                ) {
                    warn(
                        "expected_a_b",
                        lvalue.expression,
                        "delete",
                        "undefined"
                    );
                }
            }
        } else {
            if (lvalue.arity === "variable") {
                if (!lvalue.variable || lvalue.variable.writable !== true) {
                    warn("bad_assignment_a", lvalue);
                }
            }
            var right = syntax[thing.expression[1].id];
            if (
                right !== undefined &&
                (
                    right.id === "function" ||
                    right.id === "=>" ||
                    (
                        right.constant &&
                        right.id !== "(number)" &&
                        (right.id !== "(string)" || thing.id !== "+=")
                    )
                )
            ) {
                warn("unexpected_a", thing.expression[1]);
            }
        }
    });

    function postaction_function(thing) {
        delete functionage.loop;
        delete functionage.switch;
        functionage = stack.pop();
        if (thing.wrapped) {
            warn("unexpected_parens", thing);
        }
        if (typeof thing.name === "object") {
            thing.name.used = 0;
        }
        return pop_block();
    }

    postaction("binary", function (thing) {
        var right;
        if (relationop[thing.id]) {
            if (
                is_weird(thing.expression[0]) ||
                is_weird(thing.expression[1]) ||
                are_similar(thing.expression[0], thing.expression[1]) ||
                (
                    thing.expression[0].constant === true &&
                    thing.expression[1].constant === true
                )
            ) {
                warn("weird_relation_a", thing);
            }
        }
        switch (thing.id) {
        case "+":
        case "-":
            right = thing.expression[1];
            if (
                right.id === thing.id &&
                right.arity === "unary" &&
                !right.wrapped
            ) {
                warn("wrap_unary", right);
            }
            break;
        case "=>":
        case "(":
            break;
        case ".":
            if (thing.expression.id === "RegExp") {
                warn("weird_expression_a", thing);
            }
            break;
        default:
            if (
                thing.expression[0].constant === true &&
                thing.expression[1].constant === true
            ) {
                thing.constant = true;
            }
        }
    });
    postaction("binary", "&&", function (thing) {
        if (
            is_weird(thing.expression[0]) ||
            are_similar(thing.expression[0], thing.expression[1]) ||
            thing.expression[0].constant === true ||
            thing.expression[1].constant === true
        ) {
            warn("weird_condition_a", thing);
        }
    });
    postaction("binary", "||", function (thing) {
        if (
            is_weird(thing.expression[0]) ||
            are_similar(thing.expression[0], thing.expression[1]) ||
            thing.expression[0].constant === true
        ) {
            warn("weird_condition_a", thing);
        }
    });
    postaction("binary", "=>", postaction_function);
    postaction("binary", "(", function (thing) {
        var left = thing.expression[0];
        var the_new;
        if (left.id === "new") {
            the_new = left;
            left = left.expression;
        }
        if (left.id === "function") {
            if (!thing.wrapped) {
                warn("wrap_immediate", thing);
            }
        } else if (left.identifier) {
            if (the_new !== undefined) {
                if (
                    left.id.charAt(0) > "Z" ||
                    left.id === "Boolean" ||
                    left.id === "Number" ||
                    left.id === "String" ||
                    (left.id === "Symbol" && option.es6)
                ) {
                    warn("unexpected_a", the_new);
                } else if (left.id === "Function") {
                    if (!option.eval) {
                        warn("unexpected_a", left, "new Function");
                    }
                } else if (left.id === "Array") {
                    warn("expected_a_b", left, "[]", "new Array");
                } else if (left.id === "Object") {
                    warn(
                        "expected_a_b",
                        left,
                        "Object.create(null)",
                        "new Object"
                    );
                }
            } else {
                if (
                    left.id.charAt(0) >= "A" &&
                    left.id.charAt(0) <= "Z" &&
                    left.id !== "Boolean" &&
                    left.id !== "Number" &&
                    left.id !== "String" &&
                    left.id !== "Symbol"
                ) {
                    warn(
                        "expected_a_before_b",
                        left,
                        "new",
                        artifact(left)
                    );
                }
            }
        } else if (left.id === ".") {
            var cack = the_new !== undefined;
            if (left.expression.id === "Date" && left.name.id === "UTC") {
                cack = !cack;
            }
            if (rx_cap.test(left.name.id) !== cack) {
                if (the_new !== undefined) {
                    warn("unexpected_a", the_new);
                } else {
                    warn(
                        "expected_a_before_b",
                        left.expression,
                        "new",
                        left.name.id
                    );
                }
            }
            if (left.name.id === "getTime") {
                var l1 = left.expression;
                if (l1.id === "(") {
                    var l2 = l1.expression;
                    if (l2.length === 1) {
                        var l3 = l2[0];
                        if (l3.id === "new" && l3.expression.id === "Date") {
                            warn(
                                "expected_a_b",
                                l3,
                                "Date.now()",
                                "new Date().getTime()"
                            );
                        }
                    }
                }
            }
        }
    });
    postaction("binary", "[", function (thing) {
        if (thing.expression[0].id === "RegExp") {
            warn("weird_expression_a", thing);
        }
        if (is_weird(thing.expression[1])) {
            warn("weird_expression_a", thing.expression[1]);
        }
    });
    postaction("statement", "{", pop_block);
    postaction("statement", "const", action_var);
    postaction("statement", "export", top_level_only);
    postaction("statement", "for", function (thing) {
        walk_statement(thing.inc);
    });
    postaction("statement", "function", postaction_function);
    postaction("statement", "import", function (the_thing) {
        var name = the_thing.name;
        if (Array.isArray(name)) {
            name.forEach(function (name) {
                name.dead = false;
                name.init = true;
                blockage.live.push(name);
            });
        } else {
            name.dead = false;
            name.init = true;
            blockage.live.push(name);
        }
        return top_level_only(the_thing);
    });
    postaction("statement", "let", action_var);
    postaction("statement", "try", function (thing) {
        if (thing.catch !== undefined) {
            var the_name = thing.catch.name;
            if (the_name !== undefined) {
                var the_variable = functionage.context[the_name.id];
                the_variable.dead = false;
                the_variable.init = true;
            }
            walk_statement(thing.catch.block);
        }
    });
    postaction("statement", "var", action_var);
    postaction("ternary", function (thing) {
        if (
            is_weird(thing.expression[0]) ||
            thing.expression[0].constant === true ||
            are_similar(thing.expression[1], thing.expression[2])
        ) {
            warn("unexpected_a", thing);
        } else if (are_similar(thing.expression[0], thing.expression[1])) {
            warn("expected_a_b", thing, "||", "?");
        } else if (are_similar(thing.expression[0], thing.expression[2])) {
            warn("expected_a_b", thing, "&&", "?");
        } else if (
            thing.expression[1].id === "true" &&
            thing.expression[2].id === "false"
        ) {
            warn("expected_a_b", thing, "!!", "?");
        } else if (
            thing.expression[1].id === "false" &&
            thing.expression[2].id === "true"
        ) {
            warn("expected_a_b", thing, "!", "?");
        } else if (thing.expression[0].wrapped !== true && (
            thing.expression[0].id === "||" ||
            thing.expression[0].id === "&&"
        )) {
            warn("wrap_condition", thing.expression[0]);
        }
    });
    postaction("unary", function (thing) {
        switch (thing.id) {
        case "[":
        case "{":
        case "function":
        case "new":
            break;
        case "`":
            if (thing.expression.every(function (thing) {
                return thing.constant;
            })) {
                thing.constant = true;
            }
            break;
        default:
            if (thing.expression.constant === true) {
                thing.constant = true;
            }
        }
    });
    postaction("unary", "function", postaction_function);

    function delve(the_function) {
        Object.keys(the_function.context).forEach(function (id) {
            if (id !== "ignore") {
                var name = the_function.context[id];
                if (name.function === the_function) {
                    if (name.used === 0 && (
                        name.role !== "function" ||
                        name.function.arity !== "unary"
                    )) {
                        warn("unused_a", name);
                    } else if (!name.init) {
                        warn("uninitialized_a", name);
                    }
                }
            }
        });
    }

    function uninitialized_and_unused() {

// Delve into the functions looking for variables that were not initialized
// or used. If the file imports or exports, then its global object is also
// delved.

        if (module_mode === true || option.node) {
            delve(global);
        }
        functions.forEach(delve);
    }

// Go through the token list, looking at usage of whitespace.

    function whitage() {
        var closer = "(end)";
        var free = false;
        var left = global;
        var margin = 0;
        var nr_comments_skipped = 0;
        var open = true;
        var qmark = "";
        var result;
        var right;

        function expected_at(at) {
            warn(
                "expected_a_at_b_c",
                right,
                artifact(right),
                fudge + at,
                artifact_column(right)
            );
        }

        function at_margin(fit) {
            var at = margin + fit;
            if (right.from !== at) {
                return expected_at(at);
            }
        }

        function no_space_only() {
            if (left.id !== "(global)" && (
                left.line !== right.line || left.thru !== right.from
            )) {
                warn(
                    "unexpected_space_a_b",
                    right,
                    artifact(left),
                    artifact(right)
                );
            }
        }

        function no_space() {
            if (left.line === right.line) {
                if (left.thru !== right.from && nr_comments_skipped === 0) {
                    warn(
                        "unexpected_space_a_b",
                        right,
                        artifact(left),
                        artifact(right)
                    );
                }
            } else {
                if (open) {
                    var at = (free)
                        ? margin
                        : margin + 8;
                    if (right.from < at) {
                        expected_at(at);
                    }
                } else {
                    if (right.from !== margin + 8) {
                        expected_at(margin + 8);
                    }
                }
            }
        }

        function one_space_only() {
            if (left.line !== right.line || left.thru + 1 !== right.from) {
                warn(
                    "expected_space_a_b",
                    right,
                    artifact(left),
                    artifact(right)
                );
            }
        }

        function one_space() {
            if (left.line === right.line) {
                if (left.thru + 1 !== right.from && nr_comments_skipped === 0) {
                    warn(
                        "expected_space_a_b",
                        right,
                        artifact(left),
                        artifact(right)
                    );
                }
            } else {
                if (free) {
                    if (right.from < margin) {
                        expected_at(margin);
                    }
                } else {
                    if (right.from !== margin + 8) {
                        expected_at(margin + 8);
                    }
                }
            }
        }

        function unqmark() {

// Undo the effects of dangling nested ternary operators.

            var level = qmark.length;
            if (level > 0) {
                margin -= level * 4;
            }
            qmark = "";
        }

        stack = [];
        tokens.forEach(function (the_token) {
            right = the_token;
            if (right.id === "(comment)" || right.id === "(end)") {
                nr_comments_skipped += 1;
            } else {

// If left is an opener and right is not the closer, then push the previous
// state. If the token following the opener is on the next line, then this is
// an open form. If the tokens are on different lines, then it is a closed form.
// Open form is more readable, with each item (statement, argument, parameter,
// etc) starting on its own line. Closed form is more compact. Statement blocks
// are always in open form.

                var new_closer = opener[left.id];
                if (typeof new_closer === "string") {
                    if (new_closer !== right.id) {
                        stack.push({
                            closer: closer,
                            free: free,
                            margin: margin,
                            open: open,
                            qmark: qmark
                        });
                        qmark = "";
                        closer = new_closer;
                        if (left.line !== right.line) {
                            free = closer === ")" && left.free;
                            open = true;
                            margin += 4;
                            if (right.role === "label") {
                                if (right.from !== 0) {
                                    expected_at(0);
                                }
                            } else if (right.switch) {
                                unqmark();
                                at_margin(-4);
                            } else {
                                at_margin(0);
                            }
                        } else {
                            if (right.statement || right.role === "label") {
                                warn(
                                    "expected_line_break_a_b",
                                    right,
                                    artifact(left),
                                    artifact(right)
                                );
                            }
                            free = false;
                            open = false;
                            no_space_only();
                        }
                    } else {

// If left and right are opener and closer, then the placement of right depends
// on the openness. Illegal pairs (like {]) have already been detected.

                        if (left.line === right.line) {
                            no_space();
                        } else {
                            at_margin(0);
                        }
                    }
                } else {

// If right is a closer, then pop the previous state.

                    if (right.id === closer) {
                        var previous = stack.pop();
                        margin = previous.margin;
                        if (open && right.id !== ";") {
                            at_margin(0);
                        } else {
                            no_space_only();
                        }
                        closer = previous.closer;
                        free = previous.free;
                        open = previous.open;
                        qmark = previous.qmark;
                    } else {

// Left is not an opener, and right is not a closer. The nature of left and
// right will determine the space between them.

// If left is , or ; or right is a statement then if open, right must go at the
// margin, or if closed, a space before.


                        if (right.switch) {
                            unqmark();
                            at_margin(-4);
                        } else if (right.role === "label") {
                            if (right.from !== 0) {
                                expected_at(0);
                            }
                        } else if (left.id === ",") {
                            unqmark();
                            if (!open || (
                                (free || closer === "]") &&
                                left.line === right.line
                            )) {
                                one_space();
                            } else {
                                at_margin(0);
                            }

// If right is a ternary operator, line it up on the margin. Use qmark to
// deal with nested ternary operators.

                        } else if (right.arity === "ternary") {
                            if (right.id === "?") {
                                margin += 4;
                                qmark += "?";
                            } else {
                                result = qmark.match(rx_colons);
                                qmark = result[1] + ":";
                                margin -= 4 * result[2].length;
                            }
                            at_margin(0);
                        } else if (
                            right.arity === "binary" &&
                            right.id === "(" &&
                            free
                        ) {
                            no_space();
                        } else if (
                            left.id === "." ||
                            left.id === "..." ||
                            right.id === "," ||
                            right.id === ";" ||
                            right.id === ":" ||
                            (right.arity === "binary" && (
                                right.id === "(" ||
                                right.id === "["
                            )) ||
                            (
                                right.arity === "function" &&
                                left.id !== "function"
                            )
                        ) {
                            no_space_only();
                        } else if (right.id === ".") {
                            if (left.line === right.line) {
                                no_space();
                            } else {
                                if (!rx_dot.test(qmark)) {
                                    qmark += ".";
                                    margin += 4;
                                }
                                at_margin(0);
                            }
                        } else if (left.id === ";") {
                            unqmark();
                            if (open) {
                                at_margin(0);
                            } else {
                                one_space();
                            }
                        } else if (
                            left.arity === "ternary" ||
                            left.id === "case" ||
                            left.id === "catch" ||
                            left.id === "else" ||
                            left.id === "finally" ||
                            left.id === "while" ||
                            right.id === "catch" ||
                            right.id === "else" ||
                            right.id === "finally" ||
                            (right.id === "while" && !right.statement) ||
                            (left.id === ")" && right.id === "{")
                        ) {
                            one_space_only();
                        } else if (right.statement === true) {
                            if (open) {
                                at_margin(0);
                            } else {
                                one_space();
                            }
                        } else if (
                            left.id === "var" ||
                            left.id === "const" ||
                            left.id === "let"
                        ) {
                            stack.push({
                                closer: closer,
                                free: free,
                                margin: margin,
                                open: open,
                                qmark: qmark
                            });
                            closer = ";";
                            free = false;
                            open = left.open;
                            qmark = "";
                            if (open) {
                                margin = margin + 4;
                                at_margin(0);
                            } else {
                                one_space_only();
                            }
                        } else if (

// There is a space between left and right.

                            spaceop[left.id] === true ||
                            spaceop[right.id] === true ||
                            (
                                left.arity === "binary" &&
                                (left.id === "+" || left.id === "-")
                            ) ||
                            (
                                right.arity === "binary" &&
                                (right.id === "+" || right.id === "-")
                            ) ||
                            left.id === "function" ||
                            left.id === ":" ||
                            (
                                (
                                    left.identifier ||
                                    left.id === "(string)" ||
                                    left.id === "(number)"
                                ) &&
                                (
                                    right.identifier ||
                                    right.id === "(string)" ||
                                    right.id === "(number)"
                                )
                            ) ||
                            (left.arity === "statement" && right.id !== ";")
                        ) {
                            one_space();
                        } else if (left.arity === "unary" && left.id !== "`") {
                            no_space_only();
                        }
                    }
                }
                nr_comments_skipped = 0;
                delete left.calls;
                delete left.dead;
                delete left.free;
                delete left.init;
                delete left.open;
                delete left.used;
                left = right;
            }
        });
    }

// The jslint function itself.

    return function (source, option_object, global_array) {
        try {
            warnings = [];
            option = option_object || empty();
            anon = "anonymous";
            block_stack = [];
            declared_globals = empty();
            directive_mode = true;
            directives = [];
            early_stop = true;
            export_mode = false;
            fudge = (option.fudge)
                ? 1
                : 0;
            functions = [];
            global = {
                id: "(global)",
                body: true,
                context: empty(),
                from: 0,
                level: 0,
                line: 0,
                live: [],
                loop: 0,
                switch: 0,
                thru: 0
            };
            blockage = global;
            functionage = global;
            imports = [];
            json_mode = false;
            mega_mode = false;
            module_mode = false;
            next_token = global;
            property = empty();
            stack = [];
            tenure = undefined;
            token = global;
            token_nr = 0;
            var_mode = undefined;
            populate(declared_globals, standard, false);
            if (global_array !== undefined) {
                populate(declared_globals, global_array, false);
            }
            Object.keys(option).forEach(function (name) {
                if (option[name] === true) {
                    var allowed = allowed_option[name];
                    if (Array.isArray(allowed)) {
                        populate(declared_globals, allowed, false);
                    }
                }
            });
            tokenize(source);
            advance();
            if (tokens[0].id === "{" || tokens[0].id === "[") {
                json_mode = true;
                tree = json_value();
                advance("(end)");
            } else {

// Because browsers encourage combining of script files, the first token might
// be a semicolon to defend against a missing semicolon in the preceding file.

                if (option.browser) {
                    if (next_token.id === ";") {
                        advance(";");
                    }
                } else {

// If we are not in a browser, then the file form of strict pragma may be used.

                    if (
                        next_token.id === "(string)" &&
                        next_token.value === "use strict"
                    ) {
                        advance("(string)");
                        advance(";");
                        global.strict = true;
                    }
                }
                tree = statements();
                advance("(end)");
                functionage = global;
                walk_statement(tree);
                uninitialized_and_unused();
                if (!option.white) {
                    whitage();
                }
            }
            if (!option.browser) {
                directives.forEach(function (comment) {
                    if (comment.directive === "global") {
                        warn("missing_browser", comment);
                    }
                });
            }
            early_stop = false;
        } catch (e) {
            if (e.name !== "JSLintError") {
                warnings.push(e);
            }
        }
        return {
            directives: directives,
            edition: "2016-05-25",
            functions: functions,
            global: global,
            id: "(JSLint)",
            imports: imports,
            json: json_mode,
            lines: lines,
            module: module_mode === true,
            ok: warnings.length === 0 && !early_stop,
            option: option,
            property: property,
            stop: early_stop,
            tokens: tokens,
            tree: tree,
            warnings: warnings.sort(function (a, b) {
                return a.line - b.line || a.column - b.column;
            })
        };
    };
}());

define("ace/lib/lang",["require","exports","module"], function(require, exports, module) {
"use strict";

exports.last = function(a) {
    return a[a.length - 1];
};

exports.stringReverse = function(string) {
    return string.split("").reverse().join("");
};

exports.stringRepeat = function (string, count) {
    var result = '';
    while (count > 0) {
        if (count & 1)
            result += string;

        if (count >>= 1)
            string += string;
    }
    return result;
};

var trimBeginRegexp = /^\s\s*/;
var trimEndRegexp = /\s\s*$/;

exports.stringTrimLeft = function (string) {
    return string.replace(trimBeginRegexp, '');
};

exports.stringTrimRight = function (string) {
    return string.replace(trimEndRegexp, '');
};

exports.copyObject = function(obj) {
    var copy = {};
    for (var key in obj) {
        copy[key] = obj[key];
    }
    return copy;
};

exports.copyArray = function(array){
    var copy = [];
    for (var i=0, l=array.length; i<l; i++) {
        if (array[i] && typeof array[i] == "object")
            copy[i] = this.copyObject( array[i] );
        else 
            copy[i] = array[i];
    }
    return copy;
};

exports.deepCopy = function deepCopy(obj) {
    if (typeof obj !== "object" || !obj)
        return obj;
    var copy;
    if (Array.isArray(obj)) {
        copy = [];
        for (var key = 0; key < obj.length; key++) {
            copy[key] = deepCopy(obj[key]);
        }
        return copy;
    }
    var cons = obj.constructor;
    if (cons === RegExp)
        return obj;
    
    copy = cons();
    for (var key in obj) {
        copy[key] = deepCopy(obj[key]);
    }
    return copy;
};

exports.arrayToMap = function(arr) {
    var map = {};
    for (var i=0; i<arr.length; i++) {
        map[arr[i]] = 1;
    }
    return map;

};

exports.createMap = function(props) {
    var map = Object.create(null);
    for (var i in props) {
        map[i] = props[i];
    }
    return map;
};
exports.arrayRemove = function(array, value) {
  for (var i = 0; i <= array.length; i++) {
    if (value === array[i]) {
      array.splice(i, 1);
    }
  }
};

exports.escapeRegExp = function(str) {
    return str.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
};

exports.escapeHTML = function(str) {
    return str.replace(/&/g, "&#38;").replace(/"/g, "&#34;").replace(/'/g, "&#39;").replace(/</g, "&#60;");
};

exports.getMatchOffsets = function(string, regExp) {
    var matches = [];

    string.replace(regExp, function(str) {
        matches.push({
            offset: arguments[arguments.length-2],
            length: str.length
        });
    });

    return matches;
};
exports.deferredCall = function(fcn) {
    var timer = null;
    var callback = function() {
        timer = null;
        fcn();
    };

    var deferred = function(timeout) {
        deferred.cancel();
        timer = setTimeout(callback, timeout || 0);
        return deferred;
    };

    deferred.schedule = deferred;

    deferred.call = function() {
        this.cancel();
        fcn();
        return deferred;
    };

    deferred.cancel = function() {
        clearTimeout(timer);
        timer = null;
        return deferred;
    };
    
    deferred.isPending = function() {
        return timer;
    };

    return deferred;
};


exports.delayedCall = function(fcn, defaultTimeout) {
    var timer = null;
    var callback = function() {
        timer = null;
        fcn();
    };

    var _self = function(timeout) {
        if (timer == null)
            timer = setTimeout(callback, timeout || defaultTimeout);
    };

    _self.delay = function(timeout) {
        timer && clearTimeout(timer);
        timer = setTimeout(callback, timeout || defaultTimeout);
    };
    _self.schedule = _self;

    _self.call = function() {
        this.cancel();
        fcn();
    };

    _self.cancel = function() {
        timer && clearTimeout(timer);
        timer = null;
    };

    _self.isPending = function() {
        return timer;
    };

    return _self;
};
});

define("ace/mode/css/csslint",["require","exports","module"], function(require, exports, module) {
var parserlib = {};
(function(){
function EventTarget(){
    this._listeners = {};
}

EventTarget.prototype = {
    constructor: EventTarget,
    addListener: function(type, listener){
        if (!this._listeners[type]){
            this._listeners[type] = [];
        }

        this._listeners[type].push(listener);
    },
    fire: function(event){
        if (typeof event == "string"){
            event = { type: event };
        }
        if (typeof event.target != "undefined"){
            event.target = this;
        }

        if (typeof event.type == "undefined"){
            throw new Error("Event object missing 'type' property.");
        }

        if (this._listeners[event.type]){
            var listeners = this._listeners[event.type].concat();
            for (var i=0, len=listeners.length; i < len; i++){
                listeners[i].call(this, event);
            }
        }
    },
    removeListener: function(type, listener){
        if (this._listeners[type]){
            var listeners = this._listeners[type];
            for (var i=0, len=listeners.length; i < len; i++){
                if (listeners[i] === listener){
                    listeners.splice(i, 1);
                    break;
                }
            }


        }
    }
};
function StringReader(text){
    this._input = text.replace(/\n\r?/g, "\n");
    this._line = 1;
    this._col = 1;
    this._cursor = 0;
}

StringReader.prototype = {
    constructor: StringReader,
    getCol: function(){
        return this._col;
    },
    getLine: function(){
        return this._line ;
    },
    eof: function(){
        return (this._cursor == this._input.length);
    },
    peek: function(count){
        var c = null;
        count = (typeof count == "undefined" ? 1 : count);
        if (this._cursor < this._input.length){
            c = this._input.charAt(this._cursor + count - 1);
        }

        return c;
    },
    read: function(){
        var c = null;
        if (this._cursor < this._input.length){
            if (this._input.charAt(this._cursor) == "\n"){
                this._line++;
                this._col=1;
            } else {
                this._col++;
            }
            c = this._input.charAt(this._cursor++);
        }

        return c;
    },
    mark: function(){
        this._bookmark = {
            cursor: this._cursor,
            line:   this._line,
            col:    this._col
        };
    },

    reset: function(){
        if (this._bookmark){
            this._cursor = this._bookmark.cursor;
            this._line = this._bookmark.line;
            this._col = this._bookmark.col;
            delete this._bookmark;
        }
    },
    readTo: function(pattern){

        var buffer = "",
            c;
        while (buffer.length < pattern.length || buffer.lastIndexOf(pattern) != buffer.length - pattern.length){
            c = this.read();
            if (c){
                buffer += c;
            } else {
                throw new Error("Expected \"" + pattern + "\" at line " + this._line  + ", col " + this._col + ".");
            }
        }

        return buffer;

    },
    readWhile: function(filter){

        var buffer = "",
            c = this.read();

        while(c !== null && filter(c)){
            buffer += c;
            c = this.read();
        }

        return buffer;

    },
    readMatch: function(matcher){

        var source = this._input.substring(this._cursor),
            value = null;
        if (typeof matcher == "string"){
            if (source.indexOf(matcher) === 0){
                value = this.readCount(matcher.length);
            }
        } else if (matcher instanceof RegExp){
            if (matcher.test(source)){
                value = this.readCount(RegExp.lastMatch.length);
            }
        }

        return value;
    },
    readCount: function(count){
        var buffer = "";

        while(count--){
            buffer += this.read();
        }

        return buffer;
    }

};
function SyntaxError(message, line, col){
    this.col = col;
    this.line = line;
    this.message = message;

}
SyntaxError.prototype = new Error();
function SyntaxUnit(text, line, col, type){
    this.col = col;
    this.line = line;
    this.text = text;
    this.type = type;
}
SyntaxUnit.fromToken = function(token){
    return new SyntaxUnit(token.value, token.startLine, token.startCol);
};

SyntaxUnit.prototype = {
    constructor: SyntaxUnit,
    valueOf: function(){
        return this.text;
    },
    toString: function(){
        return this.text;
    }

};
function TokenStreamBase(input, tokenData){
    this._reader = input ? new StringReader(input.toString()) : null;
    this._token = null;
    this._tokenData = tokenData;
    this._lt = [];
    this._ltIndex = 0;

    this._ltIndexCache = [];
}
TokenStreamBase.createTokenData = function(tokens){

    var nameMap     = [],
        typeMap     = {},
        tokenData     = tokens.concat([]),
        i            = 0,
        len            = tokenData.length+1;

    tokenData.UNKNOWN = -1;
    tokenData.unshift({name:"EOF"});

    for (; i < len; i++){
        nameMap.push(tokenData[i].name);
        tokenData[tokenData[i].name] = i;
        if (tokenData[i].text){
            typeMap[tokenData[i].text] = i;
        }
    }

    tokenData.name = function(tt){
        return nameMap[tt];
    };

    tokenData.type = function(c){
        return typeMap[c];
    };

    return tokenData;
};

TokenStreamBase.prototype = {
    constructor: TokenStreamBase,
    match: function(tokenTypes, channel){
        if (!(tokenTypes instanceof Array)){
            tokenTypes = [tokenTypes];
        }

        var tt  = this.get(channel),
            i   = 0,
            len = tokenTypes.length;

        while(i < len){
            if (tt == tokenTypes[i++]){
                return true;
            }
        }
        this.unget();
        return false;
    },
    mustMatch: function(tokenTypes, channel){

        var token;
        if (!(tokenTypes instanceof Array)){
            tokenTypes = [tokenTypes];
        }

        if (!this.match.apply(this, arguments)){
            token = this.LT(1);
            throw new SyntaxError("Expected " + this._tokenData[tokenTypes[0]].name +
                " at line " + token.startLine + ", col " + token.startCol + ".", token.startLine, token.startCol);
        }
    },
    advance: function(tokenTypes, channel){

        while(this.LA(0) !== 0 && !this.match(tokenTypes, channel)){
            this.get();
        }

        return this.LA(0);
    },
    get: function(channel){

        var tokenInfo   = this._tokenData,
            reader      = this._reader,
            value,
            i           =0,
            len         = tokenInfo.length,
            found       = false,
            token,
            info;
        if (this._lt.length && this._ltIndex >= 0 && this._ltIndex < this._lt.length){

            i++;
            this._token = this._lt[this._ltIndex++];
            info = tokenInfo[this._token.type];
            while((info.channel !== undefined && channel !== info.channel) &&
                    this._ltIndex < this._lt.length){
                this._token = this._lt[this._ltIndex++];
                info = tokenInfo[this._token.type];
                i++;
            }
            if ((info.channel === undefined || channel === info.channel) &&
                    this._ltIndex <= this._lt.length){
                this._ltIndexCache.push(i);
                return this._token.type;
            }
        }
        token = this._getToken();
        if (token.type > -1 && !tokenInfo[token.type].hide){
            token.channel = tokenInfo[token.type].channel;
            this._token = token;
            this._lt.push(token);
            this._ltIndexCache.push(this._lt.length - this._ltIndex + i);
            if (this._lt.length > 5){
                this._lt.shift();
            }
            if (this._ltIndexCache.length > 5){
                this._ltIndexCache.shift();
            }
            this._ltIndex = this._lt.length;
        }
        info = tokenInfo[token.type];
        if (info &&
                (info.hide ||
                (info.channel !== undefined && channel !== info.channel))){
            return this.get(channel);
        } else {
            return token.type;
        }
    },
    LA: function(index){
        var total = index,
            tt;
        if (index > 0){
            if (index > 5){
                throw new Error("Too much lookahead.");
            }
            while(total){
                tt = this.get();
                total--;
            }
            while(total < index){
                this.unget();
                total++;
            }
        } else if (index < 0){

            if(this._lt[this._ltIndex+index]){
                tt = this._lt[this._ltIndex+index].type;
            } else {
                throw new Error("Too much lookbehind.");
            }

        } else {
            tt = this._token.type;
        }

        return tt;

    },
    LT: function(index){
        this.LA(index);
        return this._lt[this._ltIndex+index-1];
    },
    peek: function(){
        return this.LA(1);
    },
    token: function(){
        return this._token;
    },
    tokenName: function(tokenType){
        if (tokenType < 0 || tokenType > this._tokenData.length){
            return "UNKNOWN_TOKEN";
        } else {
            return this._tokenData[tokenType].name;
        }
    },
    tokenType: function(tokenName){
        return this._tokenData[tokenName] || -1;
    },
    unget: function(){
        if (this._ltIndexCache.length){
            this._ltIndex -= this._ltIndexCache.pop();//--;
            this._token = this._lt[this._ltIndex - 1];
        } else {
            throw new Error("Too much lookahead.");
        }
    }

};


parserlib.util = {
StringReader: StringReader,
SyntaxError : SyntaxError,
SyntaxUnit  : SyntaxUnit,
EventTarget : EventTarget,
TokenStreamBase : TokenStreamBase
};
})();
(function(){
var EventTarget = parserlib.util.EventTarget,
TokenStreamBase = parserlib.util.TokenStreamBase,
StringReader = parserlib.util.StringReader,
SyntaxError = parserlib.util.SyntaxError,
SyntaxUnit  = parserlib.util.SyntaxUnit;

var Colors = {
    aliceblue       :"#f0f8ff",
    antiquewhite    :"#faebd7",
    aqua            :"#00ffff",
    aquamarine      :"#7fffd4",
    azure           :"#f0ffff",
    beige           :"#f5f5dc",
    bisque          :"#ffe4c4",
    black           :"#000000",
    blanchedalmond  :"#ffebcd",
    blue            :"#0000ff",
    blueviolet      :"#8a2be2",
    brown           :"#a52a2a",
    burlywood       :"#deb887",
    cadetblue       :"#5f9ea0",
    chartreuse      :"#7fff00",
    chocolate       :"#d2691e",
    coral           :"#ff7f50",
    cornflowerblue  :"#6495ed",
    cornsilk        :"#fff8dc",
    crimson         :"#dc143c",
    cyan            :"#00ffff",
    darkblue        :"#00008b",
    darkcyan        :"#008b8b",
    darkgoldenrod   :"#b8860b",
    darkgray        :"#a9a9a9",
    darkgrey        :"#a9a9a9",
    darkgreen       :"#006400",
    darkkhaki       :"#bdb76b",
    darkmagenta     :"#8b008b",
    darkolivegreen  :"#556b2f",
    darkorange      :"#ff8c00",
    darkorchid      :"#9932cc",
    darkred         :"#8b0000",
    darksalmon      :"#e9967a",
    darkseagreen    :"#8fbc8f",
    darkslateblue   :"#483d8b",
    darkslategray   :"#2f4f4f",
    darkslategrey   :"#2f4f4f",
    darkturquoise   :"#00ced1",
    darkviolet      :"#9400d3",
    deeppink        :"#ff1493",
    deepskyblue     :"#00bfff",
    dimgray         :"#696969",
    dimgrey         :"#696969",
    dodgerblue      :"#1e90ff",
    firebrick       :"#b22222",
    floralwhite     :"#fffaf0",
    forestgreen     :"#228b22",
    fuchsia         :"#ff00ff",
    gainsboro       :"#dcdcdc",
    ghostwhite      :"#f8f8ff",
    gold            :"#ffd700",
    goldenrod       :"#daa520",
    gray            :"#808080",
    grey            :"#808080",
    green           :"#008000",
    greenyellow     :"#adff2f",
    honeydew        :"#f0fff0",
    hotpink         :"#ff69b4",
    indianred       :"#cd5c5c",
    indigo          :"#4b0082",
    ivory           :"#fffff0",
    khaki           :"#f0e68c",
    lavender        :"#e6e6fa",
    lavenderblush   :"#fff0f5",
    lawngreen       :"#7cfc00",
    lemonchiffon    :"#fffacd",
    lightblue       :"#add8e6",
    lightcoral      :"#f08080",
    lightcyan       :"#e0ffff",
    lightgoldenrodyellow  :"#fafad2",
    lightgray       :"#d3d3d3",
    lightgrey       :"#d3d3d3",
    lightgreen      :"#90ee90",
    lightpink       :"#ffb6c1",
    lightsalmon     :"#ffa07a",
    lightseagreen   :"#20b2aa",
    lightskyblue    :"#87cefa",
    lightslategray  :"#778899",
    lightslategrey  :"#778899",
    lightsteelblue  :"#b0c4de",
    lightyellow     :"#ffffe0",
    lime            :"#00ff00",
    limegreen       :"#32cd32",
    linen           :"#faf0e6",
    magenta         :"#ff00ff",
    maroon          :"#800000",
    mediumaquamarine:"#66cdaa",
    mediumblue      :"#0000cd",
    mediumorchid    :"#ba55d3",
    mediumpurple    :"#9370d8",
    mediumseagreen  :"#3cb371",
    mediumslateblue :"#7b68ee",
    mediumspringgreen   :"#00fa9a",
    mediumturquoise :"#48d1cc",
    mediumvioletred :"#c71585",
    midnightblue    :"#191970",
    mintcream       :"#f5fffa",
    mistyrose       :"#ffe4e1",
    moccasin        :"#ffe4b5",
    navajowhite     :"#ffdead",
    navy            :"#000080",
    oldlace         :"#fdf5e6",
    olive           :"#808000",
    olivedrab       :"#6b8e23",
    orange          :"#ffa500",
    orangered       :"#ff4500",
    orchid          :"#da70d6",
    palegoldenrod   :"#eee8aa",
    palegreen       :"#98fb98",
    paleturquoise   :"#afeeee",
    palevioletred   :"#d87093",
    papayawhip      :"#ffefd5",
    peachpuff       :"#ffdab9",
    peru            :"#cd853f",
    pink            :"#ffc0cb",
    plum            :"#dda0dd",
    powderblue      :"#b0e0e6",
    purple          :"#800080",
    red             :"#ff0000",
    rosybrown       :"#bc8f8f",
    royalblue       :"#4169e1",
    saddlebrown     :"#8b4513",
    salmon          :"#fa8072",
    sandybrown      :"#f4a460",
    seagreen        :"#2e8b57",
    seashell        :"#fff5ee",
    sienna          :"#a0522d",
    silver          :"#c0c0c0",
    skyblue         :"#87ceeb",
    slateblue       :"#6a5acd",
    slategray       :"#708090",
    slategrey       :"#708090",
    snow            :"#fffafa",
    springgreen     :"#00ff7f",
    steelblue       :"#4682b4",
    tan             :"#d2b48c",
    teal            :"#008080",
    thistle         :"#d8bfd8",
    tomato          :"#ff6347",
    turquoise       :"#40e0d0",
    violet          :"#ee82ee",
    wheat           :"#f5deb3",
    white           :"#ffffff",
    whitesmoke      :"#f5f5f5",
    yellow          :"#ffff00",
    yellowgreen     :"#9acd32",
    activeBorder        :"Active window border.",
    activecaption       :"Active window caption.",
    appworkspace        :"Background color of multiple document interface.",
    background          :"Desktop background.",
    buttonface          :"The face background color for 3-D elements that appear 3-D due to one layer of surrounding border.",
    buttonhighlight     :"The color of the border facing the light source for 3-D elements that appear 3-D due to one layer of surrounding border.",
    buttonshadow        :"The color of the border away from the light source for 3-D elements that appear 3-D due to one layer of surrounding border.",
    buttontext          :"Text on push buttons.",
    captiontext         :"Text in caption, size box, and scrollbar arrow box.",
    graytext            :"Grayed (disabled) text. This color is set to #000 if the current display driver does not support a solid gray color.",
    greytext            :"Greyed (disabled) text. This color is set to #000 if the current display driver does not support a solid grey color.",
    highlight           :"Item(s) selected in a control.",
    highlighttext       :"Text of item(s) selected in a control.",
    inactiveborder      :"Inactive window border.",
    inactivecaption     :"Inactive window caption.",
    inactivecaptiontext :"Color of text in an inactive caption.",
    infobackground      :"Background color for tooltip controls.",
    infotext            :"Text color for tooltip controls.",
    menu                :"Menu background.",
    menutext            :"Text in menus.",
    scrollbar           :"Scroll bar gray area.",
    threeddarkshadow    :"The color of the darker (generally outer) of the two borders away from the light source for 3-D elements that appear 3-D due to two concentric layers of surrounding border.",
    threedface          :"The face background color for 3-D elements that appear 3-D due to two concentric layers of surrounding border.",
    threedhighlight     :"The color of the lighter (generally outer) of the two borders facing the light source for 3-D elements that appear 3-D due to two concentric layers of surrounding border.",
    threedlightshadow   :"The color of the darker (generally inner) of the two borders facing the light source for 3-D elements that appear 3-D due to two concentric layers of surrounding border.",
    threedshadow        :"The color of the lighter (generally inner) of the two borders away from the light source for 3-D elements that appear 3-D due to two concentric layers of surrounding border.",
    window              :"Window background.",
    windowframe         :"Window frame.",
    windowtext          :"Text in windows."
};
function Combinator(text, line, col){

    SyntaxUnit.call(this, text, line, col, Parser.COMBINATOR_TYPE);
    this.type = "unknown";
    if (/^\s+$/.test(text)){
        this.type = "descendant";
    } else if (text == ">"){
        this.type = "child";
    } else if (text == "+"){
        this.type = "adjacent-sibling";
    } else if (text == "~"){
        this.type = "sibling";
    }

}

Combinator.prototype = new SyntaxUnit();
Combinator.prototype.constructor = Combinator;
function MediaFeature(name, value){

    SyntaxUnit.call(this, "(" + name + (value !== null ? ":" + value : "") + ")", name.startLine, name.startCol, Parser.MEDIA_FEATURE_TYPE);
    this.name = name;
    this.value = value;
}

MediaFeature.prototype = new SyntaxUnit();
MediaFeature.prototype.constructor = MediaFeature;
function MediaQuery(modifier, mediaType, features, line, col){

    SyntaxUnit.call(this, (modifier ? modifier + " ": "") + (mediaType ? mediaType : "") + (mediaType && features.length > 0 ? " and " : "") + features.join(" and "), line, col, Parser.MEDIA_QUERY_TYPE);
    this.modifier = modifier;
    this.mediaType = mediaType;
    this.features = features;

}

MediaQuery.prototype = new SyntaxUnit();
MediaQuery.prototype.constructor = MediaQuery;
function Parser(options){
    EventTarget.call(this);


    this.options = options || {};

    this._tokenStream = null;
}
Parser.DEFAULT_TYPE = 0;
Parser.COMBINATOR_TYPE = 1;
Parser.MEDIA_FEATURE_TYPE = 2;
Parser.MEDIA_QUERY_TYPE = 3;
Parser.PROPERTY_NAME_TYPE = 4;
Parser.PROPERTY_VALUE_TYPE = 5;
Parser.PROPERTY_VALUE_PART_TYPE = 6;
Parser.SELECTOR_TYPE = 7;
Parser.SELECTOR_PART_TYPE = 8;
Parser.SELECTOR_SUB_PART_TYPE = 9;

Parser.prototype = function(){

    var proto = new EventTarget(),  //new prototype
        prop,
        additions =  {
            constructor: Parser,
            DEFAULT_TYPE : 0,
            COMBINATOR_TYPE : 1,
            MEDIA_FEATURE_TYPE : 2,
            MEDIA_QUERY_TYPE : 3,
            PROPERTY_NAME_TYPE : 4,
            PROPERTY_VALUE_TYPE : 5,
            PROPERTY_VALUE_PART_TYPE : 6,
            SELECTOR_TYPE : 7,
            SELECTOR_PART_TYPE : 8,
            SELECTOR_SUB_PART_TYPE : 9,

            _stylesheet: function(){

                var tokenStream = this._tokenStream,
                    charset     = null,
                    count,
                    token,
                    tt;

                this.fire("startstylesheet");
                this._charset();

                this._skipCruft();
                while (tokenStream.peek() == Tokens.IMPORT_SYM){
                    this._import();
                    this._skipCruft();
                }
                while (tokenStream.peek() == Tokens.NAMESPACE_SYM){
                    this._namespace();
                    this._skipCruft();
                }
                tt = tokenStream.peek();
                while(tt > Tokens.EOF){

                    try {

                        switch(tt){
                            case Tokens.MEDIA_SYM:
                                this._media();
                                this._skipCruft();
                                break;
                            case Tokens.PAGE_SYM:
                                this._page();
                                this._skipCruft();
                                break;
                            case Tokens.FONT_FACE_SYM:
                                this._font_face();
                                this._skipCruft();
                                break;
                            case Tokens.KEYFRAMES_SYM:
                                this._keyframes();
                                this._skipCruft();
                                break;
                            case Tokens.VIEWPORT_SYM:
                                this._viewport();
                                this._skipCruft();
                                break;
                            case Tokens.UNKNOWN_SYM:  //unknown @ rule
                                tokenStream.get();
                                if (!this.options.strict){
                                    this.fire({
                                        type:       "error",
                                        error:      null,
                                        message:    "Unknown @ rule: " + tokenStream.LT(0).value + ".",
                                        line:       tokenStream.LT(0).startLine,
                                        col:        tokenStream.LT(0).startCol
                                    });
                                    count=0;
                                    while (tokenStream.advance([Tokens.LBRACE, Tokens.RBRACE]) == Tokens.LBRACE){
                                        count++;    //keep track of nesting depth
                                    }

                                    while(count){
                                        tokenStream.advance([Tokens.RBRACE]);
                                        count--;
                                    }

                                } else {
                                    throw new SyntaxError("Unknown @ rule.", tokenStream.LT(0).startLine, tokenStream.LT(0).startCol);
                                }
                                break;
                            case Tokens.S:
                                this._readWhitespace();
                                break;
                            default:
                                if(!this._ruleset()){
                                    switch(tt){
                                        case Tokens.CHARSET_SYM:
                                            token = tokenStream.LT(1);
                                            this._charset(false);
                                            throw new SyntaxError("@charset not allowed here.", token.startLine, token.startCol);
                                        case Tokens.IMPORT_SYM:
                                            token = tokenStream.LT(1);
                                            this._import(false);
                                            throw new SyntaxError("@import not allowed here.", token.startLine, token.startCol);
                                        case Tokens.NAMESPACE_SYM:
                                            token = tokenStream.LT(1);
                                            this._namespace(false);
                                            throw new SyntaxError("@namespace not allowed here.", token.startLine, token.startCol);
                                        default:
                                            tokenStream.get();  //get the last token
                                            this._unexpectedToken(tokenStream.token());
                                    }

                                }
                        }
                    } catch(ex) {
                        if (ex instanceof SyntaxError && !this.options.strict){
                            this.fire({
                                type:       "error",
                                error:      ex,
                                message:    ex.message,
                                line:       ex.line,
                                col:        ex.col
                            });
                        } else {
                            throw ex;
                        }
                    }

                    tt = tokenStream.peek();
                }

                if (tt != Tokens.EOF){
                    this._unexpectedToken(tokenStream.token());
                }

                this.fire("endstylesheet");
            },

            _charset: function(emit){
                var tokenStream = this._tokenStream,
                    charset,
                    token,
                    line,
                    col;

                if (tokenStream.match(Tokens.CHARSET_SYM)){
                    line = tokenStream.token().startLine;
                    col = tokenStream.token().startCol;

                    this._readWhitespace();
                    tokenStream.mustMatch(Tokens.STRING);

                    token = tokenStream.token();
                    charset = token.value;

                    this._readWhitespace();
                    tokenStream.mustMatch(Tokens.SEMICOLON);

                    if (emit !== false){
                        this.fire({
                            type:   "charset",
                            charset:charset,
                            line:   line,
                            col:    col
                        });
                    }
                }
            },

            _import: function(emit){

                var tokenStream = this._tokenStream,
                    tt,
                    uri,
                    importToken,
                    mediaList   = [];
                tokenStream.mustMatch(Tokens.IMPORT_SYM);
                importToken = tokenStream.token();
                this._readWhitespace();

                tokenStream.mustMatch([Tokens.STRING, Tokens.URI]);
                uri = tokenStream.token().value.replace(/^(?:url\()?["']?([^"']+?)["']?\)?$/, "$1");

                this._readWhitespace();

                mediaList = this._media_query_list();
                tokenStream.mustMatch(Tokens.SEMICOLON);
                this._readWhitespace();

                if (emit !== false){
                    this.fire({
                        type:   "import",
                        uri:    uri,
                        media:  mediaList,
                        line:   importToken.startLine,
                        col:    importToken.startCol
                    });
                }

            },

            _namespace: function(emit){

                var tokenStream = this._tokenStream,
                    line,
                    col,
                    prefix,
                    uri;
                tokenStream.mustMatch(Tokens.NAMESPACE_SYM);
                line = tokenStream.token().startLine;
                col = tokenStream.token().startCol;
                this._readWhitespace();
                if (tokenStream.match(Tokens.IDENT)){
                    prefix = tokenStream.token().value;
                    this._readWhitespace();
                }

                tokenStream.mustMatch([Tokens.STRING, Tokens.URI]);
                uri = tokenStream.token().value.replace(/(?:url\()?["']([^"']+)["']\)?/, "$1");

                this._readWhitespace();
                tokenStream.mustMatch(Tokens.SEMICOLON);
                this._readWhitespace();

                if (emit !== false){
                    this.fire({
                        type:   "namespace",
                        prefix: prefix,
                        uri:    uri,
                        line:   line,
                        col:    col
                    });
                }

            },

            _media: function(){
                var tokenStream     = this._tokenStream,
                    line,
                    col,
                    mediaList;//       = [];
                tokenStream.mustMatch(Tokens.MEDIA_SYM);
                line = tokenStream.token().startLine;
                col = tokenStream.token().startCol;

                this._readWhitespace();

                mediaList = this._media_query_list();

                tokenStream.mustMatch(Tokens.LBRACE);
                this._readWhitespace();

                this.fire({
                    type:   "startmedia",
                    media:  mediaList,
                    line:   line,
                    col:    col
                });

                while(true) {
                    if (tokenStream.peek() == Tokens.PAGE_SYM){
                        this._page();
                    } else if (tokenStream.peek() == Tokens.FONT_FACE_SYM){
                        this._font_face();
                    } else if (tokenStream.peek() == Tokens.VIEWPORT_SYM){
                        this._viewport();
                    } else if (!this._ruleset()){
                        break;
                    }
                }

                tokenStream.mustMatch(Tokens.RBRACE);
                this._readWhitespace();

                this.fire({
                    type:   "endmedia",
                    media:  mediaList,
                    line:   line,
                    col:    col
                });
            },
            _media_query_list: function(){
                var tokenStream = this._tokenStream,
                    mediaList   = [];


                this._readWhitespace();

                if (tokenStream.peek() == Tokens.IDENT || tokenStream.peek() == Tokens.LPAREN){
                    mediaList.push(this._media_query());
                }

                while(tokenStream.match(Tokens.COMMA)){
                    this._readWhitespace();
                    mediaList.push(this._media_query());
                }

                return mediaList;
            },
            _media_query: function(){
                var tokenStream = this._tokenStream,
                    type        = null,
                    ident       = null,
                    token       = null,
                    expressions = [];

                if (tokenStream.match(Tokens.IDENT)){
                    ident = tokenStream.token().value.toLowerCase();
                    if (ident != "only" && ident != "not"){
                        tokenStream.unget();
                        ident = null;
                    } else {
                        token = tokenStream.token();
                    }
                }

                this._readWhitespace();

                if (tokenStream.peek() == Tokens.IDENT){
                    type = this._media_type();
                    if (token === null){
                        token = tokenStream.token();
                    }
                } else if (tokenStream.peek() == Tokens.LPAREN){
                    if (token === null){
                        token = tokenStream.LT(1);
                    }
                    expressions.push(this._media_expression());
                }

                if (type === null && expressions.length === 0){
                    return null;
                } else {
                    this._readWhitespace();
                    while (tokenStream.match(Tokens.IDENT)){
                        if (tokenStream.token().value.toLowerCase() != "and"){
                            this._unexpectedToken(tokenStream.token());
                        }

                        this._readWhitespace();
                        expressions.push(this._media_expression());
                    }
                }

                return new MediaQuery(ident, type, expressions, token.startLine, token.startCol);
            },
            _media_type: function(){
                return this._media_feature();
            },
            _media_expression: function(){
                var tokenStream = this._tokenStream,
                    feature     = null,
                    token,
                    expression  = null;

                tokenStream.mustMatch(Tokens.LPAREN);

                feature = this._media_feature();
                this._readWhitespace();

                if (tokenStream.match(Tokens.COLON)){
                    this._readWhitespace();
                    token = tokenStream.LT(1);
                    expression = this._expression();
                }

                tokenStream.mustMatch(Tokens.RPAREN);
                this._readWhitespace();

                return new MediaFeature(feature, (expression ? new SyntaxUnit(expression, token.startLine, token.startCol) : null));
            },
            _media_feature: function(){
                var tokenStream = this._tokenStream;

                tokenStream.mustMatch(Tokens.IDENT);

                return SyntaxUnit.fromToken(tokenStream.token());
            },
            _page: function(){
                var tokenStream = this._tokenStream,
                    line,
                    col,
                    identifier  = null,
                    pseudoPage  = null;
                tokenStream.mustMatch(Tokens.PAGE_SYM);
                line = tokenStream.token().startLine;
                col = tokenStream.token().startCol;

                this._readWhitespace();

                if (tokenStream.match(Tokens.IDENT)){
                    identifier = tokenStream.token().value;
                    if (identifier.toLowerCase() === "auto"){
                        this._unexpectedToken(tokenStream.token());
                    }
                }
                if (tokenStream.peek() == Tokens.COLON){
                    pseudoPage = this._pseudo_page();
                }

                this._readWhitespace();

                this.fire({
                    type:   "startpage",
                    id:     identifier,
                    pseudo: pseudoPage,
                    line:   line,
                    col:    col
                });

                this._readDeclarations(true, true);

                this.fire({
                    type:   "endpage",
                    id:     identifier,
                    pseudo: pseudoPage,
                    line:   line,
                    col:    col
                });

            },
            _margin: function(){
                var tokenStream = this._tokenStream,
                    line,
                    col,
                    marginSym   = this._margin_sym();

                if (marginSym){
                    line = tokenStream.token().startLine;
                    col = tokenStream.token().startCol;

                    this.fire({
                        type: "startpagemargin",
                        margin: marginSym,
                        line:   line,
                        col:    col
                    });

                    this._readDeclarations(true);

                    this.fire({
                        type: "endpagemargin",
                        margin: marginSym,
                        line:   line,
                        col:    col
                    });
                    return true;
                } else {
                    return false;
                }
            },
            _margin_sym: function(){

                var tokenStream = this._tokenStream;

                if(tokenStream.match([Tokens.TOPLEFTCORNER_SYM, Tokens.TOPLEFT_SYM,
                        Tokens.TOPCENTER_SYM, Tokens.TOPRIGHT_SYM, Tokens.TOPRIGHTCORNER_SYM,
                        Tokens.BOTTOMLEFTCORNER_SYM, Tokens.BOTTOMLEFT_SYM,
                        Tokens.BOTTOMCENTER_SYM, Tokens.BOTTOMRIGHT_SYM,
                        Tokens.BOTTOMRIGHTCORNER_SYM, Tokens.LEFTTOP_SYM,
                        Tokens.LEFTMIDDLE_SYM, Tokens.LEFTBOTTOM_SYM, Tokens.RIGHTTOP_SYM,
                        Tokens.RIGHTMIDDLE_SYM, Tokens.RIGHTBOTTOM_SYM]))
                {
                    return SyntaxUnit.fromToken(tokenStream.token());
                } else {
                    return null;
                }

            },

            _pseudo_page: function(){

                var tokenStream = this._tokenStream;

                tokenStream.mustMatch(Tokens.COLON);
                tokenStream.mustMatch(Tokens.IDENT);

                return tokenStream.token().value;
            },

            _font_face: function(){
                var tokenStream = this._tokenStream,
                    line,
                    col;
                tokenStream.mustMatch(Tokens.FONT_FACE_SYM);
                line = tokenStream.token().startLine;
                col = tokenStream.token().startCol;

                this._readWhitespace();

                this.fire({
                    type:   "startfontface",
                    line:   line,
                    col:    col
                });

                this._readDeclarations(true);

                this.fire({
                    type:   "endfontface",
                    line:   line,
                    col:    col
                });
            },

            _viewport: function(){
                 var tokenStream = this._tokenStream,
                    line,
                    col;

                    tokenStream.mustMatch(Tokens.VIEWPORT_SYM);
                    line = tokenStream.token().startLine;
                    col = tokenStream.token().startCol;

                    this._readWhitespace();

                    this.fire({
                        type:   "startviewport",
                        line:   line,
                        col:    col
                    });

                    this._readDeclarations(true);

                    this.fire({
                        type:   "endviewport",
                        line:   line,
                        col:    col
                    });

            },

            _operator: function(inFunction){

                var tokenStream = this._tokenStream,
                    token       = null;

                if (tokenStream.match([Tokens.SLASH, Tokens.COMMA]) ||
                    (inFunction && tokenStream.match([Tokens.PLUS, Tokens.STAR, Tokens.MINUS]))){
                    token =  tokenStream.token();
                    this._readWhitespace();
                }
                return token ? PropertyValuePart.fromToken(token) : null;

            },

            _combinator: function(){

                var tokenStream = this._tokenStream,
                    value       = null,
                    token;

                if(tokenStream.match([Tokens.PLUS, Tokens.GREATER, Tokens.TILDE])){
                    token = tokenStream.token();
                    value = new Combinator(token.value, token.startLine, token.startCol);
                    this._readWhitespace();
                }

                return value;
            },

            _unary_operator: function(){

                var tokenStream = this._tokenStream;

                if (tokenStream.match([Tokens.MINUS, Tokens.PLUS])){
                    return tokenStream.token().value;
                } else {
                    return null;
                }
            },

            _property: function(){

                var tokenStream = this._tokenStream,
                    value       = null,
                    hack        = null,
                    tokenValue,
                    token,
                    line,
                    col;
                if (tokenStream.peek() == Tokens.STAR && this.options.starHack){
                    tokenStream.get();
                    token = tokenStream.token();
                    hack = token.value;
                    line = token.startLine;
                    col = token.startCol;
                }

                if(tokenStream.match(Tokens.IDENT)){
                    token = tokenStream.token();
                    tokenValue = token.value;
                    if (tokenValue.charAt(0) == "_" && this.options.underscoreHack){
                        hack = "_";
                        tokenValue = tokenValue.substring(1);
                    }

                    value = new PropertyName(tokenValue, hack, (line||token.startLine), (col||token.startCol));
                    this._readWhitespace();
                }

                return value;
            },
            _ruleset: function(){

                var tokenStream = this._tokenStream,
                    tt,
                    selectors;
                try {
                    selectors = this._selectors_group();
                } catch (ex){
                    if (ex instanceof SyntaxError && !this.options.strict){
                        this.fire({
                            type:       "error",
                            error:      ex,
                            message:    ex.message,
                            line:       ex.line,
                            col:        ex.col
                        });
                        tt = tokenStream.advance([Tokens.RBRACE]);
                        if (tt == Tokens.RBRACE){
                        } else {
                            throw ex;
                        }

                    } else {
                        throw ex;
                    }
                    return true;
                }
                if (selectors){

                    this.fire({
                        type:       "startrule",
                        selectors:  selectors,
                        line:       selectors[0].line,
                        col:        selectors[0].col
                    });

                    this._readDeclarations(true);

                    this.fire({
                        type:       "endrule",
                        selectors:  selectors,
                        line:       selectors[0].line,
                        col:        selectors[0].col
                    });

                }

                return selectors;

            },
            _selectors_group: function(){
                var tokenStream = this._tokenStream,
                    selectors   = [],
                    selector;

                selector = this._selector();
                if (selector !== null){

                    selectors.push(selector);
                    while(tokenStream.match(Tokens.COMMA)){
                        this._readWhitespace();
                        selector = this._selector();
                        if (selector !== null){
                            selectors.push(selector);
                        } else {
                            this._unexpectedToken(tokenStream.LT(1));
                        }
                    }
                }

                return selectors.length ? selectors : null;
            },
            _selector: function(){

                var tokenStream = this._tokenStream,
                    selector    = [],
                    nextSelector = null,
                    combinator  = null,
                    ws          = null;
                nextSelector = this._simple_selector_sequence();
                if (nextSelector === null){
                    return null;
                }

                selector.push(nextSelector);

                do {
                    combinator = this._combinator();

                    if (combinator !== null){
                        selector.push(combinator);
                        nextSelector = this._simple_selector_sequence();
                        if (nextSelector === null){
                            this._unexpectedToken(tokenStream.LT(1));
                        } else {
                            selector.push(nextSelector);
                        }
                    } else {
                        if (this._readWhitespace()){
                            ws = new Combinator(tokenStream.token().value, tokenStream.token().startLine, tokenStream.token().startCol);
                            combinator = this._combinator();
                            nextSelector = this._simple_selector_sequence();
                            if (nextSelector === null){
                                if (combinator !== null){
                                    this._unexpectedToken(tokenStream.LT(1));
                                }
                            } else {

                                if (combinator !== null){
                                    selector.push(combinator);
                                } else {
                                    selector.push(ws);
                                }

                                selector.push(nextSelector);
                            }
                        } else {
                            break;
                        }

                    }
                } while(true);

                return new Selector(selector, selector[0].line, selector[0].col);
            },
            _simple_selector_sequence: function(){

                var tokenStream = this._tokenStream,
                    elementName = null,
                    modifiers   = [],
                    selectorText= "",
                    components  = [
                        function(){
                            return tokenStream.match(Tokens.HASH) ?
                                    new SelectorSubPart(tokenStream.token().value, "id", tokenStream.token().startLine, tokenStream.token().startCol) :
                                    null;
                        },
                        this._class,
                        this._attrib,
                        this._pseudo,
                        this._negation
                    ],
                    i           = 0,
                    len         = components.length,
                    component   = null,
                    found       = false,
                    line,
                    col;
                line = tokenStream.LT(1).startLine;
                col = tokenStream.LT(1).startCol;

                elementName = this._type_selector();
                if (!elementName){
                    elementName = this._universal();
                }

                if (elementName !== null){
                    selectorText += elementName;
                }

                while(true){
                    if (tokenStream.peek() === Tokens.S){
                        break;
                    }
                    while(i < len && component === null){
                        component = components[i++].call(this);
                    }

                    if (component === null){
                        if (selectorText === ""){
                            return null;
                        } else {
                            break;
                        }
                    } else {
                        i = 0;
                        modifiers.push(component);
                        selectorText += component.toString();
                        component = null;
                    }
                }


                return selectorText !== "" ?
                        new SelectorPart(elementName, modifiers, selectorText, line, col) :
                        null;
            },
            _type_selector: function(){

                var tokenStream = this._tokenStream,
                    ns          = this._namespace_prefix(),
                    elementName = this._element_name();

                if (!elementName){
                    if (ns){
                        tokenStream.unget();
                        if (ns.length > 1){
                            tokenStream.unget();
                        }
                    }

                    return null;
                } else {
                    if (ns){
                        elementName.text = ns + elementName.text;
                        elementName.col -= ns.length;
                    }
                    return elementName;
                }
            },
            _class: function(){

                var tokenStream = this._tokenStream,
                    token;

                if (tokenStream.match(Tokens.DOT)){
                    tokenStream.mustMatch(Tokens.IDENT);
                    token = tokenStream.token();
                    return new SelectorSubPart("." + token.value, "class", token.startLine, token.startCol - 1);
                } else {
                    return null;
                }

            },
            _element_name: function(){

                var tokenStream = this._tokenStream,
                    token;

                if (tokenStream.match(Tokens.IDENT)){
                    token = tokenStream.token();
                    return new SelectorSubPart(token.value, "elementName", token.startLine, token.startCol);

                } else {
                    return null;
                }
            },
            _namespace_prefix: function(){
                var tokenStream = this._tokenStream,
                    value       = "";
                if (tokenStream.LA(1) === Tokens.PIPE || tokenStream.LA(2) === Tokens.PIPE){

                    if(tokenStream.match([Tokens.IDENT, Tokens.STAR])){
                        value += tokenStream.token().value;
                    }

                    tokenStream.mustMatch(Tokens.PIPE);
                    value += "|";

                }

                return value.length ? value : null;
            },
            _universal: function(){
                var tokenStream = this._tokenStream,
                    value       = "",
                    ns;

                ns = this._namespace_prefix();
                if(ns){
                    value += ns;
                }

                if(tokenStream.match(Tokens.STAR)){
                    value += "*";
                }

                return value.length ? value : null;

           },
            _attrib: function(){

                var tokenStream = this._tokenStream,
                    value       = null,
                    ns,
                    token;

                if (tokenStream.match(Tokens.LBRACKET)){
                    token = tokenStream.token();
                    value = token.value;
                    value += this._readWhitespace();

                    ns = this._namespace_prefix();

                    if (ns){
                        value += ns;
                    }

                    tokenStream.mustMatch(Tokens.IDENT);
                    value += tokenStream.token().value;
                    value += this._readWhitespace();

                    if(tokenStream.match([Tokens.PREFIXMATCH, Tokens.SUFFIXMATCH, Tokens.SUBSTRINGMATCH,
                            Tokens.EQUALS, Tokens.INCLUDES, Tokens.DASHMATCH])){

                        value += tokenStream.token().value;
                        value += this._readWhitespace();

                        tokenStream.mustMatch([Tokens.IDENT, Tokens.STRING]);
                        value += tokenStream.token().value;
                        value += this._readWhitespace();
                    }

                    tokenStream.mustMatch(Tokens.RBRACKET);

                    return new SelectorSubPart(value + "]", "attribute", token.startLine, token.startCol);
                } else {
                    return null;
                }
            },
            _pseudo: function(){

                var tokenStream = this._tokenStream,
                    pseudo      = null,
                    colons      = ":",
                    line,
                    col;

                if (tokenStream.match(Tokens.COLON)){

                    if (tokenStream.match(Tokens.COLON)){
                        colons += ":";
                    }

                    if (tokenStream.match(Tokens.IDENT)){
                        pseudo = tokenStream.token().value;
                        line = tokenStream.token().startLine;
                        col = tokenStream.token().startCol - colons.length;
                    } else if (tokenStream.peek() == Tokens.FUNCTION){
                        line = tokenStream.LT(1).startLine;
                        col = tokenStream.LT(1).startCol - colons.length;
                        pseudo = this._functional_pseudo();
                    }

                    if (pseudo){
                        pseudo = new SelectorSubPart(colons + pseudo, "pseudo", line, col);
                    }
                }

                return pseudo;
            },
            _functional_pseudo: function(){

                var tokenStream = this._tokenStream,
                    value = null;

                if(tokenStream.match(Tokens.FUNCTION)){
                    value = tokenStream.token().value;
                    value += this._readWhitespace();
                    value += this._expression();
                    tokenStream.mustMatch(Tokens.RPAREN);
                    value += ")";
                }

                return value;
            },
            _expression: function(){

                var tokenStream = this._tokenStream,
                    value       = "";

                while(tokenStream.match([Tokens.PLUS, Tokens.MINUS, Tokens.DIMENSION,
                        Tokens.NUMBER, Tokens.STRING, Tokens.IDENT, Tokens.LENGTH,
                        Tokens.FREQ, Tokens.ANGLE, Tokens.TIME,
                        Tokens.RESOLUTION, Tokens.SLASH])){

                    value += tokenStream.token().value;
                    value += this._readWhitespace();
                }

                return value.length ? value : null;

            },
            _negation: function(){

                var tokenStream = this._tokenStream,
                    line,
                    col,
                    value       = "",
                    arg,
                    subpart     = null;

                if (tokenStream.match(Tokens.NOT)){
                    value = tokenStream.token().value;
                    line = tokenStream.token().startLine;
                    col = tokenStream.token().startCol;
                    value += this._readWhitespace();
                    arg = this._negation_arg();
                    value += arg;
                    value += this._readWhitespace();
                    tokenStream.match(Tokens.RPAREN);
                    value += tokenStream.token().value;

                    subpart = new SelectorSubPart(value, "not", line, col);
                    subpart.args.push(arg);
                }

                return subpart;
            },
            _negation_arg: function(){

                var tokenStream = this._tokenStream,
                    args        = [
                        this._type_selector,
                        this._universal,
                        function(){
                            return tokenStream.match(Tokens.HASH) ?
                                    new SelectorSubPart(tokenStream.token().value, "id", tokenStream.token().startLine, tokenStream.token().startCol) :
                                    null;
                        },
                        this._class,
                        this._attrib,
                        this._pseudo
                    ],
                    arg         = null,
                    i           = 0,
                    len         = args.length,
                    elementName,
                    line,
                    col,
                    part;

                line = tokenStream.LT(1).startLine;
                col = tokenStream.LT(1).startCol;

                while(i < len && arg === null){

                    arg = args[i].call(this);
                    i++;
                }
                if (arg === null){
                    this._unexpectedToken(tokenStream.LT(1));
                }
                if (arg.type == "elementName"){
                    part = new SelectorPart(arg, [], arg.toString(), line, col);
                } else {
                    part = new SelectorPart(null, [arg], arg.toString(), line, col);
                }

                return part;
            },

            _declaration: function(){

                var tokenStream = this._tokenStream,
                    property    = null,
                    expr        = null,
                    prio        = null,
                    error       = null,
                    invalid     = null,
                    propertyName= "";

                property = this._property();
                if (property !== null){

                    tokenStream.mustMatch(Tokens.COLON);
                    this._readWhitespace();

                    expr = this._expr();
                    if (!expr || expr.length === 0){
                        this._unexpectedToken(tokenStream.LT(1));
                    }

                    prio = this._prio();
                    propertyName = property.toString();
                    if (this.options.starHack && property.hack == "*" ||
                            this.options.underscoreHack && property.hack == "_") {

                        propertyName = property.text;
                    }

                    try {
                        this._validateProperty(propertyName, expr);
                    } catch (ex) {
                        invalid = ex;
                    }

                    this.fire({
                        type:       "property",
                        property:   property,
                        value:      expr,
                        important:  prio,
                        line:       property.line,
                        col:        property.col,
                        invalid:    invalid
                    });

                    return true;
                } else {
                    return false;
                }
            },

            _prio: function(){

                var tokenStream = this._tokenStream,
                    result      = tokenStream.match(Tokens.IMPORTANT_SYM);

                this._readWhitespace();
                return result;
            },

            _expr: function(inFunction){

                var tokenStream = this._tokenStream,
                    values      = [],
                    value       = null,
                    operator    = null;

                value = this._term(inFunction);
                if (value !== null){

                    values.push(value);

                    do {
                        operator = this._operator(inFunction);
                        if (operator){
                            values.push(operator);
                        } /*else {
                            values.push(new PropertyValue(valueParts, valueParts[0].line, valueParts[0].col));
                            valueParts = [];
                        }*/

                        value = this._term(inFunction);

                        if (value === null){
                            break;
                        } else {
                            values.push(value);
                        }
                    } while(true);
                }

                return values.length > 0 ? new PropertyValue(values, values[0].line, values[0].col) : null;
            },

            _term: function(inFunction){

                var tokenStream = this._tokenStream,
                    unary       = null,
                    value       = null,
                    endChar     = null,
                    token,
                    line,
                    col;
                unary = this._unary_operator();
                if (unary !== null){
                    line = tokenStream.token().startLine;
                    col = tokenStream.token().startCol;
                }
                if (tokenStream.peek() == Tokens.IE_FUNCTION && this.options.ieFilters){

                    value = this._ie_function();
                    if (unary === null){
                        line = tokenStream.token().startLine;
                        col = tokenStream.token().startCol;
                    }
                } else if (inFunction && tokenStream.match([Tokens.LPAREN, Tokens.LBRACE, Tokens.LBRACKET])){

                    token = tokenStream.token();
                    endChar = token.endChar;
                    value = token.value + this._expr(inFunction).text;
                    if (unary === null){
                        line = tokenStream.token().startLine;
                        col = tokenStream.token().startCol;
                    }
                    tokenStream.mustMatch(Tokens.type(endChar));
                    value += endChar;
                    this._readWhitespace();
                } else if (tokenStream.match([Tokens.NUMBER, Tokens.PERCENTAGE, Tokens.LENGTH,
                        Tokens.ANGLE, Tokens.TIME,
                        Tokens.FREQ, Tokens.STRING, Tokens.IDENT, Tokens.URI, Tokens.UNICODE_RANGE])){

                    value = tokenStream.token().value;
                    if (unary === null){
                        line = tokenStream.token().startLine;
                        col = tokenStream.token().startCol;
                    }
                    this._readWhitespace();
                } else {
                    token = this._hexcolor();
                    if (token === null){
                        if (unary === null){
                            line = tokenStream.LT(1).startLine;
                            col = tokenStream.LT(1).startCol;
                        }
                        if (value === null){
                            if (tokenStream.LA(3) == Tokens.EQUALS && this.options.ieFilters){
                                value = this._ie_function();
                            } else {
                                value = this._function();
                            }
                        }

                    } else {
                        value = token.value;
                        if (unary === null){
                            line = token.startLine;
                            col = token.startCol;
                        }
                    }

                }

                return value !== null ?
                        new PropertyValuePart(unary !== null ? unary + value : value, line, col) :
                        null;

            },

            _function: function(){

                var tokenStream = this._tokenStream,
                    functionText = null,
                    expr        = null,
                    lt;

                if (tokenStream.match(Tokens.FUNCTION)){
                    functionText = tokenStream.token().value;
                    this._readWhitespace();
                    expr = this._expr(true);
                    functionText += expr;
                    if (this.options.ieFilters && tokenStream.peek() == Tokens.EQUALS){
                        do {

                            if (this._readWhitespace()){
                                functionText += tokenStream.token().value;
                            }
                            if (tokenStream.LA(0) == Tokens.COMMA){
                                functionText += tokenStream.token().value;
                            }

                            tokenStream.match(Tokens.IDENT);
                            functionText += tokenStream.token().value;

                            tokenStream.match(Tokens.EQUALS);
                            functionText += tokenStream.token().value;
                            lt = tokenStream.peek();
                            while(lt != Tokens.COMMA && lt != Tokens.S && lt != Tokens.RPAREN){
                                tokenStream.get();
                                functionText += tokenStream.token().value;
                                lt = tokenStream.peek();
                            }
                        } while(tokenStream.match([Tokens.COMMA, Tokens.S]));
                    }

                    tokenStream.match(Tokens.RPAREN);
                    functionText += ")";
                    this._readWhitespace();
                }

                return functionText;
            },

            _ie_function: function(){

                var tokenStream = this._tokenStream,
                    functionText = null,
                    expr        = null,
                    lt;
                if (tokenStream.match([Tokens.IE_FUNCTION, Tokens.FUNCTION])){
                    functionText = tokenStream.token().value;

                    do {

                        if (this._readWhitespace()){
                            functionText += tokenStream.token().value;
                        }
                        if (tokenStream.LA(0) == Tokens.COMMA){
                            functionText += tokenStream.token().value;
                        }

                        tokenStream.match(Tokens.IDENT);
                        functionText += tokenStream.token().value;

                        tokenStream.match(Tokens.EQUALS);
                        functionText += tokenStream.token().value;
                        lt = tokenStream.peek();
                        while(lt != Tokens.COMMA && lt != Tokens.S && lt != Tokens.RPAREN){
                            tokenStream.get();
                            functionText += tokenStream.token().value;
                            lt = tokenStream.peek();
                        }
                    } while(tokenStream.match([Tokens.COMMA, Tokens.S]));

                    tokenStream.match(Tokens.RPAREN);
                    functionText += ")";
                    this._readWhitespace();
                }

                return functionText;
            },

            _hexcolor: function(){

                var tokenStream = this._tokenStream,
                    token = null,
                    color;

                if(tokenStream.match(Tokens.HASH)){

                    token = tokenStream.token();
                    color = token.value;
                    if (!/#[a-f0-9]{3,6}/i.test(color)){
                        throw new SyntaxError("Expected a hex color but found '" + color + "' at line " + token.startLine + ", col " + token.startCol + ".", token.startLine, token.startCol);
                    }
                    this._readWhitespace();
                }

                return token;
            },

            _keyframes: function(){
                var tokenStream = this._tokenStream,
                    token,
                    tt,
                    name,
                    prefix = "";

                tokenStream.mustMatch(Tokens.KEYFRAMES_SYM);
                token = tokenStream.token();
                if (/^@\-([^\-]+)\-/.test(token.value)) {
                    prefix = RegExp.$1;
                }

                this._readWhitespace();
                name = this._keyframe_name();

                this._readWhitespace();
                tokenStream.mustMatch(Tokens.LBRACE);

                this.fire({
                    type:   "startkeyframes",
                    name:   name,
                    prefix: prefix,
                    line:   token.startLine,
                    col:    token.startCol
                });

                this._readWhitespace();
                tt = tokenStream.peek();
                while(tt == Tokens.IDENT || tt == Tokens.PERCENTAGE) {
                    this._keyframe_rule();
                    this._readWhitespace();
                    tt = tokenStream.peek();
                }

                this.fire({
                    type:   "endkeyframes",
                    name:   name,
                    prefix: prefix,
                    line:   token.startLine,
                    col:    token.startCol
                });

                this._readWhitespace();
                tokenStream.mustMatch(Tokens.RBRACE);

            },

            _keyframe_name: function(){
                var tokenStream = this._tokenStream,
                    token;

                tokenStream.mustMatch([Tokens.IDENT, Tokens.STRING]);
                return SyntaxUnit.fromToken(tokenStream.token());
            },

            _keyframe_rule: function(){
                var tokenStream = this._tokenStream,
                    token,
                    keyList = this._key_list();

                this.fire({
                    type:   "startkeyframerule",
                    keys:   keyList,
                    line:   keyList[0].line,
                    col:    keyList[0].col
                });

                this._readDeclarations(true);

                this.fire({
                    type:   "endkeyframerule",
                    keys:   keyList,
                    line:   keyList[0].line,
                    col:    keyList[0].col
                });

            },

            _key_list: function(){
                var tokenStream = this._tokenStream,
                    token,
                    key,
                    keyList = [];
                keyList.push(this._key());

                this._readWhitespace();

                while(tokenStream.match(Tokens.COMMA)){
                    this._readWhitespace();
                    keyList.push(this._key());
                    this._readWhitespace();
                }

                return keyList;
            },

            _key: function(){

                var tokenStream = this._tokenStream,
                    token;

                if (tokenStream.match(Tokens.PERCENTAGE)){
                    return SyntaxUnit.fromToken(tokenStream.token());
                } else if (tokenStream.match(Tokens.IDENT)){
                    token = tokenStream.token();

                    if (/from|to/i.test(token.value)){
                        return SyntaxUnit.fromToken(token);
                    }

                    tokenStream.unget();
                }
                this._unexpectedToken(tokenStream.LT(1));
            },
            _skipCruft: function(){
                while(this._tokenStream.match([Tokens.S, Tokens.CDO, Tokens.CDC])){
                }
            },
            _readDeclarations: function(checkStart, readMargins){
                var tokenStream = this._tokenStream,
                    tt;


                this._readWhitespace();

                if (checkStart){
                    tokenStream.mustMatch(Tokens.LBRACE);
                }

                this._readWhitespace();

                try {

                    while(true){

                        if (tokenStream.match(Tokens.SEMICOLON) || (readMargins && this._margin())){
                        } else if (this._declaration()){
                            if (!tokenStream.match(Tokens.SEMICOLON)){
                                break;
                            }
                        } else {
                            break;
                        }
                        this._readWhitespace();
                    }

                    tokenStream.mustMatch(Tokens.RBRACE);
                    this._readWhitespace();

                } catch (ex) {
                    if (ex instanceof SyntaxError && !this.options.strict){
                        this.fire({
                            type:       "error",
                            error:      ex,
                            message:    ex.message,
                            line:       ex.line,
                            col:        ex.col
                        });
                        tt = tokenStream.advance([Tokens.SEMICOLON, Tokens.RBRACE]);
                        if (tt == Tokens.SEMICOLON){
                            this._readDeclarations(false, readMargins);
                        } else if (tt != Tokens.RBRACE){
                            throw ex;
                        }

                    } else {
                        throw ex;
                    }
                }

            },
            _readWhitespace: function(){

                var tokenStream = this._tokenStream,
                    ws = "";

                while(tokenStream.match(Tokens.S)){
                    ws += tokenStream.token().value;
                }

                return ws;
            },
            _unexpectedToken: function(token){
                throw new SyntaxError("Unexpected token '" + token.value + "' at line " + token.startLine + ", col " + token.startCol + ".", token.startLine, token.startCol);
            },
            _verifyEnd: function(){
                if (this._tokenStream.LA(1) != Tokens.EOF){
                    this._unexpectedToken(this._tokenStream.LT(1));
                }
            },
            _validateProperty: function(property, value){
                Validation.validate(property, value);
            },

            parse: function(input){
                this._tokenStream = new TokenStream(input, Tokens);
                this._stylesheet();
            },

            parseStyleSheet: function(input){
                return this.parse(input);
            },

            parseMediaQuery: function(input){
                this._tokenStream = new TokenStream(input, Tokens);
                var result = this._media_query();
                this._verifyEnd();
                return result;
            },
            parsePropertyValue: function(input){

                this._tokenStream = new TokenStream(input, Tokens);
                this._readWhitespace();

                var result = this._expr();
                this._readWhitespace();
                this._verifyEnd();
                return result;
            },
            parseRule: function(input){
                this._tokenStream = new TokenStream(input, Tokens);
                this._readWhitespace();

                var result = this._ruleset();
                this._readWhitespace();
                this._verifyEnd();
                return result;
            },
            parseSelector: function(input){

                this._tokenStream = new TokenStream(input, Tokens);
                this._readWhitespace();

                var result = this._selector();
                this._readWhitespace();
                this._verifyEnd();
                return result;
            },
            parseStyleAttribute: function(input){
                input += "}"; // for error recovery in _readDeclarations()
                this._tokenStream = new TokenStream(input, Tokens);
                this._readDeclarations();
            }
        };
    for (prop in additions){
        if (additions.hasOwnProperty(prop)){
            proto[prop] = additions[prop];
        }
    }

    return proto;
}();
var Properties = {
    "align-items"                   : "flex-start | flex-end | center | baseline | stretch",
    "align-content"                 : "flex-start | flex-end | center | space-between | space-around | stretch",
    "align-self"                    : "auto | flex-start | flex-end | center | baseline | stretch",
    "-webkit-align-items"           : "flex-start | flex-end | center | baseline | stretch",
    "-webkit-align-content"         : "flex-start | flex-end | center | space-between | space-around | stretch",
    "-webkit-align-self"            : "auto | flex-start | flex-end | center | baseline | stretch",
    "alignment-adjust"              : "auto | baseline | before-edge | text-before-edge | middle | central | after-edge | text-after-edge | ideographic | alphabetic | hanging | mathematical | <percentage> | <length>",
    "alignment-baseline"            : "baseline | use-script | before-edge | text-before-edge | after-edge | text-after-edge | central | middle | ideographic | alphabetic | hanging | mathematical",
    "animation"                     : 1,
    "animation-delay"               : { multi: "<time>", comma: true },
    "animation-direction"           : { multi: "normal | reverse | alternate | alternate-reverse", comma: true },
    "animation-duration"            : { multi: "<time>", comma: true },
    "animation-fill-mode"           : { multi: "none | forwards | backwards | both", comma: true },
    "animation-iteration-count"     : { multi: "<number> | infinite", comma: true },
    "animation-name"                : { multi: "none | <ident>", comma: true },
    "animation-play-state"          : { multi: "running | paused", comma: true },
    "animation-timing-function"     : 1,
    "-moz-animation-delay"               : { multi: "<time>", comma: true },
    "-moz-animation-direction"           : { multi: "normal | reverse | alternate | alternate-reverse", comma: true },
    "-moz-animation-duration"            : { multi: "<time>", comma: true },
    "-moz-animation-iteration-count"     : { multi: "<number> | infinite", comma: true },
    "-moz-animation-name"                : { multi: "none | <ident>", comma: true },
    "-moz-animation-play-state"          : { multi: "running | paused", comma: true },

    "-ms-animation-delay"               : { multi: "<time>", comma: true },
    "-ms-animation-direction"           : { multi: "normal | reverse | alternate | alternate-reverse", comma: true },
    "-ms-animation-duration"            : { multi: "<time>", comma: true },
    "-ms-animation-iteration-count"     : { multi: "<number> | infinite", comma: true },
    "-ms-animation-name"                : { multi: "none | <ident>", comma: true },
    "-ms-animation-play-state"          : { multi: "running | paused", comma: true },

    "-webkit-animation-delay"               : { multi: "<time>", comma: true },
    "-webkit-animation-direction"           : { multi: "normal | reverse | alternate | alternate-reverse", comma: true },
    "-webkit-animation-duration"            : { multi: "<time>", comma: true },
    "-webkit-animation-fill-mode"           : { multi: "none | forwards | backwards | both", comma: true },
    "-webkit-animation-iteration-count"     : { multi: "<number> | infinite", comma: true },
    "-webkit-animation-name"                : { multi: "none | <ident>", comma: true },
    "-webkit-animation-play-state"          : { multi: "running | paused", comma: true },

    "-o-animation-delay"               : { multi: "<time>", comma: true },
    "-o-animation-direction"           : { multi: "normal | reverse | alternate | alternate-reverse", comma: true },
    "-o-animation-duration"            : { multi: "<time>", comma: true },
    "-o-animation-iteration-count"     : { multi: "<number> | infinite", comma: true },
    "-o-animation-name"                : { multi: "none | <ident>", comma: true },
    "-o-animation-play-state"          : { multi: "running | paused", comma: true },

    "appearance"                    : "icon | window | desktop | workspace | document | tooltip | dialog | button | push-button | hyperlink | radio-button | checkbox | menu-item | tab | menu | menubar | pull-down-menu | pop-up-menu | list-menu | radio-group | checkbox-group | outline-tree | range | field | combo-box | signature | password | normal | none | inherit",
    "azimuth"                       : function (expression) {
        var simple      = "<angle> | leftwards | rightwards | inherit",
            direction   = "left-side | far-left | left | center-left | center | center-right | right | far-right | right-side",
            behind      = false,
            valid       = false,
            part;

        if (!ValidationTypes.isAny(expression, simple)) {
            if (ValidationTypes.isAny(expression, "behind")) {
                behind = true;
                valid = true;
            }

            if (ValidationTypes.isAny(expression, direction)) {
                valid = true;
                if (!behind) {
                    ValidationTypes.isAny(expression, "behind");
                }
            }
        }

        if (expression.hasNext()) {
            part = expression.next();
            if (valid) {
                throw new ValidationError("Expected end of value but found '" + part + "'.", part.line, part.col);
            } else {
                throw new ValidationError("Expected (<'azimuth'>) but found '" + part + "'.", part.line, part.col);
            }
        }
    },
    "backface-visibility"           : "visible | hidden",
    "background"                    : 1,
    "background-attachment"         : { multi: "<attachment>", comma: true },
    "background-clip"               : { multi: "<box>", comma: true },
    "background-color"              : "<color> | inherit",
    "background-image"              : { multi: "<bg-image>", comma: true },
    "background-origin"             : { multi: "<box>", comma: true },
    "background-position"           : { multi: "<bg-position>", comma: true },
    "background-repeat"             : { multi: "<repeat-style>" },
    "background-size"               : { multi: "<bg-size>", comma: true },
    "baseline-shift"                : "baseline | sub | super | <percentage> | <length>",
    "behavior"                      : 1,
    "binding"                       : 1,
    "bleed"                         : "<length>",
    "bookmark-label"                : "<content> | <attr> | <string>",
    "bookmark-level"                : "none | <integer>",
    "bookmark-state"                : "open | closed",
    "bookmark-target"               : "none | <uri> | <attr>",
    "border"                        : "<border-width> || <border-style> || <color>",
    "border-bottom"                 : "<border-width> || <border-style> || <color>",
    "border-bottom-color"           : "<color> | inherit",
    "border-bottom-left-radius"     :  "<x-one-radius>",
    "border-bottom-right-radius"    :  "<x-one-radius>",
    "border-bottom-style"           : "<border-style>",
    "border-bottom-width"           : "<border-width>",
    "border-collapse"               : "collapse | separate | inherit",
    "border-color"                  : { multi: "<color> | inherit", max: 4 },
    "border-image"                  : 1,
    "border-image-outset"           : { multi: "<length> | <number>", max: 4 },
    "border-image-repeat"           : { multi: "stretch | repeat | round", max: 2 },
    "border-image-slice"            : function(expression) {

        var valid   = false,
            numeric = "<number> | <percentage>",
            fill    = false,
            count   = 0,
            max     = 4,
            part;

        if (ValidationTypes.isAny(expression, "fill")) {
            fill = true;
            valid = true;
        }

        while (expression.hasNext() && count < max) {
            valid = ValidationTypes.isAny(expression, numeric);
            if (!valid) {
                break;
            }
            count++;
        }


        if (!fill) {
            ValidationTypes.isAny(expression, "fill");
        } else {
            valid = true;
        }

        if (expression.hasNext()) {
            part = expression.next();
            if (valid) {
                throw new ValidationError("Expected end of value but found '" + part + "'.", part.line, part.col);
            } else {
                throw new ValidationError("Expected ([<number> | <percentage>]{1,4} && fill?) but found '" + part + "'.", part.line, part.col);
            }
        }
    },
    "border-image-source"           : "<image> | none",
    "border-image-width"            : { multi: "<length> | <percentage> | <number> | auto", max: 4 },
    "border-left"                   : "<border-width> || <border-style> || <color>",
    "border-left-color"             : "<color> | inherit",
    "border-left-style"             : "<border-style>",
    "border-left-width"             : "<border-width>",
    "border-radius"                 : function(expression) {

        var valid   = false,
            simple = "<length> | <percentage> | inherit",
            slash   = false,
            fill    = false,
            count   = 0,
            max     = 8,
            part;

        while (expression.hasNext() && count < max) {
            valid = ValidationTypes.isAny(expression, simple);
            if (!valid) {

                if (expression.peek() == "/" && count > 0 && !slash) {
                    slash = true;
                    max = count + 5;
                    expression.next();
                } else {
                    break;
                }
            }
            count++;
        }

        if (expression.hasNext()) {
            part = expression.next();
            if (valid) {
                throw new ValidationError("Expected end of value but found '" + part + "'.", part.line, part.col);
            } else {
                throw new ValidationError("Expected (<'border-radius'>) but found '" + part + "'.", part.line, part.col);
            }
        }
    },
    "border-right"                  : "<border-width> || <border-style> || <color>",
    "border-right-color"            : "<color> | inherit",
    "border-right-style"            : "<border-style>",
    "border-right-width"            : "<border-width>",
    "border-spacing"                : { multi: "<length> | inherit", max: 2 },
    "border-style"                  : { multi: "<border-style>", max: 4 },
    "border-top"                    : "<border-width> || <border-style> || <color>",
    "border-top-color"              : "<color> | inherit",
    "border-top-left-radius"        : "<x-one-radius>",
    "border-top-right-radius"       : "<x-one-radius>",
    "border-top-style"              : "<border-style>",
    "border-top-width"              : "<border-width>",
    "border-width"                  : { multi: "<border-width>", max: 4 },
    "bottom"                        : "<margin-width> | inherit",
    "-moz-box-align"                : "start | end | center | baseline | stretch",
    "-moz-box-decoration-break"     : "slice |clone",
    "-moz-box-direction"            : "normal | reverse | inherit",
    "-moz-box-flex"                 : "<number>",
    "-moz-box-flex-group"           : "<integer>",
    "-moz-box-lines"                : "single | multiple",
    "-moz-box-ordinal-group"        : "<integer>",
    "-moz-box-orient"               : "horizontal | vertical | inline-axis | block-axis | inherit",
    "-moz-box-pack"                 : "start | end | center | justify",
    "-webkit-box-align"             : "start | end | center | baseline | stretch",
    "-webkit-box-decoration-break"  : "slice |clone",
    "-webkit-box-direction"         : "normal | reverse | inherit",
    "-webkit-box-flex"              : "<number>",
    "-webkit-box-flex-group"        : "<integer>",
    "-webkit-box-lines"             : "single | multiple",
    "-webkit-box-ordinal-group"     : "<integer>",
    "-webkit-box-orient"            : "horizontal | vertical | inline-axis | block-axis | inherit",
    "-webkit-box-pack"              : "start | end | center | justify",
    "box-shadow"                    : function (expression) {
        var result      = false,
            part;

        if (!ValidationTypes.isAny(expression, "none")) {
            Validation.multiProperty("<shadow>", expression, true, Infinity);
        } else {
            if (expression.hasNext()) {
                part = expression.next();
                throw new ValidationError("Expected end of value but found '" + part + "'.", part.line, part.col);
            }
        }
    },
    "box-sizing"                    : "content-box | border-box | inherit",
    "break-after"                   : "auto | always | avoid | left | right | page | column | avoid-page | avoid-column",
    "break-before"                  : "auto | always | avoid | left | right | page | column | avoid-page | avoid-column",
    "break-inside"                  : "auto | avoid | avoid-page | avoid-column",
    "caption-side"                  : "top | bottom | inherit",
    "clear"                         : "none | right | left | both | inherit",
    "clip"                          : 1,
    "color"                         : "<color> | inherit",
    "color-profile"                 : 1,
    "column-count"                  : "<integer> | auto",                      //http://www.w3.org/TR/css3-multicol/
    "column-fill"                   : "auto | balance",
    "column-gap"                    : "<length> | normal",
    "column-rule"                   : "<border-width> || <border-style> || <color>",
    "column-rule-color"             : "<color>",
    "column-rule-style"             : "<border-style>",
    "column-rule-width"             : "<border-width>",
    "column-span"                   : "none | all",
    "column-width"                  : "<length> | auto",
    "columns"                       : 1,
    "content"                       : 1,
    "counter-increment"             : 1,
    "counter-reset"                 : 1,
    "crop"                          : "<shape> | auto",
    "cue"                           : "cue-after | cue-before | inherit",
    "cue-after"                     : 1,
    "cue-before"                    : 1,
    "cursor"                        : 1,
    "direction"                     : "ltr | rtl | inherit",
    "display"                       : "inline | block | list-item | inline-block | table | inline-table | table-row-group | table-header-group | table-footer-group | table-row | table-column-group | table-column | table-cell | table-caption | grid | inline-grid | none | inherit | -moz-box | -moz-inline-block | -moz-inline-box | -moz-inline-grid | -moz-inline-stack | -moz-inline-table | -moz-grid | -moz-grid-group | -moz-grid-line | -moz-groupbox | -moz-deck | -moz-popup | -moz-stack | -moz-marker | -webkit-box | -webkit-inline-box | -ms-flexbox | -ms-inline-flexbox | flex | -webkit-flex | inline-flex | -webkit-inline-flex",
    "dominant-baseline"             : 1,
    "drop-initial-after-adjust"     : "central | middle | after-edge | text-after-edge | ideographic | alphabetic | mathematical | <percentage> | <length>",
    "drop-initial-after-align"      : "baseline | use-script | before-edge | text-before-edge | after-edge | text-after-edge | central | middle | ideographic | alphabetic | hanging | mathematical",
    "drop-initial-before-adjust"    : "before-edge | text-before-edge | central | middle | hanging | mathematical | <percentage> | <length>",
    "drop-initial-before-align"     : "caps-height | baseline | use-script | before-edge | text-before-edge | after-edge | text-after-edge | central | middle | ideographic | alphabetic | hanging | mathematical",
    "drop-initial-size"             : "auto | line | <length> | <percentage>",
    "drop-initial-value"            : "initial | <integer>",
    "elevation"                     : "<angle> | below | level | above | higher | lower | inherit",
    "empty-cells"                   : "show | hide | inherit",
    "filter"                        : 1,
    "fit"                           : "fill | hidden | meet | slice",
    "fit-position"                  : 1,
    "flex"                          : "<flex>",
    "flex-basis"                    : "<width>",
    "flex-direction"                : "row | row-reverse | column | column-reverse",
    "flex-flow"                     : "<flex-direction> || <flex-wrap>",
    "flex-grow"                     : "<number>",
    "flex-shrink"                   : "<number>",
    "flex-wrap"                     : "nowrap | wrap | wrap-reverse",
    "-webkit-flex"                  : "<flex>",
    "-webkit-flex-basis"            : "<width>",
    "-webkit-flex-direction"        : "row | row-reverse | column | column-reverse",
    "-webkit-flex-flow"             : "<flex-direction> || <flex-wrap>",
    "-webkit-flex-grow"             : "<number>",
    "-webkit-flex-shrink"           : "<number>",
    "-webkit-flex-wrap"             : "nowrap | wrap | wrap-reverse",
    "-ms-flex"                      : "<flex>",
    "-ms-flex-align"                : "start | end | center | stretch | baseline",
    "-ms-flex-direction"            : "row | row-reverse | column | column-reverse | inherit",
    "-ms-flex-order"                : "<number>",
    "-ms-flex-pack"                 : "start | end | center | justify",
    "-ms-flex-wrap"                 : "nowrap | wrap | wrap-reverse",
    "float"                         : "left | right | none | inherit",
    "float-offset"                  : 1,
    "font"                          : 1,
    "font-family"                   : 1,
    "font-size"                     : "<absolute-size> | <relative-size> | <length> | <percentage> | inherit",
    "font-size-adjust"              : "<number> | none | inherit",
    "font-stretch"                  : "normal | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded | inherit",
    "font-style"                    : "normal | italic | oblique | inherit",
    "font-variant"                  : "normal | small-caps | inherit",
    "font-weight"                   : "normal | bold | bolder | lighter | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | inherit",
    "grid-cell-stacking"            : "columns | rows | layer",
    "grid-column"                   : 1,
    "grid-columns"                  : 1,
    "grid-column-align"             : "start | end | center | stretch",
    "grid-column-sizing"            : 1,
    "grid-column-span"              : "<integer>",
    "grid-flow"                     : "none | rows | columns",
    "grid-layer"                    : "<integer>",
    "grid-row"                      : 1,
    "grid-rows"                     : 1,
    "grid-row-align"                : "start | end | center | stretch",
    "grid-row-span"                 : "<integer>",
    "grid-row-sizing"               : 1,
    "hanging-punctuation"           : 1,
    "height"                        : "<margin-width> | <content-sizing> | inherit",
    "hyphenate-after"               : "<integer> | auto",
    "hyphenate-before"              : "<integer> | auto",
    "hyphenate-character"           : "<string> | auto",
    "hyphenate-lines"               : "no-limit | <integer>",
    "hyphenate-resource"            : 1,
    "hyphens"                       : "none | manual | auto",
    "icon"                          : 1,
    "image-orientation"             : "angle | auto",
    "image-rendering"               : 1,
    "image-resolution"              : 1,
    "inline-box-align"              : "initial | last | <integer>",
    "justify-content"               : "flex-start | flex-end | center | space-between | space-around",
    "-webkit-justify-content"       : "flex-start | flex-end | center | space-between | space-around",
    "left"                          : "<margin-width> | inherit",
    "letter-spacing"                : "<length> | normal | inherit",
    "line-height"                   : "<number> | <length> | <percentage> | normal | inherit",
    "line-break"                    : "auto | loose | normal | strict",
    "line-stacking"                 : 1,
    "line-stacking-ruby"            : "exclude-ruby | include-ruby",
    "line-stacking-shift"           : "consider-shifts | disregard-shifts",
    "line-stacking-strategy"        : "inline-line-height | block-line-height | max-height | grid-height",
    "list-style"                    : 1,
    "list-style-image"              : "<uri> | none | inherit",
    "list-style-position"           : "inside | outside | inherit",
    "list-style-type"               : "disc | circle | square | decimal | decimal-leading-zero | lower-roman | upper-roman | lower-greek | lower-latin | upper-latin | armenian | georgian | lower-alpha | upper-alpha | none | inherit",
    "margin"                        : { multi: "<margin-width> | inherit", max: 4 },
    "margin-bottom"                 : "<margin-width> | inherit",
    "margin-left"                   : "<margin-width> | inherit",
    "margin-right"                  : "<margin-width> | inherit",
    "margin-top"                    : "<margin-width> | inherit",
    "mark"                          : 1,
    "mark-after"                    : 1,
    "mark-before"                   : 1,
    "marks"                         : 1,
    "marquee-direction"             : 1,
    "marquee-play-count"            : 1,
    "marquee-speed"                 : 1,
    "marquee-style"                 : 1,
    "max-height"                    : "<length> | <percentage> | <content-sizing> | none | inherit",
    "max-width"                     : "<length> | <percentage> | <content-sizing> | none | inherit",
    "min-height"                    : "<length> | <percentage> | <content-sizing> | contain-floats | -moz-contain-floats | -webkit-contain-floats | inherit",
    "min-width"                     : "<length> | <percentage> | <content-sizing> | contain-floats | -moz-contain-floats | -webkit-contain-floats | inherit",
    "move-to"                       : 1,
    "nav-down"                      : 1,
    "nav-index"                     : 1,
    "nav-left"                      : 1,
    "nav-right"                     : 1,
    "nav-up"                        : 1,
    "opacity"                       : "<number> | inherit",
    "order"                         : "<integer>",
    "-webkit-order"                 : "<integer>",
    "orphans"                       : "<integer> | inherit",
    "outline"                       : 1,
    "outline-color"                 : "<color> | invert | inherit",
    "outline-offset"                : 1,
    "outline-style"                 : "<border-style> | inherit",
    "outline-width"                 : "<border-width> | inherit",
    "overflow"                      : "visible | hidden | scroll | auto | inherit",
    "overflow-style"                : 1,
    "overflow-wrap"                 : "normal | break-word",
    "overflow-x"                    : 1,
    "overflow-y"                    : 1,
    "padding"                       : { multi: "<padding-width> | inherit", max: 4 },
    "padding-bottom"                : "<padding-width> | inherit",
    "padding-left"                  : "<padding-width> | inherit",
    "padding-right"                 : "<padding-width> | inherit",
    "padding-top"                   : "<padding-width> | inherit",
    "page"                          : 1,
    "page-break-after"              : "auto | always | avoid | left | right | inherit",
    "page-break-before"             : "auto | always | avoid | left | right | inherit",
    "page-break-inside"             : "auto | avoid | inherit",
    "page-policy"                   : 1,
    "pause"                         : 1,
    "pause-after"                   : 1,
    "pause-before"                  : 1,
    "perspective"                   : 1,
    "perspective-origin"            : 1,
    "phonemes"                      : 1,
    "pitch"                         : 1,
    "pitch-range"                   : 1,
    "play-during"                   : 1,
    "pointer-events"                : "auto | none | visiblePainted | visibleFill | visibleStroke | visible | painted | fill | stroke | all | inherit",
    "position"                      : "static | relative | absolute | fixed | inherit",
    "presentation-level"            : 1,
    "punctuation-trim"              : 1,
    "quotes"                        : 1,
    "rendering-intent"              : 1,
    "resize"                        : 1,
    "rest"                          : 1,
    "rest-after"                    : 1,
    "rest-before"                   : 1,
    "richness"                      : 1,
    "right"                         : "<margin-width> | inherit",
    "rotation"                      : 1,
    "rotation-point"                : 1,
    "ruby-align"                    : 1,
    "ruby-overhang"                 : 1,
    "ruby-position"                 : 1,
    "ruby-span"                     : 1,
    "size"                          : 1,
    "speak"                         : "normal | none | spell-out | inherit",
    "speak-header"                  : "once | always | inherit",
    "speak-numeral"                 : "digits | continuous | inherit",
    "speak-punctuation"             : "code | none | inherit",
    "speech-rate"                   : 1,
    "src"                           : 1,
    "stress"                        : 1,
    "string-set"                    : 1,

    "table-layout"                  : "auto | fixed | inherit",
    "tab-size"                      : "<integer> | <length>",
    "target"                        : 1,
    "target-name"                   : 1,
    "target-new"                    : 1,
    "target-position"               : 1,
    "text-align"                    : "left | right | center | justify | inherit" ,
    "text-align-last"               : 1,
    "text-decoration"               : 1,
    "text-emphasis"                 : 1,
    "text-height"                   : 1,
    "text-indent"                   : "<length> | <percentage> | inherit",
    "text-justify"                  : "auto | none | inter-word | inter-ideograph | inter-cluster | distribute | kashida",
    "text-outline"                  : 1,
    "text-overflow"                 : 1,
    "text-rendering"                : "auto | optimizeSpeed | optimizeLegibility | geometricPrecision | inherit",
    "text-shadow"                   : 1,
    "text-transform"                : "capitalize | uppercase | lowercase | none | inherit",
    "text-wrap"                     : "normal | none | avoid",
    "top"                           : "<margin-width> | inherit",
    "-ms-touch-action"              : "auto | none | pan-x | pan-y",
    "touch-action"                  : "auto | none | pan-x | pan-y",
    "transform"                     : 1,
    "transform-origin"              : 1,
    "transform-style"               : 1,
    "transition"                    : 1,
    "transition-delay"              : 1,
    "transition-duration"           : 1,
    "transition-property"           : 1,
    "transition-timing-function"    : 1,
    "unicode-bidi"                  : "normal | embed | isolate | bidi-override | isolate-override | plaintext | inherit",
    "user-modify"                   : "read-only | read-write | write-only | inherit",
    "user-select"                   : "none | text | toggle | element | elements | all | inherit",
    "vertical-align"                : "auto | use-script | baseline | sub | super | top | text-top | central | middle | bottom | text-bottom | <percentage> | <length>",
    "visibility"                    : "visible | hidden | collapse | inherit",
    "voice-balance"                 : 1,
    "voice-duration"                : 1,
    "voice-family"                  : 1,
    "voice-pitch"                   : 1,
    "voice-pitch-range"             : 1,
    "voice-rate"                    : 1,
    "voice-stress"                  : 1,
    "voice-volume"                  : 1,
    "volume"                        : 1,
    "white-space"                   : "normal | pre | nowrap | pre-wrap | pre-line | inherit | -pre-wrap | -o-pre-wrap | -moz-pre-wrap | -hp-pre-wrap", //http://perishablepress.com/wrapping-content/
    "white-space-collapse"          : 1,
    "widows"                        : "<integer> | inherit",
    "width"                         : "<length> | <percentage> | <content-sizing> | auto | inherit",
    "word-break"                    : "normal | keep-all | break-all",
    "word-spacing"                  : "<length> | normal | inherit",
    "word-wrap"                     : "normal | break-word",
    "writing-mode"                  : "horizontal-tb | vertical-rl | vertical-lr | lr-tb | rl-tb | tb-rl | bt-rl | tb-lr | bt-lr | lr-bt | rl-bt | lr | rl | tb | inherit",
    "z-index"                       : "<integer> | auto | inherit",
    "zoom"                          : "<number> | <percentage> | normal"
};
function PropertyName(text, hack, line, col){

    SyntaxUnit.call(this, text, line, col, Parser.PROPERTY_NAME_TYPE);
    this.hack = hack;

}

PropertyName.prototype = new SyntaxUnit();
PropertyName.prototype.constructor = PropertyName;
PropertyName.prototype.toString = function(){
    return (this.hack ? this.hack : "") + this.text;
};
function PropertyValue(parts, line, col){

    SyntaxUnit.call(this, parts.join(" "), line, col, Parser.PROPERTY_VALUE_TYPE);
    this.parts = parts;

}

PropertyValue.prototype = new SyntaxUnit();
PropertyValue.prototype.constructor = PropertyValue;
function PropertyValueIterator(value){
    this._i = 0;
    this._parts = value.parts;
    this._marks = [];
    this.value = value;

}
PropertyValueIterator.prototype.count = function(){
    return this._parts.length;
};
PropertyValueIterator.prototype.isFirst = function(){
    return this._i === 0;
};
PropertyValueIterator.prototype.hasNext = function(){
    return (this._i < this._parts.length);
};
PropertyValueIterator.prototype.mark = function(){
    this._marks.push(this._i);
};
PropertyValueIterator.prototype.peek = function(count){
    return this.hasNext() ? this._parts[this._i + (count || 0)] : null;
};
PropertyValueIterator.prototype.next = function(){
    return this.hasNext() ? this._parts[this._i++] : null;
};
PropertyValueIterator.prototype.previous = function(){
    return this._i > 0 ? this._parts[--this._i] : null;
};
PropertyValueIterator.prototype.restore = function(){
    if (this._marks.length){
        this._i = this._marks.pop();
    }
};
function PropertyValuePart(text, line, col){

    SyntaxUnit.call(this, text, line, col, Parser.PROPERTY_VALUE_PART_TYPE);
    this.type = "unknown";

    var temp;
    if (/^([+\-]?[\d\.]+)([a-z]+)$/i.test(text)){  //dimension
        this.type = "dimension";
        this.value = +RegExp.$1;
        this.units = RegExp.$2;
        switch(this.units.toLowerCase()){

            case "em":
            case "rem":
            case "ex":
            case "px":
            case "cm":
            case "mm":
            case "in":
            case "pt":
            case "pc":
            case "ch":
            case "vh":
            case "vw":
            case "vmax":
            case "vmin":
                this.type = "length";
                break;

            case "deg":
            case "rad":
            case "grad":
                this.type = "angle";
                break;

            case "ms":
            case "s":
                this.type = "time";
                break;

            case "hz":
            case "khz":
                this.type = "frequency";
                break;

            case "dpi":
            case "dpcm":
                this.type = "resolution";
                break;

        }

    } else if (/^([+\-]?[\d\.]+)%$/i.test(text)){  //percentage
        this.type = "percentage";
        this.value = +RegExp.$1;
    } else if (/^([+\-]?\d+)$/i.test(text)){  //integer
        this.type = "integer";
        this.value = +RegExp.$1;
    } else if (/^([+\-]?[\d\.]+)$/i.test(text)){  //number
        this.type = "number";
        this.value = +RegExp.$1;

    } else if (/^#([a-f0-9]{3,6})/i.test(text)){  //hexcolor
        this.type = "color";
        temp = RegExp.$1;
        if (temp.length == 3){
            this.red    = parseInt(temp.charAt(0)+temp.charAt(0),16);
            this.green  = parseInt(temp.charAt(1)+temp.charAt(1),16);
            this.blue   = parseInt(temp.charAt(2)+temp.charAt(2),16);
        } else {
            this.red    = parseInt(temp.substring(0,2),16);
            this.green  = parseInt(temp.substring(2,4),16);
            this.blue   = parseInt(temp.substring(4,6),16);
        }
    } else if (/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i.test(text)){ //rgb() color with absolute numbers
        this.type   = "color";
        this.red    = +RegExp.$1;
        this.green  = +RegExp.$2;
        this.blue   = +RegExp.$3;
    } else if (/^rgb\(\s*(\d+)%\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i.test(text)){ //rgb() color with percentages
        this.type   = "color";
        this.red    = +RegExp.$1 * 255 / 100;
        this.green  = +RegExp.$2 * 255 / 100;
        this.blue   = +RegExp.$3 * 255 / 100;
    } else if (/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d\.]+)\s*\)/i.test(text)){ //rgba() color with absolute numbers
        this.type   = "color";
        this.red    = +RegExp.$1;
        this.green  = +RegExp.$2;
        this.blue   = +RegExp.$3;
        this.alpha  = +RegExp.$4;
    } else if (/^rgba\(\s*(\d+)%\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*([\d\.]+)\s*\)/i.test(text)){ //rgba() color with percentages
        this.type   = "color";
        this.red    = +RegExp.$1 * 255 / 100;
        this.green  = +RegExp.$2 * 255 / 100;
        this.blue   = +RegExp.$3 * 255 / 100;
        this.alpha  = +RegExp.$4;
    } else if (/^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i.test(text)){ //hsl()
        this.type   = "color";
        this.hue    = +RegExp.$1;
        this.saturation = +RegExp.$2 / 100;
        this.lightness  = +RegExp.$3 / 100;
    } else if (/^hsla\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*([\d\.]+)\s*\)/i.test(text)){ //hsla() color with percentages
        this.type   = "color";
        this.hue    = +RegExp.$1;
        this.saturation = +RegExp.$2 / 100;
        this.lightness  = +RegExp.$3 / 100;
        this.alpha  = +RegExp.$4;
    } else if (/^url\(["']?([^\)"']+)["']?\)/i.test(text)){ //URI
        this.type   = "uri";
        this.uri    = RegExp.$1;
    } else if (/^([^\(]+)\(/i.test(text)){
        this.type   = "function";
        this.name   = RegExp.$1;
        this.value  = text;
    } else if (/^["'][^"']*["']/.test(text)){    //string
        this.type   = "string";
        this.value  = eval(text);
    } else if (Colors[text.toLowerCase()]){  //named color
        this.type   = "color";
        temp        = Colors[text.toLowerCase()].substring(1);
        this.red    = parseInt(temp.substring(0,2),16);
        this.green  = parseInt(temp.substring(2,4),16);
        this.blue   = parseInt(temp.substring(4,6),16);
    } else if (/^[\,\/]$/.test(text)){
        this.type   = "operator";
        this.value  = text;
    } else if (/^[a-z\-_\u0080-\uFFFF][a-z0-9\-_\u0080-\uFFFF]*$/i.test(text)){
        this.type   = "identifier";
        this.value  = text;
    }

}

PropertyValuePart.prototype = new SyntaxUnit();
PropertyValuePart.prototype.constructor = PropertyValuePart;
PropertyValuePart.fromToken = function(token){
    return new PropertyValuePart(token.value, token.startLine, token.startCol);
};
var Pseudos = {
    ":first-letter": 1,
    ":first-line":   1,
    ":before":       1,
    ":after":        1
};

Pseudos.ELEMENT = 1;
Pseudos.CLASS = 2;

Pseudos.isElement = function(pseudo){
    return pseudo.indexOf("::") === 0 || Pseudos[pseudo.toLowerCase()] == Pseudos.ELEMENT;
};
function Selector(parts, line, col){

    SyntaxUnit.call(this, parts.join(" "), line, col, Parser.SELECTOR_TYPE);
    this.parts = parts;
    this.specificity = Specificity.calculate(this);

}

Selector.prototype = new SyntaxUnit();
Selector.prototype.constructor = Selector;
function SelectorPart(elementName, modifiers, text, line, col){

    SyntaxUnit.call(this, text, line, col, Parser.SELECTOR_PART_TYPE);
    this.elementName = elementName;
    this.modifiers = modifiers;

}

SelectorPart.prototype = new SyntaxUnit();
SelectorPart.prototype.constructor = SelectorPart;
function SelectorSubPart(text, type, line, col){

    SyntaxUnit.call(this, text, line, col, Parser.SELECTOR_SUB_PART_TYPE);
    this.type = type;
    this.args = [];

}

SelectorSubPart.prototype = new SyntaxUnit();
SelectorSubPart.prototype.constructor = SelectorSubPart;
function Specificity(a, b, c, d){
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
}

Specificity.prototype = {
    constructor: Specificity,
    compare: function(other){
        var comps = ["a", "b", "c", "d"],
            i, len;

        for (i=0, len=comps.length; i < len; i++){
            if (this[comps[i]] < other[comps[i]]){
                return -1;
            } else if (this[comps[i]] > other[comps[i]]){
                return 1;
            }
        }

        return 0;
    },
    valueOf: function(){
        return (this.a * 1000) + (this.b * 100) + (this.c * 10) + this.d;
    },
    toString: function(){
        return this.a + "," + this.b + "," + this.c + "," + this.d;
    }

};
Specificity.calculate = function(selector){

    var i, len,
        part,
        b=0, c=0, d=0;

    function updateValues(part){

        var i, j, len, num,
            elementName = part.elementName ? part.elementName.text : "",
            modifier;

        if (elementName && elementName.charAt(elementName.length-1) != "*") {
            d++;
        }

        for (i=0, len=part.modifiers.length; i < len; i++){
            modifier = part.modifiers[i];
            switch(modifier.type){
                case "class":
                case "attribute":
                    c++;
                    break;

                case "id":
                    b++;
                    break;

                case "pseudo":
                    if (Pseudos.isElement(modifier.text)){
                        d++;
                    } else {
                        c++;
                    }
                    break;

                case "not":
                    for (j=0, num=modifier.args.length; j < num; j++){
                        updateValues(modifier.args[j]);
                    }
            }
         }
    }

    for (i=0, len=selector.parts.length; i < len; i++){
        part = selector.parts[i];

        if (part instanceof SelectorPart){
            updateValues(part);
        }
    }

    return new Specificity(0, b, c, d);
};

var h = /^[0-9a-fA-F]$/,
    nonascii = /^[\u0080-\uFFFF]$/,
    nl = /\n|\r\n|\r|\f/;


function isHexDigit(c){
    return c !== null && h.test(c);
}

function isDigit(c){
    return c !== null && /\d/.test(c);
}

function isWhitespace(c){
    return c !== null && /\s/.test(c);
}

function isNewLine(c){
    return c !== null && nl.test(c);
}

function isNameStart(c){
    return c !== null && (/[a-z_\u0080-\uFFFF\\]/i.test(c));
}

function isNameChar(c){
    return c !== null && (isNameStart(c) || /[0-9\-\\]/.test(c));
}

function isIdentStart(c){
    return c !== null && (isNameStart(c) || /\-\\/.test(c));
}

function mix(receiver, supplier){
    for (var prop in supplier){
        if (supplier.hasOwnProperty(prop)){
            receiver[prop] = supplier[prop];
        }
    }
    return receiver;
}
function TokenStream(input){
    TokenStreamBase.call(this, input, Tokens);
}

TokenStream.prototype = mix(new TokenStreamBase(), {
    _getToken: function(channel){

        var c,
            reader = this._reader,
            token   = null,
            startLine   = reader.getLine(),
            startCol    = reader.getCol();

        c = reader.read();


        while(c){
            switch(c){
                case "/":

                    if(reader.peek() == "*"){
                        token = this.commentToken(c, startLine, startCol);
                    } else {
                        token = this.charToken(c, startLine, startCol);
                    }
                    break;
                case "|":
                case "~":
                case "^":
                case "$":
                case "*":
                    if(reader.peek() == "="){
                        token = this.comparisonToken(c, startLine, startCol);
                    } else {
                        token = this.charToken(c, startLine, startCol);
                    }
                    break;
                case "\"":
                case "'":
                    token = this.stringToken(c, startLine, startCol);
                    break;
                case "#":
                    if (isNameChar(reader.peek())){
                        token = this.hashToken(c, startLine, startCol);
                    } else {
                        token = this.charToken(c, startLine, startCol);
                    }
                    break;
                case ".":
                    if (isDigit(reader.peek())){
                        token = this.numberToken(c, startLine, startCol);
                    } else {
                        token = this.charToken(c, startLine, startCol);
                    }
                    break;
                case "-":
                    if (reader.peek() == "-"){  //could be closing HTML-style comment
                        token = this.htmlCommentEndToken(c, startLine, startCol);
                    } else if (isNameStart(reader.peek())){
                        token = this.identOrFunctionToken(c, startLine, startCol);
                    } else {
                        token = this.charToken(c, startLine, startCol);
                    }
                    break;
                case "!":
                    token = this.importantToken(c, startLine, startCol);
                    break;
                case "@":
                    token = this.atRuleToken(c, startLine, startCol);
                    break;
                case ":":
                    token = this.notToken(c, startLine, startCol);
                    break;
                case "<":
                    token = this.htmlCommentStartToken(c, startLine, startCol);
                    break;
                case "U":
                case "u":
                    if (reader.peek() == "+"){
                        token = this.unicodeRangeToken(c, startLine, startCol);
                        break;
                    }
                default:
                    if (isDigit(c)){
                        token = this.numberToken(c, startLine, startCol);
                    } else
                    if (isWhitespace(c)){
                        token = this.whitespaceToken(c, startLine, startCol);
                    } else
                    if (isIdentStart(c)){
                        token = this.identOrFunctionToken(c, startLine, startCol);
                    } else
                    {
                        token = this.charToken(c, startLine, startCol);
                    }






            }
            break;
        }

        if (!token && c === null){
            token = this.createToken(Tokens.EOF,null,startLine,startCol);
        }

        return token;
    },
    createToken: function(tt, value, startLine, startCol, options){
        var reader = this._reader;
        options = options || {};

        return {
            value:      value,
            type:       tt,
            channel:    options.channel,
            endChar:    options.endChar,
            hide:       options.hide || false,
            startLine:  startLine,
            startCol:   startCol,
            endLine:    reader.getLine(),
            endCol:     reader.getCol()
        };
    },
    atRuleToken: function(first, startLine, startCol){
        var rule    = first,
            reader  = this._reader,
            tt      = Tokens.CHAR,
            valid   = false,
            ident,
            c;
        reader.mark();
        ident = this.readName();
        rule = first + ident;
        tt = Tokens.type(rule.toLowerCase());
        if (tt == Tokens.CHAR || tt == Tokens.UNKNOWN){
            if (rule.length > 1){
                tt = Tokens.UNKNOWN_SYM;
            } else {
                tt = Tokens.CHAR;
                rule = first;
                reader.reset();
            }
        }

        return this.createToken(tt, rule, startLine, startCol);
    },
    charToken: function(c, startLine, startCol){
        var tt = Tokens.type(c);
        var opts = {};

        if (tt == -1){
            tt = Tokens.CHAR;
        } else {
            opts.endChar = Tokens[tt].endChar;
        }

        return this.createToken(tt, c, startLine, startCol, opts);
    },
    commentToken: function(first, startLine, startCol){
        var reader  = this._reader,
            comment = this.readComment(first);

        return this.createToken(Tokens.COMMENT, comment, startLine, startCol);
    },
    comparisonToken: function(c, startLine, startCol){
        var reader  = this._reader,
            comparison  = c + reader.read(),
            tt      = Tokens.type(comparison) || Tokens.CHAR;

        return this.createToken(tt, comparison, startLine, startCol);
    },
    hashToken: function(first, startLine, startCol){
        var reader  = this._reader,
            name    = this.readName(first);

        return this.createToken(Tokens.HASH, name, startLine, startCol);
    },
    htmlCommentStartToken: function(first, startLine, startCol){
        var reader      = this._reader,
            text        = first;

        reader.mark();
        text += reader.readCount(3);

        if (text == "<!--"){
            return this.createToken(Tokens.CDO, text, startLine, startCol);
        } else {
            reader.reset();
            return this.charToken(first, startLine, startCol);
        }
    },
    htmlCommentEndToken: function(first, startLine, startCol){
        var reader      = this._reader,
            text        = first;

        reader.mark();
        text += reader.readCount(2);

        if (text == "-->"){
            return this.createToken(Tokens.CDC, text, startLine, startCol);
        } else {
            reader.reset();
            return this.charToken(first, startLine, startCol);
        }
    },
    identOrFunctionToken: function(first, startLine, startCol){
        var reader  = this._reader,
            ident   = this.readName(first),
            tt      = Tokens.IDENT;
        if (reader.peek() == "("){
            ident += reader.read();
            if (ident.toLowerCase() == "url("){
                tt = Tokens.URI;
                ident = this.readURI(ident);
                if (ident.toLowerCase() == "url("){
                    tt = Tokens.FUNCTION;
                }
            } else {
                tt = Tokens.FUNCTION;
            }
        } else if (reader.peek() == ":"){  //might be an IE function
            if (ident.toLowerCase() == "progid"){
                ident += reader.readTo("(");
                tt = Tokens.IE_FUNCTION;
            }
        }

        return this.createToken(tt, ident, startLine, startCol);
    },
    importantToken: function(first, startLine, startCol){
        var reader      = this._reader,
            important   = first,
            tt          = Tokens.CHAR,
            temp,
            c;

        reader.mark();
        c = reader.read();

        while(c){
            if (c == "/"){
                if (reader.peek() != "*"){
                    break;
                } else {
                    temp = this.readComment(c);
                    if (temp === ""){    //broken!
                        break;
                    }
                }
            } else if (isWhitespace(c)){
                important += c + this.readWhitespace();
            } else if (/i/i.test(c)){
                temp = reader.readCount(8);
                if (/mportant/i.test(temp)){
                    important += c + temp;
                    tt = Tokens.IMPORTANT_SYM;

                }
                break;  //we're done
            } else {
                break;
            }

            c = reader.read();
        }

        if (tt == Tokens.CHAR){
            reader.reset();
            return this.charToken(first, startLine, startCol);
        } else {
            return this.createToken(tt, important, startLine, startCol);
        }


    },
    notToken: function(first, startLine, startCol){
        var reader      = this._reader,
            text        = first;

        reader.mark();
        text += reader.readCount(4);

        if (text.toLowerCase() == ":not("){
            return this.createToken(Tokens.NOT, text, startLine, startCol);
        } else {
            reader.reset();
            return this.charToken(first, startLine, startCol);
        }
    },
    numberToken: function(first, startLine, startCol){
        var reader  = this._reader,
            value   = this.readNumber(first),
            ident,
            tt      = Tokens.NUMBER,
            c       = reader.peek();

        if (isIdentStart(c)){
            ident = this.readName(reader.read());
            value += ident;

            if (/^em$|^ex$|^px$|^gd$|^rem$|^vw$|^vh$|^vmax$|^vmin$|^ch$|^cm$|^mm$|^in$|^pt$|^pc$/i.test(ident)){
                tt = Tokens.LENGTH;
            } else if (/^deg|^rad$|^grad$/i.test(ident)){
                tt = Tokens.ANGLE;
            } else if (/^ms$|^s$/i.test(ident)){
                tt = Tokens.TIME;
            } else if (/^hz$|^khz$/i.test(ident)){
                tt = Tokens.FREQ;
            } else if (/^dpi$|^dpcm$/i.test(ident)){
                tt = Tokens.RESOLUTION;
            } else {
                tt = Tokens.DIMENSION;
            }

        } else if (c == "%"){
            value += reader.read();
            tt = Tokens.PERCENTAGE;
        }

        return this.createToken(tt, value, startLine, startCol);
    },
    stringToken: function(first, startLine, startCol){
        var delim   = first,
            string  = first,
            reader  = this._reader,
            prev    = first,
            tt      = Tokens.STRING,
            c       = reader.read();

        while(c){
            string += c;
            if (c == delim && prev != "\\"){
                break;
            }
            if (isNewLine(reader.peek()) && c != "\\"){
                tt = Tokens.INVALID;
                break;
            }
            prev = c;
            c = reader.read();
        }
        if (c === null){
            tt = Tokens.INVALID;
        }

        return this.createToken(tt, string, startLine, startCol);
    },

    unicodeRangeToken: function(first, startLine, startCol){
        var reader  = this._reader,
            value   = first,
            temp,
            tt      = Tokens.CHAR;
        if (reader.peek() == "+"){
            reader.mark();
            value += reader.read();
            value += this.readUnicodeRangePart(true);
            if (value.length == 2){
                reader.reset();
            } else {

                tt = Tokens.UNICODE_RANGE;
                if (value.indexOf("?") == -1){

                    if (reader.peek() == "-"){
                        reader.mark();
                        temp = reader.read();
                        temp += this.readUnicodeRangePart(false);
                        if (temp.length == 1){
                            reader.reset();
                        } else {
                            value += temp;
                        }
                    }

                }
            }
        }

        return this.createToken(tt, value, startLine, startCol);
    },
    whitespaceToken: function(first, startLine, startCol){
        var reader  = this._reader,
            value   = first + this.readWhitespace();
        return this.createToken(Tokens.S, value, startLine, startCol);
    },

    readUnicodeRangePart: function(allowQuestionMark){
        var reader  = this._reader,
            part = "",
            c       = reader.peek();
        while(isHexDigit(c) && part.length < 6){
            reader.read();
            part += c;
            c = reader.peek();
        }
        if (allowQuestionMark){
            while(c == "?" && part.length < 6){
                reader.read();
                part += c;
                c = reader.peek();
            }
        }

        return part;
    },

    readWhitespace: function(){
        var reader  = this._reader,
            whitespace = "",
            c       = reader.peek();

        while(isWhitespace(c)){
            reader.read();
            whitespace += c;
            c = reader.peek();
        }

        return whitespace;
    },
    readNumber: function(first){
        var reader  = this._reader,
            number  = first,
            hasDot  = (first == "."),
            c       = reader.peek();


        while(c){
            if (isDigit(c)){
                number += reader.read();
            } else if (c == "."){
                if (hasDot){
                    break;
                } else {
                    hasDot = true;
                    number += reader.read();
                }
            } else {
                break;
            }

            c = reader.peek();
        }

        return number;
    },
    readString: function(){
        var reader  = this._reader,
            delim   = reader.read(),
            string  = delim,
            prev    = delim,
            c       = reader.peek();

        while(c){
            c = reader.read();
            string += c;
            if (c == delim && prev != "\\"){
                break;
            }
            if (isNewLine(reader.peek()) && c != "\\"){
                string = "";
                break;
            }
            prev = c;
            c = reader.peek();
        }
        if (c === null){
            string = "";
        }

        return string;
    },
    readURI: function(first){
        var reader  = this._reader,
            uri     = first,
            inner   = "",
            c       = reader.peek();

        reader.mark();
        while(c && isWhitespace(c)){
            reader.read();
            c = reader.peek();
        }
        if (c == "'" || c == "\""){
            inner = this.readString();
        } else {
            inner = this.readURL();
        }

        c = reader.peek();
        while(c && isWhitespace(c)){
            reader.read();
            c = reader.peek();
        }
        if (inner === "" || c != ")"){
            uri = first;
            reader.reset();
        } else {
            uri += inner + reader.read();
        }

        return uri;
    },
    readURL: function(){
        var reader  = this._reader,
            url     = "",
            c       = reader.peek();
        while (/^[!#$%&\\*-~]$/.test(c)){
            url += reader.read();
            c = reader.peek();
        }

        return url;

    },
    readName: function(first){
        var reader  = this._reader,
            ident   = first || "",
            c       = reader.peek();

        while(true){
            if (c == "\\"){
                ident += this.readEscape(reader.read());
                c = reader.peek();
            } else if(c && isNameChar(c)){
                ident += reader.read();
                c = reader.peek();
            } else {
                break;
            }
        }

        return ident;
    },

    readEscape: function(first){
        var reader  = this._reader,
            cssEscape = first || "",
            i       = 0,
            c       = reader.peek();

        if (isHexDigit(c)){
            do {
                cssEscape += reader.read();
                c = reader.peek();
            } while(c && isHexDigit(c) && ++i < 6);
        }

        if (cssEscape.length == 3 && /\s/.test(c) ||
            cssEscape.length == 7 || cssEscape.length == 1){
                reader.read();
        } else {
            c = "";
        }

        return cssEscape + c;
    },

    readComment: function(first){
        var reader  = this._reader,
            comment = first || "",
            c       = reader.read();

        if (c == "*"){
            while(c){
                comment += c;
                if (comment.length > 2 && c == "*" && reader.peek() == "/"){
                    comment += reader.read();
                    break;
                }

                c = reader.read();
            }

            return comment;
        } else {
            return "";
        }

    }
});

var Tokens  = [
    { name: "CDO"},
    { name: "CDC"},
    { name: "S", whitespace: true/*, channel: "ws"*/},
    { name: "COMMENT", comment: true, hide: true, channel: "comment" },
    { name: "INCLUDES", text: "~="},
    { name: "DASHMATCH", text: "|="},
    { name: "PREFIXMATCH", text: "^="},
    { name: "SUFFIXMATCH", text: "$="},
    { name: "SUBSTRINGMATCH", text: "*="},
    { name: "STRING"},
    { name: "IDENT"},
    { name: "HASH"},
    { name: "IMPORT_SYM", text: "@import"},
    { name: "PAGE_SYM", text: "@page"},
    { name: "MEDIA_SYM", text: "@media"},
    { name: "FONT_FACE_SYM", text: "@font-face"},
    { name: "CHARSET_SYM", text: "@charset"},
    { name: "NAMESPACE_SYM", text: "@namespace"},
    { name: "VIEWPORT_SYM", text: ["@viewport", "@-ms-viewport"]},
    { name: "UNKNOWN_SYM" },
    { name: "KEYFRAMES_SYM", text: [ "@keyframes", "@-webkit-keyframes", "@-moz-keyframes", "@-o-keyframes" ] },
    { name: "IMPORTANT_SYM"},
    { name: "LENGTH"},
    { name: "ANGLE"},
    { name: "TIME"},
    { name: "FREQ"},
    { name: "DIMENSION"},
    { name: "PERCENTAGE"},
    { name: "NUMBER"},
    { name: "URI"},
    { name: "FUNCTION"},
    { name: "UNICODE_RANGE"},
    { name: "INVALID"},
    { name: "PLUS", text: "+" },
    { name: "GREATER", text: ">"},
    { name: "COMMA", text: ","},
    { name: "TILDE", text: "~"},
    { name: "NOT"},
    { name: "TOPLEFTCORNER_SYM", text: "@top-left-corner"},
    { name: "TOPLEFT_SYM", text: "@top-left"},
    { name: "TOPCENTER_SYM", text: "@top-center"},
    { name: "TOPRIGHT_SYM", text: "@top-right"},
    { name: "TOPRIGHTCORNER_SYM", text: "@top-right-corner"},
    { name: "BOTTOMLEFTCORNER_SYM", text: "@bottom-left-corner"},
    { name: "BOTTOMLEFT_SYM", text: "@bottom-left"},
    { name: "BOTTOMCENTER_SYM", text: "@bottom-center"},
    { name: "BOTTOMRIGHT_SYM", text: "@bottom-right"},
    { name: "BOTTOMRIGHTCORNER_SYM", text: "@bottom-right-corner"},
    { name: "LEFTTOP_SYM", text: "@left-top"},
    { name: "LEFTMIDDLE_SYM", text: "@left-middle"},
    { name: "LEFTBOTTOM_SYM", text: "@left-bottom"},
    { name: "RIGHTTOP_SYM", text: "@right-top"},
    { name: "RIGHTMIDDLE_SYM", text: "@right-middle"},
    { name: "RIGHTBOTTOM_SYM", text: "@right-bottom"},
    { name: "RESOLUTION", state: "media"},
    { name: "IE_FUNCTION" },
    { name: "CHAR" },
    {
        name: "PIPE",
        text: "|"
    },
    {
        name: "SLASH",
        text: "/"
    },
    {
        name: "MINUS",
        text: "-"
    },
    {
        name: "STAR",
        text: "*"
    },

    {
        name: "LBRACE",
        endChar: "}",
        text: "{"
    },
    {
        name: "RBRACE",
        text: "}"
    },
    {
        name: "LBRACKET",
        endChar: "]",
        text: "["
    },
    {
        name: "RBRACKET",
        text: "]"
    },
    {
        name: "EQUALS",
        text: "="
    },
    {
        name: "COLON",
        text: ":"
    },
    {
        name: "SEMICOLON",
        text: ";"
    },

    {
        name: "LPAREN",
        endChar: ")",
        text: "("
    },
    {
        name: "RPAREN",
        text: ")"
    },
    {
        name: "DOT",
        text: "."
    }
];

(function(){

    var nameMap = [],
        typeMap = {};

    Tokens.UNKNOWN = -1;
    Tokens.unshift({name:"EOF"});
    for (var i=0, len = Tokens.length; i < len; i++){
        nameMap.push(Tokens[i].name);
        Tokens[Tokens[i].name] = i;
        if (Tokens[i].text){
            if (Tokens[i].text instanceof Array){
                for (var j=0; j < Tokens[i].text.length; j++){
                    typeMap[Tokens[i].text[j]] = i;
                }
            } else {
                typeMap[Tokens[i].text] = i;
            }
        }
    }

    Tokens.name = function(tt){
        return nameMap[tt];
    };

    Tokens.type = function(c){
        return typeMap[c] || -1;
    };

})();
var Validation = {

    validate: function(property, value){
        var name        = property.toString().toLowerCase(),
            parts       = value.parts,
            expression  = new PropertyValueIterator(value),
            spec        = Properties[name],
            part,
            valid,
            j, count,
            msg,
            types,
            last,
            literals,
            max, multi, group;

        if (!spec) {
            if (name.indexOf("-") !== 0){    //vendor prefixed are ok
                throw new ValidationError("Unknown property '" + property + "'.", property.line, property.col);
            }
        } else if (typeof spec != "number"){
            if (typeof spec == "string"){
                if (spec.indexOf("||") > -1) {
                    this.groupProperty(spec, expression);
                } else {
                    this.singleProperty(spec, expression, 1);
                }

            } else if (spec.multi) {
                this.multiProperty(spec.multi, expression, spec.comma, spec.max || Infinity);
            } else if (typeof spec == "function") {
                spec(expression);
            }

        }

    },

    singleProperty: function(types, expression, max, partial) {

        var result      = false,
            value       = expression.value,
            count       = 0,
            part;

        while (expression.hasNext() && count < max) {
            result = ValidationTypes.isAny(expression, types);
            if (!result) {
                break;
            }
            count++;
        }

        if (!result) {
            if (expression.hasNext() && !expression.isFirst()) {
                part = expression.peek();
                throw new ValidationError("Expected end of value but found '" + part + "'.", part.line, part.col);
            } else {
                 throw new ValidationError("Expected (" + types + ") but found '" + value + "'.", value.line, value.col);
            }
        } else if (expression.hasNext()) {
            part = expression.next();
            throw new ValidationError("Expected end of value but found '" + part + "'.", part.line, part.col);
        }

    },

    multiProperty: function (types, expression, comma, max) {

        var result      = false,
            value       = expression.value,
            count       = 0,
            sep         = false,
            part;

        while(expression.hasNext() && !result && count < max) {
            if (ValidationTypes.isAny(expression, types)) {
                count++;
                if (!expression.hasNext()) {
                    result = true;

                } else if (comma) {
                    if (expression.peek() == ",") {
                        part = expression.next();
                    } else {
                        break;
                    }
                }
            } else {
                break;

            }
        }

        if (!result) {
            if (expression.hasNext() && !expression.isFirst()) {
                part = expression.peek();
                throw new ValidationError("Expected end of value but found '" + part + "'.", part.line, part.col);
            } else {
                part = expression.previous();
                if (comma && part == ",") {
                    throw new ValidationError("Expected end of value but found '" + part + "'.", part.line, part.col);
                } else {
                    throw new ValidationError("Expected (" + types + ") but found '" + value + "'.", value.line, value.col);
                }
            }

        } else if (expression.hasNext()) {
            part = expression.next();
            throw new ValidationError("Expected end of value but found '" + part + "'.", part.line, part.col);
        }

    },

    groupProperty: function (types, expression, comma) {

        var result      = false,
            value       = expression.value,
            typeCount   = types.split("||").length,
            groups      = { count: 0 },
            partial     = false,
            name,
            part;

        while(expression.hasNext() && !result) {
            name = ValidationTypes.isAnyOfGroup(expression, types);
            if (name) {
                if (groups[name]) {
                    break;
                } else {
                    groups[name] = 1;
                    groups.count++;
                    partial = true;

                    if (groups.count == typeCount || !expression.hasNext()) {
                        result = true;
                    }
                }
            } else {
                break;
            }
        }

        if (!result) {
            if (partial && expression.hasNext()) {
                    part = expression.peek();
                    throw new ValidationError("Expected end of value but found '" + part + "'.", part.line, part.col);
            } else {
                throw new ValidationError("Expected (" + types + ") but found '" + value + "'.", value.line, value.col);
            }
        } else if (expression.hasNext()) {
            part = expression.next();
            throw new ValidationError("Expected end of value but found '" + part + "'.", part.line, part.col);
        }
    }



};
function ValidationError(message, line, col){
    this.col = col;
    this.line = line;
    this.message = message;

}
ValidationError.prototype = new Error();
var ValidationTypes = {

    isLiteral: function (part, literals) {
        var text = part.text.toString().toLowerCase(),
            args = literals.split(" | "),
            i, len, found = false;

        for (i=0,len=args.length; i < len && !found; i++){
            if (text == args[i].toLowerCase()){
                found = true;
            }
        }

        return found;
    },

    isSimple: function(type) {
        return !!this.simple[type];
    },

    isComplex: function(type) {
        return !!this.complex[type];
    },
    isAny: function (expression, types) {
        var args = types.split(" | "),
            i, len, found = false;

        for (i=0,len=args.length; i < len && !found && expression.hasNext(); i++){
            found = this.isType(expression, args[i]);
        }

        return found;
    },
    isAnyOfGroup: function(expression, types) {
        var args = types.split(" || "),
            i, len, found = false;

        for (i=0,len=args.length; i < len && !found; i++){
            found = this.isType(expression, args[i]);
        }

        return found ? args[i-1] : false;
    },
    isType: function (expression, type) {
        var part = expression.peek(),
            result = false;

        if (type.charAt(0) != "<") {
            result = this.isLiteral(part, type);
            if (result) {
                expression.next();
            }
        } else if (this.simple[type]) {
            result = this.simple[type](part);
            if (result) {
                expression.next();
            }
        } else {
            result = this.complex[type](expression);
        }

        return result;
    },



    simple: {

        "<absolute-size>": function(part){
            return ValidationTypes.isLiteral(part, "xx-small | x-small | small | medium | large | x-large | xx-large");
        },

        "<attachment>": function(part){
            return ValidationTypes.isLiteral(part, "scroll | fixed | local");
        },

        "<attr>": function(part){
            return part.type == "function" && part.name == "attr";
        },

        "<bg-image>": function(part){
            return this["<image>"](part) || this["<gradient>"](part) ||  part == "none";
        },

        "<gradient>": function(part) {
            return part.type == "function" && /^(?:\-(?:ms|moz|o|webkit)\-)?(?:repeating\-)?(?:radial\-|linear\-)?gradient/i.test(part);
        },

        "<box>": function(part){
            return ValidationTypes.isLiteral(part, "padding-box | border-box | content-box");
        },

        "<content>": function(part){
            return part.type == "function" && part.name == "content";
        },

        "<relative-size>": function(part){
            return ValidationTypes.isLiteral(part, "smaller | larger");
        },
        "<ident>": function(part){
            return part.type == "identifier";
        },

        "<length>": function(part){
            if (part.type == "function" && /^(?:\-(?:ms|moz|o|webkit)\-)?calc/i.test(part)){
                return true;
            }else{
                return part.type == "length" || part.type == "number" || part.type == "integer" || part == "0";
            }
        },

        "<color>": function(part){
            return part.type == "color" || part == "transparent";
        },

        "<number>": function(part){
            return part.type == "number" || this["<integer>"](part);
        },

        "<integer>": function(part){
            return part.type == "integer";
        },

        "<line>": function(part){
            return part.type == "integer";
        },

        "<angle>": function(part){
            return part.type == "angle";
        },

        "<uri>": function(part){
            return part.type == "uri";
        },

        "<image>": function(part){
            return this["<uri>"](part);
        },

        "<percentage>": function(part){
            return part.type == "percentage" || part == "0";
        },

        "<border-width>": function(part){
            return this["<length>"](part) || ValidationTypes.isLiteral(part, "thin | medium | thick");
        },

        "<border-style>": function(part){
            return ValidationTypes.isLiteral(part, "none | hidden | dotted | dashed | solid | double | groove | ridge | inset | outset");
        },

        "<content-sizing>": function(part){ // http://www.w3.org/TR/css3-sizing/#width-height-keywords
            return ValidationTypes.isLiteral(part, "fill-available | -moz-available | -webkit-fill-available | max-content | -moz-max-content | -webkit-max-content | min-content | -moz-min-content | -webkit-min-content | fit-content | -moz-fit-content | -webkit-fit-content");
        },

        "<margin-width>": function(part){
            return this["<length>"](part) || this["<percentage>"](part) || ValidationTypes.isLiteral(part, "auto");
        },

        "<padding-width>": function(part){
            return this["<length>"](part) || this["<percentage>"](part);
        },

        "<shape>": function(part){
            return part.type == "function" && (part.name == "rect" || part.name == "inset-rect");
        },

        "<time>": function(part) {
            return part.type == "time";
        },

        "<flex-grow>": function(part){
            return this["<number>"](part);
        },

        "<flex-shrink>": function(part){
            return this["<number>"](part);
        },

        "<width>": function(part){
            return this["<margin-width>"](part);
        },

        "<flex-basis>": function(part){
            return this["<width>"](part);
        },

        "<flex-direction>": function(part){
            return ValidationTypes.isLiteral(part, "row | row-reverse | column | column-reverse");
        },

        "<flex-wrap>": function(part){
            return ValidationTypes.isLiteral(part, "nowrap | wrap | wrap-reverse");
        }
    },

    complex: {

        "<bg-position>": function(expression){
            var types   = this,
                result  = false,
                numeric = "<percentage> | <length>",
                xDir    = "left | right",
                yDir    = "top | bottom",
                count = 0,
                hasNext = function() {
                    return expression.hasNext() && expression.peek() != ",";
                };

            while (expression.peek(count) && expression.peek(count) != ",") {
                count++;
            }

            if (count < 3) {
                if (ValidationTypes.isAny(expression, xDir + " | center | " + numeric)) {
                        result = true;
                        ValidationTypes.isAny(expression, yDir + " | center | " + numeric);
                } else if (ValidationTypes.isAny(expression, yDir)) {
                        result = true;
                        ValidationTypes.isAny(expression, xDir + " | center");
                }
            } else {
                if (ValidationTypes.isAny(expression, xDir)) {
                    if (ValidationTypes.isAny(expression, yDir)) {
                        result = true;
                        ValidationTypes.isAny(expression, numeric);
                    } else if (ValidationTypes.isAny(expression, numeric)) {
                        if (ValidationTypes.isAny(expression, yDir)) {
                            result = true;
                            ValidationTypes.isAny(expression, numeric);
                        } else if (ValidationTypes.isAny(expression, "center")) {
                            result = true;
                        }
                    }
                } else if (ValidationTypes.isAny(expression, yDir)) {
                    if (ValidationTypes.isAny(expression, xDir)) {
                        result = true;
                        ValidationTypes.isAny(expression, numeric);
                    } else if (ValidationTypes.isAny(expression, numeric)) {
                        if (ValidationTypes.isAny(expression, xDir)) {
                                result = true;
                                ValidationTypes.isAny(expression, numeric);
                        } else if (ValidationTypes.isAny(expression, "center")) {
                            result = true;
                        }
                    }
                } else if (ValidationTypes.isAny(expression, "center")) {
                    if (ValidationTypes.isAny(expression, xDir + " | " + yDir)) {
                        result = true;
                        ValidationTypes.isAny(expression, numeric);
                    }
                }
            }

            return result;
        },

        "<bg-size>": function(expression){
            var types   = this,
                result  = false,
                numeric = "<percentage> | <length> | auto",
                part,
                i, len;

            if (ValidationTypes.isAny(expression, "cover | contain")) {
                result = true;
            } else if (ValidationTypes.isAny(expression, numeric)) {
                result = true;
                ValidationTypes.isAny(expression, numeric);
            }

            return result;
        },

        "<repeat-style>": function(expression){
            var result  = false,
                values  = "repeat | space | round | no-repeat",
                part;

            if (expression.hasNext()){
                part = expression.next();

                if (ValidationTypes.isLiteral(part, "repeat-x | repeat-y")) {
                    result = true;
                } else if (ValidationTypes.isLiteral(part, values)) {
                    result = true;

                    if (expression.hasNext() && ValidationTypes.isLiteral(expression.peek(), values)) {
                        expression.next();
                    }
                }
            }

            return result;

        },

        "<shadow>": function(expression) {
            var result  = false,
                count   = 0,
                inset   = false,
                color   = false,
                part;

            if (expression.hasNext()) {

                if (ValidationTypes.isAny(expression, "inset")){
                    inset = true;
                }

                if (ValidationTypes.isAny(expression, "<color>")) {
                    color = true;
                }

                while (ValidationTypes.isAny(expression, "<length>") && count < 4) {
                    count++;
                }


                if (expression.hasNext()) {
                    if (!color) {
                        ValidationTypes.isAny(expression, "<color>");
                    }

                    if (!inset) {
                        ValidationTypes.isAny(expression, "inset");
                    }

                }

                result = (count >= 2 && count <= 4);

            }

            return result;
        },

        "<x-one-radius>": function(expression) {
            var result  = false,
                simple = "<length> | <percentage> | inherit";

            if (ValidationTypes.isAny(expression, simple)){
                result = true;
                ValidationTypes.isAny(expression, simple);
            }

            return result;
        },

        "<flex>": function(expression) {
            var part,
                result = false;
            if (ValidationTypes.isAny(expression, "none | inherit")) {
                result = true;
            } else {
                if (ValidationTypes.isType(expression, "<flex-grow>")) {
                    if (expression.peek()) {
                        if (ValidationTypes.isType(expression, "<flex-shrink>")) {
                            if (expression.peek()) {
                                result = ValidationTypes.isType(expression, "<flex-basis>");
                            } else {
                                result = true;
                            }
                        } else if (ValidationTypes.isType(expression, "<flex-basis>")) {
                            result = expression.peek() === null;
                        }
                    } else {
                        result = true;
                    }
                } else if (ValidationTypes.isType(expression, "<flex-basis>")) {
                    result = true;
                }
            }

            if (!result) {
                part = expression.peek();
                throw new ValidationError("Expected (none | [ <flex-grow> <flex-shrink>? || <flex-basis> ]) but found '" + expression.value.text + "'.", part.line, part.col);
            }

            return result;
        }
    }
};

parserlib.css = {
Colors              :Colors,
Combinator          :Combinator,
Parser              :Parser,
PropertyName        :PropertyName,
PropertyValue       :PropertyValue,
PropertyValuePart   :PropertyValuePart,
MediaFeature        :MediaFeature,
MediaQuery          :MediaQuery,
Selector            :Selector,
SelectorPart        :SelectorPart,
SelectorSubPart     :SelectorSubPart,
Specificity         :Specificity,
TokenStream         :TokenStream,
Tokens              :Tokens,
ValidationError     :ValidationError
};
})();

(function(){
for(var prop in parserlib){
exports[prop] = parserlib[prop];
}
})();


function objectToString(o) {
  return Object.prototype.toString.call(o);
}
var util = {
  isArray: function (ar) {
    return Array.isArray(ar) || (typeof ar === 'object' && objectToString(ar) === '[object Array]');
  },
  isDate: function (d) {
    return typeof d === 'object' && objectToString(d) === '[object Date]';
  },
  isRegExp: function (re) {
    return typeof re === 'object' && objectToString(re) === '[object RegExp]';
  },
  getRegExpFlags: function (re) {
    var flags = '';
    re.global && (flags += 'g');
    re.ignoreCase && (flags += 'i');
    re.multiline && (flags += 'm');
    return flags;
  }
};


if (typeof module === 'object')
  module.exports = clone;

function clone(parent, circular, depth, prototype) {
  var allParents = [];
  var allChildren = [];

  var useBuffer = typeof Buffer != 'undefined';

  if (typeof circular == 'undefined')
    circular = true;

  if (typeof depth == 'undefined')
    depth = Infinity;
  function _clone(parent, depth) {
    if (parent === null)
      return null;

    if (depth == 0)
      return parent;

    var child;
    if (typeof parent != 'object') {
      return parent;
    }

    if (util.isArray(parent)) {
      child = [];
    } else if (util.isRegExp(parent)) {
      child = new RegExp(parent.source, util.getRegExpFlags(parent));
      if (parent.lastIndex) child.lastIndex = parent.lastIndex;
    } else if (util.isDate(parent)) {
      child = new Date(parent.getTime());
    } else if (useBuffer && Buffer.isBuffer(parent)) {
      child = new Buffer(parent.length);
      parent.copy(child);
      return child;
    } else {
      if (typeof prototype == 'undefined') child = Object.create(Object.getPrototypeOf(parent));
      else child = Object.create(prototype);
    }

    if (circular) {
      var index = allParents.indexOf(parent);

      if (index != -1) {
        return allChildren[index];
      }
      allParents.push(parent);
      allChildren.push(child);
    }

    for (var i in parent) {
      child[i] = _clone(parent[i], depth - 1);
    }

    return child;
  }

  return _clone(parent, depth);
}
clone.clonePrototype = function(parent) {
  if (parent === null)
    return null;

  var c = function () {};
  c.prototype = parent;
  return new c();
};

var CSSLint = (function(){

    var rules           = [],
        formatters      = [],
        embeddedRuleset = /\/\*csslint([^\*]*)\*\//,
        api             = new parserlib.util.EventTarget();

    api.version = "@VERSION@";
    api.addRule = function(rule){
        rules.push(rule);
        rules[rule.id] = rule;
    };
    api.clearRules = function(){
        rules = [];
    };
    api.getRules = function(){
        return [].concat(rules).sort(function(a,b){
            return a.id > b.id ? 1 : 0;
        });
    };
    api.getRuleset = function() {
        var ruleset = {},
            i = 0,
            len = rules.length;

        while (i < len){
            ruleset[rules[i++].id] = 1;    //by default, everything is a warning
        }

        return ruleset;
    };
    function applyEmbeddedRuleset(text, ruleset){
        var valueMap,
            embedded = text && text.match(embeddedRuleset),
            rules = embedded && embedded[1];

        if (rules) {
            valueMap = {
                "true": 2,  // true is error
                "": 1,      // blank is warning
                "false": 0, // false is ignore

                "2": 2,     // explicit error
                "1": 1,     // explicit warning
                "0": 0      // explicit ignore
            };

            rules.toLowerCase().split(",").forEach(function(rule){
                var pair = rule.split(":"),
                    property = pair[0] || "",
                    value = pair[1] || "";

                ruleset[property.trim()] = valueMap[value.trim()];
            });
        }

        return ruleset;
    }
    api.addFormatter = function(formatter) {
        formatters[formatter.id] = formatter;
    };
    api.getFormatter = function(formatId){
        return formatters[formatId];
    };
    api.format = function(results, filename, formatId, options) {
        var formatter = this.getFormatter(formatId),
            result = null;

        if (formatter){
            result = formatter.startFormat();
            result += formatter.formatResults(results, filename, options || {});
            result += formatter.endFormat();
        }

        return result;
    };
    api.hasFormat = function(formatId){
        return formatters.hasOwnProperty(formatId);
    };
    api.verify = function(text, ruleset){

        var i = 0,
            reporter,
            lines,
            report,
            parser = new parserlib.css.Parser({ starHack: true, ieFilters: true,
                                                underscoreHack: true, strict: false });
        lines = text.replace(/\n\r?/g, "$split$").split("$split$");

        if (!ruleset){
            ruleset = this.getRuleset();
        }

        if (embeddedRuleset.test(text)){
            ruleset = clone(ruleset);
            ruleset = applyEmbeddedRuleset(text, ruleset);
        }

        reporter = new Reporter(lines, ruleset);

        ruleset.errors = 2;       //always report parsing errors as errors
        for (i in ruleset){
            if(ruleset.hasOwnProperty(i) && ruleset[i]){
                if (rules[i]){
                    rules[i].init(parser, reporter);
                }
            }
        }
        try {
            parser.parse(text);
        } catch (ex) {
            reporter.error("Fatal error, cannot continue: " + ex.message, ex.line, ex.col, {});
        }

        report = {
            messages    : reporter.messages,
            stats       : reporter.stats,
            ruleset     : reporter.ruleset
        };
        report.messages.sort(function (a, b){
            if (a.rollup && !b.rollup){
                return 1;
            } else if (!a.rollup && b.rollup){
                return -1;
            } else {
                return a.line - b.line;
            }
        });

        return report;
    };

    return api;

})();
function Reporter(lines, ruleset){
    this.messages = [];
    this.stats = [];
    this.lines = lines;
    this.ruleset = ruleset;
}

Reporter.prototype = {
    constructor: Reporter,
    error: function(message, line, col, rule){
        this.messages.push({
            type    : "error",
            line    : line,
            col     : col,
            message : message,
            evidence: this.lines[line-1],
            rule    : rule || {}
        });
    },
    warn: function(message, line, col, rule){
        this.report(message, line, col, rule);
    },
    report: function(message, line, col, rule){
        this.messages.push({
            type    : this.ruleset[rule.id] === 2 ? "error" : "warning",
            line    : line,
            col     : col,
            message : message,
            evidence: this.lines[line-1],
            rule    : rule
        });
    },
    info: function(message, line, col, rule){
        this.messages.push({
            type    : "info",
            line    : line,
            col     : col,
            message : message,
            evidence: this.lines[line-1],
            rule    : rule
        });
    },
    rollupError: function(message, rule){
        this.messages.push({
            type    : "error",
            rollup  : true,
            message : message,
            rule    : rule
        });
    },
    rollupWarn: function(message, rule){
        this.messages.push({
            type    : "warning",
            rollup  : true,
            message : message,
            rule    : rule
        });
    },
    stat: function(name, value){
        this.stats[name] = value;
    }
};
CSSLint._Reporter = Reporter;
CSSLint.Util = {
    mix: function(receiver, supplier){
        var prop;

        for (prop in supplier){
            if (supplier.hasOwnProperty(prop)){
                receiver[prop] = supplier[prop];
            }
        }

        return prop;
    },
    indexOf: function(values, value){
        if (values.indexOf){
            return values.indexOf(value);
        } else {
            for (var i=0, len=values.length; i < len; i++){
                if (values[i] === value){
                    return i;
                }
            }
            return -1;
        }
    },
    forEach: function(values, func) {
        if (values.forEach){
            return values.forEach(func);
        } else {
            for (var i=0, len=values.length; i < len; i++){
                func(values[i], i, values);
            }
        }
    }
};

CSSLint.addRule({
    id: "adjoining-classes",
    name: "Disallow adjoining classes",
    desc: "Don't use adjoining classes.",
    browsers: "IE6",
    init: function(parser, reporter){
        var rule = this;
        parser.addListener("startrule", function(event){
            var selectors = event.selectors,
                selector,
                part,
                modifier,
                classCount,
                i, j, k;

            for (i=0; i < selectors.length; i++){
                selector = selectors[i];
                for (j=0; j < selector.parts.length; j++){
                    part = selector.parts[j];
                    if (part.type === parser.SELECTOR_PART_TYPE){
                        classCount = 0;
                        for (k=0; k < part.modifiers.length; k++){
                            modifier = part.modifiers[k];
                            if (modifier.type === "class"){
                                classCount++;
                            }
                            if (classCount > 1){
                                reporter.report("Don't use adjoining classes.", part.line, part.col, rule);
                            }
                        }
                    }
                }
            }
        });
    }

});
CSSLint.addRule({
    id: "box-model",
    name: "Beware of broken box size",
    desc: "Don't use width or height when using padding or border.",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this,
            widthProperties = {
                border: 1,
                "border-left": 1,
                "border-right": 1,
                padding: 1,
                "padding-left": 1,
                "padding-right": 1
            },
            heightProperties = {
                border: 1,
                "border-bottom": 1,
                "border-top": 1,
                padding: 1,
                "padding-bottom": 1,
                "padding-top": 1
            },
            properties,
            boxSizing = false;

        function startRule(){
            properties = {};
            boxSizing = false;
        }

        function endRule(){
            var prop, value;

            if (!boxSizing) {
                if (properties.height){
                    for (prop in heightProperties){
                        if (heightProperties.hasOwnProperty(prop) && properties[prop]){
                            value = properties[prop].value;
                            if (!(prop === "padding" && value.parts.length === 2 && value.parts[0].value === 0)){
                                reporter.report("Using height with " + prop + " can sometimes make elements larger than you expect.", properties[prop].line, properties[prop].col, rule);
                            }
                        }
                    }
                }

                if (properties.width){
                    for (prop in widthProperties){
                        if (widthProperties.hasOwnProperty(prop) && properties[prop]){
                            value = properties[prop].value;

                            if (!(prop === "padding" && value.parts.length === 2 && value.parts[1].value === 0)){
                                reporter.report("Using width with " + prop + " can sometimes make elements larger than you expect.", properties[prop].line, properties[prop].col, rule);
                            }
                        }
                    }
                }
            }
        }

        parser.addListener("startrule", startRule);
        parser.addListener("startfontface", startRule);
        parser.addListener("startpage", startRule);
        parser.addListener("startpagemargin", startRule);
        parser.addListener("startkeyframerule", startRule);

        parser.addListener("property", function(event){
            var name = event.property.text.toLowerCase();

            if (heightProperties[name] || widthProperties[name]){
                if (!/^0\S*$/.test(event.value) && !(name === "border" && event.value.toString() === "none")){
                    properties[name] = { line: event.property.line, col: event.property.col, value: event.value };
                }
            } else {
                if (/^(width|height)/i.test(name) && /^(length|percentage)/.test(event.value.parts[0].type)){
                    properties[name] = 1;
                } else if (name === "box-sizing") {
                    boxSizing = true;
                }
            }

        });

        parser.addListener("endrule", endRule);
        parser.addListener("endfontface", endRule);
        parser.addListener("endpage", endRule);
        parser.addListener("endpagemargin", endRule);
        parser.addListener("endkeyframerule", endRule);
    }

});

CSSLint.addRule({
    id: "box-sizing",
    name: "Disallow use of box-sizing",
    desc: "The box-sizing properties isn't supported in IE6 and IE7.",
    browsers: "IE6, IE7",
    tags: ["Compatibility"],
    init: function(parser, reporter){
        var rule = this;

        parser.addListener("property", function(event){
            var name = event.property.text.toLowerCase();

            if (name === "box-sizing"){
                reporter.report("The box-sizing property isn't supported in IE6 and IE7.", event.line, event.col, rule);
            }
        });
    }

});

CSSLint.addRule({
    id: "bulletproof-font-face",
    name: "Use the bulletproof @font-face syntax",
    desc: "Use the bulletproof @font-face syntax to avoid 404's in old IE (http://www.fontspring.com/blog/the-new-bulletproof-font-face-syntax).",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this,
            fontFaceRule = false,
            firstSrc     = true,
            ruleFailed    = false,
            line, col;
        parser.addListener("startfontface", function(){
            fontFaceRule = true;
        });

        parser.addListener("property", function(event){
            if (!fontFaceRule) {
                return;
            }

            var propertyName = event.property.toString().toLowerCase(),
                value        = event.value.toString();
            line = event.line;
            col  = event.col;
            if (propertyName === "src") {
                var regex = /^\s?url\(['"].+\.eot\?.*['"]\)\s*format\(['"]embedded-opentype['"]\).*$/i;
                if (!value.match(regex) && firstSrc) {
                    ruleFailed = true;
                    firstSrc = false;
                } else if (value.match(regex) && !firstSrc) {
                    ruleFailed = false;
                }
            }


        });
        parser.addListener("endfontface", function(){
            fontFaceRule = false;

            if (ruleFailed) {
                reporter.report("@font-face declaration doesn't follow the fontspring bulletproof syntax.", line, col, rule);
            }
        });
    }
});

CSSLint.addRule({
    id: "compatible-vendor-prefixes",
    name: "Require compatible vendor prefixes",
    desc: "Include all compatible vendor prefixes to reach a wider range of users.",
    browsers: "All",
    init: function (parser, reporter) {
        var rule = this,
            compatiblePrefixes,
            properties,
            prop,
            variations,
            prefixed,
            i,
            len,
            inKeyFrame = false,
            arrayPush = Array.prototype.push,
            applyTo = [];
        compatiblePrefixes = {
            "animation"                  : "webkit moz",
            "animation-delay"            : "webkit moz",
            "animation-direction"        : "webkit moz",
            "animation-duration"         : "webkit moz",
            "animation-fill-mode"        : "webkit moz",
            "animation-iteration-count"  : "webkit moz",
            "animation-name"             : "webkit moz",
            "animation-play-state"       : "webkit moz",
            "animation-timing-function"  : "webkit moz",
            "appearance"                 : "webkit moz",
            "border-end"                 : "webkit moz",
            "border-end-color"           : "webkit moz",
            "border-end-style"           : "webkit moz",
            "border-end-width"           : "webkit moz",
            "border-image"               : "webkit moz o",
            "border-radius"              : "webkit",
            "border-start"               : "webkit moz",
            "border-start-color"         : "webkit moz",
            "border-start-style"         : "webkit moz",
            "border-start-width"         : "webkit moz",
            "box-align"                  : "webkit moz ms",
            "box-direction"              : "webkit moz ms",
            "box-flex"                   : "webkit moz ms",
            "box-lines"                  : "webkit ms",
            "box-ordinal-group"          : "webkit moz ms",
            "box-orient"                 : "webkit moz ms",
            "box-pack"                   : "webkit moz ms",
            "box-sizing"                 : "webkit moz",
            "box-shadow"                 : "webkit moz",
            "column-count"               : "webkit moz ms",
            "column-gap"                 : "webkit moz ms",
            "column-rule"                : "webkit moz ms",
            "column-rule-color"          : "webkit moz ms",
            "column-rule-style"          : "webkit moz ms",
            "column-rule-width"          : "webkit moz ms",
            "column-width"               : "webkit moz ms",
            "hyphens"                    : "epub moz",
            "line-break"                 : "webkit ms",
            "margin-end"                 : "webkit moz",
            "margin-start"               : "webkit moz",
            "marquee-speed"              : "webkit wap",
            "marquee-style"              : "webkit wap",
            "padding-end"                : "webkit moz",
            "padding-start"              : "webkit moz",
            "tab-size"                   : "moz o",
            "text-size-adjust"           : "webkit ms",
            "transform"                  : "webkit moz ms o",
            "transform-origin"           : "webkit moz ms o",
            "transition"                 : "webkit moz o",
            "transition-delay"           : "webkit moz o",
            "transition-duration"        : "webkit moz o",
            "transition-property"        : "webkit moz o",
            "transition-timing-function" : "webkit moz o",
            "user-modify"                : "webkit moz",
            "user-select"                : "webkit moz ms",
            "word-break"                 : "epub ms",
            "writing-mode"               : "epub ms"
        };


        for (prop in compatiblePrefixes) {
            if (compatiblePrefixes.hasOwnProperty(prop)) {
                variations = [];
                prefixed = compatiblePrefixes[prop].split(" ");
                for (i = 0, len = prefixed.length; i < len; i++) {
                    variations.push("-" + prefixed[i] + "-" + prop);
                }
                compatiblePrefixes[prop] = variations;
                arrayPush.apply(applyTo, variations);
            }
        }

        parser.addListener("startrule", function () {
            properties = [];
        });

        parser.addListener("startkeyframes", function (event) {
            inKeyFrame = event.prefix || true;
        });

        parser.addListener("endkeyframes", function () {
            inKeyFrame = false;
        });

        parser.addListener("property", function (event) {
            var name = event.property;
            if (CSSLint.Util.indexOf(applyTo, name.text) > -1) {
                if (!inKeyFrame || typeof inKeyFrame !== "string" ||
                        name.text.indexOf("-" + inKeyFrame + "-") !== 0) {
                    properties.push(name);
                }
            }
        });

        parser.addListener("endrule", function () {
            if (!properties.length) {
                return;
            }

            var propertyGroups = {},
                i,
                len,
                name,
                prop,
                variations,
                value,
                full,
                actual,
                item,
                propertiesSpecified;

            for (i = 0, len = properties.length; i < len; i++) {
                name = properties[i];

                for (prop in compatiblePrefixes) {
                    if (compatiblePrefixes.hasOwnProperty(prop)) {
                        variations = compatiblePrefixes[prop];
                        if (CSSLint.Util.indexOf(variations, name.text) > -1) {
                            if (!propertyGroups[prop]) {
                                propertyGroups[prop] = {
                                    full : variations.slice(0),
                                    actual : [],
                                    actualNodes: []
                                };
                            }
                            if (CSSLint.Util.indexOf(propertyGroups[prop].actual, name.text) === -1) {
                                propertyGroups[prop].actual.push(name.text);
                                propertyGroups[prop].actualNodes.push(name);
                            }
                        }
                    }
                }
            }

            for (prop in propertyGroups) {
                if (propertyGroups.hasOwnProperty(prop)) {
                    value = propertyGroups[prop];
                    full = value.full;
                    actual = value.actual;

                    if (full.length > actual.length) {
                        for (i = 0, len = full.length; i < len; i++) {
                            item = full[i];
                            if (CSSLint.Util.indexOf(actual, item) === -1) {
                                propertiesSpecified = (actual.length === 1) ? actual[0] : (actual.length === 2) ? actual.join(" and ") : actual.join(", ");
                                reporter.report("The property " + item + " is compatible with " + propertiesSpecified + " and should be included as well.", value.actualNodes[0].line, value.actualNodes[0].col, rule);
                            }
                        }

                    }
                }
            }
        });
    }
});

CSSLint.addRule({
    id: "display-property-grouping",
    name: "Require properties appropriate for display",
    desc: "Certain properties shouldn't be used with certain display property values.",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this;

        var propertiesToCheck = {
                display: 1,
                "float": "none",
                height: 1,
                width: 1,
                margin: 1,
                "margin-left": 1,
                "margin-right": 1,
                "margin-bottom": 1,
                "margin-top": 1,
                padding: 1,
                "padding-left": 1,
                "padding-right": 1,
                "padding-bottom": 1,
                "padding-top": 1,
                "vertical-align": 1
            },
            properties;

        function reportProperty(name, display, msg){
            if (properties[name]){
                if (typeof propertiesToCheck[name] !== "string" || properties[name].value.toLowerCase() !== propertiesToCheck[name]){
                    reporter.report(msg || name + " can't be used with display: " + display + ".", properties[name].line, properties[name].col, rule);
                }
            }
        }

        function startRule(){
            properties = {};
        }

        function endRule(){

            var display = properties.display ? properties.display.value : null;
            if (display){
                switch(display){

                    case "inline":
                        reportProperty("height", display);
                        reportProperty("width", display);
                        reportProperty("margin", display);
                        reportProperty("margin-top", display);
                        reportProperty("margin-bottom", display);
                        reportProperty("float", display, "display:inline has no effect on floated elements (but may be used to fix the IE6 double-margin bug).");
                        break;

                    case "block":
                        reportProperty("vertical-align", display);
                        break;

                    case "inline-block":
                        reportProperty("float", display);
                        break;

                    default:
                        if (display.indexOf("table-") === 0){
                            reportProperty("margin", display);
                            reportProperty("margin-left", display);
                            reportProperty("margin-right", display);
                            reportProperty("margin-top", display);
                            reportProperty("margin-bottom", display);
                            reportProperty("float", display);
                        }
                }
            }

        }

        parser.addListener("startrule", startRule);
        parser.addListener("startfontface", startRule);
        parser.addListener("startkeyframerule", startRule);
        parser.addListener("startpagemargin", startRule);
        parser.addListener("startpage", startRule);

        parser.addListener("property", function(event){
            var name = event.property.text.toLowerCase();

            if (propertiesToCheck[name]){
                properties[name] = { value: event.value.text, line: event.property.line, col: event.property.col };
            }
        });

        parser.addListener("endrule", endRule);
        parser.addListener("endfontface", endRule);
        parser.addListener("endkeyframerule", endRule);
        parser.addListener("endpagemargin", endRule);
        parser.addListener("endpage", endRule);

    }

});

CSSLint.addRule({
    id: "duplicate-background-images",
    name: "Disallow duplicate background images",
    desc: "Every background-image should be unique. Use a common class for e.g. sprites.",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this,
            stack = {};

        parser.addListener("property", function(event){
            var name = event.property.text,
                value = event.value,
                i, len;

            if (name.match(/background/i)) {
                for (i=0, len=value.parts.length; i < len; i++) {
                    if (value.parts[i].type === "uri") {
                        if (typeof stack[value.parts[i].uri] === "undefined") {
                            stack[value.parts[i].uri] = event;
                        }
                        else {
                            reporter.report("Background image '" + value.parts[i].uri + "' was used multiple times, first declared at line " + stack[value.parts[i].uri].line + ", col " + stack[value.parts[i].uri].col + ".", event.line, event.col, rule);
                        }
                    }
                }
            }
        });
    }
});

CSSLint.addRule({
    id: "duplicate-properties",
    name: "Disallow duplicate properties",
    desc: "Duplicate properties must appear one after the other.",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this,
            properties,
            lastProperty;

        function startRule(){
            properties = {};
        }

        parser.addListener("startrule", startRule);
        parser.addListener("startfontface", startRule);
        parser.addListener("startpage", startRule);
        parser.addListener("startpagemargin", startRule);
        parser.addListener("startkeyframerule", startRule);

        parser.addListener("property", function(event){
            var property = event.property,
                name = property.text.toLowerCase();

            if (properties[name] && (lastProperty !== name || properties[name] === event.value.text)){
                reporter.report("Duplicate property '" + event.property + "' found.", event.line, event.col, rule);
            }

            properties[name] = event.value.text;
            lastProperty = name;

        });


    }

});

CSSLint.addRule({
    id: "empty-rules",
    name: "Disallow empty rules",
    desc: "Rules without any properties specified should be removed.",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this,
            count = 0;

        parser.addListener("startrule", function(){
            count=0;
        });

        parser.addListener("property", function(){
            count++;
        });

        parser.addListener("endrule", function(event){
            var selectors = event.selectors;
            if (count === 0){
                reporter.report("Rule is empty.", selectors[0].line, selectors[0].col, rule);
            }
        });
    }

});

CSSLint.addRule({
    id: "errors",
    name: "Parsing Errors",
    desc: "This rule looks for recoverable syntax errors.",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this;

        parser.addListener("error", function(event){
            reporter.error(event.message, event.line, event.col, rule);
        });

    }

});

CSSLint.addRule({
    id: "fallback-colors",
    name: "Require fallback colors",
    desc: "For older browsers that don't support RGBA, HSL, or HSLA, provide a fallback color.",
    browsers: "IE6,IE7,IE8",
    init: function(parser, reporter){
        var rule = this,
            lastProperty,
            propertiesToCheck = {
                color: 1,
                background: 1,
                "border-color": 1,
                "border-top-color": 1,
                "border-right-color": 1,
                "border-bottom-color": 1,
                "border-left-color": 1,
                border: 1,
                "border-top": 1,
                "border-right": 1,
                "border-bottom": 1,
                "border-left": 1,
                "background-color": 1
            },
            properties;

        function startRule(){
            properties = {};
            lastProperty = null;
        }

        parser.addListener("startrule", startRule);
        parser.addListener("startfontface", startRule);
        parser.addListener("startpage", startRule);
        parser.addListener("startpagemargin", startRule);
        parser.addListener("startkeyframerule", startRule);

        parser.addListener("property", function(event){
            var property = event.property,
                name = property.text.toLowerCase(),
                parts = event.value.parts,
                i = 0,
                colorType = "",
                len = parts.length;

            if(propertiesToCheck[name]){
                while(i < len){
                    if (parts[i].type === "color"){
                        if ("alpha" in parts[i] || "hue" in parts[i]){

                            if (/([^\)]+)\(/.test(parts[i])){
                                colorType = RegExp.$1.toUpperCase();
                            }

                            if (!lastProperty || (lastProperty.property.text.toLowerCase() !== name || lastProperty.colorType !== "compat")){
                                reporter.report("Fallback " + name + " (hex or RGB) should precede " + colorType + " " + name + ".", event.line, event.col, rule);
                            }
                        } else {
                            event.colorType = "compat";
                        }
                    }

                    i++;
                }
            }

            lastProperty = event;
        });

    }

});

CSSLint.addRule({
    id: "floats",
    name: "Disallow too many floats",
    desc: "This rule tests if the float property is used too many times",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this;
        var count = 0;
        parser.addListener("property", function(event){
            if (event.property.text.toLowerCase() === "float" &&
                    event.value.text.toLowerCase() !== "none"){
                count++;
            }
        });
        parser.addListener("endstylesheet", function(){
            reporter.stat("floats", count);
            if (count >= 10){
                reporter.rollupWarn("Too many floats (" + count + "), you're probably using them for layout. Consider using a grid system instead.", rule);
            }
        });
    }

});

CSSLint.addRule({
    id: "font-faces",
    name: "Don't use too many web fonts",
    desc: "Too many different web fonts in the same stylesheet.",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this,
            count = 0;


        parser.addListener("startfontface", function(){
            count++;
        });

        parser.addListener("endstylesheet", function(){
            if (count > 5){
                reporter.rollupWarn("Too many @font-face declarations (" + count + ").", rule);
            }
        });
    }

});

CSSLint.addRule({
    id: "font-sizes",
    name: "Disallow too many font sizes",
    desc: "Checks the number of font-size declarations.",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this,
            count = 0;
        parser.addListener("property", function(event){
            if (event.property.toString() === "font-size"){
                count++;
            }
        });
        parser.addListener("endstylesheet", function(){
            reporter.stat("font-sizes", count);
            if (count >= 10){
                reporter.rollupWarn("Too many font-size declarations (" + count + "), abstraction needed.", rule);
            }
        });
    }

});

CSSLint.addRule({
    id: "gradients",
    name: "Require all gradient definitions",
    desc: "When using a vendor-prefixed gradient, make sure to use them all.",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this,
            gradients;

        parser.addListener("startrule", function(){
            gradients = {
                moz: 0,
                webkit: 0,
                oldWebkit: 0,
                o: 0
            };
        });

        parser.addListener("property", function(event){

            if (/\-(moz|o|webkit)(?:\-(?:linear|radial))\-gradient/i.test(event.value)){
                gradients[RegExp.$1] = 1;
            } else if (/\-webkit\-gradient/i.test(event.value)){
                gradients.oldWebkit = 1;
            }

        });

        parser.addListener("endrule", function(event){
            var missing = [];

            if (!gradients.moz){
                missing.push("Firefox 3.6+");
            }

            if (!gradients.webkit){
                missing.push("Webkit (Safari 5+, Chrome)");
            }

            if (!gradients.oldWebkit){
                missing.push("Old Webkit (Safari 4+, Chrome)");
            }

            if (!gradients.o){
                missing.push("Opera 11.1+");
            }

            if (missing.length && missing.length < 4){
                reporter.report("Missing vendor-prefixed CSS gradients for " + missing.join(", ") + ".", event.selectors[0].line, event.selectors[0].col, rule);
            }

        });

    }

});

CSSLint.addRule({
    id: "ids",
    name: "Disallow IDs in selectors",
    desc: "Selectors should not contain IDs.",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this;
        parser.addListener("startrule", function(event){
            var selectors = event.selectors,
                selector,
                part,
                modifier,
                idCount,
                i, j, k;

            for (i=0; i < selectors.length; i++){
                selector = selectors[i];
                idCount = 0;

                for (j=0; j < selector.parts.length; j++){
                    part = selector.parts[j];
                    if (part.type === parser.SELECTOR_PART_TYPE){
                        for (k=0; k < part.modifiers.length; k++){
                            modifier = part.modifiers[k];
                            if (modifier.type === "id"){
                                idCount++;
                            }
                        }
                    }
                }

                if (idCount === 1){
                    reporter.report("Don't use IDs in selectors.", selector.line, selector.col, rule);
                } else if (idCount > 1){
                    reporter.report(idCount + " IDs in the selector, really?", selector.line, selector.col, rule);
                }
            }

        });
    }

});

CSSLint.addRule({
    id: "import",
    name: "Disallow @import",
    desc: "Don't use @import, use <link> instead.",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this;

        parser.addListener("import", function(event){
            reporter.report("@import prevents parallel downloads, use <link> instead.", event.line, event.col, rule);
        });

    }

});

CSSLint.addRule({
    id: "important",
    name: "Disallow !important",
    desc: "Be careful when using !important declaration",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this,
            count = 0;
        parser.addListener("property", function(event){
            if (event.important === true){
                count++;
                reporter.report("Use of !important", event.line, event.col, rule);
            }
        });
        parser.addListener("endstylesheet", function(){
            reporter.stat("important", count);
            if (count >= 10){
                reporter.rollupWarn("Too many !important declarations (" + count + "), try to use less than 10 to avoid specificity issues.", rule);
            }
        });
    }

});

CSSLint.addRule({
    id: "known-properties",
    name: "Require use of known properties",
    desc: "Properties should be known (listed in CSS3 specification) or be a vendor-prefixed property.",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this;

        parser.addListener("property", function(event){
            if (event.invalid) {
                reporter.report(event.invalid.message, event.line, event.col, rule);
            }

        });
    }

});
CSSLint.addRule({
    id: "order-alphabetical",
    name: "Alphabetical order",
    desc: "Assure properties are in alphabetical order",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this,
            properties;

        var startRule = function () {
            properties = [];
        };

        parser.addListener("startrule", startRule);
        parser.addListener("startfontface", startRule);
        parser.addListener("startpage", startRule);
        parser.addListener("startpagemargin", startRule);
        parser.addListener("startkeyframerule", startRule);

        parser.addListener("property", function(event){
            var name = event.property.text,
                lowerCasePrefixLessName = name.toLowerCase().replace(/^-.*?-/, "");

            properties.push(lowerCasePrefixLessName);
        });

        parser.addListener("endrule", function(event){
            var currentProperties = properties.join(","),
                expectedProperties = properties.sort().join(",");

            if (currentProperties !== expectedProperties){
                reporter.report("Rule doesn't have all its properties in alphabetical ordered.", event.line, event.col, rule);
            }
        });
    }

});

CSSLint.addRule({
    id: "outline-none",
    name: "Disallow outline: none",
    desc: "Use of outline: none or outline: 0 should be limited to :focus rules.",
    browsers: "All",
    tags: ["Accessibility"],
    init: function(parser, reporter){
        var rule = this,
            lastRule;

        function startRule(event){
            if (event.selectors){
                lastRule = {
                    line: event.line,
                    col: event.col,
                    selectors: event.selectors,
                    propCount: 0,
                    outline: false
                };
            } else {
                lastRule = null;
            }
        }

        function endRule(){
            if (lastRule){
                if (lastRule.outline){
                    if (lastRule.selectors.toString().toLowerCase().indexOf(":focus") === -1){
                        reporter.report("Outlines should only be modified using :focus.", lastRule.line, lastRule.col, rule);
                    } else if (lastRule.propCount === 1) {
                        reporter.report("Outlines shouldn't be hidden unless other visual changes are made.", lastRule.line, lastRule.col, rule);
                    }
                }
            }
        }

        parser.addListener("startrule", startRule);
        parser.addListener("startfontface", startRule);
        parser.addListener("startpage", startRule);
        parser.addListener("startpagemargin", startRule);
        parser.addListener("startkeyframerule", startRule);

        parser.addListener("property", function(event){
            var name = event.property.text.toLowerCase(),
                value = event.value;

            if (lastRule){
                lastRule.propCount++;
                if (name === "outline" && (value.toString() === "none" || value.toString() === "0")){
                    lastRule.outline = true;
                }
            }

        });

        parser.addListener("endrule", endRule);
        parser.addListener("endfontface", endRule);
        parser.addListener("endpage", endRule);
        parser.addListener("endpagemargin", endRule);
        parser.addListener("endkeyframerule", endRule);

    }

});

CSSLint.addRule({
    id: "overqualified-elements",
    name: "Disallow overqualified elements",
    desc: "Don't use classes or IDs with elements (a.foo or a#foo).",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this,
            classes = {};

        parser.addListener("startrule", function(event){
            var selectors = event.selectors,
                selector,
                part,
                modifier,
                i, j, k;

            for (i=0; i < selectors.length; i++){
                selector = selectors[i];

                for (j=0; j < selector.parts.length; j++){
                    part = selector.parts[j];
                    if (part.type === parser.SELECTOR_PART_TYPE){
                        for (k=0; k < part.modifiers.length; k++){
                            modifier = part.modifiers[k];
                            if (part.elementName && modifier.type === "id"){
                                reporter.report("Element (" + part + ") is overqualified, just use " + modifier + " without element name.", part.line, part.col, rule);
                            } else if (modifier.type === "class"){

                                if (!classes[modifier]){
                                    classes[modifier] = [];
                                }
                                classes[modifier].push({ modifier: modifier, part: part });
                            }
                        }
                    }
                }
            }
        });

        parser.addListener("endstylesheet", function(){

            var prop;
            for (prop in classes){
                if (classes.hasOwnProperty(prop)){
                    if (classes[prop].length === 1 && classes[prop][0].part.elementName){
                        reporter.report("Element (" + classes[prop][0].part + ") is overqualified, just use " + classes[prop][0].modifier + " without element name.", classes[prop][0].part.line, classes[prop][0].part.col, rule);
                    }
                }
            }
        });
    }

});

CSSLint.addRule({
    id: "qualified-headings",
    name: "Disallow qualified headings",
    desc: "Headings should not be qualified (namespaced).",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this;

        parser.addListener("startrule", function(event){
            var selectors = event.selectors,
                selector,
                part,
                i, j;

            for (i=0; i < selectors.length; i++){
                selector = selectors[i];

                for (j=0; j < selector.parts.length; j++){
                    part = selector.parts[j];
                    if (part.type === parser.SELECTOR_PART_TYPE){
                        if (part.elementName && /h[1-6]/.test(part.elementName.toString()) && j > 0){
                            reporter.report("Heading (" + part.elementName + ") should not be qualified.", part.line, part.col, rule);
                        }
                    }
                }
            }
        });
    }

});

CSSLint.addRule({
    id: "regex-selectors",
    name: "Disallow selectors that look like regexs",
    desc: "Selectors that look like regular expressions are slow and should be avoided.",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this;

        parser.addListener("startrule", function(event){
            var selectors = event.selectors,
                selector,
                part,
                modifier,
                i, j, k;

            for (i=0; i < selectors.length; i++){
                selector = selectors[i];
                for (j=0; j < selector.parts.length; j++){
                    part = selector.parts[j];
                    if (part.type === parser.SELECTOR_PART_TYPE){
                        for (k=0; k < part.modifiers.length; k++){
                            modifier = part.modifiers[k];
                            if (modifier.type === "attribute"){
                                if (/([\~\|\^\$\*]=)/.test(modifier)){
                                    reporter.report("Attribute selectors with " + RegExp.$1 + " are slow!", modifier.line, modifier.col, rule);
                                }
                            }

                        }
                    }
                }
            }
        });
    }

});

CSSLint.addRule({
    id: "rules-count",
    name: "Rules Count",
    desc: "Track how many rules there are.",
    browsers: "All",
    init: function(parser, reporter){
        var count = 0;
        parser.addListener("startrule", function(){
            count++;
        });

        parser.addListener("endstylesheet", function(){
            reporter.stat("rule-count", count);
        });
    }

});

CSSLint.addRule({
    id: "selector-max-approaching",
    name: "Warn when approaching the 4095 selector limit for IE",
    desc: "Will warn when selector count is >= 3800 selectors.",
    browsers: "IE",
    init: function(parser, reporter) {
        var rule = this, count = 0;

        parser.addListener("startrule", function(event) {
            count += event.selectors.length;
        });

        parser.addListener("endstylesheet", function() {
            if (count >= 3800) {
                reporter.report("You have " + count + " selectors. Internet Explorer supports a maximum of 4095 selectors per stylesheet. Consider refactoring.",0,0,rule);
            }
        });
    }

});

CSSLint.addRule({
    id: "selector-max",
    name: "Error when past the 4095 selector limit for IE",
    desc: "Will error when selector count is > 4095.",
    browsers: "IE",
    init: function(parser, reporter){
        var rule = this, count = 0;

        parser.addListener("startrule", function(event) {
            count += event.selectors.length;
        });

        parser.addListener("endstylesheet", function() {
            if (count > 4095) {
                reporter.report("You have " + count + " selectors. Internet Explorer supports a maximum of 4095 selectors per stylesheet. Consider refactoring.",0,0,rule);
            }
        });
    }

});

CSSLint.addRule({
    id: "selector-newline",
    name: "Disallow new-line characters in selectors",
    desc: "New-line characters in selectors are usually a forgotten comma and not a descendant combinator.",
    browsers: "All",
    init: function(parser, reporter) {
        var rule = this;

        function startRule(event) {
            var i, len, selector, p, n, pLen, part, part2, type, currentLine, nextLine,
                selectors = event.selectors;

            for (i = 0, len = selectors.length; i < len; i++) {
                selector = selectors[i];
                for (p = 0, pLen = selector.parts.length; p < pLen; p++) {
                    for (n = p + 1; n < pLen; n++) {
                        part = selector.parts[p];
                        part2 = selector.parts[n];
                        type = part.type;
                        currentLine = part.line;
                        nextLine = part2.line;

                        if (type === "descendant" && nextLine > currentLine) {
                            reporter.report("newline character found in selector (forgot a comma?)", currentLine, selectors[i].parts[0].col, rule);
                        }
                    }
                }

            }
        }

        parser.addListener("startrule", startRule);

    }
});

CSSLint.addRule({
    id: "shorthand",
    name: "Require shorthand properties",
    desc: "Use shorthand properties where possible.",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this,
            prop, i, len,
            propertiesToCheck = {},
            properties,
            mapping = {
                "margin": [
                    "margin-top",
                    "margin-bottom",
                    "margin-left",
                    "margin-right"
                ],
                "padding": [
                    "padding-top",
                    "padding-bottom",
                    "padding-left",
                    "padding-right"
                ]
            };
        for (prop in mapping){
            if (mapping.hasOwnProperty(prop)){
                for (i=0, len=mapping[prop].length; i < len; i++){
                    propertiesToCheck[mapping[prop][i]] = prop;
                }
            }
        }

        function startRule(){
            properties = {};
        }
        function endRule(event){

            var prop, i, len, total;
            for (prop in mapping){
                if (mapping.hasOwnProperty(prop)){
                    total=0;

                    for (i=0, len=mapping[prop].length; i < len; i++){
                        total += properties[mapping[prop][i]] ? 1 : 0;
                    }

                    if (total === mapping[prop].length){
                        reporter.report("The properties " + mapping[prop].join(", ") + " can be replaced by " + prop + ".", event.line, event.col, rule);
                    }
                }
            }
        }

        parser.addListener("startrule", startRule);
        parser.addListener("startfontface", startRule);
        parser.addListener("property", function(event){
            var name = event.property.toString().toLowerCase();

            if (propertiesToCheck[name]){
                properties[name] = 1;
            }
        });

        parser.addListener("endrule", endRule);
        parser.addListener("endfontface", endRule);

    }

});

CSSLint.addRule({
    id: "star-property-hack",
    name: "Disallow properties with a star prefix",
    desc: "Checks for the star property hack (targets IE6/7)",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this;
        parser.addListener("property", function(event){
            var property = event.property;

            if (property.hack === "*") {
                reporter.report("Property with star prefix found.", event.property.line, event.property.col, rule);
            }
        });
    }
});

CSSLint.addRule({
    id: "text-indent",
    name: "Disallow negative text-indent",
    desc: "Checks for text indent less than -99px",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this,
            textIndent,
            direction;


        function startRule(){
            textIndent = false;
            direction = "inherit";
        }
        function endRule(){
            if (textIndent && direction !== "ltr"){
                reporter.report("Negative text-indent doesn't work well with RTL. If you use text-indent for image replacement explicitly set direction for that item to ltr.", textIndent.line, textIndent.col, rule);
            }
        }

        parser.addListener("startrule", startRule);
        parser.addListener("startfontface", startRule);
        parser.addListener("property", function(event){
            var name = event.property.toString().toLowerCase(),
                value = event.value;

            if (name === "text-indent" && value.parts[0].value < -99){
                textIndent = event.property;
            } else if (name === "direction" && value.toString() === "ltr"){
                direction = "ltr";
            }
        });

        parser.addListener("endrule", endRule);
        parser.addListener("endfontface", endRule);

    }

});

CSSLint.addRule({
    id: "underscore-property-hack",
    name: "Disallow properties with an underscore prefix",
    desc: "Checks for the underscore property hack (targets IE6)",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this;
        parser.addListener("property", function(event){
            var property = event.property;

            if (property.hack === "_") {
                reporter.report("Property with underscore prefix found.", event.property.line, event.property.col, rule);
            }
        });
    }
});

CSSLint.addRule({
    id: "unique-headings",
    name: "Headings should only be defined once",
    desc: "Headings should be defined only once.",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this;

        var headings = {
                h1: 0,
                h2: 0,
                h3: 0,
                h4: 0,
                h5: 0,
                h6: 0
            };

        parser.addListener("startrule", function(event){
            var selectors = event.selectors,
                selector,
                part,
                pseudo,
                i, j;

            for (i=0; i < selectors.length; i++){
                selector = selectors[i];
                part = selector.parts[selector.parts.length-1];

                if (part.elementName && /(h[1-6])/i.test(part.elementName.toString())){

                    for (j=0; j < part.modifiers.length; j++){
                        if (part.modifiers[j].type === "pseudo"){
                            pseudo = true;
                            break;
                        }
                    }

                    if (!pseudo){
                        headings[RegExp.$1]++;
                        if (headings[RegExp.$1] > 1) {
                            reporter.report("Heading (" + part.elementName + ") has already been defined.", part.line, part.col, rule);
                        }
                    }
                }
            }
        });

        parser.addListener("endstylesheet", function(){
            var prop,
                messages = [];

            for (prop in headings){
                if (headings.hasOwnProperty(prop)){
                    if (headings[prop] > 1){
                        messages.push(headings[prop] + " " + prop + "s");
                    }
                }
            }

            if (messages.length){
                reporter.rollupWarn("You have " + messages.join(", ") + " defined in this stylesheet.", rule);
            }
        });
    }

});

CSSLint.addRule({
    id: "universal-selector",
    name: "Disallow universal selector",
    desc: "The universal selector (*) is known to be slow.",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this;

        parser.addListener("startrule", function(event){
            var selectors = event.selectors,
                selector,
                part,
                i;

            for (i=0; i < selectors.length; i++){
                selector = selectors[i];

                part = selector.parts[selector.parts.length-1];
                if (part.elementName === "*"){
                    reporter.report(rule.desc, part.line, part.col, rule);
                }
            }
        });
    }

});

CSSLint.addRule({
    id: "unqualified-attributes",
    name: "Disallow unqualified attribute selectors",
    desc: "Unqualified attribute selectors are known to be slow.",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this;

        parser.addListener("startrule", function(event){

            var selectors = event.selectors,
                selector,
                part,
                modifier,
                i, k;

            for (i=0; i < selectors.length; i++){
                selector = selectors[i];

                part = selector.parts[selector.parts.length-1];
                if (part.type === parser.SELECTOR_PART_TYPE){
                    for (k=0; k < part.modifiers.length; k++){
                        modifier = part.modifiers[k];
                        if (modifier.type === "attribute" && (!part.elementName || part.elementName === "*")){
                            reporter.report(rule.desc, part.line, part.col, rule);
                        }
                    }
                }

            }
        });
    }

});

CSSLint.addRule({
    id: "vendor-prefix",
    name: "Require standard property with vendor prefix",
    desc: "When using a vendor-prefixed property, make sure to include the standard one.",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this,
            properties,
            num,
            propertiesToCheck = {
                "-webkit-border-radius": "border-radius",
                "-webkit-border-top-left-radius": "border-top-left-radius",
                "-webkit-border-top-right-radius": "border-top-right-radius",
                "-webkit-border-bottom-left-radius": "border-bottom-left-radius",
                "-webkit-border-bottom-right-radius": "border-bottom-right-radius",

                "-o-border-radius": "border-radius",
                "-o-border-top-left-radius": "border-top-left-radius",
                "-o-border-top-right-radius": "border-top-right-radius",
                "-o-border-bottom-left-radius": "border-bottom-left-radius",
                "-o-border-bottom-right-radius": "border-bottom-right-radius",

                "-moz-border-radius": "border-radius",
                "-moz-border-radius-topleft": "border-top-left-radius",
                "-moz-border-radius-topright": "border-top-right-radius",
                "-moz-border-radius-bottomleft": "border-bottom-left-radius",
                "-moz-border-radius-bottomright": "border-bottom-right-radius",

                "-moz-column-count": "column-count",
                "-webkit-column-count": "column-count",

                "-moz-column-gap": "column-gap",
                "-webkit-column-gap": "column-gap",

                "-moz-column-rule": "column-rule",
                "-webkit-column-rule": "column-rule",

                "-moz-column-rule-style": "column-rule-style",
                "-webkit-column-rule-style": "column-rule-style",

                "-moz-column-rule-color": "column-rule-color",
                "-webkit-column-rule-color": "column-rule-color",

                "-moz-column-rule-width": "column-rule-width",
                "-webkit-column-rule-width": "column-rule-width",

                "-moz-column-width": "column-width",
                "-webkit-column-width": "column-width",

                "-webkit-column-span": "column-span",
                "-webkit-columns": "columns",

                "-moz-box-shadow": "box-shadow",
                "-webkit-box-shadow": "box-shadow",

                "-moz-transform" : "transform",
                "-webkit-transform" : "transform",
                "-o-transform" : "transform",
                "-ms-transform" : "transform",

                "-moz-transform-origin" : "transform-origin",
                "-webkit-transform-origin" : "transform-origin",
                "-o-transform-origin" : "transform-origin",
                "-ms-transform-origin" : "transform-origin",

                "-moz-box-sizing" : "box-sizing",
                "-webkit-box-sizing" : "box-sizing"
            };
        function startRule(){
            properties = {};
            num = 1;
        }
        function endRule(){
            var prop,
                i,
                len,
                needed,
                actual,
                needsStandard = [];

            for (prop in properties){
                if (propertiesToCheck[prop]){
                    needsStandard.push({ actual: prop, needed: propertiesToCheck[prop]});
                }
            }

            for (i=0, len=needsStandard.length; i < len; i++){
                needed = needsStandard[i].needed;
                actual = needsStandard[i].actual;

                if (!properties[needed]){
                    reporter.report("Missing standard property '" + needed + "' to go along with '" + actual + "'.", properties[actual][0].name.line, properties[actual][0].name.col, rule);
                } else {
                    if (properties[needed][0].pos < properties[actual][0].pos){
                        reporter.report("Standard property '" + needed + "' should come after vendor-prefixed property '" + actual + "'.", properties[actual][0].name.line, properties[actual][0].name.col, rule);
                    }
                }
            }

        }

        parser.addListener("startrule", startRule);
        parser.addListener("startfontface", startRule);
        parser.addListener("startpage", startRule);
        parser.addListener("startpagemargin", startRule);
        parser.addListener("startkeyframerule", startRule);

        parser.addListener("property", function(event){
            var name = event.property.text.toLowerCase();

            if (!properties[name]){
                properties[name] = [];
            }

            properties[name].push({ name: event.property, value : event.value, pos:num++ });
        });

        parser.addListener("endrule", endRule);
        parser.addListener("endfontface", endRule);
        parser.addListener("endpage", endRule);
        parser.addListener("endpagemargin", endRule);
        parser.addListener("endkeyframerule", endRule);
    }

});

CSSLint.addRule({
    id: "zero-units",
    name: "Disallow units for 0 values",
    desc: "You don't need to specify units when a value is 0.",
    browsers: "All",
    init: function(parser, reporter){
        var rule = this;
        parser.addListener("property", function(event){
            var parts = event.value.parts,
                i = 0,
                len = parts.length;

            while(i < len){
                if ((parts[i].units || parts[i].type === "percentage") && parts[i].value === 0 && parts[i].type !== "time"){
                    reporter.report("Values of 0 shouldn't have units specified.", parts[i].line, parts[i].col, rule);
                }
                i++;
            }

        });

    }

});

(function() {
    var xmlEscape = function(str) {
        if (!str || str.constructor !== String) {
            return "";
        }

        return str.replace(/[\"&><]/g, function(match) {
            switch (match) {
                case "\"":
                    return "&quot;";
                case "&":
                    return "&amp;";
                case "<":
                    return "&lt;";
                case ">":
                    return "&gt;";
            }
        });
    };

    CSSLint.addFormatter({
        id: "checkstyle-xml",
        name: "Checkstyle XML format",
        startFormat: function(){
            return "<?xml version=\"1.0\" encoding=\"utf-8\"?><checkstyle>";
        },
        endFormat: function(){
            return "</checkstyle>";
        },
        readError: function(filename, message) {
            return "<file name=\"" + xmlEscape(filename) + "\"><error line=\"0\" column=\"0\" severty=\"error\" message=\"" + xmlEscape(message) + "\"></error></file>";
        },
        formatResults: function(results, filename/*, options*/) {
            var messages = results.messages,
                output = [];
            var generateSource = function(rule) {
                if (!rule || !("name" in rule)) {
                    return "";
                }
                return "net.csslint." + rule.name.replace(/\s/g,"");
            };



            if (messages.length > 0) {
                output.push("<file name=\""+filename+"\">");
                CSSLint.Util.forEach(messages, function (message) {
                    if (!message.rollup) {
                        output.push("<error line=\"" + message.line + "\" column=\"" + message.col + "\" severity=\"" + message.type + "\"" +
                          " message=\"" + xmlEscape(message.message) + "\" source=\"" + generateSource(message.rule) +"\"/>");
                    }
                });
                output.push("</file>");
            }

            return output.join("");
        }
    });

}());

CSSLint.addFormatter({
    id: "compact",
    name: "Compact, 'porcelain' format",
    startFormat: function() {
        return "";
    },
    endFormat: function() {
        return "";
    },
    formatResults: function(results, filename, options) {
        var messages = results.messages,
            output = "";
        options = options || {};
        var capitalize = function(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        };

        if (messages.length === 0) {
              return options.quiet ? "" : filename + ": Lint Free!";
        }

        CSSLint.Util.forEach(messages, function(message) {
            if (message.rollup) {
                output += filename + ": " + capitalize(message.type) + " - " + message.message + "\n";
            } else {
                output += filename + ": " + "line " + message.line +
                    ", col " + message.col + ", " + capitalize(message.type) + " - " + message.message + " (" + message.rule.id + ")\n";
            }
        });

        return output;
    }
});

CSSLint.addFormatter({
    id: "csslint-xml",
    name: "CSSLint XML format",
    startFormat: function(){
        return "<?xml version=\"1.0\" encoding=\"utf-8\"?><csslint>";
    },
    endFormat: function(){
        return "</csslint>";
    },
    formatResults: function(results, filename/*, options*/) {
        var messages = results.messages,
            output = [];
        var escapeSpecialCharacters = function(str) {
            if (!str || str.constructor !== String) {
                return "";
            }
            return str.replace(/\"/g, "'").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        };

        if (messages.length > 0) {
            output.push("<file name=\""+filename+"\">");
            CSSLint.Util.forEach(messages, function (message) {
                if (message.rollup) {
                    output.push("<issue severity=\"" + message.type + "\" reason=\"" + escapeSpecialCharacters(message.message) + "\" evidence=\"" + escapeSpecialCharacters(message.evidence) + "\"/>");
                } else {
                    output.push("<issue line=\"" + message.line + "\" char=\"" + message.col + "\" severity=\"" + message.type + "\"" +
                        " reason=\"" + escapeSpecialCharacters(message.message) + "\" evidence=\"" + escapeSpecialCharacters(message.evidence) + "\"/>");
                }
            });
            output.push("</file>");
        }

        return output.join("");
    }
});

CSSLint.addFormatter({
    id: "junit-xml",
    name: "JUNIT XML format",
    startFormat: function(){
        return "<?xml version=\"1.0\" encoding=\"utf-8\"?><testsuites>";
    },
    endFormat: function() {
        return "</testsuites>";
    },
    formatResults: function(results, filename/*, options*/) {

        var messages = results.messages,
            output = [],
            tests = {
                "error": 0,
                "failure": 0
            };
        var generateSource = function(rule) {
            if (!rule || !("name" in rule)) {
                return "";
            }
            return "net.csslint." + rule.name.replace(/\s/g,"");
        };
        var escapeSpecialCharacters = function(str) {

            if (!str || str.constructor !== String) {
                return "";
            }

            return str.replace(/\"/g, "'").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        };

        if (messages.length > 0) {

            messages.forEach(function (message) {
                var type = message.type === "warning" ? "error" : message.type;
                if (!message.rollup) {
                    output.push("<testcase time=\"0\" name=\"" + generateSource(message.rule) + "\">");
                    output.push("<" + type + " message=\"" + escapeSpecialCharacters(message.message) + "\"><![CDATA[" + message.line + ":" + message.col + ":" + escapeSpecialCharacters(message.evidence)  + "]]></" + type + ">");
                    output.push("</testcase>");

                    tests[type] += 1;

                }

            });

            output.unshift("<testsuite time=\"0\" tests=\"" + messages.length + "\" skipped=\"0\" errors=\"" + tests.error + "\" failures=\"" + tests.failure + "\" package=\"net.csslint\" name=\"" + filename + "\">");
            output.push("</testsuite>");

        }

        return output.join("");

    }
});

CSSLint.addFormatter({
    id: "lint-xml",
    name: "Lint XML format",
    startFormat: function(){
        return "<?xml version=\"1.0\" encoding=\"utf-8\"?><lint>";
    },
    endFormat: function(){
        return "</lint>";
    },
    formatResults: function(results, filename/*, options*/) {
        var messages = results.messages,
            output = [];
        var escapeSpecialCharacters = function(str) {
            if (!str || str.constructor !== String) {
                return "";
            }
            return str.replace(/\"/g, "'").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        };

        if (messages.length > 0) {

            output.push("<file name=\""+filename+"\">");
            CSSLint.Util.forEach(messages, function (message) {
                if (message.rollup) {
                    output.push("<issue severity=\"" + message.type + "\" reason=\"" + escapeSpecialCharacters(message.message) + "\" evidence=\"" + escapeSpecialCharacters(message.evidence) + "\"/>");
                } else {
                    output.push("<issue line=\"" + message.line + "\" char=\"" + message.col + "\" severity=\"" + message.type + "\"" +
                        " reason=\"" + escapeSpecialCharacters(message.message) + "\" evidence=\"" + escapeSpecialCharacters(message.evidence) + "\"/>");
                }
            });
            output.push("</file>");
        }

        return output.join("");
    }
});

CSSLint.addFormatter({
    id: "text",
    name: "Plain Text",
    startFormat: function() {
        return "";
    },
    endFormat: function() {
        return "";
    },
    formatResults: function(results, filename, options) {
        var messages = results.messages,
            output = "";
        options = options || {};

        if (messages.length === 0) {
            return options.quiet ? "" : "\n\ncsslint: No errors in " + filename + ".";
        }

        output = "\n\ncsslint: There ";
        if (messages.length === 1) {
            output += "is 1 problem";
        } else {
            output += "are " + messages.length  +  " problems";
        }
        output += " in " + filename + ".";

        var pos = filename.lastIndexOf("/"),
            shortFilename = filename;

        if (pos === -1){
            pos = filename.lastIndexOf("\\");
        }
        if (pos > -1){
            shortFilename = filename.substring(pos+1);
        }

        CSSLint.Util.forEach(messages, function (message, i) {
            output = output + "\n\n" + shortFilename;
            if (message.rollup) {
                output += "\n" + (i+1) + ": " + message.type;
                output += "\n" + message.message;
            } else {
                output += "\n" + (i+1) + ": " + message.type + " at line " + message.line + ", col " + message.col;
                output += "\n" + message.message;
                output += "\n" + message.evidence;
            }
        });

        return output;
    }
});

module.exports.CSSLint = CSSLint;

});

define("ace/mode/html_worker",["require","exports","module","ace/lib/oop","ace/lib/lang","ace/worker/mirror","ace/mode/html/saxparser"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var Range = require("../range").Range;
var Document = require("../document").Document;
var lang = require("../lib/lang");
var Mirror = require("../worker/mirror").Mirror;
var SAXParser = require("./html/saxparser").SAXParser;
var CSSLint = require("./css/csslint").CSSLint;

var errorTypes = {
    "expected-doctype-but-got-start-tag": "info",
    "expected-doctype-but-got-chars": "info",
    "non-html-root": "info"
}

function startRegex(arr) {
   return RegExp("^(" + arr.join("|") + ")");
}

var disabledWarningsRe = startRegex([
   "Bad for in variable '(.+)'.",
   'Missing "use strict"'
]);
var errorsRe = startRegex([
   "Unexpected",
   "Expected ",
   "Confusing (plus|minus)",
   "\\{a\\} unterminated regular expression",
   "Unclosed ",
   "Unmatched ",
   "Unbegun comment",
   "Bad invocation",
   "Missing space after",
   "Missing operator at"
]);
var infoRe = startRegex([
   "Expected an assignment",
   "Bad escapement of EOL",
   "Unexpected comma",
   "Unexpected space",
   "Missing radix parameter.",
   "A leading decimal point can",
   "\\['{a}'\\] is better written in dot notation.",
   "'{a}' used out of scope"
]);

var Worker = exports.Worker = function(sender) {
    Mirror.call(this, sender);
    this.setTimeout(400);
    this.context = null;
    this.ruleset = null;
    this.setDisabledRules("ids|order-alphabetical");
    this.setInfoRules(
      "adjoining-classes|qualified-headings|zero-units|gradients|" +
      "import|outline-none|vendor-prefix"
    );
};

oop.inherits(Worker, Mirror);

(function() {
	
	/*node module.exports = jslint;*/
	this.isValidJS = function(str) {
	    try {
	        eval("throw 0;" + str);
	    } catch(e) {
	        if (e === 0)
	            return true;
	    }
	    return false
	};
	
    this.setOptions = function(options) {
        this.context = options.context;
    };

    this.setInfoRules = function(ruleNames) {
        if (typeof ruleNames == "string")
            ruleNames = ruleNames.split("|");
        this.infoRules = lang.arrayToMap(ruleNames);
        this.doc.getValue() && this.deferredUpdate.schedule(100);
    };

    this.setDisabledRules = function(ruleNames) {
        if (!ruleNames) {
            this.ruleset = null;
        } else {
            if (typeof ruleNames == "string")
                ruleNames = ruleNames.split("|");
            var all = {};

            CSSLint.getRules().forEach(function(x){
                all[x.id] = true;
            });
            ruleNames.forEach(function(x) {
                delete all[x];
            });
            
            this.ruleset = all;
        }
        this.doc.getValue() && this.deferredUpdate.schedule(100);
    };
	
    this.onUpdate = function() {
		// HTML
        var value = this.doc.getValue();
        if (!value)
            return;
        var parser = new SAXParser();
        var errors = [];
        var noop = function(){};
        parser.contentHandler = {
           startDocument: noop,
           endDocument: noop,
           startElement: noop,
           endElement: noop,
           characters: noop
        };
        parser.errorHandler = {
            error: function(message, location, code) {
                errors.push({
                    row: location.line,
                    column: location.column,
                    text: message,
					type: "html",
                    type: errorTypes[code] || "error"
                });
            }
        };
        if (this.context)
            parser.parseFragment(value, this.context);
        else
            parser.parse(value);
        //this.sender.emit("error", errors);
	
		// JS
		var start_value = this.doc.getValue(), arr_value = [], i, len, value = '', inscript = false,
			start_token = 'SSSSSSSSSSSSSSTARTHEREEEEEEEEEEEEEEEE',
			end_token = 'EEEEEEEEEEEEEEEENDHEREEEEEEEEEEEEEEEE';

		start_value = start_value.replace(/^#!.*\n/, '\n')
	        .replace(/SSSSSSSSSSSSSSTARTHEREEEEEEEEEEEEEEEE/gi, '')
	        .replace(/EEEEEEEEEEEEEEEENDHEREEEEEEEEEEEEEEEE/gi, '')
	        .replace(/\s*<\/script>/gi, end_token)
	        .replace(/<script.*>/gi, start_token);

		arr_value = start_value.split('\n');

		// get only javascript remove the html
		for (i = 0, len = arr_value.length; i < len; i = i + 1) {

			if (inscript === false && arr_value[i].indexOf(start_token) !== -1 && arr_value[i].indexOf(end_token) !== -1) {

			    value += arr_value[i].substring(arr_value[i].indexOf(start_token) + start_token.length, arr_value[i].indexOf(end_token)) + '\n';

			} else if (inscript === false && arr_value[i].indexOf(start_token) !== -1) {
			    inscript = true;

			    value += arr_value[i].substring(arr_value[i].indexOf(start_token) + start_token.length) + '\n';

			} else if (inscript === true && arr_value[i].indexOf(end_token) === -1) {
			    value += arr_value[i] + '\n';

			} else if (inscript === true && arr_value[i].indexOf(end_token) !== -1) {
			    value += arr_value[i].substring(0, arr_value[i].indexOf(end_token)) + '\n';

			    inscript = false;
			} else {
			    value += '\n';
			}
		}

		if (value) {
			var maxErrorLevel = this.isValidJS(value) ? "warning" : "error";
			var jslint_results = jslint(value, this.options);
			var results = jslint_results.warnings;

			var errorAdded = false;
			for (var i = 0; i < results.length; i++) {
				var error = results[i];
				if (!error) {
				    continue;
			    }
				var raw = error.raw;
				var type = "warning";

				if (raw == "Missing semicolon.") {
				   var str = error.evidence.substr(error.character);
				   str = str.charAt(str.search(/\S/));
				   if (maxErrorLevel == "error" && str && /[\w\d{(['"]/.test(str)) {
				       error.reason = 'Missing ";" before statement';
				       type = "error";
				   } else {
				       type = "info";
				   }
				} else if (infoRe.test(raw)) {
				    type = "info"
				} else if (errorsRe.test(raw)) {
				    errorAdded  = true;
				    type = maxErrorLevel;
				} else if (raw == "'{a}' is not defined.") {
				    type = "warning";
				} else if (raw == "'{a}' is defined but never used.") {
				    type = "info";
				}

				errors.push({
				    row: error.line,
				    column: error.column,
				    text: error.message,
				    type: type,
				    raw: raw
				});

				if (errorAdded) {
				}
			}
		}

		// CSS
		var start_value = this.doc.getValue(), arr_value = [], i, len, value = '', inscript = false,
			start_token = 'SSSSSSSSSSSSSSTARTHEREEEEEEEEEEEEEEEE',
			end_token = 'EEEEEEEEEEEEEEEENDHEREEEEEEEEEEEEEEEE';

		start_value = start_value.replace(/^#!.*\n/, '\n')
	        .replace(/SSSSSSSSSSSSSSTARTHEREEEEEEEEEEEEEEEE/gi, '')
	        .replace(/EEEEEEEEEEEEEEEENDHEREEEEEEEEEEEEEEEE/gi, '')
	        .replace(/\s*<\/style>/gi, end_token)
	        .replace(/<style.*>/gi, start_token);

		arr_value = start_value.split('\n');

		// get only javascript remove the html
		for (i = 0, len = arr_value.length; i < len; i = i + 1) {

			if (inscript === false && arr_value[i].indexOf(start_token) !== -1 && arr_value[i].indexOf(end_token) !== -1) {

			    value += arr_value[i].substring(arr_value[i].indexOf(start_token) + start_token.length, arr_value[i].indexOf(end_token)) + '\n';

			} else if (inscript === false && arr_value[i].indexOf(start_token) !== -1) {
			    inscript = true;

			    value += arr_value[i].substring(arr_value[i].indexOf(start_token) + start_token.length) + '\n';

			} else if (inscript === true && arr_value[i].indexOf(end_token) === -1) {
			    value += arr_value[i] + '\n';

			} else if (inscript === true && arr_value[i].indexOf(end_token) !== -1) {
			    value += arr_value[i].substring(0, arr_value[i].indexOf(end_token)) + '\n';

			    inscript = false;
			} else {
			    value += '\n';
			}
		}
        if (!value)
			return this.sender.emit("annotate", errors);
        var infoRules = this.infoRules;

        var result = CSSLint.verify(value, this.ruleset);
		var new_errors = result.messages.map(function(msg) {
            return {
                row: msg.line - 1,
                column: msg.col - 1,
                text: msg.message,
                type: infoRules[msg.rule.id] ? "info" : msg.type,
                rule: msg.rule.name
            }
        });
		
		errors = errors.concat(new_errors);
		
		// EMIT
		this.sender.emit("error", errors);
    };

}).call(Worker.prototype);

});

define("ace/lib/es5-shim",["require","exports","module"], function(require, exports, module) {

function Empty() {}

if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that) { // .length is 1
        var target = this;
        if (typeof target != "function") {
            throw new TypeError("Function.prototype.bind called on incompatible " + target);
        }
        var args = slice.call(arguments, 1); // for normal call
        var bound = function () {

            if (this instanceof bound) {

                var result = target.apply(
                    this,
                    args.concat(slice.call(arguments))
                );
                if (Object(result) === result) {
                    return result;
                }
                return this;

            } else {
                return target.apply(
                    that,
                    args.concat(slice.call(arguments))
                );

            }

        };
        if(target.prototype) {
            Empty.prototype = target.prototype;
            bound.prototype = new Empty();
            Empty.prototype = null;
        }
        return bound;
    };
}
var call = Function.prototype.call;
var prototypeOfArray = Array.prototype;
var prototypeOfObject = Object.prototype;
var slice = prototypeOfArray.slice;
var _toString = call.bind(prototypeOfObject.toString);
var owns = call.bind(prototypeOfObject.hasOwnProperty);
var defineGetter;
var defineSetter;
var lookupGetter;
var lookupSetter;
var supportsAccessors;
if ((supportsAccessors = owns(prototypeOfObject, "__defineGetter__"))) {
    defineGetter = call.bind(prototypeOfObject.__defineGetter__);
    defineSetter = call.bind(prototypeOfObject.__defineSetter__);
    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);
    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);
}
if ([1,2].splice(0).length != 2) {
    if(function() { // test IE < 9 to splice bug - see issue #138
        function makeArray(l) {
            var a = new Array(l+2);
            a[0] = a[1] = 0;
            return a;
        }
        var array = [], lengthBefore;
        
        array.splice.apply(array, makeArray(20));
        array.splice.apply(array, makeArray(26));

        lengthBefore = array.length; //46
        array.splice(5, 0, "XXX"); // add one element

        lengthBefore + 1 == array.length

        if (lengthBefore + 1 == array.length) {
            return true;// has right splice implementation without bugs
        }
    }()) {//IE 6/7
        var array_splice = Array.prototype.splice;
        Array.prototype.splice = function(start, deleteCount) {
            if (!arguments.length) {
                return [];
            } else {
                return array_splice.apply(this, [
                    start === void 0 ? 0 : start,
                    deleteCount === void 0 ? (this.length - start) : deleteCount
                ].concat(slice.call(arguments, 2)))
            }
        };
    } else {//IE8
        Array.prototype.splice = function(pos, removeCount){
            var length = this.length;
            if (pos > 0) {
                if (pos > length)
                    pos = length;
            } else if (pos == void 0) {
                pos = 0;
            } else if (pos < 0) {
                pos = Math.max(length + pos, 0);
            }

            if (!(pos+removeCount < length))
                removeCount = length - pos;

            var removed = this.slice(pos, pos+removeCount);
            var insert = slice.call(arguments, 2);
            var add = insert.length;            
            if (pos === length) {
                if (add) {
                    this.push.apply(this, insert);
                }
            } else {
                var remove = Math.min(removeCount, length - pos);
                var tailOldPos = pos + remove;
                var tailNewPos = tailOldPos + add - remove;
                var tailCount = length - tailOldPos;
                var lengthAfterRemove = length - remove;

                if (tailNewPos < tailOldPos) { // case A
                    for (var i = 0; i < tailCount; ++i) {
                        this[tailNewPos+i] = this[tailOldPos+i];
                    }
                } else if (tailNewPos > tailOldPos) { // case B
                    for (i = tailCount; i--; ) {
                        this[tailNewPos+i] = this[tailOldPos+i];
                    }
                } // else, add == remove (nothing to do)

                if (add && pos === lengthAfterRemove) {
                    this.length = lengthAfterRemove; // truncate array
                    this.push.apply(this, insert);
                } else {
                    this.length = lengthAfterRemove + add; // reserves space
                    for (i = 0; i < add; ++i) {
                        this[pos+i] = insert[i];
                    }
                }
            }
            return removed;
        };
    }
}
if (!Array.isArray) {
    Array.isArray = function isArray(obj) {
        return _toString(obj) == "[object Array]";
    };
}
var boxedString = Object("a"),
    splitString = boxedString[0] != "a" || !(0 in boxedString);

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function forEach(fun /*, thisp*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            thisp = arguments[1],
            i = -1,
            length = self.length >>> 0;
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        while (++i < length) {
            if (i in self) {
                fun.call(thisp, self[i], i, object);
            }
        }
    };
}
if (!Array.prototype.map) {
    Array.prototype.map = function map(fun /*, thisp*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            result = Array(length),
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self)
                result[i] = fun.call(thisp, self[i], i, object);
        }
        return result;
    };
}
if (!Array.prototype.filter) {
    Array.prototype.filter = function filter(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                    object,
            length = self.length >>> 0,
            result = [],
            value,
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self) {
                value = self[i];
                if (fun.call(thisp, value, i, object)) {
                    result.push(value);
                }
            }
        }
        return result;
    };
}
if (!Array.prototype.every) {
    Array.prototype.every = function every(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self && !fun.call(thisp, self[i], i, object)) {
                return false;
            }
        }
        return true;
    };
}
if (!Array.prototype.some) {
    Array.prototype.some = function some(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self && fun.call(thisp, self[i], i, object)) {
                return true;
            }
        }
        return false;
    };
}
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function reduce(fun /*, initial*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0;
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }
        if (!length && arguments.length == 1) {
            throw new TypeError("reduce of empty array with no initial value");
        }

        var i = 0;
        var result;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i++];
                    break;
                }
                if (++i >= length) {
                    throw new TypeError("reduce of empty array with no initial value");
                }
            } while (true);
        }

        for (; i < length; i++) {
            if (i in self) {
                result = fun.call(void 0, result, self[i], i, object);
            }
        }

        return result;
    };
}
if (!Array.prototype.reduceRight) {
    Array.prototype.reduceRight = function reduceRight(fun /*, initial*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0;
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }
        if (!length && arguments.length == 1) {
            throw new TypeError("reduceRight of empty array with no initial value");
        }

        var result, i = length - 1;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i--];
                    break;
                }
                if (--i < 0) {
                    throw new TypeError("reduceRight of empty array with no initial value");
                }
            } while (true);
        }

        do {
            if (i in this) {
                result = fun.call(void 0, result, self[i], i, object);
            }
        } while (i--);

        return result;
    };
}
if (!Array.prototype.indexOf || ([0, 1].indexOf(1, 2) != -1)) {
    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */ ) {
        var self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                toObject(this),
            length = self.length >>> 0;

        if (!length) {
            return -1;
        }

        var i = 0;
        if (arguments.length > 1) {
            i = toInteger(arguments[1]);
        }
        i = i >= 0 ? i : Math.max(0, length + i);
        for (; i < length; i++) {
            if (i in self && self[i] === sought) {
                return i;
            }
        }
        return -1;
    };
}
if (!Array.prototype.lastIndexOf || ([0, 1].lastIndexOf(0, -3) != -1)) {
    Array.prototype.lastIndexOf = function lastIndexOf(sought /*, fromIndex */) {
        var self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                toObject(this),
            length = self.length >>> 0;

        if (!length) {
            return -1;
        }
        var i = length - 1;
        if (arguments.length > 1) {
            i = Math.min(i, toInteger(arguments[1]));
        }
        i = i >= 0 ? i : length - Math.abs(i);
        for (; i >= 0; i--) {
            if (i in self && sought === self[i]) {
                return i;
            }
        }
        return -1;
    };
}
if (!Object.getPrototypeOf) {
    Object.getPrototypeOf = function getPrototypeOf(object) {
        return object.__proto__ || (
            object.constructor ?
            object.constructor.prototype :
            prototypeOfObject
        );
    };
}
if (!Object.getOwnPropertyDescriptor) {
    var ERR_NON_OBJECT = "Object.getOwnPropertyDescriptor called on a " +
                         "non-object: ";
    Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, property) {
        if ((typeof object != "object" && typeof object != "function") || object === null)
            throw new TypeError(ERR_NON_OBJECT + object);
        if (!owns(object, property))
            return;

        var descriptor, getter, setter;
        descriptor =  { enumerable: true, configurable: true };
        if (supportsAccessors) {
            var prototype = object.__proto__;
            object.__proto__ = prototypeOfObject;

            var getter = lookupGetter(object, property);
            var setter = lookupSetter(object, property);
            object.__proto__ = prototype;

            if (getter || setter) {
                if (getter) descriptor.get = getter;
                if (setter) descriptor.set = setter;
                return descriptor;
            }
        }
        descriptor.value = object[property];
        return descriptor;
    };
}
if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function getOwnPropertyNames(object) {
        return Object.keys(object);
    };
}
if (!Object.create) {
    var createEmpty;
    if (Object.prototype.__proto__ === null) {
        createEmpty = function () {
            return { "__proto__": null };
        };
    } else {
        createEmpty = function () {
            var empty = {};
            for (var i in empty)
                empty[i] = null;
            empty.constructor =
            empty.hasOwnProperty =
            empty.propertyIsEnumerable =
            empty.isPrototypeOf =
            empty.toLocaleString =
            empty.toString =
            empty.valueOf =
            empty.__proto__ = null;
            return empty;
        }
    }

    Object.create = function create(prototype, properties) {
        var object;
        if (prototype === null) {
            object = createEmpty();
        } else {
            if (typeof prototype != "object")
                throw new TypeError("typeof prototype["+(typeof prototype)+"] != 'object'");
            var Type = function () {};
            Type.prototype = prototype;
            object = new Type();
            object.__proto__ = prototype;
        }
        if (properties !== void 0)
            Object.defineProperties(object, properties);
        return object;
    };
}

function doesDefinePropertyWork(object) {
    try {
        Object.defineProperty(object, "sentinel", {});
        return "sentinel" in object;
    } catch (exception) {
    }
}
if (Object.defineProperty) {
    var definePropertyWorksOnObject = doesDefinePropertyWork({});
    var definePropertyWorksOnDom = typeof document == "undefined" ||
        doesDefinePropertyWork(document.createElement("div"));
    if (!definePropertyWorksOnObject || !definePropertyWorksOnDom) {
        var definePropertyFallback = Object.defineProperty;
    }
}

if (!Object.defineProperty || definePropertyFallback) {
    var ERR_NON_OBJECT_DESCRIPTOR = "Property description must be an object: ";
    var ERR_NON_OBJECT_TARGET = "Object.defineProperty called on non-object: "
    var ERR_ACCESSORS_NOT_SUPPORTED = "getters & setters can not be defined " +
                                      "on this javascript engine";

    Object.defineProperty = function defineProperty(object, property, descriptor) {
        if ((typeof object != "object" && typeof object != "function") || object === null)
            throw new TypeError(ERR_NON_OBJECT_TARGET + object);
        if ((typeof descriptor != "object" && typeof descriptor != "function") || descriptor === null)
            throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR + descriptor);
        if (definePropertyFallback) {
            try {
                return definePropertyFallback.call(Object, object, property, descriptor);
            } catch (exception) {
            }
        }
        if (owns(descriptor, "value")) {

            if (supportsAccessors && (lookupGetter(object, property) ||
                                      lookupSetter(object, property)))
            {
                var prototype = object.__proto__;
                object.__proto__ = prototypeOfObject;
                delete object[property];
                object[property] = descriptor.value;
                object.__proto__ = prototype;
            } else {
                object[property] = descriptor.value;
            }
        } else {
            if (!supportsAccessors)
                throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);
            if (owns(descriptor, "get"))
                defineGetter(object, property, descriptor.get);
            if (owns(descriptor, "set"))
                defineSetter(object, property, descriptor.set);
        }

        return object;
    };
}
if (!Object.defineProperties) {
    Object.defineProperties = function defineProperties(object, properties) {
        for (var property in properties) {
            if (owns(properties, property))
                Object.defineProperty(object, property, properties[property]);
        }
        return object;
    };
}
if (!Object.seal) {
    Object.seal = function seal(object) {
        return object;
    };
}
if (!Object.freeze) {
    Object.freeze = function freeze(object) {
        return object;
    };
}
try {
    Object.freeze(function () {});
} catch (exception) {
    Object.freeze = (function freeze(freezeObject) {
        return function freeze(object) {
            if (typeof object == "function") {
                return object;
            } else {
                return freezeObject(object);
            }
        };
    })(Object.freeze);
}
if (!Object.preventExtensions) {
    Object.preventExtensions = function preventExtensions(object) {
        return object;
    };
}
if (!Object.isSealed) {
    Object.isSealed = function isSealed(object) {
        return false;
    };
}
if (!Object.isFrozen) {
    Object.isFrozen = function isFrozen(object) {
        return false;
    };
}
if (!Object.isExtensible) {
    Object.isExtensible = function isExtensible(object) {
        if (Object(object) === object) {
            throw new TypeError(); // TODO message
        }
        var name = '';
        while (owns(object, name)) {
            name += '?';
        }
        object[name] = true;
        var returnValue = owns(object, name);
        delete object[name];
        return returnValue;
    };
}
if (!Object.keys) {
    var hasDontEnumBug = true,
        dontEnums = [
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "constructor"
        ],
        dontEnumsLength = dontEnums.length;

    for (var key in {"toString": null}) {
        hasDontEnumBug = false;
    }

    Object.keys = function keys(object) {

        if (
            (typeof object != "object" && typeof object != "function") ||
            object === null
        ) {
            throw new TypeError("Object.keys called on a non-object");
        }

        var keys = [];
        for (var name in object) {
            if (owns(object, name)) {
                keys.push(name);
            }
        }

        if (hasDontEnumBug) {
            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
                var dontEnum = dontEnums[i];
                if (owns(object, dontEnum)) {
                    keys.push(dontEnum);
                }
            }
        }
        return keys;
    };

}
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}
var ws = "\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003" +
    "\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028" +
    "\u2029\uFEFF";
if (!String.prototype.trim || ws.trim()) {
    ws = "[" + ws + "]";
    var trimBeginRegexp = new RegExp("^" + ws + ws + "*"),
        trimEndRegexp = new RegExp(ws + ws + "*$");
    String.prototype.trim = function trim() {
        return String(this).replace(trimBeginRegexp, "").replace(trimEndRegexp, "");
    };
}

function toInteger(n) {
    n = +n;
    if (n !== n) { // isNaN
        n = 0;
    } else if (n !== 0 && n !== (1/0) && n !== -(1/0)) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }
    return n;
}

function isPrimitive(input) {
    var type = typeof input;
    return (
        input === null ||
        type === "undefined" ||
        type === "boolean" ||
        type === "number" ||
        type === "string"
    );
}

function toPrimitive(input) {
    var val, valueOf, toString;
    if (isPrimitive(input)) {
        return input;
    }
    valueOf = input.valueOf;
    if (typeof valueOf === "function") {
        val = valueOf.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    toString = input.toString;
    if (typeof toString === "function") {
        val = toString.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    throw new TypeError();
}
var toObject = function (o) {
    if (o == null) { // this matches both null and undefined
        throw new TypeError("can't convert "+o+" to object");
    }
    return Object(o);
};

});
