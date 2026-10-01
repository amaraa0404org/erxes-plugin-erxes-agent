import { useEffect, useRef, useState } from 'react';

interface IDocxPreviewProps {
  blob: Blob;
}

export const DocxPreview = ({ blob }: IDocxPreviewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);

    const render = async () => {
      const { renderAsync } = await import('docx-preview');

      try {
        if (cancelled || !containerRef.current) {
          return;
        }

        containerRef.current.innerHTML = '';
        await renderAsync(blob, containerRef.current, undefined, {
          inWrapper: false,
        });
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [blob]);

  return (
    <div className="ea:h-full ea:overflow-auto ea:rounded-lg ea:border ea:bg-white">
      <div className="ea:p-6">
        {failed ? (
          <p className="ea:py-10 ea:text-center ea:text-sm ea:text-muted-foreground">
            Preview unavailable — use Download to open the file.
          </p>
        ) : (
          <div ref={containerRef} className="docx-preview-host" />
        )}
      </div>
    </div>
  );
};
