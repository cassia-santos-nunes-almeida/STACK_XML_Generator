// Custom Vitest reporter — writes src/public/test-status.json after each run.
// The UI reads this file to gate XML export on test health (P-TEST-01).
//
// Output shape:
//   { status: 'pass' | 'fail', timestamp, total, passed, failed, suites }
//
// The file lives under src/public/ so Vite serves it at /test-status.json in
// dev. In production the DEV gate in app.js skips the fetch entirely.
//
// Vitest 4 removed the legacy `onFinished` reporter hook; this reporter
// implements BOTH the modern `onTestRunEnd` (Vitest 3+/4) and the legacy
// `onFinished` (pre-3) so the gate stays fed across Vitest upgrades. The
// legacy hook going silently uncalled is exactly how the gate died before
// the Phase-3 teacher walkthrough caught it (2026-07-10).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const STATUS_PATH = resolve('src/public/test-status.json');

export default class StatusReporter {
    constructor(statusPath = STATUS_PATH) {
        this.statusPath = statusPath;
    }

    /** Vitest 3+/4 reporter hook (TestModule / TestCase API). */
    onTestRunEnd(testModules = [], unhandledErrors = []) {
        let passed = 0;
        let failed = 0;

        for (const module of testModules) {
            for (const test of module.children?.allTests?.() ?? []) {
                const state = test.result?.()?.state;
                if (state === 'passed') passed++;
                else if (state === 'failed') failed++;
            }
        }

        this.#write(passed, failed, testModules.length, unhandledErrors);
    }

    /** Legacy (pre-Vitest-3) reporter hook — kept for back-compat. */
    onFinished(files = [], errors = []) {
        let passed = 0;
        let failed = 0;

        const walk = (task) => {
            if (task.type === 'test') {
                const state = task.result?.state;
                if (state === 'pass') passed++;
                else if (state === 'fail') failed++;
            }
            if (task.tasks) task.tasks.forEach(walk);
        };
        files.forEach(walk);

        this.#write(passed, failed, files.length, errors);
    }

    #write(passed, failed, suites, errors) {
        const hasErrors = Array.isArray(errors) && errors.length > 0;
        const status = failed === 0 && !hasErrors ? 'pass' : 'fail';

        const payload = {
            status,
            timestamp: new Date().toISOString(),
            total: passed + failed,
            passed,
            failed,
            suites,
        };

        try {
            mkdirSync(dirname(this.statusPath), { recursive: true });
            writeFileSync(this.statusPath, JSON.stringify(payload, null, 2) + '\n');
        } catch (e) {
            console.warn(`[vitest-status-reporter] failed to write ${this.statusPath}:`, e.message);
        }
    }
}
