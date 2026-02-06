export default class Fruit {
  constructor(x, y, type, engine, Bodies, Composite) {
    this.type = type;
    this.getAttributsSelonTypes();
    this.engine = engine;
    this.Bodies = Bodies;
    this.Composite = Composite;
    //on crée le fruit dans le monde physique
    this.body = this.Bodies.circle(x, y, this.radius, {
      restitution: 0.6, // rebond
      friction: 0.5, // glisse
      density: 0.002, // densité (masse en gros)
    });
    // on ajoute le fruit dans le monde physique
    this.Composite.add(this.engine.world, [this.body]);
  }

  draw(ctx) {
    // dessine le fruit à partir de son body physique
    const positionBody = this.body.position;
    const img = new Image();
    img.src = this.path;
    ctx.drawImage(
      img,
      positionBody.x - this.radius,
      positionBody.y - this.radius,
      this.radius * 2,
      this.radius * 2,
    );
    ctx.beginPath();
    ctx.arc(positionBody.x, positionBody.y, this.radius, 0, Math.PI * 2);
  }

  // change la taille et la couleur selon le type de fruit
  getAttributsSelonTypes() {
    switch (this.type) {
      case "myrtille":
        this.radius = 20;
        this.path = "./assets/img/myrtille.png";
        break;
      case "cerise":
        this.radius = 30;
        this.path = "./assets/img/cerise.png";
        break;
      case "kaki":
        this.radius = 40;
        this.path = "./assets/img/kaki.png";
        break;
      case "banane":
        this.radius = 50;
        this.path = "./assets/img/banane.png";
        break;
      case "orange":
        this.radius = 60;
        this.path = "./assets/img/orange.png";
        break;
      case "pomme":
        this.radius = 70;
        this.path = "./assets/img/pomme.png";
        break;
      case "coco":
        this.radius = 90;
        this.path = "./assets/img/coco.png";
        break;
      case "melon":
        this.radius = 100;
        this.path = "./assets/img/melon.png";
        break;
      case "ananas":
        this.radius = 110;
        this.path = "./assets/img/ananas.png";
        break;
      case "pasteque":
        this.radius = 120;
        this.path = "./assets/img/pasteque.png";
        break;
      default:
        this.radius = 30;
        this.path = "./assets/img/default.png";
        break;
    }
  }
}
