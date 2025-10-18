# TODO before usage
- [ ] update the name in package.json
- [ ] update the description 

# How to use

## Structure
- `src` - contains the project, entry point being the `index.ts` file
- `types` - contains typedefs for the `tsc` to use for code completion.
- `src/modlib` - contians the helper function provided in Offical SDK

## How to export 
- Run this command
    ```bash
    node esbuild.config.mjs
    ```
- copy the file from `dist/index.js`