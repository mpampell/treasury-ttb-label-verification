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
import type { AnalysisResult, ApplicationData, FieldStatus } from "@/lib/types";
import { blankApplicationData, FIELD_LABELS, WARNING_TEXT } from "@/lib/validation";

type QueuedFile = {
  id: string;
  file: File;
  previewUrl: string;
  result?: AnalysisResult;
  error?: string;
};

const fieldOrder = Object.keys(FIELD_LABELS) as Array<keyof ApplicationData>;

function statusIcon(status: FieldStatus) {
  if (status === "match") return <CheckCircle2 aria-hidden="true" />;
  if (status === "warning") return <AlertTriangle aria-hidden="true" />;
  return <XCircle aria-hidden="true" />;
}

function statusText(status: string) {
  if (status === "pass") return "Pass";
  if (status === "review") return "Review";
  if (status === "fail") return "Fail";
  return status;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
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

export default function Home() {
  const [application, setApplication] = useState<ApplicationData>(blankApplicationData());
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const activeFile = files.find((file) => file.id === activeId) ?? files[0];
  const results = files.map((file) => file.result).filter(Boolean) as AnalysisResult[];
  const batchStats = useMemo(
    () => ({
      total: files.length,
      processed: results.length,
      pass: results.filter((result) => result.overallStatus === "pass").length,
      review: results.filter((result) => result.overallStatus === "review").length,
      fail: results.filter((result) => result.overallStatus === "fail").length
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

  async function analyze() {
    if (!files.length) return;
    setIsProcessing(true);

    for (const queued of files) {
      if (queued.result) continue;

      try {
        const imageDataUrl = await fileToDataUrl(queued.file);
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: queued.file.name,
            imageDataUrl,
            application,
            demoMode
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
      JSON.stringify({ application, results }, null, 2),
      "application/json"
    );
  }

  function exportCsv() {
    const rows = [
      ["file", "overall_status", "field", "field_status", "expected", "extracted", "confidence"],
      ...results.flatMap((result) =>
        result.fields.map((field) => [
          result.fileName,
          result.overallStatus,
          field.label,
          field.status,
          field.expected,
          field.extracted,
          String(field.confidence)
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
                `${field.label}: ${field.status.toUpperCase()}\nExpected: ${field.expected || "(blank)"}\nExtracted: ${field.extracted || "(not detected)"}\nReason: ${field.explanation}`
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
          <strong>{batchStats.fail} need action</strong>
        </div>
      </section>

      <section className="workspace">
        <aside className="panel application-panel" aria-label="Application data">
          <div className="panel-heading">
            <h2>Application data</h2>
            <button type="button" className="secondary" onClick={() => setApplication(blankApplicationData())}>
              Reset sample
            </button>
          </div>
          <div className="field-grid">
            {fieldOrder.map((key) => (
              <label key={key}>
                <span>{FIELD_LABELS[key]}</span>
                {key === "governmentWarning" ? (
                  <textarea
                    value={application[key] || WARNING_TEXT}
                    onChange={(event) =>
                      setApplication((current) => ({ ...current, [key]: event.target.value }))
                    }
                  />
                ) : (
                  <input
                    value={application[key]}
                    onChange={(event) =>
                      setApplication((current) => ({ ...current, [key]: event.target.value }))
                    }
                  />
                )}
              </label>
            ))}
          </div>
        </aside>

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
            <label className="toggle">
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(event) => setDemoMode(event.target.checked)}
              />
              Demo extraction
            </label>
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
                <strong className={queued.result?.overallStatus || queued.error ? "fail" : "pending"}>
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
                        <details key={field.key} open={field.status !== "match"}>
                          <summary className={field.status}>
                            {statusIcon(field.status)}
                            <span>{field.label}</span>
                            <strong>{field.status}</strong>
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
                          <meter min="0" max="1" value={field.confidence} />
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
      </section>
    </main>
  );
}
