import re
from app.models.label import LabelData, ValidationResult

EXPECTED_WARNING = (
    "GOVERNMENT WARNING: (1) According to the Surgeon General, "
    "women should not drink alcoholic beverages during pregnancy "
    "because of the risk of birth defects. (2) Consumption of "
    "alcoholic beverages impairs your ability to drive a car or "
    "operate machinery, and may cause health problems."
)

def validate_label(data: LabelData) -> ValidationResult:
    errors = []
    warnings = []

    # ================================================
    # 1. BRAND NAME
    # ================================================
    if not data.brand_name or len(data.brand_name.strip()) < 2:
        errors.append("Brand name is missing or too short.")

    # ================================================
    # 2. ALCOHOL CONTENT
    # ================================================
    if data.alcohol_content:
        match = re.search(r'(\d+\.?\d*)%', data.alcohol_content)
        if match:
            abv = float(match.group(1))
            if abv < 0.5 or abv > 95:
                errors.append(f"ABV {abv}% is out of valid range (0.5%-95%).")
            elif abv == 100:
                warnings.append("ABV appears to be '100% Agave'—please verify.")
        else:
            warnings.append("Alcohol content format may be invalid.")
    else:
        warnings.append("Alcohol content is missing. (This may be fine if not listed on the label)")

    # ================================================
    # 3. NET CONTENTS
    # ================================================
    if not data.net_contents:
        warnings.append("Net contents is missing. (This may be fine if not listed on the label)")

    # ================================================
    # 4. GOVERNMENT WARNING
    # ================================================
    if data.government_warning:
        clean_input = re.sub(r'[^a-zA-Z0-9\s]', '', data.government_warning.lower())
        clean_expected = re.sub(r'[^a-zA-Z0-9\s]', '', EXPECTED_WARNING.lower())
        
        has_surgeon_general = "surgeon general" in clean_input
        has_pregnancy = "pregnancy" in clean_input
        has_drive = "drive" in clean_input
        has_government = "government" in clean_input
        has_warning = "warning" in clean_input
        
        key_phrases = [has_surgeon_general, has_pregnancy, has_drive, has_government, has_warning]
        if sum(key_phrases) >= 3:
            # Close enough to the real warning
            pass
        else:
            errors.append("Government warning text does not match TTB requirement.")
    else:
        errors.append("Government warning is missing.")

    # ================================================
    # 5. BOTTLER / IMPORTER (Recommended, not required for prototype)
    # ================================================
    if not data.bottler_address:
        warnings.append("Bottler/importer address is missing. (Required by TTB)")

    # ================================================
    # 6. ORIGIN (Recommended, not required for prototype)
    # ================================================
    if not data.country_of_origin:
        warnings.append("Country of origin is missing. (Required for imports)")

    return ValidationResult(
        passed=len(errors) == 0,
        errors=errors,
        warnings=warnings,
        extracted_data=data
    )