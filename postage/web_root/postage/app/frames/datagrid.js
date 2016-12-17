//global GS, xtag, document, window, ml
//jslint browser:true, white:true, multivar:true, for:true

/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS=CryptoJS||function(h,r){var k={},l=k.lib={},n=function(){},f=l.Base={extend:function(a){n.prototype=this;var b=new n;a&&b.mixIn(a);b.hasOwnProperty("init")||(b.init=function(){b.$super.init.apply(this,arguments)});b.init.prototype=b;b.$super=this;return b},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var b in a)a.hasOwnProperty(b)&&(this[b]=a[b]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
j=l.WordArray=f.extend({init:function(a,b){a=this.words=a||[];this.sigBytes=b!=r?b:4*a.length},toString:function(a){return(a||s).stringify(this)},concat:function(a){var b=this.words,d=a.words,c=this.sigBytes;a=a.sigBytes;this.clamp();if(c%4)for(var e=0;e<a;e++)b[c+e>>>2]|=(d[e>>>2]>>>24-8*(e%4)&255)<<24-8*((c+e)%4);else if(65535<d.length)for(e=0;e<a;e+=4)b[c+e>>>2]=d[e>>>2];else b.push.apply(b,d);this.sigBytes+=a;return this},clamp:function(){var a=this.words,b=this.sigBytes;a[b>>>2]&=4294967295<<
32-8*(b%4);a.length=h.ceil(b/4)},clone:function(){var a=f.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var b=[],d=0;d<a;d+=4)b.push(4294967296*h.random()|0);return new j.init(b,a)}}),m=k.enc={},s=m.Hex={stringify:function(a){var b=a.words;a=a.sigBytes;for(var d=[],c=0;c<a;c++){var e=b[c>>>2]>>>24-8*(c%4)&255;d.push((e>>>4).toString(16));d.push((e&15).toString(16))}return d.join("")},parse:function(a){for(var b=a.length,d=[],c=0;c<b;c+=2)d[c>>>3]|=parseInt(a.substr(c,
2),16)<<24-4*(c%8);return new j.init(d,b/2)}},p=m.Latin1={stringify:function(a){var b=a.words;a=a.sigBytes;for(var d=[],c=0;c<a;c++)d.push(String.fromCharCode(b[c>>>2]>>>24-8*(c%4)&255));return d.join("")},parse:function(a){for(var b=a.length,d=[],c=0;c<b;c++)d[c>>>2]|=(a.charCodeAt(c)&255)<<24-8*(c%4);return new j.init(d,b)}},t=m.Utf8={stringify:function(a){try{return decodeURIComponent(escape(p.stringify(a)))}catch(b){throw Error("Malformed UTF-8 data");}},parse:function(a){return p.parse(unescape(encodeURIComponent(a)))}},
q=l.BufferedBlockAlgorithm=f.extend({reset:function(){this._data=new j.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=t.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var b=this._data,d=b.words,c=b.sigBytes,e=this.blockSize,f=c/(4*e),f=a?h.ceil(f):h.max((f|0)-this._minBufferSize,0);a=f*e;c=h.min(4*a,c);if(a){for(var g=0;g<a;g+=e)this._doProcessBlock(d,g);g=d.splice(0,a);b.sigBytes-=c}return new j.init(g,c)},clone:function(){var a=f.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});l.Hasher=q.extend({cfg:f.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){q.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(b,d){return(new a.init(d)).finalize(b)}},_createHmacHelper:function(a){return function(b,d){return(new u.HMAC.init(a,
d)).finalize(b)}}});var u=k.algo={};return k}(Math);
/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(E){function h(a,f,g,j,p,h,k){a=a+(f&g|~f&j)+p+k;return(a<<h|a>>>32-h)+f}function k(a,f,g,j,p,h,k){a=a+(f&j|g&~j)+p+k;return(a<<h|a>>>32-h)+f}function l(a,f,g,j,h,k,l){a=a+(f^g^j)+h+l;return(a<<k|a>>>32-k)+f}function n(a,f,g,j,h,k,l){a=a+(g^(f|~j))+h+l;return(a<<k|a>>>32-k)+f}for(var r=CryptoJS,q=r.lib,F=q.WordArray,s=q.Hasher,q=r.algo,a=[],t=0;64>t;t++)a[t]=4294967296*E.abs(E.sin(t+1))|0;q=q.MD5=s.extend({_doReset:function(){this._hash=new F.init([1732584193,4023233417,2562383102,271733878])},
_doProcessBlock:function(m,f){for(var g=0;16>g;g++){var j=f+g,p=m[j];m[j]=(p<<8|p>>>24)&16711935|(p<<24|p>>>8)&4278255360}var g=this._hash.words,j=m[f+0],p=m[f+1],q=m[f+2],r=m[f+3],s=m[f+4],t=m[f+5],u=m[f+6],v=m[f+7],w=m[f+8],x=m[f+9],y=m[f+10],z=m[f+11],A=m[f+12],B=m[f+13],C=m[f+14],D=m[f+15],b=g[0],c=g[1],d=g[2],e=g[3],b=h(b,c,d,e,j,7,a[0]),e=h(e,b,c,d,p,12,a[1]),d=h(d,e,b,c,q,17,a[2]),c=h(c,d,e,b,r,22,a[3]),b=h(b,c,d,e,s,7,a[4]),e=h(e,b,c,d,t,12,a[5]),d=h(d,e,b,c,u,17,a[6]),c=h(c,d,e,b,v,22,a[7]),
b=h(b,c,d,e,w,7,a[8]),e=h(e,b,c,d,x,12,a[9]),d=h(d,e,b,c,y,17,a[10]),c=h(c,d,e,b,z,22,a[11]),b=h(b,c,d,e,A,7,a[12]),e=h(e,b,c,d,B,12,a[13]),d=h(d,e,b,c,C,17,a[14]),c=h(c,d,e,b,D,22,a[15]),b=k(b,c,d,e,p,5,a[16]),e=k(e,b,c,d,u,9,a[17]),d=k(d,e,b,c,z,14,a[18]),c=k(c,d,e,b,j,20,a[19]),b=k(b,c,d,e,t,5,a[20]),e=k(e,b,c,d,y,9,a[21]),d=k(d,e,b,c,D,14,a[22]),c=k(c,d,e,b,s,20,a[23]),b=k(b,c,d,e,x,5,a[24]),e=k(e,b,c,d,C,9,a[25]),d=k(d,e,b,c,r,14,a[26]),c=k(c,d,e,b,w,20,a[27]),b=k(b,c,d,e,B,5,a[28]),e=k(e,b,
c,d,q,9,a[29]),d=k(d,e,b,c,v,14,a[30]),c=k(c,d,e,b,A,20,a[31]),b=l(b,c,d,e,t,4,a[32]),e=l(e,b,c,d,w,11,a[33]),d=l(d,e,b,c,z,16,a[34]),c=l(c,d,e,b,C,23,a[35]),b=l(b,c,d,e,p,4,a[36]),e=l(e,b,c,d,s,11,a[37]),d=l(d,e,b,c,v,16,a[38]),c=l(c,d,e,b,y,23,a[39]),b=l(b,c,d,e,B,4,a[40]),e=l(e,b,c,d,j,11,a[41]),d=l(d,e,b,c,r,16,a[42]),c=l(c,d,e,b,u,23,a[43]),b=l(b,c,d,e,x,4,a[44]),e=l(e,b,c,d,A,11,a[45]),d=l(d,e,b,c,D,16,a[46]),c=l(c,d,e,b,q,23,a[47]),b=n(b,c,d,e,j,6,a[48]),e=n(e,b,c,d,v,10,a[49]),d=n(d,e,b,c,
C,15,a[50]),c=n(c,d,e,b,t,21,a[51]),b=n(b,c,d,e,A,6,a[52]),e=n(e,b,c,d,r,10,a[53]),d=n(d,e,b,c,y,15,a[54]),c=n(c,d,e,b,p,21,a[55]),b=n(b,c,d,e,w,6,a[56]),e=n(e,b,c,d,D,10,a[57]),d=n(d,e,b,c,u,15,a[58]),c=n(c,d,e,b,B,21,a[59]),b=n(b,c,d,e,s,6,a[60]),e=n(e,b,c,d,z,10,a[61]),d=n(d,e,b,c,q,15,a[62]),c=n(c,d,e,b,x,21,a[63]);g[0]=g[0]+b|0;g[1]=g[1]+c|0;g[2]=g[2]+d|0;g[3]=g[3]+e|0},_doFinalize:function(){var a=this._data,f=a.words,g=8*this._nDataBytes,j=8*a.sigBytes;f[j>>>5]|=128<<24-j%32;var h=E.floor(g/
4294967296);f[(j+64>>>9<<4)+15]=(h<<8|h>>>24)&16711935|(h<<24|h>>>8)&4278255360;f[(j+64>>>9<<4)+14]=(g<<8|g>>>24)&16711935|(g<<24|g>>>8)&4278255360;a.sigBytes=4*(f.length+1);this._process();a=this._hash;f=a.words;for(g=0;4>g;g++)j=f[g],f[g]=(j<<8|j>>>24)&16711935|(j<<24|j>>>8)&4278255360;return a},clone:function(){var a=s.clone.call(this);a._hash=this._hash.clone();return a}});r.MD5=s._createHelper(q);r.HmacMD5=s._createHmacHelper(q)})(Math);

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    var KEY_RETURN = 13, KEY_TAB = 9, KEY_BACKSPACE = 8, KEY_DELETE = 46
      , KEY_UP = 38, KEY_RIGHT = 39, KEY_DOWN = 40, KEY_LEFT = 37;
    
    function deleteSelection(element) {
        var strSchema = element.getAttribute('schema')
          , strObject = element.getAttribute('object')
          , arrSelectRecords = element.selectedRecords
          , arrPk, arrLock, strHashColumns, strRoles, strColumns, strRecord
          , strRecordToHash, strDeleteData, strTemp, i, len, col_i, col_len;
        
        // if the first record is the header: remove it from the selection
        if (arrSelectRecords[0] && arrSelectRecords[0].parentNode.nodeName === 'THEAD') {
            arrSelectRecords.splice(0, 1);
        }
        
        // if the last record is the insert: remove it from the selection
        if (arrSelectRecords[arrSelectRecords.length - 1] &&
            arrSelectRecords[arrSelectRecords.length - 1].classList.contains('insert-record')) {
            arrSelectRecords.splice(arrSelectRecords.length - 1, 1);
        }
        
        if (element.numberOfSelections === 1
                && arrSelectRecords.length > 0
                && arrSelectRecords[0].children[0].hasAttribute('selected')
                && !element.deleteButton.hasAttribute('disabled')) {
            
            arrPk = (element.getAttribute('pk') || '').split(/[\s]*,[\s]*/);
            arrLock = (element.getAttribute('lock') || '').split(/[\s]*,[\s]*/);
            
            for (i = 0, len = arrPk.length, strRoles = '', strColumns = ''; i < len; i += 1) {
                strRoles += (strRoles ? '\t' : '') + 'pk';
                strColumns += (strColumns ? '\t' : '') + arrPk[i];
            }
            
            for (i = 0, len = arrLock.length, strHashColumns = ''; i < len; i += 1) {
                strHashColumns += (strHashColumns ? '\t' : '') + arrLock[i];
            }
            
            strRoles += (strRoles ? '\t' : '') + 'hash';
            strColumns += (strColumns ? '\t' : '') + 'hash';
            
            for (i = 0, len = arrSelectRecords.length, strDeleteData = ''; i < len; i += 1) {
                strRecord = '';
                
                // get 'pk' columns
                for (col_i = 0, col_len = arrPk.length; col_i < col_len; col_i += 1) {
                    strRecord += (strRecord ? '\t' : '');
                    strRecord += GS.encodeForTabDelimited(arrSelectRecords[i].getAttribute('data-' + arrPk[col_i]));
                }
                
                // get 'hash' columns
                strRecordToHash = '';
                for (col_i = 0, col_len = arrLock.length; col_i < col_len; col_i += 1) {
                    strRecordToHash += (strRecordToHash ? '\t' : '');
                    strTemp = arrSelectRecords[i].getAttribute('data-' + arrLock[col_i]);
                    strRecordToHash += (strTemp === '\\N' ? '' : strTemp);
                }
                
                strDeleteData += (strRecord + (strRecord ? '\t' : '') + CryptoJS.MD5(strRecordToHash).toString() + '\n');
                arrSelectRecords[i].classList.add('bg-red');
            }
            
            strDeleteData = (strRoles + '\n' + strColumns + '\n' + strDeleteData);
            
            // create delete transaction
            GS.addLoader(element, 'Creating Delete Transaction...');
            GS.requestDeleteFromSocket(
                GS.envSocket, strSchema, strObject, strHashColumns, strDeleteData
                , function (data, error, transactionID) {
                    if (error) {
                        getData(element);
                        GS.removeLoader(element);
                        GS.webSocketErrorDialog(data);
                    }
                }
                , function (data, error, transactionID, commitFunction, rollbackFunction) {
                    var arrElements, i, len, templateElement;
                    GS.removeLoader(element);
                    
                    if (!error) {
                        if (data !== 'TRANSACTION COMPLETED') {
                            arrElements = xtag.query(element, '.bg-red');
                            
                            for (i = 0, len = arrElements.length; i < len; i += 1) {
                                arrElements[i].classList.remove('bg-red');
                                arrElements[i].classList.add('bg-amber');
                            }
                            
                        // open confirm message box
                        } else {
                            templateElement = document.createElement('template');
                            templateElement.innerHTML = ml(function () {/*
                                <gs-page>
                                    <gs-header><center><h3>Are you sure...</h3></center></gs-header>
                                    <gs-body padded>
                                        <center>Are you sure you want to delete {{numberofrecords}} records?</center>
                                    </gs-body>
                                    <gs-footer>
                                        <gs-grid>
                                            <gs-block><gs-button dialogclose>No</gs-button></gs-block>
                                            <gs-block><gs-button id="datasheet-focus-me" dialogclose bg-primary tabindex="0">Yes</gs-button></gs-block>
                                        </gs-grid>
                                    </gs-footer>
                                </gs-page>
                            */}).replace(/\{\{numberofrecords\}\}/, xtag.query(element, 'tr.bg-amber').length);
                            
                            GS.openDialog(templateElement, function () {
                                document.getElementById('datasheet-focus-me').focus();
                                
                            }, function (event, strAnswer) {
                                if (strAnswer === 'Yes') {
                                    commitFunction();
                                    GS.addLoader(element, 'Commiting Delete Transaction...');
                                } else {
                                    rollbackFunction();
                                    GS.addLoader(element, 'Rolling Back Delete Transaction...');
                                }
                            });
                        }
                        
                    } else {
                        rollbackFunction();
                        getData(element);
                        GS.webSocketErrorDialog(data);
                    }
                }
                , function (strAnswer, data, error) {
                    var arrElements, i, len;
                    GS.removeLoader(element);
                    
                    if (!error) {
                        if (strAnswer === 'COMMIT') {
                            removeRecords(element, 'bg-amber');
                            clearSelection(element);
                            
                        } else {
                            clearRecordColor(element, 'bg-amber', false);
                        }
                        
                        // fix record selector numbers
                        arrElements = xtag.query(element, 'tbody > tr');
                        
                        for (i = 0, len = arrElements.length; i < len; i += 1) {
                            if (!arrElements[i].classList.contains('insert-record')) {
                                arrElements[i].children[0].textContent = (i + 1);
                            }
                        }
                        
                    } else {
                        getData(element);
                        GS.webSocketErrorDialog(data);
                    }
                }
            );
        }
    }
    
    function clearSelection(element) {
        element.savedSelection = [];
        element.savedSelectionCopy = [];
        element.dragOrigin = null;
        element.dragCurrentCell = null;
        element.selectionPreviousOrigin = null;
        element.numberOfSelections = 0;
        element.selectedCells = [];
    }
    
    function templateRecordsForInsert(element, strRecords, strClasses) {
        var arrRecords, arrColumns, arrCells, i, len, cell_i, cell_len, col_len, strHTML, intRowNumberAdd, arrColumnNames;
        
        // calculate the number of cells across
        if (element.getAttribute('cols')) {
            col_len = (element.getAttribute('cols') || '').split(/[\s]*,[\s]*/).length;
        }
        
        arrRecords = strRecords.split('\n');
        arrColumnNames = arrRecords[0].split('\t');
        
        // calculate how much to add to the row numbers
        intRowNumberAdd = xtag.query(element, 'tr:not(.bg-red):not(.insert-record)').length - 1;
        
        // calculate the number of cells across
        if (element.getAttribute('cols')) {
            arrColumns = (element.getAttribute('cols') || '').split(/[\s]*,[\s]*/);
            
            for (i = 0, len = arrColumns.length; i < len; i += 1) {
                arrColumns[i] = arrColumnNames.indexOf(arrColumns[i]);
            }
        }
        
        for (i = 1, len = arrRecords.length - 1, strHTML = ''; i < len; i += 1) {
            arrCells = arrRecords[i].split('\t');
            
            strHTML += '<tr ' + (strClasses ? ' class="' + strClasses + '"' : '');
            
            for (cell_i = 0, cell_len = arrCells.length; cell_i < cell_len; cell_i += 1) {
                strHTML += 'data-' + arrColumnNames[cell_i] +
                                '="' + encodeHTML(GS.decodeFromTabDelimited(arrCells[cell_i]) || '') + '"';
            }
            
            strHTML += '><th>' + (intRowNumberAdd + (i)) + '</th>';
            
            for (cell_i = 0, cell_len = arrColumns.length; cell_i < cell_len; cell_i += 1) {
                strHTML += '<td><textarea rows="1" column="' + arrColumnNames[cell_i] + '">' +
                                encodeHTML(GS.decodeFromTabDelimited(arrCells[arrColumns[cell_i]] || '')) +
                            '</textarea></td>';
            }
            
            strHTML += '</tr>';
        }
        
        
        //    strHTML = GS.templateWithEnvelopeData(element.tableTemplate.templateHTML, {
        //                        'arr_column': data.arrColumnNames
        //                      , 'dat': element.internalData.arrRecords
        //              }, intStart, element.internalData.arrRecords.length);
        //    
        //    strHTML = GS.templateShowSubTemplates(strHTML, element.tableTemplate);
        //
        //trMaker.children[0].classList.add('insert-record');
        
        return strHTML;
    }
    
    function handleData(element, data) {
        var strHTML, strCSS, i, len, cell_i, cell_len, col_len, arrRecords, arrCells, disabled, arrColumns;
        
        // calculate the number of cells across
        if (element.getAttribute('cols')) {
            //col_len = (element.getAttribute('cols') || '').split(/[\s]*,[\s]*/).length;
            
            arrColumns = (element.getAttribute('cols') || '').split(/[\s]*,[\s]*/);
            
            for (i = 0, len = arrColumns.length; i < len; i += 1) {
                arrColumns[i] = data.arrColumnNames.indexOf(arrColumns[i]);
            }
        }
        
        disabled = element.hasAttribute('disabled') || !element.hasAttribute('pk');
        
        // if first callback: table and header
        if (data.intCallback === 0) {
            if (!element.hasAttribute('lock')) {
                element.setAttribute('lock', data.arrColumnNames.join(','));
            }
            if (!element.hasAttribute('cols')) {
                element.setAttribute('cols', data.arrColumnNames.join(','));
            }
            if (disabled) {
                element.deleteButton.setAttribute('disabled', '');
            } else {
                element.deleteButton.removeAttribute('disabled');
            }
            
            element.internalData = {
                'arrColumnNames': data.arrColumnNames
              , 'arrColumnTypes': data.arrColumnTypes
              , 'arrRecords': []
            };
            
            strHTML = '<th style="width: 4em;">#</th>';
            strCSS = '';
            for (i = 0, len = arrColumns.length; i < len; i += 1) {
                strHTML += '<th>' +
                                '<b>' + encodeHTML(data.arrColumnNames[arrColumns[i]]) + '</b><br />' +
                                '<small>' + encodeHTML(data.arrColumnTypes[arrColumns[i]]) + '</small>' +
                            '</th>';
                
                // if this column is a number type: align column text to the right
                if ((/^(int|smallint|bigint|numeric|float|decimal|real|double|money|oid)/gi).test(data.arrColumnTypes[arrColumns[i]])) {
                    strCSS += ' gs-datagrid[data-sheet-id="' + element.datasheetID + '"] ';
                    strCSS +=      'tbody tr :nth-child(' + (i + 2) + ') textarea { ';
                    strCSS += '    text-align: right;';
                    strCSS += ' }';
                }
            }
            
            element.styleContainer.innerHTML = strCSS;
            
            
            element.scrollContainer.innerHTML = ml(function () {/*
                <table>
                    <thead>
                        <tr>
                            {{STRHEAD}}
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            */}).replace(/\{\{STRHEAD\}\}/gi, strHTML);
        }
        
        // if not last callback: append data to end of table
        if (data.strMessage !== 'TRANSACTION COMPLETED') {
            arrRecords = data.strMessage.split('\n');
            
            
            for (i = 0, len = arrRecords.length - 1, strHTML = ''; i < len; i += 1) {
                arrCells = arrRecords[i].split('\t');
                
                strHTML += '<tr';
                
                for (cell_i = 0, cell_len = arrCells.length; cell_i < cell_len; cell_i += 1) {
                    strHTML += ' data-' + data.arrColumnNames[cell_i] + '="' + encodeHTML(GS.decodeFromTabDelimited(arrCells[cell_i])) + '"';
                }
                
                strHTML += '><th>' + (element.internalData.arrRecords.length + 1) + '</th>';
                for (cell_i = 0, cell_len = arrColumns.length; cell_i < cell_len; cell_i += 1) {
                    strHTML += '<td><textarea rows="1" column="' + data.arrColumnNames[arrColumns[cell_i]] + '" ' + (disabled ? 'disabled' : '') + '>' +
                                    encodeHTML(GS.decodeFromTabDelimited(arrCells[arrColumns[cell_i]])) +
                                '</textarea></td>';
                }
                strHTML += '</tr>';
                
                element.internalData.arrRecords.push(arrCells);
            }
            
            xtag.query(element.scrollContainer, 'tbody')[0].innerHTML += strHTML;
            
        // if last callback: insert record
        } else {
            xtag.query(element.scrollContainer, 'thead th')[0].style.width = (
                    GS.pxToEm(element.hudContainer,
                        GS.getTextWidth(element.hudContainer,
                            String(element.internalData.arrRecords.length + 1)
                        )
                    ) + 1
                ) + 'em';
            
            strHTML = '<th>&gt;</th>';
            for (i = 0, len = arrColumns.length; i < len; i += 1) {
                strHTML += '<td><textarea rows="1" column="' + data.arrColumnNames[arrColumns[i]] + '"' +
                                         ' placeholder="*' + data.arrColumnNames[arrColumns[i]] + '" ' +
                                         (disabled ? 'disabled' : '') + '></textarea></td>';
            }
            
            xtag.query(element.scrollContainer, 'tbody')[0].innerHTML += '<tr class="insert-record">' + strHTML + '</tr>';
            
            synchronize(element);
        }
    }
    
    // get return column list
    function getReturn(element) {
        var arrColumns = [], arrSupplementalColumns = [], arrColsAttr, strColumns, arrPK, arrLock, i, len;
        
        // pk
        arrPK = (element.getAttribute('pk') || '').split(/[\s]*,[\s]*/);
        
        for (i = 0, len = arrPK.length; i < len; i += 1) {
            if (arrPK[i]) {
                GS.listAdd(arrSupplementalColumns, arrPK[i]);
            }
        }
        
        // lock
        arrLock = (element.getAttribute('lock') || '').split(/[\s]*,[\s]*/);
        
        for (i = 0, len = arrLock.length; i < len; i += 1) {
            if (arrLock[i]) {
                GS.listAdd(arrSupplementalColumns, arrLock[i]);
            }
        }
        
        if (element.internalData && element.internalData.arrColumnNames) {
            for (i = 0, len = element.internalData.arrColumnNames.length; i < len; i += 1) {
                GS.listAdd(arrColumns, element.internalData.arrColumnNames[i]);
            }
        } else if (element.getAttribute('cols')) {
            arrColsAttr = element.getAttribute('cols').split(/[\s]*,[\s]*/);
            
            for (i = 0, len = arrColsAttr.length; i < len; i += 1) {
                GS.listAdd(arrColumns, arrColsAttr[i]);
            }
        }
        
        if (arrColumns.length === 0 || (arrColumns.length === 1 && arrColumns[0] === '*')) {
            strColumns = '*';
            
        } else {
            for (i = 0, len = arrSupplementalColumns.length; i < len; i += 1) {
                GS.listAdd(arrColumns, arrSupplementalColumns[i]);
            }
            
            strColumns = arrColumns.join('\t');
        }
        
        return strColumns;
    }
    
    function valueListToHTML(valueText, fieldDelimiter, recordDelimiter, bolFirstContainsHeadings, quoteCharacter, decodeFunction) {
        var i = 0, len = valueText.length, col_i, col_len,
            arrHeadings = [], arrRecords = [], arrRecord = [],
            bolInQuote = false,
            strCell = '',
            strRecord,
            strHTML = '', strPreviousChar;
        
        // if there is a recordDelimiter at the beginning: add 1 to "i" to skip over it
        if (valueText[0] === recordDelimiter) {
            i += 1;
        }
        
        // make sure there is a recordDelimiter at the end
        if (valueText[len - 1] !== recordDelimiter) {
            valueText += recordDelimiter;
            len = valueText.length;
        }
        
        // looper
        for (; i < len; i += 1) {
            if (valueText[i] === quoteCharacter && bolInQuote === false
                && (
                    strPreviousChar === fieldDelimiter ||
                    strPreviousChar === recordDelimiter ||
                    strPreviousChar === undefined
                )) {
                bolInQuote = true;
                
            } else if (valueText[i] === quoteCharacter && bolInQuote === true) {
                bolInQuote = false;
                
            } else if (valueText[i] === fieldDelimiter && bolInQuote === false) {
                arrRecord.push(decodeFunction(strCell));
                strCell = '';
                
            } else if (valueText[i] === recordDelimiter && bolInQuote === false) {
                arrRecord.push(decodeFunction(strCell));
                strCell = '';
                
                arrRecords.push(arrRecord);
                arrRecord = [];
                
            } else {
                strCell += valueText[i];
            }
            
            strPreviousChar = valueText[i];
        }
        
        // data structure to html
        for (i = 0, len = arrRecords.length; i < len; i += 1) {
            for (col_i = 0, col_len = arrRecords[i].length, strRecord = ''; col_i < col_len; col_i += 1) {
                strRecord += '<td>' + encodeHTML(arrRecords[i][col_i]) + '</td>';
            }
            
            strHTML += '<tr>' + strRecord + '</tr>';
        }
        
        return '<table>' + strHTML + '</table>';
    }
    
    function quoteIdent(strValue) {
        strValue = strValue || '';
        
        // if first char is not a lowercase letter or there is a character that is not a lowercase letter, underscore or number
        if (!(/[a-z]/).test(strValue[0]) || (/[^a-z_]/).test(strValue)) {
            strValue = '"' + strValue.replace(/\"/gim, '""') + '"';
        }
        
        return strValue;
    }
    
    // disfated's answer at: http://stackoverflow.com/questions/202605/repeat-string-javascript
    function stringRepeat(pattern, count) {
        if (count < 1) return '';
        var result = '';
        while (count > 1) {
            if (count & 1) result += pattern;
            count >>= 1, pattern += pattern;
        }
        return result + pattern;
    }
    
    function getData(element, refocusSelector, refocusSelection) {
        var strSchema = element.getAttribute('schema') || ''
          , strObject = element.getAttribute('object') || ''
          , strReturn = getReturn(element) || ''
          , strWhere  = element.getAttribute('where') || ''
          , strOrd    = element.getAttribute('ord') || ''
          , strLimit  = element.getAttribute('limit') || ''
          , strOffset = element.getAttribute('offset') || '';
        
        if (element.getAttribute('user-where')) {
            strWhere = '(' + element.getAttribute('user-where') + ')' + (strWhere ? ' AND ' + strWhere : '');
        }
        
        GS.addLoader(element, 'Loading...');
        GS.requestSelectFromSocket(
                        GS.envSocket, strSchema, strObject, strReturn, strWhere, strOrd, strLimit, strOffset
          , function (data, error) {
                var refocusElement;
                
                if (!error) {
                    handleData(element, data);
                    
                    if (data.strMessage === 'TRANSACTION COMPLETED') {
                        GS.removeLoader(element);
                    }
                    
                    if (data.strMessage === 'TRANSACTION COMPLETED' && refocusSelector) {
                        refocusElement = xtag.query(element, refocusSelector)[0];
                        
                        if (refocusElement) {
                            refocusElement.focus();
                            if (refocusSelection) {
                                GS.setInputSelection(refocusElement, refocusSelection.start, refocusSelection.end);
                            }
                        }
                    }
                    
                } else {
                    GS.removeLoader(element);
                    if (!element.scrollContainer.innerHTML) {
                        element.scrollContainer.innerHTML = '<' + 'center><h2>Couldn\'t Load Data.</h2></' + 'center>';
                    }
                    GS.webSocketErrorDialog(data);
                }
            }
        );
    }
    
    
    function getSelectedCopyHTML(element) {
        var strHTMLCopyString, intFromRecord, intToRecord, intFromCell = 9999999, intToCell = 0
          , i, len, cell_i, cell_len, arrSelected, strCellHTML, arrRecords, arrCells
          , strHTMLRecordString;
        
        arrSelected = element.selectedCells;
        
        // loop through the selected cells and create an html string using the text of the cell
        if (arrSelected.length > 0) {
            intFromRecord = arrSelected[0].parentNode.rowIndex;
            intToRecord = arrSelected[arrSelected.length - 1].parentNode.rowIndex + 1;
            
            for (i = 0, len = arrSelected.length; i < len; i += 1) {
                if (arrSelected[i].cellIndex < intFromCell) {
                    intFromCell = arrSelected[i].cellIndex;
                    intFromCell = (intFromCell === 0 ? 1 : intFromCell);
                }
                if (arrSelected[i].cellIndex + 1 > intToCell) {
                    intToCell = arrSelected[i].cellIndex + 1;
                }
            }
            
            arrRecords = xtag.query(element, 'tr');
            strHTMLCopyString = '';
            
            for (i = intFromRecord, len = intToRecord; i < len; i += 1) {
                arrCells = arrRecords[i].children;
                strHTMLRecordString = '';
                
                if (!arrRecords[i].classList.contains('insert-record')) {
                    for (cell_i = intFromCell, cell_len = intToCell; cell_i < cell_len; cell_i += 1) {
                        strCellHTML = '';
                        
                        if (arrCells[cell_i].hasAttribute('selected')) {
                            if (arrCells[cell_i].children[0] && arrCells[cell_i].children[0].nodeName === 'TEXTAREA') { 
                                strCellHTML = encodeHTML(arrCells[cell_i].lastElementChild.value);
                                
                            } else if (arrCells[cell_i].children[0] && arrCells[cell_i].children[0].nodeName === 'B') {
                                strCellHTML = encodeHTML(arrCells[cell_i].children[0].textContent);
                                
                            } else {
                                strCellHTML = encodeHTML(arrCells[cell_i].textContent);
                            }
                            
                            strCellHTML = strCellHTML.replace(/\n/gim, '<br />');
                        }
                        
                        strCellHTML = '<' + 'td rowspan="1" colspan="1">' + (strCellHTML || '') + '</td>'
                        
                        strHTMLRecordString += (cell_i === intFromCell ? '<' + 'tr>' : '');
                        strHTMLRecordString += (strCellHTML || '');
                        strHTMLRecordString += (cell_i === (intToCell - 1) ? '<' + '/tr>' : '');
                    }
                }
                if (strHTMLRecordString.trim()) {
                    strHTMLCopyString += strHTMLRecordString;
                }
            }
            
            if (strHTMLCopyString) {
                strHTMLCopyString = '<' + 'style>' +
                                        'br { mso-data-placement:same-cell; }' +
                                        'th, td { white-space: pre-wrap; }' +
                                    '<' + '/style>' +
                                    '<' + 'table border="0" cellpadding="0" cellspacing="0">' + strHTMLCopyString + '<' + '/table>';
            }
        }
        
        return strHTMLCopyString || '';
    }
    
    function getSelectedCopyText(element) {
        var strTextCopyString, intFromRecord, intToRecord, intFromCell = 9999999, intToCell = 0,
            i, len, cell_i, cell_len, arrSelected, strCellText, arrRecords, arrCells, strTextRecordString;
        
        arrSelected = element.selectedCells;
        
        // loop through the selected cells and create a tsv string using the text of the cell
        if (arrSelected.length > 0) {
            intFromRecord = arrSelected[0].parentNode.rowIndex;
            intToRecord = arrSelected[arrSelected.length - 1].parentNode.rowIndex + 1;
            
            for (i = 0, len = arrSelected.length; i < len; i += 1) {
                if (arrSelected[i].cellIndex < intFromCell) {
                    intFromCell = arrSelected[i].cellIndex;
                    intFromCell = (intFromCell === 0 ? 1 : intFromCell);
                }
                if (arrSelected[i].cellIndex + 1 > intToCell) {
                    intToCell = arrSelected[i].cellIndex + 1;
                }
            }
            
            arrRecords = xtag.query(element, 'tr');
            strTextCopyString = '';
            
            for (i = intFromRecord, len = intToRecord; i < len; i += 1) {
                arrCells = arrRecords[i].children;
                strTextRecordString = '';
                
                for (cell_i = intFromCell, cell_len = intToCell; cell_i < cell_len; cell_i += 1) {
                    if (!arrCells[cell_i].parentNode.classList.contains('insert-record')) {
                        strCellText = '';
                        
                        if (arrCells[cell_i].hasAttribute('selected')) {
                            if (arrCells[cell_i].children[0] && arrCells[cell_i].children[0].nodeName === 'TEXTAREA') { 
                                strCellText = arrCells[cell_i].lastElementChild.value;
                                
                            } else if (arrCells[cell_i].children[0] && arrCells[cell_i].children[0].nodeName === 'B') {
                                strCellText = arrCells[cell_i].children[0].textContent;
                                
                            } else {
                                strCellText = arrCells[cell_i].textContent;
                            }
                            
                            strCellText = strCellText.replace(/\"/gim, '""');
                        }
                        
                        strTextRecordString += (cell_i !== intFromCell ? '\t' : '');
                        strTextRecordString += (strCellText || '');
                    }
                }
                //if (strTextRecordString.trim()) {
                strTextCopyString += strTextRecordString;
                //}
                if (i + 1 !== len) { //&& strTextRecordString.trim()
                    strTextCopyString += '\n';
                }
            }
        }
        
        return strTextCopyString || '';
    }
    
    function handleClipboardData(event, strCopyString, strType) {
        var clipboardData = event.clipboardData || window.clipboardData, strMime;
        
        if (!clipboardData) { return; }
        if (!clipboardData.setData) { return; }
        
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
            throw 'handleClipboardData Error: Type "' + strType + '" not recognized, recognized types are "text" and "html".';
        }
        
        if (strMime) {
            if (strCopyString && strMime) {
                return clipboardData.setData(strMime, strCopyString) !== false;
            } else {
                return clipboardData.getData(strMime);
            }
        }
    }
    
    
    function selectHandler(element, dragOriginCell, dragCurrentCell, dragMode) {
        var arrRecords = xtag.query(element, 'tr'), arrCells = xtag.query(element, 'td, th'),
            dragOriginRecord = dragOriginCell.parentNode,
            dragCurrentRecord = dragCurrentCell.parentNode,
            intStartRecordIndex, intStartCellIndex, intEndRecordIndex, intEndCellIndex,
            i, len, col_i, col_len, selectionIndex;
        
        // if origin & currentCell are both the top-left cell and the cell is a heading: select all cells
        if (dragOriginRecord.rowIndex === 0 && dragCurrentRecord.rowIndex === 0 &&
            dragOriginCell.cellIndex === 0 && dragCurrentCell.cellIndex === 0) {
            intStartRecordIndex = 0;
            intStartCellIndex = 0;
            intEndRecordIndex = arrRecords.length - 1;
            intEndCellIndex = arrRecords[0].children.length - 1;
            
        // else if origin is a first th: select the records from origin to currentCell
        } else if (dragOriginCell.cellIndex === 0) {
            intStartRecordIndex = Math.min(dragOriginRecord.rowIndex, dragCurrentRecord.rowIndex);
            intStartCellIndex = 0;
            intEndRecordIndex = Math.max(dragOriginRecord.rowIndex, dragCurrentRecord.rowIndex);
            intEndCellIndex = arrRecords[0].children.length - 1;
            
        // else if origin is a heading: select the columns from origin to currentCell
        } else if (dragOriginRecord.rowIndex === 0) {
            intStartRecordIndex = 0;
            intStartCellIndex = Math.min(dragOriginCell.cellIndex, dragCurrentCell.cellIndex);
            intEndRecordIndex = arrRecords.length - 1;
            intEndCellIndex = Math.max(dragOriginCell.cellIndex, dragCurrentCell.cellIndex);
            
        // else select cells from origin to currentCell
        } else {
            intStartRecordIndex = Math.min(dragOriginRecord.rowIndex, dragCurrentRecord.rowIndex);
            intStartCellIndex = Math.min(dragOriginCell.cellIndex, dragCurrentCell.cellIndex);
            intEndRecordIndex = Math.max(dragOriginRecord.rowIndex, dragCurrentRecord.rowIndex);
            intEndCellIndex = Math.max(dragOriginCell.cellIndex, dragCurrentCell.cellIndex);
        }
        
        element.savedSelection = element.savedSelectionCopy.slice(0);
        
        if (dragMode === 'select') {
            for (i = intStartRecordIndex, len = intEndRecordIndex + 1; i < len; i += 1) {
                for (col_i = intStartCellIndex, col_len = intEndCellIndex + 1; col_i < col_len; col_i += 1) {
                    if (element.savedSelection.indexOf(i + ',' + col_i) === -1) {
                        element.savedSelection.push(i + ',' + col_i);
                    }
                }
            }
            
        } else { // implied if: dragMode === 'deselect'
            for (i = intStartRecordIndex, len = intEndRecordIndex + 1; i < len; i += 1) {
                for (col_i = intStartCellIndex, col_len = intEndCellIndex + 1; col_i < col_len; col_i += 1) {
                    selectionIndex = element.savedSelection.indexOf(i + ',' + col_i);
                    
                    if (selectionIndex > -1) {
                        element.savedSelection.splice(selectionIndex, 1);
                    }
                }
            }
        }
        
        synchronize(element);
    }
    
    function synchronize(element, bolScroll) {
        var arrRecords = xtag.query(element, 'tr'), selectCells = [], i, len,
            arrParts, arrTextareas, focusedElement, recordIndex, cellIndex;
        
        // selection
        if (element.savedSelection) {
            // loop through savedSelection
            for (i = 0, len = element.savedSelection.length; i < len; i += 1) {
                // any cell position that is in saved selection gets added to the selectCells
                arrParts = element.savedSelection[i].split(',');
                recordIndex = parseInt(arrParts[0], 10);
                cellIndex = parseInt(arrParts[1], 10);
                
                if (recordIndex < arrRecords.length && cellIndex < arrRecords[0].children.length) {
                    selectCells.push(arrRecords[recordIndex].children[cellIndex]);
                }
            }
            
            // select cells
            element.selectedCells = selectCells;
        }
        
        // focus
        if (element.lastFocusedControl) {
            element.lastFocusedControl.focus();
            focusedElement = element.lastFocusedControl;
        } else {
            focusedElement = element.copyControl;
            focusedElement.focus();
        }
        
        // if there was no control to focus and
        //      there is a selection and
        //      bolScroll is true: scroll to selected
        if (!element.lastFocusedControl && element.selectedCells.length > 0 && bolScroll) {
            GS.scrollIntoView(element.selectedCells[0].parentNode);
        }
        
        // if there was a control and bolScroll is true: scroll to focused record
        if (focusedElement && bolScroll) {
            GS.scrollIntoView(GS.findParentElement(document.activeElement, 'tr'));
        }
        
        if (focusedElement && element.lastTextSelection) {
            GS.setInputSelection(focusedElement, element.lastTextSelection.start, element.lastTextSelection.end);
        }
    }
    
    function clearRecordColor(element, strClass, bolGreenFade) {
        var arrElements = xtag.query(element, 'tr.' + strClass), i, len;
        
        if (bolGreenFade) {
            for (i = 0, len = arrElements.length; i < len; i += 1) {
                arrElements[i].classList.remove(strClass);
                arrElements[i].classList.add('bg-green-fade');
            }
            
            setTimeout(function () {
                for (i = 0, len = arrElements.length; i < len; i += 1) {
                    arrElements[i].classList.remove('bg-green-fade');
                }
            }, 1000);
            
        } else {
            for (i = 0, len = arrElements.length; i < len; i += 1) {
                arrElements[i].classList.remove(strClass);
            }
        }
    }
    
    function removeRecords(element, strClass) {
        var arrElements = xtag.query(element, 'tr.' + strClass), i, len;
        
        for (i = 0, len = arrElements.length; i < len; i += 1) {
            arrElements[i].parentNode.removeChild(arrElements[i]);
        }
    }
    
    function insertRecords(element, strColumns, strInsertData, strLocalColumns, strLocalData, bolDialog) {
        var strSchema = element.getAttribute('schema')
          , strObject = element.getAttribute('object')
          , templateElement, strSeq, arrSeq, strPk, arrPk
          , strColumn, arrColumns, i, len, col_i, col_len
          , tbodyElement, arrElements, insertRecord;
        
        arrSeq = (element.getAttribute('seq') || '').split(/[\s]*,[\s]*/);
        arrPk = (element.getAttribute('pk') || '').split(/[\s]*,[\s]*/);
        
        arrColumns = strColumns.split('\t');
        for (i = 0, len = arrColumns.length; i < len; i += 1) {
            strColumn = GS.decodeFromTabDelimited(arrColumns[i]);
            
            if (arrSeq.indexOf(strColumn) > -1) {
                arrSeq[arrSeq.indexOf(strColumn)] = '';
            }
        }
        
        // template local record data
        tbodyElement = document.createElement('tbody');
        
        tbodyElement.innerHTML = templateRecordsForInsert(element, getReturn(element) + '\n' + strLocalData, 'bg-red');
        
        // add local records to the table before the insert record
        arrElements = xtag.toArray(tbodyElement.children);
        insertRecord = xtag.query(element, 'tr.insert-record')[0];
        
        for (i = 0, len = arrElements.length; i < len; i += 1) {
            insertRecord.parentNode.insertBefore(arrElements[i], insertRecord);
        }
        
        // scroll all the way down
        element.scrollContainer.scrollTop = element.scrollContainer.scrollHeight;
        
        // get pk and sequence values
        for (i = 0, len = arrPk.length, strPk = ''; i < len; i += 1) {
            strPk += (strPk ? '\t' : '') + GS.encodeForTabDelimited(arrPk[i]);
        }
        
        for (i = 0, len = arrSeq.length, strSeq = ''; i < len; i += 1) {
            if (arrColumns.indexOf(arrPk[i]) > -1) {
                strSeq += (i === 0 ? '' : '\t') + '';
            } else {
                strSeq += (i === 0 ? '' : '\t') + GS.encodeForTabDelimited(arrSeq[i]);
            }
        }
        
        strInsertData = strColumns + '\n' + strInsertData;
        
        GS.addLoader(element, 'Creating Insert Transaction...');
        GS.requestInsertFromSocket(
            GS.envSocket, strSchema, strObject, getReturn(element), strPk, strSeq, strInsertData
            , function (data, error) {
                if (error) {
                    removeRecords(element, 'bg-red');
                    GS.removeLoader(element);
                    GS.webSocketErrorDialog(data);
                }
            }
            , function (data, error, transactionID, commitFunction, rollbackFunction) {
                var tbodyElement, arrElements, arrReplaceElements, i, len, templateElement;
                
                GS.removeLoader(element);
                
                if (!error) {
                    if (data !== 'TRANSACTION COMPLETED') {
                        data = getReturn(element) + '\n' + data;
                        
                        // replace red records with amber records
                        tbodyElement = document.createElement('tbody');
                        tbodyElement.innerHTML = templateRecordsForInsert(element, data, 'bg-amber');
                        arrElements = xtag.toArray(tbodyElement.children);
                        arrReplaceElements = xtag.query(element, 'tr.bg-red');
                        
                        for (i = 0, len = arrElements.length; i < len; i += 1) {
                            arrReplaceElements[i].parentNode.replaceChild(arrElements[i], arrReplaceElements[i]);
                        }
                        
                    // open confirm message box
                    } else {
                        if (bolDialog) {
                            templateElement = document.createElement('template');
                            templateElement.innerHTML = ml(function () {/*
                                <gs-page>
                                    <gs-header><center><h3>Are you sure...</h3></center></gs-header>
                                    <gs-body padded>
                                        <center>Are you sure you want create {{numberofrecords}} records?</center>
                                    </gs-body>
                                    <gs-footer>
                                        <gs-grid>
                                            <gs-block><gs-button dialogclose>No</gs-button></gs-block>
                                            <gs-block><gs-button id="datasheet-focus-me" dialogclose bg-primary tabindex="0">Yes</gs-button></gs-block>
                                        </gs-grid>
                                    </gs-footer>
                                </gs-page>
                            */}).replace(/\{\{numberofrecords\}\}/, xtag.query(element, 'tr.bg-amber').length);
                            
                            GS.openDialog(templateElement, function () {
                                document.getElementById('datasheet-focus-me').focus();
                                
                            }, function (event, strAnswer) {
                                if (strAnswer === 'Yes') {
                                    commitFunction();
                                    GS.addLoader(element, 'Commiting Insert...');
                                } else {
                                    rollbackFunction();
                                    GS.addLoader(element, 'Rolling Back Insert...');
                                }
                            });
                        } else {
                            commitFunction();
                        }
                    }
                    
                } else {
                    removeRecords(element, 'bg-red');
                    rollbackFunction();
                    GS.webSocketErrorDialog(data);
                }
            }
            , function (strAnswer, data, error) {
                GS.removeLoader(element);
                
                if (!error) {
                    if (strAnswer === 'COMMIT') {
                        clearRecordColor(element, 'bg-amber', true);
                    } else {
                        removeRecords(element, 'bg-amber');
                    }
                } else {
                    removeRecords(element, 'bg-red');
                    GS.webSocketErrorDialog(data);
                }
            }
        );
    }
    
    
    function refreshRecordsAfterUpdate(element, arrRecordsToUpdate, data) {
        var arrColumns, arrRecords, arrValues, arrElements, arrColumnTypes,
            i, len, record_i, record_len, col_i, col_len, controlElement;
        
        // if last character is a \n: remove it
        if (data[data.length - 1] === '\n') {
            data = data.substring(0, data.length - 1);
        }
        
        // split records
        arrRecords = data.split('\n');
        
        // seperate first record (for column names)
        arrColumns = arrRecords[0].split('\t');
        arrRecords.splice(0, 1);
        
        // loop through each record
        len = arrRecordsToUpdate.length;
        record_len = arrRecords.length;
        i = 0;
        record_i = 0;
        while (i < len && record_i < record_len) {
            if (arrRecordsToUpdate[i].classList.contains('bg-red') && arrRecords[record_i]) {
                arrRecordsToUpdate[i].classList.remove('bg-red');
                arrRecordsToUpdate[i].classList.add('bg-amber');
                
                // build json row
                arrValues = arrRecords[record_i].split('\t');
                for (col_i = 0, col_len = arrValues.length; col_i < col_len; col_i += 1) {
                    arrRecordsToUpdate[i].setAttribute('data-' + arrColumns[col_i], GS.decodeFromTabDelimited(arrValues[col_i]));
                    
                    controlElement = xtag.query(arrRecordsToUpdate[i], '[column="' + arrColumns[col_i] + '"]')[0];
                    if (controlElement) {
                        controlElement.value = GS.decodeFromTabDelimited(arrValues[col_i]);
                    }
                }
                
                record_i += 1;
            }
            i += 1;
        }
    }
    
    function updateRecords(element, strHashColumns, strUpdateData, arrUpdateRecords, bolDialog) {
        var strSchema = element.getAttribute('schema')
          , strObject = element.getAttribute('object'), templateElement, i, len;
        
        for (i = 0, len = arrUpdateRecords.length; i < len; i += 1) {
            arrUpdateRecords[i].classList.add('bg-red');
        }
        
        // create transaction
        GS.addLoader(element, 'Creating Update Transaction...');
        GS.requestUpdateFromSocket(
            GS.envSocket, strSchema, strObject, getReturn(element), strHashColumns, strUpdateData
            , function (data, error, transactionID) {
                if (error) {
                    getData(element);
                    GS.removeLoader(element);
                    GS.webSocketErrorDialog(data);
                }
            }
            , function (data, error, transactionID, commitFunction, rollbackFunction) {
                GS.removeLoader(element);
                if (!error) {
                    if (data !== 'TRANSACTION COMPLETED') {
                        data = getReturn(element) + '\n' + data;
                        
                        // make the records amber and refresh their data
                        refreshRecordsAfterUpdate(element, arrUpdateRecords, data);
                        
                    // open confirm message box
                    } else {
                        if (bolDialog) {
                            templateElement = document.createElement('template');
                            templateElement.innerHTML = ml(function () {/*
                                <gs-page>
                                    <gs-header><center><h3>Are you sure...</h3></center></gs-header>
                                    <gs-body padded>
                                        <center>Are you sure you want to update {{numberofrecords}} records?</center>
                                    </gs-body>
                                    <gs-footer>
                                        <gs-grid>
                                            <gs-block><gs-button dialogclose>No</gs-button></gs-block>
                                            <gs-block><gs-button id="datasheet-focus-me" dialogclose bg-primary tabindex="0">Yes</gs-button></gs-block>
                                        </gs-grid>
                                    </gs-footer>
                                </gs-page>
                            */}).replace(/\{\{numberofrecords\}\}/, xtag.query(element, 'tr.bg-amber').length);
                            
                            GS.openDialog(templateElement, function () {
                                document.getElementById('datasheet-focus-me').focus();
                                
                            }, function (event, strAnswer) {
                                if (strAnswer === 'Yes') {
                                    commitFunction();
                                    GS.addLoader(element, 'Commiting Update...');
                                } else {
                                    rollbackFunction();
                                    GS.addLoader(element, 'Rolling Back Update...');
                                }
                            });
                        } else {
                            commitFunction();
                        }
                    }
                    
                } else {
                    rollbackFunction();
                    getData(element);
                    GS.webSocketErrorDialog(data);
                }
            }
            , function (strAnswer, data, error) {
                GS.removeLoader(element);
                
                if (!error) {
                    if (strAnswer === 'COMMIT') {
                        clearRecordColor(element, 'bg-amber', true);
                        
                    } else {
                        getData(element);
                    }
                } else {
                    getData(element);
                    GS.webSocketErrorDialog(data);
                }
            }
        );
    }
    
    function pasteHandler(element, event) {
        var clipboardData = (event.clipboardData || window.clipboardData)
          , templateElement = document.createElement('template')
          , pasteHTML, pastePlain, arrPasteRecords, arrSelectRecords, arrSetColumns
          , strColumn, strColumns, i, len, col_i, col_len, cell, arrPk, arrLock
          , strRecord, strInsertData, strLocalData, strLeftPad, strRightPad
          , strTemp, strRecordToHash, strHashColumns, strRoles, strUpdateData
          , arrRecords, arrUpdateRecords, arrUpdateColumns;
        
        if (window.clipboardData) {
            pastePlain = clipboardData.getData('Text');
            //console.log('PLAIN:', pastePlain);
        } else {
            pasteHTML = clipboardData.getData('text/html');
            pastePlain = clipboardData.getData('Text');
            //console.log('HTML:', pasteHTML);
        }
        
        // if no html: build HTML using plain
        if (!pasteHTML || (pasteHTML.indexOf('<' + 'table') === -1 && pasteHTML.indexOf('<' + 'tr') === -1)) {
            pasteHTML = valueListToHTML(pastePlain, '\t', '\n', false, '"', GS.decodeFromTabDelimited);
        }
        
        //console.log('HTML:', pasteHTML);
        //console.log('PLAIN:', pastePlain);
        
        // put HTML into a template element for traversal
        templateElement.innerHTML = pasteHTML;
        
        arrPasteRecords = xtag.query(xtag.query(templateElement.content, 'table')[0], 'tr');
        arrSelectRecords = element.selectedRecords;
        
        // if the first record is the header: remove it from the selection
        if (arrSelectRecords[0] && arrSelectRecords[0].parentNode.nodeName === 'THEAD') {
            arrSelectRecords.splice(0, 1);
        }
        
        if (element.numberOfSelections === 1) {
            arrSetColumns = xtag.query(arrSelectRecords[0], 'td[selected]');
            
            // if the selection starts on the insert record
            if (arrSelectRecords[0].classList.contains('insert-record')) {
                strColumns = '';
                for (i = 0, len = Math.min(arrSetColumns.length, arrPasteRecords[0].children.length); i < len; i += 1) {
                    strColumn = arrSetColumns[i].children[0].getAttribute('column');
                    strColumns += (strColumns ? '\t' : '') + strColumn;
                }
                
                // extract data from paste HTML
                strLeftPad = stringRepeat('\t', arrSetColumns[0].cellIndex - 1);
                strRightPad = stringRepeat('\t', (element.internalData.arrColumnNames.length - ((arrSetColumns[0].cellIndex - 1) + arrSetColumns.length)));
                
                for (i = 0, len = arrPasteRecords.length, strInsertData = '', strLocalData = ''; i < len; i += 1) {
                    for (col_i = 0, col_len = Math.min(arrSetColumns.length, arrPasteRecords[0].children.length), strRecord = ''; col_i < col_len; col_i += 1) {
                        cell = arrPasteRecords[i].children[col_i];
                        if (cell) {
                            strRecord += (strRecord ? '\t' : '') + GS.encodeForTabDelimited(cell.innerText.trim() || cell.textContent.trim());
                        } else {
                            strRecord += (strRecord ? '\t' : '') + GS.encodeForTabDelimited('NULL');
                        }
                    }
                    
                    strInsertData += strRecord + '\n';
                    strLocalData += strLeftPad + strRecord + strRightPad + '\n';
                }
                
                insertRecords(element, strColumns, strInsertData, strColumns, strLocalData, (arrPasteRecords.length > 1));
                
            // else (if the selection starts on an update record)
            } else {
                // if the last record is the insert: remove it from the selection
                if (arrSelectRecords[arrSelectRecords.length - 1].parentNode.nodeName === 'THEAD') {
                    arrSelectRecords.pop();
                }
                
                arrPk = (element.getAttribute('pk') || '').split(/[\s]*,[\s]*/);
                arrLock = (element.getAttribute('lock') || '').split(/[\s]*,[\s]*/);
                
                // gathering update headers
                for (i = 0, len = arrPk.length, strRoles = '', strColumns = ''; i < len; i += 1) {
                    strRoles += (strRoles ? '\t' : '') + 'pk';
                    strColumns += (strColumns ? '\t' : '') + arrPk[i];
                }
                
                for (i = 0, len = arrLock.length, strHashColumns = ''; i < len; i += 1) {
                    strHashColumns += (strHashColumns ? '\t' : '') + arrLock[i];
                }
                strRoles += (strRoles ? '\t' : '') + 'hash';
                strColumns += (strColumns ? '\t' : '') + 'hash';
                
                arrUpdateColumns = [];
                for (i = 0, len = Math.min(arrSetColumns.length, arrPasteRecords[0].children.length); i < len; i += 1) {
                    strColumn = arrSetColumns[i].children[0].getAttribute('column');
                    
                    strRoles += (strRoles ? '\t' : '') + 'set';
                    strColumns += (strColumns ? '\t' : '') + strColumn;
                    
                    arrUpdateColumns.push(strColumn);
                }
                
                arrUpdateRecords = [];
                for (i = 0, len = Math.min(arrSelectRecords.length, arrPasteRecords.length), strUpdateData = ''; i < len; i += 1) {
                    strRecord = '';
                    
                    // get 'pk' columns
                    for (col_i = 0, col_len = arrPk.length; col_i < col_len; col_i += 1) {
                        strRecord += (strRecord ? '\t' : '');
                        strRecord += GS.encodeForTabDelimited(arrSelectRecords[i].getAttribute('data-' + arrPk[col_i]));
                    }
                    
                    // get 'hash' columns
                    strRecordToHash = '';
                    for (col_i = 0, col_len = arrLock.length; col_i < col_len; col_i += 1) {
                        strRecordToHash += (strRecordToHash ? '\t' : '');
                        strTemp = arrSelectRecords[i].getAttribute('data-' + arrLock[col_i]);
                        strRecordToHash += (strTemp === '\\N' ? '' : strTemp);
                    }
                    
                    strRecord += (strRecord ? '\t' : '') + CryptoJS.MD5(strRecordToHash).toString();
                    
                    // get 'set' columns
                    for (col_i = 0, col_len = arrSetColumns.length; col_i < col_len; col_i += 1) {
                        cell = arrPasteRecords[i].children[col_i];
                        strRecord += (strRecord ? '\t' : '') + GS.encodeForTabDelimited(cell.innerText || cell.textContent);
                    }
                    
                    strUpdateData += strRecord + '\n';
                    arrUpdateRecords.push(arrSelectRecords[i]);
                }
                
                strUpdateData = (strRoles + '\n' + strColumns + '\n' + strUpdateData);
                updateRecords(element, strHashColumns, strUpdateData, arrUpdateRecords, (arrPasteRecords.length > 1));
            }
        }
    }
    
    
    
    
    
    // clean the slate and set initial html
    var datasheetID = 0;
    function prepareElement(element) {
        element.innerHTML = ml(function () {/*
            <div class="root" flex-vertical flex-fill>
                <div class="hud-container">
                    <gs-button icon="refresh" icononly no-focus inline title="Refresh Data." class="refresh-button" remove-bottom remove-right></gs-button><gs-button icon="times" icononly no-focus inline title="Delete Selected Records." class="delete-button" remove-bottom remove-left></gs-button>
                    <gs-button icon="filter" icononly no-focus inline title="Edit Filters." class="filter-button" remove-bottom hidden></gs-button>
                    <textarea class="hidden-focus-control">Focus Control</textarea>
                </div>
                <div class="scroll-container" flex></div>
                <style class="style-container" hidden></style>
            </div>
        */});
        
        // put a unique identifier on this datasheet and increment datasheetID
        element.setAttribute('data-sheet-id', datasheetID);
        element.datasheetID = datasheetID;
        datasheetID += 1;
        
        // save element shortcuts so that we don't have to do all kinds of selectors everywhere
        //      and so that we can change the structure of the element but not need to update selectors
        element.root = element.children[0];
        
        element.hudContainer    = element.root.children[0];
        element.scrollContainer = element.root.children[1];
        element.styleContainer  = element.root.children[2];
        
        element.refreshButton = element.hudContainer.children[0];
        element.deleteButton  = element.hudContainer.children[1];
        element.filterButton  = element.hudContainer.children[2];
        element.copyControl   = element.hudContainer.children[3];
    }
    
    // bind delegating events
    function bindElement(element) {
        // on focus control: set oldvalue for update
        element.addEventListener('focus', function (event) {
            if (event.target.hasAttribute('column')) {
                event.target.strOldValue = event.target.value;
            }
        }, true);
        
        if (!evt.touchDevice) {
            // focus copy control
            element.addEventListener('mousedown', function (event) {
                element.copyControl.focus();
            });
        }
        
        // copy
        element.copyControl.addEventListener('copy', function (event) {
            var strTextCopyString, strHTMLCopyString;
            
            if (document.activeElement.classList.contains('hidden-focus-control') ||
                document.activeElement.selectionStart === document.activeElement.selectionEnd) {
                
                GS.setInputSelection(document.activeElement, document.activeElement.value.length,
                                            document.activeElement.value.length);
                
                strTextCopyString = getSelectedCopyText(element);
                strHTMLCopyString = getSelectedCopyHTML(element);
                
                if (strTextCopyString && strHTMLCopyString) {
                    if (handleClipboardData(event, strTextCopyString, 'text')) {
                        event.preventDefault(event);
                    }
                    if (handleClipboardData(event, strHTMLCopyString, 'html')) {
                        event.preventDefault(event);
                    }
                }
                
                GS.setInputSelection(document.activeElement, 0, document.activeElement.value.length);
            }
        });
        
        // paste
        element.addEventListener('paste', function (event) {
            if (document.activeElement === element.copyControl) {
                event.preventDefault();
                pasteHandler(element, event);
            }
        });
        
        // selection
        if (!evt.touchDevice) {
            element.dragAllowed = false;
            element.numberOfSelections = 0;
            
            // on mousedown (event delagation style)
            element.addEventListener('mousedown', function (event) {
                var target = GS.findParentElement(event.target, 'th,td'), originalTarget = event.target;
                
                // if target is a cell: begin selection
                if (target && (target.nodeName === 'TH' || target.nodeName === 'TD')) {
                    // if shift key is down and there is currently a selection to connect to
                    element.dragOrigin = target;
                    if (event.shiftKey && xtag.query(element, '[selected]').length > 0) {
                        element.dragOrigin = element.selectionPreviousOrigin;
                    }
                    
                    // if ctrl and cmd are not down: deselect all cells
                    if (!event.metaKey && !event.ctrlKey) {
                        element.selectedCells = [];
                        element.savedSelection = [];
                        element.numberOfSelections = 0;
                    }
                    
                    element.savedSelectionCopy = element.savedSelection.slice(0);
                    element.dragAllowed = true;
                    element.dragCurrentCell = target;
                    element.numberOfSelections += 1;
                    
                    element.dragMode = 'select';
                    if (target.hasAttribute('selected')) {
                        element.dragMode = 'deselect';
                    }
                    
                    // if the original target is a cell or if the dragOrigin isn't the target cell or
                    //      if there are already selected cells: blur focused element and prevent default
                    if (originalTarget.nodeName === 'TH' || originalTarget.nodeName === 'TD' ||
                        element.dragOrigin !== target || element.selectedCells.length > 0) {
                        element.lastFocusedControl = null;
                        element.copyControl.focus();
                        event.preventDefault();
                    }
                    
                    selectHandler(element, element.dragOrigin, element.dragCurrentCell, element.dragMode);
                }
            });
            
            element.addEventListener('mousemove', function (event) {
                var cellFromTarget;
                
                // if mouse is down
                if (event.which !== 0) {
                    cellFromTarget = GS.findParentElement(event.target, 'th,td');
                    
                    // if selection is allowed at this point and closestCell is different from element.dragCurrentCell
                    if (cellFromTarget && element.dragAllowed && element.dragCurrentCell !== cellFromTarget) {
                        element.lastFocusedControl = null;
                        element.copyControl.focus();
                        
                        element.dragCurrentCell = cellFromTarget;
                        selectHandler(element, element.dragOrigin, element.dragCurrentCell, element.dragMode);
                        event.preventDefault();
                    }
                } else {
                    element.dragAllowed = false;
                    element.selectionPreviousOrigin = element.dragOrigin;
                }
            });
            
            element.addEventListener('mouseup', function (event) {
                if (element.dragAllowed) {
                    if (document.activeElement === element || document.activeElement === document.body) {
                        element.copyControl.focus();
                    }
                    element.dragAllowed = false;
                    element.selectionPreviousOrigin = element.dragOrigin;
                }
            });
        }
        
        // filter edit button
        element.filterButton.addEventListener('click', function () {
            var templateElement = document.createElement('template');
            
            templateElement.setAttribute('data-max-width', '300px');
            templateElement.setAttribute('data-overlay-close', 'true');
            
            templateElement.innerHTML = ml(function () {/*
                <gs-body padded>
                    <label for="memo-datagrid-filters">Filters:</label>
                    <gs-memo id="memo-datagrid-filters" rows="6" no-resize-handle></gs-memo>
                    <br />
                    <gs-grid>
                        <gs-block><gs-button dialogclose remove-right>Cancel</gs-button></gs-block>
                        <gs-block><gs-button dialogclose remove-all style="border-left: 0 none;">Clear Filters</gs-button></gs-block>
                        <gs-block><gs-button dialogclose remove-left style="border-left: 0 none;">Update Filters</gs-button></gs-block>
                    </gs-grid>
                </gs-body>
            */});
            
            GS.openDialogToElement(element.filterButton, templateElement, 'bottom', function () {
                document.getElementById('memo-datagrid-filters').value = element.getAttribute('user-where').replace(/\sAND\s/gi, '\nAND ');
                
            }, function (event, strAnswer) {
                var strValue = document.getElementById('memo-datagrid-filters').value;
                
                if (strAnswer === 'Clear Filters' || (strAnswer === 'Update Filters' && strValue.trim() === '')) {
                    element.removeAttribute('user-where');
                    element.filterButton.setAttribute('hidden', '');
                    getData(element);
                    
                } else if (strAnswer === 'Update Filters') {
                    element.setAttribute('user-where', strValue);
                    getData(element);
                }
            });
        });
        
        // filter popup
        var cellFloatingButtonFunction = function (targetCell) {
            var jsnElementPosition = GS.getElementPositionData(targetCell), strHTML;
            
            // targetCell is a th: remove the floating button if it exists
            if (targetCell.nodeName === 'TH') {
                if (element.cellFloatingButtonContainer && element.cellFloatingButtonContainer.parentNode) {
                    element.cellFloatingButtonContainer.parentNode.removeChild(element.cellFloatingButtonContainer);
                    element.cellFloatingButtonContainer = null;
                }
                
            // else: add the floating button
            } else {
                // if no floating button exists for this grid: create/append/bind one
                if (!element.cellFloatingButtonContainer || !element.cellFloatingButtonContainer.parentNode) {
                    element.cellFloatingButtonContainer = document.createElement('div');
                    element.cellFloatingButtonContainer.classList.add('floating-button-container');
                    
                    element.cellFloatingButtonContainer.innerHTML =
                                    '<gs-button icononly icon="filter" inline bg-primary no-focus></gs-button>';
                    
                    element.scrollContainer.appendChild(element.cellFloatingButtonContainer);
                    
                    element.cellFloatingButtonContainer.addEventListener(evt.mousedown, function () {
                        element.cellFloatingButtonContainer.targetControl.bolSubstring =
                            document.activeElement === element.cellFloatingButtonContainer.targetControl;
                    });
                    
                    element.cellFloatingButtonContainer.addEventListener('click', function () {
                        var jsnSelection = GS.getInputSelection(element.cellFloatingButtonContainer.targetControl),
                            templateElement = document.createElement('template'),
                            strMatchText = element.cellFloatingButtonContainer.targetControl.value;
                        
                        if (element.cellFloatingButtonContainer.targetControl.bolSubstring &&
                            jsnSelection.start !== jsnSelection.end) {
                            strMatchText = strMatchText.substring(jsnSelection.start, jsnSelection.end);
                        }
                        
                        templateElement.setAttribute('data-max-width', '250px');
                        templateElement.setAttribute('data-overlay-close', 'true');
                        
                        strHTML = '<gs-body padded>';
                        
                        if (evt.touchDevice) {
                            strHTML += '<gs-button class="text-left" dialogclose>Select Range</gs-button>';
                            strHTML += '<gs-button class="text-left" dialogclose>Select Records</gs-button><hr />';
                        }
                        
                        strHTML +=
                            '<gs-button class="text-left" dialogclose>Equals "<u>{{VALUE}}</u>"</gs-button>' +
                            '<gs-button class="text-left" dialogclose>Doesn\'t Equal "<u>{{VALUE}}</u>"</gs-button>' +
                            '<gs-button class="text-left" dialogclose>Contains "<u>{{VALUE}}</u>"</gs-button>' +
                            '<gs-button class="text-left" dialogclose>Doesn\'t Contain "<u>{{VALUE}}</u>"</gs-button>' +
                            '<gs-button class="text-left" dialogclose>Starts With "<u>{{VALUE}}</u>"</gs-button>' +
                            '<gs-button class="text-left" dialogclose>Ends With "<u>{{VALUE}}</u>"</gs-button>';
                        
                        strHTML += '</gs-body>';
                        
                        strHTML = strHTML.replace(/\{\{VALUE\}\}/gim, encodeHTML(strMatchText));
                        
                        templateElement.innerHTML = strHTML;
                        
                        GS.openDialogToElement(element.cellFloatingButtonContainer, templateElement, 'left', '',
                                                                                        function (event, strAnswer) {
                            var clickFunction
                              , addUserWhere = function (strNewWhere) {
                                    var strWhere = element.getAttribute('user-where');
                                    
                                    strWhere = (strWhere ? (strWhere + ' AND ' + strNewWhere) : strNewWhere);
                                    
                                    element.setAttribute('user-where', strWhere);
                                    element.filterButton.removeAttribute('hidden');
                                    getData(element);
                                }
                              , control = element.cellFloatingButtonContainer.targetCell.children[0];
                            
                            if (strAnswer === 'Select Range' || strAnswer === 'Select Records') {
                                if (strAnswer === 'Select Records') {
                                    element.dragOrigin = element.cellFloatingButtonContainer.targetCell.parentNode.children[0];
                                } else if (strAnswer === 'Select Range') {
                                    element.dragOrigin = element.cellFloatingButtonContainer.targetCell;
                                }
                                
                                element.selectedCells = [];
                                clickFunction = function (event) {
                                    var target;
                                    
                                    if (strAnswer === 'Select Records') {
                                        target = GS.findParentElement(event.target, 'tr');
                                        element.dragCurrentCell = target.children[0];
                                        
                                    } else if (strAnswer === 'Select Range') {
                                        target = GS.findParentElement(event.target, 'td,th');
                                        element.dragCurrentCell = target;
                                    }
                                    
                                    if (target) {
                                        element.selectionPreviousOrigin = element.dragOrigin;
                                        element.savedSelection = [];
                                        element.savedSelectionCopy = [];
                                        element.numberOfSelections = 1;
                                        element.dragMode = 'select';
                                        
                                        selectHandler(element, element.dragOrigin, element.dragCurrentCell, element.dragMode);
                                        
                                        document.activeElement.blur();
                                        event.preventDefault();
                                        element.removeEventListener('click', clickFunction, true);
                                    }
                                };
                                
                                element.addEventListener('click', clickFunction, true);
                                
                            } else if (strAnswer.indexOf('Equals') === 0) {
                                addUserWhere(control.getAttribute('column') + '::text = $$' + strMatchText + '$$');
                                
                            } else if (strAnswer.indexOf('Doesn\'t Equal') === 0) {
                                addUserWhere(control.getAttribute('column') + '::text != $$' + strMatchText + '$$');
                                
                            } else if (strAnswer.indexOf('Contains') === 0) {
                                addUserWhere(control.getAttribute('column') + '::text LIKE $$%' + strMatchText + '%$$');
                                
                            } else if (strAnswer.indexOf('Doesn\'t Contain') === 0) {
                                addUserWhere(control.getAttribute('column') + '::text NOT LIKE $$%' + strMatchText + '%$$');
                                
                            } else if (strAnswer.indexOf('Starts With') === 0) {
                                addUserWhere(control.getAttribute('column') + '::text LIKE $$' + strMatchText + '%$$');
                                
                            } else if (strAnswer.indexOf('Ends With') === 0) {
                                addUserWhere(control.getAttribute('column') + '::text LIKE $$%' + strMatchText + '$$');
                            }
                        });
                    });
                }
                
                // hover center next to the cell
                element.cellFloatingButtonContainer.targetCell = targetCell;
                element.cellFloatingButtonContainer.targetControl = targetCell.children[0];
                element.cellFloatingButtonContainer.children[0].removeAttribute('remove-top-left');
                element.cellFloatingButtonContainer.children[0].removeAttribute('remove-top-right');
                element.cellFloatingButtonContainer.children[0].removeAttribute('remove-bottom-left');
                element.cellFloatingButtonContainer.children[0].removeAttribute('remove-bottom-right');
                
                // top left
                if (jsnElementPosition.intRoomAbove > element.cellFloatingButtonContainer.clientHeight &&
                    jsnElementPosition.intRoomLeft > element.cellFloatingButtonContainer.clientWidth) {
                    element.cellFloatingButtonContainer.setAttribute('style',
                                'left: ' + ((jsnElementPosition.intElementLeft -
                                                element.cellFloatingButtonContainer.clientWidth) + 4) + 'px;' +
                                'top: ' + ((jsnElementPosition.intElementTop -
                                                element.cellFloatingButtonContainer.clientHeight) + 4) + 'px;');
                    
                    element.cellFloatingButtonContainer.children[0].setAttribute('remove-bottom-right', '');
                    
                // top right
                } else if (jsnElementPosition.intRoomAbove > element.cellFloatingButtonContainer.clientHeight &&
                           jsnElementPosition.intRoomRight > element.cellFloatingButtonContainer.clientWidth) {
                    element.cellFloatingButtonContainer.setAttribute('style',
                                'left: ' + ((jsnElementPosition.intElementLeft +
                                                jsnElementPosition.intElementWidth) - 4) + 'px;' +
                                'top: ' + ((jsnElementPosition.intElementTop -
                                                element.cellFloatingButtonContainer.clientHeight) + 4) + 'px;');
                    
                    element.cellFloatingButtonContainer.children[0].setAttribute('remove-bottom-left', '');
                    
                // bottom left
                } else if (jsnElementPosition.intRoomBelow > element.cellFloatingButtonContainer.clientHeight &&
                           jsnElementPosition.intRoomLeft > element.cellFloatingButtonContainer.clientWidth) {
                    element.cellFloatingButtonContainer.setAttribute('style',
                                'left: ' + ((jsnElementPosition.intElementLeft -
                                                element.cellFloatingButtonContainer.clientWidth) + 4) + 'px;' +
                                'top: ' + ((jsnElementPosition.intElementTop +
                                                jsnElementPosition.intElementHeight) - 4) + 'px;');
                    
                    element.cellFloatingButtonContainer.children[0].setAttribute('remove-top-right', '');
                    
                // bottom right
                } else if (jsnElementPosition.intRoomBelow > element.cellFloatingButtonContainer.clientHeight &&
                           jsnElementPosition.intRoomRight > element.cellFloatingButtonContainer.clientWidth) {
                    element.cellFloatingButtonContainer.setAttribute('style',
                                'left: ' + ((jsnElementPosition.intElementLeft +
                                                jsnElementPosition.intElementWidth) - 4) + 'px;' +
                                'top: ' + ((jsnElementPosition.intElementTop +
                                                jsnElementPosition.intElementHeight) - 4) + 'px;');
                    
                    element.cellFloatingButtonContainer.children[0].setAttribute('remove-top-left', '');
                }
            }
        };
        
        element.addEventListener('after_select', function (event) {
            var arrSelected = element.selectedCells;
            
            if (arrSelected.length === 1) {
                cellFloatingButtonFunction(element.dragCurrentCell || arrSelected[arrSelected.length - 1]);
                
            } else if (element.cellFloatingButtonContainer && element.cellFloatingButtonContainer.parentNode) {
                element.cellFloatingButtonContainer.parentNode.removeChild(element.cellFloatingButtonContainer);
                element.cellFloatingButtonContainer = null;
            }
        });
        
        element.addEventListener('focus', function (event) {
            if (event.target.hasAttribute('column')) {
                cellFloatingButtonFunction(event.target.parentNode);
            }
        }, true);// this true is for making it so that the focus event (which doesn't bubble) gets captured
        
        // on mousewheel: remove floating button (scroll version of this is in the handleData function)
        element.addEventListener('mousewheel', function (event) {
            if (element.cellFloatingButtonContainer && element.cellFloatingButtonContainer.parentNode) {
                element.cellFloatingButtonContainer.parentNode.removeChild(element.cellFloatingButtonContainer);
                element.cellFloatingButtonContainer = null;
            }
        });
        element.scrollContainer.addEventListener('scroll', function (event) {
            if (element.cellFloatingButtonContainer && element.cellFloatingButtonContainer.parentNode) {
                element.cellFloatingButtonContainer.parentNode.removeChild(element.cellFloatingButtonContainer);
                element.cellFloatingButtonContainer = null;
            }
        });
        
        
        // ################################################################
        // #################### TOUCH DEVICE CLIPBOARD ####################
        // ################################################################
        
        if (evt.touchDevice) {
            var rangeFloatingButtonFunction = function (arrSelected) {
                var i, len, targetCell, arrSelectedRecords, bolCenter = true, jsnElementPosition,
                    intTopBoundry, intBottomBoundry, intLeftBoundry, intRightBoundry;
                
                // if no floating button exists for this grid: create/append/bind one
                if (!element.rangeFloatingButtonContainer || !element.rangeFloatingButtonContainer.parentNode) {
                    element.rangeFloatingButtonContainer = document.createElement('div');
                    element.rangeFloatingButtonContainer.classList.add('floating-button-container');
                    
                    element.rangeFloatingButtonContainer.innerHTML =
                                    '<gs-button icononly icon="clipboard" inline bg-primary no-focus></gs-button>' +
                                    '<div contenteditable="true" style=" position: fixed;  border: 0 none;' +
                                                                        'margin: 0;        padding: 0;' +
                                                                        'z-index: -5000;   opacity: 0.00000001;' +
                                                                        '-webkit-appearance: none;' +
                                                                        '-moz-appearance: none;"></div>';
                    
                    element.scrollContainer.appendChild(element.rangeFloatingButtonContainer);
                    
                    element.rangeFloatingButtonContainer.control = element.rangeFloatingButtonContainer.children[1];
                    
                    element.rangeFloatingButtonContainer.addEventListener('click', function () {
                        element.rangeFloatingButtonContainer.control.innerHTML = getSelectedCopyHTML(element) || 'Nothing To Copy';
                        element.rangeFloatingButtonContainer.control.focus();
                        document.execCommand('selectAll', false, null);
                    });
                    
                    element.rangeFloatingButtonContainer.control.addEventListener('cut', function () {
                        var strSchema = element.getAttribute('schema')
                          , strObject = element.getAttribute('object')
                          , strUpdateData = '', strRecord, arrSetColumnElements, strHashColumns
                          , arrSetColumns = [], arrPk, arrLock, arrLines, arrRecords, tbodyElement, arrElements
                          , tr_len, i, len, col_i, col_len, colIndex, arrRecordsToRefresh = [], updateFunction
                          , strColumns = '', strRoles = '', strColumn, strRecordToHash, strTemp;
                        
                        // gathering variables for select traversal
                        arrRecords = element.selectedRecords;
                        
                        // if the first record is the header: remove it
                        if (arrRecords[0] && arrRecords[0].parentNode.nodeName === 'THEAD') {
                            arrRecords[0].splice(0, 1);
                        }
                        
                        arrSetColumnElements = xtag.query(arrRecords[0], '[selected]:not(th)');
                        
                        arrPk = (element.getAttribute('pk') || '').split(/[\s]*,[\s]*/);
                        arrLock = (element.getAttribute('lock') || '').split(/[\s]*,[\s]*/);
                        
                        // gathering update headers
                        for (i = 0, len = arrPk.length; i < len; i += 1) {
                            strRoles += (strRoles ? '\t' : '') + 'pk';
                            strColumns += (strColumns ? '\t' : '') + arrPk[i];
                        }
                        
                        for (i = 0, len = arrLock.length, strHashColumns = ''; i < len; i += 1) {
                            strHashColumns += (strHashColumns ? '\t' : '') + arrLock[i];
                        }
                        strRoles += (strRoles ? '\t' : '') + 'hash';
                        strColumns += (strColumns ? '\t' : '') + 'hash';
                        
                        for (i = 0, len = arrSetColumnElements.length; i < len; i += 1) {
                            strColumn = arrSetColumnElements[i].children[0].getAttribute('column');
                            
                            strRoles += (strRoles ? '\t' : '') + 'set';
                            strColumns += (strColumns ? '\t' : '') + strColumn;
                            arrSetColumns.push(strColumn);
                        }
                        
                        for (i = 0, len = arrRecords.length; i < len; i += 1) {
                            strRecord = '';
                            
                            // get 'pk' columns
                            for (col_i = 0, col_len = arrPk.length; col_i < col_len; col_i += 1) {
                                strRecord += (strRecord ? '\t' : '');
                                strRecord += GS.encodeForTabDelimited(arrRecords[i].getAttribute('data-' + arrPk[col_i]));
                            }
                            
                            // get 'hash' columns
                            strRecordToHash = '';
                            for (col_i = 0, col_len = arrLock.length; col_i < col_len; col_i += 1) {
                                strRecordToHash += (strRecordToHash ? '\t' : '');
                                strTemp = arrRecords[i].getAttribute('data-' + arrLock[col_i]);
                                strRecordToHash += (strTemp === '\\N' ? '' : strTemp);
                            }
                            
                            strRecord += (strRecord ? '\t' : '') + CryptoJS.MD5(strRecordToHash).toString();
                            
                            // get 'set' columns
                            for (col_i = 0, col_len = arrSetColumns.length; col_i < col_len; col_i += 1) {
                                strRecord += (strRecord ? '\t' : '');
                            }
                            
                            strRecord += '\n';
                            strUpdateData += strRecord;
                            arrRecordsToRefresh.push(arrRecords[i]);
                            
                            // make the records red
                            arrRecords[i].classList.add('bg-red');
                        }
                        
                        strUpdateData = (strRoles + '\n' + strColumns + '\n' + strUpdateData);
                        
                        // create update transaction
                        GS.addLoader(element, 'Creating Update Transaction...');
                        GS.requestUpdateFromSocket(
                            GS.envSocket, strSchema, strObject, getReturn(element), strHashColumns, strUpdateData,
                            function (data, error, transactionID) {
                                if (error) {
                                    getData(element);
                                    GS.removeLoader(element);
                                    GS.webSocketErrorDialog(data);
                                }
                            }, function (data, error, transactionID, commitFunction, rollbackFunction) {
                                GS.removeLoader(element);
                                
                                if (!error) {
                                    if (data !== 'TRANSACTION COMPLETED') {
                                        data = getReturn(element) + '\n' + data;
                                        
                                        // make the records amber and refresh their data
                                        refreshRecordsAfterUpdate(element, arrRecordsToRefresh, data);
                                    } else {
                                        commitFunction();
                                    }
                                    
                                } else {
                                    rollbackFunction();
                                    getData(element);
                                    GS.webSocketErrorDialog(data);
                                }
                            }, function (strAnswer, data, error) {
                                GS.removeLoader(element);
                                
                                if (!error) {
                                    if (strAnswer === 'COMMIT') {
                                        clearRecordColor(element, 'bg-amber', true);
                                    } else {
                                        getData(element);
                                    }
                                } else {
                                    getData(element);
                                    GS.webSocketErrorDialog(data);
                                }
                            }
                        );
                    });
                    element.rangeFloatingButtonContainer.control.addEventListener('copy', function (event) {
                        setTimeout(function () {
                            element.rangeFloatingButtonContainer.control.blur();
                            element.rangeFloatingButtonContainer.control.innerHTML = '';
                        }, 1);
                    });
                    element.rangeFloatingButtonContainer.control.addEventListener('paste', function (event) {
                        pasteHandler(element, event);
                        setTimeout(function () {
                            element.rangeFloatingButtonContainer.control.blur();
                            element.rangeFloatingButtonContainer.control.innerHTML = '';
                        }, 1);
                    });
                }
                
                // position button
                intTopBoundry = 99999999;
                intBottomBoundry = 99999999;
                intLeftBoundry = 99999999;
                intRightBoundry = 99999999;
                
                for (i = 0, len = arrSelected.length; i < len; i += 1) {
                    jsnElementPosition = GS.getElementPositionData(arrSelected[i]);
                    
                    if (jsnElementPosition.intElementTop < intTopBoundry) {
                        intTopBoundry = jsnElementPosition.intElementTop;
                    }
                    if (jsnElementPosition.intElementBottom < intBottomBoundry) {
                        intBottomBoundry = jsnElementPosition.intElementBottom;
                    }
                    if (jsnElementPosition.intElementLeft < intLeftBoundry) {
                        intLeftBoundry = jsnElementPosition.intElementLeft;
                    }
                    if (jsnElementPosition.intElementRight < intRightBoundry) {
                        intRightBoundry = jsnElementPosition.intElementRight;
                    }
                }
                
                // top right
                if (intTopBoundry >= 0 && intRightBoundry >= 0) {
                    element.rangeFloatingButtonContainer.style.top = (intTopBoundry + 4) + 'px';
                    element.rangeFloatingButtonContainer.style.right = (intRightBoundry + 4) + 'px';
                    
                // top left
                } else if (intTopBoundry >= 0 && intLeftBoundry >= 0) {
                    element.rangeFloatingButtonContainer.style.top = (intTopBoundry + 4) + 'px';
                    element.rangeFloatingButtonContainer.style.left = (intLeftBoundry + 4) + 'px';
                    
                // bottom right
                } else if (intBottomBoundry >= 0 && intRightBoundry >= 0) {
                    element.rangeFloatingButtonContainer.style.bottom = (intBottomBoundry + 4) + 'px';
                    element.rangeFloatingButtonContainer.style.right = (intRightBoundry + 4) + 'px';
                
                // bottom left
                } else if (intBottomBoundry >= 0 && intLeftBoundry >= 0) {
                    element.rangeFloatingButtonContainer.style.bottom = (intBottomBoundry + 4) + 'px';
                    element.rangeFloatingButtonContainer.style.left = (intLeftBoundry + 4) + 'px';
                }
            };
            
            element.addEventListener('after_select', function (event) {
                var arrSelected = element.selectedCells;
                
                if (arrSelected.length > 0 && element.numberOfSelections === 1) {
                    rangeFloatingButtonFunction(arrSelected);
                    
                } else if (element.rangeFloatingButtonContainer && element.rangeFloatingButtonContainer.parentNode) {
                    element.rangeFloatingButtonContainer.parentNode.removeChild(element.rangeFloatingButtonContainer);
                    element.rangeFloatingButtonContainer = null;
                }
            });
            
            element.scrollContainer.addEventListener('scroll', function (event) {
                if (element.rangeFloatingButtonContainer && element.rangeFloatingButtonContainer.parentNode) {
                    element.rangeFloatingButtonContainer.parentNode.removeChild(element.rangeFloatingButtonContainer);
                    element.rangeFloatingButtonContainer = null;
                }
            });
        }
        
        // ######################################################################################################
        // ######################################################################################################
        // ######################################################################################################
        
        // delete and refresh buttons
        element.addEventListener('click', function (event) {
            // delete button
            if (event.target.classList.contains('delete-button')) {
                deleteSelection(element);
                
            // refresh button
            } else if (event.target.classList.contains('refresh-button')) {
                getData(element);
            }
        });
        
        if (!evt.touchDevice) {
            element.addEventListener('keydown', function (event) {
                var intKeyCode = (event.which || event.keyCode);
                
                if (event.target === element.copyControl && (intKeyCode === KEY_BACKSPACE || intKeyCode === KEY_DELETE)) {
                    deleteSelection(element);
                    event.preventDefault();
                }
            });
        }
        
        // manuel update
        var updateFromEntry = function (target) {
            var updateRecord = GS.findParentElement(target, 'tr')
              , arrPk, arrLock, i, len, col_i, col_len, strRoles, strColumns
              , strHashColumns, strRecordToHash, strTemp, strRecord, strUpdateData;
            
            arrPk = (element.getAttribute('pk') || '').split(/[\s]*,[\s]*/);
            arrLock = (element.getAttribute('lock') || '').split(/[\s]*,[\s]*/);
            
            // gathering update headers
            for (i = 0, len = arrPk.length, strRoles = '', strColumns = ''; i < len; i += 1) {
                strRoles += (strRoles ? '\t' : '') + 'pk';
                strColumns += (strColumns ? '\t' : '') + arrPk[i];
            }
            
            for (i = 0, len = arrLock.length, strHashColumns = ''; i < len; i += 1) {
                strHashColumns += (strHashColumns ? '\t' : '') + arrLock[i];
            }
            strRoles += (strRoles ? '\t' : '') + 'hash';
            strColumns += (strColumns ? '\t' : '') + 'hash';
            
            strRoles += (strRoles ? '\t' : '') + 'set';
            strColumns += (strColumns ? '\t' : '') + target.getAttribute('column');
            
            // get update data
            strRecord = '';
            
            // get 'pk' columns
            for (col_i = 0, col_len = arrPk.length; col_i < col_len; col_i += 1) {
                strRecord += (strRecord ? '\t' : '');
                strRecord += GS.encodeForTabDelimited(updateRecord.getAttribute('data-' + arrPk[col_i]));
            }
            
            // get 'hash' columns
            strRecordToHash = '';
            for (col_i = 0, col_len = arrLock.length; col_i < col_len; col_i += 1) {
                strRecordToHash += (strRecordToHash ? '\t' : '');
                strTemp = updateRecord.getAttribute('data-' + arrLock[col_i]);
                strRecordToHash += (strTemp === '\\N' ? '' : strTemp);
            }
            
            strRecord += (strRecord ? '\t' : '') + CryptoJS.MD5(strRecordToHash).toString();
            
            // get 'set' column
            strRecord += (strRecord ? '\t' : '') + GS.encodeForTabDelimited(target.value);
            
            strUpdateData = (strRoles + '\n' + strColumns + '\n' + strRecord + '\n');
            updateRecords(element, strHashColumns, strUpdateData, [updateRecord], false);
        };
        
        element.addEventListener('keydown', function (event) {
            var intKeyCode = (event.which || event.keyCode), target = event.target;
            
            if (target.hasAttribute('column') && !GS.findParentElement(target, 'tr').classList.contains('insert-record') && !event.shiftKey) {
                if (intKeyCode === KEY_RETURN) {
                    updateFromEntry(event.target);
                    event.preventDefault();
                    event.target.strOldValue = event.target.value;
                }
            }
        });
        
        window.addEventListener('blur', function (event) {
            var target = event.target;
            
            if (element.parentNode) {
                if (GS.findParentElement(target, element) === element) {
                    if (target.hasAttribute('column')
                             && target.value !== target.strOldValue
                             && !GS.findParentElement(target, 'tr').classList.contains('insert-record')) {
                        updateFromEntry(target);
                        target.strOldValue = target.value;
                    }
                }
            }
        }, true);
        
        
        
        // manuel insert
        var insertFromInsertRecord = function () {
            var arrElements = xtag.query(element, 'tr.insert-record > td > [column]')
              , i, len, strColumns, strInsertData, strLocalColumns, strLocalData;
            
            strColumns = '';
            strInsertData = '';
            strLocalData = '';
            strLocalColumns = '';
            for (i = 0, len = arrElements.length; i < len; i += 1) {
                if (arrElements[i].value) {
                    if (strColumns) {
                        strColumns += '\t';
                        strInsertData += '\t';
                    }
                    
                    strColumns += arrElements[i].getAttribute('column');
                    strInsertData += GS.encodeForTabDelimited(arrElements[i].value || '\\N');
                }
                
                if (strLocalColumns) {
                    strLocalColumns += '\t';
                    strLocalData += '\t';
                }
                
                strLocalColumns += arrElements[i].getAttribute('column');
                strLocalData += GS.encodeForTabDelimited(arrElements[i].value || '');
                arrElements[i].value = '';
            }
            
            //console.log('     strColumns: ', strColumns);
            //console.log('  strInsertData: ', strInsertData);
            //console.log('strLocalColumns: ', strLocalColumns);
            //console.log('   strLocalData: ', strLocalData);
            
            insertRecords(element, strColumns, strInsertData + '\n', strLocalColumns, strLocalData + '\n', false);
        };
        
        element.addEventListener('keydown', function (event) {
            var intKeyCode = (event.which || event.keyCode), target = event.target;
            
            if (target.hasAttribute('column') && GS.findParentElement(target, 'tr').classList.contains('insert-record') && !event.shiftKey) {
                if (intKeyCode === KEY_RETURN) {
                    insertFromInsertRecord();
                    event.preventDefault();
                }
            }
        });
        
        //window.addEventListener('blur', function (event) {
        //    console.log('BLUR: ', event.target);
        //}, true);
        //
        //window.addEventListener('focus', function () {
        //    var i, len, bolInsert, parentTR
        //      , arrElements = xtag.query(element, 'tr.insert-record > td > [column]');
        //    
        //    for (i = 0, len = arrElements.length; i < len; i += 1) {
        //        if (arrElements[i].value) {
        //            bolInsert = true;
        //            break;
        //        }
        //    }
        //    
        //    parentTR = GS.findParentElement(document.activeElement, 'tr');
        //    
        //    console.log('FOCUS: ', parentTR, bolInsert);
        //    
        //    if ((parentTR.nodeName !== 'TR' || parentTR.classList.contains('insert-record') === false) && bolInsert) {
        //        console.log('FOCUS INSERT');
        //        insertFromInsertRecord();
        //    }
        //}, true);
        
        window.addEventListener(evt.mousedown, function (event) {
            var i, len, bolInsert, parentTR, arrElements = xtag.query(element, 'tr.insert-record > td > [column]');
            
            for (i = 0, len = arrElements.length; i < len; i += 1) {
                if (arrElements[i].value) {
                    bolInsert = true;
                    break;
                }
            }
            
            if (bolInsert) {
                parentTR = GS.findParentElement(event.target, 'tr');
                
                if (
                        (
                            parentTR.nodeName !== 'TR'
                         || parentTR.classList.contains('insert-record') === false
                         || !GS.isElementFocusable(event.target)
                        )
                    ) {
                    insertFromInsertRecord();
                }
            }
        }, true);
        
        // TAB out of last insert control
        element.addEventListener('keydown', function (event) {
            var i, len, bolInsert, parentCell, parentTR
              , arrElements = xtag.query(element, 'tr.insert-record > td > [column]');
            
            if (event.keyCode === KEY_TAB) {
                arrElements = xtag.query(element, 'tr.insert-record > td > [column]');
                
                for (i = 0, len = arrElements.length; i < len; i += 1) {
                    if (arrElements[i].value) {
                        bolInsert = true;
                        break;
                    }
                }
                
                
                parentCell = GS.findParentElement(event.target, 'td');
                parentTR = parentCell.parentNode;
                
                // if shiftKey and first
                if (event.shiftKey && parentCell.cellIndex === 1) {
                    insertFromInsertRecord();
                    
                // if no shiftKey and last cell
                } else if (!event.shiftKey && parentCell.cellIndex === (parentTR.children.length - 1)) {
                    insertFromInsertRecord();
                }
            }
        });
        
        // arrow navigation, key selection
        if (!evt.touchDevice) {
            element.addEventListener('keydown', function (event) {
                var intKeyCode = (event.which || event.keyCode)
                  , target = event.target, targetValue = target.value, bolNavigateMode = false
                  , parentCell, parentRecord, parentTBody, jsnCursorPos, intCursorPostition, bolSelect
                  , bolFullSelection, bolCursorAtFirst, bolCursorAtTop, bolCursorAtLast, bolCursorAtBottom
                  , arrSelected, arrRecords;
                
                // find out if we are in focus mode
                // if we are in a cell control: we might be in focus mode (we need to check further)
                if (target.hasAttribute('column')) {
                    jsnCursorPos = GS.getInputSelection(event.target);
                    
                    // if fill text selection and shift is down: not focus mode
                    if (!(jsnCursorPos.start === 0 && jsnCursorPos.end === event.target.value.length && event.shiftKey)) {
                        bolNavigateMode = true;
                    }
                }
                
                // if we're in navigate mode: change focused cell
                if (bolNavigateMode) {
                    jsnCursorPos = GS.getInputSelection(target);
                    
                    parentCell = GS.findParentElement(target, 'th,td');
                    parentRecord = parentCell.parentNode;
                    parentTBody = parentRecord.parentNode;
                    
                    bolFullSelection = (jsnCursorPos.start === 0 && jsnCursorPos.end === targetValue.length);
                    
                    // if we don't have a full selection and the selection is one character position
                    if (!bolFullSelection && jsnCursorPos.start === jsnCursorPos.end) {
                        // find out where the cursor is
                        intCursorPostition = jsnCursorPos.start;
                        bolCursorAtFirst = (intCursorPostition === 0);
                        bolCursorAtTop = (intCursorPostition < (targetValue.indexOf('\n') === -1 ?
                                                                    targetValue.length + 1 :
                                                                    targetValue.indexOf('\n') + 1)) ||
                                         (intCursorPostition === 0);
                        bolCursorAtLast = (intCursorPostition === targetValue.length);
                        bolCursorAtBottom = (intCursorPostition > targetValue.lastIndexOf('\n'));
                    }
                    
                    // if left arrow and (full selection or the cursor is at the first character)
                    if (intKeyCode === KEY_LEFT && (bolFullSelection || bolCursorAtFirst)) {
                        if (parentCell.previousElementSibling && parentCell.previousElementSibling.nodeName !== 'TH') {
                            parentCell.previousElementSibling.children[0].focus();
                            bolSelect = true;
                            
                        } else if (parentRecord.previousElementSibling) {
                            parentRecord.previousElementSibling.lastElementChild.children[0].focus();
                            bolSelect = true;
                        }
                        
                    // if up arrow and (full selection or the cursor is in the top line)
                    } else if (intKeyCode === KEY_UP && (bolFullSelection || bolCursorAtTop)) {
                        if (parentRecord.previousElementSibling) {
                            parentRecord.previousElementSibling.children[parentCell.cellIndex].children[0].focus();
                            bolSelect = true;
                            
                        } else if (parentCell.previousElementSibling && parentCell.previousElementSibling.nodeName !== 'TH') {
                            parentTBody.lastElementChild.children[parentCell.cellIndex - 1].children[0].focus();
                            bolSelect = true;
                        }
                        
                    // if right arrow and (full selection or the cursor is at the last character)
                    } else if (intKeyCode === KEY_RIGHT && (bolFullSelection || bolCursorAtLast)) {
                        if (parentCell.nextElementSibling && parentCell.nextElementSibling.nodeName !== 'TH') {
                            parentCell.nextElementSibling.children[0].focus();
                            bolSelect = true;
                            
                        } else if (parentRecord.nextElementSibling) {
                            parentRecord.nextElementSibling.children[1].children[0].focus();
                            bolSelect = true;
                        }
                        
                    // if down arrow  and (full selection or the cursor is in the last line)
                    } else if (intKeyCode === KEY_DOWN && (bolFullSelection || bolCursorAtBottom)) {
                        if (parentRecord.nextElementSibling) {
                            parentRecord.nextElementSibling.children[parentCell.cellIndex].children[0].focus();
                            bolSelect = true;
                        } else if (parentCell.nextElementSibling && parentCell.nextElementSibling.nodeName !== 'TH') {
                            parentTBody.firstElementChild.children[parentCell.cellIndex + 1].children[0].focus();
                            bolSelect = true;
                        }
                    }
                    
                    // if something was selected
                    if (bolSelect) {
                        // set selected cells
                        element.savedSelection = [];
                        element.savedSelectionCopy = [];
                        element.dragOrigin = document.activeElement.parentNode;
                        element.dragCurrentCell = element.dragOrigin;
                        element.selectionPreviousOrigin = element.dragOrigin;
                        element.numberOfSelections = 1;
                        element.dragMode = 'select';
                        
                        selectHandler(element, element.dragOrigin, element.dragCurrentCell, element.dragMode);
                        
                        // select all the text and scroll into view
                        GS.setInputSelection(document.activeElement, 0, document.activeElement.value.length);
                        GS.scrollIntoView(GS.findParentTag(document.activeElement, 'tr'));
                        
                        //console.log(document.activeElement);
                        
                        // this makes it so that the keyup doesn't happen,
                        //      allowing the new text selection to stay
                        event.preventDefault();
                    }
                // else: change selection
                } else if (event.target === element ||
                           event.target.hasAttribute('column') ||
                           event.target.classList.contains('hidden-focus-control')) {
                    
                    // if mouse selection is not happening right now
                    if (!element.dragAllowed) {
                        arrSelected = element.selectedCells;
                        
                        // if the key was tab
                        if (intKeyCode === KEY_TAB) {
                            // if is a selection origin: focus the inner control
                            if (element.dragOrigin) {
                                element.dragOrigin.children[0].focus();
                                
                                // this makes it so that the keyup doesn't happen,
                                //      allowing the new text selection to stay
                                event.preventDefault();
                            }
                            
                        // else if the key was return
                        } else if (intKeyCode === KEY_RETURN) {
                            // if there is only one cell selected: go into the cell control
                            if (arrSelected.length === 1) {
                                arrSelected[0].children[0].focus();
                            } else {
                                element.dragOrigin.children[0].focus();
                            }
                            
                            GS.setInputSelection(document.activeElement, document.activeElement.value.length);
                            GS.scrollIntoView(GS.findParentTag(document.activeElement, 'tr'));
                            
                            // this makes it so that the keyup doesn't happen,
                            //      allowing the new text selection to stay
                            event.preventDefault();
                            
                        // else if an arrow key was pressed
                        } else if (intKeyCode === KEY_UP || intKeyCode === KEY_DOWN || intKeyCode === KEY_LEFT || intKeyCode === KEY_RIGHT) {
                            arrRecords = xtag.query(element, 'tr');
                            element.dragMode = 'select';
                            
                            // if no selection: select first editable cell
                            if (arrSelected.length === 0) {
                                //console.log('2***');
                                element.savedSelection = [];
                                element.savedSelectionCopy = [];
                                element.dragOrigin = xtag.query(element, 'tbody td')[0];
                                element.dragCurrentCell = element.dragOrigin;
                                element.selectionPreviousOrigin = element.dragOrigin;
                                element.numberOfSelections = 1;
                                
                                bolSelect = true;
                                
                            // if shift: expand current selection
                            } else if (event.shiftKey) {
                                //console.log('3***', element.dragCurrentCell);
                                element.dragOrigin = element.selectionPreviousOrigin;
                                parentRecord = element.dragCurrentCell.parentNode;
                                
                                // if left arrow
                                if (intKeyCode === 37 && element.dragCurrentCell.previousElementSibling) {
                                    element.dragCurrentCell = element.dragCurrentCell.previousElementSibling;
                                    
                                // if up arrow
                                } else if (intKeyCode === 38 && arrRecords[parentRecord.rowIndex - 1]) {
                                    element.dragCurrentCell = arrRecords[parentRecord.rowIndex - 1]
                                                                    .children[element.dragCurrentCell.cellIndex];
                                    
                                // if right arrow
                                } else if (intKeyCode === 39 && element.dragCurrentCell.nextElementSibling) {
                                    element.dragCurrentCell = element.dragCurrentCell.nextElementSibling;
                                    
                                // if down arrow
                                } else if (intKeyCode === 40 && arrRecords[parentRecord.rowIndex + 1]) {
                                    element.dragCurrentCell = arrRecords[parentRecord.rowIndex + 1]
                                                                    .children[element.dragCurrentCell.cellIndex];
                                }
                                
                                bolSelect = true;
                                
                            // else: move selected cell based on origin cell
                            } else {
                                //console.log('4***', arrSelected.length);
                                if (arrSelected.length > 1) {
                                    element.dragCurrentCell = element.selectionPreviousOrigin;
                                }
                                
                                parentRecord = element.dragCurrentCell.parentNode;
                                
                                // if left arrow
                                if (intKeyCode === 37 && element.dragCurrentCell.previousElementSibling) {
                                    element.dragCurrentCell = element.dragCurrentCell.previousElementSibling;
                                    
                                // if up arrow
                                } else if (intKeyCode === 38 && arrRecords[parentRecord.rowIndex - 1]) {
                                    element.dragCurrentCell = arrRecords[parentRecord.rowIndex - 1]
                                                                    .children[element.dragCurrentCell.cellIndex];
                                    
                                // if right arrow
                                } else if (intKeyCode === 39 && element.dragCurrentCell.nextElementSibling) {
                                    element.dragCurrentCell = element.dragCurrentCell.nextElementSibling;
                                    
                                // if down arrow
                                } else if (intKeyCode === 40 && arrRecords[parentRecord.rowIndex + 1]) {
                                    element.dragCurrentCell = arrRecords[parentRecord.rowIndex + 1]
                                                                    .children[element.dragCurrentCell.cellIndex];
                                }
                                
                                element.savedSelection = [];
                                element.savedSelectionCopy = [];
                                element.dragOrigin = element.dragCurrentCell;
                                element.selectionPreviousOrigin = element.dragCurrentCell;
                                element.numberOfSelections = 1;
                                
                                bolSelect = true;
                            }
                            
                            // if the above code has produced the info for a selection: call the select handler
                            if (bolSelect) {
                                //console.log('5***', element, element.dragOrigin, element.dragCurrentCell, element.dragMode);
                                
                                element.lastFocusedControl = null;
                                element.copyControl.focus();
                                
                                selectHandler(element, element.dragOrigin, element.dragCurrentCell, element.dragMode);
                                GS.scrollIntoView(element.dragCurrentCell.parentNode);
                                event.preventDefault();
                            }
                        }
                    }
                }
            });
        }
    }
    
    function elementInserted(element) {
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                
                prepareElement(element);
                bindElement(element);
                getData(element);
            }
        }
    }
    
    xtag.register('gs-datagrid', {
        lifecycle: {
            created: function () {},
            
            inserted: function () {
                elementInserted(this);
            },
            
            attributeChanged: function (strAttrName, oldValue, newValue) {
                var element = this;
                
                // if "suspend-created" has been removed: run created and inserted code
                if (strAttrName === 'suspend-created' && newValue === null) {
                    elementInserted(element);
                    
                // if "suspend-inserted" has been removed: run inserted code
                } else if (strAttrName === 'suspend-inserted' && newValue === null) {
                    elementInserted(element);
                    
                } else if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
                    
                }
            }
        },
        events: {},
        accessors: {
            selectedCells: {
                get: function () {
                    return xtag.query(this, '[selected]');
                },
                
                set: function (newValue) {
                    var i, len, intIdIndex, arrCells = xtag.query(this, '[selected]'),
                        cell_i, cell_len, arrRowIndexes = [], arrHeaderIndexes = [],
                        arrRecordSelectors, arrHeaders, elmRow, arrRowElements;
                    
                    // clear old selection
                    for (i = 0, len = arrCells.length; i < len; i += 1) {
                        arrCells[i].removeAttribute('selected');
                    }
                    
                    arrCells = xtag.query(this, '[selected-secondary]');
                    for (i = 0, len = arrCells.length; i < len; i += 1) {
                        arrCells[i].removeAttribute('selected-secondary');
                    }
                    
                    // if newValue is not an array: make it an array
                    if (typeof newValue === 'object' && newValue.length === undefined) {
                        arrCells = [newValue];
                    } else {
                        arrCells = newValue;
                    }
                    
                    // set new selection
                    for (i = 0, len = arrCells.length; i < len; i += 1) {
                        GS.listAdd(arrRowIndexes, arrCells[i].parentNode.rowIndex);
                        GS.listAdd(arrHeaderIndexes, arrCells[i].cellIndex);
                        arrCells[i].setAttribute('selected', '');
                    }
                    
                    // highlight selected rows
                    for (i = 0, len = arrCells.length; i < len; i += 1) {
                        elmRow = arrCells[i].parentNode;
                        arrRowElements = xtag.query(elmRow, 'th, td');
                        
                        for (i = 0, len = arrRowElements.length; i < len; i += 1) {
                            if (!arrRowElements[i].hasAttribute('selected')) {
                                arrRowElements[i].setAttribute('selected-secondary', '');
                            }
                        }
                    }
                    
                    arrHeaders = xtag.query(this, 'thead th');
                    for (i = 0, len = arrHeaders.length; i < len; i += 1) {
                        if (arrHeaderIndexes.indexOf(i) !== -1 && !arrHeaders[i].hasAttribute('selected')) {
                            arrHeaders[i].setAttribute('selected-secondary', '');
                        }
                    }
                    
                    //console.log(arrRecordSelectors, arrHeaders, arrRowIndexes, arrHeaderIndexes);
                    
                    GS.triggerEvent(this, 'after_select');
                }
            },
            
            selectedRecords: {
                get: function () {
                    var i, len, intRecordIndex = -1, arrRecord = [], selected = this.selectedCells;
                    
                    // loop through the selected cells and create an array of trs
                    for (i = 0, len = selected.length; i < len; i += 1) {
                        if (selected[i].parentNode.rowIndex > intRecordIndex && selected[i].parentNode.parentNode.nodeName !== 'THEAD') {
                            intRecordIndex = selected[i].parentNode.rowIndex;
                            
                            arrRecord.push(selected[i].parentNode);
                        }
                    }
                    
                    return arrRecord;
                },
                
                set: function (newValue) {
                    var i, len, cell_i, cell_len, intIdIndex, arrCells = this.selectedCells, arrRecords, arrCellChildren;
                    
                    // clear old selection
                    for (i = 0, len = arrCells.length; i < len; i += 1) {
                        arrCells[i].removeAttribute('selected');
                    }
                    
                    arrCells = xtag.query(this, '[selected-secondary]');
                    for (i = 0, len = arrCells.length; i < len; i += 1) {
                        arrCells[i].removeAttribute('selected-secondary');
                    }
                    
                    // if newValue is not an array: make it an array
                    if (typeof newValue === 'object' && newValue.length === undefined) {
                        arrRecords = [newValue];
                    } else {
                        arrRecords = newValue;
                    }
                    
                    // set new selection
                    for (i = 0, len = arrRecords.length, arrCells = []; i < len; i += 1) {
                        arrCellChildren = arrRecords[i].children;
                        
                        for (cell_i = 0, cell_len = arrCellChildren.length; cell_i < cell_len; cell_i += 1) {
                            arrCells.push(arrCellChildren[cell_i]);
                        }
                    }
                    
                    this.selectedCells = arrCells;
                }
            }
        },
        methods: {
            'refresh': function () {
                getData(this);
            }
        }
    });
});