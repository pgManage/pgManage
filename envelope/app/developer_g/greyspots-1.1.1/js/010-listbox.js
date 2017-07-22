
window.addEventListener('design-register-element', function () {
    registerDesignSnippet('Static Template <gs-listbox>', '<gs-listbox>', 'gs-listbox>\n'+
                                                                     '    <template>\n'+
                                                                     '        <table>\n'+
                                                                     '            <tbody>\n'+
                                                                     '                <tr value="${1}">\n'+
                                                                     '                    <td>${0}</td>\n'+
                                                                     '                </tr>\n'+
                                                                     '            </tbody>\n'+
                                                                     '        </table>\n'+
                                                                     '    </template>\n' +
                                                                     '</gs-listbox>');
    registerDesignSnippet('Custom Template <gs-listbox>', '<gs-listbox>', 'gs-listbox src="${1:test.tpeople}">\n'+
                                                                     '    <template>\n'+
                                                                     '        <table>\n'+
                                                                     '            <tbody>\n'+
                                                                     '                <tr value="{{! row.id }}">\n'+
                                                                     '                    <td>{{! row.${3:name} }}</td>\n'+
                                                                     '                </tr>\n'+
                                                                     '            </tbody>\n'+
                                                                     '        </table>\n'+
                                                                     '    </template>\n' +
                                                                     '</gs-listbox>');
    registerDesignSnippet('Dynamic Template <gs-listbox>', '<gs-listbox>', 'gs-listbox src="${1:test.tpeople}"></gs-listbox>');
    registerDesignSnippet('<gs-listbox>', '<gs-listbox>', 'gs-listbox src="${1:test.tpeople}"></gs-listbox>');

    designRegisterElement('gs-listbox', '/env/app/developer_g/greyspots-' + GS.version() + '/documentation/doc-elem-listbox.html');

    window.designElementProperty_GSLISTBOX = function(selectedElement) {
        addProp('Source', true, '<gs-memo class="target" value="' + encodeHTML(decodeURIComponent(selectedElement.getAttribute('src') ||
                                                                            selectedElement.getAttribute('source') || '')) + '" mini></gs-memo>',
                function () {
            return setOrRemoveTextAttribute(selectedElement, 'src', encodeURIComponent(this.value));
        });

        addProp('Columns', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('cols') || '') + '" mini></gs-text>',
                function () {
            return setOrRemoveTextAttribute(selectedElement, 'cols', this.value);
        });

        addProp('Hide Columns', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('hide') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'hide', this.value);
        });

        addProp('Where', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('where') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'where', this.value);
        });

        addProp('Order By', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('ord') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'ord', this.value);
        });

        addProp('Limit', true, '<gs-number class="target" value="' + encodeHTML(selectedElement.getAttribute('limit') || '') + '" mini></gs-number>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'limit', this.value);
        });

        addProp('Offset', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('offset') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'offset', this.value);
        });

        addProp('Column', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('column') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'column', this.value);
        });

        addProp('Value', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('value') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'value', this.value);
        });

        addProp('Column In Querystring', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('qs') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'qs', this.value, false);
        });

        // TITLE attribute
        addProp('Title', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('title') || '') + '" mini></gs-text>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'title', this.value);
        });

        // TABINDEX attribute
        addProp('Tabindex', true, '<gs-number class="target" value="' + encodeHTML(selectedElement.getAttribute('tabindex') || '') + '" mini></gs-number>', function () {
            return setOrRemoveTextAttribute(selectedElement, 'tabindex', this.value);
        });

        // SUSPEND-CREATED attribute
        addProp('suspend-created', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-created') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suspend-created', this.value === 'true', true);
        });

        // SUSPEND-INSERTED attribute
        addProp('suspend-inserted', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('suspend-inserted') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'suspend-inserted', this.value === 'true', true);
        });

        // visibility attributes
        var strVisibilityAttribute = '';
        if (selectedElement.hasAttribute('hidden')) {
            strVisibilityAttribute = 'hidden';
        }
        if (selectedElement.hasAttribute('hide-on-desktop')) {
            strVisibilityAttribute = 'hide-on-desktop';
        }
        if (selectedElement.hasAttribute('hide-on-tablet')) {
            strVisibilityAttribute = 'hide-on-tablet';
        }
        if (selectedElement.hasAttribute('hide-on-phone')) {
            strVisibilityAttribute = 'hide-on-phone';
        }
        if (selectedElement.hasAttribute('show-on-desktop')) {
            strVisibilityAttribute = 'show-on-desktop';
        }
        if (selectedElement.hasAttribute('show-on-tablet')) {
            strVisibilityAttribute = 'show-on-tablet';
        }
        if (selectedElement.hasAttribute('show-on-phone')) {
            strVisibilityAttribute = 'show-on-phone';
        }

        addProp('Visibility', true, '<gs-select class="target" value="' + strVisibilityAttribute + '" mini>' +
                                        '<option value="">Visible</option>' +
                                        '<option value="hidden">Invisible</option>' +
                                        '<option value="hide-on-desktop">Invisible at desktop size</option>' +
                                        '<option value="hide-on-tablet">Invisible at tablet size</option>' +
                                        '<option value="hide-on-phone">Invisible at phone size</option>' +
                                        '<option value="show-on-desktop">Visible at desktop size</option>' +
                                        '<option value="show-on-tablet">Visible at tablet size</option>' +
                                        '<option value="show-on-phone">Visible at phone size</option>' +
                                    '</gs-select>', function () {
            selectedElement.removeAttribute('hidden');
            selectedElement.removeAttribute('hide-on-desktop');
            selectedElement.removeAttribute('hide-on-tablet');
            selectedElement.removeAttribute('hide-on-phone');
            selectedElement.removeAttribute('show-on-desktop');
            selectedElement.removeAttribute('show-on-tablet');
            selectedElement.removeAttribute('show-on-phone');

            if (this.value) {
                selectedElement.setAttribute(this.value, '');
            }

            return selectedElement;
        });

        // DISABLED attribute
        addProp('Disabled', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('disabled') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'disabled', this.value === 'true', true);
        });

        // NO-SELECT attribute
        addProp('Dissallow&nbsp;Select', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('no-select') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'no-select', this.value === 'true', true);
        });

        // LETTER-SCROLLBAR attribute
        addProp('Letter&nbsp;Scrollbar', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('letter-scrollbar') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'letter-scrollbar', this.value === 'true', true);
        });

        // LETTER-DIVIDERS attribute
        addProp('Letter Dividers', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('letter-dividers') || '') + '" mini></gs-checkbox>', function () {
            return setOrRemoveBooleanAttribute(selectedElement, 'letter-dividers', this.value === 'true', true);
        });
        
        addProp('Refresh On Querystring Columns', true, '<gs-text class="target" value="' + encodeHTML(selectedElement.getAttribute('refresh-on-querystring-values') || '') + '" mini></gs-text>', function () {
            this.removeAttribute('refresh-on-querystring-change');
            return setOrRemoveTextAttribute(selectedElement, 'refresh-on-querystring-values', this.value);
        });
        
        addProp('Refresh On Querystring Change', true, '<gs-checkbox class="target" value="' + (selectedElement.hasAttribute('refresh-on-querystring-change')) + '" mini></gs-checkbox>', function () {
            this.removeAttribute('refresh-on-querystring-values');
            return setOrRemoveBooleanAttribute(selectedElement, 'refresh-on-querystring-change', this.value === 'true', true);
        });
        
        //addFlexContainerProps(selectedElement);
        addFlexProps(selectedElement);
    };
});

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // removes selected class from old selected records adds class selected to record
    function highlightRecord(element, record) { //TODO: XLD
        var i, len, arrSelectedTrs;

        //console.log(record);

        if (element.tableElement && xtag.queryChildren(element.tableElement, 'tbody')[0]) {
            // clear previous selection
            arrSelectedTrs = xtag.queryChildren(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr[selected]');

            for (i = 0, len = arrSelectedTrs.length; i < len; i += 1) {
                arrSelectedTrs[i].removeAttribute('selected');
            }
        }

        // select/highlight the record that was provided
        if (record) {
            if (record.length >= 0) {

                for (i = 0, len = record.length; i < len; i += 1) {
                    record[i].setAttribute('selected', '');
                }
            } else {
                record.setAttribute('selected', '');
            }
        }
    }

    // loops through the records and finds a record using the parameter
    function findRecordFromValue(element, searchValue) {
        var i, len, matchedRecord, arrTrs, strSearchString;

        if (element.tableElement && xtag.queryChildren(element.tableElement, 'tbody')[0]) {
            //console.log('1***', element.tableElement);
            //console.log('2***', xtag.queryChildren(element.tableElement, 'tbody')[0]);
            //console.log('3***', xtag.queryChildren(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr'));
            arrTrs = xtag.queryChildren(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr');
            strSearchString = String(searchValue);

            // search exact text and search both the value attribute (if present) and the first td text
            for (i = 0, len = arrTrs.length; i < len; i += 1) {
                if (arrTrs[i].getAttribute('value') === strSearchString || xtag.queryChildren(arrTrs[i], 'td')[0].textContent === strSearchString) {
                    matchedRecord = arrTrs[i];
                    break;
                }
            }
        }

        return matchedRecord;
    }

    function getTRFromTarget(element) {
        var currentElement = element;

        while (currentElement.nodeName !== 'TR') {
            currentElement = currentElement.parentNode;
        }

        return currentElement;
    }
    //snapback
    
    //boladd should be true if event.metaKey is true
    
    //if boladd is true:
    //  selected records that were clicked become non-selected
    //  non-select records that were clicked become selected

    // if bolShift is true and not negative:
    //  select from element.lastClicked to the clicked record
    // if bolShift is true and negative:
    //  de-select from element.lastClicked to the clicked record
    //
    //

    function selectRecord(element, handle, bolChange, bolAdd, strType, bolShift) {
        if (!element.hasAttribute('no-select') && element.tableElement) {
            //console.log(element.secondLastClicked, element.lastClicked);
            var record, arrSelectedRecords = xtag.queryChildren(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr[selected], tr[selected-secondary]');
            //console.log(handle, bolChange, bolAdd, strType, bolShift);
            //console.trace('A');
            if (!bolAdd && !bolShift) {
                var i, len, arrRecords = xtag.query(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr');
                element.secondLastClicked = null;
                for (i = 0, len = arrRecords.length; i < len; i += 1) {
                    arrRecords[i].removeAttribute('selected');
                    if (arrRecords[i].classList.contains('originTR')) {
                        arrRecords[i].classList.remove('originTR');
                    }
                }
            }

            if (typeof handle === 'string' || typeof handle === 'number') {
                record = findRecordFromValue(element, handle);
                if (!record && handle !== '') {
                    console.warn('Listbox warning: record not found' + (typeof handle === 'string' ? ': "' + handle + '"' : ''));
                }
            } else {
                record = handle;
            }

            if (element.hasAttribute('multi-select')) {
                if (handle.length >= 0) {
                    record = record;
                } else {
                    record = [record];
                }
            }

            if (bolShift && strType === 'down') {
                var clickFrom, newClicked, arrOrigins = xtag.query(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr.originTR')
                    , arrAllRecords = xtag.query(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr'), bolDeselect, intDistanceBetween = 0
                    , intSelected = 0, bolRemoveClicked = false;
                //if we have a lastClicked
                //    use that
                //else if we have an originTR
                //    use that
                //else if there is one selected record
                //    use that
                if (element.lastClicked) {
                    clickFrom = element.lastClicked
                } else if (arrOrigins.length === 1) {
                    clickFrom = arrOrigins[0].getAttribute('data-record_no');
                } else if (arrSelectedRecords.length === 1) {
                    clickFrom = arrSelectedRecords[0].getAttribute('data-record_no');
                }

                //get the record that was just clicked
                if (typeof handle === 'object' && handle.tagName) {
                    newClicked = parseInt(handle.getAttribute('data-record_no'), 10);
                }

                //console.log(clickFrom, newClicked);
                if (newClicked) {
                    //find how many are selected between clickFrom and newClicked
                    if (clickFrom < newClicked) {
                        for (var i = clickFrom, len = newClicked; i < len; i++) {
                            if (handle.hasAttribute('selected') || handle.hasAttribute('selected-secondary')) {
                                intSelected += 1;
                            }
                        }
                    } else {
                        for (var i = newClicked - 1, len = clickFrom - 1; i < len; i++) {
                            if (handle.hasAttribute('selected') || handle.hasAttribute('selected-secondary')) {
                                intSelected += 1;
                            }
                        }
                    }

                    if (clickFrom < newClicked) {
                        intDistanceBetween = newClicked - clickFrom;
                    } else {
                        intDistanceBetween = clickFrom - newClicked;
                    }

                    //if all of the records are selected
                    //    bolDeselect = true
                    //else
                    //    bolDeselect = false
                    if (intDistanceBetween <= intSelected) {
                        bolDeselect = true;
                    } else {
                        bolDeselect = false;
                    }


                    //console.log(bolDeselect, intDistanceBetween, intSelected);
                    //if clickFrom is higher in the list than newClicked
                    //    select down from clickFrom to newClicked
                    //else
                    //    select down from newClicked to clickFrom
                    if (clickFrom < newClicked) {
                        if (bolDeselect) {
                            clickFrom -= 1;
                            newClicked -= 1;
                        }
                        for (var i = clickFrom, len = newClicked; i < len; i++) {
                            if (bolDeselect) {
                                if (arrAllRecords[i].hasAttribute('selected')) {
                                    arrAllRecords[i].removeAttribute('selected');
                                }
                                if (arrAllRecords[i].hasAttribute('selected-secondary')) {
                                    arrAllRecords[i].removeAttribute('selected-secondary');
                                }
                            } else {
                                arrAllRecords[i].setAttribute('selected', '');
                            }
                            arrAllRecords[i].classList.remove('originTR');
                        }
                    } else {
                        if (bolDeselect) {
                            newClicked += 1;
                            clickFrom += 1
                        }
                        for (var i = newClicked - 1, len = clickFrom; i < len; i++) {
                            if (bolDeselect) {
                                if (arrAllRecords[i].hasAttribute('selected')) {
                                    arrAllRecords[i].removeAttribute('selected');
                                }
                                if (arrAllRecords[i].hasAttribute('selected-secondary')) {
                                    arrAllRecords[i].removeAttribute('selected-secondary');
                                }
                            } else {
                                arrAllRecords[i].setAttribute('selected', '');
                            }
                            arrAllRecords[i].classList.remove('originTR');
                        }
                    }
                }


                //if bolDeselect is false
                //    deselect from clickFrom to the first non-selected record
                if (!bolDeselect) {
                    if (clickFrom < newClicked) {
                        if (element.secondLastClicked > clickFrom && element.secondLastClicked < newClicked) {
                            bolRemoveClicked = true;
                        }
                    } else {
                        if (element.secondLastClicked < clickFrom && element.secondLastClicked > newClicked) {
                            bolRemoveClicked = true;
                        }
                    }
                    
                    if (bolRemoveClicked) {
                        if (clickFrom < newClicked) {
                            for (var i = element.secondLastClicked - 2; i > 0; i--) {
                                    // console.log(arrAllRecords[i].outerHTML, arrAllRecords[i].hasAttribute('selected'), arrAllRecords[i].hasAttribute('selected-secondary'));
                                    arrAllRecords[i].classList.remove('originTR');

                                    if (arrAllRecords[i].hasAttribute('selected')) {
                                        arrAllRecords[i].removeAttribute('selected');
                                    } else if (arrAllRecords[i].hasAttribute('selected-secondary')) {
                                        arrAllRecords[i].removeAttribute('selected-secondary');
                                    } else {
                                        // console.log(arrAllRecords[i]);
                                        break;
                                    }
                            }
                        } else {
                            for (var i = element.secondLastClicked, len = arrAllRecords.length; i < len; i++) {
                                    arrAllRecords[i].classList.remove('originTR');
                                    if (arrAllRecords[i].hasAttribute('selected')) {
                                        arrAllRecords[i].removeAttribute('selected');
                                    } else if (arrAllRecords[i].hasAttribute('selected-secondary')) {
                                        arrAllRecords[i].removeAttribute('selected-secondary');
                                    } else {
                                        break;
                                    }
                            }
                        }
                    }
                    // console.log(bolRemoveClicked, i, len, bolDeselect, clickFrom < newClicked, element.secondLastClicked);
                }



                // var i_shift, len_shift, newNumber, arrOrigins = xtag.query(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr.originTR');
                // for (i_shift = 0, len_shift = arrOrigins.length; i_shift < len_shift; i_shift += 1) {
                //     arrOrigins[i_shift] = parseInt(arrOrigins[i_shift].getAttribute('data-record_no'),10);
                // }
                // newNumber = parseInt(handle.getAttribute('data-record_no'),10);

                // var currentNumber = arrOrigins[0];
                // var diff = Math.abs (newNumber - currentNumber);
                // for (var val = 0; val < arrOrigins.length; val++) {
                //     var newdiff = Math.abs (newNumber - arrOrigins[val]);
                //     if (newdiff < diff) {
                //         diff = newdiff;
                //         currentNumber = arrOrigins[val];
                //     }
                // }
                // // for (i_shift = 0, len_shift = arrOrigins.length; i_shift < len_shift; i_shift += 1) {
                // //     currentDiff = Math.abs(arrOrigins[i_shift] - newNumber);
                // //     //console.log(currentDiff, arrDiffs);
                // //     arrDiffs.push(currentDiff);
                // //     for (var i_diff = 0, len_diff = arrDiffs.length; i_diff < len_diff; i_diff += 1) {
                // //         if (currentDiff > arrDiffs[i_diff]) {
                // //             currentDiff = arrDiffs[i_diff];
                // //             currentNumber = arrOrigins[i_diff - 1];
                // //             // console.log(arrDiffs, i_diff);
                // //             //console.log(currentDiff, arrDiffs);
                // //         }
                // //     }
                // // }
                // var arrAllRecords = xtag.query(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr');
                // //console.log(newNumber, currentNumber);
                // //console.log(arrOrigins);
                // //console.log(handle.hasAttribute('selected') || handle.hasAttribute('selected-secondary'));
                // if (handle.hasAttribute('selected') || handle.hasAttribute('selected-secondary')) {
                //     if (arrOrigins.length === 1) {
                //         currentNumber = arrAllRecords.length;
                //     } else {
                //         if (newNumber > currentNumber) {
                //             if (arrOrigins[arrOrigins.indexOf(currentNumber) + 1]) {
                //                 currentNumber = arrOrigins[arrOrigins.indexOf(currentNumber) + 1] - 1;
                //             } else {
                //                 currentNumber = arrOrigins[arrOrigins.indexOf(currentNumber)];
                //             }
                //         } else {
                //             if (arrOrigins[arrOrigins.indexOf(currentNumber) - 1]) {
                //                 currentNumber = arrOrigins[arrOrigins.indexOf(currentNumber) - 1] - 1;
                //             } else {
                //                 currentNumber = arrOrigins[arrOrigins.indexOf(currentNumber)];
                //             }
                //         }
                //     }
                //     // console.log(newNumber, currentNumber);
                //     if (newNumber < currentNumber) {
                //         for (var i = newNumber - 1, len = currentNumber; i < len; i++) {
                //             arrAllRecords[i].removeAttribute('selected', '');
                //             arrAllRecords[i].classList.remove('originTR');
                //             //console.log(arrAllRecords[i]);
                //         }
                //     } else {
                //         for (var i = currentNumber, len = newNumber; i < len; i++) {
                //             arrAllRecords[i].removeAttribute('selected', '');
                //             arrAllRecords[i].classList.remove('originTR');
                //             //console.log(arrAllRecords[i]);
                //         }
                //     }
                    
                // } else {
                //     if (newNumber < currentNumber) {
                //         for (var i = newNumber - 1, len = currentNumber; i < len; i++) {
                //             arrAllRecords[i].setAttribute('selected-secondary', '');
                //             //console.log(arrAllRecords[i]);
                //         }
                //     } else {
                //         for (var i = currentNumber, len = newNumber; i < len; i++) {
                //             arrAllRecords[i].setAttribute('selected-secondary', '');
                //             //console.log(arrAllRecords[i]);
                //         }
                //     }
                //     handle.classList.add('originTR');
                // }

            } else if (strType === 'down') {
                element.originTR = record[0];
                //console.log(arrSelectedRecords);//handle, handle.hasAttribute('selected'));
                if (bolAdd && handle.hasAttribute('selected') && arrSelectedRecords.length > 1) {
                    handle.removeAttribute('selected');
                    if (handle.classList.contains('originTR')) {
                        handle.classList.remove('originTR');
                    }
                } else {
                    element.originTR.setAttribute('selected-secondary', '');
                }
            } else if (strType === 'move' && !bolShift) {
                var arrSelectedTrs = xtag.queryChildren(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr[selected-secondary]');

                // if (element.tableElement && xtag.queryChildren(element.tableElement, 'tbody')[0]) {
                //     // clear previous selection
                //     k
                //     for (i = 0, len = arrSelectedTrs.length; i < len; i += 1) {
                //         arrSelectedTrs[i].removeAttribute('selected-secondary');
                //     }
                // }

                var arrRecords = xtag.query(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr');
                var i, len, arrRecordsToAffect =
                    arrRecords.slice(Math.min(element.originTR.getAttribute('data-record_no')
                                        , record[0].getAttribute('data-record_no')) - 1
                                    , Math.max(element.originTR.getAttribute('data-record_no')
                                        , record[0].getAttribute('data-record_no')));

                for (i = 0, len = arrRecordsToAffect.length; i < len; i += 1) {
                    arrRecordsToAffect[i].setAttribute('selected-secondary', '');
                }
                
                //console.log('origin: ', element.originTR.rowIndex);
                //console.log('destination: ', record[0].rowIndex);
                //console.log('arrRecordsToAffect', arrRecordsToAffect);
                //console.log('arrRecordsToAffect.length', arrRecordsToAffect.length);
                //console.log('record', record);
            } else if (strType === 'up') {
                if (element.tableElement && xtag.queryChildren(element.tableElement, 'tbody')[0]) {
                    // clear previous selection
                    arrSelectedTrs = xtag.queryChildren(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr[selected-secondary]');

                    for (i = 0, len = arrSelectedTrs.length; i < len; i += 1) {
                        arrSelectedTrs[i].removeAttribute('selected-secondary');
                        arrSelectedTrs[i].setAttribute('selected', '');
                    }
                }
                if (record[0]) {
                    //console.trace('triggerchange 1');
                    element.triggerChange();
                }
            } else if (record) {
                // highlightRecord has its own checking for no record supplied,
                // so this deselects any rows then selects the supplied record or none
                if (element.hasAttribute('multi-select')) {
                    for (i = 0, len = record.length; i < len; i += 1) {
                        record[i].setAttribute('selected', '');
                    }
                } else {
                    record.setAttribute('selected', '');
                }
                //highlightRecord(element, record);
                //console.trace('triggerchange 2');
                element.triggerChange();
            }
            
            if (element.originTR) {
                element.originTR.classList.add('originTR');
            }
            
            //Save last clicked tr no for Shift-selecting
            if (typeof handle === 'object' && handle.tagName && strType === 'down') {
                //console.log(typeof handle, handle);
                if (element.lastClicked) {
                    element.secondLastClicked = element.lastClicked;
                }
                element.lastClicked = parseInt(handle.getAttribute('data-record_no'), 10);
            }
            // console.log(record, 'record');
            //console.log('3***', element.selectedRecord, element.value);
        }
    }


    // #################################################################
    // ########################## USER EVENTS ##########################
    // #################################################################

    // handle behaviours on keydown
    function handleKeyDown(event) {
        var element = event.target.parentNode, intKeyCode = event.keyCode || event.which, selectedTr, trs, i, len, selectedRecordIndex;
        
        if (!element.hasAttribute('disabled')) {
            if (!element.hasAttribute('no-select')) {
                if ((intKeyCode === 40 || intKeyCode === 38) && (!event.shiftKey) && !event.metaKey && !event.ctrlKey && !element.error) {
                    //console.log(element.parentNode);
                    trs = xtag.query(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr:not(.divider)');
                    
                    for (i = 0, len = trs.length; i < len; i += 1) {
                        if (trs[i].hasAttribute('selected')) {
                            selectedRecordIndex = i;
                            selectedTr = trs[i];
                            trs[i].removeAttribute('selected');
                            
                            break;
                        }
                    }
                    
                    if (intKeyCode === 40) {// next record or circle to first record or start selection at the first
                        if (!selectedTr || selectedRecordIndex === trs.length - 1) {
                            highlightRecord(element, trs[0]);
                            selectedTr = trs[0];
                            
                        } else {
                            highlightRecord(element, trs[selectedRecordIndex + 1]);
                            selectedTr = trs[selectedRecordIndex + 1];
                        }
                        
                    } else if (intKeyCode === 38) {// prev record or circle to last record or start selection at the last
                        if (!selectedTr || selectedRecordIndex === 0) {
                            highlightRecord(element, trs[trs.length - 1]);
                            selectedTr = trs[trs.length - 1];
                            
                        } else {
                            highlightRecord(element, trs[selectedRecordIndex - 1]);
                            selectedTr = trs[selectedRecordIndex - 1];
                        }
                    }
                    
                    //GS.scrollIntoView(selectedTr);
                    element.scrollToSelectedRecord();
                    event.preventDefault();
                    event.stopPropagation();
                    
                } else if (event.keyCode === 13) {
                    selectedTr = xtag.query(xtag.query(element.tableElement, 'tbody')[0], 'tr[selected]')[0];
                    
                    if (element.tableElement && selectedTr) {
                        selectRecord(element, selectedTr, true);
                    }
                }
            }
        } else {
            if (event.keyCode !== 9) {
                event.preventDefault();
                event.stopPropagation();
            }
        }
        
        //console.log('handleKeyDown', intKeyCode, event);
    }
    
    function handleFocusout(event) {
        //TODO: XLD
        /*
        var element = event.target, selectedTr;
        
        if (element.tableElement) {
            selectedTr = xtag.queryChildren(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr[selected]')[0];
            
            if (selectedTr) {
                selectRecord(element, selectedTr, true);
            }
        }
        */
    }
    
    
    // #################################################################
    // ######################### DATA HANDLING #########################
    // #################################################################
    
    
    // handles fetching the data
    //      if bolInitalLoad === true then
    //          use: initialize query COALESCE TO source query
    //      else
    //          use: source query
    function getData(element, callback, bolInitalLoad, bolClearPrevious) {
        var strSrc     = GS.templateWithQuerystring(
                            (bolInitalLoad && element.getAttribute('initialize')
                                ? element.getAttribute('initialize')
                                : element.getAttribute('src')
                            )
                        )
          , srcParts   = strSrc[0] === '(' ? [strSrc, ''] : strSrc.split('.')
          , strSchema  = srcParts[0]
          , strObject  = srcParts[1]
          , strColumns = GS.templateWithQuerystring(element.getAttribute('cols') || '*').split(',').join('\t')
          , strWhere   = GS.templateWithQuerystring(element.getAttribute('where') || '')
          , strOrd     = GS.templateWithQuerystring(element.getAttribute('ord') || '')
          , strLimit   = GS.templateWithQuerystring(element.getAttribute('limit') || '')
          , strOffset  = GS.templateWithQuerystring(element.getAttribute('offset') || '')
          , response_i = 0, response_len = 0, arrTotalRecords = [];
        
        GS.addLoader(element, 'Loading...');
        GS.requestSelectFromSocket(GS.envSocket, strSchema, strObject, strColumns
                                 , strWhere, strOrd, strLimit, strOffset
                                 , function (data, error) {
            var arrRecords, arrCells, envData
              , i, len, cell_i, cell_len;
            
            //console.log(data);
            
            if (!error) {
                if (data.strMessage !== 'TRANSACTION COMPLETED') {
                    arrRecords = GS.trim(data.strMessage, '\n').split('\n');
                    
                    for (i = 0, len = arrRecords.length; i < len; i += 1) {
                        arrCells = arrRecords[i].split('\t');
                        
                        for (cell_i = 0, cell_len = arrCells.length; cell_i < cell_len; cell_i += 1) {
                            arrCells[cell_i] = arrCells[cell_i] === '\\N' ? null : GS.decodeFromTabDelimited(arrCells[cell_i]);
                        }
                        
                        arrTotalRecords.push(arrCells);
                    }
                } else {
                    GS.removeLoader(element);
                    element.arrColumnNames = data.arrColumnNames;
                    
                    envData = {'arr_column': element.arrColumnNames, 'dat': arrTotalRecords};
                    
                    handleData(element, bolInitalLoad, envData);
                    GS.triggerEvent(element, 'after_select');
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            } else {
                handleData(element, bolInitalLoad, data, error);
                GS.removeLoader(element);
            }
        });
    }
    
    // handles data result from method function: getData 
    //      success:  template
    //      error:    add error classes
    function handleData(element, bolInitalLoad, data, error) {
        var strTemplate, divElement, tableElement, theadElement, theadCellElements, tbodyElement, tbodyCellElements, lastRecordElement,
            recordElements, recordElement, currentCellLabelElement, template, i, len, arrHeaders = [], arrHide, intVisibleColumns, strHeaderCells, strRecordCells, jsnTemplate, strHTML;
        
        // clear any old error status
        element.classList.remove('error');
        element.setAttribute('title', '');
        
        //console.log(error, data, bolInitalLoad);
        
        // if there was no error
        if (!error) {
            element.error = false;
            
            if (element.tableTemplate) {// element.tableTemplateElement
                strTemplate = element.tableTemplate;// element.tableTemplateElement
                
            } else {
                // create an array of hidden column numbers
                arrHide = (element.getAttribute('hide') || '').split(/[\s]*,[\s]*/);
                
                // build up the header cells variable and the record cells variable
                for (i = 0, len = data.arr_column.length, strHeaderCells = '', strRecordCells = '', intVisibleColumns = 0; i < len; i += 1) {
                    // if this column is not hidden
                    if (arrHide.indexOf((i + 1) + '') === -1 && arrHide.indexOf(data.arr_column[i]) === -1) {
                        // append a new cell to each of the header cells and record cells variables
                        strHeaderCells += '<th gs-dynamic>' + encodeHTML(data.arr_column[i]) + '</th> ';
                        strRecordCells += '<td gs-dynamic>{{! row[\'' + data.arr_column[i] + '\'] }}</td> ';
                        intVisibleColumns += 1;
                    }
                }
                
                // put everything together
                strTemplate =   '<table gs-dynamic>';
                
                if (intVisibleColumns > 1) { // data.arr_column.length (didn't take into account hidden columns)
                    strTemplate +=  '<thead gs-dynamic>' +
                                        '<tr gs-dynamic>' +
                                            strHeaderCells +
                                        '</tr>' +
                                    '</thead>';
                }
                
                strTemplate +=      '<tbody gs-dynamic>' +
                                        '<tr data-record_no="{{! row.row_number }}" value="{{! row[\'' + data.arr_column[0] + '\'] }}" gs-dynamic>' +
                                            strRecordCells +
                                        '</tr>' +
                                    '</tbody>' +
                                '<table>';
            }
            
            divElement = document.createElement('div');
            divElement.innerHTML = strTemplate;
            
            tableElement = xtag.queryChildren(divElement, 'table')[0];
            theadElement = xtag.queryChildren(tableElement, 'thead')[0];
            tbodyElement = xtag.queryChildren(tableElement, 'tbody')[0];
            
            // if there is a tbody
            if (tbodyElement) {
                recordElement = xtag.queryChildren(tbodyElement, 'tr')[0];
                
                // if there is a record: template
                if (recordElement) {
                    
                    // if there is a thead element: add reflow cell headers to the tds
                    if (theadElement) {
                        theadCellElements = xtag.query(theadElement, 'td, th');
                        tbodyCellElements = xtag.query(tbodyElement, 'td, th');
                        
                        for (i = 0, len = theadCellElements.length; i < len; i += 1) {
                            currentCellLabelElement = document.createElement('b');
                            currentCellLabelElement.classList.add('cell-label');
                            currentCellLabelElement.setAttribute('data-text', (theadCellElements[i].textContent || '') + ':');
                            
                            if (tbodyCellElements[i].childNodes) {
                                tbodyCellElements[i].insertBefore(currentCellLabelElement, tbodyCellElements[i].childNodes[0]);
                            } else {
                                tbodyCellElements[i].insertChild(currentCellLabelElement);
                            }
                        }
                    }
                    
                    // template
                    jsnTemplate = GS.templateHideSubTemplates(tbodyElement.innerHTML, true);
                    strHTML = GS.templateWithEnvelopeData(jsnTemplate.templateHTML, data);
                    tbodyElement.innerHTML = GS.templateShowSubTemplates(strHTML, jsnTemplate);
                    
                    element.tableElement = tableElement;
                    element.syncView();
                    element.internalData.records = data;
                }
            }
            
            //console.log('1***', bolInitalLoad, element.getAttribute('value'));
            
            //if (bolInitalLoad && element.getAttribute('value')) {
            //    //console.log('2***', bolInitalLoad, element.getAttribute('value'));
            //    selectRecord(element, element.getAttribute('value'), false);
            //    element.scrollToSelectedRecord();
            //    
            //// select first record
            //} else
            
            if (bolInitalLoad && !element.getAttribute('value') && element.hasAttribute('select-first')) {
                selectRecord(element, xtag.query(element, 'tbody tr')[0].getAttribute('value'), false);
                element.scrollToSelectedRecord();
            }
            
        // else there was an error: add error class, title attribute
        } else {
            element.error = true;
            element.classList.add('error');
            element.setAttribute('title', 'This listbox has failed to load.');
            
            element.setAttribute('disabled', '');
            
            GS.ajaxErrorDialog(data);
        }
    }
    
    function getParentCell(element) {
        var currentElement = element;
        
        while (currentElement.nodeName !== 'TD' && currentElement.nodeName !== 'TH' && currentElement.nodeName !== 'HTML') {
            currentElement = currentElement.parentNode;
        }
        
        if (currentElement.nodeName !== 'TD' && currentElement.nodeName !== 'TH') {
            return undefined;
        }
        
        return currentElement;
    }
    
    function windowResizeHandler() {
        var i, len, arrElement;
        
        arrElement = document.getElementsByTagName('gs-listbox');
        
        for (i = 0, len = arrElement.length; i < len; i += 1) {
            if (GS.pxToEm(document.body, this.oldWidth) !== GS.pxToEm(document.body, this.offsetWidth) && // <== if the width (in ems) changes
                arrElement[i].hasAttribute('letter-scrollbar') &&
                arrElement[i].tableElement) {
                
                if (arrElement[i].hasAttribute('letter-dividers') || arrElement[i].hasAttribute('letter-scrollbar')) {
                    arrElement[i].refreshDividingPoints();
                }
                arrElement[i].letterScrollbarHandler();
                this.oldWidth = this.offsetWidth;
            }
        }
    }
    
    window.addEventListener('resize', windowResizeHandler);  // I want to debounce this event but that would require a timer -michael
    window.addEventListener('orientationchange', windowResizeHandler);
    
    //function pushReplacePopHandler(element) {
    //    var i, len, currentValue, bolRefresh = false, strQueryString = GS.getQueryString(), arrPopKeys, strQSCol = element.getAttribute('qs');
    //    
    //    if (strQSCol && GS.qryGetKeys(strQueryString).indexOf(strQSCol) > -1 && element.value !== GS.qryGetVal(strQueryString, strQSCol)) {
    //        element.value = GS.qryGetVal(strQueryString, strQSCol);
    //    }
    //    
    //    // if this element has a refresh-on-querystring-values attribute: check for changes
    //    if (element.hasAttribute('refresh-on-querystring-values')) {
    //        arrPopKeys = element.getAttribute('refresh-on-querystring-values').split(/\s*,\s*/gim);
    //        
    //        for (i = 0, len = arrPopKeys.length; i < len; i += 1) {
    //            currentValue = GS.qryGetVal(strQueryString, arrPopKeys[i]);
    //            
    //            if ((element.popValues[arrPopKeys[i]] || '') !== currentValue) {
    //                bolRefresh = true;
    //            }
    //            
    //            element.popValues[arrPopKeys[i]] = currentValue;
    //        }
    //        
    //    } else if (element.hasAttribute('refresh-on-querystring-change')) {
    //        bolRefresh = true;
    //    }
    //    
    //    if (bolRefresh) {
    //        element.refresh();
    //    }
    //}
    function saveDefaultAttributes(element) {
        var i;
        var len;
        var arrAttr;
        var jsnAttr;

        // we need a place to store the attributes
        element.internal.defaultAttributes = {};

        // loop through attributes and store them in the internal defaultAttributes object
        i = 0;
        len = element.attributes.length;
        arrAttr = element.attributes;
        while (i < len) {
            jsnAttr = element.attributes[i];

            element.internal.defaultAttributes[jsnAttr.nodeName] = (jsnAttr.nodeValue || '');

            i += 1;
        }
    }

    function pushReplacePopHandler(element) {
        var i;
        var len;
        var strQS = GS.getQueryString();
        var strQSCol = element.getAttribute('qs');
        var strQSValue;
        var strQSAttr;
        var arrQSParts;
        var arrAttrParts;
        var arrPopKeys;
        var currentValue;
        var bolRefresh;
        var strOperator;

        element.supressChange = false;

        if (strQSCol) {
            if (strQSCol.indexOf('=') !== -1) {
                arrAttrParts = strQSCol.split(',');
                i = 0;
                len = arrAttrParts.length;
                while (i < len) {
                    strQSCol = arrAttrParts[i];
    
                    if (strQSCol.indexOf('!=') !== -1) {
                        strOperator = '!=';
                        arrQSParts = strQSCol.split('!=');
                    } else {
                        strOperator = '=';
                        arrQSParts = strQSCol.split('=');
                    }
    
                    strQSCol = arrQSParts[0];
                    strQSAttr = arrQSParts[1] || arrQSParts[0];
    
                    // if the key is not present or we've got the negator: go to the attribute's default or remove it
                    if (strOperator === '!=') {
                        // if the key is not present: add the attribute
                        if (GS.qryGetKeys(strQS).indexOf(strQSCol) === -1) {
                            element.setAttribute(strQSAttr, '');
                        // else: remove the attribute
                        } else {
                            element.removeAttribute(strQSAttr);
                        }
                    } else {
                        // if the key is not present: go to the attribute's default or remove it
                        if (GS.qryGetKeys(strQS).indexOf(strQSCol) === -1) {
                            if (element.internal.defaultAttributes[strQSAttr] !== undefined) {
                                element.setAttribute(strQSAttr, (element.internal.defaultAttributes[strQSAttr] || ''));
                            } else {
                                element.removeAttribute(strQSAttr);
                            }
                        // else: set attribute to exact text from QS
                        } else {
                            element.setAttribute(strQSAttr, (
                                GS.qryGetVal(strQS, strQSCol) ||
                                element.internal.defaultAttributes[strQSAttr] ||
                                ''
                            ));
                        }
                    }
                    i += 1;
                }
            } else if (GS.qryGetKeys(strQS).indexOf(strQSCol) > -1) {
                strQSValue = GS.qryGetVal(strQS, strQSCol);
    
                if (element.internal.bolQSFirstRun !== true) {
                    if (strQSValue !== '' || !element.getAttribute('value')) {
                        element.supressChange = true;
                        element.setAttribute('value', strQSValue);
                    }
                } else if (element.value !== strQSValue) {
                    element.value = strQSValue;
                }
            }
        }
        
        // handle "refresh-on-querystring-values" and "refresh-on-querystring-change" attributes
        if (element.internal.bolQSFirstRun === true) {
            if (element.hasAttribute('refresh-on-querystring-values')) {
                arrPopKeys = element.getAttribute('refresh-on-querystring-values').split(/\s*,\s*/gim);
                
                for (i = 0, len = arrPopKeys.length; i < len; i += 1) {
                    currentValue = GS.qryGetVal(strQS, arrPopKeys[i]);
                    
                    if (element.popValues[arrPopKeys[i]] !== currentValue) {
                        bolRefresh = true;
                    }
                    
                    element.popValues[arrPopKeys[i]] = currentValue;
                }
            } else if (element.hasAttribute('refresh-on-querystring-change')) {
                bolRefresh = true;
            }
            
            if (bolRefresh && element.hasAttribute('src')) {
                getData(element);
            } else if (bolRefresh && !element.hasAttribute('src')) {
                console.warn('gs-combo Warning: element has "refresh-on-querystring-values" or "refresh-on-querystring-change", but no "src".', element);
            }
        } else {
            if (element.hasAttribute('refresh-on-querystring-values')) {
                arrPopKeys = element.getAttribute('refresh-on-querystring-values').split(/\s*,\s*/gim);
                
                for (i = 0, len = arrPopKeys.length; i < len; i += 1) {
                    element.popValues[arrPopKeys[i]] = GS.qryGetVal(strQS, arrPopKeys[i]);
                }
            }
        }
        
        element.internal.bolQSFirstRun = true;
    }
    
    // dont do anything that modifies the element here
    function elementCreated(element) {
        // if "created" hasn't been suspended: run created code
        if (!element.hasAttribute('suspend-created')) {
            // if the value was set before the "created" lifecycle code runs: set attribute
            //      (discovered when trying to set a value of a date control in the after_open of a dialog)
            //      ("delete" keyword added because of firefox)
            if (element.value && !element.getAttribute('value')) {
                element.setAttribute('value', element.value);
                delete element.value;
                //element.value = null;
            }
        }
    }

    // ############# COPY EVENTS #############
    function unbindCopy(element) {
        element.removeEventListener(
            'copy',
            element.copySelection
        );
    }
    function bindCopy(element) {
        // console.log('running1');
        element.copySelection = function (event) {
            // console.log('running2');
            var jsnCopyString = {};
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

                // focus the hidden focus control and select all of it's text so
                //      that Firefox will allow us to override the clipboard
                focusedElement = element.hiddenFocusControl;
                focusedElement.focus();

                GS.setInputSelection(
                    focusedElement,
                    0,
                    focusedElement.value.length
                );

                jsnCopyString.text = '';
                jsnCopyString.html = '';

                // we want to override the text and HTML mime type clipboards,
                //      so we get the copy text for both types
                var selectedRecords = element.selectedRecord;
                if (selectedRecords[0]) {
                    for (var i = 0, len = selectedRecords.length; i < len; i++) {
                        if (i < 1) {
                            jsnCopyString.text += selectedRecords[i].innerText;
                            //jsnCopyString.html += selectedRecords[i].innerHTML;
                        } else {
                            jsnCopyString.text += '\n' + selectedRecords[i].innerText;
                            //jsnCopyString.html += '\n' + selectedRecords[i].innerHTML;
                        }
                    }
                //not multi-select
                } else {
                    jsnCopyString.text = selectedRecords.innerText;
                    //jsnCopyString.html = selectedRecords.innerHTML;
                    // console.log(selectedRecords);
                }
                // console.log(jsnCopyString);
                //jsnCopyString = getCopyStrings(element);

                // override clipboard (prevent event default if we are
                //      successful)
                if (handleClipboardData(event, jsnCopyString.text, 'text')) {
                    event.preventDefault(event);
                }
                // if (handleClipboardData(event, jsnCopyString.html, 'html')) {
                //     event.preventDefault(event);
                // }


                console.timeEnd('copy');
            }
        };

        element.hiddenFocusControl.addEventListener(
            'copy',
            element.copySelection
        );
    }

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

    //
    function elementInserted(element) {
        var tableTemplateElement, arrElement, recordElement, tableTemplateElementCopy, strQSValue, i, len, currentElement;
        
        // if "created" hasn't been suspended and "inserted" hasn't been suspended: run inserted code
        if (!element.hasAttribute('suspend-created') && !element.hasAttribute('suspend-inserted')) {
            // if this is the first time inserted has been run: continue
            if (!element.inserted) {
                element.inserted = true;
                element.error = false;
                element.internal = {};
                element.internalData = {};
                saveDefaultAttributes(element);
                // handle "qs" attribute
                if (element.hasAttribute('qs') ||
                        element.hasAttribute('refresh-on-querystring-values') ||
                        element.hasAttribute('refresh-on-querystring-change')) {
                    element.popValues = {};
                    //strQSValue = GS.qryGetVal(GS.getQueryString(), element.getAttribute('qs'));
                    //
                    //if (strQSValue !== '' || !element.getAttribute('value')) {
                    //    element.setAttribute('value', strQSValue);
                    //}

                    pushReplacePopHandler(element);
                    window.addEventListener('pushstate',    function () { pushReplacePopHandler(element); });
                    window.addEventListener('replacestate', function () { pushReplacePopHandler(element); });
                    window.addEventListener('popstate',     function () { pushReplacePopHandler(element); });
                    //element.popValues = GS.qryToJSON(GS.getQueryString());
                }

                // allows the element to have focus
                if (!element.hasAttribute('tabindex')) {
                    element.setAttribute('tabindex', '0');
                }

                element.skipFocus = false;

                // select for template
                tableTemplateElement = xtag.queryChildren(element, 'template')[0];
                if (tableTemplateElement && (tableTemplateElement.innerHTML.indexOf('&gt;') > -1 || tableTemplateElement.innerHTML.indexOf('&lt;') > -1)) {
                    console.warn('GS-LISTBOX WARNING: &gt; or &lt; detected in table template, this can have undesired effects on doT.js. Please use gt(x,y), gte(x,y), lt(x,y), or lte(x,y) to silence this warning.');
                }
                
                
                if (element.getAttribute('src') || element.getAttribute('source')) {
                    if (element.innerHTML.trim() !== '') {
                        var trSet = xtag.query(tableTemplateElement.content, 'tbody > tr');//:not(.divider)');
                        //console.log(trSet);
                        for (var i = 0, len = trSet.length; i < len; i++) {
                            trSet[i].setAttribute('data-record_no', '{{! row.row_number }}');
                            // console.log(trSet[i]);
                        }
                    }
                }
                
                if (tableTemplateElement) {
                    // add a doT.js coded "value" attribute to any element with a "column" attribute but no "value" attribute
                    element.tableTemplate = GS.templateColumnToValue(tableTemplateElement.innerHTML);
                }

                if (element.getAttribute('src') || element.getAttribute('source')) {
                    // if (element.innerHTML.trim() !== '') {
                    //     var trSet = xtag.query(tableTemplateElement.content, 'tbody > tr');//:not(.divider)');
                    //     //console.log(trSet);
                    //     for (var i = 0, len = trSet.length; i < len; i++) {
                    //         trSet[i].setAttribute('data-record_no', '{{! row.row_number }}');
                    //         // console.log(trSet[i]);
                    //     }
                    // }
                    getData(element, '', true);
                } else {
                    if (tableTemplateElement) {
                        //developer provided template
                        element.tableElement = xtag.query(tableTemplateElement.content, 'table')[0];
                    } else if (xtag.queryChildren(element, 'table')[0]) {
                        element.tableElement = xtag.queryChildren(element, 'table')[0];
                    } else {
                        element.tableElement = document.createElement('table');
                    }
                    //loop through and add the data-record_no attribute
                    //console.log(element.innerHTML);
                    var trSet = xtag.query(tableTemplateElement.content, 'tr');//:not(.divider)');
                    //console.log(trSet);
                    for (var i = 0, len = trSet.length; i < len; i++) {
                        //console.log(trSet[i]);
                        trSet[i].setAttribute('data-record_no', i);
                    }
                    element.syncView();
                }
            }
        }
    }
    
    xtag.register('gs-listbox', {
        lifecycle: {
            created: function () {
                elementCreated(this);
            },
            
            inserted: function () {
                elementInserted(this);
            },
            
            attributeChanged: function (strAttrName, oldValue, newValue) {
                // if "suspend-created" has been removed: run created and inserted code
                if (strAttrName === 'suspend-created' && newValue === null) {
                    elementCreated(this);
                    elementInserted(this);
                    
                // if "suspend-inserted" has been removed: run inserted code
                } else if (strAttrName === 'suspend-inserted' && newValue === null) {
                    elementInserted(this);
                    
                } else if (!this.hasAttribute('suspend-created') && !this.hasAttribute('suspend-inserted')) {
                    if (strAttrName === 'value' && newValue !== oldValue) {
                        this.value = newValue;
                    }
                }
            }
        },
        events: {},
        accessors: {
            value: {
                get: function () {
                    var element = this;
                    if (element.tableElement) {
                        var arrRecords = xtag.queryChildren(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr[selected]');//:not(.divider)
                        //console.log(arrRecords);
                        if (this.hasAttribute('multi-select')) {
                            var arrResult = [], i;
                            for (i = 0; i < arrRecords.length; i++) {
                                if (this.internalData.records.dat[arrRecords[i].getAttribute('data-record_no') - 1]) {
                                    arrResult.push(this.internalData.records.dat[arrRecords[i].getAttribute('data-record_no') - 1][0]);
                                }
                            }
                            return arrResult;
                        } else {
                            // console.trace('sonofagun');
                            if (arrRecords.length > 0) {
                                // console.log(arrRecords);
                                // console.log('test1', arrRecords[0].rowIndex);
                                // console.log('test2', this.internalData.records.dat[arrRecords[0].rowIndex]);
                                if (this.internalData.records.dat[arrRecords[0].getAttribute('data-record_no') - 1]) {
                                    return this.internalData.records.dat[arrRecords[0].getAttribute('data-record_no') - 1][0];
                                }
                            }
                        }
                    }
                },
                
                set: function (strNewValue) {
                    selectRecord(this, strNewValue);
                    this.scrollToSelectedRecord();
                }
            },
            
            selectedRecord: {
                get: function () {
                    var element = this;
                    if (element.tableElement) {
                        var arrRecords = xtag.queryChildren(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr[selected]');
                        //console.log('arrRecords', arrRecords);
                        if (this.hasAttribute('multi-select')) {
                            return arrRecords;
                        } else {
                            return arrRecords[0];
                        }
                    }
                },
                
                set: function (newValue) {
                    selectRecord(this, newValue);
                    this.scrollToSelectedRecord();
                }
            },
            
            textValue: {
                get: function () {
                    var element = this;
                    if (element.tableElement) {
                        var arrRecords = xtag.queryChildren(xtag.queryChildren(element.tableElement, 'tbody')[0], 'tr[selected]');
                        
                        if (this.hasAttribute('multi-select')) {
                            var strResult, i;
                            for (i = 0; i < arrRecords.length; i++) {
                                // console.log(arrRecords, i, xtag.queryChildren(arrRecords[i], 'td'));
                                if (xtag.queryChildren(arrRecords[i], 'td').length > 0) {
                                    strResult += xtag.queryChildren(arrRecords[i], 'td')[0].textContent;
                                }
                            }
                            return strResult;
                        } else {
                            return arrRecords[0].textContent;
                        }
                    }
                },
                
                set: function () {
                    selectRecord(this, strNewValue);
                    this.scrollToSelectedRecord();
                }
            }
        },
        methods: {
            // just a semantic alias to the getData function
            refresh: function (callback) {
                getData(this, callback);
            },
            
            column: function (strColumn) {
                //console.log('no', Number(this.innerSelectedRecord.rowIndex) - 1);
                //console.log('data', this.internalData.records);
                //console.log('return', this.internalData.records.dat[Number(this.innerSelectedRecord.rowIndex) - 1]);
                var element = this;
                if (this.hasAttribute('multi-select')) {
                    var arrStrResult = [], i;
                    for (i = 0; i < this.selectedRecord.length; i++) {
                        arrStrResult.push(this.internalData.records.dat[this.selectedRecord[i].rowIndex - 1][this.internalData.records.arr_column.indexOf(strColumn)]);
                    }
                    //console.log('this.selectedRecord', this.selectedRecord);
                    //console.log('arrStrResult', arrStrResult);
                    return arrStrResult;
                } else {
                    return this.internalData.records.dat[this.selectedRecord.rowIndex - 1][this.internalData.records.arr_column.indexOf(strColumn)];
                }
            },
            
            // #################################################################
            // ########### SELECTION / HIGHLIGHTING / RECORD / VALUE ###########
            // #################################################################
            
            // scroll the dropdown to the selected record
            scrollToSelectedRecord: function () {
                var selectedTr;
                
                if (this.tableElement) {
                    selectedTr = xtag.query(this.tableElement, 'tr[selected]')[0];
                    
                    if (selectedTr) {
                        GS.scrollIntoView(selectedTr);
                    }
                }
                
                /*var scrollingContainer, arrTrs, i, len, intScrollTop, bolFoundSelected = false;
                
                if (this.tableElement) {
                    scrollingContainer = this;
                    arrTrs = xtag.query(this.tableElement, 'tr');
                    
                    for (i = 0, intScrollTop = 0, len = arrTrs.length; i < len; i += 1) {
                        if (arrTrs[i].hasAttribute('selected')) {
                            intScrollTop += arrTrs[i].offsetHeight / 2;
                            
                            bolFoundSelected = true;
                            
                            break;
                        } else {
                            intScrollTop += arrTrs[i].offsetHeight;
                        }
                    }
                    
                    if (bolFoundSelected) {
                        intScrollTop = intScrollTop - scrollingContainer.offsetHeight / 2;
                    } else {
                        intScrollTop = 0;
                    }
                    
                    scrollingContainer.scrollTop = intScrollTop;
                }*/
            },
            
            // ################################################################
            // ####################### LETTER SCROLLBAR #######################
            // ################################################################
            
            letterScrollbarHandler: function () {
                var element = this, i, len, intTextHeight, intLettersDropped, intSkipperHeight,
                    intElementHeight, intDistance, strHTML, arrSkippers;
                
                // if there is no letter scrollbar container: create it
                if (xtag.queryChildren(element, '.letter-scrollbar-container').length === 0) {
                    element.letterScrollbarContainer = document.createElement('div');
                    element.letterScrollbarContainer.classList.add('letter-scrollbar-container');
                    element.letterScrollbarContainer.setAttribute('gs-dynamic', '');
                    element.appendChild(element.letterScrollbarContainer);
                    
                // else: clear out the old letterScrollbarContainer
                } else {
                    element.letterScrollbarContainer.innerHTML = '';
                }
                
                if (element.clientHeight < element.scrollContainer.scrollHeight) {
                    intTextHeight = GS.getTextHeight(element.letterScrollbarContainer);
                    intSkipperHeight = intTextHeight * this.arrDividingPoints.length;
                    intElementHeight = element.clientHeight / this.arrDividingPoints.length;
                    
                    if (intElementHeight < intTextHeight) {
                        intElementHeight = intTextHeight;
                    }
                    
                    if (intSkipperHeight > element.clientHeight) { 
                        intLettersDropped = 0;
                        while (intSkipperHeight > element.clientHeight && intLettersDropped < 100) {
                            intSkipperHeight -= intTextHeight;
                            intLettersDropped += 1;
                        }
                        intDistance = Math.ceil(this.arrDividingPoints.length / intLettersDropped);
                    }
                    
                    for (i = 0, len = this.arrDividingPoints.length, strHTML = ''; i < len; i += 1) {
                        if (intLettersDropped === undefined || (intLettersDropped > 0 && i % intDistance !== 0)) {
                            strHTML += '<div class="skipper" gs-dynamic ' +
                                            'style="height: ' + intElementHeight + 'px; line-height: ' + intElementHeight + 'px;" ' + 
                                            'data-target-offset="' + this.arrDividingPoints[i].offset + '">' +
                                            '<span gs-dynamic>' + this.arrDividingPoints[i].letter + '</span>' +
                                        '</div>';
                        }
                    }
                    
                    element.letterScrollbarContainer.innerHTML = strHTML;
                    
                    if (element.paddingElement && element.paddingElement.parentNode === element.scrollContainer) {
                        element.scrollContainer.removeChild(element.paddingElement);
                    }
                    
                    element.paddingElement = document.createElement('div');
                    element.paddingElement.setAttribute('gs-dynamic', '');
                    if (this.arrDividingPoints.length > 0) {
                    element.paddingElement.style.height = (element.clientHeight -
                                                        (element.scrollContainer.scrollHeight - parseInt(this.arrDividingPoints[this.arrDividingPoints.length - 1].offset, 10))) + 'px';
                    }
                    element.scrollContainer.appendChild(element.paddingElement);
                    
                    // bind skipper click, mousedown-then-drag
                    arrSkippers = element.letterScrollbarContainer.children;
                    
                    if (element.mousedownHandler) {
                        window.removeEventListener(evt.mousedown, element.mousedownHandler);
                        window.removeEventListener(evt.mousemove, element.mousemoveHandler);
                        window.removeEventListener(evt.mouseup, element.mouseupHandler);
                    }
                    
                    //element.clickHandler = function () {
                    //    //console.log('-webkit-overflow-scrolling: touch;',   element.scrollContainer.scrollTop);
                    //    element.style.webkitOverflowScrolling = 'initial';
                    //    //console.log('-webkit-overflow-scrolling: initial;', element.scrollContainer.scrollTop);
                    //    element.scrollContainer.scrollTop = parseInt(this.getAttribute('data-target-offset'), 10);
                    //    //console.log('-webkit-overflow-scrolling: initial;', element.scrollContainer.scrollTop);
                    //    element.style.webkitOverflowScrolling = 'touch';
                    
                    element.clickHandler = function () {
                        //console.log('-webkit-overflow-scrolling: touch;',   element.scrollContainer.scrollTop);
                        element.style.webkitOverflowScrolling = 'initial';
                        //console.log('-webkit-overflow-scrolling: initial;', element.scrollContainer.scrollTop);
                        element.scrollContainer.scrollTop = parseInt(this.getAttribute('data-target-offset'), 10);
                        //console.log('-webkit-overflow-scrolling: initial;', element.scrollContainer.scrollTop);
                        element.style.webkitOverflowScrolling = 'touch';
                        
                        //alert('Here I am');
                        
                        //element.scrollContainer.className = element.scrollContainer.className;
                        //element.scrollContainer.style.outline = '1px solid #000000';
                        //element.scrollContainer.style.outline = '';
                        //console.log('-webkit-overflow-scrolling: touch;',   element.scrollContainer.scrollTop);
                        //console.log('test');
                    };
                    element.mousedownHandler = function (event) { // event
                        window.addEventListener(evt.mousemove, element.mousemoveHandler);
                        if (event.target.classList.contains('skipper') && evt.touchDevice) {
                            element.style.webkitOverflowScrolling = 'initial';
                        }
                        //element.mousemoveHandler(event);
                    };
                    element.mousemoveHandler = function (event) {
                        var jsnMousePosition, targetElement;
                        
                        if (event.which !== 0 || evt.touchDevice) {
                            jsnMousePosition = GS.mousePosition(event);
                            targetElement = document.elementFromPoint(jsnMousePosition.left, jsnMousePosition.top);
                            
                            if (targetElement) {
                                if (targetElement.nodeName === 'SPAN') {
                                    targetElement = targetElement.parentNode;
                                }
                                
                                //console.log(targetElement, jsnMousePosition);
                                
                                if (targetElement.classList.contains('skipper')) {
                                    element.style.webkitOverflowScrolling = 'initial';
                                    event.preventDefault();
                                    element.scrollContainer.scrollTop = parseInt(targetElement.getAttribute('data-target-offset'), 10);
                                }
                            }
                        } else {
                            window.removeEventListener(evt.mousemove, element.mousemoveHandler);
                        }
                    };
                    element.mouseupHandler = function () {
                        element.style.webkitOverflowScrolling = 'touch';
                        window.removeEventListener(evt.mousemove, element.mousemoveHandler);
                    };
                    
                    //window
                    element.addEventListener(evt.mousedown, element.mousedownHandler);
                    //window
                    element.addEventListener(evt.mouseup, element.mouseupHandler);
                    
                    for (i = 0, len = arrSkippers.length; i < len; i += 1) {
                        arrSkippers[i].addEventListener('click', element.clickHandler);
                    }
                    //}
                }
            },
            
            
            // #################################################################
            // ########################### UTILITIES ###########################
            // #################################################################
            
            refreshDividingPoints: function () {
                var tbodyElement, arrElement, arrLetter, dividerElement, strLetter, intOffset, numColumns, theadElement, i, len;
                
                tbodyElement = xtag.queryChildren(this.tableElement, 'tbody')[0];
                
                arrElement = xtag.queryChildren(tbodyElement, 'tr.divider');
                
                for (i = 0, len = arrElement.length; i < len; i += 1) {
                    tbodyElement.removeChild(arrElement[i]);
                }
                
                this.arrDividingPoints = [];
                
                arrElement = xtag.queryChildren(tbodyElement, 'tr');
                
                if (arrElement.length > 0) {
                    numColumns = arrElement[0].children.length;
                    
                    
                    //console.log(theadElement, (theadElement ? theadElement.offsetHeight : 0));
                    theadElement = xtag.queryChildren(this.tableElement, 'thead')[0];
                    intOffset = (theadElement ? theadElement.offsetHeight : 0);
                    
                    for (i = 0, len = arrElement.length, arrLetter = []; i < len; i += 1) {
                        strLetter = xtag.queryChildren(arrElement[i], 'td')[0].textContent.substring(0, 1).toUpperCase();
                        
                        if (arrLetter.indexOf(strLetter) === -1) {
                            this.arrDividingPoints.push({
                                'letter': strLetter,
                                'offset': intOffset
                            });
                            
                            if (this.hasAttribute('letter-dividers')) {
                                dividerElement = document.createElement('tr');
                                dividerElement.classList.add('divider');
                                dividerElement.setAttribute('gs-dynamic', '');
                                dividerElement.setAttribute('data-target-offset', intOffset);
                                //if (!this.hasAttribute('letter-dividers')) { <== messed with odd and even record colors when letter-scrollbar but not letter-dividers -michael
                                //    dividerElement.setAttribute('hidden', '');
                                //}
                                
                                dividerElement.innerHTML = '<td colspan="' + numColumns + '" gs-dynamic>' + encodeHTML(strLetter) + '</td>';
                                
                                tbodyElement.insertBefore(dividerElement, arrElement[i]);
                                
                                intOffset += dividerElement.offsetHeight;
                            }
                            
                            arrLetter.push(strLetter);
                        }
                        
                        intOffset += arrElement[i].offsetHeight;
                    }
                }
            },
            
            syncView: function () {
                var element = this, tbodyElement, i, len, arrElements, clickHandler, mousedownHandler, mousemoveHandler, mouseupHandler, mouseoutHandler, mouseoverHandler;
                
                element.removeEventListener('keydown', handleKeyDown);
                element.addEventListener('keydown', handleKeyDown);
                
                element.removeEventListener('focusout', handleFocusout);
                element.addEventListener('focusout', handleFocusout);
                
                element.innerHTML = '';
                
                element.scrollContainer = document.createElement('div');
                element.scrollContainer.setAttribute('gs-dynamic', '');
                element.scrollContainer.classList.add('root');
                element.scrollContainer.classList.add('scroll-container');
                element.scrollContainer.appendChild(element.tableElement);
                
                element.appendChild(element.scrollContainer);
                tbodyElement = xtag.queryChildren(element.tableElement, 'tbody')[0];
                
                // add dividers
                if (element.hasAttribute('letter-dividers') || element.hasAttribute('letter-scrollbar')) {
                    element.refreshDividingPoints();
                    
                    // if we have the letter-scrollbar attribute: add the letter scrollbar
                    if (element.hasAttribute('letter-scrollbar')) {
                        element.letterScrollbarHandler();
                    }
                }
                
                // this fixes the fact that this function was clearing the selection
                if (this.getAttribute('value')) {
                    selectRecord(this, this.getAttribute('value'));
                    this.scrollToSelectedRecord();
                }
                
                // click handling code
                // get list of record elements
                arrElements = xtag.toArray(tbodyElement.children);
                
                if (element.hasAttribute('multi-select')) {
                    // if we are not on a touch device: hover and down events
                    if (!evt.touchDevice) {
                        var mouseIsDown = false;
                        mousedownHandler = function (event) {
                            mouseIsDown = true;
                            this.classList.add('down');
                            element.addEventListener(evt.mousemove, mousemoveHandler);
                            window.addEventListener(evt.mouseup, mouseupHandler);
                            selectRecord(element, this, true, (event.ctrlKey || event.metaKey), 'down', event.shiftKey);
                        };
                        mousemoveHandler = function (event) {
                            if (mouseIsDown) {
                                selectRecord(element, getTRFromTarget(event.target), true, (event.ctrlKey || event.metaKey), 'move', event.shiftKey);
                            }
                        };
                        mouseupHandler = function (event) {
                            mouseIsDown = false;
                            selectRecord(element, this, true, (event.ctrlKey || event.metaKey), 'up', event.shiftKey);
                            element.removeEventListener(evt.mousemove, mousemoveHandler);
                            window.removeEventListener(evt.mouseup, mouseupHandler);
                        };
                        mouseoutHandler = function () {
                            this.classList.remove('down');
                            this.classList.remove('hover');
                        };
                        mouseoverHandler = function () {
                            this.classList.remove('down');
                            this.classList.add('hover');
                        };
                    
                        // add click event with click event function to all record elements that are not dividers
                        for (i = 0, len = arrElements.length; i < len; i += 1) {
                            if (!arrElements[i].classList.contains('divider')) {
                                arrElements[i].addEventListener(evt.mousedown, mousedownHandler);
                                arrElements[i].addEventListener(evt.mouseout, mouseoutHandler);
                                arrElements[i].addEventListener(evt.mouseover, mouseoverHandler);
                            }
                        }
                    } else {
                        //TODO: toggle
                        // create click event function
                        clickHandler = function (event) {
                            this.classList.remove('down');
                            selectRecord(element, this, true);
                        };
                    }
                } else {
                    // create click event function
                    clickHandler = function (event) {
                        this.classList.remove('down');
                        selectRecord(element, this, true);
                    };
                    
                    // add click event with click event function to all record elements that are not dividers
                    for (i = 0, len = arrElements.length; i < len; i += 1) {
                        if (!arrElements[i].classList.contains('divider')) {
                            arrElements[i].addEventListener('click', clickHandler);
                        }
                    }
                    
                    // if we are not on a touch device: hover and down events
                    if (!evt.touchDevice) {
                        mousedownHandler = function () {
                            this.classList.add('down');
                        };
                        mouseoutHandler = function () {
                            this.classList.remove('down');
                            this.classList.remove('hover');
                        };
                        mouseoverHandler = function () {
                            this.classList.remove('down');
                            this.classList.add('hover');
                        };
                    
                        // add click event with click event function to all record elements that are not dividers
                        for (i = 0, len = arrElements.length; i < len; i += 1) {
                            if (!arrElements[i].classList.contains('divider')) {
                                arrElements[i].addEventListener(evt.mousedown, mousedownHandler);
                                arrElements[i].addEventListener(evt.mouseout, mouseoutHandler);
                                arrElements[i].addEventListener(evt.mouseover, mouseoverHandler);
                            }
                        }
                    }
                }
                
                //tbodyElement.addEventListener('click', function (event) {
                //    var parentRecord = GS.findParentTag(event.target, 'TR');
                //    
                //    if (parentRecord && !parentRecord.classList.contains('divider')) {
                //        selectRecord(element, parentRecord, true);
                //    }
                //});
                var focusElement = document.createElement('textarea');
                focusElement.classList.add('hidden-focus-control');
                focusElement.setAttribute('value', 'text makes this textarea Firefox worthy');

                element.appendChild(focusElement);
                element.hiddenFocusControl = focusElement;

                element.addEventListener('focus', function (event) {
                    event.preventDefault();
                    event.stopPropagation
                    if (event.target !== element.hiddenFocusControl) {
                        element.hiddenFocusControl.focus();
                        GS.triggerEvent(element.hiddenFocusControl, 'focus');
                        // console.log(document.activeElement);
                        element.skipFocus = true;
                        // console.log(element.skipFocus);
                    }
                });
                bindCopy(element);
                //console.log(element.tableTemplate);
                
                
            },
            
            triggerChange: function () {
                if (this.supressChange === true) {
                    this.supressChange = false;
                } else {
                    xtag.fireEvent(this, 'change', {
                        bubbles: true,
                        cancelable: true
                    });
                }
            }
        }
    });
});