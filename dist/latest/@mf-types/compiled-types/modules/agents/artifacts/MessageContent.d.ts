interface IMessageContentProps {
    content: string;
    isStreaming?: boolean;
    retryDisabled?: boolean;
    onRetryArtifact?: (title: string) => void;
}
export declare const MessageContent: import("react").MemoExoticComponent<({ content, isStreaming, retryDisabled, onRetryArtifact, }: IMessageContentProps) => import("react").JSX.Element>;
export {};
