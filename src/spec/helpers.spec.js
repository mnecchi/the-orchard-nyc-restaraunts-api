const { queryRestaurants } = require('../helpers');

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

let options = {};

beforeEach(() => {
  jest.clearAllMocks();
});

/**
 * queryRestaurants
 */
describe('Test queryRestaurants', () => {

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
