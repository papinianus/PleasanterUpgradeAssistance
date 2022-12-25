import { License, pleasanterDir, codeDefinerDir, paramsDir } from './consts.ts';
import { copy } from 'https://deno.land/std@0.170.0/fs/mod.ts';
import { join } from 'https://deno.land/std@0.170.0/path/mod.ts';

export const copyParameters = async (src: string, dst: string) => {
  console.log(`start copy ${new Date().toISOString()}`);
  await copyLicense(src, dst);
  console.log(`copy App_Data/Parameters subs ${new Date().toISOString()}`);
  await copyParamSubDir(src, dst);
  console.log(`copy App_Data/Parameters jsons ${new Date().toISOString()}`);
  await copyParam(src, dst);
  console.log(`end copy ${new Date().toISOString()}`);
};

const copyLicense = async (src: string, dst: string) => {
  const dll = License(pleasanterDir(src));
  await Deno.copyFile(dll, License(pleasanterDir(dst)));
  await Deno.copyFile(dll, License(codeDefinerDir(dst)));
};

const copyParamSubDir = async (src: string, dst: string) => {
  const paramInSrc = paramsDir(src);
  const paramInDst = paramsDir(dst);
  for await (const entry of Deno.readDir(paramInSrc)) {
    if (entry.isFile) {
      continue;
    }
    const dirName = entry.name;
    await copy(join(paramInSrc, dirName), join(paramInDst, dirName), {
      overwrite: true,
    });
  }
};

const copyParam = async (src: string, dst: string) => {
  const paramInSrc = paramsDir(src);
  const paramInDst = paramsDir(dst);
  for await (const entry of Deno.readDir(paramInSrc)) {
    if (entry.isDirectory) {
      continue;
    }
    const fileName = entry.name;
    if (!fileName.endsWith('.json')) {
      continue;
    }
    const srcFileName = join(paramInSrc, fileName);
    const dstFileName = join(paramInDst, fileName);
    await writeJsonValue(srcFileName, dstFileName);
  }
};

const writeJsonValue = async (srcFileName: string, dstFileName: string) => {
  try {
    const src = JSON.parse(await Deno.readTextFile(srcFileName));
    const dst = JSON.parse(await Deno.readTextFile(dstFileName));
    const merged = Object.keys(dst).reduce(
      (a, c) => (src[c] === undefined ? a : { ...a, [c]: src[c] }),
      dst,
    );
    await Deno.writeTextFile(dstFileName, JSON.stringify(merged, null, 4));
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
      console.error(e.stack);
    }
  }
};
