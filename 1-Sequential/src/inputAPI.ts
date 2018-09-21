// # Fonctions d'entrée
// Méthodes nécessaires pour saisir les entrées de l'utilisateur.

// ## Interface *IKeyPressed*
// Cette interface permet de définir un type associant une clé
// à un type booléen.
interface IKeyPressed {
  [key: string]: boolean;
}

// ## Variable *keyPressed*
// Tableau associatif vide qui contiendra l'état courant
// des touches du clavier.
const keyPressed: IKeyPressed = {};

// ## Méthode *setupKeyboardHandler*
// Cette méthode enregistre des fonctions qui seront
// appelées par le navigateur lorsque l'utilisateur appuie
// sur des touches du clavier. On enregistre alors si la touche
// est appuyée ou relâchée dans le tableau `keyPressed`.
//
// On utilise la propriété `code` de l'événement, qui est
// indépendant de la langue du clavier (ie.: WASD vs ZQSD)
//
// Cette méthode est appelée lors du chargement de ce module.
function setupKeyboardHandler() {
  document.addEventListener('keydown', (evt) => {
    keyPressed[evt.code] = true;
  }, false);

  document.addEventListener('keyup', (evt) => {
    keyPressed[evt.code] = false;
  }, false);
}

// ## Méthode *getAxisY*
// Cette méthode prend en paramètre l'identifiant du joueur (0 ou 1)
// et retourne une valeur correspondant à l'axe vertical d'un faux
// joystick. Ici, on considère les paires W/S et les flèches haut et
// bas comme les extrémums de ces axes.
//
// Si on le voulait, on pourrait substituer cette implémentation
// par clavier par une implémentation de l'[API Gamepad.](https://developer.mozilla.org/fr/docs/Web/Guide/API/Gamepad)
export function getAxisY(player: 0 | 1) {
  if (player === 0) {
    if (keyPressed['KeyW'] === true) {
      return -1;
    }
    if (keyPressed['KeyS'] === true) {
      return 1;
    }
  }
  if (player === 1) {
    if (keyPressed['ArrowUp'] === true) {
      return -1;
    }
    if (keyPressed['ArrowDown'] === true) {
      return 1;
    }
  }
  return 0;
}

// Configuration de la capture du clavier au chargement du module.
// On met dans un bloc `try/catch` afin de pouvoir exécuter les
// tests unitaires en dehors du navigateur.
try {
  setupKeyboardHandler();
} catch (e) {}
