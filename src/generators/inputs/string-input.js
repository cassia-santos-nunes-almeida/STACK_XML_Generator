// Input generator for string (text) answer type

/**
 * Generates <input> XML for a string (text) answer.
 * @param {object} part - Part data
 * @returns {string} XML string
 */
export function generateStringInput(part) {
    return `
    <input>
      <name>${part.answer}</name>
      <type>string</type>
      <tans>${part.answer}</tans>
      <boxsize>20</boxsize>
      <strictsyntax>0</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>1</mustverify>
      <showvalidation>1</showvalidation>
      <options></options>
    </input>`;
}
