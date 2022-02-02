const fs = require('fs')

const package = fs.readFileSync('./package.json')

const pkg = JSON.parse(package)

console.log(`v${pkg.version}`)