module.exports = {
  name: 'taskTeste',
  schedule: { hour: [15, 16, 17], minute: [0], dayOfWeek: [0, 1, 2, 3, 4, 5, 6, 7] },
  callback: async () => {
    const debugMode = false;
    console.log(debugMode, 'rodou ok');
  },
};
