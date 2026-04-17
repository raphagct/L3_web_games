import { SceneLoader,Color3, GlowLayer } from "@babylonjs/core";

import NeonScript from "./scripts/NeonScript.ts";
import NeonScriptI from "./scripts/NeonScriptI.ts";
import LavaScript from "./scripts/LavaScript.ts";
import PoisonScript from "./scripts/PoisonScript.ts";

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

    for (const mesh of this.scene.meshes) {
  if (mesh.name.toLowerCase().includes("pillier")) {
    console.log(`${mesh.name} | pos: ${mesh.position} | scaling: ${mesh.scaling}`);
  }
}


    // Script ne touchez PAS !!!!!!!!!!!!!!!!!

    const glowLayerBase = new GlowLayer("neonGlowBase", this.scene);
    glowLayerBase.intensity = 0.2;

    const glowLayerIntense = new GlowLayer("neonGlowIntense", this.scene);
    glowLayerIntense.intensity = 0.5;


 
    for (const mesh of this.scene.meshes) {
      
      // --- NÉONS INTENSES (On passe glowLayerIntense) ---
      if (mesh.name.toLowerCase().includes("nfr")){
         const neonColor = new Color3(1.0, 0.0, 0.0); 
         // Ajoutez le layer en 3ème paramètre
         const scriptNeon = new NeonScriptI(mesh, neonColor, glowLayerIntense);
         scriptNeon.onStart();
      }
      if (mesh.name.toLowerCase().includes("nfb")){
         const neonColor = new Color3(0.0, 0.5, 1.0);
         const scriptNeon = new NeonScriptI(mesh, neonColor, glowLayerIntense);
         scriptNeon.onStart();
      }
      if (mesh.name.toLowerCase().includes("nfrose")){
         const neonColor = new Color3(1.0, 0.1, 0.8);
         const scriptNeon = new NeonScriptI(mesh, neonColor, glowLayerIntense);
         scriptNeon.onStart();
      }
      //noir
      if (mesh.name.toLowerCase().includes("nfn")){
         const neonColor = new Color3(0.0, 0.0, 0.0);
         const scriptNeon = new NeonScriptI(mesh, neonColor, glowLayerIntense);
         scriptNeon.onStart();
      }
      if (mesh.name.toLowerCase().includes("nfj")){
         const neonColor = new Color3(1.0, 1.0, 0.0);
         const scriptNeon = new NeonScriptI(mesh, neonColor, glowLayerIntense);
         scriptNeon.onStart();
      }
      //green
      if (mesh.name.toLowerCase().includes("nfg")){
         const neonColor = new Color3(0.0, 1.0, 0.0);
         const scriptNeon = new NeonScriptI(mesh, neonColor, glowLayerIntense);
         scriptNeon.onStart();
      }
      

      if (mesh.name.toLowerCase().includes("neonrouge")){
         const neonColor = new Color3(1.0, 0.0, 0.0); 
         // Ajoutez le layer en 3ème paramètre
         const scriptNeon = new NeonScript(mesh, neonColor, glowLayerBase);
         scriptNeon.onStart();
      }
      if (mesh.name.toLowerCase().includes("neonbleu")){
        const neonColor = new Color3(0.0, 0.5, 1.0);
        const scriptNeon = new NeonScript(mesh, neonColor, glowLayerBase);
        scriptNeon.onStart();
      }
      if (mesh.name.toLowerCase().includes("neonrose")){
        const neonColor = new Color3(1.0, 0.1, 0.8);
        const scriptNeon = new NeonScript(mesh, neonColor, glowLayerBase);
        scriptNeon.onStart();
      }
      if (mesh.name.toLowerCase().includes("neonjaune")){
         const neonColor = new Color3(1.0, 1.0, 0.0); 
         const scriptNeon = new NeonScript(mesh, neonColor, glowLayerBase);
         scriptNeon.onStart();
      }
      if (mesh.name.toLowerCase().includes("neonblanc")){
         const neonColor = new Color3(1.0, 1.0, 1.0); 
         const scriptNeon = new NeonScript(mesh, neonColor, glowLayerBase);
         scriptNeon.onStart();
      }


    }
  
    
    for (const mesh of this.scene.meshes) {
    if (mesh.name.toLowerCase().includes("lave") ||mesh.name.toLowerCase().includes("lava")) {
        const scriptLava = new LavaScript(mesh);
        scriptLava.onStart();
    }
    }
    
    for (const mesh of this.scene.meshes) {
    if (mesh.name.toLowerCase().includes("poison")) {
        const scriptPoison = new PoisonScript(mesh);
        scriptPoison.onStart();
    }
    }
    


    // ?
    const hasSkybox = this.scene.meshes.some(m => m.name.toLowerCase().includes("skybox"));
    if (!hasSkybox) {
        this.scene.createDefaultSkybox(null, true, 1000, 0.1, true);
    }

  }
}
