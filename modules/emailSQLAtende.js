const mssql = require("./mssql");

module.exports =  async (tipo,matricula,id,tabela)=> {
   
	try{     
		//let data = newDate(new Date());
		let query;
		//if (tipo!=3)
		// query = "ATENDE.ATENDE.spEnviaEmail " + tipo + ","+matricula+","+id
		//else {
		query =  "ATENDE.ATENDE.spEnviaEmailPendentesUsuario " + tipo + ","+matricula+","+null+","+tabela;
		//}   

		return mssql.query(query).then(resposta => {
			return resposta;
		});
  
	} catch (error) {

		throw error;
	}finally{      

	}
};