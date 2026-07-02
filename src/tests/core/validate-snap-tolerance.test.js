import { describe, it, expect } from 'vitest';
import { validateSnapVsTolerance } from '../../core/validators.js';

describe('validateSnapVsTolerance', () => {
    it('returns no warnings when snap is within half tolerance', () => {
        const part = {
            type: 'jsxgraph',
            graphCode: 'board.create("point", [0, 0], {snapSizeX: 0.01, snapSizeY: 0.01});',
            grading: { tightTol: 0.05 },
        };
        expect(validateSnapVsTolerance(part)).toEqual([]);
    });

    it('warns when snapSizeX exceeds half tolerance', () => {
        const part = {
            type: 'jsxgraph',
            graphCode: 'board.create("point", [0, 0], {snapSizeX: 0.1});',
            grading: { tightTol: 0.05 },
        };
        const warnings = validateSnapVsTolerance(part);
        expect(warnings).toHaveLength(1);
        expect(warnings[0].level).toBe('warning');
        expect(warnings[0].message).toContain('snapSizeX');
    });

    it('does not flag non-jsxgraph parts', () => {
        const part = {
            type: 'numerical',
            graphCode: 'snapSizeX: 10',
            grading: { tightTol: 0.05 },
        };
        expect(validateSnapVsTolerance(part)).toEqual([]);
    });

    it('returns no warnings when no snapSize is declared in graphCode', () => {
        const part = {
            type: 'jsxgraph',
            graphCode: 'board.create("point", [0, 0]);',
            grading: { tightTol: 0.05 },
        };
        expect(validateSnapVsTolerance(part)).toEqual([]);
    });

    it('detects both snapSizeX and snapSizeY violations separately', () => {
        const part = {
            type: 'jsxgraph',
            graphCode: '{snapSizeX: 0.1, snapSizeY: 0.2}',
            grading: { tightTol: 0.05 },
        };
        const warnings = validateSnapVsTolerance(part);
        expect(warnings).toHaveLength(2);
        const messages = warnings.map(w => w.message).join(' ');
        expect(messages).toContain('snapSizeX');
        expect(messages).toContain('snapSizeY');
    });

    it('skips when tightTol is 0 or missing', () => {
        const partZero = {
            type: 'jsxgraph',
            graphCode: '{snapSizeX: 0.5}',
            grading: { tightTol: 0 },
        };
        const partMissing = {
            type: 'jsxgraph',
            graphCode: '{snapSizeX: 0.5}',
            grading: {},
        };
        expect(validateSnapVsTolerance(partZero)).toEqual([]);
        expect(validateSnapVsTolerance(partMissing)).toEqual([]);
    });

    it('accepts snap exactly at half-tolerance boundary', () => {
        const part = {
            type: 'jsxgraph',
            graphCode: '{snapSizeX: 0.025}',
            grading: { tightTol: 0.05 },
        };
        expect(validateSnapVsTolerance(part)).toEqual([]);
    });
});
