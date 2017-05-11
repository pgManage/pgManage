
window.addEventListener('design-register-element', function () {
    'use strict';
    
    registerDesignSnippet('GS.qryFromJSON', 'GS.qryFromJSON', 'GS.qryFromJSON(${0:jsnObjectToConvert});');
    
    registerDesignSnippet('GS.qryToJSON', 'GS.qryToJSON', 'GS.qryToJSON(${0:strQueryStringToConvert});');
    
    registerDesignSnippet('GS.qryToWhere', 'GS.qryToWhere',
                                'GS.qryToWhere(${1:strQueryString}, ${2:strColumnNameInQueryString}, ${0:strColumnNameInTarget});');
    
    registerDesignSnippet('GS.qryGetKeys', 'GS.qryGetKeys', 'GS.qryGetKeys(${0:queryString});');
    
    registerDesignSnippet('GS.qryGetVals', 'GS.qryGetVals', 'GS.qryGetVals(${0:queryString});');
    
    registerDesignSnippet('GS.qryGetVal', 'GS.qryGetVal', 'GS.qryGetVal(${1:queryString}, \'${0:keyToGet}\');');
    
    registerDesignSnippet('GS.qrySetVal', 'GS.qrySetVal', 'GS.qrySetVal(${1:queryString}, \'${0:newKeyValuePair}\');');
    
    registerDesignSnippet('GS.qryDeleteKey', 'GS.qryDeleteKey', 'GS.qryDeleteKey(${1:queryString}, \'${0:keyToDelete}\');');
    
    registerDesignSnippet('GS.getQueryString', 'GS.getQueryString', 'GS.getQueryString();');
    
    registerDesignSnippet('GS.pushQueryString', 'GS.pushQueryString', 'GS.pushQueryString(${0:newQueryString});');
    
    registerDesignSnippet('GS.removeFromQueryString', 'GS.removeFromQueryString', 'GS.removeFromQueryString(${0:removeKeys});');
});


// ########## CONVERSION FUNCTIONS ##########
GS.qryFromJSON = function (jsnToConvert) {
    'use strict';
    var key, strRet = '', strType, currentValue;
    
    for (key in jsnToConvert) {
        currentValue = jsnToConvert[key];
        strType = typeof currentValue;
        
        if (strType === 'number' || strType === 'string' || strType === 'boolean') {
            strRet += (strRet === '' ? '' : '&') + key + '=' + encodeURIComponent(jsnToConvert[key]);
            
        } else if (currentValue === null || currentValue === undefined) {
            strRet += (strRet === '' ? '' : '&') + key + '=';
            
        } else if (typeof currentValue !== 'object') {
            throw 'GS.qryFromJSON Error: Invalid value: ' + JSON.stringify(currentValue);
        }
    }
    
    return strRet;
};

GS.qryToJSON = function (strQueryString) {
    'use strict';
    var arrKeyValueList = [], jsnQueryString = {}, strKeyValue, i, len, strKey, strValue, jsnNavigator, arrSubParts, sub_i, sub_len;
    
    if (strQueryString) {
        arrKeyValueList = strQueryString.split('&');
        
        for (i = 0, len = arrKeyValueList.length; i < len; i += 1) {
            strKeyValue = arrKeyValueList[i];
            strKey      = strKeyValue.substring(0, strKeyValue.indexOf('='));
            strValue    = decodeURIComponent(strKeyValue.substring(strKeyValue.indexOf('=') + 1));
            
            jsnQueryString[strKey] = strValue;
            
            // if a dot is found in the key: create a sub JSON structure
            if (strKey.indexOf('.') > -1) {
                arrSubParts = strKey.split('.');
                
                jsnNavigator = jsnQueryString;
                for (sub_i = 0, sub_len = arrSubParts.length; sub_i < sub_len; sub_i += 1) {
                    if (sub_i < sub_len - 1) {
                        jsnNavigator[arrSubParts[sub_i]] = jsnNavigator[arrSubParts[sub_i]] || {};
                    } else {
                        jsnNavigator[arrSubParts[sub_i]] = jsnNavigator[arrSubParts[sub_i]] || strValue;
                    }
                    
                    jsnNavigator = jsnNavigator[arrSubParts[sub_i]];
                }
            }
        }
    }
    
    return jsnQueryString;
};

// get data from query string and turn it into a where clause
//      (
//          the second two params are optional
//              (
//                  they are for when you want only one column out of a query string to be converted
//              )
//      )
GS.qryToWhere = function (strQS, strColumnNameInQS, strColumnNameInTarget) {
    'use strict';
    var strWhere = '', key, jsnArgs;
    
    if (strColumnNameInQS) {
        strColumnNameInTarget = (strColumnNameInTarget || strColumnNameInQS);
        
        if (!isNaN(GS.qryGetVal(strQS, strColumnNameInQS))) {
            strWhere = strColumnNameInTarget + '=' + GS.qryGetVal(strQS, strColumnNameInQS);
        } else {
            strWhere = 'CAST(' + strColumnNameInTarget + ' AS ' + GS.database.type.text + ') = ' +
                       'CAST($WhereQUOTE$' +
                            encodeURIComponent(GS.qryGetVal(strQS, strColumnNameInQS)) +
                            '$WhereQUOTE$ AS ' + GS.database.type.text + ')';
        }
    } else {
        jsnArgs = GS.qryToJSON(strQS);

        for (key in jsnArgs) {
            if (jsnArgs.hasOwnProperty(key)) {
                if (!isNaN(jsnArgs[key])) {
                    strWhere += (strWhere === '' ? '': ' AND ') + key + '=' + jsnArgs[key];
                } else {
                    strWhere += (strWhere === '' ? '': ' AND ') +
                                'CAST(' + key + ' AS ' + GS.database.type.text + ') = ' +
                                'CAST($WhereQUOTE$' + encodeURIComponent(jsnArgs[key]) + '$WhereQUOTE$ AS ' + GS.database.type.text + ')';
                }
            }
        }
    }
    
    return strWhere;
};


// ########## LISTING FUNCTIONS ##########
GS.qryGetKeys = function (strQueryString) {
    'use strict';
    var arrKeyValueList = [], arrKeys = [], i, len, strKeyValue;
    
    if (strQueryString) {
        arrKeyValueList = strQueryString.split('&');
        
        for (i = 0, len = arrKeyValueList.length; i < len; i += 1) {
            strKeyValue = arrKeyValueList[i];
            
            arrKeys.push(strKeyValue.substring(0, strKeyValue.indexOf('=')));
        }
    }
    
    return arrKeys;
};

GS.qryGetVals = function (strQueryString) {
    'use strict';
    var arrKeyValueList = [], arrValues = [], i, len, strKeyValue;
    
    if (strQueryString) {
        arrKeyValueList = strQueryString.split('&');
        
        for (i = 0, len = arrKeyValueList.length; i < len; i += 1) {
            strKeyValue = arrKeyValueList[i];
            
            arrValues.push(decodeURIComponent(strKeyValue.substring(strKeyValue.indexOf('=') + 1)));
        }
    }
    
    return arrValues;
};


// ########## PARAMETER GET/SET FUNCTIONS ##########
GS.qryGetVal = function (strQueryString, strKey) {
    'use strict';
    var arrKeyValueList, strSlice, i, len;
    
    if (strQueryString) {
        arrKeyValueList = strQueryString.split('&');
        
        for (i = 0, len = arrKeyValueList.length; i < len; i = i + 1) {
            strSlice = arrKeyValueList[i];
            
            if (strSlice.split('=')[0] === strKey) {
                return decodeURIComponent(strSlice.substring(strSlice.indexOf('=') + 1));
            }
        }
    }
    
    return '';
};

GS.qrySetVal = function (strQueryString, strKeyValue) {
    'use strict';
    strQueryString = GS.qryDeleteKey(strQueryString, strKeyValue.split('=')[0]);
    strQueryString = strQueryString + (strQueryString ? '&' : '') + strKeyValue;
    
    return strQueryString;
};


// ########## KEY DELETE FUNCTION ##########
GS.qryDeleteKey = function (strQueryString, strKey) {
    'use strict';
    var arrKeyValueList, strSlice, i, len;
    
    if (strQueryString) {
        arrKeyValueList = strQueryString.split('&');
        
        for (i = 0, len = arrKeyValueList.length; i < len; i = i + 1) {
            strSlice = arrKeyValueList[i];
            
            if (strSlice.split('=')[0] === strKey) {
                arrKeyValueList.splice(i, 1);
                
                break;
            }
        }
        
        return arrKeyValueList.join('&');
    }
    
    return '';
};


// ########## MISC FUNCTIONS ##########
GS.getQueryString = function () {
    'use strict';
    return window.location.search.substring(1);
};

GS.pushQueryString = function (QS) {
    var arrNewQS = QS.split('&'), i, len, newQS = GS.getQueryString();
    for (i = 0, len = arrNewQS.length; i < len; i += 1) {
        newQS = GS.qrySetVal(newQS, arrNewQS[i]);
    }
    GS.pushState({}, '', '?' + newQS);
};


GS.removeFromQueryString = function (keys) {
    var arrRemoveKeys = keys.split(','), i, len, newQS = GS.getQueryString();
    for (i = 0, len = arrRemoveKeys.length; i < len; i += 1) {
        newQS = GS.qryDeleteKey(newQS, arrRemoveKeys[i]);
    }
    GS.pushState({}, '', '?' + newQS);
};
