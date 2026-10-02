import type { IAskUserQuestionEntry } from './components/AskUserPrompt';
/** One answered question, ready for the transcript card. */
export interface IAskUserAnswerEntry {
    question: string;
    answer: string;
}
/**
 * Normalizes the askUser tool input into a question list: the batched
 * `questions` array, or the legacy single `question` object used by older
 * suspensions. Malformed entries are skipped; questions without text never
 * render.
 */
export declare const readAskUserQuestionsFromInput: (input: unknown) => IAskUserQuestionEntry[];
/**
 * Builds the tool-result content the backend's ask_user tool would persist
 * for the same answers — the transcript's answered card parses both forms,
 * so the live optimistic state must mirror the stored shape exactly.
 */
export declare const buildAskUserResult: (questions: IAskUserQuestionEntry[], answer: string | string[] | (string | string[])[]) => {
    content: string;
    isError: false;
    answers: (string | string[])[];
};
/**
 * Formats parsed answers back into the exact text legacy threads stored as
 * the answer's own user message: a multi-select answer is already joined
 * with ', ' at parse time, and questions are separated with ' · '. The
 * transcript compares this against a following user bubble to hide that
 * stored duplicate.
 */
export declare const formatAskUserAnswers: (answers: IAskUserAnswerEntry[]) => string;
/**
 * Pairs the askUser questions (from the tool input) with the user's answers
 * (from the tool result) for the answered transcript card. Accepts either
 * the structured `answers` array of the live optimistic patch or the stored
 * `content` text the backend persists (`User answered:\n<q>: <a>` lines, or
 * the legacy single-line `User answered: <answer>`). Returns null when
 * nothing parseable is there — the caller then hides the card instead of
 * rendering garbage.
 */
export declare const readAskUserAnswers: (questions: IAskUserQuestionEntry[], output: unknown) => IAskUserAnswerEntry[] | null;
