// # Fonctions d'affichage
// Méthodes nécessaires pour charger et afficher
// des images à l'écran.

// ## Variable *canvas*
// Représente l'élément HTML où est rendu le jeu
export let canvas: HTMLCanvasElement;

// ## Variable *ctx*
// Représente le contexte de rendu, où s'exécutent
// les commandes pour contrôller l'affichage
let ctx: CanvasRenderingContext2D;

// ## Interface *IDrawCommand*
// Cette interface définit le contenu d'une instruction de rendu.
interface IDrawCommand {
  image: HTMLImageElement;
  x: number;
  y: number;
}

// ## Variable *drawCommands*
// Cette variable comprend une liste des instructions
// de rendu demandés pendant l'itération courante.
const drawCommands: IDrawCommand[] = [];

// ## Méthode *init*
// La méthode d'initialisation prend en paramètre le nom d'un objet de
// type *canvas* de la page web où dessiner. On y extrait
// et conserve alors une référence vers le contexte de rendu 2D.
export function init(canvasId: string) {
  canvas = <HTMLCanvasElement>document.getElementById(canvasId);
  ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
}

// ## Méthode *loadImage*
// Cette méthode instancie dynamiquement un objet du navigateur
// afin qu'il la charge. Ce chargement se faisant de façon
// asynchrone, on crée une [promesse](http://bluebirdjs.com/docs/why-promises.html)
// qui sera [résolue](http://bluebirdjs.com/docs/api/new-promise.html)
// lorsque l'image sera chargée.
export function loadImage(name: string) {
  return new Promise<HTMLImageElement>((resolve) => {
    const imgDownload = new Image();
    imgDownload.onload = () => {
      resolve(imgDownload);
    };
    imgDownload.src = `../img/${name}.png`;
  });
}

// ## Méthode *drawCenter*
// Cette méthode ajoute à la liste des commandes de rendu une
// image centrée aux coordonnées spécifiées.
export function drawCenter(img: HTMLImageElement, x: number, y: number) {
  drawCommands.push({
    image: img,
    x: x,
    y: y,
  });
}

// ## Méthode *renderFrame*
// Cette méthode exécute les commandes de rendu en attente.
export function renderFrame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCommands.forEach((c) => {
    ctx.drawImage(c.image, c.x - (c.image.width / 2), c.y - (c.image.height / 2));
  });
  drawCommands.length = 0;
}

// ## Méthode *requestFullScreen*
// Méthode utilitaire pour mettre le canvas en plein écran.
// Il existe plusieurs méthodes selon le navigateur, donc on
// se doit de vérifier l'existence de celles-ci avant de les
// appeler.
//
// À noter qu'un script ne peut appeler le basculement en plein
// écran que sur une action explicite du joueur.
export function requestFullScreen() {
  const method = canvas.requestFullscreen || canvas.webkitRequestFullScreen || function () { };
  method.apply(canvas);
}