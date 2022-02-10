console.log('process.argv', process.argv)
var greenworks = require(`../../artifacts/greenworks-node-${process.argv[2]}-${process.argv[3]}.node`);

console.log('greenworks', greenworks)
console.log('done ?', greenworks.initialize());
