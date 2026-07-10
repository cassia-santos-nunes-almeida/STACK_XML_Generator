// The dev export gate (P-TEST-01) reads /test-status.json, written by the
// custom Vitest reporter. Vitest 4 removed the legacy `onFinished` reporter
// hook, which silently killed the file — every export then showed the
// teacher a "Could not verify test status" dialog even after a green run
// (found by the Phase-3 teacher walkthrough, 2026-07-10). These tests pin
// the modern `onTestRunEnd` hook AND the legacy hook so an old Vitest also
// keeps the gate fed.
import { describe, it, expect } from 'vitest';
import { readFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import StatusReporter from '../../../scripts/vitest-status-reporter.js';

const tempStatusPath = () => join(mkdtempSync(join(tmpdir(), 'status-')), 'test-status.json');

// Minimal stand-in for a Vitest 4 TestModule: children.allTests() yields
// TestCase objects whose result() carries { state }.
const fakeModule = (states) => ({
    children: {
        allTests: function* () {
            for (const state of states) yield { result: () => ({ state }) };
        },
    },
});

const readStatus = (path) => JSON.parse(readFileSync(path, 'utf8'));

describe('vitest status reporter — Vitest 4 onTestRunEnd hook', () => {
    it('writes pass status when every test passed', () => {
        const path = tempStatusPath();
        new StatusReporter(path).onTestRunEnd(
            [fakeModule(['passed', 'passed']), fakeModule(['passed'])], []);
        const status = readStatus(path);
        expect(status.status).toBe('pass');
        expect(status.passed).toBe(3);
        expect(status.failed).toBe(0);
        expect(status.total).toBe(3);
        expect(status.suites).toBe(2);
        expect(status.timestamp).toBeTruthy();
    });

    it('writes fail status when any test failed', () => {
        const path = tempStatusPath();
        new StatusReporter(path).onTestRunEnd(
            [fakeModule(['passed', 'failed', 'skipped'])], []);
        const status = readStatus(path);
        expect(status.status).toBe('fail');
        expect(status.failed).toBe(1);
        expect(status.passed).toBe(1);
    });

    it('writes fail status on unhandled errors even if tests passed', () => {
        const path = tempStatusPath();
        new StatusReporter(path).onTestRunEnd(
            [fakeModule(['passed'])], [new Error('boom')]);
        expect(readStatus(path).status).toBe('fail');
    });

    it('does not count skipped/pending tests as failures', () => {
        const path = tempStatusPath();
        new StatusReporter(path).onTestRunEnd(
            [fakeModule(['skipped', 'pending', 'passed'])], []);
        const status = readStatus(path);
        expect(status.status).toBe('pass');
        expect(status.total).toBe(1);
    });
});

describe('vitest status reporter — legacy onFinished hook (pre-4 Vitest)', () => {
    it('still writes from the legacy task tree', () => {
        const path = tempStatusPath();
        const legacyFile = {
            type: 'suite',
            tasks: [
                { type: 'test', result: { state: 'pass' } },
                { type: 'test', result: { state: 'fail' } },
            ],
        };
        new StatusReporter(path).onFinished([legacyFile], []);
        const status = readStatus(path);
        expect(status.status).toBe('fail');
        expect(status.passed).toBe(1);
        expect(status.failed).toBe(1);
    });
});
