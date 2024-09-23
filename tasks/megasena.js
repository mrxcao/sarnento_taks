const loterias = require('../modules/loterias');

const name = 'megaSena';
module.exports = {
  name,
  schedule: { hour: [9, 12, 16, 20], minute: [0], dayOfWeek: [0, 1, 2, 3, 4, 5, 6, 7] },
  callback: async () => {
    const debugMode = process.env.DEBUG === 'true';
    console.log(new Date(), name, 'inicio');
    await loterias.capturarMegaSena(false, debugMode);
    console.log(new Date(), name, 'fim');
  },
};
