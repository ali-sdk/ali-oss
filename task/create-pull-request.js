const { Octokit } = require('@octokit/core');
const pkg = require('../package.json');

const { env } = process;

// Octokit.js
// https://github.com/octokit/core.js#readme
const octokit = new Octokit({
  auth: env.GITHUB_TOKEN
});

// https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#create-a-pull-request
octokit.request('POST /repos/{owner}/{repo}/pulls', {
  owner: 'ali-sdk',
  repo: 'ali-oss',
  title: `release ${pkg.version} success to master`,
  body: 'release to master',
  head: 'release',
  base: 'master',
  headers: {
    'X-GitHub-Api-Version': '2022-11-28'
  }
});
