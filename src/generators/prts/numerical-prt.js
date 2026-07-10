// PRT generator for numerical answer type — house Rule 3 alignment (A11):
// relative-tolerance primary check (NumRelative 5% default) with the
// diagnostic layer at 50%: within-wide-tolerance, sign-flip, power-of-10.
// Absolute tolerances remain supported (tolType 'absolute' / legacy imports /
// degenerate-zero fallback).
import { ANSWER_TESTS, SCORE_MODES, DEFAULT_FEEDBACK } from '../../core/constants.js';
import { feedbackElement } from '../xml-helpers.js';
import { requireTeacherAnswer } from '../teacher-answer.js';
import { resolveToleranceMode } from '../tolerance-mode.js';

/**
 * Generates the PRT XML for a numerical answer part.
 *
 * Grading pipeline (node ids assigned in this order):
 *   Node 0: Wide tolerance check - 50% diagnostic tier
 *   Node 1: Tight tolerance check - full credit
 *   Node  : (optional) Significant figures check - penalty
 *   Node  : (optional) Sign-flip diagnostic (relative mode only) - 50%
 *   Node  : (optional) Power-of-10 diagnostic - 50%
 *   Feedbackvariables: ratio maths for the diagnostics (guarded divides) —
 *   NEVER substituted into a sig-figs sans (raw-input rule, S7/F-3).
 *
 * @param {object} part - Part data with .answer, .teacherAnswer, .grading, .feedback
 * @param {string} prtName - PRT identifier (e.g., 'prt1')
 * @param {object} [ctx] - Generation context { variables } for the
 *   degenerate-zero evaluation of the teacher answer
 * @returns {string} XML string for the PRT body (nodes + feedbackvariables)
 */
export function generateNumericalPRT(part, prtName, ctx) {
    const g = part.grading;
    const fb = part.feedback || {};
    const answer = part.answer;
    const teacherAnswer = requireTeacherAnswer(part);

    // Determine the pipeline shape
    const hasTwoTierTolerance = g.wideTol > 0 && g.tightTol >= 0 && g.wideTol > g.tightTol;
    const hasSigFigs = g.checkSigFigs && g.sigFigs > 0;
    const hasPowerOf10 = g.checkPowerOf10;
    const { useRelative, useSignFlip } = resolveToleranceMode(part, ctx);
    const tolTest = useRelative ? ANSWER_TESTS.NUM_RELATIVE : ANSWER_TESTS.NUM_ABSOLUTE;

    // Node ids: 0 wide, 1 tight (two-tier) | 0 single check; then optional
    // sig-figs, sign-flip, power-of-10 in that order.
    let nextId = hasTwoTierTolerance ? 2 : 1;
    const sigFigsNodeId = hasSigFigs ? nextId++ : -1;
    const signFlipNodeId = useSignFlip ? nextId++ : -1;
    const p10NodeId = hasPowerOf10 ? nextId++ : -1;
    const firstDiagnosticId = signFlipNodeId >= 0 ? signFlipNodeId : p10NodeId;

    // --- Feedbackvariables: guarded ratio maths for the diagnostics ---
    const fvLines = [];
    if (useSignFlip) {
        fvLines.push(
            '/* Sign-flip diagnostic (house Rule 3): student within 5% of -ta */',
            `sf_safe_tans: if is(${teacherAnswer} = 0) then 1 else ${teacherAnswer};`,
            `sf_ratio: ${answer} / sf_safe_tans;`,
            'is_sign_flip: is(abs(sf_ratio + 1) < 0.05);'
        );
    }
    if (hasPowerOf10) {
        fvLines.push(
            '/* Power of 10 detection: check if student is off by factor of 10 or 0.1 */',
            `p10_safe_tans: if is(${teacherAnswer} = 0) then 1 else ${teacherAnswer};`,
            `p10_ratio: ${answer} / p10_safe_tans;`,
            'is_p10_high: is(abs(p10_ratio - 10) < 1);',
            'is_p10_low: is(abs(p10_ratio - 0.1) < 0.01);',
            'is_p10_error: is_p10_high or is_p10_low;'
        );
    }
    const feedbackVars = fvLines.length > 0 ? `
      <feedbackvariables>
        <text><![CDATA[
${fvLines.join('\n')}
]]></text>
      </feedbackvariables>` : '';

    let nodes = '';

    if (hasTwoTierTolerance) {
        // --- Node 0: Wide tolerance check (50% diagnostic tier) ---
        nodes += generateNode({
            id: 0,
            answerTest: tolTest,
            sans: answer,
            tans: teacherAnswer,
            testOptions: String(g.wideTol),
            trueScore: 0.5,
            trueScoreMode: SCORE_MODES.SET,
            trueNextNode: 1,
            trueNote: `${prtName}-0-T`,
            trueFeedback: '',
            falseScore: 0,
            falseScoreMode: SCORE_MODES.SET,
            falseNextNode: firstDiagnosticId,
            falseNote: `${prtName}-0-F`,
            falseFeedback: fb.incorrect || DEFAULT_FEEDBACK.incorrect,
        });

        // --- Node 1: Tight tolerance check (full credit) ---
        nodes += generateNode({
            id: 1,
            answerTest: tolTest,
            sans: answer,
            tans: teacherAnswer,
            testOptions: String(g.tightTol),
            trueScore: 1,
            trueScoreMode: SCORE_MODES.SET,
            trueNextNode: sigFigsNodeId,
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

        nodes += generateNode({
            id: 0,
            answerTest: tol > 0 ? tolTest : ANSWER_TESTS.ALG_EQUIV,
            sans: answer,
            tans: teacherAnswer,
            testOptions: tol > 0 ? String(tol) : '',
            trueScore: 1,
            trueScoreMode: SCORE_MODES.SET,
            trueNextNode: sigFigsNodeId,
            trueNote: `${prtName}-0-T`,
            trueFeedback: fb.correct || DEFAULT_FEEDBACK.correct,
            falseScore: 0,
            falseScoreMode: SCORE_MODES.SET,
            falseNextNode: firstDiagnosticId,
            falseNote: `${prtName}-0-F`,
            falseFeedback: fb.incorrect || DEFAULT_FEEDBACK.incorrect,
        });
    }

    // --- Significant figures check (advisory penalty on the correct path) ---
    // Raw-input rule (S7/F-3): sans MUST be the bare input name — any
    // manipulation drops trailing zeros and breaks the test.
    if (hasSigFigs) {
        nodes += generateNode({
            id: sigFigsNodeId,
            answerTest: ANSWER_TESTS.NUM_SIG_FIGS,
            sans: answer,
            tans: teacherAnswer,
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

    // --- Sign-flip diagnostic (house Rule 3, 50% tier) ---
    if (useSignFlip) {
        nodes += generateNode({
            id: signFlipNodeId,
            answerTest: ANSWER_TESTS.ALG_EQUIV,
            sans: 'is_sign_flip',
            tans: 'true',
            testOptions: '',
            trueScore: 0.5,
            trueScoreMode: SCORE_MODES.SET,
            trueNextNode: -1,
            trueNote: `${prtName}-${signFlipNodeId}-T`,
            trueFeedback: fb.signFlip || DEFAULT_FEEDBACK.signFlip,
            falseScore: 0,
            falseScoreMode: SCORE_MODES.SET,
            falseNextNode: p10NodeId,
            falseNote: `${prtName}-${signFlipNodeId}-F`,
            falseFeedback: '',
        });
    }

    // --- Power of 10 diagnostic (house Rule 3, 50% tier) ---
    if (hasPowerOf10) {
        nodes += generateNode({
            id: p10NodeId,
            answerTest: ANSWER_TESTS.ALG_EQUIV,
            sans: 'is_p10_error',
            tans: 'true',
            testOptions: '',
            trueScore: 0.5,
            trueScoreMode: SCORE_MODES.SET,
            trueNextNode: -1,
            trueNote: `${prtName}-${p10NodeId}-T`,
            trueFeedback: fb.powerOf10Error || DEFAULT_FEEDBACK.powerOf10Error,
            falseScore: 0,
            falseScoreMode: SCORE_MODES.SET,
            falseNextNode: -1,
            falseNote: `${prtName}-${p10NodeId}-F`,
            falseFeedback: '',
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
