var express = require('express');
var fs = require('fs');
var session = require('express-session');
var MongoClient = require('mongodb').MongoClient;
var Mustache = require('mustache-express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var assert = require('assert');
var ObjectID = require('mongodb').ObjectId;
var passport = require('passport');
var i18n = require('i18n');
var LocalStrategy = require('passport-local').Strategy;
var url = 'mongodb://localhost:27017/imr';
var app = express();


var __application_root = "/gho/imr";

i18n.configure({
  cookie: "whoimr",
  directory: __dirname + '/locales'
});

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
app.use(cookieParser());
app.use(i18n.init);
app.use(passport.initialize());
app.use(passport.session());

/*
 * Helper function for mustache
 */

app.use(function(req,res,next) {
  res.locals.__ = function(){
    return function(text,render) {
      return i18n.__.apply(req,arguments);
    };
  };
  next();
});

/*
 * Publicly available files that store the IMR browser client
 */

app.use(__application_root + '/public',express.static(__dirname + '/public'));


/*
 * When nothing is provided on the path, show the first indicator
 */

app.get(__application_root + "/",function(req,res) {
  res.redirect(__application_root + "/en");
});

app.get(__application_root + "/:lang",function(req,res) {
  req.setLocale(req.params.lang);
  res.redirect(__application_root + "/view/indicator/" + req.getLocale() + "/CHI_1");
});



/*
 *
 */

app.get(__application_root + '/view/property/:lang/:property',function(req,res) {
  logRequest(req);
  req.setLocale(req.params.lang);
  MongoClient.connect(url,function(err,db) {
    assert.equal(null,err);

    // Retreive the property description.

    db.collection('properties')
      .findOne({id:req.params.property},function(err,property) {
      assert.equal(null,err);

      // If we didnt find the property we send back an HTTP 404 error and
      // abort.

      if (property == null) {
        res.status(404).send(req.params.property + " not found.").end();
        db.close();  
      } else {

        // If the property takes a coded value, find the conccepts for these codes
        // (This part can return null if the concepts have not been defined/identified
        // yet or if the property is a text field)
        //
        db.collection('concepts')
          .find({id:{$in:property.codes}},{id:1,label:1}).toArray(function(err,concept) {

          // Build a display version of the property along with the
          // concepts that it can hold if it is a coded property.

          var displayProperty = {
                                  name: (property.display[req.getLocale()] == null) ?
                                        property.display.en : property.display[req.getLocale()],
                                  code: property.id,
                                  concept: []
                                };
          for (var n in concept) {
            displayProperty.concept.push({
              code: concept[n].id,
              name: (concept[n].label[req.getLocale()] == null) ?
                    concept[n].label.en : concept[n].label[req.getLocale()]
            });
          }  

          // Render it via a template.

          res.render('property',{
            "property": displayProperty,
            "approot": __application_root,
            "locale": req.getLocale(),
            "user": req.user
          });
  
          db.close();
        });
      }
    });
  });
});

/*
 * Retreive a concept description for display
 */

app.get(__application_root + '/view/concept/:lang/:concept',function(req,res) {
  logRequest(req);
  req.setLocale(req.params.lang);
  MongoClient.connect(url,function(err,db) {
    assert.equal(null,err);

    // Retreive the concept description.

    db.collection('concepts')
      .findOne({'id':req.params.concept},function(err,concept) {
      assert.equal(null,err);

      // If we didnt find the concept, send back an HTTP 404 error and abort

      if (concept == null) {
        res.status(404).send(req.params.property + " not found.").end();
        db.close();  
      } else {

        // Find the indicators that use this concept.  We're only interested in the
        // name and id of the indicators so that we can make navigation links to them
        
        db.collection('indicators')
          .find({"property.concept_id":req.params.concept},{id:1,display:1})
          .toArray(function(err,indicator) {
   
          var displayConcept = {
                                 name: (concept.label[req.getLocale()] == null) ?
                                       concept.label.en : concept.label[req.getLocale()],
                                 code: concept.id,
                                 definition: (concept.definition[req.getLocale()] == null) ?
                                             concept.definition.en : concept.definition[req.getLocale()],
                                 indicator: []
                               };
          for (var n in indicator) {
            displayConcept.indicator.push({ 
              code: indicator[n].id,
              name: (indicator[n].display[req.getLocale()] == null) ?
                    indicator[n].display.en : indicator[n].display[req.getLocale()]
            });
          }
   
          // Render the display concept in a template
  
          res.render('concept',{
            "concept": displayConcept,
            "approot": __application_root,
            "locale": req.getLocale(),
            "user": req.user
          });

          db.close();
        });
      }
    });
  });
});

/*
 * Retreive an indicator description for display
 */

app.get(__application_root + '/view/indicator/:lang/:indicator',function(req,res) {
  logRequest(req);
  req.setLocale(req.params.lang);
  MongoClient.connect(url,function(err,db) {
    assert.equal(null,err);

    // Find the requested indicator

    db.collection('indicators')
      .findOne({'id':req.params.indicator},function(err,doc) {
      assert.equal(null,err);
      if (doc == null) {
        res.status(404).send(req.params.indicator + " not found.").end();
        db.close();  
      } else {
          
        // make a list of the properties that it uses
    
        proplist = [];
        for (var n in doc.property) {
          proplist.push(doc.property[n].property_id);
        }
 
        // load the descriptions of the properties in the list so that we 
        // can retreive correct display labels
      
        db.collection('properties')
          .find({id:{$in:proplist}})
          .toArray(function(err,prop) {
          assert.equal(null,err);
  
          // Make a list of the concept codes that must be resolved for display.
  
          conceptList = [];
          for (var n in doc.property) {
            if ('concept_id' in doc.property[n]) {
              conceptList.push(doc.property[n].concept_id);
            }
          }
  
          // Retrieve the concept descriptions and display labels
         
          db.collection('concepts')
            .find({id:{$in:conceptList}})
            .toArray(function(err,concept) {
  
            // Create an empty display version of the indicator

            var indicator = { 
              name: (doc.display[req.getLocale()] == null) ? 
                    doc.display.en : doc.display[req.getLocale()], 
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
                  propLabel = (prop[q].display[req.getLocale()] == null) ?
                              prop[q].display.en : prop[q].display[req.getLocale()];
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
                    propValue = (concept[q].label[req.getLocale()] == null) ?
                                concept[q].label.en : concept[q].label[req.getLocale()];
                    break;
                  }
                }
              } else {
                propValue = (doc.property[p].display[req.getLocale()] == null) ?
                            doc.property[p].display.en : doc.property[p].display[req.getLocale()];
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
              var noteValue = (doc.note[n].display[req.getLocale()] == null) ?
                              doc.note[n].display.en : doc.note[n].display[req.getLocale()];
              indicator.note.push(noteValue);
            }
    
            // Render the indicator using the indicator template.
            res.render('indicator',{
              "indicator": indicator,
              "approot": __application_root,
              "locale": req.getLocale(),
              "user": req.user
            });
            db.close();
          });
        }); 
      }
    }); 
  }); 
});

/*
 *
 *
 */

app.get(__application_root + '/view/:view/:lang',function(req,res) {
  req.setLocale(req.params.lang);
  res.render(req.params.view,{
      "title": 'Page title',
      "approot": __application_root,
      "locale": req.getLocale(),
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

app.post(__application_root + '/auth/login',passport.authenticate(
  'local',
  { 
    successRedirect:__application_root,
    failureRedirect:__application_root
  })
);

app.get(__application_root + '/auth/logout',function(req,res) {
  req.logout();
  res.redirect(__application_root);
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
 *  Get a complete indicator description
 */

app.get(__application_root + '/get/indicator/:indicator',function(req, res) {
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

app.get(__application_root + '/get/indicators/:lang', function(req, res) {
  logRequest(req);
  req.setLocale(req.params.lang);
  MongoClient.connect(url,function(err,db) {
    assert.equal(null,err);
    var collection = db.collection('indicators');
    collection.find({},{_id:0,id:1,display:1},{sort:'id'}).toArray(function(err,docs){
      assert.equal(null,err);
      indicators = [];
      for (var i in docs) {
        var indicator = {};
        indicator["id"] = docs[i].id;
        indicator["display"] = {};
        indicator["display"][req.getLocale()] = (docs[i].display[req.getLocale()] == null) ? 
                                                 docs[i].display.en : 
                                                 docs[i].display[req.getLocale()];
        indicators.push(indicator);
      }
      res.json(indicators);
      db.close();
    });
  });
});


/*
 * Retrieve the property display labels in the language specified in the session 
 * object.
 */

app.get(__application_root + "/get/properties",function(req,res) {
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

app.get(__application_root + '/search/:lang/:query',function(req,res) {
  logRequest(req);
  req.setLocale(req.params.lang);
  MongoClient.connect(url,function(err,db) {
    assert.equal(null,err);
    var query = {};
    var filter = {
      _id: 0,
      id: 1
    }
    query["display." + req.getLocale()] = new RegExp(".*" + req.params.query + ".*","gi");
    filter["display." + req.getLocale()] = 1;
    var collection = db.collection('indicators');
    collection.find(query,filter,{sort:'id'}).toArray(function(err,docs){
      assert.equal(null,err);
      res.json(docs);
      db.close();
    });
  });
});


