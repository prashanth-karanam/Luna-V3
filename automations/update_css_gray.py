import re
import os

with open('style.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start of the new UI styles
marker = '/* =========================================\n   NEW AI-INPUT UI STYLES (Luna Aesthetic)\n   ========================================= */'
if marker in content:
    base_content = content.split(marker)[0]
else:
    # Try the original one if it wasn't successfully overwritten
    marker2 = '/* =========================================\n   NEW AI-INPUT UI STYLES \n   ========================================= */'
    if marker2 in content:
        base_content = content.split(marker2)[0]
    else:
        base_content = content.split('.AI-Input {')[0]

new_css = """/* =========================================
   NEW AI-INPUT UI STYLES (Luna Aesthetic)
   ========================================= */

.AI-Input {
  --primary-color: rgba(30, 30, 35, 0.6);
  --neutral-color: #ececec;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  position: relative;
  width: 100%;
  margin: 0;
  user-select: none;
  z-index: 100;
}

#voice { display: none; }
#voice + label { margin-right: 5rem; transition: all 0.2s ease-in-out; }
#voice:checked ~ label { opacity: 1; transform: translateY(0); pointer-events: all; }
#voice:checked ~ label:first-of-type { transition: all 0.2s 0.2s ease-in-out; }
#voice:checked ~ label:last-of-type { transition: all 0.2s 0.1s ease-in-out; }
#voice:checked ~ .chat-marquee { opacity: 0; transform: translateY(-300%) scale(0.9); }
#voice:checked ~ .chat-container { width: 10rem; height: 10rem; top: -6em; border-radius: 30% 45% 30% 40%; animation: rotate 10s 0.2s linear infinite; border-color: rgba(255,255,255,0.4); box-shadow: 0 0 20px rgba(0,0,0,0.4); }
#voice:checked ~ .chat-container > .chat-wrapper { opacity: 0; pointer-events: none; }
#voice:checked ~ .chat-container:active { scale: 0.9; }

#mic { display: none; }
#mic + label { margin-left: 5rem; width: 62px; aspect-ratio: 1 / 1; transition: all 0.2s ease-in-out; }
#mic + label > svg { position: absolute; transition: all 0.2s ease-in-out; fill: #fff; }
#mic + label > svg:first-of-type { opacity: 1; }
#mic + label > svg:last-of-type { opacity: 0; fill: var(--red); }
#mic:checked + label { background-color: rgba(255, 0, 0, 0.1); box-shadow: 0 0 15px rgba(255,0,0,0.2); }
#mic:checked + label > :first-child { opacity: 0; }
#mic:checked + label > :last-child { opacity: 1; }

#voice + label, #mic + label {
  display: flex; justify-content: center; align-items: center; position: absolute; bottom: 0; padding: 1rem;
  background-color: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 50%;
  opacity: 0; cursor: pointer; pointer-events: none; transform: translateY(100%); backdrop-filter: blur(8px);
}
#voice + label > svg { fill: #fff; }

.chat-marquee {
  --gap: 0.8em; display: flex; gap: var(--gap); margin-bottom: 0.6rem; width: 100%;
  mask-image: linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,1) 10%, rgba(0,0,0,1) 90%, rgba(0,0,0,0));
  overflow: hidden; transition: all 0.2s ease-in-out;
}
.chat-marquee > ul { display: flex; gap: var(--gap); flex-shrink: 0; justify-content: space-around; list-style: none; animation: scroll-marquee-left 40s linear infinite; padding: 0; margin: 0; }
.chat-marquee > ul > li {
  padding: 0.4rem 1rem; 
  background-color: rgba(0, 0, 0, 0.4); 
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 20px; color: #ececec; font-size: 0.8rem; font-family: 'Inter', sans-serif; cursor: pointer;
  transition: all 0.2s ease-in-out; white-space: nowrap; backdrop-filter: blur(12px);
}
.chat-marquee > ul > li:hover { background-color: rgba(0, 0, 0, 0.6); color: #fff; border-color: rgba(255,255,255,0.3); box-shadow: 0 0 15px rgba(255,255,255,0.05); }
.chat-marquee > ul > li:active { transform: scale(0.96); }
.chat-marquee:hover > ul { animation-play-state: paused !important; }

.chat-container {
  position: relative; top: 0; width: 100%; 
  background: var(--primary-color);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.12); 
  border-radius: 20px; overflow: hidden;
  transition: all 0.3s cubic-bezier(0.3, 1.5, 0.6, 1); z-index: 2; 
  box-shadow: 0 -5px 20px rgba(0,0,0,0.4);
  margin-bottom: 4px;
}
.chat-container:focus-within { border-color: rgba(255,255,255,0.3); }

/* Removed the huge radial blue glow before the container */
.chat-container::before { display: none; }

.chat-wrapper { display: flex; justify-content: center; align-items: center; flex-direction: column; padding: 0.5rem 1rem; z-index: 200; transition: all 0.2s ease-in-out; }

#msgInput {
  padding: 0.4rem 0.2rem; width: 100%; min-height: 2.2rem; max-height: 150px; background: none; border: none;
  color: #ececec; font-size: 0.95rem; font-family: 'Inter', sans-serif; line-height: 1.5; outline: none; resize: none;
}
#msgInput::placeholder { color: #888; font-weight: 400; }
#msgInput::-webkit-scrollbar { width: 0.4rem; border-radius: 9999px; }
#msgInput::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.2); border-radius: 9999px; }
#msgInput::-webkit-scrollbar-track { background-color: transparent; }

.button-bar { display: flex; justify-content: space-between; margin-top: 0; width: 100%; align-items: center; }

.left-buttons { display: flex; gap: 0.4rem; }
.left-buttons > label {
  display: flex; justify-content: center; align-items: center; width: 2.2rem; height: 2.2rem;
  border: none; border-radius: 50%; cursor: pointer;
  transition: all 0.2s ease-in-out; background: transparent;
}
.left-buttons > label > svg { fill: #888; transition: fill 0.2s; width: 18px; height: 18px; }
.left-buttons > label:hover { background: rgba(255,255,255,0.08); }
.left-buttons > label:hover > svg { fill: #ececec; }
.left-buttons > label:active { transform: scale(0.9); }

#appendix, #camera, #imgUploadInput, #files { display: none; }
#appendix:checked ~ #appendix-bar { background-color: rgba(20, 20, 20, 0.9); backdrop-filter: blur(12px); pointer-events: all; transition: all 0.2s ease-in-out; border-radius: 20px; }
#appendix:checked ~ #appendix-bar > label { opacity: 1; transform: translate(0); }

#appendix-bar {
  display: flex; justify-content: center; align-items: center; gap: 1.2rem; position: absolute;
  top: 0; left: 0; width: 100%; height: 100%; border-radius: 20px; overflow: hidden;
  pointer-events: none; z-index: 100; transition: all 0.2s 0.2s ease-in-out;
}
#appendix-bar > label {
  display: flex; justify-content: center; align-items: center; width: 3rem; height: 3rem;
  background-color: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%;
  cursor: pointer; opacity: 0; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); transform: translate(-50%, 150%);
}
#appendix-bar > label > svg { fill: #ececec; width: 20px; height: 20px; transition: all 0.2s; }
#appendix-bar > label:hover { background-color: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); transform: scale(1.05) !important; }

#appendix-bar > :nth-child(1) { transition-delay: 0.05s; }
#appendix-bar > :nth-child(2) { transition-delay: 0.1s; }
#appendix-bar > :nth-child(3) { transition-delay: 0.15s; }
#appendix-bar > :nth-child(4) { transition-delay: 0.2s; }

#search { display: none; }
#search:checked + label { background: rgba(255,255,255,0.15); }
#search:checked + label > svg { fill: #fff; }

.right-buttons { display: flex; gap: 0.5rem; align-items: center; }
.right-buttons > label, .right-buttons > button {
  position: relative; background: none; border: none; cursor: pointer; transition: all 0.2s ease-in-out;
  display: flex; align-items: center; justify-content: center; width: 2.2rem; height: 2.2rem; border-radius: 50%;
}
.right-buttons > label > svg { fill: #888; transition: fill 0.2s; width: 18px; height: 18px; }
.right-buttons > label:hover { background: rgba(255,255,255,0.08); }
.right-buttons > label:hover > svg { fill: #ececec; }

.send-btn { 
  background: rgba(255,255,255,0.15) !important; 
  width: 2.2rem; height: 2.2rem; border-radius: 50% !important; 
  box-shadow: none !important;
}
.send-btn > svg { fill: #ececec; width: 16px; height: 16px; transition: transform 0.2s; }
.send-btn:hover { background: #fff !important; }
.send-btn:hover > svg { fill: #111; transform: translate(1px, -1px); }

@keyframes rotate {
  0% { transform: rotate(0); border-radius: 30% 45% 30% 40%; }
  25% { transform: rotate(90deg); border-radius: 40% 30% 45% 30%; }
  50% { transform: rotate(180deg); border-radius: 45% 30% 40% 30%; }
  75% { transform: rotate(270deg); border-radius: 30% 40% 30% 45%; }
  100% { transform: rotate(360deg); border-radius: 30% 45% 30% 40%; }
}
@keyframes scroll-marquee-left {
  to { transform: translateX(calc(-100% - var(--gap))); }
}
"""

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(base_content + '\n' + new_css)
