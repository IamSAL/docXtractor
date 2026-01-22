import os
import logging
import google.generativeai as genai
import textwrap
# We'll use a simplified mock or flexible implementation if langextract 
# needs specific Pydantic models. For now, assuming granular control 
# via the library's `extract` function as per docs.
import langextract as lx
from langextract.data import ExampleData, Extraction

logger = logging.getLogger(__name__)

# Keys
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

def run_extraction(content: str, schema_config: dict, model_id: str = "gemini-2.5-flash") -> dict:
    """
    Uses langextract to extract data.
    
    Args:
        content: The Markdown content from parser.
        schema_config: Dict containing 'fields' and 'examples'. 
                       This maps to the Prompt and Few-Shot examples in LangExtract.
    """
    try:
        if not GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY not set")

        # 1. Build Prompt from Schema Fields
        # We construct a natural language instruction from the fields list
        fields_desc = "\n".join([f"- {f['name']} ({f['type']}): {f.get('description', '')}" for f in schema_config.get('fields', [])])
        
        prompt_instruction = textwrap.dedent(f"""\
            Extract the following fields from the document text.
            Reference the exact text where possible.
            
            Fields to extract:
            {fields_desc}
            
            Return a valid JSON object matching this structure.
        """)

        # 2. Build Examples
        examples = []
        for ex in schema_config.get('examples', []):
            # Converting raw JSON example to LangExtract structure if needed,
            # or simply passing text/output pairs if the lib supports it.
            # Assuming ExampleData structure:
            # Note: This part depends heavily on how strict LangExtract typed examples are.
            # For this MVP, we will try to fit it, or skip if complex.
            pass 

        # 3. Running Extraction
        # Note: LangExtract's `extract` function typicall takes a Pydantic model or schema definition.
        # If the schema is dynamic (defined by user at runtime), we might need to use 
        # a generic extraction approach or construct Pydantic models on the fly.
        
        # DYNAMIC SCHEMA APPROACH:
        # Since we want to support user-defined fields without redeploying code, 
        # we might be better off using `genai` directly *or* using LangExtract's dynamic features if available.
        # Looking at docs, LangExtract shines with 'Instruction' based extraction.
        
        logger.info(f"Running extraction with model {model_id}...")
        
        # Simple/Direct Gemini call for dynamic schema support until we wire up LangExtract fully dynamic logic
        model = genai.GenerativeModel(model_id)
        
        # Construct the full prompt
        full_prompt = f"{prompt_instruction}\n\nDocument Content:\n{content}"
        
        # For JSON mode in newer Gemini models:
        response = model.generate_content(
            full_prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        # Parse result
        import json
        result_data = json.loads(response.text)
        
        return {
            "data": result_data,
            "usage": {
                "total_tokens": response.usage_metadata.total_token_count if response.usage_metadata else 0
            }
        }

    except Exception as e:
        logger.error(f"Extraction failed: {e}")
        raise e
