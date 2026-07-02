// Input generator for radio (MCQ) answer type
import { escapeXml } from '../xml-helpers.js';

/**
 * Generates <input> XML for a radio (multiple choice) answer.
 *
 * STACK radio inputs require:
 * - Teacher answer (tans) set to the correct option index (1-based)
 * - Options listed as a Maxima list in the <tans> or via teacher answer variable
 *
 * @param {object} part - Part data with .options array
 * @returns {string} XML string
 */
export function generateRadioInput(part) {
    const correctIndex = part.options.findIndex(o => o.correct) + 1;

    // Build the teacher answer as a Maxima list: [[value, correct], ...]
    // STACK expects: ta:[[label1, true/false], [label2, true/false], ...]
    const taListVar = `ta_${part.answer}`;

    return `
    <input>
      <name>${part.answer}</name>
      <type>radio</type>
      <tans>${taListVar}</tans>
      <boxsize>15</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>0</mustverify>
      <showvalidation>0</showvalidation>
      <options></options>
    </input>`;
}

/**
 * Generates the Maxima variable definition for the radio option list.
 * Returns a variable definition string to add to questionvariables.
 *
 * Format: ta_ans1: random_permutation([[label1, true/false], [label2, true/false], ...])
 *
 * The list is wrapped in random_permutation() so STACK shuffles the options on each
 * variant — without it, students see the same order every attempt (per stack-xml-generator
 * skill rule P-STACK-23).
 */
export function generateRadioVariable(part) {
    const items = part.options.map(opt => {
        const escaped = opt.value.replace(/"/g, '\\"');
        return `["${escaped}", ${opt.correct ? 'true' : 'false'}]`;
    });
    return `ta_${part.answer}: random_permutation([${items.join(', ')}])`;
}
