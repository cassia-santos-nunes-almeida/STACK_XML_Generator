// A2 — reserved input-name namespace: the student input name (part.answer,
// e.g. ans1) and the teacher-answer variable (part.teacherAnswer, e.g. ta1)
// are separate. Emitting sans === tans grades every verified answer as
// correct (self-comparison), so generators refuse to emit that shape.

/**
 * Returns the teacher-answer variable name for a gradeable part, throwing
 * a plain-language error when it is missing or collides with the input name.
 * @param {object} part - Part data with .answer (input name) and .teacherAnswer
 * @returns {string} Teacher answer variable name
 */
export function requireTeacherAnswer(part) {
    const ta = (part.teacherAnswer || '').trim();
    if (!ta) {
        throw new Error(
            `Part input "${part.answer}": no answer variable set. ` +
            'Choose the variable that holds the correct answer (defined in the Variables section).'
        );
    }
    if (ta === part.answer) {
        throw new Error(
            `Part input "${part.answer}": the answer variable must be different from ` +
            `the student input name "${part.answer}" — comparing an input against itself ` +
            'would mark every answer correct.'
        );
    }
    return ta;
}

/**
 * Teacher-answer name for notes parts (placeholder only, auto-derived when
 * the teacher has not set one — notes are not auto-graded).
 * @param {object} part - Notes part data
 * @returns {string} Teacher answer variable name
 */
export function notesTeacherAnswer(part) {
    const ta = (part.teacherAnswer || '').trim();
    return ta && ta !== part.answer ? ta : `ta_${part.answer}`;
}
