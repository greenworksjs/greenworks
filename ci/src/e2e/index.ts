import mri from 'mri'

const argv = process.argv.slice(2)
const args = mri(argv)

const {
  os, runtime, arch,
}: Args = args as unknown as Args

void (async (): Promise<void> => {
    console.log('testing', os, runtime, arch)
})()