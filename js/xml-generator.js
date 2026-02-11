
export function generateStackXML(data) {
    // Standard XML escape for text nodes (NOT for CDATA)
    const escape = (str) => {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&apos;');
    };

    // Formatter for CDATA content (Question Text)
    const formatForCDATA = (str) => {
        if (!str) return '';
        let formatted = str.replace(/\$([^$]+)\$/g, '\\($1\\)');
        return formatted;
    };

    // Helper to wrap content in CDATA safely
    const cdata = (content) => {
        if (!content) return '';
        return `<![CDATA[${content}]]>`;
    };

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="stack">
    <name><text>${escape(data.name)}</text></name>
    <questiontext format="html">
      <text><![CDATA[${formatForCDATA(data.questionText)}
      
      ${data.images.length > 0 ? '<div class="stack-images" style="display:none">' : ''}
      ${data.images.map(img => `<file name="${img.name}" encoding="base64">${img.data.split(',')[1]}</file>`).join('')}
      ${data.images.length > 0 ? '</div>' : ''}

      ${data.parts.map(p => {
          let partContent = `<div class="stack-part">`;
          partContent += `<p><strong>(${String.fromCharCode(96 + p.id)})</strong> ${formatForCDATA(p.text)}</p>`;
          
          if (p.type === 'jsxgraph') {
               partContent += `<div class="jsxgraph-box">
[[jsxgraph input-ref-${p.answer}="${p.answer}Ref"]]
${p.graphCode}
[[/jsxgraph]]
</div>
<p style="display:none">[[input:${p.answer}]] [[validation:${p.answer}]]</p>`;
          } else {
               partContent += `<div>[[input:${p.answer}]] [[validation:${p.answer}]]</div>`;
          }
          
          partContent += `</div>`;
          return partContent;
      }).join("\n\n")}
      ]]></text>
      ${data.images.map(img => `<file name="${img.name}" encoding="base64">${img.data.split(',')[1]}</file>`).join('\n')}
    </questiontext>
    
    <generalfeedback format="html"><text></text></generalfeedback>
    <defaultgrade>${data.parts.length}</defaultgrade>
    <penalty>0.1</penalty>
    <hidden>0</hidden>

    <questionvariables>
      <text>${cdata(data.variables.map(v => `${v.name}: ${v.value};`).join('\n'))}</text>
    </questionvariables>
    `;

    // Generate Inputs (Parts)
    data.parts.forEach(p => {
        let inputType = p.type;
        let modelAnswer = p.answer; 
        let extraOptions = "";
        
        if (p.type === 'jsxgraph') {
            inputType = 'algebraic';
        }
        else if (p.type === 'radio') {
             inputType = 'radio';
             const correctOpt = p.options.find(o => o.correct);
             modelAnswer = correctOpt ? correctOpt.value : "";
             const optString = `[${p.options.map(o => `"${o.value.replace(/"/g, '\\"')}"`).join(', ')}]`;
             extraOptions = `<options>${escape(optString)}</options>`;
        }

        xml += `
    <input>
      <name>${p.answer}</name>
      <type>${inputType}</type>
      <tans>${modelAnswer}</tans>
      <boxsize>15</boxsize>
      <strictsyntax>1</strictsyntax>
      ${extraOptions}
    </input>
        `;
    });

    // Generate PRTs (Grading)
    data.parts.forEach(p => {
        const prtName = `prt${p.id}`; 
        
        let prtBody = "";
        
        if (p.type === 'jsxgraph') {
            prtBody = `
      <feedbackvariables>
        <text>${cdata(p.gradingCode || 'all_correct: true;')}</text>
      </feedbackvariables>
      <node>
        <name>0</name>
        <answertest>AlgEquiv</answertest>
        <sans>all_correct</sans>
        <tans>true</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>=</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>${prtName}-1-T</trueanswernote>
        <truefeedback format="html"><text>Correct!</text></truefeedback>
        <falsescoremode>=</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${prtName}-1-F</falseanswernote>
        <falsefeedback format="html"><text>Incorrect. Please check your points.</text></falsefeedback>
      </node>
            `;
        } 
        else if (p.type === 'numerical') {
            prtBody = `
      <node>
        <name>0</name>
        <answertest>ATNumAbs</answertest>
        <sans>${p.answer}</sans>
        <tans>${p.answer}</tans>
        <testoptions>${p.grading.wideTol}</testoptions>
        <quiet>0</quiet>
        <truescoremode>=</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>1</truenextnode>
        <trueanswernote>${prtName}-0-T</trueanswernote>
        <falsescoremode>=</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${prtName}-0-F</falseanswernote>
      </node>
      <node>
        <name>1</name>
        <answertest>ATNumAbs</answertest>
        <sans>${p.answer}</sans>
        <tans>${p.answer}</tans>
        <testoptions>${p.grading.tightTol}</testoptions>
        <quiet>0</quiet>
        <truescoremode>=</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>${p.grading.checkSigFigs ? '2' : '-1'}</truenextnode>
        <trueanswernote>${prtName}-1-T</trueanswernote>
        <truefeedback format="html"><text>Correct!</text></truefeedback>
        <falsescoremode>=</falsescoremode>
        <falsescore>0.5</falsescore>
        <falsepenalty>0.1</falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${prtName}-1-F</falseanswernote>
        <falsefeedback format="html"><text>Close, but check accuracy.</text></falsefeedback>
      </node>
      `;
      
            if (p.grading.checkSigFigs) {
                prtBody += `
      <node>
        <name>2</name>
        <answertest>ATNumSigFigs</answertest>
        <sans>${p.answer}</sans>
        <tans>${p.answer}</tans>
        <testoptions>${p.grading.sigFigs}</testoptions>
        <quiet>0</quiet>
        <truescoremode>+</truescoremode>
        <truescore>0</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>${prtName}-2-T</trueanswernote>
        <falsescoremode>-</falsescoremode>
        <falsescore>${p.grading.penalty}</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${prtName}-2-F</falseanswernote>
        <falsefeedback format="html"><text>Check significant figures.</text></falsefeedback>
      </node>
                `;
            }
        } 
        else if (p.type === 'radio') {
             const correctOpt = p.options.find(o => o.correct);
             const correctVal = correctOpt ? correctOpt.value : "NaN";
             
             prtBody = `
      <node>
        <name>0</name>
        <answertest>AlgEquiv</answertest>
        <sans>${p.answer}</sans>
        <tans>${escape('"' + correctVal.replace(/"/g, '\\"') + '"')}</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>=</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>${prtName}-0-T</trueanswernote>
        <truefeedback format="html"><text>Correct!</text></truefeedback>
        <falsescoremode>=</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${prtName}-0-F</falseanswernote>
        <falsefeedback format="html"><text>Incorrect.</text></falsefeedback>
      </node>
             `;
        } 
        else {
             prtBody = `
      <node>
        <name>0</name>
        <answertest>AlgEquiv</answertest>
        <sans>${p.answer}</sans>
        <tans>${p.answer}</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>=</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>${prtName}-0-T</trueanswernote>
        <truefeedback format="html"><text>Correct!</text></truefeedback>
        <falsescoremode>=</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${prtName}-0-F</falseanswernote>
        <falsefeedback format="html"><text>Incorrect.</text></falsefeedback>
      </node>
             `;
        }

        xml += `
    <prt>
      <name>${prtName}</name>
      <value>1.0000000</value>
      <autosimplify>1</autosimplify>
      ${prtBody}
    </prt>
        `;
    });

    xml += `
  </question>
</quiz>`;

    return xml;
}
