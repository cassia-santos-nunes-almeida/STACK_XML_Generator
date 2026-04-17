// Custom Vitest reporter — writes src/public/test-status.json after each run.
// The UI reads this file to gate XML export on test health (P-TEST-01).
//
// Output shape:
//   { status: 'pass' | 'fail', timestamp, total, passed, failed, suites }
//
// The file lives under src/public/ so Vite serves it at /test-status.json in
// dev. In production the DEV gate in app.js skips the fetch entirely.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const STATUS_PATH = resolve('src/public/test-status.json');

export default class StatusReporter {
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

        const hasErrors = Array.isArray(errors) && errors.length > 0;
        const status = failed === 0 && !hasErrors ? 'pass' : 'fail';

        const payload = {
            status,
            timestamp: new Date().toISOString(),
            total: passed + failed,
            passed,
            failed,
            suites: files.length,
        };

        try {
            mkdirSync(dirname(STATUS_PATH), { recursive: true });
            writeFileSync(STATUS_PATH, JSON.stringify(payload, null, 2) + '\n');
        } catch (e) {
            console.warn(`[vitest-status-reporter] failed to write ${STATUS_PATH}:`, e.message);
        }
    }
}
