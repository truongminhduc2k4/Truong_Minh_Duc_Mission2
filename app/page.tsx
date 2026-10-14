"use client";

import { type FormEvent, useState } from "react";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

type ResearchSource = {
  title: string;
  url: string;
  content: string;
  published_date?: string;
};

type ResearchReport = {
  summary: string;
  findings: { claim: string; source_ids: number[] }[];
  implications: string[];
  limitations: string[];
};

type ResearchResponse = {
  report: ResearchReport;
  sources: ResearchSource[];
};

const suggestions = [
  "Xu hướng game mobile tại Việt Nam trong năm nay",
  "Cơ hội cho game indie trên Steam ở Đông Nam Á",
  "Mô hình kiếm tiền nào đang hiệu quả với game free-to-play?",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isResearchResponse(value: unknown): value is ResearchResponse {
  if (!isRecord(value) || !isRecord(value.report)) {
    return false;
  }

  const sources = value.sources;
  if (!Array.isArray(sources)) {
    return false;
  }

  const report = value.report;
  return (
    typeof report.summary === "string" &&
    Array.isArray(report.findings) &&
    report.findings.every(
      (finding) =>
        isRecord(finding) &&
        typeof finding.claim === "string" &&
        Array.isArray(finding.source_ids) &&
        finding.source_ids.every(
          (id) => Number.isInteger(id) && id >= 1 && id <= sources.length,
        ),
    ) &&
    isStringArray(report.implications) &&
    isStringArray(report.limitations) &&
    sources.every(
      (source) =>
        isRecord(source) &&
        typeof source.title === "string" &&
        typeof source.url === "string" &&
        isSecureUrl(source.url) &&
        typeof source.content === "string" &&
        (source.published_date === undefined ||
          typeof source.published_date === "string"),
    )
  );
}

function isSecureUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [geography, setGeography] = useState("");
  const [period, setPeriod] = useState("");
  const [result, setResult] = useState<ResearchResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportError, setExportError] = useState("");

  async function downloadReportPdf() {
    if (!result || exportingPdf) {
      return;
    }

    setExportingPdf(true);
    setExportError("");

    try {
      const [pdfMake, pdfFontsModule] = await Promise.all([
        import("pdfmake/build/pdfmake"),
        import("pdfmake/build/vfs_fonts"),
      ]);
      const pdfFonts = pdfFontsModule.default;
      pdfMake.addVirtualFileSystem(pdfFonts);

      const content: TDocumentDefinitions["content"] = [
        { text: "GAMESCOPE RESEARCH", style: "brand" },
        { text: "Kết quả nghiên cứu", style: "title" },
        { text: question.trim(), style: "question" },
        ...(geography.trim()
          ? [{ text: `Thị trường: ${geography.trim()}`, style: "metadata" }]
          : []),
        ...(period.trim()
          ? [{ text: `Thời gian: ${period.trim()}`, style: "metadata" }]
          : []),
        {
          text: `Ngày xuất: ${new Intl.DateTimeFormat("vi-VN", {
            dateStyle: "long",
          }).format(new Date())}`,
          style: "metadata",
          margin: [0, 0, 0, 14],
        },
        { text: "Tóm tắt", style: "sectionHeader" },
        { text: result.report.summary, style: "body" },
        { text: "Phát hiện chính", style: "sectionHeader" },
        ...(result.report.findings.length > 0
          ? [
              {
                ol: result.report.findings.map((finding) => ({
                  text: [
                    { text: finding.claim },
                    ...finding.source_ids.map((sourceId) => ({
                      text: ` [${sourceId}]`,
                      link: result.sources[sourceId - 1].url,
                      color: "#2b725a",
                    })),
                  ],
                  margin: 7,
                })),
                style: "body",
              },
            ]
          : [{ text: "Chưa có phát hiện đủ bằng chứng.", style: "body" }]),
        { text: "Hàm ý thị trường", style: "sectionHeader" },
        {
          ul: result.report.implications,
          style: "body",
        },
        { text: "Giới hạn dữ liệu", style: "sectionHeader" },
        {
          ul: result.report.limitations,
          style: "body",
        },
        { text: "Nguồn tham khảo", style: "sectionHeader" },
        ...result.sources.map((source, index) => ({
          stack: [
            {
              text: `[${index + 1}] ${source.title}`,
              link: source.url,
              color: "#205d48",
              bold: true,
            },
            ...(source.published_date
              ? [{ text: source.published_date, style: "metadata" }]
              : []),
            { text: source.url, link: source.url, style: "sourceUrl" },
          ],
          margin: 9,
        })),
      ];

      const document: TDocumentDefinitions = {
        content,
        defaultStyle: {
          font: "Roboto",
          fontSize: 10,
          color: "#39473f",
          lineHeight: 1.35,
        },
        pageSize: "A4",
        pageMargins: [48, 48, 48, 48],
        info: {
          title: "GameScope - Ket qua nghien cuu",
          author: "GameScope Research",
          subject: question.trim(),
        },
        styles: {
          brand: {
            color: "#2b725a",
            fontSize: 9,
            bold: true,
            characterSpacing: 1.5,
            margin: [0, 0, 0, 10],
          },
          title: {
            color: "#17231f",
            fontSize: 23,
            bold: true,
            margin: [0, 0, 0, 14],
          },
          question: {
            color: "#17231f",
            fontSize: 13,
            bold: true,
            margin: [0, 0, 0, 8],
          },
          metadata: {
            color: "#68756f",
            fontSize: 9,
            margin: [0, 0, 0, 4],
          },
          sectionHeader: {
            color: "#205d48",
            fontSize: 11,
            bold: true,
            margin: [0, 15, 0, 7],
          },
          body: {
            margin: [0, 0, 0, 3],
          },
          sourceUrl: {
            color: "#68756f",
            fontSize: 8,
          },
        },
      };

      const pdfBlob = await pdfMake.createPdf(document).getBlob();
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = window.document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = `gamescope-research-${new Date().toISOString().slice(0, 10)}.pdf`;
      window.document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (pdfError) {
      console.error("Failed to export research report PDF:", pdfError);
      setExportError("Không thể tạo tệp PDF. Vui lòng thử tải lại.");
    } finally {
      setExportingPdf(false);
    }
  }

  async function runResearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, geography, period }),
      });
      const data: unknown = await response.json();

      if (!response.ok) {
        const message =
          isRecord(data) && typeof data.error === "string"
            ? data.error
            : "Đã xảy ra lỗi khi nghiên cứu.";
        throw new Error(message);
      }

      if (!isResearchResponse(data)) {
        throw new Error("Máy chủ trả về báo cáo không đúng định dạng.");
      }
      setResult(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể kết nối tới máy chủ. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="GameScope trang chủ">
          <span className="brand-mark" aria-hidden="true">
            G
          </span>
          <span>gamescope</span>
          <span className="brand-label">RESEARCH</span>
        </a>
        <div className="topbar-note">
          <span className="status-dot" />
          AI research workspace
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow">
          <span className="eyebrow-line" />
          MARKET INTELLIGENCE, MADE CLEAR
        </div>
        <h1>
          Tìm hiểu thị trường.
          <br />
          <span>Ra quyết định tự tin.</span>
        </h1>
        <p className="hero-copy">
          Đặt câu hỏi về ngành game. Nhận phân tích cô đọng, dựa trên nguồn web
          có thể kiểm chứng.
        </p>
      </section>

      <section className="workspace" aria-label="Nghiên cứu thị trường game">
        <form className="research-card" onSubmit={runResearch}>
          <div className="card-heading">
            <div>
              <div className="step-label">
                <span>01</span> / YOUR RESEARCH QUESTION
              </div>
              <h2>Bạn muốn khám phá điều gì?</h2>
            </div>
            <span className="sparkle" aria-hidden="true">
              ✳
            </span>
          </div>

          <label className="sr-only" htmlFor="question">
            Câu hỏi nghiên cứu
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ví dụ: Cơ hội nào cho game mobile free-to-play tại Việt Nam?"
            maxLength={1000}
            required
            minLength={8}
            rows={3}
          />

          <div className="filters">
            <label className="filter-field">
              <span>THỊ TRƯỜNG</span>
              <input
                value={geography}
                onChange={(event) => setGeography(event.target.value)}
                placeholder="Ví dụ: Việt Nam"
                maxLength={100}
              />
            </label>
            <label className="filter-field">
              <span>THỜI GIAN</span>
              <input
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                placeholder="Ví dụ: 2024–2026"
                maxLength={100}
              />
            </label>
          </div>

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          <div className="form-footer">
            <p>
              <span className="lock-icon" aria-hidden="true">
                ◈
              </span>
              Báo cáo có dẫn nguồn, không chỉ là câu trả lời AI.
            </p>
            <button
              className="submit-button"
              type="submit"
              disabled={loading || question.trim().length < 8}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Đang nghiên cứu...
                </>
              ) : (
                <>
                  Tạo báo cáo <span aria-hidden="true">↗</span>
                </>
              )}
            </button>
          </div>
        </form>

        {!result && !loading && (
          <div className="suggestions">
            <span className="suggestions-label">GỢI Ý KHÁM PHÁ</span>
            <div className="suggestion-list">
              {suggestions.map((suggestion) => (
                <button
                  className="suggestion-chip"
                  key={suggestion}
                  type="button"
                  onClick={() => setQuestion(suggestion)}
                >
                  {suggestion} <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-state" aria-live="polite">
            <span className="spinner spinner-dark" />
            <div>
              <strong>Đang tổng hợp góc nhìn thị trường</strong>
              <p>Tìm nguồn đáng tin cậy và đối chiếu các phát hiện...</p>
            </div>
          </div>
        )}

        {result && (
          <section className="report" aria-live="polite">
            <div className="report-header">
              <div>
                <div className="step-label">
                  <span>02</span> / RESEARCH BRIEF
                </div>
                <h2>Kết quả nghiên cứu</h2>
              </div>
              <div className="report-actions">
                <span className="source-count">
                  {result.sources.length} nguồn tham khảo
                </span>
                <button
                  className="report-export-button"
                  type="button"
                  onClick={downloadReportPdf}
                  disabled={exportingPdf}
                  aria-label="Xuất kết quả nghiên cứu sang PDF"
                >
                  {exportingPdf ? "Đang tạo PDF..." : "Tải PDF"}
                </button>
                <span className="export-hint">
                  Tải báo cáo, trích dẫn và nguồn về máy.
                </span>
              </div>
            </div>
            {exportError && (
              <p className="export-error" role="alert">
                {exportError}
              </p>
            )}

            <div className="report-section summary-section">
              <h3>Tóm tắt</h3>
              <p>{result.report.summary}</p>
            </div>

            <div className="report-section">
              <h3>Phát hiện chính</h3>
              <ol className="finding-list">
                {result.report.findings.map((finding, index) => (
                  <li key={`${finding.claim}-${index}`}>
                    <p>{finding.claim}</p>
                    {finding.source_ids.length > 0 && (
                      <div className="citation-list" aria-label="Nguồn cho phát hiện">
                        {finding.source_ids.map((sourceId) => (
                          <a
                            key={sourceId}
                            href={result.sources[sourceId - 1]?.url}
                            target="_blank"
                            rel="noreferrer"
                            className="citation"
                          >
                            [{sourceId}]
                          </a>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            <div className="report-columns">
              <div className="report-section">
                <h3>Hàm ý thị trường</h3>
                <ul>
                  {result.report.implications.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="report-section caveat-section">
                <h3>Giới hạn dữ liệu</h3>
                <ul>
                  {result.report.limitations.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="report-section sources-section">
              <h3>Nguồn tham khảo</h3>
              <ol className="sources-list">
                {result.sources.map((source, index) => (
                  <li key={`${source.url}-${index}`}>
                    <span className="source-number">[{index + 1}]</span>
                    <div>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.title}
                      </a>
                      {source.published_date && (
                        <span className="source-date">
                          {source.published_date}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}
      </section>

      <footer className="page-footer">
        <span>GAMESCOPE RESEARCH</span>
        <span>Evidence first. Better decisions.</span>
      </footer>
    </main>
  );
}
