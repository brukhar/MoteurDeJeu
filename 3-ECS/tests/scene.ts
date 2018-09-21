import { TestComponent, registerMock } from './mockComponent';
import { Entity, IEntity } from '../src/entity';
import { Scene, ISceneDesc, ISceneWalker } from '../src/scene';
import { expect } from 'chai';
import 'mocha';

// # Classe de test
// Cette classe de test est utilisée avec [Mocha](https://mochajs.org/),
// une infrastructure permettant d'effectuer des tests unitaires.
//
// Les tests sont réalisés conjointement avec le module [Chai](http://chaijs.com/)
// qui fournit des fonctions simplifiant les assertions avec
// les tests. On utilise ici les fonctions [expect](http://chaijs.com/api/bdd/)
// de Chai, par choix.

// # Tests sur la classe *Scene*
describe('Scene', () => {
  // On va avoir besoin de créer des scènes de test pour
  // la plupart des tests, on crée donc une configuration qui sera
  // réutilisée.
  const sampleScene: ISceneDesc = {
    empty: {
      components: {},
      children: {},
    },
    complex: {
      components: {
        comp1: {
          hello: 'world'
        },
        comp2: {
          foo: 'bar'
        },
      },
      children: {
        first: {
          components: {},
          children: {},
        },
        second: {
          components: {},
          children: {},
        },
      },
    },
    crossRef1: {
      components: {
        refComp1: {
          target: 'crossRef2'
        },
      },
      children: {},
    },
    crossRef2: {
      components: {
        refComp2: {
          target: 'crossRef1'
        },
      },
      children: {},
    },
  };

  // Les noms des différents objets de la hiérarchie ci-dessus.
  // On s'en servira pour vérifier les itérations sur l'ensemble
  // des objets de la scène.
  const sampleSceneObjNames = [
    'empty',
    'complex',
    'first',
    'second',
    'crossRef1',
    'crossRef2',
  ];

  // Tableau associatif qui fait le lien entre les composants
  // et le nom des objets qui les possèdent, pour vérifier les
  // itérations sur l'ensemble des composants de la scène.
  const sampleSceneCompMap = {
    comp1: 'complex',
    comp2: 'complex',
    refComp1: 'crossRef1',
    refComp2: 'crossRef2',
  };

  // ## *beforeEach*
  // Cette méthode est exécutée par Mocha avant chaque test.
  // On l'utilise pour nettoyer les méthodes statique témoin
  // de la classe de composant de test et pour enregistrer
  // notre module permettant de créer ces composants de test.
  beforeEach(() => {
    registerMock();
    TestComponent.onCreate = ( /*comp*/) => { };
    TestComponent.onSetup = ( /*comp, descr*/) => { };
  });

  // ## Tests unitaires
  //
  // On vérifie ici si on peut créer un objet simple, et si
  // l'objet créé est une instance de la classe de scène.
  it('le module peut être instancié', (done) => {
    Scene.create({})
      .then((scene) => {
        expect(scene).instanceof(Scene);
        done();
      })
      .catch((err) => {
        done(err || 'Erreur inconnue');
      });
  });

  // Une instance de la classe Scene devrait avoir ces méthodes
  // et fonctions. Ce test vérifie qu'elles existent bel et bien,
  // sans vérifier leur fonctionnement.
  it('a les méthodes requises', (done) => {
    Scene.create({})
      .then((scene) => {
        expect(scene).respondTo('findObject');
        expect(scene).respondTo('walk');
        done();
      })
      .catch((err) => {
        done(err || 'Erreur inconnue');
      });
  });

  // Ce test vérifie si il est possible de récupérer un objet
  // de la scène par la méthode `findObject`. On crée une scène
  // contenant quelques objets et on tente de les récupérer.
  it('peut chercher un objet de la scène par son nom', (done) => {
    Scene.create({
      premier: {
        components: {},
        children: {},
      },
      second: {
        components: {},
        children: {},
      },
    })
      .then((scene) => {
        const obj1 = scene.findObject('premier');
        expect(obj1).exist;
        expect(obj1).instanceof(Entity);
        const obj2 = scene.findObject('second');
        expect(obj2).exist;
        expect(obj2).instanceof(Entity);
        done();
      })
      .catch((err) => {
        done(err || 'Erreur inconnue');
      });
  });

  // Ce test vérifie qu'il est possible de créer les objets
  // à partir d'une structure de description. On tente par la
  // suite de chercher chaque objet de la liste des objets
  // qui doivent exister.
  it('instancie les objets depuis une description', (done) => {
    Scene.create(sampleScene)
      .then((scene) => {
        sampleSceneObjNames.forEach((name) => {
          const obj = scene.findObject(name);
          //console.log(name);
          expect(obj).exist;
          expect(obj).instanceof(Entity);
        });
        done();
      })
      .catch((err) => {
        done(err || 'Erreur inconnue');
      });
  });

  // Certains composants doivent faire référence à d'autres. C'est
  // ce qui motive l'existence de la méthode `setup` de ceux-ci,
  // en plus du constructeur. Pour tester ça, on modifie la méthode
  // statique *onSetup* du composant de test afin qu'il tente
  // de récupérer des références vers d'autres objets. On s'attend
  // à ce que ces objets existent, même s'ils n'ont pas encore été
  // complètement configurés.
  it('gère correctement les références croisées', (done) => {
    const calls = new Map<string, TestComponent>();
    TestComponent.onSetup = (comp, descr) => {
      if (!(/^refComp/.test(comp.__type))) {
        return;
      }
      expect(calls).not.property(comp.__type);
      calls.set(comp.__type, comp);
      const refObj = Scene.current.findObject(descr.target);
      expect(refObj).exist;
      expect(refObj).instanceof(Entity);
    };

    Scene.create(sampleScene)
      .then((scene) => {
        for (let i = 1; i <= 2; ++i) {
          const compName = `refComp${i}`;
          const objName = `crossRef${i}`;
          expect(calls.has(compName)).true;
          const obj = scene.findObject(objName)!;
          const comp = obj.getComponent(compName);
          expect(calls.get(compName)).equals(comp);
        }
        done();
      })
      .catch((err) => {
        done(err || 'Erreur inconnue');
      });
  });

  // Les composants peuvent avoir besoin d'exécuter les étapes
  // de configuration de manière asynchrone, à l'aide d'une [promesse](http://bluebirdjs.com/docs/why-promises.html).
  // On doit attendre la résolution de celle-ci avant de terminer
  // l'initialisation de la scène. Pour valider ce comportement,
  // on modifie la méthode statique *onSetup* du composant de test
  // afin qu'il incrémente un compteur et le décrémente après un
  // temps d'attente. Le compteur devrait être à zéro si l'attente
  // a été respectée.
  it('attend la fin des promesses des fonctions "setup" des composants', (done) => {
    function delayPromise(ms: number) {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    }

    let callsCount = 0;
    TestComponent.onSetup = (comp, descr) => {
      callsCount++;
      return delayPromise(10)
        .then(() => {
          callsCount--;
        });
    };

    Scene.create(sampleScene)
      .then(() => {
        expect(callsCount).equals(0);
        done();
      })
      .catch((err) => {
        done(err || 'Erreur inconnue');
      });
  });

  // On doit pouvoir visiter tous les objets de la scène
  // afin de pouvoir implémenter certains systèmes.
  it('implémente une fonction permettant de visiter tous les objets', (done) => {
    let scene: Scene;
    const visits = new Map<string, number>();
    sampleSceneObjNames.forEach((name) => {
      visits.set(name, 0);
    });
    const fn: ISceneWalker = (e, n) => {
      expect(visits.has(n)).true;
      expect(scene.findObject(n)).equals(e);
      visits.set(n, visits.get(n)! + 1);
      return Promise.resolve();
    };
    Scene.create(sampleScene)
      .then((newScene) => {
        scene = newScene;
        return scene.walk(fn);
      })
      .then(() => {
        visits.forEach((v) => {
          expect(v).equals(1);
        });
        done();
      })
      .catch((err) => {
        done(err || 'Erreur inconnue');
      });
  });
});
