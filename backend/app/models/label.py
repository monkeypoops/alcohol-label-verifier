from pydantic import BaseModel
from typing import Optional, List

class LabelData(BaseModel):
    brand_name: Optional[str] = None
    class_type: Optional[str] = None
    alcohol_content: Optional[str] = None
    net_contents: Optional[str] = None
    bottler_address: Optional[str] = None
    country_of_origin: Optional[str] = None
    government_warning: Optional[str] = None

class ValidationResult(BaseModel):
    passed: bool
    errors: List[str]
    warnings: List[str]
    extracted_data: LabelData