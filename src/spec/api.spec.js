const { sendJson, queryRestaurants, queryCuisines, queryRestaurant } = require('../helpers');
const { getRestaurants, getRestaurant, getCuisines } = require('../api');

jest.mock('mysql', () => ({
  createPool: jest.fn()
}));

jest.mock('../helpers', () => ({
  queryRestaurants: jest.fn(),
  queryCuisines: jest.fn(),
  queryRestaurant: jest.fn(),
  sendJson: jest.fn()
}));

let errorMessage = 'Generic Error';

const send = jest.fn();
const status = jest.fn().mockImplementation(() => ({ send }));
const res = { status };

beforeEach(() => {
  jest.clearAllMocks();
});

/**
 * /restaurants endpoint
 */
describe('/restaurants endpoint', () => {
  const req = { query: {
    dba: 'Taj Mahal',
    cuisine: 'Indian',
    minGrade: 'B'
  }}

  /**
   * The endpoint should send a 500 http error when an
   * error occurs
   */
  it('should send a 500 status code when error occurs', async () => {
    queryRestaurants.mockReturnValue(Promise.reject(new Error(errorMessage)));

    await getRestaurants(req, res);
    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith(errorMessage);
  });

  /**
   * The endpoint should send a json response with an array of restaurants
   */
  it('should send the results json response', async () => {
    const expectedJson = [{ restaurant_id: 1 }, { restaurant_id: 2 }];
    queryRestaurants.mockReturnValue(Promise.resolve(expectedJson));

    await getRestaurants(req, res);
    expect(sendJson).toHaveBeenCalledWith(res, expectedJson);
  });
});

/**
 * /cuisines endpoint
 */
describe('/cuisines endpoint', () => {
  const req = { query: {} };

  /**
   * The endpoint should send a 500 http error when an
   * error occurs
   */
  it('should send a 500 status code when error occurs', async () => {
    queryCuisines.mockReturnValue(Promise.reject(new Error(errorMessage)));

    await getCuisines(req, res);
    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith(errorMessage);
  });

  /**
   * The endpoint should send a json response with an array of cuisines
   */
  it('should send the results json response', async () => {
    const expectedJson = [{ cuisine: 'Indian' }, { cuisine: 'Italian' }];
    queryCuisines.mockReturnValue(Promise.resolve(expectedJson));

    await getCuisines(req, res);
    expect(sendJson).toHaveBeenCalledWith(res, expectedJson);
  });
});

/**
 * /restaurants/:id endpoint
 */
describe('/restaurants/:id endpoint', () => {
  const req = { params: { id: 10 } };

  /**
   * The endpoint should send a 500 http error when an
   * error occurs
   */
  it('should send a 500 status code when error occurs', async () => {
    queryRestaurant.mockReturnValue(Promise.reject(new Error(errorMessage)));

    await getRestaurant(req, res);
    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith(errorMessage);
  });

  /**
   * The endpoint should send a 404 http error if no restaurant is found
   */
  it('should send a 404 status code if no restaurant is found', async () => {
    queryRestaurant.mockReturnValue(Promise.resolve([]));

    await getRestaurant(req, res);
    expect(status).toHaveBeenCalledWith(404);
    expect(send).toHaveBeenCalledWith('Not Found!');
  });

  /**
   * The endpoint should send a json response with the restaurant's details
   */
  it('should send the restaurant json response', async () => {
    const expectedJson = { restaurant_id: 10, dba: 'Taj Mahal', cuisine: 'Indian' };
    queryRestaurant.mockReturnValue(Promise.resolve([expectedJson]));

    await getRestaurant(req, res);
    expect(sendJson).toHaveBeenCalledWith(res, expectedJson);
  });
});
