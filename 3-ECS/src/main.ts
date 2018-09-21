import * as Utils from './utils';
import * as InputAPI from './inputAPI';
import { Scene } from './scene';
import { DisplaySystem } from './displaySystem';
import { LogicSystem } from './logicSystem';
import { ISystem } from './system';

// ## Variable *systems*
// Représente la liste des systèmes utilisés par notre moteur
let systems: ISystem[];

// ## Méthode *run*
// Cette méthode initialise les différents systèmes nécessaires
// et démarre l'exécution complète du jeu.
export function run(canvasId: string) {
  setupSystem(canvasId);
  return launchGame();
}

// ## Méthode *launchGame*
// Cette méthode initialise la scène du jeu et lance la
// boucle de jeu.
function launchGame() {
  return Utils.loadJSON('scenes/scene.json')
    .then((sceneDescription) => {
      return Scene.create(sceneDescription);
    })
    .then((scene) => {
      return Utils.loop([iterate]);
    });
}

// ## Méthode *iterate*
// Réalise une itération sur chaque système.
function iterate(dT: number) {
  let p = Promise.resolve();
  systems.forEach((s) => {
    p = p.then(() => s.iterate(dT));
  });
  return p;
}

// ## Méthode *setupSystem*
// Cette méthode initialise les différents systèmes nécessaires.
function setupSystem(canvasId: string) {
  const display = new DisplaySystem(canvasId);
  const logic = new LogicSystem();

  systems = [display, logic];
}
