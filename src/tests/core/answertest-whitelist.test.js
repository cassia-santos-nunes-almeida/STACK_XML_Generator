// A1/X2 — canonical answertest names + one-rule-data-source conformance.
// The whitelist lives ONCE in src/core/stack-rules.json; the skill reference
// table (synced from my-claude-skills) is the upstream source of truth and
// this suite fails loudly if the two ever drift.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import STACK_RULES from '../../core/stack-rules.json';
import { ANSWER_TESTS } from '../../core/constants.js';
import { generateStackXML } from '../../generators/xml-generator.js';
import { TEMPLATES } from '../../templates/index.js';

const SKILL_REF = resolve(
    process.cwd(),
    '.claude/skills/stack-xml-generator/references/answer-tests-and-inputs.md'
);

function skillWhitelist() {
    const md = readFileSync(SKILL_REF, 'utf8');
    // Scope strictly to the §11 canonical table (the invalid-names table
    // below it also uses backticked first columns).
    const start = md.indexOf('## §11');
    const end = md.indexOf('### Known-invalid', start);
    const section = md.slice(start, end);
    const names = [...section.matchAll(/^\|\s*`([A-Za-z]+)`\s*\|/gm)].map(m => m[1]);
    return names;
}

describe('X2: stack-rules.json is the one rule-data source', () => {
    it('whitelist matches the synced skill §11 table exactly (41 names)', () => {
        const fromSkill = skillWhitelist();
        expect(fromSkill.length).toBe(41);
        expect([...STACK_RULES.answerTests].sort()).toEqual([...fromSkill].sort());
    });

    it('every ANSWER_TESTS constant is a whitelisted canonical name', () => {
        const whitelist = new Set(STACK_RULES.answerTests);
        for (const [key, name] of Object.entries(ANSWER_TESTS)) {
            expect(whitelist.has(name), `ANSWER_TESTS.${key} = "${name}" not in whitelist`).toBe(true);
        }
    });

    it('legacy alias targets are all whitelisted canonical names', () => {
        const whitelist = new Set(STACK_RULES.answerTests);
        for (const [legacy, canonical] of Object.entries(STACK_RULES.legacyAliases)) {
            expect(whitelist.has(canonical), `alias ${legacy} -> ${canonical} not canonical`).toBe(true);
        }
    });
});

describe('A1: every template export uses only whitelisted answertests', () => {
    const whitelist = new Set(STACK_RULES.answerTests);

    for (const [key, tpl] of Object.entries(TEMPLATES)) {
        if (!tpl.parts || tpl.parts.length === 0) continue; // blank template
        it(`template "${key}" emits only canonical answertest names`, () => {
            const xml = generateStackXML(tpl);
            const tests = [...xml.matchAll(/<answertest>([^<]*)<\/answertest>/g)].map(m => m[1]);
            expect(tests.length).toBeGreaterThan(0);
            for (const t of tests) {
                expect(whitelist.has(t), `"${t}" not in v4.9.1 whitelist`).toBe(true);
                expect(t).not.toMatch(/^AT/);
            }
        });
    }
});
