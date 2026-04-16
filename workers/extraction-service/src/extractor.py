import os
import logging
import json
import textwrap
from openai import OpenAI
import langextract as lx
from langextract.data import ExampleData, Extraction
try:
    from json_repair import repair_json
except ImportError:
    # Fallback: if json_repair not installed, use plain json
    def repair_json(s, *args, **kwargs):
        return s

logger = logging.getLogger(__name__)

# Monkeypatch langextract to log raw model output
from langextract.core.format_handler import FormatHandler
original_parse_output = FormatHandler.parse_output
def patched_parse_output(self, text, *args, **kwargs):
    logger.debug(f"RAW MODEL OUTPUT RECEIVED BY LANGEXTRACT: {repr(text)}")
    return original_parse_output(self, text, *args, **kwargs)
FormatHandler.parse_output = patched_parse_output

FREELLM_BASE_URL = os.getenv("FREELLM_BASE_URL", "http://freellm:3000/v1")
FREELLM_API_KEY = os.getenv("FREELLM_API_KEY", "freellm")
LLM_DEFAULT_MODEL = os.getenv("LLM_DEFAULT_MODEL", "free")

_llm_client = OpenAI(
    base_url=FREELLM_BASE_URL,
    api_key=FREELLM_API_KEY,
)


def _build_few_shot_block(examples: list) -> str:
    """
    Build a few-shot text block from fewShotExamples list.
    Uses parsedContent for file/url sources, content for text sources.
    Skips sources with no usable text.
    """
    if not examples:
        return ""

    blocks = []
    for i, ex in enumerate(examples, 1):
        source_parts = []
        for src in ex.get("sources", []):
            src_type = src.get("type", "text")
            if src_type == "text":
                text = src.get("content", "").strip()
            else:
                text = (src.get("parsedContent") or "").strip()
            if text:
                source_parts.append(text)

        output = (ex.get("output") or "").strip()
        if not source_parts and not output:
            continue

        combined = "\n\n---\n\n".join(source_parts) if source_parts else "(no input)"
        blocks.append(f"Example {i}:\nInput:\n{combined}\nExpected Output:\n{output}")

    if not blocks:
        return ""

    return (
        "\n\nHere are examples of the expected extraction format:\n\n"
        + "\n\n---\n\n".join(blocks)
        + "\n\n"
    )


def run_extraction(
    content: str,
    schema_config: dict,
    system_prompt: str = "",
    model_id: str = None,
    extraction_type: str = "llm",
    examples: list = None
) -> dict:
    """
    Main entry point for extraction.
    """
    resolved_model = model_id or LLM_DEFAULT_MODEL
    logger.info(f"Running extraction (type: {extraction_type}) with model {resolved_model}...")

    if extraction_type == "langextract":
        return run_langextract_extraction(content, schema_config, resolved_model, examples)
    else:
        return run_llm_extraction(content, schema_config, system_prompt, resolved_model, examples)


def _build_fields_description(schema_config: dict) -> str:
    """
    Build a human-readable fields description from either:
      - Legacy format: { "fields": [{"name", "type", "description"}] }
      - JSON Schema format: { "properties": { "fieldName": {"type", "description"} } }
    This mirrors the logic in NestJS LlmService.buildFieldsDescription().
    """
    # Legacy format
    if schema_config.get('fields') and isinstance(schema_config['fields'], list):
        return "\n".join(
            f"- {f['name']} ({f.get('type', 'string')}): {f.get('description', '')}"
            for f in schema_config['fields']
        )
    # JSON Schema format
    props = schema_config.get('properties')
    if props and isinstance(props, dict):
        return "\n".join(
            f"- {name} ({prop.get('type', 'string')}): {prop.get('description', '')}"
            for name, prop in props.items()
        )
    return ""


def run_llm_extraction(
    content: str,
    schema_config: dict,
    system_prompt: str = "",
    model_id: str = None,
    examples: list = None,
) -> dict:
    """
    Uses FreeLLM (OpenAI-compatible gateway) for extraction.
    """
    try:
        resolved_model = model_id or LLM_DEFAULT_MODEL

        fields_desc = _build_fields_description(schema_config)

        # Build schema properties block for the JSON structure hint
        schema_properties = schema_config.get('properties') or {
            f['name']: {"type": f.get('type', 'string')}
            for f in schema_config.get('fields', [])
        }

        if system_prompt:
            prompt_instruction = (
                f"{system_prompt}\n\nFields to extract:\n{fields_desc}\n\n"
                "Return a valid JSON object matching this structure."
            )
        else:
            prompt_instruction = textwrap.dedent(f"""\
                Extract the following fields from the document text.
                Reference the exact text where possible.

                Fields to extract:
                {fields_desc}

                Return a valid JSON object matching this structure.
            """)

        few_shot_block = _build_few_shot_block(examples)
        full_prompt = (
            f"{prompt_instruction}{few_shot_block}\nDocument Content:\n{content}\n"
            f"Important, Your output structure must match 100% of this json schema:\n {json.dumps(schema_properties)}"
        )

        response = _llm_client.chat.completions.create(
            model=resolved_model,
            messages=[{"role": "user", "content": full_prompt}],
            response_format={"type": "json_object"},
        )

        raw_content = response.choices[0].message.content or "{}"
        # Strip markdown fences if present, then use json_repair for robustness
        if raw_content.startswith("```"):
            raw_content = raw_content.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        result_data = json.loads(repair_json(raw_content))

        return {
            "data": result_data,
            "usage": {
                "total_tokens": response.usage.total_tokens if response.usage else 0
            }
        }

    except Exception as e:
        logger.error(f"LLM Extraction failed: {e}")
        raise e

def run_langextract_extraction(
    content: str,
    schema_config: dict,
    model_id: str,
    raw_examples: list
) -> dict:
    """
    Uses the LangExtract library for complex, few-shot extraction.
    Points at FreeLLM as the OpenAI-compatible backend.
    """
    try:
        lx_examples = []
        if raw_examples:
            for ex in raw_examples:
                extractions = []
                raw_exts = ex.get('extractions') or ex.get('fields') or []
                for ext in raw_exts:
                    extractions.append(lx.data.Extraction(
                        extraction_class=ext.get('extraction_class') or ext.get('class') or "general",
                        extraction_text=ext.get('extraction_text') or ext.get('text') or "",
                        attributes=ext.get('attributes') or {}
                    ))
                lx_examples.append(lx.data.ExampleData(
                    text=ex.get('text') or ex.get('full_text') or "",
                    extractions=extractions
                ))

        fields_desc = "\n".join([
            f"- {f['name']} ({f['type']}): {f.get('description', '')}"
            for f in schema_config.get('fields', [])
        ])
        prompt_description = schema_config.get('prompt') or schema_config.get('description') or textwrap.dedent(f"""\
            Extract entities and their relationships from the text.
            Use exact text for extractions. Do not paraphrase.

            Fields/Classes:
            {fields_desc}
        """)

        logger.info(f"Inputs to lx.extract - model_id: {model_id}, model_url: {FREELLM_BASE_URL}")
        logger.debug(f"Prompt description: {prompt_description}")
        logger.debug(f"Number of examples: {len(lx_examples)}")

        result = lx.extract(
            text_or_documents=content,
            prompt_description=prompt_description,
            examples=lx_examples,
            model_id=model_id,
            model_url=FREELLM_BASE_URL,
            api_key=FREELLM_API_KEY,
            fence_output=False,
            use_schema_constraints=False
        )
        logger.info(f"lx.extract result: {result}")

        serializable_result = []
        if hasattr(result, 'extractions'):
            for ext in result.extractions:
                serializable_result.append({
                    "class": ext.extraction_class,
                    "text": ext.extraction_text,
                    "attributes": ext.attributes
                })

        return {
            "data": serializable_result,
            "usage": {"total_tokens": 0}
        }

    except Exception as e:
        logger.exception(f"LangExtract extraction failed: {e}")
        raise e
