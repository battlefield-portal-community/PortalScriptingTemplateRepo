import * as esbuild from 'esbuild'
import pkg from './package.json' with { type: 'json' };

const banner = `// @ts-nocheck
/*
${pkg.name} v${pkg.version} | (c) ${pkg.author.name} | ${pkg.repository.url}
Created using https://github.com/battlefield-portal-community/PortalScriptingTemplateRepo
*/`;
await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    outdir: 'dist',
    format: 'esm',
    banner: {
        js: banner
        
    },
})