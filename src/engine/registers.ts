import { AccountingError } from './company';
import { toPaisa, type Paisa } from './money';
import type { Company, Features, Row } from './types';

export interface RegField { key: string; label: string; type: 'text' | 'amount' | 'date' | 'int' | 'select'; options?: string[] }
export interface RegDef { id: string; title: string; module: string; feature?: keyof Features; fields: RegField[] }

/** "id,name,type:sel(A|B),amount:amt,due:date,qty:int" -> fields (default text). */
function fields(spec: string): RegField[] {
  return spec.split(',').map((tok) => {
    const [key, t = 'text'] = tok.split(/:(.+)/);
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (x) => x.toUpperCase());
    if (t.startsWith('sel(')) return { key, label, type: 'select' as const, options: t.slice(4, -1).split('|') };
    const type = t === 'amt' ? 'amount' : (t as 'text' | 'date' | 'int');
    return { key, label, type };
  });
}
const R = (id: string, title: string, module: string, spec: string, feature?: keyof Features): RegDef => ({ id, title, module, fields: fields(spec), feature });

export const REGISTERS: RegDef[] = [
  R('donors', 'Donor Master', 'Donors', 'id,name,type:sel(Individual|Corporate|Foreign|Anonymous),phone,address,taxId,mode:sel(Cash|Cheque|Bank|Mobile),recurring:sel(No|Monthly|Quarterly|Yearly),recAmount:amt,inKind:sel(No|Yes)'),
  R('grants', 'Grant Master', 'Grants', 'id,name,donor,project,amount:amt,currency,start:date,end:date,tranches,approvalRef,fd6,fd7,validTill:date,status:sel(Active|Closed|Refunded),incomeLedger,fundLedger,partner'),
  R('grantBudget', 'Grant Budget Lines', 'Grants', 'grant,line,ledger,budget:amt'),
  R('projects', 'Project Master', 'Projects', 'project,overheadPct:int,budget:amt,start:date,end:date,status:sel(Active|Closed)', 'costCentres'),
  R('budgets', 'Budgets', 'Budgets', 'scope:sel(Organisation|Project|Grant),key,ledger,annual:amt,revision:int,status:sel(Draft|Approved|Revised)', 'budgets'),
  R('employees', 'Employee Master', 'Payroll', 'id,name,designation,type:sel(Staff|Volunteer|Consultant),basic:amt,allowance:amt,pfPct:int,advance:amt,split,joined:date', 'payroll'),
  R('members', 'Member Master', 'Membership', 'id,name,category:sel(General|Life),joined:date,subscription:amt,paidUpto:date,phone'),
  R('beneficiaries', 'Beneficiary Register', 'Beneficiaries', 'id,name,village,camp,programme,project'),
  R('distributions', 'Distribution Register', 'Beneficiaries', 'id,date:date,camp,item,qty:int,beneficiaries:int,project'),
  R('assets', 'Fixed Asset Register', 'Assets', 'id,name,ledger,funding:sel(Own|Grant),grant,cost:amt,date:date,rate:int,method:sel(SLM|WDV),accDep:amt,status:sel(In use|Disposed|Missing),location,verified:sel(Yes|No)'),
  R('procurement', 'Procurement Register', 'Procurement', 'id,item,project,supplier,quotes,poNo,poQty:int,poAmount:amt,grnQty:int,invQty:int,invAmount:amt,status:sel(Requisition|Quoted|PO|GRN|Invoiced|Paid),approval:sel(Pending|Approved)'),
  R('pledges', 'Pledge Register', 'Fundraising', 'id,campaign,donor,amount:amt,due:date,received:amt'),
  R('fdrs', 'FDR Register', 'Treasury', 'id,bank,ledger,amount:amt,rate,start:date,maturity:date,fund,accruedTo:date'),
  R('partners', 'Sub-grantee Register', 'Sub-grants', 'id,name,grant,tranche:amt,utilised:amt,soeDue:date,status:sel(Active|Closed)'),
  R('imprest', 'Imprest Master', 'Petty Cash', 'id,office,ledger,limit:amt,custodian'),
  R('stockMoves', 'Stock Movements', 'Inventory', 'date:date,item,godown,qty:int,rate:amt,batch,type:sel(Receipt|Issue|Adjust)', 'inventory'),
  R('reorder', 'Reorder / Physical Stock', 'Inventory', 'item,level:int,physical:int', 'inventory'),
  R('priceLists', 'Price Lists', 'Inventory', 'item,list,rate:amt', 'inventory'),
  R('orders', 'Sales / Purchase Orders', 'Inventory', 'id,type:sel(Sales|Purchase),party,item,qty:int,pending:int,date:date', 'inventory'),
  R('bom', 'Bill of Materials / Job Work', 'Inventory', 'product,component,qty:int', 'inventory'),
  R('users', 'Users & Roles', 'Security', 'name,role:sel(Admin|Data Entry|Auditor),password'),
  R('voucherClasses', 'Voucher Classes', 'Masters', 'type,class,defaultLedger'),
  R('relatedParties', 'Related Party Register', 'Audit', 'name,relation,transaction,amount:amt'),
  R('bankConf', 'Bank Confirmation List', 'Audit', 'bank,account,balance:amt'),
];

export const regDef = (id: string): RegDef => {
  const d = REGISTERS.find((r) => r.id === id);
  if (!d) throw new AccountingError(`Unknown register: ${id}`);
  return d;
};

export const rows = (c: Company, id: string): Row[] => (c.registers[id] ??= []);

export function addRow(c: Company, id: string, row: Row): void {
  const d = regDef(id);
  for (const f of d.fields) {
    const v = row[f.key] ?? '';
    if (f.type === 'amount' && v && !/^-?[\d,]*\.?\d{0,2}$/.test(v)) throw new AccountingError(`${f.label}: invalid amount`);
    if (f.type === 'int' && v && !/^-?\d+$/.test(v)) throw new AccountingError(`${f.label}: whole number required`);
    if (f.type === 'date' && v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new AccountingError(`${f.label}: use yyyy-mm-dd`);
    if (f.type === 'select' && v && !f.options!.includes(v)) throw new AccountingError(`${f.label}: must be one of ${f.options!.join('/')}`);
  }
  const first = d.fields[0].key;
  if (!row[first]?.trim()) throw new AccountingError(`${d.fields[0].label} is required`);
  const list = rows(c, id);
  // the first field is the key for registers where it is an id/name
  if (['id', 'name', 'project', 'grant', 'item', 'type'].includes(first) && ['donors', 'grants', 'projects', 'employees', 'members', 'beneficiaries', 'assets', 'procurement', 'pledges', 'fdrs', 'partners', 'imprest', 'users'].includes(id)
    && list.some((r) => r[first] === row[first]))
    throw new AccountingError(`${row[first]} already exists in ${d.title}`);
  list.push({ ...row });
}

export function alterRow(c: Company, id: string, index: number, row: Row): void {
  const list = rows(c, id);
  if (!list[index]) throw new AccountingError('Row not found');
  const keep = list.splice(index, 1)[0];
  try { addRow(c, id, row); list.splice(index, 0, list.pop()!); } catch (e) { list.splice(index, 0, keep); throw e; }
}

export function deleteRow(c: Company, id: string, index: number): void {
  const list = rows(c, id);
  if (!list[index]) throw new AccountingError('Row not found');
  list.splice(index, 1);
}

/** number helpers for register data */
export const money = (row: Row, k: string): Paisa => (row[k]?.trim() ? toPaisa(row[k]) : 0);
export const whole = (row: Row, k: string): number => (row[k]?.trim() ? parseInt(row[k], 10) : 0);
export const fmtMoney = (p: Paisa): string => `${Math.floor(Math.abs(p) / 100)}.${String(Math.abs(p) % 100).padStart(2, '0')}`;
