"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileJson,
  FileText,
  Loader2,
  UploadCloud,
  XCircle
} from "lucide-react";
import { useMemo, useState } from "react";
import type { AnalysisResult, ApplicationData } from "@/lib/types";
import { blankApplicationData, compareLabel, FIELD_LABELS } from "@/lib/validation";

type QueuedFile = {
  id: string;
  file: File;
  previewUrl: string;
  result?: AnalysisResult;
  error?: string;
};

type ApplicationRecord = ApplicationData & {
  fileName: string;
  applicationId: string;
};

const fieldOrder = Object.keys(FIELD_LABELS) as Array<keyof ApplicationData>;
const ANALYSIS_MAX_IMAGE_EDGE = 1200;
const ANALYSIS_JPEG_QUALITY = 0.72;

function statusIcon(status: string) {
  if (status === "match") return <CheckCircle2 aria-hidden="true" />;
  if (status === "extracted") return <FileText aria-hidden="true" />;
  if (status === "not_applicable") return <FileText aria-hidden="true" />;
  if (status === "warning") return <AlertTriangle aria-hidden="true" />;
  return <XCircle aria-hidden="true" />;
}

function fieldStatusText(status: string) {
  if (status === "not_applicable") return "Not applicable";
  return status;
}

function statusText(status: string) {
  if (status === "pass") return "Pass";
  if (status === "review") return "Review";
  if (status === "fail") return "Fail";
  return status;
}

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read CSV file."));
    reader.readAsText(file);
  });
}

function imageToOptimizedJpegDataUrl(image: HTMLImageElement) {
  const scale = Math.min(
    1,
    ANALYSIS_MAX_IMAGE_EDGE / Math.max(image.naturalWidth || 1, image.naturalHeight || 1)
  );
  const width = Math.max(1, Math.round((image.naturalWidth || ANALYSIS_MAX_IMAGE_EDGE) * scale));
  const height = Math.max(1, Math.round((image.naturalHeight || ANALYSIS_MAX_IMAGE_EDGE) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to prepare image for analysis.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", ANALYSIS_JPEG_QUALITY);
}

function fileToOptimizedJpegDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const dataUrl = imageToOptimizedJpegDataUrl(image);
        URL.revokeObjectURL(imageUrl);
        resolve(dataUrl);
      } catch (error) {
        URL.revokeObjectURL(imageUrl);
        reject(error);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("Unable to read image."));
    };
    image.src = imageUrl;
  });
}

function fileToAnalysisDataUrl(file: File) {
  return fileToOptimizedJpegDataUrl(file);
}

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function parseApplicationCsv(text: string): ApplicationRecord[] {
  const rows = parseCsv(text);
  const header = rows[0]?.map((value) => value.trim()) ?? [];
  const required = ["fileName", "applicationId", ...fieldOrder];

  for (const column of required) {
    if (!header.includes(column)) {
      throw new Error(`Application CSV is missing required column: ${column}`);
    }
  }

  return rows.slice(1).map((row) => {
    const values = Object.fromEntries(header.map((key, index) => [key, row[index]?.trim() ?? ""]));
    return {
      fileName: values.fileName,
      applicationId: values.applicationId,
      brandName: values.brandName,
      classType: values.classType,
      abv: values.abv,
      proof: values.proof,
      netContents: values.netContents,
      producerName: values.producerName,
      producerAddress: values.producerAddress,
      countryOfOrigin: values.countryOfOrigin,
      governmentWarning: values.governmentWarning
    };
  });
}

function applicationOnly(record: ApplicationRecord): ApplicationData {
  return {
    brandName: record.brandName,
    classType: record.classType,
    abv: record.abv,
    proof: record.proof,
    netContents: record.netContents,
    producerName: record.producerName,
    producerAddress: record.producerAddress,
    countryOfOrigin: record.countryOfOrigin,
    governmentWarning: record.governmentWarning
  };
}

export default function Home() {
  const [application, setApplication] = useState<ApplicationData>(blankApplicationData());
  const [applicationRecords, setApplicationRecords] = useState<ApplicationRecord[]>([]);
  const [applicationCsvName, setApplicationCsvName] = useState("");
  const [applicationCsvError, setApplicationCsvError] = useState("");
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const activeFile = files.find((file) => file.id === activeId) ?? files[0];
  const results = files.map((file) => file.result).filter(Boolean) as AnalysisResult[];
  const hasAnalyzedLabel = results.length > 0;
  const matchingApplicationRecord = activeFile
    ? applicationRecords.find((record) => record.fileName === activeFile.file.name)
    : undefined;
  const batchStats = useMemo(
    () => ({
      total: files.length,
      processed: results.length,
      pass: results.filter((result) => result.overallStatus === "pass").length,
      review: results.filter((result) => result.overallStatus === "review").length,
      fail: results.filter((result) => result.overallStatus === "fail").length,
      needAction: results.filter((result) => result.overallStatus !== "pass").length
    }),
    [files.length, results]
  );

  function addFiles(selected: FileList | File[]) {
    const imageFiles = Array.from(selected).filter((file) => file.type.startsWith("image/"));
    const queued = imageFiles.map((file) => ({
      id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    setFiles((current) => [...current, ...queued]);
    if (!activeId && queued[0]) setActiveId(queued[0].id);
  }

  function applyApplication(nextApplication: ApplicationData) {
    setApplication(nextApplication);
    setFiles((current) =>
      current.map((file) => {
        if (!file.result) return file;
        return {
          ...file,
          result: {
            ...file.result,
            ...compareLabel(nextApplication, file.result.extracted)
          }
        };
      })
    );
  }

  function updateApplicationField(key: keyof ApplicationData, value: string) {
    applyApplication({ ...application, [key]: value });
  }

  async function importApplicationCsv(file: File) {
    try {
      const text = await readFileAsText(file);
      const records = parseApplicationCsv(text);
      setApplicationRecords(records);
      setApplicationCsvName(file.name);
      setApplicationCsvError("");
    } catch (error) {
      setApplicationRecords([]);
      setApplicationCsvName("");
      setApplicationCsvError(error instanceof Error ? error.message : "Unable to import CSV.");
    }
  }

  function loadMatchingApplication() {
    if (!matchingApplicationRecord) return;
    applyApplication(applicationOnly(matchingApplicationRecord));
  }

  async function analyze() {
    if (!files.length) return;
    setIsProcessing(true);

    for (const queued of files) {
      if (queued.result) continue;

      try {
        const imageDataUrl = await fileToAnalysisDataUrl(queued.file);
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: queued.file.name,
            imageDataUrl,
            application
          })
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Analysis failed.");
        setFiles((current) =>
          current.map((file) => (file.id === queued.id ? { ...file, result: payload } : file))
        );
        setActiveId(queued.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to analyze file.";
        setFiles((current) =>
          current.map((file) => (file.id === queued.id ? { ...file, error: message } : file))
        );
      }
    }

    setIsProcessing(false);
  }

  function exportJson() {
    downloadFile(
      "ttb-label-verification-results.json",
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          applicationData: application,
          applicationCsv: applicationCsvName,
          results
        },
        null,
        2
      ),
      "application/json"
    );
  }

  function exportCsv() {
    const exportedAt = new Date().toISOString();
    const rows = [
      [
        "exported_at",
        "file",
        "application_csv",
        "overall_status",
        "elapsed_ms",
        "summary",
        "field",
        "field_status",
        "application_value",
        "label_value",
        "confidence",
        "explanation",
        "extraction_summary",
        "image_quality_notes"
      ],
      ...results.flatMap((result) =>
        result.fields.map((field) => [
          exportedAt,
          result.fileName,
          applicationCsvName,
          result.overallStatus,
          String(result.elapsedMs),
          result.summary,
          field.label,
          fieldStatusText(field.status),
          field.expected,
          field.extracted,
          String(field.confidence),
          field.explanation,
          result.extracted.extractionSummary,
          result.extracted.imageQualityNotes.join("; ")
        ])
      )
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    downloadFile("ttb-label-verification-results.csv", csv, "text/csv");
  }

  function exportReport() {
    const text = results
      .map(
        (result) =>
          `${result.fileName}\nStatus: ${statusText(result.overallStatus)}\nElapsed: ${result.elapsedMs}ms\n${result.summary}\n\n${result.fields
            .map(
              (field) =>
                `${field.label}: ${fieldStatusText(field.status).toUpperCase()}\nExpected: ${field.expected || "(blank)"}\nExtracted: ${field.extracted || "(not detected)"}\nConfidence: ${Math.round(field.confidence * 100)}%\nReason: ${field.explanation}`
            )
            .join("\n\n")}`
      )
      .join("\n\n---\n\n");
    downloadFile("ttb-label-verification-report.txt", text, "text/plain");
  }

  return (
    <main className="shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Treasury prototype</p>
          <h1>TTB Alcohol Label Verification</h1>
        </div>
        <div className="status-strip" aria-label="Batch status">
          <span>{batchStats.total} uploaded</span>
          <span>{batchStats.processed} processed</span>
          <strong>{batchStats.needAction} need action</strong>
        </div>
      </section>

      <section className={`workspace ${hasAnalyzedLabel ? "with-application" : ""}`}>
        <section className="main-panel">
          <div
            className="dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              addFiles(event.dataTransfer.files);
            }}
          >
            <UploadCloud aria-hidden="true" />
            <div>
              <h2>Upload label images</h2>
              <p>Drop single or batch label images here.</p>
            </div>
            <label className="primary file-button">
              Choose images
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => event.target.files && addFiles(event.target.files)}
              />
            </label>
          </div>

          <div className="action-row">
            <button type="button" className="primary" disabled={!files.length || isProcessing} onClick={analyze}>
              {isProcessing ? <Loader2 className="spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
              Analyze labels
            </button>
            <button type="button" className="secondary" disabled={!results.length} onClick={exportReport}>
              <FileText aria-hidden="true" />
              Report
            </button>
            <button type="button" className="secondary icon-only" disabled={!results.length} onClick={exportJson} aria-label="Export JSON">
              <FileJson aria-hidden="true" />
            </button>
            <button type="button" className="secondary icon-only" disabled={!results.length} onClick={exportCsv} aria-label="Export CSV">
              <Download aria-hidden="true" />
            </button>
          </div>

          <div className="batch-grid">
            {files.map((queued) => (
              <button
                type="button"
                key={queued.id}
                className={`batch-item ${activeFile?.id === queued.id ? "active" : ""}`}
                onClick={() => setActiveId(queued.id)}
              >
                <img src={queued.previewUrl} alt="" />
                <span>{queued.file.name}</span>
                <strong className={queued.error ? "fail" : queued.result?.overallStatus ?? "pending"}>
                  {queued.error ? "Error" : queued.result ? statusText(queued.result.overallStatus) : "Queued"}
                </strong>
              </button>
            ))}
          </div>

          {activeFile ? (
            <section className="comparison" aria-label="Side-by-side comparison">
              <div className="image-preview">
                <img src={activeFile.previewUrl} alt={`Uploaded label ${activeFile.file.name}`} />
              </div>
              <div className="results-panel">
                {activeFile.error ? <p className="error">{activeFile.error}</p> : null}
                {activeFile.result ? (
                  <>
                    <div className={`result-banner ${activeFile.result.overallStatus}`}>
                      <strong>{statusText(activeFile.result.overallStatus)}</strong>
                      <span>{activeFile.result.summary}</span>
                      <em>{activeFile.result.elapsedMs}ms</em>
                    </div>
                    <div className="field-results">
                      {activeFile.result.fields.map((field) => (
                        <details
                          key={field.key}
                          open={field.status === "warning" || field.status === "fail" || field.status === "missing"}
                        >
                          <summary className={field.status}>
                            {statusIcon(field.status)}
                            <span>{field.label}</span>
                            <strong>{fieldStatusText(field.status)}</strong>
                          </summary>
                          <div className="field-comparison">
                            <div>
                              <span>Application</span>
                              <p>{field.expected || "Not provided"}</p>
                            </div>
                            <div>
                              <span>Label</span>
                              <p>{field.extracted || "Not detected"}</p>
                            </div>
                          </div>
                          <p className="explain">{field.explanation}</p>
                          <div className="confidence-row">
                            <span>Confidence: {Math.round(field.confidence * 100)}%</span>
                            <meter min="0" max="1" value={field.confidence} />
                          </div>
                        </details>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="empty-state">Run analysis to see matches, mismatches, confidence, and explanations.</div>
                )}
              </div>
            </section>
          ) : (
            <section className="empty-state large">Upload one or more label images to begin.</section>
          )}
        </section>

        {hasAnalyzedLabel ? (
          <aside className="panel application-panel" aria-label="Expected application data">
            <div className="panel-heading">
              <h2>Expected application data</h2>
              <button type="button" className="secondary" onClick={() => applyApplication(blankApplicationData())}>
                Clear
              </button>
            </div>

            <div className="application-import">
              <label className="secondary file-button">
                Import CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void importApplicationCsv(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                className="secondary"
                disabled={!matchingApplicationRecord}
                onClick={loadMatchingApplication}
              >
                Load matching row
              </button>
            </div>

            {applicationCsvName ? (
              <p className="helper-text">
                {applicationRecords.length} application rows loaded from {applicationCsvName}.
              </p>
            ) : (
              <p className="helper-text">
                Import a CSV with one row per label image, then load the row matching the selected file name.
              </p>
            )}
            {activeFile && applicationRecords.length > 0 && !matchingApplicationRecord ? (
              <p className="error compact">No application row matches {activeFile.file.name}.</p>
            ) : null}
            {applicationCsvError ? <p className="error compact">{applicationCsvError}</p> : null}

            <div className="field-grid">
              {fieldOrder.map((key) => (
                <label key={key}>
                  <span>{FIELD_LABELS[key]}</span>
                  {key === "governmentWarning" ? (
                    <textarea
                      value={application[key]}
                      onChange={(event) => updateApplicationField(key, event.target.value)}
                    />
                  ) : (
                    <input
                      value={application[key]}
                      onChange={(event) => updateApplicationField(key, event.target.value)}
                    />
                  )}
                </label>
              ))}
            </div>
          </aside>
        ) : null}
      </section>
    </main>
  );
}
