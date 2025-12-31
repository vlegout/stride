FROM python:3.13-alpine

WORKDIR /code

RUN apk add --no-cache postgresql-dev

RUN pip install uv

COPY . /code

RUN uv sync --locked --no-dev

CMD ["uv", "run", "fastapi", "run", "python/api/app.py", "--port", "8080"]
