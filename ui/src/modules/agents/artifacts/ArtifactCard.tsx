import {
  IconCheck,
  IconCode,
  IconEye,
  IconCopy,
  IconDownload,
  IconLoader2,
} from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { Suspense, lazy, useEffect, useState } from 'react';

import { parseDelimitedTable } from './converters/csv';
import { downloadBlob } from './download';
import { HtmlPreview } from './HtmlPreview';
import type { IArtifact } from './parseArtifacts';

const SpreadsheetPreview = lazy(() =>
  import('./previews/SpreadsheetPreview').then((m) => ({
    default: m.SpreadsheetPreview,
  })),
);
const DocxPreview = lazy(() =>
  import('./previews/DocxPreview').then((m) => ({ default: m.DocxPreview })),
);
const PdfPreview = lazy(() =>
  import('./previews/PdfPreview').then((m) => ({ default: m.PdfPreview })),
);

const PreviewFallback = () => (
  <div className="ea:flex ea:h-full ea:min-h-[120px] ea:items-center ea:justify-center">
    <IconLoader2 className="ea:size-5 ea:animate-spin ea:text-muted-foreground" />
  </div>
);

interface IArtifactCardProps {
  artifact: IArtifact;
}

export const ArtifactCard = ({ artifact }: IArtifactCardProps) => {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const [documentBlob, setDocumentBlob] = useState<Blob | null>(null);
  const [documentFailed, setDocumentFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const needsDocument = artifact.type === 'docx' || artifact.type === 'pdf';

  useEffect(() => {
    if (!needsDocument) {
      return;
    }

    let cancelled = false;
    setDocumentBlob(null);
    setDocumentFailed(false);

    const generate = async () => {
      try {
        const blob =
          artifact.type === 'docx'
            ? await (
                await import('./converters/docx')
              ).markdownToDocxBlob(artifact.content)
            : await (
                await import('./converters/pdf')
              ).markdownToPdfBlob(artifact.content);

        if (!cancelled) {
          setDocumentBlob(blob);
        }
      } catch {
        if (!cancelled) {
          setDocumentFailed(true);
        }
      }
    };

    generate();

    return () => {
      cancelled = true;
    };
  }, [needsDocument, artifact.type, artifact.content, attempt]);

  const handleCopy = async () => {
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
  };

  const handleDownload = async () => {
    setDownloadBusy(true);
    setDownloadFailed(false);

    try {
      if (artifact.type === 'html') {
        downloadBlob(
          new Blob([artifact.content], { type: 'text/html;charset=utf-8' }),
          artifact.filename,
        );
      } else if (artifact.type === 'xlsx') {
        const rows = parseDelimitedTable(artifact.content).rows;
        const { tableToXlsxBlob } = await import('./converters/xlsx');

        downloadBlob(await tableToXlsxBlob(rows), artifact.filename);
      } else if (documentBlob) {
        downloadBlob(documentBlob, artifact.filename);
      } else {
        setDownloadFailed(true);
      }
    } catch {
      setDownloadFailed(true);
    } finally {
      setDownloadBusy(false);
    }
  };

  const renderPreview = () => {
    if (artifact.type === 'html') {
      return <HtmlPreview html={artifact.content} title={artifact.title} />;
    }

    if (artifact.type === 'xlsx') {
      return (
        <Suspense fallback={<PreviewFallback />}>
          <SpreadsheetPreview content={artifact.content} />
        </Suspense>
      );
    }

    if (documentFailed) {
      return (
        <div className="ea:flex ea:h-full ea:min-h-[120px] ea:flex-col ea:items-center ea:justify-center ea:gap-2 ea:rounded-md ea:border ea:border-dashed ea:p-6">
          <p className="ea:text-sm ea:text-muted-foreground">
            Preview could not be generated.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry
          </Button>
        </div>
      );
    }

    if (!documentBlob) {
      return <PreviewFallback />;
    }

    return (
      <Suspense fallback={<PreviewFallback />}>
        {artifact.type === 'docx' ? (
          <DocxPreview blob={documentBlob} />
        ) : (
          <PdfPreview blob={documentBlob} />
        )}
      </Suspense>
    );
  };

  return (
    <div
      className={
        artifact.type === 'html'
          ? 'ea:min-w-0'
          : 'ea:overflow-hidden ea:rounded-xl ea:border'
      }
    >
      <div className="ea:mb-2 ea:flex ea:items-center ea:justify-between ea:gap-2 ea:py-1 ea:text-muted-foreground">
        <span className="ea:truncate ea:text-xs ea:font-medium" title={artifact.title}>
          {artifact.title}
        </span>
        <div className="ea:flex ea:shrink-0 ea:items-center">
          {artifact.type === 'html' && (
            <Button
              variant="ghost"
              size="sm"
              className="ea:h-7 ea:gap-1.5 ea:px-2 ea:text-xs"
              onClick={() => setShowSource((value) => !value)}
              aria-pressed={showSource}
              aria-label={showSource ? 'Show preview' : 'View source'}
            >
              {showSource ? (
                <IconEye className="ea:size-3.5" />
              ) : (
                <IconCode className="ea:size-3.5" />
              )}
              {showSource ? 'Preview' : 'Source'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            title="Copy source"
            aria-label={copied ? 'Source copied' : 'Copy source'}
            className="ea:size-7"
          >
            {copied ? (
              <IconCheck className="ea:size-3.5 ea:text-emerald-600" />
            ) : (
              <IconCopy className="ea:size-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            disabled={downloadBusy || (needsDocument && !documentBlob)}
            title="Download"
            aria-label="Download artifact"
            className="ea:size-7"
          >
            {downloadBusy ? (
              <IconLoader2 className="ea:size-3.5 ea:animate-spin" />
            ) : (
              <IconDownload className="ea:size-3.5" />
            )}
          </Button>
        </div>
      </div>
      <div
        className={
          artifact.type === 'xlsx' || artifact.type === 'html'
            ? ''
            : 'ea:h-[320px] ea:sm:h-[380px]'
        }
      >
        {showSource ? (
          <pre className="ea:max-h-[32rem] ea:overflow-auto ea:rounded-lg ea:bg-muted/40 ea:p-4 ea:text-xs ea:leading-relaxed">
            <code>{artifact.content}</code>
          </pre>
        ) : (
          renderPreview()
        )}
      </div>
      {copyFailed && (
        <p role="alert" className="ea:px-1 ea:py-2 ea:text-xs ea:text-destructive">
          Could not copy source. Please try again.
        </p>
      )}
      {downloadFailed && (
        <p className="ea:px-3 ea:pb-2 ea:text-xs ea:text-destructive">
          Download failed — please try again.
        </p>
      )}
    </div>
  );
};
