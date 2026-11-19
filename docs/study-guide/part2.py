from helpers import *

chapter('২', 'Tally-র ইন্টারফেস ও কিবোর্ড')
section('c2a', 'পর্দার অংশগুলো')
table(['অংশ', 'সংজ্ঞা ও কাজ'], [
 ['Top strip', 'উপরের পট্টি: অ্যাপের নাম (বামে) ও খোলা কোম্পানির নাম (ডানে)।'],
 ['Current Period / Date', 'বামের ছোট ঘর। Period = আর্থিক বছর (যেমন 1-Apr-2025 থেকে 31-Mar-2026)। Date = ভাউচারের ডিফল্ট তারিখ। বদলাতে <span class="mono">F2</span>।'],
 ['Gateway of Tally', 'মাঝের প্রধান মেনু। Enter দিয়ে ঢুকুন, Esc দিয়ে ফিরুন।'],
 ['Button bar', 'ডানের F-কী বোতাম (F1–F12 ও বর্তমান পর্দার বিশেষ কী)। কিবোর্ডে বা মাউস ক্লিকে চলে; ধূসর হলে এখানে কাজ করবে না।'],
 ['Status bar', 'নিচের পট্টি: অ্যাপ সংস্করণ, হলুদ রঙের (এখানে গাঢ়) বার্তা ও সময়। যেমন: <span class="mono">Receipt voucher 12 created</span>।'],
 ['Coach panel', 'বামে পাঠের নির্দেশনা। Tally-র চেহারা বদলায় না; <span class="mono">Ctrl+J</span> দিয়ে লুকানো যায়।'],
])
section('c2b', 'গেটওয়ের মেনু ক্রম')
ul(['<b>Masters:</b> Create, Alter, Display Masters', '<b>Transactions:</b> Accounting Vouchers, Inventory Vouchers', '<b>Utilities:</b> Banking', '<b>Reports:</b> Balance Sheet, Income &amp; Expenditure A/c, Receipts &amp; Payments A/c, Stock Summary, Ratio Analysis, Display', '<b>Learning:</b> Learning Centre', '<b>NGO Management:</b> Payroll, Funds &amp; Donors, Grants, ... (অধ্যায় ৮)', '<b>About, Quit</b>'])
note('F11-এ কোনো ফিচার বন্ধ করলে সংশ্লিষ্ট মেনু আইটেম (যেমন Inventory, Statutory) লুকিয়ে যায়।')
section('c2c', 'কিবোর্ড কী — সম্পূর্ণ তালিকা')
table(['কী', 'কাজ', 'কোথায়'], [
 ['<span class="k">Esc</span>', 'পেছনে যাওয়া / বাতিল', 'সব পর্দায়'],
 ['<span class="k">Enter</span>', 'বেছে নেওয়া / পরের ঘর / ড্রিল-ডাউন', 'সব পর্দায়'],
 ['<span class="k">Ctrl+A</span>', 'ফর্ম গ্রহণ (Accept)', 'মাস্টার, ভাউচার, ফর্ম'],
 ['<span class="k">Ctrl+Q</span>', 'পর্দা ত্যাগ (Abandon)', 'মাস্টার, ভাউচার'],
 ['<span class="k">Alt+C</span>', 'তালিকা থেকে বাছার সময় নতুন মাস্টার তৈরি (on the fly)', 'Under, Ledger বাছাই'],
 ['<span class="k">Alt+D</span>', 'মুছে ফেলা (শুধু Alteration মোডে)', 'মাস্টার, ভাউচার, রেজিস্টার'],
 ['<span class="k">Alt+X</span>', 'ভাউচার বাতিল (Cancel)', 'ভাউচার, Day Book'],
 ['<span class="k">Alt+2</span>', 'ভাউচার ডুপ্লিকেট', 'Day Book'],
 ['<span class="k">Alt+P</span>', 'প্রিন্ট প্রিভিউ (A4)', 'রিপোর্ট'],
 ['<span class="k">Alt+E</span>', 'CSV এক্সপোর্ট (প্রিভিউতে PDF সেভ)', 'রিপোর্ট'],
 ['<span class="k">Alt+F1</span>', 'Detailed / Condensed বদল', 'রিপোর্ট'],
 ['<span class="k">Alt+F5</span>', 'Horizontal / Vertical বদল', 'Balance Sheet, I&amp;E, R&amp;P'],
 ['<span class="k">F1</span>', 'কোম্পানি বাছাই (Select Cmp)', 'Gateway, মেনু'],
 ['<span class="k">F2</span>', 'তারিখ (Gateway) / সময়কাল (রিপোর্ট)', ''],
 ['<span class="k">F3</span> / <span class="k">Alt+F3</span>', 'Company Info মেনু', ''],
 ['<span class="k">F4</span> ... <span class="k">F9</span>', 'Contra, Payment, Receipt, Journal, Sales, Purchase', 'ভাউচার খোলা না থাকলে'],
 ['<span class="k">Ctrl+F8</span> / <span class="k">Ctrl+F9</span>', 'Credit Note / Debit Note', ''],
 ['<span class="k">F10</span>', 'অন্যান্য ভাউচার (Memorandum, Reversing Journal, কাস্টম টাইপ)', ''],
 ['<span class="k">F11</span> / <span class="k">F12</span>', 'Features / Configure (যেকোনো পর্দা থেকে)', ''],
 ['<span class="k">Ctrl+/</span>', 'শর্টকাট ও শব্দকোষ শিট', ''],
 ['<span class="k">Ctrl+=</span> <span class="k">Ctrl+-</span> <span class="k">Ctrl+0</span>', 'পর্দা বড়/ছোট/স্বাভাবিক', ''],
 ['Arrow, PgUp/PgDn, Home/End', 'তালিকায় চলাচল', ''],
 ['<span class="k">Space</span>', 'Yes/No ঘর বদল (F11/F12-এ)', ''],
 ['<span class="k">Backspace</span> / <span class="k">Up</span>', 'আগের ঘরে ফেরা', 'ফর্ম'],
])
section('c2d', 'তারিখ লেখার নিয়ম')
term('Tally Date Entry', 'তারিখ ইনপুট', 'তারিখ ঘরে সংক্ষেপে লিখলেই অ্যাপ পূর্ণ তারিখ বানিয়ে নেয়।',
 ['শুধু <span class="mono">15</span> লিখলে বর্তমান মাস-বছরের ১৫ তারিখ।', '<span class="mono">15-6</span> বা <span class="mono">15/6</span> লিখলে ১৫ জুন (বছর আর্থিক বছর থেকে নেয়)।', '<span class="mono">1-4-25</span> বা <span class="mono">1-Apr-2025</span> লিখলে পূর্ণ তারিখ।', 'আর্থিক বছরের বাইরের তারিখ দিলে বার্তা: <span class="mono">Date outside financial year</span>।'],
 'আর্থিক বছর 1-Apr-2025 থেকে 31-Mar-2026 হলে <span class="mono">15-2</span> লিখলে 15-Feb-2026 ধরবে (কারণ ফেব্রুয়ারি বছরের দ্বিতীয়ার্ধে)।')
section('c2e', 'তালিকা বাছাই ও Alt+C')
term('Selection List', 'তালিকা বাছাই', 'Ledger, Group ইত্যাদি বাছার সময় সার্চযোগ্য তালিকা খোলে।',
 ['অক্ষর টাইপ করলে তালিকা ছোট হয় (যে নাম টাইপ দিয়ে শুরু তা আগে আসে)।', 'Up/Down দিয়ে সরান, Enter দিয়ে বাছুন।', 'ভাউচারে Ledger তালিকার শুরুতে <span class="mono">End of List</span> থাকে — এটি বাছলে লাইন যোগ বন্ধ হয়।', 'তালিকায় না থাকলে <span class="mono">Alt+C</span> চেপে নতুন বানান; সেভ হলে সরাসরি বাছাই হয়ে যায়।'],
 'Payment ভাউচারে Particulars-এ <span class="mono">Zakat Exp</span> টাইপ করে <span class="mono">Alt+C</span> দিলে নতুন Ledger ফর্ম খোলে, নাম আগে থেকে বসানো থাকে।')

chapter('৩', 'Master (মূল তথ্য)')
p('Master হলো হিসাবের ভিত্তি-তথ্য: কোন কোন খাত (Ledger), তাদের দল (Group), কোন ভাউচার টাইপ, কোন প্রকল্প (Cost Centre) ইত্যাদি। ভাউচার লেখার আগে Master তৈরি থাকতে হয়। পথ: <span class="mono">Gateway &gt; Masters &gt; Create / Alter / Display Masters</span>।')
section('c3a', 'Create, Alter, Display, Delete কীভাবে কাজ করে')
ol(['<b>Create:</b> ফর্ম খোলে। ঘর ধরে Enter দিয়ে এগোন। শেষ ঘরে Enter বা <span class="mono">Ctrl+A</span> দিলে সেভ হয় এবং ফাঁকা ফর্ম আবার আসে (পরপর অনেকগুলো বানাতে)। <span class="mono">Esc</span> দিলে বের হওয়া।',
    '<b>Alter:</b> আগে তালিকা খোলে, Enter দিয়ে একটি বাছুন, ঘর বদলান, <span class="mono">Ctrl+A</span>। নাম বদলালে সব ভাউচারে নতুন নাম বসে যায়।',
    '<b>Display:</b> শুধু দেখা; বদলানো যায় না।',
    '<b>Delete:</b> Alter ফর্মে <span class="mono">Alt+D</span>, তারপর <span class="mono">Y</span>। কোনো ভাউচারে ব্যবহৃত Ledger, ভিতরে Ledger আছে এমন Group, বা পূর্বনির্ধারিত (যেমন Cash, Capital Account) মুছা যায় না।'])
warn('Ledger ও Group-এর নাম একই হতে পারে না (Tally-র নিয়ম)। এজন্য Payroll-এর ব্যয় Ledger-এর নাম <span class="mono">Salary Expense</span>, কারণ <span class="mono">Salaries</span> নামে Group আছে।')
section('c3b', 'Group (দল)')
term('Group', 'গ্রুপ', 'একই ধরনের Ledger-এর সমষ্টি। Group-এর উপর ভিত্তি করেই রিপোর্ট ও Balance Sheet সাজানো হয়।',
 ['<b>Name:</b> গ্রুপের নাম। <b>Under:</b> কোন গ্রুপের অধীনে (প্রাইমারি হলে <span class="mono">Primary</span>)।', 'Primary হলে <b>Nature</b> (asset, liability, income, expense) বাছতে হয়; Sub-group হলে অভিভাবকের প্রকৃতি নেয়।', 'অন্য প্রাইমারির অধীনে সরালে সব Sub-group-এর প্রকৃতি বদলে যায়। নিজের নিচের কোনো গ্রুপে সরানো যায় না (Group cycle)।'],
 '<span class="mono">Zakat Funds</span> নামে নতুন Group, Under = <span class="mono">Restricted Funds</span>। এখন এর অধীনে যে Ledger থাকবে তার ব্যালান্স Capital Account-এ Fund হিসেবে দেখাবে।')
p('<b>অ্যাপে আগে থেকে থাকা গুরুত্বপূর্ণ গ্রুপ:</b>')
table(['গ্রুপ', 'প্রকৃতি', 'কী থাকে'], [
 ['Capital Account (Corpus Fund, Capital Fund, Restricted Funds, Designated Funds, General Fund)', 'দায়/তহবিল', 'সব তহবিল'],
 ['Current Assets (Bank Accounts, Cash-in-hand, Sundry Debtors, Stock-in-hand, Deposits, Loans &amp; Advances)', 'সম্পদ', 'চলতি সম্পদ'],
 ['Fixed Assets, Investments', 'সম্পদ', 'স্থায়ী সম্পদ, FDR'],
 ['Current Liabilities (Duties &amp; Taxes, Provisions, Sundry Creditors)', 'দায়', 'চলতি দায়'],
 ['Direct Incomes (Grants Received, Donations, Membership Fees, Entrance Fees)', 'আয়', 'প্রকল্প/অনুদান আয়'],
 ['Indirect Incomes', 'আয়', 'সুদ, বিনিময় লাভ'],
 ['Direct Expenses (Programme Expenses)', 'ব্যয়', 'প্রকল্প ব্যয়'],
 ['Indirect Expenses (Admin Expenses, Salaries, Fundraising Expenses)', 'ব্যয়', 'প্রশাসনিক ব্যয়'],
])
section('c3c', 'Ledger (খতিয়ান)')
term('Ledger', 'লেজার/খাত', 'একটি নির্দিষ্ট খাতের সব লেনদেন যেখানে জমা হয়; প্রতিটি Ledger একটি Group-এর অধীনে।',
 ['<b>Name</b> ও <b>Under</b> (গ্রুপ) দিন।', '<b>Currency:</b> ডিফল্ট BDT (শুধু Multi-currency ফিচার চালু থাকলে দেখায়)।', '<b>Maintain balances bill-by-bill:</b> Yes দিলে বিল ধরে বাকি ট্র্যাক হয় (ঋণগ্রহীতা/পাওনাদারের জন্য)।', '<b>Cost centres are applicable:</b> Yes দিলে ভাউচারে প্রকল্প বরাদ্দ চাইবে।', '<b>Statutory tax type / rate:</b> VAT বা TDS ও হার (Statutory চালু থাকলে)।', '<b>Opening Balance:</b> এক ঘরে লিখুন, যেমন <span class="mono">85,000</span> বা <span class="mono">2,00,000 Cr</span>। পাশ না লিখলে গ্রুপের প্রকৃতি অনুযায়ী (সম্পদ/ব্যয় = Dr, বাকি = Cr)।'],
 '<span class="mono">Tea Garden Community Group</span> — Under: Sundry Debtors, bill-by-bill: Yes। এখন এর কাছে প্রতিটি পাওনা ইনভয়েস ধরে ধরে দেখা যাবে।')
note('শুরুর সব ব্যালান্সের যোগফল শূন্য না হলে Balance Sheet-এ <span class="mono">Difference in Opening Balances</span> লাইন আসে। SCDF-এ <b>Capital Fund</b> হলো সেই ভারসাম্য মেলানো অঙ্ক।')
section('c3d', 'Voucher Type, Cost Category/Centre, Currency')
term('Voucher Type', 'ভাউচার টাইপ', 'ভাউচারের ধরন। ১০টি আছে (Contra, Payment, Receipt, Journal, Sales, Purchase, Credit Note, Debit Note, Memorandum, Reversing Journal)। নিজের নামে নতুন টাইপও বানানো যায়, তবে একটি মূল ধরনের উপর ভিত্তি করে।',
 ['Name দিন (যেমন Donation Receipt) এবং <b>Type of voucher</b> বাছুন (যেমন Receipt)।', 'নতুন টাইপের নিজস্ব নম্বর ১ থেকে শুরু হয়।', 'ব্যবহৃত বা পূর্বনির্ধারিত টাইপ মুছা যায় না।'],
 'SCDF-এ <span class="mono">Donation Receipt</span> (Receipt-ভিত্তিক) ও <span class="mono">Fund Transfer</span> (Journal-ভিত্তিক) আছে। রিপোর্টে আলাদা করে চেনা যায়।')
term('Cost Category / Cost Centre', 'কস্ট ক্যাটাগরি / কস্ট সেন্টার', 'আয়-ব্যয়কে প্রকল্প, দাতা বা ক্যাম্পেইন অনুযায়ী ট্যাগ করার মাধ্যম। <b>Category</b> হলো বড় ছাতা, <b>Centre</b> তার ভিতরের নির্দিষ্ট ভাগ।',
 ['এই অ্যাপে: প্রতিটি প্রকল্প = একটি Cost Category; তার কার্যক্রম (Activity) = Cost Centre।', 'দাতা: Category <span class="mono">Donors</span>, প্রতিটি দাতা একটি Centre (<span class="mono">Donor: নাম</span>)।', 'ক্যাম্পেইন: Category <span class="mono">Campaigns</span>।', 'ভাউচারে Ledger-এ Cost centre Yes থাকলে টাকা কোন Centre-এ গেল তা ভাগ করতে হয়; ভাগের যোগফল = লাইনের অঙ্ক।'],
 'Category <span class="mono">WASH Jaflong</span>-এর Centre: <span class="mono">WASH: Tube-well Installation</span>, <span class="mono">WASH: Hygiene Training</span>। পাম্প কেনার ব্যয় প্রথম Centre-এ বরাদ্দ করলে প্রকল্পের হিসাবে সঠিক ব্যয় দেখা যায়।')
term('Currency', 'মুদ্রা', 'বিদেশি অনুদানের জন্য মুদ্রা মাস্টার। Base currency = BDT (হার 1)।',
 ['Name (USD), Symbol ($), Rate = ১ ইউনিটে কত টাকা (যেমন 122.5)।', 'Foreign receipt ভাউচার এই হারে টাকা হিসাব করে (অধ্যায় ৮)।'], 'USD ১,০০০ × ১২২ = Tk 1,22,000।')
section('c3e', 'ইনভেন্টরি Master')
table(['Master', 'সংজ্ঞা', 'উদাহরণ'], [
 ['Unit', 'পরিমাপের একক ও দশমিক স্থান', 'Nos (0), Kg (2), Box (0)'],
 ['Stock Group', 'পণ্যের দল', 'Relief Goods'],
 ['Stock Item', 'পণ্য: গ্রুপ, একক, শুরুর পরিমাণ ও দর', 'Blanket, Nos, 300 @ Tk 450'],
 ['Godown', 'গুদাম/স্থান; Main Location-এর অধীনে', 'Main Store, Jaflong Camp'],
])

chapter('৪', 'ভাউচার (লেনদেন এন্ট্রি)')
section('c4a', 'ভাউচারের কাঠামো')
term('Voucher', 'ভাউচার', 'একটি লেনদেনের রেকর্ড। প্রতিটি ভাউচারে: ধরন, নম্বর (প্রতি ধরনে ১ থেকে স্বয়ংক্রিয়), তারিখ, লাইনসমূহ (Ledger + অঙ্ক + Dr/Cr) ও Narration (ব্যাখ্যা)।',
 ['Gateway থেকে বা সরাসরি F-কী দিয়ে ভাউচার খুলুন।', 'ক্রমে: <b>তারিখ</b> &gt; <b>Account/Party</b> (একক এন্ট্রি হলে) &gt; <b>Particulars লাইন</b> (Ledger বাছুন, অঙ্ক লিখুন) &gt; <span class="mono">End of List</span> &gt; (Optional/Post-dated/Cheque) &gt; <b>Narration</b>।', '<span class="mono">Ctrl+A</span> বা Narration-এ Enter দিলে সেভ। সেভের পর ফাঁকা ভাউচার আসে, তারিখ একই থাকে।', 'Dr/Cr লেআউটে নতুন লাইনের পাশ ও অঙ্ক স্বয়ংক্রিয় বসে (ভারসাম্য মেলাতে)। পাশ বদলাতে <span class="mono">D</span>, <span class="mono">C</span> বা Space।'])
section('c4b', 'একক এন্ট্রি বনাম Dr/Cr লেআউট')
table(['লেআউট', 'কোন ভাউচারে', 'কীভাবে'], [
 ['Account + Particulars', 'Payment, Receipt, Sales, Purchase', 'উপরে একটি Account (ক্যাশ/ব্যাংক বা পার্টি)। নিচে বাকি Ledger-এর লাইন। Account-এর অঙ্ক নিজে যোগ হয়।'],
 ['Dr/Cr লাইন', 'Contra, Journal, Credit/Debit Note, Memorandum, Reversing Journal', 'প্রতি লাইনে Dr বা Cr বেছে Ledger ও অঙ্ক।'],
])
p('F12-এ <b>Single-entry layout</b> বন্ধ করলে Payment/Receipt/Sales/Purchase-ও Dr/Cr লেআউটে চলে (যেমন TDS কাটার ভাউচারের জন্য দরকার)।')
section('c4c', 'দশটি ভাউচার ধরন')
term('Contra', 'কন্ট্রা', 'ক্যাশ ও ব্যাংকের মধ্যে (বা ব্যাংক-ব্যাংক) টাকা সরানো।', ['শুধু Cash-in-hand ও Bank Accounts গ্রুপের Ledger বাছা যায়।', 'অন্য Ledger বাছলে বার্তা আসে: <span class="mono">Contra voucher allows only Cash/Bank ledgers</span>।'], 'ক্যাশ থেকে ব্যাংকে Tk 4,321 জমা।', 'F4')
jt('Contra (F4)', [('Islami Bank A/c', '4,321', ''), ('Cash', '', '4,321')], 'মাসের শেষে নগদ জমা')
term('Payment', 'পেমেন্ট', 'টাকা পরিশোধ। Cash/Bank-এ Cr, ব্যয় বা পাওনাদারে Dr।', ['Account = কোন ব্যাংক/ক্যাশ থেকে (ডিফল্ট Cash)।', 'Particulars-এ ব্যয় Ledger ও অঙ্ক। Cost centre থাকলে বরাদ্দ।', 'ব্যাংকের ক্ষেত্রে Cheque No. (F12-এ চালু থাকলে) দিন।'], 'অফিস ভাড়া Tk 18,000।', 'F5')
jt('Payment (F5)', [('Rent', '18,000', ''), ('Islami Bank A/c', '', '18,000')])
term('Receipt', 'রিসিপ্ট', 'টাকা পাওয়া। Cash/Bank-এ Dr, আয় বা ঋণগ্রহীতায় Cr।', ['Account = কোথায় টাকা ঢুকল।', 'Particulars-এ আয় Ledger ও অঙ্ক। দাতা ট্র্যাক করতে Cost centre = <span class="mono">Donor: নাম</span>।'], 'দাতা করিম সাহেবের নগদ অনুদান Tk 10,000।', 'F6')
jt('Receipt (F6)', [('Cash', '10,000', ''), ('Local Donations (Cost centre: Donor: Karim Ahmed)', '', '10,000')], 'অনুদান — করিম আহমেদ')
term('Journal', 'জার্নাল', 'নগদ ছাড়া সমন্বয় ও স্থানান্তর (অবচয়, বকেয়া ব্যয়, ফান্ড স্থানান্তর)।', ['Dr/Cr লাইন। প্রথম লাইন Dr, পরের লাইনে স্বয়ংক্রিয় Cr ও ভারসাম্য অঙ্ক।'], 'অডিট ফি Tk 60,000 বছরশেষে বকেয়া।', 'F7')
jt('Journal (F7)', [('Audit Fee', '60,000', ''), ('Outstanding Audit Fee', '', '60,000')], 'বছরশেষের অডিট ফি বকেয়া')
term('Sales', 'সেলস', 'পণ্য/সেবা বিক্রি বা ফি ইনভয়েস। Party-তে Dr, আয়ে Cr।', ['Party A/c name = ঋণগ্রহীতা (Sundry Debtors), অথবা ক্যাশ/ব্যাংক।', 'Party bill-by-bill হলে বিল বিবরণী চাইবে (New Ref)।'], 'প্রশিক্ষণ ফি ইনভয়েস।', 'F8')
jt('Sales (F8)', [('Sylhet Skills Centre', '20,000', ''), ('Training Fee', '', '20,000')], 'বিল রেফ: TF-1 (New Ref)')
term('Purchase', 'পারচেজ', 'বাকিতে বা নগদে কেনা। ব্যয়/সম্পদে Dr, পাওনাদারে Cr।', ['Party = পাওনাদার (Sundry Creditors)। বিল রেফ দিন।'], 'পাইপ কেনা বাকিতে।', 'F9')
jt('Purchase (F9)', [('Water Pumps (Cost centre: WASH: Pump Maintenance)', '8,000', ''), ('Jaflong Hardware', '', '8,000')], 'বিল রেফ: INV-5 (New Ref)')
term('Credit Note', 'ক্রেডিট নোট', 'বিক্রির পর ছাড়/ফেরত। ঋণগ্রহীতাকে Cr, আয়ে Dr।', None, 'প্রশিক্ষণ ফি Tk 2,000 কমিয়ে দেওয়া।', 'Ctrl+F8')
jt('Credit Note', [('Training Fee', '2,000', ''), ('Sylhet Skills Centre', '', '2,000')])
term('Debit Note', 'ডেবিট নোট', 'কেনার পর ফেরত/কমতি। পাওনাদারকে Dr, Purchase Returns-এ Cr।', None, 'ত্রুটিপূর্ণ মাল ফেরত Tk 1,200।', 'Ctrl+F9')
jt('Debit Note', [('Green Valley Medicals', '1,200', ''), ('Purchase Returns', '', '1,200')])
term('Memorandum', 'মেমোরেন্ডাম', 'শুধু স্মারক ভাউচার; হিসাবে <b>প্রভাব ফেলে না</b>। প্রতিশ্রুতি (Pledge) লিখে রাখতে ব্যবহার হয়।', ['Day Book-এ দেখা যায়, কিন্তু Trial Balance ও ব্যালান্সে ধরা হয় না।'], 'একজন দাতা Ramadan Appeal-এ Tk 30,000 দেবেন বলেছেন (এখনও টাকা আসেনি)।', 'F10 &gt; Memorandum')
term('Reversing Journal', 'রিভার্সিং জার্নাল', 'অস্থায়ী সমন্বয় যা পরের সময়ে উল্টে যাওয়ার কথা। এই অ্যাপে এটি হিসাবে ধরা হয় না; শুধু নির্ধারিত তারিখ (Reverse on) সহ রাখা থাকে।', None, '৩১ মার্চের বকেয়া ব্যয় ১ এপ্রিলে বাতিলের জন্য নথিভুক্ত।', 'F10 &gt; Reversing Journal')
section('c4d', 'Bill-wise বিবরণ (বিল ধরে বাকি)')
term('Bill-wise Details', 'বিলভিত্তিক হিসাব', 'কার কাছে কোন ইনভয়েসে কত পাওনা/দেনা তা আলাদাভাবে রাখা। শুধু bill-by-bill Yes থাকা Ledger-এ।',
 ['পরিমাণ দেওয়ার পর <b>Bill-wise Details</b> উইন্ডো আসে।', '<b>New Ref:</b> নতুন বিল তৈরি। রেফারেন্সের নাম দিন (যেমন INV-5)। একই নামে আরেকটি খোলা বিল থাকলে ভুল।', '<b>Agst Ref:</b> আগের বিলের বিপরীতে নিষ্পত্তি। তালিকা থেকে বিল বাছুন; বাকির বেশি অঙ্ক দেওয়া যাবে না।', '<b>Advance:</b> বিলের আগে লেনদেন (অগ্রিম)।', '<b>On Account:</b> কোনো বিলের সঙ্গে সংযুক্ত নয়। বিল না দিলে অ্যাপ নিজেই On Account ধরে।', 'অঙ্কের যোগফল = লাইনের অঙ্ক। প্রথম ফাঁকা লাইনে Enter বা Esc দিলে বরাদ্দ বাদ দেওয়া হয়।'],
 'Tea Garden Community Group-কে Tk 16,500 ইনভয়েস (New Ref: I2-INV)। পরে Tk 5,500 এলে Receipt-এ Agst Ref: I2-INV, অঙ্ক 5,500। বাকি থাকল Tk 11,000।')
jt('প্রথমে Sales (New Ref)', [('Tea Garden Community Group', '16,500', ''), ('Training Fee', '', '16,500')], 'Bill: I2-INV')
jt('পরে Receipt (Agst Ref)', [('Islami Bank A/c', '5,500', ''), ('Tea Garden Community Group', '', '5,500')], 'Agst Ref: I2-INV; Outstanding বাকি = 11,000')
section('c4e', 'Cost centre বরাদ্দ')
term('Cost Centre Allocation', 'কস্ট সেন্টার বরাদ্দ', 'একটি আয়/ব্যয় লাইনের অঙ্ককে এক বা একাধিক Centre-এ ভাগ করা।',
 ['Ledger-এ Cost centres applicable Yes থাকলে ও কোনো Cost centre থাকলে, অঙ্ক দেওয়ার পর উইন্ডো আসে।', 'Centre বাছুন; অঙ্ক স্বয়ংক্রিয় পুরোটা বসে। কম দিলে পরের লাইনে বাকিটা।', 'যোগফল = লাইনের অঙ্ক না হলে সেভ হবে না।', 'প্রথম ফাঁকা লাইনে Enter দিলে বাদ।'],
 ' Tk 30,000 প্রশিক্ষণ ব্যয়: Tk 18,000 <span class="mono">WASH: Hygiene Training</span> আর Tk 12,000 <span class="mono">EDU: Teacher Training</span>।')
section('c4f', 'Alter, Cancel, Delete, Duplicate')
table(['কাজ', 'কীভাবে', 'ফলাফল'], [
 ['Alter (সংশোধন)', 'Day Book &gt; ভাউচারে Enter &gt; বদলান &gt; <span class="mono">Ctrl+A</span>', 'পুরনো অঙ্ক নতুন অঙ্ক দিয়ে বদলে যায়; Edit Log-এ লেখা থাকে।'],
 ['Cancel (বাতিল)', 'ভাউচার খুলে <span class="mono">Alt+X</span> &gt; Y; বা Day Book-এ সরাসরি Alt+X', 'ভাউচার থাকে কিন্তু হিসাবে প্রভাব নেই; (Cancelled) লেখা দেখায়।'],
 ['Delete (মুছা)', 'ভাউচার খুলে <span class="mono">Alt+D</span> &gt; Y', 'ভাউচার চলে যায়; নম্বরে ফাঁক পড়ে (অডিটে ধরা পড়বে)।'],
 ['Duplicate', 'Day Book-এ বাছাই করে <span class="mono">Alt+2</span>', 'একই ভাউচারের নতুন কপি পরের নম্বরে।'],
])
warn('মুছার চেয়ে বাতিল (Cancel) ভালো অভ্যাস। কারণ মুছলে নম্বরে ফাঁক পড়ে এবং অডিটর প্রশ্ন তুলবেন।')
section('c4g', 'Optional, Post-dated, Cheque No.')
term('Optional / Post-dated / Cheque', 'অপশনাল / পোস্ট-ডেটেড / চেক নম্বর', 'F11 ও F12-এ চালু করলে ভাউচারে বাড়তি ঘর আসে।',
 ['<b>Optional (F11: Allow optional vouchers):</b> ভাউচার Day Book-এ থাকে, কিন্তু আসল হিসাবে ধরা হয় না। সম্ভাব্য পরিস্থিতি (Scenario) দেখতে কাজে লাগে।', '<b>Post-dated (F12):</b> ভবিষ্যৎ তারিখের চেক; তারিখ আসার আগে হিসাবে ধরা হয় না।', '<b>Cheque No. (F12):</b> Cheque Register ও Bank Reconciliation-এ কাজে লাগে।'],
 'দাতা ২৫ মার্চের তারিখে Tk 10,000 এর চেক দিলেন। Receipt-এ Post-dated = Yes, Cheque No. = PDC1।')
