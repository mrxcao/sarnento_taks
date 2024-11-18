const model = require('../models/megasena');

class MegasenaController {
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
    const dataConcurso = new Date(`${req.data.substring(6, 10)}-${
      req.data.substring(3, 5)}-${
      req.data.substring(0, 2)}`);

    const dataProxConcurso = req.dataProxConcurso
      ? new Date(`${req.dataProxConcurso.substring(6, 10)}-${
        req.dataProxConcurso.substring(3, 5)}-${
        req.dataProxConcurso.substring(0, 2)}`) : null;

    const premiacoes = [];
    for (const prem of req.premiacoes) {
      let acertos = 0;
      switch (prem.acertos) {
        case 'Sena':
          acertos = 6;
          break;
        case 'Quina':
          acertos = 5;
          break;
        case 'Quadra':
          acertos = 4;
          break;
        default:
          break;
      }

      const premioVal = prem.premio == '-' ? 0
        : parseFloat(prem.premio.replace('.', '').replace(',', '.'));
      premiacoes.push(
        { acertos, vencedores: prem.vencedores, premio: premioVal },
      );
    }

    const dezenas = [parseInt(req.dezenas[0]), parseInt(req.dezenas[1]),
      parseInt(req.dezenas[2]), parseInt(req.dezenas[3]),
      parseInt(req.dezenas[4]), parseInt(req.dezenas[5])];

    const data = {
      concurso: req.concurso,
      data: dataConcurso,
      local: req.local,
      dezenas,
      premiacoes,
      acumulou: req.acumulou,
      acumuladaProxConcurso: req.acumuladaProxConcurso,
      dataProxConcurso,
      proxConcurso: req.proxConcurso,

    };

    const query = { concurso: req.concurso };
    const ret = model.findOneAndUpdate(query, data, { upsert: true });
    // return res.status(200).json(ret);
    return ret;
  }

  async get(id) {
    return model.findOne({ id });
  }

  async prcouraBuraco() {
    const ret = model.aggregate([{ $project: { _id: 0, concurso: 1 } },
      { $project: { _id: 0, concurso: 1 } },
      { $sort: { concurso: -1 } },
    ]);
    return ret;
  }
}

module.exports = new MegasenaController();
