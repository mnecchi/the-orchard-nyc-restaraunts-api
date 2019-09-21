const mysql = require('mysql');

const pool = mysql.createPool(process.env.JAWSDB_MARIA_URL);

const getMysqlConnection = () => new Promise((resolve, reject) => {
  pool.getConnection((err, connection) => {
    if (err) {
      reject(err);
      return;
    }

    resolve(connection);
  })
});

const getQuery = ({ cuisine, minGrade, offset, limit }) => `SELECT restaurant_id, dba, boro, grade FROM restaurant
  INNER JOIN inspection ON restaurant.camis=inspection.camis AND restaurant.last_inspection_date=inspection.inspection_date
  WHERE restaurant.cuisine='${cuisine}' AND inspection.grade IN ('A', 'B', 'C', 'D', 'E', 'F') AND inspection.grade<='${minGrade}'
  LIMIT ${offset || 0},${limit || 999}`;

const queryRestaurants = options => new Promise((resolve, reject) => {
  getMysqlConnection()
    .then(connection => {
      connection.query(getQuery(options), (err, rows) => {
        connection.release();

        if (err) {
          reject(err);
          return;
        };

        resolve(rows);
      });
    })
    .catch(err => {
      reject(err);
    });
});

module.exports = { queryRestaurants };
