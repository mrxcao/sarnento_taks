const mongoose = require('mongoose');

const { Schema } = mongoose;

const _schema = new Schema({
  data: Date,
  valor: Number,
  criado: { type: Date, default: Date.now },
  atualizado: { type: Date, default: Date.now },
});

const model = mongoose.model('ipca', _schema);

module.exports = model;
