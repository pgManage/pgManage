const path = require('path');
const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const child_process = require('child_process');
var proc = child_process.spawn(
	'postage/postage.exe',
	[
		'-c', __dirname + path.normalize('/postage/config/postage.conf'),
		'-d', __dirname + path.normalize('/postage/config/postage-connections.conf'),
		'-r', __dirname + path.normalize('/postage/web_root')
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

app.on('quit', function () {
	console.log('quitting');
	proc.kill();
});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({ width: 1024, height: 768 });

	// Open the DevTools.
	//mainWindow.webContents.openDevTools();

	// and load the index.html of the app.
	mainWindow.loadURL('http://127.0.0.1:8080/postage/index.html', { 'extraHeaders': 'pragma: no-cache\n' });

	mainWindow.setMenu(null);

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
