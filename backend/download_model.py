import urllib.request
import os
import sys
from faster_whisper import WhisperModel

# Define direct download URL from the mirror
url = "https://hf-mirror.com/Systran/faster-whisper-small/resolve/main/model.bin"

# Dynamically locate the Hugging Face cache directory
home_dir = os.path.expanduser("~")
snapshot_dir = os.path.join(
    home_dir, 
    ".cache", 
    "huggingface", 
    "hub", 
    "models--Systran--faster-whisper-small", 
    "snapshots", 
    "536b0662742c02347bc0e980a01041f333bce120"
)
output_path = os.path.join(snapshot_dir, "model.bin")

# Ensure the directory exists
os.makedirs(snapshot_dir, exist_ok=True)

print("Hugging Face API connections seem to be blocked or extremely slow on your network.")
print("We are bypassing the API and downloading the model weights directly from a mirror.")
print(f"Destination: {output_path}\n")

def report_hook(block_num, block_size, total_size):
    downloaded = block_num * block_size
    percent = (downloaded / total_size) * 100 if total_size > 0 else 0
    sys.stdout.write(f"\rDownloading: {downloaded / (1024*1024):.2f} MB / {total_size / (1024*1024):.2f} MB ({percent:.2f}%)")
    sys.stdout.flush()

try:
    print("Starting direct download of model.bin (~460 MB)...")
    urllib.request.urlretrieve(url, output_path, reporthook=report_hook)
    print("\n\nSUCCESS: Download complete!")
    
    print("\nTesting loading the model in Whisper...")
    model = WhisperModel("small", device="cpu", compute_type="int8")
    print("SUCCESS: Whisper model successfully loaded and ready for use!")
    
except Exception as e:
    print(f"\n\nERROR: Download or validation failed: {e}", file=sys.stderr)
    sys.exit(1)
