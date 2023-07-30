const excel = (() => {
	var self = this;
	const Excel = require("exceljs");
	//const uuid = require("uuid");
	//const startCase = require("lodash/startCase");
	//const  fs = require("fs");
	const path = require("path");

	self.exportar = (res, nome,dados, colunas) => {
		//console.log('exportar')
		nome = nome || "relatorio";
		if (!Array.isArray(dados)) dados = [];
		if (!Array.isArray(colunas)) colunas = Object.keys(dados[0] || {}).map(k =>
		{ return {header: k, key: k, res:res};
		});
		//Object.keys(dados[0] || {}).map(k => startCase(k));
		try {   
			var workbook = new Excel.Workbook();
			var worksheet = workbook.addWorksheet("Plan1");        
			worksheet.columns = colunas;            
			dados.forEach(d => worksheet.addRow(d));    
			var tempFilePath;  
			if (nome.indexOf("\\") > -1) {
				tempFilePath= nome + ".xlsx"; 
				//console.log('tempFilePath',tempFilePath)
				//fs.mkdir(tempFilePath)
			} else {
				tempFilePath = path.resolve(__dirname, nome + ".xlsx" );                           
			}
            
			//var tempFilePath ="/testeBasaTeste2.xlsx"
			return workbook.xlsx.writeFile(tempFilePath).then(() => {
				//console.log('tempFilePath', tempFilePath)                
				/*
                if (res.sendFile())  {
                    res.sendFile(tempFilePath, err => {                    
                        //fs.unlinkSync(tempFilePath);
                    });                
                }
                */
			}, (err) => console.log(err));
		} catch(err) {
			console.log("OOOOOOO this is the error: " + err);
		}
    
	};

	return self;
})();
module.exports = excel;
