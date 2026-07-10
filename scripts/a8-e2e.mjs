// A8 release-gate end-to-end pass (Playwright + Chromium against the real
// Vite dev server). Covers the stage-2 items' UI surface in one run
// (RAM-constrained box — see run notes D-app-13):
//   A7 labels visible, A2 answer-variable field, A3 preview sanity,
//   A6 blocking gate + pass copy, A5/A4/A10 content of the downloaded file,
//   zero console errors (favicon fixed in A7).
// Usage: node scripts/a8-e2e.mjs   (expects `npm test` run recently so the
// dev test-status gate reads "pass"; starts/stops its own dev server)
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, existsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Playwright lives in the npx cache on this machine (not a project dep).
function resolvePlaywright() {
    const req = createRequire(import.meta.url);
    try { return req('playwright'); } catch { /* fall through */ }
    const cacheRoot = process.env.PLAYWRIGHT_PKG_DIR
        || join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
    for (const entry of readdirSync(cacheRoot)) {
        const candidate = join(cacheRoot, entry, 'node_modules', 'playwright');
        if (existsSync(candidate)) return req(candidate);
    }
    throw new Error('playwright not found — set PLAYWRIGHT_PKG_DIR');
}

const results = [];
const check = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

const { chromium } = resolvePlaywright();

// 1. Start the dev server
const server = spawn('npx', ['vite', '--port', '3000'], { shell: true, stdio: 'pipe' });
const waitForServer = async () => {
    for (let i = 0; i < 60; i++) {
        try {
            const res = await fetch('http://localhost:3000/');
            if (res.ok) return;
        } catch { /* retry */ }
        await new Promise(r => setTimeout(r, 500));
    }
    throw new Error('dev server did not start');
};

try {
    await waitForServer();
    // The installed browser set (chromium-1223) may trail the cached
    // playwright package's expected revision — point at what exists.
    const msPlaywright = join(process.env.LOCALAPPDATA || '', 'ms-playwright');
    let executablePath;
    if (existsSync(msPlaywright)) {
        for (const entry of readdirSync(msPlaywright)) {
            if (/^chromium-\d+$/.test(entry)) {
                const exe = join(msPlaywright, entry, 'chrome-win64', 'chrome.exe');
                const exeOld = join(msPlaywright, entry, 'chrome-win', 'chrome.exe');
                if (existsSync(exe)) executablePath = exe;
                else if (existsSync(exeOld)) executablePath = exeOld;
            }
        }
    }
    const browser = await chromium.launch(executablePath ? { executablePath } : {});
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push(String(err)));
    page.on('dialog', d => d.accept()); // A6 warning confirms / test-status prompt

    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

    // A7: labels
    check('A7 export button label', (await page.textContent('#btn-export-xml')).trim() === 'Download for Moodle');
    check('A7 variables heading', (await page.textContent('#variables-heading')).includes('Question Values'));

    // Load the projectile template through the real dropdown
    await page.selectOption('#template-select', 'projectile');
    await page.waitForTimeout(300);

    // A2: answer-variable field shows ta1 (not the input name)
    const ansField = await page.inputValue('.part-ans');
    check('A2 answer variable field = ta1', ansField === 'ta1', ansField);

    // A3: sample values compute (no calc errors in the live readout)
    await page.click('#btn-gen-sample');
    await page.waitForTimeout(200);
    const liveVars = await page.textContent('#live-vars');
    check('A3 preview computes', !liveVars.includes('[Calc Error]') && !liveVars.includes('[Preview N/A]'));

    // A6 + A5/A4/A10: export through the real download path
    const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15000 }),
        page.click('#btn-export-xml'),
    ]);
    const dir = mkdtempSync(join(tmpdir(), 'a8-'));
    const file = join(dir, 'projectile.xml');
    await download.saveAs(file);
    const xml = readFileSync(file, 'utf8');
    check('A4 wrapped stackversion', xml.includes('<stackversion><text>2025040100</text></stackversion>'));
    check('A1 no AT-prefixed answertests', ![...xml.matchAll(/<answertest>([^<]+)</g)].some(m => m[1].startsWith('AT')));
    check('A5 qtests present', [...xml.matchAll(/<qtest>/g)].length >= 2);
    check('A5 deployed seeds', [...xml.matchAll(/<deployedseed>/g)].length === 3);
    check('A5 sign-flip distractor expectation', xml.includes('ev(-(ta1), simp)'));
    check('A10 note carries teacher answer', xml.includes('ans1={@significantfigures(ta1,4)@}'));
    check('A11 sign-flip node emitted', xml.includes('is_sign_flip'));
    check('A2 no self-comparing tans', !/<sans>(ans\d+)<\/sans>\s*<tans>\1<\/tans>/.test(xml));

    // A6 pass copy (notifications stack briefly — inspect all of them).
    // page.$$eval is Playwright's DOM query API running a FIXED function in
    // the locally-served page under test — no dynamic code is evaluated.
    const notifs = await page.$$eval('.notification', els => els.map(e => e.textContent)).catch(() => []);
    check('A6 pass copy', notifs.some(n => n.includes('Structure checks passed')), notifs.join(' | ').slice(0, 120));

    // A6 blocking gate: clear the question name -> export must be blocked
    await page.fill('#q-name', '');
    await page.dispatchEvent('#q-name', 'change');
    await page.waitForTimeout(200);
    let blocked = true;
    try {
        await Promise.all([
            page.waitForEvent('download', { timeout: 3000 }),
            page.click('#btn-export-xml'),
        ]);
        blocked = false;
    } catch { /* no download = blocked, as intended */ }
    const blockMsg = await page.textContent('.notification-error').catch(() => '');
    check('A6 blocks invalid export', blocked && (blockMsg || '').includes('E-GEN-01'), blockMsg.slice(0, 80));

    // Import roundtrip through the real file-upload path
    await page.reload({ waitUntil: 'networkidle' });
    await page.setInputFiles('#file-upload', file);
    await page.waitForTimeout(400);
    const importNotif = await page.textContent('.notification').catch(() => '');
    check('A7/X1 import notification', (importNotif || '').includes('Question file imported'));
    const importedAns = await page.inputValue('.part-ans');
    check('X1 roundtrip restores answer variable', importedAns === 'ta1', importedAns);

    check('zero console errors', consoleErrors.length === 0, consoleErrors.join(' | ').slice(0, 200));

    await browser.close();
} finally {
    server.kill();
    // vite spawns via shell; make sure the port is freed on Windows
    spawn('powershell', ['-Command',
        "Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"],
    { shell: false, stdio: 'ignore' });
}

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
