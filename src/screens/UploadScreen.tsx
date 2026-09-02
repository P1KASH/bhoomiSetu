import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FileText,
  ScrollText,
  GitBranch,
  Receipt,
  FileCheck2,
  UploadCloud,
  CheckCircle2,
  Loader2,
  ScanLine,
  ArrowRight,
  X,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  FileWarning,
  Pencil,
  Send,
  Eye,
  AlertCircle,
  RefreshCw,
  BadgeCheck,
  Quote,
  Info,
} from 'lucide-react';
import { AppLayout, PageHeader } from '../components/AppLayout';
import { useRouter } from '../router';
import { DEMO_RECORD_ID } from '../data/mockData';
import { runOcr, isAcceptedFile, formatFileSize, fileKind, createPreviewUrl, ocrLangLabel, OCR_LANG_OPTIONS, type OcrPhase, type OcrLang } from '../lib/ocr';
import {
  extractFields,
  overallFieldConfidence,
  fieldCompleteness,
  getDocSchema,
  detectDocTypeId,
  type ExtractedField,
  type DocTypeId,
} from '../lib/fieldExtraction';
import { storeCanonicalFields } from '../lib/extractedDataStore';
import { parseMultilingualFields } from '../lib/multilingualExtraction';
import { Languages, Gauge } from 'lucide-react';

const docTypes: { id: DocTypeId; label: string; icon: typeof FileText }[] = [
  { id: 'sale-deed', label: 'Sale Deed', icon: FileText },
  { id: 'ror', label: 'RoR / 7/12', icon: ScrollText },
  { id: 'mutation', label: 'Mutation Record', icon: GitBranch },
  { id: 'property', label: 'Property / Land Record', icon: FileCheck2 },
  { id: 'tax', label: 'Tax Record', icon: Receipt },
  { id: 'other', label: 'Other', icon: FileWarning },
];

interface UploadedDoc {
  id: string;
  file: File;
  previewUrl: string;
  kind: 'pdf' | 'image';
  docTypeId: DocTypeId;
  autoDetectedType: boolean;
  ocrLang: OcrLang;
  ocrPhase: OcrPhase;
  ocrProgress: number;
  ocrText: string;
  ocrError: string | null;
  ocrConfidence: number; // Tesseract's own confidence 0..100
  pageCount: number;
  processedPage: number;
  fields: ExtractedField[];
  showText: boolean;
  showFields: boolean;
  showEvidence: string | null; // field key currently showing evidence for
}

const phaseLabels: Record<OcrPhase, string> = {
  uploaded: 'Uploaded',
  preprocessing: 'Pre-processing',
  'ocr-processing': 'OCR processing',
  'text-extracted': 'Text extracted',
  ready: 'Ready for field extraction',
};

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export function UploadScreen() {
  const { navigate } = useRouter();
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [globalOcrLang, setGlobalOcrLang] = useState<OcrLang>('eng');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      docs.forEach((d) => URL.revokeObjectURL(d.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const accepted = files.filter(isAcceptedFile);
    const newDocs: UploadedDoc[] = accepted.map((file) => ({
      id: genId(),
      file,
      previewUrl: createPreviewUrl(file),
      kind: fileKind(file),
      docTypeId: 'sale-deed',
      autoDetectedType: false,
      ocrLang: globalOcrLang,
      ocrPhase: 'uploaded',
      ocrProgress: 0,
      ocrText: '',
      ocrError: null,
      ocrConfidence: 0,
      pageCount: 1,
      processedPage: 1,
      fields: [],
      showText: false,
      showFields: false,
      showEvidence: null,
    }));
    setDocs((prev) => [...prev, ...newDocs]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const removeDoc = (id: string) => {
    setDocs((prev) => {
      const doc = prev.find((d) => d.id === id);
      if (doc) URL.revokeObjectURL(doc.previewUrl);
      return prev.filter((d) => d.id !== id);
    });
  };

  const replaceDoc = (id: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
    input.onchange = () => {
      if (input.files && input.files[0] && isAcceptedFile(input.files[0])) {
        const file = input.files[0];
        setDocs((prev) =>
          prev.map((d) => {
            if (d.id !== id) return d;
            URL.revokeObjectURL(d.previewUrl);
            return {
              ...d,
              file,
              previewUrl: createPreviewUrl(file),
              kind: fileKind(file),
              ocrPhase: 'uploaded',
              ocrProgress: 0,
              ocrText: '',
              ocrError: null,
              ocrConfidence: 0,
              pageCount: 1,
              processedPage: 1,
              fields: [],
              autoDetectedType: false,
              showText: false,
              showFields: false,
              showEvidence: null,
            };
          }),
        );
      }
    };
    input.click();
  };

  const reExtractFields = (id: string, docTypeId: DocTypeId) => {
    setDocs((prev) =>
      prev.map((d) => {
        if (d.id !== id || !d.ocrText) return d;
        const schema = getDocSchema(docTypeId);
        const sourceLabel = `${schema.label}, Page ${d.processedPage}`;
        const fields = extractFields(d.ocrText, docTypeId, d.processedPage, sourceLabel);
        return { ...d, docTypeId, fields, showFields: true };
      }),
    );
  };

  const setDocOcrLang = (id: string, lang: OcrLang) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, ocrLang: lang } : d)));
  };

  const setDocType = (id: string, typeId: string) => {
    const tid = typeId as DocTypeId;
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, docTypeId: tid, autoDetectedType: false } : d)));
    // Re-extract fields if OCR text is already available
    reExtractFields(id, tid);
  };

  const toggleText = (id: string) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, showText: !d.showText } : d)));
  };

  const toggleFields = (id: string) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, showFields: !d.showFields } : d)));
  };

  const toggleEvidence = (docId: string, fieldKey: string) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === docId ? { ...d, showEvidence: d.showEvidence === fieldKey ? null : fieldKey } : d,
      ),
    );
  };

  const updateField = (docId: string, fieldKey: string, value: string) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              fields: d.fields.map((f) =>
                f.key === fieldKey
                  ? {
                      ...f,
                      value,
                      detected: value.trim().length > 0,
                      confidence: 100,
                      status: value.trim().length > 0 ? 'manually-verified' : 'not-detected',
                    }
                  : f,
              ),
            }
          : d,
      ),
    );
  };

  const processOcr = async (id: string) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, ocrPhase: 'preprocessing', ocrProgress: 0.05, ocrError: null } : d)));

    try {
      const doc = docs.find((d) => d.id === id);
      if (!doc) return;

      const result = await runOcr(doc.file, doc.ocrLang, (p) => {
        setDocs((prev) =>
          prev.map((d) => (d.id === id ? { ...d, ocrPhase: p.phase, ocrProgress: p.progress, ocrText: p.text } : d)),
        );
      });

      // Auto-detect document type from OCR text
      const detectedType = detectDocTypeId(result.text);
      const finalType = doc.autoDetectedType || doc.docTypeId !== 'sale-deed' ? doc.docTypeId : detectedType;
      const schema = getDocSchema(finalType);
      const sourceLabel = `${schema.label}, Page ${result.processedPage}`;
      const fields = extractFields(result.text, finalType, result.processedPage, sourceLabel);

      setDocs((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                ocrPhase: 'ready',
                ocrProgress: 1,
                ocrText: result.text,
                ocrConfidence: result.ocrConfidence,
                pageCount: result.pageCount,
                processedPage: result.processedPage,
                docTypeId: finalType,
                autoDetectedType: doc.docTypeId === 'sale-deed' && finalType !== 'sale-deed',
                fields,
                showFields: true,
              }
            : d,
        ),
      );
    } catch (err) {
      setDocs((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, ocrError: err instanceof Error ? err.message : 'OCR processing failed', ocrPhase: 'uploaded' }
            : d,
        ),
      );
    }
  };

  const processAll = async () => {
    const pending = docs.filter((d) => d.ocrPhase === 'uploaded' && !d.ocrError);
    for (const d of pending) {
      await processOcr(d.id);
    }
  };

  const allReady = docs.length > 0 && docs.every((d) => d.ocrPhase === 'ready' || d.ocrError !== null);
  const readyCount = docs.filter((d) => d.ocrPhase === 'ready').length;
  const pendingCount = docs.filter((d) => d.ocrPhase === 'uploaded').length;
  const processingCount = docs.filter((d) => d.ocrPhase === 'preprocessing' || d.ocrPhase === 'ocr-processing' || d.ocrPhase === 'text-extracted').length;

  const sendToValidation = () => {
    const readyDoc = docs.find((d) => d.ocrPhase === 'ready');
    if (readyDoc) {
      const schema = getDocSchema(readyDoc.docTypeId);
      const canonical = parseMultilingualFields(readyDoc.ocrText);
      storeCanonicalFields(canonical, readyDoc.docTypeId, schema.label);
    }
    navigate({ name: 'validation', recordId: DEMO_RECORD_ID });
  };

  return (
    <AppLayout title="Document Upload & Digitization" breadcrumb={<><span>Workspace</span><span className="text-navy-300">/</span><span>Digitize</span></>}>
      <PageHeader
        title="Upload & Extract Land Documents"
        subtitle="Upload PDF or image files. Document-type-aware OCR extracts structured fields with source evidence for validation."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Main column */}
        <div className="space-y-5 min-w-0">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`panel rounded-lg p-8 text-center cursor-pointer transition-all border-2 border-dashed ${
              dragOver ? 'border-navy-500 bg-navy-50' : 'border-sand-200 hover:border-navy-300 hover:bg-sand-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <UploadCloud className={`h-12 w-12 mx-auto mb-3 ${dragOver ? 'text-navy-500' : 'text-navy-300'}`} />
            <div className="font-serif text-lg font-semibold text-navy-800">
              Drag &amp; drop documents here, or click to browse
            </div>
            <p className="text-sm text-navy-500 mt-1">
              Supports PDF, JPG, JPEG, PNG — sale deeds, RoR, mutation records, tax records
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              {['PDF', 'JPG', 'JPEG', 'PNG'].map((f) => (
                <span key={f} className="chip bg-navy-50 text-navy-600 border border-navy-200">{f}</span>
              ))}
            </div>
          </div>

          {/* Document list */}
          {docs.length === 0 ? (
            <div className="panel rounded-lg p-10 text-center text-navy-400">
              <ScanLine className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No documents uploaded yet. Use the area above to add files.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {docs.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  globalOcrLang={globalOcrLang}
                  onRemove={removeDoc}
                  onReplace={replaceDoc}
                  onSetType={setDocType}
                  onSetOcrLang={setDocOcrLang}
                  onToggleText={toggleText}
                  onToggleFields={toggleFields}
                  onToggleEvidence={toggleEvidence}
                  onUpdateField={updateField}
                  onProcess={() => processOcr(doc.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="panel rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Languages className="h-4 w-4 text-navy-600" />
              <h3 className="text-sm font-semibold text-navy-700">OCR Language</h3>
            </div>
            <p className="text-[11px] text-navy-400 mb-2">
              Select the language of the document. Marathi uses Devanagari traineddata (mar).
              New uploads will use this language by default.
            </p>
            <div className="flex gap-1.5">
              {OCR_LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGlobalOcrLang(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    globalOcrLang === opt.value
                      ? 'bg-navy-600 text-white border-navy-600'
                      : 'bg-white text-navy-600 border-sand-200 hover:border-navy-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="panel rounded-lg p-5 sticky top-24">
            <h3 className="font-serif text-lg font-semibold text-navy-800 mb-3">Processing Summary</h3>

            <div className="space-y-2.5 mb-4">
              <SummaryRow icon={UploadCloud} label="Uploaded" count={docs.length} tone="navy" />
              <SummaryRow icon={Loader2} label="Processing" count={processingCount} tone="saffron" spin={processingCount > 0} />
              <SummaryRow icon={CheckCircle2} label="OCR Complete" count={readyCount} tone="forest" />
              <SummaryRow icon={AlertCircle} label="Pending" count={pendingCount} tone="navy" />
            </div>

            {docs.length > 0 && pendingCount > 0 && (
              <button onClick={processAll} className="btn-primary w-full mb-3">
                <ScanLine className="h-4 w-4" /> Run OCR on All ({pendingCount})
              </button>
            )}

            {allReady && readyCount > 0 && (
              <div className="bg-forest-50 border border-forest-200 rounded-md p-3 mb-3">
                <div className="flex items-center gap-2 text-forest-700 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  {readyCount} document{readyCount > 1 ? 's' : ''} ready
                </div>
                <p className="text-xs text-forest-600 mt-1">
                  Review and correct extracted fields, then send to validation.
                </p>
              </div>
            )}

            <button onClick={sendToValidation} disabled={readyCount === 0} className="btn-accent w-full">
              <Send className="h-4 w-4" /> Send to Validation Engine
              <ArrowRight className="h-4 w-4 ml-auto" />
            </button>

            <div className="mt-3 text-xs text-navy-400 text-center">
              Maps extracted fields to the LR-1242A demo flow
            </div>
          </div>

          <div className="panel rounded-lg p-4 bg-navy-50 border-navy-200">
            <div className="flex gap-2.5">
              <Info className="h-5 w-5 text-navy-600 shrink-0 mt-0.5" />
              <div className="text-xs text-navy-600 leading-relaxed space-y-1.5">
                <p>
                  OCR runs entirely in-browser via Tesseract.js. No document leaves the device.
                </p>
                <p>
                  <span className="font-semibold">Extraction confidence</span> reflects OCR quality.
                  <span className="font-semibold"> Cross-record consistency</span> is evaluated
                  separately in the Validation Engine.
                </p>
                <p className="text-navy-400 italic">
                  AI assists extraction. Officers make final decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  count,
  tone,
  spin,
}: {
  icon: typeof UploadCloud;
  label: string;
  count: number;
  tone: 'navy' | 'forest' | 'saffron';
  spin?: boolean;
}) {
  const tones = {
    navy: 'bg-navy-50 text-navy-600',
    forest: 'bg-forest-50 text-forest-600',
    saffron: 'bg-saffron-50 text-saffron-600',
  };
  return (
    <div className="flex items-center gap-2.5">
      <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${tones[tone]}`}>
        <Icon className={`h-3.5 w-3.5 ${spin ? 'animate-spin' : ''}`} />
      </div>
      <span className="text-sm text-navy-600 flex-1">{label}</span>
      <span className="font-mono font-semibold text-navy-800 text-sm">{count}</span>
    </div>
  );
}

function DocCard({
  doc,
  onRemove,
  onReplace,
  onSetType,
  onSetOcrLang,
  onToggleText,
  onToggleFields,
  onToggleEvidence,
  onUpdateField,
  onProcess,
}: {
  doc: UploadedDoc;
  globalOcrLang: OcrLang;
  onRemove: (id: string) => void;
  onReplace: (id: string) => void;
  onSetType: (id: string, typeId: string) => void;
  onSetOcrLang: (id: string, lang: OcrLang) => void;
  onToggleText: (id: string) => void;
  onToggleFields: (id: string) => void;
  onToggleEvidence: (docId: string, fieldKey: string) => void;
  onUpdateField: (docId: string, fieldKey: string, value: string) => void;
  onProcess: () => void;
}) {
  const isProcessing = doc.ocrPhase === 'preprocessing' || doc.ocrPhase === 'ocr-processing' || doc.ocrPhase === 'text-extracted';
  const isReady = doc.ocrPhase === 'ready';
  const hasError = doc.ocrError !== null;
  const overallConf = doc.fields.length > 0 ? overallFieldConfidence(doc.fields) : 0;
  const detectedCount = doc.fields.filter((f) => f.detected).length;
  const uncertainCount = doc.fields.filter((f) => f.status === 'uncertain').length;
  const verifiedCount = doc.fields.filter((f) => f.status === 'manually-verified').length;
  const schema = getDocSchema(doc.docTypeId);

  return (
    <div className="panel rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-sand-200 flex items-center gap-3 bg-white">
        <div className="h-10 w-10 rounded-md bg-navy-50 text-navy-600 flex items-center justify-center shrink-0">
          {doc.kind === 'pdf' ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-navy-800 truncate">{doc.file.name}</div>
          <div className="text-xs text-navy-500 font-mono">
            {doc.kind.toUpperCase()} · {formatFileSize(doc.file.size)}
            {doc.pageCount > 1 && ` · ${doc.pageCount} pages`}
          </div>
        </div>
        {doc.autoDetectedType && (
          <span className="chip bg-navy-50 text-navy-500 border border-navy-200 text-[10px]">Auto-detected</span>
        )}
        <PhaseBadge phase={doc.ocrPhase} error={doc.ocrError} />
        <div className="flex items-center gap-1 shrink-0">
          <span className="chip bg-navy-50 text-navy-500 border border-navy-200 text-[10px] flex items-center gap-1">
            <Languages className="h-3 w-3" /> {ocrLangLabel(doc.ocrLang)}
          </span>
          <button onClick={() => onReplace(doc.id)} disabled={isProcessing} className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-50 rounded disabled:opacity-40" title="Replace file">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => onRemove(doc.id)} disabled={isProcessing} className="p-1.5 text-navy-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-40" title="Remove">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-0">
        {/* Preview */}
        <div className="bg-sand-50 border-b md:border-b-0 md:border-r border-sand-200 p-4 flex items-center justify-center" style={{ minHeight: '180px' }}>
          {doc.kind === 'image' ? (
            <img src={doc.previewUrl} alt={doc.file.name} className="max-h-40 max-w-full object-contain rounded border border-sand-200" />
          ) : (
            <div className="flex flex-col items-center text-navy-500">
              <FileText className="h-12 w-12 mb-2 opacity-60" />
              <span className="text-xs font-medium">PDF Document</span>
              <span className="text-[11px] text-navy-400 mt-0.5">Page {doc.processedPage} of {doc.pageCount}</span>
            </div>
          )}
        </div>

        {/* Right: doc type + OCR controls */}
        <div className="p-4 space-y-3">
          {/* Document type selector */}
          <div>
            <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-1.5 block">
              Document Type
              {doc.autoDetectedType && <span className="ml-2 text-[10px] normal-case text-navy-400">(auto-detected from OCR)</span>}
            </label>
            <select
              value={doc.docTypeId}
              onChange={(e) => onSetType(doc.id, e.target.value)}
              disabled={isProcessing}
              className="w-full px-3 py-2 text-sm bg-white border border-sand-200 rounded-md outline-none focus:border-navy-400 disabled:opacity-60"
            >
              {docTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <div className="text-[11px] text-navy-400 mt-1">
              {schema.fields.length} fields targeted for {schema.label}
            </div>
          </div>

          {/* OCR Language selector */}
          <div>
            <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-1.5 block">
              OCR Language
            </label>
            <select
              value={doc.ocrLang}
              onChange={(e) => onSetOcrLang(doc.id, e.target.value as OcrLang)}
              disabled={isProcessing}
              className="w-full px-3 py-2 text-sm bg-white border border-sand-200 rounded-md outline-none focus:border-navy-400 disabled:opacity-60"
            >
              {OCR_LANG_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {doc.ocrLang !== 'eng' && doc.ocrPhase === 'uploaded' && (
              <div className="text-[11px] text-saffron-600 mt-1">
                Marathi traineddata will download on first OCR run (~2MB).
              </div>
            )}
          </div>

          {/* OCR actions */}
          {doc.ocrPhase === 'uploaded' && !hasError && (
            <button onClick={onProcess} className="btn-primary w-full text-sm">
              <ScanLine className="h-4 w-4" /> Run OCR
            </button>
          )}

          {hasError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center gap-2 text-red-700 text-sm font-medium mb-1">
                <AlertCircle className="h-4 w-4" /> OCR Failed
              </div>
              <p className="text-xs text-red-600">{doc.ocrError}</p>
              <button onClick={onProcess} className="btn-secondary mt-2 text-xs">
                <RefreshCw className="h-3.5 w-3.5" /> Retry OCR
              </button>
            </div>
          )}

          {isProcessing && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-navy-600 flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 text-saffron-500 animate-spin" />
                  {phaseLabels[doc.ocrPhase]}
                </span>
                <span className="font-mono text-xs text-navy-500">{Math.round(doc.ocrProgress * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-navy-100 rounded-full overflow-hidden">
                <div className="h-full bg-saffron-400 transition-all duration-300" style={{ width: `${doc.ocrProgress * 100}%` }} />
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-navy-400">
                {(() => {
                  const phaseOrder: OcrPhase[] = ['uploaded', 'preprocessing', 'ocr-processing', 'text-extracted', 'ready'];
                  return phaseOrder.map((ph, i) => {
                    const currentIdx = phaseOrder.indexOf(doc.ocrPhase);
                    const done = i < currentIdx;
                    const active = i === currentIdx;
                    return (
                      <span key={ph} className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-forest-500' : active ? 'bg-saffron-400' : 'bg-navy-200'}`} />
                    );
                  });
                })()}
                <span className="ml-1">
                  Step {(['uploaded', 'preprocessing', 'ocr-processing', 'text-extracted', 'ready'] as OcrPhase[]).indexOf(doc.ocrPhase) + 1} of 5
                </span>
              </div>
            </div>
          )}

          {isReady && (() => {
            const completeness = fieldCompleteness(doc.fields);
            const ocrQ = doc.ocrConfidence;
            const ocrQColor = ocrQ >= 75 ? 'text-forest-700' : ocrQ >= 50 ? 'text-saffron-600' : 'text-red-600';
            const fieldConfColor = overallConf >= 75 ? 'text-forest-700' : overallConf >= 50 ? 'text-saffron-600' : 'text-red-600';
            const completenessColor = completeness.detected === completeness.total ? 'text-forest-700' : completeness.detected >= completeness.total / 2 ? 'text-saffron-600' : 'text-red-600';
            return (
            <div className="bg-forest-50 border border-forest-200 rounded-md p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-forest-700 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" /> OCR Complete
                </div>
                <span className="chip bg-navy-50 text-navy-500 border border-navy-200 text-[10px] flex items-center gap-1">
                  <Languages className="h-3 w-3" /> {ocrLangLabel(doc.ocrLang)}
                </span>
              </div>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs">
                  <Gauge className="h-3.5 w-3.5 text-navy-400" />
                  <span className="text-navy-500">OCR Quality (Tesseract):</span>
                  <span className={`font-mono text-sm font-semibold ${ocrQColor}`}>{ocrQ}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-navy-500">Field Extraction Confidence:</span>
                  <span className={`font-mono text-sm font-semibold ${fieldConfColor}`}>{overallConf}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-navy-500">Fields Detected:</span>
                  <span className={`font-mono text-sm font-semibold ${completenessColor}`}>{completeness.detected}/{completeness.total}</span>
                </div>
              </div>
              {(uncertainCount > 0 || verifiedCount > 0) && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {uncertainCount > 0 && (
                    <span className="chip bg-saffron-50 text-saffron-700 border border-saffron-200 text-[10px]">{uncertainCount} uncertain</span>
                  )}
                  {verifiedCount > 0 && (
                    <span className="chip bg-navy-50 text-navy-700 border border-navy-200 text-[10px]">{verifiedCount} verified</span>
                  )}
                </div>
              )}
            </div>
            );
          })()}
        </div>
      </div>

      {/* Extracted text panel */}
      {isReady && doc.ocrText && (
        <div className="border-t border-sand-200">
          <button onClick={() => onToggleText(doc.id)} className="w-full px-5 py-2.5 flex items-center justify-between text-sm font-medium text-navy-700 hover:bg-sand-50">
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-navy-400" /> Extracted Text
              <span className="chip bg-navy-50 text-navy-500 border border-navy-200">{doc.ocrText.length.toLocaleString()} chars</span>
            </span>
            {doc.showText ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {doc.showText && (
            <div className="px-5 pb-4">
              <pre className="text-xs text-navy-600 bg-sand-50 border border-sand-200 rounded-md p-3 max-h-52 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
                {doc.ocrText || '(no text extracted)'}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Extracted fields panel */}
      {isReady && doc.fields.length > 0 && (
        <div className="border-t border-sand-200">
          <button onClick={() => onToggleFields(doc.id)} className="w-full px-5 py-2.5 flex items-center justify-between text-sm font-medium text-navy-700 hover:bg-sand-50">
            <span className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-navy-400" /> Extracted Land Fields — {schema.label}
              <span className="chip bg-forest-50 text-forest-600 border border-forest-200">{detectedCount} detected</span>
            </span>
            {doc.showFields ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {doc.showFields && (
            <div className="px-5 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0">
                {doc.fields.map((f) => (
                  <FieldRow
                    key={f.key}
                    field={f}
                    showEvidence={doc.showEvidence === f.key}
                    onToggleEvidence={() => onToggleEvidence(doc.id, f.key)}
                    onChange={(val) => onUpdateField(doc.id, f.key, val)}
                  />
                ))}
              </div>
              <div className="mt-3 p-3 bg-sand-50 border border-sand-200 rounded-md">
                <p className="text-[11px] text-navy-500 leading-relaxed">
                  <span className="font-semibold">Extraction confidence</span> reflects OCR quality for this document only.
                  Cross-record consistency is evaluated separately in the Validation Engine.
                  Manually edited fields are marked as <span className="font-semibold">verified</span>.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PhaseBadge({ phase, error }: { phase: OcrPhase; error: string | null }) {
  if (error) {
    return <span className="chip bg-red-50 text-red-700 border border-red-200"><AlertCircle className="h-3 w-3" /> Failed</span>;
  }
  const map: Record<OcrPhase, { bg: string; text: string; border: string; icon: typeof CheckCircle2 }> = {
    uploaded: { bg: 'bg-navy-50', text: 'text-navy-600', border: 'border-navy-200', icon: UploadCloud },
    preprocessing: { bg: 'bg-saffron-50', text: 'text-saffron-700', border: 'border-saffron-200', icon: Loader2 },
    'ocr-processing': { bg: 'bg-saffron-50', text: 'text-saffron-700', border: 'border-saffron-200', icon: Loader2 },
    'text-extracted': { bg: 'bg-saffron-50', text: 'text-saffron-700', border: 'border-saffron-200', icon: ScanLine },
    ready: { bg: 'bg-forest-50', text: 'text-forest-700', border: 'border-forest-200', icon: CheckCircle2 },
  };
  const m = map[phase];
  const Icon = m.icon;
  const spin = phase === 'preprocessing' || phase === 'ocr-processing';
  return (
    <span className={`chip ${m.bg} ${m.text} border ${m.border}`}>
      <Icon className={`h-3 w-3 ${spin ? 'animate-spin' : ''}`} />
      {phaseLabels[phase]}
    </span>
  );
}

function FieldRow({
  field,
  showEvidence,
  onToggleEvidence,
  onChange,
}: {
  field: ExtractedField;
  showEvidence: boolean;
  onToggleEvidence: () => void;
  onChange: (val: string) => void;
}) {
  const tone = field.status === 'manually-verified'
    ? 'navy'
    : field.confidence >= 90
    ? 'forest'
    : field.confidence >= 75
    ? 'navy'
    : field.detected
    ? 'saffron'
    : 'red';
  const barTone = tone === 'forest' ? 'bg-forest-500' : tone === 'navy' ? 'bg-navy-500' : tone === 'saffron' ? 'bg-saffron-400' : 'bg-red-400';

  const statusLabel = {
    'extracted': null,
    'uncertain': 'Uncertain — manual review required',
    'not-detected': 'Not detected — manual entry required',
    'manually-verified': 'Manually verified',
  }[field.status];

  return (
    <div className="py-2 border-b border-sand-200 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-navy-500 font-medium">{field.label}</label>
          {field.status === 'manually-verified' && (
            <BadgeCheck className="h-3.5 w-3.5 text-navy-600" />
          )}
        </div>
        {field.detected ? (
          <span className="flex items-center gap-1.5">
            <div className="w-16 h-1 rounded-full bg-navy-100 overflow-hidden">
              <div className={`h-full ${barTone}`} style={{ width: `${field.confidence}%` }} />
            </div>
            <span className="text-[10px] font-mono text-navy-500 w-7 text-right">{field.confidence}%</span>
            {field.evidence && (
              <button
                onClick={onToggleEvidence}
                className="p-0.5 text-navy-400 hover:text-navy-700 hover:bg-navy-50 rounded"
                title="View source evidence"
              >
                <Quote className="h-3 w-3" />
              </button>
            )}
          </span>
        ) : (
          <span className="text-[10px] text-red-500 font-medium">Not detected</span>
        )}
      </div>
      <input
        value={field.value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.detected ? '' : 'Not detected — manual entry required'}
        className={`w-full px-2.5 py-1.5 text-sm border rounded outline-none focus:border-navy-400 ${
          field.status === 'manually-verified'
            ? 'border-navy-300 bg-navy-50 text-navy-800'
            : field.detected
            ? 'border-sand-200 bg-white text-navy-800'
            : 'border-red-200 bg-red-50 text-navy-700'
        }`}
      />
      {statusLabel && (
        <div className={`text-[10px] mt-1 ${field.status === 'uncertain' ? 'text-saffron-600' : field.status === 'manually-verified' ? 'text-navy-500' : 'text-red-500'}`}>
          {statusLabel}
        </div>
      )}
      {/* Evidence panel */}
      {showEvidence && field.evidence && (
        <div className="mt-1.5 p-2.5 bg-navy-50 border border-navy-200 rounded text-[11px]">
          <div className="flex items-center gap-1.5 text-navy-600 font-medium mb-1">
            <Quote className="h-3 w-3" /> Source Evidence
          </div>
          <div className="text-navy-500 mb-1">
            Source: <span className="font-medium text-navy-700">{field.evidence.sourceDoc}</span>
            {field.evidence.pageNumber && <span>, Page {field.evidence.pageNumber}</span>}
          </div>
          <div className="text-navy-600 italic bg-white border border-sand-200 rounded px-2 py-1.5 font-mono text-[10px] leading-snug">
            "{field.evidence.snippet}"
          </div>
        </div>
      )}
    </div>
  );
}
