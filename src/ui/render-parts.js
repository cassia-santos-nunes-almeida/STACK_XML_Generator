// Renders the parts (inputs & grading) editor section
import { INPUT_TYPES, GRADING_PRESETS, DEFAULT_FEEDBACK } from '../core/constants.js';
import { GRAPH_GRADING_TEMPLATES } from '../generators/prts/jsxgraph-prt.js';

/**
 * Renders the parts list with type-specific editors and grading configuration.
 *
 * @param {HTMLElement} container - Parts list container
 * @param {Array} parts - Part definitions
 * @param {Array} variables - Variable definitions (for answer variable dropdowns)
 * @param {object} handlers - Event handler callbacks
 */
export function renderParts(container, parts, variables, handlers) {
    if (!container) return;

    if (parts.length === 0) {
        container.innerHTML = '<p class="empty-state">No parts yet. Click "+ Add Part" to create an answer input.</p>';
        return;
    }

    container.innerHTML = parts.map((p, idx) => renderPart(p, idx, variables)).join('');
    attachPartEvents(container, parts, handlers);
}

function renderPart(part, idx, variables) {
    const label = String.fromCharCode(97 + idx);
    const ansVars = variables.filter(v => v.name.startsWith('ans')).map(v => v.name);

    return `
    <div class="part-card" data-part-idx="${idx}">
        <div class="part-header">
            <span class="part-label">Part (${label})</span>
            <div class="part-header-controls">
                <select class="part-type" data-idx="${idx}">
                    <option value="numerical" ${part.type === 'numerical' ? 'selected' : ''}>Numerical</option>
                    <option value="algebraic" ${part.type === 'algebraic' ? 'selected' : ''}>Algebraic</option>
                    <option value="units" ${part.type === 'units' ? 'selected' : ''}>Units</option>
                    <option value="radio" ${part.type === 'radio' ? 'selected' : ''}>Multiple Choice</option>
                    <option value="matrix" ${part.type === 'matrix' ? 'selected' : ''}>Matrix</option>
                    <option value="string" ${part.type === 'string' ? 'selected' : ''}>Text/String</option>
                    <option value="jsxgraph" ${part.type === 'jsxgraph' ? 'selected' : ''}>Interactive Graph</option>
                </select>
                <button class="del-part danger-btn" data-idx="${idx}" title="Delete part">&times;</button>
            </div>
        </div>
        <div class="part-body">
            <div class="form-group">
                <label>Part Text / Instruction</label>
                <textarea class="part-text" rows="2" data-idx="${idx}" placeholder="What should the student calculate?">${escapeHtml(part.text || '')}</textarea>
            </div>
            <div class="form-group">
                <label>Answer Variable <span class="tooltip" title="The variable holding the correct answer (must be defined in Variables section)">?</span></label>
                <input type="text" class="part-ans" value="${escapeAttr(part.answer || '')}" data-idx="${idx}" placeholder="e.g., ans1">
            </div>

            ${renderTypeSpecificUI(part, idx)}
            ${renderGradingConfig(part, idx)}
            ${renderFeedbackConfig(part, idx)}
        </div>
    </div>`;
}

function renderTypeSpecificUI(part, idx) {
    switch (part.type) {
        case INPUT_TYPES.RADIO:
            return renderRadioOptions(part, idx);
        case INPUT_TYPES.JSXGRAPH:
            return renderJSXGraphConfig(part, idx);
        case INPUT_TYPES.STRING:
            return renderStringConfig(part, idx);
        case INPUT_TYPES.MATRIX:
            return renderMatrixConfig(part, idx);
        default:
            return '';
    }
}

function renderRadioOptions(part, idx) {
    const options = part.options || [];
    let html = `<div class="mcq-section">
        <label>Options</label>`;

    options.forEach((opt, oi) => {
        html += `
        <div class="mcq-option">
            <input type="radio" name="correct-${idx}" class="opt-correct" data-part="${idx}" data-opt="${oi}"
                ${opt.correct ? 'checked' : ''} title="Mark as correct">
            <input type="text" class="opt-val" value="${escapeAttr(opt.value)}" data-part="${idx}" data-opt="${oi}" placeholder="Option text">
            <button class="del-opt danger-btn" data-part="${idx}" data-opt="${oi}" title="Remove">&times;</button>
        </div>`;
    });

    html += `<button class="add-opt small-btn" data-idx="${idx}">+ Add Option</button>
    </div>`;
    return html;
}

function renderJSXGraphConfig(part, idx) {
    return `
    <div class="jsxgraph-section">
        <div class="form-group">
            <label>Graph Type Preset</label>
            <select class="graph-preset" data-idx="${idx}">
                <option value="">-- Custom Code --</option>
                <option value="pointPlacement">Point Placement (students place points)</option>
                <option value="functionSketch">Function Sketch (students draw curve)</option>
                <option value="vectorDraw">Vector Drawing</option>
            </select>
        </div>
        <div class="form-group">
            <label>Client-Side JavaScript (Graph Setup)
                <span class="tooltip" title="This code runs in the student's browser to create the interactive graph. Use 'divid' for the board container and 'ansXRef' to reference the hidden input.">?</span>
            </label>
            <textarea class="graph-code" rows="12" data-idx="${idx}" placeholder="var board = JXG.JSXGraph.initBoard(divid, {...});">${escapeHtml(part.graphCode || '')}</textarea>
        </div>
        <div class="form-group">
            <label>Server-Side Maxima (Grading Logic)
                <span class="tooltip" title="This Maxima code runs on the server to grade the student's graph answer. Must set 'all_correct' to true/false.">?</span>
            </label>
            <textarea class="grading-code" rows="8" data-idx="${idx}" placeholder="/* Must set all_correct: true or false */&#10;all_correct: true;">${escapeHtml(part.gradingCode || '')}</textarea>
        </div>
    </div>`;
}

function renderStringConfig(part, idx) {
    const caseSensitive = part.grading?.caseSensitive !== false;
    return `
    <div class="string-section">
        <label>
            <input type="checkbox" class="case-sensitive" data-idx="${idx}" ${caseSensitive ? 'checked' : ''}>
            Case-sensitive matching
        </label>
    </div>`;
}

function renderMatrixConfig(part, idx) {
    return `
    <div class="matrix-section">
        <div class="form-group">
            <label>Box Size (width of each cell input)</label>
            <input type="number" class="matrix-box-size" value="${part.matrixBoxSize || 5}"
                min="1" max="20" data-idx="${idx}">
        </div>
    </div>`;
}

function renderGradingConfig(part, idx) {
    // Only show grading config for types that use tolerances
    if (part.type === 'radio' || part.type === 'string' || part.type === 'jsxgraph') {
        return '';
    }

    const g = part.grading || {};

    let html = `
    <div class="grading-section">
        <h4>Grading Configuration</h4>
        <div class="grading-presets">
            <label>Quick Preset:</label>
            <select class="grading-preset" data-idx="${idx}">
                <option value="">-- Custom --</option>
                ${Object.entries(GRADING_PRESETS).map(([key, preset]) =>
                    `<option value="${key}" title="${preset.description}">${preset.label}</option>`
                ).join('')}
            </select>
        </div>

        <div class="grading-pipeline">
            <div class="pipeline-step active">
                <div class="step-icon">1</div>
                <div class="step-content">
                    <strong>Wide Tolerance</strong> (Partial Credit: 50%)
                    <div class="grading-inputs">
                        <label>Tolerance: <input type="number" class="g-wide-tol" value="${g.wideTol || 0.2}" step="0.01" min="0" data-idx="${idx}"></label>
                    </div>
                </div>
            </div>

            <div class="pipeline-step active">
                <div class="step-icon">2</div>
                <div class="step-content">
                    <strong>Tight Tolerance</strong> (Full Credit: 100%)
                    <div class="grading-inputs">
                        <label>Tolerance: <input type="number" class="g-tight-tol" value="${g.tightTol || 0.05}" step="0.01" min="0" data-idx="${idx}"></label>
                    </div>
                </div>
            </div>

            <div class="pipeline-step secondary-step">
                <div class="step-icon">3</div>
                <div class="step-content">
                    <label>
                        <input type="checkbox" class="g-check-sigfigs" data-idx="${idx}" ${g.checkSigFigs ? 'checked' : ''}>
                        <strong>Check Significant Figures</strong>
                    </label>
                    <div class="grading-inputs ${g.checkSigFigs ? '' : 'hidden'}">
                        <label>Required sig figs: <input type="number" class="g-sigfigs" value="${g.sigFigs || 3}" min="1" max="10" data-idx="${idx}"></label>
                        <label>Penalty: <input type="number" class="g-penalty" value="${g.penalty || 0.1}" step="0.05" min="0" max="1" data-idx="${idx}"></label>
                    </div>
                </div>
            </div>

            <div class="pipeline-step check-step">
                <div class="step-icon">4</div>
                <div class="step-content">
                    <label>
                        <input type="checkbox" class="g-check-p10" data-idx="${idx}" ${g.checkPowerOf10 ? 'checked' : ''}>
                        <strong>Power of 10 Check</strong>
                        <span class="tooltip" title="Detects if the student's answer is off by a factor of 10 (common unit conversion error)">?</span>
                    </label>
                    <div class="grading-inputs ${g.checkPowerOf10 ? '' : 'hidden'}">
                        <label>Penalty: <input type="number" class="g-p10-penalty" value="${g.powerOf10Penalty || 0.5}" step="0.1" min="0" max="1" data-idx="${idx}"></label>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    return html;
}

function renderFeedbackConfig(part, idx) {
    const fb = part.feedback || {};

    return `
    <details class="feedback-section">
        <summary>Custom Feedback Messages (optional)</summary>
        <div class="feedback-fields">
            <div class="form-group">
                <label>Correct answer feedback</label>
                <input type="text" class="fb-correct" value="${escapeAttr(fb.correct || '')}" data-idx="${idx}"
                    placeholder="${DEFAULT_FEEDBACK.correct}">
            </div>
            <div class="form-group">
                <label>Incorrect answer feedback</label>
                <input type="text" class="fb-incorrect" value="${escapeAttr(fb.incorrect || '')}" data-idx="${idx}"
                    placeholder="${DEFAULT_FEEDBACK.incorrect}">
            </div>
            ${part.type === 'numerical' || part.type === 'units' ? `
            <div class="form-group">
                <label>Close but inaccurate feedback</label>
                <input type="text" class="fb-close" value="${escapeAttr(fb.closeButInaccurate || '')}" data-idx="${idx}"
                    placeholder="${DEFAULT_FEEDBACK.closeButInaccurate}">
            </div>
            <div class="form-group">
                <label>Wrong significant figures feedback</label>
                <input type="text" class="fb-sigfigs" value="${escapeAttr(fb.wrongSigFigs || '')}" data-idx="${idx}"
                    placeholder="${DEFAULT_FEEDBACK.wrongSigFigs}">
            </div>
            <div class="form-group">
                <label>Power of 10 error feedback</label>
                <input type="text" class="fb-p10" value="${escapeAttr(fb.powerOf10Error || '')}" data-idx="${idx}"
                    placeholder="${DEFAULT_FEEDBACK.powerOf10Error}">
            </div>
            ` : ''}
        </div>
    </details>`;
}

function attachPartEvents(container, parts, handlers) {
    // Type change
    container.querySelectorAll('.part-type').forEach(el => {
        el.addEventListener('change', () => handlers.onUpdatePart(parseInt(el.dataset.idx), 'type', el.value));
    });

    // Text change
    container.querySelectorAll('.part-text').forEach(el => {
        el.addEventListener('input', () => handlers.onUpdatePart(parseInt(el.dataset.idx), 'text', el.value));
    });

    // Answer variable change
    container.querySelectorAll('.part-ans').forEach(el => {
        el.addEventListener('change', () => handlers.onUpdatePart(parseInt(el.dataset.idx), 'answer', el.value));
    });

    // Delete part
    container.querySelectorAll('.del-part').forEach(el => {
        el.addEventListener('click', () => handlers.onDeletePart(parseInt(el.dataset.idx)));
    });

    // Grading preset
    container.querySelectorAll('.grading-preset').forEach(el => {
        el.addEventListener('change', () => {
            const preset = GRADING_PRESETS[el.value];
            if (preset) {
                handlers.onGradingBatch(parseInt(el.dataset.idx), preset);
            }
        });
    });

    // Grading inputs
    container.querySelectorAll('.g-tight-tol').forEach(el => {
        el.addEventListener('change', () => handlers.onGrading(parseInt(el.dataset.idx), 'tightTol', parseFloat(el.value)));
    });
    container.querySelectorAll('.g-wide-tol').forEach(el => {
        el.addEventListener('change', () => handlers.onGrading(parseInt(el.dataset.idx), 'wideTol', parseFloat(el.value)));
    });
    container.querySelectorAll('.g-check-sigfigs').forEach(el => {
        el.addEventListener('change', () => {
            handlers.onGrading(parseInt(el.dataset.idx), 'checkSigFigs', el.checked);
        });
    });
    container.querySelectorAll('.g-sigfigs').forEach(el => {
        el.addEventListener('change', () => handlers.onGrading(parseInt(el.dataset.idx), 'sigFigs', parseInt(el.value)));
    });
    container.querySelectorAll('.g-penalty').forEach(el => {
        el.addEventListener('change', () => handlers.onGrading(parseInt(el.dataset.idx), 'penalty', parseFloat(el.value)));
    });
    container.querySelectorAll('.g-check-p10').forEach(el => {
        el.addEventListener('change', () => {
            handlers.onGrading(parseInt(el.dataset.idx), 'checkPowerOf10', el.checked);
        });
    });
    container.querySelectorAll('.g-p10-penalty').forEach(el => {
        el.addEventListener('change', () => handlers.onGrading(parseInt(el.dataset.idx), 'powerOf10Penalty', parseFloat(el.value)));
    });

    // Case sensitivity (string type)
    container.querySelectorAll('.case-sensitive').forEach(el => {
        el.addEventListener('change', () => handlers.onGrading(parseInt(el.dataset.idx), 'caseSensitive', el.checked));
    });

    // Matrix box size
    container.querySelectorAll('.matrix-box-size').forEach(el => {
        el.addEventListener('change', () => handlers.onUpdatePart(parseInt(el.dataset.idx), 'matrixBoxSize', parseInt(el.value)));
    });

    // MCQ options
    container.querySelectorAll('.add-opt').forEach(el => {
        el.addEventListener('click', () => handlers.onAddOption(parseInt(el.dataset.idx)));
    });
    container.querySelectorAll('.opt-correct').forEach(el => {
        el.addEventListener('change', () => handlers.onSetCorrect(parseInt(el.dataset.part), parseInt(el.dataset.opt)));
    });
    container.querySelectorAll('.opt-val').forEach(el => {
        el.addEventListener('change', () => handlers.onUpdateOption(parseInt(el.dataset.part), parseInt(el.dataset.opt), el.value));
    });
    container.querySelectorAll('.del-opt').forEach(el => {
        el.addEventListener('click', () => handlers.onDeleteOption(parseInt(el.dataset.part), parseInt(el.dataset.opt)));
    });

    // JSXGraph
    container.querySelectorAll('.graph-code').forEach(el => {
        el.addEventListener('input', () => handlers.onUpdatePart(parseInt(el.dataset.idx), 'graphCode', el.value));
    });
    container.querySelectorAll('.grading-code').forEach(el => {
        el.addEventListener('input', () => handlers.onUpdatePart(parseInt(el.dataset.idx), 'gradingCode', el.value));
    });
    container.querySelectorAll('.graph-preset').forEach(el => {
        el.addEventListener('change', () => {
            if (el.value && handlers.onGraphPreset) {
                handlers.onGraphPreset(parseInt(el.dataset.idx), el.value);
            }
        });
    });

    // Custom feedback
    container.querySelectorAll('.fb-correct').forEach(el => {
        el.addEventListener('change', () => handlers.onFeedback(parseInt(el.dataset.idx), 'correct', el.value));
    });
    container.querySelectorAll('.fb-incorrect').forEach(el => {
        el.addEventListener('change', () => handlers.onFeedback(parseInt(el.dataset.idx), 'incorrect', el.value));
    });
    container.querySelectorAll('.fb-close').forEach(el => {
        el.addEventListener('change', () => handlers.onFeedback(parseInt(el.dataset.idx), 'closeButInaccurate', el.value));
    });
    container.querySelectorAll('.fb-sigfigs').forEach(el => {
        el.addEventListener('change', () => handlers.onFeedback(parseInt(el.dataset.idx), 'wrongSigFigs', el.value));
    });
    container.querySelectorAll('.fb-p10').forEach(el => {
        el.addEventListener('change', () => handlers.onFeedback(parseInt(el.dataset.idx), 'powerOf10Error', el.value));
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
