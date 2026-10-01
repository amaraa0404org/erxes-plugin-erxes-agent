/**
 * Ou poser le visage sur une forme du personnalisateur.
 *
 * Les yeux vivent sur une sphere, et `radiusAtAngle` les recolle au contour reel au
 * prorata du rayon local. Ce prorata place bien leur CENTRE, mais l'oeil a une taille :
 * la marge qui lui reste devant le bord est multipliee par le meme facteur, donc une
 * silhouette etroite dans sa direction le pousse contre le bord jusqu'a ce que le
 * masque l'ouvre vers l'exterieur. La gelule apparaissait comme une encoche dans le
 * corps sur `capsule`, `triangle`, `nuage` et `goutte`.
 *
 * Ce module resout le probleme UNE FOIS, au chargement, et rend une table de decalages.
 * Ce choix est l'essentiel du correctif, bien plus que la geometrie qui suit :
 *
 * Resolue dans la boucle de rendu, la correction reagit a tout ce qui bouge a soixante
 * images par seconde — la derive du regard, le pointeur, l'expression en cours de
 * morph, le bord le plus proche qui change, l'oeil le plus contraint qui change. Sept
 * variantes ont ete ecrites ainsi et toutes produisaient un artefact de mouvement
 * visible : tremblement permanent, saut de direction de 26 unites quand le bord de
 * reference basculait, grossissement brusque quand la taille entrait dans le calcul.
 * Le defaut n'etait dans aucune de leurs geometries, il etait dans le fait de resoudre
 * par image.
 *
 * Le reste du moteur ne travaille pas comme ca : les poses sont DECLAREES et il ne fait
 * que les interpoler avec des courbes connues. Un decalage tabule rentre dans ce moule.
 * Il ne bouge pas quand le regard derive ni quand le pointeur bouge, et sur un changement
 * de forme ou d'expression il ne fait qu'aller d'une entree de table a l'autre, sur la
 * courbe de ce morph. Le tremblement devient impossible par construction, au lieu d'etre
 * repousse : interpoler entre deux constantes est monotone, alors que re-resoudre le
 * probleme sur un regard en cours d'interpolation ne l'est pas.
 *
 * Corollaire agreable : le solveur n'a plus aucune contrainte de continuite, puisqu'il ne
 * tourne pas pendant l'animation. Il peut donc sonder tout un faisceau de directions et
 * couvrir le pire cas de la derive du regard, ce qu'une version par image ne pouvait pas
 * se permettre.
 *
 * La table est une constante de module, batie a l'import a partir de donnees pures :
 * meme nature que le calendrier de clignements de `face.ts`, deterministe et sans etat,
 * donc sans effet sur la purete de `engine.sample(t)`.
 */
import { type StateId } from './states';
/**
 * Table des decalages, batie a l'import : une entree par (forme, etat a corps de base,
 * expression). Seuls `idle` et `swirl` portent le visage de repos, donc seuls eux se
 * declinent par expression — les trois autres etats a corps de base ont un visage releve
 * sur la video et une seule entree.
 *
 * Clef par REFERENCE du tableau de rayons, ce qui est deja la convention du moteur : ses
 * gardes `radii === this.shape` et `expression === this.expr` reposent sur la meme
 * stabilite. Un profil inconnu, ou `null`, ne corrige rien — l'API accepte n'importe quel
 * tableau et le moteur n'a pas a dependre de la prudence de ses appelants.
 */
declare function batir(): Map<number[], Map<string, {
    x: number;
    y: number;
}>>;
/**
 * Decalage a appliquer aux deux yeux pour cette forme sur cet etat, en unites de rayon
 * de boule — le moteur le remet a son echelle.
 *
 * Vaut zero des que la forme n'est pas au catalogue, ce qui couvre `null` et le cercle :
 * sur le cercle les deux profils sont le meme, donc la marge est deja celle exigee et la
 * descente sort au premier tour. La forme relevee sur la video ne bouge donc pas, sans
 * cas particulier.
 */
export declare function decalageDesYeux(radii: number[] | null, state: StateId, expr: string | null): {
    x: number;
    y: number;
};
/** Pour les tests : de quoi verifier la table sans refaire la geometrie. */
/** Pour les tests : de quoi chronometrer la construction de la table. */
export declare const POUR_TESTS: {
    batir: typeof batir;
};
export {};
