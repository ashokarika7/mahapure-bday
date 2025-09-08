// home.jsx
// Mobile-first responsive home / opening page for birthday surprise app.
// Exports default Home component. Accepts prop `onGiftClick` (called after open animation completes).

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./home.styles.css"; // All custom CSS / keyframes live here

export default function Home({ onGiftClick = () => {} }) {
  // isOpening: false = idle/closed, true = opening/opened
  const [isOpening, setIsOpening] = useState(false);
  const navigate = useNavigate();

  // animatingRef prevents double clicks/taps while animation runs
  const animatingRef = useRef(false);

  // Refs to detect animation end and toggle confetti
  const lidRef = useRef(null);
  const confettiRef = useRef(null);

  // Inject Tailwind CDN if not present (optional; remove if your project already builds Tailwind).
  useEffect(() => {
    if (!document.querySelector('script[src="https://cdn.tailwindcss.com"]')) {
      const s = document.createElement("script");
      s.src = "https://cdn.tailwindcss.com";
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  // Start opening sequence
  function handleGiftClick() {
    if (animatingRef.current) return;
    animatingRef.current = true;
    setIsOpening(true);

    // Confetti burst slightly after the lid starts opening
    setTimeout(() => {
      confettiRef.current && confettiRef.current.classList.add("confetti-burst");
    }, 180);

    // Fallback timeout: ensure navigation happens even if animationend doesn't fire
    const fallback = setTimeout(() => {
      animatingRef.current = false;
      onGiftClick();
      navigate('/celebration');
    }, 2600);

    // Listen to lid animation end
    const lid = lidRef.current;
    if (lid) {
      const onAnimEnd = (e) => {
        // Ensure we respond only to our lid animation
        if (e.animationName === "lidFlipOpen") {
          clearTimeout(fallback);
          animatingRef.current = false;
          onGiftClick();
          navigate('/celebration');
        }
      };
      lid.addEventListener("animationend", onAnimEnd, { once: true });
    }
  }

  // Generate deterministic confetti pieces for layout
  const confettiPieces = Array.from({ length: 14 }).map((_, i) => {
    const dx = (i % 2 === 0 ? -1 : 1) * (16 + i * 6);
    const dy = -100 - i * 10;
    const rot = (i * 43) % 360;
    const delay = `${(i * 45) % 340}ms`;
    const w = `${6 + (i % 3) * 2}px`;
    const h = `${8 + (i % 2) * 4}px`;
    const bg = ["#fde68a", "#fca5a5", "#93c5fd", "#f0abfc", "#6ee7b7"][i % 5];
    return { dx, dy, rot, delay, w, h, bg, idx: i };
  });

  return (
    <div className="home-root w-full min-h-screen flex items-center justify-center relative overflow-hidden px-3 sm:px-4 md:px-6 py-6 sm:py-8">
      {/* Animated gradient background */}
      <div className="bg-animated-gradient absolute inset-0 -z-10" />

      <div className="max-w-screen-sm sm:max-w-screen-md w-full flex flex-col items-center text-center">
        {/* Title (mobile-first sizes; scales up using responsive utilities) */}
        <h1
          className="home-title font-extrabold tracking-tight mb-2 sm:mb-3"
          style={{
            // fallback fonts for decorative serif look on larger screens
            fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, Georgia",
          }}
        >
          <span className="block text-gold text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl">Happy</span>
          <span className="block text-white text-2xl xs:text-3xl sm:text-4xl md:text-6xl lg:text-7xl -mt-0.5 sm:-mt-1">Birthday!</span>
        </h1>

        <p className="mb-4 sm:mb-6 text-xs xs:text-sm sm:text-base md:text-lg text-white/85 max-w-prose px-1 sm:px-2 leading-relaxed">
          A tiny surprise — tap the gift to reveal the magic.
        </p>

        {/* Gift container: responsive by CSS variable --gift-size */}
        <div
          className={`gift-wrap relative flex items-center justify-center`}
          style={{ width: "100%", maxWidth: "420px", margin: "0 auto" }}
        >
          {/* Soft shadow under the gift */}
          <div
            className={`gift-shadow absolute bottom-0 w-3/4 h-3 rounded-full transition-opacity`}
            aria-hidden
          />

          {/* Box body: tap target */}
          <div
            className={`box-body relative z-10 rounded-2xl shadow-xl touch-manipulation`}
            role="button"
            aria-pressed={isOpening}
            onClick={handleGiftClick}
            title="Open gift"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleGiftClick();
              }
            }}
          >
            {/* Vertical ribbon */}
            <div className="ribbon-vertical absolute left-1/2 -translate-x-1/2" />

            {/* Horizontal ribbon */}
            <div className="ribbon-horizontal absolute top-1/2 -translate-y-1/2" />

            {/* Bow */}
            <div className="bow absolute -top-6 z-20 pointer-events-none">
              <div className="bow-loop left-loop" />
              <div className="bow-loop right-loop" />
              <div className="bow-knot" />
            </div>


            {/* Idle bounce overlay (only while not opening) */}
            <div className={`idle-bounce absolute inset-0 pointer-events-none ${isOpening ? "" : "gift-idle"}`} />
          </div>

          {/* Lid: separate element so we can animate flip */}
          <div
            ref={lidRef}
            className={`box-lid absolute z-30 top-0 left-1/2 -translate-x-1/2 rounded-xl`}
            // Add opening class so CSS can animate; using style here is acceptable but CSS class keeps it centralized.
            style={isOpening ? {} : {}}
            aria-hidden
          />

          {/* Large invisible overlay button for easier taps on mobile */}
          <button
            className="absolute inset-0 z-40 bg-transparent touch-manipulation min-h-[44px] min-w-[44px]"
            onClick={handleGiftClick}
            aria-label="Open gift"
            disabled={animatingRef.current}
          />

          {/* Confetti container */}
          <div
            ref={confettiRef}
            className="confetti-container absolute -top-6 z-40 pointer-events-none w-full h-full"
            aria-hidden
          >
            {confettiPieces.map((p) => (
              <div
                key={p.idx}
                className="confetti-piece absolute rounded-sm"
                style={{
                  width: p.w,
                  height: p.h,
                  background: p.bg,
                  left: `${50 + (p.idx - 7) * 6}%`,
                  top: "12%",
                  transform: `translateZ(40px) rotate(${p.rot}deg)`,
                  ["--dx"]: `${p.dx}px`,
                  ["--dy"]: `${p.dy}px`,
                  ["--r"]: `${p.rot}deg`,
                  animationDelay: p.delay,
                  opacity: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Hint / CTA */}
        <div className="mt-4 sm:mt-6 text-xs xs:text-sm sm:text-base text-white/75 max-w-sm mx-auto px-2">
          <span className="block sm:hidden">Tip: Tap the gift</span>
          <span className="hidden sm:block">Tip: Click or tap the gift to open</span>
        </div>
      </div>

      {/* Toggle CSS class for opening lid and confetti via class on body element for CSS selectors */}
      {/* We toggle by adding a class to document body to centralize animation selectors for responsiveness */}
      <OpeningClassHandler enabled={isOpening} />
    </div>
  );
}

/**
 * OpeningClassHandler - small helper component to toggle a class on <body>
 * This allows CSS to target `.opening` on the body and apply animations
 * without inline styles. It keeps markup clean and responsive CSS straightforward.
 */
function OpeningClassHandler({ enabled }) {
  useEffect(() => {
    const cls = "opening";
    const body = document.body;
    if (enabled) body.classList.add(cls);
    else body.classList.remove(cls);
    return () => body.classList.remove(cls);
  }, [enabled]);
  return null;
}
