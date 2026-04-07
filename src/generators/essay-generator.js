// Generates a companion Moodle Essay question for handwritten working uploads
// Field names and structure verified against real Moodle 4.5 Essay XML export

/**
 * Returns the default student instruction text for the companion question.
 * @param {string} questionName - The parent STACK question name
 * @returns {string}
 */
export function defaultEssayText(questionName) {
    const name = questionName || 'this question';
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
 * @param {string} questionName - The parent STACK question name
 * @returns {string}
 */
function graderInfoContent(questionName) {
    const name = questionName || 'the parent question';
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
 * Generates a Moodle Essay question XML block.
 * This is a standard Moodle essay (not STACK) appended after the STACK question
 * inside the same <quiz> wrapper so both import together.
 *
 * Field names verified against real Moodle 4.5 Essay XML export.
 *
 * @param {object} data - Full question data object
 * @returns {string} Essay question XML, or empty string if essay is disabled
 */
export function generateEssayQuestion(data) {
    if (!data.essayEnabled) return '';

    const name = (data.name || 'Question') + '_handwritten_notes';
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
    <responseformat>noinline</responseformat>
    <responserequired>0</responserequired>
    <responsefieldlines>5</responsefieldlines>
    <minwordlimit></minwordlimit>
    <maxwordlimit></maxwordlimit>
    <attachments>${attachments}</attachments>
    <attachmentsrequired>1</attachmentsrequired>
    <maxbytes>0</maxbytes>
    <filetypeslist>.pdf,.jpg,.jpeg,.png</filetypeslist>
    <graderinfo format="html">
      <text><![CDATA[${graderInfoContent(data.name)}]]></text>
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
