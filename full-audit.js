const { chromium } = require('playwright');
const path = require('path');

const SCRATCHPAD = '/tmp/claude-0/-home-user-candidato-app/49f0037a-0289-51c7-a4c1-a17968180e40/scratchpad';
const BASE = 'http://localhost:3000';

async function screenshot(page, name) {
  const p = path.join(SCRATCHPAD, `new-${name}.png`);
  await page.screenshot({ path: p, fullPage: true });
  console.log(`SCREENSHOT: ${p}`);
  return p;
}

async function checkHorizontalScroll(page, label) {
  const sw = await page.evaluate(() => document.body.scrollWidth);
  const vw = await page.evaluate(() => window.innerWidth);
  if (sw > vw) {
    console.log(`HSCROLL_FAIL [${label}]: scrollWidth=${sw} > viewportWidth=${vw}`);
  } else {
    console.log(`HSCROLL_OK [${label}]: scrollWidth=${sw} <= viewportWidth=${vw}`);
  }
}

async function checkFontSizes(page, label) {
  const tiny = await page.evaluate(() => {
    const results = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let node;
    while ((node = walker.nextNode())) {
      const el = node;
      if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;
      const text = el.textContent.trim();
      if (!text) continue;
      const style = window.getComputedStyle(el);
      const fs = parseFloat(style.fontSize);
      if (fs < 12 && fs > 0) {
        results.push({ tag: el.tagName, class: el.className.toString().slice(0, 50), fontSize: fs, text: text.slice(0, 40) });
      }
    }
    return results;
  });
  if (tiny.length > 0) {
    console.log(`FONTSIZE_FAIL [${label}]: ${tiny.length} elements below 12px:`);
    tiny.slice(0, 5).forEach(t => console.log(`  ${t.tag}.${t.class} fs=${t.fontSize}px "${t.text}"`));
  } else {
    console.log(`FONTSIZE_OK [${label}]: all text >= 12px`);
  }
}

async function checkTouchTargets(page, label) {
  const small = await page.evaluate(() => {
    const results = [];
    const els = document.querySelectorAll('button, a, input, [role="button"]');
    els.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if (rect.height < 44 || rect.width < 44) {
        const text = (el.textContent || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().slice(0, 40);
        results.push({ tag: el.tagName, class: el.className.toString().slice(0, 50), w: Math.round(rect.width), h: Math.round(rect.height), text });
      }
    });
    return results;
  });
  if (small.length > 0) {
    console.log(`TOUCH_WARN [${label}]: ${small.length} elements < 44px touch target:`);
    small.slice(0, 8).forEach(t => console.log(`  ${t.tag}.${t.class} ${t.w}x${t.h}px "${t.text}"`));
  } else {
    console.log(`TOUCH_OK [${label}]: all interactive elements >= 44px`);
  }
}

async function checkConsoleErrors(page, label) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  // errors captured during navigation
  return errors;
}

async function getLinks(page, selector) {
  return page.evaluate((sel) => {
    const els = document.querySelectorAll(sel);
    return Array.from(els).map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') }));
  }, selector);
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });

  const viewports = {
    desktop: { width: 1280, height: 800 },
    mobile: { width: 375, height: 812 },
  };

  // ============================================================
  // 1. LANDING PAGE /
  // ============================================================
  console.log('\n=== LANDING PAGE / ===');

  for (const [vname, vp] of Object.entries(viewports)) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    await screenshot(page, `landing-${vname}`);
    await checkHorizontalScroll(page, `landing/${vname}`);
    await checkFontSizes(page, `landing/${vname}`);
    if (vname === 'mobile') await checkTouchTargets(page, `landing/mobile`);

    // Check H1
    const h1 = await page.$eval('h1', el => el.textContent.trim()).catch(() => 'NOT FOUND');
    console.log(`H1 [${vname}]: "${h1}"`);

    // Check nav
    const navLinks = await getLinks(page, 'nav a');
    console.log(`NAV LINKS [${vname}]: ${JSON.stringify(navLinks)}`);

    // Check CTA buttons
    const ctaBtns = await page.evaluate(() => {
      const btns = document.querySelectorAll('.btn, button, a.btn-forest, a.btn-outline');
      return Array.from(btns).slice(0, 10).map(b => ({
        text: b.textContent.trim().slice(0, 40),
        href: b.getAttribute('href'),
        w: Math.round(b.getBoundingClientRect().width),
        h: Math.round(b.getBoundingClientRect().height),
      }));
    });
    console.log(`CTA BUTTONS [${vname}]: ${JSON.stringify(ctaBtns)}`);

    // Check footer legal links
    const footerLinks = await getLinks(page, 'footer a');
    console.log(`FOOTER LINKS [${vname}]: ${JSON.stringify(footerLinks)}`);
    const hasPrivacidad = footerLinks.some(l => l.href && l.href.includes('privacidad'));
    const hasTerminos = footerLinks.some(l => l.href && l.href.includes('terminos'));
    console.log(`FOOTER_LEGAL [${vname}]: privacidad=${hasPrivacidad}, terminos=${hasTerminos}`);

    // Mobile-specific: logo centered
    if (vname === 'mobile') {
      const logoInfo = await page.evaluate(() => {
        const logo = document.querySelector('nav .logo, nav a[href="/"], nav .brand, header .logo');
        if (!logo) return null;
        const rect = logo.getBoundingClientRect();
        return { x: rect.x, y: rect.y, w: rect.width, h: rect.height, text: logo.textContent.trim() };
      });
      console.log(`MOBILE LOGO [mobile]: ${JSON.stringify(logoInfo)}`);

      // Check hamburger
      const hamburger = await page.evaluate(() => {
        const el = document.querySelector('.hamburger, .nav-toggle, [aria-label="menu"], button[class*="menu"]');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { visible: rect.width > 0, w: rect.width, h: rect.height };
      });
      console.log(`HAMBURGER [mobile]: ${JSON.stringify(hamburger)}`);
    }

    // Trust bar presence
    const trustBar = await page.$('.trust-bar');
    console.log(`TRUST_BAR [${vname}]: ${trustBar ? 'present' : 'NOT FOUND'}`);

    // Hero sections
    const heroR = await page.$('.hero-r');
    const heroMobile = await page.$('.hero-mobile-visual');
    console.log(`HERO_R [${vname}]: ${heroR ? 'present' : 'NOT FOUND'}`);
    console.log(`HERO_MOBILE [${vname}]: ${heroMobile ? 'present' : 'NOT FOUND'}`);

    if (errors.length > 0) {
      console.log(`CONSOLE_ERRORS [${vname}]: ${errors.join(' | ')}`);
    } else {
      console.log(`CONSOLE_ERRORS [${vname}]: none`);
    }

    await ctx.close();
  }

  // ============================================================
  // 2. APP /app
  // ============================================================
  console.log('\n=== APP /app ===');

  for (const [vname, vp] of Object.entries(viewports)) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await page.goto(BASE + '/app', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    await screenshot(page, `app-gate-${vname}`);
    await checkHorizontalScroll(page, `app/${vname}`);
    if (vname === 'mobile') {
      await checkFontSizes(page, `app/mobile`);
      await checkTouchTargets(page, `app/mobile`);
    }

    // Check logo centering on mobile
    if (vname === 'mobile') {
      const logoInfo = await page.evaluate(() => {
        const logo = document.querySelector('.logo, a[href="/"], .brand, h1');
        if (!logo) return null;
        const rect = logo.getBoundingClientRect();
        const vw = window.innerWidth;
        const center = rect.x + rect.width / 2;
        const diff = Math.abs(center - vw / 2);
        return { x: Math.round(rect.x), center: Math.round(center), vwCenter: Math.round(vw/2), diff: Math.round(diff), text: logo.textContent.trim().slice(0, 30) };
      });
      console.log(`APP_LOGO_CENTERING [mobile]: ${JSON.stringify(logoInfo)}`);
    }

    // Check type toggle
    const toggle = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      const toggleBtns = Array.from(btns).filter(b => {
        const t = b.textContent.trim();
        return t.includes('candidato') || t.includes('empresa') || t.includes('Candidato') || t.includes('Empresa');
      });
      return toggleBtns.map(b => ({ text: b.textContent.trim().slice(0, 40), h: Math.round(b.getBoundingClientRect().height) }));
    });
    console.log(`TYPE_TOGGLE [${vname}]: ${JSON.stringify(toggle)}`);

    // Check email input
    const emailInput = await page.evaluate(() => {
      const el = document.querySelector('input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]');
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { h: Math.round(rect.height), placeholder: el.placeholder };
    });
    console.log(`EMAIL_INPUT [${vname}]: ${JSON.stringify(emailInput)}`);

    if (errors.length > 0) {
      console.log(`APP_ERRORS [${vname}]: ${errors.join(' | ')}`);
    } else {
      console.log(`APP_ERRORS [${vname}]: none`);
    }

    await ctx.close();
  }

  // Test welcome-back screen with demo
  {
    const ctx = await browser.newContext({ viewport: viewports.desktop });
    const page = await ctx.newPage();
    await page.goto(BASE + '/app?demo=candidate', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await screenshot(page, 'app-demo-candidate-desktop');
    const welcomeText = await page.evaluate(() => document.body.innerText.slice(0, 200));
    console.log(`DEMO_CANDIDATE_TEXT: ${welcomeText.replace(/\n/g, ' | ')}`);
    await ctx.close();
  }

  // ============================================================
  // 3. LEGAL PAGES
  // ============================================================
  console.log('\n=== LEGAL PAGES ===');

  for (const legalPath of ['/privacidad', '/terminos']) {
    for (const [vname, vp] of Object.entries(viewports)) {
      const ctx = await browser.newContext({ viewport: vp });
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

      const res = await page.goto(BASE + legalPath, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);

      const status = res ? res.status() : 'no response';
      console.log(`STATUS [${legalPath}/${vname}]: ${status}`);

      if (status === 200 && vname === 'desktop') {
        await screenshot(page, `legal${legalPath.replace('/', '-')}-${vname}`);
        await checkHorizontalScroll(page, `${legalPath}/${vname}`);

        // Cross-link check
        const crossPath = legalPath === '/privacidad' ? '/terminos' : '/privacidad';
        const bodyLinks = await getLinks(page, 'main a, article a, .content a, body a');
        const hasCross = bodyLinks.some(l => l.href && l.href.includes(crossPath.slice(1)));
        const hasHomeLink = bodyLinks.some(l => l.href === '/' || l.href === BASE + '/' || (l.href && l.href.endsWith('/')));
        console.log(`CROSS_LINK [${legalPath}]: to ${crossPath} = ${hasCross}`);
        console.log(`HOME_LINK [${legalPath}]: ${hasHomeLink}`);
        console.log(`ALL_LINKS [${legalPath}]: ${JSON.stringify(bodyLinks.slice(0, 10))}`);
      }

      if (errors.length > 0) console.log(`ERRORS [${legalPath}/${vname}]: ${errors.join(' | ')}`);

      await ctx.close();
    }
  }

  // ============================================================
  // 4. 404 PAGE
  // ============================================================
  console.log('\n=== 404 PAGE ===');
  {
    const ctx = await browser.newContext({ viewport: viewports.desktop });
    const page = await ctx.newPage();
    const res = await page.goto(BASE + '/this-page-does-not-exist', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await screenshot(page, '404-desktop');
    const status = res ? res.status() : 'no response';
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
    const hasNav = await page.$('nav');
    const brandedColors = await page.evaluate(() => {
      const bg = window.getComputedStyle(document.body).backgroundColor;
      return bg;
    });
    console.log(`404_STATUS: ${status}`);
    console.log(`404_BODY: ${bodyText.replace(/\n/g, ' | ').slice(0, 200)}`);
    console.log(`404_HAS_NAV: ${hasNav ? 'yes' : 'no'}`);
    console.log(`404_BG_COLOR: ${brandedColors}`);
    await ctx.close();
  }

  // ============================================================
  // 5. MATCHGRAPH /app/matchgraph
  // ============================================================
  console.log('\n=== MATCHGRAPH /app/matchgraph ===');

  for (const [vname, vp] of Object.entries(viewports)) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await page.goto(BASE + '/app/matchgraph', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    await screenshot(page, `mg-${vname}`);
    await checkHorizontalScroll(page, `matchgraph/${vname}`);

    // Check login form elements
    const formEls = await page.evaluate(() => {
      const email = document.querySelector('input[type="email"], input[placeholder*="email"]');
      const submit = document.querySelector('button[type="submit"], form button');
      const logoEl = document.querySelector('.logo, img[alt*="logo"], img[alt*="Candidato"]');
      return {
        hasEmail: !!email,
        hasSubmit: !!submit,
        submitText: submit ? submit.textContent.trim().slice(0, 30) : null,
        hasLogo: !!logoEl,
      };
    });
    console.log(`MG_FORM [${vname}]: ${JSON.stringify(formEls)}`);

    // Check context line on mobile
    if (vname === 'mobile') {
      const contextLine = await page.evaluate(() => {
        const els = document.querySelectorAll('p, span, .subtitle, .context');
        const candidates = Array.from(els).filter(el => {
          const t = el.textContent.trim();
          return t.length > 10 && t.length < 200;
        });
        return candidates.slice(0, 5).map(el => ({
          tag: el.tagName,
          text: el.textContent.trim().slice(0, 80),
          fs: parseFloat(window.getComputedStyle(el).fontSize),
        }));
      });
      console.log(`MG_CONTEXT_LINE [mobile]: ${JSON.stringify(contextLine)}`);
    }

    if (errors.length > 0) console.log(`MG_ERRORS [${vname}]: ${errors.join(' | ')}`);

    await ctx.close();
  }

  // ============================================================
  // 6. OG IMAGE
  // ============================================================
  console.log('\n=== OG IMAGE ===');
  {
    const ctx = await browser.newContext({ viewport: viewports.desktop });
    const page = await ctx.newPage();
    const res = await page.goto(BASE + '/opengraph-image', { waitUntil: 'networkidle' });
    const status = res ? res.status() : 'no response';
    const contentType = res ? res.headers()['content-type'] : 'unknown';
    console.log(`OG_STATUS: ${status}`);
    console.log(`OG_CONTENT_TYPE: ${contentType}`);
    if (status === 200 && contentType && contentType.includes('image')) {
      await screenshot(page, 'og-image');
      console.log(`OG_IMAGE: OK - real image returned`);
    } else {
      console.log(`OG_IMAGE: FAIL - status=${status} type=${contentType}`);
    }
    await ctx.close();
  }

  // ============================================================
  // 7. VERIFY SCREEN - /app registration flow
  // ============================================================
  console.log('\n=== VERIFY FLOW /app ===');
  {
    const ctx = await browser.newContext({ viewport: viewports.mobile });
    const page = await ctx.newPage();
    await page.goto(BASE + '/app', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    // Select "Soy candidato" if not already selected
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      const candidatoBtn = Array.from(btns).find(b => b.textContent.toLowerCase().includes('candidato'));
      if (candidatoBtn) candidatoBtn.click();
    });
    await page.waitForTimeout(200);

    // Type a test email
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.fill('test-audit@example.com');
      await page.waitForTimeout(200);
      await screenshot(page, 'verify-email-filled');

      // Submit
      const submitBtn = await page.$('button[type="submit"], form button');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(1000);
        await screenshot(page, 'verify-after-submit');
        const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
        console.log(`VERIFY_FLOW_RESULT: ${bodyText.replace(/\n/g, ' | ').slice(0, 200)}`);
      }
    }

    await ctx.close();
  }

  // ============================================================
  // 8. PERFORMANCE SWEEP - horizontal scroll on key pages
  // ============================================================
  console.log('\n=== PERFORMANCE SWEEP (mobile 375px) ===');
  const mobileVp = { width: 375, height: 812 };
  for (const testPath of ['/', '/app', '/privacidad']) {
    const ctx = await browser.newContext({ viewport: mobileVp });
    const page = await ctx.newPage();
    await page.goto(BASE + testPath, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await checkHorizontalScroll(page, `perf-mobile${testPath}`);
    await ctx.close();
  }

  await browser.close();
  console.log('\n=== AUDIT COMPLETE ===');
})();
