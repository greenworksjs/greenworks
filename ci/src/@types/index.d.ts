interface MbaVersion {
  version: string;
  abi: number;
  runtime: 'electron' | 'nwjs' | 'node';
}

declare module 'modules-abi' {
  function getAll(): Promise<MbaVersion[]>;
}

interface Args {
  os: 'macos-latest' | 'ubuntu-latest' | 'windows-latest';
  runtime: 'nwjs' | 'electron' | 'node';
  arch: 'ia32' | 'x64';
  python: string;
}

declare module 'unzipper'
declare module 'tar'
