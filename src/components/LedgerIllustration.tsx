export function LedgerIllustration() {
  return <div className="ledger-illustration" aria-hidden="true"><svg viewBox="0 0 104 104" fill="none">
    <circle cx="52" cy="52" r="50" className="illustration-bg" />
    <path d="M34 23h35a7 7 0 0 1 7 7v50H34a8 8 0 0 1-8-8V31a8 8 0 0 1 8-8Z" className="illustration-page" stroke="currentColor" strokeWidth="2"/>
    <path d="M36 24v48M27 72h48M47 38h18M47 48h13M47 58h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="75" cy="73" r="14" className="illustration-seal"/>
    <path d="m69 73 4 4 8-9" className="illustration-check" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg></div>;
}
