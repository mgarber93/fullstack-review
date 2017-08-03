import React from 'react';

const RepoList = (props) => (
  <li>
    <a href={props.repo}>{props.repo.split('/').pop()}</a>
  </li>
)

export default RepoList;