import { IComponent, ComponentFactory } from './components';

export interface IEntityWalker {
  (entity: IEntity, name: string): Promise<any> | void;
}

export interface IComponentWalker {
  (comp: IComponent, type: string): Promise<any> | void;
}

// # Interface *IEntity*
// Cette interface présente la structure d'une entité valide
export interface IEntity {
  addChild(name: string, child: IEntity): void;
  getChild(name: string): IEntity | undefined;
  addComponent(type: string): IComponent;
  getComponent<T extends IComponent>(type: string): T;
  walkChildren(fn: IEntityWalker): void;
  walkComponent(fn: IComponentWalker): void;
}

// # Classe *Entity*
// La classe *Entity* représente un objet de la scène qui
// peut contenir des enfants et des composants.
export class Entity implements IEntity {

  componentsList : Map<string, IComponent> = new Map();
  childsList : Map<string, IEntity> = new Map();

  // ## Fonction *componentCreator*
  // Référence vers la fonction permettant de créer de
  // nouveaux composants. Permet ainsi de substituer
  // cette fonction afin de réaliser des tests unitaires.
  static componentCreator = ComponentFactory.create;

  // ## Méthode *addComponent*
  // Cette méthode prend en paramètre le type d'un composant et
  // instancie un nouveau composant.
  addComponent(type: string): IComponent {
    const newComponent = Entity.componentCreator(type, this);
    this.componentsList.set(type, newComponent);
    return newComponent;
  }

  // ## Fonction *getComponent*
  // Cette fonction retourne un composant existant du type spécifié
  // associé à l'objet.
  getComponent<T extends IComponent>(type: string): T {
    return this.componentsList.get(type) as T;
  }

  // ## Méthode *addChild*
  // La méthode *addChild* ajoute à l'objet courant un objet
  // enfant.
  addChild(objectName: string, child: IEntity) {
    this.childsList.set(objectName, child);
  }

  // ## Fonction *getChild*
  // La fonction *getChild* retourne un objet existant portant le
  // nom spécifié, dont l'objet courant est le parent.
  getChild(objectName: string): IEntity | undefined {
    return this.childsList.get(objectName);
  }

  // ## Méthode *walkChildren*
  // Cette méthode parcourt l'ensemble des enfants de cette
  // entité et appelle la fonction `fn` pour chacun, afin
  // d'implémenter le patron de conception [visiteur](https://fr.wikipedia.org/wiki/Visiteur_(patron_de_conception)).
  walkChildren(fn: IEntityWalker): void {
    this.childsList.forEach(fn);
  }

  // ## Méthode *walkComponent*
  // Cette méthode parcourt l'ensemble des composants de cette
  // entité et appelle la fonction `fn` pour chacun, afin
  // d'implémenter le patron de conception [visiteur](https://fr.wikipedia.org/wiki/Visiteur_(patron_de_conception)).
  walkComponent(fn: IComponentWalker): void {
    this.componentsList.forEach(fn);
  }
}
