var express = require('express');
var fs = require('fs');
var i18n = require('i18n');
var session = require('express-session');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectID = require('mongodb').ObjectId;
var url = 'mongodb://localhost:27017/imr';
var app = express();

/*
 *   Check command line options
 */

process.argv.forEach(function(val,index,array) {
  var token = val.split("=");

  // write pid to specified file

  if (token[0] == "--pidfile") {
    if (token.length == 2) {
      fs.writeFile(token[1],process.pid);
    }
  }
});

/*
 *
 */

i18n.configure({
  locales: ['en','fr'],
  directory: __dirname + '/locales'
});

/*
app.configure(function(){
  // Default: using 'accept-language' header to guess language settings 
  app.use(i18n.init);  
});
*/

/*
 * Publicly available files that store the IMR browser client
 */

app.use('/imr',express.static(__dirname + '/public'));



/*
 * Create a session for the IMR.
 */

app.use('/',session({
  secret: 'Indicator Metadata Registry',
  resave: false,
  saveUninitialized: false
}));


/*
 * For any request coming in, make sure that the session object is preset with some
 * default values:
 * -Set language to English (en)
 */

app.use('/',function(req,res,next){
console.log("Lookint at session");
  if (!req.session.language) {
    req.session.language = "en";
  }
  next(); 
});

/*
 *
 */

app.listen(3000, function () {
  console.log('Example app listening on port 3000');
});

/*
 *
 */

function logRequest(req) {
  console.log(req.hostname + "\t" + req.originalUrl);
}

/*
 * Set the language
 */

app.get('/language/:language',function(req, res) {
  logRequest(req);
  req.session.language = req.params.language
  res.end('Language set to ' + req.session.language);
});

/*
 *  Get a complete indicator description
 */

app.get('/indicator/:indicator',function(req, res) {
  logRequest(req);
  MongoClient.connect(url,function(err,db) {
    assert.equal(null,err);
    var collection = db.collection('indicators');
    collection.find({'code':req.params.indicator}).toArray(function(err,docs){
      assert.equal(null,err);
      if (docs.length == 1) {
        res.json(docs[0]);
      }
      db.close();
    });
  });
});

/*
 *  Get the list of indicators
 */

app.get('/indicator', function(req, res) {
  logRequest(req);
  MongoClient.connect(url,function(err,db) {
    assert.equal(null,err);
    var collection = db.collection('indicators');
    collection.find({},{_id:0,code:1,name:1},{sort:'name'}).toArray(function(err,docs){
      assert.equal(null,err);
      res.json(docs);
      db.close();
    });
  });
});


/*
 * Retrieve the property display labels in the language specified in the session 
 * object.
 */

app.get("/properties",function(req,res) {
  logRequest(req);
  MongoClient.connect(url,function(err,db) {
    assert.equal(null,err);
    var collection = db.collection('properties');
    var props = {}
    collection.find().toArray(function(err,docs) {
      assert.equal(null,err);
      for (var d in docs) {
        props[docs[d].property] = docs[d].display[req.session.language];
      }
      res.json(props);
      db.close();
    });
  });
});

/*
 * Search the indicator database
 */

app.get('/search/:query',function(req,res) {
  logRequest(req);
  MongoClient.connect(url,function(err,db) {
    assert.equal(null,err);
    var collection = db.collection('indicators');
    var re = new RegExp(".*" + req.params.query + ".*","gi");
    collection.find({'name':re},{_id:0,code:1,name:1},{sort:'name'}).toArray(function(err,docs){
      assert.equal(null,err);
      res.json(docs);
      db.close();
    });
  });
});


