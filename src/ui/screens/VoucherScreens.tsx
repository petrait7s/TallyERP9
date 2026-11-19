import { useEffect } from 'react';
import { VoucherForm } from '../components/VoucherForm';
import type { KeyHandler } from '../keys';
import { useApp } from '../store';

export function VoucherScreen(props: { typeName: string; voucherId?: number; register: (h: KeyHandler | null) => void }) {
  const pop = useApp((s) => s.pop);
  useEffect(() => {
    props.register({ id: 'voucher', onKey: () => false });
    return () => props.register(null);
  }, []);
  return <VoucherForm typeName={props.typeName} voucherId={props.voucherId} onDone={pop} />;
}
