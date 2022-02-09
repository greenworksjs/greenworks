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

// eslint-disable-next-line
require('dotenv').config()
// eslint-disable-next-line
require('source-map-support').install()

const getUnique = (versions: MbaVersion[], key: keyof MbaVersion): MbaVersion[] => versions
  .map((e) => e[key])
  .map((e, i, final) => final.indexOf(e) === i && i)
  // @ts-ignore
  .filter((e) => versions[e])
  // @ts-ignore
  .map((e) => versions[e])

function slash(slashPath: string) {
  const isExtendedLengthPath = /^\\\\\?\\/.test(slashPath)
  const hasNonAscii = /[^\u0000-\u0080]+/.test(slashPath) // eslint-disable-line no-control-regex

  if (isExtendedLengthPath || hasNonAscii) {
    return slashPath
  }

  return slashPath.replace(/\\/g, '/')
}

interface Args {
  os: 'macos-latest' | 'ubuntu-latest' | 'windows-latest';
  runtime: 'nw.js' | 'electron' | 'node';
  arch: 'ia32' | 'x64';
  python: string;
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

const pythonPath = python ? slash(python) : undefined

function getBinaryName(_arch: 'ia32' | 'x64'): string {
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
}

const electronRebuild = async (version: string): Promise<void> => {
  const { stderr, stdout } = await execa(
    path.resolve(
      path.join(__dirname, '..', 'node_modules', '.bin', `node-gyp${os === 'windows-latest' ? '.cmd' : ''}`),
    ),
    [
      'rebuild',
      '--release',
      `--target=${version}`,
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

const nodeRebuild = async (version: string): Promise<void> => {
  await execa(
    path.resolve(
      path.join(__dirname, '..', 'node_modules', '.bin', `node-gyp${os === 'windows-latest' ? '.cmd' : ''}`),
    ),
    [
      'rebuild',
      '--release',
      `--target=${version}`,
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

const nwjsRebuild = async (version: string): Promise<void> => {
  await execa(
    path.resolve(path.join(__dirname, '..', 'node_modules', '.bin', `nw-gyp${os === 'windows-latest' ? '.cmd' : ''}`)),
    [
      'rebuild',
      '--release',
      `--target=${version}`,
      `--arch=${arch}`,
      `--openssl_fips=false`,
      // `--python=${pythonPath}`
    ],
    {
      cwd: GREENWORKS_ROOT,
    },
  )
}

const getVersions = async (): Promise<any> => {
  let everything = await abis.getAll()

  everything = everything
    .filter((e) => !e.version.includes(('alpha')))

  everything = everything
    .filter((e) => !e.version.includes(('unsupported')))

  if (runtime === 'electron') {
    everything = getUnique(
      everything.filter((entry) => entry.runtime === 'electron'),
      'abi',
    )
  }

  if (runtime === 'nw.js') {
    everything = getUnique(
      everything.filter((entry) => entry && entry.runtime === 'nw.js'),
      'abi',
    )
  }
  if (runtime === 'node') {
    everything = getUnique(
      everything.filter((entry) => entry.runtime === 'node'),
      'abi',
    )
  }

  const matrix: any[] = []
  for (let i = 0; i < everything.length; i += 1) {
    const version = everything[i]

    // abi 93 is node 14 LTS
    if (version.abi < 83) {
      // eslint-disable-next-line
      continue
    }

    matrix.push({
      runtime,
      abi: version.abi,
      version: version.version,
      arch,
      os,
    })
  }

  return matrix
}

const build = async (matrix: any): Promise<void> => {
  console.log(`v${matrix.version}@${matrix.abi} - ${matrix.runtime} - ${matrix.arch}`)

  // @ts-ignore
  const assetLabel = `greenworks-${matrix.runtime}-v${matrix.abi}-${association[matrix.os]}-${matrix.arch}.node`

  switch (runtime) {
    case 'electron':
      await electronRebuild(matrix.version)
      break

    case 'nw.js':
      await nwjsRebuild(matrix.version)
      break

    case 'node':
      await nodeRebuild(matrix.version)
      break

    default:
      console.log('Unsupported runtime, use one of electron, node-webkit, node')
      return
  }

  const filePath = getBinaryName(matrix.arch)

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

  const versions = await getVersions()

  for (let index = 0; index < versions.length; index += 1) {
    const version = versions[index]
    try {
      await build(version)
      console.log('Done')
    } catch (e) {
      console.log('Error during build', e)
    }
  }
})()
