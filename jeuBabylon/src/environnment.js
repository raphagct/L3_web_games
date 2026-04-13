import { SceneLoader } from "@babylonjs/core";

export class Environment {
  constructor(scene) {
    this.scene = scene;
  }

  async load() {
    // Charger la map exportée depuis Babylon.js Editor
    await SceneLoader.AppendAsync("./map/scene/", "example.babylon", this.scene);

    // Activer les collisions sur tous les meshes sauf la skybox et le joueur
    for (const mesh of this.scene.meshes) {
      if (mesh.name === "skyBox") {
        mesh.checkCollisions = false;
      } else if (mesh.name !== "player") {
        mesh.checkCollisions = true;
      }
    }
  }
}
