FROM python:3.13-alpine AS builder

WORKDIR /code

RUN apk add --no-cache postgresql-dev

RUN pip install --no-cache-dir uv

COPY .python-version pyproject.toml uv.lock ./
COPY Cargo.lock Cargo.toml ./
COPY python/ ./python/
COPY src/ ./src/

RUN uv sync --locked --no-dev


FROM python:3.13-alpine

WORKDIR /code

RUN apk add --no-cache libpq libgcc

COPY --from=builder /usr/local/bin/uv /usr/local/bin/uv
COPY --from=builder /code/.venv /code/.venv
COPY --from=builder /code/python /code/python

CMD ["uv", "run", "fastapi", "run", "python/api/app.py", "--port", "8080"]
