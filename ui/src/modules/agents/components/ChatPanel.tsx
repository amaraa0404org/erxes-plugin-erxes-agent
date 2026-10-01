import { IconAlertCircle, IconX } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { useCallback } from 'react';

import { CALM_FACE_CYCLE } from '../botCycles';
import { useAgentsConnection } from '../hooks/useAgentsConnection';
import { useAgentsModels } from '../hooks/useAgentsModels';
import type { IUseAgentsChatResult } from '../hooks/useAgentsChat';
import { BloubBot } from './BloubBot';
import { agentsFilesPart } from '../agentsFiles';
import { Composer } from './Composer';
import { modelSelectionValue, ModelPicker } from './ModelPicker';
import { MessageList } from './MessageList';
import { ThinkingPicker } from './ThinkingPicker';

/** Starter prompts offered on the empty state. */
const SUGGESTIONS = [
  'Summarize my open deals',
  'Draft a follow-up email',
  'Show overdue tasks',
  'Search my contacts',
];

/** Extracts a readable message from a transport error (JSON or plain). */
const describeError = (error: Error): string => {
  try {
    const parsed = JSON.parse(error.message) as { error?: string };
    if (typeof parsed.error === 'string' && parsed.error) {
      return parsed.error;
    }
  } catch {
    // Not a JSON body; use the raw message.
  }

  return error.message || 'Something went wrong.';
};

export interface IChatPanelProps {
  chat: IUseAgentsChatResult;
  /** Optional class for the panel root. */
  className?: string;
}

/**
 * Complete agents chat surface: transcript, approval prompts, composer, and
 * error feedback. The owning page or widget holds the `useAgentsChat` hook
 * so it can also drive thread controls from the same instance.
 *
 * Two layouts share one composer:
 * - empty state: hero (animated bot + starters) and the composer centered
 *   together as a single block, so a fresh conversation reads as one focal
 *   point instead of a floating hero with a docked bar;
 * - conversation: transcript fills the panel with the composer docked below.
 *
 * Key management lives exclusively in the plugin settings; this panel never
 * gates chatting on connection state — the connections query is display-only,
 * feeding the model picker's Auto label with the actual default model.
 */
export const ChatPanel = ({ chat, className }: IChatPanelProps) => {
  const {
    messages,
    status,
    error,
    loadingThread,
    threadId,
    sendMessage,
    addToolApprovalResponse,
    stop,
    clearError,
    answerBusy,
    submitAnswer,
    canReconnect,
    resumeStream,
  } = chat;

  const { connections } = useAgentsConnection();
  const models = useAgentsModels();

  // The server default (Auto) runs the first configured provider's stored
  // model; showing it keeps the default from being hidden.
  const autoModel = connections[0]?.model;

  const isStreaming = status === 'submitted' || status === 'streaming';
  const isEmpty = messages.length === 0 && !loadingThread;

  // Stable identity so the memoized transcript rows skip re-renders while
  // the streaming tail updates.
  const handleApprovalRespond = useCallback(
    ({
      approvalId,
      approved,
      reason,
    }: {
      approvalId: string;
      approved: boolean;
      reason?: string;
    }) => addToolApprovalResponse({ id: approvalId, approved, reason }),
    [addToolApprovalResponse],
  );

  const handleRetryArtifact = useCallback(
    (title: string) => {
      sendMessage({
        text: `Please regenerate the incomplete artifact "${title}" as one complete artifact, including all content and the closing fence. Keep styles concise so it fits in one response.`,
      });
    },
    [sendMessage],
  );

  const errorBanner = error ? (
    <div className="ea:flex ea:items-start ea:gap-2 ea:border-b ea:border-destructive/30 ea:bg-destructive/10 ea:px-3 ea:py-2 ea:text-[13px] ea:text-destructive ea:sm:text-sm">
      <IconAlertCircle className="ea:mt-0.5 ea:size-4 ea:shrink-0" />
      <p className="ea:min-w-0 ea:flex-1 ea:break-words">{describeError(error)}</p>
      {canReconnect && (
        <Button
          variant="ghost"
          size="sm"
          className="ea:h-7 ea:shrink-0 ea:text-xs"
          onClick={() => void resumeStream()}
        >
          Reconnect
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="ea:size-6 ea:shrink-0"
        onClick={clearError}
        aria-label="Dismiss error"
      >
        <IconX className="ea:size-3.5" />
      </Button>
    </div>
  ) : null;

  const pickers = (
    <>
      <ModelPicker
        models={models}
        value={modelSelectionValue(chat.modelProvider, chat.modelId)}
        autoModel={autoModel}
        onChange={(value) => {
          if (!value) {
            chat.selectModel('', '');
            return;
          }

          const separatorIndex = value.indexOf('|');

          if (separatorIndex === -1) {
            return;
          }

          chat.selectModel(
            value.slice(0, separatorIndex),
            value.slice(separatorIndex + 1),
          );
        }}
      />
      <ThinkingPicker
        value={chat.thinkingLevel}
        onChange={chat.selectThinkingLevel}
      />
    </>
  );

  const composer = (
    <Composer
      status={status}
      disabled={loadingThread}
      draftScope={threadId ?? 'new'}
      onSend={(text, files) => {
        if (files.length > 0) {
          void sendMessage({
            parts: [{ type: 'text', text }, agentsFilesPart(files)],
          });
          return;
        }

        void sendMessage({ text });
      }}
      onStop={stop}
      pickers={pickers}
    />
  );

  if (isEmpty) {
    return (
      <div className={`ea:flex ea:h-full ea:min-h-0 ea:flex-1 ea:flex-col ${className ?? ''}`}>
        {errorBanner}
        {/* Scroll-safe centering: centers when there is room, scrolls when the
            container is short (narrow side panel, mobile, split screens). */}
        <div className="ea:min-h-0 ea:flex-1 ea:overflow-y-auto">
          <div className="ea:mx-auto ea:flex ea:min-h-full ea:w-full ea:max-w-xl ea:flex-col ea:items-center ea:justify-center ea:gap-5 ea:px-4 ea:py-6 ea:sm:gap-6 ea:sm:py-8 ea:sm:max-w-2xl">
            <div className="ea:flex ea:flex-col ea:items-center ea:gap-3 ea:text-center ea:sm:gap-4">
              {/* Scaled down on short/narrow viewports so the hero never
                  pushes the composer out of the panel. */}
              <BloubBot
                size={104}
                cycle={CALM_FACE_CYCLE}
                className="ea:size-20 ea:sm:size-24 ea:md:size-[104px]"
              />
              <div className="ea:space-y-1">
                <h2 className="ea:text-base ea:font-semibold ea:md:text-lg">
                  How can I help you today?
                </h2>
                <p className="ea:text-xs ea:text-muted-foreground">
                  Ask anything about your erxes workspace
                </p>
              </div>
            </div>
            <div className="ea:w-full">{composer}</div>
            <div className="ea:flex ea:flex-wrap ea:justify-center ea:gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendMessage({ text: suggestion })}
                  className="ea:rounded-full ea:border ea:bg-card ea:px-3 ea:py-1.5 ea:text-xs ea:text-muted-foreground ea:shadow-sm ea:transition-colors ea:hover:border-foreground/20 ea:hover:text-foreground ea:sm:text-[13px]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ea:flex ea:h-full ea:min-h-0 ea:flex-1 ea:flex-col ${className ?? ''}`}>
      {errorBanner}
      <MessageList
        messages={messages}
        status={status}
        loadingThread={loadingThread}
        approvalBusy={isStreaming}
        onApprovalRespond={handleApprovalRespond}
        answerBusy={answerBusy || isStreaming}
        onAnswer={submitAnswer}
        onRetryArtifact={handleRetryArtifact}
      />
      {/* `pb` keeps the composer clear of the iOS home indicator without
          adding dead space on every other device. */}
      <div className="ea:bg-background/80 ea:pb-[max(0.75rem,env(safe-area-inset-bottom))] ea:pt-1 ea:backdrop-blur">
        <div className="ea:mx-auto ea:w-full ea:max-w-6xl ea:px-3 ea:sm:px-6">{composer}</div>
      </div>
    </div>
  );
};
