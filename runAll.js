const path = require('path');
const tasks = require('./tasks');
require('dotenv').config({
  path: path.join(__dirname, '.env'),
});
const mongodb = require('./modules/DB/mongo/connect');

await mongodb.connect();

tasks.forEach(async (task) => {
  await task.callback();
});
