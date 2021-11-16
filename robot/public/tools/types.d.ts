import {Page} from 'playwright';

export interface debug {
    /**
     * Capture optionally named debug buffers to store on demand
     * @param {string} [name]
     */
     (name?: string): undefined;
}

export interface matchPattern {
    /**
     * Match exact pattern shape by selector and expected contents \
     * Throw error specified in pattern on pattern match (optional)
     * @param {Page} page
     * @param {Array<patternShape>} pattern
     * @returns {Promise<patternShape|undefined>} patternMatch
     */
    (page: Page, pattern: Array<patternShape>): Promise<patternShape|undefined>;
}

export interface iteratePatterns {
    /**
     * Iteratively match all provided patterns until a match is found \
     * Optionally process the patterns in a custom order of execution
     * @param {Page} page
     * @param {Object.<pattern>} patterns
     * @param {Array<patternType>|undefined} [patternOrder]
     * @returns {Promise<string|undefined>} patternType
     */
    (page: Page, patterns: Object, patternOrder: Array<patternType>|undefined): Promise<string|undefined>;
}

export type pattern = [patternShape];
export type patternType = string;

export interface patternShape {
    // TODO returns Error
    getError: getError,
    selector: string,
    contents: Array<string> | string
}

type getError = {
    (): Error;
}
