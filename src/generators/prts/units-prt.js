// PRT generator for units answer type — FIXES BUG 2 (was using AlgEquiv)
// Uses ATUnits answer test which validates both numeric value AND units
import { ANSWER_TESTS, SCORE_MODES, DEFAULT_FEEDBACK } from '../../core/constants.js';
import { feedbackElement } from '../xml-helpers.js';

/**
 * Generates the PRT XML for a units answer part.
 *
 * Grading pipeline:
 *   Node 0: ATUnits check with tolerance — validates number AND units
 *   Node 1: (optional) Significant figures check
 *   If units wrong but number right, STACK gives specific unit feedback
 *
 * @param {object} part - Part data with .answer, .grading, .feedback
 * @param {string} prtName - PRT identifier
 * @returns {string} XML string for the PRT body
 */
export function generateUnitsPRT(part, prtName) {
    const g = part.grading;
    const fb = part.feedback || {};
    const answer = part.answer;
    const hasSigFigs = g.checkSigFigs && g.sigFigs > 0;

    let nodes = '';

    // --- Node 0: ATUnits check (validates value + units) ---
    nodes += `
      <node>
        <name>0</name>
        <answertest>${ANSWER_TESTS.UNITS}</answertest>
        <sans>${answer}</sans>
        <tans>${answer}</tans>
        <testoptions>${g.tightTol || 0.05}</testoptions>
        <quiet>0</quiet>
        <truescoremode>${SCORE_MODES.SET}</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>${hasSigFigs ? 1 : -1}</truenextnode>
        <trueanswernote>${prtName}-0-T</trueanswernote>
        ${feedbackElement('truefeedback', fb.correct || DEFAULT_FEEDBACK.correct)}
        <falsescoremode>${SCORE_MODES.SET}</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${prtName}-0-F</falseanswernote>
        ${feedbackElement('falsefeedback', fb.wrongUnits || DEFAULT_FEEDBACK.wrongUnits)}
      </node>`;

    // --- Node 1: Significant figures (optional) ---
    if (hasSigFigs) {
        nodes += `
      <node>
        <name>1</name>
        <answertest>${ANSWER_TESTS.NUM_SIG_FIGS}</answertest>
        <sans>${answer}</sans>
        <tans>${answer}</tans>
        <testoptions>${g.sigFigs}</testoptions>
        <quiet>0</quiet>
        <truescoremode>${SCORE_MODES.ADD}</truescoremode>
        <truescore>0</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>${prtName}-1-T</trueanswernote>
        ${feedbackElement('truefeedback', '')}
        <falsescoremode>${SCORE_MODES.SUBTRACT}</falsescoremode>
        <falsescore>${g.penalty || 0.1}</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${prtName}-1-F</falseanswernote>
        ${feedbackElement('falsefeedback', fb.wrongSigFigs || DEFAULT_FEEDBACK.wrongSigFigs)}
      </node>`;
    }

    return nodes;
}
