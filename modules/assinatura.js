const mongo = require("./mongo");
const shared = require("./shared/utils");

const ass = async request => {
	let obj;
	try {
		if ((request.matricula && request.iss) ||
      (request.matricula && request.nome && request.unidade && request.nomeUnidade &&
        request.siglaUnidade && request.ufUnidade)) {
			if (!shared.matriculaStrValida(request.matriculaStr)) throw `matricula invalida! ${request.matriculaStr}`;
			obj = {
				matriculaStr: request.matriculaStr.toUpperCase(),//shared.matriculaStr(request.prefixo, request.matricula),
				prefixo: request.prefixo.toUpperCase(),
				matricula: request.matricula,
				nome: request.nome,
				unidade: request.unidade,
				nomeUnidade: request.nomeUnidade,
				funcao: request.funcao,
				nomeFuncao: request.nomeFuncao,
				tipoFuncao: request.tipoFuncao,
				siglaUnidade: request.siglaUnidade,
				ufUnidade: request.ufUnidade,
				cgcAgregadoraUnidade: request.cgcAgregadoraUnidade
				//data: new Date()
			};

			return obj;
		}
		if (request.MATRICULA) {
			if (request.fisica == 1) {
				if (!shared.matriculaStrValida(request.MATRICULASTR)) throw `matricula invalida! ${request.MATRICULASTR}`;
				obj = {
					matriculaStr: request.MATRICULASTR.toUpperCase(),//shared.matriculaStr(request.PREFIXO, request.MATRICULA),
					prefixo: request.PREFIXO.toUpperCase(),
					matricula: request.MATRICULA,
					nome: request.NOME,
					unidade: request.UNIDADE_FISICA,
					nomeUnidade: request.NOME_UNIDADE_FISICA,
					funcao: request.NUM_FUNCAO,
					nomeFuncao: request.NOME_FUNCAO,
					tipoFuncao: request.TIPO_FUNCAO,
					siglaUnidade: request.SIGLA_UNIDADE_FISICA,
					ufUnidade: request.UF_UNIDADE_FISICA,
					cgcAgregadoraUnidade: request.CGC_AGREGADORA_UNIDADE_FISICA
				};
			} else {
				if (!shared.matriculaStrValida(request.MATRICULASTR)) throw `matricula invalida! ${request.MATRICULASTR}`;
				obj = {
					matriculaStr: request.MATRICULASTR.toUpperCase(),//shared.matriculaStr(request.PREFIXO, request.MATRICULA),
					prefixo: request.PREFIXO.toUpperCase(),
					matricula: request.MATRICULA,
					nome: request.NOME,
					unidade: request.UNIDADE,
					nomeUnidade: request.NOME_UNIDADE,
					funcao: request.NUM_FUNCAO,
					nomeFuncao: request.NOME_FUNCAO,
					tipoFuncao: request.TIPO_FUNCAO,
					siglaUnidade: request.SIGLA_UNIDADE,
					ufUnidade: request.UF_UNIDADE,
					cgcAgregadoraUnidade: request.CGC_AGREGADORA
				};
			}
			return obj;
		}

		if (typeof request === "string") {
			//db = await mongo.connectDb();
			if (!shared.matriculaStrValida(request)) throw `matricula invalida! ${request}`;
			return await mongo
				.findOne("atende", "empregados", { MATRICULASTR: request.toUpperCase() })
				.then(empregado => {
					if (!empregado) throw `dados do empregado nao encontrados! ${request}`;
					obj = {
						matriculaStr: empregado.MATRICULASTR.toUpperCase(),//shared.matriculaStr(empregado.PREFIXO, empregado.MATRICULA),
						prefixo: empregado.PREFIXO.toUpperCase(),
						matricula: empregado.MATRICULA,
						nome: empregado.NOME,
						unidade: empregado.UNIDADE,
						nomeUnidade: empregado.NOME_UNIDADE,
						funcao: empregado.NUM_FUNCAO,
						nomeFuncao: empregado.NOME_FUNCAO,
						tipoFuncao: empregado.TIPO_FUNCAO,
						siglaUnidade: empregado.SIGLA_UNIDADE,
						ufUnidade: empregado.UF_UNIDADE,
						cgcAgregadoraUnidade: empregado.CGC_AGREGADORA
						//,
						//data: new Date()
					};
					// mongo.closeDb(db);

					return obj;

				});
		}
		if (typeof request === "number" && !isNaN(request)) {
			//db = await mongo.connectDb();
			return await mongo
				.findOne("atende", "empregados", { MATRICULA: parseInt(request) })
				.then(empregado => {
					if (!empregado) throw `dados do empregado nao encontrados! ${request}`;
					obj = {
						matriculaStr: shared.matriculaStr(empregado.PREFIXO, empregado.MATRICULA),
						prefixo: empregado.PREFIXO.toUpperCase(),
						matricula: empregado.MATRICULA,
						nome: empregado.NOME,
						unidade: empregado.UNIDADE,
						nomeUnidade: empregado.NOME_UNIDADE,
						funcao: empregado.NUM_FUNCAO,
						nomeFuncao: empregado.NOME_FUNCAO,
						tipoFuncao: empregado.TIPO_FUNCAO,
						siglaUnidade: empregado.SIGLA_UNIDADE,
						ufUnidade: empregado.UF_UNIDADE,
						cgcAgregadoraUnidade: empregado.CGC_AGREGADORA
						//,
						//data: new Date()
					};
					// mongo.closeDb(db);

					return obj;

				});
		}
	} catch (error) {
		//console.log(error)
		//throw `erro ${error}`
		throw error;
	}
	//finally{
	// mongo.closeDb(db);
	//}
};
module.exports = ass;
