"use client";

import React, { useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SummaryPoint } from "@/types";
import { EditorDialog } from "@/components/ui/editor-dialog";
import { cn } from "@/lib/utils";
// PDF generation
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
// 

function getCategoryFullName(category: string): string {
  const categoryMap: Record<string, string> = {
    "S": "Subjective",
    "O": "Objective", 
    "A": "Assessment",
    "P": "Plan"
  };
  
  return categoryMap[category.toUpperCase()] || category;
}

interface InsightsPanelProps {
  summary: SummaryPoint[];
  onSummaryPointClick: (summaryPoint: SummaryPoint) => void;
  onSummaryEdit?: (pointId: string, newContent: string) => void;
  activePointId?: string;
}

export function InsightsPanel({
  summary,
  onSummaryPointClick,
  onSummaryEdit,
  activePointId,
}: InsightsPanelProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Group summary points by category
  const summaryByCategory = summary.reduce<Record<string, SummaryPoint[]>>(
    (acc, point) => {
      if (!acc[point.category]) {
        acc[point.category] = [];
      }
      acc[point.category].push(point);
      return acc;
    },
    {}
  );

  // Export to PDF handler
  // const handleExportPDF = () => {
  //   const doc = new jsPDF();
  //   let y = 10;

  //   doc.setFontSize(18);
  //   doc.text("Consultation Summary", 10, y);
  //   y += 10;

  //   Object.entries(summaryByCategory).forEach(([category, points]) => {
  //     doc.setFontSize(14);
  //     doc.text(category, 10, y);
  //     y += 8;
  //     doc.setFontSize(12);
  //     points.forEach((point) => {
  //       doc.text(`- ${point.text.replace(/<[^>]+>/g, "")}`, 14, y);
  //       y += 7;
  //     });
  //     y += 4;
  //   });

  //   doc.save("summary.pdf");
  // };

  // const handleExportPDF = () => {
  //   const doc = new jsPDF();

  //   doc.setFontSize(18);
  //   doc.text("Consultation Summary", 14, 16);

  //   let y = 26;

  //   Object.entries(summaryByCategory).forEach(([category, points]) => {
  //     doc.setFontSize(14);
  //     doc.text(category.charAt(0).toUpperCase() + category.slice(1), 14, y);

  //     autoTable(doc, {
  //       startY: y + 4,
  //       head: [["Summary"]],
  //       body: points.map((point) => [point.text.replace(/<[^>]+>/g, "")]),
  //       theme: "striped",
  //       styles: { fontSize: 11, cellPadding: 3 },
  //       headStyles: { fillColor: [41, 128, 185] },
  //       margin: { left: 14, right: 14 },
  //     });

  //     y = doc.lastAutoTable.finalY + 10;
  //   });

  //   doc.save("summary.pdf");
  // };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(25);
    doc.text("Consultation Summary", 14, 16);

    // Subtitle "SOAP Note"
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 140, 0); // Orange color (RGB)
    doc.text("SOAP Note", 14, 26);

    // Horizontal line under subtitle
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(1.0);
    doc.line(14, 32, 196, 32);

    // Reset text color to black for the rest of the doc
    doc.setTextColor(0, 0, 0);

    let y = 46;

    Object.entries(summaryByCategory).forEach(([category, points]) => {
      // Draw colored rectangle for section header
      const headerHeight = 10;
      doc.setFillColor(41, 128, 185); // Blue color
      doc.rect(14, y - 7, 182, headerHeight, "F"); // x, y, width, height, style

      // Set header text color to white and print category
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text(
        // category.charAt(0).toUpperCase() + category.slice(1),
        getCategoryFullName(category),
        16,
        y
      );

      // Reset text color for table
      doc.setTextColor(0, 0, 0);

      autoTable(doc, {
        startY: y + 4,
        // head: [["Summary"]],
        body: points.map((point) => [
          `• ${point.text.replace(/<[^>]+>/g, "")}`,
        ]),
        theme: "striped",
        styles: { fontSize: 11, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 14, right: 14 },
      });

      // Space after each section
      y = doc.lastAutoTable.finalY + 14;
    });

    doc.save("summary.pdf");
  };

  // Export to JSON handler
  const handleExportJSON = () => {
    const json = JSON.stringify(summary, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "summary.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Save
  // Helper: Convert summary array back to feverStomachSummary object format
  function summaryArrayToObject(summary: SummaryPoint[]) {
    const obj: Record<string, { info: string; utterance_ids: string[] }[]> = {};
    summary.forEach((point) => {
      const key = point.category.toLowerCase();
      if (!obj[key]) obj[key] = [];
      obj[key].push({
        info: point.text,
        utterance_ids: point.relatedSegmentIds.map((id) => {
          // Correct the mapping: segment-1 -> U2, segment-2 -> U3, etc.
          const match = id.match(/^segment-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            return `U${num - 1}`;
          }
          return id;
        }),
      });
    });
    return obj;
  }

  // Save as JSON handler
  const handleSaveJSON = () => {
    const summaryObj = summaryArrayToObject(summary);
    const jsonContent = JSON.stringify(summaryObj, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "edit_fever_stomach_summary.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold">SOAP Note</h2>
        <div className="flex space-x-2">
          {/* Export PDF */}
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
            onClick={handleExportPDF}
          >
            Export to PDF
          </button>
          {/* Export JSON */}
          <button
            className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700"
            onClick={handleExportJSON}
          >
            Export to JSON
          </button>
          {/* Save JSON */}
          <button
            className="px-3 py-1 rounded bg-orange-600 text-white text-sm hover:bg-orange-700"
            onClick={handleSaveJSON}
          >
            Save
          </button>
        </div>
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="space-y-6">
          {Object.entries(summaryByCategory).map(([category, points]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-2xl font-semibold text-gray-800">
                {/* {category} */}
                {getCategoryFullName(category)}
              </h3>
              <div className="space-y-2">
                {points.map((point) => (
                  <div
                    key={point.id}
                    className={cn(
                      "p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-all duration-200 group relative",
                      activePointId === point.id && "bg-blue-50 border-blue-200"
                    )}
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => onSummaryPointClick(point)}
                    >
                      <div
                        className="text-gray-700 pr-12 prose prose-sm max-w-none text-lg"
                        dangerouslySetInnerHTML={{ __html: point.text }}
                      />
                      {point.versions && point.versions.length > 1 && (
                        <div className="mt-2 text-xs text-gray-500">
                          Version {point.versions.length} • Edited
                        </div>
                      )}
                    </div>
                    {onSummaryEdit && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <EditorDialog
                          content={point.text}
                          onSave={(newContent) =>
                            onSummaryEdit(point.id, newContent)
                          }
                          title={`Edit ${point.category}`}
                          description="Edit this summary point. Your changes will create a new version while preserving the original."
                          triggerVariant="ghost"
                          triggerSize="sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
