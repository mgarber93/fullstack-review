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

const repoSchema = mongoose.Schema({
  name: String,
  creator: ObjectId,
  url: {
    type: String, 
    unique: true,
  },
  collaborators_url: {
    type: String,
  },
  description: String,
  size: String,
});

const Repo = mongoose.model('Repo', repoSchema);

/**
 * Save a Repo
 * @param  {object} obj [description]
 */
let save = (obj) => {
  Repo.create({
    name: obj.name,
    creator: obj.creator,
    url: obj.url,
    collaborators_url: obj['collaborators_url'],
    description: obj.description,
    size: obj.size,
  });
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
  User.findOneAndUpdateAsync({username: user}, {username: user}, {upsert:true})
    .then(doc => {
      console.log('doc', doc);
      return true; // inserted new user
    })
    .catch(err => {
      return false;
    }); 
}

let updateUser = ( { _id, etag } ) => {
  User.findOneAndUpdateAsync({_id, _id}, {etag: etag})
}


/**
 * Accept search term as creator and return object with results array.
 * @param  {[type]} options.creator [description]
 * @return {[type]}                 [description]
 */
let getRepos = ({creator}, res) => {
  // lookup user 
  User.findOneAsync({username: creator}) 
    .then(user => {
      if (user === null || !user) {
        throw user;
      } else {
        return Repo.findAsync({creator: user['_id']});       }
    })
    .then(doc => {
      let array = doc.map(d => d.url);
      res.status(200).json({results: array});
      res.end();
    })
    .catch(err => {
      // dont expose internal db error to outside world
      console.error('repo lookup error!', err);
      res.status(200).json({results: []});
      res.end();
    })
};

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
  if (!username || !String(username).trim() || username.split(' ').length > 1) {
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