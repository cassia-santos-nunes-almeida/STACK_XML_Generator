// PRT generator for radio (multiple choice) answer type
// Uses AlgEquiv to compare student selection with correct answer string
import { ANSWER_TESTS, SCORE_MODES, DEFAULT_FEEDBACK } from '../../core/constants.js';
import { escapeXml, feedbackElement } from '../xml-helpers.js';

/**
 * Generates the PRT XML for a radio (MCQ) answer part.
 *
 * In STACK, radio inputs submit the selected option's VALUE (the first
 * element of the [[value, correct], ...] pairs). The PRT compares this
 * with the correct option's value.
 *
 * @param {object} part - Part data with .options array
 * @param {string} prtName - PRT identifier
 * @returns {string} XML string for the PRT body
 */
export function generateRadioPRT(part, prtName) {
    const fb = part.feedback || {};
    // STACK MCQ inputs return the SELECTED OPTION'S VALUE (a CAS expression),
    // never a 1-based index. Comparing against an index marks every answer
    // wrong, and an index cannot survive random_permutation shuffling. The
    // tans must be the correct option's value exactly as written in the
    // ta_ansN list (same quoting/escaping).
    const correctVal = radioCorrectValue(part);

    return `
      <node>
        <name>0</name>
        <answertest>${ANSWER_TESTS.ALG_EQUIV}</answertest>
        <sans>${part.answer}</sans>
        <tans>${escapeXml(correctVal)}</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>${SCORE_MODES.SET}</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>${prtName}-0-T</trueanswernote>
        ${feedbackElement('truefeedback', fb.correct || DEFAULT_FEEDBACK.correct)}
        <falsescoremode>${SCORE_MODES.SET}</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${prtName}-0-F</falseanswernote>
        ${feedbackElement('falsefeedback', fb.incorrect || DEFAULT_FEEDBACK.incorrect)}
      </node>`;
}

/**
 * The correct option's value as a Maxima string literal, escaped exactly
 * like generateRadioVariable writes it into the ta_ansN option list —
 * this is what the radio input submits when the correct option is chosen.
 */
export function radioCorrectValue(part) {
    const correctOpt = (part.options || []).find(o => o.correct);
    if (!correctOpt) return '""';
    return `"${String(correctOpt.value).replace(/"/g, '\\"')}"`;
}

/**
 * Teacher-answer expression for a radio part (the correct option's value).
 */
export function generateRadioTeacherAnswer(part) {
    return radioCorrectValue(part);
}
