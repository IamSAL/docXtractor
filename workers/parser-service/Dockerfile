# ---- Builder stage ----
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY requirements.txt .

# Install CPU-only PyTorch first (docling pulls torch as a transitive dep)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system --no-cache-dir \
    torch torchvision --index-url https://download.pytorch.org/whl/cpu

RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system --no-cache-dir -r requirements.txt

# Pre-download HuggingFace models into the image so they're baked in
RUN python -c "\
import torch; torch.backends.mkldnn.enabled = False; \
from docling.datamodel.base_models import InputFormat; \
from docling.datamodel.pipeline_options import PdfPipelineOptions; \
from docling.document_converter import DocumentConverter, PdfFormatOption; \
pipeline_options = PdfPipelineOptions(do_ocr=False, do_table_structure=True); \
DocumentConverter( \
    allowed_formats=[InputFormat.PDF], \
    format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)} \
); \
print('Models pre-downloaded successfully')"

# ---- Runtime stage ----
FROM python:3.11-slim

WORKDIR /app

# Only runtime system libs — no build-essential, no tesseract
RUN apt-get update && apt-get install -y \
    curl \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy pre-downloaded HuggingFace models from builder
COPY --from=builder /root/.cache/huggingface /root/.cache/huggingface

# Skip HuggingFace online revision checks — use baked-in models only
ENV HF_HUB_OFFLINE=1

COPY . .

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8001"]
