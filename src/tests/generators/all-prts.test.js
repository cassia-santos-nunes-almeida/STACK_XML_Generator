import { describe, it, expect } from 'vitest';
import { generateAlgebraicPRT } from '../../generators/prts/algebraic-prt.js';
import { generateMatrixPRT } from '../../generators/prts/matrix-prt.js';
import { generateStringPRT } from '../../generators/prts/string-prt.js';
import { generateJSXGraphPRT, GRAPH_GRADING_TEMPLATES } from '../../generators/prts/jsxgraph-prt.js';
import { generatePresetGraphCode } from '../../generators/graph-presets.js';

describe('Algebraic PRT', () => {
    it('uses AlgEquiv test', () => {
        const xml = generateAlgebraicPRT({ answer: 'ans1', feedback: {} }, 'prt1');
        expect(xml).toContain('<answertest>AlgEquiv</answertest>');
    });

    it('has single node (0)', () => {
        const xml = generateAlgebraicPRT({ answer: 'ans1', feedback: {} }, 'prt1');
        expect(xml).toContain('<name>0</name>');
        expect(xml).not.toContain('<name>1</name>');
    });
});

describe('Matrix PRT', () => {
    it('uses AlgEquiv for matrix comparison', () => {
        const xml = generateMatrixPRT({ answer: 'ans1', feedback: {} }, 'prt1');
        expect(xml).toContain('<answertest>AlgEquiv</answertest>');
    });
});

describe('String PRT', () => {
    it('uses String test for case-sensitive matching', () => {
        const xml = generateStringPRT({
            answer: 'ans1',
            grading: { caseSensitive: true },
            feedback: {},
        }, 'prt1');
        expect(xml).toContain('<answertest>String</answertest>');
    });

    it('uses StringSloppy for case-insensitive matching', () => {
        const xml = generateStringPRT({
            answer: 'ans1',
            grading: { caseSensitive: false },
            feedback: {},
        }, 'prt1');
        expect(xml).toContain('<answertest>StringSloppy</answertest>');
    });
});

describe('JSXGraph PRT', () => {
    it('includes feedbackvariables with grading code', () => {
        const xml = generateJSXGraphPRT({
            answer: 'ans1',
            gradingCode: 'all_correct: is(ans1 = expected);',
            feedback: {},
        }, 'prt1');

        expect(xml).toContain('<feedbackvariables>');
        expect(xml).toContain('all_correct: is(ans1 = expected);');
    });

    it('checks all_correct variable', () => {
        const xml = generateJSXGraphPRT({
            answer: 'ans1',
            gradingCode: 'all_correct: true;',
            feedback: {},
        }, 'prt1');

        expect(xml).toContain('<sans>all_correct</sans>');
        expect(xml).toContain('<tans>true</tans>');
    });

    it('defaults grading code when empty', () => {
        const xml = generateJSXGraphPRT({
            answer: 'ans1',
            gradingCode: '',
            feedback: {},
        }, 'prt1');

        expect(xml).toContain('all_correct: is(1 = 0);');
    });
});

describe('GRAPH_GRADING_TEMPLATES', () => {
    it('pointPlacement converts matrix to list and uses nearest-point matching', () => {
        const code = GRAPH_GRADING_TEMPLATES.pointPlacement('ans1', 5, 5);
        // Must convert student matrix to list via args()
        expect(code).toContain('matrixp(student_raw)');
        expect(code).toContain('args(student_raw)');
        // Must NOT use apply("and", ...) — "and" is a Maxima special form, not a function
        expect(code).not.toContain('apply("and"');
        // Should use arithmetic counting: sum 1s and compare to total
        expect(code).toContain('num_correct');
        expect(code).toContain('apply("+", pt_checks)');
        expect(code).toContain('is(num_correct = 5)');
        // Should use nearest-point matching, not sequential
        expect(code).toContain('matched_expected');
        expect(code).toContain('matched_student');
        expect(code).toContain('best_dist');
    });

    it('pointPlacement tracks actual match pairs for feedback', () => {
        const code = GRAPH_GRADING_TEMPLATES.pointPlacement('ans1', 5, 5);
        // Must track which student index was matched to each expected point
        expect(code).toContain('match_pair');
        expect(code).toContain('match_pair[ei]: best_si');
        // Feedback table must use match_pair for correct lookup, not re-scan
        expect(code).toContain('match_pair[i] > 0');
        expect(code).toContain('student_pts[match_pair[i]]');
    });

    it('pointPlacement generates feedback table with matched points', () => {
        const code = GRAPH_GRADING_TEMPLATES.pointPlacement('ans1', 3, 10);
        expect(code).toContain('then 1 else 0');
        expect(code).toContain('feedback_msg');
        expect(code).toContain('<table');
        expect(code).toContain('Your closest');
    });

    it('functionSketch converts matrix to list and uses arithmetic counting', () => {
        const code = GRAPH_GRADING_TEMPLATES.functionSketch('ans1', 3);
        expect(code).toContain('matrixp(student_raw)');
        expect(code).toContain('args(student_raw)');
        expect(code).not.toContain('apply("and"');
        expect(code).toContain('num_correct');
    });

    it('vectorDraw does not use apply("and")', () => {
        const code = GRAPH_GRADING_TEMPLATES.vectorDraw('ans1', 2);
        expect(code).not.toContain('apply("and"');
        expect(code).toContain('all_correct');
    });
});

describe('generatePresetGraphCode', () => {
    it('pointPlacement uses direct input management instead of custom_bind', () => {
        const code = generatePresetGraphCode('pointPlacement', 'ans1', 5);
        // Must use direct input management for reliable serialization
        expect(code).toContain('document.getElementById(ans1Ref)');
        expect(code).toContain('serializePoints');
        expect(code).toContain('stateInput.value');
        expect(code).toContain("stateInput.dispatchEvent(new Event('change'))");
        // Must NOT call custom_bind which fails with dynamically created objects
        expect(code).not.toContain('stack_jxg.custom_bind');
    });

    it('pointPlacement calls serializePoints on click, drag, and reset', () => {
        const code = generatePresetGraphCode('pointPlacement', 'ans1', 5);
        // After adding a point via click
        expect(code).toContain('addPoint(x, y);\n    serializePoints();');
        // After drag
        expect(code).toContain('serializePoints();');
        // After reset
        const resetSection = code.substring(code.indexOf('Reset'));
        expect(resetSection).toContain('serializePoints();');
    });

    it('pointPlacement restores state on page reload', () => {
        const code = generatePresetGraphCode('pointPlacement', 'ans1', 5);
        expect(code).toContain('stateInput.value');
        expect(code).toContain('addPoint(parseFloat');
    });

    it('functionSketch uses direct input management', () => {
        const code = generatePresetGraphCode('functionSketch', 'ans1', 5);
        expect(code).toContain('document.getElementById(ans1Ref)');
        expect(code).toContain('serializePoints');
        expect(code).not.toContain('stack_jxg.custom_bind');
    });

    it('pointPlacement respects maxPoints parameter', () => {
        const code3 = generatePresetGraphCode('pointPlacement', 'ans1', 3);
        expect(code3).toContain('studentPoints.length >= 3');
        const code7 = generatePresetGraphCode('pointPlacement', 'ans1', 7);
        expect(code7).toContain('studentPoints.length >= 7');
    });
});
