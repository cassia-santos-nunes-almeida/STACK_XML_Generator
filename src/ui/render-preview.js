// Renders the live preview panel with variable substitution and MathJax
import { escapeHtml } from './escape-utils.js';

/**
 * Renders the live preview of the question.
 *
 * @param {HTMLElement} previewBox - Preview content container
 * @param {HTMLElement} liveVarsEl - Live variables display list
 * @param {HTMLElement} validationBox - Validation warnings container
 * @param {object} data - Question data
 * @param {object} previewValues - Computed preview values
 */
export function renderPreview(previewBox, liveVarsEl, validationBox, data, previewValues) {
    if (!previewBox) return;

    // Validate and show warnings
    const warnings = validateForPreview(data, previewValues);
    if (validationBox) {
        if (warnings.length > 0) {
            validationBox.innerHTML = warnings.map(w =>
                `<div class="warning-item ${w.level}">${escapeHtml(w.message)}</div>`
            ).join('');
            validationBox.classList.remove('hidden');
        } else {
            validationBox.innerHTML = '';
            validationBox.classList.add('hidden');
        }
    }

    // Process question text with variable substitution
    let processedText = processText(data.questionText || '', previewValues, data.images || []);

    // Process and display parts
    let partsHtml = '';
    (data.parts || []).forEach((p, idx) => {
        const label = String.fromCharCode(97 + idx);
        const partText = processText(p.text || '', previewValues, data.images || []);

        partsHtml += `<div class="preview-part">
            <p><strong>(${label})</strong> ${partText}</p>`;

        if (p.type === 'radio' && p.options) {
            partsHtml += '<div class="preview-mcq">';
            p.options.forEach((opt, oi) => {
                partsHtml += `<label class="preview-radio">
                    <input type="radio" name="preview-${idx}" disabled>
                    ${escapeHtml(opt.value)} ${opt.correct ? '<span class="correct-badge">&#10003;</span>' : ''}
                </label>`;
            });
            partsHtml += '</div>';
        } else if (p.type === 'jsxgraph') {
            const isVector = p.graphPreset === 'vectorDraw';
            const vectorInfo = isVector && p.answer && previewValues[p.answer] !== undefined
                ? `<br><small>Expected answer: <code>${escapeHtml(String(previewValues[p.answer]))}</code></small>` : '';
            partsHtml += `<div class="preview-graph-placeholder">
                <strong>JSXGraph Interactive Area</strong>${isVector ? ' (Vector Drawing)' : ''}<br>
                <small>Students will interact with the graph here. Preview available in Moodle.</small>${vectorInfo}
            </div>`;
        } else if (p.type === 'matrix') {
            partsHtml += renderMatrixPreview(p, previewValues);
        } else if (p.type === 'notes') {
            const boxRows = p.notesBoxSize || 6;
            const hint = p.notesSyntaxHint ? escapeHtml(p.notesSyntaxHint) : 'Explain your reasoning...';
            const autoLabel = p.notesAutoCredit !== false
                ? '<span class="correct-badge" title="Full marks awarded for any response">auto-credit</span>'
                : '<span class="warning-badge" title="Teacher will grade manually">manual grading</span>';
            partsHtml += `<div class="preview-notes">
                <textarea disabled rows="${boxRows}" placeholder="${hint}" style="width:100%;resize:vertical;"></textarea>
                <small>${autoLabel}</small>
                ${p.notesRequireImage ? '<br><small>Students are also asked to upload handwritten working.</small>' : ''}
            </div>`;
        } else {
            const placeholder = p.type === 'units' ? 'e.g., 5.2 m/s' : p.type === 'string' ? 'Type answer...' : p.type === 'algebraic' ? 'Algebraic expression' : 'Numerical answer';
            partsHtml += `<div class="preview-input"><input type="text" disabled placeholder="${placeholder}"></div>`;
        }

        partsHtml += '</div>';
    });

    // General feedback preview
    let feedbackHtml = '';
    if (data.generalFeedback) {
        feedbackHtml = `<details class="preview-feedback">
            <summary>Worked Solution (shown after attempts)</summary>
            <div>${processText(data.generalFeedback, previewValues, data.images || [])}</div>
        </details>`;
    }

    // Hints preview
    let hintsHtml = '';
    if (data.hints && data.hints.length > 0) {
        hintsHtml = `<details class="preview-hints">
            <summary>Hints (${data.hints.length})</summary>
            <ol>${data.hints.map(h => `<li>${processText(h, previewValues, data.images || [])}</li>`).join('')}</ol>
        </details>`;
    }

    previewBox.innerHTML = processedText + partsHtml + feedbackHtml + hintsHtml;

    // Render live variable values
    if (liveVarsEl) {
        liveVarsEl.innerHTML = Object.entries(previewValues).map(([name, val]) =>
            `<li><span class="var-tag">${escapeHtml(name)}</span> <span class="equals">=</span> <span class="var-val-display">${escapeHtml(String(val))}</span></li>`
        ).join('');
    }

    // Trigger MathJax re-render
    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([previewBox]).catch(() => {});
    }
}

/**
 * Renders a matrix preview as a grid of input cells.
 * Attempts to parse the answer variable value to determine matrix dimensions.
 */
function renderMatrixPreview(part, previewValues) {
    const ansVal = part.answer && previewValues[part.answer] !== undefined
        ? String(previewValues[part.answer]) : '';

    // Try to parse matrix dimensions from expressions like "matrix([a11, a12], [a21, a22])"
    // or substituted values like "matrix([(3), (2)], [(1), (4)])"
    const rowMatches = ansVal.match(/\[([^\[\]]+)\]/g);
    let rows = 2, cols = 2;
    let cellValues = null;

    if (rowMatches && rowMatches.length > 0) {
        rows = rowMatches.length;
        // Count columns from first row
        const firstRowItems = rowMatches[0].replace(/[\[\]]/g, '').split(',');
        cols = firstRowItems.length;

        // Try to extract actual numeric values for display
        cellValues = rowMatches.map(row => {
            return row.replace(/[\[\]]/g, '').split(',').map(v => {
                const trimmed = v.trim().replace(/^\(|\)$/g, '');
                const num = parseFloat(trimmed);
                return isNaN(num) ? trimmed : String(num);
            });
        });
    }

    let html = '<div class="preview-matrix">';
    html += '<table class="matrix-grid"><tbody>';
    for (let r = 0; r < rows; r++) {
        html += '<tr>';
        for (let c = 0; c < cols; c++) {
            const val = cellValues && cellValues[r] && cellValues[r][c] !== undefined
                ? escapeHtml(cellValues[r][c]) : '';
            html += `<td><input type="text" disabled value="${val}" class="matrix-cell" size="${part.matrixBoxSize || 5}"></td>`;
        }
        html += '</tr>';
    }
    html += '</tbody></table>';

    if (ansVal) {
        html += `<small class="matrix-answer-hint">Expected: <code>${escapeHtml(ansVal)}</code></small>`;
    }
    html += '</div>';
    return html;
}

/**
 * Processes text by substituting variables and handling special syntax.
 */
function processText(text, values, images) {
    if (!text) return '';

    let result = text;

    // Substitute {@varName@} with preview values
    result = result.replace(/\{@([a-zA-Z_][a-zA-Z0-9_]*)@\}/g, (match, varName) => {
        if (values[varName] !== undefined) {
            return `<span class="substituted-var" title="${escapeHtml(varName)}">${values[varName]}</span>`;
        }
        return `<span class="undefined-var" title="Undefined variable">${match}</span>`;
    });

    // Handle image references
    images.forEach(img => {
        const pattern = new RegExp(`@@${img.name}@@`, 'g');
        result = result.replace(pattern, `<img src="${img.data}" alt="${escapeHtml(img.name)}" style="max-width:100%">`);
    });

    return result;
}

/**
 * Validates question data for preview warnings.
 */
function validateForPreview(data, previewValues) {
    const warnings = [];

    // Check for undefined variable references
    const allText = [data.questionText || '', ...(data.parts || []).map(p => p.text || '')].join(' ');
    const refs = allText.match(/\{@([a-zA-Z_][a-zA-Z0-9_]*)@\}/g) || [];
    const defined = new Set(Object.keys(previewValues));

    refs.forEach(ref => {
        const name = ref.replace(/\{@|@\}/g, '');
        if (!defined.has(name)) {
            warnings.push({
                level: 'warning',
                message: `Variable "${name}" is referenced but not defined.`,
            });
        }
    });

    // Check for preview errors
    Object.entries(previewValues).forEach(([name, val]) => {
        if (val === '[Error]' || val === '[Calc Error]') {
            warnings.push({
                level: 'error',
                message: `Variable "${name}" has a calculation error. Check the expression.`,
            });
        }
    });

    return warnings;
}

