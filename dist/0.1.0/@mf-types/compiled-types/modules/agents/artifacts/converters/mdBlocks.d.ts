export interface IMdInline {
    text: string;
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    href?: string;
}
export type MdBlock = {
    type: 'heading';
    level: number;
    inlines: IMdInline[];
} | {
    type: 'paragraph';
    inlines: IMdInline[];
} | {
    type: 'list';
    ordered: boolean;
    items: IMdInline[][];
} | {
    type: 'code';
    text: string;
} | {
    type: 'quote';
    inlines: IMdInline[];
} | {
    type: 'table';
    header: string[];
    rows: string[][];
} | {
    type: 'hr';
};
export declare const parseInline: (text: string) => IMdInline[];
/**
 * Line-based parser for the markdown subset the artifact conventions teach:
 * headings, paragraphs, ordered/unordered lists, fenced and indented code,
 * blockquotes, pipe tables, and thematic breaks. Inline runs support bold,
 * italic, code spans, and links. Unknown or malformed lines degrade to
 * paragraph text.
 */
export declare const parseMarkdownBlocks: (markdown: string) => MdBlock[];
