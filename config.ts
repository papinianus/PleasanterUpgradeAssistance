import { parse } from 'https://deno.land/std/flags/mod.ts';
import { join } from 'https://deno.land/std/path/mod.ts';
import { pleasanterDir, codeDefinerDir } from './consts.ts';

export const init = async (args: string[]) => {
  const config = argsToConfig(args);
  await verifyConfig(config);
  return config;
};

const argsToConfig = (args: string[]): Config => {
  const param = parse(args);
  const errors: string[] = [];
  if (typeof param.path !== 'string' || param.path === '') {
    errors.push('install path not specified(--path)');
  }
  if (typeof param.target !== 'string' || param.target === '') {
    errors.push('target version not specified(--target)');
  }
  if (errors.length > 0) {
    console.error(errors.join('\n'));
    Deno.exit(1);
  }
  return { installPath: param.path, targetVersion: param.target };
};

const verifyConfig = async (config: Config) => {
  if (!(await verifyInstallation(config.installPath))) {
    console.error("can't find installation");
    Deno.exit(1);
  }
  if (
    !(await await verifyTargetVersion(config.targetVersion, config.installPath))
  ) {
    console.error('version could be same or older than current version');
    Deno.exit(1);
  }
};

const verifyTargetVersion = async (version: string, path: string) => {
  const nextV = version.split('.').map(Number);
  if (nextV.length !== 4) return false;

  const deps = JSON.parse(
    await Deno.readTextFile(
      join(pleasanterDir(path), 'Implem.Pleasanter.deps.json'),
    ),
  );
  const runtime = deps?.runtimeTarget?.name ?? '';
  if (runtime === '')
    throw Error('wrong deps.json / runtimeTarget cannot parsed');
  const key = Object.keys(deps?.targets[runtime] ?? []).filter((k) =>
    k.startsWith('Implem.Pleasanter/'),
  )[0];
  if (key === undefined)
    throw Error('wrong deps.json / Plesanter key does not exist');
  const currentV = key.replace('Implem.Pleasanter/', '').split('.').map(Number);
  if (currentV.length !== 4)
    throw Error('wrong deps.json / cant parse version');
  return nextV.reduce((a, c, i) => a || c > currentV[i], false);
};

const verifyInstallation = async (path: string) => {
  try {
    const dir = await Deno.lstat(path);
    const pleasanterDirectory = await Deno.lstat(pleasanterDir(path));
    const codeDefinerDirectory = await Deno.lstat(codeDefinerDir(path));
    if (
      dir.isDirectory &&
      pleasanterDirectory.isDirectory &&
      codeDefinerDirectory.isDirectory
    ) {
      return true;
    }
    return false;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.error(`could not find the path : ${error.message}`);
      Deno.exit(1);
    } else if (error instanceof Deno.errors.PermissionDenied) {
      console.error(`could not access the path : ${error.message}`);
      Deno.exit(1);
    } else {
      throw error;
    }
  }
};

type Config = {
  installPath: string;
  targetVersion: string;
};
