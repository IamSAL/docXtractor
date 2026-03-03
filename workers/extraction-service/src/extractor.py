import os
import logging
import json
import google.generativeai as genai
import textwrap
import langextract as lx
from langextract.data import ExampleData, Extraction

logger = logging.getLogger(__name__)

# Monkeypatch langextract to log raw model output
from langextract.core.format_handler import FormatHandler
original_parse_output = FormatHandler.parse_output
def patched_parse_output(self, text, *args, **kwargs):
    logger.debug(f"RAW MODEL OUTPUT RECEIVED BY LANGEXTRACT: {repr(text)}")
    return original_parse_output(self, text, *args, **kwargs)
FormatHandler.parse_output = patched_parse_output

# Keys
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
LANGEXTRACT_API_KEY = os.getenv("LANGEXTRACT_API_KEY")

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

def run_extraction(
    content: str,
    schema_config: dict,
    system_prompt: str = "",
    model_id: str = "gemini-2.0-flash-exp",
    extraction_type: str = "llm",
    examples: list = None
) -> dict:
    """
    Main entry point for extraction.
    """
    logger.info(f"Running extraction (type: {extraction_type}) with model {model_id}...")
    
    if extraction_type == "langextract":
        return run_langextract_extraction(content, schema_config, model_id, examples)
    else:
        return run_llm_extraction(content, schema_config, system_prompt, model_id)

def run_llm_extraction(
    content: str,
    schema_config: dict,
    system_prompt: str = "",
    model_id: str = "gemini-2.0-flash-exp"
) -> dict:
    """
    Uses direct Gemini API for extraction.
    """
    try:
        if not GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY not set")

        # 1. Build Prompt from Schema Fields
        fields_desc = "\n".join([f"- {f['name']} ({f['type']}): {f.get('description', '')}" for f in schema_config.get('fields', [])])
        
        # Use system_prompt if provided, otherwise use default
        if system_prompt:
            prompt_instruction = f"{system_prompt}\n\nFields to extract:\n{fields_desc}\n\nReturn a valid JSON object matching this structure."
        else:
            prompt_instruction = textwrap.dedent(f"""\
                Extract the following fields from the document text.
                Reference the exact text where possible.
                
                Fields to extract:
                {fields_desc}
                
                Return a valid JSON object matching this structure.
            """)

        model = genai.GenerativeModel(model_id)
        
        # Construct the full prompt
        full_prompt = f"{prompt_instruction}\n\nDocument Content:\n{content}"
        
        # For JSON mode in newer Gemini models:
        response = model.generate_content(
            full_prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        # Parse result
        result_data = json.loads(response.text)
        
        return {
            "data": result_data,
            "usage": {
                "total_tokens": response.usage_metadata.total_token_count if response.usage_metadata else 0
            }
        }

    except Exception as e:
        logger.error(f"LLM Extraction failed: {e}")
        raise e

def run_langextract_extraction(content: str, schema_config: dict, model_id: str, raw_examples: list) -> dict:
    """
    Uses the LangExtract library for complex, few-shot extraction.
    """
    try:
        # 1. Convert raw_examples to LangExtract objects
        lx_examples = []
        if raw_examples:
            for ex in raw_examples:
                extractions = []
                # Support both 'extractions' and 'fields' key in payload
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

        # 2. Build Prompt
        fields_desc = "\n".join([f"- {f['name']} ({f['type']}): {f.get('description', '')}" for f in schema_config.get('fields', [])])
        prompt_description = schema_config.get('prompt') or schema_config.get('description') or textwrap.dedent(f"""\
            Extract entities and their relationships from the text.
            Use exact text for extractions. Do not paraphrase.
            
            Fields/Classes:
            {fields_desc}
        """)

        # 3. Running Extraction
        model_url = os.getenv("LANGEXTRACT_MODEL_URL")
        
        logger.info(f"Inputs to lx.extract - model_id: {model_id}, model_url: {model_url}")
        logger.debug(f"Prompt description: {prompt_description}")
        logger.debug(f"Number of examples: {len(lx_examples)}")

        result = lx.extract(
            text_or_documents=content,
            prompt_description=prompt_description,
            examples=lx_examples,
            model_id=model_id,
            model_url=model_url,
            api_key=LANGEXTRACT_API_KEY or GOOGLE_API_KEY,
            fence_output=False,
            use_schema_constraints=False
        )
        logger.info(f"lx.extract result: {result}")
        # 4. Process Results
        # langextract returns an AnnotatedDocument. We convert its extractions to a serializable list.
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
            "usage": {
                "total_tokens": 0 # LangExtract abstractness makes token counting provider-specific
            }
        }

    except Exception as e:
        logger.exception(f"LangExtract extraction failed: {e}")
        raise e
