// PRT generator for notes/reasoning answer type
// Awards automatic credit since the response is teacher-reviewed, not auto-graded
import { ANSWER_TESTS, SCORE_MODES, DEFAULT_FEEDBACK } from '../../core/constants.js';
import { feedbackElement } from '../xml-helpers.js';

/**
 * Generates the PRT XML for a notes/reasoning part.
 *
 * The PRT awards full marks automatically when the student provides any response,
 * since notes are meant for teacher review, not automated grading.
 * If autoCredit is false, it awards 0 and just acknowledges submission.
 *
 * @param {object} part - Part data
 * @param {string} prtName - PRT identifier
 * @returns {string} XML string for the PRT body
 */
export function generateNotesPRT(part, prtName) {
    const fb = part.feedback || {};
    const autoCredit = part.notesAutoCredit !== false; // default true

    const score = autoCredit ? 1 : 0;
    const feedback = fb.notesReceived || DEFAULT_FEEDBACK.notesReceived;

    return `
      <node>
        <name>0</name>
        <answertest>${ANSWER_TESTS.ALG_EQUIV}</answertest>
        <sans>1</sans>
        <tans>1</tans>
        <testoptions></testoptions>
        <quiet>1</quiet>
        <truescoremode>${SCORE_MODES.SET}</truescoremode>
        <truescore>${score}</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>${prtName}-0-T</trueanswernote>
        ${feedbackElement('truefeedback', feedback)}
        <falsescoremode>${SCORE_MODES.SET}</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${prtName}-0-F</falseanswernote>
        ${feedbackElement('falsefeedback', '')}
      </node>`;
}
