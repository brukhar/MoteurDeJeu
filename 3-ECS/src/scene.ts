import { IEntity, Entity } from './entity';
import { IComponent } from './components';

// # Interface *ISceneWalker*
// Définit le prototype de fonction permettant d'implémenter
// le patron de conception [visiteur](https://fr.wikipedia.org/wiki/Visiteur_(patron_de_conception))
// sur les différentes entités de la scène.
export interface ISceneWalker {
  (entity: IEntity, name: string): Promise<any>;
}

// # Interfaces de description
// Ces interfaces permettent de définir la structure de
// description d'une scène, telle que normalement chargée
// depuis un fichier JSON.
export interface IComponentDesc {
  [key: string]: any;
}

export interface IEntityDesc {
  components: IComponentDesc;
  children: ISceneDesc;
}

export interface ISceneDesc {
  [key: string]: IEntityDesc;
}

// # Classe *Scene*
// La classe *Scene* représente la hiérarchie d'objets contenus
// simultanément dans la logique du jeu.
export class Scene {
  static current: Scene;

  sceneEntity : IEntity = new Entity();
  componentsDescrList : Map<IComponent, any> = new Map();



  // ## Fonction statique *create*
  // La fonction *create* permet de créer une nouvelle instance
  // de la classe *Scene*, contenant tous les objets instanciés
  // et configurés. Le paramètre `description` comprend la
  // description de la hiérarchie et ses paramètres. La fonction
  // retourne une promesse résolue lorsque l'ensemble de la
  // hiérarchie est configurée correctement.
  static create(description: ISceneDesc): Promise<Scene> {
    const scene = new Scene(description);
    Scene.current = scene;

    return scene.setupComponents().then(
      () => scene
    );
  }

  private constructor(description: ISceneDesc) {
    this.addChildrens(description, this.sceneEntity);
  }

  private addChildrens(description : ISceneDesc, father : IEntity)
  {
    Object.keys(description).forEach( name =>
      {
        const child = new Entity();
        father.addChild(name, child);
        this.addChildrens(description[name].children, child);

        Object.keys(description[name].components).forEach( component =>
          {
            const comp = child.addComponent(component);
            this.componentsDescrList.set(comp, description[name].components[component]);
          })
      })
  }

  private setupComponents() : Promise<any>
  {
    let promise = Promise.resolve();
    promise = this.setupComponentsRec(promise, this.sceneEntity);
    return promise;
  }

  private setupComponentsRec(promise : Promise<any>, cursorEntity : IEntity) : Promise<any>
  {
    cursorEntity.walkComponent(component =>
      {
        promise = promise.then(() => component.setup(this.componentsDescrList.get(component)))
      });
    cursorEntity.walkChildren(child =>
      {
        promise = this.setupComponentsRec(promise, child);
      });
      return promise;
  }

  // ## Fonction *findObject*
  // La fonction *findObject* retourne l'objet de la scène
  // portant le nom spécifié.
  findObject(objectName: string): IEntity | undefined {
    return this.findObjectRec(objectName, this.sceneEntity);
  }

  private findObjectRec(objectName : string, cursorEntity : IEntity) : IEntity | undefined
  {
    let objectFound = cursorEntity.getChild(objectName);
    if(objectFound == undefined)
    {
      cursorEntity.walkChildren( child =>
        {
          if(objectFound == undefined)
          {
            objectFound = this.findObjectRec(objectName, child);
          }
        })
    }
    return objectFound;
  }

  // ## Méthode *walk*
  // Cette méthode parcourt l'ensemble des entités de la
  // scène et appelle la fonction `fn` pour chacun, afin
  // d'implémenter le patron de conception [visiteur](https://fr.wikipedia.org/wiki/Visiteur_(patron_de_conception)).
  walk(fn: ISceneWalker): Promise<any> {
    return this.walkRec(fn, this.sceneEntity);
  }

  private walkRec(fn : ISceneWalker, cursorEntity : IEntity) : Promise<any>
  {
    let promise = Promise.resolve();
    cursorEntity.walkChildren((child, name) =>
    {
      promise = promise.then(() => fn(child, name))
                       .then(() => this.walkRec(fn, child));
    });
    return promise;
  }
}
