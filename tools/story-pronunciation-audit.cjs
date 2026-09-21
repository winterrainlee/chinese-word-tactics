const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const context = vm.createContext({ console });
const load = file => vm.runInContext(read(file), context, { filename: file });

for (const file of [
  'src/content.js',
  'src/workshop-content.js',
  'src/workshop-late-content.js',
  'src/g7-content.js',
  'src/market-content.js',
  'src/market-late-content.js',
  'src/journey-content.js',
  'src/market-journey-content.js',
  'src/market-late-journey-content.js'
]) load(file);

const storyIds = [
  'prologue-departure', 'prologue-forest-edge',
  'market-arrival', 'market-after-m1', 'market-m2-setup', 'market-after-m2',
  'market-m3-setup', 'market-after-m3', 'market-m4-setup', 'market-after-m4',
  'market-m5-setup', 'market-after-m5', 'market-m6-setup', 'market-after-m6',
  'market-m7-setup', 'market-after-m7', 'market-m8-setup', 'market-after-m8'
];
const speakers = Object.freeze({
  narrator: '旁白', boy: '少年', merchant: '行商阿姨', marketkeeper: '市集管理人',
  innkeeper: '客棧主人', unknown: '遠處的聲音'
});
const corpus = [];

function collectStories(label) {
  const stories = context.JourneyContent.STORIES;
  for (const id of storyIds) {
    const story = stories[id];
    if (!story) throw new Error(`${label}: missing story ${id}`);
    corpus.push({ id, text: story.placeZh, source: `${label}:${id}:place` });
    story.beats.forEach((beat, index) => {
      corpus.push({ id, text: beat.zh, source: `${label}:${id}:${index}` });
      const speaker = speakers[beat.speaker];
      if (speaker) corpus.push({ id, text: speaker, source: `${label}:${id}:${index}:speaker` });
    });
  }
}

collectStories('base');
load('src/world-v06-content.js');
collectStories('world-patched');
load('src/story-outcome-content.js');
load('src/market-story-outcome-content.js');
const variants = context.StoryOutcomeContent.marketVariants;
for (const [id, config] of Object.entries(variants)) {
  for (const [variant, beats] of Object.entries(config.variants)) {
    beats.forEach((beat, index) => {
      corpus.push({ id, text: beat.zh, source: `variant:${id}:${variant}:${index}` });
      const speaker = speakers[beat.speaker];
      if (speaker) corpus.push({ id, text: speaker, source: `variant:${id}:${variant}:${index}:speaker` });
    });
  }
}
load('src/market-inference-runtime.js');
collectStories('effective');
load('src/story-pronunciation-content.js');

const hanCount = text => [...text].filter(character => /\p{Script=Han}/u.test(character)).length;
const failures = [];
const dictionary = vm.runInContext('WORDS', context);
for (const item of corpus) {
  const reading = context.StoryPronunciation.readingFor(item.id, item.text);
  if (!reading) {
    failures.push(`${item.source}: missing reading for ${item.text}`);
    continue;
  }
  const expected = hanCount(item.text);
  if (reading.length !== expected) {
    failures.push(`${item.source}: ${expected} Han characters but ${reading.length} readings`);
  }
  if (reading.some(value => !value || /[\u3400-\u9fff]/u.test(value))) {
    failures.push(`${item.source}: malformed reading token`);
  }
  for (const [word, detail] of Object.entries(dictionary)) {
    let position = item.text.indexOf(word);
    while (position >= 0) {
      const offset = hanCount(item.text.slice(0, position));
      const length = hanCount(word);
      const actual = reading.slice(offset, offset + length).join(' ');
      if (actual !== detail.p) {
        failures.push(`${item.source}: ${word} uses ${actual}, expected shared vocabulary reading ${detail.p}`);
      }
      position = item.text.indexOf(word, position + word.length);
    }
  }
}

const supported = context.StoryPronunciation.supportedStories;
if (supported.length !== storyIds.length || storyIds.some(id => !supported.includes(id))) {
  failures.push('supported story ID allowlist does not match the pilot scope');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  const unique = new Set(corpus.map(item => `${item.id}\0${item.text}`));
  console.log(`Story pronunciation audit passed: ${storyIds.length} stories, ${unique.size} scoped strings.`);
}
