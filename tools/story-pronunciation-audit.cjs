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
  'src/g7-journey-content.js',
  'src/workshop-journey-content.js',
  'src/workshop-late-journey-content.js',
  'src/market-journey-content.js',
  'src/market-late-journey-content.js',
  'src/continuous-region-flow.js',
  'src/chapter1-finale-content.js',
  'src/first-free-quest-content.js',
  'src/north-forest-content.js',
  'src/world-v06-content.js',
  'src/market-inference-runtime.js',
  'src/story-outcome-content.js',
  'src/market-story-outcome-content.js',
  'src/g7-story-outcome-content.js',
  'src/gate-reward-story-content.js'
]) load(file);

const stories = context.JourneyContent.STORIES;
const storyIds = Object.keys(stories);
const speakers = Object.freeze({
  narrator: '旁白', boy: '少年', merchant: '行商阿姨', marketkeeper: '市集管理人',
  innkeeper: '客棧主人', gatekeeper: '守門人', driver: '車夫', artisan: '工匠',
  collector: '採集人', resident: '居民', unknown: '遠處的聲音'
});
const corpus = [];
const add = (id, text, source) => {
  if (typeof text === 'string' && text) corpus.push({ id, text, source });
};
const addBeats = (id, beats, source) => {
  beats.forEach((beat, index) => {
    add(id, beat.zh, `${source}:${index}`);
    add(id, speakers[beat.speaker] || beat.speaker, `${source}:${index}:speaker`);
  });
};

for (const id of storyIds) {
  const story = stories[id];
  add(id, story.placeZh, `story:${id}:place`);
  addBeats(id, story.beats, `story:${id}`);
}

for (const [group, configs] of [
  ['outcome', context.StoryOutcomeContent.VARIANTS],
  ['market-outcome', context.StoryOutcomeContent.marketVariants]
]) {
  for (const [id, config] of Object.entries(configs || {})) {
    for (const [variant, beats] of Object.entries(config.variants || {})) {
      addBeats(id, beats, `${group}:${id}:${variant}`);
    }
  }
}
for (const [variant, beats] of Object.entries(context.StoryOutcomeContent.g7Variants || {})) {
  addBeats('gate-after-convoy', beats, `g7-outcome:gate-after-convoy:${variant}`);
}
addBeats('gate-after-convoy', context.StoryOutcomeContent.gateRewardBeats || [], 'gate-reward:gate-after-convoy');

load('src/story-pronunciation-content.js');

const hanCount = text => [...text].filter(character => /\p{Script=Han}/u.test(character)).length;
const failures = [];
const dictionary = vm.runInContext('WORDS', context);
const scopeByText = new Map();

for (const item of corpus) {
  if (!scopeByText.has(item.text)) scopeByText.set(item.text, new Set());
  scopeByText.get(item.text).add(item.id);
  const reading = context.StoryPronunciation.readingFor(item.id, item.text);
  if (!reading) {
    failures.push(`${item.source}: missing reading for ${item.text}`);
    continue;
  }
  const expected = hanCount(item.text);
  if (reading.length !== expected) {
    failures.push(`${item.source}: ${expected} Han characters but ${reading.length} readings`);
  }
  if (reading.some(value => typeof value !== 'string' || !/^[ㄅ-ㄩ˙ˊˇˋ]+$/u.test(value))) {
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
  failures.push('supported story ID allowlist does not match every implemented story');
}
if (context.StoryPronunciation.readingFor('not-a-story', '旁白') !== null) {
  failures.push('unsupported story IDs must not receive readings');
}
for (const [text, ids] of scopeByText) {
  const outsider = storyIds.find(id => !ids.has(id));
  if (outsider && context.StoryPronunciation.readingFor(outsider, text) !== null) {
    failures.push(`context leak: ${JSON.stringify(text)} is available in unrelated story ${outsider}`);
  }
}

const reviewedPronunciations = [
  ['東西兩條路在北口重新會合。前方不遠處，一輛貨車停在路邊。', '重新', 'ㄔㄨㄥˊ ㄒㄧㄣ'],
  ['少年一點一點調高左邊的水門。第二次調整後，水車終於慢慢轉了起來。右邊的水門從頭到尾都沒有動。', '調高', 'ㄊㄧㄠˊ ㄍㄠ'],
  ['對。火和風一起看。別管哪個先，最後都調到剛剛好就行。', '調到', 'ㄊㄧㄠˊ ㄉㄠˋ'],
  ['工坊深處傳來斷斷續續的喀啦聲。一組三個齒輪停在半途，怎麼調也不動。', '怎麼調', 'ㄗㄣˇ ㄇㄜ˙ ㄊㄧㄠˊ'],
  ['水流穩了，空轉的輪子停下，修好的齒輪重新咬合。舊調節器的敲擊聲終於消失。', '空轉', 'ㄎㄨㄥ ㄓㄨㄢˋ'],
  ['深綠色，葉子長，前面是尖的……', '葉子長', 'ㄧㄝˋ ㄗ˙ ㄔㄤˊ'],
  ['這次不給你看另一個樣本。記住：要長、細，而且生長在水邊。帶兩根回來。', '生長', 'ㄕㄥ ㄓㄤˇ'],
  ['要改的地方改，不該動的地方保持原樣。你倒是沒有一上來就亂碰。', '倒是', 'ㄉㄠˋ ㄕˋ'],
  ['當然。先把這裡當個落腳處。想繼續逛市集也沒關係，晚一點再回來就好。', '當個', 'ㄉㄤˋ ㄍㄜˋ'],
  ['這是今天的工錢。做了事，就該拿。', '做了事', 'ㄗㄨㄛˋ ㄌㄜ˙ ㄕˋ']
];
for (const [text, phrase, expected] of reviewedPronunciations) {
  const item = corpus.find(entry => entry.text === text);
  if (!item) {
    failures.push(`reviewed pronunciation source missing: ${text}`);
    continue;
  }
  const reading = context.StoryPronunciation.readingFor(item.id, text);
  const position = text.indexOf(phrase);
  const offset = hanCount(text.slice(0, position));
  const actual = reading?.slice(offset, offset + hanCount(phrase)).join(' ');
  if (actual !== expected) failures.push(`${item.source}: ${phrase} uses ${actual}, expected reviewed reading ${expected}`);
}

if (failures.length) {
  console.error([...new Set(failures)].join('\n'));
  process.exitCode = 1;
} else {
  const unique = new Set(corpus.map(item => `${item.id}\0${item.text}`));
  console.log(`Story pronunciation audit passed: ${storyIds.length} stories, ${unique.size} scoped strings.`);
}
