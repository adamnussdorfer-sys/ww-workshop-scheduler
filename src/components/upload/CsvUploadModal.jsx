import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { parseWorkshopCSV, downloadCsvTemplate } from '../../utils/csvParser';

const STEPS = { SELECT: 'select', PREVIEW: 'preview' };

export default function CsvUploadModal({ coaches, onImport, onClose }) {
  const [step, setStep] = useState(STEPS.SELECT);
  const [dragOver, setDragOver] = useState(false);
  const [parseResult, setParseResult] = useState(null); // { valid, errors }
  const [fileName, setFileName] = useState('');
  const fileRef = useRef(null);

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = parseWorkshopCSV(e.target.result, coaches);
        setParseResult(result);
        setStep(STEPS.PREVIEW);
      };
      reader.readAsText(file);
    },
    [coaches]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const onFileChange = useCallback(
    (e) => {
      handleFile(e.target.files[0]);
      e.target.value = ''; // reset so same file can be re-selected
    },
    [handleFile]
  );

  const handleImport = () => {
    if (parseResult?.valid.length) {
      onImport(parseResult.valid);
    }
  };

  // Group errors by row for the preview table
  const errorsByRow = {};
  if (parseResult) {
    for (const err of parseResult.errors) {
      if (!errorsByRow[err.row]) errorsByRow[err.row] = [];
      errorsByRow[err.row].push(err);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-20" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
            <h2 className="text-lg font-semibold text-ww-navy">Upload CSV</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto p-6">
            {step === STEPS.SELECT && (
              <div className="space-y-4">
                {/* Drop zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-ww-blue bg-ww-blue/5'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <Upload
                    size={32}
                    className={`mx-auto mb-3 ${dragOver ? 'text-ww-blue' : 'text-slate-400'}`}
                  />
                  <p className="text-sm font-medium text-slate-700">
                    Drop a CSV file here or click to browse
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Expects columns: title, type, coach, co-coach, date, start, end, markets, recurrence
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={onFileChange}
                    className="hidden"
                  />
                </div>

                {/* Template download */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadCsvTemplate();
                  }}
                  className="flex items-center gap-2 text-sm text-ww-blue hover:text-ww-blue/80 transition-colors"
                >
                  <Download size={14} />
                  Download CSV template
                </button>
              </div>
            )}

            {step === STEPS.PREVIEW && parseResult && (
              <div className="space-y-4">
                {/* File info */}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FileText size={14} className="text-slate-400" />
                  <span className="font-medium">{fileName}</span>
                </div>

                {/* Summary */}
                <div className="flex items-center gap-4">
                  {parseResult.valid.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                      <CheckCircle size={14} />
                      {parseResult.valid.length} valid
                    </span>
                  )}
                  {parseResult.errors.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 bg-red-50 px-3 py-1 rounded-full">
                      <AlertTriangle size={14} />
                      {/* Count unique error rows */}
                      {new Set(parseResult.errors.map((e) => e.row)).size} row{new Set(parseResult.errors.map((e) => e.row)).size !== 1 ? 's' : ''} with errors
                    </span>
                  )}
                </div>

                {/* File-level errors */}
                {errorsByRow[0] && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {errorsByRow[0].map((e, i) => (
                      <p key={i}>{e.message}</p>
                    ))}
                  </div>
                )}

                {/* Preview table */}
                {(parseResult.valid.length > 0 || Object.keys(errorsByRow).some((k) => k !== '0')) && (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="overflow-auto max-h-[40vh]">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-border">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 w-10">Row</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Title</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Coach</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Date</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Valid rows */}
                          {parseResult.valid.map((w, idx) => (
                            <tr key={w.id} className="border-b border-border last:border-0">
                              <td className="px-3 py-2 text-slate-400">{idx + 2}</td>
                              <td className="px-3 py-2 text-slate-700 font-medium">{w.title}</td>
                              <td className="px-3 py-2 text-slate-600">{w.type}</td>
                              <td className="px-3 py-2 text-slate-600">
                                {coaches.find((c) => c.id === w.coachId)?.name}
                              </td>
                              <td className="px-3 py-2 text-slate-600">{w.startTime.split('T')[0]}</td>
                              <td className="px-3 py-2">
                                <span className="text-emerald-600 text-xs font-medium">Valid</span>
                              </td>
                            </tr>
                          ))}
                          {/* Error rows */}
                          {Object.entries(errorsByRow)
                            .filter(([row]) => row !== '0')
                            .map(([row, errs]) => (
                              <tr key={`err-${row}`} className="bg-red-50/50 border-b border-border last:border-0">
                                <td className="px-3 py-2 text-red-400">{row}</td>
                                <td colSpan={4} className="px-3 py-2">
                                  <div className="text-xs text-red-600 space-y-0.5">
                                    {errs.map((e, i) => (
                                      <p key={i}>
                                        <span className="font-medium">{e.field}:</span> {e.message}
                                      </p>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <span className="text-red-600 text-xs font-medium">Error</span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border flex-shrink-0">
            {step === STEPS.PREVIEW && parseResult?.valid.length === 0 ? (
              <>
                <span className="text-sm text-red-600">No valid rows to import</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setStep(STEPS.SELECT);
                      setParseResult(null);
                      setFileName('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-border rounded-full hover:bg-surface-2 transition-colors"
                  >
                    Try another file
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-border rounded-full hover:bg-surface-2 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : step === STEPS.PREVIEW ? (
              <>
                <button
                  onClick={() => {
                    setStep(STEPS.SELECT);
                    setParseResult(null);
                    setFileName('');
                  }}
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Back
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-border rounded-full hover:bg-surface-2 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    className="px-4 py-2 text-sm font-medium text-white bg-ww-blue rounded-full hover:bg-ww-blue/90 transition-colors"
                  >
                    Import {parseResult?.valid.length} workshop{parseResult?.valid.length !== 1 ? 's' : ''}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div />
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-border rounded-full hover:bg-surface-2 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
