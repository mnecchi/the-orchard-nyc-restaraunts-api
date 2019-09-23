const { sendJson, queryRestaurants, queryRestaurant, queryCuisines } = require('./helpers');

// API endpoints implementations

module.exports = {
  /*
   * Method: GET
   * Endpoint: /restaurants
   *
   * Returns a list of restaurants filtered by the querystring params:
   * - cuisine (required): type of restaurant
   * - minGrade (required): the minimum allowed grade
   * - offset (optional, default: 0): the index of the first element in the list
   * - limit (optional, default: 999): max number of results
   */
  getRestaurants: async (req, res) => {
    // queries the db
    try {
      sendJson(res, await queryRestaurants(req.query));
    } catch(err) {
      // returns a generic server error
      res.status(500).send(err.message);
    };
  },

  /*
   * Method: GET
   * Endpoint: /restaurants/:id
   *
   * Returns a single restaurant's details
   */
  getRestaurant: async (req, res) => {
    try {
      const results = await queryRestaurant(req.params.id);
      if (!Array.isArray(results) || results.length === 0) {
        // if no restaurant is found return 404
        res.status(404).send('Not Found!');
      } else {
        // returns a json payload
        sendJson(res, results[0]);
      }
    } catch (err)  {
      // returns a generic server error
      res.status(500).send(err.message);
    };
  },

  /*
   * Method: GET
   * Endpoint: /cuisines
   *
   * Returns the list of all cuisines in the db
   */
  getCuisines: async (_, res) => {
    try {
      sendJson(res, await queryCuisines());
    } catch (err) {
      // returns a generic server error
      res.status(500).send(err.message);
    };
  }
};
