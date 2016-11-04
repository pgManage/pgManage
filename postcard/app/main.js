const os = require('os');

const net = require('net');
const path = require('path');
const electron = require('electron');
const fs = require('fs-extra');
const hidefile = require('hidefile');
const windowStateKeeper = require('electron-window-state');
const ipcMain = electron.ipcMain;
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const child_process = require('child_process');
var postgresqlProc = null;

const strAppName = 'postcard';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindows = [];
let mainWindowState = null;

app.on('quit', function() {
	console.log('quitting');
	var pipe = net.connect('\\\\.\\pipe\\pgsignal_' + postgresqlProc.pid, function () {
		var uint8Data = new Uint8Array(1),
			data = new Buffer(uint8Data.buffer);
		uint8Data[0] = 15; // SIGTERM
		pipe.on('error', function () {
			console.log('error', arguments);
		});

		pipe.write(data);
		pipe.end();
	});
	process.exit();
});

function setMenu() {
	const Menu = electron.Menu;
	const template = [{
		label: 'File',
		submenu: [{
			label: 'New Window',
			accelerator: 'CmdOrCtrl+N',
			click: openWindow
		}, {
			role: 'quit'
		}]
	}, {
		label: 'Edit',
		submenu: [{
			role: 'undo'
		}, {
			role: 'redo'
		}, {
			type: 'separator'
		}, {
			role: 'cut'
		}, {
			role: 'copy'
		}, {
			role: 'paste'
		}, {
			role: 'pasteandmatchstyle'
		}, {
			role: 'delete'
		}, {
			role: 'selectall'
		}]
	}, {
		label: 'View',
		submenu: [{
			label: 'Reload',
			accelerator: 'CmdOrCtrl+R',
			click: function(item, focusedWindow) {
				if (focusedWindow) {
					focusedWindow.reload();
				}
			}
		}, {
			label: 'Toggle Developer Tools',
			accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
			click: function(item, focusedWindow) {
				if (focusedWindow) {
					focusedWindow.webContents.toggleDevTools();
				}
			}
		}, {
			type: 'separator'
		}, {
			role: 'resetzoom'
		}, {
			role: 'zoomin'
		}, {
			role: 'zoomout'
		}, {
			type: 'separator'
		}, {
			role: 'togglefullscreen'
		}]
	}, {
		role: 'window',
		submenu: [{
			role: 'minimize'
		}, {
			role: 'close'
		}]
	}];

	if (process.platform === 'darwin') {
		const name = app.getName();
		template.unshift({
			label: name,
			submenu: [{
				role: 'about'
			}, {
				type: 'separator'
			}, {
				role: 'services',
				submenu: []
			}, {
				type: 'separator'
			}, {
				role: 'hide'
			}, {
				role: 'hideothers'
			}, {
				role: 'unhide'
			}, {
				type: 'separator'
			}, {
				role: 'quit'
			}]
		});
		// Edit menu.
		template[2].submenu.push({
			type: 'separator'
		}, {
			label: 'Speech',
			submenu: [{
				role: 'startspeaking'
			}, {
				role: 'stopspeaking'
			}]
		});
		// Window menu.
		template[4].submenu = [{
			label: 'Close',
			accelerator: 'CmdOrCtrl+W',
			role: 'close'
		}, {
			label: 'Minimize',
			accelerator: 'CmdOrCtrl+M',
			role: 'minimize'
		}, {
			label: 'Zoom',
			role: 'zoom'
		}, {
			type: 'separator'
		}, {
			label: 'Bring All to Front',
			role: 'front'
		}];
	}

	const menu = Menu.buildFromTemplate(template)
	Menu.setApplicationMenu(menu)
}

function openWindow() {
	var curWindow = new BrowserWindow({
		'x': mainWindowState.x,
		'y': mainWindowState.y,
		'width': mainWindowState.width,
		'height': mainWindowState.height
	});
	mainWindows.push(curWindow);
	mainWindowState.manage(curWindow);

	curWindow.loadURL('file://' + path.normalize(app.getAppPath() + '/postcard/web_root/index.html'), {
		'extraHeaders': 'pragma: no-cache\n'
	});

	// Emitted when the window is closed.
	curWindow.on('closed', function() {
		mainWindows.splice(mainWindows.indexOf(curWindow), 1);
	});
}

function appStart() {
	mainWindowState = windowStateKeeper({
		defaultWidth: 1024,
		defaultHeight: 768,
		path: os.homedir() + '/.postage/',
		file: 'main-window-state.json'
	});


	try {
		// Check for postgres data
		fs.statSync(os.homedir() + '/.' + strAppName + '/data');

		// Start postgres
		postgresqlProc = child_process.spawn(path.normalize(app.getAppPath() + '/' + strAppName + '/postgresql/bin/postgres' + (process.platform == 'win32' ? '.exe' : '')), [
			'-D', path.normalize(os.homedir() + '/.' + strAppName + '/data'),
			'-k', '/tmp'
		], {
			cwd: path.normalize(app.getAppPath() + '/' + strAppName + '/postgresql/bin/')
		});
		postgresqlProc.stderr.on('data', function(data) {
			console.log('postgres ' + postgresqlProc.pid + ' got data:\n' + data);

			if (data.indexOf('database system is ready to accept connections') > -1) {
				openWindow();
			}
		});
		postgresqlProc.on('close', function(code) {
			console.log(postgresqlProc.pid + ' closed with code ' + code);
		});
	} catch (e) {
		// Open the progress window
		mainWindows = [
			new BrowserWindow({
				width: 800,
				height: 80,
				frame: false
			})
		];

		// Set the content
		mainWindows[0].loadURL('about:blank');
		mainWindows[0].webContents.executeJavaScript(
			'document.body.innerHTML = \'<center style="padding: 1em;">' +
			'	   <span>Performing one-time setup</span>' +
			'	   <progress style="width: 100%; display: inline-block; text-align: center;" value="0" max="1000" />' +
			'</center>\';' +
			'document.body.style.background = \'none\';' +
			'document.body.style.overflow = \'none\';',
			function() {
				// Create the data directory
				fs.mkdirsSync(os.homedir() + '/.' + strAppName + '/');
				hidefile.hideSync(os.homedir() + '/.' + strAppName + '/');
				fs.mkdirsSync(os.homedir() + '/.' + strAppName + '/data');

				const int_postgres_port = parseInt(Math.random().toString().substring(2)) % (65535 - 1024) + 1024;
				postgresqlProc = child_process.spawn(path.normalize(app.getAppPath() + '/' + strAppName + '/postgresql/bin/initdb' + (process.platform == 'win32' ? '.exe' : '')), [
					'-D', path.normalize(os.homedir() + '/.' + strAppName + '/data'),
					'-E', 'UTF8',
					'-U', 'postgres'
				], {
					cwd: path.normalize(app.getAppPath() + '/' + strAppName + '/postgresql/bin/')
				});

				// Every line of stdout advances the progress bar
				postgresqlProc.stdout.on('data', function(data) {
					mainWindows[0].webContents.executeJavaScript(
						'var progress = document.getElementsByTagName(\'progress\')[0];' +
						'progress.value = parseInt(progress.value, 10) + ' + data.toString().length / 1.5 + ';'
					);
					console.log('initdb ' + postgresqlProc.pid + ' got data:\n' + data);
				});
				postgresqlProc.stderr.on('data', function(data) {
					console.log('initdb ' + postgresqlProc.pid + ' got data:\n' + data);
				});
				postgresqlProc.on('close', function(code) {
					console.log('initdb ' + postgresqlProc.pid + ' closed with code ' + code);

					// Add some stuff to postgresql.conf
					fs.appendFileSync(path.normalize(os.homedir() + '/.' + strAppName + '/data/postgresql.conf'),
						'\n\nport = ' + int_postgres_port + '\nlog_destination = stderr\nlogging_collector = off\n\n');

					// spawn postgres
					postgresqlProc = child_process.spawn(path.normalize(app.getAppPath() + '/' + strAppName + '/postgresql/bin/postgres' + (process.platform == 'win32' ? '.exe' : '')), [
						'-D', path.normalize(os.homedir() + '/.' + strAppName + '/data'),
						'-k', '/tmp'
					], {
						cwd: path.normalize(app.getAppPath() + '/' + strAppName + '/postgresql/bin/')
					});

					postgresqlProc.stdout.on('data', function(data) {
						console.log('postgres ' + postgresqlProc.pid + ' got data:\n' + data);
					});
					postgresqlProc.stderr.on('data', function(data) {
						console.log('postgres ' + postgresqlProc.pid + ' got data:\n' + data);
						mainWindows[0].webContents.executeJavaScript(
							'var progress = document.getElementsByTagName(\'progress\')[0];' +
							'progress.value = parseInt(progress.value, 10) + ' + data.toString().length / 2 + ';'
						);

						// When we are ready
						if (data.indexOf('database system is ready to accept connections') > -1) {
							// Run init.sql againts the database
							var psqlProc = child_process.spawn(path.normalize(app.getAppPath() + '/' + strAppName + '/postgresql/bin/psql' + (process.platform == 'win32' ? '.exe' : '')), [
								'-f', path.normalize(app.getAppPath() + '/init.sql'),
								'-h', (process.platform == 'win32' ? '127.0.0.1' : '/tmp'),
								'-p', int_postgres_port,
								'-U', 'postgres'
							], {
								cwd: path.normalize(app.getAppPath() + '/' + strAppName + '/postgresql/bin/')
							});

							psqlProc.stdout.on('data', function(data) {
								console.log('psql ' + psqlProc.pid + ' got data:\n' + data);
							});
							psqlProc.stderr.on('data', function(data) {
								console.log('psql ' + psqlProc.pid + ' got data:\n' + data);
								mainWindows[0].webContents.executeJavaScript(
									'var progress = document.getElementsByTagName(\'progress\')[0];' +
									'progress.value = parseInt(progress.value, 10) + ' + data.toString().length / 2 + ';'
								);
							});
							psqlProc.on('close', function(code) {
								console.log('psql ' + psqlProc.pid + ' closed with code ' + code);

								// Set up pg_hba.conf
								if (process.platform == 'win32') {
									fs.writeFileSync(
										path.normalize(os.homedir() + '/.' + strAppName + '/data/pg_hba.conf'),
										'host		  all			 all			127.0.0.1/32			 md5'
									);
								} else {
									fs.writeFileSync(
										path.normalize(os.homedir() + '/.' + strAppName + '/data/pg_hba.conf'),
										'local		  all			 all			 md5'
									);
								}
								// Restart postgresql (by listening for close, and then killing)
								postgresqlProc.on('close', function(code) {
									postgresqlProc = child_process.spawn(path.normalize(app.getAppPath() + '/' + strAppName + '/postgresql/bin/postgres' + (process.platform == 'win32' ? '.exe' : '')), [
										'-D', path.normalize(os.homedir() + '/.' + strAppName + '/data'),
										'-k', '/tmp'
									], {
										cwd: path.normalize(app.getAppPath() + '/' + strAppName + '/postgresql/bin/')
									});

									postgresqlProc.stdout.on('data', function(data) {
										console.log('postgres ' + postgresqlProc.pid + ' got data:\n' + data);
									});
									postgresqlProc.stderr.on('data', function thisCallback(data) {
										console.log('postgres ' + postgresqlProc.pid + ' got data:\n' + data);
										mainWindows[0].webContents.executeJavaScript(
											'var progress = document.getElementsByTagName(\'progress\')[0];' +
											'progress.value = parseInt(progress.value, 10) + ' + data.toString().length / 2 + ';'
										);

										if (data.indexOf('database system is ready to accept connections') > -1) {
											postgresqlProc.stderr.removeListener('data', thisCallback);
											fs.writeFileSync(
												path.normalize(os.homedir() + '/.' + strAppName + '/postgres_port'), int_postgres_port.toString()
											);
											// Open main window
											openWindow();
											// Close progress window
											mainWindows.splice(0, 1)[0].close();
										}
									});
									postgresqlProc.on('close', function(code) {
										console.log('postgres ' + postgresqlProc.pid + ' closed with code ' + code);
									});
								});

								var pipe = net.connect('\\\\.\\pipe\\pgsignal_' + postgresqlProc.pid, function () {
									var uint8Data = new Uint8Array(1),
										data = new Buffer(uint8Data.buffer);
									uint8Data[0] = 15; // SIGTERM
									pipe.on('error', function () {
										console.log('error', arguments);
									});

									pipe.write(data);
									pipe.end();
								});
								//postgresqlProc.kill();
							});
						}
					});
					postgresqlProc.on('close', function(code) {
						console.log('postgres ' + postgresqlProc.pid + ' closed with code ' + code);
					});
				});
			}
		);
	}

	setMenu();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', appStart);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', function () {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindows.length === 0) {
		openWindow();
	}
});
