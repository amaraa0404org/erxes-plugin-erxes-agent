/**
 * Memoized so finalized markdown is neither re-repaired nor re-parsed while
 * the streaming tail updates: only a `content` change re-renders it.
 */
export declare const Markdown: import("react").MemoExoticComponent<({ content }: {
    content: string;
}) => import("react").JSX.Element>;
