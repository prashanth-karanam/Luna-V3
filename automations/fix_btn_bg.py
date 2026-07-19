import re

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# I will completely replace the .button block and all its related styles with a fixed version
# The previous script added the new_css at the very end. Let's find `.button {` and replace everything to the end.

if '.button {' in css:
    base_css = css.split('.button {')[0]
else:
    base_css = css

new_css = """.button {
  --primary: #00b4ff;
  --neutral-1: #3a3a40;
  --neutral-2: #252528;
  --radius: 20px;

  cursor: pointer;
  border-radius: var(--radius);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.8);
  border: none;
  box-shadow: 0 0.5px 0.5px 1px rgba(255, 255, 255, 0.1),
    0 5px 10px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  min-width: 100px;
  padding: 0 1rem;
  height: 2.2rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: #ececec;
  background: var(--neutral-2);
  overflow: hidden;
}
.button:disabled {
  opacity: 0.4;
  pointer-events: none;
  filter: grayscale(100%);
}
.button:hover {
  transform: scale(1.02);
  box-shadow: 0 0 1px 2px rgba(255, 255, 255, 0.15),
    0 10px 20px rgba(0, 0, 0, 0.5);
}
.button:active {
  transform: scale(0.98);
}
.button:after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: var(--radius);
  border: 1px solid transparent;
  background: linear-gradient(var(--neutral-1), var(--neutral-2)) padding-box,
    linear-gradient(to bottom, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05)) border-box;
  z-index: 0;
  transition: all 0.4s ease;
}
.button:hover::after {
  transform: scale(1.05, 1.1);
}
.button::before {
  content: "";
  inset: 2px 2px 2px 2px;
  position: absolute;
  background: linear-gradient(to top, var(--neutral-1), var(--neutral-2));
  border-radius: 20px;
  filter: blur(0.5px);
  z-index: 1;
}
.state p {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  position: relative;
  z-index: 3;
}
.state .icon {
  position: absolute;
  left: 10px;
  top: 0;
  bottom: 0;
  margin: auto;
  transform: scale(1.1);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 3;
}
.state .icon svg {
  overflow: visible;
  fill: currentColor;
}

/* Outline */
.outline {
  position: absolute;
  border-radius: inherit;
  overflow: hidden;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.4s ease;
  inset: -1px;
}
.outline::before {
  content: "";
  position: absolute;
  inset: -100%;
  background: conic-gradient(from 180deg, transparent 60%, var(--primary) 80%, transparent 100%);
  animation: spin 2s linear infinite;
  animation-play-state: paused;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.button:hover .outline { opacity: 1; }
.button:hover .outline::before { animation-play-state: running; }

/* Letters */
.state p span {
  display: block;
  opacity: 0;
  animation: slideDown 0.8s ease forwards calc(var(--i) * 0.03s);
}
.button:hover p span {
  opacity: 1;
  animation: wave 0.5s ease forwards calc(var(--i) * 0.02s);
}
.button:focus p span, .button:active p span {
  opacity: 1;
  animation: disapear 0.6s ease forwards calc(var(--i) * 0.03s);
}
@keyframes wave {
  30% { opacity: 1; transform: translateY(2px); }
  50% { opacity: 1; transform: translateY(-2px); color: var(--primary); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes slideDown {
  0% { opacity: 0; transform: translateY(-10px) translateX(2px) rotate(-45deg); color: var(--primary); filter: blur(2px); }
  30% { opacity: 1; transform: translateY(2px); filter: blur(0); }
  50% { opacity: 1; transform: translateY(-2px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes disapear {
  from { opacity: 1; }
  to { opacity: 0; transform: translateX(5px) translateY(10px); color: var(--primary); filter: blur(2px); }
}

/* Plane */
.state--default .icon svg { animation: land 0.6s ease forwards; }
.button:hover .state--default .icon { transform: rotate(45deg) scale(1.1); }
.button:focus .state--default svg, .button:active .state--default svg { animation: takeOff 0.8s linear forwards; }
.button:focus .state--default .icon, .button:active .state--default .icon { transform: rotate(0) scale(1.1); }
@keyframes takeOff {
  0% { opacity: 1; }
  60% { opacity: 1; transform: translateX(30px) rotate(45deg) scale(1.5); }
  100% { opacity: 0; transform: translateX(80px) rotate(45deg) scale(0); }
}
@keyframes land {
  0% { transform: translateX(-30px) translateY(15px) rotate(-50deg) scale(1.5); opacity: 0; filter: blur(2px); }
  100% { transform: translateX(0) translateY(0) rotate(0); opacity: 1; filter: blur(0); }
}

/* Contrail */
.state--default .icon:before {
  content: ""; position: absolute; top: 50%; height: 2px; width: 0; left: -2px;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.5));
}
.button:focus .state--default .icon:before, .button:active .state--default .icon:before { animation: contrail 0.8s linear forwards; }
@keyframes contrail {
  0% { width: 0; opacity: 1; }
  8% { width: 10px; }
  60% { opacity: 0.7; width: 40px; }
  100% { opacity: 0; width: 80px; }
}

/* States */
.state { padding-left: 20px; z-index: 3; display: flex; position: relative; }
.state--sent { display: none; }
.state--sent svg { transform: scale(1.1); margin-right: 4px; }
.button:focus .state--default, .button:active .state--default { position: absolute; }
.button:focus .state--sent, .button:active .state--sent { display: flex; }
.button:focus .state--sent span, .button:active .state--sent span { opacity: 0; animation: slideDown 0.8s ease forwards calc(var(--i) * 0.2s); }
.button:focus .state--sent .icon svg, .button:active .state--sent .icon svg { opacity: 0; animation: appear 1.2s ease forwards 0.8s; }
@keyframes appear {
  0% { opacity: 0; transform: scale(2) rotate(-40deg); color: var(--primary); filter: blur(2px); }
  30% { opacity: 1; transform: scale(0.8); filter: blur(1px); }
  50% { opacity: 1; transform: scale(1.1); filter: blur(0); }
  100% { opacity: 1; transform: scale(1); }
}
"""

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(base_css + new_css)
