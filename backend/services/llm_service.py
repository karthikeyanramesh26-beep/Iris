import os
import sys
from huggingface_hub import InferenceClient

hf_token = os.environ.get("HF_TOKEN")
if not hf_token:
    print("CRITICAL ERROR: HF_TOKEN environment variable is missing.", file=sys.stderr)
    print("Please set your Hugging Face token in the .env file.", file=sys.stderr)
    sys.exit(1)

hf_client = InferenceClient(api_key=hf_token)

def generate_chat_response(prompt: str) -> str:
    if not hf_client:
        raise Exception("HF Token missing")
        
    system_prompt = (
        "You are Iris, a supportive teacher. "
        "Speak with patience, clarity, and encourage the user to explore and learn. "
        "Provide clean and well-structured educational explanations. "
        "CRITICAL: Do NOT use ANY markdown formatting in your responses. Do not use *, **, #, or ` (backticks). "
        "If you must provide a list, use plain text formatting such as numbering or simple dashes (-), "
        "but keep the response completely plain and educational."
    )
        
    response = hf_client.chat_completion(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        model="Qwen/Qwen2.5-7B-Instruct",
        max_tokens=1000
    )
    return response.choices[0].message.content

def translate_to_english(text: str) -> str:
    if not hf_client or not text.strip():
        return ""
    
    system_prompt = (
        "Translate the following user input text into clean English. "
        "Provide ONLY the plain English translation. Do not include explanations, quotes, or introduction. "
        "If the text is already in English, return it exactly as it is."
    )
    
    try:
        response = hf_client.chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            model="Qwen/Qwen2.5-7B-Instruct",
            max_tokens=500
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Translation error: {e}")
        return ""
