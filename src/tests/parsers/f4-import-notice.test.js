// @vitest-environment jsdom
// Premortem F4: importing a foreign STACK question whose PRT this editor
// cannot represent used to replace its grading logic SILENTLY on re-export
// (partial credit and custom feedbackvariables vanished, zero notices).
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseStackXML } from '../../parsers/xml-parser.js';
import { generateStackXML } from '../../generators/xml-generator.js';
import { TEMPLATES } from '../../templates/index.js';

const goldenDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'golden');

// A hand-authored question with a 2-node partial-credit PRT (0.5 for
// right-shape-wrong-constant via custom feedbackvariables) — the exact
// premortem exp2 P5 shape.
const FOREIGN_PARTIAL_CREDIT = `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="stack">
    <name><text>Foreign partial credit</text></name>
    <questiontext format="html">
      <text><![CDATA[<p>Integrate.</p>
<div class="stack-part"><p><strong>(a)</strong> Your answer:</p><div>[[input:ans1]]</div><div>[[validation:ans1]]</div></div>]]></text>
    </questiontext>
    <generalfeedback format="html"><text></text></generalfeedback>
    <defaultgrade>1</defaultgrade>
    <penalty>0.1</penalty>
    <hidden>0</hidden>
    <stackversion><text>2025040100</text></stackversion>
    <questionvariables>
      <text><![CDATA[ta1: x^2 + c;]]></text>
    </questionvariables>
    <specificfeedback format="html"><text><![CDATA[[[feedback:prt1]]]]></text></specificfeedback>
    <questionnote format="html"><text><![CDATA[ans1={@ta1@}]]></text></questionnote>
    <input>
      <name>ans1</name>
      <type>algebraic</type>
      <tans>ta1</tans>
      <boxsize>15</boxsize>
    </input>
    <prt>
      <name>prt1</name>
      <value>1.0000000</value>
      <autosimplify>1</autosimplify>
      <feedbackvariables>
        <text><![CDATA[missing_const: is(freeof(c, ans1));]]></text>
      </feedbackvariables>
      <node>
        <name>0</name>
        <answertest>AlgEquiv</answertest>
        <sans>ans1</sans>
        <tans>ta1</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>=</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>prt1-0-T</trueanswernote>
        <truefeedback format="html"><text></text></truefeedback>
        <falsescoremode>=</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>1</falsenextnode>
        <falseanswernote>prt1-0-F</falseanswernote>
        <falsefeedback format="html"><text></text></falsefeedback>
      </node>
      <node>
        <name>1</name>
        <answertest>AlgEquiv</answertest>
        <sans>missing_const</sans>
        <tans>true</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>=</truescoremode>
        <truescore>0.5</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>prt1-1-T</trueanswernote>
        <truefeedback format="html"><text><![CDATA[Almost — check the constant of integration.]]></text></truefeedback>
        <falsescoremode>=</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>prt1-1-F</falseanswernote>
        <falsefeedback format="html"><text></text></falsefeedback>
      </node>
    </prt>
  </question>
</quiz>`;

describe('foreign-PRT import notices (F4)', () => {
    it('a partial-credit PRT the editor cannot represent raises a rebuild notice', () => {
        const state = parseStackXML(FOREIGN_PARTIAL_CREDIT);
        expect(state.importNotices).toBeTruthy();
        const hit = state.importNotices.find(n => /Part \(a\).*REBUILT/s.test(n));
        expect(hit).toBeTruthy();
    });

    it('the app\'s own exports import with no rebuild notice (all templates)', () => {
        Object.entries(TEMPLATES).forEach(([key, tpl]) => {
            const state = parseStackXML(generateStackXML(tpl));
            const rebuilds = (state.importNotices || []).filter(n => /REBUILT/.test(n));
            expect(rebuilds, `${key} false rebuild notice`).toEqual([]);
        });
    });

    it('all committed golden fixtures import with no rebuild notice', () => {
        readdirSync(goldenDir).filter(f => f.endsWith('.xml')).forEach(f => {
            const state = parseStackXML(readFileSync(join(goldenDir, f), 'utf-8'));
            const rebuilds = (state.importNotices || []).filter(n => /REBUILT/.test(n));
            expect(rebuilds, `${f} false rebuild notice`).toEqual([]);
        });
    });
});
