const mongo = require("./mongo");
const newDate = require("./newDate");
const business = require("moment-business");
const moment = require("moment");

module.exports = async (unidade, dt, dias) => {
	try {
		let dt2 = moment(dt).utcOffset(0).startOf("day").toDate();
		let diasInt = parseInt(dias);
		let diaFinalFeriados = new Date(dt2);
		diaFinalFeriados.setDate(diaFinalFeriados.getDate() + (diasInt + 9));
		let limite = diasInt > 0 ? diasInt : diasInt * (-1);

		let match = {};
		if (unidade != 0) {

			let cgc = parseInt(unidade);
			let dadosUnidade = await mongo.findOne("atende", "unidades", {
				CGC: cgc
			});

			match = {
				dataFeriado: {
					$gte: dt2,
					$lt: diaFinalFeriados
				},
				$or: [{
					municipio: dadosUnidade.COD_MUN
				}, {
					$and: [{
						municipio: 0
					}, {
						uf: dadosUnidade.UF
					}]
				}, {
					$and: [{
						municipio: 0
					}, {
						uf: "BR"
					}]
				}]
			};

		} else {
			match = {
				$and: [{
					municipio: 0
				}, {
					uf: "BR"
				}]
			};
		}

		let feriados = await mongo.aggregate("atende", "feriadosLocais", [{
			$match: match
		}

		]);

		feriados = (feriados.map(e => e.dataFeriado) || []);

		let data = new Date(dt2);
		const ehDiaUtil = (data, feriados) => {

			let dataMs = data;
			let ret = (([0, 6].indexOf(moment(data).utcOffset(0).day()) == -1) &&
        !(feriados.filter(dia => {
        	return moment(dia).utcOffset(0).startOf("day")
        		.isSame(moment(data).utcOffset(0).startOf("day"));
        }).length > 0)
			);
			return ret;
		};

		let dataProximoDiaUtilAbertura = moment(data).utcOffset(0).toDate();

		let count = 1;
		let finaliza = false;
		let dataProximoDiaUtilPrazo = moment(dataProximoDiaUtilAbertura).utcOffset(0).toDate();
		while (count <= limite) {
			let du = ehDiaUtil(dataProximoDiaUtilPrazo, feriados);

			if (du) count++;

			if ((!du && finaliza) || (!finaliza))
				dataProximoDiaUtilPrazo =
          dias < 0 ? moment(dataProximoDiaUtilPrazo).utcOffset(0).subtract(1, "days").toDate() :
          	moment(dataProximoDiaUtilPrazo).utcOffset(0).add(1, "days").toDate();

			if (count == (limite + 1)) {

				if (!ehDiaUtil(dataProximoDiaUtilPrazo, feriados)) {
					count--;
					finaliza = true;
				}
			}

		}
		return dataProximoDiaUtilPrazo;

	} catch (error) {
		throw error;
	}


};