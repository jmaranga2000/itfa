import { format } from "date-fns";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  AlignmentType,
  BorderStyle,
  Document as WordDocument,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { EngagementLetterRecord } from "@/repositories/engagement-letter-repository";

const BRAND_DEEP = "03363D";
const BRAND_MIST = "BDD9D7";
const MUTED = "52666A";

type LetterBlock =
  | { type: "title" | "heading" | "paragraph"; text: string }
  | { type: "list"; text: string; number: string };

function blocksFromContent(content: string): LetterBlock[] {
  return content.split("\n").flatMap((line): LetterBlock[] => {
    const value = line.trim();
    if (!value) return [];
    if (value.startsWith("# ")) return [{ type: "title" as const, text: value.slice(2) }];
    if (value.startsWith("## ")) return [{ type: "heading" as const, text: value.slice(3) }];
    const list = value.match(/^(\d+)\.\s+(.+)$/);
    if (list) return [{ type: "list" as const, number: list[1], text: list[2] }];
    return [{ type: "paragraph" as const, text: value }];
  });
}

function dateLabel(value: string) {
  return format(new Date(value), "dd MMMM yyyy");
}

function companyAddress(letter: EngagementLetterRecord) {
  return [letter.company.address, letter.company.city, letter.company.country].filter(Boolean).join(", ");
}

function signerStatus(letter: EngagementLetterRecord, role: "ifta" | "client") {
  return letter.signers.find((signer) => signer.role === role);
}

const pdfStyles = StyleSheet.create({
  page: { backgroundColor: "#FFFFFF", color: "#172B2E", fontFamily: "Helvetica", fontSize: 9.5, lineHeight: 1.55, paddingBottom: 64 },
  topBand: { backgroundColor: `#${BRAND_DEEP}`, color: "#FFFFFF", paddingHorizontal: 40, paddingTop: 30, paddingBottom: 26 },
  brand: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  brandLine: { color: `#${BRAND_MIST}`, fontSize: 8, marginTop: 4 },
  companyLine: { color: "#D9E8E7", fontSize: 7.5, marginTop: 3 },
  referenceBand: { backgroundColor: `#${BRAND_MIST}`, color: `#${BRAND_DEEP}`, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 40, paddingVertical: 13 },
  metaLabel: { fontFamily: "Helvetica-Bold", fontSize: 7, textTransform: "uppercase" },
  metaValue: { fontSize: 9, marginTop: 3 },
  body: { paddingHorizontal: 40, paddingTop: 28 },
  subject: { color: `#${BRAND_DEEP}`, fontFamily: "Helvetica-Bold", fontSize: 16, lineHeight: 1.25, marginBottom: 18 },
  title: { color: `#${BRAND_DEEP}`, fontFamily: "Helvetica-Bold", fontSize: 13, marginBottom: 9, marginTop: 5 },
  heading: { borderBottomColor: `#${BRAND_MIST}`, borderBottomWidth: 1, color: `#${BRAND_DEEP}`, fontFamily: "Helvetica-Bold", fontSize: 10.5, marginBottom: 7, marginTop: 14, paddingBottom: 4 },
  paragraph: { marginBottom: 7, textAlign: "justify" },
  listRow: { flexDirection: "row", marginBottom: 5, paddingLeft: 8 },
  listNumber: { color: `#${BRAND_DEEP}`, fontFamily: "Helvetica-Bold", width: 20 },
  listText: { flexGrow: 1 },
  signatureSection: { marginHorizontal: 40, marginTop: 24, paddingTop: 15, borderTopColor: `#${BRAND_DEEP}`, borderTopWidth: 1.5 },
  signatureHeading: { color: `#${BRAND_DEEP}`, fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 10 },
  signatureGrid: { flexDirection: "row", gap: 12 },
  signatureBox: { borderColor: "#B7C7C8", borderWidth: 1, flex: 1, minHeight: 108, padding: 11 },
  signatureRole: { color: MUTED.startsWith("#") ? MUTED : `#${MUTED}`, fontFamily: "Helvetica-Bold", fontSize: 7, textTransform: "uppercase" },
  signatureName: { color: `#${BRAND_DEEP}`, fontFamily: "Times-Italic", fontSize: 16, marginTop: 14 },
  signatureDetail: { color: `#${MUTED}`, fontSize: 7.5, marginTop: 4 },
  pending: { color: "#8A6D1D", fontFamily: "Helvetica-Bold", fontSize: 9, marginTop: 18 },
  footer: { bottom: 22, color: "#65777A", flexDirection: "row", fontSize: 6.5, justifyContent: "space-between", left: 40, position: "absolute", right: 40 },
});

function PdfSignature({ letter, role }: { letter: EngagementLetterRecord; role: "ifta" | "client" }) {
  const signer = signerStatus(letter, role);
  return (
    <View style={pdfStyles.signatureBox}>
      <Text style={pdfStyles.signatureRole}>{role === "ifta" ? "For IFTA Consulting" : "For the client"}</Text>
      {signer?.status === "signed" ? (
        <>
          <Text style={pdfStyles.signatureName}>{signer.signatureText || signer.name}</Text>
          <Text style={pdfStyles.signatureDetail}>{signer.name} | {signer.title}</Text>
          <Text style={pdfStyles.signatureDetail}>Signed {signer.signedAt ? dateLabel(signer.signedAt) : "electronically"}</Text>
          <Text style={pdfStyles.signatureDetail}>Evidence {signer.signatureHash?.slice(0, 20) ?? "recorded"}</Text>
        </>
      ) : (
        <>
          <Text style={pdfStyles.pending}>Signature pending</Text>
          <Text style={pdfStyles.signatureDetail}>{signer?.name ?? "Authorized signatory"}</Text>
          <Text style={pdfStyles.signatureDetail}>{signer?.title ?? ""}</Text>
        </>
      )}
    </View>
  );
}

function EngagementLetterPdf({ letter }: { letter: EngagementLetterRecord }) {
  return (
    <Document author={letter.company.legalName} subject={letter.subject} title={`${letter.reference} - ${letter.subject}`}>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.topBand}>
          <Text style={pdfStyles.brand}>{letter.company.tradingName}</Text>
          <Text style={pdfStyles.brandLine}>Professional consulting and advisory services</Text>
          <Text style={pdfStyles.companyLine}>{letter.company.email} | {letter.company.phone} | {companyAddress(letter)}</Text>
        </View>
        <View style={pdfStyles.referenceBand}>
          <View><Text style={pdfStyles.metaLabel}>Prepared for</Text><Text style={pdfStyles.metaValue}>{letter.clientName}</Text><Text style={pdfStyles.metaValue}>{letter.clientEmail}</Text></View>
          <View><Text style={pdfStyles.metaLabel}>Letter reference</Text><Text style={pdfStyles.metaValue}>{letter.reference}</Text><Text style={pdfStyles.metaValue}>Issued {dateLabel(letter.generatedAt)}</Text></View>
        </View>
        <View style={pdfStyles.body}>
          <Text style={pdfStyles.subject}>{letter.subject}</Text>
          {blocksFromContent(letter.content).map((block, index) => {
            if (block.type === "title") return <Text key={index} style={pdfStyles.title}>{block.text}</Text>;
            if (block.type === "heading") return <Text key={index} style={pdfStyles.heading}>{block.text}</Text>;
            if (block.type === "list") return <View key={index} style={pdfStyles.listRow}><Text style={pdfStyles.listNumber}>{block.number}.</Text><Text style={pdfStyles.listText}>{block.text}</Text></View>;
            return <Text key={index} style={pdfStyles.paragraph}>{block.text}</Text>;
          })}
        </View>
        <View style={pdfStyles.signatureSection} wrap={false}>
          <Text style={pdfStyles.signatureHeading}>Acceptance and electronic signatures</Text>
          <View style={pdfStyles.signatureGrid}><PdfSignature letter={letter} role="ifta" /><PdfSignature letter={letter} role="client" /></View>
        </View>
        <View fixed style={pdfStyles.footer}>
          <Text>Document fingerprint {letter.contentHash.slice(0, 24)}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function renderEngagementLetterPdf(letter: EngagementLetterRecord) {
  const rendered = await renderToBuffer(<EngagementLetterPdf letter={letter} />);
  const pdf = await PDFDocument.load(rendered);
  pdf.setTitle(`${letter.reference} - ${letter.subject}`);
  pdf.setAuthor(letter.company.legalName);
  pdf.setSubject("Engagement letter and electronic signature evidence");
  pdf.setKeywords(["IFTA Consulting", "engagement letter", letter.reference]);
  pdf.setProducer("IFTA Consulting Portal");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const page of pdf.getPages()) {
    page.drawText(`Verified record ${letter.reference} | ${letter.status.replaceAll("_", " ")}`, {
      x: 40,
      y: 10,
      size: 5.5,
      font,
      color: rgb(3 / 255, 54 / 255, 61 / 255),
    });
  }
  return Buffer.from(await pdf.save());
}

function wordContentParagraphs(letter: EngagementLetterRecord) {
  return blocksFromContent(letter.content).map((block) => {
    if (block.type === "title") return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 120, after: 140 }, text: block.text });
    if (block.type === "heading") return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 100 }, text: block.text });
    if (block.type === "list") return new Paragraph({ bullet: { level: 0 }, spacing: { after: 80 }, text: block.text });
    return new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 130, line: 300 }, children: [new TextRun(block.text)] });
  });
}

function signatureCell(letter: EngagementLetterRecord, role: "ifta" | "client") {
  const signer = signerStatus(letter, role);
  const signed = signer?.status === "signed";
  return new TableCell({
    borders: {
      top: { style: BorderStyle.SINGLE, color: BRAND_MIST, size: 6 },
      bottom: { style: BorderStyle.SINGLE, color: BRAND_MIST, size: 6 },
      left: { style: BorderStyle.SINGLE, color: BRAND_MIST, size: 6 },
      right: { style: BorderStyle.SINGLE, color: BRAND_MIST, size: 6 },
    },
    children: [
      new Paragraph({ children: [new TextRun({ bold: true, color: BRAND_DEEP, text: role === "ifta" ? "FOR IFTA CONSULTING" : "FOR THE CLIENT" })] }),
      new Paragraph({ spacing: { before: 220 }, children: [new TextRun({ bold: signed, color: BRAND_DEEP, italics: signed, size: signed ? 32 : 20, text: signed ? signer.signatureText || signer.name : "Signature pending" })] }),
      new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ color: MUTED, size: 18, text: signer?.name ?? "Authorized signatory" })] }),
      new Paragraph({ children: [new TextRun({ color: MUTED, size: 16, text: signed && signer.signedAt ? `Signed ${dateLabel(signer.signedAt)}` : signer?.title ?? "" })] }),
      new Paragraph({ children: [new TextRun({ color: MUTED, size: 14, text: signed ? `Evidence ${signer.signatureHash?.slice(0, 24) ?? "recorded"}` : "" })] }),
    ],
  });
}

export async function renderEngagementLetterDocx(letter: EngagementLetterRecord) {
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ bold: true, color: BRAND_DEEP, size: 34, text: letter.company.tradingName })] }), new Paragraph({ children: [new TextRun({ color: MUTED, size: 17, text: "Professional consulting and advisory services" })] })] }),
      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ color: MUTED, size: 16, text: letter.company.email })] }), new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ color: MUTED, size: 16, text: companyAddress(letter) })] })] }),
    ] })],
  });
  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ bold: true, color: BRAND_DEEP, text: "PREPARED FOR" })] }), new Paragraph(letter.clientName), new Paragraph(letter.clientEmail)] }),
      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ bold: true, color: BRAND_DEEP, text: "LETTER REFERENCE" })] }), new Paragraph({ alignment: AlignmentType.RIGHT, text: letter.reference }), new Paragraph({ alignment: AlignmentType.RIGHT, text: `Issued ${dateLabel(letter.generatedAt)}` })] }),
    ] })],
  });
  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [signatureCell(letter, "ifta"), signatureCell(letter, "client")] })],
  });
  const document = new WordDocument({
    creator: letter.company.legalName,
    title: `${letter.reference} - ${letter.subject}`,
    description: "Editable engagement letter generated by the IFTA Consulting Portal",
    styles: {
      default: { document: { run: { font: "Aptos", size: 20, color: "172B2E" }, paragraph: { spacing: { after: 100 } } } },
      paragraphStyles: [
        { id: "Title", name: "Title", basedOn: "Normal", next: "Normal", quickFormat: true, run: { bold: true, color: BRAND_DEEP, size: 36 }, paragraph: { spacing: { before: 180, after: 220 } } },
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { bold: true, color: BRAND_DEEP, size: 28 }, paragraph: { spacing: { before: 240, after: 140 } } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { bold: true, color: BRAND_DEEP, size: 23 }, paragraph: { spacing: { before: 220, after: 100 } } },
      ],
    },
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children: [
        headerTable,
        new Paragraph({ spacing: { before: 180 } }),
        metaTable,
        new Paragraph({ heading: HeadingLevel.TITLE, text: letter.subject }),
        ...wordContentParagraphs(letter),
        new Paragraph({ heading: HeadingLevel.HEADING_2, text: "Acceptance and electronic signatures" }),
        signatureTable,
        new Paragraph({ spacing: { before: 160 }, children: [new TextRun({ color: MUTED, size: 14, text: `Document fingerprint: ${letter.contentHash}` })] }),
      ],
    }],
  });
  return Packer.toBuffer(document);
}

export function engagementLetterFilename(letter: EngagementLetterRecord, extension: "pdf" | "docx") {
  return `${letter.reference}-${letter.clientName}`.replace(/[^a-zA-Z0-9._-]/g, "-") + `.${extension}`;
}
