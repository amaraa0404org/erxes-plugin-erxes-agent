import { IconDownload, IconPaperclip } from '@tabler/icons-react';
import { Button, Spinner, readImage } from 'erxes-ui';
import { useState } from 'react';

import type { IAgentsFileMeta } from '../agentsFiles';

const Attachment = ({ file }: { file: IAgentsFileMeta }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const openFile = (): void => {
    window.open(readImage(file.url), '_blank', 'noopener,noreferrer');
  };

  if (file.type.startsWith('image/') && !failed) {
    return (
      <Button
        type="button"
        variant="ghost"
        aria-label={`Open ${file.name}`}
        title={file.name}
        className="ea:relative ea:h-auto ea:w-64 ea:max-w-full ea:overflow-hidden ea:rounded-lg ea:p-0"
        onClick={openFile}
      >
        {!loaded && (
          <span
            role="status"
            aria-label="Loading image"
            className="ea:absolute ea:inset-0 ea:flex ea:items-center ea:justify-center"
          >
            <Spinner />
          </span>
        )}
        <img
          src={readImage(file.url)}
          alt={file.name}
          loading="lazy"
          className={`ea:block ea:max-h-72 ea:w-full ea:object-contain ${loaded ? '' : 'ea:min-h-32 ea:opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      title={failed ? 'Image preview unavailable. Open the original file.' : undefined}
      className="ea:h-auto ea:inline-flex ea:max-w-full ea:items-center ea:gap-1.5 ea:rounded-full ea:border ea:bg-muted/40 ea:px-2.5 ea:py-1 ea:text-[12px] ea:hover:bg-muted"
      onClick={openFile}
    >
      <IconPaperclip className="ea:size-3.5 ea:shrink-0" />
      <span className="ea:truncate">{file.name}</span>
      <IconDownload className="ea:size-3.5 ea:shrink-0" />
    </Button>
  );
};

export const AttachedFiles = ({
  files,
  notice,
}: {
  files: IAgentsFileMeta[];
  notice: string;
}) => (
  <div className="ea:mt-1.5 ea:space-y-1">
    <ul className="ea:flex ea:flex-col ea:gap-1">
      {files.map((file) => (
        <li key={file.url}>
          <Attachment file={file} />
        </li>
      ))}
    </ul>
    {notice ? (
      <p className="ea:text-[11px] ea:text-muted-foreground">{notice}</p>
    ) : null}
  </div>
);
