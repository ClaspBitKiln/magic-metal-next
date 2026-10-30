import * as migration_20261030_174128_initial from './20261030_174128_initial';

export const migrations = [
  {
    up: migration_20261030_174128_initial.up,
    down: migration_20261030_174128_initial.down,
    name: '20261030_174128_initial'
  },
];
