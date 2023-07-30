const mongo = require("../mongo");
const isObject = require("../isObject");
const ObjectId = require("mongodb").ObjectId;
const getPrazo = require("../prazoDemanda");
const nextWorkDay = require("../nNextWorkDay");
const moment = require("moment-timezone");
const newDate = require("../newDate");
//const emailSQL = require("../emailSQL");
const assinaturaUnidadeUsuario = require("../assinaturaUnidadeUsuario");
const log = require("../logRouter");

const pegaTags = texto => {
	//let tags = texto? texto.match(/(^|\s)(#[a-z\w][\w-]*)/g) :null
	let tags = texto ? texto.match(/(#[a-z\w][\w-]*)/g) : null;
	tags = tags ? tags : [];
	return tags;
};
const getParentsCategoria = async (c) => {
	try {
		let macro = {};
		let idCategoria = c;
		if (isObject(c)) {
			idCategoria = c;
		} else {
			idCategoria = ObjectId(idCategoria);
		}
		categorias = await mongo.find("atende", "categorias", {});
		categorias = categorias.data;
		let ncategoria = categorias.filter(
			cat => "" + cat._id == "" + ObjectId(idCategoria)
		)[0];
		let arrayCategorias = [];
		let dados = {};
		let categoriaLoop = ncategoria;
		let cat = {};
		let i = 0;
		while (categoriaLoop.parentId) {
			i++;
			cat = { _id: categoriaLoop._id, nome: categoriaLoop.nome, macro: false, ordem: i };
			arrayCategorias.push(cat);
			categoriaLoop =
        categorias.filter(
        	cat => "" + cat._id == "" + categoriaLoop.parentId
        )[0] || {};
		}
		if (!categoriaLoop.parentId) {
			i++;
			cat = { _id: categoriaLoop._id, nome: categoriaLoop.nome, macro: true, ordem: i };
			macro = { _id: categoriaLoop._id, nome: categoriaLoop.nome };
			arrayCategorias.push(cat);
		}
		dados.lista = arrayCategorias;
		dados.macro = macro;
		let nomeCompleto = arrayCategorias.map(e => e.nome).reverse().join(" - ");
		dados.nomeCompleto = nomeCompleto;
		return dados;
	} catch (error) {
		throw `erro ${error}`;
	}
};
const getUnidadesAtendentes = async (categoria, destino) => {

	try {
		let unidDestino = destino || [];
		let dados = await mongo.findOne("atende", "categorias", { _id: categoria });
		let camposDestino = {};
		let validaUnidades = dados.tratamento.filter(e => e.UNIDADE).map(el => el.UNIDADE)[0] || [];
		let validaSiglas = dados.tratamento.filter(e => e.SIGLA_UNIDADE).map(el => el.SIGLA_UNIDADE).reduce((ac, el) => [...ac, ...el], []) || [];
		let validaTipoUnidade = dados.tratamento.filter(e => e.TIPO_UNIDADE).map(el => el.TIPO_UNIDADE).map((el, i) => el[i]) || [];
		let validaUnidadesDestino = dados.unidadesDestino.filter(e => e.UNIDADE).map(el => el.UNIDADE)[0] || [];

		let _or = [];
		if (validaUnidadesDestino.length > 0) {
			_or = [
				{ CGC: { $in: validaUnidadesDestino } }];
		} else {
			_or = [

				{ SIGLA: { $in: validaSiglas } },
				{ TIPO_UNIDADE: { $in: validaTipoUnidade } },
				{ CGC: { $in: validaUnidades } }
			];

		}
		let unidInformada = await mongo.findOne("atende", "unidades",
			{
				CGC: parseInt(destino),
				$or: _or

			}

		);
		// SIGLA_UNIDADE:CIACV;

		if (destino && !unidInformada) {
			throw `[01030] - unidade informada precisa constar na unidadesDestinos da categoria ou entre as siglas! unidade: ${destino} , categoria: ${categoria}`;
		} else {
			if (destino) {
				camposDestino.unidade = unidInformada.CGC;
				camposDestino.nome = unidInformada.NOME;
				camposDestino.sigla = unidInformada.SIGLA;
				camposDestino.uf = unidInformada.UF;
				camposDestino.cgcAgregadora = unidInformada.CGC_VINC;
				return [camposDestino];
			}
		}
		let unidades = [];
		let porSigla = [];
		let unidsSigla = [];
		let unids = dados.tratamento.filter(e => e.UNIDADE).map(el => el.UNIDADE) || [];

		let siglas = dados.tratamento.filter(e => e.SIGLA_UNIDADE).map(el => el.SIGLA_UNIDADE) || [];
		//siglas = siglas ? sliglas[0]: []
		if (siglas) {
			siglas = [].concat(siglas[0]);
		}


		let unidadesFinal = [];
		if (unids[0]) {
			unidades = unidDestino.concat(unids[0]); //unidDestino sai
		}

		if (siglas) {
			porSigla = await mongo.find("atende", "unidades", { SIGLA: { $in: siglas } });
			unidsSigla = porSigla.data.filter(e => e.CGC).map(el => el.CGC) || [];
		}

		if (porSigla) {
			unidades = unidades.concat(unidsSigla);
		}

		for (const n of unidades) {
			let m = await mongo.findOne("atende", "unidades", { CGC: n }); //fazer um select só, tira esse findOne

			let y = {
				unidade: m.CGC, nome: m.NOME, sigla: m.SIGLA, uf: m.UF,
				cgcAgregadora: m.CGC_VINC
			};
			//-----let x = todasUnidades.data.filter(e=>e.CGC==n).map(m=>{ return {unidade:m.CGC, nome:m.NOME, sigla: m.SIGLA, cgcAgregadora: m.CGC_VINC }})[0] 
			unidadesFinal.push(y);


		}

		return unidadesFinal;
	}
	catch (error) {
		log({ error });
		// response.status(500).send(error.toString());
		throw error;
	}
};
const getDataExpiracao = async (unidades, data, n) => {
	try {
		//console.log('getDataExpiracao',data, n, unidades)
		data = data || newDate(new Date());
		n = isNaN(n) ? 3 : n;
		let unids = unidades;
		let ultPrazo = data;
		for (const u of unids) {
			await getPrazo(u.unidade, data, n).then(resposta => {
				let dt = moment(resposta).utcOffset(0).set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toDate();
				if (dt > ultPrazo) ultPrazo = dt;
			});
		}
		return ultPrazo;
	}
	catch (error) {
		//log({ error })
		throw error;
	}
};
const con = () => {
	console.log("ok");
};
const getIdSolicitacao = async () => {
	try {
		let sequencia = await getNextSequence("demandas");
		return sequencia;
	} catch (error) {
		throw `IdSolicitacao ${error}`;
		//return error.toString();      
	}
};
const situacaoHist = (situacao) => {
	return { _id: situacao._id, nomeSituacao: situacao.nomeSituacao, data: situacao.data, usuario: situacao.usuario };
};
const arraysEqual = (a1, a2) => {
	if (a2.filter(a => { return a.unidade == 1; }).length > 0) return true;
	let b1 = a1.map(e => { return { unidade: e.unidade, nome: e.nome, sigla: e.sigla }; });
	let b2 = a2.map(e => { return { unidade: e.unidade, nome: e.nome, sigla: e.sigla }; });
	return (b1.length === b2.length && b1.every((o, idx) => objectsEqual(o, b2[idx])));
};
const gravaCatMaisUsada = async (matriculaStr, categoria) => {
	let cat = "" + categoria;
	//console.log('gravaMaisUsadas ', matricula,cat)
	let cons = (await mongo.findOne("atende", "categoriasFavoritas", { matriculaStr: matriculaStr }) || {});
	let maisUsadas = (cons.maisUsadas || []);
	if (maisUsadas.filter(e => { return e == cat; }).length <= 0) {
		maisUsadas.push(cat);
		maisUsadas = maisUsadas.slice(-5);
		//console.log('maisUsadas ',maisUsadas)

		let data = await mongo.upsertOne("atende", "categoriasFavoritas", { matriculaStr: matriculaStr }, { matriculaStr: matriculaStr, maisUsadas });
	}
};
const calculaflagsInteracao = async (idSolicitacao, agora, usuario) => {

	try {
		let demanda = await mongo.findOne("atende", "demandas", { id: parseInt(idSolicitacao) });
		if (!demanda) {
			console.log(idSolicitacao, " não encontrado");
			return;
		}

		// let demanda = await mongo.findOne('atende', "demandas", { id: parseInt(idSolicitacao) })     
		let ultimaInteracao = demanda.interacoes.filter(e => { return [3, 11].indexOf(e.idTipoInteracao) == -1; }).slice(-1)[0];
		let dataUltimaInteracao = ultimaInteracao.data;

		let interacaoAnterior = ultimaInteracao;
		let idInteracao;

		let periodos = [];
		let dataInicial = moment(ultimaInteracao.data).utcOffset(0).toDate();
		let dataInicialAlfa = moment(ultimaInteracao.data).utcOffset(0).toDate();
		let dataInicialAux = moment(ultimaInteracao.data).utcOffset(0).toDate();
		let dataFinal = moment(agora).utcOffset(0).toDate();
		// console.log('=========>> ',dataInicialAux,'dataInteracao ',i.data,'dataFinal ', dataFinal)

		while //(dataInicialAux <= dataFinal) {   
		(moment(dataInicialAux).utcOffset(0).startOf("month").valueOf() <=
      moment(dataFinal).utcOffset(0).startOf("month").valueOf()) {
			//console.log('dataInicialAux ',dataInicialAux,dataFinal,i._id)
			let mes = dataInicialAux.getUTCMonth() + 1;
			let ano = dataInicialAux.getUTCFullYear();
			// console.log(ano,'-',mes,dataInicialAux)                         

			if (periodos.filter(e => { return e.ano == ano && e.mes == mes; }).length == 0) {
				periodos.push({ ano, mes });
			}
			dataInicialAux = moment(dataInicialAux).utcOffset(0).add(1, "days").toDate();
			// console.log('dataInicialAux2 ',dataInicialAux,dataFinal,i._id)                                                                  
		}

		let retorno = [];
		let perAux = 0;
		for (const p of periodos) {
			perAux++;
			let mesP = p.mes - 1;
			let d = new Date(p.ano, mesP, 1);
			let tempoDiasDeduzidos = { feriados: [], sabados: 0, domingos: 0, outros: [] };
			let dtFim = moment(d).utcOffset(0).endOf("month").toDate();
			let dtIni = moment(d).utcOffset(0).startOf("month").toDate();
			//  let dtInicial = (dataInicial <= dtIni) ? dtIni : dataInicial
			// let dtFinal = (dataFinal <= dtFim) ? dataFinal : dtFim
			let dtInicial = (moment(dataInicial).utcOffset(0).valueOf() <= moment(dtIni).utcOffset(0).valueOf()) ? dtIni : dataInicial;
			let dtFinal = (moment(dataFinal).utcOffset(0).valueOf() <= moment(dtFim).utcOffset(0).valueOf()) ? dataFinal : dtFim;

			let data1Zerada = moment(dtInicial).utcOffset(0).startOf("day").toDate();
			let data2Zerada = moment(dtFinal).utcOffset(0).startOf("day").toDate();
			// console.log(data1Zerada,' <-> ',data2Zerada )


			let idTipoInteracao = ultimaInteracao.idTipoInteracao;
			let difTempoMS = dtFinal - dtInicial;
			let indiceDia1 = (moment(dtInicial).utcOffset(0).isoWeekday());
			let indiceDiaFinal = (moment(dtFinal).utcOffset(0).isoWeekday());
			let diferencaTempo = data2Zerada - data1Zerada;
			let somaPrimeiroDia = (perAux == 1 ? 0 : 1);
			let difDiasBruto = parseInt(diferencaTempo / 86400000) + somaPrimeiroDia; // (perAux>1 ? 1 : 0 )  
			//if (i._id=="5d43167515c5bb20cc9ebb6f"){
			//  console.log('dtIni ', dtIni,'dtInicial ', dtInicial,'dtFim ', dtFinal, 'dtFinal ',dtFinal)
			//}

			// if (p.mes==3) console.log(dddomingos)  
			let unidResp = {};
			let userResp = {};
			switch (idTipoInteracao) {
			case 1: //Abertura
				unidResp = await assinaturaUnidadeUsuario(usuario);
				break;
			case 4: //Designacao
				unidResp = await assinaturaUnidadeUsuario(ultimaInteracao.usuario);
				break;
			case 5: //Reabertura
				unidResp = await assinaturaUnidadeUsuario(ultimaInteracao.origem.usuario);
				userResp = ultimaInteracao.origem.usuario;
				break;
			case 6: //Reclassificacao
				unidResp = await assinaturaUnidadeUsuario(usuario);
				/*
          if (ultimaInteracao.unidadeDestino
            .map(e => e.unidade)
            .indexOf(ultimaInteracao.usuario.unidade) > -1) {
            unidResp = await assinaturaUnidadeUsuario(ultimaInteracao.usuario)
          } else {
            unidResp = await assinaturaUnidadeUsuario(usuario)
          }
          */
				break;
			case 7: //Bloqueio
				unidResp = await assinaturaUnidadeUsuario(ultimaInteracao.usuario);
				userResp = ultimaInteracao.usuario;
				break;
			case 8: //desbloqueio
				unidResp = await assinaturaUnidadeUsuario(ultimaInteracao.usuario);
				break;

			}
			let sabadosAuxDeduzir = 0;
			let domingosAuxDeduzir = 0;
			//  console.log(data1Zerada,data2Zerada)
			let feriados = await mongo.aggregate("atende", "feriadosLocais", [
				{
					$match: {
						dataFeriado: { $gte: data1Zerada, $lte: data2Zerada },
						$or: [{ municipio: unidResp.unidade }, { $and: [{ municipio: 0 }, { uf: unidResp.uf }] }, { $and: [{ municipio: 0 }, { uf: "BR" }] }]
					}
				}]);
			// console.log(feriados)
			// console.log(data1Zerada)
			feriados = feriados//.filter(e=> [6,7].indexOf(moment(e.dataFeriado).utcOffset(0).isoWeekday())==-1 )
				.map(x => x.dataFeriado);

			feriados = feriados.filter((elem, pos, arr) => {
				return arr.indexOf(elem) == pos;
			});//.map(c=>{return {data:c,obs:'F'}})  

			tempoDiasDeduzidos.feriados = feriados;

			let feriadosAux = feriados.map(e => moment(e).utcOffset(0).startOf("day").valueOf());

			let diffDias = somaPrimeiroDia;//0
			let ultDiaFdsFeriado = 0;
			if ((perAux < periodos.length) &&
        ([6, 7].indexOf(indiceDiaFinal) > -1 || feriadosAux.indexOf(moment(dtFinal).utcOffset(0).valueOf()) > -1)) {

				ultDiaFdsFeriado = -1;
			}
			diffDias = diffDias + ultDiaFdsFeriado;

			//console.log((perAux < periodos.length), [6, 7].indexOf(indiceDiaFinal) > -1)
			let data1Aux = moment(data1Zerada).utcOffset(0).toDate();

			let dataDiaAnterior = moment(data1Aux).utcOffset(0).subtract(1, "day").toDate();
			let qtdSab = 0;
			let qtdDom = 0;
			while
			(moment(data1Aux).utcOffset(0).startOf("day").valueOf() <=
        moment(data2Zerada).utcOffset(0).startOf("day").valueOf()) {

				qtdSab = (moment(data1Aux).utcOffset(0).isoWeekday() == 6) ? qtdSab + 1 : qtdSab;
				qtdDom = (moment(data1Aux).utcOffset(0).isoWeekday() == 7) ? qtdDom + 1 : qtdDom;

				data1Aux = moment(data1Aux).utcOffset(0).add(1, "days").toDate();

				dataDiaAnterior = moment(data1Aux).utcOffset(0).subtract(1, "day").toDate();
				//console.log(dataDiaAnterior, data1Aux)

				let diaMax = (moment(dataDiaAnterior).utcOffset(0).startOf("day").valueOf() <
          moment(data2Zerada).utcOffset(0).startOf("day").valueOf()) ? false : true;

				indiceDiaAnterior = moment(dataDiaAnterior).utcOffset(0).isoWeekday();
				ehFeriado = (feriadosAux.indexOf(moment(dataDiaAnterior).utcOffset(0).valueOf()) > -1) ? true : false;
				ehFimSemana = [6, 7].indexOf(indiceDiaAnterior) > -1 ? true : false;
				if (!(ehFimSemana || ehFeriado) && !diaMax) {

					//  console.log('dia util ', dataDiaAnterior,
					//  indiceDiaAnterior, ehFeriado, ehFimSemana)
					diffDias++;
				}

			}
			diffDias = difDiasBruto == 0 ? 0 : diffDias;
			diffDias = (diffDias < 0) ? 0 : diffDias;
			retorno.push({
				ano: p.ano, mes: p.mes, idInteracaoAnterior: ultimaInteracao._id, ok: true, tempoMs: difTempoMS,
				tempoDias: diffDias, unidade: unidResp, dtInicial, dtFinal,
				feriados: tempoDiasDeduzidos.feriados,
				sabados: qtdSab,
				domingos: qtdDom,
				somaPrimeiroDia,
				difDiasBruto, //944803
				ultDiaFdsFeriado

			});
		}
		return retorno;
		//}//}

	} catch (erro) {
		throw erro;
	}
};
const calculaflagsInteracaoUltimo03082020 = async (idSolicitacao, agora, usuario) => {

	try {
		let demanda = await mongo.findOne("atende", "demandas", { id: parseInt(idSolicitacao) });
		if (!demanda) {
			console.log(idSolicitacao, " não encontrado");
			return;
		}

		// let demanda = await mongo.findOne('atende', "demandas", { id: parseInt(idSolicitacao) })     
		let ultimaInteracao = demanda.interacoes.filter(e => { return [3, 11].indexOf(e.idTipoInteracao) == -1; }).slice(-1)[0];
		let dataUltimaInteracao = ultimaInteracao.data;

		let interacaoAnterior = ultimaInteracao;
		let idInteracao;

		let periodos = [];
		let dataInicial = moment(ultimaInteracao.data).utcOffset(0).toDate();
		let dataInicialAlfa = moment(ultimaInteracao.data).utcOffset(0).toDate();
		let dataInicialAux = moment(ultimaInteracao.data).utcOffset(0).toDate();
		let dataFinal = moment(agora).utcOffset(0).toDate();
		// console.log('=========>> ',dataInicialAux,'dataInteracao ',i.data,'dataFinal ', dataFinal)

		while //(dataInicialAux <= dataFinal) {   
		(moment(dataInicialAux).utcOffset(0).startOf("month").valueOf() <=
      moment(dataFinal).utcOffset(0).startOf("month").valueOf()) {
			//console.log('dataInicialAux ',dataInicialAux,dataFinal,i._id)
			let mes = dataInicialAux.getUTCMonth() + 1;
			let ano = dataInicialAux.getUTCFullYear();
			// console.log(ano,'-',mes,dataInicialAux)                         

			if (periodos.filter(e => { return e.ano == ano && e.mes == mes; }).length == 0) {
				periodos.push({ ano, mes });
			}
			dataInicialAux = moment(dataInicialAux).utcOffset(0).add(1, "days").toDate();
			// console.log('dataInicialAux2 ',dataInicialAux,dataFinal,i._id)                                                                  
		}

		let retorno = [];
		let perAux = 0;
		for (const p of periodos) {
			perAux++;
			let mesP = p.mes - 1;
			let d = new Date(p.ano, mesP, 1);
			let tempoDiasDeduzidos = { feriados: [], sabados: 0, domingos: 0, outros: [] };
			let dtFim = moment(d).utcOffset(0).endOf("month").toDate();
			let dtIni = moment(d).utcOffset(0).startOf("month").toDate();
			let dtInicial = (dataInicial <= dtIni) ? dtIni : dataInicial;
			let dtFinal = (dataFinal <= dtFim) ? dataFinal : dtFim;

			let data1Zerada = moment(dtInicial).utcOffset(0).startOf("day").toDate();
			let data2Zerada = moment(dtFinal).utcOffset(0).startOf("day").toDate();
			// console.log(data1Zerada,' <-> ',data2Zerada )


			let idTipoInteracao = ultimaInteracao.idTipoInteracao;
			let difTempoMS = dtFinal - dtInicial;
			let indiceDia1 = (moment(dtInicial).utcOffset(0).isoWeekday());
			let diferencaTempo = data2Zerada - data1Zerada;
			let somaPrimeiroDia = (perAux == 1 ? 0 : 1);
			let difDiasBruto = parseInt(diferencaTempo / 86400000) + somaPrimeiroDia; // (perAux>1 ? 1 : 0 )  
			//if (i._id=="5d43167515c5bb20cc9ebb6f"){
			//  console.log('dtIni ', dtIni,'dtInicial ', dtInicial,'dtFim ', dtFinal, 'dtFinal ',dtFinal)
			//}

			// if (p.mes==3) console.log(dddomingos)  
			let unidResp = {};
			let userResp = {};
			switch (idTipoInteracao) {
			case 1: //Abertura
				unidResp = await assinaturaUnidadeUsuario(usuario);
				break;
			case 4: //Designacao
				unidResp = await assinaturaUnidadeUsuario(ultimaInteracao.usuario);
				break;
			case 5: //Reabertura
				unidResp = await assinaturaUnidadeUsuario(ultimaInteracao.origem.usuario);
				userResp = ultimaInteracao.origem.usuario;
				break;
			case 6: //Reclassificacao
				unidResp = await assinaturaUnidadeUsuario(usuario);
				/*
          if (ultimaInteracao.unidadeDestino
            .map(e => e.unidade)
            .indexOf(ultimaInteracao.usuario.unidade) > -1) {
            unidResp = await assinaturaUnidadeUsuario(ultimaInteracao.usuario)
          } else {
            unidResp = await assinaturaUnidadeUsuario(usuario)
          }
          */
				break;
			case 7: //Bloqueio
				unidResp = await assinaturaUnidadeUsuario(ultimaInteracao.usuario);
				userResp = ultimaInteracao.usuario;
				break;
			case 8: //desbloqueio
				unidResp = await assinaturaUnidadeUsuario(ultimaInteracao.usuario);
				break;

			}
			let sabadosAuxDeduzir = 0;
			let domingosAuxDeduzir = 0;
			//  console.log(data1Zerada,data2Zerada)
			let feriados = await mongo.aggregate("atende", "feriadosLocais", [
				{
					$match: {
						dataFeriado: { $gte: data1Zerada, $lte: data2Zerada },
						$or: [{ municipio: unidResp.unidade }, { $and: [{ municipio: 0 }, { uf: unidResp.uf }] }, { $and: [{ municipio: 0 }, { uf: "BR" }] }]
					}
				}]);
			// console.log(feriados)
			// console.log(data1Zerada)
			feriados = feriados//.filter(e=> [6,7].indexOf(moment(e.dataFeriado).utcOffset(0).isoWeekday())==-1 )
				.filter(e => moment(e.dataFeriado).utcOffset(0).startOf("day").valueOf() !=
          moment(dataInicialAlfa).utcOffset(0).startOf("day").valueOf())
				.map(x => x.dataFeriado);

			feriados = feriados.filter((elem, pos, arr) => {
				return arr.indexOf(elem) == pos;
			});//.map(c=>{return {data:c,obs:'F'}})  

			tempoDiasDeduzidos.feriados = feriados;

			let data1Aux = moment(data1Zerada).utcOffset(0).toDate();
			let sab = 0;
			let dom = 0;

			switch (indiceDia1) {
			case 6:
				sab--;
				break;
			case 7:
				dom--;
				break;
			default:
			}

			while
			(moment(data1Aux).utcOffset(0).startOf("day").valueOf() <=
        moment(data2Zerada).utcOffset(0).startOf("day").valueOf()) {
				let indice = (moment(data1Aux).utcOffset(0).isoWeekday());

				if (feriados.filter(e => [6, 7].indexOf(moment(data1Aux).utcOffset(0).isoWeekday()) == -1))
					switch (indice) {
					case 6:
						sab++;
						break;
					case 7:
						dom++;
						break;
					default:
					}

				data1Aux = moment(data1Aux).utcOffset(0).add(1, "days").toDate();
				//data1Aux = moment(data1Aux).utcOffset(0).add(1, 'days').valueOf()

				// console.log('xx ', data1Aux )
				// console.log('dataInicialAux2 ',dataInicialAux,dataFinal,i._id)                                                                  
			}
			tempoDiasDeduzidos.sabados = sab;
			tempoDiasDeduzidos.domingos = dom;
			// console.log(difDiasBruto)
			let difDias = (difDiasBruto - (sab + dom + feriados.length));
			// console.log('difDiasBruto ',difDiasBruto, 'sabados ',sabados,'domingos ', domingos,'feriados ', feriados.length)

			retorno.push({
				ano: p.ano, mes: p.mes, idInteracaoAnterior: ultimaInteracao._id, ok: true, tempoMs: difTempoMS,
				tempoDias: difDias, unidade: unidResp, usuario: userResp, dtInicial, dtFinal,
				feriados: tempoDiasDeduzidos.feriados,
				sabados: tempoDiasDeduzidos.sabados,
				domingos: tempoDiasDeduzidos.domingos,
				somaPrimeiroDia
			});

		}
		return retorno;
		//}//}

	} catch (erro) {
		throw erro;
	}
};
const calculaPrazoConquiste = async (idSolicitacao, agora, usuario, interacaoAtual) => {

	try {
		let demanda = await mongo.findOne("atende", "demandas", { id: parseInt(idSolicitacao) });
		if (!demanda) {
			console.log(idSolicitacao, " não encontrado");
			return;
		}
		let retorno = [];

		if ([10].indexOf(interacaoAtual.idTipoInteracao) > -1 ||
      ((interacaoAtual.idTipoInteracao == 6 &&
        interacaoAtual.unidadeDestino.map(e => e.unidade).indexOf(usuario.unidade) == -1 &&
        interacaoAtual.usuario.unidade == usuario.unidade)
      )

		) {


			// let demanda = await mongo.findOne('atende', "demandas", { id: parseInt(idSolicitacao) })     
			let ultimaInteracao = demanda.interacoes.filter(e => {
				return ([1, 5].indexOf(e.idTipoInteracao) > -1 ||
          ((e.idTipoInteracao == 6 &&
            e.unidadeDestino.map(e => e.unidade).indexOf(usuario.unidade) > -1 &&
            e.usuario.unidade != usuario.unidade)
          )

				);
			}).slice(-1)[0];

			let dataInicial = moment(ultimaInteracao.data).utcOffset(0).toDate();
			let dataInicialAlfa = moment(ultimaInteracao.data).utcOffset(0).toDate();
			let dataFinal = moment(agora).utcOffset(0).toDate();
			let mes = moment(agora).utcOffset(0).month() + 1;//format('YYYY');
			let ano = moment(agora).utcOffset(0).year();//format('MM');

			let tempoDiasDeduzidos = { feriados: [], sabados: 0, domingos: 0, outros: [] };

			let data1Zerada = moment(dataInicial).utcOffset(0).startOf("day").toDate();
			let data2Zerada = moment(dataFinal).utcOffset(0).startOf("day").toDate();

			let difTempoMS = dataFinal - dataInicial;
			let indiceDia1 = (moment(dataInicial).utcOffset(0).isoWeekday());
			let diferencaTempo = data2Zerada - data1Zerada;
			let somaPrimeiroDia = 0; //(perAux == 1 ? 0 : 1)
			let difDiasBruto = parseInt(diferencaTempo / 86400000) + somaPrimeiroDia; // (perAux>1 ? 1 : 0 )  
			let diffDias = 0;
			let unidResp = {};
			switch (interacaoAtual.idTipoInteracao) {
			case 6: //Reclassificacao
				unidResp = await assinaturaUnidadeUsuario(usuario);
				break;
			case 10: //Resposta
				unidResp = await assinaturaUnidadeUsuario(usuario);
				break;
			}

			let feriados = await mongo.aggregate("atende", "feriadosLocais", [
				{
					$match: {
						dataFeriado: { $gte: data1Zerada, $lte: data2Zerada },
						$or: [{ municipio: unidResp.unidade }, { $and: [{ municipio: 0 }, { uf: unidResp.uf }] }, { $and: [{ municipio: 0 }, { uf: "BR" }] }]
					}
				}]);
			//feriados = feriados//.filter(e=> [6,7].indexOf(moment(e.dataFeriado).utcOffset(0).isoWeekday())==-1 )
			//  .filter(e => moment(e.dataFeriado).utcOffset(0).startOf('day').valueOf() !=
			//    moment(dataInicialAlfa).utcOffset(0).startOf('day').valueOf())
			//  .map(x => x.dataFeriado)
			tempoDiasDeduzidos.feriados = //feriados
        feriados.map(e => {
        	return {
        		data: e.dataFeriado,
        		dia: moment(e.dataFeriado).utcOffset(0).isoWeekday()
        	};
        });

			feriados = feriados.map(x => x.dataFeriado);

			feriados = feriados.filter((elem, pos, arr) => {
				return arr.indexOf(elem) == pos;
			});//.map(c=>{return {data:c,obs:'F'}})  

			let feriadosAux = feriados.map(e => moment(e).utcOffset(0).startOf("day").valueOf());

			let data1Aux = moment(data1Zerada).utcOffset(0).toDate();

			let dataDiaAnterior = moment(data1Aux).utcOffset(0).subtract(1, "day").toDate();
			while
			((moment(data1Aux).utcOffset(0).startOf("day").valueOf() <=
          moment(data2Zerada).utcOffset(0).startOf("day").valueOf())
			) {

				data1Aux = moment(data1Aux).utcOffset(0).add(1, "days").toDate();

				dataDiaAnterior = moment(data1Aux).utcOffset(0).subtract(1, "day").toDate();
				//console.log(dataDiaAnterior, data1Aux)

				let diaMax = (moment(dataDiaAnterior).utcOffset(0).startOf("day").valueOf() <
          moment(data2Zerada).utcOffset(0).startOf("day").valueOf()) ? false : true;

				indiceDiaAnterior = moment(dataDiaAnterior).utcOffset(0).isoWeekday();
				ehFeriado = (feriadosAux.indexOf(moment(dataDiaAnterior).utcOffset(0).valueOf()) > -1) ? true : false;
				ehFimSemana = [6, 7].indexOf(indiceDiaAnterior) > -1 ? true : false;
				if (!(ehFimSemana || ehFeriado) && !diaMax) {

					//  console.log('dia util ', dataDiaAnterior,
					//  indiceDiaAnterior, ehFeriado, ehFimSemana)
					diffDias++;
				}

			}

			retorno.push({
				ano: ano, mes: mes, idInteracaoAnterior: ultimaInteracao._id, ok: true, tempoMs: difTempoMS,
				tempoDias: diffDias, unidade: unidResp, dataInicial, dataFinal,
				feriados: tempoDiasDeduzidos.feriados,
				//sabados: tempoDiasDeduzidos.sabados,
				// domingos: tempoDiasDeduzidos.domingos,
				// somaPrimeiroDia
			});
		}
		retorno = retorno || null;
		return retorno;

	} catch (erro) {
		throw erro;
	}
};
const calculaflagsInteracaoOLDxxxx = async (idSolicitacao, agora, usuario) => {

	try {
		let demanda = await mongo.findOne("atende", "demandas", { id: parseInt(idSolicitacao) });
		if (!demanda) {
			console.log(idSolicitacao, " não encontrado");
			return;
		}

		let interacaoAnterior = {};
		let idInteracao;
		for (const i of demanda.interacoes) {
			// console.log(i._id,i.nomeTipoInteracao)
			idInteracao = i._id;
			if ([1, 3, 5, 11].indexOf(i.idTipoInteracao) == -1) {
				//   console.log('passou',interacaoAnterior.nomeTipoInteracao,i.nomeTipoInteracao)
				//let r = await  calculaflagsInteracao2(interacaoAnterior,i)                                    

				let ultimaInteracao = interacaoAnterior;//demanda.interacoes.filter(e=> {return [3,11].indexOf(e.idTipoInteracao)==-1 }).slice(-1)[0]          
				let dataUltimaInteracao = ultimaInteracao.data;

				let periodos = [];
				let dataInicial = moment(ultimaInteracao.data).utcOffset(0).toDate();
				let dataInicialAlfa = moment(ultimaInteracao.data).utcOffset(0).toDate();
				let dataInicialAux = moment(ultimaInteracao.data).utcOffset(0).toDate();
				let dataFinal = moment(agora).utcOffset(0).toDate();
				// console.log('=========>> ',dataInicialAux,'dataInteracao ',i.data,'dataFinal ', dataFinal)

				while //(dataInicialAux <= dataFinal) {   
				(moment(dataInicialAux).utcOffset(0).startOf("month").valueOf() <=
          moment(dataFinal).utcOffset(0).startOf("month").valueOf()) {
					//console.log('dataInicialAux ',dataInicialAux,dataFinal,i._id)
					let mes = dataInicialAux.getUTCMonth() + 1;
					let ano = dataInicialAux.getUTCFullYear();
					// console.log(ano,'-',mes,dataInicialAux)                         

					if (periodos.filter(e => { return e.ano == ano && e.mes == mes; }).length == 0) {
						periodos.push({ ano, mes });
					}
					dataInicialAux = moment(dataInicialAux).utcOffset(0).add(1, "days").toDate();
					// console.log('dataInicialAux2 ',dataInicialAux,dataFinal,i._id)                                                                  
				}

				let retorno = [];
				let perAux = 0;
				for (const p of periodos) {
					perAux++;
					let mesP = p.mes - 1;
					let d = new Date(p.ano, mesP, 1);
					let tempoDiasDeduzidos = { feriados: [], sabados: 0, domingos: 0, outros: [] };
					let dtFim = moment(d).utcOffset(0).endOf("month").toDate();
					let dtIni = moment(d).utcOffset(0).startOf("month").toDate();
					let dtInicial = (dataInicial <= dtIni) ? dtIni : dataInicial;
					let dtFinal = (dataFinal <= dtFim) ? dataFinal : dtFim;

					let data1Zerada = moment(dtInicial).utcOffset(0).startOf("day").toDate();
					let data2Zerada = moment(dtFinal).utcOffset(0).startOf("day").toDate();
					// console.log(data1Zerada,' <-> ',data2Zerada )


					let idTipoInteracao = ultimaInteracao.idTipoInteracao;
					let difTempoMS = dtFinal - dtInicial;
					let indiceDia1 = (moment(dtInicial).utcOffset(0).isoWeekday());
					let diferencaTempo = data2Zerada - data1Zerada;
					let somaPrimeiroDia = (perAux == 1 ? 0 : 1);
					let difDiasBruto = parseInt(diferencaTempo / 86400000) + somaPrimeiroDia; // (perAux>1 ? 1 : 0 )  
					//if (i._id=="5d43167515c5bb20cc9ebb6f"){
					//  console.log('dtIni ', dtIni,'dtInicial ', dtInicial,'dtFim ', dtFinal, 'dtFinal ',dtFinal)
					//}

					// if (p.mes==3) console.log(dddomingos)  
					let unidResp = {};
					let userResp = {};
					switch (idTipoInteracao) {
					case 1: //Abertura
						unidResp = await assinaturaUnidadeUsuario(usuario);
						break;
					case 4: //Designacao
						unidResp = await assinaturaUnidadeUsuario(ultimaInteracao.usuario);
						break;
					case 5: //Reabertura
						unidResp = await assinaturaUnidadeUsuario(ultimaInteracao.origem.usuario);
						userResp = ultimaInteracao.origem.usuario;
						break;
					case 6: //Reclassificacao
						unidResp = await assinaturaUnidadeUsuario(ultimaInteracao.usuario);
						break;
					case 7: //Bloqueio
						unidResp = await assinaturaUnidadeUsuario(ultimaInteracao.usuario);
						userResp = ultimaInteracao.usuario;
						break;
					case 8: //desbloqueio
						unidResp = await assinaturaUnidadeUsuario(ultimaInteracao.usuario);
						break;

					}
					let sabadosAuxDeduzir = 0;
					let domingosAuxDeduzir = 0;
					//  console.log(data1Zerada,data2Zerada)
					let feriados = await mongo.aggregate("atende", "feriadosLocais", [
						{
							$match: {
								dataFeriado: { $gte: data1Zerada, $lte: data2Zerada },
								$or: [{ municipio: unidResp.unidade }, { $and: [{ municipio: 0 }, { uf: unidResp.uf }] }, { $and: [{ municipio: 0 }, { uf: "BR" }] }]
							}
						}]);
					// console.log(feriados)
					// console.log(data1Zerada)
					feriados = feriados//.filter(e=> [6,7].indexOf(moment(e.dataFeriado).utcOffset(0).isoWeekday())==-1 )
						.filter(e => moment(e.dataFeriado).utcOffset(0).startOf("day").valueOf() !=
              moment(dataInicialAlfa).utcOffset(0).startOf("day").valueOf())
						.map(x => x.dataFeriado);

					feriados = feriados.filter((elem, pos, arr) => {
						return arr.indexOf(elem) == pos;
					});//.map(c=>{return {data:c,obs:'F'}})  

					tempoDiasDeduzidos.feriados = feriados;

					let data1Aux = moment(data1Zerada).utcOffset(0).toDate();
					let sab = 0;
					let dom = 0;

					switch (indiceDia1) {
					case 6:
						sab--;
						break;
					case 7:
						dom--;
						break;
					default:
					}

					while
					(moment(data1Aux).utcOffset(0).startOf("day").valueOf() <=
            moment(data2Zerada).utcOffset(0).startOf("day").valueOf()) {
						let indice = (moment(data1Aux).utcOffset(0).isoWeekday());

						if (feriados.filter(e => [6, 7].indexOf(moment(data1Aux).utcOffset(0).isoWeekday()) == -1))
							switch (indice) {
							case 6:
								sab++;
								break;
							case 7:
								dom++;
								break;
							default:
							}

						data1Aux = moment(data1Aux).utcOffset(0).add(1, "days").toDate();
						//data1Aux = moment(data1Aux).utcOffset(0).add(1, 'days').valueOf()

						// console.log('xx ', data1Aux )
						// console.log('dataInicialAux2 ',dataInicialAux,dataFinal,i._id)                                                                  
					}
					tempoDiasDeduzidos.sabados = sab;
					tempoDiasDeduzidos.domingos = dom;
					// console.log(difDiasBruto)
					let difDias = (difDiasBruto - (sab + dom + feriados.length));
					// console.log('difDiasBruto ',difDiasBruto, 'sabados ',sabados,'domingos ', domingos,'feriados ', feriados.length)

					retorno.push({
						ano: p.ano, mes: p.mes, idInteracaoAnterior: ultimaInteracao._id, ok: true, tempoMs: difTempoMS,
						tempoDias: difDias, unidade: unidResp, usuario: userResp, dtInicial, dtFinal,
						feriados: tempoDiasDeduzidos.feriados,
						sabados: tempoDiasDeduzidos.sabados,
						domingos: tempoDiasDeduzidos.domingos,
						somaPrimeiroDia,
						_batch: agora
					});

				}
				return retorno;
			}
		}

	} catch (erro) {
		throw erro;
	}
};
const objectsEqual = (o1, o2) => {
	// delete o1.data
	// delete o2.data
	return (
		typeof o1 === "object" && Object.keys(o1).length > 0
			? Object.keys(o1).length === Object.keys(o2).length
      && Object.keys(o1).every(p => objectsEqual(o1[p], o2[p]))
			: o1 === o2);
};
const msg = (ok, data) => {
	//const retorno = ok ? { ok, data } : { ok, erro: data };
	const retorno = { ok, data };
	return retorno;
};
const getDataExpiracaoMSSQL = async (data, n) => {
	// sem uso
	data = data || newDate(new Date());
	n = isNaN(n) ? 3 : n;
	/*
  let r = await proximoDiaUtil(data,n)
  r.setUTCHours(23)
  r.setUTCMinutes(59)
  r.setUTCSeconds(59)
 
  return r
  */
	const mssql = require("../../modules/mssql");
	let query =
    "select [f].[dbo].[nWorkDay] (" +
    n +
    ",'" +
    data.getFullYear() +
    "-" +
    ("0" + (data.getMonth() + 1)).slice(-2) +
    "-" +
    data.getDate() +
    "') as data";
	let horas = 23;//data.getUTCHours() || 0
	let minutos = 59;//data.getUTCMinutes() || 0
	let segundos = 59;//data.getUTCSeconds() || 0
	return mssql.query(query).then(resposta => {
		return moment(resposta[0].data)
			.add(horas, "hours")
			.add(minutos, "minutes")
			.add(segundos, "seconds")
			.toDate();
		// return moment(resposta[0].data.slice(0,10),"America/Sao_Paulo").startOf("day").toDate();
	});
};
const getDataLimiteAvaliacao = async (cgc, data, n) => {
	data = data || newDate(new Date());
	n = isNaN(n) ? 10 : n;
	if (n == 0) { return data; }
	return await nextWorkDay(cgc, data, n).then(r => {
		//resposta.setUTCHours(22)
		//console.log(r)
		resposta = moment(r).utcOffset(0).set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toDate();
		return resposta;
	});
};
const getDataLimiteReabertura = async (cgc, data, n) => {
	data = data || newDate(new Date());
	n = isNaN(n) ? 10 : n;
	if (n == 0) { return data; }
	return await nextWorkDay(cgc, data, n).then(r => {
		//resposta.setUTCHours(22)
		resposta = moment(r).utcOffset(0).set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toDate();
		return resposta;
	});
};
const getDataLimiteReclassificacao = async (cgc, data, n) => {
	data = data || newDate(new Date());
	n = isNaN(n) ? 10 : n;
	if (n == 0) { return data; }
	return await nextWorkDay(0, data, n).then(r => {
		//resposta.setUTCHours(22)
		resposta = moment(r).utcOffset(0).set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toDate();
		return resposta;
	});
};
const getDataLimiteDemandas = async (cgc, data, n) => {
	data = data || newDate(new Date());
	n = isNaN(n) ? 10 : n;
	if (n == 0) { return data; }
	return await getPrazo(cgc, data, n).then(r => {
		//resposta.setUTCHours(22)
		resposta = moment(r).utcOffset(0).set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toDate();
		return resposta;
	});
};
const getDiasUteisEnteDatas = async (unidades, data1, data2) => {
	let diasMaior = 0;
	let diasMenor = 0;
	const ehDiaUtil = (data, feriados) => {
		let ret = (([0, 6].indexOf(moment(data).utcOffset(0).day()) == -1) &&
      !(feriados.filter(dia => {
      	return moment(dia).utcOffset(0).startOf("day")
      		.isSame(moment(data).utcOffset(0).startOf("day"));
      }).length > 0)
		);
		return ret;
	};
	for (const u of unidades) {
		let dadosUnidade = await mongo.findOne("atende", "unidades", {
			CGC: u.unidade
		});
		let feriados = await mongo.aggregate("atende", "feriadosLocais", [{
			$match: {
				dataFeriado: { $gte: data1, $lt: data2 },
				$or: [{ municipio: dadosUnidade.COD_MUN }, {
					$and: [{ municipio: 0 }, { uf: dadosUnidade.UF }]
				}, {
					$and: [{ municipio: 0 }, { uf: "BR" }]
				}]
			}
		}
		]);
		feriados = (feriados.map(e => e.dataFeriado) || []);

		let dias = 0;
		for (let d = data1; d <= data2; d.setDate(d.getDate() + 1)) {
			if (ehDiaUtil(d, feriados) == true) { dias++; }
		}
		diasMaior < dias ? diasMaior = dias : diasMaior = diasMaior;
		diasMenor > dias ? diasMenor = dias : diasMenor = diasMenor;
	}
	return diasMaior;
};
const listaCategoriasIntegracao = async (unidade) => {
	let categorias = await mongo.aggregate("atende", "categorias", [
		{ $match: { unidadeIntegracao: unidade } },
		{ $project: { _id: 1, nome: "$nome", descricao: "$descricao" } },
	]);
	return categorias;
};
const categoriaAutorizadaIntegracao = async (unidade, categoria) => {
	let categoriasAutorizadas = await listaCategoriasIntegracao(unidade);
	categoriasAutorizadas = categoriasAutorizadas.map(e => "" + e._id);
	// console.log("categopriasAutorizadas ", categoriasAutorizadas, categoria)
	let retorno = (categoriasAutorizadas.filter(e => "" + e == "" + categoria).length > 0) ? true : false;
	return retorno;
};
const matriculaStr = (prefixo, matricula) => {
	try {
		//console.log('matriculaStr', prefixo)
		prefixo ? p = prefixo.toUpperCase() : p = "C";
		return p + ((matricula.toString().padStart(6, "0"))); //.substring(0, 6)
	} catch (error) {
		throw error;
	}
};

const podeReclassificar = (arr, usr) => {

	const unidades = ((arr || [])
		.map(e => e.UNIDADE || [])
		.reduce((x, y) => { return (x || []).concat((y || [])); })
		.filter(e => e != undefined))
		.indexOf(usr.unidade) > -1;

	const siglaUnidade =
    ((arr || [])
    	.map(e => e.SIGLA_UNIDADE || [])
    //.map((x, i, a) => (a[i] || [0])[0])
    	.reduce((x, y) => { return (x || []).concat((y || [])); })
    	.filter(e => e))
    	.indexOf(usr.siglaUnidade) > -1;

	const tipoUnidade =
    ((arr || [])
    	.map(e => e.TIPO_UNIDADE || [])
    	.reduce((x, y) => { return (x || []).concat((y || [])); })
    	.filter(e => e))
    	.indexOf(usr.tipoUnidade) > -1;

	const todas =
    ((arr || [])
    	.map(e => e.TODAS || false))[0];


	//console.log('teste foi', unidades, siglaUnidade, tipoUnidade)  

	return (unidades || tipoUnidade || siglaUnidade || todas);
};
const getNextSequence = async (colecao) => {
	let nxt = await mongo.findAndModify("atende", "contadores",
		{ colecao: colecao },
		{ $inc: { valor: 1 } });
	return nxt.value.valor;
};

const matriculaStrValida = (matriculaStr) => {

	const pattern = /^[a-zA-Z]\d{6}$/;
	const regex = new RegExp(pattern);
	return regex.test(matriculaStr);

};
const tiraTagsHTML = (str) => {
	if (typeof str === "string") {
		return str.replace(/<.*?>/g, " ");
	} else { return str; }
};

module.exports = {
	pegaTags,
	getParentsCategoria,
	getUnidadesAtendentes,
	getDataExpiracao,
	getIdSolicitacao,
	situacaoHist,
	calculaflagsInteracao,
	gravaCatMaisUsada,
	arraysEqual,
	objectsEqual,
	calculaPrazoConquiste,
	msg,
	getDataLimiteAvaliacao,
	getDataLimiteReabertura,
	getDataLimiteReclassificacao,
	getDataLimiteDemandas,
	getDiasUteisEnteDatas,
	listaCategoriasIntegracao,
	categoriaAutorizadaIntegracao,
	matriculaStr,
	podeReclassificar,
	getNextSequence,
	matriculaStrValida,
	tiraTagsHTML
};

