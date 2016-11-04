const path = require('path');
const pg = require('pg');
const fs = require('fs-extra');
const os = require('os');
const strAppName = require('../../package.json').name.toLowerCase();

var global = {};

// create a config to configure both pooling behavior
// and client options
// note: all config is optional and the environment variables
// will be read if the config is not present
global.config = {
	user: 'main_user', //env var: PGUSER
	database: 'postgres', //env var: PGDATABASE
	password: 'password', //env var: PGPASSWORD
	host: (process.platform == 'win32' ? '127.0.0.1' : '/tmp'), // Server hosting the postgres database
	port: fs.readFileSync(path.normalize(os.homedir() + '/.' + strAppName + '/postgres_port')), //env var: PGPORT
	ssl: false,
};

global.client = new pg.Client(global.config);

//postgres open connection
//notificationCallback(msg)
//callback(err)
function postgresConnect(notificationCallback, callback) {
	global.client.connect(function(err, client, done) {
		if (err) {
			callback(err);
		}

		//on notifications, run a callback
		global.client.on('notification', notificationCallback);
		var objQuery = global.client.query("LISTEN watchers;", function (err, result) {
			if (err) {
				callback(err);
			}

			callback(err);
		});
	});
}

//postgres run query
//callback(err, results)
function postgresQuery(strSql, arrInputs, callback) {
	var objQuery = global.client.query(strSql, arrInputs, function (err, result) {
		if (err) {
			callback(err);
		}

		callback(err, result);
	});
}
//postgres close connection
//callback(err, results)
function postgresClose(callback) {
	global.client.end(function (err, result) {
		if (err) {
			callback(err);
		}

		callback(err);
	});
}
