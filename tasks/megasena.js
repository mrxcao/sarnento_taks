const loterias = require('../modules/loterias');

const name = 'taskTeste';
module.exports = {
  name,
  schedule: { hour: [15, 16, 17], minute: [0], dayOfWeek: [0, 1, 2, 3, 4, 5, 6, 7] },
  callback: async () => {
    const debugMode = false;
    console.log(new Date(), name, 'inicio');
    await loterias.capturarMegaSena(debugMode);
    console.log(new Date(), name, 'fim');
  },
};