const mongo = require("./mongo");
const nodemailer = require("nodemailer");
const shared = require("./shared/utils");
const newDate = require("./newDate");
const moment = require("moment");

module.exports = async (tipo, cgc, qtd) => {
	const debugMode = false;
	try {
		if (!cgc || !qtd || !tipo) {
			throw `(email) dados invalidos cgc: ${cgc} qtd ${qtd}`;
		}
		debugMode ? console.log(cgc, " ", qtd, " ", tipo) : true;
		const data = newDate(new Date());

		const dados = await Promise.all([
			mongo.findOne("atende", "emailModelos", { id: parseInt(tipo) }),
			mongo.findOne("atende", "unidades", { CGC: cgc })
		]);

		const [modelo, unidade] = dados;

		if (!modelo) throw `(email) modelo email invalido! ${modelo} - ${tipo}`;

		let body = modelo.body;
		let subject = modelo.subject;

		if (!body || !subject) throw `(email) modelo parts invalido! body: ${body}  subject: ${subject}`;

		body = body.replace("{{CGC}}", cgc);
		body = body.replace("{{QTD}}", qtd);

		debugMode ? console.log("email para unidade cgc ", cgc, " qtd ", qtd) : true;
		if (unidade.MAIL) {
			const mailOptions = {
				from: "geban06@corp.caixa.gov.br",
				to: unidade.MAIL, //'C135927' + '@corp.caixa.gov.br', //
				subject: subject,
				html: body
			};

			const transporter = nodemailer.createTransport({
				host: "smtp.correio.caixa",
				port: 25,
				secure: false,
				tls: {
					rejectUnauthorized: false
				}


			});

			//console.log('mailOptions ', mailOptions)
			return transporter.sendMail(mailOptions, function (error, info) {
				if (error) {
					console.log(error);
				}
			});
		}

	} catch (error) {
		console.log("email NODE ", error);
		throw [{ result: 1, error: error }];
	}
};