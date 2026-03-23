FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ghc \
    python3 \
    # Parser combinator libraries
    libghc-attoparsec-dev \
    libghc-megaparsec-dev \
    # JSON
    libghc-aeson-dev \
    libghc-aeson-pretty-dev \
    # Data structures
    libghc-vector-dev \
    libghc-hashable-dev \
    libghc-split-dev \
    # Numbers / text utilities
    libghc-scientific-dev \
    && rm -rf /var/lib/apt/lists/*

COPY server.py /app/server.py
WORKDIR /app

EXPOSE 8080
CMD ["python3", "server.py"]
