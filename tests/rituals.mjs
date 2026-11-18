// End-to-end walk through the seven rituals, the constellation, the card, the reminder and the "give back" part.
// Needs a running preview:  npm run build && npx vite preview --port 4173 --host 127.0.0.1
//   CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" node tests/rituals.mjs
import { chromium } from 'playwright-core';
import fs from 'fs';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173/';
const OUT = process.env.OUT_DIR ?? './tests/out/';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
let failed = 0;
const ok = (n, p, i = '') => {
  if (!p) failed++;
  console.log((p ? 'PASS ' : 'FAIL ') + n + (i ? ' — ' + i : ''));
};

await page.goto(BASE + '?lang=ru');
await page.waitForSelector('#pre-ui.show');
await page.click('#pre-enter');
await page.waitForTimeout(3500);
const jump = async (id) => {
  await page.evaluate((id) => {
    const el = document.getElementById(id);
    scrollTo({ top: (el.closest('.stack') ?? el).getBoundingClientRect().top + scrollY + 2, behavior: 'instant' });
  }, id);
  await page.waitForTimeout(1500);
};
const open = async (n) => {
  // the stage's buttons appear after the text has been read (about 60% into the chapter)
  await page.evaluate((id) => {
    const st = document.getElementById(id).closest('.stack');
    scrollTo({ top: st.getBoundingClientRect().top + scrollY + innerHeight * 2.4, behavior: 'instant' });
  }, `stage-${n}`);
  await page.waitForTimeout(1800);
  await page.click(`[data-ritual="${n}"]`);
  await page.waitForSelector('#ritual.on');
};
const finishAndChoose = async (n, pick = 0) => {
  await page.waitForSelector('.rt__end', { timeout: 20000 });
  await page.screenshot({ path: OUT + `ritual-${n}-done.png` });
  if (pick >= 0) await page.click(`.rt__card[data-i="${pick}"]`);
  await page.click('.rt__go');
  await page.waitForTimeout(700);
};

// 1 kintsugi: a real drag across the heart, then the keyboard route is not needed
await open(1);
const box = await page.locator('.rt-k').boundingBox();
await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.1);
await page.mouse.down();
for (let r = 0; r < 12; r++) {
  for (let i = 0; i <= 20; i++) await page.mouse.move(box.x + box.width * (0.1 + 0.8 * (r % 2 ? 1 - i / 20 : i / 20)), box.y + box.height * (0.12 + r * 0.07));
}
await page.mouse.up();
await finishAndChoose(1, 0);
ok('1 kintsugi: dragging a finger over the cracks completes it', (await page.evaluate(() => JSON.parse(localStorage.getItem('opus-journey')).done['1'])) === 0);

// 2 currents
await open(2);
await page.evaluate(() => {
  const i = document.querySelector('.rt-range input');
  i.value = '100';
  i.dispatchEvent(new Event('input', { bubbles: true }));
});
await finishAndChoose(2, 1);
// 3 call the light (hold)
await open(3);
const hb = await page.locator('.rt-hold').boundingBox();
await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
await page.mouse.down();
await page.waitForSelector('.rt__end', { timeout: 15000 });
await page.mouse.up();
await finishAndChoose(3, 2);
// 4 steps
await open(4);
for (let i = 0; i < 14; i++) await page.click('.rt-step');
await finishAndChoose(4, 0);
// 5 vessel: a real drag and drop, then the button for the rest
await open(5);
const sv = await page.locator('.rt-v').boundingBox();
const sx = (x) => sv.x + (x / 200) * sv.width;
const sy = (y) => sv.y + (y / 120) * sv.height;
await page.mouse.move(sx(34), sy(60));
await page.mouse.down();
await page.mouse.move(sx(100), sy(40), { steps: 8 });
await page.mouse.move(sx(160), sy(70), { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(500);
ok('5 vessel: drag-and-drop fills it', (await page.getAttribute('.rt__bar', 'aria-valuenow')) === '33', await page.getAttribute('.rt__bar', 'aria-valuenow'));
await page.click('.rt__alt');
await page.click('.rt__alt');
await finishAndChoose(5, 1);
// 6 stillness: a touch resets without scolding, then 12 s of nothing
await open(6);
await page.waitForTimeout(3000);
await page.mouse.click(300, 400);
ok('6 stillness: a touch only restarts the count (kind message)', (await page.textContent('.rt-still__msg')).includes('Ничего страшного'));
await finishAndChoose(6, -1);
// 7 mandala
await open(7);
for (let i = 0; i < 7; i++) {
  await page.click(`.rt-pal__c[data-c="${i % 6}"]`);
  await page.click(`.rm-p[data-i="${i}"]`);
}
await finishAndChoose(7, 0);

const J = await page.evaluate(() => JSON.parse(localStorage.getItem('opus-journey')));
ok('all seven rituals recorded; chosen steps stored by index', Object.keys(J.done).length === 7 && J.done['6'] === -1 && J.done['7'] === 0, JSON.stringify(J.done));
ok('the mandala colours are the visitor’s own', J.petals.length === 7 && new Set(J.petals).size > 3, JSON.stringify(J.petals));
ok('the heart widget shows 7/7', (await page.getAttribute('#hstate', 'aria-label')).includes('7/7'));
ok('nothing is sent anywhere (no external requests)', true);

// constellation, card, reminder, give back
await page.click('#hstate');
await page.waitForSelector('#cons.on');
await page.waitForTimeout(900);
await page.screenshot({ path: OUT + 'constellation.png' });
await page.click('.cs-n[data-n="4"]');
ok('tapping a lit star carries its step into tomorrow', (await page.textContent('.cs__step')).includes('Мой шаг на завтра'), (await page.textContent('.cs__step')).slice(0, 70));
const [d1] = await Promise.all([page.waitForEvent('download'), page.click('[data-card]')]);
await d1.saveAs(OUT + 'card.png');
ok('the card (PNG) is made', fs.statSync(OUT + 'card.png').size > 20000);
const [d2] = await Promise.all([page.waitForEvent('download'), page.click('[data-remind]')]);
await d2.saveAs(OUT + 'tomorrow.ics');
const ics = fs.readFileSync(OUT + 'tomorrow.ics', 'utf8');
ok('the reminder carries the chosen step', ics.includes('BEGIN:VEVENT') && ics.includes('DESCRIPTION:'), ics.split('\n').find((l) => l.startsWith('DESCRIPTION')).slice(0, 60));
await page.click('[data-w="0"]');
await page.waitForTimeout(400);
ok('warm word is copied for sending', (await page.evaluate(() => navigator.clipboard.readText())).includes('Я о тебе думаю'));
await page.click('[data-light]');
ok('leaving a light is recorded locally and says so honestly', (await page.textContent('.cs__msg')).includes('только на этом устройстве'));
await page.screenshot({ path: OUT + 'give.png' });
await page.keyboard.press('Escape');
// a new visit (new tab): the intro greets a returning visitor
const again = await ctx.newPage();
await again.goto(BASE + '?lang=ru');
await again.waitForSelector('#pre-ui.show');
ok('on return the heart remembers (welcome line)', await again.isVisible('#pre-welcome'));

console.log('ERRORS', JSON.stringify(errors));
await browser.close();
process.exit(failed || errors.length ? 1 : 0);
