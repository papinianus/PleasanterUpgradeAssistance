import { join } from 'https://deno.land/std/path/mod.ts';

export const githubUrl = (version: string) =>
  `https://github.com/Implem/Implem.Pleasanter/releases/download/Pleasanter_${version}/Pleasanter_${version}.zip`;

export const releaseZip = (version: string) => `Pleasanter_${version}.zip`;

export const License = (parentPath: string) =>
  join(parentPath, 'Implem.License.dll');

export const pleasanterDir = (installPath: string) =>
  join(installPath, 'Implem.Pleasanter');

export const codeDefinerDir = (installPath: string) =>
  join(installPath, 'Implem.CodeDefiner');

export const paramsDir = (installPath: string) =>
  join(pleasanterDir(installPath), 'App_Data', 'Parameters');
