var qs = qryToJSON(getQueryString());

document.addEventListener('change', function (event) {
    if (event.target.tagName.toLowerCase() === 'input' && event.target.getAttribute('type') === 'checkbox') {
        var checkbox = event.target;
        var key = checkbox.getAttribute('data-key');
        var value = checkbox.checked.toString();
        pushQueryString(key + '=' + value);
        qs[key] = value;

        var list = document.getElementById('test-list-' + key);
        list.classList.toggle('disabled');
        if (qs[key] === 'true') {
            $.runTests(key);
        }
    }
});

document.addEventListener('DOMContentLoaded', function () {
    $.ajax('/postage/auth', 'action=logout', 'POST', function (data) {
        $.ajax('/postage/auth', 'action=login&username=postgres&password=password&connname=test', 'POST', function (data) {
            var i, len, key;
            for (key in $.tests) {
                if ($.tests.hasOwnProperty(key)) {
                    var checkContainer = document.createElement('div');
                    checkContainer.innerHTML =
                        '<input id="toggle-' + key + '" data-key="' + key + '" type="checkbox" ' + (qs[key] === 'true' ? 'checked' : '') + ' />' +
                        '<label for="toggle-' + key + '">' + key + '</label>';
                    document.getElementById('checkboxes').appendChild(checkContainer);
                }
            }
            for (key in $.tests) {
                if ($.tests.hasOwnProperty(key)) {
                    var list = document.createElement('div');
                    list.classList.add('test-list');
                    list.setAttribute('id', 'test-list-' + key);
                    var strHTML = '';
                    for (i = 0, len = $.tests[key].tests.length; i < len; i++) {
                        var arrCurrent = $.tests[key].tests[i];
                        var strName = arrCurrent[0];
                        strHTML +=
                            '<div id="test' + key + i + '_label" class="test-block waiting">' + strName + '</div>';
                    }
                    list.innerHTML =
                        '<h3>' +
                        key + '<br />' +
                        '<small><b id="iterations-' + key + '">0</b> Iterations<br /><b id="status-note-' + key + '"></b></small>' +
                        '</h3>' +
                        strHTML +
                        '<label for="actual-status-' + key + '">Actual Status</label>' +
                        '<input id="actual-status-' + key + '" type="text" />' +
                        '<label for="actual-output-' + key + '">Actual Output</label>' +
                        '<textarea id="actual-output-' + key + '" autoresize rows="10"></textarea>';
                    document.getElementById('tests').appendChild(list);

                    if (qs[key] === 'true') {
						pushState({}, 'Postage Test Backend', '/postage/0/index.html' + window.location.search);
                        $.runTests(key);
                    } else {
                        list.classList.add('disabled');
                    }
                }
            }
        });
    });
});
