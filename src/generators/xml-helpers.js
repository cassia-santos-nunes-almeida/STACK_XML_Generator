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
 * Creates an XML element with optional attributes and text content.
 */
export function xmlElement(tag, content, attrs = {}) {
    const attrStr = Object.entries(attrs)
        .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
        .join('');
    if (content === null || content === undefined) {
        return `<${tag}${attrStr}/>`;
    }
    return `<${tag}${attrStr}>${content}</${tag}>`;
}

/**
 * Creates a <text> element, optionally with CDATA wrapping.
 */
export function textElement(content, useCdata = false) {
    if (useCdata) {
        return `<text>${cdata(content)}</text>`;
    }
    return `<text>${escapeXml(content)}</text>`;
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

/**
 * Indents a multi-line XML string by a given number of spaces.
 */
export function indent(xml, spaces = 4) {
    const pad = ' '.repeat(spaces);
    return xml.split('\n').map(line => pad + line).join('\n');
}
