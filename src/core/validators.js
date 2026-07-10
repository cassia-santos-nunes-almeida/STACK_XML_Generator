// Validation utilities for STACK question data.
// A6: every issue carries a stable code ([EW]-AREA-NN) so teachers can be
// pointed at documentation; name/character rules come from stack-rules.json
// (X2 — one rule-data source shared with the emitters and the skill).
import { lintStopSlop } from './stop-slop-lint.js';
import { questionNoteMayBeConstant } from '../generators/question-note.js';
import STACK_RULES from './stack-rules.json' with { type: 'json' };


/**
 * Validates that all {@var@} references in text have corresponding variable definitions.
 * Returns array of warning objects.
 */
export function validateVariableReferences(text, variables) {
    const warnings = [];
    const refs = extractVariableRefs(text);
    const defined = new Set(variables.map(v => v.name));

    for (const ref of refs) {
        if (!defined.has(ref)) {
            warnings.push({
                type: 'undefined_variable',
                variable: ref,
                message: `Variable "{@${ref}@}" is used in text but not defined.`,
            });
        }
    }
    return warnings;
}

/**
 * Extracts all {@varName@} references from text.
 */
export function extractVariableRefs(text) {
    if (!text) return [];
    const matches = text.match(/\{@([a-zA-Z_][a-zA-Z0-9_]*)@\}/g) || [];
    return [...new Set(matches.map(m => m.replace(/\{@|@\}/g, '')))];
}

/**
 * Validates a Maxima expression for common syntax errors.
 * Returns null if valid, or an error message string.
 */
export function validateMaximaExpression(expr) {
    if (!expr || !expr.trim()) {
        return 'Expression cannot be empty.';
    }

    const trimmed = expr.trim().replace(/;+$/, '');

    // Check balanced parentheses
    let depth = 0;
    for (const ch of trimmed) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (depth < 0) return 'Unmatched closing parenthesis.';
    }
    if (depth !== 0) return 'Unmatched opening parenthesis.';

    // Check balanced brackets
    depth = 0;
    for (const ch of trimmed) {
        if (ch === '[') depth++;
        if (ch === ']') depth--;
        if (depth < 0) return 'Unmatched closing bracket.';
    }
    if (depth !== 0) return 'Unmatched opening bracket.';

    // Check for common mistakes
    if (/\*\*\*/.test(trimmed)) {
        return 'Triple asterisk is invalid. Use ^ for exponents.';
    }
    if (/\/\//.test(trimmed) && !trimmed.includes('/*')) {
        return 'Double slash is not valid in Maxima. Use single / for division.';
    }

    // Scientific-notation float alongside symbolic terms — breaks AlgEquiv on symbolic constants
    const sciMatch = trimmed.match(/\b\d+\.?\d*[eE][+-]?\d+\b/);
    if (sciMatch) {
        // Strip all scientific-notation floats, then check if any letters (symbolic terms) remain
        const stripped = trimmed.replace(/\b\d+\.?\d*[eE][+-]?\d+\b/g, '0');
        const hasSymbolic = /%[a-zA-Z]+|[a-zA-Z_][a-zA-Z0-9_]*/.test(stripped);
        if (hasSymbolic) {
            return `Scientific-notation float "${sciMatch[0]}" appears alongside symbolic terms. Use exact rational form (e.g. 10^-7 instead of 1e-7) so AlgEquiv works.`;
        }
    }

    // List-vs-matrix ambiguity: [[a,b],[c,d]] parses as matrix(), not a nested list
    if (/^\s*\[\s*\[[^\]]+\]\s*,\s*\[[^\]]+\]\s*\]\s*$/.test(trimmed)) {
        return 'Note: Maxima parses [[...],[...]] as matrix(...), not a nested list. If you intended a list, wrap with makelist() or build it differently.';
    }

    return null;
}

/**
 * Validates a variable name against the STACK rules (X2: regex + character
 * cap from stack-rules.json). Returns { code, message } or null.
 */
export function checkVariableName(name) {
    if (!name) {
        return { code: 'E-VAR-01', message: 'Variable name cannot be empty.' };
    }
    if (name.length > STACK_RULES.inputNameMaxLength) {
        return {
            code: 'E-VAR-03',
            message: `Variable name "${name}" is too long — STACK allows at most ${STACK_RULES.inputNameMaxLength} characters.`,
        };
    }
    if (!new RegExp(STACK_RULES.inputNameRegex).test(name)) {
        return {
            code: 'E-VAR-01',
            message: 'Variable name must start with a letter, contain only letters, numbers, and underscores, and not end with an underscore.',
        };
    }
    // Reserved Maxima words
    const reserved = ['if', 'then', 'else', 'do', 'for', 'while', 'true', 'false', 'and', 'or', 'not'];
    if (reserved.includes(name.toLowerCase())) {
        return { code: 'E-VAR-02', message: `"${name}" is a reserved word in Maxima.` };
    }
    return null;
}

/**
 * Legacy string API for the variable-name check.
 */
export function validateVariableName(name) {
    return checkVariableName(name)?.message ?? null;
}

/**
 * Lints a Maxima VALUE expression (never prose — comments and string
 * literals are stripped first) for constants written as bare symbols.
 * A3 rider: negative lookbehind so %pi never matches; \b so pin/api never
 * match. Returns [{ code, message }].
 */
export function lintMaximaValue(value, definedNames = new Set()) {
    const findings = [];
    const stripped = String(value || '')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/"(?:[^"\\]|\\.)*"/g, ' ');
    if (!definedNames.has('pi') && /(?<!%)\bpi\b/.test(stripped)) {
        findings.push({
            code: 'E-MAX-02',
            message: 'uses bare "pi" — write %pi for the circle constant (bare pi is just an unknown name in Maxima, so answers would be wrong).',
        });
    }
    if (!definedNames.has('e') && /(?<![%.\w])e(?![\w(])/.test(stripped)) {
        findings.push({
            code: 'W-MAX-03',
            message: 'uses "e" as a value — if you mean Euler\'s number, write %e.',
        });
    }
    return findings;
}

/**
 * Validates a JSXGraph part's graphCode for {@var@} usage.
 * Inside [[jsxgraph]] blocks, {@var@} renders as LaTeX and crashes the graph with
 * SyntaxError — the correct syntax is {#var#} for raw JS value injection.
 * Returns array of warning objects.
 */
export function validateJSXGraphBlocks(part) {
    const warnings = [];
    if (!part || part.type !== 'jsxgraph') return warnings;

    const code = part.graphCode || '';
    const matches = code.match(/\{@([a-zA-Z_][a-zA-Z0-9_]*)@\}/g) || [];
    for (const match of matches) {
        const varName = match.replace(/\{@|@\}/g, '');
        warnings.push({
            level: 'error',
            message: `JSXGraph graphCode uses {@${varName}@} (LaTeX) — this crashes the graph. Use {#${varName}#} for raw JS value instead.`,
        });
    }
    return warnings;
}

/**
 * Validates that a JSXGraph part's snap size is tight enough for its PRT tolerance.
 * Skill rule: snap size should be <= PRT tolerance / 2, otherwise students
 * may not be able to place a point within grading tolerance.
 * Returns array of warning objects.
 */
export function validateSnapVsTolerance(part) {
    const warnings = [];
    if (!part || part.type !== 'jsxgraph') return warnings;

    const tightTol = part.grading?.tightTol;
    if (!tightTol || tightTol <= 0) return warnings;

    const code = part.graphCode || '';
    const snapRegex = /snapSize[XY]\s*:\s*([\d.]+)/g;
    let m;
    while ((m = snapRegex.exec(code)) !== null) {
        const snap = parseFloat(m[1]);
        const axis = m[0].split(':')[0].trim();
        if (snap > tightTol / 2) {
            warnings.push({
                level: 'warning',
                message: `JSXGraph ${axis} (${snap}) exceeds half of PRT tolerance (${tightTol / 2}). Students may not be able to snap close enough to the expected answer.`,
            });
        }
    }
    return warnings;
}

/**
 * Validates a complete question data object before XML export.
 * Returns array of error/warning objects.
 */
export function validateQuestionData(data) {
    const issues = [];
    const push = (level, code, message) => issues.push({ level, code, message });

    if (!data.name || !data.name.trim()) {
        push('error', 'E-GEN-01', 'Question name is required.');
    }

    if (!data.questionText || !data.questionText.trim()) {
        push('error', 'E-GEN-02', 'Question text is required.');
    }

    if (!data.parts || data.parts.length === 0) {
        push('error', 'E-GEN-03', 'At least one part (answer input) is required.');
    }

    // Check variable references
    const allText = [data.questionText || '', ...(data.parts || []).map(p => p.text || '')].join(' ');
    const varWarnings = validateVariableReferences(allText, data.variables || []);
    varWarnings.forEach(w => push('warning', 'W-VAR-05', w.message));

    // Check each part
    (data.parts || []).forEach((part, idx) => {
        const label = String.fromCharCode(97 + idx);

        if (!part.answer || !part.answer.trim()) {
            push('error', 'E-PART-01', `Part (${label}): Answer input name is missing.`);
        }

        // A2: gradeable parts must name a teacher-answer variable distinct
        // from the student input name (sans === tans marks anything correct).
        const needsTeacherAnswer = ['numerical', 'algebraic', 'units', 'matrix', 'string', 'jsxgraph'];
        if (needsTeacherAnswer.includes(part.type)) {
            const ta = (part.teacherAnswer || '').trim();
            if (!ta) {
                push('error', 'E-PART-02', `Part (${label}): Answer variable is required — choose the variable that holds the correct answer.`);
            } else if (ta === part.answer) {
                push('error', 'E-PART-03', `Part (${label}): The answer variable must be different from the student input name "${part.answer}".`);
            } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(ta) && !(data.variables || []).some(v => v.name === ta)) {
                push('warning', 'W-PART-04', `Part (${label}): Answer variable "${ta}" is not defined in the Variables section.`);
            }
        }

        // Units answers should carry their units via stackunits (a unitless
        // teacher answer cannot be checked by the units answer tests).
        if (part.type === 'units') {
            const taVar = (data.variables || []).find(v => v.name === part.teacherAnswer);
            if (taVar && !/^stackunits\s*\(/.test((taVar.value || '').trim())) {
                push('warning', 'W-UNITS-01', `Part (${label}): For an answer with units, define "${part.teacherAnswer}" as stackunits(value, unit) — e.g. stackunits(${taVar.value || 'value'}, m/s) — so the units are checked.`);
            }
        }

        if (part.type === 'radio') {
            if (!part.options || part.options.length < 2) {
                push('error', 'E-MCQ-01', `Part (${label}): Multiple choice needs at least 2 options.`);
            }
            const hasCorrect = part.options && part.options.some(o => o.correct);
            if (!hasCorrect) {
                push('error', 'E-MCQ-02', `Part (${label}): No correct option marked.`);
            }
        }

        if (part.type === 'numerical' || part.type === 'units') {
            if (part.grading && part.grading.tightTol > part.grading.wideTol && part.grading.wideTol > 0) {
                push('warning', 'W-TOL-01', `Part (${label}): Tight tolerance (${part.grading.tightTol}) is larger than wide tolerance (${part.grading.wideTol}).`);
            }
        }

        if (part.type === 'jsxgraph') {
            if (!part.graphCode || !part.graphCode.trim()) {
                push('warning', 'W-JSX-01', `Part (${label}): JSXGraph code is empty.`);
            }
            if (!part.gradingCode || !part.gradingCode.trim()) {
                push('warning', 'W-JSX-02', `Part (${label}): Graph grading code is empty.`);
            }
            validateJSXGraphBlocks(part).forEach(w => {
                push(w.level, w.level === 'error' ? 'E-JSX-03' : 'W-JSX-03', `Part (${label}): ${w.message}`);
            });
            validateSnapVsTolerance(part).forEach(w => {
                push(w.level, 'W-JSX-04', `Part (${label}): ${w.message}`);
            });
        }

        // Validate prerequisites
        if (part.prerequisite) {
            const prereqPart = (data.parts || []).find(p => p.id === part.prerequisite);
            if (!prereqPart) {
                push('error', 'E-PRE-01', `Part (${label}): Prerequisite references a non-existent part.`);
            } else if (prereqPart.id >= part.id) {
                push('error', 'E-PRE-02', `Part (${label}): Prerequisite must reference an earlier part.`);
            }
            // Warn about circular prerequisites
            if (prereqPart && prereqPart.prerequisite === part.id) {
                push('error', 'E-PRE-03', `Part (${label}): Circular prerequisite detected with part (${String.fromCharCode(96 + prereqPart.id)}).`);
            }
        }
    });

    // Check variable expressions
    const inputNames = new Set((data.parts || []).map(p => p.answer).filter(Boolean));
    const definedNames = new Set((data.variables || []).map(v => v.name));
    (data.variables || []).forEach(v => {
        const nameErr = checkVariableName(v.name);
        if (nameErr) {
            push('error', nameErr.code, `Variable "${v.name}": ${nameErr.message}`);
        }
        // A2: input names are a reserved namespace — a variable named like a
        // student input silently breaks grading (STACK forbids writing to
        // input names; the edit form blocks the next save after import).
        if (inputNames.has(v.name)) {
            push('error', 'E-VAR-05', `Variable "${v.name}" has the same name as a student answer box — rename it (for example "ta_${v.name}"). Answer-box names are reserved.`);
        } else if (/^ans\d+$/.test(v.name)) {
            push('error', 'E-VAR-04', `Variable "${v.name}": names like "ans1", "ans2" are reserved for student answer boxes. Use a different name (for example "ta${v.name.slice(3)}").`);
        }
        const exprErr = validateMaximaExpression(v.value);
        if (exprErr) {
            push('warning', 'W-MAX-01', `Variable "${v.name}": ${exprErr}`);
        }
        // A6 Maxima lint — value fields only, never prose (A3 lookbehind).
        lintMaximaValue(v.value, definedNames).forEach(f => {
            push(f.code.startsWith('E-') ? 'error' : 'warning', f.code, `Variable "${v.name}" ${f.message}`);
        });
    });

    // A6: variant-tracking note distinctness (warning — blocking here would
    // lock out legitimately constant questions; STACK's edit form is the
    // hard gate for truly empty notes on randomised questions).
    if (questionNoteMayBeConstant(data)) {
        push('warning', 'W-NOTE-01', 'This question uses random values, but the variant summary (question note) would be the same for every variant — reports will not distinguish variants. Check that the random values really vary.');
    }

    // Stop-slop lint on student-facing prose (P-WRITE-01)
    const slopFindings = lintStopSlop(data);
    slopFindings.forEach(f => {
        const matchText = f.matches.map(m => `"${m}"`).join(', ');
        push('warning', 'W-SLOP-01', `[stop-slop] ${f.field}: ${matchText} — try: ${f.suggest}`);
    });

    return issues;
}
