import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadLabel } from './services/api';
import type { LabelResult } from './types/label';
import './App.css';

function App() {
  const [results, setResults] = useState<LabelResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [modalLetter, setModalLetter] = useState<string | null>(null);
  const [modalBrand, setModalBrand] = useState<string | null>(null);

  // ================================================
  // EFFECT: Handle body overflow when modal is open
  // ================================================
  useEffect(() => {
    if (modalLetter) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [modalLetter]);

  // ================================================
  // CLEANUP OBJECT URLs
  // ================================================
  useEffect(() => {
    return () => {
      results.forEach((r) => {
        if (r.imageUrl && r.imageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(r.imageUrl);
        }
      });
    };
  }, [results]);

  // ================================================
  // GENERATE REJECTION LETTER
  // ================================================
  const generateRejectionLetter = (result: LabelResult): string => {
    const brandName = result.extracted_data.brand_name || 'your brand';
    const missingFields: string[] = [];
    
    if (!result.extracted_data.brand_name) missingFields.push('• Brand Name');
    if (!result.extracted_data.class_type) missingFields.push('• Class/Type Designation');
    if (!result.extracted_data.alcohol_content) missingFields.push('• Alcohol Content (ABV)');
    if (!result.extracted_data.net_contents) missingFields.push('• Net Contents');
    if (!result.extracted_data.bottler_address) missingFields.push('• Bottler/Importer Name and Address');
    if (!result.extracted_data.country_of_origin) missingFields.push('• Country of Origin (for imports)');
    if (!result.extracted_data.government_warning) missingFields.push('• Government Health Warning Statement');

    const missingList = missingFields.join('\n');

    return `Dear ${brandName},

Unfortunately, we could not accept your alcohol label application for the following reason(s):

${missingList}

Please make the necessary corrections and resubmit your label for approval.

The TTB requires the following mandatory information on all alcohol beverage labels:

• Brand Name
• Class/Type Designation
• Alcohol Content (ABV)
• Net Contents
• Bottler/Importer Name and Address
• Country of Origin (for imported products)
• Government Health Warning Statement (exact wording, "GOVERNMENT WARNING" in all caps)

For complete guidelines, please refer to TTB.gov.

We appreciate your cooperation and look forward to reviewing your revised submission.

Sincerely,

Sarah Chen
Deputy Director of Label Compliance
Alcohol and Tobacco Tax and Trade Bureau (TTB)
`;
  };

  // ================================================
  // COPY TO CLIPBOARD
  // ================================================
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  // ================================================
  // DOWNLOAD AS .TXT
  // ================================================
  const downloadLetter = (text: string, brandName: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rejection_Letter_${brandName || 'Label'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ================================================
  // OPEN / CLOSE MODAL
  // ================================================
  const openModal = (letter: string, brandName: string) => {
    setModalLetter(letter);
    setModalBrand(brandName);
  };

  const closeModal = () => {
    setModalLetter(null);
    setModalBrand(null);
  };

  // ================================================
  // "TRY SAMPLE LABEL"
  // ================================================
  const loadExample = () => {
    const exampleResult: LabelResult = {
      id: `example-${Date.now()}`,
      passed: true,
      errors: [],
      warnings: ['Bottler address is missing. (Required by TTB)'],
      extracted_data: {
        brand_name: 'OLD TOM DISTILLERY',
        class_type: 'Kentucky Straight Bourbon Whiskey',
        alcohol_content: '45%',
        net_contents: '750 mL',
        bottler_address: null,
        country_of_origin: 'USA',
        government_warning:
          'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.',
      },
      processing_time_ms: 124,
      imageUrl: '/images/Old Tom Distillery.jpg',
    };
    setResults([exampleResult, ...results]);
  };

  // ================================================
  // FILE UPLOAD
  // ================================================
  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setLoading(true);
    setProcessedCount(0);
    setTotalCount(acceptedFiles.length);

    const newResults: LabelResult[] = [];

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const imageUrl = URL.createObjectURL(file);

      try {
        const res = await uploadLabel(file);
        newResults.push({ ...res, imageUrl });
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
          imageUrl,
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
    results.forEach((r) => {
      if (r.imageUrl && r.imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(r.imageUrl);
      }
    });
    setResults([]);
  };

  return (
    <div className="app">
      {/* ===== HEADER ===== */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-area">
            <h1>
              Label <span>Verifier</span>
            </h1>
            <span className="badge">TTB Prototype v1.0</span>
          </div>
          <p className="header-subtitle">
            AI-powered compliance check for alcohol beverage labels
          </p>
        </div>
      </header>

      {/* ===== DASHBOARD ===== */}
      <div className="dashboard">
        {/* LEFT PANEL */}
        <div className="upload-panel">
          <div className="panel-card">
            <h2>Upload Labels</h2>
            <p className="panel-desc">
              Upload one or multiple label images for instant TTB compliance verification.
            </p>

            <div
              {...getRootProps()}
              className={`dropzone ${isDragActive ? 'active' : ''} ${loading ? 'processing' : ''}`}
            >
              <input {...getInputProps()} />
              <div className="dropzone-content">
                <span className="dropzone-icon">📄</span>
                <h3>{loading ? 'Processing...' : 'Drop images here'}</h3>
                <p>{loading ? `${processedCount}/${totalCount}` : 'or click to browse'}</p>
                <small className="file-types">JPG, PNG, WEBP • Batch upload supported</small>
              </div>
            </div>

            <div className="action-bar">
              <button className="btn-primary" onClick={loadExample} disabled={loading}>
                🚀 Try Sample Label
              </button>
              <button className="btn-secondary" onClick={clearResults} disabled={results.length === 0}>
                Clear All
              </button>
            </div>
            <p className="action-hint">
              Click "Try Sample Label" to instantly see a PASS result without uploading a file.
            </p>
          </div>

          {loading && (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(processedCount / totalCount) * 100}%` }}
                />
              </div>
              <div className="progress-text">
                Processing {processedCount} of {totalCount} labels
              </div>
              <div className="spinner"></div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Results */}
        <div className="results-panel">
          <div className="results-header">
            <h2>
              Results <span>{results.length > 0 ? `(${results.length})` : ''}</span>
            </h2>
            {results.length > 0 && (
              <span className="result-count-badge">
                {results.filter((r) => r.passed).length} Passed / {results.filter((r) => !r.passed).length} Failed
              </span>
            )}
          </div>

          {results.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🔍</span>
              <h3>No labels processed yet</h3>
              <p>Upload an image or click "Try Sample Label" to get started.</p>
            </div>
          ) : (
            <div className="results-grid">
              {results.map((res, idx) => {
                const letter = !res.passed ? generateRejectionLetter(res) : '';
                const brandName = res.extracted_data.brand_name || 'Label';

                return (
                  <div key={res.id} className={`result-card ${res.passed ? 'pass' : 'fail'}`}>
                    {/* Card Header */}
                    <div className="card-header">
                      <span className="label-number">#{idx + 1}</span>
                      <span className={`status-badge ${res.passed ? 'pass' : 'fail'}`}>
                        {res.passed ? '✅ Pass' : '❌ Fail'}
                      </span>
                      <span className="processing-time">{res.processing_time_ms}ms</span>
                    </div>

                    {/* Card Body: Image + Fields */}
                    <div className="card-body-layout">
                      {res.imageUrl && (
                        <div className="card-image-col">
                          <img src={res.imageUrl} alt="Label" />
                        </div>
                      )}
                      <div className="card-fields-col">
                        <div className="fields-grid">
                          <div className="field">
                            <span className="field-label">Brand</span>
                            <span className="field-value">{res.extracted_data.brand_name || '—'}</span>
                          </div>
                          <div className="field">
                            <span className="field-label">Type</span>
                            <span className="field-value">{res.extracted_data.class_type || '—'}</span>
                          </div>
                          <div className="field">
                            <span className="field-label">ABV</span>
                            <span className="field-value">{res.extracted_data.alcohol_content || '—'}</span>
                          </div>
                          <div className="field">
                            <span className="field-label">Net Contents</span>
                            <span className="field-value">{res.extracted_data.net_contents || '—'}</span>
                          </div>
                          <div className="field">
                            <span className="field-label">Origin</span>
                            <span className="field-value">{res.extracted_data.country_of_origin || '—'}</span>
                          </div>
                          <div className="field">
                            <span className="field-label">Bottler</span>
                            <span className="field-value">{res.extracted_data.bottler_address || '—'}</span>
                          </div>
                          <div className="field">
                            <span className="field-label">Gov Warning</span>
                            <span className="field-value">
                              {res.extracted_data.government_warning ? '✅ Present' : '❌ Missing'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Errors & Warnings */}
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

                    {/* ===== REJECTION LETTER BUTTON (Opens Modal) ===== */}
                    {!res.passed && (
                      <div className="rejection-actions">
                        <button
                          className="btn-letter-primary"
                          onClick={() => openModal(letter, brandName)}
                        >
                          📧 View Rejection Letter
                        </button>
                        <button
                          className="btn-letter-secondary"
                          onClick={() => copyToClipboard(letter, idx)}
                        >
                          {copiedIndex === idx ? '✅ Copied!' : '📋 Copy'}
                        </button>
                        <button
                          className="btn-letter-secondary"
                          onClick={() => downloadLetter(letter, brandName)}
                        >
                          ⬇️ Download
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== MODAL ===== */}
      {modalLetter && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📧 Rejection Letter</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <pre>{modalLetter}</pre>
            </div>
            <div className="modal-footer">
              <button className="btn-letter-primary" onClick={() => copyToClipboard(modalLetter, -1)}>
                📋 Copy
              </button>
              <button className="btn-letter-primary" onClick={() => downloadLetter(modalLetter, modalBrand || 'Label')}>
                ⬇️ Download .txt
              </button>
              <button className="btn-secondary" onClick={closeModal}>
                Close
              </button>
            </div>
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