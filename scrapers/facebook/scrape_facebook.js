var fs = require('fs');

var FB = require('fb');
var config = require('/.config');
FB.setAccessToken('config.token');

var all = [];
FB.api('Survivor/feed', 'get', gotPage);

function gotPage(res) {
  if(!res || res.error) {
    //console.log(!res ? 'error occurred' : res.error);
    console.log('nothing left pages')
    return;
  } else {
    var posts = res.data;
    for (var i = 0; i < posts.length; i++) {
      var id = posts[i].id;
      FB.api(id+'/comments', 'get', gotComments);
    }

    function gotComments(res) {
      if (!res || res.error) {
        console.log('nothing left comments');
        return;
      }
      var comments = res.data;
      for (var j = 0; j < comments.length; j++) {
        console.log('logging: ' + comments[j].created_time);
        all.push(comments[j].id + '\t' + comments[j].created_time + '\t' + comments[j].message);
      }
      if (res.paging && res.paging.next) {
        FB.api(id+'/comments/?after='+res.paging.cursors.after , 'get', gotComments);
        //console.log(res.paging.next);
      }
    };

    var next = res.paging.next.match(/until=\d+/)[0];
    FB.api('Survivor/feed/?'+next, 'get', gotPage);
  }



};

var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('ready? ', function(answer) {
  console.log(answer);
  console.log(all);
  var everything = all.join('\n');
  fs.writeFileSync('allcomments2.txt',everything);
  rl.close();
});
