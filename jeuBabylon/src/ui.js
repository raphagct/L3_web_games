import * as GUI from "@babylonjs/gui";

export class PlayerHUD {
    _realTimeSeconds = 0;
    isPaused = false;

    constructor(scene) {
        this._ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);

        this._createTimer();
        this._createStatBars();
        this._createWeaponDisplay();
        this._createCrosshair();

        scene.onBeforeRenderObservable.add(() => {
            if (!this.isPaused) {
                const deltaTimeInSeconds = scene.getEngine().getDeltaTime() / 1000;
                this._updateTimer(deltaTimeInSeconds);
            }
        });
    }

    _createTimer() {
        this._timeText = new GUI.TextBlock();
        this._timeText.text = "00:00";
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

    _createCrosshair() {
        // Ligne horizontale du viseur
        const horizontal = new GUI.Rectangle();
        horizontal.width = "20px";
        horizontal.height = "2px";
        horizontal.background = "white";
        horizontal.thickness = 1;
        horizontal.color = "black";
        horizontal.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        horizontal.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this._ui.addControl(horizontal);

        // Ligne verticale du viseur
        const vertical = new GUI.Rectangle();
        vertical.width = "2px";
        vertical.height = "20px";
        vertical.background = "white";
        vertical.thickness = 1;
        vertical.color = "black";
        vertical.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        vertical.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this._ui.addControl(vertical);
    }

    _updateTimer(deltaTimeInSeconds) {
        this._realTimeSeconds += deltaTimeInSeconds;

        const minutes = Math.floor(this._realTimeSeconds / 60);
        const seconds = Math.floor(this._realTimeSeconds % 60);

        const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
        const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;

        this._timeText.text = `${formattedMinutes}:${formattedSeconds}`;
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

export class PauseMenu {
    constructor(scene, onResume, onSettings, onQuit) {
        this._ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("PauseUI", true, scene);

        const background = new GUI.Rectangle();
        background.width = 1;
        background.height = 1;
        background.background = "rgba(0, 0, 0, 0.7)";
        background.thickness = 0;
        this._ui.addControl(background);

        const panel = new GUI.StackPanel();
        panel.width = "300px";
        panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        background.addControl(panel);

        const title = new GUI.TextBlock();
        title.text = "PAUSE";
        title.color = "white";
        title.fontSize = 48;
        title.height = "80px";
        panel.addControl(title);

        const resumeBtn = GUI.Button.CreateSimpleButton("resume", "Continuer");
        resumeBtn.width = "200px";
        resumeBtn.height = "40px";
        resumeBtn.color = "white";
        resumeBtn.background = "green";
        resumeBtn.paddingBottom = "10px";
        resumeBtn.onPointerUpObservable.add(() => {
            if (onResume) onResume();
        });
        panel.addControl(resumeBtn);

        const settingsBtn = GUI.Button.CreateSimpleButton("settings", "Paramètres");
        settingsBtn.width = "200px";
        settingsBtn.height = "40px";
        settingsBtn.color = "white";
        settingsBtn.background = "gray";
        settingsBtn.paddingBottom = "10px";
        settingsBtn.onPointerUpObservable.add(() => {
            if (onSettings) onSettings();
        });
        panel.addControl(settingsBtn);

        const quitBtn = GUI.Button.CreateSimpleButton("quit", "Quitter");
        quitBtn.width = "200px";
        quitBtn.height = "40px";
        quitBtn.color = "white";
        quitBtn.background = "red";
        quitBtn.onPointerUpObservable.add(() => {
            if (onQuit) onQuit();
        });
        panel.addControl(quitBtn);

        this.hide();
    }

    show() {
        this._ui.rootContainer.isVisible = true;
    }

    hide() {
        this._ui.rootContainer.isVisible = false;
    }

    dispose() {
        this._ui.dispose();
    }
}

export class StartMenu {
    constructor(scene, onPlayClick) {
        this._ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("StartUI", true, scene);
        this._ui.idealHeight = 720;

        const background = new GUI.Rectangle();
        background.width = 1;
        background.height = 1;
        background.background = "rgba(0, 0, 0, 0.4)";
        background.thickness = 0;
        this._ui.addControl(background);

        const panel = new GUI.StackPanel();
        panel.width = "100%";
        panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        background.addControl(panel);

        const title = new GUI.TextBlock();
        title.text = "SURVIE EN MILIEU HOSTILE";
        title.color = "#FFD700"; 
        title.fontSize = 52;
        title.height = "100px";
        title.fontFamily = "Courier New, monospace";
        title.fontWeight = "bold";
        title.shadowColor = "black";
        title.shadowBlur = 10;
        title.shadowOffsetX = 3;
        title.shadowOffsetY = 3;
        title.resizeToFit = true;
        panel.addControl(title);

        const subtitle = new GUI.TextBlock();
        subtitle.text = "Explorez, survolez et combattez.";
        subtitle.color = "white";
        subtitle.fontSize = 20;
        subtitle.height = "40px";
        subtitle.fontFamily = "Arial";
        panel.addControl(subtitle);

        const spacer = new GUI.Rectangle();
        spacer.height = "50px";
        spacer.thickness = 0;
        panel.addControl(spacer);

        const startBtn = GUI.Button.CreateSimpleButton("start", "PLAY");
        startBtn.width = "250px";
        startBtn.height = "60px";
        startBtn.color = "white";
        startBtn.background = "#E53935";
        startBtn.thickness = 4;
        startBtn.cornerRadius = 10;
        startBtn.fontSize = 28;
        startBtn.fontFamily = "Impact";

        startBtn.onPointerEnterObservable.add(() => {
            startBtn.background = "#FF5252";
            startBtn.scaleX = 1.05;
            startBtn.scaleY = 1.05;
        });
        startBtn.onPointerOutObservable.add(() => {
            startBtn.background = "#E53935";
            startBtn.scaleX = 1;
            startBtn.scaleY = 1;
        });

        startBtn.onPointerDownObservable.add(() => {
            if (onPlayClick) onPlayClick();
        });
        panel.addControl(startBtn);
    }

    dispose() {
        this._ui.dispose();
    }
}

export class CutsceneMenu {
    constructor(scene, onNextClick) {
        this._ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("CutsceneUI", true, scene);

        const skipText = new GUI.TextBlock();
        skipText.text = "Appuyez sur Suivant pour passer...";
        skipText.color = "white";
        skipText.fontSize = 18;
        skipText.alpha = 0.7;
        skipText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        skipText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        skipText.top = "20px";
        skipText.left = "-20px";
        this._ui.addControl(skipText);

        const next = GUI.Button.CreateSimpleButton("next", "NEXT \u2192");
        next.color = "white";
        next.thickness = 2;
        next.background = "rgba(0, 0, 0, 0.6)";
        next.cornerRadius = 8;
        next.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        next.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        next.width = "120px";
        next.height = "50px";
        next.top = "-20px";
        next.left = "-20px";
        next.fontSize = 22;

        next.onPointerEnterObservable.add(() => {
            next.background = "rgba(100, 100, 100, 0.8)";
        });
        next.onPointerOutObservable.add(() => {
            next.background = "rgba(0, 0, 0, 0.6)";
        });

        next.onPointerUpObservable.add(() => {
            if (onNextClick) onNextClick();
        });

        this._ui.addControl(next);
    }

    dispose() {
        this._ui.dispose();
    }
}