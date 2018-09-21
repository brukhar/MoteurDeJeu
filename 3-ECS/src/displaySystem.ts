import * as GraphicsAPI from './graphicsAPI';
import { ISystem } from './system';
import { Scene, ISceneWalker } from './scene';
import { IEntity } from './entity';
import { IComponent } from './components';

// # Interface *IDisplayComponent*
// Déclare le type d'un composant géré par ce système.
export interface IDisplayComponent extends IComponent {
  // ### Méthode *display*
  // La méthode *display* de chaque composant est appelée une fois
  // par itération de la boucle de jeu.
  display(dT: number): Promise<any> | void;
}

// # Fonction *isDisplayComponent*
// Vérifie si le composant est du type `IDisplayComponent``
// Voir [la documentation de TypeScript](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards)
function isDisplayComponent(arg: IComponent): arg is IDisplayComponent {
  return (arg as IDisplayComponent).display !== undefined;
}

// # Classe *DisplaySystem*
// Représente le système permettant de gérer l'affichage
export class DisplaySystem implements ISystem {
  // ## Constructeur
  // Initialise l'API graphique.
  constructor(canvasId: string) {
    GraphicsAPI.init(canvasId);
  }

  // Méthode *iterate*
  // Appelée à chaque tour de la boucle de jeu
  // Parcourt l'ensemble des entités via le patron de
  // conception [visiteur](https://fr.wikipedia.org/wiki/Visiteur_(patron_de_conception)).
  // Appelle ensuite la méthode de rendu de l'API.
  iterate(dT: number) {
    const walkIterFn: ISceneWalker = (e) => this.walkFn(dT, e);
    return Scene.current.walk(walkIterFn)
      .then(() => GraphicsAPI.renderFrame());
  }

  // Méthode *walkFn*
  // Appelle la méthode `display` sur chaque composant
  // respectant l'interface `IDisplayComponent`
  private walkFn(dT: number, entity: IEntity) {
    let p = Promise.resolve();
    entity.walkComponent((comp) => {
      if (isDisplayComponent(comp))
        p = p.then(() => comp.display(dT));
    });
    return p;
  }
}