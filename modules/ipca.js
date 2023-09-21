const axios = require('axios');
const ipcaCtrl = require('./DB/mongo/controllers/ipca');

const capturarIPCA = async (debugMode = false) => {
  const url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.10844/dados?formato=json';
  const header = {
    method: 'get',
    url,
  };
  const response = await axios(header);
  const { data } = response;
  debugMode ? console.log('data', data) : true;
  for (const d of data) {
    const res = await ipcaCtrl.upSert(d);
    // debugMode ? console.log('res', d, res) : true;
  }
  return true;
};

module.exports = { capturarIPCA };
