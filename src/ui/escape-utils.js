// Shared HTML/attribute escape utilities for UI renderers

/**
 * Escapes HTML special characters for safe text content insertion.
 * @param {string} str - Raw string
 * @returns {string} Escaped string safe for innerHTML text nodes
 */
export function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Escapes HTML attribute values (includes quote escaping).
 * @param {string} str - Raw string
 * @returns {string} Escaped string safe for HTML attribute values
 */
export function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
