// Renders the live preview panel with variable substitution and MathJax

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
            partsHtml += '<div class="preview-graph-placeholder">[Interactive Graph]</div>';
        } else if (p.type === 'matrix') {
            partsHtml += '<div class="preview-input"><input type="text" disabled placeholder="matrix([[1,2],[3,4]])"></div>';
        } else {
            const placeholder = p.type === 'units' ? 'e.g., 5.2 m/s' : p.type === 'string' ? 'Type answer...' : 'Numerical answer';
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

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
