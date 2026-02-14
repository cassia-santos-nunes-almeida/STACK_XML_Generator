import { describe, it, expect } from 'vitest';
import { generatePrerequisiteNode } from '../../generators/prts/prerequisite-node.js';
import { generatePRT } from '../../generators/prts/prt-factory.js';
import { generateStackXML } from '../../generators/xml-generator.js';

const partA = {
    id: 1, type: 'numerical', text: 'Part a:', answer: 'ans1',
    grading: { tightTol: 0.05, wideTol: 0.2, checkSigFigs: false, sigFigs: 3, penalty: 0.1, checkPowerOf10: false, powerOf10Penalty: 0 },
    options: [], graphCode: '', gradingCode: '', feedback: {},
    prerequisite: null, notesAutoCredit: true, notesRequireImage: false, notesBoxSize: 6, notesSyntaxHint: '',
};

const partB = {
    id: 2, type: 'numerical', text: 'Part b:', answer: 'ans2',
    grading: { tightTol: 0.05, wideTol: 0.2, checkSigFigs: false, sigFigs: 3, penalty: 0.1, checkPowerOf10: false, powerOf10Penalty: 0 },
    options: [], graphCode: '', gradingCode: '', feedback: {},
    prerequisite: 1,
    notesAutoCredit: true, notesRequireImage: false, notesBoxSize: 6, notesSyntaxHint: '',
};

describe('Prerequisite Node Generator', () => {
    it('creates a gate node at position 0', () => {
        const originalPrt = `
      <node>
        <name>0</name>
        <answertest>ATNumAbs</answertest>
        <sans>ans2</sans>
        <tans>ans2</tans>
        <testoptions>0.2</testoptions>
        <quiet>0</quiet>
        <truescoremode>=</truescoremode>
        <truescore>0.5</truescore>
        <truepenalty></truepenalty>
        <truenextnode>1</truenextnode>
        <trueanswernote>prt2-0-T</trueanswernote>
        <truefeedback format="html"><text></text></truefeedback>
        <falsescoremode>=</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>prt2-0-F</falseanswernote>
        <falsefeedback format="html"><text>Incorrect.</text></falsefeedback>
      </node>`;

        const result = generatePrerequisiteNode(partB, partA, 'prt2', originalPrt);

        // Gate node should be at position 0
        expect(result).toContain('<name>0</name>');
        expect(result).toContain('<sans>prereq_passed</sans>');
        expect(result).toContain('<tans>true</tans>');
    });

    it('shifts original node IDs up by 1', () => {
        const originalPrt = `
      <node>
        <name>0</name>
        <answertest>ATNumAbs</answertest>
        <sans>ans2</sans>
        <tans>ans2</tans>
        <testoptions>0.2</testoptions>
        <quiet>0</quiet>
        <truescoremode>=</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>prt2-0-T</trueanswernote>
        <truefeedback format="html"><text></text></truefeedback>
        <falsescoremode>=</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>prt2-0-F</falseanswernote>
        <falsefeedback format="html"><text></text></falsefeedback>
      </node>`;

        const result = generatePrerequisiteNode(partB, partA, 'prt2', originalPrt);

        // Original node 0 should now be node 1
        expect(result).toContain('prt2-1-T');
        expect(result).toContain('prt2-1-F');
    });

    it('gate node routes to node 1 on success', () => {
        const originalPrt = `
      <node>
        <name>0</name>
        <answertest>AlgEquiv</answertest>
        <sans>ans2</sans>
        <tans>ans2</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>=</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>prt2-0-T</trueanswernote>
        <truefeedback format="html"><text></text></truefeedback>
        <falsescoremode>=</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>prt2-0-F</falseanswernote>
        <falsefeedback format="html"><text></text></falsefeedback>
      </node>`;

        const result = generatePrerequisiteNode(partB, partA, 'prt2', originalPrt);
        expect(result).toContain('<truenextnode>1</truenextnode>');
    });

    it('gate node gives 0 marks and feedback on failure', () => {
        const originalPrt = `<node><name>0</name><answertest>AlgEquiv</answertest><sans>ans2</sans><tans>ans2</tans><testoptions></testoptions><quiet>0</quiet><truescoremode>=</truescoremode><truescore>1</truescore><truepenalty></truepenalty><truenextnode>-1</truenextnode><trueanswernote>prt2-0-T</trueanswernote><truefeedback format="html"><text></text></truefeedback><falsescoremode>=</falsescoremode><falsescore>0</falsescore><falsepenalty></falsepenalty><falsenextnode>-1</falsenextnode><falseanswernote>prt2-0-F</falseanswernote><falsefeedback format="html"><text></text></falsefeedback></node>`;

        const result = generatePrerequisiteNode(partB, partA, 'prt2', originalPrt);
        expect(result).toContain('prt2-prereq-F');
        expect(result).toContain('Please answer the prerequisite part correctly');
    });

    it('includes feedbackvariables with prerequisite check', () => {
        const originalPrt = `<node><name>0</name><answertest>AlgEquiv</answertest><sans>ans2</sans><tans>ans2</tans><testoptions></testoptions><quiet>0</quiet><truescoremode>=</truescoremode><truescore>1</truescore><truepenalty></truepenalty><truenextnode>-1</truenextnode><trueanswernote>prt2-0-T</trueanswernote><truefeedback format="html"><text></text></truefeedback><falsescoremode>=</falsescoremode><falsescore>0</falsescore><falsepenalty></falsepenalty><falsenextnode>-1</falsenextnode><falseanswernote>prt2-0-F</falseanswernote><falsefeedback format="html"><text></text></falsefeedback></node>`;

        const result = generatePrerequisiteNode(partB, partA, 'prt2', originalPrt);
        expect(result).toContain('<feedbackvariables>');
        expect(result).toContain('prereq_passed');
        expect(result).toContain('Prerequisite check: verify part (a)');
    });
});

describe('Prerequisite via PRT Factory', () => {
    it('adds prerequisite gate when prerequisite is set', () => {
        const allParts = [partA, partB];
        const xml = generatePRT(partB, 1, allParts);

        expect(xml).toContain('prereq_passed');
        expect(xml).toContain('prt2-prereq-T');
        expect(xml).toContain('prt2-prereq-F');
    });

    it('does not add prerequisite gate when prerequisite is null', () => {
        const allParts = [partA, partB];
        const xml = generatePRT(partA, 0, allParts);

        expect(xml).not.toContain('prereq_passed');
        expect(xml).not.toContain('prereq-T');
    });
});

describe('Prerequisite in Full XML Generation', () => {
    const fullData = {
        name: 'Scaffolded Question',
        questionText: 'Multi-step problem.',
        variables: [
            { name: 'a', type: 'rand', value: 'rand(10)+1' },
            { name: 'ans1', type: 'calc', value: 'a * 2' },
            { name: 'ans2', type: 'calc', value: 'a * 3' },
        ],
        parts: [partA, partB],
        images: [],
        generalFeedback: '',
        hints: [],
    };

    it('includes prerequisite notice in question text', () => {
        const xml = generateStackXML(fullData);
        expect(xml).toContain('prerequisite-notice');
        expect(xml).toContain('You must answer part (a) correctly');
    });

    it('generates tans_ alias for prerequisite part', () => {
        const xml = generateStackXML(fullData);
        expect(xml).toContain('tans_ans1: ans1;');
    });

    it('generates prerequisite gate in PRT', () => {
        const xml = generateStackXML(fullData);
        expect(xml).toContain('prereq_passed');
    });

    it('does not show prerequisite notice on first part', () => {
        const xml = generateStackXML(fullData);
        // The question text should contain prerequisite notice only once (for part b)
        const matches = xml.match(/prerequisite-notice/g) || [];
        expect(matches.length).toBe(1);
    });
});
