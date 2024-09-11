const cp = require('child_process');
const path = require('path');
const os = require('os');

let noDaemon = process.argv[2] === 'no-daemon';

const NUMBER_OF_RUNS = 10;

function message(m) {
  console.log('------------------------');
  console.log(m);
  console.log('------------------------');
}

function cleanFolders() {
  // uncomment this to remove all artifacts after every run
  // cp.execSync(
  //   'rm -rf apps/crew/.next && rm -rf apps/flight-simulator/.next && rm -rf apps/navigation/.next && rm -rf apps/ticket-booking/.next && rm -rf apps/warp-drive-manager/.next'
  // );
}

function spawnSync(cmd, args) {
  return cp.spawnSync(
    path.join(
      '.',
      'node_modules',
      '.bin',
      os.platform() === 'win32' ? cmd + '.cmd' : cmd
    ),
    args,
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        NX_TASKS_RUNNER_DYNAMIC_OUTPUT: 'false',
        NX_DAEMON: !noDaemon,
      },
    }
  );
}

if (noDaemon) {
  message('Running without daemons');
}

message('prepping turbo');
let turboArgs = ['run', 'build', `--concurrency`, 10];
if (noDaemon) {
  turboArgs.push('--no-daemon');
}
spawnSync('turbo', turboArgs);

message(`running turbo ${NUMBER_OF_RUNS} times`);
let turboTime = 0;
for (let i = 0; i < NUMBER_OF_RUNS; ++i) {
  cleanFolders();
  const b = process.hrtime.bigint();
  spawnSync('turbo', turboArgs);
  const a = process.hrtime.bigint();
  const diff = Number((a - b) / BigInt(1000000));
  turboTime += diff;
  console.log(`The command ran in ${diff}ms`);
}
const averageTurboTime = turboTime / NUMBER_OF_RUNS;

message('prepping nx');
spawnSync('nx', ['run-many', '-t', 'build']);

message(`running nx ${NUMBER_OF_RUNS} times`);
let nxTime = 0;
for (let i = 0; i < NUMBER_OF_RUNS; ++i) {
  cleanFolders();
  const b = process.hrtime.bigint();
  spawnSync('nx', ['run-many', '-t', 'build', '--parallel', 10]);
  const a = process.hrtime.bigint();
  const diff = Number((a - b) / BigInt(1000000));
  nxTime += diff;
  console.log(`The command ran in ${diff}ms`);
}
const averageNxTime = nxTime / NUMBER_OF_RUNS;

message('prepping lage');
spawnSync('lage', ['build', '--concurrency', 10]);

message(`running lage ${NUMBER_OF_RUNS} times`);
let lageTime = 0;
for (let i = 0; i < NUMBER_OF_RUNS; ++i) {
  cleanFolders();
  const b = process.hrtime.bigint();
  spawnSync('lage', ['build', '--concurrency', 10]);
  const a = process.hrtime.bigint();
  const diff = Number((a - b) / BigInt(1000000));
  lageTime += diff;
  console.log(`The command ran in ${diff}ms`);
}
const averageLageTime = lageTime / NUMBER_OF_RUNS;

message('results');
console.log(`average lage time is: ${averageLageTime}`);
console.log(`average turbo time is: ${averageTurboTime}`);
console.log(`average nx time is: ${averageNxTime}`);

console.log(`nx is ${averageLageTime / averageNxTime}x faster than lage`);
console.log(`nx is ${averageTurboTime / averageNxTime}x faster than turbo`);
