const CronJob = require('cron').CronJob;
const db = require('../database/index');
const github = require('../helpers/github');

module.exports.running = true;

// set up cron job when invoked
(function () {
  console.log('setting up cron job...');
  // fires once a minute
  new CronJob('* * * * *', function() {
    if (!module.exports.running) {
      return;
    }
    // let updatedUpdated = false;
    // get every users/etag from user db
    db.getUsers()
      .then(users => {
        users.filter(user => !!user.username && user.username !== '')
        // all?
        .forEach(user => {
          github.getReposByUsername(user.username, user.etag)
          .then(repos => {
            console.log(user.username + '-200');
            let etag = repos.caseless.dict.etag;
            repos.body.forEach(repo => {
              db.save({
                name: repo.name,
                collaborators_url: repo['collaborators_url'],
                description: repo.description,
                size: repo.size, 
                creator: user['_id'], 
                url: repo['svn_url']
              });
            })
            // update user's etag
            db.updateUser({'_id': user['_id'], etag: etag})
          })
          .catch(err => {
            if (err.statusCode === 304) {
              console.log(user.username + '-304');
            } else {
              console.log('error!' + err);
            }
          });
        })
      });
    console.log('You will see this message every minute');
  }, null, true, 'America/Los_Angeles');
})();

