// Input generator for units answer type
import { requireTeacherAnswer } from '../teacher-answer.js';

/**
 * Generates <input> XML for a units answer (value + physical unit).
 * @param {object} part - Part data
 * @returns {string} XML string
 */
export function generateUnitsInput(part) {
    const teacherAnswer = requireTeacherAnswer(part);
    return `
    <input>
      <name>${part.answer}</name>
      <type>units</type>
      <tans>${teacherAnswer}</tans>
      <boxsize>15</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>1</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>0</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>1</checkanswertype>
      <mustverify>1</mustverify>
      <showvalidation>3</showvalidation>
      <options></options>
    </input>`;
}
