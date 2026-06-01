/**
 * exportHelpers.js
 * Generates and triggers download of monthly reports as PDF or Excel (.xlsx).
 *
 * PDF   — built with jsPDF + jspdf-autotable, styled to match the active theme.
 * Excel — built with ExcelJS (replaces xlsx — actively maintained, zero known CVEs).
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { formatReportDate, formatMonthLabel } from "./dateHelpers";
import { THEMES } from "@/themes/themes";

/**
 * Compute report totals from an array of entries.
 * @param {object[]} entries
 * @returns {{ totalHours: number, uniqueBS: string[], daysOut: number }}
 */
function computeTotals(entries) {
  const allNames = entries.flatMap((e) => e.bibleStudies ?? []);
  const uniqueBS = [...new Set(allNames)];
  const totalHours = entries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0);
  return { totalHours, uniqueBS, daysOut: entries.length };
}

/**
 * Build table rows shared by both export formats.
 * @param {object[]} entries
 * @returns {string[][]}
 */
function buildRows(entries) {
  return [...entries].reverse().map((e) => [
    formatReportDate(e.date),
    `${parseFloat(e.hours).toFixed(1)}h`,
    String(e.bibleStudies?.length ?? 0),
    (e.bibleStudies ?? []).join(", ") || "—",
  ]);
}

/* ─── PDF EXPORT ────────────────────────────────────────────────────────────── */

/**
 * Generate and download a styled PDF report.
 * @param {object[]} entries
 * @param {string}   monthKey
 * @param {string}   userName
 * @param {string}   themeId
 * @param {{status:"publisher"|"auxiliary"|"regular", goalHours:number}|null} monthStatus
 */
export function exportPDF(entries, monthKey, userName, themeId, monthStatus) {
  const theme      = THEMES[themeId] ?? THEMES.sunrise;
  const monthLabel = formatMonthLabel(monthKey);
  const { totalHours, uniqueBS, daysOut } = computeTotals(entries);
  const isPublisher = monthStatus?.status === "publisher";
  const goalHours = monthStatus?.goalHours ?? 0;
  const rows = isPublisher ? buildRowsPublisher(entries) : buildRows(entries);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const primaryRGB = hexToRGB(theme.primary);
  const accentRGB  = hexToRGB(theme.accent);
  const softRGB    = hexToRGB(theme.soft);

  // Header block
  doc.setFillColor(...primaryRGB);
  doc.rect(0, 0, 210, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("TALLY", 14, 14);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Field Service Report — ${monthLabel}`, 14, 22);
  doc.text(`Publisher: ${userName}`, 14, 29);

  // Summary row
  const summaryY = 44;
  const summaries = isPublisher
    ? [
        { label: "Bible Studies", value: String(uniqueBS.length) },
        { label: "Days Out", value: String(daysOut) },
      ]
    : [
        { label: "Total Hours", value: totalHours.toFixed(1) },
        { label: "Bible Studies", value: String(uniqueBS.length) },
        { label: "Days Out", value: String(daysOut) },
      ];
  summaries.forEach(({ label, value }, i) => {
    const x = 14 + i * 62;
    doc.setFillColor(...softRGB);
    doc.roundedRect(x, summaryY, 58, 20, 3, 3, "F");
    doc.setTextColor(...accentRGB);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(value, x + 29, summaryY + 11, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(label.toUpperCase(), x + 29, summaryY + 17, { align: "center" });
  });

  if (!isPublisher && goalHours > 0) {
    doc.setTextColor(...accentRGB);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Goal: ${goalHours}h`, 14, summaryY + 26);
  }

  // Main table
  autoTable(doc, {
    startY: summaryY + 28,
    head: [
      isPublisher ? ["Date", "Bible Studies", "Names"] : ["Date", "Hours", "BS Count", "Bible Study Names"],
    ],
    body: rows,
    foot: [
      isPublisher
        ? ["TOTAL", String(uniqueBS.length), uniqueBS.join(", ") || "—"]
        : ["TOTAL", `${totalHours.toFixed(1)}h`, String(uniqueBS.length), uniqueBS.join(", ") || "—"],
    ],
    headStyles: { fillColor: primaryRGB, textColor: [255,255,255], fontStyle: "bold", fontSize: 10 },
    footStyles: { fillColor: softRGB, textColor: accentRGB, fontStyle: "bold", fontSize: 10 },
    alternateRowStyles: { fillColor: [250,250,252] },
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      ...(isPublisher
        ? {
            0: { cellWidth: 35 },
            1: { cellWidth: 28, halign: "center" },
            2: { cellWidth: "auto" },
          }
        : {
            0: { cellWidth: 35 },
            1: { cellWidth: 20, halign: "center" },
            2: { cellWidth: 20, halign: "center" },
            3: { cellWidth: "auto" },
          }),
    },
  });

  // Footer
  const pageH = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Generated by Tally on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
    14, pageH - 10
  );

  doc.save(`Tally_${userName}_${monthLabel}.pdf`);
}

/* ─── EXCEL EXPORT ──────────────────────────────────────────────────────────── */

/**
 * Generate and download an .xlsx Excel report using ExcelJS.
 * Fully styled with column widths, bold headers, and a totals row.
 *
 * @param {object[]} entries
 * @param {string}   monthKey
 * @param {string}   userName
 * @param {string}   themeId
 * @param {{status:"publisher"|"auxiliary"|"regular", goalHours:number}|null} monthStatus
 */
export async function exportExcel(entries, monthKey, userName, themeId, monthStatus) {
  const theme      = THEMES[themeId] ?? THEMES.sunrise;
  const monthLabel = formatMonthLabel(monthKey);
  const { totalHours, uniqueBS, daysOut } = computeTotals(entries);
  const primaryHex = theme.primary.replace("#", "FF");
  const softHex    = theme.soft.replace("#", "FF");
  const accentHex  = theme.accent.replace("#", "FF");
  const isPublisher = monthStatus?.status === "publisher";
  const goalHours = monthStatus?.goalHours ?? 0;

  const workbook  = new ExcelJS.Workbook();
  workbook.creator  = "Tally App";
  workbook.created  = new Date();

  const sheet = workbook.addWorksheet(monthLabel);

  // ── Column definitions ──────────────────────────────────────
  sheet.columns = isPublisher
    ? [
        { key: "date", width: 18 },
        { key: "bs", width: 14 },
        { key: "names", width: 50 },
      ]
    : [
        { key: "date", width: 18 },
        { key: "hours", width: 10 },
        { key: "bs", width: 14 },
        { key: "names", width: 42 },
      ];

  // ── Title rows ──────────────────────────────────────────────
  sheet.mergeCells(isPublisher ? "A1:C1" : "A1:D1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = "Tally — Field Service Report";
  titleCell.font  = { bold: true, size: 16, color: { argb: primaryHex } };
  titleCell.alignment = { horizontal: "left" };

  sheet.mergeCells(isPublisher ? "A2:C2" : "A2:D2");
  const subCell = sheet.getCell("A2");
  subCell.value = `${monthLabel} — ${userName}`;
  subCell.font  = { size: 11, color: { argb: accentHex } };

  sheet.addRow([]); // spacer

  // ── Summary row ─────────────────────────────────────────────
  const summaryRow = sheet.addRow(
    isPublisher ? ["Bible Studies", "Days Out", ""] : ["Total Hours", "Bible Studies", "Days Out", ""]
  );
  summaryRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: { argb: accentHex } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: softHex } };
    cell.alignment = { horizontal: "center" };
  });

  const valuesRow = sheet.addRow(
    isPublisher ? [uniqueBS.length, daysOut, ""] : [totalHours.toFixed(1), uniqueBS.length, daysOut, ""]
  );
  valuesRow.eachCell((cell, col) => {
    if (col <= (isPublisher ? 2 : 3)) {
      cell.font      = { bold: true, size: 14, color: { argb: primaryHex } };
      cell.alignment = { horizontal: "center" };
    }
  });

  if (!isPublisher && goalHours > 0) {
    sheet.addRow(["Goal", goalHours, "", ""]);
  }

  sheet.addRow([]); // spacer

  // ── Table header ─────────────────────────────────────────────
  const headerRow = sheet.addRow(
    isPublisher ? ["Date", "Bible Studies", "Names"] : ["Date", "Hours", "Bible Studies", "Names"]
  );
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: primaryHex } };
    cell.alignment = { horizontal: "left" };
    cell.border = { bottom: { style: "thin", color: { argb: "FFFFFFFF" } } };
  });

  // ── Data rows ────────────────────────────────────────────────
  const sorted = [...entries].reverse();
  sorted.forEach((e, i) => {
    const row = sheet.addRow(
      isPublisher
        ? [
            formatReportDate(e.date),
            e.bibleStudies?.length ?? 0,
            (e.bibleStudies ?? []).join(", ") || "—",
          ]
        : [
            formatReportDate(e.date),
            `${parseFloat(e.hours).toFixed(1)}h`,
            e.bibleStudies?.length ?? 0,
            (e.bibleStudies ?? []).join(", ") || "—",
          ]
    );
    if (i % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9F9F9" } };
      });
    }
    row.getCell(1).font = { bold: true };
    if (!isPublisher) row.getCell(2).font = { color: { argb: primaryHex }, bold: true };
  });

  // ── Totals row ───────────────────────────────────────────────
  const totalsRow = sheet.addRow(
    isPublisher
      ? ["TOTAL", String(uniqueBS.length), uniqueBS.join(", ") || "—"]
      : ["TOTAL", `${totalHours.toFixed(1)}h`, String(uniqueBS.length), uniqueBS.join(", ") || "—"]
  );
  totalsRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: accentHex } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: softHex } };
    cell.border = { top: { style: "thin", color: { argb: accentHex } } };
  });

  // ── Generate and download ────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = `Tally_${userName}_${monthLabel}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── INTERNAL HELPERS ──────────────────────────────────────────────────────── */

/**
 * Convert a CSS hex color to [R, G, B] array for jsPDF.
 * @param {string} hex
 * @returns {[number, number, number]}
 */
function hexToRGB(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function buildRowsPublisher(entries) {
  return [...entries].reverse().map((e) => [
    formatReportDate(e.date),
    String(e.bibleStudies?.length ?? 0),
    (e.bibleStudies ?? []).join(", ") || "—",
  ]);
}
