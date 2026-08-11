/**
 * Verse audio player — SDK 54+ ready (expo-audio only).
 *
 * Key fix: sourceForPlayer is memoized so the player-creation effect
 * only fires when the actual URI changes, not on every render.
 * This prevents the player-recreation loop that caused duplicate
 * audio playback in Android release builds.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Pressable, ActivityIndicator, Platform, TextInput } from "react-native";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioStatus } from "expo-audio";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { verseScreenStyles } from "@/theme/screen-styles";

const formatTimeWorklet = (ms: number) => {
  "worklet";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const ss = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${mm}:${ss}`;
};

export interface VerseAudioPlayerProps {
  audioSource: number;
  primaryColor: string;
  textMutedColor: string;
  outlineColor: string;
  /** When true, automatically start playback when audio is loaded */
  autoPlay?: boolean;
}

const MIN_LOADING_MS = 400;
const STATUS_UPDATE_INTERVAL_MS = 500;
const DRIFT_RESYNC_THRESHOLD_MS = 350;

function VerseAudioPlayerInner({
  audioSource,
  primaryColor,
  textMutedColor,
  outlineColor,
  autoPlay = false,
}: VerseAudioPlayerProps) {
  const [resolvedUri, setResolvedUri] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState(false);
  const [loadingShown, setLoadingShown] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [muted, setMuted] = useState(false);

  const playerRef = useRef<any>(null);
  const seekingRef = useRef(false);
  const isPlayingRef = useRef(false);
  const isLoadedRef = useRef(false);
  const isBufferingRef = useRef(false);
  const playPauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Memoize the source so reference only changes when URI actually changes.
  // This prevents the player-creation effect from re-running on every render.
  const sourceForPlayer = useMemo(() => {
    if (resolvedUri == null) return null;
    if (Platform.OS === "android" && !__DEV__) {
      return { uri: resolvedUri };
    }
    return resolvedUri;
  }, [resolvedUri]);

  // Stable string key for the effect dependency (avoids object reference issues)
  const sourceKey = resolvedUri;

  const progressMs = useSharedValue(0);
  const durationSharedMs = useSharedValue(0);

  const AnimatedSlider = useMemo(() => Animated.createAnimatedComponent(Slider), []);
  const AnimatedTime = useMemo(() => Animated.createAnimatedComponent(TextInput), []);

  const sliderAnimatedProps = useAnimatedProps(() => {
    return { value: progressMs.value };
  });

  const timeText = useDerivedValue(() => {
    return formatTimeWorklet(progressMs.value);
  });

  const durationText = useDerivedValue(() => {
    return formatTimeWorklet(durationSharedMs.value);
  });

  const timeAnimatedProps = useAnimatedProps(() => {
    return { text: timeText.value } as any;
  });

  const durationAnimatedProps = useAnimatedProps(() => {
    return { text: durationText.value } as any;
  });

  const startProgressAnimation = useCallback(() => {
    const d = durationSharedMs.value;
    if (!d || d <= 0) return;
    cancelAnimation(progressMs);
    const remaining = Math.max(0, d - progressMs.value);
    progressMs.value = withTiming(d, {
      duration: Math.max(0, Math.round(remaining)),
      easing: Easing.linear,
    });
  }, [durationSharedMs, progressMs]);

  const stopProgressAnimation = useCallback(() => {
    cancelAnimation(progressMs);
  }, [progressMs]);

  // Resolve asset to a proper file URI
  useEffect(() => {
    setResolveError(false);
    setResolvedUri(null);
    setIsBuffering(false);
    setIsPlaying(false);
    isLoadedRef.current = false;
    isBufferingRef.current = false;
    isPlayingRef.current = false;
    progressMs.value = 0;
    durationSharedMs.value = 0;
    let cancelled = false;
    const start = Date.now();

    const resolve = async () => {
      try {
        const asset = Asset.fromModule(audioSource);
        await asset.downloadAsync();
        if (cancelled) return;

        // On Android release, localUri can be broken (no file:// prefix).
        // Prefer localUri if it looks like a proper path, else fall back to uri.
        let uri = asset.localUri ?? asset.uri;
        if (Platform.OS === "android" && !__DEV__) {
          if (uri && !uri.startsWith("file://") && !uri.startsWith("http")) {
            uri = asset.uri;
          }
        }

        if (uri) setResolvedUri(uri);
        else setResolveError(true);
      } catch {
        if (!cancelled) setResolveError(true);
      }
    };

    resolve();

    const d = Math.max(0, MIN_LOADING_MS - (Date.now() - start));
    const t = setTimeout(() => {
      if (!cancelled) setLoadingShown(false);
    }, d);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // Shared values are stable references; only the source drives this reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSource]);

  useEffect(() => () => {
    if (playPauseTimeoutRef.current) clearTimeout(playPauseTimeoutRef.current);
  }, []);

  useEffect(() => {
    // RCA: expo-audio's setAudioModeAsync (ExpoAudio.js) on Android always builds
    // { interruptionMode: mode.interruptionMode ?? mode.interruptionModeAndroid }
    // and passes it to native. The Android native module (AudioRecords.kt) expects
    // InterruptionMode enum, but expo-modules-kotlin fails to convert the string
    // to enum (expo/expo#34025). Fix: omit interruption on Android so the wrapper
    // passes interruptionMode: undefined → native receives null for the optional field.
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      shouldRouteThroughEarpiece: false,
      ...(Platform.OS === "ios" ? { interruptionMode: "mixWithOthers" as const } : {}),
    });
  }, []);

  // Create / replace player when resolved URI is ready.
  // Depends on sourceKey (a string), not sourceForPlayer (an object), to avoid re-runs.
  useEffect(() => {
    if (!sourceForPlayer || !sourceKey) return;
    let cancelled = false;

    // Dispose previous player completely
    if (playerRef.current) {
      try {
        playerRef.current.pause();
      } catch {}
      try {
        playerRef.current.remove();
      } catch {}
      playerRef.current = null;
    }

    isPlayingRef.current = false;
    isLoadedRef.current = false;
    isBufferingRef.current = false;

    const player = createAudioPlayer(sourceForPlayer as any, {
      updateInterval: STATUS_UPDATE_INTERVAL_MS,
    });
    playerRef.current = player;

    try {
      player.volume = 1;
      player.playbackRate = 1;
      player.shouldCorrectPitch = true;
    } catch {}

    const seed = (st: AudioStatus) => {
      if (!st?.isLoaded) return;
      const dMs = Math.max(0, Math.round((st.duration ?? 0) * 1000));
      const pMs = Math.max(0, Math.round((st.currentTime ?? 0) * 1000));
      durationSharedMs.value = dMs;
      progressMs.value = pMs;
      setDurationMs(dMs);
      isLoadedRef.current = true;
      setIsBuffering(!!st.isBuffering);
      isBufferingRef.current = !!st.isBuffering;
      isPlayingRef.current = !!st.playing;
      setIsPlaying(!!st.playing);
    };
    seed(player.currentStatus);
    if (autoPlay && isLoadedRef.current && !isPlayingRef.current) {
      try {
        player.play();
      } catch {}
    }

    const sub = player.addListener("playbackStatusUpdate", (st: AudioStatus) => {
      if (cancelled) return;
      if (!st.isLoaded) return;

      if (st.duration != null) {
        const dMs = Math.max(0, Math.round(st.duration * 1000));
        if (dMs > 0 && dMs !== durationSharedMs.value) {
          durationSharedMs.value = dMs;
          setDurationMs(dMs);
        }
      }

      if (!isLoadedRef.current) {
        isLoadedRef.current = true;
        if (autoPlay && !st.playing) {
          try {
            player.play();
          } catch {}
        }
      }
      if (isBufferingRef.current !== !!st.isBuffering) {
        isBufferingRef.current = !!st.isBuffering;
        setIsBuffering(!!st.isBuffering);
      }

      if (st.didJustFinish) {
        isPlayingRef.current = false;
        setIsPlaying(false);
        stopProgressAnimation();
        progressMs.value = 0;
        return;
      }

      if (!seekingRef.current) {
        const audioMs = Math.max(0, Math.round(st.currentTime * 1000));
        const drift = Math.abs(audioMs - progressMs.value);
        if (!isPlayingRef.current) {
          progressMs.value = audioMs;
        } else if (drift > DRIFT_RESYNC_THRESHOLD_MS) {
          progressMs.value = audioMs;
          startProgressAnimation();
        }
      }

      if (isPlayingRef.current !== !!st.playing) {
        isPlayingRef.current = !!st.playing;
        setIsPlaying(!!st.playing);
        if (st.playing) startProgressAnimation();
        else stopProgressAnimation();
      }
    });

    return () => {
      cancelled = true;
      sub?.remove?.();
      try {
        player.pause();
      } catch {}
      try {
        player.remove();
      } catch {}
      if (playerRef.current === player) playerRef.current = null;
    };
    // sourceForPlayer/shared values/animation helpers are stable per sourceKey;
    // depending on them would re-create the player every render (Android dup-audio bug).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey, autoPlay]);

  const handlePlayPause = () => {
    const player = playerRef.current;
    if (!player) return;

    // If player hasn't reported loaded yet but we have a resolved URI,
    // allow play anyway (Android release may not fire initial status)
    if (isPlayingRef.current) {
      player.pause();
      isPlayingRef.current = false;
      setIsPlaying(false);
      stopProgressAnimation();
    } else {
      if (durationSharedMs.value > 0 && progressMs.value >= durationSharedMs.value - 150) {
        player.seekTo(0);
        progressMs.value = 0;
      }
      player.play();
      isPlayingRef.current = true;
      setIsPlaying(true);

      // On Android release, status events may not fire for duration.
      // Poll once after a short delay to pick up duration if we don't have it yet.
      if (durationSharedMs.value === 0) {
        if (playPauseTimeoutRef.current) clearTimeout(playPauseTimeoutRef.current);
        playPauseTimeoutRef.current = setTimeout(() => {
          playPauseTimeoutRef.current = null;
          // Player may have been replaced if the verse changed meanwhile.
          if (playerRef.current !== player) return;
          try {
            const st = player.currentStatus;
            if (st?.isLoaded && st.duration > 0) {
              const dMs = Math.round(st.duration * 1000);
              durationSharedMs.value = dMs;
              setDurationMs(dMs);
              isLoadedRef.current = true;
              startProgressAnimation();
            }
          } catch {}
        }, 300);
      } else {
        startProgressAnimation();
      }
    }
  };

  const handleSlidingStart = () => {
    seekingRef.current = true;
    stopProgressAnimation();
  };

  const handleSliderValueChange = (value: number) => {
    progressMs.value = value;
  };

  const handleSlidingComplete = (value: number) => {
    const player = playerRef.current;
    if (!player) return;
    seekingRef.current = false;
    player.seekTo(value / 1000);
    progressMs.value = value;
    if (isPlayingRef.current) startProgressAnimation();
  };

  const handleMuteToggle = () => {
    const player = playerRef.current;
    const next = !muted;
    setMuted(next);
    if (player) {
      try {
        player.volume = next ? 0 : 1;
      } catch {}
    }
  };

  if (loadingShown && !resolvedUri && !resolveError) {
    return (
      <View style={[verseScreenStyles.audioContainer, { minHeight: 40 }]}>
        <ActivityIndicator size="small" color={primaryColor} />
        <TextInput
          editable={false}
          value="Loading audio…"
          style={[verseScreenStyles.audioTime, { color: textMutedColor, marginLeft: 12 }]}
        />
      </View>
    );
  }

  if (resolveError) {
    return (
      <View style={[verseScreenStyles.audioContainer, { minHeight: 40 }]}>
        <Ionicons name="alert-circle-outline" size={24} color={textMutedColor} />
        <TextInput
          editable={false}
          value="Audio unavailable"
          style={[verseScreenStyles.audioTime, { color: textMutedColor, marginLeft: 8 }]}
        />
      </View>
    );
  }

  if (!resolvedUri) {
    return (
      <View style={[verseScreenStyles.audioContainer, { minHeight: 40 }]}>
        <ActivityIndicator size="small" color={primaryColor} />
        <TextInput
          editable={false}
          value="Loading audio…"
          style={[verseScreenStyles.audioTime, { color: textMutedColor, marginLeft: 12 }]}
        />
      </View>
    );
  }

  return (
    <View style={verseScreenStyles.audioContainer}>
      <Pressable
        onPress={handlePlayPause}
        disabled={!resolvedUri}
        hitSlop={8}
        style={[
          verseScreenStyles.audioPlayBtn,
          { backgroundColor: primaryColor, opacity: resolvedUri ? 1 : 0.6 },
        ]}
        accessibilityLabel={isPlaying ? "Pause audio" : "Play audio"}
        accessibilityRole="button"
      >
        <Ionicons
          name={isBuffering ? "hourglass" : isPlaying ? "pause" : "play"}
          size={16}
          color="#FFFFFF"
          style={isPlaying || isBuffering ? undefined : { marginLeft: 1 }}
        />
      </Pressable>

      <AnimatedTime
        editable={false}
        underlineColorAndroid="transparent"
        style={[verseScreenStyles.audioTime, { color: textMutedColor }]}
        animatedProps={timeAnimatedProps}
      />

      <AnimatedSlider
        style={verseScreenStyles.slider}
        minimumValue={0}
        maximumValue={durationMs || 1}
        animatedProps={sliderAnimatedProps as any}
        onSlidingStart={handleSlidingStart}
        onValueChange={handleSliderValueChange}
        onSlidingComplete={handleSlidingComplete}
        minimumTrackTintColor={primaryColor}
        accessibilityLabel="Audio progress"
        accessibilityRole="adjustable"
        maximumTrackTintColor={outlineColor + "66"}
        thumbTintColor={primaryColor}
        disabled={!resolvedUri}
      />

      <AnimatedTime
        editable={false}
        underlineColorAndroid="transparent"
        style={[verseScreenStyles.audioTime, { color: textMutedColor }]}
        animatedProps={durationAnimatedProps}
      />

      <Pressable
        onPress={handleMuteToggle}
        hitSlop={10}
        style={verseScreenStyles.audioMuteBtn}
        accessibilityLabel={muted ? "Unmute" : "Mute"}
        accessibilityRole="button"
      >
        <Ionicons
          name={muted ? "volume-mute" : "volume-high"}
          size={22}
          color={primaryColor}
        />
      </Pressable>
    </View>
  );
}

export const VerseAudioPlayer = React.memo(VerseAudioPlayerInner, (prev, next) => {
  return (
    prev.audioSource === next.audioSource &&
    prev.primaryColor === next.primaryColor &&
    prev.textMutedColor === next.textMutedColor &&
    prev.outlineColor === next.outlineColor &&
    prev.autoPlay === next.autoPlay
  );
});
