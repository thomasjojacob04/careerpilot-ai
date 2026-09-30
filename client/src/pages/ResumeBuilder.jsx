import { useState } from "react";
import api, { errMsg } from "../api/client";
import { Button, Card, ErrorBox, Field, PageHeader, Select, Textarea } from "../components/ui";

export default function ResumeBuilder() {
  const [resume, setResume] = useState(null);
  const [html, setHtml] = useState("");
  const [template, setTemplate] = useState("classic");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function generate() {
    setBusy("generate"); setError("");
    try {
      const { data } = await api.post("/resume/generate");
      setResume(data.resume);
      setHtml(data.html);
      setTemplate("classic");
    } catch (e) { setError(errMsg(e)); } finally { setBusy(""); }
  }

  async function preview(nextTemplate = template, nextResume = resume) {
    try { setHtml((await api.post("/resume/preview", { template: nextTemplate, resume: nextResume })).data.html); }
    catch (e) { setError(errMsg(e)); }
  }

  async function download() {
    setBusy("pdf"); setError("");
    try {
      const res = await api.post("/resume/pdf", { template, resume }, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = Object.assign(document.createElement("a"), { href: url, download: "resume.pdf" });
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setError("Could not create the PDF. " + (e.response?.status ? "The server rejected the request." : errMsg(e))); }
    finally { setBusy(""); }
  }

  return (
    <>
      <PageHeader
        title="AI resume builder"
        subtitle="Generates a summary and project bullets from your profile only. It never invents experience, so check the wording before you send it."
        action={<Button onClick={generate} disabled={!!busy}>{busy === "generate" ? "Writing..." : resume ? "Regenerate" : "Generate resume"}</Button>}
      />
      <ErrorBox>{error}</ErrorBox>
      {resume && (
        <div className="mt-4 grid gap-5 lg:grid-cols-[320px_1fr]">
          <Card className="space-y-4 self-start">
            <Field label="Template">
              <Select value={template} onChange={(e) => { setTemplate(e.target.value); preview(e.target.value); }}>
                <option value="classic">Classic (serif, ATS-safe)</option>
                <option value="modern">Modern (accent header)</option>
              </Select>
            </Field>
            <Field label="Summary" hint="Edit, then refresh the preview.">
              <Textarea rows={6} value={resume.summary} onChange={(e) => setResume({ ...resume, summary: e.target.value })} />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => preview()}>Refresh preview</Button>
              <Button onClick={download} disabled={!!busy}>{busy === "pdf" ? "Preparing..." : "Download PDF"}</Button>
            </div>
          </Card>
          <div className="overflow-hidden rounded-lg border border-line bg-white">
            {/* sandbox with no permissions: generated HTML cannot run scripts */}
            <iframe title="Resume preview" srcDoc={html} sandbox="" className="h-[900px] w-full" />
          </div>
        </div>
      )}
    </>
  );
}
