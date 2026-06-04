import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useBulkUpload } from '../hooks/useUrls';
import AnimatedCard from '../components/AnimatedCard';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle,
  XCircle,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

const isValidUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const BulkUploadPage = () => {
  const fileInputRef = useRef(null);
  const [rawCsvData, setRawCsvData] = useState([]);
  const [results, setResults] = useState(null);
  const [fileName, setFileName] = useState('');

  const bulkUploadMutation = useBulkUpload();

  // Validate, deduplicate, and prepare data from raw CSV
  const { validUrls, invalidCount, duplicateCount, emptyCount, previewUrls } = useMemo(() => {
    if (!rawCsvData.length) {
      return { validUrls: [], invalidCount: 0, duplicateCount: 0, emptyCount: 0, previewUrls: [] };
    }

    let emptyRows = 0;
    let seen = new Set();
    let dupes = 0;
    const valid = [];
    const invalid = [];

    for (const row of rawCsvData) {
      // Support url, longUrl, or originalUrl column (including underscore variants)
      const originalUrl = row.url || row.longurl || row.originalurl || row.original_url || row.long_url || '';
      const trimmedUrl = originalUrl.trim();

      // Skip empty rows
      if (!trimmedUrl) {
        emptyRows++;
        continue;
      }

      // Remove duplicates
      const lowerUrl = trimmedUrl.toLowerCase();
      if (seen.has(lowerUrl)) {
        dupes++;
        continue;
      }
      seen.add(lowerUrl);

      // Validate URL format
      if (!isValidUrl(trimmedUrl)) {
        invalid.push(row);
        continue;
      }

      const alias = row.alias || row.customalias || '';
      const startDate = row.startdate || row.startDate || '';
      const expiryDate = row.expiry || row.expirydate || '';
      const password = row.password || '';

      const entry = { originalUrl: trimmedUrl };
      if (alias) entry.customAlias = alias.trim();
      if (startDate) entry.startDate = startDate.trim();
      if (expiryDate) entry.expiryDate = expiryDate.trim();
      if (password) entry.password = password;

      valid.push(entry);
    }

    return {
      validUrls: valid,
      invalidCount: invalid.length,
      duplicateCount: dupes,
      emptyCount: emptyRows,
      previewUrls: valid.slice(0, 10),
    };
  }, [rawCsvData]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setResults(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        setRawCsvData([]);
        return;
      }

      // Strip UTF-8 BOM from first header if present
      const headers = lines[0].replace(/^\ufeff/, '').split(',').map(h => h.trim().toLowerCase());
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });

      setRawCsvData(data);
    };
    reader.readAsText(file);
  };

  const handleBulkUpload = () => {
    if (validUrls.length === 0) return;

    bulkUploadMutation.mutate(validUrls, {
      onSuccess: (data) => setResults(data),
    });
  };

  const handleDownloadTemplate = () => {
    const template = 'url,alias,startDate,expiry,password\nhttps://example.com,my-link,2024-01-01,2024-12-31,\nhttps://another.com,another-link,,2024-12-31,mypassword';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_upload_template.csv';
    a.click();
  };

  const handleExportResults = () => {
    if (!results) return;

    const csvContent = 'short_url,original_url,alias,protected,start_date,expiry_date,status,clicks\n' + 
      results.createdUrls.map(url => 
        `${url.shortUrl},${url.originalUrl},${url.customAlias || ''},${url.passwordProtected ? 'Yes' : 'No'},${url.startDate ? new Date(url.startDate).toLocaleDateString() : ''},${url.expiryDate ? new Date(url.expiryDate).toLocaleDateString() : ''},${url.status},${url.clickCount}`
      ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated_links.csv';
    a.click();
  };

  const handleReset = () => {
    setRawCsvData([]);
    setResults(null);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalSkipped = emptyCount + duplicateCount + invalidCount;
  const hasData = validUrls.length > 0;
  const totalInputRows = rawCsvData.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bulk Upload</h1>
        <p className="theme-text-secondary">Create multiple short links at once</p>
      </div>

      <AnimatedCard delay={0.1}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 theme-icon-accent" />
            <h2 className="text-xl font-semibold">Upload CSV File</h2>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center space-x-2 text-link"
          >
            <Download size={18} />
            <span>Download Template</span>
          </button>
        </div>

        <div className="upload-dropzone rounded-lg p-12 text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
          <Upload className="w-12 h-12 input-icon mx-auto mb-4" />
          <p className="theme-text-secondary mb-4">
            Drop your CSV file here or click to browse
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary"
          >
            Select CSV File
          </button>
          {fileName && (
            <p className="text-xs theme-text-muted mt-3">
              Selected: {fileName}
            </p>
          )}
        </div>

        {hasData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            {/* Validation summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-[var(--accent-muted)] text-center">
                <p className="text-2xl font-bold text-[var(--accent)]">{validUrls.length}</p>
                <p className="text-xs font-medium text-[var(--accent)]">Valid</p>
              </div>
              {invalidCount > 0 && (
                <div className="p-3 rounded-xl bg-[var(--danger-muted)] text-center">
                  <p className="text-2xl font-bold text-[var(--danger)]">{invalidCount}</p>
                  <p className="text-xs font-medium text-[var(--danger)]">Invalid</p>
                </div>
              )}
              {duplicateCount > 0 && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-color) 10%, transparent)' }}>
                  <p className="text-2xl font-bold" style={{ color: 'var(--accent-secondary)' }}>{duplicateCount}</p>
                  <p className="text-xs font-medium" style={{ color: 'var(--accent-secondary)' }}>Duplicates</p>
                </div>
              )}
              {emptyCount > 0 && (
                <div className="p-3 rounded-xl theme-text-muted text-center" style={{ backgroundColor: 'var(--surface)' }}>
                  <p className="text-2xl font-bold">{emptyCount}</p>
                  <p className="text-xs font-medium">Empty</p>
                </div>
              )}
            </div>

            {totalSkipped > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)' }}>
                <AlertTriangle size={16} />
                <span>
                  {totalSkipped} row{totalSkipped !== 1 ? 's' : ''} skipped
                  {totalInputRows > 0 ? ` (out of ${totalInputRows} total)` : ''}
                </span>
              </div>
            )}

            <h3 className="font-semibold mb-4">
              Preview ({previewUrls.length > 0 ? `first ${previewUrls.length} of ${validUrls.length}` : '0'} URLs)
            </h3>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="table-head-themed sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-4 font-semibold">#</th>
                    <th className="text-left py-2 px-4 font-semibold">URL</th>
                    <th className="text-left py-2 px-4 font-semibold">Alias</th>
                    <th className="text-left py-2 px-4 font-semibold">Start</th>
                    <th className="text-left py-2 px-4 font-semibold">Expiry</th>
                    <th className="text-left py-2 px-4 font-semibold">Password</th>
                  </tr>
                </thead>
                <tbody>
                  {previewUrls.map((row, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4 text-[var(--text-muted)] text-xs">{index + 1}</td>
                      <td className="py-2 px-4 truncate max-w-xs">{row.originalUrl}</td>
                      <td className="py-2 px-4">{row.customAlias || '-'}</td>
                      <td className="py-2 px-4 text-xs">{row.startDate || '-'}</td>
                      <td className="py-2 px-4 text-xs">{row.expiryDate || '-'}</td>
                      <td className="py-2 px-4 text-xs">{row.password ? '●●●●●' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleBulkUpload}
                disabled={bulkUploadMutation.isPending}
                className="btn-primary flex items-center space-x-2"
              >
                <ArrowRight size={20} />
                <span>{bulkUploadMutation.isPending ? 'Processing...' : `Create ${validUrls.length} Link${validUrls.length !== 1 ? 's' : ''}`}</span>
              </button>
              <button
                onClick={handleReset}
                className="btn-secondary"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatedCard>

      {results && (
        <AnimatedCard delay={0.2}>
          <div className="flex items-center space-x-2 mb-6">
            <CheckCircle className="w-6 h-6" style={{ color: 'var(--success)' }} />
            <h2 className="text-xl font-semibold">Upload Results</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg stat-box-success">
              <p className="text-2xl font-bold">{results.createdUrls.length}</p>
              <p className="text-sm opacity-90">Created Successfully</p>
            </div>
            {results.errors.length > 0 && (
              <div className="p-4 rounded-lg stat-box-danger">
                <p className="text-2xl font-bold">{results.errors.length}</p>
                <p className="text-sm opacity-90">Failed</p>
              </div>
            )}
          </div>

          {results.createdUrls.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-4">Created URLs</h3>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="table-head-themed sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold">Original URL</th>
                      <th className="text-left py-2 px-3 font-semibold">Alias</th>
                      <th className="text-center py-2 px-3 font-semibold">Protected</th>
                      <th className="text-left py-2 px-3 font-semibold">Start</th>
                      <th className="text-left py-2 px-3 font-semibold">Expiry</th>
                      <th className="text-left py-2 px-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.createdUrls.map((url, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-3 truncate max-w-xs">{url.originalUrl}</td>
                        <td className="py-2 px-3">{url.customAlias || '-'}</td>
                        <td className="py-2 px-3 text-center">{url.passwordProtected ? '✓' : '✗'}</td>
                        <td className="py-2 px-3 text-xs">{url.startDate ? new Date(url.startDate).toLocaleDateString() : '-'}</td>
                        <td className="py-2 px-3 text-xs">{url.expiryDate ? new Date(url.expiryDate).toLocaleDateString() : '-'}</td>
                        <td className="py-2 px-3"><span className="inline-block px-2 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--success-muted)', color: 'var(--success)' }}>{url.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {results.errors.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-danger">Errors</h3>
              <div className="max-h-40 overflow-y-auto">
                {results.errors.map((error, index) => (
                  <div key={index} className="text-sm text-danger py-1">
                    <XCircle size={14} className="inline mr-2" />
                    {error.originalUrl}: {error.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleExportResults}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download size={20} />
              <span>Export Generated Links</span>
            </button>
            <button
              onClick={handleReset}
              className="btn-secondary"
            >
              Upload Another File
            </button>
          </div>
        </AnimatedCard>
      )}
    </div>
  );
};

export default BulkUploadPage;