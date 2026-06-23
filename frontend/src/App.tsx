import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadLabel } from './services/api';
import type { LabelResult } from './types/label';
import './App.css';

function App() {
  const [results, setResults] = useState<LabelResult[]>([]);
  const [loading, setLoading] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    setLoading(true);
    const newResults: LabelResult[] = [];
    for (const file of acceptedFiles) {
      try {
        const res = await uploadLabel(file);
        newResults.push(res);
      } catch (e) {
        console.error(e);
      }
    }
    setResults([...newResults, ...results]);
    setLoading(false);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="app">
      <h1>TTB Alcohol Label Verifier</h1>
      <div {...getRootProps()} className="dropzone">
        <input {...getInputProps()} />
        <p>Drag & drop label images here, or click to select</p>
        <em>Supports JPG, PNG</em>
      </div>
      {loading && <p>Processing...</p>}
      <div className="results">
        {results.map((res, idx) => (
          <div key={res.id} className={`card ${res.passed ? 'pass' : 'fail'}`}>
            <h3>Label #{idx + 1} - {res.passed ? '✅ PASS' : '❌ FAIL'}</h3>
            <p><strong>Brand:</strong> {res.extracted_data.brand_name || 'N/A'}</p>
            <p><strong>Type:</strong> {res.extracted_data.class_type || 'N/A'}</p>
            <p><strong>ABV:</strong> {res.extracted_data.alcohol_content || 'N/A'}</p>
            <p><strong>Net Contents:</strong> {res.extracted_data.net_contents || 'N/A'}</p>
            <p><strong>Origin:</strong> {res.extracted_data.country_of_origin || 'N/A'}</p>
            <p><strong>Gov Warning:</strong> {res.extracted_data.government_warning ? '✅ Present' : '❌ Missing'}</p>
            {res.errors.length > 0 && (
              <div className="errors">
                <strong>Errors:</strong>
                <ul>{res.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
              </div>
            )}
            <small>Processed in {res.processing_time_ms}ms</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;