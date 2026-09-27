import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Users,
  Send
} from 'lucide-react';
import { api } from '../api/client';

interface ImportedLeadsProps {
  onNavigateToLeads?: () => void;
  onNavigateToSheets?: () => void;
}

export const ImportedLeads: React.FC<ImportedLeadsProps> = ({ onNavigateToLeads, onNavigateToSheets }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [availableFields, setAvailableFields] = useState<any[]>([]);
  const [step, setStep] = useState<'upload' | 'mapping' | 'results'>('upload');
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<{
    imported_count: number;
    duplicate_count: number;
    invalid_count: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setSelectedFile(file);
    setErrorNotice(null);
    setLoading(true);

    try {
      const data = await api.detectCsvColumns(file);
      setHeaders(data.headers);
      setPreviewRows(data.preview_rows);
      setColumnMapping(data.detected_mapping);
      setAvailableFields(data.available_system_fields);
      setCsvContent(data.csv_content);
      setStep('mapping');
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to parse CSV file. Ensure it is a valid CSV.');
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (csvCol: string, sysField: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [csvCol]: sysField
    }));
  };

  const handleExecuteImport = async () => {
    // Check that at least business_name is mapped
    const hasBusinessName = Object.values(columnMapping).includes('business_name');
    if (!hasBusinessName) {
      setErrorNotice("You must map at least one column to 'Business / Company Name'.");
      return;
    }

    setLoading(true);
    setErrorNotice(null);

    try {
      const res = await api.importLeadsCsv({
        csv_content: csvContent,
        column_mapping: columnMapping
      });
      setImportResults(res);
      setStep('results');
    } catch (err: any) {
      setErrorNotice(err.message || 'Error executing CSV lead import.');
    } finally {
      setLoading(false);
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setCsvContent('');
    setHeaders([]);
    setPreviewRows([]);
    setColumnMapping({});
    setImportResults(null);
    setStep('upload');
    setErrorNotice(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Outreach Center</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Import External Leads</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload CSV lead sheets with automatic column detection, deduplication, and internal lead scoring.
          </p>
        </div>

        {step !== 'upload' && (
          <button
            onClick={resetImport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Import Another File</span>
          </button>
        )}
      </div>

      {errorNotice && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 flex items-center gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-10 shadow-xl max-w-2xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-extrabold text-white">Upload Your Leads CSV</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Accepts spreadsheets with columns like Business Name, Email, Phone, Website, City, and Category.
              Deduplication and lead scoring will be calculated automatically.
            </p>
          </div>

          <label className="inline-block cursor-pointer">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2">
              {loading ? (
                <RotateCcw className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              <span>Select CSV File</span>
            </div>
          </label>
        </div>
      )}

      {/* Step 2: Mapping Editor */}
      {step === 'mapping' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-white">Review & Confirm Column Mapping</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                We detected the following mappings. You can correct any field assignment before saving.
              </p>
            </div>
            <span className="text-xs text-indigo-400 font-mono">
              File: {selectedFile?.name}
            </span>
          </div>

          {/* Mappings Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {headers.map(header => (
              <div
                key={header}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div>
                  <span className="text-xs font-bold text-white block">{header}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Sample: {previewRows[0]?.[headers.indexOf(header)] || '—'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                  <select
                    value={columnMapping[header] || 'ignore'}
                    onChange={e => handleMappingChange(header, e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    {availableFields.map(f => (
                      <option key={f.field} value={f.field}>
                        {f.label} {f.required ? '*' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={resetImport}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleExecuteImport}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Processing & Scoring Leads...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Import Leads Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 'results' && importResults && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-xl max-w-2xl mx-auto space-y-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-xl font-extrabold text-white">Import Complete!</h2>
            <p className="text-xs text-slate-400">
              The leads have been normalized, deduplicated, scored, and committed to PostgreSQL.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Imported</span>
              <p className="text-2xl font-extrabold text-white mt-1">{importResults.imported_count}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-amber-400">Duplicates Skipped</span>
              <p className="text-2xl font-extrabold text-white mt-1">{importResults.duplicate_count}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-rose-400">Invalid Rows</span>
              <p className="text-2xl font-extrabold text-white mt-1">{importResults.invalid_count}</p>
            </div>
          </div>

          {importResults.errors.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <span className="font-bold text-slate-300 block">Row Notices:</span>
              <ul className="space-y-1 text-slate-400 list-disc list-inside text-[11px]">
                {importResults.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={resetImport}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
            >
              Upload Another CSV
            </button>
            {onNavigateToLeads && (
              <button
                onClick={onNavigateToLeads}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                <Users className="w-3.5 h-3.5" />
                <span>View Discovered Leads</span>
              </button>
            )}
            {onNavigateToSheets && (
              <button
                onClick={onNavigateToSheets}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Sync to Google Sheets</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
