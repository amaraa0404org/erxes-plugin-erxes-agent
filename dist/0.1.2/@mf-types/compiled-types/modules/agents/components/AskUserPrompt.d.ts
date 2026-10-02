import type { IAskUserAnswerEntry } from '../askUserAnswers';
export interface IAskUserQuestionEntry {
    question: string;
    options?: {
        label: string;
        description?: string;
    }[];
    selectionMode?: 'single_select' | 'multi_select';
}
export interface IAskUserQuestionGroup {
    questions: IAskUserQuestionEntry[];
}
export interface IAskUserPromptProps {
    group: IAskUserQuestionGroup;
    busy: boolean;
    onAnswer: (answer: string | string[] | (string | string[])[]) => void;
}
/** Choices and custom answers share one explicit submission path. */
export declare const AskUserPrompt: ({ group, busy, onAnswer, }: IAskUserPromptProps) => import("react").JSX.Element;
/** Compact persisted summary replaces the active form after submission. */
export declare const AskUserAnswered: ({ answers, }: {
    answers: IAskUserAnswerEntry[];
}) => import("react").JSX.Element;
