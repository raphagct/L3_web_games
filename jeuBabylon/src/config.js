const savedSettings = JSON.parse(localStorage.getItem("sudo_game_settings") || "{}");

export const GameSettings = {
    keys: savedSettings.keys || {
        forward: "z",
        backward: "s",
        left: "q",
        right: "d"
    },
    masterVolume: savedSettings.masterVolume !== undefined ? savedSettings.masterVolume : 1.0,
    musicVolume: savedSettings.musicVolume !== undefined ? savedSettings.musicVolume : 0.5
};

export function saveSettings() {
    localStorage.setItem("sudo_game_settings", JSON.stringify(GameSettings));
}
