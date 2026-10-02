import { type ReactNode } from 'react';
import { type IAgentsFileMeta } from '../agentsFiles';
export interface IComposerAttachment {
    localId: string;
    name: string;
    mimeType: string;
    size: number;
    status: 'uploading' | 'ready' | 'error';
    error?: string;
    file?: IAgentsFileMeta;
}
export interface IComposerProps {
    status: string;
    disabled: boolean;
    draftScope?: string;
    onSend: (text: string, files: IAgentsFileMeta[]) => void;
    onStop: () => void;
    pickers?: ReactNode;
}
export declare const Composer: ({ status, disabled, draftScope, onSend, onStop, pickers, }: IComposerProps) => import("react").JSX.Element;
