const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

const shared = {
  bundle: true,
  sourcemap: true,
  logLevel: 'info',
  minify: false
};

const builds = [
  {
    ...shared,
    platform: 'node',
    format: 'cjs',
    entryPoints: ['src/extension.ts'],
    outfile: 'out/extension.js',
    external: ['vscode']
  },
  {
    ...shared,
    platform: 'browser',
    format: 'iife',
    entryPoints: ['src/webview/index.tsx'],
    outfile: 'out/webview.js',
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  }
];

async function run() {
  if (watch) {
    const contexts = await Promise.all(builds.map((options) => esbuild.context(options)));
    await Promise.all(contexts.map((context) => context.watch()));
    console.log('Watching extension and webview sources...');
    return;
  }

  await Promise.all(builds.map((options) => esbuild.build(options)));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
