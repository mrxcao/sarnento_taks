//const moment = require("moment-timezone");
module.exports = d => {
	//let d = new Date()
	//let d2 = moment(d).tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss.SSS");
	let novaData = new Date(new Date(d).getTime() - 180*60*1000);
	//let novaData = moment.tz(d, "America/Sao_Paulo" ).format("YYYY-MM-DDTHH:mm:ss.SSS") 
	//'YYYY-MM-DDTHH:mm:ss.000Z'
	//console.log( 'datawww', )
	return (novaData);
};
/*
const moment = require("moment-timezone");
module.exports = d => {
        //let d = new Date()
        let d2 = moment(d).tz(     
                "America/Sao_Paulo"
              ).format('YYYY-MM-DD HH:mm:ss.SSS')

        //let novaData = new Date(new Date(d).getTime() - 180*60*1000)
        let novaData = moment.tz(d, "America/Sao_Paulo" ).toDate()
       //let novaData = moment.tz(d, "America/Sao_Paulo" ).format("YYYY-MM-DDTHH:mm:ss.SSS")  
       
        //'YYYY-MM-DDTHH:mm:ss.000Z'
        //console.log( 'datawww', )
        return (novaData);
}
*/