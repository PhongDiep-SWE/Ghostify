import { useState } from "react";
import { api } from "../api";

const LIVE_WINDOW = { width: 440, height: 300, offsetY: 40 };

export function useLiveMode() {
  const [liveFolder, setLiveFolder] = useState(null);
  const [savedBounds, setSavedBounds] = useState(null);

  async function handleGoLive(folder) {
    const current = await api.livemode.getBounds();
    setSavedBounds(current);
    const { width: sw } = window.screen;
    await api.livemode.goLive({
      x: Math.round((sw - LIVE_WINDOW.width) / 2),
      y: LIVE_WINDOW.offsetY,
      width: LIVE_WINDOW.width,
      height: LIVE_WINDOW.height,
    });
    setLiveFolder(folder);
  }

  async function handleExitLive() {
    await api.livemode.exitLive(savedBounds);
    setLiveFolder(null);
  }

  return { liveFolder, handleGoLive, handleExitLive };
}
