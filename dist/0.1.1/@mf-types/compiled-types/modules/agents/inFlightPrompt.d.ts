import type { UIMessage } from 'ai';
/** Uses the existing prompt sessionStorage key; legacy values are plain text. */
export declare const encodeInFlightPrompt: (parts: UIMessage["parts"]) => string;
export declare const decodeInFlightPrompt: (raw: string) => UIMessage["parts"];
/** True when a stored user message is the same in-flight prompt, including files. */
export declare const inFlightPromptMatches: (inFlight: UIMessage["parts"], message: Pick<UIMessage, "role" | "parts">) => boolean;
