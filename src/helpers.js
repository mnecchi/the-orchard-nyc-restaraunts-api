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

const executeQuery = (connection, query) => new Promise((resolve, reject) => {
    connection.query(query, (err, results) => {
        if (err) {
            reject(err);
            return;
        }

        resolve(results);
    })
});

const getQuery = ({ cuisine, minGrade, offset, limit }) => `SELECT restaurant_id, dba, boro, grade FROM restaurant
  INNER JOIN inspection ON restaurant.camis=inspection.camis AND restaurant.last_inspection_date=inspection.inspection_date
  WHERE restaurant.cuisine='${cuisine}' AND inspection.grade IN ('A', 'B', 'C', 'D', 'E', 'F') AND inspection.grade<='${minGrade}'
  LIMIT ${offset || 0},${limit || 999}`;

const getCountQuery = ({ cuisine, minGrade }) => `SELECT COUNT(*) AS total_count FROM restaurant
INNER JOIN inspection ON restaurant.camis=inspection.camis AND restaurant.last_inspection_date=inspection.inspection_date
WHERE restaurant.cuisine='${cuisine}' AND inspection.grade IN ('A', 'B', 'C', 'D', 'E', 'F') AND inspection.grade<='${minGrade}'`;

const queryRestaurants = async options => {
  const connection = await getMysqlConnection();
  try {
    const results = await executeQuery(connection, getQuery(options));
    const totalCount = await executeQuery(connection, getCountQuery(options));
    connection.release();

    const { total_count } = totalCount[0]
    return { results, total_count };
  } catch (err) {
    connection.release();
    throw new err;
  }
}

module.exports = { queryRestaurants };
