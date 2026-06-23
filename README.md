# AI Alcohol Label Verifier

Prototype for TTB to verify alcohol labels using AI (OpenAI) and OCR.

## Setup
1. Backend: `cd backend`, create `.env` with `OPENAI_API_KEY`, run `pip install -r requirements.txt` then `uvicorn app.main:app --reload`
2. Frontend: `cd frontend`, run `npm install` then `npm run dev`