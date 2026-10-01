import { cn } from 'erxes-ui';
import { memo, useMemo } from 'react';
import remarkGfm from 'remark-gfm';
import ReactMarkdown, { type Components } from 'react-markdown';

import { repairTables } from './markdownRepair';

/**
 * Wide markdown tables scroll sideways inside the transcript instead of
 * squashing every column into a phone width; a table narrower than the column
 * still fills it (`min-w-full`). The horizontal scroll is contained so a
 * fling at the edge of a table does not start navigating the transcript.
 */
const COMPONENTS: Components = {
  table: ({ children, className }) => (
    <div className="ea:my-2 ea:overflow-x-auto ea:overscroll-x-contain">
      <table className={cn('ea:w-max ea:min-w-full ea:text-xs', className)}>
        {children}
      </table>
    </div>
  ),
};

/**
 * Renders assistant text as markdown. LLM output routinely contains lists,
 * code, and emphasis; plain text rendering would mangle it. Styled through
 * element selectors because the workspace does not include the Tailwind
 * typography plugin.
 *
 * `remark-gfm` is what makes pipe tables render at all — without it the
 * parser is CommonMark-only and the rows show as literal `|` text. The
 * `repairTables` pre-pass normalizes the malformed tables the assistant
 * occasionally emits (missing separator row, several rows collapsed onto
 * one line); well-formed tables and non-table content pass through
 * untouched.
 */
const MarkdownBase = ({ content }: { content: string }) => {
  // The table-repair pass is the only per-render work; memoize it so a
  // settled message (unchanging `content`) is never re-repaired.
  const repaired = useMemo(() => repairTables(content), [content]);

  return (
    <div
      className={[
        'ea:max-w-none ea:break-words ea:text-[13px] ea:leading-relaxed ea:md:text-sm ea:md:leading-6',
        'ea:space-y-2',
        'ea:[&_strong]:font-semibold',
        'ea:[&_blockquote]:border-l-2 ea:[&_blockquote]:border-muted-foreground/40 ea:[&_blockquote]:pl-3 ea:[&_blockquote]:italic ea:[&_blockquote]:text-muted-foreground',
        'ea:[&_hr]:my-4 ea:[&_hr]:border-border',
        'ea:[&_ul]:list-disc ea:[&_ul]:pl-5 ea:[&_ol]:list-decimal ea:[&_ol]:pl-5',
        'ea:sm:[&_ul]:space-y-1 ea:sm:[&_ol]:space-y-1',
        'ea:[&_h1]:my-2 ea:[&_h1]:text-base ea:[&_h1]:font-semibold ea:md:[&_h1]:text-lg',
        'ea:[&_h2]:my-2 ea:[&_h2]:text-base ea:[&_h2]:font-semibold ea:md:[&_h2]:text-lg',
        'ea:[&_h3]:my-1.5 ea:[&_h3]:text-sm ea:[&_h3]:font-semibold ea:md:[&_h3]:text-base',
        'ea:[&_pre]:my-2 ea:[&_pre]:overflow-x-auto ea:[&_pre]:whitespace-pre-wrap ea:[&_pre]:break-words ea:[&_pre]:rounded-lg ea:[&_pre]:border ea:[&_pre]:bg-muted/60 ea:[&_pre]:p-3 ea:[&_pre]:text-xs ea:md:[&_pre]:text-[13px]',
        'ea:[&_pre_code]:bg-transparent ea:[&_pre_code]:p-0 ea:[&_pre_code]:font-mono',
        'ea:[&_code]:rounded-md ea:[&_code]:bg-muted ea:[&_code]:px-1.5 ea:[&_code]:py-0.5 ea:[&_code]:text-xs ea:[&_code]:font-mono',
        'ea:[&_a]:text-primary ea:[&_a]:underline-offset-2 ea:hover:[&_a]:underline',
        'ea:[&_th]:border-b ea:[&_th]:py-1.5 ea:[&_th]:pr-3 ea:[&_th]:text-left ea:[&_th]:font-medium',
        'ea:[&_td]:border-b ea:[&_td]:py-1.5 ea:[&_td]:pr-3',
      ].join(' ')}
    >
      <ReactMarkdown components={COMPONENTS} remarkPlugins={[remarkGfm]}>
        {repaired}
      </ReactMarkdown>
    </div>
  );
};

/**
 * Memoized so finalized markdown is neither re-repaired nor re-parsed while
 * the streaming tail updates: only a `content` change re-renders it.
 */
export const Markdown = memo(MarkdownBase);
