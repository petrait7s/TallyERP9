import type { InterviewResult } from './interview';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Certificate of completion as printable HTML (A4 landscape). */
export function certificateHtml(name: string, r: InterviewResult, dateIso: string, company = 'Sylhet Community Development Foundation'): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Certificate</title><style>
 @page { size: A4 landscape; margin: 0; }
 body { margin: 0; font-family: Georgia, serif; }
 .frame { margin: 14mm; border: 6px double #1b4f72; padding: 18mm 12mm; height: 150mm; text-align: center; box-sizing: border-box; }
 h1 { font-size: 34px; color: #1b4f72; margin: 0 0 6px; letter-spacing: 2px; }
 .sub { font-size: 15px; color: #555; margin-bottom: 26px; }
 .name { font-size: 30px; border-bottom: 1px solid #000; display: inline-block; padding: 0 30px 4px; margin: 10px 0 22px; }
 p { font-size: 16px; line-height: 1.6; margin: 6px 0; }
 .score { font-size: 22px; color: #1b4f72; margin-top: 16px; font-weight: bold; }
 .foot { margin-top: 36px; font-size: 11px; color: #666; }
</style></head><body><div class="frame">
 <h1>CERTIFICATE OF COMPLETION</h1><div class="sub">TallyLearn NGO - Tally ERP 9 practice simulator for NGO accounting</div>
 <p>This is to certify that</p><div class="name">${esc(name || 'Learner')}</div>
 <p>has completed the Interview Simulator (${r.taskTotal} practical tasks and ${r.mcqTotal} multiple-choice questions)<br>for the practice company <b>${esc(company)}</b></p>
 <div class="score">Score ${r.percent}% - ${esc(r.grade)}</div>
 <p>Practical tasks ${r.taskScore}/${r.taskTotal} &nbsp;|&nbsp; MCQ ${r.mcqScore}/${r.mcqTotal}</p>
 <div class="foot">Issued ${esc(dateIso)}. Practice certificate only; TallyLearn NGO is not affiliated with Tally Solutions.</div>
</div></body></html>`;
}
