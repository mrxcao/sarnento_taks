const path = require('path');
const tasks = require('./tasks');
require('dotenv').config({
  path: path.join(__dirname, '.env'),
});
const mongodb = require('./modules/DB/mongo/connect');

mongodb.connect().then(() => {
  tasks.forEach(async (task) => {
    await task.callback();
  });
  console.log('Fim do runAll');
});
