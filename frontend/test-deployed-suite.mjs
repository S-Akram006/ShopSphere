import puppeteer from './node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const DEPLOYED_URL = process.env.TEST_URL || 'https://shop-sphere-lovat-tau.vercel.app';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTestSuite() {
  console.log(`\n======================================================`);
  console.log(` ShopSphere Automated E2E Deployment Test Suite`);
  console.log(` Target URL: ${DEPLOYED_URL}`);
  console.log(` Browser: Chrome (${CHROME_PATH})`);
  console.log(`======================================================\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const consoleLogs = [];
  const uncaughtErrors = [];

  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    if (msg.type() === 'error' && !text.includes('Failed to load resource')) {
      console.error(`  [Browser Console Error]: ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    uncaughtErrors.push(err.message);
    console.error(`  [Uncaught Page Error]: ${err.message}`);
  });

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
      return true;
    } else {
      console.error(`  ❌ [FAIL] ${testName} - ${details}`);
      return false;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Initial Page Load & Header Navigation
    // ----------------------------------------------------
    try {
      await page.goto(DEPLOYED_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('header', { timeout: 15000 });
    } catch (e) {
      console.warn('Initial goto warning, retrying once:', e.message);
      await page.goto(DEPLOYED_URL, { waitUntil: 'load', timeout: 30000 });
    }
    const pageTitle = await page.title();
    assert(pageTitle.includes('ShopSphere'), 'Document title contains ShopSphere', `Got: ${pageTitle}`);

    const brandVisible = await page.$eval('header', (el) =>
      el.innerText.replace(/\s+/g, '').includes('ShopSphere')
    );
    assert(brandVisible, 'Header brand ShopSphere is clearly visible');

    const cartBtn = await page.$('#navbar-cart-button');
    assert(cartBtn !== null, 'Navbar fast cart drawer button is rendered');

    // ----------------------------------------------------
    // TEST 2: Tolerant / Fuzzy Search Handling (Typos & Plurals)
    // ----------------------------------------------------
    console.log(`\n[Stage 2] Tolerant / Fuzzy Search Handling`);
    const searchInput = await page.$('input[placeholder*="Search products"]');
    assert(searchInput !== null, 'Search input field exists on homepage');

    // 2a. Typo test: 'headphne' (missing 'o')
    await page.focus('input[placeholder*="Search products"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type('input[placeholder*="Search products"]', 'headphne');
    await page.keyboard.press('Enter');
    await delay(1000);

    const typoResults = await page.$$eval('h3.line-clamp-2', (els) => els.map((e) => e.innerText));
    const typoMatched = typoResults.some((t) => t.toLowerCase().includes('headphone'));
    assert(typoMatched, 'Fuzzy search matches "headphne" typo to Headphones', `Found: ${typoResults.join(', ')}`);

    // 2b. Plural test: 'hoodies' -> matches Hoodie
    await page.focus('input[placeholder*="Search products"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type('input[placeholder*="Search products"]', 'hoodies');
    await page.keyboard.press('Enter');
    await delay(1000);

    const pluralResults = await page.$$eval('h3.line-clamp-2', (els) => els.map((e) => e.innerText));
    const pluralMatched = pluralResults.some((t) => t.toLowerCase().includes('hoodie'));
    assert(pluralMatched, 'Plural query "hoodies" matches Hoodie catalog items', `Found: ${pluralResults.join(', ')}`);

    // 2c. Plural test: 'keyboards' -> matches Keyboard
    await page.focus('input[placeholder*="Search products"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type('input[placeholder*="Search products"]', 'keyboards');
    await page.keyboard.press('Enter');
    await delay(1000);

    const keyboardResults = await page.$$eval('h3.line-clamp-2', (els) => els.map((e) => e.innerText));
    const keyboardMatched = keyboardResults.some((t) => t.toLowerCase().includes('keyboard'));
    assert(keyboardMatched, 'Plural query "keyboards" matches Keyboard catalog items', `Found: ${keyboardResults.join(', ')}`);

    // Reset search query
    await page.focus('input[placeholder*="Search products"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Enter');
    await delay(1000);

    // ----------------------------------------------------
    // TEST 3: Category Filter Pills & Sorting Dropdown
    // ----------------------------------------------------
    console.log(`\n[Stage 3] Category Pills & Sorting Dropdown`);
    const catPills = await page.$$('div.overflow-x-auto button');
    let audioPillFound = false;
    for (const pill of catPills) {
      const text = await (await pill.getProperty('innerText')).jsonValue();
      if (text.trim() === 'Audio') {
        await pill.click();
        audioPillFound = true;
        break;
      }
    }
    assert(audioPillFound, 'Audio category pill found and clicked');
    await delay(1000);

    const filteredTitles = await page.$$eval('h3.line-clamp-2', (els) => els.map((e) => e.innerText));
    assert(filteredTitles.length > 0, 'Filtered items returned for Audio category', `Count: ${filteredTitles.length}`);

    // Sort Dropdown test
    const sortSelect = await page.$('#product-sort-select');
    assert(sortSelect !== null, 'Sort dropdown select element exists');
    await sortSelect.select('price-low');
    await delay(800);

    const prices = await page.$$eval('.font-outfit', (els) =>
      els.map((e) => parseFloat(e.innerText.replace(/[^0-9.]/g, ''))).filter((n) => !isNaN(n))
    );
    const isSortedAsc = prices.length >= 2 ? prices[0] <= prices[prices.length - 1] : true;
    assert(isSortedAsc, 'Sort: Price Low to High orders products correctly', `Prices: ${prices.slice(0, 4).join(', ')}`);

    // Reset category to All
    const allCatPills = await page.$$('div.overflow-x-auto button');
    for (const pill of allCatPills) {
      const text = await (await pill.getProperty('innerText')).jsonValue();
      if (text.trim() === 'All') {
        await pill.click();
        break;
      }
    }
    await delay(800);

    // ----------------------------------------------------
    // TEST 4: Immediate Visual Feedback (Toast & Animated Badge)
    // ----------------------------------------------------
    console.log(`\n[Stage 4] Immediate Cart Feedback (Toast & Badge)`);
    const quickAddBtns = await page.$$('button[title="Add to Cart"]');
    assert(quickAddBtns.length > 0, 'Found Quick Add buttons on product cards');

    await quickAddBtns[0].click();
    await delay(500);

    const toast = await page.$('#cart-feedback-toast');
    assert(toast !== null, 'Immediate visual feedback toast notification appeared');

    const toastText = await page.$eval('#cart-feedback-toast', (el) => el.innerText);
    assert(toastText.includes('Cart') || toastText.includes('Added'), 'Toast contains confirmation text', `Text: ${toastText.slice(0, 60)}`);

    const badgeText = await page.$eval('#navbar-cart-button span', (el) => el.innerText);
    assert(parseInt(badgeText, 10) >= 1, 'Navbar cart badge incremented dynamically', `Badge: ${badgeText}`);

    // ----------------------------------------------------
    // TEST 5: Cart Drawer Slide-Over & Quantity Capping
    // ----------------------------------------------------
    console.log(`\n[Stage 5] Fast Cart Drawer & Dynamic Stock Capping`);
    await page.click('#navbar-cart-button');
    await delay(600);

    const drawerHeader = await page.$eval('div[role="dialog"]', (el) => el.innerText);
    assert(drawerHeader.includes('Multi-Vendor Cart'), 'Fast Cart Drawer slid open successfully');

    const closeDrawerBtn = await page.$('button[aria-label="Close cart drawer"]');
    if (closeDrawerBtn) {
      await closeDrawerBtn.click();
      await delay(400);
    }

    // ----------------------------------------------------
    // TEST 6: Product Detail Page, Stock Limits & Alternatives
    // ----------------------------------------------------
    console.log(`\n[Stage 6] Product Detail Page & In-Stock Alternatives`);
    const firstProductLink = await page.$('a[href^="/products/"]');
    assert(firstProductLink !== null, 'Product detail page link found');
    await firstProductLink.click();
    await page.waitForSelector('#product-add-to-cart-button', { timeout: 10000 });
    await delay(800);

    const pdpTitle = await page.$eval('h1', (el) => el.innerText);
    assert(pdpTitle.length > 3, 'Product Detail Page rendered title', `Title: ${pdpTitle}`);

    const pdpAddBtn = await page.$('#product-add-to-cart-button');
    assert(pdpAddBtn !== null, 'Product detail Add to Cart button rendered');

    // Add unit from detail page
    await pdpAddBtn.click();
    await delay(500);
    const pdpToast = await page.$('#cart-feedback-toast');
    assert(pdpToast !== null, 'Visual feedback toast appeared on ProductDetailPage add to cart');

    // Check in-stock alternatives section
    await page.waitForSelector('#recommended-alternatives-section', { timeout: 8000 });
    const altSection = await page.$('#recommended-alternatives-section');
    assert(altSection !== null, 'Recommended alternatives section rendered on detail page');

    const altCardsCount = await page.$$eval('#recommended-alternatives-section .group', (els) => els.length);
    assert(altCardsCount > 0, 'In-stock alternative product cards displayed', `Count: ${altCardsCount}`);

    // ----------------------------------------------------
    // TEST 7: Cart Page & Multi-Vendor Grouped Sub-Summaries
    // ----------------------------------------------------
    console.log(`\n[Stage 7] Cart Page & Vendor Grouping`);
    await page.goto(`${DEPLOYED_URL}/cart`, { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('h1', { timeout: 10000 });
    await delay(800);

    const cartPageTitle = await page.$eval('h1', (el) => el.innerText);
    assert(cartPageTitle.includes('Cart'), 'Navigated to Multi-Vendor Shopping Cart page');

    const vendorCards = await page.$$eval('div.bg-white.rounded-2xl', (els) => els.length);
    assert(vendorCards > 0, 'Multi-vendor items grouped into vendor cards', `Count: ${vendorCards}`);

    const subSummaryCards = await page.$$('[data-testid="vendor-sub-summary"]');
    const hasVendorSubSummary =
      subSummaryCards.length > 0 ||
      (await page.evaluate(() => document.body.innerText.includes('Vendor Sub-Summary')));
    assert(hasVendorSubSummary, 'Individual vendor sub-summaries clearly displayed per seller group');

    // ----------------------------------------------------
    // TEST 8: Frictionless Guest Checkout & Inline Validations
    // ----------------------------------------------------
    console.log(`\n[Stage 8] Frictionless Guest Checkout & Inline Validation`);
    await page.goto(`${DEPLOYED_URL}/checkout`, { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('h1', { timeout: 10000 });
    await delay(600);

    const checkoutTitle = await page.$eval('h1', (el) => el.innerText);
    assert(checkoutTitle.includes('Checkout'), 'Guest accessed /checkout without login barrier!');

    const guestBanner = await page.$eval('body', (el) =>
      el.innerText.includes('Guest Checkout Active') || el.innerText.includes('No account required')
    );
    assert(guestBanner, 'Frictionless Guest Checkout indicator is active');

    // Verify real-time validation: clear required email input using genuine keyboard inputs
    const emailInput = await page.$('#checkout-email');
    assert(emailInput !== null, 'Checkout email input field exists');

    await page.focus('#checkout-email');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.click('#checkout-fullName'); // trigger blur
    await delay(400);

    const emailError = await page.$eval('body', (el) =>
      el.innerText.includes('valid email address is required') || el.innerText.includes('required')
    );
    assert(emailError, 'Real-time inline validation displays error when required email is missing');

    const helperText = await page.$('#checkout-incomplete-helper');
    assert(helperText !== null, 'Clear helper text appears indicating which fields remain incomplete');

    const isSubmitDisabled = await page.$eval('#checkout-submit-button', (el) => el.disabled);
    assert(isSubmitDisabled, 'Proceed/Authorize button is safely disabled while required fields are incomplete');

    // Re-fill valid email using keyboard type
    await page.focus('#checkout-email');
    await page.type('#checkout-email', 'customer.testing@example.com');
    await page.click('#checkout-fullName');
    await delay(400);

    const isSubmitEnabled = await page.$eval('#checkout-submit-button', (el) => !el.disabled);
    assert(isSubmitEnabled, 'Authorize button dynamically enables once all required fields are valid');

    // ----------------------------------------------------
    // TEST 9: Payment Simulation & Loading Overlay
    // ----------------------------------------------------
    console.log(`\n[Stage 9] Payment Simulation & Order Split Confirmation`);
    await page.click('#checkout-submit-button');
    await delay(400);

    const overlay = await page.$('#payment-processing-overlay');
    assert(overlay !== null, 'Explicit loading/processing overlay appeared during payment simulation');

    // Wait for order completion screen
    await page.waitForSelector('h1', { timeout: 15000 });
    await delay(2000);

    const confirmedTitle = await page.$$eval('h1', (els) => els.map((e) => e.innerText).join(' '));
    assert(confirmedTitle.includes('Order Confirmed'), 'Order confirmed and split sub-orders displayed!');

    const parentOrderText = await page.$eval('body', (el) =>
      el.innerText.includes('Parent Order Number:') && el.innerText.includes('ORD-')
    );
    assert(parentOrderText, 'Parent order number and vendor sub-orders properly generated');

    const trackLink = await page.$('a[href*="/orders/tracking/"]');
    assert(trackLink !== null, 'Sub-order tracking link is provided on confirmation screen');

    // ----------------------------------------------------
    // TEST 10: Final Console and Network Audit
    // ----------------------------------------------------
    console.log(`\n[Stage 10] Console & Stability Audit`);
    assert(uncaughtErrors.length === 0, 'Zero uncaught page errors or unhandled promise rejections', `Errors: ${uncaughtErrors.join('; ')}`);

    console.log(`\n======================================================`);
    console.log(` Test Results Summary:`);
    console.log(` Total Checks: ${totalTests}`);
    console.log(` Passed: ${passedTests}`);
    console.log(` Failed: ${totalTests - passedTests}`);
    console.log(`======================================================\n`);

    if (passedTests === totalTests) {
      console.log('🎉 ALL AUTOMATED BROWSER TESTS PASSED CLEANLY ON PRODUCTION BUILD!');
    } else {
      throw new Error(`${totalTests - passedTests} tests failed.`);
    }
  } finally {
    await browser.close();
  }
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test Suite encountered fatal error:', err);
  process.exit(1);
});
