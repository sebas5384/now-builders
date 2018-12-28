const {
  excludeFiles,
  validateEntrypoint,
  includeOnlyEntryDirectory,
  moveEntryDirectoryToRoot,
  excludeLockFiles,
  excludeStaticDirectory,
  onlyStaticDirectory,
} = require('@now/next/utils');
const FileRef = require('@now/build-utils/file-ref');

describe('excludeFiles', () => {
  it('should exclude files', () => {
    const files = {
      'pages/index.js': new FileRef({ digest: 'index' }),
      'package.json': new FileRef({ digest: 'package' }),
      'package-lock.json': new FileRef({ digest: 'package-lock' }),
    };
    const result = excludeFiles(
      files,
      filePath => filePath === 'package-lock.json',
    );
    expect(result['pages/index.js']).toBeDefined();
    expect(result['package.json']).toBeDefined();
    expect(result['package-lock.json']).toBeUndefined();
  });
});

describe('validateEntrypoint', () => {
  it('should allow package.json', () => {
    expect(validateEntrypoint('package.json')).toBeUndefined();
  });
  it('should allow nested package.json', () => {
    expect(validateEntrypoint('frontend/package.json')).toBeUndefined();
  });
  it('should allow next.config.js', () => {
    expect(validateEntrypoint('next.config.js')).toBeUndefined();
  });
  it('should allow nested next.config.js', () => {
    expect(validateEntrypoint('frontend/next.config.js')).toBeUndefined();
  });
  it('should not allow pages/index.js', () => {
    expect(() => validateEntrypoint('pages/index.js')).toThrow();
  });
});

describe('includeOnlyEntryDirectory', () => {
  it('should exclude files outside entry directory', () => {
    const entryDirectory = 'frontend';
    const files = {
      'frontend/pages/index.js': new FileRef({ digest: 'index' }),
      'package.json': new FileRef({ digest: 'package' }),
      'package-lock.json': new FileRef({ digest: 'package-lock' }),
    };
    const result = includeOnlyEntryDirectory(files, entryDirectory);
    expect(result['frontend/pages/index.js']).toBeDefined();
    expect(result['package.json']).toBeUndefined();
    expect(result['package-lock.json']).toBeUndefined();
  });

  it('should handle entry directory being dot', () => {
    const entryDirectory = '.';
    const files = {
      'frontend/pages/index.js': new FileRef({ digest: 'index' }),
      'package.json': new FileRef({ digest: 'package' }),
      'package-lock.json': new FileRef({ digest: 'package-lock' }),
    };
    const result = includeOnlyEntryDirectory(files, entryDirectory);
    expect(result['frontend/pages/index.js']).toBeDefined();
    expect(result['package.json']).toBeDefined();
    expect(result['package-lock.json']).toBeDefined();
  });
});

describe('moveEntryDirectoryToRoot', () => {
  it('should move entrydirectory files to the root', () => {
    const entryDirectory = 'frontend';
    const files = {
      'frontend/pages/index.js': new FileRef({ digest: 'index' }),
    };
    const result = moveEntryDirectoryToRoot(files, entryDirectory);
    expect(result['pages/index.js']).toBeDefined();
  });

  it('should work with deep nested subdirectories', () => {
    const entryDirectory = 'frontend/my/app';
    const files = {
      'frontend/my/app/pages/index.js': new FileRef({ digest: 'index' }),
    };
    const result = moveEntryDirectoryToRoot(files, entryDirectory);
    expect(result['pages/index.js']).toBeDefined();
  });

  it('should do nothing when entry directory is dot', () => {
    const entryDirectory = '.';
    const files = {
      'frontend/pages/index.js': new FileRef({ digest: 'index' }),
    };
    const result = moveEntryDirectoryToRoot(files, entryDirectory);
    expect(result['frontend/pages/index.js']).toBeDefined();
  });
});

describe('excludeLockFiles', () => {
  it('should remove package-lock.json', () => {
    const files = {
      'frontend/pages/index.js': new FileRef({ digest: 'index' }),
      'package.json': new FileRef({ digest: 'package' }),
      'package-lock.json': new FileRef({ digest: 'package-lock' }),
    };
    const result = excludeLockFiles(files);
    expect(result['frontend/pages/index.js']).toBeDefined();
    expect(result['package-lock.json']).toBeUndefined();
  });

  it('should remove yarn.lock', () => {
    const files = {
      'frontend/pages/index.js': new FileRef({ digest: 'index' }),
      'package.json': new FileRef({ digest: 'package' }),
      'yarn.lock': new FileRef({ digest: 'yarn-lock' }),
    };
    const result = excludeLockFiles(files);
    expect(result['frontend/pages/index.js']).toBeDefined();
    expect(result['yarn.lock']).toBeUndefined();
  });

  it('should remove both package-lock.json and yarn.lock', () => {
    const files = {
      'frontend/pages/index.js': new FileRef({ digest: 'index' }),
      'package.json': new FileRef({ digest: 'package' }),
      'yarn.lock': new FileRef({ digest: 'yarn-lock' }),
      'package-lock.json': new FileRef({ digest: 'package-lock' }),
    };
    const result = excludeLockFiles(files);
    expect(result['frontend/pages/index.js']).toBeDefined();
    expect(result['yarn.lock']).toBeUndefined();
    expect(result['package-lock.json']).toBeUndefined();
  });
});

describe('excludeStaticDirectory', () => {
  it('should remove the /static directory files', () => {
    const files = {
      'frontend/pages/index.js': new FileRef({ digest: 'index' }),
      'package.json': new FileRef({ digest: 'package' }),
      'yarn.lock': new FileRef({ digest: 'yarn-lock' }),
      'package-lock.json': new FileRef({ digest: 'package-lock' }),
      'static/image.png': new FileRef({ digest: 'image' }),
    };
    const result = excludeStaticDirectory(files);
    expect(result['frontend/pages/index.js']).toBeDefined();
    expect(result['yarn.lock']).toBeDefined();
    expect(result['package-lock.json']).toBeDefined();
    expect(result['static/image.png']).toBeUndefined();
  });

  it('should remove the nested /static directory files', () => {
    const files = {
      'frontend/pages/index.js': new FileRef({ digest: 'index' }),
      'package.json': new FileRef({ digest: 'package' }),
      'yarn.lock': new FileRef({ digest: 'yarn-lock' }),
      'package-lock.json': new FileRef({ digest: 'package-lock' }),
      'static/images/png/image.png': new FileRef({ digest: 'image' }),
    };
    const result = excludeStaticDirectory(files);
    expect(result['frontend/pages/index.js']).toBeDefined();
    expect(result['yarn.lock']).toBeDefined();
    expect(result['package-lock.json']).toBeDefined();
    expect(result['static/images/png/image.png']).toBeUndefined();
  });
});

describe('onlyStaticDirectory', () => {
  it('should keep only /static directory files', () => {
    const files = {
      'frontend/pages/index.js': new FileRef({ digest: 'index' }),
      'package.json': new FileRef({ digest: 'package' }),
      'yarn.lock': new FileRef({ digest: 'yarn-lock' }),
      'package-lock.json': new FileRef({ digest: 'package-lock' }),
      'static/image.png': new FileRef({ digest: 'image' }),
    };
    const result = onlyStaticDirectory(files);
    expect(result['frontend/pages/index.js']).toBeUndefined();
    expect(result['yarn.lock']).toBeUndefined();
    expect(result['package-lock.json']).toBeUndefined();
    expect(result['static/image.png']).toBeDefined();
  });

  it('should keep nested /static directory files', () => {
    const files = {
      'frontend/pages/index.js': new FileRef({ digest: 'index' }),
      'package.json': new FileRef({ digest: 'package' }),
      'yarn.lock': new FileRef({ digest: 'yarn-lock' }),
      'package-lock.json': new FileRef({ digest: 'package-lock' }),
      'static/images/png/image.png': new FileRef({ digest: 'image' }),
    };
    const result = onlyStaticDirectory(files);
    expect(result['frontend/pages/index.js']).toBeUndefined();
    expect(result['yarn.lock']).toBeUndefined();
    expect(result['package-lock.json']).toBeUndefined();
    expect(result['static/images/png/image.png']).toBeDefined();
  });
});
