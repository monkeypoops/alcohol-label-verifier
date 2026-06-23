import os
import json
import re
from openai import OpenAI
from app.config import Config
from app.models.label import LabelData

client = OpenAI(api_key=Config.OPENAI_API_KEY)

PROMPT_TEMPLATE = """
You are a TTB compliance expert. Extract the following mandatory fields from this OCR text of an alcohol label.
Return ONLY valid JSON.

Fields:
1. brand_name
2. class_type (e.g., Bourbon, Vodka, Wine, Beer)
3. alcohol_content (e.g., "45% ABV")
4. net_contents (e.g., "750ml")
5. bottler_address
6. country_of_origin (e.g., "USA", "France")
7. government_warning (the full text)

OCR Text:
{ocr_text}
"""

def extract_label_fields(ocr_text: str) -> LabelData:
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You extract structured data from labels."},
                {"role": "user", "content": PROMPT_TEMPLATE.format(ocr_text=ocr_text[:3000])}
            ],
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)
        return LabelData(**data)
    except Exception as e:
        print(f"LLM Error: {e}")
        return LabelData()