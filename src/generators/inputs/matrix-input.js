// Input generator for matrix answer type

/**
 * Generates <input> XML for a matrix answer.
 * @param {object} part - Part data
 * @returns {string} XML string
 */
export function generateMatrixInput(part) {
    const boxsize = part.matrixBoxSize || 5;
    return `
    <input>
      <name>${part.answer}</name>
      <type>matrix</type>
      <tans>${part.answer}</tans>
      <boxsize>${boxsize}</boxsize>
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
