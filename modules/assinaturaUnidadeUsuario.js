const mongo = require("./mongo");
const isObject = require("./isObject");

const ass = async usuario => {
	let obj;
	let db;
	try{

		obj = {unidade: usuario.unidade,
			nome: usuario.nomeUnidade,
			sigla: usuario.siglaUnidade,
			uf: usuario.ufUnidade,
			cgcAgregadora: usuario.cgcAgregadoraUnidade};
    
		return obj;

      
    
	} catch (error) {
		throw `erro ${error}`;           
	}
};
module.exports = ass;
