interface MbaVersion {
  version: string;
  abi: number;
  runtime: string;
}

declare module 'modules-abi' {
  function getAll(): Promise<MbaVersion[]>;
}


declare module 'unzipper'
declare module 'tar'
