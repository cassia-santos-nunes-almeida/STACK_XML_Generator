// Input generator for algebraic answer type

/**
 * Generates <input> XML for an algebraic (symbolic) answer.
 * @param {object} part - Part data
 * @returns {string} XML string
 */
export function generateAlgebraicInput(part) {
    return `
    <input>
      <name>${part.answer}</name>
      <type>algebraic</type>
      <tans>${part.answer}</tans>
      <boxsize>20</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>1</checkanswertype>
      <mustverify>1</mustverify>
      <showvalidation>3</showvalidation>
      <options></options>
    </input>`;
}
