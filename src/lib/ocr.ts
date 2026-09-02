import { createWorker, type Worker } from 'tesseract.js';

export type OcrPhase =
  | 'uploaded'
  | 'preprocessing'
  | 'ocr-processing'
  | 'text-extracted'
  | 'ready';

export type OcrLang = 'eng' | 'mar' | 'eng+mar';

export interface OcrLangOption {
  value: OcrLang;
  label: string;
  hint: string;
}

export const OCR_LANG_OPTIONS: OcrLangOption[] = [
  { value: 'eng', label: 'English', hint: 'eng' },
  { value: 'mar', label: 'Marathi (मराठी)', hint: 'mar' },
  { value: 'eng+mar', label: 'English + Marathi', hint: 'eng+mar' },
];

export function ocrLangLabel(lang: OcrLang): string {
  const opt = OCR_LANG_OPTIONS.find((o) => o.value === lang);
  return opt ? opt.label : lang;
}

export interface OcrResult {
  text: string;
  pageCount: number;
  processedPage: number;
  ocrConfidence: number; // Tesseract's own confidence 0..100
  lang: OcrLang;
}

export interface OcrProgress {
  phase: OcrPhase;
  progress: number; // 0..1
  text: string;
}

// Cache workers per language — each language needs its own traineddata
const workerCache: Map<OcrLang, Worker> = new Map();

/**
 * The tessdata CDN path. Tesseract.js downloads .traineddata files from here.
 * We use the official tessdata_fast bucket which has eng.traineddata and mar.traineddata.
 */
const TESSDATA_PATH = 'https://tessdata.projectnaptha.com/4.0.0_fast';

async function getWorker(lang: OcrLang): Promise<Worker> {
  let worker = workerCache.get(lang);
  if (worker) return worker;

  // For combined 'eng+mar', Tesseract.js loads both traineddata files
  worker = await createWorker(lang, 1, {
    langPath: TESSDATA_PATH,
    logger: () => {},
  });
  workerCache.set(lang, worker);
  return worker;
}

/**
 * Terminate all cached workers (useful when switching languages or unmounting).
 */
export async function terminateAllWorkers(): Promise<void> {
  for (const [, worker] of workerCache) {
    try {
      await worker.terminate();
    } catch {
      // ignore
    }
  }
  workerCache.clear();
}

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ACCEPTED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png'];

export function isAcceptedFile(file: File): boolean {
  const typeOk = ACCEPTED_TYPES.includes(file.type);
  const name = file.name.toLowerCase();
  const extOk = ACCEPTED_EXTS.some((ext) => name.endsWith(ext));
  return typeOk || extOk;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function fileKind(file: File): 'pdf' | 'image' {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    ? 'pdf'
    : 'image';
}

async function renderPdfToCanvas(file: File): Promise<{ canvas: HTMLCanvasElement; pageCount: number; pageNumber: number }> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pageNumber = 1;
  const page = await pdf.getPage(pageNumber);

  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  await page.render({ canvasContext: ctx, viewport }).promise;
  return { canvas, pageCount: pdf.numPages, pageNumber };
}

export async function runOcr(
  file: File,
  lang: OcrLang,
  onProgress: (p: OcrProgress) => void,
): Promise<OcrResult> {
  onProgress({ phase: 'preprocessing', progress: 0.05, text: '' });

  let canvas: HTMLCanvasElement;
  let pageCount = 1;
  let processedPage = 1;

  try {
    if (fileKind(file) === 'pdf') {
      const rendered = await renderPdfToCanvas(file);
      canvas = rendered.canvas;
      pageCount = rendered.pageCount;
      processedPage = rendered.pageNumber;
    } else {
      canvas = await loadImageToCanvas(file);
    }
  } catch (err) {
    throw new Error(
      `Could not render document for OCR: ${err instanceof Error ? err.message : 'unknown error'}`,
    );
  }

  onProgress({ phase: 'preprocessing', progress: 0.15, text: '' });

  // Phase: OCR processing — loading the worker may download traineddata
  onProgress({ phase: 'ocr-processing', progress: 0.2, text: '' });

  const worker = await getWorker(lang);

  const result = await worker.recognize(canvas);

  onProgress({ phase: 'ocr-processing', progress: 0.75, text: '' });

  const text = result.data.text ?? '';
  // Tesseract provides a confidence score in result.data.confidence (0..100)
  const ocrConfidence = typeof result.data.confidence === 'number' && result.data.confidence > 0
    ? Math.round(result.data.confidence)
    : text.trim().length > 0
      ? 75 // fallback if Tesseract doesn't report confidence but text was produced
      : 0;

  onProgress({ phase: 'text-extracted', progress: 0.9, text });
  onProgress({ phase: 'ready', progress: 1, text });

  return { text, pageCount, processedPage, ocrConfidence, lang };
}

async function loadImageToCanvas(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load image'));
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    const scale = img.width < 1000 ? 2 : 1;
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}
