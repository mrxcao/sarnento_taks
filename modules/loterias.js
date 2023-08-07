const axios = require('axios');
const megasenaCtrl = require('./DB/mongo/controllers/megasena');

const primeiraCarga = async (debugMode = false) => {
  const url = 'https://loteriascaixa-api.herokuapp.com/api/mega-sena/';
  for (let n = 1; n <= 2617; n++) {
    const header = {
      method: 'get',
      url: url + n,
    };
    console.log('n', n);
    const response = await axios(header);
    const { data } = response;
    debugMode ? console.log('data', data.data) : true;
    await megasenaCtrl.upSert(data);
  }
  return true;
};

const capturarMegaSena = async (debugMode = false) => {
  const url = 'https://loteriascaixa-api.herokuapp.com/api/mega-sena/latest/';
  const header = {
    method: 'get',
    url,
  };
  const response = await axios(header);
  const { data } = response;
  debugMode ? console.log('data', data) : true;
  const res = await megasenaCtrl.upSert(data);
  return res;
};

module.exports = { capturarMegaSena, primeiraCarga };
