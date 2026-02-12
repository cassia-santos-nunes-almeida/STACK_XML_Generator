// Renders the question text toolbar with variable chips and formatting buttons

/**
 * Renders variable chip buttons in the toolbar.
 * Clicking a chip inserts {@varName@} at the cursor position.
 *
 * @param {HTMLElement} container - Toolbar variable group container
 * @param {Array} variables - Variable definitions
 * @param {Function} insertFn - Function to insert text at cursor
 */
export function renderToolbar(container, variables, insertFn) {
    if (!container) return;

    if (!variables || variables.length === 0) {
        container.innerHTML = '<span style="font-size:0.8rem; color:#999;">No variables defined yet</span>';
        return;
    }

    container.innerHTML = variables.map(v =>
        `<button class="var-chip" data-insert="{@${v.name}@}" title="Insert {@${v.name}@}">
            {@${v.name}@}
        </button>`
    ).join('');

    // Delegate click events
    container.querySelectorAll('.var-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            insertFn(btn.dataset.insert);
        });
    });
}
