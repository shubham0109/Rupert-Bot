var request = require('request');
var fs = require('fs');
var url = 'https://www.reddit.com/user/RupertBoneham/comments/.json'

request(url, gotData);
var counter = 0;

var comments = '';

function gotData(error, response, body) {
  if (!error) {
    var data = JSON.parse(body).data;

    for (var i = 0; i < data.children.length; i++) {
      //console.log(data.children.body);
      comments += data.children[i].data.body;
      comments += '\n';
      counter++;
    }

    console.log(data.after);
    console.log(counter);
    if (data.after) {
      request(url + '?after=' + data.after, gotData);
    } else {
      console.log(counter);
      fs.writeFileSync('rupert_reddit.txt', comments);
    }
  }
}
