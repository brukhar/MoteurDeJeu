import { ISystem } from './system';
import { Scene, ISceneWalker } from './scene';
import { IEntity } from './entity';
import { IComponent } from './components';

// # Interface *ILogicComponent*
// Déclare le type d'un composant géré par ce système.
export interface ILogicComponent extends IComponent {
  // ### Méthode *update*
  // La méthode *update* de chaque composant est appelée une fois
  // par itération de la boucle de jeu.
  update(dT: number): Promise<any> | void;
}

// # Fonction *isLogicComponent*
// Vérifie si le composant est du type `ILogicComponent``
// Voir [la documentation de TypeScript](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards)
function isLogicComponent(arg: IComponent): arg is ILogicComponent {
  return (arg as ILogicComponent).update !== undefined;
}

// # Classe *LogicSystem*
// Représente le système permettant de mettre à jour la logique
export class LogicSystem implements ISystem {
  // Méthode *iterate*
  // Appelée à chaque tour de la boucle de jeu
  // Parcourt l'ensemble des entités via le patron de
  // conception [visiteur](https://fr.wikipedia.org/wiki/Visiteur_(patron_de_conception)).
  iterate(dT: number) {
    const walkIterFn: ISceneWalker = (e) => this.walkFn(dT, e);
    return Scene.current.walk(walkIterFn);
  }

  // Méthode *walkFn*
  // Appelle la méthode `update` sur chaque composant
  // respectant l'interface `ILogicComponent`
  private walkFn(dT: number, entity: IEntity) {
    let p = Promise.resolve();
    entity.walkComponent((comp) => {
      if (isLogicComponent(comp))
        p = p.then(() => comp.update(dT));
    });
    return p;
  }
}