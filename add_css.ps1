$newCss = @"
/* =========================================================================
   ONBOARDING CAROUSEL & 3D FOLDER
   ========================================================================= */

#onboardingScreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--bg-900);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: opacity 0.5s ease, transform 0.5s ease;
  overflow: hidden;
}

#onboardingScreen.hidden {
  opacity: 0;
  pointer-events: none;
  transform: scale(1.05);
}

.carousel-container {
  width: 90%;
  max-width: 900px;
  height: 60vh;
  min-height: 400px;
  position: relative;
  overflow: hidden;
  border-radius: var(--r-lg);
  border: 1px solid var(--border);
  background: rgba(10, 15, 30, 0.6);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
}

.carousel-slide {
  position: absolute;
  inset: 0;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  opacity: 0;
  transform: translateX(50px);
  transition: all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  pointer-events: none;
}

.carousel-slide.active {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.carousel-slide.prev-slide {
  transform: translateX(-50px);
}

.slide-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 2.2rem;
  color: #fff;
  margin-bottom: 20px;
  text-shadow: 0 0 20px var(--c-blue);
  letter-spacing: 2px;
}

.slide-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--text);
  max-width: 700px;
  margin-bottom: 30px;
}

.slide-highlight {
  color: var(--c-cyan);
  font-weight: 600;
}

.carousel-nav {
  position: absolute;
  bottom: 30px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 40px;
  z-index: 10;
}

.carousel-btn {
  background: rgba(0, 180, 255, 0.1);
  border: 1px solid var(--c-blue);
  color: var(--c-blue);
  padding: 10px 24px;
  border-radius: var(--r-sm);
  font-family: 'Orbitron', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.carousel-btn:hover {
  background: rgba(0, 180, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 180, 255, 0.4);
}

.carousel-dots {
  display: flex;
  gap: 10px;
  align-items: center;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  transition: all 0.3s;
}

.dot.active {
  background: var(--c-cyan);
  box-shadow: 0 0 10px var(--c-cyan);
  transform: scale(1.3);
}

/* --- 3D Animated Folder (Converted from Tailwind) --- */
.folder-section {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 250px;
}

.folder-container {
  position: relative;
  width: 240px;
  height: 160px;
  cursor: pointer;
  transform-origin: bottom;
  perspective: 1500px;
  z-index: 50;
}

.folder-container:hover .work-5 {
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}
.folder-container:hover .work-4 {
  transform: rotateX(-20deg);
}
.folder-container:hover .work-3 {
  transform: rotateX(-30deg);
}
.folder-container:hover .work-2 {
  transform: rotateX(-38deg);
}
.folder-container:hover .work-1 {
  box-shadow: inset 0 20px 40px rgba(251, 191, 36, 0.5), inset 0 -20px 40px rgba(217, 119, 6, 0.5);
  transform: rotateX(-46deg) translateY(1px);
}

.work-paper {
  position: absolute;
  inset: 4px;
  border-radius: 16px;
  transition: all 0.3s ease;
  transform-origin: bottom;
  user-select: none;
}
.work-4 { background: #a1a1aa; z-index: 1; }
.work-3 { background: #d4d4d8; z-index: 2; }
.work-2 { background: #e4e4e7; z-index: 3; }

.work-5 {
  position: absolute;
  width: 100%;
  height: 100%;
  background: #d97706;
  transform-origin: top;
  border-radius: 16px;
  border-top-left-radius: 0;
  transition: all 0.3s ease;
  z-index: 0;
}
.work-5::after {
  content: '';
  position: absolute;
  bottom: 99%;
  left: 0;
  width: 80px;
  height: 16px;
  background: #d97706;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
.work-5::before {
  content: '';
  position: absolute;
  top: -15px;
  left: 75.5px;
  width: 16px;
  height: 16px;
  background: #d97706;
  clip-path: polygon(0 35%, 0% 100%, 50% 100%);
}

.work-1 {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 156px;
  background: linear-gradient(to top, #f59e0b, #fbbf24);
  border-radius: 16px;
  border-top-right-radius: 0;
  transition: all 0.3s ease;
  transform-origin: bottom;
  display: flex;
  align-items: flex-end;
  z-index: 4;
}
.work-1::after {
  content: '';
  position: absolute;
  bottom: 99%;
  right: 0;
  width: 146px;
  height: 16px;
  background: #fbbf24;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
.work-1::before {
  content: '';
  position: absolute;
  top: -10px;
  right: 142px;
  width: 12px;
  height: 12px;
  background: #fbbf24;
  clip-path: polygon(100% 14%, 50% 100%, 100% 100%);
}

.folder-hint {
  font-size: 1.2rem;
  padding-top: 24px;
  opacity: 0.3;
  color: #fff;
  font-family: 'Inter', sans-serif;
  letter-spacing: 1px;
}
"@

Add-Content -Path "ui\style.css" -Value $newCss -Encoding UTF8
