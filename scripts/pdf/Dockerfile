# CI-only image for product-PDF generation.
#
# Provides pandoc + weasyprint (and the fonts they need) so the PDF stage can run
# in CI without touching contributor laptops (where Homebrew is banned). Run this
# AFTER `pnpm build` (specifically after build:combine) so dist/ — including the
# deduplicated dist/images and the per-page .md twins — exists.
#
# Usage (from repo root, with dist/ already built):
#   docker build -f scripts/pdf/Dockerfile -t ovh-docs-pdf .
#   docker run --rm -v "$PWD:/work" -w /work ovh-docs-pdf pnpm build:pdfs
#
# Pin versions for reproducible PDFs.
FROM pandoc/core:3.5-ubuntu

# Node + pnpm (to run the TS orchestrator) and weasyprint + fonts.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3-pip \
      weasyprint \
      fonts-dejavu \
      fonts-liberation \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Node 22 (matches the repo toolchain) + pnpm via corepack.
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && corepack enable \
    && rm -rf /var/lib/apt/lists/*

# pandoc/core sets ENTRYPOINT to pandoc; reset so we can run arbitrary commands.
ENTRYPOINT []
CMD ["bash"]
