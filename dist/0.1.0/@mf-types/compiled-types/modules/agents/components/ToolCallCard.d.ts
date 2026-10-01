/** Normalized view of any tool UI part (live stream or mapped history). */
export interface IToolCallView {
    toolCallId: string;
    toolName: string;
    state: string;
    input?: unknown;
    output?: unknown;
    errorText?: string;
    approval?: {
        id: string;
        approved?: boolean;
        reason?: string;
    };
}
/**
 * The agents' executable tool is `callTool`, whose input wraps the real
 * platform tool id and arguments. Surface the inner tool id as the label so
 * the user sees the actual action, not the generic bridge name.
 */
export declare const describeToolCall: (toolName: string, input: unknown) => {
    label: string;
    args: unknown;
};
/**
 * Renders one tool invocation inside an assistant message. Approval states
 * are rendered by `ApprovalPrompt`; this card covers execution states.
 */
export declare const ToolCallCard: ({ tool }: {
    tool: IToolCallView;
}) => import("react").JSX.Element;
