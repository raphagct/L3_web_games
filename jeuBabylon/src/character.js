import * as BABYLON from "@babylonjs/core";

export default class Player {
  constructor(scene, hud) {
    this.scene = scene;
    this.hud = hud; 
    this.mesh = BABYLON.MeshBuilder.CreateBox("player", { size: 1 }, scene);
    this.mesh.position.y = 0.5;

    // Statistiques du joueur
    this.maxHealth = 100;
    this.health = 100;
    this.maxFood = 100;
    this.food = 100;

    // Initialiser l'affichage au démarrage
    this.hud.updateHealth(this.health, this.maxHealth);
    this.hud.updateFood(this.food, this.maxFood);
  }

  takeDamage(amount) {
    this.health -= amount;
    this.hud.updateHealth(this.health, this.maxHealth);
  }

  eat(amount) {
    this.food += amount;
    this.hud.updateFood(this.food, this.maxFood);
  }
}