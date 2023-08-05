// require('dotenv').config();
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env'),
});
const mongodb = require('./modules/DB/mongo/connect');

const run = async () => {
  await mongodb.connect();
  const scriptName = `./tasks/${process.argv.slice(2)[0]}`; // +".js"
  const debugMode = process.argv.slice(3)[0] === 'd';
  console.log(scriptName, `debugMode ${debugMode}`);
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const script = require(scriptName);
  await script.callback(debugMode);
  // process.abort();
};
module.exports = run();
