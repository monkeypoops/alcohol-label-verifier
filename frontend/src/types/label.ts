export interface LabelResult {
  id: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  extracted_data: {
    brand_name: string | null;
    class_type: string | null;
    alcohol_content: string | null;
    net_contents: string | null;
    bottler_address: string | null;
    country_of_origin: string | null;
    government_warning: string | null;
  };
  processing_time_ms: number;
}