interface IProviderIconProps {
    provider: string;
    className?: string;
}
/**
 * Brand mark for a BYOK provider value. Monochrome providers render inside
 * a subtle tile; the Kimi mark carries its own colored tile, and the
 * coding variant adds a small code badge to tell it apart from plain Kimi.
 */
export declare const ProviderIcon: ({ provider, className, }: IProviderIconProps) => import("react").JSX.Element;
export {};
