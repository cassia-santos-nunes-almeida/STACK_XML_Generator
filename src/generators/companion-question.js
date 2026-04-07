// Generates a companion Moodle Essay question for handwritten working uploads
// Field names and structure verified against real Moodle 4.5 Essay XML export

/**
 * Returns the default student instruction text for the companion question.
 * @param {string} parentTitle - The parent STACK question title
 * @returns {string}
 */
export function defaultCompanionText(parentTitle) {
    const name = parentTitle || 'this question';
    return `<p>Take a clear photo or scan of your handwritten calculations and reasoning for <b>${name}</b>. Upload it here immediately after submitting your numerical answer above.</p>

<p>Make sure your working shows:</p>
<ul>
  <li>All steps of your calculation</li>
  <li>Any diagrams or circuit sketches</li>
  <li>Your final answer with units</li>
</ul>

<p><em>Note: Your uploaded work will be reviewed by your teacher. This part may not be auto-marked.</em></p>

<hr>

<div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:6px;padding:12px;margin-top:12px;">
<p><strong>\u26A0\uFE0F TEACHER ACTION REQUIRED \u2014 DELETE THIS NOTICE BEFORE THE QUIZ RUNS:</strong></p>
<p>Go to Moodle quiz settings \u2192 Files and uploads \u2192 set "Allow attachments" to 1 or more. This is required for students to be able to upload files in this question. Delete this entire notice after completing the setup.</p>
</div>`;
}

/**
 * Generates grader info content for the companion question.
 * @param {string} parentName - The parent STACK question name
 * @returns {string}
 */
function graderInfoContent(parentName) {
    const name = parentName || 'the parent question';
    return `<h4>Manual Grading Notes \u2014 ${escapeXml(name)}</h4>

<p>This companion question collects handwritten working for <b>${escapeXml(name)}</b>. When reviewing submissions, check:</p>

<ul>
  <li><strong>Correct method:</strong> Did the student use an appropriate approach?</li>
  <li><strong>Correct intermediate steps:</strong> Are calculations shown and accurate?</li>
  <li><strong>Clear diagram:</strong> If required, is the circuit sketch or diagram present and labeled?</li>
  <li><strong>Correct final answer with units:</strong> Does the handwritten answer match their submitted numerical answer?</li>
</ul>

<p><em>Compare with the student's submitted answer in ${escapeXml(name)} to check consistency.</em></p>`;
}

/**
 * Generates a companion Moodle Essay question XML string.
 * This is a standard Moodle essay (not STACK) appended after the STACK question
 * inside the same <quiz> wrapper so both import together.
 *
 * Field names verified against real Moodle 4.5 Essay XML export.
 *
 * @param {string} parentName - Parent question name, used to construct companion name
 * @param {string} parentTitle - Parent question title, used in question text
 * @param {number} [gradeValue=0] - Default grade for the companion question
 * @param {object} [options] - Additional options
 * @param {string} [options.customText=''] - Custom question text (overrides default)
 * @param {number} [options.attachments=1] - Number of allowed attachments
 * @returns {string} Complete Moodle Essay question XML string
 */
export function generateCompanionNotesQuestion(parentName, parentTitle, gradeValue = 0, { customText = '', attachments = 1 } = {}) {
    const name = (parentName || 'Question') + '_handwritten_notes';
    const text = customText || defaultCompanionText(parentTitle || parentName);
    const grade = gradeValue ?? 0;
    const attachmentCount = attachments ?? 1;

    const xml = `
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
    <responseformat>noinline</responseformat>
    <responserequired>0</responserequired>
    <responsefieldlines>5</responsefieldlines>
    <minwordlimit></minwordlimit>
    <maxwordlimit></maxwordlimit>
    <attachments>${attachmentCount}</attachments>
    <attachmentsrequired>1</attachmentsrequired>
    <maxbytes>0</maxbytes>
    <filetypeslist>.pdf,.jpg,.jpeg,.png</filetypeslist>
    <graderinfo format="html">
      <text><![CDATA[${graderInfoContent(parentName)}]]></text>
    </graderinfo>
    <responsetemplate format="html">
      <text></text>
    </responsetemplate>
  </question>`;

    // Validate XML well-formedness if DOMParser is available (browser environment)
    if (typeof DOMParser !== 'undefined') {
        try {
            const doc = new DOMParser().parseFromString(xml, 'application/xml');
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                throw new Error('Generated companion question XML is not well-formed: ' + parseError.textContent);
            }
        } catch (e) {
            if (e.message.startsWith('Generated companion')) throw e;
            // DOMParser not fully functional — skip validation
        }
    }

    return xml;
}

function escapeXml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
