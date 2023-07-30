const ObjectId = require("mongodb").ObjectId;
const moment = require("moment-timezone");
const _ = require("lodash");
const newDate = require("../newDate");
const mongo = require("../mongo");

const diarioAvaliacoes = async (data1) => {
	try {

		//const data1 = newDate(new Date())
		const chave = moment(data1).utcOffset(0).valueOf();

		let inicioMes = moment(data1).utcOffset(0).startOf("month").toDate();
		let fimMes = moment(data1).utcOffset(0).endOf("month").toDate();

		let inicio = moment(data1).utcOffset(0).startOf("day").toDate();
		let fim = moment(data1).utcOffset(0).endOf("day").toDate();

		const timeOut = 180000;

		let mes = moment(inicio).utcOffset(0).month() + 1;
		let ano = moment(inicio).utcOffset(0).year();

		let dia = moment(data1).utcOffset(0).date();
		let hora = moment(data1).utcOffset(0).hour();
		console.log(hora,"-",dia);
		console.log("diarioAvaliacoes",1);
		const dados = await mongo.aggregate("atende", "demandas", [
			{ $match: { "situacao._id":{$lt:13},"interacoes.idTipoInteracao":10,"interacoes.avaliacao.dataRef": { $gte: inicioMes, $lte: fim } } },
			{ $unwind: "$interacoes" },
			{ $match: { "interacoes.avaliacao.dataRef": { $gte: inicioMes, $lte: fim },"interacoes.idTipoInteracao":10 } },

			{
				$project: {
					unidade: "$interacoes.usuario.unidade",
					nota: "$interacoes.avaliacao.nota",
					ano: { $year: "$interacoes.avaliacao.data" },
					mes: { $month: "$interacoes.avaliacao.data" },
					dia: { $dayOfMonth: "$interacoes.avaliacao.data" }
				}
			},
			{
				$addFields: {
					dia: {
						$cond: { if: { $lt: ["$dia", dia] }, then: 0, else: "$dia" }
					},
					diaOld: "$dia"
				}
			},
			{
				$group: {
					_id: { unidade: "$unidade", ano: "$ano", mes: "$mes", dia: "$dia" },
					total: { $sum: 1 },
					mediaDia: { $avg: "$nota" },
					somaDia: { $sum: "$nota" },
					0: { $sum: { $cond: { if: { $eq: ["$nota", 0] }, then: 1, else: 0 } } },
					1: { $sum: { $cond: { if: { $eq: ["$nota", 1] }, then: 1, else: 0 } } },
					2: { $sum: { $cond: { if: { $eq: ["$nota", 2] }, then: 1, else: 0 } } },
					3: { $sum: { $cond: { if: { $eq: ["$nota", 3] }, then: 1, else: 0 } } },
					4: { $sum: { $cond: { if: { $eq: ["$nota", 4] }, then: 1, else: 0 } } },
					5: { $sum: { $cond: { if: { $eq: ["$nota", 5] }, then: 1, else: 0 } } },
					6: { $sum: { $cond: { if: { $eq: ["$nota", 6] }, then: 1, else: 0 } } },
					7: { $sum: { $cond: { if: { $eq: ["$nota", 7] }, then: 1, else: 0 } } },
					8: { $sum: { $cond: { if: { $eq: ["$nota", 8] }, then: 1, else: 0 } } },
					9: { $sum: { $cond: { if: { $eq: ["$nota", 9] }, then: 1, else: 0 } } },
					10: { $sum: { $cond: { if: { $eq: ["$nota", 10] }, then: 1, else: 0 } } }
				}
			},
			{ $sort: { "_id.unidade": 1, "_id.dia": -1 } },
			//{$match:{'_id.unidade':7822} },
			{
				$group: {
					_id: { unidade: "$_id.unidade", ano: "$_id.ano", mes: "$_id.mes" },

					dia: { $first: "$_id.dia" },
					nota00: { $first: "$0" }, nota01: { $first: "$1" }, nota02: { $first: "$2" }, nota03: { $first: "$3" },
					nota04: { $first: "$4" }, nota05: { $first: "$5" }, nota06: { $first: "$6" }, nota07: { $first: "$7" },
					nota08: { $first: "$8" }, nota09: { $first: "$9" }, nota10: { $first: "$10" },
					mediaDia: { $first: "$mediaDia" }, totalDia: { $first: "$total" }, somaDia: { $first: "$somaDia" },
					totalMes: { $sum: "$total" }, somaMes: { $sum: "$somaDia" },
				}
			},
			{ $match: { dia: { $ne: 0 } } },
			{
				$addFields: {
					////dia: {
					//  $cond: { if: { $eq: ["$dia", 0] }, then: dia, else: "$dia" }
					// },
					// diaOld: "$dia",
					mediaAcum: { $divide: ["$somaMes", "$totalMes"] }
				}
			},
			{
				$project: {
					_id: 0, unidade: "$_id.unidade",
					ano: "$_id.ano", mes: "$_id.mes", dia: "$dia",
					nota0: "$nota00", nota1: "$nota01", nota2: "$nota02",
					nota3: "$nota03", nota4: "$nota04", nota5: "$nota05",
					nota6: "$nota06", nota7: "$nota07", nota8: "$nota08",
					nota9: "$nota09", nota10: "$nota10",
					totalDia: "$totalDia",
					mediaDia: "$mediaDia",
					mediaAcumulada: "$mediaAcum"
				}
			}
		], { maxTimeMS: timeOut });
		const retorno = dados;
		console.log("dados",dados);
		return dados;
	}
	catch (error) {
		console.log(error);
	}
};

module.exports = diarioAvaliacoes;