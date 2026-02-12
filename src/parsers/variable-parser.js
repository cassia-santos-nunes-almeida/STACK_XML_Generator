// Variable parser — handles type detection and preview value generation
// FIXES BUG 3: rand(n)+k offset now properly evaluated
// FIXES BUG 6: rand_with_step returns number, not string

/**
 * Determines the variable type from a Maxima expression.
 * @param {string} value - Maxima expression
 * @returns {'rand'|'calc'|'algebraic'} Variable type
 */
export function detectVariableType(value) {
    if (!value) return 'calc';
    const v = value.trim();

    if (v.includes('rand(') || v.includes('rand_with_step')) {
        return 'rand';
    }

    // Check for symbolic content that can't be numerically evaluated
    // Remove known function names first
    const stripped = v.replace(/(sin|cos|tan|exp|sqrt|log|abs|pi|%pi|%e|decimalplaces|significantfigures|integrate|diff|expand|matrix|invert|determinant|transpose|stackunits)/g, '');
    if (/[a-zA-Z_]/.test(stripped)) {
        // Has letters that aren't standard functions — might be algebraic
        // But could also be a calc referencing other variables
        // Default to calc which is safer for preview
        return 'calc';
    }

    return 'calc';
}

/**
 * Generates a sample value for a variable expression.
 * Used for live preview in the editor.
 *
 * FIXES BUG 3: Now evaluates full expressions like rand(10)+1, not just rand(10).
 * FIXES BUG 6: rand_with_step returns a number, not a string.
 *
 * @param {string} type - Variable type ('rand', 'calc', 'algebraic')
 * @param {string} expr - Maxima expression
 * @param {object} previousValues - Map of previously computed variable values
 * @returns {*} Computed sample value
 */
export function evaluatePreviewValue(type, expr, previousValues) {
    if (!expr) return 0;

    // Strip trailing semicolons
    let e = expr.trim();
    while (e.endsWith(';')) e = e.slice(0, -1).trim();

    if (type === 'rand') {
        return evaluateRandomExpression(e, previousValues);
    }

    if (type === 'algebraic') {
        // Substitute known values but don't evaluate — return as expression string
        let result = e;
        for (const [key, val] of Object.entries(previousValues)) {
            result = result.replace(new RegExp(`\\b${key}\\b`, 'g'), `(${val})`);
        }
        return result;
    }

    // Calc mode — numeric JS evaluation
    return evaluateCalcExpression(e, previousValues);
}

/**
 * Evaluates a random expression like rand(10)+1, rand([1,2,3]), rand_with_step(1,10,0.5).
 * FIX: Now handles the full expression, not just the rand() part.
 */
function evaluateRandomExpression(expr, previousValues) {
    // Substitute previously defined variables
    let e = substituteVariables(expr, previousValues);

    // Replace all rand() calls with concrete random values, then evaluate the full expression
    let resolved = e;

    // Handle rand_with_step(min, max, step)
    resolved = resolved.replace(/rand_with_step\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, (_, minS, maxS, stepS) => {
        const min = parseFloat(minS);
        const max = parseFloat(maxS);
        const step = parseFloat(stepS);
        if (isNaN(min) || isNaN(max) || isNaN(step) || step <= 0) return '0';
        const steps = Math.floor((max - min) / step);
        const randStep = Math.floor(Math.random() * (steps + 1));
        return String(min + randStep * step); // Returns number as string for further arithmetic
    });

    // Handle rand([list])
    resolved = resolved.replace(/rand\(\s*\[([^\]]+)\]\s*\)/g, (_, listStr) => {
        const items = listStr.split(',').map(s => s.trim());
        const picked = items[Math.floor(Math.random() * items.length)];
        const num = parseFloat(picked);
        return isNaN(num) ? picked : String(num);
    });

    // Handle rand(n)
    resolved = resolved.replace(/rand\((\d+)\)/g, (_, nStr) => {
        return String(Math.floor(Math.random() * parseInt(nStr)));
    });

    // Now evaluate the full expression (e.g., "3 + 1" from "rand(4) + 1")
    return safeEval(resolved);
}

/**
 * Evaluates a calculated expression with variable substitution.
 */
function evaluateCalcExpression(expr, previousValues) {
    let e = substituteVariables(expr, previousValues);

    return safeEval(e);
}

/**
 * Substitutes known variable values into an expression.
 */
function substituteVariables(expr, values) {
    let result = expr;
    // Sort by name length descending to avoid partial replacements
    const sortedKeys = Object.keys(values).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        result = result.replace(new RegExp(`\\b${key}\\b`, 'g'), `(${values[key]})`);
    }
    return result;
}

/**
 * Safely evaluates a numeric expression using Function constructor.
 * Converts Maxima syntax to JavaScript syntax first.
 */
function safeEval(expr) {
    try {
        let jsExpr = expr;

        // Convert Maxima functions to JavaScript
        jsExpr = jsExpr.replace(/\bsin\s*\(/g, 'Math.sin(');
        jsExpr = jsExpr.replace(/\bcos\s*\(/g, 'Math.cos(');
        jsExpr = jsExpr.replace(/\btan\s*\(/g, 'Math.tan(');
        jsExpr = jsExpr.replace(/\bexp\s*\(/g, 'Math.exp(');
        jsExpr = jsExpr.replace(/\bsqrt\s*\(/g, 'Math.sqrt(');
        jsExpr = jsExpr.replace(/\blog\s*\(/g, 'Math.log(');
        jsExpr = jsExpr.replace(/\babs\s*\(/g, 'Math.abs(');
        jsExpr = jsExpr.replace(/\bpi\b/g, 'Math.PI');
        jsExpr = jsExpr.replace(/%pi/g, 'Math.PI');
        jsExpr = jsExpr.replace(/%e/g, 'Math.E');
        jsExpr = jsExpr.replace(/\^/g, '**');

        // Safety check: only allow math-safe characters
        const safePattern = /^[0-9+\-*/().,%\s]*$|Math\.|(\*\*)/;
        // More permissive check: strip all Math.xxx calls and check remainder
        const stripped = jsExpr.replace(/Math\.\w+/g, '').replace(/\*\*/g, '');
        if (/[a-zA-Z_]/.test(stripped)) {
            // Contains non-Math letters — can't safely evaluate
            return '[Preview N/A]';
        }

        const result = Function('"use strict"; return (' + jsExpr + ')')();
        if (typeof result === 'number') {
            if (Number.isInteger(result)) return result;
            return parseFloat(result.toPrecision(6));
        }
        return result;
    } catch {
        return '[Calc Error]';
    }
}

/**
 * Parses a Maxima variable definition string "name: value" into parts.
 * @param {string} defStr - e.g., "L: rand(10)+1"
 * @returns {{name: string, value: string}|null}
 */
export function parseVariableDefinition(defStr) {
    const match = defStr.match(/^([^:]+):(.*)$/);
    if (!match) return null;
    return {
        name: match[1].trim(),
        value: match[2].trim().replace(/;+$/, ''),
    };
}
