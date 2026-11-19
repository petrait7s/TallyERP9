from helpers import *

chapter('৯', 'শেখার অংশ: Learning Centre ও Interview Simulator')
section('c9a', 'Learning Centre কীভাবে কাজ করে')
term('Learning Centre', 'শেখার কেন্দ্র', 'Gateway &gt; Learning Centre। এখানে ৫২টি পাঠ (ইংরেজি ও বাংলা), স্তর অনুযায়ী সাজানো।',
 ['তালিকা থেকে পাঠ বেছে Enter। অ্যাপ একটি <b>অস্থায়ী স্যান্ডবক্স কোম্পানি</b> খোলে; আপনার আসল ডেটা অক্ষত থাকে (পাঠ থেকে বের হলে আগের কোম্পানি ফেরে)।', 'বামে <b>Coach panel</b>: বর্তমান ধাপ ও নির্দেশ। আপনি সঠিকভাবে কাজটি করলেই অ্যাপ নিজে ধাপ পাস করে পরেরটি দেখায়।', '<span class="k">Ctrl+H</span> হিন্ট, <span class="k">Ctrl+K</span> (কী-গুলো দেখায়), <span class="k">Ctrl+R</span> স্যান্ডবক্স রিসেট, <span class="k">Ctrl+L</span> বাংলা/ইংরেজি, <span class="k">Ctrl+J</span> প্যানেল লুকানো/দেখানো।', 'সব ধাপ হলে কুইজ আসে; <span class="k">1</span>–<span class="k">4</span> চেপে উত্তর। <b>৮০%</b> পেলে পাঠ সম্পন্ন (XP যোগ)।', 'প্রতিটি স্তরের ৮০% পাঠ শেষ হলে পরের স্তর খোলে। Free Practice বেছে কোচ বন্ধ করে খোলা অনুশীলন করা যায়।'],
 'B5 পাঠে ধাপ ১: Receipt-এ Cash ও Local Donations, অঙ্ক 7,777। ঠিক ভাউচার সেভ হলেই কোচ "Step 2/3" দেখাবে।')
note('কোচ আপনার কী-চাপ নকল করে না; অ্যাপের <b>অবস্থা</b> (কোন Ledger, ভাউচার, রেজিস্টার, কোন রিপোর্ট খুলেছেন) দেখে মিলিয়ে নেয়। তাই কাজটি যেকোনো সঠিক পথে করলেই চলে।')
section('c9b', 'পাঠের তালিকা')
table(['স্তর', 'পাঠ'], [
 ['Beginner', 'B1 হিসাবের মূল কথা (Dr/Cr, সোনালী নিয়ম); B2 নেভিগেশন; B3 কোম্পানি তৈরি; B4 Group, Ledger ও Alt+C; B5 প্রথম ভাউচার; B6 Day Book, Ledger, TB; B7 সংশোধন/মুছা/বাতিল/ডুপ্লিকেট'],
 ['Intermediate', 'I1 Journal সমন্বয়; I2 Bill-wise; I3 Cost centre; I4 Restricted grant; I5 Membership; I6 Bank reconciliation; I7 I&amp;E, R&amp;P, BS পড়া; I8 Relief goods ইনভেন্টরি'],
 ['Advanced', 'A1 বিদেশি অনুদান ও FX; A2 Fixed assets; A3 VAT/TDS; A4 Budget; A5 বছরশেষ ও নতুন বছর; A6 Backup/Restore/Edit log; A7 Ratio ও Auditor pack; A8 Interview Simulator'],
 ['Core (extended)', 'C1 নিরাপত্তা; C2 Voucher type/class ও Optional; C3 Advanced inventory; C4 Banking; C5 Credit control; C6 Audit; C7 Data exchange; C8 Payroll; E1 Error Lab'],
 ['NGO management', 'N1 Fund; N2 Donor; N3 Grant; N4 Foreign compliance; N5 Project costing; N6 Budget; N7 Membership; N8 Beneficiary; N9 Procurement; N10 Fixed asset register; N11 NGO payroll; N12 Petty cash; N13 Fundraising; N14 Treasury; N15 Sub-grant; N16 Statutory; N17 Reporting pack; N18 Year-end'],
 ['Capstone', 'X1 পুরো এনজিও বছর (ফাঁকা এনজিও থেকে রিপোর্ট পর্যন্ত ৭টি চেকপয়েন্ট); X2 Interview Simulator v2'],
])
section('c9c', 'Interview Simulator')
term('Interview Simulator', 'ইন্টারভিউ সিমুলেটর', 'বাস্তব ইন্টারভিউয়ের মতো সময়সীমাসহ পরীক্ষা: <b>৩০টি প্র্যাকটিক্যাল টাস্ক (৩০ মিনিট)</b> ও <b>৫০টি MCQ (২৫ মিনিট)</b>।',
 ['Learning Centre &gt; Interview Simulator (A8) বা v2 (X2)। নাম দিন (সার্টিফিকেটের জন্য)।', 'টাস্ক ১০৬টির ব্যাংক থেকে এলোমেলো ৩০টি (প্রতিটি ধরন থেকে অন্তত একটি)। বামের কোচে বর্তমান টাস্ক ও টাইমার।', 'টাস্ক করলেই অ্যাপ আপনা-আপনি টিক দেয়। <span class="k">Ctrl+N</span> পরের টাস্ক; <span class="k">Ctrl+M</span> টাস্ক শেষ করে MCQ-তে যাওয়া।', 'MCQ: ৫৯টির ব্যাংক থেকে ৫০টি; <span class="k">1</span>–<span class="k">4</span> চেপে উত্তর।', 'স্কোর = (টাস্ক × ২ + MCQ) ÷ (মোট টাস্ক × ২ + মোট MCQ)। <b>৭০%</b> পাস; ৮০% Merit; ৯০% Distinction।', 'পাস করলে <span class="k">Alt+P</span> দিয়ে সার্টিফিকেট PDF।'],
 '২৩/৩০ টাস্ক ও ৩৫/৫০ MCQ => (৪৬ + ৩৫) ÷ (৬০ + ৫০) = ৭৩.৬% => Pass।')

chapter('১০', 'অনুশীলন প্রশ্ন ও উত্তর')
p('নিজে অ্যাপে করে দেখুন। প্রতিটির নিচে উত্তর (এন্ট্রি) দেওয়া আছে।')
qs = [
 ('১. রফিক সাহেব Tk 7,000 নগদ অনুদান দিলেন। এন্ট্রি কী?', [('Cash', '7,000', ''), ('Local Donations', '', '7,000')], 'Receipt (F6)। নগদ এল (সম্পদ Dr), আয় বাড়ল (Cr)।'),
 ('২. ক্যাশ থেকে Tk 4,000 ব্যাংকে জমা।', [('Islami Bank A/c', '4,000', ''), ('Cash', '', '4,000')], 'Contra (F4)। দুটোই Real, শুধু স্থান বদল।'),
 ('৩. মার্চের বিদ্যুৎ বিল Tk 5,200 এপ্রিলে ব্যাংক থেকে দেওয়া হলো, কিন্তু এটি মার্চের ব্যয়। মার্চ ৩১-এ সমন্বয় কী?', [('Electricity', '5,200', ''), ('Outstanding Expenses (Provisions)', '', '5,200')], 'Journal। এক্রুয়াল ভিত্তিতে ব্যয় মার্চেই। এপ্রিলে Payment: Dr Outstanding Expenses, Cr Bank।'),
 ('৪. Tk 32,000 এর প্রিন্টার, SLM ২০% — বার্ষিক অবচয়?', [('Depreciation', '6,400', ''), ('Accumulated Depreciation', '', '6,400')], '৩২,০০০ × ২০% = ৬,৪০০। Run Depreciation Action দিয়ে।'),
 ('৫. Sylhet Skills Centre-কে Tk 20,000 প্রশিক্ষণ ইনভয়েস (বিল TF-9)। পরে Tk 8,000 এল। বাকি কত, কীভাবে?', [('Sales: Sylhet Skills Centre (New Ref TF-9)', '20,000', ''), ('Training Fee', '', '20,000')], 'পরে Receipt: Dr Bank 8,000; Cr পার্টি 8,000, Agst Ref TF-9। <b>বাকি Tk 12,000</b> (Outstandings-এ 0-30 দিনের কলামে)।'),
 ('৬. UNICEF গ্রান্ট USD 4,000 হারে ১২২-এ FC ব্যাংকে এল। এন্ট্রি?', [('Dutch-Bangla FC A/c', '4,88,000', ''), ('UNICEF-WASH', '', '4,88,000')], 'FC Receipt Voucher Action। ৪,০০০ × ১২২ = ৪,৮৮,০০০।'),
 ('৭. কর্মীর Basic Tk 16,000, Allowance Tk 6,400, PF ৫%। Gross, কর্মীর PF ও Net কত? (Advance নেই)', [], 'Gross = 22,400; PF = 16,000 × ৫% = 800; Net = 21,600। প্রতিষ্ঠানের PF-ও Tk 800 (ব্যয়)।'),
 ('৮. পরামর্শক ফি Tk 40,000, TDS ১০%। কত পাবেন, কত সরকারকে জমা দিতে হবে?', [], 'পাবেন Tk 36,000; TDS Tk 4,000 TDS Payable-এ; পরের মাসের ১৫ তারিখের মধ্যে চালানে জমা।'),
 ('৯. PO 100টি Tk 50,000; GRN 100; Invoice 100টি Tk 54,000 — Three-way Match ফল?', [], '<b>Price mismatch</b> — Invoice Tk 4,000 বেশি। সরবরাহকারীর সঙ্গে সমাধানের আগে পরিশোধ নয়।'),
 ('১০. বাজেট Tk 1,00,000; খরচ Tk 94,000। Used % ও Alert?', [], '৯৪% — <span class="mono">ALERT &gt;90%</span> (৯০ এর বেশি)।'),
 ('১১. FDR Tk 3,00,000 @ ৮%, ৬১ দিন। সুদ, TDS, নিট?', [], 'সুদ = 3,00,000 × 8 × 61 ÷ 36,500 = Tk 4,011; TDS Tk 401; নিট Tk 3,610 (পূর্ণ টাকায় ছাঁটা)।'),
 ('১২. বই ব্যালান্স Tk 80,000; Tk 6,000 এর একটি চেক ইস্যু হয়েছে কিন্তু ব্যাংক এখনও ক্লিয়ার করেনি। ব্যাংক স্টেটমেন্টে কত?', [], ' Tk 86,000 (বইয়ের + অনাদায়ী চেক)।'),
 ('১৩. কোনো ভাউচার মুছে ফেললে অডিটে কী ধরা পড়বে? বদলে কী করা ভালো?', [], 'নম্বরে <b>Voucher gap</b>। মুছার বদলে <b>Cancel (Alt+X)</b>; তাতে নম্বর থাকে।'),
 ('১৪. কোন রিপোর্টে সব ঠিক থাকলেও Debit = Credit দেখাবে, তবু ভুল থাকতে পারে?', [], 'Trial Balance — ভুল Ledger-এ সমান অঙ্কের এন্ট্রি হলে মোট মেলে, কিন্তু খাত ভুল (Error Lab-এর E1)।'),
 ('১৫. Restricted grant-এর অব্যয়িত অংশ আয় নাকি তহবিল? কেন?', [], 'তহবিল (Restricted Fund)। দাতার শর্তের কারণে অব্যয়িত অংশ প্রতিষ্ঠানের নিজস্ব আয় নয়; তাই Journal দিয়ে আয় থেকে Fund-এ সরানো হয়।'),
]
for q, rows_, ans in qs:
    out.append(f'<div class="q"><div class="qq">{q}</div>')
    if rows_:
        t = '<table class="jt"><tr><th>Ledger</th><th>Dr (Tk)</th><th>Cr (Tk)</th></tr>' + ''.join(f'<tr><td>{l}</td><td class="n">{d}</td><td class="n">{c}</td></tr>' for l, d, c in rows_) + '</table>'
        out.append(f'<div class="ans"><b>উত্তর:</b> {ans}{t}</div></div>')
    else:
        out.append(f'<div class="ans"><b>উত্তর:</b> {ans}</div></div>')

chapter('১১', 'শব্দকোষ (A-Z)')
gl = [
 ('Accrual', 'এক্রুয়াল', 'আয়/ব্যয় অর্জিত বা ঘটার সময়ে হিসাব, টাকা আসা-যাওয়ার সময়ে নয়।'),
 ('Advance', 'অগ্রিম', 'বিল তৈরির আগে নেওয়া/দেওয়া টাকা (Bill-wise)।'),
 ('Agst Ref', 'এগেইনস্ট রেফ', 'আগের কোনো বিলের বিপরীতে নিষ্পত্তি।'),
 ('Ageing', 'বয়স বিশ্লেষণ', 'বাকির বিলগুলো কত দিন ধরে খোলা তার ভাগ (0-30, 31-60, 61-90, 90+)।'),
 ('Alt+C', 'অল্ট সি', 'তালিকা বাছার সময় নতুন মাস্টার তৈরির কী।'),
 ('Asset', 'সম্পদ', 'প্রতিষ্ঠানের মালিকানাধীন, অর্থমূল্যের জিনিস (Cash, Bank, Equipment)।'),
 ('Backdated entry', 'পূর্বতারিখের এন্ট্রি', 'অনেক আগের তারিখে পরে করা এন্ট্রি; অডিটে ঝুঁকি।'),
 ('Bill-wise', 'বিলভিত্তিক', 'ইনভয়েস ধরে বাকি ট্র্যাক করা।'),
 ('Budget', 'বাজেট', 'পরিকল্পিত আয়-ব্যয়ের অঙ্ক।'),
 ('Burn rate', 'বার্ন রেট', 'প্রকল্পের টাকা খরচের গতি।'),
 ('Capital Reserve', 'মূলধন রিজার্ভ', 'অনুদানে কেনা সম্পদের প্রতিনিধি তহবিল।'),
 ('Challan', 'চালান', 'কর জমার প্রমাণ।'),
 ('Contra', 'কন্ট্রা', 'ক্যাশ-ব্যাংক স্থানান্তর ভাউচার।'),
 ('Corpus Fund', 'কর্পাস ফান্ড', 'স্থায়ী মূলধন তহবিল।'),
 ('Cost Centre', 'কস্ট সেন্টার', 'প্রকল্প/দাতা/ক্যাম্পেইন ট্যাগ।'),
 ('Credit (Cr)', 'ক্রেডিট', 'ডান পাশ; দায়, তহবিল, আয় বাড়ায়।'),
 ('Debit (Dr)', 'ডেবিট', 'বাম পাশ; সম্পদ, ব্যয় বাড়ায়।'),
 ('Depreciation', 'অবচয়', 'সম্পদের মূল্য ব্যবহারে ধীরে ধীরে কমে যাওয়া, ব্যয় হিসেবে ধরা।'),
 ('Designated Fund', 'নির্ধারিত তহবিল', 'বোর্ড কর্তৃক বরাদ্দ।'),
 ('Double entry', 'দ্বি-দফা হিসাব', 'প্রতি লেনদেনে Dr = Cr।'),
 ('Edit Log', 'এডিট লগ', 'পরিবর্তনের অডিট ট্রেইল।'),
 ('FDR', 'এফডিআর', 'ফিক্সড ডিপোজিট রসিদ; Investments।'),
 ('FIFO', 'ফিফো', 'প্রথমে আসা আগে মেটানো (TDS জমা মেলানোয়)।'),
 ('Fund', 'তহবিল', 'উদ্দেশ্য বা শর্তসহ রাখা অর্থ।'),
 ('GRN', 'জিআরএন', 'পণ্য প্রাপ্তির রশিদ।'),
 ('Grant', 'অনুদান', 'শর্তযুক্ত প্রকল্প অনুদান।'),
 ('Group', 'গ্রুপ', 'Ledger-এর সমষ্টি।'),
 ('Imprest', 'ইমপ্রেস্ট', 'সীমা পর্যন্ত পূরণযোগ্য ক্ষুদ্র নগদ।'),
 ('Journal', 'জার্নাল', 'নগদহীন সমন্বয় ভাউচার।'),
 ('Ledger', 'লেজার', 'একটি খাতের হিসাব।'),
 ('Liability', 'দায়', 'অন্যকে দিতে হবে এমন অর্থ।'),
 ('Memorandum', 'মেমোরেন্ডাম', 'হিসাবে প্রভাবহীন স্মারক ভাউচার।'),
 ('Narration', 'বিবরণ', 'ভাউচারের সংক্ষিপ্ত ব্যাখ্যা।'),
 ('On Account', 'অন অ্যাকাউন্ট', 'বিলের সঙ্গে অসংযুক্ত পেমেন্ট।'),
 ('Optional voucher', 'অপশনাল ভাউচার', 'আসল হিসাবে ধরা হয় না এমন সম্ভাব্য ভাউচার।'),
 ('PDC', 'পিডিসি', 'পোস্ট-ডেটেড চেক।'),
 ('Pledge', 'প্রতিশ্রুতি', 'ভবিষ্যতে দেওয়ার কথা দেওয়া অনুদান।'),
 ('Restricted Fund', 'সীমাবদ্ধ তহবিল', 'নির্দিষ্ট কাজে ব্যবহারযোগ্য।'),
 ('SLM / WDV', 'সরলরেখা / হ্রাসকৃত মূল্য', 'অবচয়ের দুটি পদ্ধতি।'),
 ('SOE', 'এসওই', 'অংশীদারের ব্যয় বিবরণী।'),
 ('Surplus / Deficit', 'উদ্বৃত্ত / ঘাটতি', 'আয় বেশি / ব্যয় বেশি।'),
 ('TDS', 'টিডিএস', 'উৎসে কর কর্তন।'),
 ('Tranche', 'কিস্তি', 'গ্রান্টের টাকা ভাগে ভাগে আসা।'),
 ('Trial Balance', 'রেওয়ামিল', 'ব্যালান্সের তালিকা; Dr = Cr।'),
 ('VAT', 'ভ্যাট', 'মূল্য সংযোজন কর।'),
 ('Voucher', 'ভাউচার', 'একটি লেনদেনের রেকর্ড।'),
 ('WDV', 'ডব্লিউডিভি', 'অবচয়ের পর সম্পদের অবশিষ্ট মূল্য (খরচ - জমা অবচয়)।'),
]
raw('<table class="gl"><tr><th>English</th><th>বাংলা</th><th>সংজ্ঞা</th></tr>' + ''.join(f'<tr><td class="mono">{a}</td><td>{b}</td><td>{c}</td></tr>' for a, b, c in gl) + '</table>')

chapter('১২', 'এক পাতার শর্টকাট শিট')
raw('<div class="cheat">')
table(['কী', 'কাজ', 'কী', 'কাজ'], [
 ['Esc', 'পেছনে', 'F4', 'Contra'],
 ['Enter', 'বাছা/পরের ঘর/ড্রিল', 'F5', 'Payment'],
 ['Ctrl+A', 'গ্রহণ', 'F6', 'Receipt'],
 ['Ctrl+Q', 'ত্যাগ', 'F7', 'Journal'],
 ['Alt+C', 'নতুন মাস্টার', 'F8', 'Sales'],
 ['Alt+D', 'মুছা', 'F9', 'Purchase'],
 ['Alt+X', 'ভাউচার বাতিল', 'Ctrl+F8', 'Credit Note'],
 ['Alt+2', 'ডুপ্লিকেট', 'Ctrl+F9', 'Debit Note'],
 ['Alt+F1', 'Detailed/Condensed', 'F10', 'অন্য ভাউচার'],
 ['Alt+F5', 'Horizontal/Vertical', 'F11', 'Features'],
 ['Alt+P', 'প্রিন্ট প্রিভিউ', 'F12', 'Configure'],
 ['Alt+E', 'CSV / PDF', 'F1', 'কোম্পানি বাছা'],
 ['F2', 'তারিখ / সময়কাল', 'F3', 'Company Info'],
 ['Ctrl+/', 'শর্টকাট শিট', 'Ctrl+H', 'হিন্ট'],
 ['Ctrl+K', 'কী দেখান', 'Ctrl+L', 'ভাষা'],
 ['Ctrl+J', 'কোচ লুকান', 'Ctrl+R', 'স্যান্ডবক্স রিসেট'],
 ['Ctrl+N', 'পরের টাস্ক', 'Ctrl+M', 'MCQ-তে যান'],
 ['Ctrl+=/-/0', 'জুম', 'Space / Y / N', 'Yes-No বদল'],
], 'kt')
raw('</div>')
raw('<p class="endnote">লেখক: <b>Kawsar Shuvo</b> — এই গাইডের সব উদাহরণ কাল্পনিক। TallyLearn NGO একটি স্বাধীন শেখার সরঞ্জাম; Tally ও Tally ERP 9 Tally Solutions-এর নিবন্ধিত ট্রেডমার্ক, এবং এই অ্যাপ তাদের সাথে সম্পর্কিত নয়। VAT/TDS অংশ শেখার সরলীকরণ, আইনি পরামর্শ নয়।</p>')
