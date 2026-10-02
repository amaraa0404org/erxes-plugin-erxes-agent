export type ArtifactType = 'html' | 'xlsx' | 'docx' | 'pdf';
export declare const ARTIFACT_TYPES: readonly ArtifactType[];
export interface IArtifact {
    type: ArtifactType;
    /** Display title; never empty (falls back to a labeled default). */
    title: string;
    /** Ready-to-use download filename with the correct extension. */
    filename: string;
    /** Raw fence body, verbatim except CRLF normalization. */
    content: string;
    /** False when generation ended before the closing fence/document. */
    complete: boolean;
}
export type MessageSegment = {
    kind: 'text';
    text: string;
} | {
    kind: 'artifact';
    artifact: IArtifact;
};
/** Split prose and recognized artifacts without exposing unfinished source. */
export declare const splitArtifacts: (text: string) => MessageSegment[];
