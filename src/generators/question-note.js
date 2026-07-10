// Questionnote content + distinctness (A6 check + A10 emission). ONE builder
// feeds both the XML emission and the validator so the completeness check
// can never drift from what is actually exported.
import { evaluatePreviewValue } from '../parsers/variable-parser.js';
import { teacherAnswerMayBeZero } from './tolerance-mode.js';

/**
 * The castext fragments the questionnote interpolates, in emission order:
 * every random variable, then every gradeable part's TEACHER answer (taN —
 * never the student input name, which would just render the student's own
 * slot). Numeric answers proven nonzero across the rand space are rounded
 * to 4 significant figures to keep notes short and distinct (A10 rider);
 * anything possibly zero / non-numeric (units, matrices, algebra) is
 * interpolated raw. Radio parts reference their shuffled option list so
 * MCQ variants stay distinguishable.
 */
export function questionNoteRefs(data) {
    const vars = data.variables || [];
    const refs = vars
        .filter(v => v.type === 'rand')
        .map(v => `${v.name}={@${v.name}@}`);
    (data.parts || []).forEach(p => {
        if (p.type === 'notes') return; // placeholder answers are noise
        if (p.type === 'radio') {
            if (p.options && p.options.length > 0) refs.push(`${p.answer}={@ta_${p.answer}@}`);
            return;
        }
        const ta = (p.teacherAnswer || '').trim();
        if (!ta) return;
        if (p.type === 'numerical' && !teacherAnswerMayBeZero(ta, vars)) {
            refs.push(`${p.answer}={@significantfigures(${ta},4)@}`);
        } else {
            refs.push(`${p.answer}={@${ta}@}`);
        }
    });
    return refs;
}

/** The questionnote body as emitted inside the CDATA. */
export function questionNoteContent(data) {
    return questionNoteRefs(data).join(', ');
}

/**
 * True when the question randomises but the note CANNOT distinguish
 * variants (empty, or its sampled values never change across rerolls).
 * Evaluated through variable-parser per the A5 rider.
 */
export function questionNoteMayBeConstant(data, rerolls = 12) {
    const vars = data.variables || [];
    const randVars = vars.filter(v => v.type === 'rand');
    const radioRandomised = (data.parts || [])
        .some(p => p.type === 'radio' && p.options && p.options.length > 0);
    if (randVars.length === 0 && !radioRandomised) return false; // not randomised
    const content = questionNoteContent(data);
    if (content.includes('{@ta_ans')) return false; // shuffled option list is per-variant
    if (randVars.length === 0) return content.trim() === '';
    const tuples = new Set();
    for (let i = 0; i < rerolls; i++) {
        const ctx = {};
        for (const v of vars) {
            try {
                ctx[v.name] = evaluatePreviewValue(v.type, v.value, ctx);
            } catch {
                ctx[v.name] = '[Error]';
            }
        }
        tuples.add(randVars.map(v => String(ctx[v.name])).join('|'));
    }
    return tuples.size < 2;
}
