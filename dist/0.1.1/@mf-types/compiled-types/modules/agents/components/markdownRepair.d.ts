/**
 * Normalizes broken pipe-table inputs in assistant markdown text. Returns
 * the input unchanged when no candidate table block is found. Used as a
 * pre-pass before `react-markdown` (with `remark-gfm`) so the transcript
 * can render pipe grids the assistant emitted without a separator row or
 * with several rows collapsed onto one line.
 */
export declare const repairTables: (markdown: string) => string;
