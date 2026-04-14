import io
import os
import logging

logger = logging.getLogger(__name__)

PREPROCESS_PDF = os.getenv("PREPROCESS_PDF", "true").lower() == "true"
PDF_CHUNK_SIZE = int(os.getenv("PDF_CHUNK_SIZE", "0"))  # 0 = no chunking


def preprocess_pdf(file_bytes: bytes) -> bytes:
    """
    Optimize a PDF before passing it to Docling:
    - Strip annotations (highlights, comments, form fields)
    - Clear metadata
    - Garbage-collect unused objects and deflate-compress streams

    This is lossless — no text or image content is modified.
    Falls back to the original bytes if anything goes wrong.
    """
    if not PREPROCESS_PDF:
        return file_bytes

    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=file_bytes, filetype="pdf")

        for page in doc:
            annot = page.first_annot
            while annot:
                next_annot = annot.next
                page.delete_annot(annot)
                annot = next_annot

        doc.set_metadata({})

        output = io.BytesIO()
        doc.save(output, garbage=3, deflate=True, clean=True)
        doc.close()

        result = output.getvalue()
        output.close()
        orig_kb = len(file_bytes) // 1024
        new_kb = len(result) // 1024
        if new_kb < orig_kb:
            logger.info(f"PDF optimized: {orig_kb} KB → {new_kb} KB ({orig_kb - new_kb} KB saved)")
        return result

    except Exception as e:
        logger.warning(f"PDF preprocessing failed, using original bytes: {e}")
        return file_bytes


def split_pdf_into_chunks(file_bytes: bytes, chunk_size: int) -> list[bytes]:
    """
    Split a PDF into chunks of `chunk_size` pages for parallel processing.
    Returns a list with a single item (the original bytes) if the PDF fits
    within one chunk or if splitting fails.
    """
    try:
        import fitz

        doc = fitz.open(stream=file_bytes, filetype="pdf")
        total_pages = len(doc)
        doc.close()

        if total_pages <= chunk_size:
            return [file_bytes]

        chunks = []
        for start in range(0, total_pages, chunk_size):
            end = min(start + chunk_size - 1, total_pages - 1)
            src = fitz.open(stream=file_bytes, filetype="pdf")
            chunk_doc = fitz.open()
            chunk_doc.insert_pdf(src, from_page=start, to_page=end)
            buf = io.BytesIO()
            chunk_doc.save(buf)
            chunk_doc.close()
            src.close()
            chunks.append(buf.getvalue())
            buf.close()

        logger.info(
            f"Split {total_pages}-page PDF into {len(chunks)} chunks "
            f"of up to {chunk_size} pages each"
        )
        return chunks

    except Exception as e:
        logger.warning(f"PDF chunking failed, processing as single document: {e}")
        return [file_bytes]
