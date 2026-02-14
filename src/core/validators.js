// Validation utilities for STACK question data

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
            issues.push({ level: 'error', message: `Part (${label}): Answer variable is required.` });
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
    (data.variables || []).forEach(v => {
        const nameErr = validateVariableName(v.name);
        if (nameErr) {
            issues.push({ level: 'error', message: `Variable "${v.name}": ${nameErr}` });
        }
        const exprErr = validateMaximaExpression(v.value);
        if (exprErr) {
            issues.push({ level: 'warning', message: `Variable "${v.name}": ${exprErr}` });
        }
    });

    return issues;
}
