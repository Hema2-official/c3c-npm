# ✨ C3C on NPM ✨

The official C3 compiler published on NPM.

This package exposes an API to run the C3 compiler on your native platform.
It works with the `optionalDependencies` feature of NPM to automatically download the correct binaries, inspired by the [esbuild](https://www.npmjs.com/package/esbuild) package.

## Supported platforms
- Windows x64
- Linux x64
- Darwin (MacOS) x64

If your platform is not on this list yet or appears to be broken, you can install C3C from [the official website](https://c3-lang.org) or build it from [source](https://github.com/c3lang/c3c) yourself, then set the `C3C_BINARY_PATH` environment variable to the installed executable.
This way, the package will skip any checks and attempts to download binaries.

## Usage
```js
// Import the run_c3c function
import { run_c3c } from '@c3-lang/c3c';

try {
    // This is equivalent to running `c3c compile example.c3`.
    run_c3c('compile example.c3', { /* options for child_process.execSync */ });
} catch (error) {
    console.error('C3 compilation failed: ', error);
}
```
