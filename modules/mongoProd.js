/* eslint-disable no-useless-catch */
/* eslint-disable no-unreachable */
/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-undef */
const isArray = require("./isArray");
const isObject = require("./isObject");
let MongoClient = require("mongodb").MongoClient;
//Server = require("mongodb").Server;
//require('dotenv').config({ path: __dirname + '/./../../.env' })

const url = process.env.MONGO_URL_152;
console.log("process.env.MONGO_URL_152",process.env.MONGO_URL_152);

const options = {
	//bufferMaxEntries: 2,
	keepAlive: true,
	connectTimeoutMS: 300000,
	//maxIdleTimeMS:
	auto_reconnect: true,
	poolSize: 500, 
	useUnifiedTopology: true,
	//useNewUrlParser: true
	socketTimeoutMS: 300000,
	//reconnectTries: Number.MAX_VALUE // Deprecated
	//reconnectInterval: 1000
};

const db = (() => {
	// utils
	let self = this;

	GLOBAL_DB = null;

	self.isConnected = () => {
		return (
			!!GLOBAL_DB && !!GLOBAL_DB.topology && GLOBAL_DB.topology.isConnected()
		);
	};

	self.connect = async () => {
		return new Promise(async (resolve, reject) => {
			//let ff = await MongoClient.connect("mongodb://localhost:27017/atende");
			//console.log('ff',ff.topology.isConnected())
			let dd = await MongoClient.connect(url, options, async (err, db) => {
				if (err) {
					reject(err);
					self.throwErr(err);
				}

				GLOBAL_DB = db;
				GLOBAL_DB_ATENDE = await db.db("atende");
				resolve(); //dbo);
			});
		});

	};

	self.throwErr = (err) => {
		console.log("e", err.code, err.errmsg);
		throw err;
	};

	self.connectDb = async () => {
		try {
			//const db = await mongo.open("atende");

			//const db = await self.open("atende");

			//if (!db)
			// resp.send({erro: "Erro de conexão com o banco de dados"})
			//throw "Erro de conexão com o banco de dados";
			return "atende"; //db;
			//}
		} catch (e) {
			console.log("erro ao conectar", e);
			throw e;
		}
	};

	self.closeDb = (db) => {
		try {
			// if (db) db.db.close();
		} catch (error) {
			console.log(error);
		}
	};

	self.infos = (database, collection) => {
		try {
			return new Promise(async (resolve, reject) => {
				//const dbase = GLOBAL_DB_ATENDE.s.databaseName==database ? GLOBAL_DB_ATENDE : await GLOBAL_DB.db(database)
				await GLOBAL_DB.admin();
				let opt = await GLOBAL_DB.admin().serverStatus({ name: collection });
				resolve(opt[0].options.validator.$jsonSchema);
			});
		} catch (e) {
			throw e;
		}
	};

	self.findOne = (database, collection, where, options) => {
		try {
			if (!options) options = {};
			return new Promise(async (resolve, reject) => {
				try {
					//database.dbo
					//dbo
					const dbase = GLOBAL_DB;
					/*
            GLOBAL_DB_ATENDE.s.databaseName == database
              ? GLOBAL_DB_ATENDE
              : await GLOBAL_DB.db(database); */
					dbase
					//GLOBAL_DB_ATENDE
						.db(database)
						.collection(collection)
						.findOne(where, options, (err, data) => {
							if (err) reject(err);
							resolve(data);
						});
				} catch (e) {
					throw e;
				}
			});
		} catch (e) {
			throw e;
		}
	};

	self.findById = (database, collection, id) => {
		try {
			const ObjectId = require("mongodb").ObjectId;
			return new Promise((resolve, reject) => {
				try {
					//database.dbo
					// const dbase = GLOBAL_DB_ATENDE.s.databaseName==database ? GLOBAL_DB_ATENDE : GLOBAL_DB.db(database)
					//dbase
					GLOBAL_DB_ATENDE.collection(collection).findOne(
						{ _id: ObjectId(id) },
						function (err, data) {
							if (err) reject(err);
							resolve(data);
						}
					);
				} catch (e) {
					throw e.toString();
				}
			});
		} catch (e) {
			throw e.toString();
		}
	};

	self.find2 = async (
		database,
		collection,
		where = {},
		limit = {},
		sort = {}
	) => {
		return new Promise(async (resolve, reject) => {
			const result = await database.dbo.collection(collection).find(where); //.toArray();
			console.log(result);
			//result.toArray(function(err, data) {
			//if (err) self.throwErr(err);
			resolve(result);
			// });
			console.log("fim");
		});
	};

	self.find = (
		database,
		collection,
		where = {},
		limit = {},
		sort = {},
		fields = {}
	) => {
		try {
			return new Promise(async (resolve, reject) => {
				try {
					const dbase =
            GLOBAL_DB_ATENDE.s.databaseName == database	? GLOBAL_DB_ATENDE 	: await GLOBAL_DB.db(database);
					const result = //database.dbo.
            //GLOBAL_DB_ATENDE.
            dbase.collection(collection).find(where, fields);
					const countQuery = result;
					countQuery.count(function (err, count) {
						if (sort.length) {
							for (var i in sort) {
								item = sort[i];
								if (item.field && item.direction) {
									result.sort([item.field, item.direction == "desc" ? -1 : 1]);
								}
							}
						}
						if (limit.page && limit.items) {
							result.skip((limit.page - 1) * limit.items).limit(limit.items);
						}
						result.toArray(function (err, data) {
							if (err) reject(err);
							resolve({ count: count, data: data });
						});
					});
				} catch (e) {
					throw e.toString();
				}
			});
		} catch (e) {
			throw e.toString();
		}
	};

	//   delete

	self.deleteOne = (database, collection, where) => {
		try {
			if (!isObject(where)) {
				self.throwErr("Where deve ser um Objeto");
			}
			if (!Object.keys(where).length) {
				self.throwErr("Delete sem where não permitido");
			}
			return new Promise((resolve, reject) => {
				try {
					//database.dbo.
					//const dbase = GLOBAL_DB_ATENDE.s.databaseName==database ? GLOBAL_DB_ATENDE : GLOBAL_DB.db(database)
					//dbase
					GLOBAL_DB_ATENDE.collection(collection).deleteOne(
						where,
						(err, data) => {
							if (err) reject(err);
							resolve(data);
						}
					);
				} catch (e) {
					throw e.toString();
				}
			});
		} catch (e) {
			throw e.toString();
		}
	};

	self.deleteById = (database, collection, id) => {
		try {
			const ObjectId = require("mongodb").ObjectId;
			return new Promise((resolve, reject) => {
				try {
					//database.dbo
					//const dbase = GLOBAL_DB_ATENDE.s.databaseName==database ? GLOBAL_DB_ATENDE : GLOBAL_DB.db(database)
					// dbase
					GLOBAL_DB_ATENDE.collection(collection).deleteOne(
						{ _id: ObjectId(id) },
						(err, data) => {
							if (err) reject(err);
							resolve(data);
						}
					);
				} catch (e) {
					throw e.toString();
				}
			});
		} catch (e) {
			throw e.toString();
		}
	};

	self.delete = (database, collection, where) => {
		try {
			return new Promise((resolve, reject) => {
				try {
					//database.dbo
					//const dbase = GLOBAL_DB_ATENDE.s.databaseName==database ? GLOBAL_DB_ATENDE : GLOBAL_DB.db(database)
					// dbase
					GLOBAL_DB_ATENDE.collection(collection).deleteMany(
						where,
						(err, data) => {
							if (err) reject(err);
							resolve(data);
						}
					);
				} catch (e) {
					throw e.toString();
				}
			});
		} catch (e) {
			throw e.toString();
		}
	};

	//   insert

	self.insertMany = (database, collection, data) => {
		try {
			if (!isArray(data)) {
				self.throwErr("Dados enviados no POST deve ser Array");
			}
			if (Object.keys(data).length == 0) {
				self.throwErr("Dados vazios");
			}
			const insertData = [];

			for (var i in data) {
				const item = data[i];
				if (isObject(item) && Object.keys(item).length) insertData.push(item);
			}

			return new Promise((resolve, reject) => {
				try {
					//database.dbo
					//const dbase = GLOBAL_DB_ATENDE.s.databaseName==database ? GLOBAL_DB_ATENDE : GLOBAL_DB.db(database)
					// dbase
					GLOBAL_DB_ATENDE.collection(collection).insertMany(
						insertData,
						(err, data) => {
							if (err) reject(err);
							// self.closeDb();
							resolve(data);
						}
					);
				} catch (e) {
					throw e.toString();
				}
			});
		} catch (e) {
			throw e.toString();
		}
	};

	self.insertOne = (database, collection, data) => {
		try {
			if (!isObject(data)) {
				self.throwErr("Dados enviados no POST deve ser Objeto");
			}
			if (Object.keys(data).length == 0) {
				self.throwErr("Dados vazios");
			}

			return new Promise((resolve, reject) => {
				try {
					//database.dbo.
					// const dbase = GLOBAL_DB_ATENDE.s.databaseName==database ? GLOBAL_DB_ATENDE : GLOBAL_DB.db(database)
					// dbase
					GLOBAL_DB_ATENDE.collection(collection).insertOne(
						data,
						{ w: 1, j: true },
						(err, result) => {
							if (err) reject(err); //self.throwErr(err);
							resolve(result);
						}
					);
				} catch (e) {
					throw e.toString();
				}
			});
		} catch (e) {
			throw e.toString();
		}
	};

	// update

	self.findAndModify = (database, collection, where, set, sort, opt) => {
		try {
			if (!isObject(where)) {
				self.throwErr("Where deve ser um objeto");
			}
			if (!Object.keys(where).length) {
				self.throwErr("Update sem where não permitido");
			}
			if (!isObject(set)) {
				self.throwErr("Set deve ser um objeto");
			}
			if (!Object.keys(set).length) {
				self.throwErr("Set não informado");
			}
			let optx = opt || {}.new ? opt : Object.assign({}, opt, { new: true });
			return new Promise((resolve, reject) => {
				try {
					//database.dbo
					//const dbase = GLOBAL_DB_ATENDE.s.databaseName==database ? GLOBAL_DB_ATENDE : GLOBAL_DB.db(database)
					//dbase
					GLOBAL_DB
						.db(database)
						.collection(collection)
						.findAndModify(
							where, sort || {},
							set, optx,
							// { upsert: true }, // adcionar o new: true pra retornar os dados modificados
							(err, data) => {
								if (err) reject(err);
								resolve(data);
							}
						);
				} catch (e) {
					throw e.toString();
				}
			});
		} catch (e) {
			throw e.toString();
		}
	};

	self.updateOne = (database, collection, where, set, arrayFilters = {}, unset = {}, push = {}) => {
		try {
			if (!isObject(where)) {
				self.throwErr("Where deve ser um objeto");
			}
			if (!Object.keys(where).length) {
				self.throwErr("Update sem where não permitido");
			}
			if (!isObject(set)) {
				self.throwErr("Set deve ser um objeto");
			}
			if (!Object.keys(set).length) {
				self.throwErr("Set não informado");
			}
			let Aset = {};
			Aset = Object.keys(set).length
				? Object.assign(Aset, { $set: set })
				: Aset;

			Aset = Object.keys(push).length
				? Object.assign(Aset, { $push: push })
				: Aset;

			Aset = Object.keys(unset).length
				? Object.assign(Aset, { $unset: unset })
				: Aset;
			// Aset =  (Object.keys(arrayFilters).length) ? Object.assign(Aset,{arrayFilters } ) : Aset// já estava implementado esse SET fixo, o que limita um pouco.. adicionei o OPT
			// console.log(Aset)

			return new Promise((resolve, reject) => {
				try {
					//database.dbo
					//const dbase = GLOBAL_DB_ATENDE.s.databaseName==database ? GLOBAL_DB_ATENDE : GLOBAL_DB.db(database)
					//dbase
					GLOBAL_DB
						.db(database).collection(collection).updateOne(
							where,
							Aset,
							arrayFilters,
							(err, data) => {
								if (err) reject(err);
								self.findOne(database, collection, where).then((data) => {
									resolve(data);
								});
							}
						);
				} catch (e) {
					throw e.toString();
				}
			});
		} catch (e) {
			throw e.toString();
		}
	};

	self.upsertOne = (
		database,
		collection,
		where,
		set = {},
		push = {},
		addToSet = {},
		pull = {}
	) => {
		try {
			if (!isObject(where)) {
				self.throwErr("Where deve ser um objeto");
			}
			if (!Object.keys(where).length) {
				self.throwErr("Update sem where não permitido");
			}
			if (!isObject(set)) {
				self.throwErr("Set deve ser um objeto");
			}
			//if (!Object.keys(set).length) {
			//  self.throwErr("Set não informado");
			//}
			let Aset = {};
			Aset = Object.keys(set).length
				? Object.assign(Aset, { $set: set })
				: Aset;
			Aset = Object.keys(push).length
				? Object.assign(Aset, { $push: push })
				: Aset;
			Aset = Object.keys(addToSet).length
				? Object.assign(Aset, { $addToSet: addToSet })
				: Aset;
			Aset = Object.keys(pull).length
				? Object.assign(Aset, { $pull: pull })
				: Aset;
			return new Promise((resolve, reject) => {
				try {
					//database.dbo
					//const dbase = GLOBAL_DB_ATENDE.s.databaseName==database ? GLOBAL_DB_ATENDE : GLOBAL_DB.db(database)
					//dbase
					GLOBAL_DB
						.db(database).collection(collection).updateOne(
							where,
							Aset,
							{ upsert: true },
							(err, data) => {
								if (err) reject(err);
								self.findOne(database, collection, where).then((data) => {
									resolve(data);
								});
							}
						);
				} catch (e) {
					throw e.toString();
				}
			});
		} catch (e) {
			throw e.toString();
		}
	};

	self.updateMany = (database, collection, where, set, push = {}) => {
		try {
			if (!isObject(where)) {
				self.throwErr("Where deve ser um objeto");
			}
			if (!Object.keys(where).length) {
				self.throwErr("Update sem where não permitido");
			}
			if (!isObject(set)) {
				self.throwErr("Data deve ser um objeto");
			}
			if (!Object.keys(set).length) {
				self.throwErr("Data não informado");
			}

			let Aset = {};
			Aset = Object.keys(set).length
				? Object.assign(Aset, { $set: set })
				: Aset;

			Aset = Object.keys(push).length
				? Object.assign(Aset, { $push: push })
				: Aset;

			return new Promise((resolve, reject) => {
				try {
					//database.dbo
					//const dbase = GLOBAL_DB_ATENDE.s.databaseName==database ? GLOBAL_DB_ATENDE : GLOBAL_DB.db(database)
					//dbase
					GLOBAL_DB_ATENDE.collection(collection).updateMany(
						where,
						Aset,
						(err, data) => {
							if (err) reject(err);
							// self.closeDb();
							resolve(data);
						}
					);
				} catch (e) {
					throw e.toString();
				}
			});
		} catch (e) {
			throw e.toString();
		}
	};

	self.updateById = (database, collection, id, set) => {
		try {
			const ObjectId = require("mongodb").ObjectId;
			if (!id) {
				self.throwErr("ID não informado");
			}
			if (!isObject(set)) {
				self.throwErr("Set deve ser um objeto");
			}
			if (!Object.keys(set).length) {
				self.throwErr("Set não informado");
			}
			return new Promise((resolve, reject) => {
				try {
					//database.dbo
					// const dbase = GLOBAL_DB_ATENDE.s.databaseName==database ? GLOBAL_DB_ATENDE : GLOBAL_DB.db(database)
					//dbase
					GLOBAL_DB_ATENDE.collection(collection).updateOne(
						{ _id: ObjectId(id) },
						{ $set: set },
						(err, data) => {
							if (err) reject(err);
							self.findById(database, collection, id).then((data) => {
								resolve(data);
							});
						}
					);
				} catch (e) {
					throw e.toString();
				}
			});
		} catch (e) {
			throw e.toString();
		}
	};

	// grouping

	self.aggregate = (database, collection, params) => {
		try {
			//console.log("  agreggate --  ",GLOBAL_DB)
			if (!isArray(params)) throw "Params deve ser um array de objetos json";
			return new Promise((resolve, reject) => {
				try {
					//database.dbo
					//const dbase = GLOBAL_DB_ATENDE.s.databaseName==database ? GLOBAL_DB_ATENDE : GLOBAL_DB.db(database)
					//dbase
					GLOBAL_DB_ATENDE.collection(collection)
						.aggregate(params)
						.toArray((err, data) => {
							if (err) reject(err);
							resolve(data);
						});
				} catch (y) {
					throw y; //.toString();
				}
			});
		} catch (e) {
			throw e; //.toString();
		}
	};

	self.distinct = (database, collection, field, where) => {
		try {
			if (typeof field != "string") throw "Field deve ser uma string";
			return new Promise((resolve, reject) => {
				try {
					//database.dbo.
					//const dbase = GLOBAL_DB_ATENDE.s.databaseName==database ? GLOBAL_DB_ATENDE : GLOBAL_DB.db(database)
					//dbase
					GLOBAL_DB_ATENDE.collection(collection).distinct(
						field,
						where,
						(err, data) => {
							if (err) reject(err);
							// self.closeDb();
							resolve(data);
						}
					);
				} catch (e) {
					throw e.toString();
				}
			});
		} catch (e) {
			throw e.toString();
		}
	};

	self.count = (database, collection, where) => {
		try {
			where = where || {};
			if (!isObject(where))
				self.throwErr("Where deve ser um objeto json válido");
			return new Promise((resolve, reject) => {
				try {
					//database.dbo
					//const dbase = GLOBAL_DB_ATENDE.s.databaseName==database ? GLOBAL_DB_ATENDE : GLOBAL_DB.db(database)
					//dbase
					GLOBAL_DB_ATENDE.collection(collection).count(where, (err, data) => {
						if (err) reject(err);
						// self.closeDb();
						resolve({ count: data });
					});
				} catch (e) {
					throw e.toString();
				}
			});
		} catch (e) {
			throw e.toString();
		}
	};


	return this;
})();

module.exports = db;
