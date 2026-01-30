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
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(positionBody.x, positionBody.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // change la taille et la couleur selon le type de fruit
  getAttributsSelonTypes() {
    switch (this.type) {
      case "myrtille":
        this.radius = 20;
        this.color = "blue";
        break; 
      case "cerise":
        this.radius = 30;
        this.color = "darkred";
        break;
      case "kaki":
        this.radius = 40;
        this.color = "green";
        break;
      case "banane":
        this.radius = 50;
        this.color = "yellow";
        break;
      case "orange":
        this.radius = 60;
        this.color = "orange";
        break;
      case "pomme":
        this.radius = 70;
        this.color = "red";
        break;
      case "coco":
        this.radius = 90;
        this.color = "brown";
        break;
      case "melon":
        this.radius = 100;
        this.color = "lightgreen";
        break;
      case "ananas":
        this.radius = 110;
        this.color = "gold";
        break;
      case "pasteque":
        this.radius = 120;
        this.color = "darkgreen";
        break;
      default:
        this.radius = 30;
        this.color = "gray";
        break;
    }
  }
}
