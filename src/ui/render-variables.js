// Renders the variables editor section with syntax helpers and examples
import { SYNTAX_EXAMPLES } from '../core/constants.js';

/**
 * Renders the variables list with controls and syntax example panel.
 *
 * @param {HTMLElement} container - Variables list container
 * @param {Array} variables - Variable definitions
 * @param {object} previewValues - Current preview values
 * @param {object} handlers - Event handler callbacks
 */
export function renderVariables(container, variables, previewValues, handlers) {
    if (!container) return;

    let html = '';

    variables.forEach((v, i) => {
        const previewVal = previewValues[v.name];
        const previewDisplay = previewVal !== undefined ? previewVal : '—';

        html += `
        <div class="var-item" data-index="${i}">
            <div class="var-row">
                <div class="var-controls">
                    <button class="move-btn move-up" data-idx="${i}" title="Move up">&uarr;</button>
                    <button class="move-btn move-down" data-idx="${i}" title="Move down">&darr;</button>
                </div>
                <input type="text" class="var-name" value="${escapeAttr(v.name)}" placeholder="name" data-idx="${i}">
                <select class="var-type" data-idx="${i}">
                    <option value="rand" ${v.type === 'rand' ? 'selected' : ''}>Random</option>
                    <option value="calc" ${v.type === 'calc' ? 'selected' : ''}>Calculated</option>
                    <option value="algebraic" ${v.type === 'algebraic' ? 'selected' : ''}>Algebraic</option>
                </select>
                <input type="text" class="var-val" value="${escapeAttr(v.value)}" placeholder="expression" data-idx="${i}">
                <span class="var-preview" title="Preview value">${escapeHtml(String(previewDisplay))}</span>
                <button class="del-var danger-btn" data-idx="${i}" title="Delete variable">&times;</button>
            </div>
            ${v.type === 'rand' ? renderRandomHelp() : ''}
        </div>`;
    });

    // Syntax examples panel
    html += renderSyntaxPanel();

    container.innerHTML = html;

    // Attach event listeners
    attachVariableEvents(container, handlers);
}

function renderRandomHelp() {
    return `<div class="var-hint">
        <small>Examples: <code>rand(10)+1</code> (1-10), <code>rand([2,3,5,7])</code> (from list), <code>rand_with_step(0,10,0.5)</code></small>
    </div>`;
}

function renderSyntaxPanel() {
    const categories = [
        { key: 'random', label: 'Random Values' },
        { key: 'arithmetic', label: 'Arithmetic' },
        { key: 'trigonometry', label: 'Trigonometry' },
        { key: 'calculus', label: 'Calculus' },
        { key: 'linearAlgebra', label: 'Linear Algebra' },
        { key: 'units', label: 'Units' },
        { key: 'formatting', label: 'Formatting' },
    ];

    let html = `<div class="syntax-panel">
        <details>
            <summary>Maxima Syntax Reference & Examples</summary>
            <div class="syntax-categories">`;

    categories.forEach(cat => {
        const examples = SYNTAX_EXAMPLES[cat.key];
        if (!examples) return;

        html += `<div class="syntax-category">
            <h4>${cat.label}</h4>
            <table class="syntax-table">
                <tr><th>Syntax</th><th>Description</th><th>Example</th></tr>`;

        examples.forEach(ex => {
            html += `<tr>
                <td><code class="syntax-insert" data-value="${escapeAttr(ex.syntax)}">${escapeHtml(ex.syntax)}</code></td>
                <td>${escapeHtml(ex.description)}</td>
                <td><code>${escapeHtml(ex.example)}</code></td>
            </tr>`;
        });

        html += `</table></div>`;
    });

    html += `</div></details></div>`;
    return html;
}

function attachVariableEvents(container, handlers) {
    // Name changes
    container.querySelectorAll('.var-name').forEach(el => {
        el.addEventListener('change', () => handlers.onUpdate(parseInt(el.dataset.idx), 'name', el.value));
    });

    // Type changes
    container.querySelectorAll('.var-type').forEach(el => {
        el.addEventListener('change', () => handlers.onUpdate(parseInt(el.dataset.idx), 'type', el.value));
    });

    // Value changes
    container.querySelectorAll('.var-val').forEach(el => {
        el.addEventListener('change', () => handlers.onUpdate(parseInt(el.dataset.idx), 'value', el.value));
        // Track last focused for syntax insertion
        el.addEventListener('focus', () => { handlers.onFocus && handlers.onFocus(el); });
    });

    // Move buttons
    container.querySelectorAll('.move-up').forEach(el => {
        el.addEventListener('click', () => handlers.onMove(parseInt(el.dataset.idx), -1));
    });
    container.querySelectorAll('.move-down').forEach(el => {
        el.addEventListener('click', () => handlers.onMove(parseInt(el.dataset.idx), 1));
    });

    // Delete buttons
    container.querySelectorAll('.del-var').forEach(el => {
        el.addEventListener('click', () => handlers.onDelete(parseInt(el.dataset.idx)));
    });

    // Syntax insert buttons
    container.querySelectorAll('.syntax-insert').forEach(el => {
        el.addEventListener('click', () => {
            if (handlers.onSyntaxInsert) {
                handlers.onSyntaxInsert(el.dataset.value);
            }
        });
        el.style.cursor = 'pointer';
        el.title = 'Click to insert into last focused variable';
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
