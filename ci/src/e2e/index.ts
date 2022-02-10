import mri from 'mri'

const argv = process.argv.slice(2)
const args = mri(argv)

// import electron from './electron'
// import nwjs from './electron'
import node from './node'

const {
  os, runtime, arch,
}: Args = args as unknown as Args

void (async (): Promise<void> => {
    console.log('testing', os, runtime, arch)

    if (runtime === 'node'){
        await node(os, arch)
    } else{
        console.log('TODO')
    }
})()