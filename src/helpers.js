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

const getWhereClause = ({ dba, boro, street, cuisine, minGrade }) => {
  const where = [];

  dba = (dba || '').trim();
  boro = (boro || '').trim();
  street = (street || '').trim();
  cuisine = (cuisine || '').trim();
  minGrade = (minGrade || '').trim();

  dba &&	where.push(`restaurant.dba LIKE '%${dba}%'`);
  boro && where.push(`restaurant.boro='${boro}'`);
  street && where.push(`restaurant.street LIKE '%${street}%'`);
  cuisine && where.push(`restaurant.cuisine='${cuisine}'`);
  minGrade && where.push(`inspection.grade<='${minGrade}'`);

  return where.length === 0 ? '1=1' : where.join(' AND ');
}

const getOrder = ({ order }) => {
  const fields = {
    dba: 'restaurant.dba',
    boro: 'restaurant.boro',
    grade: 'inspection.grade'
  };

  return fields[order] || fields.dba;
}

const getQuery = options => `SELECT restaurant_id, dba, boro, grade FROM restaurant
INNER JOIN inspection ON restaurant.camis=inspection.camis AND restaurant.last_inspection_date=inspection.inspection_date
WHERE ${getWhereClause(options)}
ORDER BY ${getOrder(options)}
LIMIT ${options.offset || 0},${options.limit || 999}`;

const getCountQuery = options => `SELECT COUNT(*) AS total_count FROM restaurant
INNER JOIN inspection ON restaurant.camis=inspection.camis AND restaurant.last_inspection_date=inspection.inspection_date
WHERE ${getWhereClause(options)}`;

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
