import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [, , htmlPath, pdfPath, exportType = "pitch_deck"] = process.argv;

if (!htmlPath || !pdfPath) {
  console.error("Usage: node render-export-pdf.mjs <htmlPath> <pdfPath> <exportType>");
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.resolve(htmlPath)).toString(), {
    waitUntil: "networkidle",
  });
  await page.pdf({
    path: path.resolve(pdfPath),
    format: "A4",
    landscape: exportType === "pitch_deck",
    printBackground: true,
    margin: {
      top: "0mm",
      right: "0mm",
      bottom: "0mm",
      left: "0mm",
    },
  });
} finally {
  await browser.close();
}
