import json
import io
import os

import boto3

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


app = FastAPI()

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if "TOKEN" not in os.environ or "BUCKET" not in os.environ:
    raise ValueError("Missing environment variables: TOKEN or BUCKET")

TOKEN = os.environ.get("TOKEN")
BUCKET = os.environ.get("BUCKET")

s3 = boto3.client("s3")


@app.middleware("http")
async def verify_token(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)

    if request.url.path == "/":
        return await call_next(request)

    token = request.headers.get("Authorization")
    if not token or token != f"Bearer {TOKEN}":
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Unauthorized"},
        )
    return await call_next(request)


def get_data_from_s3(file_path: str):
    data = io.BytesIO()
    s3.download_fileobj(BUCKET, file_path, data)
    data.seek(0)
    return json.load(data)


@app.get("/")
def route_root():
    return JSONResponse(content={}, status_code=status.HTTP_200_OK)


@app.get("/{route}")
def route_home(route: str):
    return JSONResponse(get_data_from_s3(f"public/{route}.json"))


@app.get("/activities/{route}")
def route_activities(route: str):
    return JSONResponse(get_data_from_s3(f"public/activities/{route}.json"))
