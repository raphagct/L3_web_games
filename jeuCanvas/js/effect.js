//code entièrement généré par IA

export default class EffetEvolution {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = (color === "white" || !color) ? "#FFD700" : color;

    this.particles = [];
    this.rings = [];

    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        size: Math.random() * 5 + 3,
        decay: Math.random() * 0.03 + 0.02
      });
    }

    this.rings.push({ r: radius * 0.5, alpha: 1, width: 10, speed: 10 });
    this.rings.push({ r: radius * 0.8, alpha: 0.8, width: 5, speed: 6 });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.alpha -= p.decay;
      p.size *= 0.95;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.r += r.speed;
      r.alpha -= 0.05;
      r.width *= 0.9;
      if (r.alpha <= 0) this.rings.splice(i, 1);
    }
  }

  draw(ctx) {
    ctx.save();

    if (this.rings.length > 0 && this.rings[0].alpha > 0.5) {
      ctx.globalAlpha = this.rings[0].alpha * 0.6;
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15; // Effet de lueur
    this.rings.forEach(r => {
      if (r.alpha > 0) {
        ctx.globalAlpha = r.alpha;
        ctx.lineWidth = Math.max(0.5, r.width);
        ctx.beginPath();
        ctx.arc(this.x, this.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    ctx.shadowBlur = 0;

    // Dessin des particules
    ctx.fillStyle = this.color;
    this.particles.forEach(p => {
      if (p.alpha > 0) {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }

  isFinished() {
    return this.particles.length === 0 && this.rings.length === 0;
  }
}
