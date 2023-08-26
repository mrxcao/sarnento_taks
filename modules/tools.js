const delay = async (sec) => new Promise((resolve) => {
  console.log('aqui');
  setTimeout(resolve, sec * 1000);
});

module.exports = {
  delay,
};
