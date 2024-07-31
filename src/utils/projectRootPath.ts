// package.json所在文件夹就是项目的根目录
async function projectRootPath(): Promise<string> {
  /**
   * @ts-ignore 问题: pkg-dir 是 ESM 模块，ts会将ESM(异步)引入的模块转换成CommonJS，导致运行时CommonJS模块无法被识别，因为pkg-dir只是一个ESM模块
   * 参考：https://stackoverflow.com/questions/70545129/compile-a-package-that-depends-on-esm-only-library-into-a-commonjs-package
   * 使用 eval 引入 pkg-dir
   */
  // const pkgDir = await import('pkg-dir');
  const pkgDir = await (eval(`import('pkg-dir')`) as Promise<
    typeof import('pkg-dir')
  >);

  const projectRootPath = await pkgDir.packageDirectory();
  return projectRootPath;
}

export default projectRootPath;
