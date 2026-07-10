// A11 — relative-tolerance safety: NumRelative/UnitsRelative divide by the
// teacher answer, so when |ta| can be 0 (or cannot be proven numeric) across
// the rand space, the generator falls back to absolute tolerance and omits
// the sign-flip diagnostic (which also divides by ta). Conservative rule:
// unknown = degenerate.
import { evaluatePreviewValue } from '../parsers/variable-parser.js';

const SAMPLES = 30;
const EPSILON = 1e-9;

/**
 * Samples the teacher-answer variable across rand rerolls.
 * @param {string} taName - Teacher-answer variable name
 * @param {Array} variables - Question variables ({name, type, value})
 * @returns {boolean} true when |ta| may be zero / non-numeric / unknown
 */
export function teacherAnswerMayBeZero(taName, variables) {
    if (!taName || !Array.isArray(variables) || variables.length === 0) return true;
    const taVar = variables.find(v => v.name === taName);
    if (!taVar) return true;

    // Units answers wrap the numeric part: stackunits(expr, unit) — evaluate
    // the numeric expression.
    const stackunitsMatch = (taVar.value || '').trim().match(/^stackunits\s*\(\s*([\s\S]+),\s*[^,()]+\)\s*;?$/);
    const taExpr = stackunitsMatch ? stackunitsMatch[1] : taVar.value;

    for (let i = 0; i < SAMPLES; i++) {
        const prev = {};
        try {
            for (const v of variables) {
                if (v.name === taName) break; // ta computed below from taExpr
                prev[v.name] = evaluatePreviewValue(v.type, v.value, prev);
            }
            const val = evaluatePreviewValue('calc', taExpr, prev);
            if (typeof val !== 'number' || !Number.isFinite(val) || Math.abs(val) < EPSILON) {
                return true;
            }
        } catch {
            return true;
        }
    }
    return false;
}

/**
 * Resolves the effective tolerance mode for a numerical/units part.
 *
 * Sticky import decision: grading.signFlip (set by the XML parser) preserves
 * an imported question's structure — conversion to house defaults happens
 * only on explicit re-generation (new part / template), never silently.
 *
 * @param {object} part - Part with .grading.tolType / .grading.signFlip
 * @param {object} [ctx] - { variables } generation context
 * @returns {{useRelative: boolean, useSignFlip: boolean}}
 */
export function resolveToleranceMode(part, ctx) {
    const g = part.grading || {};
    if (g.tolType !== 'relative') {
        return { useRelative: false, useSignFlip: false };
    }
    if (g.signFlip !== undefined) {
        return { useRelative: true, useSignFlip: !!g.signFlip };
    }
    if (teacherAnswerMayBeZero(part.teacherAnswer, ctx?.variables)) {
        return { useRelative: false, useSignFlip: false };
    }
    return { useRelative: true, useSignFlip: true };
}
