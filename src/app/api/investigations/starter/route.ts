import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const title = "Research starter: law, institutions and infrastructure";

// The source links are starting points. A linked record is not a verified conclusion.
const entries = [
  {
    statement: "Private use of a motor vehicle on a UK road is exempt from the driver licensing requirement.",
    source: { title: "Road Traffic Act 1988, section 87", url: "https://www.legislation.gov.uk/ukpga/1988/52/section/87", publisher: "UK legislation", sourceType: "PRIMARY", notes: "Check the current text, definitions and any applicable exceptions." }, stance: "CHALLENGES",
  },
  {
    statement: "Registering a birth in the UK creates a financial bond or trust for that person.",
    source: { title: "HM Treasury: Paying debts using a National Insurance number or birth certificate", url: "https://www.gov.uk/government/publications/paying-debts-using-a-national-insurance-number-or-birth-certificate/paying-debts-using-a-national-insurance-number-or-birth-certificate", publisher: "HM Treasury", sourceType: "PRIMARY", notes: "An official institutional statement; seek independent transactional evidence for the claim as well." }, stance: "CHALLENGES",
  },
  {
    statement: "The UCC is a body of US commercial law governing transactions.",
    source: { title: "Uniform Commercial Code overview", url: "https://www.uniformlaws.org/acts/ucc", publisher: "Uniform Law Commission", sourceType: "PRIMARY", notes: "Examine the specific adopted state text and article before applying a provision." }, stance: "SUPPORTS",
  },
  {
    statement: "Operation Paperclip involved US recruitment of German and Austrian scientists after the Second World War.",
    source: { title: "National Archives: Nazi War Crimes Disclosure Act interim report", url: "https://www.archives.gov/iwg/reports/nazi-war-crimes-interim-report-october-1999", publisher: "US National Archives", sourceType: "PRIMARY", notes: "Follow the cited JIOA records and security reports for individual cases." }, stance: "SUPPORTS",
  },
  {
    statement: "The 2026 Bilderberg Meeting published a participant list.",
    source: { title: "Bilderberg participants 2026", url: "https://www.bilderbergmeetings.org/meetings/meeting-2026/participants-2026", publisher: "Bilderberg Meetings", sourceType: "PRIMARY", notes: "A participant list does not establish what any individual did during the meeting." }, stance: "SUPPORTS",
  },
  {
    statement: "A public ICC record shows an arrest warrant for Benjamin Netanyahu dated 21 November 2024.",
    source: { title: "ICC defendant record: Netanyahu", url: "https://www.icc-cpi.int/defendant/netanyahu", publisher: "International Criminal Court", sourceType: "PRIMARY", notes: "A warrant is not a conviction; recheck the case status when relying on it." }, stance: "SUPPORTS",
  },
  {
    statement: "The US Department of Justice operates a public Epstein Library with released records.",
    source: { title: "US DOJ Epstein Library", url: "https://www.justice.gov/epstein", publisher: "US Department of Justice", sourceType: "PRIMARY", notes: "Check document context and redaction explanations. Being named in a file does not establish wrongdoing." }, stance: "SUPPORTS",
  },
  {
    statement: "Lefdal Mine Data Centers operates a commercial computing facility inside a former mine in Norway.",
    source: { title: "Lefdal Mine: Our Facility", url: "https://www.lefdalmine.com/data-center/our-facility", publisher: "Lefdal Mine Data Centers", sourceType: "PRIMARY", notes: "Operator description of its own underground site; does not establish any OpenAI tenancy." }, stance: "SUPPORTS",
  },
  {
    statement: "An OpenAI or Stargate data centre is located exactly 40 metres underground.",
    source: { title: "OpenAI: Five new Stargate sites", url: "https://openai.com/index/five-new-stargate-sites/", publisher: "OpenAI", sourceType: "PRIMARY", notes: "Public site announcement. Its silence about an underground facility is not proof that no such facility exists." }, stance: "CONTEXT",
  },
];

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const existing = await db.investigation.findFirst({ where: { userId: session.user.id, title }, select: { id: true } });
    if (existing) return NextResponse.json({ investigation: existing, alreadyExists: true });
    const investigation = await db.$transaction(async (tx) => {
      const record = await tx.investigation.create({
        data: {
          userId: session.user.id, title,
          description: "A starting map of claims raised in our discussion. Source links collected 27 September 2026. Every claim begins unassessed; inspect the underlying records and record a reasoned review.",
        },
      });
      for (const entry of entries) {
        const source = await tx.researchSource.create({ data: { investigationId: record.id, ...entry.source } });
        await tx.researchClaim.create({
          data: { investigationId: record.id, statement: entry.statement, sources: { create: { sourceId: source.id, stance: entry.stance } } },
        });
      }
      return record;
    });
    return NextResponse.json({ investigation }, { status: 201 });
  } catch (error) {
    console.error("[investigations] starter failed", error);
    return NextResponse.json({ error: "Could not add the starter investigation." }, { status: 503 });
  }
}
