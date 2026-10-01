import { IconChevronDown } from '@tabler/icons-react';
import {
  isDataUIPart,
  isReasoningUIPart,
  isTextUIPart,
  isToolUIPart,
} from 'ai';
import type { UIMessage } from 'ai';
import { Collapsible } from 'erxes-ui';
import { useState } from 'react';

import { ApprovalPrompt } from './ApprovalPrompt';
import {
  AskUserAnswered,
  AskUserPrompt,
  type IAskUserQuestionGroup,
} from './AskUserPrompt';
import {
  readAskUserAnswers,
  readAskUserQuestionsFromInput,
  type IAskUserAnswerEntry,
} from '../askUserAnswers';
import { MessageContent } from '../artifacts/MessageContent';
import {
  AGENTS_FILES_DATA_TYPE,
  agentsFilesNotice,
  readAgentsFilesPart,
} from '../agentsFiles';
import { AttachedFiles } from './AttachedFiles';
import type { IToolCallView } from './ToolCallCard';

type MessagePart = UIMessage['parts'][number];

const ReasoningPart = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);

  if (!text) {
    return null;
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className="ea:inline-flex ea:items-center ea:gap-1.5 ea:text-xs ea:text-muted-foreground ea:transition-colors ea:hover:text-foreground"
        >
          <IconChevronDown
            className={`ea:size-3.5 ea:transition-transform ${
              open ? 'ea:rotate-180' : ''
            }`}
          />
          {open ? 'Hide reasoning' : 'Show reasoning'}
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <p className="ea:mt-1.5 ea:whitespace-pre-wrap ea:rounded-lg ea:border ea:border-dashed ea:bg-muted/30 ea:p-2.5 ea:text-[13px] ea:text-muted-foreground">
          {text}
        </p>
      </Collapsible.Content>
    </Collapsible>
  );
};

export interface IMessagePartRendererProps {
  part: MessagePart;
  role: UIMessage['role'];
  /** True while the approval decision is being submitted. */
  approvalBusy: boolean;
  onApprovalRespond: (decision: {
    approvalId: string;
    approved: boolean;
    reason?: string;
  }) => void;
  /** True while an ask_user answer is being submitted. */
  answerBusy: boolean;
  onAnswer: (answer: string | string[] | (string | string[])[]) => void;
  /** Tool calls already resolved somewhere in the message. */
  answeredToolCallIds: Set<string>;
  isStreaming?: boolean;
  onRetryArtifact?: (title: string) => void;
}

/**
 * Extracts the ask_user questions from a `data-tool-call-suspended` data
 * part emitted by the backend when the ask_user tool suspends. The payload
 * carries a `questions` batch (the plugin's multi-question tool); a legacy
 * single-question payload is normalized into a one-entry group. Returns
 * null for every other suspension or a malformed payload.
 */
const readAskUserQuestions = (
  part: MessagePart,
): IAskUserQuestionGroup | null => {
  if (!isDataUIPart(part)) {
    return null;
  }

  const typed = part as { type: string; data?: unknown };

  if (typed.type !== 'data-tool-call-suspended') {
    return null;
  }

  const data = typed.data as {
    toolName?: string;
    toolCallId?: string;
    suspendPayload?: {
      questions?: unknown;
      question?: unknown;
      options?: unknown;
      selectionMode?: unknown;
    };
  } | null;

  if (data?.toolName !== 'askUser') {
    return null;
  }

  if (!data.suspendPayload) {
    return null;
  }

  const questions = readAskUserQuestionsFromInput(data.suspendPayload);

  return questions.length ? { questions } : null;
};

/**
 * Extracts the answered Q&A pairs from an askUser tool part in its
 * `output-available` state — the settled card that replaces the suspension
 * prompt and survives reloads (the questions live in the tool input, the
 * answers in the tool result). Returns null for every other tool or an
 * unparseable result.
 */
const readAskUserAnswerCard = (
  part: MessagePart,
): IAskUserAnswerEntry[] | null => {
  if (!isToolUIPart(part) || part.state !== 'output-available') {
    return null;
  }

  const toolName =
    'toolName' in part ? part.toolName : part.type.slice('tool-'.length);

  if (!/^ask_?user$/i.test(toolName)) {
    return null;
  }

  const questions = readAskUserQuestionsFromInput(part.input);

  if (!questions.length) {
    return null;
  }

  return readAskUserAnswers(
    questions,
    'output' in part ? part.output : undefined,
  );
};

/**
 * Message-level variant: the answered Q&A pairs of the message's settled
 * askUser tool part, or null when there is none. The transcript uses this to
 * detect the ask_user turn a following answer bubble belongs to.
 */
export const readMessageAskUserAnswerCard = (
  message: UIMessage,
): IAskUserAnswerEntry[] | null => {
  for (const part of message.parts) {
    const card = readAskUserAnswerCard(part);

    if (card) {
      return card;
    }
  }

  return null;
};

/**
 * Whether an assistant message renders anything at all: text, reasoning, an
 * approval prompt, an unanswered ask_user card, or an answered ask_user
 * Q&A card. The transcript skips messages without any of these so answered
 * interruptions never leave empty avatar-only rows behind.
 */
export const hasVisibleParts = (
  parts: MessagePart[],
  answeredToolCallIds: Set<string>,
): boolean =>
  parts.some((part) => {
    if (isTextUIPart(part)) {
      return part.text.trim().length > 0;
    }

    if (isReasoningUIPart(part)) {
      return part.text.trim().length > 0;
    }

    if (isToolUIPart(part)) {
      return (
        part.state === 'approval-requested' ||
        readAskUserAnswerCard(part) !== null
      );
    }

    if (isDataUIPart(part)) {
      if (part.type === AGENTS_FILES_DATA_TYPE) {
        return readAgentsFilesPart(part).length > 0;
      }

      const typed = part as {
        type: string;
        data?: { toolName?: string; toolCallId?: string };
      };

      return (
        typed.type === 'data-tool-call-suspended' &&
        typed.data?.toolName === 'askUser' &&
        !!typed.data.toolCallId &&
        !answeredToolCallIds.has(typed.data.toolCallId)
      );
    }

    return false;
  });

/**
 * Renders one UIMessage part according to its type. Tool parts surface the
 * destructive-action approval prompt and the settled ask_user Q&A card;
 * data parts surface the pending ask_user questions; all other tool states
 * stay hidden in the transcript.
 */
export const MessagePartRenderer = ({
  part,
  role,
  approvalBusy,
  onApprovalRespond,
  answerBusy,
  onAnswer,
  answeredToolCallIds,
  isStreaming = false,
  onRetryArtifact,
}: IMessagePartRendererProps) => {
  if (isTextUIPart(part)) {
    if (role === 'user') {
      return (
        <p className="ea:whitespace-pre-wrap ea:break-words ea:text-[13px] ea:leading-relaxed ea:md:text-sm ea:md:leading-6">
          {part.text}
        </p>
      );
    }

    return (
      <MessageContent
        content={part.text}
        isStreaming={isStreaming && part.state !== 'done'}
        retryDisabled={approvalBusy}
        onRetryArtifact={onRetryArtifact}
      />
    );
  }

  if (isReasoningUIPart(part)) {
    return <ReasoningPart text={part.text} />;
  }

  if (isToolUIPart(part)) {
    // A resolved ask_user call renders the answered Q&A card — it replaces
    // the suspension prompt and keeps the answer visible after reloads.
    const answerCard = readAskUserAnswerCard(part);

    if (answerCard) {
      return <AskUserAnswered answers={answerCard} />;
    }

    if (part.state !== 'approval-requested') {
      return null;
    }

    const tool: IToolCallView = {
      toolCallId: part.toolCallId,
      toolName:
        'toolName' in part ? part.toolName : part.type.slice('tool-'.length),
      state: part.state,
      input: part.input,
      output: 'output' in part ? part.output : undefined,
      errorText: 'errorText' in part ? part.errorText : undefined,
      approval: part.approval,
    };

    return (
      <ApprovalPrompt
        tool={tool}
        busy={approvalBusy}
        onRespond={({ approved, reason }) =>
          onApprovalRespond({
            approvalId: part.approval.id,
            approved,
            reason,
          })
        }
      />
    );
  }

  // Data parts: the ask_user suspension carries the questions the assistant
  // asked; approval suspensions' metadata is already surfaced by the tool
  // part above. Everything else stays hidden. An answered suspension's data
  // part stays in the message, so the card is dropped once its tool call is
  // resolved.
  if (isDataUIPart(part)) {
    if (part.type === AGENTS_FILES_DATA_TYPE) {
      const files = readAgentsFilesPart(part);

      if (files.length === 0) {
        return null;
      }

      return <AttachedFiles files={files} notice={agentsFilesNotice(part)} />;
    }

    const group = readAskUserQuestions(part);

    if (!group) {
      return null;
    }

    const typed = part as { data?: { toolCallId?: string } };

    if (
      typed.data?.toolCallId &&
      answeredToolCallIds.has(typed.data.toolCallId)
    ) {
      return null;
    }

    return (
      <AskUserPrompt
        key={typed.data?.toolCallId ?? JSON.stringify(group.questions)}
        group={group}
        busy={answerBusy}
        onAnswer={onAnswer}
      />
    );
  }

  return null;
};
