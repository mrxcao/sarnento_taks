const mongoose = require('mongoose');

const { Schema } = mongoose;
// const objectId = Schema.ObjectId;

const _schema = new Schema({
  concurso: Number,
  data: Date,
  local: String,
  dezenas: Array,
  premiacoes: [
    { acertos: Number, vencedores: Number, premio: Number },
  ],
  acumulou: Boolean,
  acumuladaProxConcurso: String,
  dataProxConcurso: Date,
  proxConcurso: Number,

  criado: { type: Date, default: Date.now },
  atualizado: { type: Date, default: Date.now },
});

const model = mongoose.model('megasena', _schema);

module.exports = model;
