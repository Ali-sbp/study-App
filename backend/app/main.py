from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users, lectures, chat, execute

app = FastAPI(title="HaskellStudy API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://nextjs:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(lectures.router)
app.include_router(chat.router)
app.include_router(execute.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
