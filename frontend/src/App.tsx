import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadLabel } from './services/api';
import type { LabelResult } from './types/label';
import './App.css';

function App() {
  const [results, setResults] = useState<LabelResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setLoading(true);
    setProcessedCount(0);
    setTotalCount(acceptedFiles.length);

    const newResults: LabelResult[] = [];

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      try {
        const res = await uploadLabel(file);
        newResults.push(res);
      } catch (e) {
        console.error(`Failed to process ${file.name}:`, e);
        newResults.push({
          id: `error-${i}-${Date.now()}`,
          passed: false,
          errors: [`Failed to process "${file.name}"`],
          warnings: [],
          extracted_data: {
            brand_name: null,
            class_type: null,
            alcohol_content: null,
            net_contents: null,
            bottler_address: null,
            country_of_origin: null,
            government_warning: null,
          },
          processing_time_ms: 0,
        });
      }
      setProcessedCount(i + 1);
    }

    setResults([...newResults, ...results]);
    setLoading(false);
    setProcessedCount(0);
    setTotalCount(0);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    multiple: true,
    disabled: loading,
  });

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🍷 TTB Alcohol Label Verifier</h1>
        <p className="subtitle">Upload one or multiple labels for instant TTB compliance check</p>
      </header>

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${loading ? 'processing' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <div className="dropzone-icon">📄</div>
          <h3>{loading ? 'Processing...' : 'Drag & drop label images here'}</h3>
          <p>{loading ? `Processing ${processedCount}/${totalCount}...` : 'or click to select files'}</p>
          <em className="file-types">Supports: JPG, PNG, GIF, WEBP — Upload multiple at once!</em>
        </div>
      </div>

      {loading && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(processedCount / totalCount) * 100}%` }}
            />
          </div>
          <p className="progress-text">
            {processedCount} / {totalCount} labels processed
          </p>
          <div className="spinner"></div>
        </div>
      )}

      {results.length > 0 && (
        <div className="results-section">
          <div className="results-header">
            <h2>Results ({results.length} labels)</h2>
            <button onClick={clearResults} className="clear-btn">
              Clear All
            </button>
          </div>

          <div className="results-grid">
            {results.map((res, idx) => (
              <div key={res.id} className={`result-card ${res.passed ? 'pass' : 'fail'}`}>
                <div className="card-header">
                  <span className="label-number">#{idx + 1}</span>
                  <span className={`status-badge ${res.passed ? 'pass' : 'fail'}`}>
                    {res.passed ? '✅ PASS' : '❌ FAIL'}
                  </span>
                  <span className="processing-time">{res.processing_time_ms}ms</span>
                </div>

                <div className="card-body">
                  <div className="field">
                    <span className="field-label">Brand</span>
                    <span className="field-value">{res.extracted_data.brand_name || 'N/A'}</span>
                  </div>
                  <div className="field">
                    <span className="field-label">Type</span>
                    <span className="field-value">{res.extracted_data.class_type || 'N/A'}</span>
                  </div>
                  <div className="field">
                    <span className="field-label">ABV</span>
                    <span className="field-value">{res.extracted_data.alcohol_content || 'N/A'}</span>
                  </div>
                  <div className="field">
                    <span className="field-label">Net Contents</span>
                    <span className="field-value">{res.extracted_data.net_contents || 'N/A'}</span>
                  </div>
                  <div className="field">
                    <span className="field-label">Origin</span>
                    <span className="field-value">{res.extracted_data.country_of_origin || 'N/A'}</span>
                  </div>
                  <div className="field">
                    <span className="field-label">Bottler/Importer</span>
                    <span className="field-value">{res.extracted_data.bottler_address || 'N/A'}</span>
                  </div>
                  <div className="field">
                    <span className="field-label">Gov Warning</span>
                    <span className="field-value">
                      {res.extracted_data.government_warning ? '✅ Present' : '❌ Missing'}
                    </span>
                  </div>
                </div>

                {res.errors.length > 0 && (
                  <div className="card-errors">
                    <strong>Errors:</strong>
                    <ul>
                      {res.errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {res.warnings.length > 0 && (
                  <div className="card-warnings">
                    <strong>Warnings:</strong>
                    <ul>
                      {res.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="app-footer">
        <p>Built for the TTB Compliance Division • Prototype v1.0</p>
      </footer>
    </div>
  );
}

export default App;