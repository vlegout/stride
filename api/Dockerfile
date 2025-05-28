FROM python:3.12-alpine

WORKDIR /code

RUN pip install uv

COPY . /code

RUN uv sync --locked

CMD ["uv", "run", "fastapi", "run", "python/api/app.py", "--port", "8080"]
