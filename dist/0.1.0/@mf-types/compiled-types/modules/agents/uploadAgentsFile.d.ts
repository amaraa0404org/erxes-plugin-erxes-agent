import type { IAgentsFileMeta } from './agentsFiles';
/** Uses the platform `/upload-file` endpoint, same as the rest of erxes. */
export declare const uploadAgentsFile: (file: File, options?: {
    signal?: AbortSignal;
}) => Promise<IAgentsFileMeta>;
