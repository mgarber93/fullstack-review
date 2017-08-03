import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import Search from './components/Search.jsx';
import RepoList from './components/RepoList.jsx';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      repos: []
    }
  }

  /**
   * Searching for a term does a post request to the express server.
   * jQuery.post( url [, data ] [, success ] [, dataType ] )
   * @param  {[type]} term [description]
   * @return {[type]}      [description]
   */
  search (term) {
    console.log(`${term} was searched`);
    $.ajax({ 
      type: "POST",
      url: 'http://127.0.0.1:1128/repos', 
      data: {'term': term}, 
      dataType: 'application/json',
      success: function() {
        console.log('success handler fired!');
      },
      error: function() {
        console.log('error handler fired!');
      }
    })
    .always(data => {
      console.log(data, typeof data);
      let results = JSON.parse(data.responseText);
      console.log('data received:', results, results.results.length);
      // add results array
      this.setState({'repos': results.results}, () => {
      // clear out text box
      });
    })
  }

  componentDidMount() {
    $.ajax({ 
      type: "GET",
      url: 'http://127.0.0.1:1128/repos', 
      dataType: 'application/json',
      success: function() {
        console.log('success handler fired!');
      },
      error: function() {
        console.log('error handler fired!');
      }
    })
    .always(data => {
      console.log(data, typeof data);
      let results = JSON.parse(data.responseText);
      console.log('data received:', results, results.results.length);
      // add results array
      this.setState({'repos': results.results}, () => {
      // clear out text box
      });
    })
  }

  render () {
    return (<div>
      <h1>Github Fetcher</h1>
      <RepoList repos={this.state.repos}/>
      <Search onSearch={this.search.bind(this)}/>
    </div>)
  }
}

ReactDOM.render(<App />, document.getElementById('app'));