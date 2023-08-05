const mongoose = require('mongoose');

let singleton;

const connect = async function () {
  try {
    if (singleton) { return singleton; }
    const regex = new RegExp('(//([^:])*:)', 'g');
    const cntString = process.env.MONGO;
    mongoose.set('strictQuery', false);
    singleton = await mongoose.connect(cntString);
    const usr = regex.exec(cntString);

    const connectInffo = {
      host: mongoose.connection.host,
      DB: mongoose.connection.name,
      usr: usr[0].substring(2, usr[0].length - 1),
      // collenctions: mongoose.connection.collections,
    };
    console.log('MongoDB conectado ', connectInffo);
    return singleton;
  } catch (error) {
    console.log('   connect error', error);
  }

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
};

module.exports = { connect };
