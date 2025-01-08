FROM python:3.10

ENV PYTHONUNBUFFERED=1
WORKDIR /backend/

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.5.11 /uv /uvx /bin/

ENV PYTHONPATH=/backend:/backend/app
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

COPY pyproject.toml uv.lock /backend/

RUN pip install uvicorn fastapi pytz numpy matplotlib scipy bleak prompt_toolkit plotly

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --verbose

COPY ./app /backend/app

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --verbose
