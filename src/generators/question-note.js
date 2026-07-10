// Questionnote content + distinctness (A6 check, A5 rider; A10 extends the
// refs with teacher answers). ONE builder feeds both the XML emission and
// the validator so the completeness check can never drift from what is
// actually exported.
import { evaluatePreviewValue } from '../parsers/variable-parser.js';

/**
 * The castext fragments the questionnote interpolates, in emission order.
 */
export function questionNoteRefs(data) {
    return (data.variables || [])
        .filter(v => v.type === 'rand')
        .map(v => `{@${v.name}@}`);
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
