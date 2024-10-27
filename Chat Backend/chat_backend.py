from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi
from urllib.parse import urlparse, parse_qs
import google.generativeai as genai

app = FastAPI()

origins = [
    "http://localhost",
    # "http://localhost:8000",
    # "http://localhost:8001",
    "https://www.youtube.com",
    "chrome-extension://cikpffjdginebfcmhaieimnfjhljhefa"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


chat = None
context = None

class InitRequest(BaseModel):
    video_url: str

class ChatRequest(BaseModel):
    user_input: str

def get_video_id(url):
    parsed_url = urlparse(url)
    if parsed_url.hostname == 'youtu.be':
        return parsed_url.path[1:]
    if parsed_url.hostname in {'www.youtube.com', 'youtube.com'}:
        if parsed_url.path == '/watch':
            return parse_qs(parsed_url.query)['v'][0]
    raise ValueError('Invalid YouTube URL')

def get_transcript(url):
    try:
        video_id = get_video_id(url)
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        return ' '.join([entry['text'] for entry in transcript_list])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error getting transcript: {str(e)}")

def init_gemini():
    GOOGLE_API_KEY = "AIzaSyBPgo96MnIClI34mqXv5mppsT2vAchuny4"
    genai.configure(api_key=GOOGLE_API_KEY)

    generation_config = {
        'max_output_tokens': 70,
        'temperature': 0.7,
        'top_p': 0.8,
        'top_k': 40
    }

    model = genai.GenerativeModel('gemini-1.5-flash', generation_config=generation_config)
    return model

def create_context(transcript):
    return f"""You are a helpful assistant that has watched a video with the following transcript:
    {transcript}
    
    Please answer questions about this video's content. If the question is not related to the video,
    politely redirect the user to ask about the video content. And please answer under 50 words."""

@app.post("/initialize")
async def initialize_chat(req: InitRequest):
    global chat, context
    try:
        print(req)
        transcript = get_transcript(req.video_url)
        model = init_gemini()
        context = create_context(transcript)
        chat = model.start_chat(history=[])
        chat.send_message(context)
        return {"status": "success", "message": "Chat initialized with video content."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/chat")
async def chat_with_gemini(req: ChatRequest):
    global chat
    if chat is None:
        raise HTTPException(status_code=400, detail="Chat not initialized. Please initialize first.")
    try:
        response = chat.send_message(req.user_input)
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during chat: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
