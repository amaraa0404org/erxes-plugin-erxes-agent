import { isTextUIPart, isToolUIPart, type UIMessage } from 'ai';
import { ScrollArea } from 'erxes-ui';
import { Fragment, memo, useEffect, useRef } from 'react';

import { formatAskUserAnswers } from '../askUserAnswers';
import { BloubBot } from './BloubBot';
import {
  hasVisibleParts,
  MessagePartRenderer,
  readMessageAskUserAnswerCard,
} from './MessagePart';

export interface IMessageListProps {
  messages: UIMessage[];
  onRetryArtifact: (title: string) => void;
  status: string;
  loadingThread: boolean;
  approvalBusy: boolean;
  onApprovalRespond: (decision: {
    approvalId: string;
    approved: boolean;
    reason?: string;
  }) => void;
  answerBusy: boolean;
  onAnswer: (answer: string | string[] | (string | string[])[]) => void;
}

/** Show a timestamp divider only after gaps longer than this. */
const TIMESTAMP_GAP_MS = 10 * 60 * 1000;
/** Distance from the bottom (px) that still counts as "near bottom". */
const NEAR_BOTTOM_THRESHOLD = 120;

/**
 * Reads `metadata.createdAt` (present on history messages mapped from the
 * server) as an epoch-ms timestamp. Live-streamed messages carry no
 * metadata; those silently yield `null`.
 */
const getMessageCreatedAt = (message: UIMessage): number | null => {
  const { metadata } = message;

  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  const { createdAt } = metadata as { createdAt?: unknown };

  if (typeof createdAt !== 'string') {
    return null;
  }

  const parsed = new Date(createdAt).getTime();

  return Number.isNaN(parsed) ? null : parsed;
};

const formatTimestamp = (timestamp: number): string =>
  new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Detects whether a message contains a pending ask_user question (an
 * unanswered suspension data part) — the message avatar opens its eyes wide
 * while the assistant waits.
 */
const hasPendingAskUser = (
  message: UIMessage,
  answeredToolCallIds: Set<string>,
): boolean =>
  message.parts.some((part) => {
    if (
      typeof part !== 'object' ||
      part === null ||
      !('type' in part) ||
      (part as { type: string }).type !== 'data-tool-call-suspended'
    ) {
      return false;
    }

    const data = (part as { data?: unknown }).data as {
      toolName?: string;
      toolCallId?: string;
    } | null;

    return (
      data?.toolName === 'askUser' &&
      !!data.toolCallId &&
      !answeredToolCallIds.has(data.toolCallId)
    );
  });

/**
 * Ask_user answers travel through the send pipeline as user messages (the
 * transport reroutes them to the answer endpoint), but they display as the
 * assistant's answered Q&A card — never as a bubble of their own. The send
 * marks them with `metadata.agentsAnswer`.
 */
const isAgentsAnswerTurn = (message: UIMessage): boolean => {
  const { metadata } = message;

  return (
    !!metadata &&
    typeof metadata === 'object' &&
    !Array.isArray(metadata) &&
    (metadata as { agentsAnswer?: unknown }).agentsAnswer === true
  );
};

const getMessageText = (message: UIMessage): string =>
  message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join('');

interface IMessageRowProps {
  message: UIMessage;
  onRetryArtifact: (title: string) => void;
  previousMessage: UIMessage | undefined;
  /** True for the last message while a run is in flight. */
  isStreamingTail: boolean;
  approvalBusy: boolean;
  onApprovalRespond: (decision: {
    approvalId: string;
    approved: boolean;
    reason?: string;
  }) => void;
  answerBusy: boolean;
  onAnswer: (answer: string | string[] | (string | string[])[]) => void;
}

/**
 * One transcript row, memoized so settled rows do not re-render on each
 * streamed delta: the AI SDK keeps settled `UIMessage` object identities
 * stable across updates, and the row's remaining props (stable callbacks
 * from the surfaces above, the immutable previous message, and a streaming
 * flag that only changes on the tail) do not change either.
 */
const MessageRow = memo(
  ({
    message,
    previousMessage,
    isStreamingTail,
    approvalBusy,
    onApprovalRespond,
    answerBusy,
    onAnswer,
    onRetryArtifact,
  }: IMessageRowProps) => {
    if (message.role === 'user' && isAgentsAnswerTurn(message)) {
      return null;
    }

    // Answer turns from before the backend stopped storing them as
    // their own user message have no marker in history. The answered
    // Q&A card on the ask_user assistant message right above already
    // carries the answers, so hide a directly following bubble whose
    // text is exactly what those answers format back to.
    if (
      message.role === 'user' &&
      previousMessage &&
      previousMessage.role === 'assistant'
    ) {
      const answerCard = readMessageAskUserAnswerCard(previousMessage);

      if (
        answerCard &&
        getMessageText(message) === formatAskUserAnswers(answerCard)
      ) {
        return null;
      }
    }

    const createdAt = getMessageCreatedAt(message);
    const previousCreatedAt = previousMessage
      ? getMessageCreatedAt(previousMessage)
      : null;
    const showTimestamp =
      createdAt !== null &&
      previousCreatedAt !== null &&
      createdAt - previousCreatedAt > TIMESTAMP_GAP_MS;

    // Tool calls already resolved (e.g. an answered ask_user): their
    // suspension cards must stop rendering even though the suspension
    // data part stays in the message.
    const answeredToolCallIds = new Set(
      message.parts
        .filter(isToolUIPart)
        .filter(
          (part) =>
            part.state === 'output-available' || part.state === 'output-error',
        )
        .map((part) => part.toolCallId),
    );
    const asking = hasPendingAskUser(message, answeredToolCallIds);
    const partProps = {
      approvalBusy,
      onApprovalRespond,
      answerBusy,
      onAnswer,
      answeredToolCallIds,
      isStreaming: isStreamingTail,
      onRetryArtifact,
    };

    // Fully hide turns with nothing left to show: an assistant message
    // whose only parts are resolved cards (or other hidden tool state)
    // must not leave an empty avatar-only row behind.
    if (
      message.role === 'assistant' &&
      !isStreamingTail &&
      !hasVisibleParts(message.parts, answeredToolCallIds)
    ) {
      return null;
    }

    return (
      <Fragment>
        {showTimestamp && createdAt !== null && (
          <div className="ea:flex ea:justify-center">
            <span className="ea:text-[11px] ea:text-muted-foreground">
              {formatTimestamp(createdAt)}
            </span>
          </div>
        )}
        {message.role === 'user' ? (
          <div className="ea:flex ea:w-full ea:justify-end">
            <div className="ea:max-w-[90%] ea:whitespace-pre-wrap ea:break-words ea:rounded-2xl ea:rounded-br-md ea:bg-primary ea:px-4 ea:py-2.5 ea:text-primary-foreground ea:sm:max-w-[85%]">
              {message.parts.map((part, partIndex) => (
                <MessagePartRenderer
                  key={`${message.id}-${partIndex}`}
                  part={part}
                  role={message.role}
                  {...partProps}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="ea:flex ea:w-full ea:gap-2 ea:sm:gap-3">
            {/* Contextual message avatar:
                - the streaming tail plays the writing state so the live
                  reply reads as the bot writing it;
                - a pending ask_user question opens the eyes wide;
                - every settled message is frozen on one calm frame
                  (`frozenAt={0}`) so finalized rows run no animation
                  loop at all. */}
            <BloubBot
              size={28}
              {...(isStreamingTail
                ? { state: 'writing' as const }
                : asking
                ? { state: 'wide' as const }
                : { frozenAt: 0 })}
              className="ea:mt-0.5 ea:shrink-0"
            />
            <div className="ea:min-w-0 ea:flex-1">
              {message.parts.map((part, partIndex) => (
                <MessagePartRenderer
                  key={`${message.id}-${partIndex}`}
                  part={part}
                  role={message.role}
                  {...partProps}
                />
              ))}
            </div>
          </div>
        )}
      </Fragment>
    );
  },
);

/**
 * Scrollable transcript. Follows the inbox ScrollArea viewport pattern:
 * sticks to the bottom while new content streams in, and pauses auto-scroll
 * as soon as the user scrolls up. The empty state lives in `ChatPanel`, which
 * pairs it with the composer; this component only renders history plus its
 * loading state.
 */
export const MessageList = ({
  messages,
  status,
  loadingThread,
  approvalBusy,
  onApprovalRespond,
  answerBusy,
  onAnswer,
  onRetryArtifact,
}: IMessageListProps) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const nearBottomRef = useRef(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const prevLoadingThreadRef = useRef(loadingThread);

  const lastMessagePartsLength =
    messages[messages.length - 1]?.parts.length ?? 0;

  const handleScroll = () => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    nearBottomRef.current =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <
      NEAR_BOTTOM_THRESHOLD;
  };

  useEffect(() => {
    const wasLoadingThread = prevLoadingThreadRef.current;
    prevLoadingThreadRef.current = loadingThread;

    // A new conversation clears the transcript: re-arm auto-scroll so the
    // first reply lands at the bottom.
    if (messages.length === 0) {
      nearBottomRef.current = true;
      return;
    }

    if (loadingThread) {
      return;
    }

    // After openThread finishes loading history, always jump to the bottom
    // regardless of where the user had scrolled in the previous thread.
    const threadJustLoaded = wasLoadingThread && !loadingThread;

    if (threadJustLoaded) {
      nearBottomRef.current = true;
    }

    if (!nearBottomRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      const viewport = viewportRef.current;

      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [messages.length, lastMessagePartsLength, loadingThread]);

  // Artifact previews resize after load; follow only while the reader is at the bottom.
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    let timer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      if (!nearBottomRef.current) return;
      timer = setTimeout(() => {
        const viewport = viewportRef.current;
        if (viewport && nearBottomRef.current)
          viewport.scrollTop = viewport.scrollHeight;
      }, 0);
    });
    observer.observe(content);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [loadingThread]);

  if (loadingThread) {
    return (
      <div className="ea:flex ea:min-h-0 ea:flex-1 ea:flex-col ea:items-center ea:justify-center ea:gap-2">
        <BloubBot size={48} state="thinking" />
        <p className="ea:text-xs ea:text-muted-foreground">Loading conversation…</p>
      </div>
    );
  }

  return (
    <ScrollArea.Root className="ea:min-h-0 ea:flex-1">
      <ScrollArea.Viewport ref={viewportRef} onScroll={handleScroll}>
        <div
          ref={contentRef}
          className="ea:mx-auto ea:w-full ea:max-w-6xl ea:space-y-4 ea:px-3 ea:py-4 ea:sm:space-y-6 ea:sm:px-6 ea:sm:py-6"
        >
          {messages.map((message, index) => (
            <MessageRow
              key={message.id}
              message={message}
              previousMessage={messages[index - 1]}
              isStreamingTail={
                index === messages.length - 1 &&
                (status === 'streaming' || status === 'submitted')
              }
              approvalBusy={approvalBusy}
              onApprovalRespond={onApprovalRespond}
              answerBusy={answerBusy}
              onAnswer={onAnswer}
              onRetryArtifact={onRetryArtifact}
            />
          ))}
          {status === 'submitted' && (
            <div className="ea:flex ea:w-full ea:gap-2 ea:text-[11px] ea:text-muted-foreground ea:sm:gap-3 ea:sm:text-xs">
              <BloubBot size={24} state="thinking" className="ea:shrink-0" />
              <span className="ea:pt-1">Thinking…</span>
            </div>
          )}
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Bar orientation="vertical" />
    </ScrollArea.Root>
  );
};
