const mongoose = require('mongoose');
const Promise = require('bluebird');
Promise.promisifyAll( mongoose );

mongoose.connect('mongodb://localhost/fetcher');

const ObjectId = mongoose.Schema.Types.ObjectId;

/**
 * Querying GitHub with the etag of the last query allows for conditional 
 * requests. If a 304 is returned we know we are up to date.
 * @type {schema}
 */
const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
  },
  etag: {
    type: String,
    default: '',
  },
});

const User = mongoose.model('User', userSchema);

/**
 * We want to associate each user to up to 25 repos.
 * I assume each repo only has one owner.
 * @type {MongoDB scheme}
 */
const repoSchema = mongoose.Schema({
  creator: ObjectId,
  url: {
    type: String, 
    unique: true,
  }
});

const Repo = mongoose.model('Repo', repoSchema);

/**
 * Save a Repo
 * @param  {} obj [description]
 */
let save = (obj) => {
  Repo.create({creator: obj.creator, url: obj.url});
}

/**
 * 
 * @return {[type]} [description]
 */
const getUsers = () => {
  return User.findAsync();
}

/**
 * Add a user if the user exists the userid is returned.
 * @param  {object} options.user - github handle 
 * @return {userID or index not sure yet} 
 */
let addUser = ({ user }) => {
  try {
    User.findOneAndUpdate(
      {username: user}, 
      {username: user}, 
      {upsert:true},
      (err, doc) => {
      if(err) { 
        return undefined;
      }
      return doc;
    });
  } catch (e) {
    console.log('new user inserted. I really need to fix this');
    return undefined;
  }
}

let updateUser = ( { _id, etag } ) => {
  User.findOneAndUpdate({_id, _id}, {etag: etag}, (err, doc) => {
    if (err) {
      console.error(err);
    }
    return doc;
  });
}


/**
 * Accept search term as creator and return object with results array.
 * @param  {[type]} options.creator [description]
 * @return {[type]}                 [description]
 */
let getRepos = ({creator}, res) => {
  // lookup user 
  try {
    User.findOne({username: creator}, (err, user) => {
      if (err) {
        console.error('user not found!');
        res.status(200).json({results: []});
        res.end();
      }
      console.log(user); 
      if (!user['_id']) {
        console.error('repo lookup error!', err);
        res.status(200).json({results: []});
        res.end();
      } else {
        Repo.find({creator: user['_id']}, (err, doc) => {
          if (err) {
            // dont expose internal db error to outside world
            console.error('repo lookup error!', err);
            res.status(200).json({results: []});
            res.end();
          }
          let array = doc.map(d => d.url);
          res.status(200).json({results: array});
          res.end();
        });
      }
    })
  } catch (e) {
    console.error('user not found!');
    res.status(200).json({results: []});
    res.end();
  }
}

let getTopRepos = (req, res) => {
  // TODO .sort() by some metric
  Repo.find().limit(25)
    .then((doc) => {
      let array = doc.map(d => d.url);
      res.status(200).json({results: array});
      res.end();
    })
    .catch((doc) => {
      res.status(404).json({results: []});
      res.end();
    });
};

let isValidUserName = (username) => {
  if (!username && !String(username).trim()) {
    return false;
  } else {
    return true;
  }
}

module.exports.save = save;
module.exports.isValidUserName = isValidUserName;
module.exports.getUsers = getUsers;
module.exports.addUser = addUser;
module.exports.getRepos = getRepos;
module.exports.updateUser = updateUser;
module.exports.getTopRepos = getTopRepos;