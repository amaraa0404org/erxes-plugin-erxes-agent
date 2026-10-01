import { IconCheck, IconX } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { useState } from 'react';

import { BloubBot } from './BloubBot';
import { ChatInput } from './ChatInput';
import { describeToolCall, type IToolCallView } from './ToolCallCard';

export interface IApprovalPromptProps {
  tool: IToolCallView;
  busy: boolean;
  onRespond: (decision: { approved: boolean; reason?: string }) => void;
}

/**
 * Inline confirmation for a destructive tool call. The run is suspended
 * server-side until the user decides; approving or declining records the
 * decision on the tool part, and the framework automatically resumes the run
 * through the transport's approval endpoint.
 */
export const ApprovalPrompt = ({ tool, busy, onRespond }: IApprovalPromptProps) => {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const { label, args } = describeToolCall(tool.toolName, tool.input);

  const argsText = (() => {
    try {
      const text = JSON.stringify(args, null, 2);
      return text && text !== '{}' ? text : null;
    } catch {
      return null;
    }
  })();

  return (
    <div className="ea:my-1 ea:rounded-xl ea:border ea:bg-destructive/5 ea:p-3 ea:text-foreground">
      <div className="ea:flex ea:items-start ea:gap-2">
        {/* The bot raises its "!" state: the run is held until you decide. */}
        <BloubBot size={32} state="alert" className="ea:-mt-1 ea:shrink-0" />
        <div className="ea:min-w-0 ea:flex-1">
          <p className="ea:text-sm ea:font-medium">Confirm this action</p>
          <p className="ea:mt-0.5 ea:break-all ea:text-xs ea:font-semibold">
            {label}
          </p>
          {argsText && (
            <pre className="ea:mt-1 ea:max-h-40 ea:overflow-auto ea:rounded-md ea:bg-black/5 ea:p-2 ea:text-xs ea:dark:bg-white/10">
              {argsText}
            </pre>
          )}

          {declining ? (
            <div className="ea:mt-2 ea:space-y-2">
              <div className="ea:rounded-lg ea:border ea:bg-card ea:px-3 ea:py-2">
                <ChatInput
                  value={reason}
                  onChange={setReason}
                  placeholder="Optional reason (shared with the assistant)"
                  disabled={busy}
                  maxHeight={96}
                  className="ea:text-xs ea:md:text-xs"
                  ariaLabel="Decline reason"
                />
              </div>
              <div className="ea:flex ea:gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={() =>
                    onRespond({
                      approved: false,
                      reason: reason.trim() || undefined,
                    })
                  }
                >
                  <IconX />
                  Decline
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setDeclining(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="ea:mt-2 ea:flex ea:gap-2">
              <Button
                size="sm"
                disabled={busy}
                onClick={() => onRespond({ approved: true })}
              >
                <IconCheck />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => setDeclining(true)}
              >
                <IconX />
                Decline
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
