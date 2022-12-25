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
const stripeBOM = (content: string) =>
  content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
const prependBOM = (content: string) =>
  String.fromCharCode(0xfeff).concat(content);
const writeJsonValue = async (srcFileName: string, dstFileName: string) => {
  try {
    const srcText = await Deno.readTextFile(srcFileName);
    const dstText = await Deno.readTextFile(dstFileName);
    const src = JSON.parse(stripeBOM(srcText));
    const dst = JSON.parse(stripeBOM(dstText));
    const merged = merge(src, dst);
    await Deno.writeTextFile(
      dstFileName,
      prependBOM(JSON.stringify(merged, null, 4)),
    );
  } catch (e) {
    if (e instanceof Error) {
      console.error(`${srcFileName} -> ${dstFileName}`);
      console.error(e.message);
    }
  }
};
const merge = (src: any, dst: any) => {
  if (src instanceof String || typeof src === 'string') {
    return dst;
  }
  if (src instanceof Number || typeof src === 'number') {
    return dst;
  }
  if (src instanceof Boolean || typeof src === 'boolean') {
    return dst;
  }
  if (src === null) {
    return dst;
  }
  if (Array.isArray(src)) {
    return mergeArray(src, dst);
  }
  return mergeObject(src, dst);
};
const mergeObject = (src: any, dst: any) =>
  Object.keys(dst).reduce(
    (a, c) => (src[c] === undefined ? a : { ...a, [c]: src[c] }),
    dst,
  );
const mergeArray = (src: Array<any>, dst: Array<any>): Array<any> =>
  src.map((e: any, i) => merge(e, dst[i]));
