/**
 * Renders the supported markdown subset onto built-in PDF fonts only
 * (Helvetica/Courier families), so no font asset is fetched at generation
 * time. Returns a Blob for inline preview and download.
 */
export declare const markdownToPdfBlob: (markdown: string) => Promise<Blob>;
