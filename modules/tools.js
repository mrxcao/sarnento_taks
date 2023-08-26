const delay = async function (sec) {
    return new Promise((resolve) => {
      console.log('aqui');
      setTimeout(resolve, sec * 1000);
    });
  }
  
  Node.modules {
    delay
  }