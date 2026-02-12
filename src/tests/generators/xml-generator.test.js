import { describe, it, expect } from 'vitest';
import { generateStackXML } from '../../generators/xml-generator.js';

describe('XML Generator Integration', () => {
    const sampleData = {
        name: 'Test Question',
        questionText: 'Calculate the value of \\({@ans1@}\\).',
        variables: [
            { name: 'a', type: 'rand', value: 'rand(10)+1' },
            { name: 'ans1', type: 'calc', value: 'a * 2' },
        ],
        parts: [
            {
                id: 1,
                type: 'numerical',
                text: 'Answer:',
                answer: 'ans1',
                grading: {
                    tightTol: 0.05,
                    wideTol: 0.20,
                    checkSigFigs: true,
                    sigFigs: 3,
                    penalty: 0.1,
                    checkPowerOf10: false,
                    powerOf10Penalty: 0,
                },
                options: [],
                graphCode: '',
                gradingCode: '',
                feedback: {},
            },
        ],
        images: [],
        generalFeedback: 'The answer is {@ans1@}.',
        hints: ['Think about it.'],
    };

    it('generates valid XML structure', () => {
        const xml = generateStackXML(sampleData);

        expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(xml).toContain('<quiz>');
        expect(xml).toContain('<question type="stack">');
        expect(xml).toContain('</question>');
        expect(xml).toContain('</quiz>');
    });

    it('includes question name', () => {
        const xml = generateStackXML(sampleData);
        expect(xml).toContain('<name><text>Test Question</text></name>');
    });

    it('includes question variables', () => {
        const xml = generateStackXML(sampleData);
        expect(xml).toContain('<questionvariables>');
        expect(xml).toContain('a: rand(10)+1;');
        expect(xml).toContain('ans1: a * 2;');
    });

    it('includes input for numerical type', () => {
        const xml = generateStackXML(sampleData);
        expect(xml).toContain('<type>numerical</type>');
        expect(xml).toContain('<name>ans1</name>');
    });

    it('includes PRT with correct answer test', () => {
        const xml = generateStackXML(sampleData);
        expect(xml).toContain('<prt>');
        expect(xml).toContain('<name>prt1</name>');
        expect(xml).toContain('ATNumAbs');
    });

    it('includes general feedback', () => {
        const xml = generateStackXML(sampleData);
        expect(xml).toContain('<generalfeedback');
        expect(xml).toContain('The answer is {@ans1@}.');
    });

    it('includes hints', () => {
        const xml = generateStackXML(sampleData);
        expect(xml).toContain('<hint format="html">');
        expect(xml).toContain('Think about it.');
    });

    it('includes specific feedback with PRT references', () => {
        const xml = generateStackXML(sampleData);
        expect(xml).toContain('<specificfeedback');
        expect(xml).toContain('[[feedback:prt1]]');
    });

    it('includes question note with random variables', () => {
        const xml = generateStackXML(sampleData);
        expect(xml).toContain('<questionnote');
        expect(xml).toContain('{@a@}');
    });

    it('does NOT duplicate images inside CDATA (BUG 5 fix)', () => {
        const dataWithImage = {
            ...sampleData,
            images: [{ name: 'diagram.png', data: 'data:image/png;base64,ABC123' }],
        };
        const xml = generateStackXML(dataWithImage);

        // Images should appear as <file> elements outside CDATA
        expect(xml).toContain('<file name="diagram.png" encoding="base64">ABC123</file>');

        // But NOT inside the CDATA section as duplicate HTML
        const cdataContent = xml.match(/<!\[CDATA\[([\s\S]*?)\]\]>/g) || [];
        const cdataInnerContent = cdataContent.join('');
        expect(cdataInnerContent).not.toContain('<file name="diagram.png"');
    });

    // Test radio type generates helper variable
    it('generates MCQ helper variable for radio type (BUG 4 fix)', () => {
        const mcqData = {
            ...sampleData,
            parts: [{
                id: 1,
                type: 'radio',
                text: 'Pick one:',
                answer: 'ans1',
                options: [
                    { value: 'Apple', correct: false },
                    { value: 'Banana', correct: true },
                ],
                grading: {},
                graphCode: '', gradingCode: '', feedback: {},
            }],
        };
        const xml = generateStackXML(mcqData);

        // Should have ta_ans1 variable
        expect(xml).toContain('ta_ans1');
        expect(xml).toContain('"Apple"');
        expect(xml).toContain('"Banana"');
    });

    // Test units uses ATUnits
    it('uses ATUnits for units type (BUG 2 fix)', () => {
        const unitsData = {
            ...sampleData,
            parts: [{
                id: 1,
                type: 'units',
                text: 'Speed:',
                answer: 'ans1',
                grading: { tightTol: 0.05, wideTol: 0.1, checkSigFigs: false, sigFigs: 3, penalty: 0.1, checkPowerOf10: false, powerOf10Penalty: 0 },
                options: [], graphCode: '', gradingCode: '', feedback: {},
            }],
        };
        const xml = generateStackXML(unitsData);

        expect(xml).toContain('ATUnits');
        expect(xml).not.toMatch(/<prt>[\s\S]*?<answertest>AlgEquiv<\/answertest>/);
    });

    it('emits tans_ alias in questionvariables when checkPowerOf10 is enabled', () => {
        const p10Data = {
            ...sampleData,
            parts: [{
                ...sampleData.parts[0],
                grading: { ...sampleData.parts[0].grading, checkPowerOf10: true },
            }],
        };
        const xml = generateStackXML(p10Data);
        expect(xml).toContain('tans_ans1: ans1;');
    });

    it('does NOT emit tans_ alias when checkPowerOf10 is disabled', () => {
        const xml = generateStackXML(sampleData);
        expect(xml).not.toContain('tans_ans1');
    });
});
