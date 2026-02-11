import { getRadiusFruit } from "./fruitUtils.js";

export default class Fruit {
  constructor(x, y, engine, Bodies, Composite, type, image, radius = null) {
    this.engine = engine;
    this.Bodies = Bodies;
    this.Composite = Composite;
    this.type = type;
    this.image = image;
    // Utiliser le rayon fourni ou celui par défaut
    this.radius = radius || getRadiusFruit(type)

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
    const angle = this.body.angle; // Récupérer l'angle du corps
    const scaleFactor = 1.4;
    const drawRadius = this.radius * scaleFactor;

    ctx.save(); // Sauvegarder le contexte actuel
    ctx.translate(positionBody.x, positionBody.y); // Déplacer l'origine au centre du fruit
    ctx.rotate(angle); // Faire tourner le contexte

    ctx.drawImage(
      this.image,
      -drawRadius, // Dessiner centré sur (0,0) locale
      -drawRadius,
      drawRadius * 2,
      drawRadius * 2,
    );

    ctx.restore(); // Restaurer le contexte
  }
}
