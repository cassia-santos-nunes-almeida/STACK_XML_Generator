// PRT generator for numerical answer type
// Implements: ATNumAbs (wide + tight tolerance), ATNumSigFigs, Power-of-10 check
import { ANSWER_TESTS, SCORE_MODES, DEFAULT_FEEDBACK } from '../../core/constants.js';
import { feedbackElement } from '../xml-helpers.js';

/**
 * Generates the PRT XML for a numerical answer part.
 *
 * Grading pipeline:
 *   Node 0: Wide tolerance check (ATNumAbs) - partial credit
 *   Node 1: Tight tolerance check (ATNumAbs) - full credit
 *   Node 2: (optional) Significant figures check (ATNumSigFigs) - penalty
 *   Feedbackvariables: (optional) Power-of-10 detection with specific feedback
 *
 * @param {object} part - Part data with .answer, .grading, .feedback
 * @param {string} prtName - PRT identifier (e.g., 'prt1')
 * @returns {string} XML string for the PRT body (nodes + feedbackvariables)
 */
export function generateNumericalPRT(part, prtName) {
    const g = part.grading;
    const fb = part.feedback || {};
    const answer = part.answer;

    let feedbackVars = '';
    let nodes = '';

    // Determine how many nodes we need
    const hasTwoTierTolerance = g.wideTol > 0 && g.tightTol >= 0 && g.wideTol > g.tightTol;
    const hasSigFigs = g.checkSigFigs && g.sigFigs > 0;
    const hasPowerOf10 = g.checkPowerOf10;

    if (hasPowerOf10) {
        // Power-of-10 detection in feedback variables
        // Uses tans_<answer> alias (defined in questionvariables) for the teacher answer,
        // because the student input shadows <answer> in PRT context.
        feedbackVars = `
      <feedbackvariables>
        <text><![CDATA[
/* Power of 10 detection: check if student is off by factor of 10 or 0.1 */
p10_safe_tans: if is(tans_${answer} = 0) then 1 else tans_${answer};
p10_ratio: ${answer} / p10_safe_tans;
is_p10_high: is(abs(p10_ratio - 10) < 1);
is_p10_low: is(abs(p10_ratio - 0.1) < 0.01);
is_p10_error: is_p10_high or is_p10_low;
]]></text>
      </feedbackvariables>`;
    }

    if (hasTwoTierTolerance) {
        // --- Node 0: Wide tolerance check ---
        const node0TrueNext = 1;
        let node0FalseNext = -1;

        // If Power of 10 is enabled, route wrong answers to P10 check node
        const lastNodeId = hasSigFigs ? 2 : 1;
        const p10NodeId = lastNodeId + 1;

        if (hasPowerOf10) {
            node0FalseNext = p10NodeId;
        }

        nodes += generateNode({
            id: 0,
            answerTest: ANSWER_TESTS.NUM_ABSOLUTE,
            sans: answer,
            tans: answer,
            testOptions: String(g.wideTol),
            trueScore: 0.5,
            trueScoreMode: SCORE_MODES.SET,
            trueNextNode: node0TrueNext,
            trueNote: `${prtName}-0-T`,
            trueFeedback: '',
            falseScore: 0,
            falseScoreMode: SCORE_MODES.SET,
            falseNextNode: node0FalseNext,
            falseNote: `${prtName}-0-F`,
            falseFeedback: fb.incorrect || DEFAULT_FEEDBACK.incorrect,
        });

        // --- Node 1: Tight tolerance check ---
        const node1TrueNext = hasSigFigs ? 2 : -1;

        nodes += generateNode({
            id: 1,
            answerTest: ANSWER_TESTS.NUM_ABSOLUTE,
            sans: answer,
            tans: answer,
            testOptions: String(g.tightTol),
            trueScore: 1,
            trueScoreMode: SCORE_MODES.SET,
            trueNextNode: node1TrueNext,
            trueNote: `${prtName}-1-T`,
            trueFeedback: fb.correct || DEFAULT_FEEDBACK.correct,
            falseScore: 0.5,
            falseScoreMode: SCORE_MODES.SET,
            falsePenalty: 0.1,
            falseNextNode: -1,
            falseNote: `${prtName}-1-F`,
            falseFeedback: fb.closeButInaccurate || DEFAULT_FEEDBACK.closeButInaccurate,
        });
    } else {
        // Single tolerance check (exact or single threshold)
        const tol = g.tightTol || 0;
        const node0TrueNext = hasSigFigs ? 1 : -1;
        const sigFigsOffset = hasTwoTierTolerance ? 0 : -1; // adjust node numbering

        nodes += generateNode({
            id: 0,
            answerTest: tol > 0 ? ANSWER_TESTS.NUM_ABSOLUTE : ANSWER_TESTS.ALG_EQUIV,
            sans: answer,
            tans: answer,
            testOptions: tol > 0 ? String(tol) : '',
            trueScore: 1,
            trueScoreMode: SCORE_MODES.SET,
            trueNextNode: hasSigFigs ? 1 : -1,
            trueNote: `${prtName}-0-T`,
            trueFeedback: fb.correct || DEFAULT_FEEDBACK.correct,
            falseScore: 0,
            falseScoreMode: SCORE_MODES.SET,
            falseNextNode: hasPowerOf10 ? (hasSigFigs ? 2 : 1) : -1,
            falseNote: `${prtName}-0-F`,
            falseFeedback: fb.incorrect || DEFAULT_FEEDBACK.incorrect,
        });
    }

    // --- Node 2 (or 1): Significant figures check ---
    if (hasSigFigs) {
        const sigFigsNodeId = hasTwoTierTolerance ? 2 : 1;

        nodes += generateNode({
            id: sigFigsNodeId,
            answerTest: ANSWER_TESTS.NUM_SIG_FIGS,
            sans: answer,
            tans: answer,
            testOptions: String(g.sigFigs),
            trueScore: 0,
            trueScoreMode: SCORE_MODES.ADD,
            trueNextNode: -1,
            trueNote: `${prtName}-${sigFigsNodeId}-T`,
            trueFeedback: '',
            falseScore: g.penalty || 0.1,
            falseScoreMode: SCORE_MODES.SUBTRACT,
            falseNextNode: -1,
            falseNote: `${prtName}-${sigFigsNodeId}-F`,
            falseFeedback: fb.wrongSigFigs || DEFAULT_FEEDBACK.wrongSigFigs,
        });
    }

    // --- Power of 10 check node (catches order-of-magnitude errors) ---
    if (hasPowerOf10) {
        const lastRegularNode = hasSigFigs ? (hasTwoTierTolerance ? 2 : 1) : (hasTwoTierTolerance ? 1 : 0);
        const p10NodeId = lastRegularNode + 1;

        nodes += generateNode({
            id: p10NodeId,
            answerTest: ANSWER_TESTS.ALG_EQUIV,
            sans: 'is_p10_error',
            tans: 'true',
            testOptions: '',
            trueScore: 0,
            trueScoreMode: SCORE_MODES.SET,
            trueNextNode: -1,
            trueNote: `${prtName}-${p10NodeId}-T`,
            trueFeedback: fb.powerOf10Error || DEFAULT_FEEDBACK.powerOf10Error,
            falseScore: 0,
            falseScoreMode: SCORE_MODES.SET,
            falseNextNode: -1,
            falseNote: `${prtName}-${p10NodeId}-F`,
            falseFeedback: fb.incorrect || DEFAULT_FEEDBACK.incorrect,
        });
    }

    return feedbackVars + nodes;
}

/**
 * Generates a single PRT node XML block.
 */
function generateNode(opts) {
    return `
      <node>
        <name>${opts.id}</name>
        <answertest>${opts.answerTest}</answertest>
        <sans>${opts.sans}</sans>
        <tans>${opts.tans}</tans>
        <testoptions>${opts.testOptions || ''}</testoptions>
        <quiet>0</quiet>
        <truescoremode>${opts.trueScoreMode}</truescoremode>
        <truescore>${opts.trueScore}</truescore>
        <truepenalty>${opts.truePenalty || ''}</truepenalty>
        <truenextnode>${opts.trueNextNode}</truenextnode>
        <trueanswernote>${opts.trueNote}</trueanswernote>
        ${feedbackElement('truefeedback', opts.trueFeedback || '')}
        <falsescoremode>${opts.falseScoreMode}</falsescoremode>
        <falsescore>${opts.falseScore}</falsescore>
        <falsepenalty>${opts.falsePenalty || ''}</falsepenalty>
        <falsenextnode>${opts.falseNextNode}</falsenextnode>
        <falseanswernote>${opts.falseNote}</falseanswernote>
        ${feedbackElement('falsefeedback', opts.falseFeedback || '')}
      </node>`;
}
