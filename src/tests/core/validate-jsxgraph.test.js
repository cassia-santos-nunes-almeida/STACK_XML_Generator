import { describe, it, expect } from 'vitest';
import { validateJSXGraphBlocks, validateQuestionData } from '../../core/validators.js';

describe('validateJSXGraphBlocks', () => {
    it('returns no warnings for correct {#var#} usage', () => {
        const part = { type: 'jsxgraph', graphCode: 'board.create("point", [{#x#}, {#y#}]);' };
        expect(validateJSXGraphBlocks(part)).toEqual([]);
    });

    it('warns on {@var@} usage inside graphCode', () => {
        const part = { type: 'jsxgraph', graphCode: 'board.create("point", [{@x@}, 5]);' };
        const warnings = validateJSXGraphBlocks(part);
        expect(warnings).toHaveLength(1);
        expect(warnings[0].level).toBe('error');
        expect(warnings[0].message).toContain('{@x@}');
        expect(warnings[0].message).toContain('{#x#}');
    });

    it('does not flag non-jsxgraph parts', () => {
        const part = { type: 'numerical', graphCode: 'point({@x@}, 5)' };
        expect(validateJSXGraphBlocks(part)).toEqual([]);
    });

    it('tolerates empty graphCode', () => {
        const part = { type: 'jsxgraph', graphCode: '' };
        expect(validateJSXGraphBlocks(part)).toEqual([]);
    });

    it('reports one warning per offending variable', () => {
        const part = { type: 'jsxgraph', graphCode: 'line([{@a@}, 0], [{@b@}, 10])' };
        const warnings = validateJSXGraphBlocks(part);
        expect(warnings).toHaveLength(2);
        expect(warnings.map(w => w.message).join(' ')).toContain('{@a@}');
        expect(warnings.map(w => w.message).join(' ')).toContain('{@b@}');
    });

    it('flags JSXGraph issues via validateQuestionData with part label', () => {
        const issues = validateQuestionData({
            name: 'Test', questionText: 'test',
            parts: [{
                id: 1, type: 'jsxgraph', answer: 'ans1',
                graphCode: 'point({@x@}, 0)',
                gradingCode: 'all_correct: true',
                grading: {}, options: [],
            }],
            variables: [{ name: 'x', type: 'rand', value: 'rand(5)' }],
        });
        const jsxIssue = issues.find(i => i.message.includes('{@x@}'));
        expect(jsxIssue).toBeDefined();
        expect(jsxIssue.message).toContain('Part (a)');
    });
});
