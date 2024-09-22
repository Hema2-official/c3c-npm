import child_process from 'node:child_process';
import { checkAndPrepareBinary } from './utils.js';

/**
 * @param {string} commandLine
 * @param {import('child_process').ExecSyncOptions} options
 * @returns {void}
 * @throws {Error}
 */
export function run_c3c(commandLine, options) {
    // Check the type of commandLine
    if (!commandLine || (typeof commandLine !== 'string')) {
        throw new Error('Invalid use of run_c3c: commandLine must be a string');
    }

    // Check if the c3c executable is available
    const binPath = checkAndPrepareBinary();

    // Run the command
    child_process.execSync(`${binPath} ${commandLine}`, { stdio: 'inherit', ...options });
}
