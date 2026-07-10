// A2 — legacy auto-migration: old app files defined the model answer in a
// question variable NAMED LIKE THE INPUT (ans1: ... + input ans1 + tans ans1).
// STACK forbids writing to input names (edit-form save blocks) and the
// self-referential tans grades every verified answer as correct. Instead of
// hard-blocking legacy files, rename the colliding variable to taN, rewrite
// references, set part.teacherAnswer, and report a plain-language notice.

const GRADEABLE_TYPES = new Set([
    'numerical', 'algebraic', 'units', 'matrix', 'string', 'jsxgraph', 'notes',
]);

/**
 * Migrates legacy input-name/variable collisions in place.
 * Idempotent: parts that already carry a distinct teacherAnswer are skipped.
 *
 * @param {object} data - State-shaped question data (mutated in place)
 * @returns {string[]} Plain-language notices (empty when nothing migrated)
 */
export function migrateLegacyTeacherAnswers(data) {
    const notices = [];
    const parts = data.parts || [];
    const variables = data.variables || [];

    parts.forEach(p => {
        if (!GRADEABLE_TYPES.has(p.type)) return;
        if ((p.teacherAnswer || '').trim() && p.teacherAnswer !== p.answer) return;

        const collidingVar = variables.find(v => v.name === p.answer);
        if (!collidingVar) return;

        // Pick a free taN name
        const taken = new Set(variables.map(v => v.name));
        let ta = `ta${p.id}`;
        let suffix = 0;
        while (taken.has(ta)) {
            suffix++;
            ta = `ta${p.id}_${suffix}`;
        }

        const oldName = p.answer;
        const re = new RegExp(`\\b${oldName}\\b`, 'g');
        const rewrite = s => (typeof s === 'string' ? s.replace(re, ta) : s);

        collidingVar.name = ta;
        variables.forEach(v => {
            if (v !== collidingVar) v.value = rewrite(v.value);
        });
        data.questionText = rewrite(data.questionText);
        data.generalFeedback = rewrite(data.generalFeedback);
        data.hints = (data.hints || []).map(rewrite);
        parts.forEach(pp => {
            pp.text = rewrite(pp.text);
            // gradingCode is deliberately NOT rewritten: there, ansN is the
            // STUDENT input being graded, which keeps its name.
            if (pp.feedback) {
                for (const k of Object.keys(pp.feedback)) {
                    pp.feedback[k] = rewrite(pp.feedback[k]);
                }
            }
        });
        p.teacherAnswer = ta;

        notices.push(
            `Older file updated: the variable "${oldName}" was both a student input name and ` +
            `the correct-answer variable. It has been renamed to "${ta}" (all references updated) ` +
            'so the grading compares the student\'s answer against yours instead of against itself. ' +
            'Please re-export this question.'
        );
    });

    return notices;
}
