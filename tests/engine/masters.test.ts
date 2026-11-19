import { describe, expect, it } from 'vitest';
import {
  addVoucher, alterMaster, createCompany, createMaster, deleteMaster, getMaster, listMasters, toPaisa,
} from '../../src/engine';

const mk = () => createCompany('T', '2025-04-01', '2026-03-31');

describe('masters', () => {
  it('group under parent inherits nature; rename propagates', () => {
    const c = mk();
    createMaster(c, 'group', { name: 'Project Grants', parent: 'Direct Incomes', nature: 'asset' });
    expect(getMaster(c, 'group', 'Project Grants')!.nature).toBe('income');
    createMaster(c, 'ledger', { name: 'UNICEF', group: 'Project Grants', opening: 0 });
    alterMaster(c, 'group', 'Project Grants', { name: 'Grants 2', parent: 'Direct Incomes', nature: 'income' });
    expect(getMaster(c, 'ledger', 'UNICEF')!.group).toBe('Grants 2');
  });
  it('moving group under other primary updates nature; cycle blocked', () => {
    const c = mk();
    createMaster(c, 'group', { name: 'A', parent: 'Direct Incomes', nature: 'income' });
    createMaster(c, 'group', { name: 'B', parent: 'A', nature: 'income' });
    expect(() => alterMaster(c, 'group', 'A', { name: 'A', parent: 'B', nature: 'income' })).toThrow(/cycle/i);
    alterMaster(c, 'group', 'A', { name: 'A', parent: 'Fixed Assets', nature: 'income' });
    expect(getMaster(c, 'group', 'B')!.nature).toBe('asset');
  });
  it('ledger and group names clash; blank rejected; reserved protected', () => {
    const c = mk();
    expect(() => createMaster(c, 'ledger', { name: 'donations', group: 'Donations', opening: 0 })).toThrow(/already exists/);
    expect(() => createMaster(c, 'ledger', { name: ' ', group: 'Donations', opening: 0 })).toThrow(/blank/);
    expect(() => deleteMaster(c, 'group', 'Donations')).toThrow(/predefined/);
    expect(() => deleteMaster(c, 'ledger', 'Cash')).toThrow(/predefined/);
  });
  it('ledger rename updates vouchers; delete blocked when used', () => {
    const c = mk();
    createMaster(c, 'ledger', { name: 'Bank', group: 'Bank Accounts', opening: 0 });
    createMaster(c, 'ledger', { name: 'Don', group: 'Donations', opening: 0 });
    addVoucher(c, { type: 'Receipt', date: '2025-05-01', entries: [{ ledger: 'Bank', amount: 100 }, { ledger: 'Don', amount: -100 }] });
    alterMaster(c, 'ledger', 'Bank', { name: 'Islami Bank', group: 'Bank Accounts', opening: toPaisa(10) });
    expect(c.vouchers[0].entries[0].ledger).toBe('Islami Bank');
    expect(() => deleteMaster(c, 'ledger', 'Islami Bank')).toThrow(/used in vouchers/);
  });
  it('cost category/centre, currency, stock chain', () => {
    const c = mk();
    createMaster(c, 'costCategory', { name: 'Projects' });
    createMaster(c, 'costCentre', { name: 'WASH', category: 'Projects' });
    expect(() => deleteMaster(c, 'costCategory', 'Projects')).toThrow(/has cost centres/);
    createMaster(c, 'currency', { name: 'USD', symbol: '$', rate: 1220000 });
    createMaster(c, 'ledger', { name: 'Grant USD', group: 'Direct Incomes', opening: 0, currency: 'USD' });
    expect(() => deleteMaster(c, 'currency', 'USD')).toThrow(/used by ledgers/);
    expect(() => deleteMaster(c, 'currency', 'BDT')).toThrow(/predefined/);
    createMaster(c, 'unit', { name: 'Kg', decimals: 2 });
    createMaster(c, 'stockGroup', { name: 'Relief', parent: null });
    createMaster(c, 'stockItem', { name: 'Rice', group: 'Relief', unit: 'Kg', openingQty: 100, openingRate: 6000 });
    expect(() => createMaster(c, 'stockItem', { name: 'X', group: null, unit: 'Box', openingQty: 0, openingRate: 0 })).toThrow(/Unknown unit/);
    expect(() => deleteMaster(c, 'unit', 'Kg')).toThrow(/used by stock items/);
    alterMaster(c, 'unit', 'Kg', { name: 'KG', decimals: 2 });
    expect(getMaster(c, 'stockItem', 'Rice')!.unit).toBe('KG');
    createMaster(c, 'godown', { name: 'Jaflong Camp', parent: 'Main Location' });
    expect(() => deleteMaster(c, 'godown', 'Main Location')).toThrow(/predefined/);
    expect(listMasters(c, 'godown')).toContain('Jaflong Camp');
  });
  it('custom voucher type', () => {
    const c = mk();
    createMaster(c, 'voucherType', { name: 'Donation Receipt', kind: 'Receipt' });
    addVoucher(c, { type: 'Donation Receipt', date: '2025-05-01', entries: [{ ledger: 'Cash', amount: 5 }, { ledger: 'Profit & Loss A/c', amount: -5 }] });
    expect(() => deleteMaster(c, 'voucherType', 'Donation Receipt')).toThrow(/used/);
    expect(() => deleteMaster(c, 'voucherType', 'Payment')).toThrow(/predefined/);
  });
});
