const puppeteer = require('puppeteer');
const axios = require('axios');
const megasenaCtrl = require('./DB/mongo/controllers/megasena');
// eslint-disable-next-line no-unused-vars
const tools = require('./tools');

const debugMode = false;
const config = {
  // executablePath: '/usr/bin/chromium-browser',
  executablePath: '/usr/bin/chromium',
  headless: false, // true
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
};
const pegaQuantidade = (t, iniciaEm) => {
  let res = null;
  let c = 0;
  // eslint-disable-next-line no-restricted-globals
  while (!isNaN(t.substring(iniciaEm, iniciaEm + c))) {
    res = t.substring(iniciaEm, iniciaEm + c);
    // console.log(c, iniciaEm, iniciaEm + c, 'res', res);
    c++;
  }
  return res.trim();
};

const usarScrap = async (concurso_ = null) => {
  let c = 0;

  const browser = await puppeteer.launch(config);
  const [page] = await browser.pages();
  await page.goto('https://loterias.caixa.gov.br/Paginas/Mega-Sena.aspx');
  // const textSelector = await page.$$('.resultado-loteria');
  await tools.delay(0.1);
  let text = null;
  let concurso = null;
  text = await page.$eval(
    '#wp_resultados > div.content-section.section-text.with-box.no-margin-bottom > div > h2 > span',
    (el) => el.textContent.trim(),
  );
  concurso = parseInt(text.substring(9, 13).trim());
  if (concurso_) {
    // await page.type('#buscaConcurso', concurso_);
    while (concurso != concurso_) {
      console.log('buscando ... ', concurso, concurso_);
      await page.click('#wp_resultados > div.content-section.section-text.with-box.no-margin-bottom > div > div.nav-results > ul > li:nth-child(2) > a');
      await tools.delay(2);
      text = await page.$eval(
        '#wp_resultados > div.content-section.section-text.with-box.no-margin-bottom > div > h2 > span',
        (el) => el.textContent.trim(),
      );
      concurso = parseInt(text.substring(9, 13).trim());
    }
  }
  const data = text.substring(15, 25);

  let acumulou = false;
  const acumulouSel = await page.$$('[ng-show="resultado.acumulado"]');
  for (const sel of acumulouSel) {
    const t = await sel?.evaluate((el) => el.textContent);
    acumulou = t.trim() === 'Acumulou!';
  }

  let local = 1;
  const localSel = await page.$$('#wp_resultados > div.content-section.section-text.with-box.column-left.no-margin-top > div > div > p');
  c = 0;
  for (const sel of localSel) {
    const t = await sel?.evaluate((el) => el.textContent);
    local = t.trim().substring(21, 60).trim();
  }

  const dezenas = [];
  const dezenasSel = await page.$$('#ulDezenas');
  c = 0;
  for (const sel of dezenasSel) {
    let t = await sel?.evaluate((el) => el.textContent);
    t = t.trim();
    dezenas.push(t.substring(0, 2));
    dezenas.push(t.substring(2, 4));
    dezenas.push(t.substring(4, 6));
    dezenas.push(t.substring(6, 8));
    dezenas.push(t.substring(8, 10));
    dezenas.push(t.substring(10, 12));
  }

  const premiacoes = [];
  const premiacaoSel = await page.$$('#wp_resultados > div.content-section.section-text.with-box.column-right.no-margin-top > div > p');
  c = 0;
  for (const sel of premiacaoSel) {
    let t = await sel?.evaluate((el) => el.textContent);
    t = t.trim();
    let acertos;
    if (c === 0 || c === 1 || c === 2) {
      switch (c) {
        case 0:
          acertos = 'Sena';
          break;
        case 1:
          acertos = 'Quina';
          break;
        case 2:
          acertos = 'Quadra';
          break;
        default:
          break;
      }
      const vencedores = Number(pegaQuantidade(t, 34).replace('.', ''));
      let premio = t.substring(t.indexOf('R$') + 3, t.indexOf('R$') + 25).replace('\n', '').trim();
      if (premio === '0,00') { premio = '-'; }
      premiacoes.push({ acertos, vencedores, premio });
    }
    c++;
  }

  let acumuladaProxConcurso = null;
  const acumuladaProxConcursoSel = await page.$$('#wp_resultados > div.content-section.section-text.with-box.column-left.no-margin-top > div > div > div.next-prize.clearfix > p.value.ng-binding');
  c = 0;
  for (const sel of acumuladaProxConcursoSel) {
    const t = await sel?.evaluate((el) => el.textContent);
    acumuladaProxConcurso = t.trim();
  }

  let dataProxConcurso = null;
  const dataProxConcursoSel = await page.$$('#wp_resultados > div.content-section.section-text.with-box.column-left.no-margin-top > div > div > div.next-prize.clearfix > p:nth-child(1)');
  c = 0;
  for (const sel of dataProxConcursoSel) {
    const t = await sel?.evaluate((el) => el.textContent);
    dataProxConcurso = t.trim().substring(41, 52);
  }

  const req = {
    concurso,
    data,
    local,
    dezenas,
    premiacoes,
    estadosPremiados: [],
    acumulou,
    acumuladaProxConcurso,
    dataProxConcurso,
    proxConcurso: concurso + 1,
    timeCoracao: null,
    mesSorte: null,
  };

  // await page.waitForNavigation();
  // console.log('req', req);
  await browser.close();
  // return true;
  const res = await megasenaCtrl.upSert(req);
  // debugMode ? console.log('res', res) : true;
  return res;
};

const primeiraCarga = async () => {
  const url = 'https://loteriascaixa-api.herokuapp.com/api/mega-sena/';
  const concursoAtual = 2617;
  for (let n = 1; n <= concursoAtual; n++) {
    const header = {
      method: 'get',
      url: url + n,
    };
    const response = await axios(header);
    const { data } = response;
    debugMode ? console.log('data', data.data) : true;
    await megasenaCtrl.upSert(data);
  }
  return true;
};
const prcouraBuraco = async () => {
  const NaoExistem = [2796];
  const data = await megasenaCtrl.prcouraBuraco();
  if (data) {
    let concursoEsperado = data[0].concurso;
    for (const d of data) {
      const concursoAtual = d.concurso;
      // console.log('concursoAtual', concursoAtual, 'concursoEsperado', concursoEsperado);
      if (concursoAtual != concursoEsperado && !NaoExistem.includes(concursoEsperado)) {
        await usarScrap(concursoEsperado);
      }
      concursoEsperado -= 1;
      while (NaoExistem.includes(concursoEsperado)) {
        concursoEsperado -= 1;
      }
    }
  }
};

/*
const usarAPI = async (debugMode = false) => {
  const url = 'https://loteriascaixa-api.herokuapp.com/api/mega-sena/latest/';
  const header = {
    method: 'get',
    url,
  };
  const response = await axios(header);
  const { data } = response;
  debugMode ? console.log('data', data) : true;
  const res = await megasenaCtrl.upSert(data);
  return res;
};
*/
const capturarMegaSena = async () => {
//  usarAPI(debugMode);
  await usarScrap();
  await prcouraBuraco();
};

module.exports = { capturarMegaSena, primeiraCarga };
