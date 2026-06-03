import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Layers, Loader2, Upload } from 'lucide-react';
import { useBulkUpload } from '../hooks/useUrls';
import { cn } from '../utils/cn';

const isValidUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const parseUrlsFromText = (text) => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const valid = [];
  const invalid = [];

  lines.forEach((line) => {
    if (isValidUrl(line)) {
      valid.push({ originalUrl: line });
    } else {
      invalid.push(line);
    }
  });

  return { valid, invalid, totalLines: lines.length };
};

const parseCSVText = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { urls: [], total: 0, valid: 0, invalid: 0 };

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const data = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });

  const urls = [];
  let validCount = 0;
  let invalidCount = 0;
  const seen = new Set();

  for (const row of data) {
    const originalUrl = row.url || row.longurl || '';
    const trimmedUrl = originalUrl.trim();
    if (!trimmedUrl) continue;

    // Deduplicate
    const lowerUrl = trimmedUrl.toLowerCase();
    if (seen.has(lowerUrl)) continue;
    seen.add(lowerUrl);

    if (isValidUrl(trimmedUrl)) {
      const entry = { originalUrl: trimmedUrl };
      const alias = row.alias || row.customalias || '';
      const startDate = row.startdate || row.startDate || '';
      const expiryDate = row.expiry || row.expirydate || '';
      const password = row.password || '';
      if (alias) entry.customAlias = alias.trim();
      if (startDate) entry.startDate = startDate.trim();
      if (expiryDate) entry.expiryDate = expiryDate.trim();
      if (password) entry.password = password;
      urls.push(entry);
      validCount++;
    } else {
      invalidCount++;
    }
  }

  return {
    urls,
    total: urls.length + invalidCount,
    valid: validCount,
    invalid: invalidCount,
  };
};

const BulkCreateModal = ({ open, onClose }) => {
  const bulkUpload = useBulkUpload();
  const fileInputRef = useRef(null);
  const [urlText, setUrlText] = useState('');
  const [aliasSuffix, setAliasSuffix] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [password, setPassword] = useState('');
  const [results, setResults] = useState(null);
  const [clientErrors, setClientErrors] = useState([]);
  const [csvSummary, setCsvSummary] = useState(null);

  const reset = () => {
    setUrlText('');
    setAliasSuffix('');
    setStartDate('');
    setExpiryDate('');
    setPassword('');
    setResults(null);
    setClientErrors([]);
    setCsvSummary(null);
  };

  const handleClose = () => {
    if (bulkUpload.isPending) return;
    reset();
    onClose();
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const result = parseCSVText(text);

      // Build the textarea content from parsed URLs
      const urlLines = result.urls.map(u => u.originalUrl).join('\n');
      setUrlText(urlLines);
      setCsvSummary(result);

      if (result.invalid > 0) {
        setClientErrors([`${result.invalid} invalid URL(s) found in CSV and skipped`]);
      } else {
        setClientErrors([]);
      }

      if (results) setResults(null);
    };
    reader.readAsText(file);

    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = () => {
    const { valid, invalid } = parseUrlsFromText(urlText);

    if (invalid.length > 0) {
      setClientErrors(invalid);
    } else {
      setClientErrors([]);
    }

    if (valid.length === 0) {
      setResults(null);
      return;
    }

    // Apply optional fields to all URLs
    const urlsWithFields = valid.map((item, idx) => ({
      ...item,
      customAlias: aliasSuffix ? `${aliasSuffix}-${idx + 1}` : undefined,
      startDate: startDate || undefined,
      expiryDate: expiryDate || undefined,
      password: password || undefined
    }));

    bulkUpload.mutate(urlsWithFields, {
      onSuccess: (data) => {
        setResults({
          created: data.createdUrls?.length ?? 0,
          failed: data.errors?.length ?? 0,
        });
      },
    });
  };

  if (!open) return null;

  const { valid } = parseUrlsFromText(urlText);
  const pending = bulkUpload.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-modal relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-1 flex items-center gap-1.5">
              <Layers size={14} />
              Bulk shorten
            </p>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Bulk Create</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={pending}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                URLs (one per line)
              </label>
              <div className="flex items-center gap-2">
                {csvSummary && (
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span className="text-[var(--accent)] font-medium">{csvSummary.valid} valid</span>
                    {csvSummary.invalid > 0 && (
                      <span className="text-[var(--danger)]">{csvSummary.invalid} invalid</span>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-colors"
                >
                  <Upload size={14} />
                  CSV Upload
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCSVUpload}
                  accept=".csv"
                  className="hidden"
                />
              </div>
            </div>
            <textarea
              value={urlText}
              onChange={(e) => {
                setUrlText(e.target.value);
                if (results) setResults(null);
                if (clientErrors.length) setClientErrors([]);
                if (csvSummary) setCsvSummary(null);
              }}
              rows={8}
              disabled={pending}
              placeholder={'https://google.com\nhttps://github.com\nhttps://openai.com'}
              className="input-field resize-y min-h-[160px] font-mono text-sm"
            />
            <p className="text-xs text-[var(--text-muted)] mt-2">
              {valid.length} valid URL{valid.length === 1 ? '' : 's'} ready to shorten
            </p>
          </div>

          {clientErrors.length > 0 && (
            <div className="glass-card p-4 modal-error-box">
              <p className="text-sm font-medium text-danger mb-2">
                Skipped {clientErrors.length} invalid line{clientErrors.length === 1 ? '' : 's'} (not sent)
              </p>
              <ul className="text-xs text-[var(--text-muted)] space-y-1 max-h-24 overflow-y-auto">
                {clientErrors.map((line) => (
                  <li key={line} className="truncate">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Alias Pattern (optional)
              </label>
              <input
                type="text"
                placeholder="e.g., link (becomes link-1, link-2...)"
                value={aliasSuffix}
                onChange={(e) => setAliasSuffix(e.target.value)}
                className="input-field text-sm"
                disabled={pending}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Start Date (optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field text-sm"
                disabled={pending}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Expiry Date (optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="input-field text-sm"
                disabled={pending}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Password (optional)
              </label>
              <input
                type="password"
                placeholder="Leave empty for no password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field text-sm"
                disabled={pending}
              />
            </div>
          </div>

          {results && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg stat-box-success text-center">
                <p className="text-2xl font-bold">{results.created}</p>
                <p className="text-sm opacity-90">Created</p>
              </div>
              <div className="p-4 rounded-lg stat-box-danger text-center">
                <p className="text-2xl font-bold">{results.failed}</p>
                <p className="text-sm opacity-90">Failed</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose} disabled={pending} className="flex-1 btn-secondary">
              {results ? 'Done' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={pending || valid.length === 0}
              className={cn('flex-1 btn-primary flex items-center justify-center gap-2', pending && 'opacity-80')}
            >
              {pending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating…
                </>
              ) : (
                'Generate all'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BulkCreateModal;