const mongo = require("./mongo");
//const mongoProd = require("./mongo");
const moment = require("moment");
const newDate = require("./newDate");

const verificar = async () => {
	let p159 = {};
	const hoje = newDate(new Date());
	try {		
		p159 = await mongo.find("atende", "params", {});
		//	let p152 = await mongoProd.find("atende", "params", {});
		//	p152 = p152.data[0];
		p159 = p159.data[0];
		/*
		if (p152.espelhoDiaAnteriorOK == true && p159.espelhoDiaAnteriorOK == true 
		&& moment(p152.espelhoDiaAnteriorData).utcOffset(0).startOf("day").valueOf() ==
			moment(p159.espelhoDiaAnteriorData).utcOffset(0).startOf("day").valueOf()
		&& moment(p152.espelhoDiaAnteriorDataVerificacao).utcOffset(0).startOf("day").valueOf() ==
			moment(p159.espelhoDiaAnteriorDataVerificacao).utcOffset(0).startOf("day").valueOf()			
		&& moment(hoje).utcOffset(0).startOf("day").valueOf() == 
			moment(p159.espelhoDiaAnteriorDataVerificacao).utcOffset(0).startOf("day").valueOf()
		)
		*/
		if (p159.espelhoDiaAnteriorOK == true  &&
			moment(hoje).utcOffset(0).startOf("day").valueOf() == moment(p159.espelhoDiaAnteriorDataVerificacao).utcOffset(0).startOf("day").valueOf()			)
		{			
			return true;
		} else {			
			return false;
		}
	} catch (error) {
		console.log("espelho error:",error,hoje, p159);
		throw error;
	}
};

module.exports = {verificar};