/**
 * Builds a standard, fully editable Word document: every block maps to a
 * native OOXML element (styled headings, real tables, formatted runs) so the
 * generated file opens editable in Word, Google Docs, and Pages.
 */
export declare const markdownToDocxBlob: (markdown: string) => Promise<Blob>;
