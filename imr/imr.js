var express = require('express');
var fs = require('fs');
var session = require('express-session');
var MongoClient = require('mongodb').MongoClient;
var Mustache = require('mustache-express');
var bodyParser = require('body-parser');
var assert = require('assert');
var ObjectID = require('mongodb').ObjectId;
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var url = 'mongodb://localhost:27017/imr';
var app = express();


/*
 *  The body parser is nescessary for passport to function correctly
 */

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
/*
 * Create a session for the IMR.
 */

app.use('/',session({
  secret: 'Indicator Metadata Registry',
  resave: false,
  saveUninitialized: false
}));


app.engine('html',Mustache());
app.set('view engine','html');
app.set('views',__dirname + "/views");
app.use(passport.initialize());
app.use(passport.session());
/*
 * Publicly available files that store the IMR browser client
 */

app.use('/public',express.static(__dirname + '/public'));



/*
 * Views
 */

app.get('/view/indicator/:indicator',function(req, res) {
  logRequest(req);
  MongoClient.connect(url,function(err,db) {
    assert.equal(null,err);
    var collection = db.collection('indicators');
    collection.find({'id':req.params.indicator}).toArray(function(err,docs){
      assert.equal(null,err);
      var indicator = { 
        name: docs[0].display.en,
        code: docs[0].id,
        property: [],
        note: []
      };
      for (var p in docs[0].property) {
        indicator.property.push({
          code: docs[0].property[p].property_id,
          label: docs[0].property[p].property_id,
          value: docs[0].property[p].display.en,
        });
      }
      for (var n in docs[0].note) {
        indicator.note.push(docs[0].note[n].display.en);
      }
      if (docs.length == 1) {
        res.render('indicator',{
          "indicator": indicator,
          "user": req.user
        });
      }
      db.close();
    });
  });
});

/*
 *
 *
 */

app.get('/view/:view',function(req,res) {
  res.render(req.params.view,{
      "title": 'Page title',
      "user": req.user
  });
});

/*
 *
 */

passport.use(new LocalStrategy({
    usernameField: "username",
    passwordField: "password"
  },
  function(username,password,done) {
  console.log("Username:  " + username + " Password: " + password);
  MongoClient.connect(url,function(err,db) {
    assert.equal(null,err);
    var users = db.collection('users');
    users.findOne({username: username},function(err,user) {
      db.close();
      if (err) {
        return done(err);
      } 
      if (!user) {
        return done(null,false,{message:"Incorrect username."});
      }
      if (user.password != password) {
        return done(null,false,{message:"Incorrect password."});
      }
      return done(null,user);
    });
  });
}));

passport.serializeUser(function(user,done) {
  done(null,user);
});

passport.deserializeUser(function(user,done) {
  done(null,user);
});

/*
 *
 */

/*
 *  
 *
 */

app.post('/login',passport.authenticate(
  'local',
  { 
    successRedirect:'/view/indicator/CHI_1',
    failureRedirect:'/view/indicator/CHI_1'
  })
);

app.get('/logout',function(req,res) {
  req.logout();
  res.redirect('/view/indicator/CHI_1');
});


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
 * For any request coming in, make sure that the session object is preset with some
 * default values:
 * -Set language to English (en)
 */

app.use('/',function(req,res,next){
console.log("Looking at session");
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
    collection.find({'id':req.params.indicator}).toArray(function(err,docs){
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
    collection.find({},{_id:0,id:1,display:1},{sort:'id'}).toArray(function(err,docs){
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
    collection.find({'display.en':re},{_id:0,id:1,"display":1},{sort:'id'}).toArray(function(err,docs){
      assert.equal(null,err);
      res.json(docs);
      db.close();
    });
  });
});


