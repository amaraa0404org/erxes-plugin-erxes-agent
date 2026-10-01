import {
  IconArrowUp,
  IconPaperclip,
  IconPlayerStop,
  IconX,
} from '@tabler/icons-react';
import { Button, Tooltip } from 'erxes-ui';
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import {
  AGENTS_FILE_MAX_BYTES,
  AGENTS_FILE_MAX_PER_TURN,
  AGENTS_FILE_ONLY_TEXT,
  AGENTS_FILE_TEXT_MAX_BYTES,
  AGENTS_FILE_TEXT_TOTAL_MAX_BYTES,
  isAgentsTextMimeType,
  mimeFromFile,
  type IAgentsFileMeta,
} from '../agentsFiles';
import { uploadAgentsFile } from '../uploadAgentsFile';
import { ChatInput } from './ChatInput';

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

export const Composer = ({
  status,
  disabled,
  draftScope,
  onSend,
  onStop,
  pickers,
}: IComposerProps) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<IComposerAttachment[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadsRef = useRef(new Map<string, AbortController>());
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;

  useEffect(() => {
    const uploads = uploadsRef.current;
    setAttachments([]);
    setText('');

    return () => {
      uploads.forEach((controller) => controller.abort());
      uploads.clear();
    };
  }, [draftScope]);

  const isStreaming = status === 'submitted' || status === 'streaming';
  const trimmed = text.trim();
  const hasPending = attachments.some((item) => item.status === 'uploading');
  const hasError = attachments.some((item) => item.status === 'error');
  const readyFiles = attachments
    .map((item) => item.file)
    .filter((file): file is IAgentsFileMeta => file !== undefined);
  const canSend =
    !disabled &&
    !isStreaming &&
    !hasPending &&
    !hasError &&
    (trimmed.length > 0 || readyFiles.length > 0);

  const send = () => {
    if (!canSend) {
      return;
    }

    onSend(trimmed || AGENTS_FILE_ONLY_TEXT, readyFiles);
    attachmentsRef.current = [];
    setText('');
    setAttachments([]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const startUploads = (fileList: FileList | null) => {
    if (disabled || isStreaming || !fileList || fileList.length === 0) {
      return;
    }

    const remaining = AGENTS_FILE_MAX_PER_TURN - attachments.length;
    const picked = Array.from(fileList).slice(0, Math.max(0, remaining));

    if (picked.length === 0) {
      return;
    }

    const readyTextBytes = attachments.reduce(
      (total, item) =>
        total +
        (item.status !== 'error' && isAgentsTextMimeType(item.mimeType)
          ? item.size
          : 0),
      0,
    );
    let incomingTextBytes = 0;
    const drafts: IComposerAttachment[] = picked.map((file) => {
      const mimeType = mimeFromFile(file);
      const textFile = isAgentsTextMimeType(mimeType);
      let error: string | undefined;
      if (file.size > AGENTS_FILE_MAX_BYTES) {
        error = 'File is too large.';
      } else if (textFile && file.size > AGENTS_FILE_TEXT_MAX_BYTES) {
        error =
          'Text attachments must be at most 64 KiB each. Split the file and retry.';
      } else if (
        textFile &&
        readyTextBytes + incomingTextBytes + file.size >
          AGENTS_FILE_TEXT_TOTAL_MAX_BYTES
      ) {
        error =
          'Text attachments must total at most 128 KiB per message. Send fewer files.';
      } else if (textFile) {
        incomingTextBytes += file.size;
      }
      return {
        localId: crypto.randomUUID(),
        name: file.name,
        mimeType,
        size: file.size,
        status: error ? 'error' : 'uploading',
        error,
      };
    });

    setAttachments((current) => [...current, ...drafts]);

    picked.forEach((file, index) => {
      const localId = drafts[index].localId;
      if (drafts[index].status === 'error') {
        return;
      }

      const controller = new AbortController();
      uploadsRef.current.set(localId, controller);

      void uploadAgentsFile(file, { signal: controller.signal })
        .then((uploaded) => {
          if (controller.signal.aborted) {
            return;
          }
          setAttachments((current) =>
            current.map((item) =>
              item.localId === localId
                ? { ...item, status: 'ready', file: uploaded }
                : item,
            ),
          );
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) {
            return;
          }
          setAttachments((current) =>
            current.map((item) =>
              item.localId === localId
                ? {
                    ...item,
                    status: 'error',
                    error:
                      error instanceof Error ? error.message : 'Upload failed.',
                  }
                : item,
            ),
          );
        })
        .finally(() => uploadsRef.current.delete(localId));
    });
  };

  const removeAttachment = (localId: string) => {
    uploadsRef.current.get(localId)?.abort();
    uploadsRef.current.delete(localId);
    setAttachments((current) =>
      current.filter((entry) => entry.localId !== localId),
    );
  };

  return (
    <div className="ea:rounded-[22px] ea:border ea:bg-card ea:shadow-sm ea:transition-colors ea:hover:border-foreground/20">
      {attachments.length > 0 && (
        <ul className="ea:flex ea:flex-wrap ea:gap-1.5 ea:px-3.5 ea:pt-3 ea:sm:px-4">
          {attachments.map((item) => (
            <li
              key={item.localId}
              className="ea:flex ea:max-w-full ea:items-center ea:gap-1 ea:rounded-full ea:border ea:bg-muted/40 ea:px-2 ea:py-0.5 ea:text-[11px]"
            >
              <span className="ea:truncate">{item.name}</span>
              {item.status === 'uploading' && (
                <span className="ea:text-muted-foreground">Uploading…</span>
              )}
              {item.status === 'error' && (
                <span className="ea:text-destructive">{item.error}</span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ea:size-5 ea:rounded-full ea:p-0.5 ea:text-muted-foreground ea:hover:text-foreground"
                onClick={() => removeAttachment(item.localId)}
                aria-label={`Remove ${item.name}`}
              >
                <IconX className="ea:size-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="ea:px-3.5 ea:pt-3 ea:sm:px-4">
        <ChatInput
          value={text}
          onChange={setText}
          onKeyDown={handleKeyDown}
          placeholder="Ask agents…"
          disabled={disabled}
          ariaLabel="Message"
        />
      </div>
      <div className="ea:flex ea:items-center ea:gap-2 ea:px-2.5 ea:pb-2.5 ea:pt-1.5">
        <input
          ref={inputRef}
          type="file"
          className="ea:hidden"
          multiple
          accept=".png,.jpg,.jpeg,.webp,.gif,.txt,.md,.markdown,.csv,.json,.pdf,.docx,.xlsx"
          aria-label="Choose attachments"
          onChange={(event) => {
            startUploads(event.target.files);
            event.target.value = '';
          }}
        />
        <Tooltip.Provider>
          <Tooltip>
            <Tooltip.Trigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ea:size-8 ea:shrink-0 ea:rounded-full"
                disabled={
                  disabled ||
                  isStreaming ||
                  attachments.length >= AGENTS_FILE_MAX_PER_TURN
                }
                onClick={() => inputRef.current?.click()}
                aria-label="Attach files"
              >
                <IconPaperclip className="ea:size-4" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content side="top" className="ea:max-w-xs">
              Up to 5 files, 10 MiB each. AI reads CSV, TXT, Markdown and JSON
              (64 KiB each, 128 KiB total). Other formats are download-only.
            </Tooltip.Content>
          </Tooltip>
        </Tooltip.Provider>
        {pickers && (
          <div className="ea:flex ea:min-w-0 ea:flex-1 ea:items-center ea:gap-2">
            {pickers}
          </div>
        )}
        {isStreaming ? (
          <Button
            variant="outline"
            size="icon"
            className={`ea:size-8 ea:shrink-0 ea:rounded-full ${
              pickers ? '' : 'ea:ml-auto'
            }`}
            onClick={onStop}
            aria-label="Stop generating"
          >
            <IconPlayerStop className="ea:size-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            className={`ea:size-8 ea:shrink-0 ea:rounded-full ${
              pickers ? '' : 'ea:ml-auto'
            }`}
            onClick={send}
            disabled={!canSend}
            aria-label="Send message"
          >
            <IconArrowUp className="ea:size-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
