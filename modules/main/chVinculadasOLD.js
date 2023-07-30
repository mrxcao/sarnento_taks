const ObjectId = require("mongodb").ObjectId;
const moment = require("moment-timezone");
const _ = require("lodash");
const newDate = require("../newDate");
const mongo = require("../mongo");

const chVinculadas = async (paramUnidade, subordinadas = 0) => {
	try {

		const data1 = newDate(new Date());
		const chave = moment(data1).utcOffset(0).valueOf();
		const acumulado = subordinadas == 1 ? 1 : 0;
		/*
                let dadosNoPrazo = await mongo.findOne('atende', 'cacheDados', {
                    'processo.cgc': paramUnidade,
                    'processo.nome': 'painelVinculadas',
                    'acumulado': acumulado,
                    dataExpiracao: { $gte: data1 }
                })
        
                if (dadosNoPrazo) {
                    dadosNoPrazo.dados[0].params.dataConsulta = dadosNoPrazo.dataCriacao
                    return new Promise((resolve, reject) => {
                        resolve(dadosNoPrazo.dados[0])
                    })
                }
        */
		// const dadosUnidade = await mongo.findOne('atende', 'unidades', { CGC: paramUnidade })
		let vinculadas = [paramUnidade];
		/*
        if (acumulado == 1) {
            const filtros = await mongo.findOne('atende', 'unidadesVinculadas', { CGC: paramUnidade })
            //console.log('filtros ', filtros)
            //const novas = filtros.filhos.filter(a => a.depth == 0 && a.CGC != 8575)
            const novas = filtros.filhos.filter(a => a.CGC != 8575)
                .map(e => e.CGC) || []

            vinculadas.push(...novas)
        }
        */
		//console.log('vinculadas ', vinculadas)
		//vinculadas = vinculadas.filter(e => e != paramUnidade)

		//console.log('vinculadas', vinculadas, ' unidade: ', unidadeConsulta)
		// vinculadas.push(paramUnidade)  //==================  RETIRAR ISSO ==========
		//if (vinculadas.indexOf(8575) != -1) { vinculadas.splice(vinculadas.indexOf(8575), 1); }

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
										idTipoInteracao: 5, "origem.usuario.unidade": { $in: vinculadas },
										data: { $gte: inicio, $lte: fim }
									}
								}
							}
						},
						{ $unwind: "$interacoes" },
						{
							$match: {
								"interacoes.idTipoInteracao": 5, "interacoes.origem.usuario.unidade": { $in: vinculadas },
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
								"interacoes.usuario.unidade": { $in: vinculadas }
							}
						},

						{ $group: { _id: "$interacoes.usuario.unidade", qtdReclassificacoes: { $sum: 1 } } }

					], as: "reclassficacoes"
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
									{ expiraEm: { $lte: fim } }, { "situacao._id": { $ne: 12 } }, { "atendente.unidade.unidade": { $in: vinculadas } },
									{ "exportacaoGEOTR": { $exists: false }, data: { $gte: new Date("2019-04-01") } }]
							}
						},
						{ $unwind: "$atendente.unidade.unidade" },
						{
							$group: {
								_id:
                                    "$atendente.unidade.unidade", qtdUltimoDia: { $sum: 1 }

							}
						}
					], as: "ultimoDia"
				}
			},

			//=== abertos ===
			{
				$lookup: {
					from: "demandas",
					pipeline: [
						{
							$match: {
								data: { $gte: inicio, $lte: fim }, interacoes: {
									$elemMatch: {
										idTipoInteracao: 1, "unidadeDestino.unidade": { $in: vinculadas },
									}
								}
							}
						},

						{ $unwind: "$interacoes" },
						{ $unwind: "$interacoes.unidadeDestino" },
						{ $match: { "interacoes.data": { $gte: inicio, $lte: fim }, "interacoes.idTipoInteracao": 1, "interacoes.unidadeDestino.unidade": { $in: vinculadas } } },
						{ $group: { _id: "$interacoes.unidadeDestino.unidade", qtdAbertas: { $sum: 1 } } }
					], as: "abertas"
				}
			},

			//=== concluidos autom ===
			{
				$lookup: {
					from: "demandas",
					pipeline: [
						{
							$match: {
								"atendente.unidade.unidade": { $in: vinculadas }, data: { $gte: inicio, $lte: fim }
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
					from: "demandas",
					pipeline: [
						{
							$match: {
								interacoes: {
									$elemMatch: {
										idTipoInteracao: 10, "usuario.unidade": { $in: vinculadas }, data: { $gte: inicio, $lte: fim }
									}
								}
							}
						},
						{ $unwind: "$interacoes" },
						{ $match: { "interacoes.data": { $gte: inicio, $lte: fim }, "interacoes.idTipoInteracao": 10, "interacoes.usuario.unidade": { $in: vinculadas } } },

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
								expiraEm: { $lt: inicio }, "situacao._id": { $ne: 12 },
								"atendente.unidade.unidade": { $in: vinculadas }
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
					from: "demandas",
					pipeline: [
						{
							$match:
                            {
                            	"exportacaoGEOTR": { $exists: false },
                            	"interacoes.stats.unidade.unidade": { $in: vinculadas },
                            	"interacoes.stats.ano": ano,
                            	"interacoes.stats.mes": mes

                            }
						},
						{ $unwind: "$interacoes" },
						{ $unwind: "$interacoes.stats" },
						{
							$match: {
								"exportacaoGEOTR": { $exists: false }, "interacoes.stats.unidade.unidade": { $in: vinculadas },
								"interacoes.stats.ano": ano, "interacoes.stats.mes": mes
							}
						},
						{ $group: { _id: { id: "$id", unidade: "$interacoes.stats.unidade.unidade" }, tDias: { $sum: "$interacoes.stats.tempoDias" } } },
						{ $group: { _id: "$_id.unidade", tempoMedio: { $avg: "$tDias" } } }

					], as: "prazoMedio"
				}
			},


			//=== avaliacao ===
			{
				$lookup: {
					from: "demandas",
					pipeline: [
						{
							$match: {
								interacoes:
                                {
                                	$elemMatch: {
                                		idTipoInteracao: 10, "usuario.unidade": { $in: vinculadas },
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
								"interacoes.usuario.unidade": { $in: vinculadas },
								"interacoes.avaliacao.data": { $gte: inicioMes, $lte: fim }
							}
						},
						{ $project: { unidade: "$interacoes.usuario.unidade", nota: "$interacoes.avaliacao.nota" } },
						{
							$group: {
								_id: "$unidade",
								avaliacaoMedia: { $avg: "$nota" }
							}
						},


					], as: "avaliacao"
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

								"historicos.unidade.unidade.unidade": { $in: vinculadas }
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

						{ $match: { "unidade.unidade.unidade": { $in: vinculadas } } },
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
						{ $project: { unidade: "$unidade.unidade.unidade" } },
						{ $group: { _id: "$unidade", qtdPendentes: { $sum: 1 } } }

					], as: "pendentes"
				}
			},


			{
				$project: {
					tudo:
                    {
                    	$concatArrays:
                            [{ $ifNull: ["$abertas", []] }, { $ifNull: ["$concluidos", []] }, { $ifNull: ["$automaticos", []] },
                            	{ $ifNull: ["$reclassficacoes", []] }, { $ifNull: ["$reaberturas", []] },
                            	{ $ifNull: ["$expirados", []] }, { $ifNull: ["$prazoMedio", []] }, { $ifNull: ["$avaliacao", []] },
                            	{ $ifNull: ["$pendentes", []] }]
                    }
				}
			},

			{ $unwind: "$tudo" },

			{
				$project: {
					_id: 0, unidade: "$tudo._id", ultimoDia: "$tudo.qtdUltimoDia", reclassificacoes: "$tudo.qtdReclassificacoes",
					reaberturas: "$tudo.qtdReaberturas",
					abertas: "$tudo.qtdAbertas", concluidos: "$tudo.qtdConcluidos", automaticos: "$tudo.qtdAutomaticos",
					expirados: "$tudo.qtdExpirados", tempoMedio: "$tudo.tempoMedio", avaliacaoMedia: "$tudo.avaliacaoMedia", pendentes: "$tudo.qtdPendentes"
				}
			},

			{
				$group: {
					_id: "$unidade",
					reclassificacoes: { $sum: "$reclassificacoes" },
					reaberturas: { $sum: "$reaberturas" },
					ultimoDia: { $sum: "$ultimoDia" },
					abertas: { $sum: "$abertas" },
					concluidos: { $sum: "$concluidos" },
					automaticos: { $sum: "$automaticos" },
					vencidos: { $sum: "$expirados" },
					tempoMedio: { $sum: "$tempoMedio" },
					avaliacaoMedia: { $sum: "$avaliacaoMedia" },
					pendentes: { $sum: "$pendentes" },
				}
			},

			{
				$project: {
					_id: 0, unidade: "$_id", aVencer: "$ultimoDia", reclassificacoes: "$reclassificacoes",
					reaberturas: "$reaberturas",
					tratados: "$concluidos", abertos: "$abertas", automatico: "$automaticos",
					vencidos: "$vencidos", tempoMedio: "$tempoMedio", avMedia: "$avaliacaoMedia", pendentes: "$pendentes"
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