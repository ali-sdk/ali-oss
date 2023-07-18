'use strict';

const Benchmark = require('benchmark');
const benchmarks = require('beautify-benchmark');
const OssClient = require('../..');

const suite = new Benchmark.Suite();

let config = require('../config').oss;

config = OssClient.initOptions(config);

const ctx = { foo: 'bar' };

console.log(new OssClient(config, ctx));

suite
  .add('new OssClient(config, ctx)', () => {
    /* eslint-disable no-new */
    new OssClient(config, ctx);
  })
  .add('OssClient(config, ctx)', () => {
    OssClient(config, ctx);
  })
  .on('cycle', event => {
    benchmarks.add(event.target);
  })
  .on('start', () => {
    console.log('\n  new Client() Benchmark\n  node version: %s, date: %s\n  Starting...', process.version, Date());
  })
  .on('complete', () => {
    benchmarks.log();
  })
  .run({ async: false });

// new Client() Benchmark
// node version: v6.7.0, date: Fri Sep 30 2016 16:10:51 GMT+0800 (CST)
// Starting...
// 2 tests completed.
//
// new OssClient(config, ctx) x 24,001,380 ops/sec ±3.82% (81 runs sampled)
// OssClient(config, ctx)     x 12,883,405 ops/sec ±5.24% (79 runs sampled)

// new Client() Benchmark
// node version: v4.6.0, date: Fri Sep 30 2016 16:11:35 GMT+0800 (CST)
// Starting...
// 2 tests completed.
//
// new OssClient(config, ctx) x 31,580,788 ops/sec ±3.66% (84 runs sampled)
// OssClient(config, ctx)     x 17,236,568 ops/sec ±1.48% (87 runs sampled)
