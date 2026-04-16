import { SceneLoader } from "@babylonjs/core";

export class Environment {
  constructor(scene) {
    this.scene = scene;
  }

  async load() {
    // Charger la map exportée depuis Babylon.js Editor
    await SceneLoader.AppendAsync("./map/scene/", "example.babylon", this.scene);

// Debug : liste tous les meshes chargés
    for (const mesh of this.scene.meshes) {
      console.log(`Mesh: "${mesh.name}" | parent: ${mesh.parent?.name ?? "none"}`);
    }

    const MAP_SCALE = 0.005;

    // Activer les collisions sur tous les meshes sauf la skybox et le joueur
    for (const mesh of this.scene.meshes) {
      if (mesh.name.toLowerCase().includes("skybox") || mesh.name.toLowerCase().includes("background")) {
        mesh.checkCollisions = false;
      } else if (mesh.name !== "player") {
        mesh.checkCollisions = true;
        mesh.scaling.scaleInPlace(MAP_SCALE);
        mesh.position.scaleInPlace(MAP_SCALE);
      }
    }

    const hasSkybox = this.scene.meshes.some(m => m.name.toLowerCase().includes("skybox"));
    if (!hasSkybox) {
        this.scene.createDefaultSkybox(null, true, 1000, 0.1, true);
    }
  }
}
