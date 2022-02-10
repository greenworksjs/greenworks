interface MbaVersion {
  version: string;
  abi: number;
  runtime: 'electron' | 'nwjs' | 'node';
}

declare module 'modules-abi' {
  function getAll(): Promise<MbaVersion[]>;
}


declare module 'unzipper'
declare module 'tar'
