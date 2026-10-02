import type { UIMessage } from 'ai';
export declare const AGENTS_FILES_DATA_TYPE = "data-agents-files";
export declare const AGENTS_FILE_MAX_BYTES: number;
export declare const AGENTS_FILE_MAX_PER_TURN = 5;
export declare const AGENTS_FILE_TEXT_MAX_BYTES: number;
export declare const AGENTS_FILE_TEXT_TOTAL_MAX_BYTES: number;
export declare const AGENTS_FILE_ONLY_TEXT = "Uploaded files";
export declare const AGENTS_TEXT_MIME_TYPES: readonly ["text/plain", "text/markdown", "text/csv", "application/json"];
export interface IAgentsFileMeta {
    name: string;
    url: string;
    type: string;
    size: number;
}
export declare const mimeFromFile: (file: Pick<File, "name" | "type">) => string;
export declare const isAgentsTextMimeType: (mimeType: string) => boolean;
export declare const isAgentsFileMeta: (file: unknown) => file is IAgentsFileMeta;
export declare const readAgentsFilesPart: (part: UIMessage["parts"][number]) => IAgentsFileMeta[];
export declare const agentsFilesPart: (files: IAgentsFileMeta[]) => UIMessage["parts"][number];
export declare const agentsFilesNotice: (part: UIMessage["parts"][number]) => string;
export declare const agentsFilesDisplayText: (parts: UIMessage["parts"]) => string | undefined;
