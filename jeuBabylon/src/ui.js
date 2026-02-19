import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";

export class PlayerHUD {
    _inGameTimeMinutes = 8 * 60;
    _timeSpeed = 10;
    isPaused = false;

    constructor(scene) {
        this._ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        this._createTimer();
        this._createStatBars();
        this._createWeaponDisplay();

        scene.onBeforeRenderObservable.add(() => {
            if (!this.isPaused) {
                const deltaTimeInSeconds = scene.getEngine().getDeltaTime() / 1000;
                this._updateTimer(deltaTimeInSeconds);
            }
        });
    }

    _createTimer() {
        this._timeText = new GUI.TextBlock();
        this._timeText.text = "08:00";
        this._timeText.color = "white";
        this._timeText.fontSize = 32;
        this._timeText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._timeText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this._timeText.top = "20px";
        this._timeText.outlineWidth = 4;
        this._timeText.outlineColor = "black";
        
        this._ui.addControl(this._timeText);
    }

    _createStatBars() {
        const statsPanel = new GUI.StackPanel();
        statsPanel.width = "250px";
        statsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        statsPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        statsPanel.top = "20px";
        statsPanel.left = "20px";
        this._ui.addControl(statsPanel);

        const healthContainer = new GUI.Rectangle();
        healthContainer.width = "200px";
        healthContainer.height = "25px";
        healthContainer.thickness = 2;
        healthContainer.background = "black";
        statsPanel.addControl(healthContainer);

        this._healthBarInner = new GUI.Rectangle();
        this._healthBarInner.width = "100%"; 
        this._healthBarInner.background = "red";
        this._healthBarInner.thickness = 0;
        this._healthBarInner.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        healthContainer.addControl(this._healthBarInner);

        this._healthText = new GUI.TextBlock();
        this._healthText.text = "100/100";
        this._healthText.color = "white";
        this._healthText.fontSize = 14;
        this._healthText.outlineWidth = 2;
        this._healthText.outlineColor = "black";
        healthContainer.addControl(this._healthText);

        const foodContainer = new GUI.Rectangle();
        foodContainer.width = "200px";
        foodContainer.height = "25px";
        foodContainer.thickness = 2;
        foodContainer.background = "black";
        foodContainer.paddingTop = "10px"; 
        statsPanel.addControl(foodContainer);

        this._foodBarInner = new GUI.Rectangle();
        this._foodBarInner.width = "100%";
        this._foodBarInner.background = "orange";
        this._foodBarInner.thickness = 0;
        this._foodBarInner.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        foodContainer.addControl(this._foodBarInner);

        this._foodText = new GUI.TextBlock();
        this._foodText.text = "100/100";
        this._foodText.color = "white";
        this._foodText.fontSize = 14;
        this._foodText.outlineWidth = 2;
        this._foodText.outlineColor = "black";
        foodContainer.addControl(this._foodText);
    }

    _createWeaponDisplay() {
        this._weaponText = new GUI.TextBlock();
        this._weaponText.text = "Arme: Épée en bois";
        this._weaponText.color = "white";
        this._weaponText.fontSize = 24;
        this._weaponText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._weaponText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._weaponText.top = "-20px";
        this._weaponText.left = "-20px";
        this._weaponText.outlineWidth = 3;
        this._weaponText.outlineColor = "black";
        
        this._ui.addControl(this._weaponText);
    }

    _updateTimer(deltaTimeInSeconds) {
        this._inGameTimeMinutes += deltaTimeInSeconds * this._timeSpeed;

        const hours = Math.floor(this._inGameTimeMinutes / 60) % 24;
        const minutes = Math.floor(this._inGameTimeMinutes % 60);

        const formattedHours = hours < 10 ? "0" + hours : hours;
        const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;

        this._timeText.text = `${formattedHours}:${formattedMinutes}`;
    }

    updateHealth(current, max = 100) {
        const clamp = Math.max(0, Math.min(max, current));
        const percentage = (clamp / max) * 100;
        
        this._healthBarInner.width = `${percentage}%`;
        this._healthText.text = `${Math.round(clamp)}/${max}`;
    }

    updateFood(current, max = 100) {
        const clamp = Math.max(0, Math.min(max, current));
        const percentage = (clamp / max) * 100;
        
        this._foodBarInner.width = `${percentage}%`;
        this._foodText.text = `${Math.round(clamp)}/${max}`;
    }

    updateWeapon(weaponName) {
        this._weaponText.text = `Arme: ${weaponName}`;
    }
}