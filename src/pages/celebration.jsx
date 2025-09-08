/**
 * celebration.jsx (corrected autoplay logic)
 *
 * Updated to reliably attempt autoplay on mount:
 *  - tries muted autoplay first (most browsers allow muted autoplay)
 *  - if muted autoplay succeeds, unmutes for audible playback
 *  - if autoplay is blocked, shows a small "Tap to play" prompt that will start playback
 *
 * Props:
 *  - friendImageFilename
 *  - birthdaySongFilename
 *  - personalMessage
 *  - friendName
 *
 * Keep celebration.styles.css as-is (imported below).
 */

import React, { useEffect, useRef, useState } from "react";
import "./celebration.styles.css";

export default function SecondPage({
  friendImageFilename = "friend.jpg",
  birthdaySongFilename = "happy-birthday-155461.mp3",
  personalMessage = "Wishing you a day filled with love, laughter, and all the little joys that make life beautiful.",
  friendName = "Tushar Mahapure",
}) {
  // Typing state
  const [typedText, setTypedText] = useState("");
  const typingIndex = useRef(0);
  const typingTimer = useRef(null);

  // Audio
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlayPrompt, setShowPlayPrompt] = useState(false); // fallback prompt visible if autoplay blocked
  const [audioPlaying, setAudioPlaying] = useState(false); // whether audio is currently playing (audible)

  // Celebration / confetti refs
  const confettiContainerRef = useRef(null);
  const [sequenceState, setSequenceState] = useState("init");

  // Tailwind CDN injection (keeps component portable)
  useEffect(() => {
    if (!document.querySelector('script[src="https://cdn.tailwindcss.com"]')) {
      const s = document.createElement("script");
      s.src = "https://cdn.tailwindcss.com";
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  // Reveal choreography (image -> heading -> typing -> confetti)
  useEffect(() => {
    const t1 = setTimeout(() => setSequenceState("image"), 100);
    const t2 = setTimeout(() => setSequenceState("heading"), 520);
    const t3 = setTimeout(() => {
      setSequenceState("typing");
      startTyping();
    }, 900);
    const t4 = setTimeout(() => {
      triggerConfetti();
      setSequenceState("done");
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      stopTyping();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Typing functions
  function startTyping() {
    stopTyping();
    typingIndex.current = 0;
    setTypedText("");
    typingTimer.current = setInterval(() => {
      typingIndex.current += 1;
      setTypedText(personalMessage.slice(0, typingIndex.current));
      if (typingIndex.current >= personalMessage.length) {
        stopTyping();
      }
    }, 35);
  }
  function stopTyping() {
    if (typingTimer.current) clearInterval(typingTimer.current);
    typingTimer.current = null;
  }

  // Autoplay effect: attempt muted autoplay first (allowed by browsers), then unmute if possible.
  // Only depends on birthdaySongFilename so it runs on mount / when the song changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let cancelled = false;
    // set sensible defaults
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.6;

    // Strategy:
    // 1) Try to play while muted (muted autoplay often allowed).
    // 2) If it plays, try to unmute (so user hears music).
    // 3) If any step fails, show the play prompt so user can start playback with a gesture.
    const tryMutedAutoplay = async () => {
      try {
        audio.muted = true; // start muted to increase autoplay probability
        const p = audio.play();
        if (p !== undefined) await p;
        if (cancelled) return;
        // muted autoplay succeeded — now unmute to make audible (if user hasn't explicitly muted)
        // Some browsers may allow unmute after play; this is generally acceptable.
        if (!isMuted) {
          try {
            audio.muted = false;
            setAudioPlaying(true);
            setShowPlayPrompt(false);
            return;
          } catch (e) {
            // If unmute fails, fallback to leaving it muted (rare)
            setAudioPlaying(false);
            setShowPlayPrompt(true);
            return;
          }
        } else {
          // user wants muted
          setAudioPlaying(!audio.paused && !audio.muted);
          setShowPlayPrompt(false);
          return;
        }
      } catch (err) {
        // muted autoplay blocked or failed — show play prompt to get a user gesture
        setShowPlayPrompt(true);
        setAudioPlaying(false);
      }
    };

    // small delay to ensure element is in DOM
    const t = setTimeout(() => {
      tryMutedAutoplay();
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [birthdaySongFilename]); // run only when song changes

  // Sync mute state when user toggles mute (no re-attempt to autoplay)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = isMuted;
    // If user unmutes and audio was paused (but playable), try to play
    if (!isMuted && audio.paused) {
      audio.play().then(() => setAudioPlaying(true)).catch(() => {
        // If play still blocked, show prompt to ask user gesture
        setShowPlayPrompt(true);
        setAudioPlaying(false);
      });
    } else {
      setAudioPlaying(!audio.paused && !audio.muted);
    }
  }, [isMuted]);

  // Keyboard handlers (M mute, C confetti)
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "KeyM") {
        setIsMuted((s) => !s);
      } else if (e.code === "KeyC") {
        triggerConfetti();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Enable audio on the first user gesture (tap/click) when autoplay is blocked
  useEffect(() => {
    if (!showPlayPrompt) return;
    const onUserGesture = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.muted = isMuted;
      audio.play().then(() => {
        setShowPlayPrompt(false);
        setAudioPlaying(!audio.muted);
      }).catch(() => {
        // if still fails, keep prompt visible
        setShowPlayPrompt(true);
      });
    };
    document.addEventListener("click", onUserGesture, { once: true });
    document.addEventListener("touchstart", onUserGesture, { once: true });
    return () => {
      document.removeEventListener("click", onUserGesture);
      document.removeEventListener("touchstart", onUserGesture);
    };
  }, [showPlayPrompt, isMuted]);

  // Confetti trigger
  function triggerConfetti() {
    const el = confettiContainerRef.current;
    if (!el) return;
    el.classList.remove("celebration-burst");
    // force reflow
    // eslint-disable-next-line no-unused-expressions
    el.offsetWidth;
    el.classList.add("celebration-burst");
  }

  // Image tap handler: replay confetti and also try to play audio as a user gesture
  function onImageTap() {
    triggerConfetti();
    const audio = audioRef.current;
    if (!audio) return;
    // user gesture: attempt to play and unmute if user hasn't toggled mute
    audio.muted = isMuted;
    const p = audio.play();
    if (p && p.catch) {
      p.catch(() => {
        // as fallback, try unmuting and play
        audio.muted = false;
        audio.play().catch(() => {});
      });
    } else {
      audio.muted = isMuted;
    }
  }

  // Derived asset paths
  const imageSrc = `/assets/${friendImageFilename}`;
  const audioSrc = `/assets/${birthdaySongFilename}`;

  return (
    <div className="celebration-root min-h-screen flex items-center justify-center px-4 py-8 bg-cream relative overflow-hidden">
      <div className="bg-warm-blur absolute inset-0 -z-30" />
      <div className={`particle-field absolute inset-0 -z-20 ${sequenceState !== "init" ? "particles-on" : ""}`} />
      <div className="soft-vignette absolute inset-0 -z-10 pointer-events-none" />

      <svg className="decor-star decor-star-1" viewBox="0 0 24 24" aria-hidden>
        <path fill="currentColor" d="M12 2l2.4 5.1L20 8.2l-4 3.5L17 20l-5-2.8L7 20l1-8.3L4 8.2l5.6-.9L12 2z" />
      </svg>

      <svg className="decor-star decor-star-2" viewBox="0 0 24 24" aria-hidden>
        <path fill="currentColor" d="M12 3.2l1.9 3.9 4.3.6-3.1 2.7.7 4.2L12 13.9 8.2 14.6l.7-4.2L5.8 7.7l4.3-.6L12 3.2z" />
      </svg>

      <div ref={confettiContainerRef} className="confetti-layer absolute inset-0 -z-15 pointer-events-none" aria-hidden>
        {Array.from({ length: 26 }).map((_, i) => {
          const left = `${Math.round((i / 26) * 100)}%`;
          const delay = `${(i * 40) % 900}ms`;
          const size = `${6 + (i % 3) * 3}px`;
          const colors = ["#fde68a", "#fca5a5", "#93c5fd", "#f0abfc", "#6ee7b7", "#ffd6a5"];
          const bg = colors[i % colors.length];
          return (
            <span
              key={i}
              className="confetti-piece"
              style={{
                left,
                width: size,
                height: `${parseInt(size, 10) * 1.6}px`,
                background: bg,
                animationDelay: delay,
              }}
            />
          );
        })}
      </div>

      <main className="reveal-card w-full max-w-3xl mx-auto rounded-2xl shadow-2xl p-5 sm:p-10 flex flex-col items-center text-center relative z-10" role="main" aria-live="polite">
        <div className="mb-2 sm:mb-3 text-xs sm:text-sm text-muted-gold">Made with love for <span className="font-semibold">{friendName}</span></div>

        <div
          className="image-frame w-full max-w-[360px] sm:max-w-[640px] rounded-2xl overflow-hidden mb-5 sm:mb-7 transform-gpu"
          onClick={onImageTap}
          onMouseMove={(e) => {
            const el = e.currentTarget;
            const rect = el.getBoundingClientRect();
            const dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
            const dy = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
            el.style.transform = `perspective(800px) rotateX(${(-dy * 4).toFixed(2)}deg) rotateY(${(dx * 6).toFixed(2)}deg) scale(1.01)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
          }}
        >
          <img src={imageSrc} alt={`Photo of ${friendName}`} className={`friend-image w-full h-auto object-cover block reveal-image ${sequenceState !== "init" ? "image-in" : ""}`} onError={(ev) => { ev.currentTarget.style.opacity = "0"; }} draggable={false} />
          <div className={`image-frame-glow ${sequenceState !== "init" ? "glow-on" : ""}`} />
          <div className="image-vignette" />
        </div>

        <h1 className={`hb-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3 sm:mb-4 ${sequenceState !== "init" ? "hb-on" : ""}`}>
          <span className="hb-text-gradient inline-block relative">
            Happy Birthday Tushar Mahapure!
            <span className="hb-gradient-shimmer" aria-hidden />
          </span>
          <span className="hb-sparkles ml-2" aria-hidden>✨</span>
        </h1>

        <section className="personal-message px-3 sm:px-6 text-sm sm:text-base leading-relaxed text-soft-ink max-w-prose">
          <p className="message-text inline-block">{typedText}</p>
          <span className={`typing-caret ml-1 ${typedText.length >= personalMessage.length ? "caret-hidden" : ""}`} aria-hidden />
        </section>


        <div className="sr-only">A birthday song will play automatically. Press M to mute.</div>

        {/* Hidden audio element */}
        <audio ref={audioRef} src={audioSrc} autoPlay loop preload="auto" style={{ display: "none" }} />

      </main>
    </div>
  );
}
