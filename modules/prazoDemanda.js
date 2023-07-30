const mongo = require("./mongo");
const newDate = require("./newDate");
const business = require("moment-business");
const moment = require("moment");

module.exports = async (unidade, dt, dias) => {
	try {
		let cgc = parseInt(unidade);
		let dadosUnidade = await mongo.findOne("atende", "unidades", {
			CGC: cgc
		});
		let dt2 = moment(dt).utcOffset(0).startOf("day").toDate();
		let diasInt = parseInt(dias);
		let diaFinalFeriados = new Date(dt2);
		diaFinalFeriados.setDate(diaFinalFeriados.getDate() + (diasInt + 9));
		let limite = diasInt;

		//console.log('teste',dt2, diaFinalFeriados, )

		let feriados = await mongo.aggregate("atende", "feriadosLocais", [{
			$match: {
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
			}
		}

		]);
		//console.log('a',feriados)
		feriados = (feriados.map(e => e.dataFeriado) || []);
		//console.log('feriados ', feriados)

		let data = new Date(dt2);
		//console.log('data --- ', data)
		const ehDiaUtil = (data, feriados) => {

			let dataMs = data;
			let ret = (([0, 6].indexOf(moment(data).utcOffset(0).day()) == -1) &&
        !(feriados.filter(dia => {
        	return moment(dia).utcOffset(0).startOf("day")
        		.isSame(moment(data).utcOffset(0).startOf("day"));
        }).length > 0)
			);
			//console.log('essa ', data, ' - ', ret, ' - ', moment(data).utcOffset(0).day())
			return ret;
		};

		let dataProximoDiaUtilAbertura = moment(data).utcOffset(0).toDate();

		//console.log('dataProximoDiaUtilAbertura  ',dataProximoDiaUtilAbertura )

		let count = 1;
		let finaliza = false;
		let dataProximoDiaUtilPrazo = moment(dataProximoDiaUtilAbertura).utcOffset(0).toDate();
		while (count <= limite) {
			let du = ehDiaUtil(dataProximoDiaUtilPrazo, feriados);
			//console.log(count,  feriados)
			if (du) count++;
      
			if ((!du && finaliza) || (!finaliza))
				dataProximoDiaUtilPrazo = moment(dataProximoDiaUtilPrazo).utcOffset(0).add(1, "days").toDate();
			// console.log(count,' - ',(limite+1))
			if (count == (limite + 1)) {
				//console.log('teste ',dataProximoDiaUtilPrazo)
				if (!ehDiaUtil(dataProximoDiaUtilPrazo, feriados)) {
					count--;
					finaliza = true;
				}
			}

		}
		//console.log('ret ',dataProximoDiaUtilPrazo)   
		return dataProximoDiaUtilPrazo;

	} catch (error) {
		throw error;
	}


};