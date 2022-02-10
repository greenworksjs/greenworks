import execa from 'execa'
import mri from 'mri'

const argv = process.argv.slice(2)
const args = mri(argv)

const {
  os, runtime, arch,
}: Args = args as unknown as Args

const association = {
    'ubuntu-latest': 'linux',
    'windows-latest': 'win32',
    'macos-latest': 'darwin',
  }

void (async (): Promise<void> => {
    console.log('testing', os, runtime, arch)

    if (runtime === 'node') {
        const { stderr, stdout } = await execa('node', ['./node.js', association[os], arch])
        console.log('stderr', stderr)
        console.log('stdout', stdout)
    } else {
        console.log('TODO')
    }
})()