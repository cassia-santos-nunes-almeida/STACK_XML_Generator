// Validation utilities for STACK question data
import { lintStopSlop } from './stop-slop-lint.js';


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
 * Validates a variable name for Maxima compatibility.
 */
export function validateVariableName(name) {
    if (!name) return 'Variable name cannot be empty.';
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        return 'Variable name must start with a letter or underscore, and contain only letters, numbers, and underscores.';
    }
    // Reserved Maxima words
    const reserved = ['if', 'then', 'else', 'do', 'for', 'while', 'true', 'false', 'and', 'or', 'not'];
    if (reserved.includes(name.toLowerCase())) {
        return `"${name}" is a reserved word in Maxima.`;
    }
    return null;
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

    if (!data.name || !data.name.trim()) {
        issues.push({ level: 'error', message: 'Question name is required.' });
    }

    if (!data.questionText || !data.questionText.trim()) {
        issues.push({ level: 'error', message: 'Question text is required.' });
    }

    if (!data.parts || data.parts.length === 0) {
        issues.push({ level: 'error', message: 'At least one part (answer input) is required.' });
    }

    // Check variable references
    const allText = [data.questionText || '', ...(data.parts || []).map(p => p.text || '')].join(' ');
    const varWarnings = validateVariableReferences(allText, data.variables || []);
    issues.push(...varWarnings.map(w => ({ level: 'warning', message: w.message })));

    // Check each part
    (data.parts || []).forEach((part, idx) => {
        const label = String.fromCharCode(97 + idx);

        if (!part.answer || !part.answer.trim()) {
            issues.push({ level: 'error', message: `Part (${label}): Answer input name is missing.` });
        }

        // A2: gradeable parts must name a teacher-answer variable distinct
        // from the student input name (sans === tans marks anything correct).
        const needsTeacherAnswer = ['numerical', 'algebraic', 'units', 'matrix', 'string', 'jsxgraph'];
        if (needsTeacherAnswer.includes(part.type)) {
            const ta = (part.teacherAnswer || '').trim();
            if (!ta) {
                issues.push({ level: 'error', message: `Part (${label}): Answer variable is required — choose the variable that holds the correct answer.` });
            } else if (ta === part.answer) {
                issues.push({ level: 'error', message: `Part (${label}): The answer variable must be different from the student input name "${part.answer}".` });
            } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(ta) && !(data.variables || []).some(v => v.name === ta)) {
                issues.push({ level: 'warning', message: `Part (${label}): Answer variable "${ta}" is not defined in the Variables section.` });
            }
        }

        if (part.type === 'radio') {
            if (!part.options || part.options.length < 2) {
                issues.push({ level: 'error', message: `Part (${label}): Multiple choice needs at least 2 options.` });
            }
            const hasCorrect = part.options && part.options.some(o => o.correct);
            if (!hasCorrect) {
                issues.push({ level: 'error', message: `Part (${label}): No correct option marked.` });
            }
        }

        if (part.type === 'numerical' || part.type === 'units') {
            if (part.grading && part.grading.tightTol > part.grading.wideTol && part.grading.wideTol > 0) {
                issues.push({
                    level: 'warning',
                    message: `Part (${label}): Tight tolerance (${part.grading.tightTol}) is larger than wide tolerance (${part.grading.wideTol}).`,
                });
            }
        }

        if (part.type === 'jsxgraph') {
            if (!part.graphCode || !part.graphCode.trim()) {
                issues.push({ level: 'warning', message: `Part (${label}): JSXGraph code is empty.` });
            }
            if (!part.gradingCode || !part.gradingCode.trim()) {
                issues.push({ level: 'warning', message: `Part (${label}): Graph grading code is empty.` });
            }
            validateJSXGraphBlocks(part).forEach(w => {
                issues.push({ level: w.level, message: `Part (${label}): ${w.message}` });
            });
            validateSnapVsTolerance(part).forEach(w => {
                issues.push({ level: w.level, message: `Part (${label}): ${w.message}` });
            });
        }

        // Validate prerequisites
        if (part.prerequisite) {
            const prereqPart = (data.parts || []).find(p => p.id === part.prerequisite);
            if (!prereqPart) {
                issues.push({ level: 'error', message: `Part (${label}): Prerequisite references a non-existent part.` });
            } else if (prereqPart.id >= part.id) {
                issues.push({ level: 'error', message: `Part (${label}): Prerequisite must reference an earlier part.` });
            }
            // Warn about circular prerequisites
            if (prereqPart && prereqPart.prerequisite === part.id) {
                issues.push({ level: 'error', message: `Part (${label}): Circular prerequisite detected with part (${String.fromCharCode(96 + prereqPart.id)}).` });
            }
        }
    });

    // Check variable expressions
    const inputNames = new Set((data.parts || []).map(p => p.answer).filter(Boolean));
    (data.variables || []).forEach(v => {
        const nameErr = validateVariableName(v.name);
        if (nameErr) {
            issues.push({ level: 'error', message: `Variable "${v.name}": ${nameErr}` });
        }
        // A2: input names are a reserved namespace — a variable named like a
        // student input silently breaks grading (STACK forbids writing to
        // input names; the edit form blocks the next save after import).
        if (inputNames.has(v.name)) {
            issues.push({
                level: 'error',
                message: `Variable "${v.name}" has the same name as a student answer box — rename it (for example "ta_${v.name}"). Answer-box names are reserved.`,
            });
        } else if (/^ans\d+$/.test(v.name)) {
            issues.push({
                level: 'error',
                message: `Variable "${v.name}": names like "ans1", "ans2" are reserved for student answer boxes. Use a different name (for example "ta${v.name.slice(3)}").`,
            });
        }
        const exprErr = validateMaximaExpression(v.value);
        if (exprErr) {
            issues.push({ level: 'warning', message: `Variable "${v.name}": ${exprErr}` });
        }
    });

    // Stop-slop lint on student-facing prose (P-WRITE-01)
    const slopFindings = lintStopSlop(data);
    slopFindings.forEach(f => {
        const matchText = f.matches.map(m => `"${m}"`).join(', ');
        issues.push({
            level: 'warning',
            message: `[stop-slop] ${f.field}: ${matchText} — try: ${f.suggest}`,
        });
    });

    return issues;
}
