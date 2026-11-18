// Runs the Maestro flows: node .maestro/run.mjs <android|ios>
// Needs the local API, a booted device with the app installed, and the test
// user in test-user.local.json (git-ignored). Credentials go through the
// environment so they never appear in a flow file or on the command line.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const platform = process.argv[2];
if (platform !== 'android' && platform !== 'ios') {
  console.error('Usage: node .maestro/run.mjs <android|ios>');
  process.exit(1);
}

const userFile = 'test-user.local.json';
if (!existsSync(userFile)) {
  console.error(`${userFile} not found. Create it with the email and password of a test user.`);
  process.exit(1);
}
const { email, password } = JSON.parse(readFileSync(userFile, 'utf8'));

const result = spawnSync('maestro', [`--platform=${platform}`, 'test', '.maestro'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Maestro needs Java 17 or newer, whatever the machine's default is.
    JAVA_HOME: execFileSync('/usr/libexec/java_home', ['-v', '17'], { encoding: 'utf8' }).trim(),
    PATH: `${join(homedir(), '.maestro', 'bin')}:${process.env.PATH}`,
    MAESTRO_CLI_NO_ANALYTICS: '1',
    MAESTRO_TEST_EMAIL: email,
    MAESTRO_TEST_PASSWORD: password,
  },
});

if (result.error) {
  console.error(`Could not start Maestro: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
