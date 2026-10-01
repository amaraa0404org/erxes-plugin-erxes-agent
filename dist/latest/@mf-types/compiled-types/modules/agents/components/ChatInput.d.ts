import { type KeyboardEvent } from 'react';
export interface IChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    disabled?: boolean;
    /** Height (px) the field grows to before it scrolls internally. */
    maxHeight?: number;
    ariaLabel?: string;
    className?: string;
}
/**
 * Auto-growing chat input, deliberately NOT `erxes-ui`'s `Textarea`.
 *
 * The shared textarea ships a focus shadow and a fixed height, which in a chat
 * composer produced a bright focus ring inside the composer card plus native
 * scrollbar arrows on a one-line field. This one is chrome-free: it owns no
 * border, no ring and no background (the composer card draws those), and it is
 * exactly as tall as its content — the scrollbar only appears once the text
 * passes `maxHeight`.
 */
export declare const ChatInput: ({ value, onChange, onKeyDown, placeholder, disabled, maxHeight, ariaLabel, className, }: IChatInputProps) => import("react").JSX.Element;
