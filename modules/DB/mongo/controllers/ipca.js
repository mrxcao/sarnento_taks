const model = require('../models/ipca');

class IpcaController {
  async store(req) {
    return model.create(req);
    // return res.status(200).json(ret);
  }

  async index() {
    return model.find({ });
    // return res.status(200).json(ret);
  }

  async show() {
    //
  }

  async update() {
    //
  }

  async destroy() {
    //
  }

  async upSert(req) {
    try {
      if (req || req != '<') {
        const data = new Date(`${req.data.substring(6, 10)}-${
          req.data.substring(3, 5)}-${
          req.data.substring(0, 2)}`);

        const valor = parseFloat(req.valor);

        const set = {
          data,
          valor,
        };

        const query = { data };
        const ret = model.findOneAndUpdate(query, set, { upsert: true });
        return ret;
      }
      return false;
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async get(id) {
    return model.findOne({ id });
  }
}

module.exports = new IpcaController();
