interface ISpreadsheetPreviewProps {
    content: string;
}
/**
 * Renders delimited-text (CSV/TSV/SV) artifact content as a read-only HTML
 * table. The CSV parser is the same one the download path uses, so what the
 * user sees matches what they get when they hit Download.
 *
 * Replaces an earlier Univer-based editor that rendered as an empty grid
 * whenever its heavy async bundle failed to mount — the lighter preview
 * either shows the data or an explicit empty state, so a blank card no
 * longer looks like a silent failure.
 */
export declare const SpreadsheetPreview: ({ content }: ISpreadsheetPreviewProps) => import("react").JSX.Element;
export {};
