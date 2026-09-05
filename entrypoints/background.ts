import { createAudioController } from "@/lib/audio-controller";
import { onMessage } from "@/lib/messaging";

export default defineBackground({
  type: "module",
  main() {
    const audio = createAudioController();

    onMessage("play", ({ data }) => audio.play(data));
    onMessage("pause", () => audio.pause());
    onMessage("restart", () => audio.restart());
    onMessage("setVolume", ({ data }) => audio.setVolume(data));
    onMessage("seek", ({ data }) => audio.seek(data));
    onMessage("getPlaybackState", () => audio.getState());
  },
});
