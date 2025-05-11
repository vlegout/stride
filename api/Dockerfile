FROM python:3.12

WORKDIR /code

RUN pip install uv

COPY . /code

RUN uv sync --locked

CMD ["uv", "run", "fastapi", "run", "api/main.py", "--port", "80"]
