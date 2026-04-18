import * as GUI from "@babylonjs/gui";
import { GameSettings } from "./config.js";
import { MeshBuilder } from "@babylonjs/core";

export class PlayerHUD {
    _realTimeSeconds = 0;
    isPaused = false;

    constructor(scene) {
        this.scene = scene;
        this._ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);

        this._createTimer();
        this._createStatBars();
        this._createWeaponDisplay();
        this._createCrosshair();
        this._createComboUI();

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
        this._weaponText.text = "Blaster Laser";
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

    _createComboUI() {
        this._comboText = new GUI.TextBlock();
        this._comboText.text = "";
        this._comboText.color = "#FFD700";
        this._comboText.fontSize = 48;
        this._comboText.fontStyle = "italic";
        this._comboText.fontWeight = "bold";
        this._comboText.outlineWidth = 4;
        this._comboText.outlineColor = "black";
        this._comboText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._comboText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this._comboText.top = "-100px";
        this._comboText.left = "0px";
        this._ui.addControl(this._comboText);

        this.combo = 0;
        this.comboTimer = 0;

        this.scene.onBeforeRenderObservable.add(() => {
            if (this.comboTimer > 0 && !this.isPaused) {
                this.comboTimer -= this.scene.getEngine().getDeltaTime() / 1000;
                if (this.comboTimer <= 0) {
                    this.combo = 0;
                    this._comboText.text = "";
                }
            }
        });
    }

    addHit() {
        this.combo++;
        this.comboTimer = 3.0; // 3 seconds to keep combo
        
        let txt = "HIT x" + this.combo;
        if (this.combo >= 5) {
            txt = "COMBO x" + this.combo + "!";
            this._comboText.color = "#ff8c00";
        }
        if (this.combo >= 10) {
            txt = "UNSTOPPABLE x" + this.combo + "!!!";
            this._comboText.color = "#ff0000";
        }
        if (this.combo < 5) {
            this._comboText.color = "#FFD700";
        }

        this._comboText.text = txt;
    }

    addKill(position) {
        if (!position) return;

        const dummy = MeshBuilder.CreateSphere("dummyKill", {diameter: 0.1}, this.scene);
        dummy.position = position.clone();
        dummy.isVisible = false;

        const killText = new GUI.TextBlock();
        killText.text = "ELIMINATION!";
        killText.color = "#00ffcc";
        killText.fontFamily = "Impact";
        killText.fontSize = 28;
        killText.outlineWidth = 3;
        killText.outlineColor = "black";
        
        this._ui.addControl(killText);
        killText.linkWithMesh(dummy);
        
        let alpha = 1.5; 
        let offsetY = 0;
        const obs = this.scene.onBeforeRenderObservable.add(() => {
            if(this.isPaused) return;
            alpha -= 0.02;
            offsetY -= 1;
            killText.linkOffsetY = offsetY;
            killText.alpha = Math.min(1, Math.max(0, alpha));
            if (alpha <= 0) {
                this.scene.onBeforeRenderObservable.remove(obs);
                this._ui.removeControl(killText);
                killText.dispose();
                dummy.dispose();
            }
        });
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

    dispose() {
        if (this._ui) {
            this._ui.dispose();
        }
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

export class LoseMenu {
    constructor(scene, onRestart, onQuit) {
        this._ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("LoseUI", true, scene);

        const background = new GUI.Rectangle();
        background.width = 1;
        background.height = 1;
        background.background = "rgba(100, 0, 0, 0.7)";
        background.thickness = 0;
        this._ui.addControl(background);

        const panel = new GUI.StackPanel();
        panel.width = "300px";
        panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        background.addControl(panel);

        const title = new GUI.TextBlock();
        title.text = "TU ES MORT";
        title.color = "red";
        title.fontSize = 48;
        title.height = "80px";
        panel.addControl(title);

        const restartBtn = GUI.Button.CreateSimpleButton("restart", "Recommencer");
        restartBtn.width = "200px";
        restartBtn.height = "40px";
        restartBtn.color = "white";
        restartBtn.background = "black";
        restartBtn.paddingBottom = "10px";
        restartBtn.onPointerUpObservable.add(() => {
            if (onRestart) onRestart();
        });
        panel.addControl(restartBtn);

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
    constructor(scene, onPlayClick, onSettingsClick, onToggleMusicMute, initialAudioState = {}) {
        this._ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("StartUI", true, scene);
        this._ui.idealHeight = 720;

        const bgImage = new GUI.Image("startBg", "./textures/menu/start_bg.png");
        bgImage.width = 1;
        bgImage.height = 1;
        bgImage.stretch = GUI.Image.STRETCH_FILL;
        this._ui.addControl(bgImage);

        const overlay = new GUI.Rectangle();
        overlay.width = 1;
        overlay.height = 1;
        overlay.background = "rgba(4, 8, 16, 0.4)";
        overlay.thickness = 0;
        this._ui.addControl(overlay);

        const panel = new GUI.StackPanel();
        panel.width = "100%";
        panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        overlay.addControl(panel);

        const title = new GUI.TextBlock();
        title.text = "S.U.D.O";
        title.color = "#F8FBFF";
        title.fontSize = 146;
        title.height = "180px";
        title.fontFamily = "Arial Black";
        title.fontWeight = "bold";
        title.shadowColor = "rgba(0, 0, 0, 0.95)";
        title.shadowBlur = 28;
        title.shadowOffsetX = 0;
        title.shadowOffsetY = 8;
        panel.addControl(title);

        const subtitle = new GUI.TextBlock();
        subtitle.text = "Résistez a l'IA. Reprenez le controle.";
        subtitle.color = "rgba(235, 244, 255, 0.95)";
        subtitle.fontSize = 30;
        subtitle.height = "70px";
        subtitle.fontFamily = "Arial";
        panel.addControl(subtitle);

        const buttonPanel = new GUI.StackPanel();
        buttonPanel.width = "400px";
        buttonPanel.paddingTop = "18px";
        panel.addControl(buttonPanel);

        const startBtn = GUI.Button.CreateSimpleButton("start", "COMMENCER");
        startBtn.width = "400px";
        startBtn.height = "72px";
        startBtn.color = "white";
        startBtn.background = "#1B8DFE";
        startBtn.thickness = 0;
        startBtn.cornerRadius = 10;
        startBtn.fontSize = 30;
        startBtn.fontFamily = "Arial Black";
        startBtn.shadowColor = "black";
        startBtn.shadowBlur = 12;
        startBtn.shadowOffsetX = 0;
        startBtn.shadowOffsetY = 5;

        startBtn.onPointerEnterObservable.add(() => {
            startBtn.background = "#45B6FF";
            startBtn.scaleX = 1.03;
            startBtn.scaleY = 1.03;
        });
        startBtn.onPointerOutObservable.add(() => {
            startBtn.background = "#1F9CFF";
            startBtn.scaleX = 1;
            startBtn.scaleY = 1;
        });
        startBtn.onPointerDownObservable.add(() => {
            if (onPlayClick) onPlayClick();
        });
        buttonPanel.addControl(startBtn);

        const settingsBtn = GUI.Button.CreateSimpleButton("openSettings", "PARAMÈTRES");
        settingsBtn.width = "400px";
        settingsBtn.height = "58px";
        settingsBtn.color = "white";
        settingsBtn.background = "rgba(8, 20, 39, 0.82)";
        settingsBtn.thickness = 1;
        settingsBtn.cornerRadius = 10;
        settingsBtn.fontSize = 22;
        settingsBtn.fontFamily = "Arial";
        settingsBtn.paddingTop = "12px";
        settingsBtn.onPointerEnterObservable.add(() => {
            settingsBtn.background = "rgba(20, 46, 81, 0.92)";
        });
        settingsBtn.onPointerOutObservable.add(() => {
            settingsBtn.background = "rgba(8, 20, 39, 0.82)";
        });
        settingsBtn.onPointerUpObservable.add(() => {
            if (onSettingsClick) onSettingsClick();
        });
        buttonPanel.addControl(settingsBtn);

        let isMuted = Boolean(initialAudioState.isMuted);
        const muteButton = GUI.Button.CreateSimpleButton("muteMusic", isMuted ? "Musique: OFF" : "Musique: ON");
        muteButton.width = "200px";
        muteButton.height = "42px";
        muteButton.color = "white";
        muteButton.background = "rgba(11, 25, 48, 0.86)";
        muteButton.thickness = 1;
        muteButton.cornerRadius = 8;
        muteButton.fontSize = 16;
        muteButton.paddingTop = "10px";
        muteButton.onPointerUpObservable.add(() => {
            isMuted = !isMuted;
            muteButton.textBlock.text = isMuted ? "Musique: OFF" : "Musique: ON";
            if (onToggleMusicMute) onToggleMusicMute(isMuted);
        });
        panel.addControl(muteButton);

        const hint = new GUI.TextBlock();
        hint.text = "Cliquez pour activer le son";
        hint.color = "rgba(230, 238, 255, 0.8)";
        hint.fontSize = 14;
        hint.height = "30px";
        hint.paddingTop = "6px";
        panel.addControl(hint);
    }

    dispose() {
        this._ui.dispose();
    }
}

export class CutsceneMenu {
    constructor(scene, onNextClick, title="CINÉMATIQUE", text="...") {
        this._ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("CutsceneUI", true, scene);

        // Image de fond pour la cinématique
        const bgImage = new GUI.Image("cutsceneBg", "./textures/menu/cutscene_bg.png");
        bgImage.width = 1;
        bgImage.height = 1;
        bgImage.stretch = GUI.Image.STRETCH_FILL;
        this._ui.addControl(bgImage);

        const overlay = new GUI.Rectangle();
        overlay.width = 1;
        overlay.height = 1;
        overlay.background = "rgba(0, 0, 0, 0.75)"; // Assombrit l'image pour lire le lore
        overlay.thickness = 0;
        this._ui.addControl(overlay);

        // Le panneau du Lore
        const lorePanel = new GUI.StackPanel();
        lorePanel.width = "800px";
        lorePanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        lorePanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this._ui.addControl(lorePanel);

        const loreTitle = new GUI.TextBlock();
        loreTitle.text = title;
        loreTitle.color = "#FFD700";
        loreTitle.fontSize = 36;
        loreTitle.height = "60px";
        loreTitle.fontFamily = "Courier New, monospace";
        loreTitle.fontWeight = "bold";
        lorePanel.addControl(loreTitle);

        const loreText = new GUI.TextBlock();
        loreText.text = text;
        loreText.color = "white";
        loreText.fontSize = 24;
        loreText.height = "300px";
        loreText.textWrapping = GUI.TextWrapping.WordWrap;
        loreText.fontFamily = "Arial";
        loreText.fontStyle = "italic";
        loreText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        lorePanel.addControl(loreText);

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

        const next = GUI.Button.CreateSimpleButton("next", "SUIVANT \u2192");
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

export class SettingsMenu {
    constructor(scene, onBack) {
        this._ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("SettingsUI", true, scene);

        const background = new GUI.Rectangle();
        background.width = 1;
        background.height = 1;
        background.background = "rgba(0, 0, 0, 0.9)";
        background.thickness = 0;
        this._ui.addControl(background);

        const panel = new GUI.StackPanel();
        panel.width = "400px";
        panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        background.addControl(panel);

        const title = new GUI.TextBlock();
        title.text = "PARAMETRES";
        title.color = "white";
        title.fontSize = 40;
        title.height = "60px";
        panel.addControl(title);
        
        const createKeyMapButton = (label, action) => {
            const hPanel = new GUI.StackPanel();
            hPanel.isVertical = false;
            hPanel.height = "50px";
            hPanel.paddingBottom = "10px";
            
            const text = new GUI.TextBlock();
            text.text = label;
            text.color = "white";
            text.width = "200px";
            text.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            hPanel.addControl(text);
            
            const btn = GUI.Button.CreateSimpleButton("btn_" + action, GameSettings.keys[action].toUpperCase());
            btn.width = "150px";
            btn.color = "white";
            btn.background = "grey";
            
            let isAssigning = false;
            
            const keydownHandler = (e) => {
                if (!isAssigning) return;
                e.preventDefault();
                btn.textBlock.text = e.key.toUpperCase();
                GameSettings.keys[action] = e.key.toLowerCase();
                isAssigning = false;
            };

            btn.onPointerUpObservable.add(() => {
                btn.textBlock.text = "...";
                isAssigning = true;
                const onceHandler = (e) => {
                    keydownHandler(e);
                    window.removeEventListener("keydown", onceHandler);
                };
                window.addEventListener("keydown", onceHandler);
            });
            hPanel.addControl(btn);
            panel.addControl(hPanel);
        };

        createKeyMapButton("Avancer", "forward");
        createKeyMapButton("Reculer", "backward");
        createKeyMapButton("Gauche", "left");
        createKeyMapButton("Droite", "right");

        const spacer = new GUI.Rectangle();
        spacer.height = "30px";
        spacer.thickness = 0;
        panel.addControl(spacer);

        const createSlider = (label, settingKey, onChange) => {
            const hPanel = new GUI.StackPanel();
            hPanel.isVertical = false;
            hPanel.height = "60px";
            hPanel.paddingBottom = "10px";
            
            const text = new GUI.TextBlock();
            text.text = label;
            text.color = "white";
            text.width = "200px";
            text.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            hPanel.addControl(text);
            
            const slider = new GUI.Slider();
            slider.minimum = 0;
            slider.maximum = 1;
            slider.value = GameSettings[settingKey];
            slider.width = "150px";
            slider.color = "green";
            slider.background = "grey";
            slider.onValueChangedObservable.add((value) => {
                GameSettings[settingKey] = value;
                if (onChange) onChange(value);
            });
            hPanel.addControl(slider);
            panel.addControl(hPanel);
        };

        createSlider("Volume G\u00e9n\u00e9ral", "masterVolume", (val) => {
            try {
                const engine = scene.getEngine();
                if (engine.audioEngine) {
                    engine.audioEngine.setGlobalVolume(val);
                } else if (engine.getAudioEngine && engine.getAudioEngine()) {
                    engine.getAudioEngine().setGlobalVolume(val);
                }
            } catch(e) {}
        });
        
        createSlider("Volume Musique", "musicVolume", (val) => {
            // Utilisable lorsque des sons ou de la musique seront ajoutés
        });

        const spacer2 = new GUI.Rectangle();
        spacer2.height = "20px";
        spacer2.thickness = 0;
        panel.addControl(spacer2);

        const backBtn = GUI.Button.CreateSimpleButton("back", "Retour");
        backBtn.width = "200px";
        backBtn.height = "40px";
        backBtn.color = "white";
        backBtn.background = "red";
        backBtn.onPointerUpObservable.add(() => {
            if (onBack) onBack();
        });
        panel.addControl(backBtn);
        
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