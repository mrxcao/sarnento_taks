const ObjectId = require("mongodb").ObjectId;
const moment = require("moment-timezone");
const _ = require("lodash");
const newDate = require("../newDate");
const mongo = require("../mongo");

const dadosDiariosContadores = async (data) => {
	try {
		const data1 = data;

		let inicioMes = moment(data1).utcOffset(0).startOf("month").toDate();
		let inicio = moment(data1).utcOffset(0).startOf("day").toDate();
		let dataRef = moment(data1).utcOffset(0).startOf("day").toDate();
		let fim = moment(data1).utcOffset(0).endOf("day").toDate();
		let mes = moment(inicio).utcOffset(0).month() + 1;
		let ano = moment(inicio).utcOffset(0).year();

		console.log(inicio, " - ", fim);

		let dadosVinculadas = await Promise.all([

			mongo.aggregate("atende", "demandas", [

				//=== reabertos ===
				{
					$match: {
						interacoes: {
							$elemMatch: {
								dataRef: dataRef,
								idTipoInteracao: 5,
							}
						}
					}
				},
				{ $unwind: "$interacoes" },
				{
					$match: {
						"interacoes.dataRef": dataRef,
						"interacoes.idTipoInteracao": 5,

					}
				},
				{ $group: { _id: "$interacoes.origem.usuario.unidade", qtdReaberturas: { $sum: 1 } } }

			]),
			//=== reclassificados ===
			mongo.aggregate("atende", "demandas", [
				{
					$match: {
						interacoes: {
							dataRef: dataRef,
							idTipoInteracao: 6,
						}
					}
				},
				{ $unwind: "$interacoes" },
				{
					$match: {
						"interacoes.dataRef": dataRef, "interacoes.idTipoInteracao": 6,
					}
				},

				{ $group: { _id: "$interacoes.usuario.unidade", qtdReclassificacoes: { $sum: 1 } } }

			]),

			//=== abertos ===
			mongo.aggregate("atende", "demandas", [
				{
					$match: {
						interacoes: {
							$elemMatch: {
								dataRef: dataRef,
								idTipoInteracao: 6,
							}
						}
					}
				},

				{ $unwind: "$interacoes" },
				{ $unwind: "$interacoes.unidadeDestino" },
				{
					$match: {
						"interacoes.dataRef": dataRef, "interacoes.idTipoInteracao": 1,
					}
				},
				{ $group: { _id: "$interacoes.unidadeDestino.unidade", qtdAbertas: { $sum: 1 } } }
			]),

			//=== concluidos autom ===
			mongo.aggregate("atende", "demandas", [
				{
					$match: {
						interacoes: {
							$elemMatch: {
								dataRef: dataRef,
								idTipoInteracao: 10,
							}
						}
					}
				},
				{ $unwind: "$interacoes" },
				{
					$match: {
						"interacoes.dataRef": dataRef, "interacoes.usuario.matriculaStr": "C000000",
						"interacoes.idTipoInteracao": 10
					}
				},
				{ $unwind: "$atendente.unidade" },

				{ $group: { _id: "$atendente.unidade.unidade", qtdAutomaticos: { $sum: 1 } } }
			]),

			//=== concluidos ===
			mongo.aggregate("atende", "demandas", [
				{
					$match: {
						interacoes: {
							$elemMatch: {
								data: dataRef,
								idTipoInteracao: 10
							}
						}
					}
				},
				{ $unwind: "$interacoes" },
				{
					$match: {
						"interacoes.dataRef": dataRef, "interacoes.idTipoInteracao": 10
					}
				},

				{ $group: { _id: "$interacoes.usuario.unidade", qtdConcluidos: { $sum: 1 } } },
			]),

			//=== expirados === os do dia expiraEm < hoje e pendente
			mongo.aggregate("atende", "demandas", [
				{
					$match: {
						id: { $gte: idInicial },
						exportacaoGEOTR: { $exists: false }, "categoria._id": { $ne: ObjectId("5d9359fcdc35bc02f873b513") },
					}
				},

				{
					$addFields: {
						unidade: {
							$slice: [{
								$filter: {
									input: "$historicos.unidade",
									as: "item",
									cond: { $and: [{ $lte: ["$$item.data", fim] }, { $ne: ["$$item.unidade.unidade", 1] }] }
								}
							}, -1]
						}
					}
				},
				{ $unwind: "$unidade" },
				{ $unwind: "$unidade.unidade" },

				{
					$addFields: {
						sit: {
							$slice: [{
								$filter: {
									input: "$historicos.situacao",
									as: "item",
									cond: { $and: [{ $lte: ["$$item.data", fim] }] }
								}
							}, -1]
						}
					}
				},

				{
					$addFields: {
						prazo: {
							$slice: [{
								$filter: {
									input: "$historicos.prazo",
									as: "item",
									cond: { $and: [{ $lte: ["$$item.data", fim] }] }
								}
							}, -1]
						}
					}
				},
				{ $match: { "sit._id": { $lt: 12 }, "prazo.prazo": { $lt: fim } } },
				//                        { $match: { 'sit._id': { $ne: 12 }, 'prazo.prazo':{$gte: inicio,$lte: fim},'unidade.unidade.unidade':{$in: [7743,5472]} } },

				// {$match:{"cat.categoria._id":ObjectId("5ef49d71f6ac0c4090e0b8f1")}},
				{ $project: { unidade: "$unidade.unidade.unidade" } },
				{ $group: { _id: "$unidade", qtdExpirados: { $sum: 1 } } }
			]),

			//=== prazoMedio === do dia tempoTotalDias (diaAnterior), qtdAtendesAcumulado (DiaAnterior) + os mesmos dados do dia corrente
			mongo.aggregate("atende", "demandas", [
				{
					$match:
                    {
                    	id: { $gte: idInicial },
                    	"exportacaoGEOTR": { $exists: false },
                    	//'interacoes.stats.unidade.unidade': { $in: vinculadas },
                    	"interacoes.stats.ano": ano,
                    	"interacoes.stats.mes": mes

                    }
				},
				{ $unwind: "$interacoes" },
				{ $unwind: "$interacoes.stats" },
				{
					$match: {
						"exportacaoGEOTR": { $exists: false },//'interacoes.stats.unidade.unidade':{$in: vinculadas},
						"interacoes.stats.ano": ano, "interacoes.stats.mes": mes,
						"interacoes.data": { $lte: fim },

					}
				},

				//{ $project: { id: "$id", 
				//unidade:"$interacoes.stats.unidade.unidade",
				//tempoDias: "$interacoes.stats.tempoDias" } },

				{ $group: { _id: { id: "$id", unidade: "$interacoes.stats.unidade.unidade" }, tDias: { $sum: "$interacoes.stats.tempoDias" } } },
				{ $group: { _id: "$_id.unidade", tempoMedio: { $avg: "$tDias" } } }

			]),


			//=== avaliacao === qtdAva (diaAnterior) , somaNota (DiaAnterior)
			mongo.aggregate("atende", "demandas", [
				{
					$match: {
						id: { $gte: idInicial },
						interacoes:
                        {
                        	$elemMatch: {
                        		idTipoInteracao: 10,
                        		"avaliacao.data": { $gte: inicioMes, $lte: fim }
                        	}
                        }
					}
				},
				{ $addFields: { inter: "$interacoes" } },
				{ $unwind: "$interacoes" },
				{
					$match: {
						"interacoes.idTipoInteracao": 10,
						"interacoes.avaliacao.data": { $gte: inicioMes, $lte: fim },

					}
				},
				{ $project: { unidade: "$interacoes.usuario.unidade", nota: "$interacoes.avaliacao.nota" } },
				{
					$group: {
						_id: "$unidade",
						avaliacaoMedia: { $avg: "$nota" }//,qtd:{$sum:1}
					}
				},


			]),

			//=== ultimoDia === expiraEm == dia corrente
			mongo.aggregate("atende", "demandas", [
				{
					$match: {
						id: { $gte: idInicial },
						exportacaoGEOTR: { $exists: false }, "categoria._id": { $ne: ObjectId("5d9359fcdc35bc02f873b513") },
					}
				},

				{
					$addFields: {
						unidade: {
							$slice: [{
								$filter: {
									input: "$historicos.unidade",
									as: "item",
									cond: { $and: [{ $lte: ["$$item.data", fim] }, { $ne: ["$$item.unidade.unidade", 1] }] }
								}
							}, -1]
						}
					}
				},
				{ $unwind: "$unidade" },
				{ $unwind: "$unidade.unidade" },

				{
					$match: {
						"unidade.unidade.unidade": { $nin: arrayUnidades },
						"unidade.unidade.sigla": { $nin: siglasIgnoradas }
					}
				},
				//{$sort: {id:-1}}
				//{$count:"qtd"}

				{
					$addFields: {
						sit: {
							$slice: [{
								$filter: {
									input: "$historicos.situacao",
									as: "item",
									cond: { $and: [{ $lte: ["$$item.data", fim] }] }
								}
							}, -1]
						}
					}
				},

				{
					$addFields: {
						prazo: {
							$slice: [{
								$filter: {
									input: "$historicos.prazo",
									as: "item",
									cond: { $and: [{ $lte: ["$$item.data", fim] }] }
								}
							}, -1]
						}
					}
				},
				//  { $match: { 'sit._id': { $lt: 12 }, 'prazo.prazo': { $lt: fim }, 'unidade.unidade.unidade': { $in: [7743, 5472] } } },
				{ $match: { "sit._id": { $ne: 12 }, "prazo.prazo": { $gte: inicio, $lte: fim } } },

				// {$match:{"cat.categoria._id":ObjectId("5ef49d71f6ac0c4090e0b8f1")}},
				{ $project: { unidade: "$unidade.unidade.unidade" } },
				{ $group: { _id: "$unidade", qtdUltimoDia: { $sum: 1 } } }
			]),
			//=== pendentes ===  situacao<12
			mongo.aggregate("atende", "demandas", [
				{
					$match: {
						id: { $gte: idInicial },
						exportacaoGEOTR: { $exists: false }, "categoria._id": { $ne: ObjectId("5d9359fcdc35bc02f873b513") },

						//'historicos.unidade.unidade.unidade': {$in: vinculadas}
					}
				},

				{
					$addFields: {
						unidade: {
							$slice: [{
								$filter: {
									input: "$historicos.unidade",
									as: "item",
									cond: { $and: [{ $lte: ["$$item.data", fim] }, { $ne: ["$$item.unidade.unidade", 1] }] }
								}
							}, -1]
						}
					}
				},
				{ $unwind: "$unidade" },
				{ $unwind: "$unidade.unidade" },


				//{$sort: {id:-1}}
				//{$count:"qtd"}

				{
					$addFields: {
						sit: {
							$slice: [{
								$filter: {
									input: "$historicos.situacao",
									as: "item",
									cond: { $and: [{ $lte: ["$$item.data", fim] }] }
								}
							}, -1]
						}
					}
				},
				{ $match: { "sit._id": { $lt: 12 } } },

				// {$match:{"cat.categoria._id":ObjectId("5ef49d71f6ac0c4090e0b8f1")}},
				{ $project: { unidade: "$unidade.unidade.unidade" } },
				{ $group: { _id: "$unidade", qtdPendentes: { $sum: 1 } } },

			]),
		]);
		// reclassificacaoEntrada
		// reclassificacaoSaida
		// cancelamentos
		// outraUnidadeGrupo  -> qdo a demanda foi aberta pra mais de uma unidade e agora esta sob responsabilidade de outra         

		// console.log('dadosVinculadas1 ', dadosVinculadas)
		dadosVinculadas = dadosVinculadas.reduce((p, e) => {
			return (p || []).concat(e || []);
		});
		//console.log('dadosVinculadas2 ', dadosVinculadas)

		let unidades = Array.from(dadosVinculadas.map(e => e._id));

		// console.log('unidades ', unidades)

		let dadosUnidades = await mongo.aggregate("atende", "unidades", [
			{ $match: { CGC: { $in: unidades } } },
			{ $project: { unidade: "$CGC", nome_unidade: "$NOME", sigla_unidade: "$SIGLA" } }
		]);
		// console.log('dadosUnidades ', dadosUnidades)

		let testes = (dadosVinculadas.filter(e => e._id == 7804) || []);
		//console.log('testes ', testes)

		for (let u of dadosUnidades) {
			let unid = (dadosVinculadas.filter(e => e._id == u.unidade) || []);
			// console.log('test', unid)
			// if (u.unidade == 7804) console.log(unid)

			u.concluidos = (((unid.filter(e => e.qtdConcluidos > 0) || [])[0]) || {}).qtdConcluidos || 0;
			u.abertas = (((unid.filter(e => e.qtdAbertas > 0) || [])[0]) || {}).qtdAbertas || 0;
			u.automaticos = (((unid.filter(e => e.qtdAutomaticos > 0) || [])[0]) || {}).qtdAutomaticos || 0;
			u.reclassificacoes = (((unid.filter(e => e.qtdReclassificacoes > 0) || [])[0]) || {}).qtdReclassificacoes || 0;
			u.reaberturas = (((unid.filter(e => e.qtdReaberturas > 0) || [])[0]) || {}).qtdReaberturas || 0;
			u.ultimoDia = (((unid.filter(e => e.qtdUltimoDia > 0) || [])[0]) || {}).qtdUltimoDia || 0;
			u.vencidos = (((unid.filter(e => e.qtdExpirados > 0) || [])[0]) || {}).qtdExpirados || 0;
			u.tempoMedio = (((unid.filter(e => e.tempoMedio > 0) || [])[0]) || {}).tempoMedio || 0;
			u.avaliacaoMedia = (((unid.filter(e => e.avaliacaoMedia > 0) || [])[0]) || {}).avaliacaoMedia || 0;
			u.pendentes = (((unid.filter(e => e.qtdPendentes > 0) || [])[0]) || {}).qtdPendentes || 0;
			//if (u.unidade == 7804) console.log(u)
		}

		const retorno = dadosVinculadas;
		//  console.log('retorno ', retorno)
		//retorno.data = data1
		// retorno.chave = chave
		/*
                const objCache = {
                    unidade: paramUnidade,
                    dataCriacao: data1,
                    acumulado,
                    dataExpiracao: moment(data1).utcOffset(0).add(30, 'minutes').toDate(),
                    processo: { nome: 'painelVinculadas', cgc: paramUnidade },
                    dados: [rel]
                }
         
                mongo.upsertOne('atende', 'cacheDados', { acumulado: acumulado, 'processo.cgc': unidade, 'processo.nome': 'painelVinculadas' }, objCache)
        */
		// console.log('dadosVinculadas ', dadosVinculadas)



		return dadosUnidades;//retorno
	}
	catch (error) {
		console.log(error);
	}
};

module.exports = chVinculadas;