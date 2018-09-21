// # Fonctions utilitaires
// Fonctions utilitaires pour des méthodes génériques qui n'ont
// pas de lien direct avec le jeu.

// ## Fonction *requestAnimationFrame*
// Encapsuler dans une promesse la méthode qui attend la mise
// à jour de l'affichage.
function requestAnimationFrame() {
  return new Promise<number>((resolve) => {
    window.requestAnimationFrame(resolve);
  });
}

// ## Fonction *iterate*
// Exécute une itération de la boucle de jeu, en attendant
// après chaque étape du tableau `actions`.
function iterate(actions: ((delta: number) => void)[], delta: number) {
  let p = Promise.resolve();
  actions.forEach((a) => {
    p = p.then(() => {
      return a(delta);
    });
  });
  return p;
}

// ## Fonction *loop*
// Boucle de jeu simple, on lui passe un tableau de fonctions
// à exécuter à chaque itération. La boucle se rappelle elle-même
// après avoir attendu le prochain rafraîchissement de l'affichage.
let lastTime = 0;

export function loop(actions: ((delta: number) => void)[], time = 0): Promise<{}> {
  // Le temps est compté en millisecondes, on désire
  // l'avoir en secondes, sans avoir de valeurs trop énorme.
  const delta = clamp((time - lastTime) / 1000, 0, 0.1);
  lastTime = time;
  const nextLoop = (t: number) => loop(actions, t);
  return iterate(actions, delta)
    .then(requestAnimationFrame)
    .then(nextLoop);
}

// ## Fonction *inRange*
// Méthode utilitaire retournant le booléen *vrai* si une
// valeur se situe dans un interval.
export function inRange(x: number, min: number, max: number) {
  return (min <= x) && (x <= max);
}

// ## Fonction *clamp*
// Méthode retournant la valeur passée en paramètre si elle
// se situe dans l'interval spécifié, ou l'extrémum correspondant
// si elle est hors de l'interval.
export function clamp(x: number, min: number, max: number) {
  return Math.min(Math.max(x, min), max);
}

// ## Fonction *loadAsync*
// Fonction qui charge un fichier de façon asynchrone,
// via une [promesse](http://bluebirdjs.com/docs/why-promises.html)
export function loadAsync(url: string) {
  return new Promise<XMLHttpRequest>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('error', reject);
    xhr.addEventListener('load', () => {
      resolve(xhr);
    });
    xhr.open('GET', url);
    xhr.send();
  });
}

// ## Fonction *loadJSON*
// Fonction qui charge un fichier JSON de façon asynchrone,
// via une [promesse](http://bluebirdjs.com/docs/why-promises.html)
export function loadJSON(url: string) {
  return loadAsync(url)
    .then((xhr) => {
      return JSON.parse(xhr.responseText);
    });
}
