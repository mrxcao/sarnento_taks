/* global use, db */
use('sarnento2');

// Run a find command to view items sold on April 4th, 2014.
const collection = 'megasenas';
const count = db.getCollection(collection).find({ }).count();
console.log(`${collection} count ${count}`);

db.getCollection(collection).aggregate([
  { $project: { _id: 0, concurso: 1 } },
  {
    $sort: {
      concurso: -1,
    },
  },

]);
