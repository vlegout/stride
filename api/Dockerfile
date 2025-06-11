FROM python:3.12-alpine as builder

WORKDIR /code

RUN apk add --no-cache postgresql-dev

RUN pip install uv

COPY Cargo.lock Cargo.toml pyproject.toml uv.lock ./

RUN uv sync --locked --no-dev

FROM python:3.12-alpine

WORKDIR /code

RUN apk add --no-cache postgresql-libs

RUN addgroup -g 1001 -S sport && \
    adduser -u 1001 -S sport -G sport

COPY --from=builder /code/.venv /code/.venv

COPY . /code

RUN chown -R sport:sport /code
USER sport

EXPOSE 8080

CMD ["uv", "run", "fastapi", "run", "python/api/app.py", "--port", "8080"]
