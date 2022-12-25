import { v7 } from 'https://deno.land/x/uuid7@v0.0.1/mod.ts';
import { join } from 'https://deno.land/std@0.170.0/path/mod.ts';
import {
  download,
  Destination,
} from 'https://deno.land/x/download@v1.0.1/mod.ts';
import { decompress } from 'https://deno.land/x/zip@v1.2.4/mod.ts';
import { releaseZip, githubUrl } from './consts.ts';

const newEnvTempDir = 'candidate';
const pleasanter = 'pleasanter';

export const mv = async (path: string) => {
  const uuid7 = v7();
  const backUpPath = join(path, '..', uuid7);
  console.log(path);
  console.log(backUpPath);
  await Deno.rename(path, backUpPath);
  return backUpPath;
};

export const mvBack = async (current: string, installPath: string) => {
  await Deno.rename(current, installPath);
};

export const promoteDir = async (dst: string) => {
  const newEnv = join(dst).endsWith(newEnvTempDir)
    ? join(dst, '..', pleasanter)
    : dst;
  await Deno.rename(dst, newEnv);
};

const dl = async (version: string, path: string) => {
  console.info(`Download start ${new Date().toISOString()}`);
  const url = githubUrl(version);
  const dest: Destination = {
    dir: join(path, '..'),
    file: releaseZip(version),
  };
  try {
    await download(url, dest);
    console.info(`Download end ${new Date().toISOString()}`);
  } catch (e) {
    if (e instanceof Deno.errors.Http) {
      console.error(
        `network error please check ${version} and ${url}.\nerror was :: ${e.message}`,
      );
      Deno.exit(1);
    }
  }
};
const extract = async (zipPath: string, extractDir: string) => {
  const result = await decompress(zipPath, extractDir);
  if (result === false) {
    console.error('unzip error');
    Deno.exit(1);
  }
  console.info(`decompressed ${result} ${new Date().toISOString()}`);
  const expectedDirInResult = join(result, pleasanter);
  for await (const entry of Deno.readDir(expectedDirInResult)) {
    console.log(entry.name);
    await Deno.rename(
      join(expectedDirInResult, entry.name),
      join(extractDir, entry.name),
    );
  }
  await Deno.remove(expectedDirInResult);
  return extractDir;
};

export const prepareNew = async (version: string, path: string) => {
  const extractDir = join(path, '..', newEnvTempDir);
  try {
    const target = await Deno.lstat(extractDir);
    if (target.isDirectory) {
      console.log(`${extractDir} exists skip download and unzip`);
      return extractDir;
    }
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) {
      throw e;
    }
  }
  const zipFile = join(path, '..', releaseZip(version));
  try {
    const target = await Deno.lstat(zipFile);
    if (target.isFile) {
      console.log(`${zipFile} exists. skip download`);
    }
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      await dl(version, path);
    }
  }
  const result = await extract(zipFile, extractDir);
  return result;
};
