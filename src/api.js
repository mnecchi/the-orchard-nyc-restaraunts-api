const { queryRestaurants } = require('./helpers');

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
  getRestaurants: (req, res) => {
    // queries the db
    queryRestaurants(req.query)
      .then(results => {
        // returns a json payload
        res.type('json');
        res.send(JSON.stringify(results));
      })
      .catch(err => {
        // returns a generic server error
        res.status(500).send(err.message);
      });
  }

};
