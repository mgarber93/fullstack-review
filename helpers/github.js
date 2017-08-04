const request = require('request-promise');
const config = require('../config.js');


/**
 * 
 * @param  {string} user username to search for
 * @param  {string} etag - Etag is needed for conditional request. 
 * @return {promise}  Promise that is fulfiled by get response
 */
const getReposByUsername = (user, etag) => {

  console.log(`fetching data for ${user + (etag ? ' last fetch was ' + etag : ' for the first time!')}`);

  let options = {
    url: `https://api.github.com/users/${user.trim()}/repos`,
    headers: {
      'User-Agent': 'request',
      'Authorization': `token ${config.TOKEN}`,
    },
    resolveWithFullResponse: true,
    json: true,
  };

  if (etag) {
    options.headers['If-None-Match'] = etag;
  }

  return request(options);
}

module.exports.getReposByUsername = getReposByUsername;