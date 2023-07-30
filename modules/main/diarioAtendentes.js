const ObjectId = require("mongodb").ObjectId;
const moment = require("moment-timezone");
const _ = require("lodash");
const newDate = require("../newDate");
const mongo = require("../mongo");

const atendentes = async (data) => {
	try {

		let inicio = moment(data).utcOffset(0).startOf("day").toDate();
		let fim = moment(data).utcOffset(0).endOf("day").toDate();

		let data1 = moment(data).utcOffset(0).startOf("day").toDate();
		let data2 = moment(data).utcOffset(0).endOf("day").toDate();

		let mes = moment(inicio).utcOffset(0).month() + 1;
		let ano = moment(inicio).utcOffset(0).year();

		console.log(inicio, " - ", fim);
		let params = await mongo.findOne("atende", "params", {});
		let idInicial = 822187;// 2020 params.idInicial.id
		console.log("idInicial ", idInicial);
		let opt = {
			allowDiskUse: true,
			isGetMore:true,      
			//cursor: { batchSize: 0, close:true }
		};
      
		//================================= empregado ===================================

		let concluidasEmpregadosP = mongo.aggregate("atende", "demandas", [
			{
				$match: {
					id: { $gte: idInicial },
					"interacoes.idTipoInteracao": 10,
					interacoes: {
						$elemMatch: { idTipoInteracao: 10, dataRef: inicio }
					}
				}
			},
			{ $unwind: "$interacoes" },
			{ $match: { "interacoes.idTipoInteracao": 10, "interacoes.dataRef": inicio } },

			{
				$group: {
					_id: {
						unidade: "$interacoes.usuario.unidade", matriculaStr: "$interacoes.usuario.matriculaStr",
						nome: "$interacoes.usuario.nome"
					}, qtd: { $sum: 1 }
				}
			},
			{
				$project: {
					_id: 0, tipo: "conclusoes", unidade: "$_id.unidade", matriculaStr: "$_id.matriculaStr",
					nome: "$_id.nome",
					qtd: "$qtd"
				}
			}

		],opt);

		let rebarturasEmpregadosP = mongo.aggregate("atende", "demandas", [
			{
				$match: {
					id: { $gte: idInicial },
					"interacoes.idTipoInteracao": 5,
					interacoes: {
						$elemMatch: { idTipoInteracao: 5, dataRef: inicio }
					}
				}
			},
			{ $unwind: "$interacoes" },
			{ $match: { "interacoes.idTipoInteracao": 5, "interacoes.dataRef": inicio } },
			{
				$group: {
					_id: {
						unidade: "$interacoes.origem.usuario.unidade", matriculaStr: "$interacoes.origem.usuario.matriculaStr",
						nome: "$interacoes.origem.usuario.nome"
					}, qtd: { $sum: 1 }
				}
			},
			{
				$project: {
					_id: 0, tipo: "reaberturas", unidade: "$_id.unidade", matriculaStr: "$_id.matriculaStr",
					nome: "$_id.nome", qtd: "$qtd"
				}
			}
		],opt);

		let reclassificadasEmpregadosP = mongo.aggregate("atende", "demandas", [
			{
				$match: {
					id: { $gte: idInicial },
					"interacoes.idTipoInteracao": 6,
					interacoes: {
						$elemMatch: { idTipoInteracao: 6, dataRef: inicio }
					}
				}
			},
			{ $unwind: "$interacoes" },
			{ $match: { "interacoes.idTipoInteracao": 6, "interacoes.dataRef": inicio } },
			{
				$group: {
					_id: {
						unidade: "$interacoes.usuario.unidade", matriculaStr: "$interacoes.usuario.matriculaStr",
						nome: "$interacoes.usuario.nome"
					}, qtd: { $sum: 1 }
				}
			},
			{
				$project: {
					_id: 0, tipo: "reclassificacoes", unidade: "$_id.unidade", matriculaStr: "$_id.matriculaStr",
					nome: "$_id.nome",
					qtd: "$qtd"
				}
			}
		],opt);

		let avaliacaoEmpregadosP = mongo.aggregate("atende", "demandas", [
			{
				$match: {
					id: { $gte: idInicial },
					"interacoes.idTipoInteracao": 10,
					interacoes: {
						$elemMatch: { idTipoInteracao: 10, "avaliacao.data": { $gte: data1, $lte: data2 } }
					}
				}
			},
			{ $unwind: "$interacoes" },
			{ $match: { "interacoes.idTipoInteracao": 10, "interacoes.avaliacao.data": { $gte: data1, $lte: data2 } } },
			{
				$group: {
					_id: {
						unidade: "$interacoes.usuario.unidade", matriculaStr: "$interacoes.usuario.matriculaStr",
						nome: "$interacoes.usuario.nome"
					}, avMedia: { $avg: "$interacoes.avaliacao.nota" }, somaNotas: { $sum: "$interacoes.avaliacao.nota" }, totalNotas: { $sum: 1 }
				}
			},
			{
				$project: {
					_id: 0, tipo: "avaliacao", unidade: "$_id.unidade", matriculaStr: "$_id.matriculaStr",
					nome: "$_id.nome",
					somaNotas: "$somaNotas", totalNotas: "$totalNotas", avMedia: "$avMedia"
				}
			}
		],opt);

		let designadasEmpregadosP = mongo.aggregate("atende", "demandas", [
			{
				$match: {
					id: { $gte: idInicial },
					"interacoes.idTipoInteracao": 4,
					interacoes: {
						$elemMatch: { idTipoInteracao: 4, dataRef: inicio }
					}
				}
			},
			{ $unwind: "$interacoes" },
			{ $match: { "interacoes.idTipoInteracao": 4, "interacoes.dataRef": inicio } },

			{
				$group: {
					_id: {
						unidade: "$interacoes.usuario.unidade", matriculaStr: "$interacoes.usuario.matriculaStr",
						nome: "$interacoes.usuario.nome"
					}, qtd: { $sum: 1 }
				}
			},
			{
				$project: {
					_id: 0, tipo: "designacoes", unidade: "$_id.unidade", matriculaStr: "$_id.matriculaStr",
					nome: "$_id.nome", qtd: "$qtd"
				}
			}

		],opt);


		let complAtendEmpregadosP = mongo.aggregate("atende", "demandas", [
			{
				$match: {
					id: { $gte: idInicial },
					"interacoes.idTipoInteracao": 11,
					interacoes: {
						$elemMatch: { idTipoInteracao: 11, dataRef: inicio }
					}
				}
			},
			{ $unwind: "$interacoes" },
			{ $match: { "interacoes.idTipoInteracao": 11, "interacoes.dataRef": inicio } },

			{
				$group: {
					_id: {
						unidade: "$interacoes.usuario.unidade", matriculaStr: "$interacoes.usuario.matriculaStr",
						nome: "$interacoes.usuario.nome"
					}, qtd: { $sum: 1 }
				}
			},
			{
				$project: {
					_id: 0, tipo: "complAtend", unidade: "$_id.unidade", matriculaStr: "$_id.matriculaStr",
					nome: "$_id.nome",
					qtd: "$qtd"
				}
			}

		],opt);

		let porEmpregado = await Promise.all([null, concluidasEmpregadosP, rebarturasEmpregadosP, reclassificadasEmpregadosP,
			avaliacaoEmpregadosP, designadasEmpregadosP, complAtendEmpregadosP]);



		// ================================ fim empregado ==============

		//
		let concluidasEmpregados = porEmpregado[1];
		let rebarturasEmpregados = porEmpregado[2];
		let reclassificadasEmpregados = porEmpregado[3];
		let avaliacaoEmpregados = porEmpregado[4];
		let designacoesEmpregados = porEmpregado[5];
		let complAtendEmpregados = porEmpregado[6];
		/*
                let matriculas = [...concluidasEmpregados.map(e => e.matriculaStr),
                ...rebarturasEmpregados.map(e => e.matriculaStr),
                ...reclassificadasEmpregados.map(e => e.matriculaStr),
                ...avaliacaoEmpregados.map(e => e.matriculaStr),
                ...designacoesEmpregados.map(e => e.matriculaStr),
                ...complAtendEmpregados.map(e => e.matriculaStr)
                ]
        */
		let dados = [...concluidasEmpregados,
			...rebarturasEmpregados,
			...reclassificadasEmpregados,
			...avaliacaoEmpregados,
			...designacoesEmpregados,
			...complAtendEmpregados
		];


		let chave = _.uniqBy(dados, e => { return e.unidade && e.matriculaStr && e.nome; });
		/*
                let empregadosP = mongo.aggregate('atende', "empregados", [
                    { $match: { MATRICULASTR: { $in: matriculas } } }
                ], { maxTimeMS: timeOut })
                let empregados = empregadosP[0]
                */

		let dadosFinal = [];

		for (const e of chave) {
			let concluidas = concluidasEmpregados.filter(x => { return x.matriculaStr == e.matriculaStr && x.nome == e.nome && x.unidade == e.unidade; })[0];
			let reaberturas = rebarturasEmpregados.filter(x => { return x.matriculaStr == e.matriculaStr && x.unidade == e.unidade; })[0];
			let reclassificadas = reclassificadasEmpregados.filter(x => { return x.matriculaStr == e.matriculaStr && x.unidade == e.unidade; })[0
			];
			let designacoes = designacoesEmpregados.filter(x => { return x.matriculaStr == e.matriculaStr && x.unidade == e.unidade; })[0];
			let complAtend = complAtendEmpregados.filter(x => { return x.matriculaStr == e.matriculaStr && x.unidade == e.unidade; })[0];
			//let somaNotas = avaliacaoEmpregados.filter(x => { return x.matriculaStr == e.matriculaStr && x.nome == e.nome && x.unidade == e.unidade })[0]
			//let totalNotas = avaliacaoEmpregados.filter(x => { return x.matriculaStr == e.matriculaStr && x.nome == e.nome && x.unidade == e.unidade })[0]
			let av = avaliacaoEmpregados.filter(x => { return x.matriculaStr == e.matriculaStr && x.nome == e.nome && x.unidade == e.unidade; })[0];

			dadosFinal.push({
				unidade: e.unidade,
				matriculaStr: e.matriculaStr, nome: e.nome,
				conclusoes: (concluidas || {}).qtd || 0,
				reaberturas: (reaberturas || {}).qtd || 0,
				reclassificacoes: (reclassificadas || {}).qtd || 0,
				designacoes: (designacoes || {}).qtd || 0,
				complAtend: (complAtend || {}).qtd || 0,
				avaliacaoMediaDia: (av || {}).avMedia || null,
				somaNotas: (av || {}).somaNotas || null,
				totalNotas: (av || {}).totalNotas || null,

			});
		}

		return dadosFinal;
	}
	catch (error) {
		console.log(error);
	}
};

module.exports = atendentes;