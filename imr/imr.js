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
 * Retreive a concept description for display
 */


app.get('/view/concept/:concept',function(req,res) {
  logRequest(req);
  MongoClient.connect(url,function(err,db) {
    assert.equal(null,err);

    // Retreive the concept description.

    db.collection('concepts').findOne({'id':req.params.concept},function(err,concept) {
      assert.equal(null,err);

      // Find the indicators that use this concept.  We're only interested in the
      // name and id of the indicators so that we can make navigation links to them
      
      db.collection('indicators').
         find({"property.concept_id":req.params.concept},{id:1,display:1}).
         toArray(function(err,indicator) {
 
        var displayConcept = {
                               name: concept.label.en,
                               code: concept.id,
                               definition: concept.definition.en,
                               indicator: []
                             };
        for (var n in indicator) {
          displayConcept.indicator.push({ 
            code: indicator[n].id,
            name: indicator[n].display.en
          });
        }
 
        // Render the display concept in a template

        res.render('concept',{
          "concept": displayConcept,
          "user": req.user
        });

        db.close();
      });
    });
  });
});

/*
 * Retreive an indicator description for display
 */

app.get('/view/indicator/:indicator',function(req,res) {
  logRequest(req);
  MongoClient.connect(url,function(err,db) {
    assert.equal(null,err);

    // Find the requested indicator

    db.collection('indicators').findOne({'id':req.params.indicator},function(err,doc) {
      assert.equal(null,err);

      // make a list of the properties that it uses
      
      proplist = [];
      for (var n in doc.property) {
        proplist.push(doc.property[n].property_id);
      }

      // load the descriptions of the properties in the list so that we 
      // can retreive correct display labels
      
      db.collection('properties').find({id:{$in:proplist}}).toArray(function(err,prop) {
        assert.equal(null,err);

        // Make a list of the concept codes that must be resolved for display.

        conceptList = [];
        for (var n in doc.property) {
          if ('concept_id' in doc.property[n]) {
            conceptList.push(doc.property[n].concept_id);
          }
        }

        // Retrieve the concept descriptions and display labels
       
        db.collection('concepts').find({id:{$in:conceptList}}).toArray(function(err,concept) {

          // Create an empty display version of the indicator
          
          var indicator = { 
            name: doc.display.en,
            code: doc.id,
            property: [],
            note: []
          };

          // Populate it with the correct display labels and values for 
          // each property.
  
          for (var p in doc.property) {
            var propLabel = doc.property[p].property_id;
            for (var q = 0; q < prop.length; q++) {
              if (prop[q].id == propLabel) {
                propLabel = prop[q].display.fr;
                break;
              }
            }

            // Resolve the value for the for property.  If it is a coded
            // value, extract the appropriate display string to pass to the 
            // template.

            var propValue = "";
            var concept_id = null;
            if ('concept_id' in doc.property[p]) {
              propValue = doc.property[p].concept_id; 
              concept_id = propValue;
              for (var q = 0; q < concept.length; q++) {
                if (concept[q].id == propValue) {
                  propValue = concept[q].label.en;
                  break;
                }
              }
            } else {
              propValue = doc.property[p].display.en;
            }
           
            indicator.property.push({
              code: doc.property[p].property_id,
              concept_id: concept_id,
              label: propLabel,
              value: propValue
            });
          }
  
          // Add all the footnotes in the correct language.
          
          for (var n in doc.note) {
            indicator.note.push(doc.note[n].display.en);
          }
  
          // Render the indicator using the indicator template.
  
          res.render('indicator',{
            "indicator": indicator,
            "user": req.user
          });
          db.close();
        });
      }); 
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
    collection.find({},{_id:0,id:1,display:1}).toArray(function(err,docs) {
      assert.equal(null,err);
      res.json(docs);
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


