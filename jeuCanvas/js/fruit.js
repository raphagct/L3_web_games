import { getRadiusFruit } from "./fruitUtils.js";

export default class Fruit {
  constructor(x, y, engine, type, image, radius) {
    this.engine = engine;
    this.type = type;
    this.image = image;
    // On utilise le radius fourni ou sinon on le calcule en fonction du type de fruit
    if (radius) {
      this.radius = radius;
    } else {
      this.radius = getRadiusFruit(type);
    }

    //on init le fruit dans le monde physique (Matter.js)
    this.body = Matter.Bodies.circle(x, y, this.radius, {
      restitution: 0.2, // rebond
      friction: 0.5, // glisse
      density: 0.002, // densité (masse en gros)
    });

    // on ajoute le fruit dans le monde physique
    Matter.Composite.add(this.engine.world, [this.body]);
  }

  draw(ctx) {
    // dessine le fruit à la position du fruit du monde physique
    const positionBody = this.body.position;
    const angle = this.body.angle;
    const hitboxDiff = 1.4; // fix du rayon car les images des fruits ne sont pas parfaitement rondes
    const drawRadius = this.radius * hitboxDiff;

    ctx.save();
    // on fais tourner le fruit quand il se déplace
    ctx.translate(positionBody.x, positionBody.y);
    ctx.rotate(angle);

    ctx.drawImage(
      this.image,
      -drawRadius,
      -drawRadius,
      drawRadius * 2,
      drawRadius * 2,
    );

    ctx.restore();
  }
}
