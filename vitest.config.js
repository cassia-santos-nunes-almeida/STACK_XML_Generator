import { defineConfig } from 'vitest/config';
import StatusReporter from './scripts/vitest-status-reporter.js';

export default defineConfig({
    test: {
        reporters: ['default', new StatusReporter()],
    },
});
