const express = require('express');
const db = require('../database/index');
const workers = require('../workers/worker');

let app = express();

app.use(express.static(__dirname + '/../client/dist'));

// app.use(express.bodyParser()); // body parser must be installed


/**
 * If a user posts to /repos we must decide whether that github is in the 
 * database. If we have that user's github we respond with an array of jsons 
 * (25 repos). Else we add that account to a either a list or collection (?) to
 * be added my our web workers.
 *
 * Wrote my own body parser
 * 
 * This route should take the github username provided
 * and get the repo information from the github API, then
 * save the repo information in the database
 * 
 * @param  {string} endpoint that this express componenet handles. 
 * @param  {function} request handler that creates the response. 
 */
app.post('/repos', function (req, res) {

  // parse request body 
  let requestBody = '';
  req.on('data', chunk => {
    requestBody += chunk;
  })
  req.on('end', () => {
    let tuples = requestBody.split('; ').map(kv => kv.split('='));
    req.body = {};
    for (const tuple of tuples) {
      req.body[tuple[0]] = tuple[1];
    }

    if(req.body.term && db.isValidUserName(req.body.term)) {
      try {
        db.addUser({user: req.body.term}) // add if not already there
        db.getRepos({creator: req.body.term}, res);
      } catch (e) {
        // user hasn't fetched yet
        res.redirect('/repos');
        res.end();
      }
    } else {
      res.status(404);
      res.end();
    }
  })
});

// This route should send back the top 25 repos
app.get('/repos', function (req, res) {
  db.getTopRepos(req, res);
});

let port = 1128;

app.listen(port, function() {
  console.log(`listening on port ${port}`);
});

