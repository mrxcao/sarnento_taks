const assinatura = require("./assinatura");
const newDate = require("./newDate");
const fs = require("fs");
const mongo = require("./mongo");
module.exports = async (obj) => {
	try {
		let log = { msg: {}, route: {}, user: {}, client: {} };
		let data = newDate(new Date());
		let codigo;
		//let rota = req.originalUrl
		//let msg = error

		//let msg = obj.error.stack ? obj.error.stack: obj.error
		let msg = obj.error.toString();

		let detalhe = obj.error.stack;

		let request = obj.request || obj.req;

		log.data = data;
		log.detalhe = detalhe;

		if (msg) {
			log.msg = msg;
			log.codigo = (msg.substring(6).substring(0, 1) == "]") ? msg.substring(1, 6) : "00000";
		} else {
			codigo = 99999;
		}
		//}else {
		//log.msg
		//}
		let ip = (
			request.headers["x-forwarded-for"] ||
            request.connection.remoteAddress ||
            request.socket.remoteAddress ||
            request.connection.socket.remoteAddress
		).split(",")[0];

		log.client.ip = ip;
		log.client.originalUrl = request.originalUrl;

		if (request.user)
			log.user = await assinatura(request.user);

		if (request) {
			log.route.protocol = request.protocol;
			log.route.host = request.get("host");
			log.route.pathname = request.originalUrl;
			log.route.main = request.route;
		}

		let json = JSON.stringify(log);

		//console.log('erro:',json)
		//fs.appendFileSync('log/log.txt', ",["+json+"]");
		//const db = await mongo.connectDb()
		let avisos = await mongo.insertOne("atende", "logRouter", log);
		//mongo.closeDb(db)      

	} catch (error) {
		console.log(error);
	}
};
