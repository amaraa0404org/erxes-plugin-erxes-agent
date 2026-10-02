import type { IUseAgentsChatResult } from '../hooks/useAgentsChat';
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
export declare const ChatPanel: ({ chat, className }: IChatPanelProps) => import("react").JSX.Element;
