// Input generator for notes/reasoning answer type
// Uses STACK's 'notes' input type for student working that is teacher-reviewed

/**
 * Generates <input> XML for a notes/reasoning part.
 * The notes input creates a textarea where students show their working.
 * It is not auto-graded — the teacher reviews the response.
 *
 * @param {object} part - Part data
 * @returns {string} XML string
 */
export function generateNotesInput(part) {
    const boxSize = part.notesBoxSize || 6;
    return `
    <input>
      <name>${part.answer}</name>
      <type>notes</type>
      <tans>${part.answer}</tans>
      <boxsize>${boxSize}</boxsize>
      <strictsyntax>0</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint>${part.notesSyntaxHint || ''}</syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>0</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>0</mustverify>
      <showvalidation>0</showvalidation>
      <options></options>
    </input>`;
}
