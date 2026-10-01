/**
 * Settings BYOK management: every configured provider is listed with its
 * stored entry, and more providers can be added side by side — pick a
 * provider, paste the API key, save. The model is chosen server-side by the
 * provider default (overridable from the chat's model picker), so there is
 * no model field here. The backend never returns stored keys.
 */
export declare const SettingsConnectionPage: () => import("react").JSX.Element;
