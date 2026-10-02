export declare const TAU: number;
export declare const clamp: (v: number, lo?: number, hi?: number) => number;
export declare const lerp: (a: number, b: number, t: number) => number;
export type Easing = (t: number) => number;
/**
 * Mesure sur la video : les transitions sont des ease-out exponentiels, sans
 * depassement du corps. Les seuls effets de ressort sont locaux (le pop de la
 * pastille de notification, l'ouverture des yeux) et sont ecrits directement
 * dans l'etat concerne.
 */
export declare const easings: {
    easeOutCubic: (t: number) => number;
    easeInOutCubic: (t: number) => number;
    easeOutQuint: (t: number) => number;
};
/** Bruit 1D periodique : boucle sans couture sur `period`, utile pour la derive du regard. */
export declare function loopNoise(t: number, period: number, seed?: number): number;
/** PRNG deterministe (mulberry32) : meme sequence a chaque lecture. */
export declare function createRng(seed: number): () => number;
/** Arrondi court : divise par ~2 le poids des chaines de path generees a 60 fps. */
export declare const r2: (v: number) => number;
