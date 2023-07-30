const mongo = require("./mongo");
const nodemailer = require("nodemailer");
const shared = require("./shared/utils");
const newDate = require("./newDate");
const moment = require("moment");

module.exports = async (tipo, matricula, id, UltimaInteracao = "") => {

	try {
		// if (['C135927', 'C099529', 'C092181', 'C077817', 'C082647', 'C111420', 'C077870'].indexOf(matricula) == -1) return false
		if (!tipo || !matricula || !id) {
			throw `(email) dados invalidos tipo: ${tipo} matricula ${matricula} id ${id}`;
		}

		if (!shared.matriculaStrValida(matricula)) throw `(email) matricula invalida! ${matricula}`;

		const data = newDate(new Date());
		let data2 = moment(data).utcOffset(0).format("DD/MM/YYYY");//moment(data).utcOffset(0).toDate()

		let desc = UltimaInteracao; //.replace(/<[^>]+>/g, '');
		desc = desc.replace("\"", "").replace("'", "");
		if (desc == "") { desc = "-"; }
		if (desc.length > 4000) { desc = desc.substring(0, 4000) + "... "; }

		const dados = await Promise.all([
			mongo.findOne("atende", "emailModelos", { id: parseInt(tipo) }),
			mongo.findOne("atende", "empregados", { MATRICULASTR: matricula }),
			mongo.findOne("atende", "demandas", { id: parseInt(id) })
		]);

		const [modelo, usuario, solicitacao] = dados;
		const nome = usuario.NOME;
		const primeiroNome = nome.split(" ")[0];
		const nomeCompletoCategoria = solicitacao.categoria.nomeCompleto;
		const titulo = solicitacao.titulo;
		const prazo = moment(solicitacao.expiraEm).utcOffset(0).format("DD/MM/YYYY");
		const dataAbertura = moment(solicitacao.data).utcOffset(0).format("DD/MM/YYYY");

		if (!modelo) throw `(email) modelo email invalido! ${modelo} - ${tipo}`;

		let body = modelo.body;
		let subject = modelo.subject;

		if (!body || !subject) throw `(email) modelo parts invalido! body: ${body}  subject: ${subject}`;

		subject = subject.replace("{{DATA}}", data2);
		subject = subject.replace("{{NUMERO}}", id);

		body = body.replace("{{NOME}}", nome);
		body = body.replace("{{PRIMEIRO_NOME}}", primeiroNome);
		body = body.replace("{{TITULO}}", titulo);
		body = body.replace("{{PRAZO}}", prazo);
		body = body.replace("{{NOME_COMPLETO_CATEGORIA}}", nomeCompletoCategoria);
		body = body.replace("{{SEXO}}", "o(a)");
		body = body.replace("{{NUMERO}}", id);
		body = body.replace("{{ULTIMAINTERACAO}}", desc);
		body = body.replace("{{DATA_ABERTURA}}", dataAbertura);

		//console.log('subject', subject)
		//console.log('body', body)

		const mailOptions = {
			from: "geban06@corp.caixa.gov.br",
			to: matricula + "@corp.caixa.gov.br",
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
				console.log(error, info);
			}
		});

	} catch (error) {
		console.log("email NODE ", error);
		throw [{ result: 1, error: error }];
	}
};