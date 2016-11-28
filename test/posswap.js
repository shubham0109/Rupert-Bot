function tokenize(s) {
  return s.split(/([A-Z0-9'#]+)/i);
}



function preload() {
  txt = loadStrings('rupert.txt');
}

var txt;
var hashtags = [];
var posdict;

function setup() {
  noCanvas();

  posdict = new POS();
  for (var i = 0; i < txt.length; i++) {
    posdict.process(txt[i]);
  }
  posdict.clearNNP();

  button = createButton('generate a tweet');
  button.mousePressed(tweetIt);

  button = createButton('clear');
  button.mousePressed(clearIt);
}



function tweetIt() {

  var tweet;

  var output = [];
  var index = floor(random(txt.length));
  var start = txt[index];
  // console.log(start);

  var tokens = tokenize(start);

  for (var i = 0; i < tokens.length; i++) {
    var pos = RiTa.getPosTags(tokens[i]);
    var p = pos[0];
    var options = posdict.dict[p];
    if (options) {
      var r = random(1);
      var swap = false;

      // Proper Noun
      // console.log('pos: ' + p);
      if (p == 'nnp' && r < 0.8) {
        swap = true;
      } else if (r < 0.4) {
        swap = true;
      }

      if (swap) {
        var replace = random(options);
        console.log(pos[0] + ' ' + tokens[i] + ' --> ' + replace);
        replace = capitalize(tokens[i], replace);
        output.push(replace);
      } else {
        output.push(tokens[i]);
      }
    } else {
      output.push(tokens[i]);
    }
  }

  tweet = output.join('');

  if (tweet == start) {
    console.log("dup!");
    tweetIt();
  } else {
    tweet = tweet.replace(/@/,'#');

    var par = createP('').class('tweets');
    createDiv(start).parent(par).class('old');
    createDiv(tweet).parent(par).class('new');
  }

  function capitalize(before, after) {
    if (after == 'I') {
      return after;
    }

    if (/^[A-Z]+$/.test(before)) {
      return after.toUpperCase();
    } else if (/^[a-z]+$/.test(before)) {
      return after.toLowerCase();
    } else if (/^[A-Z][a-z]*$/.test(before)) {
      var c = after.charAt(0).toUpperCase();
      return c + after.substring(1, after.length);
    }
    return after;

  }





}

function clearIt() {
  var pars = selectAll('.tweets');
  for (var i = 0; i < pars.length; i++) {
    pars[i].remove();
  }


}
