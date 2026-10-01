import { memo, useMemo } from 'react';
import { IconFileDescription, IconLoader2 } from '@tabler/icons-react';
import { Button } from 'erxes-ui';

import { ArtifactCard } from './ArtifactCard';
import { splitArtifacts } from './parseArtifacts';
import { Markdown } from '../components/Markdown';

interface IMessageContentProps {
  content: string;
  isStreaming?: boolean;
  retryDisabled?: boolean;
  onRetryArtifact?: (title: string) => void;
}

const MessageContentBase = ({
  content,
  isStreaming = false,
  retryDisabled = false,
  onRetryArtifact,
}: IMessageContentProps) => {
  const segments = useMemo(() => splitArtifacts(content), [content]);
  const only = segments[0];

  if (segments.length === 1 && only?.kind === 'text') {
    return <Markdown content={only.text} />;
  }

  return (
    <div className="ea:flex ea:flex-col ea:gap-3">
      {segments.map((segment, index) =>
        segment.kind === 'text' ? (
          segment.text ? (
            <Markdown key={index} content={segment.text} />
          ) : null
        ) : !segment.artifact.complete ? (
          <div
            key={index}
            className="ea:flex ea:min-h-32 ea:items-center ea:gap-4 ea:rounded-xl ea:bg-muted/30 ea:px-5 ea:py-6"
            role="status"
            aria-live="polite"
          >
            <div className="ea:flex ea:size-10 ea:shrink-0 ea:items-center ea:justify-center ea:rounded-xl ea:bg-background ea:text-primary">
              {isStreaming ? (
                <IconLoader2 className="ea:size-5 ea:motion-safe:animate-spin" />
              ) : (
                <IconFileDescription className="ea:size-5" />
              )}
            </div>
            <div className="ea:min-w-0 ea:flex-1 ea:space-y-1">
              <p className="ea:truncate ea:text-sm ea:font-medium">
                {segment.artifact.title}
              </p>
              <p className="ea:text-xs ea:text-muted-foreground">
                {isStreaming
                  ? 'Creating your artifact… The preview will appear here.'
                  : 'Generation stopped before this artifact was complete.'}
              </p>
              {!isStreaming && onRetryArtifact && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ea:-ml-2 ea:mt-1 ea:h-7 ea:text-xs"
                  disabled={retryDisabled}
                  onClick={() => onRetryArtifact(segment.artifact.title)}
                >
                  Generate again
                </Button>
              )}
            </div>
          </div>
        ) : (
          <ArtifactCard key={index} artifact={segment.artifact} />
        ),
      )}
    </div>
  );
};

export const MessageContent = memo(MessageContentBase);
