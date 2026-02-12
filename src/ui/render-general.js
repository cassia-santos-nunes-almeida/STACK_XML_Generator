// Renders the general settings section: name, text, images, feedback, hints

/**
 * Renders the image gallery and handles image upload UI.
 *
 * @param {HTMLElement} imageList - Image gallery container
 * @param {Array} images - Image data array
 * @param {Function} onRemove - Callback when image is removed
 */
export function renderImages(imageList, images, onRemove) {
    if (!imageList) return;

    if (!images || images.length === 0) {
        imageList.innerHTML = '';
        return;
    }

    imageList.innerHTML = images.map((img, i) => `
        <div class="image-card">
            <img src="${img.data}" alt="${escapeAttr(img.name)}" title="${escapeAttr(img.name)}">
            <div class="image-actions">
                <small>${escapeHtml(img.name)}</small>
                <button class="del-img danger-btn" data-idx="${i}" title="Remove">&times;</button>
            </div>
            <div class="image-ref">
                <code>@@${escapeHtml(img.name)}@@</code>
                <small>Use in question text to embed</small>
            </div>
        </div>
    `).join('');

    imageList.querySelectorAll('.del-img').forEach(btn => {
        btn.addEventListener('click', () => onRemove(parseInt(btn.dataset.idx)));
    });
}

/**
 * Renders the general feedback (worked solution) editor.
 *
 * @param {HTMLElement} container - Container element
 * @param {string} feedback - Current feedback text
 * @param {Function} onChange - Callback when text changes
 */
export function renderFeedbackEditor(container, feedback, onChange) {
    if (!container) return;

    container.innerHTML = `
    <div class="form-group">
        <label>Worked Solution / General Feedback
            <span class="tooltip" title="Shown to students after all attempts are used. Include step-by-step solution.">?</span>
        </label>
        <textarea id="general-feedback" rows="4" placeholder="Step 1: Apply the formula...&#10;Step 2: Substitute values...&#10;Step 3: Calculate the result...">${escapeHtml(feedback || '')}</textarea>
    </div>`;

    const textarea = container.querySelector('#general-feedback');
    if (textarea) {
        textarea.addEventListener('input', () => onChange(textarea.value));
    }
}

/**
 * Renders the hints editor.
 *
 * @param {HTMLElement} container - Hints container
 * @param {Array} hints - Current hints array
 * @param {object} handlers - { onAdd, onUpdate, onRemove }
 */
export function renderHints(container, hints, handlers) {
    if (!container) return;

    let html = '<label>Hints (shown on retry attempts)</label>';

    if (hints && hints.length > 0) {
        hints.forEach((hint, i) => {
            html += `
            <div class="hint-item">
                <span class="hint-label">Hint ${i + 1}:</span>
                <input type="text" class="hint-text" value="${escapeAttr(hint)}" data-idx="${i}" placeholder="Try reviewing the formula for...">
                <button class="del-hint danger-btn" data-idx="${i}">&times;</button>
            </div>`;
        });
    }

    html += `<button class="add-hint small-btn">+ Add Hint</button>`;

    container.innerHTML = html;

    // Events
    container.querySelectorAll('.hint-text').forEach(el => {
        el.addEventListener('change', () => handlers.onUpdate(parseInt(el.dataset.idx), el.value));
    });
    container.querySelectorAll('.del-hint').forEach(el => {
        el.addEventListener('click', () => handlers.onRemove(parseInt(el.dataset.idx)));
    });
    container.querySelector('.add-hint')?.addEventListener('click', () => handlers.onAdd());
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
