
// th train.lua -data_dir data/rupert/ -rnn_size 256 -num_layers 2 -seq_length 64 -batch_size 32 -dropout 0.25

var spawn = require('child_process').spawn;

var params = ['sample.lua', 'rnn/tbird_031517_cpu.t7', '-length', '200'];
params[4] = '-temperature';
params[5] = 0.2;
params[6] = '-primetext';
params[7] = 'How';
params[8] = '-seed';
params[9] = Math.floor(Math.random()*1000);
//console.log(params[5]);

var proc = spawn('th', params);
proc.stdout.on('data', reply);
proc.stderr.on('data', error);

function error(data) {
  var results = data.toString();
  console.log(results);
}

function reply(data) {
  var results = data.toString();
  console.log(results);
}
