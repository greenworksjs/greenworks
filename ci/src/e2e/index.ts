import execa from 'execa'
import mri from 'mri'
import path from 'path'
import fs from 'fs-extra'

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

const steamAssoc = (arch: string, os: string) => {
    const computedArch = arch === 'ia32' ? '32' : '64'

    const ass = {
        'ubuntu-latest': 'linux' + computedArch,
        'windows-latest': 'win' + computedArch,
        'macos-latest': 'osx',
    }

    // @ts-ignore
    return ass[os]
}

void (async (): Promise<void> => {
    console.log('testing', os, runtime, arch)

    if (runtime === 'node') {
        const steamBinaryPath = path.join(
            __dirname,
            '..',
            '..',
            '..',
            'deps',
            'steamworks_sdk',
            'redistributable_bin',
            steamAssoc(arch, os)
        )

        const artifactsPath = path.join(__dirname, '../../artifacts')

        await fs.copy(steamBinaryPath, artifactsPath)

        const { stderr: a, stdout: b } = await execa('ls', [artifactsPath])
        console.log('stderr', a)
        console.log('stdout', b)

        const { stderr, stdout } = await execa('node', [
            path.join(__dirname, './node.js'),
            association[os],
            arch
        ], { cwd: __dirname })
        console.log('stderr', stderr)
        console.log('stdout', stdout)

        if (!stderr.includes('did not locate a running instance of Steam')) {
            throw new Error('Test failed' + stderr)
        }
    } else {
        console.log('TODO')
    }
})()