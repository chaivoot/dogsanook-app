import { CheckDot } from './StatusPieces';

/** The three-status legend shown above the game list on /mommam. */
export default function Legend() {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="status-badge bg-brand-gold/15 text-brand-gold">
        <CheckDot tone="gold" /> สอนแล้ว = ครูสอน
      </span>
      <span className="status-badge bg-brand-gold/15 text-brand-gold">
        <CheckDot tone="gold" /> น้องทำได้แล้ว
      </span>
      <span className="status-badge bg-brand-blue/15 text-brand-blue">
        <CheckDot tone="blue" /> เจ้าของฝึกเอง
      </span>
    </div>
  );
}
