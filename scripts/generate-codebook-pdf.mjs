import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(projectRoot, "docs", "CODEBOOK.md");
const outputDir = path.join(projectRoot, "public", "downloads");
const outputPath = path.join(outputDir, "academic-sentinel-codebook.pdf");

const pageWidth = 612;
const pageHeight = 792;
const marginX = 54;
const topY = 740;
const bottomY = 64;
const bodyLeading = 15;

function escapePdfText(value) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text, maxChars) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
      continue;
    }

    let chunk = word;
    while (chunk.length > maxChars) {
      lines.push(chunk.slice(0, maxChars - 1) + "-");
      chunk = chunk.slice(maxChars - 1);
    }
    current = chunk;
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function parseMarkdown(markdown) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .reduce((items, line) => {
      if (!line.trim()) {
        items.push({ type: "spacer", height: 8 });
        return items;
      }

      if (line.startsWith("# ")) {
        items.push({ type: "title", text: line.slice(2).trim() });
        return items;
      }

      if (line.startsWith("## ")) {
        items.push({ type: "heading", text: line.slice(3).trim() });
        return items;
      }

      if (line.startsWith("### ")) {
        items.push({ type: "subheading", text: line.slice(4).trim() });
        return items;
      }

      if (line.startsWith("- ")) {
        items.push({ type: "bullet", text: line.slice(2).trim() });
        return items;
      }

      if (/^\d+\.\s+/.test(line)) {
        items.push({ type: "bullet", text: line.replace(/^\d+\.\s+/, "").trim() });
        return items;
      }

      items.push({ type: "paragraph", text: line.trim() });
      return items;
    }, []);
}

function renderItems(items) {
  const pages = [];
  let commands = [];
  let cursorY = topY;

  function flushPage() {
    if (!commands.length) return;
    pages.push(commands.join("\n"));
    commands = [];
    cursorY = topY;
  }

  function ensureHeight(requiredHeight) {
    if (cursorY - requiredHeight < bottomY) {
      flushPage();
    }
  }

  function drawLine(text, x, y, size = 11, font = "F1") {
    commands.push("BT");
    commands.push(`/${font} ${size} Tf`);
    commands.push(`${x} ${y} Td`);
    commands.push(`(${escapePdfText(text)}) Tj`);
    commands.push("ET");
  }

  for (const item of items) {
    if (item.type === "spacer") {
      cursorY -= item.height;
      continue;
    }

    if (item.type === "title") {
      ensureHeight(34);
      drawLine(item.text, marginX, cursorY, 22, "F2");
      cursorY -= 30;
      continue;
    }

    if (item.type === "heading") {
      ensureHeight(24);
      drawLine(item.text.toUpperCase(), marginX, cursorY, 14, "F2");
      cursorY -= 22;
      continue;
    }

    if (item.type === "subheading") {
      ensureHeight(22);
      drawLine(item.text, marginX, cursorY, 12, "F2");
      cursorY -= 18;
      continue;
    }

    if (item.type === "paragraph") {
      const lines = wrapText(item.text, 82);
      ensureHeight(lines.length * bodyLeading + 6);
      for (const line of lines) {
        drawLine(line, marginX, cursorY, 11, "F1");
        cursorY -= bodyLeading;
      }
      cursorY -= 4;
      continue;
    }

    if (item.type === "bullet") {
      const lines = wrapText(item.text, 76);
      ensureHeight(lines.length * bodyLeading + 6);
      lines.forEach((line, index) => {
        const text = index === 0 ? `• ${line}` : `  ${line}`;
        drawLine(text, marginX + 6, cursorY, 11, "F1");
        cursorY -= bodyLeading;
      });
      cursorY -= 4;
    }
  }

  flushPage();
  return pages;
}

function createPdf(pages) {
  const objects = [];

  function addObject(content) {
    objects.push(content);
    return objects.length;
  }

  const catalogId = addObject("");
  const pagesId = addObject("");
  const fontRegularId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBoldId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  const pageEntries = [];
  for (const pageStream of pages) {
    const contentId = addObject(
      `<< /Length ${Buffer.byteLength(pageStream, "utf8")} >>\nstream\n${pageStream}\nendstream`
    );
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageEntries.push(pageId);
  }

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Count ${pageEntries.length} /Kids [${pageEntries
    .map((id) => `${id} 0 R`)
    .join(" ")}] >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

const markdown = await fs.readFile(sourcePath, "utf8");
const items = parseMarkdown(markdown);
const pages = renderItems(items);
const pdfContent = createPdf(pages);

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(outputPath, pdfContent, "binary");

console.log(`Generated codebook PDF at ${outputPath}`);
