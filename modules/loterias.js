// const http = require('http');
// const fs = require('fs');
const axios = require('axios');
const megasenaCtrl = require('./DB/mongo/controllers/megasena');

/*   download
  const file = fs.createWriteStream('file.xlsx');
  const request = http.get('', (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Download Completed');
    });
  });
  debugMode ? console.log('request',request);
  */

// https://github.com/guto-alves/loterias-api

const capturarMegaSena = async (debugMode = false) => {
  // const url = 'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/';
  let url = 'https://loteriascaixa-api.herokuapp.com/api/mega-sena/';
  url = 'https://loteriascaixa-api.herokuapp.com/api/mega-sena/latest/';
  const header = {
    method: 'get',
    url, // + 2616,
  };

  const response = await axios(header);
  const { data } = response;
  debugMode ? console.log('data', data) : true;
  megasenaCtrl.upSert(data);
  return response;
};

module.exports = { capturarMegaSena };
