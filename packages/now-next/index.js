const { createLambda } = require('@now/build-utils/lambda.js');
const download = require('@now/build-utils/fs/download.js');
const FileFsRef = require('@now/build-utils/file-fs-ref.js');
const path = require('path');
const { writeFile, unlink } = require('fs.promised');
const {
  runNpmInstall,
  runPackageJsonScript,
} = require('@now/build-utils/fs/run-user-scripts.js');
const glob = require('@now/build-utils/fs/glob.js');
const {
  validateEntrypoint,
  includeOnlyEntryDirectory,
  moveEntryDirectoryToRoot,
  excludeLockFiles,
  excludeStaticDirectory,
  onlyStaticDirectory,
} = require('./utils');

/** @typedef { import('@now/build-utils/file-ref').Files } Files */
/** @typedef { import('@now/build-utils/fs/download').DownloadedFiles } DownloadedFiles */

/**
 * @typedef {Object} BuildParamsType
 * @property {Files} files - Files object
 * @property {string} entrypoint - Entrypoint specified for the builder
 * @property {string} workPath - Working directory for this build
 */

/**
 * Write .npmrc with npm auth token
 * @param {string} workPath
 * @param {string} token
 */
async function writeNpmRc(workPath, token) {
  await writeFile(
    path.join(workPath, '.npmrc'),
    `//registry.npmjs.org/:_authToken=${token}`,
  );
}

exports.config = {
  maxLambdaSize: '5mb',
};

/**
 * @param {BuildParamsType} buildParams
 * @returns {Promise<Files>}
 */
exports.build = async ({ files, workPath, entrypoint }) => {
  validateEntrypoint(entrypoint);

  console.log('downloading user files...');
  const entryDirectory = path.dirname(entrypoint);
  const filesOnlyEntryDirectory = includeOnlyEntryDirectory(
    files,
    entryDirectory,
  );
  const filesWithEntryDirectoryRoot = moveEntryDirectoryToRoot(
    filesOnlyEntryDirectory,
    entryDirectory,
  );
  const filesWithoutLockfiles = excludeLockFiles(filesWithEntryDirectoryRoot);
  const filesWithoutStaticDirectory = excludeStaticDirectory(
    filesWithoutLockfiles,
  );

  await download(filesWithoutStaticDirectory, workPath);

  if (process.env.NPM_AUTH_TOKEN) {
    console.log('found NPM_AUTH_TOKEN in environment, creating .npmrc');
    await writeNpmRc(workPath, process.env.NPM_AUTH_TOKEN);
  }

  console.log('running npm install...');
  await runNpmInstall(workPath);
  console.log('running user script...');
  await runPackageJsonScript(workPath, 'now-build');

  if (process.env.NPM_AUTH_TOKEN) {
    await unlink(path.join(workPath, '.npmrc'));
  }

  console.log('preparing lambda files...');
  const launcherFiles = {
    'now__bridge.js': new FileFsRef({ fsPath: require('@now/node-bridge') }),
    'now__launcher.js': new FileFsRef({
      fsPath: path.join(__dirname, 'launcher.js'),
    }),
  };
  const pages = await glob(
    '**/*.js',
    path.join(workPath, '.next', 'serverless', 'pages'),
  );

  const pageKeys = Object.keys(pages);

  if (pageKeys.length === 0) {
    throw new Error(
      'No serverless pages were built. https://err.sh/zeit/now-builders/now-next-no-serverless-pages-built',
    );
  }

  const lambdas = {};
  await Promise.all(
    pageKeys.map(async (page) => {
      // These default pages don't have to be handled as they'd always 404
      if (['_app.js', '_error.js', '_document.js'].includes(page)) {
        return;
      }

      const pathname = page.replace(/\.js$/, '');

      console.log(`Creating lambda for page: "${page}"...`);
      lambdas[path.join(entryDirectory, pathname)] = await createLambda({
        files: {
          ...launcherFiles,
          'page.js': pages[page],
        },
        handler: 'now__launcher.launcher',
        runtime: 'nodejs8.10',
      });
      console.log(`Created lambda for page: "${page}"`);
    }),
  );

  const nextStaticFiles = await glob(
    '**',
    path.join(workPath, '.next', 'static'),
  );
  const staticFiles = Object.keys(nextStaticFiles).reduce(
    (mappedFiles, file) => ({
      ...mappedFiles,
      [path.join(entryDirectory, `_next/static/${file}`)]: nextStaticFiles[file],
    }),
    {},
  );

  const nextStaticDirectory = onlyStaticDirectory(filesWithoutLockfiles);
  const staticDirectoryFiles = Object.keys(nextStaticDirectory).reduce(
    (mappedFiles, file) => ({
      ...mappedFiles,
      [path.join(entryDirectory, file)]: nextStaticDirectory[file],
    }),
    {},
  );

  return { ...lambdas, ...staticFiles, ...staticDirectoryFiles };
};
