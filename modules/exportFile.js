const moment = require("moment-timezone");
const fs = require("fs-extra");


async function deleta (file) {
	try {
		await fs.remove(file);
		return true;
	} catch (err) {        
		console.error(err);
		return false;
	}
}
    
const geraFile = async (dados,nome,separador)=>{
	let removido = await deleta(nome); 
    
    
	let cabecalho =[];
	for (let obj of Object.keys(dados[0])){
		cabecalho.push(obj);
	}
	fs.appendFileSync(nome, cabecalho+ "\r\n"); 
    
    
	for (const t of dados){
		let arq ="";
		for (const i of Object.values(t)){
			if (i instanceof Date && !isNaN(i.valueOf())){
				arq = arq  + moment(i).utcOffset(0).format("DD/MM/YYYY HH:mm:ss") + separador;
			}else{
				arq = arq + i + separador;     
			}
			//console.log(cabecalho)
		}
     
		fs.appendFileSync(nome, arq + "\r\n"); 
	}
};

module.exports = geraFile; 