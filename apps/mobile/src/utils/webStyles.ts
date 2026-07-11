import type { TextStyle } from "react-native";

/**
 * RN Web applique un anneau de focus natif du navigateur (carré, décalé du
 * borderRadius) sur tout champ/élément focalisable. `outlineStyle` n'existe
 * pas dans les types RN standards (extension web-only de react-native-web) :
 * cast isolé ici plutôt que d'affaiblir le typage des composants qui
 * l'utilisent. À appliquer partout où l'app gère elle-même un style de
 * focus (bordure, halo) pour éviter que le navigateur en ajoute un second.
 */
export const webNoOutline = { outlineStyle: "none" } as unknown as TextStyle;
