// @vitest-environment jsdom
// Premortem F3: importing questionvariables used to split on EVERY ";" —
// a semicolon inside a Maxima string silently truncated the variable, and
// the corrupted state still validated clean.
import { describe, it, expect } from 'vitest';
import { splitMaximaStatements } from '../../parsers/variable-parser.js';
import { validateMaximaExpression, validateQuestionData } from '../../core/validators.js';
import { parseStackXML } from '../../parsers/xml-parser.js';
import { generateStackXML } from '../../generators/xml-generator.js';

describe('splitMaximaStatements (F3)', () => {
    it('keeps a semicolon inside a string literal', () => {
        expect(splitMaximaStatements('msg: "Note; check units"; x: 1;'))
            .toEqual(['msg: "Note; check units"', 'x: 1']);
    });

    it('keeps semicolons inside parenthesised compound statements', () => {
        expect(splitMaximaStatements('v: if is(a>0) then (x:1; y:2) else (x:2; y:1); w: 3;'))
            .toEqual(['v: if is(a>0) then (x:1; y:2) else (x:2; y:1)', 'w: 3']);
    });

    it('handles escaped quotes inside strings', () => {
        expect(splitMaximaStatements('m: "say \\"hi; there\\""; n: 2;'))
            .toEqual(['m: "say \\"hi; there\\""', 'n: 2']);
    });

    it('keeps semicolons inside comments', () => {
        expect(splitMaximaStatements('a: 1; /* note; with semicolon */ b: 2;'))
            .toEqual(['a: 1', '/* note; with semicolon */ b: 2']);
    });

    it('plain multi-statement text splits as before', () => {
        expect(splitMaximaStatements('a: rand(5)+1;\nb: a*2;'))
            .toEqual(['a: rand(5)+1', 'b: a*2']);
    });
});

describe('validateMaximaExpression quote balance (F3)', () => {
    it('flags an unclosed string quote', () => {
        expect(validateMaximaExpression('"Note')).toMatch(/quote/i);
    });

    it('does not false-flag parentheses inside string literals', () => {
        expect(validateMaximaExpression('"Note (a"')).toBeNull();
    });

    it('still accepts a normal string', () => {
        expect(validateMaximaExpression('"Note; check units"')).toBeNull();
    });
});

describe('roundtrip with semicolon-in-string variable (F3)', () => {
    it('the app\'s own export reimports intact and validates clean', () => {
        const data = {
            name: 'Semicolon roundtrip',
            questionText: 'Q {@msg@}',
            variables: [
                { name: 'msg', type: 'calc', value: '"Note; check units"' },
                { name: 'ta1', type: 'calc', value: '42' },
            ],
            parts: [{
                id: 1, type: 'numerical', text: 'Value?', answer: 'ans1',
                teacherAnswer: 'ta1',
                grading: { tolType: 'absolute', tightTol: 0.1, wideTol: 0, checkSigFigs: false, sigFigs: 3, penalty: 0.1, checkPowerOf10: false },
                options: [], graphCode: '', gradingCode: '', feedback: {},
            }],
            generalFeedback: '', hints: [], images: [],
        };
        const xml = generateStackXML(data);
        const reimported = parseStackXML(xml);
        const msgVar = reimported.variables.find(v => v.name === 'msg');
        expect(msgVar).toBeTruthy();
        expect(msgVar.value).toBe('"Note; check units"');
        const issues = validateQuestionData(reimported);
        expect(issues.filter(i => i.level === 'error')).toEqual([]);
    });
});
