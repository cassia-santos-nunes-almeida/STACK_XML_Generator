// @vitest-environment jsdom
// Phase-3 walkthrough: the grading tolerances are RELATIVE by default
// (0.05 = 5% of the correct answer, A11 house Rule 3), but the UI showed a
// bare "Tolerance: 0.05" — a teacher wanting "within half a second" would
// type 0.5 and silently get 50% relative tolerance. The grading section now
// (a) says what the number means in the current mode, and (b) lets the
// teacher switch between relative and fixed-± tolerances (tolType was
// already supported end-to-end by the generators and the importer; the UI
// just never exposed it).
import { describe, it, expect } from 'vitest';
import { renderParts } from '../../ui/render-parts.js';
import { DEFAULT_GRADING } from '../../core/constants.js';

const numericalPart = (grading) => ({
    id: 1,
    type: 'numerical',
    text: 'Part a:',
    answer: 'ans1',
    teacherAnswer: 'ta1',
    grading,
    options: [],
    feedback: {},
    prerequisite: null,
});

function render(grading) {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const calls = [];
    const handlers = {
        onGrading: (...args) => calls.push(args),
        onGradingBatch: () => {},
        onUpdatePart: () => {},
        onDeletePart: () => {},
        onFeedback: () => {},
    };
    renderParts(container, [numericalPart(grading)], [], handlers);
    return { container, calls };
}

describe('grading tolerance disclosure (teacher walkthrough)', () => {
    it('relative mode says the value is a fraction of the correct answer', () => {
        const { container } = render({ ...DEFAULT_GRADING });
        const text = container.querySelector('.grading-section').textContent;
        expect(text).toContain('15% of the correct answer'); // wideTol 0.15
        expect(text).toContain('5% of the correct answer');  // tightTol 0.05
    });

    it('absolute mode says the value is a fixed ± amount', () => {
        const { container } = render({ ...DEFAULT_GRADING, tolType: 'absolute', tightTol: 0.5, wideTol: 2 });
        const text = container.querySelector('.grading-section').textContent;
        expect(text).toMatch(/±\s*0\.5/);
        expect(text).toMatch(/±\s*2/);
        expect(text).not.toContain('% of the correct answer');
    });

    it('exposes a tolerance-mode selector reflecting the current mode', () => {
        const rel = render({ ...DEFAULT_GRADING });
        expect(rel.container.querySelector('.g-tol-type').value).toBe('relative');

        const abs = render({ ...DEFAULT_GRADING, tolType: 'absolute' });
        expect(abs.container.querySelector('.g-tol-type').value).toBe('absolute');
    });

    it('changing the mode selector updates grading.tolType', () => {
        const { container, calls } = render({ ...DEFAULT_GRADING });
        const select = container.querySelector('.g-tol-type');
        select.value = 'absolute';
        select.dispatchEvent(new Event('change'));
        expect(calls).toContainEqual([0, 'tolType', 'absolute']);
    });

    it('renders tolerance 0 as 0, not as the fallback default (Exact preset)', () => {
        const { container } = render({ ...DEFAULT_GRADING, tolType: 'absolute', tightTol: 0, wideTol: 0 });
        expect(container.querySelector('.g-tight-tol').value).toBe('0');
        expect(container.querySelector('.g-wide-tol').value).toBe('0');
    });
});
