import { init } from './config.ts';
import { mv, prepareNew, mvBack, promoteDir } from './fileManipulator.ts';
import { copyParameters } from './copy.ts';

const { installPath: installDir, targetVersion: upgradeTarget } = await init(
  Deno.args,
);
let dst = '';
let src = '';
try {
  dst = await prepareNew(upgradeTarget, installDir);
  src = await mv(installDir);
  await copyParameters(src, dst);
  await promoteDir(dst);
} catch (e) {
  if (e instanceof Error) {
    console.error(e.message);
    console.error(e.stack);
  }
  if (src !== '') {
    console.info('roll back');
    mvBack(src, installDir);
  }
}
