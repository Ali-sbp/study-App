FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ghc \
    python3 \
    # ── Parser combinators ────────────────────────────────────────
    libghc-attoparsec-dev \
    libghc-megaparsec-dev \
    libghc-parsec3-dev \
    # ── JSON / serialisation ──────────────────────────────────────
    libghc-aeson-dev \
    libghc-aeson-pretty-dev \
    # ── Data structures ───────────────────────────────────────────
    libghc-vector-dev \
    libghc-hashable-dev \
    libghc-unordered-containers-dev \
    libghc-containers-dev \
    libghc-split-dev \
    libghc-dlist-dev \
    libghc-psqueues-dev \
    libghc-fingertree-dev \
    libghc-fgl-dev \
    # ── Numbers / text ────────────────────────────────────────────
    libghc-scientific-dev \
    libghc-text-dev \
    libghc-bytestring-dev \
    libghc-utf8-string-dev \
    libghc-base64-bytestring-dev \
    # ── Utility extras ────────────────────────────────────────────
    libghc-extra-dev \
    libghc-data-default-dev \
    # ── Random / IO ───────────────────────────────────────────────
    libghc-random-dev \
    libghc-mwc-random-dev \
    libghc-async-dev \
    libghc-stm-dev \
    # ── Monad transformers / MTL ──────────────────────────────────
    libghc-mtl-dev \
    libghc-transformers-dev \
    libghc-monad-loops-dev \
    libghc-monad-control-dev \
    libghc-free-dev \
    libghc-exceptions-dev \
    # ── Regex ─────────────────────────────────────────────────────
    libghc-regex-base-dev \
    libghc-regex-tdfa-dev \
    libghc-regex-compat-dev \
    # ── Time / date ───────────────────────────────────────────────
    libghc-time-dev \
    # ── Lenses / optics ───────────────────────────────────────────
    libghc-lens-dev \
    libghc-microlens-dev \
    libghc-microlens-mtl-dev \
    # ── Category theory / type-level ──────────────────────────────
    libghc-comonad-dev \
    libghc-semigroupoids-dev \
    libghc-bifunctors-dev \
    libghc-profunctors-dev \
    libghc-these-dev \
    libghc-kan-extensions-dev \
    # ── Testing ───────────────────────────────────────────────────
    libghc-quickcheck2-dev \
    libghc-hspec-dev \
    libghc-hunit-dev \
    && rm -rf /var/lib/apt/lists/*

COPY server.py /app/server.py
COPY ghci-init.ghci /app/ghci-init.ghci
WORKDIR /app

EXPOSE 8080
CMD ["python3", "server.py"]
