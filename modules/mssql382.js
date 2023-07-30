const mssql = require("mssql");
const _ = require("lodash");

const db = (() => {
	let self = this;

	let instance = null;

	self.connect = database => {
		const config = {
			server: "DF7436SR382", //"DF7436SR382",
			database: database, // DB5402_ATENDE
			user: "s540201",
			password: "cl4V1cul4",
			port: 1433, 
			connectionTimeout: 60000,
			"dialectOptions": {
				"requestTimeout": 1200000
			},
		};
		return new mssql
			.ConnectionPool(config)
			.connect()
			.then(pool => {
				self.instance = pool;
				return true;
			});
	};

	self.disconnect = () => {
		return instance.disconnect();

	};

	self.query = query => {
		// eslint-disable-next-line no-unused-vars
		return new Promise((resolve, reject) => {
			if (!query) resolve([]);
			self.connect().then(() => {
				let request = self.instance.request();
				request.query(query, (err, result) => {
					resolve(
						err ? err.originalError.message : result.recordset
						// err ?  err.originalError.info.message : result.recordset
					);
				});
			});

		});
	};

	self.query2 = query => {
		// eslint-disable-next-line no-unused-vars
		return new Promise((resolve, reject) => {
			if (!query) resolve([]);
			//  self.connect().then(data => {
			//console.log('self.instance',self.instance)
			let request = self.instance.request();
			request.query(query, (err, result) => {
				resolve(
					err ? err.originalError.message : result.recordset
					// err ?  err.originalError.info.message : result.recordset
				);
			});
		});

		// })
	};

	const isInt = n => {
		return n % 1 === 0;
	};
	self.execute = (procedure, params) => {
		// eslint-disable-next-line no-unused-vars
		return new Promise((resolve, reject) => {
			self.connect().then(() => {
				let request = self.instance.request();
				let tipo = null;
				_.each(params, (v, k) => {
					switch (typeof v) {
					case "string":
						tipo = mssql.NVarChar(v.length);
						break;
					case "number":
						tipo = isInt(v) ? mssql.BigInt : mssql.Float;
						break;
					case "boolean":
						tipo = mssql.Bit;
						break;
					case "object":
						if (v instanceof Date) tipo = mssql.DateTime;
						break;
					}
					if (tipo)
						request.input(k, tipo, v);
				});
				request.execute(procedure, (err, result) => {
					resolve(err || result.recordset);
				});
			});
		});
	};

	return this;
})();

module.exports = db;
