// Generates a companion Moodle Essay question for image/working uploads

/**
 * Returns the default auto-generated essay prompt text.
 * @param {string} questionName - The parent STACK question name
 * @returns {string}
 */
export function defaultEssayText(questionName) {
    return `Upload your working, diagrams, or supporting files for: <b>${questionName || 'this question'}</b>.`;
}

/**
 * Generates a Moodle Essay question XML block.
 * This is a standard Moodle essay (not STACK) appended after the STACK question
 * inside the same <quiz> wrapper so both import together.
 *
 * @param {object} data - Full question data object
 * @returns {string} Essay question XML, or empty string if essay is disabled
 */
export function generateEssayQuestion(data) {
    if (!data.essayEnabled) return '';

    const name = (data.name || 'Question') + ' - Image Upload';
    const text = data.essayText || defaultEssayText(data.name);
    const grade = data.essayGrade ?? 0;
    const attachments = data.essayAttachments ?? 1;

    return `
  <question type="essay">
    <name>
      <text>${escapeXml(name)}</text>
    </name>
    <questiontext format="html">
      <text><![CDATA[${text}]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text></text>
    </generalfeedback>
    <defaultgrade>${grade}</defaultgrade>
    <penalty>0</penalty>
    <hidden>0</hidden>
    <idnumber></idnumber>
    <responseformat>noinlineeditor</responseformat>
    <responserequired>0</responserequired>
    <responsefieldlines>3</responsefieldlines>
    <minwordlimit></minwordlimit>
    <maxwordlimit></maxwordlimit>
    <attachments>${attachments}</attachments>
    <attachmentsrequired>0</attachmentsrequired>
    <filetypeslist>image/*,.pdf</filetypeslist>
    <graderinfo format="html">
      <text></text>
    </graderinfo>
    <responsetemplate format="html">
      <text></text>
    </responsetemplate>
  </question>`;
}

function escapeXml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
