const mongo = require("./mongo");
const ObjectId = require("mongodb").ObjectId;
const newDate = require("./newDate");

const mostraAcoes = true;

const start = async (env) => {
	let nome = env;// env.slice(2)[0] 
	let chave = ObjectId();
	let dataI = newDate(new Date());
	let insert = await mongo.insertOne("agendador", "log", {
		_id: chave,
		descricao: nome,
		dataInicio: dataI,
		ok: 0
	});
	mostraAcoes ? console.log(dataI,`:: start   ${chave} ${nome}  `,insert) : true;
	return chave;
};

const sucesso = async (id) => {
	let dataFim = newDate(new Date());  
	let teste = await mongo.updateOne("agendador", "log", { _id: id }, { dataFim: dataFim, ok: 1 });
	mostraAcoes ? console.log(dataFim, `:: sucesso ${id}`, teste) : true;
};

const erro = async (id, erro) => {
	let dataFim = newDate(new Date());  
	let teste = await mongo.updateOne("agendador", "log", { _id: id }, { dataFim: dataFim, ok: 0, erro });
	mostraAcoes ? console.log(dataFim,`:: erro    ${id} ${teste}`) : true;
};

module.exports.start = start;
module.exports.sucesso = sucesso;
module.exports.erro = erro;


