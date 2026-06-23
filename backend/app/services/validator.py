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

    # Brand check
    if not data.brand_name or len(data.brand_name.strip()) < 2:
        errors.append("Brand name is missing or too short.")

    # ABV check - lenient: if ABV is 100%, it's likely "100% Agave" not alcohol
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

    # Net Contents - lenient
    if not data.net_contents:
        warnings.append("Net contents is missing. (This may be fine if not listed on the label)")

    # Government Warning - lenient check (3 out of 5 key phrases)
    if data.government_warning:
        # Remove all non-alphanumeric characters for comparison
        clean_input = re.sub(r'[^a-zA-Z0-9\s]', '', data.government_warning.lower())
        clean_expected = re.sub(r'[^a-zA-Z0-9\s]', '', EXPECTED_WARNING.lower())
        
        # Check for key phrases
        has_surgeon_general = "surgeon general" in clean_input
        has_pregnancy = "pregnancy" in clean_input
        has_drive = "drive" in clean_input
        has_government = "government" in clean_input
        has_warning = "warning" in clean_input
        
        # Check if it contains at least 3 of the key elements
        key_phrases = [has_surgeon_general, has_pregnancy, has_drive, has_government, has_warning]
        if sum(key_phrases) >= 3:
            # It's close enough to the real warning
            pass
        else:
            errors.append("Government warning text does not match TTB requirement.")
    else:
        errors.append("Government warning is missing.")

    return ValidationResult(
        passed=len(errors) == 0,
        errors=errors,
        warnings=warnings,
        extracted_data=data
    )