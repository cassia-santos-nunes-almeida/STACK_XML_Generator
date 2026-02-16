// Input generator for JSXGraph interactive graph answer type
// The input type is set to 'algebraic' (hidden) — the graph JS code writes to it

/**
 * Generates <input> XML for a JSXGraph interactive answer.
 * The actual input is hidden; the graph JavaScript populates it.
 *
 * @param {object} part - Part data
 * @returns {string} XML string
 */
export function generateJSXGraphInput(part) {
    return `
    <input>
      <name>${part.answer}</name>
      <type>algebraic</type>
      <tans>${part.answer}</tans>
      <boxsize>15</boxsize>
      <strictsyntax>0</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>0</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>0</mustverify>
      <showvalidation>0</showvalidation>
      <options>hideanswer</options>
    </input>`;
}
