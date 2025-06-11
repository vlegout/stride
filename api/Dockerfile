FROM python:3.12-alpine

WORKDIR /code

RUN apk add --no-cache postgresql-dev && apt install uv

COPY . /code

RUN uv sync --locked --no-dev

CMD ["uv", "run", "fastapi", "run", "python/api/app.py", "--port", "8080"]
