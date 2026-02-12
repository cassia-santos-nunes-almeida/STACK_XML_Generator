// Input generator for numerical answer type

/**
 * Generates <input> XML for a numerical answer.
 * @param {object} part - Part data
 * @returns {string} XML string
 */
export function generateNumericalInput(part) {
    return `
    <input>
      <name>${part.answer}</name>
      <type>numerical</type>
      <tans>${part.answer}</tans>
      <boxsize>15</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
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
