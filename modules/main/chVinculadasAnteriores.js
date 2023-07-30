const ObjectId = require("mongodb").ObjectId;
const moment = require("moment-timezone");
const _ = require("lodash");
const newDate = require("../newDate");
const mongo = require("../mongo");

const chVinculadas = async (data) => {
	try {

		const data1 = new Date(data);
		console.log("interno ", data1);
		const dataHoje = newDate(new Date());
		const chave = moment(data1).utcOffset(0).valueOf();

		let inicioMes = moment(data1).utcOffset(0).startOf("month").toDate();
		let fimMes = moment(data1).utcOffset(0).endOf("month").toDate();

		let inicio = moment(data1).utcOffset(0).startOf("day").toDate();
		let fim = moment(data1).utcOffset(0).endOf("day").toDate();

		let mes = moment(inicio).utcOffset(0).month() + 1;
		let ano = moment(inicio).utcOffset(0).year();

		let dia = moment(data1).utcOffset(0).date();
		let hora = moment(data1).utcOffset(0).hour();

		const dadosVinculadas = mongo.aggregate("atende", "root", [

			{ $limit: 1 },
			{ $project: { _id: 1 } },

			//=== reabertos ===
			{
				$lookup: {
					from: "demandas", //let: {dia:"$dia"},
					pipeline: [
						{
							$match: {
								interacoes: {
									$elemMatch: {
										idTipoInteracao: 5, //'origem.usuario.unidade': { $in: vinculadas },
										data: { $gte: inicio, $lte: fim }
									}
								}
							}
						},
						{ $unwind: "$interacoes" },
						{
							$match: {
								"interacoes.idTipoInteracao": 5,//"interacoes.origem.usuario.unidade": { $in: vinculadas },
								"interacoes.data": { $gte: inicio, $lte: fim }
							}
						},
						{ $group: { _id: "$interacoes.origem.usuario.unidade", qtdReaberturas: { $sum: 1 } } }

					], as: "reaberturas"
				}
			},

			//=== reclassificados ===
			{
				$lookup: {
					from: "demandas", //let: {dia:"$dia"},
					pipeline: [
						{
							$match: {
								interacoes: {
									$elemMatch: { "data": { $gte: inicio, $lte: fim }, "idTipoInteracao": 6 }
								}
							}
						},
						{ $unwind: "$interacoes" },
						{
							$match: {
								"interacoes.data": { $gte: inicio, $lte: fim }, "interacoes.idTipoInteracao": 6,
								//"interacoes.usuario.unidade": { $in: vinculadas }
							}
						},

						{ $group: { _id: "$interacoes.usuario.unidade", qtdReclassificacoes: { $sum: 1 } } }

					], as: "reclassficacoes"
				}
			},

			//=== abertos ===
			{
				$lookup: {
					from: "demandas", //let: {dia:"$dia"},
					pipeline: [
						{
							$match: {
								data: { $gte: inicio, $lte: fim }, interacoes: {
									$elemMatch: {
										idTipoInteracao: 1,
										//'unidadeDestino.unidade':{$in: vinculadas}, 
									}
								}
							}
						},

						{ $unwind: "$interacoes" },
						{ $unwind: "$interacoes.unidadeDestino" },
						{
							$match: {
								"interacoes.data": { $gte: inicio, $lte: fim }, "interacoes.idTipoInteracao": 1,
								//        'interacoes.unidadeDestino.unidade':{$in: vinculadas} 
							}
						},
						{ $group: { _id: "$interacoes.unidadeDestino.unidade", qtdAbertas: { $sum: 1 } } }
					], as: "abertas"
				}
			},

			//=== concluidos autom ===
			{
				$lookup: {
					from: "demandas", //let: {dia:"$dia"},
					pipeline: [
						{
							$match: { //'atendente.unidade.unidade': { $in: vinculadas } ,
								data: { $gte: inicio, $lte: fim }
							}
						},
						{ $unwind: "$interacoes" },
						{
							$match: {
								"interacoes.data": { $gte: inicio, $lte: fim }, "interacoes.usuario.unidade": 1,
								"interacoes.idTipoInteracao": 10
							}
						},
						{ $unwind: "$atendente.unidade" },

						{ $group: { _id: "$atendente.unidade.unidade", qtdAutomaticos: { $sum: 1 } } }
					], as: "automaticos"
				}
			},

			//=== concluidos ===
			{
				$lookup: {
					from: "demandas", //let: {dia:"$dia"},
					pipeline: [
						//{$match:{ interacoes: {$elemMatch: {idTipoInteracao:10,'usuario.unidade':{$in: vinculadas},data:{$gte:inicio,$lte:fim} 
						{
							$match: {
								interacoes: {
									$elemMatch: {
										idTipoInteracao: 10,
										//'usuario.unidade':{$in: vinculadas},
										data: { $gte: inicio, $lte: fim }
									}
								}
							}
						},
						{ $unwind: "$interacoes" },
						{
							$match: {
								"interacoes.data": { $gte: inicio, $lte: fim }, "interacoes.idTipoInteracao": 10,
								//'interacoes.usuario.unidade':{$in: vinculadas} 
							}
						},

						{ $group: { _id: "$interacoes.usuario.unidade", qtdConcluidos: { $sum: 1 } } },
					], as: "concluidos"
				}
			},

			//=== expirados ===
			{
				$lookup: {
					from: "demandas", let: { expiracao: "$expiraEm" },
					pipeline: [
						{
							$match: {
								expiraEm: { $lt: inicio }, "situacao._id": { $lt: 12 },
								// "atendente.unidade.unidade":{$in: vinculadas}
							},
						},
						{ $unwind: "$atendente.unidade" },
						{ $group: { _id: "$atendente.unidade.unidade", qtdExpirados: { $sum: 1 } } }

					], as: "expirados"
				}
			},

			//=== prazoMedio ===
			{
				$lookup: {
					from: "demandas",// let: {expiracao:"$expiraEm"},
					pipeline: [
						{
							$match:
                            {
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
								"interacoes.stats.ano": ano, "interacoes.stats.mes": mes
							}
						},

						//{ $project: { id: "$id", 
						//unidade:"$interacoes.stats.unidade.unidade",
						//tempoDias: "$interacoes.stats.tempoDias" } },

						{ $group: { _id: { id: "$id", unidade: "$interacoes.stats.unidade.unidade" }, tDias: { $sum: "$interacoes.stats.tempoDias" } } },
						{ $group: { _id: "$_id.unidade", tempoMedio: { $avg: "$tDias" } } }

					], as: "prazoMedio"
				}
			},


			//=== avaliacao ===
			{
				$lookup: {
					from: "demandas",// let: {expiracao:"$expiraEm"},
					pipeline: [
						{
							$match: {
								interacoes:
                                {
                                	$elemMatch: {
                                		idTipoInteracao: 10, //'usuario.unidade': {$in: vinculadas},
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
								// 'interacoes.usuario.unidade': {$in: vinculadas},
								"interacoes.avaliacao.data": { $gte: inicioMes, $lte: fim }
							}
						},
						{ $project: { unidade: "$interacoes.usuario.unidade", nota: "$interacoes.avaliacao.nota" } },
						{
							$group: {
								_id: "$unidade",
								avaliacaoMedia: { $avg: "$nota" }//,qtd:{$sum:1}
							}
						},


					], as: "avaliacao"
				}
			},

			//=== ultimoDia ===
			{
				$lookup: {
					from: "demandas", //let: {dia:"$dia"},
					pipeline: [
						{
							$match: {
								$and: [{ expiraEm: { $gte: inicio } },
									{ expiraEm: { $lte: fim } }, { "situacao._id": { $ne: 12 } }, //{ "atendente.unidade.unidade": { $in: vinculadas } },
									{ "exportacaoGEOTR": { $exists: false }, data: { $gte: new Date("2019-04-01") } }]
							}
						},
						{ $unwind: "$atendente.unidade" },
						{
							$group: {
								_id:
                                    "$atendente.unidade.unidade", qtdUltimoDia: { $sum: 1 }

							}
						}
					], as: "ultimoDia"
				}
			},

			//=== pendentes ===
			{
				$lookup: {
					from: "demandas", let: { expiracao: "$expiraEm" },
					pipeline: [
						{
							$match: {
								data: { $gte: new Date("2019-04-01") }, exportacaoGEOTR: { $exists: false }, "categoria._id": { $ne: ObjectId("5d9359fcdc35bc02f873b513") },

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

						// {$match:{'unidade.unidade.unidade':{$in: vinculadas}}},
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
						{ $match: { "sit._id": { $ne: 12 } } },

						// {$match:{"cat.categoria._id":ObjectId("5ef49d71f6ac0c4090e0b8f1")}},
						{ $project: { unidade: "$unidade.unidade.unidade" } },
						{ $group: { _id: "$unidade", qtdPendentes: { $sum: 1 } } }

					], as: "pendentes"
				}
			},


			{
				$project: {
					tudo:
                    {
                    	$concatArrays: //[{$ifNull:["$concluidos",[]]}]}}}, reclassficacoes
                            [{ $ifNull: ["$abertas", []] }, { $ifNull: ["$concluidos", []] }, { $ifNull: ["$automaticos", []] },
                            	{ $ifNull: ["$reclassficacoes", []] }, { $ifNull: ["$reaberturas", []] },
                            	{ $ifNull: ["$ultimoDia", []] },
                            	{ $ifNull: ["$expirados", []] }, { $ifNull: ["$prazoMedio", []] }, { $ifNull: ["$avaliacao", []] },
                            	{ $ifNull: ["$pendentes", []] }]
                    }
				}
			},
			//qtdAbertas,qtdEmpregados,qtdReclassificados,qtdConcluidos,
			//      qtdExpirados,tempoMedio, avaliacaoMedia,qtdPendentes
			{ $unwind: "$tudo" },

			{
				$project: {
					_id: 0, unidade: "$tudo._id", reclassificacoes: "$tudo.qtdReclassificacoes", reaberturas: "$tudo.qtdReaberturas",
					ultimoDia: "$tudo.qtdUltimoDia",
					//nomeUnidade:"$tudo._id.nomeUnidade",siglaUnidade:"$tudo._id.siglaUnidade",
					abertas: "$tudo.qtdAbertas", concluidos: "$tudo.qtdConcluidos", automaticos: "$tudo.qtdAutomaticos",
					expirados: "$tudo.qtdExpirados", tempoMedio: "$tudo.tempoMedio", avaliacaoMedia: "$tudo.avaliacaoMedia", pendentes: "$tudo.qtdPendentes"
				}
			},

			{
				$group: {
					_id: "$unidade",// nomeUnidade:"$nomeUnidade",siglaUnidade:"$siglaUnidade"}, 
					reclassificacoes: { $sum: "$reclassificacoes" },
					reaberturas: { $sum: "$reaberturas" },
					abertas: { $sum: "$abertas" },
					concluidos: { $sum: "$concluidos" },
					automaticos: { $sum: "$automaticos" },
					ultimoDia: { $sum: "$ultimoDia" },
					vencidos: { $sum: "$expirados" },
					tempoMedio: { $sum: "$tempoMedio" },
					avaliacaoMedia: { $sum: "$avaliacaoMedia" },
					pendentes: { $sum: "$pendentes" },
				}
			},
			//{$match:{abertas:{$gt:0} }}    ,
			// { $match: { '_id.idCategoria': ObjectId("5d95066754af3047647891b5") } },
			{
				$project: {
					_id: 0, unidade: "$_id",// nomeUnidade:"$_id.nomeUnidade",siglaUnidade:"$_id.siglaUnidade",
					concluidos: "$concluidos", abertas: "$abertas", automaticos: "$automaticos", reclassificacoes: "$reclassificacoes",
					reaberturas: "$reaberturas", ultimoDia: "$ultimoDia",
					vencidos: "$vencidos", tempoMedio: "$tempoMedio", avaliacaoMedia: "$avaliacaoMedia", pendentes: "$pendentes"
				}
			},
			{
				$lookup:
                {
                	from: "unidades",
                	localField: "unidade",
                	foreignField: "CGC",
                	as: "unidades"
                }
			},
			{ $unwind: "$unidades" },
			{ $addFields: { nome_unidade: "$unidades.NOME" } },
			{ $addFields: { sigla_unidade: "$unidades.SIGLA" } },
			{ $project: { unidades: 0 } }
		]);
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
		return retorno;
	}
	catch (error) {
		console.log(error);
	}
};

module.exports = chVinculadas;