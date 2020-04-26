/* 
 * (C) 2015 TekMonks. All rights reserved.
 * License: MIT - see enclosed LICENSE file.
 */

const fs = require("fs");
const utils = require(`${CONSTANTS.LIBDIR}/utils.js`);
const log_conf = require(CONSTANTS.LOGSCONF);

function initGlobalLoggerSync(logName) {
	/* create the logger */
	if (!fs.existsSync(CONSTANTS.LOGDIR)) {fs.mkdirSync(CONSTANTS.LOGDIR);}
	let filewriter = 
		require(`${CONSTANTS.LIBDIR}/FileWriter.js`).createFileWriter(logName,log_conf.closeTimeOut,"utf8");
	
	global.LOG = new Logger(logName, log_conf.max_log_mb*1024*1024, filewriter);	// 100 MB log max
	
	LOG.info("*************************************", true);
	LOG.info("*************************************", true);
	LOG.info("Logging subsystem initialized.", true);
}

exports.initGlobalLoggerSync = initGlobalLoggerSync;

Logger = function(path, maxsize, filewriter) {
	this.path = path;
	this.maxsize = maxsize;
	this.filewriter = filewriter;
};

Logger.prototype.info = function(s, sync) {this.writeFile("info", s, sync);}

Logger.prototype.debug = function(s, sync) {if (log_conf.debug) this.writeFile("debug", s, sync);}

Logger.prototype.error = function(s, sync) {this.writeFile("error", s && s.stack ? s.stack:s, sync);}

Logger.prototype.truncate = function(s) {return s.length > CONSTANTS.MAX_LOG ? s.substring(0, CONSTANTS.MAX_LOG) : s;}

Logger.prototype.console = function(s) {
	LOG._origLog(s?s.trim():s);						// send to console or debug console, trimmed
	LOG._oldStdoutWrite.call(process.stdout, s);	// send to process' STDOUT
}

Logger.prototype.overrideConsole = function() {
	this._origLog = global.console.log;
	this._oldStdoutWrite = process.stdout.write;
	this._oldStderrWrite = process.stderr.write;

	global.console.log = function() {
		LOG.info(`[console] ${arguments[0]}`); 
	};
	process.stdout.write = function() {
		LOG.info(`[stdout] ${arguments[0]}`);
	}
	process.stderr.write = function() {
		LOG.error(`[stderr] ${arguments[0]}`);
	}
	process.on('uncaughtException', function(err) {
		LOG.error(err && err.stack ? err.stack : err, true);
		LOG.error("EXIT ON CRITICAL ERROR!!!", true);
		LOG._oldStderrWrite.call(process.stderr, "EXIT ON CRITICAL ERROR!!! Check Logs.");
		process.exit(1);
	});
};

Logger.prototype.getLogContents = function(callback) {
	fs.readFile(this.path, function(err, data){
		if (err) callback("Unable to read the log",null);
		else callback(null, data);
	});
};

Logger.prototype.writeFile = function(level, s, sync) {
	let msg; 
	try{msg = '{"ts":"'+utils.getDateTime()+'","level":"'+level+'","message":'+JSON.stringify(s)+'}\n';} 
	catch(err) {msg = '{"ts":"'+utils.getDateTime()+'","level":"'+level+'","message":'+s.toString()+'}\n';}
	
	if (sync === undefined) {
		this.filewriter.writeFile(msg, err => {
			if (err) { 
				LOG._origLog("Logger error!");
				LOG._origLog(msg);
				LOG._oldStderrWrite.call(process.stderr, "Logger error!\n");
				LOG._oldStderrWrite.call(process.stderr, msg);
			}
		});
	} else {
		try {fs.appendFileSync(this.path, msg);}
		catch (err){
			LOG._origLog("Logger error!");
			LOG._origLog(msg);
			LOG._oldStderrWrite.call(process.stderr, "Logger error!\n");
			LOG._oldStderrWrite.call(process.stderr, msg);
		};
	}
};

