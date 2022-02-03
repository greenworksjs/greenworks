const spawn = require('child_process').spawn;
const readline = require('readline');

const exec = async (cmd, args) => {
  return new Promise((resolve, reject) => {
    const execCmd    = spawn(cmd, args);

    execCmd.stdout.on('data', function (data) {
      console.log(data.toString());
    });

    execCmd.stderr.on('data', function (data) {
      console.log('stderr: ' + data.toString());
    });

    execCmd.on('exit', function (code) {
      console.log('child process exited with code ' + code.toString());
      resolve(true)
    });
  })
}

const commands = ["7z", "p7zip"];

(async () => {
  const cmd = commands[0]

  await exec(cmd, ['x', 'sdk.zip', '-o.', '-aoa'])

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Password: ', async (password) => {
    rl.close();

    await exec(cmd, ['a', 'sdk.zip', `-p${password}`, 'sdk'])
  });
})()
