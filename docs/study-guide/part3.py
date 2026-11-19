from helpers import *

chapter('৫', 'রিপোর্ট')
p('রিপোর্ট ভাউচার থেকে <b>সরাসরি হিসাব করে</b> দেখানো হয়; আলাদা কোনো সংরক্ষিত রিপোর্ট নেই। তাই ভাউচার বদলালে রিপোর্ট সঙ্গে সঙ্গে বদলে যায়।')
section('c5a', 'রিপোর্টে চলাচলের সাধারণ নিয়ম')
table(['কী', 'কাজ'], [
 ['<span class="k">Up/Down, PgUp/PgDn, Home/End</span>', 'সারি বাছা'],
 ['<span class="k">Left/Right</span>', 'দুই পাশের (Liabilities | Assets) রিপোর্টে পাশ বদল'],
 ['<span class="k">Enter</span>', 'ড্রিল-ডাউন: Group &gt; Sub-group &gt; Ledger &gt; ভাউচার &gt; সংশোধন। Esc দিলে একই সারিতে ফেরা।'],
 ['<span class="k">F2</span>', 'সময়কাল (From/To) বদল। সব রিপোর্টে একই সময়কাল চলে।'],
 ['<span class="k">Alt+F1</span>', 'Detailed: সব Sub-group ও Ledger খুলে দেখায়; Condensed: শুধু প্রধান সারি।'],
 ['<span class="k">Alt+F5</span>', 'Horizontal (পাশাপাশি) / Vertical (ওপর-নিচ)।'],
 ['<span class="k">Alt+E</span>', 'CSV ফাইল (Excel-এ খোলে)।'],
 ['<span class="k">Alt+P</span>', 'A4 প্রিন্ট প্রিভিউ। সেখানে <span class="k">Alt+P</span> প্রিন্ট, <span class="k">Alt+E</span> PDF সেভ।'],
])
section('c5b', 'Trial Balance ও Group Summary')
term('Group Summary', 'গ্রুপ সারাংশ', 'একটি গ্রুপের (সব Sub-group সহ) শুরুর ব্যালান্স, সময়কালের Debit, Credit ও শেষ ব্যালান্স।',
 ['Trial Balance খুললে প্রাইমারি গ্রুপগুলো দেখায় (এটাই সবার উপরের Group Summary)।', 'Opening = সময়কাল শুরুর আগের দিনের ব্যালান্স। Closing = Opening + Debit - Credit।', 'Enter দিলে গ্রুপের ভিতরের Sub-group/Ledger, আবার Enter দিলে Ledger Account।', 'নিচের Grand Total-এ মোট Debit ও Credit মেলে; না মিললে <span class="mono">Difference in Trial Balance</span> লাল বার্তা আসে।'],
 'সময়কাল 1-May থেকে 31-May: Bank Accounts-এর Opening 1-May-এর আগের ব্যালান্স, Debit = মে মাসের জমা, Credit = মে মাসের উত্তোলন।')
section('c5c', 'Ledger Account ও Day Book')
term('Ledger Account', 'লেজার হিসাব', 'একটি Ledger-এর সব লেনদেন তারিখ অনুযায়ী।',
 ['প্রথমে Opening Balance সারি, তারপর প্রতি ভাউচারের সারি, শেষে Closing Balance ও মোট।', 'Particulars-এ Dr লাইনে <span class="mono">To</span> এবং Cr লাইনে <span class="mono">By</span> সহ বিপরীত হিসাবের নাম। একাধিক হলে <span class="mono">(as per details)</span>।', 'সারিতে Enter দিলে ভাউচার সংশোধন পর্দা খোলে।'],
 'Islami Bank A/c-এ <span class="mono">To Local Donations</span> 10,000 (Debit) মানে অনুদানে ব্যাংকে টাকা ঢুকল।')
term('Day Book', 'ডে বুক', 'সময়কালের সব ভাউচারের তারিখক্রমিক তালিকা (বাতিল, Optional, Post-dated সহ, পাশে নোট করা)।',
 ['Gateway &gt; Display &gt; Day Book।', 'Enter = সংশোধন, <span class="k">Alt+2</span> = ডুপ্লিকেট, <span class="k">Alt+X</span> = বাতিল।', 'F4–F9 চেপে এখান থেকেই নতুন ভাউচার।'],
 'ভুল এন্ট্রি খুঁজতে প্রথমে Day Book দেখুন; সন্দেহজনক সারিতে Enter দিয়ে ঠিক করুন।')
section('c5d', 'Balance Sheet')
term('Balance Sheet', 'স্থিতিপত্র', 'নির্দিষ্ট তারিখে প্রতিষ্ঠানের সম্পদ বনাম দায় ও তহবিলের চিত্র। বাম পাশে Liabilities (দায়/তহবিল), ডান পাশে Assets (সম্পদ)।',
 ['তারিখ = সময়কালের To তারিখ (F2 দিয়ে বদলান)।', 'প্রতিটি প্রাইমারি গ্রুপের ব্যালান্স সংশ্লিষ্ট পাশে বসে। বিপরীত ব্যালান্সের হিসাব উল্টো পাশে যায়।', 'বছরের উদ্বৃত্ত <span class="mono">Income &amp; Expenditure A/c</span> হিসেবে Liabilities-এর শুরুতে যোগ হয় (ঘাটতি হলে Assets-এ)।', 'শুরুর ব্যালান্স না মিললে <span class="mono">Difference in Opening Balances</span> সারি আসে।', 'দুই পাশের মোট সমান না হলে নিচে লাল সতর্কতা।'],
 'Capital Account Tk 4,20,000 + উদ্বৃত্ত Tk 3,800 = Liabilities মোট Tk 4,23,800। Assets-এ Current Assets Tk 4,23,800। দুই পাশ সমান।')
section('c5e', 'Income & Expenditure ও Receipts & Payments')
term('Income & Expenditure A/c', 'আয়-ব্যয় হিসাব', 'সময়কালের এক্রুয়াল ভিত্তিক ফলাফল। বামে Expenditure, ডানে Income।',
 ['শুধু আয় ও ব্যয় গ্রুপের সময়কালের নড়াচড়া ধরে (শুরুর ব্যালান্স নয়)।', 'আয় &gt; ব্যয় হলে বামে <span class="mono">Excess of Income over Expenditure (Surplus)</span>; উল্টো হলে ডানে <span class="mono">(Deficit)</span> যোগ করে দুই পাশ সমান করে।', 'Enter দিয়ে গ্রুপ থেকে Ledger-এ নামুন।'],
 'আয় Tk 11,66,567, ব্যয় Tk 11,61,151 হলে উদ্বৃত্ত Tk 5,416 (বামে Expenditure-এর পাশে যোগ হয়)।')
term('Receipts & Payments A/c', 'প্রাপ্তি-প্রদান হিসাব', 'ক্যাশ ও ব্যাংকের সব আসা-যাওয়ার সারাংশ।',
 ['বামে: শুরুর ক্যাশ-ব্যাংক ব্যালান্স + সব প্রাপ্তি (যে Ledger থেকে এল তার নামে)।', 'ডানে: সব প্রদান + শেষের ক্যাশ-ব্যাংক ব্যালান্স।', 'Contra (ক্যাশ-ব্যাংক স্থানান্তর) বাদ যায়।', 'সূত্র: শুরুর ব্যালান্স + প্রাপ্তি = প্রদান + শেষের ব্যালান্স।'],
 'শুরু Tk 1,00,000 + প্রাপ্তি Tk 20,000 = প্রদান Tk 11,000 + শেষ Tk 1,09,000 = মোট Tk 1,20,000।')
section('c5f', 'Outstandings (বাকির বয়স)')
term('Bills Receivable / Payable', 'পাওনা / দেনা বিল', 'Sundry Debtors (পাওনা) বা Creditors (দেনা) গ্রুপের খোলা বিলের তালিকা ও বয়স।',
 ['পথ: Display &gt; Statements of Accounts &gt; Outstandings &gt; Receivables / Payables।', 'বিলের বয়স = রিপোর্ট তারিখ - বিলের তৈরির তারিখ।', 'কলাম: 0-30, 31-60, 61-90, Over 90 days।', 'পার্টির সারি মোটা; Alt+F1 দিলে নিচে প্রতিটি বিল ও On Account অংশ।', 'On Account = Ledger ব্যালান্স - বিলগুলোর যোগফল।'],
 'ইনভয়েস ১ মে-র Tk 10,000; রিপোর্ট ১ আগস্ট। বয়স ৯২ দিন, তাই Over 90 days কলামে।')
section('c5g', 'অন্যান্য রিপোর্ট')
table(['রিপোর্ট', 'কী দেখায়', 'কীভাবে কাজ করে'], [
 ['Cash/Bank Books', 'ক্যাশ ও সব ব্যাংকের শুরু, Debit, Credit, শেষ', 'Cash-in-hand ও Bank Accounts-এর Ledger; Enter দিলে Ledger Account'],
 ['Stock Summary', 'পণ্যের পরিমাণ, গড় দর, মূল্য', 'শুরুর স্টক + Stock Movements; দর = ওয়েটেড গড় (মোট মূল্য ÷ মোট পরিমাণ)'],
 ['Ratio Analysis', 'আর্থিক অনুপাত', 'Current ratio = Current Assets ÷ Current Liabilities; Liquid ratio = (Cash+Bank) ÷ Current Liabilities; Working capital; Fixed Assets ÷ মোট সম্পদ; ব্যয় ÷ আয়; উদ্বৃত্ত ÷ আয়'],
 ['Fund Statement', 'প্রতিটি তহবিলের শুরু, সংযোজন, ব্যবহার, শেষ', 'Fund গ্রুপের Cr নড়াচড়া = সংযোজন; Dr = ব্যবহার'],
 ['Project / Cost Centre Statement', 'Centre-ভিত্তিক আয়, ব্যয়, নিট', 'ভাউচারে Centre বরাদ্দ থেকে; আয় Ledger-এর Cr, ব্যয় Ledger-এর Dr'],
])

chapter('৬', 'F11, F12, কোম্পানি ব্যবস্থাপনা ও নিরাপত্তা')
section('c6a', 'F11 Features')
term('Features', 'ফিচার সুইচ', 'কোম্পানির কোন সুবিধা চালু থাকবে তা ঠিক করা। বন্ধ থাকলে সংশ্লিষ্ট মেনু ও ফর্মের ঘর লুকিয়ে যায়।',
 ['যেকোনো পর্দায় <span class="k">F11</span> চাপুন।', 'Up/Down দিয়ে সরুন; <span class="k">Y</span>/<span class="k">N</span> বা Space দিয়ে বদলান।', '<span class="k">Ctrl+A</span> দিয়ে সেভ, <span class="k">Esc</span> দিলে বাতিল।'],
 'Inventory বন্ধ করলে Inventory Masters, Stock Summary মেনু থেকে চলে যায়। Cost centres বন্ধ করলে ভাউচারে Centre বরাদ্দ করলে সেভ হয় না।')
table(['ফিচার', 'চালু থাকলে যা পাওয়া যায়'], [
 ['Maintain Inventory', 'Stock মাস্টার, Stock Summary, Inventory (advanced)'],
 ['Bill-wise details', 'Ledger-এ bill-by-bill, বিল বিবরণী, Outstandings, Credit Control'],
 ['Cost centres', 'প্রকল্প/দাতা ট্যাগ, Project Statement'],
 ['Payroll', 'NGO Management &gt; Payroll মেনু'],
 ['Interest / Budgets', 'সুইচ সংরক্ষিত থাকে; এখনো অন্য কিছু বদলায় না'],
 ['Multiple currencies', 'Currency মাস্টার, Ledger-এ Currency ঘর'],
 ['Bank reconciliation', 'Utilities &gt; Banking'],
 ['Optional vouchers', 'ভাউচারে Optional ঘর'],
 ['Statutory (VAT/TDS)', 'Ledger-এ Tax type/rate, Statutory Reports'],
])
section('c6b', 'F12 Configure')
term('Configure', 'কনফিগারেশন', 'ভাউচার ও রিপোর্টের আচরণ বদলানো। যেকোনো পর্দা থেকে <span class="k">F12</span>।',
 None, None)
table(['সেটিং', 'প্রভাব'], [
 ['Single-entry layout', 'Payment/Receipt/Sales/Purchase-এ Account + Particulars; বন্ধ থাকলে Dr/Cr লাইন'],
 ['Show narration', 'ভাউচারে Narration ঘর'],
 ['Show cheque number', 'ভাউচারে Cheque No. ঘর'],
 ['Allow post-dated vouchers', 'ভাউচারে Post-dated ঘর'],
 ['Open reports in detailed view', 'রিপোর্ট খুলেই Detailed'],
])
section('c6c', 'কোম্পানি তৈরি, বাছাই, ব্যাকআপ')
p('<span class="k">F3</span> (বা Alt+F3) চেপে <b>Company Info</b> মেনু খুলুন:')
table(['মেনু', 'সংজ্ঞা ও কাজ'], [
 ['Select Company (F1)', 'সংরক্ষিত কোম্পানির তালিকা; Enter দিয়ে খুলুন। Vault পাসওয়ার্ড থাকলে চাইবে।'],
 ['Create Company', 'নাম, আর্থিক বছর শুরুর তারিখ (শেষ তারিখ স্বয়ংক্রিয় ১২ মাস), মুদ্রা, ও "Enable all features" (Y/N) দিন। <span class="mono">Ctrl+A</span> দিলে তৈরি হয়ে খুলে যায়।'],
 ['Alter Company', 'কোম্পানির নাম বদল।'],
 ['Delete Company', 'তালিকা থেকে বাছুন, Y। খোলা কোম্পানি মুছা যায় না; ফাইল <span class="mono">.deleted</span> নামে থেকে যায়।'],
 ['Split Company Data', 'নতুন বছরের জন্য আলাদা কোম্পানি: শেষ ব্যালান্স হয় নতুন Opening, খোলা বিল (Outstanding) চলে আসে, বছরের উদ্বৃত্ত <span class="mono">Profit &amp; Loss A/c</span>-এ যায়। ভাউচার আসে না।'],
 ['Backup', 'কোম্পানির পুরো ডেটা একটি <span class="mono">.tlbak.json</span> ফাইলে সংরক্ষণ।'],
 ['Restore', 'ব্যাকআপ ফাইল বেছে নতুন কোম্পানি হিসেবে আমদানি (আগের কোম্পানি বদলায় না)।'],
 ['Data Repair', 'ডেটার স্বাস্থ্য পরীক্ষা: অসমান ভাউচার, অজানা Ledger/Group, ডুপ্লিকেট নম্বর, শুরুর ব্যালান্সের গরমিল। শুধু দেখায়, নিজে ঠিক করে না।'],
])
p('ডেটা নিজে নিজে সংরক্ষিত হয় (প্রতিটি পরিবর্তনের কিছুক্ষণ পর)। Electron অ্যাপে ফাইল <span class="mono">userData/companies</span> ফোল্ডারে থাকে, প্রতিবার সেভে সর্বোচ্চ ৫টি পুরনো কপি রেখে।')
section('c6d', 'ইউজার, রোল ও Vault')
term('Users &amp; Roles', 'ইউজার ও ভূমিকা', 'কে কী করতে পারবে তা নিয়ন্ত্রণ (শেখানোর জন্য; আসল নিরাপত্তা নয়)।',
 ['<b>Admin:</b> সব কাজ।', '<b>Data Entry:</b> নতুন ভাউচার ও নতুন মাস্টার তৈরি; সংশোধন, বাতিল, মুছা, F11 নয়।', '<b>Auditor:</b> শুধু দেখা।', 'NGO Management &gt; Security &amp; Data &gt; Users &amp; Roles-এ ইউজার যোগ; <b>Select User</b>-এ নাম ও পাসওয়ার্ড দিয়ে প্রবেশ।', 'সব ভাউচার পরিবর্তন Edit Log-এ ইউজারের নামসহ থাকে।'],
 'অডিটর হিসেবে ঢুকে ভাউচার সেভ করতে গেলে বার্তা: <span class="mono">Your user role is not allowed to do this</span>।')
term('Tally Vault', 'ভল্ট', 'কোম্পানিতে পাসওয়ার্ড দেওয়া। Select Company-তে সেই কোম্পানি খুলতে পাসওয়ার্ড লাগে।', ['Security &amp; Data &gt; Set Vault Password; ফাঁকা দিলে সরে যায়।'], 'পাসওয়ার্ড ফাইলে সাধারণ লেখা হিসেবে থাকে — শুধু শেখার জন্য, আসল সুরক্ষা নয়।')

chapter('৭', 'Statutory: VAT ও TDS (সিমুলেটেড)')
warn('এই অংশ শেখার সরলীকরণ। প্রকৃত আইন ও হার বাংলাদেশের বর্তমান নিয়ম দেখে যাচাই করুন। এটি কর বা আইনি পরামর্শ নয়।')
term('VAT', 'মূল্য সংযোজন কর', 'বিক্রয়ে আদায় করা কর (Output) থেকে ক্রয়ে দেওয়া কর (Input) বাদ দিয়ে সরকারকে দেয় অংশ।',
 ['Ledger তৈরিতে Statutory tax type = VAT ও হার (যেমন 15)। Duties &amp; Taxes গ্রুপে রাখুন।', 'Sales/Purchase ভাউচারে VAT Ledger বাছলে অঙ্ক স্বয়ংক্রিয়: অন্য লাইনের যোগফল × হার।', 'Display &gt; Statutory Reports &gt; VAT Summary: Input (Dr) ও Output (Cr) আলাদা; <b>Net VAT payable = Output - Input</b>।'],
 'ফি Tk 100 + VAT 15% = Tk 115। Output VAT Tk 15। Input VAT Tk 4 থাকলে প্রদেয় Tk 11।')
jt('Sales with VAT', [('Tea Garden Community Group', '115', ''), ('Training Fee', '', '100'), ('VAT Output', '', '15')])
term('TDS', 'উৎসে কর', 'পরামর্শক বা ভাড়া ইত্যাদি পরিশোধের সময় আগেই কেটে রেখে সরকারকে জমা দেওয়া কর।',
 ['Ledger: Statutory tax type = TDS (যেমন <span class="mono">TDS Payable</span>, Duties &amp; Taxes)।', 'কাটার সময় Cr TDS Payable (Dr/Cr লেআউটে দিন, কারণ একক Payment-এ Particulars সবই Dr)।', 'জমার সময় Payment: Dr TDS Payable, Cr Bank (এটিই চালান/Challan)।', 'Display &gt; Statutory Reports &gt; TDS Payable &amp; Challans: কাটা, জমা, বাকি। জমা মেলানো হয় <b>পুরনো কাটা আগে (FIFO)</b>।', 'নিয়ম (এই অ্যাপে): কোনো মাসে কাটা কর পরের মাসের ১৫ তারিখের মধ্যে জমা; পার হলে Overdue।'],
 'পরামর্শক ফি Tk 30,000; TDS ১০% = Tk 3,000। Tk 27,000 পরামর্শককে, Tk 3,000 TDS Payable-এ।')
jt('পরামর্শক ফি (Journal)', [('Consultancy Fees', '30,000', ''), ('TDS Payable', '', '3,000'), ('Salary Payable', '', '27,000')])
