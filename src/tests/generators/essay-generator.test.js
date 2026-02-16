import { describe, it, expect } from 'vitest';
import { generateEssayQuestion, defaultEssayText } from '../../generators/essay-generator.js';
import { generateStackXML } from '../../generators/xml-generator.js';

describe('Essay Generator', () => {
    const baseData = {
        name: 'Test Question',
        questionText: 'Calculate something.',
        variables: [],
        parts: [{
            id: 1, type: 'numerical', text: 'Answer:', answer: 'ans1',
            grading: { tightTol: 0.05, wideTol: 0.20, checkSigFigs: false, sigFigs: 3, penalty: 0.1, checkPowerOf10: false, powerOf10Penalty: 0 },
            options: [], graphCode: '', gradingCode: '', feedback: {},
        }],
        images: [],
        generalFeedback: '',
        hints: [],
    };

    describe('generateEssayQuestion', () => {
        it('returns empty string when essayEnabled is false', () => {
            const data = { ...baseData, essayEnabled: false };
            expect(generateEssayQuestion(data)).toBe('');
        });

        it('returns empty string when essayEnabled is undefined', () => {
            expect(generateEssayQuestion(baseData)).toBe('');
        });

        it('generates essay XML when enabled', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<question type="essay">');
            expect(xml).toContain('</question>');
        });

        it('uses question name in essay name with suffix', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('Test Question - Image Upload');
        });

        it('auto-generates prompt text from question name when essayText is empty', () => {
            const data = { ...baseData, essayEnabled: true, essayText: '' };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('Test Question');
            expect(xml).toContain('Upload your working');
        });

        it('uses custom essayText when provided', () => {
            const data = { ...baseData, essayEnabled: true, essayText: 'Please upload your diagram.' };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('Please upload your diagram.');
        });

        it('defaults grade to 0', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<defaultgrade>0</defaultgrade>');
        });

        it('uses custom grade when specified', () => {
            const data = { ...baseData, essayEnabled: true, essayGrade: 5 };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<defaultgrade>5</defaultgrade>');
        });

        it('defaults attachments to 1', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<attachments>1</attachments>');
        });

        it('uses custom attachment count', () => {
            const data = { ...baseData, essayEnabled: true, essayAttachments: 3 };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<attachments>3</attachments>');
        });

        it('sets responseformat to noinlineeditor', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<responseformat>noinlineeditor</responseformat>');
        });

        it('allows image and PDF file types', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<filetypeslist>image/*,.pdf</filetypeslist>');
        });

        it('does not require response text', () => {
            const data = { ...baseData, essayEnabled: true };
            const xml = generateEssayQuestion(data);

            expect(xml).toContain('<responserequired>0</responserequired>');
        });
    });

    describe('defaultEssayText', () => {
        it('includes question name', () => {
            expect(defaultEssayText('My Question')).toContain('My Question');
        });

        it('uses fallback when name is empty', () => {
            expect(defaultEssayText('')).toContain('this question');
        });
    });

    describe('Integration with generateStackXML', () => {
        it('does not include essay when disabled', () => {
            const data = { ...baseData, essayEnabled: false };
            const xml = generateStackXML(data);

            expect(xml).not.toContain('<question type="essay">');
            // Should still have the STACK question
            expect(xml).toContain('<question type="stack">');
        });

        it('appends essay question after STACK question when enabled', () => {
            const data = { ...baseData, essayEnabled: true, essayGrade: 2 };
            const xml = generateStackXML(data);

            expect(xml).toContain('<question type="stack">');
            expect(xml).toContain('<question type="essay">');

            // Essay should come after STACK question closes
            const stackEnd = xml.indexOf('</question>');
            const essayStart = xml.indexOf('<question type="essay">');
            expect(essayStart).toBeGreaterThan(stackEnd);

            // Both wrapped in quiz
            expect(xml).toContain('</quiz>');
        });

        it('essay uses configured grade in full XML', () => {
            const data = { ...baseData, essayEnabled: true, essayGrade: 10 };
            const xml = generateStackXML(data);

            expect(xml).toContain('<defaultgrade>10</defaultgrade>');
        });
    });
});
