//require('dotenv').config();
const path = require("path");
require("dotenv").config({
	path: path.join(__dirname, ".env")
});
//const tasks = require("./tasks");
const mongo = require("./modules/mongo");
const run = async () => {
	if (!mongo.isConnected()) {
		await mongo.connect();
	}
	let scriptName = "./tasks/" + process.argv.slice(2)[0]; //+".js"
	const debugMode = process.argv.slice(3)[0] === "d" ? true : false;
	console.log(scriptName, `debugMode ${debugMode}` );
	let script = require(scriptName);
	await script.callback(debugMode);
	process.abort();
};
module.exports = run();