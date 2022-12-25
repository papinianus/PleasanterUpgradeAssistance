import { v7 } from 'https://deno.land/x/uuid7@v0.0.1/mod.ts';
import { join } from 'https://deno.land/std@0.170.0/path/mod.ts';
import {
  download,
  Destination,
} from 'https://deno.land/x/download@v1.0.1/mod.ts';
import { decompress } from 'https://deno.land/x/zip@v1.2.4/mod.ts';
import { releaseZip, githubUrl } from './consts.ts';

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

const dl = async (version: string, path: string) => {
  const url = githubUrl(version);
  const dest: Destination = {
    dir: join(path, '..'),
    file: releaseZip(version),
  };
  try {
    await download(url, dest);
  } catch (e) {
    if (e instanceof Deno.errors.Http) {
      console.error(
        `network error please check ${version} and ${url}.\nerror was :: ${e.message}`,
      );
      Deno.exit(1);
    }
  }
};

export const unzip = async (version: string, path: string) => {
  const extractDir = join(path, '..', 'candidate');
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
      console.info(`Download start ${new Date().toISOString()}`);
      await dl(version, path);
      console.info(`Download end ${new Date().toISOString()}`);
    }
  }
  console.info(`decompressing ${extractDir} ${new Date().toISOString()}`);
  const result = await decompress(releaseZip(version), join(extractDir));
  if (result === false) {
    console.error('unzip error');
    Deno.exit(1);
  }
  console.info(`decompressed ${result} ${new Date().toISOString()}`);
  return result;
};
