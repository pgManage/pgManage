const os = require('os');
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

const int_postage_port = parseInt(Math.random().toString().substring(2)) % (65535 - 1024) + 1024;

const child_process = require('child_process');
var proc = null;

try {
	fs.statSync(os.homedir() + '/.postage/');
	fs.statSync(os.homedir() + '/.postage/postage.conf');
	fs.statSync(os.homedir() + '/.postage/postage-connections.conf');
} catch (e) {
	fs.mkdirsSync(os.homedir() + '/.postage/');
	hidefile.hideSync(os.homedir() + '/.postage/');

	console.log('copying config');
	fs.writeFileSync(os.homedir() + '/.postage/postage.conf', fs.readFileSync(app.getAppPath() + '/postage/config/postage.conf', 'utf8'), 'utf8');
	fs.writeFileSync(os.homedir() + '/.postage/postage-connections.conf', fs.readFileSync(app.getAppPath() + '/postage/config/postage-connections.conf', 'utf8'), 'utf8');
}

function spawnPostage() {
	proc = child_process.spawn(
		path.normalize(app.getAppPath() + '/postage/postage' + (process.platform == 'win32' ? '.exe' : '')),
		[
			'-c', path.normalize(os.homedir() + '/.postage/postage.conf'),
			'-d', path.normalize(os.homedir() + '/.postage/postage-connections.conf'),
			'-r', app.getAppPath() + path.normalize('/postage/web_root'),
			'-x', 't',
			'-p', int_postage_port
		], {
			detached: true
		}
	);

	proc.stdout.on('data', function (data) {
		console.log('got data:\n' + data);
	});
	proc.stderr.on('data', function (data) {
		console.log('got data:\n' + data);
	});
	proc.on('close', function (code) {
		console.log(proc.pid + ' closed with code ' + code);
	});
}
spawnPostage();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindows = [];
let configWindow = null;
let connectionWindow = null;
let mainWindowState = null;
let configWindowState = null;
let connectionWindowState = null;

ipcMain.on('postage', function (event, arg) {
	if (arg === 'restart') {
		proc.kill();
		spawnPostage();
		mainWindows.forEach(function (curWindow) {
			curWindow.webContents.executeJavaScript('window.location.reload();');
		});
	}

})

app.on('quit', function () {
	console.log('quitting');
	proc.kill();
});

function setMenu() {
	const Menu = electron.Menu;
	const template = [
		{
			label: 'File',
			submenu: [
				{
					label: 'New Window',
					accelerator: 'CmdOrCtrl+N',
					click: openWindow
				},
				{
					label: 'Edit postage.conf',
					click: function () {
						configWindow = new BrowserWindow({
							'x': configWindowState.x,
							'y': configWindowState.y,
							'width': configWindowState.width,
							'height': configWindowState.height
						});
						configWindowState.manage(configWindow);
						configWindow.loadURL('file://' + app.getAppPath() + '/postage/web_root/postage/app/config.html?file=postage.conf',  { 'extraHeaders': 'pragma: no-cache\n' });
					}
				},
				{
					label: 'Edit postage-connections.conf',
					click: function () {
						connectionWindow = new BrowserWindow({
							'x': connectionWindowState.x,
							'y': connectionWindowState.y,
							'width': connectionWindowState.width,
							'height': connectionWindowState.height
						});
						connectionWindowState.manage(connectionWindow);
						connectionWindow.loadURL('file://' + app.getAppPath() + '/postage/web_root/postage/app/config.html?file=postage-connections.conf',  { 'extraHeaders': 'pragma: no-cache\n' });
					}
				},
				{
					role: 'quit'
				}
			]
		}, {
			label: 'Edit',
			submenu: [
				{
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
				}
			]
		}, {
			label: 'View',
			submenu: [
				{
					label: 'Reload',
					accelerator: 'CmdOrCtrl+R',
					click: function (item, focusedWindow) {
						if (focusedWindow) {
							focusedWindow.reload();
						}
					}
				}, {
					label: 'Toggle Developer Tools',
					accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
					click: function (item, focusedWindow) {
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
				}
			]
		}, {
			role: 'window',
			submenu: [
				{
					role: 'minimize'
				}, {
					role: 'close'
				}
			]
		}
	];

	if (process.platform === 'darwin') {
		const name = app.getName();
		template.unshift({
			label: name,
			submenu: [
				{
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
				}
			]
		});
		// Edit menu.
		template[2].submenu.push(
			{
				type: 'separator'
			}, {
				label: 'Speech',
				submenu: [
					{
						role: 'startspeaking'
					}, {
						role: 'stopspeaking'
					}
				]
			}
		);
		// Window menu.
		template[4].submenu = [
			{
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
			}
		];
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

	curWindow.loadURL('http://127.0.0.1:' + int_postage_port + '/postage/index.html',  { 'extraHeaders': 'pragma: no-cache\n' });

	// Emitted when the window is closed.
	curWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
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

	configWindowState = windowStateKeeper({
		defaultWidth: 1024,
		defaultHeight: 768,
		path: os.homedir() + '/.postage/',
		file: 'config-window-state.json'
	});

	connectionWindowState = windowStateKeeper({
		defaultWidth: 1024,
		defaultHeight: 768,
		path: os.homedir() + '/.postage/',
		file: 'connection-window-state.json'
	});

	openWindow();

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
	if (mainWindow === null) {
		createWindow();
	}
});
