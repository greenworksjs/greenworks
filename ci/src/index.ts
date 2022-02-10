/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-loop-func */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-await-in-loop */
import execa from 'execa'
import path from 'path'
import fs from 'fs-extra'
import mri from 'mri'
import abis from 'modules-abi'
// const electronDownload = import './electronDownloader')
// const nwjsDownloader = import './nwjsDownloader')

const ELECTRON_VERSION = '17.0.0'
const NWJS_VERSION = '0.61.0'
const NODE_VERSION = process.env.NODE_VERSION || '16.14.0'

// eslint-disable-next-line
require('dotenv').config()
// eslint-disable-next-line
require('source-map-support').install()

function slash(slashPath: string) {
  const isExtendedLengthPath = /^\\\\\?\\/.test(slashPath)
  const hasNonAscii = /[^\u0000-\u0080]+/.test(slashPath) // eslint-disable-line no-control-regex

  if (isExtendedLengthPath || hasNonAscii) {
    return slashPath
  }

  return slashPath.replace(/\\/g, '/');
}

const GREENWORKS_ROOT = path.join(process.cwd())
const ARTIFACTS_ROOT = path.join(process.cwd(), 'ci', 'artifacts')

const argv = process.argv.slice(2)
const args = mri(argv)

const association = {
  'ubuntu-latest': 'linux',
  'windows-latest': 'win32',
  'macos-latest': 'darwin',
}

const {
  os, runtime, arch, python,
}: Args = args as unknown as Args

// const pythonPath = python ? slash(python) : undefined

const getBinaryName = (_arch: 'ia32' | 'x64'): string => {
  let name = 'greenworks-'

  switch (os) {
    case 'windows-latest':
      name += 'win'
      break
    case 'macos-latest':
      name += 'osx'
      break
    case 'ubuntu-latest':
      name += 'linux'
      break
    default:
      break
  }

  name += `${_arch === 'ia32' ? '32' : '64'}.node`
  return path.resolve(path.join(GREENWORKS_ROOT, 'build', 'Release', name))
};

const electronRebuild = async (): Promise<void> => {
  const { stderr, stdout } = await execa(
    path.resolve(
      path.join(__dirname, '..', 'node_modules', '.bin', `node-gyp${os === 'windows-latest' ? '.cmd' : ''}`),
    ),
    [
      'rebuild',
      '--release',
      `--target=${ELECTRON_VERSION}`,
      `--arch=${arch}`,
      `--openssl_fips=false`,
      '--dist-url=https://electronjs.org/headers',
      // `--python=${pythonPath}`,
    ],
    {
      cwd: GREENWORKS_ROOT,
    },
  )
}

const nodeRebuild = async (): Promise<void> => {
  await execa(
    path.resolve(
      path.join(__dirname, '..', 'node_modules', '.bin', `node-gyp${os === 'windows-latest' ? '.cmd' : ''}`),
    ),
    [
      'rebuild',
      '--release',
      `--target=${NODE_VERSION}`,
      `--arch=${arch}`,
      `--openssl_fips=false`,
      // `--python=${pythonPath}`,
      // '--build_v8_with_gn=false'
    ],
    {
      cwd: GREENWORKS_ROOT,
    },
  )
}

const nwjsRebuild = async (): Promise<void> => {
  await execa(
    path.resolve(path.join(__dirname, '..', 'node_modules', '.bin', `nw-gyp${os === 'windows-latest' ? '.cmd' : ''}`)),
    [
      'rebuild',
      '--release',
      `--target=${NWJS_VERSION}`,
      `--arch=${arch}`,
      `--openssl_fips=false`,
      // `--python=${pythonPath}`
    ],
    {
      cwd: GREENWORKS_ROOT,
    },
  )
}

const build = async (): Promise<void> => {
  //os, runtime, arch

  // @ts-ignore
  const assetLabel = `greenworks-${runtime}-${association[os]}-${arch}.node`

  switch (runtime) {
    case 'electron':
      await electronRebuild()
      break

    case 'nwjs':
      await nwjsRebuild()
      break

    case 'node':
      await nodeRebuild()
      break

    default:
      console.log('Unsupported runtime, use one of electron, node-webkit, node')
      return
  }

  const filePath = getBinaryName(arch)

  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} not found!`)
    return
  }

  const dest = path.join(ARTIFACTS_ROOT, assetLabel)

  console.log('Output:', dest)

  await fs.copy(filePath, dest)
}

// eslint-disable-next-line no-void
void (async (): Promise<void> => {
  await fs.remove(path.resolve(path.join(GREENWORKS_ROOT, 'bin')))
  await fs.remove(path.resolve(path.join(GREENWORKS_ROOT, 'build')))
  await fs.ensureDir(ARTIFACTS_ROOT)

  await build()
})()
