const mssql = require("./mssql");

module.exports =  async (cgc,qtd)=> {
   
	try{     
		//let data = newDate(new Date());
		let query =
      "ATENDE.ATENDE.spEnviaEmailPendentes " +cgc + ","+qtd;

		return mssql.query(query).then(resposta => {
			return resposta;
		});
  
	} catch (error) {

		throw error;
	}finally{      

	}
};