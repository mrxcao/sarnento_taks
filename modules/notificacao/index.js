const mongo = require("../mongo");
const ObjectId = require("mongodb").ObjectId;
const moment = require("moment-timezone");
const newDate = require("../newDate");
const emailNode = require("../emailNode");

const insereNotificacao = async (id, tipo) => {
	try {
		let matriculasRemover = null;
		let ultimaInteracaoGeral = null;
		let email = null;
		if ((!id) || isNaN(id)) {
			// console.log(`notif id invalido ${id}`)
			return false;
		}
		const getOpcoes = async (idSolicitacao, tipo) => {

			let dados = await Promise.all([
				mongo.findOne("atende", "demandas", { id: parseInt(idSolicitacao) }),
				mongo.findOne("atende", "tiposNotificacao", { _id: tipo })
			]);
			let solicitacao = dados[0];
			let tipoNotif = dados[1];

			if (!solicitacao) {
				console.log(`solicitacaio nao existe ${idSolicitacao} tipo ${tipo} id ${id}`);
				return [];
			}


			let ultimaInteracao = solicitacao.interacoes[solicitacao.interacoes.length - 1].descricao || "";
			if (ultimaInteracao.length >= 4000) { ultimaInteracao = ultimaInteracao.substr(0, 4000) + "..."; }

			ultimaInteracaoGeral = ultimaInteracao;
			let matriculas = [];
			//console.log(tipo)
			switch (tipo) {

			case 1: //resposta
				matriculas = [{ matriculaStr: solicitacao.solicitante.usuario.matriculaStr, tipo: 1 },
					...((solicitacao.seguindo || []).map(e => { return { matriculaStr: e.matriculaStr, tipo: 2 }; }) || [])
				];
				email = 1;
				break;
			case 10: //abrir
				matriculas = [{ matriculaStr: solicitacao.solicitante.usuario.matriculaStr, tipo: 10 }];
				email = 10; //LEMBRAR DE VOLTAR PARA 10
				break;
			case 5: //designar
				matriculas = [{ matriculaStr: solicitacao.atendente.usuario.matriculaStr, tipo: 5 }];
				email = 5;
				break;
			case 4: //reabrir
				let = ultimaResposta = solicitacao.interacoes.filter(el => el.idTipoInteracao == 10).slice(-1);
				if (ultimaResposta) {
					matriculas = [{ matriculaStr: ultimaResposta[0].usuario.matriculaStr, tipo: 4 }];
				}
				matriculas.push(...((solicitacao.seguindo || []).map(e => { return { matriculaStr: e.matriculaStr, tipo: 3 }; }) || []));
				email = 4;
				break;
			case 6: //complementoResposta
				matriculas = [{ matriculaStr: solicitacao.solicitante.usuario.matriculaStr, tipo: 6 },
					...((solicitacao.seguindo || []).map(e => { return { matriculaStr: e.matriculaStr, tipo: 9 }; }) || [])];
				email = 6;
				break;
			case 7: //complementoSolicitacao
				matriculas = [{ matriculaStr: solicitacao.solicitante.usuario.matriculaStr, tipo: 7 },
					...((solicitacao.seguindo || []).map(e => { return { matriculaStr: e.matriculaStr, tipo: 8 }; }) || [])];
				email = 6;
				break;
			case 11: //vencendo hoje
				//console.log('xxxx')
				matriculas = [{ matriculaStr: solicitacao.atendente.usuario.matriculaStr, tipo: 11 }];
				email = 8;
				break;
			}

			matriculasRemover = matriculas.map(e => e.matriculaStr);

			let opcoes = await mongo.aggregate("atende", "empregadosOpcoes", [
				{
					$match: {
						matriculaStr: { $in: matriculasRemover },
					}
				},
				{ $unwind: "$notificacao.itens" },
			]);
			opcoes = opcoes || [];
			// console.log('opcoes ', opcoes[0].notificacao.itens)
			//console.log('matriculas ', matriculas)

			for (const m of matriculas) {
				let opcoesx = ((opcoes.filter(e => e.matriculaStr == m.matriculaStr &&
          m.tipo == e.notificacao.itens.id //&&
          //(e.notificacao.itens.email == true || e.notificacao.itens.app == true)
				)[0] || {}).notificacao || {}).itens;
				m.opcoes = opcoesx;
			}

			let results = [];


			for (const user of matriculas) {
				// let opcoesEmail = tipo == 11 ? true : ((user.opcoes || {}).email || false)
				let opcoesEmail = ((user.opcoes || {}).email || false);
				results.push({
					_id: new ObjectId(),
					demanda: solicitacao.id,
					matriculaStr: user.matriculaStr, //solicitacao.solicitante.usuario.matriculaStr,
					//unidade: solicitacao.solicitante.unidade.unidade,
					data: newDate(new Date()),
					tipo: tipoNotif,
					lida: false,
					metodo: { email: opcoesEmail, app: ((user.opcoes || {}).app || true) },
					emailEnviado: false,
					email: email//tipo.toString()
				});
				// }
			}
			// console.log(results)
			return results;
		};

		let insertItems = [];
		switch (tipo) {

		case "abertura":
			insertItems = await getOpcoes(id, 10);
			break;

		case "resposta":
			insertItems = await getOpcoes(id, 1);
			break;

		case "complementoResposta":
			insertItems = await getOpcoes(id, 6);
			break;

		case "complementoSolicitacao":
			insertItems = await getOpcoes(id, 7);
			break;

		case "reabrir":
			insertItems = await getOpcoes(id, 4);
			break;

		case "designar":
			//console.log('designar --', id)
			insertItems = await getOpcoes(id, 5);
			// console.log('insertItems ', insertItems)
			break;
		case "vencendoHoje":
			insertItems = await getOpcoes(id, 11);
			// console.log('insertItems ', insertItems)
			break;

		}
		// console.log(id, ' insertItems ', insertItems)
		if (!insertItems.length) return false;
		for (const e of insertItems) {
			//console.log(e.metodo)
			if (e.metodo.app) {
				mongo.insertOne("atende", "notificacoes", e);
			}
			if (e.metodo.email) {
				//  console.log('foi')
				let enviadoErro = await emailNode(email, e.matriculaStr, e.demanda, ultimaInteracaoGeral);

				//console.log('enviado', enviado)
				if (enviadoErro) {
					console.log("erro envio de email ", enviadoErro);
				} else {
					mongo.updateOne("atende", "notificacoes", { _id: e._id }, { emailEnviado: true });
				}
			}



		}
		removeNotificacoesAntigas(matriculasRemover);

	} catch (error) {
		throw error;
	}
};




const removeNotificacoesAntigas = async (arrayMatriculas) => {

	for (const mat of arrayMatriculas) {

		let notficacosAntigas = await mongo.aggregate("atende", "notificacoes", [
			{ $match: { matriculaStr: mat } },
			{ $sort: { data: -1 } },
			{ $skip: 5 }
		]);
		let ids = notficacosAntigas.map(e => e._id);

		await mongo.delete("atende", "notificacoes", { matriculaStr: mat, _id: { $in: ids } });
		await mongo.delete("atende", "notificacoes", {
			$or: [{ "metodo.email": false, "metodo.app": true, lida: true },
				{ "metodo.app": false, "metodo.email": true, emailEnviado: true },
				{ lida: true, emailEnviado: true },
				{ metodo: null, lida: true }
			]
		}
		);
	}

};

module.exports = {
	insereNotificacao,
	removeNotificacoesAntigas
};