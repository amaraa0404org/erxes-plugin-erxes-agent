export declare const MIN_PREVIEW_HEIGHT = 120;
export declare const MAX_PREVIEW_HEIGHT = 12000;
/** The sender must also match the mounted iframe's contentWindow. */
export declare const readPreviewHeight: (data: unknown, channel: string) => number | null;
/** Policy precedes all model content; the opaque iframe can only report size. */
export declare const buildSandboxedSrcDoc: (html: string, channel?: string) => string;
