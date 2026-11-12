const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const logs = [];
  const errors = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') errors.push(text);
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('1. Going to /welcome...');
  await page.goto('https://biowira.pages.dev/welcome');
  await page.waitForTimeout(2000);

  console.log('2. Clicking New Explorer...');
  await page.click('text=New Explorer');
  await page.waitForTimeout(1500);

  console.log('3. Clicking Malayan Tiger...');
  await page.click('text=Malayan Tiger');
  await page.waitForTimeout(1500);

  console.log('4. Nickname step...');
  // Look for any button to confirm or continue
  const buttons = await page.$$eval('button', els => els.map(b => b.innerText.trim()));
  console.log('Buttons on nickname page:', buttons);

  // Click random/ready/start button
  const startBtn = page.locator('button').filter({ hasText: /Ready|Start|Let's Go|Confirm|Continue/i }).first();
  if (await startBtn.isVisible()) {
    console.log('Clicking button:', await startBtn.innerText());
    await startBtn.click();
    await page.waitForTimeout(3000);
  }

  // Check if backup code modal / success page appears
  const exploreBtn = page.locator('button').filter({ hasText: /Explore|Go|Play|Start/i }).first();
  if (await exploreBtn.isVisible()) {
    console.log('Clicking final explore button...');
    await exploreBtn.click();
    await page.waitForTimeout(3000);
  }

  console.log('5. Navigating to Larut Torrent Frog rescue run...');
  await page.goto('https://biowira.pages.dev/games/explorer-rescue-run/play?rescueAnimal=larut-torrent-frog');
  await page.waitForTimeout(8000);

  console.log('--- Errors ---');
  console.log(errors);

  console.log('--- Logs Preview ---');
  console.log(logs.filter(l => l.includes('Rescue') || l.includes('Round') || l.includes('Phaser') || l.includes('Match')));

  const canvas = await page.$('canvas');
  console.log('Phaser Canvas Present:', !!canvas);

  const errorOverlay = await page.$('.game-page__overlay--error');
  console.log('Error Overlay Present:', !!errorOverlay);

  await page.screenshot({
    path: 'C:/Users/EAMASTER/.gemini/antigravity/brain/5c6e7bea-f0cf-49d7-ab0b-bdf1a5d4137c/larut_rescue_in_action.png'
  });
  console.log('Screenshot saved!');

  await browser.close();
})();
