/*
 *
 *
 */

/*
 * Add a version number to each indicator definition
 * */

db.indicators.update(
  {},
  {
    $set: {
      "version": 1
    }
  },
  {
    multi:true
  }
)
