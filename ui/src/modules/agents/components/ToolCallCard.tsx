import { IconCheck, IconLoader2, IconTool, IconX } from '@tabler/icons-react';
import { Badge, Collapsible, Spinner } from 'erxes-ui';
import { useState } from 'react';

import type { ICallToolInput } from '../types';

/** Normalized view of any tool UI part (live stream or mapped history). */
export interface IToolCallView {
  toolCallId: string;
  toolName: string;
  state: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  approval?: { id: string; approved?: boolean; reason?: string };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/**
 * The agents' executable tool is `callTool`, whose input wraps the real
 * platform tool id and arguments. Surface the inner tool id as the label so
 * the user sees the actual action, not the generic bridge name.
 */
export const describeToolCall = (
  toolName: string,
  input: unknown,
): { label: string; args: unknown } => {
  if (toolName === 'callTool' && isRecord(input)) {
    const callInput = input as ICallToolInput;

    if (typeof callInput.toolId === 'string' && callInput.toolId) {
      return { label: callInput.toolId, args: callInput.input ?? {} };
    }
  }

  return { label: toolName, args: input };
};

const formatJson = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2) ?? '';
  } catch {
    return String(value);
  }
};

const JsonBlock = ({ value }: { value: unknown }) => {
  const text = formatJson(value);

  if (!text || text === '{}' || text === '""') {
    return null;
  }

  return (
    <pre className="ea:mt-1 ea:max-h-48 ea:overflow-auto ea:rounded-md ea:bg-muted ea:p-2 ea:text-xs">
      {text}
    </pre>
  );
};

/**
 * Renders one tool invocation inside an assistant message. Approval states
 * are rendered by `ApprovalPrompt`; this card covers execution states.
 */
export const ToolCallCard = ({ tool }: { tool: IToolCallView }) => {
  const [open, setOpen] = useState(false);
  const { label, args } = describeToolCall(tool.toolName, tool.input);

  const isRunning =
    tool.state === 'input-streaming' || tool.state === 'input-available';
  const isDone = tool.state === 'output-available';
  const isError = tool.state === 'output-error';
  const isDenied = tool.state === 'output-denied';
  const isApproved = tool.state === 'approval-responded';

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="ea:my-1 ea:rounded-md ea:border ea:bg-muted/40 ea:text-foreground">
        <Collapsible.Trigger asChild>
          <button
            type="button"
            className="ea:flex ea:w-full ea:items-center ea:gap-2 ea:px-3 ea:py-2 ea:text-left ea:text-xs"
          >
            {isRunning ? (
              <Spinner className="ea:size-3.5" />
            ) : isError || isDenied ? (
              <IconX className="ea:size-3.5 ea:shrink-0 ea:text-destructive" />
            ) : isDone || isApproved ? (
              <IconCheck className="ea:size-3.5 ea:shrink-0 ea:text-emerald-600" />
            ) : (
              <IconTool className="ea:size-3.5 ea:shrink-0 ea:text-muted-foreground" />
            )}
            <span className="ea:truncate ea:font-medium">{label}</span>
            {isRunning && (
              <span className="ea:ml-auto ea:flex ea:items-center ea:gap-1 ea:text-muted-foreground">
                <IconLoader2 className="ea:size-3 ea:animate-spin" />
              </span>
            )}
            {isDenied && <Badge variant="destructive">Declined</Badge>}
            {isError && <Badge variant="destructive">Failed</Badge>}
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content className="ea:px-3 ea:pb-2">
          <JsonBlock value={args} />
          {isDone && <JsonBlock value={tool.output} />}
          {isError && (
            <p className="ea:mt-1 ea:text-xs ea:text-destructive">
              {tool.errorText ?? 'Tool execution failed.'}
            </p>
          )}
          {isDenied && tool.approval?.reason && (
            <p className="ea:mt-1 ea:text-xs ea:text-muted-foreground">
              {tool.approval.reason}
            </p>
          )}
        </Collapsible.Content>
      </div>
    </Collapsible>
  );
};
