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

const pythonPath = python

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

/**
 * Get release or create one based on the branch and the version from the package.json
 */
/* const getRelease = async (): Promise<Release> => {
  const releases = await listReleases();

  let branch: string;
  if (process.env.APPVEYOR_REPO_BRANCH) {
    branch = process.env.APPVEYOR_REPO_BRANCH;
  } else if (process.env.TRAVIS_BRANCH) {
    branch = process.env.TRAVIS_BRANCH;
  } else {
    branch = 'unknown';
  }

  const tagName = `v${pkg.version}${branch === 'master' ? '' : `-${branch}`}`;
  const release = releases.find((r) => r.tag_name === tagName);

  if (release) {
    console.log('Release exist, skipping');
    return release;
  }

  console.log(`Release not found, creating ${tagName} ...`);
  const data = {
    tag_name: tagName,
    name: tagName,
    draft: true,
    prerelease: false,
  };

  return createRelease(data);
}; */

/* const upload = async (assetLabel, release, arch) => {
  console.log(`Done ${assetLabel}`);

  const filePath = getBinaryName(arch);
  shelljs.ls(path.dirname(filePath));

  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} not found!`);
    return undefined;
  }

  try {
    const assetExist = release.assets.find((asset) => asset.name === assetLabel);
    if (assetExist) {
      console.log('Asset already exists !\nDeleting');
      await deleteAsset(assetExist.url);
    }
  } catch (e) {
    console.log('Error while deleting asset:');
    const json = JSON.parse(e.body);

    console.log('travis_fold:start:error');
    console.log(json);
    console.log('travis_fold:end:error');
  }

  try {
    await uploadAsset(filePath, assetLabel, release);
    console.log('Upload done');
  } catch (e) {
    console.log('Error while uploading asset:');
    console.log(e);
    console.log(e.response.body);
    console.log(e.response.error);
    const json = JSON.parse(e.body);
    if (json.errors && json.errors[0] && json.errors[0].code === 'already_exists') {
      console.log('Asset already exists');
    } else {
      console.log('travis_fold:start:error');
      console.log(json);
      console.log('travis_fold:end:error');
    }
  }

  return true;
}; */

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
      '--dist-url=https://electronjs.org/headers',
      `--python=${pythonPath}`,
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
    ['rebuild', '--release', `--target=${version}`, `--arch=${arch}`, `--python=${pythonPath}`, '--build_v8_with_gn=false'],
    {
      cwd: GREENWORKS_ROOT,
    },
  )
}

const nwjsRebuild = async (version: string): Promise<void> => {
  await execa(
    path.resolve(path.join(__dirname, '..', 'node_modules', '.bin', `nw-gyp${os === 'windows-latest' ? '.cmd' : ''}`)),
    ['rebuild', '--release', `--target=${version}`, `--arch=${arch}`, `--python=${pythonPath}`],
    {
      cwd: GREENWORKS_ROOT,
    },
  )
}

const getVersions = async (): Promise<any> => {
  let everything = await abis.getAll()

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

    if (version.abi < 70) {
      // eslint-disable-next-line
      continue
    }

    if (
      runtime === 'electron' && os === 'macos-latest' && arch === 'ia32'
    ) {
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

  console.log('filePath', filePath)

  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} not found!`)
    return
  }

  const dest = path.join(ARTIFACTS_ROOT, assetLabel)

  console.log('dest', dest)

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
