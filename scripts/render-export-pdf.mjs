import { access } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";

const [inputHtmlPath, outputPdfPath, deliverableType] = process.argv.slice(2);

if (!inputHtmlPath || !outputPdfPath || !deliverableType) {
  console.error(
    "Usage: node render-export-pdf.mjs <input-html-path> <output-pdf-path> <deliverable-type>",
  );
  process.exit(1);
}

await access(inputHtmlPath);

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(inputHtmlPath).href, {
    waitUntil: "load",
  });
  await page.emulateMedia({ media: "screen" });
  await page.pdf({
    format: "A4",
    landscape: deliverableType === "pitch_deck",
    margin:
      deliverableType === "pitch_deck"
        ? {
            top: "0mm",
            right: "0mm",
            bottom: "0mm",
            left: "0mm",
          }
        : {
            top: "0mm",
            right: "0mm",
            bottom: "0mm",
            left: "0mm",
          },
    path: outputPdfPath,
    printBackground: true,
  });
} finally {
  await browser.close();
}
