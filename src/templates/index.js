// Template registry — exports all templates as a single object
import { ENGINEERING_TEMPLATES } from './engineering.js';
import { PHYSICS_TEMPLATES } from './physics.js';
import { MATHS_TEMPLATES } from './maths.js';
import { GENERAL_TEMPLATES } from './general.js';

export const TEMPLATES = {
    // General
    ...GENERAL_TEMPLATES,
    // Engineering
    ...ENGINEERING_TEMPLATES,
    // Physics
    ...PHYSICS_TEMPLATES,
    // Mathematics
    ...MATHS_TEMPLATES,
};
