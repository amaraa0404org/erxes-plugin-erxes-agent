import { type IToolCallView } from './ToolCallCard';
export interface IApprovalPromptProps {
    tool: IToolCallView;
    busy: boolean;
    onRespond: (decision: {
        approved: boolean;
        reason?: string;
    }) => void;
}
/**
 * Inline confirmation for a destructive tool call. The run is suspended
 * server-side until the user decides; approving or declining records the
 * decision on the tool part, and the framework automatically resumes the run
 * through the transport's approval endpoint.
 */
export declare const ApprovalPrompt: ({ tool, busy, onRespond }: IApprovalPromptProps) => import("react").JSX.Element;
