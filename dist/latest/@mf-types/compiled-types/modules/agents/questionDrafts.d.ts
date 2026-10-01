import type { IAskUserQuestionEntry } from './components/AskUserPrompt';
/** Preserve custom text alongside selected options using the existing answer contract. */
export declare const buildQuestionAnswer: (question: IAskUserQuestionEntry, selected: string[], draft: string) => string | string[];
export declare const hasQuestionAnswer: (answer: string | string[]) => boolean;
