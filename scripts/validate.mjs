import { readFileSync } from 'node:fs';

const [stage, file] = process.argv.slice(2);
if (!['stage1', 'stage2'].includes(stage) || !file) {
  console.error('Usage: node scripts/validate.mjs <stage1|stage2> <mixed-pr-body.md>');
  process.exit(2);
}
const text = readFileSync(file, 'utf8').replaceAll('&#8203;', '').replaceAll('\u200b', '');
const expected = JSON.parse(readFileSync(new URL('../expected/references.json', import.meta.url)));
const errors = [];
if (!/https?:\/\/(?:github\.com|togithub\.com|redirect\.github\.com)\/sindresorhus\/ky\/issues\/533(?!\d)/.test(text)) errors.push('Missing GitHub upstream issue #533');
for (const n of expected.gitlab.numbers) {
  const bad = new RegExp(`https?://(?:github\\.com|(?:to|redirect\\.)github\\.com)/gitlab-ci-utils/gitlab-ci-env/issues/${n}(?!\\d)`);
  if (bad.test(text)) errors.push(`GitHub fallback for GitLab #${n}`);
  const target = `${expected.gitlab.urlPrefix}${n}`;
  if (stage === 'stage2' && !text.includes(target)) errors.push(`Missing GitLab issue #${n}`);
  if (stage === 'stage1') {
    if (!new RegExp(`(?<![\\w])#${n}(?!\\d)`).test(text)) errors.push(`Missing reference #${n}`);
    if (new RegExp(`\\[[^\\]]*#${n}[^\\]]*\\]\\(`).test(text)) errors.push(`GitLab #${n} is linked in stage 1`);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Reference checks passed for ${stage}`);
