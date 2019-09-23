# The Orchard NYC Restaurants API

## Server

The API has been developed using **Node v10.16.3**.
Since the project is mainly focused on the front end, the back end is fairly basic and it's a simple **express** server.
You can run it locally running `npm start`; the server listens on port 5000.

The API has been deployed on **Heroku**: `https://desolate-spire-11056.herokuapp.com/`

## DB

The DB server used is the free version of **ClearDB MySql** as an **Heroku Add-On**.

The DB has been created from the dump but I have decided to make a few changes:

1) concatenate *score* and *grade* into new field *violation_code* in the **restaurant** table
2) create indexes on **restaurant** and **inspection** tables
3) create a new **violation** table with just the list of violations (derived from the original **violation** table with a *SELECT DISTINCT*)

**NB**: To run the API locally you need to add the following in the `.env` file in the root of the project:

```ini
CLEARDB_DATABASE_URL=mysql://b131a037c8a894:20e94d04@us-cdbr-iron-east-02.cleardb.net/heroku_4d6f4eb1088c451?reconnect=true
```

**Notes**: Another improvement I could have made is the creation of a **cuisine** table and linking it with the **restaurant** table.
The main reason I didn't do it is because I have already exceeded the size of the free version of the db and they disabled my insert privileges! 🤦‍

## Unit Tests

Unit tests can be run with `npm test`.

## API Endpoints and Examples

### `/restaurants` (GET)

It accepts **filters**, **sorting** and **limiting** in the query string.
Returns a json object with the list of restaurants in `results` and the total number of rows matching the filter criteria in `total_count`.

The implemented **filters** are:

- `dba`: the name of the restaurant
- `boro`: the borough of the restaurant
- `street`: the street of the restaurant
- `cuisine`: the cuisine type of the restaurant
- `minGrade`: the minimum allowed grade

**Sorting**:

- `order`: can be `dba`, `boro`, `grade`

**Limiting**:

- `limit`: number of restaurants to return
- `offset`: index (starting from 0) of the first item to return

### `/restaurants/:id` (GET)

Returns the details of a single restaurant as a json object.

### `/cuisines` (GET)

Returns the list of all the cuisines in the restaurant table as an array of objects.

### Examples

`https://desolate-spire-11056.herokuapp.com/restaurants?dba=DIWAN&cuisine=Indian&limit=2`

```json
{
    "results": [
        {
            "restaurant_id": 21503,
            "dba": "DIWAN GRILL",
            "boro": "BROOKLYN",
            "grade": "Unknown"
        },
        {
            "restaurant_id": 1608,
            "dba": "DIWAN-E- KHAAS",
            "boro": "MANHATTAN",
            "grade": "A"
        }
    ],
    "total_count": 3
}
```

`https://desolate-spire-11056.herokuapp.com/restaurants/12149`

```json
{
    "restaurant_id": 12149,
    "dba": "15 FLAVORS",
    "boro": "BRONX",
    "building": "1763",
    "street": "CROSBY AVE",
    "zipcode": "10461",
    "phone": "3473981131",
    "cuisine": "Ice Cream, Gelato, Yogurt, Ices",
    "last_inspection_date": "2016-04-04T23:00:00.000Z",
    "grade": "A",
    "violation_code": "09A",
    "violation_description": "Canned food product observed dented and not segregated from other consumable food items."
}
```

`https://desolate-spire-11056.herokuapp.com/cuisines`

```json
[
    {
        "cuisine": "Afghan"
    },
    {
        "cuisine": "African"
    },
    {
        "cuisine": "American"
    },
    {
        "cuisine": "Armenian"
  },

  ...

]
```
