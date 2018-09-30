var Hb = require('handlebars');
var fs = require('fs');
var path = require('path');
var folder = process.argv[2];
var data = require(path.join(__dirname, 'src', folder, 'data'));
Hb.registerHelper('querystring', function(obj) {
  return Object.keys(obj).map(function(prop) {
    return prop + '=' + encodeURIComponent(obj[prop])
  }).join('&');
});

var template;
data.tracks.forEach(function(t, i) {
  t.index = i + 1;
});
data.iframe.width = data.iframe.width - 1;
var svg;
try {
  svg = fs.readFileSync(path.join(__dirname, 'nostalgic-cafe.svg'), {encoding: 'utf-8'});
  data.svg = svg.replace(/.*\n/, '');
} catch(err) {
  console.log(err);
}

try {
  template = fs.readFileSync(path.join(__dirname, 'src', folder, 'index.html'), {encoding: 'utf-8'});
} catch(err) {
  console.log(err);
}
var distFolders = fs.readdirSync(path.join(__dirname, 'dist'));
var distScenePath = path.join(__dirname, 'dist', folder);

if (distFolders.indexOf(folder) === -1) {
  fs.mkdirSync(distScenePath);
}

fs.writeFileSync(path.join(distScenePath, 'index.html'), Hb.compile(template)(data)); 