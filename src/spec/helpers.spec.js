const { queryRestaurants, queryCuisines, queryRestaurant, sendJson } = require('../helpers');

let mockGetConnectionError = undefined;
let mockConnection = {
  release: jest.fn(),
  query: () => {}
};

jest.mock('mysql', () => ({
  createPool: () => ({
    getConnection: cb => cb(mockGetConnectionError, mockConnection)
  })
}));

beforeEach(() => {
  jest.clearAllMocks();
});

/**
 * queryRestaurants
 */
describe('Test queryRestaurants', () => {

  let options = {};

  /**
   * The function must throw an error and close db connection
   * if no mysql db connection
   */
  it('should throw an error if there is no connection to the db', async () => {
    mockGetConnectionError = new Error('Connection Error');
    await expect(queryRestaurants(options)).rejects.toThrow(mockGetConnectionError.message);
    mockGetConnectionError = undefined;
  });

  /**
   * The function must throw an error and close db connection
   * if the restaurants query fails
   */
  it('should throw an error if the restaurants query fails', async () => {
    const queryError = new Error('Query Error');
    mockConnection.query = jest.fn()
      .mockImplementation((_, cb) => cb(queryError, []));

    await expect(queryRestaurants(options)).rejects.toThrow(queryError);
    expect(mockConnection.release).toHaveBeenCalledTimes(1);
  });

  /**
   * The function must throw an error and close db connection
   * if the total count query fails
   */
  it('should throw an error if the total count query fails', async () => {
    const queryError = new Error('Query Error');
    const results = [{ restaurant_id: 1 }, { restaurant_id: 2 }];

    mockConnection.query = jest.fn()
      .mockImplementationOnce((_, cb) => cb(undefined, results))
      .mockImplementationOnce((_, cb) => cb(queryError, {}));

    await expect(queryRestaurants(options)).rejects.toThrow(queryError);

    expect(mockConnection.release).toHaveBeenCalledTimes(1);
    expect(mockConnection.query).toHaveBeenCalledTimes(2);
  });

  /**
   * The function must resolve to the expected results (no filters)
   * with an object { results, total_count }
   * Check if the mysql queries are the expected ones and
   * the connection is closed at the end
   */
  it('should retrieve all the restaurants and the total count', async () => {
    const expectedResultQuery = `SELECT restaurant_id, dba, boro, grade FROM restaurant
INNER JOIN inspection ON restaurant.camis=inspection.camis AND restaurant.last_inspection_date=inspection.inspection_date
WHERE 1=1
ORDER BY restaurant.dba
LIMIT 0,999`;
    const expectedCountQuery = `SELECT COUNT(*) AS total_count FROM restaurant
INNER JOIN inspection ON restaurant.camis=inspection.camis AND restaurant.last_inspection_date=inspection.inspection_date
WHERE 1=1`;

    const results = [{ restaurant_id: 1 }, { restaurant_id: 2 }];
    const totalCount = [{ total_count: 10 }];

    mockConnection.query = jest.fn()
      .mockImplementationOnce((_, cb) => cb(undefined, results))
      .mockImplementationOnce((_, cb) => cb(undefined, totalCount));

    await expect(queryRestaurants(options)).resolves.toEqual({
      results, total_count: totalCount[0].total_count
    });

    expect(mockConnection.release).toHaveBeenCalledTimes(1);
    expect(mockConnection.query.mock.calls).toEqual([
      [ expectedResultQuery, expect.any(Function) ],
      [ expectedCountQuery, expect.any(Function) ]
    ]);

  });

  /**
   * The function must resolve to the expected results (with filters)
   * with an object { results, total_count }
   * Check if the mysql queries are the expected ones and
   * the connection is closed at the end
   */
  it('should retrieve all the restaurants and the total count', async () => {

    options = {
      dba: 'Indian Restaurant',
      boro: 'Manhattan',
      street: '5 Avenue',
      cuisine: 'Indian',
      minGrade: 'C'
    };

    const expectedResultQuery = `SELECT restaurant_id, dba, boro, grade FROM restaurant
INNER JOIN inspection ON restaurant.camis=inspection.camis AND restaurant.last_inspection_date=inspection.inspection_date
WHERE restaurant.dba LIKE '%Indian Restaurant%' AND restaurant.boro='Manhattan' AND restaurant.street LIKE '%5 Avenue%' AND restaurant.cuisine='Indian' AND inspection.grade<='C'
ORDER BY restaurant.dba
LIMIT 0,999`;
    const expectedCountQuery = `SELECT COUNT(*) AS total_count FROM restaurant
INNER JOIN inspection ON restaurant.camis=inspection.camis AND restaurant.last_inspection_date=inspection.inspection_date
WHERE restaurant.dba LIKE '%Indian Restaurant%' AND restaurant.boro='Manhattan' AND restaurant.street LIKE '%5 Avenue%' AND restaurant.cuisine='Indian' AND inspection.grade<='C'`;
    const results = [{ restaurant_id: 1 }, { restaurant_id: 2 }];
    const totalCount = [{ total_count: 10 }];

    mockConnection.query = jest.fn()
      .mockImplementationOnce((_, cb) => cb(undefined, results))
      .mockImplementationOnce((_, cb) => cb(undefined, totalCount));

    await expect(queryRestaurants(options)).resolves.toEqual({
      results, total_count: totalCount[0].total_count
    });

    expect(mockConnection.release).toHaveBeenCalledTimes(1);
    expect(mockConnection.query.mock.calls).toEqual([
      [ expectedResultQuery, expect.any(Function) ],
      [ expectedCountQuery, expect.any(Function) ]
    ]);

  });
});

/**
 * queryCuisines
 */
describe('Test queryCuisines', () => {

  /**
  * The function must throw an error and close db connection
  * if no mysql db connection
  */
  it('should throw an error if there is no connection to the db', async () => {
   mockGetConnectionError = new Error('Connection Error');
   await expect(queryCuisines()).rejects.toThrow(mockGetConnectionError.message);
   mockGetConnectionError = undefined;
  });

 /**
  * The function must throw an error and close db connection
  * if the query fails
  */
  it('should throw an error if the query fails', async () => {
    const queryError = new Error('Query Error');
    mockConnection.query = jest.fn()
      .mockImplementation((_, cb) => cb(queryError, []));

    await expect(queryCuisines()).rejects.toThrow(queryError);
    expect(mockConnection.release).toHaveBeenCalledTimes(1);
  });

 /**
   * The function must resolve to the expected results
   * Check if the mysql query is the expected one and
   * the connection is closed at the end
   */
  it('should retrieve all the cuisines', async () => {

    const expectedQuery = 'SELECT DISTINCT cuisine FROM restaurant ORDER BY cuisine';
    const results = [{ cuisine: "Indian" }, { cuisines: 'Chinese'}, { cuisines: 'Italian'}];

    mockConnection.query = jest.fn()
      .mockImplementation((_, cb) => cb(undefined, results))

    await expect(queryCuisines()).resolves.toEqual(results);

    expect(mockConnection.release).toHaveBeenCalledTimes(1);
    expect(mockConnection.query).toHaveBeenCalledWith(expectedQuery, expect.any(Function));
  });
});

/**
 * queryRestaurant
 */
describe('Test queryRestaurant', () => {

  const id = 10;

  /**
  * The function must throw an error and close db connection
  * if no mysql db connection
  */
  it('should throw an error if there is no connection to the db', async () => {
   mockGetConnectionError = new Error('Connection Error');
   await expect(queryRestaurant(id)).rejects.toThrow(mockGetConnectionError.message);
   mockGetConnectionError = undefined;
  });

 /**
  * The function must throw an error and close db connection
  * if the query fails
  */
  it('should throw an error if the query fails', async () => {
    const queryError = new Error('Query Error');
    mockConnection.query = jest.fn()
      .mockImplementation((_, cb) => cb(queryError, []));

    await expect(queryRestaurant(id)).rejects.toThrow(queryError);
    expect(mockConnection.release).toHaveBeenCalledTimes(1);
  });

 /**
   * The function must resolve to the expected results
   * Check if the mysql query is the expected one and
   * the connection is closed at the end
   */
  it('should retrieve the selected restaurant', async () => {
    const expectedQuery = `SELECT restaurant.restaurant_id, restaurant.dba, restaurant.boro, restaurant.building, restaurant.street, restaurant.zipcode, restaurant.phone, restaurant.cuisine, restaurant.last_inspection_date, inspection.grade, inspection.violation_code, IFNULL(violation.violation_description, v.violation_description) AS violation_description FROM restaurant
INNER JOIN inspection ON restaurant.camis=inspection.camis AND restaurant.last_inspection_date=inspection.inspection_date
LEFT JOIN violation ON violation.camis=restaurant.camis AND violation.violation_code=inspection.violation_code
LEFT JOIN violation v ON v.violation_code=inspection.violation_code
WHERE restaurant_id=${id} LIMIT 0,1`;
    const results = {
      restaurant_id: id,
      dba: "Indian Restaurant",
      boro: "Manhattan",
      building: "111",
      street: "5 Avenue",
      zipcode: "00000",
      phone: "7890123456",
      cuisine: "Indian",
      last_inspection_date: "2019-01-01T12:00:00.000Z",
      grade: "A",
      violation_code: "04A",
      violation_description: "Food Protection Certificate not held by supervisor of food operations."
    };

    mockConnection.query = jest.fn()
      .mockImplementation((_, cb) => cb(undefined, results));

    await expect(queryRestaurant(id)).resolves.toEqual(results);

    expect(mockConnection.release).toHaveBeenCalledTimes(1);
    expect(mockConnection.query).toHaveBeenCalledWith(expectedQuery, expect.any(Function));
  });
});
