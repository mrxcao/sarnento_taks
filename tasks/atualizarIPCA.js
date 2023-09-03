const mod = require('../modules/ipca');

const name = 'atualizaIPCA';
module.exports = {
  name,
  schedule: { hour: [1], minute: [0], dayOfWeek: [0, 1, 2, 3, 4, 5, 6, 7] },
  callback: async () => {
    const debugMode = process.env.DEBUG === 'true';
    console.log(new Date(), name, 'inicio');
    await mod.capturarIPCA(debugMode);
    console.log(new Date(), name, 'fim');
  },
};
