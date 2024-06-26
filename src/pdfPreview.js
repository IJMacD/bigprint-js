import jsPDF from "jspdf";
import PDFObject from "pdfobject";
import { tiler } from "./tiler";

const DEBUG = false;
const GRID_SIZE = 50;

/**
 * @param {HTMLImageElement | HTMLCanvasElement | import("jspdf").RGBAData} image
 * @param {number} dpi
 * @param {{ label?: string; width: any; height: any; }} paper
 * @param {number} overlap
 * @param {import("./App").GridPlacement} gridPlacement
 * @param {import("./App").OverlapPosition} overlapPosition
 * @param {import("./App").OverlapStyle} overlapStyle
 * @param {string} output
 */
export function pdfPreview(image, dpi, paper, overlap, gridPlacement, overlapPosition, overlapStyle, output) {

  const spec = tiler(image.width, image.height, dpi, paper, overlap);

  const format = [paper.width, paper.height];
  const orientation = paper.width < paper.height ? "p" : "l";

  const doc = new jsPDF({
    format,
    orientation,
    unit: "mm",
  });

  for (let j = 0; j < spec.vSheets; j++) {
    for (let i = 0; i < spec.hSheets; i++) {
      const offsetX = i * spec.paperWidthWithOverlap;
      const offsetY = j * spec.paperHeightWithOverlap;

      if (i > 0 || j > 0) {
        doc.addPage(format, orientation);
      }

      doc.addImage(image, "JPEG", -offsetX, -offsetY, spec.widthMM, spec.heightMM);

      /*
        * Overlap Borders
        */
      if (overlapPosition !== "None") {
        doc.setDrawColor("#000000");

        if (overlapStyle === "Dashed") {
          doc.setLineWidth(0.5);
          doc.setLineDashPattern([10], 1);
        }

        if (overlapPosition === "Both" || overlapPosition === "NW" || overlapPosition === "SW") {
          // Left Edge
          if (i > 0) {
            doc.line(overlap, 0, overlap, paper.height);
          }
        }

        if (overlapPosition === "Both" || overlapPosition === "NE" || overlapPosition === "NW") {
          // Top Edge
          if (j > 0) {
            doc.line(0, overlap, paper.width, overlap);
          }
        }

        if (overlapPosition === "Both" || overlapPosition === "NE" || overlapPosition === "SE") {
          // Right Edge
          if (i < spec.hSheets - 1) {
            doc.line(paper.width - overlap, 0, paper.width - overlap, paper.height);
          }
        }

        if (overlapPosition === "Both" || overlapPosition === "SE" || overlapPosition === "SW") {
          // Bottom Edge
          if (j < spec.vSheets - 1) {
            doc.line(0, paper.height - overlap, paper.width, paper.height - overlap);
          }
        }
      }

      /*
        * Alignment Grid Lines
        */

      if (gridPlacement !== "None") {
        if (gridPlacement === "Back") {
          doc.addPage(format, orientation);
        }

        doc.setDrawColor("#008000");
        doc.setLineWidth(0.25);
        doc.setLineDashPattern([], 0);

        const max = paper.width + paper.height + GRID_SIZE * 2;

        // Grid aligned below page
        const datumY2 = GRID_SIZE * (Math.floor((offsetY + paper.height) / GRID_SIZE) + 1);
        // Grid aligned above page
        const datumY1 = GRID_SIZE * Math.floor(offsetY / GRID_SIZE);
        // Grid aligned to left of page
        const datumX = GRID_SIZE * Math.floor(offsetX / GRID_SIZE);

        // Datum values relative to page
        const x = datumX - offsetX;
        const y1 = datumY1 - offsetY;
        const y2 = datumY2 - offsetY;

        for (let t = GRID_SIZE; t < max; t += GRID_SIZE) {
          // SW-NE
          doc.line(x, y1 + t, x + t, y1);

          // NW-SE
          doc.line(x, y2 - t, x + t, y2);
        }

        if (DEBUG) {
          doc.text(`Page Offset: (${offsetX},${offsetY})`, 10, 24);
          doc.text(`Page Size: (${paper.width},${paper.height})`, 10, 32);
          doc.text(`Grid Datum: (${datumX},${datumY1}), (${datumX},${datumY2})`, 10, 40);
          doc.text(`Relative Datum: (${x},${y1}), (${x},${y2})`, 10, 48);
          doc.text(`Grid Max: ${max}`, 10, 56);
        }
      }
    }
  }

  const blobURL = doc.output("bloburl");
  PDFObject.embed(blobURL.toString(), output);
}