import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';
import child_process from 'node:child_process';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const __package_json = path.join(__dirname, '..', 'package.json');

const knownWindowsPackages = {
    'win32 x64 LE': '@c3-lang/c3c-win32-x64'
};

const knownUnixlikePackages = {
    'darwin x64 LE': '@c3-lang/c3c-darwin-x64',
    'linux x64 LE': '@c3-lang/c3c-linux-x64'
};

function pkgAndExecutableForCurrentPlatform() {
    let pkg;
    let executable;

    let platformKey = `${process.platform} ${process.arch} ${os.endianness()}`;

    if (platformKey in knownWindowsPackages) {
        pkg = knownWindowsPackages[platformKey];
        executable = 'c3c.exe';
    } else if (platformKey in knownUnixlikePackages) {
        pkg = knownUnixlikePackages[platformKey];
        executable = 'c3c';
    } else {
        throw new Error(`Unsupported platform: ${platformKey}`);
    }

    return { pkg, executable };
}

function getJson(json_path) {
    const json = JSON.parse(fs.readFileSync(json_path));
    if (!json) {
        throw new Error(`JSON is empty: ${json_path}`);
    }
    return json;
}

function installUsingNPM(pkg, version) {
    // create a new virtual environment
    const installDir = path.join(__dirname, '..', 'npm-install');
    const installEnv = { ...process.env, npm_config_global: void 0 };
    fs.mkdirSync(installDir);
    fs.writeFileSync(path.join(installDir, 'package.json'), '{}');

    // install the package into there
    child_process.execSync(
        `npm install --loglevel=error --no-audit --progress=false ${pkg}@${version}`,
        { cwd: installDir, env: installEnv, stdio: 'pipe' }
    );

    // move the package into the parent package's node_modules
    const installedDir = path.join(installDir, 'node_modules', pkg);
    fs.renameSync(installedDir, path.join(__dirname, '..', '..', '..', pkg));

    // clean up
    fs.rmSync(installDir, { recursive: true, force: true });
}

function removePackage(pkg) {
    // uninstall the package from the parent package
    const packageDir = path.join(__dirname, '..', '..', '..', pkg);
    fs.rmSync(packageDir, { recursive: true, force: true });
}

export function resolvePackageFile(pkg, file) {
    const pkgPath = path.join(__dirname, '..', '..', '..', pkg, file);
    if (!fs.existsSync(pkgPath)) {
        throw new Error(`Could not find package: ${pkg}`);
    }
    return pkgPath;
}

export function checkAndPrepareBinary() {
    // Check if a path is set in the environment
    if (process.env.C3C_BINARY_PATH) {
        const binPath = process.env.C3C_BINARY_PATH;
        if (fs.existsSync(binPath)) {
            return binPath;
        } else {
            console.warn(`[c3c] Ignoring invalid C3C_BINARY_PATH: "${binPath}"`);
        }
    }

    const { pkg, executable } = pkgAndExecutableForCurrentPlatform();
    let binPath;
    try {
        // Check installed version
        const installedVersion = getJson(resolvePackageFile(pkg, 'package.json')).version;
        const requiredVersion = getJson(__package_json).optionalDependencies[pkg];
        if (installedVersion !== requiredVersion) {
            console.warn(`[c3c] Installed version of "${pkg}" (${installedVersion}) does not match required version (${requiredVersion})`);
            console.warn(`[c3c] Attempting to remove "${pkg}"...`);
            removePackage(pkg);
            console.warn(`[c3c] Successfully remove "${pkg}".`);
        }

        // Resolve the path to the executable
        binPath = resolvePackageFile(pkg, executable);
    } catch (e) {
        console.warn(`[c3c] Could not find package: "${pkg}"`);

        // Attempt to install the package
        try {
            console.warn(`[c3c] Attempting to install "${pkg}" using npm...`);
            installUsingNPM(pkg, getJson(__package_json).optionalDependencies[pkg]);
        } catch (e2) {
            throw new Error(`Failed to install "${pkg}" using npm.`);
        }

        // Check if the package was installed successfully
        try {
            binPath = resolvePackageFile(pkg, executable);
        } catch (e2) {
            throw new Error(`Failed to find "${pkg}" after installation.`);
        }

        console.warn(`[c3c] Successfully installed "${pkg}".`);
    }

    return binPath;
}
