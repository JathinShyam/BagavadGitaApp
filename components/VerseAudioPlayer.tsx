/**
 * Verse audio player — SDK 54+ ready (expo-audio only).
 *
 * Requirement: live slider + live timer while playing, with *minimal* audio breaks.
 *
 * Proven approach for React Native audio UX:
 * - Keep native audio playback independent of React render frequency.
 * - Drive the UI progress (slider + timer) on the UI thread using Reanimated (linear timing),
 *   so it's smooth and doesn't stall when JS is busy.
 * - Use expo-audio status events only for: load/duration, buffering indicator, finish event,
 *   and occasional drift resync (low-frequency).
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Pressable, ActivityIndicator, Platform, TextInput } from "react-native";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import { createAudioPlayer, PLAYBACK_STATUS_UPDATE, setAudioModeAsync } from "expo-audio";
import type { AudioStatus } from "expo-audio";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { versestyles } from "../app/styles";

// Reanimated worklet-friendly MM:SS
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
}

const MIN_LOADING_MS = 400;
// Shorter interval + tighter drift for more \"live\" feeling
const STATUS_UPDATE_INTERVAL_MS = 500;
const DRIFT_RESYNC_THRESHOLD_MS = 350;

function VerseAudioPlayerInner({
  audioSource,
  primaryColor,
  textMutedColor,
  outlineColor,
}: VerseAudioPlayerProps) {
  const [resolvedUri, setResolvedUri] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState(false);
  const [loadingShown, setLoadingShown] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState(0);

  const playerRef = useRef<any>(null);
  const seekingRef = useRef(false);
  const isPlayingRef = useRef(false);
  const isLoadedRef = useRef(false);
  const isBufferingRef = useRef(false);

  const sourceForPlayer =
    resolvedUri != null
      ? Platform.OS === "android" && !__DEV__
        ? { uri: resolvedUri }
        : resolvedUri
      : null;

  // UI-thread progress state (ms)
  const progressMs = useSharedValue(0);
  const durationSharedMs = useSharedValue(0);

  const AnimatedSlider = useMemo(() => Animated.createAnimatedComponent(Slider), []);
  const AnimatedTime = useMemo(() => Animated.createAnimatedComponent(TextInput), []);

  const sliderAnimatedProps = useAnimatedProps(() => {
    return { value: progressMs.value };
  });

  const timeText = useDerivedValue(() => {
    return `${formatTimeWorklet(progressMs.value)} / ${formatTimeWorklet(durationSharedMs.value)}`;
  });

  const timeAnimatedProps = useAnimatedProps(() => {
    return { text: timeText.value } as any;
  });

  const startProgressAnimation = () => {
    const d = durationSharedMs.value;
    if (!d || d <= 0) return;
    cancelAnimation(progressMs);
    const remaining = Math.max(0, d - progressMs.value);
    progressMs.value = withTiming(d, {
      duration: Math.max(0, Math.round(remaining)),
      easing: Easing.linear,
    });
  };

  const stopProgressAnimation = () => {
    cancelAnimation(progressMs);
  };

  useEffect(() => {
    setResolveError(false);
    setResolvedUri(null);
    setIsLoaded(false);
    setIsBuffering(false);
    setIsPlaying(false);
    isLoadedRef.current = false;
    isBufferingRef.current = false;
    let cancelled = false;
    const start = Date.now();

    Asset.loadAsync(audioSource)
      .then(([asset]) => {
        if (cancelled) return;
        const uri = asset.localUri ?? asset.uri;
        if (uri) setResolvedUri(uri);
        else setResolveError(true);
      })
      .catch(() => {
        if (!cancelled) setResolveError(true);
      });

    const d = Math.max(0, MIN_LOADING_MS - (Date.now() - start));
    const t = setTimeout(() => {
      if (!cancelled) setLoadingShown(false);
    }, d);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [audioSource]);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      shouldRouteThroughEarpiece: false,
    });
  }, []);

  // Create / replace player when source URI is ready
  useEffect(() => {
    if (!sourceForPlayer) return;
    let cancelled = false;

    // Dispose previous
    if (playerRef.current) {
      try {
        playerRef.current.remove?.();
      } catch {}
      playerRef.current = null;
    }

    const player = createAudioPlayer(sourceForPlayer as any, STATUS_UPDATE_INTERVAL_MS);
    playerRef.current = player;

    // Reasonable defaults for clarity (no DSP here; just ensure stable playback params)
    try {
      player.volume = 1;
      player.playbackRate = 1;
      player.shouldCorrectPitch = true;
    } catch {}

    // Seed from currentStatus immediately
    const seed = (st: AudioStatus) => {
      if (!st?.isLoaded) return;
      const dMs = Math.max(0, Math.round((st.duration ?? 0) * 1000));
      const pMs = Math.max(0, Math.round((st.currentTime ?? 0) * 1000));
      durationSharedMs.value = dMs;
      progressMs.value = pMs;
      setDurationMs(dMs);
      setIsLoaded(true);
      isLoadedRef.current = true;
      setIsBuffering(!!st.isBuffering);
      isBufferingRef.current = !!st.isBuffering;
      isPlayingRef.current = !!st.playing;
      setIsPlaying(!!st.playing);
    };
    seed(player.currentStatus);

    const sub = player.addListener(PLAYBACK_STATUS_UPDATE, (st: AudioStatus) => {
      if (cancelled) return;
      if (!st.isLoaded) return;

      // Update duration once (or if it changes)
      if (st.duration != null) {
        const dMs = Math.max(0, Math.round(st.duration * 1000));
        if (dMs > 0 && dMs !== durationSharedMs.value) {
          durationSharedMs.value = dMs;
          setDurationMs(dMs);
        }
      }

      if (!isLoadedRef.current) {
        isLoadedRef.current = true;
        setIsLoaded(true);
      }
      if (isBufferingRef.current !== !!st.isBuffering) {
        isBufferingRef.current = !!st.isBuffering;
        setIsBuffering(!!st.isBuffering);
      }

      // Finish: stop animation and reset
      if (st.didJustFinish) {
        isPlayingRef.current = false;
        setIsPlaying(false);
        stopProgressAnimation();
        progressMs.value = 0;
        return;
      }

      // Keep UI and audio aligned without forcing React re-renders.
      // When playing, Reanimated drives progress; we only resync if drift is big.
      if (!seekingRef.current) {
        const audioMs = Math.max(0, Math.round(st.currentTime * 1000));
        const drift = Math.abs(audioMs - progressMs.value);
        if (!isPlayingRef.current) {
          // paused -> snap UI to true position
          progressMs.value = audioMs;
        } else if (drift > DRIFT_RESYNC_THRESHOLD_MS) {
          // playing -> resync and continue smooth animation
          progressMs.value = audioMs;
          startProgressAnimation();
        }
      }

      // Playing state changes are infrequent; update React state only on change
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
        player.remove?.();
      } catch {}
      if (playerRef.current === player) playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceForPlayer]);

  const handlePlayPause = () => {
    const player = playerRef.current;
    if (!player || !isLoaded) return;
    if (isPlayingRef.current) {
      player.pause();
      isPlayingRef.current = false;
      setIsPlaying(false);
      stopProgressAnimation();
    } else {
      // If at end, reset to start before playing
      if (durationSharedMs.value > 0 && progressMs.value >= durationSharedMs.value - 150) {
        player.seekTo(0);
        progressMs.value = 0;
      }
      player.play();
      isPlayingRef.current = true;
      setIsPlaying(true);
      startProgressAnimation();
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
    if (!player || !isLoaded) return;
    seekingRef.current = false;
    player.seekTo(value / 1000);
    progressMs.value = value;
    if (isPlayingRef.current) startProgressAnimation();
  };

  if (loadingShown && !resolvedUri && !resolveError) {
    return (
      <View style={[versestyles.audioContainer, { minHeight: 48 }]}>
        <ActivityIndicator size="small" color={primaryColor} />
        <TextInput
          editable={false}
          value="Loading audio…"
          style={[versestyles.audioTime, { color: textMutedColor, marginLeft: 12 }]}
        />
      </View>
    );
  }

  if (resolveError) {
    return (
      <View style={[versestyles.audioContainer, { minHeight: 48 }]}>
        <Ionicons name="alert-circle-outline" size={24} color={textMutedColor} />
        <TextInput
          editable={false}
          value="Audio unavailable"
          style={[versestyles.audioTime, { color: textMutedColor, marginLeft: 8 }]}
        />
      </View>
    );
  }

  if (!resolvedUri) {
    return (
      <View style={[versestyles.audioContainer, { minHeight: 48 }]}>
        <ActivityIndicator size="small" color={primaryColor} />
        <TextInput
          editable={false}
          value="Loading audio…"
          style={[versestyles.audioTime, { color: textMutedColor, marginLeft: 12 }]}
        />
      </View>
    );
  }

  return (
    <View style={versestyles.audioContainer}>
      <Pressable
        onPress={handlePlayPause}
        disabled={!isLoaded}
        style={{ opacity: isLoaded ? 1 : 0.6 }}
      >
        <Ionicons
          name={isBuffering ? "hourglass" : isPlaying ? "pause" : "play"}
          size={24}
          color={primaryColor}
        />
      </Pressable>
      <AnimatedSlider
        style={versestyles.slider}
        minimumValue={0}
        maximumValue={durationMs || 1}
        animatedProps={sliderAnimatedProps as any}
        onSlidingStart={handleSlidingStart}
        onValueChange={handleSliderValueChange}
        onSlidingComplete={handleSlidingComplete}
        minimumTrackTintColor={primaryColor}
        maximumTrackTintColor={outlineColor}
        thumbTintColor={primaryColor}
        disabled={!isLoaded}
      />
      <AnimatedTime
        editable={false}
        underlineColorAndroid="transparent"
        style={[versestyles.audioTime, { color: textMutedColor }]}
        animatedProps={timeAnimatedProps}
      />
    </View>
  );
}

export const VerseAudioPlayer = React.memo(VerseAudioPlayerInner, (prev, next) => {
  return (
    prev.audioSource === next.audioSource &&
    prev.primaryColor === next.primaryColor &&
    prev.textMutedColor === next.textMutedColor &&
    prev.outlineColor === next.outlineColor
  );
});
