"no use strict";
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

define("ace/mode/javascript/jshint",["require","exports","module"], function(require, exports, module) {
module.exports = (function outer (modules, cache, entry) {
    var previousRequire = typeof require == "function" && require;
    function newRequire(name, jumped){
        if(!cache[name]) {
            if(!modules[name]) {
                var currentRequire = typeof require == "function" && require;
                if (!jumped && currentRequire) return currentRequire(name, true);
                if (previousRequire) return previousRequire(name, true);
                var err = new Error('Cannot find module \'' + name + '\'');
                err.code = 'MODULE_NOT_FOUND';
                throw err;
            }
            var m = cache[name] = {exports:{}};
            modules[name][0].call(m.exports, function(x){
                var id = modules[name][1][x];
                return newRequire(id ? id : x);
            },m,m.exports,outer,modules,cache,entry);
        }
        return cache[name].exports;
    }
    for(var i=0;i<entry.length;i++) newRequire(entry[i]);
    return newRequire(entry[0]);
})
({"/node_modules/browserify/node_modules/events/events.js":[function(_dereq_,module,exports){

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
      }
      throw TypeError('Uncaught, unspecified "error" event.');
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
      if (typeof console.trace === 'function') {
        console.trace();
      }
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

},{}],"/node_modules/jshint/data/ascii-identifier-data.js":[function(_dereq_,module,exports){
var identifierStartTable = [];

for (var i = 0; i < 128; i++) {
  identifierStartTable[i] =
    i === 36 ||           // $
    i >= 65 && i <= 90 || // A-Z
    i === 95 ||           // _
    i >= 97 && i <= 122;  // a-z
}

var identifierPartTable = [];

for (var i = 0; i < 128; i++) {
  identifierPartTable[i] =
    identifierStartTable[i] || // $, _, A-Z, a-z
    i >= 48 && i <= 57;        // 0-9
}

module.exports = {
  asciiIdentifierStartTable: identifierStartTable,
  asciiIdentifierPartTable: identifierPartTable
};

},{}],"/node_modules/jshint/lodash.js":[function(_dereq_,module,exports){
(function (global){
;(function() {

  var undefined;

  var VERSION = '3.7.0';

  var FUNC_ERROR_TEXT = 'Expected a function';

  var argsTag = '[object Arguments]',
      arrayTag = '[object Array]',
      boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      errorTag = '[object Error]',
      funcTag = '[object Function]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      objectTag = '[object Object]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      weakMapTag = '[object WeakMap]';

  var arrayBufferTag = '[object ArrayBuffer]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';

  var reIsDeepProp = /\.|\[(?:[^[\]]+|(["'])(?:(?!\1)[^\n\\]|\\.)*?)\1\]/,
      reIsPlainProp = /^\w*$/,
      rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g;

  var reRegExpChars = /[.*+?^${}()|[\]\/\\]/g,
      reHasRegExpChars = RegExp(reRegExpChars.source);

  var reEscapeChar = /\\(\\)?/g;

  var reFlags = /\w*$/;

  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
  typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
  typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
  typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
  typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
  typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
  typedArrayTags[dateTag] = typedArrayTags[errorTag] =
  typedArrayTags[funcTag] = typedArrayTags[mapTag] =
  typedArrayTags[numberTag] = typedArrayTags[objectTag] =
  typedArrayTags[regexpTag] = typedArrayTags[setTag] =
  typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

  var cloneableTags = {};
  cloneableTags[argsTag] = cloneableTags[arrayTag] =
  cloneableTags[arrayBufferTag] = cloneableTags[boolTag] =
  cloneableTags[dateTag] = cloneableTags[float32Tag] =
  cloneableTags[float64Tag] = cloneableTags[int8Tag] =
  cloneableTags[int16Tag] = cloneableTags[int32Tag] =
  cloneableTags[numberTag] = cloneableTags[objectTag] =
  cloneableTags[regexpTag] = cloneableTags[stringTag] =
  cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
  cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
  cloneableTags[errorTag] = cloneableTags[funcTag] =
  cloneableTags[mapTag] = cloneableTags[setTag] =
  cloneableTags[weakMapTag] = false;

  var objectTypes = {
    'function': true,
    'object': true
  };

  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  var freeGlobal = freeExports && freeModule && typeof global == 'object' && global && global.Object && global;

  var freeSelf = objectTypes[typeof self] && self && self.Object && self;

  var freeWindow = objectTypes[typeof window] && window && window.Object && window;

  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  var root = freeGlobal || ((freeWindow !== (this && this.window)) && freeWindow) || freeSelf || this;

  function baseFindIndex(array, predicate, fromRight) {
    var length = array.length,
        index = fromRight ? length : -1;

    while ((fromRight ? index-- : ++index < length)) {
      if (predicate(array[index], index, array)) {
        return index;
      }
    }
    return -1;
  }

  function baseIndexOf(array, value, fromIndex) {
    if (value !== value) {
      return indexOfNaN(array, fromIndex);
    }
    var index = fromIndex - 1,
        length = array.length;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  function baseIsFunction(value) {
    return typeof value == 'function' || false;
  }

  function baseToString(value) {
    if (typeof value == 'string') {
      return value;
    }
    return value == null ? '' : (value + '');
  }

  function indexOfNaN(array, fromIndex, fromRight) {
    var length = array.length,
        index = fromIndex + (fromRight ? 0 : -1);

    while ((fromRight ? index-- : ++index < length)) {
      var other = array[index];
      if (other !== other) {
        return index;
      }
    }
    return -1;
  }

  function isObjectLike(value) {
    return !!value && typeof value == 'object';
  }

  var arrayProto = Array.prototype,
      objectProto = Object.prototype;

  var fnToString = Function.prototype.toString;

  var hasOwnProperty = objectProto.hasOwnProperty;

  var objToString = objectProto.toString;

  var reIsNative = RegExp('^' +
    escapeRegExp(objToString)
    .replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
  );

  var ArrayBuffer = isNative(ArrayBuffer = root.ArrayBuffer) && ArrayBuffer,
      bufferSlice = isNative(bufferSlice = ArrayBuffer && new ArrayBuffer(0).slice) && bufferSlice,
      floor = Math.floor,
      getOwnPropertySymbols = isNative(getOwnPropertySymbols = Object.getOwnPropertySymbols) && getOwnPropertySymbols,
      getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
      push = arrayProto.push,
      preventExtensions = isNative(Object.preventExtensions = Object.preventExtensions) && preventExtensions,
      propertyIsEnumerable = objectProto.propertyIsEnumerable,
      Uint8Array = isNative(Uint8Array = root.Uint8Array) && Uint8Array;

  var Float64Array = (function() {
    try {
      var func = isNative(func = root.Float64Array) && func,
          result = new func(new ArrayBuffer(10), 0, 1) && func;
    } catch(e) {}
    return result;
  }());

  var nativeAssign = (function() {
    var object = { '1': 0 },
        func = preventExtensions && isNative(func = Object.assign) && func;

    try { func(preventExtensions(object), 'xo'); } catch(e) {}
    return !object[1] && func;
  }());

  var nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray,
      nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys,
      nativeMax = Math.max,
      nativeMin = Math.min;

  var NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY;

  var MAX_ARRAY_LENGTH = Math.pow(2, 32) - 1,
      MAX_ARRAY_INDEX =  MAX_ARRAY_LENGTH - 1,
      HALF_MAX_ARRAY_LENGTH = MAX_ARRAY_LENGTH >>> 1;

  var FLOAT64_BYTES_PER_ELEMENT = Float64Array ? Float64Array.BYTES_PER_ELEMENT : 0;

  var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

  function lodash() {
  }

  var support = lodash.support = {};

  (function(x) {
    var Ctor = function() { this.x = x; },
        object = { '0': x, 'length': x },
        props = [];

    Ctor.prototype = { 'valueOf': x, 'y': x };
    for (var key in new Ctor) { props.push(key); }

    support.funcDecomp = /\bthis\b/.test(function() { return this; });

    support.funcNames = typeof Function.name == 'string';

    try {
      support.nonEnumArgs = !propertyIsEnumerable.call(arguments, 1);
    } catch(e) {
      support.nonEnumArgs = true;
    }
  }(1, 0));

  function arrayCopy(source, array) {
    var index = -1,
        length = source.length;

    array || (array = Array(length));
    while (++index < length) {
      array[index] = source[index];
    }
    return array;
  }

  function arrayEach(array, iteratee) {
    var index = -1,
        length = array.length;

    while (++index < length) {
      if (iteratee(array[index], index, array) === false) {
        break;
      }
    }
    return array;
  }

  function arrayFilter(array, predicate) {
    var index = -1,
        length = array.length,
        resIndex = -1,
        result = [];

    while (++index < length) {
      var value = array[index];
      if (predicate(value, index, array)) {
        result[++resIndex] = value;
      }
    }
    return result;
  }

  function arrayMap(array, iteratee) {
    var index = -1,
        length = array.length,
        result = Array(length);

    while (++index < length) {
      result[index] = iteratee(array[index], index, array);
    }
    return result;
  }

  function arrayMax(array) {
    var index = -1,
        length = array.length,
        result = NEGATIVE_INFINITY;

    while (++index < length) {
      var value = array[index];
      if (value > result) {
        result = value;
      }
    }
    return result;
  }

  function arraySome(array, predicate) {
    var index = -1,
        length = array.length;

    while (++index < length) {
      if (predicate(array[index], index, array)) {
        return true;
      }
    }
    return false;
  }

  function assignWith(object, source, customizer) {
    var props = keys(source);
    push.apply(props, getSymbols(source));

    var index = -1,
        length = props.length;

    while (++index < length) {
      var key = props[index],
          value = object[key],
          result = customizer(value, source[key], key, object, source);

      if ((result === result ? (result !== value) : (value === value)) ||
          (value === undefined && !(key in object))) {
        object[key] = result;
      }
    }
    return object;
  }

  var baseAssign = nativeAssign || function(object, source) {
    return source == null
      ? object
      : baseCopy(source, getSymbols(source), baseCopy(source, keys(source), object));
  };

  function baseCopy(source, props, object) {
    object || (object = {});

    var index = -1,
        length = props.length;

    while (++index < length) {
      var key = props[index];
      object[key] = source[key];
    }
    return object;
  }

  function baseCallback(func, thisArg, argCount) {
    var type = typeof func;
    if (type == 'function') {
      return thisArg === undefined
        ? func
        : bindCallback(func, thisArg, argCount);
    }
    if (func == null) {
      return identity;
    }
    if (type == 'object') {
      return baseMatches(func);
    }
    return thisArg === undefined
      ? property(func)
      : baseMatchesProperty(func, thisArg);
  }

  function baseClone(value, isDeep, customizer, key, object, stackA, stackB) {
    var result;
    if (customizer) {
      result = object ? customizer(value, key, object) : customizer(value);
    }
    if (result !== undefined) {
      return result;
    }
    if (!isObject(value)) {
      return value;
    }
    var isArr = isArray(value);
    if (isArr) {
      result = initCloneArray(value);
      if (!isDeep) {
        return arrayCopy(value, result);
      }
    } else {
      var tag = objToString.call(value),
          isFunc = tag == funcTag;

      if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
        result = initCloneObject(isFunc ? {} : value);
        if (!isDeep) {
          return baseAssign(result, value);
        }
      } else {
        return cloneableTags[tag]
          ? initCloneByTag(value, tag, isDeep)
          : (object ? value : {});
      }
    }
    stackA || (stackA = []);
    stackB || (stackB = []);

    var length = stackA.length;
    while (length--) {
      if (stackA[length] == value) {
        return stackB[length];
      }
    }
    stackA.push(value);
    stackB.push(result);

    (isArr ? arrayEach : baseForOwn)(value, function(subValue, key) {
      result[key] = baseClone(subValue, isDeep, customizer, key, value, stackA, stackB);
    });
    return result;
  }

  var baseEach = createBaseEach(baseForOwn);

  function baseFilter(collection, predicate) {
    var result = [];
    baseEach(collection, function(value, index, collection) {
      if (predicate(value, index, collection)) {
        result.push(value);
      }
    });
    return result;
  }

  var baseFor = createBaseFor();

  function baseForIn(object, iteratee) {
    return baseFor(object, iteratee, keysIn);
  }

  function baseForOwn(object, iteratee) {
    return baseFor(object, iteratee, keys);
  }

  function baseGet(object, path, pathKey) {
    if (object == null) {
      return;
    }
    if (pathKey !== undefined && pathKey in toObject(object)) {
      path = [pathKey];
    }
    var index = -1,
        length = path.length;

    while (object != null && ++index < length) {
      var result = object = object[path[index]];
    }
    return result;
  }

  function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
    if (value === other) {
      return value !== 0 || (1 / value == 1 / other);
    }
    var valType = typeof value,
        othType = typeof other;

    if ((valType != 'function' && valType != 'object' && othType != 'function' && othType != 'object') ||
        value == null || other == null) {
      return value !== value && other !== other;
    }
    return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
  }

  function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
    var objIsArr = isArray(object),
        othIsArr = isArray(other),
        objTag = arrayTag,
        othTag = arrayTag;

    if (!objIsArr) {
      objTag = objToString.call(object);
      if (objTag == argsTag) {
        objTag = objectTag;
      } else if (objTag != objectTag) {
        objIsArr = isTypedArray(object);
      }
    }
    if (!othIsArr) {
      othTag = objToString.call(other);
      if (othTag == argsTag) {
        othTag = objectTag;
      } else if (othTag != objectTag) {
        othIsArr = isTypedArray(other);
      }
    }
    var objIsObj = objTag == objectTag,
        othIsObj = othTag == objectTag,
        isSameTag = objTag == othTag;

    if (isSameTag && !(objIsArr || objIsObj)) {
      return equalByTag(object, other, objTag);
    }
    if (!isLoose) {
      var valWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
          othWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

      if (valWrapped || othWrapped) {
        return equalFunc(valWrapped ? object.value() : object, othWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
      }
    }
    if (!isSameTag) {
      return false;
    }
    stackA || (stackA = []);
    stackB || (stackB = []);

    var length = stackA.length;
    while (length--) {
      if (stackA[length] == object) {
        return stackB[length] == other;
      }
    }
    stackA.push(object);
    stackB.push(other);

    var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);

    stackA.pop();
    stackB.pop();

    return result;
  }

  function baseIsMatch(object, props, values, strictCompareFlags, customizer) {
    var index = -1,
        length = props.length,
        noCustomizer = !customizer;

    while (++index < length) {
      if ((noCustomizer && strictCompareFlags[index])
            ? values[index] !== object[props[index]]
            : !(props[index] in object)
          ) {
        return false;
      }
    }
    index = -1;
    while (++index < length) {
      var key = props[index],
          objValue = object[key],
          srcValue = values[index];

      if (noCustomizer && strictCompareFlags[index]) {
        var result = objValue !== undefined || (key in object);
      } else {
        result = customizer ? customizer(objValue, srcValue, key) : undefined;
        if (result === undefined) {
          result = baseIsEqual(srcValue, objValue, customizer, true);
        }
      }
      if (!result) {
        return false;
      }
    }
    return true;
  }

  function baseMatches(source) {
    var props = keys(source),
        length = props.length;

    if (!length) {
      return constant(true);
    }
    if (length == 1) {
      var key = props[0],
          value = source[key];

      if (isStrictComparable(value)) {
        return function(object) {
          if (object == null) {
            return false;
          }
          return object[key] === value && (value !== undefined || (key in toObject(object)));
        };
      }
    }
    var values = Array(length),
        strictCompareFlags = Array(length);

    while (length--) {
      value = source[props[length]];
      values[length] = value;
      strictCompareFlags[length] = isStrictComparable(value);
    }
    return function(object) {
      return object != null && baseIsMatch(toObject(object), props, values, strictCompareFlags);
    };
  }

  function baseMatchesProperty(path, value) {
    var isArr = isArray(path),
        isCommon = isKey(path) && isStrictComparable(value),
        pathKey = (path + '');

    path = toPath(path);
    return function(object) {
      if (object == null) {
        return false;
      }
      var key = pathKey;
      object = toObject(object);
      if ((isArr || !isCommon) && !(key in object)) {
        object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
        if (object == null) {
          return false;
        }
        key = last(path);
        object = toObject(object);
      }
      return object[key] === value
        ? (value !== undefined || (key in object))
        : baseIsEqual(value, object[key], null, true);
    };
  }

  function baseMerge(object, source, customizer, stackA, stackB) {
    if (!isObject(object)) {
      return object;
    }
    var isSrcArr = isLength(source.length) && (isArray(source) || isTypedArray(source));
    if (!isSrcArr) {
      var props = keys(source);
      push.apply(props, getSymbols(source));
    }
    arrayEach(props || source, function(srcValue, key) {
      if (props) {
        key = srcValue;
        srcValue = source[key];
      }
      if (isObjectLike(srcValue)) {
        stackA || (stackA = []);
        stackB || (stackB = []);
        baseMergeDeep(object, source, key, baseMerge, customizer, stackA, stackB);
      }
      else {
        var value = object[key],
            result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
            isCommon = result === undefined;

        if (isCommon) {
          result = srcValue;
        }
        if ((isSrcArr || result !== undefined) &&
            (isCommon || (result === result ? (result !== value) : (value === value)))) {
          object[key] = result;
        }
      }
    });
    return object;
  }

  function baseMergeDeep(object, source, key, mergeFunc, customizer, stackA, stackB) {
    var length = stackA.length,
        srcValue = source[key];

    while (length--) {
      if (stackA[length] == srcValue) {
        object[key] = stackB[length];
        return;
      }
    }
    var value = object[key],
        result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
        isCommon = result === undefined;

    if (isCommon) {
      result = srcValue;
      if (isLength(srcValue.length) && (isArray(srcValue) || isTypedArray(srcValue))) {
        result = isArray(value)
          ? value
          : (getLength(value) ? arrayCopy(value) : []);
      }
      else if (isPlainObject(srcValue) || isArguments(srcValue)) {
        result = isArguments(value)
          ? toPlainObject(value)
          : (isPlainObject(value) ? value : {});
      }
      else {
        isCommon = false;
      }
    }
    stackA.push(srcValue);
    stackB.push(result);

    if (isCommon) {
      object[key] = mergeFunc(result, srcValue, customizer, stackA, stackB);
    } else if (result === result ? (result !== value) : (value === value)) {
      object[key] = result;
    }
  }

  function baseProperty(key) {
    return function(object) {
      return object == null ? undefined : object[key];
    };
  }

  function basePropertyDeep(path) {
    var pathKey = (path + '');
    path = toPath(path);
    return function(object) {
      return baseGet(object, path, pathKey);
    };
  }

  function baseSlice(array, start, end) {
    var index = -1,
        length = array.length;

    start = start == null ? 0 : (+start || 0);
    if (start < 0) {
      start = -start > length ? 0 : (length + start);
    }
    end = (end === undefined || end > length) ? length : (+end || 0);
    if (end < 0) {
      end += length;
    }
    length = start > end ? 0 : ((end - start) >>> 0);
    start >>>= 0;

    var result = Array(length);
    while (++index < length) {
      result[index] = array[index + start];
    }
    return result;
  }

  function baseSome(collection, predicate) {
    var result;

    baseEach(collection, function(value, index, collection) {
      result = predicate(value, index, collection);
      return !result;
    });
    return !!result;
  }

  function baseValues(object, props) {
    var index = -1,
        length = props.length,
        result = Array(length);

    while (++index < length) {
      result[index] = object[props[index]];
    }
    return result;
  }

  function binaryIndex(array, value, retHighest) {
    var low = 0,
        high = array ? array.length : low;

    if (typeof value == 'number' && value === value && high <= HALF_MAX_ARRAY_LENGTH) {
      while (low < high) {
        var mid = (low + high) >>> 1,
            computed = array[mid];

        if (retHighest ? (computed <= value) : (computed < value)) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      return high;
    }
    return binaryIndexBy(array, value, identity, retHighest);
  }

  function binaryIndexBy(array, value, iteratee, retHighest) {
    value = iteratee(value);

    var low = 0,
        high = array ? array.length : 0,
        valIsNaN = value !== value,
        valIsUndef = value === undefined;

    while (low < high) {
      var mid = floor((low + high) / 2),
          computed = iteratee(array[mid]),
          isReflexive = computed === computed;

      if (valIsNaN) {
        var setLow = isReflexive || retHighest;
      } else if (valIsUndef) {
        setLow = isReflexive && (retHighest || computed !== undefined);
      } else {
        setLow = retHighest ? (computed <= value) : (computed < value);
      }
      if (setLow) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return nativeMin(high, MAX_ARRAY_INDEX);
  }

  function bindCallback(func, thisArg, argCount) {
    if (typeof func != 'function') {
      return identity;
    }
    if (thisArg === undefined) {
      return func;
    }
    switch (argCount) {
      case 1: return function(value) {
        return func.call(thisArg, value);
      };
      case 3: return function(value, index, collection) {
        return func.call(thisArg, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(thisArg, accumulator, value, index, collection);
      };
      case 5: return function(value, other, key, object, source) {
        return func.call(thisArg, value, other, key, object, source);
      };
    }
    return function() {
      return func.apply(thisArg, arguments);
    };
  }

  function bufferClone(buffer) {
    return bufferSlice.call(buffer, 0);
  }
  if (!bufferSlice) {
    bufferClone = !(ArrayBuffer && Uint8Array) ? constant(null) : function(buffer) {
      var byteLength = buffer.byteLength,
          floatLength = Float64Array ? floor(byteLength / FLOAT64_BYTES_PER_ELEMENT) : 0,
          offset = floatLength * FLOAT64_BYTES_PER_ELEMENT,
          result = new ArrayBuffer(byteLength);

      if (floatLength) {
        var view = new Float64Array(result, 0, floatLength);
        view.set(new Float64Array(buffer, 0, floatLength));
      }
      if (byteLength != offset) {
        view = new Uint8Array(result, offset);
        view.set(new Uint8Array(buffer, offset));
      }
      return result;
    };
  }

  function createAssigner(assigner) {
    return restParam(function(object, sources) {
      var index = -1,
          length = object == null ? 0 : sources.length,
          customizer = length > 2 && sources[length - 2],
          guard = length > 2 && sources[2],
          thisArg = length > 1 && sources[length - 1];

      if (typeof customizer == 'function') {
        customizer = bindCallback(customizer, thisArg, 5);
        length -= 2;
      } else {
        customizer = typeof thisArg == 'function' ? thisArg : null;
        length -= (customizer ? 1 : 0);
      }
      if (guard && isIterateeCall(sources[0], sources[1], guard)) {
        customizer = length < 3 ? null : customizer;
        length = 1;
      }
      while (++index < length) {
        var source = sources[index];
        if (source) {
          assigner(object, source, customizer);
        }
      }
      return object;
    });
  }

  function createBaseEach(eachFunc, fromRight) {
    return function(collection, iteratee) {
      var length = collection ? getLength(collection) : 0;
      if (!isLength(length)) {
        return eachFunc(collection, iteratee);
      }
      var index = fromRight ? length : -1,
          iterable = toObject(collection);

      while ((fromRight ? index-- : ++index < length)) {
        if (iteratee(iterable[index], index, iterable) === false) {
          break;
        }
      }
      return collection;
    };
  }

  function createBaseFor(fromRight) {
    return function(object, iteratee, keysFunc) {
      var iterable = toObject(object),
          props = keysFunc(object),
          length = props.length,
          index = fromRight ? length : -1;

      while ((fromRight ? index-- : ++index < length)) {
        var key = props[index];
        if (iteratee(iterable[key], key, iterable) === false) {
          break;
        }
      }
      return object;
    };
  }

  function createFindIndex(fromRight) {
    return function(array, predicate, thisArg) {
      if (!(array && array.length)) {
        return -1;
      }
      predicate = getCallback(predicate, thisArg, 3);
      return baseFindIndex(array, predicate, fromRight);
    };
  }

  function createForEach(arrayFunc, eachFunc) {
    return function(collection, iteratee, thisArg) {
      return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
        ? arrayFunc(collection, iteratee)
        : eachFunc(collection, bindCallback(iteratee, thisArg, 3));
    };
  }

  function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
    var index = -1,
        arrLength = array.length,
        othLength = other.length,
        result = true;

    if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
      return false;
    }
    while (result && ++index < arrLength) {
      var arrValue = array[index],
          othValue = other[index];

      result = undefined;
      if (customizer) {
        result = isLoose
          ? customizer(othValue, arrValue, index)
          : customizer(arrValue, othValue, index);
      }
      if (result === undefined) {
        if (isLoose) {
          var othIndex = othLength;
          while (othIndex--) {
            othValue = other[othIndex];
            result = (arrValue && arrValue === othValue) || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
            if (result) {
              break;
            }
          }
        } else {
          result = (arrValue && arrValue === othValue) || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
        }
      }
    }
    return !!result;
  }

  function equalByTag(object, other, tag) {
    switch (tag) {
      case boolTag:
      case dateTag:
        return +object == +other;

      case errorTag:
        return object.name == other.name && object.message == other.message;

      case numberTag:
        return (object != +object)
          ? other != +other
          : (object == 0 ? ((1 / object) == (1 / other)) : object == +other);

      case regexpTag:
      case stringTag:
        return object == (other + '');
    }
    return false;
  }

  function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
    var objProps = keys(object),
        objLength = objProps.length,
        othProps = keys(other),
        othLength = othProps.length;

    if (objLength != othLength && !isLoose) {
      return false;
    }
    var skipCtor = isLoose,
        index = -1;

    while (++index < objLength) {
      var key = objProps[index],
          result = isLoose ? key in other : hasOwnProperty.call(other, key);

      if (result) {
        var objValue = object[key],
            othValue = other[key];

        result = undefined;
        if (customizer) {
          result = isLoose
            ? customizer(othValue, objValue, key)
            : customizer(objValue, othValue, key);
        }
        if (result === undefined) {
          result = (objValue && objValue === othValue) || equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB);
        }
      }
      if (!result) {
        return false;
      }
      skipCtor || (skipCtor = key == 'constructor');
    }
    if (!skipCtor) {
      var objCtor = object.constructor,
          othCtor = other.constructor;

      if (objCtor != othCtor &&
          ('constructor' in object && 'constructor' in other) &&
          !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
            typeof othCtor == 'function' && othCtor instanceof othCtor)) {
        return false;
      }
    }
    return true;
  }

  function getCallback(func, thisArg, argCount) {
    var result = lodash.callback || callback;
    result = result === callback ? baseCallback : result;
    return argCount ? result(func, thisArg, argCount) : result;
  }

  function getIndexOf(collection, target, fromIndex) {
    var result = lodash.indexOf || indexOf;
    result = result === indexOf ? baseIndexOf : result;
    return collection ? result(collection, target, fromIndex) : result;
  }

  var getLength = baseProperty('length');

  var getSymbols = !getOwnPropertySymbols ? constant([]) : function(object) {
    return getOwnPropertySymbols(toObject(object));
  };

  function initCloneArray(array) {
    var length = array.length,
        result = new array.constructor(length);

    if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
      result.index = array.index;
      result.input = array.input;
    }
    return result;
  }

  function initCloneObject(object) {
    var Ctor = object.constructor;
    if (!(typeof Ctor == 'function' && Ctor instanceof Ctor)) {
      Ctor = Object;
    }
    return new Ctor;
  }

  function initCloneByTag(object, tag, isDeep) {
    var Ctor = object.constructor;
    switch (tag) {
      case arrayBufferTag:
        return bufferClone(object);

      case boolTag:
      case dateTag:
        return new Ctor(+object);

      case float32Tag: case float64Tag:
      case int8Tag: case int16Tag: case int32Tag:
      case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
        var buffer = object.buffer;
        return new Ctor(isDeep ? bufferClone(buffer) : buffer, object.byteOffset, object.length);

      case numberTag:
      case stringTag:
        return new Ctor(object);

      case regexpTag:
        var result = new Ctor(object.source, reFlags.exec(object));
        result.lastIndex = object.lastIndex;
    }
    return result;
  }

  function isIndex(value, length) {
    value = +value;
    length = length == null ? MAX_SAFE_INTEGER : length;
    return value > -1 && value % 1 == 0 && value < length;
  }

  function isIterateeCall(value, index, object) {
    if (!isObject(object)) {
      return false;
    }
    var type = typeof index;
    if (type == 'number') {
      var length = getLength(object),
          prereq = isLength(length) && isIndex(index, length);
    } else {
      prereq = type == 'string' && index in object;
    }
    if (prereq) {
      var other = object[index];
      return value === value ? (value === other) : (other !== other);
    }
    return false;
  }

  function isKey(value, object) {
    var type = typeof value;
    if ((type == 'string' && reIsPlainProp.test(value)) || type == 'number') {
      return true;
    }
    if (isArray(value)) {
      return false;
    }
    var result = !reIsDeepProp.test(value);
    return result || (object != null && value in toObject(object));
  }

  function isLength(value) {
    return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
  }

  function isStrictComparable(value) {
    return value === value && (value === 0 ? ((1 / value) > 0) : !isObject(value));
  }

  function shimIsPlainObject(value) {
    var Ctor,
        support = lodash.support;

    if (!(isObjectLike(value) && objToString.call(value) == objectTag) ||
        (!hasOwnProperty.call(value, 'constructor') &&
          (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor)))) {
      return false;
    }
    var result;
    baseForIn(value, function(subValue, key) {
      result = key;
    });
    return result === undefined || hasOwnProperty.call(value, result);
  }

  function shimKeys(object) {
    var props = keysIn(object),
        propsLength = props.length,
        length = propsLength && object.length,
        support = lodash.support;

    var allowIndexes = length && isLength(length) &&
      (isArray(object) || (support.nonEnumArgs && isArguments(object)));

    var index = -1,
        result = [];

    while (++index < propsLength) {
      var key = props[index];
      if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
        result.push(key);
      }
    }
    return result;
  }

  function toObject(value) {
    return isObject(value) ? value : Object(value);
  }

  function toPath(value) {
    if (isArray(value)) {
      return value;
    }
    var result = [];
    baseToString(value).replace(rePropName, function(match, number, quote, string) {
      result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
    });
    return result;
  }

  var findLastIndex = createFindIndex(true);

  function indexOf(array, value, fromIndex) {
    var length = array ? array.length : 0;
    if (!length) {
      return -1;
    }
    if (typeof fromIndex == 'number') {
      fromIndex = fromIndex < 0 ? nativeMax(length + fromIndex, 0) : fromIndex;
    } else if (fromIndex) {
      var index = binaryIndex(array, value),
          other = array[index];

      if (value === value ? (value === other) : (other !== other)) {
        return index;
      }
      return -1;
    }
    return baseIndexOf(array, value, fromIndex || 0);
  }

  function last(array) {
    var length = array ? array.length : 0;
    return length ? array[length - 1] : undefined;
  }

  function slice(array, start, end) {
    var length = array ? array.length : 0;
    if (!length) {
      return [];
    }
    if (end && typeof end != 'number' && isIterateeCall(array, start, end)) {
      start = 0;
      end = length;
    }
    return baseSlice(array, start, end);
  }

  function unzip(array) {
    var index = -1,
        length = (array && array.length && arrayMax(arrayMap(array, getLength))) >>> 0,
        result = Array(length);

    while (++index < length) {
      result[index] = arrayMap(array, baseProperty(index));
    }
    return result;
  }

  var zip = restParam(unzip);

  var forEach = createForEach(arrayEach, baseEach);

  function includes(collection, target, fromIndex, guard) {
    var length = collection ? getLength(collection) : 0;
    if (!isLength(length)) {
      collection = values(collection);
      length = collection.length;
    }
    if (!length) {
      return false;
    }
    if (typeof fromIndex != 'number' || (guard && isIterateeCall(target, fromIndex, guard))) {
      fromIndex = 0;
    } else {
      fromIndex = fromIndex < 0 ? nativeMax(length + fromIndex, 0) : (fromIndex || 0);
    }
    return (typeof collection == 'string' || !isArray(collection) && isString(collection))
      ? (fromIndex < length && collection.indexOf(target, fromIndex) > -1)
      : (getIndexOf(collection, target, fromIndex) > -1);
  }

  function reject(collection, predicate, thisArg) {
    var func = isArray(collection) ? arrayFilter : baseFilter;
    predicate = getCallback(predicate, thisArg, 3);
    return func(collection, function(value, index, collection) {
      return !predicate(value, index, collection);
    });
  }

  function some(collection, predicate, thisArg) {
    var func = isArray(collection) ? arraySome : baseSome;
    if (thisArg && isIterateeCall(collection, predicate, thisArg)) {
      predicate = null;
    }
    if (typeof predicate != 'function' || thisArg !== undefined) {
      predicate = getCallback(predicate, thisArg, 3);
    }
    return func(collection, predicate);
  }

  function restParam(func, start) {
    if (typeof func != 'function') {
      throw new TypeError(FUNC_ERROR_TEXT);
    }
    start = nativeMax(start === undefined ? (func.length - 1) : (+start || 0), 0);
    return function() {
      var args = arguments,
          index = -1,
          length = nativeMax(args.length - start, 0),
          rest = Array(length);

      while (++index < length) {
        rest[index] = args[start + index];
      }
      switch (start) {
        case 0: return func.call(this, rest);
        case 1: return func.call(this, args[0], rest);
        case 2: return func.call(this, args[0], args[1], rest);
      }
      var otherArgs = Array(start + 1);
      index = -1;
      while (++index < start) {
        otherArgs[index] = args[index];
      }
      otherArgs[start] = rest;
      return func.apply(this, otherArgs);
    };
  }

  function clone(value, isDeep, customizer, thisArg) {
    if (isDeep && typeof isDeep != 'boolean' && isIterateeCall(value, isDeep, customizer)) {
      isDeep = false;
    }
    else if (typeof isDeep == 'function') {
      thisArg = customizer;
      customizer = isDeep;
      isDeep = false;
    }
    customizer = typeof customizer == 'function' && bindCallback(customizer, thisArg, 1);
    return baseClone(value, isDeep, customizer);
  }

  function isArguments(value) {
    var length = isObjectLike(value) ? value.length : undefined;
    return isLength(length) && objToString.call(value) == argsTag;
  }

  var isArray = nativeIsArray || function(value) {
    return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
  };

  function isEmpty(value) {
    if (value == null) {
      return true;
    }
    var length = getLength(value);
    if (isLength(length) && (isArray(value) || isString(value) || isArguments(value) ||
        (isObjectLike(value) && isFunction(value.splice)))) {
      return !length;
    }
    return !keys(value).length;
  }

  var isFunction = !(baseIsFunction(/x/) || (Uint8Array && !baseIsFunction(Uint8Array))) ? baseIsFunction : function(value) {
    return objToString.call(value) == funcTag;
  };

  function isObject(value) {
    var type = typeof value;
    return type == 'function' || (!!value && type == 'object');
  }

  function isNative(value) {
    if (value == null) {
      return false;
    }
    if (objToString.call(value) == funcTag) {
      return reIsNative.test(fnToString.call(value));
    }
    return isObjectLike(value) && reIsHostCtor.test(value);
  }

  function isNumber(value) {
    return typeof value == 'number' || (isObjectLike(value) && objToString.call(value) == numberTag);
  }

  var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {
    if (!(value && objToString.call(value) == objectTag)) {
      return false;
    }
    var valueOf = value.valueOf,
        objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

    return objProto
      ? (value == objProto || getPrototypeOf(value) == objProto)
      : shimIsPlainObject(value);
  };

  function isString(value) {
    return typeof value == 'string' || (isObjectLike(value) && objToString.call(value) == stringTag);
  }

  function isTypedArray(value) {
    return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
  }

  function toPlainObject(value) {
    return baseCopy(value, keysIn(value));
  }

  var assign = createAssigner(function(object, source, customizer) {
    return customizer
      ? assignWith(object, source, customizer)
      : baseAssign(object, source);
  });

  function has(object, path) {
    if (object == null) {
      return false;
    }
    var result = hasOwnProperty.call(object, path);
    if (!result && !isKey(path)) {
      path = toPath(path);
      object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
      path = last(path);
      result = object != null && hasOwnProperty.call(object, path);
    }
    return result;
  }

  var keys = !nativeKeys ? shimKeys : function(object) {
    if (object) {
      var Ctor = object.constructor,
          length = object.length;
    }
    if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
        (typeof object != 'function' && isLength(length))) {
      return shimKeys(object);
    }
    return isObject(object) ? nativeKeys(object) : [];
  };

  function keysIn(object) {
    if (object == null) {
      return [];
    }
    if (!isObject(object)) {
      object = Object(object);
    }
    var length = object.length;
    length = (length && isLength(length) &&
      (isArray(object) || (support.nonEnumArgs && isArguments(object))) && length) || 0;

    var Ctor = object.constructor,
        index = -1,
        isProto = typeof Ctor == 'function' && Ctor.prototype === object,
        result = Array(length),
        skipIndexes = length > 0;

    while (++index < length) {
      result[index] = (index + '');
    }
    for (var key in object) {
      if (!(skipIndexes && isIndex(key, length)) &&
          !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
        result.push(key);
      }
    }
    return result;
  }

  var merge = createAssigner(baseMerge);

  function values(object) {
    return baseValues(object, keys(object));
  }

  function escapeRegExp(string) {
    string = baseToString(string);
    return (string && reHasRegExpChars.test(string))
      ? string.replace(reRegExpChars, '\\$&')
      : string;
  }

  function callback(func, thisArg, guard) {
    if (guard && isIterateeCall(func, thisArg, guard)) {
      thisArg = null;
    }
    return baseCallback(func, thisArg);
  }

  function constant(value) {
    return function() {
      return value;
    };
  }

  function identity(value) {
    return value;
  }

  function property(path) {
    return isKey(path) ? baseProperty(path) : basePropertyDeep(path);
  }
  lodash.assign = assign;
  lodash.callback = callback;
  lodash.constant = constant;
  lodash.forEach = forEach;
  lodash.keys = keys;
  lodash.keysIn = keysIn;
  lodash.merge = merge;
  lodash.property = property;
  lodash.reject = reject;
  lodash.restParam = restParam;
  lodash.slice = slice;
  lodash.toPlainObject = toPlainObject;
  lodash.unzip = unzip;
  lodash.values = values;
  lodash.zip = zip;

  lodash.each = forEach;
  lodash.extend = assign;
  lodash.iteratee = callback;
  lodash.clone = clone;
  lodash.escapeRegExp = escapeRegExp;
  lodash.findLastIndex = findLastIndex;
  lodash.has = has;
  lodash.identity = identity;
  lodash.includes = includes;
  lodash.indexOf = indexOf;
  lodash.isArguments = isArguments;
  lodash.isArray = isArray;
  lodash.isEmpty = isEmpty;
  lodash.isFunction = isFunction;
  lodash.isNative = isNative;
  lodash.isNumber = isNumber;
  lodash.isObject = isObject;
  lodash.isPlainObject = isPlainObject;
  lodash.isString = isString;
  lodash.isTypedArray = isTypedArray;
  lodash.last = last;
  lodash.some = some;

  lodash.any = some;
  lodash.contains = includes;
  lodash.include = includes;

  lodash.VERSION = VERSION;
  if (freeExports && freeModule) {
    if (moduleExports) {
      (freeModule.exports = lodash)._ = lodash;
    }
    else {
      freeExports._ = lodash;
    }
  }
  else {
    root._ = lodash;
  }
}.call(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"/node_modules/jshint/src/jshint.js":[function(_dereq_,module,exports){

var _            = _dereq_("../lodash");
var events       = _dereq_("events");
var vars         = _dereq_("./vars.js");
var messages     = _dereq_("./messages.js");
var Lexer        = _dereq_("./lex.js").Lexer;
var reg          = _dereq_("./reg.js");
var state        = _dereq_("./state.js").state;
var style        = _dereq_("./style.js");
var options      = _dereq_("./options.js");
var scopeManager = _dereq_("./scope-manager.js");

var JSHINT = (function() {
  "use strict";

  var api, // Extension API
    bang = {
      "<"  : true,
      "<=" : true,
      "==" : true,
      "===": true,
      "!==": true,
      "!=" : true,
      ">"  : true,
      ">=" : true,
      "+"  : true,
      "-"  : true,
      "*"  : true,
      "/"  : true,
      "%"  : true
    },

    declared, // Globals that were declared using /*global ... */ syntax.

    functionicity = [
      "closure", "exception", "global", "label",
      "outer", "unused", "var"
    ],

    functions, // All of the functions

    inblock,
    indent,
    lookahead,
    lex,
    member,
    membersOnly,
    predefined,    // Global variables defined by option

    stack,
    urls,

    extraModules = [],
    emitter = new events.EventEmitter();

  function checkOption(name, t) {
    name = name.trim();

    if (/^[+-]W\d{3}$/g.test(name)) {
      return true;
    }

    if (options.validNames.indexOf(name) === -1) {
      if (t.type !== "jslint" && !_.has(options.removed, name)) {
        error("E001", t, name);
        return false;
      }
    }

    return true;
  }

  function isString(obj) {
    return Object.prototype.toString.call(obj) === "[object String]";
  }

  function isIdentifier(tkn, value) {
    if (!tkn)
      return false;

    if (!tkn.identifier || tkn.value !== value)
      return false;

    return true;
  }

  function isReserved(token) {
    if (!token.reserved) {
      return false;
    }
    var meta = token.meta;

    if (meta && meta.isFutureReservedWord && state.inES5()) {
      if (!meta.es5) {
        return false;
      }
      if (meta.strictOnly) {
        if (!state.option.strict && !state.isStrict()) {
          return false;
        }
      }

      if (token.isProperty) {
        return false;
      }
    }

    return true;
  }

  function supplant(str, data) {
    return str.replace(/\{([^{}]*)\}/g, function(a, b) {
      var r = data[b];
      return typeof r === "string" || typeof r === "number" ? r : a;
    });
  }

  function combine(dest, src) {
    Object.keys(src).forEach(function(name) {
      if (_.has(JSHINT.blacklist, name)) return;
      dest[name] = src[name];
    });
  }

  function processenforceall() {
    if (state.option.enforceall) {
      for (var enforceopt in options.bool.enforcing) {
        if (state.option[enforceopt] === undefined &&
            !options.noenforceall[enforceopt]) {
          state.option[enforceopt] = true;
        }
      }
      for (var relaxopt in options.bool.relaxing) {
        if (state.option[relaxopt] === undefined) {
          state.option[relaxopt] = false;
        }
      }
    }
  }

  function assume() {
    processenforceall();
    if (!state.option.esversion && !state.option.moz) {
      if (state.option.es3) {
        state.option.esversion = 3;
      } else if (state.option.esnext) {
        state.option.esversion = 6;
      } else {
        state.option.esversion = 5;
      }
    }

    if (state.inES5()) {
      combine(predefined, vars.ecmaIdentifiers[5]);
    }

    if (state.inES6()) {
      combine(predefined, vars.ecmaIdentifiers[6]);
    }

    if (state.option.module) {
      if (state.option.strict === true) {
        state.option.strict = "global";
      }
      if (!state.inES6()) {
        warning("W134", state.tokens.next, "module", 6);
      }
    }

    if (state.option.couch) {
      combine(predefined, vars.couch);
    }

    if (state.option.qunit) {
      combine(predefined, vars.qunit);
    }

    if (state.option.rhino) {
      combine(predefined, vars.rhino);
    }

    if (state.option.shelljs) {
      combine(predefined, vars.shelljs);
      combine(predefined, vars.node);
    }
    if (state.option.typed) {
      combine(predefined, vars.typed);
    }

    if (state.option.phantom) {
      combine(predefined, vars.phantom);
      if (state.option.strict === true) {
        state.option.strict = "global";
      }
    }

    if (state.option.prototypejs) {
      combine(predefined, vars.prototypejs);
    }

    if (state.option.node) {
      combine(predefined, vars.node);
      combine(predefined, vars.typed);
      if (state.option.strict === true) {
        state.option.strict = "global";
      }
    }

    if (state.option.devel) {
      combine(predefined, vars.devel);
    }

    if (state.option.dojo) {
      combine(predefined, vars.dojo);
    }

    if (state.option.browser) {
      combine(predefined, vars.browser);
      combine(predefined, vars.typed);
    }

    if (state.option.browserify) {
      combine(predefined, vars.browser);
      combine(predefined, vars.typed);
      combine(predefined, vars.browserify);
      if (state.option.strict === true) {
        state.option.strict = "global";
      }
    }

    if (state.option.nonstandard) {
      combine(predefined, vars.nonstandard);
    }

    if (state.option.jasmine) {
      combine(predefined, vars.jasmine);
    }

    if (state.option.jquery) {
      combine(predefined, vars.jquery);
    }

    if (state.option.mootools) {
      combine(predefined, vars.mootools);
    }

    if (state.option.worker) {
      combine(predefined, vars.worker);
    }

    if (state.option.wsh) {
      combine(predefined, vars.wsh);
    }

    if (state.option.globalstrict && state.option.strict !== false) {
      state.option.strict = "global";
    }

    if (state.option.yui) {
      combine(predefined, vars.yui);
    }

    if (state.option.mocha) {
      combine(predefined, vars.mocha);
    }
  }
  function quit(code, line, chr) {
    var percentage = Math.floor((line / state.lines.length) * 100);
    var message = messages.errors[code].desc;

    throw {
      name: "JSHintError",
      line: line,
      character: chr,
      message: message + " (" + percentage + "% scanned).",
      raw: message,
      code: code
    };
  }

  function removeIgnoredMessages() {
    var ignored = state.ignoredLines;

    if (_.isEmpty(ignored)) return;
    JSHINT.errors = _.reject(JSHINT.errors, function(err) { return ignored[err.line] });
  }

  function warning(code, t, a, b, c, d) {
    var ch, l, w, msg;

    if (/^W\d{3}$/.test(code)) {
      if (state.ignored[code])
        return;

      msg = messages.warnings[code];
    } else if (/E\d{3}/.test(code)) {
      msg = messages.errors[code];
    } else if (/I\d{3}/.test(code)) {
      msg = messages.info[code];
    }

    t = t || state.tokens.next || {};
    if (t.id === "(end)") {  // `~
      t = state.tokens.curr;
    }

    l = t.line || 0;
    ch = t.from || 0;

    w = {
      id: "(error)",
      raw: msg.desc,
      code: msg.code,
      evidence: state.lines[l - 1] || "",
      line: l,
      character: ch,
      scope: JSHINT.scope,
      a: a,
      b: b,
      c: c,
      d: d
    };

    w.reason = supplant(msg.desc, w);
    JSHINT.errors.push(w);

    removeIgnoredMessages();

    if (JSHINT.errors.length >= state.option.maxerr)
      quit("E043", l, ch);

    return w;
  }

  function warningAt(m, l, ch, a, b, c, d) {
    return warning(m, {
      line: l,
      from: ch
    }, a, b, c, d);
  }

  function error(m, t, a, b, c, d) {
    warning(m, t, a, b, c, d);
  }

  function errorAt(m, l, ch, a, b, c, d) {
    return error(m, {
      line: l,
      from: ch
    }, a, b, c, d);
  }
  function addInternalSrc(elem, src) {
    var i;
    i = {
      id: "(internal)",
      elem: elem,
      value: src
    };
    JSHINT.internals.push(i);
    return i;
  }

  function doOption() {
    var nt = state.tokens.next;
    var body = nt.body.match(/(-\s+)?[^\s,:]+(?:\s*:\s*(-\s+)?[^\s,]+)?/g) || [];

    var predef = {};
    if (nt.type === "globals") {
      body.forEach(function(g, idx) {
        g = g.split(":");
        var key = (g[0] || "").trim();
        var val = (g[1] || "").trim();

        if (key === "-" || !key.length) {
          if (idx > 0 && idx === body.length - 1) {
            return;
          }
          error("E002", nt);
          return;
        }

        if (key.charAt(0) === "-") {
          key = key.slice(1);
          val = false;

          JSHINT.blacklist[key] = key;
          delete predefined[key];
        } else {
          predef[key] = (val === "true");
        }
      });

      combine(predefined, predef);

      for (var key in predef) {
        if (_.has(predef, key)) {
          declared[key] = nt;
        }
      }
    }

    if (nt.type === "exported") {
      body.forEach(function(e, idx) {
        if (!e.length) {
          if (idx > 0 && idx === body.length - 1) {
            return;
          }
          error("E002", nt);
          return;
        }

        state.funct["(scope)"].addExported(e);
      });
    }

    if (nt.type === "members") {
      membersOnly = membersOnly || {};

      body.forEach(function(m) {
        var ch1 = m.charAt(0);
        var ch2 = m.charAt(m.length - 1);

        if (ch1 === ch2 && (ch1 === "\"" || ch1 === "'")) {
          m = m
            .substr(1, m.length - 2)
            .replace("\\\"", "\"");
        }

        membersOnly[m] = false;
      });
    }

    var numvals = [
      "maxstatements",
      "maxparams",
      "maxdepth",
      "maxcomplexity",
      "maxerr",
      "maxlen",
      "indent"
    ];

    if (nt.type === "jshint" || nt.type === "jslint") {
      body.forEach(function(g) {
        g = g.split(":");
        var key = (g[0] || "").trim();
        var val = (g[1] || "").trim();

        if (!checkOption(key, nt)) {
          return;
        }

        if (numvals.indexOf(key) >= 0) {
          if (val !== "false") {
            val = +val;

            if (typeof val !== "number" || !isFinite(val) || val <= 0 || Math.floor(val) !== val) {
              error("E032", nt, g[1].trim());
              return;
            }

            state.option[key] = val;
          } else {
            state.option[key] = key === "indent" ? 4 : false;
          }

          return;
        }

        if (key === "validthis") {

          if (state.funct["(global)"])
            return void error("E009");

          if (val !== "true" && val !== "false")
            return void error("E002", nt);

          state.option.validthis = (val === "true");
          return;
        }

        if (key === "quotmark") {
          switch (val) {
          case "true":
          case "false":
            state.option.quotmark = (val === "true");
            break;
          case "double":
          case "single":
            state.option.quotmark = val;
            break;
          default:
            error("E002", nt);
          }
          return;
        }

        if (key === "shadow") {
          switch (val) {
          case "true":
            state.option.shadow = true;
            break;
          case "outer":
            state.option.shadow = "outer";
            break;
          case "false":
          case "inner":
            state.option.shadow = "inner";
            break;
          default:
            error("E002", nt);
          }
          return;
        }

        if (key === "unused") {
          switch (val) {
          case "true":
            state.option.unused = true;
            break;
          case "false":
            state.option.unused = false;
            break;
          case "vars":
          case "strict":
            state.option.unused = val;
            break;
          default:
            error("E002", nt);
          }
          return;
        }

        if (key === "latedef") {
          switch (val) {
          case "true":
            state.option.latedef = true;
            break;
          case "false":
            state.option.latedef = false;
            break;
          case "nofunc":
            state.option.latedef = "nofunc";
            break;
          default:
            error("E002", nt);
          }
          return;
        }

        if (key === "ignore") {
          switch (val) {
          case "line":
            state.ignoredLines[nt.line] = true;
            removeIgnoredMessages();
            break;
          default:
            error("E002", nt);
          }
          return;
        }

        if (key === "strict") {
          switch (val) {
          case "true":
            state.option.strict = true;
            break;
          case "false":
            state.option.strict = false;
            break;
          case "func":
          case "global":
          case "implied":
            state.option.strict = val;
            break;
          default:
            error("E002", nt);
          }
          return;
        }

        if (key === "module") {
          if (!hasParsedCode(state.funct)) {
            error("E055", state.tokens.next, "module");
          }
        }
        var esversions = {
          es3   : 3,
          es5   : 5,
          esnext: 6
        };
        if (_.has(esversions, key)) {
          switch (val) {
          case "true":
            state.option.moz = false;
            state.option.esversion = esversions[key];
            break;
          case "false":
            if (!state.option.moz) {
              state.option.esversion = 5;
            }
            break;
          default:
            error("E002", nt);
          }
          return;
        }

        if (key === "esversion") {
          switch (val) {
          case "5":
            if (state.inES5(true)) {
              warning("I003");
            }
          case "3":
          case "6":
            state.option.moz = false;
            state.option.esversion = +val;
            break;
          case "2015":
            state.option.moz = false;
            state.option.esversion = 6;
            break;
          default:
            error("E002", nt);
          }
          if (!hasParsedCode(state.funct)) {
            error("E055", state.tokens.next, "esversion");
          }
          return;
        }

        var match = /^([+-])(W\d{3})$/g.exec(key);
        if (match) {
          state.ignored[match[2]] = (match[1] === "-");
          return;
        }

        var tn;
        if (val === "true" || val === "false") {
          if (nt.type === "jslint") {
            tn = options.renamed[key] || key;
            state.option[tn] = (val === "true");

            if (options.inverted[tn] !== undefined) {
              state.option[tn] = !state.option[tn];
            }
          } else {
            state.option[key] = (val === "true");
          }

          if (key === "newcap") {
            state.option["(explicitNewcap)"] = true;
          }
          return;
        }

        error("E002", nt);
      });

      assume();
    }
  }

  function peek(p) {
    var i = p || 0, j = lookahead.length, t;

    if (i < j) {
      return lookahead[i];
    }

    while (j <= i) {
      t = lookahead[j];
      if (!t) {
        t = lookahead[j] = lex.token();
      }
      j += 1;
    }
    if (!t && state.tokens.next.id === "(end)") {
      return state.tokens.next;
    }

    return t;
  }

  function peekIgnoreEOL() {
    var i = 0;
    var t;
    do {
      t = peek(i++);
    } while (t.id === "(endline)");
    return t;
  }

  function advance(id, t) {

    switch (state.tokens.curr.id) {
    case "(number)":
      if (state.tokens.next.id === ".") {
        warning("W005", state.tokens.curr);
      }
      break;
    case "-":
      if (state.tokens.next.id === "-" || state.tokens.next.id === "--") {
        warning("W006");
      }
      break;
    case "+":
      if (state.tokens.next.id === "+" || state.tokens.next.id === "++") {
        warning("W007");
      }
      break;
    }

    if (id && state.tokens.next.id !== id) {
      if (t) {
        if (state.tokens.next.id === "(end)") {
          error("E019", t, t.id);
        } else {
          error("E020", state.tokens.next, id, t.id, t.line, state.tokens.next.value);
        }
      } else if (state.tokens.next.type !== "(identifier)" || state.tokens.next.value !== id) {
        warning("W116", state.tokens.next, id, state.tokens.next.value);
      }
    }

    state.tokens.prev = state.tokens.curr;
    state.tokens.curr = state.tokens.next;
    for (;;) {
      state.tokens.next = lookahead.shift() || lex.token();

      if (!state.tokens.next) { // No more tokens left, give up
        quit("E041", state.tokens.curr.line);
      }

      if (state.tokens.next.id === "(end)" || state.tokens.next.id === "(error)") {
        return;
      }

      if (state.tokens.next.check) {
        state.tokens.next.check();
      }

      if (state.tokens.next.isSpecial) {
        if (state.tokens.next.type === "falls through") {
          state.tokens.curr.caseFallsThrough = true;
        } else {
          doOption();
        }
      } else {
        if (state.tokens.next.id !== "(endline)") {
          break;
        }
      }
    }
  }

  function isInfix(token) {
    return token.infix || (!token.identifier && !token.template && !!token.led);
  }

  function isEndOfExpr() {
    var curr = state.tokens.curr;
    var next = state.tokens.next;
    if (next.id === ";" || next.id === "}" || next.id === ":") {
      return true;
    }
    if (isInfix(next) === isInfix(curr) || (curr.id === "yield" && state.inMoz())) {
      return curr.line !== startLine(next);
    }
    return false;
  }

  function isBeginOfExpr(prev) {
    return !prev.left && prev.arity !== "unary";
  }

  function expression(rbp, initial) {
    var left, isArray = false, isObject = false, isLetExpr = false;

    state.nameStack.push();
    if (!initial && state.tokens.next.value === "let" && peek(0).value === "(") {
      if (!state.inMoz()) {
        warning("W118", state.tokens.next, "let expressions");
      }
      isLetExpr = true;
      state.funct["(scope)"].stack();
      advance("let");
      advance("(");
      state.tokens.prev.fud();
      advance(")");
    }

    if (state.tokens.next.id === "(end)")
      error("E006", state.tokens.curr);

    var isDangerous =
      state.option.asi &&
      state.tokens.prev.line !== startLine(state.tokens.curr) &&
      _.contains(["]", ")"], state.tokens.prev.id) &&
      _.contains(["[", "("], state.tokens.curr.id);

    if (isDangerous)
      warning("W014", state.tokens.curr, state.tokens.curr.id);

    advance();

    if (initial) {
      state.funct["(verb)"] = state.tokens.curr.value;
      state.tokens.curr.beginsStmt = true;
    }

    if (initial === true && state.tokens.curr.fud) {
      left = state.tokens.curr.fud();
    } else {
      if (state.tokens.curr.nud) {
        left = state.tokens.curr.nud();
      } else {
        error("E030", state.tokens.curr, state.tokens.curr.id);
      }
      while ((rbp < state.tokens.next.lbp || state.tokens.next.type === "(template)") &&
              !isEndOfExpr()) {
        isArray = state.tokens.curr.value === "Array";
        isObject = state.tokens.curr.value === "Object";
        if (left && (left.value || (left.first && left.first.value))) {
          if (left.value !== "new" ||
            (left.first && left.first.value && left.first.value === ".")) {
            isArray = false;
            if (left.value !== state.tokens.curr.value) {
              isObject = false;
            }
          }
        }

        advance();

        if (isArray && state.tokens.curr.id === "(" && state.tokens.next.id === ")") {
          warning("W009", state.tokens.curr);
        }

        if (isObject && state.tokens.curr.id === "(" && state.tokens.next.id === ")") {
          warning("W010", state.tokens.curr);
        }

        if (left && state.tokens.curr.led) {
          left = state.tokens.curr.led(left);
        } else {
          error("E033", state.tokens.curr, state.tokens.curr.id);
        }
      }
    }
    if (isLetExpr) {
      state.funct["(scope)"].unstack();
    }

    state.nameStack.pop();

    return left;
  }

  function startLine(token) {
    return token.startLine || token.line;
  }

  function nobreaknonadjacent(left, right) {
    left = left || state.tokens.curr;
    right = right || state.tokens.next;
    if (!state.option.laxbreak && left.line !== startLine(right)) {
      warning("W014", right, right.value);
    }
  }

  function nolinebreak(t) {
    t = t || state.tokens.curr;
    if (t.line !== startLine(state.tokens.next)) {
      warning("E022", t, t.value);
    }
  }

  function nobreakcomma(left, right) {
    if (left.line !== startLine(right)) {
      if (!state.option.laxcomma) {
        if (comma.first) {
          warning("I001");
          comma.first = false;
        }
        warning("W014", left, right.value);
      }
    }
  }

  function comma(opts) {
    opts = opts || {};

    if (!opts.peek) {
      nobreakcomma(state.tokens.curr, state.tokens.next);
      advance(",");
    } else {
      nobreakcomma(state.tokens.prev, state.tokens.curr);
    }

    if (state.tokens.next.identifier && !(opts.property && state.inES5())) {
      switch (state.tokens.next.value) {
      case "break":
      case "case":
      case "catch":
      case "continue":
      case "default":
      case "do":
      case "else":
      case "finally":
      case "for":
      case "if":
      case "in":
      case "instanceof":
      case "return":
      case "switch":
      case "throw":
      case "try":
      case "var":
      case "let":
      case "while":
      case "with":
        error("E024", state.tokens.next, state.tokens.next.value);
        return false;
      }
    }

    if (state.tokens.next.type === "(punctuator)") {
      switch (state.tokens.next.value) {
      case "}":
      case "]":
      case ",":
        if (opts.allowTrailing) {
          return true;
        }
      case ")":
        error("E024", state.tokens.next, state.tokens.next.value);
        return false;
      }
    }
    return true;
  }

  function symbol(s, p) {
    var x = state.syntax[s];
    if (!x || typeof x !== "object") {
      state.syntax[s] = x = {
        id: s,
        lbp: p,
        value: s
      };
    }
    return x;
  }

  function delim(s) {
    var x = symbol(s, 0);
    x.delim = true;
    return x;
  }

  function stmt(s, f) {
    var x = delim(s);
    x.identifier = x.reserved = true;
    x.fud = f;
    return x;
  }

  function blockstmt(s, f) {
    var x = stmt(s, f);
    x.block = true;
    return x;
  }

  function reserveName(x) {
    var c = x.id.charAt(0);
    if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z")) {
      x.identifier = x.reserved = true;
    }
    return x;
  }

  function prefix(s, f) {
    var x = symbol(s, 150);
    reserveName(x);

    x.nud = (typeof f === "function") ? f : function() {
      this.arity = "unary";
      this.right = expression(150);

      if (this.id === "++" || this.id === "--") {
        if (state.option.plusplus) {
          warning("W016", this, this.id);
        } else if (this.right && (!this.right.identifier || isReserved(this.right)) &&
            this.right.id !== "." && this.right.id !== "[") {
          warning("W017", this);
        }

        if (this.right && this.right.isMetaProperty) {
          error("E031", this);
        } else if (this.right && this.right.identifier) {
          state.funct["(scope)"].block.modify(this.right.value, this);
        }
      }

      return this;
    };

    return x;
  }

  function type(s, f) {
    var x = delim(s);
    x.type = s;
    x.nud = f;
    return x;
  }

  function reserve(name, func) {
    var x = type(name, func);
    x.identifier = true;
    x.reserved = true;
    return x;
  }

  function FutureReservedWord(name, meta) {
    var x = type(name, (meta && meta.nud) || function() {
      return this;
    });

    meta = meta || {};
    meta.isFutureReservedWord = true;

    x.value = name;
    x.identifier = true;
    x.reserved = true;
    x.meta = meta;

    return x;
  }

  function reservevar(s, v) {
    return reserve(s, function() {
      if (typeof v === "function") {
        v(this);
      }
      return this;
    });
  }

  function infix(s, f, p, w) {
    var x = symbol(s, p);
    reserveName(x);
    x.infix = true;
    x.led = function(left) {
      if (!w) {
        nobreaknonadjacent(state.tokens.prev, state.tokens.curr);
      }
      if ((s === "in" || s === "instanceof") && left.id === "!") {
        warning("W018", left, "!");
      }
      if (typeof f === "function") {
        return f(left, this);
      } else {
        this.left = left;
        this.right = expression(p);
        return this;
      }
    };
    return x;
  }

  function application(s) {
    var x = symbol(s, 42);

    x.led = function(left) {
      nobreaknonadjacent(state.tokens.prev, state.tokens.curr);

      this.left = left;
      this.right = doFunction({ type: "arrow", loneArg: left });
      return this;
    };
    return x;
  }

  function relation(s, f) {
    var x = symbol(s, 100);

    x.led = function(left) {
      nobreaknonadjacent(state.tokens.prev, state.tokens.curr);
      this.left = left;
      var right = this.right = expression(100);

      if (isIdentifier(left, "NaN") || isIdentifier(right, "NaN")) {
        warning("W019", this);
      } else if (f) {
        f.apply(this, [left, right]);
      }

      if (!left || !right) {
        quit("E041", state.tokens.curr.line);
      }

      if (left.id === "!") {
        warning("W018", left, "!");
      }

      if (right.id === "!") {
        warning("W018", right, "!");
      }

      return this;
    };
    return x;
  }

  function isPoorRelation(node) {
    return node &&
        ((node.type === "(number)" && +node.value === 0) ||
         (node.type === "(string)" && node.value === "") ||
         (node.type === "null" && !state.option.eqnull) ||
        node.type === "true" ||
        node.type === "false" ||
        node.type === "undefined");
  }

  var typeofValues = {};
  typeofValues.legacy = [
    "xml",
    "unknown"
  ];
  typeofValues.es3 = [
    "undefined", "boolean", "number", "string", "function", "object",
  ];
  typeofValues.es3 = typeofValues.es3.concat(typeofValues.legacy);
  typeofValues.es6 = typeofValues.es3.concat("symbol");
  function isTypoTypeof(left, right, state) {
    var values;

    if (state.option.notypeof)
      return false;

    if (!left || !right)
      return false;

    values = state.inES6() ? typeofValues.es6 : typeofValues.es3;

    if (right.type === "(identifier)" && right.value === "typeof" && left.type === "(string)")
      return !_.contains(values, left.value);

    return false;
  }

  function isGlobalEval(left, state) {
    var isGlobal = false;
    if (left.type === "this" && state.funct["(context)"] === null) {
      isGlobal = true;
    }
    else if (left.type === "(identifier)") {
      if (state.option.node && left.value === "global") {
        isGlobal = true;
      }

      else if (state.option.browser && (left.value === "window" || left.value === "document")) {
        isGlobal = true;
      }
    }

    return isGlobal;
  }

  function findNativePrototype(left) {
    var natives = [
      "Array", "ArrayBuffer", "Boolean", "Collator", "DataView", "Date",
      "DateTimeFormat", "Error", "EvalError", "Float32Array", "Float64Array",
      "Function", "Infinity", "Intl", "Int16Array", "Int32Array", "Int8Array",
      "Iterator", "Number", "NumberFormat", "Object", "RangeError",
      "ReferenceError", "RegExp", "StopIteration", "String", "SyntaxError",
      "TypeError", "Uint16Array", "Uint32Array", "Uint8Array", "Uint8ClampedArray",
      "URIError"
    ];

    function walkPrototype(obj) {
      if (typeof obj !== "object") return;
      return obj.right === "prototype" ? obj : walkPrototype(obj.left);
    }

    function walkNative(obj) {
      while (!obj.identifier && typeof obj.left === "object")
        obj = obj.left;

      if (obj.identifier && natives.indexOf(obj.value) >= 0)
        return obj.value;
    }

    var prototype = walkPrototype(left);
    if (prototype) return walkNative(prototype);
  }
  function checkLeftSideAssign(left, assignToken, options) {

    var allowDestructuring = options && options.allowDestructuring;

    assignToken = assignToken || left;

    if (state.option.freeze) {
      var nativeObject = findNativePrototype(left);
      if (nativeObject)
        warning("W121", left, nativeObject);
    }

    if (left.identifier && !left.isMetaProperty) {
      state.funct["(scope)"].block.reassign(left.value, left);
    }

    if (left.id === ".") {
      if (!left.left || left.left.value === "arguments" && !state.isStrict()) {
        warning("E031", assignToken);
      }

      state.nameStack.set(state.tokens.prev);
      return true;
    } else if (left.id === "{" || left.id === "[") {
      if (allowDestructuring && state.tokens.curr.left.destructAssign) {
        state.tokens.curr.left.destructAssign.forEach(function(t) {
          if (t.id) {
            state.funct["(scope)"].block.modify(t.id, t.token);
          }
        });
      } else {
        if (left.id === "{" || !left.left) {
          warning("E031", assignToken);
        } else if (left.left.value === "arguments" && !state.isStrict()) {
          warning("E031", assignToken);
        }
      }

      if (left.id === "[") {
        state.nameStack.set(left.right);
      }

      return true;
    } else if (left.isMetaProperty) {
      error("E031", assignToken);
      return true;
    } else if (left.identifier && !isReserved(left)) {
      if (state.funct["(scope)"].labeltype(left.value) === "exception") {
        warning("W022", left);
      }
      state.nameStack.set(left);
      return true;
    }

    if (left === state.syntax["function"]) {
      warning("W023", state.tokens.curr);
    }

    return false;
  }

  function assignop(s, f, p) {
    var x = infix(s, typeof f === "function" ? f : function(left, that) {
      that.left = left;

      if (left && checkLeftSideAssign(left, that, { allowDestructuring: true })) {
        that.right = expression(10);
        return that;
      }

      error("E031", that);
    }, p);

    x.exps = true;
    x.assign = true;
    return x;
  }


  function bitwise(s, f, p) {
    var x = symbol(s, p);
    reserveName(x);
    x.led = (typeof f === "function") ? f : function(left) {
      if (state.option.bitwise) {
        warning("W016", this, this.id);
      }
      this.left = left;
      this.right = expression(p);
      return this;
    };
    return x;
  }

  function bitwiseassignop(s) {
    return assignop(s, function(left, that) {
      if (state.option.bitwise) {
        warning("W016", that, that.id);
      }

      if (left && checkLeftSideAssign(left, that)) {
        that.right = expression(10);
        return that;
      }
      error("E031", that);
    }, 20);
  }

  function suffix(s) {
    var x = symbol(s, 150);

    x.led = function(left) {
      if (state.option.plusplus) {
        warning("W016", this, this.id);
      } else if ((!left.identifier || isReserved(left)) && left.id !== "." && left.id !== "[") {
        warning("W017", this);
      }

      if (left.isMetaProperty) {
        error("E031", this);
      } else if (left && left.identifier) {
        state.funct["(scope)"].block.modify(left.value, left);
      }

      this.left = left;
      return this;
    };
    return x;
  }

  function optionalidentifier(fnparam, prop, preserve) {
    if (!state.tokens.next.identifier) {
      return;
    }

    if (!preserve) {
      advance();
    }

    var curr = state.tokens.curr;
    var val  = state.tokens.curr.value;

    if (!isReserved(curr)) {
      return val;
    }

    if (prop) {
      if (state.inES5()) {
        return val;
      }
    }

    if (fnparam && val === "undefined") {
      return val;
    }

    warning("W024", state.tokens.curr, state.tokens.curr.id);
    return val;
  }
  function identifier(fnparam, prop) {
    var i = optionalidentifier(fnparam, prop, false);
    if (i) {
      return i;
    }
    if (state.tokens.next.value === "...") {
      if (!state.inES6(true)) {
        warning("W119", state.tokens.next, "spread/rest operator", "6");
      }
      advance();

      if (checkPunctuator(state.tokens.next, "...")) {
        warning("E024", state.tokens.next, "...");
        while (checkPunctuator(state.tokens.next, "...")) {
          advance();
        }
      }

      if (!state.tokens.next.identifier) {
        warning("E024", state.tokens.curr, "...");
        return;
      }

      return identifier(fnparam, prop);
    } else {
      error("E030", state.tokens.next, state.tokens.next.value);
      if (state.tokens.next.id !== ";") {
        advance();
      }
    }
  }


  function reachable(controlToken) {
    var i = 0, t;
    if (state.tokens.next.id !== ";" || controlToken.inBracelessBlock) {
      return;
    }
    for (;;) {
      do {
        t = peek(i);
        i += 1;
      } while (t.id !== "(end)" && t.id === "(comment)");

      if (t.reach) {
        return;
      }
      if (t.id !== "(endline)") {
        if (t.id === "function") {
          if (state.option.latedef === true) {
            warning("W026", t);
          }
          break;
        }

        warning("W027", t, t.value, controlToken.value);
        break;
      }
    }
  }

  function parseFinalSemicolon() {
    if (state.tokens.next.id !== ";") {
      if (state.tokens.next.isUnclosed) return advance();

      var sameLine = startLine(state.tokens.next) === state.tokens.curr.line &&
                     state.tokens.next.id !== "(end)";
      var blockEnd = checkPunctuator(state.tokens.next, "}");

      if (sameLine && !blockEnd) {
        errorAt("E058", state.tokens.curr.line, state.tokens.curr.character);
      } else if (!state.option.asi) {
        if ((blockEnd && !state.option.lastsemic) || !sameLine) {
          warningAt("W033", state.tokens.curr.line, state.tokens.curr.character);
        }
      }
    } else {
      advance(";");
    }
  }

  function statement() {
    var i = indent, r, t = state.tokens.next, hasOwnScope = false;

    if (t.id === ";") {
      advance(";");
      return;
    }
    var res = isReserved(t);

    if (res && t.meta && t.meta.isFutureReservedWord && peek().id === ":") {
      warning("W024", t, t.id);
      res = false;
    }

    if (t.identifier && !res && peek().id === ":") {
      advance();
      advance(":");

      hasOwnScope = true;
      state.funct["(scope)"].stack();
      state.funct["(scope)"].block.addBreakLabel(t.value, { token: state.tokens.curr });

      if (!state.tokens.next.labelled && state.tokens.next.value !== "{") {
        warning("W028", state.tokens.next, t.value, state.tokens.next.value);
      }

      state.tokens.next.label = t.value;
      t = state.tokens.next;
    }

    if (t.id === "{") {
      var iscase = (state.funct["(verb)"] === "case" && state.tokens.curr.value === ":");
      block(true, true, false, false, iscase);
      return;
    }

    r = expression(0, true);

    if (r && !(r.identifier && r.value === "function") &&
        !(r.type === "(punctuator)" && r.left &&
          r.left.identifier && r.left.value === "function")) {
      if (!state.isStrict() &&
          state.option.strict === "global") {
        warning("E007");
      }
    }

    if (!t.block) {
      if (!state.option.expr && (!r || !r.exps)) {
        warning("W030", state.tokens.curr);
      } else if (state.option.nonew && r && r.left && r.id === "(" && r.left.id === "new") {
        warning("W031", t);
      }
      parseFinalSemicolon();
    }

    indent = i;
    if (hasOwnScope) {
      state.funct["(scope)"].unstack();
    }
    return r;
  }


  function statements() {
    var a = [], p;

    while (!state.tokens.next.reach && state.tokens.next.id !== "(end)") {
      if (state.tokens.next.id === ";") {
        p = peek();

        if (!p || (p.id !== "(" && p.id !== "[")) {
          warning("W032");
        }

        advance(";");
      } else {
        a.push(statement());
      }
    }
    return a;
  }
  function directives() {
    var i, p, pn;

    while (state.tokens.next.id === "(string)") {
      p = peek(0);
      if (p.id === "(endline)") {
        i = 1;
        do {
          pn = peek(i++);
        } while (pn.id === "(endline)");
        if (pn.id === ";") {
          p = pn;
        } else if (pn.value === "[" || pn.value === ".") {
          break;
        } else if (!state.option.asi || pn.value === "(") {
          warning("W033", state.tokens.next);
        }
      } else if (p.id === "." || p.id === "[") {
        break;
      } else if (p.id !== ";") {
        warning("W033", p);
      }

      advance();
      var directive = state.tokens.curr.value;
      if (state.directive[directive] ||
          (directive === "use strict" && state.option.strict === "implied")) {
        warning("W034", state.tokens.curr, directive);
      }
      state.directive[directive] = true;

      if (p.id === ";") {
        advance(";");
      }
    }

    if (state.isStrict()) {
      if (!state.option["(explicitNewcap)"]) {
        state.option.newcap = true;
      }
      state.option.undef = true;
    }
  }
  function block(ordinary, stmt, isfunc, isfatarrow, iscase) {
    var a,
      b = inblock,
      old_indent = indent,
      m,
      t,
      line,
      d;

    inblock = ordinary;

    t = state.tokens.next;

    var metrics = state.funct["(metrics)"];
    metrics.nestedBlockDepth += 1;
    metrics.verifyMaxNestedBlockDepthPerFunction();

    if (state.tokens.next.id === "{") {
      advance("{");
      state.funct["(scope)"].stack();

      line = state.tokens.curr.line;
      if (state.tokens.next.id !== "}") {
        indent += state.option.indent;
        while (!ordinary && state.tokens.next.from > indent) {
          indent += state.option.indent;
        }

        if (isfunc) {
          m = {};
          for (d in state.directive) {
            if (_.has(state.directive, d)) {
              m[d] = state.directive[d];
            }
          }
          directives();

          if (state.option.strict && state.funct["(context)"]["(global)"]) {
            if (!m["use strict"] && !state.isStrict()) {
              warning("E007");
            }
          }
        }

        a = statements();

        metrics.statementCount += a.length;

        indent -= state.option.indent;
      }

      advance("}", t);

      if (isfunc) {
        state.funct["(scope)"].validateParams();
        if (m) {
          state.directive = m;
        }
      }

      state.funct["(scope)"].unstack();

      indent = old_indent;
    } else if (!ordinary) {
      if (isfunc) {
        state.funct["(scope)"].stack();

        m = {};
        if (stmt && !isfatarrow && !state.inMoz()) {
          error("W118", state.tokens.curr, "function closure expressions");
        }

        if (!stmt) {
          for (d in state.directive) {
            if (_.has(state.directive, d)) {
              m[d] = state.directive[d];
            }
          }
        }
        expression(10);

        if (state.option.strict && state.funct["(context)"]["(global)"]) {
          if (!m["use strict"] && !state.isStrict()) {
            warning("E007");
          }
        }

        state.funct["(scope)"].unstack();
      } else {
        error("E021", state.tokens.next, "{", state.tokens.next.value);
      }
    } else {
      state.funct["(noblockscopedvar)"] = state.tokens.next.id !== "for";
      state.funct["(scope)"].stack();

      if (!stmt || state.option.curly) {
        warning("W116", state.tokens.next, "{", state.tokens.next.value);
      }

      state.tokens.next.inBracelessBlock = true;
      indent += state.option.indent;
      a = [statement()];
      indent -= state.option.indent;

      state.funct["(scope)"].unstack();
      delete state.funct["(noblockscopedvar)"];
    }
    switch (state.funct["(verb)"]) {
    case "break":
    case "continue":
    case "return":
    case "throw":
      if (iscase) {
        break;
      }
    default:
      state.funct["(verb)"] = null;
    }

    inblock = b;
    if (ordinary && state.option.noempty && (!a || a.length === 0)) {
      warning("W035", state.tokens.prev);
    }
    metrics.nestedBlockDepth -= 1;
    return a;
  }


  function countMember(m) {
    if (membersOnly && typeof membersOnly[m] !== "boolean") {
      warning("W036", state.tokens.curr, m);
    }
    if (typeof member[m] === "number") {
      member[m] += 1;
    } else {
      member[m] = 1;
    }
  }

  type("(number)", function() {
    return this;
  });

  type("(string)", function() {
    return this;
  });

  state.syntax["(identifier)"] = {
    type: "(identifier)",
    lbp: 0,
    identifier: true,

    nud: function() {
      var v = this.value;
      if (state.tokens.next.id === "=>") {
        return this;
      }

      if (!state.funct["(comparray)"].check(v)) {
        state.funct["(scope)"].block.use(v, state.tokens.curr);
      }
      return this;
    },

    led: function() {
      error("E033", state.tokens.next, state.tokens.next.value);
    }
  };

  var baseTemplateSyntax = {
    lbp: 0,
    identifier: false,
    template: true,
  };
  state.syntax["(template)"] = _.extend({
    type: "(template)",
    nud: doTemplateLiteral,
    led: doTemplateLiteral,
    noSubst: false
  }, baseTemplateSyntax);

  state.syntax["(template middle)"] = _.extend({
    type: "(template middle)",
    middle: true,
    noSubst: false
  }, baseTemplateSyntax);

  state.syntax["(template tail)"] = _.extend({
    type: "(template tail)",
    tail: true,
    noSubst: false
  }, baseTemplateSyntax);

  state.syntax["(no subst template)"] = _.extend({
    type: "(template)",
    nud: doTemplateLiteral,
    led: doTemplateLiteral,
    noSubst: true,
    tail: true // mark as tail, since it's always the last component
  }, baseTemplateSyntax);

  type("(regexp)", function() {
    return this;
  });

  delim("(endline)");
  delim("(begin)");
  delim("(end)").reach = true;
  delim("(error)").reach = true;
  delim("}").reach = true;
  delim(")");
  delim("]");
  delim("\"").reach = true;
  delim("'").reach = true;
  delim(";");
  delim(":").reach = true;
  delim("#");

  reserve("else");
  reserve("case").reach = true;
  reserve("catch");
  reserve("default").reach = true;
  reserve("finally");
  reservevar("arguments", function(x) {
    if (state.isStrict() && state.funct["(global)"]) {
      warning("E008", x);
    }
  });
  reservevar("eval");
  reservevar("false");
  reservevar("Infinity");
  reservevar("null");
  reservevar("this", function(x) {
    if (state.isStrict() && !isMethod() &&
        !state.option.validthis && ((state.funct["(statement)"] &&
        state.funct["(name)"].charAt(0) > "Z") || state.funct["(global)"])) {
      warning("W040", x);
    }
  });
  reservevar("true");
  reservevar("undefined");

  assignop("=", "assign", 20);
  assignop("+=", "assignadd", 20);
  assignop("-=", "assignsub", 20);
  assignop("*=", "assignmult", 20);
  assignop("/=", "assigndiv", 20).nud = function() {
    error("E014");
  };
  assignop("%=", "assignmod", 20);

  bitwiseassignop("&=");
  bitwiseassignop("|=");
  bitwiseassignop("^=");
  bitwiseassignop("<<=");
  bitwiseassignop(">>=");
  bitwiseassignop(">>>=");
  infix(",", function(left, that) {
    var expr;
    that.exprs = [left];

    if (state.option.nocomma) {
      warning("W127");
    }

    if (!comma({ peek: true })) {
      return that;
    }
    while (true) {
      if (!(expr = expression(10))) {
        break;
      }
      that.exprs.push(expr);
      if (state.tokens.next.value !== "," || !comma()) {
        break;
      }
    }
    return that;
  }, 10, true);

  infix("?", function(left, that) {
    increaseComplexityCount();
    that.left = left;
    that.right = expression(10);
    advance(":");
    that["else"] = expression(10);
    return that;
  }, 30);

  var orPrecendence = 40;
  infix("||", function(left, that) {
    increaseComplexityCount();
    that.left = left;
    that.right = expression(orPrecendence);
    return that;
  }, orPrecendence);
  infix("&&", "and", 50);
  bitwise("|", "bitor", 70);
  bitwise("^", "bitxor", 80);
  bitwise("&", "bitand", 90);
  relation("==", function(left, right) {
    var eqnull = state.option.eqnull &&
      ((left && left.value) === "null" || (right && right.value) === "null");

    switch (true) {
      case !eqnull && state.option.eqeqeq:
        this.from = this.character;
        warning("W116", this, "===", "==");
        break;
      case isPoorRelation(left):
        warning("W041", this, "===", left.value);
        break;
      case isPoorRelation(right):
        warning("W041", this, "===", right.value);
        break;
      case isTypoTypeof(right, left, state):
        warning("W122", this, right.value);
        break;
      case isTypoTypeof(left, right, state):
        warning("W122", this, left.value);
        break;
    }

    return this;
  });
  relation("===", function(left, right) {
    if (isTypoTypeof(right, left, state)) {
      warning("W122", this, right.value);
    } else if (isTypoTypeof(left, right, state)) {
      warning("W122", this, left.value);
    }
    return this;
  });
  relation("!=", function(left, right) {
    var eqnull = state.option.eqnull &&
        ((left && left.value) === "null" || (right && right.value) === "null");

    if (!eqnull && state.option.eqeqeq) {
      this.from = this.character;
      warning("W116", this, "!==", "!=");
    } else if (isPoorRelation(left)) {
      warning("W041", this, "!==", left.value);
    } else if (isPoorRelation(right)) {
      warning("W041", this, "!==", right.value);
    } else if (isTypoTypeof(right, left, state)) {
      warning("W122", this, right.value);
    } else if (isTypoTypeof(left, right, state)) {
      warning("W122", this, left.value);
    }
    return this;
  });
  relation("!==", function(left, right) {
    if (isTypoTypeof(right, left, state)) {
      warning("W122", this, right.value);
    } else if (isTypoTypeof(left, right, state)) {
      warning("W122", this, left.value);
    }
    return this;
  });
  relation("<");
  relation(">");
  relation("<=");
  relation(">=");
  bitwise("<<", "shiftleft", 120);
  bitwise(">>", "shiftright", 120);
  bitwise(">>>", "shiftrightunsigned", 120);
  infix("in", "in", 120);
  infix("instanceof", "instanceof", 120);
  infix("+", function(left, that) {
    var right;
    that.left = left;
    that.right = right = expression(130);

    if (left && right && left.id === "(string)" && right.id === "(string)") {
      left.value += right.value;
      left.character = right.character;
      if (!state.option.scripturl && reg.javascriptURL.test(left.value)) {
        warning("W050", left);
      }
      return left;
    }

    return that;
  }, 130);
  prefix("+", "num");
  prefix("+++", function() {
    warning("W007");
    this.arity = "unary";
    this.right = expression(150);
    return this;
  });
  infix("+++", function(left) {
    warning("W007");
    this.left = left;
    this.right = expression(130);
    return this;
  }, 130);
  infix("-", "sub", 130);
  prefix("-", "neg");
  prefix("---", function() {
    warning("W006");
    this.arity = "unary";
    this.right = expression(150);
    return this;
  });
  infix("---", function(left) {
    warning("W006");
    this.left = left;
    this.right = expression(130);
    return this;
  }, 130);
  infix("*", "mult", 140);
  infix("/", "div", 140);
  infix("%", "mod", 140);

  suffix("++");
  prefix("++", "preinc");
  state.syntax["++"].exps = true;

  suffix("--");
  prefix("--", "predec");
  state.syntax["--"].exps = true;
  prefix("delete", function() {
    var p = expression(10);
    if (!p) {
      return this;
    }

    if (p.id !== "." && p.id !== "[") {
      warning("W051");
    }
    this.first = p;
    if (p.identifier && !state.isStrict()) {
      p.forgiveUndef = true;
    }
    return this;
  }).exps = true;

  prefix("~", function() {
    if (state.option.bitwise) {
      warning("W016", this, "~");
    }
    this.arity = "unary";
    this.right = expression(150);
    return this;
  });

  prefix("...", function() {
    if (!state.inES6(true)) {
      warning("W119", this, "spread/rest operator", "6");
    }
    if (!state.tokens.next.identifier &&
        state.tokens.next.type !== "(string)" &&
          !checkPunctuators(state.tokens.next, ["[", "("])) {

      error("E030", state.tokens.next, state.tokens.next.value);
    }
    expression(150);
    return this;
  });

  prefix("!", function() {
    this.arity = "unary";
    this.right = expression(150);

    if (!this.right) { // '!' followed by nothing? Give up.
      quit("E041", this.line || 0);
    }

    if (bang[this.right.id] === true) {
      warning("W018", this, "!");
    }
    return this;
  });

  prefix("typeof", (function() {
    var p = expression(150);
    this.first = this.right = p;

    if (!p) { // 'typeof' followed by nothing? Give up.
      quit("E041", this.line || 0, this.character || 0);
    }
    if (p.identifier) {
      p.forgiveUndef = true;
    }
    return this;
  }));
  prefix("new", function() {
    var mp = metaProperty("target", function() {
      if (!state.inES6(true)) {
        warning("W119", state.tokens.prev, "new.target", "6");
      }
      var inFunction, c = state.funct;
      while (c) {
        inFunction = !c["(global)"];
        if (!c["(arrow)"]) { break; }
        c = c["(context)"];
      }
      if (!inFunction) {
        warning("W136", state.tokens.prev, "new.target");
      }
    });
    if (mp) { return mp; }

    var c = expression(155), i;
    if (c && c.id !== "function") {
      if (c.identifier) {
        c["new"] = true;
        switch (c.value) {
        case "Number":
        case "String":
        case "Boolean":
        case "Math":
        case "JSON":
          warning("W053", state.tokens.prev, c.value);
          break;
        case "Symbol":
          if (state.inES6()) {
            warning("W053", state.tokens.prev, c.value);
          }
          break;
        case "Function":
          if (!state.option.evil) {
            warning("W054");
          }
          break;
        case "Date":
        case "RegExp":
        case "this":
          break;
        default:
          if (c.id !== "function") {
            i = c.value.substr(0, 1);
            if (state.option.newcap && (i < "A" || i > "Z") &&
              !state.funct["(scope)"].isPredefined(c.value)) {
              warning("W055", state.tokens.curr);
            }
          }
        }
      } else {
        if (c.id !== "." && c.id !== "[" && c.id !== "(") {
          warning("W056", state.tokens.curr);
        }
      }
    } else {
      if (!state.option.supernew)
        warning("W057", this);
    }
    if (state.tokens.next.id !== "(" && !state.option.supernew) {
      warning("W058", state.tokens.curr, state.tokens.curr.value);
    }
    this.first = this.right = c;
    return this;
  });
  state.syntax["new"].exps = true;

  prefix("void").exps = true;

  infix(".", function(left, that) {
    var m = identifier(false, true);

    if (typeof m === "string") {
      countMember(m);
    }

    that.left = left;
    that.right = m;

    if (m && m === "hasOwnProperty" && state.tokens.next.value === "=") {
      warning("W001");
    }

    if (left && left.value === "arguments" && (m === "callee" || m === "caller")) {
      if (state.option.noarg)
        warning("W059", left, m);
      else if (state.isStrict())
        error("E008");
    } else if (!state.option.evil && left && left.value === "document" &&
        (m === "write" || m === "writeln")) {
      warning("W060", left);
    }

    if (!state.option.evil && (m === "eval" || m === "execScript")) {
      if (isGlobalEval(left, state)) {
        warning("W061");
      }
    }

    return that;
  }, 160, true);

  infix("(", function(left, that) {
    if (state.option.immed && left && !left.immed && left.id === "function") {
      warning("W062");
    }

    var n = 0;
    var p = [];

    if (left) {
      if (left.type === "(identifier)") {
        if (left.value.match(/^[A-Z]([A-Z0-9_$]*[a-z][A-Za-z0-9_$]*)?$/)) {
          if ("Array Number String Boolean Date Object Error Symbol".indexOf(left.value) === -1) {
            if (left.value === "Math") {
              warning("W063", left);
            } else if (state.option.newcap) {
              warning("W064", left);
            }
          }
        }
      }
    }

    if (state.tokens.next.id !== ")") {
      for (;;) {
        p[p.length] = expression(10);
        n += 1;
        if (state.tokens.next.id !== ",") {
          break;
        }
        comma();
      }
    }

    advance(")");

    if (typeof left === "object") {
      if (!state.inES5() && left.value === "parseInt" && n === 1) {
        warning("W065", state.tokens.curr);
      }
      if (!state.option.evil) {
        if (left.value === "eval" || left.value === "Function" ||
            left.value === "execScript") {
          warning("W061", left);

          if (p[0] && [0].id === "(string)") {
            addInternalSrc(left, p[0].value);
          }
        } else if (p[0] && p[0].id === "(string)" &&
             (left.value === "setTimeout" ||
            left.value === "setInterval")) {
          warning("W066", left);
          addInternalSrc(left, p[0].value);
        } else if (p[0] && p[0].id === "(string)" &&
             left.value === "." &&
             left.left.value === "window" &&
             (left.right === "setTimeout" ||
            left.right === "setInterval")) {
          warning("W066", left);
          addInternalSrc(left, p[0].value);
        }
      }
      if (!left.identifier && left.id !== "." && left.id !== "[" && left.id !== "=>" &&
          left.id !== "(" && left.id !== "&&" && left.id !== "||" && left.id !== "?" &&
          !(state.inES6() && left["(name)"])) {
        warning("W067", that);
      }
    }

    that.left = left;
    return that;
  }, 155, true).exps = true;

  prefix("(", function() {
    var pn = state.tokens.next, pn1, i = -1;
    var ret, triggerFnExpr, first, last;
    var parens = 1;
    var opening = state.tokens.curr;
    var preceeding = state.tokens.prev;
    var isNecessary = !state.option.singleGroups;

    do {
      if (pn.value === "(") {
        parens += 1;
      } else if (pn.value === ")") {
        parens -= 1;
      }

      i += 1;
      pn1 = pn;
      pn = peek(i);
    } while (!(parens === 0 && pn1.value === ")") && pn.value !== ";" && pn.type !== "(end)");

    if (state.tokens.next.id === "function") {
      triggerFnExpr = state.tokens.next.immed = true;
    }
    if (pn.value === "=>") {
      return doFunction({ type: "arrow", parsedOpening: true });
    }

    var exprs = [];

    if (state.tokens.next.id !== ")") {
      for (;;) {
        exprs.push(expression(10));

        if (state.tokens.next.id !== ",") {
          break;
        }

        if (state.option.nocomma) {
          warning("W127");
        }

        comma();
      }
    }

    advance(")", this);
    if (state.option.immed && exprs[0] && exprs[0].id === "function") {
      if (state.tokens.next.id !== "(" &&
        state.tokens.next.id !== "." && state.tokens.next.id !== "[") {
        warning("W068", this);
      }
    }

    if (!exprs.length) {
      return;
    }
    if (exprs.length > 1) {
      ret = Object.create(state.syntax[","]);
      ret.exprs = exprs;

      first = exprs[0];
      last = exprs[exprs.length - 1];

      if (!isNecessary) {
        isNecessary = preceeding.assign || preceeding.delim;
      }
    } else {
      ret = first = last = exprs[0];

      if (!isNecessary) {
        isNecessary =
          (opening.beginsStmt && (ret.id === "{" || triggerFnExpr || isFunctor(ret))) ||
          (triggerFnExpr &&
            (!isEndOfExpr() || state.tokens.prev.id !== "}")) ||
          (isFunctor(ret) && !isEndOfExpr()) ||
          (ret.id === "{" && preceeding.id === "=>") ||
          (ret.type === "(number)" &&
            checkPunctuator(pn, ".") && /^\d+$/.test(ret.value));
      }
    }

    if (ret) {
      if (!isNecessary && (first.left || first.right || ret.exprs)) {
        isNecessary =
          (!isBeginOfExpr(preceeding) && first.lbp <= preceeding.lbp) ||
          (!isEndOfExpr() && last.lbp < state.tokens.next.lbp);
      }

      if (!isNecessary) {
        warning("W126", opening);
      }

      ret.paren = true;
    }

    return ret;
  });

  application("=>");

  infix("[", function(left, that) {
    var e = expression(10), s;
    if (e && e.type === "(string)") {
      if (!state.option.evil && (e.value === "eval" || e.value === "execScript")) {
        if (isGlobalEval(left, state)) {
          warning("W061");
        }
      }

      countMember(e.value);
      if (!state.option.sub && reg.identifier.test(e.value)) {
        s = state.syntax[e.value];
        if (!s || !isReserved(s)) {
          warning("W069", state.tokens.prev, e.value);
        }
      }
    }
    advance("]", that);

    if (e && e.value === "hasOwnProperty" && state.tokens.next.value === "=") {
      warning("W001");
    }

    that.left = left;
    that.right = e;
    return that;
  }, 160, true);

  function comprehensiveArrayExpression() {
    var res = {};
    res.exps = true;
    state.funct["(comparray)"].stack();
    var reversed = false;
    if (state.tokens.next.value !== "for") {
      reversed = true;
      if (!state.inMoz()) {
        warning("W116", state.tokens.next, "for", state.tokens.next.value);
      }
      state.funct["(comparray)"].setState("use");
      res.right = expression(10);
    }

    advance("for");
    if (state.tokens.next.value === "each") {
      advance("each");
      if (!state.inMoz()) {
        warning("W118", state.tokens.curr, "for each");
      }
    }
    advance("(");
    state.funct["(comparray)"].setState("define");
    res.left = expression(130);
    if (_.contains(["in", "of"], state.tokens.next.value)) {
      advance();
    } else {
      error("E045", state.tokens.curr);
    }
    state.funct["(comparray)"].setState("generate");
    expression(10);

    advance(")");
    if (state.tokens.next.value === "if") {
      advance("if");
      advance("(");
      state.funct["(comparray)"].setState("filter");
      res.filter = expression(10);
      advance(")");
    }

    if (!reversed) {
      state.funct["(comparray)"].setState("use");
      res.right = expression(10);
    }

    advance("]");
    state.funct["(comparray)"].unstack();
    return res;
  }

  prefix("[", function() {
    var blocktype = lookupBlockType();
    if (blocktype.isCompArray) {
      if (!state.option.esnext && !state.inMoz()) {
        warning("W118", state.tokens.curr, "array comprehension");
      }
      return comprehensiveArrayExpression();
    } else if (blocktype.isDestAssign) {
      this.destructAssign = destructuringPattern({ openingParsed: true, assignment: true });
      return this;
    }
    var b = state.tokens.curr.line !== startLine(state.tokens.next);
    this.first = [];
    if (b) {
      indent += state.option.indent;
      if (state.tokens.next.from === indent + state.option.indent) {
        indent += state.option.indent;
      }
    }
    while (state.tokens.next.id !== "(end)") {
      while (state.tokens.next.id === ",") {
        if (!state.option.elision) {
          if (!state.inES5()) {
            warning("W070");
          } else {
            warning("W128");
            do {
              advance(",");
            } while (state.tokens.next.id === ",");
            continue;
          }
        }
        advance(",");
      }

      if (state.tokens.next.id === "]") {
        break;
      }

      this.first.push(expression(10));
      if (state.tokens.next.id === ",") {
        comma({ allowTrailing: true });
        if (state.tokens.next.id === "]" && !state.inES5()) {
          warning("W070", state.tokens.curr);
          break;
        }
      } else {
        break;
      }
    }
    if (b) {
      indent -= state.option.indent;
    }
    advance("]", this);
    return this;
  });


  function isMethod() {
    return state.funct["(statement)"] && state.funct["(statement)"].type === "class" ||
           state.funct["(context)"] && state.funct["(context)"]["(verb)"] === "class";
  }


  function isPropertyName(token) {
    return token.identifier || token.id === "(string)" || token.id === "(number)";
  }


  function propertyName(preserveOrToken) {
    var id;
    var preserve = true;
    if (typeof preserveOrToken === "object") {
      id = preserveOrToken;
    } else {
      preserve = preserveOrToken;
      id = optionalidentifier(false, true, preserve);
    }

    if (!id) {
      if (state.tokens.next.id === "(string)") {
        id = state.tokens.next.value;
        if (!preserve) {
          advance();
        }
      } else if (state.tokens.next.id === "(number)") {
        id = state.tokens.next.value.toString();
        if (!preserve) {
          advance();
        }
      }
    } else if (typeof id === "object") {
      if (id.id === "(string)" || id.id === "(identifier)") id = id.value;
      else if (id.id === "(number)") id = id.value.toString();
    }

    if (id === "hasOwnProperty") {
      warning("W001");
    }

    return id;
  }
  function functionparams(options) {
    var next;
    var paramsIds = [];
    var ident;
    var tokens = [];
    var t;
    var pastDefault = false;
    var pastRest = false;
    var arity = 0;
    var loneArg = options && options.loneArg;

    if (loneArg && loneArg.identifier === true) {
      state.funct["(scope)"].addParam(loneArg.value, loneArg);
      return { arity: 1, params: [ loneArg.value ] };
    }

    next = state.tokens.next;

    if (!options || !options.parsedOpening) {
      advance("(");
    }

    if (state.tokens.next.id === ")") {
      advance(")");
      return;
    }

    function addParam(addParamArgs) {
      state.funct["(scope)"].addParam.apply(state.funct["(scope)"], addParamArgs);
    }

    for (;;) {
      arity++;
      var currentParams = [];

      if (_.contains(["{", "["], state.tokens.next.id)) {
        tokens = destructuringPattern();
        for (t in tokens) {
          t = tokens[t];
          if (t.id) {
            paramsIds.push(t.id);
            currentParams.push([t.id, t.token]);
          }
        }
      } else {
        if (checkPunctuator(state.tokens.next, "...")) pastRest = true;
        ident = identifier(true);
        if (ident) {
          paramsIds.push(ident);
          currentParams.push([ident, state.tokens.curr]);
        } else {
          while (!checkPunctuators(state.tokens.next, [",", ")"])) advance();
        }
      }
      if (pastDefault) {
        if (state.tokens.next.id !== "=") {
          error("W138", state.tokens.current);
        }
      }
      if (state.tokens.next.id === "=") {
        if (!state.inES6()) {
          warning("W119", state.tokens.next, "default parameters", "6");
        }
        advance("=");
        pastDefault = true;
        expression(10);
      }
      currentParams.forEach(addParam);

      if (state.tokens.next.id === ",") {
        if (pastRest) {
          warning("W131", state.tokens.next);
        }
        comma();
      } else {
        advance(")", next);
        return { arity: arity, params: paramsIds };
      }
    }
  }

  function functor(name, token, overwrites) {
    var funct = {
      "(name)"      : name,
      "(breakage)"  : 0,
      "(loopage)"   : 0,
      "(tokens)"    : {},
      "(properties)": {},

      "(catch)"     : false,
      "(global)"    : false,

      "(line)"      : null,
      "(character)" : null,
      "(metrics)"   : null,
      "(statement)" : null,
      "(context)"   : null,
      "(scope)"     : null,
      "(comparray)" : null,
      "(generator)" : null,
      "(arrow)"     : null,
      "(params)"    : null
    };

    if (token) {
      _.extend(funct, {
        "(line)"     : token.line,
        "(character)": token.character,
        "(metrics)"  : createMetrics(token)
      });
    }

    _.extend(funct, overwrites);

    if (funct["(context)"]) {
      funct["(scope)"] = funct["(context)"]["(scope)"];
      funct["(comparray)"]  = funct["(context)"]["(comparray)"];
    }

    return funct;
  }

  function isFunctor(token) {
    return "(scope)" in token;
  }
  function hasParsedCode(funct) {
    return funct["(global)"] && !funct["(verb)"];
  }

  function doTemplateLiteral(left) {
    var ctx = this.context;
    var noSubst = this.noSubst;
    var depth = this.depth;

    if (!noSubst) {
      while (!end()) {
        if (!state.tokens.next.template || state.tokens.next.depth > depth) {
          expression(0); // should probably have different rbp?
        } else {
          advance();
        }
      }
    }

    return {
      id: "(template)",
      type: "(template)",
      tag: left
    };

    function end() {
      if (state.tokens.curr.template && state.tokens.curr.tail &&
          state.tokens.curr.context === ctx) return true;
      var complete = (state.tokens.next.template && state.tokens.next.tail &&
                      state.tokens.next.context === ctx);
      if (complete) advance();
      return complete || state.tokens.next.isUnclosed;
    }
  }
  function doFunction(options) {
    var f, token, name, statement, classExprBinding, isGenerator, isArrow, ignoreLoopFunc;
    var oldOption = state.option;
    var oldIgnored = state.ignored;

    if (options) {
      name = options.name;
      statement = options.statement;
      classExprBinding = options.classExprBinding;
      isGenerator = options.type === "generator";
      isArrow = options.type === "arrow";
      ignoreLoopFunc = options.ignoreLoopFunc;
    }

    state.option = Object.create(state.option);
    state.ignored = Object.create(state.ignored);

    state.funct = functor(name || state.nameStack.infer(), state.tokens.next, {
      "(statement)": statement,
      "(context)":   state.funct,
      "(arrow)":     isArrow,
      "(generator)": isGenerator
    });

    f = state.funct;
    token = state.tokens.curr;
    token.funct = state.funct;

    functions.push(state.funct);
    state.funct["(scope)"].stack("functionouter");
    var internallyAccessibleName = name || classExprBinding;
    if (internallyAccessibleName) {
      state.funct["(scope)"].block.add(internallyAccessibleName,
        classExprBinding ? "class" : "function", state.tokens.curr, false);
    }
    state.funct["(scope)"].stack("functionparams");

    var paramsInfo = functionparams(options);

    if (paramsInfo) {
      state.funct["(params)"] = paramsInfo.params;
      state.funct["(metrics)"].arity = paramsInfo.arity;
      state.funct["(metrics)"].verifyMaxParametersPerFunction();
    } else {
      state.funct["(metrics)"].arity = 0;
    }

    if (isArrow) {
      if (!state.inES6(true)) {
        warning("W119", state.tokens.curr, "arrow function syntax (=>)", "6");
      }

      if (!options.loneArg) {
        advance("=>");
      }
    }

    block(false, true, true, isArrow);

    if (!state.option.noyield && isGenerator &&
        state.funct["(generator)"] !== "yielded") {
      warning("W124", state.tokens.curr);
    }

    state.funct["(metrics)"].verifyMaxStatementsPerFunction();
    state.funct["(metrics)"].verifyMaxComplexityPerFunction();
    state.funct["(unusedOption)"] = state.option.unused;
    state.option = oldOption;
    state.ignored = oldIgnored;
    state.funct["(last)"] = state.tokens.curr.line;
    state.funct["(lastcharacter)"] = state.tokens.curr.character;
    state.funct["(scope)"].unstack(); // also does usage and label checks
    state.funct["(scope)"].unstack();

    state.funct = state.funct["(context)"];

    if (!ignoreLoopFunc && !state.option.loopfunc && state.funct["(loopage)"]) {
      if (f["(isCapturing)"]) {
        warning("W083", token);
      }
    }

    return f;
  }

  function createMetrics(functionStartToken) {
    return {
      statementCount: 0,
      nestedBlockDepth: -1,
      ComplexityCount: 1,
      arity: 0,

      verifyMaxStatementsPerFunction: function() {
        if (state.option.maxstatements &&
          this.statementCount > state.option.maxstatements) {
          warning("W071", functionStartToken, this.statementCount);
        }
      },

      verifyMaxParametersPerFunction: function() {
        if (_.isNumber(state.option.maxparams) &&
          this.arity > state.option.maxparams) {
          warning("W072", functionStartToken, this.arity);
        }
      },

      verifyMaxNestedBlockDepthPerFunction: function() {
        if (state.option.maxdepth &&
          this.nestedBlockDepth > 0 &&
          this.nestedBlockDepth === state.option.maxdepth + 1) {
          warning("W073", null, this.nestedBlockDepth);
        }
      },

      verifyMaxComplexityPerFunction: function() {
        var max = state.option.maxcomplexity;
        var cc = this.ComplexityCount;
        if (max && cc > max) {
          warning("W074", functionStartToken, cc);
        }
      }
    };
  }

  function increaseComplexityCount() {
    state.funct["(metrics)"].ComplexityCount += 1;
  }

  function checkCondAssignment(expr) {
    var id, paren;
    if (expr) {
      id = expr.id;
      paren = expr.paren;
      if (id === "," && (expr = expr.exprs[expr.exprs.length - 1])) {
        id = expr.id;
        paren = paren || expr.paren;
      }
    }
    switch (id) {
    case "=":
    case "+=":
    case "-=":
    case "*=":
    case "%=":
    case "&=":
    case "|=":
    case "^=":
    case "/=":
      if (!paren && !state.option.boss) {
        warning("W084");
      }
    }
  }
  function checkProperties(props) {
    if (state.inES5()) {
      for (var name in props) {
        if (props[name] && props[name].setterToken && !props[name].getterToken) {
          warning("W078", props[name].setterToken);
        }
      }
    }
  }

  function metaProperty(name, c) {
    if (checkPunctuator(state.tokens.next, ".")) {
      var left = state.tokens.curr.id;
      advance(".");
      var id = identifier();
      state.tokens.curr.isMetaProperty = true;
      if (name !== id) {
        error("E057", state.tokens.prev, left, id);
      } else {
        c();
      }
      return state.tokens.curr;
    }
  }

  (function(x) {
    x.nud = function() {
      var b, f, i, p, t, isGeneratorMethod = false, nextVal;
      var props = Object.create(null); // All properties, including accessors

      b = state.tokens.curr.line !== startLine(state.tokens.next);
      if (b) {
        indent += state.option.indent;
        if (state.tokens.next.from === indent + state.option.indent) {
          indent += state.option.indent;
        }
      }

      var blocktype = lookupBlockType();
      if (blocktype.isDestAssign) {
        this.destructAssign = destructuringPattern({ openingParsed: true, assignment: true });
        return this;
      }

      for (;;) {
        if (state.tokens.next.id === "}") {
          break;
        }

        nextVal = state.tokens.next.value;
        if (state.tokens.next.identifier &&
            (peekIgnoreEOL().id === "," || peekIgnoreEOL().id === "}")) {
          if (!state.inES6()) {
            warning("W104", state.tokens.next, "object short notation", "6");
          }
          i = propertyName(true);
          saveProperty(props, i, state.tokens.next);

          expression(10);

        } else if (peek().id !== ":" && (nextVal === "get" || nextVal === "set")) {
          advance(nextVal);

          if (!state.inES5()) {
            error("E034");
          }

          i = propertyName();
          if (!i && !state.inES6()) {
            error("E035");
          }
          if (i) {
            saveAccessor(nextVal, props, i, state.tokens.curr);
          }

          t = state.tokens.next;
          f = doFunction();
          p = f["(params)"];
          if (nextVal === "get" && i && p) {
            warning("W076", t, p[0], i);
          } else if (nextVal === "set" && i && (!p || p.length !== 1)) {
            warning("W077", t, i);
          }
        } else {
          if (state.tokens.next.value === "*" && state.tokens.next.type === "(punctuator)") {
            if (!state.inES6()) {
              warning("W104", state.tokens.next, "generator functions", "6");
            }
            advance("*");
            isGeneratorMethod = true;
          } else {
            isGeneratorMethod = false;
          }

          if (state.tokens.next.id === "[") {
            i = computedPropertyName();
            state.nameStack.set(i);
          } else {
            state.nameStack.set(state.tokens.next);
            i = propertyName();
            saveProperty(props, i, state.tokens.next);

            if (typeof i !== "string") {
              break;
            }
          }

          if (state.tokens.next.value === "(") {
            if (!state.inES6()) {
              warning("W104", state.tokens.curr, "concise methods", "6");
            }
            doFunction({ type: isGeneratorMethod ? "generator" : null });
          } else {
            advance(":");
            expression(10);
          }
        }

        countMember(i);

        if (state.tokens.next.id === ",") {
          comma({ allowTrailing: true, property: true });
          if (state.tokens.next.id === ",") {
            warning("W070", state.tokens.curr);
          } else if (state.tokens.next.id === "}" && !state.inES5()) {
            warning("W070", state.tokens.curr);
          }
        } else {
          break;
        }
      }
      if (b) {
        indent -= state.option.indent;
      }
      advance("}", this);

      checkProperties(props);

      return this;
    };
    x.fud = function() {
      error("E036", state.tokens.curr);
    };
  }(delim("{")));

  function destructuringPattern(options) {
    var isAssignment = options && options.assignment;

    if (!state.inES6()) {
      warning("W104", state.tokens.curr,
        isAssignment ? "destructuring assignment" : "destructuring binding", "6");
    }

    return destructuringPatternRecursive(options);
  }

  function destructuringPatternRecursive(options) {
    var ids;
    var identifiers = [];
    var openingParsed = options && options.openingParsed;
    var isAssignment = options && options.assignment;
    var recursiveOptions = isAssignment ? { assignment: isAssignment } : null;
    var firstToken = openingParsed ? state.tokens.curr : state.tokens.next;

    var nextInnerDE = function() {
      var ident;
      if (checkPunctuators(state.tokens.next, ["[", "{"])) {
        ids = destructuringPatternRecursive(recursiveOptions);
        for (var id in ids) {
          id = ids[id];
          identifiers.push({ id: id.id, token: id.token });
        }
      } else if (checkPunctuator(state.tokens.next, ",")) {
        identifiers.push({ id: null, token: state.tokens.curr });
      } else if (checkPunctuator(state.tokens.next, "(")) {
        advance("(");
        nextInnerDE();
        advance(")");
      } else {
        var is_rest = checkPunctuator(state.tokens.next, "...");

        if (isAssignment) {
          var identifierToken = is_rest ? peek(0) : state.tokens.next;
          if (!identifierToken.identifier) {
            warning("E030", identifierToken, identifierToken.value);
          }
          var assignTarget = expression(155);
          if (assignTarget) {
            checkLeftSideAssign(assignTarget);
            if (assignTarget.identifier) {
              ident = assignTarget.value;
            }
          }
        } else {
          ident = identifier();
        }
        if (ident) {
          identifiers.push({ id: ident, token: state.tokens.curr });
        }
        return is_rest;
      }
      return false;
    };
    var assignmentProperty = function() {
      var id;
      if (checkPunctuator(state.tokens.next, "[")) {
        advance("[");
        expression(10);
        advance("]");
        advance(":");
        nextInnerDE();
      } else if (state.tokens.next.id === "(string)" ||
                 state.tokens.next.id === "(number)") {
        advance();
        advance(":");
        nextInnerDE();
      } else {
        id = identifier();
        if (checkPunctuator(state.tokens.next, ":")) {
          advance(":");
          nextInnerDE();
        } else if (id) {
          if (isAssignment) {
            checkLeftSideAssign(state.tokens.curr);
          }
          identifiers.push({ id: id, token: state.tokens.curr });
        }
      }
    };
    if (checkPunctuator(firstToken, "[")) {
      if (!openingParsed) {
        advance("[");
      }
      if (checkPunctuator(state.tokens.next, "]")) {
        warning("W137", state.tokens.curr);
      }
      var element_after_rest = false;
      while (!checkPunctuator(state.tokens.next, "]")) {
        if (nextInnerDE() && !element_after_rest &&
            checkPunctuator(state.tokens.next, ",")) {
          warning("W130", state.tokens.next);
          element_after_rest = true;
        }
        if (checkPunctuator(state.tokens.next, "=")) {
          if (checkPunctuator(state.tokens.prev, "...")) {
            advance("]");
          } else {
            advance("=");
          }
          if (state.tokens.next.id === "undefined") {
            warning("W080", state.tokens.prev, state.tokens.prev.value);
          }
          expression(10);
        }
        if (!checkPunctuator(state.tokens.next, "]")) {
          advance(",");
        }
      }
      advance("]");
    } else if (checkPunctuator(firstToken, "{")) {

      if (!openingParsed) {
        advance("{");
      }
      if (checkPunctuator(state.tokens.next, "}")) {
        warning("W137", state.tokens.curr);
      }
      while (!checkPunctuator(state.tokens.next, "}")) {
        assignmentProperty();
        if (checkPunctuator(state.tokens.next, "=")) {
          advance("=");
          if (state.tokens.next.id === "undefined") {
            warning("W080", state.tokens.prev, state.tokens.prev.value);
          }
          expression(10);
        }
        if (!checkPunctuator(state.tokens.next, "}")) {
          advance(",");
          if (checkPunctuator(state.tokens.next, "}")) {
            break;
          }
        }
      }
      advance("}");
    }
    return identifiers;
  }

  function destructuringPatternMatch(tokens, value) {
    var first = value.first;

    if (!first)
      return;

    _.zip(tokens, Array.isArray(first) ? first : [ first ]).forEach(function(val) {
      var token = val[0];
      var value = val[1];

      if (token && value)
        token.first = value;
      else if (token && token.first && !value)
        warning("W080", token.first, token.first.value);
    });
  }

  function blockVariableStatement(type, statement, context) {

    var prefix = context && context.prefix;
    var inexport = context && context.inexport;
    var isLet = type === "let";
    var isConst = type === "const";
    var tokens, lone, value, letblock;

    if (!state.inES6()) {
      warning("W104", state.tokens.curr, type, "6");
    }

    if (isLet && state.tokens.next.value === "(") {
      if (!state.inMoz()) {
        warning("W118", state.tokens.next, "let block");
      }
      advance("(");
      state.funct["(scope)"].stack();
      letblock = true;
    } else if (state.funct["(noblockscopedvar)"]) {
      error("E048", state.tokens.curr, isConst ? "Const" : "Let");
    }

    statement.first = [];
    for (;;) {
      var names = [];
      if (_.contains(["{", "["], state.tokens.next.value)) {
        tokens = destructuringPattern();
        lone = false;
      } else {
        tokens = [ { id: identifier(), token: state.tokens.curr } ];
        lone = true;
      }

      if (!prefix && isConst && state.tokens.next.id !== "=") {
        warning("E012", state.tokens.curr, state.tokens.curr.value);
      }

      for (var t in tokens) {
        if (tokens.hasOwnProperty(t)) {
          t = tokens[t];
          if (state.funct["(scope)"].block.isGlobal()) {
            if (predefined[t.id] === false) {
              warning("W079", t.token, t.id);
            }
          }
          if (t.id && !state.funct["(noblockscopedvar)"]) {
            state.funct["(scope)"].addlabel(t.id, {
              type: type,
              token: t.token });
            names.push(t.token);

            if (lone && inexport) {
              state.funct["(scope)"].setExported(t.token.value, t.token);
            }
          }
        }
      }

      if (state.tokens.next.id === "=") {
        advance("=");
        if (!prefix && state.tokens.next.id === "undefined") {
          warning("W080", state.tokens.prev, state.tokens.prev.value);
        }
        if (!prefix && peek(0).id === "=" && state.tokens.next.identifier) {
          warning("W120", state.tokens.next, state.tokens.next.value);
        }
        value = expression(prefix ? 120 : 10);
        if (lone) {
          tokens[0].first = value;
        } else {
          destructuringPatternMatch(names, value);
        }
      }

      statement.first = statement.first.concat(names);

      if (state.tokens.next.id !== ",") {
        break;
      }
      comma();
    }
    if (letblock) {
      advance(")");
      block(true, true);
      statement.block = true;
      state.funct["(scope)"].unstack();
    }

    return statement;
  }

  var conststatement = stmt("const", function(context) {
    return blockVariableStatement("const", this, context);
  });
  conststatement.exps = true;

  var letstatement = stmt("let", function(context) {
    return blockVariableStatement("let", this, context);
  });
  letstatement.exps = true;

  var varstatement = stmt("var", function(context) {
    var prefix = context && context.prefix;
    var inexport = context && context.inexport;
    var tokens, lone, value;
    var implied = context && context.implied;
    var report = !(context && context.ignore);

    this.first = [];
    for (;;) {
      var names = [];
      if (_.contains(["{", "["], state.tokens.next.value)) {
        tokens = destructuringPattern();
        lone = false;
      } else {
        tokens = [ { id: identifier(), token: state.tokens.curr } ];
        lone = true;
      }

      if (!(prefix && implied) && report && state.option.varstmt) {
        warning("W132", this);
      }

      this.first = this.first.concat(names);

      for (var t in tokens) {
        if (tokens.hasOwnProperty(t)) {
          t = tokens[t];
          if (!implied && state.funct["(global)"]) {
            if (predefined[t.id] === false) {
              warning("W079", t.token, t.id);
            } else if (state.option.futurehostile === false) {
              if ((!state.inES5() && vars.ecmaIdentifiers[5][t.id] === false) ||
                (!state.inES6() && vars.ecmaIdentifiers[6][t.id] === false)) {
                warning("W129", t.token, t.id);
              }
            }
          }
          if (t.id) {
            if (implied === "for") {

              if (!state.funct["(scope)"].has(t.id)) {
                if (report) warning("W088", t.token, t.id);
              }
              state.funct["(scope)"].block.use(t.id, t.token);
            } else {
              state.funct["(scope)"].addlabel(t.id, {
                type: "var",
                token: t.token });

              if (lone && inexport) {
                state.funct["(scope)"].setExported(t.id, t.token);
              }
            }
            names.push(t.token);
          }
        }
      }

      if (state.tokens.next.id === "=") {
        state.nameStack.set(state.tokens.curr);

        advance("=");
        if (!prefix && report && !state.funct["(loopage)"] &&
          state.tokens.next.id === "undefined") {
          warning("W080", state.tokens.prev, state.tokens.prev.value);
        }
        if (peek(0).id === "=" && state.tokens.next.identifier) {
          if (!prefix && report &&
              !state.funct["(params)"] ||
              state.funct["(params)"].indexOf(state.tokens.next.value) === -1) {
            warning("W120", state.tokens.next, state.tokens.next.value);
          }
        }
        value = expression(prefix ? 120 : 10);
        if (lone) {
          tokens[0].first = value;
        } else {
          destructuringPatternMatch(names, value);
        }
      }

      if (state.tokens.next.id !== ",") {
        break;
      }
      comma();
    }

    return this;
  });
  varstatement.exps = true;

  blockstmt("class", function() {
    return classdef.call(this, true);
  });

  function classdef(isStatement) {
    if (!state.inES6()) {
      warning("W104", state.tokens.curr, "class", "6");
    }
    if (isStatement) {
      this.name = identifier();

      state.funct["(scope)"].addlabel(this.name, {
        type: "class",
        token: state.tokens.curr });
    } else if (state.tokens.next.identifier && state.tokens.next.value !== "extends") {
      this.name = identifier();
      this.namedExpr = true;
    } else {
      this.name = state.nameStack.infer();
    }
    classtail(this);
    return this;
  }

  function classtail(c) {
    var wasInClassBody = state.inClassBody;
    if (state.tokens.next.value === "extends") {
      advance("extends");
      c.heritage = expression(10);
    }

    state.inClassBody = true;
    advance("{");
    c.body = classbody(c);
    advance("}");
    state.inClassBody = wasInClassBody;
  }

  function classbody(c) {
    var name;
    var isStatic;
    var isGenerator;
    var getset;
    var props = Object.create(null);
    var staticProps = Object.create(null);
    var computed;
    for (var i = 0; state.tokens.next.id !== "}"; ++i) {
      name = state.tokens.next;
      isStatic = false;
      isGenerator = false;
      getset = null;
      if (name.id === ";") {
        warning("W032");
        advance(";");
        continue;
      }

      if (name.id === "*") {
        isGenerator = true;
        advance("*");
        name = state.tokens.next;
      }
      if (name.id === "[") {
        name = computedPropertyName();
        computed = true;
      } else if (isPropertyName(name)) {
        advance();
        computed = false;
        if (name.identifier && name.value === "static") {
          if (checkPunctuator(state.tokens.next, "*")) {
            isGenerator = true;
            advance("*");
          }
          if (isPropertyName(state.tokens.next) || state.tokens.next.id === "[") {
            computed = state.tokens.next.id === "[";
            isStatic = true;
            name = state.tokens.next;
            if (state.tokens.next.id === "[") {
              name = computedPropertyName();
            } else advance();
          }
        }

        if (name.identifier && (name.value === "get" || name.value === "set")) {
          if (isPropertyName(state.tokens.next) || state.tokens.next.id === "[") {
            computed = state.tokens.next.id === "[";
            getset = name;
            name = state.tokens.next;
            if (state.tokens.next.id === "[") {
              name = computedPropertyName();
            } else advance();
          }
        }
      } else {
        warning("W052", state.tokens.next, state.tokens.next.value || state.tokens.next.type);
        advance();
        continue;
      }

      if (!checkPunctuator(state.tokens.next, "(")) {
        error("E054", state.tokens.next, state.tokens.next.value);
        while (state.tokens.next.id !== "}" &&
               !checkPunctuator(state.tokens.next, "(")) {
          advance();
        }
        if (state.tokens.next.value !== "(") {
          doFunction({ statement: c });
        }
      }

      if (!computed) {
        if (getset) {
          saveAccessor(
            getset.value, isStatic ? staticProps : props, name.value, name, true, isStatic);
        } else {
          if (name.value === "constructor") {
            state.nameStack.set(c);
          } else {
            state.nameStack.set(name);
          }
          saveProperty(isStatic ? staticProps : props, name.value, name, true, isStatic);
        }
      }

      if (getset && name.value === "constructor") {
        var propDesc = getset.value === "get" ? "class getter method" : "class setter method";
        error("E049", name, propDesc, "constructor");
      } else if (name.value === "prototype") {
        error("E049", name, "class method", "prototype");
      }

      propertyName(name);

      doFunction({
        statement: c,
        type: isGenerator ? "generator" : null,
        classExprBinding: c.namedExpr ? c.name : null
      });
    }

    checkProperties(props);
  }

  blockstmt("function", function(context) {
    var inexport = context && context.inexport;
    var generator = false;
    if (state.tokens.next.value === "*") {
      advance("*");
      if (state.inES6({ strict: true })) {
        generator = true;
      } else {
        warning("W119", state.tokens.curr, "function*", "6");
      }
    }
    if (inblock) {
      warning("W082", state.tokens.curr);
    }
    var i = optionalidentifier();

    state.funct["(scope)"].addlabel(i, {
      type: "function",
      token: state.tokens.curr });

    if (i === undefined) {
      warning("W025");
    } else if (inexport) {
      state.funct["(scope)"].setExported(i, state.tokens.prev);
    }

    doFunction({
      name: i,
      statement: this,
      type: generator ? "generator" : null,
      ignoreLoopFunc: inblock // a declaration may already have warned
    });
    if (state.tokens.next.id === "(" && state.tokens.next.line === state.tokens.curr.line) {
      error("E039");
    }
    return this;
  });

  prefix("function", function() {
    var generator = false;

    if (state.tokens.next.value === "*") {
      if (!state.inES6()) {
        warning("W119", state.tokens.curr, "function*", "6");
      }
      advance("*");
      generator = true;
    }

    var i = optionalidentifier();
    doFunction({ name: i, type: generator ? "generator" : null });
    return this;
  });

  blockstmt("if", function() {
    var t = state.tokens.next;
    increaseComplexityCount();
    state.condition = true;
    advance("(");
    var expr = expression(0);
    checkCondAssignment(expr);
    var forinifcheck = null;
    if (state.option.forin && state.forinifcheckneeded) {
      state.forinifcheckneeded = false; // We only need to analyze the first if inside the loop
      forinifcheck = state.forinifchecks[state.forinifchecks.length - 1];
      if (expr.type === "(punctuator)" && expr.value === "!") {
        forinifcheck.type = "(negative)";
      } else {
        forinifcheck.type = "(positive)";
      }
    }

    advance(")", t);
    state.condition = false;
    var s = block(true, true);
    if (forinifcheck && forinifcheck.type === "(negative)") {
      if (s && s[0] && s[0].type === "(identifier)" && s[0].value === "continue") {
        forinifcheck.type = "(negative-with-continue)";
      }
    }

    if (state.tokens.next.id === "else") {
      advance("else");
      if (state.tokens.next.id === "if" || state.tokens.next.id === "switch") {
        statement();
      } else {
        block(true, true);
      }
    }
    return this;
  });

  blockstmt("try", function() {
    var b;

    function doCatch() {
      advance("catch");
      advance("(");

      state.funct["(scope)"].stack("catchparams");

      if (checkPunctuators(state.tokens.next, ["[", "{"])) {
        var tokens = destructuringPattern();
        _.each(tokens, function(token) {
          if (token.id) {
            state.funct["(scope)"].addParam(token.id, token, "exception");
          }
        });
      } else if (state.tokens.next.type !== "(identifier)") {
        warning("E030", state.tokens.next, state.tokens.next.value);
      } else {
        state.funct["(scope)"].addParam(identifier(), state.tokens.curr, "exception");
      }

      if (state.tokens.next.value === "if") {
        if (!state.inMoz()) {
          warning("W118", state.tokens.curr, "catch filter");
        }
        advance("if");
        expression(0);
      }

      advance(")");

      block(false);

      state.funct["(scope)"].unstack();
    }

    block(true);

    while (state.tokens.next.id === "catch") {
      increaseComplexityCount();
      if (b && (!state.inMoz())) {
        warning("W118", state.tokens.next, "multiple catch blocks");
      }
      doCatch();
      b = true;
    }

    if (state.tokens.next.id === "finally") {
      advance("finally");
      block(true);
      return;
    }

    if (!b) {
      error("E021", state.tokens.next, "catch", state.tokens.next.value);
    }

    return this;
  });

  blockstmt("while", function() {
    var t = state.tokens.next;
    state.funct["(breakage)"] += 1;
    state.funct["(loopage)"] += 1;
    increaseComplexityCount();
    advance("(");
    checkCondAssignment(expression(0));
    advance(")", t);
    block(true, true);
    state.funct["(breakage)"] -= 1;
    state.funct["(loopage)"] -= 1;
    return this;
  }).labelled = true;

  blockstmt("with", function() {
    var t = state.tokens.next;
    if (state.isStrict()) {
      error("E010", state.tokens.curr);
    } else if (!state.option.withstmt) {
      warning("W085", state.tokens.curr);
    }

    advance("(");
    expression(0);
    advance(")", t);
    block(true, true);

    return this;
  });

  blockstmt("switch", function() {
    var t = state.tokens.next;
    var g = false;
    var noindent = false;

    state.funct["(breakage)"] += 1;
    advance("(");
    checkCondAssignment(expression(0));
    advance(")", t);
    t = state.tokens.next;
    advance("{");

    if (state.tokens.next.from === indent)
      noindent = true;

    if (!noindent)
      indent += state.option.indent;

    this.cases = [];

    for (;;) {
      switch (state.tokens.next.id) {
      case "case":
        switch (state.funct["(verb)"]) {
        case "yield":
        case "break":
        case "case":
        case "continue":
        case "return":
        case "switch":
        case "throw":
          break;
        default:
          if (!state.tokens.curr.caseFallsThrough) {
            warning("W086", state.tokens.curr, "case");
          }
        }

        advance("case");
        this.cases.push(expression(0));
        increaseComplexityCount();
        g = true;
        advance(":");
        state.funct["(verb)"] = "case";
        break;
      case "default":
        switch (state.funct["(verb)"]) {
        case "yield":
        case "break":
        case "continue":
        case "return":
        case "throw":
          break;
        default:
          if (this.cases.length) {
            if (!state.tokens.curr.caseFallsThrough) {
              warning("W086", state.tokens.curr, "default");
            }
          }
        }

        advance("default");
        g = true;
        advance(":");
        break;
      case "}":
        if (!noindent)
          indent -= state.option.indent;

        advance("}", t);
        state.funct["(breakage)"] -= 1;
        state.funct["(verb)"] = undefined;
        return;
      case "(end)":
        error("E023", state.tokens.next, "}");
        return;
      default:
        indent += state.option.indent;
        if (g) {
          switch (state.tokens.curr.id) {
          case ",":
            error("E040");
            return;
          case ":":
            g = false;
            statements();
            break;
          default:
            error("E025", state.tokens.curr);
            return;
          }
        } else {
          if (state.tokens.curr.id === ":") {
            advance(":");
            error("E024", state.tokens.curr, ":");
            statements();
          } else {
            error("E021", state.tokens.next, "case", state.tokens.next.value);
            return;
          }
        }
        indent -= state.option.indent;
      }
    }
    return this;
  }).labelled = true;

  stmt("debugger", function() {
    if (!state.option.debug) {
      warning("W087", this);
    }
    return this;
  }).exps = true;

  (function() {
    var x = stmt("do", function() {
      state.funct["(breakage)"] += 1;
      state.funct["(loopage)"] += 1;
      increaseComplexityCount();

      this.first = block(true, true);
      advance("while");
      var t = state.tokens.next;
      advance("(");
      checkCondAssignment(expression(0));
      advance(")", t);
      state.funct["(breakage)"] -= 1;
      state.funct["(loopage)"] -= 1;
      return this;
    });
    x.labelled = true;
    x.exps = true;
  }());

  blockstmt("for", function() {
    var s, t = state.tokens.next;
    var letscope = false;
    var foreachtok = null;

    if (t.value === "each") {
      foreachtok = t;
      advance("each");
      if (!state.inMoz()) {
        warning("W118", state.tokens.curr, "for each");
      }
    }

    increaseComplexityCount();
    advance("(");
    var nextop; // contains the token of the "in" or "of" operator
    var i = 0;
    var inof = ["in", "of"];
    var level = 0; // BindingPattern "level" --- level 0 === no BindingPattern
    var comma; // First comma punctuator at level 0
    var initializer; // First initializer at level 0
    if (checkPunctuators(state.tokens.next, ["{", "["])) ++level;
    do {
      nextop = peek(i);
      ++i;
      if (checkPunctuators(nextop, ["{", "["])) ++level;
      else if (checkPunctuators(nextop, ["}", "]"])) --level;
      if (level < 0) break;
      if (level === 0) {
        if (!comma && checkPunctuator(nextop, ",")) comma = nextop;
        else if (!initializer && checkPunctuator(nextop, "=")) initializer = nextop;
      }
    } while (level > 0 || !_.contains(inof, nextop.value) && nextop.value !== ";" &&
    nextop.type !== "(end)"); // Is this a JSCS bug? This looks really weird.
    if (_.contains(inof, nextop.value)) {
      if (!state.inES6() && nextop.value === "of") {
        warning("W104", nextop, "for of", "6");
      }

      var ok = !(initializer || comma);
      if (initializer) {
        error("W133", comma, nextop.value, "initializer is forbidden");
      }

      if (comma) {
        error("W133", comma, nextop.value, "more than one ForBinding");
      }

      if (state.tokens.next.id === "var") {
        advance("var");
        state.tokens.curr.fud({ prefix: true });
      } else if (state.tokens.next.id === "let" || state.tokens.next.id === "const") {
        advance(state.tokens.next.id);
        letscope = true;
        state.funct["(scope)"].stack();
        state.tokens.curr.fud({ prefix: true });
      } else {
        Object.create(varstatement).fud({ prefix: true, implied: "for", ignore: !ok });
      }
      advance(nextop.value);
      expression(20);
      advance(")", t);

      if (nextop.value === "in" && state.option.forin) {
        state.forinifcheckneeded = true;

        if (state.forinifchecks === undefined) {
          state.forinifchecks = [];
        }
        state.forinifchecks.push({
          type: "(none)"
        });
      }

      state.funct["(breakage)"] += 1;
      state.funct["(loopage)"] += 1;

      s = block(true, true);

      if (nextop.value === "in" && state.option.forin) {
        if (state.forinifchecks && state.forinifchecks.length > 0) {
          var check = state.forinifchecks.pop();

          if (// No if statement or not the first statement in loop body
              s && s.length > 0 && (typeof s[0] !== "object" || s[0].value !== "if") ||
              check.type === "(positive)" && s.length > 1 ||
              check.type === "(negative)") {
            warning("W089", this);
          }
        }
        state.forinifcheckneeded = false;
      }

      state.funct["(breakage)"] -= 1;
      state.funct["(loopage)"] -= 1;
    } else {
      if (foreachtok) {
        error("E045", foreachtok);
      }
      if (state.tokens.next.id !== ";") {
        if (state.tokens.next.id === "var") {
          advance("var");
          state.tokens.curr.fud();
        } else if (state.tokens.next.id === "let") {
          advance("let");
          letscope = true;
          state.funct["(scope)"].stack();
          state.tokens.curr.fud();
        } else {
          for (;;) {
            expression(0, "for");
            if (state.tokens.next.id !== ",") {
              break;
            }
            comma();
          }
        }
      }
      nolinebreak(state.tokens.curr);
      advance(";");
      state.funct["(loopage)"] += 1;
      if (state.tokens.next.id !== ";") {
        checkCondAssignment(expression(0));
      }
      nolinebreak(state.tokens.curr);
      advance(";");
      if (state.tokens.next.id === ";") {
        error("E021", state.tokens.next, ")", ";");
      }
      if (state.tokens.next.id !== ")") {
        for (;;) {
          expression(0, "for");
          if (state.tokens.next.id !== ",") {
            break;
          }
          comma();
        }
      }
      advance(")", t);
      state.funct["(breakage)"] += 1;
      block(true, true);
      state.funct["(breakage)"] -= 1;
      state.funct["(loopage)"] -= 1;

    }
    if (letscope) {
      state.funct["(scope)"].unstack();
    }
    return this;
  }).labelled = true;


  stmt("break", function() {
    var v = state.tokens.next.value;

    if (!state.option.asi)
      nolinebreak(this);

    if (state.tokens.next.id !== ";" && !state.tokens.next.reach &&
        state.tokens.curr.line === startLine(state.tokens.next)) {
      if (!state.funct["(scope)"].funct.hasBreakLabel(v)) {
        warning("W090", state.tokens.next, v);
      }
      this.first = state.tokens.next;
      advance();
    } else {
      if (state.funct["(breakage)"] === 0)
        warning("W052", state.tokens.next, this.value);
    }

    reachable(this);

    return this;
  }).exps = true;


  stmt("continue", function() {
    var v = state.tokens.next.value;

    if (state.funct["(breakage)"] === 0)
      warning("W052", state.tokens.next, this.value);
    if (!state.funct["(loopage)"])
      warning("W052", state.tokens.next, this.value);

    if (!state.option.asi)
      nolinebreak(this);

    if (state.tokens.next.id !== ";" && !state.tokens.next.reach) {
      if (state.tokens.curr.line === startLine(state.tokens.next)) {
        if (!state.funct["(scope)"].funct.hasBreakLabel(v)) {
          warning("W090", state.tokens.next, v);
        }
        this.first = state.tokens.next;
        advance();
      }
    }

    reachable(this);

    return this;
  }).exps = true;


  stmt("return", function() {
    if (this.line === startLine(state.tokens.next)) {
      if (state.tokens.next.id !== ";" && !state.tokens.next.reach) {
        this.first = expression(0);

        if (this.first &&
            this.first.type === "(punctuator)" && this.first.value === "=" &&
            !this.first.paren && !state.option.boss) {
          warningAt("W093", this.first.line, this.first.character);
        }
      }
    } else {
      if (state.tokens.next.type === "(punctuator)" &&
        ["[", "{", "+", "-"].indexOf(state.tokens.next.value) > -1) {
        nolinebreak(this); // always warn (Line breaking error)
      }
    }

    reachable(this);

    return this;
  }).exps = true;

  (function(x) {
    x.exps = true;
    x.lbp = 25;
  }(prefix("yield", function() {
    var prev = state.tokens.prev;
    if (state.inES6(true) && !state.funct["(generator)"]) {
      if (!("(catch)" === state.funct["(name)"] && state.funct["(context)"]["(generator)"])) {
        error("E046", state.tokens.curr, "yield");
      }
    } else if (!state.inES6()) {
      warning("W104", state.tokens.curr, "yield", "6");
    }
    state.funct["(generator)"] = "yielded";
    var delegatingYield = false;

    if (state.tokens.next.value === "*") {
      delegatingYield = true;
      advance("*");
    }

    if (this.line === startLine(state.tokens.next) || !state.inMoz()) {
      if (delegatingYield ||
          (state.tokens.next.id !== ";" && !state.option.asi &&
           !state.tokens.next.reach && state.tokens.next.nud)) {

        nobreaknonadjacent(state.tokens.curr, state.tokens.next);
        this.first = expression(10);

        if (this.first.type === "(punctuator)" && this.first.value === "=" &&
            !this.first.paren && !state.option.boss) {
          warningAt("W093", this.first.line, this.first.character);
        }
      }

      if (state.inMoz() && state.tokens.next.id !== ")" &&
          (prev.lbp > 30 || (!prev.assign && !isEndOfExpr()) || prev.id === "yield")) {
        error("E050", this);
      }
    } else if (!state.option.asi) {
      nolinebreak(this); // always warn (Line breaking error)
    }
    return this;
  })));


  stmt("throw", function() {
    nolinebreak(this);
    this.first = expression(20);

    reachable(this);

    return this;
  }).exps = true;

  stmt("import", function() {
    if (!state.inES6()) {
      warning("W119", state.tokens.curr, "import", "6");
    }

    if (state.tokens.next.type === "(string)") {
      advance("(string)");
      return this;
    }

    if (state.tokens.next.identifier) {
      this.name = identifier();
      state.funct["(scope)"].addlabel(this.name, {
        type: "const",
        token: state.tokens.curr });

      if (state.tokens.next.value === ",") {
        advance(",");
      } else {
        advance("from");
        advance("(string)");
        return this;
      }
    }

    if (state.tokens.next.id === "*") {
      advance("*");
      advance("as");
      if (state.tokens.next.identifier) {
        this.name = identifier();
        state.funct["(scope)"].addlabel(this.name, {
          type: "const",
          token: state.tokens.curr });
      }
    } else {
      advance("{");
      for (;;) {
        if (state.tokens.next.value === "}") {
          advance("}");
          break;
        }
        var importName;
        if (state.tokens.next.type === "default") {
          importName = "default";
          advance("default");
        } else {
          importName = identifier();
        }
        if (state.tokens.next.value === "as") {
          advance("as");
          importName = identifier();
        }
        state.funct["(scope)"].addlabel(importName, {
          type: "const",
          token: state.tokens.curr });

        if (state.tokens.next.value === ",") {
          advance(",");
        } else if (state.tokens.next.value === "}") {
          advance("}");
          break;
        } else {
          error("E024", state.tokens.next, state.tokens.next.value);
          break;
        }
      }
    }
    advance("from");
    advance("(string)");
    return this;
  }).exps = true;

  stmt("export", function() {
    var ok = true;
    var token;
    var identifier;

    if (!state.inES6()) {
      warning("W119", state.tokens.curr, "export", "6");
      ok = false;
    }

    if (!state.funct["(scope)"].block.isGlobal()) {
      error("E053", state.tokens.curr);
      ok = false;
    }

    if (state.tokens.next.value === "*") {
      advance("*");
      advance("from");
      advance("(string)");
      return this;
    }

    if (state.tokens.next.type === "default") {
      state.nameStack.set(state.tokens.next);
      advance("default");
      var exportType = state.tokens.next.id;
      if (exportType === "function" || exportType === "class") {
        this.block = true;
      }

      token = peek();

      expression(10);

      identifier = token.value;

      if (this.block) {
        state.funct["(scope)"].addlabel(identifier, {
          type: exportType,
          token: token });

        state.funct["(scope)"].setExported(identifier, token);
      }

      return this;
    }

    if (state.tokens.next.value === "{") {
      advance("{");
      var exportedTokens = [];
      for (;;) {
        if (!state.tokens.next.identifier) {
          error("E030", state.tokens.next, state.tokens.next.value);
        }
        advance();

        exportedTokens.push(state.tokens.curr);

        if (state.tokens.next.value === "as") {
          advance("as");
          if (!state.tokens.next.identifier) {
            error("E030", state.tokens.next, state.tokens.next.value);
          }
          advance();
        }

        if (state.tokens.next.value === ",") {
          advance(",");
        } else if (state.tokens.next.value === "}") {
          advance("}");
          break;
        } else {
          error("E024", state.tokens.next, state.tokens.next.value);
          break;
        }
      }
      if (state.tokens.next.value === "from") {
        advance("from");
        advance("(string)");
      } else if (ok) {
        exportedTokens.forEach(function(token) {
          state.funct["(scope)"].setExported(token.value, token);
        });
      }
      return this;
    }

    if (state.tokens.next.id === "var") {
      advance("var");
      state.tokens.curr.fud({ inexport:true });
    } else if (state.tokens.next.id === "let") {
      advance("let");
      state.tokens.curr.fud({ inexport:true });
    } else if (state.tokens.next.id === "const") {
      advance("const");
      state.tokens.curr.fud({ inexport:true });
    } else if (state.tokens.next.id === "function") {
      this.block = true;
      advance("function");
      state.syntax["function"].fud({ inexport:true });
    } else if (state.tokens.next.id === "class") {
      this.block = true;
      advance("class");
      var classNameToken = state.tokens.next;
      state.syntax["class"].fud();
      state.funct["(scope)"].setExported(classNameToken.value, classNameToken);
    } else {
      error("E024", state.tokens.next, state.tokens.next.value);
    }

    return this;
  }).exps = true;

  FutureReservedWord("abstract");
  FutureReservedWord("boolean");
  FutureReservedWord("byte");
  FutureReservedWord("char");
  FutureReservedWord("class", { es5: true, nud: classdef });
  FutureReservedWord("double");
  FutureReservedWord("enum", { es5: true });
  FutureReservedWord("export", { es5: true });
  FutureReservedWord("extends", { es5: true });
  FutureReservedWord("final");
  FutureReservedWord("float");
  FutureReservedWord("goto");
  FutureReservedWord("implements", { es5: true, strictOnly: true });
  FutureReservedWord("import", { es5: true });
  FutureReservedWord("int");
  FutureReservedWord("interface", { es5: true, strictOnly: true });
  FutureReservedWord("long");
  FutureReservedWord("native");
  FutureReservedWord("package", { es5: true, strictOnly: true });
  FutureReservedWord("private", { es5: true, strictOnly: true });
  FutureReservedWord("protected", { es5: true, strictOnly: true });
  FutureReservedWord("public", { es5: true, strictOnly: true });
  FutureReservedWord("short");
  FutureReservedWord("static", { es5: true, strictOnly: true });
  FutureReservedWord("super", { es5: true });
  FutureReservedWord("synchronized");
  FutureReservedWord("transient");
  FutureReservedWord("volatile");

  var lookupBlockType = function() {
    var pn, pn1, prev;
    var i = -1;
    var bracketStack = 0;
    var ret = {};
    if (checkPunctuators(state.tokens.curr, ["[", "{"])) {
      bracketStack += 1;
    }
    do {
      prev = i === -1 ? state.tokens.curr : pn;
      pn = i === -1 ? state.tokens.next : peek(i);
      pn1 = peek(i + 1);
      i = i + 1;
      if (checkPunctuators(pn, ["[", "{"])) {
        bracketStack += 1;
      } else if (checkPunctuators(pn, ["]", "}"])) {
        bracketStack -= 1;
      }
      if (bracketStack === 1 && pn.identifier && pn.value === "for" &&
          !checkPunctuator(prev, ".")) {
        ret.isCompArray = true;
        ret.notJson = true;
        break;
      }
      if (bracketStack === 0 && checkPunctuators(pn, ["}", "]"])) {
        if (pn1.value === "=") {
          ret.isDestAssign = true;
          ret.notJson = true;
          break;
        } else if (pn1.value === ".") {
          ret.notJson = true;
          break;
        }
      }
      if (checkPunctuator(pn, ";")) {
        ret.isBlock = true;
        ret.notJson = true;
      }
    } while (bracketStack > 0 && pn.id !== "(end)");
    return ret;
  };

  function saveProperty(props, name, tkn, isClass, isStatic) {
    var msg = ["key", "class method", "static class method"];
    msg = msg[(isClass || false) + (isStatic || false)];
    if (tkn.identifier) {
      name = tkn.value;
    }

    if (props[name] && name !== "__proto__") {
      warning("W075", state.tokens.next, msg, name);
    } else {
      props[name] = Object.create(null);
    }

    props[name].basic = true;
    props[name].basictkn = tkn;
  }
  function saveAccessor(accessorType, props, name, tkn, isClass, isStatic) {
    var flagName = accessorType === "get" ? "getterToken" : "setterToken";
    var msg = "";

    if (isClass) {
      if (isStatic) {
        msg += "static ";
      }
      msg += accessorType + "ter method";
    } else {
      msg = "key";
    }

    state.tokens.curr.accessorType = accessorType;
    state.nameStack.set(tkn);

    if (props[name]) {
      if ((props[name].basic || props[name][flagName]) && name !== "__proto__") {
        warning("W075", state.tokens.next, msg, name);
      }
    } else {
      props[name] = Object.create(null);
    }

    props[name][flagName] = tkn;
  }

  function computedPropertyName() {
    advance("[");
    if (!state.inES6()) {
      warning("W119", state.tokens.curr, "computed property names", "6");
    }
    var value = expression(10);
    advance("]");
    return value;
  }
  function checkPunctuators(token, values) {
    if (token.type === "(punctuator)") {
      return _.contains(values, token.value);
    }
    return false;
  }
  function checkPunctuator(token, value) {
    return token.type === "(punctuator)" && token.value === value;
  }
  function destructuringAssignOrJsonValue() {

    var block = lookupBlockType();
    if (block.notJson) {
      if (!state.inES6() && block.isDestAssign) {
        warning("W104", state.tokens.curr, "destructuring assignment", "6");
      }
      statements();
    } else {
      state.option.laxbreak = true;
      state.jsonMode = true;
      jsonValue();
    }
  }

  var arrayComprehension = function() {
    var CompArray = function() {
      this.mode = "use";
      this.variables = [];
    };
    var _carrays = [];
    var _current;
    function declare(v) {
      var l = _current.variables.filter(function(elt) {
        if (elt.value === v) {
          elt.undef = false;
          return v;
        }
      }).length;
      return l !== 0;
    }
    function use(v) {
      var l = _current.variables.filter(function(elt) {
        if (elt.value === v && !elt.undef) {
          if (elt.unused === true) {
            elt.unused = false;
          }
          return v;
        }
      }).length;
      return (l === 0);
    }
    return { stack: function() {
          _current = new CompArray();
          _carrays.push(_current);
        },
        unstack: function() {
          _current.variables.filter(function(v) {
            if (v.unused)
              warning("W098", v.token, v.raw_text || v.value);
            if (v.undef)
              state.funct["(scope)"].block.use(v.value, v.token);
          });
          _carrays.splice(-1, 1);
          _current = _carrays[_carrays.length - 1];
        },
        setState: function(s) {
          if (_.contains(["use", "define", "generate", "filter"], s))
            _current.mode = s;
        },
        check: function(v) {
          if (!_current) {
            return;
          }
          if (_current && _current.mode === "use") {
            if (use(v)) {
              _current.variables.push({
                funct: state.funct,
                token: state.tokens.curr,
                value: v,
                undef: true,
                unused: false
              });
            }
            return true;
          } else if (_current && _current.mode === "define") {
            if (!declare(v)) {
              _current.variables.push({
                funct: state.funct,
                token: state.tokens.curr,
                value: v,
                undef: false,
                unused: true
              });
            }
            return true;
          } else if (_current && _current.mode === "generate") {
            state.funct["(scope)"].block.use(v, state.tokens.curr);
            return true;
          } else if (_current && _current.mode === "filter") {
            if (use(v)) {
              state.funct["(scope)"].block.use(v, state.tokens.curr);
            }
            return true;
          }
          return false;
        }
        };
  };

  function jsonValue() {
    function jsonObject() {
      var o = {}, t = state.tokens.next;
      advance("{");
      if (state.tokens.next.id !== "}") {
        for (;;) {
          if (state.tokens.next.id === "(end)") {
            error("E026", state.tokens.next, t.line);
          } else if (state.tokens.next.id === "}") {
            warning("W094", state.tokens.curr);
            break;
          } else if (state.tokens.next.id === ",") {
            error("E028", state.tokens.next);
          } else if (state.tokens.next.id !== "(string)") {
            warning("W095", state.tokens.next, state.tokens.next.value);
          }
          if (o[state.tokens.next.value] === true) {
            warning("W075", state.tokens.next, "key", state.tokens.next.value);
          } else if ((state.tokens.next.value === "__proto__" &&
            !state.option.proto) || (state.tokens.next.value === "__iterator__" &&
            !state.option.iterator)) {
            warning("W096", state.tokens.next, state.tokens.next.value);
          } else {
            o[state.tokens.next.value] = true;
          }
          advance();
          advance(":");
          jsonValue();
          if (state.tokens.next.id !== ",") {
            break;
          }
          advance(",");
        }
      }
      advance("}");
    }

    function jsonArray() {
      var t = state.tokens.next;
      advance("[");
      if (state.tokens.next.id !== "]") {
        for (;;) {
          if (state.tokens.next.id === "(end)") {
            error("E027", state.tokens.next, t.line);
          } else if (state.tokens.next.id === "]") {
            warning("W094", state.tokens.curr);
            break;
          } else if (state.tokens.next.id === ",") {
            error("E028", state.tokens.next);
          }
          jsonValue();
          if (state.tokens.next.id !== ",") {
            break;
          }
          advance(",");
        }
      }
      advance("]");
    }

    switch (state.tokens.next.id) {
    case "{":
      jsonObject();
      break;
    case "[":
      jsonArray();
      break;
    case "true":
    case "false":
    case "null":
    case "(number)":
    case "(string)":
      advance();
      break;
    case "-":
      advance("-");
      advance("(number)");
      break;
    default:
      error("E003", state.tokens.next);
    }
  }

  var escapeRegex = function(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  };
  var itself = function(s, o, g) {
    var i, k, x, reIgnoreStr, reIgnore;
    var optionKeys;
    var newOptionObj = {};
    var newIgnoredObj = {};

    o = _.clone(o);
    state.reset();

    if (o && o.scope) {
      JSHINT.scope = o.scope;
    } else {
      JSHINT.errors = [];
      JSHINT.undefs = [];
      JSHINT.internals = [];
      JSHINT.blacklist = {};
      JSHINT.scope = "(main)";
    }

    predefined = Object.create(null);
    combine(predefined, vars.ecmaIdentifiers[3]);
    combine(predefined, vars.reservedVars);

    combine(predefined, g || {});

    declared = Object.create(null);
    var exported = Object.create(null); // Variables that live outside the current file

    function each(obj, cb) {
      if (!obj)
        return;

      if (!Array.isArray(obj) && typeof obj === "object")
        obj = Object.keys(obj);

      obj.forEach(cb);
    }

    if (o) {
      each(o.predef || null, function(item) {
        var slice, prop;

        if (item[0] === "-") {
          slice = item.slice(1);
          JSHINT.blacklist[slice] = slice;
          delete predefined[slice];
        } else {
          prop = Object.getOwnPropertyDescriptor(o.predef, item);
          predefined[item] = prop ? prop.value : false;
        }
      });

      each(o.exported || null, function(item) {
        exported[item] = true;
      });

      delete o.predef;
      delete o.exported;

      optionKeys = Object.keys(o);
      for (x = 0; x < optionKeys.length; x++) {
        if (/^-W\d{3}$/g.test(optionKeys[x])) {
          newIgnoredObj[optionKeys[x].slice(1)] = true;
        } else {
          var optionKey = optionKeys[x];
          newOptionObj[optionKey] = o[optionKey];
          if ((optionKey === "esversion" && o[optionKey] === 5) ||
              (optionKey === "es5" && o[optionKey])) {
            warning("I003");
          }

          if (optionKeys[x] === "newcap" && o[optionKey] === false)
            newOptionObj["(explicitNewcap)"] = true;
        }
      }
    }

    state.option = newOptionObj;
    state.ignored = newIgnoredObj;

    state.option.indent = state.option.indent || 4;
    state.option.maxerr = state.option.maxerr || 50;

    indent = 1;

    var scopeManagerInst = scopeManager(state, predefined, exported, declared);
    scopeManagerInst.on("warning", function(ev) {
      warning.apply(null, [ ev.code, ev.token].concat(ev.data));
    });

    scopeManagerInst.on("error", function(ev) {
      error.apply(null, [ ev.code, ev.token ].concat(ev.data));
    });

    state.funct = functor("(global)", null, {
      "(global)"    : true,
      "(scope)"     : scopeManagerInst,
      "(comparray)" : arrayComprehension(),
      "(metrics)"   : createMetrics(state.tokens.next)
    });

    functions = [state.funct];
    urls = [];
    stack = null;
    member = {};
    membersOnly = null;
    inblock = false;
    lookahead = [];

    if (!isString(s) && !Array.isArray(s)) {
      errorAt("E004", 0);
      return false;
    }

    api = {
      get isJSON() {
        return state.jsonMode;
      },

      getOption: function(name) {
        return state.option[name] || null;
      },

      getCache: function(name) {
        return state.cache[name];
      },

      setCache: function(name, value) {
        state.cache[name] = value;
      },

      warn: function(code, data) {
        warningAt.apply(null, [ code, data.line, data.char ].concat(data.data));
      },

      on: function(names, listener) {
        names.split(" ").forEach(function(name) {
          emitter.on(name, listener);
        }.bind(this));
      }
    };

    emitter.removeAllListeners();
    (extraModules || []).forEach(function(func) {
      func(api);
    });

    state.tokens.prev = state.tokens.curr = state.tokens.next = state.syntax["(begin)"];

    if (o && o.ignoreDelimiters) {

      if (!Array.isArray(o.ignoreDelimiters)) {
        o.ignoreDelimiters = [o.ignoreDelimiters];
      }

      o.ignoreDelimiters.forEach(function(delimiterPair) {
        if (!delimiterPair.start || !delimiterPair.end)
            return;

        reIgnoreStr = escapeRegex(delimiterPair.start) +
                      "[\\s\\S]*?" +
                      escapeRegex(delimiterPair.end);

        reIgnore = new RegExp(reIgnoreStr, "ig");

        s = s.replace(reIgnore, function(match) {
          return match.replace(/./g, " ");
        });
      });
    }

    lex = new Lexer(s);

    lex.on("warning", function(ev) {
      warningAt.apply(null, [ ev.code, ev.line, ev.character].concat(ev.data));
    });

    lex.on("error", function(ev) {
      errorAt.apply(null, [ ev.code, ev.line, ev.character ].concat(ev.data));
    });

    lex.on("fatal", function(ev) {
      quit("E041", ev.line, ev.from);
    });

    lex.on("Identifier", function(ev) {
      emitter.emit("Identifier", ev);
    });

    lex.on("String", function(ev) {
      emitter.emit("String", ev);
    });

    lex.on("Number", function(ev) {
      emitter.emit("Number", ev);
    });

    lex.start();
    for (var name in o) {
      if (_.has(o, name)) {
        checkOption(name, state.tokens.curr);
      }
    }

    assume();
    combine(predefined, g || {});
    comma.first = true;

    try {
      advance();
      switch (state.tokens.next.id) {
      case "{":
      case "[":
        destructuringAssignOrJsonValue();
        break;
      default:
        directives();

        if (state.directive["use strict"]) {
          if (state.option.strict !== "global") {
            warning("W097", state.tokens.prev);
          }
        }

        statements();
      }

      if (state.tokens.next.id !== "(end)") {
        quit("E041", state.tokens.curr.line);
      }

      state.funct["(scope)"].unstack();

    } catch (err) {
      if (err && err.name === "JSHintError") {
        var nt = state.tokens.next || {};
        JSHINT.errors.push({
          scope     : "(main)",
          raw       : err.raw,
          code      : err.code,
          reason    : err.message,
          line      : err.line || nt.line,
          character : err.character || nt.from
        }, null);
      } else {
        throw err;
      }
    }

    if (JSHINT.scope === "(main)") {
      o = o || {};

      for (i = 0; i < JSHINT.internals.length; i += 1) {
        k = JSHINT.internals[i];
        o.scope = k.elem;
        itself(k.value, o, g);
      }
    }

    return JSHINT.errors.length === 0;
  };
  itself.addModule = function(func) {
    extraModules.push(func);
  };

  itself.addModule(style.register);
  itself.data = function() {
    var data = {
      functions: [],
      options: state.option
    };

    var fu, f, i, j, n, globals;

    if (itself.errors.length) {
      data.errors = itself.errors;
    }

    if (state.jsonMode) {
      data.json = true;
    }

    var impliedGlobals = state.funct["(scope)"].getImpliedGlobals();
    if (impliedGlobals.length > 0) {
      data.implieds = impliedGlobals;
    }

    if (urls.length > 0) {
      data.urls = urls;
    }

    globals = state.funct["(scope)"].getUsedOrDefinedGlobals();
    if (globals.length > 0) {
      data.globals = globals;
    }

    for (i = 1; i < functions.length; i += 1) {
      f = functions[i];
      fu = {};

      for (j = 0; j < functionicity.length; j += 1) {
        fu[functionicity[j]] = [];
      }

      for (j = 0; j < functionicity.length; j += 1) {
        if (fu[functionicity[j]].length === 0) {
          delete fu[functionicity[j]];
        }
      }

      fu.name = f["(name)"];
      fu.param = f["(params)"];
      fu.line = f["(line)"];
      fu.character = f["(character)"];
      fu.last = f["(last)"];
      fu.lastcharacter = f["(lastcharacter)"];

      fu.metrics = {
        complexity: f["(metrics)"].ComplexityCount,
        parameters: f["(metrics)"].arity,
        statements: f["(metrics)"].statementCount
      };

      data.functions.push(fu);
    }

    var unuseds = state.funct["(scope)"].getUnuseds();
    if (unuseds.length > 0) {
      data.unused = unuseds;
    }

    for (n in member) {
      if (typeof member[n] === "number") {
        data.member = member;
        break;
      }
    }

    return data;
  };

  itself.jshint = itself;

  return itself;
}());
if (typeof exports === "object" && exports) {
  exports.JSHINT = JSHINT;
}

},{"../lodash":"/node_modules/jshint/lodash.js","./lex.js":"/node_modules/jshint/src/lex.js","./messages.js":"/node_modules/jshint/src/messages.js","./options.js":"/node_modules/jshint/src/options.js","./reg.js":"/node_modules/jshint/src/reg.js","./scope-manager.js":"/node_modules/jshint/src/scope-manager.js","./state.js":"/node_modules/jshint/src/state.js","./style.js":"/node_modules/jshint/src/style.js","./vars.js":"/node_modules/jshint/src/vars.js","events":"/node_modules/browserify/node_modules/events/events.js"}],"/node_modules/jshint/src/lex.js":[function(_dereq_,module,exports){

"use strict";

var _      = _dereq_("../lodash");
var events = _dereq_("events");
var reg    = _dereq_("./reg.js");
var state  = _dereq_("./state.js").state;

var unicodeData = _dereq_("../data/ascii-identifier-data.js");
var asciiIdentifierStartTable = unicodeData.asciiIdentifierStartTable;
var asciiIdentifierPartTable = unicodeData.asciiIdentifierPartTable;

var Token = {
  Identifier: 1,
  Punctuator: 2,
  NumericLiteral: 3,
  StringLiteral: 4,
  Comment: 5,
  Keyword: 6,
  NullLiteral: 7,
  BooleanLiteral: 8,
  RegExp: 9,
  TemplateHead: 10,
  TemplateMiddle: 11,
  TemplateTail: 12,
  NoSubstTemplate: 13
};

var Context = {
  Block: 1,
  Template: 2
};

function asyncTrigger() {
  var _checks = [];

  return {
    push: function(fn) {
      _checks.push(fn);
    },

    check: function() {
      for (var check = 0; check < _checks.length; ++check) {
        _checks[check]();
      }

      _checks.splice(0, _checks.length);
    }
  };
}
function Lexer(source) {
  var lines = source;

  if (typeof lines === "string") {
    lines = lines
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n");
  }

  if (lines[0] && lines[0].substr(0, 2) === "#!") {
    if (lines[0].indexOf("node") !== -1) {
      state.option.node = true;
    }
    lines[0] = "";
  }

  this.emitter = new events.EventEmitter();
  this.source = source;
  this.setLines(lines);
  this.prereg = true;

  this.line = 0;
  this.char = 1;
  this.from = 1;
  this.input = "";
  this.inComment = false;
  this.context = [];
  this.templateStarts = [];

  for (var i = 0; i < state.option.indent; i += 1) {
    state.tab += " ";
  }
  this.ignoreLinterErrors = false;
}

Lexer.prototype = {
  _lines: [],

  inContext: function(ctxType) {
    return this.context.length > 0 && this.context[this.context.length - 1].type === ctxType;
  },

  pushContext: function(ctxType) {
    this.context.push({ type: ctxType });
  },

  popContext: function() {
    return this.context.pop();
  },

  isContext: function(context) {
    return this.context.length > 0 && this.context[this.context.length - 1] === context;
  },

  currentContext: function() {
    return this.context.length > 0 && this.context[this.context.length - 1];
  },

  getLines: function() {
    this._lines = state.lines;
    return this._lines;
  },

  setLines: function(val) {
    this._lines = val;
    state.lines = this._lines;
  },
  peek: function(i) {
    return this.input.charAt(i || 0);
  },
  skip: function(i) {
    i = i || 1;
    this.char += i;
    this.input = this.input.slice(i);
  },
  on: function(names, listener) {
    names.split(" ").forEach(function(name) {
      this.emitter.on(name, listener);
    }.bind(this));
  },
  trigger: function() {
    this.emitter.emit.apply(this.emitter, Array.prototype.slice.call(arguments));
  },
  triggerAsync: function(type, args, checks, fn) {
    checks.push(function() {
      if (fn()) {
        this.trigger(type, args);
      }
    }.bind(this));
  },
  scanPunctuator: function() {
    var ch1 = this.peek();
    var ch2, ch3, ch4;

    switch (ch1) {
    case ".":
      if ((/^[0-9]$/).test(this.peek(1))) {
        return null;
      }
      if (this.peek(1) === "." && this.peek(2) === ".") {
        return {
          type: Token.Punctuator,
          value: "..."
        };
      }
    case "(":
    case ")":
    case ";":
    case ",":
    case "[":
    case "]":
    case ":":
    case "~":
    case "?":
      return {
        type: Token.Punctuator,
        value: ch1
      };
    case "{":
      this.pushContext(Context.Block);
      return {
        type: Token.Punctuator,
        value: ch1
      };
    case "}":
      if (this.inContext(Context.Block)) {
        this.popContext();
      }
      return {
        type: Token.Punctuator,
        value: ch1
      };
    case "#":
      return {
        type: Token.Punctuator,
        value: ch1
      };
    case "":
      return null;
    }

    ch2 = this.peek(1);
    ch3 = this.peek(2);
    ch4 = this.peek(3);

    if (ch1 === ">" && ch2 === ">" && ch3 === ">" && ch4 === "=") {
      return {
        type: Token.Punctuator,
        value: ">>>="
      };
    }

    if (ch1 === "=" && ch2 === "=" && ch3 === "=") {
      return {
        type: Token.Punctuator,
        value: "==="
      };
    }

    if (ch1 === "!" && ch2 === "=" && ch3 === "=") {
      return {
        type: Token.Punctuator,
        value: "!=="
      };
    }

    if (ch1 === ">" && ch2 === ">" && ch3 === ">") {
      return {
        type: Token.Punctuator,
        value: ">>>"
      };
    }

    if (ch1 === "<" && ch2 === "<" && ch3 === "=") {
      return {
        type: Token.Punctuator,
        value: "<<="
      };
    }

    if (ch1 === ">" && ch2 === ">" && ch3 === "=") {
      return {
        type: Token.Punctuator,
        value: ">>="
      };
    }
    if (ch1 === "=" && ch2 === ">") {
      return {
        type: Token.Punctuator,
        value: ch1 + ch2
      };
    }
    if (ch1 === ch2 && ("+-<>&|".indexOf(ch1) >= 0)) {
      return {
        type: Token.Punctuator,
        value: ch1 + ch2
      };
    }

    if ("<>=!+-*%&|^".indexOf(ch1) >= 0) {
      if (ch2 === "=") {
        return {
          type: Token.Punctuator,
          value: ch1 + ch2
        };
      }

      return {
        type: Token.Punctuator,
        value: ch1
      };
    }

    if (ch1 === "/") {
      if (ch2 === "=") {
        return {
          type: Token.Punctuator,
          value: "/="
        };
      }

      return {
        type: Token.Punctuator,
        value: "/"
      };
    }

    return null;
  },
  scanComments: function() {
    var ch1 = this.peek();
    var ch2 = this.peek(1);
    var rest = this.input.substr(2);
    var startLine = this.line;
    var startChar = this.char;
    var self = this;

    function commentToken(label, body, opt) {
      var special = ["jshint", "jslint", "members", "member", "globals", "global", "exported"];
      var isSpecial = false;
      var value = label + body;
      var commentType = "plain";
      opt = opt || {};

      if (opt.isMultiline) {
        value += "*/";
      }

      body = body.replace(/\n/g, " ");

      if (label === "/*" && reg.fallsThrough.test(body)) {
        isSpecial = true;
        commentType = "falls through";
      }

      special.forEach(function(str) {
        if (isSpecial) {
          return;
        }
        if (label === "//" && str !== "jshint") {
          return;
        }

        if (body.charAt(str.length) === " " && body.substr(0, str.length) === str) {
          isSpecial = true;
          label = label + str;
          body = body.substr(str.length);
        }

        if (!isSpecial && body.charAt(0) === " " && body.charAt(str.length + 1) === " " &&
          body.substr(1, str.length) === str) {
          isSpecial = true;
          label = label + " " + str;
          body = body.substr(str.length + 1);
        }

        if (!isSpecial) {
          return;
        }

        switch (str) {
        case "member":
          commentType = "members";
          break;
        case "global":
          commentType = "globals";
          break;
        default:
          var options = body.split(":").map(function(v) {
            return v.replace(/^\s+/, "").replace(/\s+$/, "");
          });

          if (options.length === 2) {
            switch (options[0]) {
            case "ignore":
              switch (options[1]) {
              case "start":
                self.ignoringLinterErrors = true;
                isSpecial = false;
                break;
              case "end":
                self.ignoringLinterErrors = false;
                isSpecial = false;
                break;
              }
            }
          }

          commentType = str;
        }
      });

      return {
        type: Token.Comment,
        commentType: commentType,
        value: value,
        body: body,
        isSpecial: isSpecial,
        isMultiline: opt.isMultiline || false,
        isMalformed: opt.isMalformed || false
      };
    }
    if (ch1 === "*" && ch2 === "/") {
      this.trigger("error", {
        code: "E018",
        line: startLine,
        character: startChar
      });

      this.skip(2);
      return null;
    }
    if (ch1 !== "/" || (ch2 !== "*" && ch2 !== "/")) {
      return null;
    }
    if (ch2 === "/") {
      this.skip(this.input.length); // Skip to the EOL.
      return commentToken("//", rest);
    }

    var body = "";
    if (ch2 === "*") {
      this.inComment = true;
      this.skip(2);

      while (this.peek() !== "*" || this.peek(1) !== "/") {
        if (this.peek() === "") { // End of Line
          body += "\n";
          if (!this.nextLine()) {
            this.trigger("error", {
              code: "E017",
              line: startLine,
              character: startChar
            });

            this.inComment = false;
            return commentToken("/*", body, {
              isMultiline: true,
              isMalformed: true
            });
          }
        } else {
          body += this.peek();
          this.skip();
        }
      }

      this.skip(2);
      this.inComment = false;
      return commentToken("/*", body, { isMultiline: true });
    }
  },
  scanKeyword: function() {
    var result = /^[a-zA-Z_$][a-zA-Z0-9_$]*/.exec(this.input);
    var keywords = [
      "if", "in", "do", "var", "for", "new",
      "try", "let", "this", "else", "case",
      "void", "with", "enum", "while", "break",
      "catch", "throw", "const", "yield", "class",
      "super", "return", "typeof", "delete",
      "switch", "export", "import", "default",
      "finally", "extends", "function", "continue",
      "debugger", "instanceof"
    ];

    if (result && keywords.indexOf(result[0]) >= 0) {
      return {
        type: Token.Keyword,
        value: result[0]
      };
    }

    return null;
  },
  scanIdentifier: function() {
    var id = "";
    var index = 0;
    var type, char;

    function isNonAsciiIdentifierStart(code) {
      return code > 256;
    }

    function isNonAsciiIdentifierPart(code) {
      return code > 256;
    }

    function isHexDigit(str) {
      return (/^[0-9a-fA-F]$/).test(str);
    }

    var readUnicodeEscapeSequence = function() {
      index += 1;

      if (this.peek(index) !== "u") {
        return null;
      }

      var ch1 = this.peek(index + 1);
      var ch2 = this.peek(index + 2);
      var ch3 = this.peek(index + 3);
      var ch4 = this.peek(index + 4);
      var code;

      if (isHexDigit(ch1) && isHexDigit(ch2) && isHexDigit(ch3) && isHexDigit(ch4)) {
        code = parseInt(ch1 + ch2 + ch3 + ch4, 16);

        if (asciiIdentifierPartTable[code] || isNonAsciiIdentifierPart(code)) {
          index += 5;
          return "\\u" + ch1 + ch2 + ch3 + ch4;
        }

        return null;
      }

      return null;
    }.bind(this);

    var getIdentifierStart = function() {
      var chr = this.peek(index);
      var code = chr.charCodeAt(0);

      if (code === 92) {
        return readUnicodeEscapeSequence();
      }

      if (code < 128) {
        if (asciiIdentifierStartTable[code]) {
          index += 1;
          return chr;
        }

        return null;
      }

      if (isNonAsciiIdentifierStart(code)) {
        index += 1;
        return chr;
      }

      return null;
    }.bind(this);

    var getIdentifierPart = function() {
      var chr = this.peek(index);
      var code = chr.charCodeAt(0);

      if (code === 92) {
        return readUnicodeEscapeSequence();
      }

      if (code < 128) {
        if (asciiIdentifierPartTable[code]) {
          index += 1;
          return chr;
        }

        return null;
      }

      if (isNonAsciiIdentifierPart(code)) {
        index += 1;
        return chr;
      }

      return null;
    }.bind(this);

    function removeEscapeSequences(id) {
      return id.replace(/\\u([0-9a-fA-F]{4})/g, function(m0, codepoint) {
        return String.fromCharCode(parseInt(codepoint, 16));
      });
    }

    char = getIdentifierStart();
    if (char === null) {
      return null;
    }

    id = char;
    for (;;) {
      char = getIdentifierPart();

      if (char === null) {
        break;
      }

      id += char;
    }

    switch (id) {
    case "true":
    case "false":
      type = Token.BooleanLiteral;
      break;
    case "null":
      type = Token.NullLiteral;
      break;
    default:
      type = Token.Identifier;
    }

    return {
      type: type,
      value: removeEscapeSequences(id),
      text: id,
      tokenLength: id.length
    };
  },
  scanNumericLiteral: function() {
    var index = 0;
    var value = "";
    var length = this.input.length;
    var char = this.peek(index);
    var bad;
    var isAllowedDigit = isDecimalDigit;
    var base = 10;
    var isLegacy = false;

    function isDecimalDigit(str) {
      return (/^[0-9]$/).test(str);
    }

    function isOctalDigit(str) {
      return (/^[0-7]$/).test(str);
    }

    function isBinaryDigit(str) {
      return (/^[01]$/).test(str);
    }

    function isHexDigit(str) {
      return (/^[0-9a-fA-F]$/).test(str);
    }

    function isIdentifierStart(ch) {
      return (ch === "$") || (ch === "_") || (ch === "\\") ||
        (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z");
    }

    if (char !== "." && !isDecimalDigit(char)) {
      return null;
    }

    if (char !== ".") {
      value = this.peek(index);
      index += 1;
      char = this.peek(index);

      if (value === "0") {
        if (char === "x" || char === "X") {
          isAllowedDigit = isHexDigit;
          base = 16;

          index += 1;
          value += char;
        }
        if (char === "o" || char === "O") {
          isAllowedDigit = isOctalDigit;
          base = 8;

          if (!state.inES6(true)) {
            this.trigger("warning", {
              code: "W119",
              line: this.line,
              character: this.char,
              data: [ "Octal integer literal", "6" ]
            });
          }

          index += 1;
          value += char;
        }
        if (char === "b" || char === "B") {
          isAllowedDigit = isBinaryDigit;
          base = 2;

          if (!state.inES6(true)) {
            this.trigger("warning", {
              code: "W119",
              line: this.line,
              character: this.char,
              data: [ "Binary integer literal", "6" ]
            });
          }

          index += 1;
          value += char;
        }
        if (isOctalDigit(char)) {
          isAllowedDigit = isOctalDigit;
          base = 8;
          isLegacy = true;
          bad = false;

          index += 1;
          value += char;
        }

        if (!isOctalDigit(char) && isDecimalDigit(char)) {
          index += 1;
          value += char;
        }
      }

      while (index < length) {
        char = this.peek(index);

        if (isLegacy && isDecimalDigit(char)) {
          bad = true;
        } else if (!isAllowedDigit(char)) {
          break;
        }
        value += char;
        index += 1;
      }

      if (isAllowedDigit !== isDecimalDigit) {
        if (!isLegacy && value.length <= 2) { // 0x
          return {
            type: Token.NumericLiteral,
            value: value,
            isMalformed: true
          };
        }

        if (index < length) {
          char = this.peek(index);
          if (isIdentifierStart(char)) {
            return null;
          }
        }

        return {
          type: Token.NumericLiteral,
          value: value,
          base: base,
          isLegacy: isLegacy,
          isMalformed: false
        };
      }
    }

    if (char === ".") {
      value += char;
      index += 1;

      while (index < length) {
        char = this.peek(index);
        if (!isDecimalDigit(char)) {
          break;
        }
        value += char;
        index += 1;
      }
    }

    if (char === "e" || char === "E") {
      value += char;
      index += 1;
      char = this.peek(index);

      if (char === "+" || char === "-") {
        value += this.peek(index);
        index += 1;
      }

      char = this.peek(index);
      if (isDecimalDigit(char)) {
        value += char;
        index += 1;

        while (index < length) {
          char = this.peek(index);
          if (!isDecimalDigit(char)) {
            break;
          }
          value += char;
          index += 1;
        }
      } else {
        return null;
      }
    }

    if (index < length) {
      char = this.peek(index);
      if (isIdentifierStart(char)) {
        return null;
      }
    }

    return {
      type: Token.NumericLiteral,
      value: value,
      base: base,
      isMalformed: !isFinite(value)
    };
  },
  scanEscapeSequence: function(checks) {
    var allowNewLine = false;
    var jump = 1;
    this.skip();
    var char = this.peek();

    switch (char) {
    case "'":
      this.triggerAsync("warning", {
        code: "W114",
        line: this.line,
        character: this.char,
        data: [ "\\'" ]
      }, checks, function() {return state.jsonMode; });
      break;
    case "b":
      char = "\\b";
      break;
    case "f":
      char = "\\f";
      break;
    case "n":
      char = "\\n";
      break;
    case "r":
      char = "\\r";
      break;
    case "t":
      char = "\\t";
      break;
    case "0":
      char = "\\0";
      var n = parseInt(this.peek(1), 10);
      this.triggerAsync("warning", {
        code: "W115",
        line: this.line,
        character: this.char
      }, checks,
      function() { return n >= 0 && n <= 7 && state.isStrict(); });
      break;
    case "u":
      var hexCode = this.input.substr(1, 4);
      var code = parseInt(hexCode, 16);
      if (isNaN(code)) {
        this.trigger("warning", {
          code: "W052",
          line: this.line,
          character: this.char,
          data: [ "u" + hexCode ]
        });
      }
      char = String.fromCharCode(code);
      jump = 5;
      break;
    case "v":
      this.triggerAsync("warning", {
        code: "W114",
        line: this.line,
        character: this.char,
        data: [ "\\v" ]
      }, checks, function() { return state.jsonMode; });

      char = "\v";
      break;
    case "x":
      var  x = parseInt(this.input.substr(1, 2), 16);

      this.triggerAsync("warning", {
        code: "W114",
        line: this.line,
        character: this.char,
        data: [ "\\x-" ]
      }, checks, function() { return state.jsonMode; });

      char = String.fromCharCode(x);
      jump = 3;
      break;
    case "\\":
      char = "\\\\";
      break;
    case "\"":
      char = "\\\"";
      break;
    case "/":
      break;
    case "":
      allowNewLine = true;
      char = "";
      break;
    }

    return { char: char, jump: jump, allowNewLine: allowNewLine };
  },
  scanTemplateLiteral: function(checks) {
    var tokenType;
    var value = "";
    var ch;
    var startLine = this.line;
    var startChar = this.char;
    var depth = this.templateStarts.length;

    if (!state.inES6(true)) {
      return null;
    } else if (this.peek() === "`") {
      tokenType = Token.TemplateHead;
      this.templateStarts.push({ line: this.line, char: this.char });
      depth = this.templateStarts.length;
      this.skip(1);
      this.pushContext(Context.Template);
    } else if (this.inContext(Context.Template) && this.peek() === "}") {
      tokenType = Token.TemplateMiddle;
    } else {
      return null;
    }

    while (this.peek() !== "`") {
      while ((ch = this.peek()) === "") {
        value += "\n";
        if (!this.nextLine()) {
          var startPos = this.templateStarts.pop();
          this.trigger("error", {
            code: "E052",
            line: startPos.line,
            character: startPos.char
          });
          return {
            type: tokenType,
            value: value,
            startLine: startLine,
            startChar: startChar,
            isUnclosed: true,
            depth: depth,
            context: this.popContext()
          };
        }
      }

      if (ch === '$' && this.peek(1) === '{') {
        value += '${';
        this.skip(2);
        return {
          type: tokenType,
          value: value,
          startLine: startLine,
          startChar: startChar,
          isUnclosed: false,
          depth: depth,
          context: this.currentContext()
        };
      } else if (ch === '\\') {
        var escape = this.scanEscapeSequence(checks);
        value += escape.char;
        this.skip(escape.jump);
      } else if (ch !== '`') {
        value += ch;
        this.skip(1);
      }
    }
    tokenType = tokenType === Token.TemplateHead ? Token.NoSubstTemplate : Token.TemplateTail;
    this.skip(1);
    this.templateStarts.pop();

    return {
      type: tokenType,
      value: value,
      startLine: startLine,
      startChar: startChar,
      isUnclosed: false,
      depth: depth,
      context: this.popContext()
    };
  },
  scanStringLiteral: function(checks) {
    var quote = this.peek();
    if (quote !== "\"" && quote !== "'") {
      return null;
    }
    this.triggerAsync("warning", {
      code: "W108",
      line: this.line,
      character: this.char // +1?
    }, checks, function() { return state.jsonMode && quote !== "\""; });

    var value = "";
    var startLine = this.line;
    var startChar = this.char;
    var allowNewLine = false;

    this.skip();

    while (this.peek() !== quote) {
      if (this.peek() === "") { // End Of Line

        if (!allowNewLine) {
          this.trigger("warning", {
            code: "W112",
            line: this.line,
            character: this.char
          });
        } else {
          allowNewLine = false;

          this.triggerAsync("warning", {
            code: "W043",
            line: this.line,
            character: this.char
          }, checks, function() { return !state.option.multistr; });

          this.triggerAsync("warning", {
            code: "W042",
            line: this.line,
            character: this.char
          }, checks, function() { return state.jsonMode && state.option.multistr; });
        }

        if (!this.nextLine()) {
          this.trigger("error", {
            code: "E029",
            line: startLine,
            character: startChar
          });

          return {
            type: Token.StringLiteral,
            value: value,
            startLine: startLine,
            startChar: startChar,
            isUnclosed: true,
            quote: quote
          };
        }

      } else { // Any character other than End Of Line

        allowNewLine = false;
        var char = this.peek();
        var jump = 1; // A length of a jump, after we're done

        if (char < " ") {
          this.trigger("warning", {
            code: "W113",
            line: this.line,
            character: this.char,
            data: [ "<non-printable>" ]
          });
        }
        if (char === "\\") {
          var parsed = this.scanEscapeSequence(checks);
          char = parsed.char;
          jump = parsed.jump;
          allowNewLine = parsed.allowNewLine;
        }

        value += char;
        this.skip(jump);
      }
    }

    this.skip();
    return {
      type: Token.StringLiteral,
      value: value,
      startLine: startLine,
      startChar: startChar,
      isUnclosed: false,
      quote: quote
    };
  },
  scanRegExp: function() {
    var index = 0;
    var length = this.input.length;
    var char = this.peek();
    var value = char;
    var body = "";
    var flags = [];
    var malformed = false;
    var isCharSet = false;
    var terminated;

    var scanUnexpectedChars = function() {
      if (char < " ") {
        malformed = true;
        this.trigger("warning", {
          code: "W048",
          line: this.line,
          character: this.char
        });
      }
      if (char === "<") {
        malformed = true;
        this.trigger("warning", {
          code: "W049",
          line: this.line,
          character: this.char,
          data: [ char ]
        });
      }
    }.bind(this);
    if (!this.prereg || char !== "/") {
      return null;
    }

    index += 1;
    terminated = false;

    while (index < length) {
      char = this.peek(index);
      value += char;
      body += char;

      if (isCharSet) {
        if (char === "]") {
          if (this.peek(index - 1) !== "\\" || this.peek(index - 2) === "\\") {
            isCharSet = false;
          }
        }

        if (char === "\\") {
          index += 1;
          char = this.peek(index);
          body += char;
          value += char;

          scanUnexpectedChars();
        }

        index += 1;
        continue;
      }

      if (char === "\\") {
        index += 1;
        char = this.peek(index);
        body += char;
        value += char;

        scanUnexpectedChars();

        if (char === "/") {
          index += 1;
          continue;
        }

        if (char === "[") {
          index += 1;
          continue;
        }
      }

      if (char === "[") {
        isCharSet = true;
        index += 1;
        continue;
      }

      if (char === "/") {
        body = body.substr(0, body.length - 1);
        terminated = true;
        index += 1;
        break;
      }

      index += 1;
    }

    if (!terminated) {
      this.trigger("error", {
        code: "E015",
        line: this.line,
        character: this.from
      });

      return void this.trigger("fatal", {
        line: this.line,
        from: this.from
      });
    }

    while (index < length) {
      char = this.peek(index);
      if (!/[gim]/.test(char)) {
        break;
      }
      flags.push(char);
      value += char;
      index += 1;
    }

    try {
      new RegExp(body, flags.join(""));
    } catch (err) {
      malformed = true;
      this.trigger("error", {
        code: "E016",
        line: this.line,
        character: this.char,
        data: [ err.message ] // Platform dependent!
      });
    }

    return {
      type: Token.RegExp,
      value: value,
      flags: flags,
      isMalformed: malformed
    };
  },
  scanNonBreakingSpaces: function() {
    return state.option.nonbsp ?
      this.input.search(/(\u00A0)/) : -1;
  },
  scanUnsafeChars: function() {
    return this.input.search(reg.unsafeChars);
  },
  next: function(checks) {
    this.from = this.char;
    var start;
    if (/\s/.test(this.peek())) {
      start = this.char;

      while (/\s/.test(this.peek())) {
        this.from += 1;
        this.skip();
      }
    }

    var match = this.scanComments() ||
      this.scanStringLiteral(checks) ||
      this.scanTemplateLiteral(checks);

    if (match) {
      return match;
    }

    match =
      this.scanRegExp() ||
      this.scanPunctuator() ||
      this.scanKeyword() ||
      this.scanIdentifier() ||
      this.scanNumericLiteral();

    if (match) {
      this.skip(match.tokenLength || match.value.length);
      return match;
    }

    return null;
  },
  nextLine: function() {
    var char;

    if (this.line >= this.getLines().length) {
      return false;
    }

    this.input = this.getLines()[this.line];
    this.line += 1;
    this.char = 1;
    this.from = 1;

    var inputTrimmed = this.input.trim();

    var startsWith = function() {
      return _.some(arguments, function(prefix) {
        return inputTrimmed.indexOf(prefix) === 0;
      });
    };

    var endsWith = function() {
      return _.some(arguments, function(suffix) {
        return inputTrimmed.indexOf(suffix, inputTrimmed.length - suffix.length) !== -1;
      });
    };
    if (this.ignoringLinterErrors === true) {
      if (!startsWith("/*", "//") && !(this.inComment && endsWith("*/"))) {
        this.input = "";
      }
    }

    char = this.scanNonBreakingSpaces();
    if (char >= 0) {
      this.trigger("warning", { code: "W125", line: this.line, character: char + 1 });
    }

    this.input = this.input.replace(/\t/g, state.tab);
    char = this.scanUnsafeChars();

    if (char >= 0) {
      this.trigger("warning", { code: "W100", line: this.line, character: char });
    }

    if (!this.ignoringLinterErrors && state.option.maxlen &&
      state.option.maxlen < this.input.length) {
      var inComment = this.inComment ||
        startsWith.call(inputTrimmed, "//") ||
        startsWith.call(inputTrimmed, "/*");

      var shouldTriggerError = !inComment || !reg.maxlenException.test(inputTrimmed);

      if (shouldTriggerError) {
        this.trigger("warning", { code: "W101", line: this.line, character: this.input.length });
      }
    }

    return true;
  },
  start: function() {
    this.nextLine();
  },
  token: function() {
    var checks = asyncTrigger();
    var token;


    function isReserved(token, isProperty) {
      if (!token.reserved) {
        return false;
      }
      var meta = token.meta;

      if (meta && meta.isFutureReservedWord && state.inES5()) {
        if (!meta.es5) {
          return false;
        }
        if (meta.strictOnly) {
          if (!state.option.strict && !state.isStrict()) {
            return false;
          }
        }

        if (isProperty) {
          return false;
        }
      }

      return true;
    }
    var create = function(type, value, isProperty, token) {
      var obj;

      if (type !== "(endline)" && type !== "(end)") {
        this.prereg = false;
      }

      if (type === "(punctuator)") {
        switch (value) {
        case ".":
        case ")":
        case "~":
        case "#":
        case "]":
        case "++":
        case "--":
          this.prereg = false;
          break;
        default:
          this.prereg = true;
        }

        obj = Object.create(state.syntax[value] || state.syntax["(error)"]);
      }

      if (type === "(identifier)") {
        if (value === "return" || value === "case" || value === "typeof") {
          this.prereg = true;
        }

        if (_.has(state.syntax, value)) {
          obj = Object.create(state.syntax[value] || state.syntax["(error)"]);
          if (!isReserved(obj, isProperty && type === "(identifier)")) {
            obj = null;
          }
        }
      }

      if (!obj) {
        obj = Object.create(state.syntax[type]);
      }

      obj.identifier = (type === "(identifier)");
      obj.type = obj.type || type;
      obj.value = value;
      obj.line = this.line;
      obj.character = this.char;
      obj.from = this.from;
      if (obj.identifier && token) obj.raw_text = token.text || token.value;
      if (token && token.startLine && token.startLine !== this.line) {
        obj.startLine = token.startLine;
      }
      if (token && token.context) {
        obj.context = token.context;
      }
      if (token && token.depth) {
        obj.depth = token.depth;
      }
      if (token && token.isUnclosed) {
        obj.isUnclosed = token.isUnclosed;
      }

      if (isProperty && obj.identifier) {
        obj.isProperty = isProperty;
      }

      obj.check = checks.check;

      return obj;
    }.bind(this);

    for (;;) {
      if (!this.input.length) {
        if (this.nextLine()) {
          return create("(endline)", "");
        }

        if (this.exhausted) {
          return null;
        }

        this.exhausted = true;
        return create("(end)", "");
      }

      token = this.next(checks);

      if (!token) {
        if (this.input.length) {
          this.trigger("error", {
            code: "E024",
            line: this.line,
            character: this.char,
            data: [ this.peek() ]
          });

          this.input = "";
        }

        continue;
      }

      switch (token.type) {
      case Token.StringLiteral:
        this.triggerAsync("String", {
          line: this.line,
          char: this.char,
          from: this.from,
          startLine: token.startLine,
          startChar: token.startChar,
          value: token.value,
          quote: token.quote
        }, checks, function() { return true; });

        return create("(string)", token.value, null, token);

      case Token.TemplateHead:
        this.trigger("TemplateHead", {
          line: this.line,
          char: this.char,
          from: this.from,
          startLine: token.startLine,
          startChar: token.startChar,
          value: token.value
        });
        return create("(template)", token.value, null, token);

      case Token.TemplateMiddle:
        this.trigger("TemplateMiddle", {
          line: this.line,
          char: this.char,
          from: this.from,
          startLine: token.startLine,
          startChar: token.startChar,
          value: token.value
        });
        return create("(template middle)", token.value, null, token);

      case Token.TemplateTail:
        this.trigger("TemplateTail", {
          line: this.line,
          char: this.char,
          from: this.from,
          startLine: token.startLine,
          startChar: token.startChar,
          value: token.value
        });
        return create("(template tail)", token.value, null, token);

      case Token.NoSubstTemplate:
        this.trigger("NoSubstTemplate", {
          line: this.line,
          char: this.char,
          from: this.from,
          startLine: token.startLine,
          startChar: token.startChar,
          value: token.value
        });
        return create("(no subst template)", token.value, null, token);

      case Token.Identifier:
        this.triggerAsync("Identifier", {
          line: this.line,
          char: this.char,
          from: this.form,
          name: token.value,
          raw_name: token.text,
          isProperty: state.tokens.curr.id === "."
        }, checks, function() { return true; });
      case Token.Keyword:
      case Token.NullLiteral:
      case Token.BooleanLiteral:
        return create("(identifier)", token.value, state.tokens.curr.id === ".", token);

      case Token.NumericLiteral:
        if (token.isMalformed) {
          this.trigger("warning", {
            code: "W045",
            line: this.line,
            character: this.char,
            data: [ token.value ]
          });
        }

        this.triggerAsync("warning", {
          code: "W114",
          line: this.line,
          character: this.char,
          data: [ "0x-" ]
        }, checks, function() { return token.base === 16 && state.jsonMode; });

        this.triggerAsync("warning", {
          code: "W115",
          line: this.line,
          character: this.char
        }, checks, function() {
          return state.isStrict() && token.base === 8 && token.isLegacy;
        });

        this.trigger("Number", {
          line: this.line,
          char: this.char,
          from: this.from,
          value: token.value,
          base: token.base,
          isMalformed: token.malformed
        });

        return create("(number)", token.value);

      case Token.RegExp:
        return create("(regexp)", token.value);

      case Token.Comment:
        state.tokens.curr.comment = true;

        if (token.isSpecial) {
          return {
            id: '(comment)',
            value: token.value,
            body: token.body,
            type: token.commentType,
            isSpecial: token.isSpecial,
            line: this.line,
            character: this.char,
            from: this.from
          };
        }

        break;

      case "":
        break;

      default:
        return create("(punctuator)", token.value);
      }
    }
  }
};

exports.Lexer = Lexer;
exports.Context = Context;

},{"../data/ascii-identifier-data.js":"/node_modules/jshint/data/ascii-identifier-data.js","../lodash":"/node_modules/jshint/lodash.js","./reg.js":"/node_modules/jshint/src/reg.js","./state.js":"/node_modules/jshint/src/state.js","events":"/node_modules/browserify/node_modules/events/events.js"}],"/node_modules/jshint/src/messages.js":[function(_dereq_,module,exports){
"use strict";

var _ = _dereq_("../lodash");

var errors = {
  E001: "Bad option: '{a}'.",
  E002: "Bad option value.",
  E003: "Expected a JSON value.",
  E004: "Input is neither a string nor an array of strings.",
  E005: "Input is empty.",
  E006: "Unexpected early end of program.",
  E007: "Missing \"use strict\" statement.",
  E008: "Strict violation.",
  E009: "Option 'validthis' can't be used in a global scope.",
  E010: "'with' is not allowed in strict mode.",
  E011: "'{a}' has already been declared.",
  E012: "const '{a}' is initialized to 'undefined'.",
  E013: "Attempting to override '{a}' which is a constant.",
  E014: "A regular expression literal can be confused with '/='.",
  E015: "Unclosed regular expression.",
  E016: "Invalid regular expression.",
  E017: "Unclosed comment.",
  E018: "Unbegun comment.",
  E019: "Unmatched '{a}'.",
  E020: "Expected '{a}' to match '{b}' from line {c} and instead saw '{d}'.",
  E021: "Expected '{a}' and instead saw '{b}'.",
  E022: "Line breaking error '{a}'.",
  E023: "Missing '{a}'.",
  E024: "Unexpected '{a}'.",
  E025: "Missing ':' on a case clause.",
  E026: "Missing '}' to match '{' from line {a}.",
  E027: "Missing ']' to match '[' from line {a}.",
  E028: "Illegal comma.",
  E029: "Unclosed string.",
  E030: "Expected an identifier and instead saw '{a}'.",
  E031: "Bad assignment.", // FIXME: Rephrase
  E032: "Expected a small integer or 'false' and instead saw '{a}'.",
  E033: "Expected an operator and instead saw '{a}'.",
  E034: "get/set are ES5 features.",
  E035: "Missing property name.",
  E036: "Expected to see a statement and instead saw a block.",
  E037: null,
  E038: null,
  E039: "Function declarations are not invocable. Wrap the whole function invocation in parens.",
  E040: "Each value should have its own case label.",
  E041: "Unrecoverable syntax error.",
  E042: "Stopping.",
  E043: "Too many errors.",
  E044: null,
  E045: "Invalid for each loop.",
  E046: "A yield statement shall be within a generator function (with syntax: `function*`)",
  E047: null,
  E048: "{a} declaration not directly within block.",
  E049: "A {a} cannot be named '{b}'.",
  E050: "Mozilla requires the yield expression to be parenthesized here.",
  E051: null,
  E052: "Unclosed template literal.",
  E053: "Export declaration must be in global scope.",
  E054: "Class properties must be methods. Expected '(' but instead saw '{a}'.",
  E055: "The '{a}' option cannot be set after any executable code.",
  E056: "'{a}' was used before it was declared, which is illegal for '{b}' variables.",
  E057: "Invalid meta property: '{a}.{b}'.",
  E058: "Missing semicolon."
};

var warnings = {
  W001: "'hasOwnProperty' is a really bad name.",
  W002: "Value of '{a}' may be overwritten in IE 8 and earlier.",
  W003: "'{a}' was used before it was defined.",
  W004: "'{a}' is already defined.",
  W005: "A dot following a number can be confused with a decimal point.",
  W006: "Confusing minuses.",
  W007: "Confusing plusses.",
  W008: "A leading decimal point can be confused with a dot: '{a}'.",
  W009: "The array literal notation [] is preferable.",
  W010: "The object literal notation {} is preferable.",
  W011: null,
  W012: null,
  W013: null,
  W014: "Bad line breaking before '{a}'.",
  W015: null,
  W016: "Unexpected use of '{a}'.",
  W017: "Bad operand.",
  W018: "Confusing use of '{a}'.",
  W019: "Use the isNaN function to compare with NaN.",
  W020: "Read only.",
  W021: "Reassignment of '{a}', which is is a {b}. " +
    "Use 'var' or 'let' to declare bindings that may change.",
  W022: "Do not assign to the exception parameter.",
  W023: "Expected an identifier in an assignment and instead saw a function invocation.",
  W024: "Expected an identifier and instead saw '{a}' (a reserved word).",
  W025: "Missing name in function declaration.",
  W026: "Inner functions should be listed at the top of the outer function.",
  W027: "Unreachable '{a}' after '{b}'.",
  W028: "Label '{a}' on {b} statement.",
  W030: "Expected an assignment or function call and instead saw an expression.",
  W031: "Do not use 'new' for side effects.",
  W032: "Unnecessary semicolon.",
  W033: "Missing semicolon.",
  W034: "Unnecessary directive \"{a}\".",
  W035: "Empty block.",
  W036: "Unexpected /*member '{a}'.",
  W037: "'{a}' is a statement label.",
  W038: "'{a}' used out of scope.",
  W039: "'{a}' is not allowed.",
  W040: "Possible strict violation.",
  W041: "Use '{a}' to compare with '{b}'.",
  W042: "Avoid EOL escaping.",
  W043: "Bad escaping of EOL. Use option multistr if needed.",
  W044: "Bad or unnecessary escaping.", /* TODO(caitp): remove W044 */
  W045: "Bad number '{a}'.",
  W046: "Don't use extra leading zeros '{a}'.",
  W047: "A trailing decimal point can be confused with a dot: '{a}'.",
  W048: "Unexpected control character in regular expression.",
  W049: "Unexpected escaped character '{a}' in regular expression.",
  W050: "JavaScript URL.",
  W051: "Variables should not be deleted.",
  W052: "Unexpected '{a}'.",
  W053: "Do not use {a} as a constructor.",
  W054: "The Function constructor is a form of eval.",
  W055: "A constructor name should start with an uppercase letter.",
  W056: "Bad constructor.",
  W057: "Weird construction. Is 'new' necessary?",
  W058: "Missing '()' invoking a constructor.",
  W059: "Avoid arguments.{a}.",
  W060: "document.write can be a form of eval.",
  W061: "eval can be harmful.",
  W062: "Wrap an immediate function invocation in parens " +
    "to assist the reader in understanding that the expression " +
    "is the result of a function, and not the function itself.",
  W063: "Math is not a function.",
  W064: "Missing 'new' prefix when invoking a constructor.",
  W065: "Missing radix parameter.",
  W066: "Implied eval. Consider passing a function instead of a string.",
  W067: "Bad invocation.",
  W068: "Wrapping non-IIFE function literals in parens is unnecessary.",
  W069: "['{a}'] is better written in dot notation.",
  W070: "Extra comma. (it breaks older versions of IE)",
  W071: "This function has too many statements. ({a})",
  W072: "This function has too many parameters. ({a})",
  W073: "Blocks are nested too deeply. ({a})",
  W074: "This function's cyclomatic complexity is too high. ({a})",
  W075: "Duplicate {a} '{b}'.",
  W076: "Unexpected parameter '{a}' in get {b} function.",
  W077: "Expected a single parameter in set {a} function.",
  W078: "Setter is defined without getter.",
  W079: "Redefinition of '{a}'.",
  W080: "It's not necessary to initialize '{a}' to 'undefined'.",
  W081: null,
  W082: "Function declarations should not be placed in blocks. " +
    "Use a function expression or move the statement to the top of " +
    "the outer function.",
  W083: "Don't make functions within a loop.",
  W084: "Assignment in conditional expression",
  W085: "Don't use 'with'.",
  W086: "Expected a 'break' statement before '{a}'.",
  W087: "Forgotten 'debugger' statement?",
  W088: "Creating global 'for' variable. Should be 'for (var {a} ...'.",
  W089: "The body of a for in should be wrapped in an if statement to filter " +
    "unwanted properties from the prototype.",
  W090: "'{a}' is not a statement label.",
  W091: null,
  W093: "Did you mean to return a conditional instead of an assignment?",
  W094: "Unexpected comma.",
  W095: "Expected a string and instead saw {a}.",
  W096: "The '{a}' key may produce unexpected results.",
  W097: "Use the function form of \"use strict\".",
  W098: "'{a}' is defined but never used.",
  W099: null,
  W100: "This character may get silently deleted by one or more browsers.",
  W101: "Line is too long.",
  W102: null,
  W103: "The '{a}' property is deprecated.",
  W104: "'{a}' is available in ES{b} (use 'esversion: {b}') or Mozilla JS extensions (use moz).",
  W105: "Unexpected {a} in '{b}'.",
  W106: "Identifier '{a}' is not in camel case.",
  W107: "Script URL.",
  W108: "Strings must use doublequote.",
  W109: "Strings must use singlequote.",
  W110: "Mixed double and single quotes.",
  W112: "Unclosed string.",
  W113: "Control character in string: {a}.",
  W114: "Avoid {a}.",
  W115: "Octal literals are not allowed in strict mode.",
  W116: "Expected '{a}' and instead saw '{b}'.",
  W117: "'{a}' is not defined.",
  W118: "'{a}' is only available in Mozilla JavaScript extensions (use moz option).",
  W119: "'{a}' is only available in ES{b} (use 'esversion: {b}').",
  W120: "You might be leaking a variable ({a}) here.",
  W121: "Extending prototype of native object: '{a}'.",
  W122: "Invalid typeof value '{a}'",
  W123: "'{a}' is already defined in outer scope.",
  W124: "A generator function shall contain a yield statement.",
  W125: "This line contains non-breaking spaces: http://jshint.com/doc/options/#nonbsp",
  W126: "Unnecessary grouping operator.",
  W127: "Unexpected use of a comma operator.",
  W128: "Empty array elements require elision=true.",
  W129: "'{a}' is defined in a future version of JavaScript. Use a " +
    "different variable name to avoid migration issues.",
  W130: "Invalid element after rest element.",
  W131: "Invalid parameter after rest parameter.",
  W132: "`var` declarations are forbidden. Use `let` or `const` instead.",
  W133: "Invalid for-{a} loop left-hand-side: {b}.",
  W134: "The '{a}' option is only available when linting ECMAScript {b} code.",
  W135: "{a} may not be supported by non-browser environments.",
  W136: "'{a}' must be in function scope.",
  W137: "Empty destructuring.",
  W138: "Regular parameters should not come after default parameters."
};

var info = {
  I001: "Comma warnings can be turned off with 'laxcomma'.",
  I002: null,
  I003: "ES5 option is now set per default"
};

exports.errors = {};
exports.warnings = {};
exports.info = {};

_.each(errors, function(desc, code) {
  exports.errors[code] = { code: code, desc: desc };
});

_.each(warnings, function(desc, code) {
  exports.warnings[code] = { code: code, desc: desc };
});

_.each(info, function(desc, code) {
  exports.info[code] = { code: code, desc: desc };
});

},{"../lodash":"/node_modules/jshint/lodash.js"}],"/node_modules/jshint/src/name-stack.js":[function(_dereq_,module,exports){
"use strict";

function NameStack() {
  this._stack = [];
}

Object.defineProperty(NameStack.prototype, "length", {
  get: function() {
    return this._stack.length;
  }
});
NameStack.prototype.push = function() {
  this._stack.push(null);
};
NameStack.prototype.pop = function() {
  this._stack.pop();
};
NameStack.prototype.set = function(token) {
  this._stack[this.length - 1] = token;
};
NameStack.prototype.infer = function() {
  var nameToken = this._stack[this.length - 1];
  var prefix = "";
  var type;
  if (!nameToken || nameToken.type === "class") {
    nameToken = this._stack[this.length - 2];
  }

  if (!nameToken) {
    return "(empty)";
  }

  type = nameToken.type;

  if (type !== "(string)" && type !== "(number)" && type !== "(identifier)" && type !== "default") {
    return "(expression)";
  }

  if (nameToken.accessorType) {
    prefix = nameToken.accessorType + " ";
  }

  return prefix + nameToken.value;
};

module.exports = NameStack;

},{}],"/node_modules/jshint/src/options.js":[function(_dereq_,module,exports){
"use strict";
exports.bool = {
  enforcing: {
    bitwise     : true,
    freeze      : true,
    camelcase   : true,
    curly       : true,
    eqeqeq      : true,
    futurehostile: true,
    notypeof    : true,
    es3         : true,
    es5         : true,
    forin       : true,
    funcscope   : true,
    immed       : true,
    iterator    : true,
    newcap      : true,
    noarg       : true,
    nocomma     : true,
    noempty     : true,
    nonbsp      : true,
    nonew       : true,
    undef       : true,
    singleGroups: false,
    varstmt: false,
    enforceall : false
  },
  relaxing: {
    asi         : true,
    multistr    : true,
    debug       : true,
    boss        : true,
    evil        : true,
    globalstrict: true,
    plusplus    : true,
    proto       : true,
    scripturl   : true,
    sub         : true,
    supernew    : true,
    laxbreak    : true,
    laxcomma    : true,
    validthis   : true,
    withstmt    : true,
    moz         : true,
    noyield     : true,
    eqnull      : true,
    lastsemic   : true,
    loopfunc    : true,
    expr        : true,
    esnext      : true,
    elision     : true,
  },
  environments: {
    mootools    : true,
    couch       : true,
    jasmine     : true,
    jquery      : true,
    node        : true,
    qunit       : true,
    rhino       : true,
    shelljs     : true,
    prototypejs : true,
    yui         : true,
    mocha       : true,
    module      : true,
    wsh         : true,
    worker      : true,
    nonstandard : true,
    browser     : true,
    browserify  : true,
    devel       : true,
    dojo        : true,
    typed       : true,
    phantom     : true
  },
  obsolete: {
    onecase     : true, // if one case switch statements should be allowed
    regexp      : true, // if the . should not be allowed in regexp literals
    regexdash   : true  // if unescaped first/last dash (-) inside brackets
  }
};
exports.val = {
  maxlen       : false,
  indent       : false,
  maxerr       : false,
  predef       : false,
  globals      : false,
  quotmark     : false,

  scope        : false,
  maxstatements: false,
  maxdepth     : false,
  maxparams    : false,
  maxcomplexity: false,
  shadow       : false,
  strict      : true,
  unused       : true,
  latedef      : false,

  ignore       : false, // start/end ignoring lines of code, bypassing the lexer

  ignoreDelimiters: false, // array of start/end delimiters used to ignore
  esversion: 5
};
exports.inverted = {
  bitwise : true,
  forin   : true,
  newcap  : true,
  plusplus: true,
  regexp  : true,
  undef   : true,
  eqeqeq  : true,
  strict  : true
};

exports.validNames = Object.keys(exports.val)
  .concat(Object.keys(exports.bool.relaxing))
  .concat(Object.keys(exports.bool.enforcing))
  .concat(Object.keys(exports.bool.obsolete))
  .concat(Object.keys(exports.bool.environments));
exports.renamed = {
  eqeq   : "eqeqeq",
  windows: "wsh",
  sloppy : "strict"
};

exports.removed = {
  nomen: true,
  onevar: true,
  passfail: true,
  white: true,
  gcl: true,
  smarttabs: true,
  trailing: true
};
exports.noenforceall = {
  varstmt: true,
  strict: true
};

},{}],"/node_modules/jshint/src/reg.js":[function(_dereq_,module,exports){

"use strict";
exports.unsafeString =
  /@cc|<\/?|script|\]\s*\]|<\s*!|&lt/i;
exports.unsafeChars =
  /[\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/;
exports.needEsc =
  /[\u0000-\u001f&<"\/\\\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/;

exports.needEscGlobal =
  /[\u0000-\u001f&<"\/\\\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
exports.starSlash = /\*\//;
exports.identifier = /^([a-zA-Z_$][a-zA-Z0-9_$]*)$/;
exports.javascriptURL = /^(?:javascript|jscript|ecmascript|vbscript|livescript)\s*:/i;
exports.fallsThrough = /^\s*falls?\sthrough\s*$/;
exports.maxlenException = /^(?:(?:\/\/|\/\*|\*) ?)?[^ ]+$/;

},{}],"/node_modules/jshint/src/scope-manager.js":[function(_dereq_,module,exports){
"use strict";

var _      = _dereq_("../lodash");
var events = _dereq_("events");
var marker = {};
var scopeManager = function(state, predefined, exported, declared) {

  var _current;
  var _scopeStack = [];

  function _newScope(type) {
    _current = {
      "(labels)": Object.create(null),
      "(usages)": Object.create(null),
      "(breakLabels)": Object.create(null),
      "(parent)": _current,
      "(type)": type,
      "(params)": (type === "functionparams" || type === "catchparams") ? [] : null
    };
    _scopeStack.push(_current);
  }

  _newScope("global");
  _current["(predefined)"] = predefined;

  var _currentFunctBody = _current; // this is the block after the params = function

  var usedPredefinedAndGlobals = Object.create(null);
  var impliedGlobals = Object.create(null);
  var unuseds = [];
  var emitter = new events.EventEmitter();

  function warning(code, token) {
    emitter.emit("warning", {
      code: code,
      token: token,
      data: _.slice(arguments, 2)
    });
  }

  function error(code, token) {
    emitter.emit("warning", {
      code: code,
      token: token,
      data: _.slice(arguments, 2)
    });
  }

  function _setupUsages(labelName) {
    if (!_current["(usages)"][labelName]) {
      _current["(usages)"][labelName] = {
        "(modified)": [],
        "(reassigned)": [],
        "(tokens)": []
      };
    }
  }

  var _getUnusedOption = function(unused_opt) {
    if (unused_opt === undefined) {
      unused_opt = state.option.unused;
    }

    if (unused_opt === true) {
      unused_opt = "last-param";
    }

    return unused_opt;
  };

  var _warnUnused = function(name, tkn, type, unused_opt) {
    var line = tkn.line;
    var chr  = tkn.from;
    var raw_name = tkn.raw_text || name;

    unused_opt = _getUnusedOption(unused_opt);

    var warnable_types = {
      "vars": ["var"],
      "last-param": ["var", "param"],
      "strict": ["var", "param", "last-param"]
    };

    if (unused_opt) {
      if (warnable_types[unused_opt] && warnable_types[unused_opt].indexOf(type) !== -1) {
        warning("W098", { line: line, from: chr }, raw_name);
      }
    }
    if (unused_opt || type === "var") {
      unuseds.push({
        name: name,
        line: line,
        character: chr
      });
    }
  };
  function _checkForUnused() {
    if (_current["(type)"] === "functionparams") {
      _checkParams();
      return;
    }
    var curentLabels = _current["(labels)"];
    for (var labelName in curentLabels) {
      if (curentLabels[labelName]) {
        if (curentLabels[labelName]["(type)"] !== "exception" &&
          curentLabels[labelName]["(unused)"]) {
          _warnUnused(labelName, curentLabels[labelName]["(token)"], "var");
        }
      }
    }
  }
  function _checkParams() {
    var params = _current["(params)"];

    if (!params) {
      return;
    }

    var param = params.pop();
    var unused_opt;

    while (param) {
      var label = _current["(labels)"][param];

      unused_opt = _getUnusedOption(state.funct["(unusedOption)"]);
      if (param === "undefined")
        return;

      if (label["(unused)"]) {
        _warnUnused(param, label["(token)"], "param", state.funct["(unusedOption)"]);
      } else if (unused_opt === "last-param") {
        return;
      }

      param = params.pop();
    }
  }
  function _getLabel(labelName) {
    for (var i = _scopeStack.length - 1 ; i >= 0; --i) {
      var scopeLabels = _scopeStack[i]["(labels)"];
      if (scopeLabels[labelName]) {
        return scopeLabels;
      }
    }
  }

  function usedSoFarInCurrentFunction(labelName) {
    for (var i = _scopeStack.length - 1; i >= 0; i--) {
      var current = _scopeStack[i];
      if (current["(usages)"][labelName]) {
        return current["(usages)"][labelName];
      }
      if (current === _currentFunctBody) {
        break;
      }
    }
    return false;
  }

  function _checkOuterShadow(labelName, token) {
    if (state.option.shadow !== "outer") {
      return;
    }

    var isGlobal = _currentFunctBody["(type)"] === "global",
      isNewFunction = _current["(type)"] === "functionparams";

    var outsideCurrentFunction = !isGlobal;
    for (var i = 0; i < _scopeStack.length; i++) {
      var stackItem = _scopeStack[i];

      if (!isNewFunction && _scopeStack[i + 1] === _currentFunctBody) {
        outsideCurrentFunction = false;
      }
      if (outsideCurrentFunction && stackItem["(labels)"][labelName]) {
        warning("W123", token, labelName);
      }
      if (stackItem["(breakLabels)"][labelName]) {
        warning("W123", token, labelName);
      }
    }
  }

  function _latedefWarning(type, labelName, token) {
    if (state.option.latedef) {
      if ((state.option.latedef === true && type === "function") ||
        type !== "function") {
        warning("W003", token, labelName);
      }
    }
  }

  var scopeManagerInst = {

    on: function(names, listener) {
      names.split(" ").forEach(function(name) {
        emitter.on(name, listener);
      });
    },

    isPredefined: function(labelName) {
      return !this.has(labelName) && _.has(_scopeStack[0]["(predefined)"], labelName);
    },
    stack: function(type) {
      var previousScope = _current;
      _newScope(type);

      if (!type && previousScope["(type)"] === "functionparams") {

        _current["(isFuncBody)"] = true;
        _current["(context)"] = _currentFunctBody;
        _currentFunctBody = _current;
      }
    },

    unstack: function() {
      var subScope = _scopeStack.length > 1 ? _scopeStack[_scopeStack.length - 2] : null;
      var isUnstackingFunctionBody = _current === _currentFunctBody,
        isUnstackingFunctionParams = _current["(type)"] === "functionparams",
        isUnstackingFunctionOuter = _current["(type)"] === "functionouter";

      var i, j;
      var currentUsages = _current["(usages)"];
      var currentLabels = _current["(labels)"];
      var usedLabelNameList = Object.keys(currentUsages);

      if (currentUsages.__proto__ && usedLabelNameList.indexOf("__proto__") === -1) {
        usedLabelNameList.push("__proto__");
      }

      for (i = 0; i < usedLabelNameList.length; i++) {
        var usedLabelName = usedLabelNameList[i];

        var usage = currentUsages[usedLabelName];
        var usedLabel = currentLabels[usedLabelName];
        if (usedLabel) {
          var usedLabelType = usedLabel["(type)"];

          if (usedLabel["(useOutsideOfScope)"] && !state.option.funcscope) {
            var usedTokens = usage["(tokens)"];
            if (usedTokens) {
              for (j = 0; j < usedTokens.length; j++) {
                if (usedLabel["(function)"] === usedTokens[j]["(function)"]) {
                  error("W038", usedTokens[j], usedLabelName);
                }
              }
            }
          }
          _current["(labels)"][usedLabelName]["(unused)"] = false;
          if (usedLabelType === "const" && usage["(modified)"]) {
            for (j = 0; j < usage["(modified)"].length; j++) {
              error("E013", usage["(modified)"][j], usedLabelName);
            }
          }
          if ((usedLabelType === "function" || usedLabelType === "class") &&
              usage["(reassigned)"]) {
            for (j = 0; j < usage["(reassigned)"].length; j++) {
              error("W021", usage["(reassigned)"][j], usedLabelName, usedLabelType);
            }
          }
          continue;
        }

        if (isUnstackingFunctionOuter) {
          state.funct["(isCapturing)"] = true;
        }

        if (subScope) {
          if (!subScope["(usages)"][usedLabelName]) {
            subScope["(usages)"][usedLabelName] = usage;
            if (isUnstackingFunctionBody) {
              subScope["(usages)"][usedLabelName]["(onlyUsedSubFunction)"] = true;
            }
          } else {
            var subScopeUsage = subScope["(usages)"][usedLabelName];
            subScopeUsage["(modified)"] = subScopeUsage["(modified)"].concat(usage["(modified)"]);
            subScopeUsage["(tokens)"] = subScopeUsage["(tokens)"].concat(usage["(tokens)"]);
            subScopeUsage["(reassigned)"] =
              subScopeUsage["(reassigned)"].concat(usage["(reassigned)"]);
            subScopeUsage["(onlyUsedSubFunction)"] = false;
          }
        } else {
          if (typeof _current["(predefined)"][usedLabelName] === "boolean") {
            delete declared[usedLabelName];
            usedPredefinedAndGlobals[usedLabelName] = marker;
            if (_current["(predefined)"][usedLabelName] === false && usage["(reassigned)"]) {
              for (j = 0; j < usage["(reassigned)"].length; j++) {
                warning("W020", usage["(reassigned)"][j]);
              }
            }
          }
          else {
            if (usage["(tokens)"]) {
              for (j = 0; j < usage["(tokens)"].length; j++) {
                var undefinedToken = usage["(tokens)"][j];
                if (!undefinedToken.forgiveUndef) {
                  if (state.option.undef && !undefinedToken.ignoreUndef) {
                    warning("W117", undefinedToken, usedLabelName);
                  }
                  if (impliedGlobals[usedLabelName]) {
                    impliedGlobals[usedLabelName].line.push(undefinedToken.line);
                  } else {
                    impliedGlobals[usedLabelName] = {
                      name: usedLabelName,
                      line: [undefinedToken.line]
                    };
                  }
                }
              }
            }
          }
        }
      }
      if (!subScope) {
        Object.keys(declared)
          .forEach(function(labelNotUsed) {
            _warnUnused(labelNotUsed, declared[labelNotUsed], "var");
          });
      }
      if (subScope && !isUnstackingFunctionBody &&
        !isUnstackingFunctionParams && !isUnstackingFunctionOuter) {
        var labelNames = Object.keys(currentLabels);
        for (i = 0; i < labelNames.length; i++) {

          var defLabelName = labelNames[i];
          if (!currentLabels[defLabelName]["(blockscoped)"] &&
            currentLabels[defLabelName]["(type)"] !== "exception" &&
            !this.funct.has(defLabelName, { excludeCurrent: true })) {
            subScope["(labels)"][defLabelName] = currentLabels[defLabelName];
            if (_currentFunctBody["(type)"] !== "global") {
              subScope["(labels)"][defLabelName]["(useOutsideOfScope)"] = true;
            }
            delete currentLabels[defLabelName];
          }
        }
      }

      _checkForUnused();

      _scopeStack.pop();
      if (isUnstackingFunctionBody) {
        _currentFunctBody = _scopeStack[_.findLastIndex(_scopeStack, function(scope) {
          return scope["(isFuncBody)"] || scope["(type)"] === "global";
        })];
      }

      _current = subScope;
    },
    addParam: function(labelName, token, type) {
      type = type || "param";

      if (type === "exception") {
        var previouslyDefinedLabelType = this.funct.labeltype(labelName);
        if (previouslyDefinedLabelType && previouslyDefinedLabelType !== "exception") {
          if (!state.option.node) {
            warning("W002", state.tokens.next, labelName);
          }
        }
      }
      if (_.has(_current["(labels)"], labelName)) {
        _current["(labels)"][labelName].duplicated = true;
      } else {
        _checkOuterShadow(labelName, token, type);

        _current["(labels)"][labelName] = {
          "(type)" : type,
          "(token)": token,
          "(unused)": true };

        _current["(params)"].push(labelName);
      }

      if (_.has(_current["(usages)"], labelName)) {
        var usage = _current["(usages)"][labelName];
        if (usage["(onlyUsedSubFunction)"]) {
          _latedefWarning(type, labelName, token);
        } else {
          warning("E056", token, labelName, type);
        }
      }
    },

    validateParams: function() {
      if (_currentFunctBody["(type)"] === "global") {
        return;
      }

      var isStrict = state.isStrict();
      var currentFunctParamScope = _currentFunctBody["(parent)"];

      if (!currentFunctParamScope["(params)"]) {
        return;
      }

      currentFunctParamScope["(params)"].forEach(function(labelName) {
        var label = currentFunctParamScope["(labels)"][labelName];

        if (label && label.duplicated) {
          if (isStrict) {
            warning("E011", label["(token)"], labelName);
          } else if (state.option.shadow !== true) {
            warning("W004", label["(token)"], labelName);
          }
        }
      });
    },

    getUsedOrDefinedGlobals: function() {
      var list = Object.keys(usedPredefinedAndGlobals);
      if (usedPredefinedAndGlobals.__proto__ === marker &&
        list.indexOf("__proto__") === -1) {
        list.push("__proto__");
      }

      return list;
    },
    getImpliedGlobals: function() {
      var values = _.values(impliedGlobals);
      var hasProto = false;
      if (impliedGlobals.__proto__) {
        hasProto = values.some(function(value) {
          return value.name === "__proto__";
        });

        if (!hasProto) {
          values.push(impliedGlobals.__proto__);
        }
      }

      return values;
    },
    getUnuseds: function() {
      return unuseds;
    },

    has: function(labelName) {
      return Boolean(_getLabel(labelName));
    },

    labeltype: function(labelName) {
      var scopeLabels = _getLabel(labelName);
      if (scopeLabels) {
        return scopeLabels[labelName]["(type)"];
      }
      return null;
    },
    addExported: function(labelName) {
      var globalLabels = _scopeStack[0]["(labels)"];
      if (_.has(declared, labelName)) {
        delete declared[labelName];
      } else if (_.has(globalLabels, labelName)) {
        globalLabels[labelName]["(unused)"] = false;
      } else {
        for (var i = 1; i < _scopeStack.length; i++) {
          var scope = _scopeStack[i];
          if (!scope["(type)"]) {
            if (_.has(scope["(labels)"], labelName) &&
                !scope["(labels)"][labelName]["(blockscoped)"]) {
              scope["(labels)"][labelName]["(unused)"] = false;
              return;
            }
          } else {
            break;
          }
        }
        exported[labelName] = true;
      }
    },
    setExported: function(labelName, token) {
      this.block.use(labelName, token);
    },
    addlabel: function(labelName, opts) {

      var type  = opts.type;
      var token = opts.token;
      var isblockscoped = type === "let" || type === "const" || type === "class";
      var isexported    = (isblockscoped ? _current : _currentFunctBody)["(type)"] === "global" &&
                          _.has(exported, labelName);
      _checkOuterShadow(labelName, token, type);
      if (isblockscoped) {

        var declaredInCurrentScope = _current["(labels)"][labelName];
        if (!declaredInCurrentScope && _current === _currentFunctBody &&
          _current["(type)"] !== "global") {
          declaredInCurrentScope = !!_currentFunctBody["(parent)"]["(labels)"][labelName];
        }
        if (!declaredInCurrentScope && _current["(usages)"][labelName]) {
          var usage = _current["(usages)"][labelName];
          if (usage["(onlyUsedSubFunction)"]) {
            _latedefWarning(type, labelName, token);
          } else {
            warning("E056", token, labelName, type);
          }
        }
        if (declaredInCurrentScope) {
          warning("E011", token, labelName);
        }
        else if (state.option.shadow === "outer") {
          if (scopeManagerInst.funct.has(labelName)) {
            warning("W004", token, labelName);
          }
        }

        scopeManagerInst.block.add(labelName, type, token, !isexported);

      } else {

        var declaredInCurrentFunctionScope = scopeManagerInst.funct.has(labelName);
        if (!declaredInCurrentFunctionScope && usedSoFarInCurrentFunction(labelName)) {
          _latedefWarning(type, labelName, token);
        }
        if (scopeManagerInst.funct.has(labelName, { onlyBlockscoped: true })) {
          warning("E011", token, labelName);
        } else if (state.option.shadow !== true) {
          if (declaredInCurrentFunctionScope && labelName !== "__proto__") {
            if (_currentFunctBody["(type)"] !== "global") {
              warning("W004", token, labelName);
            }
          }
        }

        scopeManagerInst.funct.add(labelName, type, token, !isexported);

        if (_currentFunctBody["(type)"] === "global") {
          usedPredefinedAndGlobals[labelName] = marker;
        }
      }
    },

    funct: {
      labeltype: function(labelName, options) {
        var onlyBlockscoped = options && options.onlyBlockscoped;
        var excludeParams = options && options.excludeParams;
        var currentScopeIndex = _scopeStack.length - (options && options.excludeCurrent ? 2 : 1);
        for (var i = currentScopeIndex; i >= 0; i--) {
          var current = _scopeStack[i];
          if (current["(labels)"][labelName] &&
            (!onlyBlockscoped || current["(labels)"][labelName]["(blockscoped)"])) {
            return current["(labels)"][labelName]["(type)"];
          }
          var scopeCheck = excludeParams ? _scopeStack[ i - 1 ] : current;
          if (scopeCheck && scopeCheck["(type)"] === "functionparams") {
            return null;
          }
        }
        return null;
      },
      hasBreakLabel: function(labelName) {
        for (var i = _scopeStack.length - 1; i >= 0; i--) {
          var current = _scopeStack[i];

          if (current["(breakLabels)"][labelName]) {
            return true;
          }
          if (current["(type)"] === "functionparams") {
            return false;
          }
        }
        return false;
      },
      has: function(labelName, options) {
        return Boolean(this.labeltype(labelName, options));
      },
      add: function(labelName, type, tok, unused) {
        _current["(labels)"][labelName] = {
          "(type)" : type,
          "(token)": tok,
          "(blockscoped)": false,
          "(function)": _currentFunctBody,
          "(unused)": unused };
      }
    },

    block: {
      isGlobal: function() {
        return _current["(type)"] === "global";
      },

      use: function(labelName, token) {
        var paramScope = _currentFunctBody["(parent)"];
        if (paramScope && paramScope["(labels)"][labelName] &&
          paramScope["(labels)"][labelName]["(type)"] === "param") {
          if (!scopeManagerInst.funct.has(labelName,
                { excludeParams: true, onlyBlockscoped: true })) {
            paramScope["(labels)"][labelName]["(unused)"] = false;
          }
        }

        if (token && (state.ignored.W117 || state.option.undef === false)) {
          token.ignoreUndef = true;
        }

        _setupUsages(labelName);

        if (token) {
          token["(function)"] = _currentFunctBody;
          _current["(usages)"][labelName]["(tokens)"].push(token);
        }
      },

      reassign: function(labelName, token) {

        this.modify(labelName, token);

        _current["(usages)"][labelName]["(reassigned)"].push(token);
      },

      modify: function(labelName, token) {

        _setupUsages(labelName);

        _current["(usages)"][labelName]["(modified)"].push(token);
      },
      add: function(labelName, type, tok, unused) {
        _current["(labels)"][labelName] = {
          "(type)" : type,
          "(token)": tok,
          "(blockscoped)": true,
          "(unused)": unused };
      },

      addBreakLabel: function(labelName, opts) {
        var token = opts.token;
        if (scopeManagerInst.funct.hasBreakLabel(labelName)) {
          warning("E011", token, labelName);
        }
        else if (state.option.shadow === "outer") {
          if (scopeManagerInst.funct.has(labelName)) {
            warning("W004", token, labelName);
          } else {
            _checkOuterShadow(labelName, token);
          }
        }
        _current["(breakLabels)"][labelName] = token;
      }
    }
  };
  return scopeManagerInst;
};

module.exports = scopeManager;

},{"../lodash":"/node_modules/jshint/lodash.js","events":"/node_modules/browserify/node_modules/events/events.js"}],"/node_modules/jshint/src/state.js":[function(_dereq_,module,exports){
"use strict";
var NameStack = _dereq_("./name-stack.js");

var state = {
  syntax: {},
  isStrict: function() {
    return this.directive["use strict"] || this.inClassBody ||
      this.option.module || this.option.strict === "implied";
  },

  inMoz: function() {
    return this.option.moz;
  },
  inES6: function() {
    return this.option.moz || this.option.esversion >= 6;
  },
  inES5: function(strict) {
    if (strict) {
      return (!this.option.esversion || this.option.esversion === 5) && !this.option.moz;
    }
    return !this.option.esversion || this.option.esversion >= 5 || this.option.moz;
  },


  reset: function() {
    this.tokens = {
      prev: null,
      next: null,
      curr: null
    };

    this.option = {};
    this.funct = null;
    this.ignored = {};
    this.directive = {};
    this.jsonMode = false;
    this.jsonWarnings = [];
    this.lines = [];
    this.tab = "";
    this.cache = {}; // Node.JS doesn't have Map. Sniff.
    this.ignoredLines = {};
    this.forinifcheckneeded = false;
    this.nameStack = new NameStack();
    this.inClassBody = false;
  }
};

exports.state = state;

},{"./name-stack.js":"/node_modules/jshint/src/name-stack.js"}],"/node_modules/jshint/src/style.js":[function(_dereq_,module,exports){
"use strict";

exports.register = function(linter) {

  linter.on("Identifier", function style_scanProto(data) {
    if (linter.getOption("proto")) {
      return;
    }

    if (data.name === "__proto__") {
      linter.warn("W103", {
        line: data.line,
        char: data.char,
        data: [ data.name, "6" ]
      });
    }
  });

  linter.on("Identifier", function style_scanIterator(data) {
    if (linter.getOption("iterator")) {
      return;
    }

    if (data.name === "__iterator__") {
      linter.warn("W103", {
        line: data.line,
        char: data.char,
        data: [ data.name ]
      });
    }
  });

  linter.on("Identifier", function style_scanCamelCase(data) {
    if (!linter.getOption("camelcase")) {
      return;
    }

    if (data.name.replace(/^_+|_+$/g, "").indexOf("_") > -1 && !data.name.match(/^[A-Z0-9_]*$/)) {
      linter.warn("W106", {
        line: data.line,
        char: data.from,
        data: [ data.name ]
      });
    }
  });

  linter.on("String", function style_scanQuotes(data) {
    var quotmark = linter.getOption("quotmark");
    var code;

    if (!quotmark) {
      return;
    }

    if (quotmark === "single" && data.quote !== "'") {
      code = "W109";
    }

    if (quotmark === "double" && data.quote !== "\"") {
      code = "W108";
    }

    if (quotmark === true) {
      if (!linter.getCache("quotmark")) {
        linter.setCache("quotmark", data.quote);
      }

      if (linter.getCache("quotmark") !== data.quote) {
        code = "W110";
      }
    }

    if (code) {
      linter.warn(code, {
        line: data.line,
        char: data.char,
      });
    }
  });

  linter.on("Number", function style_scanNumbers(data) {
    if (data.value.charAt(0) === ".") {
      linter.warn("W008", {
        line: data.line,
        char: data.char,
        data: [ data.value ]
      });
    }

    if (data.value.substr(data.value.length - 1) === ".") {
      linter.warn("W047", {
        line: data.line,
        char: data.char,
        data: [ data.value ]
      });
    }

    if (/^00+/.test(data.value)) {
      linter.warn("W046", {
        line: data.line,
        char: data.char,
        data: [ data.value ]
      });
    }
  });

  linter.on("String", function style_scanJavaScriptURLs(data) {
    var re = /^(?:javascript|jscript|ecmascript|vbscript|livescript)\s*:/i;

    if (linter.getOption("scripturl")) {
      return;
    }

    if (re.test(data.value)) {
      linter.warn("W107", {
        line: data.line,
        char: data.char
      });
    }
  });
};

},{}],"/node_modules/jshint/src/vars.js":[function(_dereq_,module,exports){

"use strict";

exports.reservedVars = {
  arguments : false,
  NaN       : false
};

exports.ecmaIdentifiers = {
  3: {
    Array              : false,
    Boolean            : false,
    Date               : false,
    decodeURI          : false,
    decodeURIComponent : false,
    encodeURI          : false,
    encodeURIComponent : false,
    Error              : false,
    "eval"             : false,
    EvalError          : false,
    Function           : false,
    hasOwnProperty     : false,
    isFinite           : false,
    isNaN              : false,
    Math               : false,
    Number             : false,
    Object             : false,
    parseInt           : false,
    parseFloat         : false,
    RangeError         : false,
    ReferenceError     : false,
    RegExp             : false,
    String             : false,
    SyntaxError        : false,
    TypeError          : false,
    URIError           : false
  },
  5: {
    JSON               : false
  },
  6: {
    Map                : false,
    Promise            : false,
    Proxy              : false,
    Reflect            : false,
    Set                : false,
    Symbol             : false,
    WeakMap            : false,
    WeakSet            : false
  }
};

exports.browser = {
  Audio                : false,
  Blob                 : false,
  addEventListener     : false,
  applicationCache     : false,
  atob                 : false,
  blur                 : false,
  btoa                 : false,
  cancelAnimationFrame : false,
  CanvasGradient       : false,
  CanvasPattern        : false,
  CanvasRenderingContext2D: false,
  CSS                  : false,
  clearInterval        : false,
  clearTimeout         : false,
  close                : false,
  closed               : false,
  Comment              : false,
  CustomEvent          : false,
  DOMParser            : false,
  defaultStatus        : false,
  Document             : false,
  document             : false,
  DocumentFragment     : false,
  Element              : false,
  ElementTimeControl   : false,
  Event                : false,
  event                : false,
  fetch                : false,
  FileReader           : false,
  FormData             : false,
  focus                : false,
  frames               : false,
  getComputedStyle     : false,
  HTMLElement          : false,
  HTMLAnchorElement    : false,
  HTMLBaseElement      : false,
  HTMLBlockquoteElement: false,
  HTMLBodyElement      : false,
  HTMLBRElement        : false,
  HTMLButtonElement    : false,
  HTMLCanvasElement    : false,
  HTMLCollection       : false,
  HTMLDirectoryElement : false,
  HTMLDivElement       : false,
  HTMLDListElement     : false,
  HTMLFieldSetElement  : false,
  HTMLFontElement      : false,
  HTMLFormElement      : false,
  HTMLFrameElement     : false,
  HTMLFrameSetElement  : false,
  HTMLHeadElement      : false,
  HTMLHeadingElement   : false,
  HTMLHRElement        : false,
  HTMLHtmlElement      : false,
  HTMLIFrameElement    : false,
  HTMLImageElement     : false,
  HTMLInputElement     : false,
  HTMLIsIndexElement   : false,
  HTMLLabelElement     : false,
  HTMLLayerElement     : false,
  HTMLLegendElement    : false,
  HTMLLIElement        : false,
  HTMLLinkElement      : false,
  HTMLMapElement       : false,
  HTMLMenuElement      : false,
  HTMLMetaElement      : false,
  HTMLModElement       : false,
  HTMLObjectElement    : false,
  HTMLOListElement     : false,
  HTMLOptGroupElement  : false,
  HTMLOptionElement    : false,
  HTMLParagraphElement : false,
  HTMLParamElement     : false,
  HTMLPreElement       : false,
  HTMLQuoteElement     : false,
  HTMLScriptElement    : false,
  HTMLSelectElement    : false,
  HTMLStyleElement     : false,
  HTMLTableCaptionElement: false,
  HTMLTableCellElement : false,
  HTMLTableColElement  : false,
  HTMLTableElement     : false,
  HTMLTableRowElement  : false,
  HTMLTableSectionElement: false,
  HTMLTemplateElement  : false,
  HTMLTextAreaElement  : false,
  HTMLTitleElement     : false,
  HTMLUListElement     : false,
  HTMLVideoElement     : false,
  history              : false,
  Image                : false,
  Intl                 : false,
  length               : false,
  localStorage         : false,
  location             : false,
  matchMedia           : false,
  MessageChannel       : false,
  MessageEvent         : false,
  MessagePort          : false,
  MouseEvent           : false,
  moveBy               : false,
  moveTo               : false,
  MutationObserver     : false,
  name                 : false,
  Node                 : false,
  NodeFilter           : false,
  NodeList             : false,
  Notification         : false,
  navigator            : false,
  onbeforeunload       : true,
  onblur               : true,
  onerror              : true,
  onfocus              : true,
  onload               : true,
  onresize             : true,
  onunload             : true,
  open                 : false,
  openDatabase         : false,
  opener               : false,
  Option               : false,
  parent               : false,
  performance          : false,
  print                : false,
  Range                : false,
  requestAnimationFrame : false,
  removeEventListener  : false,
  resizeBy             : false,
  resizeTo             : false,
  screen               : false,
  scroll               : false,
  scrollBy             : false,
  scrollTo             : false,
  sessionStorage       : false,
  setInterval          : false,
  setTimeout           : false,
  SharedWorker         : false,
  status               : false,
  SVGAElement          : false,
  SVGAltGlyphDefElement: false,
  SVGAltGlyphElement   : false,
  SVGAltGlyphItemElement: false,
  SVGAngle             : false,
  SVGAnimateColorElement: false,
  SVGAnimateElement    : false,
  SVGAnimateMotionElement: false,
  SVGAnimateTransformElement: false,
  SVGAnimatedAngle     : false,
  SVGAnimatedBoolean   : false,
  SVGAnimatedEnumeration: false,
  SVGAnimatedInteger   : false,
  SVGAnimatedLength    : false,
  SVGAnimatedLengthList: false,
  SVGAnimatedNumber    : false,
  SVGAnimatedNumberList: false,
  SVGAnimatedPathData  : false,
  SVGAnimatedPoints    : false,
  SVGAnimatedPreserveAspectRatio: false,
  SVGAnimatedRect      : false,
  SVGAnimatedString    : false,
  SVGAnimatedTransformList: false,
  SVGAnimationElement  : false,
  SVGCSSRule           : false,
  SVGCircleElement     : false,
  SVGClipPathElement   : false,
  SVGColor             : false,
  SVGColorProfileElement: false,
  SVGColorProfileRule  : false,
  SVGComponentTransferFunctionElement: false,
  SVGCursorElement     : false,
  SVGDefsElement       : false,
  SVGDescElement       : false,
  SVGDocument          : false,
  SVGElement           : false,
  SVGElementInstance   : false,
  SVGElementInstanceList: false,
  SVGEllipseElement    : false,
  SVGExternalResourcesRequired: false,
  SVGFEBlendElement    : false,
  SVGFEColorMatrixElement: false,
  SVGFEComponentTransferElement: false,
  SVGFECompositeElement: false,
  SVGFEConvolveMatrixElement: false,
  SVGFEDiffuseLightingElement: false,
  SVGFEDisplacementMapElement: false,
  SVGFEDistantLightElement: false,
  SVGFEFloodElement    : false,
  SVGFEFuncAElement    : false,
  SVGFEFuncBElement    : false,
  SVGFEFuncGElement    : false,
  SVGFEFuncRElement    : false,
  SVGFEGaussianBlurElement: false,
  SVGFEImageElement    : false,
  SVGFEMergeElement    : false,
  SVGFEMergeNodeElement: false,
  SVGFEMorphologyElement: false,
  SVGFEOffsetElement   : false,
  SVGFEPointLightElement: false,
  SVGFESpecularLightingElement: false,
  SVGFESpotLightElement: false,
  SVGFETileElement     : false,
  SVGFETurbulenceElement: false,
  SVGFilterElement     : false,
  SVGFilterPrimitiveStandardAttributes: false,
  SVGFitToViewBox      : false,
  SVGFontElement       : false,
  SVGFontFaceElement   : false,
  SVGFontFaceFormatElement: false,
  SVGFontFaceNameElement: false,
  SVGFontFaceSrcElement: false,
  SVGFontFaceUriElement: false,
  SVGForeignObjectElement: false,
  SVGGElement          : false,
  SVGGlyphElement      : false,
  SVGGlyphRefElement   : false,
  SVGGradientElement   : false,
  SVGHKernElement      : false,
  SVGICCColor          : false,
  SVGImageElement      : false,
  SVGLangSpace         : false,
  SVGLength            : false,
  SVGLengthList        : false,
  SVGLineElement       : false,
  SVGLinearGradientElement: false,
  SVGLocatable         : false,
  SVGMPathElement      : false,
  SVGMarkerElement     : false,
  SVGMaskElement       : false,
  SVGMatrix            : false,
  SVGMetadataElement   : false,
  SVGMissingGlyphElement: false,
  SVGNumber            : false,
  SVGNumberList        : false,
  SVGPaint             : false,
  SVGPathElement       : false,
  SVGPathSeg           : false,
  SVGPathSegArcAbs     : false,
  SVGPathSegArcRel     : false,
  SVGPathSegClosePath  : false,
  SVGPathSegCurvetoCubicAbs: false,
  SVGPathSegCurvetoCubicRel: false,
  SVGPathSegCurvetoCubicSmoothAbs: false,
  SVGPathSegCurvetoCubicSmoothRel: false,
  SVGPathSegCurvetoQuadraticAbs: false,
  SVGPathSegCurvetoQuadraticRel: false,
  SVGPathSegCurvetoQuadraticSmoothAbs: false,
  SVGPathSegCurvetoQuadraticSmoothRel: false,
  SVGPathSegLinetoAbs  : false,
  SVGPathSegLinetoHorizontalAbs: false,
  SVGPathSegLinetoHorizontalRel: false,
  SVGPathSegLinetoRel  : false,
  SVGPathSegLinetoVerticalAbs: false,
  SVGPathSegLinetoVerticalRel: false,
  SVGPathSegList       : false,
  SVGPathSegMovetoAbs  : false,
  SVGPathSegMovetoRel  : false,
  SVGPatternElement    : false,
  SVGPoint             : false,
  SVGPointList         : false,
  SVGPolygonElement    : false,
  SVGPolylineElement   : false,
  SVGPreserveAspectRatio: false,
  SVGRadialGradientElement: false,
  SVGRect              : false,
  SVGRectElement       : false,
  SVGRenderingIntent   : false,
  SVGSVGElement        : false,
  SVGScriptElement     : false,
  SVGSetElement        : false,
  SVGStopElement       : false,
  SVGStringList        : false,
  SVGStylable          : false,
  SVGStyleElement      : false,
  SVGSwitchElement     : false,
  SVGSymbolElement     : false,
  SVGTRefElement       : false,
  SVGTSpanElement      : false,
  SVGTests             : false,
  SVGTextContentElement: false,
  SVGTextElement       : false,
  SVGTextPathElement   : false,
  SVGTextPositioningElement: false,
  SVGTitleElement      : false,
  SVGTransform         : false,
  SVGTransformList     : false,
  SVGTransformable     : false,
  SVGURIReference      : false,
  SVGUnitTypes         : false,
  SVGUseElement        : false,
  SVGVKernElement      : false,
  SVGViewElement       : false,
  SVGViewSpec          : false,
  SVGZoomAndPan        : false,
  Text                 : false,
  TextDecoder          : false,
  TextEncoder          : false,
  TimeEvent            : false,
  top                  : false,
  URL                  : false,
  WebGLActiveInfo      : false,
  WebGLBuffer          : false,
  WebGLContextEvent    : false,
  WebGLFramebuffer     : false,
  WebGLProgram         : false,
  WebGLRenderbuffer    : false,
  WebGLRenderingContext: false,
  WebGLShader          : false,
  WebGLShaderPrecisionFormat: false,
  WebGLTexture         : false,
  WebGLUniformLocation : false,
  WebSocket            : false,
  window               : false,
  Window               : false,
  Worker               : false,
  XDomainRequest       : false,
  XMLHttpRequest       : false,
  XMLSerializer        : false,
  XPathEvaluator       : false,
  XPathException       : false,
  XPathExpression      : false,
  XPathNamespace       : false,
  XPathNSResolver      : false,
  XPathResult          : false
};

exports.devel = {
  alert  : false,
  confirm: false,
  console: false,
  Debug  : false,
  opera  : false,
  prompt : false
};

exports.worker = {
  importScripts  : true,
  postMessage    : true,
  self           : true,
  FileReaderSync : true
};
exports.nonstandard = {
  escape  : false,
  unescape: false
};

exports.couch = {
  "require" : false,
  respond   : false,
  getRow    : false,
  emit      : false,
  send      : false,
  start     : false,
  sum       : false,
  log       : false,
  exports   : false,
  module    : false,
  provides  : false
};

exports.node = {
  __filename    : false,
  __dirname     : false,
  GLOBAL        : false,
  global        : false,
  module        : false,
  require       : false,

  Buffer        : true,
  console       : true,
  exports       : true,
  process       : true,
  setTimeout    : true,
  clearTimeout  : true,
  setInterval   : true,
  clearInterval : true,
  setImmediate  : true, // v0.9.1+
  clearImmediate: true  // v0.9.1+
};

exports.browserify = {
  __filename    : false,
  __dirname     : false,
  global        : false,
  module        : false,
  require       : false,
  Buffer        : true,
  exports       : true,
  process       : true
};

exports.phantom = {
  phantom      : true,
  require      : true,
  WebPage      : true,
  console      : true, // in examples, but undocumented
  exports      : true  // v1.7+
};

exports.qunit = {
  asyncTest      : false,
  deepEqual      : false,
  equal          : false,
  expect         : false,
  module         : false,
  notDeepEqual   : false,
  notEqual       : false,
  notPropEqual   : false,
  notStrictEqual : false,
  ok             : false,
  propEqual      : false,
  QUnit          : false,
  raises         : false,
  start          : false,
  stop           : false,
  strictEqual    : false,
  test           : false,
  "throws"       : false
};

exports.rhino = {
  defineClass  : false,
  deserialize  : false,
  gc           : false,
  help         : false,
  importClass  : false,
  importPackage: false,
  "java"       : false,
  load         : false,
  loadClass    : false,
  Packages     : false,
  print        : false,
  quit         : false,
  readFile     : false,
  readUrl      : false,
  runCommand   : false,
  seal         : false,
  serialize    : false,
  spawn        : false,
  sync         : false,
  toint32      : false,
  version      : false
};

exports.shelljs = {
  target       : false,
  echo         : false,
  exit         : false,
  cd           : false,
  pwd          : false,
  ls           : false,
  find         : false,
  cp           : false,
  rm           : false,
  mv           : false,
  mkdir        : false,
  test         : false,
  cat          : false,
  sed          : false,
  grep         : false,
  which        : false,
  dirs         : false,
  pushd        : false,
  popd         : false,
  env          : false,
  exec         : false,
  chmod        : false,
  config       : false,
  error        : false,
  tempdir      : false
};

exports.typed = {
  ArrayBuffer         : false,
  ArrayBufferView     : false,
  DataView            : false,
  Float32Array        : false,
  Float64Array        : false,
  Int16Array          : false,
  Int32Array          : false,
  Int8Array           : false,
  Uint16Array         : false,
  Uint32Array         : false,
  Uint8Array          : false,
  Uint8ClampedArray   : false
};

exports.wsh = {
  ActiveXObject            : true,
  Enumerator               : true,
  GetObject                : true,
  ScriptEngine             : true,
  ScriptEngineBuildVersion : true,
  ScriptEngineMajorVersion : true,
  ScriptEngineMinorVersion : true,
  VBArray                  : true,
  WSH                      : true,
  WScript                  : true,
  XDomainRequest           : true
};

exports.dojo = {
  dojo     : false,
  dijit    : false,
  dojox    : false,
  define   : false,
  "require": false
};

exports.jquery = {
  "$"    : false,
  jQuery : false
};

exports.mootools = {
  "$"           : false,
  "$$"          : false,
  Asset         : false,
  Browser       : false,
  Chain         : false,
  Class         : false,
  Color         : false,
  Cookie        : false,
  Core          : false,
  Document      : false,
  DomReady      : false,
  DOMEvent      : false,
  DOMReady      : false,
  Drag          : false,
  Element       : false,
  Elements      : false,
  Event         : false,
  Events        : false,
  Fx            : false,
  Group         : false,
  Hash          : false,
  HtmlTable     : false,
  IFrame        : false,
  IframeShim    : false,
  InputValidator: false,
  instanceOf    : false,
  Keyboard      : false,
  Locale        : false,
  Mask          : false,
  MooTools      : false,
  Native        : false,
  Options       : false,
  OverText      : false,
  Request       : false,
  Scroller      : false,
  Slick         : false,
  Slider        : false,
  Sortables     : false,
  Spinner       : false,
  Swiff         : false,
  Tips          : false,
  Type          : false,
  typeOf        : false,
  URI           : false,
  Window        : false
};

exports.prototypejs = {
  "$"               : false,
  "$$"              : false,
  "$A"              : false,
  "$F"              : false,
  "$H"              : false,
  "$R"              : false,
  "$break"          : false,
  "$continue"       : false,
  "$w"              : false,
  Abstract          : false,
  Ajax              : false,
  Class             : false,
  Enumerable        : false,
  Element           : false,
  Event             : false,
  Field             : false,
  Form              : false,
  Hash              : false,
  Insertion         : false,
  ObjectRange       : false,
  PeriodicalExecuter: false,
  Position          : false,
  Prototype         : false,
  Selector          : false,
  Template          : false,
  Toggle            : false,
  Try               : false,
  Autocompleter     : false,
  Builder           : false,
  Control           : false,
  Draggable         : false,
  Draggables        : false,
  Droppables        : false,
  Effect            : false,
  Sortable          : false,
  SortableObserver  : false,
  Sound             : false,
  Scriptaculous     : false
};

exports.yui = {
  YUI       : false,
  Y         : false,
  YUI_config: false
};

exports.mocha = {
  mocha       : false,
  describe    : false,
  xdescribe   : false,
  it          : false,
  xit         : false,
  context     : false,
  xcontext    : false,
  before      : false,
  after       : false,
  beforeEach  : false,
  afterEach   : false,
  suite         : false,
  test          : false,
  setup         : false,
  teardown      : false,
  suiteSetup    : false,
  suiteTeardown : false
};

exports.jasmine = {
  jasmine     : false,
  describe    : false,
  xdescribe   : false,
  it          : false,
  xit         : false,
  beforeEach  : false,
  afterEach   : false,
  setFixtures : false,
  loadFixtures: false,
  spyOn       : false,
  expect      : false,
  runs        : false,
  waitsFor    : false,
  waits       : false,
  beforeAll   : false,
  afterAll    : false,
  fail        : false,
  fdescribe   : false,
  fit         : false,
  pending     : false
};

},{}]},{},["/node_modules/jshint/src/jshint.js"]);

});

define("ace/mode/javascript_worker",["require","exports","module","ace/lib/oop","ace/worker/mirror","ace/mode/javascript/jshint"], function(require, exports, module) {
"use strict";

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

/*node module.exports = jslint;*/


var oop = require("../lib/oop");
var Mirror = require("../worker/mirror").Mirror;
var lint = require("./javascript/jshint").JSHINT;

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

var JavaScriptWorker = exports.JavaScriptWorker = function(sender) {
    Mirror.call(this, sender);
    this.setTimeout(500);
    this.setOptions();
};

oop.inherits(JavaScriptWorker, Mirror);

(function() {
    this.setOptions = function(options) {
        this.options = options || {
            esnext: true,
            moz: true,
            devel: true,
            browser: true,
            node: true,
            laxcomma: true,
            laxbreak: true,
            lastsemic: true,
            onevar: false,
            passfail: false,
            maxerr: 100,
            expr: true,
            multistr: true,
            globalstrict: true
        };
        this.doc.getValue() && this.deferredUpdate.schedule(100);
    };

    this.changeOptions = function(newOptions) {
        oop.mixin(this.options, newOptions);
        this.doc.getValue() && this.deferredUpdate.schedule(100);
    };

    this.isValidJS = function(str) {
        try {
            eval("throw 0;" + str);
        } catch(e) {
            if (e === 0)
                return true;
        }
        return false
    };

    this.onUpdate = function() {
        var value = this.doc.getValue();
        value = value.replace(/^#!.*\n/, "\n");
        if (!value)
            return this.sender.emit("annotate", []);

        var errors = [];
        var maxErrorLevel = this.isValidJS(value) ? "warning" : "error";
        var jslint_results = jslint(value, this.options);
        var results = jslint_results.warnings;

        var errorAdded = false
        for (var i = 0; i < results.length; i++) {
            var error = results[i];
            if (!error)
                continue;
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
            }
            else if (disabledWarningsRe.test(raw)) {
                continue;
            }
            else if (infoRe.test(raw)) {
                type = "info"
            }
            else if (errorsRe.test(raw)) {
                errorAdded  = true;
                type = maxErrorLevel;
            }
            else if (raw == "'{a}' is not defined.") {
                type = "warning";
            }
            else if (raw == "'{a}' is defined but never used.") {
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

        this.sender.emit("annotate", errors);
    };

}).call(JavaScriptWorker.prototype);

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
