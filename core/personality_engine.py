import sys
import json
import os
import numpy as np
from sentence_transformers import SentenceTransformer

STATE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "personality_state.json")

DEFAULT_STATE = {
    "Humor": 50.0,
    "Warmth": 60.0,
    "Sarcasm": 10.0,
    "Logic": 80.0,
    "Empathy": 60.0,
    "Creativity": 50.0,
    "Professionalism": 80.0
}

TRAIT_REFERENCES = {
    "Humor": "This is a hilarious joke haha funny laugh comedy",
    "Warmth": "I love this so sweet beautiful friends happy care",
    "Sarcasm": "Yeah right sure whatever obviously genius oh great",
    "Logic": "Therefore algorithm optimal precisely calculate system",
    "Empathy": "I understand sorry support apologize sad feel here for you",
    "Creativity": "Imagine brainstorm creative paint unique idea vision",
    "Professionalism": "Execute procedure protocol task complete sir madam"
}

# Lazy load embedder
embedder = None
TRAIT_EMBEDDINGS = {}

def get_embedder():
    global embedder, TRAIT_EMBEDDINGS
    if embedder is None:
        embedder = SentenceTransformer('all-MiniLM-L6-v2')
        TRAIT_EMBEDDINGS = {k: embedder.encode(v) for k, v in TRAIT_REFERENCES.items()}
    return embedder

def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                state = json.load(f)
                for k in DEFAULT_STATE:
                    if k not in state:
                        state[k] = DEFAULT_STATE[k]
                return state
        except Exception:
            return DEFAULT_STATE.copy()
    return DEFAULT_STATE.copy()

def save_state(state):
    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump(state, f)

def analyze_text(text, state):
    text = text.strip()
    if not text:
        return state
        
    get_embedder()
    
    text_emb = embedder.encode(text)
    
    for trait, ref_emb in TRAIT_EMBEDDINGS.items():
        sim = np.dot(text_emb, ref_emb) / (np.linalg.norm(text_emb) * np.linalg.norm(ref_emb) + 1e-10)
        
        # If highly similar semantically
        if sim > 0.25:
            shift = sim * 5.0 # Max shift of 5.0 points per analysis
            state[trait] = min(100.0, state[trait] + shift)
            
            # Opposing trait adjustments
            if trait == "Humor":
                state["Professionalism"] = max(0.0, state["Professionalism"] - (shift * 0.5))
            if trait == "Sarcasm":
                state["Warmth"] = max(0.0, state["Warmth"] - (shift * 0.5))
            if trait == "Logic":
                state["Empathy"] = max(0.0, state["Empathy"] - (shift * 0.3))
        else:
            # Drift towards baseline 50
            diff = 50.0 - state[trait]
            state[trait] += diff * 0.005

    for k in state:
        state[k] = round(state[k], 1)
        
    return state

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing action argument"}))
        return

    action = sys.argv[1]
    state = load_state()

    if action == "analyze":
        text = sys.argv[2] if len(sys.argv) > 2 else ""
        state = analyze_text(text, state)
        save_state(state)
        print(json.dumps({"status": "success", "state": state}))
        
    elif action == "set":
        trait = sys.argv[2].capitalize() if len(sys.argv) > 2 else ""
        value = sys.argv[3] if len(sys.argv) > 3 else None
        if trait in state and value is not None:
            try:
                state[trait] = float(value)
                state[trait] = max(0.0, min(100.0, state[trait]))
                save_state(state)
                print(json.dumps({"status": "success", "state": state}))
            except ValueError:
                print(json.dumps({"error": "Invalid value"}))
        else:
            print(json.dumps({"error": "Unknown trait or value"}))
            
    elif action == "get":
        print(json.dumps({"status": "success", "state": state}))
        
    else:
        print(json.dumps({"error": "Unknown action"}))

if __name__ == "__main__":
    main()
