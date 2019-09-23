const mysql = require('mysql');
const pool = mysql.createPool(process.env.JAWSDB_MARIA_URL);

/**
 * Helper function to create a mysql connection
 *
 * @return {Promise<object>} A promise which resolves to the connection
 *
 */
const getMysqlConnection = () =>
  new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err);
      } else {
        resolve(connection);
      }
    })
  });

/**
 * Helper function which execute a sql query
 *
 * @param {object} connection - A mysql connection
 * @param {string} query - The sql query to execute
 * @return {array<object>} The resulting dataset
 *
 */
const executeQuery = (connection, query) =>
  new Promise((resolve, reject) => {
    connection.query(query, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    })
  });

/**
 * Helper function to create the WHERE clause for the query
 * to retrieve all the restaurants
 *
 * @param {object} options - The filters for the query
 * @return {string} A valid sql where clause
 *
 */
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
};

/**
 * Returns the sql field to be used for sorting
 * the query for all restaurants
 *
 * @param {string} order - The order, can be dba, boro or grade
 * @return {string} The sql field with the correct table prefix
 *
 */
const getOrder = order => {
  const fields = {
    dba: 'restaurant.dba',
    boro: 'restaurant.boro',
    grade: 'inspection.grade'
  };

  return fields[order] || fields.dba;
};

/**
 * Helper function which returns the full sql query
 * for retrieving the restaurants
 *
 * @param {object} options - filters, limiting and sorting options
 * @return {string} the sql query
 *
 */
const getQuery = options => `SELECT restaurant_id, dba, boro, grade FROM restaurant
INNER JOIN inspection ON restaurant.camis=inspection.camis AND restaurant.last_inspection_date=inspection.inspection_date
WHERE ${getWhereClause(options)}
ORDER BY ${getOrder(options.order)}
LIMIT ${options.offset || 0},${options.limit || 999}`;

/**
 * Helper function which returns the full sql query
 * for getting the total rows for the corresponding filters
 *
 * @param {object} options - filters options
 * @return {string} the sql query
 *
 */
const getCountQuery = options => `SELECT COUNT(*) AS total_count FROM restaurant
INNER JOIN inspection ON restaurant.camis=inspection.camis AND restaurant.last_inspection_date=inspection.inspection_date
WHERE ${getWhereClause(options)}`;

/**
 * Performs the query on the db and returns the results dataset and
 * the total number of rows
 *
 * @param {object} options - filters, limiting and sorting options
 * @return {object} results and total count
 *
 */
const queryRestaurants = async options => {
  let connection;
  try {
    connection = await getMysqlConnection()
    const results = await executeQuery(connection, getQuery(options));
    const totalCount = await executeQuery(connection, getCountQuery(options));

    const { total_count } = totalCount[0]
    return { results, total_count };
  } catch (err) {
    throw err;
  } finally {
    connection && connection.release();
  }
};

/**
 * Performs the query on the db and returns a single restaurant's details
 *
 * @param {interger} id - the restaurant id
 * @return {array<object>} the array should contain only one item, if found
 *
 */
const queryRestaurant = async id => {
  let connection;
  const query = `SELECT restaurant.restaurant_id, restaurant.dba, restaurant.boro, restaurant.building, restaurant.street, restaurant.zipcode, restaurant.phone, restaurant.cuisine, restaurant.last_inspection_date, inspection.grade, inspection.violation_code, IFNULL(violation.violation_description, v.violation_description) AS violation_description FROM restaurant
INNER JOIN inspection ON restaurant.camis=inspection.camis AND restaurant.last_inspection_date=inspection.inspection_date
LEFT JOIN violation ON violation.camis=restaurant.camis AND violation.violation_code=inspection.violation_code
LEFT JOIN violation v ON v.violation_code=inspection.violation_code
WHERE restaurant_id=${id} LIMIT 0,1`;

  try {
    connection = await getMysqlConnection();
    return await executeQuery(connection, query);
  } catch (err) {
    throw err;
  } finally {
    connection && connection.release();
  }
};

/**
 * Performs the query on the db and returns all the cuisines in the restaurant table
 *
 * @return {array<object>} the array of all cuisines
 *
 */
const queryCuisines = async () => {
  let connection;
  try {
    connection = await getMysqlConnection();
    return await executeQuery(connection, 'SELECT DISTINCT cuisine FROM restaurant ORDER BY cuisine');
  } catch (err) {
    throw err;
  } finally {
    connection && connection.release();
  }
};

/**
 * Helper function to send the Json response
 *
 * @param {object} res - response object
 * @param {object} json - the json response body
 *
 */
const sendJson = (res, json) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.type('json');
  res.send(JSON.stringify(json));
};

module.exports = { queryRestaurants, queryCuisines, queryRestaurant, sendJson };
