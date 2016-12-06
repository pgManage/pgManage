(function(){
    "use strict";

	var _ = require('./underscore_min.js');

    // formatSql object
    var _formatsql = {}

    var _defaultOptions = {
        cursurReturnToken: '\n',
        scopeTabCoefficient: 1,
        linebreakKeywords: [
            {
                keyword: "SELECT",
                tabBefore: true,
				newlineBefore: true,
                newlinesAfter: false
            },
            {
                keyword: "INSERT",
                tabBefore: true,
				newlineBefore: true,
                newlineAfter: false
            },
            {
                keyword: "FROM",
                tabBefore: true,
				newlineBefore: true,
                newlineAfter: false
            },
            {
                keyword: "WHERE",
                tabBefore: true,
				newlineBefore: true,
                newlineAfter: false
            },
            {
                keyword: "ORDER BY",
                tabBefore: true,
				newlineBefore: true,
                newlineAfter: false
            },
            {
                keyword: "GROUP BY",
                tabBefore: true,
			   	newlineBefore: true,
                newlineAfter: false
            },
            {
                keyword: "HAVING",
                tabBefore: true,
			   	newlineBefore: true,
                newlineAfter: false
            },
            {
                keyword: "FETCH",
                tabBefore: true,
				newlineBefore: true,
                newlineAfter: false
            },
            {
                keyword: "UPDATE",
                tabBefore: true,
				newlineBefore: true,
                newlineAfter: false
            },
            {
                keyword: "DELETE",
                tabBefore: true,
				newlineBefore: true,
                newlineAfter: false
            },
			/*
            {
                keyword: "INNER JOIN",
                tabBefore: true,
				newlineBefore: true,
                newlineAfter: false
            },
            {
                keyword: "LEFT OUTER JOIN",
                tabBefore: true,
				newlineBefore: true,
                newlineAfter: false
            },
            {
                keyword: "LEFT JOIN",
                tabBefore: true,
				newlineBefore: true,
                newlineAfter: false
            },
            {
                keyword: "RIGHT OUTER JOIN",
                tabBefore: true,
				newlineBefore: true,
                newlineAfter: false
            },
            {
                keyword: "RIGHT JOIN",
                tabBefore: true,
				newlineBefore: true,
                newlineAfter: false
            },*/
            {
                keyword: "(LEFT|LEFT\\sOUTER|RIGHT|RIGHT\\sOUTER|INNER)? ?JOIN",
                tabBefore: true,
				newlineBefore: true,
                newlineAfter: false
            },
            {
                keyword: "AND",
                tabBefore: true,
				newlineBefore: true,
                newlineAfter: false
            },
            {
                keyword: "OR",
                tabBefore: true,
				newlineBefore: true,
                newlineAfter: false
            },
            {
                keyword: "SET",
                tabBefore: true,
				newlineBefore: true,
                newlineAfter: false
            },
            {
                keyword: "ON",
                tabBefore: false,
				newlineBefore: false,
                newlineAfter: false
            },
			{
                keyword: "AS",
                tabBefore: false,
				newlineBefore: false,
                newlineAfter: false
            }
        ]

    };


    _formatsql.formatQuery = function(inputText){
        var outputText = ' ' + _formatsql.normalizeWhiteSpace(_removeComments(inputText));

        outputText = _addLineBreaksBeta(outputText);
        outputText = trimString(outputText);
        return outputText;
    };

    _formatsql.normalizeWhiteSpace = function(inputText){
        var outputText = "";

        if(inputText.length > 0){
            var isWhitespace = /\s/.test(inputText[0]);
            var inLiteral = false;


            for(var i = 0; i < inputText.length; i++){
                if(!inLiteral){
                    if(isWhitespace !== true || !/\s/.test(inputText[i])){
                        var nextChar = inputText[i];

                        if(/\s/.test(nextChar)) { nextChar = ' '; }

                        outputText += nextChar;
                    }
                    isWhitespace = /\s/.test(inputText[i]);
                }
                else{
                    isWhitespace = false;

                    outputText += inputText[i];
                }
                if(/['"]/.test(inputText[i])) { inLiteral = !inLiteral; }
            }
        }
        return outputText;
    };


    //WARNING: This doesn't take literals in effect. It assumes -- doesn't take place within a literal
    var _removeComments = function(inputText){
        var outputText = "";
        var cur = "";
        var tail = inputText;

        while(tail.length > 0){
            //grab next line to look at and place it into cur
            var lineEnd = tail.indexOf(_defaultOptions.cursurReturnToken);
            if(lineEnd > -1){
                cur = tail.substring(0, lineEnd + _defaultOptions.cursurReturnToken.length);
                tail = tail.substring(lineEnd + _defaultOptions.cursurReturnToken.length);
            }
            else {
                cur = tail;
                tail = "";
            }

            //check to see if there is a comment
            var commentStart = cur.indexOf('--');

            if(commentStart > -1) {
                outputText += cur.substring(0, commentStart) + _defaultOptions.cursurReturnToken;
            }
            else {
                outputText += cur;
            }
        }

        return outputText;
    };

    var _addLineBreaksBeta = function(inputText){
        // split text by single quotes. even indexes are now outside of literals. Odd indexes are now inside of literals.
        var quoteSplit = inputText.split("'").map(function(str, index){
            return {"sortOrder": index, "value": str };
        });

        var nonLiterals = quoteSplit.filter(function(value){
            return value.sortOrder % 2 == 0;
        });

        var literals = quoteSplit.filter(function(value){
            return value.sortOrder % 2 == 1;
        });
        literals = literals.map(function(item){
            return {"sortOrder": item.sortOrder, "value":"'"+item.value+"'"}
        });

        nonLiterals = splitListByParenthesisAndScope(nonLiterals);

        nonLiterals = nonLiterals.map(function(itm){
			var itemString = itm.value.replace(/\(/g, '(').replace(/\)/g, ')').replace(/,[\t ]*/g,', ');

			_defaultOptions.linebreakKeywords.forEach(function(keyword){
				var re = new RegExp('(\\s|^)'+keyword.keyword+'(\\s|$)', 'gi');
				var prefix;
				var postfix;

				prefix = '';
				if (keyword.newlineBefore) {
					prefix = '\r\n';
				}
				if (keyword.tabBefore) {
					for(var i = 0; i < _defaultOptions.scopeTabCoefficient * itm.scopeDepth; i++){
						prefix += '\t';
					}
				}
				if (prefix === '') {
					prefix = ' ';
				}

				postfix = '';
				if (keyword.newlineAfter) {
					postfix += '\r\n';
					for(var i = 0; i < 1+(_defaultOptions.scopeTabCoefficient * itm.scopeDepth); i++) {
						postfix += '\t';
					}
				}
				if (postfix === '') {
					postfix = ' ';
				}

				itemString = itemString.replace(re, function (strMatch) {
					return prefix + strMatch.trim().toUpperCase() + postfix;
				});
			});

			return {"sortOrder":itm.sortOrder, "value": itemString};
		});

        // re-merge the two lists and sort by sort order
        quoteSplit = _.sortBy(_.flatten([nonLiterals, literals]), 'sortOrder');

        // append the list back together with single quotes and return results
        var result = _.reduce(quoteSplit, function(result, iter){
            return result + iter.value;
            }, '');

        if( result.length > 0) {
            return result.substring(1);
            }
        else{
            return "";
        }
    }

    var trimString = function(string){
        return string.replace(/^\s*/,'').replace(/\s*$/,'');
    };

    var splitListByParenthesisAndScope = function(list){
        var curScopeDepth = 0;

        var brokenList = list.map(function(item){
            var resultList = [];
            var curOrder = item.sortOrder;
            var curText = "";

            for(var i = 0; i < item.value.length; i++){
                curText += item.value[i];
                if(item.value[i] == '('){
                    resultList.push({"sortOrder":curOrder, "scopeDepth":curScopeDepth, "value": curText});
                    curScopeDepth++;
                    curOrder += 0.000000001;
                    curText = "";
                } else if(item.value[i] == ')'){
                    resultList.push({"sortOrder":curOrder, "scopeDepth":curScopeDepth, "value": curText});
                    curScopeDepth--;
                    curOrder += 0.000000001;
                    curText = "";
                }
            }

            if(curText.length > 0)
                resultList.push({"sortOrder":curOrder, "scopeDepth":curScopeDepth, "value": curText});

            return resultList;
        });



        return _.flatten(brokenList);
    };
    // Expose it as a public
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = _formatsql;
        }
        exports.formatSql = _formatsql;
    } else {
        this.formatSql = _formatsql;
    }

    // AMD registration
    if (typeof define === 'function' && define.amd) {
        define('formatSql', [], function () {
        return _formatsql;
        });
    }

}.call(this));
