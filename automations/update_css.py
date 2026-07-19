import os
import re

with open('style.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Find where to split
marker = '/* =========================================\n   NEW AI-INPUT UI STYLES (Luna Aesthetic)\n   ========================================= */'
if marker in content:
    base_content = content.split(marker)[0]
else:
    base_content = content.split('.AI-Input {')[0]

new_css = """/* =========================================
   NEW AI-INPUT UI STYLES (Luna Aesthetic)
   ========================================= */

.AI-Input {
  --primary-color: var(--bg-800);
  --neutral-color: var(--dim);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  position: relative;
  width: 100%;
  user-select: none;
  z-index: 100;
}

#voice { display: none; }
#voice + label { margin-right: 5rem; transition: all 0.2s ease-in-out; }
#voice:checked ~ label { opacity: 1; transform: translateY(0); pointer-events: all; }
#voice:checked ~ label:first-of-type { transition: all 0.2s 0.2s ease-in-out; }
#voice:checked ~ label:last-of-type { transition: all 0.2s 0.1s ease-in-out; }
#voice:checked ~ .chat-marquee { opacity: 0; transform: translateY(-300%) scale(0.9); }
#voice:checked ~ .chat-container { width: 10rem; height: 10rem; top: -6em; border-radius: 30% 45% 30% 40%; animation: rotate 10s 0.2s linear infinite; border-color: var(--blue); box-shadow: 0 0 20px rgba(0,180,255,0.4); }
#voice:checked ~ .chat-container > .chat-wrapper { opacity: 0; pointer-events: none; }
#voice:checked ~ .chat-container:active { scale: 0.9; }

#mic { display: none; }
#mic + label { margin-left: 5rem; width: 62px; aspect-ratio: 1 / 1; transition: all 0.2s ease-in-out; }
#mic + label > svg { position: absolute; transition: all 0.2s ease-in-out; fill: var(--blue); }
#mic + label > svg:first-of-type { opacity: 1; }
#mic + label > svg:last-of-type { opacity: 0; fill: var(--red); }
#mic:checked + label { background-color: rgba(255, 0, 0, 0.1); box-shadow: 0 0 15px rgba(255,0,0,0.2); }
#mic:checked + label > :first-child { opacity: 0; }
#mic:checked + label > :last-child { opacity: 1; }

#voice + label, #mic + label {
  display: flex; justify-content: center; align-items: center; position: absolute; bottom: 0; padding: 1rem;
  background-color: rgba(0,180,255,0.1); border: 1px solid rgba(0,180,255,0.3); border-radius: 50%;
  opacity: 0; cursor: pointer; pointer-events: none; transform: translateY(100%); backdrop-filter: blur(5px);
}
#voice + label > svg { fill: var(--blue); }

.chat-marquee {
  --gap: 1em; display: flex; gap: var(--gap); margin-bottom: 0.3rem; width: 100%;
  mask-image: linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, rgba(0,0,0,0));
  overflow: hidden; transition: all 0.2s ease-in-out;
}
.chat-marquee > ul { display: flex; gap: var(--gap); flex-shrink: 0; justify-content: space-around; list-style: none; animation: scroll-marquee-left 40s linear infinite; padding: 0; margin: 0; }
.chat-marquee > ul > li {
  padding: 0.3rem 0.8rem; 
  background-color: transparent; 
  border: 1px solid rgba(0,180,255,0.3);
  border-radius: 20px; color: var(--blue); font-size: 0.75rem; font-family: 'Inter', sans-serif; cursor: pointer;
  transition: all 0.2s ease-in-out, transform 0.1s ease-in-out; white-space: nowrap; backdrop-filter: blur(5px);
}
.chat-marquee > ul > li:hover { background-color: rgba(0,180,255,0.15); color: #fff; box-shadow: 0 0 10px rgba(0,180,255,0.2); }
.chat-marquee > ul > li:active { transform: scale(0.95); }
.chat-marquee:hover > ul { animation-play-state: paused !important; }

.chat-container {
  position: relative; top: 0; width: 100%; background: var(--bg-800);
  border: 1px solid rgba(0,180,255,0.22); border-radius: var(--r-lg); overflow: hidden;
  transition: all 0.3s cubic-bezier(0.3, 1.5, 0.6, 1); z-index: 2; box-shadow: 0 5px 20px rgba(0,0,0,0.5);
}
.chat-container:focus-within { border-color: rgba(0,180,255,0.5); box-shadow: 0 0 0 3px rgba(0,180,255,0.07), 0 5px 20px rgba(0,0,0,0.5); }

.chat-container::before {
  content: ""; position: absolute; top: -9rem; left: -6rem; width: 15rem; height: 15rem;
  background: radial-gradient(circle, rgba(0,180,255,0.4) 0%, rgba(0,180,255,0.05) 40%, transparent 70%);
  filter: blur(20px); border-radius: 50%; z-index: -1; transition: all 0.8s cubic-bezier(0.3, 1.5, 0.6, 1);
  opacity: 0.3; pointer-events: none;
}
.chat-container:focus-within::before { top: -4rem; left: 50%; transform: translateX(-50%); filter: blur(40px); opacity: 0.5; }

.chat-wrapper { display: flex; justify-content: center; align-items: center; flex-direction: column; padding: 0.4rem 0.8rem; z-index: 200; transition: all 0.2s ease-in-out; }

#msgInput {
  padding: 0.2rem 0.2rem; width: 100%; min-height: 1.8rem; max-height: 120px; background: none; border: none;
  color: var(--text); font-size: 0.93rem; font-family: inherit; line-height: 1.4; outline: none; resize: none;
}
#msgInput::placeholder { color: var(--dim); }
#msgInput::-webkit-scrollbar { width: 0.5rem; border-radius: 9999px; }
#msgInput::-webkit-scrollbar-thumb { background-color: var(--blue); border-radius: 9999px; }
#msgInput::-webkit-scrollbar-track { background-color: transparent; }

.button-bar { display: flex; justify-content: space-between; margin-top: 0; width: 100%; align-items: center; }

.left-buttons { display: flex; gap: 0.4rem; }
.left-buttons > label {
  display: flex; justify-content: center; align-items: center; width: 1.8rem; height: 1.8rem;
  border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 50%; cursor: pointer;
  transition: all 0.2s ease-in-out; background: rgba(255,255,255,0.03);
}
.left-buttons > label > svg { fill: var(--dim); transition: fill 0.2s; width: 14px; height: 14px; }
.left-buttons > label:hover { background: rgba(0,180,255,0.1); border-color: rgba(0,180,255,0.3); }
.left-buttons > label:hover > svg { fill: var(--blue); }
.left-buttons > label:active { transform: scale(0.9); }

#appendix, #camera, #imgUploadInput, #files { display: none; }
#appendix:checked ~ #appendix-bar { background-color: rgba(0, 0, 0, 0.8); backdrop-filter: blur(8px); pointer-events: all; transition: all 0.2s ease-in-out; }
#appendix:checked ~ #appendix-bar > label { opacity: 1; transform: translate(0); }

#appendix-bar {
  display: flex; justify-content: center; align-items: center; gap: 1.5rem; position: absolute;
  top: 0; left: 0; width: 100%; height: 100%; border-radius: var(--r-lg); overflow: hidden;
  pointer-events: none; z-index: 100; transition: all 0.2s 0.2s ease-in-out;
}
#appendix-bar > label {
  display: flex; justify-content: center; align-items: center; width: 3rem; height: 3rem;
  background-color: rgba(0,180,255,0.1); border: 1px solid rgba(0,180,255,0.3); border-radius: 50%;
  cursor: pointer; opacity: 0; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); transform: translate(-50%, 150%);
}
#appendix-bar > label > svg { fill: var(--blue); width: 22px; height: 22px; transition: all 0.2s; }
#appendix-bar > label:hover { background-color: rgba(0,180,255,0.2); box-shadow: 0 0 15px rgba(0,180,255,0.4); transform: scale(1.1) !important; }
#appendix-bar > label:hover > svg { fill: #fff; }

#appendix-bar > :nth-child(1) { transition-delay: 0.05s; }
#appendix-bar > :nth-child(2) { transition-delay: 0.1s; }
#appendix-bar > :nth-child(3) { transition-delay: 0.15s; }
#appendix-bar > :nth-child(4) { transition-delay: 0.2s; }

#search { display: none; }
#search:checked + label { border-color: var(--blue); background: rgba(0,180,255,0.1); }
#search:checked + label > svg { fill: var(--blue); }

.right-buttons { display: flex; gap: 0.8rem; align-items: center; }
.right-buttons > label, .right-buttons > button {
  position: relative; background: none; border: none; cursor: pointer; transition: all 0.2s ease-in-out;
  display: flex; align-items: center; justify-content: center;
}
.right-buttons > label > svg { fill: var(--dim); transition: fill 0.2s; width: 16px; height: 16px; }
.right-buttons > label:hover > svg { fill: var(--blue); }
.right-buttons > label:hover { transform: translateY(-10%) scale(1.1); }

.send-btn { 
  background: linear-gradient(135deg, var(--blue-dk), #0066ff) !important; 
  width: 2rem; height: 2rem; border-radius: 50% !important; 
  box-shadow: 0 4px 14px rgba(0,100,255,0.4); 
}
.send-btn > svg { fill: #fff; width: 14px; height: 14px; transition: transform 0.2s; }
.send-btn:hover { box-shadow: 0 4px 20px rgba(0,100,255,0.65); transform: translateY(-1px) scale(1.05) !important; }
.send-btn:hover > svg { transform: translate(1px, -1px); }

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
