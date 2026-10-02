export type CsvDelimiter = ',' | '\t' | ';';
export interface IParsedTable {
    rows: string[][];
    delimiter: CsvDelimiter;
}
/**
 * RFC4180-style delimited-text parser for artifact fences: quoted fields,
 * doubled-quote escapes, delimiters and newlines inside quotes, and both LF
 * and CRLF input. Delimiter (comma, tab, or semicolon) is detected from the
 * first line.
 */
export declare const parseDelimitedTable: (content: string) => IParsedTable;
/** Numeric cells become numbers so downstream writers can type them. */
export declare const coerceCell: (value: string) => string | number;
