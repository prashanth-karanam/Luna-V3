import sys
import json
import base64
import tempfile
import os
import argparse

def load_model(model_name="base.en"):
    try:
        import whisper
        import warnings
        warnings.filterwarnings("ignore", category=UserWarning)
        warnings.filterwarnings("ignore", category=FutureWarning)
        return whisper.load_model(model_name)
    except ImportError:
        print(json.dumps({"error": "openai-whisper is not installed. Run: pip install -r tools/requirements.txt"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

def transcribe_chunk(model, base64_audio, initial_prompt=""):
    if not base64_audio:
        return ""
    try:
        audio_data = base64.b64decode(base64_audio)
        fd, temp_path = tempfile.mkstemp(suffix=".webm")
        try:
            with os.fdopen(fd, 'wb') as f:
                f.write(audio_data)
            
            result = model.transcribe(temp_path, initial_prompt=initial_prompt)
            return result["text"].strip()
        finally:
            try:
                os.remove(temp_path)
            except:
                pass
    except Exception as e:
        return f"[Error: {str(e)}]"

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Whisper Transcriber")
    parser.add_argument("--stdin", action="store_true", help="Read single base64 string from stdin")
    parser.add_argument("--stream", action="store_true", help="Read stream of base64 lines from stdin")
    parser.add_argument("--model", type=str, default="base.en", help="Whisper model size (e.g. tiny.en, base.en)")
    parser.add_argument("audio", nargs="?", help="Base64 audio string (if not using stdin)")

    args = parser.parse_args()

    model = load_model(args.model)

    if args.stream:
        # Stream mode: read line by line from stdin, output JSON line by line
        print(json.dumps({"ok": True, "msg": f"Stream ready. Model: {args.model}"}))
        sys.stdout.flush()
        
        previous_text = ""
        while True:
            line = sys.stdin.readline()
            if not line:
                break
            line = line.strip()
            if not line:
                continue
                
            text = transcribe_chunk(model, line, initial_prompt=previous_text)
            if text and not text.startswith("[Error:"):
                previous_text += " " + text
                print(json.dumps({"ok": True, "text": text}))
            elif text.startswith("[Error:"):
                print(json.dumps({"error": text}))
            else:
                print(json.dumps({"ok": True, "text": ""}))
            sys.stdout.flush()
            
    elif args.stdin:
        b64 = sys.stdin.read().strip()
        text = transcribe_chunk(model, b64)
        if text.startswith("[Error:"):
            print(json.dumps({"error": text}))
        else:
            print(json.dumps({"ok": True, "text": text}))
    elif args.audio:
        text = transcribe_chunk(model, args.audio)
        if text.startswith("[Error:"):
            print(json.dumps({"error": text}))
        else:
            print(json.dumps({"ok": True, "text": text}))
    else:
        print(json.dumps({"error": "No audio provided"}))
