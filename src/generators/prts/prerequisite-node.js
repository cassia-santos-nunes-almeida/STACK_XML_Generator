// Generates a prerequisite check node that gates access to a part
// The prerequisite node checks if the required prior part was answered correctly
// before allowing the current part's grading to proceed
import { ANSWER_TESTS, SCORE_MODES, DEFAULT_FEEDBACK } from '../../core/constants.js';
import { feedbackElement } from '../xml-helpers.js';

/**
 * Wraps a PRT body with a prerequisite check.
 * Adds a feedbackvariable that evaluates the prerequisite part's answer,
 * and a gate node (node 0) that only proceeds to the real grading nodes
 * if the prerequisite is satisfied.
 *
 * All existing node IDs in prtBody are shifted up by 1 to make room for
 * the prerequisite gate node at position 0.
 *
 * @param {object} part - Current part data
 * @param {object} prereqPart - The prerequisite part data
 * @param {string} prtName - PRT identifier
 * @param {string} prtBody - Original PRT body XML (nodes + feedbackvariables)
 * @returns {string} Modified PRT body with prerequisite gate
 */
export function generatePrerequisiteNode(part, prereqPart, prtName, prtBody) {
    const fb = part.feedback || {};
    const prereqAnswer = prereqPart.answer;

    // Shift all existing node IDs up by 1
    let shiftedBody = shiftNodeIds(prtBody, prtName);

    // Build feedbackvariables for prerequisite checking
    const prereqFeedbackVars = buildPrereqFeedbackVars(prereqPart);

    // Extract any existing feedbackvariables from prtBody and merge
    const existingFvMatch = shiftedBody.match(/<feedbackvariables>\s*<text><!\[CDATA\[([\s\S]*?)\]\]><\/text>\s*<\/feedbackvariables>/);
    let mergedFeedbackVars;
    if (existingFvMatch) {
        // Remove existing feedbackvariables from shifted body
        shiftedBody = shiftedBody.replace(existingFvMatch[0], '');
        mergedFeedbackVars = `
      <feedbackvariables>
        <text><![CDATA[
${prereqFeedbackVars}
${existingFvMatch[1]}
]]></text>
      </feedbackvariables>`;
    } else {
        mergedFeedbackVars = `
      <feedbackvariables>
        <text><![CDATA[
${prereqFeedbackVars}
]]></text>
      </feedbackvariables>`;
    }

    // Create the gate node (node 0)
    const gateNode = `
      <node>
        <name>0</name>
        <answertest>${ANSWER_TESTS.ALG_EQUIV}</answertest>
        <sans>prereq_passed</sans>
        <tans>true</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>${SCORE_MODES.SET}</truescoremode>
        <truescore>0</truescore>
        <truepenalty></truepenalty>
        <truenextnode>1</truenextnode>
        <trueanswernote>${prtName}-prereq-T</trueanswernote>
        ${feedbackElement('truefeedback', '')}
        <falsescoremode>${SCORE_MODES.SET}</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${prtName}-prereq-F</falseanswernote>
        ${feedbackElement('falsefeedback', fb.prerequisiteNotMet || DEFAULT_FEEDBACK.prerequisiteNotMet)}
      </node>`;

    return mergedFeedbackVars + gateNode + shiftedBody;
}

/**
 * Shifts all node IDs in a PRT body up by 1 to make room for the prerequisite gate node.
 */
function shiftNodeIds(prtBody, prtName) {
    let result = prtBody;

    // Find all node name values and shift them
    result = result.replace(/<name>(\d+)<\/name>/g, (match, id) => {
        return `<name>${parseInt(id) + 1}</name>`;
    });

    // Shift truenextnode references (but not -1 which means "stop")
    result = result.replace(/<truenextnode>(\d+)<\/truenextnode>/g, (match, id) => {
        return `<truenextnode>${parseInt(id) + 1}</truenextnode>`;
    });

    // Shift falsenextnode references (but not -1 which means "stop")
    result = result.replace(/<falsenextnode>(\d+)<\/falsenextnode>/g, (match, id) => {
        return `<falsenextnode>${parseInt(id) + 1}</falsenextnode>`;
    });

    // Shift answer note references (e.g., prt1-0-T -> prt1-1-T)
    const notePattern = new RegExp(`(${prtName}-)(-?\\d+)(-[TF])`, 'g');
    result = result.replace(notePattern, (match, prefix, id, suffix) => {
        const newId = parseInt(id) + 1;
        return `${prefix}${newId}${suffix}`;
    });

    return result;
}

/**
 * Builds the Maxima code for prerequisite checking in feedbackvariables.
 */
function buildPrereqFeedbackVars(prereqPart) {
    const answer = prereqPart.answer;

    switch (prereqPart.type) {
        case 'numerical':
        case 'units': {
            const tol = prereqPart.grading?.tightTol || 0.05;
            return `/* Prerequisite check: verify part (${String.fromCharCode(96 + prereqPart.id)}) answer */
prereq_diff: abs(${answer} - tans_${answer});
prereq_passed: is(prereq_diff < ${tol});`;
        }
        case 'algebraic':
        case 'matrix':
            return `/* Prerequisite check: verify part (${String.fromCharCode(96 + prereqPart.id)}) answer */
prereq_passed: is(${answer} = ${answer});`;
        case 'radio':
            return `/* Prerequisite check: verify part (${String.fromCharCode(96 + prereqPart.id)}) answer */
prereq_passed: is(${answer} = ${answer});`;
        case 'string':
            return `/* Prerequisite check: verify part (${String.fromCharCode(96 + prereqPart.id)}) answer */
prereq_passed: is(${answer} = ${answer});`;
        default:
            return `/* Prerequisite check */
prereq_passed: true;`;
    }
}
