const branch = process.env.GITHUB_REF_NAME || 'main';
const isStableRelease = branch === 'release';

module.exports = {
  extends: 'semantic-release-monorepo',
  branches: [
    '+([0-9])?(.{+([0-9]),x}).x',
    {
      name: 'release',
      channel: 'latest',
    },
    {
      name: 'main',
      channel: 'dev',
      prerelease: 'dev',
    },
  ],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'revert', release: 'patch' },
          { type: 'docs', scope: 'README', release: 'patch' },
          { type: 'refactor', release: 'patch' },
          { type: 'style', release: false },
          { type: 'chore', release: false },
          { type: 'test', release: false },
          { type: 'ci', release: false },
        ],
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { type: 'feat', section: 'Features' },
            { type: 'fix', section: 'Bug Fixes' },
            { type: 'perf', section: 'Performance Improvements' },
            { type: 'revert', section: 'Reverts' },
            { type: 'docs', section: 'Documentation', hidden: false },
            { type: 'style', section: 'Styles', hidden: true },
            { type: 'chore', section: 'Miscellaneous Chores', hidden: true },
            { type: 'refactor', section: 'Code Refactoring', hidden: false },
            { type: 'test', section: 'Tests', hidden: true },
            { type: 'build', section: 'Build System', hidden: true },
            { type: 'ci', section: 'Continuous Integration', hidden: true },
          ],
        },
      },
    ],
    '@semantic-release/changelog',
    [
      '@semantic-release/npm',
      {
        npmPublish: true,
        tarballDir: 'dist',
      },
    ],
    // Only commit version changes on stable releases (not dev)
    ...(isStableRelease
      ? [
          [
            '@semantic-release/git',
            {
              assets: ['package.json', 'CHANGELOG.md'],
              message:
                'chore(release): ${nextRelease.gitTag} [skip ci]\n\n${nextRelease.notes}',
            },
          ],
        ]
      : []),
    '@semantic-release/github',
  ],
};