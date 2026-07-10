// Phase 3 — teacher walkthrough (backlog A7/A8 acceptance).
// Role-play: a teacher who knows NO STACK, Maxima, or XML authors three
// representative question types end-to-end through the real UI (Playwright +
// Chromium against the Vite dev server). The script only does what a teacher
// could do with the visible UI: type in fields, click buttons, read dialogs.
// Everything the teacher sees (dialogs, notifications, warnings) is captured
// to an evidence directory for defect review; console errors anywhere fail
// the run.
//
// Usage: node scripts/phase3-teacher-walkthrough.mjs [evidenceDir]
//        (run `npm test` first so the dev test-status gate reads "pass")
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

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

const evidenceDir = process.argv[2] || join(tmpdir(), 'phase3-walkthrough');
mkdirSync(evidenceDir, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};
const teacherLog = []; // everything the teacher was shown
const note = (kind, text) => { teacherLog.push({ kind, text }); };

const { chromium } = resolvePlaywright();

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

// --- teacher-action helpers (only visible-UI interactions) ---------------
async function set(page, selector, value) {
    await page.fill(selector, value);
    await page.dispatchEvent(selector, 'change');
    await page.waitForTimeout(120); // state.notify() rerender
}
async function notifications(page) {
    // page.$$eval is Playwright's DOM query API running a FIXED function in
    // the locally-served page under test — no dynamic code is evaluated
    // (same pattern documented in scripts/a8-e2e.mjs).
    return page.$$eval('.notification', els => els.map(e => e.textContent)).catch(() => []);
}
async function exportQuestion(page, saveName) {
    const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15000 }),
        page.click('#btn-export-xml'),
    ]);
    const file = join(evidenceDir, saveName);
    await download.saveAs(file);
    return readFileSync(file, 'utf8');
}

try {
    await waitForServer();
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
    page.on('dialog', d => { note(`dialog(${d.type()})`, d.message()); d.accept(); });

    // ================================================================
    // SCENARIO 1 — numerical physics question, from scratch
    // "A stone is dropped from {@h@} m; how long until it hits the ground?"
    // ================================================================
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

    await set(page, '#q-name', 'Free fall time');
    await set(page, '#q-text',
        'A stone is dropped from rest at a height of {@h@} m above the ground. '
        + 'Taking the acceleration due to gravity as 9.81 m/s² and ignoring air '
        + 'resistance, calculate the time the stone takes to reach the ground. '
        + 'Give your answer in seconds to 3 significant figures.');

    // Teacher clicks the green "Auto-Detect {@vars@}" button
    await page.click('#btn-detect-vars');
    await page.waitForTimeout(200);
    note('notification', (await notifications(page)).join(' | '));
    const varNames1 = await page.$$eval('.var-name', els => els.map(e => e.value));
    check('S1 auto-detect created h', varNames1.includes('h'), varNames1.join(','));

    // Teacher edits h: a random height 10–30 m (uses the inline example hint)
    const hIdx = varNames1.indexOf('h');
    await set(page, `.var-val[data-idx="${hIdx}"]`, 'rand(20)+10');

    // Teacher adds a part (defaults to Numerical)
    await page.click('#btn-add-part');
    await page.waitForTimeout(150);
    await set(page, '.part-text[data-idx="0"]', 'Time to reach the ground (in seconds):');

    // The Answer Variable field: placeholder suggests ta1
    const ansPlaceholder = await page.getAttribute('.part-ans', 'placeholder');
    note('ui', `Answer Variable placeholder: ${ansPlaceholder}`);
    await set(page, '.part-ans', 'ta1');

    // Teacher must now DEFINE ta1 in "3. Question Values":
    // + Add, rename to ta1, type Calculated, value sqrt(2*h/9.81)
    await page.click('#btn-add-var');
    await page.waitForTimeout(150);
    let varCount = (await page.$$('.var-name')).length;
    const taIdx = varCount - 1;
    await set(page, `.var-name[data-idx="${taIdx}"]`, 'ta1');
    await page.selectOption(`.var-type[data-idx="${taIdx}"]`, 'calc');
    await page.waitForTimeout(150);
    await set(page, `.var-val[data-idx="${taIdx}"]`, 'sqrt(2*h/9.81)');

    // Walkthrough fix 3: the tolerance numbers must say what they mean
    const tolHints = await page.$$eval('.tol-hint', els => els.map(e => e.textContent));
    check('S1 tolerance hints disclose relative semantics',
        tolHints.some(t => t.includes('% of the correct answer')), tolHints.join(' | '));
    check('S1 tolerance mode selector present',
        (await page.$$('.g-tol-type')).length === 1);

    // Teacher turns on the significant-figures check (3 s.f.)
    await page.check('.g-check-sigfigs');
    await page.waitForTimeout(150);
    await set(page, '.g-sigfigs', '3');

    // Generate sample values — preview must show real numbers
    await page.click('#btn-gen-sample');
    await page.waitForTimeout(250);
    const liveVars1 = await page.textContent('#live-vars');
    note('preview', liveVars1.trim());
    check('S1 preview computes h and ta1',
        !liveVars1.includes('[Calc Error]') && !liveVars1.includes('[Preview N/A]')
        && /ta1/.test(liveVars1), liveVars1.replace(/\s+/g, ' ').slice(0, 120));
    await page.screenshot({ path: join(evidenceDir, 's1-authoring.png'), fullPage: true });

    // Download for Moodle
    const xml1 = await exportQuestion(page, 's1-free-fall.xml');
    note('notification', (await notifications(page)).join(' | '));
    check('S1 export produced STACK XML', xml1.includes('<question type="stack">'));
    check('S1 tans is the teacher answer', xml1.includes('<tans>ta1</tans>'));
    check('S1 sig-figs node present', xml1.includes('NumSigFigs'));
    check('S1 wrapped stackversion', xml1.includes('<stackversion><text>2025040100</text></stackversion>'));

    // Teacher re-opens their own file the next day (Load File)
    await page.reload({ waitUntil: 'networkidle' });
    await page.setInputFiles('#file-upload', join(evidenceDir, 's1-free-fall.xml'));
    await page.waitForTimeout(400);
    note('notification', (await notifications(page)).join(' | '));
    const reAns = await page.inputValue('.part-ans');
    check('S1 re-import restores the answer variable', reAns === 'ta1', reAns);
    const reText = await page.inputValue('#q-text');
    check('S1 re-import restores question text', reText.includes('{@h@}'));

    // ================================================================
    // SCENARIO 2 — multiple choice, from scratch
    // ================================================================
    await page.reload({ waitUntil: 'networkidle' });
    await set(page, '#q-name', 'SI unit of capacitance');
    await set(page, '#q-text', 'Which of the following is the SI unit of capacitance?');

    await page.click('#btn-add-part');
    await page.waitForTimeout(150);
    await page.selectOption('.part-type', 'radio');
    await page.waitForTimeout(200);
    await set(page, '.part-text[data-idx="0"]', 'Choose one:');

    const optionTexts = ['Farad', 'Henry', 'Tesla', 'Weber'];
    for (let i = 0; i < optionTexts.length; i++) {
        await page.click('.add-opt');
        await page.waitForTimeout(150);
        await set(page, `.opt-val[data-part="0"][data-opt="${i}"]`, optionTexts[i]);
    }
    await page.check('.opt-correct[data-part="0"][data-opt="0"]'); // Farad
    await page.waitForTimeout(150);
    await page.screenshot({ path: join(evidenceDir, 's2-authoring.png'), fullPage: true });

    const xml2 = await exportQuestion(page, 's2-capacitance-mcq.xml');
    note('notification', (await notifications(page)).join(' | '));
    check('S2 export produced STACK XML', xml2.includes('<question type="stack">'));
    check('S2 correct option is the tans value', /<tans>&quot;Farad&quot;<\/tans>|<tans>"Farad"<\/tans>/.test(xml2));
    check('S2 options are shuffled (random_permutation)', xml2.includes('random_permutation'));

    // ================================================================
    // SCENARIO 3 — algebraic question, from scratch
    // ================================================================
    await page.reload({ waitUntil: 'networkidle' });
    await set(page, '#q-name', 'Expand a square');
    await set(page, '#q-text', 'Expand \\( (x + {@a@})^2 \\). Give your answer as a sum of terms.');

    await page.click('#btn-detect-vars');
    await page.waitForTimeout(200);
    await set(page, '.var-val[data-idx="0"]', 'rand(5)+1'); // a = 1..5

    await page.click('#btn-add-part');
    await page.waitForTimeout(150);
    await page.selectOption('.part-type', 'algebraic');
    await page.waitForTimeout(200);
    await set(page, '.part-text[data-idx="0"]', 'Expanded form:');
    await set(page, '.part-ans', 'ta1');

    // Teacher writes the expanded answer themselves (plain school algebra)
    await page.click('#btn-add-var');
    await page.waitForTimeout(150);
    varCount = (await page.$$('.var-name')).length;
    await set(page, `.var-name[data-idx="${varCount - 1}"]`, 'ta1');
    await page.selectOption(`.var-type[data-idx="${varCount - 1}"]`, 'algebraic');
    await page.waitForTimeout(150);
    await set(page, `.var-val[data-idx="${varCount - 1}"]`, 'x^2 + 2*a*x + a^2');

    await page.click('#btn-gen-sample');
    await page.waitForTimeout(250);
    const liveVars3 = await page.textContent('#live-vars');
    note('preview', liveVars3.trim());
    check('S3 preview computes', !liveVars3.includes('[Calc Error]'), liveVars3.replace(/\s+/g, ' ').slice(0, 120));
    await page.screenshot({ path: join(evidenceDir, 's3-authoring.png'), fullPage: true });

    const xml3 = await exportQuestion(page, 's3-expand-square.xml');
    note('notification', (await notifications(page)).join(' | '));
    check('S3 export produced STACK XML', xml3.includes('<question type="stack">'));
    check('S3 algebraic input with implied multiplication pinned',
        xml3.includes('<insertstars>1</insertstars>') && xml3.includes('<strictsyntax>1</strictsyntax>'));
    check('S3 tans is the teacher answer', xml3.includes('<tans>ta1</tans>'));

    // ================================================================
    // Walkthrough fix 1: with a green test run, the dev gate must be silent
    const gateDialogs = teacherLog.filter(e =>
        e.kind.startsWith('dialog') && /test status|test-status|npm run test/i.test(e.text));
    check('no developer test-status dialog after a green run',
        gateDialogs.length === 0, gateDialogs.map(d => d.text).join(' | ').slice(0, 160));

    check('zero console errors across all three scenarios',
        consoleErrors.length === 0, consoleErrors.join(' | ').slice(0, 300));

    writeFileSync(join(evidenceDir, 'teacher-log.json'),
        JSON.stringify({ teacherLog, consoleErrors, results }, null, 2));
    await browser.close();
} finally {
    server.kill();
    spawn('powershell', ['-Command',
        "Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"],
    { shell: false, stdio: 'ignore' });
}

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
console.log(`Evidence: ${evidenceDir}`);
process.exit(failed.length === 0 ? 0 : 1);
