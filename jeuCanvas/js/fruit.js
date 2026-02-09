export default class Fruit {
  constructor(x, y, engine, Bodies, Composite, image) {
    this.getAttributsSelonTypes();
    this.engine = engine;
    this.Bodies = Bodies;
    this.Composite = Composite;
    this.image = image;
    //on crée le fruit dans le monde physique
    this.body = this.Bodies.circle(x, y, this.radius / 2, {
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
    ctx.drawImage(
      this.image,
      positionBody.x - this.radius,
      positionBody.y - this.radius,
      this.radius * 2,
      this.radius * 2,
    );
    //draw circle around the fruit for debug
    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.arc(positionBody.x, positionBody.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}