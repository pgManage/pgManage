
window.addEventListener('design-register-element', function () {
    'use strict';
    
    registerDesignSnippet('GS.userChangePassword', 'GS.userChangePassword', 'GS.userChangePassword();');
    //registerDesignSnippet('GS.superChangePassword', 'GS.superChangePassword', 'GS.superChangePassword();');
    //registerDesignSnippet('GS.superUserLogin', 'GS.superUserLogin', 'GS.superUserLogin(${0:loggedInCallback});');
    registerDesignSnippet('GS.normalUserLogin', 'GS.normalUserLogin', 'GS.normalUserLogin(${0:loggedInCallback});');
});

(function () {
    function changePassword(strLink, strRank) {
        var templateElement = document.createElement('template');
        
        templateElement.innerHTML = ml(function () {/*
            <gs-page>
                <gs-header><center><h3>Change {{RANK}} Password</h3></center></gs-header>
                <gs-body padded>
                    <div id="pword-error" style="color: #FF0000;"></div>
                    <label for="old-password">Old Password:</label>
                    <gs-text id="old-password" type="password"></gs-text>
                    <label for="new-password">New Password:</label>
                    <gs-text id="new-password" type="password"></gs-text>
                    <label for="new-password-confirm">Confirm New Password:</label>
                    <gs-text id="new-password-confirm" type="password"></gs-text>
                </gs-body>
                <gs-footer>
                    <gs-grid>
                        <gs-block><gs-button dialogclose>Cancel</gs-button></gs-block>
                        <gs-block><gs-button id="button-change-password" disabled>Change {{RANK}} Password</gs-button></gs-block>
                    </gs-grid>
                </gs-footer>
            </gs-page>
        */}).replace(/\{\{RANK\}\}/gim, strRank);
        
        GS.openDialog(templateElement, function () {
            var dialog = this, keydownHandler;
            
            keydownHandler = function (event) {
                var intKeyCode = event.which || event.keyCode;
                
                if (intKeyCode === 13 &&
                    document.getElementById('old-password').value &&
                    document.getElementById('new-password').value &&
                    document.getElementById('new-password-confirm').value) {
                    GS.triggerEvent(document.getElementById('button-change-password'), 'click');
                    
                } else {
                    if (document.getElementById('old-password').value &&
                        document.getElementById('new-password').value &&
                        document.getElementById('new-password-confirm').value) {
                        document.getElementById('button-change-password').removeAttribute('disabled');
                    } else {
                        document.getElementById('button-change-password').setAttribute('disabled');
                    }
                }
            };
            
            document.getElementById('old-password').addEventListener('keydown', keydownHandler);
            document.getElementById('new-password').addEventListener('keydown', keydownHandler);
            document.getElementById('new-password-confirm').addEventListener('keydown', keydownHandler);
            
            document.getElementById('button-change-password').addEventListener('click', function () {
                var newPassword, parameters;
                
                if (document.getElementById('new-password').value === document.getElementById('new-password-confirm').value) {
                    parameters = 'action=change_pw' +
                                '&password_old=' + encodeURIComponent(document.getElementById('old-password').value) +
                                '&password_new=' + encodeURIComponent(document.getElementById('new-password').value);
                    
                    document.getElementById('old-password').value = '';
                    document.getElementById('new-password').value = '';
                    document.getElementById('new-password-confirm').value = '';
                    
                    GS.ajaxJSON(
                        location.pathname.indexOf('/env/') === 0 ? 
                        '/env/auth' : '/postage/auth', parameters, function (data, error) {
                        if (!error) {
                            GS.pushMessage('Password Successfully Changed', 1000);
                            GS.closeDialog(dialog, 'change');
                        } else {
                            document.getElementById('pword-error').textContent = data.error_text;
                        }
                    });
                } else {
                    document.getElementById('pword-error').textContent = 'New Password Doesn\'t Match Confirm New Password.';
                }
            });
        });
    }
    
    GS.userChangePassword = function () {
        changePassword('env', 'User');
    };
    
    //GS.superChangePassword = function () {
    //    changePassword('postage', 'SUPERUSER');
    //};
})();

// check if the user is logged in as a normal user
// if there is no login dialog create it then open it
GS.normalUserLogin = function (loggedInCallback, strOldError, strDefaultSubDomain) {
    'use strict';
    GS.removeAllLoaders();
    
    if (!window.userLogin) {
        window.userLogin = true;
        
        // this action checks to see if we are logged in as a super user
        // if not, open a login dialog
        GS.ajaxJSON('/env/action_info', '', function (data, error) {
            var templateElement = document.createElement('template');
            
            if (!error && data.dat) {
                if (typeof loggedInCallback === 'function') {
                    loggedInCallback(data.dat, strDefaultSubDomain);
                }
            } else {
                templateElement.innerHTML = ml(function () {/*
                    <gs-page>
                        <gs-header><center><h3>Login</h3></center></gs-header>
                        <gs-body padded>
                            You are not currently logged in, please fill in the login form below.<br /><br />
                            <label for="normal-uname">Username:</label>
                            <gs-text id="normal-uname" autocapitalize="off" autocomplete="off" autocorrect="off"></gs-text>
                            <label for="normal-pword">Password:</label>
                            <gs-text id="normal-pword" type="password"></gs-text>
                            {{ERROR}}
                        </gs-body>
                        <gs-footer>
                            <gs-grid>
                                <gs-block><gs-button dialogclose>Cancel</gs-button></gs-block>
                                <gs-block><gs-button id="normal-login">Log In</gs-button></gs-block>
                            </gs-grid>
                        </gs-footer>
                    </gs-page>
                */}).replace('{{ERROR}}', (strOldError ? '<br /><div style="color: #FF0000">' + strOldError + '</div>' : ''));
                
                if (GS.getCookie('greyspots_uname')) {
                    xtag.query(templateElement.content, '#normal-uname')[0].setAttribute('value', decodeURIComponent(GS.getCookie('greyspots_uname')));
                    xtag.query(templateElement.content, '#normal-pword')[0].setAttribute('autofocus', '');
                } else {
                    xtag.query(templateElement.content, '#normal-uname')[0].setAttribute('autofocus', '');
                }
                
                GS.openDialog(templateElement, function () {
                    var dialog = this;
                    
                    document.getElementById('normal-pword').addEventListener('keydown', function (event) {
                        var intKeyCode = event.which || event.keyCode;
                        
                        if (intKeyCode === 13) {
                            GS.triggerEvent(document.getElementById('normal-login'), 'click');
                        }
                        //if (this.value) {
                        //    document.getElementById('normal-login').removeAttribute('disabled');
                        //} else {
                        //    document.getElementById('normal-login').setAttribute('disabled', '');
                        //}
                    });
                    
                    //document.getElementById('normal-pword').addEventListener('keyup', function () {
                    //    if (this.value) {
                    //        document.getElementById('normal-login').removeAttribute('disabled');
                    //    } else {
                    //        document.getElementById('normal-login').setAttribute('disabled', '');
                    //    }
                    //});
                    
                    document.getElementById('normal-login').addEventListener('click', function () {
                        var strUserName = document.getElementById('normal-uname').value, strLink;
                        
                        if (document.getElementById('normal-pword').value) {
                            GS.addLoader('log-in', 'Logging In...');
                            
                            GS.ajaxJSON('/env/auth', 'action=login' +
                                                       '&username=' + encodeURIComponent(document.getElementById('normal-uname').value) +
                                                       '&password=' + encodeURIComponent(document.getElementById('normal-pword').value),
                                                       function (data, error) {
                                GS.removeLoader('log-in');
                                GS.closeDialog(dialog, '');
                                window.userLogin = false;
                                
                                if (!error) {
                                    GS.setCookie('greyspots_uname', strUserName, 30);
                                    
                                    if (typeof loggedInCallback === 'function') {
                                        if (window.location.hostname.substring(0, window.location.hostname.indexOf('.')) ===
                                                        strDefaultSubDomain) {
                                            GS.normalUserLogin(loggedInCallback, '', strDefaultSubDomain);
                                        } else {
                                            loggedInCallback(data.dat, strDefaultSubDomain);
                                        }
                                    }
                                    
                                } else {
                                    GS.normalUserLogin(loggedInCallback, data.error_text, strDefaultSubDomain);
                                }
                            });
                        }
                    });
                });
            }
        });
    }
};
