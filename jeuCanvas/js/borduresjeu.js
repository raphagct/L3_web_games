export default class BorduresJeu {
  constructor(engine, width, height) {
    this.engine = engine;
    this.width = width;
    this.height = height;
  }

  creeBordures() {
    const ground = Matter.Bodies.rectangle(
      this.width / 2,
      this.height + 50,
      this.width,
      100,
      { isStatic: true },
    );
    const murGauche = Matter.Bodies.rectangle(
      -50,
      this.height / 2,
      100,
      this.height,
      { isStatic: true },
    );
    const murDroit = Matter.Bodies.rectangle(
      this.width + 50,
      this.height / 2,
      100,
      this.height,
      { isStatic: true },
    );
    Matter.Composite.add(this.engine.world, [ground, murGauche, murDroit]);
  }

  // Capteur pour détecter si un fruit dépasse la limite rouge
  creeCapteur() {
    this.capteur = Matter.Bodies.rectangle(this.width / 2, 80, this.width, 10, {
      isStatic: true,
      isSensor: true,
      render: { visible: false },
    });
    Matter.Composite.add(this.engine.world, [this.capteur]);
    return this.capteur;
  }

  // On dessine la ligne rouge
  drawLimite(ctx) {
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(0, 80);
    ctx.lineTo(this.width, 80);
    ctx.stroke();
  }
}
