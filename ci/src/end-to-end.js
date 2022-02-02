const nwDownload = require('./nwjsDownloader');
const electronDownloader = require('./electronDownloader');
const { getLibPath } = require('./utils');


// electronDownloader('5.0.1', 'x64').then(out => {
//     console.log(out);
//     if (out.stdout.includes('Error on initializing steam API. Error: Steam initialization failed. Steam is not running.')) {
//         console.log('it\'s working!');
//         return true;
//     } else {
//         console.log('it failed!');
//     }
// });


nwDownload('0.42.0', 'x64').then((out) => {
  console.log('out', out);
  if (out.stderr.includes('Error on initializing steam API. Error: Steam initialization failed. Steam is not running.')) {
    console.log('it\'s working!');
    return true;
  }
  console.log('it failed!');
});
