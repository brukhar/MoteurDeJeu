import * as Utils from './utils';
import * as GraphicsAPI from './graphicsAPI';
import * as InputAPI from './inputAPI';

// # Interfaces générales

// ## Interface *IGraphic*
// Déclare une interface d'un objet supportant le rendu
// à l'écran.
interface IGraphic {
  display(): void;
}

// ## Interface *IInput*
// Déclare une interface d'un objet représentant une
// méthode d'entrée.
interface IInput {
  dY: number;
  updateInput(): void;
}

// # Classe *Background*
// Cette classe représente l'arrière-plan du terrain de jeu.
class Background implements IGraphic {
  backgroundImage!: HTMLImageElement;

  // ## Méthode statique *create*
  // Puisque la classe instancie une image de façon asynchrone,
  // on désire retourner une [promesse](http://bluebirdjs.com/docs/why-promises.html)
  // qui sera résolue quand tout sera complété. Pour ce faire,
  // on utilise une fonction s'inspirant du patron de conception
  // de [fabrique](https://fr.wikipedia.org/wiki/Fabrique_%28patron_de_conception%29)
  // au lieu de passer par le constructeur.
  static create() {
    const obj = new Background();
    return GraphicsAPI.loadImage('background')
      .then((image) => {
        obj.backgroundImage = image;
        return obj;
      });
  }

  // ## Méthode *display*
  // Cette méthode affiche l'image d'arrière-plan au centre de
  // l'aire de jeu.
  display() {
    GraphicsAPI.drawCenter(this.backgroundImage, Program.AreaWidth / 2, Program.AreaHeight / 2);
  }
}

// # Classe *Paddle*
// Cette classe représente la palette d'un joueur.
class Paddle implements IGraphic {
  y: number;
  paddleImage!: HTMLImageElement;

  // ## Méthode statique *create*
  // La même logique s'applique que la classe `Background`. Ici,
  // on a un paramètre supplémentaire pour le constructeur pour
  // spécifier la position horizontale de la palette.
  static create(x: number) {
    const obj = new Paddle(x);
    return GraphicsAPI.loadImage('paddle')
      .then((image) => {
        obj.paddleImage = image;
        return obj;
      });
  }

  // ## Constructeur de la classe *Paddle*
  // Le constructeur ne fait qu'assigner les positions horizontale
  // et verticale de l'objet. La position verticale `y` sera
  // modifiée par les autres objets.
  constructor(private x: number) {
    this.y = 0;
  }

  // ## Méthode *display*
  // Cette méthode affiche la palette d'un joueur à l'endroit
  // désiré.
  display() {
    GraphicsAPI.drawCenter(this.paddleImage, this.x, this.y);
  }
}

// # Classe *Ball*
// Cette classe représente la balle du jeu.
class Ball implements IGraphic {
  ballImage!: HTMLImageElement;
  x!: number;
  y!: number;
  dirX: number;
  dirY: number;

  // ## Méthode statique *create*
  // La même logique s'applique que la classe `Background`.
  static create() {
    const obj = new Ball();
    return GraphicsAPI.loadImage('ball')
      .then((image) => {
        obj.ballImage = image;
        return obj;
      });
  }

  // ## Constructeur de la classe *Ball*
  // Le constructeur initialise la direction de la balle et
  // appelle la méthode de réinitialisation pour sa position.
  constructor() {
    this.dirX = 1;
    this.dirY = 1;
    this.reset();
  }

  // ## Méthode *update*
  // Cette méthode met à jour la position de la balle. Si la
  // position verticale dépasse l'aire de jeu, on inverse celle-ci.
  update(dT: number) {
    this.x += this.dirX * Program.BallSpeed * dT;
    this.y += this.dirY * Program.BallSpeed * dT;

    if ((this.y < Program.PlayAreaMinY) ||
      (this.y > Program.PlayAreaMaxY)) {
      this.dirY *= -1;
    }
  }

  // ## Méthode *display*
  // Affiche la balle à sa position.
  display() {
    GraphicsAPI.drawCenter(this.ballImage, this.x, this.y);
  }

  // ## Méthode *reset*
  // Réinitialise la position de la balle lorsqu'il y a un point.
  reset() {
    this.x = Program.CenterX;
    this.y = Program.CenterY;
  }

  // ## Méthode *reverseX*
  // Inverse la direction horizontale de la balle, lorsqu'elle
  // touche la palette d'un joueur.
  reverseX() {
    this.dirX *= -1;
  }
}

// ## Interface *INumberMap*
// Déclare un type pour un tableau associatif liant une
// clé à un type d'image.
interface INumberMap {
  [key: number]: HTMLImageElement;
}

// # Classe *Score*
// La classe *Score* gère le pointage d'un joueur, ainsi
// que sa représentation visuelle lors de l'affichage.
class Score implements IGraphic {
  numberImages: INumberMap = {};
  points!: number;

  // ## Méthode statique *create*
  // La même logique s'applique que la classe `Paddle`.
  // Il y a une nuance, par contre, qui consiste à conserver
  // les images pour tous les chiffres dans un tableau
  // associatif.
  static create(x: number) {
    const obj = new Score(x);
    const imgPromises = [];
    for (let i = 0; i <= 9; ++i) {
      const p = GraphicsAPI.loadImage(i.toString())
        .then((img) => {
          obj.numberImages[i] = img;
        });
      imgPromises.push(p);
    }
    return Promise.all(imgPromises)
      .then(() => {
        return obj;
      });
  }

  // ## Constructeur de la classe *Score*
  // Le constructeur conserve la position horizontale du score.
  // Il appelle également la méthode `reset` pour
  // mettre le pointage initial à zéro.
  constructor(private x: number) {
    this.reset();
  }

  // ## Méthode *display*
  // Affiche le score du joueur en choisissant l'image appropriée,
  // indexée par le score du joueur dans le tableau associatif.
  display() {
    GraphicsAPI.drawCenter(this.numberImages[this.points], this.x, Program.ScoreY);
  }

  // ## Méthode *increment*
  // Incrémente le score du joueur.
  increment() {
    this.points++;
  }

  // ## Méthode *reset*
  // Remet le pointage du joueur à zéro.
  reset() {
    this.points = 0;
  }
}

// # Classe *Joystick*
// La classe *Joystick* sert à contenir le déplacement
// désiré du joueur lors d'une itération de la boucle de jeu.
class Joystick implements IInput {
  dY: number;

  // ## Constructeur de la classe *Joystick*
  // Le constructeur conserve l'identifiant du joueur afin
  // de savoir de quel joystick il a possession. On met également
  // la variable indiquant le déplacement vertical à zéro.
  constructor(private id: 0 | 1) {
    this.dY = 0;
  }

  // ## Méthode *updateInput*
  // Cette méthode est appelée lors de la mise à jour des
  // entrées dans la boucle de jeu. On demande à l'API *input*
  // la valeur de l'axe vertical pour le joueur désiré.
  updateInput() {
    this.dY = InputAPI.getAxisY(this.id);
  }
}

// # Classe *Player*
// Un joueur est représenté par la classe *Player*, qui contient
// des références vers les éléments dont il a possession,
// soient sa palette, son score et son joystick. Il s'agit
// d'une classe par composition.
class Player {
  // ## Constructeur de la classe *Player*
  // Le constructeur ne fait que conserver localement ses paramètres.
  constructor(private paddle: Paddle, private score: Score, private input: IInput) {
  }

  // ## Propriétés et fonctions *currentScore*, *incrementScore* et *resetScore*
  // Ces fonctions ont pour but d'éviter de coupler l'utilisation
  // de la classe *Player* avec celle de *Score*. Une classe externe
  // ne devrait jamais avoir besoin de connaître les détails
  // d'implémentation d'une classe pour l'utiliser.
  get currentScore() {
    return this.score.points;
  }

  incrementScore() {
    this.score.increment();
  }

  resetScore() {
    this.score.reset();
  }

  // ## Méthode *update*
  // La méthode de mise à jour de la classe *Player* met à jour
  // la position verticale de sa palette selon le déplacement
  // demandé par le joystick, en évitant de dépasser l'aire de jeu.
  update(dT: number) {
    this.paddle.y += this.input.dY * dT * Program.PaddleSpeed;
    this.paddle.y = Utils.clamp(this.paddle.y, Program.PlayAreaMinY + Program.PaddleHeight / 2, Program.PlayAreaMaxY - Program.PaddleHeight / 2);
  }

  // ## Fonction *collides*
  // Cette fonction retourne la valeur *vrai* si la position
  // verticale de la balle est dans la zone de la palette du
  // joueur.
  collides(ball: Ball) {
    return Utils.inRange(ball.y, this.paddle.y - Program.PaddleHeight / 2, this.paddle.y + Program.PaddleHeight / 2);
  }
}

// # Classe *Game*
// La classe *Game* représente le déroulement de la partie
// et contient ses acteurs directs, soient les joueurs et
// la balle. Il s'agit d'une classe par composition.
class Game {
  // ## Constructeur de la classe *Game*
  // Le constructeur ne fait que conserver localement ses paramètres.
  constructor(private ball: Ball, private player1: Player, private player2: Player) {
  }

  // ## Méthode *update*
  // Cette méthode est appelée par la boucle de jeu afin de
  // mettre à jour l'ensemble de la logique du jeu.
  update(dT: number) {
    // On commence par demander la mise à jour des différents
    // intervenants.
    this.player1.update(dT);
    this.player2.update(dT);
    this.ball.update(dT);

    // On vérifie ensuite la logique faisant interagit les
    // joueurs et la balle. Si la balle est dans la zone
    // contrôlée par le joueur de gauche,
    if (this.ball.x < Program.PlayAreaMinX) {
      // on vérifie si la balle touche à la palette du joueur, dans
      // lequel cas on inverse la direction horizontale de la balle
      if (this.player1.collides(this.ball)) {
        this.ball.reverseX();
      }
      // le cas échéant, on incrémente le score de l'adversaire et
      // on remet la balle au centre.
      else {
        this.player2.incrementScore();
        this.ball.reset();
      }
    }
    // On fait de même pour le joueur de droite.
    else if (this.ball.x > Program.PlayAreaMaxX) {
      if (this.player2.collides(this.ball)) {
        this.ball.reverseX();
      } else {
        this.player1.incrementScore();
        this.ball.reset();
      }
    }

    // Si un joueur atteint le score maximal, on affiche un
    // message et on remet les scores à zéro.
    if ((this.player1.currentScore > Program.MaxScore) ||
      (this.player2.currentScore > Program.MaxScore)) {
      alert('Partie terminée');
      this.player1.resetScore();
      this.player2.resetScore();
    }
  }
}

// # Classe *Program*
// La classe *Program* instancie et configure les composants
// nécessaires au bon déroulement du jeu.
class Program {
  static AreaWidth: number;
  static AreaHeight: number;
  static ScoreY = 64;
  static ScoreP1X: number;
  static ScoreP2X: number;
  static BallSpeed = 500;
  static PaddleSpeed = 500;
  static PalP1X = 16;
  static PalP2X: number;
  static BallRadius = 16;
  static PaddleHeight = 200;
  static MaxScore = 9;

  static CenterX: number;
  static CenterY: number;

  static PlayAreaMinX: number;
  static PlayAreaMaxX: number;
  static PlayAreaMinY: number;
  static PlayAreaMaxY: number;

  static game: Game;
  static graphics: IGraphic[];
  static inputs: IInput[];

  // ## Méthode statique *run*
  // Cette méthode instancie les différents systèmes nécessaires
  // et démarre l'exécution complète du jeu.
  static run(canvasId: string) {
    Program.setupSystem(canvasId);
    return Program.launchGame();
  }

  // ## Méthode statique *launchGame*
  // Cette méthode initialise les valeurs du jeu et lance
  // la boucle de jeu.
  static launchGame() {
    return Program.init()
      .then(() => {
        return Utils.loop([Program.updateInput, Program.updateLogic, Program.updateOutput]);
      });
  }

  // ## Fonction statique *init*
  // Cette fonction instancie les différents objets du jeu.
  // Puisque certains objets doivent être créés de façon
  // asynchrones, on attend leur création via des promesses.
  // On enregistre ensuite les éléments graphiques, les éléments
  // d'entrée et le jeu dans des membres statiques afin de
  // pouvoir faire leur mise à jour.
  static init() {
    let background: Background;
    let ball: Ball;
    let paddle1: Paddle;
    let paddle2: Paddle;
    let score1: Score;
    let score2: Score;

    const promises = [
      Background.create().then((obj) => {
        background = obj;
      }),
      Ball.create().then((obj) => {
        ball = obj;
      }),
      Paddle.create(Program.PalP1X).then((obj) => {
        paddle1 = obj;
      }),
      Paddle.create(Program.PalP2X).then((obj) => {
        paddle2 = obj;
      }),
      Score.create(Program.ScoreP1X).then((obj) => {
        score1 = obj;
      }),
      Score.create(Program.ScoreP2X).then((obj) => {
        score2 = obj;
      }),
    ];

    return Promise.all(promises)
      .then(() => {
        const inp1 = new Joystick(0);
        const inp2 = new Joystick(1);
        const player1 = new Player(paddle1, score1, inp1);
        const player2 = new Player(paddle2, score2, inp2);

        Program.game = new Game(ball, player1, player2);
        Program.graphics = [background, paddle1, paddle2, ball, score1, score2];
        Program.inputs = [inp1, inp2];
      });
  }

  // ## Méthode statique *updateInput*
  // Cette méthode de la boucle de jeu appelle
  // les méthodes de mises à jour aux composants d'entrées.
  static updateInput() {
    Program.inputs.forEach((inp) => inp.updateInput());
  }

  // ## Méthode statique *updateLogic*
  // Cette méthode appelle la méthode de mise à jour de
  // l'instance de la classe *Game*.
  static updateLogic(dT: number) {
    return Program.game.update(dT);
  }

  // ## Méthode statique *updateOutput*
  // Cette méthode de la boucle de jeu affiche les éléments
  // à l'écran, en appelant les méthodes d'affichage des
  // différents composants de sortie.
  static updateOutput() {
    Program.graphics.forEach((g) => g.display());
    GraphicsAPI.renderFrame();
  }

  // ## Méthode statique *setupSystem*
  // Cette méthode instancie les différents systèmes nécessaires
  // et configure les constantes du jeu.
  static setupSystem(canvasId: string) {
    GraphicsAPI.init(canvasId);
    Program.setupConstants(GraphicsAPI.canvas);
  }

  // ## Constantes et méthode statique *setupConstants*
  // Ces valeurs représentent les constantes utilisées lors
  // de l'exécution du jeu et les variables de configuration.
  static setupConstants(canvas: HTMLCanvasElement) {
    Program.AreaWidth = canvas.width;
    Program.AreaHeight = canvas.height;
    Program.ScoreP1X = Program.AreaWidth / 4;
    Program.ScoreP2X = Program.AreaWidth * 3 / 4;
    Program.PalP2X = Program.AreaWidth - 16;

    Program.CenterX = Program.AreaWidth / 2;
    Program.CenterY = Program.AreaHeight / 2;

    Program.PlayAreaMinX = Program.PalP1X + Program.BallRadius;
    Program.PlayAreaMaxX = Program.PalP2X - Program.BallRadius;
    Program.PlayAreaMinY = Program.ScoreY + Program.BallRadius;
    Program.PlayAreaMaxY = Program.AreaHeight - Program.BallRadius;
  }
}

export let run = Program.run;