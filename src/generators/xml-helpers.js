// XML utility functions used across all generators

/**
 * Escapes special XML characters in text nodes and attributes.
 * Do NOT use inside CDATA sections.
 */
export function escapeXml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Wraps content in a CDATA section.
 * Handles the edge case where content contains ']]>' by splitting.
 */
export function cdata(content) {
    if (!content && content !== 0) return '';
    const str = String(content);
    // Split on ]]> to prevent breaking CDATA
    const safe = str.replace(/\]\]>/g, ']]]]><![CDATA[>');
    return `<![CDATA[${safe}]]>`;
}

/**
 * Like cdata(), but always emits the CDATA wrapper — even for empty
 * content. Drop-in replacement for template sites that used to write
 * <![CDATA[...]]> literally (keeps their output byte-identical while
 * making ]]> in teacher text safe — premortem F1).
 */
export function cdataRaw(content) {
    const str = String(content ?? '');
    return `<![CDATA[${str.replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;
}

/**
 * Final well-formedness gate for a generated XML string (premortem F1).
 * Returns a short error description, or null when the XML parses clean
 * (or when no DOMParser exists in this environment — browser/jsdom only).
 */
export function xmlWellFormedError(xmlString) {
    if (typeof DOMParser === 'undefined') return null;
    const doc = new DOMParser().parseFromString(xmlString, 'text/xml');
    const err = doc.querySelector('parsererror');
    return err ? err.textContent.replace(/\s+/g, ' ').trim().substring(0, 200) : null;
}

/**
 * Converts LaTeX $ delimiters to \( \) for STACK compatibility.
 * STACK uses \( \) for inline math, not $ $.
 */
export function convertMathDelimiters(str) {
    if (!str) return '';
    // Convert $...$ to \(...\) but not $$...$$ (display math)
    let result = str.replace(/\$\$([^$]+)\$\$/g, '\\[$1\\]');
    result = result.replace(/\$([^$]+)\$/g, '\\($1\\)');
    return result;
}

/**
 * Creates a feedback element with HTML format.
 * Uses CDATA wrapping to preserve HTML content like <br>, <p>, {@var@} etc.
 */
export function feedbackElement(tag, message) {
    if (!message) {
        return `<${tag} format="html"><text></text></${tag}>`;
    }
    return `<${tag} format="html"><text>${cdata(message)}</text></${tag}>`;
}

